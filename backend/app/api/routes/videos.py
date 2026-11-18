"""Verified educational video library and recommendation endpoints."""

import sqlite3

from fastapi import APIRouter, Depends, Query

from app.database.session import get_db
from app.schemas.videos import VideoItem
from app.services import video_service

router = APIRouter()


@router.get("/videos", response_model=list[VideoItem])
def list_videos(
    subject: str | None = Query(default=None, description="Filter by subject"),
    experiment_id: str | None = Query(default=None, description="Filter by experiment ID"),
    difficulty: str | None = Query(default=None, description="Filter by difficulty"),
    language: str | None = Query(default=None, description="Filter by language"),
    search: str | None = Query(default=None, description="Search keyword"),
    featured: bool | None = Query(default=None, description="Filter featured videos"),
    db: sqlite3.Connection = Depends(get_db),
) -> list[VideoItem]:
    return video_service.list_videos(
        db,
        subject=subject,
        experiment_id=experiment_id,
        difficulty=difficulty,
        language=language,
        search=search,
        featured=featured,
    )


@router.get("/videos/recommendations", response_model=list[VideoItem])
def get_video_recommendations(
    experiment_id: str | None = Query(default=None),
    subject: str | None = Query(default=None),
    limit: int = Query(default=6, ge=1, le=20),
    db: sqlite3.Connection = Depends(get_db),
) -> list[VideoItem]:
    return video_service.recommend_videos(
        db, experiment_id=experiment_id, subject=subject, limit=limit
    )
