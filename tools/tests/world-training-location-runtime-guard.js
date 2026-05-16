const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const runtimeSource = readRepoFile(root, "src/js/world/training-location-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const trainingRuntimeIndex = manifestSource.indexOf('id: "world-training-location-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(trainingRuntimeIndex !== -1, "legacy manifest should include the world training location runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(trainingRuntimeIndex < worldIndex, "legacy manifest should load training location runtime before world.js");
  assert(runtimeSource.includes("window.WorldTrainingLocationRuntime"), "training location runtime should expose a window runtime");
  assert(runtimeSource.includes("function publishTrainingLocationHooks(options = {})"), "training location runtime should own compatibility hook publication");
  assert(runtimeSource.includes("function buildCookingTrainingLocations(options = {})"), "training location runtime should own cooking route snapshots");
  assert(runtimeSource.includes("function buildMiningTrainingLocations(options = {})"), "training location runtime should own mining route snapshots");
  assert(runtimeSource.includes("function getRunecraftingAltarNameAt(routes, x, y, z)"), "training location runtime should own runecrafting altar name lookup");
  assert(worldSource.includes("WorldTrainingLocationRuntime"), "world.js should delegate training location publication");
  assert(worldSource.includes("worldTrainingLocationRuntime.buildCookingTrainingLocations"), "world.js should delegate cooking snapshot building");
  assert(worldSource.includes("worldTrainingLocationRuntime.buildMiningTrainingLocations"), "world.js should delegate mining snapshot building");
  assert(worldSource.includes("worldTrainingLocationRuntime.publishTrainingLocationHooks"), "world.js should delegate training hook publication");
  assert(!worldSource.includes("window.getFishingTrainingLocations = function getFishingTrainingLocations"), "world.js should not publish fishing training hooks inline");
  assert(!worldSource.includes("window.getCookingTrainingLocations = function getCookingTrainingLocations"), "world.js should not publish cooking training hooks inline");
  assert(!worldSource.includes("window.getFiremakingTrainingLocations = function getFiremakingTrainingLocations"), "world.js should not publish firemaking training hooks inline");
  assert(!worldSource.includes("window.getMiningTrainingLocations = function getMiningTrainingLocations"), "world.js should not publish mining training hooks inline");
  assert(!worldSource.includes("window.getRunecraftingAltarLocations = function getRunecraftingAltarLocations"), "world.js should not publish runecrafting altar hooks inline");
  assert(!worldSource.includes("window.getRunecraftingAltarNameAt = function getRunecraftingAltarNameAt"), "world.js should not publish runecrafting altar name lookup inline");
  assert(!worldSource.includes("window.getWoodcuttingTrainingLocations = function getWoodcuttingTrainingLocations"), "world.js should not publish woodcutting training hooks inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "training-location-runtime.js") });
  const runtime = window.WorldTrainingLocationRuntime;
  assert(runtime, "training location runtime should be available after evaluation");

  const sourceRoutes = [{ routeId: "starter", label: "Starter", x: 1, y: 2, z: 0, tags: ["safe"] }];
  const clonedRoutes = runtime.cloneRouteLocations(sourceRoutes);
  clonedRoutes[0].x = 99;
  clonedRoutes[0].tags.push("mutated");
  assert(sourceRoutes[0].x === 1, "route cloning should protect source route coordinates");
  assert(sourceRoutes[0].tags.length === 1, "route cloning should protect source route tags");

  const cookingLocations = runtime.buildCookingTrainingLocations({
    routeSpecs: [
      { routeId: "starter_campfire", alias: "camp", label: "Campfire", tags: ["tutorial"] },
      { routeId: "empty", label: "Empty" }
    ],
    fireSpots: [
      { routeId: "starter_campfire", x: 10, y: 10, z: 0 },
      { routeId: "starter_campfire", x: 11, y: 10, z: 0 },
      { routeId: "starter_campfire", x: 12, y: 10, z: 0 }
    ]
  });
  assert(cookingLocations.length === 1, "cooking snapshots should ignore routes with no placed fires");
  assert(cookingLocations[0].x === 11 && cookingLocations[0].count === 3, "cooking snapshots should use the middle placed fire as the route anchor");
  cookingLocations[0].tags.push("mutated");
  assert(cookingLocations[0].tags.length === 2, "cooking snapshots should expose cloned tag arrays");

  const miningLocations = runtime.buildMiningTrainingLocations({
    routeDefs: [
      { routeId: "starter_mine", label: "Starter mine", x: 1, y: 1, z: 0, count: 9, tags: ["ore"] },
      { routeId: "quiet_mine", label: "Quiet mine", x: 2, y: 2, z: 0, count: 4 }
    ],
    activePlacements: [
      { routeId: "starter_mine", x: 4, y: 5, z: 0 },
      { routeId: "starter_mine", x: 5, y: 5, z: 0 },
      { routeId: "starter_mine", x: 6, y: 5, z: 1 }
    ],
    layoutOverrides: {
      starter_mine: { anchorX: 44, anchorY: 55 }
    }
  });
  assert(miningLocations[0].x === 44 && miningLocations[0].y === 55, "mining snapshots should apply layout anchor overrides");
  assert(miningLocations[0].count === 2, "mining snapshots should count active z0 placements by route");
  assert(miningLocations[1].count === 4, "mining snapshots should preserve authored counts without active placements");
  miningLocations[0].tags.push("mutated");
  assert(miningLocations[0].tags.length === 2, "mining snapshots should expose cloned tag arrays");

  const targetWindow = {};
  runtime.publishTrainingLocationHooks({
    windowTarget: targetWindow,
    fishing: sourceRoutes,
    cooking: cookingLocations,
    firemaking: [{ routeId: "fire", label: "Fire", x: 3, y: 4, z: 0 }],
    mining: miningLocations,
    runecrafting: [{ routeId: "air", label: "Air altar", x: 7, y: 8, z: 0 }],
    woodcutting: [{ routeId: "trees", label: "Trees", x: 9, y: 10, z: 0 }]
  });
  assert(typeof targetWindow.getFishingTrainingLocations === "function", "fishing compatibility hook should be published");
  assert(typeof targetWindow.getRunecraftingAltarNameAt === "function", "runecrafting altar name hook should be published");
  const firstFishingRead = targetWindow.getFishingTrainingLocations();
  firstFishingRead[0].x = 500;
  assert(targetWindow.getFishingTrainingLocations()[0].x === 1, "published hooks should return cloned route snapshots");
  assert(targetWindow.getRunecraftingAltarNameAt(7, 8, 0) === "Air altar", "published altar name hook should resolve route labels");
  assert(targetWindow.getRunecraftingAltarNameAt(0, 0, 0) === null, "published altar name hook should reject missing altars");

  console.log("World training location runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
