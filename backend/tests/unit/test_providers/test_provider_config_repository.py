import json
from urllib import error as urllib_error

from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.providers.qwen.llm_adapter import QwenLLMAdapter
from src.modules.providers.infrastructure.providers.fastchat import (
    model_catalog as fastchat_catalog_module,
)
from src.modules.providers.infrastructure.providers.qwen.model_catalog import QwenModelCatalogProvider
from src.modules.providers.infrastructure.repositories.provider_config_repository import (
    EnvironmentProviderConfigRepository,
)
from src.modules.providers.infrastructure.runtime.provider_key_store import provider_key_store

USER_ID = "00000000-0000-0000-0000-000000000001"
OTHER_USER_ID = "00000000-0000-0000-0000-000000000002"


class _FakeHTTPResponse:
    def __init__(self, payload: dict[str, object]):
        self._payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self) -> bytes:
        return json.dumps(self._payload).encode("utf-8")


def test_qwen_models_are_loaded_from_remote_models_endpoint(monkeypatch):
    QwenModelCatalogProvider._models_cache = None
    QwenModelCatalogProvider._cache_expires_at = 0.0

    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.QWEN, "test-qwen-key")

    def fake_urlopen(request, timeout=0):
        assert request.full_url == QwenModelCatalogProvider.MODELS_ENDPOINT
        assert timeout == 8
        return _FakeHTTPResponse(
            {
                "data": [
                    {"id": "qwen-max"},
                    {"id": "qwen-long"},
                ]
            }
        )

    monkeypatch.setattr(fastchat_catalog_module.urllib_request, "urlopen", fake_urlopen)

    repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
    catalog = repository.get_provider_catalog(ProviderName.QWEN)

    assert catalog is not None
    assert catalog.models[0] == QwenLLMAdapter.DEFAULT_MODEL
    assert "qwen-max" in catalog.models
    assert "qwen-long" in catalog.models


def test_qwen_model_detail_is_loaded_from_remote_model_endpoint(monkeypatch):
    QwenModelCatalogProvider._models_cache = None
    QwenModelCatalogProvider._cache_expires_at = 0.0

    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.QWEN, "test-qwen-key")

    def fake_urlopen(request, timeout=0):
        assert timeout == 8
        if request.full_url == QwenModelCatalogProvider.MODELS_ENDPOINT:
            return _FakeHTTPResponse({"data": [{"id": "qwen-max"}]})
        assert request.full_url == f"{QwenModelCatalogProvider.MODELS_ENDPOINT}/qwen-max"
        return _FakeHTTPResponse(
            {
                "id": "qwen-max",
                "object": "model",
                "owned_by": "qwen",
            }
        )

    monkeypatch.setattr(fastchat_catalog_module.urllib_request, "urlopen", fake_urlopen)

    repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
    catalog = repository.get_provider_catalog(ProviderName.QWEN, model="qwen-max")

    assert catalog is not None
    assert catalog.selected_model == "qwen-max"
    assert catalog.selected_model_detail == {
        "id": "qwen-max",
        "object": "model",
        "owned_by": "qwen",
    }


def test_qwen_models_fallback_to_default_when_remote_request_fails(monkeypatch):
    QwenModelCatalogProvider._models_cache = None
    QwenModelCatalogProvider._cache_expires_at = 0.0

    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.QWEN, "test-qwen-key")

    def fake_urlopen(_request, timeout=0):
        raise urllib_error.URLError("network down")

    monkeypatch.setattr(fastchat_catalog_module.urllib_request, "urlopen", fake_urlopen)

    repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
    catalog = repository.get_provider_catalog(ProviderName.QWEN)

    assert catalog is not None
    assert catalog.models == (QwenLLMAdapter.DEFAULT_MODEL,)


def test_selected_model_detail_returns_error_when_provider_key_not_configured():
    provider_key_store.clear()

    repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
    catalog = repository.get_provider_catalog(ProviderName.QWEN, model="qwen-max")

    assert catalog is not None
    assert catalog.selected_model == "qwen-max"
    assert catalog.selected_model_detail == {
        "id": "qwen-max",
        "error": "provider_api_key_not_configured",
    }


def test_qwen_api_key_can_be_loaded_from_runtime_key_store(monkeypatch):
    QwenModelCatalogProvider._models_cache = None
    QwenModelCatalogProvider._cache_expires_at = 0.0

    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.QWEN, "qwen-from-runtime-store")

    def fake_urlopen(request, timeout=0):
        auth_header = request.headers.get("Authorization")
        assert auth_header == "Bearer qwen-from-runtime-store"
        assert timeout == 8
        return _FakeHTTPResponse({"data": [{"id": "qwen-max"}]})

    monkeypatch.setattr(fastchat_catalog_module.urllib_request, "urlopen", fake_urlopen)

    repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
    configured = repository.list_configured_providers()
    catalog = repository.get_provider_catalog(ProviderName.QWEN)

    assert ProviderName.QWEN in configured
    assert catalog is not None
    assert "qwen-max" in catalog.models


def test_openai_catalog_is_fetched_via_openai_provider_file(monkeypatch):
    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.OPENAI, "openai-key")

    original_provider = EnvironmentProviderConfigRepository._model_catalog_providers[ProviderName.OPENAI]

    class _FakeOpenAIModelCatalogProvider:
        def fetch_supported_models(self, api_key: str | None) -> tuple[str, ...]:
            assert api_key == "openai-key"
            return ("gpt-test-a", "gpt-test-b")

        def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
            _ = model_id
            assert api_key == "openai-key"
            return None

    EnvironmentProviderConfigRepository._model_catalog_providers[ProviderName.OPENAI] = (
        _FakeOpenAIModelCatalogProvider()
    )
    try:
        repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
        catalog = repository.get_provider_catalog(ProviderName.OPENAI)
    finally:
        EnvironmentProviderConfigRepository._model_catalog_providers[ProviderName.OPENAI] = original_provider

    assert catalog is not None
    assert catalog.models == ("gpt-test-a", "gpt-test-b")


def test_kimi_api_key_can_be_loaded_from_runtime_key_store():
    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.KIMI, "kimi-from-runtime-store")

    repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
    configured = repository.list_configured_providers()

    assert ProviderName.KIMI in configured


def test_deepseek_api_key_can_be_loaded_from_runtime_key_store():
    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.DEEPSEEK, "deepseek-from-runtime-store")

    repository = EnvironmentProviderConfigRepository(user_id=USER_ID)
    configured = repository.list_configured_providers()

    assert ProviderName.DEEPSEEK in configured


def test_provider_runtime_keys_are_user_scoped():
    provider_key_store.clear()
    provider_key_store.set_key(USER_ID, ProviderName.QWEN, "qwen-key-user-a")
    provider_key_store.set_key(OTHER_USER_ID, ProviderName.GEMINI, "gemini-key-user-b")

    repository_for_user_a = EnvironmentProviderConfigRepository(user_id=USER_ID)
    configured_for_user_a = repository_for_user_a.list_configured_providers()

    assert ProviderName.QWEN in configured_for_user_a
    assert ProviderName.GEMINI not in configured_for_user_a
