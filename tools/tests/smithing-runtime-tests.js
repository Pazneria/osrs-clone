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
    addChatMessage(message, tone) {
      messages.push({ message, tone });
    },
    startSkillingAction() {
      context._started = true;
      context.playerState.action = "SKILLING: FURNACE";
    },
    getItemDataById(itemId) {
      const names = {
        copper_ore: "Copper Ore",
        tin_ore: "Tin Ore",
        bronze_bar: "Bronze Bar",
        iron_ore: "Iron Ore",
        iron_bar: "Iron Bar"
      };
      return names[itemId] ? { name: names[itemId] } : null;
    }
  };

  context._counts = counts;
  context._messages = messages;
  context._started = false;
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
  global.SkillSpecRegistry = window.SkillSpecRegistry;
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

  console.log("Smithing runtime QA passed.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
