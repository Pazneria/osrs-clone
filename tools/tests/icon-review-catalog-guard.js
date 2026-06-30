const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { readPngSize } = require("../pixel/pixel-png");
const { loadPixelSource } = require("../pixel/pixel-project");

function readRepoFile(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadWindowScript(root, relativePath, windowRef) {
  const source = readRepoFile(root, relativePath);
  vm.runInNewContext(source, { window: windowRef }, { filename: path.join(root, relativePath) });
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const windowRef = {};
  loadWindowScript(root, "src/js/content/icon-review-catalog.js", windowRef);
  loadWindowScript(root, "src/js/content/item-catalog.js", windowRef);

  const catalog = windowRef.IconReviewCatalog;
  const itemDefs = windowRef.ItemCatalog && windowRef.ItemCatalog.ITEM_DEFS;
  const iconStatus = JSON.parse(readRepoFile(root, "content/icon-status.json"));

  assert(catalog && typeof catalog === "object", "icon review catalog should load");
  assert(/^20\d{2}\.\d{2}\.m\d+[a-z]$/.test(catalog.version), "active icon review catalog should use a dated version");
  assert(/^icon_review_20\d{6}_[a-z0-9_]+$/.test(catalog.activeBatchId), "active icon review batch id should be dated and descriptive");
  assert(typeof catalog.label === "string" && catalog.label.trim().length > 0, "active icon review batch should have a label");
  assert(catalog.replaceInventory === true, "active icon review batches should replace inventory for clean contact-sheet review");
  assert(Array.isArray(catalog.itemIds) && catalog.itemIds.length > 0, "active icon review batch should include item ids");
  assert(catalog.itemIds.length <= 28, "active icon review batch should fit in one inventory");

  const seen = new Set();
  catalog.itemIds.forEach((itemId) => {
    assert(typeof itemId === "string" && itemId === itemId.trim() && itemId === itemId.toLowerCase(), `review item id should be normalized: ${itemId}`);
    assert(!seen.has(itemId), `review item id should be listed once: ${itemId}`);
    seen.add(itemId);

    const itemDef = itemDefs && itemDefs[itemId];
    assert(itemDef, `review item should exist in item catalog: ${itemId}`);
    assert(itemDef.icon && itemDef.icon.kind === "pixel", `review item should use a pixel icon: ${itemId}`);
    assert(itemDef.icon.assetId === itemId, `review item icon asset should match item id: ${itemId}`);

    const statusEntry = iconStatus.items && iconStatus.items[itemId];
    assert(statusEntry, `review item should exist in icon status: ${itemId}`);
    assert(statusEntry.assetId === itemId, `review item status asset should match item id: ${itemId}`);
    assert(statusEntry.treatment === "bespoke", `review item should stay on bespoke treatment: ${itemId}`);
    assert(statusEntry.status === "done", `review item should be marked done before leaving it in the active review batch: ${itemId}`);

    const pixelSource = loadPixelSource(root, itemId);
    assert(pixelSource.id === itemId, `review pixel source id should match asset id: ${itemId}`);
    assert(pixelSource.width === 32 && pixelSource.height === 32, `review pixel source should stay 32x32: ${itemId}`);

    const iconPath = path.join(root, "assets", "pixel", `${itemId}.png`);
    assert(fs.existsSync(iconPath), `review item should have a generated runtime icon: ${itemId}`);
    const iconSize = readPngSize(iconPath);
    assert(iconSize.width === 32 && iconSize.height === 32, `review runtime icon should stay 32x32: ${itemId}`);

    const heldModelPath = path.join(root, "assets", "models", `${itemId}.obj`);
    const groundModelPath = path.join(root, "assets", "models", `${itemId}-ground.obj`);
    assert(fs.existsSync(heldModelPath), `review item should have a generated held model: ${itemId}`);
    assert(fs.existsSync(groundModelPath), `review item should have a generated ground model: ${itemId}`);
  });

  console.log("Icon review catalog guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
