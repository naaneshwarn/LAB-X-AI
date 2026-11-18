"""Quiz retrieval, deterministic grading (MCQ, True/False, Formula, Numerical), and persistence."""

from __future__ import annotations

import json
import math
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
    keys = row.keys()
    return QuizSummary(
        id=row["id"],
        experiment_id=row["experiment_id"],
        subject=row["subject"] if "subject" in keys and row["subject"] else "Physics",
        difficulty=row["difficulty"] if "difficulty" in keys and row["difficulty"] else "Basic",
        title=row["title"],
        title_kn=row["title_kn"],
        description=row["description"],
        description_kn=row["description_kn"],
        passing_score=row["passing_score"],
        question_count=_count_questions(db, row["id"]),
    )


def list_quizzes(
    db: sqlite3.Connection,
    experiment_id: str | None = None,
    subject: str | None = None,
    difficulty: str | None = None,
) -> list[QuizSummary]:
    """Return available seeded quizzes, optionally filtered by experiment_id, subject, or difficulty."""
    rows = db.execute("SELECT * FROM quizzes ORDER BY id ASC").fetchall()
    results: list[QuizSummary] = []
    for row in rows:
        if experiment_id and row["experiment_id"] != experiment_id:
            continue
        if subject and subject.lower() != "all":
            row_subj = (row["subject"] if "subject" in row.keys() and row["subject"] else "Physics").lower()
            if subject.strip().lower() not in row_subj:
                continue
        if difficulty and difficulty.lower() != "all":
            row_diff = (row["difficulty"] if "difficulty" in row.keys() and row["difficulty"] else "Basic").lower()
            q_diff = "basic" if difficulty.strip().lower() == "beginner" else difficulty.strip().lower()
            if row_diff != q_diff:
                continue
        results.append(_to_quiz_summary(db, row))
    return results


def get_quiz_detail(db: sqlite3.Connection, quiz_id: str) -> QuizDetail | None:
    """Return a quiz with its ordered questions (without leaking answers)."""
    quiz_row = db.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)).fetchone()
    if quiz_row is None:
        return None
    q_rows = db.execute(
        "SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC", (quiz_id,)
    ).fetchall()
    questions = []
    for q in q_rows:
        keys = q.keys()
        questions.append(
            QuizQuestionOut(
                id=q["id"],
                order_index=q["order_index"],
                question_type=q["question_type"] if "question_type" in keys and q["question_type"] else "mcq",
                question_text=q["question_text"],
                question_text_kn=q["question_text_kn"],
                options=json.loads(q["options_json"]),
                options_kn=json.loads(q["options_kn_json"]),
                unit=q["unit"] if "unit" in keys and q["unit"] else "",
            )
        )
    keys = quiz_row.keys()
    return QuizDetail(
        id=quiz_row["id"],
        experiment_id=quiz_row["experiment_id"],
        subject=quiz_row["subject"] if "subject" in keys and quiz_row["subject"] else "Physics",
        difficulty=quiz_row["difficulty"] if "difficulty" in keys and quiz_row["difficulty"] else "Basic",
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
    """Grade quiz submission deterministically (option index or numeric tolerance) and persist to SQLite."""
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
        keys = q.keys()
        q_type = q["question_type"] if "question_type" in keys and q["question_type"] else "mcq"
        options = json.loads(q["options_json"])
        raw_ans = request.answers.get(q["id"])
        unit = q["unit"] if "unit" in keys and q["unit"] else ""

        if q_type == "numerical":
            expected = float(q["numeric_answer"])
            tol = float(q["numeric_tolerance"] if q["numeric_tolerance"] is not None else 0.05)
            is_correct = False
            selected_val = None
            if raw_ans is not None and str(raw_ans).strip() != "":
                try:
                    num_val = float(raw_ans)
                    if not (math.isnan(num_val) or math.isinf(num_val)):
                        selected_val = num_val
                        is_correct = abs(num_val - expected) <= tol
                except (TypeError, ValueError):
                    selected_val = raw_ans
                    is_correct = False
            if is_correct:
                score += 1
            feedback.append(
                QuestionFeedback(
                    question_id=q["id"],
                    question_type=q_type,
                    question_text=q["question_text"],
                    question_text_kn=q["question_text_kn"],
                    selected_index=None,
                    selected_value=selected_val,
                    correct_index=0,
                    correct_numeric=expected,
                    unit=unit,
                    is_correct=is_correct,
                    explanation=q["explanation"],
                    explanation_kn=q["explanation_kn"],
                )
            )
        else:
            selected: int | None = None
            if raw_ans is not None:
                try:
                    selected = int(raw_ans)
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Invalid option index '{raw_ans}' for question '{q['id']}'.") from exc
                if selected < 0 or selected >= len(options):
                    raise ValueError(f"Invalid option index '{selected}' for question '{q['id']}'.")
            is_correct = selected == q["correct_option_index"]
            if is_correct:
                score += 1
            feedback.append(
                QuestionFeedback(
                    question_id=q["id"],
                    question_type=q_type,
                    question_text=q["question_text"],
                    question_text_kn=q["question_text_kn"],
                    selected_index=selected,
                    selected_value=selected,
                    correct_index=q["correct_option_index"],
                    correct_numeric=None,
                    unit=unit,
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
