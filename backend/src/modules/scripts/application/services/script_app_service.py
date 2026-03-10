import asyncio
import logging
import mimetypes
import uuid
from datetime import datetime
from uuid import UUID

from fastapi import UploadFile

from src.modules.scripts.application.dto.script_chunk_dto import ScriptChunkResponse
from src.modules.scripts.application.dto.script_dto import (
    CreateScriptLibraryRequest,
    ScriptContentResponse,
    ScriptDeleteResponse,
    ScriptItemResponse,
    ScriptLibraryDeleteResponse,
    ScriptLibraryDetailResponse,
    ScriptLibraryResponse,
    ScriptUploadResponse,
)
from src.modules.scripts.domain.entities.script_chunk_entity import ScriptChunk
from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary
from src.modules.scripts.domain.exceptions import (
    ChunkingError,
    ScriptLibraryNotFoundException,
    ScriptNotFoundException,
    StorageCleanupError,
    TextExtractError,
)
from src.modules.scripts.domain.repositories import IScriptChunkStore, IScriptRepository
from src.modules.scripts.domain.value_objects.file_format import FileFormat
from src.modules.scripts.infrastructure.services.file_text_extractor import FileTextExtractor
from src.modules.scripts.infrastructure.services.script_chunker import ScriptSentenceWindowTextSplitter
from src.shared.domain.exceptions import ValidationException
from src.shared.extensions.storage.base import IStorageProvider

logger = logging.getLogger(__name__)


class ScriptAppService:
    def __init__(
        self,
        script_repository: IScriptRepository,
        storage_provider: IStorageProvider,
        script_chunk_store: IScriptChunkStore,
        file_text_extractor: FileTextExtractor,
        script_chunker: ScriptSentenceWindowTextSplitter,
        upload_max_text_length: int,
    ):
        self._script_repository = script_repository
        self._storage_provider = storage_provider
        self._script_chunk_store = script_chunk_store
        self._file_text_extractor = file_text_extractor
        self._script_chunker = script_chunker
        self._upload_max_text_length = upload_max_text_length

    async def create_library(self, request: CreateScriptLibraryRequest) -> ScriptLibraryResponse:
        library_name = request.name.strip()
        if not library_name:
            raise ValidationException("Library name is required")

        description = request.description.strip() if request.description else None
        library = ScriptLibrary.create(
            name=library_name,
            description=description,
        )
        saved_library = await self._script_repository.create_library(library)
        return ScriptLibraryResponse.from_entity(saved_library)

    async def list_libraries(self) -> list[ScriptLibraryResponse]:
        libraries = await self._script_repository.list_libraries()
        return [ScriptLibraryResponse.from_entity(library) for library in libraries]

    async def get_library(self, library_id: UUID) -> ScriptLibraryDetailResponse:
        library = await self._get_library_or_raise(library_id)
        scripts = await self._script_repository.list_all(library_id=library_id)
        return ScriptLibraryDetailResponse(
            id=library.id,
            name=library.name,
            description=library.description,
            created_at=library.created_at,
            updated_at=library.updated_at,
            script_count=len(scripts),
        )

    async def upload_script(self, library_id: UUID, file: UploadFile) -> ScriptUploadResponse:
        await self._get_library_or_raise(library_id)

        if not file.filename:
            raise ValidationException("File name is required")

        file_format = FileFormat.from_filename(file.filename)
        file_size = self._get_upload_file_size(file)
        if file_size <= 0:
            raise ValidationException("File is empty")
        await self._validate_upload_text_length(file, file_format)

        script_id = uuid.uuid4()
        object_name = self._build_object_name(library_id, script_id, file_format.extension)
        content_type = (
            file.content_type
            or mimetypes.guess_type(file.filename)[0]
            or "application/octet-stream"
        )

        file.file.seek(0)
        await self._storage_provider.upload_file(
            object_name=object_name,
            data_stream=file.file,
            data_size=file_size,
            content_type=content_type,
        )

        script = Script(
            id=script_id,
            library_id=library_id,
            original_name=file.filename,
            storage_path=object_name,
            file_extension=file_format.extension,
            content_type=content_type,
            file_size=file_size,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        try:
            saved_script = await self._script_repository.save_to_library(script, library_id)
        except Exception:
            await self._delete_objects_with_retry([object_name], raise_on_failure=False)
            raise

        return ScriptUploadResponse.from_entity(saved_script)

    async def list_library_scripts(self, library_id: UUID) -> list[ScriptItemResponse]:
        await self._get_library_or_raise(library_id)
        scripts = await self._script_repository.list_all(library_id=library_id)
        chunk_counts: dict[UUID, int] = {}
        for script in scripts:
            chunk_counts[script.id] = len(await self._script_repository.list_chunks(script.id, library_id))

        return [
            ScriptItemResponse.from_entity(script, chunk_count=chunk_counts.get(script.id, 0))
            for script in scripts
        ]

    async def get_script_text_content(self, library_id: UUID, script_id: UUID) -> ScriptContentResponse:
        await self._get_library_or_raise(library_id)
        script = await self._get_script_in_library_or_raise(library_id, script_id)
        if script.file_extension.lower() not in FileFormat.TEXT_EXTENSIONS:
            raise ValidationException("Only txt/md text files are supported by this endpoint")

        async with self._storage_provider.open_object(script.storage_path) as file_stream:
            content_text = await asyncio.to_thread(
                self._file_text_extractor.extract_from_stream,
                file_stream,
                script.file_extension,
            )
        return ScriptContentResponse.from_entity(script, content_text)

    async def get_script_chunks(self, library_id: UUID, script_id: UUID) -> list[ScriptChunkResponse]:
        await self._get_library_or_raise(library_id)
        script = await self._get_script_in_library_or_raise(library_id, script_id)

        cached_chunks = await self._script_repository.list_chunks(
            script_id=script.id,
            library_id=library_id,
        )
        if cached_chunks:
            try:
                hydrated_chunks = await self._script_chunk_store.get_chunks(cached_chunks)
                return self._to_chunk_responses(hydrated_chunks)
            except Exception as exc:
                logger.warning(
                    "Failed to load chunk documents from Elasticsearch, rebuilding: script_id=%s library_id=%s error=%s",
                    script.id,
                    library_id,
                    exc,
                )

        return await self._execute_script_chunks(script, library_id)

    async def _validate_upload_text_length(self, file: UploadFile, file_format: FileFormat) -> None:
        file.file.seek(0)
        try:
            try:
                extracted_text = await asyncio.to_thread(
                    self._file_text_extractor.extract_from_stream,
                    file.file,
                    file_format.extension,
                )
            except TextExtractError:
                if not file_format.is_text:
                    return
                raise
        finally:
            file.file.seek(0)

        if len(extracted_text) > self._upload_max_text_length:
            raise ValidationException(
                "File text exceeds limit",
                detail=f"Each file must contain at most {self._upload_max_text_length} characters of text",
            )

    async def execute_script_chunks(self, library_id: UUID, script_id: UUID) -> list[ScriptChunkResponse]:
        await self._get_library_or_raise(library_id)
        script = await self._get_script_in_library_or_raise(library_id, script_id)
        return await self._execute_script_chunks(script, library_id)

    async def _execute_script_chunks(
        self,
        script: Script,
        library_id: UUID,
    ) -> list[ScriptChunkResponse]:
        existing_chunk_refs = await self._script_repository.list_chunks(
            script_id=script.id,
            library_id=library_id,
        )
        try:
            metadata = {
                "script_id": str(script.id),
                "library_id": str(library_id),
                "original_name": script.original_name,
            }
            async with self._storage_provider.open_object(script.storage_path) as file_stream:
                documents = await asyncio.to_thread(
                    self._create_chunk_documents_from_stream,
                    file_stream,
                    script.file_extension,
                    metadata,
                )
        except ChunkingError:
            raise
        except Exception as exc:
            raise ChunkingError(detail=str(exc)) from exc

        chunks = self._to_script_chunks(
            documents=documents,
            script_id=script.id,
            library_id=library_id,
        )
        try:
            await self._script_chunk_store.index_chunks(chunks)
        except Exception as exc:
            raise ChunkingError(detail=str(exc)) from exc

        try:
            await self._script_repository.replace_chunks(
                script_id=script.id,
                library_id=library_id,
                chunks=chunks,
            )
        except Exception:
            await self._delete_chunk_documents_with_retry(
                chunk_ids=[chunk.id for chunk in chunks],
                raise_on_failure=False,
            )
            raise
        if existing_chunk_refs:
            await self._delete_chunk_documents_with_retry(
                chunk_ids=[chunk.id for chunk in existing_chunk_refs],
                raise_on_failure=False,
            )
        return self._to_chunk_responses(chunks)

    async def delete_script_from_library(self, library_id: UUID, script_id: UUID) -> ScriptDeleteResponse:
        await self._get_library_or_raise(library_id)
        script = await self._get_script_in_library_or_raise(library_id, script_id)
        chunk_refs = await self._script_repository.list_chunks(script.id, library_id)

        deleted = await self._script_repository.delete(script_id)
        if not deleted:
            raise ScriptNotFoundException(str(script_id))
        failed_chunk_ids = await self._delete_chunk_documents_with_retry(
            [chunk.id for chunk in chunk_refs],
            raise_on_failure=False,
        )
        failed_objects = await self._delete_objects_with_retry([script.storage_path], raise_on_failure=False)
        if failed_chunk_ids or failed_objects:
            details: list[str] = []
            if failed_chunk_ids:
                details.append(
                    "failed to delete Elasticsearch chunk document(s): "
                    f"{self._preview_identifiers(failed_chunk_ids)}"
                )
            if failed_objects:
                details.append(f"failed to delete storage object: {failed_objects[0]}")
            raise StorageCleanupError(
                detail="Script record has been deleted from database, but " + "; ".join(details)
            )

        return ScriptDeleteResponse(message="Script deleted successfully")

    async def delete_library(self, library_id: UUID) -> ScriptLibraryDeleteResponse:
        await self._get_library_or_raise(library_id)
        scripts = await self._script_repository.list_all(library_id=library_id)
        chunk_refs: list[ScriptChunk] = []
        for script in scripts:
            chunk_refs.extend(await self._script_repository.list_chunks(script.id, library_id))

        deleted = await self._script_repository.delete_library(library_id)
        if not deleted:
            raise ScriptLibraryNotFoundException(str(library_id))

        failed_chunk_ids = await self._delete_chunk_documents_with_retry(
            [chunk.id for chunk in chunk_refs],
            raise_on_failure=False,
        )
        failed_objects = await self._delete_objects_with_retry(
            [script.storage_path for script in scripts],
            raise_on_failure=False,
        )
        if failed_chunk_ids or failed_objects:
            details: list[str] = []
            if failed_chunk_ids:
                details.append(
                    "failed to delete Elasticsearch chunk document(s): "
                    f"{self._preview_identifiers(failed_chunk_ids)}"
                )
            if failed_objects:
                preview = ", ".join(failed_objects[:5])
                suffix = "..." if len(failed_objects) > 5 else ""
                details.append(
                    f"failed to delete {len(failed_objects)} storage object(s): {preview}{suffix}"
                )
            raise StorageCleanupError(
                detail="Script library record has been deleted from database, but " + "; ".join(details)
            )

        return ScriptLibraryDeleteResponse(
            message="Script library deleted successfully",
            deleted_script_count=len(scripts),
        )

    async def _get_library_or_raise(self, library_id: UUID) -> ScriptLibrary:
        library = await self._script_repository.find_library_by_id(library_id)
        if not library:
            raise ScriptLibraryNotFoundException(str(library_id))
        return library

    async def _get_script_or_raise(self, script_id: UUID) -> Script:
        script = await self._script_repository.find_by_id(script_id)
        if not script:
            raise ScriptNotFoundException(str(script_id))
        return script

    async def _get_script_in_library_or_raise(self, library_id: UUID, script_id: UUID) -> Script:
        script = await self._get_script_or_raise(script_id)
        if script.library_id != library_id:
            raise ScriptNotFoundException(str(script_id))
        return script

    async def _delete_objects_with_retry(
        self,
        object_names: list[str],
        raise_on_failure: bool = True,
        max_retries: int = 3,
    ) -> list[str]:
        failed_objects: list[str] = []
        for object_name in object_names:
            deleted = await self._delete_object_with_retry(
                object_name=object_name,
                max_retries=max_retries,
            )
            if not deleted:
                failed_objects.append(object_name)

        if failed_objects and raise_on_failure:
            raise StorageCleanupError(
                detail=(
                    f"Failed to delete {len(failed_objects)} storage object(s): "
                    f"{self._preview_identifiers(failed_objects)}"
                )
            )

        return failed_objects

    async def _delete_object_with_retry(self, object_name: str, max_retries: int = 3) -> bool:
        for attempt in range(1, max_retries + 1):
            try:
                await self._storage_provider.delete_object(object_name)
                return True
            except Exception as exc:
                logger.warning(
                    "Failed to delete object '%s' on attempt %s/%s: %s",
                    object_name,
                    attempt,
                    max_retries,
                    exc,
                )
                if attempt < max_retries:
                    await asyncio.sleep(0.2 * attempt)
        return False

    async def _delete_chunk_documents_with_retry(
        self,
        chunk_ids: list[UUID],
        raise_on_failure: bool = True,
        max_retries: int = 3,
    ) -> list[str]:
        failed_chunk_ids: list[str] = []
        for chunk_id in chunk_ids:
            deleted = await self._delete_chunk_document_with_retry(
                chunk_id=chunk_id,
                max_retries=max_retries,
            )
            if not deleted:
                failed_chunk_ids.append(str(chunk_id))

        if failed_chunk_ids and raise_on_failure:
            raise StorageCleanupError(
                detail=(
                    f"Failed to delete {len(failed_chunk_ids)} Elasticsearch chunk document(s): "
                    f"{self._preview_identifiers(failed_chunk_ids)}"
                )
            )

        return failed_chunk_ids

    async def _delete_chunk_document_with_retry(self, chunk_id: UUID, max_retries: int = 3) -> bool:
        for attempt in range(1, max_retries + 1):
            try:
                await self._script_chunk_store.delete_chunks([chunk_id])
                return True
            except Exception as exc:
                logger.warning(
                    "Failed to delete Elasticsearch chunk document '%s' on attempt %s/%s: %s",
                    chunk_id,
                    attempt,
                    max_retries,
                    exc,
                )
                if attempt < max_retries:
                    await asyncio.sleep(0.2 * attempt)
        return False

    def _create_chunk_documents_from_stream(
        self,
        file_stream,
        file_extension: str,
        metadata: dict[str, str],
    ):
        text_segments = self._file_text_extractor.iter_text_segments_from_stream(
            file_stream=file_stream,
            file_extension=file_extension,
        )
        return self._script_chunker.create_documents_from_text_segments(
            text_segments=text_segments,
            metadata=metadata,
        )

    @staticmethod
    def _to_script_chunks(
        documents,
        script_id: UUID,
        library_id: UUID,
    ) -> list[ScriptChunk]:
        chunks: list[ScriptChunk] = []
        for document in documents:
            content = document.page_content
            metadata = document.metadata or {}
            chunk_index = int(metadata.get("chunk_index", len(chunks)))
            start_index = int(metadata.get("start_index", 0))
            end_index = int(metadata.get("end_index", start_index + len(content)))
            chunks.append(
                ScriptChunk.create(
                    script_id=script_id,
                    library_id=library_id,
                    index_id=chunk_index,
                    content=content,
                    start_index=start_index,
                    end_index=end_index,
                )
            )
        return chunks

    @staticmethod
    def _to_chunk_responses(chunks: list[ScriptChunk]) -> list[ScriptChunkResponse]:
        return [
            ScriptChunkResponse(
                chunk_index=chunk.index_id,
                content=chunk.content,
                start_index=chunk.start_index,
                end_index=chunk.end_index,
                chunk_size=chunk.chunk_size,
            )
            for chunk in sorted(chunks, key=lambda item: item.index_id)
        ]

    @staticmethod
    def _get_upload_file_size(file: UploadFile) -> int:
        try:
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
            return file_size
        except Exception as exc:
            raise ValidationException("Unable to determine upload file size") from exc

    @staticmethod
    def _build_object_name(library_id: UUID, script_id: UUID, extension: str) -> str:
        return f"{library_id}/{script_id}.{extension}"

    @staticmethod
    def _preview_identifiers(items: list[str]) -> str:
        preview = ", ".join(items[:5])
        suffix = "..." if len(items) > 5 else ""
        return f"{preview}{suffix}"
