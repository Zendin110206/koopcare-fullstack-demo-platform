# Decision Log

This document records important project decisions.

## 2026-05-14 - Create an Independent Fullstack Demo Repository

Decision:

```text
Create a new standalone repository for the KoopCare fullstack demo.
```

Rationale:

- the existing MLOps repository should stay focused on ML inference;
- the team admin repository should not receive large scope changes without review;
- an independent repository gives full control for learning and portfolio development;
- successful experiments can later be translated into smaller team pull requests.

## 2026-05-14 - Use React, Express, and MySQL

Decision:

```text
Use React + Vite for the web app, Express for the API backend, and MySQL for persistence.
```

Rationale:

- this matches the direction of the existing KoopCare admin repository;
- the stack is practical for a fullstack portfolio project;
- it keeps future translation to the team repository easier;
- it is simple enough to learn incrementally.

## 2026-05-14 - Keep ML Inference as a Separate Service

Decision:

```text
The demo backend will call the existing MLOps API instead of importing the model directly.
```

Rationale:

- the model runtime belongs in the Python/FastAPI MLOps service;
- the product backend should own application logic and persistence;
- separating services reflects a more realistic architecture;
- it matches the integration strategy already prepared for the admin team.

## 2026-05-14 - Use English for Public Repository Documentation

Decision:

```text
Public documentation should be written in English.
```

Rationale:

- the repository is intended for portfolio review;
- English README files are more accessible to wider reviewers;
- local Indonesian learning notes can still live under ignored `local_context/`.

## 2026-05-14 - Use JSON File Storage for the First MVP Workflow

Decision:

```text
Use local JSON file storage before adding MySQL.
```

Rationale:

- the user-to-admin workflow can be tested before a database is installed;
- reviewers do not need a database installation for the first demo;
- the storage boundary remains isolated inside the API;
- MySQL can replace the JSON adapter in a later milestone without changing the product flow.

This is not the final persistence strategy. MySQL remains the planned production-style storage layer.

## 2026-05-14 - Keep a Transparent Scoring Fallback for Demo Reliability

Decision:

```text
If the MLOps API is unavailable, the backend may use a clearly labeled demo fallback scorer.
```

Rationale:

- the fullstack workflow remains testable even when the Python ML service is not running;
- the fallback is explicitly marked as `demo_rule_based_fallback`;
- the UI and docs still treat AI as advisory only;
- real production deployment should use stricter model availability rules.

## 2026-05-15 - Upgrade Product Experience Before Database Work

Decision:

```text
Improve the web experience before replacing JSON storage with MySQL.
```

Rationale:

- the existing API foundation is already stable enough for the MVP;
- a portfolio reviewer should understand the product from the first screen, not only from technical docs;
- a stronger landing page, member form, admin queue, and detail panel make later database work easier to review;
- the database milestone remains planned, but user experience now reflects the intended KoopCare product direction.

## 2026-05-17 - Split Frontend Domain Data From App Composition

Decision:

```text
Move frontend types, runtime configuration, copy, ML feature mapping, formatters, API fetch handling, reusable UI atoms, and route-level views out of App.tsx.
```

Rationale:

- the public demo is now portfolio-facing, so the code needs to read like maintainable product work;
- `App.tsx` had grown too large and mixed app orchestration with view composition, data contracts, copywriting, formatting, and mapping tables;
- future member/admin separation will be easier when shared domain data and helpers already live in dedicated modules;
- this refactor keeps behavior unchanged while reducing review risk for later feature checkpoints.

## 2026-05-17 - Add Demo Role Gate Before Production Auth

Decision:

```text
Use a signed demo token gate for member/admin actions before adding database-backed production authentication.
```

Rationale:

- the public portfolio demo needs a clear difference between member actions and officer actions now;
- full production authentication still needs users, password handling, database persistence, and owner-scoped records;
- a small signed-token gate keeps the workflow realistic without pretending that the product already has production identity security;
- public verifiers can now prove that member submission and admin decision actions still work through the public URL.

## 2026-05-17 - Use Access-Code Status Lookup Before Database Ownership

Decision:

```text
Use a generated member access code for public-demo status lookup until database-backed user ownership is implemented.
```

Rationale:

- the public demo should not expose the full application queue to every visitor;
- database-backed accounts and row ownership are a larger milestone that should be implemented separately;
- an application ID plus access code is simple enough for reviewers to understand and test;
- the admin demo role can still inspect the full queue for officer review work;
- this keeps the portfolio demo safer without pretending it is production-grade identity security.
