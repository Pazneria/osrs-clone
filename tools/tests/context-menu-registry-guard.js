const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const inputRenderPath = path.join(root, "src/js/input-render.js");
  const inputTargetInteractionRuntimePath = path.join(root, "src/js/input-target-interaction-runtime.js");
  const contextMenuRuntimePath = path.join(root, "src/js/context-menu-runtime.js");
  const registryPath = path.join(root, "src/js/interactions/target-interaction-registry.js");
  const indexPath = path.join(root, "index.html");
  const legacyManifestPath = path.join(root, "src/game/platform/legacy-script-manifest.ts");

  const inputRenderScript = fs.readFileSync(inputRenderPath, "utf8");
  const inputTargetInteractionRuntimeScript = fs.readFileSync(inputTargetInteractionRuntimePath, "utf8");
  const contextMenuRuntimeScript = fs.readFileSync(contextMenuRuntimePath, "utf8");
  const registryScript = fs.readFileSync(registryPath, "utf8");
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const legacyManifest = fs.readFileSync(legacyManifestPath, "utf8");

  const contextMenuStart = inputRenderScript.indexOf("function onContextMenu(event)");
  const contextMenuEnd = inputRenderScript.indexOf("function emitPierDebug", contextMenuStart);
  assert(contextMenuStart !== -1, "input-render missing onContextMenu");
  assert(contextMenuEnd !== -1, "input-render missing context-menu boundary");

  const onContextMenuSection = inputRenderScript.slice(contextMenuStart, contextMenuEnd);

  assert(
    onContextMenuSection.includes("resolveSkillContextMenuOptions(hitData)"),
    "onContextMenu should resolve skill-owned context menu options first"
  );
  assert(
    onContextMenuSection.includes("resolveTargetInteractionOptions"),
    "onContextMenu should delegate world-target options through the target interaction runtime wrapper"
  );
  assert(
    inputTargetInteractionRuntimeScript.includes("targetInteractionRegistry") && inputTargetInteractionRuntimeScript.includes("registry.resolveOptions(hitData"),
    "input target interaction runtime should own the target registry call"
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
    onContextMenuSection.includes("clearContextMenuOptions();"),
    "onContextMenu should clear menu options through the context menu shell"
  );
  assert(
    contextMenuRuntimeScript.includes("window.ContextMenuRuntime"),
    "context menu runtime should expose the shared context menu shell"
  );
  assert(
    contextMenuRuntimeScript.includes("function addContextMenuOption"),
    "context menu runtime should own option DOM insertion"
  );
  assert(
    contextMenuRuntimeScript.includes("function closeContextMenu"),
    "context menu runtime should own close behavior"
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
  assert(
    legacyManifest.indexOf('id: "context-menu-runtime"') < legacyManifest.indexOf('id: "core"'),
    "legacy manifest should load context menu runtime before core.js"
  );

  console.log("Context menu registry guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
