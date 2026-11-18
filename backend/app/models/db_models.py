"""SQLite DDL schema definitions and non-destructive migrations for LabXAI."""

SCHEMA_STATEMENTS: list[str] = [
    """
    CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        translations_json TEXT NOT NULL DEFAULT '{}'
    )
    """,
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
        learning_level TEXT NOT NULL DEFAULT 'Basic',
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
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
        discipline TEXT NOT NULL DEFAULT 'Physics',
        topic TEXT NOT NULL DEFAULT '',
        difficulty TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 15,
        short_description TEXT NOT NULL,
        short_description_kn TEXT NOT NULL,
        introduction TEXT NOT NULL DEFAULT '',
        theory TEXT NOT NULL,
        theory_kn TEXT NOT NULL,
        objectives_json TEXT NOT NULL,
        objectives_kn_json TEXT NOT NULL,
        apparatus_json TEXT NOT NULL,
        instructions_json TEXT NOT NULL,
        instructions_kn_json TEXT NOT NULL,
        formulas_json TEXT NOT NULL,
        assumptions_json TEXT NOT NULL,
        real_world_applications_json TEXT NOT NULL DEFAULT '[]',
        common_mistakes_json TEXT NOT NULL DEFAULT '[]',
        related_experiments_json TEXT NOT NULL DEFAULT '[]',
        safety_note TEXT NOT NULL DEFAULT '',
        visual_type TEXT NOT NULL DEFAULT 'generic',
        translations_json TEXT NOT NULL DEFAULT '{}',
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
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        experiment_id TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT 'Physics',
        difficulty TEXT NOT NULL DEFAULT 'Basic',
        title TEXT NOT NULL,
        title_kn TEXT NOT NULL,
        description TEXT NOT NULL,
        description_kn TEXT NOT NULL,
        passing_score INTEGER NOT NULL DEFAULT 60,
        translations_json TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        question_type TEXT NOT NULL DEFAULT 'mcq',
        question_text TEXT NOT NULL,
        question_text_kn TEXT NOT NULL,
        options_json TEXT NOT NULL,
        options_kn_json TEXT NOT NULL,
        correct_option_index INTEGER NOT NULL DEFAULT 0,
        numeric_answer REAL,
        numeric_tolerance REAL DEFAULT 0.05,
        unit TEXT NOT NULL DEFAULT '',
        explanation TEXT NOT NULL,
        explanation_kn TEXT NOT NULL,
        translations_json TEXT NOT NULL DEFAULT '{}',
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
    """
    CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        experiment_id TEXT,
        difficulty TEXT NOT NULL DEFAULT 'Basic',
        language TEXT NOT NULL DEFAULT 'en',
        provider TEXT NOT NULL DEFAULT 'YouTube',
        category TEXT NOT NULL DEFAULT 'Concept Introduction',
        video_url TEXT NOT NULL,
        embed_url TEXT,
        thumbnail_url TEXT NOT NULL DEFAULT '',
        duration TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        transcript TEXT NOT NULL DEFAULT '',
        captions_available INTEGER NOT NULL DEFAULT 1,
        featured INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS translations_cache (
        cache_key TEXT PRIMARY KEY,
        source_lang TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        source_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'glossary',
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS learning_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        experiment_id TEXT,
        subject TEXT NOT NULL DEFAULT 'Physics',
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS playground_projects (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        name TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'circuit',
        workspace_json TEXT NOT NULL,
        observations_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """,
    "CREATE INDEX IF NOT EXISTS ix_experiments_subject ON experiments(subject)",
    "CREATE INDEX IF NOT EXISTS ix_playground_projects_student ON playground_projects(student_id, updated_at)",
    "CREATE INDEX IF NOT EXISTS ix_experiments_discipline ON experiments(discipline)",
    "CREATE INDEX IF NOT EXISTS ix_experiments_difficulty ON experiments(difficulty)",
    "CREATE INDEX IF NOT EXISTS ix_sim_runs_student_exp ON simulation_runs(student_id, experiment_id)",
    "CREATE INDEX IF NOT EXISTS ix_sim_runs_created ON simulation_runs(created_at)",
    "CREATE INDEX IF NOT EXISTS ix_quiz_questions_quiz ON quiz_questions(quiz_id, order_index)",
    "CREATE INDEX IF NOT EXISTS ix_quiz_attempts_student_quiz ON quiz_attempts(student_id, quiz_id)",
    "CREATE INDEX IF NOT EXISTS ix_activities_student_created ON learning_activities(student_id, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_videos_subject ON videos(subject)",
    "CREATE INDEX IF NOT EXISTS ix_videos_experiment ON videos(experiment_id)",
]

# Non-destructive column additions for upgrading existing SQLite databases safely
MIGRATION_COLUMNS: dict[str, list[tuple[str, str]]] = {
    "students": [
        ("learning_level", "TEXT NOT NULL DEFAULT 'Basic'"),
        ("time_spent_seconds", "INTEGER NOT NULL DEFAULT 0"),
    ],
    "experiments": [
        ("discipline", "TEXT NOT NULL DEFAULT 'Physics'"),
        ("topic", "TEXT NOT NULL DEFAULT ''"),
        ("introduction", "TEXT NOT NULL DEFAULT ''"),
        ("real_world_applications_json", "TEXT NOT NULL DEFAULT '[]'"),
        ("common_mistakes_json", "TEXT NOT NULL DEFAULT '[]'"),
        ("related_experiments_json", "TEXT NOT NULL DEFAULT '[]'"),
        ("safety_note", "TEXT NOT NULL DEFAULT ''"),
        ("visual_type", "TEXT NOT NULL DEFAULT 'generic'"),
        ("translations_json", "TEXT NOT NULL DEFAULT '{}'"),
    ],
    "simulation_runs": [
        ("duration_seconds", "INTEGER NOT NULL DEFAULT 0"),
    ],
    "quizzes": [
        ("subject", "TEXT NOT NULL DEFAULT 'Physics'"),
        ("difficulty", "TEXT NOT NULL DEFAULT 'Basic'"),
        ("translations_json", "TEXT NOT NULL DEFAULT '{}'"),
    ],
    "quiz_questions": [
        ("question_type", "TEXT NOT NULL DEFAULT 'mcq'"),
        ("numeric_answer", "REAL"),
        ("numeric_tolerance", "REAL DEFAULT 0.05"),
        ("unit", "TEXT NOT NULL DEFAULT ''"),
        ("translations_json", "TEXT NOT NULL DEFAULT '{}'"),
    ],
}
