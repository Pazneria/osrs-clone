const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext(overrides = {}) {
  const playerState = Object.assign({
    x: 1,
    y: 1,
    z: 0,
    action: "IDLE",
    path: [],
    targetX: null,
    targetY: null,
    targetObj: null,
    targetUid: null,
    pendingSkillStart: null,
    pendingInteractAfterFletchingWalk: null,
    pendingActionAfterTurn: "TURN",
    turnLock: true,
    actionVisualReady: false,
    midX: null,
    midY: null
  }, overrides.playerState || {});
  return Object.assign({
    windowRef: { QA_PIER_DEBUG: false },
    playerState,
    logicalMap: [[[1, 1, 1], [1, 1, 5], [1, 1, 1]]],
    heightMap: [[[0, 0, 0], [0, 0, 0], [0, 0, 0]]],
    isRunning: false,
    isBankOpen: false,
    skillRuntime: null,
    findNearestFishableWaterEdgeTile: () => null,
    buildPierStepDescendPath: () => null,
    findPath: (_sx, _sy, tx, ty) => [{ x: tx, y: ty }],
    isPierDeckTile: () => false,
    isStandableTile: () => true,
    isNearPierBoundsTile: () => false,
    emitPierDebug: () => {},
    clearMinimapDestination: () => {},
    hasActiveFletchingProcessingSession: () => false,
    lockPlayerCombatTarget: () => {},
    closeBank: () => {}
  }, overrides);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-tick-movement-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const raycastRuntimeIndex = manifestSource.indexOf('id: "input-raycast-runtime"');
  const movementRuntimeIndex = manifestSource.indexOf('id: "input-tick-movement-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-tick-movement-runtime.js?raw"), "legacy manifest should import the input tick movement runtime raw script");
  assert(raycastRuntimeIndex !== -1 && movementRuntimeIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input tick movement runtime");
  assert(raycastRuntimeIndex < movementRuntimeIndex && movementRuntimeIndex < inputRenderIndex, "legacy manifest should load input tick movement runtime before input-render.js");

  assert(runtimeSource.includes("window.InputTickMovementRuntime"), "input tick movement runtime should expose a window runtime");
  assert(runtimeSource.includes("function applyPendingAction"), "input tick movement runtime should own pending action path setup");
  assert(runtimeSource.includes("function advancePlayerMovement"), "input tick movement runtime should own per-tick path stepping");
  assert(runtimeSource.includes("pendingAction.obj === 'PIER_STEP_DESCEND'"), "input tick movement runtime should preserve pier descend path handling");
  assert(runtimeSource.includes("else if (typeof pendingAction.targetUid === 'string')"), "input tick movement runtime should support string enemy target IDs");
  assert(runtimeSource.includes("const stepsToTake = context.isRunning ? 2 : 1;"), "input tick movement runtime should preserve run-step movement");

  assert(inputSource.includes("function getInputTickMovementRuntime()"), "input-render.js should resolve the input tick movement runtime");
  assert(inputSource.includes("buildInputTickMovementRuntimeContext"), "input-render.js should provide a narrow tick movement runtime context");
  assert(inputSource.includes("runtime.applyPendingAction(buildInputTickMovementRuntimeContext()"), "input-render.js should delegate pending action setup");
  assert(inputSource.includes("runtime.advancePlayerMovement(buildInputTickMovementRuntimeContext()"), "input-render.js should delegate path stepping");
  assert(!inputSource.includes("let stepsToTake = isRunning ? 2 : 1;"), "input-render.js should not own run-step path movement");
  assert(!inputSource.includes("else if (typeof pendingAction.targetUid === 'string')"), "input-render.js should not own string enemy target handling");

  const sandbox = { window: {}, Number, Object, String, Math, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputTickMovementRuntime;
  assert(runtime, "input tick movement runtime should execute in isolation");

  {
    let clearedDestination = false;
    const context = makeContext({
      findPath: () => [],
      clearMinimapDestination: () => { clearedDestination = true; }
    });
    runtime.applyPendingAction(context, { type: "WALK", x: 2, y: 1, obj: null, targetUid: null });
    assert(context.playerState.action === "IDLE", "empty walk path should return the player to idle");
    assert(clearedDestination, "empty walk path should clear minimap destination");
    assert(context.playerState.pendingActionAfterTurn === null && context.playerState.turnLock === false && context.playerState.actionVisualReady === true, "pending walk should reset transient action state");
  }

  {
    const context = makeContext({
      buildPierStepDescendPath: () => [{ x: 1, y: 0 }]
    });
    runtime.applyPendingAction(context, { type: "WALK", x: 1, y: 0, obj: "PIER_STEP_DESCEND", targetUid: null });
    assert(context.playerState.path.length === 1 && context.playerState.path[0].y === 0, "pier descend walk should prefer the pier step fallback path");
    assert(context.playerState.action === "WALKING", "non-empty pier descend path should walk");
  }

  {
    let lockedEnemyId = null;
    const context = makeContext({
      lockPlayerCombatTarget: (enemyId) => { lockedEnemyId = enemyId; }
    });
    runtime.applyPendingAction(context, { type: "INTERACT", x: 4, y: 5, obj: "ENEMY", targetUid: { enemyId: "enemy-1", enemyX: 4, enemyY: 5 } });
    assert(lockedEnemyId === "enemy-1", "enemy interaction should lock object enemy target IDs");
    assert(context.playerState.targetX === 4 && context.playerState.targetY === 5 && context.playerState.targetObj === "ENEMY", "enemy interaction should normalize enemy target coordinates");
    runtime.applyPendingAction(context, { type: "INTERACT", x: 1, y: 1, obj: "ENEMY", targetUid: "enemy-2" });
    assert(lockedEnemyId === "enemy-2", "enemy interaction should lock string enemy target IDs");
  }

  {
    const context = makeContext({
      skillRuntime: { canHandleTarget: (target) => target === "ROCK" }
    });
    runtime.applyPendingAction(context, { type: "INTERACT", x: 2, y: 2, obj: "ROCK", targetUid: { skillId: "mining", nodeId: "rock-1" } });
    assert(context.playerState.pendingSkillStart && context.playerState.pendingSkillStart.targetObj === "ROCK", "skill interactions should queue pending skill start metadata");
    assert(context.playerState.action === "WALKING_TO_INTERACT", "skill interactions should walk to interact");
  }

  {
    let closedBank = false;
    const context = makeContext({
      isRunning: true,
      isBankOpen: true,
      closeBank: () => { closedBank = true; },
      playerState: { path: [{ x: 2, y: 1 }, { x: 3, y: 1 }] }
    });
    const moved = runtime.advancePlayerMovement(context);
    assert(moved, "advancePlayerMovement should report movement");
    assert(context.playerState.midX === 2 && context.playerState.x === 3 && context.playerState.y === 1, "running should consume two path steps and preserve mid-tile visual state");
    assert(closedBank, "movement should close an open bank");
  }

  console.log("Input tick movement runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
