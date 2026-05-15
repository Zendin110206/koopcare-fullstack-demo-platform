# Architecture

This document defines the technical architecture for KoopCare Fullstack Demo Platform.

## Goals

The architecture should support a realistic end-to-end demo:

- user-facing financing application flow;
- admin-facing review workflow;
- backend-owned business logic;
- local JSON persistence for the MVP;
- MySQL-backed persistence in the next database milestone;
- ML inference through a separate FastAPI service;
- clear boundaries between prototype AI recommendation and human final decision.

## System Context

```text
User Browser
  -> Web App
  -> API Backend
  -> Local JSON Storage for MVP
  -> MySQL Database later

Admin Browser
  -> Web App
  -> API Backend
  -> Local JSON Storage for MVP
  -> MySQL Database later

API Backend
  -> KoopCare MLOps API
  -> XGBoost model artifact
```

## Component Responsibilities

### Web App

The web app will contain both user and admin surfaces.

User surface:

- product overview landing page;
- application form;
- application status view;
- simple profile/session experience.

Admin surface:

- queue metrics;
- search and status filters;
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

### Persistence

The current MVP stores application state in a local JSON file:

```text
apps/api/.data/applications.local.json
```

This is intentionally simple for early local testing. It allows reviewers to submit, score, approve, and reject applications without installing MySQL first.

The planned production-like database layer is MySQL.

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

## Current Runtime

The current local MVP implements:

```text
React web app at http://127.0.0.1:5174
Express API at http://localhost:5002
Production-style single-service preview at http://localhost:5002
Product overview page
Guided member application page
Member status tracker
Admin queue, filters, and detail panel
System readiness page
GET /health
GET /ready
GET /api/v1/demo/summary
GET /api/v1/demo/applications
GET /api/v1/applications
GET /api/v1/applications/:id/status
POST /api/v1/applications
POST /api/v1/applications/:id/score
POST /api/v1/applications/:id/decision
```

The runtime uses JSON file storage for the local MVP. MySQL persistence is intentionally deferred to the next database milestone.

In public-demo preview mode, the Express API serves the built React output from `apps/web/dist` so one public URL can host the product interface and the API.
