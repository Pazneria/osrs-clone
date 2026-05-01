const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approxEq(actual, expected, epsilon = 1e-9) {
  return Math.abs(actual - expected) <= epsilon;
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!value || typeof value !== "object") return value;
  const out = {};
  const keys = Object.keys(value).sort();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    out[key] = sortKeysDeep(value[key]);
  }
  return out;
}

function loadBrowserScript(root, relPath) {
  const abs = path.join(root, relPath);
  const code = fs.readFileSync(abs, "utf8");
  vm.runInThisContext(code, { filename: abs });
}

function replaceOnce(source, from, to, label) {
  const next = source.replace(from, to);
  assert(next !== source, "test setup failed (" + label + ")");
  return next;
}

const STARTER_TOWN_NAMED_NPC_DIALOGUES = Object.freeze({
  "merchant:general_store": "shopkeeper",
  "merchant:starter_caravan_guide": "road_guide",
  "merchant:east_outpost_caravan_guide": "outpost_guide",
  "merchant:advanced_fletcher": "advanced_fletcher",
  "merchant:advanced_woodsman": "advanced_woodsman",
  "merchant:fishing_teacher": "fishing_teacher",
  "merchant:fishing_supplier": "fishing_supplier",
  "merchant:borin_ironvein": "borin_ironvein",
  "merchant:thrain_deepforge": "thrain_deepforge",
  "merchant:elira_gemhand": "elira_gemhand",
  "merchant:crafting_teacher": "crafting_teacher",
  "merchant:tanner_rusk": "tanner_rusk",
  "merchant:rune_tutor": "rune_tutor",
  "merchant:combination_sage": "combination_sage"
});


function expectMutatedSpecsFailure(root, mutate, expectedMessageRegex, label) {
  const abs = path.join(root, "src/js/skills/specs.js");
  const original = fs.readFileSync(abs, "utf8");
  const mutated = mutate(original);
  const sandbox = { window: {} };

  let failed = null;
  try {
    vm.runInNewContext(mutated, sandbox, { filename: abs });
  } catch (error) {
    failed = error;
  }

  assert(!!failed, label + ": expected mutated specs load to fail");
  if (expectedMessageRegex) {
    const msg = String(failed && failed.message ? failed.message : failed);
    assert(expectedMessageRegex.test(msg), label + ": unexpected error message: " + msg);
  }
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
  loadBrowserScript(root, "src/js/content/npc-dialogue-catalog.js");
  global.NpcDialogueCatalog = global.window.NpcDialogueCatalog;

  assert(/^2026\.03\.m/.test(SkillSpecRegistry.getVersion()), "registry version mismatch");

  const wc = SkillSpecRegistry.getSkillSpec("woodcutting");
  assert(!!wc, "woodcutting spec missing");

  const wcChance = SkillSpecRegistry.computeGatherSuccessChance(1, 8, 18);
  assert(approxEq(wcChance, 9 / 27), "woodcutting chance formula mismatch");

  const wcInterval = SkillSpecRegistry.computeIntervalTicks(4, 1, 2);
  assert(wcInterval === 2, "woodcutting interval mismatch");

  const fishChance = SkillSpecRegistry.computeLinearCatchChance(10, 1, 0.28, 0.008, 0.62);
  assert(approxEq(fishChance, 0.352), "fishing catch formula mismatch");

  const fishSpec = SkillSpecRegistry.getSkillSpec("fishing");
  assert(!!fishSpec && !!fishSpec.nodeTable, "fishing node table missing");
  assert(!!fishSpec.nodeTable.shallow_water, "shallow water spec missing");
  assert(!!fishSpec.nodeTable.deep_water, "deep water spec missing");
  assert(typeof SkillSpecRegistry.computeFishingMethodMetrics === "function", "fishing method metrics helper missing");
  assert(typeof SkillSpecRegistry.getFishingBalanceSummary === "function", "fishing balance summary helper missing");

  const rodMethod = fishSpec.nodeTable.shallow_water.methods && fishSpec.nodeTable.shallow_water.methods.rod;
  const harpoonMethod = fishSpec.nodeTable.shallow_water.methods && fishSpec.nodeTable.shallow_water.methods.harpoon;
  assert(!!rodMethod, "rod method spec missing");
  assert(!!harpoonMethod, "harpoon method spec missing");
  assert(Array.isArray(rodMethod.toolIds) && rodMethod.toolIds.includes("fishing_rod"), "rod tool requirement missing");
  assert(!!rodMethod.extraRequirement && rodMethod.extraRequirement.itemId === "bait", "rod bait requirement missing");
  assert(rodMethod.extraRequirement.consumeOn === "success", "rod bait consumption rule mismatch");
  assert(!Object.prototype.hasOwnProperty.call(rodMethod, "baseCatchChance"), "rod should inherit the default catch curve");
  assert(harpoonMethod.baseCatchChance === 0.32, "harpoon should override its catch base to 32%");

  const deepMixed = fishSpec.nodeTable.deep_water.methods && fishSpec.nodeTable.deep_water.methods.deep_harpoon_mixed;
  const deepRune = fishSpec.nodeTable.deep_water.methods && fishSpec.nodeTable.deep_water.methods.deep_rune_harpoon;
  assert(!!deepMixed && !!deepRune, "deep water method split missing");
  assert(deepMixed.baseCatchChance === 0.36, "deep mixed harpoon should override its catch base to 36%");
  assert(deepRune.baseCatchChance === 0.36, "deep rune harpoon should override its catch base to 36%");
  const mixedFish = deepMixed.fishByLevel && deepMixed.fishByLevel[0] ? deepMixed.fishByLevel[0].fish : [];
  assert(Array.isArray(mixedFish) && mixedFish.length === 2 && mixedFish[0].itemId === "raw_tuna" && mixedFish[0].weight === 70 && mixedFish[1].itemId === "raw_swordfish" && mixedFish[1].weight === 30, "mixed deep-water table mismatch");
  const runeFish = deepRune.fishByLevel && deepRune.fishByLevel[0] ? deepRune.fishByLevel[0].fish : [];
  assert(Array.isArray(runeFish) && runeFish.length === 1 && runeFish[0].itemId === "raw_swordfish", "rune deep-water table mismatch");
  const rodBand20 = rodMethod.fishByLevel && rodMethod.fishByLevel[1] ? rodMethod.fishByLevel[1].fish : [];
  const rodBand30 = rodMethod.fishByLevel && rodMethod.fishByLevel[2] ? rodMethod.fishByLevel[2].fish : [];
  assert(Array.isArray(rodBand20) && rodBand20.length === 2 && rodBand20[0].itemId === "raw_trout" && rodBand20[0].weight === 75 && rodBand20[1].itemId === "raw_salmon" && rodBand20[1].weight === 25, "rod level-20 fish weights mismatch");
  assert(Array.isArray(rodBand30) && rodBand30.length === 2 && rodBand30[0].itemId === "raw_trout" && rodBand30[0].weight === 60 && rodBand30[1].itemId === "raw_salmon" && rodBand30[1].weight === 40, "rod level-30 fish weights mismatch");

  const fishingBalanceSummary = SkillSpecRegistry.getFishingBalanceSummary();
  assert(!!fishingBalanceSummary && !!fishingBalanceSummary.assumptions, "fishing balance summary missing assumptions");
  assert(Array.isArray(fishingBalanceSummary.rows) && fishingBalanceSummary.rows.length === 5, "fishing balance summary row count mismatch");
  assert(fishingBalanceSummary.assumptions.level === 40, "fishing default benchmark level mismatch");
  assert(fishingBalanceSummary.rows[0].methodId === "net", "fishing balance summary should start with net");
  assert(fishingBalanceSummary.rows[4].methodId === "deep_rune_harpoon", "fishing balance summary should end with deep rune harpoon");

  const fishingBenchmarks = [
    { waterId: "shallow_water", methodId: "net", level: 1, fish: 0.28, xp: 5.6, gold: 0.28 },
    { waterId: "shallow_water", methodId: "rod", level: 10, fish: 0.28, xp: 14, gold: 1.96 },
    { waterId: "shallow_water", methodId: "rod", level: 20, fish: 0.36, xp: 19.8, gold: 2.7 },
    { waterId: "shallow_water", methodId: "rod", level: 30, fish: 0.44, xp: 25.52, gold: 3.432 },
    { waterId: "shallow_water", methodId: "harpoon", level: 30, fish: 0.32, xp: 25.6, gold: 3.52 },
    { waterId: "deep_water", methodId: "deep_harpoon_mixed", level: 40, fish: 0.36, xp: 30.96, gold: 4.5 },
    { waterId: "deep_water", methodId: "deep_rune_harpoon", level: 40, fish: 0.36, xp: 36, gold: 5.76 },
    { waterId: "shallow_water", methodId: "net", level: 40, fish: 0.592, xp: 11.84, gold: 0.592 },
    { waterId: "shallow_water", methodId: "rod", level: 40, fish: 0.52, xp: 30.16, gold: 4.056 },
    { waterId: "shallow_water", methodId: "harpoon", level: 40, fish: 0.4, xp: 32, gold: 4.4 }
  ];
  const fishingMetricsByKey = {};
  fishingBenchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeFishingMethodMetrics(benchmark.waterId, benchmark.methodId, { level: benchmark.level });
    assert(!!metrics, "fishing metrics missing for " + benchmark.methodId + "@" + benchmark.level);
    fishingMetricsByKey[benchmark.methodId + "@" + benchmark.level] = metrics;
    assert(approxEq(metrics.active.fishPerTick, benchmark.fish, 1e-4), "fishing expected fish/tick mismatch for " + benchmark.methodId + "@" + benchmark.level);
    assert(approxEq(metrics.active.xpPerTick, benchmark.xp, 1e-4), "fishing expected xp/tick mismatch for " + benchmark.methodId + "@" + benchmark.level);
    assert(approxEq(metrics.active.goldPerTick, benchmark.gold, 1e-4), "fishing expected gold/tick mismatch for " + benchmark.methodId + "@" + benchmark.level);
  });
  assert(approxEq(fishingMetricsByKey["rod@10"].catchChance, 0.28, 1e-9), "rod catch chance should start from the method unlock");
  assert(fishingMetricsByKey["rod@20"].active.xpPerTick > fishingMetricsByKey["rod@10"].active.xpPerTick, "rod 20 should beat rod 10 on gross xp");
  assert(fishingMetricsByKey["rod@20"].active.goldPerTick > fishingMetricsByKey["rod@10"].active.goldPerTick, "rod 20 should beat rod 10 on gross gold");
  assert(fishingMetricsByKey["rod@30"].active.xpPerTick > fishingMetricsByKey["rod@20"].active.xpPerTick, "rod 30 should beat rod 20 on gross xp");
  assert(fishingMetricsByKey["rod@30"].active.goldPerTick > fishingMetricsByKey["rod@20"].active.goldPerTick, "rod 30 should beat rod 20 on gross gold");
  assert(fishingMetricsByKey["harpoon@30"].active.xpPerTick > fishingMetricsByKey["rod@30"].active.xpPerTick, "harpoon 30 should beat rod 30 on gross xp");
  assert(fishingMetricsByKey["harpoon@30"].active.goldPerTick > fishingMetricsByKey["rod@30"].active.goldPerTick, "harpoon 30 should beat rod 30 on gross gold");
  assert(
    fishingMetricsByKey["deep_harpoon_mixed@40"].active.xpPerTick > fishingMetricsByKey["harpoon@40"].active.xpPerTick
      || fishingMetricsByKey["deep_harpoon_mixed@40"].active.goldPerTick > fishingMetricsByKey["harpoon@40"].active.goldPerTick,
    "deep mixed 40 should not lose to harpoon 40 on both metrics"
  );
  assert(fishingMetricsByKey["deep_rune_harpoon@40"].active.xpPerTick > fishingMetricsByKey["deep_harpoon_mixed@40"].active.xpPerTick, "deep rune 40 should beat deep mixed 40 on gross xp");
  assert(fishingMetricsByKey["deep_rune_harpoon@40"].active.goldPerTick > fishingMetricsByKey["deep_harpoon_mixed@40"].active.goldPerTick, "deep rune 40 should beat deep mixed 40 on gross gold");

  const difficultySuccess = SkillSpecRegistry.computeSuccessChanceFromDifficulty(1, 4);
  assert(approxEq(difficultySuccess, 1 / 5), "difficulty success formula mismatch");

  const cookingBurnAtUnlock = SkillSpecRegistry.computeCookingBurnChance(10, 10);
  assert(approxEq(cookingBurnAtUnlock, 0.33), "cooking burn chance at unlock mismatch");

  const cookingBurnAtPlus10 = SkillSpecRegistry.computeCookingBurnChance(20, 10);
  assert(approxEq(cookingBurnAtPlus10, 0.1), "cooking burn chance at +10 mismatch");

  const cookingBurnAtPlus20 = SkillSpecRegistry.computeCookingBurnChance(30, 10);
  assert(approxEq(cookingBurnAtPlus20, 0.05), "cooking burn chance at +20 mismatch");

  const cookingBurnAtPlus30 = SkillSpecRegistry.computeCookingBurnChance(40, 10);
  assert(approxEq(cookingBurnAtPlus30, 0), "cooking burn chance at +30 mismatch");

  const cookingBurnBelowUnlock = SkillSpecRegistry.computeCookingBurnChance(1, 10);
  assert(approxEq(cookingBurnBelowUnlock, 0.33), "cooking burn chance should clamp below unlock");

  const cookingBurnAboveCap = SkillSpecRegistry.computeCookingBurnChance(99, 1);
  assert(approxEq(cookingBurnAboveCap, 0), "cooking burn chance should clamp above +30");

  const cookingSuccessAtUnlock = SkillSpecRegistry.computeCookingSuccessChance(10, 10);
  assert(approxEq(cookingSuccessAtUnlock, 0.67), "cooking success chance at unlock mismatch");

  assert(typeof SkillSpecRegistry.computeCookingRecipeMetrics === "function", "cooking recipe metrics helper missing");
  assert(typeof SkillSpecRegistry.getCookingBalanceSummary === "function", "cooking balance summary helper missing");

  const cookingBalanceSummary = SkillSpecRegistry.getCookingBalanceSummary();
  assert(!!cookingBalanceSummary && !!cookingBalanceSummary.assumptions, "cooking balance summary missing assumptions");
  assert(Array.isArray(cookingBalanceSummary.rows) && cookingBalanceSummary.rows.length === 8, "cooking balance summary row count mismatch");
  assert(cookingBalanceSummary.assumptions.level === 40, "cooking default benchmark level mismatch");
  assert(cookingBalanceSummary.rows[0].recipeId === "raw_shrimp", "cooking balance summary should start with shrimp");
  assert(cookingBalanceSummary.rows[1].recipeId === "raw_chicken", "cooking balance summary should include chicken after shrimp");
  assert(cookingBalanceSummary.rows[3].recipeId === "raw_boar_meat", "cooking balance summary should include boar after trout");
  assert(cookingBalanceSummary.rows[5].recipeId === "raw_wolf_meat", "cooking balance summary should include wolf after salmon");
  assert(cookingBalanceSummary.rows[7].recipeId === "raw_swordfish", "cooking balance summary should end with swordfish");
  assert(cookingBalanceSummary.rows[1].breakEvenLevel === 5, "chicken break-even level mismatch");
  assert(cookingBalanceSummary.rows[3].breakEvenLevel === 15, "boar break-even level mismatch");
  assert(cookingBalanceSummary.rows[5].breakEvenLevel === 25, "wolf break-even level mismatch");
  assert(cookingBalanceSummary.rows[7].breakEvenLevel === 42, "swordfish break-even level mismatch");

  const cookingBenchmarks = [
    { recipeId: "raw_shrimp", level: 1, cooked: 0.67, xp: 20.1, gold: 1.34 },
    { recipeId: "raw_chicken", level: 5, cooked: 0.67, xp: 30.15, gold: 2.01 },
    { recipeId: "raw_trout", level: 10, cooked: 0.67, xp: 46.9, gold: -0.64 },
    { recipeId: "raw_boar_meat", level: 15, cooked: 0.67, xp: 53.6, gold: 3.69 },
    { recipeId: "raw_salmon", level: 20, cooked: 0.67, xp: 60.3, gold: -0.63 },
    { recipeId: "raw_wolf_meat", level: 25, cooked: 0.67, xp: 70.35, gold: 5.37 },
    { recipeId: "raw_tuna", level: 30, cooked: 0.67, xp: 80.4, gold: 0.05 },
    { recipeId: "raw_swordfish", level: 40, cooked: 0.67, xp: 93.8, gold: -0.93 },
    { recipeId: "raw_shrimp", level: 40, cooked: 1.0, xp: 30.0, gold: 2.0 },
    { recipeId: "raw_chicken", level: 40, cooked: 1.0, xp: 45.0, gold: 3.0 },
    { recipeId: "raw_trout", level: 40, cooked: 1.0, xp: 70.0, gold: 2.0 },
    { recipeId: "raw_boar_meat", level: 40, cooked: 0.9637, xp: 77.1, gold: 5.7462 },
    { recipeId: "raw_salmon", level: 40, cooked: 0.95, xp: 85.5, gold: 2.45 },
    { recipeId: "raw_wolf_meat", level: 40, cooked: 0.9363, xp: 98.3062, gold: 8.2988 },
    { recipeId: "raw_tuna", level: 40, cooked: 0.9, xp: 108.0, gold: 3.5 },
    { recipeId: "raw_swordfish", level: 40, cooked: 0.67, xp: 93.8, gold: -0.93 }
  ];
  const cookingMetricsByKey = {};
  cookingBenchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeCookingRecipeMetrics(benchmark.recipeId, { level: benchmark.level });
    const key = benchmark.recipeId + "@" + benchmark.level;
    assert(!!metrics, "cooking metrics missing for " + key);
    cookingMetricsByKey[key] = metrics;
    assert(approxEq(metrics.expected.cookedPerAction, benchmark.cooked, 1e-4), "cooking expected cooked/action mismatch for " + key);
    assert(approxEq(metrics.expected.xpPerAction, benchmark.xp, 1e-4), "cooking expected xp/action mismatch for " + key);
    assert(approxEq(metrics.expected.goldDeltaPerAction, benchmark.gold, 1e-4), "cooking expected gold delta/action mismatch for " + key);
  });
  assert(cookingMetricsByKey["raw_chicken@5"].expected.goldDeltaPerAction > cookingMetricsByKey["raw_shrimp@1"].expected.goldDeltaPerAction, "chicken unlock should beat shrimp unlock on gold delta");
  assert(cookingMetricsByKey["raw_boar_meat@15"].expected.xpPerAction > cookingMetricsByKey["raw_trout@10"].expected.xpPerAction, "boar unlock should beat trout unlock on xp");
  assert(cookingMetricsByKey["raw_wolf_meat@40"].expected.goldDeltaPerAction > cookingMetricsByKey["raw_boar_meat@40"].expected.goldDeltaPerAction, "wolf 40 should beat boar 40 on gold delta");
  assert(cookingMetricsByKey["raw_salmon@40"].expected.goldDeltaPerAction > cookingMetricsByKey["raw_trout@40"].expected.goldDeltaPerAction, "salmon 40 should beat trout 40 on gold delta");
  assert(cookingMetricsByKey["raw_tuna@40"].expected.xpPerAction > cookingMetricsByKey["raw_salmon@40"].expected.xpPerAction, "tuna 40 should beat salmon 40 on xp");
  assert(cookingMetricsByKey["raw_tuna@40"].expected.goldDeltaPerAction > cookingMetricsByKey["raw_salmon@40"].expected.goldDeltaPerAction, "tuna 40 should beat salmon 40 on gold delta");
  assert(cookingMetricsByKey["raw_swordfish@40"].expected.goldDeltaPerAction < 0, "swordfish 40 should remain negative gold inside the 1-40 cap");

  let previousCookingBurn = SkillSpecRegistry.computeCookingBurnChance(10, 10);
  for (let delta = 1; delta <= 30; delta++) {
    const nextCookingBurn = SkillSpecRegistry.computeCookingBurnChance(10 + delta, 10);
    assert(nextCookingBurn <= previousCookingBurn + 1e-9, "cooking burn curve should be monotonic");
    previousCookingBurn = nextCookingBurn;
  }

  assert(typeof SkillSpecRegistry.computeFiremakingRecipeMetrics === "function", "firemaking recipe metrics helper missing");
  assert(typeof SkillSpecRegistry.getFiremakingBalanceSummary === "function", "firemaking balance summary helper missing");

  const firemakingBalanceSummary = SkillSpecRegistry.getFiremakingBalanceSummary();
  assert(!!firemakingBalanceSummary && !!firemakingBalanceSummary.assumptions, "firemaking balance summary missing assumptions");
  assert(Array.isArray(firemakingBalanceSummary.rows) && firemakingBalanceSummary.rows.length === 5, "firemaking balance summary row count mismatch");
  assert(firemakingBalanceSummary.assumptions.level === 40, "firemaking default benchmark level mismatch");
  assert(firemakingBalanceSummary.assumptions.ignitionAttemptTicks === 1, "firemaking ignition attempt tick mismatch");
  assert(firemakingBalanceSummary.assumptions.cookingActionTicks === 1, "firemaking cooking action tick mismatch");
  assert(firemakingBalanceSummary.assumptions.woodcuttingBenchmark.level === 40, "firemaking woodcutting benchmark level mismatch");
  assert(firemakingBalanceSummary.assumptions.woodcuttingBenchmark.toolPower === 28, "firemaking woodcutting benchmark tool power mismatch");
  assert(firemakingBalanceSummary.assumptions.woodcuttingBenchmark.speedBonusTicks === 5, "firemaking woodcutting benchmark speed bonus mismatch");
  assert(firemakingBalanceSummary.rows[0].recipeId === "logs", "firemaking balance summary should start with logs");
  assert(firemakingBalanceSummary.rows[firemakingBalanceSummary.rows.length - 1].recipeId === "yew_logs", "firemaking balance summary should end with yew logs");

  const firemakingTierEntryBenchmarks = [
    { recipeId: "logs", level: 1, success: 0.0625, expectedTicks: 16, xpPerTick: 2.5, goldSinkPerTick: 0.125, cookingActionsPerFire: 90 },
    { recipeId: "oak_logs", level: 10, success: 0.2857, expectedTicks: 3.5, xpPerTick: 17.1429, goldSinkPerTick: 1.7143, cookingActionsPerFire: 90 },
    { recipeId: "willow_logs", level: 20, success: 0.3636, expectedTicks: 2.75, xpPerTick: 32.7273, goldSinkPerTick: 5.0909, cookingActionsPerFire: 90 },
    { recipeId: "maple_logs", level: 30, success: 0.375, expectedTicks: 2.6667, xpPerTick: 50.625, goldSinkPerTick: 12, cookingActionsPerFire: 90 },
    { recipeId: "yew_logs", level: 40, success: 0.381, expectedTicks: 2.625, xpPerTick: 76.1905, goldSinkPerTick: 27.4286, cookingActionsPerFire: 90 }
  ];
  let previousFiremakingTierXp = 0;
  let previousFiremakingTierGold = 0;
  firemakingTierEntryBenchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeFiremakingRecipeMetrics(benchmark.recipeId, { level: benchmark.level });
    assert(!!metrics, "firemaking metrics missing for " + benchmark.recipeId + "@" + benchmark.level);
    assert(metrics.requiredLevel === benchmark.level, "firemaking required level mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.successChance, benchmark.success, 1e-4), "firemaking success chance mismatch for " + benchmark.recipeId + "@" + benchmark.level);
    assert(approxEq(metrics.expectedTicksPerSuccess, benchmark.expectedTicks, 1e-4), "firemaking expected ticks mismatch for " + benchmark.recipeId + "@" + benchmark.level);
    assert(approxEq(metrics.burnRate.xpPerTick, benchmark.xpPerTick, 1e-4), "firemaking xp/tick mismatch for " + benchmark.recipeId + "@" + benchmark.level);
    assert(approxEq(metrics.burnRate.goldSinkPerTick, benchmark.goldSinkPerTick, 1e-4), "firemaking gold sink/tick mismatch for " + benchmark.recipeId + "@" + benchmark.level);
    assert(metrics.cookingSupport.actionsPerFire === benchmark.cookingActionsPerFire, "firemaking cooking-actions-per-fire mismatch for " + benchmark.recipeId + "@" + benchmark.level);
    assert(metrics.burnRate.xpPerTick > previousFiremakingTierXp, "firemaking tier-entry xp/tick should increase by tier");
    assert(metrics.burnRate.goldSinkPerTick > previousFiremakingTierGold, "firemaking tier-entry gold sink/tick should increase by tier");
    previousFiremakingTierXp = metrics.burnRate.xpPerTick;
    previousFiremakingTierGold = metrics.burnRate.goldSinkPerTick;
  });

  const firemakingLevel40Benchmarks = [
    { recipeId: "logs", nodeId: "normal_tree", success: 0.7273, expectedTicks: 1.375, xpPerTick: 29.0909, goldSinkPerTick: 1.4545, sustainedCoverageRatio: 0.0931 },
    { recipeId: "oak_logs", nodeId: "oak_tree", success: 0.6154, expectedTicks: 1.625, xpPerTick: 36.9231, goldSinkPerTick: 3.6923, sustainedCoverageRatio: 0.1028 },
    { recipeId: "willow_logs", nodeId: "willow_tree", success: 0.5333, expectedTicks: 1.875, xpPerTick: 48, goldSinkPerTick: 7.4667, sustainedCoverageRatio: 0.1175 },
    { recipeId: "maple_logs", nodeId: "maple_tree", success: 0.4444, expectedTicks: 2.25, xpPerTick: 60, goldSinkPerTick: 14.2222, sustainedCoverageRatio: 0.1506 },
    { recipeId: "yew_logs", nodeId: "yew_tree", success: 0.381, expectedTicks: 2.625, xpPerTick: 76.1905, goldSinkPerTick: 27.4286, sustainedCoverageRatio: 0.3306 }
  ];
  let previousFiremaking40Xp = 0;
  let previousFiremaking40Gold = 0;
  let previousFiremaking40Ticks = 0;
  let previousFiremakingCoverage = 0;
  firemakingLevel40Benchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeFiremakingRecipeMetrics(benchmark.recipeId, { level: 40 });
    assert(!!metrics, "firemaking level-40 metrics missing for " + benchmark.recipeId);
    assert(approxEq(metrics.successChance, benchmark.success, 1e-4), "firemaking level-40 success chance mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.expectedTicksPerSuccess, benchmark.expectedTicks, 1e-4), "firemaking level-40 expected ticks mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.burnRate.xpPerTick, benchmark.xpPerTick, 1e-4), "firemaking level-40 xp/tick mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.burnRate.goldSinkPerTick, benchmark.goldSinkPerTick, 1e-4), "firemaking level-40 gold sink/tick mismatch for " + benchmark.recipeId);
    assert(metrics.cookingSupport.actionsPerFire === 90, "firemaking level-40 cooking-actions-per-fire mismatch for " + benchmark.recipeId);
    assert(!!metrics.woodcuttingSupply, "firemaking woodcutting supply summary missing for " + benchmark.recipeId);
    assert(metrics.woodcuttingSupply.nodeId === benchmark.nodeId, "firemaking woodcutting node mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.woodcuttingSupply.sustainedCoverageRatio, benchmark.sustainedCoverageRatio, 1e-4), "firemaking sustained coverage mismatch for " + benchmark.recipeId);
    assert(metrics.burnRate.xpPerTick > previousFiremaking40Xp, "firemaking level-40 xp/tick should increase by tier");
    assert(metrics.burnRate.goldSinkPerTick > previousFiremaking40Gold, "firemaking level-40 gold sink/tick should increase by tier");
    assert(metrics.expectedTicksPerSuccess > previousFiremaking40Ticks, "firemaking level-40 expected ticks should increase by tier");
    assert(metrics.woodcuttingSupply.sustainedCoverageRatio > previousFiremakingCoverage, "firemaking same-log coverage should improve by tier at level 40");
    assert(metrics.woodcuttingSupply.sustainedCoverageRatio < 1, "firemaking should remain a net log sink against a single maxed same-log woodcutting lane");
    previousFiremaking40Xp = metrics.burnRate.xpPerTick;
    previousFiremaking40Gold = metrics.burnRate.goldSinkPerTick;
    previousFiremaking40Ticks = metrics.expectedTicksPerSuccess;
    previousFiremakingCoverage = metrics.woodcuttingSupply.sustainedCoverageRatio;
  });

  assert(typeof SkillSpecRegistry.computeFletchingRecipeMetrics === "function", "fletching recipe metrics helper missing");
  assert(typeof SkillSpecRegistry.getFletchingBalanceSummary === "function", "fletching balance summary helper missing");
  assert(typeof SkillSpecRegistry.computeCraftingRecipeMetrics === "function", "crafting recipe metrics helper missing");
  assert(typeof SkillSpecRegistry.getCraftingBalanceSummary === "function", "crafting balance summary helper missing");

  const fletchingBalanceSummary = SkillSpecRegistry.getFletchingBalanceSummary();
  assert(!!fletchingBalanceSummary && !!fletchingBalanceSummary.assumptions, "fletching balance summary missing assumptions");
  assert(Array.isArray(fletchingBalanceSummary.rows) && fletchingBalanceSummary.rows.length === 46, "fletching balance summary row count mismatch");
  assert(fletchingBalanceSummary.assumptions.actionTicks === 3, "fletching default action ticks mismatch");
  assert(fletchingBalanceSummary.rows[0].recipeId === "fletch_wooden_handle", "fletching balance summary should start with wooden handle");
  assert(fletchingBalanceSummary.rows[fletchingBalanceSummary.rows.length - 1].recipeId === "fletch_rune_arrows", "fletching balance summary should end with rune arrows");

  const fletchingBenchmarks = [
    { recipeId: "fletch_wooden_handle", level: 1, xp: 6, sell: 6, xpPerTick: 2, sellPerTick: 2 },
    { recipeId: "fletch_oak_handle", level: 10, xp: 9, sell: 12, xpPerTick: 3, sellPerTick: 4 },
    { recipeId: "fletch_willow_handle", level: 20, xp: 16, sell: 20, xpPerTick: 5.3333, sellPerTick: 6.6667 },
    { recipeId: "fletch_maple_handle", level: 30, xp: 24, sell: 32, xpPerTick: 8, sellPerTick: 10.6667 },
    { recipeId: "fletch_yew_handle", level: 40, xp: 36, sell: 50, xpPerTick: 12, sellPerTick: 16.6667 },
    { recipeId: "fletch_bronze_arrows", level: 1, xp: 2, sell: 8, xpPerTick: 0.6667, sellPerTick: 2.6667 },
    { recipeId: "fletch_iron_arrows", level: 5, xp: 3, sell: 12, xpPerTick: 1, sellPerTick: 4 },
    { recipeId: "fletch_steel_arrows", level: 12, xp: 5, sell: 20, xpPerTick: 1.6667, sellPerTick: 6.6667 },
    { recipeId: "fletch_mithril_arrows", level: 23, xp: 10, sell: 32, xpPerTick: 3.3333, sellPerTick: 10.6667 },
    { recipeId: "fletch_adamant_arrows", level: 34, xp: 15, sell: 50, xpPerTick: 5, sellPerTick: 16.6667 },
    { recipeId: "fletch_rune_arrows", level: 45, xp: 23, sell: 80, xpPerTick: 7.6667, sellPerTick: 26.6667 },
    { recipeId: "fletch_normal_longbow", level: 3, xp: 3, sell: 10, xpPerTick: 1, sellPerTick: 3.3333 },
    { recipeId: "fletch_oak_longbow", level: 12, xp: 5, sell: 20, xpPerTick: 1.6667, sellPerTick: 6.6667 },
    { recipeId: "fletch_willow_longbow", level: 22, xp: 8, sell: 36, xpPerTick: 2.6667, sellPerTick: 12 },
    { recipeId: "fletch_maple_longbow", level: 32, xp: 12, sell: 62, xpPerTick: 4, sellPerTick: 20.6667 },
    { recipeId: "fletch_yew_longbow", level: 42, xp: 18, sell: 100, xpPerTick: 6, sellPerTick: 33.3333 },
    { recipeId: "fletch_normal_shortbow", level: 5, xp: 4, sell: 12, xpPerTick: 1.3333, sellPerTick: 4 },
    { recipeId: "fletch_oak_shortbow", level: 14, xp: 6, sell: 22, xpPerTick: 2, sellPerTick: 7.3333 },
    { recipeId: "fletch_willow_shortbow", level: 24, xp: 11, sell: 40, xpPerTick: 3.6667, sellPerTick: 13.3333 },
    { recipeId: "fletch_maple_shortbow", level: 34, xp: 16, sell: 68, xpPerTick: 5.3333, sellPerTick: 22.6667 },
    { recipeId: "fletch_yew_shortbow", level: 44, xp: 24, sell: 110, xpPerTick: 8, sellPerTick: 36.6667 }
  ];
  const fletchingMetricsById = {};
  fletchingBenchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeFletchingRecipeMetrics(benchmark.recipeId);
    assert(!!metrics, "fletching metrics missing for " + benchmark.recipeId);
    fletchingMetricsById[benchmark.recipeId] = metrics;
    assert(metrics.requiredLevel === benchmark.level, "fletching required level mismatch for " + benchmark.recipeId);
    assert(metrics.throughput.xpPerAction === benchmark.xp, "fletching xp/action mismatch for " + benchmark.recipeId);
    assert(metrics.output.sellValuePerAction === benchmark.sell, "fletching sell/action mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.throughput.xpPerTick, benchmark.xpPerTick, 1e-4), "fletching xp/tick mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.throughput.sellValuePerTick, benchmark.sellPerTick, 1e-4), "fletching sell/tick mismatch for " + benchmark.recipeId);
  });
  assert(fletchingMetricsById["fletch_yew_handle"].throughput.sellValuePerTick > fletchingMetricsById["fletch_maple_handle"].throughput.sellValuePerTick, "yew handle should beat maple handle on sell/tick");
  assert(fletchingMetricsById["fletch_rune_arrows"].throughput.sellValuePerTick > fletchingMetricsById["fletch_adamant_arrows"].throughput.sellValuePerTick, "rune arrows should beat adamant arrows on sell/tick");
  assert(fletchingMetricsById["fletch_yew_shortbow"].throughput.xpPerTick > fletchingMetricsById["fletch_yew_longbow"].throughput.xpPerTick, "yew shortbow should beat yew longbow on xp/tick");
  assert(fletchingMetricsById["fletch_yew_shortbow"].throughput.sellValuePerTick > fletchingMetricsById["fletch_rune_arrows"].throughput.sellValuePerTick, "yew shortbow should remain the top sell/tick finished-bow lane");
  assert(fletchingMetricsById["fletch_rune_arrows"].output.itemId === "rune_arrows", "rune arrows output item mismatch");
  assert(fletchingMetricsById["fletch_rune_arrows"].output.amount === 1, "rune arrows output amount mismatch");
  assert(fletchingMetricsById["fletch_rune_arrows"].output.sellValuePerUnit === 80, "rune arrows sell/unit mismatch");
  assert(fletchingMetricsById["fletch_rune_arrows"].output.sellValuePerAction === fletchingMetricsById["fletch_rune_arrows"].output.sellValuePerUnit, "rune arrows sell/action should match the single-output recipe");
  const plainOakStaffMetrics = SkillSpecRegistry.computeFletchingRecipeMetrics("fletch_plain_staff_oak");
  assert(!!plainOakStaffMetrics, "plain oak staff metrics missing");
  assert(plainOakStaffMetrics.recipeFamily === "staff", "plain oak staff family mismatch");
  assert(plainOakStaffMetrics.requiredLevel === 11, "plain oak staff level mismatch");
  assert(plainOakStaffMetrics.output.itemId === "plain_staff_oak", "plain oak staff output item mismatch");
  assert(plainOakStaffMetrics.output.amount === 1, "plain oak staff should remain single-output");
  assert(plainOakStaffMetrics.output.sellValuePerUnit === 12, "plain oak staff sell/unit mismatch");
  assert(plainOakStaffMetrics.output.sellValuePerAction === fletchingMetricsById["fletch_oak_handle"].output.sellValuePerAction, "plain oak staff sell/action should match oak handle");
  assert(plainOakStaffMetrics.throughput.xpPerTick === 3, "plain oak staff xp/tick mismatch");
  assert(plainOakStaffMetrics.throughput.sellValuePerTick === 4, "plain oak staff sell/tick mismatch");
  const level11Rows = fletchingBalanceSummary.rows.filter((row) => row.requiredLevel === 11);
  assert(level11Rows.length === 2, "level-11 fletching summary rows should include oak staff and oak shafts");
  assert(level11Rows[0].recipeId === "fletch_plain_staff_oak" && level11Rows[1].recipeId === "fletch_oak_shafts", "level-11 fletching summary ordering mismatch");

  const craftingBalanceSummary = SkillSpecRegistry.getCraftingBalanceSummary();
  assert(!!craftingBalanceSummary && !!craftingBalanceSummary.assumptions, "crafting balance summary missing assumptions");
  assert(Array.isArray(craftingBalanceSummary.rows) && craftingBalanceSummary.rows.length === 56, "crafting balance summary row count mismatch");
  assert(craftingBalanceSummary.assumptions.actionTicks === 3, "crafting default action ticks mismatch");
  assert(craftingBalanceSummary.rows.some((row) => row.recipeId === "craft_soft_clay"), "crafting summary should include soft clay");
  assert(craftingBalanceSummary.rows.some((row) => row.recipeId === "craft_diamond_gold_tiara"), "crafting summary should include the diamond-gold tiara attachment");

  const craftingBenchmarks = [
    { recipeId: "craft_wooden_handle_strapped", level: 1, xp: 2, sell: 10, xpPerTick: 2, sellPerTick: 10 },
    { recipeId: "craft_oak_handle_strapped", level: 10, xp: 4, sell: 16, xpPerTick: 4, sellPerTick: 16 },
    { recipeId: "craft_willow_handle_strapped", level: 20, xp: 8, sell: 32, xpPerTick: 8, sellPerTick: 32 },
    { recipeId: "craft_maple_handle_strapped", level: 30, xp: 12, sell: 44, xpPerTick: 12, sellPerTick: 44 },
    { recipeId: "craft_yew_handle_strapped", level: 40, xp: 18, sell: 76, xpPerTick: 18, sellPerTick: 76 },
    { recipeId: "cut_ruby", level: 10, xp: 4, sell: 12, xpPerTick: 1.3333, sellPerTick: 4 },
    { recipeId: "cut_sapphire", level: 20, xp: 8, sell: 32, xpPerTick: 2.6667, sellPerTick: 10.6667 },
    { recipeId: "cut_emerald", level: 30, xp: 14, sell: 60, xpPerTick: 4.6667, sellPerTick: 20 },
    { recipeId: "cut_diamond", level: 40, xp: 22, sell: 100, xpPerTick: 7.3333, sellPerTick: 33.3333 },
    { recipeId: "craft_fire_staff", level: 10, xp: 4, sell: 24, xpPerTick: 1.3333, sellPerTick: 8 },
    { recipeId: "craft_water_staff", level: 20, xp: 8, sell: 52, xpPerTick: 2.6667, sellPerTick: 17.3333 },
    { recipeId: "craft_earth_staff", level: 30, xp: 14, sell: 92, xpPerTick: 4.6667, sellPerTick: 30.6667 },
    { recipeId: "craft_air_staff", level: 40, xp: 22, sell: 150, xpPerTick: 7.3333, sellPerTick: 50 },
    { recipeId: "craft_ruby_silver_ring", level: 10, xp: 4, sell: 32, xpPerTick: 1.3333, sellPerTick: 10.6667 },
    { recipeId: "craft_sapphire_silver_ring", level: 20, xp: 8, sell: 52, xpPerTick: 2.6667, sellPerTick: 17.3333 },
    { recipeId: "craft_ruby_gold_ring", level: 40, xp: 4, sell: 44, xpPerTick: 1.3333, sellPerTick: 14.6667 },
    { recipeId: "craft_sapphire_gold_ring", level: 40, xp: 8, sell: 64, xpPerTick: 2.6667, sellPerTick: 21.3333 },
    { recipeId: "craft_emerald_gold_ring", level: 40, xp: 14, sell: 92, xpPerTick: 4.6667, sellPerTick: 30.6667 },
    { recipeId: "craft_diamond_gold_ring", level: 40, xp: 22, sell: 132, xpPerTick: 7.3333, sellPerTick: 44 }
  ];
  const craftingMetricsById = {};
  craftingBenchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeCraftingRecipeMetrics(benchmark.recipeId);
    assert(!!metrics, "crafting metrics missing for " + benchmark.recipeId);
    craftingMetricsById[benchmark.recipeId] = metrics;
    assert(metrics.requiredLevel === benchmark.level, "crafting required level mismatch for " + benchmark.recipeId);
    assert(metrics.throughput.xpPerAction === benchmark.xp, "crafting xp/action mismatch for " + benchmark.recipeId);
    assert(metrics.output.sellValuePerAction === benchmark.sell, "crafting sell/action mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.throughput.xpPerTick, benchmark.xpPerTick, 1e-4), "crafting xp/tick mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.throughput.sellValuePerTick, benchmark.sellPerTick, 1e-4), "crafting sell/tick mismatch for " + benchmark.recipeId);
  });
  assert(craftingMetricsById["craft_yew_handle_strapped"].throughput.sellValuePerTick > craftingMetricsById["craft_maple_handle_strapped"].throughput.sellValuePerTick, "yew strapped handle should beat maple on sell/tick");
  assert(craftingMetricsById["cut_diamond"].throughput.sellValuePerTick > craftingMetricsById["cut_emerald"].throughput.sellValuePerTick, "diamond gem cutting should beat emerald on sell/tick");
  assert(craftingMetricsById["craft_air_staff"].throughput.sellValuePerTick > craftingMetricsById["craft_earth_staff"].throughput.sellValuePerTick, "air staff should beat earth staff on sell/tick");
  assert(craftingMetricsById["craft_diamond_gold_ring"].throughput.sellValuePerTick > craftingMetricsById["craft_emerald_gold_ring"].throughput.sellValuePerTick, "diamond gold jewelry should beat emerald gold jewelry on sell/tick");

  const craftingSpecForComposition = SkillSpecRegistry.getSkillSpec("crafting");
  const craftingValueTableForComposition = craftingSpecForComposition.economy.valueTable;
  const craftingCompositionRows = Object.keys(craftingSpecForComposition.recipeSet)
    .map((recipeId) => ({ recipeId, recipe: craftingSpecForComposition.recipeSet[recipeId] }))
    .filter((row) => row.recipe && (row.recipe.recipeFamily === "staff_attachment" || row.recipe.recipeFamily === "jewelry_gem_attachment"));
  craftingCompositionRows.forEach((row) => {
    const recipe = row.recipe;
    const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
    assert(inputs.length === 2, "crafting composition recipe should keep exactly two inputs: " + row.recipeId);
    const outputId = recipe.output && recipe.output.itemId;
    const expectedSell = craftingValueTableForComposition[inputs[0].itemId].sell + craftingValueTableForComposition[inputs[1].itemId].sell;
    assert(craftingValueTableForComposition[outputId].sell === expectedSell, "crafting sell composition mismatch for " + outputId);
  });

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
  assert(rc.economy.merchantTable.rune_tutor.strictBuys === true, "rune tutor should use strict buy coverage");
  assert(rc.economy.merchantTable.combination_sage.strictBuys === true, "combination sage should use strict buy coverage");
  assert(typeof SkillSpecRegistry.getRunecraftingEconomySummary === "function", "runecrafting economy summary helper missing");

  loadBrowserScript(root, "src/js/content/item-catalog.js");
  const itemDefs = window.ItemCatalog && window.ItemCatalog.ITEM_DEFS;
  assert(!!itemDefs, "item catalog missing");
  const runtimeMirrorPath = path.join(root, "content", "items", "runtime-item-catalog.json");
  assert(fs.existsSync(runtimeMirrorPath), "runtime item-catalog mirror missing");
  const runtimeMirror = JSON.parse(fs.readFileSync(runtimeMirrorPath, "utf8"));
  assert(!!runtimeMirror && !!runtimeMirror.itemDefs, "runtime item-catalog mirror missing itemDefs");
  const runtimeSorted = JSON.stringify(sortKeysDeep(itemDefs));
  const mirrorSorted = JSON.stringify(sortKeysDeep(runtimeMirror.itemDefs));
  assert(runtimeSorted === mirrorSorted, "runtime item-catalog mirror mismatch (run tool:items:sync)");
  assert(itemDefs.ember_rune.value === 10, "item catalog ember value mismatch");
  assert(itemDefs.water_rune.value === 20, "item catalog water value mismatch");
  assert(itemDefs.earth_rune.value === 40, "item catalog earth value mismatch");
  assert(itemDefs.air_rune.value === 80, "item catalog air value mismatch");
  assert(itemDefs.steam_rune.value === 160, "item catalog combo value mismatch");
  assert(itemDefs.small_pouch.value === 500, "item catalog pouch value mismatch");
  const runecraftingValueIds = ["rune_essence", "ember_rune", "water_rune", "earth_rune", "air_rune", "steam_rune", "smoke_rune", "lava_rune", "mud_rune", "mist_rune", "dust_rune", "small_pouch", "medium_pouch", "large_pouch"];
  const runecraftingSellValues = {
    rune_essence: 4,
    ember_rune: 4,
    water_rune: 8,
    earth_rune: 16,
    air_rune: 32,
    steam_rune: 64,
    smoke_rune: 64,
    lava_rune: 64,
    mud_rune: 64,
    mist_rune: 64,
    dust_rune: 64,
    small_pouch: 200,
    medium_pouch: 800,
    large_pouch: 3200
  };
  runecraftingValueIds.forEach((itemId) => {
    const specRow = rc.economy.valueTable[itemId];
    const item = itemDefs[itemId];
    assert(!!specRow && !!item, "missing runecrafting economy or item row for " + itemId);
    assert(specRow.buy === item.value, "runecrafting buy value mismatch for " + itemId);
    assert(specRow.sell === runecraftingSellValues[itemId], "runecrafting sell value mismatch for " + itemId);
  });
  assert(itemDefs.rune_sword_blade.value === 750, "item catalog rune sword blade value mismatch");
  assert(itemDefs.rune_arrowheads.value === 500, "item catalog rune arrowheads value mismatch");
  assert(itemDefs.rune_boots.value === 1000, "item catalog rune boots value mismatch");
  assert(itemDefs.rune_shield.value === 1375, "item catalog rune shield value mismatch");
  assert(itemDefs.rune_platebody.value === 2000, "item catalog rune platebody value mismatch");
  assert(itemDefs.bait.value === 2, "item catalog bait value mismatch");
  assert(itemDefs.fishing_rod.value === 45, "item catalog fishing rod missing");
  assert(itemDefs.harpoon.value === 110, "item catalog harpoon missing");
  assert(itemDefs.rune_harpoon.value === 2500, "item catalog rune harpoon missing");
  assert(itemDefs.raw_swordfish.value === 40, "item catalog swordfish missing");
  [
    "raw_chicken",
    "cooked_chicken",
    "burnt_chicken",
    "raw_boar_meat",
    "cooked_boar_meat",
    "burnt_boar_meat",
    "raw_trout",
    "cooked_trout",
    "burnt_trout",
    "raw_salmon",
    "cooked_salmon",
    "burnt_salmon",
    "raw_tuna",
    "cooked_tuna",
    "burnt_tuna",
    "raw_swordfish",
    "cooked_swordfish",
    "burnt_swordfish",
    "raw_wolf_meat",
    "cooked_wolf_meat",
    "burnt_wolf_meat"
  ].forEach((itemId) => {
    assert(itemDefs[itemId] && itemDefs[itemId].icon, `item catalog cooking item missing icon for ${itemId}`);
  });
  [
    ["cooked_chicken", "cooked_chicken"],
    ["burnt_chicken", "burnt_chicken"],
    ["cooked_boar_meat", "cooked_boar_meat"],
    ["burnt_boar_meat", "burnt_boar_meat"],
    ["cooked_wolf_meat", "cooked_wolf_meat"],
    ["burnt_wolf_meat", "burnt_wolf_meat"]
  ].forEach(([itemId, assetId]) => {
    assert(
      itemDefs[itemId].icon.kind === "pixel" && itemDefs[itemId].icon.assetId === assetId,
      `item catalog cooking icon asset mismatch for ${itemId}`
    );
  });
  const iconStatusPath = path.join(root, "content", "icon-status.json");
  assert(fs.existsSync(iconStatusPath), "icon-status report missing");
  const iconStatus = JSON.parse(fs.readFileSync(iconStatusPath, "utf8"));
  [
    ["raw_chicken", "raw_chicken", "todo", "bespoke"],
    ["cooked_chicken", "cooked_chicken", "done", "bespoke"],
    ["burnt_chicken", "burnt_chicken", "done", "bespoke"],
    ["raw_boar_meat", "raw_boar_meat", "todo", "bespoke"],
    ["cooked_boar_meat", "cooked_boar_meat", "done", "bespoke"],
    ["burnt_boar_meat", "burnt_boar_meat", "done", "bespoke"],
    ["raw_wolf_meat", "raw_wolf_meat", "todo", "bespoke"],
    ["cooked_wolf_meat", "cooked_wolf_meat", "done", "bespoke"],
    ["burnt_wolf_meat", "burnt_wolf_meat", "done", "bespoke"]
  ].forEach(([itemId, assetId, status, treatment]) => {
    const entry = iconStatus.items && iconStatus.items[itemId];
    assert(!!entry, `icon-status entry missing for ${itemId}`);
    assert(entry.assetId === assetId, `icon-status asset mismatch for ${itemId}`);
    assert(entry.status === status, `icon-status status mismatch for ${itemId}`);
    assert(entry.treatment === treatment, `icon-status treatment mismatch for ${itemId}`);
  });

  const session = {
    player: { merchantProgress: {} },
    progress: {
      inventory: [],
      bankItems: [],
      equipment: {},
      quests: {},
      playerSkills: {}
    }
  };
  global.window.GameSessionRuntime = {
    getSession: () => session
  };
  global.playerState = session.player;
  loadBrowserScript(root, "src/js/shop-economy.js");
  const shopEconomy = window.ShopEconomy;
  function buildOwnedItem(itemId) {
    const def = itemDefs[itemId];
    assert(!!def, `missing item def for ${itemId}`);
    return Object.assign({ id: itemId }, def);
  }

  function buildOwnedSlot(itemId, amount = 1) {
    return {
      itemData: buildOwnedItem(itemId),
      amount
    };
  }

  assert(!!shopEconomy, "shop economy API missing");
  assert(typeof shopEconomy.getMerchantSeedStockRows === "function", "shop economy seed-stock resolver missing");
  assert(typeof shopEconomy.hasFallbackStockPolicy === "function", "shop economy fallback-policy resolver missing");
  assert(typeof shopEconomy.hasStockPolicy === "function", "shop economy stock-policy validator missing");
  assert(typeof shopEconomy.getConfiguredMerchantIds === "function", "shop economy configured-merchant discovery API missing");
  assert(typeof shopEconomy.isKnownMerchantId === "function", "shop economy merchant-id lookup API missing");

  const configuredMerchantIds = shopEconomy.getConfiguredMerchantIds();
  assert(Array.isArray(configuredMerchantIds), "shop economy configured-merchant IDs should be an array");
  assert(configuredMerchantIds.includes("general_store"), "shop economy configured-merchant IDs should include general store");
  assert(configuredMerchantIds.includes("fishing_supplier"), "shop economy configured-merchant IDs should include fishing supplier");
  assert(configuredMerchantIds.includes("fishing_teacher"), "shop economy configured-merchant IDs should include fishing teacher");
  assert(configuredMerchantIds.includes("rune_tutor"), "shop economy configured-merchant IDs should include rune tutor");
  assert(configuredMerchantIds.includes("crafting_teacher"), "shop economy configured-merchant IDs should include crafting teacher");
  assert(shopEconomy.isKnownMerchantId("general_store"), "shop economy should recognize general_store merchant id");
  assert(shopEconomy.isKnownMerchantId("fishing_supplier"), "shop economy should recognize configured merchant ids");
  assert(!shopEconomy.isKnownMerchantId("unknown_merchant"), "shop economy should reject unknown merchant ids");

  const generalStoreSeedRows = shopEconomy.getMerchantSeedStockRows("general_store");
  const generalStoreSeedById = {};
  for (let i = 0; i < generalStoreSeedRows.length; i++) {
    const row = generalStoreSeedRows[i] || {};
    if (!row.itemId) continue;
    generalStoreSeedById[row.itemId] = row.stockAmount;
  }
  assert(generalStoreSeedById.iron_axe === 5, "general store fallback stock should include iron axe");
  assert(generalStoreSeedById.tinderbox === 10, "general store fallback stock should include tinderbox");
  assert(generalStoreSeedById.knife === 10, "general store fallback stock should include knife");
  assert(generalStoreSeedById.iron_pickaxe === 5, "general store fallback stock should include iron pickaxe");
  assert(shopEconomy.hasFallbackStockPolicy("general_store"), "general store should have fallback stock policy");
  assert(shopEconomy.hasStockPolicy("general_store"), "general store should pass stock-policy validation");
  assert(shopEconomy.hasStockPolicy("fishing_supplier"), "configured merchants should pass stock-policy validation");
  assert(!shopEconomy.hasStockPolicy("unknown_merchant"), "unknown merchants should fail stock-policy validation");

  assert(shopEconomy.resolveBuyPrice("raw_shrimp", "fishing_supplier") === 3, "fishing buy price mismatch");
  assert(shopEconomy.resolveSellPrice("raw_shrimp", "fishing_supplier") === 1, "fishing sell price mismatch");
  assert(shopEconomy.resolveSellPrice("cooked_shrimp", "fishing_supplier") === 3, "cooked fish sell value mismatch");
  assert(shopEconomy.resolveSellPrice("burnt_shrimp", "fishing_supplier") === 1, "burnt fish sell value mismatch");
  assert(shopEconomy.resolveSellPrice("cooked_shrimp", "general_store") === 4, "general-store fallback half-price mismatch");
  assert(shopEconomy.resolveSellPrice("burnt_shrimp", "general_store") === 0, "general-store burnt fallback mismatch");

  const cookedProgress = shopEconomy.recordMerchantPurchaseFromPlayer("cooked_shrimp", "fishing_supplier", 200);
  assert(cookedProgress.soldAfter === 200, "cooked-fish progress should still track sold counts");
  assert(!shopEconomy.canMerchantSellItem("raw_shrimp", "fishing_supplier"), "cooked-fish sales should not unlock raw fish stock");

  assert(!shopEconomy.canMerchantSellItem("raw_shrimp", "fishing_supplier"), "fish should be locked before threshold");
  const unlockA = shopEconomy.recordMerchantPurchaseFromPlayer("raw_shrimp", "fishing_supplier", 49);
  assert(!unlockA.unlocked, "fish should remain locked below threshold");
  const unlockB = shopEconomy.recordMerchantPurchaseFromPlayer("raw_shrimp", "fishing_supplier", 1);
  assert(unlockB.unlockedNow, "fish should unlock exactly at threshold");
  assert(shopEconomy.canMerchantSellItem("raw_shrimp", "fishing_supplier"), "fish should be sellable after unlock");

  const perMerchantLock = shopEconomy.canMerchantSellItem("raw_shrimp", "fishing_teacher");
  assert(!perMerchantLock, "unlock should remain merchant-specific");

  const woodSpec = SkillSpecRegistry.getSkillSpec("woodcutting");
  assert(!!woodSpec && !!woodSpec.economy && !!woodSpec.economy.valueTable && !!woodSpec.economy.merchantTable, "woodcutting economy tables missing");
  assert(!!woodSpec.nodeTable, "woodcutting node table missing");
  ["normal_tree", "oak_tree", "willow_tree", "maple_tree", "yew_tree"].forEach((nodeId) => {
    assert(!!woodSpec.nodeTable[nodeId], "woodcutting node missing " + nodeId);
  });

  assert(typeof SkillSpecRegistry.getWoodcuttingDemandSummary === "function", "woodcutting demand summary helper missing");
  const woodcuttingDemand = SkillSpecRegistry.getWoodcuttingDemandSummary();
  assert(!!woodcuttingDemand && Array.isArray(woodcuttingDemand.canonicalLogItemIds), "woodcutting demand summary missing canonical logs");
  assert(Array.isArray(woodcuttingDemand.rows), "woodcutting demand summary rows missing");
  assert(typeof SkillSpecRegistry.computeWoodcuttingNodeMetrics === "function", "woodcutting node metrics helper missing");
  assert(typeof SkillSpecRegistry.getWoodcuttingBalanceSummary === "function", "woodcutting balance summary helper missing");

  const canonicalLogs = ["logs", "oak_logs", "willow_logs", "maple_logs", "yew_logs"];
  assert(woodcuttingDemand.canonicalLogItemIds.length === canonicalLogs.length, "woodcutting canonical log count mismatch");
  canonicalLogs.forEach((logId, index) => {
    assert(woodcuttingDemand.canonicalLogItemIds[index] === logId, "woodcutting canonical log order mismatch for " + logId);
    const row = woodcuttingDemand.rows.find((entry) => entry && entry.logItemId === logId);
    assert(!!row, "woodcutting demand row missing for " + logId);
    assert(Array.isArray(row.nodeIds) && row.nodeIds.length >= 1, "woodcutting demand row missing node coverage for " + logId);
    assert(!!row.consumers && Array.isArray(row.consumers.fletching), "woodcutting demand row missing fletching consumers for " + logId);
    assert(row.consumers.fletching.length >= 1, "woodcutting demand row missing fletching recipes for " + logId);
  });

  const logsRow = woodcuttingDemand.rows.find((entry) => entry && entry.logItemId === "logs");
  assert(!!logsRow, "woodcutting demand row missing base logs");
  assert(Array.isArray(logsRow.consumers.firemaking) && logsRow.consumers.firemaking.includes("logs"), "firemaking logs consumer missing from demand summary");

  canonicalLogs.forEach((logId) => {
    const row = woodcuttingDemand.rows.find((entry) => entry && entry.logItemId === logId);
    assert(!!row, "woodcutting demand row missing firemaking coverage for " + logId);
    assert(Array.isArray(row.consumers.firemaking) && row.consumers.firemaking.includes(logId), "firemaking consumer missing from demand summary for " + logId);
  });

  const woodcuttingBalance = SkillSpecRegistry.getWoodcuttingBalanceSummary();
  assert(!!woodcuttingBalance && !!woodcuttingBalance.assumptions, "woodcutting balance summary missing assumptions");
  assert(Array.isArray(woodcuttingBalance.rows) && woodcuttingBalance.rows.length === canonicalLogs.length, "woodcutting balance summary row count mismatch");
  assert(woodcuttingBalance.assumptions.level === 40, "woodcutting default benchmark level mismatch");
  assert(woodcuttingBalance.assumptions.toolPower === 28, "woodcutting default benchmark tool power mismatch");
  assert(woodcuttingBalance.assumptions.speedBonusTicks === 5, "woodcutting default benchmark speed bonus mismatch");
  assert(woodcuttingBalance.rows[0].nodeId === "normal_tree", "woodcutting balance summary should be sorted by tier");
  assert(woodcuttingBalance.rows[woodcuttingBalance.rows.length - 1].nodeId === "yew_tree", "woodcutting balance summary should include top tier");

  const tierEntryBenchmarks = [
    { nodeId: "normal_tree", level: 1, toolPower: 6, speedBonusTicks: 1, activeLogs: 0.056, activeXp: 1.4, activeGold: 0.112, sustainedXp: 0.7973, sustainedGold: 0.0638 },
    { nodeId: "oak_tree", level: 10, toolPower: 10, speedBonusTicks: 2, activeLogs: 0.1042, activeXp: 3.9583, activeGold: 0.625, sustainedXp: 1.5833, sustainedGold: 0.25 },
    { nodeId: "willow_tree", level: 20, toolPower: 15, speedBonusTicks: 3, activeLogs: 0.1598, activeXp: 10.8676, activeGold: 2.2374, sustainedXp: 3.2918, sustainedGold: 0.6777 },
    { nodeId: "maple_tree", level: 30, toolPower: 21, speedBonusTicks: 4, activeLogs: 0.2525, activeXp: 25.2475, activeGold: 8.0792, sustainedXp: 5.8272, sustainedGold: 1.8647 },
    { nodeId: "yew_tree", level: 40, toolPower: 28, speedBonusTicks: 5, activeLogs: 0.5152, activeXp: 77.2727, activeGold: 37.0909, sustainedXp: 18.8889, sustainedGold: 9.0667 }
  ];
  let prevActiveXp = 0;
  let prevActiveGold = 0;
  let prevSustainedXp = 0;
  let prevSustainedGold = 0;
  tierEntryBenchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeWoodcuttingNodeMetrics(benchmark.nodeId, benchmark);
    assert(!!metrics, "woodcutting metrics missing for " + benchmark.nodeId);
    assert(approxEq(metrics.active.logsPerTick, benchmark.activeLogs, 1e-4), "woodcutting active logs/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.active.xpPerTick, benchmark.activeXp, 1e-4), "woodcutting active xp/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.active.goldPerTick, benchmark.activeGold, 1e-4), "woodcutting active gold/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.sustained.xpPerTick, benchmark.sustainedXp, 1e-4), "woodcutting sustained xp/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.sustained.goldPerTick, benchmark.sustainedGold, 1e-4), "woodcutting sustained gold/tick mismatch for " + benchmark.nodeId);
    assert(metrics.active.xpPerTick > prevActiveXp, "woodcutting active xp/tick should increase by tier at tier-entry benchmark");
    assert(metrics.active.goldPerTick > prevActiveGold, "woodcutting active gold/tick should increase by tier at tier-entry benchmark");
    assert(metrics.sustained.xpPerTick > prevSustainedXp, "woodcutting sustained xp/tick should increase by tier at tier-entry benchmark");
    assert(metrics.sustained.goldPerTick > prevSustainedGold, "woodcutting sustained gold/tick should increase by tier at tier-entry benchmark");
    prevActiveXp = metrics.active.xpPerTick;
    prevActiveGold = metrics.active.goldPerTick;
    prevSustainedXp = metrics.sustained.xpPerTick;
    prevSustainedGold = metrics.sustained.goldPerTick;
  });

  const miningSpec = SkillSpecRegistry.getSkillSpec("mining");
  assert(!!miningSpec && !!miningSpec.nodeTable, "mining node table missing");
  assert(!!miningSpec.economy && !!miningSpec.economy.valueTable, "mining value table missing");
  ["clay_rock", "copper_rock", "tin_rock", "rune_essence", "iron_rock", "coal_rock", "silver_rock", "sapphire_rock", "gold_rock", "emerald_rock"].forEach((nodeId) => {
    assert(!!miningSpec.nodeTable[nodeId], "mining node missing " + nodeId);
  });
  assert(typeof SkillSpecRegistry.computeExpectedDepletingYieldCount === "function", "mining expected-yield helper missing");
  assert(typeof SkillSpecRegistry.computeMiningNodeMetrics === "function", "mining node metrics helper missing");
  assert(typeof SkillSpecRegistry.getMiningBalanceSummary === "function", "mining balance summary helper missing");

  const miningBalance = SkillSpecRegistry.getMiningBalanceSummary();
  assert(!!miningBalance && !!miningBalance.assumptions, "mining balance summary missing assumptions");
  assert(Array.isArray(miningBalance.rows) && miningBalance.rows.length === 10, "mining balance summary row count mismatch");
  assert(miningBalance.assumptions.level === 40, "mining default benchmark level mismatch");
  assert(miningBalance.assumptions.toolPower === 28, "mining default benchmark tool power mismatch");
  assert(miningBalance.assumptions.speedBonusTicks === 5, "mining default benchmark speed bonus mismatch");
  assert(miningBalance.rows[0].nodeId === "clay_rock", "mining balance summary should start with clay");
  assert(miningBalance.rows[miningBalance.rows.length - 1].nodeId === "emerald_rock", "mining balance summary should end with emerald");

  const miningBenchmarks = [
    { nodeId: "clay_rock", level: 1, toolPower: 6, speedBonusTicks: 1, activeYields: 0.1077, activeXp: 0.8615, activeGold: 0.1077, sustainedXp: 0.56, sustainedGold: 0.07, expectedYields: 1 },
    { nodeId: "copper_rock", level: 1, toolPower: 6, speedBonusTicks: 1, activeYields: 0.0933, activeXp: 0.9333, activeGold: 0.28, sustainedXp: 0.5983, sustainedGold: 0.1795, expectedYields: 1 },
    { nodeId: "tin_rock", level: 1, toolPower: 6, speedBonusTicks: 1, activeYields: 0.0933, activeXp: 0.9333, activeGold: 0.28, sustainedXp: 0.5983, sustainedGold: 0.1795, expectedYields: 1 },
    { nodeId: "iron_rock", level: 10, toolPower: 10, speedBonusTicks: 2, activeYields: 0.1389, activeXp: 2.5, activeGold: 0.9722, sustainedXp: 1.4583, sustainedGold: 0.5671, expectedYields: 1.75 },
    { nodeId: "coal_rock", level: 20, toolPower: 15, speedBonusTicks: 3, activeYields: 0.1913, activeXp: 5.3552, activeGold: 2.2951, sustainedXp: 3.1769, sustainedGold: 1.3615, expectedYields: 3.3471 },
    { nodeId: "silver_rock", level: 30, toolPower: 21, speedBonusTicks: 4, activeYields: 0.2931, activeXp: 11.7241, activeGold: 5.2759, sustainedXp: 5.2237, sustainedGold: 2.3507, expectedYields: 3.533 },
    { nodeId: "sapphire_rock", level: 30, toolPower: 21, speedBonusTicks: 4, activeYields: 0.2742, activeXp: 14.2581, activeGold: 4.3871, sustainedXp: 5.5976, sustainedGold: 1.7223, expectedYields: 3.19 },
    { nodeId: "gold_rock", level: 40, toolPower: 28, speedBonusTicks: 5, activeYields: 0.5763, activeXp: 34.5763, activeGold: 16.1356, sustainedXp: 8.1536, sustainedGold: 3.805, expectedYields: 3.7344 },
    { nodeId: "emerald_rock", level: 40, toolPower: 28, speedBonusTicks: 5, activeYields: 0.5484, activeXp: 39.4839, activeGold: 16.4516, sustainedXp: 9.6435, sustainedGold: 4.0181, expectedYields: 3.19 },
    { nodeId: "rune_essence", level: 1, toolPower: 6, speedBonusTicks: 1, activeYields: 0.1077, activeXp: 0.2154, activeGold: 0.4308, sustainedXp: 0.2154, sustainedGold: 0.4308, expectedYields: null }
  ];
  miningBenchmarks.forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeMiningNodeMetrics(benchmark.nodeId, benchmark);
    assert(!!metrics, "mining metrics missing for " + benchmark.nodeId);
    assert(approxEq(metrics.active.yieldsPerTick, benchmark.activeYields, 1e-4), "mining active yields/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.active.xpPerTick, benchmark.activeXp, 1e-4), "mining active xp/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.active.goldPerTick, benchmark.activeGold, 1e-4), "mining active gold/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.sustained.xpPerTick, benchmark.sustainedXp, 1e-4), "mining sustained xp/tick mismatch for " + benchmark.nodeId);
    assert(approxEq(metrics.sustained.goldPerTick, benchmark.sustainedGold, 1e-4), "mining sustained gold/tick mismatch for " + benchmark.nodeId);
    if (benchmark.expectedYields === null) {
      assert(metrics.expectedYieldsPerNode === null, "persistent mining nodes should not report expected depletion yields");
    } else {
      assert(approxEq(metrics.expectedYieldsPerNode, benchmark.expectedYields, 1e-4), "mining expected yields/node mismatch for " + benchmark.nodeId);
    }
  });

  const clayMining = SkillSpecRegistry.computeMiningNodeMetrics("clay_rock", { level: 1, toolPower: 6, speedBonusTicks: 1 });
  const copperMining = SkillSpecRegistry.computeMiningNodeMetrics("copper_rock", { level: 1, toolPower: 6, speedBonusTicks: 1 });
  const tinMining = SkillSpecRegistry.computeMiningNodeMetrics("tin_rock", { level: 1, toolPower: 6, speedBonusTicks: 1 });
  const ironMining = SkillSpecRegistry.computeMiningNodeMetrics("iron_rock", { level: 10, toolPower: 10, speedBonusTicks: 2 });
  const coalMining = SkillSpecRegistry.computeMiningNodeMetrics("coal_rock", { level: 20, toolPower: 15, speedBonusTicks: 3 });
  const silverMining = SkillSpecRegistry.computeMiningNodeMetrics("silver_rock", { level: 30, toolPower: 21, speedBonusTicks: 4 });
  const sapphireMining = SkillSpecRegistry.computeMiningNodeMetrics("sapphire_rock", { level: 30, toolPower: 21, speedBonusTicks: 4 });
  const goldMining = SkillSpecRegistry.computeMiningNodeMetrics("gold_rock", { level: 40, toolPower: 28, speedBonusTicks: 5 });
  const emeraldMining = SkillSpecRegistry.computeMiningNodeMetrics("emerald_rock", { level: 40, toolPower: 28, speedBonusTicks: 5 });
  assert(copperMining.active.xpPerTick > clayMining.active.xpPerTick, "mining ore lane should improve from clay to copper");
  assert(ironMining.active.goldPerTick > copperMining.active.goldPerTick, "mining ore lane should improve from copper to iron");
  assert(coalMining.sustained.goldPerTick > ironMining.sustained.goldPerTick, "mining ore lane should improve from iron to coal");
  assert(silverMining.sustained.goldPerTick > coalMining.sustained.goldPerTick, "mining ore lane should improve from coal to silver");
  assert(goldMining.sustained.goldPerTick > silverMining.sustained.goldPerTick, "mining ore lane should improve from silver to gold");
  assert(approxEq(copperMining.active.xpPerTick, tinMining.active.xpPerTick, 1e-9), "copper and tin should remain mirrored starter nodes");
  assert(sapphireMining.active.xpPerTick > silverMining.active.xpPerTick, "sapphire should beat silver on active xp");
  assert(sapphireMining.sustained.xpPerTick > silverMining.sustained.xpPerTick, "sapphire should beat silver on sustained xp");
  assert(sapphireMining.sustained.goldPerTick > coalMining.sustained.goldPerTick, "sapphire should beat coal on sustained gold");
  assert(emeraldMining.active.xpPerTick > goldMining.active.xpPerTick, "emerald should beat gold on active xp");
  assert(emeraldMining.sustained.xpPerTick > goldMining.sustained.xpPerTick, "emerald should beat gold on sustained xp");
  assert(emeraldMining.sustained.goldPerTick > goldMining.sustained.goldPerTick, "emerald should beat gold on sustained gold");

  const miningValueIds = ["clay", "copper_ore", "tin_ore", "iron_ore", "coal", "silver_ore", "uncut_sapphire", "gold_ore", "uncut_emerald", "rune_essence", "uncut_ruby", "uncut_diamond", "mithril_ore", "adamant_ore", "rune_ore"];
  const miningSellValues = {
    clay: 1,
    copper_ore: 3,
    tin_ore: 3,
    iron_ore: 7,
    coal: 12,
    silver_ore: 18,
    uncut_sapphire: 16,
    gold_ore: 28,
    uncut_emerald: 30,
    rune_essence: 4,
    uncut_ruby: 6,
    uncut_diamond: 50,
    mithril_ore: 60,
    adamant_ore: 150,
    rune_ore: 600
  };
  miningValueIds.forEach((itemId) => {
    const specRow = miningSpec.economy.valueTable[itemId];
    const item = itemDefs[itemId];
    assert(!!specRow && !!item, "missing mining economy or item row for " + itemId);
    assert(specRow.buy === item.value, "mining buy value mismatch for " + itemId);
    assert(specRow.sell === miningSellValues[itemId], "mining sell value mismatch for " + itemId);
  });
  assert(miningSpec.economy.valueTable.bronze_pickaxe.buy === itemDefs.bronze_pickaxe.value, "mining bronze pickaxe buy value mismatch");
  assert(miningSpec.economy.valueTable.iron_pickaxe.buy === itemDefs.iron_pickaxe.value, "mining iron pickaxe buy value mismatch");
  assert(miningSpec.economy.valueTable.steel_pickaxe.buy === itemDefs.steel_pickaxe.value, "mining steel pickaxe buy value mismatch");
  assert(miningSpec.economy.valueTable.mithril_pickaxe.buy === itemDefs.mithril_pickaxe.value, "mining mithril pickaxe buy value mismatch");
  assert(miningSpec.economy.valueTable.adamant_pickaxe.buy === itemDefs.adamant_pickaxe.value, "mining adamant pickaxe buy value mismatch");
  assert(miningSpec.economy.valueTable.rune_pickaxe.buy === null, "mining rune pickaxe should not have shop buy price");
  assert(miningSpec.economy.valueTable.rune_pickaxe.sell === 2500, "mining rune pickaxe sell value mismatch");

  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "sourceItemId: 'yew_logs',",
      "sourceItemId: 'maple_logs',",
      "missing-yew-firemaking-consumer"
    ),
    /has no firemaking consumer recipes/i,
    "missing-yew-firemaking-consumer"
  );

  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "logItemId: 'yew_logs',",
      "logItemId: 'maple_logs',",
      "missing-yew-fletching-consumer"
    ),
    /has no fletching consumer recipes/i,
    "missing-yew-fletching-consumer"
  );

  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "sourceItemId: 'raw_shrimp',",
      "sourceItemId: 'logs',",
      "cooking-log-leak"
    ),
    /should not consume logs directly/i,
    "cooking-log-leak"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "baseCatchChance: 0.32,",
      "baseCatchChance: 0.2,",
      "fishing-balance-curve"
    ),
    /fishing balance curve mismatch/i,
    "fishing-balance-curve"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "xpPerSuccess: 140,",
      "xpPerSuccess: 135,",
      "cooking-balance-curve"
    ),
    /cooking balance curve mismatch/i,
    "cooking-balance-curve"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "xpPerSuccess: 200,",
      "xpPerSuccess: 190,",
      "firemaking-balance-curve"
    ),
    /firemaking balance curve mismatch/i,
    "firemaking-balance-curve"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "yew_shortbow: { buy: null, sell: 110 },",
      "yew_shortbow: { buy: null, sell: 90 },",
      "fletching-balance-curve"
    ),
    /fletching balance curve mismatch/i,
    "fletching-balance-curve"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "depletionChance: 0.1,",
      "depletionChance: 0.95,",
      "woodcutting-balance-curve"
    ),
    /woodcutting balance curve mismatch/i,
    "woodcutting-balance-curve"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "rewardItemId: 'uncut_emerald', minimumYields: 2, maximumYields: 4, depletionChance: 0.3, respawnTicks: 18",
      "rewardItemId: 'uncut_emerald', minimumYields: 2, maximumYields: 4, depletionChance: 0.3, respawnTicks: 48",
      "mining-balance-curve"
    ),
    /mining balance curve mismatch/i,
    "mining-balance-curve"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "rune_tutor: {\n                        strictBuys: true,",
      "rune_tutor: {",
      "runecrafting-strict-buys"
    ),
    /runecrafting economy parity mismatch/i,
    "runecrafting-strict-buys"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "pouchUnlocks: { small_pouch: 10, medium_pouch: 20, large_pouch: 30 }",
      "pouchUnlocks: { small_pouch: 10, medium_pouch: 20, large_pouch: 29 }",
      "runecrafting-pouch-unlock-mismatch"
    ),
    /runecrafting economy parity mismatch/i,
    "runecrafting-pouch-unlock-mismatch"
  );
  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "pouchUnlocks: { small_pouch: 10, medium_pouch: 20, large_pouch: 30 }",
      "pouchUnlocks: { small_pouch: 10, medium_pouch: 20, large_pouch: 30, giant_pouch: 40 }",
      "runecrafting-extra-pouch-unlock"
    ),
    /runecrafting economy parity mismatch/i,
    "runecrafting-extra-pouch-unlock"
  );
  assert(woodSpec.economy.valueTable.logs.buy === itemDefs.logs.value, "woodcutting logs buy value mismatch");
  assert(woodSpec.economy.valueTable.oak_logs.buy === itemDefs.oak_logs.value, "woodcutting oak logs buy value mismatch");
  assert(woodSpec.economy.valueTable.willow_logs.buy === itemDefs.willow_logs.value, "woodcutting willow logs buy value mismatch");
  assert(woodSpec.economy.valueTable.maple_logs.buy === itemDefs.maple_logs.value, "woodcutting maple logs buy value mismatch");
  assert(woodSpec.economy.valueTable.yew_logs.buy === itemDefs.yew_logs.value, "woodcutting yew logs buy value mismatch");
  assert(woodSpec.economy.valueTable.bronze_axe.buy === itemDefs.bronze_axe.value, "woodcutting bronze axe buy value mismatch");
  assert(woodSpec.economy.valueTable.iron_axe.buy === itemDefs.iron_axe.value, "woodcutting iron axe buy value mismatch");
  assert(woodSpec.economy.valueTable.steel_axe.buy === itemDefs.steel_axe.value, "woodcutting steel axe buy value mismatch");
  assert(woodSpec.economy.valueTable.mithril_axe.buy === itemDefs.mithril_axe.value, "woodcutting mithril axe buy value mismatch");
  assert(woodSpec.economy.valueTable.adamant_axe.buy === itemDefs.adamant_axe.value, "woodcutting adamant axe buy value mismatch");
  assert(woodSpec.economy.valueTable.rune_axe.buy === null, "woodcutting rune axe should not have shop buy price");
  assert(shopEconomy.canMerchantSellItem("bronze_axe", "forester_teacher"), "forester teacher should sell bronze axe");
  assert(!shopEconomy.canMerchantSellItem("rune_axe", "advanced_woodsman"), "advanced woodsman should not sell rune axe");
  assert(shopEconomy.canMerchantBuyItem("rune_axe", "advanced_woodsman"), "advanced woodsman should buy rune axe");
  assert(shopEconomy.resolveSellPrice("rune_axe", "advanced_woodsman") === 2500, "rune axe sell price mismatch at advanced woodsman");
  const fletchEconomySpec = SkillSpecRegistry.getSkillSpec("fletching");
  assert(!!fletchEconomySpec && !!fletchEconomySpec.economy && !!fletchEconomySpec.economy.valueTable && !!fletchEconomySpec.economy.merchantTable, "fletching economy tables missing");
  assert(typeof shopEconomy.hasMerchantConfig === "function", "shop economy hasMerchantConfig API missing");
  assert(shopEconomy.hasMerchantConfig("fletching_supplier"), "fletching supplier merchant config missing");
  assert(shopEconomy.hasMerchantConfig("advanced_fletcher"), "advanced fletcher merchant config missing");
  assert(shopEconomy.canMerchantSellItem("knife", "fletching_supplier"), "fletching supplier should sell knife");
  assert(shopEconomy.canMerchantSellItem("feathers_bundle", "fletching_supplier"), "fletching supplier should sell feathers bundle");
  assert(shopEconomy.canMerchantSellItem("bow_string", "fletching_supplier"), "fletching supplier should sell bow string");
  assert(!shopEconomy.canMerchantSellItem("yew_logs", "fletching_supplier"), "fletching supplier should not sell logs");
  assert(!shopEconomy.canMerchantBuyItem("yew_logs", "fletching_supplier"), "fletching supplier should not buy logs");
  assert(shopEconomy.resolveBuyPrice("knife", "fletching_supplier") === itemDefs.knife.value, "fletching supplier knife buy price mismatch");
  assert(shopEconomy.resolveSellPrice("knife", "fletching_supplier") === 2, "fletching supplier knife sell price mismatch");
  assert(fletchEconomySpec.economy.valueTable.plain_staff_oak.sell === 12, "fletching plain oak staff sell value mismatch");
  assert(shopEconomy.canMerchantBuyItem("yew_longbow", "advanced_fletcher"), "advanced fletcher should buy yew longbow");
  assert(shopEconomy.canMerchantBuyItem("plain_staff_oak", "advanced_fletcher"), "advanced fletcher should buy plain oak staff");
  assert(!shopEconomy.canMerchantSellItem("yew_longbow", "advanced_fletcher"), "advanced fletcher should not sell stock");
  assert(shopEconomy.resolveSellPrice("yew_longbow", "advanced_fletcher") === 100, "advanced fletcher yew longbow sell price mismatch");
  assert(shopEconomy.resolveSellPrice("plain_staff_oak", "advanced_fletcher") === fletchEconomySpec.economy.valueTable.plain_staff_oak.sell, "advanced fletcher plain staff sell price mismatch");
  const cookingSpec = SkillSpecRegistry.getSkillSpec("cooking");
  assert(!!cookingSpec && !!cookingSpec.economy, "cooking economy tables missing");
  assert(!!cookingSpec.economy.valueTable, "cooking value table missing");
  assert(!cookingSpec.economy.merchantTable, "cooking should not define merchant-stock ownership");
  const fishEconomy = fishSpec.economy;
  assert(!!fishEconomy && !!fishEconomy.valueTable && !!fishEconomy.merchantTable, "fishing economy tables missing");
  const alignedValueIds = ["small_net", "fishing_rod", "harpoon", "rune_harpoon", "bait", "raw_shrimp", "raw_trout", "raw_salmon", "raw_tuna", "raw_swordfish", "cooked_shrimp", "burnt_shrimp", "cooked_trout", "burnt_trout", "cooked_salmon", "burnt_salmon", "cooked_tuna", "burnt_tuna", "cooked_swordfish", "burnt_swordfish"];
  alignedValueIds.forEach((itemId) => {
    const specRow = fishEconomy.valueTable[itemId];
    const item = itemDefs[itemId];
    assert(!!specRow && !!item, `missing economy or item row for ${itemId}`);
    assert(specRow.buy === item.value, `buy value mismatch for ${itemId}`);
    assert(specRow.sell === Math.max(1, Math.floor(item.value * 0.4)), `sell value mismatch for ${itemId}`);
  });
  const cookingValueIds = ["raw_shrimp", "raw_trout", "raw_salmon", "raw_tuna", "raw_swordfish", "cooked_shrimp", "burnt_shrimp", "cooked_trout", "burnt_trout", "cooked_salmon", "burnt_salmon", "cooked_tuna", "burnt_tuna", "cooked_swordfish", "burnt_swordfish"];
  cookingValueIds.forEach((itemId) => {
    const cookingRow = cookingSpec.economy.valueTable[itemId];
    const fishingRow = fishEconomy.valueTable[itemId];
    assert(!!cookingRow && !!fishingRow, `missing cooking/fishing value row for ${itemId}`);
    assert(cookingRow.buy === fishingRow.buy, `cooking/fishing buy alignment mismatch for ${itemId}`);
    assert(cookingRow.sell === fishingRow.sell, `cooking/fishing sell alignment mismatch for ${itemId}`);
  });

  assert(shopEconomy.canMerchantSellItem("small_net", "fishing_supplier"), "supplier should sell small net by default");
  assert(shopEconomy.canMerchantSellItem("fishing_rod", "fishing_supplier"), "supplier should sell fishing rod by default");
  assert(shopEconomy.canMerchantSellItem("harpoon", "fishing_supplier"), "supplier should sell harpoon by default");
  assert(shopEconomy.canMerchantSellItem("bait", "fishing_supplier"), "supplier should sell bait by default");
  assert(shopEconomy.canMerchantBuyItem("cooked_shrimp", "fishing_supplier"), "supplier should buy cooked fish");
  assert(shopEconomy.canMerchantBuyItem("burnt_shrimp", "fishing_supplier"), "supplier should buy burnt fish");
  assert(!shopEconomy.canMerchantBuyItem("cooked_shrimp", "fishing_teacher"), "teacher should not buy cooked fish");
  assert(shopEconomy.canMerchantSellItem("small_net", "fishing_teacher"), "teacher should sell small net by default");
  assert(shopEconomy.canMerchantSellItem("fishing_rod", "fishing_teacher"), "teacher should sell fishing rod by default");
  assert(shopEconomy.canMerchantSellItem("bait", "fishing_teacher"), "teacher should sell bait by default");
  assert(!shopEconomy.canMerchantSellItem("harpoon", "fishing_teacher"), "teacher should not sell harpoon by default");
  assert(!shopEconomy.canMerchantBuyItem("harpoon", "fishing_teacher"), "teacher should not buy harpoon by default");
  assert(shopEconomy.canMerchantBuyItem("rune_harpoon", "fishing_teacher"), "teacher should buy rune harpoon for recovery flow");
  assert(!shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should not sell rune harpoon by default");
  const teacherSeedBeforeQuest = shopEconomy.getMerchantSeedStockRows("fishing_teacher");
  const teacherSeedBeforeQuestIds = teacherSeedBeforeQuest.map((row) => row.itemId).sort();
  assert(JSON.stringify(teacherSeedBeforeQuestIds) === JSON.stringify(["bait", "fishing_rod", "small_net"]), "teacher default stock should only include starter supplies before the quest");

  session.progress.quests.fishing_teacher_from_net_to_harpoon = { status: "completed" };
  assert(shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should sell rune harpoon after quest completion when the player has none");
  const teacherSeedAfterQuest = shopEconomy.getMerchantSeedStockRows("fishing_teacher");
  const runeHarpoonSeed = teacherSeedAfterQuest.find((row) => row && row.itemId === "rune_harpoon");
  assert(!!runeHarpoonSeed && runeHarpoonSeed.stockAmount === 1, "teacher rune harpoon replacement stock should seed exactly one copy");
  delete session.progress.quests.fishing_teacher_from_net_to_harpoon;

  let lastQuestRuntimeLookup = null;
  window.QuestRuntime = {
    isQuestCompleted(questId) {
      lastQuestRuntimeLookup = questId;
      return questId === "fishing_teacher_from_net_to_harpoon";
    }
  };
  assert(shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should consult QuestRuntime for conditional replacement stock");
  assert(lastQuestRuntimeLookup === "fishing_teacher_from_net_to_harpoon", "teacher conditional stock should normalize quest ids before consulting QuestRuntime");
  window.QuestRuntime = null;
  session.progress.quests.fishing_teacher_from_net_to_harpoon = { status: "completed" };

  session.progress.inventory = [buildOwnedSlot("rune_harpoon")];
  assert(!shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should stop selling rune harpoon while one is in inventory");
  session.progress.inventory = [];
  session.progress.equipment = { weapon: buildOwnedItem("rune_harpoon") };
  assert(!shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should stop selling rune harpoon while one is equipped");
  session.progress.equipment = {};
  session.progress.bankItems = [buildOwnedSlot("rune_harpoon")];
  assert(!shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should stop selling rune harpoon while one is banked");
  session.progress.bankItems = [];
  assert(shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should resume selling rune harpoon when the player no longer owns one");

  const smithSpec = SkillSpecRegistry.getSkillSpec("smithing");
  assert(!!smithSpec && !!smithSpec.recipeSet, "smithing recipe set missing");
  assert(!!smithSpec.timing && smithSpec.timing.actionTicks === 3, "smithing action tick mismatch");
  assert(!!smithSpec.recipeSet.smelt_bronze_bar, "smithing bronze smelt recipe missing");
  assert(!!smithSpec.recipeSet.forge_bronze_sword_blade, "smithing bronze blade recipe missing");
  assert(!!smithSpec.recipeSet.forge_rune_platebody, "smithing rune platebody recipe missing");
  assert(!!smithSpec.recipeSet.forge_gold_ring, "smithing gold jewelry recipe missing");
  assert(smithSpec.recipeSet.forge_silver_ring.requiredUnlockFlag === "ringMouldUnlocked", "smithing silver ring unlock flag mismatch");
  assert(smithSpec.recipeSet.forge_silver_amulet.requiredUnlockFlag === "amuletMouldUnlocked", "smithing silver amulet unlock flag mismatch");
  assert(smithSpec.recipeSet.forge_silver_tiara.requiredUnlockFlag === "tiaraMouldUnlocked", "smithing silver tiara unlock flag mismatch");
  assert(smithSpec.recipeSet.forge_bronze_sword_blade.stationType === "ANVIL", "smithing forge station mismatch");
  assert(smithSpec.recipeSet.smelt_bronze_bar.stationType === "FURNACE", "smithing smelt station mismatch");
  assert(!!itemDefs.hammer, "item catalog hammer missing");
  assert(!!itemDefs.bronze_bar && itemDefs.bronze_bar.value === 8, "item catalog bronze bar mismatch");
  assert(!!itemDefs.rune_platebody, "item catalog rune platebody missing");
  assert(!!itemDefs.bronze_sword_blade, "item catalog bronze sword blade missing");
  assert(!!itemDefs.gold_ring, "item catalog gold ring missing");
  const smithEconomy = smithSpec.economy;
  assert(!!smithEconomy && !!smithEconomy.valueTable && !!smithEconomy.merchantTable, "smithing economy tables missing");
  assert(!!smithEconomy.merchantTable.borin_ironvein, "borin smithing merchant config missing");
  assert(!!smithEconomy.merchantTable.thrain_deepforge, "thrain smithing merchant config missing");
  assert(shopEconomy.resolveBuyPrice("iron_ore", "borin_ironvein") === itemDefs.iron_ore.value, "borin iron ore buy price mismatch");
  assert(shopEconomy.resolveSellPrice("iron_ore", "borin_ironvein") === smithEconomy.valueTable.iron_ore.sell, "borin iron ore sell price mismatch");
  assert(shopEconomy.resolveSellPrice("mithril_ore", "borin_ironvein") === smithEconomy.valueTable.mithril_ore.sell, "borin mithril ore sell price mismatch");
  assert(shopEconomy.resolveBuyPrice("rune_ore", "thrain_deepforge") === itemDefs.rune_ore.value, "thrain rune ore buy price mismatch");
  assert(shopEconomy.resolveSellPrice("rune_ore", "thrain_deepforge") === smithEconomy.valueTable.rune_ore.sell, "thrain rune ore sell price mismatch");
  assert(shopEconomy.resolveSellPrice("adamant_ore", "thrain_deepforge") === smithEconomy.valueTable.adamant_ore.sell, "thrain adamant ore sell price mismatch");
  assert(shopEconomy.canMerchantSellItem("iron_ore", "borin_ironvein"), "borin should sell iron ore");
  assert(!shopEconomy.canMerchantSellItem("bronze_pickaxe", "borin_ironvein"), "borin should not sell bronze pickaxe");
  assert(!shopEconomy.canMerchantSellItem("rune_ore", "borin_ironvein"), "borin should not sell rune ore");
  assert(shopEconomy.canMerchantBuyItem("rune_ore", "thrain_deepforge"), "thrain should buy rune ore");
  assert(!shopEconomy.canMerchantSellItem("adamant_pickaxe", "thrain_deepforge"), "thrain should not sell adamant pickaxe");
  assert(!shopEconomy.canMerchantBuyItem("ring_mould", "thrain_deepforge"), "thrain should not buy ring mould");
  assert(typeof SkillSpecRegistry.computeSmithingRecipeMetrics === "function", "smithing recipe metrics helper missing");
  assert(typeof SkillSpecRegistry.getSmithingBalanceSummary === "function", "smithing balance summary helper missing");
  assert(SkillSpecRegistry.computeSmithingRecipeMetrics("missing_smithing_recipe") === null, "missing smithing recipes should return null metrics");
  const smithingBalanceSummary = SkillSpecRegistry.getSmithingBalanceSummary();
  assert(!!smithingBalanceSummary && !!smithingBalanceSummary.assumptions, "smithing balance summary missing assumptions");
  assert(Array.isArray(smithingBalanceSummary.rows) && smithingBalanceSummary.rows.length === Object.keys(smithSpec.recipeSet).length, "smithing balance summary row count mismatch");
  assert(smithingBalanceSummary.assumptions.actionTicks === 3, "smithing balance summary action tick mismatch");
  const smithingFamilyOrder = {
    smelting: 0,
    jewelry_base: 1,
    assembly_part: 2,
    ammunition: 3,
    armor: 4
  };
  for (let i = 1; i < smithingBalanceSummary.rows.length; i++) {
    const prev = smithingBalanceSummary.rows[i - 1];
    const curr = smithingBalanceSummary.rows[i];
    assert(prev.requiredLevel <= curr.requiredLevel, "smithing balance summary should stay sorted by required level");
    if (prev.requiredLevel !== curr.requiredLevel) continue;
    const prevFamily = Number.isFinite(smithingFamilyOrder[prev.recipeFamily]) ? smithingFamilyOrder[prev.recipeFamily] : Number.MAX_SAFE_INTEGER;
    const currFamily = Number.isFinite(smithingFamilyOrder[curr.recipeFamily]) ? smithingFamilyOrder[curr.recipeFamily] : Number.MAX_SAFE_INTEGER;
    assert(prevFamily <= currFamily, "smithing balance summary should stay sorted by recipe family within each level");
    if (prevFamily !== currFamily) continue;
    assert(prev.recipeId.localeCompare(curr.recipeId) <= 0, "smithing balance summary should stay alphabetized within each family bucket");
  }
  const smithingMetricsById = {};
  [
    { recipeId: "smelt_bronze_bar", outputSell: 8, inputSell: 6, delta: 2, xpPerTick: 2, outputSellPerTick: 2.6667, deltaPerTick: 0.6667 },
    { recipeId: "smelt_mithril_bar", outputSell: 64, inputSell: 108, delta: -44, xpPerTick: 6, outputSellPerTick: 21.3333, deltaPerTick: -14.6667 },
    { recipeId: "smelt_rune_bar", outputSell: 256, inputSell: 696, delta: -440, xpPerTick: 10.6667, outputSellPerTick: 85.3333, deltaPerTick: -146.6667 },
    { recipeId: "forge_rune_sword_blade", outputSell: 750, inputSell: 512, delta: 238, xpPerTick: 13.3333, outputSellPerTick: 250, deltaPerTick: 79.3333 },
    { recipeId: "forge_rune_arrowheads", outputSell: 500, inputSell: 256, delta: 244, xpPerTick: 6.6667, outputSellPerTick: 166.6667, deltaPerTick: 81.3333 },
    { recipeId: "forge_rune_platebody", outputSell: 2000, inputSell: 2304, delta: -304, xpPerTick: 60, outputSellPerTick: 666.6667, deltaPerTick: -101.3333 },
    { recipeId: "forge_silver_ring", outputSell: 40, inputSell: 45, delta: -5, xpPerTick: 4.6667, outputSellPerTick: 13.3333, deltaPerTick: -1.6667 },
    { recipeId: "forge_gold_ring", outputSell: 100, inputSell: 70, delta: 30, xpPerTick: 7.3333, outputSellPerTick: 33.3333, deltaPerTick: 10 }
  ].forEach((benchmark) => {
    const metrics = SkillSpecRegistry.computeSmithingRecipeMetrics(benchmark.recipeId);
    assert(!!metrics, "smithing metrics missing for " + benchmark.recipeId);
    smithingMetricsById[benchmark.recipeId] = metrics;
    assert(metrics.throughput.outputSellValuePerAction === benchmark.outputSell, "smithing output sell/action mismatch for " + benchmark.recipeId);
    assert(metrics.throughput.inputSellValuePerAction === benchmark.inputSell, "smithing input sell/action mismatch for " + benchmark.recipeId);
    assert(metrics.throughput.valueDeltaPerAction === benchmark.delta, "smithing value delta/action mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.throughput.xpPerTick, benchmark.xpPerTick, 1e-4), "smithing xp/tick mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.throughput.outputSellValuePerTick, benchmark.outputSellPerTick, 1e-4), "smithing output sell/tick mismatch for " + benchmark.recipeId);
    assert(approxEq(metrics.throughput.valueDeltaPerTick, benchmark.deltaPerTick, 1e-4), "smithing value delta/tick mismatch for " + benchmark.recipeId);
  });
  assert(smithingMetricsById.smelt_bronze_bar.recipeFamily === "smelting", "bronze bar recipe family mismatch");
  assert(smithingMetricsById.forge_gold_ring.recipeFamily === "jewelry_base", "gold ring recipe family mismatch");
  assert(smithingMetricsById.forge_rune_sword_blade.recipeFamily === "assembly_part", "rune sword blade recipe family mismatch");
  assert(smithingMetricsById.forge_rune_arrowheads.recipeFamily === "ammunition", "rune arrowheads recipe family mismatch");
  assert(smithingMetricsById.forge_rune_platebody.recipeFamily === "armor", "rune platebody recipe family mismatch");
  assert(smithingMetricsById.forge_gold_ring.throughput.valueDeltaPerAction > smithingMetricsById.forge_silver_ring.throughput.valueDeltaPerAction, "gold ring should beat silver ring on value delta");
  assert(smithingMetricsById.forge_rune_sword_blade.throughput.outputSellValuePerAction > smithingMetricsById.forge_rune_arrowheads.throughput.outputSellValuePerAction, "rune sword blade should stay above rune arrowheads on direct sell value");
  assert(smithingMetricsById.forge_rune_platebody.throughput.xpPerTick > smithingMetricsById.forge_rune_sword_blade.throughput.xpPerTick, "rune platebody should remain the top smithing xp/tick lane");
  const fletchSpec = SkillSpecRegistry.getSkillSpec("fletching");
  const craftingSpec = SkillSpecRegistry.getSkillSpec("crafting");
  assert(!!fletchSpec && !!fletchSpec.recipeSet, "fletching recipe set missing");
  assert(!!craftingSpec && !!craftingSpec.recipeSet, "crafting recipe set missing");
  const craftingEconomy = craftingSpec.economy;
  assert(!!craftingEconomy && !!craftingEconomy.valueTable && !!craftingEconomy.merchantTable, "crafting economy tables missing");
  assert(!!craftingEconomy.merchantTable.crafting_teacher, "crafting teacher merchant config missing");
  assert(!!craftingEconomy.merchantTable.tanner_rusk, "tanner merchant config missing");
  assert(!!craftingEconomy.merchantTable.elira_gemhand, "elira crafting merchant config missing");
  assert(shopEconomy.hasMerchantConfig("crafting_teacher"), "shop economy should include crafting_teacher merchant");
  assert(shopEconomy.hasMerchantConfig("tanner_rusk"), "shop economy should include tanner_rusk merchant");
  assert(shopEconomy.resolveBuyPrice("chisel", "crafting_teacher") === 4, "crafting teacher chisel buy price mismatch");
  assert(shopEconomy.resolveSellPrice("chisel", "crafting_teacher") === 1, "crafting teacher chisel sell price mismatch");
  assert(shopEconomy.canMerchantSellItem("thread", "crafting_teacher"), "crafting teacher should sell thread");
  assert(!shopEconomy.canMerchantSellItem("wolf_leather", "crafting_teacher"), "crafting teacher should not sell wolf leather");
  assert(shopEconomy.resolveBuyPrice("normal_leather", "tanner_rusk") === 8, "tanner normal leather buy price mismatch");
  assert(shopEconomy.resolveSellPrice("normal_leather", "tanner_rusk") === 2, "tanner normal leather sell price mismatch");
  assert(shopEconomy.resolveSellPrice("wooden_handle_strapped", "tanner_rusk") === 10, "tanner strapped-handle sell price mismatch");
  assert(!shopEconomy.canMerchantSellItem("wooden_handle_strapped", "tanner_rusk"), "tanner should not sell strapped handles");
  assert(shopEconomy.canMerchantBuyItem("wooden_handle_strapped", "tanner_rusk"), "tanner should buy strapped handles");
  assert(shopEconomy.resolveBuyPrice("silver_ore", "elira_gemhand") === 45, "elira silver ore buy price mismatch");
  assert(shopEconomy.resolveSellPrice("silver_ore", "elira_gemhand") === 18, "elira silver ore sell price mismatch");
  assert(shopEconomy.resolveSellPrice("uncut_sapphire", "elira_gemhand") === 16, "elira uncut sapphire sell price mismatch");
  assert(shopEconomy.resolveSellPrice("cut_diamond", "elira_gemhand") === 100, "elira cut diamond sell price mismatch");
  assert(shopEconomy.resolveSellPrice("ruby_gold_ring", "elira_gemhand") === 44, "elira ruby gold ring sell price mismatch");
  const craftingTeacherDiag = shopEconomy.getMerchantDiagnosticSummary("crafting_teacher");
  assert(Array.isArray(craftingTeacherDiag) && craftingTeacherDiag.length >= 3, "crafting teacher diagnostics should include stock rows");
  const teacherChiselRow = craftingTeacherDiag.find((row) => row.itemId === "chisel");
  assert(!!teacherChiselRow, "crafting teacher diagnostics missing chisel row");
  assert(teacherChiselRow.buyPrice === 4 && teacherChiselRow.sellPrice === 1, "crafting teacher diagnostics chisel price mismatch");
  const tannerDiag = shopEconomy.getMerchantDiagnosticSummary("tanner_rusk");
  const tannerBronzeSword = tannerDiag.find((row) => row.itemId === "bronze_sword");
  assert(!!tannerBronzeSword && tannerBronzeSword.sellPrice === 10, "tanner diagnostics bronze sword sell price mismatch");
  assert(shopEconomy.resolveSellPrice("ruby_gold_ring", "general_store") === Math.floor((itemDefs.ruby_gold_ring && itemDefs.ruby_gold_ring.value ? itemDefs.ruby_gold_ring.value : 0) * 0.5), "general store fallback should remain half-price floor");
  assert(shopEconomy.resolveBuyPrice("steam_rune", "combination_sage") === 160, "runecrafting combination buy price mismatch");
  assert(shopEconomy.resolveSellPrice("steam_rune", "combination_sage") === 64, "runecrafting combination sell price mismatch");
  assert(shopEconomy.canMerchantBuyItem("ember_rune", "rune_tutor"), "rune tutor should buy elemental runes");
  assert(!shopEconomy.canMerchantBuyItem("bronze_axe", "rune_tutor"), "rune tutor should reject unrelated items");
  assert(shopEconomy.resolveSellPrice("bronze_axe", "rune_tutor") === 0, "rune tutor unrelated item sell price should be blocked");
  assert(!shopEconomy.canMerchantBuyItem("cooked_shrimp", "combination_sage"), "combination sage should reject unrelated cooked goods");
  assert(shopEconomy.resolveSellPrice("cooked_shrimp", "combination_sage") === 0, "combination sage unrelated item sell price should be blocked");
  assert(!shopEconomy.canMerchantSellItem("small_pouch", "combination_sage"), "combination sage small pouch should stay locked below level 10");
  session.progress.playerSkills.runecrafting = { level: 10 };
  assert(shopEconomy.canMerchantSellItem("small_pouch", "combination_sage"), "combination sage should unlock small pouch at level 10");
  assert(!shopEconomy.canMerchantSellItem("medium_pouch", "combination_sage"), "combination sage medium pouch should stay locked below level 20");
  session.progress.playerSkills.runecrafting = { level: 20 };
  assert(shopEconomy.canMerchantSellItem("medium_pouch", "combination_sage"), "combination sage should unlock medium pouch at level 20");
  assert(!shopEconomy.canMerchantSellItem("large_pouch", "combination_sage"), "combination sage large pouch should stay locked below level 30");
  session.progress.playerSkills.runecrafting = { level: 30 };
  assert(shopEconomy.canMerchantSellItem("large_pouch", "combination_sage"), "combination sage should unlock large pouch at level 30");
  const runecraftingEconomySummary = SkillSpecRegistry.getRunecraftingEconomySummary();
  assert(!!runecraftingEconomySummary && Array.isArray(runecraftingEconomySummary.valueRows), "runecrafting economy summary rows missing");
  assert(Array.isArray(runecraftingEconomySummary.merchants) && runecraftingEconomySummary.merchants.length === 2, "runecrafting economy summary merchant coverage mismatch");
  const steamRuneSummaryRow = runecraftingEconomySummary.valueRows.find((row) => row && row.itemId === "steam_rune");
  assert(!!steamRuneSummaryRow, "runecrafting economy summary missing steam rune row");
  assert(steamRuneSummaryRow.buy === 160 && steamRuneSummaryRow.sell === 64, "runecrafting economy summary steam rune price mismatch");
  assert(steamRuneSummaryRow.itemValue === 160 && steamRuneSummaryRow.buyMatchesItemValue === true, "runecrafting economy summary steam rune item-value parity mismatch");
  const runeTutorSummary = runecraftingEconomySummary.merchants.find((row) => row && row.merchantId === "rune_tutor");
  assert(!!runeTutorSummary && runeTutorSummary.strictBuys === true, "runecrafting economy summary rune tutor strict-buy mismatch");
  const combinationSageSummary = runecraftingEconomySummary.merchants.find((row) => row && row.merchantId === "combination_sage");
  assert(!!combinationSageSummary && combinationSageSummary.strictBuys === true, "runecrafting economy summary combination sage strict-buy mismatch");
  const largePouchUnlockSummary = combinationSageSummary.pouchUnlocks.find((row) => row && row.itemId === "large_pouch");
  assert(!!largePouchUnlockSummary, "runecrafting economy summary missing large pouch unlock row");
  assert(largePouchUnlockSummary.unlockLevel === 30 && largePouchUnlockSummary.matchesPouchLevel === true, "runecrafting economy summary pouch unlock mismatch");
  session.progress.playerSkills = {};

  const fletchRows = Object.keys(fletchSpec.recipeSet).map((id) => ({ recipeId: id, recipe: fletchSpec.recipeSet[id] }));
  const smithRows = Object.keys(smithSpec.recipeSet).map((id) => ({ recipeId: id, recipe: smithSpec.recipeSet[id] }));
  const craftingRows = Object.keys(craftingSpec.recipeSet).map((id) => ({ recipeId: id, recipe: craftingSpec.recipeSet[id] }));

  const standardCraftingFamilies = new Set(["gem_cutting", "staff_attachment", "jewelry_gem_attachment", "mould_firing"]);
  const immediateCraftingFamilies = new Set(["strapped_handle", "tool_weapon_assembly", "soft_clay", "mould_imprint"]);

  craftingRows.forEach((row) => {
    const recipe = row.recipe;
    assert(!!recipe && typeof recipe === "object", "crafting recipe row must be an object: " + row.recipeId);
    assert(typeof recipe.recipeFamily === "string" && recipe.recipeFamily.length > 0, "crafting recipe missing recipeFamily: " + row.recipeId);
    assert(Number.isFinite(recipe.requiredLevel) && recipe.requiredLevel >= 1, "crafting recipe missing valid requiredLevel: " + row.recipeId);
    assert(Array.isArray(recipe.inputs) && recipe.inputs.length > 0, "crafting recipe missing inputs: " + row.recipeId);

    recipe.inputs.forEach((input, index) => {
      assert(!!input && typeof input.itemId === "string" && input.itemId.length > 0, `crafting input itemId missing at ${row.recipeId}[${index}]`);
      assert(Number.isFinite(input.amount) && input.amount >= 1, `crafting input amount invalid at ${row.recipeId}[${index}]`);
      assert(!!itemDefs[input.itemId], `crafting input item missing in catalog: ${input.itemId} (${row.recipeId})`);
    });

    assert(!!recipe.output && typeof recipe.output.itemId === "string" && recipe.output.itemId.length > 0, "crafting recipe missing output.itemId: " + row.recipeId);
    assert(Number.isFinite(recipe.output.amount) && recipe.output.amount >= 1, "crafting recipe missing valid output.amount: " + row.recipeId);
    assert(!!itemDefs[recipe.output.itemId], `crafting output item missing in catalog: ${recipe.output.itemId} (${row.recipeId})`);

    assert(Number.isFinite(recipe.xpPerAction) && recipe.xpPerAction >= 0, "crafting recipe missing valid xpPerAction: " + row.recipeId);
    assert(Number.isFinite(recipe.actionTicks) && recipe.actionTicks >= 1, "crafting recipe missing valid actionTicks: " + row.recipeId);

    if (Object.prototype.hasOwnProperty.call(recipe, "requiredToolIds")) {
      assert(Array.isArray(recipe.requiredToolIds), "crafting requiredToolIds must be array when provided: " + row.recipeId);
      recipe.requiredToolIds.forEach((toolId) => {
        assert(typeof toolId === "string" && toolId.length > 0, "crafting requiredToolIds entry must be string: " + row.recipeId);
        assert(!!itemDefs[toolId], `crafting required tool missing in catalog: ${toolId} (${row.recipeId})`);
      });
    }

    if (Object.prototype.hasOwnProperty.call(recipe, "stationType")) {
      assert(typeof recipe.stationType === "string" && recipe.stationType.length > 0, "crafting stationType must be non-empty string: " + row.recipeId);
    }

    if (immediateCraftingFamilies.has(recipe.recipeFamily)) {
      assert(recipe.actionTicks === 1, "immediate crafting family must use actionTicks=1: " + row.recipeId);
    }

    if (standardCraftingFamilies.has(recipe.recipeFamily)) {
      assert(recipe.actionTicks === 3, "standard crafting family must use actionTicks=3: " + row.recipeId);
    }
  });

  ["gem_cutting", "staff_attachment", "jewelry_gem_attachment", "soft_clay", "mould_imprint", "mould_firing"].forEach((family) => {
    const familyRows = craftingRows.filter((row) => row.recipe && row.recipe.recipeFamily === family);
    assert(familyRows.length > 0, "expected crafting data-model rows for family: " + family);
  });

  const smithArrowheadOutputIds = new Set(
    smithRows
      .map((row) => row.recipe && row.recipe.output ? row.recipe.output.itemId : null)
      .filter((itemId) => typeof itemId === "string" && /_arrowheads$/.test(itemId))
  );
  smithArrowheadOutputIds.forEach((itemId) => {
    const itemDef = itemDefs[itemId];
    assert(!!itemDef, `smithing arrowhead output missing in item catalog: ${itemId}`);
    assert(/ x15$/.test(itemDef.name), `smithing arrowhead bundle should advertise x15 output: ${itemId}`);
  });
  const finishedArrowRows = fletchRows.filter((row) => row.recipe && row.recipe.recipeFamily === "finished_arrows");
  assert(finishedArrowRows.length >= 6, "expected full finished-arrow fletching chain");
  finishedArrowRows.forEach((row) => {
    const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
    const arrowheadInput = inputs.find((input) => input && typeof input.itemId === "string" && /_arrowheads$/.test(input.itemId));
    assert(!!arrowheadInput, `fletching finished-arrow recipe missing arrowhead input: ${row.recipeId}`);
    assert(smithArrowheadOutputIds.has(arrowheadInput.itemId), `fletching arrowhead dependency missing in smithing outputs: ${arrowheadInput.itemId}`);
  });

  const fletchedHandleIds = new Set(
    fletchRows
      .filter((row) => row.recipe && row.recipe.recipeFamily === "handle")
      .map((row) => row.recipe.output && row.recipe.output.itemId)
      .filter((itemId) => typeof itemId === "string" && itemId.length > 0)
  );

  const strappedHandleRows = craftingRows.filter((row) => row.recipe && row.recipe.recipeFamily === "strapped_handle");
  assert(strappedHandleRows.length === 5, "expected 5 strapped-handle crafting recipes");
  const strappedHandleOutputIds = new Set();
  strappedHandleRows.forEach((row) => {
    const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
    const baseHandleInputs = inputs.filter((input) => input && typeof input.itemId === "string" && /_handle$/.test(input.itemId) && !/_handle_strapped$/.test(input.itemId));
    assert(baseHandleInputs.length === 1, "strapped-handle recipe must include exactly one base handle: " + row.recipeId);
    assert(fletchedHandleIds.has(baseHandleInputs[0].itemId), "strapped-handle base handle must come from fletching: " + row.recipeId);
    const leatherInputs = inputs.filter((input) => input && typeof input.itemId === "string" && /_leather$/.test(input.itemId));
    assert(leatherInputs.length === 1, "strapped-handle recipe must include exactly one leather input: " + row.recipeId);
    const outputId = row.recipe.output && row.recipe.output.itemId;
    assert(typeof outputId === "string" && /_handle_strapped$/.test(outputId), "strapped-handle recipe output mismatch: " + row.recipeId);
    assert(!!itemDefs[outputId], "strapped-handle output item missing in catalog: " + outputId);
    strappedHandleOutputIds.add(outputId);
  });

  ["normal_leather", "wolf_leather", "bear_leather"].forEach((itemId) => {
    assert(!!itemDefs[itemId], "leather item missing in catalog: " + itemId);
  });

  const assemblyRows = craftingRows.filter((row) => row.recipe && row.recipe.recipeFamily === "tool_weapon_assembly");
  assert(assemblyRows.length === 18, "expected 18 crafting assembly recipes (6 tiers x 3 outputs)");
  assemblyRows.forEach((row) => {
    const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
    const handleInputs = inputs.filter((input) => input && typeof input.itemId === "string" && /_handle_strapped$/.test(input.itemId));
    assert(handleInputs.length === 1, "crafting assembly must have exactly one strapped-handle input: " + row.recipeId);
    assert(strappedHandleOutputIds.has(handleInputs[0].itemId), "crafting assembly handle must come from crafting strapped-handle outputs: " + row.recipeId);
    inputs.forEach((input) => {
      const inputId = input && input.itemId;
      assert(typeof inputId === "string" && !/_logs$/.test(inputId) && inputId !== "logs", "crafting assembly should not accept log shortcuts: " + row.recipeId);
      assert(!!itemDefs[inputId], "crafting assembly input item missing in catalog: " + inputId);
    });
    const outputId = row.recipe.output && row.recipe.output.itemId;
    assert(!!itemDefs[outputId], "crafting assembly output item missing in catalog: " + outputId);
  });

  ["bronze_sword", "iron_sword", "steel_sword", "mithril_sword", "adamant_sword", "rune_sword", "bronze_pickaxe", "steel_pickaxe", "mithril_pickaxe", "adamant_pickaxe", "rune_pickaxe"].forEach((itemId) => {
    assert(!!itemDefs[itemId], `item catalog crafting output missing: ${itemId}`);
  });

  loadBrowserScript(root, "src/js/skills/fletching/index.js");
  loadBrowserScript(root, "src/js/skills/crafting/index.js");
  loadBrowserScript(root, "src/js/skills/runecrafting/index.js");
  loadBrowserScript(root, "src/js/skills/firemaking/index.js");
  loadBrowserScript(root, "src/js/skills/smithing/index.js");
  loadBrowserScript(root, "src/js/skills/mining/index.js");
  loadBrowserScript(root, "src/js/skills/fishing/index.js");
  const skillModules = window.SkillModules || {};
  assert(!!skillModules.fletching && typeof skillModules.fletching.onUseItem === "function", "fletching runtime module missing onUseItem");
  assert(!!skillModules.crafting && typeof skillModules.crafting.onUseItem === "function", "crafting runtime module missing onUseItem");
  assert(!!skillModules.runecrafting && typeof skillModules.runecrafting.onAnimate === "function", "runecrafting runtime module missing onAnimate");
  assert(!!skillModules.firemaking && typeof skillModules.firemaking.onUseItem === "function", "firemaking runtime module missing onUseItem");
  assert(!!skillModules.smithing && typeof skillModules.smithing.onAnimate === "function", "smithing runtime module missing onAnimate");
  assert(!!skillModules.mining && typeof skillModules.mining.onStart === "function", "mining runtime module missing onStart");
  assert(!!skillModules.fishing && typeof skillModules.fishing.onAnimate === "function", "fishing runtime module missing onAnimate");

  function makeInventoryContext(sourceItemId, targetItemId, counts, messages, startedPayloads) {
    const inventoryCounts = Object.assign({}, counts);
    return {
      targetObj: "INVENTORY",
      playerState: { x: 0, y: 0, z: 0 },
      sourceItemId,
      targetUid: { sourceItemId, targetItemId },
      getRecipeSet: (skillId) => SkillSpecRegistry.getRecipeSet(skillId),
      getInventoryCount: (itemId) => (inventoryCounts[itemId] || 0),
      removeItemsById: (itemId, amount) => {
        const available = inventoryCounts[itemId] || 0;
        const remove = Math.min(available, amount);
        inventoryCounts[itemId] = available - remove;
        return remove;
      },
      giveItemById: (itemId, amount) => {
        inventoryCounts[itemId] = (inventoryCounts[itemId] || 0) + amount;
        return amount;
      },
      canAcceptItemById: () => true,
      getItemDataById: (itemId) => itemDefs[itemId] || null,
      requireSkillLevel: () => true,
      addSkillXp: () => {},
      renderInventory: () => {},
      haltMovement: () => {},
      startSkillById: (_skillId, payload) => {
        startedPayloads.push(payload);
        return true;
      },
      addChatMessage: (message, tone) => messages.push({ message, tone }),
      _counts: inventoryCounts,
      _startedPayloads: startedPayloads
    };
  }

  const originalSkillRuntime = window.SkillRuntime;
  const startedPayloads = [];
  window.SkillRuntime = {
    tryStartSkillById: (_skillId, payload) => {
      startedPayloads.push(payload);
      return true;
    }
  };

  const fletchMessagesA = [];
  const fletchCtxA = makeInventoryContext("bronze_arrowheads", "wooden_headless_arrows", { bronze_arrowheads: 1, wooden_headless_arrows: 1 }, fletchMessagesA, startedPayloads);
  const usedA = skillModules.fletching.onUseItem(fletchCtxA);
  assert(usedA, "matching arrowhead+headless pair should be handled by fletching");
  assert(startedPayloads.some((payload) => payload && payload.recipeId === "fletch_bronze_arrows"), "matching arrow pair should queue bronze arrow fletching recipe");

  const fletchMessagesMismatch = [];
  const fletchCtxMismatch = makeInventoryContext("bronze_arrowheads", "oak_headless_arrows", { bronze_arrowheads: 1, oak_headless_arrows: 1 }, fletchMessagesMismatch, startedPayloads);
  const usedMismatch = skillModules.fletching.onUseItem(fletchCtxMismatch);
  assert(usedMismatch, "mismatched arrowhead+headless pair should still be recognized");
  assert(fletchMessagesMismatch.some((entry) => entry.message === "These don't match."), "fletching mismatch message should be preserved for non-matching tiers");

  canonicalLogs.forEach((logItemId) => {
    const firemakingMessages = [];
    const firemakingCtx = makeInventoryContext("tinderbox", logItemId, { tinderbox: 1, [logItemId]: 1 }, firemakingMessages, startedPayloads);
    const startedBefore = startedPayloads.length;
    const handled = skillModules.firemaking.onUseItem(firemakingCtx);
    assert(handled, "firemaking should handle tinderbox+" + logItemId + " inventory use");
    assert(startedPayloads.length === startedBefore + 1, "firemaking should queue exactly one start payload for " + logItemId);
    const payload = startedPayloads[startedPayloads.length - 1];
    assert(payload && payload.sourceItemId === logItemId, "firemaking should preserve selected log tier for " + logItemId);
    assert(payload && payload.targetObj === "GROUND", "firemaking should continue to target the ground when starting from inventory use");
  });

  const craftMessagesStrapped = [];
  const craftingCtxStrapped = makeInventoryContext("wooden_handle", "normal_leather", { wooden_handle: 1, normal_leather: 1 }, craftMessagesStrapped, startedPayloads);
  const strappedHandled = skillModules.crafting.onUseItem(craftingCtxStrapped);
  assert(strappedHandled, "crafting should handle valid handle+leather strapped-handle recipe");
  assert((craftingCtxStrapped._counts.wooden_handle_strapped || 0) === 1, "crafting should produce strapped handle output");
  assert((craftingCtxStrapped._counts.wooden_handle || 0) === 0, "crafting should consume base handle input");
  assert((craftingCtxStrapped._counts.normal_leather || 0) === 0, "crafting should consume leather input");

  const craftMessagesBlocked = [];
  const craftingCtxBlocked = makeInventoryContext("bronze_axe_head", "wooden_handle", { bronze_axe_head: 1, wooden_handle: 1 }, craftMessagesBlocked, startedPayloads);
  const blockedHandled = skillModules.crafting.onUseItem(craftingCtxBlocked);
  assert(blockedHandled, "crafting should handle blocked metal-part+base-handle pair");
  assert(!craftingCtxBlocked._counts.bronze_axe, "crafting should not produce output from metal-part+base-handle pair");
  assert(craftMessagesBlocked.some((entry) => entry.message === "You need a strapped handle for that."), "crafting should explain strapped-handle dependency when base handles are used directly");

  const craftMessagesSuccess = [];
  const craftingCtxSuccess = makeInventoryContext("bronze_axe_head", "wooden_handle_strapped", { bronze_axe_head: 1, wooden_handle_strapped: 1 }, craftMessagesSuccess, startedPayloads);
  const successHandled = skillModules.crafting.onUseItem(craftingCtxSuccess);
  assert(successHandled, "crafting should handle valid metal-part+strapped-handle assembly");
  assert((craftingCtxSuccess._counts.bronze_axe || 0) === 1, "crafting should produce assembled bronze axe");
  assert((craftingCtxSuccess._counts.bronze_axe_head || 0) === 0, "crafting should consume bronze axe head");
  assert((craftingCtxSuccess._counts.wooden_handle_strapped || 0) === 0, "crafting should consume strapped handle input");

  window.SkillRuntime = originalSkillRuntime;

  function makeFiremakingActionContext(overrides = {}) {
    const messages = [];
    const litFires = [];
    const xpDrops = [];
    const inventoryCounts = Object.assign({ tinderbox: 1, logs: 1 }, overrides.counts || {});
    const playerState = Object.assign({
      x: 10,
      y: 20,
      z: 0,
      action: "IDLE",
      turnLock: false,
      actionVisualReady: false,
      path: [],
      prevX: 10,
      prevY: 20
    }, overrides.playerState || {});
    let stepBeforeCalls = 0;
    let stepAfterCalls = 0;
    let renderInventoryCalls = 0;
    let removedLogCount = 0;
    let stopActionCalls = 0;

    const context = {
      targetObj: "GROUND",
      sourceItemId: overrides.sourceItemId || "logs",
      currentTick: Number.isFinite(overrides.currentTick) ? overrides.currentTick : 100,
      random: typeof overrides.random === "function" ? overrides.random : () => 0,
      playerState,
      getRecipeSet: (skillId) => SkillSpecRegistry.getRecipeSet(skillId),
      getSkillSpec: (skillId) => SkillSpecRegistry.getSkillSpec(skillId),
      getSkillLevel: () => 99,
      requireSkillLevel: () => true,
      getInventoryCount: (itemId) => inventoryCounts[itemId] || 0,
      haltMovement: () => {
        playerState.path = [];
        playerState.targetX = playerState.x;
        playerState.targetY = playerState.y;
      },
      hasActiveFireAt: (x, y, z) => litFires.some((fire) => fire.x === x && fire.y === y && fire.z === z),
      tryStepBeforeFiremaking: () => {
        stepBeforeCalls += 1;
        if (typeof overrides.tryStepBeforeFiremaking === "function") {
          return overrides.tryStepBeforeFiremaking(playerState);
        }
        playerState.prevX = playerState.x;
        playerState.prevY = playerState.y;
        playerState.x = 10;
        playerState.y = 21;
        return { stepped: true, x: playerState.x, y: playerState.y };
      },
      tryStepAfterFire: () => {
        stepAfterCalls += 1;
        return { stepped: true, x: playerState.x, y: playerState.y };
      },
      lightFireAtCurrentTile: (x, y, z) => {
        litFires.push({ x, y, z });
        return true;
      },
      removeOneItemById: (itemId) => {
        if ((inventoryCounts[itemId] || 0) <= 0) return false;
        inventoryCounts[itemId] -= 1;
        if (itemId === context.sourceItemId) removedLogCount += 1;
        return true;
      },
      addSkillXp: (skillId, amount) => xpDrops.push({ skillId, amount }),
      addChatMessage: (message, tone) => messages.push({ message, tone }),
      renderInventory: () => {
        renderInventoryCalls += 1;
      },
      stopAction: () => {
        stopActionCalls += 1;
        playerState.action = "IDLE";
      }
    };

    return {
      context,
      messages,
      litFires,
      xpDrops,
      inventoryCounts,
      getStepBeforeCalls: () => stepBeforeCalls,
      getStepAfterCalls: () => stepAfterCalls,
      getRenderInventoryCalls: () => renderInventoryCalls,
      getRemovedLogCount: () => removedLogCount,
      getStopActionCalls: () => stopActionCalls
    };
  }

  const firemakingAction = makeFiremakingActionContext();
  const firemakingStarted = skillModules.firemaking.onStart(firemakingAction.context);
  assert(firemakingStarted, "firemaking should start when logs and tinderbox are present");
  assert(firemakingAction.getStepBeforeCalls() === 1, "firemaking should step before the animation begins");
  assert(firemakingAction.context.playerState.action === "SKILLING: FIREMAKING", "firemaking should enter skilling state after stepping away");
  assert(firemakingAction.context.playerState.x === 10 && firemakingAction.context.playerState.y === 21, "firemaking should move the player onto the stand tile before attempting ignition");
  assert(firemakingAction.context.playerState.turnLock === true, "firemaking should lock facing toward the placed logs");
  assert(approxEq(firemakingAction.context.playerState.targetRotation, Math.PI), "firemaking should face back toward the origin tile after stepping");
  assert(!!firemakingAction.context.playerState.firemakingSession, "firemaking session should exist after start");
  assert(firemakingAction.context.playerState.firemakingSession.target.x === 10 && firemakingAction.context.playerState.firemakingSession.target.y === 20, "firemaking should keep the origin tile as the burn target");
  assert(firemakingAction.context.playerState.firemakingSession.standAt.x === 10 && firemakingAction.context.playerState.firemakingSession.standAt.y === 21, "firemaking should remember the stepped-to stand tile separately");

  skillModules.firemaking.onTick(firemakingAction.context);
  assert(firemakingAction.litFires.length === 1, "firemaking should light exactly one fire on success");
  assert(firemakingAction.litFires[0].x === 10 && firemakingAction.litFires[0].y === 20 && firemakingAction.litFires[0].z === 0, "firemaking should light the original tile instead of the stepped-to tile");
  assert(firemakingAction.getRemovedLogCount() === 1, "firemaking should consume one log on success");
  assert(firemakingAction.getRenderInventoryCalls() === 1, "firemaking should refresh inventory after consuming the log");
  assert(firemakingAction.xpDrops.some((entry) => entry.skillId === "firemaking" && entry.amount > 0), "firemaking should award XP on success");
  assert(firemakingAction.context.playerState.firemakingSession.phase === "post_success", "firemaking should enter post-success cleanup after ignition");
  assert(firemakingAction.getStepAfterCalls() === 0, "firemaking should not use the old post-light sidestep path anymore");

  firemakingAction.context.currentTick = firemakingAction.context.playerState.firemakingSession.finishTick;
  skillModules.firemaking.onTick(firemakingAction.context);
  assert(firemakingAction.context.playerState.action === "IDLE", "firemaking should stop cleanly after the success delay when no logs remain");
  assert(firemakingAction.context.playerState.firemakingSession === null, "firemaking should clear the session after the chained supply check fails");
  assert(firemakingAction.context.playerState.turnLock === false, "firemaking should release turn lock after the chained supply failure stops the action");
  assert(firemakingAction.getStopActionCalls() >= 1, "firemaking should stop the active action when the chained supply check fails");
  assert(firemakingAction.getStepAfterCalls() === 1, "firemaking should attempt the follow-up step before checking chained supplies");
  assert(firemakingAction.messages.some((entry) => entry.message === "You have run out of logs."), "firemaking should explain chained log exhaustion after the success clip");

  const smithingAnimateContext = {
    playerState: {
      action: "SKILLING: ANVIL"
    }
  };
  const smithingAnimationHandled = skillModules.smithing.onAnimate(smithingAnimateContext);
  assert(smithingAnimationHandled === false, "smithing should defer body motion to clip-driven animation");
  assert(skillModules.smithing.getAnimationHeldItemId(smithingAnimateContext) === "hammer", "smithing anvil work should surface the hammer prop during clip playback");
  smithingAnimateContext.playerState.action = "SKILLING: FURNACE";
  assert(skillModules.smithing.getAnimationHeldItemId(smithingAnimateContext) === null, "smithing furnace work should stay empty-handed unless runtime logic adds a prop");
  assert(skillModules.smithing.getAnimationSuppressEquipmentVisual(smithingAnimateContext) === true, "smithing should hide equipped gear during clip playback");

  const fletchingAnimateContext = {
    playerState: {
      action: "SKILLING: FLETCHING"
    }
  };
  const fletchingAnimationHandled = skillModules.fletching.onAnimate(fletchingAnimateContext);
  assert(fletchingAnimationHandled === false, "fletching should defer body motion to clip-driven animation");
  assert(skillModules.fletching.getAnimationSuppressEquipmentVisual(fletchingAnimateContext) === true, "fletching should hide equipped gear until explicit held-item logic is authored");

  const craftingAnimateContext = {
    playerState: {
      action: "SKILLING: CRAFTING"
    }
  };
  const craftingAnimationHandled = skillModules.crafting.onAnimate(craftingAnimateContext);
  assert(craftingAnimationHandled === false, "crafting should defer body motion to clip-driven animation");
  assert(skillModules.crafting.getAnimationSuppressEquipmentVisual(craftingAnimateContext) === true, "crafting should hide equipped gear while its empty-hand clip is active");

  const runecraftingAnimateContext = {
    playerState: {
      action: "SKILLING: ALTAR_CANDIDATE"
    }
  };
  const runecraftingAnimationHandled = skillModules.runecrafting.onAnimate(runecraftingAnimateContext);
  assert(runecraftingAnimationHandled === false, "runecrafting should defer body motion to clip-driven animation");
  assert(skillModules.runecrafting.getAnimationSuppressEquipmentVisual(runecraftingAnimateContext) === true, "runecrafting should hide equipped gear while its empty-hand clip is active");

  function makeMiningContext(unlocked) {
    const messages = [];
    let started = false;
    let unlockedState = !!unlocked;
    const toolVisualCalls = [];

    const context = {
      targetObj: "ROCK",
      targetX: 120,
      targetY: 220,
      targetZ: 0,
      currentTick: 0,
      random: () => 0.5,
      playerState: { action: "IDLE" },
      getRockNodeAt: () => ({
        oreType: "sapphire",
        areaGateFlag: "gemMineUnlocked",
        areaName: "the gem mine",
        areaGateMessage: "The gem mine is locked. Speak with Elira Gemhand to gain access."
      }),
      getNodeTable: (skillId) => SkillSpecRegistry.getNodeTable(skillId),
      getSkillSpec: (skillId) => SkillSpecRegistry.getSkillSpec(skillId),
      getSkillLevel: () => 40,
      getBestToolByClass: () => ({ id: "rune_pickaxe", toolTier: 28, speedBonusTicks: 5 }),
      hasToolClass: (toolClass) => toolClass === "pickaxe",
      isTargetTile: (tileId) => tileId === 2,
      canAcceptItemById: () => true,
      addChatMessage: (message, tone) => messages.push({ message, tone }),
      setToolVisualById: (itemId) => {
        toolVisualCalls.push(itemId || null);
      },
      startSkillingAction: () => {
        context.playerState.action = "SKILLING: ROCK";
        started = true;
      },
      stopAction: () => {
        context.playerState.action = "IDLE";
      },
      requireAreaAccess: ({ flagId, areaName, message, silent }) => {
        if (flagId !== "gemMineUnlocked") return true;
        if (unlockedState) return true;
        if (!silent) {
          context.addChatMessage(message || ("You need access to " + (areaName || "that mining area") + " first."), "warn");
        }
        return false;
      }
    };

    return {
      context,
      messages,
      toolVisualCalls,
      wasStarted: () => started,
      setUnlocked: (value) => {
        unlockedState = !!value;
      }
    };
  }

  const miningLocked = makeMiningContext(false);
  const miningStartLocked = skillModules.mining.onStart(miningLocked.context);
  assert(!miningStartLocked, "mining should block gem-mine start when unlock is missing");
  assert(!miningLocked.wasStarted(), "mining should not start while gem mine is locked");
  assert(miningLocked.messages.some((entry) => /gem mine is locked/i.test(entry.message)), "mining lock message should be shown when blocked");

  const miningUnlocked = makeMiningContext(true);
  const miningStartUnlocked = skillModules.mining.onStart(miningUnlocked.context);
  assert(miningStartUnlocked, "mining should start once gem mine is unlocked");
  assert(miningUnlocked.wasStarted(), "mining should enter skilling state when unlocked");
  const miningAnimationHandled = skillModules.mining.onAnimate(miningUnlocked.context);
  assert(miningAnimationHandled === false, "mining should defer body motion to clip-driven animation");
  assert(skillModules.mining.getAnimationHeldItemId(miningUnlocked.context) === "rune_pickaxe", "mining should still surface the best pickaxe visual during clip-driven playback");

  miningUnlocked.messages.length = 0;
  miningUnlocked.setUnlocked(false);
  skillModules.mining.onTick(miningUnlocked.context);
  assert(miningUnlocked.messages.some((entry) => /gem mine is locked/i.test(entry.message)), "mining should re-check gem-mine gate during active ticks");
  assert(miningUnlocked.context.playerState.action === "IDLE", "mining should stop if gem-mine access is lost mid-session");

  const fishingAnimateContext = {
    playerState: {
      action: "SKILLING: WATER",
      fishingActiveMethodId: "net"
    }
  };
  const fishingAnimationHandled = skillModules.fishing.onAnimate(fishingAnimateContext);
  assert(fishingAnimationHandled === false, "fishing should defer body motion to clip-driven animation");
  assert(skillModules.fishing.getAnimationHeldItemId(fishingAnimateContext) === "small_net", "fishing should still surface the small-net visual during clip-driven playback");
  fishingAnimateContext.playerState.fishingActiveMethodId = "rod";
  assert(skillModules.fishing.getAnimationHeldItemId(fishingAnimateContext) === "fishing_rod", "fishing should surface the rod visual during rod clip playback");
  fishingAnimateContext.playerState.fishingActiveMethodId = "harpoon";
  assert(skillModules.fishing.getAnimationHeldItemId(fishingAnimateContext) === "harpoon", "fishing should surface the harpoon visual during harpoon clip playback");
  fishingAnimateContext.playerState.fishingActiveMethodId = "deep_rune_harpoon";
  assert(skillModules.fishing.getAnimationHeldItemId(fishingAnimateContext) === "rune_harpoon", "fishing should surface the rune harpoon visual during rune-harpoon clip playback");
  const worldScript = fs.readFileSync(path.join(root, "src/js/world.js"), "utf8");
  const sharedAssetsRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/shared-assets-runtime.js"), "utf8");
  const terrainSetupRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/terrain-setup-runtime.js"), "utf8");
  const logicalMapAuthoringRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/logical-map-authoring-runtime.js"), "utf8");
  const chunkTerrainRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/chunk-terrain-runtime.js"), "utf8");
  const chunkTierRenderRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/chunk-tier-render-runtime.js"), "utf8");
  const groundItemRenderRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/ground-item-render-runtime.js"), "utf8");
  const groundItemLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/ground-item-lifecycle-runtime.js"), "utf8");
  const npcRenderRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/npc-render-runtime.js"), "utf8");
  const townNpcRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/town-npc-runtime.js"), "utf8");
  const structureRenderRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/structure-render-runtime.js"), "utf8");
  const pierRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/pier-runtime.js"), "utf8");
  const treeNodeRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/tree-node-runtime.js"), "utf8");
  const treeRenderRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/tree-render-runtime.js"), "utf8");
  const treeLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/tree-lifecycle-runtime.js"), "utf8");
  const rockNodeRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/rock-node-runtime.js"), "utf8");
  const rockLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/rock-lifecycle-runtime.js"), "utf8");
  const chunkResourceRenderRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/chunk-resource-render-runtime.js"), "utf8");
  const miningPoseReferenceRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/mining-pose-reference-runtime.js"), "utf8");
  const fireRenderRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/fire-render-runtime.js"), "utf8");
  const fireLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/fire-lifecycle-runtime.js"), "utf8");
  const miningQuarryRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/mining-quarry-runtime.js"), "utf8");
  const trainingLocationRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/training-location-runtime.js"), "utf8");
  const statusHudRuntimeSource = fs.readFileSync(path.join(root, "src/js/world/status-hud-runtime.js"), "utf8");
  const skillProgressRuntimeSource = fs.readFileSync(path.join(root, "src/js/skill-progress-runtime.js"), "utf8");
  const inventoryItemRuntimeSource = fs.readFileSync(path.join(root, "src/js/inventory-item-runtime.js"), "utf8");
  const equipmentItemRuntimeSource = fs.readFileSync(path.join(root, "src/js/equipment-item-runtime.js"), "utf8");
  const foodItemRuntimeSource = fs.readFileSync(path.join(root, "src/js/food-item-runtime.js"), "utf8");
  const inventoryActionRuntimeSource = fs.readFileSync(path.join(root, "src/js/inventory-action-runtime.js"), "utf8");
  const worldContractsSource = fs.readFileSync(path.join(root, "src/game/contracts/world.ts"), "utf8");
  const runtimePublishSource = fs.readFileSync(path.join(root, "src/game/world/runtime-publish.ts"), "utf8");
  const cloneSource = fs.readFileSync(path.join(root, "src/game/world/clone.ts"), "utf8");
  const miningRuntimeSource = fs.readFileSync(path.join(root, "src/game/world/mining-runtime.ts"), "utf8");
  const runecraftingRuntimeSource = fs.readFileSync(path.join(root, "src/game/world/runecrafting-runtime.ts"), "utf8");
  const woodcuttingRuntimeSource = fs.readFileSync(path.join(root, "src/game/world/woodcutting-runtime.ts"), "utf8");
  const inputRenderSource = fs.readFileSync(path.join(root, "src/js/input-render.js"), "utf8");
  const inputArrivalInteractionRuntimeSource = fs.readFileSync(path.join(root, "src/js/input-arrival-interaction-runtime.js"), "utf8");
  const npcDialogueCatalogSource = fs.readFileSync(path.join(root, "src/js/content/npc-dialogue-catalog.js"), "utf8");
  const npcDialogueRuntimeSource = fs.readFileSync(path.join(root, "src/js/npc-dialogue-runtime.js"), "utf8");
  const npcPlayerModelSource = fs.readFileSync(path.join(root, "src/js/player-model.js"), "utf8");
  const playerNpcHumanoidRuntimeSource = fs.readFileSync(path.join(root, "src/js/player-npc-humanoid-runtime.js"), "utf8");
  const starterTownWorld = JSON.parse(fs.readFileSync(path.join(root, "content/world/regions/main_overworld.json"), "utf8"));
  assert(!!NpcDialogueCatalog && typeof NpcDialogueCatalog.resolveDialogueId === "function", "npc dialogue catalog resolver missing");
  assert(worldContractsSource.includes("appearanceId?: string | null;"), "world contracts should expose appearanceId on NPC/service descriptors");
  assert(worldContractsSource.includes("dialogueId?: string | null;"), "world contracts should expose dialogueId on NPC/service descriptors");
  assert(runtimePublishSource.includes("appearanceId: typeof entry.appearanceId === \"string\""), "runtime publish should preserve appearanceId");
  assert(runtimePublishSource.includes("dialogueId: typeof entry.dialogueId === \"string\""), "runtime publish should preserve dialogueId");
  assert(cloneSource.includes("appearanceId: resolveServiceAppearanceId(service)"), "merchant NPC descriptors should resolve appearanceId");
  assert(cloneSource.includes("dialogueId: typeof service.dialogueId === \"string\" ? service.dialogueId.trim() || null : null"), "merchant NPC descriptors should preserve dialogueId");
  assert(worldScript.includes("WorldNpcRenderRuntime"), "world.js should delegate NPC hitbox rendering");
  assert(worldScript.includes("WorldTownNpcRuntime"), "world.js should delegate town NPC movement and occupancy behavior");
  assert(townNpcRuntimeSource.includes("function updateWorldNpcRuntime(context = {}, frameNowMs)"), "town NPC runtime should own NPC update ticks");
  assert(townNpcRuntimeSource.includes("function refreshTutorialGateStates(context = {})"), "town NPC runtime should own tutorial gate refresh behavior");
  assert(townNpcRuntimeSource.includes("function publishTutorialGateHooks"), "town NPC runtime should own tutorial gate public hook publication");
  assert(worldScript.includes("worldTownNpcRuntime.publishTutorialGateHooks({"), "world.js should install tutorial gate hooks through the town NPC runtime");
  assert(townNpcRuntimeSource.includes("function createTownNpcActorRecord(options = {})"), "town NPC runtime should own town NPC actor shaping");
  assert(townNpcRuntimeSource.includes("function listQaNpcTargets(npcsToRender)"), "town NPC runtime should own QA NPC target snapshots");
  assert(townNpcRuntimeSource.includes("function resolveTownNpcRoamBounds(options = {})"), "town NPC runtime should own NPC roam bounds resolution");
  assert(townNpcRuntimeSource.includes("function resolveTownNpcRoamingRadius(npc, roamBounds)"), "town NPC runtime should own NPC roaming radius resolution");
  assert(!worldScript.includes("function applyTownNpcRigAnimation("), "world.js should not own town NPC rig animation");
  assert(!worldScript.includes("const npcActorId = (npc && typeof npc.spawnId === 'string' && npc.spawnId)"), "world.js should not own town NPC actor id shaping");
  assert(!worldScript.includes("idleUntilMs: actorNowMs + 400"), "world.js should not own town NPC idle seed shaping");
  assert(!worldScript.includes("actorId: npc && npc.actorId ? npc.actorId : ''"), "world.js should not own QA NPC target snapshots");
  assert(!worldScript.includes("function hashTownNpcSeed(text)"), "world.js should not keep the old town NPC seed wrapper");
  assert(!worldScript.includes("const resolveTownNpcRoamBounds = (npc) => {"), "world.js should not own NPC roam bounds resolution");
  assert(!worldScript.includes("const resolveTownNpcRoamingRadius = (npc, roamBounds) => {"), "world.js should not own NPC roaming radius resolution");
  assert(npcRenderRuntimeSource.includes("if (appearanceId) npcUid.appearanceId = appearanceId;"), "NPC render runtime hitboxes should preserve appearanceId");
  assert(npcRenderRuntimeSource.includes("if (typeof npc.dialogueId === 'string' && npc.dialogueId.trim()) npcUid.dialogueId = npc.dialogueId.trim();"), "NPC render runtime hitboxes should preserve dialogueId");
  assert(inputRenderSource.includes("InputArrivalInteractionRuntime"), "input renderer should delegate arrival interactions");
  assert(inputArrivalInteractionRuntimeSource.includes("playerState.targetUid.action === 'Talk-to'"), "input arrival interaction runtime should route Talk-to actions");
  assert(inputArrivalInteractionRuntimeSource.includes("windowRef.openNpcDialogue(playerState.targetUid);"), "input arrival interaction runtime should open NPC dialogue from Talk-to");
  assert(npcDialogueCatalogSource.includes("const DIALOGUE_ENTRIES = {"), "npc dialogue catalog should define dialogue entries");
  assert(npcDialogueRuntimeSource.includes("window.NpcDialogueCatalog.getDialogueEntryByNpc(npc)"), "npc dialogue runtime should resolve dialogue entries through the catalog helper");
  assert(npcDialogueRuntimeSource.includes("window.NpcDialogueCatalog.resolveDialogueIdFromNpc(normalizedNpc)"), "npc dialogue runtime should preserve the resolved dialogue id from full NPC metadata");
  assert(npcDialogueRuntimeSource.includes("window.openNpcDialogue = openNpcDialogue;"), "npc dialogue runtime should expose openNpcDialogue");
  assert(npcPlayerModelSource.includes("PlayerNpcHumanoidRuntime"), "player model should delegate NPC humanoid presets");
  assert(playerNpcHumanoidRuntimeSource.includes("normalizedPresetId === 'tanner'") && playerNpcHumanoidRuntimeSource.includes("return 'tanner_rusk';"), "player NPC humanoid runtime should allow the Tanner NPC preset alias");
  Object.entries(STARTER_TOWN_NAMED_NPC_DIALOGUES).forEach(([serviceId, expectedDialogueId]) => {
    const service = (starterTownWorld.services || []).find((entry) => entry && entry.serviceId === serviceId);
    assert(!!service, `starter-town named NPC service missing: ${serviceId}`);
    const dialogueId = service && typeof service.dialogueId === "string" ? service.dialogueId.trim() : "";
    assert(dialogueId, `${serviceId} should define dialogueId`);
    assert(NpcDialogueCatalog.resolveDialogueId(dialogueId) === expectedDialogueId, `${serviceId} dialogueId should resolve to ${expectedDialogueId}`);
  });
  assert(
    starterTownWorld.services.some((entry) => entry && entry.merchantId === "tanner_rusk" && String(entry.appearanceId || "").trim().toLowerCase() === "tanner_rusk"),
    "tanner world placement should keep the exact tanner_rusk appearance id when authored"
  );
  assert(structureRenderRuntimeSource.includes("new THREE.BoxGeometry(3, 2.6, 3)"), "runecrafting altar click-box regression");
  assert(runecraftingRuntimeSource.includes("for (let by = placed.y - 1; by <= placed.y + 2; by++)"), "runecrafting altar collision footprint regression");
  assert(Array.isArray(starterTownWorld.skillRoutes.runecrafting) && starterTownWorld.skillRoutes.runecrafting.length === 4, "runecrafting authored routes missing");
  assert(Array.isArray(starterTownWorld.landmarks.altars) && starterTownWorld.landmarks.altars.length === 4, "runecrafting authored altars missing");
  assert(starterTownWorld.terrainPatches.castleRouteAnchor.x === 205 && starterTownWorld.terrainPatches.castleRouteAnchor.y === 205, "runecrafting castle route anchor missing");
  assert(runecraftingRuntimeSource.includes("const altarOrder = draft.authored.runecraftingAltarOrder;"), "runecrafting altar order wiring missing");
  assert(!starterTownWorld.dynamicServices, "starter-town should not keep dynamic runecrafting merchants after freeze");
  assert(Array.isArray(starterTownWorld.services) && starterTownWorld.services.some((entry) => entry.merchantId === "rune_tutor"), "rune tutor authored service placement missing");
  assert(Array.isArray(starterTownWorld.services) && starterTownWorld.services.some((entry) => entry.merchantId === "combination_sage"), "combination sage authored service placement missing");
  assert(Array.isArray(starterTownWorld.services) && starterTownWorld.services.some((entry) => entry.merchantId === "fishing_teacher"), "fishing teacher world placement missing");
  assert(Array.isArray(starterTownWorld.services) && starterTownWorld.services.some((entry) => entry.merchantId === "fishing_supplier"), "fishing supplier world placement missing");
  assert(Array.isArray(starterTownWorld.skillRoutes.cooking) && starterTownWorld.skillRoutes.cooking.length === 4, "cooking route specs missing");
  assert(starterTownWorld.skillRoutes.cooking.some((entry) => entry.routeId === "starter_campfire"), "starter campfire route missing");
  assert(starterTownWorld.skillRoutes.cooking.some((entry) => entry.routeId === "riverbank_fire_line"), "riverbank cooking route missing");
  assert(starterTownWorld.skillRoutes.cooking.some((entry) => entry.routeId === "dockside_fire_line"), "dockside cooking route missing");
  assert(starterTownWorld.skillRoutes.cooking.some((entry) => entry.routeId === "deep_water_dock_fire_line"), "deep-water cooking route missing");
  assert(Array.isArray(starterTownWorld.skillRoutes.firemaking) && starterTownWorld.skillRoutes.firemaking.length === 5, "firemaking route specs missing");
  assert(starterTownWorld.skillRoutes.firemaking.some((entry) => entry.routeId === "starter_fire_lane"), "starter fire lane missing");
  assert(starterTownWorld.skillRoutes.firemaking.some((entry) => entry.routeId === "oak_fire_lane"), "oak fire lane missing");
  assert(starterTownWorld.skillRoutes.firemaking.some((entry) => entry.routeId === "willow_fire_lane"), "willow fire lane missing");
  assert(starterTownWorld.skillRoutes.firemaking.some((entry) => entry.routeId === "maple_fire_lane"), "maple fire lane missing");
  assert(starterTownWorld.skillRoutes.firemaking.some((entry) => entry.routeId === "yew_fire_lane"), "yew fire lane missing");
  assert(worldScript.includes("WorldTrainingLocationRuntime"), "world.js should delegate training location compatibility hooks");
  assert(worldScript.includes("WorldMiningQuarryRuntime"), "world.js should delegate mining quarry planning");
  assert(miningQuarryRuntimeSource.includes("const MINING_QUARRY_LAYOUT_OVERRIDES = Object.freeze({"), "mining quarry runtime should own quarry layout overrides");
  assert(miningQuarryRuntimeSource.includes("const thinMiningRockPlacements = (placements) => {"), "mining quarry runtime should own mining rock thinning");
  assert(miningQuarryRuntimeSource.includes("const redistributeMiningRockPlacements = (placements, sourcePlacements) => {"), "mining quarry runtime should own mining rock redistribution planning");
  assert(!worldScript.includes("const MINING_QUARRY_LAYOUT_OVERRIDES = Object.freeze({"), "world.js should not own mining quarry layout overrides");
  assert(!worldScript.includes("const thinMiningRockPlacements = (placements) => {"), "world.js should not own mining rock thinning");
  assert(!worldScript.includes("const redistributeMiningRockPlacements = (placements, sourcePlacements) => {"), "world.js should not own mining rock redistribution planning");
  assert(trainingLocationRuntimeSource.includes("function publishTrainingLocationHooks(options = {})"), "training location runtime should own compatibility hook publication");
  assert(trainingLocationRuntimeSource.includes("windowTarget.getFishingTrainingLocations = function getFishingTrainingLocations()"), "training location runtime should publish the fishing getter");
  assert(trainingLocationRuntimeSource.includes("windowTarget.getCookingTrainingLocations = function getCookingTrainingLocations()"), "training location runtime should publish the cooking getter");
  assert(trainingLocationRuntimeSource.includes("windowTarget.getFiremakingTrainingLocations = function getFiremakingTrainingLocations()"), "training location runtime should publish the firemaking getter");
  assert(!worldScript.includes("window.getFishingTrainingLocations = function getFishingTrainingLocations()"), "world.js should not publish the fishing getter inline");
  assert(!worldScript.includes("window.getCookingTrainingLocations = function getCookingTrainingLocations()"), "world.js should not publish the cooking getter inline");
  assert(!worldScript.includes("window.getFiremakingTrainingLocations = function getFiremakingTrainingLocations()"), "world.js should not publish the firemaking getter inline");
  assert(worldScript.includes("WorldChunkTerrainRuntime"), "world.js should delegate chunk terrain mesh construction");
  assert(worldScript.includes("WorldSharedAssetsRuntime"), "world.js should delegate shared asset setup");
  assert(sharedAssetsRuntimeSource.includes("function initSharedAssets(options = {})"), "shared asset runtime should own shared geometry/material setup");
  assert(sharedAssetsRuntimeSource.includes("sharedGeometries.ground = new THREE.PlaneGeometry(chunkSize, chunkSize);"), "shared asset runtime should own base ground geometry setup");
  assert(sharedAssetsRuntimeSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial({ color: 0xb7c7aa, side: THREE.DoubleSide });"), "shared asset runtime should own terrain underlay material setup");
  assert(sharedAssetsRuntimeSource.includes("const makeNoiseTexture = (baseHex, vMin, vMax, speckleCount, patchCount = 42, patchSize = 5) => {"), "shared asset runtime should own procedural material texture helpers");
  assert(worldScript.includes("WorldTerrainSetupRuntime"), "world.js should delegate base terrain setup");
  assert(terrainSetupRuntimeSource.includes("function applyBaseTerrainSetup(options = {})"), "terrain setup runtime should own base terrain setup");
  assert(!worldScript.includes("const sampleRiverAtY = (y) => {"), "world.js should not own river sampling");
  assert(!worldScript.includes("const carveWaterTile = (x, y, depthNorm) => {"), "world.js should not own base water carving");
  assert(worldScript.includes("WorldLogicalMapAuthoringRuntime"), "world.js should delegate static logical-map authoring");
  assert(logicalMapAuthoringRuntimeSource.includes("function applyStaticWorldAuthoring(options = {})"), "logical-map authoring runtime should own static landmark stamping");
  assert(logicalMapAuthoringRuntimeSource.includes("function stampBlueprint(options = {})"), "logical-map authoring runtime should own blueprint stamping");
  assert(logicalMapAuthoringRuntimeSource.includes("function applyAuthoredAltarCollision(options = {})"), "logical-map authoring runtime should own authored altar collision stamping");
  assert(!worldScript.includes("function stampBlueprint("), "world.js should not own blueprint stamping inline");
  assert(!worldScript.includes("function applyFenceLandmark("), "world.js should not own fence landmark stamping inline");
  assert(!worldScript.includes("logicalMap[altar.z][by][bx] = TileId.OBSTACLE"), "world.js should not own authored altar collision stamping inline");
  assert(!worldScript.includes("sharedGeometries.ground = new THREE.PlaneGeometry"), "world.js should not own shared geometry construction");
  assert(!worldScript.includes("const makeNoiseTexture = (baseHex"), "world.js should not own shared procedural material texture helpers");
  assert(chunkTerrainRuntimeSource.includes("function buildChunkGroundMeshes(options = {})"), "chunk terrain runtime should own ground mesh construction");
  assert(!worldScript.includes("const sampleTerrainVertexHeight = (cornerX, cornerY) => {"), "world.js should not own chunk terrain vertex sampling");
  assert(!worldScript.includes("new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE)"), "world.js should not own chunk ground plane geometry construction");
  assert(worldScript.includes("WorldChunkTierRenderRuntime"), "world.js should delegate simplified tier chunk rendering");
  assert(chunkTierRenderRuntimeSource.includes("function createSimplifiedChunkGroup(options = {})"), "chunk tier render runtime should own simplified chunk group construction");
  assert(chunkTierRenderRuntimeSource.includes("function createSimplifiedTerrainMesh(options = {})"), "chunk tier render runtime should own simplified terrain construction");
  assert(chunkTierRenderRuntimeSource.includes("function addSimplifiedChunkFeatures(options = {})"), "chunk tier render runtime should own simplified feature rendering");
  assert(!worldScript.includes("function ensureChunkTierRenderAssets"), "world.js should not own chunk tier asset setup");
  assert(!worldScript.includes("function createSimplifiedTerrainMesh"), "world.js should not own simplified terrain construction");
  assert(!worldScript.includes("function addSimplifiedChunkFeatures"), "world.js should not own simplified feature rendering");
  assert(worldScript.includes("WorldGroundItemRenderRuntime"), "world.js should delegate ground-item visuals through the render runtime");
  assert(worldScript.includes("WorldGroundItemLifecycleRuntime"), "world.js should delegate ground-item lifecycle through the lifecycle runtime");
  assert(groundItemLifecycleRuntimeSource.includes("function spawnGroundItem(context = {}, itemData, x, y, z, amount = 1, options = {})"), "ground-item lifecycle runtime should own ground-item spawning");
  assert(groundItemLifecycleRuntimeSource.includes("function dropItem(context = {}, invIndex)"), "ground-item lifecycle runtime should own inventory drop flow");
  assert(groundItemLifecycleRuntimeSource.includes("function updateGroundItems(context = {})"), "ground-item lifecycle runtime should own ground-item despawn ticks");
  assert(groundItemLifecycleRuntimeSource.includes("function takeGroundItemByUid(context = {}, uid)"), "ground-item lifecycle runtime should own ground-item pickup");
  assert(inputArrivalInteractionRuntimeSource.includes("context.takeGroundItemByUid(playerState.targetUid)"), "input arrival interaction runtime should delegate ground-item pickup through the lifecycle hook");
  assert(!worldScript.includes("const uid = Date.now() + Math.random();"), "world.js should not own ground-item uid creation");
  assert(!worldScript.includes("new THREE.BoxGeometry(0.8, 0.8, 0.8)"), "world.js should not own ground-item hitbox construction");
  assert(!inputRenderSource.includes("groundItems = groundItems.filter(gi => gi.uid !== itemEntry.uid);"), "input renderer should not mutate groundItems directly for pickup");
  assert(!worldScript.includes("function addAshesGroundVisual("), "world.js should not own ashes ground-item visual construction");
  assert(!worldScript.includes("function resolveFishGroundVisual("), "world.js should not own fish ground-item visual resolution");
  assert(groundItemRenderRuntimeSource.includes("function addAshesGroundVisual(options)"), "ashes ground-item visual helper missing");
  assert(groundItemRenderRuntimeSource.includes("function resolveFishGroundVisual(itemData)"), "fish ground-item visual resolver missing");
  assert(groundItemRenderRuntimeSource.includes("function addFishGroundVisual(options)"), "fish ground-item visual helper missing");
  assert(groundItemRenderRuntimeSource.includes("function buildFishPixelGroundVisualMeshes(pixelSource, visual, createPixelSourceVisualMeshes)"), "fish ground-item silhouette builder missing");
  assert(groundItemRenderRuntimeSource.includes("function queueFishGroundVisualMeshes(options)"), "fish ground-item pixel-source queue missing");
  assert(groundItemRenderRuntimeSource.includes("addGroundItemSprite({ THREE, group, path: spritePath, y: 0.17, scale: 0.42 });"), "ashes ground items should preview the pixel icon above the mound");
  assert(npcRenderRuntimeSource.includes("function appendChunkNpcVisuals(options = {})"), "NPC render runtime should own chunk NPC visual attachment");
  assert(npcRenderRuntimeSource.includes("function createNpcInteractionUid(npc, appearanceId)"), "NPC render runtime should own NPC interaction UID shaping");
  assert(townNpcRuntimeSource.includes("let loadedChunkNpcActors = new Map();"), "town NPC runtime should own loaded chunk NPC actor state");
  assert(!worldScript.includes("const npcUid = {"), "world.js should not shape NPC hitbox UIDs inline");
  assert(!worldScript.includes("new THREE.BoxGeometry(1, 2, 1)"), "world.js should not own NPC hitbox geometry construction");
  assert(worldScript.includes("WorldStructureRenderRuntime"), "world.js should delegate static structure visuals through the render runtime");
  assert(worldScript.includes("WorldPierRuntime"), "world.js should delegate pier classification through the pier runtime");
  assert(pierRuntimeSource.includes("function isPierDeckTile(pierConfig, x, y, z)"), "pier runtime should own pier deck classification");
  assert(pierRuntimeSource.includes("function isPierSideWaterTile(pierConfig, x, y, z)"), "pier runtime should own pier side-water classification");
  assert(pierRuntimeSource.includes("function isPierVisualCoverageTile(pierConfig, x, y, z)"), "pier runtime should own pier visual coverage classification");
  assert(!worldScript.includes("&& x >= pierConfig.xMin"), "world.js should not own pier deck bounds inline");
  assert(!worldScript.includes("y >= (pierConfig.yEnd - 1)"), "world.js should not own pier visual coverage bounds inline");
  assert(!worldScript.includes("const hasNorth = y > 0 && isFenceConnectorTile("), "world.js should not own fence visual construction");
  assert(!worldScript.includes("const railW = door.isEW ? door.width : 0.12;"), "world.js should not own wooden gate visual construction");
  assert(!worldScript.includes("const ridgeAlongX = roof.ridgeAxis !== 'y';"), "world.js should not own roof visual construction");
  assert(!worldScript.includes("bankBoothsToRender.forEach"), "world.js should not own bank booth chunk landmark rendering");
  assert(!worldScript.includes("furnacesToRender.forEach"), "world.js should not own furnace chunk landmark rendering");
  assert(!worldScript.includes("altarCandidatesToRender.forEach"), "world.js should not own altar chunk landmark rendering");
  assert(!worldScript.includes("const deckTop = Z_OFFSET + PIER_DECK_TOP_HEIGHT;"), "world.js should not own pier visual construction");
  assert(!worldScript.includes("new THREE.InstancedMesh(sharedGeometries.castleWall"), "world.js should not own castle wall instanced mesh setup");
  assert(!worldScript.includes("new THREE.BoxGeometry(1.0, 1.0, 0.8)"), "world.js should not own shop counter geometry");
  assert(!worldScript.includes("new THREE.BoxGeometry(1, floorHeight, 1)"), "world.js should not own stair block geometry");
  assert(worldScript.includes("appendChunkLandmarkVisuals(planeGroup, z, Z_OFFSET, startX, startY, endX, endY);"), "world.js should delegate chunk landmark visuals through the structure runtime");
  assert(worldScript.includes("worldStructureRenderRuntime.appendPierVisualsToChunk"), "world.js should delegate pier visuals through the structure runtime");
  assert(worldScript.includes("worldStructureRenderRuntime.createCastleRenderData"), "world.js should delegate castle render setup through the structure runtime");
  assert(worldScript.includes("worldStructureRenderRuntime.appendShopCounterVisual"), "world.js should delegate shop counter visuals through the structure runtime");
  assert(worldScript.includes("worldStructureRenderRuntime.appendFloorTileVisual"), "world.js should delegate floor tile visuals through the structure runtime");
  assert(worldScript.includes("worldStructureRenderRuntime.appendStairRampVisual"), "world.js should delegate stair ramp visuals through the structure runtime");
  assert(structureRenderRuntimeSource.includes("function createTopAnchoredFloorMesh(options)"), "structure render runtime should own top-anchored floor construction");
  assert(structureRenderRuntimeSource.includes("function createFenceVisualGroup(options)"), "structure render runtime should own fence visual construction");
  assert(structureRenderRuntimeSource.includes("function createWoodenGateVisualGroup(options)"), "structure render runtime should own wooden gate visual construction");
  assert(structureRenderRuntimeSource.includes("function createRoofVisualGroup(options)"), "structure render runtime should own roof visual construction");
  assert(structureRenderRuntimeSource.includes("function createCastleRenderData(options = {})"), "structure render runtime should own castle instanced render setup");
  assert(structureRenderRuntimeSource.includes("function appendShopCounterVisual(options = {})"), "structure render runtime should own shop counter visual construction");
  assert(structureRenderRuntimeSource.includes("function appendStairRampVisual(options = {})"), "structure render runtime should own stair ramp visual construction");
  assert(structureRenderRuntimeSource.includes("function appendChunkLandmarkVisuals(options)"), "structure render runtime should own chunk landmark visual rendering");
  assert(structureRenderRuntimeSource.includes("function appendPierVisualsToChunk(options)"), "structure render runtime should own pier visual rendering");
  assert(structureRenderRuntimeSource.includes("function createFurnaceVisualGroup(options)"), "structure render runtime should own furnace visual construction");
  assert(structureRenderRuntimeSource.includes("function createAltarCandidateVisualGroup(options)"), "structure render runtime should own altar visual construction");
  assert(structureRenderRuntimeSource.includes("function updateTutorialRoofVisibility(options)"), "structure render runtime should own tutorial roof fade updates");
  assert(!worldScript.includes("seedCookingTrainingFires();"), "cooking training fires should not seed on renderer init");
  assert(worldScript.includes("const FIRE_LIFETIME_TICKS = resolveFireLifetimeTicks();"), "fire lifetime should resolve from firemaking data");
  assert(worldScript.includes("SkillSpecRegistry.getRecipeSet('firemaking')"), "fire lifetime resolver should read firemaking recipe data");
  assert(worldScript.includes("function tickFireLifecycle()"), "fire lifecycle tick helper missing");
  assert(worldScript.includes("function tryStepBeforeFiremaking()"), "firemaking should expose the pre-ignition step helper");
  assert(worldScript.includes("function syncFiremakingLogPreview()"), "firemaking should render a temporary log preview on the origin tile");
  assert(worldScript.includes("WorldFireRenderRuntime"), "world.js should delegate fire visuals through the render runtime");
  assert(worldScript.includes("WorldFireLifecycleRuntime"), "world.js should delegate fire lifecycle behavior through the lifecycle runtime");
  assert(!worldScript.includes("new THREE.ConeGeometry(0.16, 0.45, 8)"), "world.js should not own fire flame mesh construction");
  assert(!worldScript.includes("fire.flame.scale.set(1.0 + Math.sin(t) * 0.12"), "world.js should not own fire flame animation");
  assert(!worldScript.includes("let activeFiremakingLogPreview = null;"), "world.js should not own firemaking log preview state");
  assert(!worldScript.includes("const FIRE_STEP_DIR = { x: 0, y: 1 };"), "world.js should not own fire step direction policy");
  assert(fireRenderRuntimeSource.includes("function createFireVisual(options)"), "fire render runtime should own fire visual construction");
  assert(fireRenderRuntimeSource.includes("function createFiremakingLogPreview(options)"), "fire render runtime should own firemaking preview construction");
  assert(fireRenderRuntimeSource.includes("function updateFireFlameVisual(fire, frameNow)"), "fire render runtime should own fire flame animation");
  assert(fireLifecycleRuntimeSource.includes("function spawnFireAtTile(context = {}, x, y, z, options = {})"), "fire lifecycle runtime should own fire spawning");
  assert(fireLifecycleRuntimeSource.includes("function findFireStepDestination(context = {})"), "fire lifecycle runtime should own fire step destination logic");
  assert(worldScript.includes("window.tickFireLifecycle = tickFireLifecycle;"), "fire lifecycle tick export missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "borin_ironvein"), "borin world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "thrain_deepforge"), "thrain world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "elira_gemhand"), "elira world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "crafting_teacher"), "crafting teacher world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "tanner_rusk"), "tanner world placement missing");
  assert(Array.isArray(starterTownWorld.combatSpawns) && starterTownWorld.combatSpawns.length === 53, "starter combat spawns missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_training_dummy_hub" && entry.enemyId === "enemy_training_dummy"), "training dummy combat spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_rat_south_field" && entry.spawnTile.x === 194 && entry.spawnTile.y === 220), "rat combat spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_chicken_south_field" && entry.enemyId === "enemy_chicken"), "chicken combat spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_goblin_east_path" && entry.spawnTile.x === 240 && entry.spawnTile.y === 200), "goblin combat spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_goblin_east_field_north" && entry.spawnTile.x === 276 && entry.spawnTile.y === 188), "east-field north goblin spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_goblin_east_field_center" && entry.spawnTile.x === 295 && entry.spawnTile.y === 206), "east-field center goblin spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_goblin_east_field_south" && entry.spawnTile.x === 278 && entry.spawnTile.y === 226), "east-field south goblin spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_east_field_west" && entry.spawnTile.x === 326 && entry.spawnTile.y === 244), "east-field west boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_east_field_center" && entry.spawnTile.x === 334 && entry.spawnTile.y === 256), "east-field center boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_east_field_east" && entry.spawnTile.x === 342 && entry.spawnTile.y === 248), "east-field east boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_north" && entry.spawnTile.x === 44 && entry.spawnTile.y === 128), "outer west north boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_south" && entry.spawnTile.x === 56 && entry.spawnTile.y === 468), "outer west south boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_east_north" && entry.spawnTile.x === 468 && entry.spawnTile.y === 132), "outer east north boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_north" && entry.spawnTile.x === 44 && entry.spawnTile.y === 128), "outer west north boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_south" && entry.spawnTile.x === 56 && entry.spawnTile.y === 468), "outer west south boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_east_north" && entry.spawnTile.x === 468 && entry.spawnTile.y === 132), "outer east north boar spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_wolf_outer_northwest" && entry.spawnTile.x === 60 && entry.spawnTile.y === 70), "outer northwest wolf spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_wolf_outer_north" && entry.spawnTile.x === 72 && entry.spawnTile.y === 82), "outer north wolf spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_wolf_outer_northeast" && entry.spawnTile.x === 84 && entry.spawnTile.y === 96), "outer northeast wolf spawn missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnGroupId === "starter_outer_wolf_southwest" && entry.spawnNodeId === "enemy_spawn_wolf_outer_southwest_1"), "outer southwest wolf cluster missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnGroupId === "starter_outer_wolf_south" && entry.spawnNodeId === "enemy_spawn_wolf_outer_south_2"), "outer south wolf cluster missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnGroupId === "starter_outer_wolf_southeast" && entry.spawnNodeId === "enemy_spawn_wolf_outer_southeast_3"), "outer southeast wolf cluster missing");
  assert(starterTownWorld.combatSpawns.filter((entry) => entry.spawnGroupId === "starter_far_southern_goblins").length === 4, "far southern goblin group missing");
  assert(starterTownWorld.combatSpawns.filter((entry) => entry.spawnGroupId === "starter_far_eastern_goblins").length === 4, "far eastern goblin group missing");
  assert(starterTownWorld.combatSpawns.filter((entry) => entry.spawnGroupId === "starter_outer_rats_southwest").length === 4, "outer southwest rat group missing");
  assert(starterTownWorld.combatSpawns.filter((entry) => entry.spawnGroupId === "starter_outer_chickens_southwest").length === 5, "outer southwest chicken group missing");
  assert(starterTownWorld.combatSpawns.filter((entry) => entry.spawnGroupId === "starter_outer_chickens_southeast").length === 5, "outer southeast chicken group missing");
  assert(starterTownWorld.combatSpawns.some((entry) => entry.spawnNodeId === "enemy_spawn_guard_east_outpost_north" && entry.spawnGroupId === "starter_east_outpost_guard_post" && entry.roamingRadiusOverride === 5), "guard post combat spawn missing");
  assert(Array.isArray(starterTownWorld.skillRoutes.mining) && starterTownWorld.skillRoutes.mining.length === 6, "authored mining routes missing");
  assert(Array.isArray(starterTownWorld.resourceNodes.mining) && starterTownWorld.resourceNodes.mining.length === 114, "authored mining nodes missing");
  assert(starterTownWorld.resourceNodes.mining.some((entry) => entry.routeId === "gem_mine" && entry.areaGateFlag === "gemMineUnlocked"), "gem mine authored gate flag missing");
  assert(starterTownWorld.resourceNodes.mining.some((entry) => entry.routeId === "gem_mine" && entry.areaGateMessage === "The gem mine is locked. Speak with Elira Gemhand to gain access."), "gem mine authored gate message missing");
  assert(worldScript.includes("const setMiningRockAt = (placement) => {"), "mining rock placement bridge writer missing");
  assert(miningRuntimeSource.includes("if (!draft.writers.setMiningRock(placement)) continue;"), "mining rock placement should flow through the runtime writer");
  assert(miningRuntimeSource.includes("areaGateFlag: zoneSpec.areaGateFlag || null"), "mining zone area-gate metadata should flow into rock placement");
  assert(worldScript.includes("WorldRockNodeRuntime"), "world.js should delegate rock metadata helpers through the rock node runtime");
  assert(worldScript.includes("WorldRockLifecycleRuntime"), "world.js should delegate rock lifecycle behavior through the lifecycle runtime");
  assert(rockNodeRuntimeSource.includes("function oreTypeForTile(input = {})"), "rock node runtime should own ore type resolution");
  assert(rockNodeRuntimeSource.includes("function getRockDisplayName(oreType)"), "rock node runtime should own rock display names");
  assert(rockNodeRuntimeSource.includes("function depleteRockNodeRecord(node, currentTick, respawnTicks = 12)"), "rock node runtime should own rock depletion record mutation");
  assert(rockNodeRuntimeSource.includes("function tickRockNodeRespawns(input = {})"), "rock node runtime should own depleted rock respawn bookkeeping");
  assert(rockLifecycleRuntimeSource.includes("function rebuildRockNodes(context = {})"), "rock lifecycle runtime should own rock-node rebuilds");
  assert(rockLifecycleRuntimeSource.includes("function getRockNodeAt(context = {}, x, y, z = 0)"), "rock lifecycle runtime should own rock-node lookup");
  assert(rockLifecycleRuntimeSource.includes("function depleteRockNode(context = {}, x, y, z = 0, respawnTicks = 12)"), "rock lifecycle runtime should own depletion orchestration");
  assert(rockLifecycleRuntimeSource.includes("function tickRockNodes(context = {})"), "rock lifecycle runtime should own respawn refresh ticks");
  assert(inputRenderSource.includes("window.tickRockNodes()"), "input renderer should delegate rock respawn ticks through the lifecycle hook");
  assert(!worldScript.includes("const GEM_HOTSPOT = { x: 200, y: 370, radius: 20 };"), "world.js should not own rock hotspot metadata");
  assert(!worldScript.includes("const weightedTypes = ['clay', 'copper', 'tin', 'iron', 'coal', 'silver', 'gold'];"), "world.js should not own default ore weighting");
  assert(!worldScript.includes("node.depletedUntilTick = currentTick + Math.max(1, respawnTicks);"), "world.js should not mutate rock depletion records inline");
  assert(!worldScript.includes("const rebuilt = {};"), "world.js should not rebuild rock-node tables inline");
  assert(!worldScript.includes("rockNodes[key] = {"), "world.js should not create rock-node records inline");
  assert(!inputRenderSource.includes("if (typeof tickRockNodes === 'function') tickRockNodes();"), "input renderer should not call the local rock tick function directly");
  assert(trainingLocationRuntimeSource.includes("windowTarget.getMiningTrainingLocations = function getMiningTrainingLocations()"), "training location runtime should publish the mining getter");
  assert(trainingLocationRuntimeSource.includes("windowTarget.getRunecraftingAltarLocations = function getRunecraftingAltarLocations()"), "training location runtime should publish the runecrafting altar getter");
  assert(trainingLocationRuntimeSource.includes("windowTarget.getWoodcuttingTrainingLocations = function getWoodcuttingTrainingLocations()"), "training location runtime should publish the woodcutting getter");
  assert(statusHudRuntimeSource.includes("window.WorldStatusHudRuntime"), "world status HUD runtime should expose a runtime");
  assert(statusHudRuntimeSource.includes("function updateStats(context = {})"), "world status HUD runtime should own stat HUD painting");
  assert(worldScript.includes("worldStatusHudRuntime.updateStats(buildStatusHudRuntimeContext())"), "world.js should delegate stat HUD painting");
  assert(!worldScript.includes("document.getElementById('stat-atk').innerText"), "world.js should not paint stat HUD values inline");
  assert(skillProgressRuntimeSource.includes("window.SkillProgressRuntime"), "skill progress runtime should expose a runtime");
  assert(skillProgressRuntimeSource.includes("function addSkillXp(context = {}, skillName, amount)"), "skill progress runtime should own XP award bookkeeping");
  assert(worldScript.includes("skillProgressRuntime.addSkillXp(buildSkillProgressRuntimeContext(), skillName, amount)"), "world.js should delegate XP award bookkeeping");
  assert(!worldScript.includes("points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));"), "world.js should not own XP table math");
  assert(!worldScript.includes("playerSkills[skillName].xp += amount;"), "world.js should not mutate skill XP inline");
  assert(inventoryItemRuntimeSource.includes("window.InventoryItemRuntime"), "inventory item runtime should expose a runtime");
  assert(inventoryItemRuntimeSource.includes("function giveItem(context = {}, itemData, amount = 1)"), "inventory item runtime should own item grants");
  assert(worldScript.includes("inventoryItemRuntime.giveItem(buildInventoryItemRuntimeContext(), itemData, amount)"), "world.js should delegate item grants");
  assert(!worldScript.includes("inventory[existingIdx].amount += amount;"), "world.js should not grant stackable items inline");
  assert(equipmentItemRuntimeSource.includes("window.EquipmentItemRuntime"), "equipment item runtime should expose a runtime");
  assert(equipmentItemRuntimeSource.includes("function equipItem(context = {}, invIndex)"), "equipment item runtime should own item equips");
  assert(worldScript.includes("equipmentItemRuntime.equipItem(buildEquipmentItemRuntimeContext(), invIndex)"), "world.js should delegate item equips");
  assert(!worldScript.includes("const requiredDefenseLevel = Number.isFinite(item.requiredDefenseLevel)"), "world.js should not enforce equipment requirements inline");
  assert(foodItemRuntimeSource.includes("window.FoodItemRuntime"), "food item runtime should expose a runtime");
  assert(foodItemRuntimeSource.includes("function eatItem(context = {}, invIndex)"), "food item runtime should own food consumption");
  assert(worldScript.includes("foodItemRuntime.eatItem(buildFoodItemRuntimeContext(), invIndex)"), "world.js should delegate food consumption");
  assert(!worldScript.includes("invSlot.amount -= 1;"), "world.js should not consume food inline");
  assert(inventoryActionRuntimeSource.includes("window.InventoryActionRuntime"), "inventory action runtime should expose a runtime");
  assert(inventoryActionRuntimeSource.includes("function tryUseItemOnInventory(context = {}, sourceInvIndex, targetInvIndex)"), "inventory action runtime should own item-on-inventory dispatch");
  assert(worldScript.includes("inventoryActionRuntime.handleItemAction(buildInventoryActionRuntimeContext(), invIndex, actionName)"), "world.js should delegate inventory item actions");
  assert(!worldScript.includes("targetObj: 'INVENTORY'"), "world.js should not construct inventory skill targets inline");
  assert(!worldScript.includes("window.getMiningTrainingLocations = function getMiningTrainingLocations()"), "world.js should not publish the mining getter inline");
  assert(starterTownWorld.terrainPatches.woodcuttingRouteAnchor.x === 205 && starterTownWorld.terrainPatches.woodcuttingRouteAnchor.y === 205, "woodcutting route anchor missing");
  assert(Array.isArray(starterTownWorld.skillRoutes.woodcutting) && starterTownWorld.skillRoutes.woodcutting.length === 5, "authored woodcutting routes missing");
  assert(Array.isArray(starterTownWorld.resourceNodes.woodcutting) && starterTownWorld.resourceNodes.woodcutting.length === 82, "authored woodcutting nodes missing");
  assert(worldScript.includes("return setTreeNode(placement.x, placement.y, placement.z, placement.nodeId"), "woodcutting tree-node placement wiring missing");
  assert(woodcuttingRuntimeSource.includes("if (!draft.writers.setTree(placement)) continue;"), "woodcutting tree placement should flow through the runtime writer");
  assert(!worldScript.includes("materializeSkillWorldRuntime"), "world runtime should load authored starter-town topology directly");
  assert(worldScript.includes("function getTreeNodeAt(x, y, z = playerState.z)"), "world tree node lookup missing");
  assert(worldScript.includes("WorldTreeLifecycleRuntime"), "world.js should delegate tree lifecycle behavior through the lifecycle runtime");
  assert(treeLifecycleRuntimeSource.includes("function resolveTreeRespawnTicks(context = {}, gridX, gridY, z)"), "tree lifecycle runtime should own respawn scaling");
  assert(treeLifecycleRuntimeSource.includes("function chopDownTree(context = {}, gridX, gridY, z)"), "tree lifecycle runtime should own chop-down mutation");
  assert(treeLifecycleRuntimeSource.includes("function respawnTree(context = {}, gridX, gridY, z)"), "tree lifecycle runtime should own respawn mutation");
  assert(treeLifecycleRuntimeSource.includes("function tickTreeLifecycle(context = {})"), "tree lifecycle runtime should own tree respawn ticks");
  assert(inputRenderSource.includes("window.tickTreeLifecycle()"), "input renderer should delegate tree respawn ticks through the lifecycle hook");
  assert(!inputRenderSource.includes("for (let i = respawningTrees.length - 1;"), "input renderer should not tick respawning trees inline");
  assert(!worldScript.includes("respawningTrees.push({ x: gridX, y: gridY, z: z, respawnTick: currentTick + respawnTicks });"), "world.js should not enqueue tree respawns inline");
  assert(!worldScript.includes("logicalMap[z][gridY][gridX] = 4;"), "world.js should not mutate tree stump tiles inline");
  assert(!worldScript.includes("logicalMap[z][gridY][gridX] = 1;"), "world.js should not mutate tree respawn tiles inline");
  assert(worldScript.includes("WorldTreeNodeRuntime"), "world.js should delegate tree metadata helpers through the tree node runtime");
  assert(treeNodeRuntimeSource.includes("function createTreeNodeRecord(nodeId = 'normal_tree', options = {})"), "tree node runtime should own tree-node metadata shaping");
  assert(treeNodeRuntimeSource.includes("function rebuildTreeNodes(input = {})"), "tree node runtime should own tree-node rebuild scanning");
  assert(worldScript.includes("WorldTreeRenderRuntime"), "world.js should delegate tree visuals through the tree render runtime");
  assert(treeRenderRuntimeSource.includes("const TREE_VISUAL_PROFILES = {"), "tree visual profile table missing");
  assert(treeRenderRuntimeSource.includes("function createTreeRenderData(options = {})"), "tree render runtime should own tree instanced mesh bundle construction");
  assert(treeRenderRuntimeSource.includes("function setTreeVisualState(input)"), "tree render runtime should own tree visual state updates");
  assert(worldScript.includes("WorldChunkResourceRenderRuntime"), "world.js should delegate chunk resource render placement");
  assert(chunkResourceRenderRuntimeSource.includes("function collectChunkResourceVisualCounts(options = {})"), "chunk resource runtime should own tree/rock count collection");
  assert(chunkResourceRenderRuntimeSource.includes("function appendChunkResourceVisual(options = {})"), "chunk resource runtime should own tree/rock instance placement");
  assert(chunkResourceRenderRuntimeSource.includes("function sampleGroundTileCenterHeight(options = {}, tileX, tileY, layerZ)"), "chunk resource runtime should own rock ground-height sampling");
  assert(chunkResourceRenderRuntimeSource.includes("function setChunkTreeStumpVisual(options = {})"), "chunk resource runtime should own loaded tree stump/respawn visual updates");
  assert(!worldScript.includes("const sampleGroundTileCenterHeight = (tileX, tileY, layerZ) => {"), "world.js should not own rock ground-height sampling");
  assert(!worldScript.includes("rockVisualCounts[visualId]"), "world.js should not bucket rock visual counts inline");
  assert(!worldScript.includes("tData.treeMap[tIdx]"), "world.js should not write tree instance maps inline");
  assert(!worldScript.includes("setRockVisualState(rData, visualId, rockIndex, {"), "world.js should not place rock instances inline");
  assert(!worldScript.includes("new THREE.InstancedMesh(sharedGeometries.treeTrunk"), "world.js should not own tree instanced mesh construction");
  assert(worldScript.includes("WorldMiningPoseReferenceRuntime"), "world.js should delegate mining pose reference visuals");
  assert(miningPoseReferenceRuntimeSource.includes("function applyMiningReferenceVariant(rigRoot, variantIndex, frameNowMs, options = {})"), "mining pose reference runtime should own pose variant math");
  assert(miningPoseReferenceRuntimeSource.includes("const MINING_REFERENCE_VARIANTS = Object.freeze(["), "mining pose reference runtime should own variant metadata");
  assert(!worldScript.includes("function applyMiningReferenceVariant"), "world.js should not own mining pose variant math");

  const smithRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/smithing/index.js"), "utf8");
  assert(starterTownWorld.services.some((entry) => entry.type === "FURNACE"), "furnace world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.type === "ANVIL"), "anvil world placement missing");
  assert(smithRuntimeScript.includes("const SKILL_ID = 'smithing'"), "smithing runtime module missing skill id");
  assert(smithRuntimeScript.includes("stationType"), "smithing runtime station validation missing");
  assert(smithRuntimeScript.includes("getAnimationHeldItemId"), "smithing runtime should surface the hammer prop during clip playback");
  assert(smithRuntimeScript.includes("getAnimationSuppressEquipmentVisual"), "smithing runtime should hide equipped visuals during clip playback");
  assert(!smithRuntimeScript.includes("applyCookingStylePose"), "smithing runtime should remove the old shared procedural smithing pose");

  const inputRenderScript = inputRenderSource;
  const inputStationInteractionRuntimeScript = fs.readFileSync(path.join(root, "src/js/input-station-interaction-runtime.js"), "utf8");
  const inputPlayerAnimationRuntimeScript = fs.readFileSync(path.join(root, "src/js/input-player-animation-runtime.js"), "utf8");
  assert(inputRenderScript.includes("if (typeof window.tickFireLifecycle === 'function') window.tickFireLifecycle();"), "tick fire lifecycle hook missing from processTick");
  assert(inputRenderScript.includes("function getActiveSkillAnimationHeldItems()"), "input render should resolve dual-hand skill props");
  assert(inputRenderScript.includes("function resolveInteractionFacingRotation("), "input render should expose station-aware interaction facing");
  assert(inputRenderScript.includes("InputStationInteractionRuntime"), "input render should delegate station-aware interaction facing");
  assert(inputStationInteractionRuntimeScript.includes("function getStationInteractionFacingStep("), "station interaction runtime should centralize station-facing resolution");
  assert(inputStationInteractionRuntimeScript.includes("return { dx: -front.dx, dy: -front.dy };"), "station interaction runtime should face furnace interactions back into the furnace front");
  assert(inputRenderScript.includes("InputPlayerAnimationRuntime"), "input render should delegate player animation clip policy");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/mining1'"), "input player animation runtime should route mining through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/woodcutting1'"), "input player animation runtime should route woodcutting through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/cooking1'"), "input player animation runtime should route cooking through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/crafting1'"), "input player animation runtime should route crafting through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/runecrafting1'"), "input player animation runtime should route runecrafting through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/fletching1'"), "input player animation runtime should route fletching through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/smithing_smelting1'"), "input player animation runtime should route furnace smithing through the smelting studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/smithing_forging1'"), "input player animation runtime should route anvil smithing through the forging studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/firemaking1'"), "input player animation runtime should route firemaking through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/fishing_net1'"), "input player animation runtime should route net fishing through the studio clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/fishing_rod_hold1'"), "input player animation runtime should route rod fishing through the studio hold clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/fishing_rod_cast1'"), "input player animation runtime should request the rod cast action clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/fishing_harpoon_hold1'"), "input player animation runtime should route harpoon fishing through the studio hold clip");
  assert(inputPlayerAnimationRuntimeScript.includes("'player/fishing_harpoon_strike1'"), "input player animation runtime should request the harpoon startup action clip");
  assert(!inputRenderScript.includes("function applyPlayerCombatPose"), "legacy hardcoded combat-pose fallback should be removed");
  assert(!inputRenderScript.includes("function applyRockMiningPose"), "legacy hardcoded mining pose should be removed");
  const legacyManifestScript = fs.readFileSync(path.join(root, "src/game/platform/legacy-script-manifest.ts"), "utf8");
  assert(!legacyManifestScript.includes("skills-shared-animations"), "legacy manifest should not load the removed shared skill animations script");
  assert(!fs.existsSync(path.join(root, "src/js/skills/shared/animations.js")), "unused shared skill animations script should be deleted");
  const coreScript = fs.readFileSync(path.join(root, "src/js/core.js"), "utf8");
  const qaCommandScript = fs.readFileSync(path.join(root, "src/js/qa-command-runtime.js"), "utf8");
  const qaToolsScript = fs.readFileSync(path.join(root, "src/js/qa-tools-runtime.js"), "utf8");
  assert(coreScript.includes("typeof window.resolveInteractionFacingRotation === 'function'"), "core facing turns should consult station-aware interaction facing");
  assert(qaToolsScript.includes("function getQaDiscoveredMerchants(context)"), "QA tools merchant discovery helper missing");
  assert(qaToolsScript.includes("getWorldRouteGroup(context, 'fishing')"), "QA tools fishing-spot discovery should read world registry");
  assert(qaToolsScript.includes("function getQaOpenableMerchantIds(context)"), "QA tools openable-merchant resolver missing");
  assert(qaToolsScript.includes("getConfiguredMerchantIds === 'function'"), "QA tools openable-merchant resolver should read ShopEconomy merchant config");
  assert(qaToolsScript.includes("function formatQaOpenShopUsage(context)"), "QA tools openshop usage formatter missing");
  assert(!coreScript.includes("const qaOpenableMerchants = ['general_store'"), "core QA openshop should not hard-code merchant id list");
  assert(qaCommandScript.includes("/qa cookspots"), "QA cookspots command help missing");
  assert(qaCommandScript.includes("/qa gotocook <camp|river|dock|deep>"), "QA gotocook command help missing");
  assert(coreScript.includes("gemMineUnlocked: false"), "core player unlock flags missing gem mine default");
  assert(coreScript.includes("ringMouldUnlocked: false"), "core player unlock flags missing ring mould default");
  assert(coreScript.includes("amuletMouldUnlocked: false"), "core player unlock flags missing amulet mould default");
  assert(coreScript.includes("tiaraMouldUnlocked: false"), "core player unlock flags missing tiara mould default");
  assert(qaCommandScript.includes("/qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>"), "QA unlock help missing mould toggle options");
  assert(qaCommandScript.includes("setQaUnlockFlag', 'gemMineUnlocked', enabled"), "QA gem mine unlock handler missing");
  const manifestScript = fs.readFileSync(path.join(root, "src/js/skills/manifest.js"), "utf8");
  assert(manifestScript.includes("'crafting'"), "skill manifest missing crafting ordering");
  assert(manifestScript.includes("CRAFTING: 'crafting'"), "skill manifest missing crafting action mapping");
  assert(manifestScript.includes("skillTiles"), "skill manifest missing skill tile metadata");
  assert(manifestScript.includes("levelKey"), "skill manifest skill-tile level key metadata missing");
  const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert(indexHtml.includes('/src/main.ts'), "index missing Vite module entry");
  const legacyBridgeManifestScript = fs.readFileSync(path.join(root, "src/game/platform/legacy-script-manifest.ts"), "utf8");
  assert(legacyBridgeManifestScript.includes("../../js/skills/crafting/index.js?raw"), "legacy manifest missing crafting runtime bridge include");
  assert(!indexHtml.includes('data-skill="attack"'), "stats view should not hard-code attack tile markup");
  assert(!indexHtml.includes('id="stat-atk-level"'), "stats view should not hard-code skill level ids");
  const skillRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/runtime.js"), "utf8");
  assert(skillRuntimeScript.includes("requireAreaAccess"), "skill runtime area-access hook missing");
  assert(skillRuntimeScript.includes("getTreeNodeAt"), "skill runtime tree-node hook missing");
  assert(skillRuntimeScript.includes("return handled !== false;"), "skill runtime should allow onAnimate hooks to pass through into clip playback");
  assert(skillRuntimeScript.includes("getSkillAnimationHeldItems"), "skill runtime should expose dual-hand held-item overrides");
  assert(skillRuntimeScript.includes("getSkillAnimationHeldItemSlot"), "skill runtime should expose held-item hand overrides");
  assert(skillRuntimeScript.includes("getSkillAnimationSuppressEquipmentVisual"), "skill runtime should expose animation equipment-visibility overrides");
  const fishingRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/fishing/index.js"), "utf8");
  const playerModelSource = fs.readFileSync(path.join(root, "src/js/player-model.js"), "utf8");
  const playerModelVisualRuntimeScript = fs.readFileSync(path.join(root, "src/js/player-model-visual-runtime.js"), "utf8");
  assert(fishingRuntimeScript.includes("getAnimationHeldItemId(context)"), "fishing runtime should still resolve held-tool visuals");
  assert(playerModelVisualRuntimeScript.includes("function publishPixelSourceVisualHooks(options = {})"), "player model visual runtime should own pixel-source hook publication");
  assert(playerModelSource.includes("playerModelVisualRuntimeForPublication.publishPixelSourceVisualHooks({"), "player-model should expose pixel-source visual mesh builder through the visual runtime");
  assert(!fishingRuntimeScript.includes("alignTorsoToUpperLegFrontHinge"), "fishing runtime should remove the legacy procedural fishing pose");
  const cookingRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/cooking/index.js"), "utf8");
  assert(cookingRuntimeScript.includes("getAnimationSuppressEquipmentVisual"), "cooking runtime should request empty hands during clip playback");
  assert(!cookingRuntimeScript.includes("applyCookingStylePose"), "cooking runtime should remove the legacy procedural cooking pose");
  const craftingRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/crafting/index.js"), "utf8");
  assert(craftingRuntimeScript.includes("getAnimationSuppressEquipmentVisual"), "crafting runtime should request empty hands during clip playback");
  const firemakingRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/firemaking/index.js"), "utf8");
  assert(firemakingRuntimeScript.includes("getAnimationHeldItemId"), "firemaking runtime should surface the tinderbox prop during clip playback");
  assert(firemakingRuntimeScript.includes("getAnimationHeldItemSlot"), "firemaking runtime should request the left-hand prop slot");
  assert(firemakingRuntimeScript.includes("getAnimationSuppressEquipmentVisual"), "firemaking runtime should hide equipped weapons during clip playback");
  assert(!firemakingRuntimeScript.includes("rig.rightLowerArm.rotation.set(-0.6 + (s * 0.35), -0.1, 0);"), "firemaking runtime should remove the legacy procedural firemaking pose");
  const woodcutRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/woodcutting/index.js"), "utf8");
  assert(woodcutRuntimeScript.includes("const TREE_NODE_NAMES ="), "woodcutting runtime tree naming table missing");
  assert(woodcutRuntimeScript.includes("context.getTreeNodeAt"), "woodcutting runtime tree-node resolver missing");
  assert(woodcutRuntimeScript.includes("you must be level ${requiredLevel} woodcutting to chop this tree"), "woodcutting level warning message missing");
  const rcRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/runecrafting/index.js"), "utf8");
  assert(rcRuntimeScript.includes("function tryFillPouchFromInventory"), "runecrafting pouch fill handler missing");
  assert(rcRuntimeScript.includes("function tryEmptyPouchToInventory"), "runecrafting pouch empty handler missing");
  assert(rcRuntimeScript.includes("getAnimationSuppressEquipmentVisual"), "runecrafting runtime should hide equipped gear during clip playback");

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
