# Public MLOps API Handoff

Last updated: 2026-05-16

## Why This Exists

The KoopCare fullstack demo is already public:

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

The previous ML blocker is now resolved for the public portfolio demo:

```text
the Python MLOps API public URL is verified and connected to this fullstack service
```

Public web submissions can now use trained ML scoring through KoopCare MLOps Credit Scoring API.

## Current Public System

Current public path:

```text
Reviewer browser
  -> Railway KoopCare fullstack service
  -> Express API
  -> JSON runtime storage
  -> tries ML_API_BASE_URL
  -> public KoopCare MLOps Credit Scoring API
  -> fallback scorer only if that public API is unreachable
```

Current expected Railway fullstack variable:

```text
ML_API_BASE_URL=https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

The trained scoring path is verified by the public write-test verifier.

## KoopCare MLOps Credit Scoring API Reality Check

KoopCare MLOps Credit Scoring API already has the right API contract:

```text
GET /
GET /health
GET /model-info
POST /predict
```

KoopCare Fullstack Demo Platform already calls:

```text
POST ${ML_API_BASE_URL}/predict
```

The response shape expected by KoopCare Fullstack Demo Platform is:

```text
ai_recommendation
risk_level
prob_default
threshold
confidence
model_name
model_version
human_review_required
note
```

Important deployment status:

```text
KoopCare MLOps Credit Scoring API now allows models/best_model.pkl for the approved public checkpoint
KoopCare MLOps Credit Scoring API Dockerfile now copies models/best_model.pkl into the production image
KoopCare MLOps Credit Scoring API now includes railway.toml
```

The task is no longer designing a model artifact strategy from zero or
connecting the service. The current task is keeping the public demo verified
before presentations and future changes.

Verified public KoopCare MLOps Credit Scoring API URL:

```text
https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

Verified command:

```powershell
npm run verify:ml-api -- https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

Verified result:

```text
Root endpoint: HTTP 200
Health endpoint: HTTP 200
Model info endpoint: HTTP 200
model_loaded=true
artifact_status=available
Prediction endpoint: HTTP 200
recommendation=LAYAK
```

## Correct Public ML Target

The goal is:

```text
https://your-public-ml-api-url/health       -> status ok
https://your-public-ml-api-url/model-info   -> model_loaded true, artifact_status available
POST https://your-public-ml-api-url/predict -> HTTP 200 with trained model response
```

Only after that should the fullstack Railway app point to it.

## New Verification Tool

This repo now includes:

```powershell
npm run verify:ml-api -- https://your-public-ml-api-url
```

That command checks:

- root endpoint;
- `/health`;
- `/model-info`;
- `model_loaded=true`;
- `artifact_status=available`;
- `/predict` returns a valid trained prediction response.

Temporary health/model-info only mode:

```powershell
npm run verify:ml-api -- https://your-public-ml-api-url --allow-unavailable-model
```

Use that only while debugging the ML API deployment. For real integration readiness, run without `--allow-unavailable-model`.

## New Fullstack Integration Checks

The public fullstack verifier still works:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

The write-test verifier checks submit, status, decision, and decided status:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

After the public ML API is connected, use:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

That last command requires the created public application to be scored with:

```text
source=ml_api
```

## Current Railway State

KoopCare Fullstack Demo Platform should keep:

```text
ML_API_BASE_URL=https://koopcare-mlops-credit-scoring-api-production.up.railway.app
ML_SCORING_MODE=optional_fallback
```

Keep `optional_fallback` during early public testing so the app remains usable if
the KoopCare MLOps Credit Scoring API has a temporary outage.

Before any presentation or important demo, run:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

Only after more monitoring, consider:

```text
ML_SCORING_MODE=strict_ml
```

## Model Artifact Decision

The project has chosen the commit-and-copy strategy for this approved public
portfolio checkpoint:

```text
models/best_model.pkl
-> committed in KoopCare MLOps Credit Scoring API
-> copied into the KoopCare MLOps Credit Scoring API Docker image
-> verified by /model-info and /predict
```

This is acceptable here because the team approved the prototype artifact for the
public demo and the file is small enough for the repository.

For future retrained models, do not silently replace the artifact. KoopCare MLOps Credit Scoring API
must follow:

```text
docs/model_handoff_contract.md
```

## Beginner Summary

Think of it like this:

```text
KoopCare Fullstack Demo Platform public URL is alive.
KoopCare Fullstack Demo Platform can already submit, store, approve, reject, and show status.
KoopCare MLOps Credit Scoring API public trained-model API is alive and verified.
KoopCare Fullstack Demo Platform is connected to that KoopCare MLOps Credit Scoring API URL.
The public write-test verifier confirms source=ml_api.
```

The next professional checkpoint is:

```text
public demo polish
auth and role separation
real database milestone
```
