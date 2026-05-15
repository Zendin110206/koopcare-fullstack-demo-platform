import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), "..");
const apiEntryPoint = path.join(repoRoot, "apps", "api", "dist", "index.js");
const webIndexPath = path.join(repoRoot, "apps", "web", "dist", "index.html");

if (!existsSync(apiEntryPoint) || !existsSync(webIndexPath)) {
  console.error("Public demo build output is missing. Run `npm run build` before `npm start`.");
  process.exit(1);
}

process.env.APP_ENV ??= "production";
process.env.SERVE_WEB_APP ??= "true";

await import(pathToFileURL(apiEntryPoint).href);
