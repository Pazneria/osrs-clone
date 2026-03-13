const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");
const { loadWorldContent } = require("../content/world-utils");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createLocalRequire(baseDir) {
  return function localRequire(specifier) {
    if (!specifier.startsWith(".")) return require(specifier);
    const direct = path.resolve(baseDir, specifier);
    const candidates = [direct, `${direct}.js`, `${direct}.json`];
    for (let i = 0; i < candidates.length; i++) {
      if (fs.existsSync(candidates[i])) return require(candidates[i]);
    }
    throw new Error(`Unable to resolve ${specifier} from ${baseDir}`);
  };
}

function loadTsModule(absPath) {
  const source = fs.readFileSync(absPath, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    },
    fileName: absPath
  });
  const module = { exports: {} };
  const dirname = path.dirname(absPath);
  const sandbox = {
    module,
    exports: module.exports,
    require: createLocalRequire(dirname),
    __dirname: dirname,
    __filename: absPath,
    console
  };
  vm.runInNewContext(result.outputText, sandbox, { filename: absPath });
  return module.exports;
}

function assertDeepWaterPreserved(world, bodies) {
  const pond = bodies.find((body) => body.id === "legacy-castle-front-pond");
  assert(!!pond, `${world.worldId}: missing compatibility castle-front-pond water body`);
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

  const starterTown = loadWorldContent(root, "starter_town").world;
  const northRoadCamp = loadWorldContent(root, "north_road_camp").world;

  const starterBodies = getWorldWaterBodies(starterTown);
  assert(starterBodies.length === 7, "starter_town should normalize 5 lakes, 1 pond, and 1 river water body");
  assert(starterBodies.some((body) => body.id === "legacy-east-river" && body.shape.kind === "polygon"), "starter_town should include the compatibility river water body");
  assertDeepWaterPreserved(starterTown, starterBodies);
  assertRenderPayloadDeterministic(buildWaterRenderPayload, starterTown);

  const northBodies = getWorldWaterBodies(northRoadCamp);
  assert(northBodies.length === 5, "north_road_camp should normalize 3 lakes, 1 pond, and 1 river water body");
  assertDeepWaterPreserved(northRoadCamp, northBodies);
  assertRenderPayloadDeterministic(buildWaterRenderPayload, northRoadCamp);

  console.log("World water payload proof passed for starter_town and north_road_camp.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
