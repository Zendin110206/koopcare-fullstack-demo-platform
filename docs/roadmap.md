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

## Progress 03 - JSON-Backed MVP Application Workflow

Status:

```text
done
```

Goal:

```text
Make the web and API behave like a real product demo.
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

## Progress 04 - Maintenance Audit and Runtime Hardening

Status:

```text
done
```

Goal:

```text
Make the MVP safer to continue from before adding larger product features.
```

Output:

- root-based environment loading;
- consistent JSON storage path;
- integer validation for sensitive numeric fields;
- ML API response validation;
- JSON error handler;
- CI naming cleanup;
- version alignment to `0.2.0`.

## Progress 05 - Product Experience Upgrade

Status:

```text
done
```

Goal:

```text
Make the MVP read like a real KoopCare product, not only a technical demo.
```

Output:

- product overview landing page;
- guided member application workspace;
- member status tracker after application submission;
- admin queue metrics;
- search and status filters;
- selected application detail panel;
- richer AI recommendation card;
- system readiness page;
- version alignment to `0.3.0`.

## Progress 06 - Demo Authentication and Roles

Status:

```text
done
```

Goal:

```text
Separate member and admin actions for the public portfolio demo.
```

Output:

- demo login;
- member session;
- admin session;
- role-based write/admin route protection;
- public verifier support for authenticated write tests.

## Progress 07 - Member Status Privacy Boundary

Status:

```text
done
```

Goal:

```text
Make public member status lookup safer before the database milestone.
```

Output:

- generated member access code on application creation;
- member status lookup requires application ID plus access code;
- full application list requires admin demo token;
- summary metrics remain available for public dashboards without exposing the full queue;
- smoke and public verifier scripts cover the protected read behavior.

## Progress 08 - Local Database Setup

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

## Progress 09 - Production-Grade Authentication and Ownership

Goal:

```text
Replace demo auth with database-backed user/admin identity.
```

Planned output:

- real user accounts;
- password/session strategy;
- owner-scoped application status lookup;
- safer local secrets.

## Progress 10 - Audit Trail and Review History

Goal:

```text
Make admin decisions more inspectable.
```

Planned output:

- audit trail.
- decision history per application;
- reviewer notes history;
- event timeline for scoring and decision changes.

## Progress 11 - Production-Style ML Integration Hardening

Goal:

```text
Strengthen the existing backend-to-MLOps integration.
```

Planned output:

- explicit ML health display;
- clearer request/response audit fields;
- configurable strict mode with no fallback;
- richer error states.

## Progress 12 - Public Demo Readiness

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
