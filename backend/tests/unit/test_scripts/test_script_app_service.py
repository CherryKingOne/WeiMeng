import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from io import BytesIO
from typing import BinaryIO
from uuid import UUID

import pytest
from starlette.datastructures import UploadFile

from src.modules.scripts.application.dto.script_dto import CreateScriptLibraryRequest
from src.modules.scripts.application.services.script_app_service import ScriptAppService
from src.modules.scripts.domain.entities.script_chunk_entity import ScriptChunk
from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary
from src.modules.scripts.domain.exceptions import (
    StorageCleanupError,
    ScriptLibraryNotFoundException,
    ScriptNotFoundException,
)
from src.modules.scripts.infrastructure.services.file_text_extractor import FileTextExtractor
from src.modules.scripts.infrastructure.services.script_chunker import ScriptSentenceWindowTextSplitter
from src.shared.domain.exceptions import ValidationException


class FakeScriptRepository:
    def __init__(self):
        self._libraries: dict[UUID, ScriptLibrary] = {}
        self._scripts: dict[UUID, Script] = {}
        self._chunks: dict[tuple[UUID, UUID], list[ScriptChunk]] = {}

    async def create_library(self, library: ScriptLibrary) -> ScriptLibrary:
        self._libraries[library.id] = library
        return library

    async def find_library_by_id(self, library_id: UUID) -> ScriptLibrary | None:
        return self._libraries.get(library_id)

    async def list_libraries(self) -> list[ScriptLibrary]:
        return sorted(self._libraries.values(), key=lambda item: item.created_at, reverse=True)

    async def delete_library(self, library_id: UUID) -> bool:
        library = self._libraries.pop(library_id, None)
        if library is None:
            return False

        script_ids = [script.id for script in self._scripts.values() if script.library_id == library_id]
        for script_id in script_ids:
            self._scripts.pop(script_id, None)
            self._chunks.pop((script_id, library_id), None)
        return True

    async def save_to_library(self, script: Script, library_id: UUID) -> Script:
        script.library_id = library_id
        self._scripts[script.id] = script
        return script

    async def list_all(self, library_id: UUID | None = None) -> list[Script]:
        scripts = list(self._scripts.values())
        if library_id is not None:
            scripts = [script for script in scripts if script.library_id == library_id]
        return sorted(scripts, key=lambda item: item.created_at, reverse=True)

    async def find_by_id(self, script_id: UUID) -> Script | None:
        return self._scripts.get(script_id)

    async def delete(self, script_id: UUID) -> bool:
        script = self._scripts.pop(script_id, None)
        if script is None:
            return False
        if script.library_id is not None:
            self._chunks.pop((script_id, script.library_id), None)
        return True

    async def list_chunks(self, script_id: UUID, library_id: UUID) -> list[ScriptChunk]:
        return list(self._chunks.get((script_id, library_id), []))

    async def replace_chunks(
        self,
        script_id: UUID,
        library_id: UUID,
        chunks: list[ScriptChunk],
    ) -> None:
        chunk_refs = [
            ScriptChunk(
                id=chunk.id,
                script_id=chunk.script_id,
                library_id=chunk.library_id,
                index_id=chunk.index_id,
                created_at=chunk.created_at,
                updated_at=chunk.updated_at,
            )
            for chunk in chunks
        ]
        self._chunks[(script_id, library_id)] = chunk_refs


class FailingReplaceChunkRepository(FakeScriptRepository):
    async def replace_chunks(
        self,
        script_id: UUID,
        library_id: UUID,
        chunks: list[ScriptChunk],
    ) -> None:
        raise RuntimeError("replace chunk refs failed")


class FakeChunkStore:
    def __init__(self):
        self._documents: dict[UUID, ScriptChunk] = {}
        self.deleted_chunk_ids: list[UUID] = []
        self.fail_on_delete: set[UUID] = set()

    async def index_chunks(self, chunks: list[ScriptChunk]) -> None:
        for chunk in chunks:
            self._documents[chunk.id] = ScriptChunk(
                id=chunk.id,
                script_id=chunk.script_id,
                library_id=chunk.library_id,
                index_id=chunk.index_id,
                content=chunk.content,
                chunk_size=chunk.chunk_size,
                start_index=chunk.start_index,
                end_index=chunk.end_index,
                created_at=chunk.created_at,
                updated_at=chunk.updated_at,
            )

    async def get_chunks(self, chunk_refs: list[ScriptChunk]) -> list[ScriptChunk]:
        chunks: list[ScriptChunk] = []
        for chunk_ref in sorted(chunk_refs, key=lambda item: item.index_id):
            chunk = self._documents.get(chunk_ref.id)
            if chunk is None:
                raise RuntimeError(f"Missing chunk document: {chunk_ref.id}")
            chunks.append(chunk)
        return chunks

    async def delete_chunks(self, chunk_ids: list[UUID]) -> None:
        failures: list[UUID] = []
        for chunk_id in chunk_ids:
            if chunk_id in self.fail_on_delete:
                failures.append(chunk_id)
                continue
            self._documents.pop(chunk_id, None)
            self.deleted_chunk_ids.append(chunk_id)
        if failures:
            raise RuntimeError(f"Failed to delete chunk documents: {failures}")


class FakeStorageProvider:
    def __init__(self):
        self._objects: dict[str, bytes] = {}
        self.deleted_objects: list[str] = []
        self.fail_on_delete: set[str] = set()

    async def upload_file(
        self,
        object_name: str,
        data_stream: BinaryIO,
        data_size: int,
        content_type: str | None = None,
    ) -> str:
        data = data_stream.read(data_size)
        if isinstance(data, str):
            data = data.encode("utf-8")
        elif isinstance(data, bytearray):
            data = bytes(data)
        self._objects[object_name] = data
        return object_name

    async def upload_bytes(self, object_name: str, data: bytes, content_type: str | None = None) -> str:
        return await self.upload_file(
            object_name=object_name,
            data_stream=BytesIO(data),
            data_size=len(data),
            content_type=content_type,
        )

    @asynccontextmanager
    async def open_object(self, object_name: str) -> AsyncIterator[BinaryIO]:
        yield BytesIO(self._objects[object_name])

    async def get_object_bytes(self, object_name: str) -> bytes:
        return self._objects[object_name]

    async def delete_object(self, object_name: str) -> None:
        if object_name in self.fail_on_delete:
            raise RuntimeError("storage deletion failed")
        self._objects.pop(object_name, None)
        self.deleted_objects.append(object_name)


def _create_service(
    repository: FakeScriptRepository | None = None,
    storage: FakeStorageProvider | None = None,
    chunk_store: FakeChunkStore | None = None,
) -> ScriptAppService:
    return ScriptAppService(
        script_repository=repository or FakeScriptRepository(),
        storage_provider=storage or FakeStorageProvider(),
        script_chunk_store=chunk_store or FakeChunkStore(),
        file_text_extractor=FileTextExtractor(),
        script_chunker=ScriptSentenceWindowTextSplitter(chunk_size=1200, chunk_overlap=200),
    )


async def _prepare_library_with_script(service: ScriptAppService, filename: str, data: bytes) -> tuple[UUID, UUID, str]:
    library = await service.create_library(CreateScriptLibraryRequest(name="测试库", description=None))
    upload_file = UploadFile(file=BytesIO(data), filename=filename)
    uploaded = await service.upload_script(library.id, upload_file)
    return library.id, uploaded.id, uploaded.original_name


async def _test_script_app_service_create_library():
    service = _create_service()

    result = await service.create_library(
        CreateScriptLibraryRequest(name="武侠合集", description="测试剧本库"),
    )

    assert result.id is not None
    assert result.name == "武侠合集"
    assert result.description == "测试剧本库"


def test_script_app_service_create_library():
    asyncio.run(_test_script_app_service_create_library())


async def _test_script_app_service_list_and_get_library():
    service = _create_service()

    library = await service.create_library(
        CreateScriptLibraryRequest(name="仙侠", description="库详情"),
    )
    libraries = await service.list_libraries()

    assert len(libraries) == 1
    assert libraries[0].id == library.id

    library_detail = await service.get_library(library.id)
    assert library_detail.id == library.id
    assert library_detail.script_count == 0


def test_script_app_service_list_and_get_library():
    asyncio.run(_test_script_app_service_list_and_get_library())


async def _test_script_app_service_upload_requires_library():
    service = _create_service()

    upload_file = UploadFile(file=BytesIO("你好，剧本".encode("utf-8")), filename="demo.txt")
    with pytest.raises(ScriptLibraryNotFoundException):
        await service.upload_script(UUID("00000000-0000-0000-0000-000000000001"), upload_file)


def test_script_app_service_upload_requires_library():
    asyncio.run(_test_script_app_service_upload_requires_library())


async def _test_script_app_service_upload_list_and_read_text_content():
    repository = FakeScriptRepository()
    service = _create_service(repository=repository)

    library = await service.create_library(CreateScriptLibraryRequest(name="仙侠", description=None))
    upload_file = UploadFile(file=BytesIO("你好，剧本".encode("utf-8")), filename="demo.txt")
    upload_result = await service.upload_script(library.id, upload_file)

    assert upload_result.file_extension == "txt"
    assert upload_result.file_size > 0
    assert upload_result.library_id == library.id

    library_detail = await service.get_library(library.id)
    assert library_detail.script_count == 1

    library_scripts = await service.list_library_scripts(library.id)
    assert len(library_scripts) == 1
    assert library_scripts[0].id == upload_result.id


def test_script_app_service_upload_list_and_read_text_content():
    asyncio.run(_test_script_app_service_upload_list_and_read_text_content())


async def _test_script_app_service_list_library_scripts_requires_library():
    service = _create_service()
    with pytest.raises(ScriptLibraryNotFoundException):
        await service.list_library_scripts(UUID("00000000-0000-0000-0000-000000000001"))


def test_script_app_service_list_library_scripts_requires_library():
    asyncio.run(_test_script_app_service_list_library_scripts_requires_library())


async def _test_script_app_service_delete_script_from_library():
    storage = FakeStorageProvider()
    chunk_store = FakeChunkStore()
    service = _create_service(storage=storage, chunk_store=chunk_store)

    library_id, script_id, _ = await _prepare_library_with_script(
        service,
        filename="demo.txt",
        data="删除测试".encode("utf-8"),
    )
    chunks = await service.get_script_chunks(library_id, script_id)

    result = await service.delete_script_from_library(library_id, script_id)
    assert result.message == "Script deleted successfully"
    assert len(storage.deleted_objects) == 1
    assert len(chunk_store.deleted_chunk_ids) == len(chunks)


def test_script_app_service_delete_script_from_library():
    asyncio.run(_test_script_app_service_delete_script_from_library())


async def _test_script_app_service_delete_script_from_library_keeps_db_consistent_on_storage_failure():
    storage = FakeStorageProvider()
    chunk_store = FakeChunkStore()
    service = _create_service(storage=storage, chunk_store=chunk_store)

    library_id, script_id, _ = await _prepare_library_with_script(
        service,
        filename="demo.txt",
        data="删除测试".encode("utf-8"),
    )
    await service.get_script_chunks(library_id, script_id)
    object_name = next(iter(storage._objects.keys()))
    storage.fail_on_delete.add(object_name)

    with pytest.raises(StorageCleanupError):
        await service.delete_script_from_library(library_id, script_id)
    assert await service.list_library_scripts(library_id) == []


def test_script_app_service_delete_script_from_library_keeps_db_consistent_on_storage_failure():
    asyncio.run(_test_script_app_service_delete_script_from_library_keeps_db_consistent_on_storage_failure())


async def _test_script_app_service_delete_library_with_scripts():
    storage = FakeStorageProvider()
    chunk_store = FakeChunkStore()
    service = _create_service(storage=storage, chunk_store=chunk_store)

    library = await service.create_library(CreateScriptLibraryRequest(name="可删除剧本库", description=None))
    for index in range(2):
        upload_file = UploadFile(
            file=BytesIO(f"内容{index}".encode("utf-8")),
            filename=f"demo{index}.txt",
        )
        uploaded = await service.upload_script(library.id, upload_file)
        await service.get_script_chunks(library.id, uploaded.id)

    result = await service.delete_library(library.id)
    assert result.message == "Script library deleted successfully"
    assert result.deleted_script_count == 2
    assert len(storage.deleted_objects) == 2
    assert len(chunk_store.deleted_chunk_ids) > 0

    with pytest.raises(ScriptLibraryNotFoundException):
        await service.get_library(library.id)


def test_script_app_service_delete_library_with_scripts():
    asyncio.run(_test_script_app_service_delete_library_with_scripts())


async def _test_script_app_service_delete_library_keeps_db_consistent_on_storage_failure():
    storage = FakeStorageProvider()
    chunk_store = FakeChunkStore()
    service = _create_service(storage=storage, chunk_store=chunk_store)

    library = await service.create_library(CreateScriptLibraryRequest(name="可删除剧本库", description=None))
    for index in range(2):
        upload_file = UploadFile(
            file=BytesIO(f"内容{index}".encode("utf-8")),
            filename=f"demo{index}.txt",
        )
        uploaded = await service.upload_script(library.id, upload_file)
        await service.get_script_chunks(library.id, uploaded.id)

    storage.fail_on_delete.update(storage._objects.keys())

    with pytest.raises(StorageCleanupError):
        await service.delete_library(library.id)
    with pytest.raises(ScriptLibraryNotFoundException):
        await service.get_library(library.id)


def test_script_app_service_delete_library_keeps_db_consistent_on_storage_failure():
    asyncio.run(_test_script_app_service_delete_library_keeps_db_consistent_on_storage_failure())


async def _test_script_app_service_get_script_chunks():
    repository = FakeScriptRepository()
    chunk_store = FakeChunkStore()
    service = _create_service(repository=repository, chunk_store=chunk_store)
    text_data = ("这是第一句。这里继续第二句。" * 180).encode("utf-8")

    library = await service.create_library(CreateScriptLibraryRequest(name="分块测试", description=None))
    upload_file = UploadFile(file=BytesIO(text_data), filename="chunk-demo.txt")
    uploaded = await service.upload_script(library.id, upload_file)

    chunks = await service.get_script_chunks(library.id, uploaded.id)

    assert len(chunks) > 1
    assert chunks[0].chunk_index == 0
    assert chunks[0].chunk_size <= 1200
    assert chunks[0].content.endswith("。")
    assert chunks[1].start_index < chunks[0].end_index
    stored_chunks = await repository.list_chunks(uploaded.id, library.id)
    assert len(stored_chunks) == len(chunks)
    hydrated_chunks = await chunk_store.get_chunks(stored_chunks)
    assert hydrated_chunks[0].content == chunks[0].content


def test_script_app_service_get_script_chunks():
    asyncio.run(_test_script_app_service_get_script_chunks())


async def _test_script_app_service_get_script_chunks_uses_cached_chunks():
    repository = FakeScriptRepository()
    storage = FakeStorageProvider()
    chunk_store = FakeChunkStore()
    service = _create_service(repository=repository, storage=storage, chunk_store=chunk_store)

    library = await service.create_library(CreateScriptLibraryRequest(name="分块缓存", description=None))
    uploaded = await service.upload_script(
        library.id,
        UploadFile(file=BytesIO(("第一段。" * 300).encode("utf-8")), filename="cache.txt"),
    )
    first_chunks = await service.get_script_chunks(library.id, uploaded.id)
    assert len(first_chunks) > 0

    script = await repository.find_by_id(uploaded.id)
    assert script is not None
    storage._objects[script.storage_path] = b""

    second_chunks = await service.get_script_chunks(library.id, uploaded.id)
    assert second_chunks == first_chunks


def test_script_app_service_get_script_chunks_uses_cached_chunks():
    asyncio.run(_test_script_app_service_get_script_chunks_uses_cached_chunks())


async def _test_script_app_service_execute_script_chunks_replaces_existing_chunks():
    repository = FakeScriptRepository()
    storage = FakeStorageProvider()
    chunk_store = FakeChunkStore()
    service = _create_service(repository=repository, storage=storage, chunk_store=chunk_store)

    library = await service.create_library(CreateScriptLibraryRequest(name="分块重建", description=None))
    uploaded = await service.upload_script(
        library.id,
        UploadFile(file=BytesIO(("旧内容。" * 260).encode("utf-8")), filename="refresh.txt"),
    )
    old_chunks = await service.get_script_chunks(library.id, uploaded.id)
    assert len(old_chunks) > 0

    script = await repository.find_by_id(uploaded.id)
    assert script is not None
    storage._objects[script.storage_path] = ("新内容。" * 40).encode("utf-8")

    refreshed_chunks = await service.execute_script_chunks(library.id, uploaded.id)
    assert len(refreshed_chunks) > 0
    assert refreshed_chunks != old_chunks

    stored_chunks = await repository.list_chunks(uploaded.id, library.id)
    assert len(stored_chunks) == len(refreshed_chunks)
    hydrated_chunks = await chunk_store.get_chunks(stored_chunks)
    assert hydrated_chunks[0].content == refreshed_chunks[0].content


def test_script_app_service_execute_script_chunks_replaces_existing_chunks():
    asyncio.run(_test_script_app_service_execute_script_chunks_replaces_existing_chunks())


async def _test_script_app_service_execute_script_chunks_rolls_back_es_documents_when_pg_replace_fails():
    repository = FailingReplaceChunkRepository()
    chunk_store = FakeChunkStore()
    service = _create_service(repository=repository, chunk_store=chunk_store)

    library = await service.create_library(CreateScriptLibraryRequest(name="回滚测试", description=None))
    uploaded = await service.upload_script(
        library.id,
        UploadFile(file=BytesIO(("回滚内容。" * 120).encode("utf-8")), filename="rollback.txt"),
    )

    with pytest.raises(RuntimeError):
        await service.execute_script_chunks(library.id, uploaded.id)

    assert chunk_store._documents == {}


def test_script_app_service_execute_script_chunks_rolls_back_es_documents_when_pg_replace_fails():
    asyncio.run(_test_script_app_service_execute_script_chunks_rolls_back_es_documents_when_pg_replace_fails())


async def _test_script_app_service_get_script_chunks_requires_same_library():
    service = _create_service()
    library_a = await service.create_library(CreateScriptLibraryRequest(name="A", description=None))
    library_b = await service.create_library(CreateScriptLibraryRequest(name="B", description=None))
    uploaded = await service.upload_script(
        library_a.id,
        UploadFile(file=BytesIO("测试内容。".encode("utf-8")), filename="a.txt"),
    )

    with pytest.raises(ScriptNotFoundException):
        await service.get_script_chunks(library_b.id, uploaded.id)


def test_script_app_service_get_script_chunks_requires_same_library():
    asyncio.run(_test_script_app_service_get_script_chunks_requires_same_library())


async def _test_script_app_service_get_script_text_content():
    service = _create_service()
    content = "这是一个文本内容测试。"
    library = await service.create_library(CreateScriptLibraryRequest(name="文本读取库", description=None))
    uploaded = await service.upload_script(
        library.id,
        UploadFile(file=BytesIO(content.encode("utf-8")), filename="readme.txt"),
    )

    result = await service.get_script_text_content(library.id, uploaded.id)

    assert result.id == uploaded.id
    assert result.library_id == library.id
    assert result.file_extension == "txt"
    assert result.content == content
    assert result.content_length == len(content)


def test_script_app_service_get_script_text_content():
    asyncio.run(_test_script_app_service_get_script_text_content())


async def _test_script_app_service_get_script_text_content_requires_same_library():
    service = _create_service()
    library_a = await service.create_library(CreateScriptLibraryRequest(name="A", description=None))
    library_b = await service.create_library(CreateScriptLibraryRequest(name="B", description=None))
    uploaded = await service.upload_script(
        library_a.id,
        UploadFile(file=BytesIO("文本".encode("utf-8")), filename="a.txt"),
    )

    with pytest.raises(ScriptNotFoundException):
        await service.get_script_text_content(library_b.id, uploaded.id)


def test_script_app_service_get_script_text_content_requires_same_library():
    asyncio.run(_test_script_app_service_get_script_text_content_requires_same_library())


async def _test_script_app_service_get_script_text_content_rejects_non_text_file():
    service = _create_service()
    library = await service.create_library(CreateScriptLibraryRequest(name="非文本", description=None))
    uploaded = await service.upload_script(
        library.id,
        UploadFile(file=BytesIO(b"%PDF-1.7 fake"), filename="demo.pdf"),
    )

    with pytest.raises(ValidationException):
        await service.get_script_text_content(library.id, uploaded.id)


def test_script_app_service_get_script_text_content_rejects_non_text_file():
    asyncio.run(_test_script_app_service_get_script_text_content_rejects_non_text_file())
