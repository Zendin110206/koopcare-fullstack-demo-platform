# Reviewer Quickstart

This repository currently includes a runnable public-demo MVP for the KoopCare financing workflow.

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
- simple finance-style public landing page;
- dedicated `/login` member account page with create-account, login, and Google-style demo entry points;
- guided user financing application submission;
- demo member/admin login gate;
- member-owned application reads after login;
- member status tracking after submission with application ID and access code;
- local JSON-backed persistence;
- admin queue metrics, search, filters, and detail panel;
- admin review timeline for submission, scoring, rescoring, and final decision events;
- score refresh, approve, and reject actions;
- system readiness page;
- ML API integration behavior with transparent fallback.

## What Is Not Available Yet

The project does not yet include:

- MySQL-backed persistence;
- production-grade authentication and authorization;
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
2. Review the `Home` page to understand the member value proposition.
3. Open `Log in` or `/login` to see the dedicated demo member account page.
4. Use `Create account`, `Log in`, or `Continue with Google (demo)` to enter as a member.
5. Use `Apply` to open the guided financing form.
6. Review the prefilled financing form.
7. Click `Review Application`.
8. Confirm the review summary with `Confirm and Submit`.
9. The app switches to `Track`.
10. Save the application ID and access code shown after submission.
11. Use the application ID and access code, or stay logged in as the submitting member, to review the submitted application status.
12. Open `Officer` and login with the admin demo role if prompted.
13. Review the new application through the queue and detail panel.
14. Inspect the review timeline to see submit and scoring events.
15. Use search or status filters if needed.
16. Click `Refresh Score`, `Approve`, or `Reject`.
17. Confirm that the timeline records the rescore or final decision event.
18. Open `System` to inspect the runtime boundaries.

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
npm run preflight:deploy
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
