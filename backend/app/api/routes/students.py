"""Student profile, multidisciplinary progress analytics, and learning history endpoints."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database.session import get_db
from app.schemas.students import (
    StudentHistoryResponse,
    StudentOut,
    StudentProgressResponse,
    StudentUpdateRequest,
)
from app.services import progress_service

router = APIRouter()


@router.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: str, db: sqlite3.Connection = Depends(get_db)) -> StudentOut:
    try:
        return progress_service.get_student_profile(db, student_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/students/{student_id}", response_model=StudentOut)
def update_student(
    student_id: str,
    payload: StudentUpdateRequest,
    db: sqlite3.Connection = Depends(get_db),
) -> StudentOut:
    try:
        return progress_service.update_student_profile(db, student_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/students/{student_id}/progress", response_model=StudentProgressResponse)
def get_student_progress(
    student_id: str,
    subject: str | None = Query(default=None, description="Optional subject filter"),
    difficulty: str | None = Query(default=None, description="Optional difficulty filter"),
    db: sqlite3.Connection = Depends(get_db),
) -> StudentProgressResponse:
    try:
        return progress_service.get_student_progress(
            db, student_id, subject=subject, difficulty=difficulty
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/students/{student_id}/history", response_model=StudentHistoryResponse)
def get_student_history(
    student_id: str, db: sqlite3.Connection = Depends(get_db)
) -> StudentHistoryResponse:
    try:
        return progress_service.get_student_history(db, student_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
