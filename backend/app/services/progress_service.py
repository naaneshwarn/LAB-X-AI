"""Student profile, progress aggregation, and learning history services (SQLite)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.core.security import sanitize_text
from app.schemas.students import (
    ExperimentProgressItem,
    LearningActivityRecord,
    QuizAttemptRecord,
    SimulationRunRecord,
    StudentHistoryResponse,
    StudentOut,
    StudentProgressResponse,
    StudentUpdateRequest,
)
from app.services.experiment_service import ensure_student_exists


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _to_student_out(row: sqlite3.Row) -> StudentOut:
    return StudentOut(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        grade_level=row["grade_level"],
        preferred_language=row["preferred_language"],
        theme=row["theme"],
        narration_enabled=bool(row["narration_enabled"]),
        is_demo=bool(row["is_demo"]),
        created_at=_parse_dt(row["created_at"]),
    )


def get_student_profile(db: sqlite3.Connection, student_id: str) -> StudentOut:
    row = ensure_student_exists(db, student_id)
    return _to_student_out(row)


def update_student_profile(
    db: sqlite3.Connection, student_id: str, payload: StudentUpdateRequest
) -> StudentOut:
    row = ensure_student_exists(db, student_id)
    name = sanitize_text(payload.name, 120) if payload.name is not None else row["name"]
    grade_level = (
        sanitize_text(payload.grade_level, 64) if payload.grade_level is not None else row["grade_level"]
    )
    preferred_language = (
        payload.preferred_language.strip().lower()
        if payload.preferred_language is not None
        else row["preferred_language"]
    )
    theme = payload.theme if payload.theme is not None else row["theme"]
    narration_enabled = (
        (1 if payload.narration_enabled else 0)
        if payload.narration_enabled is not None
        else row["narration_enabled"]
    )
    updated_at = datetime.now(timezone.utc).isoformat()

    db.execute(
        """
        UPDATE students
        SET name = ?, grade_level = ?, preferred_language = ?, theme = ?,
            narration_enabled = ?, updated_at = ?
        WHERE id = ?
        """,
        (name, grade_level, preferred_language, theme, narration_enabled, updated_at, student_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    return _to_student_out(updated)


def get_student_progress(db: sqlite3.Connection, student_id: str) -> StudentProgressResponse:
    """Compute real, non-mocked dashboard progress metrics from SQLite."""
    student = ensure_student_exists(db, student_id)
    experiments = db.execute("SELECT * FROM experiments ORDER BY title ASC").fetchall()
    runs = db.execute(
        "SELECT * FROM simulation_runs WHERE student_id = ? ORDER BY created_at DESC",
        (student["id"],),
    ).fetchall()
    attempts = db.execute(
        "SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY created_at DESC",
        (student["id"],),
    ).fetchall()

    runs_by_exp: dict[str, list[sqlite3.Row]] = {}
    for run in runs:
        runs_by_exp.setdefault(run["experiment_id"], []).append(run)

    attempts_by_exp: dict[str, list[sqlite3.Row]] = {}
    for att in attempts:
        attempts_by_exp.setdefault(att["experiment_id"], []).append(att)

    per_experiment: list[ExperimentProgressItem] = []
    for exp in experiments:
        exp_runs = runs_by_exp.get(exp["id"], [])
        exp_attempts = attempts_by_exp.get(exp["id"], [])
        best_quiz = max((float(a["percentage"]) for a in exp_attempts), default=None)

        timestamps: list[datetime] = []
        if exp_runs:
            timestamps.append(_parse_dt(exp_runs[0]["created_at"]))
        if exp_attempts:
            timestamps.append(_parse_dt(exp_attempts[0]["created_at"]))
        last_accessed = max(timestamps) if timestamps else None

        per_experiment.append(
            ExperimentProgressItem(
                experiment_id=exp["id"],
                title=exp["title"],
                title_kn=exp["title_kn"],
                subject=exp["subject"],
                runs_count=len(exp_runs),
                best_quiz_percentage=best_quiz,
                completed=len(exp_runs) > 0,
                last_accessed=last_accessed,
            )
        )

    experiments_completed = sum(1 for item in per_experiment if item.completed)
    total_available = len(experiments)
    quizzes_attempted = len(attempts)
    quizzes_passed = sum(1 for a in attempts if bool(a["passed"]))
    average_quiz_score = (
        round(sum(float(a["percentage"]) for a in attempts) / quizzes_attempted, 2)
        if quizzes_attempted > 0
        else 0.0
    )

    passed_exp_quizzes = len({a["experiment_id"] for a in attempts if bool(a["passed"])})
    if total_available > 0:
        overall_completion = round(
            ((experiments_completed / total_available) * 50.0)
            + ((passed_exp_quizzes / total_available) * 50.0),
            1,
        )
    else:
        overall_completion = 0.0

    recently_accessed = sorted(
        [item for item in per_experiment if item.last_accessed is not None],
        key=lambda x: x.last_accessed,  # type: ignore[arg-type]
        reverse=True,
    )[:4]

    recommended = [
        item.experiment_id
        for item in per_experiment
        if not item.completed or (item.best_quiz_percentage is None or item.best_quiz_percentage < 60.0)
    ]
    if not recommended:
        recommended = [item.experiment_id for item in per_experiment[:2]]

    return StudentProgressResponse(
        student=_to_student_out(student),
        total_experiments_available=total_available,
        experiments_completed=experiments_completed,
        total_simulation_runs=len(runs),
        quizzes_attempted=quizzes_attempted,
        quizzes_passed=quizzes_passed,
        average_quiz_score=average_quiz_score,
        overall_completion_percentage=overall_completion,
        recently_accessed=recently_accessed,
        recommended_experiments=recommended,
        per_experiment=per_experiment,
    )


def get_student_history(db: sqlite3.Connection, student_id: str) -> StudentHistoryResponse:
    """Return full chronological history of simulation runs, quiz attempts, and activities."""
    student = ensure_student_exists(db, student_id)
    exp_map = {
        r["id"]: r["title"] for r in db.execute("SELECT id, title FROM experiments").fetchall()
    }
    quiz_map = {
        r["id"]: r["title"] for r in db.execute("SELECT id, title FROM quizzes").fetchall()
    }

    runs = db.execute(
        "SELECT * FROM simulation_runs WHERE student_id = ? ORDER BY created_at DESC LIMIT 50",
        (student["id"],),
    ).fetchall()
    attempts = db.execute(
        "SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY created_at DESC LIMIT 50",
        (student["id"],),
    ).fetchall()
    activities = db.execute(
        "SELECT * FROM learning_activities WHERE student_id = ? ORDER BY created_at DESC LIMIT 30",
        (student["id"],),
    ).fetchall()

    return StudentHistoryResponse(
        student_id=student["id"],
        simulation_runs=[
            SimulationRunRecord(
                id=r["id"],
                experiment_id=r["experiment_id"],
                experiment_title=exp_map.get(r["experiment_id"], r["experiment_id"]),
                parameters=json.loads(r["parameters_json"]),
                measurements=json.loads(r["measurements_json"]),
                notes=r["notes"],
                completed=bool(r["completed"]),
                created_at=_parse_dt(r["created_at"]),
            )
            for r in runs
        ],
        quiz_attempts=[
            QuizAttemptRecord(
                id=a["id"],
                quiz_id=a["quiz_id"],
                quiz_title=quiz_map.get(a["quiz_id"], a["quiz_id"]),
                experiment_id=a["experiment_id"],
                score=a["score"],
                total_questions=a["total_questions"],
                percentage=float(a["percentage"]),
                passed=bool(a["passed"]),
                created_at=_parse_dt(a["created_at"]),
            )
            for a in attempts
        ],
        recent_activities=[
            LearningActivityRecord(
                id=act["id"],
                activity_type=act["activity_type"],
                experiment_id=act["experiment_id"],
                title=act["title"],
                summary=act["summary"],
                created_at=_parse_dt(act["created_at"]),
            )
            for act in activities
        ],
    )
