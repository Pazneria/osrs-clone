const assert = require("assert");
const path = require("path");

const { loadWorldContent } = require("../content/world-content");
const { buildFrozenMainOverworld } = require("../content/freeze-main-overworld-world");

const WORLD_ID = "main_overworld";

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const { world } = loadWorldContent(root, WORLD_ID);
  const frozenWorld = buildFrozenMainOverworld(root);

  assert(
    stableJson(world.services) === stableJson(frozenWorld.services),
    "committed main-overworld services do not match freeze output"
  );
  assert(
    stableJson(world.skillRoutes.mining) === stableJson(frozenWorld.skillRoutes.mining),
    "committed mining routes do not match freeze output"
  );
  assert(
    stableJson(world.skillRoutes.runecrafting) === stableJson(frozenWorld.skillRoutes.runecrafting),
    "committed runecrafting routes do not match freeze output"
  );
  assert(
    stableJson(world.skillRoutes.woodcutting) === stableJson(frozenWorld.skillRoutes.woodcutting),
    "committed woodcutting routes do not match freeze output"
  );
  assert(
    stableJson(world.resourceNodes.mining) === stableJson(frozenWorld.resourceNodes.mining),
    "committed mining nodes do not match freeze output"
  );
  assert(
    stableJson(world.resourceNodes.woodcutting) === stableJson(frozenWorld.resourceNodes.woodcutting),
    "committed woodcutting nodes do not match freeze output"
  );
  assert(
    stableJson(world.landmarks.altars) === stableJson(frozenWorld.landmarks.altars),
    "committed altar placements do not match freeze output"
  );

  console.log(`Main-overworld freeze parity checks passed for ${WORLD_ID}.`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
