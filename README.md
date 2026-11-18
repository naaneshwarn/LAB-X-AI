# LabXAI — AI-Powered Multidisciplinary Interactive Virtual Laboratory

LabXAI is an integrated full-stack educational platform that enables students to explore **4 academic disciplines** (**Physics, Chemistry, Biology, and Mathematics**), perform **48 scientifically deterministic virtual experiments** across **Basic, Intermediate, and Advanced** levels, watch **verified educational videos**, interact with a **context-aware AI tutor**, take **conceptual and numerical quizzes**, and learn with **multilingual text & voice translation** across **English, Kannada, Hindi, Telugu, and Tamil**.

---

## Core Features

### 1. Four Academic Disciplines & 48 Deterministic Virtual Labs
Every discipline includes **12 validated virtual experiments** (4 Basic, 4 Intermediate, 4 Advanced), separated into deterministic backend and client calculation modules with live Recharts graphs, interactive visualizers, safety/model disclaimers, observation tables, and SQLite persistence:

- **Physics (Blue — 12 Labs)**
  - *Basic:* Ohm's Law (`ohms-law`), Simple Pendulum (`simple-pendulum`), Reflection of Light (`reflection-of-light`), Refraction of Light (`refraction-of-light`)
  - *Intermediate:* Projectile Motion (`projectile-motion`), Convex Lens Optics (`convex-lens`), Series & Parallel Circuits (`series-parallel-circuits`), Newton's Laws of Motion (`newtons-laws`)
  - *Advanced:* Electromagnetic Induction (`electromagnetic-induction`), Wave Interference & Diffraction (`wave-interference`), Thermodynamic Processes (`thermodynamic-processes`), Photoelectric Effect (`photoelectric-effect`)
- **Chemistry (Purple — 12 Labs)**
  - *Basic:* Atomic Structure (`atomic-structure`), Periodic Table Explorer (`periodic-table-explorer`), Acids & Bases – pH Scale (`acids-bases-ph`), States of Matter (`states-of-matter`)
  - *Intermediate:* Chemical Reaction Balancing (`reaction-balancing`), Mole Concept & Stoichiometry (`mole-stoichiometry`), Chemical Bonding (`chemical-bonding`), Concentration & Dilution (`concentration-dilution`)
  - *Advanced:* Chemical Equilibrium (`chemical-equilibrium`), Electrochemical Cells (`electrochemical-cells`), Reaction Kinetics (`reaction-kinetics`), Gas Laws & Thermodynamics (`gas-laws-thermodynamics`)
  - *Safety:* All Chemistry labs are strictly virtual models and never provide dangerous home-experiment instructions.
- **Biology (Green — 12 Labs)**
  - *Basic:* Plant Cell Structure (`plant-cell-structure`), Animal Cell Structure (`animal-cell-structure`), Human Digestive System (`human-digestive-system`), Photosynthesis (`photosynthesis`)
  - *Intermediate:* Mitosis & Meiosis (`mitosis-meiosis`), DNA Structure & Replication (`dna-structure-replication`), Human Circulatory System (`human-circulatory-system`), Food Chain & Ecosystem (`food-chain-ecosystem`)
  - *Advanced:* Mendelian Genetics (`mendelian-genetics`), Natural Selection & Evolution (`natural-selection-evolution`), Cellular Respiration (`cellular-respiration`), Population Genetics (`population-genetics`)
- **Mathematics (Orange — 12 Labs)**
  - *Basic:* Number Systems (`number-systems`), Fractions & Decimals (`fractions-decimals`), Basic Geometry (`basic-geometry`), Algebraic Expressions (`algebraic-expressions`)
  - *Intermediate:* Trigonometric Functions (`trigonometric-functions`), Coordinate Geometry (`coordinate-geometry`), Probability & Statistics (`probability-statistics`), Quadratic Equations (`quadratic-equations`)
  - *Advanced:* Differential Calculus (`differential-calculus`), Integral Calculus (`integral-calculus`), Matrices & Linear Algebra (`matrices-linear-algebra`), Three-Dimensional Geometry (`three-dimensional-geometry`)

### 2. Multilingual Text Translation, Dynamic Result Explanations & Voice Interaction (5 Languages)
- **Active Languages:** English (`en`), Kannada (`kn`), Hindi (`hi`), Telugu (`te`), and Tamil (`ta`).
- **Localized Experiment Result Explanations (`POST /api/v1/experiments/{id}/simulate`):** Deterministic calculations always produce exact numerical results and SI units, then `result_explanation_service.py` generates localized Result Summary, Scientific Observations, Formula Explanation, Scientific Interpretation, Conclusion, Real-World Applications, and validation errors in the student's selected language without resetting simulation parameters. If translation fails, an explicit notice and separate English original toggle are displayed.
- **Formula-Safe Translation (`POST /api/v1/translate`):** Preserves chemical formulas, mathematical equations, and SI units via placeholder tokenization, caches translations in SQLite (`translations_cache`) keyed by `(content_version, source_lang, target_lang, source_hash)`, and uses OpenRouter when configured or a transparent fallback offline.
- **Voice Input, Output & Voice Translation:**
  - Speech-to-Text (`Web SpeechRecognition`) in `en-IN`, `kn-IN`, `hi-IN`, `te-IN`, and `ta-IN` with visible Original Speech vs. Translated Text comparison in the AI Tutor.
  - Text-to-Speech (`Web SpeechSynthesis`) with Play, Pause, Resume, Stop, Replay, live progress indicator, and `0.75x–1.5x` playback speed selector.
  - *Browser Note:* Voice Input works best in Chrome/Edge over `localhost` or HTTPS and depends on OS-installed speech voices. Full text input and translation work in all browsers.

### 3. Verified Educational Video Library
- **38 curated, link-verified educational resources** (34 oEmbed-verified embeddable YouTube videos from CrashCourse, 3Blue1Brown, Khan Academy, Khan Academy India, The Organic Chemistry Tutor, Cognito Academy, Najam Academy, and Teacher's Pet, plus 4 official Khan Academy portal links).
- Lightweight lazy-loaded thumbnails (YouTube iframes load only on click) with topic/subject/difficulty filters, transcript summaries, and direct mapping to LabXAI experiments.

### 4. Context-Aware AI Tutor (Server-Side OpenRouter + Deterministic Fallback)
- Supports 4 tutoring modes (`explain`, `hint`, `practice`, `simplify`) grounded strictly in the student's active experiment, parameters, and deterministic calculations.
- Never exposes API keys in the frontend; automatically falls back to a clearly labeled deterministic tutor if `OPENROUTER_API_KEY` is missing or rate-limited.

### 5. Multidisciplinary Quizzes, Subject-Wise Dashboard & Progress Reports
- **48 seeded quizzes** supporting Multiple Choice (`mcq`), True/False (`true_false`), Formula (`formula`), and tolerance-checked Numerical (`numerical`) questions.
- **SQLite Persistence (`backend/labxai.db`):** Safe non-destructive schema migrations (`subjects`, `videos`, `translations_cache`, `learning_sessions`) tracking real subject-wise completion, learning streak, time spent, derived learning level, saved observations, and printable progress reports.

---

## Team Module Ownership

| Developer | Ownership | Primary Directories |
|---|---|---|
| **Naaneshwar** | Team Lead, FastAPI Backend, OpenRouter AI, SQLite DB & Migrations, GitHub Integration | `backend/app/main.py`, `backend/app/core/`, `backend/app/database/`, `backend/app/services/`, `backend/app/api/routes/` |
| **Rajath** | React Frontend, Subject Dashboard, 48 Interactive Simulations, Visualizers, Recharts | `frontend/src/pages/`, `frontend/src/simulations/`, `frontend/src/api/`, `frontend/src/components/` |
| **Janith** | Multilingual (EN/KN/HI/TE/TA), Voice Input/Output, Quizzes & Educational Content | `frontend/src/i18n/`, `frontend/src/services/`, `multilingual/`, `speech/`, `backend/app/database/quizzes_data.py`, `backend/app/services/language_service.py` |

See [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) and [`docs/architecture/README.md`](docs/architecture/README.md) for complete API schemas and architecture boundaries.

---

## Prerequisites (Windows — No Docker or Local LLM Required)

- **Python 3.11+** (tested on Python 3.14 via `backend/.venv`)
- **Node.js 18+** and **npm**
- Optional: An **OpenRouter API key** (all 48 simulations, 48 quizzes, video library, dashboard, translation fallback, and deterministic offline tutor work without an API key).

---

## Installation & Environment Configuration

### 1. Configure Backend Environment

```cmd
copy backend\.env.example backend\.env
```

Edit `backend/.env` (never commit `.env` to Git):

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

### 2. Install Backend Dependencies

```cmd
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 3. Install Frontend Dependencies

```cmd
npm.cmd --prefix frontend install
```

*(Using `npm.cmd` avoids Windows PowerShell execution policy restrictions on `npm.ps1`.)*

---

## Running Locally on Windows

### Option A: One-Click Scripts
- Backend (`http://127.0.0.1:8000`): `scripts\start-backend.bat`
- Frontend (`http://127.0.0.1:5173`): `scripts\start-frontend.bat`

### Option B: Manual Commands

**Terminal 1 — FastAPI Backend:**
```cmd
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
SQLite (`backend/labxai.db`) automatically applies non-destructive migrations and idempotent seeding on startup.

**Terminal 2 — React Frontend:**
```cmd
cd frontend
npm.cmd run dev
```

Open `http://127.0.0.1:5173` in your browser. Interactive Swagger API docs are available at `http://127.0.0.1:8000/docs`.

---

## Automated Testing

### Backend Unit, Scientific Formula, Multilingual, Local AI & Regional TTS Tests (102 tests)
```cmd
backend\.venv\Scripts\pytest.exe backend\tests -v
```

### Frontend Simulation & Localization Tests (13 tests) & Production Build
```cmd
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
```

---

## Troubleshooting

- **`npm.ps1 cannot be loaded because running scripts is disabled`**: Use `npm.cmd` instead of `npm` in PowerShell.
- **AI Tutor shows "Deterministic Offline Tutor Mode"**: Set a valid `OPENROUTER_API_KEY` in `backend/.env` and restart Uvicorn.
- **Voice Input / Regional Voices**: Use Chrome or Edge for Web SpeechRecognition; install Windows language speech packs for regional TTS voices (Kannada, Hindi, Telugu, Tamil).
- **SQLite database**: Stored locally at `backend/labxai.db` (excluded from Git). Migrations preserve existing student runs and quiz attempts automatically.
