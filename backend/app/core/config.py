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
    "your_tts_api_key_here",
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

    # 1. OpenRouter cloud AI configuration (server-side only)
    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/nemotron-3.5-lightning:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_timeout_seconds: float = 30.0
    openrouter_site_url: str = "http://localhost:5173"

    # 2. Lightweight Local LLM configuration (optional — llama-cpp-python or llama-server)
    local_llm_enabled: str = "auto"  # "auto" | "true" | "false"
    local_llm_backend: str = "auto"  # "auto" | "llama_cpp" | "openai_compat"
    local_llm_model_path: str = ""
    local_llm_server_url: str = "http://127.0.0.1:8080/v1"
    local_llm_model_name: str = "Qwen2.5-1.5B-Instruct-Q4_K_M"
    local_llm_n_ctx: int = 2048
    local_llm_n_gpu_layers: int = 0
    local_llm_threads: int = 6
    local_llm_timeout_seconds: float = 45.0

    # 3. Independent Backend Multilingual TTS configuration (en-IN, kn-IN, hi-IN, ta-IN, te-IN)
    tts_provider: str = "edge"  # "edge" | "sarvam" | "azure" | "google" | "disabled"
    tts_api_key: str = ""
    tts_region: str = "centralindia"
    tts_model: str = "bulbul:v2"
    tts_voice_en: str = "en-IN-NeerjaNeural"
    tts_voice_kn: str = "kn-IN-SapnaNeural"
    tts_voice_hi: str = "hi-IN-SwaraNeural"
    tts_voice_ta: str = "ta-IN-PallaviNeural"
    tts_voice_te: str = "te-IN-ShrutiNeural"
    tts_max_text_chars: int = 2500
    tts_timeout_seconds: float = 20.0
    tts_cache_ttl_hours: int = 24

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

    @property
    def is_tts_api_key_configured(self) -> bool:
        key = (self.tts_api_key or "").strip()
        return bool(key) and key.lower() not in PLACEHOLDER_KEYS

    def get_tts_voice(self, language: str) -> str:
        code = (language or "en").strip().lower()[:2]
        return {
            "en": self.tts_voice_en,
            "kn": self.tts_voice_kn,
            "hi": self.tts_voice_hi,
            "ta": self.tts_voice_ta,
            "te": self.tts_voice_te,
        }.get(code, self.tts_voice_en)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
