"""Pydantic schemas for virtual experiments, subjects, and deterministic simulations."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SubjectSummary(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str
    color: str
    experiment_count: int = 0
    level_counts: dict[str, int] = Field(default_factory=dict)
    translations: dict[str, Any] = Field(default_factory=dict)


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
    discipline: str = "Physics"
    topic: str = ""
    difficulty: str
    duration_minutes: int
    short_description: str
    short_description_kn: str
    objectives: list[str]
    objectives_kn: list[str]
    visual_type: str = "generic"
    translations: dict[str, Any] = Field(default_factory=dict)


class ExperimentDetail(ExperimentSummary):
    introduction: str = ""
    theory: str
    theory_kn: str
    apparatus: list[str]
    instructions: list[str]
    instructions_kn: list[str]
    formulas: list[str]
    assumptions: list[str]
    real_world_applications: list[str] = Field(default_factory=list)
    common_mistakes: list[str] = Field(default_factory=list)
    related_experiments: list[str] = Field(default_factory=list)
    safety_note: str = ""
    parameters_schema: list[ParameterSpec]


class SimulationRequest(BaseModel):
    student_id: str = Field(default="demo-student-1", min_length=1, max_length=64)
    parameters: dict[str, float] = Field(..., description="Numeric input parameters for the experiment")
    language: str = Field(default="en", min_length=2, max_length=10, description="Selected response language (en, kn, hi, te, ta)")
    save_run: bool = Field(default=True, description="Whether to persist this run in student history")
    notes: str = Field(default="", max_length=1000)
    duration_seconds: int = Field(default=0, ge=0, le=7200)


class MeasurementItem(BaseModel):
    key: str
    label: str
    value: float | str | None
    unit: str


class ResultValue(BaseModel):
    value: float | str | None
    unit: str = ""
    label: str = ""


class LocalizedExplanation(BaseModel):
    language: str = "en"
    summary: str = ""
    observation: str = ""
    formula_explanation: str = ""
    interpretation: str = ""
    conclusion: str = ""
    real_world_application: str = ""
    provider: str = "deterministic_en"
    translation_available: bool = True
    error_notice: str | None = None
    english_original: dict[str, str] = Field(default_factory=dict)


class SimulationResponse(BaseModel):
    experiment_id: str
    language: str = "en"
    run_id: int | None = None
    parameters: dict[str, float]
    measurements: dict[str, Any]
    results: dict[str, ResultValue] = Field(default_factory=dict)
    formatted_measurements: list[MeasurementItem]
    series_data: list[dict[str, float]] = Field(default_factory=list)
    special_case: str | None = None
    assumptions: list[str]
    conclusion_summary: str
    explanation: LocalizedExplanation
    created_at: datetime
