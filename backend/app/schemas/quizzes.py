"""Pydantic schemas for quizzes, questions (MCQ, True/False, Numerical, Formula), and grading."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class QuizSummary(BaseModel):
    id: str
    experiment_id: str
    subject: str = "Physics"
    difficulty: str = "Basic"
    title: str
    title_kn: str
    description: str
    description_kn: str
    passing_score: int
    question_count: int


class QuizQuestionOut(BaseModel):
    id: str
    order_index: int
    question_type: str = "mcq"
    question_text: str
    question_text_kn: str
    options: list[str]
    options_kn: list[str]
    unit: str = ""


class QuizDetail(QuizSummary):
    questions: list[QuizQuestionOut]


class QuizSubmitRequest(BaseModel):
    student_id: str = Field(default="demo-student-1", min_length=1, max_length=64)
    answers: dict[str, int | float | str] = Field(
        ..., description="Mapping of question_id to option index (int) or numeric value (float/str)"
    )


class QuestionFeedback(BaseModel):
    question_id: str
    question_type: str = "mcq"
    question_text: str
    question_text_kn: str
    selected_index: int | None = None
    selected_value: Any = None
    correct_index: int
    correct_numeric: float | None = None
    unit: str = ""
    is_correct: bool
    explanation: str
    explanation_kn: str


class QuizSubmitResponse(BaseModel):
    attempt_id: int
    quiz_id: str
    experiment_id: str
    student_id: str
    score: int
    total_questions: int
    percentage: float
    passed: bool
    passing_score: int
    feedback: list[QuestionFeedback]
    submitted_at: datetime
