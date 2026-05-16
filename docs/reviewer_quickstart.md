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
- member status tracking after submission;
- local JSON-backed persistence;
- admin queue metrics, search, filters, and detail panel;
- score refresh, approve, and reject actions;
- system readiness page;
- ML API integration behavior with transparent fallback.

## What Is Not Available Yet

The project does not yet include:

- MySQL-backed persistence;
- real authentication and authorization;
- deployed public demo URL;
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

API readiness:

```text
http://localhost:5002/ready
```

Try the MVP:

1. Open the web app.
2. Review the `Overview` page to understand the product.
3. Use `Apply` to review the prefilled financing form.
4. Click `Review Application`.
5. Confirm the review summary with `Confirm and Submit`.
6. The app switches to `Status`.
7. Review the submitted application status as a member.
8. Open `Admin`.
9. Review the new application through the queue and detail panel.
10. Use search or status filters if needed.
11. Click `Refresh Score`, `Approve`, or `Reject`.
12. Open `System` to inspect the local runtime boundaries.

## Public-Style Preview

Run:

```powershell
npm run build
npm start
```

Open:

```text
http://localhost:5002
```

This serves the built React app and the API from one Express service, matching the current public demo deployment shape.

The backend stores local state in:

```text
apps/api/.data/applications.local.json
```

This file is ignored by git.

## Validation

Run:

```powershell
npm run check
npm run smoke:api
npm run smoke:public
npm run check:deploy-config
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
6. `docs/deployment.md`
7. `SECURITY.md`
