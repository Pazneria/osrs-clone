const path = require("path");
const assert = require("assert");

const { loadRuntimeItemCatalog } = require("../content/runtime-item-catalog");

const root = path.resolve(__dirname, "..", "..");
const { itemDefs } = loadRuntimeItemCatalog(root);

const MELEE_HELD_ITEMS = [
  "bronze_sword",
  "iron_sword",
  "steel_sword",
  "mithril_sword",
  "adamant_sword",
  "rune_sword",
  "bronze_axe",
  "iron_axe",
  "steel_axe",
  "mithril_axe",
  "adamant_axe",
  "rune_axe",
  "bronze_pickaxe",
  "iron_pickaxe",
  "steel_pickaxe",
  "mithril_pickaxe",
  "adamant_pickaxe",
  "rune_pickaxe"
];

const FISHING_HELD_ITEMS = [
  "fishing_rod",
  "harpoon",
  "rune_harpoon"
];

const RANGED_BOW_ITEMS = [
  "normal_shortbow",
  "normal_longbow",
  "oak_shortbow",
  "oak_longbow",
  "willow_shortbow",
  "willow_longbow",
  "maple_shortbow",
  "maple_longbow",
  "yew_shortbow",
  "yew_longbow"
];

const RANGED_AMMO_ITEMS = [
  "bronze_arrows",
  "iron_arrows",
  "steel_arrows",
  "mithril_arrows",
  "adamant_arrows",
  "rune_arrows"
];

const MAGIC_STAFF_ITEMS = [
  "plain_staff_wood",
  "plain_staff_oak",
  "plain_staff_willow",
  "plain_staff_maple",
  "plain_staff_yew",
  "fire_staff",
  "water_staff",
  "earth_staff",
  "air_staff"
];

const MAGIC_RUNE_ITEMS = [
  "ember_rune",
  "water_rune",
  "earth_rune",
  "air_rune",
  "steam_rune",
  "smoke_rune",
  "lava_rune",
  "mud_rune",
  "mist_rune",
  "dust_rune"
];

const MAGIC_RUNE_EXPECTED_AMMO = {
  ember_rune: { ammoTier: 1, magicAccuracyBonus: 1, magicStrengthBonus: 2 },
  water_rune: { ammoTier: 2, magicAccuracyBonus: 2, magicStrengthBonus: 3 },
  earth_rune: { ammoTier: 3, magicAccuracyBonus: 4, magicStrengthBonus: 5 },
  air_rune: { ammoTier: 4, magicAccuracyBonus: 7, magicStrengthBonus: 8 },
  steam_rune: { ammoTier: 5, magicAccuracyBonus: 10, magicStrengthBonus: 12 },
  smoke_rune: { ammoTier: 5, magicAccuracyBonus: 10, magicStrengthBonus: 12 },
  lava_rune: { ammoTier: 5, magicAccuracyBonus: 10, magicStrengthBonus: 12 },
  mud_rune: { ammoTier: 5, magicAccuracyBonus: 10, magicStrengthBonus: 12 },
  mist_rune: { ammoTier: 5, magicAccuracyBonus: 10, magicStrengthBonus: 12 },
  dust_rune: { ammoTier: 5, magicAccuracyBonus: 10, magicStrengthBonus: 12 }
};

const MAGIC_RUNE_EXPECTED_ON_HIT_EFFECTS = {
  water_rune: { effectId: "chilled", durationTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 },
  air_rune: { effectId: "disoriented", durationTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, enemyAttackPenalty: 3 },
  lava_rune: { effectId: "scorched", durationTicks: 2, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 0, periodicDamage: 1 },
  steam_rune: { effectId: "chilled", durationTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 },
  mud_rune: { effectId: "chilled", durationTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 },
  mist_rune: { effectId: "chilled", durationTicks: 2, enemyAttackCooldownPenalty: 1, enemyDefensePenalty: 0 },
  earth_rune: { effectId: "sundered", durationTicks: 3, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 3 },
  dust_rune: { effectId: "sundered", durationTicks: 3, enemyAttackCooldownPenalty: 0, enemyDefensePenalty: 3 }
};

const ARMOR_ITEMS = [
  "bronze_boots",
  "bronze_helmet",
  "bronze_shield",
  "bronze_platelegs",
  "bronze_platebody",
  "rune_boots",
  "rune_helmet",
  "rune_shield",
  "rune_platelegs",
  "rune_platebody"
];

const JEWELRY_ITEMS = [
  "silver_ring",
  "gold_amulet",
  "diamond_gold_ring"
];

for (const itemId of MELEE_HELD_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item, `${itemId} should exist in the runtime item catalog`);
  assert.ok(item.combat, `${itemId} should expose explicit combat data`);
  assert.strictEqual(item.combat.attackProfile.styleFamily, "melee", `${itemId} should be authored as a melee attack source`);
  assert.ok(Number.isFinite(item.requiredAttackLevel), `${itemId} should expose a required Attack level`);
}

for (const itemId of FISHING_HELD_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item, `${itemId} should exist in the runtime item catalog`);
  assert.ok(item.combat, `${itemId} should expose explicit combat data`);
  assert.strictEqual(item.combat.attackProfile.styleFamily, "melee", `${itemId} should still be authored as a melee attack source`);
  assert.ok(Number.isFinite(item.requiredFishingLevel), `${itemId} should expose a required Fishing level`);
  assert.ok(!Number.isFinite(item.requiredAttackLevel), `${itemId} should not expose an Attack gate`);
}

for (const itemId of RANGED_BOW_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item, `${itemId} should exist in the runtime item catalog`);
  assert.strictEqual(item.type, "weapon", `${itemId} should be equippable as a weapon`);
  assert.strictEqual(item.weaponClass, "bow", `${itemId} should use the bow weapon class`);
  assert.ok(item.combat, `${itemId} should expose explicit ranged combat data`);
  assert.strictEqual(item.combat.attackProfile.styleFamily, "ranged", `${itemId} should be authored as a ranged attack source`);
  assert.strictEqual(item.combat.attackProfile.projectile, true, `${itemId} should launch projectiles`);
  assert.strictEqual(item.combat.attackProfile.ammoUse, true, `${itemId} should require ammunition`);
  assert.ok(Number.isFinite(item.requiredRangedLevel), `${itemId} should expose a required Ranged level`);
}

for (const itemId of RANGED_AMMO_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item, `${itemId} should exist in the runtime item catalog`);
  assert.strictEqual(item.type, "ammo", `${itemId} should be marked as ammunition`);
  assert.strictEqual(item.stackable, true, `${itemId} should stack for ammo consumption`);
  assert.strictEqual(item.defaultAction, "Equip", `${itemId} should default to Equip for quiver use`);
  assert.ok(Array.isArray(item.actions) && item.actions.includes("Equip"), `${itemId} should expose an Equip action`);
  assert.ok(item.ammo, `${itemId} should expose an ammo profile`);
  assert.strictEqual(item.ammo.damageType, "ranged", `${itemId} ammo should feed ranged attacks`);
  assert.ok(item.ammo.rangedStrengthBonus > 0, `${itemId} should contribute ranged strength`);
}

for (const itemId of MAGIC_STAFF_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item, `${itemId} should exist in the runtime item catalog`);
  assert.strictEqual(item.type, "weapon", `${itemId} should be equippable as a weapon`);
  assert.strictEqual(item.weaponClass, "staff", `${itemId} should use the staff weapon class`);
  assert.ok(item.combat, `${itemId} should expose explicit magic combat data`);
  assert.strictEqual(item.combat.attackProfile.styleFamily, "magic", `${itemId} should be authored as a magic attack source`);
  assert.strictEqual(item.combat.attackProfile.projectile, true, `${itemId} should launch magic projectiles`);
  assert.strictEqual(item.combat.attackProfile.ammoUse, true, `${itemId} should require runes`);
  assert.ok(Number.isFinite(item.requiredMagicLevel), `${itemId} should expose a required Magic level`);
  assert.ok(item.combat.bonuses.magicAccuracyBonus > 0, `${itemId} should contribute magic accuracy`);
  assert.ok(item.combat.bonuses.magicStrengthBonus > 0, `${itemId} should contribute magic strength`);
}

for (const itemId of MAGIC_RUNE_ITEMS) {
  const item = itemDefs[itemId];
  const expectedAmmo = MAGIC_RUNE_EXPECTED_AMMO[itemId];
  assert.ok(item, `${itemId} should exist in the runtime item catalog`);
  assert.strictEqual(item.stackable, true, `${itemId} should stack for spell fuel`);
  assert.ok(item.ammo, `${itemId} should expose an ammo profile for spell consumption`);
  assert.strictEqual(item.ammo.damageType, "magic", `${itemId} ammo should feed magic attacks`);
  assert.strictEqual(item.ammo.ammoTier, expectedAmmo.ammoTier, `${itemId} should keep its authored magic ammo tier`);
  assert.strictEqual(item.ammo.magicAccuracyBonus, expectedAmmo.magicAccuracyBonus, `${itemId} should keep its authored magic accuracy`);
  assert.strictEqual(item.ammo.magicStrengthBonus, expectedAmmo.magicStrengthBonus, `${itemId} should keep its authored magic strength`);
  assert.ok(item.ammo.magicAccuracyBonus > 0, `${itemId} should contribute magic accuracy`);
  assert.ok(item.ammo.magicStrengthBonus > 0, `${itemId} should contribute magic strength`);
  assert.ok(item.ammo.compatibleWeaponFamilies.includes("staff"), `${itemId} should be compatible with staffs`);
  if (MAGIC_RUNE_EXPECTED_ON_HIT_EFFECTS[itemId]) {
    const expectedEffect = MAGIC_RUNE_EXPECTED_ON_HIT_EFFECTS[itemId];
    assert.ok(item.ammo.onHitEffect, `${itemId} should expose a water-family Chilled effect profile`);
    assert.strictEqual(item.ammo.onHitEffect.effectId, expectedEffect.effectId, `${itemId} should keep the authored effect id`);
    assert.strictEqual(item.ammo.onHitEffect.durationTicks, expectedEffect.durationTicks, `${itemId} should keep the authored effect duration`);
    assert.strictEqual(
      item.ammo.onHitEffect.enemyAttackCooldownPenalty,
      expectedEffect.enemyAttackCooldownPenalty,
      `${itemId} should keep the authored swing-delay penalty`
    );
    assert.strictEqual(
      item.ammo.onHitEffect.enemyDefensePenalty,
      expectedEffect.enemyDefensePenalty,
      `${itemId} should keep the authored defence penalty`
    );
    if (Number.isFinite(expectedEffect.enemyAttackPenalty)) {
      assert.strictEqual(
        item.ammo.onHitEffect.enemyAttackPenalty,
        expectedEffect.enemyAttackPenalty,
        `${itemId} should keep the authored attack penalty`
      );
    }
    if (Number.isFinite(expectedEffect.periodicDamage)) {
      assert.strictEqual(
        item.ammo.onHitEffect.periodicDamage,
        expectedEffect.periodicDamage,
        `${itemId} should keep the authored periodic damage`
      );
    }
  } else {
    assert.ok(!item.ammo.onHitEffect, `${itemId} should not inherit a water-family effect profile`);
  }
}

for (const itemId of ARMOR_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item && item.combat, `${itemId} should expose combat defense data`);
  assert.ok(item.combat.bonuses.meleeDefenseBonus > 0, `${itemId} should contribute melee defense`);
  assert.strictEqual(item.combat.bonuses.rangedDefenseBonus, item.combat.bonuses.meleeDefenseBonus, `${itemId} should mirror v1 ranged defense`);
  assert.strictEqual(item.combat.bonuses.magicDefenseBonus, item.combat.bonuses.meleeDefenseBonus, `${itemId} should mirror v1 magic defense`);
  assert.ok(Number.isFinite(item.requiredDefenseLevel), `${itemId} should expose a required Defense level`);
}

for (const itemId of JEWELRY_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item, `${itemId} should exist in the runtime item catalog`);
  assert.ok(!Number.isFinite(item.requiredDefenseLevel), `${itemId} should not expose a Defense gate`);
}

assert.strictEqual(itemDefs.fishing_rod.type, "weapon", "fishing_rod should now be equippable as a weapon");
assert.strictEqual(itemDefs.fishing_rod.defaultAction, "Equip", "fishing_rod should default to Equip");
assert.strictEqual(itemDefs.owie, undefined, "owie should no longer exist in the runtime item catalog");

console.log("Combat item data guard passed.");
