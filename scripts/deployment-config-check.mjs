import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readProjectFile(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

const [renderYaml, dockerfile, packageJsonText, deploymentGuide, envExample] = await Promise.all([
  readProjectFile("render.yaml"),
  readProjectFile("Dockerfile"),
  readProjectFile("package.json"),
  readProjectFile("docs/deployment.md"),
  readProjectFile(".env.example")
]);

const packageJson = JSON.parse(packageJsonText);

assert(renderYaml.includes("type: web"), "render.yaml must define a web service.");
assert(renderYaml.includes("runtime: node"), "render.yaml must use the Node runtime.");
assert(renderYaml.includes("buildCommand: npm ci && npm run build"), "render.yaml must build API and web apps.");
assert(renderYaml.includes("startCommand: npm start"), "render.yaml must start through the public demo entrypoint.");
assert(renderYaml.includes("healthCheckPath: /ready"), "render.yaml must use /ready as the health check path.");
assert(renderYaml.includes("autoDeployTrigger: checksPass"), "render.yaml must wait for CI checks before auto deploy.");
assert(renderYaml.includes("key: SERVE_WEB_APP"), "render.yaml must set SERVE_WEB_APP.");
assert(renderYaml.includes('value: "true"'), "render.yaml must enable API-served web app mode.");
assert(renderYaml.includes("key: DATA_FILE_PATH"), "render.yaml must set DATA_FILE_PATH.");
assert(renderYaml.includes("value: /var/data/koopcare/applications.json"), "render.yaml must store runtime data on the mounted disk.");
assert(renderYaml.includes("disk:"), "render.yaml must attach persistent storage for the JSON MVP runtime.");
assert(renderYaml.includes("mountPath: /var/data"), "render.yaml disk must mount at /var/data.");

assert(dockerfile.includes("ENV DATA_FILE_PATH=/data/koopcare/applications.json"), "Dockerfile must use a container data path.");
assert(dockerfile.includes("HEALTHCHECK"), "Dockerfile must define a readiness healthcheck.");
assert(dockerfile.includes("/ready"), "Dockerfile healthcheck must call /ready.");

assert(packageJson.scripts?.start === "node scripts/start-public-demo.mjs", "npm start must run the public demo entrypoint.");
assert(
  packageJson.scripts?.["check:deploy-config"] === "node scripts/deployment-config-check.mjs",
  "package.json must expose check:deploy-config."
);
assert(
  packageJson.scripts?.["preflight:deploy"] === "node scripts/deploy-preflight.mjs",
  "package.json must expose preflight:deploy."
);
assert(
  packageJson.scripts?.["verify:public"] === "node scripts/public-url-verify.mjs",
  "package.json must expose verify:public."
);

assert(deploymentGuide.includes("render.yaml"), "Deployment guide must mention render.yaml.");
assert(deploymentGuide.includes("Persistent Runtime Data"), "Deployment guide must explain persistent runtime data.");
assert(deploymentGuide.includes("/ready"), "Deployment guide must mention the readiness endpoint.");
assert(deploymentGuide.includes("preflight:deploy"), "Deployment guide must mention deployment preflight.");
assert(deploymentGuide.includes("verify:public"), "Deployment guide must mention public URL verification.");

assert(envExample.includes("DATA_FILE_PATH="), ".env.example must document DATA_FILE_PATH.");
assert(envExample.includes("PORT="), ".env.example must document platform PORT.");

console.log("Deployment configuration check passed.");
