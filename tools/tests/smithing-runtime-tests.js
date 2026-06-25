const assert = require("assert");
const path = require("path");
const { makeClassNameList } = require("./dom-test-utils");
const { loadBrowserScript, loadSkillSpecScripts } = require("./browser-script-test-utils");
const { expectMessageContaining } = require("./message-test-utils");
const { readRepoFile } = require("./repo-file-test-utils");
const { getFunctionBody } = require("./source-block-utils");

function createFakeElement(tagName, register) {
  const element = {
    tagName,
    type: "",
    className: "",
    children: [],
    parentNode: null,
    onclick: null,
    style: {},
    _id: "",
    _innerHTML: "",
    _textContent: "",
    set id(value) {
      this._id = String(value || "");
      if (this._id) register(this._id, this);
    },
    get id() {
      return this._id;
    },
    set innerHTML(value) {
      this._innerHTML = String(value || "");
      this.children = [];
      const idPattern = /<([a-zA-Z0-9-]+)[^>]*\sid="([^"]+)"/g;
      let match;
      while ((match = idPattern.exec(this._innerHTML)) !== null) {
        const child = createFakeElement(match[1], register);
        child.id = match[2];
        this.appendChild(child);
      }
    },
    get innerHTML() {
      return this._innerHTML;
    },
    set textContent(value) {
      this._textContent = String(value || "");
    },
    get textContent() {
      const ownText = `${this._textContent || ""} ${stripHtml(this._innerHTML || "")}`;
      return this.children.reduce((text, child) => `${text} ${child.textContent}`, ownText);
    },
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      if (child.id) register(child.id, child);
      return child;
    },
    addEventListener(name, callback) {
      this[`on${name}`] = callback;
    },
    querySelector(selector) {
      if (typeof selector !== "string" || !selector.startsWith("#")) return null;
      const targetId = selector.slice(1);
      return findById(this, targetId);
    },
    closest(selector) {
      if (typeof selector !== "string" || !selector.startsWith("#")) return null;
      const targetId = selector.slice(1);
      let current = this;
      while (current) {
        if (current.id === targetId) return current;
        current = current.parentNode;
      }
      return null;
    }
  };
  element.classList = makeClassNameList(element);
  return element;
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ");
}

function findById(element, targetId) {
  if (!element) return null;
  if (element.id === targetId) return element;
  for (let i = 0; i < element.children.length; i++) {
    const found = findById(element.children[i], targetId);
    if (found) return found;
  }
  return null;
}

function createFakeDocument() {
  const elementsById = new Map();
  const register = (id, element) => elementsById.set(id, element);
  const body = createFakeElement("body", register);
  const uiLayer = createFakeElement("div", register);
  uiLayer.id = "ui-layer";
  body.appendChild(uiLayer);
  return {
    body,
    createElement(tagName) {
      return createFakeElement(tagName, register);
    },
    getElementById(id) {
      return elementsById.get(id) || null;
    },
    addEventListener() {}
  };
}

function createSmithingContext(options = {}) {
  const counts = Object.assign({}, options.counts || {});
  const messages = [];
  const level = Number.isFinite(options.level) ? options.level : 99;
  const inventorySlots = Array.isArray(options.inventorySlots)
    ? options.inventorySlots.map((slot) => slot ? Object.assign({}, slot) : null)
    : null;
  const canAcceptItemById = typeof options.canAcceptItemById === "function"
    ? options.canAcceptItemById
    : () => true;

  const context = {
    targetObj: options.targetObj || "FURNACE",
    targetX: 10,
    targetY: 12,
    targetZ: 0,
    currentTick: 100,
    recipeId: options.recipeId || null,
    quantityMode: options.quantityMode || "all",
    playerState: {
      action: null,
      x: 10,
      y: 12,
      z: 0,
      skillSessions: {}
    },
    getRecipeSet: (skillId) => window.SkillSpecRegistry.getRecipeSet(skillId),
    getSkillSpec: (skillId) => window.SkillSpecRegistry.getSkillSpec(skillId),
    getSkillLevel: () => level,
    requireSkillLevel(requiredLevel, meta = {}) {
      if (level >= requiredLevel) return true;
      const action = typeof meta.action === "string" && meta.action ? meta.action : "smith that";
      messages.push({ message: `You need Smithing level ${requiredLevel} to ${action}.`, tone: meta.tone || "warn" });
      return false;
    },
    getInventoryCount: (itemId) => counts[itemId] || 0,
    hasItem: (itemId) => (counts[itemId] || 0) > 0,
    hasUnlockFlag: () => true,
    canAcceptItemById,
    getInventorySlotsSnapshot() {
      if (!inventorySlots) return null;
      return inventorySlots.map((slot) => slot ? Object.assign({}, slot) : null);
    },
    removeItemsById(itemId, amount) {
      const requested = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
      let remaining = requested;
      if (inventorySlots) {
        for (let i = 0; i < inventorySlots.length && remaining > 0; i++) {
          const slot = inventorySlots[i];
          if (!slot || slot.itemId !== itemId) continue;
          const taken = Math.min(slot.amount, remaining);
          slot.amount -= taken;
          remaining -= taken;
          if (slot.amount <= 0) inventorySlots[i] = null;
        }
      } else {
        const available = counts[itemId] || 0;
        remaining = Math.max(0, requested - available);
      }
      const removed = requested - remaining;
      counts[itemId] = Math.max(0, (counts[itemId] || 0) - removed);
      return removed;
    },
    giveItemById(itemId, amount) {
      const requested = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
      if (inventorySlots) {
        const itemData = context.getItemDataById(itemId);
        if (itemData && itemData.stackable) {
          const existing = inventorySlots.find((slot) => slot && slot.itemId === itemId);
          if (existing) {
            existing.amount += requested;
            counts[itemId] = (counts[itemId] || 0) + requested;
            return requested;
          }
        }
        let remaining = requested;
        for (let i = 0; i < inventorySlots.length && remaining > 0; i++) {
          if (inventorySlots[i]) continue;
          inventorySlots[i] = { itemId, amount: 1, stackable: !!(itemData && itemData.stackable) };
          remaining--;
        }
        const given = requested - remaining;
        counts[itemId] = (counts[itemId] || 0) + given;
        return given;
      }
      counts[itemId] = (counts[itemId] || 0) + requested;
      return requested;
    },
    addSkillXp(skillId, amount) {
      context._xp.push({ skillId, amount });
    },
    addChatMessage(message, tone) {
      messages.push({ message, tone });
    },
    startSkillingAction() {
      context._started = true;
      context.playerState.action = `SKILLING: ${context.targetObj}`;
    },
    stopAction() {
      context._stopped = true;
      context.playerState.action = null;
    },
    renderInventory() {
      context._renderedInventory = true;
    },
    getItemDataById(itemId) {
      const names = {
        copper_ore: "Copper Ore",
        tin_ore: "Tin Ore",
        bronze_bar: "Bronze Bar",
        iron_ore: "Iron Ore",
        iron_bar: "Iron Bar",
        hammer: "Hammer",
        bronze_arrowheads: "Bronze Arrowheads",
        bronze_sword_blade: "Bronze Sword Blade",
        junk: "Junk"
      };
      return names[itemId] ? { name: names[itemId], stackable: itemId === "bronze_arrowheads" } : null;
    }
  };

  context._counts = counts;
  context._inventorySlots = inventorySlots;
  context._messages = messages;
  context._started = false;
  context._stopped = false;
  context._renderedInventory = false;
  context._xp = [];
  return context;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const smithingSource = readRepoFile(root, "src/js/skills/smithing/index.js");
  const issueBody = getFunctionBody(smithingSource, "getRecipeIssues");
  const validateStartBody = getFunctionBody(smithingSource, "validateRecipeStart");
  const validateRuntimeBody = getFunctionBody(smithingSource, "validateRecipeRuntime");

  assert(issueBody, "smithing menu issue helper should exist");
  assert(!issueBody.includes("hasOutputCapacity"), "smithing menu issue rows should not check output capacity");
  assert(!issueBody.includes("buildOutputCapacityMessage"), "smithing menu issue rows should not show output-capacity copy");
  assert(validateStartBody.includes("hasOutputCapacity(context, recipe)"), "smithing starts should still block when output capacity is missing");
  assert(validateStartBody.includes("buildOutputCapacityMessage(context, recipe)"), "smithing starts should still explain missing output capacity");
  assert(validateRuntimeBody.includes("hasOutputCapacity(context, recipe)"), "active smithing should still stop when output capacity disappears");

  global.window = {};
  global.document = createFakeDocument();
  global.queueAction = () => {};
  loadSkillSpecScripts(root);
  loadBrowserScript(root, "src/js/skills/spec-registry.js");
  loadBrowserScript(root, "src/js/skills/shared/action-resolution.js");
  global.SkillSpecRegistry = window.SkillSpecRegistry;
  global.SkillActionResolution = window.SkillActionResolution;
  loadBrowserScript(root, "src/js/skills/smithing/index.js");

  const smithing = window.SkillModules && window.SkillModules.smithing;
  assert(!!smithing, "smithing module missing");

  const menuCtx = createSmithingContext({
    counts: { copper_ore: 1, tin_ore: 1 },
    canAcceptItemById: () => false
  });
  const menu = smithing.getContextMenu(menuCtx);
  assert(Array.isArray(menu) && menu.length > 0, "smithing context menu should expose the open action");
  menu[0].onSelect();

  const panel = document.getElementById("smithing-interface");
  assert(panel, "smithing menu panel should be created");
  assert(!panel.classList.contains("hidden"), "smithing menu panel should be visible after open");
  assert(panel.textContent.includes("Bronze Bar"), "smithing menu should render available bronze-bar recipes");
  assert(!/output space|inventory space/i.test(panel.textContent), "smithing menu should omit output-capacity issue text");

  const startCtx = createSmithingContext({
    counts: { iron_ore: 1 },
    recipeId: "smelt_iron_bar",
    canAcceptItemById: () => false
  });
  assert(!smithing.onStart(startCtx), "smithing should not start when no output space is available");
  assert(!startCtx._started, "blocked smithing should not enter a skilling action");
  expectMessageContaining(startCtx, "inventory space", "smithing output capacity start gate");

  const runtimeCtx = createSmithingContext({
    counts: { iron_ore: 1 },
    canAcceptItemById: () => false
  });
  runtimeCtx.playerState.action = "SKILLING: FURNACE";
  SkillActionResolution.startProcessingSession(runtimeCtx, "smithing", {
    recipeId: "smelt_iron_bar",
    stationType: "FURNACE",
    target: { x: 10, y: 12, z: 0 },
    intervalTicks: 3,
    nextTick: 100
  });
  smithing.onTick(runtimeCtx);
  assert(runtimeCtx._stopped, "active smithing should stop when output capacity disappears");
  assert(!runtimeCtx.playerState.skillSessions.smithing, "active smithing should clear the processing session when inventory fills");
  assert(runtimeCtx._renderedInventory, "active smithing should refresh inventory after runtime capacity failure");
  expectMessageContaining(runtimeCtx, "inventory space", "smithing output capacity runtime gate");

  const fullButFreedStartCtx = createSmithingContext({
    counts: { iron_ore: 1, junk: 1 },
    recipeId: "smelt_iron_bar",
    canAcceptItemById: () => false,
    inventorySlots: [
      { itemId: "iron_ore", amount: 1, stackable: false },
      { itemId: "junk", amount: 1, stackable: false }
    ]
  });
  assert(smithing.onStart(fullButFreedStartCtx), "smithing should start in a full inventory when consumed inputs free the output slot");
  assert(fullButFreedStartCtx._started, "full-but-freed smithing should enter a skilling action");
  assert(!fullButFreedStartCtx._messages.some((entry) => /inventory space/i.test(entry.message)), "full-but-freed smithing start should not show inventory-space copy");

  const fullButFreedAnvilStartCtx = createSmithingContext({
    targetObj: "ANVIL",
    counts: { bronze_bar: 2, hammer: 1, junk: 1 },
    recipeId: "forge_bronze_sword_blade",
    canAcceptItemById: () => false,
    inventorySlots: [
      { itemId: "bronze_bar", amount: 2, stackable: false },
      { itemId: "hammer", amount: 1, stackable: false },
      { itemId: "junk", amount: 1, stackable: false }
    ]
  });
  assert(smithing.onStart(fullButFreedAnvilStartCtx), "anvil smithing should start in a full inventory when consumed bars free the output slot");
  assert(fullButFreedAnvilStartCtx._started, "full-but-freed anvil smithing should enter a skilling action");
  assert(!fullButFreedAnvilStartCtx._messages.some((entry) => /inventory space/i.test(entry.message)), "full-but-freed anvil start should not show inventory-space copy");

  const fullWithOutputStackCtx = createSmithingContext({
    targetObj: "ANVIL",
    counts: { bronze_bar: 2, hammer: 1, bronze_arrowheads: 5, junk: 1 },
    recipeId: "forge_bronze_arrowheads",
    canAcceptItemById: () => false,
    inventorySlots: [
      { itemId: "bronze_bar", amount: 2, stackable: false },
      { itemId: "hammer", amount: 1, stackable: false },
      { itemId: "bronze_arrowheads", amount: 5, stackable: true },
      { itemId: "junk", amount: 1, stackable: false }
    ]
  });
  assert(smithing.onStart(fullWithOutputStackCtx), "stackable smithing output should start in a full inventory when an output stack already exists");
  assert(fullWithOutputStackCtx._started, "stackable output smithing should enter a skilling action");
  assert(!fullWithOutputStackCtx._messages.some((entry) => /inventory space/i.test(entry.message)), "stackable output start should not show inventory-space copy");

  const fullWithoutOutputStackCtx = createSmithingContext({
    targetObj: "ANVIL",
    counts: { bronze_bar: 2, hammer: 1, junk: 1, second_junk: 1 },
    recipeId: "forge_bronze_arrowheads",
    canAcceptItemById: () => false,
    inventorySlots: [
      { itemId: "bronze_bar", amount: 2, stackable: false },
      { itemId: "hammer", amount: 1, stackable: false },
      { itemId: "junk", amount: 1, stackable: false },
      { itemId: "second_junk", amount: 1, stackable: false }
    ]
  });
  assert(!smithing.onStart(fullWithoutOutputStackCtx), "stackable smithing output should not start in a full inventory without an output stack or freed slot");
  assert(!fullWithoutOutputStackCtx._started, "blocked stackable output smithing should not enter a skilling action");
  expectMessageContaining(fullWithoutOutputStackCtx, "inventory space", "stackable smithing output capacity start gate");

  const fullButFreedRuntimeCtx = createSmithingContext({
    targetObj: "ANVIL",
    counts: { bronze_bar: 2, hammer: 1, junk: 1 },
    canAcceptItemById: () => false,
    inventorySlots: [
      { itemId: "bronze_bar", amount: 2, stackable: false },
      { itemId: "hammer", amount: 1, stackable: false },
      { itemId: "junk", amount: 1, stackable: false }
    ]
  });
  fullButFreedRuntimeCtx.playerState.action = "SKILLING: ANVIL";
  SkillActionResolution.startProcessingSession(fullButFreedRuntimeCtx, "smithing", {
    recipeId: "forge_bronze_sword_blade",
    stationType: "ANVIL",
    target: { x: 10, y: 12, z: 0 },
    intervalTicks: 3,
    nextTick: 100
  });
  smithing.onTick(fullButFreedRuntimeCtx);
  assert(fullButFreedRuntimeCtx._stopped, "active anvil smithing should stop after crafting when no bars remain");
  assert.strictEqual(fullButFreedRuntimeCtx._counts.bronze_bar, 0, "active anvil smithing should consume bars before granting output");
  assert.strictEqual(fullButFreedRuntimeCtx._counts.bronze_sword_blade, 1, "active anvil smithing should grant output into the freed slot");
  assert(fullButFreedRuntimeCtx._renderedInventory, "active anvil smithing should refresh inventory after successful craft");
  assert(fullButFreedRuntimeCtx._xp.some((entry) => entry.skillId === "smithing" && entry.amount > 0), "active anvil smithing should award XP after successful craft");
  assert(!fullButFreedRuntimeCtx._messages.some((entry) => /inventory space/i.test(entry.message)), "full-but-freed runtime smithing should not show inventory-space copy");

  const fullButFreedSmeltingRuntimeCtx = createSmithingContext({
    counts: { iron_ore: 1, junk: 1 },
    canAcceptItemById: () => false,
    inventorySlots: [
      { itemId: "iron_ore", amount: 1, stackable: false },
      { itemId: "junk", amount: 1, stackable: false }
    ]
  });
  fullButFreedSmeltingRuntimeCtx.playerState.action = "SKILLING: FURNACE";
  SkillActionResolution.startProcessingSession(fullButFreedSmeltingRuntimeCtx, "smithing", {
    recipeId: "smelt_iron_bar",
    stationType: "FURNACE",
    target: { x: 10, y: 12, z: 0 },
    intervalTicks: 3,
    nextTick: 100
  });
  smithing.onTick(fullButFreedSmeltingRuntimeCtx);
  assert(fullButFreedSmeltingRuntimeCtx._stopped, "active furnace smithing should stop after smelting when no ore remains");
  assert.strictEqual(fullButFreedSmeltingRuntimeCtx._counts.iron_ore, 0, "active furnace smithing should consume ore before granting output");
  assert.strictEqual(fullButFreedSmeltingRuntimeCtx._counts.iron_bar, 1, "active furnace smithing should grant output into the freed slot");
  assert(fullButFreedSmeltingRuntimeCtx._renderedInventory, "active furnace smithing should refresh inventory after successful smelt");
  assert(fullButFreedSmeltingRuntimeCtx._xp.some((entry) => entry.skillId === "smithing" && entry.amount > 0), "active furnace smithing should award XP after successful smelt");
  assert(!fullButFreedSmeltingRuntimeCtx._messages.some((entry) => /inventory space/i.test(entry.message)), "full-but-freed runtime smelting should not show inventory-space copy");

  console.log("Smithing runtime QA passed.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
