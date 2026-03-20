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

  const rodMethod = fishSpec.nodeTable.shallow_water.methods && fishSpec.nodeTable.shallow_water.methods.rod;
  assert(!!rodMethod, "rod method spec missing");
  assert(Array.isArray(rodMethod.toolIds) && rodMethod.toolIds.includes("fishing_rod"), "rod tool requirement missing");
  assert(!!rodMethod.extraRequirement && rodMethod.extraRequirement.itemId === "bait", "rod bait requirement missing");
  assert(rodMethod.extraRequirement.consumeOn === "success", "rod bait consumption rule mismatch");

  const deepMixed = fishSpec.nodeTable.deep_water.methods && fishSpec.nodeTable.deep_water.methods.deep_harpoon_mixed;
  const deepRune = fishSpec.nodeTable.deep_water.methods && fishSpec.nodeTable.deep_water.methods.deep_rune_harpoon;
  assert(!!deepMixed && !!deepRune, "deep water method split missing");
  const mixedFish = deepMixed.fishByLevel && deepMixed.fishByLevel[0] ? deepMixed.fishByLevel[0].fish : [];
  assert(Array.isArray(mixedFish) && mixedFish.some((f) => f.itemId === "raw_tuna") && mixedFish.some((f) => f.itemId === "raw_swordfish"), "mixed deep-water table mismatch");
  const runeFish = deepRune.fishByLevel && deepRune.fishByLevel[0] ? deepRune.fishByLevel[0].fish : [];
  assert(Array.isArray(runeFish) && runeFish.length === 1 && runeFish[0].itemId === "raw_swordfish", "rune deep-water table mismatch");

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

  let previousCookingBurn = SkillSpecRegistry.computeCookingBurnChance(10, 10);
  for (let delta = 1; delta <= 30; delta++) {
    const nextCookingBurn = SkillSpecRegistry.computeCookingBurnChance(10 + delta, 10);
    assert(nextCookingBurn <= previousCookingBurn + 1e-9, "cooking burn curve should be monotonic");
    previousCookingBurn = nextCookingBurn;
  }

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
  assert(itemDefs.bait.value === 2, "item catalog bait value mismatch");
  assert(itemDefs.fishing_rod.value === 45, "item catalog fishing rod missing");
  assert(itemDefs.harpoon.value === 110, "item catalog harpoon missing");
  assert(itemDefs.rune_harpoon.value === 2500, "item catalog rune harpoon missing");
  assert(itemDefs.raw_swordfish.value === 40, "item catalog swordfish missing");
  [
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
    "burnt_swordfish"
  ].forEach((itemId) => {
    assert(itemDefs[itemId] && itemDefs[itemId].icon && itemDefs[itemId].icon.assetId === itemId, `item catalog fish icon should be bespoke for ${itemId}`);
  });

  global.playerState = { merchantProgress: {} };
  loadBrowserScript(root, "src/js/shop-economy.js");
  const shopEconomy = window.ShopEconomy;
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
      "depletionChance: 0.1,",
      "depletionChance: 0.95,",
      "woodcutting-balance-curve"
    ),
    /woodcutting balance curve mismatch/i,
    "woodcutting-balance-curve"
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
  assert(shopEconomy.canMerchantBuyItem("yew_longbow", "advanced_fletcher"), "advanced fletcher should buy yew longbow");
  assert(shopEconomy.canMerchantBuyItem("plain_staff_oak", "advanced_fletcher"), "advanced fletcher should buy plain oak staff");
  assert(!shopEconomy.canMerchantSellItem("yew_longbow", "advanced_fletcher"), "advanced fletcher should not sell stock");
  assert(shopEconomy.resolveSellPrice("yew_longbow", "advanced_fletcher") === 100, "advanced fletcher yew longbow sell price mismatch");
  assert(shopEconomy.resolveSellPrice("plain_staff_oak", "advanced_fletcher") === Math.floor(itemDefs.plain_staff_oak.value * 0.5), "advanced fletcher plain staff fallback price mismatch");
  const cookingSpec = SkillSpecRegistry.getSkillSpec("cooking");
  assert(!!cookingSpec && !!cookingSpec.economy, "cooking economy tables missing");
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

  assert(shopEconomy.canMerchantSellItem("small_net", "fishing_supplier"), "supplier should sell small net by default");
  assert(shopEconomy.canMerchantSellItem("fishing_rod", "fishing_supplier"), "supplier should sell fishing rod by default");
  assert(shopEconomy.canMerchantSellItem("harpoon", "fishing_supplier"), "supplier should sell harpoon by default");
  assert(shopEconomy.canMerchantSellItem("bait", "fishing_supplier"), "supplier should sell bait by default");
  assert(shopEconomy.canMerchantBuyItem("cooked_shrimp", "fishing_supplier"), "supplier should buy cooked fish");
  assert(shopEconomy.canMerchantBuyItem("burnt_shrimp", "fishing_supplier"), "supplier should buy burnt fish");
  assert(!shopEconomy.canMerchantBuyItem("cooked_shrimp", "fishing_teacher"), "teacher should not buy cooked fish");
  assert(!shopEconomy.canMerchantSellItem("small_net", "fishing_teacher"), "teacher should not sell small net by default");
  assert(!shopEconomy.canMerchantSellItem("rune_harpoon", "fishing_teacher"), "teacher should not sell rune harpoon by default");

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
  assert(shopEconomy.resolveSellPrice("ruby_gold_ring", "elira_gemhand") === 80, "elira ruby gold ring sell price mismatch");
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

  const fletchRows = Object.keys(fletchSpec.recipeSet).map((id) => ({ recipeId: id, recipe: fletchSpec.recipeSet[id] }));
  const smithRows = Object.keys(smithSpec.recipeSet).map((id) => ({ recipeId: id, recipe: smithSpec.recipeSet[id] }));
  const craftingRows = Object.keys(craftingSpec.recipeSet).map((id) => ({ recipeId: id, recipe: craftingSpec.recipeSet[id] }));

  const standardCraftingFamilies = new Set(["gem_cutting", "staff_attachment", "jewelry_gem_attachment"]);
  const immediateCraftingFamilies = new Set(["strapped_handle", "tool_weapon_assembly"]);

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

  ["gem_cutting", "staff_attachment", "jewelry_gem_attachment"].forEach((family) => {
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
  assert(firemakingAction.context.playerState.action === "IDLE", "firemaking should stop cleanly after the success delay");
  assert(firemakingAction.context.playerState.firemakingSession === null, "firemaking should clear the session after the success delay");
  assert(firemakingAction.context.playerState.turnLock === false, "firemaking should release turn lock after finishing");
  assert(firemakingAction.getStopActionCalls() >= 1, "firemaking should stop the active action when finished");
  assert(firemakingAction.getStepAfterCalls() === 0, "firemaking cleanup should not step after lighting the fire");

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
  const worldContractsSource = fs.readFileSync(path.join(root, "src/game/contracts/world.ts"), "utf8");
  const runtimePublishSource = fs.readFileSync(path.join(root, "src/game/world/runtime-publish.ts"), "utf8");
  const cloneSource = fs.readFileSync(path.join(root, "src/game/world/clone.ts"), "utf8");
  const miningRuntimeSource = fs.readFileSync(path.join(root, "src/game/world/mining-runtime.ts"), "utf8");
  const runecraftingRuntimeSource = fs.readFileSync(path.join(root, "src/game/world/runecrafting-runtime.ts"), "utf8");
  const woodcuttingRuntimeSource = fs.readFileSync(path.join(root, "src/game/world/woodcutting-runtime.ts"), "utf8");
  const inputRenderSource = fs.readFileSync(path.join(root, "src/js/input-render.js"), "utf8");
  const npcDialogueCatalogSource = fs.readFileSync(path.join(root, "src/js/content/npc-dialogue-catalog.js"), "utf8");
  const npcDialogueRuntimeSource = fs.readFileSync(path.join(root, "src/js/npc-dialogue-runtime.js"), "utf8");
  const npcPlayerModelSource = fs.readFileSync(path.join(root, "src/js/player-model.js"), "utf8");
  const starterTownWorld = JSON.parse(fs.readFileSync(path.join(root, "content/world/regions/starter_town.json"), "utf8"));
  assert(!!NpcDialogueCatalog && typeof NpcDialogueCatalog.resolveDialogueId === "function", "npc dialogue catalog resolver missing");
  assert(worldContractsSource.includes("appearanceId?: string | null;"), "world contracts should expose appearanceId on NPC/service descriptors");
  assert(worldContractsSource.includes("dialogueId?: string | null;"), "world contracts should expose dialogueId on NPC/service descriptors");
  assert(runtimePublishSource.includes("appearanceId: typeof entry.appearanceId === \"string\""), "runtime publish should preserve appearanceId");
  assert(runtimePublishSource.includes("dialogueId: typeof entry.dialogueId === \"string\""), "runtime publish should preserve dialogueId");
  assert(cloneSource.includes("appearanceId: resolveServiceAppearanceId(service)"), "merchant NPC descriptors should resolve appearanceId");
  assert(cloneSource.includes("dialogueId: typeof service.dialogueId === \"string\" ? service.dialogueId.trim() || null : null"), "merchant NPC descriptors should preserve dialogueId");
  assert(worldScript.includes("if (appearanceId) npcUid.appearanceId = appearanceId;"), "world NPC hitboxes should preserve appearanceId");
  assert(worldScript.includes("if (typeof npc.dialogueId === 'string' && npc.dialogueId.trim()) npcUid.dialogueId = npc.dialogueId.trim();"), "world NPC hitboxes should preserve dialogueId");
  assert(inputRenderSource.includes("playerState.targetUid.action === 'Talk-to'"), "input renderer should route Talk-to actions");
  assert(inputRenderSource.includes("window.openNpcDialogue(playerState.targetUid);"), "input renderer should open NPC dialogue from Talk-to");
  assert(npcDialogueCatalogSource.includes("const DIALOGUE_ENTRIES = {"), "npc dialogue catalog should define dialogue entries");
  assert(npcDialogueRuntimeSource.includes("window.NpcDialogueCatalog.getDialogueEntryByNpc(npc)"), "npc dialogue runtime should resolve dialogue entries through the catalog helper");
  assert(npcDialogueRuntimeSource.includes("window.NpcDialogueCatalog.resolveDialogueIdFromNpc(normalizedNpc)"), "npc dialogue runtime should preserve the resolved dialogue id from full NPC metadata");
  assert(npcDialogueRuntimeSource.includes("window.openNpcDialogue = openNpcDialogue;"), "npc dialogue runtime should expose openNpcDialogue");
  assert(npcPlayerModelSource.includes("normalizedPresetId !== 'goblin' && normalizedPresetId !== 'guard' && normalizedPresetId !== 'tanner_rusk' && normalizedPresetId !== 'tanner'"), "player model should allow the Tanner NPC preset");
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
  assert(worldScript.includes("new THREE.BoxGeometry(3, 2.6, 3)"), "runecrafting altar click-box regression");
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
  assert(worldScript.includes("window.getFishingTrainingLocations = function getFishingTrainingLocations()"), "fishing training location getter missing");
  assert(worldScript.includes("window.getCookingTrainingLocations = function getCookingTrainingLocations()"), "cooking training location getter missing");
  assert(worldScript.includes("function addAshesGroundVisual(group, itemData)"), "ashes ground-item visual helper missing");
  assert(worldScript.includes("function resolveFishGroundVisual(itemData)"), "fish ground-item visual resolver missing");
  assert(worldScript.includes("function addFishGroundVisual(group, itemData, visual)"), "fish ground-item visual helper missing");
  assert(worldScript.includes("function buildFishPixelGroundVisualMeshes(pixelSource, visual)"), "fish ground-item silhouette builder missing");
  assert(worldScript.includes("function queueFishGroundVisualMeshes(group, itemData, visual)"), "fish ground-item pixel-source queue missing");
  assert(worldScript.includes("addGroundItemSprite(group, spritePath, 0.17, 0.42);"), "ashes ground items should preview the pixel icon above the mound");
  assert(!worldScript.includes("seedCookingTrainingFires();"), "cooking training fires should not seed on renderer init");
  assert(worldScript.includes("const FIRE_LIFETIME_TICKS = resolveFireLifetimeTicks();"), "fire lifetime should resolve from firemaking data");
  assert(worldScript.includes("SkillSpecRegistry.getRecipeSet('firemaking')"), "fire lifetime resolver should read firemaking recipe data");
  assert(worldScript.includes("function tickFireLifecycle()"), "fire lifecycle tick helper missing");
  assert(worldScript.includes("function tryStepBeforeFiremaking()"), "firemaking should expose the pre-ignition step helper");
  assert(worldScript.includes("function syncFiremakingLogPreview()"), "firemaking should render a temporary log preview on the origin tile");
  assert(worldScript.includes("window.tickFireLifecycle = tickFireLifecycle;"), "fire lifecycle tick export missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "borin_ironvein"), "borin world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "thrain_deepforge"), "thrain world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "elira_gemhand"), "elira world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "crafting_teacher"), "crafting teacher world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.merchantId === "tanner_rusk"), "tanner world placement missing");
  assert(Array.isArray(starterTownWorld.combatSpawns) && starterTownWorld.combatSpawns.length === 50, "starter combat spawns missing");
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
  assert(worldScript.includes("window.getMiningTrainingLocations = function getMiningTrainingLocations()"), "mining training location getter missing");
  assert(starterTownWorld.terrainPatches.woodcuttingRouteAnchor.x === 205 && starterTownWorld.terrainPatches.woodcuttingRouteAnchor.y === 205, "woodcutting route anchor missing");
  assert(Array.isArray(starterTownWorld.skillRoutes.woodcutting) && starterTownWorld.skillRoutes.woodcutting.length === 5, "authored woodcutting routes missing");
  assert(Array.isArray(starterTownWorld.resourceNodes.woodcutting) && starterTownWorld.resourceNodes.woodcutting.length === 82, "authored woodcutting nodes missing");
  assert(worldScript.includes("return setTreeNode(placement.x, placement.y, placement.z, placement.nodeId"), "woodcutting tree-node placement wiring missing");
  assert(woodcuttingRuntimeSource.includes("if (!draft.writers.setTree(placement)) continue;"), "woodcutting tree placement should flow through the runtime writer");
  assert(!worldScript.includes("materializeSkillWorldRuntime"), "world runtime should load authored starter-town topology directly");
  assert(worldScript.includes("function getTreeNodeAt(x, y, z = playerState.z)"), "world tree node lookup missing");
  assert(worldScript.includes("function resolveTreeRespawnTicks(gridX, gridY, z)"), "woodcutting respawn scaling helper missing");
  assert(worldScript.includes("const TREE_VISUAL_PROFILES = {"), "tree visual profile table missing");

  const smithRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/smithing/index.js"), "utf8");
  assert(starterTownWorld.services.some((entry) => entry.type === "FURNACE"), "furnace world placement missing");
  assert(starterTownWorld.services.some((entry) => entry.type === "ANVIL"), "anvil world placement missing");
  assert(smithRuntimeScript.includes("const SKILL_ID = 'smithing'"), "smithing runtime module missing skill id");
  assert(smithRuntimeScript.includes("stationType"), "smithing runtime station validation missing");
  assert(smithRuntimeScript.includes("getAnimationHeldItemId"), "smithing runtime should surface the hammer prop during clip playback");
  assert(smithRuntimeScript.includes("getAnimationSuppressEquipmentVisual"), "smithing runtime should hide equipped visuals during clip playback");
  assert(!smithRuntimeScript.includes("applyCookingStylePose"), "smithing runtime should remove the old shared procedural smithing pose");

  const inputRenderScript = inputRenderSource;
  assert(inputRenderScript.includes("if (typeof window.tickFireLifecycle === 'function') window.tickFireLifecycle();"), "tick fire lifecycle hook missing from processTick");
  assert(inputRenderScript.includes("function getActiveSkillAnimationHeldItems()"), "input render should resolve dual-hand skill props");
  assert(inputRenderScript.includes("function resolveInteractionFacingRotation("), "input render should expose station-aware interaction facing");
  assert(inputRenderScript.includes("function getStationInteractionFacingStep("), "input render should centralize station-facing resolution");
  assert(inputRenderScript.includes("return { dx: -front.dx, dy: -front.dy };"), "input render should face furnace interactions back into the furnace front");
  assert(inputRenderScript.includes("'player/mining1'"), "input render should route mining through the studio clip");
  assert(inputRenderScript.includes("'player/woodcutting1'"), "input render should route woodcutting through the studio clip");
  assert(inputRenderScript.includes("'player/cooking1'"), "input render should route cooking through the studio clip");
  assert(inputRenderScript.includes("'player/crafting1'"), "input render should route crafting through the studio clip");
  assert(inputRenderScript.includes("'player/runecrafting1'"), "input render should route runecrafting through the studio clip");
  assert(inputRenderScript.includes("'player/fletching1'"), "input render should route fletching through the studio clip");
  assert(inputRenderScript.includes("'player/smithing_smelting1'"), "input render should route furnace smithing through the smelting studio clip");
  assert(inputRenderScript.includes("'player/smithing_forging1'"), "input render should route anvil smithing through the forging studio clip");
  assert(inputRenderScript.includes("'player/firemaking1'"), "input render should route firemaking through the studio clip");
  assert(inputRenderScript.includes("'player/fishing_net1'"), "input render should route net fishing through the studio clip");
  assert(inputRenderScript.includes("'player/fishing_rod_hold1'"), "input render should route rod fishing through the studio hold clip");
  assert(inputRenderScript.includes("'player/fishing_rod_cast1'"), "input render should request the rod cast action clip");
  assert(inputRenderScript.includes("'player/fishing_harpoon_hold1'"), "input render should route harpoon fishing through the studio hold clip");
  assert(inputRenderScript.includes("'player/fishing_harpoon_strike1'"), "input render should request the harpoon startup action clip");
  assert(!inputRenderScript.includes("function applyPlayerCombatPose"), "legacy hardcoded combat-pose fallback should be removed");
  assert(!inputRenderScript.includes("function applyRockMiningPose"), "legacy hardcoded mining pose should be removed");
  const legacyManifestScript = fs.readFileSync(path.join(root, "src/game/platform/legacy-script-manifest.ts"), "utf8");
  assert(!legacyManifestScript.includes("skills-shared-animations"), "legacy manifest should not load the removed shared skill animations script");
  assert(!fs.existsSync(path.join(root, "src/js/skills/shared/animations.js")), "unused shared skill animations script should be deleted");
  const coreScript = fs.readFileSync(path.join(root, "src/js/core.js"), "utf8");
  assert(coreScript.includes("typeof window.resolveInteractionFacingRotation === 'function'"), "core facing turns should consult station-aware interaction facing");
  assert(coreScript.includes("function getQaDiscoveredMerchants()"), "core QA merchant discovery helper missing");
  assert(coreScript.includes("getWorldRouteGroup('fishing')"), "core QA fishing-spot discovery should read world registry");
  assert(coreScript.includes("function getQaOpenableMerchantIds()"), "core QA openable-merchant resolver missing");
  assert(coreScript.includes("getConfiguredMerchantIds === 'function'"), "core QA openable-merchant resolver should read ShopEconomy merchant config");
  assert(coreScript.includes("function formatQaOpenShopUsage()"), "core QA openshop usage formatter missing");
  assert(!coreScript.includes("const qaOpenableMerchants = ['general_store'"), "core QA openshop should not hard-code merchant id list");
  assert(coreScript.includes("/qa cookspots"), "core QA cookspots command help missing");
  assert(coreScript.includes("/qa gotocook <camp|river|dock|deep>"), "core QA gotocook command help missing");
  assert(coreScript.includes("gemMineUnlocked: false"), "core player unlock flags missing gem mine default");
  assert(coreScript.includes("ringMouldUnlocked: false"), "core player unlock flags missing ring mould default");
  assert(coreScript.includes("amuletMouldUnlocked: false"), "core player unlock flags missing amulet mould default");
  assert(coreScript.includes("tiaraMouldUnlocked: false"), "core player unlock flags missing tiara mould default");
  assert(coreScript.includes("/qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>"), "core QA unlock help missing mould toggle options");
  assert(coreScript.includes("setQaUnlockFlag('gemMineUnlocked', value === 'on');"), "core QA gem mine unlock handler missing");
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
  assert(fishingRuntimeScript.includes("getAnimationHeldItemId(context)"), "fishing runtime should still resolve held-tool visuals");
  assert(playerModelSource.includes("window.createPixelSourceVisualMeshes = createPixelSourceVisualMeshes;"), "player-model should expose pixel-source visual mesh builder");
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
