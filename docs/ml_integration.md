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

