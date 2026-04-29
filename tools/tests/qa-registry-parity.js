const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunctionSource(source, functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`missing ${functionName} definition`);
  const braceStart = source.indexOf("{", start);
  if (braceStart === -1) throw new Error(`missing ${functionName} body`);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${functionName} definition`);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-bridge.ts"), "utf8");

  assert(coreSource.includes("function getWorldGameContext()"), "core.js missing world game-context helper");
  assert(coreSource.includes("getWorldRouteGroup('fishing')"), "core.js fishing QA should use world route registry");
  assert(coreSource.includes("getWorldRouteGroup('cooking')"), "core.js cooking QA should use world route registry");
  assert(coreSource.includes("getWorldRouteGroup('firemaking')"), "core.js firemaking QA should use world route registry");
  assert(coreSource.includes("getWorldMerchantServices()"), "core.js merchant QA should use service registry");
  assert(!coreSource.includes("const routeToKey = {\n                castle_pond_bank"), "legacy fishing routeToKey map should be removed");
  assert(!coreSource.includes("const routeToKey = {\n                starter_campfire"), "legacy cooking routeToKey map should be removed");
  assert(!coreSource.includes("pine: 'pine'"), "deleted north-road pine firemaking QA alias should stay removed");
  assert(!coreSource.includes("/qa gotofire <starter|oak|willow|maple|yew|pine>"), "QA firemaking usage should not advertise deleted pine route");

  assert(bridgeSource.includes("getWoodcuttingTrainingLocations"), "legacy bridge missing woodcutting compatibility hook");
  assert(bridgeSource.includes("getFiremakingTrainingLocations"), "legacy bridge missing firemaking compatibility hook");
  assert(bridgeSource.includes("registerRuntimeWorldState"), "legacy bridge missing runtime world-state registration");

  const firemakingHarness = {
    typedRoutes: [],
    legacyRoutes: [],
    teleports: [],
    getWorldRouteGroup(groupId) {
      assert(groupId === "firemaking", "firemaking QA should only ask for firemaking routes");
      return firemakingHarness.typedRoutes;
    },
    getFiremakingTrainingLocations() {
      return firemakingHarness.legacyRoutes;
    },
    qaTeleportTo(x, y, z, label) {
      firemakingHarness.teleports.push({ x, y, z, label });
      return true;
    }
  };

  vm.runInNewContext(
    [
      extractFunctionSource(coreSource, "getQaFiremakingSpots"),
      extractFunctionSource(coreSource, "qaGotoFiremakingSpot"),
      "this.getQaFiremakingSpots = getQaFiremakingSpots;",
      "this.qaGotoFiremakingSpot = qaGotoFiremakingSpot;"
    ].join("\n\n"),
    firemakingHarness,
    { filename: "qa-firemaking-snippet.js" }
  );

  firemakingHarness.typedRoutes = [
    { routeId: "oak_fire_lane", alias: "oak", x: 205, y: 299, z: 0, label: "oak path fire lane" }
  ];
  firemakingHarness.legacyRoutes = [
    { routeId: "starter_fire_lane", alias: "starter", x: 1, y: 2, z: 0, label: "legacy starter lane" }
  ];
  const typedSpots = firemakingHarness.getQaFiremakingSpots();
  assert(typedSpots.oak && typedSpots.oak.x === 205 && typedSpots.oak.y === 299, "typed firemaking routes should drive QA spot discovery before legacy fallback");
  assert(!typedSpots.starter, "typed firemaking routes should not merge legacy fallback spots when typed data exists");

  firemakingHarness.typedRoutes = [];
  firemakingHarness.legacyRoutes = [
    { routeId: "yew_fire_lane", x: 51, y: 8, z: 0, label: "yew frontier fire lane" }
  ];
  const legacySpots = firemakingHarness.getQaFiremakingSpots();
  assert(legacySpots.yew_fire_lane && legacySpots.yew_fire_lane.label === "yew frontier fire lane", "legacy firemaking routes should backfill QA spots when typed world routes are absent");

  firemakingHarness.typedRoutes = [];
  firemakingHarness.legacyRoutes = [];
  const fallbackSpots = firemakingHarness.getQaFiremakingSpots();
  assert(fallbackSpots.starter && fallbackSpots.starter.x === 182 && fallbackSpots.yew && fallbackSpots.yew.y === 8, "firemaking QA should keep the authored hardcoded fallback spots");

  firemakingHarness.typedRoutes = [
    { routeId: "starter_fire_lane", alias: "starter", x: 182, y: 170, z: 0, label: "starter grove fire lane" },
    { routeId: "yew_fire_lane", alias: "yew", x: 51, y: 8, z: 0, label: "yew frontier fire lane" }
  ];
  firemakingHarness.legacyRoutes = [];
  firemakingHarness.teleports = [];
  assert(firemakingHarness.qaGotoFiremakingSpot("regular"), "regular should resolve to the starter firemaking QA alias");
  assert(firemakingHarness.teleports.length === 1 && firemakingHarness.teleports[0].label === "starter grove fire lane", "starter alias teleport should target the typed starter fire lane");
  assert(firemakingHarness.qaGotoFiremakingSpot("yew"), "yew should resolve to the typed frontier firemaking alias");
  assert(firemakingHarness.teleports.length === 2 && firemakingHarness.teleports[1].x === 51 && firemakingHarness.teleports[1].y === 8, "yew alias teleport should use the authored frontier fire lane anchor");
  assert(!firemakingHarness.qaGotoFiremakingSpot("pine"), "deleted north-road pine alias should not teleport from current firemaking routes");
  assert(firemakingHarness.teleports.length === 2, "failed pine lookup should not add a QA teleport");

  console.log("QA registry parity guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
