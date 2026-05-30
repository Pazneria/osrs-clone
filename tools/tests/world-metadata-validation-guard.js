const assert = require("assert");

const { MAP_SIZE } = require("../content/world-constants");
const { __test } = require("../content/validate-world");

function buildWorld(overrides) {
  return Object.assign({
    lore: {
      title: "Test Province",
      summary: "A focused fixture for world metadata validation.",
      pillars: [
        {
          pillarId: "roads",
          label: "Roads",
          summary: "Roads should carry authored history."
        }
      ]
    },
    areas: [
      {
        areaId: "starter_town",
        label: "Starter Town",
        mapPosition: {
          coordinateSpace: "authored_raw_486",
          anchorTile: { tileX: 10, tileY: 12, tileZ: 0 },
          bounds: { west: 5, east: 20, north: 8, south: 22 }
        },
        adjacentAreaIds: ["north_woods"],
        resourceAnchors: [
          {
            anchorId: "starter_mine",
            label: "Starter Mine",
            tileX: 11,
            tileY: 13,
            tileZ: 0,
            kind: "mining"
          }
        ]
      },
      {
        areaId: "north_woods",
        label: "North Woods",
        containsAreaIds: ["starter_town"]
      }
    ]
  }, overrides || {});
}

function assertRejected(label, mutate, expectedMessage) {
  const world = buildWorld();
  mutate(world);
  assert.throws(
    () => {
      __test.validateWorldLoreMetadata("test_world", world);
      __test.validateWorldAreaMetadata("test_world", world);
    },
    (error) => error && String(error.message).includes(expectedMessage),
    `${label} should reject invalid world metadata`
  );
}

__test.validateWorldLoreMetadata("test_world", buildWorld());
__test.validateWorldAreaMetadata("test_world", buildWorld());

assertRejected(
  "duplicate lore pillar",
  (world) => {
    world.lore.pillars.push({
      pillarId: "roads",
      label: "Road Memory Duplicate",
      summary: "Duplicate ids should be rejected."
    });
  },
  "duplicate lore pillar roads"
);

assertRejected(
  "invalid lore pillar list",
  (world) => {
    world.lore.pillars = { pillarId: "roads" };
  },
  "lore.pillars must be an array"
);

assertRejected(
  "empty lore tone entry",
  (world) => {
    world.lore.tone = ["frontier", " "];
  },
  "lore tone[1] must be a non-empty string"
);

assertRejected(
  "unknown adjacent area",
  (world) => {
    world.areas[0].adjacentAreaIds = ["missing_area"];
  },
  "area starter_town references unknown area missing_area"
);

assertRejected(
  "self-referencing contained area",
  (world) => {
    world.areas[0].containsAreaIds = ["starter_town"];
  },
  "area starter_town containsAreaIds[0] must not reference itself"
);

assertRejected(
  "unsupported map coordinate space",
  (world) => {
    world.areas[0].mapPosition.coordinateSpace = "runtime_scaled";
  },
  "area starter_town has unsupported mapPosition coordinateSpace"
);

assertRejected(
  "anchor outside map bounds",
  (world) => {
    world.areas[0].mapPosition.anchorTile.tileX = 21;
  },
  "area starter_town anchorTile.tileX must sit inside bounds"
);

assertRejected(
  "inverted map bounds",
  (world) => {
    world.areas[0].mapPosition.bounds.east = 5;
  },
  "area starter_town mapPosition bounds are inverted"
);

assertRejected(
  "duplicate resource anchor",
  (world) => {
    world.areas[0].resourceAnchors.push({
      anchorId: "starter_mine",
      label: "Starter Mine Copy",
      tileX: 12,
      tileY: 13
    });
  },
  "area starter_town duplicate resource anchor starter_mine"
);

assertRejected(
  "resource anchors without map bounds",
  (world) => {
    delete world.areas[0].mapPosition;
  },
  "area starter_town resourceAnchors require mapPosition bounds"
);

assertRejected(
  "empty resource anchors without map bounds",
  (world) => {
    world.areas[0].resourceAnchors = [];
    delete world.areas[0].mapPosition;
  },
  "area starter_town resourceAnchors require mapPosition bounds"
);

assertRejected(
  "resource anchor outside authored map",
  (world) => {
    world.areas[0].resourceAnchors[0].tileX = MAP_SIZE;
  },
  "area starter_town resource anchor starter_mine tile.tileX is outside the authored map"
);

assertRejected(
  "resource anchor outside area bounds",
  (world) => {
    world.areas[0].resourceAnchors[0].tileY = 23;
  },
  "area starter_town resource anchor starter_mine tile.tileY must sit inside bounds"
);

console.log("World metadata validation guards passed.");
