import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from config.settings import settings
from src.modules.providers.infrastructure.repositories.provider_persistence_repository import (
    ProviderPersistenceRepository,
)
from src.shared.infrastructure.database import (
    AsyncSessionLocal,
    Base,
    create_database_if_not_exists,
    engine,
)
from src.shared.middleware.error_handler import register_exception_handlers
from src.shared.middleware.logging import LoggingMiddleware, setup_logging
from src.api.v1.router import router as v1_router

logger = logging.getLogger(__name__)


SCRIPT_LIBRARY_MAPPING_SCHEMA_MIGRATION_SQL = """
DO $$
DECLARE
    pkey_name TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'script_library_scripts'
    ) THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'script_library_scripts'
          AND column_name = 'id'
    ) THEN
        RETURN;
    END IF;

    SELECT conname
    INTO pkey_name
    FROM pg_constraint
    WHERE conrelid = 'public.script_library_scripts'::regclass
      AND contype = 'p'
    LIMIT 1;

    IF pkey_name IS NOT NULL THEN
        EXECUTE format(
            'ALTER TABLE public.script_library_scripts DROP CONSTRAINT %I',
            pkey_name
        );
    END IF;

    ALTER TABLE public.script_library_scripts
        ADD CONSTRAINT script_library_scripts_pkey PRIMARY KEY (library_id, script_id);

    ALTER TABLE public.script_library_scripts
        DROP COLUMN id;
END $$;
"""

SCRIPT_CHUNK_REFERENCE_SCHEMA_MIGRATION_SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'script_chunks'
    ) THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'script_chunks'
          AND column_name = 'content'
    ) THEN
        ALTER TABLE public.script_chunks DROP COLUMN content;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'script_chunks'
          AND column_name = 'chunk_size'
    ) THEN
        ALTER TABLE public.script_chunks DROP COLUMN chunk_size;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'script_chunks'
          AND column_name = 'start_index'
    ) THEN
        ALTER TABLE public.script_chunks DROP COLUMN start_index;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'script_chunks'
          AND column_name = 'end_index'
    ) THEN
        ALTER TABLE public.script_chunks DROP COLUMN end_index;
    END IF;
END $$;
"""

SCRIPT_LIBRARY_AVATAR_SCHEMA_MIGRATION_SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'script_libraries'
    ) THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'script_libraries'
          AND column_name = 'avatar_path'
    ) THEN
        ALTER TABLE public.script_libraries
            ADD COLUMN avatar_path TEXT;
    END IF;
END $$;
"""

PROVIDER_USER_SCHEMA_MIGRATION_SQL = """
DO $$
DECLARE
    provider_only_unique_name TEXT;
    null_user_count BIGINT;
    single_user_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'providers'
    ) THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'providers'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN user_id UUID;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'users'
    ) AND (
        SELECT COUNT(*) FROM public.users
    ) = 1 THEN
        SELECT id INTO single_user_id FROM public.users LIMIT 1;
        UPDATE public.providers
        SET user_id = single_user_id
        WHERE user_id IS NULL;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'users'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.providers'::regclass
          AND conname = 'providers_user_id_fkey'
    ) THEN
        ALTER TABLE public.providers
            ADD CONSTRAINT providers_user_id_fkey
            FOREIGN KEY (user_id)
            REFERENCES public.users(id)
            ON DELETE CASCADE;
    END IF;

    SELECT c.conname
    INTO provider_only_unique_name
    FROM pg_constraint c
    WHERE c.conrelid = 'public.providers'::regclass
      AND c.contype = 'u'
      AND (
            SELECT array_agg((a.attname)::text ORDER BY k.ordinality)
            FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality)
            JOIN pg_attribute a
              ON a.attrelid = c.conrelid
             AND a.attnum = k.attnum
      ) = ARRAY['provider']::TEXT[]
    LIMIT 1;

    IF provider_only_unique_name IS NOT NULL THEN
        EXECUTE format(
            'ALTER TABLE public.providers DROP CONSTRAINT %I',
            provider_only_unique_name
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.providers'::regclass
          AND conname = 'providers_user_provider_key'
    ) THEN
        ALTER TABLE public.providers
            ADD CONSTRAINT providers_user_provider_key UNIQUE (user_id, provider);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_class i
        JOIN pg_namespace n ON n.oid = i.relnamespace
        WHERE i.relname = 'ix_providers_user_id'
          AND i.relkind = 'i'
          AND n.nspname = 'public'
    ) THEN
        CREATE INDEX ix_providers_user_id ON public.providers (user_id);
    END IF;

    SELECT COUNT(*)
    INTO null_user_count
    FROM public.providers
    WHERE user_id IS NULL;

    IF null_user_count = 0 THEN
        ALTER TABLE public.providers
            ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;
"""

SYSTEM_MODEL_CONFIG_SCHEMA_MIGRATION_SQL = """
DO $$
DECLARE
    user_only_unique_name TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'system_model_configs'
    ) THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'system_model_configs'
          AND column_name = 'model_type'
    ) THEN
        ALTER TABLE public.system_model_configs
            ADD COLUMN model_type VARCHAR(16);
    END IF;

    UPDATE public.system_model_configs
    SET model_type = 'text'
    WHERE model_type IS NULL OR BTRIM(model_type) = '';

    ALTER TABLE public.system_model_configs
        ALTER COLUMN model_type SET NOT NULL;

    SELECT c.conname
    INTO user_only_unique_name
    FROM pg_constraint c
    WHERE c.conrelid = 'public.system_model_configs'::regclass
      AND c.contype = 'u'
      AND (
            SELECT array_agg((a.attname)::text ORDER BY k.ordinality)
            FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality)
            JOIN pg_attribute a
              ON a.attrelid = c.conrelid
             AND a.attnum = k.attnum
      ) = ARRAY['user_id']::TEXT[]
    LIMIT 1;

    IF user_only_unique_name IS NOT NULL THEN
        EXECUTE format(
            'ALTER TABLE public.system_model_configs DROP CONSTRAINT %I',
            user_only_unique_name
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.system_model_configs'::regclass
          AND conname = 'system_model_configs_user_id_model_type_key'
    ) THEN
        ALTER TABLE public.system_model_configs
            ADD CONSTRAINT system_model_configs_user_id_model_type_key UNIQUE (user_id, model_type);
    END IF;
END $$;
"""


async def _load_provider_api_keys_from_database() -> None:
    try:
        async with AsyncSessionLocal() as session:
            repository = ProviderPersistenceRepository(session)
            loaded_count = await repository.load_provider_api_keys_to_runtime()
        if loaded_count > 0:
            logger.info("Loaded %s provider API key records from database into runtime store", loaded_count)
    except Exception:
        logger.exception("Failed to load provider API key records from database")


def _parse_cors_origins(value: str) -> list[str]:
    origins = [item.strip() for item in value.split(",") if item.strip()]
    return origins if origins else ["*"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_database_if_not_exists()
    
    async with engine.begin() as conn:
        await conn.execute(text(SCRIPT_LIBRARY_MAPPING_SCHEMA_MIGRATION_SQL))
        await conn.execute(text(SCRIPT_CHUNK_REFERENCE_SCHEMA_MIGRATION_SQL))
        await conn.execute(text(SCRIPT_LIBRARY_AVATAR_SCHEMA_MIGRATION_SQL))
        await conn.execute(text(PROVIDER_USER_SCHEMA_MIGRATION_SQL))
        await conn.execute(text(SYSTEM_MODEL_CONFIG_SCHEMA_MIGRATION_SQL))
        await conn.run_sync(Base.metadata.create_all)
    await _load_provider_api_keys_from_database()
    yield

app = FastAPI(
    title="WeiMeng Backend",
    description="Based on DDD Architecture",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

cors_origins = _parse_cors_origins(settings.cors_allow_origins)
allow_credentials = settings.cors_allow_credentials and cors_origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_logging()
app.add_middleware(LoggingMiddleware)

register_exception_handlers(app)

app.include_router(v1_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "weimeng-agent-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5607, reload=True)
