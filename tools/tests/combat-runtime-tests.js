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
  global.inventory = [];
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
  loadBrowserScript(root, "src/js/combat-engagement-runtime.js");
  loadBrowserScript(root, "src/js/combat-facing-runtime.js");
  loadBrowserScript(root, "src/js/combat-loot-runtime.js");
  loadBrowserScript(root, "src/js/combat-player-defeat-runtime.js");
  loadBrowserScript(root, "src/js/combat-enemy-movement-runtime.js");
  loadBrowserScript(root, "src/js/combat-enemy-occupancy-runtime.js");
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
    ranged: { level: 40, xp: 0 },
    magic: { level: 40, xp: 0 },
    hitpoints: { level: 10, xp: 0 }
  };
  global.equipment = options.equipment || {};
  global.inventory = Array.isArray(options.inventory) ? options.inventory : [];
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

  test("Ranged player attacks from bow range and consumes ammo", () => {
    resetCombatEnvironment({
      enemyDefs: {
        ranged_target: createEnemyDefinition("ranged_target", { hitpoints: 6 })
      },
      spawnNodes: [
        createSpawnNode("ranged-target", "ranged_target", 10, 5)
      ],
      playerSnapshot: {
        styleFamily: "ranged",
        damageType: "ranged",
        canAttack: true,
        attackValue: 100,
        defenseValue: 10,
        maxHit: 1,
        attackRange: 7,
        attackTickCycle: 4,
        consumesAmmo: true,
        ammoInventoryIndex: 0,
        ammoItemId: "bronze_arrows"
      },
      inventory: [
        { itemData: { id: "bronze_arrows", name: "Bronze Arrows x15" }, amount: 2 }
      ],
      pathResolver() {
        return [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }];
      }
    });

    assert.ok(window.lockPlayerCombatTarget("ranged-target"));
    window.processCombatTick();

    const target = getEnemy("ranged-target");
    assert.strictEqual(target.currentHealth, 5, "ranged attack should damage targets outside melee range");
    assert.strictEqual(playerState.action, "COMBAT: RANGED", "ranged attacks should mark ranged combat intent");
    assert.strictEqual(playerState.path.length, 0, "ranged attacks should not step toward an already in-range target");
    assert.strictEqual(playerState.remainingAttackCooldown, 4, "ranged attack should set bow cooldown");
    assert.strictEqual(inventory[0].amount, 1, "ranged attack should consume one arrow from the selected stack");
  });

  test("Magic player attacks from staff range, consumes runes, and trains Magic", () => {
    const xpAwards = [];
    const previousAddSkillXp = global.addSkillXp;
    global.addSkillXp = (skillId, amount) => {
      xpAwards.push({ skillId, amount });
    };

    try {
      resetCombatEnvironment({
        enemyDefs: {
          magic_target: createEnemyDefinition("magic_target", { hitpoints: 6 })
        },
        spawnNodes: [
          createSpawnNode("magic-target", "magic_target", 10, 5)
        ],
        playerSnapshot: {
          styleFamily: "magic",
          damageType: "magic",
          canAttack: true,
          attackValue: 100,
          defenseValue: 10,
          maxHit: 1,
          attackRange: 6,
          attackTickCycle: 4,
          consumesAmmo: true,
          ammoInventoryIndex: 0,
          ammoItemId: "ember_rune"
        },
        inventory: [
          { itemData: { id: "ember_rune", name: "Ember rune" }, amount: 2 }
        ],
        pathResolver() {
          return [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }];
        }
      });

      assert.ok(window.lockPlayerCombatTarget("magic-target"));
      window.processCombatTick();

      const target = getEnemy("magic-target");
      assert.strictEqual(target.currentHealth, 5, "magic attack should damage targets outside melee range");
      assert.strictEqual(playerState.action, "COMBAT: MAGIC", "magic attacks should mark magic combat intent");
      assert.strictEqual(playerState.path.length, 0, "magic attacks should not step toward an already in-range target");
      assert.strictEqual(playerState.remainingAttackCooldown, 4, "magic attack should set staff cooldown");
      assert.strictEqual(playerState.lastCastTick, 1, "magic attacks should record the cast tick");
      assert.strictEqual(inventory[0].amount, 1, "magic attack should consume one rune from the selected stack");
      assert.ok(xpAwards.some((entry) => entry.skillId === "magic" && entry.amount === 4), "magic damage should award Magic XP");
      assert.ok(xpAwards.some((entry) => entry.skillId === "hitpoints" && entry.amount === 1), "magic damage should award Hitpoints XP");
    } finally {
      global.addSkillXp = previousAddSkillXp;
    }
  });

  test("Ranged player attacks consume equipped ammo before inventory ammo", () => {
    const bronzeArrows = { id: "bronze_arrows", name: "Bronze Arrows x15", stackable: true };
    let rebuiltRigForAmmoRefresh = false;
    const previousUpdatePlayerModel = global.updatePlayerModel;
    global.playerRig = {
      userData: {
        rig: {
          attackTick: -1,
          attackStyleFamily: "melee",
          attackAnimationStartedAt: -1
        }
      }
    };
    global.updatePlayerModel = () => {
      rebuiltRigForAmmoRefresh = true;
      global.playerRig = {
        userData: {
          rig: {
            attackTick: -1,
            attackStyleFamily: "melee",
            attackAnimationStartedAt: -1
          }
        }
      };
    };
    resetCombatEnvironment({
      enemyDefs: {
        ranged_target: createEnemyDefinition("ranged_target", { hitpoints: 6 })
      },
      spawnNodes: [
        createSpawnNode("ranged-target", "ranged_target", 10, 5)
      ],
      playerSnapshot: {
        styleFamily: "ranged",
        damageType: "ranged",
        canAttack: true,
        attackValue: 100,
        defenseValue: 10,
        maxHit: 1,
        attackRange: 7,
        attackTickCycle: 4,
        consumesAmmo: true,
        ammoInventoryIndex: null,
        ammoEquipmentSlot: "ammo",
        ammoItemId: "bronze_arrows"
      },
      equipment: {
        ammo: { itemData: bronzeArrows, amount: 2 }
      },
      inventory: [
        { itemData: bronzeArrows, amount: 25 }
      ]
    });

    assert.ok(window.lockPlayerCombatTarget("ranged-target"));
    window.processCombatTick();

    assert.strictEqual(equipment.ammo.amount, 1, "ranged attack should consume one arrow from equipped ammo");
    assert.strictEqual(inventory[0].amount, 25, "inventory ammo should stay untouched while equipped ammo is selected");
    assert.strictEqual(rebuiltRigForAmmoRefresh, true, "equipped ammo consumption should refresh the player model");
    assert.strictEqual(global.playerRig.userData.rig.attackStyleFamily, "ranged", "ranged attack style should be restored after ammo refresh");
    assert.strictEqual(global.playerRig.userData.rig.attackTick, 1, "attack tick should be written to the refreshed rig");
    assert.ok(Number.isFinite(global.playerRig.userData.rig.attackAnimationStartedAt), "attack animation start should be written to the refreshed rig");
    global.updatePlayerModel = previousUpdatePlayerModel;
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
