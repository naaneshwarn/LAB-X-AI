# API Boundary

The API is not connected yet. The future backend will be implemented separately with FastAPI.

The mobile placeholder service is [mobile/services/api.js](../mobile/services/api.js). It reads `EXPO_PUBLIC_API_BASE_URL` and intentionally throws an explicit error when the URL is not configured.

Planned service operations:

- `GET /experiments` — retrieve experiment metadata.
- `POST /assistant` — send a question and experiment context.
- `POST /progress` — save experiment progress.

These paths are planning placeholders, not working backend endpoints. Do not describe them as available until the FastAPI service and contract tests exist.

## Payload guidance

Assistant requests should include:

- `experimentId`
- `question`
- `language`
- `voltage`
- `resistance`
- `isClosed`
- calculated `current`

Scientific values must be calculated locally by the shared logic before being sent to the assistant. The backend or AI model must not be the source of truth for Ohm's Law calculations.

