# Web App

React + Vite + TypeScript frontend for the KoopCare fullstack demo.

## Current Surface

The current MVP includes:

- simple finance-style landing page with clear trust signals and status entry point;
- dedicated `/login` member account page with create-account, login, and Google-style demo entry points;
- compact reviewer access switch for officer/admin review;
- guided member financing application form;
- backend-backed application submission;
- member-owned application list after login;
- immediate AI assessment creation;
- generated application ID and access code after submission;
- member status lookup with application ID and access code;
- member status lookup through owner session for applications created by the logged-in demo member;
- admin queue metrics;
- admin review queue table with search and status filters;
- selected application detail panel;
- review timeline for submission, scoring, rescoring, and final decision events;
- AI recommendation card with risk, confidence, model source, and human-review note;
- score refresh action;
- approve and reject actions;
- system readiness panel backed by the demo API;
- clear AI governance copy.

The current version persists application data through the API's local JSON storage, uses a polished demo role gate for member/admin actions, keeps `/apply` and `/admin` behind the demo access page, and avoids exposing the full application queue to non-admin visitors. MySQL persistence and production-grade authentication are planned follow-up milestones.

## Source Structure

```text
src/App.tsx = app state, data loading, submit/score/decision handlers
src/views/ = top-level product views and navigation
src/components/ = reusable UI atoms
src/config.ts = runtime web config and default form values
src/authSession.ts = browser storage helper for demo auth session
src/copy.ts = bilingual product copy
src/featureMapping.ts = ML feature mapping explanation data
src/formatters.ts = localized formatting and display helpers
src/apiClient.ts = JSON fetch helper
src/types.ts = frontend data contracts
```

## Local Development

From the repository root:

```powershell
npm run dev:web
```

Default URL:

```text
http://localhost:5174
```

The web app expects the API at:

```text
http://localhost:5002
```

Override with:

```text
VITE_API_BASE_URL=http://localhost:5002
```

If the backend demo passwords are changed for a shared environment, align the
prefilled web login values at build time:

```text
VITE_DEMO_MEMBER_PASSWORD=member-demo-2026
VITE_DEMO_ADMIN_PASSWORD=admin-demo-2026
```
