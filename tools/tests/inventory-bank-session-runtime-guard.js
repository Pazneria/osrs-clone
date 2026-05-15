const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "inventory-bank-session-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/inventory-bank-session-runtime.js");
  const inventorySource = readRepoFile(root, "src/js/inventory.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const packageSource = readRepoFile(root, "package.json");
  const packageSuiteManifestSource = readRepoFile(root, "tools/tests/package-suite-manifest.js");

  const runtimeIndex = manifestSource.indexOf('id: "inventory-bank-session-runtime"');
  const inventoryIndex = manifestSource.indexOf('id: "inventory"');

  assert(manifestSource.includes("../../js/inventory-bank-session-runtime.js?raw"), "legacy manifest should import the inventory bank session runtime raw script");
  assert(runtimeIndex !== -1, "legacy manifest should include inventory bank session runtime");
  assert(inventoryIndex !== -1 && runtimeIndex < inventoryIndex, "legacy manifest should load the bank session runtime before inventory.js");

  assert(runtimeSource.includes("window.InventoryBankSessionRuntime"), "bank session runtime should expose a window runtime");
  assert(runtimeSource.includes("function createBankSession(options = {})"), "bank session runtime should own bank session creation");
  assert(runtimeSource.includes("function normalizeBankSource(sourceKey)"), "bank session runtime should own source normalization");
  assert(runtimeSource.includes("function publishBankSessionHooks(options = {})"), "bank session runtime should own bank hook publication");
  assert(packageSource.includes('"test:inventory-bank-session:guard"'), "package should expose a targeted inventory bank session guard");
  assert(packageSuiteManifestSource.includes('"src/js/inventory-bank-session-runtime.js"'), "package check should syntax-check the inventory bank session runtime");

  assert(inventorySource.includes("function getInventoryBankSessionRuntime()"), "inventory.js should resolve the bank session runtime");
  assert(inventorySource.includes("inventoryBankSessionRuntime.createBankSession({"), "inventory.js should create bank session through the runtime");
  assert(inventorySource.includes("runtime.setActiveBankSource(bankSession, sourceKey)"), "inventory.js should delegate active bank source updates");
  assert(inventorySource.includes("runtime.setOpen(bankSession, nextOpen)"), "inventory.js should delegate bank open state updates");
  assert(inventorySource.includes("inventoryBankSessionRuntimeForPublication.publishBankSessionHooks({"), "inventory.js should publish bank hooks through the bank session runtime");
  assert(inventorySource.includes("window.TutorialRuntime.recordBankAction('deposit', getActiveBankSource()"), "deposit tutorial proof should read the active bank source through the session runtime");
  assert(inventorySource.includes("window.TutorialRuntime.recordBankAction('withdraw', getActiveBankSource()"), "withdraw tutorial proof should read the active bank source through the session runtime");
  assert(!inventorySource.includes("let activeBankSource ="), "inventory.js should not own raw active bank source state");
  assert(!inventorySource.includes("window.setActiveBankSource = setActiveBankSource"), "inventory.js should not directly publish setActiveBankSource");
  assert(!inventorySource.includes("window.openBank = openBank"), "inventory.js should not directly publish openBank");
  assert(!inventorySource.includes("window.closeBank = closeBank"), "inventory.js should not directly publish closeBank");

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InventoryBankSessionRuntime;
  assert(runtime, "bank session runtime should execute in isolation");
  const session = runtime.createBankSession();
  assert(runtime.getActiveBankSource(session) === "unknown_bank", "bank session should default unknown sources");
  assert(runtime.isOpen(session) === false, "bank session should start closed");
  assert(runtime.setActiveBankSource(session, "booth:3,2,0") === "booth:3,2,0", "bank session should update active source");
  assert(runtime.getActiveBankSource(session) === "booth:3,2,0", "bank session should return active source");
  assert(runtime.setActiveBankSource(session, "") === "unknown_bank", "bank session should normalize empty sources");
  assert(runtime.setOpen(session, true) === true && runtime.isOpen(session) === true, "bank session should open");
  assert(runtime.setOpen(session, false) === false && runtime.isOpen(session) === false, "bank session should close");

  const publishedWindow = {};
  const setActiveBankSource = () => {};
  const openBank = () => {};
  const closeBank = () => {};
  runtime.publishBankSessionHooks({ windowRef: publishedWindow, setActiveBankSource, openBank, closeBank });
  assert(publishedWindow.setActiveBankSource === setActiveBankSource, "bank hook publication should expose setActiveBankSource");
  assert(publishedWindow.openBank === openBank, "bank hook publication should expose openBank");
  assert(publishedWindow.closeBank === closeBank, "bank hook publication should expose closeBank");

  console.log("Inventory bank session runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
