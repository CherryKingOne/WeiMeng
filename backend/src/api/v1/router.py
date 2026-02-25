from fastapi import APIRouter
from src.modules.auth.api.router import router as auth_router
from src.modules.captcha.api.router import router as captcha_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(captcha_router)
