"""Pydantic schemas for AI Tutor chat and experiment explanations."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=2000)


class AiExplainRequest(BaseModel):
    experiment_id: str = Field(..., min_length=1, max_length=64)
    parameters: dict[str, Any] = Field(default_factory=dict)
    measurements: dict[str, Any] = Field(default_factory=dict)
    language: str = Field(default="en", min_length=2, max_length=16)
    student_id: str = Field(default="demo-student-1", max_length=64)


class AiChatRequest(BaseModel):
    experiment_id: str = Field(..., min_length=1, max_length=64)
    question: str = Field(..., min_length=1, max_length=2000)
    parameters: dict[str, Any] = Field(default_factory=dict)
    measurements: dict[str, Any] = Field(default_factory=dict)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    language: str = Field(default="en", min_length=2, max_length=16)
    student_id: str = Field(default="demo-student-1", max_length=64)


class AiResponse(BaseModel):
    experiment_id: str
    language: str
    provider: Literal["openrouter", "deterministic_fallback"]
    model: str | None = None
    fallback_used: bool = False
    error_notice: str | None = None
    reply: str
    suggested_questions: list[str] = Field(default_factory=list)
