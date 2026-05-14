<div align="center">

# KoopCare Fullstack Demo Platform

[![Project Status](https://img.shields.io/badge/status-local%20MVP-success)](#project-status)
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
Local MVP financing workflow.
```

The repository currently contains a runnable React web app and Express API with an end-to-end local demo flow:

- a user can submit a financing application;
- the API validates and stores the application in local JSON storage;
- the API attempts to call the KoopCare MLOps API for scoring;
- if the ML API is unavailable, the API uses a transparent demo fallback scorer so the workflow remains testable;
- an admin can review, rescore, approve, or reject applications.

This is not production deployment yet. Authentication, MySQL persistence, stronger audit logging, and public hosting remain planned milestones.

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

- complete a financing application form;
- submit application data to the backend;
- receive an immediate AI assessment for admin review.

### Admin Web

Current admin workflow:

- review submitted financing applications;
- inspect AI recommendation and risk indicators;
- approve or reject the application;
- refresh the scoring result when needed.

### API Backend

Current backend responsibilities:

- request validation;
- local JSON-backed financing application persistence;
- ML API integration with timeout handling;
- transparent rule-based fallback scoring for local demo reliability;
- admin decision workflow;
- safe response shaping for frontend clients.

Planned backend responsibilities:

- authentication and authorization;
- MySQL-backed persistence;
- structured audit logs;
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
Demo summary API: http://localhost:5002/api/v1/demo/summary
Applications API: http://localhost:5002/api/v1/applications
```

Validate the project:

```powershell
npm run check
```

This runs API typecheck, web typecheck, and production builds.

Security audit:

```powershell
npm audit --audit-level=moderate
```

The current dependency set is expected to report zero moderate-or-higher vulnerabilities.

## Documentation

- [Product Scope](docs/product_scope.md)
- [Architecture](docs/architecture.md)
- [ML Integration Plan](docs/ml_integration.md)
- [Roadmap](docs/roadmap.md)
- [Reviewer Quickstart](docs/reviewer_quickstart.md)
- [Decision Log](docs/decision_log.md)
- [Development Log](docs/development_log.md)

## Roadmap Summary

1. Bootstrap repository and documentation.
2. Scaffold React web and Express API apps.
3. Build local MVP financing workflow with JSON persistence.
4. Add MySQL development database and migration strategy.
5. Add authentication and role separation.
6. Strengthen AI assessment persistence and audit logs.
7. Prepare public demo deployment.
8. Add optional advanced product features such as chatbot assistance.

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
