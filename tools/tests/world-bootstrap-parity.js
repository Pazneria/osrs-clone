const assert = require("assert");
const path = require("path");
const { buildWorldGameplayMap } = require("../content/world-map-builder");
const { findShortestPathLength, isWalkable } = require("../content/world-pathing");
const { TileId } = require("../content/tile-ids");
const { loadNpcDialogueCatalog } = require("../content/npc-dialogue-catalog-loader");
const { loadWorldContent } = require("../content/world-content");
const { loadTsModule } = require("../lib/ts-module-loader");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

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
    x: 91,
    y: 72,
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
    x: 92,
    y: 71,
    z: 0,
    dialogueId: "advanced_fletcher"
  },
  "merchant:advanced_woodsman": {
    spawnId: "npc:advanced_woodsman",
    merchantId: "advanced_woodsman",
    x: 82,
    y: 54,
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
    x: 303,
    y: 409,
    z: 0,
    dialogueId: "borin_ironvein"
  },
  "merchant:thrain_deepforge": {
    spawnId: "npc:thrain_deepforge",
    merchantId: "thrain_deepforge",
    x: 347,
    y: 409,
    z: 0,
    dialogueId: "thrain_deepforge"
  },
  "merchant:elira_gemhand": {
    spawnId: "npc:elira_gemhand",
    merchantId: "elira_gemhand",
    x: 322,
    y: 392,
    z: 0,
    dialogueId: "elira_gemhand"
  },
  "merchant:crafting_teacher": {
    spawnId: "npc:crafting_teacher",
    merchantId: "crafting_teacher",
    x: 450,
    y: 403,
    z: 0,
    dialogueId: "crafting_teacher"
  },
  "merchant:tanner_rusk": {
    spawnId: "npc:tanner_rusk",
    merchantId: "tanner_rusk",
    x: 417,
    y: 409,
    z: 0,
    dialogueId: "tanner_rusk",
    appearanceId: "tanner_rusk"
  },
  "merchant:north_woodwatch_guide": {
    spawnId: "npc:north_woodwatch_guide",
    x: 81,
    y: 56,
    z: 0,
    dialogueId: "outpost_guide"
  },
  "merchant:south_quarry_foreman": {
    spawnId: "npc:south_quarry_foreman",
    x: 323,
    y: 392,
    z: 0,
    dialogueId: "outpost_guide"
  },
  "merchant:market_crossing_trader": {
    spawnId: "npc:market_crossing_trader",
    x: 436,
    y: 391,
    z: 0,
    dialogueId: "shopkeeper"
  },
  "merchant:market_crossing_painter": {
    spawnId: "npc:market_crossing_painter",
    x: 453,
    y: 405,
    z: 0,
    dialogueId: "shopkeeper"
  },
  "merchant:old_road_scavenger": {
    spawnId: "npc:old_road_scavenger",
    x: 434,
    y: 124,
    z: 0,
    dialogueId: "outpost_guide"
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

const STARTER_TOWN_BANK_LAYOUT = Object.freeze({
  "bank:east_outpost": { spawnId: "npc:banker_east_outpost", x: 364, y: 252, z: 0 },
  "bank:willow_bend": { spawnId: "npc:banker_willow_bend", x: 244, y: 66, z: 0 },
  "bank:maple_ridge": { spawnId: "npc:banker_maple_ridge", x: 399, y: 205, z: 0 },
  "bank:yew_frontier": { spawnId: "npc:banker_yew_frontier", x: 58, y: 16, z: 0 },
  "bank:south_field": { spawnId: "npc:banker_south_field", x: 256, y: 444, z: 0 },
  "bank:west_range": { spawnId: "npc:banker_west_range", x: 64, y: 456, z: 0 },
  "bank:southeast_camp": { spawnId: "npc:banker_southeast_camp", x: 416, y: 430, z: 0 },
  "bank:air_altar": { spawnId: "npc:banker_air_altar", x: 96, y: 31, z: 0 },
  "bank:south_quarry": { spawnId: "npc:banker_south_quarry", x: 324, y: 393, z: 0 },
  "bank:market_crossing": { spawnId: "npc:banker_market_crossing", x: 419, y: 382, z: 0 }
});

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
  const source = readRepoFile(root, "src/js/world/tree-render-runtime.js");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const sharedSource = readRepoFile(root, "src/js/world/shared-assets-runtime.js");
  const resourceSource = readRepoFile(root, "src/js/world/chunk-resource-render-runtime.js");
  const objectLiteral = extractObjectLiteralAfter(source, "const TREE_VISUAL_PROFILES =", "TREE_VISUAL_PROFILES");
  return {
    profiles: vm.runInNewContext(`(${objectLiteral})`, {}, { filename: "TREE_VISUAL_PROFILES" }),
    source,
    sharedSource,
    resourceSource,
    worldSource
  };
}

function loadRockVisualProfiles(root) {
  const source = readRepoFile(root, "src/js/world/rock-render-runtime.js");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const resourceSource = readRepoFile(root, "src/js/world/chunk-resource-render-runtime.js");
  const objectLiteral = extractObjectLiteralAfter(source, "const ROCK_VISUAL_PROFILES =", "ROCK_VISUAL_PROFILES");
  return {
    profiles: vm.runInNewContext(`(${objectLiteral})`, {}, { filename: "ROCK_VISUAL_PROFILES" }),
    source,
    resourceSource,
    worldSource
  };
}

function treeVisualSignature(profile) {
  return JSON.stringify({
    trunkScale: profile.trunkScale,
    rootFlareScale: profile.rootFlareScale || [],
    stumpCapScale: profile.stumpCapScale || [],
    canopyScales: profile.canopyScales,
    canopyYOffset: profile.canopyYOffset,
    canopyOffsets: profile.canopyOffsets || [],
    branchCanopyAttachments: profile.branchCanopyAttachments || {},
    branchScale: profile.branchScale || [],
    branch2Scale: profile.branch2Scale || [],
    branch3Scale: profile.branch3Scale || [],
    drapeScales: profile.drapeScales || [],
    stumpScale: profile.stumpScale
  });
}

function assertTreeVisualProfiles(root) {
  const { profiles, source, sharedSource, resourceSource, worldSource } = loadTreeVisualProfiles(root);
  const profileIds = Object.keys(profiles).sort().join(",");
  assert(profileIds === TREE_VISUAL_NODE_IDS.slice().sort().join(","), "tree render runtime should define one tree visual profile per woodcutting node type");

  const signatures = new Set(TREE_VISUAL_NODE_IDS.map((nodeId) => treeVisualSignature(profiles[nodeId])));
  assert(signatures.size === TREE_VISUAL_NODE_IDS.length, "tree visual profiles should not collapse to shared silhouettes");
  assert(Array.isArray(profiles.normal_tree.branchScale) && profiles.normal_tree.branchScale[0] > 0.2 && profiles.normal_tree.branchScale[0] <= 0.32, "normal trees should keep one short slim side branch without looking beefy");
  assert(Array.isArray(profiles.normal_tree.branch2Scale) && profiles.normal_tree.branch2Scale[0] > 0.54 && profiles.normal_tree.branch2Scale[0] <= 0.62, "normal trees should use their second branch as the longer upward side branch");
  assert(Array.isArray(profiles.normal_tree.branch2Offset) && profiles.normal_tree.branch2Offset[0] > 0.02 && profiles.normal_tree.branch2Offset[0] <= 0.08 && profiles.normal_tree.branch2Offset[1] >= 0.56, "normal tree longer side branches should be anchored like the smaller branch, then rise outward");
  assert(Math.abs(profiles.normal_tree.branch2Offset[0] - (0.066 * profiles.normal_tree.branch2Scale[0])) < 0.04, "normal tree longer side branches should start from the trunk instead of floating outside it");
  assert(Math.abs(profiles.normal_tree.branch2Yaw - profiles.normal_tree.branchYaw) >= Math.PI / 4, "normal tree longer side branches should be radially separated from the smaller branch");
  assert(profiles.normal_tree.branchCanopyAttachments && profiles.normal_tree.branchCanopyAttachments[3] && profiles.normal_tree.branchCanopyAttachments[3].branch === "branch2", "normal tree side canopy should attach to branch2 by reference");
  assert(Array.isArray(profiles.normal_tree.rootFlareScale) && profiles.normal_tree.rootFlareScale.some((value) => value > 0), "normal trees should use a root flare so they read as planted");
  assert(Array.isArray(profiles.normal_tree.stumpCapScale) && profiles.normal_tree.stumpCapScale.some((value) => value > 0), "normal tree stumps should have a cut cap that fits the trunk base");
  assert(Math.abs((0.34 * profiles.normal_tree.stumpCapScale[0]) - (0.28 * profiles.normal_tree.trunkScale[0])) < 0.002, "normal tree stump cap tops should match the full trunk base diameter");
  assert(profiles.normal_tree.stumpScale[0] <= 0.68 && profiles.normal_tree.stumpRootFlareScale[0] <= 0.5, "normal tree stumps should stay slimmer while keeping a modest root fan");
  assert(profiles.normal_tree.trunkScale[0] < 0.75 && profiles.normal_tree.stumpScale[0] < 0.85, "normal trees and stumps should stay slim enough to read as beginner woodcutting trees");
  assert(profiles.normal_tree.trunkScale[1] >= 0.98, "normal tree trunks should rise to meet the raised canopy without poking above it");
  assert(profiles.normal_tree.canopyYOffset >= 0.9, "normal tree canopies should sit high enough that adjacent chopping players do not bury their heads in leaves");
  assert(profiles.normal_tree.canopyScales[0][0] < 0.65 && profiles.normal_tree.canopyScales[0][1] < 0.5, "normal tree canopies should stay compact and thin");
  assert(profiles.normal_tree.canopyScales[3][0] <= 0.25 && JSON.stringify(profiles.normal_tree.canopyOffsets[3]) === "[0,0,0]", "normal tree side canopy placement should come from branch attachment instead of guessed offsets");
  assert(Array.isArray(profiles.normal_tree.canopyOffsets) && profiles.normal_tree.canopyOffsets.length === 4, "normal trees should use asymmetric canopy offsets");
  assert(profiles.oak_tree.trunkScale[0] > profiles.normal_tree.trunkScale[0], "oak trees should keep a broader trunk than normal trees");
  assert(profiles.oak_tree.canopyScales[0][0] > profiles.normal_tree.canopyScales[0][0], "oak trees should keep a broader canopy than normal trees");
  assert(Array.isArray(profiles.willow_tree.drapeScales) && profiles.willow_tree.drapeScales.length === 8, "willow trees should keep dedicated hanging drape meshes");
  assert(profiles.maple_tree.canopyScales[0][0] > profiles.oak_tree.canopyScales[0][0], "maple trees should keep the broadest crown profile");
  assert(profiles.yew_tree.trunkScale[1] > profiles.willow_tree.trunkScale[1], "yew trees should keep the tallest trunk profile");
  assert(profiles.yew_tree.canopyScales[3][0] < profiles.willow_tree.canopyScales[3][0], "yew trees should keep the tight stacked top profile");
  assert(source.includes("function setTreeVisualState(input)"), "tree render runtime should own instanced tree visual state updates");
  assert(sharedSource.includes("treeBranch2 = new THREE.CylinderGeometry(0.052, 0.09, 1.12, 6).rotateZ(-Math.PI / 2.8).translate(0.44, 1.54, -0.06);"), "shared branch2 geometry should mirror the attached small-branch construction instead of using the old detached branch");
  assert(sharedSource.includes("treeBranch2.userData = { rootLocal: [-0.065, 1.297, -0.06], tipLocal: [0.945, 1.783, -0.06] };"), "shared branch2 geometry should expose its real tip for attached side canopies");
  assert(sharedSource.includes("leaf4.userData = { branchAttachmentLocal: [-0.06, 2.4, 0.44] };"), "shared leaf4 geometry should expose a branch attachment point");
  assert(source.includes("function computeBranchEndpointWorld(") && source.includes("const attachmentTarget = attachment"), "tree render runtime should compute side canopy placement from the referenced branch endpoint");
  assert(!source.includes("iLeafShadow") && !source.includes("canopyShadowScale"), "normal tree leaf depth should stay in the main canopy meshes instead of a split-color shadow layer");
  assert(source.includes("mesh.castShadow = false;"), "tree instanced meshes should avoid shadow-map casting for cheaper resource rendering");
  assert(worldSource.includes("WorldTreeRenderRuntime"), "world.js should delegate tree visuals through the tree render runtime");
  assert(worldSource.includes("WorldChunkResourceRenderRuntime"), "world.js should delegate chunk tree/rock placement through the chunk resource runtime");
  assert(resourceSource.includes("const treeNodeId = treeNode && treeNode.nodeId ? treeNode.nodeId : 'normal_tree';"), "chunk resource runtime should resolve a node-specific tree visual id");
  assert(resourceSource.includes("hash2D(x, y, 331.71) * Math.PI * 2"), "chunk resource runtime should use deterministic tree rotation");
  assert(!resourceSource.includes("Math.random() * Math.PI * 2"), "chunk resource runtime should not randomize tree rotation per rebuild");
  assert(resourceSource.includes("setTreeVisualState(state.treeData, state.treeIndex, {") && resourceSource.includes("nodeId: treeNodeId"), "chunk resource runtime should feed tree node id into the visual profile path");
  assert(resourceSource.includes("function setChunkTreeStumpVisual(options = {})"), "chunk resource runtime should own loaded tree stump/respawn visual updates");
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
  const { profiles, source, resourceSource, worldSource } = loadRockVisualProfiles(root);
  const profileIds = Object.keys(profiles).sort().join(",");
  assert(profileIds === ROCK_VISUAL_NODE_IDS.slice().sort().join(","), "rock render runtime should define one rock visual profile per mining node type plus depleted state");

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
  assert(source.includes("function createRockRenderData(options = {})"), "rock render runtime should create per-profile instanced meshes with interaction maps");
  assert(source.includes("function setRockVisualState(options)"), "rock render runtime should own instanced rock transform updates");
  assert(worldSource.includes("WorldRockRenderRuntime"), "world.js should delegate rock visuals through the rock render runtime");
  assert(worldSource.includes("WorldChunkResourceRenderRuntime"), "world.js should delegate chunk tree/rock placement through the chunk resource runtime");
  assert(/getRockVisualIdForNode\s*\(\s*rockNode\s*,\s*depleted\s*\)/.test(resourceSource) && /\.rockVisualCounts\[visualId\]\s*=/.test(resourceSource), "chunk resource runtime should bucket rocks by visual profile");
  assert(resourceSource.includes("setRockVisualState(state.rockData, visualId, rockIndex"), "chunk resource runtime should feed rock placements into the visual runtime");
}

function assertStarterTown(root) {
  const { manifestEntry, world, stamps } = loadWorldContent(root, "main_overworld");
  const bootstrap = loadTsModule(path.join(root, "src", "game", "world", "bootstrap.ts"));
  const dialogueCatalog = loadNpcDialogueCatalog(root);
  const starterBootstrap = bootstrap.buildWorldBootstrapResult("main_overworld");
  const legacyStarterBootstrap = bootstrap.buildWorldBootstrapResult("starter_town");
  const npcBySpawnId = starterBootstrap && starterBootstrap.npcRegistry && starterBootstrap.npcRegistry.bySpawnId
    ? starterBootstrap.npcRegistry.bySpawnId
    : {};

  assert(manifestEntry.worldId === "main_overworld", "starter_town manifest world-id mismatch");
  assert(legacyStarterBootstrap.definition.worldId === "main_overworld", "legacy starter_town bootstrap should resolve to main_overworld");
  assert(
    Array.isArray(world.areas)
      && world.areas.some((area) => area && area.areaId === "starter_town" && area.label === "Starter Town"),
    "main_overworld should preserve Starter Town as an area"
  );
  assert(manifestEntry.defaultSpawn.x === 205 && manifestEntry.defaultSpawn.y === 210 && manifestEntry.defaultSpawn.z === 0, "starter_town default spawn mismatch");
  assert(manifestEntry.stampIds.join(",") === STARTER_TOWN_STAMP_IDS.join(","), "starter-town stamp kit mismatch");
  assert(Object.keys(stamps).join(",") === STARTER_TOWN_STAMP_IDS.join(","), "starter-town loaded stamps should match manifest kit");
  assert(Array.isArray(world.structures) && world.structures.length === Object.keys(STARTER_TOWN_STRUCTURE_LAYOUT).length, "expected authored main-overworld structure layout");
  assert(Array.isArray(world.services) && world.services.length === 35, "expected 35 authored main-overworld services");
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
  assert(Array.isArray(world.terrainPatches.paths), "starter-town should expose authored road paths");
  assert(
    world.terrainPatches.paths.filter((pathPatch) => Array.isArray(pathPatch.tags) && pathPatch.tags.includes("road")).length === MAIN_OVERWORLD_ROAD_IDS.length,
    "starter-town road path count mismatch"
  );
  assert(
    world.services.filter((entry) => entry.type === "MERCHANT" && entry.name).length === Object.keys(STARTER_TOWN_NAMED_NPC_LAYOUT).length + Object.keys(STARTER_TOWN_BANK_LAYOUT).length,
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
  const roadPathsById = Object.fromEntries(world.terrainPatches.paths.map((entry) => [entry.pathId, entry]));
  MAIN_OVERWORLD_ROAD_IDS.forEach((pathId) => {
    const road = roadPathsById[pathId];
    assert(!!road, `starter-town road missing: ${pathId}`);
    assert(road.tileId === "DIRT", `${pathId} should stamp dirt road tiles`);
    assert(Array.isArray(road.tags) && road.tags.includes("spawn-protected"), `${pathId} should be spawn-protected`);
  });
  const gameplayMap = buildWorldGameplayMap(world, stamps);
  [[282, 242], [197, 98], [158, 222], [240, 360], [74, 392], [370, 440], [410, 354], [460, 398]].forEach(([x, y]) => {
    assert(gameplayMap[0][y][x] === TileId.DIRT, `starter road sample ${x},${y} should remain a dirt road tile`);
  });
  assert(starterBootstrap.legacy.pathPatches.some((pathPatch) => pathPatch.pathId === "starter_town_east_road"), "starter bootstrap should publish the east road patch");
  assert(starterBootstrap.legacy.pathPatches.some((pathPatch) => pathPatch.pathId === "starter_town_southwest_bank_road"), "starter bootstrap should publish the southwest bank road patch");
  assert(Array.isArray(starterBootstrap.legacy.landformPatches), "starter bootstrap should publish authored terrain landforms");
  assert(starterBootstrap.legacy.landformPatches.some((landform) => landform.landformId === "east_marsh_lower_bank"), "starter bootstrap should publish the lowered riverbank landform");
  assert(starterBootstrap.legacy.landformPatches.some((landform) => landform.landformId === "sunspur_foothill_rise"), "starter bootstrap should publish the foothill rise landform");

  const servicesById = Object.fromEntries(world.services.map((entry) => [entry.serviceId, entry]));
  assert(dialogueCatalog && typeof dialogueCatalog.resolveDialogueId === "function", "npc dialogue catalog resolver missing");
  assert(servicesById["merchant:starter_caravan_guide"].travelToWorldId === "main_overworld", "starter caravan travel target mismatch");
  assert(servicesById["merchant:starter_caravan_guide"].travelSpawn.x === 364 && servicesById["merchant:starter_caravan_guide"].travelSpawn.y === 262, "starter caravan travel spawn mismatch");
  assert(servicesById["merchant:east_outpost_caravan_guide"].travelToWorldId === "main_overworld", "east outpost caravan travel target mismatch");
  assert(servicesById["merchant:east_outpost_caravan_guide"].travelSpawn.x === 205 && servicesById["merchant:east_outpost_caravan_guide"].travelSpawn.y === 210, "east outpost caravan travel spawn mismatch");
  assert(servicesById["station:starter_furnace"].footprintW === 2, "furnace footprint mismatch");
  assert(servicesById["station:south_quarry_furnace"].x === 331 && servicesById["station:south_quarry_furnace"].y === 393, "south quarry furnace placement mismatch");
  assert(servicesById["station:south_quarry_anvil"].x === 334 && servicesById["station:south_quarry_anvil"].y === 393, "south quarry anvil placement mismatch");
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
  Object.entries(STARTER_TOWN_BANK_LAYOUT).forEach(([serviceId, expected]) => {
    const service = servicesById[serviceId];
    assert(!!service, `starter-town bank service missing: ${serviceId}`);
    assert(service.spawnId === expected.spawnId, `${serviceId} spawnId mismatch`);
    assert(service.x === expected.x && service.y === expected.y && service.z === expected.z, `${serviceId} authored placement mismatch`);
    assert(service.name === "Banker", `${serviceId} should render as a Banker`);
    assert(service.action === "Bank", `${serviceId} should open the bank directly`);
    assert(service.dialogueId === "banker", `${serviceId} dialogueId mismatch`);
    assert(dialogueCatalog.resolveDialogueId(service.dialogueId) === "banker", `${serviceId} dialogueId should resolve to banker`);
    const npc = npcBySpawnId[expected.spawnId];
    assert(!!npc, `${serviceId} should publish a runtime Banker descriptor`);
    assert(npc.name === "Banker", `${serviceId} runtime NPC name mismatch`);
    assert(npc.action === "Bank", `${serviceId} runtime NPC action mismatch`);
    assert(String(npc.dialogueId || "").trim() === "banker", `${serviceId} runtime NPC should preserve banker dialogue`);
  });
  assert(
    Object.keys(npcBySpawnId).length === Object.keys(STARTER_TOWN_NAMED_NPC_LAYOUT).length + Object.keys(STARTER_TOWN_BANK_LAYOUT).length,
    "starter-town runtime NPC registry count mismatch"
  );

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
  assert(combatSpawnsById["enemy_spawn_bear_southeast_camp_west"].assistGroupId === "camp_southeast_ruins", "southeast camp bear assist group mismatch");
  assert(combatSpawnsById["enemy_spawn_heavy_brute_southeast_camp_anchor"].assistRadiusOverride === 14, "southeast camp brute assist radius mismatch");
  assert(combatSpawnsById["enemy_spawn_fast_striker_southeast_camp_east"].assistGroupId === "camp_southeast_ruins", "southeast camp striker assist group mismatch");
  assert(
    JSON.stringify(combatSpawnsById["enemy_spawn_fast_striker_southeast_camp_east"].patrolRoute) ===
      JSON.stringify([
        { x: 456, y: 468, z: 0 },
        { x: 456, y: 462, z: 0 },
        { x: 462, y: 462, z: 0 },
        { x: 462, y: 468, z: 0 }
      ]),
    "southeast camp striker patrol route mismatch"
  );

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
  assert(manifestEntry.defaultSpawn.x === 138 && manifestEntry.defaultSpawn.y === 175 && manifestEntry.defaultSpawn.z === 0, "tutorial_island default spawn mismatch");
  assert(Array.isArray(manifestEntry.stampIds) && manifestEntry.stampIds.join(",") === "tutorial_start_cabin", "tutorial island should expose the starting cabin stamp");
  assert(Array.isArray(world.structures) && world.structures.length === 1 && world.structures[0].stampId === "tutorial_start_cabin", "tutorial island should place the starting cabin");
  assert(world.version === "2026.05.surface_v2", "tutorial island should expose the surface-v2 layout");
  assert(world.terrainPatches.islandWater && world.terrainPatches.islandWater.landPolygon.length >= 8, "tutorial island should expose an authored island landmass");
  assert(Array.isArray(world.terrainPatches.paths) && world.terrainPatches.paths.length >= 5, "tutorial island should expose authored dirt path patches");
  assert(world.terrainPatches.pier.enabled === false, "tutorial island should disable the fishing pier");
  assert(Array.isArray(world.waterBodies) && world.waterBodies.some((body) => body.id === "tutorial_surrounding_sea"), "tutorial island should expose surrounding sea water");
  assert(Array.isArray(world.services) && world.services.length === 14, "tutorial island surface-v2 should expose surface tutors, late-skill tutors, and smithing stations");
  assert(Array.isArray(world.combatSpawns) && world.combatSpawns.length === 3, "tutorial island surface-v2 should expose surface combat spawns");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.mining) && world.resourceNodes.mining.length === 4, "tutorial island surface-v2 should expose surface mining nodes");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) && world.resourceNodes.woodcutting.length === 6, "tutorial island should expose a denser survival-field grove");
  const tutorialLessonGates = world.landmarks.doors.filter((door) => Number.isFinite(door.tutorialRequiredStep) && door.tileId === "WOODEN_GATE_CLOSED");
  assert(tutorialLessonGates.length === 4, "tutorial island surface-v2 should expose quarry, combat, bank, and exit gates");
  assert(tutorialLessonGates.every((door) => door.tileId === "WOODEN_GATE_CLOSED"), "tutorial lesson gates should use wooden gate tiles");
  assert(
    world.landmarks.doors.some((door) => (
      door.landmarkId === "tutorial_start_cabin_door"
      && door.tileId === "DOOR_CLOSED"
      && door.isOpen === false
      && door.tutorialRequiredStep === 1
      && door.tutorialAutoOpenOnUnlock === false
    )),
    "tutorial island should expose a locked closed normal cabin door"
  );
  assert(Array.isArray(world.landmarks.fences) && world.landmarks.fences.length >= 5, "tutorial island should expose authored fence lines without boxing in the natural survival field");
  assert(Array.isArray(world.landmarks.roofs) && world.landmarks.roofs.some((roof) => roof.hideWhenPlayerInside === true), "tutorial island should expose a hideable starting cabin roof");
  assert(Array.isArray(world.landmarks.caveOpenings) && world.landmarks.caveOpenings.length === 0, "tutorial island surface-v2 should keep the full loop on the surface");
  assert(Array.isArray(world.landmarks.altars) && world.landmarks.altars.length === 1, "tutorial island should expose the tutorial Ember Altar");
  assert(world.landmarks.altars[0].routeId === "tutorial_ember_altar", "tutorial Ember Altar should reference the tutorial route");
  assert(Array.isArray(world.landmarks.decorProps) && world.landmarks.decorProps.some((prop) => prop.propId === "tutorial_combat_weapon_rack" && prop.kind === "weapon_rack"), "tutorial island should expose combat-yard weapon rack decor");
  assert(world.landmarks.decorProps.some((prop) => prop.propId === "tutorial_combat_training_dummy" && prop.kind === "training_dummy"), "tutorial island should expose combat-yard training dummy decor");
  assert(world.landmarks.decorProps.some((prop) => prop.propId === "tutorial_combat_archery_target" && prop.kind === "archery_target"), "tutorial island should expose combat-yard archery target decor");
  assert(world.landmarks.decorProps.some((prop) => prop.propId === "tutorial_magic_lesson_board" && prop.kind === "notice_board"), "tutorial island should expose a magic lesson board prop");
  assert(world.landmarks.decorProps.some((prop) => prop.propId === "tutorial_crafting_bench" && prop.kind === "desk"), "tutorial island should expose a crafting bench prop");
  assert(Array.isArray(world.skillRoutes.runecrafting) && world.skillRoutes.runecrafting.length === 1, "tutorial island should expose one runecrafting route");
  assert(world.skillRoutes.runecrafting[0].routeId === "tutorial_ember_altar", "tutorial island runecrafting route should point at the tutorial Ember Altar");
  ["fishing", "cooking", "firemaking", "mining", "runecrafting", "woodcutting"].forEach((groupId) => {
    assert(Array.isArray(world.skillRoutes[groupId]) && world.skillRoutes[groupId].length === 1, `tutorial island should expose one ${groupId} route`);
  });
  assert(Array.isArray(world.skillRoutes.cooking[0].fireTiles) && world.skillRoutes.cooking[0].fireTiles.length === 0, "tutorial island surface-v2 should not render permanent cooking fires");

  const servicesById = Object.fromEntries(world.services.map((service) => [service.serviceId, service]));
  const guide = servicesById["merchant:tutorial_guide"];
  assert(guide.serviceId === "merchant:tutorial_guide", "tutorial guide service id mismatch");
  assert(guide.x === 141 && guide.y === 177, "tutorial guide should stand still beside the cabin door");
  assert(Math.abs(guide.facingYaw - Math.PI) < 0.000001, "tutorial guide should author a cardinal facing direction away from the cabin door");
  assert(guide.roamingRadiusOverride === 0, "tutorial guide should preserve the authored stationary roam override");
  assert(guide.action === "Talk-to", "tutorial guide should require dialogue before travel");
  assert(guide.travelToWorldId === "main_overworld", "tutorial guide travel target mismatch");
  assert(guide.travelSpawn && guide.travelSpawn.x === 205 && guide.travelSpawn.y === 210 && guide.travelSpawn.z === 0, "tutorial guide travel spawn mismatch");
  assert(dialogueCatalog.resolveDialogueId(guide.dialogueId) === "tutorial_guide", "tutorial guide dialogue should resolve");
  assert(servicesById["merchant:tutorial_woodcutting_instructor"].appearanceId === "tutorial_woodcutting_instructor", "woodcutting instructor should preserve the old woodsman appearance id");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_woodcutting_instructor"].dialogueId) === "tutorial_woodcutting_instructor", "woodcutting instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_fishing_instructor"].appearanceId === "tutorial_fishing_instructor", "fishing instructor should preserve the weathered angler appearance id");
  assert(servicesById["merchant:tutorial_fishing_instructor"].x === 274 && servicesById["merchant:tutorial_fishing_instructor"].y === 240, "fishing instructor should stay on the southern pond bank");
  assert(servicesById["merchant:tutorial_fishing_instructor"].roamingRadiusOverride === 0, "fishing instructor should preserve the stationary roam override");
  assert(Math.abs(servicesById["merchant:tutorial_fishing_instructor"].facingYaw - Math.PI) < 0.000001, "fishing instructor should face north toward the pond");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_fishing_instructor"].dialogueId) === "tutorial_fishing_instructor", "fishing instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_firemaking_instructor"].appearanceId === "tutorial_firemaking_instructor", "firemaking instructor should preserve the sooty worker appearance id");
  assert(servicesById["merchant:tutorial_firemaking_instructor"].roamingRadiusOverride === 0, "firemaking instructor should preserve the stationary roam override");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_firemaking_instructor"].dialogueId) === "tutorial_firemaking_instructor", "firemaking instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_mining_smithing_instructor"].appearanceId === "tutorial_mining_smithing_instructor", "mining and smithing instructor should preserve the aproned foreman appearance id");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_mining_smithing_instructor"].dialogueId) === "tutorial_mining_smithing_instructor", "mining and smithing instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_combat_instructor"].appearanceId === "tutorial_combat_instructor", "combat instructor should preserve the arms trainer appearance id");
  assert(servicesById["merchant:tutorial_combat_instructor"].roamingRadiusOverride === 0, "combat instructor should preserve the stationary roam override");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_combat_instructor"].dialogueId) === "tutorial_combat_instructor", "combat instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_ranged_instructor"].x === 340 && servicesById["merchant:tutorial_ranged_instructor"].y === 320, "ranged instructor should stand beside the archery target");
  assert(servicesById["merchant:tutorial_ranged_instructor"].appearanceId === "tutorial_ranged_instructor", "ranged instructor should preserve the archery trainer appearance id");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_ranged_instructor"].dialogueId) === "tutorial_ranged_instructor", "ranged instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_magic_instructor"].x === 292 && servicesById["merchant:tutorial_magic_instructor"].y === 336, "magic instructor should stand beside the late-skill lesson board");
  assert(servicesById["merchant:tutorial_magic_instructor"].appearanceId === "tutorial_magic_instructor", "magic instructor should preserve the rune lesson appearance id");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_magic_instructor"].dialogueId) === "tutorial_magic_instructor", "magic instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_runecrafting_instructor"].x === 246 && servicesById["merchant:tutorial_runecrafting_instructor"].y === 340, "runecrafting instructor should stand beside the tutorial Ember Altar");
  assert(servicesById["merchant:tutorial_runecrafting_instructor"].appearanceId === "tutorial_runecrafting_instructor", "runecrafting instructor should preserve the altar scribe appearance id");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_runecrafting_instructor"].dialogueId) === "tutorial_runecrafting_instructor", "runecrafting instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_crafting_instructor"].x === 218 && servicesById["merchant:tutorial_crafting_instructor"].y === 336, "crafting instructor should stand beside the crafting bench");
  assert(servicesById["merchant:tutorial_crafting_instructor"].appearanceId === "tutorial_crafting_instructor", "crafting instructor should preserve the artisan appearance id");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_crafting_instructor"].dialogueId) === "tutorial_crafting_instructor", "crafting instructor dialogue should resolve");
  assert(servicesById["merchant:tutorial_bank_tutor"].appearanceId === "tutorial_bank_tutor", "bank tutor should preserve the ledger tutor appearance id");
  assert(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_bank_tutor"].dialogueId) === "tutorial_bank_tutor", "bank tutor dialogue should resolve");
  assert(servicesById["station:tutorial_furnace"].type === "FURNACE", "tutorial furnace should expose a smithing station");
  assert(servicesById["station:tutorial_furnace"].facingYaw === -Math.PI / 2, "tutorial furnace mouth should face west");
  assert(servicesById["station:tutorial_furnace"].footprintW === 2 && servicesById["station:tutorial_furnace"].footprintD === 3, "west-facing tutorial furnace should occupy a three-tile entrance span");
  assert(servicesById["station:tutorial_anvil"].type === "ANVIL", "tutorial anvil should expose a smithing station");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_guide"].dialogueId === "tutorial_guide", "tutorial guide runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_guide"].roamingRadiusOverride === 0, "tutorial guide runtime NPC should preserve stationary roam override");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_guide"].tutorialVisibleUntilStep === 10, "arrival tutorial guide runtime NPC should hide before the final exit step");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_exit_guide"].tutorialVisibleFromStep === 11, "center-yard tutorial guide runtime NPC should appear at the final exit step");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_exit_guide"].appearanceId === tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_guide"].appearanceId, "arrival and center-yard guide runtime NPCs should share the same appearance identity");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_exit_guide"].dialogueId === tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_guide"].dialogueId, "arrival and center-yard guide runtime NPCs should share the same dialogue identity");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_woodcutting_instructor"].appearanceId === "tutorial_woodcutting_instructor", "woodcutting instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_fishing_instructor"].appearanceId === "tutorial_fishing_instructor", "fishing instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_fishing_instructor"].roamingRadiusOverride === 0, "fishing instructor runtime NPC should preserve stationary roam override");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_firemaking_instructor"].appearanceId === "tutorial_firemaking_instructor", "firemaking instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_firemaking_instructor"].roamingRadiusOverride === 0, "firemaking instructor runtime NPC should preserve stationary roam override");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_firemaking_instructor"].dialogueId === "tutorial_firemaking_instructor", "firemaking instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_mining_smithing_instructor"].appearanceId === "tutorial_mining_smithing_instructor", "mining and smithing instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_mining_smithing_instructor"].dialogueId === "tutorial_mining_smithing_instructor", "mining and smithing instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_combat_instructor"].appearanceId === "tutorial_combat_instructor", "combat instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_combat_instructor"].roamingRadiusOverride === 0, "combat instructor runtime NPC should preserve stationary roam override");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_combat_instructor"].dialogueId === "tutorial_combat_instructor", "combat instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_ranged_instructor"].appearanceId === "tutorial_ranged_instructor", "ranged instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_ranged_instructor"].dialogueId === "tutorial_ranged_instructor", "ranged instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_magic_instructor"].appearanceId === "tutorial_magic_instructor", "magic instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_magic_instructor"].dialogueId === "tutorial_magic_instructor", "magic instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_runecrafting_instructor"].appearanceId === "tutorial_runecrafting_instructor", "runecrafting instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_runecrafting_instructor"].dialogueId === "tutorial_runecrafting_instructor", "runecrafting instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_crafting_instructor"].appearanceId === "tutorial_crafting_instructor", "crafting instructor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_crafting_instructor"].dialogueId === "tutorial_crafting_instructor", "crafting instructor runtime NPC should preserve dialogue");
  assert(tutorialBootstrap.npcRegistry.bySpawnId["npc:tutorial_bank_tutor"].appearanceId === "tutorial_bank_tutor", "bank tutor runtime NPC should preserve appearance id");
  assert(tutorialBootstrap.legacy.fences.length >= 5, "tutorial bootstrap should carry authored fence lines into the legacy payload");
  assert(tutorialBootstrap.legacy.islandWater && tutorialBootstrap.legacy.islandWater.landPolygon.length >= 8, "tutorial bootstrap should carry island-water topology into the legacy payload");
  assert(tutorialBootstrap.legacy.pathPatches.some((pathPatch) => pathPatch.pathId === "tutorial_fire_to_quarry_path"), "tutorial bootstrap should carry lowered dirt path patches");
  assert(tutorialBootstrap.legacy.pathPatches.some((pathPatch) => pathPatch.pathId === "tutorial_quarry_work_apron"), "tutorial bootstrap should carry the quarry work-apron terrain patch");
  assert(tutorialBootstrap.legacy.roofs.some((roof) => roof.landmarkId === "tutorial_start_cabin_roof"), "tutorial bootstrap should carry cabin roof metadata into the legacy payload");
  assert(tutorialBootstrap.legacy.caveOpenings.length === 0, "tutorial bootstrap should preserve the no-cave surface-v2 layout");
  assert(tutorialBootstrap.legacy.decorProps.length === 18, "tutorial bootstrap should carry arrival, grove, quarry, combat, and late-skill yard decor props into the legacy payload");
  assert(tutorialBootstrap.legacy.decorProps.some((prop) => prop.propId === "tutorial_combat_weapon_rack" && prop.kind === "weapon_rack"), "tutorial bootstrap should carry combat weapon rack decor");
  assert(tutorialBootstrap.legacy.decorProps.some((prop) => prop.propId === "tutorial_combat_training_dummy" && prop.kind === "training_dummy"), "tutorial bootstrap should carry combat training dummy decor");
  assert(tutorialBootstrap.legacy.decorProps.some((prop) => prop.propId === "tutorial_combat_archery_target" && prop.kind === "archery_target"), "tutorial bootstrap should carry combat archery target decor");
  assert(tutorialBootstrap.legacy.decorProps.some((prop) => prop.propId === "tutorial_magic_lesson_board" && prop.kind === "notice_board"), "tutorial bootstrap should carry magic lesson board decor");
  assert(tutorialBootstrap.legacy.decorProps.some((prop) => prop.propId === "tutorial_crafting_bench" && prop.kind === "desk"), "tutorial bootstrap should carry crafting bench decor");

  const gameplayMap = buildWorldGameplayMap(tutorialBootstrap.definition, tutorialBootstrap.stamps);
  const scaledSpawn = {
    x: tutorialBootstrap.definition.structures[0].x + (manifestEntry.defaultSpawn.x - world.structures[0].x),
    y: tutorialBootstrap.definition.structures[0].y + (manifestEntry.defaultSpawn.y - world.structures[0].y),
    z: manifestEntry.defaultSpawn.z
  };
  const cabinDoor = tutorialBootstrap.legacy.doors.find((door) => door.landmarkId === "tutorial_start_cabin_door");
  const cabinSteps = tutorialBootstrap.legacy.staircases.find((staircase) => staircase.landmarkId === "tutorial_start_cabin_steps");
  const arrivalWestBoundaryFence = tutorialBootstrap.legacy.fences.find((fence) => fence.landmarkId === "tutorial_arrival_west_boundary_fence");
  assert(cabinDoor && cabinDoor.x === 214 && cabinDoor.y === 254, "scaled tutorial cabin door should sit on the visible front wall");
  assert(cabinSteps && cabinSteps.tiles && cabinSteps.tiles[0] && cabinSteps.tiles[0].x === 214 && cabinSteps.tiles[0].y === 255, "scaled tutorial cabin stairs should sit outside the visible front door");
  assert(!tutorialBootstrap.legacy.doors.some((door) => door.landmarkId === "tutorial_gate_arrival_to_survival_field"), "scaled tutorial should omit the redundant first gate east of the cabin");
  assert(arrivalWestBoundaryFence && arrivalWestBoundaryFence.points[0].x === 203 && arrivalWestBoundaryFence.points[0].y === 238, "scaled tutorial should keep the west arrival fence boundary closed off");
  assert(isWalkable(gameplayMap, scaledSpawn.x, scaledSpawn.y, scaledSpawn.z), "scaled tutorial spawn should be walkable");
  assert(!isWalkable(gameplayMap, cabinDoor.x, cabinDoor.y, cabinDoor.z), "scaled tutorial cabin door should block movement before the guide clears the player");
  gameplayMap[cabinDoor.z][cabinDoor.y][cabinDoor.x] = TileId.DOOR_OPEN;
  assert(findShortestPathLength(gameplayMap, scaledSpawn, { x: cabinSteps.tiles[0].x, y: cabinSteps.tiles[0].y, z: cabinSteps.tiles[0].z }, { maxDistance: 16 }) !== null, "player should be able to walk from spawn to the cabin stairs");
  assert(findShortestPathLength(gameplayMap, scaledSpawn, { x: 331, y: 291, z: 0 }, { maxDistance: 160, maxVisited: 24000 }) !== null, "player should be able to reach the woodcutting instructor route from the cabin");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  assertStarterTown(root);
  assertTutorialIsland(root);
  assertTreeVisualProfiles(root);
  assertRockVisualProfiles(root);
  console.log("World bootstrap parity checks passed for main_overworld, tutorial_island, and visual profiles.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
