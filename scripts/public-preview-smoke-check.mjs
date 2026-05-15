import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");
const smokePort = 5094;
const smokeDataDir = path.join(repoRoot, "local_context", "runtime_logs", "public-preview-smoke");
const smokeDataFile = path.join(smokeDataDir, "applications.public-preview-smoke.json");
const baseUrl = `http://127.0.0.1:${smokePort}`;

await rm(smokeDataDir, { recursive: true, force: true });
await mkdir(smokeDataDir, { recursive: true });

const child = spawn(process.execPath, ["scripts/start-public-demo.mjs"], {
  cwd: repoRoot,
  env: {
    ...process.env,
    API_PORT: String(smokePort),
    APP_ENV: "production",
    DATA_FILE_PATH: smokeDataFile,
    ML_API_TIMEOUT_MS: "200",
    ML_SCORING_MODE: "optional_fallback",
    SERVE_WEB_APP: "true"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverOutput = "";

child.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

child.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestText(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const text = await response.text();

  return {
    contentType: response.headers.get("content-type") ?? "",
    status: response.status,
    text
  };
}

async function requestJson(pathname) {
  const response = await requestText(pathname);

  return {
    ...response,
    body: JSON.parse(response.text)
  };
}

async function waitForReadiness() {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await requestJson("/ready");

      if (response.status === 200) {
        return response;
      }
    } catch {
      // The public preview server is still starting.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }

  throw new Error(`Public preview server did not become ready.\n${serverOutput}`);
}

try {
  const readiness = await waitForReadiness();
  assert(readiness.body?.status === "ready", "Readiness endpoint should report ready.");
  assert(
    readiness.body?.checks?.some((check) => check.name === "web_build" && check.status === "ok"),
    "Readiness endpoint should confirm web build availability."
  );
  assert(
    readiness.body?.checks?.some((check) => check.name === "json_storage" && check.status === "ok"),
    "Readiness endpoint should confirm JSON storage availability."
  );

  const health = await requestJson("/health");
  assert(health.status === 200, "Health endpoint should return 200.");
  assert(health.body?.service === "KoopCare Fullstack Demo API", "Health endpoint should identify the API.");

  const root = await requestText("/");
  assert(root.status === 200, "Public preview root should return 200.");
  assert(root.text.includes('<div id="root"></div>'), "Public preview root should serve the React app shell.");

  const statusRoute = await requestText("/status");
  assert(statusRoute.status === 200, "SPA route should return 200.");
  assert(statusRoute.text.includes('<div id="root"></div>'), "SPA route should serve the React app shell.");

  const summary = await requestJson("/api/v1/demo/summary");
  assert(summary.status === 200, "Summary API should return 200.");
  assert(summary.body?.integration?.web_app === "served_by_api", "Summary should expose served_by_api mode.");
  assert(summary.body?.integration?.web_dist_available === true, "Summary should expose web build availability.");

  const missingApiRoute = await requestJson("/api/v1/does-not-exist");
  assert(missingApiRoute.status === 404, "Missing API route should stay a JSON 404.");
  assert(missingApiRoute.body?.error === "Not Found", "Missing API route should return a JSON error.");

  console.log("Public preview smoke check passed.");
} finally {
  child.kill();
  await rm(smokeDataDir, { recursive: true, force: true });
}
