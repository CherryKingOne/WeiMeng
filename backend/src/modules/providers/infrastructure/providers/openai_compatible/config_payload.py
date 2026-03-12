import uuid
from dataclasses import dataclass
from datetime import datetime

OPENAI_COMPATIBLE_PROVIDER = "openai-compatible"
OPENAI_COMPATIBLE_PROVIDER_PREFIX = f"{OPENAI_COMPATIBLE_PROVIDER}:"


@dataclass(frozen=True)
class OpenAICompatibleConfigPayload:
    provider: str
    base_url: str
    api_key: str
    model: str
    max_token: int | None = None
    temperature: float | None = None


@dataclass(frozen=True)
class OpenAICompatibleConfigRecord:
    id: uuid.UUID
    provider_key: str
    payload: OpenAICompatibleConfigPayload
    created_at: datetime
    updated_at: datetime
