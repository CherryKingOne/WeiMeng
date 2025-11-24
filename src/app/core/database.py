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
        from app.models import user, script, verification_code
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

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
