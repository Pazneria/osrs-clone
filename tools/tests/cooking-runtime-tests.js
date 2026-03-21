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
  return {
    body: { appendChild() {} },
    createElement() {
      return {
        style: {},
        className: "",
        textContent: "",
        innerHTML: "",
        children: [],
        classList: {
          add() {},
          remove() {},
          contains() { return false; }
        },
        appendChild(child) {
          this.children.push(child);
          return child;
        },
        addEventListener() {},
        setAttribute() {}
      };
    },
    getElementById() {
      return null;
    },
    addEventListener() {}
  };
}

function createSkillContext(options = {}) {
  const counts = Object.assign({}, options.counts || {});
  const messages = [];
  const xpBySkill = {};
  const queued = [];
  const defaultTargetX = Number.isFinite(options.targetX) ? options.targetX : 11;
  const defaultTargetY = Number.isFinite(options.targetY) ? options.targetY : 10;
  const defaultTargetZ = Number.isFinite(options.targetZ) ? options.targetZ : 0;
  const activeFires = Array.isArray(options.activeFires) && options.activeFires.length > 0
    ? options.activeFires.map((fire) => ({ x: fire.x, y: fire.y, z: fire.z }))
    : [{ x: defaultTargetX, y: defaultTargetY, z: defaultTargetZ }];

  const context = {
    targetObj: options.targetObj || "FIRE",
    sourceItemId: options.sourceItemId || null,
    sourceInvIndex: Number.isInteger(options.sourceInvIndex) ? options.sourceInvIndex : 0,
    targetX: defaultTargetX,
    targetY: defaultTargetY,
    targetZ: defaultTargetZ,
    hitData: options.hitData || {
      type: "FIRE",
      gridX: defaultTargetX,
      gridY: defaultTargetY,
      gridZ: defaultTargetZ
    },
    currentTick: Number.isFinite(options.currentTick) ? options.currentTick : 0,
    random: typeof options.random === "function" ? options.random : () => 1,
    playerState: {
      x: Number.isFinite(options.x) ? options.x : 10,
      y: Number.isFinite(options.y) ? options.y : 10,
      z: Number.isFinite(options.z) ? options.z : defaultTargetZ,
      action: options.action || null,
      pendingSkillStart: null,
      skillSessions: options.skillSessions ? JSON.parse(JSON.stringify(options.skillSessions)) : {}
    },
    getRecipeSet: (skillId) => window.SkillSpecRegistry.getRecipeSet(skillId),
    getSkillSpec: (skillId) => window.SkillSpecRegistry.getSkillSpec(skillId),
    getInventoryCount: (itemId) => counts[itemId] || 0,
    removeOneItemById: (itemId) => {
      const available = counts[itemId] || 0;
      if (available <= 0) return false;
      counts[itemId] = available - 1;
      if (counts[itemId] <= 0) delete counts[itemId];
      return true;
    },
    giveItemById: (itemId, amount) => {
      counts[itemId] = (counts[itemId] || 0) + amount;
      return amount;
    },
    addSkillXp: (skillId, amount) => {
      xpBySkill[skillId] = (xpBySkill[skillId] || 0) + amount;
    },
    addChatMessage: (message, tone) => {
      messages.push({ message, tone });
    },
    requireSkillLevel: (requiredLevel, meta = {}) => {
      const levels = options.levels || {};
      const level = Number.isFinite(levels.cooking) ? levels.cooking : 99;
      if (level >= requiredLevel) return true;
      const message = typeof meta.message === "string" && meta.message
        ? meta.message
        : `You need Cooking level ${requiredLevel} to ${meta.action || "do that"}.`;
      messages.push({ message, tone: meta.tone || "warn" });
      return false;
    },
    getSkillLevel: (skillId) => {
      const levels = options.levels || {};
      return Number.isFinite(levels[skillId]) ? levels[skillId] : 99;
    },
    hasActiveFireAt: (x, y, z) => activeFires.some((fire) => fire.x === x && fire.y === y && fire.z === z),
    resolveFireTargetFromHit: (hit) => {
      const hitX = Number.isFinite(hit && hit.gridX) ? hit.gridX : defaultTargetX;
      const hitY = Number.isFinite(hit && hit.gridY) ? hit.gridY : defaultTargetY;
      const hitZ = Number.isFinite(hit && hit.gridZ) ? hit.gridZ : defaultTargetZ;
      return activeFires.find((fire) => fire.x === hitX && fire.y === hitY && fire.z === hitZ) || null;
    },
    renderInventory: () => {},
    stopAction: () => {
      context.playerState.action = null;
    },
    startSkillingAction: () => {
      context.playerState.action = "SKILLING: FIRE";
    },
    queueInteractAt: (obj, x, y, targetUid = null) => {
      queued.push({ obj, x, y, targetUid });
    },
    queueInteract: () => {
      queued.push({
        obj: context.targetObj,
        x: context.targetX,
        y: context.targetY,
        targetUid: null
      });
    }
  };

  context._counts = counts;
  context._messages = messages;
  context._xpBySkill = xpBySkill;
  context._queued = queued;
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
  window.SkillSharedUtils = {
    rollChance: (chance, rng) => (typeof rng === "function" ? rng() : Math.random()) < chance
  };
  global.SkillSharedUtils = window.SkillSharedUtils;

  loadBrowserScript(root, "src/js/skills/specs.js");
  loadBrowserScript(root, "src/js/skills/spec-registry.js");
  loadBrowserScript(root, "src/js/skills/shared/action-resolution.js");

  global.SkillSpecRegistry = window.SkillSpecRegistry;
  global.SkillActionResolution = window.SkillActionResolution;

  loadBrowserScript(root, "src/js/skills/cooking/index.js");

  const cooking = window.SkillModules && window.SkillModules.cooking;
  assert(!!cooking, "cooking module missing");

  const tests = [];
  function test(name, fn) {
    tests.push({ name, fn });
  }

  test("Cooking onUseItem blocks under-level recipes before queueing interaction", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_swordfish",
      counts: { raw_swordfish: 1 },
      levels: { cooking: 1 }
    });

    const handled = cooking.onUseItem(ctx);
    assert(handled, "expected cooking to handle recognized raw-fish use");
    assert(ctx._queued.length === 0, "should not queue fire interaction when level gate fails");
    assert(ctx.playerState.pendingSkillStart === null, "should not create pending skill start when level gate fails");
    expectMessage(ctx, "You need Cooking level 40 to cook that.", "under-level use-item");
  });

  test("Cooking onStart blocks under-level recipes", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_tuna",
      counts: { raw_tuna: 1 },
      levels: { cooking: 1 }
    });

    const started = cooking.onStart(ctx);
    assert(!started, "expected cooking onStart to fail below the recipe level");
    expectMessage(ctx, "You need Cooking level 30 to cook that.", "under-level onStart");
  });

  test("Cooking unlock-level attempts use the shared burn curve instead of legacy per-food difficulty", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_swordfish",
      counts: { raw_swordfish: 1 },
      levels: { cooking: 40 },
      currentTick: 200,
      random: () => 0.5
    });

    assert(cooking.onStart(ctx), "expected swordfish cooking to start at its unlock level");
    ctx.currentTick = 201;
    cooking.onTick(ctx);

    assert((ctx._counts.cooked_swordfish || 0) === 1, "expected unlock-level swordfish to cook successfully at a 0.5 roll");
    assert((ctx._counts.burnt_swordfish || 0) === 0, "expected no burnt swordfish output when the shared curve succeeds");
    assert((ctx._xpBySkill.cooking || 0) === 140, "expected unlock-level swordfish to grant success XP");
  });

  test("Cooking reaches zero burn chance by required level plus thirty", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_shrimp",
      counts: { raw_shrimp: 1 },
      levels: { cooking: 31 },
      currentTick: 210,
      random: () => 0
    });

    assert(cooking.onStart(ctx), "expected shrimp cooking to start at level 31");
    ctx.currentTick = 211;
    cooking.onTick(ctx);

    assert((ctx._counts.cooked_shrimp || 0) === 1, "expected +30 shrimp cooking to succeed even on a 0 roll");
    assert((ctx._counts.burnt_shrimp || 0) === 0, "expected zero-burn clamp at required level plus thirty");
    assert((ctx._xpBySkill.cooking || 0) === 30, "expected +30 shrimp cooking to grant success XP");
  });

  test("Cooking same-fire hot-swap preserves the active timer and cooks on that tick", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_trout",
      counts: { raw_shrimp: 2, raw_trout: 1 },
      levels: { cooking: 99 },
      currentTick: 100,
      action: "SKILLING: FIRE"
    });

    SkillActionResolution.startProcessingSession(ctx, "cooking", {
      recipeId: "raw_shrimp",
      target: { x: 11, y: 10, z: 0 },
      intervalTicks: 1,
      nextTick: 100
    });

    const handled = cooking.onUseItem(ctx);
    assert(handled, "expected active cooking swap to be handled");
    assert(ctx._queued.length === 0, "same-fire hot-swap should not route back through queued interact");

    const session = SkillActionResolution.getSkillSession(ctx.playerState, "cooking");
    assert(!!session, "expected active cooking session to remain present");
    assert(session.recipeId === "raw_trout", "expected active recipe to swap to the requested raw fish");
    assert(session.nextTick === 100, "expected hot-swap to preserve the ready attempt tick");

    cooking.onTick(ctx);
    assert((ctx._counts.raw_trout || 0) === 0, "expected requested raw fish to be consumed on the same tick");
    assert((ctx._counts.cooked_trout || 0) === 1, "expected cooked output for the swapped fish");
    assert((ctx._xpBySkill.cooking || 0) === 70, "expected trout XP gain on same-tick swap resolution");
    assert(ctx.playerState.action === null, "expected cooking to stop after the swapped input is exhausted");
  });

  test("Cooking same-fire re-click keeps the current recipe session untouched", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_shrimp",
      counts: { raw_shrimp: 2 },
      levels: { cooking: 99 },
      currentTick: 110,
      action: "SKILLING: FIRE"
    });

    SkillActionResolution.startProcessingSession(ctx, "cooking", {
      recipeId: "raw_shrimp",
      target: { x: 11, y: 10, z: 0 },
      intervalTicks: 1,
      nextTick: 110
    });

    const handled = cooking.onUseItem(ctx);
    assert(handled, "expected same-fish re-click to be handled during active cooking");
    assert(ctx._queued.length === 0, "same-fish re-click should not queue a replacement interact");

    const session = SkillActionResolution.getSkillSession(ctx.playerState, "cooking");
    assert(!!session, "expected the active cooking session to remain present");
    assert(session.recipeId === "raw_shrimp", "expected same-fish re-click to keep the active recipe");
    assert(session.nextTick === 110, "expected same-fish re-click not to disturb the ready attempt tick");
    assert(session.target && session.target.x === 11 && session.target.y === 10 && session.target.z === 0, "expected same-fish re-click to keep the current fire target");

    cooking.onTick(ctx);
    assert((ctx._counts.raw_shrimp || 0) === 1, "expected the current shrimp attempt to still consume one input on schedule");
    assert((ctx._counts.cooked_shrimp || 0) === 1, "expected the current shrimp attempt to still produce cooked output");
    assert((ctx._xpBySkill.cooking || 0) === 30, "expected same-fish re-click not to alter the scheduled XP gain");
  });

  test("Cooking same-fire hot-swap keeps the current session when the new fish is under-level", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_swordfish",
      counts: { raw_shrimp: 1, raw_swordfish: 1 },
      levels: { cooking: 1 },
      currentTick: 105,
      action: "SKILLING: FIRE"
    });

    SkillActionResolution.startProcessingSession(ctx, "cooking", {
      recipeId: "raw_shrimp",
      target: { x: 11, y: 10, z: 0 },
      intervalTicks: 1,
      nextTick: 105
    });

    const handled = cooking.onUseItem(ctx);
    assert(handled, "expected recognized under-level swap attempt to be handled");
    assert(ctx._queued.length === 0, "under-level swap should not queue a replacement interact");

    const session = SkillActionResolution.getSkillSession(ctx.playerState, "cooking");
    assert(!!session, "expected existing cooking session to remain");
    assert(session.recipeId === "raw_shrimp", "expected active recipe to stay unchanged when replacement fish is blocked");
    assert(session.nextTick === 105, "expected blocked swap not to disturb the current attempt cadence");
    expectMessage(ctx, "You need Cooking level 40 to cook that.", "under-level hot-swap");
  });

  test("Cooking remains clip-driven and suppresses equipped visuals", () => {
    const ctx = createSkillContext({
      sourceItemId: "raw_shrimp"
    });

    assert(cooking.onAnimate(ctx) === false, "expected cooking animation to remain clip-driven");
    assert(cooking.getAnimationSuppressEquipmentVisual(ctx) === true, "expected cooking to hide equipped visuals during the clip");
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
    console.error("\nCooking runtime QA failures: " + failures.length + " of " + tests.length);
    failures.forEach((failure) => console.error(" - " + failure.name + ": " + failure.error));
    process.exit(1);
  }

  console.log("\nCooking runtime QA passed: " + passed + " tests.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
