"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = BACKEND_DIR.parent

PLACEHOLDER_KEYS = {
    "",
    "your_openrouter_api_key_here",
    "changeme",
    "placeholder",
}


class Settings(BaseSettings):
    """Central configuration for LabXAI backend."""

    app_name: str = "LabXAI"
    app_version: str = "1.0.0"
    environment: str = "development"
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'labxai.db').as_posix()}"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # OpenRouter configuration (server-side only)
    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/nemotron-3.5-lightning:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_timeout_seconds: float = 30.0
    openrouter_site_url: str = "http://localhost:5173"

    # Request guardrails
    max_chat_history: int = 12
    max_message_chars: int = 2000

    model_config = SettingsConfigDict(
        env_file=(
            str(BACKEND_DIR / ".env"),
            str(ROOT_DIR / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins(self) -> List[str]:
        origins = [item.strip() for item in self.allowed_origins.split(",") if item.strip()]
        if not origins:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        return origins

    @property
    def is_openrouter_configured(self) -> bool:
        key = (self.openrouter_api_key or "").strip()
        return bool(key) and key.lower() not in PLACEHOLDER_KEYS


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
