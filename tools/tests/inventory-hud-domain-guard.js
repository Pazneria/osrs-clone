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
const inputSource = read("src/js/input-render.js");
const indexSource = read("index.html");

assert.ok(
  bridgeSource.includes("window.UiDomainRuntime ="),
  "ui-domain bridge should expose window.UiDomainRuntime"
);
assert.ok(
  bridgeSource.includes("buildPlayerProfileSummaryViewModel"),
  "ui-domain bridge should expose profile view-model builders"
);
assert.ok(
  bridgeSource.includes("buildCombatStatusViewModel"),
  "ui-domain bridge should expose combat-status HUD builders"
);
assert.ok(
  bridgeSource.includes("buildCombatTabViewModel"),
  "ui-domain bridge should expose combat-tab HUD builders"
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
  inventorySource.includes("buildSkillTileTooltipHtml"),
  "inventory.js should build rich skill hover tooltips from shared progress data"
);
assert.ok(
  !inventorySource.includes("buildSkillPanelTierGroups"),
  "inventory.js should render skill popup unlocks as a flat scroll list instead of tier dropdowns"
);
assert.ok(
  inventorySource.includes("bindCombatStyleButtons"),
  "inventory.js should wire combat-style tab controls"
);
assert.ok(
  inventorySource.includes("buildItemTooltipHtml"),
  "inventory.js should build rich item hover tooltips"
);
assert.ok(
  inventorySource.includes("bindInventorySlotTooltip"),
  "inventory.js should bind inventory and equipment tooltip handlers"
);

assert.ok(
  worldSource.includes("buildCombatStatsViewModel"),
  "world.js should source combat stat HUD data from the UI domain bridge"
);
assert.ok(
  worldSource.includes("buildCombatTabViewModel"),
  "world.js should source combat-tab data from the UI domain bridge"
);
assert.ok(
  !worldSource.includes("buildCombatStatusViewModel"),
  "world.js should not render a combat status HUD"
);
assert.ok(
  !worldSource.includes("getCombatHudSnapshot"),
  "world.js should not read combat HUD snapshots after the HUD is removed"
);
assert.ok(
  !indexSource.includes("combat-status-panel"),
  "index.html should not mount a combat status panel"
);
assert.ok(
  indexSource.includes("inventory-hitpoints-bar-fill"),
  "index.html should mount the inventory hitpoints bar"
);
assert.ok(
  !indexSource.includes("skill-panel-level"),
  "index.html should remove the redundant clicked-skill level row"
);
assert.ok(
  !indexSource.includes("skill-panel-xp"),
  "index.html should remove the redundant clicked-skill xp row"
);
assert.ok(
  !indexSource.includes("skill-panel-next"),
  "index.html should remove the redundant clicked-skill next-level row"
);
assert.ok(
  !indexSource.includes("skill-panel-progress"),
  "index.html should remove the redundant clicked-skill progress bar"
);
assert.ok(
  !indexSource.includes("skill-panel-percent"),
  "index.html should remove the redundant clicked-skill percent label"
);
assert.ok(
  !indexSource.includes("skill-panel-focus"),
  "index.html should remove the redundant clicked-skill focus block"
);
assert.ok(
  !indexSource.includes("skill-panel-icon"),
  "index.html should remove the clicked-skill shorthand icon from the title"
);
assert.ok(
  indexSource.includes('id="skill-panel" class="hidden pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-[384px]'),
  "index.html should size the clicked-skill popup to the inventory shell"
);
assert.ok(
  !indexSource.includes("Unlock Timeline"),
  "index.html should remove the unlock timeline heading so the list can sit higher"
);
assert.ok(
  worldSource.includes("updateInventoryHitpointsHud"),
  "world.js should refresh the inventory hitpoints bar through updateStats"
);
assert.ok(
  indexSource.includes("tab-combat"),
  "index.html should mount a combat tab"
);
assert.ok(
  indexSource.includes("combat-level-value"),
  "index.html should mount combat-level output"
);
assert.ok(
  coreSource.includes("buildPlayerProfileSummaryViewModel"),
  "core.js should source player profile flow copy from the UI domain bridge"
);
assert.ok(
  inputSource.includes("if (typeof window.updateStats === 'function') window.updateStats();"),
  "tick loop should refresh the world stat HUD through updateStats"
);

console.log("Inventory/HUD domain guard passed.");
