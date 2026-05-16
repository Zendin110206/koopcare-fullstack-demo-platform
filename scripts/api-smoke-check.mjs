import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");
const smokePort = 5092;
const strictSmokePort = 5093;
const smokeDataDir = path.join(repoRoot, "local_context", "runtime_logs", "api-smoke");
const smokeDataFile = path.join(smokeDataDir, "applications.smoke.json");
const strictSmokeDataDir = path.join(repoRoot, "local_context", "runtime_logs", "api-smoke-strict");
const strictSmokeDataFile = path.join(strictSmokeDataDir, "applications.smoke.json");
const baseUrl = `http://127.0.0.1:${smokePort}`;
const strictBaseUrl = `http://127.0.0.1:${strictSmokePort}`;

await rm(smokeDataDir, { recursive: true, force: true });
await rm(strictSmokeDataDir, { recursive: true, force: true });
await mkdir(smokeDataDir, { recursive: true });
await mkdir(strictSmokeDataDir, { recursive: true });

const child = spawn(process.execPath, ["apps/api/dist/index.js"], {
  cwd: repoRoot,
  env: {
    ...process.env,
    API_PORT: String(smokePort),
    DATA_FILE_PATH: smokeDataFile,
    ML_API_TIMEOUT_MS: "200",
    ML_SCORING_MODE: "optional_fallback"
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

async function requestTo(targetBaseUrl, pathname, options = {}) {
  const response = await fetch(`${targetBaseUrl}${pathname}`, options);
  const text = await response.text();

  let body = null;

  if (text.length > 0) {
    body = JSON.parse(text);
  }

  return {
    body,
    status: response.status
  };
}

function request(pathname, options = {}) {
  return requestTo(baseUrl, pathname, options);
}

async function waitForHealth(targetBaseUrl = baseUrl, getServerOutput = () => serverOutput) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await requestTo(targetBaseUrl, "/health");

      if (response.status === 200) {
        return response;
      }
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }

  throw new Error(`API smoke server did not become healthy.\n${getServerOutput()}`);
}

const validApplication = {
  applicantName: "Smoke Test Applicant",
  phoneNumber: "081234560999",
  gender: "F",
  age: 34,
  businessType: "Grocery microbusiness",
  monthlyIncome: 6_500_000,
  requestedAmount: 8_000_000,
  tenorMonths: 10,
  purpose: "Smoke test application for API validation.",
  yearsInBusiness: 4,
  existingLoanCount: 0,
  familyMembers: 4,
  children: 2,
  hasCollateral: true
};

try {
  const health = await waitForHealth();
  assert(health.body?.storage?.applications === 3, "Expected clean seed data with 3 applications.");

  const readiness = await request("/ready");
  assert(readiness.status === 200, "Readiness endpoint should return 200 in API smoke mode.");
  assert(readiness.body?.status === "ready", "Readiness endpoint should report ready.");
  assert(
    readiness.body?.checks?.some((check) => check.name === "json_storage" && check.status === "ok"),
    "Readiness endpoint should confirm JSON storage availability."
  );
  assert(
    readiness.body?.checks?.some((check) => check.name === "web_build" && check.status === "skipped"),
    "Readiness endpoint should skip web build when SERVE_WEB_APP is disabled."
  );

  const mlStatus = await request("/api/v1/ml/status");
  assert(mlStatus.status === 200, "ML status endpoint should return 200.");
  assert(mlStatus.body?.ml_scoring_mode === "optional_fallback", "ML status should expose optional fallback mode.");
  assert(typeof mlStatus.body?.prediction_ready === "boolean", "ML status should expose a boolean prediction readiness flag.");

  const malformedJson = await request("/api/v1/applications", {
    body: "{bad-json",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  assert(malformedJson.status === 400, "Malformed JSON should return 400.");
  assert(
    malformedJson.body?.message === "Request body must be valid JSON.",
    "Malformed JSON should return a clear message."
  );

  const badIncome = await request("/api/v1/applications", {
    body: JSON.stringify({
      ...validApplication,
      monthlyIncome: 6_900_001
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  assert(badIncome.status === 400, "Invalid monthly income should return 400.");
  assert(
    badIncome.body?.message === "monthlyIncome must use Rp100.000 increments.",
    "Invalid monthly income should explain the increment rule."
  );

  const badRequestedAmount = await request("/api/v1/applications", {
    body: JSON.stringify({
      ...validApplication,
      requestedAmount: 6_000_000_000
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  assert(badRequestedAmount.status === 400, "Too-large requested amount should return 400.");
  assert(
    badRequestedAmount.body?.message === "requestedAmount must be at most Rp100.000.000.",
    "Too-large requested amount should explain the max rule."
  );

  const created = await request("/api/v1/applications", {
    body: JSON.stringify(validApplication),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  assert(created.status === 201, "Valid application should be created.");
  assert(created.body?.data?.id, "Created application should return an id.");
  assert(
    created.body?.data?.aiAssessment?.source === "demo_rule_based_fallback" ||
      created.body?.data?.aiAssessment?.source === "ml_api",
    "Created application should include an assessment source."
  );

  const applicationId = created.body.data.id;
  const statusLookup = await request(`/api/v1/applications/${applicationId}/status`);
  assert(statusLookup.status === 200, "Created application status should be readable.");
  assert(statusLookup.body?.data?.id === applicationId, "Status lookup should return the requested application.");

  const shortDecisionNote = await request(`/api/v1/applications/${applicationId}/decision`, {
    body: JSON.stringify({
      decision: "APPROVED",
      note: "too short",
      reviewerName: "Smoke Officer"
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  assert(shortDecisionNote.status === 400, "Short decision note should return 400.");
  assert(
    shortDecisionNote.body?.message === "note must be at least 12 characters.",
    "Short decision note should explain the minimum length."
  );

  const decision = await request(`/api/v1/applications/${applicationId}/decision`, {
    body: JSON.stringify({
      decision: "APPROVED",
      note: "Cashflow, collateral, and repayment capacity were checked.",
      reviewerName: "Smoke Officer"
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  assert(decision.status === 200, "Valid decision should be saved.");
  assert(decision.body?.data?.decision?.reviewerName === "Smoke Officer", "Decision reviewer should be persisted.");

  const strictChild = spawn(process.execPath, ["apps/api/dist/index.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      API_PORT: String(strictSmokePort),
      DATA_FILE_PATH: strictSmokeDataFile,
      ML_API_BASE_URL: "http://127.0.0.1:5999",
      ML_API_TIMEOUT_MS: "200",
      ML_SCORING_MODE: "strict_ml"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let strictServerOutput = "";

  strictChild.stdout.on("data", (chunk) => {
    strictServerOutput += chunk.toString();
  });

  strictChild.stderr.on("data", (chunk) => {
    strictServerOutput += chunk.toString();
  });

  try {
    const strictHealth = await waitForHealth(strictBaseUrl, () => strictServerOutput);
    assert(strictHealth.body?.ml_api?.scoring_mode === "strict_ml", "Strict server should expose strict_ml mode.");

    const strictReadiness = await requestTo(strictBaseUrl, "/ready");
    assert(strictReadiness.status === 200, "Strict server readiness should return 200.");
    assert(strictReadiness.body?.status === "ready", "Strict server readiness should report ready.");
    assert(
      strictReadiness.body?.checks?.some(
        (check) => check.name === "ml_scoring_configuration" && check.details?.scoring_mode === "strict_ml"
      ),
      "Strict server readiness should expose strict ML configuration."
    );

    const strictCreate = await requestTo(strictBaseUrl, "/api/v1/applications", {
      body: JSON.stringify(validApplication),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    assert(strictCreate.status === 503, "Strict mode should return 503 when the ML API is unavailable.");
    assert(
      strictCreate.body?.message?.startsWith("ML scoring is required, but the MLOps API is unavailable."),
      "Strict mode should explain that ML scoring is required."
    );
  } finally {
    strictChild.kill();
    await rm(strictSmokeDataDir, { recursive: true, force: true });
  }

  console.log("API smoke check passed.");
} finally {
  child.kill();
  await rm(smokeDataDir, { recursive: true, force: true });
  await rm(strictSmokeDataDir, { recursive: true, force: true });
}
