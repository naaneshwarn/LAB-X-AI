"""Versioned API route modules for LabXAI v1."""

from fastapi import APIRouter

from app.api.routes import ai, experiments, languages, quizzes, students

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(experiments.router, tags=["Experiments"])
api_v1_router.include_router(ai.router, tags=["AI Tutor"])
api_v1_router.include_router(quizzes.router, tags=["Quizzes"])
api_v1_router.include_router(students.router, tags=["Students & Progress"])
api_v1_router.include_router(languages.router, tags=["Languages & Health"])
