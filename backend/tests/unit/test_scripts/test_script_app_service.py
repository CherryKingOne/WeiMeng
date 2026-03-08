import asyncio
from io import BytesIO
from uuid import UUID

import pytest
from starlette.datastructures import UploadFile

from src.modules.scripts.application.dto.script_dto import CreateScriptLibraryRequest
from src.modules.scripts.application.services.script_app_service import ScriptAppService
from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary
from src.modules.scripts.domain.exceptions import ScriptLibraryNotFoundException


class FakeScriptRepository:
    def __init__(self):
        self._libraries: dict[UUID, ScriptLibrary] = {}
        self._scripts: dict[UUID, Script] = {}

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
        return self._scripts.pop(script_id, None) is not None


class FakeStorageProvider:
    def __init__(self):
        self._objects: dict[str, bytes] = {}
        self.deleted_objects: list[str] = []

    async def upload_bytes(self, object_name: str, data: bytes, content_type: str | None = None) -> str:
        self._objects[object_name] = data
        return object_name

    async def delete_object(self, object_name: str) -> None:
        self._objects.pop(object_name, None)
        self.deleted_objects.append(object_name)


async def _prepare_library_with_script(service: ScriptAppService, filename: str, data: bytes) -> tuple[UUID, UUID, str]:
    library = await service.create_library(CreateScriptLibraryRequest(name="测试库", description=None))
    upload_file = UploadFile(file=BytesIO(data), filename=filename)
    uploaded = await service.upload_script(library.id, upload_file)
    return library.id, uploaded.id, uploaded.original_name


async def _test_script_app_service_create_library():
    service = ScriptAppService(
        script_repository=FakeScriptRepository(),
        storage_provider=FakeStorageProvider(),
    )

    result = await service.create_library(
        CreateScriptLibraryRequest(name="武侠合集", description="测试剧本库"),
    )

    assert result.id is not None
    assert result.name == "武侠合集"
    assert result.description == "测试剧本库"


def test_script_app_service_create_library():
    asyncio.run(_test_script_app_service_create_library())


async def _test_script_app_service_list_and_get_library():
    service = ScriptAppService(
        script_repository=FakeScriptRepository(),
        storage_provider=FakeStorageProvider(),
    )

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
    service = ScriptAppService(
        script_repository=FakeScriptRepository(),
        storage_provider=FakeStorageProvider(),
    )

    upload_file = UploadFile(file=BytesIO("你好，剧本".encode("utf-8")), filename="demo.txt")
    with pytest.raises(ScriptLibraryNotFoundException):
        await service.upload_script(UUID("00000000-0000-0000-0000-000000000001"), upload_file)


def test_script_app_service_upload_requires_library():
    asyncio.run(_test_script_app_service_upload_requires_library())


async def _test_script_app_service_upload_list_and_read_text_content():
    repository = FakeScriptRepository()
    service = ScriptAppService(
        script_repository=repository,
        storage_provider=FakeStorageProvider(),
    )

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
    service = ScriptAppService(
        script_repository=FakeScriptRepository(),
        storage_provider=FakeStorageProvider(),
    )
    with pytest.raises(ScriptLibraryNotFoundException):
        await service.list_library_scripts(UUID("00000000-0000-0000-0000-000000000001"))


def test_script_app_service_list_library_scripts_requires_library():
    asyncio.run(_test_script_app_service_list_library_scripts_requires_library())


async def _test_script_app_service_delete_script_from_library():
    storage = FakeStorageProvider()
    service = ScriptAppService(
        script_repository=FakeScriptRepository(),
        storage_provider=storage,
    )

    library_id, script_id, _ = await _prepare_library_with_script(
        service,
        filename="demo.txt",
        data="删除测试".encode("utf-8"),
    )

    result = await service.delete_script_from_library(library_id, script_id)
    assert result.message == "Script deleted successfully"
    assert len(storage.deleted_objects) == 1


def test_script_app_service_delete_script_from_library():
    asyncio.run(_test_script_app_service_delete_script_from_library())


async def _test_script_app_service_delete_library_with_scripts():
    storage = FakeStorageProvider()
    service = ScriptAppService(
        script_repository=FakeScriptRepository(),
        storage_provider=storage,
    )

    library = await service.create_library(CreateScriptLibraryRequest(name="可删除剧本库", description=None))
    for index in range(2):
        upload_file = UploadFile(
            file=BytesIO(f"内容{index}".encode("utf-8")),
            filename=f"demo{index}.txt",
        )
        await service.upload_script(library.id, upload_file)

    result = await service.delete_library(library.id)
    assert result.message == "Script library deleted successfully"
    assert result.deleted_script_count == 2
    assert len(storage.deleted_objects) == 2

    with pytest.raises(ScriptLibraryNotFoundException):
        await service.get_library(library.id)


def test_script_app_service_delete_library_with_scripts():
    asyncio.run(_test_script_app_service_delete_library_with_scripts())
