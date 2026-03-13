const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-bridge.ts"), "utf8");

  assert(coreSource.includes("function getWorldGameContext()"), "core.js missing world game-context helper");
  assert(coreSource.includes("getWorldRouteGroup('fishing')"), "core.js fishing QA should use world route registry");
  assert(coreSource.includes("getWorldRouteGroup('cooking')"), "core.js cooking QA should use world route registry");
  assert(coreSource.includes("getWorldMerchantServices()"), "core.js merchant QA should use service registry");
  assert(!coreSource.includes("const routeToKey = {\n                castle_pond_bank"), "legacy fishing routeToKey map should be removed");
  assert(!coreSource.includes("const routeToKey = {\n                starter_campfire"), "legacy cooking routeToKey map should be removed");

  assert(bridgeSource.includes("getWoodcuttingTrainingLocations"), "legacy bridge missing woodcutting compatibility hook");
  assert(bridgeSource.includes("registerRuntimeWorldState"), "legacy bridge missing runtime world-state registration");

  console.log("QA registry parity guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
