const assert = require("assert");
const path = require("path");

const { loadTsModule } = require("../lib/ts-module-loader");

const combatContent = loadTsModule(path.resolve(__dirname, "../../src/game/combat/content.ts"));
const combatFormulas = loadTsModule(path.resolve(__dirname, "../../src/game/combat/formulas.ts"));
const combatBridge = loadTsModule(path.resolve(__dirname, "../../src/game/platform/combat-bridge.ts"));

function makeWeapon(overrides = {}) {
  return {
    combat: {
      attackProfile: {
        styleFamily: "melee",
        damageType: "melee",
        range: overrides.range || 1,
        tickCycle: overrides.tickCycle || 4,
        projectile: false,
        ammoUse: false,
        familyTag: overrides.familyTag || "sword"
      },
      bonuses: {
        meleeAccuracyBonus: overrides.meleeAccuracyBonus || 0,
        meleeStrengthBonus: overrides.meleeStrengthBonus || 0,
        meleeDefenseBonus: overrides.meleeDefenseBonus || 0,
        rangedDefenseBonus: overrides.rangedDefenseBonus || 0,
        magicDefenseBonus: overrides.magicDefenseBonus || 0
      },
      requiredAttackLevel: overrides.requiredAttackLevel || 1
    }
  };
}

{
  assert.strictEqual(combatFormulas.decrementCooldown(4), 3, "cooldown should decrement by one when above zero");
  assert.strictEqual(combatFormulas.decrementCooldown(0), 0, "cooldown should not go negative");
  assert.strictEqual(combatFormulas.isWithinMeleeRange({ x: 10, y: 10 }, { x: 11, y: 11 }), true, "diagonal adjacency should count as melee range");
  assert.strictEqual(combatFormulas.isWithinSquareRange({ x: 10, y: 10 }, { x: 14, y: 14 }, 4), true, "square range should allow diagonal distance within range");
}

{
  const snapshot = combatFormulas.computePlayerMeleeCombatSnapshot({
    playerSkills: {
      attack: { xp: 0, level: 10 },
      strength: { xp: 0, level: 10 },
      defense: { xp: 0, level: 10 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeWeapon({ meleeAccuracyBonus: 10, meleeStrengthBonus: 10, tickCycle: 4, requiredAttackLevel: 10 }),
      shield: makeWeapon({ meleeDefenseBonus: 5, rangedDefenseBonus: 5, magicDefenseBonus: 5, familyTag: "shield" })
    },
    playerState: {
      selectedMeleeStyle: "attack"
    }
  });

  assert.strictEqual(snapshot.canAttack, true, "player should be able to attack when Attack level meets the requirement");
  assert.strictEqual(snapshot.attackValue, 22, "attack style should apply a 10% accuracy bonus after melee bonuses");
  assert.strictEqual(snapshot.defenseValue, 15, "defense value should include melee defense bonuses");
  assert.strictEqual(snapshot.maxHit, 3, "melee max hit should round up from the canonical formula");
}

{
  const gatedSnapshot = combatFormulas.computePlayerMeleeCombatSnapshot({
    playerSkills: {
      attack: { xp: 0, level: 1 },
      strength: { xp: 0, level: 40 },
      defense: { xp: 0, level: 1 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeWeapon({ meleeAccuracyBonus: 28, meleeStrengthBonus: 28, tickCycle: 4, requiredAttackLevel: 40 })
    },
    playerState: {
      selectedMeleeStyle: "strength"
    }
  });

  assert.strictEqual(gatedSnapshot.canAttack, false, "required Attack level should gate melee use");
  assert.strictEqual(gatedSnapshot.maxHit, 11, "strength style should still compute the correct displayed max hit");
}

{
  const unarmedSnapshot = combatFormulas.computePlayerMeleeCombatSnapshot({
    playerSkills: {
      attack: { xp: 0, level: 10 },
      strength: { xp: 0, level: 10 },
      defense: { xp: 0, level: 10 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {},
    playerState: {
      selectedMeleeStyle: "attack"
    }
  });

  assert.strictEqual(unarmedSnapshot.canAttack, true, "player should be able to attack unarmed");
  assert.strictEqual(unarmedSnapshot.attackValue, 11, "unarmed attack style should still apply melee attack-style math");
  assert.strictEqual(unarmedSnapshot.maxHit, 2, "unarmed should use the base melee max-hit formula");
  assert.strictEqual(unarmedSnapshot.attackRange, 1, "unarmed attacks should stay melee range");
  assert.strictEqual(unarmedSnapshot.attackTickCycle, 5, "unarmed attacks should use the default melee cadence");
}

{
  const enemySnapshot = combatFormulas.computeEnemyMeleeCombatSnapshot(combatContent.getEnemyTypeDefinition("enemy_goblin_grunt"));
  assert.deepStrictEqual(
    enemySnapshot,
    {
      attackValue: 6,
      defenseValue: 4,
      maxHit: 2,
      attackRange: 1,
      attackTickCycle: 5
    },
    "enemy melee snapshots should derive from the authored enemy data"
  );
}

{
  global.window = {
    WorldBootstrapRuntime: {
      getBootstrapResult(worldId) {
        if (worldId !== "qa_runtime_world") return null;
        return {
          combatSpawns: [
            {
              spawnNodeId: "qa-guard",
              enemyId: "enemy_guard",
              spawnTile: { x: 10, y: 10, z: 0 },
              spawnGroupId: "starter_east_outpost_guard_alpha"
            },
            {
              spawnNodeId: "qa-bear",
              enemyId: "enemy_bear",
              spawnTile: { x: 12, y: 12, z: 0 },
              spawnGroupId: "camp_southeast_ruins_alpha"
            }
          ]
        };
      }
    }
  };

  combatBridge.exposeCombatBridge();
  const summaries = new Map(
    window.CombatRuntime.listCombatProgressionBandWorldSummaries("qa_runtime_world").map((summary) => [summary.bandId, summary])
  );

  assert.strictEqual(
    summaries.get("guarded_threshold").spawnCount,
    1,
    "combat bridge band summaries should include bootstrap guard spawns for runtime worlds"
  );
  assert.deepStrictEqual(
    summaries.get("guarded_threshold").enemyIds,
    ["enemy_guard"],
    "combat bridge guard summaries should keep runtime enemy ids"
  );
  assert.deepStrictEqual(
    summaries.get("guarded_threshold").spawnGroupIds,
    ["starter_east_outpost_guard_alpha"],
    "combat bridge guard summaries should keep runtime spawn group ids"
  );
  assert.strictEqual(
    summaries.get("camp_threat").spawnCount,
    1,
    "combat bridge band summaries should include bootstrap camp-threat spawns for runtime worlds"
  );
  assert.deepStrictEqual(
    summaries.get("camp_threat").enemyIds,
    ["enemy_bear"],
    "combat bridge camp summaries should keep runtime enemy ids"
  );
}

{
  const originalRandom = Math.random;
  const sequence = [0.2, 0.9];
  let index = 0;
  Math.random = () => {
    const value = sequence[index] !== undefined ? sequence[index] : 0;
    index += 1;
    return value;
  };

  const entry = combatFormulas.pickDropEntry([
    { kind: "coins", weight: 50, minAmount: 2, maxAmount: 5 },
    { kind: "nothing", weight: 50 }
  ]);

  Math.random = originalRandom;
  assert.ok(entry, "weighted drop selection should return an entry when weights are valid");
  assert.strictEqual(entry.kind, "coins", "drop selection should honor weighted tables");
}

console.log("Combat domain tests passed.");
