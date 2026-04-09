const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-bridge.ts"), "utf8");
  const adapterSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-world-adapter.ts"), "utf8");
  const contractsSource = fs.readFileSync(path.join(root, "src", "game", "contracts", "world.ts"), "utf8");
  const worldDefinitionStart = contractsSource.indexOf("export interface WorldDefinition");
  const worldDefinitionEnd = contractsSource.indexOf("export interface RouteRegistry");
  const worldDefinitionSection = worldDefinitionStart >= 0 && worldDefinitionEnd > worldDefinitionStart
    ? contractsSource.slice(worldDefinitionStart, worldDefinitionEnd)
    : contractsSource;

  assert(
    !worldSource.includes("materializeSkillWorldRuntime"),
    "world.js should not invoke the procedural skill-world runtime after freeze"
  );
  assert(
    !worldSource.includes("randomizeArrayInPlace"),
    "world.js should not shuffle gameplay feature candidates after freeze"
  );
  assert(
    !worldSource.includes("Math.random() < treeChance"),
    "world.js should not use gameplay-topology random tree placement after freeze"
  );
  assert(
    !worldSource.includes("Math.random() < rockChance"),
    "world.js should not use gameplay-topology random rock placement after freeze"
  );
  assert(
    bridgeSource.includes("getWorldManifest"),
    "legacy bridge should expose the world manifest lookup"
  );
  assert(
    bridgeSource.includes("listWorldIds"),
    "legacy bridge should expose the world-id registry lookup"
  );
  assert(
    bridgeSource.includes("getWorldLegacyConfig"),
    "legacy bridge should expose authored world config by world id"
  );
  assert(
    !bridgeSource.includes("getStarterTownLegacyConfig"),
    "legacy bridge should not expose starter-town-only world config helpers"
  );
  assert(
    adapterSource.includes("getCurrentWorldPayload"),
    "legacy world adapter should expose the legacy-ready world payload"
  );
  assert(
    adapterSource.includes("firemakingTrainingRouteDefs"),
    "legacy world adapter payload should carry authored firemaking routes"
  );
  assert(
    worldSource.includes("getCurrentWorldPayload"),
    "world.js should consume authored world config through the typed world adapter"
  );
  assert(
    worldSource.includes("firemakingTrainingRouteDefs"),
    "world.js should consume authored firemaking routes through the typed world adapter"
  );
  assert(
    !worldSource.includes("loadStarterTownWorld"),
    "world.js should not reference starter-town-only loader names"
  );
  assert(
    !bridgeSource.includes("materializeSkillWorldRuntime"),
    "legacy bridge should not expose the procedural skill-world runtime entrypoint"
  );
  assert(
    !worldSource.includes("getWorldLegacyConfig"),
    "world.js should not reach into the bootstrap bridge for legacy payload shaping"
  );
  assert(
    bridgeSource.includes("getFiremakingTrainingLocations"),
    "legacy bridge should expose the firemaking compatibility getter"
  );
  assert(
    !worldDefinitionSection.includes("miningZones:"),
    "WorldDefinition should not include legacy mining zone contracts"
  );
  assert(
    !worldDefinitionSection.includes("runecraftingBands:"),
    "WorldDefinition should not include legacy runecrafting band contracts"
  );
  assert(
    !worldDefinitionSection.includes("woodcuttingZones:"),
    "WorldDefinition should not include legacy woodcutting zone contracts"
  );

  console.log("Legacy world runtime shape guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
