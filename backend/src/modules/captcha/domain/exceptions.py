from src.shared.domain.exceptions import DomainException

class CaptchaExpiredException(DomainException):
    def __init__(self):
        super().__init__(
            message="验证码已过期",
            code=400,
            detail="Captcha code has expired, please request a new one"
        )

class CaptchaInvalidException(DomainException):
    def __init__(self):
        super().__init__(
            message="验证码错误",
            code=400,
            detail="Invalid captcha code"
        )

class CaptchaSendFailedException(DomainException):
    def __init__(self, detail: str = None):
        super().__init__(
            message="验证码发送失败",
            code=500,
            detail=detail
        )
