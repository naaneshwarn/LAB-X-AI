# LabXAI — AI-Powered Interactive Virtual Science Laboratory

LabXAI is an integrated full-stack educational platform that enables students to perform deterministic virtual physics experiments, inspect live graphs and instrumentation, interact with a context-aware AI science tutor, take assessments, and track learning progress in **English** and **Kannada (ಕನ್ನಡ)**.

---

## Core Features

- **Four Scientifically Deterministic Virtual Experiments**:
  1. **Ohm's Law (`ohms-law`)** — Interactive DC circuit schematic (battery, resistor, series ammeter, parallel voltmeter), live `V = I × R` and `P = V × I` calculations, V–I graph, zero-resistance safety guard.
  2. **Simple Pendulum (`simple-pendulum`)** — Animated pendulum with stopwatch, Earth/Moon/Mars gravity presets, `T = 2π√(L/g)`, frequency, total time for N oscillations, and explicit 4th-order large-angle deviation analysis.
  3. **Projectile Motion (`projectile-motion`)** — Animated 2D parabolic trajectory with live velocity component vectors (`vx`, `vy`), apex height, horizontal range, flight time, and trajectory plot (under documented negligible-air-resistance assumptions).
  4. **Convex Lens Optics (`convex-lens`)** — Thin-lens ray diagram using the New Cartesian Sign Convention (`1/f = 1/v − 1/u`), real/virtual & upright/inverted classification, magnification, optical power in Diopters, and clean singularity handling when `|u| = f` (image at infinity).
- **Context-Aware AI Science Tutor (OpenRouter + Graceful Fallback)**:
  - Server-side OpenRouter integration via HTTPX (`POST /api/v1/ai/explain`, `POST /api/v1/ai/chat`).
  - Uses deterministic simulation measurements as the sole source of scientific truth.
  - Automatically falls back to a clearly labeled deterministic explanation engine if `OPENROUTER_API_KEY` is missing or the upstream model is unavailable.
- **Multilingual & Audio Accessibility**:
  - Reviewed English (`en`) and Kannada (`kn`) UI dictionaries, bilingual experiment instructions, bilingual quizzes, and language-aware AI prompts.
  - Extensible language registry prepared for Hindi (`hi`), Telugu (`te`), and Tamil (`ta`) via future AI4Bharat IndicTrans2 & Indic-TTS integration.
  - Optional browser `SpeechSynthesis` narration controls (Play, Pause, Resume, Stop, voice selector).
- **Quizzes, Student Dashboard & Learning History**:
  - 4 seeded quizzes (5 questions each, 20 questions total) with instant grading and answer explanations.
  - SQLite persistence (`backend/labxai.db`) storing demo student profile, saved simulation runs, quiz attempts, and chronological learning activity.

---

## Team Module Ownership

| Developer | Ownership | Primary Directories |
|---|---|---|
| **Naaneshwar** | Team Lead, FastAPI Backend, OpenRouter AI, SQLite DB, GitHub Integration | `backend/app/main.py`, `backend/app/core/`, `backend/app/database/`, `backend/app/services/openrouter_service.py`, `backend/app/api/routes/` |
| **Rajath** | React Frontend, Dashboard, Library, Interactive Simulations, Recharts | `frontend/src/pages/`, `frontend/src/simulations/`, `frontend/src/api/`, `frontend/src/components/` |
| **Janith** | Multilingual (English & Kannada), Narration, Quizzes & Learning Content | `frontend/src/i18n/`, `frontend/src/services/narration.js`, `backend/app/database/seed_data.py`, `backend/app/services/language_service.py` |

See [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) for complete API request/response schemas and module boundaries.

---

## Prerequisites (Windows — No Docker or Ollama Required)

- **Python 3.11+** (existing virtual environment at `backend/.venv`)
- **Node.js 18+** and **npm**
- Optional: An **OpenRouter API key** (the full virtual lab, simulations, quizzes, dashboard, and offline deterministic tutor work even without one).

---

## Installation & Environment Configuration

### 1. Configure Backend Environment

Copy `backend/.env.example` to `backend/.env`:

```cmd
copy backend\.env.example backend\.env
```

Edit `backend/.env` with your configuration (never commit `.env` to Git):

```env
APP_NAME=LabXAI
ENVIRONMENT=development
DATABASE_URL=sqlite:///./labxai.db
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_TIMEOUT_SECONDS=30
```

> **Changing the AI model:** Update `OPENROUTER_MODEL` in `backend/.env` and restart the backend — no code changes required. LabXAI will never silently switch to a paid model.

### 2. Install Backend Dependencies (Using Existing `.venv`)

```cmd
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 3. Install Frontend Dependencies

```cmd
npm.cmd --prefix frontend install
```

*(Note: Using `npm.cmd` avoids Windows PowerShell script execution policy restrictions on `npm.ps1`.)*

---

## Running Locally on Windows

### Option A: One-Click Scripts

- **Start Backend (FastAPI on `http://127.0.0.1:8000`)**:
  ```cmd
  scripts\start-backend.bat
  ```
- **Start Frontend (Vite on `http://127.0.0.1:5173`)**:
  ```cmd
  scripts\start-frontend.bat
  ```

### Option B: Manual Commands

**Terminal 1 — FastAPI Backend:**
```cmd
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The SQLite database (`backend/labxai.db`) initializes and seeds automatically on first startup without overwriting existing data.

**Terminal 2 — React Frontend:**
```cmd
cd frontend
npm.cmd run dev
```

Open `http://127.0.0.1:5173` in your browser. Interactive Swagger API docs are available at `http://127.0.0.1:8000/docs`.

---

## Automated Testing

### Backend & Scientific Formula Tests (`pytest`)

```cmd
backend\.venv\Scripts\pytest.exe -c backend\pytest.ini backend\tests -v
```

Tests verify:
- Preserved endpoints (`GET /`, `GET /health`, `GET /api/v1`)
- All versioned `/api/v1/*` endpoints and SQLite persistence
- Deterministic physics formulas for all 4 experiments (including edge cases like `R = 0` and convex lens `|u| = f`)
- OpenRouter integration using mocked HTTP responses (401, 402, 404, 429, 503, timeouts, missing API key) without spending API quota

### Frontend Physics Tests & Production Build

```cmd
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
```

---

## Troubleshooting

- **`npm.ps1 cannot be loaded because running scripts is disabled`**: Use `npm.cmd` instead of `npm` in PowerShell, or run via `cmd.exe`.
- **AI Tutor shows "Deterministic Offline Tutor Mode"**: Set a valid `OPENROUTER_API_KEY` in `backend/.env` and restart Uvicorn. If the configured free model is temporarily unavailable or rate-limited, update `OPENROUTER_MODEL` in `backend/.env`.
- **Kannada voice unavailable in browser**: Install the Windows/Chrome Kannada language speech pack, or continue reading Kannada text explanations while using the default voice.
- **SQLite database**: Stored locally at `backend/labxai.db` (excluded from Git via `.gitignore`). Delete it only if you intentionally want a clean reset of demo student history.

---

## Git Workflow

- Active development branch: `feature/backend-ai`
- Never commit `.env`, API keys, `.venv/`, `node_modules/`, `dist/`, or `*.db`.
- Always run backend tests (`pytest`) and frontend build (`npm.cmd run build`) before pushing.
