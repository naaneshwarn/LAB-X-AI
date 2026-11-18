"""Business logic for subjects, multidisciplinary experiments, and simulation runs (SQLite)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.core.security import sanitize_text
from app.database.seed_data import DEFAULT_DEMO_STUDENT
from app.schemas.experiments import (
    ExperimentDetail,
    ExperimentSummary,
    LocalizedExplanation,
    MeasurementItem,
    ParameterSpec,
    ResultValue,
    SimulationRequest,
    SimulationResponse,
    SubjectSummary,
)
from app.services.result_explanation_service import (
    generate_localized_result_explanation,
    localize_measurement_label,
    normalize_language,
)
from app.services.simulation_engine import run_simulation


def _normalize_difficulty(diff: str | None) -> str | None:
    if not diff or diff.lower() == "all":
        return None
    d = diff.strip().lower()
    if d == "beginner":
        return "basic"
    return d


def _to_summary(row: sqlite3.Row) -> ExperimentSummary:
    return ExperimentSummary(
        id=row["id"],
        title=row["title"],
        title_kn=row["title_kn"],
        subject=row["subject"],
        discipline=row["discipline"] if "discipline" in row.keys() and row["discipline"] else "Physics",
        topic=row["topic"] if "topic" in row.keys() and row["topic"] else "",
        difficulty=row["difficulty"],
        duration_minutes=row["duration_minutes"],
        short_description=row["short_description"],
        short_description_kn=row["short_description_kn"],
        objectives=json.loads(row["objectives_json"]),
        objectives_kn=json.loads(row["objectives_kn_json"]),
        visual_type=row["visual_type"] if "visual_type" in row.keys() and row["visual_type"] else row["id"],
        translations=json.loads(row["translations_json"]) if "translations_json" in row.keys() and row["translations_json"] else {},
    )


def _to_detail(row: sqlite3.Row) -> ExperimentDetail:
    summary = _to_summary(row)
    keys = row.keys()
    return ExperimentDetail(
        **summary.model_dump(),
        introduction=row["introduction"] if "introduction" in keys and row["introduction"] else "",
        theory=row["theory"],
        theory_kn=row["theory_kn"],
        apparatus=json.loads(row["apparatus_json"]),
        instructions=json.loads(row["instructions_json"]),
        instructions_kn=json.loads(row["instructions_kn_json"]),
        formulas=json.loads(row["formulas_json"]),
        assumptions=json.loads(row["assumptions_json"]),
        real_world_applications=json.loads(row["real_world_applications_json"]) if "real_world_applications_json" in keys and row["real_world_applications_json"] else [],
        common_mistakes=json.loads(row["common_mistakes_json"]) if "common_mistakes_json" in keys and row["common_mistakes_json"] else [],
        related_experiments=json.loads(row["related_experiments_json"]) if "related_experiments_json" in keys and row["related_experiments_json"] else [],
        safety_note=row["safety_note"] if "safety_note" in keys and row["safety_note"] else "",
        parameters_schema=[ParameterSpec(**p) for p in json.loads(row["parameters_schema_json"])],
    )


def list_subjects(db: sqlite3.Connection) -> list[SubjectSummary]:
    """Return all 4 academic disciplines with live experiment counts by difficulty level."""
    subject_rows = db.execute("SELECT * FROM subjects ORDER BY order_index ASC").fetchall()
    exp_rows = db.execute("SELECT discipline, difficulty FROM experiments").fetchall()

    counts: dict[str, int] = {}
    level_counts: dict[str, dict[str, int]] = {}
    for er in exp_rows:
        disc = (er["discipline"] or "Physics").lower()
        diff = er["difficulty"] or "Basic"
        counts[disc] = counts.get(disc, 0) + 1
        lvl_map = level_counts.setdefault(disc, {"Basic": 0, "Intermediate": 0, "Advanced": 0})
        norm_diff = "Basic" if diff.lower() == "beginner" else diff
        lvl_map[norm_diff] = lvl_map.get(norm_diff, 0) + 1

    return [
        SubjectSummary(
            id=row["id"],
            name=row["name"],
            slug=row["slug"],
            description=row["description"],
            icon=row["icon"],
            color=row["color"],
            experiment_count=counts.get(row["slug"].lower(), 0),
            level_counts=level_counts.get(row["slug"].lower(), {"Basic": 0, "Intermediate": 0, "Advanced": 0}),
            translations=json.loads(row["translations_json"] or "{}"),
        )
        for row in subject_rows
    ]


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
                narration_enabled, is_demo, learning_level, time_spent_seconds, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                "Basic",
                0,
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
    """List experiments with optional filtering by discipline/subject, difficulty, or keyword."""
    rows = db.execute(
        """
        SELECT * FROM experiments
        ORDER BY
            CASE discipline
                WHEN 'Physics' THEN 1
                WHEN 'Chemistry' THEN 2
                WHEN 'Biology' THEN 3
                WHEN 'Mathematics' THEN 4
                ELSE 5
            END,
            CASE difficulty
                WHEN 'Basic' THEN 1
                WHEN 'Beginner' THEN 1
                WHEN 'Intermediate' THEN 2
                WHEN 'Advanced' THEN 3
                ELSE 4
            END,
            title ASC
        """
    ).fetchall()

    norm_diff = _normalize_difficulty(difficulty)
    results: list[ExperimentSummary] = []
    for row in rows:
        disc = row["discipline"] if "discipline" in row.keys() and row["discipline"] else ""
        if subject and subject.lower() != "all":
            sub_q = subject.strip().lower()
            if sub_q not in row["subject"].lower() and sub_q != disc.lower():
                continue
        if norm_diff:
            row_diff = _normalize_difficulty(row["difficulty"])
            if row_diff != norm_diff:
                continue
        if search:
            q = search.strip().lower()
            trans_raw = row["translations_json"] if "translations_json" in row.keys() and row["translations_json"] else ""
            haystack = " ".join(
                [
                    row["id"],
                    row["title"],
                    row["title_kn"],
                    row["subject"],
                    disc,
                    row["short_description"],
                    row["short_description_kn"],
                    trans_raw,
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


async def execute_experiment_simulation(
    db: sqlite3.Connection, experiment_id: str, request: SimulationRequest
) -> SimulationResponse:
    """Run deterministic simulation, localize explanations into request.language, and optionally persist run."""
    exp_row = db.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,)).fetchone()
    if exp_row is None:
        raise LookupError(f"Experiment '{experiment_id}' not found.")

    lang = normalize_language(request.language)
    sim_result = run_simulation(experiment_id, request.parameters)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    run_id: int | None = None

    keys = exp_row.keys()
    discipline = exp_row["discipline"] if "discipline" in keys and exp_row["discipline"] else "Physics"
    difficulty = exp_row["difficulty"] if "difficulty" in keys and exp_row["difficulty"] else "Basic"
    formulas = json.loads(exp_row["formulas_json"]) if "formulas_json" in keys and exp_row["formulas_json"] else []
    apps = json.loads(exp_row["real_world_applications_json"]) if "real_world_applications_json" in keys and exp_row["real_world_applications_json"] else []
    translations_map = json.loads(exp_row["translations_json"]) if "translations_json" in keys and exp_row["translations_json"] else {}

    localized_title = (
        translations_map.get(lang, {}).get("title")
        or (exp_row["title_kn"] if lang == "kn" else exp_row["title"])
        or exp_row["title"]
    )

    explanation_dict = await generate_localized_result_explanation(
        db,
        experiment_id=exp_row["id"],
        experiment_title=localized_title,
        discipline=discipline,
        difficulty=difficulty,
        language=lang,
        parameters=sim_result["parameters"],
        measurements=sim_result["measurements"],
        formatted_measurements=sim_result["formatted_measurements"],
        formulas=formulas,
        conclusion_en=sim_result["conclusion_summary"],
        applications_en=apps,
    )

    localized_formatted = [
        MeasurementItem(
            key=m["key"],
            label=localize_measurement_label(m["key"], m["label"], lang),
            value=m["value"],
            unit=m["unit"],
        )
        for m in sim_result["formatted_measurements"]
    ]
    structured_results = {
        m.key: ResultValue(value=m.value, unit=m.unit, label=m.label)
        for m in localized_formatted
    }
    conclusion_out = (
        explanation_dict["conclusion"]
        if explanation_dict.get("translation_available") and explanation_dict.get("conclusion")
        else sim_result["conclusion_summary"]
    )

    if request.save_run:
        student = ensure_student_exists(db, request.student_id)
        notes = sanitize_text(request.notes, 1000)
        dur = max(0, int(request.duration_seconds or 60))
        cursor = db.execute(
            """
            INSERT INTO simulation_runs (
                student_id, experiment_id, parameters_json, measurements_json,
                notes, completed, duration_seconds, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                student["id"],
                exp_row["id"],
                json.dumps(sim_result["parameters"]),
                json.dumps(sim_result["measurements"]),
                notes,
                1,
                dur,
                now_iso,
            ),
        )
        run_id = int(cursor.lastrowid)

        db.execute(
            "UPDATE students SET time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?, updated_at = ? WHERE id = ?",
            (dur, now_iso, student["id"]),
        )

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
                conclusion_out,
                json.dumps({"run_id": run_id, "discipline": discipline, "language": lang}),
                now_iso,
            ),
        )
        db.commit()

    return SimulationResponse(
        experiment_id=exp_row["id"],
        language=lang,
        run_id=run_id,
        parameters=sim_result["parameters"],
        measurements=sim_result["measurements"],
        results=structured_results,
        formatted_measurements=localized_formatted,
        series_data=sim_result["series_data"],
        special_case=sim_result["special_case"],
        assumptions=sim_result["assumptions"],
        conclusion_summary=conclusion_out,
        explanation=LocalizedExplanation(**explanation_dict),
        created_at=now,
    )
