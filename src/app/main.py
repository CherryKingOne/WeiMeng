import uvicorn
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db

# Import routers
from app.api.v1 import auth, script, media, scriptwriting, model_config
from app.api.v3 import chat

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI Script Engine - Backend API for AI-powered script and storyboard generation",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(script.router, prefix="/api/v1/script", tags=["Script & Files"])
app.include_router(media.router, prefix="/api/v1/media", tags=["AI Media"])
app.include_router(scriptwriting.router, prefix="/api/v1/scriptwriting", tags=["Scriptwriting"])
app.include_router(model_config.router, prefix="/api/v2/model_config", tags=["Model Config"])
app.include_router(chat.router, prefix="/api/v3/chat", tags=["AI Chat"])


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Welcome to AI Script Engine API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting AI Script Engine...")
    print(f"📊 Initializing database...")
    await init_db()
    print("✅ Database initialized successfully")
    print(f"🌐 Server running on http://0.0.0.0:{settings.API_PORT}")
    print(f"📖 API docs available at http://0.0.0.0:{settings.API_PORT}/docs")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=True
    )
