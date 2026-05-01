const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
    contains(value) {
      return values.has(value);
    }
  };
}

const runtimeSource = read("src/js/inventory-tooltip-runtime.js");
const inventorySource = read("src/js/inventory.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");

assert.ok(
  runtimeSource.includes("window.InventoryTooltipRuntime"),
  "inventory tooltip runtime should expose a window runtime"
);
assert.ok(
  runtimeSource.includes("function buildItemTooltipSections(item, options = {})"),
  "inventory tooltip runtime should own item tooltip section construction"
);
assert.ok(
  runtimeSource.includes("function positionInventoryHoverTooltip(tooltip, clientX, clientY, options = {})"),
  "inventory tooltip runtime should own inventory tooltip positioning"
);
assert.ok(
  runtimeSource.includes("function publishInventoryTooltipHooks(options = {})"),
  "inventory tooltip runtime should own inventory tooltip hook publication"
);
assert.ok(
  inventorySource.includes("function getInventoryTooltipRuntime()"),
  "inventory.js should resolve the inventory tooltip runtime"
);
assert.ok(
  inventorySource.includes("runtime.buildItemTooltipHtml(item, options)"),
  "inventory.js should delegate item tooltip HTML building"
);
assert.ok(
  inventorySource.includes("runtime.bindInventorySlotTooltip(Object.assign(buildInventoryTooltipOptions()"),
  "inventory.js should delegate tooltip binding"
);
assert.ok(
  inventorySource.includes("inventoryTooltipRuntimeForPublication.publishInventoryTooltipHooks({"),
  "inventory.js should publish tooltip hooks through the inventory tooltip runtime"
);
assert.ok(
  !inventorySource.includes("window.hideInventoryHoverTooltip = hideInventoryHoverTooltip"),
  "inventory.js should not directly publish hideInventoryHoverTooltip"
);
assert.ok(
  !inventorySource.includes("function buildItemTooltipSections(item, options = {})"),
  "inventory.js should not own item tooltip section construction"
);
assert.ok(
  !inventorySource.includes("function positionInventoryHoverTooltip(tooltip, clientX, clientY)"),
  "inventory.js should not own inventory tooltip positioning"
);
assert.ok(
  manifestSource.includes('../../js/inventory-tooltip-runtime.js?raw'),
  "legacy manifest should import inventory tooltip runtime"
);
assert.ok(
  manifestSource.indexOf('id: "inventory-tooltip-runtime"') < manifestSource.indexOf('id: "inventory"'),
  "legacy manifest should load inventory tooltip runtime before inventory.js"
);

const sandbox = { window: {} };
vm.runInNewContext(runtimeSource, sandbox, { filename: "inventory-tooltip-runtime.js" });
const runtime = sandbox.window.InventoryTooltipRuntime;
assert.ok(runtime, "inventory tooltip runtime should evaluate in isolation");

const publishedWindow = {};
const hideInventoryHoverTooltip = () => {};
runtime.publishInventoryTooltipHooks({ windowRef: publishedWindow, hideInventoryHoverTooltip });
assert.strictEqual(
  publishedWindow.hideInventoryHoverTooltip,
  hideInventoryHoverTooltip,
  "publishInventoryTooltipHooks should publish the hide tooltip compatibility hook"
);

const item = {
  name: "Rune Shield <safe>",
  value: 32000,
  requiredDefenseLevel: 40,
  stats: { def: 7 },
  combat: { attackProfile: { tickCycle: 4 } }
};

const text = runtime.buildItemTooltipText(item, { amount: 2, actionText: "Click to unequip" });
assert.ok(text.includes("Rune Shield <safe>"), "plain tooltip text should include the item name");
assert.ok(text.includes("Amount: 2"), "plain tooltip text should include stack amounts");
assert.ok(text.includes("Defense req.: 40"), "plain tooltip text should include defense requirements");

const html = runtime.buildItemTooltipHtml(item, { amount: 2 });
assert.ok(html.includes("Rune Shield &lt;safe&gt;"), "HTML tooltip should escape item names");
assert.ok(html.includes("Defense req."), "HTML tooltip should include defense requirement labels");
assert.ok(html.includes("+7"), "HTML tooltip should include signed stat bonuses");

const tooltip = {
  classList: makeClassList(["hidden"]),
  innerHTML: "",
  textContent: "",
  offsetWidth: 140,
  offsetHeight: 24,
  style: {}
};
const documentRef = {
  getElementById(id) {
    return id === "inventory-hover-tooltip" ? tooltip : null;
  }
};
const windowRef = { innerWidth: 240, innerHeight: 120 };

runtime.showInventoryHoverTooltip("Coins", 220, 100, "<b>Coins</b>", {
  documentRef,
  windowRef,
  avoidRects: [{ left: 60, right: 90, top: 80, bottom: 110 }]
});

assert.strictEqual(tooltip.innerHTML, "<b>Coins</b>", "show tooltip should prefer supplied HTML");
assert.ok(!tooltip.classList.contains("hidden"), "show tooltip should reveal populated tooltip");
assert.strictEqual(tooltip.style.left, "66px", "tooltip should flip left near the viewport edge");
assert.strictEqual(tooltip.style.top, "46px", "tooltip should move above an overlapping avoid rect when possible");

const slot = {
  title: "old",
  attrs: {},
  setAttribute(name, value) {
    this.attrs[name] = value;
  },
  removeAttribute(name) {
    delete this.attrs[name];
  }
};
runtime.bindInventorySlotTooltip({
  slot,
  text: "Rune Shield",
  html,
  documentRef,
  windowRef
});
assert.strictEqual(slot.title, "", "binding should clear browser-native titles");
assert.strictEqual(slot.attrs["aria-label"], "Rune Shield", "binding should add an accessible label");
assert.strictEqual(typeof slot.onmouseenter, "function", "binding should install mouse enter handler");
slot.onmouseleave();
assert.ok(tooltip.classList.contains("hidden"), "mouseleave should hide the inventory tooltip");

console.log("Inventory tooltip runtime guard passed.");
