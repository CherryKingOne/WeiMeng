from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from src.modules.scripts.application.services.script_app_service import ScriptAppService
from src.modules.scripts.infrastructure.repositories.script_repository import ScriptRepository
from src.modules.scripts.infrastructure.services.elasticsearch_chunk_store import (
    ElasticsearchChunkStore,
)
from src.modules.scripts.infrastructure.services.file_text_extractor import FileTextExtractor
from src.modules.scripts.infrastructure.services.script_chunker import ScriptSentenceWindowTextSplitter
from src.shared.extensions.storage.minio_provider import MinIOProvider
from src.shared.infrastructure.database import get_db


async def get_script_repository(db: AsyncSession = Depends(get_db)) -> ScriptRepository:
    return ScriptRepository(db)


async def get_storage_provider() -> MinIOProvider:
    return MinIOProvider()


async def get_script_chunk_store() -> ElasticsearchChunkStore:
    return ElasticsearchChunkStore()


async def get_file_text_extractor() -> FileTextExtractor:
    return FileTextExtractor()


async def get_script_chunker() -> ScriptSentenceWindowTextSplitter:
    chunk_size = max(1, settings.scripts_chunk_size)
    chunk_overlap = max(0, settings.scripts_chunk_overlap)
    if chunk_overlap >= chunk_size:
        chunk_overlap = max(0, chunk_size - 1)
    return ScriptSentenceWindowTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )


async def get_script_app_service(
    script_repo: ScriptRepository = Depends(get_script_repository),
    storage_provider: MinIOProvider = Depends(get_storage_provider),
    script_chunk_store: ElasticsearchChunkStore = Depends(get_script_chunk_store),
    file_text_extractor: FileTextExtractor = Depends(get_file_text_extractor),
    script_chunker: ScriptSentenceWindowTextSplitter = Depends(get_script_chunker),
) -> ScriptAppService:
    return ScriptAppService(
        script_repository=script_repo,
        storage_provider=storage_provider,
        script_chunk_store=script_chunk_store,
        file_text_extractor=file_text_extractor,
        script_chunker=script_chunker,
        upload_max_text_length=max(1, settings.scripts_upload_max_text_length),
    )
