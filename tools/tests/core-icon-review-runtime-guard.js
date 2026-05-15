const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "core-icon-review-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/core-icon-review-runtime.js");
  const coreSource = readRepoFile(root, "src/js/core.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const packageSuiteManifestSource = readRepoFile(root, "tools/tests/package-suite-manifest.js");
  const runtimeIndex = manifestSource.indexOf('id: "core-icon-review-runtime"');
  const coreIndex = manifestSource.indexOf('id: "core"');

  assert(runtimeIndex !== -1, "legacy manifest should include core icon review runtime");
  assert(coreIndex !== -1 && runtimeIndex < coreIndex, "legacy manifest should load core icon review runtime before core.js");
  assert(packageSuiteManifestSource.includes('"src/js/core-icon-review-runtime.js"'), "check suite should syntax-check core icon review runtime");
  assert(runtimeSource.includes("window.CoreIconReviewRuntime"), "icon review runtime should expose a window runtime");
  assert(runtimeSource.includes("function sanitizeIconReviewItemIds(context = {}, itemIds)"), "runtime should own icon review item id sanitization");
  assert(runtimeSource.includes("function getActiveIconReviewBatch(context = {})"), "runtime should own active icon review batch resolution");
  assert(runtimeSource.includes("function isIconReviewRequested(context = {})"), "runtime should own iconReview query parsing");
  assert(runtimeSource.includes("function applyInventoryIconReviewGrant(context = {})"), "runtime should own inventory icon review grant behavior");

  assert(coreSource.includes("const coreIconReviewRuntime = window.CoreIconReviewRuntime || null;"), "core.js should resolve core icon review runtime");
  assert(coreSource.includes("function buildCoreIconReviewRuntimeContext()"), "core.js should adapt icon review context narrowly");
  assert(coreSource.includes("getCoreIconReviewRuntime().sanitizeIconReviewItemIds(buildCoreIconReviewRuntimeContext(), itemIds)"), "core.js should delegate icon review item sanitization");
  assert(coreSource.includes("getCoreIconReviewRuntime().getActiveIconReviewBatch(buildCoreIconReviewRuntimeContext())"), "core.js should delegate icon review batch resolution");
  assert(coreSource.includes("getCoreIconReviewRuntime().applyInventoryIconReviewGrant(buildCoreIconReviewRuntimeContext())"), "core.js should delegate icon review grant application");
  assert(!coreSource.includes("const DEFAULT_ICON_REVIEW_ITEM_IDS = ["), "core.js should not own icon review fallback batch definitions");
  assert(!coreSource.includes("params.get('iconReview')"), "core.js should not own iconReview query parsing inline");
  assert(!coreSource.includes("reviewBatch.itemIds.length"), "core.js should not own icon review grant loops inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CoreIconReviewRuntime;
  assert(runtime, "icon review runtime should execute in isolation");
  assert(typeof runtime.applyInventoryIconReviewGrant === "function", "runtime should expose applyInventoryIconReviewGrant");

  const itemDb = {
    coins: { id: "coins", stackable: true },
    bronze_pickaxe: { id: "bronze_pickaxe", stackable: false },
    iron_pickaxe: { id: "iron_pickaxe", stackable: false }
  };
  const sanitizeContext = {
    sanitizeItemId: (value) => String(value || "").trim().toLowerCase()
  };
  const sanitizedIds = runtime.sanitizeIconReviewItemIds(sanitizeContext, [" Coins ", "coins", "", "IRON_PICKAXE"]);
  assert(sanitizedIds.join(",") === "coins,iron_pickaxe", "runtime should normalize and dedupe review item ids");

  const inactiveResult = runtime.applyInventoryIconReviewGrant({
    ITEM_DB: itemDb,
    inventory: Array(28).fill(null),
    windowRef: { location: { search: "" } },
    URLSearchParamsRef: URLSearchParams
  });
  assert(inactiveResult.changed === false && inactiveResult.added.length === 0, "runtime should leave inventories alone unless iconReview is requested");

  const inventory = Array(28).fill(null);
  const marked = [];
  const activeResult = runtime.applyInventoryIconReviewGrant({
    ITEM_DB: itemDb,
    inventory,
    sanitizeItemId: sanitizeContext.sanitizeItemId,
    windowRef: {
      location: { search: "?iconReview=yes" },
      IconReviewCatalog: {
        activeBatchId: "batch_a",
        label: "Batch A",
        itemIds: ["bronze_pickaxe", "missing", "iron_pickaxe"]
      }
    },
    URLSearchParamsRef: URLSearchParams,
    hasContentGrantItem: () => false,
    markContentGrantItem: (grantId, itemId) => marked.push(`${grantId}:${itemId}`),
    inventoryContainsItem: () => false
  });
  assert(activeResult.changed === true && activeResult.replaced === false, "runtime should apply active icon review grants");
  assert(activeResult.added.join(",") === "bronze_pickaxe,iron_pickaxe", "runtime should add available review items");
  assert(activeResult.blocked.join(",") === "missing", "runtime should report missing review items as blocked");
  assert(inventory[0].itemData === itemDb.bronze_pickaxe && inventory[1].itemData === itemDb.iron_pickaxe, "runtime should place granted items in inventory slots");
  assert(marked.join(",") === "batch_a:bronze_pickaxe,batch_a:iron_pickaxe", "runtime should mark granted content items");

  const replacedSlots = [];
  const replaceResult = runtime.applyInventoryIconReviewGrant({
    ITEM_DB: itemDb,
    inventory: Array(28).fill(null),
    sanitizeItemId: sanitizeContext.sanitizeItemId,
    windowRef: {
      location: { search: "?iconReview=1" },
      IconReviewCatalog: {
        activeBatchId: "replace_batch",
        label: "Replace Batch",
        replaceInventory: true,
        itemIds: ["bronze_pickaxe", "coins"]
      }
    },
    URLSearchParamsRef: URLSearchParams,
    hasContentGrantItem: (_grantId, itemId) => itemId === "coins",
    markContentGrantItem: (grantId, itemId) => marked.push(`${grantId}:${itemId}`),
    setInventorySlots: (slots) => replacedSlots.push(...slots)
  });
  assert(replaceResult.replaced === true && replaceResult.placed === 2, "runtime should support replace-inventory review batches");
  assert(replaceResult.added.join(",") === "bronze_pickaxe", "runtime should add unacknowledged replace items");
  assert(replaceResult.acknowledged.join(",") === "coins", "runtime should acknowledge already-granted replace items");
  assert(replacedSlots.map((slot) => slot.itemId).join(",") === "bronze_pickaxe,coins", "runtime should pass replace slots through the core inventory hook");

  console.log("Core icon review runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
