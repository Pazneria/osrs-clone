const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "town-npc-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const townRuntimeIndex = manifestSource.indexOf('id: "world-town-npc-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(townRuntimeIndex !== -1 && worldIndex !== -1 && townRuntimeIndex < worldIndex, "legacy script manifest should load town NPC runtime before world.js");
  assert(runtimeSource.includes("window.WorldTownNpcRuntime"), "town NPC runtime should expose a window runtime");
  assert(runtimeSource.includes("function updateWorldNpcRuntime(context = {}, frameNowMs)"), "town NPC runtime should own NPC roaming update");
  assert(runtimeSource.includes("function applyTownNpcRigAnimation(actor, frameNowMs, visualBaseY)"), "town NPC runtime should own NPC rig animation");
  assert(runtimeSource.includes("function refreshTutorialGateStates(context = {})"), "town NPC runtime should own tutorial gate refresh behavior");
  assert(runtimeSource.includes("function buildStructureBoundsList(options = {})"), "town NPC runtime should own structure-bound shaping for NPC roam policy");
  assert(runtimeSource.includes("function createTownNpcActorRecord(options = {})"), "town NPC runtime should own town NPC actor record shaping");
  assert(runtimeSource.includes("function listQaNpcTargets(npcsToRender)"), "town NPC runtime should own QA NPC target snapshots");
  assert(runtimeSource.includes("function resolveTownNpcRoamBounds(options = {})"), "town NPC runtime should own NPC roam bounds resolution");
  assert(runtimeSource.includes("function resolveTownNpcRoamingRadius(npc, roamBounds)"), "town NPC runtime should own NPC roaming radius resolution");
  assert(runtimeSource.includes("let staticNpcBaseTiles = new Map();"), "town NPC runtime should own static NPC tile state");
  assert(runtimeSource.includes("let loadedChunkNpcActors = new Map();"), "town NPC runtime should own loaded chunk NPC actor state");
  assert(worldSource.includes("WorldTownNpcRuntime"), "world.js should delegate town NPC behavior");
  assert(worldSource.includes("worldTownNpcRuntime.updateWorldNpcRuntime(buildTownNpcRuntimeContext(), frameNowMs);"), "world.js should delegate NPC update ticks");
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

  const TileId = {
    SOLID_NPC: 99,
    GRASS: 1,
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
  const nearbyTravelNpc = { name: "Ferry", x: 15, y: 25, z: 0, action: "Travel" };
  const travelBounds = runtime.resolveTownNpcRoamBounds({ mapSize: 32, npc: nearbyTravelNpc, structureBoundsList });
  assert(travelBounds.xMin === 8 && travelBounds.xMax === 16, "nearby travel NPCs should reuse nearest structure bounds");
  assert(runtime.resolveTownNpcRoamingRadius(nearbyTravelNpc, travelBounds) === 1, "travel NPCs without dialogue should stay tightly anchored");
  assert(runtime.resolveTownNpcRoamingRadius({ name: "Banker", x: 1, y: 1, z: 0 }, null) === 0, "bankers should not roam");
  assert(runtime.resolveTownNpcRoamingRadius({ name: "King Arthur", x: 1, y: 1, z: 0 }, null) === 1, "royal NPCs should have minimal pacing");
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

  console.log("Town NPC runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
