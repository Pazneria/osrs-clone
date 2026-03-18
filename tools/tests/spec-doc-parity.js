const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { loadRuntimeSkillSpecs } = require("../content/runtime-skill-specs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRegex(haystack, regex, message) {
  if (!regex.test(haystack)) throw new Error(message);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPercent(value) {
  return `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

function toTitleCaseId(id) {
  return String(id)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roundMetric(value) {
  return Math.round(value * 10000) / 10000;
}

function formatMetric(value) {
  return roundMetric(value).toFixed(4);
}

function computeWoodcuttingOutputs(spec, node, options) {
  const level = options.level;
  const toolPower = options.toolPower;
  const speedBonusTicks = options.speedBonusTicks;
  const successChance = (level + toolPower) / ((level + toolPower) + node.difficulty);
  const intervalTicks = Math.max(spec.timing.minimumAttemptTicks, spec.timing.baseAttemptTicks - speedBonusTicks);
  const activeLogsPerTick = successChance / intervalTicks;
  const sellValue = spec.economy.valueTable[node.rewardItemId].sell;
  const activeXpPerTick = activeLogsPerTick * node.xpPerSuccess;
  const activeGoldPerTick = activeLogsPerTick * sellValue;
  const expectedLogsPerNode = 1 / node.depletionChance;
  const activeTicksPerNode = expectedLogsPerNode / activeLogsPerTick;
  const sustainedLogsPerTick = expectedLogsPerNode / (activeTicksPerNode + node.respawnTicks);
  const sustainedXpPerTick = sustainedLogsPerTick * node.xpPerSuccess;
  const sustainedGoldPerTick = sustainedLogsPerTick * sellValue;

  return {
    activeLogsPerTick,
    activeXpPerTick,
    activeGoldPerTick,
    sustainedLogsPerTick,
    sustainedXpPerTick,
    sustainedGoldPerTick
  };
}

function loadItemDefs(projectRoot) {
  const itemCatalogPath = path.join(projectRoot, "src", "js", "content", "item-catalog.js");
  const code = fs.readFileSync(itemCatalogPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: itemCatalogPath });
  const root = sandbox.window && sandbox.window.ItemCatalog;
  if (!root || !root.ITEM_DEFS) throw new Error("Failed to load item catalog");
  return root.ITEM_DEFS;
}

function findLine(lines, predicate) {
  for (const line of lines) {
    if (predicate(line)) return line;
  }
  return null;
}

function readRoadmap(root, skillId) {
  return fs.readFileSync(path.join(root, "src", "js", "skills", skillId, "ROADMAP.md"), "utf8");
}

function assertCanonicalHeader(skillId, roadmap, version) {
  assertRegex(roadmap, /## Canonical Runtime Source/, `${skillId} roadmap missing canonical runtime source section`);
  assertRegex(roadmap, new RegExp(escapeRegex(version)), `${skillId} roadmap missing runtime version ${version}`);
}

function runWoodcuttingChecks(roadmap, spec) {
  const lines = roadmap.split(/\r?\n/);
  assertRegex(
    roadmap,
    new RegExp(`\\|\\s*Base Attempt Ticks\\s*\\|\\s*${spec.timing.baseAttemptTicks}\\s*\\|`),
    "woodcutting roadmap base attempt ticks mismatch"
  );
  assertRegex(
    roadmap,
    new RegExp(`\\|\\s*Minimum Attempt Ticks\\s*\\|\\s*${spec.timing.minimumAttemptTicks}\\s*\\|`),
    "woodcutting roadmap minimum attempt ticks mismatch"
  );

  const treeRows = [
    { label: "Normal Tree", nodeId: "normal_tree" },
    { label: "Oak Tree", nodeId: "oak_tree" },
    { label: "Willow Tree", nodeId: "willow_tree" },
    { label: "Maple Tree", nodeId: "maple_tree" },
    { label: "Yew Tree", nodeId: "yew_tree" }
  ];
  for (const row of treeRows) {
    const node = spec.nodeTable[row.nodeId];
    const line = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${node.requiredLevel}\\s*\\|\\s*${node.xpPerSuccess}\\s*\\|\\s*${node.difficulty}\\s*\\|`).test(entry));
    assert(!!line, `woodcutting roadmap row mismatch for ${row.label}`);
    assert(new RegExp(`\\|\\s*${Number(node.depletionChance).toFixed(2)}\\s*\\|\\s*${node.respawnTicks}\\s*\\|`).test(line), `woodcutting depletion/respawn mismatch for ${row.label}`);
  }

  const axeRows = [
    { label: "Bronze Axe", speedBonusTicks: 0 },
    { label: "Iron Axe", speedBonusTicks: 1 },
    { label: "Steel Axe", speedBonusTicks: 2 },
    { label: "Mithril Axe", speedBonusTicks: 3 },
    { label: "Adamant Axe", speedBonusTicks: 4 },
    { label: "Rune Axe", speedBonusTicks: 5 }
  ];
  for (const row of axeRows) {
    const intervalTicks = Math.max(spec.timing.minimumAttemptTicks, spec.timing.baseAttemptTicks - row.speedBonusTicks);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*max\\(1,\\s*${spec.timing.baseAttemptTicks}\\s*-\\s*${row.speedBonusTicks}\\)\\s*\\|\\s*${intervalTicks}\\s*\\|`),
      `woodcutting attempt-timing mismatch for ${row.label}`
    );
  }

  const tierEntryBenchmarks = [
    { label: "Normal Tree", nodeId: "normal_tree", level: 1, axeLabel: "Iron Axe", toolPower: 6, speedBonusTicks: 1 },
    { label: "Oak Tree", nodeId: "oak_tree", level: 10, axeLabel: "Steel Axe", toolPower: 10, speedBonusTicks: 2 },
    { label: "Willow Tree", nodeId: "willow_tree", level: 20, axeLabel: "Mithril Axe", toolPower: 15, speedBonusTicks: 3 },
    { label: "Maple Tree", nodeId: "maple_tree", level: 30, axeLabel: "Adamant Axe", toolPower: 21, speedBonusTicks: 4 },
    { label: "Yew Tree", nodeId: "yew_tree", level: 40, axeLabel: "Rune Axe", toolPower: 28, speedBonusTicks: 5 }
  ];
  for (const row of tierEntryBenchmarks) {
    const node = spec.nodeTable[row.nodeId];
    const metrics = computeWoodcuttingOutputs(spec, node, row);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${escapeRegex(row.axeLabel)}\\s*\\|\\s*${formatMetric(metrics.activeLogsPerTick)}\\s*\\|\\s*${formatMetric(metrics.activeXpPerTick)}\\s*\\|\\s*${formatMetric(metrics.activeGoldPerTick)}\\s*\\|`),
      `woodcutting tier-entry output mismatch for ${row.label}`
    );
  }

  const masteryBenchmark = { level: 40, toolPower: 28, speedBonusTicks: 5 };
  for (const row of treeRows) {
    const node = spec.nodeTable[row.nodeId];
    const metrics = computeWoodcuttingOutputs(spec, node, masteryBenchmark);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${formatMetric(metrics.sustainedLogsPerTick)}\\s*\\|\\s*${formatMetric(metrics.sustainedXpPerTick)}\\s*\\|\\s*${formatMetric(metrics.sustainedGoldPerTick)}\\s*\\|`),
      `woodcutting sustained output mismatch for ${row.label}`
    );
  }
}

function runFishingChecks(roadmap, spec, itemDefs) {
  const lines = roadmap.split(/\r?\n/);
  const shallow = spec.nodeTable.shallow_water;

  assertRegex(roadmap, new RegExp(`\\|\\s*Base Water-Type Catch Chance\\s*\\|\\s*${toPercent(shallow.baseCatchChance)}\\s*\\|`), "fishing roadmap base catch chance mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Water-Type Level Scaling\\s*\\|\\s*${toPercent(shallow.levelScaling)}\\s*\\|`), "fishing roadmap level scaling mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Max Water-Type Catch Chance\\s*\\|\\s*${toPercent(shallow.maxCatchChance)}\\s*\\|`), "fishing roadmap max catch chance mismatch");

  const rows = [
    { name: "Raw Shrimp", level: 1, xp: 20, itemId: "raw_shrimp" },
    { name: "Raw Trout", level: 10, xp: 50, itemId: "raw_trout" },
    { name: "Raw Salmon", level: 20, xp: 70, itemId: "raw_salmon" },
    { name: "Raw Tuna", level: 30, xp: 80, itemId: "raw_tuna" },
    { name: "Raw Swordfish", level: 40, xp: 100, itemId: "raw_swordfish" }
  ];

  for (const row of rows) {
    const sellValue = Math.max(1, Math.floor(itemDefs[row.itemId].value * 0.4));
    const line = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(row.name)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${row.xp}\\s*\\|`).test(entry));
    assert(!!line, `fishing roadmap row mismatch for ${row.name}`);
    assert(new RegExp(`\\|\\s*${sellValue}\\s*\\|\\s*$`).test(line), `fishing sell value mismatch for ${row.name}`);
  }
}

function runCookingChecks(roadmap, spec, itemDefs) {
  const lines = roadmap.split(/\r?\n/);
  const rows = [
    { label: "Shrimp", recipeId: "raw_shrimp" },
    { label: "Trout", recipeId: "raw_trout" },
    { label: "Salmon", recipeId: "raw_salmon" },
    { label: "Tuna", recipeId: "raw_tuna" },
    { label: "Swordfish", recipeId: "raw_swordfish" }
  ];

  for (const row of rows) {
    const recipe = spec.recipeSet[row.recipeId];
    const rawValue = itemDefs[recipe.sourceItemId].value;
    const cookedValue = itemDefs[recipe.cookedItemId].value;
    const burntValue = itemDefs[recipe.burntItemId].value;

    const line = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${recipe.requiredLevel}\\s*\\|\\s*${recipe.burnDifficulty}\\s*\\|\\s*${recipe.xpPerSuccess}\\s*\\|`).test(entry));
    assert(!!line, `cooking roadmap row mismatch for ${row.label}`);
    assert(new RegExp(`\\|\\s*${rawValue}\\s*\\|\\s*${cookedValue}\\s*\\|\\s*${burntValue}\\s*\\|\\s*$`).test(line), `cooking sell-value mismatch for ${row.label}`);
  }
}

function runFiremakingChecks(roadmap, spec) {
  const lines = roadmap.split(/\r?\n/);
  assertRegex(roadmap, /\|\s*Ignition Attempt Interval Ticks\s*\|\s*1\s*\|/, "firemaking roadmap ignition tick mismatch");

  const recipeRows = [
    { label: "Logs", recipeId: "logs" },
    { label: "Oak Logs", recipeId: "oak_logs" },
    { label: "Willow Logs", recipeId: "willow_logs" },
    { label: "Maple Logs", recipeId: "maple_logs" },
    { label: "Yew Logs", recipeId: "yew_logs" }
  ];
  for (const row of recipeRows) {
    const recipe = spec.recipeSet[row.recipeId];
    const statLine = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${recipe.requiredLevel}\\s*\\|\\s*${recipe.ignitionDifficulty}\\s*\\|\\s*${recipe.xpPerSuccess}\\s*\\|\\s*${recipe.fireLifetimeTicks}\\s*\\|`).test(entry));
    assert(!!statLine, `firemaking stat row mismatch for ${row.label}`);
  }

  const values = spec.economy.valueTable;
  const valueRows = [
    { label: "Logs", itemId: "logs" },
    { label: "Oak Logs", itemId: "oak_logs" },
    { label: "Willow Logs", itemId: "willow_logs" },
    { label: "Maple Logs", itemId: "maple_logs" },
    { label: "Yew Logs", itemId: "yew_logs" }
  ];
  for (const row of valueRows) {
    const line = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*Resource\\s*\\|`).test(entry));
    assert(!!line && new RegExp(`\\|\\s*${values[row.itemId].buy}\\s*\\|\\s*${values[row.itemId].sell}\\s*\\|`).test(line), `firemaking value row mismatch for ${row.label}`);
  }

  const tinderLine = findLine(lines, (entry) => /^\|\s*Tinderbox\s*\|\s*Tool\s*\|/.test(entry));
  assert(!!tinderLine && new RegExp(`\\|\\s*${values.tinderbox.buy}\\s*\\|\\s*${values.tinderbox.sell}\\s*\\|`).test(tinderLine), "firemaking tinderbox value row mismatch");

  const ashesLine = findLine(lines, (entry) => /^\|\s*Ashes\s*\|\s*Resource\s*\|/.test(entry));
  assert(!!ashesLine && new RegExp(`\\|\\s*${values.ashes.buy}\\s*\\|\\s*${values.ashes.sell}\\s*\\|`).test(ashesLine), "firemaking ashes value row mismatch");
}

function runMiningChecks(roadmap, spec) {
  const lines = roadmap.split(/\r?\n/);
  assertRegex(roadmap, new RegExp(`\\|\\s*Base Attempt Ticks\\s*\\|\\s*${spec.timing.baseAttemptTicks}\\s*\\|`), "mining roadmap base attempt ticks mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Minimum Attempt Ticks\\s*\\|\\s*${spec.timing.minimumAttemptTicks}\\s*\\|`), "mining roadmap minimum attempt ticks mismatch");

  const labelByNode = {
    clay_rock: "Clay Rock",
    copper_rock: "Copper Rock",
    tin_rock: "Tin Rock",
    rune_essence: "Rune Essence Rock",
    iron_rock: "Iron Rock",
    coal_rock: "Coal Rock",
    silver_rock: "Silver Rock",
    sapphire_rock: "Sapphire Rock",
    gold_rock: "Gold Rock",
    emerald_rock: "Emerald Rock"
  };

  for (const [nodeId, node] of Object.entries(spec.nodeTable)) {
    const label = labelByNode[nodeId] || toTitleCaseId(nodeId);
    const line = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(label)}\\s*\\|\\s*${node.requiredLevel}\\s*\\|\\s*${node.xpPerSuccess}\\s*\\|\\s*${node.difficulty}\\s*\\|`).test(entry));
    assert(!!line, `mining roadmap row mismatch for ${label}`);

    if (Number.isFinite(node.depletionChance)) {
      assert(new RegExp(`\\|\\s*${Number(node.depletionChance).toFixed(2)}\\s*\\|`).test(line), `mining depletion mismatch for ${label}`);
    }
    if (Number.isFinite(node.respawnTicks)) {
      assert(new RegExp(`\\|\\s*${node.respawnTicks}\\s*\\|`).test(line), `mining respawn mismatch for ${label}`);
    }
  }
}

function runRunecraftingChecks(roadmap, spec) {
  const lines = roadmap.split(/\r?\n/);
  assertRegex(roadmap, new RegExp(`\\|\\s*Base Craft Ticks\\s*\\|\\s*${spec.timing.actionTicks}\\s*\\|`), "runecrafting base craft ticks mismatch");

  const progressionRows = [
    ["Ember Rune", spec.recipeSet.ember_altar.requiredLevel],
    ["Water Rune", spec.recipeSet.water_altar.requiredLevel],
    ["Earth Rune", spec.recipeSet.earth_altar.requiredLevel],
    ["Air Rune", spec.recipeSet.air_altar.requiredLevel]
  ];
  for (const [label, requiredLevel] of progressionRows) {
    assertRegex(roadmap, new RegExp(`\\|\\s*${escapeRegex(label)}\\s*\\|\\s*${requiredLevel}\\s*\\|`), `runecrafting core progression mismatch for ${label}`);
  }

  const runeStatsRows = [
    { label: "Ember Rune", recipe: spec.recipeSet.ember_altar, sell: spec.economy.valueTable.ember_rune.sell },
    { label: "Water Rune", recipe: spec.recipeSet.water_altar, sell: spec.economy.valueTable.water_rune.sell },
    { label: "Earth Rune", recipe: spec.recipeSet.earth_altar, sell: spec.economy.valueTable.earth_rune.sell },
    { label: "Air Rune", recipe: spec.recipeSet.air_altar, sell: spec.economy.valueTable.air_rune.sell }
  ];
  for (const row of runeStatsRows) {
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.recipe.requiredLevel}\\s*\\|\\s*${row.recipe.xpPerEssence}\\s*\\|\\s*${row.sell}\\s*\\|`),
      `runecrafting rune stat mismatch for ${row.label}`
    );
  }

  const comboOutputIds = ["steam_rune", "smoke_rune", "lava_rune", "mud_rune", "mist_rune", "dust_rune"];
  for (const outputId of comboOutputIds) {
    const label = toTitleCaseId(outputId);
    assertRegex(roadmap, new RegExp(`\\|\\s*${escapeRegex(label)}\\s*\\|\\s*40\\s*\\|\\s*16\\s*\\|\\s*${spec.economy.valueTable[outputId].sell}\\s*\\|`), `runecrafting combo stat mismatch for ${label}`);
    assertRegex(roadmap, new RegExp(`\\|\\s*${escapeRegex(label)}\\s*\\|\\s*Rune\\s*\\|\\s*${spec.economy.valueTable[outputId].buy}\\s*\\|\\s*${spec.economy.valueTable[outputId].sell}\\s*\\|`), `runecrafting value-table mismatch for ${label}`);
  }

  assertRegex(roadmap, new RegExp(`\\|\\s*Rune Essence\\s*\\|\\s*Resource\\s*\\|\\s*${spec.economy.valueTable.rune_essence.buy}\\s*\\|\\s*${spec.economy.valueTable.rune_essence.sell}\\s*\\|`), "runecrafting rune essence value mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Ember Rune\\s*\\|\\s*Rune\\s*\\|\\s*${spec.economy.valueTable.ember_rune.buy}\\s*\\|\\s*${spec.economy.valueTable.ember_rune.sell}\\s*\\|`), "runecrafting ember rune value mismatch");

  const pouchRows = [
    { label: "Small Pouch", capacity: spec.pouchTable.small_pouch.capacity, buy: spec.economy.valueTable.small_pouch.buy, sell: spec.economy.valueTable.small_pouch.sell, level: spec.pouchTable.small_pouch.requiredLevel },
    { label: "Medium Pouch", capacity: spec.pouchTable.medium_pouch.capacity, buy: spec.economy.valueTable.medium_pouch.buy, sell: spec.economy.valueTable.medium_pouch.sell, level: spec.pouchTable.medium_pouch.requiredLevel },
    { label: "Large Pouch", capacity: spec.pouchTable.large_pouch.capacity, buy: spec.economy.valueTable.large_pouch.buy, sell: spec.economy.valueTable.large_pouch.sell, level: spec.pouchTable.large_pouch.requiredLevel }
  ];

  for (const row of pouchRows) {
    assertRegex(roadmap, new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*Utility\\s*\\|\\s*${row.buy}\\s*\\|\\s*${row.sell}\\s*\\|`), `runecrafting value-table mismatch for ${row.label}`);
    assertRegex(roadmap, new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${row.capacity}\\s*\\|\\s*${row.buy}\\s*\\|\\s*${row.sell}\\s*\\|`), `runecrafting pouch row mismatch for ${row.label}`);
  }

  const routeLines = lines.filter((line) => /^\|\s*(Steam|Smoke|Lava|Mud|Mist|Dust) Rune\s*\|/.test(line));
  assert(routeLines.length >= 6, "runecrafting combination route table is incomplete");
}

function runCraftingChecks(roadmap, spec, itemDefs) {
  assertRegex(roadmap, new RegExp(`\\|\\s*Fixed Crafting Action Ticks\\s*\\|\\s*${spec.timing.actionTicks}\\s*\\|`), "crafting fixed action ticks mismatch");

  const checks = [
    ["Chisel", itemDefs.chisel.value, Math.max(1, Math.floor(itemDefs.chisel.value * 0.4))],
    ["Needle", itemDefs.needle.value, Math.max(1, Math.floor(itemDefs.needle.value * 0.4))],
    ["Thread", itemDefs.thread.value, Math.max(1, Math.floor(itemDefs.thread.value * 0.4))]
  ];
  for (const [label, buy, sell] of checks) {
    assertRegex(roadmap, new RegExp(`\\|\\s*${escapeRegex(label)}\\s*\\|\\s*1\\s*\\|\\s*${buy}\\s*\\|\\s*${sell}\\s*\\|`), `crafting tool table mismatch for ${label}`);
  }

  const mouldIds = ["ring_mould", "amulet_mould", "tiara_mould"];
  for (const mouldId of mouldIds) {
    const label = toTitleCaseId(mouldId);
    assertRegex(roadmap, new RegExp(`\\|\\s*${escapeRegex(label)}\\s*\\|\\s*Quest unlock\\s*\\|\\s*null\\s*\\|\\s*null\\s*\\|`), `crafting mould table mismatch for ${label}`);
  }
}

function runFletchingChecks(roadmap, spec) {
  assertRegex(roadmap, new RegExp(`\\|\\s*Fixed Fletching Action Ticks\\s*\\|\\s*${spec.timing.actionTicks}\\s*\\|`), "fletching fixed action ticks mismatch");

  const values = spec.economy.valueTable;
  assertRegex(roadmap, new RegExp(`\\|\\s*Knife\\s*\\|\\s*1\\s*\\|\\s*${values.knife.buy}\\s*\\|\\s*${values.knife.sell}\\s*\\|`), "fletching knife table mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Feathers x15\\s*\\|\\s*1\\s*\\|\\s*${values.feathers_bundle.buy}\\s*\\|\\s*${values.feathers_bundle.sell}\\s*\\|`), "fletching feathers table mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Bow String\\s*\\|\\s*1\\s*\\|\\s*${values.bow_string.buy}\\s*\\|\\s*${values.bow_string.sell}\\s*\\|`), "fletching bow string table mismatch");

  assertRegex(roadmap, new RegExp(`\\|\\s*Yew Handle\\s*\\|[^\\n]*\\|\\s*${values.yew_handle.sell}\\s*\\|`), "fletching yew handle sell value mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Yew Longbow\\s*\\|[^\\n]*\\|\\s*${values.yew_longbow.sell}\\s*\\|`), "fletching yew longbow sell value mismatch");
}

function runSmithingChecks(roadmap, spec) {
  assertRegex(roadmap, new RegExp(`\\|\\s*Fixed Smithing Action Ticks\\s*\\|\\s*${spec.timing.actionTicks}\\s*\\|`), "smithing fixed action ticks mismatch");

  const values = spec.economy.valueTable;
  assertRegex(roadmap, new RegExp(`\\|\\s*Hammer\\s*\\|\\s*1\\s*\\|\\s*${values.hammer.buy}\\s*\\|\\s*${values.hammer.sell}\\s*\\|`), "smithing hammer table mismatch");
  assertRegex(roadmap, /\|\s*Tiara Mould\s*\|\s*Quest unlock via crafting\s*\|\s*null\s*\|\s*null\s*\|/, "smithing tiara mould table mismatch");
  assertRegex(roadmap, /\|\s*Ring Mould\s*\|\s*Quest unlock via crafting\s*\|\s*null\s*\|\s*null\s*\|/, "smithing ring mould table mismatch");
  assertRegex(roadmap, /\|\s*Amulet Mould\s*\|\s*Quest unlock via crafting\s*\|\s*null\s*\|\s*null\s*\|/, "smithing amulet mould table mismatch");

  assertRegex(roadmap, new RegExp(`\\|\\s*Bronze Bar\\s*\\|\\s*Intermediate\\s*\\|\\s*null\\s*\\|\\s*${values.bronze_bar.sell}\\s*\\|`), "smithing bronze bar value mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Rune Bar\\s*\\|\\s*Intermediate\\s*\\|\\s*null\\s*\\|\\s*${values.rune_bar.sell}\\s*\\|`), "smithing rune bar value mismatch");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtime = loadRuntimeSkillSpecs(root);
  const itemDefs = loadItemDefs(root);

  const skills = ["woodcutting", "fishing", "cooking", "firemaking", "mining", "runecrafting", "crafting", "fletching", "smithing"];
  const roadmaps = {};
  for (const skillId of skills) {
    roadmaps[skillId] = readRoadmap(root, skillId);
    assertCanonicalHeader(skillId, roadmaps[skillId], runtime.version);
  }

  runWoodcuttingChecks(roadmaps.woodcutting, runtime.skills.woodcutting);
  runFishingChecks(roadmaps.fishing, runtime.skills.fishing, itemDefs);
  runCookingChecks(roadmaps.cooking, runtime.skills.cooking, itemDefs);
  runFiremakingChecks(roadmaps.firemaking, runtime.skills.firemaking);
  runMiningChecks(roadmaps.mining, runtime.skills.mining);
  runRunecraftingChecks(roadmaps.runecrafting, runtime.skills.runecrafting);
  runCraftingChecks(roadmaps.crafting, runtime.skills.crafting, itemDefs);
  runFletchingChecks(roadmaps.fletching, runtime.skills.fletching);
  runSmithingChecks(roadmaps.smithing, runtime.skills.smithing);

  console.log("Spec doc parity checks passed for all 9 skill roadmaps.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
