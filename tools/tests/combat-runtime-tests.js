const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBrowserScript(root, relPath) {
  const abs = path.join(root, relPath);
  const code = fs.readFileSync(abs, "utf8");
  vm.runInThisContext(code, { filename: abs });
}

function createEnemyDefinition(enemyId, overrides = {}) {
  const displayName = overrides.displayName || enemyId;
  const attack = Number.isFinite(overrides.attack) ? overrides.attack : 10;
  const strength = Number.isFinite(overrides.strength) ? overrides.strength : attack;
  const defense = Number.isFinite(overrides.defense) ? overrides.defense : attack;
  const hitpoints = Number.isFinite(overrides.hitpoints) ? overrides.hitpoints : 10;
  return {
    enemyId,
    displayName,
    stats: { attack, strength, defense, hitpoints },
    behavior: {
      aggroType: overrides.aggroType || "passive",
      aggroRadius: Number.isFinite(overrides.aggroRadius) ? overrides.aggroRadius : 6,
      chaseRange: Number.isFinite(overrides.chaseRange) ? overrides.chaseRange : 8,
      roamingRadius: Number.isFinite(overrides.roamingRadius) ? overrides.roamingRadius : 0,
      defaultMovementSpeed: 1,
      combatMovementSpeed: 1
    },
    appearance: {
      facingYaw: Math.PI
    },
    respawnTicks: 5,
    dropTable: []
  };
}

function createSpawnNode(spawnNodeId, enemyId, x, y, z = 0) {
  return {
    spawnNodeId,
    enemyId,
    spawnTile: { x, y, z },
    spawnEnabled: true,
    facingYaw: Math.PI
  };
}

function createGrid(size, value) {
  return Array.from({ length: size }, () => Array(size).fill(value));
}

const runtimeState = {
  enemyDefs: Object.create(null),
  spawnNodes: [],
  playerSnapshot: null,
  enemySnapshots: Object.create(null),
  rollOpposedHitCheck: () => true,
  rollDamage: () => 1,
  pathResolver: null
};

function ensureCombatRuntimeLoaded(root) {
  if (global.__combatRuntimeTestsLoaded) return;

  global.window = {};
  global.TICK_RATE_MS = 600;
  global.MAP_SIZE = 20;
  global.PLANES = 1;
  global.TileId = {
    FLOOR: 0,
    SOLID_NPC: 1,
    SHOP_COUNTER: 2,
    BANK_BOOTH: 3,
    WATER_SHALLOW: 21,
    STAIRS_RAMP: 30
  };
  global.isWaterTileId = (tileId) => tileId === TileId.WATER_SHALLOW;
  global.isWalkableTileId = (tileId) => tileId !== TileId.SOLID_NPC;
  global.logicalMap = [createGrid(MAP_SIZE, TileId.FLOOR)];
  global.heightMap = [createGrid(MAP_SIZE, 0)];
  global.environmentMeshes = [];
  global.scene = null;
  global.THREE = undefined;
  global.playerRig = null;
  global.isRunning = false;
  global.currentTick = 1;
  global.playerSkills = {};
  global.equipment = {};
  global.playerState = {};
  global.spawnHitsplat = () => {};
  global.spawnGroundItem = () => {};
  global.addSkillXp = () => {};
  global.addChatMessage = () => {};
  global.clearMinimapDestination = () => {};
  global.getCurrentHitpoints = () => playerState.currentHitpoints;
  global.getMaxHitpoints = () => 10;
  global.applyHitpointDamage = (damageAmount, minHitpoints = 0) => {
    const next = Math.max(minHitpoints, playerState.currentHitpoints - Math.max(0, damageAmount || 0));
    const dealt = playerState.currentHitpoints - next;
    playerState.currentHitpoints = next;
    return dealt;
  };

  window.GameSessionRuntime = {
    resolveCurrentWorldId() {
      return "main_overworld";
    }
  };
  window.WorldBootstrapRuntime = {
    getCurrentWorldId() {
      return "main_overworld";
    }
  };
  window.LegacyWorldAdapterRuntime = {
    resolveKnownWorldId(rawWorldId, fallbackWorldId) {
      return rawWorldId || fallbackWorldId || "main_overworld";
    },
    getWorldDefaultSpawn() {
      return { x: 5, y: 5, z: 0 };
    }
  };
  window.CombatRuntime = {
    getEnemyTypeDefinition(enemyId) {
      return runtimeState.enemyDefs[String(enemyId || "").trim()] || null;
    },
    getWorldCombatSpawnNodes() {
      return runtimeState.spawnNodes.slice();
    },
    listEnemySpawnNodesForWorld() {
      return runtimeState.spawnNodes.slice();
    },
    createEnemyRuntimeState(spawnNode) {
      const definition = runtimeState.enemyDefs[spawnNode.enemyId];
      if (!definition) throw new Error(`Unknown enemy definition '${spawnNode.enemyId}'`);
      const spawnTile = spawnNode.spawnTile;
      return {
        runtimeId: spawnNode.spawnNodeId,
        spawnNodeId: spawnNode.spawnNodeId,
        enemyId: definition.enemyId,
        x: spawnTile.x,
        y: spawnTile.y,
        z: spawnTile.z,
        currentHealth: definition.stats.hitpoints,
        currentState: "idle",
        lockedTargetId: null,
        remainingAttackCooldown: 0,
        resolvedHomeTile: { x: spawnTile.x, y: spawnTile.y, z: spawnTile.z },
        resolvedSpawnTile: { x: spawnTile.x, y: spawnTile.y, z: spawnTile.z },
        resolvedRoamingRadius: definition.behavior.roamingRadius,
        resolvedChaseRange: definition.behavior.chaseRange,
        resolvedAggroRadius: definition.behavior.aggroRadius,
        defaultMovementSpeed: 1,
        combatMovementSpeed: 1,
        facingYaw: Math.PI,
        lastDamagerId: null
      };
    },
    computePlayerMeleeCombatSnapshot() {
      return runtimeState.playerSnapshot || {
        canAttack: true,
        attackValue: 100,
        defenseValue: 10,
        maxHit: 1,
        attackRange: 1,
        attackTickCycle: 4
      };
    },
    computeEnemyMeleeCombatSnapshot(enemyDefinition) {
      return runtimeState.enemySnapshots[enemyDefinition.enemyId] || {
        attackValue: 100,
        defenseValue: 1,
        maxHit: 1,
        attackRange: 1,
        attackTickCycle: 4
      };
    },
    rollOpposedHitCheck(attackValue, defenseValue) {
      return runtimeState.rollOpposedHitCheck(attackValue, defenseValue);
    },
    rollDamage(maxHit) {
      return runtimeState.rollDamage(maxHit);
    },
    decrementCooldown(cooldown) {
      const value = Number.isFinite(cooldown) ? Math.floor(cooldown) : 0;
      return Math.max(0, value - 1);
    },
    isWithinMeleeRange(a, b) {
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1;
    },
    isWithinSquareRange(a, b, range) {
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= range;
    }
  };

  global.findPath = function findPath(startX, startY, targetX, targetY, forceAdjacent, interactionObj, pathOptions) {
    if (typeof runtimeState.pathResolver === "function") {
      return runtimeState.pathResolver(startX, startY, targetX, targetY, forceAdjacent, interactionObj, pathOptions) || [];
    }
    const dx = targetX > startX ? 1 : (targetX < startX ? -1 : 0);
    const dy = targetY > startY ? 1 : (targetY < startY ? -1 : 0);
    if (dx === 0 && dy === 0) return [];
    return [{ x: startX + dx, y: startY + dy }];
  };

  loadBrowserScript(root, "src/js/combat-qa-debug-runtime.js");
  loadBrowserScript(root, "src/js/combat-hud-runtime.js");
  loadBrowserScript(root, "src/js/combat-enemy-movement-runtime.js");
  loadBrowserScript(root, "src/js/combat-enemy-render-runtime.js");
  loadBrowserScript(root, "src/js/combat-enemy-overlay-runtime.js");
  loadBrowserScript(root, "src/js/combat.js");
  global.__combatRuntimeTestsLoaded = true;
}

function resetCombatEnvironment(options = {}) {
  runtimeState.enemyDefs = Object.create(null);
  const definitions = options.enemyDefs || {};
  Object.keys(definitions).forEach((enemyId) => {
    runtimeState.enemyDefs[enemyId] = definitions[enemyId];
  });
  runtimeState.spawnNodes = (options.spawnNodes || []).slice();
  runtimeState.playerSnapshot = options.playerSnapshot || {
    canAttack: true,
    attackValue: 100,
    defenseValue: 10,
    maxHit: 1,
    attackRange: 1,
    attackTickCycle: 4
  };
  runtimeState.enemySnapshots = Object.assign(Object.create(null), options.enemySnapshots || {});
  runtimeState.rollOpposedHitCheck = typeof options.rollOpposedHitCheck === "function"
    ? options.rollOpposedHitCheck
    : (() => true);
  runtimeState.rollDamage = typeof options.rollDamage === "function"
    ? options.rollDamage
    : (() => 1);
  runtimeState.pathResolver = typeof options.pathResolver === "function"
    ? options.pathResolver
    : null;

  global.logicalMap = [createGrid(MAP_SIZE, TileId.FLOOR)];
  global.heightMap = [createGrid(MAP_SIZE, 0)];
  global.currentTick = Number.isFinite(options.currentTick) ? options.currentTick : 1;
  global.isRunning = !!options.isRunning;
  global.environmentMeshes = [];
  window.__qaCombatDebugLastClearReason = null;
  window.__qaCombatDebugLastClearTick = null;
  window.__qaCombatDebugLastEnemyAttackResult = null;
  window.__qaCombatDebugLastPlayerPursuitState = null;
  window.__qaCombatDebugLastAutoRetaliateSelection = null;

  global.playerSkills = {
    attack: { level: 40, xp: 0 },
    strength: { level: 40, xp: 0 },
    defense: { level: 40, xp: 0 },
    hitpoints: { level: 10, xp: 0 }
  };
  global.equipment = {};
  global.playerState = Object.assign({
    x: 5,
    y: 5,
    z: 0,
    prevX: 5,
    prevY: 5,
    midX: null,
    midY: null,
    targetX: 5,
    targetY: 5,
    targetRotation: 0,
    path: [],
    action: "IDLE",
    targetObj: null,
    targetUid: null,
    combatTargetKind: null,
    lockedTargetId: null,
    remainingAttackCooldown: 0,
    currentHitpoints: 10,
    inCombat: false,
    selectedMeleeStyle: "attack",
    lastAttackTick: null,
    lastDamagerEnemyId: null,
    autoRetaliateEnabled: true,
    actionVisualReady: true,
    turnLock: false,
    eatingCooldownEndTick: 0
  }, options.playerState || {});

  window.initCombatWorldState("main_overworld");
  window.__qaCombatDebugLastClearReason = null;
  window.__qaCombatDebugLastClearTick = null;
}

function getEnemy(enemyId) {
  const enemyState = window.getCombatEnemyState(enemyId);
  if (!enemyState) throw new Error(`Missing combat enemy state '${enemyId}'`);
  return enemyState;
}

function createEatSandbox(root, options = {}) {
  const foodRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "food-item-runtime.js"), "utf8");
  const messages = [];
  const sandbox = {
    window: {},
    currentTick: Number.isFinite(options.currentTick) ? options.currentTick : 100,
    playerState: Object.assign({
      currentHitpoints: 5,
      eatingCooldownEndTick: 0,
      lastAttackTick: 100,
      lastCastTick: null,
      action: "IDLE"
    }, options.playerState || {}),
    inventory: [{
      amount: 1,
      itemData: {
        name: "shrimp",
        type: "food",
        healAmount: 3,
        eatDelayTicks: 2
      }
    }],
    selectedUse: { invIndex: -1 },
    addChatMessage(message, tone) {
      messages.push({ message, tone });
    },
    clearSelectedUse() {},
    applyHitpointHealing(amount) {
      sandbox.playerState.currentHitpoints += amount;
      return amount;
    },
    updateStats() {},
    renderInventory() {}
  };
  vm.runInNewContext(
    `${foodRuntimeSource}\nthis.eatItem = (invIndex) => window.FoodItemRuntime.eatItem(this, invIndex);`,
    sandbox,
    { filename: "eat-runtime-sandbox.js" }
  );
  sandbox._messages = messages;
  return sandbox;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  ensureCombatRuntimeLoaded(root);

  const tests = [];
  function test(name, fn) {
    tests.push({ name, fn });
  }

  test("Manual ground-click breaks target lock but preserves and ticks cooldown", () => {
    resetCombatEnvironment({
      enemyDefs: {
        target_a: createEnemyDefinition("target_a")
      },
      spawnNodes: [
        createSpawnNode("target-a", "target_a", 8, 5)
      ]
    });

    assert.ok(window.lockPlayerCombatTarget("target-a"));
    playerState.remainingAttackCooldown = 3;
    playerState.inCombat = true;
    playerState.action = "COMBAT: MELEE";

    assert.strictEqual(window.clearPlayerCombatTarget({ force: true, reason: "queue-walk" }), true);
    assert.strictEqual(playerState.lockedTargetId, null);
    assert.strictEqual(playerState.remainingAttackCooldown, 3);
    assert.strictEqual(playerState.inCombat, false);

    currentTick += 1;
    window.processCombatTick();
    assert.strictEqual(playerState.remainingAttackCooldown, 2);
  });

  test("Non-enemy interaction breaks target lock without zeroing cooldown", () => {
    resetCombatEnvironment({
      enemyDefs: {
        target_b: createEnemyDefinition("target_b")
      },
      spawnNodes: [
        createSpawnNode("target-b", "target_b", 8, 5)
      ]
    });

    assert.ok(window.lockPlayerCombatTarget("target-b"));
    playerState.remainingAttackCooldown = 2;
    playerState.inCombat = true;
    playerState.action = "COMBAT: MELEE";

    assert.strictEqual(window.clearPlayerCombatTarget({ force: true, reason: "queue-interact-non-enemy" }), true);
    assert.strictEqual(playerState.lockedTargetId, null);
    assert.strictEqual(playerState.remainingAttackCooldown, 2);
    assert.strictEqual(playerState.inCombat, false);
  });

  test("Hard no-path clears the lock immediately", () => {
    resetCombatEnvironment({
      enemyDefs: {
        blocked_target: createEnemyDefinition("blocked_target")
      },
      spawnNodes: [
        createSpawnNode("blocked-target", "blocked_target", 9, 5)
      ],
      pathResolver() {
        return [];
      }
    });

    assert.ok(window.lockPlayerCombatTarget("blocked-target"));
    playerState.path = [{ x: 6, y: 5 }];
    playerState.action = "WALKING";

    window.processCombatTick();

    assert.strictEqual(playerState.lockedTargetId, null);
    assert.strictEqual(playerState.path.length, 0);
    assert.strictEqual(window.__qaCombatDebugLastClearReason, "locked-enemy-hard-no-path");
    assert.strictEqual(window.__qaCombatDebugLastPlayerPursuitState.state, "hard-no-path");
  });

  test("Temporary combat-enemy occupancy keeps the lock and retries pursuit", () => {
    resetCombatEnvironment({
      enemyDefs: {
        occupied_target: createEnemyDefinition("occupied_target")
      },
      spawnNodes: [
        createSpawnNode("occupied-target", "occupied_target", 9, 5)
      ],
      pathResolver(startX, startY, targetX, targetY, forceAdjacent, interactionObj, pathOptions) {
        if (pathOptions && pathOptions.ignoreCombatEnemyOccupancy) {
          return [{ x: 6, y: 5 }];
        }
        return [];
      }
    });

    assert.ok(window.lockPlayerCombatTarget("occupied-target"));
    playerState.path = [{ x: 6, y: 5 }];
    playerState.action = "WALKING";

    window.processCombatTick();

    assert.strictEqual(playerState.lockedTargetId, "occupied-target");
    assert.strictEqual(playerState.path.length, 0);
    assert.strictEqual(playerState.action, "COMBAT: MELEE");
    assert.strictEqual(window.__qaCombatDebugLastClearReason, null);
    assert.strictEqual(window.__qaCombatDebugLastPlayerPursuitState.state, "temporary-occupancy-block");
  });

  test("Auto-retaliate leaves an existing valid lock alone", () => {
    resetCombatEnvironment({
      enemyDefs: {
        engaged_target: createEnemyDefinition("engaged_target"),
        intruder: createEnemyDefinition("intruder", { aggroType: "aggressive" })
      },
      spawnNodes: [
        createSpawnNode("engaged-target", "engaged_target", 8, 5),
        createSpawnNode("intruder", "intruder", 6, 5)
      ],
      pathResolver(startX, startY, targetX) {
        if (targetX === 8) return [{ x: 6, y: 5 }];
        return [];
      }
    });

    assert.ok(window.lockPlayerCombatTarget("engaged-target"));
    playerState.remainingAttackCooldown = 3;
    const intruder = getEnemy("intruder");
    intruder.currentState = "aggroed";
    intruder.lockedTargetId = "player";
    intruder.remainingAttackCooldown = 0;

    window.processCombatTick();

    assert.strictEqual(playerState.lockedTargetId, "engaged-target");
  });

  test("Auto-retaliate prefers the first attacker order", () => {
    resetCombatEnvironment({
      enemyDefs: {
        first_enemy: createEnemyDefinition("first_enemy"),
        second_enemy: createEnemyDefinition("second_enemy"),
        third_enemy: createEnemyDefinition("third_enemy")
      },
      spawnNodes: [
        createSpawnNode("first-enemy", "first_enemy", 6, 5),
        createSpawnNode("second-enemy", "second_enemy", 5, 6),
        createSpawnNode("third-enemy", "third_enemy", 6, 6)
      ]
    });

    ["first-enemy", "second-enemy", "third-enemy"].forEach((enemyId, index) => {
      const enemy = getEnemy(enemyId);
      enemy.currentState = "aggroed";
      enemy.lockedTargetId = "player";
      enemy.remainingAttackCooldown = 0;
      enemy.autoRetaliateAggressorOrder = index + 1;
    });

    window.processCombatTick();

    assert.strictEqual(playerState.lockedTargetId, "first-enemy");
    assert.strictEqual(window.__qaCombatDebugLastAutoRetaliateSelection.runtimeId, "first-enemy");
  });

  test("Auto-retaliate breaks equal-order ties by closest attacker", () => {
    resetCombatEnvironment({
      enemyDefs: {
        closest_enemy: createEnemyDefinition("closest_enemy"),
        farther_enemy: createEnemyDefinition("farther_enemy")
      },
      spawnNodes: [
        createSpawnNode("closest-enemy", "closest_enemy", 6, 5),
        createSpawnNode("farther-enemy", "farther_enemy", 9, 5)
      ]
    });

    const closestEnemy = getEnemy("closest-enemy");
    closestEnemy.currentState = "aggroed";
    closestEnemy.lockedTargetId = "player";
    closestEnemy.remainingAttackCooldown = 0;
    closestEnemy.autoRetaliateAggressorOrder = 1;

    const fartherEnemy = getEnemy("farther-enemy");
    fartherEnemy.currentState = "aggroed";
    fartherEnemy.lockedTargetId = "player";
    fartherEnemy.remainingAttackCooldown = 5;
    fartherEnemy.autoRetaliateAggressorOrder = 1;

    window.processCombatTick();

    assert.strictEqual(playerState.lockedTargetId, "closest-enemy");
  });

  test("Auto-retaliate breaks equal-order equal-distance ties by weakest attacker", () => {
    resetCombatEnvironment({
      enemyDefs: {
        weak_enemy: createEnemyDefinition("weak_enemy", { attack: 4, strength: 4, defense: 4, hitpoints: 4 }),
        strong_enemy: createEnemyDefinition("strong_enemy", { attack: 20, strength: 20, defense: 20, hitpoints: 20 })
      },
      spawnNodes: [
        createSpawnNode("weak-enemy", "weak_enemy", 6, 5),
        createSpawnNode("strong-enemy", "strong_enemy", 5, 6)
      ]
    });

    const weakEnemy = getEnemy("weak-enemy");
    weakEnemy.currentState = "aggroed";
    weakEnemy.lockedTargetId = "player";
    weakEnemy.remainingAttackCooldown = 0;
    weakEnemy.autoRetaliateAggressorOrder = 1;

    const strongEnemy = getEnemy("strong-enemy");
    strongEnemy.currentState = "aggroed";
    strongEnemy.lockedTargetId = "player";
    strongEnemy.remainingAttackCooldown = 0;
    strongEnemy.autoRetaliateAggressorOrder = 1;

    window.processCombatTick();

    assert.strictEqual(playerState.lockedTargetId, "weak-enemy");
  });

  test("Hit aggro applies the one-tick opening cooldown", () => {
    resetCombatEnvironment({
      enemyDefs: {
        idle_enemy: createEnemyDefinition("idle_enemy", { hitpoints: 6 })
      },
      spawnNodes: [
        createSpawnNode("idle-enemy", "idle_enemy", 6, 5)
      ],
      rollDamage() {
        return 1;
      }
    });

    assert.ok(window.lockPlayerCombatTarget("idle-enemy"));
    window.processCombatTick();

    const idleEnemy = getEnemy("idle-enemy");
    assert.strictEqual(idleEnemy.currentState, "aggroed");
    assert.strictEqual(idleEnemy.lockedTargetId, "player");
    assert.strictEqual(idleEnemy.remainingAttackCooldown, 1);
  });

  test("Same-tick eat restriction still blocks eating after an attack tick", () => {
    const eatSandbox = createEatSandbox(root, {
      currentTick: 100,
      playerState: {
        currentHitpoints: 5,
        eatingCooldownEndTick: 0,
        lastAttackTick: 100,
        lastCastTick: null,
        action: "IDLE"
      }
    });

    eatSandbox.eatItem(0);

    assert.strictEqual(eatSandbox.inventory[0].amount, 1);
    assert.strictEqual(eatSandbox.playerState.eatingCooldownEndTick, 0);
    assert.ok(
      eatSandbox._messages.some((entry) => entry.message === "You cannot eat on the same tick as attacking or casting."),
      "expected the same-tick eat restriction warning"
    );
  });

  let passed = 0;
  const failures = [];

  for (let i = 0; i < tests.length; i += 1) {
    const currentTest = tests[i];
    try {
      currentTest.fn();
      passed += 1;
      console.log("[PASS] " + currentTest.name);
    } catch (error) {
      failures.push({
        name: currentTest.name,
        error: error && error.message ? error.message : String(error)
      });
      console.error("[FAIL] " + currentTest.name + " -> " + (error && error.message ? error.message : error));
    }
  }

  if (failures.length > 0) {
    console.error("\nCombat runtime QA failures: " + failures.length + " of " + tests.length);
    failures.forEach((failure) => {
      console.error(" - " + failure.name + ": " + failure.error);
    });
    process.exit(1);
  }

  console.log("\nCombat runtime QA passed: " + passed + " tests.");
}

try {
  run();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
