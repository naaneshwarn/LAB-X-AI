"""Context-aware AI Tutor endpoints with 3-tier provider routing (OpenRouter -> Local LLM -> Deterministic)."""

import sqlite3
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.database.session import get_db
from app.schemas.ai import AiChatRequest, AiExplainRequest, AiResponse
from app.services import experiment_service
from app.services.local_llm_service import get_local_llm_service
from app.services.openrouter_service import OpenRouterService
from app.services.simulation_engine import SimulationValidationError, run_simulation
from app.services.tts_service import get_tts_provider_status

router = APIRouter()


def get_openrouter_service() -> OpenRouterService:
    return OpenRouterService(get_settings())


def _localized_title(exp, language: str) -> str:
    if language == "kn" and exp.title_kn:
        return exp.title_kn
    trans = exp.translations.get(language) if isinstance(exp.translations, dict) else None
    if isinstance(trans, dict) and trans.get("title"):
        return trans["title"]
    return exp.title


@router.get("/ai/providers")
async def get_ai_providers_status() -> dict[str, Any]:
    """Report honest live availability of OpenRouter, Local LLM, Deterministic Tutor, and Regional TTS."""
    settings = get_settings()
    local_status = await get_local_llm_service().get_status()
    tts_status = get_tts_provider_status(settings)
    active_provider = (
        "openrouter"
        if settings.is_openrouter_configured
        else ("local" if local_status["available"] else "deterministic_fallback")
    )
    return {
        "active_provider": active_provider,
        "priority": ["openrouter", "local", "deterministic_fallback"],
        "providers": {
            "openrouter": {
                "configured": settings.is_openrouter_configured,
                "model": settings.openrouter_model,
            },
            "local": local_status,
            "deterministic_fallback": {
                "available": True,
                "languages": ["en", "kn", "hi", "ta", "te"],
                "intent_qa_enabled": True,
            },
        },
        "tts": tts_status,
    }


@router.post("/ai/explain", response_model=AiResponse)
async def explain_experiment(
    payload: AiExplainRequest,
    db: sqlite3.Connection = Depends(get_db),
    ai_service: OpenRouterService = Depends(get_openrouter_service),
) -> AiResponse:
    exp = experiment_service.get_experiment_detail(db, payload.experiment_id)
    if exp is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{payload.experiment_id}' not found.",
        )

    measurements = {
        **(payload.simulation_results or {}),
        **(payload.results or {}),
        **(payload.measurements or {}),
    }
    parameters = payload.parameters
    if not measurements:
        try:
            sim = run_simulation(payload.experiment_id, parameters)
            measurements = sim["measurements"]
            parameters = sim["parameters"]
        except SimulationValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
            ) from exc

    result = await ai_service.generate_response(
        experiment_id=exp.id,
        experiment_title=_localized_title(exp, payload.language),
        objectives=exp.objectives,
        parameters=parameters,
        measurements=measurements,
        language=payload.language,
        discipline=exp.discipline,
        difficulty=exp.difficulty,
        formulas=exp.formulas,
        common_mistakes=exp.common_mistakes,
        applications=exp.real_world_applications,
        mode=payload.mode,
        conversation_id=payload.conversation_id,
    )
    return AiResponse(**result)


@router.post("/ai/chat", response_model=AiResponse)
async def chat_with_tutor(
    payload: AiChatRequest,
    db: sqlite3.Connection = Depends(get_db),
    ai_service: OpenRouterService = Depends(get_openrouter_service),
) -> AiResponse:
    exp = experiment_service.get_experiment_detail(db, payload.experiment_id)
    if exp is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{payload.experiment_id}' not found.",
        )

    measurements = {
        **(payload.simulation_results or {}),
        **(payload.results or {}),
        **(payload.measurements or {}),
    }
    parameters = payload.parameters
    if not measurements:
        try:
            sim = run_simulation(payload.experiment_id, parameters)
            measurements = sim["measurements"]
            parameters = sim["parameters"]
        except SimulationValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
            ) from exc

    result = await ai_service.generate_response(
        experiment_id=exp.id,
        experiment_title=_localized_title(exp, payload.language),
        objectives=exp.objectives,
        parameters=parameters,
        measurements=measurements,
        language=payload.language,
        question=payload.question,
        history=[m.model_dump() for m in payload.history],
        discipline=exp.discipline,
        difficulty=exp.difficulty,
        formulas=exp.formulas,
        common_mistakes=exp.common_mistakes,
        applications=exp.real_world_applications,
        mode=payload.mode,
        conversation_id=payload.conversation_id,
    )
    return AiResponse(**result)
