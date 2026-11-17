# LabXAI Architecture

## Application boundaries

- `frontend/` is the React + Vite browser application.
- `mobile/` is the React Native + Expo application using Expo Router.
- `shared/` contains platform-neutral JavaScript only. It must not import React DOM or React Native.
- `backend/` is reserved for the future FastAPI service and currently has no implementation.
- `tests/` contains Node-based tests for shared scientific logic.

## Current structure

```text
frontend/src/
├── app/                 # Web application composition and navigation
├── assets/              # Web assets
└── styles/              # Global and application CSS

mobile/
├── app/                 # Expo Router routes and route groups
│   └── (tabs)/          # Dashboard, experiments, and profile tabs
├── components/          # Reusable native UI
├── features/            # Native feature-specific UI
├── services/            # Future backend boundary
└── constants/           # Native theme values

shared/
├── data/                # Experiment definitions
└── simulations/
    └── circuits/        # Pure circuit calculations and validation
```

The existing web UI is still composed in `frontend/src/app/App.jsx`. Future extractions should move one feature at a time into `features/`, `components/`, and `services/`, preserving the current behavior after each move.

## Shared circuit model

Both applications import `shared/simulations/circuits/circuitLogic.js`. The module contains no UI code and implements:

- `calculateCurrent(voltage, resistance, isClosed, isComplete)`
- `getCircuitObservation(current, isClosed, isComplete)`
- `validateCircuit({ isClosed, isComplete })`

Scientific formulas must remain in this shared module. Do not duplicate them in platform-specific screens.

## Adding a feature

1. Add platform-neutral data or calculations to `shared/` when both apps need them.
2. Add web-only UI to `frontend/src/features/` or `frontend/src/components/`.
3. Add native-only UI to `mobile/features/` or `mobile/components/`.
4. Keep route files in `mobile/app/` thin and focused on navigation.
5. Add or update tests before changing shared calculations.
