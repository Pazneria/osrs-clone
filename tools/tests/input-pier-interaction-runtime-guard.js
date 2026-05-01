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
    [tileIds.GRASS, tileIds.GRASS, tileIds.GRASS, tileIds.GRASS],
    [tileIds.GRASS, tileIds.GRASS, tileIds.GRASS, tileIds.GRASS],
    [tileIds.WATER_SHALLOW, tileIds.WATER_SHALLOW, tileIds.WATER_SHALLOW, tileIds.WATER_SHALLOW],
    [tileIds.WATER_SHALLOW, tileIds.WATER_SHALLOW, tileIds.WATER_SHALLOW, tileIds.WATER_SHALLOW]
  ];
  const pierConfig = { xMin: 1, xMax: 2, yStart: 1, yEnd: 2, entryY: 0 };
  return Object.assign({
    windowRef: { QA_PIER_DEBUG: false },
    mapSize: 4,
    playerState: { x: 1, y: 1, z: 0 },
    logicalMap: [logicalPlane],
    sharedMaterials: { activePierConfig: pierConfig },
    worldPierRuntime: {
      getActivePierConfig: (sharedMaterials) => sharedMaterials.activePierConfig || null,
      isPierDeckTile: (config, x, y, z) => !!(config && z === 0 && x >= config.xMin && x <= config.xMax && y >= config.yStart && y <= config.yEnd),
      isPierSideWaterTile: (config, x, y, z) => !!(config && z === 0 && y >= config.yStart + 1 && y <= config.yEnd && (x === config.xMin - 1 || x === config.xMax + 1))
    },
    addChatMessage: () => {},
    isWaterTileId: (tile) => tile === tileIds.WATER_SHALLOW,
    isStandableTile: (x, y) => y <= 1 || (x >= 1 && x <= 2 && y === 2),
    findPath: (_sx, _sy, tx, ty) => [{ x: tx, y: ty }]
  }, overrides);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-pier-interaction-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const pathfindingIndex = manifestSource.indexOf('id: "input-pathfinding-runtime"');
  const pierIndex = manifestSource.indexOf('id: "input-pier-interaction-runtime"');
  const raycastIndex = manifestSource.indexOf('id: "input-raycast-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-pier-interaction-runtime.js?raw"), "legacy manifest should import the input pier interaction runtime raw script");
  assert(pathfindingIndex !== -1 && pierIndex !== -1 && raycastIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input pier interaction runtime");
  assert(pathfindingIndex < pierIndex && pierIndex < raycastIndex && pierIndex < inputRenderIndex, "legacy manifest should load pier interaction before raycast and input-render.js");

  assert(runtimeSource.includes("window.InputPierInteractionRuntime"), "input pier interaction runtime should expose a window runtime");
  assert(runtimeSource.includes("function findNearestFishableWaterEdgeTile"), "input pier interaction runtime should own fishable water edge resolution");
  assert(runtimeSource.includes("function buildPierStepDescendPath"), "input pier interaction runtime should own pier step descent fallback paths");
  assert(runtimeSource.includes("function isPierProtectedWaterTile"), "input pier interaction runtime should own pier-protected water classification for input");
  assert(runtimeSource.includes("runtime.isPierSideWaterTile"), "input pier interaction runtime should reuse the world pier side-water classifier when available");

  assert(inputSource.includes("function getInputPierInteractionRuntime()"), "input-render.js should resolve the input pier interaction runtime");
  assert(inputSource.includes("buildInputPierInteractionRuntimeContext"), "input-render.js should provide a narrow pier interaction runtime context");
  assert(inputSource.includes("runtime.findNearestFishableWaterEdgeTile(buildInputPierInteractionRuntimeContext()"), "input-render.js should delegate fishable water edge resolution");
  assert(inputSource.includes("runtime.buildPierStepDescendPath(buildInputPierInteractionRuntimeContext()"), "input-render.js should delegate pier descend fallback path construction");
  assert(!inputSource.includes("function forEachTileInSearchRing"), "input-render.js should not own pier search-ring traversal");
  assert(!inputSource.includes("const shoreCandidates = [pierConfig.entryY"), "input-render.js should not own pier step descent path details");
  assert(!inputSource.includes("&& (x === (pierConfig.xMin - 1) || x === (pierConfig.xMax + 1))"), "input-render.js should not own pier side-water bounds inline");

  const sandbox = { window: {}, Math, Number, Object, String, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputPierInteractionRuntime;
  assert(runtime, "input pier interaction runtime should execute in isolation");

  {
    const context = makeContext();
    assert(runtime.getActivePierConfig(context) === context.sharedMaterials.activePierConfig, "runtime should resolve the active pier config");
    assert(runtime.isPierDeckTile(context, 1, 1, 0), "runtime should classify pier deck tiles");
    assert(runtime.isNearPierBoundsTile(context, 0, 0, 0, 1), "runtime should classify tiles near pier bounds");
    assert(runtime.isPierProtectedWaterTile(context, 0, 2, 0), "runtime should classify pier side water as protected");
  }

  {
    const context = makeContext();
    const boarding = runtime.findNearestPierDeckBoardingTile(context, 1, 2, 0);
    assert(boarding && boarding.x === 1 && boarding.y === 2, "runtime should find nearby pier deck boarding tiles");
  }

  {
    const context = makeContext();
    const edge = runtime.findNearestFishableWaterEdgeTile(context, 1, 2);
    assert(edge && edge.x === 1 && edge.y === 2, "runtime should resolve fishable water when standing on the pier");
    assert(runtime.hasPierFishingApproachForWaterTile(context, 1, 2, 0), "runtime should detect pier fishing approach tiles");
  }

  {
    const context = makeContext({
      playerState: { x: 0, y: 1, z: 0 },
      isStandableTile: (x, y) => y <= 1
    });
    const edge = runtime.findNearestFishableWaterEdgeTile(context, 0, 2);
    assert(edge && edge.x === 0 && edge.y === 2, "runtime should resolve dry bank fishing approaches");
    assert(runtime.hasDryFishingApproachForWaterTile(context, 0, 2, 0), "runtime should detect dry fishing approach tiles");
  }

  {
    let debugMessage = "";
    const context = makeContext({
      windowRef: { QA_PIER_DEBUG: true },
      addChatMessage: (text) => { debugMessage = text; }
    });
    const pathResult = runtime.buildPierStepDescendPath(context, 1, 1, 1, 0, 0);
    assert(Array.isArray(pathResult) && pathResult.length === 2 && pathResult[1].y === 0, "runtime should build pier step descent fallback paths");
    assert(debugMessage.includes("stair fallback step"), "runtime should preserve pier debug output");
  }

  console.log("Input pier interaction runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
