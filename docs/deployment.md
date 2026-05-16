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

The Docker image sets:

```text
SERVE_WEB_APP=true
DATA_FILE_PATH=/data/koopcare/applications.json
```

It also includes a container `HEALTHCHECK` that calls:

```text
/ready
```

For local container data that survives container replacement, mount a volume:

```powershell
docker run --rm -p 5002:5002 -v koopcare-demo-data:/data --env ML_SCORING_MODE=optional_fallback koopcare-fullstack-demo
```

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

## Render Blueprint

This repository includes:

```text
render.yaml
```

The Blueprint defines one Node web service:

```text
Build command: npm ci && npm run build
Start command: npm start
Health check path: /ready
Auto deploy trigger: checksPass
```

It also sets:

```text
SERVE_WEB_APP=true
DATA_FILE_PATH=/var/data/koopcare/applications.json
ML_SCORING_MODE=optional_fallback
```

The `checksPass` deploy trigger means Render waits for GitHub checks before auto-deploying from `main`.

### Persistent Runtime Data

The Blueprint attaches a persistent disk:

```text
mountPath: /var/data
sizeGB: 1
```

The JSON MVP data file is stored at:

```text
/var/data/koopcare/applications.json
```

This is still not the final database milestone, but it prevents the public demo data from being lost on every normal service restart.

Because persistent disks are attached to a single service instance, treat this as a portfolio-demo persistence bridge before the real database milestone.

### Render Setup Steps

1. Push the latest committed code to GitHub.
2. Open Render.
3. Create a new Blueprint from the GitHub repository.
4. Confirm `render.yaml`.
5. Deploy the service.
6. Open the generated `onrender.com` URL.
7. Check:

```text
/
/ready
/api/v1/demo/summary
```

If the separate Python MLOps API is deployed later, update `ML_API_BASE_URL` in Render and consider switching `ML_SCORING_MODE` to `strict_ml`.

## Deployment Smoke Check

Run:

```powershell
npm run smoke:public
```

This command builds the project, starts the public preview on an isolated local port, validates the web app shell, `/ready`, `/health`, SPA fallback, summary API, and JSON 404 behavior, then shuts the server down.

Validate deployment files:

```powershell
npm run check:deploy-config
```

This checks that `render.yaml`, `Dockerfile`, `package.json`, and deployment docs remain aligned.

Run the complete preflight before a deploy attempt:

```powershell
npm run preflight:deploy
```

If you also want to verify the Docker image build:

```powershell
npm run preflight:deploy:docker
```

After Render provides a public URL, verify it with:

```powershell
npm run verify:public -- https://your-public-url.onrender.com
```

Use the optional write test only when you are fine with adding a demo application to the public runtime:

```powershell
npm run verify:public -- https://your-public-url.onrender.com --write-test
```

For the current readiness score and remaining blockers, see:

```text
docs/public_deployment_readiness.md
```

For a click-by-click beginner walkthrough, see:

```text
docs/render_beginner_walkthrough.md
```

## Current Limitations

- JSON storage is still local runtime state.
- Authentication is not implemented yet.
- User/admin separation is still a demo UI boundary, not a secure authorization boundary.
- Public strict ML mode requires the separate Python MLOps API to be deployed or reachable.
- Durable production deployment still needs a database milestone.
