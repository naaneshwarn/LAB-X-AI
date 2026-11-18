"""Versioned API route modules for LabXAI v1."""

from fastapi import APIRouter

from app.api.routes import ai, experiments, languages, playground, quizzes, students, videos

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(experiments.router, tags=["Subjects & Experiments"])
api_v1_router.include_router(ai.router, tags=["AI Tutor"])
api_v1_router.include_router(quizzes.router, tags=["Quizzes"])
api_v1_router.include_router(students.router, tags=["Students & Progress"])
api_v1_router.include_router(videos.router, tags=["Educational Videos"])
api_v1_router.include_router(languages.router, tags=["Languages, Speech & Health"])
api_v1_router.include_router(playground.router, tags=["Physics Playground"])
