const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext(overrides = {}) {
  const tileIds = {
    GRASS: 1,
    WATER_SHALLOW: 16
  };
  const logicalPlane = [
    [tileIds.GRASS, tileIds.WATER_SHALLOW, tileIds.GRASS],
    [tileIds.GRASS, tileIds.GRASS, tileIds.GRASS],
    [tileIds.GRASS, tileIds.GRASS, tileIds.GRASS]
  ];
  const context = {
    windowRef: { innerWidth: 200, innerHeight: 100, QA_PIER_DEBUG: false },
    mapSize: 3,
    playerState: { x: 0, y: 0, z: 0 },
    logicalMap: [logicalPlane],
    camera: { updateMatrixWorld: () => {} },
    mouse: { x: 0, y: 0 },
    raycaster: {
      setFromCamera: () => {},
      intersectObjects: () => []
    },
    environmentMeshes: [],
    isWaterTileId: (tile) => tile === tileIds.WATER_SHALLOW,
    isWalkableTileId: (tile) => tile === tileIds.GRASS,
    isPierDeckTile: () => false,
    findNearestPierDeckBoardingTile: () => null,
    getActivePierConfig: () => null,
    isNearPierBoundsTile: () => false,
    emitPierDebug: () => {},
    isStandableTile: () => true
  };
  return Object.assign(context, overrides);
}

function makeHit(type, x, y, extraUserData = {}) {
  return {
    object: { userData: Object.assign({ type, z: 0 }, extraUserData) },
    point: { x, z: y }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-raycast-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const pathfindingRuntimeIndex = manifestSource.indexOf('id: "input-pathfinding-runtime"');
  const raycastRuntimeIndex = manifestSource.indexOf('id: "input-raycast-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-raycast-runtime.js?raw"), "legacy manifest should import the input raycast runtime raw script");
  assert(pathfindingRuntimeIndex !== -1 && raycastRuntimeIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input raycast runtime");
  assert(pathfindingRuntimeIndex < raycastRuntimeIndex && raycastRuntimeIndex < inputRenderIndex, "legacy manifest should load input raycast runtime before input-render.js");

  assert(runtimeSource.includes("window.InputRaycastRuntime"), "input raycast runtime should expose a window runtime");
  assert(runtimeSource.includes("function normalizeRaycastHit"), "input raycast runtime should own hit normalization");
  assert(runtimeSource.includes("function getRaycastHitPriority"), "input raycast runtime should own hit priority");
  assert(runtimeSource.includes("function findQaRaycastHitNear"), "input raycast runtime should own QA nearby hit search");
  assert(runtimeSource.includes("data.type === 'GROUND' || data.type === 'WALL' || data.type === 'TOWER' || data.type === 'WATER'"), "input raycast runtime should normalize world mesh hits");
  assert(runtimeSource.includes("!context.isWaterTileId(tile)"), "input raycast runtime should treat pier-overlaid walkable water hits as ground");

  assert(inputSource.includes("function getInputRaycastRuntime()"), "input-render.js should resolve the input raycast runtime");
  assert(inputSource.includes("buildInputRaycastRuntimeContext"), "input-render.js should provide a narrow raycast runtime context");
  assert(inputSource.includes("runtime.getRaycastHit(buildInputRaycastRuntimeContext()"), "input-render.js should delegate selected hit resolution to raycast runtime");
  assert(inputSource.includes("runtime.findQaRaycastHitNear(buildInputRaycastRuntimeContext()"), "input-render.js should delegate QA raycast search to raycast runtime");
  assert(!inputSource.includes("function getRaycastHitPriority("), "input-render.js should not own raycast hit priority");
  assert(!inputSource.includes("const seen = new Set();"), "input-render.js should not own raycast dedupe traversal");
  assert(!inputSource.includes("data.type === 'GROUND' || data.type === 'WALL' || data.type === 'TOWER' || data.type === 'WATER'"), "input-render.js should not own world hit normalization");

  const sandbox = { window: {}, Math, Number, Set, String };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputRaycastRuntime;
  assert(runtime, "input raycast runtime should execute in isolation");

  {
    const context = makeContext();
    const hit = runtime.normalizeRaycastHit(context, makeHit("GROUND", 0.4, 1.4));
    assert(hit && hit.type === "GROUND" && hit.gridX === 0 && hit.gridY === 1, "runtime should normalize ground mesh hits to grid tiles");
  }

  {
    const context = makeContext();
    const hit = runtime.normalizeRaycastHit(context, makeHit("WATER", 2.1, 0.2));
    assert(hit && hit.type === "GROUND" && hit.gridX === 2 && hit.gridY === 0, "runtime should resolve walkable pier-overlaid water hits as ground");
  }

  {
    const context = makeContext({
      playerState: { x: 1, y: 1, z: 0 },
      isPierDeckTile: (x, y) => x === 1 && y === 1,
      getActivePierConfig: () => ({ xMin: 0, xMax: 2, yStart: 1, yEnd: 2, entryY: 0 })
    });
    const hit = runtime.normalizeRaycastHit(context, makeHit("WATER", 1.1, 0.1, { isPierStep: true }));
    assert(hit && hit.pierStepDescend === true && hit.type === "GROUND" && hit.gridY === 0, "runtime should preserve pier step descend snapping");
  }

  {
    assert(runtime.getRaycastHitPriority({ type: "ENEMY" }) < runtime.getRaycastHitPriority({ type: "GROUND_ITEM" }), "enemies should outrank ground items");
    assert(runtime.getRaycastHitPriority({ type: "DOOR" }) < runtime.getRaycastHitPriority({ type: "TREE" }), "doors should outrank resource nodes");
  }

  {
    const context = makeContext();
    context.raycaster.intersectObjects = () => [
      makeHit("GROUND_ITEM", 1, 1, { uid: "item-1", name: "Coins" }),
      makeHit("ENEMY", 1, 1, { uid: "enemy-1", name: "Rat" }),
      makeHit("GROUND_ITEM", 1, 1, { uid: "item-1", name: "Coins" })
    ];
    const hits = runtime.getRaycastHits(context, 100, 50, 8);
    assert(hits.length === 2, "runtime should dedupe repeated raycast hits by stable hit key");
    const selected = runtime.getRaycastHit(context, 100, 50);
    assert(selected && selected.type === "ENEMY", "runtime should select the highest priority raycast hit");
    const qaHits = runtime.listQaRaycastHitsAt(context, 100, 50, 8);
    assert(qaHits.length === 2 && qaHits[0].priority > qaHits[1].priority, "runtime should expose QA raycast hit priority details");
  }

  {
    const context = makeContext();
    context.raycaster.intersectObjects = () => [
      makeHit("NPC", 1, 1, { uid: "npc-1", name: "Shopkeeper" })
    ];
    const nearby = runtime.findQaRaycastHitNear(context, 100, 50, "npc", "shop", 0, 8);
    assert(nearby && nearby.uid === "npc-1" && nearby.name === "Shopkeeper", "runtime should find QA hits near a screen point");
  }

  console.log("Input raycast runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
