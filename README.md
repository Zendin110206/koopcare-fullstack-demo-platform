<div align="center">

# KoopCare Fullstack Demo Platform

[![Project Status](https://img.shields.io/badge/status-public%20demo-success)](#project-status)
[![CI](https://github.com/Zendin110206/koopcare-fullstack-demo-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Zendin110206/koopcare-fullstack-demo-platform/actions/workflows/ci.yml)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20JSON%20MVP-informational)](#stack)
[![AI Integration](https://img.shields.io/badge/AI-FastAPI%20ML%20Inference-success)](#ml-integration)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Independent fullstack demo platform for KoopCare user and admin financing workflows, designed to integrate with a FastAPI-based ML credit scoring service.

</div>

---

## Overview

KoopCare Fullstack Demo Platform is an independent portfolio-grade implementation of a cooperative financing workflow.

The project is designed to demonstrate an end-to-end product path:

- members submit financing applications through a user-facing web experience;
- the application backend validates and stores submissions;
- the backend calls the KoopCare ML inference API for credit risk recommendation;
- cooperative officers review applications through an admin interface;
- final approval or rejection remains a human decision.

This repository is intentionally separate from the team repositories. It is a controlled fullstack lab for learning, portfolio evidence, and future contribution planning.

## Project Status

Current phase:

```text
Verified Railway public demo with product-grade financing workflow.
```

The repository currently contains a runnable React web app and Express API with an end-to-end demo flow:

- a reviewer lands on a member-first KoopCare financing homepage;
- a member can open a demo account screen with create-account, login, and Google-style demo entry points;
- a member can move into a guided financing application flow;
- the API validates and stores the application in local JSON storage;
- the API attempts to call the KoopCare MLOps API for scoring;
- if the ML API is unavailable, the API uses a transparent demo fallback scorer so the workflow remains testable;
- a member can track a submitted application from the web app with the application ID and generated access code;
- an admin can search, filter, inspect detail, review the case timeline, rescore, approve, or reject applications;
- a system page explains the current service boundaries and runtime status.

Public demo URL:

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

Verified with:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test --expect-ml-api
```

This is not production deployment yet. Authentication, MySQL persistence, and
stronger audit logging remain planned milestones. The public trained MLOps API
path is now connected and verified for the portfolio demo.

## Product Principle

```text
AI recommends, cooperative officers decide.
```

The AI output must be treated as decision support, not as an automatic credit decision.

The first ML integration target is the existing KoopCare MLOps API:

```text
https://github.com/Zendin110206/koopcare-mlops-credit-scoring-api
```

The current model artifact is suitable for prototype integration, but it is not presented as a production-ready cooperative credit model. Real production use would require data validation, model governance, security review, domain review, and retraining or recalibration with appropriate cooperative financing data.

## Product Surface

### User Web

Current user-facing workflow:

- review a financial-product style KoopCare homepage with clear trust signals;
- create a demo member account or log in through the demo access screen;
- complete a financing application form;
- submit application data to the backend;
- save the generated application ID and access code after submission;
- move into the member status tracker after submission;
- look up one application status by application ID and access code.

### Admin Web

Current admin workflow:

- login with the admin demo role;
- scan portfolio-level queue metrics;
- search and filter submitted financing applications;
- review submitted financing applications;
- inspect applicant detail, AI recommendation, risk indicators, model source, and human-review note;
- inspect a review timeline that records submission, scoring, rescoring, and final decision events;
- approve or reject the application;
- refresh the scoring result when needed;
- require the admin demo role before scoring or final-decision actions are saved.

### API Backend

Current backend responsibilities:

- demo member/admin role gate;
- request validation;
- local JSON-backed financing application persistence;
- ML API integration with timeout handling;
- transparent rule-based fallback scoring for demo reliability;
- access-code member status lookup for the public demo;
- admin-only application list reads;
- application audit trail events for submit, scoring, rescoring, and final decision actions;
- admin decision workflow;
- safe response shaping for frontend clients.

Planned backend responsibilities:

- production-grade authentication and authorization;
- MySQL-backed persistence;
- database-backed structured audit logs;
- deployment-ready configuration.

## Architecture

```text
User Web
  -> API Backend
  -> Local JSON Storage for MVP
  -> MySQL Database later

Admin Web
  -> API Backend
  -> Local JSON Storage for MVP
  -> MySQL Database later

API Backend
  -> KoopCare MLOps API
  -> XGBoost credit risk model
```

The frontend never calls the ML API directly. The backend owns ML integration, validation, business rules, persistence, and auditability.

## Stack

- React
- Vite
- TypeScript
- Node.js
- Express
- local JSON storage for the current MVP
- MySQL planned for the next persistence milestone
- Docker Compose
- FastAPI ML inference API integration

This stack is selected because it aligns with the existing KoopCare admin team repository while remaining practical for an independent portfolio project.

## Repository Structure

```text
.
├── .github/
│   └── workflows/
├── apps/
│   ├── api/
│   └── web/
├── database/
├── docs/
│   ├── architecture.md
│   ├── decision_log.md
│   ├── development_log.md
│   ├── ml_integration.md
│   ├── product_scope.md
│   ├── reviewer_quickstart.md
│   └── roadmap.md
├── packages/
├── references/
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
├── SECURITY.md
└── README.md
```

## Related Repositories

MLOps API:

```text
https://github.com/Zendin110206/koopcare-mlops-credit-scoring-api
```

Team admin repository:

```text
https://github.com/sayafauzi/koopcare-admin
```

Team mobile repository:

```text
https://github.com/Gzaa19/KoopCare
```

Model and EDA reference:

```text
https://github.com/AdityaNugrahaPS/KoopCare-EDA
```

This repository does not replace those repositories. It is an independent fullstack demo and reference implementation.

## Local Setup

Install dependencies:

```powershell
npm install
```

Run the API and web app together:

```powershell
npm run dev
```

Run only the API:

```powershell
npm run dev:api
```

Run only the web app:

```powershell
npm run dev:web
```

Local URLs:

```text
Web app: http://127.0.0.1:5174
API health: http://localhost:5002/health
API readiness: http://localhost:5002/ready
Demo summary API: http://localhost:5002/api/v1/demo/summary
Applications API: http://localhost:5002/api/v1/applications (admin demo token required)
Application status API: http://localhost:5002/api/v1/applications/:id/status (send x-koopcare-access-code)
```

Run the production-style single-service preview:

```powershell
npm run build
npm start
```

Then open:

```text
http://localhost:5002
```

In this mode, the Express API serves the built React app and the API from the same port. This is the current deployment shape for a public portfolio demo.

Validate the project:

```powershell
npm run check
```

This runs API typecheck, web typecheck, and production builds.

Run the API smoke check:

```powershell
npm run smoke:api
```

This builds the API, starts it on an isolated smoke-test port, validates malformed JSON handling, financing amount rules, admin-only application reads, application creation, access-code status lookup, and officer decision note validation, then shuts the smoke server down.

Run the public preview smoke check:

```powershell
npm run smoke:public
```

This builds the API and web app, starts the single-service public preview on an isolated port, validates `/ready`, `/health`, the React app shell, SPA fallback, summary API, and JSON 404 behavior, then shuts the preview server down.

Validate deployment configuration:

```powershell
npm run check:deploy-config
```

This checks the Railway config, Render fallback Blueprint, Docker healthcheck, persistent runtime data paths, and public-demo start command.

Run the full deployment preflight:

```powershell
npm run preflight:deploy
```

After deployment, verify the public URL:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

To verify the full write workflow on the public service:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

ML scoring mode:

```powershell
# Local workflow demo without the Python service
ML_SCORING_MODE=optional_fallback

# Production-like demo that requires the Python MLOps API
ML_SCORING_MODE=strict_ml
```

The public Railway demo currently keeps `optional_fallback` as a resilience mode while it points to the verified public KoopCare MLOps Credit Scoring API URL:

```text
ML_API_BASE_URL=https://koopcare-mlops-credit-scoring-api-production.up.railway.app
```

The public demo role gate uses these variables:

```text
DEMO_AUTH_SECRET=use_a_unique_random_value
DEMO_MEMBER_PASSWORD=member-demo-2026
DEMO_ADMIN_PASSWORD=admin-demo-2026
VITE_DEMO_MEMBER_PASSWORD=member-demo-2026
VITE_DEMO_ADMIN_PASSWORD=admin-demo-2026
```

Switch to `strict_ml` only after more public monitoring confirms the ML API should be mandatory for every scoring request.

Security audit:

```powershell
npm audit --audit-level=moderate
```

The current dependency set is expected to report zero moderate-or-higher vulnerabilities.

## Documentation

- [Product Scope](docs/product_scope.md)
- [Architecture](docs/architecture.md)
- [ML Integration Plan](docs/ml_integration.md)
- [Feature Mapping](docs/feature_mapping.md)
- [Roadmap](docs/roadmap.md)
- [Deployment Guide](docs/deployment.md)
- [Public Deployment Readiness](docs/public_deployment_readiness.md)
- [Public Railway Verification](docs/public_railway_verification.md)
- [Public MLOps API Handoff](docs/public_ml_api_handoff.md)
- [Railway Beginner Walkthrough](docs/railway_beginner_walkthrough.md)
- [Render Beginner Walkthrough](docs/render_beginner_walkthrough.md)
- [Reviewer Quickstart](docs/reviewer_quickstart.md)
- [Decision Log](docs/decision_log.md)
- [Development Log](docs/development_log.md)

## Roadmap Summary

1. Bootstrap repository and documentation.
2. Scaffold React web and Express API apps.
3. Build the JSON-backed MVP financing workflow.
4. Harden the MVP runtime and validation behavior.
5. Upgrade the web experience into a product-grade landing, member, status, admin, and system workspace.
6. Add demo member/admin role separation.
7. Add access-code member status privacy and admin-only application list reads.
8. Add admin review timeline and JSON-backed audit trail events.
9. Polish the member-first landing and demo account experience for public reviewers.
10. Add MySQL development database and migration strategy.
11. Strengthen AI assessment persistence and database-backed audit logs.
12. Prepare public demo deployment.
13. Replace demo auth with production-grade authentication when the product moves beyond portfolio demo mode.

## Security and Privacy

Do not commit:

- `.env` files;
- database credentials;
- OAuth secrets;
- JWT secrets;
- generated model artifacts;
- real user data;
- production database dumps.

See [SECURITY.md](SECURITY.md) for the initial security checklist.

## Disclaimer

This project is an educational and portfolio demo. It must not be used as a production credit decisioning system without proper model validation, data governance, security review, legal review, and domain approval.

## Author

**Muhammad Zaenal Abidin Abdurrahman**  
Telecommunication Engineering Undergraduate - Telkom University

- GitHub: [Zendin110206](https://github.com/Zendin110206)
- LinkedIn: [zendin1102](https://www.linkedin.com/in/zendin1102/)
