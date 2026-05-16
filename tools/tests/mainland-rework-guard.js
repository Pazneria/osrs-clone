const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { buildWorldGameplayMap } = require("../content/world-map-builder");
const { collectAdjacencyViolations } = require("../content/world-pathing");
const { loadWorldContent } = require("../content/world-content");
const { assertHasIds } = require("./collection-test-utils");
const { readRepoFile } = require("./repo-file-test-utils");

const root = path.resolve(__dirname, "..", "..");
const manifest = JSON.parse(readRepoFile(root, "content/world/manifest.json"));
const region = JSON.parse(readRepoFile(root, "content/world/regions/main_overworld.json"));

function getMainManifestEntry() {
  return manifest.worlds.find((entry) => entry.worldId === "main_overworld");
}

function getShapeBounds(shape) {
  if (!shape || typeof shape !== "object") return null;
  if (shape.kind === "ellipse") {
    return {
      xMin: shape.cx - shape.rx,
      xMax: shape.cx + shape.rx,
      yMin: shape.cy - shape.ry,
      yMax: shape.cy + shape.ry
    };
  }
  if (shape.kind === "box") {
    return {
      xMin: shape.xMin,
      xMax: shape.xMax,
      yMin: shape.yMin,
      yMax: shape.yMax
    };
  }
  if (shape.kind === "polygon" && Array.isArray(shape.points)) {
    const xs = shape.points.map((point) => point.x).filter(Number.isFinite);
    const ys = shape.points.map((point) => point.y).filter(Number.isFinite);
    return {
      xMin: Math.min(...xs),
      xMax: Math.max(...xs),
      yMin: Math.min(...ys),
      yMax: Math.max(...ys)
    };
  }
  return null;
}

function collectNumericCoordinates(value, rows = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectNumericCoordinates(entry, rows));
    return rows;
  }
  if (!value || typeof value !== "object") return rows;
  ["x", "y", "cx", "cy", "xMin", "xMax", "yMin", "yMax", "centerX", "centerY"].forEach((key) => {
    if (Number.isFinite(value[key])) rows.push(value[key]);
  });
  Object.keys(value).forEach((key) => collectNumericCoordinates(value[key], rows));
  return rows;
}

function run() {
  const mainManifest = getMainManifestEntry();
  assert(mainManifest, "main_overworld manifest entry missing");

  const requiredStampIds = [
    "bw_frontier_cottage",
    "bw_quarry_storehouse",
    "bw_frontier_bank",
    "bw_stone_townhouse",
    "bw_painted_gallery",
    "bw_castle_gatehouse",
    "bw_burnt_cottage",
    "bw_stone_manor",
    "bw_quarry_bunkhouse"
  ];
  const manifestStampIds = new Set(mainManifest.stampIds);
  requiredStampIds.forEach((stampId) => {
    assert(manifestStampIds.has(stampId), `main_overworld manifest missing promoted stamp ${stampId}`);
    assert(fs.existsSync(path.join(root, "content", "world", "stamps", `${stampId}.json`)), `promoted stamp file missing ${stampId}`);
  });

  const coordinates = collectNumericCoordinates(region);
  const maxAuthoredCoordinate = Math.max(...coordinates);
  assert(maxAuthoredCoordinate <= 486, `main_overworld raw coordinate ${maxAuthoredCoordinate} would scale outside the expanded runtime map`);

  const waterBodies = Array.isArray(region.waterBodies) ? region.waterBodies : [];
  assert(waterBodies.length >= 8, "main_overworld should author waterBodies to replace the legacy river fallback");
  assert(!waterBodies.some((body) => body.id === "legacy-east-river"), "main_overworld should not author the legacy north-south river");
  waterBodies.forEach((body) => {
    const bounds = getShapeBounds(body.shape);
    assert(bounds, `water body ${body.id} missing bounds`);
    const width = bounds.xMax - bounds.xMin;
    const height = bounds.yMax - bounds.yMin;
    assert(height <= 80 || width >= 80, `water body ${body.id} looks like a long north-south blocker`);
  });

  const requiredStructureIds = [
    "north_woodwatch_lodge",
    "north_woodwatch_bunkhouse",
    "north_woodwatch_fletchers_workshop",
    "south_quarry_storehouse",
    "market_crossing_bank",
    "market_crossing_gallery",
    "old_road_gatehouse",
    "old_road_burnt_cottage"
  ];
  assertHasIds(region.structures, "structureId", requiredStructureIds, "main_overworld structures");
  const structuresById = new Map(region.structures.map((entry) => [entry.structureId, entry]));
  const promotedAnchors = [
    structuresById.get("north_woodwatch_lodge"),
    structuresById.get("south_quarry_storehouse"),
    structuresById.get("market_crossing_bank"),
    structuresById.get("old_road_gatehouse")
  ];
  assert(promotedAnchors.every(Boolean), "promoted mainland anchors missing");
  assert(Math.min(...promotedAnchors.map((entry) => entry.y)) < 130, "promoted anchors should include a northern outpost");
  assert(Math.max(...promotedAnchors.map((entry) => entry.y)) > 360, "promoted anchors should include southern settlements");
  assert(Math.min(...promotedAnchors.map((entry) => entry.x)) < 130, "promoted anchors should include a western/northwestern settlement");
  assert(Math.max(...promotedAnchors.map((entry) => entry.x)) > 390, "promoted anchors should include eastern settlements");
  const materialProfiles = new Set(region.structures.map((entry) => entry.materialProfileId).filter(Boolean));
  [
    "timber_thatch",
    "quarry_stone_slate",
    "city_stone_slate",
    "painted_plaster_tile",
    "castle_granite_slate",
    "burnt_timber_ash"
  ].forEach((profileId) => {
    assert(materialProfiles.has(profileId), `main_overworld structures should include material profile ${profileId}`);
  });
  requiredStructureIds.forEach((structureId) => {
    const structure = structuresById.get(structureId);
    assert(typeof structure.materialProfileId === "string" && structure.materialProfileId, `${structureId} should carry materialProfileId for live rendering`);
    assert(typeof structure.themeId === "string" && structure.themeId, `${structureId} should carry themeId for live rendering`);
    assert(typeof structure.conditionId === "string" && structure.conditionId, `${structureId} should carry conditionId for live rendering`);
  });

  const requiredRoadIds = [
    "north_woodwatch_track",
    "north_woodwatch_fletchers_lane",
    "south_quarry_hamlet_road",
    "market_crossing_main_road",
    "market_crossing_gallery_lane",
    "old_roadhold_gate_road",
    "old_roadhold_ash_track"
  ];
  assertHasIds(region.terrainPatches.paths, "pathId", requiredRoadIds, "main_overworld road paths");

  const requiredServiceIds = [
    "merchant:north_woodwatch_guide",
    "merchant:south_quarry_foreman",
    "bank:south_quarry",
    "bank:market_crossing",
    "merchant:market_crossing_trader",
    "merchant:market_crossing_painter",
    "merchant:old_road_scavenger"
  ];
  assertHasIds(region.services, "serviceId", requiredServiceIds, "main_overworld services");
  requiredServiceIds.forEach((serviceId) => {
    const service = region.services.find((entry) => entry.serviceId === serviceId);
    assert(
      Array.isArray(service.tags) && service.tags.some((tag) => typeof tag === "string" && tag.startsWith("home:")),
      `${serviceId} should carry an NPC home tag`
    );
  });
  const relocatedServiceExpectations = {
    "merchant:fletching_supplier": { x: 91, y: 72, home: "home:north_woodwatch_fletchers_workshop", tags: ["north", "woodcutting", "settlement"] },
    "merchant:advanced_fletcher": { x: 92, y: 71, home: "home:north_woodwatch_fletchers_workshop", tags: ["north", "woodcutting", "settlement"] },
    "merchant:advanced_woodsman": { x: 82, y: 54, home: "home:north_woodwatch_lodge", tags: ["north", "settlement"] },
    "merchant:borin_ironvein": { x: 303, y: 409, home: "home:south_quarry_cottage_west", tags: ["south", "mining", "settlement"] },
    "merchant:thrain_deepforge": { x: 347, y: 409, home: "home:south_quarry_cottage_east", tags: ["south", "mining", "settlement"] },
    "merchant:elira_gemhand": { x: 322, y: 392, home: "home:south_quarry_storehouse", tags: ["south", "gems", "settlement"] },
    "merchant:crafting_teacher": { x: 450, y: 403, home: "home:market_crossing_gallery", tags: ["market", "art", "settlement"] },
    "merchant:tanner_rusk": { x: 417, y: 409, home: "home:market_crossing_cottage", tags: ["market", "leather", "settlement"] }
  };
  Object.entries(relocatedServiceExpectations).forEach(([serviceId, expected]) => {
    const service = region.services.find((entry) => entry.serviceId === serviceId);
    assert(service, `relocated service missing ${serviceId}`);
    assert(service.x === expected.x && service.y === expected.y && service.z === 0, `${serviceId} should keep its settlement placement`);
    assert(Array.isArray(service.tags) && service.tags.includes(expected.home), `${serviceId} should use ${expected.home}`);
    expected.tags.forEach((tag) => {
      assert(service.tags.includes(tag), `${serviceId} should carry ${tag} settlement tag`);
    });
  });
  assertHasIds(region.services, "serviceId", [
    "station:south_quarry_furnace",
    "station:south_quarry_anvil"
  ], "main_overworld quarry services");

  assertHasIds(region.landmarks && region.landmarks.roofs, "landmarkId", [
    "north_woodwatch_lodge_roof",
    "north_woodwatch_fletchers_workshop_roof",
    "south_quarry_storehouse_roof",
    "market_crossing_bank_roof",
    "old_road_gatehouse_roof",
    "general_store_roof",
    "smithing_hall_roof",
    "shopkeeper_house_roof",
    "crafting_teacher_cottage_roof",
    "tanner_rusk_tannery_roof"
  ], "main_overworld roofs");
  const roofsById = new Map((region.landmarks && region.landmarks.roofs || []).map((entry) => [entry.landmarkId, entry]));
  region.structures
    .filter((structure) => structure.z === 0 && !structure.structureId.startsWith("castle_"))
    .forEach((structure) => {
      assert(roofsById.has(`${structure.structureId}_roof`), `${structure.structureId} should have a live roof landmark`);
    });
  [
    "north_woodwatch_lodge_roof",
    "north_woodwatch_fletchers_workshop_roof",
    "south_quarry_storehouse_roof",
    "market_crossing_bank_roof",
    "old_road_gatehouse_roof",
    "old_road_burnt_cottage_roof"
  ].forEach((roofId) => {
    const roof = roofsById.get(roofId);
    assert(roof && typeof roof.materialProfileId === "string" && roof.materialProfileId, `${roofId} should carry materialProfileId for live roof rendering`);
    assert(roof && Number.isFinite(roof.roofIntegrity), `${roofId} should carry roofIntegrity for live roof rendering`);
  });
  assert.strictEqual(roofsById.get("old_road_burnt_cottage_roof").materialProfileId, "burnt_timber_ash", "burnt cottage roof should use the burnt timber profile");
  assert(roofsById.get("old_road_burnt_cottage_roof").roofIntegrity <= 0.2, "burnt cottage roof should render as mostly destroyed");
  assertHasIds(region.landmarks && region.landmarks.staircases, "landmarkId", [
    "north_woodwatch_lodge_stairs",
    "north_woodwatch_fletchers_workshop_stairs",
    "south_quarry_storehouse_stairs",
    "market_crossing_bank_stairs",
    "old_road_gatehouse_stairs"
  ], "main_overworld staircases");
  assertHasIds(region.landmarks && region.landmarks.decorProps, "propId", [
    "general_store_front_shop_sign",
    "north_woodwatch_lodge_supply_barrel",
    "north_woodwatch_fletchers_workshop_tool_rack",
    "north_woodwatch_fletchers_workshop_thatch_bundle",
    "south_quarry_storehouse_ore_sorting_pile",
    "south_quarry_storehouse_loading_cart",
    "market_crossing_bank_front_sign",
    "market_crossing_gallery_artist_workdesk",
    "market_crossing_gallery_shop_sign",
    "market_crossing_gallery_front_awning",
    "market_crossing_gallery_display_painting",
    "old_road_gatehouse_gate_weapon_rack",
    "old_road_gatehouse_faded_banner",
    "old_road_burnt_cottage_collapsed_rubble",
    "old_road_manor_family_painting"
  ], "main_overworld decor props");
  const decorById = new Map((region.landmarks && region.landmarks.decorProps || []).map((entry) => [entry.propId, entry]));
  [
    ["north_woodwatch_fletchers_workshop_thatch_bundle", "thatch_bundle", "thatch"],
    ["south_quarry_storehouse_loading_cart", "quarry_cart", "quarry"],
    ["market_crossing_bank_front_sign", "bank_sign", "bank"],
    ["general_store_front_shop_sign", "shop_sign", "shop"],
    ["market_crossing_gallery_shop_sign", "shop_sign", "shop"],
    ["market_crossing_gallery_front_awning", "market_awning", "plaster"],
    ["market_crossing_gallery_display_painting", "wall_painting", "painting"],
    ["old_road_gatehouse_faded_banner", "castle_banner", "castle"],
    ["old_road_burnt_cottage_collapsed_rubble", "rubble_pile", "burnt"],
    ["old_road_manor_family_painting", "wall_painting", "mansion"]
  ].forEach(([propId, kind, tag]) => {
    const prop = decorById.get(propId);
    assert(prop && prop.kind === kind, `${propId} should use ${kind} decor rendering`);
    assert(Array.isArray(prop.tags) && prop.tags.includes(tag), `${propId} should carry ${tag} identity tag`);
  });

  const { world, stamps } = loadWorldContent(root, "main_overworld");
  const logicalMap = buildWorldGameplayMap(world, stamps);
  const adjacencyViolations = collectAdjacencyViolations(world, logicalMap);
  assert(adjacencyViolations.length === 0, `main_overworld service adjacency failed:\n${adjacencyViolations.join("\n")}`);

  console.log("Mainland rework guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
