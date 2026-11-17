"""Context-aware AI Tutor endpoints powered by OpenRouter with deterministic fallback."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.database.session import get_db
from app.schemas.ai import AiChatRequest, AiExplainRequest, AiResponse
from app.services import experiment_service
from app.services.openrouter_service import OpenRouterService
from app.services.simulation_engine import SimulationValidationError, run_simulation

router = APIRouter()


def get_openrouter_service() -> OpenRouterService:
    return OpenRouterService(get_settings())


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

    measurements = payload.measurements
    parameters = payload.parameters
    if not measurements and parameters:
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
        experiment_title=exp.title_kn if payload.language == "kn" else exp.title,
        objectives=exp.objectives,
        parameters=parameters,
        measurements=measurements,
        language=payload.language,
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

    measurements = payload.measurements
    parameters = payload.parameters
    if not measurements and parameters:
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
        experiment_title=exp.title_kn if payload.language == "kn" else exp.title,
        objectives=exp.objectives,
        parameters=parameters,
        measurements=measurements,
        language=payload.language,
        question=payload.question,
        history=[m.model_dump() for m in payload.history],
    )
    return AiResponse(**result)
