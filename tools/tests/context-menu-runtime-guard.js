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

const runtimeSource = read("src/js/context-menu-runtime.js");
const coreSource = read("src/js/core.js");
const inputSource = read("src/js/input-render.js");
const inventorySource = read("src/js/inventory.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");

assert.ok(runtimeSource.includes("window.ContextMenuRuntime"), "context menu runtime should expose a window runtime");
assert.ok(runtimeSource.includes("function showContextMenuAt(clientX, clientY, options = {})"), "context menu runtime should own menu positioning");
assert.ok(runtimeSource.includes("function addContextMenuOption(text, callback, options = {})"), "context menu runtime should own option insertion");
assert.ok(runtimeSource.includes("function closeContextMenu(options = {})"), "context menu runtime should own close hooks");
assert.ok(coreSource.includes("function getContextMenuRuntime()"), "core.js should resolve the context menu runtime");
assert.ok(coreSource.includes("runtime.showContextMenuAt(clientX, clientY"), "core.js should delegate menu positioning");
assert.ok(coreSource.includes("runtime.addContextMenuOption(text, callback"), "core.js should delegate option insertion");
assert.ok(coreSource.includes("runtime.closeContextMenu(buildContextMenuRuntimeOptions())"), "core.js should delegate menu closing");
assert.ok(inputSource.includes("clearContextMenuOptions();"), "input-render.js should clear menu options through the shell wrapper");
assert.ok(!inputSource.includes("function addContextMenuOption(text, callback)"), "input-render.js should not own context menu option DOM");
assert.ok(!inputSource.includes("function closeContextMenu()"), "input-render.js should not own context menu close DOM");
assert.ok(inventorySource.includes("clearContextMenuOptions();"), "inventory.js should clear menu options through the shell wrapper");
assert.ok(!inventorySource.includes("contextOptionsListEl.innerHTML = ''"), "inventory.js should not clear the menu container directly");
assert.ok(manifestSource.includes('../../js/context-menu-runtime.js?raw'), "legacy manifest should import context menu runtime");
assert.ok(
  manifestSource.indexOf('id: "context-menu-runtime"') < manifestSource.indexOf('id: "core"'),
  "legacy manifest should load context menu runtime before core.js"
);

const sandbox = { window: {} };
vm.runInNewContext(runtimeSource, sandbox, { filename: "context-menu-runtime.js" });
const runtime = sandbox.window.ContextMenuRuntime;
assert.ok(runtime, "context menu runtime should evaluate in isolation");

const menu = {
  classList: makeClassList(["hidden"]),
  offsetWidth: 160,
  offsetHeight: 120,
  style: {},
  listeners: {},
  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }
};
const optionRows = [];
const optionsList = {
  innerHTML: "old",
  appendChild(node) {
    optionRows.push(node);
  }
};
const inventorySlots = [
  { getBoundingClientRect: () => ({ top: 300, width: 32, height: 32 }) }
];
const documentRef = {
  getElementById(id) {
    if (id === "context-menu") return menu;
    if (id === "context-options-list") return optionsList;
    return null;
  },
  querySelectorAll(selector) {
    return selector === "#view-inv .inventory-slot" ? inventorySlots : [];
  },
  createElement(tagName) {
    return {
      tagName,
      className: "",
      innerHTML: "",
      onclick: null
    };
  }
};
const windowRef = { innerWidth: 320, innerHeight: 500 };
let swapCleared = 0;
let tooltipHidden = 0;
const options = {
  documentRef,
  windowRef,
  clearItemSwapLeftClickUI: () => { swapCleared += 1; },
  hideInventoryHoverTooltip: () => { tooltipHidden += 1; }
};

runtime.showContextMenuAt(300, 240, options);
assert.ok(!menu.classList.contains("hidden"), "showContextMenuAt should reveal the context menu");
assert.strictEqual(menu.style.left, "152px", "showContextMenuAt should clamp menu within the viewport");
assert.strictEqual(menu.style.top, "196px", "showContextMenuAt should cap menu depth around the inventory grid");

runtime.clearContextMenuOptions(options);
assert.strictEqual(optionsList.innerHTML, "", "clearContextMenuOptions should clear the option container");

let selected = false;
const option = runtime.addContextMenuOption("Walk here", () => { selected = true; }, options);
assert.ok(option, "addContextMenuOption should return the inserted option node");
assert.strictEqual(option.innerHTML, '<span class="text-white">Walk</span> here', "addContextMenuOption should split action labels");
assert.strictEqual(optionRows.length, 1, "addContextMenuOption should append the option row");
option.onclick({ stopPropagation() {} });
assert.ok(selected, "option click should run the callback");
assert.ok(menu.classList.contains("hidden"), "option click should close the menu");
assert.strictEqual(swapCleared, 1, "closeContextMenu should clear swap-left-click UI");
assert.strictEqual(tooltipHidden, 1, "closeContextMenu should hide inventory hover tooltip");

runtime.bindContextMenuMouseleave(options);
menu.classList.remove("hidden");
menu.listeners.mouseleave({ relatedTarget: null });
assert.ok(menu.classList.contains("hidden"), "mouseleave should close the context menu");

console.log("Context menu runtime guard passed.");
