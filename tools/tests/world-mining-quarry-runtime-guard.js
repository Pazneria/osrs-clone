const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makePlane(size, fill) {
  return Array(size).fill(0).map(() => Array(size).fill(fill));
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "mining-quarry-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const miningQuarryRuntimeIndex = manifestSource.indexOf('id: "world-mining-quarry-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(miningQuarryRuntimeIndex !== -1, "legacy manifest should include the mining quarry runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(miningQuarryRuntimeIndex < worldIndex, "legacy manifest should load mining quarry runtime before world.js");
  assert(runtimeSource.includes("window.WorldMiningQuarryRuntime"), "mining quarry runtime should expose a window runtime");
  assert(runtimeSource.includes("const MINING_QUARRY_LAYOUT_OVERRIDES = Object.freeze({"), "mining quarry runtime should own quarry layout overrides");
  assert(runtimeSource.includes("const getMiningQuarryLayout = (routeId, clusterPoints) => {"), "mining quarry runtime should own quarry layout planning");
  assert(runtimeSource.includes("const thinMiningRockPlacements = (placements) => {"), "mining quarry runtime should own rock thinning");
  assert(runtimeSource.includes("const redistributeMiningRockPlacements = (placements, sourcePlacements) => {"), "mining quarry runtime should own rock redistribution planning");
  assert(worldSource.includes("WorldMiningQuarryRuntime"), "world.js should resolve the mining quarry runtime");
  assert(worldSource.includes("worldMiningQuarryRuntime.getMiningQuarryLayout"), "world.js should delegate quarry layout lookup");
  assert(worldSource.includes("worldMiningQuarryRuntime.thinMiningRockPlacements"), "world.js should delegate mining rock thinning");
  assert(worldSource.includes("worldMiningQuarryRuntime.redistributeMiningRockPlacements"), "world.js should delegate mining rock redistribution");
  assert(worldSource.includes("const DRY_QUARRY_FLOOR_MIN_HEIGHT = -0.052;"), "world.js should keep dry quarry floors above the tutorial ocean/void plane");
  assert(worldSource.includes("Math.max(DRY_QUARRY_FLOOR_MIN_HEIGHT, currentHeight)"), "quarry floor height clamp should enforce the dry floor minimum");
  assert(!worldSource.includes("Math.min(-0.11, Math.max(-0.56, currentHeight))"), "quarry terrain should not be forced below the surrounding water surface");
  assert(!worldSource.includes("const MINING_QUARRY_LAYOUT_OVERRIDES = Object.freeze({"), "world.js should not own quarry layout overrides inline");
  assert(!worldSource.includes("const placementCoordKey = (placement) => {"), "world.js should not own mining placement coord keys inline");
  assert(!worldSource.includes("const thinMiningRockPlacements = (placements) => {"), "world.js should not own mining rock thinning inline");
  assert(!worldSource.includes("const redistributeMiningRockPlacements = (placements, sourcePlacements) => {"), "world.js should not own mining rock redistribution inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "mining-quarry-runtime.js") });
  const runtime = window.WorldMiningQuarryRuntime;
  assert(runtime, "mining quarry runtime should be available after evaluation");

  const layoutOverrides = runtime.getMiningQuarryLayoutOverrides();
  assert(layoutOverrides.starter_mine.anchorX === 114 && layoutOverrides.starter_mine.anchorY === 204, "starter mine layout override should be exposed");
  assert(layoutOverrides.starter_mine.dirtRadiusScale === 0.98, "quarry dirt footprints should be pulled inward after terrain blending");
  assert(layoutOverrides.tutorial_surface_mine.centerX === 445 && layoutOverrides.tutorial_surface_mine.centerY === 372, "tutorial surface mine override should center the live quarry yard around the QA mining target");
  assert(layoutOverrides.tutorial_surface_mine.anchorX === 445 && layoutOverrides.tutorial_surface_mine.anchorY === 372, "tutorial surface mine override should keep the live route anchor in the shaped quarry apron");
  const starterLayout = runtime.getMiningQuarryLayout("starter_mine", [{ x: 1, y: 2, z: 0 }]);
  assert(starterLayout.centerX === 114 && starterLayout.centerY === 204, "layout lookup should apply route overrides");
  const tutorialLayout = runtime.getMiningQuarryLayout("tutorial_surface_mine", [{ x: 467, y: 373, z: 0 }, { x: 491, y: 397, z: 0 }]);
  assert(tutorialLayout.centerX === 445 && tutorialLayout.centerY === 372, "layout lookup should apply the tutorial surface mine override");
  assert(tutorialLayout.dirtRadius > tutorialLayout.radius, "tutorial surface mine should render a soft dirt apron around the shaped pit");

  const sourcePlacements = [];
  for (let i = 0; i < 8; i++) {
    sourcePlacements.push({
      placementId: `test_mine:${i + 1}`,
      routeId: "test_mine",
      oreType: "iron",
      x: 10 + (i % 4),
      y: 10 + Math.floor(i / 4),
      z: 0
    });
  }
  sourcePlacements.push({
    placementId: "test_mine:upper",
    routeId: "test_mine",
    oreType: "iron",
    x: 12,
    y: 12,
    z: 1
  });

  const placementPlan = runtime.thinMiningRockPlacements(sourcePlacements, {
    hash2D: (x, y, seed = 0) => {
      const s = Math.sin((x * 12.9898) + (y * 78.233) + seed) * 43758.5453;
      return s - Math.floor(s);
    }
  });
  assert(placementPlan.active.length + placementPlan.dropped.length === sourcePlacements.length, "thinning should account for every valid placement");
  assert(placementPlan.active.some((placement) => placement.placementId === "test_mine:upper"), "thinning should keep non-ground-floor placements");
  assert(placementPlan.dropped.length > 0, "thinning should drop some dense ground-floor placements");

  const mapSize = 32;
  const logicalMap = [makePlane(mapSize, 3)];
  const heightMap = [makePlane(mapSize, -0.22)];
  const activeGroundPlacements = placementPlan.active.filter((placement) => placement.z === 0);
  const redistributed = runtime.redistributeMiningRockPlacements(activeGroundPlacements, sourcePlacements, {
    clamp01: (value) => Math.max(0, Math.min(1, value)),
    hash2D: (x, y, seed = 0) => {
      const s = Math.sin((x * 127.1) + (y * 311.7) + (seed * 74.7)) * 43758.5453;
      return s - Math.floor(s);
    },
    heightMap,
    logicalMap,
    mapSize,
    sampleFractalNoise2D: (x, y, seed = 0) => {
      const s = Math.sin((x * 19.19) + (y * 31.31) + seed) * 9999.7;
      return s - Math.floor(s);
    },
    smoothstep: (edge0, edge1, value) => {
      const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(0.000001, edge1 - edge0)));
      return t * t * (3 - (2 * t));
    },
    tileIds: { DIRT: 3 }
  });
  assert(redistributed.length >= activeGroundPlacements.length, "redistribution should preserve kept rocks and may fill the quarry canvas");
  assert(redistributed.some((placement) => /:fill_\d+$/.test(placement.placementId)), "redistribution should add deterministic fill placements when there is room");
  assert(redistributed.every((placement) => placement.z === 0), "redistributed quarry rocks should be placed on ground level");
  assert(redistributed.every((placement) => placement.x >= 0 && placement.x < mapSize && placement.y >= 0 && placement.y < mapSize), "redistributed quarry rocks should stay inside the map");
  assert(redistributed[0] !== activeGroundPlacements[0], "redistribution should return cloned placement records");

  console.log("World mining quarry runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
