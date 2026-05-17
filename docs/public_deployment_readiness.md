# Public Deployment Readiness

Last updated: 2026-05-17

This document answers the practical question:

```text
How close is KoopCare Fullstack Demo Platform to a public link that reviewers can open?
```

## Short Answer

Current status after the Railway public URL, public ML scoring path, demo role gate, and access-code member status boundary were verified:

```text
Public demo readiness: 100%
Actual public URL availability: 100%
Full product readiness: 85%
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
- `/api/v1/ml/status` works and explains whether trained ML scoring is connected.
- `/api/v1/applications` works for the admin demo role only.
- member status lookup works with application ID plus access code.
- SPA route fallback works.
- The public URL verifier passes.
- The public write-test verifier passes: login, create application, receive access code, trained ML score, read status with access code, save officer decision, and read decided status with access code.
- The public UI now has an `ID/EN` language toggle for the main hero, navigation, Apply, Status, Admin, and System explanation.
- The System page now explains how KoopCare Fullstack Demo Platform product fields become KoopCare MLOps Credit Scoring API request fields and final model columns.
- Member submission and admin decision actions now use a demo role gate.
- The full application queue is no longer public; it requires the admin demo role.
- Member status is no longer broad public search; it requires the generated access code.
- The full product is still not production-ready because production-grade authentication, real database persistence, and production hardening are still unfinished.
- KoopCare MLOps Credit Scoring API is now live on a public Railway URL and has passed the ML API verifier.
- KoopCare Fullstack Demo Platform is now connected to the public KoopCare MLOps Credit Scoring API, and the write-test verifier confirms `source=ml_api`.

## Why 100% for Public Demo Readiness?

This percentage is for a portfolio public demo, not a real financial production system.

| Area | Weight | Current | Notes |
| --- | ---: | ---: | --- |
| User-to-admin workflow | 15% | 15% | User apply, backend store, trained ML score, admin decision, status tracker, bilingual public UI, and feature-mapping explanation exist. |
| Single-service public runtime | 15% | 15% | Express serves React build and API from one Railway public origin. |
| Deployment config | 15% | 15% | `railway.toml`, `render.yaml`, Dockerfile, `/ready`, GitHub push path, and CI validation exist. |
| Automated verification | 15% | 15% | `check`, API smoke, public smoke, deploy-config check, preflight, Docker preflight, and public URL verifier exist. |
| Runtime persistence bridge | 10% | 10% | Railway `/data` volume path and Render `/var/data` disk path are documented and sufficient for the portfolio demo bridge. JSON storage is still not the final product database. |
| MLOps integration for public demo | 10% | 10% | Backend calls the verified public KoopCare MLOps Credit Scoring API; write-test verification confirms `source=ml_api`. |
| Public URL verification | 10% | 10% | Railway public URL exists. Read-only verification and write-test verification both pass. |
| Security boundary | 10% | 10% | Advisory AI messaging, validation, decision note rules, demo member/admin role gate, admin-only queue reads, and access-code status lookup exist for the portfolio demo. Production-grade auth is still future work. |

Total:

```text
100 / 100 for a portfolio public demo
```

This does not mean the product is production-ready for real cooperative financing. It means the public demo target is now complete: a reviewer can open one public link, submit a financing application, receive trained ML scoring, review it as an admin, save a final decision, and check member status without installing anything locally.

## What Is Already Ready

### Product Flow

Ready:

- user can open the web app through a public Railway URL;
- user can submit financing application;
- backend validates and stores application;
- backend asks the public MLOps API and receives trained model scoring;
- public UI has an Indonesian-first `ID/EN` toggle for the main hero, Apply, Status, Admin, and System explanation;
- System page explains 14 product fields -> 19 MLOps request fields -> 25 model columns;
- backend keeps clearly labeled fallback as a resilience path if the public MLOps API is unavailable;
- member/admin demo login exists;
- member token is required for public application submission;
- generated access code is required for member status lookup;
- full application list is admin-only;
- admin token is required for rescore and approve/reject actions;
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
npm run verify:ml-api -- https://your-public-ml-api-url
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

The normal public verifier checks:

- root web app;
- SPA status route;
- `/health`;
- `/ready`;
- web build readiness;
- JSON storage readiness;
- summary API;
- ML status diagnostics;
- applications API with admin authentication;
- JSON 404 behavior.

The write-test verifier has passed for:

- create application;
- confirm current scoring source;
- receive member access code;
- read status with member access code;
- save officer approval decision;
- read decided status again with member access code.

## Public Demo Operating Notes

The public URL exists now.

The public-demo target is complete. These are the operating notes to keep it healthy:

1. The public KoopCare MLOps Credit Scoring API is already verified:

```text
https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

2. KoopCare Fullstack Demo Platform Railway variable is now connected:

```text
ML_API_BASE_URL=https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

3. Keep `ML_SCORING_MODE=optional_fallback` during early testing.
4. Public write verification confirms source is:

```text
ml_api
```

5. Only after more monitoring, consider:

```text
ML_SCORING_MODE=strict_ml
```

6. Keep using this command before demos:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

## What Is Still Missing Before Full Product

These are not blockers for a portfolio demo, but they are blockers for a serious production-style product:

- production-grade authentication that replaces the demo role gate;
- database-backed role-based access control;
- database-backed user ownership instead of access-code demo ownership;
- MySQL or PostgreSQL persistence;
- migration scripts;
- audit trail/history table;
- stricter production MLOps mode after monitoring;
- model monitoring and model governance;
- rate limiting;
- request logging;
- better secret management;
- legal/compliance review for real credit use.

## Why Fallback Scoring May Still Exist As A Safety Path

The public Railway app is running correctly, and the latest public write-test
verification confirmed trained ML scoring:

```text
source=ml_api
```

The service should now be configured like this:

```text
ML_SCORING_MODE=optional_fallback
ML_API_BASE_URL=https://koopcare-mlops-credit-scoring-api-production.up.railway.app
DEMO_AUTH_SECRET=use_a_unique_random_value
DEMO_MEMBER_PASSWORD=member-demo-2026
DEMO_ADMIN_PASSWORD=admin-demo-2026
DEMO_AUTH_TOKEN_TTL_SECONDS=28800
VITE_DEMO_MEMBER_PASSWORD=member-demo-2026
VITE_DEMO_ADMIN_PASSWORD=admin-demo-2026
```

`optional_fallback` is still intentionally kept during early public testing. If
the KoopCare MLOps Credit Scoring API has a temporary outage, the product can still stay usable
while marking fallback scores clearly.

It is not acceptable to present fallback scores as trained-model scores.

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

### Checkpoint 18 - Connect Verified Public MLOps API

Goal:

```text
fallback scoring is no longer the only public scoring path
```

Output:

- KoopCare MLOps Credit Scoring API has a public URL from its Docker/Railway deployment;
- `/health` on the ML API public URL works;
- `/model-info` on the ML API public URL works;
- `npm run verify:ml-api -- https://koopcare-mlops-credit-scoring-api-production.up.railway.app` passes;
- Railway `ML_API_BASE_URL` points to the deployed ML API;
- new/rescored applications show `source=ml_api`;
- fallback remains available only as a clearly labeled resilience path.

Status:

```text
completed
```

### Checkpoint 23 - Feature Mapping Handoff

Goal:

```text
make the model-field change understandable for teammates and reviewers
```

Output:

- System page explains the 14 -> 19 -> 25 field flow;
- `docs/feature_mapping.md` records every KoopCare Fullstack Demo Platform to KoopCare MLOps Credit Scoring API mapping;
- README and ML integration docs link to the mapping document;
- build, deployment config check, local public smoke, public ML API verification, and public write-test verification pass.

Status:

```text
completed
```

### Checkpoint 24 - Public Demo Polish

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

Status:

```text
completed
```

### Checkpoint 25 - Demo Auth and Role Separation

Goal:

```text
member and admin are no longer only UI tabs
```

Output:

- demo login - done;
- member session - done;
- admin session - done;
- route protection for write/admin actions - done;
- public verifier support for authenticated write tests - done.

Status:

```text
completed
```

### Checkpoint 26 - Member Status Privacy Boundary

Goal:

```text
member status lookup is safe enough for the completed portfolio public demo
```

Output:

- every submitted application receives a generated `memberAccessCode`;
- member status lookup requires application ID plus access code;
- admin token can still inspect records for review work;
- `/api/v1/applications` no longer exposes the queue to unauthenticated visitors;
- summary metrics remain available without leaking the application list;
- API smoke and public verifier scripts cover the protected read behavior.

Status:

```text
completed
```

### Checkpoint 27 - Database Milestone

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
verified public MLOps API
verified source=ml_api public write workflow
verified demo member/admin role gate
verified access-code member status lookup
```

The next meaningful jump is database-backed persistence and owner-scoped status
lookup. For the current portfolio demo, the public link, trained public ML path,
demo role gate, admin-only queue reads, and access-code status lookup are now
complete.
