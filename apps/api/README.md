# API App

Express + TypeScript backend for the KoopCare fullstack demo.

## Current Endpoints

```text
GET /health
GET /api/v1/demo/summary
GET /api/v1/demo/applications
```

The current implementation uses in-memory demo data only. Database persistence will be added in a later progress checkpoint.

## Local Development

From the repository root:

```powershell
npm run dev:api
```

Default URL:

```text
http://localhost:5002
```

Health check:

```text
http://localhost:5002/health
```

## Environment

The backend reads:

```text
API_PORT=5002
APP_ENV=development
ML_API_BASE_URL=http://127.0.0.1:8000
ML_API_TIMEOUT_MS=5000
```

ML API integration is not wired into production flow yet. Progress 02 only establishes the runnable backend shell and demo endpoints.
