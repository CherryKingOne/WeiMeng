import pytest

from src.shared.security.provider_key_cipher import ProviderKeyCipher


def test_provider_key_cipher_encrypt_and_decrypt_roundtrip():
    cipher = ProviderKeyCipher(encryption_key="unit-test-secret")

    encrypted = cipher.encrypt("test-provider-key")

    assert encrypted.startswith("enc:v1:")
    assert encrypted != "test-provider-key"
    assert cipher.decrypt(encrypted) == "test-provider-key"


def test_provider_key_cipher_supports_legacy_plain_text():
    cipher = ProviderKeyCipher(encryption_key="unit-test-secret")

    assert cipher.decrypt("legacy-plain-key") == "legacy-plain-key"


def test_provider_key_cipher_raises_for_invalid_encrypted_text():
    cipher = ProviderKeyCipher(encryption_key="unit-test-secret")

    with pytest.raises(ValueError):
        cipher.decrypt("enc:v1:not-a-valid-token")
