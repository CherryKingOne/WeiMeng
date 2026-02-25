from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.engine.url import make_url
import asyncpg
from config.settings import settings

async def create_database_if_not_exists():
    db_url = make_url(settings.database.url)
    target_db_name = db_url.database
    
    user = db_url.username
    password = db_url.password
    host = db_url.host
    port = db_url.port
    
    try:
        sys_conn = await asyncpg.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database='postgres',
            ssl='disable'
        )
        
        exists = await sys_conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            target_db_name
        )
        
        if not exists:
            print(f"Database '{target_db_name}' does not exist. Creating...")
            await sys_conn.execute(f'CREATE DATABASE "{target_db_name}"')
            print(f"Database '{target_db_name}' created successfully.")
            
        await sys_conn.close()
        
    except Exception as e:
        print(f"Warning: Failed to check/create database '{target_db_name}': {e}")

engine = create_async_engine(
    settings.database.url,
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    connect_args={
        "ssl": "disable"
    }
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
