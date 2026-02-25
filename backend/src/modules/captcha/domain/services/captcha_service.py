from src.modules.captcha.domain.entities.captcha import Captcha
from src.shared.common.utils import generate_random_code

class CaptchaDomainService:
    @staticmethod
    def generate_code(length: int = 6) -> str:
        return generate_random_code(length)
    
    @staticmethod
    def create_captcha(email: str, ttl: int = 300, purpose: str = "general") -> Captcha:
        code = CaptchaDomainService.generate_code()
        return Captcha.create(
            email=email,
            code=code,
            ttl=ttl,
            purpose=purpose
        )

captcha_domain_service = CaptchaDomainService()
