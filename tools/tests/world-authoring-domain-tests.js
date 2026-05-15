const assert = require("assert");
const path = require("path");

const { loadTsModule } = require("../lib/ts-module-loader");
const { loadNpcDialogueCatalog } = require("../content/npc-dialogue-catalog-loader");
const { TileId } = require("../content/tile-ids");
const { buildWorldGameplayMap } = require("../content/world-map-builder");
const { findShortestPathLength, isWalkable } = require("../content/world-pathing");
const { loadWorldContent } = require("../content/world-content");
const { readRepoFile } = require("./repo-file-test-utils");

const root = path.resolve(__dirname, "..", "..");
const authoring = loadTsModule(path.join(root, "src", "game", "world", "authoring.ts"));
const manifest = require(path.join(root, "content", "world", "manifest.json"));
const starterTown = require(path.join(root, "content", "world", "regions", "main_overworld.json"));
const tutorialIsland = require(path.join(root, "content", "world", "regions", "tutorial_island.json"));

const MAIN_OVERWORLD_MAP_SIZE = 1296;
const TUTORIAL_LAYOUT_WORLD_MAP_SIZE = 648;
const WORLD_COORD_SCALE = MAIN_OVERWORLD_MAP_SIZE / 486;
const TUTORIAL_WORLD_COORD_SCALE = (TUTORIAL_LAYOUT_WORLD_MAP_SIZE / 486) * 0.8;
const LEGACY_WORLD_CENTER = 486 / 2;
const TUTORIAL_LAYOUT_WORLD_CENTER = TUTORIAL_LAYOUT_WORLD_MAP_SIZE / 2;
const STARTER_TOWN_STAMP_IDS = Object.freeze([
  "castle_floor0",
  "castle_floor1",
  "general_store",
  "smithing_hall",
  "road_outpost",
  "timber_cottage",
  "timber_longhouse",
  "timber_shack",
  "timber_workshop",
  "timber_hut",
  "bw_frontier_cottage",
  "bw_quarry_bunkhouse",
  "bw_quarry_storehouse",
  "bw_frontier_bank",
  "bw_stone_townhouse",
  "bw_painted_gallery",
  "bw_castle_gatehouse",
  "bw_burnt_cottage",
  "bw_stone_manor"
]);

const STARTER_TOWN_STRUCTURE_LAYOUT = Object.freeze({
  castle_ground: { stampId: "castle_floor0", x: 190, y: 190, z: 0 },
  castle_second_floor: { stampId: "castle_floor1", x: 190, y: 190, z: 1 },
  general_store: { stampId: "general_store", x: 177, y: 232, z: 0 },
  smithing_hall: { stampId: "smithing_hall", x: 221, y: 228, z: 0 },
  east_road_outpost: { stampId: "road_outpost", x: 360, y: 250, z: 0 },
  shopkeeper_house: { stampId: "timber_longhouse", x: 166, y: 232, z: 0 },
  crafting_teacher_cottage: { stampId: "timber_cottage", x: 176, y: 243, z: 0 },
  fishing_teacher_shack: { stampId: "timber_shack", x: 167, y: 216, z: 0 },
  road_guide_hut: { stampId: "timber_hut", x: 221, y: 216, z: 0 },
  fishing_supplier_shack: { stampId: "timber_shack", x: 231, y: 216, z: 0 },
  elira_gemhand_cottage: { stampId: "timber_cottage", x: 167, y: 188, z: 0 },
  borin_ironvein_house: { stampId: "timber_longhouse", x: 242, y: 220, z: 0 },
  tanner_rusk_tannery: { stampId: "timber_workshop", x: 242, y: 230, z: 0 },
  outpost_guide_house: { stampId: "timber_cottage", x: 257, y: 250, z: 0 },
  thrain_deepforge_house: { stampId: "timber_longhouse", x: 268, y: 250, z: 0 },
  rune_tutor_hut: { stampId: "timber_hut", x: 216, y: 176, z: 0 },
  combination_sage_hut: { stampId: "timber_hut", x: 146, y: 176, z: 0 },
  north_woodwatch_lodge: { stampId: "bw_frontier_cottage", x: 78, y: 50, z: 0 },
  north_woodwatch_bunkhouse: { stampId: "bw_quarry_bunkhouse", x: 104, y: 56, z: 0 },
  north_woodwatch_fletchers_workshop: { stampId: "timber_workshop", x: 86, y: 66, z: 0 },
  south_quarry_storehouse: { stampId: "bw_quarry_storehouse", x: 318, y: 386, z: 0 },
  south_quarry_cottage_west: { stampId: "bw_frontier_cottage", x: 300, y: 404, z: 0 },
  south_quarry_cottage_east: { stampId: "bw_frontier_cottage", x: 344, y: 404, z: 0 },
  market_crossing_bank: { stampId: "bw_frontier_bank", x: 416, y: 376, z: 0 },
  market_crossing_townhouse: { stampId: "bw_stone_townhouse", x: 432, y: 384, z: 0 },
  market_crossing_gallery: { stampId: "bw_painted_gallery", x: 448, y: 398, z: 0 },
  market_crossing_cottage: { stampId: "bw_frontier_cottage", x: 414, y: 404, z: 0 },
  market_crossing_bunkhouse: { stampId: "bw_quarry_bunkhouse", x: 462, y: 376, z: 0 },
  old_road_gatehouse: { stampId: "bw_castle_gatehouse", x: 428, y: 118, z: 0 },
  old_road_burnt_cottage: { stampId: "bw_burnt_cottage", x: 400, y: 150, z: 0 },
  old_road_manor: { stampId: "bw_stone_manor", x: 448, y: 146, z: 0 }
});

const STARTER_TOWN_STAIRCASE_LAYOUT = Object.freeze({
  castle_stairs_left: { x: 194, y: 214, z: 0, tileId: "STAIRS_RAMP", height: 0.75 },
  castle_stairs_right: { x: 216, y: 214, z: 0, tileId: "STAIRS_RAMP", height: 0.75 },
  general_store_stairs: { x: 186, y: 236, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  shopkeeper_house_stairs: { x: 170, y: 240, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  crafting_teacher_cottage_stairs: { x: 179, y: 251, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  fishing_teacher_shack_stairs: { x: 170, y: 222, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  road_guide_hut_stairs: { x: 223, y: 222, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  fishing_supplier_shack_stairs: { x: 234, y: 222, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  elira_gemhand_cottage_stairs: { x: 170, y: 196, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  borin_ironvein_house_stairs: { x: 246, y: 228, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  tanner_rusk_tannery_stairs: { x: 247, y: 238, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  outpost_guide_house_stairs: { x: 260, y: 258, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  thrain_deepforge_house_stairs: { x: 272, y: 258, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  rune_tutor_hut_stairs: { x: 218, y: 182, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  combination_sage_hut_stairs: { x: 148, y: 182, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  distributed_bank_booths: { x: 362, y: 252, z: 0, tileId: "BANK_BOOTH", height: 0.05 },
  north_woodwatch_lodge_stairs: { x: 81, y: 56, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  north_woodwatch_bunkhouse_stairs: { x: 108, y: 62, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  north_woodwatch_fletchers_workshop_stairs: { x: 91, y: 73, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  south_quarry_storehouse_stairs: { x: 323, y: 393, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  south_quarry_cottage_west_stairs: { x: 303, y: 410, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  south_quarry_cottage_east_stairs: { x: 347, y: 410, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  market_crossing_bank_stairs: { x: 419, y: 382, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  market_crossing_townhouse_stairs: { x: 436, y: 391, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  market_crossing_gallery_stairs: { x: 453, y: 405, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  market_crossing_cottage_stairs: { x: 417, y: 410, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  market_crossing_bunkhouse_stairs: { x: 466, y: 382, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  old_road_gatehouse_stairs: { x: 434, y: 124, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  old_road_burnt_cottage_stairs: { x: 403, y: 156, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  old_road_manor_stairs: { x: 454, y: 155, z: 0, tileId: "STAIRS_RAMP", height: 0.25 }
});

const MAIN_OVERWORLD_ROAD_IDS = Object.freeze([
  "starter_town_east_road",
  "starter_town_north_altar_road",
  "starter_town_starter_mine_spur",
  "starter_town_south_resource_road",
  "starter_town_southwest_bank_road",
  "starter_town_southeast_camp_road",
  "north_woodwatch_track",
  "north_woodwatch_fletchers_lane",
  "south_quarry_hamlet_road",
  "market_crossing_main_road",
  "market_crossing_gallery_lane",
  "old_roadhold_gate_road",
  "old_roadhold_ash_track",
  "starter_to_sunspur_checkpoint_road",
  "sunspur_trade_outpost_worn_road"
]);

const STARTER_TOWN_NAMED_NPC_LAYOUT = Object.freeze({
  "merchant:general_store": { x: 170, y: 239, z: 0, dialogueId: "shopkeeper", scaledX: 447, scaledY: 626 },
  "merchant:fletching_supplier": { x: 91, y: 72, z: 0, dialogueId: "fletching_supplier", scaledX: 234, scaledY: 182 },
  "merchant:starter_caravan_guide": { x: 223, y: 221, z: 0, dialogueId: "road_guide", scaledX: 591, scaledY: 581 },
  "merchant:east_outpost_caravan_guide": { x: 260, y: 257, z: 0, dialogueId: "outpost_guide", scaledX: 688, scaledY: 674 },
  "merchant:advanced_fletcher": { x: 92, y: 71, z: 0, dialogueId: "advanced_fletcher", scaledX: 235, scaledY: 181 },
  "merchant:advanced_woodsman": { x: 82, y: 54, z: 0, dialogueId: "advanced_woodsman", scaledX: 212, scaledY: 137 },
  "merchant:fishing_teacher": { x: 170, y: 221, z: 0, dialogueId: "fishing_teacher", scaledX: 448, scaledY: 581 },
  "merchant:fishing_supplier": { x: 234, y: 221, z: 0, dialogueId: "fishing_supplier", scaledX: 619, scaledY: 581 },
  "merchant:forester_teacher": { x: 219, y: 205, z: 0, dialogueId: "forester_teacher", scaledX: 536, scaledY: 522 },
  "merchant:borin_ironvein": { x: 303, y: 409, z: 0, dialogueId: "borin_ironvein", scaledX: 803, scaledY: 1082 },
  "merchant:thrain_deepforge": { x: 347, y: 409, z: 0, dialogueId: "thrain_deepforge", scaledX: 920, scaledY: 1082 },
  "merchant:elira_gemhand": { x: 322, y: 392, z: 0, dialogueId: "elira_gemhand", scaledX: 852, scaledY: 1035 },
  "merchant:crafting_teacher": { x: 450, y: 403, z: 0, dialogueId: "crafting_teacher", scaledX: 1197, scaledY: 1066 },
  "merchant:tanner_rusk": { x: 417, y: 409, z: 0, dialogueId: "tanner_rusk", appearanceId: "tanner_rusk", scaledX: 1107, scaledY: 1082 },
  "merchant:north_woodwatch_guide": { x: 81, y: 56, z: 0, dialogueId: "outpost_guide", scaledX: 211, scaledY: 139 },
  "merchant:south_quarry_foreman": { x: 323, y: 392, z: 0, dialogueId: "outpost_guide", scaledX: 853, scaledY: 1035 },
  "merchant:market_crossing_trader": { x: 436, y: 391, z: 0, dialogueId: "shopkeeper", scaledX: 1156, scaledY: 1031 },
  "merchant:market_crossing_painter": { x: 453, y: 405, z: 0, dialogueId: "shopkeeper", scaledX: 1200, scaledY: 1068 },
  "merchant:old_road_scavenger": { x: 434, y: 124, z: 0, dialogueId: "outpost_guide", scaledX: 1147, scaledY: 321 },
  "merchant:rune_tutor": { x: 218, y: 181, z: 0, dialogueId: "rune_tutor", scaledX: 578, scaledY: 474 },
  "merchant:combination_sage": { x: 148, y: 181, z: 0, dialogueId: "combination_sage", scaledX: 391, scaledY: 474 }
});

const STARTER_TOWN_BANK_LAYOUT = Object.freeze({
  "bank:east_outpost": { spawnId: "npc:banker_east_outpost", x: 364, y: 252, z: 0, scaledX: 964, scaledY: 669, homeTag: "home:distributed_bank_booths" },
  "bank:willow_bend": { spawnId: "npc:banker_willow_bend", x: 244, y: 66, z: 0, scaledX: 651, scaledY: 176, homeTag: "home:distributed_bank_booths" },
  "bank:maple_ridge": { spawnId: "npc:banker_maple_ridge", x: 399, y: 205, z: 0, scaledX: 1064, scaledY: 547, homeTag: "home:distributed_bank_booths" },
  "bank:yew_frontier": { spawnId: "npc:banker_yew_frontier", x: 58, y: 16, z: 0, scaledX: 155, scaledY: 43, homeTag: "home:distributed_bank_booths" },
  "bank:south_field": { spawnId: "npc:banker_south_field", x: 256, y: 444, z: 0, scaledX: 683, scaledY: 1184, homeTag: "home:distributed_bank_booths" },
  "bank:west_range": { spawnId: "npc:banker_west_range", x: 64, y: 456, z: 0, scaledX: 171, scaledY: 1216, homeTag: "home:distributed_bank_booths" },
  "bank:southeast_camp": { spawnId: "npc:banker_southeast_camp", x: 416, y: 430, z: 0, scaledX: 1109, scaledY: 1147, homeTag: "home:distributed_bank_booths" },
  "bank:air_altar": { spawnId: "npc:banker_air_altar", x: 96, y: 31, z: 0, scaledX: 256, scaledY: 83, homeTag: "home:distributed_bank_booths" },
  "bank:south_quarry": { spawnId: "npc:banker_south_quarry", x: 324, y: 393, z: 0, scaledX: 854, scaledY: 1036, homeTag: "home:south_quarry_storehouse" },
  "bank:market_crossing": { spawnId: "npc:banker_market_crossing", x: 419, y: 382, z: 0, scaledX: 1112, scaledY: 1009, homeTag: "home:market_crossing_bank" }
});

const STARTER_TOWN_NPC_HOME_TAGS = Object.freeze({
  "merchant:general_store": "home:shopkeeper_house",
  "merchant:fletching_supplier": "home:north_woodwatch_fletchers_workshop",
  "merchant:starter_caravan_guide": "home:road_guide_hut",
  "merchant:east_outpost_caravan_guide": "home:outpost_guide_house",
  "merchant:advanced_fletcher": "home:north_woodwatch_fletchers_workshop",
  "merchant:advanced_woodsman": "home:north_woodwatch_lodge",
  "merchant:fishing_teacher": "home:fishing_teacher_shack",
  "merchant:fishing_supplier": "home:fishing_supplier_shack",
  "merchant:forester_teacher": "home:starter_grove",
  "merchant:borin_ironvein": "home:south_quarry_cottage_west",
  "merchant:thrain_deepforge": "home:south_quarry_cottage_east",
  "merchant:elira_gemhand": "home:south_quarry_storehouse",
  "merchant:crafting_teacher": "home:market_crossing_gallery",
  "merchant:tanner_rusk": "home:market_crossing_cottage",
  "merchant:north_woodwatch_guide": "home:north_woodwatch_lodge",
  "merchant:south_quarry_foreman": "home:south_quarry_storehouse",
  "merchant:market_crossing_trader": "home:market_crossing_townhouse",
  "merchant:market_crossing_painter": "home:market_crossing_gallery",
  "merchant:old_road_scavenger": "home:old_road_gatehouse",
  "merchant:rune_tutor": "home:rune_tutor_hut",
  "merchant:combination_sage": "home:combination_sage_hut"
});

function scaleAxis(value) {
  return Math.round(value * WORLD_COORD_SCALE);
}

function tutorialScaleAxis(value) {
  return Math.round(TUTORIAL_LAYOUT_WORLD_CENTER + ((value - LEGACY_WORLD_CENTER) * TUTORIAL_WORLD_COORD_SCALE));
}

function scaleRadius(value) {
  return Math.max(0.05, Number((value * WORLD_COORD_SCALE).toFixed(3)));
}

function makeSparseGameplayMap() {
  return [
    [],
    []
  ];
}

function setSparseTile(map, x, y, z, tileId) {
  if (!map[z]) map[z] = [];
  if (!map[z][y]) map[z][y] = [];
  map[z][y][x] = tileId;
}

{
  const map = makeSparseGameplayMap();
  setSparseTile(map, 10, 10, 0, TileId.GRASS);
  setSparseTile(map, 11, 11, 0, TileId.GRASS);
  setSparseTile(map, 11, 10, 0, TileId.FENCE);
  setSparseTile(map, 10, 11, 0, TileId.FENCE);

  assert.strictEqual(
    findShortestPathLength(map, { x: 10, y: 10, z: 0 }, { x: 11, y: 11, z: 0 }, { maxDistance: 2 }),
    null,
    "path helper should not allow diagonal movement through two blocked corner tiles"
  );
}

{
  const map = makeSparseGameplayMap();
  setSparseTile(map, 20, 20, 0, TileId.GRASS);
  setSparseTile(map, 21, 20, 0, TileId.GRASS);
  setSparseTile(map, 22, 20, 0, TileId.GRASS);

  assert.strictEqual(
    findShortestPathLength(map, { x: 20, y: 20, z: 0 }, { x: 22, y: 20, z: 0 }, {
      maxDistance: 4,
      allowedBounds: { xMin: 20, xMax: 21, yMin: 20, yMax: 20, z: 0 }
    }),
    null,
    "path helper should reject tutorial path goals outside the allowed movement bounds"
  );
}

{
  const starterManifestEntry = manifest.worlds.find((entry) => entry.worldId === "main_overworld");
  const tutorialManifestEntry = manifest.worlds.find((entry) => entry.worldId === "tutorial_island");
  assert.ok(starterManifestEntry, "starter_town should exist in the raw manifest");
  assert.ok(tutorialManifestEntry, "tutorial_island should exist in the raw manifest");
  assert.deepStrictEqual(starterManifestEntry.stampIds, STARTER_TOWN_STAMP_IDS, "starter_town manifest should expose the full homestead stamp kit");
  assert.deepStrictEqual(tutorialManifestEntry.stampIds, ["tutorial_start_cabin"], "tutorial_island should expose the authored starting cabin stamp");

  const scaledDefaultSpawn = authoring.getDefaultSpawn("main_overworld");
  assert.deepStrictEqual(
    scaledDefaultSpawn,
    {
      x: scaleAxis(starterManifestEntry.defaultSpawn.x),
      y: scaleAxis(starterManifestEntry.defaultSpawn.y),
      z: starterManifestEntry.defaultSpawn.z
    },
    "typed authoring default spawn should scale manifest coordinates for the expanded world"
  );

  const scaledManifestEntry = authoring.getWorldManifestEntry("main_overworld");
  assert.deepStrictEqual(
    scaledManifestEntry.defaultSpawn,
    scaledDefaultSpawn,
    "manifest entry lookup and default spawn lookup should stay in sync"
  );
  assert.strictEqual(
    authoring.getWorldManifestEntry("starter_town").worldId,
    "main_overworld",
    "legacy starter_town world id should resolve to main_overworld"
  );

  const scaledTutorialSpawn = authoring.getDefaultSpawn("tutorial_island");
  const tutorialSpawnDefinition = authoring.getWorldDefinition("tutorial_island");
  const rawTutorialStructure = tutorialIsland.structures[0];
  const scaledTutorialStructure = tutorialSpawnDefinition.structures[0];
  assert.deepStrictEqual(
    scaledTutorialSpawn,
    {
      x: scaledTutorialStructure.x + (tutorialManifestEntry.defaultSpawn.x - rawTutorialStructure.x),
      y: scaledTutorialStructure.y + (tutorialManifestEntry.defaultSpawn.y - rawTutorialStructure.y),
      z: tutorialManifestEntry.defaultSpawn.z
    },
    "typed authoring should preserve tutorial island default spawn as a local cabin offset"
  );
}

{
  const tutorialDefinition = authoring.getWorldDefinition("tutorial_island");
  const dialogueCatalog = loadNpcDialogueCatalog(root);
  const tutorialManifestEntry = manifest.worlds.find((entry) => entry.worldId === "tutorial_island");
  const rawGuide = tutorialIsland.services.find((entry) => entry.serviceId === "merchant:tutorial_guide");
  const scaledGuide = tutorialDefinition.services.find((entry) => entry.serviceId === "merchant:tutorial_guide");
  const servicesById = Object.fromEntries(tutorialIsland.services.map((entry) => [entry.serviceId, entry]));
  const scaledServicesById = Object.fromEntries(tutorialDefinition.services.map((entry) => [entry.serviceId, entry]));

  assert.ok(rawGuide, "raw tutorial island should include the tutorial guide");
  assert.ok(scaledGuide, "scaled tutorial island should include the tutorial guide");
  assert.deepStrictEqual(tutorialManifestEntry.defaultSpawn, { x: 138, y: 175, z: 0 }, "raw tutorial island should start the player inside the cabin but off the guide tile");
  assert.strictEqual(rawGuide.x, 141, "raw tutorial guide should stand beside the cabin door");
  assert.strictEqual(rawGuide.y, 177, "raw tutorial guide should remain inside the start cabin by the door");
  assert.ok(Math.abs(rawGuide.facingYaw - Math.PI) < 0.000001, "raw tutorial guide should face inward on a cardinal angle away from the cabin door");
  assert.strictEqual(rawGuide.roamingRadiusOverride, 0, "raw tutorial guide should stand still in the arrival cabin");
  assert.notDeepStrictEqual(
    { x: rawGuide.x, y: rawGuide.y, z: rawGuide.z },
    tutorialManifestEntry.defaultSpawn,
    "raw tutorial guide should not overlap the player spawn"
  );
  assert.strictEqual(tutorialDefinition.worldId, "tutorial_island", "tutorial island definition id mismatch");
  assert.strictEqual(tutorialIsland.version, "2026.05.surface_v2", "raw tutorial island should declare the surface-v2 layout");
  assert.ok(tutorialIsland.terrainPatches.islandWater && tutorialIsland.terrainPatches.islandWater.landPolygon.length >= 8, "raw tutorial island should author an irregular island landmass");
  assert.ok(Array.isArray(tutorialIsland.terrainPatches.paths) && tutorialIsland.terrainPatches.paths.length >= 5, "raw tutorial island should author lowered dirt routes across the island");
  assert.deepStrictEqual(
    tutorialIsland.terrainPatches.paths.map((pathPatch) => pathPatch.pathId).sort(),
    [
      "tutorial_advanced_skill_yard_apron",
      "tutorial_ember_altar_spur",
      "tutorial_fire_clearing_patch",
      "tutorial_fire_to_quarry_path",
      "tutorial_quarry_work_apron",
      "tutorial_quarry_to_bank_path",
      "tutorial_start_to_survival_path",
      "tutorial_survival_resources_path",
      "tutorial_survival_to_fire_path"
    ].sort(),
    "raw tutorial island should keep the surface path graph clean and non-crisscrossing"
  );
  {
    const fireClearingPatch = tutorialIsland.terrainPatches.paths.find((pathPatch) => pathPatch.pathId === "tutorial_fire_clearing_patch");
    assert.ok(fireClearingPatch, "raw tutorial island should keep a small fire-clearing path overlap");
    assert.ok(fireClearingPatch.pathWidth <= 1.5, "fire-clearing dirt should stay narrow instead of forming a dead-end spur");
    assert.ok(fireClearingPatch.edgeSoftness <= 0.45, "fire-clearing dirt should not feather into a visible dead-end spur");
    assert.ok(
      fireClearingPatch.points.every((point) => point.y <= 248),
      "fire-clearing dirt should stay on the main fire path and not branch south near live 371,338"
    );
  }
  assert.strictEqual(tutorialIsland.terrainPatches.pier.enabled, false, "raw tutorial island should disable the fishing pier");
  {
    const islandPatch = tutorialIsland.terrainPatches.islandWater;
    const xs = islandPatch.landPolygon.map((point) => point.x);
    const ys = islandPatch.landPolygon.map((point) => point.y);
    assert.ok(Math.max(...xs) - Math.min(...xs) >= 270, "raw tutorial island landmass should stay expanded for surface-v2 spacing");
    assert.ok(Math.max(...ys) - Math.min(...ys) >= 180, "raw tutorial island landmass should be taller after the second island expansion");
    assert.deepStrictEqual(islandPatch.waterBounds, { xMin: 0, xMax: 486, yMin: 0, yMax: 486 }, "tutorial surrounding sea should cover the full authored world");
    function distanceToSegment(point, start, end) {
      const vx = end.x - start.x;
      const vy = end.y - start.y;
      const wx = point.x - start.x;
      const wy = point.y - start.y;
      const lengthSquared = (vx * vx) + (vy * vy);
      const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((wx * vx) + (wy * vy)) / lengthSquared)) : 0;
      return Math.hypot(point.x - (start.x + (t * vx)), point.y - (start.y + (t * vy)));
    }
    function distanceToIslandEdge(point) {
      let best = Infinity;
      for (let i = 0; i < islandPatch.landPolygon.length; i++) {
        best = Math.min(best, distanceToSegment(point, islandPatch.landPolygon[i], islandPatch.landPolygon[(i + 1) % islandPatch.landPolygon.length]));
      }
      return best;
    }
    const authoredSurfaceBoundaryPoints = []
      .concat(tutorialIsland.landmarks.fences.flatMap((fence) => fence.points))
      .concat(tutorialIsland.landmarks.doors.filter((door) => Number.isFinite(door.tutorialRequiredStep)).map((gate) => ({ x: gate.x, y: gate.y })))
      .concat(tutorialIsland.terrainPatches.paths.flatMap((pathPatch) => pathPatch.points));
    assert.ok(
      authoredSurfaceBoundaryPoints.every((point) => distanceToIslandEdge(point) >= 5),
      "surface-v2 fences, gates, and road anchors should stay at least five raw tiles inside the ocean shoreline"
    );
  }
  assert.ok(Array.isArray(tutorialIsland.waterBodies) && tutorialIsland.waterBodies.some((body) => body.id === "tutorial_surrounding_sea"), "raw tutorial island should include a surrounding sea render body");
  assert.strictEqual(tutorialIsland.services.length, 14, "raw tutorial island surface-v2 should include all surface tutors, late-skill tutors, and smithing stations");
  const tutorialLessonGates = tutorialIsland.landmarks.doors.filter((door) => Number.isFinite(door.tutorialRequiredStep) && door.tileId === "WOODEN_GATE_CLOSED");
  assert.strictEqual(tutorialIsland.combatSpawns.length, 3, "raw tutorial island surface-v2 should include a small surface combat yard");
  assert.strictEqual(tutorialIsland.resourceNodes.mining.length, 4, "raw tutorial island surface-v2 should include a small surface quarry");
  assert.strictEqual(tutorialIsland.resourceNodes.woodcutting.length, 6, "raw tutorial island should include a denser survival-field grove");
  assert.strictEqual(tutorialIsland.structures.length, 1, "raw tutorial island should include the starting cabin structure");
  assert.strictEqual(tutorialIsland.structures[0].stampId, "tutorial_start_cabin", "raw tutorial island cabin should use the tutorial cabin stamp");
  assert.strictEqual(tutorialLessonGates.length, 4, "raw tutorial island surface-v2 should include quarry, combat, bank, and exit gates");
  assert.ok(tutorialLessonGates.every((door) => door.tileId === "WOODEN_GATE_CLOSED"), "tutorial lesson gates should use wooden gate tiles");
  assert.ok(!tutorialIsland.landmarks.doors.some((door) => door.landmarkId === "tutorial_gate_arrival_to_survival_field"), "surface-v2 should not keep a redundant gate east of the arrival cabin");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_survival_to_quarry_yard" && door.tutorialRequiredStep === 4), "surface-v2 should gate the quarry yard after cooking");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_quarry_to_combat_yard" && door.tutorialRequiredStep === 5), "surface-v2 should gate combat after mining and smithing");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_combat_to_bank" && door.tutorialRequiredStep === 6), "surface-v2 should gate banking after combat");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_bank_to_exit" && door.tutorialRequiredStep === 11), "surface-v2 should keep the final exit behind the expanded tutorial proof");
  assert.ok(
    tutorialIsland.landmarks.doors.some((door) => (
      door.landmarkId === "tutorial_start_cabin_door"
      && door.tileId === "DOOR_CLOSED"
      && door.isOpen === false
      && door.tutorialRequiredStep === 1
      && door.tutorialAutoOpenOnUnlock === false
    )),
    "tutorial starting cabin should use a locked closed normal door until the guide clears the player"
  );
  assert.ok(Array.isArray(tutorialIsland.landmarks.fences) && tutorialIsland.landmarks.fences.length >= 5, "tutorial island should author real fence landmarks without enclosing the natural survival field");
  assert.ok(!tutorialIsland.landmarks.fences.some((fence) => fence.landmarkId === "tutorial_survival_field_fence"), "natural survival field should stay open instead of being boxed by a huge fence");
  {
    const fenceIds = new Set(tutorialIsland.landmarks.fences.map((fence) => fence.landmarkId));
    [
      "tutorial_arrival_path_north_fence",
      "tutorial_arrival_path_south_fence",
      "tutorial_arrival_west_boundary_fence",
      "tutorial_quarry_path_north_fence",
      "tutorial_quarry_path_south_fence",
      "tutorial_combat_bank_path_north_fence",
      "tutorial_combat_bank_path_south_fence",
      "tutorial_exit_path_north_fence",
      "tutorial_exit_path_south_fence",
      "tutorial_survival_gate_upper_threshold_fence",
      "tutorial_survival_gate_lower_threshold_fence",
      "tutorial_quarry_gate_upper_threshold_fence",
      "tutorial_quarry_gate_lower_threshold_fence",
      "tutorial_combat_gate_upper_threshold_fence",
      "tutorial_combat_gate_lower_threshold_fence"
    ].forEach((fenceId) => {
      assert.ok(fenceIds.has(fenceId), `tutorial island should use path-following fence rail ${fenceId}`);
    });
    assert.ok(
      tutorialIsland.landmarks.fences.every((fence) => {
        const first = fence.points[0];
        const last = fence.points[fence.points.length - 1];
        return !first || !last || first.x !== last.x || first.y !== last.y;
      }),
      "tutorial fence landmarks should be open path rails rather than closed polygons that cut across the route"
    );
    function distanceToSegment(point, start, end) {
      const vx = end.x - start.x;
      const vy = end.y - start.y;
      const wx = point.x - start.x;
      const wy = point.y - start.y;
      const lengthSquared = (vx * vx) + (vy * vy);
      const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((wx * vx) + (wy * vy)) / lengthSquared)) : 0;
      return Math.hypot(point.x - (start.x + (t * vx)), point.y - (start.y + (t * vy)));
    }
    const looseGateIds = tutorialLessonGates.filter((gate) => {
      let nearestFence = Infinity;
      tutorialIsland.landmarks.fences.forEach((fence) => {
        for (let i = 1; i < fence.points.length; i++) {
          nearestFence = Math.min(nearestFence, distanceToSegment(gate, fence.points[i - 1], fence.points[i]));
        }
      });
      return nearestFence > 4.1;
    }).map((gate) => gate.landmarkId);
    assert.deepStrictEqual(looseGateIds, [], "tutorial lesson gates should sit in nearby fence-threshold breaks instead of floating on the path");
  }
  {
    const pond = tutorialIsland.terrainPatches.castleFrontPond;
    function isInsidePond(point) {
      const rotation = Number.isFinite(pond.rotationRadians) ? -pond.rotationRadians : 0;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const dx = point.x - pond.cx;
      const dy = point.y - pond.cy;
      const localX = (dx * cos) - (dy * sin);
      const localY = (dx * sin) + (dy * cos);
      return ((localX * localX) / (pond.rx * pond.rx)) + ((localY * localY) / (pond.ry * pond.ry)) <= 1;
    }
    function segmentCrossesPond(start, end) {
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        if (isInsidePond({ x: start.x + ((end.x - start.x) * t), y: start.y + ((end.y - start.y) * t) })) {
          return true;
        }
      }
      return false;
    }
    const pondFenceCrossings = [];
    tutorialIsland.landmarks.fences.forEach((fence) => {
      for (let i = 1; i < fence.points.length; i++) {
        if (segmentCrossesPond(fence.points[i - 1], fence.points[i])) {
          pondFenceCrossings.push(`${fence.landmarkId}:${i - 1}-${i}`);
        }
      }
    });
    assert.deepStrictEqual(pondFenceCrossings, [], "tutorial fences should wrap around the survival pond instead of crossing its water");
  }
  const tutorialCabinRoof = Array.isArray(tutorialIsland.landmarks.roofs)
    ? tutorialIsland.landmarks.roofs.find((roof) => roof.landmarkId === "tutorial_start_cabin_roof")
    : null;
  assert.ok(tutorialCabinRoof && tutorialCabinRoof.hideWhenPlayerInside === true, "tutorial cabin should author a hideable roof");
  assert.strictEqual(tutorialCabinRoof.height, 3.02, "tutorial cabin roof eaves should sit just above the 3.0-tile cabin walls");
  assert.ok(Array.isArray(tutorialIsland.landmarks.caveOpenings) && tutorialIsland.landmarks.caveOpenings.length === 0, "tutorial island surface-v2 should keep the full tutorial loop on the surface");
  assert.ok(Array.isArray(tutorialIsland.landmarks.decorProps) && tutorialIsland.landmarks.decorProps.length === 18, "tutorial island should author focused arrival, grove, quarry, combat, and late-skill yard decorative props");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_cabin_desk" && prop.kind === "desk" && prop.blocksMovement === true), "tutorial cabin should include a blocking tutor desk prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_cabin_tool_rack" && prop.kind === "tool_rack" && prop.blocksMovement === true), "tutorial cabin tool rack should block movement");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_arrival_notice_board" && prop.kind === "notice_board"), "tutorial arrival yard should include a notice board prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_grove_chopping_block" && prop.kind === "chopping_block" && prop.blocksMovement === true), "tutorial grove should include a blocking chopping block prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_grove_woodpile" && prop.kind === "woodpile" && prop.blocksMovement === true), "tutorial grove should include a blocking woodpile prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_tool_rack" && prop.kind === "tool_rack" && prop.blocksMovement === true), "tutorial quarry should include a blocking mining tool rack prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_ore_pile" && prop.kind === "ore_pile" && prop.blocksMovement === false), "tutorial quarry should include a non-blocking sorted ore pile prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_coal_bin" && prop.kind === "coal_bin" && prop.blocksMovement === true), "tutorial quarry should include a blocking coal bin prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_barrel" && prop.kind === "barrel" && prop.blocksMovement === true), "tutorial quarry should include a blocking quench barrel prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_combat_weapon_rack" && prop.kind === "weapon_rack" && prop.blocksMovement === true), "tutorial combat yard should include a blocking weapon rack prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_combat_training_dummy" && prop.kind === "training_dummy" && prop.blocksMovement === true), "tutorial combat yard should include a blocking decorative training dummy prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_combat_archery_target" && prop.kind === "archery_target" && prop.blocksMovement === true), "tutorial combat yard should include a blocking archery target prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_ranged_arrow_crate" && prop.kind === "crate" && prop.blocksMovement === true), "tutorial ranged station should include a blocking arrow crate prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_magic_lesson_board" && prop.kind === "notice_board" && prop.blocksMovement === true), "tutorial magic station should include a lesson board prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_runecrafting_essence_crate" && prop.kind === "crate" && prop.blocksMovement === true), "tutorial runecrafting station should include a blocking essence crate prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_crafting_bench" && prop.kind === "desk" && prop.blocksMovement === true), "tutorial crafting station should include a blocking crafting bench prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_crafting_supply_crate" && prop.kind === "crate" && prop.blocksMovement === true), "tutorial crafting station should include a blocking supplies crate prop");
  assert.ok(
    !tutorialIsland.landmarks.staircases.some((landmark) => landmark.landmarkId === "tutorial_fences" || landmark.tiles.some((tile) => tile.tileId === "WALL" && tile.height === 0.2)),
    "tutorial island should not use WALL landmark tiles as pseudo fences"
  );
  assert.strictEqual(tutorialIsland.landmarks.altars.length, 1, "raw tutorial island should include the tutorial Ember Altar");
  assert.strictEqual(tutorialIsland.landmarks.altars[0].routeId, "tutorial_ember_altar", "tutorial Ember Altar should reference the tutorial route");
  assert.strictEqual(tutorialIsland.landmarks.altars[0].variant, 4, "tutorial Ember Altar should use the ember altar visual variant");
  assert.strictEqual(tutorialIsland.skillRoutes.runecrafting.length, 1, "raw tutorial island should include one runecrafting route");
  assert.strictEqual(tutorialIsland.skillRoutes.runecrafting[0].routeId, "tutorial_ember_altar", "raw tutorial island runecrafting route should point at the tutorial Ember Altar");
  assert.ok(
    Math.abs(tutorialIsland.terrainPatches.castleFrontPond.rotationRadians - (Math.PI / 4)) < 0.000001,
    "raw tutorial survival pond should be angled with the road bend"
  );
  {
    const routeById = Object.fromEntries(
      Object.values(tutorialIsland.skillRoutes)
        .flat()
        .map((route) => [route.routeId, route])
    );
    assert.ok(routeById.tutorial_grove.x >= 200 && routeById.tutorial_grove.x <= 230 && routeById.tutorial_grove.y <= 210, "surface grid should place woodcutting in the upper survival field");
    assert.ok(routeById.tutorial_pond.x >= 255 && routeById.tutorial_pond.x <= 270 && routeById.tutorial_pond.y >= 232 && routeById.tutorial_pond.y <= 242, "surface grid should place fishing at the angled survival pond");
    assert.ok(servicesById["merchant:tutorial_woodcutting_instructor"].x >= 245 && servicesById["merchant:tutorial_woodcutting_instructor"].y >= 208, "surface grid should move the woodcutting instructor closer to the pond bend");
    assert.strictEqual(servicesById["merchant:tutorial_woodcutting_instructor"].appearanceId, "tutorial_woodcutting_instructor", "woodcutting instructor should use the authored old woodsman appearance");
    assert.strictEqual(servicesById["merchant:tutorial_fishing_instructor"].x, 274, "surface grid should place the fishing instructor on the southern pond bank");
    assert.strictEqual(servicesById["merchant:tutorial_fishing_instructor"].y, 240, "surface grid should place the fishing instructor on the southern pond bank");
    assert.strictEqual(servicesById["merchant:tutorial_fishing_instructor"].roamingRadiusOverride, 0, "fishing instructor should stand still on the southern pond bank");
    assert.ok(Math.abs(servicesById["merchant:tutorial_fishing_instructor"].facingYaw - Math.PI) < 0.000001, "fishing instructor should face north toward the pond");
    assert.strictEqual(servicesById["merchant:tutorial_fishing_instructor"].appearanceId, "tutorial_fishing_instructor", "fishing instructor should use the authored weathered angler appearance");
    assert.ok(routeById.tutorial_fire.x >= 270 && routeById.tutorial_fire.x <= 290 && routeById.tutorial_fire.y >= 240 && routeById.tutorial_fire.y <= 260, "surface grid should place open-fire cooking between survival and the quarry road");
    assert.strictEqual(servicesById["merchant:tutorial_firemaking_instructor"].appearanceId, "tutorial_firemaking_instructor", "firemaking instructor should use the authored sooty worker appearance");
    assert.strictEqual(servicesById["merchant:tutorial_firemaking_instructor"].roamingRadiusOverride, 0, "firemaking instructor should stand still for visual inspection");
    assert.strictEqual(servicesById["merchant:tutorial_mining_smithing_instructor"].appearanceId, "tutorial_mining_smithing_instructor", "mining and smithing instructor should use the authored aproned foreman appearance");
    assert.ok(routeById.tutorial_surface_mine.x >= 340 && routeById.tutorial_surface_mine.x <= 370 && routeById.tutorial_surface_mine.y >= 280 && routeById.tutorial_surface_mine.y <= 300, "surface grid should place mining in the south-east surface quarry");
    assert.strictEqual(servicesById["merchant:tutorial_combat_instructor"].appearanceId, "tutorial_combat_instructor", "combat instructor should use the authored arms trainer appearance");
    assert.strictEqual(servicesById["merchant:tutorial_combat_instructor"].roamingRadiusOverride, 0, "combat instructor should stand still for visual inspection");
    assert.strictEqual(scaledServicesById["merchant:tutorial_combat_instructor"].appearanceId, "tutorial_combat_instructor", "combat instructor appearance should survive authoring scale");
    assert.strictEqual(scaledServicesById["merchant:tutorial_combat_instructor"].roamingRadiusOverride, 0, "combat instructor stationary roaming should survive authoring scale");
    assert.ok(routeById.tutorial_ember_altar && routeById.tutorial_ember_altar.x === 236 && routeById.tutorial_ember_altar.y === 342, "surface grid should place the tutorial Ember Altar in the late-skill yard");
    assert.ok(servicesById["merchant:tutorial_ranged_instructor"].x >= 330 && servicesById["merchant:tutorial_ranged_instructor"].x <= 345, "surface grid should place the ranged instructor by the archery target");
    assert.strictEqual(servicesById["merchant:tutorial_ranged_instructor"].appearanceId, "tutorial_ranged_instructor", "ranged instructor should use the authored archery trainer appearance");
    assert.ok(servicesById["merchant:tutorial_magic_instructor"].x >= 285 && servicesById["merchant:tutorial_magic_instructor"].x <= 300, "surface grid should place the magic instructor by the lesson board");
    assert.strictEqual(servicesById["merchant:tutorial_magic_instructor"].appearanceId, "tutorial_magic_instructor", "magic instructor should use the authored rune lesson appearance");
    assert.ok(servicesById["merchant:tutorial_runecrafting_instructor"].x >= 240 && servicesById["merchant:tutorial_runecrafting_instructor"].x <= 252, "surface grid should place the runecrafting instructor by the Ember Altar");
    assert.strictEqual(servicesById["merchant:tutorial_runecrafting_instructor"].appearanceId, "tutorial_runecrafting_instructor", "runecrafting instructor should use the authored altar scribe appearance");
    assert.ok(servicesById["merchant:tutorial_crafting_instructor"].x >= 212 && servicesById["merchant:tutorial_crafting_instructor"].x <= 224, "surface grid should place the crafting instructor by the crafting bench");
    assert.strictEqual(servicesById["merchant:tutorial_crafting_instructor"].appearanceId, "tutorial_crafting_instructor", "crafting instructor should use the authored artisan appearance");
    assert.strictEqual(servicesById["merchant:tutorial_bank_tutor"].appearanceId, "tutorial_bank_tutor", "bank tutor should use the authored ledger tutor appearance");
    assert.ok(servicesById["merchant:tutorial_bank_tutor"].x >= 190 && servicesById["merchant:tutorial_bank_tutor"].x <= 215 && servicesById["merchant:tutorial_bank_tutor"].y >= 320, "surface grid should keep the bank tutor in the south-west bank area");
    assert.ok(servicesById["merchant:tutorial_exit_guide"].x >= 240 && servicesById["merchant:tutorial_exit_guide"].y >= 330, "surface grid should keep the exit guide near the south bank exit");
    assert.strictEqual(servicesById["merchant:tutorial_guide"].tutorialVisibleUntilStep, 10, "arrival Tutorial Guide should hide before the final center-yard exit step");
    assert.strictEqual(servicesById["merchant:tutorial_exit_guide"].tutorialVisibleFromStep, 11, "center-yard Tutorial Guide should only appear for the final exit step");
    assert.strictEqual(servicesById["merchant:tutorial_exit_guide"].roamingRadiusOverride, 0, "center-yard Tutorial Guide should stand still at the exit handoff");
    assert.strictEqual(servicesById["merchant:tutorial_exit_guide"].appearanceId, servicesById["merchant:tutorial_guide"].appearanceId, "arrival and exit Tutorial Guide placements should share the same identity appearance");
    assert.strictEqual(servicesById["merchant:tutorial_exit_guide"].dialogueId, servicesById["merchant:tutorial_guide"].dialogueId, "arrival and exit Tutorial Guide placements should share the same dialogue identity");
  }
  assert.strictEqual(dialogueCatalog.resolveDialogueId(rawGuide.dialogueId), "tutorial_guide", "tutorial guide dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_woodcutting_instructor"].dialogueId), "tutorial_woodcutting_instructor", "woodcutting instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_fishing_instructor"].dialogueId), "tutorial_fishing_instructor", "fishing instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_firemaking_instructor"].dialogueId), "tutorial_firemaking_instructor", "firemaking instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_mining_smithing_instructor"].dialogueId), "tutorial_mining_smithing_instructor", "mining and smithing instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_combat_instructor"].dialogueId), "tutorial_combat_instructor", "combat instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_ranged_instructor"].dialogueId), "tutorial_ranged_instructor", "ranged instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_magic_instructor"].dialogueId), "tutorial_magic_instructor", "magic instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_runecrafting_instructor"].dialogueId), "tutorial_runecrafting_instructor", "runecrafting instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_crafting_instructor"].dialogueId), "tutorial_crafting_instructor", "crafting instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_bank_tutor"].dialogueId), "tutorial_bank_tutor", "bank tutor dialogue should resolve");
  assert.ok(
    readRepoFile(root, "src/js/world/logical-map-authoring-runtime.js").includes("!spot.tags.includes('tutorial')"),
    "tutorial instructors should not inherit raised smithing/crafting merchant floor height"
  );
  assert.deepStrictEqual(
    { x: scaledGuide.x, y: scaledGuide.y, z: scaledGuide.z },
    {
      x: tutorialDefinition.structures[0].x + (rawGuide.x - tutorialIsland.structures[0].x),
      y: tutorialDefinition.structures[0].y + (rawGuide.y - tutorialIsland.structures[0].y),
      z: rawGuide.z
    },
    "tutorial guide placement should preserve its local cabin offset after scaling"
  );
  assert.deepStrictEqual(
    scaledGuide.travelSpawn,
    { x: tutorialScaleAxis(rawGuide.travelSpawn.x), y: tutorialScaleAxis(rawGuide.travelSpawn.y), z: rawGuide.travelSpawn.z },
    "tutorial guide travel spawn should scale through the authoring bridge"
  );
  assert.ok(
    tutorialDefinition.landmarks.fences.every((fence) => fence.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))),
    "scaled tutorial fences should preserve finite authored points"
  );
  assert.ok(
    tutorialDefinition.landmarks.roofs.some((roof) => roof.landmarkId === "tutorial_start_cabin_roof" && roof.hideBounds && roof.hideWhenPlayerInside === true),
    "scaled tutorial island should preserve cabin roof hide metadata"
  );
  assert.ok(
    tutorialDefinition.landmarks.decorProps.some((prop) => prop.propId === "tutorial_cabin_desk" && prop.x === tutorialDefinition.structures[0].x + 3),
    "scaled tutorial island should preserve cabin decor props as local cabin offsets"
  );
  assert.ok(
    tutorialDefinition.landmarks.decorProps.some((prop) => prop.propId === "tutorial_combat_weapon_rack" && prop.x === tutorialScaleAxis(312) && prop.kind === "weapon_rack"),
    "scaled tutorial island should preserve combat yard decor props"
  );
  assert.strictEqual(tutorialDefinition.landmarks.caveOpenings.length, 0, "scaled tutorial island should preserve the no-cave surface-v2 layout");
  assert.ok(
    Array.isArray(tutorialDefinition.terrainPatches.paths)
      && tutorialDefinition.terrainPatches.paths.some((pathPatch) => pathPatch.pathId === "tutorial_fire_to_quarry_path" && pathPatch.points[2].x === tutorialScaleAxis(352))
      && tutorialDefinition.terrainPatches.paths.some((pathPatch) => pathPatch.pathId === "tutorial_quarry_work_apron" && pathPatch.points[1].x === tutorialScaleAxis(352)),
    "scaled tutorial island should scale terrain path patch points"
  );

  const tutorialContent = loadWorldContent(root, "tutorial_island");
  const gameplayMap = buildWorldGameplayMap(tutorialContent.world, tutorialContent.stamps);
  assert.strictEqual(gameplayMap[0][20][20], TileId.WATER_DEEP, "tutorial surrounding sea should replace distant off-island grass with water");
  assert.strictEqual(gameplayMap[0][139][118], TileId.SHORE, "tutorial island edge should include walkable shore tiles");
  assert.strictEqual(gameplayMap[0][196][216], TileId.DIRT, "tutorial island paths should stamp lowered dirt trail tiles");
  assert.notStrictEqual(gameplayMap[0][236][300], TileId.FLOOR_WOOD, "disabled tutorial pier should not stamp a wooden dock");
  assert.strictEqual(gameplayMap[0][162][130], TileId.FENCE, "tutorial fence lines should expand into FENCE tiles");
  assert.strictEqual(isWalkable(gameplayMap, 130, 162, 0), false, "FENCE tiles should block movement");
  assert.strictEqual(gameplayMap[0][168][135], TileId.OBSTACLE, "blocking decor props should reserve obstacle tiles");
  assert.strictEqual(gameplayMap[0][171][143], TileId.OBSTACLE, "blocking cabin tool rack should reserve an obstacle tile");
  assert.strictEqual(gameplayMap[0][210][214], TileId.OBSTACLE, "blocking grove chopping block should reserve an obstacle tile");
  assert.strictEqual(gameplayMap[0][210][226], TileId.OBSTACLE, "blocking grove woodpile should reserve an obstacle tile");
  assert.strictEqual(gameplayMap[0][322][312], TileId.OBSTACLE, "blocking combat weapon rack should reserve an obstacle tile");
  assert.strictEqual(gameplayMap[0][338][306], TileId.OBSTACLE, "blocking combat training dummy should reserve an obstacle tile");
  assert.strictEqual(gameplayMap[0][320][350], TileId.OBSTACLE, "blocking combat archery target should reserve an obstacle tile");
  assert.strictEqual(gameplayMap[0][178][140], TileId.DOOR_CLOSED, "tutorial cabin exit should start as a closed normal door tile");
  assert.strictEqual(isWalkable(gameplayMap, 140, 178, 0), false, "closed tutorial cabin doors should block movement before the guide clears the player");
  gameplayMap[0][178][140] = TileId.DOOR_OPEN;
  assert.strictEqual(isWalkable(gameplayMap, 140, 178, 0), true, "open tutorial cabin doors should be walkable after the guide clears the player");
  assert.notStrictEqual(gameplayMap[0][186][176], TileId.WOODEN_GATE_CLOSED, "arrival corridor should not keep the removed east-side wooden gate tile");
  assert.strictEqual(gameplayMap[0][260][324], TileId.WOODEN_GATE_CLOSED, "tutorial gates should expand into closed wooden gate tiles");
  assert.strictEqual(isWalkable(gameplayMap, 324, 260, 0), false, "closed wooden gates should block movement");
  gameplayMap[0][260][324] = TileId.WOODEN_GATE_OPEN;
  assert.strictEqual(isWalkable(gameplayMap, 324, 260, 0), true, "open wooden gates should be walkable");
  {
    const unlockedTutorialMap = buildWorldGameplayMap(tutorialContent.world, tutorialContent.stamps);
    unlockedTutorialMap[0][178][140] = TileId.DOOR_OPEN;
    tutorialLessonGates.forEach((gate) => {
      unlockedTutorialMap[gate.z][gate.y][gate.x] = TileId.WOODEN_GATE_OPEN;
      assert.strictEqual(isWalkable(unlockedTutorialMap, gate.x, gate.y, gate.z), true, `${gate.landmarkId} should be walkable after it unlocks`);
    });
    assert.notStrictEqual(
      findShortestPathLength(unlockedTutorialMap, { x: 140, y: 179, z: 0 }, { x: 250, y: 350, z: 0 }, { maxDistance: 380, maxVisited: 100000 }),
      null,
      "opened tutorial lesson gates and their threshold fences should preserve the forward spiral route to the exit"
    );
  }
  assert.strictEqual(gameplayMap[0][280][350], TileId.ROCK, "tutorial quarry should stamp the north-west tin training rock");
  assert.strictEqual(gameplayMap[0][280][358], TileId.ROCK, "tutorial quarry should stamp the north copper training rock");
  assert.strictEqual(gameplayMap[0][287][368], TileId.ROCK, "tutorial quarry should stamp the east tin training rock");
  assert.strictEqual(gameplayMap[0][298][356], TileId.ROCK, "tutorial quarry should stamp the south copper training rock");
  assert.strictEqual(gameplayMap[0][322][184], TileId.BANK_BOOTH, "tutorial bank should stamp bank booth tiles");
  assert.strictEqual(tutorialIsland.skillRoutes.cooking[0].fireTiles.length, 0, "surface-v2 cooking should not author permanent fire spots");
  assert.notStrictEqual(
    findShortestPathLength(gameplayMap, { x: 262, y: 237, z: 0 }, { x: 282, y: 246, z: 0 }, { maxDistance: 128, maxVisited: 10000 }),
    null,
    "combined survival field should allow pathing from the closer pond to the fire clearing"
  );

  const scaledTutorialDefinition = authoring.getWorldDefinition("tutorial_island");
  const scaledTutorialMap = buildWorldGameplayMap(scaledTutorialDefinition, {
    tutorial_start_cabin: require(path.join(root, "content", "world", "stamps", "tutorial_start_cabin.json"))
  });
  const scaledTutorialMine = scaledTutorialDefinition.skillRoutes.mining.find((route) => route.routeId === "tutorial_surface_mine");
  assert(scaledTutorialMine, "scaled tutorial should preserve the mining route anchor");
  assert.strictEqual(scaledTutorialMap[0][scaledTutorialMine.y][scaledTutorialMine.x], TileId.DIRT, "scaled tutorial mining route anchor should land on the walkable quarry apron, not pond water");
  assert.notStrictEqual(scaledTutorialMap[0][288][356], TileId.GRASS, "raw tutorial mining coordinates should not be treated as the expanded-world quarry anchor");
  assert.strictEqual(scaledTutorialDefinition.terrainPatches.islandWater.waterBounds.xMin, 0, "scaled tutorial sea should keep full-map west coverage");
  assert.strictEqual(scaledTutorialDefinition.terrainPatches.islandWater.waterBounds.xMax, 1296, "scaled tutorial sea should keep full-map east coverage");
  assert.strictEqual(scaledTutorialMap[0][0][0], TileId.WATER_DEEP, "scaled tutorial outer edge should be ocean, not grass or rocks");
  assert.strictEqual(scaledTutorialMap[0][647][647], TileId.WATER_DEEP, "scaled tutorial far outer edge should be ocean, not grass or rocks");
  for (const gate of scaledTutorialDefinition.landmarks.doors) {
    if (Number.isFinite(gate.tutorialRequiredStep) && gate.tutorialRequiredStep <= 4 && gate.tileId === "WOODEN_GATE_CLOSED") {
      scaledTutorialMap[gate.z][gate.y][gate.x] = TileId.WOODEN_GATE_OPEN;
    }
  }
  assert.strictEqual(
    findShortestPathLength(scaledTutorialMap, { x: scaledTutorialMine.x, y: scaledTutorialMine.y, z: 0 }, { x: scaledTutorialMine.x, y: 520, z: 0 }, {
      maxDistance: 220,
      maxVisited: 50000,
      allowedBounds: { xMin: 138, xMax: 519, yMin: 196, yMax: 458, z: 0 }
    }),
    null,
    "tutorial movement bounds should prevent pathing from the mine approach into the surrounding sea"
  );
  const inputPathfindingRuntimeSource = readRepoFile(root, "src/js/input-pathfinding-runtime.js");
  assert.ok(
    inputPathfindingRuntimeSource.includes("if (blockX || blockY) continue;"),
    "runtime pathing should reject diagonal corner-cutting along fence and gate corners"
  );
  assert.ok(
    inputPathfindingRuntimeSource.includes("context.isTutorialWalkTileAllowed"),
    "runtime pathing should keep active tutorial movement inside the authored island route"
  );
}

{
  const starterDefinition = authoring.getWorldDefinition("main_overworld");
  const legacyStarterDefinition = authoring.getWorldDefinition("starter_town");
  const dialogueCatalog = loadNpcDialogueCatalog(root);
  const rawStructuresById = Object.fromEntries(starterTown.structures.map((entry) => [entry.structureId, entry]));
  const scaledStructuresById = Object.fromEntries(starterDefinition.structures.map((entry) => [entry.structureId, entry]));
  const rawCastle = rawStructuresById.castle_ground;
  const rawPond = starterTown.terrainPatches.castleFrontPond;
  const rawCombatSpawns = starterTown.combatSpawns;

  assert.ok(rawCastle, "raw starter_town data should include castle_ground");
  assert.ok(rawPond, "raw starter_town data should include castle_front_pond");
  assert.strictEqual(starterTown.structures.length, Object.keys(STARTER_TOWN_STRUCTURE_LAYOUT).length, "raw starter_town should include the full homestead structure layout");
  assert.strictEqual(starterTown.landmarks.staircases.length, Object.keys(STARTER_TOWN_STAIRCASE_LAYOUT).length, "raw starter_town should include the full staircase access layout");
  assert.ok(Array.isArray(rawCombatSpawns) && rawCombatSpawns.length === 53, "raw starter_town data should include 53 combat spawns");
  assert.ok(Array.isArray(starterTown.skillRoutes.firemaking) && starterTown.skillRoutes.firemaking.length === 5, "raw starter_town should include 5 authored firemaking routes");

  const rawChicken = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_chicken_south_field");
  const rawBoar = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_east_field_center");
  const rawWolf = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_wolf_outer_north");
  const rawBoarWestNorth = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_north");
  const rawBoarWestSouth = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_south");
  const rawBoarEastNorth = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_east_north");
  const rawSoutheastCampAnchor = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_heavy_brute_southeast_camp_anchor");
  const rawSoutheastCampPatroller = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_fast_striker_southeast_camp_east");

  const scaledCastle = scaledStructuresById.castle_ground;
  const scaledPond = starterDefinition.terrainPatches.castleFrontPond;
  const rawServicesById = Object.fromEntries(starterTown.services.map((entry) => [entry.serviceId, entry]));
  const scaledServicesById = Object.fromEntries(starterDefinition.services.map((entry) => [entry.serviceId, entry]));
  const scaledCombatSpawns = starterDefinition.combatSpawns;
  const scaledTrainingDummy = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_training_dummy_hub");
  const scaledChicken = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_chicken_south_field");
  const scaledBoar = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_east_field_center");
  const scaledWolf = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_wolf_outer_north");
  const scaledBoarWestNorth = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_north");
  const scaledBoarWestSouth = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_south");
  const scaledBoarEastNorth = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_east_north");
  const scaledSoutheastCampAnchor = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_heavy_brute_southeast_camp_anchor");
  const scaledSoutheastCampPatroller = scaledCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_fast_striker_southeast_camp_east");

  assert.strictEqual(legacyStarterDefinition.worldId, "main_overworld", "legacy starter_town lookup should return the main overworld definition");
  assert.ok(
    Array.isArray(starterDefinition.areas)
      && starterDefinition.areas.some((area) => area && area.areaId === "starter_town" && area.label === "Starter Town"),
    "main_overworld should preserve Starter Town as an authored area"
  );

  assert.deepStrictEqual(
    { x: scaledCastle.x, y: scaledCastle.y },
    { x: scaleAxis(rawCastle.x), y: scaleAxis(rawCastle.y) },
    "world definition structures should scale authored x/y coordinates"
  );
  Object.entries(STARTER_TOWN_STRUCTURE_LAYOUT).forEach(([structureId, expected]) => {
    const rawStructure = rawStructuresById[structureId];
    const scaledStructure = scaledStructuresById[structureId];
    assert.ok(rawStructure, `raw starter_town should include structure ${structureId}`);
    assert.ok(scaledStructure, `scaled starter_town should include structure ${structureId}`);
    assert.deepStrictEqual(
      { stampId: rawStructure.stampId, x: rawStructure.x, y: rawStructure.y, z: rawStructure.z },
      expected,
      `${structureId} should keep the authored homestead placement`
    );
    assert.deepStrictEqual(
      { stampId: scaledStructure.stampId, x: scaledStructure.x, y: scaledStructure.y, z: scaledStructure.z },
      {
        stampId: expected.stampId,
        x: scaleAxis(expected.x),
        y: scaleAxis(expected.y),
        z: expected.z
      },
      `${structureId} should scale with the authored starter-town stamp layout`
    );
  });
  const rawStaircasesById = Object.fromEntries(starterTown.landmarks.staircases.map((entry) => [entry.landmarkId, entry]));
  Object.entries(STARTER_TOWN_STAIRCASE_LAYOUT).forEach(([landmarkId, expected]) => {
    const staircase = rawStaircasesById[landmarkId];
    assert.ok(staircase, `raw starter_town data should include staircase ${landmarkId}`);
    assert.ok(Array.isArray(staircase.tiles) && staircase.tiles.length > 0, `${landmarkId} should define staircase tiles`);
    const firstTile = staircase.tiles[0];
    assert.deepStrictEqual(
      { x: firstTile.x, y: firstTile.y, z: firstTile.z, tileId: firstTile.tileId, height: firstTile.height },
      expected,
      `${landmarkId} should keep the authored staircase access placement`
    );
  });
  assert.deepStrictEqual(
    { cx: scaledPond.cx, cy: scaledPond.cy, rx: scaledPond.rx, ry: scaledPond.ry },
    {
      cx: scaleAxis(rawPond.cx),
      cy: scaleAxis(rawPond.cy),
      rx: scaleRadius(rawPond.rx),
      ry: scaleRadius(rawPond.ry)
    },
    "world definition lakes should scale center axes and radii"
  );
  assert.strictEqual(starterDefinition.structures.length, starterTown.structures.length, "scaled starter_town should preserve structure count");
  const rawFiremakingRoutesById = Object.fromEntries(starterTown.skillRoutes.firemaking.map((entry) => [entry.routeId, entry]));
  const scaledFiremakingRoutesById = Object.fromEntries(starterDefinition.skillRoutes.firemaking.map((entry) => [entry.routeId, entry]));
  ["starter_fire_lane", "oak_fire_lane", "willow_fire_lane", "maple_fire_lane", "yew_fire_lane"].forEach((routeId) => {
    const rawRoute = rawFiremakingRoutesById[routeId];
    const scaledRoute = scaledFiremakingRoutesById[routeId];
    assert.ok(rawRoute, `raw starter_town should include firemaking route ${routeId}`);
    assert.ok(scaledRoute, `scaled starter_town should include firemaking route ${routeId}`);
    assert.deepStrictEqual(
      { x: scaledRoute.x, y: scaledRoute.y, z: scaledRoute.z, alias: scaledRoute.alias },
      { x: scaleAxis(rawRoute.x), y: scaleAxis(rawRoute.y), z: rawRoute.z, alias: rawRoute.alias },
      `${routeId} should preserve its firemaking alias while scaling its anchor`
    );
  });
  const rawRoadPaths = Array.isArray(starterTown.terrainPatches.paths)
    ? starterTown.terrainPatches.paths.filter((pathPatch) => Array.isArray(pathPatch.tags) && pathPatch.tags.includes("road"))
    : [];
  const scaledRoadPaths = Array.isArray(starterDefinition.terrainPatches.paths)
    ? starterDefinition.terrainPatches.paths.filter((pathPatch) => Array.isArray(pathPatch.tags) && pathPatch.tags.includes("road"))
    : [];
  const rawRoadPathsById = Object.fromEntries(rawRoadPaths.map((pathPatch) => [pathPatch.pathId, pathPatch]));
  const scaledRoadPathsById = Object.fromEntries(scaledRoadPaths.map((pathPatch) => [pathPatch.pathId, pathPatch]));
  assert.deepStrictEqual(
    rawRoadPaths.map((pathPatch) => pathPatch.pathId).sort(),
    MAIN_OVERWORLD_ROAD_IDS.slice().sort(),
    "raw main overworld should author the protected road network"
  );
  MAIN_OVERWORLD_ROAD_IDS.forEach((pathId) => {
    const rawRoad = rawRoadPathsById[pathId];
    const scaledRoad = scaledRoadPathsById[pathId];
    assert.ok(rawRoad, `raw main overworld should include road ${pathId}`);
    assert.ok(scaledRoad, `scaled main overworld should include road ${pathId}`);
    assert.ok(rawRoad.tags.includes("spawn-protected"), `${pathId} should be tagged spawn-protected`);
    assert.strictEqual(rawRoad.tileId, "DIRT", `${pathId} should stamp dirt road tiles`);
    assert.deepStrictEqual(
      scaledRoad.points,
      rawRoad.points.map((point) => ({ x: scaleAxis(point.x), y: scaleAxis(point.y) })),
      `${pathId} road points should scale with the authored world`
    );
    assert.strictEqual(scaledRoad.pathWidth, scaleRadius(rawRoad.pathWidth), `${pathId} path width should scale with the authored world`);
    assert.strictEqual(scaledRoad.edgeSoftness, scaleRadius(rawRoad.edgeSoftness), `${pathId} edge softness should scale with the authored world`);
  });
  const rawLandformsById = Object.fromEntries((starterTown.terrainPatches.landforms || []).map((landform) => [landform.landformId, landform]));
  const scaledLandformsById = Object.fromEntries((starterDefinition.terrainPatches.landforms || []).map((landform) => [landform.landformId, landform]));
  ["east_marsh_lower_bank", "sunspur_foothill_rise", "sunspur_far_ridge_silhouette"].forEach((landformId) => {
    assert.ok(rawLandformsById[landformId], `raw main overworld should include terrain landform ${landformId}`);
    assert.ok(scaledLandformsById[landformId], `scaled main overworld should include terrain landform ${landformId}`);
    assert.strictEqual(scaledLandformsById[landformId].height, rawLandformsById[landformId].height, `${landformId} height should not scale with map axes`);
  });
  assert.strictEqual(scaledLandformsById.east_marsh_lower_bank.cx, scaleAxis(rawLandformsById.east_marsh_lower_bank.cx), "lower-bank landform cx should scale");
  assert.strictEqual(scaledLandformsById.east_marsh_lower_bank.ry, scaleRadius(rawLandformsById.east_marsh_lower_bank.ry), "lower-bank landform radius should scale");
  assert.deepStrictEqual(
    scaledLandformsById.sunspur_foothill_rise.points,
    rawLandformsById.sunspur_foothill_rise.points.map((point) => ({ x: scaleAxis(point.x), y: scaleAxis(point.y) })),
    "foothill landform path points should scale"
  );
  assert.strictEqual(scaledLandformsById.sunspur_foothill_rise.pathWidth, scaleRadius(rawLandformsById.sunspur_foothill_rise.pathWidth), "foothill landform width should scale");
  assert.strictEqual(scaledLandformsById.sunspur_foothill_rise.edgeSoftness, scaleRadius(rawLandformsById.sunspur_foothill_rise.edgeSoftness), "foothill landform softness should scale");
  assert.ok(dialogueCatalog && typeof dialogueCatalog.resolveDialogueId === "function", "npc dialogue catalog should expose resolveDialogueId");
  Object.entries(STARTER_TOWN_NAMED_NPC_LAYOUT).forEach(([serviceId, expected]) => {
    const rawService = rawServicesById[serviceId];
    const scaledService = scaledServicesById[serviceId];
    assert.ok(rawService, `raw starter_town data should include ${serviceId}`);
    assert.ok(scaledService, `scaled starter_town data should include ${serviceId}`);
    assert.deepStrictEqual(
      { x: rawService.x, y: rawService.y, z: rawService.z },
      { x: expected.x, y: expected.y, z: expected.z },
      `${serviceId} should keep the authored homestead dialogue placement`
    );
    const rawDialogueId = typeof rawService.dialogueId === "string" ? rawService.dialogueId.trim() : "";
    assert.strictEqual(rawDialogueId, expected.dialogueId, `${serviceId} should define the expected dialogueId in authored data`);
    assert.strictEqual(dialogueCatalog.resolveDialogueId(rawDialogueId), expected.dialogueId, `${serviceId} dialogueId should resolve to ${expected.dialogueId}`);
    assert.deepStrictEqual(
      { x: scaledService.x, y: scaledService.y, z: scaledService.z },
      { x: expected.scaledX, y: expected.scaledY, z: expected.z },
      `${serviceId} should land in the scaled homestead/dialogue layout`
    );
    assert.strictEqual(scaledService.dialogueId, rawService.dialogueId, `${serviceId} dialogueId should survive authoring scale`);
    const homeTag = STARTER_TOWN_NPC_HOME_TAGS[serviceId];
    assert.ok(homeTag, `${serviceId} should have an expected NPC home tag`);
    assert.ok(rawService.tags.includes(homeTag), `${serviceId} should keep the authored NPC home/base tag`);
    assert.ok(scaledService.tags.includes(homeTag), `${serviceId} NPC home/base tag should survive authoring scale`);
    if (Object.prototype.hasOwnProperty.call(expected, "appearanceId")) {
      assert.strictEqual(rawService.appearanceId, expected.appearanceId, `${serviceId} should keep the authored appearanceId`);
      assert.strictEqual(scaledService.appearanceId, expected.appearanceId, `${serviceId} appearanceId should survive authoring scale`);
    }
  });
  Object.entries(STARTER_TOWN_BANK_LAYOUT).forEach(([serviceId, expected]) => {
    const rawService = rawServicesById[serviceId];
    const scaledService = scaledServicesById[serviceId];
    assert.ok(rawService, `raw starter_town data should include bank service ${serviceId}`);
    assert.ok(scaledService, `scaled starter_town data should include bank service ${serviceId}`);
    assert.deepStrictEqual(
      { spawnId: rawService.spawnId, name: rawService.name, action: rawService.action, dialogueId: rawService.dialogueId },
      { spawnId: expected.spawnId, name: "Banker", action: "Bank", dialogueId: "banker" },
      `${serviceId} should keep the authored banker interaction contract`
    );
    assert.deepStrictEqual(
      { x: rawService.x, y: rawService.y, z: rawService.z },
      { x: expected.x, y: expected.y, z: expected.z },
      `${serviceId} should keep the authored bank placement`
    );
    assert.deepStrictEqual(
      { x: scaledService.x, y: scaledService.y, z: scaledService.z },
      { x: expected.scaledX, y: expected.scaledY, z: expected.z },
      `${serviceId} should scale with the authored bank placement`
    );
    assert.strictEqual(dialogueCatalog.resolveDialogueId(rawService.dialogueId), "banker", `${serviceId} dialogueId should resolve to banker`);
    assert.ok(rawService.tags.includes(expected.homeTag), `${serviceId} should keep the authored bank/home tag`);
    assert.ok(scaledService.tags.includes(expected.homeTag), `${serviceId} bank/home tag should survive authoring scale`);
  });
    assert.deepStrictEqual(
      { x: scaledTrainingDummy.spawnTile.x, y: scaledTrainingDummy.spawnTile.y, z: scaledTrainingDummy.spawnTile.z },
    { x: 527, y: 528, z: 0 },
    "world definition combat spawns should keep the training dummy aligned to the castle pocket"
  );
  assert.deepStrictEqual(
    { x: scaledChicken.spawnTile.x, y: scaledChicken.spawnTile.y, z: scaledChicken.spawnTile.z },
    {
      x: scaleAxis(rawChicken.spawnTile.x),
      y: scaleAxis(rawChicken.spawnTile.y),
      z: rawChicken.spawnTile.z
    },
    "world definition combat spawns should keep chicken pocket alignment"
  );
  assert.deepStrictEqual(
    { x: scaledBoar.spawnTile.x, y: scaledBoar.spawnTile.y, z: scaledBoar.spawnTile.z },
    {
      x: scaleAxis(rawBoar.spawnTile.x),
      y: scaleAxis(rawBoar.spawnTile.y),
      z: rawBoar.spawnTile.z
    },
    "world definition combat spawns should keep boar pocket alignment"
  );
  assert.deepStrictEqual(
    { x: scaledWolf.spawnTile.x, y: scaledWolf.spawnTile.y, z: scaledWolf.spawnTile.z },
    {
      x: scaleAxis(rawWolf.spawnTile.x),
      y: scaleAxis(rawWolf.spawnTile.y),
      z: rawWolf.spawnTile.z
    },
    "world definition combat spawns should keep wolf pocket alignment"
  );
  assert.deepStrictEqual(
    { x: scaledBoarWestNorth.spawnTile.x, y: scaledBoarWestNorth.spawnTile.y, z: scaledBoarWestNorth.spawnTile.z },
    {
      x: scaleAxis(rawBoarWestNorth.spawnTile.x),
      y: scaleAxis(rawBoarWestNorth.spawnTile.y),
      z: rawBoarWestNorth.spawnTile.z
    },
    "world definition combat spawns should keep west-north boar pocket alignment"
  );
  assert.deepStrictEqual(
    { x: scaledBoarWestSouth.spawnTile.x, y: scaledBoarWestSouth.spawnTile.y, z: scaledBoarWestSouth.spawnTile.z },
    {
      x: scaleAxis(rawBoarWestSouth.spawnTile.x),
      y: scaleAxis(rawBoarWestSouth.spawnTile.y),
      z: rawBoarWestSouth.spawnTile.z
    },
    "world definition combat spawns should keep west-south boar pocket alignment"
  );
  assert.deepStrictEqual(
    { x: scaledBoarEastNorth.spawnTile.x, y: scaledBoarEastNorth.spawnTile.y, z: scaledBoarEastNorth.spawnTile.z },
    {
      x: scaleAxis(rawBoarEastNorth.spawnTile.x),
      y: scaleAxis(rawBoarEastNorth.spawnTile.y),
      z: rawBoarEastNorth.spawnTile.z
    },
    "world definition combat spawns should keep east-north boar pocket alignment"
  );
  assert.deepStrictEqual(
    { x: scaledSoutheastCampAnchor.spawnTile.x, y: scaledSoutheastCampAnchor.spawnTile.y, z: scaledSoutheastCampAnchor.spawnTile.z },
    {
      x: scaleAxis(rawSoutheastCampAnchor.spawnTile.x),
      y: scaleAxis(rawSoutheastCampAnchor.spawnTile.y),
      z: rawSoutheastCampAnchor.spawnTile.z
    },
    "world definition combat spawns should keep the southeast camp anchor alignment"
  );
  assert.deepStrictEqual(
    scaledSoutheastCampPatroller.patrolRoute,
    rawSoutheastCampPatroller.patrolRoute.map((point) => ({
      x: scaleAxis(point.x),
      y: scaleAxis(point.y),
      z: point.z
    })),
    "world definition combat patrol routes should scale with the authored world"
  );
  assert.deepStrictEqual(
    scaledSoutheastCampPatroller.patrolRoute[0],
    scaledSoutheastCampPatroller.spawnTile,
    "world definition combat patrol routes should preserve their spawn-tile anchor after authoring remaps"
  );
  assert.notStrictEqual(
    scaledSoutheastCampPatroller.patrolRoute,
    rawSoutheastCampPatroller.patrolRoute,
    "world definition combat patrol routes should be cloned instead of sharing authored route arrays"
  );
}

console.log("World authoring domain tests passed.");
