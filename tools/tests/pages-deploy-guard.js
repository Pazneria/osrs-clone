const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const workflowPath = path.join(root, ".github", "workflows", "deploy-pages.yml");
  const copyScriptPath = path.join(root, "tools", "build", "copy-runtime-assets.js");

  const packageJson = JSON.parse(readRepoFile(root, "package.json"));
  const buildScript = packageJson && packageJson.scripts ? packageJson.scripts.build : "";
  assert(typeof buildScript === "string" && buildScript.includes("copy-runtime-assets.js"),
    "build script must copy runtime asset directories after vite build");

  assert(fs.existsSync(copyScriptPath), "copy-runtime-assets.js must exist");
  const copyScript = readRepoFile(root, "tools/build/copy-runtime-assets.js");
  assert(copyScript.includes('"assets/pixel"'), "copy-runtime-assets.js must copy assets/pixel");
  assert(copyScript.includes('"assets/models"'), "copy-runtime-assets.js must copy assets/models");

  assert(fs.existsSync(workflowPath), "deploy-pages workflow must exist");
  const workflow = readRepoFile(root, ".github/workflows/deploy-pages.yml");
  assert(/name:\s*Deploy Pages/.test(workflow), "deploy-pages workflow name mismatch");
  assert(/run:\s*npm run build/.test(workflow), "deploy-pages workflow must run npm run build");
  assert(/path:\s*dist/.test(workflow), "deploy-pages workflow must upload dist");
  assert(/actions\/deploy-pages@v4/.test(workflow), "deploy-pages workflow must deploy with actions/deploy-pages");

  console.log("Pages deploy guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
