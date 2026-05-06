const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const { loadTsModule } = require("../lib/ts-module-loader");
const { TileId } = require("../content/tile-ids");
const { buildWorldGameplayMap } = require("../content/world-map-builder");
const { findShortestPathLength, isWalkable } = require("../content/world-pathing");
const { loadWorldContent } = require("../content/world-content");

const root = path.resolve(__dirname, "..", "..");
const authoring = loadTsModule(path.join(root, "src", "game", "world", "authoring.ts"));
const manifest = require(path.join(root, "content", "world", "manifest.json"));
const starterTown = require(path.join(root, "content", "world", "regions", "main_overworld.json"));
const tutorialIsland = require(path.join(root, "content", "world", "regions", "tutorial_island.json"));

const WORLD_COORD_SCALE = 648 / 486;
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
  combination_sage_hut_stairs: { x: 148, y: 182, z: 0, tileId: "STAIRS_RAMP", height: 0.25 },
  distributed_bank_booths: { x: 362, y: 252, z: 0, tileId: "BANK_BOOTH", height: 0.05 }
});

const STARTER_TOWN_NAMED_NPC_LAYOUT = Object.freeze({
  "merchant:general_store": { x: 170, y: 239, z: 0, dialogueId: "shopkeeper", scaledX: 225, scaledY: 316 },
  "merchant:fletching_supplier": { x: 183, y: 238, z: 0, dialogueId: "fletching_supplier", scaledX: 242, scaledY: 315 },
  "merchant:starter_caravan_guide": { x: 223, y: 221, z: 0, dialogueId: "road_guide", scaledX: 297, scaledY: 293 },
  "merchant:east_outpost_caravan_guide": { x: 260, y: 257, z: 0, dialogueId: "outpost_guide", scaledX: 346, scaledY: 340 },
  "merchant:advanced_fletcher": { x: 365, y: 253, z: 0, dialogueId: "advanced_fletcher", scaledX: 485, scaledY: 336 },
  "merchant:advanced_woodsman": { x: 366, y: 255, z: 0, dialogueId: "advanced_woodsman", scaledX: 486, scaledY: 338 },
  "merchant:fishing_teacher": { x: 170, y: 221, z: 0, dialogueId: "fishing_teacher", scaledX: 226, scaledY: 293 },
  "merchant:fishing_supplier": { x: 234, y: 221, z: 0, dialogueId: "fishing_supplier", scaledX: 311, scaledY: 293 },
  "merchant:forester_teacher": { x: 219, y: 205, z: 0, dialogueId: "forester_teacher", scaledX: 282, scaledY: 268 },
  "merchant:borin_ironvein": { x: 246, y: 227, z: 0, dialogueId: "borin_ironvein", scaledX: 327, scaledY: 300 },
  "merchant:thrain_deepforge": { x: 272, y: 257, z: 0, dialogueId: "thrain_deepforge", scaledX: 361, scaledY: 340 },
  "merchant:elira_gemhand": { x: 170, y: 195, z: 0, dialogueId: "elira_gemhand", scaledX: 226, scaledY: 258 },
  "merchant:crafting_teacher": { x: 179, y: 250, z: 0, dialogueId: "crafting_teacher", scaledX: 238, scaledY: 331 },
  "merchant:tanner_rusk": { x: 247, y: 237, z: 0, dialogueId: "tanner_rusk", appearanceId: "tanner_rusk", scaledX: 328, scaledY: 314 },
  "merchant:rune_tutor": { x: 218, y: 181, z: 0, dialogueId: "rune_tutor", scaledX: 290, scaledY: 240 },
  "merchant:combination_sage": { x: 148, y: 181, z: 0, dialogueId: "combination_sage", scaledX: 197, scaledY: 240 }
});

const STARTER_TOWN_BANK_LAYOUT = Object.freeze({
  "bank:east_outpost": { spawnId: "npc:banker_east_outpost", x: 364, y: 252, z: 0, scaledX: 484, scaledY: 335 },
  "bank:willow_bend": { spawnId: "npc:banker_willow_bend", x: 244, y: 66, z: 0, scaledX: 325, scaledY: 88 },
  "bank:maple_ridge": { spawnId: "npc:banker_maple_ridge", x: 399, y: 205, z: 0, scaledX: 532, scaledY: 273 },
  "bank:yew_frontier": { spawnId: "npc:banker_yew_frontier", x: 58, y: 16, z: 0, scaledX: 77, scaledY: 21 },
  "bank:south_field": { spawnId: "npc:banker_south_field", x: 256, y: 444, z: 0, scaledX: 341, scaledY: 592 },
  "bank:west_range": { spawnId: "npc:banker_west_range", x: 64, y: 456, z: 0, scaledX: 85, scaledY: 608 },
  "bank:southeast_camp": { spawnId: "npc:banker_southeast_camp", x: 416, y: 430, z: 0, scaledX: 555, scaledY: 573 },
  "bank:air_altar": { spawnId: "npc:banker_air_altar", x: 96, y: 31, z: 0, scaledX: 128, scaledY: 41 }
});

function scaleAxis(value) {
  return Math.round(value * WORLD_COORD_SCALE);
}

function scaleRadius(value) {
  return Math.max(0.05, Number((value * WORLD_COORD_SCALE).toFixed(3)));
}

function loadNpcDialogueCatalog() {
  const absPath = path.join(root, "src", "js", "content", "npc-dialogue-catalog.js");
  const sandbox = { window: {}, console };
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInNewContext(source, sandbox, { filename: absPath });
  return sandbox.window && sandbox.window.NpcDialogueCatalog ? sandbox.window.NpcDialogueCatalog : null;
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
  const dialogueCatalog = loadNpcDialogueCatalog();
  const tutorialManifestEntry = manifest.worlds.find((entry) => entry.worldId === "tutorial_island");
  const rawGuide = tutorialIsland.services.find((entry) => entry.serviceId === "merchant:tutorial_guide");
  const scaledGuide = tutorialDefinition.services.find((entry) => entry.serviceId === "merchant:tutorial_guide");
  const servicesById = Object.fromEntries(tutorialIsland.services.map((entry) => [entry.serviceId, entry]));

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
  assert.strictEqual(tutorialIsland.services.length, 10, "raw tutorial island surface-v2 should include all surface tutors and smithing stations");
  const tutorialLessonGates = tutorialIsland.landmarks.doors.filter((door) => Number.isFinite(door.tutorialRequiredStep) && door.tileId === "WOODEN_GATE_CLOSED");
  assert.strictEqual(tutorialIsland.combatSpawns.length, 3, "raw tutorial island surface-v2 should include a small surface combat yard");
  assert.strictEqual(tutorialIsland.resourceNodes.mining.length, 4, "raw tutorial island surface-v2 should include a small surface quarry");
  assert.strictEqual(tutorialIsland.resourceNodes.woodcutting.length, 6, "raw tutorial island should include a denser survival-field grove");
  assert.strictEqual(tutorialIsland.structures.length, 1, "raw tutorial island should include the starting cabin structure");
  assert.strictEqual(tutorialIsland.structures[0].stampId, "tutorial_start_cabin", "raw tutorial island cabin should use the tutorial cabin stamp");
  assert.strictEqual(tutorialLessonGates.length, 5, "raw tutorial island surface-v2 should include arrival, quarry, combat, bank, and exit gates");
  assert.ok(tutorialLessonGates.every((door) => door.tileId === "WOODEN_GATE_CLOSED"), "tutorial lesson gates should use wooden gate tiles");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_arrival_to_survival_field" && door.tutorialRequiredStep === 1), "surface-v2 should gate the survival field after arrival");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_survival_to_quarry_yard" && door.tutorialRequiredStep === 4), "surface-v2 should gate the quarry yard after cooking");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_quarry_to_combat_yard" && door.tutorialRequiredStep === 5), "surface-v2 should gate combat after mining and smithing");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_combat_to_bank" && door.tutorialRequiredStep === 6), "surface-v2 should gate banking after combat");
  assert.ok(tutorialLessonGates.some((door) => door.landmarkId === "tutorial_gate_bank_to_exit" && door.tutorialRequiredStep === 7), "surface-v2 should keep the final exit behind the banking proof");
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
  const tutorialCabinRoof = Array.isArray(tutorialIsland.landmarks.roofs)
    ? tutorialIsland.landmarks.roofs.find((roof) => roof.landmarkId === "tutorial_start_cabin_roof")
    : null;
  assert.ok(tutorialCabinRoof && tutorialCabinRoof.hideWhenPlayerInside === true, "tutorial cabin should author a hideable roof");
  assert.strictEqual(tutorialCabinRoof.height, 3.02, "tutorial cabin roof eaves should sit just above the 3.0-tile cabin walls");
  assert.ok(Array.isArray(tutorialIsland.landmarks.caveOpenings) && tutorialIsland.landmarks.caveOpenings.length === 0, "tutorial island surface-v2 should keep the full tutorial loop on the surface");
  assert.ok(Array.isArray(tutorialIsland.landmarks.decorProps) && tutorialIsland.landmarks.decorProps.length === 10, "tutorial island should author focused arrival, grove, and quarry decorative props");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_cabin_desk" && prop.kind === "desk" && prop.blocksMovement === true), "tutorial cabin should include a blocking tutor desk prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_cabin_tool_rack" && prop.kind === "tool_rack" && prop.blocksMovement === true), "tutorial cabin tool rack should block movement");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_arrival_notice_board" && prop.kind === "notice_board"), "tutorial arrival yard should include a notice board prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_grove_chopping_block" && prop.kind === "chopping_block" && prop.blocksMovement === true), "tutorial grove should include a blocking chopping block prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_grove_woodpile" && prop.kind === "woodpile" && prop.blocksMovement === true), "tutorial grove should include a blocking woodpile prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_tool_rack" && prop.kind === "tool_rack" && prop.blocksMovement === true), "tutorial quarry should include a blocking mining tool rack prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_ore_pile" && prop.kind === "ore_pile" && prop.blocksMovement === false), "tutorial quarry should include a non-blocking sorted ore pile prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_coal_bin" && prop.kind === "coal_bin" && prop.blocksMovement === true), "tutorial quarry should include a blocking coal bin prop");
  assert.ok(tutorialIsland.landmarks.decorProps.some((prop) => prop.propId === "tutorial_quarry_barrel" && prop.kind === "barrel" && prop.blocksMovement === true), "tutorial quarry should include a blocking quench barrel prop");
  assert.ok(
    !tutorialIsland.landmarks.staircases.some((landmark) => landmark.landmarkId === "tutorial_fences" || landmark.tiles.some((tile) => tile.tileId === "WALL" && tile.height === 0.2)),
    "tutorial island should not use WALL landmark tiles as pseudo fences"
  );
  assert.strictEqual(tutorialIsland.landmarks.altars.length, 0, "raw tutorial island should not include runecrafting altars");
  assert.deepStrictEqual(tutorialIsland.skillRoutes.runecrafting, [], "raw tutorial island should not include runecrafting routes");
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
    assert.strictEqual(routeById.tutorial_altar, undefined, "surface grid should not place a tutorial altar");
    assert.ok(servicesById["merchant:tutorial_bank_tutor"].x >= 190 && servicesById["merchant:tutorial_bank_tutor"].x <= 215 && servicesById["merchant:tutorial_bank_tutor"].y >= 320, "surface grid should keep the bank tutor in the south-west bank area");
    assert.ok(servicesById["merchant:tutorial_exit_guide"].x >= 240 && servicesById["merchant:tutorial_exit_guide"].y >= 330, "surface grid should keep the exit guide near the south bank exit");
  }
  assert.strictEqual(dialogueCatalog.resolveDialogueId(rawGuide.dialogueId), "tutorial_guide", "tutorial guide dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_woodcutting_instructor"].dialogueId), "tutorial_woodcutting_instructor", "woodcutting instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_fishing_instructor"].dialogueId), "tutorial_fishing_instructor", "fishing instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_firemaking_instructor"].dialogueId), "tutorial_firemaking_instructor", "firemaking instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_mining_smithing_instructor"].dialogueId), "tutorial_mining_smithing_instructor", "mining and smithing instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_combat_instructor"].dialogueId), "tutorial_combat_instructor", "combat instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_bank_tutor"].dialogueId), "tutorial_bank_tutor", "bank tutor dialogue should resolve");
  assert.ok(
    fs.readFileSync(path.join(root, "src", "js", "world", "logical-map-authoring-runtime.js"), "utf8").includes("!spot.tags.includes('tutorial')"),
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
    { x: scaleAxis(rawGuide.travelSpawn.x), y: scaleAxis(rawGuide.travelSpawn.y), z: rawGuide.travelSpawn.z },
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
  assert.strictEqual(tutorialDefinition.landmarks.caveOpenings.length, 0, "scaled tutorial island should preserve the no-cave surface-v2 layout");
  assert.ok(
    Array.isArray(tutorialDefinition.terrainPatches.paths)
      && tutorialDefinition.terrainPatches.paths.some((pathPatch) => pathPatch.pathId === "tutorial_fire_to_quarry_path" && pathPatch.points[2].x === scaleAxis(352))
      && tutorialDefinition.terrainPatches.paths.some((pathPatch) => pathPatch.pathId === "tutorial_quarry_work_apron" && pathPatch.points[1].x === scaleAxis(352)),
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
  assert.strictEqual(gameplayMap[0][178][140], TileId.DOOR_CLOSED, "tutorial cabin exit should start as a closed normal door tile");
  assert.strictEqual(isWalkable(gameplayMap, 140, 178, 0), false, "closed tutorial cabin doors should block movement before the guide clears the player");
  gameplayMap[0][178][140] = TileId.DOOR_OPEN;
  assert.strictEqual(isWalkable(gameplayMap, 140, 178, 0), true, "open tutorial cabin doors should be walkable after the guide clears the player");
  assert.strictEqual(gameplayMap[0][186][176], TileId.WOODEN_GATE_CLOSED, "tutorial gates should expand into closed wooden gate tiles");
  assert.strictEqual(isWalkable(gameplayMap, 176, 186, 0), false, "closed wooden gates should block movement");
  gameplayMap[0][186][176] = TileId.WOODEN_GATE_OPEN;
  assert.strictEqual(isWalkable(gameplayMap, 176, 186, 0), true, "open wooden gates should be walkable");
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
  assert.strictEqual(scaledTutorialMap[0][384][475], TileId.DIRT, "expanded tutorial mining route anchor should land on the walkable quarry apron, not pond water");
  assert.notStrictEqual(scaledTutorialMap[0][288][356], TileId.GRASS, "raw tutorial mining coordinates should not be treated as the expanded-world quarry anchor");
  for (const gate of scaledTutorialDefinition.landmarks.doors) {
    if (Number.isFinite(gate.tutorialRequiredStep) && gate.tutorialRequiredStep <= 4 && gate.tileId === "WOODEN_GATE_CLOSED") {
      scaledTutorialMap[gate.z][gate.y][gate.x] = TileId.WOODEN_GATE_OPEN;
    }
  }
  assert.strictEqual(
    findShortestPathLength(scaledTutorialMap, { x: 475, y: 384, z: 0 }, { x: 475, y: 520, z: 0 }, {
      maxDistance: 220,
      maxVisited: 50000,
      allowedBounds: { xMin: 92, xMax: 568, yMin: 164, yMax: 492, z: 0 }
    }),
    null,
    "tutorial movement bounds should prevent pathing from the mine approach into the surrounding sea"
  );
  const inputPathfindingRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-pathfinding-runtime.js"), "utf8");
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
  const dialogueCatalog = loadNpcDialogueCatalog();
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

  const rawTrainingDummy = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_training_dummy_hub");
  const rawChicken = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_chicken_south_field");
  const rawBoar = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_east_field_center");
  const rawWolf = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_wolf_outer_north");
  const rawBoarWestNorth = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_north");
  const rawBoarWestSouth = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_west_south");
  const rawBoarEastNorth = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_boar_outer_east_north");
  const rawSoutheastCampAnchor = rawCombatSpawns.find((entry) => entry.spawnNodeId === "enemy_spawn_heavy_brute_southeast_camp_anchor");

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
  });
  assert.deepStrictEqual(
    { x: scaledTrainingDummy.spawnTile.x, y: scaledTrainingDummy.spawnTile.y, z: scaledTrainingDummy.spawnTile.z },
    { x: 273, y: 274, z: 0 },
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
}

console.log("World authoring domain tests passed.");
