# Public Railway Verification

Last updated: 2026-05-16

## Live URL

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

## Current Result

The Railway public service is live. The read-only verifier and write-test
verifier both pass. The latest write-test verifier confirms trained ML scoring
through KoopCare MLOps Credit Scoring API.

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
- `/api/v1/ml/status` returns HTTP 200 and reports `prediction_ready=true`;
- `/api/v1/applications` returns HTTP 200;
- unknown API paths return JSON 404.

## Full Workflow Verification

Earlier verified command:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

Passed checks:

- create a real demo application;
- confirm scoring source;
- read its member status;
- save an officer approval decision;
- read the decided member status again.

Use this only when it is acceptable to add demo verification data to the live Railway service.

After the public Python MLOps API was connected, this command passed:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

That requires new public submissions to be scored with `source=ml_api`.

## Current ML Status

The public service is currently connected to the public KoopCare MLOps Credit Scoring API.

The separate KoopCare MLOps Credit Scoring API public URL is already verified:

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

Current expected configuration:

```text
ML_SCORING_MODE=optional_fallback
ML_API_BASE_URL=https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

The latest full public write verification passed with:

```text
source=ml_api
```

## Next Target

The next technical target is:

```text
public web/API URL works
plus public MLOps API URL works
plus new scores come from source=ml_api
```

This target is now complete. The fallback scorer remains available only as a
clearly labeled resilience path while `ML_SCORING_MODE=optional_fallback`.
