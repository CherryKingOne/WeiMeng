import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.infrastructure.models.provider_model import ProviderModel
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

    async def load_provider_api_keys_to_runtime(self) -> int:
        result = await self._session.execute(select(ProviderModel))
        models = result.scalars().all()
        loaded_count = 0
        provider_key_store.clear()

        for model in models:
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
