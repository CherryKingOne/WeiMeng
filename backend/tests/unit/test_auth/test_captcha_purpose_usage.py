import asyncio

from src.modules.auth.application.dto.register_dto import RegisterRequest
from src.modules.auth.application.dto.reset_password_dto import ResetPasswordRequest
from src.modules.auth.application.services.register_service import RegisterService
from src.modules.auth.application.services.reset_password_service import ResetPasswordService
from src.modules.auth.domain.entities.user import User
from src.modules.captcha.domain.entities.captcha import Captcha


class FakeRedisRepository:
    def __init__(self):
        self._store: dict[str, str] = {}
        self.last_get_key: str | None = None
        self.last_delete_key: str | None = None

    async def get(self, key: str) -> str | None:
        self.last_get_key = key
        return self._store.get(key)

    async def delete(self, key: str) -> int:
        self.last_delete_key = key
        existed = key in self._store
        self._store.pop(key, None)
        return 1 if existed else 0


class FakeRegisterUserRepository:
    def __init__(self):
        self.saved_user: User | None = None

    async def exists_by_email(self, email: str) -> bool:
        return False

    async def save(self, user: User) -> User:
        self.saved_user = user
        return user


class FakeResetUserRepository:
    def __init__(self, user: User):
        self.user = user
        self.updated_user: User | None = None

    async def find_by_email(self, email: str) -> User | None:
        if email == self.user.email:
            return self.user
        return None

    async def update(self, user: User) -> User:
        self.updated_user = user
        return user


async def _test_register_service_reads_login_purpose_captcha_key():
    request = RegisterRequest(
        username="test_user",
        email="register@example.com",
        password="Password123",
        captcha="123456",
    )
    captcha_key = Captcha.build_redis_key(request.email, purpose="login")

    fake_redis = FakeRedisRepository()
    fake_redis._store[captcha_key] = request.captcha
    fake_user_repo = FakeRegisterUserRepository()
    service = RegisterService(fake_user_repo, fake_redis)

    await service.register(request)

    assert fake_redis.last_get_key == captcha_key
    assert fake_redis.last_delete_key == captcha_key


def test_register_service_reads_login_purpose_captcha_key():
    asyncio.run(_test_register_service_reads_login_purpose_captcha_key())


async def _test_reset_password_service_reads_forgot_password_purpose_captcha_key():
    request = ResetPasswordRequest(
        email="reset@example.com",
        captcha="654321",
        new_password="NewPassword123",
        confirm_password="NewPassword123",
    )
    captcha_key = Captcha.build_redis_key(request.email, purpose="forgot_password")

    fake_redis = FakeRedisRepository()
    fake_redis._store[captcha_key] = request.captcha
    fake_user = User.create(
        email=request.email,
        username="reset_user",
        hashed_password="old_password_hash",
    )
    fake_user_repo = FakeResetUserRepository(fake_user)
    service = ResetPasswordService(fake_user_repo, fake_redis)

    await service.reset_password(request)

    assert fake_redis.last_get_key == captcha_key
    assert fake_redis.last_delete_key == captcha_key


def test_reset_password_service_reads_forgot_password_purpose_captcha_key():
    asyncio.run(_test_reset_password_service_reads_forgot_password_purpose_captcha_key())
