const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const inputRenderPath = path.join(root, "src/js/input-render.js");
  const registryPath = path.join(root, "src/js/interactions/target-interaction-registry.js");
  const indexPath = path.join(root, "index.html");
  const legacyManifestPath = path.join(root, "src/game/platform/legacy-script-manifest.ts");

  const inputRenderScript = fs.readFileSync(inputRenderPath, "utf8");
  const registryScript = fs.readFileSync(registryPath, "utf8");
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const legacyManifest = fs.readFileSync(legacyManifestPath, "utf8");

  const contextMenuStart = inputRenderScript.indexOf("function onContextMenu(event)");
  const contextMenuEnd = inputRenderScript.indexOf("function addContextMenuOption", contextMenuStart);
  assert(contextMenuStart !== -1, "input-render missing onContextMenu");
  assert(contextMenuEnd !== -1, "input-render missing context-menu boundary");

  const onContextMenuSection = inputRenderScript.slice(contextMenuStart, contextMenuEnd);

  assert(
    onContextMenuSection.includes("resolveSkillContextMenuOptions(hitData)"),
    "onContextMenu should resolve skill-owned context menu options first"
  );
  assert(
    onContextMenuSection.includes("resolveTargetInteractionOptions"),
    "onContextMenu should delegate world-target options through registry resolver"
  );
  assert(
    !onContextMenuSection.includes("hitData.type === 'TREE'"),
    "onContextMenu should not hard-code TREE branch handling"
  );
  assert(
    !onContextMenuSection.includes("hitData.type === 'NPC'"),
    "onContextMenu should not hard-code NPC branch handling"
  );
  assert(
    !onContextMenuSection.includes("hitData.type === 'GROUND_ITEM'"),
    "onContextMenu should not hard-code GROUND_ITEM branch handling"
  );

  assert(
    registryScript.includes("TARGET_INTERACTION_SPECS"),
    "target interaction registry should define target specs"
  );
  assert(
    registryScript.includes("actions:") && registryScript.includes("examine:") && registryScript.includes("guards:"),
    "target interaction registry should keep actions/examine/guards contract"
  );
  assert(
    registryScript.includes("registerTargetInteractionSpec"),
    "target interaction registry should expose registration API"
  );

  assert(
    indexHtml.includes('/src/main.ts') && legacyManifest.includes("../../js/interactions/target-interaction-registry.js?raw"),
    "platform shell should load target interaction registry through the legacy manifest"
  );

  console.log("Context menu registry guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
