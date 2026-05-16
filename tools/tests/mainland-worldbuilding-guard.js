const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { TileId, isNaturalTileId, isWalkableTileId } = require("../content/tile-ids");
const { buildWorldGameplayMap } = require("../content/world-map-builder");
const { loadWorldContent } = require("../content/world-content");
const { assertHasIds } = require("./collection-test-utils");
const { readRepoFile } = require("./repo-file-test-utils");

const root = path.resolve(__dirname, "..", "..");
const region = JSON.parse(readRepoFile(root, "content/world/regions/main_overworld.json"));
const docsPath = path.join(root, "docs", "MAINLAND_WORLDBUILDING.md");
const elevationDocsPath = path.join(root, "docs", "MAINLAND_ELEVATION.md");

function getRowsById(rows, idField) {
  const byId = new Map();
  (Array.isArray(rows) ? rows : []).forEach((entry) => {
    if (entry && entry[idField]) byId.set(entry[idField], entry);
  });
  return byId;
}

function countTilesInBounds(map, tileId, bounds) {
  let count = 0;
  for (let y = bounds.yMin; y <= bounds.yMax; y++) {
    for (let x = bounds.xMin; x <= bounds.xMax; x++) {
      if (map[0] && map[0][y] && map[0][y][x] === tileId) count++;
    }
  }
  return count;
}

function run() {
  assert(fs.existsSync(docsPath), "mainland worldbuilding plan doc should exist");
  assert(fs.existsSync(elevationDocsPath), "mainland elevation plan doc should exist");
  const doc = readRepoFile(root, "docs/MAINLAND_WORLDBUILDING.md");
  const elevationDoc = readRepoFile(root, "docs/MAINLAND_ELEVATION.md");
  [
    "Do not reuse RuneScape or Gielinor names",
    "16x16 mainland",
    "Starter-To-Desert Slice",
    "TileId.SAND",
    "Performance Assumptions"
  ].forEach((needle) => {
    assert(doc.includes(needle), `mainland worldbuilding doc should mention ${needle}`);
  });
  [
    "terrainPatches.landforms",
    "lowered riverbank",
    "foothill",
    "chunk-safe"
  ].forEach((needle) => {
    assert(elevationDoc.includes(needle), `mainland elevation doc should mention ${needle}`);
  });

  assert(Number.isFinite(TileId.SAND), "TileId.SAND should be canonical");
  assert(isWalkableTileId(TileId.SAND), "SAND should be walkable ground");
  assert(isNaturalTileId(TileId.SAND), "SAND should be natural terrain");

  const paths = Array.isArray(region.terrainPatches.paths) ? region.terrainPatches.paths : [];
  const pathsById = getRowsById(paths, "pathId");
  assertHasIds(paths, "pathId", [
    "sunspur_dry_scrub_transition",
    "sunspur_low_wash_dip",
    "sunspur_scrub_ridge",
    "starter_to_sunspur_checkpoint_road",
    "sunspur_trade_outpost_worn_road"
  ], "main_overworld worldbuilding paths");

  [
    "sunspur_dry_scrub_transition",
    "sunspur_low_wash_dip",
    "sunspur_scrub_ridge"
  ].forEach((pathId) => {
    const pathPatch = pathsById.get(pathId);
    assert(pathPatch.tileId === "SAND", `${pathId} should stamp SAND`);
    assert(!pathPatch.tags.includes("road"), `${pathId} should not masquerade as a protected road`);
    assert(pathPatch.tags.includes("ground-texture"), `${pathId} should be explicit ground texture`);
    assert(pathPatch.tags.includes("desert-edge"), `${pathId} should carry desert-edge identity`);
  });
  assert(pathsById.get("sunspur_low_wash_dip").height < -0.09, "dry wash should lower terrain enough to read as a dip");
  assert(pathsById.get("sunspur_scrub_ridge").height > 0.04, "scrub ridge should raise terrain enough to read as a bump");

  const landforms = Array.isArray(region.terrainPatches.landforms) ? region.terrainPatches.landforms : [];
  const landformsById = getRowsById(landforms, "landformId");
  assertHasIds(landforms, "landformId", [
    "east_marsh_lower_bank",
    "east_marsh_road_descent",
    "sunspur_foothill_rise",
    "sunspur_far_ridge_silhouette"
  ], "main_overworld elevation landforms");
  assert(landformsById.get("east_marsh_lower_bank").height < -0.12, "east marsh bank should be visibly lower than surrounding land");
  assert(landformsById.get("east_marsh_lower_bank").tileId === "SHORE", "east marsh bank should stamp shoreline terrain around the water");
  assert(landformsById.get("sunspur_foothill_rise").height > 0.12, "Sunspur foothill should raise a readable walkable slope");
  assert(landformsById.get("sunspur_far_ridge_silhouette").tags.includes("mountain-silhouette"), "far ridge should declare the mountain landmark intent");

  [
    "starter_to_sunspur_checkpoint_road",
    "sunspur_trade_outpost_worn_road"
  ].forEach((pathId) => {
    const road = pathsById.get(pathId);
    assert(road.tileId === "DIRT", `${pathId} should keep roads as DIRT overlays`);
    assert(road.tags.includes("road"), `${pathId} should be tagged as a road`);
    assert(road.tags.includes("spawn-protected"), `${pathId} should remain spawn-protected`);
    assert(road.tags.includes("desert-edge"), `${pathId} should carry desert-edge identity`);
  });

  const fences = region.landmarks && Array.isArray(region.landmarks.fences) ? region.landmarks.fences : [];
  assertHasIds(fences, "landmarkId", [
    "sunspur_checkpoint_north_rail",
    "sunspur_checkpoint_south_rail",
    "saltwind_trade_outpost_paddock_rail"
  ], "main_overworld worldbuilding fences");
  fences.filter((fence) => String(fence.landmarkId || "").includes("sunspur") || String(fence.landmarkId || "").includes("saltwind"))
    .forEach((fence) => {
      assert(Array.isArray(fence.points) && fence.points.length >= 2, `${fence.landmarkId} should define a real line`);
      assert(fence.points.length <= 3, `${fence.landmarkId} should stay a short slice rail, not a region wall`);
    });

  const decorProps = region.landmarks && Array.isArray(region.landmarks.decorProps) ? region.landmarks.decorProps : [];
  assertHasIds(decorProps, "propId", [
    "sunspur_checkpoint_notice_board",
    "sunspur_checkpoint_trade_crates",
    "sunspur_dry_scrub_stone_rubble",
    "sunspur_dry_scrub_thatch_windbreak",
    "saltwind_outpost_mining_cart",
    "saltwind_outpost_ore_spill",
    "saltwind_outpost_trade_barrels"
  ], "main_overworld worldbuilding props");
  const sliceProps = decorProps.filter((prop) => Array.isArray(prop.tags) && prop.tags.includes("worldbuilding-slice"));
  assert(sliceProps.length >= 7 && sliceProps.length <= 12, "worldbuilding slice props should be present but bounded");
  sliceProps.forEach((prop) => {
    assert(prop.tags.includes("desert-edge"), `${prop.propId} should carry desert-edge identity`);
    assert(prop.x >= 360 && prop.x <= 480 && prop.y >= 330 && prop.y <= 420, `${prop.propId} should stay inside the starter-to-desert slice`);
  });

  const { world, stamps } = loadWorldContent(root, "main_overworld");
  const logicalMap = buildWorldGameplayMap(world, stamps);
  const sliceBounds = { xMin: 326, xMax: 484, yMin: 300, yMax: 420 };
  const sandCount = countTilesInBounds(logicalMap, TileId.SAND, sliceBounds);
  const dirtCount = countTilesInBounds(logicalMap, TileId.DIRT, sliceBounds);
  const fenceCount = countTilesInBounds(logicalMap, TileId.FENCE, sliceBounds);
  const lowerBankBounds = { xMin: 360, xMax: 426, yMin: 276, yMax: 324 };
  const shoreCount = countTilesInBounds(logicalMap, TileId.SHORE, lowerBankBounds);
  assert(sandCount >= 700, `starter-to-desert slice should stamp a readable sand transition, saw ${sandCount}`);
  assert(dirtCount >= 80, `starter-to-desert slice should keep readable dirt road overlays, saw ${dirtCount}`);
  assert(fenceCount >= 20, `starter-to-desert slice should stamp short fence rails, saw ${fenceCount}`);
  assert(shoreCount >= 140, `east marsh slice should stamp a readable lowered shoreline bank, saw ${shoreCount}`);

  console.log("Mainland worldbuilding guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
