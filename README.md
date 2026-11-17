# LabXAI

**Ask. Explore. Experiment. Understand.**

LabXAI is an interactive science learning platform for Classes 6–10. The frontend helps students explore virtual experiments, change scientific variables, observe results, and ask questions in a safe learning environment.

## Current status

The repository currently contains the first frontend prototype. The backend, database, and real AI service are not connected yet.

### Implemented

- Responsive landing page with LabXAI branding and feature overview.
- Student dashboard with demo progress, metrics, weekly activity, and continue-learning card.
- Experiment library with search, subject filters, difficulty filters, and responsive experiment cards.
- Basic Electric Circuit virtual laboratory.
- SVG circuit diagram with battery, bulb, switch, resistor, and connecting wires.
- Switch ON/OFF interaction and circuit status feedback.
- Battery voltage and resistance sliders.
- Deterministic Ohm's Law calculation:
  - `I = V / R`
  - Current is `0 A` when the switch is open.
  - The bulb glows only when the circuit is active.
- Animated current-flow feedback when the circuit is active.
- Reset experiment control.
- Mock AI science assistant with suggested questions.
- English/Kannada language selector UI. Full Kannada translation is not implemented yet.
- Mobile, tablet, and desktop layouts.

### Demo-only behavior

- Dashboard values are sample data and are not persisted.
- The AI assistant uses local mock responses. It does not call an AI backend.
- Chemical Reactions, Human Body Systems, and Light and Reflection are marked as coming soon.
- Scientific calculations are performed in the browser and do not depend on the AI assistant.

## Technology stack

| Technology | Purpose |
|---|---|
| React | UI and application state |
| Vite | Development server and production bundling |
| JavaScript / JSX | Application and simulation logic |
| CSS | Responsive layout, styling, and animations |
| SVG | Circuit diagram and visual simulation |
| Lucide React | Interface icons |
| Oxlint | JavaScript linting |

## Run the frontend

### Prerequisites

- Node.js LTS
- npm
- Git

### Install and start

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173
```

### Other commands

Run the linter:

```powershell
cd frontend
npm run lint
```

Create a production build:

```powershell
cd frontend
npm run build
```

Preview the production build locally:

```powershell
cd frontend
npm run preview
```

## Project structure

```text
LAB-X-AI/
├── README.md
└── frontend/
    ├── package.json       # Scripts and dependencies
    ├── index.html         # Vite HTML entry point
    ├── public/            # Static public assets
    └── src/
        ├── App.jsx        # Pages, reusable UI, and app navigation
        ├── App.css        # Application styles and responsive layouts
        ├── index.css      # Global styles and font setup
        ├── main.jsx       # React entry point
        └── assets/        # Image and starter assets
```

## Where to make future changes

### Add a new page

1. Add a page component in `frontend/src/App.jsx` or extract it into `frontend/src/pages/`.
2. Add a page ID to the `page` state flow in `App`.
3. Add a navigation button or CTA that calls `goTo('your-page-id')`.
4. Add responsive styles in `frontend/src/App.css`.

The current app uses lightweight client-side page state rather than a router. A routing library can be introduced when URL-based navigation is needed.

### Add a new experiment

1. Add an item to the `experiments` array in `frontend/src/App.jsx`.
2. Provide an `id`, `subject`, `title`, `description`, `level`, `time`, `icon`, `color`, `available`, and `objectives`.
3. Set `available: false` until the experiment has a working simulation.
4. Create a dedicated simulation component when the experiment becomes functional.
5. Add its calculations as pure JavaScript functions separate from visual components.

### Extend the electric circuit simulation

The circuit calculation helpers are currently near the top of `frontend/src/App.jsx`:

- `calculateCurrent(voltage, resistance, isClosed, isComplete)`
- `getCircuitObservation(current, isClosed)`

When the simulation grows, move these functions and circuit state validation into:

```text
frontend/src/simulations/circuits/circuitLogic.js
```

Keep scientific calculations deterministic and testable. UI components should display results, not ask the AI service to calculate them.

### Connect the AI assistant

The current assistant is implemented in the `Assistant` component using local responses. Replace the response logic with a service module such as:

```text
frontend/src/services/api.js
```

The request should include experiment context such as voltage, resistance, switch state, current, and the selected language. Keep the local response as a visible fallback when the backend is unavailable, and clearly show connection state to students.

### Add translations

Move visible interface text into a translation object, for example:

```text
frontend/src/i18n/translations.js
```

Use the existing `language` state to select the active translation set. Scientific terms should be reviewed rather than translated automatically.

## Scientific model

The electric circuit is an idealized educational model:

```text
V = I × R
I = V / R
```

Where:

- `V` is voltage in volts.
- `I` is current in amperes.
- `R` is resistance in ohms.

The current implementation assumes a complete circuit, ideal wires, and a single resistance value. It does not model battery internal resistance, bulb non-linear resistance, heat, or component failure.

## Suggested next features

- Extract the current single-file app into `components/`, `pages/`, `simulations/`, and `services/`.
- Add automated tests for circuit calculations and input validation.
- Add real experiment state and progress persistence.
- Add backend API integration for the AI assistant.
- Add reviewed Kannada translations.
- Implement quizzes and learning milestones.
- Add more interactive physics, chemistry, and biology experiments.
- Add teacher and classroom monitoring features.

## Vision

Make science learning more accessible, engaging, and experiential by combining interactive simulations with clear AI-powered explanations.

**LabXAI – Learn Science by Exploring, Experimenting, and Understanding.**
