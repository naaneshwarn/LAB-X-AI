"""Multilingual discovery, cached scientific translation, regional TTS, speech config, and health endpoints."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.database.session import check_db_connection, get_db
from app.schemas.common import ApiHealthResponse, LanguagesResponse
from app.schemas.translation import (
    SpeechConfigResponse,
    TranslateRequest,
    TranslateResponse,
    TtsRequest,
    TtsResponse,
)
from app.services.language_service import get_speech_config, get_supported_languages
from app.services.translation_service import translate_text
from app.services.tts_service import TtsError, resolve_cached_audio_path, synthesize_speech

router = APIRouter()


@router.get("/languages", response_model=LanguagesResponse)
def list_languages() -> LanguagesResponse:
    return get_supported_languages()


@router.post("/translate", response_model=TranslateResponse)
async def translate_endpoint(
    payload: TranslateRequest,
    db: sqlite3.Connection = Depends(get_db),
) -> TranslateResponse:
    try:
        return await translate_text(
            db,
            text=payload.text,
            source_lang=payload.source_lang,
            target_lang=payload.target_lang,
            preserve_scientific_terms=payload.preserve_scientific_terms,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc


@router.get("/speech/config", response_model=SpeechConfigResponse)
def speech_config() -> SpeechConfigResponse:
    return get_speech_config()


@router.post("/speech/tts", response_model=TtsResponse)
async def synthesize_speech_endpoint(payload: TtsRequest) -> TtsResponse:
    """Synthesize regional-language MP3/WAV audio independent of browser/Windows voices."""
    try:
        res = await synthesize_speech(
            text=payload.text,
            language=payload.language,
            speed=payload.speed,
        )
        return TtsResponse(**res)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    except TtsError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Regional TTS provider failed: {exc}",
        ) from exc


@router.get("/speech/tts/audio/{filename}")
def serve_tts_audio(filename: str) -> FileResponse:
    """Serve safely cached MP3/WAV audio file (strict hex filename validation)."""
    path = resolve_cached_audio_path(filename)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio clip not found or expired.",
        )
    media_type = "audio/wav" if path.suffix == ".wav" else "audio/mpeg"
    return FileResponse(path, media_type=media_type, filename=path.name)


@router.get("/health", response_model=ApiHealthResponse)
def api_health() -> ApiHealthResponse:
    settings = get_settings()
    db_ok = check_db_connection()
    return ApiHealthResponse(
        status="healthy" if db_ok else "degraded",
        service="LabXAI Backend",
        version=settings.app_version,
        database="connected" if db_ok else "disconnected",
        ai_engine="configured" if settings.is_openrouter_configured else "fallback_only",
        ai_model=settings.openrouter_model,
    )
