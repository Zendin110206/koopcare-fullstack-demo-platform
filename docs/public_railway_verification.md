# Public Railway Verification

Last updated: 2026-05-16

## Live URL

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

## Current Result

The Railway public service is live. The read-only verifier and write-test verifier both pass.

Verified command:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

Verified checks:

- root web app returns HTTP 200;
- `/status` SPA route returns HTTP 200;
- `/health` returns HTTP 200;
- `/ready` returns HTTP 200;
- readiness confirms the web build is available;
- readiness confirms JSON storage is writable/readable;
- `/api/v1/demo/summary` returns HTTP 200;
- `/api/v1/ml/status` returns HTTP 200 and reports `prediction_ready=false` while the public ML API is not connected;
- `/api/v1/applications` returns HTTP 200;
- unknown API paths return JSON 404.

## Full Workflow Verification

Verified command:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

Passed checks:

- create a real demo application;
- confirm scoring source is currently `demo_rule_based_fallback`;
- read its member status;
- save an officer approval decision;
- read the decided member status again.

Use this only when it is acceptable to add demo verification data to the live Railway service.

After the public Python MLOps API is connected, run:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

That requires new public submissions to be scored with `source=ml_api`.

## Current ML Status

The public service is currently using labeled fallback scoring.

The separate project 13 public MLOps API is already verified:

```text
https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

Verified command:

```powershell
npm run verify:ml-api -- https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

Verified result:

```text
model_loaded=true
artifact_status=available
POST /predict returns recommendation=LAYAK
```

Reason:

```text
ML_SCORING_MODE=optional_fallback
ML_API_BASE_URL=http://127.0.0.1:8000
```

On Railway, `127.0.0.1:8000` points inside the Railway service container, not to the developer laptop. Project 13 now has a verified public ML API URL, but this fullstack service has not yet been pointed to that URL.

This does not mean the public web/API deployment failed. It means the next checkpoint is updating project 14 Railway `ML_API_BASE_URL`.

See:

```text
docs/public_ml_api_handoff.md
```

## Next Target

The next technical target is:

```text
public web/API URL works
plus public MLOps API URL works
plus new scores come from source=ml_api
```

Until then, the fallback scorer must stay clearly labeled as fallback.
