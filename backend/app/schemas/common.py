"""Common API response schemas for health and multilingual capabilities."""

from typing import Literal

from pydantic import BaseModel


class ApiHealthResponse(BaseModel):
    status: Literal["healthy", "degraded"]
    service: str
    version: str
    database: Literal["connected", "disconnected"]
    ai_engine: Literal["configured", "fallback_only"]
    ai_model: str


class LanguageInfo(BaseModel):
    code: str
    name: str
    native_name: str
    status: Literal["supported", "planned"]
    ui_translated: bool
    ai_supported: bool
    speech_locale: str
    future_providers: dict[str, str]


class LanguagesResponse(BaseModel):
    default_language: str
    languages: list[LanguageInfo]
    architecture_note: str
