<div align="center">

# KoopCare Fullstack Demo Platform

[![Project Status](https://img.shields.io/badge/status-bootstrap-blue)](#project-status)
[![CI](https://github.com/Zendin110206/koopcare-fullstack-demo-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Zendin110206/koopcare-fullstack-demo-platform/actions/workflows/ci.yml)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20MySQL-informational)](#planned-stack)
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
Bootstrap and architecture foundation.
```

The repository currently contains the project structure, documentation, initial configuration, and roadmap. Runnable frontend, backend, database, and deployment workflows will be added incrementally in later progress checkpoints.

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

## Planned Product Surface

### User Web

Planned user-facing workflow:

- sign in or use a demo account;
- complete a financing application form;
- submit application data to the backend;
- view application status.

### Admin Web

Planned admin workflow:

- sign in as a cooperative officer;
- review submitted financing applications;
- inspect AI recommendation and risk indicators;
- approve or reject the application;
- keep a clear audit trail for human decisions.

### API Backend

Planned backend responsibilities:

- authentication and authorization;
- request validation;
- loan application persistence;
- ML API integration;
- AI assessment storage;
- admin decision workflow;
- safe response shaping for frontend clients.

## Planned Architecture

```text
User Web
  -> API Backend
  -> MySQL Database

Admin Web
  -> API Backend
  -> MySQL Database

API Backend
  -> KoopCare MLOps API
  -> XGBoost credit risk model
```

The frontend never calls the ML API directly. The backend owns ML integration, validation, business rules, persistence, and auditability.

## Planned Stack

- React
- Vite
- TypeScript
- Node.js
- Express
- MySQL
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

No runnable app is available in the bootstrap phase yet.

For now, validate the scaffold:

```powershell
npm run check
```

Expected output:

```text
KoopCare Fullstack Demo scaffold is ready. Progress 02 will add runnable apps.
```

The next checkpoint will add runnable frontend and backend applications.

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
3. Add Docker Compose and MySQL development database.
4. Build user financing application flow.
5. Build admin review workflow.
6. Integrate backend with KoopCare MLOps API.
7. Display AI recommendation in the admin review screen.
8. Prepare public demo deployment.

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
