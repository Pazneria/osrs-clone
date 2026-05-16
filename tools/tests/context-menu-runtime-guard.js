const vm = require("vm");
const assert = require("assert");
const { makeClassList } = require("./dom-test-utils");
const { createRepoFileReader } = require("./repo-file-test-utils");

const read = createRepoFileReader(__dirname);

const runtimeSource = read("src/js/context-menu-runtime.js");
const coreSource = read("src/js/core.js");
const inputSource = read("src/js/input-render.js");
const inventorySource = read("src/js/inventory.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");

assert.ok(runtimeSource.includes("window.ContextMenuRuntime"), "context menu runtime should expose a window runtime");
assert.ok(runtimeSource.includes("function showContextMenuAt(clientX, clientY, options = {})"), "context menu runtime should own menu positioning");
assert.ok(runtimeSource.includes("function addContextMenuOption(text, callback, options = {})"), "context menu runtime should own option insertion");
assert.ok(runtimeSource.includes("function closeContextMenu(options = {})"), "context menu runtime should own close hooks");
assert.ok(runtimeSource.includes("function appendSwapLeftClickControl(options = {})"), "context menu runtime should own swap-left-click submenu insertion");
assert.ok(runtimeSource.includes("function clearSwapLeftClickControl(options = {})"), "context menu runtime should own swap-left-click submenu cleanup");
assert.ok(runtimeSource.includes("function getPreferredMenuAction(prefKey, actions, preferences = {})"), "context menu runtime should own preferred menu action lookup");
assert.ok(runtimeSource.includes("function publishInventoryMenuHooks(options = {})"), "context menu runtime should own inventory menu hook publication");
assert.ok(coreSource.includes("function getContextMenuRuntime()"), "core.js should resolve the context menu runtime");
assert.ok(coreSource.includes("runtime.showContextMenuAt(clientX, clientY"), "core.js should delegate menu positioning");
assert.ok(coreSource.includes("runtime.addContextMenuOption(text, callback"), "core.js should delegate option insertion");
assert.ok(coreSource.includes("runtime.closeContextMenu(buildContextMenuRuntimeOptions())"), "core.js should delegate menu closing");
assert.ok(inputSource.includes("clearContextMenuOptions();"), "input-render.js should clear menu options through the shell wrapper");
assert.ok(!inputSource.includes("function addContextMenuOption(text, callback)"), "input-render.js should not own context menu option DOM");
assert.ok(!inputSource.includes("function closeContextMenu()"), "input-render.js should not own context menu close DOM");
assert.ok(inventorySource.includes("clearContextMenuOptions();"), "inventory.js should clear menu options through the shell wrapper");
assert.ok(!inventorySource.includes("contextOptionsListEl.innerHTML = ''"), "inventory.js should not clear the menu container directly");
assert.ok(inventorySource.includes("runtime.appendSwapLeftClickControl({"), "inventory.js should delegate swap-left-click UI to the context menu runtime");
assert.ok(inventorySource.includes("runtime.clearSwapLeftClickControl({ documentRef: document })"), "inventory.js should delegate swap-left-click cleanup to the context menu runtime");
assert.ok(inventorySource.includes("contextMenuRuntimeForPublication.publishInventoryMenuHooks({"), "inventory.js should publish menu hooks through the context menu runtime");
assert.ok(!inventorySource.includes("window.clearItemSwapLeftClickUI = clearItemSwapLeftClickUI"), "inventory.js should not directly publish clearItemSwapLeftClickUI");
assert.ok(!inventorySource.includes("window.appendSwapLeftClickControl = appendSwapLeftClickControl"), "inventory.js should not directly publish appendSwapLeftClickControl");
assert.ok(!inventorySource.includes("window.getItemMenuPreferenceKey = getItemMenuPreferenceKey"), "inventory.js should not directly publish getItemMenuPreferenceKey");
assert.ok(!inventorySource.includes("window.getPreferredMenuAction = getPreferredMenuAction"), "inventory.js should not directly publish getPreferredMenuAction");
assert.ok(!inventorySource.includes("document.body.appendChild(submenu)"), "inventory.js should not own swap-left-click submenu DOM");
assert.ok(!inventorySource.includes("context-swap-caret"), "inventory.js should not own swap-left-click submenu markup");
assert.ok(manifestSource.includes('../../js/context-menu-runtime.js?raw'), "legacy manifest should import context menu runtime");
assert.ok(
  manifestSource.indexOf('id: "context-menu-runtime"') < manifestSource.indexOf('id: "core"'),
  "legacy manifest should load context menu runtime before core.js"
);

const sandbox = { window: {} };
vm.runInNewContext(runtimeSource, sandbox, { filename: "context-menu-runtime.js" });
const runtime = sandbox.window.ContextMenuRuntime;
assert.ok(runtime, "context menu runtime should evaluate in isolation");

const publishedWindow = {};
const publishedHooks = {
  clearItemSwapLeftClickUI() {},
  appendSwapLeftClickControl() {},
  getItemMenuPreferenceKey() {},
  getPreferredMenuAction() {}
};
runtime.publishInventoryMenuHooks(Object.assign({ windowRef: publishedWindow }, publishedHooks));
assert.strictEqual(publishedWindow.clearItemSwapLeftClickUI, publishedHooks.clearItemSwapLeftClickUI, "publishInventoryMenuHooks should publish swap cleanup");
assert.strictEqual(publishedWindow.appendSwapLeftClickControl, publishedHooks.appendSwapLeftClickControl, "publishInventoryMenuHooks should publish swap insertion");
assert.strictEqual(publishedWindow.getItemMenuPreferenceKey, publishedHooks.getItemMenuPreferenceKey, "publishInventoryMenuHooks should publish preference key lookup");
assert.strictEqual(publishedWindow.getPreferredMenuAction, publishedHooks.getPreferredMenuAction, "publishInventoryMenuHooks should publish preferred action lookup");

const menu = {
  classList: makeClassList(["hidden"]),
  offsetWidth: 160,
  offsetHeight: 120,
  style: {},
  listeners: {},
  querySelector(selector) {
    return selector === ".context-cancel" ? cancelRow : null;
  },
  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }
};
const insertedAfterCancel = [];
const cancelRow = {
  insertAdjacentElement(position, node) {
    insertedAfterCancel.push({ position, node });
    node.parentNode = {
      removeChild(child) {
        insertedAfterCancel.splice(insertedAfterCancel.findIndex((entry) => entry.node === child), 1);
      }
    };
  }
};
const optionRows = [];
const optionsList = {
  innerHTML: "old",
  appendChild(node) {
    optionRows.push(node);
  }
};
const bodyNodes = [];
const inventorySlots = [
  { getBoundingClientRect: () => ({ top: 300, width: 32, height: 32 }) }
];
const nodesById = {};
const documentRef = {
  getElementById(id) {
    if (nodesById[id]) return nodesById[id];
    if (id === "context-menu") return menu;
    if (id === "context-options-list") return optionsList;
    return null;
  },
  body: {
    appendChild(node) {
      bodyNodes.push(node);
      nodesById[node.id] = node;
      node.parentNode = {
        removeChild(child) {
          const idx = bodyNodes.indexOf(child);
          if (idx !== -1) bodyNodes.splice(idx, 1);
          delete nodesById[child.id];
        }
      };
    }
  },
  querySelectorAll(selector) {
    return selector === "#view-inv .inventory-slot" ? inventorySlots : [];
  },
  createElement(tagName) {
    const nodeClassList = makeClassList();
    return {
      tagName,
      id: "",
      className: "",
      classList: nodeClassList,
      innerHTML: "",
      textContent: "",
      onclick: null,
      style: {},
      offsetWidth: 120,
      offsetHeight: 90,
      listeners: {},
      children: [],
      parentNode: null,
      appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
      },
      addEventListener(name, callback) {
        this.listeners[name] = callback;
      },
      getBoundingClientRect() {
        return { left: 250, right: 310, top: 450 };
      }
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

const preferences = { "inventory:logs": "Drop" };
assert.strictEqual(
  runtime.getItemMenuPreferenceKey("inventory", "logs"),
  "inventory:logs",
  "getItemMenuPreferenceKey should build stable preference keys"
);
assert.strictEqual(
  runtime.getPreferredMenuAction("inventory:logs", ["Use", "Drop"], preferences),
  "Drop",
  "getPreferredMenuAction should honor stored preferences"
);
runtime.setPreferredMenuAction("inventory:logs", "Use", preferences);
assert.strictEqual(preferences["inventory:logs"], "Use", "setPreferredMenuAction should persist the chosen action");

let submenuClosed = 0;
let submenuSelected = "";
const swap = runtime.appendSwapLeftClickControl({
  documentRef,
  windowRef,
  contextMenuEl: menu,
  prefKey: "inventory:logs",
  actions: ["Use", "Drop"],
  currentLabel: "Drop",
  preferences,
  onSelect: (actionName) => { submenuSelected = actionName; },
  closeContextMenu: () => { submenuClosed += 1; }
});
assert.ok(swap && swap.trigger && swap.submenu, "appendSwapLeftClickControl should return created nodes");
assert.strictEqual(insertedAfterCancel.length, 1, "appendSwapLeftClickControl should insert the trigger after the cancel row");
assert.strictEqual(bodyNodes.length, 1, "appendSwapLeftClickControl should append the submenu to the document body");
assert.strictEqual(swap.submenu.children.length, 2, "appendSwapLeftClickControl should render one option per action");
swap.trigger.listeners.click({ preventDefault() {}, stopPropagation() {} });
assert.strictEqual(swap.submenu.style.left, "130px", "swap submenu positioning should flip left when near the viewport edge");
assert.strictEqual(swap.submenu.style.top, "402px", "swap submenu positioning should clamp to the viewport bottom");
swap.submenu.children[0].onclick({ preventDefault() {}, stopPropagation() {} });
assert.strictEqual(submenuSelected, "Use", "swap submenu option click should notify the caller");
assert.strictEqual(preferences["inventory:logs"], "Use", "swap submenu option click should store the preference");
assert.strictEqual(submenuClosed, 1, "swap submenu option click should close the context menu");

runtime.clearSwapLeftClickControl({ documentRef });
assert.strictEqual(bodyNodes.length, 0, "clearSwapLeftClickControl should remove the submenu");

console.log("Context menu runtime guard passed.");
