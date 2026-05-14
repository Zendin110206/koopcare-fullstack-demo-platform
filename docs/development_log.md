# Development Log

## 2026-05-14 - Progress 01 - Project Bootstrap

Initial repository bootstrap for the independent KoopCare fullstack demo platform.

Added:

- repository structure;
- README;
- MIT license;
- security notes;
- environment example;
- initial package metadata;
- architecture document;
- product scope document;
- roadmap;
- decision log;
- references;
- reviewer quickstart;
- ML integration plan;
- lightweight CI workflow.

The project does not yet include runnable frontend, backend, or database services. Those will be added in later checkpoints.

## 2026-05-14 - Documentation Hardening

Public documentation was rewritten in English to better match the intended portfolio audience and to align with the style of the existing professional repositories.

The local progress note remains in `local_context/` and is intentionally ignored by git.

## 2026-05-14 - Progress 02 - Runnable Web and API Scaffold

Added the first runnable fullstack shell:

- Express + TypeScript API workspace;
- React + Vite + TypeScript web workspace;
- API health endpoint;
- demo summary endpoint;
- demo applications endpoint;
- user application draft panel;
- admin review queue panel;
- system status panel;
- workspace scripts for development, typecheck, and build;
- updated reviewer documentation.

Validation:

```text
npm run check
npm audit --audit-level=moderate
```

Both checks pass for the current scaffold.

That checkpoint used in-memory demo data. It was replaced by local JSON storage in the next product workflow milestone.

## 2026-05-14 - Progress 03 - Local MVP Application Workflow

Added the first complete local product workflow:

- user financing application form submits to the API;
- API validates required application fields;
- API stores applications in local JSON runtime storage;
- API attempts to call the KoopCare MLOps API through `ML_API_BASE_URL`;
- API falls back to transparent rule-based scoring when the ML API is unavailable;
- admin review table displays submitted applications;
- admin can refresh scoring;
- admin can approve or reject an application;
- web app displays API-backed summary metrics;
- documentation updated from scaffold status to local MVP status.

Current local storage:

```text
apps/api/.data/applications.local.json
```

Validation:

```text
npm run check
```

The MVP is still not a production system. Authentication, MySQL persistence, deployment, stronger audit logs, and public demo hardening remain future milestones.
