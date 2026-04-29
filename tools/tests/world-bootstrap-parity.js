const fs = require("fs");
const path = require("path");
const { buildWorldGameplayMap } = require("../content/world-map-builder");
const { findShortestPathLength, isWalkable } = require("../content/world-pathing");
const { loadWorldContent } = require("../content/world-content");
const { loadTsModule } = require("../lib/ts-module-loader");
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
  "merchant:advanced_fletcher": {
    spawnId: "npc:advanced_fletcher",
    merchantId: "advanced_fletcher",
    x: 365,
    y: 253,
    z: 0,
    dialogueId: "advanced_fletcher"
  },
  "merchant:advanced_woodsman": {
    spawnId: "npc:advanced_woodsman",
    merchantId: "advanced_woodsman",
    x: 366,
    y: 255,
    z: 0,
    dialogueId: "advanced_woodsman"
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
  "merchant:forester_teacher": {
    spawnId: "npc:forester_teacher",
    merchantId: "forester_teacher",
    x: 219,
    y: 205,
    z: 0,
    dialogueId: "forester_teacher"
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

const TREE_VISUAL_NODE_IDS = Object.freeze(["normal_tree", "oak_tree", "willow_tree", "maple_tree", "yew_tree"]);
const ROCK_VISUAL_NODE_IDS = Object.freeze([
  "clay",
  "copper",
  "tin",
  "iron",
  "coal",
  "silver",
  "sapphire",
  "gold",
  "emerald",
  "rune_essence",
  "depleted"
]);

function extractObjectLiteralAfter(source, token, label) {
  const tokenIndex = source.indexOf(token);
  assert(tokenIndex >= 0, `${label} declaration missing`);
  const objectStart = source.indexOf("{", tokenIndex);
  assert(objectStart >= 0, `${label} object literal missing`);
  let depth = 0;
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(objectStart, index + 1);
  }
  throw new Error(`${label} object literal was not closed`);
}

function loadTreeVisualProfiles(root) {
  const absPath = path.join(root, "src", "js", "world.js");
  const source = fs.readFileSync(absPath, "utf8");
  const objectLiteral = extractObjectLiteralAfter(source, "const TREE_VISUAL_PROFILES =", "TREE_VISUAL_PROFILES");
  return {
    profiles: vm.runInNewContext(`(${objectLiteral})`, {}, { filename: "TREE_VISUAL_PROFILES" }),
    source
  };
}

function loadRockVisualProfiles(root) {
  const absPath = path.join(root, "src", "js", "world.js");
  const source = fs.readFileSync(absPath, "utf8");
  const objectLiteral = extractObjectLiteralAfter(source, "const ROCK_VISUAL_PROFILES =", "ROCK_VISUAL_PROFILES");
  return {
    profiles: vm.runInNewContext(`(${objectLiteral})`, {}, { filename: "ROCK_VISUAL_PROFILES" }),
    source
  };
}

function treeVisualSignature(profile) {
  return JSON.stringify({
    trunkScale: profile.trunkScale,
    canopyScales: profile.canopyScales,
    canopyYOffset: profile.canopyYOffset,
    canopyOffsets: profile.canopyOffsets || [],
    branchScale: profile.branchScale || [],
    branch2Scale: profile.branch2Scale || [],
    branch3Scale: profile.branch3Scale || [],
    drapeScales: profile.drapeScales || [],
    stumpScale: profile.stumpScale
  });
}

function assertTreeVisualProfiles(root) {
  const { profiles, source } = loadTreeVisualProfiles(root);
  const profileIds = Object.keys(profiles).sort().join(",");
  assert(profileIds === TREE_VISUAL_NODE_IDS.slice().sort().join(","), "world.js should define one tree visual profile per woodcutting node type");

  const signatures = new Set(TREE_VISUAL_NODE_IDS.map((nodeId) => treeVisualSignature(profiles[nodeId])));
  assert(signatures.size === TREE_VISUAL_NODE_IDS.length, "tree visual profiles should not collapse to shared silhouettes");
  assert(JSON.stringify(profiles.normal_tree.branchScale) === "[0,0,0]", "normal trees should remain the simple baseline profile");
  assert(profiles.oak_tree.trunkScale[0] > profiles.normal_tree.trunkScale[0], "oak trees should keep a broader trunk than normal trees");
  assert(Array.isArray(profiles.willow_tree.drapeScales) && profiles.willow_tree.drapeScales.length === 8, "willow trees should keep dedicated hanging drape meshes");
  assert(profiles.maple_tree.canopyScales[0][0] > profiles.oak_tree.canopyScales[0][0], "maple trees should keep the broadest crown profile");
  assert(profiles.yew_tree.trunkScale[1] > profiles.willow_tree.trunkScale[1], "yew trees should keep the tallest trunk profile");
  assert(profiles.yew_tree.canopyScales[3][0] < profiles.willow_tree.canopyScales[3][0], "yew trees should keep the tight stacked top profile");
  assert(source.includes("const treeNodeId = treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree';"), "tree rendering should resolve a node-specific visual id");
  assert(source.includes("setTreeVisualState(tData, tIdx, {") && source.includes("nodeId: treeNodeId"), "tree rendering should feed the node id into the visual profile path");
}

function rockVisualSignature(profile) {
  return JSON.stringify({
    geometryKey: profile.geometryKey,
    materialKey: profile.materialKey,
    instanceScale: profile.instanceScale,
    silhouette: profile.silhouette
  });
}

function assertRockVisualProfiles(root) {
  const { profiles, source } = loadRockVisualProfiles(root);
  const profileIds = Object.keys(profiles).sort().join(",");
  assert(profileIds === ROCK_VISUAL_NODE_IDS.slice().sort().join(","), "world.js should define one rock visual profile per mining node type plus depleted state");

  const signatures = new Set(ROCK_VISUAL_NODE_IDS.map((nodeId) => rockVisualSignature(profiles[nodeId])));
  assert(signatures.size === ROCK_VISUAL_NODE_IDS.length, "rock visual profiles should not collapse to shared silhouettes");
  assert(profiles.clay.geometryKey === "rockClay", "clay should keep its low mound geometry");
  assert(profiles.iron.geometryKey === "rockIron", "iron should keep a blocky slab geometry");
  assert(profiles.coal.geometryKey === "rockCoal", "coal should keep a jagged shard geometry");
  assert(profiles.sapphire.geometryKey === "rockSapphire", "sapphire should keep a dedicated crystal geometry");
  assert(profiles.emerald.geometryKey === "rockEmerald", "emerald should keep a dedicated crystal geometry");
  assert(profiles.sapphire.instanceScale[1] < profiles.emerald.instanceScale[1], "emerald should stay taller/narrower than sapphire");
  assert(profiles.rune_essence.geometryKey === "rockRuneEssence", "rune essence should keep the large persistent boulder geometry");
  assert(profiles.depleted.geometryKey === "rockDepleted", "depleted rocks should keep a separate depleted mesh");
  assert(source.includes("const ROCK_VISUAL_ORDER = Object.freeze(["), "rock rendering should keep stable visual mesh order");
  assert(source.includes("getRockVisualIdForNode(rockNode") && source.includes("rockVisualCounts[visualId]"), "rock rendering should bucket counts by visual profile");
  assert(source.includes("rData.rockMeshByVisualId[visualId]") && source.includes("rData.rockMapByVisualId[visualId]"), "rock rendering should create per-profile instanced meshes with interaction maps");
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
  assert(Array.isArray(world.services) && world.services.length === 20, "expected 20 authored starter-town services");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.mining) && world.resourceNodes.mining.length === 114, "expected 114 authored mining nodes");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) && world.resourceNodes.woodcutting.length === 82, "expected 82 authored woodcutting nodes");
  assert(Array.isArray(world.skillRoutes.fishing) && world.skillRoutes.fishing.length === 3, "expected 3 fishing routes");
  assert(Array.isArray(world.skillRoutes.cooking) && world.skillRoutes.cooking.length === 4, "expected 4 cooking routes");
  assert(Array.isArray(world.skillRoutes.firemaking) && world.skillRoutes.firemaking.length === 5, "expected 5 firemaking routes");
  assert(Array.isArray(world.skillRoutes.mining) && world.skillRoutes.mining.length === 6, "expected 6 mining routes");
  assert(Array.isArray(world.skillRoutes.runecrafting) && world.skillRoutes.runecrafting.length === 4, "expected 4 runecrafting routes");
  assert(Array.isArray(world.skillRoutes.woodcutting) && world.skillRoutes.woodcutting.length === 5, "expected 5 woodcutting routes");
  assert(Array.isArray(world.combatSpawns) && world.combatSpawns.length === 53, "expected 53 authored starter-town combat spawns");
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
      "enemy_spawn_training_dummy_hub,enemy_spawn_rat_south_field,enemy_spawn_chicken_south_field,enemy_spawn_goblin_east_path,enemy_spawn_goblin_east_field_north,enemy_spawn_goblin_east_field_center,enemy_spawn_goblin_east_field_south,enemy_spawn_boar_east_field_west,enemy_spawn_boar_east_field_center,enemy_spawn_boar_east_field_east,enemy_spawn_boar_outer_west_north,enemy_spawn_boar_outer_west_south,enemy_spawn_boar_outer_east_north,enemy_spawn_wolf_outer_northwest,enemy_spawn_wolf_outer_north,enemy_spawn_wolf_outer_northeast,enemy_spawn_wolf_outer_southwest_1,enemy_spawn_wolf_outer_southwest_2,enemy_spawn_wolf_outer_southwest_3,enemy_spawn_wolf_outer_south_1,enemy_spawn_wolf_outer_south_2,enemy_spawn_wolf_outer_south_3,enemy_spawn_wolf_outer_southeast_1,enemy_spawn_wolf_outer_southeast_2,enemy_spawn_wolf_outer_southeast_3,enemy_spawn_goblin_far_south_1,enemy_spawn_goblin_far_south_2,enemy_spawn_goblin_far_south_3,enemy_spawn_goblin_far_south_4,enemy_spawn_goblin_far_east_1,enemy_spawn_goblin_far_east_2,enemy_spawn_goblin_far_east_3,enemy_spawn_goblin_far_east_4,enemy_spawn_rat_outer_southwest_1,enemy_spawn_rat_outer_southwest_2,enemy_spawn_rat_outer_southwest_3,enemy_spawn_rat_outer_southwest_4,enemy_spawn_chicken_outer_south_1,enemy_spawn_chicken_outer_south_2,enemy_spawn_chicken_outer_south_3,enemy_spawn_chicken_outer_south_4,enemy_spawn_chicken_outer_south_5,enemy_spawn_chicken_outer_southeast_1,enemy_spawn_chicken_outer_southeast_2,enemy_spawn_chicken_outer_southeast_3,enemy_spawn_chicken_outer_southeast_4,enemy_spawn_chicken_outer_southeast_5,enemy_spawn_guard_east_outpost_northwest,enemy_spawn_guard_east_outpost_north,enemy_spawn_guard_east_outpost_northeast,enemy_spawn_bear_southeast_camp_west,enemy_spawn_heavy_brute_southeast_camp_anchor,enemy_spawn_fast_striker_southeast_camp_east",
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
  assert(combatSpawnsById["enemy_spawn_bear_southeast_camp_west"].spawnTile.x === 444 && combatSpawnsById["enemy_spawn_bear_southeast_camp_west"].spawnTile.y === 468, "southeast camp bear spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_heavy_brute_southeast_camp_anchor"].spawnTile.x === 450 && combatSpawnsById["enemy_spawn_heavy_brute_southeast_camp_anchor"].spawnTile.y === 456, "southeast camp brute anchor mismatch");
  assert(combatSpawnsById["enemy_spawn_fast_striker_southeast_camp_east"].spawnTile.x === 456 && combatSpawnsById["enemy_spawn_fast_striker_southeast_camp_east"].spawnTile.y === 468, "southeast camp striker spawn mismatch");
  assert(combatSpawnsById["enemy_spawn_fast_striker_southeast_camp_east"].spawnGroupId === "camp_southeast_ruins", "southeast camp spawn group mismatch");

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

function assertTutorialIsland(root) {
  const { manifestEntry, world } = loadWorldContent(root, "tutorial_island");
  const bootstrap = loadTsModule(path.join(root, "src", "game", "world", "bootstrap.ts"));
  const dialogueCatalog = loadNpcDialogueCatalog(root);
  const tutorialBootstrap = bootstrap.buildWorldBootstrapResult("tutorial_island");

  assert(manifestEntry.worldId === "tutorial_island", "tutorial_island manifest world-id mismatch");
  assert(manifestEntry.defaultSpawn.x === 118 && manifestEntry.defaultSpawn.y === 118 && manifestEntry.defaultSpawn.z === 0, "tutorial_island default spawn mismatch");
  assert(Array.isArray(manifestEntry.stampIds) && manifestEntry.stampIds.join(",") === "tutorial_start_cabin", "tutorial island should expose the starting cabin stamp");
  assert(Array.isArray(world.structures) && world.structures.length === 1 && world.structures[0].stampId === "tutorial_start_cabin", "tutorial island should place the starting cabin");
  assert(Array.isArray(world.services) && world.services.length === 10, "tutorial island should expose guide, instructor, and station services");
  assert(Array.isArray(world.combatSpawns) && world.combatSpawns.length === 2, "tutorial island should expose chicken combat spawns");
  assert(world.combatSpawns.every((spawn) => spawn.enemyId === "enemy_chicken"), "tutorial island should use chickens instead of a training dummy");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.mining) && world.resourceNodes.mining.length === 2, "tutorial island should expose copper and tin mining nodes");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) && world.resourceNodes.woodcutting.length === 2, "tutorial island should expose a small woodcutting pocket");
  const tutorialLessonGates = world.landmarks.doors.filter((door) => Number.isFinite(door.tutorialRequiredStep));
  assert(tutorialLessonGates.length === 7, "tutorial island should expose locked lesson gates");
  assert(tutorialLessonGates.every((door) => door.tileId === "WOODEN_GATE_CLOSED"), "tutorial lesson gates should use wooden gate tiles");
  assert(world.landmarks.doors.some((door) => door.landmarkId === "tutorial_start_cabin_door" && door.tileId === "DOOR_OPEN" && door.isOpen === true), "tutorial island should expose an open normal cabin door");
  assert(Array.isArray(world.landmarks.fences) && world.landmarks.fences.length >= 7, "tutorial island should expose authored fence lines");
  assert(Array.isArray(world.landmarks.roofs) && world.landmarks.roofs.some((roof) => roof.hideWhenPlayerInside === true), "tutorial island should expose a hideable starting cabin roof");
  assert(Array.isArray(world.landmarks.altars) && world.landmarks.altars.length === 1, "tutorial island should expose one altar");
  ["fishing", "cooking", "firemaking", "mining", "runecrafting", "woodcutting"].forEach((groupId) => {
    assert(Array.isArray(world.skillRoutes[groupId]) && world.skillRoutes[groupId].length === 1, `tutorial island should expose one ${groupId} route`);
  });

  const servicesById = Object.fromEntries(world.services.map((service) => [service.serviceId, service]));
  const guide = servicesById["merchant:tutorial_guide"];
  assert(guide.serviceId === "merchant:tutorial_guide", "tutorial guide service id mismatch");
  assert(guide.action === "Talk-to", "tutorial guide should require dialogue before travel");
  assert(guide.travelToWorldId === "starter_town", "tutorial guide travel target mismatch");
  assert(guide.travelSpawn && guide.travelSpawn.x === 205 && guide.travelSpawn.y === 210 && guide.travelSpawn.z === 0, "tutorial guide travel spawn mismatch");
  assert(dialogueCatalog.resolveDialogueId(guide.dialogueId) === "tutorial_guide", "tutorial guide dialogue should resolve");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_woodcutting_instructor"].dialogueId) === "tutorial_woodcutting_instructor", "woodcutting instructor dialogue should resolve");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_fishing_instructor"].dialogueId) === "tutorial_fishing_instructor", "fishing instructor dialogue should resolve");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_firemaking_instructor"].dialogueId) === "tutorial_firemaking_instructor", "firemaking instructor dialogue should resolve");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_mining_smithing_instructor"].dialogueId) === "tutorial_mining_smithing_instructor", "mining and smithing instructor dialogue should resolve");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_combat_instructor"].dialogueId) === "tutorial_combat_instructor", "combat instructor dialogue should resolve");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_bank_tutor"].dialogueId) === "tutorial_bank_tutor", "bank tutor dialogue should resolve");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_guide"].dialogueId === "tutorial_guide", "tutorial guide runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_firemaking_instructor"].dialogueId === "tutorial_firemaking_instructor", "firemaking instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_combat_instructor"].dialogueId === "tutorial_combat_instructor", "combat instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.legacy.fences.length >= 7, "tutorial bootstrap should carry authored fence lines into the legacy payload");
  assert(tutorialBootstrap.legacy.roofs.some((roof) => roof.landmarkId === "tutorial_start_cabin_roof"), "tutorial bootstrap should carry cabin roof metadata into the legacy payload");

  const gameplayMap = buildWorldGameplayMap(tutorialBootstrap.definition, tutorialBootstrap.stamps);
  const scaledSpawn = {
    x: Math.round(manifestEntry.defaultSpawn.x * (648 / 486)),
    y: Math.round(manifestEntry.defaultSpawn.y * (648 / 486)),
    z: manifestEntry.defaultSpawn.z
  };
  const cabinDoor = tutorialBootstrap.legacy.doors.find((door) => door.landmarkId === "tutorial_start_cabin_door");
  const cabinSteps = tutorialBootstrap.legacy.staircases.find((staircase) => staircase.landmarkId === "tutorial_start_cabin_steps");
  const arrivalGate = tutorialBootstrap.legacy.doors.find((door) => door.landmarkId === "tutorial_gate_arrival_to_woodcutting");
  assert(cabinDoor && cabinDoor.x === 155 && cabinDoor.y === 159, "scaled tutorial cabin door should sit on the visible front wall");
  assert(cabinSteps && cabinSteps.tiles && cabinSteps.tiles[0] && cabinSteps.tiles[0].x === 155 && cabinSteps.tiles[0].y === 160, "scaled tutorial cabin stairs should sit outside the visible front door");
  assert(arrivalGate && arrivalGate.x === 168 && arrivalGate.y === 157, "scaled first tutorial gate should stay aligned with the cabin exit");
  assert(isWalkable(gameplayMap, scaledSpawn.x, scaledSpawn.y, scaledSpawn.z), "scaled tutorial spawn should be walkable");
  assert(isWalkable(gameplayMap, cabinDoor.x, cabinDoor.y, cabinDoor.z), "scaled tutorial cabin door should be walkable");
  assert(findShortestPathLength(gameplayMap, scaledSpawn, { x: cabinSteps.tiles[0].x, y: cabinSteps.tiles[0].y, z: cabinSteps.tiles[0].z }, { maxDistance: 16 }) !== null, "player should be able to walk from spawn to the cabin stairs");
  assert(findShortestPathLength(gameplayMap, scaledSpawn, { x: arrivalGate.x - 1, y: arrivalGate.y, z: arrivalGate.z }, { maxDistance: 32 }) !== null, "player should be able to reach the first tutorial gate from the cabin");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  assertStarterTown(root);
  assertTutorialIsland(root);
  assertTreeVisualProfiles(root);
  assertRockVisualProfiles(root);
  console.log("World bootstrap parity checks passed for starter_town, tutorial_island, and visual profiles.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
