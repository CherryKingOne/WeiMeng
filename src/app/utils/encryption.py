import random
import string
import base64
from cryptography.fernet import Fernet
from app.core.config import settings


# Generate Fernet key from SECRET_KEY
key = base64.urlsafe_b64encode(settings.SECRET_KEY.encode()[:32].ljust(32, b'0'))
cipher_suite = Fernet(key)


def generate_wm_id() -> str:
    """生成 wm + 20位数字 的ID"""
    digits = ''.join(random.choices(string.digits, k=20))
    return f"wm{digits}"


def encrypt_key(raw_key: str) -> str:
    """加密API Key"""
    return cipher_suite.encrypt(raw_key.encode()).decode()


def decrypt_key(encrypted_key: str) -> str:
    """解密API Key"""
    return cipher_suite.decrypt(encrypted_key.encode()).decode()
