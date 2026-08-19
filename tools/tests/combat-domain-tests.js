const assert = require("assert");
const path = require("path");

const { loadTsModule } = require("../lib/ts-module-loader");

const combatContent = loadTsModule(path.resolve(__dirname, "../../src/game/combat/content.ts"));
const combatFormulas = loadTsModule(path.resolve(__dirname, "../../src/game/combat/formulas.ts"));
const statusEffects = loadTsModule(path.resolve(__dirname, "../../src/game/combat/status-effects.ts"));
const specialAttacks = loadTsModule(path.resolve(__dirname, "../../src/game/combat/special-attacks.ts"));
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
  const rune = {
    id: itemId,
    ammo: {
      damageType: "magic",
      ammoTier: overrides.ammoTier || 1,
      magicAccuracyBonus: overrides.magicAccuracyBonus || 0,
      magicStrengthBonus: overrides.magicStrengthBonus || 0,
      compatibleWeaponFamilies: ["staff"]
    }
  };
  if (overrides.onHitEffect) rune.ammo.onHitEffect = { ...overrides.onHitEffect };
  return rune;
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
      { itemData: makeMagicRune("ember_rune", { ammoTier: 1, magicAccuracyBonus: 1, magicStrengthBonus: 2 }), amount: 5 },
      { itemData: makeMagicRune("air_rune", { ammoTier: 4, magicAccuracyBonus: 7, magicStrengthBonus: 8 }), amount: 3 }
    ],
    playerState: {}
  });

  assert.strictEqual(magicSnapshot.styleFamily, "magic", "magic snapshot should identify the active style family");
  assert.strictEqual(magicSnapshot.damageType, "magic", "magic snapshot should identify the active damage type");
  assert.strictEqual(magicSnapshot.canAttack, true, "magic attacks should be allowed when level and rune requirements are met");
  assert.strictEqual(magicSnapshot.attackValue, 33, "magic attack value should include staff and selected rune accuracy");
  assert.strictEqual(magicSnapshot.defenseValue, 15, "magic defense value should use magic defense bonuses");
  assert.strictEqual(magicSnapshot.maxHit, 4, "magic max hit should use Magic level and selected rune strength");
  assert.strictEqual(magicSnapshot.attackRange, 6, "magic snapshot should expose staff attack range");
  assert.strictEqual(magicSnapshot.attackTickCycle, 4, "magic snapshot should expose staff cadence");
  assert.strictEqual(magicSnapshot.consumesAmmo, true, "magic staff attacks should advertise rune consumption");
  assert.strictEqual(magicSnapshot.ammoInventoryIndex, 1, "magic snapshot should pick the strongest compatible rune stack");
  assert.strictEqual(magicSnapshot.ammoItemId, "air_rune", "magic snapshot should surface the selected rune id");

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

  const chilledSnapshot = combatFormulas.computePlayerMagicCombatSnapshot({
    playerSkills: {
      magic: { xp: 0, level: 20 },
      defense: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: makeStaff({ magicAccuracyBonus: 6, magicStrengthBonus: 4 })
    },
    inventory: [
      {
        itemData: makeMagicRune("water_rune", {
          ammoTier: 2,
          magicAccuracyBonus: 2,
          magicStrengthBonus: 3,
          onHitEffect: { effectId: "chilled", durationTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 }
        }),
        amount: 1
      }
    ],
    playerState: {}
  });
  assert.deepStrictEqual(
    chilledSnapshot.onHitEffect,
    { effectId: "chilled", durationTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 },
    "magic snapshots should preserve the selected rune's canonical on-hit effect"
  );
}

{
  const playerState = { specialAttackCooldown: 0, specialAttackEnergy: 100, specialAttackQueued: false };
  assert.deepStrictEqual(
    specialAttacks.queuePlayerSpecialAttack(playerState, { hasTarget: false, canAttack: true }),
    { accepted: false, reason: "no_target", cooldownTicks: 0 },
    "special attacks should require a selected target"
  );
  assert.deepStrictEqual(
    specialAttacks.queuePlayerSpecialAttack(playerState, { hasTarget: true, canAttack: false }),
    { accepted: false, reason: "cannot_attack", cooldownTicks: 0 },
    "special attacks should not arm or spend cooldown when the current loadout cannot attack"
  );
  assert.deepStrictEqual(
    playerState,
    { specialAttackCooldown: 0, specialAttackEnergy: 100, specialAttackQueued: false },
    "rejecting an unusable special-attack request should leave its state unchanged"
  );
  assert.deepStrictEqual(
    specialAttacks.queuePlayerSpecialAttack(playerState, { hasTarget: true, canAttack: true }),
    { accepted: true, reason: "queued", cooldownTicks: 8 },
    "special attacks should arm against a valid selected target"
  );
  assert.deepStrictEqual(
    playerState,
    { specialAttackCooldown: 8, specialAttackEnergy: 75, specialAttackQueued: true },
    "arming a special attack should spend bounded energy alongside its cooldown and queue state"
  );
  assert.deepStrictEqual(
    specialAttacks.queuePlayerSpecialAttack(playerState, { hasTarget: true, canAttack: true }),
    { accepted: false, reason: "already_queued", cooldownTicks: 8 },
    "special attacks should not stack while one is armed"
  );
  assert.deepStrictEqual(
    specialAttacks.applyPlayerSpecialAttack({ attackValue: 8, maxHit: 4, styleFamily: "melee" }),
    { attackValue: 10, maxHit: 5, styleFamily: "melee" },
    "Power Strike should apply its fixed accuracy and max-hit multipliers once"
  );
  assert.strictEqual(specialAttacks.consumeQueuedPlayerSpecialAttack(playerState), true, "the next resolved hit should consume the queued special");
  assert.strictEqual(playerState.specialAttackQueued, false, "resolving a special attack should clear its queue state");
  assert.strictEqual(playerState.specialAttackCooldown, 8, "resolving a special attack should not refresh its already-spent cooldown");
  assert.strictEqual(playerState.specialAttackEnergy, 75, "resolving a special attack should not spend energy twice");
  playerState.specialAttackCooldown = 0;
  playerState.specialAttackEnergy = 24;
  assert.deepStrictEqual(
    specialAttacks.queuePlayerSpecialAttack(playerState, { hasTarget: true, canAttack: true }),
    { accepted: false, reason: "insufficient_energy", cooldownTicks: 0 },
    "special attacks should reject an armed request until the resource can pay its fixed cost"
  );
  assert.strictEqual(specialAttacks.regeneratePlayerSpecialAttackEnergy(playerState), true, "special energy should recover through the typed lifecycle");
  assert.strictEqual(playerState.specialAttackEnergy, 25, "special energy should recover one point per combat tick");
  assert.deepStrictEqual(
    specialAttacks.queuePlayerSpecialAttack(playerState, { hasTarget: true, canAttack: true }),
    { accepted: true, reason: "queued", cooldownTicks: 8 },
    "special attacks should arm when energy exactly meets their fixed cost"
  );
  assert.strictEqual(playerState.specialAttackEnergy, 0, "arming at the energy threshold should spend the entire available cost");
  playerState.specialAttackEnergy = 100;
  assert.strictEqual(specialAttacks.regeneratePlayerSpecialAttackEnergy(playerState), false, "full special energy should not report a redundant HUD refresh");
  assert.strictEqual(playerState.specialAttackEnergy, 100, "special energy regeneration should remain capped at its maximum");
  assert.deepStrictEqual(
    specialAttacks.normalizePlayerSpecialAttackState({ specialAttackCooldown: -4, specialAttackEnergy: 120.8, specialAttackQueued: true }),
    { specialAttackCooldown: 0, specialAttackEnergy: 100, specialAttackQueued: true },
    "legacy or malformed special-attack state should clamp safely before use"
  );
  assert.deepStrictEqual(
    specialAttacks.buildPlayerSpecialAttackViewModel({ specialAttackCooldown: 3, specialAttackEnergy: 75, specialAttackQueued: false }),
    {
      label: "Power Strike",
      description: "Next hit gains +25% accuracy and max hit. Costs 25 special energy; recovers 1 each tick.",
      cooldownTicks: 3,
      energy: 75,
      maxEnergy: 100,
      energyCost: 25,
      queued: false,
      ready: false,
      statusText: "3 ticks to recharge · 75/100 energy"
    },
    "the typed view model should describe the special cooldown without UI-local state"
  );
}

{
  const enemyState = {
    remainingAttackCooldown: 3,
    statusEffects: statusEffects.createEnemyStatusEffects()
  };
  const effect = statusEffects.applyEnemyStatusEffect(
    enemyState,
    { effectId: "chilled", durationTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 },
    10
  );
  assert.deepStrictEqual(
    effect,
    { effectId: "chilled", remainingTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 },
    "chilled should report its applied duration and next-swing delay"
  );
  assert.strictEqual(enemyState.remainingAttackCooldown, 4, "chilled should delay an already-counting enemy swing by one tick");
  assert.strictEqual(statusEffects.getEnemyAttackCooldownPenalty(enemyState, 10), 1, "chilled should expose one tick of enemy swing penalty");
  assert.deepStrictEqual(
    statusEffects.listActiveEnemyStatusEffects(enemyState, 10),
    [{ effectId: "chilled", remainingTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 }],
    "active enemy effects should remain inspectable through the typed combat source"
  );
  statusEffects.pruneExpiredEnemyStatusEffects(enemyState, 12);
  assert.deepStrictEqual(statusEffects.listActiveEnemyStatusEffects(enemyState, 12), [], "expired effects should not linger on enemy runtime state");
}

{
  const enemyState = {
    remainingAttackCooldown: 3,
    statusEffects: statusEffects.createEnemyStatusEffects()
  };
  const effect = statusEffects.applyEnemyStatusEffect(
    enemyState,
    { effectId: "sundered", durationTicks: 3, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 3 },
    10
  );
  assert.deepStrictEqual(
    effect,
    { effectId: "sundered", remainingTicks: 3, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 3 },
    "Sundered should report its duration and defence penalty"
  );
  assert.strictEqual(enemyState.remainingAttackCooldown, 3, "Sundered should not alter enemy swing timing");
  assert.strictEqual(statusEffects.getEnemyDefensePenalty(enemyState, 10), 3, "Sundered should expose its active enemy defence reduction");
  assert.deepStrictEqual(
    statusEffects.listActiveEnemyStatusEffects(enemyState, 10),
    [{ effectId: "sundered", remainingTicks: 3, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 3 }],
    "Sundered should remain inspectable through the typed combat source"
  );
  statusEffects.pruneExpiredEnemyStatusEffects(enemyState, 13);
  assert.strictEqual(statusEffects.getEnemyDefensePenalty(enemyState, 13), 0, "expired Sundered should not reduce defence");
}

{
  const enemyState = {
    remainingAttackCooldown: 3,
    statusEffects: statusEffects.createEnemyStatusEffects()
  };
  const effect = statusEffects.applyEnemyStatusEffect(
    enemyState,
    { effectId: "disoriented", durationTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, enemyAttackPenalty: 3 },
    10
  );
  assert.deepStrictEqual(
    effect,
    { effectId: "disoriented", remainingTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, enemyAttackPenalty: 3 },
    "Disoriented should report its duration and enemy accuracy penalty"
  );
  assert.strictEqual(enemyState.remainingAttackCooldown, 3, "Disoriented should not alter enemy swing timing");
  assert.strictEqual(statusEffects.getEnemyAttackPenalty(enemyState, 10), 3, "Disoriented should expose its active enemy accuracy reduction");
  assert.deepStrictEqual(
    statusEffects.listActiveEnemyStatusEffects(enemyState, 10),
    [{ effectId: "disoriented", remainingTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, enemyAttackPenalty: 3 }],
    "Disoriented should remain inspectable through the typed combat source"
  );
  statusEffects.pruneExpiredEnemyStatusEffects(enemyState, 12);
  assert.strictEqual(statusEffects.getEnemyAttackPenalty(enemyState, 12), 0, "expired Disoriented should not reduce enemy accuracy");
}

{
  const enemyState = {
    remainingAttackCooldown: 3,
    statusEffects: statusEffects.createEnemyStatusEffects()
  };
  const effect = statusEffects.applyEnemyStatusEffect(
    enemyState,
    { effectId: "scorched", durationTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, periodicDamage: 1 },
    10
  );
  assert.deepStrictEqual(
    effect,
    { effectId: "scorched", remainingTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, periodicDamage: 1 },
    "Scorched should report its duration and periodic burn damage"
  );
  assert.deepStrictEqual(
    statusEffects.listActiveEnemyStatusEffects(enemyState, 10),
    [{ effectId: "scorched", remainingTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, periodicDamage: 1 }],
    "Scorched should remain inspectable through the typed combat source"
  );
  assert.deepStrictEqual(
    statusEffects.consumeEnemyStatusEffectPeriodicDamage(enemyState, 10),
    [],
    "Scorched should not burn on the same tick that applied it"
  );
  assert.deepStrictEqual(
    statusEffects.consumeEnemyStatusEffectPeriodicDamage(enemyState, 11),
    [{ effectId: "scorched", damage: 1 }],
    "Scorched should resolve one burn damage on its first later tick"
  );
  assert.deepStrictEqual(
    statusEffects.consumeEnemyStatusEffectPeriodicDamage(enemyState, 11),
    [],
    "Scorched should not resolve duplicate damage in the same tick"
  );
  assert.deepStrictEqual(
    statusEffects.consumeEnemyStatusEffectPeriodicDamage(enemyState, 12),
    [{ effectId: "scorched", damage: 1 }],
    "Scorched should resolve its final burn damage on the expiry tick"
  );
  statusEffects.pruneExpiredEnemyStatusEffects(enemyState, 12);
  assert.deepStrictEqual(statusEffects.listActiveEnemyStatusEffects(enemyState, 12), [], "expired Scorched should not linger on enemy runtime state");
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
  const disorientedSnapshot = combatFormulas.computeEnemyMeleeCombatSnapshot(
    combatContent.getEnemyTypeDefinition("enemy_goblin_grunt"),
    { enemyAttackPenalty: 3 }
  );
  assert.strictEqual(disorientedSnapshot.attackValue, 3, "enemy snapshots should apply active Disoriented attack penalties");
  assert.strictEqual(disorientedSnapshot.defenseValue, enemySnapshot.defenseValue, "Disoriented should not reduce enemy defence");
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
              patrolRoute: [
                { x: 10, y: 10, z: 0 },
                { x: 14, y: 10, z: 0 }
              ],
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
  assert.strictEqual(window.CombatRuntime.computePlayerMaxHitpoints({ hitpoints: { xp: 0, level: 13 } }), 13, "combat bridge should expose player max hitpoints");
  assert.strictEqual(typeof window.CombatRuntime.computePlayerMagicCombatSnapshot, "function", "combat bridge should expose magic player snapshots");
  assert.strictEqual(typeof window.CombatRuntime.applyEnemyStatusEffect, "function", "combat bridge should expose typed enemy status effects");
  assert.strictEqual(typeof window.CombatRuntime.consumeEnemyStatusEffectPeriodicDamage, "function", "combat bridge should expose typed enemy status-effect damage timing");
  assert.strictEqual(typeof window.CombatRuntime.getEnemyAttackPenalty, "function", "combat bridge should expose active enemy attack penalties");
  assert.strictEqual(typeof window.CombatRuntime.queuePlayerSpecialAttack, "function", "combat bridge should expose typed special-attack queueing");
  assert.strictEqual(typeof window.CombatRuntime.regeneratePlayerSpecialAttackEnergy, "function", "combat bridge should expose typed special-energy regeneration");
  assert.strictEqual(typeof window.CombatRuntime.applyPlayerSpecialAttack, "function", "combat bridge should expose typed special-attack modifiers");
  assert.deepStrictEqual(
    window.CombatRuntime.applyPlayerHitpointDamage(6, 10, 9, 1),
    { currentHitpoints: 1, dealt: 5 },
    "combat bridge should expose player hitpoint damage math"
  );
  const bridgeSpawns = window.CombatRuntime.getWorldCombatSpawnNodes("qa_runtime_world");
  const bridgeGuardSpawn = bridgeSpawns.find((spawn) => spawn.spawnNodeId === "qa-guard");
  assert.deepStrictEqual(
    bridgeGuardSpawn.patrolRoute,
    [
      { x: 10, y: 10, z: 0 },
      { x: 14, y: 10, z: 0 }
    ],
    "combat bridge should preserve bootstrap patrol routes"
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
