# Public MLOps API Handoff

Last updated: 2026-05-16

## Why This Exists

The KoopCare fullstack demo is already public:

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

The remaining ML blocker is now very narrow:

```text
the Python MLOps API public URL is verified, but it is not connected to this fullstack service yet
```

Because of that, public web submissions currently use clearly labeled fallback scoring.

## Current Public System

Current public path:

```text
Reviewer browser
  -> Railway KoopCare fullstack service
  -> Express API
  -> JSON runtime storage
  -> tries ML_API_BASE_URL
  -> fallback scorer if public ML API is unreachable
```

Current Railway fullstack variable still appears to behave like:

```text
ML_API_BASE_URL=http://127.0.0.1:8000
```

On Railway, that does not point to your laptop. It points inside the Railway service container. The trained scoring path will become available after project 14 `ML_API_BASE_URL` is changed to the verified project 13 public URL.

## Project 13 Reality Check

Project 13 already has the right API contract:

```text
GET /
GET /health
GET /model-info
POST /predict
```

Project 14 already calls:

```text
POST ${ML_API_BASE_URL}/predict
```

The response shape expected by project 14 is:

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
project 13 now allows models/best_model.pkl for the approved public checkpoint
project 13 Dockerfile now copies models/best_model.pkl into the production image
project 13 now includes railway.toml
```

So the next task is no longer designing a model artifact strategy from zero.
The next task is connecting project 14 to the verified project 13 public URL.

Verified public project 13 URL:

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

## Manual Steps You Must Do in Railway

I can prepare code, docs, scripts, and verification.

You must do these account-level steps if I do not have an authenticated Railway session:

1. Open the project 14 Railway service.
2. Open Variables.
3. Set:

```text
ML_API_BASE_URL=https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

4. Keep this during first testing:

```text
ML_SCORING_MODE=optional_fallback
```

5. Redeploy/restart the fullstack service.
6. Run:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

7. Only after that passes, consider:

```text
ML_SCORING_MODE=strict_ml
```

## Model Artifact Decision

The project has chosen the commit-and-copy strategy for this approved public
portfolio checkpoint:

```text
models/best_model.pkl
-> committed in project 13
-> copied into the project 13 Docker image
-> verified by /model-info and /predict
```

This is acceptable here because the team approved the prototype artifact for the
public demo and the file is small enough for the repository.

For future retrained models, do not silently replace the artifact. Project 13
must follow:

```text
docs/model_handoff_contract.md
```

## Beginner Summary

Think of it like this:

```text
Project 14 public URL is alive.
Project 14 can already submit, store, approve, reject, and show status.
Project 13 public trained-model API is alive and verified.
The missing trained-AI step is putting that Project 13 URL into Project 14 ML_API_BASE_URL.
```

The next professional checkpoint is:

```text
verify public ML API
connect Railway ML_API_BASE_URL
verify public fullstack scoring source=ml_api
```
