# Public MLOps API Handoff

Last updated: 2026-05-16

## Why This Exists

The KoopCare fullstack demo is already public:

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

The remaining ML blocker is:

```text
the Python MLOps API is not deployed on a public URL yet
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

Current Railway fullstack variable:

```text
ML_API_BASE_URL=http://127.0.0.1:8000
```

On Railway, that does not point to your laptop. It points inside the Railway service container. Since the Python MLOps API is not running inside that same container, trained scoring is unavailable.

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

Important deployment blocker:

```text
project 13 does not commit models/best_model.pkl
project 13 .dockerignore also excludes models/*
```

So if project 13 is deployed directly from GitHub without a model artifact strategy, `/health` can work but `/predict` may return `503 model_artifact_missing`.

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

1. Deploy project 13 as a separate Railway service or another public service.
2. Make sure the deployed service has access to `models/best_model.pkl`.
3. Open the public ML API URL.
4. Run:

```powershell
npm run verify:ml-api -- https://your-public-ml-api-url
```

5. If it passes, open the fullstack Railway service variables.
6. Set:

```text
ML_API_BASE_URL=https://your-public-ml-api-url
```

7. Keep this during first testing:

```text
ML_SCORING_MODE=optional_fallback
```

8. Redeploy/restart the fullstack service.
9. Run:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

10. Only after that passes, consider:

```text
ML_SCORING_MODE=strict_ml
```

## Model Artifact Options

Choose one strategy for `best_model.pkl`.

### Option A - Model Registry or Release Asset

Store the model artifact somewhere the deployment can download from:

- GitHub Release asset;
- Hugging Face model repository;
- S3-compatible object storage;
- other private artifact registry.

Then project 13 startup or build downloads the file into:

```text
models/best_model.pkl
```

This is the most future-proof path.

### Option B - Railway Volume

Attach a Railway volume and place:

```text
best_model.pkl
```

inside the mounted model folder.

Then set project 13:

```text
MODEL_PATH=/mounted-path/best_model.pkl
```

This can work, but it is more manual and easier to misconfigure.

### Option C - Commit the Model Artifact

This is not recommended as the default because model artifacts are generated binary files.

Only consider this if the artifact is intentionally public, small, legally safe, and explicitly accepted as part of the portfolio repo.

## Beginner Summary

Think of it like this:

```text
Project 14 public URL is alive.
Project 14 can already submit, store, approve, reject, and show status.
The only missing trained-AI part is a public Project 13 URL with the model file available.
```

The next professional checkpoint is:

```text
verify public ML API
connect Railway ML_API_BASE_URL
verify public fullstack scoring source=ml_api
```
