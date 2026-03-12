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
  const customGive = typeof options.giveItemById === "function" ? options.giveItemById : null;

  const context = {
    targetObj: options.targetObj || "INVENTORY",
    sourceItemId: options.sourceItemId || null,
    targetUid: {
      sourceItemId: options.sourceItemId || null,
      targetItemId: options.targetItemId || null
    },
    targetX: Number.isFinite(options.targetX) ? options.targetX : (Number.isFinite(options.x) ? options.x : 0),
    targetY: Number.isFinite(options.targetY) ? options.targetY : (Number.isFinite(options.y) ? options.y : 0),
    targetZ: Number.isFinite(options.targetZ) ? options.targetZ : (Number.isFinite(options.z) ? options.z : 0),
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
      if (customGive) return customGive(itemId, amount, counts);
      if (!canAccept(itemId, amount)) return 0;
      counts[itemId] = (counts[itemId] || 0) + amount;
      return amount;
    },
    canAcceptItemById: (itemId, amount) => canAccept(itemId, amount),
    getItemDataById: (itemId) => (window.ItemCatalog && window.ItemCatalog.ITEM_DEFS ? window.ItemCatalog.ITEM_DEFS[itemId] : null),
    hasItem: (itemId) => (counts[itemId] || 0) > 0,
    hasUnlockFlag: (flagId) => {
      const unlockFlags = options.unlockFlags || {};
      return !!unlockFlags[flagId];
    },
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
    startSkillingAction: () => {
      context.playerState.action = context.targetObj === "FURNACE" ? "SKILLING: FURNACE" : (context.targetObj === "ANVIL" ? "SKILLING: ANVIL" : "SKILLING: UNKNOWN");
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
  loadBrowserScript(root, "src/js/skills/smithing/index.js");

  const fletching = window.SkillModules && window.SkillModules.fletching;
  const smithing = window.SkillModules && window.SkillModules.smithing;
  const crafting = window.SkillModules && window.SkillModules.crafting;
  assert(!!fletching, "fletching module missing");
  assert(!!crafting, "crafting module missing");
  assert(!!smithing, "smithing module missing");

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
    assert((ctx._counts.bronze_axe_head || 0) === 1, "materials should remain when output capacity pre-check fails");
    assert((ctx._counts.wooden_handle_strapped || 0) === 1, "handle should remain when output capacity pre-check fails");
    expectMessage(ctx, "You have no inventory space for that crafted output.", "output block");
  });

  test("Crafting immediate craft restores inputs when output grant fails", () => {
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "wooden_handle_strapped",
      counts: { bronze_axe_head: 1, wooden_handle_strapped: 1 },
      canAccept: true,
      giveItemById: (itemId, amount, counts) => {
        if (itemId === "bronze_axe") return 0;
        counts[itemId] = (counts[itemId] || 0) + amount;
        return amount;
      }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected recognized interaction even when output grant fails");
    assert((ctx._counts.bronze_axe || 0) === 0, "should not retain crafted output when grant fails");
    assert((ctx._counts.bronze_axe_head || 0) === 1, "metal part should be restored after failed output grant");
    assert((ctx._counts.wooden_handle_strapped || 0) === 1, "strapped handle should be restored after failed output grant");
    expectMessage(ctx, "You have no inventory space for that crafted output.", "immediate rollback");
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

  test("Crafting queues gem cutting on chisel+uncut pair", () => {
    const starts = [];
    window.SkillRuntime = {
      tryStartSkillById: (skillId, payload) => {
        starts.push({ skillId, payload });
        return true;
      }
    };

    const ctx = createSkillContext({
      sourceItemId: "chisel",
      targetItemId: "uncut_sapphire",
      counts: { chisel: 1, uncut_sapphire: 2 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected crafting to handle chisel+uncut gem pair");
    assert(starts.length === 1, "expected queued crafting start for gem cutting");
    assert(starts[0].skillId === "crafting", "expected crafting skill queue target");
    assert(starts[0].payload.recipeId === "cut_sapphire", "expected cut_sapphire recipe");
    assert(starts[0].payload.quantityMode === "all", "expected default all quantity mode");
  });

  test("Crafting queues staff attachment on matching staff+gem pair", () => {
    const starts = [];
    window.SkillRuntime = {
      tryStartSkillById: (skillId, payload) => {
        starts.push({ skillId, payload });
        return true;
      }
    };

    const ctx = createSkillContext({
      sourceItemId: "plain_staff_willow",
      targetItemId: "cut_sapphire",
      counts: { plain_staff_willow: 1, cut_sapphire: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected crafting to handle staff+gem pair");
    assert(starts.length === 1, "expected queued crafting start for staff attachment");
    assert(starts[0].payload.recipeId === "craft_water_staff", "expected water staff attachment recipe");
  });

  test("Crafting blocks plain wood staff gem attempts", () => {
    const ctx = createSkillContext({
      sourceItemId: "plain_staff_wood",
      targetItemId: "cut_ruby",
      counts: { plain_staff_wood: 1, cut_ruby: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected wood staff + gem pair to be recognized as invalid crafting");
    assert((ctx._counts.plain_staff_wood || 0) === 1, "plain wood staff should remain on invalid pair");
    assert((ctx._counts.cut_ruby || 0) === 1, "gem should remain on invalid pair");
    expectMessage(ctx, "These don't match.", "wood staff mismatch");
  });

  test("Crafting onStart/onTick count mode crafts exact quantity", () => {
    const ctx = createSkillContext({
      recipeId: "cut_sapphire",
      quantityMode: "count",
      quantityCount: 2,
      counts: { chisel: 1, uncut_sapphire: 2 },
      currentTick: 400
    });

    const started = crafting.onStart(ctx);
    assert(started, "expected crafting onStart to succeed");
    assert(ctx.playerState.action === "SKILLING: CRAFTING", "expected crafting action state");

    crafting.onTick(ctx);
    assert((ctx._counts.cut_sapphire || 0) === 0, "should not craft before next tick");

    ctx.currentTick = 403;
    crafting.onTick(ctx);
    assert((ctx._counts.cut_sapphire || 0) === 1, "expected first gem cut at tick 403");
    assert(ctx.playerState.action === "SKILLING: CRAFTING", "expected action to continue after first craft");

    ctx.currentTick = 406;
    crafting.onTick(ctx);
    assert((ctx._counts.cut_sapphire || 0) === 2, "expected second gem cut at tick 406");
    assert((ctx._counts.uncut_sapphire || 0) === 0, "expected uncut gem inputs consumed");
    assert((ctx._counts.chisel || 0) === 1, "expected chisel tool to persist");
    assert((ctx._xpBySkill.crafting || 0) === 16, "expected 8 XP per cut_sapphire craft");
    assert(ctx.playerState.action === null, "expected action to stop after requested quantity");
  });

  test("Crafting all-mode stops when inputs are exhausted", () => {
    const ctx = createSkillContext({
      recipeId: "craft_water_staff",
      quantityMode: "all",
      counts: { plain_staff_willow: 1, cut_sapphire: 1 },
      currentTick: 500
    });

    assert(crafting.onStart(ctx), "expected crafting onStart success");
    ctx.currentTick = 503;
    crafting.onTick(ctx);

    assert((ctx._counts.water_staff || 0) === 1, "expected crafted water staff output");
    assert((ctx._counts.plain_staff_willow || 0) === 0, "expected staff input consumed");
    assert((ctx._counts.cut_sapphire || 0) === 0, "expected gem input consumed");
    assert(ctx.playerState.action === null, "expected action to stop after materials are exhausted");
  });

  test("Crafting queued craft restores inputs when output grant fails", () => {
    const ctx = createSkillContext({
      recipeId: "cut_sapphire",
      quantityMode: "all",
      counts: { chisel: 1, uncut_sapphire: 1 },
      canAccept: true,
      giveItemById: (itemId, amount, counts) => {
        if (itemId === "cut_sapphire") return 0;
        counts[itemId] = (counts[itemId] || 0) + amount;
        return amount;
      },
      currentTick: 540
    });

    assert(crafting.onStart(ctx), "expected onStart success before simulated output failure");
    ctx.currentTick = 543;
    crafting.onTick(ctx);

    assert((ctx._counts.cut_sapphire || 0) === 0, "should not keep crafted output when grant fails");
    assert((ctx._counts.uncut_sapphire || 0) === 1, "input should be restored after failed queued output grant");
    assert((ctx._counts.chisel || 0) === 1, "tool should remain after failed queued output grant");
    assert(ctx.playerState.action === null, "queued crafting should stop after output grant failure");
    expectMessage(ctx, "You have no inventory space for that crafted output.", "queued rollback");
  });

  test("Crafting onStart blocks when required tool is missing", () => {
    const ctx = createSkillContext({
      recipeId: "cut_emerald",
      quantityMode: "all",
      counts: { uncut_emerald: 1 },
      currentTick: 550
    });

    const started = crafting.onStart(ctx);
    assert(!started, "expected onStart failure without required crafting tool");
    expectMessage(ctx, "You need the required crafting tool.", "crafting missing tool");
  });

  test("Crafting session stops when required tool disappears", () => {
    const ctx = createSkillContext({
      recipeId: "cut_sapphire",
      quantityMode: "all",
      counts: { chisel: 1, uncut_sapphire: 2 },
      currentTick: 600
    });

    assert(crafting.onStart(ctx), "expected onStart success with chisel");
    ctx._counts.chisel = 0;
    ctx.currentTick = 603;
    crafting.onTick(ctx);

    assert(ctx.playerState.action === null, "expected crafting action stop when tool disappears");
    expectMessage(ctx, "You need the required crafting tool.", "crafting tool disappeared");
  });

  test("Crafting supports full smithing-part assembly matrix across tiers", () => {
    const tiers = [
      { tier: "bronze", handle: "wooden_handle_strapped", level: 1 },
      { tier: "iron", handle: "wooden_handle_strapped", level: 1 },
      { tier: "steel", handle: "oak_handle_strapped", level: 10 },
      { tier: "mithril", handle: "willow_handle_strapped", level: 20 },
      { tier: "adamant", handle: "maple_handle_strapped", level: 30 },
      { tier: "rune", handle: "yew_handle_strapped", level: 40 }
    ];
    const families = [
      { partSuffix: "sword_blade", outputSuffix: "sword" },
      { partSuffix: "axe_head", outputSuffix: "axe" },
      { partSuffix: "pickaxe_head", outputSuffix: "pickaxe" }
    ];

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      for (let j = 0; j < families.length; j++) {
        const family = families[j];
        const partId = tier.tier + "_" + family.partSuffix;
        const outputId = tier.tier + "_" + family.outputSuffix;
        const ctx = createSkillContext({
          sourceItemId: partId,
          targetItemId: tier.handle,
          counts: { [partId]: 1, [tier.handle]: 1 },
          levels: { crafting: tier.level }
        });

        const used = crafting.onUseItem(ctx);
        assert(used, "expected crafting to handle assembly pair for " + outputId);
        assert((ctx._counts[outputId] || 0) === 1, "expected assembled output for " + outputId);
        assert((ctx._counts[partId] || 0) === 0, "expected metal part consumed for " + outputId);
        assert((ctx._counts[tier.handle] || 0) === 0, "expected strapped handle consumed for " + outputId);
      }
    }
  });

  test("Crafting jewelry attachments enforce family restrictions and mould unlocks", () => {
    const starts = [];
    window.SkillRuntime = {
      tryStartSkillById: (skillId, payload) => {
        starts.push({ skillId, payload });
        return true;
      }
    };

    const silverAllowed = createSkillContext({
      sourceItemId: "silver_ring",
      targetItemId: "cut_sapphire",
      counts: { silver_ring: 1, cut_sapphire: 1 },
      unlockFlags: { ringMouldUnlocked: true }
    });
    assert(crafting.onUseItem(silverAllowed), "expected silver+sapphire jewelry pair to be handled");
    assert(starts.some((entry) => entry.payload && entry.payload.recipeId === "craft_sapphire_silver_ring"), "expected sapphire silver ring recipe queue");

    const silverBlockedGem = createSkillContext({
      sourceItemId: "silver_ring",
      targetItemId: "cut_emerald",
      counts: { silver_ring: 1, cut_emerald: 1 },
      unlockFlags: { ringMouldUnlocked: true }
    });
    assert(crafting.onUseItem(silverBlockedGem), "expected silver+emerald pair to be recognized as invalid");
    expectMessage(silverBlockedGem, "These don't match.", "silver gem family block");

    const goldAllowed = createSkillContext({
      sourceItemId: "gold_ring",
      targetItemId: "cut_diamond",
      counts: { gold_ring: 1, cut_diamond: 1 },
      unlockFlags: { ringMouldUnlocked: true }
    });
    assert(crafting.onUseItem(goldAllowed), "expected gold+diamond jewelry pair to be handled");
    assert(starts.some((entry) => entry.payload && entry.payload.recipeId === "craft_diamond_gold_ring"), "expected diamond gold ring recipe queue");

    const locked = createSkillContext({
      sourceItemId: "silver_ring",
      targetItemId: "cut_ruby",
      counts: { silver_ring: 1, cut_ruby: 1 },
      unlockFlags: { ringMouldUnlocked: false }
    });
    assert(crafting.onUseItem(locked), "expected locked jewelry pair to be handled by crafting");
    expectMessage(locked, "You have not unlocked that mould yet.", "jewelry unlock block");
  });

  test("Smithing jewelry base requires mould unlock flag", () => {
    const locked = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      counts: { silver_bar: 1, ring_mould: 1 },
      unlockFlags: { ringMouldUnlocked: false },
      currentTick: 100,
      action: null,
      levels: { smithing: 10 }
    });
    assert(!smithing.onStart(locked), "expected smithing jewelry start to fail when mould unlock is missing");
    expectMessage(locked, "You have not unlocked that mould yet.", "smithing mould unlock");
  });

  test("Smithing jewelry base crafts when unlock is present", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      counts: { silver_bar: 1, ring_mould: 1 },
      unlockFlags: { ringMouldUnlocked: true },
      currentTick: 200,
      levels: { smithing: 20 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected smithing jewelry start to succeed");
    ctx.currentTick = 203;
    smithing.onTick(ctx);
    assert((ctx._counts.silver_ring || 0) === 1, "expected forged silver ring output");
    assert((ctx._counts.silver_bar || 0) === 0, "expected silver bar consumed");
  });

  test("Smithing restores materials when output grant fails", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      counts: { silver_bar: 1, ring_mould: 1 },
      unlockFlags: { ringMouldUnlocked: true },
      currentTick: 300,
      levels: { smithing: 20 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0,
      giveItemById: (itemId, amount, counts) => {
        if (itemId === "silver_ring") return 0;
        counts[itemId] = (counts[itemId] || 0) + amount;
        return amount;
      }
    });

    assert(smithing.onStart(ctx), "expected smithing jewelry start before output failure");
    ctx.currentTick = 303;
    smithing.onTick(ctx);
    assert((ctx._counts.silver_ring || 0) === 0, "expected no retained ring output when give fails");
    assert((ctx._counts.silver_bar || 0) === 1, "expected silver bar restored on failed output grant");
    assert(ctx.playerState.action === null, "expected smithing action to stop on output failure");
    expectMessage(ctx, "You have no inventory space for that output.", "smithing rollback");
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




