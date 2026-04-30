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
  assert(runtimeSource.includes("let staticNpcBaseTiles = new Map();"), "town NPC runtime should own static NPC tile state");
  assert(runtimeSource.includes("let loadedChunkNpcActors = new Map();"), "town NPC runtime should own loaded chunk NPC actor state");
  assert(worldSource.includes("WorldTownNpcRuntime"), "world.js should delegate town NPC behavior");
  assert(worldSource.includes("worldTownNpcRuntime.updateWorldNpcRuntime(buildTownNpcRuntimeContext(), frameNowMs);"), "world.js should delegate NPC update ticks");
  assert(worldSource.includes("worldTownNpcRuntime.resetStaticNpcBaseTiles();"), "world.js should delegate static NPC tile reset");
  assert(worldSource.includes("worldTownNpcRuntime.setLoadedChunkNpcActors(key, renderedNpcActors);"), "world.js should delegate chunk NPC actor tracking");
  assert(!worldSource.includes("function applyTownNpcRigAnimation("), "world.js should not own town NPC rig animation");
  assert(!worldSource.includes("function chooseTownNpcNextStep("), "world.js should not own town NPC roaming step selection");
  assert(!worldSource.includes("let staticNpcBaseTiles = new Map();"), "world.js should not own static NPC tile state");
  assert(!worldSource.includes("let loadedChunkNpcActors = new Map();"), "world.js should not own loaded chunk NPC actor state");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "town-npc-runtime.js") });
  const runtime = window.WorldTownNpcRuntime;
  assert(runtime, "town NPC runtime should be available after evaluation");
  assert(typeof runtime.hashTownNpcSeed === "function", "town NPC runtime should expose deterministic NPC seed helper");
  assert(typeof runtime.getVisualTileId === "function", "town NPC runtime should expose visual tile resolver");
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

  console.log("Town NPC runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
