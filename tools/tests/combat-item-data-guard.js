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

for (const itemId of ARMOR_ITEMS) {
  const item = itemDefs[itemId];
  assert.ok(item && item.combat, `${itemId} should expose combat defense data`);
  assert.ok(item.combat.bonuses.meleeDefenseBonus > 0, `${itemId} should contribute melee defense`);
  assert.strictEqual(item.combat.bonuses.rangedDefenseBonus, item.combat.bonuses.meleeDefenseBonus, `${itemId} should mirror v1 ranged defense`);
  assert.strictEqual(item.combat.bonuses.magicDefenseBonus, item.combat.bonuses.meleeDefenseBonus, `${itemId} should mirror v1 magic defense`);
}

assert.strictEqual(itemDefs.fishing_rod.type, "weapon", "fishing_rod should now be equippable as a weapon");
assert.strictEqual(itemDefs.fishing_rod.defaultAction, "Equip", "fishing_rod should default to Equip");
assert.strictEqual(itemDefs.owie, undefined, "owie should no longer exist in the runtime item catalog");

console.log("Combat item data guard passed.");
