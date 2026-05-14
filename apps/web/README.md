# Web App

React + Vite + TypeScript frontend for the KoopCare fullstack demo.

## Current Surface

The current local MVP includes:

- product overview landing page;
- guided member financing application form;
- backend-backed application submission;
- immediate AI assessment creation;
- admin queue metrics;
- admin review queue table with search and status filters;
- selected application detail panel;
- AI recommendation card with risk, confidence, model source, and human-review note;
- score refresh action;
- approve and reject actions;
- system readiness panel backed by the demo API;
- clear AI governance copy.

The current version persists application data through the API's local JSON storage. MySQL persistence and authentication are planned follow-up milestones.

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
