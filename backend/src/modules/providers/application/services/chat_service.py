from collections.abc import AsyncIterator

from src.modules.providers.application.dto.chat_dto import ChatRequest, ChatResponse
from src.modules.providers.domain.exceptions import (
    ModelGenerationFailedException,
    ProviderConfigNotFoundException,
    ProviderModelNotSupportedException,
)
from src.modules.providers.domain.repositories import IProviderConfigRepository
from src.modules.providers.domain.value_objects.model_type import ModelType
from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.factories import ModelProviderFactory
from src.modules.providers.infrastructure.providers.deepseek.llm_adapter import DeepSeekLLMAdapter
from src.modules.providers.infrastructure.providers.qwen.llm_adapter import QwenLLMAdapter
from src.modules.providers.infrastructure.providers.volcengine.llm_adapter import (
    VolcengineLLMAdapter,
)
from src.modules.providers.infrastructure.repositories.system_model_config_repository import (
    SystemModelConfigRepository,
)
from src.shared.domain.exceptions import DomainException, ValidationException


class ChatService:
    def __init__(
        self,
        user_id: str,
        provider_config_repository: IProviderConfigRepository,
        system_model_config_repository: SystemModelConfigRepository,
    ):
        self._user_id = user_id
        self._provider_config_repository = provider_config_repository
        self._system_model_config_repository = system_model_config_repository

    async def chat(self, request: ChatRequest) -> ChatResponse:
        (
            resolved_provider,
            resolved_model,
            llm_provider,
            generation_kwargs,
        ) = await self._prepare_chat_context(request)

        try:
            reply = await llm_provider.generate_text(
                prompt=request.message.strip(),
                model=resolved_model,
                **generation_kwargs,
            )
        except DomainException:
            raise
        except Exception as exc:
            raise ModelGenerationFailedException(detail=str(exc)) from exc

        qwen_thinking_enabled = (
            resolved_provider == ProviderName.QWEN
            and generation_kwargs.get("enable_thinking") is True
        )
        volcengine_thinking_enabled = (
            resolved_provider == ProviderName.VOLCENGINE
            and generation_kwargs.get("thinking_type") == "enabled"
            and generation_kwargs.get("reasoning_effort") != "minimal"
        )
        deepseek_thinking_enabled = (
            resolved_provider == ProviderName.DEEPSEEK
            and (
                generation_kwargs.get("deepseek_thinking_type") == "enabled"
                or (
                    resolved_model == "deepseek-reasoner"
                    and generation_kwargs.get("deepseek_thinking_type") != "disabled"
                )
            )
        )
        thinking_enabled = qwen_thinking_enabled or volcengine_thinking_enabled or deepseek_thinking_enabled
        think_text: str | None = None
        answer_text = reply
        if qwen_thinking_enabled:
            think_text, answer_text = QwenLLMAdapter.extract_thinking_and_answer(reply)
            if think_text is None:
                think_text = ""
        elif volcengine_thinking_enabled:
            think_text, answer_text = VolcengineLLMAdapter.extract_thinking_and_answer(reply)
            if think_text is None:
                think_text = ""
        elif deepseek_thinking_enabled:
            think_text, answer_text = DeepSeekLLMAdapter.extract_thinking_and_answer(reply)
            if think_text is None:
                think_text = ""

        return ChatResponse(
            provider=resolved_provider,
            model_name=resolved_model,
            think=think_text if thinking_enabled else None,
            answer=answer_text,
        )

    async def stream_chat(
        self,
        request: ChatRequest,
    ) -> tuple[ProviderName, str, AsyncIterator[str]]:
        (
            resolved_provider,
            resolved_model,
            llm_provider,
            generation_kwargs,
        ) = await self._prepare_chat_context(request)

        async def _stream() -> AsyncIterator[str]:
            try:
                async for chunk in llm_provider.stream_generate_text(
                    prompt=request.message.strip(),
                    model=resolved_model,
                    **generation_kwargs,
                ):
                    if chunk:
                        yield chunk
            except DomainException:
                raise
            except Exception as exc:
                raise ModelGenerationFailedException(detail=str(exc)) from exc

        return resolved_provider, resolved_model, _stream()

    async def _prepare_chat_context(
        self,
        request: ChatRequest,
    ) -> tuple[ProviderName, str, object, dict[str, float | int | bool | str]]:
        resolved_provider, resolved_model = await self._resolve_provider_and_model(request)

        provider_config = self._provider_config_repository.get_provider_config(resolved_provider)
        if provider_config is None:
            raise ProviderConfigNotFoundException(resolved_provider.value)

        if resolved_model not in provider_config.supported_models:
            raise ProviderModelNotSupportedException(
                provider=resolved_provider.value,
                model=resolved_model,
            )

        llm_provider = ModelProviderFactory.create(
            provider=resolved_provider,
            model_type=ModelType.LLM,
            api_key=provider_config.api_key,
            base_url=provider_config.base_url,
            conversation_template=request.conversation_template
            or provider_config.conversation_template,
        )

        generation_kwargs: dict[str, float | int | bool | str] = {}
        if request.temperature is not None:
            generation_kwargs["temperature"] = request.temperature
        if request.max_tokens is not None:
            generation_kwargs["max_tokens"] = request.max_tokens
        if request.enable_thinking is not None:
            if resolved_provider != ProviderName.QWEN:
                raise ValidationException(
                    message="enable_thinking is only supported by qwen",
                    detail="Set provider=qwen when using enable_thinking.",
                )
            generation_kwargs["enable_thinking"] = request.enable_thinking
        if request.thinking_budget is not None:
            if resolved_provider != ProviderName.QWEN:
                raise ValidationException(
                    message="thinking_budget is only supported by qwen",
                    detail="Set provider=qwen when using thinking_budget.",
                )
            if request.enable_thinking is False:
                raise ValidationException(
                    message="thinking_budget requires enable_thinking",
                    detail="Set enable_thinking=true when using thinking_budget.",
                )
            generation_kwargs["thinking_budget"] = request.thinking_budget
            if request.enable_thinking is None:
                generation_kwargs["enable_thinking"] = True
        if request.thinking is not None:
            if resolved_provider == ProviderName.VOLCENGINE:
                generation_kwargs["thinking_type"] = request.thinking.type.value
                if request.thinking.reasoning_effort is None:
                    generation_kwargs["reasoning_effort"] = (
                        "minimal" if request.thinking.type.value == "disabled" else "medium"
                    )
                else:
                    generation_kwargs["reasoning_effort"] = request.thinking.reasoning_effort.value
            elif resolved_provider == ProviderName.DEEPSEEK:
                if request.thinking.reasoning_effort is not None:
                    raise ValidationException(
                        message="reasoning_effort is only supported by volcengine",
                        detail="Set provider=volcengine when using reasoning_effort.",
                    )
                if request.thinking.type.value == "auto":
                    raise ValidationException(
                        message="deepseek does not support thinking.type=auto",
                        detail="Use thinking.type=enabled or disabled for deepseek.",
                    )
                generation_kwargs["deepseek_thinking_type"] = request.thinking.type.value
            else:
                raise ValidationException(
                    message="thinking is only supported by volcengine or deepseek",
                    detail="Set provider=volcengine or deepseek when using thinking.",
                )
        elif resolved_provider == ProviderName.VOLCENGINE:
            # Default strategy: keep thinking mode disabled for cost/latency by using minimal effort.
            generation_kwargs["thinking_type"] = "enabled"
            generation_kwargs["reasoning_effort"] = "minimal"

        return resolved_provider, resolved_model, llm_provider, generation_kwargs

    async def _resolve_provider_and_model(self, request: ChatRequest) -> tuple[ProviderName, str]:
        if request.provider and request.model_name:
            return request.provider, request.model_name.strip()

        if request.provider and not request.model_name:
            provider_config = self._provider_config_repository.get_provider_config(request.provider)
            if provider_config is None:
                raise ProviderConfigNotFoundException(request.provider.value)
            return request.provider, provider_config.default_model

        system_model_config = await self._system_model_config_repository.get_by_user_id(self._user_id)
        if system_model_config is None:
            raise ValidationException(
                message="System model config not found",
                detail="Provide provider/model_name or configure /api/v1/models/system first.",
            )

        try:
            provider = ProviderName(system_model_config.provider)
        except ValueError as exc:
            raise ValidationException(
                message="System model config invalid",
                detail="Configured provider is invalid, please reconfigure /api/v1/models/system.",
            ) from exc

        return provider, system_model_config.model_name
