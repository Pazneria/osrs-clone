const assert = require("assert");
const path = require("path");
const { loadBrowserScript, loadSkillSpecScripts } = require("./browser-script-test-utils");
const { createSequenceRng } = require("./rng-test-utils");

function createMiningContext(options = {}) {
  const counts = Object.assign({}, options.counts || {});
  const messages = [];
  const xpBySkill = {};
  const nodeMeta = Object.assign({
    oreType: options.oreType || "coal",
    depletedUntilTick: 0,
    successfulYields: 0,
    lastInteractionTick: 0
  }, options.nodeMeta || {});
  const tool = options.tool === null ? null : Object.assign({
    id: "rune_pickaxe",
    toolTier: 28,
    speedBonusTicks: 5
  }, options.tool || {});
  const canAccept = typeof options.canAcceptItemById === "function"
    ? options.canAcceptItemById
    : (() => true);

  const context = {
    targetX: 20,
    targetY: 20,
    targetZ: 0,
    currentTick: Number.isFinite(options.currentTick) ? options.currentTick : 100,
    random: typeof options.random === "function" ? options.random : () => 0,
    playerState: {
      action: options.action || null,
      skillSessions: {}
    },
    getNodeTable: (skillId) => window.SkillSpecRegistry.getNodeTable(skillId),
    getSkillSpec: (skillId) => window.SkillSpecRegistry.getSkillSpec(skillId),
    getSkillLevel: (skillId) => {
      const levels = options.levels || {};
      return Number.isFinite(levels[skillId]) ? levels[skillId] : 99;
    },
    hasToolClass: (toolClass) => toolClass === "pickaxe" && !!tool,
    getBestToolByClass: (toolClass) => (toolClass === "pickaxe" ? tool : null),
    isTargetTile: (tileId) => tileId === 2,
    canAcceptItemById: (itemId, amount) => canAccept(itemId, amount),
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
    startSkillingAction: () => {
      context.playerState.action = "SKILLING: MINING";
    },
    stopAction: () => {
      context.playerState.action = null;
    },
    getRockNodeAt: () => nodeMeta,
    depleteRockNode: (_x, _y, _z, respawnTicks) => {
      nodeMeta.depletedUntilTick = context.currentTick + Math.max(1, respawnTicks || 1);
      nodeMeta.successfulYields = 0;
      nodeMeta.lastInteractionTick = 0;
    },
    requireAreaAccess: () => true
  };

  context._counts = counts;
  context._messages = messages;
  context._xpBySkill = xpBySkill;
  context._nodeMeta = nodeMeta;
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
  loadBrowserScript(root, "src/js/skills/shared/action-resolution.js");

  global.SkillSpecRegistry = window.SkillSpecRegistry;
  global.SkillActionResolution = window.SkillActionResolution;

  loadBrowserScript(root, "src/js/skills/mining/index.js");

  const mining = window.SkillModules && window.SkillModules.mining;
  assert(!!mining, "mining module missing");

  const tests = [];
  function test(name, fn) {
    tests.push({ name, fn });
  }

  test("Mining failed attempts still refresh the rock session timestamp", () => {
    const ctx = createMiningContext({
      oreType: "copper",
      levels: { mining: 1 },
      random: createSequenceRng([0.99])
    });

    assert(mining.onStart(ctx), "expected copper mining to start");
    mining.onTick(ctx);

    assert((ctx._counts.copper_ore || 0) === 0, "expected no copper on a failed attempt");
    assert(ctx._nodeMeta.lastInteractionTick === 100, "failed attempts should still update the rock session timestamp");
    assert(ctx._nodeMeta.successfulYields === 0, "failed attempts should not increase successful yield count");
  });

  test("Coal guarantees two yields before depletion rolls are allowed", () => {
    const ctx = createMiningContext({
      oreType: "coal",
      levels: { mining: 20 },
      random: createSequenceRng([0, 0, 0])
    });

    assert(mining.onStart(ctx), "expected coal mining to start");
    mining.onTick(ctx);
    assert((ctx._counts.coal || 0) === 1, "expected the first coal yield");
    assert(ctx._nodeMeta.depletedUntilTick === 0, "coal should not deplete before reaching its guaranteed minimum");
    assert(ctx._nodeMeta.successfulYields === 1, "coal should track the first successful yield");

    ctx.currentTick += 1;
    mining.onTick(ctx);
    assert((ctx._counts.coal || 0) === 2, "expected the second coal yield");
    assert(ctx._nodeMeta.depletedUntilTick === 113, "coal should deplete on the second yield when the first eligible roll succeeds");
    assert(ctx.playerState.action === null, "mining should stop when the coal rock depletes");
  });

  test("Iron depletes at its hard maximum even if depletion rolls keep failing", () => {
    const ctx = createMiningContext({
      oreType: "iron",
      levels: { mining: 10 },
      random: createSequenceRng([0, 0.99, 0, 0.99, 0])
    });

    assert(mining.onStart(ctx), "expected iron mining to start");
    mining.onTick(ctx);
    assert((ctx._counts.iron_ore || 0) === 1, "expected the first iron yield");
    assert(ctx._nodeMeta.depletedUntilTick === 0, "iron should survive the first failed depletion roll");

    ctx.currentTick += 1;
    mining.onTick(ctx);
    assert((ctx._counts.iron_ore || 0) === 2, "expected the second iron yield");
    assert(ctx._nodeMeta.depletedUntilTick === 0, "iron should survive the second failed depletion roll");

    ctx.currentTick += 1;
    mining.onTick(ctx);
    assert((ctx._counts.iron_ore || 0) === 3, "expected the third iron yield");
    assert(ctx._nodeMeta.depletedUntilTick === 111, "iron should force-deplete at its maximum yield cap");
    assert(ctx.playerState.action === null, "mining should stop when the iron cap depletes the rock");
  });

  test("Mining rock sessions expire after fifty idle ticks", () => {
    const ctx = createMiningContext({
      oreType: "coal",
      levels: { mining: 20 },
      random: createSequenceRng([0, 0])
    });

    assert(mining.onStart(ctx), "expected coal mining to start");
    mining.onTick(ctx);
    assert((ctx._counts.coal || 0) === 1, "expected the first coal yield");
    assert(ctx._nodeMeta.successfulYields === 1, "expected the coal session to record one successful yield");

    ctx.currentTick += 52;
    mining.onTick(ctx);
    assert((ctx._counts.coal || 0) === 2, "expected coal mining to resume after idling");
    assert(ctx._nodeMeta.depletedUntilTick === 0, "coal should not deplete after the idle reset on what becomes the new first yield");
    assert(ctx._nodeMeta.successfulYields === 1, "idle expiry should reset the successful yield count before the next success");
    assert(ctx._nodeMeta.lastInteractionTick === 152, "idle-resumed mining should stamp the new attempt tick");
  });

  test("Rune essence stays persistent across repeated success ticks", () => {
    const ctx = createMiningContext({
      oreType: "rune_essence",
      levels: { mining: 1 },
      random: createSequenceRng([0, 0, 0])
    });

    assert(mining.onStart(ctx), "expected rune essence mining to start");
    mining.onTick(ctx);
    ctx.currentTick += 1;
    mining.onTick(ctx);
    ctx.currentTick += 1;
    mining.onTick(ctx);

    assert((ctx._counts.rune_essence || 0) === 3, "expected repeated rune essence yields");
    assert(ctx._nodeMeta.depletedUntilTick === 0, "persistent rune essence should never deplete");
    assert(ctx._nodeMeta.successfulYields === 0, "persistent rune essence should not accumulate depletion-session state");
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
    console.error("\nMining runtime QA failures: " + failures.length + " of " + tests.length);
    failures.forEach((failure) => console.error(" - " + failure.name + ": " + failure.error));
    process.exit(1);
  }

  console.log("\nMining runtime QA passed: " + passed + " tests.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
