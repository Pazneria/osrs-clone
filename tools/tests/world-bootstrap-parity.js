const fs = require("fs");
const path = require("path");
const { loadWorldContent } = require("../content/world-utils");
const { loadTsModule } = require("./ts-module-loader");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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
  "timber_hut"
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
  combination_sage_hut: { stampId: "timber_hut", x: 146, y: 176, z: 0 }
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
  combination_sage_hut_stairs: { x: 148, y: 182, z: 0, tileId: "STAIRS_RAMP", height: 0.25 }
});

const STARTER_TOWN_NAMED_NPC_LAYOUT = Object.freeze({
  "merchant:general_store": {
    spawnId: "npc:general_store_shopkeeper",
    merchantId: "general_store",
    x: 170,
    y: 239,
    z: 0,
    dialogueId: "shopkeeper"
  },
  "merchant:fletching_supplier": {
    spawnId: "npc:fletching_supplier",
    merchantId: "fletching_supplier",
    x: 183,
    y: 238,
    z: 0,
    dialogueId: "fletching_supplier"
  },
  "merchant:starter_caravan_guide": {
    spawnId: "npc:starter_caravan_guide",
    x: 223,
    y: 221,
    z: 0,
    dialogueId: "road_guide"
  },
  "merchant:east_outpost_caravan_guide": {
    spawnId: "npc:east_outpost_caravan_guide",
    x: 260,
    y: 257,
    z: 0,
    dialogueId: "outpost_guide"
  },
  "merchant:fishing_teacher": {
    spawnId: "npc:fishing_teacher",
    merchantId: "fishing_teacher",
    x: 170,
    y: 221,
    z: 0,
    dialogueId: "fishing_teacher"
  },
  "merchant:fishing_supplier": {
    spawnId: "npc:fishing_supplier",
    merchantId: "fishing_supplier",
    x: 234,
    y: 221,
    z: 0,
    dialogueId: "fishing_supplier"
  },
  "merchant:borin_ironvein": {
    spawnId: "npc:borin_ironvein",
    merchantId: "borin_ironvein",
    x: 246,
    y: 227,
    z: 0,
    dialogueId: "borin_ironvein"
  },
  "merchant:thrain_deepforge": {
    spawnId: "npc:thrain_deepforge",
    merchantId: "thrain_deepforge",
    x: 272,
    y: 257,
    z: 0,
    dialogueId: "thrain_deepforge"
  },
  "merchant:elira_gemhand": {
    spawnId: "npc:elira_gemhand",
    merchantId: "elira_gemhand",
    x: 170,
    y: 195,
    z: 0,
    dialogueId: "elira_gemhand"
  },
  "merchant:crafting_teacher": {
    spawnId: "npc:crafting_teacher",
    merchantId: "crafting_teacher",
    x: 179,
    y: 250,
    z: 0,
    dialogueId: "crafting_teacher"
  },
  "merchant:tanner_rusk": {
    spawnId: "npc:tanner_rusk",
    merchantId: "tanner_rusk",
    x: 247,
    y: 237,
    z: 0,
    dialogueId: "tanner_rusk",
    appearanceId: "tanner_rusk"
  },
  "merchant:rune_tutor": {
    spawnId: "npc:rune_tutor",
    merchantId: "rune_tutor",
    x: 218,
    y: 181,
    z: 0,
    dialogueId: "rune_tutor"
  },
  "merchant:combination_sage": {
    spawnId: "npc:combination_sage",
    merchantId: "combination_sage",
    x: 148,
    y: 181,
    z: 0,
    dialogueId: "combination_sage"
  }
});

function loadNpcDialogueCatalog(root) {
  const absPath = path.join(root, "src", "js", "content", "npc-dialogue-catalog.js");
  const sandbox = { window: {}, console };
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInNewContext(source, sandbox, { filename: absPath });
  return sandbox.window && sandbox.window.NpcDialogueCatalog ? sandbox.window.NpcDialogueCatalog : null;
}

function assertStarterTown(root) {
  const { manifestEntry, world, stamps } = loadWorldContent(root, "starter_town");
  const bootstrap = loadTsModule(path.join(root, "src", "game", "world", "bootstrap.ts"));
  const dialogueCatalog = loadNpcDialogueCatalog(root);
  const starterBootstrap = bootstrap.buildWorldBootstrapResult("starter_town");
  const npcBySpawnId = starterBootstrap && starterBootstrap.npcRegistry && starterBootstrap.npcRegistry.bySpawnId
    ? starterBootstrap.npcRegistry.bySpawnId
    : {};

  assert(manifestEntry.worldId === "starter_town", "starter_town manifest world-id mismatch");
  assert(manifestEntry.defaultSpawn.x === 205 && manifestEntry.defaultSpawn.y === 210 && manifestEntry.defaultSpawn.z === 0, "starter_town default spawn mismatch");
  assert(manifestEntry.stampIds.join(",") === STARTER_TOWN_STAMP_IDS.join(","), "starter-town stamp kit mismatch");
  assert(Object.keys(stamps).join(",") === STARTER_TOWN_STAMP_IDS.join(","), "starter-town loaded stamps should match manifest kit");
  assert(Array.isArray(world.structures) && world.structures.length === Object.keys(STARTER_TOWN_STRUCTURE_LAYOUT).length, "expected 17 starter-town structures");
  assert(Array.isArray(world.services) && world.services.length === 17, "expected 17 authored starter-town services");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.mining) && world.resourceNodes.mining.length === 114, "expected 114 authored mining nodes");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) && world.resourceNodes.woodcutting.length === 82, "expected 82 authored woodcutting nodes");
  assert(Array.isArray(world.skillRoutes.fishing) && world.skillRoutes.fishing.length === 3, "expected 3 fishing routes");
  assert(Array.isArray(world.skillRoutes.cooking) && world.skillRoutes.cooking.length === 4, "expected 4 cooking routes");
  assert(Array.isArray(world.skillRoutes.firemaking) && world.skillRoutes.firemaking.length === 5, "expected 5 firemaking routes");
  assert(Array.isArray(world.skillRoutes.mining) && world.skillRoutes.mining.length === 6, "expected 6 mining routes");
  assert(Array.isArray(world.skillRoutes.runecrafting) && world.skillRoutes.runecrafting.length === 4, "expected 4 runecrafting routes");
  assert(Array.isArray(world.skillRoutes.woodcutting) && world.skillRoutes.woodcutting.length === 5, "expected 5 woodcutting routes");
  assert(Array.isArray(world.combatSpawns) && world.combatSpawns.length === 50, "expected 50 authored starter-town combat spawns");
  assert(Array.isArray(world.landmarks.staircases) && world.landmarks.staircases.length === Object.keys(STARTER_TOWN_STAIRCASE_LAYOUT).length, "starter-town staircase landmark count mismatch");
  assert(Array.isArray(world.landmarks.altars) && world.landmarks.altars.length === 4, "expected 4 authored altars");
  assert(Array.isArray(world.landmarks.showcaseTrees) && world.landmarks.showcaseTrees.length === 5, "expected 5 showcase trees");
  assert(
    world.services.filter((entry) => entry.type === "MERCHANT" && entry.name).length === Object.keys(STARTER_TOWN_NAMED_NPC_LAYOUT).length,
    "starter-town named NPC service count mismatch"
  );

  const structureById = Object.fromEntries(world.structures.map((entry) => [entry.structureId, entry]));
  Object.entries(STARTER_TOWN_STRUCTURE_LAYOUT).forEach(([structureId, expected]) => {
    const structure = structureById[structureId];
    assert(!!structure, `starter-town structure missing: ${structureId}`);
    assert(structure.stampId === expected.stampId, `${structureId} stamp mismatch`);
    assert(structure.x === expected.x && structure.y === expected.y && structure.z === expected.z, `${structureId} placement mismatch`);
  });
  const staircaseById = Object.fromEntries(world.landmarks.staircases.map((entry) => [entry.landmarkId, entry]));
  Object.entries(STARTER_TOWN_STAIRCASE_LAYOUT).forEach(([landmarkId, expected]) => {
    const staircase = staircaseById[landmarkId];
    assert(!!staircase, `starter-town staircase missing: ${landmarkId}`);
    assert(Array.isArray(staircase.tiles) && staircase.tiles.length > 0, `${landmarkId} should define staircase tiles`);
    const firstTile = staircase.tiles[0];
    assert(firstTile.x === expected.x && firstTile.y === expected.y && firstTile.z === expected.z, `${landmarkId} first tile placement mismatch`);
    assert(firstTile.tileId === expected.tileId, `${landmarkId} first tile type mismatch`);
    assert(firstTile.height === expected.height, `${landmarkId} first tile height mismatch`);
  });

  const fishingById = Object.fromEntries(world.skillRoutes.fishing.map((entry) => [entry.routeId, entry]));
  assert(fishingById.castle_pond_bank.alias === "pond", "pond alias mismatch");
  assert(fishingById.castle_pond_pier.x === 205 && fishingById.castle_pond_pier.y === 230, "pier route mismatch");
  assert(fishingById.castle_pond_deep_edge.y === 231, "deep fishing route mismatch");

  const cookingById = Object.fromEntries(world.skillRoutes.cooking.map((entry) => [entry.routeId, entry]));
  assert(cookingById.starter_campfire.x === 199 && cookingById.starter_campfire.y === 224, "campfire anchor mismatch");
  assert(cookingById.riverbank_fire_line.fireTiles.length === 3, "river fire line tile count mismatch");
  assert(cookingById.deep_water_dock_fire_line.x === 205 && cookingById.deep_water_dock_fire_line.y === 229, "deep dock anchor mismatch");
  const firemakingById = Object.fromEntries(world.skillRoutes.firemaking.map((entry) => [entry.routeId, entry]));
  assert(firemakingById.starter_fire_lane.alias === "starter", "starter firemaking alias mismatch");
  assert(firemakingById.oak_fire_lane.x === 205 && firemakingById.oak_fire_lane.y === 299, "oak fire lane anchor mismatch");
  assert(firemakingById.willow_fire_lane.x === 239 && firemakingById.willow_fire_lane.y === 62, "willow fire lane anchor mismatch");
  assert(firemakingById.maple_fire_lane.x === 402 && firemakingById.maple_fire_lane.y === 206, "maple fire lane anchor mismatch");
  assert(firemakingById.yew_fire_lane.x === 51 && firemakingById.yew_fire_lane.y === 8, "yew fire lane anchor mismatch");

  const servicesById = Object.fromEntries(world.services.map((entry) => [entry.serviceId, entry]));
  assert(dialogueCatalog && typeof dialogueCatalog.resolveDialogueId === "function", "npc dialogue catalog resolver missing");
  assert(servicesById["merchant:starter_caravan_guide"].travelToWorldId === "starter_town", "starter caravan travel target mismatch");
  assert(servicesById["merchant:starter_caravan_guide"].travelSpawn.x === 364 && servicesById["merchant:starter_caravan_guide"].travelSpawn.y === 262, "starter caravan travel spawn mismatch");
  assert(servicesById["merchant:east_outpost_caravan_guide"].travelToWorldId === "starter_town", "east outpost caravan travel target mismatch");
  assert(servicesById["merchant:east_outpost_caravan_guide"].travelSpawn.x === 205 && servicesById["merchant:east_outpost_caravan_guide"].travelSpawn.y === 210, "east outpost caravan travel spawn mismatch");
  assert(servicesById["station:starter_furnace"].footprintW === 2, "furnace footprint mismatch");
  assert(servicesById["station:east_outpost_furnace"].x === 374 && servicesById["station:east_outpost_furnace"].y === 254, "east outpost furnace placement mismatch");
  assert(servicesById["station:east_outpost_anvil"].x === 374 && servicesById["station:east_outpost_anvil"].y === 257, "east outpost anvil placement mismatch");
  Object.entries(STARTER_TOWN_NAMED_NPC_LAYOUT).forEach(([serviceId, expected]) => {
    const service = servicesById[serviceId];
    assert(!!service, `starter-town named NPC service missing: ${serviceId}`);
    assert(service.spawnId === expected.spawnId, `${serviceId} spawnId mismatch`);
    assert(service.x === expected.x && service.y === expected.y && service.z === expected.z, `${serviceId} authored placement mismatch`);
    if (Object.prototype.hasOwnProperty.call(expected, "merchantId")) {
      assert(service.merchantId === expected.merchantId, `${serviceId} merchant binding mismatch`);
    }
    const dialogueId = typeof service.dialogueId === "string" ? service.dialogueId.trim() : "";
    assert(dialogueId === expected.dialogueId, `${serviceId} dialogueId mismatch`);
    assert(dialogueCatalog.resolveDialogueId(dialogueId) === expected.dialogueId, `${serviceId} dialogueId should resolve to ${expected.dialogueId}`);
    if (Object.prototype.hasOwnProperty.call(expected, "appearanceId")) {
      assert(service.appearanceId === expected.appearanceId, `${serviceId} appearanceId mismatch`);
    }
    const npc = npcBySpawnId[expected.spawnId];
    assert(!!npc, `${serviceId} should publish a runtime NPC descriptor`);
    assert(String(npc.dialogueId || "").trim() === dialogueId, `${serviceId} runtime NPC should preserve dialogueId`);
    if (Object.prototype.hasOwnProperty.call(expected, "appearanceId")) {
      assert(npc.appearanceId === expected.appearanceId, `${serviceId} runtime NPC appearanceId mismatch`);
    }
  });
  assert(Object.keys(npcBySpawnId).length === Object.keys(STARTER_TOWN_NAMED_NPC_LAYOUT).length, "starter-town runtime NPC registry count mismatch");

  const combatSpawnsById = Object.fromEntries(world.combatSpawns.map((entry) => [entry.spawnNodeId, entry]));
  assert(
    world.combatSpawns.map((entry) => entry.spawnNodeId).join(",") ===
      "enemy_spawn_training_dummy_hub,enemy_spawn_rat_south_field,enemy_spawn_chicken_south_field,enemy_spawn_goblin_east_path,enemy_spawn_goblin_east_field_north,enemy_spawn_goblin_east_field_center,enemy_spawn_goblin_east_field_south,enemy_spawn_boar_east_field_west,enemy_spawn_boar_east_field_center,enemy_spawn_boar_east_field_east,enemy_spawn_boar_outer_west_north,enemy_spawn_boar_outer_west_south,enemy_spawn_boar_outer_east_north,enemy_spawn_wolf_outer_northwest,enemy_spawn_wolf_outer_north,enemy_spawn_wolf_outer_northeast,enemy_spawn_wolf_outer_southwest_1,enemy_spawn_wolf_outer_southwest_2,enemy_spawn_wolf_outer_southwest_3,enemy_spawn_wolf_outer_south_1,enemy_spawn_wolf_outer_south_2,enemy_spawn_wolf_outer_south_3,enemy_spawn_wolf_outer_southeast_1,enemy_spawn_wolf_outer_southeast_2,enemy_spawn_wolf_outer_southeast_3,enemy_spawn_goblin_far_south_1,enemy_spawn_goblin_far_south_2,enemy_spawn_goblin_far_south_3,enemy_spawn_goblin_far_south_4,enemy_spawn_goblin_far_east_1,enemy_spawn_goblin_far_east_2,enemy_spawn_goblin_far_east_3,enemy_spawn_goblin_far_east_4,enemy_spawn_rat_outer_southwest_1,enemy_spawn_rat_outer_southwest_2,enemy_spawn_rat_outer_southwest_3,enemy_spawn_rat_outer_southwest_4,enemy_spawn_chicken_outer_south_1,enemy_spawn_chicken_outer_south_2,enemy_spawn_chicken_outer_south_3,enemy_spawn_chicken_outer_south_4,enemy_spawn_chicken_outer_south_5,enemy_spawn_chicken_outer_southeast_1,enemy_spawn_chicken_outer_southeast_2,enemy_spawn_chicken_outer_southeast_3,enemy_spawn_chicken_outer_southeast_4,enemy_spawn_chicken_outer_southeast_5,enemy_spawn_guard_east_outpost_northwest,enemy_spawn_guard_east_outpost_north,enemy_spawn_guard_east_outpost_northeast",
    "starter combat spawn order mismatch"
  );
  assert(combatSpawnsById["enemy_spawn_training_dummy_hub"].spawnTile.x === 210 && combatSpawnsById["enemy_spawn_training_dummy_hub"].spawnTile.y === 211, "training dummy combat spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_rat_south_field"].spawnTile.x === 194 && combatSpawnsById["enemy_spawn_rat_south_field"].spawnTile.y === 220, "rat combat spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_chicken_south_field"].spawnTile.x === 190 && combatSpawnsById["enemy_spawn_chicken_south_field"].spawnTile.y === 228, "chicken combat spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_goblin_east_path"].spawnTile.x === 240 && combatSpawnsById["enemy_spawn_goblin_east_path"].spawnTile.y === 200, "goblin combat spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_goblin_east_field_north"].spawnTile.x === 276 && combatSpawnsById["enemy_spawn_goblin_east_field_north"].spawnTile.y === 188, "east-field north goblin spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_goblin_east_field_center"].spawnTile.x === 295 && combatSpawnsById["enemy_spawn_goblin_east_field_center"].spawnTile.y === 206, "east-field center goblin spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_goblin_east_field_south"].spawnTile.x === 278 && combatSpawnsById["enemy_spawn_goblin_east_field_south"].spawnTile.y === 226, "east-field south goblin spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_boar_east_field_west"].spawnTile.x === 326 && combatSpawnsById["enemy_spawn_boar_east_field_west"].spawnTile.y === 244, "east-field west boar spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_boar_east_field_center"].spawnTile.x === 334 && combatSpawnsById["enemy_spawn_boar_east_field_center"].spawnTile.y === 256, "east-field center boar spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_boar_east_field_east"].spawnTile.x === 342 && combatSpawnsById["enemy_spawn_boar_east_field_east"].spawnTile.y === 248, "east-field east boar spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_boar_outer_west_north"].spawnTile.x === 44 && combatSpawnsById["enemy_spawn_boar_outer_west_north"].spawnTile.y === 128, "outer west north boar spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_boar_outer_west_south"].spawnTile.x === 56 && combatSpawnsById["enemy_spawn_boar_outer_west_south"].spawnTile.y === 468, "outer west south boar spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_boar_outer_east_north"].spawnTile.x === 468 && combatSpawnsById["enemy_spawn_boar_outer_east_north"].spawnTile.y === 132, "outer east north boar spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_wolf_outer_northwest"].spawnTile.x === 60 && combatSpawnsById["enemy_spawn_wolf_outer_northwest"].spawnTile.y === 70, "outer northwest wolf spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_wolf_outer_north"].spawnTile.x === 72 && combatSpawnsById["enemy_spawn_wolf_outer_north"].spawnTile.y === 82, "outer north wolf spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_wolf_outer_northeast"].spawnTile.x === 84 && combatSpawnsById["enemy_spawn_wolf_outer_northeast"].spawnTile.y === 96, "outer northeast wolf spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_wolf_outer_southwest_1"].spawnTile.x === 20 && combatSpawnsById["enemy_spawn_wolf_outer_southwest_1"].spawnTile.y === 420, "outer southwest wolf cluster lead mismatch");
  assert(combatSpawnsById["enemy_spawn_wolf_outer_south_2"].spawnTile.x === 164 && combatSpawnsById["enemy_spawn_wolf_outer_south_2"].spawnTile.y === 420, "outer south wolf cluster midpoint mismatch");
  assert(combatSpawnsById["enemy_spawn_wolf_outer_southeast_3"].spawnTile.x === 436 && combatSpawnsById["enemy_spawn_wolf_outer_southeast_3"].spawnTile.y === 420, "outer southeast wolf cluster tail mismatch");
  assert(combatSpawnsById["enemy_spawn_goblin_far_south_4"].spawnTile.x === 288 && combatSpawnsById["enemy_spawn_goblin_far_south_4"].spawnTile.y === 428, "far south goblin cluster mismatch");
  assert(combatSpawnsById["enemy_spawn_goblin_far_east_4"].spawnTile.x === 428 && combatSpawnsById["enemy_spawn_goblin_far_east_4"].spawnTile.y === 328, "far east goblin cluster mismatch");
  assert(combatSpawnsById["enemy_spawn_rat_outer_southwest_3"].spawnTile.x === 100 && combatSpawnsById["enemy_spawn_rat_outer_southwest_3"].spawnTile.y === 408, "outer southwest rat cluster mismatch");
  assert(combatSpawnsById["enemy_spawn_chicken_outer_south_5"].spawnTile.x === 256 && combatSpawnsById["enemy_spawn_chicken_outer_south_5"].spawnTile.y === 452, "outer south chicken cluster mismatch");
  assert(combatSpawnsById["enemy_spawn_chicken_outer_southeast_5"].spawnTile.x === 360 && combatSpawnsById["enemy_spawn_chicken_outer_southeast_5"].spawnTile.y === 452, "outer southeast chicken cluster mismatch");
  assert(combatSpawnsById["enemy_spawn_guard_east_outpost_northwest"].spawnTile.x === 361 && combatSpawnsById["enemy_spawn_guard_east_outpost_northwest"].spawnTile.y === 248, "northwest guard combat spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_guard_east_outpost_north"].spawnTile.x === 364 && combatSpawnsById["enemy_spawn_guard_east_outpost_north"].spawnTile.y === 246, "north guard combat spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_guard_east_outpost_northeast"].spawnTile.x === 367 && combatSpawnsById["enemy_spawn_guard_east_outpost_northeast"].spawnTile.y === 248, "northeast guard combat spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_guard_east_outpost_north"].roamingRadiusOverride === 5, "starter guard roaming radius mismatch");

  const miningIds = world.skillRoutes.mining.map((entry) => entry.routeId).join(",");
  assert(miningIds === "starter_mine,iron_mine,coal_mine,precious_mine,gem_mine,rune_essence_mine", "starter mining route order mismatch");
  const altarIds = world.skillRoutes.runecrafting.map((entry) => entry.routeId).join(",");
  assert(altarIds === "ember_altar,water_altar,earth_altar,air_altar", "starter runecrafting route order mismatch");
  const firemakingIds = world.skillRoutes.firemaking.map((entry) => entry.routeId).join(",");
  assert(firemakingIds === "starter_fire_lane,oak_fire_lane,willow_fire_lane,maple_fire_lane,yew_fire_lane", "starter firemaking route order mismatch");
  const woodcuttingIds = world.skillRoutes.woodcutting.map((entry) => entry.routeId).join(",");
  assert(woodcuttingIds === "starter_grove,oak_path,willow_bend,maple_ridge,yew_frontier", "starter woodcutting route order mismatch");

  const showcase = world.landmarks.showcaseTrees.map((entry) => `${entry.nodeId}@${entry.x},${entry.y}`).join("|");
  assert(
    showcase === "normal_tree@179,219|oak_tree@192,219|willow_tree@205,219|maple_tree@218,219|yew_tree@231,219",
    "starter showcase tree placements mismatch"
  );
}

function assertNorthRoadCamp(root) {
  const { manifestEntry, world, stamps } = loadWorldContent(root, "north_road_camp");

  assert(manifestEntry.worldId === "north_road_camp", "north_road_camp manifest world-id mismatch");
  assert(manifestEntry.defaultSpawn.x === 204 && manifestEntry.defaultSpawn.y === 216 && manifestEntry.defaultSpawn.z === 0, "north_road_camp default spawn mismatch");
  assert(Object.keys(stamps).length === 1, "expected 1 north-road stamp");
  assert(Array.isArray(world.structures) && world.structures.length === 1, "expected 1 north-road structure");
  assert(Array.isArray(world.services) && world.services.length === 6, "expected 6 north-road services");
  assert(Array.isArray(world.skillRoutes.fishing) && world.skillRoutes.fishing.length === 1, "expected 1 north-road fishing route");
  assert(Array.isArray(world.skillRoutes.cooking) && world.skillRoutes.cooking.length === 1, "expected 1 north-road cooking route");
  assert(Array.isArray(world.skillRoutes.firemaking) && world.skillRoutes.firemaking.length === 1, "expected 1 north-road firemaking route");
  assert(Array.isArray(world.skillRoutes.mining) && world.skillRoutes.mining.length === 2, "expected 2 north-road mining routes");
  assert(Array.isArray(world.skillRoutes.runecrafting) && world.skillRoutes.runecrafting.length === 1, "expected 1 north-road runecrafting route");
  assert(Array.isArray(world.skillRoutes.woodcutting) && world.skillRoutes.woodcutting.length === 1, "expected 1 north-road woodcutting route");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.mining) && world.resourceNodes.mining.length === 12, "expected 12 north-road mining nodes");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) && world.resourceNodes.woodcutting.length === 6, "expected 6 north-road woodcutting nodes");
  assert(Array.isArray(world.combatSpawns) && world.combatSpawns.length === 25, "expected 25 north-road combat spawns");
  assert(Array.isArray(world.landmarks.altars) && world.landmarks.altars.length === 1, "expected 1 north-road altar");
  assert(Array.isArray(world.landmarks.showcaseTrees) && world.landmarks.showcaseTrees.length === 2, "expected 2 north-road showcase trees");

  const structure = world.structures[0];
  assert(structure.structureId === "north_road_outpost" && structure.x === 200 && structure.y === 206, "north-road outpost placement mismatch");

  const combatSpawnsById = Object.fromEntries(world.combatSpawns.map((entry) => [entry.spawnNodeId, entry]));
  assert(
    world.combatSpawns.map((entry) => entry.spawnNodeId).join(",") ===
      "enemy_spawn_rat_north_road_verge_west,enemy_spawn_rat_north_road_verge_east,enemy_spawn_goblin_north_road_lane_west,enemy_spawn_goblin_north_road_lane_east,enemy_spawn_goblin_north_road_far_west,enemy_spawn_goblin_north_road_far_mid,enemy_spawn_goblin_north_road_far_east,enemy_spawn_boar_north_road_outer_west,enemy_spawn_boar_north_road_outer_east,enemy_spawn_boar_north_road_far_northwest,enemy_spawn_boar_north_road_far_southwest,enemy_spawn_boar_north_road_far_east,enemy_spawn_wolf_north_road_outer_north,enemy_spawn_wolf_north_road_outer_south,enemy_spawn_wolf_north_road_far_east_north_1,enemy_spawn_wolf_north_road_far_east_north_2,enemy_spawn_wolf_north_road_far_east_north_3,enemy_spawn_wolf_north_road_far_east_south_1,enemy_spawn_wolf_north_road_far_east_south_2,enemy_spawn_wolf_north_road_far_east_south_3,enemy_spawn_goblin_north_road_far_east_1,enemy_spawn_goblin_north_road_far_east_2,enemy_spawn_goblin_north_road_far_east_3,enemy_spawn_goblin_north_road_far_east_4,enemy_spawn_guard_north_road_threshold",
    "north-road combat spawn order mismatch"
  );
  assert(combatSpawnsById.enemy_spawn_rat_north_road_verge_west.spawnTile.x === 223 && combatSpawnsById.enemy_spawn_rat_north_road_verge_west.spawnTile.y === 205, "north-road passive west spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_rat_north_road_verge_east.spawnTile.x === 225 && combatSpawnsById.enemy_spawn_rat_north_road_verge_east.spawnTile.y === 209, "north-road passive east spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_goblin_north_road_lane_west.spawnTile.x === 231 && combatSpawnsById.enemy_spawn_goblin_north_road_lane_west.spawnTile.y === 205, "north-road aggressive west spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_goblin_north_road_lane_east.spawnTile.x === 236 && combatSpawnsById.enemy_spawn_goblin_north_road_lane_east.spawnTile.y === 209, "north-road aggressive east spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_goblin_north_road_far_west.spawnTile.x === 243 && combatSpawnsById.enemy_spawn_goblin_north_road_far_west.spawnTile.y === 202, "north-road far-west goblin spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_goblin_north_road_far_mid.spawnTile.x === 250 && combatSpawnsById.enemy_spawn_goblin_north_road_far_mid.spawnTile.y === 214, "north-road far-mid goblin spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_goblin_north_road_far_east.spawnTile.x === 258 && combatSpawnsById.enemy_spawn_goblin_north_road_far_east.spawnTile.y === 206, "north-road far-east goblin spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_boar_north_road_outer_west.spawnTile.x === 286 && combatSpawnsById.enemy_spawn_boar_north_road_outer_west.spawnTile.y === 185, "north-road boar west spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_boar_north_road_outer_east.spawnTile.x === 294 && combatSpawnsById.enemy_spawn_boar_north_road_outer_east.spawnTile.y === 194, "north-road boar east spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_boar_north_road_far_northwest.spawnTile.x === 344 && combatSpawnsById.enemy_spawn_boar_north_road_far_northwest.spawnTile.y === 88, "north-road far northwest boar spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_boar_north_road_far_southwest.spawnTile.x === 90 && combatSpawnsById.enemy_spawn_boar_north_road_far_southwest.spawnTile.y === 485, "north-road far southwest boar spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_boar_north_road_far_east.spawnTile.x === 458 && combatSpawnsById.enemy_spawn_boar_north_road_far_east.spawnTile.y === 196, "north-road far east boar spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_wolf_north_road_outer_north.spawnTile.x === 304 && combatSpawnsById.enemy_spawn_wolf_north_road_outer_north.spawnTile.y === 208, "north-road wolf north spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_wolf_north_road_outer_south.spawnTile.x === 312 && combatSpawnsById.enemy_spawn_wolf_north_road_outer_south.spawnTile.y === 224, "north-road wolf south spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_wolf_north_road_far_east_north_3.spawnTile.x === 476 && combatSpawnsById.enemy_spawn_wolf_north_road_far_east_north_3.spawnTile.y === 112, "north-road far east north wolf cluster mismatch");
  assert(combatSpawnsById.enemy_spawn_wolf_north_road_far_east_south_3.spawnTile.x === 476 && combatSpawnsById.enemy_spawn_wolf_north_road_far_east_south_3.spawnTile.y === 296, "north-road far east south wolf cluster mismatch");
  assert(combatSpawnsById.enemy_spawn_goblin_north_road_far_east_4.spawnTile.x === 428 && combatSpawnsById.enemy_spawn_goblin_north_road_far_east_4.spawnTile.y === 216, "north-road far east goblin cluster mismatch");
  assert(combatSpawnsById.enemy_spawn_guard_north_road_threshold.spawnTile.x === 236 && combatSpawnsById.enemy_spawn_guard_north_road_threshold.spawnTile.y === 220, "north-road threshold guard spawn mismatch");
  assert(combatSpawnsById.enemy_spawn_guard_north_road_threshold.roamingRadiusOverride === 3, "north-road threshold guard roaming mismatch");

  const servicesById = Object.fromEntries(world.services.map((entry) => [entry.serviceId, entry]));
  assert(servicesById["merchant:north_road_shopkeeper"].x === 203 && servicesById["merchant:north_road_shopkeeper"].y === 209, "north-road shopkeeper placement mismatch");
  assert(servicesById["merchant:north_road_caravan_guide"].travelToWorldId === "starter_town", "north-road caravan travel target mismatch");
  assert(servicesById["merchant:prospector_dain"].merchantId === "borin_ironvein", "north-road prospector merchant mismatch");
  assert(servicesById["merchant:advanced_fletcher"].merchantId === "advanced_fletcher", "north-road advanced fletcher merchant mismatch");
  assert(servicesById["merchant:advanced_fletcher"].x === 207 && servicesById["merchant:advanced_fletcher"].y === 210, "north-road advanced fletcher placement mismatch");
  assert(servicesById["merchant:advanced_fletcher"].dialogueId === "advanced_fletcher", "north-road advanced fletcher dialogue mismatch");
  assert(servicesById["station:north_road_furnace"].footprintW === 2 && servicesById["station:north_road_furnace"].footprintD === 2, "north-road furnace footprint mismatch");

  const miningIds = world.skillRoutes.mining.map((entry) => entry.routeId).join(",");
  assert(miningIds === "outpost_quarry,crystal_seam", "north-road mining route order mismatch");
  const altarIds = world.skillRoutes.runecrafting.map((entry) => entry.routeId).join(",");
  assert(altarIds === "breeze_shrine", "north-road runecrafting route order mismatch");
  const firemakingIds = world.skillRoutes.firemaking.map((entry) => entry.routeId).join(",");
  assert(firemakingIds === "pine_fire_lane", "north-road firemaking route order mismatch");
  const woodcuttingIds = world.skillRoutes.woodcutting.map((entry) => entry.routeId).join(",");
  assert(woodcuttingIds === "pine_loop", "north-road woodcutting route order mismatch");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  assertStarterTown(root);
  assertNorthRoadCamp(root);
  console.log("World bootstrap parity checks passed for starter_town and north_road_camp.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
