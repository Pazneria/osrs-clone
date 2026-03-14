const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

  assert(
    worldSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial"),
    "world.js should define a dedicated terrain underlay material"
  );
  assert(
    worldSource.includes("side: THREE.DoubleSide"),
    "terrain underlay material should render both sides to remove underside void seams"
  );
  assert(
    worldSource.includes("const isRenderableUnderlayTile = (tileType) => !isWaterTileId(tileType);"),
    "terrain underlay should include all non-water land tiles"
  );
  assert(
    worldSource.includes("const sampleUnderlayVertexHeight = (cornerX, cornerY) => {"),
    "world.js should sample per-vertex heights for the terrain underlay"
  );
  assert(
    worldSource.includes("const underlayGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);"),
    "world.js should build underlay geometry at tile resolution"
  );
  assert(
    worldSource.includes("underlayGeo.setIndex(underlayIndices);"),
    "world.js should filter underlay geometry to land tile indices"
  );
  assert(
    worldSource.includes("if (underlayIndices.length > 0) {"),
    "world.js should only instantiate underlay meshes when the chunk has land coverage"
  );
  assert(
    worldSource.includes("const isManmadeLandTile = (tileType) => !isNaturalTile(tileType) && !isWaterTileId(tileType);"),
    "world.js should classify manmade land separately for edge blending"
  );
  assert(
    worldSource.includes("if (count > 0 && manmadeCount > 0) {"),
    "terrain edge blending should occur at natural-to-manmade boundaries"
  );
  assert(
    worldSource.includes("const TERRAIN_EDGE_BLEND_CAP = 0.28;"),
    "terrain edge blending should cap boundary influence to preserve authored shapes"
  );
  assert(
    worldSource.includes("const TERRAIN_EDGE_BLEND_FACTOR = 0.4;"),
    "terrain edge blending should remain partial and visual-only"
  );
  const pierCoverageSkips = worldSource.match(/if \(isPierVisualCoverageTile\(activePierConfig, worldTileX, worldTileY, 0\)\) continue;/g) || [];
  assert(
    pierCoverageSkips.length >= 2,
    "both terrain and underlay paths should skip pier visual-coverage tiles"
  );

  assert(
    worldSource.includes("Math.abs(nextH - currentH) > 0.3 && !tileIsRamp"),
    "world.js movement stepping height threshold must remain unchanged"
  );
  assert(
    inputSource.includes("Math.abs(currentHeight - nextHeight) > 0.3 && !isStairTransition"),
    "input-render.js pathfinding height threshold must remain unchanged"
  );

  console.log("Terrain seam guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
