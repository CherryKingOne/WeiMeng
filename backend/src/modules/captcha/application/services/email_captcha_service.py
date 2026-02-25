from pathlib import Path
from src.modules.captcha.domain.entities.captcha import Captcha
from src.modules.captcha.domain.repositories import ICaptchaRepository
from src.modules.captcha.domain.services.captcha_service import captcha_domain_service
from src.modules.captcha.domain.exceptions import CaptchaSendFailedException
from src.modules.captcha.application.dto.captcha_dto import CaptchaSendRequest, CaptchaSendResponse
from src.shared.extensions.email.sender import email_sender
from config.settings import settings

class EmailCaptchaService:
    def __init__(self, captcha_repository: ICaptchaRepository):
        self._captcha_repository = captcha_repository
        self._email_sender = email_sender
        self._captcha_service = captcha_domain_service
    
    def _get_logo_path(self) -> Path:
        base_dir = Path(__file__).resolve().parents[6]
        return base_dir / "frontend/public/logo/logo-Icon-light.png"
    
    def _build_email_content(self, code: str, purpose: str) -> tuple[str, str, str]:
        if purpose == "forgot_password":
            subject = f"{settings.email.from_name} 重置密码验证码"
            heading = "重置密码"
            intro_text = "您请求重置密码。您的一次性验证码是："
            footer_text = "此验证码将在 5 分钟后过期。"
            footer_note = "如果您没有请求重置密码，请忽略此邮件。"
        else:
            subject = f"{settings.email.from_name} 登录验证码"
            heading = "登录验证"
            intro_text = "您请求登录。您的一次性验证码是："
            footer_text = "此验证码将在 5 分钟后过期。"
            footer_note = "如果您没有请求登录，请忽略此邮件。"
        
        html_content = self._build_html_template(code, heading, intro_text, footer_text, footer_note)
        text_content = f"{heading}\n\n{intro_text}\n{code}\n\n{footer_text}\n{footer_note}"
        
        return subject, html_content, text_content
    
    def _build_html_template(
        self,
        code: str,
        heading: str,
        intro_text: str,
        footer_text: str,
        footer_note: str
    ) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{heading}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111827;">
            <div style="max-width: 480px; margin: 40px auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <div style="margin-bottom: 24px;">
                    <img src="cid:logo" alt="{settings.email.from_name} Logo" style="width: 48px; height: 48px; display: block; border-radius: 8px;">
                </div>
                
                <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">{heading}</h1>
                
                <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                    {intro_text}
                </p>
                
                <div style="margin-bottom: 24px; font-size: 32px; font-weight: 500; letter-spacing: 4px; color: #111827;">
                    {code}
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                    {footer_text}
                </p>
                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                    {footer_note}
                </p>
            </div>
        </body>
        </html>
        """
    
    async def send_captcha(
        self,
        request: CaptchaSendRequest,
        purpose: str = "login"
    ) -> CaptchaSendResponse:
        captcha = self._captcha_service.create_captcha(
            email=request.email,
            ttl=300,
            purpose=purpose
        )
        
        await self._captcha_repository.save(captcha)
        
        subject, html_content, text_content = self._build_email_content(
            captcha.code, purpose
        )
        
        logo_path = self._get_logo_path()
        
        success = await self._email_sender.send(
            to_email=request.email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            logo_path=logo_path
        )
        
        if not success:
            raise CaptchaSendFailedException()
        
        return CaptchaSendResponse(message="验证码已发送，请查收邮件")
    
    async def send_login_captcha(self, request: CaptchaSendRequest) -> CaptchaSendResponse:
        return await self.send_captcha(request, purpose="login")
    
    async def send_forgot_password_captcha(self, request: CaptchaSendRequest) -> CaptchaSendResponse:
        return await self.send_captcha(request, purpose="forgot_password")
