"""SQLite DDL schema definitions for LabXAI (non-destructive, backward-compatible)."""

SCHEMA_STATEMENTS: list[str] = [
    """
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        grade_level TEXT NOT NULL DEFAULT 'Class 10 - High School',
        preferred_language TEXT NOT NULL DEFAULT 'en',
        theme TEXT NOT NULL DEFAULT 'light',
        narration_enabled INTEGER NOT NULL DEFAULT 1,
        is_demo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_kn TEXT NOT NULL,
        subject TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 15,
        short_description TEXT NOT NULL,
        short_description_kn TEXT NOT NULL,
        theory TEXT NOT NULL,
        theory_kn TEXT NOT NULL,
        objectives_json TEXT NOT NULL,
        objectives_kn_json TEXT NOT NULL,
        apparatus_json TEXT NOT NULL,
        instructions_json TEXT NOT NULL,
        instructions_kn_json TEXT NOT NULL,
        formulas_json TEXT NOT NULL,
        assumptions_json TEXT NOT NULL,
        parameters_schema_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS simulation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        experiment_id TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        measurements_json TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        completed INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        experiment_id TEXT NOT NULL,
        title TEXT NOT NULL,
        title_kn TEXT NOT NULL,
        description TEXT NOT NULL,
        description_kn TEXT NOT NULL,
        passing_score INTEGER NOT NULL DEFAULT 60,
        FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_text_kn TEXT NOT NULL,
        options_json TEXT NOT NULL,
        options_kn_json TEXT NOT NULL,
        correct_option_index INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        explanation_kn TEXT NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        quiz_id TEXT NOT NULL,
        experiment_id TEXT NOT NULL,
        answers_json TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage REAL NOT NULL,
        passed INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS learning_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        experiment_id TEXT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """,
    "CREATE INDEX IF NOT EXISTS ix_experiments_subject ON experiments(subject)",
    "CREATE INDEX IF NOT EXISTS ix_experiments_difficulty ON experiments(difficulty)",
    "CREATE INDEX IF NOT EXISTS ix_sim_runs_student_exp ON simulation_runs(student_id, experiment_id)",
    "CREATE INDEX IF NOT EXISTS ix_sim_runs_created ON simulation_runs(created_at)",
    "CREATE INDEX IF NOT EXISTS ix_quiz_questions_quiz ON quiz_questions(quiz_id, order_index)",
    "CREATE INDEX IF NOT EXISTS ix_quiz_attempts_student_quiz ON quiz_attempts(student_id, quiz_id)",
    "CREATE INDEX IF NOT EXISTS ix_activities_student_created ON learning_activities(student_id, created_at)",
]
