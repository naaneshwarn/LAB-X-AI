"""Pydantic schemas for Physics Playground persistent projects."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


PlaygroundMode = Literal["circuit", "mechanics", "optics"]


class PlaygroundProjectCreate(BaseModel):
    student_id: str = Field(default="demo-student-1", min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=120)
    mode: PlaygroundMode = "circuit"
    workspace: dict[str, Any] = Field(default_factory=dict)
    observations: list[dict[str, Any]] = Field(default_factory=list)


class PlaygroundProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    mode: PlaygroundMode | None = None
    workspace: dict[str, Any] | None = None
    observations: list[dict[str, Any]] | None = None


class PlaygroundProjectResponse(BaseModel):
    id: str
    student_id: str
    name: str
    mode: PlaygroundMode
    workspace: dict[str, Any]
    observations: list[dict[str, Any]]
    created_at: str
    updated_at: str
