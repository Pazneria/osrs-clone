const assert = require("assert");
const path = require("path");

const { loadTsModule } = require("./ts-module-loader");
const { loadRuntimeItemCatalog } = require("../content/runtime-item-catalog");

const root = path.resolve(__dirname, "..", "..");
const combatContent = loadTsModule(path.resolve(root, "src/game/combat/content.ts"));
const combatFormulas = loadTsModule(path.resolve(root, "src/game/combat/formulas.ts"));
const { itemDefs } = loadRuntimeItemCatalog(root);

const EXPECTED_ENEMIES = {
  enemy_rat: {
    displayName: "Rat",
    stats: { hitpoints: 4, attack: 1, strength: 1, defense: 1 },
    bonuses: { meleeAccuracyBonus: 0, meleeDefenseBonus: 0, enemyMaxHit: 1 },
    behavior: { aggroType: "passive", aggroRadius: 0, chaseRange: 4, roamingRadius: 3 },
    respawnTicks: 20,
    attackTickCycle: 5,
    expectedSnapshot: { attackValue: 1, defenseValue: 1, maxHit: 1 }
  },
  enemy_chicken: {
    displayName: "Chicken",
    stats: { hitpoints: 3, attack: 1, strength: 1, defense: 0 },
    bonuses: { meleeAccuracyBonus: 0, meleeDefenseBonus: 0, enemyMaxHit: 1 },
    behavior: { aggroType: "passive", aggroRadius: 0, chaseRange: 3, roamingRadius: 4 },
    respawnTicks: 20,
    attackTickCycle: 5,
    expectedSnapshot: { attackValue: 1, defenseValue: 0, maxHit: 1 }
  },
  enemy_goblin_grunt: {
    displayName: "Goblin Grunt",
    stats: { hitpoints: 8, attack: 4, strength: 4, defense: 3 },
    bonuses: { meleeAccuracyBonus: 2, meleeDefenseBonus: 1, enemyMaxHit: 2 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 6, roamingRadius: 1 },
    respawnTicks: 34,
    attackTickCycle: 5,
    expectedSnapshot: { attackValue: 6, defenseValue: 4, maxHit: 2 }
  },
  enemy_boar: {
    displayName: "Boar",
    stats: { hitpoints: 7, attack: 5, strength: 5, defense: 3 },
    bonuses: { meleeAccuracyBonus: 2, meleeDefenseBonus: 1, enemyMaxHit: 2 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 5, roamingRadius: 2 },
    respawnTicks: 30,
    attackTickCycle: 5,
    expectedSnapshot: { attackValue: 7, defenseValue: 4, maxHit: 2 }
  },
  enemy_wolf: {
    displayName: "Wolf",
    stats: { hitpoints: 10, attack: 8, strength: 7, defense: 4 },
    bonuses: { meleeAccuracyBonus: 4, meleeDefenseBonus: 1, enemyMaxHit: 3 },
    behavior: { aggroType: "aggressive", aggroRadius: 5, chaseRange: 7, roamingRadius: 3 },
    respawnTicks: 30,
    attackTickCycle: 4,
    expectedSnapshot: { attackValue: 12, defenseValue: 5, maxHit: 3 }
  },
  enemy_guard: {
    displayName: "Guard",
    stats: { hitpoints: 14, attack: 8, strength: 8, defense: 8 },
    bonuses: { meleeAccuracyBonus: 4, meleeDefenseBonus: 4, enemyMaxHit: 3 },
    behavior: { aggroType: "aggressive", aggroRadius: 5, chaseRange: 7, roamingRadius: 0 },
    respawnTicks: 42,
    attackTickCycle: 5,
    expectedSnapshot: { attackValue: 12, defenseValue: 12, maxHit: 3 }
  },
  enemy_bear: {
    displayName: "Bear",
    stats: { hitpoints: 20, attack: 9, strength: 11, defense: 10 },
    bonuses: { meleeAccuracyBonus: 3, meleeDefenseBonus: 5, enemyMaxHit: 5 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 6, roamingRadius: 2 },
    respawnTicks: 50,
    attackTickCycle: 6,
    expectedSnapshot: { attackValue: 12, defenseValue: 15, maxHit: 5 }
  },
  enemy_heavy_brute: {
    displayName: "Heavy Brute",
    stats: { hitpoints: 22, attack: 10, strength: 12, defense: 12 },
    bonuses: { meleeAccuracyBonus: 4, meleeDefenseBonus: 6, enemyMaxHit: 5 },
    behavior: { aggroType: "aggressive", aggroRadius: 4, chaseRange: 6, roamingRadius: 1 },
    respawnTicks: 50,
    attackTickCycle: 6,
    expectedSnapshot: { attackValue: 14, defenseValue: 18, maxHit: 5 }
  },
  enemy_fast_striker: {
    displayName: "Fast Striker",
    stats: { hitpoints: 12, attack: 12, strength: 9, defense: 5 },
    bonuses: { meleeAccuracyBonus: 6, meleeDefenseBonus: 1, enemyMaxHit: 4 },
    behavior: { aggroType: "aggressive", aggroRadius: 5, chaseRange: 7, roamingRadius: 2 },
    respawnTicks: 40,
    attackTickCycle: 4,
    expectedSnapshot: { attackValue: 18, defenseValue: 6, maxHit: 4 }
  },
  enemy_training_dummy: {
    displayName: "Training Dummy",
    stats: { hitpoints: 250, attack: 1, strength: 1, defense: 0 },
    bonuses: { meleeAccuracyBonus: 0, meleeDefenseBonus: 0, enemyMaxHit: 0 },
    behavior: { aggroType: "passive", aggroRadius: 0, chaseRange: 2, roamingRadius: 0 },
    respawnTicks: 8,
    attackTickCycle: 4,
    expectedSnapshot: { attackValue: 1, defenseValue: 0, maxHit: 0 }
  }
};

const listedEnemyIds = new Set(combatContent.listEnemyTypes().map((enemy) => enemy.enemyId));
for (const enemyId of Object.keys(EXPECTED_ENEMIES)) {
  assert.ok(listedEnemyIds.has(enemyId), `${enemyId} should be exposed from listEnemyTypes`);
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

  const snapshot = combatFormulas.computeEnemyMeleeCombatSnapshot(enemy);
  assert.strictEqual(snapshot.attackValue, expected.expectedSnapshot.attackValue, `${enemyId} attack value should derive from stats + accuracy bonus`);
  assert.strictEqual(snapshot.defenseValue, expected.expectedSnapshot.defenseValue, `${enemyId} defense value should derive from stats + defense bonus`);
  assert.strictEqual(snapshot.maxHit, expected.expectedSnapshot.maxHit, `${enemyId} max hit should derive from authored enemyMaxHit`);
  assert.strictEqual(snapshot.attackTickCycle, expected.attackTickCycle, `${enemyId} snapshot should surface authored attack speed`);

  assert.ok(Array.isArray(enemy.dropTable) && enemy.dropTable.length > 0, `${enemyId} should include a non-empty drop table`);
  const dropWeightTotal = enemy.dropTable.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.weight) || 0)), 0);
  assert.strictEqual(dropWeightTotal, 100, `${enemyId} drop table weights should total 100`);

  for (const entry of enemy.dropTable) {
    assert.ok(entry && typeof entry === "object", `${enemyId} drop entries should be objects`);
    assert.ok(entry.kind === "nothing" || entry.kind === "coins" || entry.kind === "item", `${enemyId} drop entry kind should be valid`);
    assert.ok(Number.isFinite(entry.weight) && entry.weight > 0, `${enemyId} drop entry weights should be positive`);

    if (entry.kind === "item") {
      const itemId = String(entry.itemId || "").trim();
      assert.ok(itemId, `${enemyId} item drops should provide an itemId`);
      assert.ok(itemDefs[itemId], `${enemyId} drop item '${itemId}' should exist in the runtime item catalog`);
    }
    if (entry.kind === "coins" || entry.kind === "item") {
      assert.ok(Number.isFinite(entry.minAmount), `${enemyId} '${entry.kind}' drops should include minAmount`);
      assert.ok(Number.isFinite(entry.maxAmount), `${enemyId} '${entry.kind}' drops should include maxAmount`);
      assert.ok(entry.minAmount >= 1, `${enemyId} '${entry.kind}' drops should have minAmount >= 1`);
      assert.ok(entry.maxAmount >= entry.minAmount, `${enemyId} '${entry.kind}' drops should have maxAmount >= minAmount`);
    }
  }
}

const starterTownSpawns = combatContent.listEnemySpawnNodesForWorld("starter_town");
const starterTownSpawnById = new Map(starterTownSpawns.map((spawn) => [spawn.spawnNodeId, spawn]));
assert.strictEqual(
  starterTownSpawnById.get("enemy_spawn_rat_south_field")?.roamingRadiusOverride,
  15,
  "starter rat spawn should override roaming radius to a wide field wander"
);
assert.strictEqual(
  starterTownSpawnById.get("enemy_spawn_goblin_east_path")?.roamingRadiusOverride,
  15,
  "starter goblin spawn should override roaming radius to a wide roadside wander"
);
assert.strictEqual(
  starterTownSpawnById.get("enemy_spawn_training_dummy_hub")?.enemyId,
  "enemy_training_dummy",
  "starter town should expose a dedicated training dummy spawn"
);
assert.strictEqual(
  starterTownSpawnById.get("enemy_spawn_training_dummy_hub")?.roamingRadiusOverride,
  0,
  "training dummy spawn should stay rooted in place"
);

console.log("Combat enemy content guard passed.");
