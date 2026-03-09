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
from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary
from src.modules.scripts.domain.exceptions import (
    ChunkingError,
    ScriptLibraryNotFoundException,
    ScriptNotFoundException,
)
from src.modules.scripts.domain.repositories import IScriptRepository
from src.modules.scripts.domain.value_objects.file_format import FileFormat
from src.modules.scripts.infrastructure.services.file_text_extractor import FileTextExtractor
from src.modules.scripts.infrastructure.services.script_chunker import ScriptSentenceWindowTextSplitter
from src.shared.domain.exceptions import ValidationException
from src.shared.extensions.storage.base import IStorageProvider


class ScriptAppService:
    def __init__(
        self,
        script_repository: IScriptRepository,
        storage_provider: IStorageProvider,
        file_text_extractor: FileTextExtractor,
        script_chunker: ScriptSentenceWindowTextSplitter,
    ):
        self._script_repository = script_repository
        self._storage_provider = storage_provider
        self._file_text_extractor = file_text_extractor
        self._script_chunker = script_chunker

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
        data = await file.read()
        if not data:
            raise ValidationException("File is empty")

        script_id = uuid.uuid4()
        object_name = self._build_object_name(library_id, script_id, file_format.extension)
        content_type = (
            file.content_type
            or mimetypes.guess_type(file.filename)[0]
            or "application/octet-stream"
        )

        await self._storage_provider.upload_bytes(
            object_name=object_name,
            data=data,
            content_type=content_type,
        )

        script = Script(
            id=script_id,
            library_id=library_id,
            original_name=file.filename,
            storage_path=object_name,
            file_extension=file_format.extension,
            content_type=content_type,
            file_size=len(data),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        try:
            saved_script = await self._script_repository.save_to_library(script, library_id)
        except Exception:
            await self._safe_delete_object(object_name)
            raise

        return ScriptUploadResponse.from_entity(saved_script)

    async def list_library_scripts(self, library_id: UUID) -> list[ScriptItemResponse]:
        await self._get_library_or_raise(library_id)
        scripts = await self._script_repository.list_all(library_id=library_id)
        return [ScriptItemResponse.from_entity(script) for script in scripts]

    async def get_script_text_content(self, library_id: UUID, script_id: UUID) -> ScriptContentResponse:
        await self._get_library_or_raise(library_id)
        script = await self._get_script_or_raise(script_id)
        if script.library_id != library_id:
            raise ScriptNotFoundException(str(script_id))
        if script.file_extension.lower() not in FileFormat.TEXT_EXTENSIONS:
            raise ValidationException("Only txt/md text files are supported by this endpoint")

        file_bytes = await self._storage_provider.get_object_bytes(script.storage_path)
        content_text = self._file_text_extractor.extract(
            file_bytes=file_bytes,
            file_extension=script.file_extension,
        )
        return ScriptContentResponse.from_entity(script, content_text)

    async def get_script_chunks(self, library_id: UUID, script_id: UUID) -> list[ScriptChunkResponse]:
        await self._get_library_or_raise(library_id)
        script = await self._get_script_or_raise(script_id)
        if script.library_id != library_id:
            raise ScriptNotFoundException(str(script_id))

        file_bytes = await self._storage_provider.get_object_bytes(script.storage_path)
        content_text = self._file_text_extractor.extract(
            file_bytes=file_bytes,
            file_extension=script.file_extension,
        )
        if not content_text:
            return []

        try:
            documents = self._script_chunker.create_documents_with_metadata(
                text=content_text,
                metadata={
                    "script_id": str(script.id),
                    "library_id": str(library_id),
                    "original_name": script.original_name,
                },
            )
        except Exception as exc:
            raise ChunkingError(detail=str(exc)) from exc

        return [
            ScriptChunkResponse(
                chunk_index=document.metadata["chunk_index"],
                content=document.page_content,
                start_index=document.metadata["start_index"],
                end_index=document.metadata["end_index"],
                chunk_size=document.metadata["chunk_size"],
            )
            for document in documents
        ]

    async def delete_script_from_library(self, library_id: UUID, script_id: UUID) -> ScriptDeleteResponse:
        await self._get_library_or_raise(library_id)
        script = await self._get_script_or_raise(script_id)
        if script.library_id != library_id:
            raise ScriptNotFoundException(str(script_id))

        await self._storage_provider.delete_object(script.storage_path)
        deleted = await self._script_repository.delete(script_id)
        if not deleted:
            raise ScriptNotFoundException(str(script_id))

        return ScriptDeleteResponse(message="Script deleted successfully")

    async def delete_library(self, library_id: UUID) -> ScriptLibraryDeleteResponse:
        await self._get_library_or_raise(library_id)
        scripts = await self._script_repository.list_all(library_id=library_id)

        for script in scripts:
            await self._storage_provider.delete_object(script.storage_path)

        deleted = await self._script_repository.delete_library(library_id)
        if not deleted:
            raise ScriptLibraryNotFoundException(str(library_id))

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

    async def _safe_delete_object(self, object_name: str) -> None:
        try:
            await self._storage_provider.delete_object(object_name)
        except Exception:
            return

    @staticmethod
    def _build_object_name(library_id: UUID, script_id: UUID, extension: str) -> str:
        return f"{library_id}/{script_id}.{extension}"
