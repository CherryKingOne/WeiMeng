import asyncio

import pytest

from src.modules.captcha.application.dto.captcha_dto import CaptchaSendRequest
from src.modules.captcha.application.services.email_captcha_service import EmailCaptchaService
from src.modules.captcha.domain.entities.captcha import Captcha
from src.modules.captcha.domain.exceptions import CaptchaSendFailedException


class FakeCaptchaRepository:
    def __init__(self, save_result: bool = True):
        self.save_result = save_result
        self.saved_captcha: Captcha | None = None
        self.deleted: list[tuple[str, str]] = []

    async def save(self, captcha: Captcha) -> bool:
        self.saved_captcha = captcha
        return self.save_result

    async def find_by_email(self, email: str, purpose: str = "general") -> str | None:
        return None

    async def delete(self, email: str, purpose: str = "general") -> bool:
        self.deleted.append((email, purpose))
        return True

    async def exists(self, email: str, purpose: str = "general") -> bool:
        return False


class FakeEmailSender:
    def __init__(self, should_succeed: bool):
        self.should_succeed = should_succeed
        self.call_count = 0

    async def send(self, **kwargs) -> bool:
        self.call_count += 1
        return self.should_succeed


async def _test_send_captcha_rolls_back_when_email_send_fails():
    repository = FakeCaptchaRepository(save_result=True)
    service = EmailCaptchaService(repository)
    service._email_sender = FakeEmailSender(should_succeed=False)

    with pytest.raises(CaptchaSendFailedException):
        await service.send_captcha(
            request=CaptchaSendRequest(email="rollback@example.com"),
            purpose="forgot_password",
        )

    assert repository.deleted == [("rollback@example.com", "forgot_password")]


def test_send_captcha_rolls_back_when_email_send_fails():
    asyncio.run(_test_send_captcha_rolls_back_when_email_send_fails())


async def _test_send_captcha_fails_when_save_fails():
    repository = FakeCaptchaRepository(save_result=False)
    service = EmailCaptchaService(repository)
    email_sender = FakeEmailSender(should_succeed=True)
    service._email_sender = email_sender

    with pytest.raises(CaptchaSendFailedException):
        await service.send_captcha(
            request=CaptchaSendRequest(email="savefail@example.com"),
            purpose="login",
        )

    assert email_sender.call_count == 0
    assert repository.deleted == []


def test_send_captcha_fails_when_save_fails():
    asyncio.run(_test_send_captcha_fails_when_save_fails())
