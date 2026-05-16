const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "inventory-item-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/inventory-item-runtime.js");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const inventoryRuntimeIndex = manifestSource.indexOf('id: "inventory-item-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');
  const skillsRuntimeIndex = manifestSource.indexOf('id: "skills-runtime"');

  assert(inventoryRuntimeIndex !== -1, "legacy manifest should include inventory item runtime");
  assert(worldIndex !== -1 && skillsRuntimeIndex !== -1, "legacy manifest should include world and skills runtime");
  assert(inventoryRuntimeIndex < worldIndex, "legacy manifest should load inventory item runtime before world.js");
  assert(runtimeSource.includes("window.InventoryItemRuntime"), "inventory item runtime should expose a window runtime");
  assert(runtimeSource.includes("function giveItem(context = {}, itemData, amount = 1)"), "inventory item runtime should own item grants");
  assert(runtimeSource.includes("function getInventoryCount(context = {}, itemId)"), "inventory item runtime should own item counting");
  assert(runtimeSource.includes("function removeItemsById(context = {}, itemId, amount)"), "inventory item runtime should own multi-item removal");
  assert(worldSource.includes("const inventoryItemRuntime = window.InventoryItemRuntime || null;"), "world.js should resolve inventory item runtime");
  assert(worldSource.includes("inventoryItemRuntime.giveItem(buildInventoryItemRuntimeContext(), itemData, amount)"), "world.js should delegate item grants");
  assert(worldSource.includes("inventoryItemRuntime.removeItemsById(buildInventoryItemRuntimeContext(), itemId, amount)"), "world.js should delegate multi-item removal");
  assert(!worldSource.includes("inventory[existingIdx].amount += amount;"), "world.js should not grant stackable items inline");
  assert(!worldSource.includes("return inventory.reduce((sum, slot) => {"), "world.js should not count inventory inline");
  assert(!worldSource.includes("slot.amount -= take;"), "world.js should not remove item amounts inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: runtimePath });
  const runtime = window.InventoryItemRuntime;
  assert(runtime, "inventory item runtime should be available after evaluation");

  const coins = { id: "coins", name: "Coins", stackable: true };
  const logs = { id: "logs", name: "Logs", stackable: false };
  const inventory = [
    { itemData: coins, amount: 5 },
    null,
    { itemData: logs, amount: 1 },
    null
  ];
  const renderCalls = [];
  const cleared = [];
  const context = {
    inventory,
    selectedUse: { invIndex: 0, itemId: "coins" },
    clearSelectedUse: (preserve) => cleared.push(preserve),
    renderInventory: () => renderCalls.push("render")
  };

  assert(runtime.giveItem(context, coins, 7) === 7, "stackable grants should merge into existing stacks");
  assert(inventory[0].amount === 12, "stackable grants should mutate the existing stack");
  assert(runtime.giveItem(context, logs, 2) === 2, "non-stackable grants should fill empty slots");
  assert(inventory[1].itemData.id === "logs" && inventory[3].itemData.id === "logs", "non-stackable grants should occupy empty slots");
  assert(renderCalls.length === 2, "item grants should refresh inventory when anything is granted");
  assert(runtime.getInventoryCount(context, "logs") === 3, "inventory count should sum matching slots");
  assert(runtime.getFirstInventorySlotByItemId(context, "logs") === 1, "first-slot lookup should return the first positive matching slot");
  assert(runtime.removeItemsById(context, "coins", 6) === 6, "multi-item removal should remove requested stack amount");
  assert(inventory[0].amount === 6 && cleared.length === 0, "partial selected-stack removal should keep selected use");
  assert(runtime.removeOneItemById(context, "coins"), "single item removal should remove one item");
  assert(inventory[0].amount === 5 && cleared.length === 1 && cleared[0] === false, "single item removal should clear selected use for the touched slot");
  assert(runtime.removeItemsById(context, "logs", 4) === 3, "multi-item removal should stop when matching slots are exhausted");
  assert(runtime.getInventoryCount(context, "logs") === 0, "multi-item removal should clear depleted non-stackable slots");

  const staleSelectionInventory = [{ itemData: coins, amount: 4 }];
  const staleSelectionCleared = [];
  assert(runtime.removeItemsById({
    inventory: staleSelectionInventory,
    selectedUse: { invIndex: 0, itemId: "logs" },
    clearSelectedUse: (preserve) => staleSelectionCleared.push(preserve)
  }, "coins", 1) === 1, "multi-item removal should support stale selected-use slots");
  assert(staleSelectionInventory[0].amount === 3, "multi-item removal should leave partially depleted stacks in place");
  assert(staleSelectionCleared.length === 1 && staleSelectionCleared[0] === false, "multi-item removal should clear stale selected-use state when the slot no longer contains the selected item");

  console.log("Inventory item runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
