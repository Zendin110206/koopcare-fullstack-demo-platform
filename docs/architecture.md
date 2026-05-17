# Architecture

This document defines the technical architecture for KoopCare Fullstack Demo Platform.

## Goals

The architecture should support a realistic end-to-end demo:

- user-facing financing application flow;
- admin-facing review workflow;
- backend-owned business logic;
- JSON file persistence for the MVP;
- MySQL-backed persistence in the next database milestone;
- ML inference through a separate FastAPI service;
- clear boundaries between prototype AI recommendation and human final decision.

## System Context

```text
User Browser
  -> Web App
  -> API Backend
  -> JSON Storage for MVP
  -> MySQL Database later

Admin Browser
  -> Web App
  -> API Backend
  -> JSON Storage for MVP
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
- access-code application status view;
- simple profile/session experience.

Admin surface:

- queue metrics;
- search and status filters;
- application list;
- application detail;
- AI recommendation panel;
- approve/reject actions.

Frontend code organization:

```text
apps/web/src/App.tsx = top-level application state and view composition
apps/web/src/views/ = route-level public-demo views
apps/web/src/components/ = reusable UI atoms
apps/web/src/types.ts = shared frontend data contracts
apps/web/src/config.ts = runtime web config and form defaults
apps/web/src/copy.ts = bilingual product copy
apps/web/src/featureMapping.ts = ML request/model mapping explanation data
apps/web/src/formatters.ts = display formatting and localized labels
apps/web/src/apiClient.ts = JSON fetch helper
```

This keeps public-demo copy, feature mapping data, and formatting rules out of
the main app composition file so future member/admin view extraction can happen
without changing API behavior.

### API Backend

The backend is the main application authority.

Responsibilities:

- enforce the current demo member/admin role gate;
- restrict full application queue reads to the admin demo role;
- allow member status lookup only with the generated application ID and access code;
- validate request payloads;
- manage loan application lifecycle;
- call the MLOps API;
- translate ML output into product-safe fields;
- store AI assessments;
- append audit trail events for submission, scoring, rescoring, and final decision actions;
- enforce that AI is advisory only.

### Persistence

The current MVP stores application state in a JSON file:

```text
apps/api/.data/applications.local.json
```

This is intentionally simple for the public-demo stage. It allows reviewers to submit, score, approve, and reject applications before the MySQL milestone.

The planned production-like database layer is MySQL.

Initial tables planned:

```text
users
loan_applications
ai_assessments
admin_audit_logs
```

The current JSON-backed MVP already stores an `auditTrail` array inside each application record. The later database milestone should move that timeline into a dedicated `admin_audit_logs` or event table.

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

The current MVP implements:

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
POST /api/v1/auth/login
GET /api/v1/auth/session
GET /api/v1/demo/applications
GET /api/v1/applications
GET /api/v1/applications/:id/status
POST /api/v1/applications
POST /api/v1/applications/:id/score
POST /api/v1/applications/:id/decision
```

The runtime uses JSON file storage for the MVP. MySQL persistence is intentionally deferred to the next database milestone.

The runtime also uses demo role tokens:

```text
member token       -> create application
member access code -> read one submitted application status
admin token        -> list applications, rescore, save final decision, and inspect audit timeline
```

This is a portfolio-demo control so reviewers can understand the intended separation between member actions and officer actions. The access code prevents a casual public visitor from browsing the full application list, but it is not a replacement for production authentication, password storage, or database-backed row-level authorization.

In public-demo preview mode, the Express API serves the built React output from `apps/web/dist` so one public URL can host the product interface and the API.
