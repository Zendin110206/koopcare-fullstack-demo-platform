# Deployment Guide

This guide explains the current public-demo deployment shape.

The project can run as one Node service:

```text
public URL
  -> Express API
  -> built React web app
  -> JSON storage for the current MVP
  -> optional/strict MLOps API scoring
```

This is not final production architecture yet, but it is the right shape for a portfolio demo because one public link can show the web app and serve the API from the same domain.

## Recommended Public Platform

Current recommended target:

```text
Railway
```

Reason:

- the repository already has a Dockerfile;
- Railway supports config-as-code through `railway.toml`;
- Railway can route one web service to a public domain;
- Railway supports a `/ready` healthcheck path;
- Railway supports writable volumes for the JSON MVP bridge.

Render remains documented as a fallback/history path through `render.yaml`, but it is no longer the primary path because the current project owner reported Render is blocked/unusable.

Vercel is not the primary target for this exact checkpoint. Vercel is strong for frontend and serverless functions, but this app currently expects one long-running Express service plus writable runtime JSON storage. Deploying cleanly to Vercel would require a larger refactor to serverless API routes and an external database such as Neon, Supabase, or Vercel-managed storage.

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
PORT=
API_PORT=5002
APP_ENV=production
SERVE_WEB_APP=true
WEB_DIST_PATH=
ML_API_BASE_URL=http://127.0.0.1:8000
ML_API_TIMEOUT_MS=5000
ML_SCORING_MODE=optional_fallback
DATA_FILE_PATH=
```

Port behavior:

```text
PORT first
API_PORT second
5002 fallback
```

This matters because many public platforms inject `PORT` automatically.

For real public demo review, prefer:

```text
ML_SCORING_MODE=optional_fallback
```

Use `optional_fallback` until the separate Python MLOps API is also deployed and reachable from the public service. After that, consider:

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
Build command: Dockerfile build
Start command: npm start
Port: platform-provided PORT
Healthcheck: /ready
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

## Railway Deployment

This repository includes:

```text
railway.toml
```

The Railway config defines:

```text
Builder: Dockerfile
Dockerfile path: Dockerfile
Start command: npm start
Healthcheck path: /ready
Healthcheck timeout: 300 seconds
Restart policy: ON_FAILURE
```

Recommended Railway variables:

```text
APP_ENV=production
SERVE_WEB_APP=true
ML_SCORING_MODE=optional_fallback
ML_API_TIMEOUT_MS=1500
DATA_FILE_PATH=/data/koopcare/applications.json
```

Do not manually set `PORT` unless Railway logs specifically require it. Railway injects `PORT`, and the API now listens to `PORT` first.

### Persistent Runtime Data

For Railway, create a volume and mount it at:

```text
/data
```

The JSON MVP data file should be:

```text
/data/koopcare/applications.json
```

This is still not the final database milestone, but it prevents demo submissions from being lost on ordinary runtime replacement.

Because mounted volumes are a single-service persistence bridge, treat this as a portfolio-demo bridge before the real database milestone.

### Railway Setup Steps

1. Push the latest committed code to GitHub.
2. Open Railway.
3. Create a new project from the GitHub repository.
4. Confirm Railway is using `Dockerfile` and `railway.toml`.
5. Add the environment variables above.
6. Create a volume mounted at `/data`.
7. Deploy the service.
8. Generate/open the public Railway domain.
9. Check:

```text
/
/ready
/api/v1/demo/summary
```

10. Run:

```powershell
npm run verify:public -- https://your-railway-url
```

For the click-by-click beginner version, see:

```text
docs/railway_beginner_walkthrough.md
```

## Render Blueprint Fallback

This repository still includes:

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

The Blueprint attaches a persistent disk:

```text
mountPath: /var/data
sizeGB: 1
```

Use this only if Render becomes usable again.

## Vercel Future Path

Vercel can still be useful later, but not as the fastest safe route for this checkpoint.

To make Vercel a clean target, the project should first move away from local JSON runtime storage and one long-running Express process.

Required Vercel-oriented milestones would be:

- split API into Vercel-compatible serverless functions or a Next.js app route layer;
- move application storage to a real external database;
- update status/admin reads to query that database;
- adjust public verification for serverless cold starts;
- deploy the ML API separately or use a public ML endpoint.

This is a valid future architecture, but it is larger than the current "get one public demo link" milestone.

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

This checks that `railway.toml`, `render.yaml`, `Dockerfile`, `package.json`, and deployment docs remain aligned.

Run the complete preflight before a deploy attempt:

```powershell
npm run preflight:deploy
```

If you also want to verify the Docker image build:

```powershell
npm run preflight:deploy:docker
```

After Railway provides a public URL, verify it with:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

Use the optional write test only when you are fine with adding a demo application to the public runtime:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

For the current readiness score and remaining blockers, see:

```text
docs/public_deployment_readiness.md
```

## Current Limitations

- JSON storage is still local/runtime state.
- Authentication is not implemented yet.
- User/admin separation is still a demo UI boundary, not a secure authorization boundary.
- Public strict ML mode requires the separate Python MLOps API to be deployed or reachable.
- Durable production deployment still needs a database milestone.
