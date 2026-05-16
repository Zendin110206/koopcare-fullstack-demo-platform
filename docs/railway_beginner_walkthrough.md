# Railway Deployment Walkthrough for Beginners

Last updated: 2026-05-16

This is the new recommended public deployment path because Render is currently blocked for this project owner.

Railway is a better fit than Vercel for the current checkpoint because this repository already runs as:

```text
one Docker service
  -> Express API
  -> built React web app
  -> writable JSON data file
  -> /ready health check
```

Vercel is still useful later, but using Vercel cleanly would require a bigger architecture change: serverless functions plus an external database. That is not the fastest safe path for the current "get a public link" checkpoint.

Official references used for this setup:

- Railway Config as Code: https://docs.railway.com/config-as-code/reference
- Railway Healthchecks: https://docs.railway.com/deployments/healthchecks
- Railway Volumes: https://docs.railway.com/volumes
- Railway Free Trial and Pricing: https://docs.railway.com/pricing/free-trial
- Railway Pricing Plans: https://docs.railway.com/pricing/plans
- Vercel Functions: https://vercel.com/docs/functions

## Current Goal

The current goal is simple:

```text
people can open one public URL;
the URL opens the KoopCare web app;
the API works from the same URL;
/ready is healthy;
submissions can be stored;
admin can approve or reject;
status lookup still works.
```

This is still a portfolio demo, not a real production financial system.

## What Is Already Prepared in This Repository

The repository now includes:

- `Dockerfile`;
- `railway.toml`;
- `npm start`;
- `/ready` readiness endpoint;
- `DATA_FILE_PATH=/data/koopcare/applications.json`;
- `SERVE_WEB_APP=true`;
- public URL verifier script;
- deployment preflight script;
- GitHub CI.

The important Railway config is:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/ready"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

## What I Cannot Do Without Your Account

I can prepare the repository, code, config, docs, and verification commands.

I cannot do these account-only actions unless you give me an authenticated browser/session:

- create a Railway account;
- connect your GitHub account to Railway;
- select the private/public repository inside the Railway dashboard;
- create the Railway project;
- create or attach the Railway volume;
- generate the public Railway domain;
- pay or confirm billing if Railway asks for it.

So for this checkpoint, your manual part is mostly clicking inside Railway.

## Before Opening Railway

Run this locally first:

```powershell
npm run preflight:deploy
```

If Docker is installed and running, also run:

```powershell
npm run preflight:deploy:docker
```

Both should pass before you spend time in Railway.

## Step-by-Step Railway Deployment

### Step 1 - Open Railway

Open:

```text
https://railway.com
```

Click:

```text
Login
```

Use your GitHub account if possible. Railway's free/trial behavior can depend on account verification, so GitHub login is the cleanest path.

### Step 2 - Create a New Project

In the Railway dashboard, choose:

```text
New Project
```

Then choose something like:

```text
Deploy from GitHub repo
```

The exact button text can change, but the idea is:

```text
Railway project from GitHub repository
```

### Step 3 - Connect the Repository

Choose this repository:

```text
Zendin110206/koopcare-fullstack-demo-platform
```

If Railway asks for GitHub permission:

1. Click authorize/install.
2. Allow access to this repository.
3. Return to Railway.

### Step 4 - Confirm Docker Build

Railway should detect:

```text
Dockerfile
railway.toml
```

The service should build from the root `Dockerfile`.

Do not create a separate frontend service right now. The current deployment shape is one service only:

```text
one public service = web app + API
```

### Step 5 - Add Environment Variables

Open the service variables/settings area and add:

```text
APP_ENV=production
SERVE_WEB_APP=true
ML_SCORING_MODE=optional_fallback
ML_API_TIMEOUT_MS=1500
DATA_FILE_PATH=/data/koopcare/applications.json
```

Do not manually set `PORT` unless Railway support or the logs specifically tell you to. Railway injects `PORT` automatically, and the API now prefers `PORT` first.

Do not set:

```text
VITE_API_BASE_URL=http://localhost:5002
```

For public single-service deployment, the frontend should call the API on the same public origin.

### Step 6 - Add a Volume for Runtime JSON Data

This app currently stores demo submissions in a JSON file.

For Railway, create a volume and mount it here:

```text
/data
```

The app writes to:

```text
DATA_FILE_PATH=/data/koopcare/applications.json
```

Why this matters:

- without a volume, data can disappear when the service restarts or redeploys;
- with a volume, the JSON file is stored in a persistent mounted folder;
- this is still an MVP bridge, not the final database solution.

If Railway's free/trial account limits block volume creation, you can still deploy without a volume for visual demo purposes, but status/submission data may be temporary. In that case, write down the limitation and continue to the database checkpoint later.

### Step 7 - Deploy

Click:

```text
Deploy
```

Wait until the build and deploy logs finish.

Expected result:

```text
service is live
/ready healthcheck passed
```

If it fails, copy the error message from the Railway logs. The most useful parts are usually:

- build error;
- start command error;
- port/healthcheck error;
- permission error on `/data`;
- missing environment variable.

### Step 8 - Generate or Open the Public Domain

In Railway, find the networking/domain section.

Generate a public domain if Railway has not generated one automatically.

The current KoopCare public URL is:

```text
https://koopcare-fullstack-demo-platform-production.up.railway.app
```

If you create a new Railway service later, your URL can be different.

### Step 9 - Manual Browser Checks

Open these in your browser:

```text
https://your-railway-url/
https://your-railway-url/ready
https://your-railway-url/api/v1/demo/summary
```

Expected:

- `/` shows the KoopCare web app;
- `/ready` returns JSON with healthy checks;
- `/api/v1/demo/summary` returns JSON summary data.

### Step 10 - Run the Public URL Verifier

Back in this project folder, run:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/
```

If you want to test real write behavior too, run:

```powershell
npm run verify:public -- https://koopcare-fullstack-demo-platform-production.up.railway.app/ --write-test
```

The write test creates a real demo application, checks status lookup, saves an officer approval decision, then checks that the decided status can still be read.

### Step 11 - Save the Public URL

After verification passes, save the public URL in:

```text
README.md
docs/public_deployment_readiness.md
local_context/progress_notes/
```

Do not claim the app is fully production-ready. Claim it as:

```text
public portfolio demo
```

## If Railway Asks for Payment

Railway currently documents a free/trial path, but pricing and verification can change. If Railway asks for payment or verification:

1. Do not panic.
2. Screenshot or copy the message.
3. Send me the exact text.
4. We decide whether to continue Railway, switch to Koyeb/Fly.io, or refactor toward Vercel + database.

The key point: "free" hosting changes often. The repo is now portable enough that we can move.

## If Railway Build Fails

Check these first:

### Build Fails During `npm ci`

Run locally:

```powershell
npm ci
```

If local fails too, fix dependencies first.

### Build Fails During `npm run build`

Run locally:

```powershell
npm run check
```

Fix TypeScript/build errors before redeploying.

### Healthcheck Fails

Open logs and check whether the app says:

```text
KoopCare demo API listening on port ...
```

If Railway says the app is not listening on the right port, confirm that the code is using:

```text
PORT first, API_PORT second
```

This repository has already been updated for that.

### Data Path Permission Fails

Confirm the Railway volume is mounted at:

```text
/data
```

Confirm the variable is:

```text
DATA_FILE_PATH=/data/koopcare/applications.json
```

If the free/trial plan does not allow the needed volume behavior, deploy without durable data only as a temporary demo, then move to the database milestone.

## What To Send Me After You Try Railway

Send me:

```text
1. public URL
2. whether /ready opens
3. whether /api/v1/demo/summary opens
4. if failed: the Railway error log text
```

With that, I can do the next checkpoint precisely instead of guessing.

## Current Beginner Summary

You do not need to understand all deployment internals yet.

For now, think of it like this:

```text
GitHub stores the code.
Railway reads the code.
Docker builds the app.
Railway runs one service.
The service gives you one public link.
The public link opens the web app and API.
The /data volume keeps demo submissions from disappearing immediately.
```

That is the bridge from local portfolio project to public portfolio demo.
