# Public Deployment Readiness

Last updated: 2026-05-16

This document answers the practical question:

```text
How close is KoopCare Fullstack Demo Platform to a public link that reviewers can open?
```

## Short Answer

Current status after the Railway public URL was created and verified:

```text
Public demo readiness: 92%
Actual public URL availability: 100%
Full product readiness: 66%
```

Live public demo:

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

Meaning:

- The public web app opens successfully.
- `/health` returns healthy JSON.
- `/ready` returns ready JSON.
- `/api/v1/demo/summary` works.
- `/api/v1/applications` works.
- SPA route fallback works.
- The public URL verifier passes.
- The public write-test verifier passes: create application, read status, save officer decision, and read decided status.
- The full product is still not production-ready because authentication, real database persistence, and deployed strict MLOps integration are still unfinished.
- The current live ML behavior is honest fallback scoring because the separate Python MLOps API is not deployed/reachable from Railway yet.

## Why 92% for Public Demo Readiness?

This percentage is for a portfolio public demo, not a real financial production system.

| Area | Weight | Current | Notes |
| --- | ---: | ---: | --- |
| Local user-to-admin workflow | 15% | 14% | User apply, backend store, AI/fallback score, admin decision, and status tracker exist. |
| Single-service public runtime | 15% | 15% | Express serves React build and API from one Railway public origin. |
| Deployment config | 15% | 15% | `railway.toml`, `render.yaml`, Dockerfile, `/ready`, GitHub push path, and CI validation exist. |
| Automated verification | 15% | 15% | `check`, API smoke, public smoke, deploy-config check, preflight, Docker preflight, and public URL verifier exist. |
| Runtime persistence bridge | 10% | 8% | Railway `/data` volume path and Render `/var/data` disk path are documented, but JSON storage is still not a real database. |
| MLOps integration for public demo | 10% | 6% | Backend supports optional fallback and strict mode. Python MLOps API is not deployed together yet. |
| Public URL verification | 10% | 10% | Railway public URL exists. Read-only verification and write-test verification both pass. |
| Security boundary | 10% | 9% | Advisory AI messaging, validation, and decision note rules exist. Authentication/authorization still missing. |

Total:

```text
92 / 100
```

## What Is Already Ready

### Product Flow

Ready:

- user can open the web app through a public Railway URL;
- user can submit financing application;
- backend validates and stores application;
- backend asks MLOps API when available;
- backend uses clearly labeled fallback when the public MLOps API is unavailable;
- admin can inspect application;
- admin can approve or reject with reviewer name and decision note;
- user can track status;
- AI recommendation remains advisory, not final decision.

### Runtime Shape

Ready:

- `npm start` runs the public-demo service;
- `/` serves React;
- `/api/v1/...` serves JSON API;
- `/status` works as SPA fallback;
- `/health` exists;
- `/ready` exists;
- frontend uses same-origin API in production build;
- API prefers platform `PORT` before local `API_PORT`.

### Deployment Config

Ready:

- `railway.toml`;
- Railway Docker service shape;
- Railway `/ready` healthcheck;
- Railway volume mount target `/data`;
- `DATA_FILE_PATH=/data/koopcare/applications.json`;
- `render.yaml` retained as fallback/history;
- Render persistent disk path `/var/data`;
- Dockerfile;
- Docker healthcheck;
- platform `PORT` compatibility.

### Verification

Ready:

```powershell
npm run check
npm run smoke:api
npm run smoke:public
npm run check:deploy-config
npm run preflight:deploy
npm run preflight:deploy:docker
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

The normal public verifier checks:

- root web app;
- SPA status route;
- `/health`;
- `/ready`;
- web build readiness;
- JSON storage readiness;
- summary API;
- applications API;
- JSON 404 behavior.

The write-test verifier has passed for:

- create application;
- read status;
- save officer approval decision;
- read decided status again.

## What Is Still Missing After Public URL

The public URL exists now.

The remaining public-demo polish tasks are:

1. Deploy or expose the Python KoopCare MLOps API on a public URL.
2. Set Railway variable:

```text
ML_API_BASE_URL=https://your-ml-api-public-url
```

3. Keep `ML_SCORING_MODE=optional_fallback` during early testing.
4. Rescore one public application and confirm source becomes:

```text
ml_api
```

5. Only after that, consider:

```text
ML_SCORING_MODE=strict_ml
```

6. Re-run:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

## What Is Still Missing Before Full Product

These are not blockers for a portfolio demo, but they are blockers for a serious production-style product:

- real authentication;
- role-based access control;
- user can only see their own applications;
- admin login;
- MySQL or PostgreSQL persistence;
- migration scripts;
- audit trail/history table;
- deployed MLOps API with strict mode;
- model monitoring and model governance;
- rate limiting;
- request logging;
- better secret management;
- legal/compliance review for real credit use.

## Why Fallback Scoring Appears on the Public URL

The public Railway app is running correctly.

The fallback warning appears because this service is currently configured like this:

```text
ML_SCORING_MODE=optional_fallback
ML_API_BASE_URL=http://127.0.0.1:8000
```

Inside Railway, `127.0.0.1:8000` means "inside the Railway container", not your laptop.

Because the Python MLOps API is not running inside that same public container, the backend cannot get a trained model score. The backend then uses labeled fallback scoring so the product workflow remains testable.

This is acceptable for the portfolio demo as long as the UI says it clearly. It is not acceptable to present fallback scores as trained-model scores.

## Why Railway Instead of Vercel Right Now?

Railway fits the current app shape:

```text
Docker service + Express server + React build + writable /data folder
```

Vercel would be a bigger architecture checkpoint:

```text
serverless functions + external database + adjusted API structure
```

So Vercel is not rejected forever. It is just not the fastest safe deployment path for the current codebase.

## Recommended Next Checkpoints

### Checkpoint 18 - Public MLOps API Deployment

Goal:

```text
fallback scoring is no longer the only public scoring path
```

Output:

- KoopCare MLOps API has a public URL;
- `/health` on the ML API public URL works;
- `/model-info` on the ML API public URL works if supported;
- Railway `ML_API_BASE_URL` points to the deployed ML API;
- new/rescored applications show `source=ml_api`;
- fallback remains available only as a clearly labeled resilience path.

### Checkpoint 19 - Public Demo Polish

Goal:

```text
make the public demo safe and impressive for reviewers
```

Output:

- public demo banner explaining portfolio/demo status;
- sample reviewer path;
- seed data/reset policy;
- better empty/loading/error states;
- public demo limitations shown clearly.

### Checkpoint 20 - Auth and Role Separation

Goal:

```text
member and admin are no longer only UI tabs
```

Output:

- demo login;
- member session;
- admin session;
- route protection;
- user status lookup scoped by owner.

### Checkpoint 21 - Database Milestone

Goal:

```text
replace JSON bridge with real database persistence
```

Output:

- database service;
- schema;
- migrations;
- application repository layer;
- seed script;
- backup/restore notes.

## Current Verdict

The project is now:

```text
verified public Railway demo
```

The next meaningful jump is connecting a deployed public MLOps API so public applications can use the trained model path instead of only the labeled fallback scorer.
