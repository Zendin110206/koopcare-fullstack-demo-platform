# Render Deployment Walkthrough for Beginners

Last updated: 2026-05-16

This guide is written for a beginner who has never deployed a fullstack app before.

The goal is simple:

```text
You get one public link.
Other people can open that link.
They can see KoopCare Fullstack Demo Platform.
The web app and API run from the same public service.
```

## What Has Already Been Done

These parts are already prepared in the repository:

- GitHub repository exists:

```text
https://github.com/Zendin110206/koopcare-fullstack-demo-platform
```

- Latest commits have been pushed to `main`.
- GitHub Actions passed on `main`.
- `render.yaml` exists.
- `/ready` exists for health/readiness checks.
- `npm start` serves the built React app and API from one service.
- `npm run verify:public` exists for checking the final public URL.

## What I Cannot Do Without Your Account

I can prepare the code and commands.

I cannot click inside your Render account unless you give me an authenticated Render session/tool.

That means you must do these manual actions yourself:

1. Open Render in your browser.
2. Login or sign up.
3. Connect your GitHub account.
4. Select the KoopCare repository.
5. Create the Blueprint service.
6. Copy the public URL that Render gives you.

After you have the URL, I can help verify it using:

```powershell
npm run verify:public -- https://your-render-url.onrender.com
```

## Before Opening Render

Run this locally:

```powershell
npm run preflight:deploy
```

If Docker Desktop is running, also run:

```powershell
npm run preflight:deploy:docker
```

Both should pass before deployment.

## Step-by-Step Render Deployment

### Step 1 - Open Render

Open:

```text
https://render.com
```

Click login or sign up.

Use GitHub login if possible.

### Step 2 - Go to Blueprint

In Render dashboard, look for one of these options:

```text
New
Blueprint
New Blueprint Instance
```

Render UI can change, but the idea is:

```text
create service from render.yaml
```

### Step 3 - Connect GitHub

Render will ask for repository access.

Choose:

```text
Zendin110206/koopcare-fullstack-demo-platform
```

If the repo is not visible:

1. Click configure GitHub access.
2. Allow Render access to this repository.
3. Return to Render.
4. Select the repo again.

### Step 4 - Confirm Blueprint

Render should detect:

```text
render.yaml
```

It should create a web service named:

```text
koopcare-fullstack-demo-platform
```

Important settings from `render.yaml`:

```text
Runtime: Node
Build command: npm ci && npm run build
Start command: npm start
Health check path: /ready
Persistent disk: /var/data
```

Do not change these unless there is a clear reason.

### Step 5 - Confirm Environment Variables

Render should read these from `render.yaml`:

```text
NODE_VERSION=22.18.0
APP_ENV=production
SERVE_WEB_APP=true
DATA_FILE_PATH=/var/data/koopcare/applications.json
ML_SCORING_MODE=optional_fallback
ML_API_BASE_URL=http://127.0.0.1:8000
ML_API_TIMEOUT_MS=1500
```

For the first public demo, keep:

```text
ML_SCORING_MODE=optional_fallback
```

Why?

Because the Python MLOps API is not deployed together yet. If you use strict mode now, new scoring may fail unless the ML service is reachable.

### Step 6 - Deploy

Click:

```text
Apply
Create
Deploy
```

The exact button text may differ.

Wait until Render says the deploy is live.

### Step 7 - Copy Public URL

Render will give a URL similar to:

```text
https://koopcare-fullstack-demo-platform.onrender.com
```

Copy that URL.

### Step 8 - Quick Browser Checks

Open the URL.

You should see:

```text
KoopCare
Overview
Apply
Status
Admin
System
```

Then open:

```text
https://your-render-url.onrender.com/ready
```

Expected:

```text
"status": "ready"
```

Then open:

```text
https://your-render-url.onrender.com/api/v1/demo/summary
```

Expected:

```text
"web_app": "served_by_api"
"web_dist_available": true
```

### Step 9 - Run Automated Verification

Back in terminal, run:

```powershell
npm run verify:public -- https://your-render-url.onrender.com
```

Expected result:

```text
Public URL verification passed.
```

This is the proof that the public link works.

### Step 10 - Optional Write Test

Only run this if you are okay with adding one test application to the public demo:

```powershell
npm run verify:public -- https://your-render-url.onrender.com --write-test
```

This checks that public backend storage can create and read an application.

## What To Send Me After You Deploy

Send me:

```text
the Render public URL
```

Example:

```text
https://koopcare-fullstack-demo-platform.onrender.com
```

After that, I can:

- run `verify:public`;
- update README with the public URL;
- update readiness from `0% public URL availability` to `100% public URL availability`;
- create a new progress note;
- commit the public URL documentation.

## If Render Build Fails

Open Render deploy logs.

Copy the error text and send it to me.

Common failures:

### Build Command Fails

Look for:

```text
npm ci
npm run build
```

If either fails, send me the exact log.

### Health Check Fails

Open:

```text
/ready
```

If `/ready` is not ready, send me the response.

### App Opens But API Fails

Open:

```text
/api/v1/demo/summary
```

Send me the response or error.

## Current Status Before You Deploy

Current status:

```text
Public demo readiness: 86%
Actual public URL availability: 0%
Full product readiness: 64%
```

The next action that changes the project meaningfully is:

```text
create Render Blueprint service and get the public URL
```
