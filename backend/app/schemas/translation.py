"""Pydantic schemas for multilingual text translation, speech configuration, and backend TTS."""

from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_lang: str = Field(default="en", min_length=2, max_length=10)
    target_lang: str = Field(default="kn", min_length=2, max_length=10)
    preserve_scientific_terms: bool = True


class TranslateResponse(BaseModel):
    source_lang: str
    target_lang: str
    original_text: str
    translated_text: str
    provider: str
    cached: bool = False
    translation_available: bool = True
    preserved_tokens: list[str] = Field(default_factory=list)
    notice: str | None = None


class TtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3500)
    language: str = Field(default="en", min_length=2, max_length=10)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class TtsResponse(BaseModel):
    success: bool = True
    audio_url: str | None = None
    content_type: str = "audio/mpeg"
    language: str
    locale: str = "en-IN"
    voice: str = ""
    provider: str = "edge"
    cached: bool = False
    audio_bytes: int = 0
    generation_ms: float | None = None
    error: str | None = None


class SpeechLocaleConfig(BaseModel):
    code: str
    name: str
    native_name: str
    recognition_locale: str
    synthesis_locale: str
    browser_stt_note: str
    browser_tts_note: str


class SpeechConfigResponse(BaseModel):
    default_language: str
    web_speech_primary: bool = False
    server_tts_available: bool = True
    tts_provider: str = "edge"
    tts_voices: dict[str, str] = Field(default_factory=dict)
    locales: list[SpeechLocaleConfig]
    browser_limitations_note: str
