# Deployment Guide

This guide explains the current public-demo deployment shape.

The project can now run as one Node service:

```text
public URL
  -> Express API
  -> built React web app
  -> JSON storage for the current MVP
  -> optional/strict MLOps API scoring
```

This is not final production architecture yet, but it is the right shape for a portfolio demo because one public link can show the web app and serve the API from the same domain.

## Local Public Preview

Build both apps:

```powershell
npm run build
```

Start the single-service preview:

```powershell
npm start
```

Open:

```text
http://localhost:5002
```

In this mode:

- the Express API still serves `/health` and `/api/v1/...`;
- the React app is served from `apps/web/dist`;
- the browser can call the API through the same origin;
- `SERVE_WEB_APP=true` is set by `scripts/start-public-demo.mjs`.

Shortcut:

```powershell
npm run preview:public
```

## Environment Variables

Important variables:

```text
API_PORT=5002
APP_ENV=production
SERVE_WEB_APP=true
WEB_DIST_PATH=
ML_API_BASE_URL=http://127.0.0.1:8000
ML_API_TIMEOUT_MS=5000
ML_SCORING_MODE=optional_fallback
DATA_FILE_PATH=
```

For real public demo review, prefer:

```text
ML_SCORING_MODE=strict_ml
```

That makes the backend refuse scoring when the Python MLOps API is unavailable instead of creating a fallback score.

If deploying the web app and API as one service, do not set `VITE_API_BASE_URL` to `localhost` during the production web build. Leave it empty or unset so the frontend uses the same public origin as the API.

## Docker

Build the image:

```powershell
docker build -t koopcare-fullstack-demo .
```

Run the container:

```powershell
docker run --rm -p 5002:5002 --env ML_SCORING_MODE=optional_fallback koopcare-fullstack-demo
```

Open:

```text
http://localhost:5002
```

For production-like scoring:

```powershell
docker run --rm -p 5002:5002 --env ML_SCORING_MODE=strict_ml --env ML_API_BASE_URL=http://host.docker.internal:8000 koopcare-fullstack-demo
```

Use the strict command only when the Python MLOps API is reachable from the container.

## Platform Deployment Shape

Typical public hosting settings:

```text
Build command: npm ci && npm run build
Start command: npm start
Port: use API_PORT if the platform requires it, otherwise default 5002
```

The platform should expose the Node service over HTTPS. The same public domain should serve:

```text
/
/health
/ready
/api/v1/demo/summary
/api/v1/applications
```

Use `/health` for a lightweight liveness check. Use `/ready` when the platform supports readiness probes. The readiness endpoint verifies JSON storage and, in single-service mode, confirms that the built React app is available.

## Deployment Smoke Check

Run:

```powershell
npm run smoke:public
```

This command builds the project, starts the public preview on an isolated local port, validates the web app shell, `/ready`, `/health`, SPA fallback, summary API, and JSON 404 behavior, then shuts the server down.

## Current Limitations

- JSON storage is still local runtime state.
- Authentication is not implemented yet.
- User/admin separation is still a demo UI boundary, not a secure authorization boundary.
- Public strict ML mode requires the separate Python MLOps API to be deployed or reachable.
- Durable production deployment still needs a database milestone.
