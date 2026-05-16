const assert = require("assert");
const path = require("path");
const vm = require("vm");
const THREE = require("three");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const sharedAssetsRuntimeSource = readRepoFile(root, "src/js/world/shared-assets-runtime.js");
  const chunkTerrainRuntimeSource = readRepoFile(root, "src/js/world/chunk-terrain-runtime.js");
  const chunkTierRenderRuntimeSource = readRepoFile(root, "src/js/world/chunk-tier-render-runtime.js");
  const fireLifecycleRuntimeSource = readRepoFile(root, "src/js/world/fire-lifecycle-runtime.js");
  const inputPathfindingRuntimeSource = readRepoFile(root, "src/js/input-pathfinding-runtime.js");

  assert(
    sharedAssetsRuntimeSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial"),
    "shared asset runtime should define a dedicated terrain underlay material"
  );
  assert(
    sharedAssetsRuntimeSource.includes("side: THREE.DoubleSide"),
    "terrain underlay material should render both sides to remove underside void seams"
  );
  assert(
    sharedAssetsRuntimeSource.includes("buildGrassTextureCanvas(256);"),
    "grass texture source should be large enough to avoid a short visible repeat phrase"
  );
  assert(
    sharedAssetsRuntimeSource.includes("grassTex.repeat.set(1.85, 1.85);"),
    "grass texture repeat should be broad enough to avoid obvious short-pattern tiling"
  );
  assert(
    sharedAssetsRuntimeSource.includes("sharedGeometries.grassTuft = createGrassTuftGeometry(THREE);")
      && sharedAssetsRuntimeSource.includes("sharedGeometries.bushClump = addWhiteVertexColorAttribute")
      && sharedAssetsRuntimeSource.includes("sharedMaterials.bushLeaves = new THREE.MeshLambertMaterial"),
    "shared assets should include reusable tinted 3D grass and bush details for landscape variety"
  );
  assert(
    sharedAssetsRuntimeSource.includes("geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));"),
    "landscape detail geometry should provide a white vertex-color base so instance tints render visibly"
  );
  assert(
    !worldSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial"),
    "world.js should not own terrain underlay material construction"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const isRenderableUnderlayTile = (tileType) => !isWaterTileId(tileType);"),
    "terrain underlay should classify non-water land tiles"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const shouldRenderUnderlayCell = (tile, worldTileX, worldTileY) => {"),
    "terrain underlay should be trimmed to seam-adjacent cells instead of full land chunks"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (isManmadeLandTile(tile)) return true;"),
    "terrain underlay should keep coverage below authored manmade floors and structures"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const sampleUnderlayVertexHeight = (cornerX, cornerY) => {"),
    "chunk terrain runtime should sample per-vertex heights for the terrain underlay"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const appendSparseTerrainCellQuad = (positions, uvs, meshOriginX, meshOriginY, tileX, tileY, sampleHeight, warpedUvs = false) => {"),
    "chunk terrain runtime should build sparse underlay quads instead of full hidden tile grids"
  );
  assert(
    chunkTerrainRuntimeSource.includes("appendSparseTerrainCellQuad(underlayPositions, underlayUvs, meshOriginX, meshOriginY, cell.tileX, cell.tileY, sampleUnderlayVertexHeight, false);"),
    "terrain underlay should only emit seam-adjacent cells"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function collapseTerrainGeometryDrawGroups(geometry, indexCount)")
      && chunkTerrainRuntimeSource.includes("collapseTerrainGeometryDrawGroups(terrainGeo, terrainIndices.length);"),
    "filtered near-terrain geometry should collapse inherited PlaneGeometry groups to one draw group per material"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const SMOOTH_WATER_DIRT_UNDERLAY_INSET = 2.65;"),
    "smooth pond cutouts should reserve a dirt underlay footprint instead of exposing grass under water"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function sampleIslandCoastTerrainBlend(islandWater, sampleFractalNoise2D, worldX, worldY)"),
    "tutorial island coastline terrain should blend from the authored land polygon instead of jagged ocean tile edges"
  );
  assert(
    chunkTerrainRuntimeSource.includes("let protectedIslandLandCount = 0;"),
    "tutorial island land/path samples beside the sea should stay at land height instead of dipping below the ocean surface"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (protectedIslandLandCount > 0) {"),
    "chunk terrain runtime should protect island coastline terrain vertices from water-height pull-down"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function getSmoothWaterDirtUnderlayBody") || chunkTerrainRuntimeSource.includes("const getSmoothWaterDirtUnderlayBody ="),
    "smooth pond dirt underlay should resolve authored pond contours"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (shouldUseSmoothWaterDirtUnderlayCell(worldTileX, worldTileY)) return false;"),
    "grass terrain underlay should not occupy the smooth pond dirt-underlay footprint"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (shouldRenderUnderlayCell(tile, worldTileX, worldTileY)) underlayCells.push({ tileX, tileY });"),
    "terrain underlay should pre-scan and skip interior cells that cannot reveal underside seams"
  );
  assert(
    chunkTerrainRuntimeSource.includes("appendSparseTerrainCellQuad(smoothWaterDirtUnderlayPositions, smoothWaterDirtUnderlayUvs, meshOriginX, meshOriginY, cell.tileX, cell.tileY, sampleSmoothWaterDirtUnderlayVertexHeight, true);"),
    "smooth pond dirt underlay should be built from sparse tile cells"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const smoothWaterDirtUnderlayMesh = new THREE.Mesh(smoothWaterDirtUnderlayGeo, sharedMaterials.dirtTile);"),
    "smooth pond fallback under water should use the dirt material instead of grass"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("environmentMeshes.push(smoothWaterDirtUnderlayMesh)"),
    "smooth pond dirt underlay should remain visual-only"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const TERRAIN_SKIRT_DROP = 0.24;") && chunkTerrainRuntimeSource.includes("const TERRAIN_WATER_SKIRT_DROP = 0.18;"),
    "terrain skirts should drop below exposed land and water edges to cover void seams"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const buildTerrainSkirtGeometry = (cells = null) => {"),
    "chunk terrain runtime should build visual skirts along exposed terrain boundaries"
  );
  assert(
    chunkTerrainRuntimeSource.includes("isTerrainSkirtWaterEdge(worldTileX"),
    "terrain skirts should detect water-facing edges separately from dry land edges"
  );
  assert(
    chunkTerrainRuntimeSource.includes("terrainSkirtMesh.userData = { type: 'GROUND_VISUAL_SKIRT', z: 0 };"),
    "terrain skirt meshes should be marked as visual-only ground seam covers"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("environmentMeshes.push(terrainSkirtMesh)"),
    "terrain skirt meshes should not become raycast or collision targets"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (underlayCells.length > 0) {"),
    "chunk terrain runtime should only build underlay geometry when the chunk has seam coverage"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function applyWorldSpaceTerrainUvs"),
    "near terrain should provide world-space UV assignment so grass does not restart per chunk"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function sampleTerrainUvWarp"),
    "terrain UVs should support deterministic world-space warp to break long-distance repeat lines"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function applyWorldSpaceLinearTerrainUvs")
      || chunkTerrainRuntimeSource.includes("uvs.push(worldX / CHUNK_SIZE, worldY / CHUNK_SIZE);"),
    "terrain underlay UVs should continue in world space across chunk boundaries without paying the warped visible-terrain cost"
  );
  assert(
    chunkTerrainRuntimeSource.includes("applyWorldSpaceTerrainUvs(terrainGeo, startX, startY, terrainSegments, CHUNK_SIZE, sampleFractalNoise2D);"),
    "near terrain UVs should continue in world space across chunk boundaries"
  );
  assert(
    chunkTierRenderRuntimeSource.includes("applyWorldSpaceTerrainUvs(terrainGeo, startX, startY, segments, CHUNK_SIZE, sampleFractalNoise2D);"),
    "simplified terrain UVs should continue in world space across chunk boundaries"
  );
  assert(
    chunkTierRenderRuntimeSource.includes("function createSimplifiedTerrainHeightSampler(options = {})")
      && chunkTierRenderRuntimeSource.includes("SIMPLIFIED_TERRAIN_FAR_HEIGHT_FLATTEN")
      && chunkTierRenderRuntimeSource.includes("sampleSimplifiedTerrainHeightAtWorld(worldX, worldY)"),
    "simplified mid/far terrain should use a shared world-space smoothing sampler so unloaded chunks stay flatter without opening void seams"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function getTerrainBlendMaterial(THREE, sharedMaterials)"),
    "chunk terrain runtime should build a material that blends terrain textures on one surface"
  );
  assert(
    chunkTerrainRuntimeSource.includes("uniform sampler2D terrainDirtMap;"),
    "terrain blend shader should sample a secondary dirt/shore texture"
  );
  assert(
    chunkTerrainRuntimeSource.includes("attribute float terrainBlend;"),
    "terrain blend shader should receive per-vertex blend weights"
  );
  assert(
    chunkTerrainRuntimeSource.includes("diffuseColor *= mix( grassDiffuseColor, dirtDiffuseColor, terrainBlendMask );"),
    "terrain blend shader should mix grass and dirt samples instead of switching materials"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const TERRAIN_BLEND_SUBDIVISIONS = 1;"),
    "near terrain should use the cheaper guarded subdivision density now that visual skirts and water backfills cover exposed seams"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const terrainSubdivisionMultiplier = TERRAIN_BLEND_SUBDIVISIONS;"),
    "near terrain should use one consistent subdivision density so elevation seams do not form T-junction lines"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("function createAdaptiveTerrainGeometry"),
    "near terrain should not mix dense and sparse cells inside one elevation mesh because that creates visible T-junction lines"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("TERRAIN_BASE_SUBDIVISIONS"),
    "near terrain should not mix base and blend subdivision tiers across adjacent elevated chunks"
  );
  assert(
    chunkTerrainRuntimeSource.includes("new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, terrainSegments, terrainSegments);"),
    "near terrain should keep one continuous heightfield instead of separate transition geometry"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function collectNearbyTransitionSources(options = {})"),
    "terrain blend masks should detect nearby dirt, rock, shore, and water sources"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function sampleTerrainBlendInfo(options = {})"),
    "terrain blend masks should be sampled per vertex"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const terrainVertexHeightCache = new Map();"),
    "dense terrain height sampling should cache repeated tile-corner heights per chunk"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const sourceCache = options.sourceCache || null;"),
    "terrain blend sampling should accept a per-chunk source cache"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const terrainBlendSourceCache = new Map();"),
    "terrain blend sampling should reuse nearby transition-source searches per tile"
  );
  assert(
    chunkTerrainRuntimeSource.includes("sourceCache: terrainBlendSourceCache"),
    "terrain blend vertex sampling should pass the shared per-chunk source cache"
  );
  assert(
    chunkTerrainRuntimeSource.includes("sourceCache.set(sourceKey, sources);"),
    "terrain blend source searches should be stored after the first lookup"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function isAlignedTransitionSource(source, worldTileX, worldTileY)"),
    "terrain blend masks should reject diagonal-only transition sources"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const nearest = findNearestTransitionSource(sources, worldX, worldY, worldTileX, worldTileY);"),
    "terrain blend masks should fade from the nearest transition source"
  );
  assert(
    chunkTerrainRuntimeSource.includes("terrainGeo.setAttribute('terrainBlend', new THREE.Float32BufferAttribute(terrainBlend, 1));"),
    "terrain blend weights should live on the same ground geometry"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function sampleTerrainSurfaceHeight(sampleTerrainVertexHeight, worldX, worldY)"),
    "terrain should use interpolated base height for dense visual vertices"
  );
  assert(
    chunkTerrainRuntimeSource.includes("sampleTerrainSurfaceHeight(sampleTerrainVertexHeight, cornerX, cornerY);"),
    "dense terrain vertices should sit on the continuous sampled terrain surface"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const terrainMaterial = getTerrainBlendMaterial(THREE, sharedMaterials) || sharedMaterials.grassTile;"),
    "near terrain should render with one blended material"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const baseWidth = sourceKind === 'shore' ? 1.38 : 1.22;"),
    "terrain blend masks should use pulled-in soft bands where water or dirt meets grass"
  );
  assert(
    chunkTerrainRuntimeSource.includes("float terrainBlendMask = smoothstep( 0.06, 0.88, clamp( vTerrainBlend, 0.0, 1.0 ) );"),
    "terrain blend shader should hide far halo weights while keeping the transition soft"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("function buildTerrainTransitionMesh(options = {})"),
    "terrain blending should not create a separate transition mesh"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("shouldUseTransitionReplacementTile"),
    "terrain blending should not remove base terrain tiles for replacement geometry"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("terrainGeo.addGroup("),
    "terrain blending should not split the continuous ground into grass and dirt material groups"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("environmentMeshes.push(transitionMesh)"),
    "terrain blending should avoid separate transition interaction meshes"
  );
  assert(
    chunkTerrainRuntimeSource.includes("terrainMesh.userData = { type: 'GROUND', z: 0, terrainSubdivisionMultiplier };"),
    "the blended terrain mesh should remain the gameplay ground"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const isManmadeLandTile = (tileType) => !isNaturalTile(tileType) && !isWaterTileId(tileType);"),
    "chunk terrain runtime should classify manmade land separately for edge blending"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function buildLandscapeDetailMeshes(options = {})"),
    "chunk terrain runtime should own visual-only grass, bush, and pebble landscape detail placement"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const LANDSCAPE_GRASS_PATCH_THRESHOLD = 0.48;"),
    "landscape grass tufts should be patch-gated instead of appearing on every grass tile"
  );
  assert(
    chunkTerrainRuntimeSource.includes("mesh.userData = { type: 'LANDSCAPE_DETAIL', detailKind, visualOnly: true, z: 0 };"),
    "landscape detail meshes should be explicitly tagged as visual-only"
  );
  assert(
    !chunkTerrainRuntimeSource.includes("environmentMeshes.push(grassMesh)")
      && !chunkTerrainRuntimeSource.includes("environmentMeshes.push(bushMesh)")
      && !chunkTerrainRuntimeSource.includes("environmentMeshes.push(pebbleMesh)"),
    "landscape detail meshes should not become gameplay interaction meshes"
  );
  assert(
    worldSource.includes("sharedGeometries,")
      && worldSource.includes("worldChunkTerrainRuntime.buildChunkGroundMeshes({"),
    "world.js should pass shared detail geometries into chunk terrain rendering"
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
  assert(
    chunkTerrainRuntimeSource.includes("function findSmoothTerrainWaterBodyAtPoint(waterRenderBodies, MAP_SIZE, worldX, worldY, inset = 0)"),
    "near terrain should resolve smooth authored pond bodies at arbitrary points"
  );
  assert(
    chunkTerrainRuntimeSource.includes("const shouldRenderTerrainCell = (tile, worldX, worldY) => {"),
    "near terrain should decide pond shoreline visibility per subcell instead of only by tile id"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (isInsideSmoothWaterTerrainMask(worldX, worldY)) return false;"),
    "smooth pond terrain should be clipped by the authored water contour"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (isWaterTileId(tile)) return false;"),
    "logical water tiles should not recover grass terrain slivers around smooth pond contours"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (isNearSmoothWaterTerrainMask(cornerX, cornerY))"),
    "smooth pond terrain heights should not be pulled down to the old tile water edge"
  );
  assert(
    chunkTerrainRuntimeSource.includes("function sampleSmoothWaterShoreTerrainBlend(waterRenderBodies, MAP_SIZE, worldX, worldY)"),
    "smooth pond shore vertices should force a shore/dirt blend near the authored contour"
  );
  assert(
    chunkTerrainRuntimeSource.includes("body.bounds.xMin - 2.65") && chunkTerrainRuntimeSource.includes("distance > 2.55"),
    "smooth pond shore dirt blend should cover the lowered water overhang so grass is not exposed underneath"
  );
  assert(
    chunkTerrainRuntimeSource.includes("distance <= 1.18 ? 1 : 1 - smoothstep(1.18, 2.5, distance)"),
    "smooth pond shore dirt blend should stay solid under the inner overhang before fading back to grass"
  );
  assert(
    chunkTerrainRuntimeSource.includes("if (smoothWaterBlend > 0.02) return { blend: smoothWaterBlend, kind: 'shore' };"),
    "smooth pond edge terrain should not show grass between water and the shore band"
  );
  assert(
    chunkTerrainRuntimeSource.includes("waterRenderBodies,"),
    "terrain blend vertex sampling should receive authored water bodies for smooth shoreline masks"
  );
  const pierCoverageSkips = chunkTerrainRuntimeSource.match(/if \(isPierVisualCoverageTile\(activePierConfig, worldTileX, worldTileY, 0\)\) (?:continue|return false);/g) || [];
  assert(
    pierCoverageSkips.length >= 2,
    "both terrain and underlay paths should skip pier visual-coverage tiles"
  );

  assert(
    fireLifecycleRuntimeSource.includes("Math.abs(nextH - currentH) > 0.3 && !tileIsRamp"),
    "fire lifecycle movement stepping height threshold must remain unchanged"
  );
  assert(
    inputPathfindingRuntimeSource.includes("Math.abs(currentHeight - nextHeight) > 0.3 && !isStairTransition"),
    "input pathfinding runtime height threshold must remain unchanged"
  );

  global.window = {};
  vm.runInThisContext(chunkTerrainRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-terrain-runtime.js") });
  const terrainRuntime = window.WorldChunkTerrainRuntime;
  assert(terrainRuntime, "chunk terrain runtime should execute in isolation");
  {
    const TileId = { GRASS: 0, DIRT: 3, SHORE: 20, WATER_SHALLOW: 21, WATER_DEEP: 22, SAND: 26 };
    const size = 16;
    const logicalMap = [Array.from({ length: size }, (_, y) => (
      Array.from({ length: size }, (_, x) => (y === 0 || x === 0 ? TileId.DIRT : TileId.GRASS))
    ))];
    const heightMap = [Array.from({ length: size }, () => Array.from({ length: size }, () => 0))];
    const planeGroup = new THREE.Group();
    const environmentMeshes = [];
    terrainRuntime.buildChunkGroundMeshes({
      THREE,
      CHUNK_SIZE: size,
      MAP_SIZE: size,
      TileId,
      startX: 0,
      startY: 0,
      logicalMap,
      heightMap,
      sharedGeometries: {
        grassTuft: new THREE.BoxGeometry(0.08, 0.32, 0.08).translate(0, 0.16, 0),
        bushClump: new THREE.DodecahedronGeometry(0.28, 0).translate(0, 0.24, 0),
        groundPebble: new THREE.DodecahedronGeometry(0.08, 0).translate(0, 0.04, 0)
      },
      sharedMaterials: {
        terrainUnderlay: new THREE.MeshBasicMaterial(),
        grassTile: new THREE.MeshBasicMaterial({ vertexColors: true }),
        dirtTile: new THREE.MeshBasicMaterial(),
        grassTuft: new THREE.MeshBasicMaterial({ vertexColors: true }),
        bushLeaves: new THREE.MeshBasicMaterial({ vertexColors: true }),
        groundPebble: new THREE.MeshBasicMaterial({ vertexColors: true })
      },
      planeGroup,
      environmentMeshes,
      waterRenderBodies: [],
      isNaturalTileId: (tile) => tile === TileId.GRASS || tile === TileId.DIRT || tile === TileId.SHORE || tile === TileId.SAND,
      isWaterTileId: (tile) => tile === TileId.WATER_SHALLOW || tile === TileId.WATER_DEEP,
      isPierVisualCoverageTile: () => false,
      getVisualTileId: (tile) => tile,
      getTerrainVisualTileId: (tile) => tile,
      getWaterSurfaceHeightForTile: () => null,
      sampleFractalNoise2D: () => 0.82
    });
    const detailMeshes = planeGroup.children.filter((child) => child.userData && child.userData.type === "LANDSCAPE_DETAIL");
    const grassMesh = detailMeshes.find((child) => child.userData.detailKind === "grass_tuft");
    const bushMesh = detailMeshes.find((child) => child.userData.detailKind === "bush");
    assert(grassMesh && grassMesh.count > 0, "landscape pass should render 3D grass tuft instances on grass chunks");
    assert(grassMesh.count < size * size, "grass tufts should be sparse patches instead of one per terrain tile");
    assert(bushMesh && bushMesh.count > 0, "landscape pass should render occasional bush instances");
    assert(detailMeshes.every((mesh) => mesh.userData.visualOnly === true), "all landscape detail meshes should be marked visual-only");
    assert(!environmentMeshes.some((mesh) => mesh.userData && mesh.userData.type === "LANDSCAPE_DETAIL"), "landscape detail meshes should stay out of raycast environment meshes");
  }

  console.log("Terrain seam guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
