const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function extractBlock(source, startToken) {
  const start = source.indexOf(startToken);
  if (start === -1) throw new Error(`Failed to find block start: ${startToken}`);

  const openBrace = source.indexOf("{", start);
  if (openBrace === -1) throw new Error(`Failed to find opening brace for: ${startToken}`);

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openBrace; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    const prev = source[i - 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (inSingle) {
      if (ch === "'" && prev !== "\\") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && prev !== "\\") inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (ch === "`" && prev !== "\\") {
        inTemplate = false;
        continue;
      }
      if (ch !== "$" || next !== "{") continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inTemplate = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  throw new Error(`Failed to close block for: ${startToken}`);
}

function extractFunction(source, name) {
  return extractBlock(source, `function ${name}(`);
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
  inventorySource.includes("computeCookingBurnChance(cookingLevel, recipe.requiredLevel)"),
  "inventory.js should derive cooking burn chance from the shared registry helper when present"
);
assert.ok(
  inventorySource.includes("meta.push(`Burn chance: ${burnPercent}%`)"),
  "inventory.js should surface a cooking burn chance row in recipe details"
);

const tooltipSandbox = {
  result: null,
  calledWith: null
};
vm.runInNewContext(
  `
  let playerSkills = {};
  const window = { ITEM_DB: {} };
  const SKILL_PANEL_RECIPE_UNLOCK_TYPE = "recipe";
  ${extractFunction(inventorySource, "formatSkillPanelText")}
  ${extractFunction(inventorySource, "resolveSkillPanelItemName")}
  ${extractFunction(inventorySource, "formatSkillPanelItemAmount")}
  ${extractFunction(inventorySource, "buildSkillPanelRecipeDetails")}

  function runRecipeDetailsTest(options) {
    playerSkills = options.playerSkills || {};
    window.ITEM_DB = options.itemDb || {};
    if (options.skillSpecRegistry) window.SkillSpecRegistry = options.skillSpecRegistry;
    else delete window.SkillSpecRegistry;
    return buildSkillPanelRecipeDetails(options.skillName, options.unlockEntry);
  }

  globalThis.runRecipeDetailsTest = runRecipeDetailsTest;
  `,
  tooltipSandbox,
  { filename: "inventory-tooltip-extract.js" }
);

{
  const detail = tooltipSandbox.runRecipeDetailsTest({
    skillName: "cooking",
    playerSkills: { cooking: { level: 20 } },
    itemDb: {
      raw_trout: { name: "Raw Trout" },
      cooked_trout: { name: "Cooked Trout" },
      burnt_trout: { name: "Burnt Trout" }
    },
    skillSpecRegistry: {
      computeCookingBurnChance(level, requiredLevel) {
        tooltipSandbox.calledWith = { level, requiredLevel };
        return 0.1;
      }
    },
    unlockEntry: {
      unlockType: "recipe",
      recipe: {
        sourceItemId: "raw_trout",
        cookedItemId: "cooked_trout",
        burntItemId: "burnt_trout",
        requiredLevel: 10,
        xpPerSuccess: 70,
        sourceTarget: "FIRE"
      }
    }
  });

  assert.deepStrictEqual(
    tooltipSandbox.calledWith,
    { level: 20, requiredLevel: 10 },
    "cooking recipe details should ask the registry for burn chance using player and unlock levels"
  );
  assert.ok(detail && detail.meta.includes("Burn chance: 10%"), "cooking recipe details should include the shared-registry burn row");
}

{
  const detail = tooltipSandbox.runRecipeDetailsTest({
    skillName: "cooking",
    playerSkills: { cooking: { level: 31 } },
    itemDb: {
      raw_shrimp: { name: "Raw Shrimp" },
      cooked_shrimp: { name: "Cooked Shrimp" },
      burnt_shrimp: { name: "Burnt Shrimp" }
    },
    unlockEntry: {
      unlockType: "recipe",
      recipe: {
        sourceItemId: "raw_shrimp",
        cookedItemId: "cooked_shrimp",
        burntItemId: "burnt_shrimp",
        requiredLevel: 1,
        xpPerSuccess: 30,
        sourceTarget: "FIRE"
      }
    }
  });

  assert.ok(detail && detail.meta.includes("Burn chance: 0%"), "cooking recipe details should clamp the fallback burn row to zero at unlock plus thirty");
}

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
