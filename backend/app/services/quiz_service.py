"""Quiz retrieval, deterministic grading, and attempt persistence (SQLite)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.schemas.quizzes import (
    QuestionFeedback,
    QuizDetail,
    QuizQuestionOut,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuizSummary,
)
from app.services.experiment_service import ensure_student_exists


def _count_questions(db: sqlite3.Connection, quiz_id: str) -> int:
    row = db.execute("SELECT COUNT(*) AS cnt FROM quiz_questions WHERE quiz_id = ?", (quiz_id,)).fetchone()
    return int(row["cnt"]) if row else 0


def _to_quiz_summary(db: sqlite3.Connection, row: sqlite3.Row) -> QuizSummary:
    return QuizSummary(
        id=row["id"],
        experiment_id=row["experiment_id"],
        title=row["title"],
        title_kn=row["title_kn"],
        description=row["description"],
        description_kn=row["description_kn"],
        passing_score=row["passing_score"],
        question_count=_count_questions(db, row["id"]),
    )


def list_quizzes(db: sqlite3.Connection, experiment_id: str | None = None) -> list[QuizSummary]:
    """Return available seeded quizzes, optionally filtered by experiment_id."""
    if experiment_id:
        rows = db.execute(
            "SELECT * FROM quizzes WHERE experiment_id = ? ORDER BY id ASC", (experiment_id,)
        ).fetchall()
    else:
        rows = db.execute("SELECT * FROM quizzes ORDER BY id ASC").fetchall()
    return [_to_quiz_summary(db, row) for row in rows]


def get_quiz_detail(db: sqlite3.Connection, quiz_id: str) -> QuizDetail | None:
    """Return a quiz with its ordered multiple-choice questions (without leaking answers)."""
    quiz_row = db.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)).fetchone()
    if quiz_row is None:
        return None
    q_rows = db.execute(
        "SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC", (quiz_id,)
    ).fetchall()
    questions = [
        QuizQuestionOut(
            id=q["id"],
            order_index=q["order_index"],
            question_text=q["question_text"],
            question_text_kn=q["question_text_kn"],
            options=json.loads(q["options_json"]),
            options_kn=json.loads(q["options_kn_json"]),
        )
        for q in q_rows
    ]
    return QuizDetail(
        id=quiz_row["id"],
        experiment_id=quiz_row["experiment_id"],
        title=quiz_row["title"],
        title_kn=quiz_row["title_kn"],
        description=quiz_row["description"],
        description_kn=quiz_row["description_kn"],
        passing_score=quiz_row["passing_score"],
        question_count=len(questions),
        questions=questions,
    )


def submit_quiz_attempt(
    db: sqlite3.Connection, quiz_id: str, request: QuizSubmitRequest
) -> QuizSubmitResponse:
    """Grade quiz submission deterministically and save attempt to SQLite."""
    quiz_row = db.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)).fetchone()
    if quiz_row is None:
        raise LookupError(f"Quiz '{quiz_id}' not found.")

    q_rows = db.execute(
        "SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC", (quiz_id,)
    ).fetchall()
    if not q_rows:
        raise ValueError(f"Quiz '{quiz_id}' has no questions configured.")

    student = ensure_student_exists(db, request.student_id)

    score = 0
    feedback: list[QuestionFeedback] = []
    for q in q_rows:
        options = json.loads(q["options_json"])
        selected = request.answers.get(q["id"])
        if selected is not None and (selected < 0 or selected >= len(options)):
            raise ValueError(f"Invalid option index '{selected}' for question '{q['id']}'.")
        is_correct = selected == q["correct_option_index"]
        if is_correct:
            score += 1
        feedback.append(
            QuestionFeedback(
                question_id=q["id"],
                question_text=q["question_text"],
                question_text_kn=q["question_text_kn"],
                selected_index=selected,
                correct_index=q["correct_option_index"],
                is_correct=is_correct,
                explanation=q["explanation"],
                explanation_kn=q["explanation_kn"],
            )
        )

    total_questions = len(q_rows)
    percentage = round((score / total_questions) * 100.0, 2)
    passed = percentage >= float(quiz_row["passing_score"])
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    cursor = db.execute(
        """
        INSERT INTO quiz_attempts (
            student_id, quiz_id, experiment_id, answers_json,
            score, total_questions, percentage, passed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            student["id"],
            quiz_row["id"],
            quiz_row["experiment_id"],
            json.dumps(request.answers),
            score,
            total_questions,
            percentage,
            1 if passed else 0,
            now_iso,
        ),
    )
    attempt_id = int(cursor.lastrowid)

    db.execute(
        """
        INSERT INTO learning_activities (
            student_id, activity_type, experiment_id, title, summary, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            student["id"],
            "quiz_attempt",
            quiz_row["experiment_id"],
            f"Submitted quiz: {quiz_row['title']}",
            f"Scored {score}/{total_questions} ({percentage}%) — {'Passed' if passed else 'Needs Review'}",
            json.dumps({"attempt_id": attempt_id, "quiz_id": quiz_row["id"]}),
            now_iso,
        ),
    )
    db.commit()

    return QuizSubmitResponse(
        attempt_id=attempt_id,
        quiz_id=quiz_row["id"],
        experiment_id=quiz_row["experiment_id"],
        student_id=student["id"],
        score=score,
        total_questions=total_questions,
        percentage=percentage,
        passed=passed,
        passing_score=quiz_row["passing_score"],
        feedback=feedback,
        submitted_at=now,
    )
