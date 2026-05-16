const assert = require("assert");
const path = require("path");
const { loadBrowserScript, loadSkillSpecScripts } = require("./browser-script-test-utils");
const { expectMessage } = require("./message-test-utils");

function createRunecraftingContext(options = {}) {
  const counts = Object.assign({}, options.counts || {});
  const messages = [];
  const xpBySkill = {};
  const inventoryOrder = Array.isArray(options.inventoryOrder)
    ? options.inventoryOrder.slice()
    : Object.keys(counts);
  const targetX = Number.isFinite(options.targetX) ? options.targetX : 20;
  const targetY = Number.isFinite(options.targetY) ? options.targetY : 30;
  const targetZ = Number.isFinite(options.targetZ) ? options.targetZ : 0;
  const altarName = options.altarName || "Ember Altar";

  const context = {
    targetObj: "ALTAR_CANDIDATE",
    sourceItemId: options.sourceItemId || "rune_essence",
    sourceInvIndex: Number.isInteger(options.sourceInvIndex) ? options.sourceInvIndex : 0,
    targetX,
    targetY,
    targetZ,
    hitData: {
      type: "ALTAR_CANDIDATE",
      name: altarName,
      gridX: targetX,
      gridY: targetY,
      gridZ: targetZ
    },
    currentTick: Number.isFinite(options.currentTick) ? options.currentTick : 0,
    playerState: {
      x: Number.isFinite(options.x) ? options.x : targetX,
      y: Number.isFinite(options.y) ? options.y : targetY + 1,
      z: targetZ,
      action: options.action || null,
      runecraftingSession: options.runecraftingSession || null
    },
    getRecipeSet: (skillId) => window.SkillSpecRegistry.getRecipeSet(skillId),
    getSkillSpec: (skillId) => window.SkillSpecRegistry.getSkillSpec(skillId),
    getInventoryCount: (itemId) => counts[itemId] || 0,
    getFirstInventorySlotByItemId: (itemId) => {
      if ((counts[itemId] || 0) <= 0) return -1;
      const index = inventoryOrder.indexOf(itemId);
      return index >= 0 ? index : inventoryOrder.length;
    },
    getSkillLevel: (skillId) => {
      const levels = options.levels || {};
      return Number.isFinite(levels[skillId]) ? levels[skillId] : 99;
    },
    hasUnlockFlag: (flag) => {
      const flags = options.unlockFlags || {};
      return !!flags[flag];
    },
    getAltarNameAt: (x, y, z) => (x === targetX && y === targetY && z === targetZ ? altarName : null),
    removeItemsById: (itemId, amount) => {
      const requested = Math.max(0, Math.floor(amount || 0));
      const available = counts[itemId] || 0;
      const removed = Math.min(available, requested);
      if (removed <= 0) return 0;
      counts[itemId] = available - removed;
      if (counts[itemId] <= 0) delete counts[itemId];
      return removed;
    },
    giveItemById: (itemId, amount) => {
      const added = Math.max(0, Math.floor(amount || 0));
      if (added <= 0) return 0;
      counts[itemId] = (counts[itemId] || 0) + added;
      if (!inventoryOrder.includes(itemId)) inventoryOrder.push(itemId);
      return added;
    },
    addSkillXp: (skillId, amount) => {
      xpBySkill[skillId] = (xpBySkill[skillId] || 0) + amount;
    },
    addChatMessage: (message, tone) => {
      messages.push({ message, tone });
    },
    renderInventory: () => {
      context._renderCount += 1;
    },
    startSkillingAction: () => {
      context.playerState.action = "SKILLING: ALTAR_CANDIDATE";
    },
    stopAction: () => {
      context.playerState.action = null;
    },
    queueInteract: () => {
      context._queued += 1;
    },
    spawnClickMarker: () => {}
  };

  context._counts = counts;
  context._messages = messages;
  context._xpBySkill = xpBySkill;
  context._inventoryOrder = inventoryOrder;
  context._queued = 0;
  context._renderCount = 0;
  return context;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");

  global.window = {};
  loadSkillSpecScripts(root);
  loadBrowserScript(root, "src/js/skills/spec-registry.js");
  global.SkillSpecRegistry = window.SkillSpecRegistry;

  loadBrowserScript(root, "src/js/skills/runecrafting/index.js");

  const runecrafting = window.SkillModules && window.SkillModules.runecrafting;
  assert(!!runecrafting, "runecrafting module missing");

  const tests = [];
  function test(name, fn) {
    tests.push({ name, fn });
  }

  test("Runecrafting blocks combination starts when secondary runes cannot support one essence", () => {
    const ctx = createRunecraftingContext({
      counts: { rune_essence: 27, air_rune: 1 },
      inventoryOrder: ["air_rune", "rune_essence"],
      levels: { runecrafting: 50 },
      unlockFlags: { runecraftingComboUnlocked: true }
    });

    const started = runecrafting.onStart(ctx);

    assert(!started, "expected the under-supplied combination route to fail before starting");
    assert(ctx.playerState.action === null, "expected no skilling action to start");
    assert(ctx.playerState.runecraftingSession === null, "expected no runecrafting session to start");
    assert((ctx._counts.rune_essence || 0) === 27, "expected essence to remain untouched");
    assert((ctx._counts.air_rune || 0) === 1, "expected secondary runes to remain untouched");
    expectMessage(ctx, "You need at least 2 air runes to bind smoke rune.", "combination start feedback");
  });

  test("Runecrafting reports secondary-rune loss before a queued combination craft resolves", () => {
    const ctx = createRunecraftingContext({
      counts: { rune_essence: 27, air_rune: 2 },
      inventoryOrder: ["air_rune", "rune_essence"],
      levels: { runecrafting: 50 },
      unlockFlags: { runecraftingComboUnlocked: true }
    });

    assert(runecrafting.onStart(ctx), "expected a minimally supplied combination craft to start");
    ctx._counts.air_rune = 1;
    ctx.currentTick = 1;
    runecrafting.onTick(ctx);

    assert(ctx.playerState.action === null, "expected runecrafting to stop after secondary-rune loss");
    assert(ctx.playerState.runecraftingSession === null, "expected session to clear after secondary-rune loss");
    assert((ctx._counts.rune_essence || 0) === 27, "expected essence to remain untouched after blocked tick");
    assert((ctx._counts.air_rune || 0) === 1, "expected remaining secondary rune to stay untouched");
    expectMessage(ctx, "You need at least 2 air runes to bind smoke rune.", "combination tick feedback");
  });

  test("Runecrafting keeps partial combination output when secondary runes support at least one essence", () => {
    const ctx = createRunecraftingContext({
      counts: { rune_essence: 27, air_rune: 40 },
      inventoryOrder: ["air_rune", "rune_essence"],
      levels: { runecrafting: 50 },
      unlockFlags: { runecraftingComboUnlocked: true }
    });

    assert(runecrafting.onStart(ctx), "expected partial secondary supply to start");
    ctx.currentTick = 1;
    runecrafting.onTick(ctx);

    assert((ctx._counts.rune_essence || 0) === 7, "expected partial combination craft to leave unused essence");
    assert((ctx._counts.air_rune || 0) === 0, "expected available secondary runes to be consumed");
    assert((ctx._counts.smoke_rune || 0) === 40, "expected smoke runes from supported essence only");
    assert((ctx._xpBySkill.runecrafting || 0) === 480, "expected XP for the essence that produced output");
    assert(ctx.playerState.action === null, "expected one-shot altar craft to end after output");
    expectMessage(ctx, "You bind 20 rune essence into 40 smoke rune.", "partial combination craft");
  });

  test("Runecrafting surfaces selected route and missing secondary hint in altar labels", () => {
    const ctx = createRunecraftingContext({
      counts: { rune_essence: 27, air_rune: 1 },
      inventoryOrder: ["air_rune", "rune_essence"],
      levels: { runecrafting: 50 },
      unlockFlags: { runecraftingComboUnlocked: true }
    });

    const tooltip = runecrafting.getTooltip(ctx);
    const contextMenu = runecrafting.getContextMenu(ctx);

    assert(tooltip.includes("smoke rune"), "expected tooltip to show selected smoke-rune route");
    assert(tooltip.includes("need 2 air runes"), "expected tooltip to show missing secondary requirement");
    assert(Array.isArray(contextMenu) && contextMenu.length >= 1, "expected runecrafting context menu entries");
    assert(contextMenu[0].text.includes("smoke rune"), "expected context menu craft action to show selected output");
    assert(contextMenu[0].text.includes("need 2 air runes"), "expected context menu craft action to show missing secondary requirement");
  });

  test("Runecrafting surfaces locked combination route instead of hiding the selected secondary rune", () => {
    const ctx = createRunecraftingContext({
      counts: { rune_essence: 27, air_rune: 40 },
      inventoryOrder: ["air_rune", "rune_essence"],
      levels: { runecrafting: 50 }
    });

    const tooltip = runecrafting.getTooltip(ctx);
    const contextMenu = runecrafting.getContextMenu(ctx);
    const started = runecrafting.onStart(ctx);

    assert(tooltip.includes("smoke rune"), "expected tooltip to keep the selected smoke-rune route");
    assert(tooltip.includes("quest locked"), "expected tooltip to show the missing combo unlock");
    assert(contextMenu[0].text.includes("quest locked"), "expected context menu to show the missing combo unlock");
    assert(!started, "expected locked combination route not to start");
    assert(ctx.playerState.action === null, "expected no action to start for locked combination route");
    assert((ctx._counts.rune_essence || 0) === 27, "expected locked route to leave essence untouched");
    assert((ctx._counts.air_rune || 0) === 40, "expected locked route to leave secondary runes untouched");
    expectMessage(ctx, "You have not unlocked combination runecrafting yet.", "locked combination feedback");
  });

  test("Runecrafting surfaces level-gated combination route before start", () => {
    const ctx = createRunecraftingContext({
      counts: { rune_essence: 27, air_rune: 40 },
      inventoryOrder: ["air_rune", "rune_essence"],
      levels: { runecrafting: 10 },
      unlockFlags: { runecraftingComboUnlocked: true }
    });

    const tooltip = runecrafting.getTooltip(ctx);
    const contextMenu = runecrafting.getContextMenu(ctx);
    const started = runecrafting.onStart(ctx);

    assert(tooltip.includes("smoke rune"), "expected tooltip to keep the selected smoke-rune route");
    assert(tooltip.includes("need level 40"), "expected tooltip to show the combo level gate");
    assert(contextMenu[0].text.includes("need level 40"), "expected context menu to show the combo level gate");
    assert(!started, "expected level-gated combination route not to start");
    assert(ctx.playerState.action === null, "expected no action to start for level-gated route");
    assert((ctx._counts.rune_essence || 0) === 27, "expected level-gated route to leave essence untouched");
    assert((ctx._counts.air_rune || 0) === 40, "expected level-gated route to leave secondary runes untouched");
    expectMessage(ctx, "You need to be level 40 to bind these runes", "level-gated combination feedback");
  });

  test("Runecrafting reports altar target interruption before a queued craft resolves", () => {
    const ctx = createRunecraftingContext({
      counts: { rune_essence: 5 },
      levels: { runecrafting: 1 }
    });

    assert(runecrafting.onStart(ctx), "expected base altar craft to start");
    ctx.targetX = ctx.targetX + 1;
    ctx.currentTick = 1;
    runecrafting.onTick(ctx);

    assert(ctx.playerState.action === null, "expected interrupted altar craft to stop");
    assert(ctx.playerState.runecraftingSession === null, "expected interrupted altar craft to clear session");
    assert((ctx._counts.rune_essence || 0) === 5, "expected interrupted craft to leave essence untouched");
    assert((ctx._counts.ember_rune || 0) === 0, "expected interrupted craft not to grant runes");
    expectMessage(ctx, "You stop binding runes because the altar is no longer selected.", "altar interruption feedback");
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
    console.error("\nRunecrafting runtime QA failures: " + failures.length + " of " + tests.length);
    failures.forEach((failure) => console.error(" - " + failure.name + ": " + failure.error));
    process.exit(1);
  }

  console.log("\nRunecrafting runtime QA passed: " + passed + " tests.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
