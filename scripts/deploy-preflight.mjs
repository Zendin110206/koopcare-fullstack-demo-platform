import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");
const includeDocker = process.argv.includes("--docker");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const reportPath = path.join(repoRoot, "local_context", "runtime_logs", "deploy-preflight-report.md");

const tasks = [
  {
    args: ["run", "check"],
    command: npmCommand,
    name: "Typecheck and production build"
  },
  {
    args: ["run", "smoke:api"],
    command: npmCommand,
    name: "API smoke check"
  },
  {
    args: ["run", "smoke:public"],
    command: npmCommand,
    name: "Public preview smoke check"
  },
  {
    args: ["run", "check:deploy-config"],
    command: npmCommand,
    name: "Deployment config check"
  },
  {
    args: ["audit", "--audit-level=moderate"],
    command: npmCommand,
    name: "Dependency audit"
  }
];

if (includeDocker) {
  tasks.push({
    args: ["build", "-t", "koopcare-fullstack-demo:preflight", "."],
    command: "docker",
    name: "Docker image build"
  });
}

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function runTask(task) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(task.command, task.args, {
      cwd: repoRoot,
      env: process.env,
      shell: process.platform === "win32" && task.command === npmCommand,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
      process.stderr.write(chunk);
    });

    child.on("error", (error) => {
      resolve({
        ...task,
        durationMs: Date.now() - startedAt,
        exitCode: null,
        output,
        status: "failed",
        summary: error.message
      });
    });

    child.on("close", (exitCode) => {
      resolve({
        ...task,
        durationMs: Date.now() - startedAt,
        exitCode,
        output,
        status: exitCode === 0 ? "passed" : "failed",
        summary: exitCode === 0 ? "Passed" : `Exited with code ${exitCode}`
      });
    });
  });
}

function outputTail(output) {
  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(-12).join("\n");
}

async function writeReport(results) {
  await mkdir(path.dirname(reportPath), { recursive: true });

  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const generatedAt = new Date().toISOString();
  const lines = [
    "# Deploy Preflight Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Docker included: ${includeDocker ? "yes" : "no"}`,
    "",
    "## Checks",
    "",
    "| Check | Status | Duration |",
    "| --- | --- | --- |",
    ...results.map((result) => `| ${result.name} | ${result.status} | ${formatDuration(result.durationMs)} |`),
    "",
    "## Failure Details",
    ""
  ];

  const failures = results.filter((result) => result.status === "failed");

  if (failures.length === 0) {
    lines.push("No failures.");
  } else {
    for (const failure of failures) {
      lines.push(`### ${failure.name}`, "", "```text", outputTail(failure.output) || failure.summary, "```", "");
    }
  }

  await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
}

const results = [];

for (const task of tasks) {
  console.log(`\n[preflight] ${task.name}`);
  const result = await runTask(task);
  results.push(result);

  if (result.status === "failed") {
    console.error(`[preflight] ${task.name} failed.`);
    break;
  }
}

await writeReport(results);

const failed = results.some((result) => result.status === "failed");

console.log(`\nDeploy preflight report: ${path.relative(repoRoot, reportPath)}`);

if (failed) {
  process.exit(1);
}

console.log("Deploy preflight passed.");
