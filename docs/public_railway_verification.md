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
- `/api/v1/applications` returns HTTP 200;
- unknown API paths return JSON 404.

## Full Workflow Verification

Verified command:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

Passed checks:

- create a real demo application;
- read its member status;
- save an officer approval decision;
- read the decided member status again.

Use this only when it is acceptable to add demo verification data to the live Railway service.

## Current ML Status

The public service is currently using labeled fallback scoring.

Reason:

```text
ML_SCORING_MODE=optional_fallback
ML_API_BASE_URL=http://127.0.0.1:8000
```

On Railway, `127.0.0.1:8000` points inside the Railway service container, not to the developer laptop. Because the Python MLOps API is not deployed inside that same public runtime, the trained model path is not reachable yet.

This does not mean the public web/API deployment failed. It means the next checkpoint is deploying or exposing the Python MLOps API publicly, then updating Railway `ML_API_BASE_URL`.

## Next Target

The next technical target is:

```text
public web/API URL works
plus public MLOps API URL works
plus new scores come from source=ml_api
```

Until then, the fallback scorer must stay clearly labeled as fallback.
