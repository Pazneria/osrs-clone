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

function computeMiningOutputs(spec, node, options) {
  const level = options.level;
  const toolPower = options.toolPower;
  const speedBonusTicks = options.speedBonusTicks;
  const successChance = (level + toolPower) / ((level + toolPower) + node.difficulty);
  const intervalTicks = Math.max(spec.timing.minimumAttemptTicks, spec.timing.baseAttemptTicks - speedBonusTicks);
  const activeYieldsPerTick = successChance / intervalTicks;
  const sellValue = spec.economy.valueTable[node.rewardItemId].sell;
  const activeXpPerTick = activeYieldsPerTick * node.xpPerSuccess;
  const activeGoldPerTick = activeYieldsPerTick * sellValue;

  if (node.persistent) {
    return {
      expectedYieldsPerNode: null,
      activeYieldsPerTick,
      activeXpPerTick,
      activeGoldPerTick,
      sustainedYieldsPerTick: activeYieldsPerTick,
      sustainedXpPerTick: activeXpPerTick,
      sustainedGoldPerTick: activeGoldPerTick
    };
  }

  let expectedYieldsPerNode = node.minimumYields;
  for (let yieldCount = node.minimumYields + 1; yieldCount <= node.maximumYields; yieldCount++) {
    expectedYieldsPerNode += Math.pow(1 - node.depletionChance, yieldCount - node.minimumYields);
  }
  const activeTicksPerNode = expectedYieldsPerNode / activeYieldsPerTick;
  const sustainedYieldsPerTick = expectedYieldsPerNode / (activeTicksPerNode + node.respawnTicks);
  const sustainedXpPerTick = sustainedYieldsPerTick * node.xpPerSuccess;
  const sustainedGoldPerTick = sustainedYieldsPerTick * sellValue;

  return {
    expectedYieldsPerNode,
    activeYieldsPerTick,
    activeXpPerTick,
    activeGoldPerTick,
    sustainedYieldsPerTick,
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
  const deep = spec.nodeTable.deep_water;

  function getFishingMethodFishTable(methodSpec, level) {
    const bands = Array.isArray(methodSpec && methodSpec.fishByLevel) ? methodSpec.fishByLevel : [];
    for (const band of bands) {
      const minLevel = Number.isFinite(band && band.minLevel) ? band.minLevel : 1;
      const maxLevel = Number.isFinite(band && band.maxLevel) ? band.maxLevel : Infinity;
      if (level < minLevel || level > maxLevel) continue;
      const fish = Array.isArray(band && band.fish) ? band.fish : [];
      return fish.filter((row) => row && level >= (row.requiredLevel || 1));
    }
    return [];
  }

  function resolveFishingMethodCurve(waterSpec, methodSpec) {
    return {
      unlockLevel: Number.isFinite(methodSpec && methodSpec.unlockLevel) ? methodSpec.unlockLevel : (waterSpec.unlockLevel || 1),
      baseCatchChance: Number.isFinite(methodSpec && methodSpec.baseCatchChance) ? methodSpec.baseCatchChance : (waterSpec.baseCatchChance || 0),
      levelScaling: Number.isFinite(methodSpec && methodSpec.levelScaling) ? methodSpec.levelScaling : (waterSpec.levelScaling || 0),
      maxCatchChance: Number.isFinite(methodSpec && methodSpec.maxCatchChance) ? methodSpec.maxCatchChance : (waterSpec.maxCatchChance || 1)
    };
  }

  function computeFishingOutputs(waterId, methodId, level) {
    const waterSpec = spec.nodeTable[waterId];
    const methodSpec = waterSpec.methods[methodId];
    const curve = resolveFishingMethodCurve(waterSpec, methodSpec);
    const catchChance = Math.max(0, Math.min(curve.maxCatchChance, curve.baseCatchChance + ((level - curve.unlockLevel) * curve.levelScaling)));
    const fishTable = getFishingMethodFishTable(methodSpec, level);
    const totalWeight = fishTable.reduce((sum, row) => sum + (Number(row && row.weight) || 0), 0);
    let xpPerTick = 0;
    let goldPerTick = 0;
    for (const row of fishTable) {
      const share = totalWeight > 0 ? row.weight / totalWeight : 0;
      const fishChance = catchChance * share;
      const sellValue = spec.economy.valueTable[row.itemId].sell;
      xpPerTick += fishChance * row.xp;
      goldPerTick += fishChance * sellValue;
    }
    return {
      catchChance,
      fishPerTick: catchChance,
      xpPerTick,
      goldPerTick
    };
  }

  assert(!roadmap.includes("Water-Type Catch Chance"), "fishing roadmap should no longer use water-type catch naming");
  assert(!roadmap.includes("Water-Type Unlock Level"), "fishing roadmap should no longer use water-type unlock naming");
  assertRegex(roadmap, /\|\s*Fishing Method Catch Chance\s*\|/, "fishing roadmap method-centric catch formula missing");
  assertRegex(roadmap, /\|\s*Method Unlock Level\s*\|/, "fishing roadmap method-unlock variable missing");
  assertRegex(roadmap, new RegExp(`\\|\\s*Default Base Fishing Method Catch Chance\\s*\\|\\s*${toPercent(shallow.baseCatchChance)}\\s*\\|`), "fishing roadmap default base catch chance mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Default Fishing Method Level Scaling\\s*\\|\\s*${toPercent(shallow.levelScaling)}\\s*\\|`), "fishing roadmap level scaling mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Default Max Fishing Method Catch Chance\\s*\\|\\s*${toPercent(shallow.maxCatchChance)}\\s*\\|`), "fishing roadmap max catch chance mismatch");

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

  const methodRows = [
    { label: "Net", waterId: "shallow_water", methodId: "net", tool: "Small Net", extra: "None" },
    { label: "Rod", waterId: "shallow_water", methodId: "rod", tool: "Fishing Rod", extra: "Bait" },
    { label: "Harpoon", waterId: "shallow_water", methodId: "harpoon", tool: "Harpoon", extra: "None" },
    { label: "Deep Harpoon Mixed", waterId: "deep_water", methodId: "deep_harpoon_mixed", tool: "Harpoon", extra: "None" },
    { label: "Deep Rune Harpoon", waterId: "deep_water", methodId: "deep_rune_harpoon", tool: "Rune Harpoon", extra: "None" }
  ];
  for (const row of methodRows) {
    const waterSpec = spec.nodeTable[row.waterId];
    const methodSpec = waterSpec.methods[row.methodId];
    const curve = resolveFishingMethodCurve(waterSpec, methodSpec);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${curve.unlockLevel}\\s*\\|\\s*${escapeRegex(row.tool)}\\s*\\|\\s*${escapeRegex(row.extra)}\\s*\\|\\s*${toPercent(curve.baseCatchChance)}\\s*\\|\\s*${toPercent(curve.levelScaling)}\\s*\\|\\s*${toPercent(curve.maxCatchChance)}\\s*\\|`),
      `fishing method stat mismatch for ${row.label}`
    );
  }

  const exampleRows = [
    { label: "Net", waterId: "shallow_water", methodId: "net", level: 1 },
    { label: "Rod", waterId: "shallow_water", methodId: "rod", level: 10 },
    { label: "Rod", waterId: "shallow_water", methodId: "rod", level: 20 },
    { label: "Harpoon", waterId: "shallow_water", methodId: "harpoon", level: 30 },
    { label: "Deep Harpoon Mixed", waterId: "deep_water", methodId: "deep_harpoon_mixed", level: 40 }
  ];
  for (const row of exampleRows) {
    const waterSpec = spec.nodeTable[row.waterId];
    const methodSpec = waterSpec.methods[row.methodId];
    const curve = resolveFishingMethodCurve(waterSpec, methodSpec);
    const metrics = computeFishingOutputs(row.waterId, row.methodId, row.level);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*min\\(${toPercent(curve.maxCatchChance)},\\s*${toPercent(curve.baseCatchChance)} \\+ ${toPercent(curve.levelScaling)} x \\(${row.level} - ${curve.unlockLevel}\\)\\)\\s*\\|\\s*${toPercent(metrics.catchChance)}\\s*\\|`),
      `fishing catch-chance example mismatch for ${row.label} @ ${row.level}`
    );
  }

  const tierEntryRows = [
    { label: "Net", waterId: "shallow_water", methodId: "net", level: 1 },
    { label: "Rod", waterId: "shallow_water", methodId: "rod", level: 10 },
    { label: "Rod", waterId: "shallow_water", methodId: "rod", level: 20 },
    { label: "Rod", waterId: "shallow_water", methodId: "rod", level: 30 },
    { label: "Harpoon", waterId: "shallow_water", methodId: "harpoon", level: 30 },
    { label: "Deep Harpoon Mixed", waterId: "deep_water", methodId: "deep_harpoon_mixed", level: 40 },
    { label: "Deep Rune Harpoon", waterId: "deep_water", methodId: "deep_rune_harpoon", level: 40 }
  ];
  for (const row of tierEntryRows) {
    const metrics = computeFishingOutputs(row.waterId, row.methodId, row.level);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${formatMetric(metrics.fishPerTick)}\\s*\\|\\s*${formatMetric(metrics.xpPerTick)}\\s*\\|\\s*${formatMetric(metrics.goldPerTick)}\\s*\\|`),
      `fishing tier-entry benchmark mismatch for ${row.label} @ ${row.level}`
    );
  }

  const level40Rows = [
    { label: "Net", waterId: "shallow_water", methodId: "net", level: 40 },
    { label: "Rod", waterId: "shallow_water", methodId: "rod", level: 40 },
    { label: "Harpoon", waterId: "shallow_water", methodId: "harpoon", level: 40 },
    { label: "Deep Harpoon Mixed", waterId: "deep_water", methodId: "deep_harpoon_mixed", level: 40 },
    { label: "Deep Rune Harpoon", waterId: "deep_water", methodId: "deep_rune_harpoon", level: 40 }
  ];
  for (const row of level40Rows) {
    const metrics = computeFishingOutputs(row.waterId, row.methodId, row.level);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${formatMetric(metrics.fishPerTick)}\\s*\\|\\s*${formatMetric(metrics.xpPerTick)}\\s*\\|\\s*${formatMetric(metrics.goldPerTick)}\\s*\\|`),
      `fishing level-40 benchmark mismatch for ${row.label}`
    );
  }
}

function runCookingChecks(roadmap, spec, itemDefs) {
  const lines = roadmap.split(/\r?\n/);
  assertRegex(
    roadmap,
    /\|\s*Burn Chance\s*\|\s*Burn Chance = clamp\(0,\s*0\.33 - \(0\.038 x Clamped Level Delta\) \+ \(0\.0018 x Clamped Level Delta\^2\) - \(0\.00003 x Clamped Level Delta\^3\),\s*0\.33\)\s*\|/,
    "cooking roadmap burn-curve formula mismatch"
  );
  assertRegex(
    roadmap,
    /\|\s*Cooking Success Chance\s*\|\s*Cooking Success Chance = 1 - Burn Chance\s*\|/,
    "cooking roadmap success formula mismatch"
  );
  assertRegex(
    roadmap,
    /\|\s*Expected Gold Delta per Action\s*\|\s*Expected Gold Delta per Action = \(Cooking Success Chance x Cooked Sell Value\) \+ \(Burn Chance x Burnt Sell Value\) - Raw Sell Value\s*\|/,
    "cooking roadmap gold-delta formula mismatch"
  );

  const anchorRows = [
    { label: "Unlock", delta: 0, burn: "33%", success: "67%" },
    { label: "Unlock +10", delta: 10, burn: "10%", success: "90%" },
    { label: "Unlock +20", delta: 20, burn: "5%", success: "95%" },
    { label: "Unlock +30", delta: 30, burn: "0%", success: "100%" }
  ];
  for (const row of anchorRows) {
    const line = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.delta}\\s*\\|\\s*${escapeRegex(row.burn)}\\s*\\|\\s*${escapeRegex(row.success)}\\s*\\|`).test(entry));
    assert(!!line, `cooking burn-curve summary row mismatch for ${row.label}`);
  }

  const rows = Object.keys(spec.recipeSet)
    .sort((a, b) => {
      const aLevel = Number.isFinite(spec.recipeSet[a] && spec.recipeSet[a].requiredLevel) ? spec.recipeSet[a].requiredLevel : Number.MAX_SAFE_INTEGER;
      const bLevel = Number.isFinite(spec.recipeSet[b] && spec.recipeSet[b].requiredLevel) ? spec.recipeSet[b].requiredLevel : Number.MAX_SAFE_INTEGER;
      if (aLevel !== bLevel) return aLevel - bLevel;
      return a.localeCompare(b);
    })
    .map((recipeId) => ({
      label: toTitleCaseId(spec.recipeSet[recipeId].sourceItemId).replace(/^Raw /, ""),
      recipeId
    }));

  for (const row of rows) {
    const recipe = spec.recipeSet[row.recipeId];
    const rawValue = spec.economy.valueTable[recipe.sourceItemId].sell;
    const cookedValue = spec.economy.valueTable[recipe.cookedItemId].sell;
    const burntValue = spec.economy.valueTable[recipe.burntItemId].sell;

    const line = findLine(lines, (entry) => new RegExp(`^\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${recipe.requiredLevel}\\s*\\|\\s*${recipe.xpPerSuccess}\\s*\\|\\s*${escapeRegex(toTitleCaseId(recipe.sourceItemId))}\\s*\\|\\s*${escapeRegex(toTitleCaseId(recipe.cookedItemId))}\\s*\\|\\s*${escapeRegex(toTitleCaseId(recipe.burntItemId))}\\s*\\|`).test(entry));
    assert(!!line, `cooking roadmap row mismatch for ${row.label}`);
    assert(new RegExp(`\\|\\s*${rawValue}\\s*\\|\\s*${cookedValue}\\s*\\|\\s*${burntValue}\\s*\\|\\s*$`).test(line), `cooking sell-value mismatch for ${row.label}`);
  }

  function clamp(value, minValue, maxValue) {
    const next = Number.isFinite(value) ? value : minValue;
    return Math.max(minValue, Math.min(maxValue, next));
  }

  function computeCookingBurnChance(level, requiredLevel) {
    const delta = clamp(level - requiredLevel, 0, 30);
    if (delta <= 0) return 0.33;
    if (delta >= 30) return 0;
    return clamp(0.33 - (0.038 * delta) + (0.0018 * delta * delta) - (0.00003 * delta * delta * delta), 0, 0.33);
  }

  function computeCookingOutputs(recipeId, level) {
    const recipe = spec.recipeSet[recipeId];
    const burnChance = computeCookingBurnChance(level, recipe.requiredLevel);
    const successChance = 1 - burnChance;
    const rawSell = spec.economy.valueTable[recipe.sourceItemId].sell;
    const cookedSell = spec.economy.valueTable[recipe.cookedItemId].sell;
    const burntSell = spec.economy.valueTable[recipe.burntItemId].sell;
    return {
      successChance,
      cookedPerAction: successChance,
      xpPerAction: successChance * recipe.xpPerSuccess,
      goldDeltaPerAction: (successChance * cookedSell) + (burnChance * burntSell) - rawSell
    };
  }

  function computeBreakEvenLevel(recipeId) {
    const recipe = spec.recipeSet[recipeId];
    for (let level = recipe.requiredLevel; level <= 99; level++) {
      const metrics = computeCookingOutputs(recipeId, level);
      if (metrics.goldDeltaPerAction >= 0) return level;
    }
    return null;
  }

  const tierEntryRows = rows.map((row) => ({
    label: row.label,
    recipeId: row.recipeId,
    level: spec.recipeSet[row.recipeId].requiredLevel
  }));
  for (const row of tierEntryRows) {
    const metrics = computeCookingOutputs(row.recipeId, row.level);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${toPercent(metrics.successChance)}\\s*\\|\\s*${formatMetric(metrics.cookedPerAction)}\\s*\\|\\s*${formatMetric(metrics.xpPerAction)}\\s*\\|\\s*${formatMetric(metrics.goldDeltaPerAction)}\\s*\\|`),
      `cooking tier-entry benchmark mismatch for ${row.label}`
    );
  }

  const level40Rows = rows.map((row) => ({
    label: row.label,
    recipeId: row.recipeId,
    level: 40
  }));
  for (const row of level40Rows) {
    const metrics = computeCookingOutputs(row.recipeId, row.level);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${toPercent(metrics.successChance)}\\s*\\|\\s*${formatMetric(metrics.cookedPerAction)}\\s*\\|\\s*${formatMetric(metrics.xpPerAction)}\\s*\\|\\s*${formatMetric(metrics.goldDeltaPerAction)}\\s*\\|`),
      `cooking level-40 benchmark mismatch for ${row.label}`
    );
  }

  const breakEvenRows = rows;
  for (const row of breakEvenRows) {
    const breakEvenLevel = computeBreakEvenLevel(row.recipeId);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${breakEvenLevel}\\s*\\|`),
      `cooking break-even row mismatch for ${row.label}`
    );
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

    if (Number.isFinite(node.minimumYields)) {
      assert(new RegExp(`\\|\\s*${node.minimumYields}\\s*\\|\\s*${node.maximumYields}\\s*\\|`).test(line), `mining yield-cap mismatch for ${label}`);
    } else {
      assert(/\|\s*null\s*\|\s*null\s*\|/.test(line), `mining persistent-yield mismatch for ${label}`);
    }
    if (Number.isFinite(node.depletionChance)) {
      assert(new RegExp(`\\|\\s*${Number(node.depletionChance).toFixed(2)}\\s*\\|`).test(line), `mining depletion mismatch for ${label}`);
    } else {
      assert(/\|\s*0\.00\s*\|/.test(line), `mining persistent depletion mismatch for ${label}`);
    }
    if (Number.isFinite(node.respawnTicks)) {
      assert(new RegExp(`\\|\\s*${node.respawnTicks}\\s*\\|`).test(line), `mining respawn mismatch for ${label}`);
    } else {
      assert(/\|\s*0\s*\|/.test(line), `mining persistent respawn mismatch for ${label}`);
    }
  }

  const valueRows = [
    { label: "Clay", itemId: "clay" },
    { label: "Copper Ore", itemId: "copper_ore" },
    { label: "Tin Ore", itemId: "tin_ore" },
    { label: "Iron Ore", itemId: "iron_ore" },
    { label: "Coal", itemId: "coal" },
    { label: "Silver Ore", itemId: "silver_ore" },
    { label: "Uncut Sapphire", itemId: "uncut_sapphire" },
    { label: "Gold Ore", itemId: "gold_ore" },
    { label: "Uncut Emerald", itemId: "uncut_emerald" },
    { label: "Rune Essence", itemId: "rune_essence" }
  ];
  for (const row of valueRows) {
    const value = spec.economy.valueTable[row.itemId];
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*(Resource|Gem)\\s*\\|\\s*${value.buy}\\s*\\|\\s*${value.sell}\\s*\\|`),
      `mining value row mismatch for ${row.label}`
    );
  }

  const tierEntryRows = [
    { label: "Clay Rock", nodeId: "clay_rock", level: 1, pickaxeLabel: "Iron Pickaxe", toolPower: 6, speedBonusTicks: 1 },
    { label: "Copper Rock", nodeId: "copper_rock", level: 1, pickaxeLabel: "Iron Pickaxe", toolPower: 6, speedBonusTicks: 1 },
    { label: "Tin Rock", nodeId: "tin_rock", level: 1, pickaxeLabel: "Iron Pickaxe", toolPower: 6, speedBonusTicks: 1 },
    { label: "Iron Rock", nodeId: "iron_rock", level: 10, pickaxeLabel: "Steel Pickaxe", toolPower: 10, speedBonusTicks: 2 },
    { label: "Coal Rock", nodeId: "coal_rock", level: 20, pickaxeLabel: "Mithril Pickaxe", toolPower: 15, speedBonusTicks: 3 },
    { label: "Silver Rock", nodeId: "silver_rock", level: 30, pickaxeLabel: "Adamant Pickaxe", toolPower: 21, speedBonusTicks: 4 },
    { label: "Sapphire Rock", nodeId: "sapphire_rock", level: 30, pickaxeLabel: "Adamant Pickaxe", toolPower: 21, speedBonusTicks: 4 },
    { label: "Gold Rock", nodeId: "gold_rock", level: 40, pickaxeLabel: "Rune Pickaxe", toolPower: 28, speedBonusTicks: 5 },
    { label: "Emerald Rock", nodeId: "emerald_rock", level: 40, pickaxeLabel: "Rune Pickaxe", toolPower: 28, speedBonusTicks: 5 },
    { label: "Rune Essence Rock", nodeId: "rune_essence", level: 1, pickaxeLabel: "Iron Pickaxe", toolPower: 6, speedBonusTicks: 1 }
  ];
  for (const row of tierEntryRows) {
    const node = spec.nodeTable[row.nodeId];
    const metrics = computeMiningOutputs(spec, node, row);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${row.level}\\s*\\|\\s*${escapeRegex(row.pickaxeLabel)}\\s*\\|\\s*${formatMetric(metrics.activeYieldsPerTick)}\\s*\\|\\s*${formatMetric(metrics.activeXpPerTick)}\\s*\\|\\s*${formatMetric(metrics.activeGoldPerTick)}\\s*\\|`),
      `mining tier-entry output mismatch for ${row.label}`
    );
  }

  const sustainedRows = [
    { label: "Clay Rock", nodeId: "clay_rock", level: 1, toolPower: 6, speedBonusTicks: 1 },
    { label: "Copper Rock", nodeId: "copper_rock", level: 1, toolPower: 6, speedBonusTicks: 1 },
    { label: "Tin Rock", nodeId: "tin_rock", level: 1, toolPower: 6, speedBonusTicks: 1 },
    { label: "Iron Rock", nodeId: "iron_rock", level: 10, toolPower: 10, speedBonusTicks: 2 },
    { label: "Coal Rock", nodeId: "coal_rock", level: 20, toolPower: 15, speedBonusTicks: 3 },
    { label: "Silver Rock", nodeId: "silver_rock", level: 30, toolPower: 21, speedBonusTicks: 4 },
    { label: "Sapphire Rock", nodeId: "sapphire_rock", level: 30, toolPower: 21, speedBonusTicks: 4 },
    { label: "Gold Rock", nodeId: "gold_rock", level: 40, toolPower: 28, speedBonusTicks: 5 },
    { label: "Emerald Rock", nodeId: "emerald_rock", level: 40, toolPower: 28, speedBonusTicks: 5 }
  ];
  for (const row of sustainedRows) {
    const node = spec.nodeTable[row.nodeId];
    const metrics = computeMiningOutputs(spec, node, row);
    assertRegex(
      roadmap,
      new RegExp(`\\|\\s*${escapeRegex(row.label)}\\s*\\|\\s*${formatMetric(metrics.expectedYieldsPerNode)}\\s*\\|\\s*${formatMetric(metrics.sustainedYieldsPerTick)}\\s*\\|\\s*${formatMetric(metrics.sustainedXpPerTick)}\\s*\\|\\s*${formatMetric(metrics.sustainedGoldPerTick)}\\s*\\|`),
      `mining sustained output mismatch for ${row.label}`
    );
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
  assertRegex(roadmap, /\|\s*Sell Value per Tick\s*\|\s*Sell Value per Tick = Sell Value \/ Action Ticks\s*\|/, "crafting sell-value-per-tick formula mismatch");

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

  assertRegex(roadmap, /\|\s*Yew Handle w\/ Strap\s*\|\s*40\s*\|\s*1\s*\|\s*18\s*\|\s*76\s*\|\s*18\s*\|\s*76\s*\|/, "crafting strapped-handle throughput row mismatch");
  assertRegex(roadmap, /\|\s*Cut Diamond\s*\|\s*40\s*\|\s*3\s*\|\s*22\s*\|\s*100\s*\|\s*7\.3333\s*\|\s*33\.3333\s*\|/, "crafting gem-cutting throughput row mismatch");
  assertRegex(roadmap, /\|\s*Air Staff\s*\|\s*40\s*\|\s*3\s*\|\s*22\s*\|\s*150\s*\|\s*7\.3333\s*\|\s*50\s*\|/, "crafting staff throughput row mismatch");

  const sapphireSilverSell = spec.economy.valueTable.silver_ring.sell + spec.economy.valueTable.cut_sapphire.sell;
  const sapphireSilverXpPerTick = String(roundMetric(8 / spec.timing.actionTicks));
  const sapphireSilverSellPerTick = String(roundMetric(sapphireSilverSell / spec.timing.actionTicks));
  assertRegex(
    roadmap,
    new RegExp(`\\|\\s*Sapphire Silver Jewelry \\(Ring/Amulet/Tiara\\)\\s*\\|\\s*20\\s*\\|\\s*${spec.timing.actionTicks}\\s*\\|\\s*8\\s*\\|\\s*${sapphireSilverSell}\\s*\\|\\s*${escapeRegex(sapphireSilverXpPerTick)}\\s*\\|\\s*${escapeRegex(sapphireSilverSellPerTick)}\\s*\\|`),
    "crafting sapphire-silver jewelry throughput row mismatch"
  );

  const diamondGoldSell = spec.economy.valueTable.gold_ring.sell + spec.economy.valueTable.cut_diamond.sell;
  const diamondGoldXpPerTick = String(roundMetric(22 / spec.timing.actionTicks));
  const diamondGoldSellPerTick = String(roundMetric(diamondGoldSell / spec.timing.actionTicks));
  assertRegex(
    roadmap,
    new RegExp(`\\|\\s*Diamond Gold Jewelry \\(Ring/Amulet/Tiara\\)\\s*\\|\\s*40\\s*\\|\\s*${spec.timing.actionTicks}\\s*\\|\\s*22\\s*\\|\\s*${diamondGoldSell}\\s*\\|\\s*${escapeRegex(diamondGoldXpPerTick)}\\s*\\|\\s*${escapeRegex(diamondGoldSellPerTick)}\\s*\\|`),
    "crafting diamond-gold jewelry throughput row mismatch"
  );
}

function runFletchingChecks(roadmap, spec) {
  assertRegex(roadmap, new RegExp(`\\|\\s*Fixed Fletching Action Ticks\\s*\\|\\s*${spec.timing.actionTicks}\\s*\\|`), "fletching fixed action ticks mismatch");
  assertRegex(roadmap, /\|\s*Sell Value per Tick\s*\|\s*Sell Value per Tick = Sell Value \/ 3\s*\|/, "fletching sell-value-per-tick formula mismatch");

  const values = spec.economy.valueTable;
  assertRegex(roadmap, new RegExp(`\\|\\s*Knife\\s*\\|\\s*1\\s*\\|\\s*${values.knife.buy}\\s*\\|\\s*${values.knife.sell}\\s*\\|`), "fletching knife table mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Feathers x15\\s*\\|\\s*1\\s*\\|\\s*${values.feathers_bundle.buy}\\s*\\|\\s*${values.feathers_bundle.sell}\\s*\\|`), "fletching feathers table mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Bow String\\s*\\|\\s*1\\s*\\|\\s*${values.bow_string.buy}\\s*\\|\\s*${values.bow_string.sell}\\s*\\|`), "fletching bow string table mismatch");

  assertRegex(roadmap, new RegExp(`\\|\\s*Plain Staff \\(Oak\\)\\s*\\|\\s*Magic Equipment\\s*\\|\\s*null\\s*\\|\\s*${values.plain_staff_oak.sell}\\s*\\|`), "fletching plain oak staff sell value mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Yew Handle\\s*\\|[^\\n]*\\|\\s*${values.yew_handle.sell}\\s*\\|`), "fletching yew handle sell value mismatch");
  assertRegex(roadmap, new RegExp(`\\|\\s*Yew Longbow\\s*\\|[^\\n]*\\|\\s*${values.yew_longbow.sell}\\s*\\|`), "fletching yew longbow sell value mismatch");
  assertRegex(roadmap, /\|\s*Yew Handle\s*\|\s*40\s*\|\s*36\s*\|\s*50\s*\|\s*12\s*\|\s*16\.6667\s*\|/, "fletching handle throughput row mismatch");
  assertRegex(roadmap, /\|\s*Rune Arrows x15\s*\|\s*45\s*\|\s*23\s*\|\s*80\s*\|\s*7\.6667\s*\|\s*26\.6667\s*\|/, "fletching finished-arrow throughput row mismatch");
  assertRegex(roadmap, /\|\s*Yew Shortbow\s*\|\s*44\s*\|\s*24\s*\|\s*110\s*\|\s*8\s*\|\s*36\.6667\s*\|/, "fletching finished-bow throughput row mismatch");
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
