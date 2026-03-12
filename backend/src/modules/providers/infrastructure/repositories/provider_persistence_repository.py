import logging
import hashlib
import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.models.provider_model import ProviderModel
from src.modules.providers.infrastructure.providers.openai_compatible import (
    OPENAI_COMPATIBLE_PROVIDER,
    OPENAI_COMPATIBLE_PROVIDER_PREFIX,
    OpenAICompatibleConfigPayload,
    OpenAICompatibleConfigRecord,
)
from src.modules.providers.infrastructure.runtime.provider_key_store import provider_key_store
from src.shared.security.provider_key_cipher import provider_key_cipher

logger = logging.getLogger(__name__)


class ProviderPersistenceRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def upsert_provider_api_key(
        self,
        user_id: str,
        provider: ProviderName,
        api_key: str,
    ) -> tuple[ProviderModel, bool]:
        parsed_user_id = self._parse_user_id(user_id)
        encrypted_api_key = provider_key_cipher.encrypt(api_key)
        result = await self._session.execute(
            select(ProviderModel).where(
                ProviderModel.user_id == parsed_user_id,
                ProviderModel.provider == provider.value,
            )
        )
        model = result.scalar_one_or_none()
        created = model is None

        if model is None:
            model = ProviderModel(
                user_id=parsed_user_id,
                provider=provider.value,
                api_key=encrypted_api_key,
            )
            self._session.add(model)
        else:
            model.api_key = encrypted_api_key

        await self._session.commit()
        await self._session.refresh(model)
        return model, created

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
        # openai-compatible reuses the same providers table.
        # Each model config is isolated by a synthetic provider key: openai-compatible:<hash(model)>.
        parsed_user_id = self._parse_user_id(user_id)
        provider_key = self._build_openai_compatible_provider_key(model)
        result = await self._session.execute(
            select(ProviderModel).where(
                ProviderModel.user_id == parsed_user_id,
                ProviderModel.provider == provider_key,
            )
        )
        existing_model = result.scalar_one_or_none()
        if existing_model is not None:
            return self._to_openai_compatible_record(existing_model), False

        payload = OpenAICompatibleConfigPayload(
            provider=provider.strip(),
            base_url=base_url.strip(),
            api_key=api_key.strip(),
            model=model.strip(),
            max_token=max_token,
            temperature=temperature,
        )
        encrypted_payload = provider_key_cipher.encrypt(self._serialize_openai_compatible_payload(payload))

        model_entity = ProviderModel(
            user_id=parsed_user_id,
            provider=provider_key,
            api_key=encrypted_payload,
        )
        self._session.add(model_entity)
        await self._session.commit()
        await self._session.refresh(model_entity)
        return self._to_openai_compatible_record(model_entity), True

    async def list_openai_compatible_configs(self, user_id: str) -> list[OpenAICompatibleConfigRecord]:
        parsed_user_id = self._parse_user_id(user_id)
        result = await self._session.execute(
            select(ProviderModel).where(
                ProviderModel.user_id == parsed_user_id,
                ProviderModel.provider.like(f"{OPENAI_COMPATIBLE_PROVIDER_PREFIX}%"),
            )
        )
        rows = result.scalars().all()
        records: list[OpenAICompatibleConfigRecord] = []
        for row in rows:
            if not row.provider.startswith(OPENAI_COMPATIBLE_PROVIDER_PREFIX):
                continue
            try:
                records.append(self._to_openai_compatible_record(row))
            except ValueError:
                logger.warning(
                    "Skip loading openai-compatible config for provider key '%s': invalid payload",
                    row.provider,
                )
        records.sort(key=lambda item: item.payload.model.lower())
        return records

    async def get_openai_compatible_config_by_model(
        self,
        user_id: str,
        model: str,
    ) -> OpenAICompatibleConfigRecord | None:
        parsed_user_id = self._parse_user_id(user_id)
        normalized_model = model.strip()
        provider_key = self._build_openai_compatible_provider_key(normalized_model)
        result = await self._session.execute(
            select(ProviderModel).where(
                ProviderModel.user_id == parsed_user_id,
                ProviderModel.provider == provider_key,
            )
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        try:
            record = self._to_openai_compatible_record(row)
        except ValueError:
            return None
        if record.payload.model.strip().lower() != normalized_model.lower():
            return None
        return record

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
        parsed_user_id = self._parse_user_id(user_id)
        normalized_model = model.strip()
        provider_key = self._build_openai_compatible_provider_key(normalized_model)
        result = await self._session.execute(
            select(ProviderModel).where(
                ProviderModel.user_id == parsed_user_id,
                ProviderModel.provider == provider_key,
            )
        )
        model_entity = result.scalar_one_or_none()
        if model_entity is None:
            return None

        payload = self._deserialize_openai_compatible_payload(model_entity.api_key)
        if payload.model.strip().lower() != normalized_model.lower():
            return None

        updated_payload = OpenAICompatibleConfigPayload(
            provider=provider.strip(),
            base_url=base_url.strip(),
            api_key=api_key.strip(),
            model=normalized_model,
            max_token=max_token,
            temperature=temperature,
        )
        model_entity.api_key = provider_key_cipher.encrypt(
            self._serialize_openai_compatible_payload(updated_payload)
        )
        await self._session.commit()
        await self._session.refresh(model_entity)
        return self._to_openai_compatible_record(model_entity)

    async def delete_openai_compatible_config(self, user_id: str, model: str) -> bool:
        parsed_user_id = self._parse_user_id(user_id)
        normalized_model = model.strip()
        provider_key = self._build_openai_compatible_provider_key(normalized_model)
        result = await self._session.execute(
            select(ProviderModel).where(
                ProviderModel.user_id == parsed_user_id,
                ProviderModel.provider == provider_key,
            )
        )
        model_entity = result.scalar_one_or_none()
        if model_entity is None:
            return False

        payload = self._deserialize_openai_compatible_payload(model_entity.api_key)
        if payload.model.strip().lower() != normalized_model.lower():
            return False

        await self._session.delete(model_entity)
        await self._session.commit()
        return True

    async def load_provider_api_keys_to_runtime(self) -> int:
        result = await self._session.execute(select(ProviderModel))
        models = result.scalars().all()
        loaded_count = 0
        provider_key_store.clear()

        for model in models:
            if model.provider.startswith(OPENAI_COMPATIBLE_PROVIDER_PREFIX):
                continue

            try:
                provider = ProviderName(model.provider)
            except ValueError:
                logger.warning("Skip loading provider key for unknown provider '%s'", model.provider)
                continue

            try:
                plain_api_key = provider_key_cipher.decrypt(model.api_key)
            except ValueError:
                logger.warning("Skip loading provider key for '%s': decrypt failed", model.provider)
                continue

            if model.user_id is None:
                logger.warning("Skip loading provider key for '%s': user_id is null", model.provider)
                continue

            provider_key_store.set_key(
                user_id=str(model.user_id),
                provider=provider,
                api_key=plain_api_key,
            )
            loaded_count += 1

        return loaded_count

    async def load_provider_api_keys_to_environment(self) -> int:
        # Backward-compatible alias; provider keys now load into in-memory key store.
        return await self.load_provider_api_keys_to_runtime()

    @staticmethod
    def _parse_user_id(user_id: str) -> uuid.UUID:
        try:
            return uuid.UUID(user_id.strip())
        except (ValueError, AttributeError) as exc:
            raise ValueError("Invalid user_id in provider persistence repository") from exc

    @staticmethod
    def _build_openai_compatible_provider_key(model: str) -> str:
        model_hash = hashlib.sha256(model.strip().lower().encode("utf-8")).hexdigest()[:20]
        return f"{OPENAI_COMPATIBLE_PROVIDER_PREFIX}{model_hash}"

    @staticmethod
    def _serialize_openai_compatible_payload(payload: OpenAICompatibleConfigPayload) -> str:
        return json.dumps(
            {
                "provider": payload.provider,
                "base_url": payload.base_url,
                "api_key": payload.api_key,
                "model": payload.model,
                "max_token": payload.max_token,
                "temperature": payload.temperature,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )

    def _deserialize_openai_compatible_payload(self, encrypted_payload: str) -> OpenAICompatibleConfigPayload:
        decrypted_payload = provider_key_cipher.decrypt(encrypted_payload)
        try:
            payload_data = json.loads(decrypted_payload)
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid openai-compatible payload") from exc

        provider = str(payload_data.get("provider", "")).strip()
        if provider != OPENAI_COMPATIBLE_PROVIDER:
            raise ValueError("Invalid openai-compatible provider")

        model = str(payload_data.get("model", "")).strip()
        base_url = str(payload_data.get("base_url", "")).strip()
        api_key = str(payload_data.get("api_key", "")).strip()
        if not model or not base_url or not api_key:
            raise ValueError("Invalid openai-compatible payload fields")

        max_token_raw = payload_data.get("max_token")
        temperature_raw = payload_data.get("temperature")
        max_token = int(max_token_raw) if max_token_raw is not None else None
        temperature = float(temperature_raw) if temperature_raw is not None else None
        return OpenAICompatibleConfigPayload(
            provider=OPENAI_COMPATIBLE_PROVIDER,
            base_url=base_url,
            api_key=api_key,
            model=model,
            max_token=max_token,
            temperature=temperature,
        )

    def _to_openai_compatible_record(self, model_entity: ProviderModel) -> OpenAICompatibleConfigRecord:
        payload = self._deserialize_openai_compatible_payload(model_entity.api_key)
        return OpenAICompatibleConfigRecord(
            id=model_entity.id,
            provider_key=model_entity.provider,
            payload=payload,
            created_at=model_entity.created_at,
            updated_at=model_entity.updated_at,
        )
