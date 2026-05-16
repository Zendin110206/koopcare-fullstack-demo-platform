import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");
const cliArguments = process.argv.slice(2);
const allowUnavailableModel = process.argv.includes("--allow-unavailable-model");
const urlArgument = cliArguments.find((argument) => !argument.startsWith("--"));
const mlApiUrl = normalizeBaseUrl(urlArgument ?? process.env.ML_API_PUBLIC_URL);
const reportPath = path.join(repoRoot, "local_context", "runtime_logs", "ml-api-url-verify-report.md");

if (!mlApiUrl) {
  console.error("Usage: npm run verify:ml-api -- https://your-public-ml-api-url");
  console.error("Temporary health/model-info only mode: add --allow-unavailable-model");
  process.exit(1);
}

const predictionPayload = {
  code_gender: "M",
  name_income_type: "Working",
  name_education_type: "Secondary / secondary special",
  name_family_status: "Married",
  occupation_type: "Laborers",
  flag_own_car: "N",
  flag_own_realty: "Y",
  cnt_children: 0,
  cnt_fam_members: 2,
  amt_income_total: 135000,
  amt_credit: 568800,
  amt_annuity: 20560.5,
  amt_goods_price: 450000,
  days_birth: -19241,
  days_employed: -2329,
  days_last_phone_change: -1740,
  ext_source_1: 0.5,
  ext_source_2: 0.6,
  ext_source_3: 0.4
};

function normalizeBaseUrl(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

async function requestText(pathname, options = {}) {
  const response = await fetch(`${mlApiUrl}${pathname}`, options);
  const text = await response.text();

  return {
    contentType: response.headers.get("content-type") ?? "",
    status: response.status,
    text
  };
}

async function requestJson(pathname, options = {}) {
  const response = await requestText(pathname, options);
  let body = null;

  try {
    body = JSON.parse(response.text);
  } catch {
    throw new Error(`${pathname} did not return valid JSON.`);
  }

  return {
    ...response,
    body
  };
}

function assertCheck(checks, name, condition, detail) {
  checks.push({
    detail,
    name,
    status: condition ? "passed" : "failed"
  });
}

function hasPassed(checks) {
  return checks.every((check) => check.status === "passed");
}

async function runVerification() {
  const checks = [];

  const root = await requestJson("/");
  assertCheck(checks, "Root endpoint", root.status === 200 && root.body?.predict_url === "/predict", `HTTP ${root.status}`);

  const health = await requestJson("/health");
  assertCheck(checks, "Health endpoint", health.status === 200 && health.body?.status === "ok", `HTTP ${health.status}`);

  const modelInfo = await requestJson("/model-info");
  assertCheck(checks, "Model info endpoint", modelInfo.status === 200, `HTTP ${modelInfo.status}`);
  assertCheck(
    checks,
    "Model artifact loaded",
    allowUnavailableModel || modelInfo.body?.model_loaded === true,
    `model_loaded=${modelInfo.body?.model_loaded ?? "unknown"}`
  );
  assertCheck(
    checks,
    "Model artifact available",
    allowUnavailableModel || modelInfo.body?.artifact_status === "available",
    `artifact_status=${modelInfo.body?.artifact_status ?? "unknown"}`
  );

  const prediction = await requestJson("/predict", {
    body: JSON.stringify(predictionPayload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const predictionSucceeded = prediction.status === 200;
  assertCheck(
    checks,
    "Prediction endpoint",
    allowUnavailableModel || predictionSucceeded,
    `HTTP ${prediction.status}`
  );

  if (predictionSucceeded) {
    assertCheck(
      checks,
      "Prediction response shape",
      (prediction.body?.ai_recommendation === "LAYAK" || prediction.body?.ai_recommendation === "TIDAK_LAYAK") &&
        typeof prediction.body?.prob_default === "number" &&
        typeof prediction.body?.model_name === "string",
      `recommendation=${prediction.body?.ai_recommendation ?? "missing"}`
    );
  }

  return checks;
}

async function writeReport(checks) {
  await mkdir(path.dirname(reportPath), { recursive: true });

  const generatedAt = new Date().toISOString();
  const lines = [
    "# MLOps API URL Verification Report",
    "",
    `Generated at: ${generatedAt}`,
    `URL: ${mlApiUrl}`,
    `Allow unavailable model: ${allowUnavailableModel ? "yes" : "no"}`,
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...checks.map((check) => `| ${check.name} | ${check.status} | ${check.detail} |`)
  ];

  await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
}

try {
  const checks = await runVerification();
  await writeReport(checks);

  for (const check of checks) {
    console.log(`${check.status === "passed" ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
  }

  console.log(`MLOps API URL verification report: ${path.relative(repoRoot, reportPath)}`);

  if (!hasPassed(checks)) {
    process.exit(1);
  }

  console.log("MLOps API URL verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "MLOps API URL verification failed.");
  process.exit(1);
}
