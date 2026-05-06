const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const resourceRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-resource-render-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const resourceIndex = manifestSource.indexOf('id: "world-chunk-resource-render-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(resourceIndex !== -1 && worldIndex !== -1 && resourceIndex < worldIndex, "legacy script manifest should load chunk resource render runtime before world.js");
  assert(worldSource.includes("WorldChunkResourceRenderRuntime"), "world.js should delegate chunk resource render placement");
  assert(resourceRuntimeSource.includes("window.WorldChunkResourceRenderRuntime"), "chunk resource render runtime should expose a window runtime");
  assert(resourceRuntimeSource.includes("function collectChunkResourceVisualCounts(options = {})"), "chunk resource runtime should own tree/rock count collection");
  assert(resourceRuntimeSource.includes("function createChunkResourceRenderState(options = {})"), "chunk resource runtime should own tree/rock render state creation");
  assert(resourceRuntimeSource.includes("function sampleGroundTileCenterHeight(options = {}, tileX, tileY, layerZ)"), "chunk resource runtime should own rock ground-height sampling");
  assert(resourceRuntimeSource.includes("function appendChunkResourceVisual(options = {})"), "chunk resource runtime should own tree/rock instance placement");
  assert(resourceRuntimeSource.includes("hash2D(x, y, 331.71) * Math.PI * 2"), "chunk resource runtime should rotate trees deterministically");
  assert(!resourceRuntimeSource.includes("Math.random() * Math.PI * 2"), "chunk resource runtime should not randomize tree rotation on rebuild");
  assert(!worldSource.includes("const sampleGroundTileCenterHeight = (tileX, tileY, layerZ) => {"), "world.js should not own rock ground-height sampling");
  assert(!worldSource.includes("rockVisualCounts[visualId]"), "world.js should not bucket rock visual counts inline");
  assert(!worldSource.includes("tData.treeMap[tIdx]"), "world.js should not write tree interaction maps inline");
  assert(!worldSource.includes("setRockVisualState(rData, visualId, rockIndex, {"), "world.js should not place rock instances inline");

  global.window = {};
  vm.runInThisContext(resourceRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-resource-render-runtime.js") });
  const runtime = window.WorldChunkResourceRenderRuntime;
  assert(runtime, "chunk resource render runtime should be available after evaluation");

  const TileId = { TREE: 1, STUMP: 2, ROCK: 3, GRASS: 4 };
  const logicalMap = [[
    [TileId.TREE, TileId.ROCK],
    [TileId.STUMP, TileId.GRASS]
  ]];
  const counts = runtime.collectChunkResourceVisualCounts({
    TileId,
    logicalMap,
    startX: 0,
    startY: 0,
    endX: 2,
    endY: 2,
    z: 0,
    currentTick: 10,
    getVisualTileId: (tile) => tile,
    isTreeTileId: (tile) => tile === TileId.TREE || tile === TileId.STUMP,
    getRockNodeAt: () => ({ oreType: "iron", depletedUntilTick: 0 }),
    getRockVisualIdForNode: (node, depleted) => depleted ? "depleted" : node.oreType
  });
  assert(counts.treeCount === 2, "resource count collection should count trees and stumps");
  assert(counts.rockVisualCounts.iron === 1, "resource count collection should bucket rocks by visual profile");

  console.log("Chunk resource runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
