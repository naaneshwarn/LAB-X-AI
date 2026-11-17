"""Multilingual capability discovery and versioned health check endpoints."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.database.session import check_db_connection
from app.schemas.common import ApiHealthResponse, LanguagesResponse
from app.services.language_service import get_supported_languages

router = APIRouter()


@router.get("/languages", response_model=LanguagesResponse)
def list_languages() -> LanguagesResponse:
    return get_supported_languages()


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
