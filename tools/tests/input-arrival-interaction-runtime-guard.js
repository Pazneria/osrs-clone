const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeGrid(size, fill) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

function makeContext(overrides = {}) {
  const contextOverrides = Object.assign({}, overrides);
  delete contextOverrides.playerState;
  const playerState = Object.assign({
    x: 2,
    y: 2,
    z: 0,
    prevX: 2,
    prevY: 2,
    action: "WALKING_TO_INTERACT",
    path: [],
    targetX: 3,
    targetY: 2,
    targetObj: null,
    targetUid: null,
    pendingInteractAfterFletchingWalk: null,
    targetRotation: 0
  }, overrides.playerState || {});
  const logicalPlane = makeGrid(7, 1);
  const heightPlane = makeGrid(7, 0);

  return Object.assign({
    windowRef: {},
    playerState,
    logicalMap: [logicalPlane],
    heightMap: [heightPlane],
    tileId: {
      SHOP_COUNTER: 7,
      WOODEN_GATE_OPEN: 8,
      WOODEN_GATE_CLOSED: 9,
      DOOR_OPEN: 10,
      DOOR_CLOSED: 11
    },
    playerRig: { rotation: { y: 0 } },
    skillRuntime: null,
    addChatMessage: () => {},
    isWaterTileId: () => false,
    isDoorTileId: (tile) => tile === 10 || tile === 11,
    isPierFishingApproachTile: () => false,
    isStandableTile: () => true,
    validateStationApproach: () => ({ ok: true, message: "" }),
    resolveInteractionFacingRotation: () => null,
    stopActiveFletchingProcessingSession: () => {},
    clearMinimapDestinationIfReached: () => {},
    updateMinimapCanvas: () => {},
    takeGroundItemByUid: () => {},
    openShop: () => {},
    openBank: () => {},
    setActiveBankSource: () => {}
  }, contextOverrides);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-arrival-interaction-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const tickMovementIndex = manifestSource.indexOf('id: "input-tick-movement-runtime"');
  const arrivalIndex = manifestSource.indexOf('id: "input-arrival-interaction-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-arrival-interaction-runtime.js?raw"), "legacy manifest should import the input arrival interaction runtime raw script");
  assert(tickMovementIndex !== -1 && arrivalIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input arrival interaction runtime");
  assert(tickMovementIndex < arrivalIndex && arrivalIndex < inputRenderIndex, "legacy manifest should load arrival interaction after tick movement and before input-render.js");

  assert(runtimeSource.includes("window.InputArrivalInteractionRuntime"), "input arrival interaction runtime should expose a window runtime");
  assert(runtimeSource.includes("function processArrivalInteractions"), "input arrival interaction runtime should own arrival processing");
  assert(runtimeSource.includes("function handleWalkingToInteractArrival"), "input arrival interaction runtime should own WALKING_TO_INTERACT completion");
  assert(runtimeSource.includes("function resumeDeferredFletchingInteraction"), "input arrival interaction runtime should own deferred fletching interaction resume");
  assert(runtimeSource.includes("windowRef.openNpcDialogue(playerState.targetUid);"), "input arrival interaction runtime should route Talk-to dialogue");
  assert(runtimeSource.includes("context.takeGroundItemByUid(playerState.targetUid);"), "input arrival interaction runtime should delegate ground-item pickup");

  assert(inputSource.includes("function getInputArrivalInteractionRuntime()"), "input-render.js should resolve the input arrival interaction runtime");
  assert(inputSource.includes("buildInputArrivalInteractionRuntimeContext"), "input-render.js should provide a narrow arrival interaction context");
  assert(inputSource.includes("runtime.processArrivalInteractions(buildInputArrivalInteractionRuntimeContext(), movedThisTick)"), "input-render.js should delegate arrival interaction processing");
  assert(!inputSource.includes("playerState.targetUid.action === 'Talk-to'"), "input-render.js should not own NPC Talk-to arrival routing");
  assert(!inputSource.includes("window.takeGroundItemByUid(playerState.targetUid)"), "input-render.js should not own ground-item arrival pickup");
  assert(!inputSource.includes("door.isOpen = !door.isOpen;"), "input-render.js should not own door arrival mutation");

  const sandbox = { window: {}, Number, Object, String, Math, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputArrivalInteractionRuntime;
  assert(runtime, "input arrival interaction runtime should execute in isolation");

  {
    let pickedUid = null;
    const context = makeContext({
      takeGroundItemByUid: (uid) => { pickedUid = uid; },
      playerState: {
        targetObj: "GROUND_ITEM",
        targetUid: "item-1",
        targetX: 2,
        targetY: 2
      }
    });
    runtime.processArrivalInteractions(context, false);
    assert(pickedUid === "item-1", "ground-item arrival should call the pickup hook");
    assert(context.playerState.action === "IDLE", "ground-item arrival should return to idle");
  }

  {
    let minimapUpdated = false;
    const door = { x: 3, y: 2, z: 0, isOpen: false, openRot: 1, closedRot: 0, isWoodenGate: false };
    const context = makeContext({
      updateMinimapCanvas: () => { minimapUpdated = true; },
      playerState: {
        targetObj: "DOOR",
        targetUid: door,
        targetX: 3,
        targetY: 2
      }
    });
    runtime.processArrivalInteractions(context, false);
    assert(door.isOpen && door.targetRotation === 1, "door arrival should toggle door state");
    assert(context.logicalMap[0][2][3] === context.tileId.DOOR_OPEN, "door arrival should update the logical map tile");
    assert(minimapUpdated, "door arrival should refresh the minimap");
  }

  {
    let openedNpc = null;
    const context = makeContext({
      windowRef: { openNpcDialogue: (npc) => { openedNpc = npc; } },
      playerState: {
        targetObj: "NPC",
        targetUid: { action: "Talk-to", name: "Guide" },
        targetX: 3,
        targetY: 2
      }
    });
    runtime.processArrivalInteractions(context, false);
    assert(openedNpc && openedNpc.name === "Guide", "NPC Talk-to arrival should open dialogue through the NPC runtime");
    assert(context.playerState.action === "IDLE", "NPC arrival should return to idle");
  }

  {
    let activeSource = null;
    let bankOpened = false;
    const context = makeContext({
      setActiveBankSource: (source) => { activeSource = source; },
      openBank: () => { bankOpened = true; },
      playerState: {
        targetObj: "BANK_BOOTH",
        targetX: 3,
        targetY: 2
      }
    });
    runtime.processArrivalInteractions(context, false);
    assert(activeSource === "booth:3,2,0" && bankOpened, "bank booth arrival should set bank source and open the bank");
  }

  {
    let skillStarted = false;
    const context = makeContext({
      skillRuntime: {
        canHandleTarget: (target) => target === "ROCK",
        tryStartFromPlayerTarget: () => {
          skillStarted = true;
          return true;
        }
      },
      playerState: {
        targetObj: "ROCK",
        targetX: 3,
        targetY: 2
      }
    });
    runtime.processArrivalInteractions(context, false);
    assert(skillStarted, "skill target arrival should start through SkillRuntime");
  }

  {
    let stoppedFletching = false;
    const context = makeContext({
      stopActiveFletchingProcessingSession: () => { stoppedFletching = true; },
      playerState: {
        action: "SKILLING: FLETCHING",
        targetX: 3,
        targetY: 2,
        targetObj: "ROCK",
        pendingInteractAfterFletchingWalk: {
          targetObj: "ROCK",
          targetX: 3,
          targetY: 2,
          targetUid: { skillId: "mining" }
        }
      },
      skillRuntime: {
        canHandleTarget: (target) => target === "ROCK",
        tryStartFromPlayerTarget: () => true
      }
    });
    runtime.processArrivalInteractions(context, false);
    assert(stoppedFletching, "deferred fletching arrival should stop the active fletching session before interacting");
    assert(context.playerState.pendingInteractAfterFletchingWalk === null, "deferred fletching arrival should clear deferred metadata");
  }

  {
    const context = makeContext({
      playerState: {
        action: "WALKING_TO_INTERACT",
        targetObj: "NPC",
        targetUid: { action: "Talk-to" },
        targetX: 3,
        targetY: 2
      }
    });
    const result = runtime.processArrivalInteractions(context, true);
    assert(result && result.shouldReturnEarly, "arrival processing should preserve the moved-this-tick early return");
  }

  console.log("Input arrival interaction runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
