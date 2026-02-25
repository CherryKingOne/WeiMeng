from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.shared.infrastructure.database import engine, Base, create_database_if_not_exists
from src.shared.middleware.error_handler import register_exception_handlers
from src.shared.middleware.logging import LoggingMiddleware, setup_logging
from src.api.v1.router import router as v1_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_database_if_not_exists()
    
    async with engine.begin() as conn:
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
