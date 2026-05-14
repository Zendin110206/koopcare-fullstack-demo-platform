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

## 2026-05-14 - Use Local JSON Storage for the First MVP Workflow

Decision:

```text
Use local JSON file storage before adding MySQL.
```

Rationale:

- the user-to-admin workflow can be tested immediately on any laptop;
- reviewers do not need a database installation for the first demo;
- the storage boundary remains isolated inside the API;
- MySQL can replace the JSON adapter in a later milestone without changing the product flow.

This is not the final persistence strategy. MySQL remains the planned production-style storage layer.

## 2026-05-14 - Keep a Transparent Scoring Fallback for Local Demo Reliability

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

- the existing API foundation is already stable enough for a local MVP;
- a portfolio reviewer should understand the product from the first screen, not only from technical docs;
- a stronger landing page, member form, admin queue, and detail panel make later database work easier to review;
- the database milestone remains planned, but user experience now reflects the intended KoopCare product direction.
