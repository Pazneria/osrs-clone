const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makePlane(size, fill = 0) {
  return Array(size).fill(0).map(() => Array(size).fill(fill));
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "terrain-setup-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const terrainRuntimeIndex = manifestSource.indexOf('id: "world-terrain-setup-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(terrainRuntimeIndex !== -1, "legacy manifest should include the terrain setup runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(terrainRuntimeIndex < worldIndex, "legacy manifest should load terrain setup before world.js");
  assert(runtimeSource.includes("window.WorldTerrainSetupRuntime"), "terrain setup runtime should expose a window runtime");
  assert(runtimeSource.includes("function applyBaseTerrainSetup(options = {})"), "terrain setup runtime should own base terrain setup");
  assert(runtimeSource.includes("function createTownBounds(options = {})"), "terrain setup runtime should own town bounds setup");
  assert(runtimeSource.includes("function createRiverSampler(mapSize)"), "terrain setup runtime should own legacy river sampling");
  assert(runtimeSource.includes("function applyEllipseWater(options = {})"), "terrain setup runtime should own lake/pond carving");
  assert(worldSource.includes("WorldTerrainSetupRuntime"), "world.js should delegate terrain setup");
  assert(worldSource.includes("worldTerrainSetupRuntime.applyBaseTerrainSetup"), "world.js should call the terrain setup runtime");
  assert(!worldSource.includes("const LEGACY_COORD_MAP_SIZE = 486;"), "world.js should not own legacy river coordinate scaling");
  assert(!worldSource.includes("const sampleRiverAtY = (y) => {"), "world.js should not own river sampling");
  assert(!worldSource.includes("const carveWaterTile = (x, y, depthNorm) => {"), "world.js should not own base water carving");
  assert(!worldSource.includes("const riverBridgeRows = ["), "world.js should not own river bridge row setup");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "terrain-setup-runtime.js") });
  const runtime = window.WorldTerrainSetupRuntime;
  assert(runtime, "terrain setup runtime should be available after evaluation");

  const stampMap = {
    castle_floor: ["WWW", "W W"],
    store: ["SS"]
  };
  const stampedStructures = [
    { structureId: "castle_ground", stampId: "castle_floor", x: 12, y: 14 },
    { structureId: "general_store", stampId: "store", x: 4, y: 5 }
  ];
  const castleBounds = runtime.getStampBounds(stampedStructures, stampMap, "castle_ground");
  assert(castleBounds.xMin === 12 && castleBounds.xMax === 14, "stamp bounds should use blueprint width");
  assert(castleBounds.yMin === 14 && castleBounds.yMax === 15, "stamp bounds should use blueprint height");
  const expanded = runtime.expandBounds(castleBounds, 2, 3, 32);
  assert(expanded.xMin === 10 && expanded.yMin === 11, "expanded bounds should apply padding");

  const mapSize = 32;
  const logicalMap = [makePlane(mapSize, -1)];
  const heightMap = [makePlane(mapSize, -1)];
  const tileIds = {
    GRASS: 0,
    FLOOR_WOOD: 6,
    SHORE: 20,
    WATER_SHALLOW: 21,
    WATER_DEEP: 22
  };
  const setup = runtime.applyBaseTerrainSetup({
    castleFrontPond: { cx: 12, cy: 21, rx: 2, ry: 2 },
    deepWaterCenter: { xMin: 23, xMax: 24, yMin: 23, yMax: 24 },
    heightMap,
    isPierSideWaterTile: (pierConfig, x, y) => x === pierConfig.xMin - 1 && y >= pierConfig.yStart && y <= pierConfig.yEnd,
    lakeDefs: [{ cx: 22, cy: 8, rx: 2, ry: 2 }],
    logicalMap,
    mapSize,
    pierConfig: { xMin: 15, xMax: 17, yStart: 23, yEnd: 25, entryY: 22 },
    pierDeckTopHeight: 0.28,
    stampMap,
    stampedStructures,
    tileIds
  });

  assert(typeof setup.inTownCore === "function", "terrain setup should return town-core lookup");
  assert(typeof setup.terrainNoise === "function", "terrain setup should return terrain noise helper");
  assert(typeof setup.getStampBounds === "function", "terrain setup should return stamp bounds helper");
  assert(logicalMap[0][0][0] === 2, "terrain setup should keep solid map borders");
  assert(logicalMap[0][8][22] === tileIds.WATER_DEEP || logicalMap[0][8][22] === tileIds.WATER_SHALLOW, "terrain setup should carve authored lake water");
  assert(logicalMap[0][23][23] === tileIds.WATER_DEEP, "terrain setup should stamp deep-water center");
  assert(logicalMap[0][23][16] === tileIds.FLOOR_WOOD, "terrain setup should stamp pier deck tiles");
  assert(logicalMap[0][24][14] === tileIds.WATER_SHALLOW, "terrain setup should preserve pier side water");
  assert(logicalMap[0][22][16] === tileIds.SHORE, "terrain setup should stamp pier shoreline entry");

  console.log("World terrain setup runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
