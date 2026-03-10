from uuid import UUID

from fastapi import APIRouter, Depends, File, Response, Security, UploadFile, status

from src.modules.scripts.api.dependencies import get_script_app_service
from src.modules.scripts.application.dto.script_chunk_dto import ScriptChunkResponse
from src.modules.scripts.application.dto.script_dto import (
    CreateScriptLibraryRequest,
    ScriptContentResponse,
    ScriptDeleteResponse,
    ScriptItemResponse,
    ScriptLibraryConfigResponse,
    ScriptLibraryDeleteResponse,
    ScriptLibraryDetailResponse,
    ScriptLibraryResponse,
    ScriptUploadResponse,
    UpdateScriptLibraryRequest,
    UpdateScriptLibraryConfigRequest,
)
from src.modules.scripts.application.services.script_app_service import ScriptAppService
from src.shared.common.dependencies import get_current_user_id

router = APIRouter(
    prefix="/api/v1/scripts",
    tags=["Scripts"],
    dependencies=[Security(get_current_user_id)],
    responses={401: {"description": "Not authenticated"}},
)


@router.post(
    "/libraries",
    response_model=ScriptLibraryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_script_library(
    request: CreateScriptLibraryRequest,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.create_library(request)


@router.get("/libraries", response_model=list[ScriptLibraryResponse])
async def list_script_libraries(
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.list_libraries()


@router.get("/libraries/{library_id}", response_model=ScriptLibraryDetailResponse)
async def get_script_library(
    library_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.get_library(library_id)


@router.put("/libraries/{library_id}", response_model=ScriptLibraryResponse)
async def update_script_library(
    library_id: UUID,
    request: UpdateScriptLibraryRequest,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.update_library(library_id, request)


@router.get("/libraries/{library_id}/config", response_model=ScriptLibraryConfigResponse)
async def get_script_library_config(
    library_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.get_library_config(library_id)


@router.put("/libraries/{library_id}/config", response_model=ScriptLibraryConfigResponse)
async def update_script_library_config(
    library_id: UUID,
    request: UpdateScriptLibraryConfigRequest,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.update_library_config(library_id, request)


@router.delete("/libraries/{library_id}", response_model=ScriptLibraryDeleteResponse)
async def delete_script_library(
    library_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.delete_library(library_id)


@router.post(
    "/libraries/{library_id}/upload",
    response_model=ScriptUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_script(
    library_id: UUID,
    file: UploadFile = File(...),
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.upload_script(library_id, file)


@router.post(
    "/libraries/{library_id}/avatar",
    response_model=ScriptLibraryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_script_library_avatar(
    library_id: UUID,
    file: UploadFile = File(...),
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.upload_library_avatar(library_id, file)


@router.get("/libraries/{library_id}/avatar")
async def get_script_library_avatar(
    library_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    avatar_bytes, content_type = await service.get_library_avatar(library_id)
    return Response(content=avatar_bytes, media_type=content_type)


@router.get("/libraries/{library_id}/files", response_model=list[ScriptItemResponse])
async def list_script_files_in_library(
    library_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.list_library_scripts(library_id)


@router.get(
    "/libraries/{library_id}/files/{script_id}/content",
    response_model=ScriptContentResponse,
)
async def get_script_text_content(
    library_id: UUID,
    script_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.get_script_text_content(library_id, script_id)


@router.get(
    "/libraries/{library_id}/files/{script_id}/chunks",
    response_model=list[ScriptChunkResponse],
)
async def get_script_chunks(
    library_id: UUID,
    script_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.get_script_chunks(library_id, script_id)


@router.post(
    "/libraries/{library_id}/files/{script_id}/chunks",
    response_model=list[ScriptChunkResponse],
)
async def execute_script_chunks(
    library_id: UUID,
    script_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.execute_script_chunks(library_id, script_id)


@router.delete("/libraries/{library_id}/files/{script_id}", response_model=ScriptDeleteResponse)
async def delete_script_from_library(
    library_id: UUID,
    script_id: UUID,
    service: ScriptAppService = Depends(get_script_app_service),
):
    return await service.delete_script_from_library(library_id, script_id)
