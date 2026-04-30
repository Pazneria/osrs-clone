const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makePlane(size, fill = 0) {
  return Array(size).fill(0).map(() => Array(size).fill(fill));
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "logical-map-authoring-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const authoringRuntimeIndex = manifestSource.indexOf('id: "world-logical-map-authoring-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(authoringRuntimeIndex !== -1, "legacy manifest should include the logical-map authoring runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(authoringRuntimeIndex < worldIndex, "legacy manifest should load logical-map authoring before world.js");
  assert(runtimeSource.includes("window.WorldLogicalMapAuthoringRuntime"), "logical-map authoring runtime should expose a window runtime");
  assert(runtimeSource.includes("function applyFishingMerchantSpots(options = {})"), "logical-map authoring runtime should own fishing merchant placement");
  assert(runtimeSource.includes("function stampBlueprint(options = {})"), "logical-map authoring runtime should own blueprint stamping");
  assert(runtimeSource.includes("function applyStaticWorldAuthoring(options = {})"), "logical-map authoring runtime should own static world authoring");
  assert(runtimeSource.includes("function applyAuthoredAltarCollision(options = {})"), "logical-map authoring runtime should own altar collision stamping");
  assert(worldSource.includes("WorldLogicalMapAuthoringRuntime"), "world.js should resolve the logical-map authoring runtime");
  assert(worldSource.includes("worldLogicalMapAuthoringRuntime.applyFishingMerchantSpots"), "world.js should delegate fishing merchant authoring");
  assert(worldSource.includes("worldLogicalMapAuthoringRuntime.applyStaticWorldAuthoring"), "world.js should delegate static map authoring");
  assert(worldSource.includes("worldLogicalMapAuthoringRuntime.applyAuthoredAltarCollision"), "world.js should delegate authored altar collision");
  assert(!worldSource.includes("function stampBlueprint("), "world.js should not own blueprint stamping inline");
  assert(!worldSource.includes("function applyFenceLandmark("), "world.js should not own fence landmark stamping inline");
  assert(!worldSource.includes("logicalMap[altar.z][by][bx] = TileId.OBSTACLE"), "world.js should not stamp altar collision inline");
  assert(!worldSource.includes("const staticMerchantSpots = worldPayload.staticMerchantSpots"), "world.js should not own static merchant placement loops inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "logical-map-authoring-runtime.js") });
  const runtime = window.WorldLogicalMapAuthoringRuntime;
  assert(runtime, "logical-map authoring runtime should be available after evaluation");

  const tileIds = {
    GRASS: 0,
    OBSTACLE: 5,
    FLOOR_WOOD: 6,
    FLOOR_STONE: 7,
    BANK_BOOTH: 9,
    WALL: 11,
    TOWER: 12,
    STAIRS_UP: 13,
    STAIRS_DOWN: 14,
    STAIRS_RAMP: 15,
    SOLID_NPC: 16,
    SHOP_COUNTER: 17,
    SHORE: 20,
    FENCE: 23,
    WOODEN_GATE_CLOSED: 24,
    WOODEN_GATE_OPEN: 25
  };
  const mapSize = 18;
  const logicalMap = [makePlane(mapSize, tileIds.GRASS), makePlane(mapSize, tileIds.GRASS)];
  const heightMap = [makePlane(mapSize, 0), makePlane(mapSize, 0)];
  const remembered = [];
  const rememberStaticNpcBaseTile = (x, y, z, tileId) => remembered.push({ x, y, z, tileId });

  const fishingResult = runtime.applyFishingMerchantSpots({
    fishingMerchantSpots: [{ type: 4, x: 4, y: 4, name: "Fisher", merchantId: "fisher", appearanceId: "fisher", dialogueId: "fish_talk" }],
    heightMap,
    logicalMap,
    mapSize,
    npcsToRender: [],
    rememberStaticNpcBaseTile,
    tileIds
  });
  assert(logicalMap[0][4][4] === tileIds.SOLID_NPC, "fishing merchant should reserve an NPC collision tile");
  assert(heightMap[0][4][4] === -0.01, "fishing merchant should force shoreline height");
  assert(remembered.some((entry) => entry.x === 4 && entry.y === 4 && entry.tileId === tileIds.SHORE), "fishing merchant should remember the forced shore base tile");
  assert(fishingResult.npcsToRender[0].action === "Trade", "fishing merchant should default to trade action");

  const roofLandmarks = [{ x: 2, y: 2, hideBounds: { xMin: 1, xMax: 3, yMin: 1, yMax: 3 } }];
  const staticResult = runtime.applyStaticWorldAuthoring({
    bankBoothsToRender: [],
    doorLandmarks: [{
      x: 9,
      y: 9,
      z: 0,
      tileId: "WOODEN_GATE_OPEN",
      height: 0.2,
      isOpen: true,
      currentRotation: 1.1,
      targetRotation: 1.1,
      tutorialRequiredStep: 2,
      tutorialGateMessage: "Locked"
    }],
    doorsToRender: [],
    fenceLandmarks: [{ z: 0, height: 0.1, points: [{ x: 1, y: 12 }, { x: 3, y: 12 }] }],
    heightMap,
    logicalMap,
    mapSize,
    npcsToRender: fishingResult.npcsToRender,
    rememberStaticNpcBaseTile,
    roofLandmarks,
    smithingHallApproach: { shoreX: 6, stairX: 7, yStart: 11, yEnd: 12 },
    smithingStations: [{ type: "FURNACE", x: 10, y: 4, footprintW: 2, footprintD: 2 }],
    staircaseLandmarks: [{ tiles: [{ x: 8, y: 8, z: 0, tileId: "BANK_BOOTH", height: 0.25 }] }],
    stampMap: { shop: ["BN$", "WCV"] },
    stampedStructures: [{ structureId: "shop", stampId: "shop", x: 3, y: 3, z: 0 }],
    staticMerchantSpots: [{ type: 6, x: 5, y: 10, name: "Smith", merchantId: "smith", tags: ["smithing"] }],
    tileIds
  });

  assert(logicalMap[0][3][3] === tileIds.BANK_BOOTH, "blueprint B should stamp a bank booth");
  assert(staticResult.bankBoothsToRender.some((booth) => booth.x === 3 && booth.y === 3), "blueprint bank booths should be published for rendering");
  assert(logicalMap[0][3][4] === tileIds.SOLID_NPC, "blueprint N should reserve banker collision");
  assert(staticResult.npcsToRender.some((npc) => npc.name === "Banker"), "blueprint N should publish banker NPC render data");
  assert(staticResult.npcsToRender.some((npc) => npc.name === "Shopkeeper"), "blueprint $ should publish shopkeeper NPC render data");
  assert(logicalMap[0][4][3] === tileIds.WALL && logicalMap[0][4][4] === tileIds.TOWER, "blueprint walls and towers should be stamped");
  assert(logicalMap[0][4][5] === tileIds.SHOP_COUNTER, "blueprint shop counter should be stamped");
  assert(logicalMap[0][4][10] === tileIds.SOLID_NPC && logicalMap[0][5][11] === tileIds.SOLID_NPC, "furnace footprint should reserve collision");
  assert(logicalMap[0][10][5] === tileIds.SOLID_NPC && heightMap[0][10][5] === 0.5, "static merchant should reserve raised smithing collision");
  assert(logicalMap[0][8][8] === tileIds.BANK_BOOTH && heightMap[0][8][8] === 0.25, "staircase landmark tiles should stamp tile and height");
  assert(logicalMap[0][12][1] === tileIds.FENCE && logicalMap[0][12][3] === tileIds.FENCE, "fence landmarks should stamp straight segments");
  assert(logicalMap[0][11][6] === tileIds.SHORE && logicalMap[0][12][7] === tileIds.STAIRS_RAMP, "smithing hall approach should stamp shore and stairs");
  assert(logicalMap[0][9][9] === tileIds.WOODEN_GATE_OPEN, "door landmarks should stamp door tile ids");
  assert(staticResult.doorsToRender[0].isWoodenGate && staticResult.doorsToRender[0].closedTileId === tileIds.WOODEN_GATE_CLOSED, "door render data should preserve wooden gate metadata");
  staticResult.activeRoofLandmarks[0].hideBounds.xMin = 99;
  assert(roofLandmarks[0].hideBounds.xMin === 1, "roof landmarks should be cloned for runtime ownership");

  const altarResult = runtime.applyAuthoredAltarCollision({
    authoredAltarPlacements: [{ x: 12, y: 12, z: 0, label: "Air altar" }],
    logicalMap,
    mapSize,
    tileIds
  });
  assert(logicalMap[0][11][11] === tileIds.OBSTACLE && logicalMap[0][14][14] === tileIds.OBSTACLE, "altar collision should stamp the 4x4 footprint");
  assert(altarResult.altarCandidatesToRender.length === 1 && altarResult.altarCandidatesToRender[0].label === "Air altar", "altar render candidates should be preserved");

  console.log("World logical-map authoring runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
