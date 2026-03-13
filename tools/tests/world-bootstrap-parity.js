const path = require("path");
const { loadWorldContent } = require("../content/world-utils");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertStarterTown(root) {
  const { manifestEntry, world, stamps } = loadWorldContent(root, "starter_town");

  assert(manifestEntry.worldId === "starter_town", "starter_town manifest world-id mismatch");
  assert(manifestEntry.defaultSpawn.x === 205 && manifestEntry.defaultSpawn.y === 210 && manifestEntry.defaultSpawn.z === 0, "starter_town default spawn mismatch");
  assert(Object.keys(stamps).length === 4, "expected 4 starter-town stamps");
  assert(Array.isArray(world.structures) && world.structures.length === 4, "expected 4 starter-town structures");
  assert(Array.isArray(world.services) && world.services.length === 13, "expected 13 authored starter-town services");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.mining) && world.resourceNodes.mining.length === 114, "expected 114 authored mining nodes");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) && world.resourceNodes.woodcutting.length === 82, "expected 82 authored woodcutting nodes");
  assert(Array.isArray(world.skillRoutes.fishing) && world.skillRoutes.fishing.length === 3, "expected 3 fishing routes");
  assert(Array.isArray(world.skillRoutes.cooking) && world.skillRoutes.cooking.length === 4, "expected 4 cooking routes");
  assert(Array.isArray(world.skillRoutes.mining) && world.skillRoutes.mining.length === 6, "expected 6 mining routes");
  assert(Array.isArray(world.skillRoutes.runecrafting) && world.skillRoutes.runecrafting.length === 4, "expected 4 runecrafting routes");
  assert(Array.isArray(world.skillRoutes.woodcutting) && world.skillRoutes.woodcutting.length === 5, "expected 5 woodcutting routes");
  assert(Array.isArray(world.landmarks.altars) && world.landmarks.altars.length === 4, "expected 4 authored altars");
  assert(Array.isArray(world.landmarks.showcaseTrees) && world.landmarks.showcaseTrees.length === 5, "expected 5 showcase trees");

  const structureById = Object.fromEntries(world.structures.map((entry) => [entry.structureId, entry]));
  assert(structureById.castle_ground.x === 190 && structureById.castle_ground.y === 190, "castle ground placement mismatch");
  assert(structureById.general_store.x === 177 && structureById.general_store.y === 232, "general store placement mismatch");
  assert(structureById.smithing_hall.x === 221 && structureById.smithing_hall.y === 228, "smithing hall placement mismatch");

  const fishingById = Object.fromEntries(world.skillRoutes.fishing.map((entry) => [entry.routeId, entry]));
  assert(fishingById.castle_pond_bank.alias === "pond", "pond alias mismatch");
  assert(fishingById.castle_pond_pier.x === 205 && fishingById.castle_pond_pier.y === 230, "pier route mismatch");
  assert(fishingById.castle_pond_deep_edge.y === 231, "deep fishing route mismatch");

  const cookingById = Object.fromEntries(world.skillRoutes.cooking.map((entry) => [entry.routeId, entry]));
  assert(cookingById.starter_campfire.x === 199 && cookingById.starter_campfire.y === 224, "campfire anchor mismatch");
  assert(cookingById.riverbank_fire_line.fireTiles.length === 3, "river fire line tile count mismatch");
  assert(cookingById.deep_water_dock_fire_line.x === 205 && cookingById.deep_water_dock_fire_line.y === 229, "deep dock anchor mismatch");

  const servicesById = Object.fromEntries(world.services.map((entry) => [entry.serviceId, entry]));
  assert(servicesById["merchant:general_store"].x === 181 && servicesById["merchant:general_store"].y === 235, "general store service mismatch");
  assert(servicesById["merchant:starter_caravan_guide"].travelToWorldId === "north_road_camp", "starter caravan travel target mismatch");
  assert(servicesById["station:starter_furnace"].footprintW === 2, "furnace footprint mismatch");
  assert(servicesById["merchant:borin_ironvein"].merchantId === "borin_ironvein", "smithing merchant mismatch");
  assert(servicesById["merchant:rune_tutor"].x === 203 && servicesById["merchant:rune_tutor"].y === 152, "rune tutor authored placement mismatch");
  assert(servicesById["merchant:combination_sage"].x === 91 && servicesById["merchant:combination_sage"].y === 23, "combination sage authored placement mismatch");

  const miningIds = world.skillRoutes.mining.map((entry) => entry.routeId).join(",");
  assert(miningIds === "starter_mine,iron_mine,coal_mine,precious_mine,gem_mine,rune_essence_mine", "starter mining route order mismatch");
  const altarIds = world.skillRoutes.runecrafting.map((entry) => entry.routeId).join(",");
  assert(altarIds === "ember_altar,water_altar,earth_altar,air_altar", "starter runecrafting route order mismatch");
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
  assert(Array.isArray(world.services) && world.services.length === 5, "expected 5 north-road services");
  assert(Array.isArray(world.skillRoutes.fishing) && world.skillRoutes.fishing.length === 1, "expected 1 north-road fishing route");
  assert(Array.isArray(world.skillRoutes.cooking) && world.skillRoutes.cooking.length === 1, "expected 1 north-road cooking route");
  assert(Array.isArray(world.skillRoutes.mining) && world.skillRoutes.mining.length === 2, "expected 2 north-road mining routes");
  assert(Array.isArray(world.skillRoutes.runecrafting) && world.skillRoutes.runecrafting.length === 1, "expected 1 north-road runecrafting route");
  assert(Array.isArray(world.skillRoutes.woodcutting) && world.skillRoutes.woodcutting.length === 1, "expected 1 north-road woodcutting route");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.mining) && world.resourceNodes.mining.length === 12, "expected 12 north-road mining nodes");
  assert(world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) && world.resourceNodes.woodcutting.length === 6, "expected 6 north-road woodcutting nodes");
  assert(Array.isArray(world.landmarks.altars) && world.landmarks.altars.length === 1, "expected 1 north-road altar");
  assert(Array.isArray(world.landmarks.showcaseTrees) && world.landmarks.showcaseTrees.length === 2, "expected 2 north-road showcase trees");

  const structure = world.structures[0];
  assert(structure.structureId === "north_road_outpost" && structure.x === 200 && structure.y === 206, "north-road outpost placement mismatch");

  const servicesById = Object.fromEntries(world.services.map((entry) => [entry.serviceId, entry]));
  assert(servicesById["merchant:north_road_shopkeeper"].x === 203 && servicesById["merchant:north_road_shopkeeper"].y === 209, "north-road shopkeeper placement mismatch");
  assert(servicesById["merchant:north_road_caravan_guide"].travelToWorldId === "starter_town", "north-road caravan travel target mismatch");
  assert(servicesById["merchant:prospector_dain"].merchantId === "borin_ironvein", "north-road prospector merchant mismatch");
  assert(servicesById["station:north_road_furnace"].footprintW === 2 && servicesById["station:north_road_furnace"].footprintD === 2, "north-road furnace footprint mismatch");

  const miningIds = world.skillRoutes.mining.map((entry) => entry.routeId).join(",");
  assert(miningIds === "outpost_quarry,crystal_seam", "north-road mining route order mismatch");
  const altarIds = world.skillRoutes.runecrafting.map((entry) => entry.routeId).join(",");
  assert(altarIds === "breeze_shrine", "north-road runecrafting route order mismatch");
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
