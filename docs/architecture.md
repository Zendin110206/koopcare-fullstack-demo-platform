# Architecture

This document defines the planned technical architecture for KoopCare Fullstack Demo Platform.

## Goals

The architecture should support a realistic end-to-end demo:

- user-facing financing application flow;
- admin-facing review workflow;
- backend-owned business logic;
- MySQL-backed persistence;
- ML inference through a separate FastAPI service;
- clear boundaries between prototype AI recommendation and human final decision.

## System Context

```text
User Browser
  -> Web App
  -> API Backend
  -> MySQL Database

Admin Browser
  -> Web App
  -> API Backend
  -> MySQL Database

API Backend
  -> KoopCare MLOps API
  -> XGBoost model artifact
```

## Component Responsibilities

### Web App

The web app will contain both user and admin surfaces.

User surface:

- application form;
- application status view;
- simple profile/session experience.

Admin surface:

- application list;
- application detail;
- AI recommendation panel;
- approve/reject actions.

### API Backend

The backend is the main application authority.

Responsibilities:

- authenticate users and admins;
- validate request payloads;
- manage loan application lifecycle;
- call the MLOps API;
- translate ML output into product-safe fields;
- store AI assessments;
- enforce that AI is advisory only.

### Database

The database stores application state.

Initial tables planned:

```text
users
loan_applications
ai_assessments
admin_audit_logs
```

### MLOps API

The MLOps API remains a separate service.

Initial integration target:

```text
POST /predict
```

Expected output includes:

```text
ai_recommendation
risk_level
prob_default
threshold
confidence
model_name
model_version
human_review_required
```

## Why the Frontend Does Not Call ML Directly

The frontend should not call the ML API directly because:

- the browser is not the source of truth for application data;
- ML request mapping should stay controlled by the backend;
- model service URLs should not become public frontend configuration;
- results must be persisted and audited;
- business rules should remain server-side.

Correct flow:

```text
Frontend -> API Backend -> MLOps API
```

Incorrect flow for the main product path:

```text
Frontend -> MLOps API
```

## Decision Boundary

The ML service returns a recommendation. It does not approve or reject applications.

Final decision must remain with:

```text
cooperative officer / admin reviewer
```

## Local Port Plan

Current local development ports:

```text
Web app: 5174
API backend: 5002
MySQL: 3308
MLOps API: 8000
```

These ports intentionally avoid the current ports used by the existing MLOps and admin repositories.

## Current Progress 02 Runtime

Progress 02 implements:

```text
React web app at http://127.0.0.1:5174
Express API at http://localhost:5002
GET /health
GET /api/v1/demo/summary
GET /api/v1/demo/applications
```

The runtime still uses demo in-memory data. MySQL persistence is intentionally deferred to Progress 03.
