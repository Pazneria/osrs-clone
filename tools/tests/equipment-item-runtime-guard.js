const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "equipment-item-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/equipment-item-runtime.js");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const runtimeIndex = manifestSource.indexOf('id: "equipment-item-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(runtimeIndex !== -1, "legacy manifest should include equipment item runtime");
  assert(worldIndex !== -1 && runtimeIndex < worldIndex, "legacy manifest should load equipment item runtime before world.js");
  assert(runtimeSource.includes("window.EquipmentItemRuntime"), "equipment item runtime should expose a window runtime");
  assert(runtimeSource.includes("function equipItem(context = {}, invIndex)"), "equipment item runtime should own item equips");
  assert(runtimeSource.includes("function unequipItem(context = {}, slotName)"), "equipment item runtime should own unequips");
  assert(runtimeSource.includes("function autoEquipWeaponClass(context = {}, weaponClass)"), "equipment item runtime should own weapon-class auto equip");
  assert(worldSource.includes("const equipmentItemRuntime = window.EquipmentItemRuntime || null;"), "world.js should resolve equipment item runtime");
  assert(worldSource.includes("equipmentItemRuntime.equipItem(buildEquipmentItemRuntimeContext(), invIndex)"), "world.js should delegate equip item action");
  assert(worldSource.includes("equipmentItemRuntime.unequipItem(buildEquipmentItemRuntimeContext(), slotName)"), "world.js should delegate unequips");
  assert(worldSource.includes("equipmentItemRuntime.autoEquipWeaponClass(buildEquipmentItemRuntimeContext(), weaponClass)"), "world.js should delegate auto equips");
  assert(!worldSource.includes("const requiredDefenseLevel = Number.isFinite(item.requiredDefenseLevel)"), "world.js should not own equipment Defense requirement checks");
  assert(!worldSource.includes("equipment[slotName] = item; inventory[invIndex] = oldItem"), "world.js should not swap equipped items inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.EquipmentItemRuntime;
  assert(runtime, "equipment item runtime should be available after evaluation");

  const runeShield = { id: "rune_shield", name: "Rune Shield", type: "shield", requiredDefenseLevel: 40 };
  const bronzeShield = { id: "bronze_shield", name: "Bronze Shield", type: "shield" };
  const runeHarpoon = { id: "rune_harpoon", name: "Rune Harpoon", type: "weapon", weaponClass: "harpoon", requiredFishingLevel: 35 };
  const bronzeSword = { id: "bronze_sword", name: "Bronze Sword", type: "weapon", weaponClass: "sword", requiredAttackLevel: 1 };
  const bronzeArrows = { id: "bronze_arrows", name: "Bronze Arrows x15", type: "ammo", stackable: true };
  const fireStaff = { id: "fire_staff", name: "Fire staff", type: "weapon", weaponClass: "staff", requiredMagicLevel: 10 };

  function makeContext(overrides = {}) {
    const calls = [];
    const chat = [];
    return {
      context: {
        equipment: overrides.equipment || { weapon: null, shield: overrides.oldShield || null, ammo: null },
        inventory: overrides.inventory || [{ itemData: runeShield, amount: 1 }, null],
        playerSkills: overrides.playerSkills || {
          attack: { level: 99 },
          fishing: { level: 99 },
          magic: { level: 99 },
          defense: { level: overrides.defenseLevel == null ? 1 : overrides.defenseLevel }
        },
        addChatMessage: (message, tone) => chat.push({ message, tone }),
        clearSelectedUse: (shouldRender) => calls.push(["clearSelectedUse", shouldRender]),
        updateStats: () => calls.push(["updateStats"]),
        renderInventory: () => calls.push(["renderInventory"]),
        renderEquipment: () => calls.push(["renderEquipment"]),
        updatePlayerModel: () => calls.push(["updatePlayerModel"])
      },
      calls,
      chat
    };
  }

  {
    const { context, calls, chat } = makeContext({ defenseLevel: 30 });
    assert(runtime.equipItem(context, 0) === false, "under-level equip should fail");
    assert(chat.length === 1 && chat[0].message === "You need Defense level 40 to equip the Rune Shield.", "under-level equip should explain the Defense requirement");
    assert(context.equipment.shield === null, "failed equip should not modify equipment");
    assert(context.inventory[0].itemData.id === "rune_shield", "failed equip should leave inventory untouched");
    assert(calls.length === 0, "failed equip should not refresh equipment views");
  }

  {
    const { context, calls, chat } = makeContext({ defenseLevel: 40, oldShield: bronzeShield });
    assert(runtime.equipItem(context, 0) === true, "valid equip should succeed");
    assert(chat.length === 0, "valid equip should not warn");
    assert(context.equipment.shield.id === "rune_shield", "valid equip should move item into equipment slot");
    assert(context.inventory[0].itemData.id === "bronze_shield", "valid equip should swap old equipment back to inventory");
    assert(calls.map((call) => call[0]).join(",") === "clearSelectedUse,updateStats,renderInventory,renderEquipment,updatePlayerModel", "valid equip should trigger the standard refresh path");
  }

  {
    const { context } = makeContext({
      inventory: [{ itemData: runeHarpoon, amount: 1 }],
      playerSkills: { attack: { level: 99 }, fishing: { level: 20 }, defense: { level: 99 } }
    });
    assert(runtime.equipItem(context, 0) === false, "under-level fishing equipment should fail");
    assert(context.equipment.weapon === null, "failed fishing equipment should not equip");
  }

  {
    const { context, chat } = makeContext({
      equipment: { weapon: null, shield: null },
      inventory: [{ itemData: fireStaff, amount: 1 }],
      playerSkills: { attack: { level: 99 }, fishing: { level: 99 }, magic: { level: 1 }, defense: { level: 99 } }
    });
    assert(runtime.equipItem(context, 0) === false, "under-level magic equipment should fail");
    assert(chat.length === 1 && chat[0].message === "You need Magic level 10 to equip the Fire staff.", "under-level magic equip should explain the Magic requirement");
    assert(context.equipment.weapon === null, "failed magic equipment should not equip");
  }

  {
    const { context } = makeContext({
      equipment: { weapon: null, shield: null },
      inventory: [{ itemData: bronzeSword, amount: 1 }, null]
    });
    assert(runtime.hasWeaponClassAvailable(context, "sword"), "weapon-class availability should see inventory weapons");
    assert(runtime.autoEquipWeaponClass(context, "sword"), "auto equip should equip matching weapon class");
    assert(context.equipment.weapon.id === "bronze_sword", "auto equip should move weapon into equipment");
    assert(context.inventory[0] === null, "auto equip should clear the source inventory slot when no old weapon exists");
  }

  {
    const { context } = makeContext({
      equipment: { weapon: null, shield: null, ammo: null },
      inventory: [{ itemData: bronzeArrows, amount: 150 }, null]
    });
    assert(runtime.equipItem(context, 0) === true, "ammo equip should succeed");
    assert(context.equipment.ammo.itemData.id === "bronze_arrows", "ammo equip should place arrows into the ammo slot");
    assert(context.equipment.ammo.amount === 150, "ammo equip should preserve the full stack amount");
    assert(context.inventory[0] === null, "ammo equip should clear the source stack from inventory");
    assert(runtime.unequipItem(context, "ammo") === true, "ammo unequip should succeed");
    assert(context.equipment.ammo === null, "ammo unequip should clear the ammo slot");
    assert(context.inventory[0].itemData.id === "bronze_arrows" && context.inventory[0].amount === 150, "ammo unequip should restore the full stack to inventory");
  }

  {
    const { context } = makeContext({
      equipment: { weapon: null, shield: null, ammo: { itemData: bronzeArrows, amount: 5 } },
      inventory: [{ itemData: bronzeArrows, amount: 10 }, null]
    });
    assert(runtime.equipItem(context, 0) === true, "matching ammo equip should merge into the equipped stack");
    assert(context.equipment.ammo.amount === 15, "matching ammo equip should add inventory arrows to equipped arrows");
    assert(context.inventory[0] === null, "matching ammo equip should clear the source stack");
  }

  {
    const { context } = makeContext({
      equipment: { weapon: null, shield: bronzeShield },
      inventory: [{ itemData: runeShield, amount: 1 }]
    });
    assert(runtime.unequipItem(context, "shield") === false, "unequip should fail when inventory has no empty slots");
    assert(context.equipment.shield.id === "bronze_shield", "failed unequip should leave equipment in place");
  }

  console.log("Equipment item runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
