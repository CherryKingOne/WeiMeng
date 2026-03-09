from src.modules.captcha.domain.entities.captcha import Captcha


def test_captcha_redis_key_contains_purpose_and_normalized_email():
    captcha = Captcha.create(
        email="User@Example.com",
        code="123456",
        purpose="Forgot_Password",
    )
    assert captcha.redis_key == "captcha:forgot_password:user@example.com"


def test_build_redis_key_uses_general_when_purpose_is_blank():
    redis_key = Captcha.build_redis_key("demo@example.com", purpose="  ")
    assert redis_key == "captcha:general:demo@example.com"
