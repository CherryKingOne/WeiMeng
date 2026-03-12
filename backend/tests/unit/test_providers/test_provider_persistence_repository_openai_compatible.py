import asyncio
import json
import uuid
from datetime import datetime, timezone

from src.modules.providers.infrastructure.models.provider_model import ProviderModel
from src.modules.providers.infrastructure.providers.openai_compatible import (
    OPENAI_COMPATIBLE_PROVIDER,
)
from src.modules.providers.infrastructure.repositories.provider_persistence_repository import (
    ProviderPersistenceRepository,
)
from src.shared.security.provider_key_cipher import provider_key_cipher


class _ScalarOneOrNoneResult:
    def __init__(self, model):
        self._model = model

    def scalar_one_or_none(self):
        return self._model


class _ScalarsResult:
    def __init__(self, models):
        self._models = models

    def scalars(self):
        return self

    def all(self):
        return self._models


class _FakeSession:
    def __init__(self, execute_results):
        self._execute_results = list(execute_results)
        self.added_models: list[ProviderModel] = []
        self.deleted_models: list[ProviderModel] = []

    async def execute(self, _stmt):
        return self._execute_results.pop(0)

    def add(self, model):
        self.added_models.append(model)

    async def delete(self, model):
        self.deleted_models.append(model)

    async def commit(self):
        return None

    async def refresh(self, _model):
        return None


def _build_openai_compatible_model(
    provider_key: str,
    model_name: str,
    base_url: str = "https://third-party.example.com/v1",
    api_key: str = "test-key",
    max_token: int | None = 4096,
    temperature: float | None = 0.3,
) -> ProviderModel:
    now = datetime.now(timezone.utc)
    payload = {
        "provider": OPENAI_COMPATIBLE_PROVIDER,
        "base_url": base_url,
        "api_key": api_key,
        "model": model_name,
        "max_token": max_token,
        "temperature": temperature,
    }
    encrypted = provider_key_cipher.encrypt(json.dumps(payload, ensure_ascii=False))
    return ProviderModel(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        provider=provider_key,
        api_key=encrypted,
        created_at=now,
        updated_at=now,
    )


def test_create_openai_compatible_config_encrypts_payload():
    user_id = str(uuid.uuid4())
    session = _FakeSession(execute_results=[_ScalarOneOrNoneResult(None)])
    repository = ProviderPersistenceRepository(session)

    record, created = asyncio.run(
        repository.create_openai_compatible_config(
            user_id=user_id,
            provider=OPENAI_COMPATIBLE_PROVIDER,
            base_url="https://third-party.example.com/v1",
            api_key="plain-openai-compatible-key",
            model="third-party-model",
            max_token=4096,
            temperature=0.6,
        )
    )

    assert created is True
    assert len(session.added_models) == 1
    assert session.added_models[0].provider.startswith("openai-compatible:")
    assert session.added_models[0].api_key.startswith("enc:v1:")
    assert record.payload.provider == OPENAI_COMPATIBLE_PROVIDER
    assert record.payload.model == "third-party-model"


def test_list_openai_compatible_configs_returns_decrypted_models():
    user_id = str(uuid.uuid4())
    provider_key = ProviderPersistenceRepository._build_openai_compatible_provider_key("demo-model")
    openai_compatible_row = _build_openai_compatible_model(provider_key, "demo-model")
    session = _FakeSession(execute_results=[_ScalarsResult([openai_compatible_row])])
    repository = ProviderPersistenceRepository(session)

    records = asyncio.run(repository.list_openai_compatible_configs(user_id=user_id))

    assert len(records) == 1
    assert records[0].payload.provider == OPENAI_COMPATIBLE_PROVIDER
    assert records[0].payload.model == "demo-model"


def test_update_openai_compatible_config_returns_none_when_not_found():
    user_id = str(uuid.uuid4())
    session = _FakeSession(execute_results=[_ScalarOneOrNoneResult(None)])
    repository = ProviderPersistenceRepository(session)

    result = asyncio.run(
        repository.update_openai_compatible_config(
            user_id=user_id,
            provider=OPENAI_COMPATIBLE_PROVIDER,
            base_url="https://third-party.example.com/v1",
            api_key="updated-key",
            model="missing-model",
            max_token=1024,
            temperature=0.2,
        )
    )

    assert result is None


def test_get_openai_compatible_config_by_model_returns_record():
    user_id = str(uuid.uuid4())
    provider_key = ProviderPersistenceRepository._build_openai_compatible_provider_key("demo-model")
    model_row = _build_openai_compatible_model(provider_key, "demo-model")
    session = _FakeSession(execute_results=[_ScalarOneOrNoneResult(model_row)])
    repository = ProviderPersistenceRepository(session)

    record = asyncio.run(
        repository.get_openai_compatible_config_by_model(
            user_id=user_id,
            model="demo-model",
        )
    )

    assert record is not None
    assert record.payload.model == "demo-model"


def test_delete_openai_compatible_config_deletes_existing_record():
    user_id = str(uuid.uuid4())
    provider_key = ProviderPersistenceRepository._build_openai_compatible_provider_key("demo-model")
    model_row = _build_openai_compatible_model(provider_key, "demo-model")
    session = _FakeSession(execute_results=[_ScalarOneOrNoneResult(model_row)])
    repository = ProviderPersistenceRepository(session)

    deleted = asyncio.run(
        repository.delete_openai_compatible_config(
            user_id=user_id,
            model="demo-model",
        )
    )

    assert deleted is True
    assert len(session.deleted_models) == 1
