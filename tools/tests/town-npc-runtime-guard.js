const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function makeVec3(x = 0, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    clone() {
      return makeVec3(this.x, this.y, this.z);
    },
    copy(other) {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      return this;
    }
  };
}

function makeRigNode() {
  return {
    position: makeVec3(),
    rotation: makeVec3(),
    scale: makeVec3(1, 1, 1)
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const runtimeSource = readRepoFile(root, "src/js/world/town-npc-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const townRuntimeIndex = manifestSource.indexOf('id: "world-town-npc-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(townRuntimeIndex !== -1 && worldIndex !== -1 && townRuntimeIndex < worldIndex, "legacy script manifest should load town NPC runtime before world.js");
  assert(runtimeSource.includes("window.WorldTownNpcRuntime"), "town NPC runtime should expose a window runtime");
  assert(runtimeSource.includes("function updateWorldNpcRuntime(context = {}, frameNowMs)"), "town NPC runtime should own NPC roaming update");
  assert(runtimeSource.includes("function applyTownNpcRigAnimation(actor, frameNowMs, visualBaseY)"), "town NPC runtime should own NPC rig animation");
  assert(runtimeSource.includes("const TOWN_NPC_SHADOW_CULL_DISTANCE = 38;"), "town NPC runtime should keep a bounded NPC shadow budget");
  assert(runtimeSource.includes("function applyTownNpcShadowBudget(context = {}, actor, visualX, visualY)"), "town NPC runtime should own distance-based NPC shadow casting");
  assert(runtimeSource.includes("function refreshTutorialGateStates(context = {})"), "town NPC runtime should own tutorial gate refresh behavior");
  assert(runtimeSource.includes("function refreshTutorialActorStates(context = {})"), "town NPC runtime should own tutorial NPC visibility refresh behavior");
  assert(runtimeSource.includes("function isTutorialActorVisible(context, actor)"), "town NPC runtime should own tutorial NPC step visibility policy");
  assert(runtimeSource.includes("function publishTutorialGateHooks"), "town NPC runtime should own tutorial gate public hook publication");
  assert(runtimeSource.includes("function buildStructureBoundsList(options = {})"), "town NPC runtime should own structure-bound shaping for NPC roam policy");
  assert(runtimeSource.includes("function createTownNpcActorRecord(options = {})"), "town NPC runtime should own town NPC actor record shaping");
  assert(runtimeSource.includes("function listQaNpcTargets(npcsToRender)"), "town NPC runtime should own QA NPC target snapshots");
  assert(runtimeSource.includes("function resolveTownNpcRoamBounds(options = {})"), "town NPC runtime should own NPC roam bounds resolution");
  assert(runtimeSource.includes("function resolveTownNpcRoamingRadius(npc, roamBounds)"), "town NPC runtime should own NPC roaming radius resolution");
  assert(runtimeSource.includes("let staticNpcBaseTiles = new Map();"), "town NPC runtime should own static NPC tile state");
  assert(runtimeSource.includes("let staticObjectBaseTiles = new Map();"), "town NPC runtime should own static object base tile state");
  assert(runtimeSource.includes("let loadedChunkNpcActors = new Map();"), "town NPC runtime should own loaded chunk NPC actor state");
  assert(worldSource.includes("WorldTownNpcRuntime"), "world.js should delegate town NPC behavior");
  assert(worldSource.includes("worldTownNpcRuntime.updateWorldNpcRuntime(buildTownNpcRuntimeContext(), frameNowMs);"), "world.js should delegate NPC update ticks");
  assert(worldSource.includes("function installTutorialGateHooks()"), "world.js should install tutorial gate hooks through a narrow helper");
  assert(worldSource.includes("worldTownNpcRuntime.publishTutorialGateHooks({"), "world.js should delegate tutorial gate public hook publication");
  assert(worldSource.includes("buildContext: buildTownNpcRuntimeContext"), "world.js should pass a lazy town NPC context builder to tutorial gate hooks");
  assert(worldSource.includes("worldTownNpcRuntime.buildStructureBoundsList"), "world.js should delegate town NPC structure bounds shaping");
  assert(worldSource.includes("worldTownNpcRuntime.createTownNpcActorRecord"), "world.js should delegate town NPC actor record shaping");
  assert(worldSource.includes("worldTownNpcRuntime.listQaNpcTargets(npcsToRender)"), "world.js should delegate QA NPC target snapshots");
  assert(worldSource.includes("worldTownNpcRuntime.resetStaticNpcBaseTiles();"), "world.js should delegate static NPC tile reset");
  assert(worldSource.includes("worldTownNpcRuntime.setLoadedChunkNpcActors(key, renderedNpcActors);"), "world.js should delegate chunk NPC actor tracking");
  assert(!worldSource.includes("function applyTownNpcRigAnimation("), "world.js should not own town NPC rig animation");
  assert(!worldSource.includes("function chooseTownNpcNextStep("), "world.js should not own town NPC roaming step selection");
  assert(!worldSource.includes("const distanceToBounds = (bounds, x, y) => {"), "world.js should not own NPC roam bounds distance helpers");
  assert(!worldSource.includes("const npcActorId = (npc && typeof npc.spawnId === 'string' && npc.spawnId)"), "world.js should not own NPC actor id shaping");
  assert(!worldSource.includes("idleUntilMs: actorNowMs + 400"), "world.js should not own NPC idle seed shaping");
  assert(!worldSource.includes("actorId: npc && npc.actorId ? npc.actorId : ''"), "world.js should not own QA NPC target shaping");
  assert(!worldSource.includes("function hashTownNpcSeed(text)"), "world.js should not keep the old town NPC seed wrapper");
  assert(!worldSource.includes("const resolveTownNpcRoamBounds = (npc) => {"), "world.js should not own NPC roam bounds resolution");
  assert(!worldSource.includes("const resolveTownNpcRoamingRadius = (npc, roamBounds) => {"), "world.js should not own NPC roaming radius resolution");
  assert(!worldSource.includes("let staticNpcBaseTiles = new Map();"), "world.js should not own static NPC tile state");
  assert(!worldSource.includes("let loadedChunkNpcActors = new Map();"), "world.js should not own loaded chunk NPC actor state");
  assert(!worldSource.includes("window.refreshTutorialGateStates = refreshTutorialGateStates;"), "world.js should not directly publish refreshTutorialGateStates");
  assert(!worldSource.includes("window.isTutorialGateLocked = isTutorialGateLocked;"), "world.js should not directly publish isTutorialGateLocked");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "town-npc-runtime.js") });
  const runtime = window.WorldTownNpcRuntime;
  assert(runtime, "town NPC runtime should be available after evaluation");
  assert(typeof runtime.hashTownNpcSeed === "function", "town NPC runtime should expose deterministic NPC seed helper");
  assert(typeof runtime.getVisualTileId === "function", "town NPC runtime should expose visual tile resolver");
  assert(typeof runtime.buildStructureBoundsList === "function", "town NPC runtime should expose structure bounds builder");
  assert(typeof runtime.createTownNpcActorRecord === "function", "town NPC runtime should expose actor record builder");
  assert(typeof runtime.listQaNpcTargets === "function", "town NPC runtime should expose QA target snapshot builder");
  assert(typeof runtime.resolveTownNpcRoamBounds === "function", "town NPC runtime should expose roam bounds resolver");
  assert(typeof runtime.resolveTownNpcRoamingRadius === "function", "town NPC runtime should expose roaming radius resolver");
  assert(typeof runtime.updateWorldNpcRuntime === "function", "town NPC runtime should expose NPC update runtime");
  assert(typeof runtime.applyTownNpcShadowBudget === "function", "town NPC runtime should expose NPC shadow budgeting");
  assert(typeof runtime.publishTutorialGateHooks === "function", "town NPC runtime should expose tutorial gate hook publication");
  assert(typeof runtime.refreshTutorialActorStates === "function", "town NPC runtime should expose tutorial actor visibility refresh");
  assert(typeof runtime.isTutorialActorVisible === "function", "town NPC runtime should expose tutorial actor visibility policy");

  const TileId = {
    SOLID_NPC: 99,
    OBSTACLE: 98,
    GRASS: 1,
    FLOOR_WOOD: 8,
    FENCE: 2,
    WOODEN_GATE_CLOSED: 3,
    WOODEN_GATE_OPEN: 4,
    DOOR_CLOSED: 5,
    DOOR_OPEN: 6,
    STAIRS_RAMP: 7
  };
  runtime.resetStaticNpcBaseTiles();
  runtime.rememberStaticNpcBaseTile(5, 6, 0, TileId.GRASS);
  assert(runtime.getVisualTileId(TileId, TileId.SOLID_NPC, 5, 6, 0) === TileId.GRASS, "visual tile resolver should recover stored NPC base tiles");
  runtime.rememberStaticObjectBaseTile(7, 8, 0, TileId.FLOOR_WOOD);
  assert(runtime.getVisualTileId(TileId, TileId.OBSTACLE, 7, 8, 0) === TileId.FLOOR_WOOD, "visual tile resolver should recover stored object base tiles");
  runtime.resetStaticNpcBaseTiles();
  assert(runtime.getVisualTileId(TileId, TileId.OBSTACLE, 7, 8, 0) === TileId.OBSTACLE, "static tile reset should clear object base tiles too");
  assert(runtime.isFenceConnectorTile(TileId, TileId.WOODEN_GATE_OPEN), "wooden gates should remain fence connectors");
  assert(runtime.getDoorOpenTileId(TileId, { isWoodenGate: true }) === TileId.WOODEN_GATE_OPEN, "wooden gates should open as wooden gates");

  const actor = {
    x: 2,
    y: 2,
    z: 0,
    homeX: 2,
    homeY: 2,
    roamBounds: { xMin: 1, xMax: 3, yMin: 1, yMax: 3 },
    roamingRadius: 1
  };
  assert(runtime.isTownNpcStepWithinBounds({ mapSize: 8 }, actor, 3, 2), "NPC step bounds should allow in-range steps");
  assert(!runtime.isTownNpcStepWithinBounds({ mapSize: 8 }, actor, 4, 2), "NPC step bounds should reject out-of-radius steps");

  const structureBoundsList = [
    { structureId: "shop", z: 0, xMin: 10, xMax: 14, yMin: 20, yMax: 24 },
    { structureId: "tower", z: 1, xMin: 3, xMax: 4, yMin: 3, yMax: 4 }
  ];
  const dialogueNpc = { name: "Guide", x: 12, y: 22, z: 0, dialogueId: "guide_intro" };
  const dialogueBounds = runtime.resolveTownNpcRoamBounds({ mapSize: 32, npc: dialogueNpc, structureBoundsList });
  assert(dialogueBounds.xMin === 7 && dialogueBounds.xMax === 17, "dialogue NPCs should get expanded structure roam bounds");
  assert(runtime.resolveTownNpcRoamingRadius(dialogueNpc, dialogueBounds) === 4, "dialogue NPC radius should scale from structure bounds");
  assert(runtime.resolveTownNpcRoamingRadius({ name: "Guide", x: 12, y: 22, z: 0, dialogueId: "guide_intro", roamingRadiusOverride: 0 }, dialogueBounds) === 0, "authored stationary NPCs should override dialogue roam policy");
  const nearbyTravelNpc = { name: "Ferry", x: 15, y: 25, z: 0, action: "Travel" };
  const travelBounds = runtime.resolveTownNpcRoamBounds({ mapSize: 32, npc: nearbyTravelNpc, structureBoundsList });
  assert(travelBounds.xMin === 8 && travelBounds.xMax === 16, "nearby travel NPCs should reuse nearest structure bounds");
  assert(runtime.resolveTownNpcRoamingRadius(nearbyTravelNpc, travelBounds) === 1, "travel NPCs without dialogue should stay tightly anchored");
  assert(runtime.resolveTownNpcRoamingRadius({ name: "Banker", x: 1, y: 1, z: 0 }, null) === 0, "bankers should not roam");
  assert(runtime.resolveTownNpcRoamingRadius({ name: "King Arthur", x: 1, y: 1, z: 0 }, null) === 1, "royal NPCs should have minimal pacing");
  {
    const bodyMesh = { isMesh: true, castShadow: true, userData: {} };
    const hitboxMesh = { isMesh: true, castShadow: false, userData: { type: "NPC" } };
    const shadowActor = {
      x: 100,
      y: 100,
      z: 0,
      mesh: {
        visible: true,
        traverse: (fn) => [bodyMesh, hitboxMesh].forEach(fn)
      }
    };
    runtime.applyTownNpcShadowBudget({ playerState: { x: 0, y: 0, z: 0 } }, shadowActor, 100, 100);
    assert(bodyMesh.castShadow === false, "far NPC body meshes should stop casting shadow-map work");
    assert(hitboxMesh.castShadow === false, "NPC interaction hitboxes should not be changed by shadow budgeting");
    runtime.applyTownNpcShadowBudget({ playerState: { x: 0, y: 0, z: 0 } }, shadowActor, 1, 1);
    assert(bodyMesh.castShadow === true, "near NPC body meshes should restore shadow casting");
  }
  const builtStructureBounds = runtime.buildStructureBoundsList({
    stampedStructures: [
      { structureId: "shop", z: 0 },
      { structureId: "missing", z: 0 },
      null
    ],
    getStampBounds: (structureId) => structureId === "shop"
      ? { xMin: 10, xMax: 14, yMin: 20, yMax: 24 }
      : null
  });
  assert(builtStructureBounds.length === 1 && builtStructureBounds[0].structureId === "shop", "structure bounds builder should keep only stamped structures with bounds");
  const actorRecord = runtime.createTownNpcActorRecord({
    actorNowMs: 1000,
    getTileHeightSafe: () => 0.25,
    index: 3,
    mapSize: 32,
    npc: { name: "Guide", x: 12, y: 22, z: 0, dialogueId: "guide_intro", appearanceId: "guide" },
    structureBoundsList
  });
  assert(actorRecord.actorId === "npc:guide:12:22:0", "actor record should derive stable fallback actor ids");
  assert(actorRecord.homeX === 12 && actorRecord.homeY === 22 && actorRecord.visualBaseY === 0.25, "actor record should initialize home and visual state");
  assert(actorRecord.roamEnabled && actorRecord.roamingRadius === 4, "actor record should include resolved roam policy");
  assert(actorRecord.idleUntilMs >= 1400 && Number.isFinite(actorRecord.animationSeed), "actor record should initialize deterministic idle timing and animation seed");
  const stationaryActorRecord = runtime.createTownNpcActorRecord({
    actorNowMs: 1000,
    getTileHeightSafe: () => 0,
    index: 4,
    mapSize: 32,
    npc: { spawnId: "tutorial:guide", name: "Guide", x: 12, y: 22, z: 0, dialogueId: "guide_intro", roamingRadiusOverride: 0 },
    structureBoundsList
  });
  assert(stationaryActorRecord.actorId === "tutorial:guide" && stationaryActorRecord.roamingRadius === 0 && !stationaryActorRecord.roamEnabled, "stationary actor records should preserve authored no-roam overrides");
  assert(runtime.isTutorialActorVisible({ TutorialRuntime: { getStep: () => 4 } }, { tutorialVisibleFromStep: 5 }) === false, "tutorial actor visibility should hide actors before their start step");
  assert(runtime.isTutorialActorVisible({ TutorialRuntime: { getStep: () => 5 } }, { tutorialVisibleFromStep: 5 }) === true, "tutorial actor visibility should show actors on their start step");
  assert(runtime.isTutorialActorVisible({ TutorialRuntime: { getStep: () => 11 } }, { tutorialVisibleUntilStep: 10 }) === false, "tutorial actor visibility should hide actors after their end step");
  assert(runtime.isTutorialActorVisible({ TutorialRuntime: { getStep: () => 4 } }, { tutorialVisibleFromStep: null, tutorialVisibleUntilStep: null }) === true, "null tutorial visibility bounds should mean always visible");
  assert(runtime.isTutorialActorVisible({ TutorialRuntime: { getStep: () => 4 } }, {}) === true, "missing tutorial visibility bounds should mean always visible");

  {
    runtime.resetStaticNpcBaseTiles();
    const logicalMap = [[
      [TileId.GRASS, TileId.GRASS, TileId.GRASS],
      [TileId.GRASS, TileId.SOLID_NPC, TileId.GRASS],
      [TileId.GRASS, TileId.GRASS, TileId.GRASS]
    ]];
    runtime.rememberStaticNpcBaseTile(1, 1, 0, TileId.GRASS);
    const stepGatedActor = runtime.createTownNpcActorRecord({
      actorNowMs: 1000,
      getTileHeightSafe: () => 0.5,
      index: 5,
      mapSize: 8,
      npc: {
        spawnId: "npc:relocated_guide",
        name: "Tutorial Guide",
        x: 1,
        y: 1,
        z: 0,
        roamingRadiusOverride: 0,
        tutorialVisibleFromStep: 2
      },
      structureBoundsList: []
    });
    stepGatedActor.mesh = { visible: true };
    stepGatedActor.hitbox = { visible: true, userData: { uid: {} } };
    let tutorialStep = 1;
    const visibilityContext = {
      TileId,
      logicalMap,
      npcsToRender: [stepGatedActor],
      TutorialRuntime: { getStep: () => tutorialStep },
      getTileHeightSafe: () => 0.5,
      now: () => 2000
    };
    runtime.refreshTutorialActorStates(visibilityContext);
    assert(stepGatedActor.tutorialVisibilityActive === false, "tutorial actor refresh should hide actors before their authored step");
    assert(logicalMap[0][1][1] === TileId.GRASS, "hidden tutorial actors should release their occupied tile");
    assert(stepGatedActor.mesh.visible === false && stepGatedActor.hitbox.userData.ignoreRaycast === true, "hidden tutorial actors should hide visuals and raycasts");

    tutorialStep = 2;
    runtime.refreshTutorialActorStates(visibilityContext);
    assert(stepGatedActor.tutorialVisibilityActive === true, "tutorial actor refresh should reveal actors at their authored step");
    assert(logicalMap[0][1][1] === TileId.SOLID_NPC, "revealed tutorial actors should reclaim their occupied tile");
    assert(stepGatedActor.mesh.visible === true && stepGatedActor.hitbox.userData.ignoreRaycast === false, "revealed tutorial actors should restore visuals and raycasts");
  }

  const stationaryRig = {
    torso: makeRigNode(),
    head: makeRigNode(),
    leftArm: makeRigNode(),
    rightArm: makeRigNode(),
    leftLowerArm: makeRigNode(),
    rightLowerArm: makeRigNode(),
    leftLeg: makeRigNode(),
    rightLeg: makeRigNode(),
    leftLowerLeg: makeRigNode(),
    rightLowerLeg: makeRigNode()
  };
  const stationaryMesh = {
    position: makeVec3(0, 0, 0),
    userData: {
      rig: stationaryRig,
      baseY: 0
    }
  };
  runtime.applyTownNpcRigAnimation({
    mesh: stationaryMesh,
    roamEnabled: false,
    roamingRadius: 0,
    moveDurationMs: 0,
    animationSeed: 7
  }, 12345, 1.25);
  assert(stationaryMesh.position.y === 1.25, "stationary NPC rig animation should not bob the mesh");
  assert(stationaryRig.leftArm.rotation.x === 0 && stationaryRig.rightArm.rotation.x === 0, "stationary NPC rig animation should not swing arms");
  assert(stationaryRig.leftLeg.rotation.x === 0 && stationaryRig.rightLeg.rotation.x === 0, "stationary NPC rig animation should not move legs");

  const roamIdleRig = {
    torso: makeRigNode(),
    head: makeRigNode(),
    leftArm: makeRigNode(),
    rightArm: makeRigNode(),
    leftLowerArm: makeRigNode(),
    rightLowerArm: makeRigNode(),
    leftLeg: makeRigNode(),
    rightLeg: makeRigNode(),
    leftLowerLeg: makeRigNode(),
    rightLowerLeg: makeRigNode()
  };
  const roamIdleMesh = {
    position: makeVec3(0, 0, 0),
    userData: {
      rig: roamIdleRig,
      baseY: 0
    }
  };
  runtime.applyTownNpcRigAnimation({
    mesh: roamIdleMesh,
    roamEnabled: true,
    roamingRadius: 4,
    moveDurationMs: 0,
    animationSeed: 7
  }, 12345, 1.25);
  assert(roamIdleMesh.position.y === 1.25, "idle roam-capable NPCs should keep their feet planted while waiting");
  assert(roamIdleRig.leftArm.rotation.x === 0 && roamIdleRig.rightArm.rotation.x === 0, "idle roam-capable NPCs should not swing arms while waiting");
  assert(roamIdleRig.leftLowerArm.rotation.x === 0 && roamIdleRig.rightLowerArm.rotation.x === 0, "idle roam-capable NPCs should not swing forearms while waiting");
  assert(roamIdleRig.leftLeg.rotation.x === 0 && roamIdleRig.rightLeg.rotation.x === 0, "idle roam-capable NPCs should not move upper legs while waiting");
  assert(roamIdleRig.leftLowerLeg.rotation.x === 0 && roamIdleRig.rightLowerLeg.rotation.x === 0, "idle roam-capable NPCs should not bend knees while waiting");

  const movingRig = {
    torso: makeRigNode(),
    head: makeRigNode(),
    leftArm: makeRigNode(),
    rightArm: makeRigNode(),
    leftLowerArm: makeRigNode(),
    rightLowerArm: makeRigNode(),
    leftLeg: makeRigNode(),
    rightLeg: makeRigNode(),
    leftLowerLeg: makeRigNode(),
    rightLowerLeg: makeRigNode()
  };
  const movingMesh = {
    position: makeVec3(0, 0, 0),
    userData: {
      rig: movingRig,
      baseY: 0
    }
  };
  runtime.applyTownNpcRigAnimation({
    mesh: movingMesh,
    roamEnabled: true,
    roamingRadius: 4,
    moveDurationMs: 720,
    animationSeed: 7
  }, 1000, 1.25);
  assert(movingRig.leftArm.rotation.x !== 0 && movingRig.rightArm.rotation.x !== 0, "walking NPC rig animation should still swing arms");
  assert(movingRig.leftLeg.rotation.x !== 0 && movingRig.rightLeg.rotation.x !== 0, "walking NPC rig animation should still move legs");

  const qaTargets = runtime.listQaNpcTargets([
    {
      actorId: "npc:guide",
      spawnId: "guide_spawn",
      merchantId: "general_store",
      name: "Guide",
      action: "Talk-to",
      dialogueId: "guide_intro",
      x: 5,
      y: 6,
      z: 0,
      visualX: 5.5,
      visualY: 6.5,
      hitbox: {}
    },
    { name: "Fallback", x: 2, y: 3 }
  ]);
  assert(qaTargets.length === 2, "QA target snapshot should include each rendered NPC input");
  assert(qaTargets[0].actorId === "npc:guide" && qaTargets[0].rendered, "QA target snapshot should preserve rendered NPC identity");
  assert(qaTargets[0].visualX === 5.5 && qaTargets[0].visualY === 6.5, "QA target snapshot should preserve explicit visual positions");
  assert(qaTargets[1].actorId === "" && qaTargets[1].visualX === 2 && qaTargets[1].visualY === 3, "QA target snapshot should default missing identity and visual positions");
  assert(qaTargets[1].z === 0 && !qaTargets[1].rendered, "QA target snapshot should default missing z and hitbox state");
  assert(qaTargets[0].tutorialVisibilityActive === true && qaTargets[0].tutorialVisibleFromStep === null, "QA target snapshot should expose default tutorial visibility");
  assert(qaTargets[1].tutorialVisibleFromStep === null && qaTargets[1].tutorialVisibleUntilStep === null, "QA target snapshot should keep null tutorial visibility as unbounded");

  {
    let buildContextCalls = 0;
    let minimapUpdates = 0;
    const windowRef = {};
    const logicalMap = [[[TileId.WOODEN_GATE_CLOSED]]];
    const door = {
      x: 0,
      y: 0,
      z: 0,
      isWoodenGate: true,
      tutorialRequiredStep: 2,
      isOpen: false,
      openRot: 1,
      closedRot: 0,
      targetRotation: 0
    };
    let tutorialStep = 1;
    runtime.publishTutorialGateHooks({
      windowRef,
      buildContext: () => {
        buildContextCalls += 1;
        return {
          TileId,
          TutorialRuntime: { getStep: () => tutorialStep },
          doorsToRender: [door],
          logicalMap,
          updateMinimapCanvas: () => { minimapUpdates += 1; }
        };
      }
    });
    assert(typeof windowRef.isTutorialGateLocked === "function", "runtime should publish isTutorialGateLocked");
    assert(typeof windowRef.refreshTutorialGateStates === "function", "runtime should publish refreshTutorialGateStates");
    assert(windowRef.isTutorialGateLocked(door) === true, "published tutorial gate lock hook should delegate to runtime lock policy");
    windowRef.refreshTutorialGateStates();
    assert(door.isOpen === false && logicalMap[0][0][0] === TileId.WOODEN_GATE_CLOSED, "published tutorial gate refresh should keep locked gates closed");
    tutorialStep = 2;
    windowRef.refreshTutorialGateStates();
    assert(door.isOpen === true && logicalMap[0][0][0] === TileId.WOODEN_GATE_OPEN, "published tutorial gate refresh should open unlocked gates");
    assert(buildContextCalls === 3 && minimapUpdates === 2, "published tutorial gate hooks should resolve context lazily and refresh the minimap");
  }

  {
    const windowRef = {};
    const logicalMap = [[[TileId.DOOR_CLOSED]]];
    const door = {
      x: 0,
      y: 0,
      z: 0,
      isWoodenGate: false,
      tutorialRequiredStep: 1,
      tutorialAutoOpenOnUnlock: false,
      isOpen: false,
      openRot: 1,
      closedRot: 0,
      targetRotation: 0
    };
    runtime.publishTutorialGateHooks({
      windowRef,
      context: {
        TileId,
        TutorialRuntime: { getStep: () => 1 },
        doorsToRender: [door],
        logicalMap
      }
    });
    windowRef.refreshTutorialGateStates();
    assert(door.isOpen === false && door.targetRotation === 0 && logicalMap[0][0][0] === TileId.DOOR_CLOSED, "guide-unlocked cabin doors should stay closed when auto-open is disabled");
  }

  console.log("Town NPC runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
