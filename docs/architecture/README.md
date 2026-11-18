# LabXAI Architecture

## Application Boundaries

- `frontend/` is the React + Vite + Tailwind CSS browser application (48 virtual labs, 4 subject visualizers, multilingual UI, voice I/O, verified video library, AI tutor, quizzes, and dashboard).
- `backend/` is the FastAPI + SQLite service providing deterministic simulation engines, 48-experiment catalog, 48 quizzes, 38 verified educational videos, formula-safe translation with SQLite caching, server-side OpenRouter AI tutoring, and student analytics.
- `multilingual/` and `speech/` house shared multilingual/speech helpers synchronized with the 5 supported languages (`en`, `kn`, `hi`, `te`, `ta`).
- `mobile/` is the React Native + Expo application using Expo Router (preserved untouched).
- `shared/` contains platform-neutral JavaScript circuit calculations for web & mobile (preserved untouched).
- `tests/` contains Node-based tests for shared scientific logic.

## Repository Structure

```text
backend/app/
├── api/routes/          # Versioned REST routes (experiments, videos, ai, quizzes, students, languages)
├── core/                # Pydantic settings & logging config (OPENROUTER_API_KEY server-side only)
├── database/
│   ├── catalog_physics.py / catalog_chemistry.py / catalog_biology.py / catalog_math.py
│   ├── videos_data.py   # 34 oEmbed-verified YouTube videos + 4 official curriculum portals
│   ├── quizzes_data.py  # 48 quizzes (MCQ, True/False, Numerical, Formula)
│   └── init_db.py       # CREATE TABLE -> safe ALTER TABLE migrations -> CREATE INDEX -> idempotent seed
├── models/db_models.py  # SQLite DDL + MIGRATION_COLUMNS
├── schemas/             # Pydantic request/response contracts
└── services/
    ├── simulations/     # Deterministic calculation engines (physics_sim, chemistry_sim, biology_sim, math_sim)
    ├── simulation_engine.py
    ├── openrouter_service.py
    ├── translation_service.py
    ├── video_service.py
    ├── quiz_service.py
    └── progress_service.py

frontend/src/
├── api/client.js        # Centralized FastAPI HTTP client (zero secrets in browser)
├── components/          # Layout, AiTutorPanel, NarrationControls, VoiceInputButton, VideoPlayerCard, StatusStates
├── context/AppContext.jsx
├── i18n/translations.js # 5-language dictionaries + SUBJECT_COLORS + getLocalizedField
├── pages/               # Landing, Dashboard, Subjects, Library, VirtualLab, VideoLibrary, AiTutor, Quizzes, History, Settings
├── services/            # narration.js (Web SpeechSynthesis), speechRecognition.js (Web SpeechRecognition)
└── simulations/
    ├── physics.js       # Preserved original 4 Physics deterministic engines
    ├── engines/         # 48 client-side deterministic engines + CHART_CONFIG_BY_EXPERIMENT
    └── visualizers/     # Lazy-loaded SVG visualizers (PhysicsExtra, Chemistry, Biology, Math) + original 4 Physics SVGs

mobile/ & shared/        # Preserved React Native + shared circuit logic (circuitLogic.js, circuitTypes.js)
```

## Key Design Invariants

1. **Scientific Determinism:** Simulation math executes deterministically in `backend/app/services/simulations/` and `frontend/src/simulations/engines/`. The AI Tutor receives authoritative measurements as read-only context and never fabricates experimental readings.
2. **Safe Database Migrations:** `init_db.py` creates missing tables, adds new columns via `ALTER TABLE` if absent, creates indexes afterward, and runs idempotent `INSERT OR IGNORE` / `UPDATE` seeding so existing student runs and quiz attempts are never lost.
3. **Lightweight Performance:** Secondary pages and subject visualizers load via `React.lazy` + `Suspense`, and YouTube embeds load only after user click so the app runs smoothly on modest student laptops without local LLMs or Docker.
4. **Shared Circuit Model (`shared/`):** `shared/simulations/circuits/circuitLogic.js` and `circuitTypes.js` remain platform-neutral for web and mobile reuse.
