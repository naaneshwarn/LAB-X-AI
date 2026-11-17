"""Pydantic schemas for student profile, progress metrics, and learning history."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class StudentOut(BaseModel):
    id: str
    name: str
    email: str
    grade_level: str
    preferred_language: str
    theme: str
    narration_enabled: bool
    is_demo: bool
    created_at: datetime


class StudentUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    grade_level: str | None = Field(default=None, min_length=2, max_length=64)
    preferred_language: str | None = Field(default=None, min_length=2, max_length=16)
    theme: Literal["light", "dark"] | None = None
    narration_enabled: bool | None = None


class ExperimentProgressItem(BaseModel):
    experiment_id: str
    title: str
    title_kn: str
    subject: str
    runs_count: int
    best_quiz_percentage: float | None
    completed: bool
    last_accessed: datetime | None


class StudentProgressResponse(BaseModel):
    student: StudentOut
    total_experiments_available: int
    experiments_completed: int
    total_simulation_runs: int
    quizzes_attempted: int
    quizzes_passed: int
    average_quiz_score: float
    overall_completion_percentage: float
    recently_accessed: list[ExperimentProgressItem]
    recommended_experiments: list[str]
    per_experiment: list[ExperimentProgressItem]


class SimulationRunRecord(BaseModel):
    id: int
    experiment_id: str
    experiment_title: str
    parameters: dict[str, Any]
    measurements: dict[str, Any]
    notes: str
    completed: bool
    created_at: datetime


class QuizAttemptRecord(BaseModel):
    id: int
    quiz_id: str
    quiz_title: str
    experiment_id: str
    score: int
    total_questions: int
    percentage: float
    passed: bool
    created_at: datetime


class LearningActivityRecord(BaseModel):
    id: int
    activity_type: str
    experiment_id: str | None
    title: str
    summary: str
    created_at: datetime


class StudentHistoryResponse(BaseModel):
    student_id: str
    simulation_runs: list[SimulationRunRecord]
    quiz_attempts: list[QuizAttemptRecord]
    recent_activities: list[LearningActivityRecord]
