const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approxEq(actual, expected, epsilon = 1e-9) {
  return Math.abs(actual - expected) <= epsilon;
}

function loadBrowserScript(root, relPath) {
  const abs = path.join(root, relPath);
  const code = fs.readFileSync(abs, "utf8");
  vm.runInThisContext(code, { filename: abs });
}

function run() {
  const root = path.resolve(__dirname, "..", "..");

  global.window = {};
  loadBrowserScript(root, "src/js/skills/specs.js");
  global.SkillSpecs = global.window.SkillSpecs;
  loadBrowserScript(root, "src/js/skills/spec-registry.js");
  global.SkillSpecRegistry = global.window.SkillSpecRegistry;
  loadBrowserScript(root, "src/js/skills/shared/action-resolution.js");
  global.SkillActionResolution = global.window.SkillActionResolution;

  assert(/^2026\.03\.m/.test(SkillSpecRegistry.getVersion()), "registry version mismatch");

  const wc = SkillSpecRegistry.getSkillSpec("woodcutting");
  assert(!!wc, "woodcutting spec missing");

  const wcChance = SkillSpecRegistry.computeGatherSuccessChance(1, 8, 18);
  assert(approxEq(wcChance, 9 / 27), "woodcutting chance formula mismatch");

  const wcInterval = SkillSpecRegistry.computeIntervalTicks(4, 1, 2);
  assert(wcInterval === 2, "woodcutting interval mismatch");

  const fishChance = SkillSpecRegistry.computeLinearCatchChance(10, 1, 0.28, 0.008, 0.62);
  assert(approxEq(fishChance, 0.352), "fishing catch formula mismatch");

  const cookSuccess = SkillSpecRegistry.computeSuccessChanceFromDifficulty(1, 4);
  assert(approxEq(cookSuccess, 1 / 5), "cooking success formula mismatch");

  const emberRuneOutput = SkillSpecRegistry.computeRuneOutputPerEssence(10, 0);
  assert(emberRuneOutput === 2, "runecrafting ember scaling mismatch");

  const comboRuneOutput = SkillSpecRegistry.computeRuneOutputPerEssence(50, 40);
  assert(comboRuneOutput === 2, "runecrafting combo scaling mismatch");

  const rc = SkillSpecRegistry.getSkillSpec("runecrafting");
  assert(!!rc && !!rc.recipeSet, "runecrafting recipe set missing");

  const recipes = rc.recipeSet;
  const comboIds = Object.keys(recipes).filter((id) => recipes[id] && recipes[id].requiresSecondaryRune);
  assert(comboIds.length === 12, "expected 12 combo routes (6 bidirectional pairs)");

  const outputs = new Set(comboIds.map((id) => recipes[id].outputItemId));
  ["steam_rune", "smoke_rune", "lava_rune", "mud_rune", "mist_rune", "dust_rune"].forEach((out) => {
    assert(outputs.has(out), `missing combo output ${out}`);
  });
  assert(!!rc.economy && !!rc.economy.valueTable, "runecrafting economy value table missing");
  assert(rc.economy.valueTable.ember_rune.buy === 10, "runecrafting ember value mismatch");
  assert(rc.economy.valueTable.water_rune.buy === 20, "runecrafting water value mismatch");
  assert(rc.economy.valueTable.steam_rune.buy === 160, "runecrafting combo value mismatch");
  assert(rc.economy.valueTable.small_pouch.buy === 500, "runecrafting pouch value mismatch");
  assert(!!rc.economy.merchantTable && !!rc.economy.merchantTable.combination_sage, "runecrafting merchant table missing");

  loadBrowserScript(root, "src/js/content/item-catalog.js");
  const itemDefs = window.ItemCatalog && window.ItemCatalog.ITEM_DEFS;
  assert(!!itemDefs, "item catalog missing");
  assert(itemDefs.ember_rune.value === 10, "item catalog ember value mismatch");
  assert(itemDefs.water_rune.value === 20, "item catalog water value mismatch");
  assert(itemDefs.earth_rune.value === 40, "item catalog earth value mismatch");
  assert(itemDefs.air_rune.value === 80, "item catalog air value mismatch");
  assert(itemDefs.steam_rune.value === 160, "item catalog combo value mismatch");
  assert(itemDefs.small_pouch.value === 500, "item catalog pouch value mismatch");

  const worldScript = fs.readFileSync(path.join(root, "src/js/world.js"), "utf8");
  assert(worldScript.includes("new THREE.BoxGeometry(3, 2.6, 3)"), "runecrafting altar click-box regression");
  assert(worldScript.includes("for (let by = placed.y - 1; by <= placed.y + 2; by++)"), "runecrafting altar collision footprint regression");

  const rcRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/runecrafting/index.js"), "utf8");
  assert(rcRuntimeScript.includes("function tryFillPouchFromInventory"), "runecrafting pouch fill handler missing");
  assert(rcRuntimeScript.includes("function tryEmptyPouchToInventory"), "runecrafting pouch empty handler missing");

  const weightedPick = SkillSpecRegistry.resolveWeighted([
    { id: "a", weight: 0 },
    { id: "b", weight: 5 },
    { id: "c", weight: 10 }
  ], () => 0.2);
  assert(weightedPick.id === "b", "weighted resolution mismatch");

  const mockContext = {
    currentTick: 100,
    random: () => 0,
    playerState: {},
    isTargetTile: (tileId) => tileId === 1,
    giveItemById: () => 1,
    addSkillXp: () => {},
    stopAction: () => {}
  };

  SkillActionResolution.startGatherSession(mockContext, "woodcutting", 3);
  const firstGather = SkillActionResolution.runGatherAttempt(mockContext, "woodcutting", {
    targetTileId: 1,
    successChance: 1,
    rewardItemId: "logs",
    xpPerSuccess: 25
  });
  assert(firstGather.status === "success", "gather attempt should succeed");

  const secondGather = SkillActionResolution.runGatherAttempt(mockContext, "woodcutting", {
    targetTileId: 1,
    successChance: 1,
    rewardItemId: "logs",
    xpPerSuccess: 25
  });
  assert(secondGather.status === "retry", "gather should wait for next tick");

  mockContext.currentTick = 103;
  const thirdGather = SkillActionResolution.runGatherAttempt(mockContext, "woodcutting", {
    targetTileId: 1,
    successChance: 1,
    rewardItemId: "logs",
    xpPerSuccess: 25
  });
  assert(thirdGather.status === "success", "gather should succeed at interval tick");

  console.log("Spec contract tests passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}



