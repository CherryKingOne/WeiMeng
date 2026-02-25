from fastapi import APIRouter, Depends, status
from src.modules.auth.application.services.login_service import LoginService
from src.modules.auth.application.services.register_service import RegisterService
from src.modules.auth.application.services.reset_password_service import ResetPasswordService
from src.modules.auth.application.dto.login_dto import LoginRequest, TokenResponse
from src.modules.auth.application.dto.register_dto import RegisterRequest, RegisterResponse
from src.modules.auth.application.dto.reset_password_dto import ResetPasswordRequest, ResetPasswordResponse
from src.modules.auth.api.dependencies import (
    get_login_service,
    get_register_service,
    get_reset_password_service
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    service: LoginService = Depends(get_login_service)
):
    return await service.login(request)

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    service: RegisterService = Depends(get_register_service)
):
    return await service.register(request)

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    service: ResetPasswordService = Depends(get_reset_password_service)
):
    return await service.reset_password(request)
