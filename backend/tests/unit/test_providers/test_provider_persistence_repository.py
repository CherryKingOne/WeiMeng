import asyncio
import uuid

from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.models.provider_model import ProviderModel
from src.modules.providers.infrastructure.repositories.provider_persistence_repository import (
    ProviderPersistenceRepository,
)
from src.modules.providers.infrastructure.runtime.provider_key_store import provider_key_store


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


class _FakeUpsertSession:
    def __init__(self, existing_model: ProviderModel | None):
        self._existing_model = existing_model
        self.added_model: ProviderModel | None = None

    async def execute(self, _stmt):
        return _ScalarOneOrNoneResult(self._existing_model)

    def add(self, model):
        self.added_model = model

    async def commit(self):
        return None

    async def refresh(self, _model):
        return None


class _FakeLoadSession:
    def __init__(self, models: list[ProviderModel]):
        self._models = models

    async def execute(self, _stmt):
        return _ScalarsResult(self._models)


def test_upsert_provider_api_key_encrypts_before_store():
    user_id = str(uuid.uuid4())
    session = _FakeUpsertSession(existing_model=None)
    repository = ProviderPersistenceRepository(session)

    saved_model, created = asyncio.run(
        repository.upsert_provider_api_key(user_id, ProviderName.GEMINI, "plain-key")
    )

    assert created is True
    assert session.added_model is not None
    assert str(session.added_model.user_id) == user_id
    assert session.added_model.api_key.startswith("enc:v1:")
    assert session.added_model.api_key != "plain-key"
    assert saved_model.api_key.startswith("enc:v1:")


def test_load_provider_api_keys_to_runtime_decrypts_cipher_text():
    user_id = str(uuid.uuid4())
    encrypted_model = ProviderModel(
        user_id=uuid.UUID(user_id),
        provider=ProviderName.GEMINI.value,
        api_key="",
    )
    encrypted_model.api_key = "enc:v1:"
    session_for_encrypt = _FakeUpsertSession(existing_model=encrypted_model)
    repository_for_encrypt = ProviderPersistenceRepository(session_for_encrypt)
    _, _ = asyncio.run(
        repository_for_encrypt.upsert_provider_api_key(user_id, ProviderName.GEMINI, "gemini-real-key")
    )
    encrypted_text = encrypted_model.api_key

    session = _FakeLoadSession(
        models=[
            ProviderModel(
                user_id=uuid.UUID(user_id),
                provider=ProviderName.GEMINI.value,
                api_key=encrypted_text,
            )
        ]
    )
    repository = ProviderPersistenceRepository(session)

    provider_key_store.clear()

    loaded_count = asyncio.run(repository.load_provider_api_keys_to_runtime())

    assert loaded_count == 1
    assert provider_key_store.get_key(user_id, ProviderName.GEMINI) == "gemini-real-key"
