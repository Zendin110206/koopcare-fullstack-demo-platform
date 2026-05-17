# API App

Express + TypeScript backend for the KoopCare fullstack demo.

## Current Endpoints

```text
GET /health
GET /ready
GET /api/v1/demo/summary
POST /api/v1/auth/login
GET /api/v1/auth/session
GET /api/v1/ml/status
GET /api/v1/demo/applications
GET /api/v1/applications
GET /api/v1/applications/:id/status
POST /api/v1/applications
POST /api/v1/applications/:id/score
POST /api/v1/applications/:id/decision
```

The current implementation persists demo application data to a JSON file. This keeps the MVP easy to run in development and public-demo environments before the MySQL milestone.

Write actions use a demo role gate:

- `POST /api/v1/applications` accepts member or admin demo tokens;
- `POST /api/v1/applications/:id/score` accepts admin demo tokens only;
- `POST /api/v1/applications/:id/decision` accepts admin demo tokens only.

Read actions also have public-demo boundaries:

- `GET /api/v1/applications` and `GET /api/v1/demo/applications` accept admin demo tokens only;
- `GET /api/v1/applications/:id/status` accepts either an admin demo token or the member access code generated when the application is created. The access code can be sent through the `x-koopcare-access-code` header or `accessCode` query parameter.

Application creation returns:

```text
id
memberAccessCode
auditTrail
```

Members need both values to check their own application status without exposing the full admin queue.
Admin responses also include `auditTrail` so reviewers can see when the application was submitted, scored, rescored, and decided.

This is portfolio-demo access control, not production account security.

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

Readiness check:

```text
http://localhost:5002/ready
```

`/ready` validates the critical runtime pieces needed before public traffic is sent to the service:

- JSON application storage is readable;
- React build output exists when `SERVE_WEB_APP=true`;
- ML scoring mode configuration is visible.

ML integration status:

```text
http://localhost:5002/api/v1/ml/status
```

`/api/v1/ml/status` probes the configured MLOps API `/health` and `/model-info` endpoints. It returns HTTP 200 even when the MLOps API is unreachable, because this endpoint is diagnostic: it explains whether trained scoring is ready or whether fallback may remain active.

## Environment

The backend reads:

```text
API_PORT=5002
PORT=
APP_ENV=development
ML_API_BASE_URL=http://127.0.0.1:8000
ML_API_TIMEOUT_MS=5000
ML_STATUS_TIMEOUT_MS=1500
ML_SCORING_MODE=optional_fallback
DATA_FILE_PATH=
SERVE_WEB_APP=false
WEB_DIST_PATH=
DEMO_AUTH_SECRET=change_this_for_shared_demo_environments
DEMO_MEMBER_PASSWORD=member-demo-2026
DEMO_ADMIN_PASSWORD=admin-demo-2026
DEMO_AUTH_TOKEN_TTL_SECONDS=28800
```

`DATA_FILE_PATH` is optional. Leave it empty to use the default local JSON file.

Set `SERVE_WEB_APP=true` after `npm run build` when the API should also serve the built React app from `apps/web/dist`. This is used by the root `npm start` public-demo script.

The API reads `PORT` first, then falls back to `API_PORT`. This matters on public platforms that inject the externally routed port automatically.
