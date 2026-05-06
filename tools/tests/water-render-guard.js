const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const contractsSource = fs.readFileSync(path.join(root, "src", "game", "contracts", "world.ts"), "utf8");
  const bootstrapSource = fs.readFileSync(path.join(root, "src", "game", "world", "bootstrap.ts"), "utf8");
  const adapterSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-world-adapter.ts"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const renderRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "render-runtime.js"), "utf8");
  const pierRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "pier-runtime.js"), "utf8");
  const waterRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "water-runtime.js"), "utf8");
  const chunkTerrainRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-terrain-runtime.js"), "utf8");
  const chunkTierRenderRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-tier-render-runtime.js"), "utf8");
  const inputRenderSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const inputPierInteractionRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-pier-interaction-runtime.js"), "utf8");
  const inputPathfindingRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-pathfinding-runtime.js"), "utf8");
  const inputRaycastRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-raycast-runtime.js"), "utf8");
  const inputTickMovementRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-tick-movement-runtime.js"), "utf8");

  assert(contractsSource.includes("waterBodies?: WaterBodyDefinition[];"), "world contract should expose optional authored water bodies");
  assert(contractsSource.includes("export interface WaterRenderPayload"), "world contract should expose a typed water render payload");
  assert(bootstrapSource.includes("buildWaterRenderPayload"), "bootstrap should build the typed water render payload");
  assert(adapterSource.includes("waterRenderPayload"), "legacy world adapter should expose the typed water render payload");
  assert(manifestSource.includes('id: "world-water-runtime"'), "legacy manifest should load the world water runtime before world.js");
  assert(manifestSource.includes('id: "world-pier-runtime"'), "legacy manifest should load the world pier runtime before world.js");

  assert(worldSource.includes("WorldWaterRuntime"), "world.js should delegate chunk water rendering to the water runtime");
  assert(worldSource.includes("WorldPierRuntime"), "world.js should delegate pier classification to the pier runtime");
  assert(pierRuntimeSource.includes("function isPierSideWaterTile(pierConfig, x, y, z)"), "world pier runtime should preserve side-water lanes around raised piers");
  assert(pierRuntimeSource.includes("function isPierVisualCoverageTile(pierConfig, x, y, z)"), "world pier runtime should own full visual pier footprint classification");
  assert(waterRuntimeSource.includes("resolveWaterRenderBodyForTile"), "world water runtime should resolve render bodies from typed water payloads");
  assert(waterRuntimeSource.includes("resolveVisualWaterRenderBodyForTile"), "world water runtime should derive visual water coverage from water bodies plus pier coverage");
  assert(waterRuntimeSource.includes("findNearbyWaterRenderBodyForTile"), "world water runtime should borrow nearby water-body styling when rendering water beneath pier-covered tiles");
  assert(waterRuntimeSource.includes("getWaterSurfaceHeightForTile"), "world water runtime should expose actual water-surface heights so shoreline terrain can bend down to meet the water");
  assert(waterRuntimeSource.includes("appendChunkWaterTilesToBuilders"), "world water runtime should build chunk water from water-body coverage before object rendering");
  assert(waterRuntimeSource.includes("appendWaterTileToBuilder"), "world water runtime should batch chunk water surfaces instead of spawning tile meshes");
  assert(waterRuntimeSource.includes("const WATER_EDGE_SUBDIVISIONS = 4;"), "world water runtime should use bounded subdivision for natural shoreline water tiles");
  assert(waterRuntimeSource.includes("function getWaterEdgeOverlap(worldX, worldY, edgeSeed)"), "world water runtime should vary natural shoreline overlap deterministically");
  assert(waterRuntimeSource.includes("const subdivisions = (edges.north || edges.east || edges.south || edges.west) ? WATER_EDGE_SUBDIVISIONS : 1;"), "world water runtime should keep interior water cheap while smoothing edge tiles");
  assert(waterRuntimeSource.includes("function usesSmoothWaterShorelineRibbon(body, MAP_SIZE)"), "world water runtime should identify near-view bodies that use smooth shoreline ribbons");
  assert(waterRuntimeSource.includes("function buildSmoothWaterShorelineContourPoints(body)"), "world water runtime should build smooth authored-shape shoreline contours");
  assert(waterRuntimeSource.includes("function usesSmoothWaterSurfaceOverlay(body, MAP_SIZE)"), "near pond bodies should draw a smooth visual water surface overlay");
  assert(waterRuntimeSource.includes("const WATER_SHORELINE_FEATHER_WIDTH = 0.42;"), "pond shoreline should use a shallow-water feather instead of a white foam band");
  assert(waterRuntimeSource.includes("const WATER_SMOOTH_SURFACE_EDGE_OVERLAP = 2.35;"), "smooth pond surfaces should overhang the tile cutout enough to hide sawtooth voids");
  assert(waterRuntimeSource.includes("const WATER_SMOOTH_SURFACE_Y_OFFSET = -0.052;"), "smooth pond surfaces should sit slightly lower than logical water for natural bank overlap");
  assert(waterRuntimeSource.includes("function getSmoothWaterVisualSurfaceY(body, zOffset)"), "smooth pond surface and shoreline ribbon should share the lowered visual water height");
  assert(waterRuntimeSource.includes("function appendSmoothWaterSurfaceOverlayToBuilder(builder, context, chunkBounds)"), "world water runtime should build smooth filled pond surfaces from the contour");
  assert(waterRuntimeSource.includes("function getWaterInteractionOnlyMaterial(THREE, sharedMaterials)"), "tile water should remain raycastable without drawing jagged visible color under smooth ponds");
  assert(waterRuntimeSource.includes("WATER_VISUAL_SURFACE"), "smooth pond fill should be a visual-only water surface mesh");
  assert(waterRuntimeSource.includes("function appendWaterBodyShorelineRibbonToBuilder(builder, context, chunkBounds)"), "world water runtime should append non-interactive contour shoreline ribbons");
  assert(waterRuntimeSource.includes("if (builder.usesSmoothShorelineRibbon) return;"), "smooth contour bodies should skip the old per-tile shoreline fringe");
  assert(waterRuntimeSource.includes("function usesIslandCoastlineRibbon(body, context = {})"), "full-map ocean bodies should opt into the island coastline contour path when island water authoring is present");
  assert(waterRuntimeSource.includes("function appendIslandCoastlineVisualsForChunk(options = {}, builders = {})"), "world water runtime should add a smooth visual island coastline for surrounding sea bodies");
  assert(waterRuntimeSource.includes("function getIslandCoastlineWaterShoreStrength(context, worldX, worldY)"), "surrounding sea tile water should use the authored island polygon for smooth shore coloring");
  assert(waterRuntimeSource.includes("function getIslandCoastlineSurfaceOuterWidth(context)"), "island coastline visual water should use a continuous wide contour surface instead of near-shore tile water");
  assert(waterRuntimeSource.includes("function getIslandCoastlineTileVisualSuppressionWidth(context)"), "island coastline tile water should be hidden farther out than the contour edge");
  assert(waterRuntimeSource.includes("function isIslandCoastlineWaterTile(context, x, y)"), "surrounding sea tiles near the island contour should be detected separately from open ocean tiles");
  assert(waterRuntimeSource.includes("return distance <= getIslandCoastlineTileVisualSuppressionWidth(context);"), "near-coast ocean tile visibility should be suppressed from the authored island polygon distance");
  assert(waterRuntimeSource.includes("function createIslandCoastlineInteractionBody(body)"), "near-coast ocean tiles should keep interaction geometry without keeping jagged visible tile edges");
  assert(waterRuntimeSource.includes("forceInteractionOnly"), "near-coast ocean tile geometry should be able to remain raycastable while the contour owns the visible shoreline");
  assert(waterRuntimeSource.includes("if (builder.usesIslandCoastlineRibbon) return;"), "surrounding sea bodies should skip old per-tile shoreline fringe along the island coast");
  assert(waterRuntimeSource.includes("ISLAND_COASTLINE_SURFACE_INNER_OVERLAP"), "island coastline water surface should slightly underlap the bank to hide low-angle void slivers");
  assert(!waterRuntimeSource.includes("smoothSurfaceMaterial.depthTest = false"), "island coastline visual water should not draw through the terrain bank");
  assert(!waterRuntimeSource.includes("smoothSurfaceMaterial.depthWrite = false"), "island coastline visual water should keep normal opaque water depth behavior");
  assert(worldSource.includes("sharedMaterials.activeIslandWater"), "world.js should retain active island-water authoring for render runtimes");
  assert(worldSource.includes("islandWater: sharedMaterials.activeIslandWater || null"), "world.js should pass island-water authoring into terrain and water rendering contexts");
  assert(waterRuntimeSource.includes("appendSmoothWaterShorelineRibbonsForChunk"), "chunk water rendering should add smooth shoreline ribbons after tile water coverage");
  assert(renderRuntimeSource.includes("function createWaterShorelineRibbonMaterial"), "world render runtime should own the animated smooth shoreline ribbon material");
  assert(renderRuntimeSource.includes("function getWaterShorelineRibbonMaterial"), "world render runtime should cache smooth shoreline ribbon materials");
  assert(worldSource.includes("getWaterFringeMaterial"), "world.js should keep passing the compatible shoreline material factory into water rendering");
  assert(waterRuntimeSource.includes("function createWaterBackdropMesh(options = {})"), "world water runtime should expose a cheap ocean underlay for wide camera angles");
  assert(worldSource.includes("function refreshWorldOceanBackdrop()"), "world.js should refresh the ocean underlay when active water bodies change");
  assert(worldSource.includes("- 0.12") && !worldSource.includes("- 2.0"), "world ocean underlay should sit just below water so unloaded ocean does not read gray");
  assert(worldSource.includes("const backdropBands = ["), "world ocean backdrop should be split into bands");
  assert(worldSource.includes("{ xMin: -padding, xMax: MAP_SIZE + padding, yMin: -padding, yMax: 0 }"), "world ocean backdrop should fill north of the playable map");
  assert(worldSource.includes("{ xMin: MAP_SIZE, xMax: MAP_SIZE + padding, yMin: 0, yMax: MAP_SIZE }"), "world ocean backdrop should fill east of the playable map without sitting under interior land");
  assert(!worldSource.includes("xMin: -padding,\n                    xMax: MAP_SIZE + padding,\n                    yMin: -padding,\n                    yMax: MAP_SIZE + padding"), "world ocean backdrop should not be one full-map plane under walkable land");
  assert(renderRuntimeSource.includes("transparent: false") && renderRuntimeSource.includes("depthWrite: true"), "water surface shader should render opaquely so low camera angles do not blend through to sky");
  assert(renderRuntimeSource.includes("float broadWave = sin"), "water surface shader should use layered blue-on-blue procedural texture");
  assert(renderRuntimeSource.includes("vec3 outerWaterColor = mix(uShallowColor, uRippleColor, 0.14);"), "shoreline ribbon should feather with the outer shallow-water color");
  assert(renderRuntimeSource.includes("float edgeFeather = featherCenter"), "shoreline ribbon should use a broken shallow-water edge feather instead of foam");
  assert(!renderRuntimeSource.includes("color = mix(color, uFoamColor"), "shoreline ribbon should not create a white foam ring around ponds");
  assert(!renderRuntimeSource.includes("float wetShoreTint = smoothstep(0.18, 0.74, vShore);"), "main water surface should not tan-tint from tile shoreline distance");
  assert(!renderRuntimeSource.includes("color = mix(color, uFoamColor, edgeFoam);"), "main water surface should not paint foam from tile shoreline distance");
  assert(chunkTierRenderRuntimeSource.includes("function createSimplifiedWaterMeshes(options = {})"), "chunk tier renderer should build water meshes for mid/far chunks");
  assert(chunkTierRenderRuntimeSource.includes("terrainGeo.setIndex(filteredTerrainIndices);"), "chunk tier renderer should filter simplified grass terrain away from water");
  assert(chunkTierRenderRuntimeSource.includes("let run = null;"), "chunk tier renderer should merge simplified water by exact tile runs instead of coarse shoreline slabs");
  assert(chunkTierRenderRuntimeSource.includes("const isMixedChunk = hasLandCoverage && hasWaterCoverage;"), "chunk tier renderer should keep open ocean chunks cheap while preserving exact shore runs");
  assert(chunkTierRenderRuntimeSource.includes("? CHUNK_SIZE"), "chunk tier renderer should use tile-accurate terrain cells for mixed land/water chunks");
  assert(worldSource.includes("waterRenderBodies: Array.isArray(sharedMaterials.activeWaterRenderBodies)"), "world.js should pass water bodies into simplified chunk rendering");
  assert(worldSource.includes("resolveVisualWaterRenderBodyForTile,"), "world.js should pass water-body resolution into simplified chunk rendering");
  assert(waterRuntimeSource.includes("classifyWaterEdgeType"), "world water runtime should explicitly classify water edges before generating shoreline banks");
  assert(waterRuntimeSource.includes("kind: 'natural_bank'"), "world water runtime should keep natural banks distinct from structural shoreline exclusions");
  assert(waterRuntimeSource.includes("kind: 'structural_cover'"), "world water runtime should exclude pier-covered edges from shoreline bank generation");
  assert(waterRuntimeSource.includes("kind: 'outside'"), "world water runtime should handle map-edge shoreline fallback explicitly");
  assert(worldSource.includes("isPierSideWaterTile"), "world.js should pass side-water classification into terrain/water consumers");
  assert(waterRuntimeSource.includes("const isPierCoveredTile = context.isPierVisualCoverageTile"), "world water runtime should keep pier-covered water tiles out of shoreline underlap");
  assert(worldSource.includes("isPierVisualCoverageTile"), "world.js should pass visual pier coverage into terrain/water consumers");
  assert(chunkTerrainRuntimeSource.includes("const sampleTerrainVertexHeight ="), "chunk terrain runtime should shape terrain edges from nearby renderable land tiles instead of pulling them toward empty water or pier space");
  assert(chunkTerrainRuntimeSource.includes("if (count > 0 && waterCount > 0) {"), "chunk terrain runtime should bend shoreline terrain vertices toward nearby flat water");
  assert(waterRuntimeSource.includes("if (isPierVisualCoverageTile(pierConfig, tileX, tileY, z)) continue;"), "world water runtime should ignore pier coverage when computing shoreline intensity so dock water does not artifact");
  assert(chunkTerrainRuntimeSource.includes("terrainGeo.setIndex(terrainIndices);"), "chunk terrain runtime should filter terrain triangles so grass does not render across water and manmade surfaces");
  assert(worldSource.includes("createTopAnchoredFloorMesh"), "world.js should build visible floor slabs even when authored floor tiles sit at or below ground height");
  assert(!worldSource.includes("} else if (isWaterTileId(tile)) {"), "world.js should not key primary water rendering directly off the legacy object tile loop");
  assert(!worldSource.includes("sharedGeometries.waterPlane"), "world.js should not rebuild water from one plane per tile");
  assert(!worldSource.includes("sharedGeometries.shoreHalfNS"), "world.js should not use half-tile shoreline rims");
  assert(!worldSource.includes("sharedGeometries.shoreHalfEW"), "world.js should not use half-tile shoreline rims");
  assert(!worldSource.includes("water.rotation.y = (((x * 33391) + (y * 12763)) % 4) * (Math.PI / 2);"), "world.js should not rotate tiled water quads for variation");
  assert(!worldSource.includes("sharedMaterials.waterShallow.map"), "world.js should not drive water visuals through repeated shallow-water textures");
  assert(!worldSource.includes("sharedMaterials.waterDeep.map"), "world.js should not drive water visuals through repeated deep-water textures");

  assert(inputRenderSource.includes("sharedMaterials.waterAnimatedMaterials"), "render loop should animate shader-driven water materials");
  assert(inputRaycastRuntimeSource.includes("data.type === 'GROUND' || data.type === 'WALL' || data.type === 'TOWER' || data.type === 'WATER'"), "raycast hit normalization should resolve merged water mesh hits to grid tiles");
  assert(inputRaycastRuntimeSource.includes("!context.isWaterTileId(tile)") && inputRaycastRuntimeSource.includes("resolvedType = 'GROUND';"), "raycast hit normalization should treat pier-overlaid walkable tiles as ground so dock clicks can walk");
  assert(inputPierInteractionRuntimeSource.includes("function isPierProtectedWaterTile"), "input pier interaction runtime should keep pier-edge shallow water fishable without making it pathable");
  assert(inputPierInteractionRuntimeSource.includes("function isPierFishingApproachTile"), "input pier interaction runtime should treat raised pier deck tiles as valid fishing approach tiles");
  assert(inputPierInteractionRuntimeSource.includes("function hasPierFishingApproachForWaterTile"), "input pier interaction runtime should resolve pier fishing clicks to water that is directly fishable from the dock");
  assert(inputPierInteractionRuntimeSource.includes("function findNearestPierDeckBoardingTile"), "input pier interaction runtime should expose a dock-boarding resolver for ambiguous water click targets around the pier");
  assert(inputRaycastRuntimeSource.includes("snappedBoardTile = context.findNearestPierDeckBoardingTile"), "input raycast runtime should snap shoreline water hits to nearby pier deck tiles when boarding");
  assert(inputRaycastRuntimeSource.includes("const canDescendViaPierStep ="), "input raycast runtime should detect pier stair clicks while on deck");
  assert(inputRaycastRuntimeSource.includes("pierStepDescend = true;"), "input raycast runtime should mark pier-descend walk intents when stair hits are normalized");
  assert(inputTickMovementRuntimeSource.includes("pendingAction.obj === 'PIER_STEP_DESCEND'"), "input tick movement runtime should carry pier-descend walk intents into movement resolution");
  assert(inputPierInteractionRuntimeSource.includes("stair fallback step"), "input pier interaction runtime should provide a stair fallback move when pathfinding cannot bridge dock seam tiles");
  assert(inputPierInteractionRuntimeSource.includes("candidateY === stairDeckY"), "pier step fallback should not treat the first deck row as the shore row");
  assert(inputPathfindingRuntimeSource.includes("isPierDeckHeightTransition"), "normal walking should bridge the small height seam between pier deck and shore");
  assert(inputRaycastRuntimeSource.includes("source=${data.isPierStep ? 'step' : 'water'}"), "input raycast runtime should tag stair descend snaps for QA pier-debug traces");
  assert(inputPathfindingRuntimeSource.includes("restrictPierFishingToDeck"), "input pathfinding runtime should prevent fishing pathing from stepping off the pier into shallow water");

  console.log("Water render guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
