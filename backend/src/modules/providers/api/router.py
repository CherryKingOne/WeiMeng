import json

from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.responses import StreamingResponse

from src.modules.providers.api.dependencies import (
    get_chat_service,
    get_model_generation_service,
    get_provider_config_management_service,
    get_system_model_config_service,
)
from src.modules.providers.application.dto.chat_dto import ChatRequest, ChatResponse
from src.modules.providers.application.dto.provider_manage_dto import (
    UpsertProviderConfigRequest,
    UpsertProviderConfigResponse,
)
from src.modules.providers.application.dto.system_model_config_dto import (
    GetSystemModelConfigResponse,
    UpsertSystemModelConfigRequest,
    UpsertSystemModelConfigResponse,
)
from src.modules.providers.application.dto.provider_config_dto import (
    ProviderModelsResponse,
    SupportedProvidersResponse,
)
from src.modules.providers.application.services.model_generation_service import (
    ModelGenerationService,
)
from src.modules.providers.application.services.provider_config_management_service import (
    ProviderConfigManagementService,
)
from src.modules.providers.application.services.chat_service import ChatService
from src.modules.providers.application.services.system_model_config_service import (
    SystemModelConfigService,
)
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.shared.domain.exceptions import DomainException
from src.shared.common.dependencies import get_current_user_id

router = APIRouter(
    prefix="/api/v1/models",
    tags=["Model Providers"],
    dependencies=[Security(get_current_user_id)],
    responses={401: {"description": "Not authenticated"}},
)


@router.get("", response_model=ProviderModelsResponse)
async def get_provider_models(
    provider: ProviderName | None = Query(
        default=None,
        description="按供应商筛选模型列表，例如 qwen",
    ),
    model: str | None = Query(
        default=None,
        description="按模型ID查询基础信息，例如 qwen-max（需同时传 provider）",
    ),
    generation_service: ModelGenerationService = Depends(get_model_generation_service),
):
    if model and provider is None:
        raise HTTPException(
            status_code=422,
            detail="Query parameter 'provider' is required when 'model' is provided.",
        )
    return generation_service.get_provider_models(provider=provider, model=model)


@router.post("/chat", response_model=ChatResponse, response_model_exclude_none=True)
async def chat_completion(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    if request.stream:
        provider, model_name, token_stream = await chat_service.stream_chat(request)
        thinking_stream = provider == ProviderName.QWEN and (
            request.enable_thinking is True or request.thinking_budget is not None
        )
        volcengine_thinking_stream = (
            provider == ProviderName.VOLCENGINE
            and request.thinking is not None
            and request.thinking.type.value == "enabled"
            and (
                request.thinking.reasoning_effort is None
                or request.thinking.reasoning_effort.value != "minimal"
            )
        )
        deepseek_thinking_stream = (
            provider == ProviderName.DEEPSEEK
            and (
                (request.thinking is not None and request.thinking.type.value == "enabled")
                or (
                    model_name == "deepseek-reasoner"
                    and (request.thinking is None or request.thinking.type.value != "disabled")
                )
            )
        )
        thinking_stream = thinking_stream or volcengine_thinking_stream or deepseek_thinking_stream

        async def _event_stream():
            yield (
                "data: "
                + json.dumps(
                    {
                        "type": "start",
                        "provider": provider.value,
                        "model_name": model_name,
                    },
                    ensure_ascii=False,
                )
                + "\n\n"
            )
            stream_section = "answer"
            try:
                async for chunk in token_stream:
                    if thinking_stream:
                        if chunk == "<think>":
                            stream_section = "think"
                            continue
                        if chunk == "</think>":
                            stream_section = "answer"
                            continue
                        if chunk == "<answer>" or chunk == "</answer>":
                            stream_section = "answer"
                            continue

                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "type": (
                                    "think_delta"
                                    if thinking_stream and stream_section == "think"
                                    else "answer_delta" if thinking_stream else "delta"
                                ),
                                "content": chunk,
                            },
                            ensure_ascii=False,
                        )
                        + "\n\n"
                    )
            except DomainException as exc:
                yield (
                    "event: error\n"
                    "data: "
                    + json.dumps(
                        {
                            "type": "error",
                            "code": exc.code,
                            "message": exc.message,
                            "detail": exc.detail,
                        },
                        ensure_ascii=False,
                    )
                    + "\n\n"
                )
                return

            yield "data: " + json.dumps({"type": "done"}, ensure_ascii=False) + "\n\n"

        return StreamingResponse(_event_stream(), media_type="text/event-stream")

    return await chat_service.chat(request)


@router.post("/providers", response_model=UpsertProviderConfigResponse)
async def create_provider_config(
    request: UpsertProviderConfigRequest,
    config_management_service: ProviderConfigManagementService = Depends(
        get_provider_config_management_service
    ),
):
    return await config_management_service.upsert_provider_config(request)


@router.post("/system", response_model=UpsertSystemModelConfigResponse)
async def upsert_system_model_config(
    request: UpsertSystemModelConfigRequest,
    system_model_config_service: SystemModelConfigService = Depends(get_system_model_config_service),
):
    return await system_model_config_service.upsert(request)


@router.get("/system", response_model=GetSystemModelConfigResponse)
async def get_system_model_config(
    system_model_config_service: SystemModelConfigService = Depends(get_system_model_config_service),
):
    return await system_model_config_service.get()


@router.get("/providers", response_model=SupportedProvidersResponse)
async def get_supported_providers(
    generation_service: ModelGenerationService = Depends(get_model_generation_service),
):
    return generation_service.get_supported_providers()


@router.get("/{model_id}", response_model=ProviderModelsResponse)
async def get_provider_model_detail(
    model_id: str,
    provider: ProviderName = Query(
        ...,
        description="查询模型详情时必须指定供应商，例如 qwen",
    ),
    generation_service: ModelGenerationService = Depends(get_model_generation_service),
):
    return generation_service.get_provider_models(provider=provider, model=model_id)
