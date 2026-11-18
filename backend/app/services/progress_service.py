"""Student profile, multidisciplinary subject-wise progress, streaks, and history (SQLite)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta, timezone

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
    SubjectProgressItem,
)
from app.services.experiment_service import ensure_student_exists


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _to_student_out(row: sqlite3.Row) -> StudentOut:
    keys = row.keys()
    return StudentOut(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        grade_level=row["grade_level"],
        preferred_language=row["preferred_language"],
        theme=row["theme"],
        narration_enabled=bool(row["narration_enabled"]),
        is_demo=bool(row["is_demo"]),
        learning_level=row["learning_level"] if "learning_level" in keys and row["learning_level"] else "Basic",
        time_spent_seconds=int(row["time_spent_seconds"]) if "time_spent_seconds" in keys and row["time_spent_seconds"] else 0,
        created_at=_parse_dt(row["created_at"]),
    )


def _compute_streak_days(activity_rows: list[sqlite3.Row]) -> int:
    """Compute consecutive calendar-day learning streak from real activity timestamps."""
    if not activity_rows:
        return 0
    dates = sorted({_parse_dt(r["created_at"]).date() for r in activity_rows}, reverse=True)
    today = datetime.now(timezone.utc).date()
    if dates[0] < today - timedelta(days=1):
        return 0
    streak = 1
    for i in range(len(dates) - 1):
        if dates[i] - dates[i + 1] == timedelta(days=1):
            streak += 1
        else:
            break
    return streak


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
    learning_level = (
        payload.learning_level
        if payload.learning_level is not None
        else (row["learning_level"] if "learning_level" in row.keys() and row["learning_level"] else "Basic")
    )
    updated_at = datetime.now(timezone.utc).isoformat()

    db.execute(
        """
        UPDATE students
        SET name = ?, grade_level = ?, preferred_language = ?, theme = ?,
            narration_enabled = ?, learning_level = ?, updated_at = ?
        WHERE id = ?
        """,
        (name, grade_level, preferred_language, theme, narration_enabled, learning_level, updated_at, student_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    return _to_student_out(updated)


def get_student_progress(
    db: sqlite3.Connection,
    student_id: str,
    subject: str | None = None,
    difficulty: str | None = None,
) -> StudentProgressResponse:
    """Compute real, non-mocked multidisciplinary dashboard metrics from SQLite."""
    student = ensure_student_exists(db, student_id)
    all_experiments = db.execute("SELECT * FROM experiments ORDER BY discipline ASC, title ASC").fetchall()
    runs = db.execute(
        "SELECT * FROM simulation_runs WHERE student_id = ? ORDER BY created_at DESC",
        (student["id"],),
    ).fetchall()
    attempts = db.execute(
        "SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY created_at DESC",
        (student["id"],),
    ).fetchall()
    activities = db.execute(
        "SELECT created_at FROM learning_activities WHERE student_id = ? ORDER BY created_at DESC",
        (student["id"],),
    ).fetchall()

    runs_by_exp: dict[str, list[sqlite3.Row]] = {}
    for run in runs:
        runs_by_exp.setdefault(run["experiment_id"], []).append(run)

    attempts_by_exp: dict[str, list[sqlite3.Row]] = {}
    for att in attempts:
        attempts_by_exp.setdefault(att["experiment_id"], []).append(att)

    # Filter experiments if requested
    norm_diff = None
    if difficulty and difficulty.lower() != "all":
        norm_diff = "basic" if difficulty.lower() == "beginner" else difficulty.lower()

    filtered_experiments = []
    for exp in all_experiments:
        disc = exp["discipline"] if "discipline" in exp.keys() and exp["discipline"] else "Physics"
        exp_diff = "basic" if exp["difficulty"].lower() == "beginner" else exp["difficulty"].lower()
        if subject and subject.lower() != "all" and disc.lower() != subject.lower():
            continue
        if norm_diff and exp_diff != norm_diff:
            continue
        filtered_experiments.append(exp)

    per_experiment: list[ExperimentProgressItem] = []
    for exp in filtered_experiments:
        exp_runs = runs_by_exp.get(exp["id"], [])
        exp_attempts = attempts_by_exp.get(exp["id"], [])
        best_quiz = max((float(a["percentage"]) for a in exp_attempts), default=None)

        timestamps: list[datetime] = []
        if exp_runs:
            timestamps.append(_parse_dt(exp_runs[0]["created_at"]))
        if exp_attempts:
            timestamps.append(_parse_dt(exp_attempts[0]["created_at"]))
        last_accessed = max(timestamps) if timestamps else None
        disc = exp["discipline"] if "discipline" in exp.keys() and exp["discipline"] else "Physics"

        per_experiment.append(
            ExperimentProgressItem(
                experiment_id=exp["id"],
                title=exp["title"],
                title_kn=exp["title_kn"],
                subject=exp["subject"],
                discipline=disc,
                difficulty=exp["difficulty"],
                runs_count=len(exp_runs),
                best_quiz_percentage=best_quiz,
                completed=len(exp_runs) > 0,
                last_accessed=last_accessed,
            )
        )

    # Subject-wise progress across all 4 disciplines
    subject_progress: list[SubjectProgressItem] = []
    for disc_name in ("Physics", "Chemistry", "Biology", "Mathematics"):
        disc_exps = [
            e for e in all_experiments
            if (e["discipline"] if "discipline" in e.keys() and e["discipline"] else "Physics") == disc_name
        ]
        total_d = len(disc_exps)
        comp_d = sum(1 for e in disc_exps if len(runs_by_exp.get(e["id"], [])) > 0)
        disc_runs = sum(len(runs_by_exp.get(e["id"], [])) for e in disc_exps)
        disc_quiz_scores = [
            float(a["percentage"])
            for e in disc_exps
            for a in attempts_by_exp.get(e["id"], [])
        ]
        avg_q = round(sum(disc_quiz_scores) / len(disc_quiz_scores), 1) if disc_quiz_scores else None
        pct = round((comp_d / total_d) * 100.0, 1) if total_d > 0 else 0.0
        subject_progress.append(
            SubjectProgressItem(
                subject=disc_name,
                total_experiments=total_d,
                completed_experiments=comp_d,
                completion_percentage=pct,
                average_quiz_score=avg_q,
                total_runs=disc_runs,
            )
        )

    experiments_completed = sum(1 for item in per_experiment if item.completed)
    total_available = len(per_experiment)
    exp_ids_set = {e["id"] for e in filtered_experiments}
    filtered_attempts = [a for a in attempts if a["experiment_id"] in exp_ids_set]
    filtered_runs = [r for r in runs if r["experiment_id"] in exp_ids_set]

    quizzes_attempted = len(filtered_attempts)
    quizzes_passed = sum(1 for a in filtered_attempts if bool(a["passed"]))
    average_quiz_score = (
        round(sum(float(a["percentage"]) for a in filtered_attempts) / quizzes_attempted, 2)
        if quizzes_attempted > 0
        else 0.0
    )

    passed_exp_quizzes = len({a["experiment_id"] for a in filtered_attempts if bool(a["passed"])})
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
    )[:6]

    recommended = [
        item.experiment_id
        for item in per_experiment
        if not item.completed or (item.best_quiz_percentage is None or item.best_quiz_percentage < 60.0)
    ][:6]
    if not recommended:
        recommended = [item.experiment_id for item in per_experiment[:4]]

    # Derive current learning level honestly from completed experiments
    completed_diffs = {item.difficulty for item in per_experiment if item.completed}
    if "Advanced" in completed_diffs:
        derived_level = "Advanced"
    elif "Intermediate" in completed_diffs or experiments_completed >= 4:
        derived_level = "Intermediate"
    else:
        derived_level = "Basic"

    time_spent_sec = int(student["time_spent_seconds"]) if "time_spent_seconds" in student.keys() and student["time_spent_seconds"] else 0
    time_spent_minutes = int(round(time_spent_sec / 60.0))

    return StudentProgressResponse(
        student=_to_student_out(student),
        total_experiments_available=total_available,
        experiments_completed=experiments_completed,
        total_simulation_runs=len(filtered_runs),
        quizzes_attempted=quizzes_attempted,
        quizzes_passed=quizzes_passed,
        average_quiz_score=average_quiz_score,
        overall_completion_percentage=overall_completion,
        learning_streak_days=_compute_streak_days(activities),
        time_spent_minutes=time_spent_minutes,
        current_learning_level=derived_level,
        subject_progress=subject_progress,
        recently_accessed=recently_accessed,
        recommended_experiments=recommended,
        per_experiment=per_experiment,
    )


def get_student_history(db: sqlite3.Connection, student_id: str) -> StudentHistoryResponse:
    """Return full chronological history of simulation runs, quiz attempts, and activities."""
    student = ensure_student_exists(db, student_id)
    exp_rows = db.execute("SELECT id, title, discipline, difficulty FROM experiments").fetchall()
    exp_map = {r["id"]: r for r in exp_rows}
    quiz_map = {
        r["id"]: r["title"] for r in db.execute("SELECT id, title FROM quizzes").fetchall()
    }

    runs = db.execute(
        "SELECT * FROM simulation_runs WHERE student_id = ? ORDER BY created_at DESC LIMIT 100",
        (student["id"],),
    ).fetchall()
    attempts = db.execute(
        "SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY created_at DESC LIMIT 100",
        (student["id"],),
    ).fetchall()
    activities = db.execute(
        "SELECT * FROM learning_activities WHERE student_id = ? ORDER BY created_at DESC LIMIT 50",
        (student["id"],),
    ).fetchall()

    return StudentHistoryResponse(
        student_id=student["id"],
        simulation_runs=[
            SimulationRunRecord(
                id=r["id"],
                experiment_id=r["experiment_id"],
                experiment_title=exp_map[r["experiment_id"]]["title"] if r["experiment_id"] in exp_map else r["experiment_id"],
                discipline=exp_map[r["experiment_id"]]["discipline"] if r["experiment_id"] in exp_map else "Physics",
                difficulty=exp_map[r["experiment_id"]]["difficulty"] if r["experiment_id"] in exp_map else "Basic",
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
