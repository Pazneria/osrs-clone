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
        rangedAccuracyBonus: overrides.rangedAccuracyBonus || 0,
        rangedStrengthBonus: overrides.rangedStrengthBonus || 0,
        magicAccuracyBonus: overrides.magicAccuracyBonus || 0,
        magicStrengthBonus: overrides.magicStrengthBonus || 0,
        meleeDefenseBonus: overrides.meleeDefenseBonus || 0,
        rangedDefenseBonus: overrides.rangedDefenseBonus || 0,
        magicDefenseBonus: overrides.magicDefenseBonus || 0
      },
      requiredAttackLevel: overrides.requiredAttackLevel || 1
    }
  };
}

function makeBow(overrides = {}) {
  return {
    combat: {
      attackProfile: {
        styleFamily: "ranged",
        damageType: "ranged",
        range: overrides.range || 7,
        tickCycle: overrides.tickCycle || 4,
        projectile: true,
        ammoUse: true,
        familyTag: "bow"
      },
      bonuses: {
        meleeAccuracyBonus: 0,
        meleeStrengthBonus: 0,
        rangedAccuracyBonus: overrides.rangedAccuracyBonus || 0,
        rangedStrengthBonus: overrides.rangedStrengthBonus || 0,
        magicAccuracyBonus: 0,
        magicStrengthBonus: 0,
        meleeDefenseBonus: 0,
        rangedDefenseBonus: 0,
        magicDefenseBonus: 0
      },
      requiredAttackLevel: 1,
      requiredRangedLevel: overrides.requiredRangedLevel || 1,
      weaponFamily: "bow"
    }
  };
}

function makeStaff(overrides = {}) {
  return {
    combat: {
      attackProfile: {
        styleFamily: "magic",
        damageType: "magic",
        range: overrides.range || 6,
        tickCycle: overrides.tickCycle || 4,
        projectile: true,
        ammoUse: true,
        familyTag: "staff"
      },
      bonuses: {
        meleeAccuracyBonus: 0,
        meleeStrengthBonus: 0,
        rangedAccuracyBonus: 0,
        rangedStrengthBonus: 0,
        magicAccuracyBonus: overrides.magicAccuracyBonus || 0,
        magicStrengthBonus: overrides.magicStrengthBonus || 0,
        meleeDefenseBonus: 0,
        rangedDefenseBonus: 0,
        magicDefenseBonus: 0
      },
      requiredAttackLevel: 1,
      requiredMagicLevel: overrides.requiredMagicLevel || 1,
      weaponFamily: "staff"
    }
  };
}

function makeAmmo(itemId, overrides = {}) {
  return {
    id: itemId,
    ammo: {
      damageType: "ranged",
      ammoTier: overrides.ammoTier || 1,
      rangedAccuracyBonus: overrides.rangedAccuracyBonus || 0,
      rangedStrengthBonus: overrides.rangedStrengthBonus || 0,
      compatibleWeaponFamilies: ["bow"]
    }
  };
}

function makeMagicRune(itemId, overrides = {}) {
  return {
    id: itemId,
    ammo: {
      damageType: "magic",
      ammoTier: overrides.ammoTier || 1,
      magicAccuracyBonus: overrides.magicAccuracyBonus || 0,
      magicStrengthBonus: overrides.magicStrengthBonus || 0,
      compatibleWeaponFamilies: ["staff"]
    }
  };
}

{
  assert.strictEqual(combatFormulas.decrementCooldown(4), 3, "cooldown should decrement by one when above zero");
  assert.strictEqual(combatFormulas.decrementCooldown(0), 0, "cooldown should not go negative");
  assert.strictEqual(combatFormulas.isWithinMeleeRange({ x: 10, y: 10 }, { x: 11, y: 11 }), true, "diagonal adjacency should count as melee range");
  assert.strictEqual(combatFormulas.isWithinSquareRange({ x: 10, y: 10 }, { x: 14, y: 14 }, 4), true, "square range should allow diagonal distance within range");
  assert.strictEqual(
    combatFormulas.computePlayerMaxHitpoints({ hitpoints: { xp: 0, level: 12 } }),
    12,
    "player max hitpoints should derive from the hitpoints skill level"
  );
  assert.strictEqual(
    combatFormulas.clampPlayerCurrentHitpoints(99, 12),
    12,
    "current hitpoints should clamp to the computed maximum"
  );
  assert.deepStrictEqual(
    combatFormulas.applyPlayerHitpointHealing(8, 12, 10),
    { currentHitpoints: 12, healed: 4 },
    "healing should cap at max hitpoints and report the effective amount"
  );
  assert.deepStrictEqual(
    combatFormulas.applyPlayerHitpointDamage(8, 12, 10, 1),
    { currentHitpoints: 1, dealt: 7 },
    "damage should respect the minimum allowed hitpoints and report the effective amount"
  );
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
  const rangedSnapshot = combatFormulas.computePlayerRangedCombatSnapshot({
    playerSkills: {
      ranged: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeBow({ rangedAccuracyBonus: 8, tickCycle: 4, range: 7, requiredRangedLevel: 10 }),
      shield: makeWeapon({ meleeDefenseBonus: 5, rangedDefenseBonus: 5, magicDefenseBonus: 5, familyTag: "shield" })
    },
    inventory: [
      { itemData: makeAmmo("bronze_arrows", { ammoTier: 1, rangedAccuracyBonus: 2, rangedStrengthBonus: 4 }), amount: 15 }
    ],
    playerState: {}
  });

  assert.strictEqual(rangedSnapshot.styleFamily, "ranged", "ranged snapshot should identify the active style family");
  assert.strictEqual(rangedSnapshot.canAttack, true, "ranged attacks should be allowed when level and ammo requirements are met");
  assert.strictEqual(rangedSnapshot.attackValue, 30, "ranged attack value should include bow and ammo accuracy");
  assert.strictEqual(rangedSnapshot.defenseValue, 15, "ranged defense value should use ranged defense bonuses");
  assert.strictEqual(rangedSnapshot.maxHit, 3, "ranged max hit should use ranged level and ammo strength");
  assert.strictEqual(rangedSnapshot.attackRange, 7, "ranged snapshot should expose bow attack range");
  assert.strictEqual(rangedSnapshot.attackTickCycle, 4, "ranged snapshot should expose bow attack cadence");
  assert.strictEqual(rangedSnapshot.consumesAmmo, true, "ranged bow attacks should advertise ammo consumption");
  assert.strictEqual(rangedSnapshot.ammoInventoryIndex, 0, "ranged snapshot should point at the selected ammo stack");
  assert.strictEqual(rangedSnapshot.ammoEquipmentSlot, null, "inventory ammo selection should not claim an equipment ammo slot");

  const equippedAmmoSnapshot = combatFormulas.computePlayerRangedCombatSnapshot({
    playerSkills: {
      ranged: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeBow({ rangedAccuracyBonus: 8, tickCycle: 4, range: 7, requiredRangedLevel: 10 }),
      ammo: { itemData: makeAmmo("bronze_arrows", { ammoTier: 1, rangedAccuracyBonus: 2, rangedStrengthBonus: 4 }), amount: 15 }
    },
    inventory: [
      { itemData: makeAmmo("iron_arrows", { ammoTier: 2, rangedAccuracyBonus: 3, rangedStrengthBonus: 5 }), amount: 15 }
    ],
    playerState: {}
  });
  assert.strictEqual(equippedAmmoSnapshot.canAttack, true, "equipped ammo should satisfy bow ammo requirements");
  assert.strictEqual(equippedAmmoSnapshot.ammoEquipmentSlot, "ammo", "ranged snapshot should prefer the equipped ammo slot");
  assert.strictEqual(equippedAmmoSnapshot.ammoInventoryIndex, null, "equipped ammo selection should not consume inventory ammo");
  assert.strictEqual(equippedAmmoSnapshot.ammoItemId, "bronze_arrows", "equipped ammo should surface its item id");

  const activeSnapshot = combatFormulas.computePlayerCombatSnapshot({
    playerSkills: {
      ranged: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeBow({ rangedAccuracyBonus: 8 })
    },
    inventory: [
      { itemData: makeAmmo("iron_arrows", { ammoTier: 2, rangedAccuracyBonus: 3, rangedStrengthBonus: 5 }), amount: 1 }
    ],
    playerState: {}
  });
  assert.strictEqual(activeSnapshot.styleFamily, "ranged", "active combat snapshot should switch to ranged when a bow is equipped");

  const noAmmoSnapshot = combatFormulas.computePlayerRangedCombatSnapshot({
    playerSkills: {
      ranged: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeBow({ rangedAccuracyBonus: 8 })
    },
    inventory: [],
    playerState: {}
  });
  assert.strictEqual(noAmmoSnapshot.canAttack, false, "ammo-using ranged weapons should not attack without compatible ammo");
}

{
  const magicSnapshot = combatFormulas.computePlayerMagicCombatSnapshot({
    playerSkills: {
      magic: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeStaff({ magicAccuracyBonus: 6, magicStrengthBonus: 4, tickCycle: 4, range: 6, requiredMagicLevel: 10 }),
      shield: makeWeapon({ meleeDefenseBonus: 5, rangedDefenseBonus: 5, magicDefenseBonus: 5, familyTag: "shield" })
    },
    inventory: [
      { itemData: makeMagicRune("ember_rune", { ammoTier: 1, magicAccuracyBonus: 1, magicStrengthBonus: 2 }), amount: 5 }
    ],
    playerState: {}
  });

  assert.strictEqual(magicSnapshot.styleFamily, "magic", "magic snapshot should identify the active style family");
  assert.strictEqual(magicSnapshot.damageType, "magic", "magic snapshot should identify the active damage type");
  assert.strictEqual(magicSnapshot.canAttack, true, "magic attacks should be allowed when level and rune requirements are met");
  assert.strictEqual(magicSnapshot.attackValue, 27, "magic attack value should include staff and rune accuracy");
  assert.strictEqual(magicSnapshot.defenseValue, 15, "magic defense value should use magic defense bonuses");
  assert.strictEqual(magicSnapshot.maxHit, 3, "magic max hit should use Magic level and rune strength");
  assert.strictEqual(magicSnapshot.attackRange, 6, "magic snapshot should expose staff attack range");
  assert.strictEqual(magicSnapshot.attackTickCycle, 4, "magic snapshot should expose staff cadence");
  assert.strictEqual(magicSnapshot.consumesAmmo, true, "magic staff attacks should advertise rune consumption");
  assert.strictEqual(magicSnapshot.ammoInventoryIndex, 0, "magic snapshot should point at the selected rune stack");
  assert.strictEqual(magicSnapshot.ammoItemId, "ember_rune", "magic snapshot should surface the selected rune id");

  const activeSnapshot = combatFormulas.computePlayerCombatSnapshot({
    playerSkills: {
      magic: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeStaff({ magicAccuracyBonus: 6, magicStrengthBonus: 4 })
    },
    inventory: [
      { itemData: makeMagicRune("ember_rune", { ammoTier: 1, magicAccuracyBonus: 1, magicStrengthBonus: 2 }), amount: 1 }
    ],
    playerState: {}
  });
  assert.strictEqual(activeSnapshot.styleFamily, "magic", "active combat snapshot should switch to magic when a staff is equipped");

  const noRuneSnapshot = combatFormulas.computePlayerMagicCombatSnapshot({
    playerSkills: {
      magic: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeStaff({ magicAccuracyBonus: 6, magicStrengthBonus: 4 })
    },
    inventory: [],
    playerState: {}
  });
  assert.strictEqual(noRuneSnapshot.canAttack, false, "magic staff attacks should not fire without compatible runes");
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
              spawnGroupId: "camp_southeast_ruins_alpha",
              patrolRoute: [
                { x: 12, y: 12, z: 0 },
                { x: 14, y: 12, z: 0 },
                { x: 14, y: 14, z: 0 }
              ],
              assistGroupId: "camp_southeast_ruins_alpha",
              assistRadiusOverride: 6
            }
          ]
        };
      }
    }
  };

  combatBridge.exposeCombatBridge();
  assert.strictEqual(window.CombatRuntime.computePlayerMaxHitpoints({ hitpoints: { xp: 0, level: 13 } }), 13, "combat bridge should expose player max hitpoints");
  assert.strictEqual(typeof window.CombatRuntime.computePlayerMagicCombatSnapshot, "function", "combat bridge should expose magic player snapshots");
  assert.deepStrictEqual(
    window.CombatRuntime.applyPlayerHitpointDamage(6, 10, 9, 1),
    { currentHitpoints: 1, dealt: 5 },
    "combat bridge should expose player hitpoint damage math"
  );
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
  const runtimeSpawnNodes = window.CombatRuntime.getWorldCombatSpawnNodes("qa_runtime_world");
  const qaBearSpawn = runtimeSpawnNodes.find((entry) => entry.spawnNodeId === "qa-bear");
  assert.strictEqual(qaBearSpawn.assistGroupId, "camp_southeast_ruins_alpha", "combat bridge should preserve assist group ids");
  assert.strictEqual(qaBearSpawn.assistRadiusOverride, 6, "combat bridge should preserve assist radius overrides");
  assert.deepStrictEqual(
    qaBearSpawn.patrolRoute,
    [
      { x: 12, y: 12, z: 0 },
      { x: 14, y: 12, z: 0 },
      { x: 14, y: 14, z: 0 }
    ],
    "combat bridge should preserve authored patrol routes"
  );
  const qaBearState = window.CombatRuntime.createEnemyRuntimeState(qaBearSpawn, 0);
  assert.strictEqual(qaBearState.assistGroupId, "camp_southeast_ruins_alpha", "enemy runtime state should carry assist group ids");
  assert.strictEqual(qaBearState.resolvedAssistRadius, 6, "enemy runtime state should resolve assist radius overrides");
  assert.deepStrictEqual(qaBearState.resolvedPatrolRoute, qaBearSpawn.patrolRoute, "enemy runtime state should carry resolved patrol routes");
  assert.strictEqual(qaBearState.patrolRouteIndex, 0, "enemy runtime state should seed patrol progress from the nearest route point");
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
