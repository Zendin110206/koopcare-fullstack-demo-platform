# Reviewer Quickstart

This repository currently includes a runnable web and API scaffold.

## What You Can Review Now

You can review:

- product scope;
- planned architecture;
- ML integration strategy;
- roadmap;
- security notes;
- repository structure.
- runnable React web shell;
- runnable Express API shell.

## What Is Not Available Yet

The project does not yet include:

- database container;
- database-backed loan submission;
- production admin approval workflow;
- real authentication;
- deployed public demo.

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
