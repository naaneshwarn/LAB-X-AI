# LabXAI API Contracts & Module Boundaries

Base URL (local development): `http://127.0.0.1:8000`

## Preserved Root & Legacy Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root service metadata (`project`, `message`, `version`, `status`) |
| `GET` | `/health` | Service health with live `database` and `ai_engine` status |
| `GET` | `/api/v1` | API version and available modules summary |

---

## Versioned Endpoints (`/api/v1`)

### Health, Languages, Translation, Speech Config & Backend Regional TTS
- `GET /api/v1/health` → `{ status, service, version, database, ai_engine, ai_model }`
- `GET /api/v1/languages` → `{ default_language, languages[], architecture_note }` (5 active languages: `en`, `kn`, `hi`, `te`, `ta`)
- `GET /api/v1/speech/config` → `{ default_language, web_speech_primary, server_tts_available, tts_provider, tts_voices{}, locales[], browser_limitations_note }`
- `POST /api/v1/speech/tts`
  - Request: `{ "text": "Tamil explanation text", "language": "ta", "speed": 1.0 }`
  - Response: `{ success, audio_url, content_type, language, locale, voice, provider, cached, audio_bytes, generation_ms, error }`
  - Independent of OpenRouter and Windows OS voices. Supports `TTS_PROVIDER=edge | sarvam | azure | google | disabled` with safe anonymous SHA-256 disk caching and Markdown/scientific-unit speech preprocessing.
- `GET /api/v1/speech/tts/audio/{filename}` → Streams cached `audio/mpeg` or `audio/wav` (strict 32-char hex filename validation).
- `POST /api/v1/translate`
  - Request:
    ```json
    {
      "text": "Ohm's Law states V = I * R at 5 V.",
      "source_lang": "en",
      "target_lang": "kn",
      "preserve_scientific_terms": true
    }
    ```
  - Response: `{ source_lang, target_lang, original_text, translated_text, provider, cached, preserved_tokens[] }`
  - Protects scientific formulas, chemical equations, and SI units (`[[SCI_i]]`) and caches results in SQLite `translations_cache`.

### Subjects, Experiments & Deterministic Simulations (48 Labs)
- `GET /api/v1/subjects` → `SubjectSummary[]` (Physics, Chemistry, Biology, Mathematics with experiment counts across Basic / Intermediate / Advanced)
- `GET /api/v1/experiments?subject=&difficulty=&search=` → `ExperimentSummary[]` (`Beginner` accepted as an alias for `Basic`)
- `GET /api/v1/experiments/{experiment_id}` → `ExperimentDetail` (includes `discipline`, `topic`, `translations`, `real_world_applications`, `common_mistakes`, `related_experiments`, `safety_note`, `visual_type`, `parameters_schema`, `formulas`, `assumptions`, `objectives`, `apparatus`, `instructions`)
- `POST /api/v1/experiments/{experiment_id}/simulate`
  - Request:
    ```json
    {
      "student_id": "demo-student-1",
      "language": "kn",
      "parameters": { "voltage": 12.0, "resistance": 4.0 },
      "save_run": true,
      "notes": "Verified linear V-I relationship",
      "duration_seconds": 90
    }
    ```
  - Response: `SimulationResponse` with `language`, `run_id`, authoritative numeric `measurements`, structured `results` (`{ key: { value, unit, label } }`), localized `formatted_measurements`, `series_data`, `special_case`, `assumptions`, localized `conclusion_summary`, and structured `explanation`:
    ```json
    {
      "language": "kn",
      "summary": "...",
      "observation": "...",
      "formula_explanation": "...",
      "interpretation": "...",
      "conclusion": "...",
      "real_world_application": "...",
      "provider": "reviewed_localized_engine | localized_multidisciplinary_engine | openrouter_localized | translation_unavailable",
      "translation_available": true,
      "error_notice": null,
      "english_original": { "summary": "...", "observation": "...", "formula_explanation": "...", "interpretation": "...", "conclusion": "...", "real_world_application": "..." }
    }
    ```
  - Validation errors return HTTP `422` localized into `request.language` (e.g., `resistance <= 0`, `final_volume < initial_volume`, `a == 0` for quadratic).

### Verified Educational Video Library
- `GET /api/v1/videos?subject=&experiment_id=&difficulty=&language=&search=&featured=` → `VideoOut[]`
- `GET /api/v1/videos/recommendations?experiment_id=&subject=&limit=6` → `VideoOut[]`
  - Every YouTube entry is oEmbed-verified and includes `embed_url`, `source_url`, `provider`, `duration_label`, `transcript_summary`, and `verified: true`. Official curriculum portal entries set `embed_url: null` and link directly to `source_url`.

### Context-Aware AI Tutor (3-Tier Router: OpenRouter → Lightweight Local LLM → Deterministic Tutor)
- `GET /api/v1/ai/providers` → Live honest availability of `openrouter`, `local` (`llama-cpp-python` / `llama-server`), `deterministic_fallback`, and `tts`.
- `POST /api/v1/ai/explain`
  - Request: `{ conversation_id, experiment_id, parameters, measurements | results | simulation_results, language, student_id, mode }` (`mode`: `"explain" | "hint" | "practice" | "simplify"`)
- `POST /api/v1/ai/chat`
  - Request: `{ conversation_id, experiment_id, question | message, parameters, measurements | simulation_results, history[], language, student_id, mode }`
- Response (`AiResponse`):
  ```json
  {
    "success": true,
    "conversation_id": "conv-ohms-law-1700000000",
    "conversation_turns": 2,
    "experiment_id": "ohms-law",
    "language": "ta",
    "provider": "openrouter | local | deterministic_fallback",
    "model": "nvidia/nemotron-3.5-lightning:free",
    "fallback_used": false,
    "error_notice": null,
    "reply": "...",
    "explanation": "...",
    "latency_ms": 18.4,
    "local_model_status": "not_installed | ready",
    "suggested_questions": ["..."]
  }
  ```

### Multidisciplinary Quizzes & Grading (48 Quizzes)
- `GET /api/v1/quizzes?experiment_id=&subject=&difficulty=` → `QuizSummary[]`
- `GET /api/v1/quizzes/{quiz_id}` → `QuizDetail` (supports `mcq`, `true_false`, `formula`, and `numerical` questions; correct answers excluded)
- `POST /api/v1/quizzes/{quiz_id}/submit`
  - Request: `{ student_id: "demo-student-1", answers: { "q-ohm-1": 1, "q-num-1": 4.5 } }`
  - Response: `QuizSubmitResponse` with `attempt_id`, `score`, `total_questions`, `percentage`, `passed`, and per-question `feedback[]` (including tolerance-checked `submitted_value` and `correct_numeric` for numerical questions).

### Student Profile, Subject-Wise Progress & History
- `GET /api/v1/students/{student_id}` → `StudentOut`
- `PATCH /api/v1/students/{student_id}` → Update `name`, `grade_level`, `preferred_language`, `theme`, `narration_enabled`, `learning_level`
- `GET /api/v1/students/{student_id}/progress?subject=&difficulty=` → Aggregated KPIs, `learning_streak_days`, `time_spent_minutes`, `current_learning_level`, `subject_progress[]` (4 disciplines), `recently_accessed[]`, `recommended_experiments[]`, and `per_experiment[]`
- `GET /api/v1/students/{student_id}/history` → `simulation_runs[]` (with `discipline` & `difficulty`), `quiz_attempts[]`, and `recent_activities[]`
