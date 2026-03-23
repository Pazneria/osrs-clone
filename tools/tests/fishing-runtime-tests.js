const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approxEq(actual, expected, epsilon = 1e-9) {
  return Math.abs(actual - expected) <= epsilon;
}

function loadBrowserScript(root, relPath) {
  const abs = path.join(root, relPath);
  const code = fs.readFileSync(abs, "utf8");
  vm.runInThisContext(code, { filename: abs });
}

function createSequenceRng(values) {
  const queue = Array.isArray(values) ? values.slice() : [];
  return () => {
    if (queue.length === 0) return 0;
    return queue.shift();
  };
}

function createFishingContext(options = {}) {
  const counts = Object.assign({}, options.counts || {});
  const messages = [];
  const xpBySkill = {};
  const queued = [];
  const renders = { inventory: 0 };
  const targetX = Number.isFinite(options.targetX) ? options.targetX : 12;
  const targetY = Number.isFinite(options.targetY) ? options.targetY : 12;
  const waterId = options.waterId === "deep_water" ? "deep_water" : "shallow_water";
  const tileId = waterId === "deep_water" ? 22 : 21;
  const equipment = Object.assign({}, options.equipment || {});

  const context = {
    targetObj: "WATER",
    targetUid: options.targetUid || null,
    targetX,
    targetY,
    currentTick: Number.isFinite(options.currentTick) ? options.currentTick : 100,
    random: typeof options.random === "function" ? options.random : () => 0,
    equipment,
    playerState: {
      action: options.action || null,
      skillSessions: {}
    },
    getNodeTable: (skillId) => window.SkillSpecRegistry.getNodeTable(skillId),
    getSkillSpec: (skillId) => window.SkillSpecRegistry.getSkillSpec(skillId),
    getSkillLevel: (skillId) => {
      const levels = options.levels || {};
      return Number.isFinite(levels[skillId]) ? levels[skillId] : 1;
    },
    requireSkillLevel: (requiredLevel, meta = {}) => {
      const skillId = meta.skillId || "fishing";
      const level = context.getSkillLevel(skillId);
      if (level >= requiredLevel) return true;
      const action = meta.action || "do that";
      messages.push({
        message: `You need Fishing level ${requiredLevel} to ${action}.`,
        tone: meta.tone || "warn"
      });
      return false;
    },
    hasItem: (itemId) => (counts[itemId] || 0) > 0,
    getInventoryCount: (itemId) => counts[itemId] || 0,
    canAcceptItemById: typeof options.canAcceptItemById === "function"
      ? options.canAcceptItemById
      : (() => true),
    giveItemById: (itemId, amount) => {
      counts[itemId] = (counts[itemId] || 0) + amount;
      return amount;
    },
    removeItemsById: (itemId, amount) => {
      const next = Math.max(0, (counts[itemId] || 0) - Math.max(0, amount || 0));
      if (next <= 0) delete counts[itemId];
      else counts[itemId] = next;
    },
    removeOneItemById: (itemId) => {
      const next = Math.max(0, (counts[itemId] || 0) - 1);
      if (next <= 0) delete counts[itemId];
      else counts[itemId] = next;
      return true;
    },
    addSkillXp: (skillId, amount) => {
      xpBySkill[skillId] = (xpBySkill[skillId] || 0) + amount;
    },
    addChatMessage: (message, tone) => {
      messages.push({ message, tone });
    },
    renderInventory: () => {
      renders.inventory += 1;
    },
    startSkillingAction: () => {
      context.playerState.action = "SKILLING: FISHING";
    },
    stopAction: () => {
      context.playerState.action = null;
    },
    queueInteractAt: (obj, x, y, targetUid = null) => {
      queued.push({ obj, x, y, targetUid });
    },
    spawnClickMarker: () => {},
    isTargetTile: (candidateTileId) => candidateTileId === tileId
  };

  context._counts = counts;
  context._messages = messages;
  context._xpBySkill = xpBySkill;
  context._queued = queued;
  context._renders = renders;
  context._waterId = waterId;
  return context;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");

  global.window = {};
  window.SkillSharedUtils = {
    rollChance: (chance, rng) => (typeof rng === "function" ? rng() : Math.random()) < chance
  };
  global.SkillSharedUtils = window.SkillSharedUtils;

  loadBrowserScript(root, "src/js/skills/specs.js");
  loadBrowserScript(root, "src/js/skills/spec-registry.js");
  loadBrowserScript(root, "src/js/skills/shared/action-resolution.js");

  global.SkillSpecRegistry = window.SkillSpecRegistry;
  global.SkillActionResolution = window.SkillActionResolution;

  loadBrowserScript(root, "src/js/skills/fishing/index.js");

  const fishing = window.SkillModules && window.SkillModules.fishing;
  assert(!!fishing, "fishing module missing");

  const tests = [];
  function test(name, fn) {
    tests.push({ name, fn });
  }

  test("Rod level 10 uses method-unlock catch scaling", () => {
    const ctx = createFishingContext({
      counts: { fishing_rod: 1, bait: 1 },
      levels: { fishing: 10 }
    });

    assert(fishing.onStart(ctx), "expected rod fishing to start at level 10");
    assert(approxEq(ctx.playerState.fishingCatchChance, 0.28), "rod level 10 should use 28% catch chance from method unlock");
  });

  test("Harpoon level 30 uses the authored method base catch chance", () => {
    const ctx = createFishingContext({
      counts: { harpoon: 1 },
      levels: { fishing: 30 }
    });

    assert(fishing.onStart(ctx), "expected harpoon fishing to start at level 30");
    assert(approxEq(ctx.playerState.fishingCatchChance, 0.32), "harpoon level 30 should use the 32% method base");
  });

  test("Deep-water harpoon methods use the 36% authored base catch chance", () => {
    const mixedCtx = createFishingContext({
      waterId: "deep_water",
      counts: { harpoon: 1 },
      levels: { fishing: 40 }
    });
    assert(fishing.onStart(mixedCtx), "expected deep mixed harpoon fishing to start");
    assert(approxEq(mixedCtx.playerState.fishingCatchChance, 0.36), "deep mixed harpoon should use the 36% base");

    const runeCtx = createFishingContext({
      waterId: "deep_water",
      counts: { rune_harpoon: 1 },
      levels: { fishing: 40 }
    });
    assert(fishing.onStart(runeCtx), "expected deep rune-harpoon fishing to start");
    assert(approxEq(runeCtx.playerState.fishingCatchChance, 0.36), "deep rune harpoon should use the 36% base");
  });

  test("Rod bait is consumed only on successful catches", () => {
    const ctx = createFishingContext({
      counts: { fishing_rod: 1, bait: 2 },
      levels: { fishing: 10 },
      random: createSequenceRng([0, 0.99, 0, 0])
    });

    assert(fishing.onStart(ctx), "expected rod fishing to start");

    fishing.onTick(ctx);
    assert((ctx._counts.bait || 0) === 2, "failed rod attempts should not consume bait");
    assert((ctx._counts.raw_trout || 0) === 0, "failed rod attempts should not produce fish");

    ctx.currentTick += 3;
    fishing.onTick(ctx);
    assert((ctx._counts.bait || 0) === 1, "successful rod catches should consume one bait");
    assert((ctx._counts.raw_trout || 0) === 1, "successful rod catches should produce trout at level 10");
    assert((ctx._xpBySkill.fishing || 0) === 50, "successful rod catches should award trout XP");
    assert(ctx._renders.inventory === 1, "successful rod catches should refresh inventory after bait consumption");
  });

  test("Deep mixed harpoon can roll both tuna and swordfish from the authored weights", () => {
    const tunaCtx = createFishingContext({
      waterId: "deep_water",
      counts: { harpoon: 1 },
      levels: { fishing: 40 },
      random: createSequenceRng([0, 0])
    });
    assert(fishing.onStart(tunaCtx), "expected deep mixed harpoon fishing to start for tuna roll");
    fishing.onTick(tunaCtx);
    assert((tunaCtx._counts.raw_tuna || 0) === 1, "deep mixed harpoon should be able to roll tuna");
    assert((tunaCtx._counts.raw_swordfish || 0) === 0, "tuna roll should not also award swordfish");

    const swordCtx = createFishingContext({
      waterId: "deep_water",
      counts: { harpoon: 1 },
      levels: { fishing: 40 },
      random: createSequenceRng([0.95, 0])
    });
    assert(fishing.onStart(swordCtx), "expected deep mixed harpoon fishing to start for swordfish roll");
    fishing.onTick(swordCtx);
    assert((swordCtx._counts.raw_swordfish || 0) === 1, "deep mixed harpoon should be able to roll swordfish");
    assert((swordCtx._counts.raw_tuna || 0) === 0, "swordfish roll should not also award tuna");
  });

  test("Deep rune harpoon yields swordfish only", () => {
    const ctx = createFishingContext({
      waterId: "deep_water",
      counts: { rune_harpoon: 1 },
      levels: { fishing: 40 },
      random: createSequenceRng([0.99, 0])
    });

    assert(fishing.onStart(ctx), "expected deep rune-harpoon fishing to start");
    fishing.onTick(ctx);
    assert((ctx._counts.raw_swordfish || 0) === 1, "deep rune harpoon should produce swordfish");
    assert((ctx._counts.raw_tuna || 0) === 0, "deep rune harpoon should never produce tuna");
    assert((ctx._xpBySkill.fishing || 0) === 100, "deep rune harpoon should award swordfish XP");
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
    console.error("\nFishing runtime QA failures: " + failures.length + " of " + tests.length);
    failures.forEach((failure) => console.error(" - " + failure.name + ": " + failure.error));
    process.exit(1);
  }

  console.log("\nFishing runtime QA passed: " + passed + " tests.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
