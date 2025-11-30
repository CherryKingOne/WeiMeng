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
    from app.models import user, script, verification_code, chat, model_config, scriptwriting, shot_text
    
    # First, create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Then, run migrations in separate transactions to avoid transaction abort issues
    async with AsyncSessionLocal() as session:
        try:
            # Attempt lightweight in-place migrations for BIGINT columns
            try:
                await session.execute(text("ALTER TABLE script_libraries ALTER COLUMN id TYPE BIGINT"))
                await session.commit()
            except Exception:
                await session.rollback()
            
            try:
                await session.execute(text("ALTER TABLE script_files ALTER COLUMN library_id TYPE BIGINT"))
                await session.commit()
            except Exception:
                await session.rollback()
                
            try:
                await session.execute(text("ALTER TABLE script_files ALTER COLUMN id TYPE BIGINT"))
                await session.commit()
            except Exception:
                await session.rollback()
            
            # Add type column to script_libraries if it doesn't exist
            try:
                await session.execute(text("ALTER TABLE script_libraries ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'novel'"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add model_type column to model_configs if it doesn't exist
            try:
                await session.execute(text("ALTER TABLE model_configs ADD COLUMN IF NOT EXISTS model_type VARCHAR(50) NOT NULL DEFAULT 'LLM'"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add default_models column to users if it doesn't exist (JSONB type)
            try:
                await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS default_models JSONB"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add local_model_config_id column to script_libraries if it doesn't exist
            try:
                await session.execute(text("ALTER TABLE script_libraries ADD COLUMN IF NOT EXISTS local_model_config_id VARCHAR(64)"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add file_size column to script_files if it doesn't exist
            try:
                await session.execute(text("ALTER TABLE script_files ADD COLUMN IF NOT EXISTS file_size BIGINT"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add account column to users if it doesn't exist
            try:
                await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS account VARCHAR(50)"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add username column to users if it doesn't exist
            try:
                await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add updated_at column to users if it doesn't exist
            try:
                await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Update existing users: set account = email and username = email prefix if NULL
            try:
                await session.execute(text("""
                    UPDATE users
                    SET account = email
                    WHERE account IS NULL
                """))
                await session.commit()
            except Exception:
                await session.rollback()

            try:
                await session.execute(text("""
                    UPDATE users
                    SET username = SPLIT_PART(email, '@', 1)
                    WHERE username IS NULL
                """))
                await session.commit()
            except Exception:
                await session.rollback()

            # Add unique constraint and index for account
            try:
                await session.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_account ON users(account)"))
                await session.commit()
            except Exception:
                await session.rollback()

            # Set NOT NULL constraint after data migration
            try:
                await session.execute(text("ALTER TABLE users ALTER COLUMN account SET NOT NULL"))
                await session.commit()
            except Exception:
                await session.rollback()

            try:
                await session.execute(text("ALTER TABLE users ALTER COLUMN username SET NOT NULL"))
                await session.commit()
            except Exception:
                await session.rollback()

        except Exception as e:
            print(f"Database migration error: {e}")
            await session.rollback()
        finally:
            await session.close()
