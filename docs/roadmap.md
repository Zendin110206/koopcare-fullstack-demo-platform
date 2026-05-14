# Roadmap

This roadmap keeps the project incremental and reviewable.

## Progress 01 - Repository Bootstrap

Status:

```text
done
```

Scope:

- initialize repository;
- define product scope;
- define architecture;
- define roadmap;
- create documentation foundation;
- publish GitHub repository.

## Progress 02 - Web and API Scaffolding

Status:

```text
done
```

Goal:

```text
Create runnable frontend and backend applications.
```

Planned output:

- React + Vite + TypeScript web app;
- Express + TypeScript API app;
- API health endpoint;
- user/admin workspace shell;
- workspace scripts.

## Progress 03 - Local MVP Application Workflow

Status:

```text
done
```

Goal:

```text
Make the web and API behave like a real local product demo.
```

Output:

- user application form;
- create application endpoint;
- local JSON persistence;
- ML API call attempt through the backend;
- transparent fallback scoring when ML API is unavailable;
- admin review queue;
- score refresh;
- approve/reject actions.

## Progress 04 - Local Database Setup

Status:

```text
next
```

Goal:

```text
Replace JSON runtime storage with MySQL-backed local development.
```

Planned output:

- Docker Compose;
- MySQL service;
- database connection module;
- initial migration strategy;
- seed data plan.

## Progress 05 - Authentication and Roles

Goal:

```text
Separate user and admin access.
```

Planned output:

- demo login;
- user session;
- admin session;
- role-based route protection;
- safer local secrets.

## Progress 06 - Audit Log and Review Detail

Goal:

```text
Make admin decisions more inspectable.
```

Planned output:

- application detail view;
- audit trail.

## Progress 07 - Production-Style ML Integration Hardening

Goal:

```text
Strengthen the existing backend-to-MLOps integration.
```

Planned output:

- explicit ML health display;
- clearer request/response audit fields;
- configurable strict mode with no fallback;
- richer error states.

## Progress 08 - AI Recommendation UI Detail

Goal:

```text
Display AI recommendation with more reviewer context.
```

Planned output:

- AI recommendation card;
- probability default;
- risk level;
- confidence;
- model version;
- human review disclaimer.

## Progress 09 - Public Demo Readiness

Goal:

```text
Prepare the project for external review.
```

Planned output:

- demo seed data;
- reviewer quickstart;
- screenshots;
- deployment plan;
- security checklist;
- public demo URL when ready.
