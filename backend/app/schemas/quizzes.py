"""Pydantic schemas for quizzes, questions, and graded submissions."""

from datetime import datetime

from pydantic import BaseModel, Field


class QuizSummary(BaseModel):
    id: str
    experiment_id: str
    title: str
    title_kn: str
    description: str
    description_kn: str
    passing_score: int
    question_count: int


class QuizQuestionOut(BaseModel):
    id: str
    order_index: int
    question_text: str
    question_text_kn: str
    options: list[str]
    options_kn: list[str]


class QuizDetail(QuizSummary):
    questions: list[QuizQuestionOut]


class QuizSubmitRequest(BaseModel):
    student_id: str = Field(default="demo-student-1", min_length=1, max_length=64)
    answers: dict[str, int] = Field(
        ..., description="Mapping of question_id to selected option index (0-3)"
    )


class QuestionFeedback(BaseModel):
    question_id: str
    question_text: str
    question_text_kn: str
    selected_index: int | None
    correct_index: int
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
