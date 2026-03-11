import json
import time
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request


class OpenAICompatibleModelCatalogProvider:
    MODELS_ENDPOINT = ""
    CACHE_SECONDS = 300
    DEFAULT_MODEL = ""
    FALLBACK_MODELS: tuple[str, ...] = ()

    _models_cache: tuple[str, ...] | None = None
    _cache_expires_at: float = 0.0

    def fetch_supported_models(self, api_key: str | None) -> tuple[str, ...]:
        fallback = self._normalize_fallback_models()
        if not api_key:
            return fallback

        now = time.time()
        cache = self.__class__._models_cache
        expires_at = self.__class__._cache_expires_at
        if cache is not None and now < expires_at:
            return cache

        models = fallback
        payload = self._request_json(self.MODELS_ENDPOINT, api_key)
        if payload is not None:
            parsed_models = self._extract_model_ids(payload)
            if parsed_models:
                models = parsed_models

        self.__class__._models_cache = models
        self.__class__._cache_expires_at = now + self.CACHE_SECONDS
        return models

    def fetch_model_detail(self, api_key: str | None, model_id: str) -> dict[str, object] | None:
        model = model_id.strip()
        if not model or not api_key:
            return None

        endpoint = self._build_model_detail_endpoint(model)
        payload = self._request_json(endpoint, api_key)
        if payload is None:
            return None
        return self._extract_model_detail(payload, model)

    def _request_json(self, endpoint: str, api_key: str) -> object | None:
        try:
            request = urllib_request.Request(
                endpoint,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Accept": "application/json",
                },
                method="GET",
            )
            with urllib_request.urlopen(request, timeout=8) as response:
                return json.loads(response.read().decode("utf-8"))
        except (
            urllib_error.URLError,
            urllib_error.HTTPError,
            TimeoutError,
            json.JSONDecodeError,
            ValueError,
        ):
            return None

    def _build_model_detail_endpoint(self, model_id: str) -> str:
        return f"{self.MODELS_ENDPOINT.rstrip('/')}/{urllib_parse.quote(model_id, safe='')}"

    def _extract_model_detail(self, payload: object, model_id: str) -> dict[str, object] | None:
        if not isinstance(payload, dict):
            return None

        if isinstance(payload.get("error"), dict) and "id" not in payload:
            return None

        raw_detail: object = payload
        data = payload.get("data")
        if isinstance(data, dict):
            raw_detail = data
        elif isinstance(data, list):
            match: dict[str, object] | None = None
            for item in data:
                if not isinstance(item, dict):
                    continue
                item_id = item.get("id")
                if isinstance(item_id, str) and item_id.strip() == model_id:
                    match = item
                    break
            if match is None and len(data) == 1 and isinstance(data[0], dict):
                match = data[0]
            if match is not None:
                raw_detail = match

        if not isinstance(raw_detail, dict):
            return None

        detail: dict[str, object] = dict(raw_detail)
        existing_id = detail.get("id")
        if not isinstance(existing_id, str) or not existing_id.strip():
            detail["id"] = model_id

        return detail

    def _normalize_fallback_models(self) -> tuple[str, ...]:
        if self.FALLBACK_MODELS:
            models = list(self.FALLBACK_MODELS)
        elif self.DEFAULT_MODEL:
            models = [self.DEFAULT_MODEL]
        else:
            models = []

        if self.DEFAULT_MODEL and self.DEFAULT_MODEL not in models:
            models.insert(0, self.DEFAULT_MODEL)

        deduped: list[str] = []
        seen: set[str] = set()
        for model in models:
            if model in seen:
                continue
            seen.add(model)
            deduped.append(model)

        return tuple(deduped)

    def _extract_model_ids(self, payload: object) -> tuple[str, ...]:
        fallback = self._normalize_fallback_models()
        if not isinstance(payload, dict):
            return fallback

        candidates: list[object] = []

        data = payload.get("data")
        if isinstance(data, list):
            candidates.extend(data)

        output = payload.get("output")
        if isinstance(output, dict):
            models = output.get("models")
            if isinstance(models, list):
                candidates.extend(models)

        parsed: list[str] = []
        seen: set[str] = set()
        for item in candidates:
            model_id: str | None = None
            if isinstance(item, dict):
                raw = item.get("id") or item.get("model") or item.get("name")
                if isinstance(raw, str):
                    model_id = raw.strip()
            elif isinstance(item, str):
                model_id = item.strip()

            if not model_id or model_id in seen:
                continue

            seen.add(model_id)
            parsed.append(model_id)

        if self.DEFAULT_MODEL and self.DEFAULT_MODEL not in seen:
            parsed.insert(0, self.DEFAULT_MODEL)

        return tuple(parsed) if parsed else fallback
