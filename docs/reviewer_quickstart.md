# Reviewer Quickstart

This repository currently includes a runnable local MVP for the KoopCare financing workflow.

## What You Can Review Now

You can review:

- product scope;
- planned architecture;
- ML integration strategy;
- roadmap;
- security notes;
- repository structure;
- runnable React web app;
- runnable Express API;
- product overview landing page;
- guided user financing application submission;
- local JSON-backed persistence;
- admin queue metrics, search, filters, and detail panel;
- score refresh, approve, and reject actions;
- system readiness page;
- ML API integration behavior with transparent fallback.

## What Is Not Available Yet

The project does not yet include:

- MySQL-backed persistence;
- real authentication and authorization;
- deployed public demo;
- production-grade credit decision governance.

## Local Run

Run:

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5174
```

API health:

```text
http://localhost:5002/health
```

Try the MVP:

1. Open the web app.
2. Review the `Overview` page to understand the product.
3. Use `Apply` to submit the prefilled financing form.
4. The app switches to `Admin`.
5. Review the new application through the queue and detail panel.
6. Use search or status filters if needed.
7. Click `Refresh Score`, `Approve`, or `Reject`.
8. Open `System` to inspect the local runtime boundaries.

The backend stores local state in:

```text
apps/api/.data/applications.local.json
```

This file is ignored by git.

## Validation

Run:

```powershell
npm run check
```

Security audit:

```powershell
npm audit --audit-level=moderate
```

## Recommended Review Order

1. `README.md`
2. `docs/product_scope.md`
3. `docs/architecture.md`
4. `docs/ml_integration.md`
5. `docs/roadmap.md`
6. `SECURITY.md`
