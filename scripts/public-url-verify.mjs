import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");
const cliArguments = process.argv.slice(2);
const writeTestEnabled = process.argv.includes("--write-test") || process.env.VERIFY_PUBLIC_WRITE === "true";
const urlArgument = cliArguments.find((argument) => !argument.startsWith("--"));
const publicDemoUrl = normalizeBaseUrl(urlArgument ?? process.env.PUBLIC_DEMO_URL);
const reportPath = path.join(repoRoot, "local_context", "runtime_logs", "public-url-verify-report.md");

if (!publicDemoUrl) {
  console.error("Usage: npm run verify:public -- https://your-public-demo-url");
  console.error("Optional write test: npm run verify:public -- https://your-public-demo-url --write-test");
  process.exit(1);
}

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
  const response = await fetch(`${publicDemoUrl}${pathname}`, options);
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

  const root = await requestText("/");
  assertCheck(checks, "Root web app", root.status === 200 && root.text.includes('<div id="root"></div>'), `HTTP ${root.status}`);

  const statusRoute = await requestText("/status");
  assertCheck(
    checks,
    "SPA status route",
    statusRoute.status === 200 && statusRoute.text.includes('<div id="root"></div>'),
    `HTTP ${statusRoute.status}`
  );

  const health = await requestJson("/health");
  assertCheck(
    checks,
    "Health endpoint",
    health.status === 200 && health.body?.service === "KoopCare Fullstack Demo API",
    `HTTP ${health.status}`
  );

  const readiness = await requestJson("/ready");
  assertCheck(checks, "Readiness endpoint", readiness.status === 200 && readiness.body?.status === "ready", `HTTP ${readiness.status}`);
  assertCheck(
    checks,
    "Readiness web build",
    readiness.body?.checks?.some((check) => check.name === "web_build" && check.status === "ok"),
    "web_build check"
  );
  assertCheck(
    checks,
    "Readiness storage",
    readiness.body?.checks?.some((check) => check.name === "json_storage" && check.status === "ok"),
    "json_storage check"
  );

  const summary = await requestJson("/api/v1/demo/summary");
  assertCheck(checks, "Summary endpoint", summary.status === 200, `HTTP ${summary.status}`);
  assertCheck(
    checks,
    "Single-service mode",
    summary.body?.integration?.web_app === "served_by_api" && summary.body?.integration?.web_dist_available === true,
    `web_app=${summary.body?.integration?.web_app ?? "unknown"}`
  );

  const applications = await requestJson("/api/v1/applications");
  assertCheck(checks, "Applications endpoint", applications.status === 200 && Array.isArray(applications.body?.data), `HTTP ${applications.status}`);

  const missingApi = await requestJson("/api/v1/does-not-exist");
  assertCheck(checks, "Missing API JSON 404", missingApi.status === 404 && missingApi.body?.error === "Not Found", `HTTP ${missingApi.status}`);

  if (writeTestEnabled) {
    const createResponse = await requestJson("/api/v1/applications", {
      body: JSON.stringify({
        age: 34,
        applicantName: "Public Verify Applicant",
        businessType: "Grocery microbusiness",
        children: 2,
        existingLoanCount: 0,
        familyMembers: 4,
        gender: "F",
        hasCollateral: true,
        monthlyIncome: 6_500_000,
        phoneNumber: "081234560998",
        purpose: "Public deployment verification application.",
        requestedAmount: 8_000_000,
        tenorMonths: 10,
        yearsInBusiness: 4
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    const createdId = createResponse.body?.data?.id;
    assertCheck(checks, "Write test create application", createResponse.status === 201 && Boolean(createdId), `HTTP ${createResponse.status}`);

    if (createdId) {
      const statusLookup = await requestJson(`/api/v1/applications/${createdId}/status`);
      assertCheck(
        checks,
        "Write test status lookup",
        statusLookup.status === 200 && statusLookup.body?.data?.id === createdId,
        `HTTP ${statusLookup.status}`
      );

      const decisionResponse = await requestJson(`/api/v1/applications/${createdId}/decision`, {
        body: JSON.stringify({
          decision: "APPROVED",
          note: "Public deployment verification decision was saved successfully.",
          reviewerName: "Public Verify Officer"
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      assertCheck(
        checks,
        "Write test officer decision",
        decisionResponse.status === 200 && decisionResponse.body?.data?.decision?.decision === "APPROVED",
        `HTTP ${decisionResponse.status}`
      );

      const decidedStatusLookup = await requestJson(`/api/v1/applications/${createdId}/status`);
      assertCheck(
        checks,
        "Write test decided status lookup",
        decidedStatusLookup.status === 200 && decidedStatusLookup.body?.data?.decision?.reviewerName === "Public Verify Officer",
        `HTTP ${decidedStatusLookup.status}`
      );
    }
  }

  return checks;
}

async function writeReport(checks) {
  await mkdir(path.dirname(reportPath), { recursive: true });

  const generatedAt = new Date().toISOString();
  const lines = [
    "# Public URL Verification Report",
    "",
    `Generated at: ${generatedAt}`,
    `URL: ${publicDemoUrl}`,
    `Write test: ${writeTestEnabled ? "enabled" : "disabled"}`,
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

  console.log(`Public URL verification report: ${path.relative(repoRoot, reportPath)}`);

  if (!hasPassed(checks)) {
    process.exit(1);
  }

  console.log("Public URL verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Public URL verification failed.");
  process.exit(1);
}
