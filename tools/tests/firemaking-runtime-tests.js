const assert = require("assert");
const path = require("path");
const { loadBrowserScript, loadSkillSpecScripts } = require("./browser-script-test-utils");
const { countMessages, expectMessage } = require("./message-test-utils");

function createFiremakingContext(options = {}) {
  const counts = Object.assign({}, options.counts || {});
  const messages = [];
  const xpBySkill = {};
  const activeFires = Array.isArray(options.activeFires)
    ? options.activeFires.map((fire) => ({ x: fire.x, y: fire.y, z: fire.z }))
    : [];
  const beforeSteps = Array.isArray(options.beforeSteps) ? options.beforeSteps.slice() : [];
  const afterSteps = Array.isArray(options.afterSteps) ? options.afterSteps.slice() : [];
  const defaultZ = Number.isFinite(options.z) ? options.z : 0;

  const context = {
    sourceItemId: options.sourceItemId || "logs",
    targetObj: options.targetObj || "GROUND",
    currentTick: Number.isFinite(options.currentTick) ? options.currentTick : 0,
    random: typeof options.random === "function" ? options.random : () => 0,
    playerState: {
      x: Number.isFinite(options.x) ? options.x : 10,
      y: Number.isFinite(options.y) ? options.y : 10,
      z: defaultZ,
      action: options.action || null,
      firemakingSession: options.firemakingSession || null,
      turnLock: false,
      actionVisualReady: true
    },
    getRecipeSet: (skillId) => window.SkillSpecRegistry.getRecipeSet(skillId),
    getSkillSpec: (skillId) => window.SkillSpecRegistry.getSkillSpec(skillId),
    getSkillLevel: (skillId) => {
      const levels = options.levels || {};
      return Number.isFinite(levels[skillId]) ? levels[skillId] : 99;
    },
    requireSkillLevel: (requiredLevel, meta = {}) => {
      const levels = options.levels || {};
      const level = Number.isFinite(levels.firemaking) ? levels.firemaking : 99;
      if (level >= requiredLevel) return true;
      const action = typeof meta.action === "string" && meta.action ? meta.action : "do that";
      messages.push({
        message: `You need Firemaking level ${requiredLevel} to ${action}.`,
        tone: meta.tone || "warn"
      });
      return false;
    },
    getInventoryCount: (itemId) => counts[itemId] || 0,
    removeOneItemById: (itemId) => {
      const available = counts[itemId] || 0;
      if (available <= 0) return false;
      counts[itemId] = available - 1;
      if (counts[itemId] <= 0) delete counts[itemId];
      return true;
    },
    addSkillXp: (skillId, amount) => {
      xpBySkill[skillId] = (xpBySkill[skillId] || 0) + amount;
    },
    addChatMessage: (message, tone) => {
      messages.push({ message, tone });
    },
    haltMovement: () => {
      context.playerState.action = "IDLE";
      context.playerState.turnLock = false;
      context.playerState.actionVisualReady = true;
    },
    stopAction: () => {
      context.playerState.action = null;
    },
    hasActiveFireAt: (x, y, z) => activeFires.some((fire) => fire.x === x && fire.y === y && fire.z === z),
    lightFireAtCurrentTile: (x, y, z) => {
      if (activeFires.some((fire) => fire.x === x && fire.y === y && fire.z === z)) return false;
      activeFires.push({ x, y, z });
      return true;
    },
    renderInventory: () => {
      context._renderCount += 1;
    }
  };

  function consumeStep(queue) {
    const next = queue.length > 0 ? queue.shift() : {
      stepped: true,
      x: context.playerState.x + 1,
      y: context.playerState.y,
      z: context.playerState.z
    };

    if (next === false) return { stepped: false, reason: "blocked_tile" };
    if (next === true) {
      context.playerState.x += 1;
      return {
        stepped: true,
        x: context.playerState.x,
        y: context.playerState.y,
        z: context.playerState.z
      };
    }

    if (!next || typeof next !== "object" || next.stepped === false) {
      return {
        stepped: false,
        reason: next && typeof next.reason === "string" ? next.reason : "blocked_tile"
      };
    }

    const x = Number.isFinite(next.x) ? next.x : context.playerState.x;
    const y = Number.isFinite(next.y) ? next.y : context.playerState.y;
    const z = Number.isFinite(next.z) ? next.z : context.playerState.z;
    context.playerState.x = x;
    context.playerState.y = y;
    context.playerState.z = z;
    return { stepped: true, x, y, z };
  }

  context.tryStepBeforeFiremaking = () => consumeStep(beforeSteps);
  context.tryStepAfterFire = () => consumeStep(afterSteps);

  context._counts = counts;
  context._messages = messages;
  context._xpBySkill = xpBySkill;
  context._activeFires = activeFires;
  context._renderCount = 0;
  return context;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");

  global.window = {};
  window.SkillSharedUtils = {
    rollChance: (chance, rng) => (typeof rng === "function" ? rng() : Math.random()) < chance
  };
  global.SkillSharedUtils = window.SkillSharedUtils;

  loadSkillSpecScripts(root);
  loadBrowserScript(root, "src/js/skills/spec-registry.js");

  global.SkillSpecRegistry = window.SkillSpecRegistry;

  loadBrowserScript(root, "src/js/skills/firemaking/index.js");

  const firemaking = window.SkillModules && window.SkillModules.firemaking;
  assert(!!firemaking, "firemaking module missing");

  const tests = [];
  function test(name, fn) {
    tests.push({ name, fn });
  }

  test("Firemaking item use only starts from an inventory tinderbox/log pair", () => {
    const groundCtx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 1 },
      sourceItemId: "tinderbox",
      targetObj: "GROUND"
    });
    let groundStartAttempts = 0;
    groundCtx.startSkillById = () => {
      groundStartAttempts += 1;
      return true;
    };

    assert(!firemaking.onUseItem(groundCtx), "tinderbox use on plain ground should not start firemaking");
    assert(groundStartAttempts === 0, "plain ground firemaking use should not queue a skill start");

    const inventoryCtx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 1 },
      sourceItemId: "tinderbox",
      targetObj: "INVENTORY"
    });
    const payloads = [];
    inventoryCtx.targetUid = { sourceItemId: "tinderbox", targetItemId: "logs" };
    inventoryCtx.startSkillById = (skillId, payload) => {
      payloads.push({ skillId, payload });
      return true;
    };

    assert(firemaking.onUseItem(inventoryCtx), "tinderbox use directly on inventory logs should start firemaking");
    assert(payloads.length === 1, "inventory tinderbox/log use should queue one skill start");
    assert(payloads[0].skillId === "firemaking", "inventory tinderbox/log use should start firemaking");
    assert(payloads[0].payload.sourceItemId === "logs", "inventory tinderbox/log use should preserve the log item id");
    assert(payloads[0].payload.targetObj === "GROUND", "firemaking should still light logs on the player's tile after inventory use");
  });

  test("Firemaking chains into the next tile after the success clip", () => {
    const ctx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 3 },
      sourceItemId: "logs",
      currentTick: 100,
      random: () => 0,
      beforeSteps: [{ stepped: true, x: 11, y: 10, z: 0 }],
      afterSteps: [{ stepped: true, x: 12, y: 10, z: 0 }]
    });

    assert(firemaking.onStart(ctx), "expected firemaking to start");
    let session = ctx.playerState.firemakingSession;
    assert(!!session, "expected an active firemaking session");
    assert(session.target.x === 10 && session.target.y === 10, "expected first fire target to stay on the original tile");
    assert(session.standAt.x === 11 && session.standAt.y === 10, "expected start step to place the player beside the fire tile");

    firemaking.onTick(ctx);
    session = ctx.playerState.firemakingSession;
    assert(!!session, "expected session to remain active after a success");
    assert(session.phase === "post_success", "expected successful firemaking to enter the success-clip phase");
    assert((ctx._counts.logs || 0) === 2, "expected one log to be consumed on success");
    assert((ctx._xpBySkill.firemaking || 0) === 40, "expected logs to award their firemaking XP");
    assert(ctx._activeFires.some((fire) => fire.x === 10 && fire.y === 10 && fire.z === 0), "expected the lit fire to exist on the target tile");

    ctx.currentTick = 103;
    firemaking.onTick(ctx);

    session = ctx.playerState.firemakingSession;
    assert(!!session, "expected the session to continue after the success clip");
    assert(ctx.playerState.action === "SKILLING: FIREMAKING", "expected firemaking action to stay active for the repeat chain");
    assert(ctx.playerState.x === 12 && ctx.playerState.y === 10, "expected repeat firemaking to step to the next stand tile");
    assert(session.phase === "attempting", "expected the chain to resume the attempting phase");
    assert(session.target.x === 11 && session.target.y === 10, "expected the next fire to target the tile the player just left");
    assert(session.standAt.x === 12 && session.standAt.y === 10, "expected the new stand tile to match the post-success step");
    assert(session.nextAttemptTick === 104, "expected the next ignition attempt to resume on the next attempt tick");
  });

  test("Firemaking shows first-failure feedback only once per target log", () => {
    const ctx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 1 },
      sourceItemId: "logs",
      currentTick: 200,
      random: () => 0.99,
      beforeSteps: [{ stepped: true, x: 11, y: 10, z: 0 }]
    });

    assert(firemaking.onStart(ctx), "expected firemaking to start");
    firemaking.onTick(ctx);
    firemaking.onTick(ctx);

    expectMessage(ctx, "The logs fail to catch.", "firemaking failure feedback");
    assert(countMessages(ctx, "The logs fail to catch.") === 1, "expected failure feedback to be rate-limited to the first failed attempt");
    assert((ctx._counts.logs || 0) === 1, "expected failed ignition attempts not to consume logs");
    assert((ctx._activeFires || []).length === 0, "expected failed ignition attempts not to create fires");
  });

  test("Firemaking stops cleanly when the player moves away from the stand tile", () => {
    const ctx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 1 },
      sourceItemId: "logs",
      currentTick: 220,
      beforeSteps: [{ stepped: true, x: 11, y: 10, z: 0 }]
    });

    assert(firemaking.onStart(ctx), "expected firemaking to start");
    ctx.playerState.x = 15;
    firemaking.onTick(ctx);

    assert(ctx.playerState.action === null, "expected firemaking to stop after movement interruption");
    assert(ctx.playerState.firemakingSession === null, "expected the firemaking session to clear after movement interruption");
    expectMessage(ctx, "You stop lighting the logs.", "firemaking movement interruption");
  });

  test("Firemaking stops with a pacing message when the follow-up step is blocked", () => {
    const ctx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 2 },
      sourceItemId: "logs",
      currentTick: 300,
      random: () => 0,
      beforeSteps: [{ stepped: true, x: 11, y: 10, z: 0 }],
      afterSteps: [{ stepped: false, reason: "fire_occupied" }]
    });

    assert(firemaking.onStart(ctx), "expected firemaking to start");
    firemaking.onTick(ctx);

    ctx.currentTick = 303;
    firemaking.onTick(ctx);

    assert(ctx.playerState.action === null, "expected firemaking to stop when the follow-up step is blocked");
    assert(ctx.playerState.firemakingSession === null, "expected blocked repeat firemaking to clear the session");
    expectMessage(ctx, "You stay put because another fire is in the way.", "firemaking blocked follow-up");
    assert((ctx._counts.logs || 0) === 1, "expected the blocked follow-up to stop before consuming another log");
  });

  test("Firemaking stops after the success clip when no logs remain for the next fire", () => {
    const ctx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 1 },
      sourceItemId: "logs",
      currentTick: 340,
      random: () => 0,
      beforeSteps: [{ stepped: true, x: 11, y: 10, z: 0 }],
      afterSteps: [{ stepped: true, x: 12, y: 10, z: 0 }]
    });

    assert(firemaking.onStart(ctx), "expected firemaking to start");
    firemaking.onTick(ctx);

    ctx.currentTick = 343;
    firemaking.onTick(ctx);

    assert(ctx.playerState.action === null, "expected firemaking to stop when the chain has no logs left");
    assert(ctx.playerState.firemakingSession === null, "expected the session to clear when chained firemaking runs out of logs");
    assert(ctx.playerState.x === 12 && ctx.playerState.y === 10, "expected the post-success step to happen before the supply check stops the chain");
    expectMessage(ctx, "You have run out of logs.", "firemaking chained supply exhaustion");
    assert((ctx._counts.logs || 0) === 0, "expected no additional logs to be consumed after the successful fire");
    assert(ctx._activeFires.length === 1, "expected supply exhaustion to stop before a second fire is lit");
  });

  test("Firemaking stops after the success clip when the tinderbox is lost before the next fire", () => {
    const ctx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 2 },
      sourceItemId: "logs",
      currentTick: 360,
      random: () => 0,
      beforeSteps: [{ stepped: true, x: 11, y: 10, z: 0 }],
      afterSteps: [{ stepped: true, x: 12, y: 10, z: 0 }]
    });

    assert(firemaking.onStart(ctx), "expected firemaking to start");
    firemaking.onTick(ctx);

    delete ctx._counts.tinderbox;
    ctx.currentTick = 363;
    firemaking.onTick(ctx);

    assert(ctx.playerState.action === null, "expected firemaking to stop when the tinderbox is missing for the chained fire");
    assert(ctx.playerState.firemakingSession === null, "expected the session to clear when the tinderbox disappears between chained fires");
    assert(ctx.playerState.x === 12 && ctx.playerState.y === 10, "expected the post-success step to happen before the chained tinderbox check");
    expectMessage(ctx, "You need logs and a tinderbox.", "firemaking chained tinderbox exhaustion");
    assert((ctx._counts.logs || 0) === 1, "expected the chained tinderbox failure to stop before consuming another log");
    assert(ctx._activeFires.length === 1, "expected tinderbox loss to stop the chain before a second fire is lit");
  });

  test("Firemaking shows failure feedback again after a successful chain advances to a new target", () => {
    const rolls = [0.99, 0, 0.99, 0.99];
    const ctx = createFiremakingContext({
      counts: { tinderbox: 1, logs: 2 },
      sourceItemId: "logs",
      currentTick: 400,
      random: () => (rolls.length > 0 ? rolls.shift() : 0.99),
      beforeSteps: [{ stepped: true, x: 11, y: 10, z: 0 }],
      afterSteps: [{ stepped: true, x: 12, y: 10, z: 0 }]
    });

    assert(firemaking.onStart(ctx), "expected firemaking to start");

    firemaking.onTick(ctx);
    expectMessage(ctx, "The logs fail to catch.", "initial firemaking failure feedback");
    assert(countMessages(ctx, "The logs fail to catch.") === 1, "expected the first target to emit one failure message");

    ctx.currentTick = 401;
    firemaking.onTick(ctx);
    assert(ctx.playerState.firemakingSession.phase === "post_success", "expected the original target to eventually succeed");

    ctx.currentTick = 404;
    firemaking.onTick(ctx);

    ctx.currentTick = 405;
    firemaking.onTick(ctx);
    firemaking.onTick(ctx);

    assert(countMessages(ctx, "The logs fail to catch.") === 2, "expected chained firemaking to emit failure feedback again for the new target");
    assert(ctx.playerState.firemakingSession.phase === "attempting", "expected the chained failure to keep the session active");
    assert((ctx._counts.logs || 0) === 1, "expected only the successful fire to consume a log before the chained failures");
    assert(ctx._activeFires.length === 1, "expected only the successful ignition to create a fire");
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
    console.error("\nFiremaking runtime QA failures: " + failures.length + " of " + tests.length);
    failures.forEach((failure) => console.error(" - " + failure.name + ": " + failure.error));
    process.exit(1);
  }

  console.log("\nFiremaking runtime QA passed: " + passed + " tests.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
