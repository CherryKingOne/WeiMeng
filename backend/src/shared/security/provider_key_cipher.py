import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from config.settings import settings


class ProviderKeyCipher:
    _PREFIX = "enc:v1:"

    def __init__(self, encryption_key: str | None = None):
        key_material = (encryption_key or settings.provider_key_encryption_key or settings.secret_key).strip()
        if not key_material:
            raise ValueError("Provider key encryption key is empty")

        digest = hashlib.sha256(key_material.encode("utf-8")).digest()
        fernet_key = base64.urlsafe_b64encode(digest)
        self._fernet = Fernet(fernet_key)

    def encrypt(self, plain_text: str) -> str:
        value = plain_text.strip()
        token = self._fernet.encrypt(value.encode("utf-8")).decode("utf-8")
        return f"{self._PREFIX}{token}"

    def decrypt(self, cipher_text: str) -> str:
        if not cipher_text:
            return ""

        if not cipher_text.startswith(self._PREFIX):
            # Backward compatibility for legacy plain-text rows.
            return cipher_text

        token = cipher_text[len(self._PREFIX) :].encode("utf-8")
        try:
            return self._fernet.decrypt(token).decode("utf-8")
        except InvalidToken as exc:
            raise ValueError("Provider API key decryption failed") from exc


provider_key_cipher = ProviderKeyCipher()
