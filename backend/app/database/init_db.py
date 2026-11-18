"""Non-destructive SQLite schema initialization, safe migrations, and idempotent seed loader."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.database.catalog_data import ALL_EXPERIMENTS_SEED, SUBJECTS_SEED
from app.database.quizzes_data import ALL_QUIZZES_SEED
from app.database.seed_data import DEFAULT_DEMO_STUDENT
from app.database.session import create_connection
from app.database.videos_data import VIDEOS_SEED
from app.models.db_models import MIGRATION_COLUMNS, SCHEMA_STATEMENTS


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _apply_safe_migrations(conn: sqlite3.Connection) -> None:
    """Inspect existing SQLite tables and add missing columns non-destructively."""
    for table, columns in MIGRATION_COLUMNS.items():
        existing = {
            row["name"]
            for row in conn.execute(f"PRAGMA table_info({table})").fetchall()
        }
        for col_name, col_def in columns:
            if col_name not in existing:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}")


def init_db(db_path: str | None = None) -> None:
    """Create missing tables, run safe column migrations, create indexes, and seed records."""
    conn = create_connection(db_path)
    try:
        table_stmts = [s for s in SCHEMA_STATEMENTS if not s.strip().upper().startswith("CREATE INDEX")]
        index_stmts = [s for s in SCHEMA_STATEMENTS if s.strip().upper().startswith("CREATE INDEX")]
        for statement in table_stmts:
            conn.execute(statement)
        _apply_safe_migrations(conn)
        for statement in index_stmts:
            conn.execute(statement)
        seed_database(conn)
        conn.commit()
    finally:
        conn.close()


def seed_database(conn: sqlite3.Connection) -> None:
    """Insert subjects, demo student, 48 experiments, 48 quizzes, and verified videos idempotently."""
    now = utc_now_iso()

    # 1. Subjects
    for subj in SUBJECTS_SEED:
        conn.execute(
            """
            INSERT OR IGNORE INTO subjects (
                id, name, slug, description, icon, color, order_index, translations_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                subj["id"],
                subj["name"],
                subj["slug"],
                subj["description"],
                subj["icon"],
                subj["color"],
                subj["order_index"],
                json.dumps(subj.get("translations", {}), ensure_ascii=False),
            ),
        )

    # 2. Default demo student
    s = DEFAULT_DEMO_STUDENT
    conn.execute(
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

    # 3. Experiments (48 across Physics, Chemistry, Biology, Mathematics)
    for exp in ALL_EXPERIMENTS_SEED:
        conn.execute(
            """
            INSERT OR IGNORE INTO experiments (
                id, title, title_kn, subject, discipline, topic, difficulty, duration_minutes,
                short_description, short_description_kn, introduction, theory, theory_kn,
                objectives_json, objectives_kn_json, apparatus_json,
                instructions_json, instructions_kn_json, formulas_json,
                assumptions_json, real_world_applications_json, common_mistakes_json,
                related_experiments_json, safety_note, visual_type, translations_json,
                parameters_schema_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                exp["id"],
                exp["title"],
                exp["title_kn"],
                exp["subject"],
                exp["discipline"],
                exp.get("topic", ""),
                exp["difficulty"],
                exp["duration_minutes"],
                exp["short_description"],
                exp["short_description_kn"],
                exp.get("introduction", ""),
                exp["theory"],
                exp["theory_kn"],
                json.dumps(exp["objectives"], ensure_ascii=False),
                json.dumps(exp["objectives_kn"], ensure_ascii=False),
                json.dumps(exp["apparatus"], ensure_ascii=False),
                json.dumps(exp["instructions"], ensure_ascii=False),
                json.dumps(exp["instructions_kn"], ensure_ascii=False),
                json.dumps(exp["formulas"], ensure_ascii=False),
                json.dumps(exp["assumptions"], ensure_ascii=False),
                json.dumps(exp.get("real_world_applications", []), ensure_ascii=False),
                json.dumps(exp.get("common_mistakes", []), ensure_ascii=False),
                json.dumps(exp.get("related_experiments", []), ensure_ascii=False),
                exp.get("safety_note", ""),
                exp.get("visual_type", exp["id"]),
                json.dumps(exp.get("translations", {}), ensure_ascii=False),
                json.dumps(exp["parameters_schema"], ensure_ascii=False),
                now,
            ),
        )
        # Upgrade previously seeded rows safely so new metadata fields are populated
        conn.execute(
            """
            UPDATE experiments
            SET discipline = ?, topic = ?, difficulty = ?, introduction = ?,
                real_world_applications_json = ?, common_mistakes_json = ?,
                related_experiments_json = ?, safety_note = ?, visual_type = ?,
                translations_json = ?
            WHERE id = ? AND (introduction = '' OR visual_type = 'generic' OR difficulty = 'Beginner')
            """,
            (
                exp["discipline"],
                exp.get("topic", ""),
                exp["difficulty"],
                exp.get("introduction", ""),
                json.dumps(exp.get("real_world_applications", []), ensure_ascii=False),
                json.dumps(exp.get("common_mistakes", []), ensure_ascii=False),
                json.dumps(exp.get("related_experiments", []), ensure_ascii=False),
                exp.get("safety_note", ""),
                exp.get("visual_type", exp["id"]),
                json.dumps(exp.get("translations", {}), ensure_ascii=False),
                exp["id"],
            ),
        )

    # 4. Quizzes & Questions (48 quizzes)
    for quiz in ALL_QUIZZES_SEED:
        conn.execute(
            """
            INSERT OR IGNORE INTO quizzes (
                id, experiment_id, subject, difficulty, title, title_kn,
                description, description_kn, passing_score, translations_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                quiz["id"],
                quiz["experiment_id"],
                quiz.get("subject", "Physics"),
                quiz.get("difficulty", "Basic"),
                quiz["title"],
                quiz["title_kn"],
                quiz["description"],
                quiz["description_kn"],
                quiz["passing_score"],
                json.dumps(quiz.get("translations", {}), ensure_ascii=False),
            ),
        )
        conn.execute(
            """
            UPDATE quizzes SET subject = ?, difficulty = ?
            WHERE id = ? AND (subject = 'Physics' AND difficulty = 'Basic')
            """,
            (quiz.get("subject", "Physics"), quiz.get("difficulty", "Basic"), quiz["id"]),
        )
        for q in quiz["questions"]:
            conn.execute(
                """
                INSERT OR IGNORE INTO quiz_questions (
                    id, quiz_id, order_index, question_type, question_text, question_text_kn,
                    options_json, options_kn_json, correct_option_index,
                    numeric_answer, numeric_tolerance, unit,
                    explanation, explanation_kn, translations_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    q["id"],
                    quiz["id"],
                    q["order_index"],
                    q.get("question_type", "mcq"),
                    q["question_text"],
                    q["question_text_kn"],
                    json.dumps(q.get("options", []), ensure_ascii=False),
                    json.dumps(q.get("options_kn", []), ensure_ascii=False),
                    q.get("correct_option_index", 0),
                    q.get("numeric_answer"),
                    q.get("numeric_tolerance", 0.05),
                    q.get("unit", ""),
                    q["explanation"],
                    q["explanation_kn"],
                    json.dumps(q.get("translations", {}), ensure_ascii=False),
                ),
            )

    # 5. Verified Educational Videos
    for vid in VIDEOS_SEED:
        conn.execute(
            """
            INSERT OR IGNORE INTO videos (
                id, title, subject, experiment_id, difficulty, language, provider, category,
                video_url, embed_url, thumbnail_url, duration, description, transcript,
                captions_available, featured, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                vid["id"],
                vid["title"],
                vid["subject"],
                vid.get("experiment_id"),
                vid.get("difficulty", "Basic"),
                vid.get("language", "en"),
                vid.get("provider", "YouTube"),
                vid.get("category", "Concept Introduction"),
                vid["video_url"],
                vid.get("embed_url"),
                vid.get("thumbnail_url", ""),
                vid.get("duration", ""),
                vid.get("description", ""),
                vid.get("transcript", ""),
                1 if vid.get("captions_available", True) else 0,
                1 if vid.get("featured", False) else 0,
                now,
            ),
        )
