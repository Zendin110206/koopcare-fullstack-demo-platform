# ML Integration Plan

This document explains how this fullstack demo will integrate with the KoopCare MLOps API.

## Integration Target

MLOps repository:

```text
https://github.com/Zendin110206/koopcare-mlops-credit-scoring-api
```

Primary endpoint:

```text
POST /predict
```

## Integration Principle

The web frontend must not call the ML API directly.

Correct flow:

```text
Web App -> API Backend -> MLOps API
```

The backend is responsible for:

- mapping application data to the ML request schema;
- calling the MLOps API with timeout handling;
- interpreting the ML response safely;
- storing AI assessment metadata;
- returning product-safe response fields to the frontend.

For the current 19 request fields to 25 model columns mapping, see:

```text
docs/feature_mapping.md
```

## Current MVP Behavior

The current Express API already attempts to call:

```text
POST ${ML_API_BASE_URL}/predict
```

If the FastAPI MLOps service is running, the backend uses its response.

If the MLOps service is not running, the backend uses a transparent rule-based fallback. The fallback keeps the local product demo usable, but it must not be described as a real credit model.

The fallback response is marked with:

```text
source: demo_rule_based_fallback
```

The real ML API response is marked with:

```text
source: ml_api
```

## Scoring Modes

The demo supports two backend scoring modes:

```text
ML_SCORING_MODE=optional_fallback
```

Use this for local development. The backend tries the Python MLOps API first, then creates a clearly labeled fallback score if the service is unavailable.

```text
ML_SCORING_MODE=strict_ml
```

Use this for production-like demos. The backend requires the Python MLOps API for scoring. If the service is unavailable, the API returns `503 Service Unavailable` instead of creating a fallback score.

This keeps public demos honest: fallback mode is useful for local workflow testing, but strict mode is safer when the demo is presented as an MLOps integration.

## Important Score Semantics

The MLOps API returns:

```text
prob_default
```

Meaning:

```text
higher value = higher default risk
```

If the product needs a 0-100 eligibility score where higher means better:

```text
eligibility_score = round((1 - prob_default) * 100)
```

Do not map:

```text
prob_default * 100
```

directly into a higher-is-better score.

The current MVP follows this rule and exposes:

```text
eligibilityScore = round((1 - probDefault) * 100)
```

## Human Review

The UI must communicate that AI is advisory.

Recommended labels:

```text
AI Recommendation
Risk Level
Probability of Default
Human Review Required
Final Decision by Officer
```

Avoid:

```text
AI Approved
AI Rejected
```

## Model Limitation

The current model artifact is a prototype artifact. It is useful for demonstrating end-to-end integration, but it should not be presented as a final production model for real cooperative financing decisions.
