"""Business logic for retrieving experiments and persisting simulation runs (SQLite)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.core.security import sanitize_text
from app.database.seed_data import DEFAULT_DEMO_STUDENT
from app.schemas.experiments import (
    ExperimentDetail,
    ExperimentSummary,
    MeasurementItem,
    ParameterSpec,
    SimulationRequest,
    SimulationResponse,
)
from app.services.simulation_engine import run_simulation


def _to_summary(row: sqlite3.Row) -> ExperimentSummary:
    return ExperimentSummary(
        id=row["id"],
        title=row["title"],
        title_kn=row["title_kn"],
        subject=row["subject"],
        difficulty=row["difficulty"],
        duration_minutes=row["duration_minutes"],
        short_description=row["short_description"],
        short_description_kn=row["short_description_kn"],
        objectives=json.loads(row["objectives_json"]),
        objectives_kn=json.loads(row["objectives_kn_json"]),
    )


def _to_detail(row: sqlite3.Row) -> ExperimentDetail:
    summary = _to_summary(row)
    return ExperimentDetail(
        **summary.model_dump(),
        theory=row["theory"],
        theory_kn=row["theory_kn"],
        apparatus=json.loads(row["apparatus_json"]),
        instructions=json.loads(row["instructions_json"]),
        instructions_kn=json.loads(row["instructions_kn_json"]),
        formulas=json.loads(row["formulas_json"]),
        assumptions=json.loads(row["assumptions_json"]),
        parameters_schema=[ParameterSpec(**p) for p in json.loads(row["parameters_schema_json"])],
    )


def ensure_student_exists(db: sqlite3.Connection, student_id: str) -> sqlite3.Row:
    """Return existing student row or ensure the default demo student is present."""
    row = db.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if row is not None:
        return row
    if student_id == DEFAULT_DEMO_STUDENT["id"]:
        now = datetime.now(timezone.utc).isoformat()
        s = DEFAULT_DEMO_STUDENT
        db.execute(
            """
            INSERT OR IGNORE INTO students (
                id, name, email, grade_level, preferred_language, theme,
                narration_enabled, is_demo, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                s["id"],
                s["name"],
                s["email"],
                s["grade_level"],
                s["preferred_language"],
                s["theme"],
                1 if s["narration_enabled"] else 0,
                1 if s["is_demo"] else 0,
                now,
                now,
            ),
        )
        db.commit()
        created = db.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if created is not None:
            return created
    raise LookupError(f"Student '{student_id}' not found.")


def list_experiments(
    db: sqlite3.Connection,
    *,
    subject: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
) -> list[ExperimentSummary]:
    """List experiments with optional filtering by subject, difficulty, or keyword."""
    rows = db.execute("SELECT * FROM experiments ORDER BY title ASC").fetchall()
    results: list[ExperimentSummary] = []
    for row in rows:
        if subject and subject.lower() != "all" and subject.lower() not in row["subject"].lower():
            continue
        if difficulty and difficulty.lower() != "all" and row["difficulty"].lower() != difficulty.lower():
            continue
        if search:
            q = search.strip().lower()
            haystack = " ".join(
                [
                    row["title"],
                    row["title_kn"],
                    row["subject"],
                    row["short_description"],
                    row["short_description_kn"],
                ]
            ).lower()
            if q not in haystack:
                continue
        results.append(_to_summary(row))
    return results


def get_experiment_detail(db: sqlite3.Connection, experiment_id: str) -> ExperimentDetail | None:
    """Retrieve full experiment metadata by ID."""
    row = db.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,)).fetchone()
    if row is None:
        return None
    return _to_detail(row)


def execute_experiment_simulation(
    db: sqlite3.Connection, experiment_id: str, request: SimulationRequest
) -> SimulationResponse:
    """Run deterministic simulation and optionally persist observation run."""
    exp_row = db.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,)).fetchone()
    if exp_row is None:
        raise LookupError(f"Experiment '{experiment_id}' not found.")

    sim_result = run_simulation(experiment_id, request.parameters)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    run_id: int | None = None

    if request.save_run:
        student = ensure_student_exists(db, request.student_id)
        notes = sanitize_text(request.notes, 1000)
        cursor = db.execute(
            """
            INSERT INTO simulation_runs (
                student_id, experiment_id, parameters_json, measurements_json,
                notes, completed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                student["id"],
                exp_row["id"],
                json.dumps(sim_result["parameters"]),
                json.dumps(sim_result["measurements"]),
                notes,
                1,
                now_iso,
            ),
        )
        run_id = int(cursor.lastrowid)

        db.execute(
            """
            INSERT INTO learning_activities (
                student_id, activity_type, experiment_id, title, summary, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                student["id"],
                "experiment_run",
                exp_row["id"],
                f"Completed simulation: {exp_row['title']}",
                sim_result["conclusion_summary"],
                json.dumps({"run_id": run_id}),
                now_iso,
            ),
        )
        db.commit()

    return SimulationResponse(
        experiment_id=exp_row["id"],
        run_id=run_id,
        parameters=sim_result["parameters"],
        measurements=sim_result["measurements"],
        formatted_measurements=[MeasurementItem(**m) for m in sim_result["formatted_measurements"]],
        series_data=sim_result["series_data"],
        special_case=sim_result["special_case"],
        assumptions=sim_result["assumptions"],
        conclusion_summary=sim_result["conclusion_summary"],
        created_at=now,
    )
