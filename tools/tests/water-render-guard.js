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
  const pierRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "pier-runtime.js"), "utf8");
  const waterRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "water-runtime.js"), "utf8");
  const chunkTerrainRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-terrain-runtime.js"), "utf8");
  const inputRenderSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

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
  assert(chunkTerrainRuntimeSource.includes("terrainGeo.setIndex(filteredTerrainIndices);"), "chunk terrain runtime should filter terrain triangles so grass does not render across water and manmade surfaces");
  assert(worldSource.includes("createTopAnchoredFloorMesh"), "world.js should build visible floor slabs even when authored floor tiles sit at or below ground height");
  assert(!worldSource.includes("} else if (isWaterTileId(tile)) {"), "world.js should not key primary water rendering directly off the legacy object tile loop");
  assert(!worldSource.includes("sharedGeometries.waterPlane"), "world.js should not rebuild water from one plane per tile");
  assert(!worldSource.includes("sharedGeometries.shoreHalfNS"), "world.js should not use half-tile shoreline rims");
  assert(!worldSource.includes("sharedGeometries.shoreHalfEW"), "world.js should not use half-tile shoreline rims");
  assert(!worldSource.includes("water.rotation.y = (((x * 33391) + (y * 12763)) % 4) * (Math.PI / 2);"), "world.js should not rotate tiled water quads for variation");
  assert(!worldSource.includes("sharedMaterials.waterShallow.map"), "world.js should not drive water visuals through repeated shallow-water textures");
  assert(!worldSource.includes("sharedMaterials.waterDeep.map"), "world.js should not drive water visuals through repeated deep-water textures");

  assert(inputRenderSource.includes("sharedMaterials.waterAnimatedMaterials"), "render loop should animate shader-driven water materials");
  assert(inputRenderSource.includes("data.type === 'GROUND' || data.type === 'WALL' || data.type === 'TOWER' || data.type === 'WATER'"), "raycast hit normalization should resolve merged water mesh hits to grid tiles");
  assert(inputRenderSource.includes("if (!isWaterTileId(tile) && isWalkableTileId(tile)) {") && inputRenderSource.includes("resolvedType = 'GROUND';"), "raycast hit normalization should treat pier-overlaid walkable tiles as ground so dock clicks can walk");
  assert(inputRenderSource.includes("isPierProtectedWaterTile"), "input-render.js should keep pier-edge shallow water fishable without making it pathable");
  assert(inputRenderSource.includes("isPierFishingApproachTile"), "input-render.js should treat raised pier deck tiles as valid fishing approach tiles");
  assert(inputRenderSource.includes("hasPierFishingApproachForWaterTile"), "input-render.js should resolve pier fishing clicks to water that is directly fishable from the dock");
  assert(inputRenderSource.includes("findNearestPierDeckBoardingTile"), "input-render.js should expose a dock-boarding resolver for ambiguous water click targets around the pier");
  assert(inputRenderSource.includes("snappedBoardTile = findNearestPierDeckBoardingTile"), "input-render.js should snap shoreline water hits to nearby pier deck tiles when boarding");
  assert(inputRenderSource.includes("const canDescendViaPierStep ="), "input-render.js should detect pier stair clicks while on deck");
  assert(inputRenderSource.includes("pierStepDescend = true;"), "input-render.js should mark pier-descend walk intents when stair hits are normalized");
  assert(inputRenderSource.includes("pendingAction.obj === 'PIER_STEP_DESCEND'"), "input-render.js should carry pier-descend walk intents into movement resolution");
  assert(inputRenderSource.includes("stair fallback step"), "input-render.js should provide a stair fallback move when pathfinding cannot bridge dock seam tiles");
  assert(inputRenderSource.includes("candidateY === stairDeckY"), "pier step fallback should not treat the first deck row as the shore row");
  assert(inputRenderSource.includes("isPierDeckHeightTransition"), "normal walking should bridge the small height seam between pier deck and shore");
  assert(inputRenderSource.includes("source=${data.isPierStep ? 'step' : 'water'}"), "input-render.js should tag stair descend snaps for QA pier-debug traces");
  assert(inputRenderSource.includes("restrictPierFishingToDeck"), "input-render.js should prevent fishing pathing from stepping off the pier into shallow water");

  console.log("Water render guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
