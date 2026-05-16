# Public Deployment Readiness

Last updated: 2026-05-16

This document answers the practical question:

```text
How close is KoopCare Fullstack Demo Platform to a public link that reviewers can open?
```

## Short Answer

Current status after switching the main deployment path away from Render:

```text
Public demo readiness: 88%
Actual public URL availability: 0%
Full product readiness: 65%
```

Meaning:

- The codebase is ready enough to attempt a public portfolio deployment.
- Latest commits can be pushed to GitHub and checked by CI.
- Render is no longer treated as the main path because it is blocked for the project owner.
- Railway is now the recommended main public deployment path.
- The repository does not yet have a live public URL because the Railway project still has to be created in the owner's Railway account.
- The full product is not production-ready because authentication, real database persistence, and deployed strict MLOps integration are still unfinished.

## Why 88% for Public Demo Readiness?

This percentage is for a portfolio public demo, not a real financial production system.

| Area | Weight | Current | Notes |
| --- | ---: | ---: | --- |
| Local user-to-admin workflow | 15% | 14% | User apply, backend store, AI/fallback score, admin decision, and status tracker exist. |
| Single-service public runtime | 15% | 15% | Express can serve React build and API from one origin. |
| Deployment config | 15% | 15% | `railway.toml`, `render.yaml`, Dockerfile, `/ready`, GitHub push path, and CI validation exist. |
| Automated verification | 15% | 15% | `check`, API smoke, public smoke, deploy-config check, preflight, Docker preflight, and public URL verifier exist. |
| Runtime persistence bridge | 10% | 8% | Railway `/data` volume path and Render `/var/data` disk path are documented, but JSON storage is still not a real database. |
| MLOps integration for public demo | 10% | 6% | Backend supports optional fallback and strict mode. Python MLOps API is not deployed together yet. |
| Public URL verification | 10% | 6% | `verify:public` exists and can verify any deployed URL, but no deployed URL has been verified yet. |
| Security boundary | 10% | 9% | Advisory AI messaging, validation, and decision note rules exist. Authentication/authorization still missing. |

Total:

```text
88 / 100
```

## What Is Already Ready

### Product Flow

Ready:

- user can open the web app locally or through single-service preview;
- user can submit financing application;
- backend validates and stores application;
- backend asks MLOps API when available;
- backend uses clearly labeled fallback when local MLOps API is unavailable;
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
- frontend can use same-origin API in production build;
- API now prefers platform `PORT` before local `API_PORT`.

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
npm run verify:public -- https://your-public-url
```

## What Is Still Missing Before Public URL

These are the remaining steps before reviewers can open a real public URL:

1. Create a Railway project from the GitHub repository.
2. Confirm Railway uses `Dockerfile` and `railway.toml`.
3. Add Railway variables:

```text
APP_ENV=production
SERVE_WEB_APP=true
ML_SCORING_MODE=optional_fallback
ML_API_TIMEOUT_MS=1500
DATA_FILE_PATH=/data/koopcare/applications.json
```

4. Create a Railway volume mounted at:

```text
/data
```

5. Wait for Railway build and `/ready` healthcheck to pass.
6. Open the generated Railway URL.
7. Run:

```powershell
npm run verify:public -- https://your-railway-url
```

8. Save the public URL in README and portfolio notes.

Until those are done, public URL availability remains:

```text
0%
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

### Checkpoint 17 - Deploy to Railway

Goal:

```text
public link exists and passes verify:public
```

Output:

- Railway project created;
- Railway service deployed from GitHub;
- Railway volume mounted at `/data`;
- public Railway URL documented;
- `/ready` passes on public URL;
- public verification report saved;
- README includes public demo URL.

### Checkpoint 18 - Public Demo Polish

Goal:

```text
make the public demo safe and impressive for reviewers
```

Output:

- public demo banner explaining portfolio/demo status;
- sample reviewer path;
- seed data reset policy;
- better empty/loading/error states;
- public demo limitations shown clearly.

### Checkpoint 19 - Auth and Role Separation

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

### Checkpoint 20 - Database Milestone

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

## Preflight Command

Before any deployment attempt, run:

```powershell
npm run preflight:deploy
```

This writes a local report to:

```text
local_context/runtime_logs/deploy-preflight-report.md
```

For Docker-inclusive preflight:

```powershell
npm run preflight:deploy:docker
```

## Public URL Verification

After deployment, run:

```powershell
npm run verify:public -- https://your-public-url
```

Optional write test:

```powershell
npm run verify:public -- https://your-public-url --write-test
```

The write test creates a real demo application on the public service, so use it only when you are okay with adding test data.

## Current Verdict

The project is no longer just a local MVP.

It is now:

```text
Railway-ready public demo candidate
```

The next meaningful jump is not another local-only feature. The next meaningful jump is creating the Railway service, mounting `/data`, opening the public Railway URL, and verifying that URL with `verify:public`.
