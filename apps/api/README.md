# API App

Express + TypeScript backend for the KoopCare fullstack demo.

## Current Endpoints

```text
GET /health
GET /api/v1/demo/summary
GET /api/v1/demo/applications
GET /api/v1/applications
GET /api/v1/applications/:id/status
POST /api/v1/applications
POST /api/v1/applications/:id/score
POST /api/v1/applications/:id/decision
```

The current implementation persists demo application data to a local JSON file. This keeps the MVP easy to run on any laptop before the MySQL milestone.

Default local data path:

```text
apps/api/.data/applications.local.json
```

The `.data` directory is ignored by git because it is local runtime state.

## Scoring Behavior

The backend attempts to call the KoopCare MLOps API:

```text
POST ${ML_API_BASE_URL}/predict
```

By default, if the ML API is unavailable, the backend uses a transparent rule-based fallback. This fallback is not a real credit model. It exists only so reviewers can test the full user-to-admin workflow without starting the Python ML service.

For production-like demos, set:

```text
ML_SCORING_MODE=strict_ml
```

In strict mode, the backend requires the Python MLOps API for scoring. If the ML service is unavailable, scoring requests return a clear service-unavailable error instead of creating fallback scores.

## Local Development

From the repository root:

```powershell
npm run dev:api
```

Default URL:

```text
http://localhost:5002
```

Health check:

```text
http://localhost:5002/health
```

## Environment

The backend reads:

```text
API_PORT=5002
APP_ENV=development
ML_API_BASE_URL=http://127.0.0.1:8000
ML_API_TIMEOUT_MS=5000
ML_SCORING_MODE=optional_fallback
DATA_FILE_PATH=
SERVE_WEB_APP=false
WEB_DIST_PATH=
```

`DATA_FILE_PATH` is optional. Leave it empty to use the default local JSON file.

Set `SERVE_WEB_APP=true` after `npm run build` when the API should also serve the built React app from `apps/web/dist`. This is used by the root `npm start` public-demo script.
