# LabXAI API Contracts & Module Boundaries

Base URL (local development): `http://127.0.0.1:8000`

## Preserved Root & Legacy Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root service metadata (`project`, `message`, `version`, `status`) |
| `GET` | `/health` | Service health with live `database` and `ai_engine` status |
| `GET` | `/api/v1` | API version and available modules summary |

## Versioned Endpoints (`/api/v1`)

### Health & Languages
- `GET /api/v1/health` → `{ status, service, version, database, ai_engine, ai_model }`
- `GET /api/v1/languages` → `{ default_language, languages[], architecture_note }`

### Experiments & Deterministic Simulations
- `GET /api/v1/experiments?subject=&difficulty=&search=` → `ExperimentSummary[]`
- `GET /api/v1/experiments/{experiment_id}` → `ExperimentDetail`
- `POST /api/v1/experiments/{experiment_id}/simulate`
  - Request:
    ```json
    {
      "student_id": "demo-student-1",
      "parameters": { "voltage": 12.0, "resistance": 20.0 },
      "save_run": true,
      "notes": "Verified linear V-I relationship"
    }
    ```
  - Response: `SimulationResponse` with `run_id`, authoritative `measurements`, `formatted_measurements`, `series_data`, `special_case`, `assumptions`, and `conclusion_summary`.
  - Validation errors return HTTP `422` (e.g., `resistance <= 0`).

### Context-Aware AI Tutor (Server-Side OpenRouter Only)
- `POST /api/v1/ai/explain`
  - Request: `{ experiment_id, parameters, measurements, language, student_id }`
- `POST /api/v1/ai/chat`
  - Request: `{ experiment_id, question, parameters, measurements, history[], language, student_id }`
- Response (`AiResponse`):
  ```json
  {
    "experiment_id": "ohms-law",
    "language": "en",
    "provider": "openrouter | deterministic_fallback",
    "model": "nvidia/nemotron-3.5-lightning:free",
    "fallback_used": false,
    "error_notice": null,
    "reply": "...",
    "suggested_questions": ["..."]
  }
  ```

### Quizzes & Grading
- `GET /api/v1/quizzes?experiment_id=` → `QuizSummary[]`
- `GET /api/v1/quizzes/{quiz_id}` → `QuizDetail` (5 bilingual questions, answers excluded)
- `POST /api/v1/quizzes/{quiz_id}/submit`
  - Request: `{ student_id: "demo-student-1", answers: { "q-ohm-1": 1, ... } }`
  - Response: `QuizSubmitResponse` with `attempt_id`, `score`, `total_questions`, `percentage`, `passed`, and per-question `feedback[]` containing bilingual explanations.

### Student Profile, Progress & History
- `GET /api/v1/students/{student_id}` → `StudentOut`
- `PATCH /api/v1/students/{student_id}` → Update `name`, `grade_level`, `preferred_language`, `theme`, `narration_enabled`
- `GET /api/v1/students/{student_id}/progress` → Real aggregated KPIs, `recently_accessed`, `recommended_experiments`, and `per_experiment` stats
- `GET /api/v1/students/{student_id}/history` → `simulation_runs[]`, `quiz_attempts[]`, and `recent_activities[]`
