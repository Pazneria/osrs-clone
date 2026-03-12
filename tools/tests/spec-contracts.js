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

function replaceOnce(source, from, to, label) {
  const next = source.replace(from, to);
  assert(next !== source, "test setup failed (" + label + ")");
  return next;
}


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
  assert(itemDefs.bait.value === 2, "item catalog bait value mismatch");
  assert(itemDefs.fishing_rod.value === 45, "item catalog fishing rod missing");
  assert(itemDefs.harpoon.value === 110, "item catalog harpoon missing");
  assert(itemDefs.rune_harpoon.value === 2500, "item catalog rune harpoon missing");
  assert(itemDefs.raw_swordfish.value === 40, "item catalog swordfish missing");

  global.playerState = { merchantProgress: {} };
  loadBrowserScript(root, "src/js/shop-economy.js");
  const shopEconomy = window.ShopEconomy;
  assert(!!shopEconomy, "shop economy API missing");

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

  const nonLogsRows = woodcuttingDemand.rows.filter((entry) => entry && entry.logItemId !== "logs");
  nonLogsRows.forEach((row) => {
    assert(Array.isArray(row.consumers.firemaking) && row.consumers.firemaking.length === 0, "firemaking should remain single-tier for " + row.logItemId);
  });

  expectMutatedSpecsFailure(
    root,
    (source) => replaceOnce(
      source,
      "sourceItemId: 'logs',",
      "sourceItemId: 'oak_logs',",
      "firemaking-tier-regression"
    ),
    /must remain single-tier and consume only logs/i,
    "firemaking-tier-regression"
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
  loadBrowserScript(root, "src/js/skills/mining/index.js");
  const skillModules = window.SkillModules || {};
  assert(!!skillModules.fletching && typeof skillModules.fletching.onUseItem === "function", "fletching runtime module missing onUseItem");
  assert(!!skillModules.crafting && typeof skillModules.crafting.onUseItem === "function", "crafting runtime module missing onUseItem");
  assert(!!skillModules.mining && typeof skillModules.mining.onStart === "function", "mining runtime module missing onStart");

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
  function makeMiningContext(unlocked) {
    const messages = [];
    let started = false;
    let unlockedState = !!unlocked;

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

  miningUnlocked.messages.length = 0;
  miningUnlocked.setUnlocked(false);
  skillModules.mining.onTick(miningUnlocked.context);
  assert(miningUnlocked.messages.some((entry) => /gem mine is locked/i.test(entry.message)), "mining should re-check gem-mine gate during active ticks");
  assert(miningUnlocked.context.playerState.action === "IDLE", "mining should stop if gem-mine access is lost mid-session");
  const worldScript = fs.readFileSync(path.join(root, "src/js/world.js"), "utf8");
  assert(worldScript.includes("new THREE.BoxGeometry(3, 2.6, 3)"), "runecrafting altar click-box regression");
  assert(worldScript.includes("for (let by = placed.y - 1; by <= placed.y + 2; by++)"), "runecrafting altar collision footprint regression");
  assert(worldScript.includes("const runecraftingAltarBandSpecs = ["), "runecrafting structured altar bands missing");
  assert(worldScript.includes("const castleRouteAnchor = { x: 205, y: 205 };"), "runecrafting castle route anchor missing");
  assert(worldScript.includes("const runecraftingAltarOrder = ['Ember Altar', 'Water Altar', 'Earth Altar', 'Air Altar'];"), "runecrafting altar order missing");
  assert(worldScript.includes("const emberAltar = altarCandidatesToRender.find((altar) => altar && altar.label === 'Ember Altar') || null;"), "rune tutor anchor should target ember altar");
  assert(worldScript.includes("const airAltar = altarCandidatesToRender.find((altar) => altar && altar.label === 'Air Altar') || null;"), "combination sage anchor should target air altar");
  assert(worldScript.includes("{ name: 'Rune Tutor', merchantId: 'rune_tutor', type: 3, anchor: emberAltar }"), "rune tutor merchant role wiring missing");
  assert(worldScript.includes("{ name: 'Combination Sage', merchantId: 'combination_sage', type: 6, anchor: airAltar }"), "combination sage merchant role wiring missing");
  assert(worldScript.includes("Fishing Teacher"), "fishing teacher world placement missing");
  assert(worldScript.includes("Fishing Supplier"), "fishing supplier world placement missing");
  assert(worldScript.includes("merchantId: 'fishing_supplier'"), "fishing supplier merchant wiring missing");
  assert(worldScript.includes("merchantId: 'fishing_teacher'"), "fishing teacher merchant wiring missing");
  assert(worldScript.includes("const cookingRouteSpecs = ["), "cooking route specs missing");
  assert(worldScript.includes("routeId: 'starter_campfire'"), "starter campfire route missing");
  assert(worldScript.includes("routeId: 'riverbank_fire_line'"), "riverbank cooking route missing");
  assert(worldScript.includes("routeId: 'dockside_fire_line'"), "dockside cooking route missing");
  assert(worldScript.includes("routeId: 'deep_water_dock_fire_line'"), "deep-water cooking route missing");
  assert(worldScript.includes("window.getCookingTrainingLocations = function getCookingTrainingLocations()"), "cooking training location getter missing");
  assert(!worldScript.includes("seedCookingTrainingFires();"), "cooking training fires should not seed on renderer init");
  assert(worldScript.includes("const FIRE_LIFETIME_TICKS = resolveFireLifetimeTicks();"), "fire lifetime should resolve from firemaking data");
  assert(worldScript.includes("SkillSpecRegistry.getRecipeSet('firemaking')"), "fire lifetime resolver should read firemaking recipe data");
  assert(worldScript.includes("function tickFireLifecycle()"), "fire lifecycle tick helper missing");
  assert(worldScript.includes("window.tickFireLifecycle = tickFireLifecycle;"), "fire lifecycle tick export missing");
  assert(worldScript.includes("Borin Ironvein"), "borin world placement missing");
  assert(worldScript.includes("Thrain Deepforge"), "thrain world placement missing");
  assert(worldScript.includes("Elira Gemhand"), "elira world placement missing");
  assert(worldScript.includes("Crafting Teacher"), "crafting teacher world placement missing");
  assert(worldScript.includes("Tanner Rusk"), "tanner world placement missing");
  assert(worldScript.includes("merchantId: 'borin_ironvein'"), "borin merchant wiring missing");
  assert(worldScript.includes("merchantId: 'thrain_deepforge'"), "thrain merchant wiring missing");
  assert(worldScript.includes("merchantId: 'elira_gemhand'"), "elira merchant wiring missing");
  assert(worldScript.includes("merchantId: 'crafting_teacher'"), "crafting teacher merchant wiring missing");
  assert(worldScript.includes("merchantId: 'tanner_rusk'"), "tanner merchant wiring missing");
  assert(worldScript.includes("const miningZoneSpecs = ["), "mining zone specs missing");
  assert(worldScript.includes("zoneId: 'starter_mine'"), "starter mining zone missing");
  assert(worldScript.includes("areaGateFlag: 'gemMineUnlocked'"), "gem mine zone gate flag missing");
  assert(worldScript.includes("areaGateMessage: 'The gem mine is locked. Speak with Elira Gemhand to gain access.'"), "gem mine zone gate message missing");
  assert(worldScript.includes("function setMiningRockAt(x, y, z, oreType, options = {})"), "mining rock placement should accept area-gate options");
  assert(worldScript.includes("areaGateFlag: zoneSpec.areaGateFlag || null"), "mining zone area-gate metadata should flow into rock placement");
  assert(worldScript.includes("window.getMiningTrainingLocations = function getMiningTrainingLocations()"), "mining training location getter missing");
  assert(worldScript.includes("const woodcuttingRouteAnchor = { x: 205, y: 205 };"), "woodcutting route anchor missing");
  assert(worldScript.includes("const woodcuttingZoneSpecs = ["), "woodcutting zone specs missing");
  assert(worldScript.includes("setTreeNode(candidate.x, candidate.y, candidate.z, zoneSpec.nodeId"), "woodcutting tree-node placement wiring missing");
  assert(worldScript.includes("function getTreeNodeAt(x, y, z = playerState.z)"), "world tree node lookup missing");
  assert(worldScript.includes("function resolveTreeRespawnTicks(gridX, gridY, z)"), "woodcutting respawn scaling helper missing");
  assert(worldScript.includes("const TREE_VISUAL_PROFILES = {"), "tree visual profile table missing");

  const smithRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/smithing/index.js"), "utf8");
  assert(worldScript.includes("type: 'FURNACE'"), "furnace world placement missing");
  assert(worldScript.includes("type: 'ANVIL'"), "anvil world placement missing");
  assert(smithRuntimeScript.includes("const SKILL_ID = 'smithing'"), "smithing runtime module missing skill id");
  assert(smithRuntimeScript.includes("stationType"), "smithing runtime station validation missing");

  const inputRenderScript = fs.readFileSync(path.join(root, "src/js/input-render.js"), "utf8");
  assert(inputRenderScript.includes("if (typeof window.tickFireLifecycle === 'function') window.tickFireLifecycle();"), "tick fire lifecycle hook missing from processTick");
  const coreScript = fs.readFileSync(path.join(root, "src/js/core.js"), "utf8");
  assert(coreScript.includes("borin_ironvein"), "core QA smithing merchant alias missing");
  assert(coreScript.includes("thrain_deepforge"), "core QA smithing merchant alias missing");
  assert(coreScript.includes("elira_gemhand"), "core QA smithing merchant alias missing");
  assert(coreScript.includes("crafting_teacher"), "core QA crafting merchant alias missing");
  assert(coreScript.includes("tanner_rusk"), "core QA tanner merchant alias missing");
  assert(coreScript.includes("/qa openshop <general_store|fishing_supplier|fishing_teacher|rune_tutor|combination_sage|forester_teacher|advanced_woodsman|fletching_supplier|advanced_fletcher|borin_ironvein|thrain_deepforge|elira_gemhand|crafting_teacher|tanner_rusk>"), "core QA openshop help missing merchant list entries");
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
  const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert(indexHtml.includes("./src/js/skills/crafting/index.js"), "index missing crafting runtime script include");
  const skillRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/runtime.js"), "utf8");
  assert(skillRuntimeScript.includes("requireAreaAccess"), "skill runtime area-access hook missing");
  assert(skillRuntimeScript.includes("getTreeNodeAt"), "skill runtime tree-node hook missing");
  const woodcutRuntimeScript = fs.readFileSync(path.join(root, "src/js/skills/woodcutting/index.js"), "utf8");
  assert(woodcutRuntimeScript.includes("const TREE_NODE_NAMES ="), "woodcutting runtime tree naming table missing");
  assert(woodcutRuntimeScript.includes("context.getTreeNodeAt"), "woodcutting runtime tree-node resolver missing");
  assert(woodcutRuntimeScript.includes("you must be level ${requiredLevel} woodcutting to chop this tree"), "woodcutting level warning message missing");
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
