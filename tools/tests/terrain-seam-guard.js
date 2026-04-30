const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const sharedAssetsRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "shared-assets-runtime.js"), "utf8");
  const chunkTerrainRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-terrain-runtime.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

  assert(
    sharedAssetsRuntimeSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial"),
    "shared asset runtime should define a dedicated terrain underlay material"
  );
  assert(
    sharedAssetsRuntimeSource.includes("side: THREE.DoubleSide"),
    "terrain underlay material should render both sides to remove underside void seams"
  );
  assert(
    !worldSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial"),
    "world.js should not own terrain underlay material construction"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const isRenderableUnderlayTile = (tileType) => !isWaterTileId(tileType);"),
    "terrain underlay should include all non-water land tiles"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const sampleUnderlayVertexHeight = (cornerX, cornerY) => {"),
    "chunk terrain runtime should sample per-vertex heights for the terrain underlay"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const underlayGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);"),
    "chunk terrain runtime should build underlay geometry at tile resolution"
  );
  assert(
    chunkTerrainRuntimeSource.includes("underlayGeo.setIndex(underlayIndices);"),
    "chunk terrain runtime should filter underlay geometry to land tile indices"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (underlayIndices.length > 0) {"),
    "chunk terrain runtime should only instantiate underlay meshes when the chunk has land coverage"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const isManmadeLandTile = (tileType) => !isNaturalTile(tileType) && !isWaterTileId(tileType);"),
    "chunk terrain runtime should classify manmade land separately for edge blending"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (count > 0 && manmadeCount > 0) {"),
    "terrain edge blending should occur at natural-to-manmade boundaries"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const TERRAIN_EDGE_BLEND_CAP = 0.28;"),
    "terrain edge blending should cap boundary influence to preserve authored shapes"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const TERRAIN_EDGE_BLEND_FACTOR = 0.4;"),
    "terrain edge blending should remain partial and visual-only"
  );
  const pierCoverageSkips = chunkTerrainRuntimeSource.match(/if \(isPierVisualCoverageTile\(activePierConfig, worldTileX, worldTileY, 0\)\) continue;/g) || [];
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
