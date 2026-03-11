from threading import RLock

from src.modules.providers.domain.value_objects.provider_name import ProviderName


class ProviderKeyStore:
    def __init__(self):
        self._keys: dict[str, dict[ProviderName, str]] = {}
        self._lock = RLock()

    def set_key(
        self,
        user_id: str,
        provider: ProviderName,
        api_key: str,
    ) -> None:
        scoped_user_id = user_id.strip()
        value = api_key.strip()
        if not scoped_user_id or not value:
            return
        with self._lock:
            user_keys = self._keys.setdefault(scoped_user_id, {})
            user_keys[provider] = value

    def get_key(self, user_id: str, provider: ProviderName) -> str | None:
        scoped_user_id = user_id.strip()
        if not scoped_user_id:
            return None
        with self._lock:
            user_keys = self._keys.get(scoped_user_id)
            if user_keys is None:
                return None
            return user_keys.get(provider)

    def clear(self, user_id: str | None = None) -> None:
        with self._lock:
            if user_id is None:
                self._keys.clear()
                return
            scoped_user_id = user_id.strip()
            if not scoped_user_id:
                return
            self._keys.pop(scoped_user_id, None)


provider_key_store = ProviderKeyStore()
