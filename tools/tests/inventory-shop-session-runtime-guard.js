const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "inventory-shop-session-runtime.js");
  const runtimeSource = read(root, "src/js/inventory-shop-session-runtime.js");
  const inventorySource = read(root, "src/js/inventory.js");
  const manifestSource = read(root, "src/game/platform/legacy-script-manifest.ts");
  const packageSource = read(root, "package.json");

  const runtimeIndex = manifestSource.indexOf('id: "inventory-shop-session-runtime"');
  const inventoryIndex = manifestSource.indexOf('id: "inventory"');
  assert(runtimeSource.includes("window.InventoryShopSessionRuntime"), "shop session runtime should expose a window runtime");
  assert(runtimeSource.includes("function createShopSession(options = {})"), "shop session runtime should own session creation");
  assert(runtimeSource.includes("function ensureMerchantInventory(session, merchantId, options = {})"), "shop session runtime should own merchant inventory activation");
  assert(runtimeSource.includes("function updateActiveInventory(session, inventory)"), "shop session runtime should own active inventory persistence");
  assert(runtimeIndex !== -1, "legacy manifest should include inventory shop session runtime");
  assert(inventoryIndex !== -1 && runtimeIndex < inventoryIndex, "legacy manifest should load shop session runtime before inventory.js");
  assert(packageSource.includes('"test:inventory-shop-session:guard"'), "package should expose a targeted inventory shop session guard");
  assert(packageSource.includes("--check ./src/js/inventory-shop-session-runtime.js"), "package check should syntax-check the inventory shop session runtime");

  assert(inventorySource.includes("function getInventoryShopSessionRuntime()"), "inventory.js should resolve the shop session runtime");
  assert(inventorySource.includes("inventoryShopSessionRuntime.createShopSession({ defaultMerchantId: 'general_store', inventorySize: 100 })"), "inventory.js should initialize shop state through the runtime");
  assert(inventorySource.includes("inventoryShopSessionRuntime.ensureMerchantInventory(shopSession, merchantId"), "inventory.js should activate merchant inventories through the runtime");
  assert(inventorySource.includes("inventoryShopSessionRuntime.updateActiveInventory(shopSession, nextInventory)"), "inventory.js should persist shop inventory changes through the runtime");
  assert(inventorySource.includes("window.getActiveShopMerchantId = getActiveShopMerchantId"), "inventory.js should keep the existing active merchant compatibility hook");
  assert(!inventorySource.includes("let isShopOpen = false;"), "inventory.js should not own shop open state as a loose local");
  assert(!inventorySource.includes("let activeShopMerchantId = 'general_store';"), "inventory.js should not own active merchant as a loose local");
  assert(!inventorySource.includes("const shopInventoriesByMerchant = {};"), "inventory.js should not own merchant shop cache as a loose local");
  assert(!inventorySource.includes("let shopInventory = Array(100).fill(null);"), "inventory.js should not own active shop inventory as a loose local");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InventoryShopSessionRuntime;
  assert(runtime, "shop session runtime should execute in isolation");

  const session = runtime.createShopSession({ defaultMerchantId: "general_store", inventorySize: 3 });
  assert(runtime.getActiveMerchantId(session) === "general_store", "shop session should start on the default merchant");
  assert(runtime.getActiveInventory(session).length === 3, "shop session should honor requested inventory size");
  assert(runtime.isOpen(session) === false, "shop session should start closed");
  runtime.setOpen(session, true);
  assert(runtime.isOpen(session) === true, "shop session should update open state");

  const created = [];
  const ensured = [];
  const firstInventory = runtime.ensureMerchantInventory(session, "fishing_supplier", {
    createInventory: (merchantId) => {
      created.push(merchantId);
      return [{ itemData: { id: "small_net" }, amount: 5 }, null, null];
    },
    ensureUnlockedStock: (merchantId, inventory) => {
      ensured.push({ merchantId, count: inventory.length });
      return inventory.concat([{ itemData: { id: "bait" }, amount: 10 }]);
    }
  });
  assert(created.join(",") === "fishing_supplier", "merchant inventory should be lazily created once");
  assert(ensured.length === 1 && ensured[0].merchantId === "fishing_supplier", "merchant stock refresh should run after activation");
  assert(runtime.getActiveMerchantId(session) === "fishing_supplier", "merchant activation should update active merchant");
  assert(firstInventory.length === 4, "merchant stock refresh should be able to replace active inventory");

  runtime.updateActiveInventory(session, [{ itemData: { id: "harpoon" }, amount: 1 }]);
  assert(runtime.getActiveInventory(session)[0].itemData.id === "harpoon", "active inventory updates should persist");
  runtime.ensureMerchantInventory(session, "general_store", {
    createInventory: () => [{ itemData: { id: "coins" }, amount: 100 }]
  });
  assert(runtime.getActiveMerchantId(session) === "general_store", "switching merchants should update active merchant");
  runtime.ensureMerchantInventory(session, "fishing_supplier");
  assert(runtime.getActiveInventory(session)[0].itemData.id === "harpoon", "switching back should reuse persisted merchant stock");

  console.log("Inventory shop session runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
