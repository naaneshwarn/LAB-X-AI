"""Quiz listing, question retrieval, and deterministic graded submission endpoints."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database.session import get_db
from app.schemas.quizzes import QuizDetail, QuizSubmitRequest, QuizSubmitResponse, QuizSummary
from app.services import quiz_service

router = APIRouter()


@router.get("/quizzes", response_model=list[QuizSummary])
def list_quizzes(
    experiment_id: str | None = Query(default=None, description="Filter quizzes by experiment ID"),
    subject: str | None = Query(default=None, description="Filter quizzes by subject"),
    difficulty: str | None = Query(default=None, description="Filter quizzes by difficulty"),
    db: sqlite3.Connection = Depends(get_db),
) -> list[QuizSummary]:
    return quiz_service.list_quizzes(
        db, experiment_id=experiment_id, subject=subject, difficulty=difficulty
    )


@router.get("/quizzes/{quiz_id}", response_model=QuizDetail)
def get_quiz(quiz_id: str, db: sqlite3.Connection = Depends(get_db)) -> QuizDetail:
    quiz = quiz_service.get_quiz_detail(db, quiz_id)
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz '{quiz_id}' not found.",
        )
    return quiz


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: str,
    payload: QuizSubmitRequest,
    db: sqlite3.Connection = Depends(get_db),
) -> QuizSubmitResponse:
    try:
        return quiz_service.submit_quiz_attempt(db, quiz_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
