"""Non-destructive SQLite schema initialization and idempotent seed loader."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.database.seed_data import DEFAULT_DEMO_STUDENT, EXPERIMENTS_SEED, QUIZZES_SEED
from app.database.session import create_connection
from app.models.db_models import SCHEMA_STATEMENTS


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db(db_path: str | None = None) -> None:
    """Create missing tables/indexes non-destructively and seed baseline records."""
    conn = create_connection(db_path)
    try:
        for statement in SCHEMA_STATEMENTS:
            conn.execute(statement)
        seed_database(conn)
        conn.commit()
    finally:
        conn.close()


def seed_database(conn: sqlite3.Connection) -> None:
    """Insert default demo student, experiments, and quizzes if missing."""
    now = utc_now_iso()

    # 1. Default demo student
    s = DEFAULT_DEMO_STUDENT
    conn.execute(
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

    # 2. Experiments
    for exp in EXPERIMENTS_SEED:
        conn.execute(
            """
            INSERT OR IGNORE INTO experiments (
                id, title, title_kn, subject, difficulty, duration_minutes,
                short_description, short_description_kn, theory, theory_kn,
                objectives_json, objectives_kn_json, apparatus_json,
                instructions_json, instructions_kn_json, formulas_json,
                assumptions_json, parameters_schema_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                exp["id"],
                exp["title"],
                exp["title_kn"],
                exp["subject"],
                exp["difficulty"],
                exp["duration_minutes"],
                exp["short_description"],
                exp["short_description_kn"],
                exp["theory"],
                exp["theory_kn"],
                json.dumps(exp["objectives"], ensure_ascii=False),
                json.dumps(exp["objectives_kn"], ensure_ascii=False),
                json.dumps(exp["apparatus"], ensure_ascii=False),
                json.dumps(exp["instructions"], ensure_ascii=False),
                json.dumps(exp["instructions_kn"], ensure_ascii=False),
                json.dumps(exp["formulas"], ensure_ascii=False),
                json.dumps(exp["assumptions"], ensure_ascii=False),
                json.dumps(exp["parameters_schema"], ensure_ascii=False),
                now,
            ),
        )

    # 3. Quizzes & Questions
    for quiz in QUIZZES_SEED:
        conn.execute(
            """
            INSERT OR IGNORE INTO quizzes (
                id, experiment_id, title, title_kn, description, description_kn, passing_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                quiz["id"],
                quiz["experiment_id"],
                quiz["title"],
                quiz["title_kn"],
                quiz["description"],
                quiz["description_kn"],
                quiz["passing_score"],
            ),
        )
        for q in quiz["questions"]:
            conn.execute(
                """
                INSERT OR IGNORE INTO quiz_questions (
                    id, quiz_id, order_index, question_text, question_text_kn,
                    options_json, options_kn_json, correct_option_index,
                    explanation, explanation_kn
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    q["id"],
                    quiz["id"],
                    q["order_index"],
                    q["question_text"],
                    q["question_text_kn"],
                    json.dumps(q["options"], ensure_ascii=False),
                    json.dumps(q["options_kn"], ensure_ascii=False),
                    q["correct_option_index"],
                    q["explanation"],
                    q["explanation_kn"],
                ),
            )
