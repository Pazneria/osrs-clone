const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { loadTsModule } = require("../lib/ts-module-loader");
const { loadRuntimeItemCatalog } = require("../content/runtime-item-catalog");

const root = path.resolve(__dirname, "..", "..");
const combatContentSource = fs.readFileSync(path.resolve(root, "src/game/combat/content.ts"), "utf8");
const combatRoadmapSource = fs.readFileSync(path.resolve(root, "src/js/skills/combat/ROADMAP.md"), "utf8");
const combatStatusSource = fs.readFileSync(path.resolve(root, "src/js/skills/combat/STATUS.md"), "utf8");
const skillsIndexSource = fs.readFileSync(path.resolve(root, "src/js/skills/_index.md"), "utf8");
const combatContent = loadTsModule(path.resolve(root, "src/game/combat/content.ts"));
const combatFormulas = loadTsModule(path.resolve(root, "src/game/combat/formulas.ts"));
const { itemDefs } = loadRuntimeItemCatalog(root);
const AUTHORED_PENDING_ITEM_IDS = new Set([
  "rat_tail",
  "raw_chicken",
  "goblin_club",
  "raw_boar_meat",
  "boar_tusk",
  "raw_wolf_meat",
  "wolf_fang",
  "guard_spear",
  "guard_crest"
]);
const EXPECTED_LOOT_SUMMARIES = {
  enemy_rat: { expectedSellValuePerKill: 0.7, nothingWeight: 65, coinWeight: 0 },
  enemy_chicken: { expectedSellValuePerKill: 2.5, nothingWeight: 10, coinWeight: 0 },
  enemy_goblin_grunt: { expectedSellValuePerKill: 7.05, nothingWeight: 18, coinWeight: 45 },
  enemy_boar: { expectedSellValuePerKill: 2.8, nothingWeight: 20, coinWeight: 0 },
  enemy_wolf: { expectedSellValuePerKill: 3.4, nothingWeight: 25, coinWeight: 0 },
  enemy_guard: { expectedSellValuePerKill: 20.2, nothingWeight: 4, coinWeight: 40 },
  enemy_bear: { expectedSellValuePerKill: 11, nothingWeight: 15, coinWeight: 0 },
  enemy_heavy_brute: { expectedSellValuePerKill: 26.15, nothingWeight: 16, coinWeight: 50 },
  enemy_fast_striker: { expectedSellValuePerKill: 21.9, nothingWeight: 23, coinWeight: 45 },
  enemy_training_dummy: { expectedSellValuePerKill: 0, nothingWeight: 100, coinWeight: 0 }
};
const EXPECTED_ROADMAP_LOOT_ROWS = [
  { enemy: "Rat", role: "Passive critter", emptyWeight: 65, coinWeight: 0, identity: "Rat Tail x1", expectedSellValuePerKill: "0.70" },
  { enemy: "Chicken", role: "Passive critter", emptyWeight: 10, coinWeight: 0, identity: "Raw Chicken, Feathers x15", expectedSellValuePerKill: "2.50" },
  { enemy: "Boar", role: "Resource aggressor", emptyWeight: 20, coinWeight: 0, identity: "Raw Boar Meat, Boar Tusk", expectedSellValuePerKill: "2.80" },
  { enemy: "Wolf", role: "Resource aggressor", emptyWeight: 25, coinWeight: 0, identity: "Raw Wolf Meat, Wolf Fang", expectedSellValuePerKill: "3.40" },
  { enemy: "Goblin Grunt", role: "Roadside aggressor", emptyWeight: 18, coinWeight: 45, identity: "Bronze sword/axe/pickaxe ladder", expectedSellValuePerKill: "7.05" },
  { enemy: "Bear", role: "Durable bruiser", emptyWeight: 15, coinWeight: 0, identity: "Bear Leather spike", expectedSellValuePerKill: "11.00" },
  { enemy: "Guard", role: "Gatekeeper", emptyWeight: 4, coinWeight: 40, identity: "Bronze-to-iron weapon/tool ladder", expectedSellValuePerKill: "20.20" },
  { enemy: "Fast Striker", role: "Camp striker", emptyWeight: 23, coinWeight: 45, identity: "Iron sword bias", expectedSellValuePerKill: "21.90" },
  { enemy: "Heavy Brute", role: "Camp bruiser", emptyWeight: 16, coinWeight: 50, identity: "Iron weapon/tool ladder", expectedSellValuePerKill: "26.15" }
];
const EXPECTED_PROGRESSION_BANDS = [
  {
    bandId: "starter_opt_in",
    displayName: "Starter Opt-In",
    worldStage: "starter",
    routeDepth: 0,
    targetPlayerLevels: { min: 1, max: 3 },
    enemyIds: ["enemy_training_dummy", "enemy_rat", "enemy_chicken"],
    spawnCount: 17,
    maxExpectedSellValuePerKill: 2.5
  },
  {
    bandId: "starter_roadside",
    displayName: "Starter Roadside",
    worldStage: "starter",
    routeDepth: 1,
    targetPlayerLevels: { min: 4, max: 10 },
    enemyIds: ["enemy_goblin_grunt"],
    spawnCount: 12,
    maxExpectedSellValuePerKill: 7.05
  },
  {
    bandId: "resource_outskirts",
    displayName: "Resource Outskirts",
    worldStage: "starter",
    routeDepth: 2,
    targetPlayerLevels: { min: 8, max: 16 },
    enemyIds: ["enemy_boar", "enemy_wolf"],
    spawnCount: 18,
    maxExpectedSellValuePerKill: 3.4
  },
  {
    bandId: "guarded_threshold",
    displayName: "Guarded Threshold",
    worldStage: "mid",
    routeDepth: 3,
    targetPlayerLevels: { min: 15, max: 25 },
    enemyIds: ["enemy_guard"],
    spawnCount: 3,
    maxExpectedSellValuePerKill: 20.2
  },
  {
    bandId: "camp_threat",
    displayName: "Camp Threat",
    worldStage: "mid",
    routeDepth: 4,
    targetPlayerLevels: { min: 20, max: 35 },
    enemyIds: ["enemy_bear", "enemy_fast_striker", "enemy_heavy_brute"],
    spawnCount: 3,
    maxExpectedSellValuePerKill: 26.15
  },
  {
    bandId: "later_region",
    displayName: "Later Region Anchor",
    worldStage: "later",
    routeDepth: 5,
    targetPlayerLevels: { min: 35, max: null },
    enemyIds: [],
    spawnCount: 0,
    maxExpectedSellValuePerKill: null
  }
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertRegex(source, regex, message) {
  assert(regex.test(source), message);
}

function getGeneralStoreSellValue(itemId) {
  const item = itemDefs[itemId];
  if (!item || !Number.isFinite(item.value)) return 0;
  return Math.floor(Math.max(0, Math.floor(item.value)) * 0.5);
}

function summarizeDropTable(dropTable) {
  return dropTable.reduce((summary, entry) => {
    const weight = Math.max(0, Math.floor(Number(entry.weight) || 0));
    if (entry.kind === "nothing") summary.nothingWeight += weight;
    if (entry.kind === "coins") summary.coinWeight += weight;

    let perRollValue = 0;
    if (entry.kind === "coins") {
      perRollValue = ((Number(entry.minAmount) || 0) + (Number(entry.maxAmount) || 0)) / 2;
    } else if (entry.kind === "item") {
      const avgAmount = ((Number(entry.minAmount) || 0) + (Number(entry.maxAmount) || 0)) / 2;
      perRollValue = avgAmount * getGeneralStoreSellValue(entry.itemId);
    }
    summary.expectedSellValuePerKill += (weight / 100) * perRollValue;
    return summary;
  }, { expectedSellValuePerKill: 0, nothingWeight: 0, coinWeight: 0 });
}

assert(!combatContentSource.includes("WORLD_ENEMY_SPAWNS"), "combat content should not inline world enemy spawn tables");
assert(
  combatContentSource.includes("buildWorldBootstrapResult"),
  "combat spawn lookup should flow through the typed world bootstrap path"
);
assert(
  combatContentSource.includes("combatSpawns"),
  "combat spawn lookup should read authored combatSpawns from the world definition"
);

const EXPECTED_ENEMIES = {
  enemy_rat: {
    displayName: "Rat",
    stats: { hitpoints: 4, attack: 1, strength: 1, defense: 1 },
    bonuses: { meleeAccuracyBonus: 0, meleeDefenseBonus: 0, enemyMaxHit: 1 },
    behavior: { aggroType: "passive", aggroRadius: 0, chaseRange: 4, roamingRadius: 3 },
    respawnTicks: 20,
    attackTickCycle: 5,
    expectedDropTable: [
      { kind: "item", itemId: "rat_tail", weight: 35, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 65 }
    ],
    expectedSnapshot: { attackValue: 1, defenseValue: 1, maxHit: 1 }
  },
  enemy_chicken: {
    displayName: "Chicken",
    stats: { hitpoints: 3, attack: 1, strength: 1, defense: 0 },
    bonuses: { meleeAccuracyBonus: 0, meleeDefenseBonus: 0, enemyMaxHit: 1 },
    behavior: { aggroType: "passive", aggroRadius: 0, chaseRange: 3, roamingRadius: 4 },
    expectedAppearance: { kind: "chicken" },
    respawnTicks: 20,
    attackTickCycle: 5,
    expectedDropTable: [
      { kind: "item", itemId: "raw_chicken", weight: 55, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "feathers_bundle", weight: 35, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 10 }
    ],
    expectedSnapshot: { attackValue: 1, defenseValue: 0, maxHit: 1 }
  },
  enemy_goblin_grunt: {
    displayName: "Goblin Grunt",
    stats: { hitpoints: 8, attack: 4, strength: 4, defense: 3 },
    bonuses: { meleeAccuracyBonus: 2, meleeDefenseBonus: 1, enemyMaxHit: 2 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 6, roamingRadius: 1 },
    expectedAppearance: { kind: "humanoid", modelPresetId: "goblin", animationSetId: "goblin_basic" },
    respawnTicks: 34,
    attackTickCycle: 5,
    expectedDropTable: [
      { kind: "coins", weight: 45, minAmount: 2, maxAmount: 5 },
      { kind: "item", itemId: "goblin_club", weight: 12, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "bronze_sword", weight: 10, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "bronze_axe", weight: 8, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "bronze_pickaxe", weight: 7, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 18 }
    ],
    expectedSnapshot: { attackValue: 6, defenseValue: 4, maxHit: 2 }
  },
  enemy_boar: {
    displayName: "Boar",
    stats: { hitpoints: 7, attack: 5, strength: 5, defense: 3 },
    bonuses: { meleeAccuracyBonus: 2, meleeDefenseBonus: 1, enemyMaxHit: 2 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 5, roamingRadius: 2 },
    respawnTicks: 30,
    attackTickCycle: 5,
    expectedDropTable: [
      { kind: "item", itemId: "raw_boar_meat", weight: 60, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "boar_tusk", weight: 20, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 20 }
    ],
    expectedSnapshot: { attackValue: 7, defenseValue: 4, maxHit: 2 }
  },
  enemy_wolf: {
    displayName: "Wolf",
    stats: { hitpoints: 10, attack: 8, strength: 7, defense: 4 },
    bonuses: { meleeAccuracyBonus: 4, meleeDefenseBonus: 1, enemyMaxHit: 3 },
    behavior: { aggroType: "aggressive", aggroRadius: 5, chaseRange: 7, roamingRadius: 3 },
    respawnTicks: 30,
    attackTickCycle: 4,
    expectedDropTable: [
      { kind: "item", itemId: "raw_wolf_meat", weight: 55, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "wolf_fang", weight: 20, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 25 }
    ],
    expectedSnapshot: { attackValue: 12, defenseValue: 5, maxHit: 3 }
  },
  enemy_guard: {
    displayName: "Guard",
    stats: { hitpoints: 14, attack: 8, strength: 8, defense: 8 },
    bonuses: { meleeAccuracyBonus: 4, meleeDefenseBonus: 4, enemyMaxHit: 3 },
    behavior: { aggroType: "aggressive", aggroRadius: 5, chaseRange: 7, roamingRadius: 0 },
    expectedAppearance: { kind: "humanoid", modelPresetId: "guard", animationSetId: "guard_basic" },
    respawnTicks: 42,
    attackTickCycle: 5,
    expectedDropTable: [
      { kind: "coins", weight: 40, minAmount: 5, maxAmount: 10 },
      { kind: "item", itemId: "guard_spear", weight: 8, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "guard_crest", weight: 5, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "bronze_sword", weight: 10, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "bronze_axe", weight: 10, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "bronze_pickaxe", weight: 5, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "iron_sword", weight: 10, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "iron_axe", weight: 5, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "iron_pickaxe", weight: 3, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 4 }
    ],
    expectedSnapshot: { attackValue: 12, defenseValue: 12, maxHit: 3 }
  },
  enemy_bear: {
    displayName: "Bear",
    stats: { hitpoints: 20, attack: 9, strength: 11, defense: 10 },
    bonuses: { meleeAccuracyBonus: 3, meleeDefenseBonus: 5, enemyMaxHit: 5 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 6, roamingRadius: 2 },
    respawnTicks: 50,
    attackTickCycle: 6,
    expectedDropTable: [
      { kind: "item", itemId: "raw_shrimp", weight: 50, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "bear_leather", weight: 35, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 15 }
    ],
    expectedSnapshot: { attackValue: 12, defenseValue: 15, maxHit: 5 }
  },
  enemy_heavy_brute: {
    displayName: "Heavy Brute",
    stats: { hitpoints: 22, attack: 10, strength: 12, defense: 12 },
    bonuses: { meleeAccuracyBonus: 4, meleeDefenseBonus: 6, enemyMaxHit: 5 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 6, roamingRadius: 1 },
    respawnTicks: 50,
    attackTickCycle: 6,
    expectedDropTable: [
      { kind: "coins", weight: 50, minAmount: 8, maxAmount: 15 },
      { kind: "item", itemId: "iron_sword", weight: 16, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "iron_axe", weight: 10, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "iron_pickaxe", weight: 8, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 16 }
    ],
    expectedSnapshot: { attackValue: 14, defenseValue: 18, maxHit: 5 }
  },
  enemy_fast_striker: {
    displayName: "Fast Striker",
    stats: { hitpoints: 12, attack: 12, strength: 9, defense: 5 },
    bonuses: { meleeAccuracyBonus: 6, meleeDefenseBonus: 1, enemyMaxHit: 4 },
    behavior: { aggroType: "aggressive", aggroRadius: 5, chaseRange: 7, roamingRadius: 2 },
    respawnTicks: 40,
    attackTickCycle: 4,
    expectedDropTable: [
      { kind: "coins", weight: 45, minAmount: 4, maxAmount: 8 },
      { kind: "item", itemId: "iron_sword", weight: 18, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "iron_axe", weight: 8, minAmount: 1, maxAmount: 1 },
      { kind: "item", itemId: "iron_pickaxe", weight: 6, minAmount: 1, maxAmount: 1 },
      { kind: "nothing", weight: 23 }
    ],
    expectedSnapshot: { attackValue: 18, defenseValue: 6, maxHit: 4 }
  },
  enemy_training_dummy: {
    displayName: "Training Dummy",
    stats: { hitpoints: 250, attack: 1, strength: 1, defense: 0 },
    bonuses: { meleeAccuracyBonus: 0, meleeDefenseBonus: 0, enemyMaxHit: 0 },
    behavior: { aggroType: "passive", aggroRadius: 0, chaseRange: 2, roamingRadius: 0 },
    respawnTicks: 8,
    attackTickCycle: 4,
    expectedDropTable: [
      { kind: "nothing", weight: 100 }
    ],
    expectedSnapshot: { attackValue: 1, defenseValue: 0, maxHit: 0 }
  }
};

const listedEnemyIds = new Set(combatContent.listEnemyTypes().map((enemy) => enemy.enemyId));
const enemyLootMetrics = {};
for (const enemyId of Object.keys(EXPECTED_ENEMIES)) {
  assert.ok(listedEnemyIds.has(enemyId), `${enemyId} should be exposed from listEnemyTypes`);
}

assert.strictEqual(
  typeof combatContent.listCombatProgressionBands,
  "function",
  "combat content should expose the combat progression-band contract"
);
assert.strictEqual(
  typeof combatContent.getCombatProgressionBandForEnemy,
  "function",
  "combat content should expose enemy-to-progression-band lookup"
);
assert.strictEqual(
  typeof combatContent.listCombatProgressionBandWorldSummaries,
  "function",
  "combat content should expose world progression-band summaries"
);

const progressionBands = combatContent.listCombatProgressionBands();
assert.deepStrictEqual(
  progressionBands.map((band) => band.bandId),
  EXPECTED_PROGRESSION_BANDS.map((band) => band.bandId),
  "combat progression bands should stay in the authored route-depth order"
);

const assignedProgressionEnemies = new Set();
for (const expectedBand of EXPECTED_PROGRESSION_BANDS) {
  const band = progressionBands.find((entry) => entry.bandId === expectedBand.bandId);
  assert.ok(band, `${expectedBand.bandId} should be listed as a combat progression band`);
  assert.strictEqual(band.displayName, expectedBand.displayName, `${expectedBand.bandId} display name should match`);
  assert.strictEqual(band.worldStage, expectedBand.worldStage, `${expectedBand.bandId} world stage should match`);
  assert.strictEqual(band.routeDepth, expectedBand.routeDepth, `${expectedBand.bandId} route depth should match`);
  assert.deepStrictEqual(
    band.targetPlayerLevels,
    expectedBand.targetPlayerLevels,
    `${expectedBand.bandId} player-level band should match`
  );
  assert.deepStrictEqual(band.enemyIds, expectedBand.enemyIds, `${expectedBand.bandId} enemy list should match`);
  assert.strictEqual(
    band.maxExpectedSellValuePerKill,
    expectedBand.maxExpectedSellValuePerKill,
    `${expectedBand.bandId} loot-value ceiling should match the live benchmark`
  );
  assert.ok(Array.isArray(band.spawnGroupPrefixes) && band.spawnGroupPrefixes.length > 0, `${expectedBand.bandId} should own placement prefixes`);
  assert.ok(Array.isArray(band.placementGuidance) && band.placementGuidance.length > 0, `${expectedBand.bandId} should document placement guidance`);
  assert.ok(Array.isArray(band.lootGuidance) && band.lootGuidance.length > 0, `${expectedBand.bandId} should document loot guidance`);

  for (const enemyId of expectedBand.enemyIds) {
    assignedProgressionEnemies.add(enemyId);
    const enemyBand = combatContent.getCombatProgressionBandForEnemy(enemyId);
    assert.ok(enemyBand, `${enemyId} should resolve to a combat progression band`);
    assert.strictEqual(enemyBand.bandId, expectedBand.bandId, `${enemyId} should map to ${expectedBand.bandId}`);
  }
}

for (const enemyId of listedEnemyIds) {
  assert.ok(assignedProgressionEnemies.has(enemyId), `${enemyId} should have an authored combat progression band`);
}

const clonedProgressionBands = combatContent.listCombatProgressionBands();
clonedProgressionBands[0].enemyIds.push("mutated_enemy");
assert.ok(
  !combatContent.listCombatProgressionBands()[0].enemyIds.includes("mutated_enemy"),
  "combat progression band APIs should return cloned arrays"
);

const starterTownBandSummaries = new Map(
  combatContent.listCombatProgressionBandWorldSummaries("main_overworld").map((summary) => [summary.bandId, summary])
);
for (const expectedBand of EXPECTED_PROGRESSION_BANDS) {
  const summary = starterTownBandSummaries.get(expectedBand.bandId);
  assert.ok(summary, `${expectedBand.bandId} should have a starter-town band summary`);
  assert.strictEqual(summary.worldId, "main_overworld", `${expectedBand.bandId} world summary should keep the requested world id`);
  assert.strictEqual(summary.spawnCount, expectedBand.spawnCount, `${expectedBand.bandId} starter-town spawn count should match current authoring`);
  const expectedWorldEnemyIds = expectedBand.spawnCount > 0 ? expectedBand.enemyIds.slice().sort() : [];
  assert.deepStrictEqual(
    summary.enemyIds,
    expectedWorldEnemyIds,
    `${expectedBand.bandId} starter-town enemy summary should match current authoring`
  );
  const band = progressionBands.find((entry) => entry.bandId === expectedBand.bandId);
  for (const spawnGroupId of summary.spawnGroupIds) {
    assert.ok(
      band.spawnGroupPrefixes.some((prefix) => spawnGroupId.startsWith(prefix)),
      `${spawnGroupId} should match a placement prefix for ${expectedBand.bandId}`
    );
  }
}

for (const [enemyId, expected] of Object.entries(EXPECTED_ENEMIES)) {
  const enemy = combatContent.getEnemyTypeDefinition(enemyId);
  assert.ok(enemy, `${enemyId} should resolve from combat content`);
  assert.strictEqual(enemy.displayName, expected.displayName, `${enemyId} should keep the expected display name`);
  assert.deepStrictEqual(enemy.stats, expected.stats, `${enemyId} stats should match first-pass combat tuning`);
  assert.deepStrictEqual(enemy.bonuses, expected.bonuses, `${enemyId} combat bonuses should match first-pass tuning`);
  assert.strictEqual(enemy.attackProfile.range, 1, `${enemyId} should remain melee range`);
  assert.strictEqual(enemy.attackProfile.tickCycle, expected.attackTickCycle, `${enemyId} attack speed should match first-pass tuning`);
  assert.strictEqual(enemy.behavior.aggroType, expected.behavior.aggroType, `${enemyId} aggro type should match spec`);
  assert.strictEqual(enemy.behavior.aggroRadius, expected.behavior.aggroRadius, `${enemyId} aggro radius should match spec`);
  assert.strictEqual(enemy.behavior.chaseRange, expected.behavior.chaseRange, `${enemyId} chase range should match spec`);
  assert.strictEqual(enemy.behavior.roamingRadius, expected.behavior.roamingRadius, `${enemyId} roaming radius should match spec`);
  assert.strictEqual(enemy.behavior.defaultMovementSpeed, 1, `${enemyId} default movement speed should remain fixed at 1`);
  assert.strictEqual(enemy.behavior.combatMovementSpeed, 1, `${enemyId} combat movement speed should remain fixed at 1`);
  assert.strictEqual(enemy.respawnTicks, expected.respawnTicks, `${enemyId} respawn ticks should match authored timing`);
  if (expected.expectedAppearance) {
    for (const [appearanceKey, appearanceValue] of Object.entries(expected.expectedAppearance)) {
      assert.strictEqual(enemy.appearance[appearanceKey], appearanceValue, `${enemyId} appearance ${appearanceKey} should match authored presentation`);
    }
  }

  const snapshot = combatFormulas.computeEnemyMeleeCombatSnapshot(enemy);
  assert.strictEqual(snapshot.attackValue, expected.expectedSnapshot.attackValue, `${enemyId} attack value should derive from stats + accuracy bonus`);
  assert.strictEqual(snapshot.defenseValue, expected.expectedSnapshot.defenseValue, `${enemyId} defense value should derive from stats + defense bonus`);
  assert.strictEqual(snapshot.maxHit, expected.expectedSnapshot.maxHit, `${enemyId} max hit should derive from authored enemyMaxHit`);
  assert.strictEqual(snapshot.attackTickCycle, expected.attackTickCycle, `${enemyId} snapshot should surface authored attack speed`);

  assert.ok(Array.isArray(enemy.dropTable) && enemy.dropTable.length > 0, `${enemyId} should include a non-empty drop table`);
  const dropWeightTotal = enemy.dropTable.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.weight) || 0)), 0);
  assert.strictEqual(dropWeightTotal, 100, `${enemyId} drop table weights should total 100`);
  if (expected.expectedDropTable) {
    assert.deepStrictEqual(enemy.dropTable, expected.expectedDropTable, `${enemyId} drop table should match the authored table`);
  }

  const lootSummary = summarizeDropTable(enemy.dropTable);
  enemyLootMetrics[enemyId] = lootSummary;
  const expectedLootSummary = EXPECTED_LOOT_SUMMARIES[enemyId];
  if (expectedLootSummary) {
    assert.strictEqual(
      Number(lootSummary.expectedSellValuePerKill.toFixed(2)),
      expectedLootSummary.expectedSellValuePerKill,
      `${enemyId} expected sell value per kill should match the authored benchmark`
    );
    assert.strictEqual(lootSummary.nothingWeight, expectedLootSummary.nothingWeight, `${enemyId} empty-drop weight should match the benchmark lock`);
    assert.strictEqual(lootSummary.coinWeight, expectedLootSummary.coinWeight, `${enemyId} coin-drop weight should match the benchmark lock`);
  }

  for (const entry of enemy.dropTable) {
    assert.ok(entry && typeof entry === "object", `${enemyId} drop entries should be objects`);
    assert.ok(entry.kind === "nothing" || entry.kind === "coins" || entry.kind === "item", `${enemyId} drop entry kind should be valid`);
    assert.ok(Number.isFinite(entry.weight) && entry.weight > 0, `${enemyId} drop entry weights should be positive`);

    if (entry.kind === "item") {
      const itemId = String(entry.itemId || "").trim();
      assert.ok(itemId, `${enemyId} item drops should provide an itemId`);
      if (!AUTHORED_PENDING_ITEM_IDS.has(itemId)) {
        assert.ok(itemDefs[itemId], `${enemyId} drop item '${itemId}' should exist in the runtime item catalog`);
      }
    }
    if (entry.kind === "coins" || entry.kind === "item") {
      assert.ok(Number.isFinite(entry.minAmount), `${enemyId} '${entry.kind}' drops should include minAmount`);
      assert.ok(Number.isFinite(entry.maxAmount), `${enemyId} '${entry.kind}' drops should include maxAmount`);
      assert.ok(entry.minAmount >= 1, `${enemyId} '${entry.kind}' drops should have minAmount >= 1`);
      assert.ok(entry.maxAmount >= entry.minAmount, `${enemyId} '${entry.kind}' drops should have maxAmount >= minAmount`);
    }
  }
}

assert(
  enemyLootMetrics.enemy_rat.expectedSellValuePerKill < enemyLootMetrics.enemy_chicken.expectedSellValuePerKill,
  "chicken should outpace rat on direct-sell value"
);
assert(
  enemyLootMetrics.enemy_chicken.expectedSellValuePerKill < enemyLootMetrics.enemy_boar.expectedSellValuePerKill,
  "boar should beat passive critters on value"
);
assert(
  enemyLootMetrics.enemy_boar.expectedSellValuePerKill < enemyLootMetrics.enemy_wolf.expectedSellValuePerKill,
  "wolf should beat boar on value"
);
assert(
  enemyLootMetrics.enemy_wolf.expectedSellValuePerKill < enemyLootMetrics.enemy_goblin_grunt.expectedSellValuePerKill,
  "goblin loot should be the first meaningful humanoid economy step"
);
assert(
  enemyLootMetrics.enemy_goblin_grunt.expectedSellValuePerKill < enemyLootMetrics.enemy_bear.expectedSellValuePerKill,
  "bear should sit above goblin on direct-sale value"
);
assert(
  enemyLootMetrics.enemy_bear.expectedSellValuePerKill < enemyLootMetrics.enemy_guard.expectedSellValuePerKill,
  "guard should outpace bear on gatekeeper value"
);
assert(
  enemyLootMetrics.enemy_guard.expectedSellValuePerKill < enemyLootMetrics.enemy_fast_striker.expectedSellValuePerKill,
  "fast striker should beat guard on direct-sale value"
);
assert(
  enemyLootMetrics.enemy_fast_striker.expectedSellValuePerKill < enemyLootMetrics.enemy_heavy_brute.expectedSellValuePerKill,
  "heavy brute should remain the top first-pass direct-sale payout"
);
assert(
  enemyLootMetrics.enemy_goblin_grunt.expectedSellValuePerKill < itemDefs.bronze_sword.value,
  "goblin loot should stay below the cost of buying a bronze sword"
);
assert(
  enemyLootMetrics.enemy_guard.expectedSellValuePerKill < itemDefs.iron_sword.value,
  "guard loot should stay below the cost of buying an iron sword"
);
assert(
  enemyLootMetrics.enemy_fast_striker.expectedSellValuePerKill < itemDefs.iron_sword.value,
  "fast striker loot should stay below the cost of buying an iron sword"
);
assert(
  enemyLootMetrics.enemy_heavy_brute.expectedSellValuePerKill < itemDefs.iron_sword.value,
  "heavy brute loot should stay below the cost of buying an iron sword"
);

assertRegex(
  combatRoadmapSource,
  /\| Loot-table and drop-band authoring pass \| Complete \|/,
  "combat roadmap should mark the loot-table pass complete"
);
assertRegex(
  combatRoadmapSource,
  /general-store half-price fallback[\s\S]*floor\(item\.value x 0\.5\)/,
  "combat roadmap should describe the direct-sale loot benchmark formula"
);
for (const row of EXPECTED_ROADMAP_LOOT_ROWS) {
  assertRegex(
    combatRoadmapSource,
    new RegExp(
      `\\|\\s*${escapeRegExp(row.enemy)}\\s*\\|\\s*${escapeRegExp(row.role)}\\s*\\|\\s*${row.emptyWeight}%\\s*\\|\\s*${row.coinWeight}%\\s*\\|\\s*${escapeRegExp(row.identity)}\\s*\\|\\s*${escapeRegExp(row.expectedSellValuePerKill)}\\s*\\|`
    ),
    `${row.enemy} loot benchmark row should match the roadmap`
  );
}
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-007: First-pass loot table bands and drop authoring rules are now locked against live enemy tables, general-store direct-sale benchmarks, and focused content-guard coverage\./,
  "combat status should mark COMBAT-007 complete with the benchmark lock"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-014: Combat progression bands now classify enemy difficulty, loot ceilings, and placement stages across starter, mid-band, and later-region rollout planning\./,
  "combat status should mark COMBAT-014 complete with the progression-band contract"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-015: First-pass encounter coverage now includes an optional southeast camp-threat pocket with bear, heavy brute, and fast striker spawns locked by topology and world parity guards\./,
  "combat status should mark COMBAT-015 complete with the camp-threat encounter rollout"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-016A: Authored patrol routes now have a first guarded slice on the east-outpost north guard, with patrol-aware idle movement, route cloning, chase-envelope coverage, world validation, and parity guards\./,
  "combat status should mark COMBAT-016A complete with the authored patrol route slice"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-016B: Aggressive same-group ally assist now uses authored spawn-group IDs, local assist radius checks, leash\/path validation, and a one-tick opening cooldown so camps can coordinate without pulling passive critters or distant group members\./,
  "combat status should mark COMBAT-016B complete with the group-assist contract"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-017: Ranged player combat is live on the shared combat core with bow and arrow item contracts, ranged-range attacks, ammo selection and consumption, Ranged XP awards, projectile visuals, and focused runtime\/item guards\./,
  "combat status should mark COMBAT-017 complete with the ranged player-combat slice"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-018: Magic player combat is live on the shared combat core with staff contracts, elemental\/combination rune fuel selection and consumption, staff-range casting, Magic XP awards, and rune-colored projectile visuals\./,
  "combat status should mark COMBAT-018 complete with the magic player-combat slice"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-019A: Broader combat balance tooling now compares melee, ranged, and magic player builds with ammo\/rune-aware deterministic simulator summaries\./,
  "combat status should mark COMBAT-019A complete with the style-aware simulator slice"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-019B1: Water-family rune hits now apply the typed `Chilled` status effect, delaying an enemy's next swing by one tick with reset\/respawn-safe runtime state and focused domain\/runtime coverage\./,
  "combat status should mark the water-rune status-effect slice complete"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-019B2A: Active `Chilled` effects now appear above affected combat targets with their remaining duration and a concise tactical explanation\./,
  "combat status should mark the Chilled target-feedback slice complete"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-019B2B1: Earth and Dust rune hits now apply typed `Sundered` for three ticks, reducing the target's effective Defence by 3 with live target feedback and focused runtime coverage\./,
  "combat status should mark the earth-rune Sundered slice complete"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-019B2B3A: Lava-rune hits now apply typed `Scorched` for two later ticks, dealing one burn damage each tick with live target feedback and reset\/respawn-safe cleanup\./,
  "combat status should retain the completed lava-rune Scorched slice"
);
assertRegex(
  combatStatusSource,
  /- \[x\] COMBAT-019B2B3B1: Smoke-rune hits now apply the typed `Disoriented` profile for two ticks, reducing enemy Attack by 3 through the existing status lifecycle and target feedback\./,
  "combat status should mark the smoke-rune Disoriented slice complete"
);
assertRegex(
  combatStatusSource,
  /## Now\s*- \[x\] COMBAT-019B2B3B1: Smoke-rune `Disoriented` now reuses the typed air-family status contract through the canonical item catalog and generated runtime mirror\./,
  "combat status should surface the completed smoke-rune slice as current work"
);
assertRegex(
  combatStatusSource,
  /## Next\s*- \[ \] COMBAT-019B2B3B2: Add player-triggered special attacks\./,
  "combat status should advance the next focus to player-triggered specials"
);
assertRegex(
  skillsIndexSource,
  /\| Combat \| In Progress \| Water-family Chilled, earth-family Sundered, air\/smoke Disoriented, and lava-rune Scorched now provide visible, typed elemental combat effects \| Player-triggered special attacks \| None \|/,
  "skills index should reflect the completed smoke-rune slice and next specials focus"
);
assertRegex(
  combatRoadmapSource,
  /\| Authored patrol-route movement slice \| Complete \|/,
  "combat roadmap should mark the authored patrol-route movement slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Spawn-group ally assist slice \| Complete \|/,
  "combat roadmap should mark the group-assist slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Player ranged combat slice \| Complete \|/,
  "combat roadmap should mark the player ranged combat slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Player magic combat slice \| Complete \|/,
  "combat roadmap should mark the player magic combat slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Water-rune Chilled status-effect slice \| Complete \|/,
  "combat roadmap should mark the water-rune status-effect slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Earth-rune Sundered status-effect slice \| Complete \|/,
  "combat roadmap should mark the earth-rune Sundered slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Air-rune Disoriented status-effect slice \| Complete \|/,
  "combat roadmap should mark the air-rune Disoriented slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Lava-rune Scorched status-effect slice \| Complete \|/,
  "combat roadmap should mark the lava-rune Scorched slice complete"
);
assertRegex(
  combatRoadmapSource,
  /\| Smoke-rune Disoriented status-effect slice \| Complete \|/,
  "combat roadmap should mark the smoke-rune Disoriented slice complete"
);
assertRegex(
  combatRoadmapSource,
  /Air and smoke runes expose a typed `Disoriented` on-hit profile, reducing a damaged enemy's effective Attack by 3 for two ticks without changing its swing timing\./,
  "combat roadmap should document the shared air\/smoke Disoriented contract"
);
assertRegex(
  combatRoadmapSource,
  /Lava runes expose a typed `Scorched` on-hit profile, dealing one burn damage on each of the next two combat ticks without consuming more runes or duplicating the initial hit\./,
  "combat roadmap should document the lava-rune Scorched contract"
);
assertRegex(
  combatRoadmapSource,
  /\| Chilled target-feedback slice \| Complete \|/,
  "combat roadmap should mark the Chilled target-feedback slice complete"
);
assertRegex(
  combatRoadmapSource,
  /Ranged player attacks use the same lock, cooldown, hit-roll, damage, aggro, and XP path as melee while resolving range from the active bow snapshot instead of melee adjacency\./,
  "combat roadmap should document shared-core ranged attack behavior"
);
assertRegex(
  combatRoadmapSource,
  /A damaging hit from a selected water-family rune applies `Chilled` for two ticks\./,
  "combat roadmap should document the bounded water-rune status-effect behavior"
);
assertRegex(
  combatRoadmapSource,
  /An enemy affected by `Chilled` shows an ice-blue target badge above its combat health bar/,
  "combat roadmap should document typed-status target feedback"
);
assertRegex(
  combatRoadmapSource,
  /A damaging air- or smoke-rune hit applies `Disoriented` for two ticks\./,
  "combat roadmap should document the bounded air\/smoke status-effect behavior"
);
assertRegex(
  combatRoadmapSource,
  /Magic player attacks use the same lock, cooldown, hit-roll, damage, aggro, and XP path as melee while resolving range from the active staff snapshot instead of melee adjacency\./,
  "combat roadmap should document shared-core magic attack behavior"
);
assertRegex(
  combatRoadmapSource,
  /Authored patrol routes are optional spawn-node waypoint loops; patrol enemies prefer route movement while idle and fall back to random roaming only when no usable route exists\./,
  "combat roadmap should document authored patrol-route movement behavior"
);

assertRegex(
  combatRoadmapSource,
  /### Current Combat Progression Bands[\s\S]*\| Starter Opt-In \| Starter \| 1-3 \| Training Dummy, Rat, Chicken \| Safe optional starter targets \| <= 2\.50 gp\/kill \|/,
  "combat roadmap should document the starter opt-in progression band"
);
assertRegex(
  combatRoadmapSource,
  /\| Camp Threat \| Mid \| 20-35 \| Bear, Fast Striker, Heavy Brute \| Clustered optional camps or ruins with local ally assist \| <= 26\.15 gp\/kill \|/,
  "combat roadmap should document the camp-threat progression band"
);
assertRegex(
  combatRoadmapSource,
  /\| Starter Town \| Camp Threat \| `camp_southeast_ruins` \| 3 \|/,
  "combat roadmap should document the live southeast camp-threat spawn coverage"
);
assertRegex(
  combatRoadmapSource,
  /\| Later Region Anchor \| Later \| 35\+ \| Deferred \| Named anchors and later-region objectives \| Deferred \|/,
  "combat roadmap should preserve a deferred later-region combat band"
);

assert.strictEqual(
  typeof combatContent.listEnemySpawnNodesForWorld,
  "function",
  "combat content should continue exporting the spawn lookup API"
);

const mainOverworldSpawns = combatContent.listEnemySpawnNodesForWorld("main_overworld");
const guardPatrolSpawn = mainOverworldSpawns.find((spawn) => spawn.spawnNodeId === "enemy_spawn_guard_east_outpost_north");
assert.ok(guardPatrolSpawn, "north guard patrol spawn should resolve through combat content");
assert.deepStrictEqual(
  guardPatrolSpawn.patrolRoute,
  [
    { x: 485, y: 328, z: 0 },
    { x: 480, y: 328, z: 0 },
    { x: 480, y: 325, z: 0 },
    { x: 491, y: 325, z: 0 },
    { x: 491, y: 328, z: 0 }
  ],
  "north guard patrol route should flow through scaled combat content"
);
const guardPatrolRuntime = combatContent.createEnemyRuntimeState(guardPatrolSpawn);
assert.deepStrictEqual(
  guardPatrolRuntime.resolvedPatrolRoute,
  guardPatrolSpawn.patrolRoute,
  "guard patrol runtime should clone the authored route"
);
assert.strictEqual(guardPatrolRuntime.patrolRouteIndex, 1, "guard patrol runtime should start toward the second waypoint");
assert.strictEqual(guardPatrolRuntime.resolvedChaseRange, 8, "guard patrol chase range should cover the authored route envelope");
guardPatrolSpawn.patrolRoute[0].x = 1;
assert.strictEqual(
  combatContent.listEnemySpawnNodesForWorld("main_overworld").find((spawn) => spawn.spawnNodeId === "enemy_spawn_guard_east_outpost_north").patrolRoute[0].x,
  485,
  "combat spawn patrol routes should be cloned on read"
);

console.log("Combat enemy content guard passed.");
