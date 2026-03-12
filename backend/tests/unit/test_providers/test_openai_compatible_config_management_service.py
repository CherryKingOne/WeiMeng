import asyncio
import uuid
from datetime import datetime, timezone

import pytest

from src.modules.providers.application.dto.openai_compatible_manage_dto import (
    UpsertOpenAICompatibleConfigRequest,
)
from src.modules.providers.application.services.openai_compatible_config_management_service import (
    OpenAICompatibleConfigManagementService,
)
from src.modules.providers.domain.exceptions import (
    OpenAICompatibleModelAlreadyExistsException,
    OpenAICompatibleModelNotFoundException,
)
from src.modules.providers.infrastructure.providers.openai_compatible import (
    OPENAI_COMPATIBLE_PROVIDER,
    OpenAICompatibleConfigPayload,
    OpenAICompatibleConfigRecord,
)


class _FakeProviderPersistenceRepository:
    def __init__(self):
        self._records: dict[str, OpenAICompatibleConfigRecord] = {}

    async def create_openai_compatible_config(
        self,
        user_id: str,
        provider: str,
        base_url: str,
        api_key: str,
        model: str,
        max_token: int | None,
        temperature: float | None,
    ) -> tuple[OpenAICompatibleConfigRecord, bool]:
        _ = user_id
        normalized = model.strip().lower()
        existing = self._records.get(normalized)
        if existing is not None:
            return existing, False
        now = datetime.now(timezone.utc)
        record = OpenAICompatibleConfigRecord(
            id=uuid.uuid4(),
            provider_key=f"{OPENAI_COMPATIBLE_PROVIDER}:{normalized}",
            payload=OpenAICompatibleConfigPayload(
                provider=provider,
                base_url=base_url,
                api_key=api_key,
                model=model.strip(),
                max_token=max_token,
                temperature=temperature,
            ),
            created_at=now,
            updated_at=now,
        )
        self._records[normalized] = record
        return record, True

    async def list_openai_compatible_configs(self, user_id: str) -> list[OpenAICompatibleConfigRecord]:
        _ = user_id
        return list(self._records.values())

    async def get_openai_compatible_config_by_model(
        self,
        user_id: str,
        model: str,
    ) -> OpenAICompatibleConfigRecord | None:
        _ = user_id
        return self._records.get(model.strip().lower())

    async def update_openai_compatible_config(
        self,
        user_id: str,
        provider: str,
        base_url: str,
        api_key: str,
        model: str,
        max_token: int | None,
        temperature: float | None,
    ) -> OpenAICompatibleConfigRecord | None:
        _ = user_id
        normalized = model.strip().lower()
        existing = self._records.get(normalized)
        if existing is None:
            return None
        updated = OpenAICompatibleConfigRecord(
            id=existing.id,
            provider_key=existing.provider_key,
            payload=OpenAICompatibleConfigPayload(
                provider=provider,
                base_url=base_url,
                api_key=api_key,
                model=model.strip(),
                max_token=max_token,
                temperature=temperature,
            ),
            created_at=existing.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        self._records[normalized] = updated
        return updated

    async def delete_openai_compatible_config(self, user_id: str, model: str) -> bool:
        _ = user_id
        return self._records.pop(model.strip().lower(), None) is not None


def test_create_openai_compatible_config_success():
    repository = _FakeProviderPersistenceRepository()
    service = OpenAICompatibleConfigManagementService(
        provider_persistence_repository=repository,
        user_id="00000000-0000-0000-0000-000000000021",
    )

    response = asyncio.run(
        service.create_config(
            UpsertOpenAICompatibleConfigRequest(
                provider=OPENAI_COMPATIBLE_PROVIDER,
                base_url="https://third-party.example.com/v1",
                api_key="test-key",
                model="third-party-model",
                max_token=4096,
                temperature=0.7,
            )
        )
    )

    assert response.provider == OPENAI_COMPATIBLE_PROVIDER
    assert response.model == "third-party-model"
    assert response.configured is True
    assert response.created is True


def test_create_openai_compatible_config_duplicate_raises():
    repository = _FakeProviderPersistenceRepository()
    service = OpenAICompatibleConfigManagementService(
        provider_persistence_repository=repository,
        user_id="00000000-0000-0000-0000-000000000022",
    )
    request = UpsertOpenAICompatibleConfigRequest(
        provider=OPENAI_COMPATIBLE_PROVIDER,
        base_url="https://third-party.example.com/v1",
        api_key="test-key",
        model="third-party-model",
    )

    asyncio.run(service.create_config(request))
    with pytest.raises(OpenAICompatibleModelAlreadyExistsException):
        asyncio.run(service.create_config(request))


def test_update_and_delete_openai_compatible_config_not_found_raises():
    repository = _FakeProviderPersistenceRepository()
    service = OpenAICompatibleConfigManagementService(
        provider_persistence_repository=repository,
        user_id="00000000-0000-0000-0000-000000000023",
    )

    with pytest.raises(OpenAICompatibleModelNotFoundException):
        asyncio.run(
            service.update_config(
                UpsertOpenAICompatibleConfigRequest(
                    provider=OPENAI_COMPATIBLE_PROVIDER,
                    base_url="https://third-party.example.com/v1",
                    api_key="test-key",
                    model="missing-model",
                )
            )
        )

    with pytest.raises(OpenAICompatibleModelNotFoundException):
        asyncio.run(service.delete_config("missing-model"))

