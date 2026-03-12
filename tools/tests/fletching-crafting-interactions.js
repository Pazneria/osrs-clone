const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadBrowserScript(root, relPath) {
  const abs = path.join(root, relPath);
  const code = fs.readFileSync(abs, "utf8");
  vm.runInThisContext(code, { filename: abs });
}

function createDomShim() {
  class MockClassList {
    constructor(el) {
      this.el = el;
    }

    _tokens() {
      return String(this.el.className || "")
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    _write(tokens) {
      this.el.className = tokens.join(" ");
    }

    add(...classes) {
      const set = new Set(this._tokens());
      classes.forEach((c) => {
        if (c) set.add(c);
      });
      this._write(Array.from(set));
    }

    remove(...classes) {
      const removeSet = new Set(classes.filter(Boolean));
      const next = this._tokens().filter((token) => !removeSet.has(token));
      this._write(next);
    }

    contains(cls) {
      return this._tokens().includes(cls);
    }
  }

  class MockElement {
    constructor(tagName, doc) {
      this.tagName = String(tagName || "div").toUpperCase();
      this.ownerDocument = doc;
      this.children = [];
      this.parentNode = null;
      this.id = "";
      this.className = "";
      this.textContent = "";
      this.innerText = "";
      this.style = {};
      this.attributes = {};
      this.onclick = null;
      this.type = "";
      this.disabled = false;
      this.title = "";
      this._innerHTML = "";
      this.classList = new MockClassList(this);
    }

    set innerHTML(value) {
      this.ownerDocument._unregisterSubtreeChildren(this);
      this.children = [];
      this._innerHTML = String(value || "");

      const idRegex = /id="([^"]+)"/g;
      let match = null;
      while ((match = idRegex.exec(this._innerHTML)) !== null) {
        const child = new MockElement("div", this.ownerDocument);
        child.id = match[1];
        this.appendChild(child);
      }
    }

    get innerHTML() {
      return this._innerHTML;
    }

    appendChild(child) {
      if (!child) return null;
      child.parentNode = this;
      this.children.push(child);
      this.ownerDocument._registerSubtree(child);
      return child;
    }

    addEventListener() {}

    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "id") {
        this.id = String(value);
        this.ownerDocument._registerSubtree(this);
      }
      if (name === "class") this.className = String(value);
    }

    querySelector(selector) {
      if (typeof selector !== "string") return null;
      if (selector.startsWith("#")) {
        return this.ownerDocument.getElementById(selector.slice(1));
      }
      return null;
    }

    closest(selector) {
      if (typeof selector === "string" && selector.startsWith("#") && this.id === selector.slice(1)) {
        return this;
      }
      return null;
    }
  }

  class MockDocument {
    constructor() {
      this._byId = Object.create(null);
      this.body = new MockElement("body", this);
      this._registerSubtree(this.body);
    }

    createElement(tagName) {
      return new MockElement(tagName, this);
    }

    getElementById(id) {
      return this._byId[id] || null;
    }

    addEventListener() {}

    _registerSubtree(node) {
      if (!node) return;
      if (node.id) this._byId[node.id] = node;
      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          this._registerSubtree(node.children[i]);
        }
      }
    }

    _unregisterSubtree(node) {
      if (!node) return;
      if (node.id && this._byId[node.id] === node) {
        delete this._byId[node.id];
      }
      if (Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          this._unregisterSubtree(node.children[i]);
        }
      }
    }

    _unregisterSubtreeChildren(node) {
      if (!node || !Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        this._unregisterSubtree(node.children[i]);
      }
    }
  }

  return new MockDocument();
}

function createSkillContext(options = {}) {
  const counts = Object.assign({}, options.counts || {});
  const messages = [];
  const xpBySkill = {};
  const canAccept = typeof options.canAcceptItemById === "function"
    ? options.canAcceptItemById
    : () => (options.canAccept !== false);

  const context = {
    targetObj: options.targetObj || "INVENTORY",
    sourceItemId: options.sourceItemId || null,
    targetUid: {
      sourceItemId: options.sourceItemId || null,
      targetItemId: options.targetItemId || null
    },
    recipeId: options.recipeId || null,
    quantityMode: options.quantityMode || null,
    quantityCount: Number.isFinite(options.quantityCount) ? options.quantityCount : null,
    currentTick: Number.isFinite(options.currentTick) ? options.currentTick : 0,
    playerState: {
      x: Number.isFinite(options.x) ? options.x : 0,
      y: Number.isFinite(options.y) ? options.y : 0,
      z: Number.isFinite(options.z) ? options.z : 0,
      action: options.action || null,
      skillSessions: {}
    },
    stopActionCount: 0,
    getRecipeSet: (skillId) => window.SkillSpecRegistry.getRecipeSet(skillId),
    getSkillSpec: (skillId) => window.SkillSpecRegistry.getSkillSpec(skillId),
    getInventoryCount: (itemId) => counts[itemId] || 0,
    removeItemsById: (itemId, amount) => {
      const available = counts[itemId] || 0;
      const removed = Math.min(available, amount);
      counts[itemId] = available - removed;
      return removed;
    },
    giveItemById: (itemId, amount) => {
      if (!canAccept(itemId, amount)) return 0;
      counts[itemId] = (counts[itemId] || 0) + amount;
      return amount;
    },
    canAcceptItemById: (itemId, amount) => canAccept(itemId, amount),
    getItemDataById: (itemId) => (window.ItemCatalog && window.ItemCatalog.ITEM_DEFS ? window.ItemCatalog.ITEM_DEFS[itemId] : null),
    hasItem: (itemId) => (counts[itemId] || 0) > 0,
    requireSkillLevel: (required, meta) => {
      const skillId = meta && meta.skillId ? meta.skillId : "";
      const levels = options.levels || {};
      const level = Number.isFinite(levels[skillId]) ? levels[skillId] : 99;
      return level >= required;
    },
    getSkillLevel: (skillId) => {
      const levels = options.levels || {};
      return Number.isFinite(levels[skillId]) ? levels[skillId] : 99;
    },
    addSkillXp: (skillId, amount) => {
      xpBySkill[skillId] = (xpBySkill[skillId] || 0) + amount;
    },
    renderInventory: () => {},
    addChatMessage: (message, tone) => {
      messages.push({ message, tone });
    },
    stopAction: () => {
      context.stopActionCount += 1;
      context.playerState.action = null;
    },
    promptAmount: () => false,
    _counts: counts,
    _messages: messages,
    _xpBySkill: xpBySkill
  };

  return context;
}

function expectMessage(context, expectedText, testName) {
  const hasMessage = context._messages.some((entry) => entry && entry.message === expectedText);
  assert(hasMessage, testName + ': expected message "' + expectedText + '"');
}

function run() {
  const root = path.resolve(__dirname, "..", "..");

  global.window = {};
  global.document = createDomShim();
  window.prompt = () => null;

  loadBrowserScript(root, "src/js/skills/specs.js");
  loadBrowserScript(root, "src/js/skills/spec-registry.js");
  loadBrowserScript(root, "src/js/skills/shared/action-resolution.js");
  loadBrowserScript(root, "src/js/content/item-catalog.js");

  global.SkillSpecRegistry = window.SkillSpecRegistry;
  global.SkillActionResolution = window.SkillActionResolution;
  loadBrowserScript(root, "src/js/skills/fletching/index.js");
  loadBrowserScript(root, "src/js/skills/crafting/index.js");

  const fletching = window.SkillModules && window.SkillModules.fletching;
  const crafting = window.SkillModules && window.SkillModules.crafting;
  assert(!!fletching, "fletching module missing");
  assert(!!crafting, "crafting module missing");

  const tests = [];
  function test(name, fn) {
    tests.push({ name, fn });
  }

  test("Fletching queues finished arrows on valid pair", () => {
    const starts = [];
    window.SkillRuntime = { tryStartSkillById: (_id, payload) => { starts.push(payload); return true; } };
    const ctx = createSkillContext({
      sourceItemId: "bronze_arrowheads",
      targetItemId: "wooden_headless_arrows",
      counts: { bronze_arrowheads: 1, wooden_headless_arrows: 1 }
    });
    const used = fletching.onUseItem(ctx);
    assert(used, "expected onUseItem true");
    assert(starts.length === 1, "expected one queued fletching start");
    assert(starts[0].recipeId === "fletch_bronze_arrows", "expected bronze arrows recipe");
    assert(starts[0].quantityMode === "all", "expected quantityMode all");
  });

  test("Fletching arrowhead/headless mismatch warns", () => {
    window.SkillRuntime = { tryStartSkillById: () => false };
    const ctx = createSkillContext({
      sourceItemId: "bronze_arrowheads",
      targetItemId: "mystic_headless_arrows",
      counts: { bronze_arrowheads: 1, mystic_headless_arrows: 1 }
    });
    const used = fletching.onUseItem(ctx);
    assert(used, "expected onUseItem true for recognized mismatch");
    expectMessage(ctx, "These don't match.", "arrow mismatch");
  });

  test("Fletching unknown bow string pair warns", () => {
    const ctx = createSkillContext({
      sourceItemId: "bow_string",
      targetItemId: "mystic_shortbow_u",
      counts: { bow_string: 1, mystic_shortbow_u: 1 }
    });
    const used = fletching.onUseItem(ctx);
    assert(used, "expected onUseItem true for bow-string mismatch");
    expectMessage(ctx, "You can't string that bow.", "bow-string mismatch");
  });

  test("Fletching unknown shaft+feather pair warns", () => {
    const ctx = createSkillContext({
      sourceItemId: "feathers_bundle",
      targetItemId: "mystic_shafts",
      counts: { feathers_bundle: 1, mystic_shafts: 1 }
    });
    const used = fletching.onUseItem(ctx);
    assert(used, "expected onUseItem true for feathers mismatch");
    expectMessage(ctx, "These don't match.", "feathers mismatch");
  });

  test("Fletching knife-on-log interaction opens recipe UI", () => {
    const starts = [];
    window.SkillRuntime = { tryStartSkillById: (_id, payload) => { starts.push(payload); return true; } };
    const ctx = createSkillContext({
      sourceItemId: "knife",
      targetItemId: "logs",
      counts: { knife: 1, logs: 2 }
    });

    const used = fletching.onUseItem(ctx);
    assert(used, "expected knife-on-log to be handled by fletching");
    assert(starts.length === 0, "knife-on-log should open selection UI, not queue immediately");
    const panel = document.getElementById("fletching-interface");
    assert(!!panel, "expected fletching interface panel to exist");
    assert(!panel.classList.contains("hidden"), "expected fletching interface to be visible");
  });

  test("Fletching onStart/onTick count mode crafts exact quantity", () => {
    const ctx = createSkillContext({
      recipeId: "fletch_bronze_arrows",
      quantityMode: "count",
      quantityCount: 2,
      counts: { bronze_arrowheads: 2, wooden_headless_arrows: 2 },
      currentTick: 100
    });

    const started = fletching.onStart(ctx);
    assert(started, "expected fletching onStart to succeed");
    assert(ctx.playerState.action === "SKILLING: FLETCHING", "expected fletching action state");

    fletching.onTick(ctx);
    assert((ctx._counts.bronze_arrows || 0) === 0, "should not craft before next tick");

    ctx.currentTick = 103;
    fletching.onTick(ctx);
    assert((ctx._counts.bronze_arrows || 0) === 1, "expected first craft at tick 103");
    assert(ctx.playerState.action === "SKILLING: FLETCHING", "expected action to continue after first craft");

    ctx.currentTick = 106;
    fletching.onTick(ctx);
    assert((ctx._counts.bronze_arrows || 0) === 2, "expected second craft at tick 106");
    assert(ctx.playerState.action === null, "expected action to stop after requested quantity");
    assert((ctx._xpBySkill.fletching || 0) === 4, "expected 2 XP per craft for bronze arrows");
  });

  test("Fletching all-mode stops when inputs are exhausted", () => {
    const ctx = createSkillContext({
      recipeId: "fletch_bronze_arrows",
      quantityMode: "all",
      counts: { bronze_arrowheads: 1, wooden_headless_arrows: 1 },
      currentTick: 200
    });

    assert(fletching.onStart(ctx), "expected onStart success");
    ctx.currentTick = 203;
    fletching.onTick(ctx);

    assert((ctx._counts.bronze_arrows || 0) === 1, "expected one crafted output");
    assert((ctx._counts.bronze_arrowheads || 0) === 0, "expected arrowhead input consumed");
    assert((ctx._counts.wooden_headless_arrows || 0) === 0, "expected headless input consumed");
    assert(ctx.playerState.action === null, "expected action to stop once materials are exhausted");
  });

  test("Fletching onStart blocks when tool is missing", () => {
    const ctx = createSkillContext({
      recipeId: "fletch_wooden_handle",
      quantityMode: "all",
      counts: { logs: 1 },
      currentTick: 250
    });

    const started = fletching.onStart(ctx);
    assert(!started, "expected onStart failure without knife");
    expectMessage(ctx, "You need the required fletching tool.", "missing tool");
  });

  test("Fletching session stops if required tool disappears", () => {
    const ctx = createSkillContext({
      recipeId: "fletch_wooden_handle",
      quantityMode: "all",
      counts: { logs: 2, knife: 1 },
      currentTick: 300
    });

    assert(fletching.onStart(ctx), "expected onStart success with knife");
    ctx._counts.knife = 0;
    ctx.currentTick = 303;
    fletching.onTick(ctx);

    assert(ctx.playerState.action === null, "expected action stop when tool disappears");
    expectMessage(ctx, "You need the required fletching tool.", "tool disappeared");
  });

  test("Fletching onStart blocks when level is too low", () => {
    const ctx = createSkillContext({
      recipeId: "fletch_yew_handle",
      quantityMode: "all",
      counts: { yew_logs: 1, knife: 1 },
      levels: { fletching: 1 },
      currentTick: 350
    });

    const started = fletching.onStart(ctx);
    assert(!started, "expected level gate to block yew handle recipe");
  });

  test("Crafting creates strapped handle from base handle and leather", () => {
    const ctx = createSkillContext({
      sourceItemId: "wooden_handle",
      targetItemId: "normal_leather",
      counts: { wooden_handle: 1, normal_leather: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected crafting interaction handled");
    assert((ctx._counts.wooden_handle_strapped || 0) === 1, "expected strapped handle output");
    assert((ctx._counts.wooden_handle || 0) === 0, "expected base handle consumed");
    assert((ctx._counts.normal_leather || 0) === 0, "expected leather consumed");
    assert((ctx._xpBySkill.crafting || 0) === 2, "expected strapped-handle xp grant");
  });

  test("Crafting assembles weapon from metal part and strapped handle", () => {
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "wooden_handle_strapped",
      counts: { bronze_axe_head: 1, wooden_handle_strapped: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected crafting interaction handled");
    assert((ctx._counts.bronze_axe || 0) === 1, "expected bronze axe output");
    assert((ctx._counts.bronze_axe_head || 0) === 0, "expected metal part consumed");
    assert((ctx._counts.wooden_handle_strapped || 0) === 0, "expected strapped handle consumed");
  });

  test("Crafting blocks metal part with base handle and explains dependency", () => {
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "wooden_handle",
      counts: { bronze_axe_head: 1, wooden_handle: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected recognized blocked interaction");
    assert((ctx._counts.bronze_axe || 0) === 0, "should not craft output");
    expectMessage(ctx, "You need a strapped handle for that.", "metal+base handle");
  });

  test("Crafting blocks metal part with logs and explains dependency", () => {
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "logs",
      counts: { bronze_axe_head: 1, logs: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected recognized blocked interaction");
    expectMessage(ctx, "You need a strapped handle for that.", "metal+logs");
  });

  test("Crafting mismatched strapped handle combination warns", () => {
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "oak_handle_strapped",
      counts: { bronze_axe_head: 1, oak_handle_strapped: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected recognized mismatch interaction");
    expectMessage(ctx, "These don't match.", "metal+wrong strapped handle");
  });

  test("Crafting blocks when output capacity check fails", () => {
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "wooden_handle_strapped",
      counts: { bronze_axe_head: 1, wooden_handle_strapped: 1 },
      canAccept: false
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected recognized interaction despite output block");
    assert((ctx._counts.bronze_axe || 0) === 0, "should not craft without output capacity");
    expectMessage(ctx, "You have no inventory space for that crafted output.", "output block");
  });

  test("Crafting respects level requirement on immediate assembly", () => {
    const ctx = createSkillContext({
      sourceItemId: "rune_axe_head",
      targetItemId: "yew_handle_strapped",
      counts: { rune_axe_head: 1, yew_handle_strapped: 1 },
      levels: { crafting: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected recognized interaction");
    assert((ctx._counts.rune_axe || 0) === 0, "should not craft when level requirement fails");
    assert((ctx._xpBySkill.crafting || 0) === 0, "should not grant xp on blocked craft");
  });

  test("Crafting returns false for unrelated inventory pairs", () => {
    const ctx = createSkillContext({
      sourceItemId: "logs",
      targetItemId: "oak_logs",
      counts: { logs: 1, oak_logs: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(!used, "expected unrelated pair to be ignored");
  });

  test("Fletching ignores non-inventory targets", () => {
    const ctx = createSkillContext({
      targetObj: "FIRE",
      sourceItemId: "bronze_arrowheads",
      targetItemId: "wooden_headless_arrows",
      counts: { bronze_arrowheads: 1, wooden_headless_arrows: 1 }
    });
    const used = fletching.onUseItem(ctx);
    assert(!used, "expected non-inventory target to be ignored");
  });

  test("Crafting ignores non-inventory targets", () => {
    const ctx = createSkillContext({
      targetObj: "FIRE",
      sourceItemId: "wooden_handle",
      targetItemId: "normal_leather",
      counts: { wooden_handle: 1, normal_leather: 1 }
    });
    const used = crafting.onUseItem(ctx);
    assert(!used, "expected non-inventory target to be ignored");
  });

  let passed = 0;
  const failures = [];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    try {
      t.fn();
      passed += 1;
      console.log("[PASS] " + t.name);
    } catch (error) {
      failures.push({ name: t.name, error: error && error.message ? error.message : String(error) });
      console.error("[FAIL] " + t.name + " -> " + (error && error.message ? error.message : error));
    }
  }

  if (failures.length > 0) {
    console.error("\nFletching/Crafting QA failures: " + failures.length + " of " + tests.length);
    failures.forEach((f) => console.error(" - " + f.name + ": " + f.error));
    process.exit(1);
  }

  console.log("\nFletching/Crafting interaction QA passed: " + passed + " tests.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
