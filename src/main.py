import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    """
    Main entry point to run the FastAPI backend server
    
    Usage:
        python main.py
        
    Or use uvicorn directly:
        uvicorn app.main:app --reload --port 7767
    """
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )
