const assert = require("assert");
const path = require("path");
const { loadWorldContent } = require("../content/world-content");
const { loadTsModule } = require("../lib/ts-module-loader");

function assertDeepWaterPreserved(world, bodies) {
  const pond = bodies.find((body) => body.id === "castle_front_pond");
  assert(!!pond, `${world.worldId}: missing authored castle-front pond water body`);
  assert(pond.depthProfile && pond.depthProfile.mode === "tile_truth", `${world.worldId}: pond depth profile should default to tile_truth`);
  assert(Array.isArray(pond.depthProfile.deepZones) && pond.depthProfile.deepZones.length === 1, `${world.worldId}: pond should preserve one deep-water zone`);
  const deepShape = pond.depthProfile.deepZones[0].shape;
  const deepWaterCenter = world.terrainPatches.deepWaterCenter;
  assert(deepShape.kind === "box", `${world.worldId}: deep-water center should normalize to a box`);
  assert(
    deepShape.xMin === deepWaterCenter.xMin
      && deepShape.xMax === deepWaterCenter.xMax
      && deepShape.yMin === deepWaterCenter.yMin
      && deepShape.yMax === deepWaterCenter.yMax,
    `${world.worldId}: deep-water center bounds changed during water normalization`
  );
}

function assertRenderPayloadDeterministic(buildWaterRenderPayload, world) {
  const first = buildWaterRenderPayload(world);
  const second = buildWaterRenderPayload(world);
  assert(JSON.stringify(first) === JSON.stringify(second), `${world.worldId}: water render payload should be deterministic`);
  assert(Array.isArray(first.bodies) && first.bodies.length > 0, `${world.worldId}: water render payload should include bodies`);
  first.bodies.forEach((body) => {
    assert(body.bounds && Number.isFinite(body.bounds.xMin) && Number.isFinite(body.bounds.yMin), `${world.worldId}: water render body ${body.id} missing bounds`);
    assert(body.style === "calm_lake", `${world.worldId}: water render body ${body.id} should normalize to calm_lake`);
    assert(body.styleTokens && Number.isFinite(body.styleTokens.shallowColor), `${world.worldId}: water render body ${body.id} missing style tokens`);
    assert(body.shoreline && body.shoreline.width > 0, `${world.worldId}: water render body ${body.id} missing shoreline defaults`);
  });
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const waterModule = loadTsModule(path.join(root, "src", "game", "world", "water.ts"));
  const { getWorldWaterBodies, buildWaterRenderPayload } = waterModule;

  const starterTown = loadWorldContent(root, "main_overworld").world;

  const starterBodies = getWorldWaterBodies(starterTown);
  assert(starterBodies.length === 8, "main_overworld should normalize 5 lakes, 1 pond, and 2 small pools");
  assert(!starterBodies.some((body) => body.id === "legacy-east-river"), "main_overworld should not include the old north-south compatibility river");
  assert(starterBodies.some((body) => body.id === "east_marsh_pool" && body.shape.kind === "ellipse"), "main_overworld should keep the east marsh pool");
  assert(starterBodies.some((body) => body.id === "south_brook_pool" && body.shape.kind === "ellipse"), "main_overworld should keep the south brook pool");
  assertDeepWaterPreserved(starterTown, starterBodies);
  assertRenderPayloadDeterministic(buildWaterRenderPayload, starterTown);

  const tutorialIsland = loadWorldContent(root, "tutorial_island").world;
  const tutorialBodies = getWorldWaterBodies(tutorialIsland);
  assert(tutorialBodies.length === 2, "tutorial_island should use only its authored surrounding sea and survival pond water bodies");
  assert(!tutorialBodies.some((body) => body.id === "legacy-east-river"), "tutorial_island should not inherit the legacy mainland river");
  assert(tutorialBodies.some((body) => body.id === "tutorial_surrounding_sea"), "tutorial_island should keep its authored surrounding sea");
  assertRenderPayloadDeterministic(buildWaterRenderPayload, tutorialIsland);

  console.log("World water payload proof passed for main_overworld and tutorial_island.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
