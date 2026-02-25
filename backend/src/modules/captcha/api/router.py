from fastapi import APIRouter, Depends, status
from src.modules.captcha.application.services.email_captcha_service import EmailCaptchaService
from src.modules.captcha.application.dto.captcha_dto import CaptchaSendRequest, CaptchaSendResponse
from src.modules.captcha.api.dependencies import get_email_captcha_service

router = APIRouter(prefix="/api/v1/captcha", tags=["Captcha"])

@router.post("/email/send", response_model=CaptchaSendResponse, status_code=status.HTTP_200_OK)
async def send_email_captcha(
    request: CaptchaSendRequest,
    service: EmailCaptchaService = Depends(get_email_captcha_service)
):
    return await service.send_login_captcha(request)

@router.post("/email/forgot-password", response_model=CaptchaSendResponse, status_code=status.HTTP_200_OK)
async def send_forgot_password_captcha(
    request: CaptchaSendRequest,
    service: EmailCaptchaService = Depends(get_email_captcha_service)
):
    return await service.send_forgot_password_captcha(request)
