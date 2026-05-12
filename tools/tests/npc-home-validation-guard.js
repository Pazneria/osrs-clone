const assert = require("assert");

const { __test } = require("../content/validate-world");

function buildWorld(serviceOverrides) {
  return {
    structures: [
      { structureId: "general_store" }
    ],
    areas: [
      { areaId: "starter_grove" }
    ],
    skillRoutes: {
      mining: [
        { routeId: "starter_mine" }
      ]
    },
    landmarks: {
      staircases: [
        { landmarkId: "bank_stairs" }
      ],
      doors: [],
      fences: [],
      roofs: [],
      caveOpenings: [],
      decorProps: [
        { propId: "road_sign" }
      ]
    },
    services: [
      Object.assign({
        serviceId: "merchant:general_store",
        type: "MERCHANT",
        interactionTarget: "NPC",
        tags: ["home:general_store"]
      }, serviceOverrides || {})
    ]
  };
}

function assertNpcHomeRejected(label, serviceOverrides, expectedMessage) {
  assert.throws(
    () => __test.validateMainOverworldNpcHomeTags("main_overworld", buildWorld(serviceOverrides)),
    (error) => error && String(error.message).includes(expectedMessage),
    `${label} should reject invalid NPC home tags`
  );
}

__test.validateMainOverworldNpcHomeTags("tutorial_island", buildWorld({ tags: [] }));
__test.validateMainOverworldNpcHomeTags("main_overworld", buildWorld());

assertNpcHomeRejected(
  "missing home tag",
  { tags: [] },
  "NPC service merchant:general_store must define exactly one home:<id> tag"
);

assertNpcHomeRejected(
  "duplicate home tags",
  { tags: ["home:general_store", "home:starter_grove"] },
  "NPC service merchant:general_store must define exactly one home:<id> tag"
);

assertNpcHomeRejected(
  "unknown home target",
  { tags: ["home:missing_house"] },
  "NPC service merchant:general_store references unknown home target missing_house"
);

console.log("NPC home validation guards passed.");
