const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const runtimeSource = readRepoFile(root, "src/js/world/pier-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const pierRuntimeIndex = manifestSource.indexOf('id: "world-pier-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(pierRuntimeIndex !== -1, "legacy manifest should include the world pier runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(pierRuntimeIndex < worldIndex, "legacy manifest should load pier runtime before world.js");
  assert(runtimeSource.includes("window.WorldPierRuntime"), "pier runtime should expose a window runtime");
  assert(runtimeSource.includes("function isPierDeckTile(pierConfig, x, y, z)"), "pier runtime should own deck classification");
  assert(runtimeSource.includes("function isPierSideWaterTile(pierConfig, x, y, z)"), "pier runtime should own side-water classification");
  assert(runtimeSource.includes("function isPierVisualCoverageTile(pierConfig, x, y, z)"), "pier runtime should own visual coverage classification");
  assert(worldSource.includes("WorldPierRuntime"), "world.js should resolve the pier runtime");
  assert(worldSource.includes("worldPierRuntime.getActivePierConfig"), "world.js should delegate active pier config lookup");
  assert(worldSource.includes("worldPierRuntime.isPierDeckTile"), "world.js should delegate pier deck classification");
  assert(worldSource.includes("worldPierRuntime.isPierSideWaterTile"), "world.js should delegate pier side-water classification");
  assert(worldSource.includes("worldPierRuntime.isPierVisualCoverageTile"), "world.js should delegate pier visual coverage classification");
  assert(!worldSource.includes("&& x >= pierConfig.xMin"), "world.js should not own pier deck bounds inline");
  assert(!worldSource.includes("&& (x === (pierConfig.xMin - 1) || x === (pierConfig.xMax + 1))"), "world.js should not own pier side-water bounds inline");
  assert(!worldSource.includes("y >= (pierConfig.yEnd - 1)"), "world.js should not own pier tip coverage inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "pier-runtime.js") });
  const runtime = window.WorldPierRuntime;
  assert(runtime, "pier runtime should be available after evaluation");

  const pierConfig = { xMin: 10, xMax: 12, yStart: 20, yEnd: 25, entryY: 19 };
  const sharedMaterials = { activePierConfig: pierConfig };
  assert(runtime.getActivePierConfig(sharedMaterials) === pierConfig, "active pier config should be read from shared materials");
  assert(runtime.getActivePierConfig({}) === null, "missing active pier config should resolve to null");
  assert(runtime.isPierDeckTile(pierConfig, 11, 20, 0), "deck classifier should include the deck start row");
  assert(runtime.isPierDeckTile(pierConfig, 12, 25, 0), "deck classifier should include the deck end row");
  assert(!runtime.isPierDeckTile(pierConfig, 11, 20, 1), "deck classifier should reject upper planes");
  assert(!runtime.isPierDeckTile(pierConfig, 9, 20, 0), "deck classifier should reject tiles outside deck x bounds");
  assert(runtime.isPierSideWaterTile(pierConfig, 9, 21, 0), "side-water classifier should include left side water");
  assert(runtime.isPierSideWaterTile(pierConfig, 13, 25, 0), "side-water classifier should include right side water");
  assert(!runtime.isPierSideWaterTile(pierConfig, 9, 20, 0), "side-water classifier should not include the entry row");
  assert(runtime.isPierVisualCoverageTile(pierConfig, 10, 23, 0), "visual coverage should include deck tiles");
  assert(runtime.isPierVisualCoverageTile(pierConfig, 9, 23, 0), "visual coverage should include side-water lanes");
  assert(runtime.isPierVisualCoverageTile(pierConfig, 9, 24, 0), "visual coverage should include tip overhang");
  assert(!runtime.isPierVisualCoverageTile(pierConfig, 8, 23, 0), "visual coverage should reject unrelated water");

  console.log("World pier runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
