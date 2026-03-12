import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.providers.domain.value_objects.provider_name import ProviderName
from src.modules.providers.domain.value_objects.system_model_type import SystemModelType
from src.modules.providers.infrastructure.models.system_model_config_model import (
    SystemModelConfigModel,
)


class SystemModelConfigRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def upsert(
        self,
        user_id: str,
        model_type: SystemModelType,
        provider: ProviderName,
        model_name: str,
    ) -> tuple[SystemModelConfigModel, bool]:
        parsed_user_id = self._parse_user_id(user_id)
        result = await self._session.execute(
            select(SystemModelConfigModel).where(
                SystemModelConfigModel.user_id == parsed_user_id,
                SystemModelConfigModel.model_type == model_type.value,
            )
        )
        model = result.scalar_one_or_none()
        created = model is None

        if model is None:
            model = SystemModelConfigModel(
                user_id=parsed_user_id,
                model_type=model_type.value,
                provider=provider.value,
                model_name=model_name,
            )
            self._session.add(model)
        else:
            model.model_type = model_type.value
            model.provider = provider.value
            model.model_name = model_name

        await self._session.commit()
        await self._session.refresh(model)
        return model, created

    async def get_by_user_id_and_type(
        self,
        user_id: str,
        model_type: SystemModelType,
    ) -> SystemModelConfigModel | None:
        parsed_user_id = self._parse_user_id(user_id)
        result = await self._session.execute(
            select(SystemModelConfigModel).where(
                SystemModelConfigModel.user_id == parsed_user_id,
                SystemModelConfigModel.model_type == model_type.value,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _parse_user_id(user_id: str) -> uuid.UUID:
        try:
            return uuid.UUID(user_id.strip())
        except (ValueError, AttributeError) as exc:
            raise ValueError("Invalid user_id in system model config repository") from exc
