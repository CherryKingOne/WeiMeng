from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for all models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Import all models here to ensure they are registered
        from app.models import user, script, verification_code, chat
        # Attempt lightweight in-place migrations for BIGINT columns
        try:
            await conn.execute(text("ALTER TABLE script_libraries ALTER COLUMN id TYPE BIGINT"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE script_files ALTER COLUMN library_id TYPE BIGINT"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE script_files ALTER COLUMN id TYPE BIGINT"))
        except Exception:
            pass
        # Add type column to script_libraries if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE script_libraries ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'novel'"))
        except Exception:
            pass

        # Add model_type column to model_configs if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE model_configs ADD COLUMN IF NOT EXISTS model_type VARCHAR(50) NOT NULL DEFAULT 'LLM'"))
        except Exception:
            pass

        # Add default_models column to users if it doesn't exist (JSONB type)
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS default_models JSONB"))
        except Exception:
            pass

        # Add local_model_config_id column to script_libraries if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE script_libraries ADD COLUMN IF NOT EXISTS local_model_config_id VARCHAR(64)"))
        except Exception:
            pass

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
