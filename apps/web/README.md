# Web App

React + Vite + TypeScript frontend for the KoopCare fullstack demo.

## Current Surface

Progress 02 introduces a runnable app shell with:

- user financing application draft panel;
- admin review queue panel;
- system status panel backed by the demo API;
- clear AI governance copy.

The form is not persisted yet. Database and real submission handling will be added in later checkpoints.

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
