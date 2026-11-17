"""Experiment catalog and deterministic simulation endpoints."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database.session import get_db
from app.schemas.experiments import (
    ExperimentDetail,
    ExperimentSummary,
    SimulationRequest,
    SimulationResponse,
)
from app.services import experiment_service
from app.services.simulation_engine import SimulationValidationError

router = APIRouter()


@router.get("/experiments", response_model=list[ExperimentSummary])
def list_experiments(
    subject: str | None = Query(default=None, description="Filter by subject"),
    difficulty: str | None = Query(default=None, description="Filter by difficulty"),
    search: str | None = Query(default=None, description="Keyword search"),
    db: sqlite3.Connection = Depends(get_db),
) -> list[ExperimentSummary]:
    return experiment_service.list_experiments(
        db, subject=subject, difficulty=difficulty, search=search
    )


@router.get("/experiments/{experiment_id}", response_model=ExperimentDetail)
def get_experiment(
    experiment_id: str, db: sqlite3.Connection = Depends(get_db)
) -> ExperimentDetail:
    detail = experiment_service.get_experiment_detail(db, experiment_id)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{experiment_id}' not found.",
        )
    return detail


@router.post("/experiments/{experiment_id}/simulate", response_model=SimulationResponse)
def simulate_experiment(
    experiment_id: str,
    payload: SimulationRequest,
    db: sqlite3.Connection = Depends(get_db),
) -> SimulationResponse:
    try:
        return experiment_service.execute_experiment_simulation(db, experiment_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except (SimulationValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
