from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.providers.application.services.chat_service import ChatService
from src.modules.providers.application.services.model_generation_service import (
    ModelGenerationService,
)
from src.modules.providers.application.services.openai_compatible_config_management_service import (
    OpenAICompatibleConfigManagementService,
)
from src.modules.providers.application.services.provider_config_management_service import (
    ProviderConfigManagementService,
)
from src.modules.providers.application.services.system_model_config_service import (
    SystemModelConfigService,
)
from src.modules.providers.domain.repositories import IProviderConfigRepository
from src.modules.providers.infrastructure.repositories.provider_config_repository import (
    EnvironmentProviderConfigRepository,
)
from src.modules.providers.infrastructure.repositories.provider_persistence_repository import (
    ProviderPersistenceRepository,
)
from src.modules.providers.infrastructure.repositories.system_model_config_repository import (
    SystemModelConfigRepository,
)
from src.shared.common.dependencies import get_current_user_id
from src.shared.infrastructure.database import get_db


def get_provider_config_repository(
    current_user_id: str = Depends(get_current_user_id),
) -> IProviderConfigRepository:
    return EnvironmentProviderConfigRepository(user_id=current_user_id)


async def get_provider_persistence_repository(
    db: AsyncSession = Depends(get_db),
) -> ProviderPersistenceRepository:
    return ProviderPersistenceRepository(db)


async def get_model_generation_service(
    current_user_id: str = Depends(get_current_user_id),
    provider_config_repository: IProviderConfigRepository = Depends(get_provider_config_repository),
    provider_persistence_repository: ProviderPersistenceRepository = Depends(
        get_provider_persistence_repository
    ),
) -> ModelGenerationService:
    return ModelGenerationService(
        provider_config_repository=provider_config_repository,
        provider_persistence_repository=provider_persistence_repository,
        user_id=current_user_id,
    )


async def get_provider_config_management_service(
    current_user_id: str = Depends(get_current_user_id),
    provider_persistence_repository: ProviderPersistenceRepository = Depends(
        get_provider_persistence_repository
    ),
) -> ProviderConfigManagementService:
    return ProviderConfigManagementService(
        provider_persistence_repository=provider_persistence_repository,
        user_id=current_user_id,
    )


async def get_openai_compatible_config_management_service(
    current_user_id: str = Depends(get_current_user_id),
    provider_persistence_repository: ProviderPersistenceRepository = Depends(
        get_provider_persistence_repository
    ),
) -> OpenAICompatibleConfigManagementService:
    return OpenAICompatibleConfigManagementService(
        provider_persistence_repository=provider_persistence_repository,
        user_id=current_user_id,
    )


async def get_system_model_config_repository(
    db: AsyncSession = Depends(get_db),
) -> SystemModelConfigRepository:
    return SystemModelConfigRepository(db)


async def get_chat_service(
    current_user_id: str = Depends(get_current_user_id),
    provider_config_repository: IProviderConfigRepository = Depends(get_provider_config_repository),
    provider_persistence_repository: ProviderPersistenceRepository = Depends(
        get_provider_persistence_repository
    ),
    system_model_config_repository: SystemModelConfigRepository = Depends(
        get_system_model_config_repository
    ),
) -> ChatService:
    return ChatService(
        user_id=current_user_id,
        provider_config_repository=provider_config_repository,
        provider_persistence_repository=provider_persistence_repository,
        system_model_config_repository=system_model_config_repository,
    )


async def get_system_model_config_service(
    current_user_id: str = Depends(get_current_user_id),
    provider_config_repository: IProviderConfigRepository = Depends(get_provider_config_repository),
    provider_persistence_repository: ProviderPersistenceRepository = Depends(
        get_provider_persistence_repository
    ),
    system_model_config_repository: SystemModelConfigRepository = Depends(
        get_system_model_config_repository
    ),
) -> SystemModelConfigService:
    return SystemModelConfigService(
        user_id=current_user_id,
        provider_config_repository=provider_config_repository,
        provider_persistence_repository=provider_persistence_repository,
        system_model_config_repository=system_model_config_repository,
    )
