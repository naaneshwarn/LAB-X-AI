"""Pydantic schemas for context-aware AI Tutor chat, sessions, and 3-tier provider routing."""

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=2000)


class AiExplainRequest(BaseModel):
    conversation_id: str | None = Field(default=None, max_length=100)
    experiment_id: str = Field(..., min_length=1, max_length=64)
    parameters: dict[str, Any] = Field(default_factory=dict)
    measurements: dict[str, Any] = Field(default_factory=dict)
    results: dict[str, Any] = Field(default_factory=dict, description="Optional alias for computed results")
    simulation_results: dict[str, Any] = Field(default_factory=dict, description="Optional alias for computed results")
    language: str = Field(default="en", min_length=2, max_length=16)
    student_id: str = Field(default="demo-student-1", max_length=64)
    mode: Literal["explain", "hint", "practice", "simplify"] = "explain"


class AiChatRequest(BaseModel):
    conversation_id: str | None = Field(default=None, max_length=100)
    experiment_id: str = Field(..., min_length=1, max_length=64)
    question: str | None = Field(default=None, min_length=1, max_length=2000)
    message: str | None = Field(default=None, min_length=1, max_length=2000, description="Alias for question")
    parameters: dict[str, Any] = Field(default_factory=dict)
    measurements: dict[str, Any] = Field(default_factory=dict)
    results: dict[str, Any] = Field(default_factory=dict)
    simulation_results: dict[str, Any] = Field(default_factory=dict)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    language: str = Field(default="en", min_length=2, max_length=16)
    student_id: str = Field(default="demo-student-1", max_length=64)
    mode: Literal["explain", "hint", "practice", "simplify"] = "explain"

    @model_validator(mode="after")
    def ensure_question_or_message(self) -> "AiChatRequest":
        text = (self.question or self.message or "").strip()
        if not text:
            raise ValueError("Either 'question' or 'message' must be provided.")
        self.question = text
        return self


class AiResponse(BaseModel):
    success: bool = True
    conversation_id: str | None = None
    conversation_turns: int = 0
    experiment_id: str
    language: str
    provider: Literal["openrouter", "local", "deterministic_fallback"]
    model: str | None = None
    fallback_used: bool = False
    error_notice: str | None = None
    reply: str
    explanation: str = ""
    latency_ms: float | None = None
    local_model_status: str | None = None
    suggested_questions: list[str] = Field(default_factory=list)
