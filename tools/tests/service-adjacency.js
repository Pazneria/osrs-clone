const path = require("path");
const {
  buildWorldGameplayMap,
  collectAdjacencyViolations,
  loadWorldContent,
  loadWorldManifest
} = require("../content/world-utils");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const manifest = loadWorldManifest(root);
  const worldIds = manifest && Array.isArray(manifest.worlds)
    ? manifest.worlds.map((entry) => entry.worldId)
    : [];

  assert(worldIds.length > 0, "service adjacency requires at least one registered world");

  for (let i = 0; i < worldIds.length; i++) {
    const worldId = worldIds[i];
    const { world, stamps } = loadWorldContent(root, worldId);
    const logicalMap = buildWorldGameplayMap(world, stamps);
    const violations = collectAdjacencyViolations(world, logicalMap);
    assert(violations.length === 0, `${worldId}\n${violations.join("\n")}`);
  }

  console.log(`Service adjacency checks passed for ${worldIds.join(", ")}.`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
