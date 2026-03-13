const fs = require("fs");
const path = require("path");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

const bridgeSource = read("src/game/platform/ui-domain-bridge.ts");
const inventorySource = read("src/js/inventory.js");
const worldSource = read("src/js/world.js");
const coreSource = read("src/js/core.js");

assert.ok(
  bridgeSource.includes("window.UiDomainRuntime ="),
  "ui-domain bridge should expose window.UiDomainRuntime"
);
assert.ok(
  bridgeSource.includes("buildPlayerProfileSummaryViewModel"),
  "ui-domain bridge should expose profile view-model builders"
);

assert.ok(
  inventorySource.includes("getUiDomainRuntime"),
  "inventory.js should read from the UI domain bridge"
);
assert.ok(
  inventorySource.includes("runtime.depositInventoryItem"),
  "inventory.js should delegate bank deposits to the UI domain bridge"
);
assert.ok(
  inventorySource.includes("runtime.buyShopItem"),
  "inventory.js should delegate shop buy logic to the UI domain bridge"
);
assert.ok(
  inventorySource.includes("runtime.sellInventoryItem"),
  "inventory.js should delegate shop sell logic to the UI domain bridge"
);
assert.ok(
  inventorySource.includes("runtime.buildInventorySlotViewModels"),
  "inventory.js should render inventory from view models"
);
assert.ok(
  inventorySource.includes("runtime.buildSkillProgressViewModel"),
  "inventory.js should render skill HUD data from view models"
);

assert.ok(
  worldSource.includes("buildCombatStatsViewModel"),
  "world.js should source combat stat HUD data from the UI domain bridge"
);
assert.ok(
  coreSource.includes("buildPlayerProfileSummaryViewModel"),
  "core.js should source player profile flow copy from the UI domain bridge"
);

console.log("Inventory/HUD domain guard passed.");
