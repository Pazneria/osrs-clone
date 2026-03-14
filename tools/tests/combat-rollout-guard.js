const fs = require("fs");
const path = require("path");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

const legacyManifest = read("src/game/platform/legacy-script-manifest.ts");
const mainSource = read("src/main.ts");
const coreSource = read("src/js/core.js");
const worldSource = read("src/js/world.js");
const inputRenderSource = read("src/js/input-render.js");
const combatSource = read("src/js/combat.js");
const targetRegistrySource = read("src/js/interactions/target-interaction-registry.js");
const examineCatalogSource = read("src/js/content/examine-catalog.js");
const packageJson = read("package.json");

assert.ok(
  mainSource.includes('exposeCombatBridge'),
  "main.ts should expose the combat bridge before loading legacy runtime"
);
assert.ok(
  legacyManifest.includes('../../js/combat.js?raw'),
  "legacy script manifest should load src/js/combat.js"
);
assert.ok(
  combatSource.includes("window.processCombatTick = processCombatTick;") &&
    combatSource.includes("window.updateCombatRenderers = updateCombatRenderers;"),
  "combat runtime should expose tick and render hooks"
);
assert.ok(
  targetRegistrySource.includes("ENEMY:"),
  "target interaction registry should provide ENEMY interactions"
);
assert.ok(
  examineCatalogSource.includes("EXAMINE_TEXT_BY_ENEMY_NAME"),
  "examine catalog should include enemy examine copy"
);
assert.ok(
  !worldSource.includes("COMBAT: DUMMY") &&
    !inputRenderSource.includes("COMBAT: DUMMY") &&
    !targetRegistrySource.includes("DUMMY:") &&
    !coreSource.includes("DUMMY: 10"),
  "placeholder dummy combat should be removed from active runtime files"
);
assert.ok(
  !packageJson.includes("tool:sim:combat"),
  "old combat simulator script should be removed from package.json"
);

console.log("Combat rollout guard passed.");
