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

## 2026-05-15 - Maintenance Audit and Runtime Hardening

Audited the local MVP before moving to the next milestone.

Hardened:

- API environment loading now resolves from the repository root instead of relying on the shell working directory;
- default JSON storage now resolves to `apps/api/.data/applications.local.json` consistently;
- integer-only fields such as age, tenor, family size, and children are now validated as integers;
- ML API responses are validated before being mapped into product-facing assessment fields;
- internal API errors return JSON instead of an unstructured server response;
- CI job labels now refer to project checks instead of scaffold checks;
- package versions were aligned to `0.2.0`;
- stale directory README files were updated from bootstrap wording to current MVP wording.

Validation:

```text
npm run check
npm audit --audit-level=moderate
isolated fallback API runtime test
```

The isolated fallback test confirmed:

```text
invalid decimal integer input returns 400
ML API unavailable path returns demo_rule_based_fallback
admin decision endpoint still works
```

## 2026-05-15 - Progress 05 - Product Experience Upgrade

Upgraded the web app from a basic local MVP dashboard into a more complete product experience.

Changed:

- replaced the simple tabbed interface with a polished product overview, guided member application page, admin workspace, and system readiness page;
- added stronger first-screen product positioning for KoopCare;
- added queue metrics, search, status filters, selected-case detail, risk distribution, and decision controls to the admin workspace;
- expanded the AI recommendation panel with eligibility score, risk, confidence, default probability, model source, model version, and human-review note;
- rewrote the web stylesheet for responsive desktop and mobile layouts;
- updated public documentation to describe the current product surface;
- aligned package and API health versions to `0.3.0`.

Validation:

```text
npm run check
npm audit --audit-level=moderate
GET http://localhost:5002/health
GET http://127.0.0.1:5174
POST /api/v1/applications
POST /api/v1/applications/:id/decision
invalid age input returns 400
```

The runtime test confirmed that the upgraded UI did not break the backend workflow. The local app can still submit an application, create a transparent fallback AI assessment when the Python MLOps API is not running, and save an admin decision.
