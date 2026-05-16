const vm = require("vm");
const assert = require("assert");
const { createRepoFileReader } = require("./repo-file-test-utils");

const read = createRepoFileReader(__dirname);

const inventorySource = read("src/js/inventory.js");
const inventoryTooltipRuntimeSource = read("src/js/inventory-tooltip-runtime.js");
assert.ok(
  inventoryTooltipRuntimeSource.includes("const requiredDefenseLevel = Number.isFinite(item.requiredDefenseLevel)"),
  "inventory tooltip runtime should read requiredDefenseLevel"
);
assert.ok(
  inventoryTooltipRuntimeSource.includes("requirementLines.push({ label: 'Defense req.', value: String(requiredDefenseLevel) });"),
  "inventory tooltip runtime should surface a Defense req. row"
);
assert.ok(
  inventorySource.includes("runtime.buildItemTooltipHtml(item, options)"),
  "inventory.js should delegate item tooltip rendering to the tooltip runtime"
);

const runtimeSource = read("src/js/equipment-item-runtime.js");
assert.ok(
  runtimeSource.includes("function canEquipItem(context = {}, item)"),
  "equipment item runtime should own equip requirement checks"
);
assert.ok(
  runtimeSource.includes("requiredDefenseLevel"),
  "equipment item runtime should enforce requiredDefenseLevel"
);

const sandbox = { window: {} };
vm.runInNewContext(runtimeSource, sandbox, { filename: "equipment-item-runtime.js" });
const runtime = sandbox.window.EquipmentItemRuntime;

function makeEquipContext(overrides = {}) {
  const chat = [];
  const hooks = {
    clearSelectedUse: 0,
    updateStats: 0,
    renderInventory: 0,
    renderEquipment: 0,
    updatePlayerModel: 0
  };

  const ctx = {
    equipment: { shield: overrides.oldShield || null, weapon: null, ammo: null },
    inventory: [{
      itemData: {
        id: "rune_shield",
        name: "Rune Shield",
        type: "shield",
        requiredDefenseLevel: 40
      },
      amount: 1
    }],
    playerSkills: {
      attack: { level: 99 },
      fishing: { level: 99 },
      defense: { level: overrides.defenseLevel == null ? 1 : overrides.defenseLevel }
    },
    addChatMessage: (message, tone) => chat.push({ message, tone }),
    clearSelectedUse: () => {
      hooks.clearSelectedUse += 1;
    },
    updateStats: () => {
      hooks.updateStats += 1;
    },
    renderInventory: () => {
      hooks.renderInventory += 1;
    },
    renderEquipment: () => {
      hooks.renderEquipment += 1;
    },
    updatePlayerModel: () => {
      hooks.updatePlayerModel += 1;
    }
  };

  return { ctx, chat, hooks };
}

{
  const { ctx, chat, hooks } = makeEquipContext({ defenseLevel: 30 });
  runtime.equipItem(ctx, 0);

  assert.deepStrictEqual(
    chat,
    [{ message: "You need Defense level 40 to equip the Rune Shield.", tone: "warn" }],
    "equip should block and warn when defense level is too low"
  );
  assert.strictEqual(ctx.equipment.shield, null, "failed equip should not modify equipment");
  assert.ok(ctx.inventory[0] && ctx.inventory[0].itemData.id === "rune_shield", "failed equip should leave the inventory item in place");
  assert.deepStrictEqual(
    hooks,
    {
      clearSelectedUse: 0,
      updateStats: 0,
      renderInventory: 0,
      renderEquipment: 0,
      updatePlayerModel: 0
    },
    "failed equip should not trigger follow-up UI updates"
  );
}

{
  const oldShield = { id: "bronze_shield", name: "Bronze Shield", type: "shield" };
  const { ctx, chat, hooks } = makeEquipContext({ defenseLevel: 40, oldShield });
  runtime.equipItem(ctx, 0);

  assert.deepStrictEqual(chat, [], "successful equip should not emit a warning");
  assert.strictEqual(ctx.equipment.shield.id, "rune_shield", "successful equip should place the new shield in the equipment slot");
  assert.strictEqual(ctx.inventory[0].itemData.id, "bronze_shield", "successful equip should swap the old shield into inventory");
  assert.deepStrictEqual(
    hooks,
    {
      clearSelectedUse: 1,
      updateStats: 1,
      renderInventory: 1,
      renderEquipment: 1,
      updatePlayerModel: 1
    },
    "successful equip should trigger the standard UI refresh path"
  );
}

console.log("Combat defense equip guard passed.");
