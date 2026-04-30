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
    firemakingSession: null,
    pendingSkillStart: null,
    pendingActionAfterTurn: "TURN",
    turnLock: true,
    actionVisualReady: false,
    lockedTargetId: null,
    combatTargetKind: null,
    targetObj: null,
    inCombat: false
  }, overrides.playerState || {});
  const contextOverrides = Object.assign({}, overrides);
  delete contextOverrides.playerState;
  return Object.assign({
    playerState,
    addChatMessage: () => {},
    clearPlayerCombatTarget: () => {},
    setMinimapDestination: () => {},
    clearMinimapDestination: () => {}
  }, contextOverrides);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-action-queue-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const arrivalIndex = manifestSource.indexOf('id: "input-arrival-interaction-runtime"');
  const queueIndex = manifestSource.indexOf('id: "input-action-queue-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-action-queue-runtime.js?raw"), "legacy manifest should import the input action queue runtime raw script");
  assert(arrivalIndex !== -1 && queueIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input action queue runtime");
  assert(arrivalIndex < queueIndex && queueIndex < inputRenderIndex, "legacy manifest should load input action queue runtime before input-render.js");

  assert(runtimeSource.includes("window.InputActionQueueRuntime"), "input action queue runtime should expose a window runtime");
  assert(runtimeSource.includes("function queueAction"), "input action queue runtime should own action queueing");
  assert(runtimeSource.includes("function cancelManualFiremakingChain"), "input action queue runtime should own manual firemaking cancellation");
  assert(runtimeSource.includes("function clearCombatSelectionForQueuedAction"), "input action queue runtime should own queued-action combat unlock policy");
  assert(runtimeSource.includes("function syncMinimapDestinationForQueuedAction"), "input action queue runtime should own queued-action minimap destination policy");

  assert(inputSource.includes("function getInputActionQueueRuntime()"), "input-render.js should resolve the input action queue runtime");
  assert(inputSource.includes("buildInputActionQueueRuntimeContext"), "input-render.js should provide a narrow action queue runtime context");
  assert(inputSource.includes("runtime.queueAction(buildInputActionQueueRuntimeContext(), type, gridX, gridY, obj, targetUid)"), "input-render.js should delegate queueAction policy");
  assert(!inputSource.includes("function cancelManualFiremakingChain()"), "input-render.js should not own manual firemaking cancellation");
  assert(!inputSource.includes("playerState.firemakingSession = null;"), "input-render.js should not mutate firemaking cancellation details inline");
  assert(!inputSource.includes("reason: 'queue-walk'"), "input-render.js should not own combat target clear reasons");
  assert(!inputSource.includes("pendingAction = { type, x: gridX, y: gridY, obj, targetUid };"), "input-render.js should not directly create queued pending actions");

  const sandbox = { window: {}, Number, Object, String, Math, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputActionQueueRuntime;
  assert(runtime, "input action queue runtime should execute in isolation");

  {
    let message = null;
    const context = makeContext({
      playerState: {
        action: "SKILLING: FIREMAKING",
        firemakingSession: { active: true },
        pendingSkillStart: { skillId: "firemaking" },
        path: [{ x: 2, y: 2 }]
      },
      addChatMessage: (text, tone) => { message = { text, tone }; }
    });
    const cancelled = runtime.cancelManualFiremakingChain(context);
    assert(cancelled, "manual firemaking cancellation should report when it cancels");
    assert(context.playerState.action === "IDLE", "manual firemaking cancellation should idle the player");
    assert(context.playerState.firemakingSession === null && context.playerState.pendingSkillStart === null, "manual firemaking cancellation should clear firemaking state");
    assert(Array.isArray(context.playerState.path) && context.playerState.path.length === 0, "manual firemaking cancellation should clear path");
    assert(message && message.text === "You stop lighting the logs.", "manual firemaking cancellation should preserve feedback");
  }

  {
    let cleared = null;
    let minimap = null;
    const context = makeContext({
      playerState: { lockedTargetId: "enemy-1", combatTargetKind: "enemy" },
      clearPlayerCombatTarget: (payload) => { cleared = payload; },
      setMinimapDestination: (x, y, z) => { minimap = { x, y, z }; }
    });
    const pending = runtime.queueAction(context, "WALK", 5, 6, null, null);
    assert(pending && pending.type === "WALK" && pending.x === 5 && pending.y === 6 && pending.obj === null, "walk queueing should return the pending action payload");
    assert(cleared && cleared.reason === "queue-walk" && cleared.force === true, "walk queueing should clear combat selection");
    assert(minimap && minimap.x === 5 && minimap.y === 6 && minimap.z === 0, "walk queueing should set minimap destination");
  }

  {
    let cleared = null;
    let destinationCleared = false;
    const context = makeContext({
      playerState: { inCombat: true },
      clearPlayerCombatTarget: (payload) => { cleared = payload; },
      clearMinimapDestination: () => { destinationCleared = true; }
    });
    const pending = runtime.queueAction(context, "INTERACT", 3, 4, "ROCK", { skillId: "mining" });
    assert(pending && pending.type === "INTERACT" && pending.targetUid.skillId === "mining", "interact queueing should return target metadata");
    assert(cleared && cleared.reason === "queue-interact-non-enemy", "non-enemy interact queueing should clear combat selection");
    assert(destinationCleared, "interact queueing should clear minimap destination");
  }

  {
    let cleared = false;
    const context = makeContext({
      playerState: { inCombat: true },
      clearPlayerCombatTarget: () => { cleared = true; }
    });
    runtime.queueAction(context, "INTERACT", 3, 4, "ENEMY", { enemyId: "enemy-1" });
    assert(!cleared, "enemy interact queueing should preserve combat selection for the target");
  }

  console.log("Input action queue runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
