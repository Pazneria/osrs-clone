const assert = require("assert");
const path = require("path");
const { loadBrowserScript, loadSkillSpecScripts } = require("./browser-script-test-utils");
const { makeClassNameList } = require("./dom-test-utils");
const { expectMessage, expectMessageContaining, expectMessageTone } = require("./message-test-utils");

function createDomShim() {
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
      this.classList = makeClassNameList(this);
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
  const queuedInteractions = [];
  const canAccept = typeof options.canAcceptItemById === "function"
    ? options.canAcceptItemById
    : () => (options.canAccept !== false);
  const customGive = typeof options.giveItemById === "function" ? options.giveItemById : null;
  const customQueueInteractAt = typeof options.queueInteractAt === "function" ? options.queueInteractAt : null;

  const context = {
    targetObj: options.targetObj || "INVENTORY",
    sourceItemId: options.sourceItemId || null,
    hitData: options.hitData || null,
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
    hasActiveFireAt: typeof options.hasActiveFireAt === "function"
      ? options.hasActiveFireAt
      : () => false,
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
    queueInteract: () => {
      queuedInteractions.push({ obj: context.targetObj, x: context.targetX, y: context.targetY, targetUid: null });
    },
    queueInteractAt: (obj, x, y, targetUid) => {
      if (customQueueInteractAt) {
        return customQueueInteractAt(obj, x, y, targetUid);
      }
      queuedInteractions.push({ obj, x, y, targetUid: targetUid || null });
    },
    resolveFireTargetFromHit: typeof options.resolveFireTargetFromHit === "function"
      ? options.resolveFireTargetFromHit
      : () => null,
    startSkillingAction: () => {
      context.playerState.action = context.targetObj === "FURNACE" ? "SKILLING: FURNACE" : (context.targetObj === "ANVIL" ? "SKILLING: ANVIL" : "SKILLING: UNKNOWN");
    },
    promptAmount: () => false,
    confirmAction: (message) => {
      if (typeof options.confirmAction === "function") {
        return !!options.confirmAction(message);
      }
      if (typeof window.confirm === "function") {
        return !!window.confirm(message);
      }
      return false;
    },
    _counts: counts,
    _messages: messages,
    _queuedInteractions: queuedInteractions,
    _xpBySkill: xpBySkill
  };

  return context;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");

  global.window = {};
  global.document = createDomShim();
  window.prompt = () => null;
  window.confirm = () => true;

  loadSkillSpecScripts(root);
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

  test("Fletching animation holds knife right-hand and active log tier left-hand", () => {
    const recipeSet = window.SkillSpecRegistry.getRecipeSet("fletching");
    const willowRecipeId = Object.keys(recipeSet).find((recipeId) => recipeSet[recipeId].sourceLogItemId === "willow_logs");
    assert(!!willowRecipeId, "expected a willow-logs fletching recipe");

    const ctx = createSkillContext({
      recipeId: willowRecipeId,
      action: "SKILLING: FLETCHING",
      counts: { knife: 1, willow_logs: 2 }
    });
    ctx.playerState.skillSessions.fletching = {
      kind: "processing",
      recipeId: willowRecipeId,
      nextTick: ctx.currentTick + 3
    };

    const heldItems = fletching.getAnimationHeldItems(ctx);
    assert(heldItems && heldItems.rightHand === "knife", "expected knife in the right hand");
    assert(heldItems && heldItems.leftHand === "willow_logs", "expected active willow logs in the left hand");
    assert(fletching.getAnimationHeldItemSlot(ctx) === "rightHand", "expected the knife to remain the primary fletching hand");
  });

  test("Crafting animation is clip-driven and suppresses equipped visuals for empty hands", () => {
    const ctx = createSkillContext({
      recipeId: "cut_sapphire",
      action: "SKILLING: CRAFTING",
      counts: { chisel: 1, uncut_sapphire: 1 }
    });

    const handled = crafting.onAnimate(ctx);
    assert(handled === false, "expected crafting to defer body motion to the studio clip");
    assert(crafting.getAnimationSuppressEquipmentVisual(ctx) === true, "expected crafting to hide equipped visuals while the empty-hand clip is active");
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

  test("Crafting confirms overtier handle assembly before producing lower-tier output", () => {
    const confirmations = [];
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "oak_handle_strapped",
      counts: { bronze_axe_head: 1, oak_handle_strapped: 1 },
      confirmAction: (message) => {
        confirmations.push(message);
        return true;
      }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected overtier assembly pair to be handled");
    assert(confirmations.length === 1, "expected one overtier confirmation prompt");
    assert(confirmations[0].includes("no stat bonus"), "expected confirmation to explain no stat bonus");
    assert(confirmations[0].includes("cannot disassemble"), "expected confirmation to explain non-disassembly");
    assert((ctx._counts.bronze_axe || 0) === 1, "expected lower-tier bronze axe output");
    assert((ctx._counts.bronze_axe_head || 0) === 0, "expected bronze axe head consumed");
    assert((ctx._counts.oak_handle_strapped || 0) === 0, "expected provided higher-tier handle consumed");
  });

  test("Crafting leaves inputs untouched when overtier handle confirmation is declined", () => {
    const ctx = createSkillContext({
      sourceItemId: "bronze_axe_head",
      targetItemId: "oak_handle_strapped",
      counts: { bronze_axe_head: 1, oak_handle_strapped: 1 },
      confirmAction: () => false
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected overtier assembly pair to be recognized");
    assert((ctx._counts.bronze_axe || 0) === 0, "expected no crafted output after declined confirmation");
    assert((ctx._counts.bronze_axe_head || 0) === 1, "expected bronze axe head to remain after declined confirmation");
    assert((ctx._counts.oak_handle_strapped || 0) === 1, "expected higher-tier handle to remain after declined confirmation");
    expectMessage(ctx, "You decide not to assemble that with the higher-tier handle.", "overtier decline");
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
      sourceItemId: "steel_axe_head",
      targetItemId: "wooden_handle_strapped",
      counts: { steel_axe_head: 1, wooden_handle_strapped: 1 }
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

  test("Crafting makes soft clay from clay on water", () => {
    const ctx = createSkillContext({
      targetObj: "WATER",
      sourceItemId: "clay",
      counts: { clay: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected clay-on-water to be handled by crafting");
    assert((ctx._counts.soft_clay || 0) === 1, "expected soft clay output");
    assert((ctx._counts.clay || 0) === 0, "expected clay input consumed");
    assert((ctx._xpBySkill.crafting || 0) === 1, "expected soft clay XP grant");
  });

  test("Crafting imprinting keeps borrowed jewellery while consuming soft clay", () => {
    const ctx = createSkillContext({
      sourceItemId: "soft_clay",
      targetItemId: "borrowed_ring",
      counts: { soft_clay: 1, borrowed_ring: 1 }
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected soft clay + borrowed ring to be handled by crafting");
    assert((ctx._counts.imprinted_ring_mould || 0) === 1, "expected imprinted ring mould output");
    assert((ctx._counts.soft_clay || 0) === 0, "expected soft clay consumed");
    assert((ctx._counts.borrowed_ring || 0) === 1, "expected borrowed ring to remain in inventory");
    assert((ctx._xpBySkill.crafting || 0) === 1, "expected imprinting XP grant");
  });

  test("Crafting queues mould firing on an active fire target", () => {
    const ctx = createSkillContext({
      targetObj: "GROUND",
      sourceItemId: "imprinted_ring_mould",
      counts: { imprinted_ring_mould: 1 },
      hitData: { gridX: 10, gridY: 11, point: { x: 10.5, z: 11.5 } },
      resolveFireTargetFromHit: () => ({ x: 10, y: 11, z: 0 })
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected imprinted mould on fire to be handled by crafting");
    assert(ctx.playerState.pendingSkillStart && ctx.playerState.pendingSkillStart.recipeId === "fire_imprinted_ring_mould", "expected pending fire-crafting recipe");
    assert(ctx.playerState.pendingSkillStart && ctx.playerState.pendingSkillStart.targetObj === "FIRE", "expected pending fire target");
    assert(ctx._queuedInteractions.length === 1, "expected one queued fire interaction");
    assert(ctx._queuedInteractions[0].obj === "FIRE", "expected queued interaction against FIRE");
  });

  test("Crafting blocks mould firing when no active fire is found", () => {
    const ctx = createSkillContext({
      targetObj: "GROUND",
      sourceItemId: "imprinted_ring_mould",
      counts: { imprinted_ring_mould: 1 },
      hitData: { gridX: 10, gridY: 11, point: { x: 10.5, z: 11.5 } },
      resolveFireTargetFromHit: () => null
    });

    const used = crafting.onUseItem(ctx);
    assert(used, "expected imprinted mould ground use to be recognized");
    assert(!ctx.playerState.pendingSkillStart, "expected no queued fire craft without an active fire");
    assert(ctx._queuedInteractions.length === 0, "expected no queued interaction without an active fire");
    expectMessage(ctx, "You need an active fire to finish that mould.", "missing active fire");
  });

  test("Crafting fires imprinted moulds into permanent mould tools", () => {
    const ctx = createSkillContext({
      targetObj: "FIRE",
      sourceItemId: "imprinted_ring_mould",
      recipeId: "fire_imprinted_ring_mould",
      counts: { imprinted_ring_mould: 1 },
      currentTick: 700,
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 11,
      targetZ: 0,
      hasActiveFireAt: (x, y, z) => x === 10 && y === 11 && z === 0
    });

    assert(crafting.onStart(ctx), "expected fire-based mould crafting to start");
    ctx.currentTick = 703;
    crafting.onTick(ctx);

    assert((ctx._counts.ring_mould || 0) === 1, "expected final ring mould output");
    assert((ctx._counts.imprinted_ring_mould || 0) === 0, "expected imprinted mould consumed");
    assert((ctx._xpBySkill.crafting || 0) === 3, "expected mould firing XP grant");
    assert(ctx.playerState.action === null, "expected fire-crafting action to stop once inputs are exhausted");
  });

  test("Crafting fire sessions stop cleanly when the fire goes out", () => {
    let fireActive = true;
    const ctx = createSkillContext({
      targetObj: "FIRE",
      sourceItemId: "imprinted_ring_mould",
      recipeId: "fire_imprinted_ring_mould",
      counts: { imprinted_ring_mould: 1 },
      currentTick: 710,
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 11,
      targetZ: 0,
      hasActiveFireAt: () => fireActive
    });

    assert(crafting.onStart(ctx), "expected fire-based mould crafting to start before the fire expires");
    fireActive = false;
    ctx.currentTick = 713;
    crafting.onTick(ctx);

    assert((ctx._counts.ring_mould || 0) === 0, "expected no mould output after the fire goes out");
    assert((ctx._counts.imprinted_ring_mould || 0) === 1, "expected imprinted mould to remain when no craft occurs");
    assert(ctx.playerState.action === null, "expected fire-crafting action to stop when the fire expires");
    expectMessage(ctx, "The fire has gone out.", "fire expired");
  });

  test("Crafting fire sessions stop when the player moves away from the fire", () => {
    const ctx = createSkillContext({
      targetObj: "FIRE",
      sourceItemId: "imprinted_ring_mould",
      recipeId: "fire_imprinted_ring_mould",
      counts: { imprinted_ring_mould: 1 },
      currentTick: 720,
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 11,
      targetZ: 0,
      hasActiveFireAt: () => true
    });

    assert(crafting.onStart(ctx), "expected fire-based mould crafting to start before moving away");
    ctx.playerState.x = 13;
    ctx.currentTick = 723;
    crafting.onTick(ctx);

    assert((ctx._counts.ring_mould || 0) === 0, "expected no mould output after moving away from the fire");
    assert((ctx._counts.imprinted_ring_mould || 0) === 1, "expected imprinted mould to remain when no craft occurs");
    assert(ctx.playerState.action === null, "expected fire-crafting action to stop when the player leaves the fire");
    expectMessage(ctx, "You move away from the fire.", "fire moved away");
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
      levels: { smithing: 30 }
    });
    assert(!smithing.onStart(locked), "expected smithing jewelry start to fail when mould unlock is missing");
    expectMessage(locked, "You have not unlocked the required mould for Silver Ring.", "smithing mould unlock");
  });

  test("Smithing jewelry base crafts when unlock is present", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      counts: { silver_bar: 1, ring_mould: 1 },
      unlockFlags: { ringMouldUnlocked: true },
      currentTick: 200,
      levels: { smithing: 30 },
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

  test("Smithing anvil UI lists named tool and material requirements", () => {
    const ctx = createSkillContext({
      targetObj: "ANVIL",
      counts: {},
      levels: { smithing: 1 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(!smithing.onStart(ctx), "expected smithing UI to open when no recipe is preselected");
    const recipeList = document.getElementById("smithing-recipe-list");
    assert(recipeList && recipeList.children.length > 0, "expected smithing anvil recipe rows to render");

    const bronzeSwordBladeRow = recipeList.children[0];
    assert(bronzeSwordBladeRow && bronzeSwordBladeRow.children.length > 0, "expected bronze smithing recipe row");

    const issueMarkup = bronzeSwordBladeRow.children[0].innerHTML || "";
    assert(issueMarkup.includes("Needs Hammer"), "expected smithing UI to name the missing hammer requirement");
    assert(issueMarkup.includes("Needs 1x Bronze Bar"), "expected smithing UI to name the missing bronze bar requirement");
  });

  test("Smithing furnace UI lists named mould and unlock requirements", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      counts: { silver_bar: 1 },
      unlockFlags: { ringMouldUnlocked: false },
      levels: { smithing: 30 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(!smithing.onStart(ctx), "expected smithing furnace UI to open when no recipe is preselected");
    const tierList = document.getElementById("smithing-tier-list");
    assert(tierList && tierList.children.length > 0, "expected smithing furnace tiers to render");

    let silverTierButton = null;
    for (let i = 0; i < tierList.children.length; i++) {
      const button = tierList.children[i];
      if ((button.innerHTML || "").includes("Silver")) {
        silverTierButton = button;
        break;
      }
    }
    assert(silverTierButton && typeof silverTierButton.onclick === "function", "expected silver smithing tier button");
    silverTierButton.onclick();

    const recipeList = document.getElementById("smithing-recipe-list");
    assert(recipeList && recipeList.children.length > 0, "expected silver smithing recipe rows");

    let silverRingRow = null;
    for (let i = 0; i < recipeList.children.length; i++) {
      const row = recipeList.children[i];
      const infoMarkup = row && row.children && row.children[0] ? (row.children[0].innerHTML || "") : "";
      if (infoMarkup.includes("Silver Ring")) {
        silverRingRow = row;
        break;
      }
    }
    assert(silverRingRow && silverRingRow.children.length > 0, "expected silver ring smithing row");

    const issueMarkup = silverRingRow.children[0].innerHTML || "";
    assert(issueMarkup.includes("Needs Ring mould"), "expected smithing UI to name the required mould");
    assert(issueMarkup.includes("Mould quest unlock required"), "expected smithing UI to show the mould unlock gate");
  });

  test("Smithing count mode crafts the exact queued amount with start/finish messaging", () => {
    const ctx = createSkillContext({
      targetObj: "ANVIL",
      recipeId: "forge_bronze_sword_blade",
      quantityMode: "count",
      quantityCount: 2,
      counts: { bronze_bar: 4, hammer: 1 },
      currentTick: 240,
      levels: { smithing: 1 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected queued smithing count-mode start");
    expectMessage(ctx, "You begin smithing 2x Bronze Sword Blade at the anvil.", "smithing count start");

    ctx.currentTick = 243;
    smithing.onTick(ctx);
    assert((ctx._counts.bronze_sword_blade || 0) === 1, "expected first smithing output at tick 243");
    assert(ctx.playerState.action === "SKILLING: ANVIL", "expected smithing queue to remain active after the first craft");

    ctx.currentTick = 246;
    smithing.onTick(ctx);
    assert((ctx._counts.bronze_sword_blade || 0) === 2, "expected second smithing output at tick 246");
    assert((ctx._counts.bronze_bar || 0) === 0, "expected bronze bars fully consumed by the queued smithing batch");
    assert((ctx._counts.hammer || 0) === 1, "expected hammer to remain after queued smithing");
    assert((ctx._xpBySkill.smithing || 0) === 16, "expected smithing XP for two bronze sword blades");
    assert(ctx.playerState.action === null, "expected smithing action to stop after the requested quantity completes");
    expectMessage(ctx, "You finish smithing 2x Bronze Sword Blade.", "smithing count finish");
  });

  test("Smithing all-mode explains why the queue stops when materials run out", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "smelt_bronze_bar",
      quantityMode: "all",
      counts: { copper_ore: 1, tin_ore: 1 },
      currentTick: 260,
      levels: { smithing: 1 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected smithing all-mode start");
    expectMessage(ctx, "You begin smithing Bronze Bar until you run out of materials at the furnace.", "smithing all-mode start");

    ctx.currentTick = 263;
    smithing.onTick(ctx);
    assert((ctx._counts.bronze_bar || 0) === 1, "expected one bronze bar output before materials run out");
    assert(ctx.playerState.action === null, "expected smithing queue to stop after materials are exhausted");
    expectMessageContaining(ctx, "Copper ore", "smithing all-mode missing copper");
    expectMessageContaining(ctx, "Tin ore", "smithing all-mode missing tin");
    expectMessageContaining(ctx, "keep smithing Bronze Bar", "smithing all-mode input-empty");
    expectMessageTone(ctx, "You need 1x Copper ore and 1x Tin ore to keep smithing Bronze Bar.", "info", "smithing all-mode input-empty tone");
  });

  test("Smithing start-time output capacity names the blocked recipe", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      counts: { silver_bar: 1, ring_mould: 1 },
      unlockFlags: { ringMouldUnlocked: true },
      currentTick: 270,
      levels: { smithing: 30 },
      canAccept: false,
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(!smithing.onStart(ctx), "expected smithing start to fail when the output inventory is full");
    expectMessage(ctx, "You need more inventory space to smith Silver Ring.", "smithing start output capacity");
  });

  test("Smithing move-away interruption names the station and recipe", () => {
    const ctx = createSkillContext({
      targetObj: "ANVIL",
      recipeId: "forge_bronze_sword_blade",
      quantityMode: "all",
      counts: { bronze_bar: 2, hammer: 1 },
      currentTick: 280,
      levels: { smithing: 1 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected smithing start before moving away");
    ctx.playerState.x = 13;
    ctx.currentTick = 283;
    smithing.onTick(ctx);

    assert((ctx._counts.bronze_sword_blade || 0) === 0, "expected no smithing output after moving away before the next action tick");
    assert(ctx.playerState.action === null, "expected smithing action to stop after moving away from the anvil");
    expectMessage(ctx, "You move away from the anvil and stop smithing Bronze Sword Blade.", "smithing move-away");
    expectMessageTone(ctx, "You move away from the anvil and stop smithing Bronze Sword Blade.", "info", "smithing move-away tone");
  });

  test("Smithing station-change interruption uses info tone and names the prior station", () => {
    const ctx = createSkillContext({
      targetObj: "ANVIL",
      recipeId: "forge_bronze_sword_blade",
      quantityMode: "all",
      counts: { bronze_bar: 2, hammer: 1 },
      currentTick: 290,
      levels: { smithing: 1 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected smithing start before station change");
    ctx.targetObj = "FURNACE";
    ctx.currentTick = 293;
    smithing.onTick(ctx);

    assert((ctx._counts.bronze_sword_blade || 0) === 0, "expected no smithing output after station change before the next action tick");
    assert(ctx.playerState.action === null, "expected smithing action to stop after switching stations");
    expectMessage(ctx, "You leave the anvil and stop smithing Bronze Sword Blade.", "smithing station change");
    expectMessageTone(ctx, "You leave the anvil and stop smithing Bronze Sword Blade.", "info", "smithing station change tone");
  });

  test("Smithing tool-loss messaging names the required tool during queued work", () => {
    const ctx = createSkillContext({
      targetObj: "ANVIL",
      recipeId: "forge_bronze_sword_blade",
      quantityMode: "all",
      counts: { bronze_bar: 2, hammer: 1 },
      currentTick: 300,
      levels: { smithing: 1 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected smithing start before removing the hammer");
    ctx._counts.hammer = 0;
    ctx.currentTick = 303;
    smithing.onTick(ctx);

    assert((ctx._counts.bronze_sword_blade || 0) === 0, "expected no smithing output after the hammer disappears");
    assert(ctx.playerState.action === null, "expected smithing action to stop when the required tool disappears");
    expectMessage(ctx, "You need Hammer to keep smithing Bronze Sword Blade.", "smithing missing hammer");
  });

  test("Smithing mould-loss messaging names the mould during queued work", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      quantityMode: "all",
      counts: { silver_bar: 2, ring_mould: 1 },
      unlockFlags: { ringMouldUnlocked: true },
      currentTick: 310,
      levels: { smithing: 30 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected smithing jewelry start before removing the mould");
    ctx._counts.ring_mould = 0;
    ctx.currentTick = 313;
    smithing.onTick(ctx);

    assert((ctx._counts.silver_ring || 0) === 0, "expected no jewelry output after the mould disappears");
    assert(ctx.playerState.action === null, "expected smithing action to stop when the required mould disappears");
    expectMessage(ctx, "You need Ring mould to keep smithing Silver Ring.", "smithing missing mould");
    expectMessageTone(ctx, "You need Ring mould to keep smithing Silver Ring.", "warn", "smithing missing mould tone");
  });

  test("Smithing unlock-loss messaging explains the queued jewellery stop", () => {
    const unlockFlags = { ringMouldUnlocked: true };
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      quantityMode: "all",
      counts: { silver_bar: 2, ring_mould: 1 },
      unlockFlags,
      currentTick: 320,
      levels: { smithing: 30 },
      x: 10,
      y: 10,
      z: 0,
      targetX: 10,
      targetY: 10,
      targetZ: 0
    });

    assert(smithing.onStart(ctx), "expected smithing jewelry start before removing the unlock");
    unlockFlags.ringMouldUnlocked = false;
    ctx.currentTick = 323;
    smithing.onTick(ctx);

    assert((ctx._counts.silver_ring || 0) === 0, "expected no jewelry output after the mould unlock disappears");
    assert(ctx.playerState.action === null, "expected smithing action to stop when the mould unlock disappears");
    expectMessage(ctx, "You have not unlocked the required mould for Silver Ring yet.", "smithing missing unlock");
    expectMessageTone(ctx, "You have not unlocked the required mould for Silver Ring yet.", "warn", "smithing missing unlock tone");
  });

  test("Smithing restores materials when output grant fails", () => {
    const ctx = createSkillContext({
      targetObj: "FURNACE",
      recipeId: "forge_silver_ring",
      counts: { silver_bar: 1, ring_mould: 1 },
      unlockFlags: { ringMouldUnlocked: true },
      currentTick: 300,
      levels: { smithing: 30 },
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
    expectMessage(ctx, "You need more inventory space to keep smithing Silver Ring.", "smithing rollback");
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




