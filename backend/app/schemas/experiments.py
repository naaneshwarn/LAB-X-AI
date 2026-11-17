"""Pydantic schemas for virtual experiments and deterministic simulations."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ParameterSpec(BaseModel):
    name: str
    label: str
    unit: str
    min: float
    max: float
    step: float
    default: float


class ExperimentSummary(BaseModel):
    id: str
    title: str
    title_kn: str
    subject: str
    difficulty: str
    duration_minutes: int
    short_description: str
    short_description_kn: str
    objectives: list[str]
    objectives_kn: list[str]


class ExperimentDetail(ExperimentSummary):
    theory: str
    theory_kn: str
    apparatus: list[str]
    instructions: list[str]
    instructions_kn: list[str]
    formulas: list[str]
    assumptions: list[str]
    parameters_schema: list[ParameterSpec]


class SimulationRequest(BaseModel):
    student_id: str = Field(default="demo-student-1", min_length=1, max_length=64)
    parameters: dict[str, float] = Field(..., description="Numeric input parameters for the experiment")
    save_run: bool = Field(default=True, description="Whether to persist this run in student history")
    notes: str = Field(default="", max_length=1000)


class MeasurementItem(BaseModel):
    key: str
    label: str
    value: float | str | None
    unit: str


class SimulationResponse(BaseModel):
    experiment_id: str
    run_id: int | None = None
    parameters: dict[str, float]
    measurements: dict[str, Any]
    formatted_measurements: list[MeasurementItem]
    series_data: list[dict[str, float]] = Field(default_factory=list)
    special_case: str | None = None
    assumptions: list[str]
    conclusion_summary: str
    created_at: datetime
