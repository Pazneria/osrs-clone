const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "inventory-action-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/inventory-action-runtime.js");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const runtimeIndex = manifestSource.indexOf('id: "inventory-action-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(runtimeIndex !== -1, "legacy manifest should include inventory action runtime");
  assert(worldIndex !== -1 && runtimeIndex < worldIndex, "legacy manifest should load inventory action runtime before world.js");
  assert(runtimeSource.includes("window.InventoryActionRuntime"), "inventory action runtime should expose a window runtime");
  assert(runtimeSource.includes("function tryUseItemOnInventory(context = {}, sourceInvIndex, targetInvIndex)"), "inventory action runtime should own item-on-inventory dispatch");
  assert(runtimeSource.includes("function handleInventorySlotClick(context = {}, invIndex)"), "inventory action runtime should own inventory slot click dispatch");
  assert(runtimeSource.includes("function handleItemAction(context = {}, invIndex, actionName)"), "inventory action runtime should own inventory action dispatch");
  assert(worldSource.includes("const inventoryActionRuntime = window.InventoryActionRuntime || null;"), "world.js should resolve inventory action runtime");
  assert(worldSource.includes("inventoryActionRuntime.tryUseItemOnInventory(buildInventoryActionRuntimeContext(), sourceInvIndex, targetInvIndex)"), "world.js should delegate item-on-inventory dispatch");
  assert(worldSource.includes("inventoryActionRuntime.handleInventorySlotClick(buildInventoryActionRuntimeContext(), invIndex)"), "world.js should delegate inventory slot clicks");
  assert(worldSource.includes("inventoryActionRuntime.handleItemAction(buildInventoryActionRuntimeContext(), invIndex, actionName)"), "world.js should delegate inventory item actions");
  assert(!worldSource.includes("targetObj: 'INVENTORY'"), "world.js should not construct item-on-inventory skill targets inline");
  assert(!worldSource.includes("const pouchUsed = window.RunecraftingPouchRuntime.tryUsePouch"), "world.js should not dispatch runecrafting pouch inventory actions inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InventoryActionRuntime;
  assert(runtime, "inventory action runtime should be available after evaluation");

  const inventory = [
    { itemData: { id: "knife", name: "Knife" }, amount: 1 },
    { itemData: { id: "logs", name: "Logs" }, amount: 1 },
    { itemData: { id: "small_pouch", name: "Small Pouch" }, amount: 1 },
    { itemData: { id: "rune_essence", name: "Rune Essence" }, amount: 8 }
  ];

  {
    const skillCalls = [];
    const context = {
      inventory,
      SkillRuntime: {
        tryUseItemOnTarget: (options) => {
          skillCalls.push(options);
          return true;
        }
      }
    };
    assert(runtime.tryUseItemOnInventory(context, 0, 1) === true, "item-on-inventory should route through SkillRuntime");
    assert(skillCalls.length === 1, "SkillRuntime should be called once");
    assert(skillCalls[0].targetObj === "INVENTORY", "SkillRuntime target should identify inventory");
    assert(skillCalls[0].targetUid.sourceItemId === "knife" && skillCalls[0].targetUid.targetItemId === "logs", "SkillRuntime target should include source and target item IDs");
  }

  {
    const calls = [];
    const context = {
      inventory,
      getFiremakingLogItemIdForPair: (a, b) => (a === "logs" && b === "knife" ? "logs" : null),
      startFiremaking: (itemId) => {
        calls.push(itemId);
        return true;
      }
    };
    assert(runtime.tryUseItemOnInventory(context, 1, 0) === true, "item-on-inventory should fall back to firemaking log pairs");
    assert(calls.length === 1 && calls[0] === "logs", "firemaking fallback should pass the matched log item ID");
  }

  {
    const pouchCalls = [];
    const context = {
      inventory,
      createRunecraftingPouchContext: () => ({ tag: "pouch-context" }),
      RunecraftingPouchRuntime: {
        tryUseItemOnInventory: (pouchContext, sourceItemId, targetItemId) => {
          pouchCalls.push({ pouchContext, sourceItemId, targetItemId });
          return true;
        }
      }
    };
    assert(runtime.tryUseItemOnInventory(context, 2, 3) === true, "item-on-inventory should prefer runecrafting pouch dispatch");
    assert(pouchCalls.length === 1 && pouchCalls[0].pouchContext.tag === "pouch-context", "pouch dispatch should receive the pouch context");
  }

  {
    const calls = [];
    const context = {
      inventory,
      selectedUse: { invIndex: 0, itemId: "knife" },
      getSelectedUseItem: () => inventory[0],
      clearSelectedUse: () => calls.push("clear"),
      SkillRuntime: {
        tryUseItemOnTarget: () => true
      }
    };
    assert(runtime.handleInventorySlotClick(context, 1) === true, "selected inventory clicks should try item-on-inventory");
    assert(calls.join(",") === "clear", "successful selected inventory clicks should clear selected use");
  }

  {
    const calls = [];
    const context = {
      inventory,
      selectedUse: { invIndex: null, itemId: null },
      getSelectedUseItem: () => null,
      getItemMenuPreferenceKey: (scope, itemId) => `${scope}:${itemId}`,
      resolveDefaultItemAction: (item, prefKey) => {
        calls.push(["default", item.id, prefKey]);
        return "Eat";
      },
      eatItem: (invIndex) => calls.push(["eat", invIndex])
    };
    assert(runtime.handleInventorySlotClick(context, 1) === true, "plain inventory clicks should run the default item action");
    assert(calls[0].join("|") === "default|logs|inventory:logs", "default item action should receive inventory preference key");
    assert(calls[1].join("|") === "eat|1", "default action should dispatch to action handler");
  }

  {
    const calls = [];
    const context = {
      inventory,
      selectUseItem: (invIndex) => calls.push(["select", invIndex]),
      equipItem: (invIndex) => calls.push(["equip", invIndex]),
      eatItem: (invIndex) => calls.push(["eat", invIndex]),
      dropItem: (invIndex) => calls.push(["drop", invIndex]),
      createRunecraftingPouchContext: () => ({}),
      RunecraftingPouchRuntime: {
        tryUsePouch: (_context, itemId, options = {}) => {
          if (itemId === "small_pouch" && options.forceEmpty) {
            calls.push(["empty-pouch", itemId]);
            return true;
          }
          return false;
        }
      }
    };
    assert(runtime.handleItemAction(context, 0, "Use") === true, "Use action should select an item when no pouch action handles it");
    assert(runtime.handleItemAction(context, 0, "Equip") === true, "Equip action should dispatch");
    assert(runtime.handleItemAction(context, 0, "Eat") === true, "Eat action should dispatch");
    assert(runtime.handleItemAction(context, 0, "Drop") === true, "Drop action should dispatch");
    assert(runtime.handleItemAction(context, 2, "Empty (8)") === true, "Empty action should dispatch through pouch runtime");
    assert(calls.map((call) => call.join(":")).join(",") === "select:0,equip:0,eat:0,drop:0,empty-pouch:small_pouch", "item actions should dispatch in order");
  }

  console.log("Inventory action runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
