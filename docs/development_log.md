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

## 2026-05-14 - Progress 03 - JSON-Backed MVP Application Workflow

Added the first complete product workflow:

- user financing application form submits to the API;
- API validates required application fields;
- API stores applications in local JSON runtime storage;
- API attempts to call the KoopCare MLOps API through `ML_API_BASE_URL`;
- API falls back to transparent rule-based scoring when the ML API is unavailable;
- admin review table displays submitted applications;
- admin can refresh scoring;
- admin can approve or reject an application;
- web app displays API-backed summary metrics;
- documentation updated from scaffold status to MVP status.

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

Audited the MVP before moving to the next milestone.

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

Upgraded the web app from a basic MVP dashboard into a more complete product experience.

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

## 2026-05-15 - Admin Review UX Stabilization

Fixed the first round of product UX issues found during manual browser review.

Changed:

- replaced the cramped admin table with a responsive application queue list;
- fixed admin sidebar spacing so labels and values no longer run together;
- reduced admin heading scale so it does not clip at the top of the workspace;
- added a clear ML status banner for fallback, mixed, or trained-model scoring states;
- added a selected-case warning when a score came from `demo_rule_based_fallback`;
- changed the source badge from raw `demo_rule_based_fallback` text to clearer product copy;
- added loading state for score and decision actions;
- added an inline confirmation step before saving approve/reject decisions;
- tightened mobile and narrow-width admin responsiveness.

Validation:

```text
npm run check
GET http://127.0.0.1:8000/health
GET http://127.0.0.1:8000/model-info
POST /api/v1/applications/:id/score
```

The MLOps API was restarted locally because an older uvicorn process was listening on port `8000` but timing out. After restart, the model endpoint returned `model_loaded: true`, and a backend score refresh returned `source: ml_api` with model `XGBoost`.

## 2026-05-15 - Member Submit Review Step

Added a safer member submission interaction after the admin UX stabilization checkpoint.

Changed:

- the Apply form no longer sends data immediately from the first submit button;
- the first submit action now opens a review panel;
- the review panel summarizes applicant, business, requested amount, installment, affordability, and collateral;
- the final backend submit only happens after `Confirm and Submit`;
- editing any form field closes the stale review panel so the summary cannot silently drift from the form values;
- the sidebar affordability metric now uses positive, warning, or danger styling.

Validation:

```text
npm run check
```

The goal is to make the member flow feel safer and clearer before an application is stored, scored, and sent into admin review.

## 2026-05-17 - Frontend Maintainability Checkpoint

Audited the public-demo frontend after the bilingual UI and feature-mapping work.

Changed:

- split shared TypeScript contracts into `apps/web/src/types.ts`;
- moved runtime web configuration, money rules, initial form data, and business type options into `apps/web/src/config.ts`;
- moved bilingual public copy into `apps/web/src/copy.ts`;
- moved ML feature mapping and derived feature explanations into `apps/web/src/featureMapping.ts`;
- moved display formatting, localized labels, tone helpers, and money normalization into `apps/web/src/formatters.ts`;
- moved JSON fetch handling into `apps/web/src/apiClient.ts`;
- moved route-level UI into `apps/web/src/views/`;
- moved shared UI atoms into `apps/web/src/components/ui.tsx`;
- reduced `apps/web/src/App.tsx` from more than 2,500 lines to roughly 250 lines without changing workflow behavior;
- updated public-facing documentation wording from folder/development-machine language toward repository/product terminology.

Validation:

```text
npm run typecheck --workspace @koopcare-demo/web
npm run check
```

Both checks passed. This checkpoint is a structural cleanup, not a product behavior change.

## 2026-05-17 - Demo Auth and Role Gate

Added a demo access-control layer so the public workflow no longer treats member and admin workspaces as simple open tabs.

Changed:

- added signed demo auth tokens in the API;
- added `POST /api/v1/auth/login` and `GET /api/v1/auth/session`;
- required member or admin demo tokens for application submission;
- required admin demo tokens for rescore and approve/reject actions;
- added a web login view with Indonesian/English copy;
- added account state, sign-out, and protected navigation behavior in the React app;
- updated smoke and public verification scripts so they login before write actions;
- updated docs and env examples to describe demo role gate separately from future production authentication.

Validation:

```text
npm run check
npm run smoke:api
npm run smoke:public
```

All checks passed. This checkpoint improves public-demo workflow realism, but it does not replace the later database-backed production authentication milestone.

## 2026-05-17 - Member Status Access Code Boundary

Closed the last major public-demo privacy gap before the database milestone.

Changed:

- application creation now returns a generated `memberAccessCode`;
- existing JSON application records are normalized with an access code when read;
- member status lookup now requires application ID plus access code, unless the caller has an admin demo token;
- the full application list is protected by the admin demo role;
- summary metrics are returned from `/api/v1/demo/summary` so public dashboards can still show counts and risk distribution without exposing the queue;
- the Status page now uses an explicit lookup form instead of broad search by name or phone;
- API smoke and public URL verifier scripts now prove admin-only list reads and access-code status reads.

Validation:

```text
npm run check
npm run smoke:api
npm run smoke:public
```

This keeps the public demo easy to try while reducing the chance that a reviewer misunderstands it as an open application database.

## 2026-05-17 - Admin Review Timeline and Audit Trail

Added a JSON-backed audit trail to make the admin workflow more inspectable.

Changed:

- each application now has an `auditTrail` array;
- new submissions create submit and AI-scoring audit events;
- score refresh creates an AI-rescored audit event;
- approve/reject creates a final-decision audit event;
- old JSON records are normalized with a migrated timeline when read;
- admin detail panel now shows a bilingual review timeline;
- summary metrics include total audit events;
- smoke and public verifier scripts assert audit trail presence.

Validation:

```text
npm run typecheck --workspace @koopcare-demo/api
npm run typecheck --workspace @koopcare-demo/web
```

This is still not the final database audit table. It is a portfolio-ready audit trail that prepares the shape of the later database milestone.

## 2026-05-17 - Member-First Public UX Polish

Reworked the public-facing member experience so the demo feels closer to a serious financial product.

Changed:

- replaced the technical overview-style hero with a member-first financing homepage;
- added clearer trust signals for fast application, access-code tracking, and officer-reviewed AI recommendations;
- added a financial product preview card and member journey preview to the homepage;
- redesigned the login view into a member account screen with create-account, login, and Google-style demo entry points;
- kept officer/reviewer access available as a secondary path instead of making admin the primary first impression;
- updated navigation wording from internal labels to more public-friendly labels such as Home, Track, and Officer;
- synchronized README, web README, reviewer quickstart, public readiness notes, and roadmap with the new user-facing workflow.

Validation:

```text
npm run check
```

This checkpoint is UI/UX polish for the completed public demo. It does not add real OAuth or production authentication; the account screen still uses the existing demo role gate.

## 2026-05-18 - Simple Finance Landing and Login Redesign

Revised the public UI direction after visual review showed the previous polish was still too heavy and too green.

Changed:

- collected reference screenshots from Wise, Revolut, Stripe, and Zopa for finance-site layout and tone comparison;
- changed the visual direction to a simpler white-first financial interface with restrained KoopCare green accents;
- replaced the heavy dark product preview with a lighter financing preview card;
- kept the landing page focused on one public story: member application, ML-assisted review, officer decision, private status tracking;
- separated the login experience into a full-page `/login` route without the main product topbar;
- added lightweight URL state so `/`, `/login`, `/apply`, `/status`, `/admin`, and `/system` behave like distinct SPA pages;
- adjusted the login form so long email values do not visually clip;
- expanded public preview and public URL verification scripts to assert the `/login` SPA route.

Validation:

```text
npm run check
npm run check:deploy-config
npm run smoke:public
npm audit --audit-level=moderate
git diff --check
local Chrome screenshot review for landing and login
```

The screenshots are stored under `local_context/runtime_logs/` and are not committed.
