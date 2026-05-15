const assert = require("assert");

const { __test } = require("../content/validate-world");

const MAIN_OVERWORLD_ROAD_IDS = Object.freeze([
  "starter_town_east_road",
  "starter_town_north_altar_road",
  "starter_town_starter_mine_spur",
  "starter_town_south_resource_road",
  "starter_town_southwest_bank_road",
  "starter_town_southeast_camp_road"
]);

function buildRoad(pathId, offset) {
  return {
    pathId,
    points: [
      { x: 10, y: 10 + offset },
      { x: 20, y: 10 + offset }
    ],
    pathWidth: 2,
    edgeSoftness: 0,
    tileId: "DIRT",
    tags: ["main-overworld", "road", "spawn-protected"]
  };
}

function buildWorld(overrides) {
  return Object.assign({
    terrainPatches: {
      paths: MAIN_OVERWORLD_ROAD_IDS.map((pathId, index) => buildRoad(pathId, index * 8))
    },
    resourceNodes: {
      mining: [],
      woodcutting: []
    },
    landmarks: {
      decorProps: [],
      altars: []
    },
    combatSpawns: []
  }, overrides || {});
}

function assertRoadOverlapRejected(label, overrides, expectedMessage) {
  assert.throws(
    () => __test.validateMainOverworldProtectedRoads("main_overworld", buildWorld(overrides)),
    (error) => error && String(error.message).includes(expectedMessage),
    `${label} should reject protected road overlap`
  );
}

assert(
  __test.collectProtectedRoadTiles("tutorial_island", buildWorld()).size === 0,
  "protected road collection should only apply to the main overworld"
);

assertRoadOverlapRejected(
  "mining node",
  { resourceNodes: { mining: [{ placementId: "ore_on_road", routeId: "starter_ore", nodeId: "copper", x: 15, y: 10 }], woodcutting: [] } },
  "mining node ore_on_road overlaps protected road starter_town_east_road"
);

assertRoadOverlapRejected(
  "woodcutting node",
  { resourceNodes: { mining: [], woodcutting: [{ placementId: "tree_on_road", routeId: "starter_tree", nodeId: "normal_tree", x: 15, y: 10 }] } },
  "woodcutting node tree_on_road overlaps protected road starter_town_east_road"
);

assertRoadOverlapRejected(
  "blocking decor prop",
  { landmarks: { decorProps: [{ propId: "crate_on_road", blocksMovement: true, x: 15, y: 10 }], altars: [] } },
  "blocking decor prop crate_on_road overlaps protected road starter_town_east_road"
);

assertRoadOverlapRejected(
  "blocking service",
  { services: [{ serviceId: "merchant:road_shop", type: "MERCHANT", interactionTarget: "NPC", x: 15, y: 10, z: 0, blocksMovement: true }] },
  "blocking service merchant:road_shop overlaps protected road starter_town_east_road"
);

assertRoadOverlapRejected(
  "combat spawn tile",
  { combatSpawns: [{ spawnNodeId: "rat_on_road", spawnTile: { x: 15, y: 10 }, enemyId: "rat" }] },
  "combat spawn rat_on_road overlaps protected road starter_town_east_road"
);

assertRoadOverlapRejected(
  "combat home tile",
  { combatSpawns: [{ spawnNodeId: "rat_home_on_road", spawnTile: { x: 30, y: 30 }, homeTileOverride: { x: 15, y: 10 }, enemyId: "rat" }] },
  "combat spawn rat_home_on_road home tile overlaps protected road starter_town_east_road"
);

assertRoadOverlapRejected(
  "altar footprint",
  { landmarks: { decorProps: [], altars: [{ routeId: "air_altar_on_road", x: 16, y: 11, variant: 0 }] } },
  "altar air_altar_on_road footprint overlaps protected road starter_town_east_road"
);

console.log("Protected road validation guards passed.");
