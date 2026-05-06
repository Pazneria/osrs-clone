const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameTile(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function samePath(actual, expected) {
  return actual.length === expected.length && actual.every((step, index) => sameTile(step, expected[index]));
}

function makeGrid(size, fill) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

function makeContext(overrides = {}) {
  const tileIds = {
    OBSTACLE: 0,
    GRASS: 1,
    WATER_SHALLOW: 16,
    WATER_DEEP: 17,
    BANK_BOOTH: 10,
    SOLID_NPC: 8,
    SHOP_COUNTER: 5,
    STAIRS_RAMP: 7
  };
  const mapSize = overrides.mapSize || 5;
  const logicalPlane = makeGrid(mapSize, tileIds.GRASS);
  const heightPlane = makeGrid(mapSize, 0);
  return Object.assign({
    mapSize,
    planes: 1,
    pathfindMaxIterations: 25000,
    playerState: { z: 0 },
    logicalMap: [logicalPlane],
    heightMap: [heightPlane],
    tileIds,
    isWalkableTileId: (tile) => tile === tileIds.GRASS || tile === tileIds.STAIRS_RAMP,
    isWaterTileId: (tile) => tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP,
    isTutorialWalkTileAllowed: () => true,
    getStationApproachPositions: () => [],
    isPierProtectedWaterTile: () => false,
    isPierDeckTile: () => false,
    isPierFishingApproachTile: () => false
  }, overrides);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-pathfinding-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const playerAnimationRuntimeIndex = manifestSource.indexOf('id: "input-player-animation-runtime"');
  const pathfindingRuntimeIndex = manifestSource.indexOf('id: "input-pathfinding-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-pathfinding-runtime.js?raw"), "legacy manifest should import the input pathfinding runtime raw script");
  assert(playerAnimationRuntimeIndex !== -1 && pathfindingRuntimeIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input pathfinding runtime");
  assert(playerAnimationRuntimeIndex < pathfindingRuntimeIndex && pathfindingRuntimeIndex < inputRenderIndex, "legacy manifest should load input pathfinding runtime before input-render.js");

  assert(runtimeSource.includes("window.InputPathfindingRuntime"), "input pathfinding runtime should expose a window runtime");
  assert(runtimeSource.includes("function getPathTileId"), "input pathfinding runtime should own path tile resolution");
  assert(runtimeSource.includes("function isStandableTileForPath"), "input pathfinding runtime should own path standability checks");
  assert(runtimeSource.includes("function findPath"), "input pathfinding runtime should own pathfinding");
  assert(runtimeSource.includes("function estimatePathDistanceToAnyTarget"), "input pathfinding should score routes toward the nearest valid target");
  assert(runtimeSource.includes("function estimatePathLineDeviationToAnyTarget"), "input pathfinding should prefer equal-cost routes that stay close to the click line");
  assert(runtimeSource.includes("Math.SQRT2"), "input pathfinding should price diagonal steps differently from cardinal steps");
  assert(runtimeSource.includes("if (blockX || blockY) continue;"), "input pathfinding runtime should reject diagonal corner cutting");
  assert(runtimeSource.includes("Math.abs(currentHeight - nextHeight) > 0.3 && !isStairTransition"), "input pathfinding runtime should preserve the terrain height threshold");
  assert(runtimeSource.includes("restrictPierFishingToDeck"), "input pathfinding runtime should preserve pier fishing deck restriction");

  assert(inputSource.includes("function getInputPathfindingRuntime()"), "input-render.js should resolve the input pathfinding runtime");
  assert(inputSource.includes("buildInputPathfindingRuntimeContext"), "input-render.js should build a narrow pathfinding context");
  assert(inputSource.includes("runtime.findPath(buildInputPathfindingRuntimeContext()"), "input-render.js should delegate findPath to the input pathfinding runtime");
  assert(!inputSource.includes("const encodeTileKey = (x, y)"), "input-render.js should not own path tile-key encoding");
  assert(!inputSource.includes("let queue = [startKey]"), "input-render.js should not own BFS queue traversal");
  assert(!inputSource.includes("if (blockX || blockY) continue;"), "input-render.js should not own diagonal path rejection");

  const sandbox = { window: {}, Math, Number, Set, Map };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputPathfindingRuntime;
  assert(runtime, "input pathfinding runtime should execute in isolation");

  {
    const context = makeContext();
    context.logicalMap[0][1][0] = context.tileIds.OBSTACLE;
    context.logicalMap[0][0][1] = context.tileIds.OBSTACLE;
    const diagonalPath = runtime.findPath(context, 0, 0, 1, 1, false);
    assert(diagonalPath.length === 0, "pathfinding should not cut diagonally between blocked cardinal neighbors");
  }

  {
    const context = makeContext({ mapSize: 6 });
    const diagonalPath = runtime.findPath(context, 0, 0, 4, 4, false);
    assert(
      samePath(diagonalPath, [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }]),
      "open-terrain pathfinding should choose the direct diagonal route instead of walking two right-angle legs"
    );
  }

  {
    const context = makeContext({ mapSize: 8 });
    const shallowPath = runtime.findPath(context, 0, 0, 6, 3, false);
    assert(
      samePath(shallowPath, [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 3 }, { x: 6, y: 3 }]),
      "open-terrain pathfinding should distribute diagonal and cardinal steps along the straight click line"
    );
    assert(sameTile(shallowPath[shallowPath.length - 1], { x: 6, y: 3 }), "open-terrain path should still end on the clicked target");
  }

  {
    const context = makeContext({
      isTutorialWalkTileAllowed: (x, y) => !(x === 1 && y === 0)
    });
    assert(!runtime.isStandableTileForPath(context, 1, 0, 0), "path standability should respect tutorial movement bounds");
  }

  {
    const context = makeContext();
    context.logicalMap[0][1][1] = context.tileIds.WATER_SHALLOW;
    context.logicalMap[0][0][1] = context.tileIds.GRASS;
    assert(runtime.isStandableTileForPath(context, 1, 1, 0), "shallow water adjacent to land should remain standable");
    context.isPierProtectedWaterTile = (x, y) => x === 1 && y === 1;
    assert(!runtime.isStandableTileForPath(context, 1, 1, 0), "pier-protected shallow water should not be path-standable");
  }

  {
    const context = makeContext();
    context.logicalMap[0][1][2] = context.tileIds.WATER_DEEP;
    const pathToWater = runtime.findPath(context, 2, 0, 2, 1, true, "WATER");
    assert(pathToWater.length === 0, "water interactions should not path onto water tiles");
  }

  {
    const context = makeContext();
    context.logicalMap[0][1][2] = context.tileIds.SOLID_NPC;
    context.logicalMap[0][1][1] = context.tileIds.SHOP_COUNTER;
    const pathAcrossCounter = runtime.findPath(context, 0, 1, 2, 1, true, "NPC");
    assert(pathAcrossCounter.length === 0, "NPC interactions across a shop counter should be valid when already at the counter approach tile");
  }

  console.log("Input pathfinding runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
