from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from src.shared.infrastructure.database import engine, Base, create_database_if_not_exists
from src.shared.middleware.error_handler import register_exception_handlers
from src.shared.middleware.logging import LoggingMiddleware, setup_logging
from src.api.v1.router import router as v1_router


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_database_if_not_exists()
    
    async with engine.begin() as conn:
        await conn.execute(text(SCRIPT_LIBRARY_MAPPING_SCHEMA_MIGRATION_SQL))
        await conn.execute(text(SCRIPT_CHUNK_REFERENCE_SCHEMA_MIGRATION_SQL))
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="WeiMeng Agent Backend",
    description="Based on DDD Architecture",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
