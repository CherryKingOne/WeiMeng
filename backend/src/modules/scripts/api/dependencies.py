from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.scripts.application.services.script_app_service import ScriptAppService
from src.modules.scripts.infrastructure.repositories.script_repository import ScriptRepository
from src.shared.extensions.storage.minio_provider import MinIOProvider
from src.shared.infrastructure.database import get_db


async def get_script_repository(db: AsyncSession = Depends(get_db)) -> ScriptRepository:
    return ScriptRepository(db)


async def get_storage_provider() -> MinIOProvider:
    return MinIOProvider()


async def get_script_app_service(
    script_repo: ScriptRepository = Depends(get_script_repository),
    storage_provider: MinIOProvider = Depends(get_storage_provider),
) -> ScriptAppService:
    return ScriptAppService(
        script_repository=script_repo,
        storage_provider=storage_provider,
    )
