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
  combination_sage_hut_stairs: { x: 148, y: 182, z: 0, tileId: "STAIRS_RAMP", height: 0.25 }
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
  assert.deepStrictEqual(
    scaledTutorialSpawn,
    {
      x: scaleAxis(tutorialManifestEntry.defaultSpawn.x),
      y: scaleAxis(tutorialManifestEntry.defaultSpawn.y),
      z: tutorialManifestEntry.defaultSpawn.z
    },
    "typed authoring should scale tutorial island default spawn"
  );
}

{
  const tutorialDefinition = authoring.getWorldDefinition("tutorial_island");
  const dialogueCatalog = loadNpcDialogueCatalog();
  const rawGuide = tutorialIsland.services.find((entry) => entry.serviceId === "merchant:tutorial_guide");
  const scaledGuide = tutorialDefinition.services.find((entry) => entry.serviceId === "merchant:tutorial_guide");
  const servicesById = Object.fromEntries(tutorialIsland.services.map((entry) => [entry.serviceId, entry]));

  assert.ok(rawGuide, "raw tutorial island should include the tutorial guide");
  assert.ok(scaledGuide, "scaled tutorial island should include the tutorial guide");
  assert.strictEqual(tutorialDefinition.worldId, "tutorial_island", "tutorial island definition id mismatch");
  assert.strictEqual(tutorialIsland.services.length, 10, "raw tutorial island should include guides, instructors, and smithing stations");
  const tutorialLessonGates = tutorialIsland.landmarks.doors.filter((door) => Number.isFinite(door.tutorialRequiredStep));
  assert.strictEqual(tutorialIsland.combatSpawns.length, 2, "raw tutorial island should include tutorial chickens");
  assert.ok(tutorialIsland.combatSpawns.every((entry) => entry.enemyId === "enemy_chicken"), "tutorial island combat should use chickens instead of a dummy");
  assert.strictEqual(tutorialIsland.resourceNodes.mining.length, 2, "raw tutorial island should include copper and tin mining nodes");
  assert.strictEqual(tutorialIsland.resourceNodes.woodcutting.length, 2, "raw tutorial island should include a small tutorial grove");
  assert.strictEqual(tutorialIsland.structures.length, 1, "raw tutorial island should include the starting cabin structure");
  assert.strictEqual(tutorialIsland.structures[0].stampId, "tutorial_start_cabin", "raw tutorial island cabin should use the tutorial cabin stamp");
  assert.strictEqual(tutorialLessonGates.length, 7, "raw tutorial island should include one locked gate per tutorial section transition");
  assert.ok(tutorialLessonGates.every((door) => door.tileId === "WOODEN_GATE_CLOSED"), "tutorial lesson gates should use wooden gate tiles");
  const smithingCombatGate = tutorialLessonGates.find((door) => door.landmarkId === "tutorial_gate_smithing_to_combat");
  assert.ok(smithingCombatGate, "raw tutorial island should include the smithing-to-combat lesson gate");
  assert.strictEqual(smithingCombatGate.isEW, true, "smithing-to-combat gate should remain authored as an east-west wooden gate");
  assert.strictEqual(smithingCombatGate.closedRot, 0, "east-west smithing-to-combat gate should render closed across the fence line");
  assert.strictEqual(smithingCombatGate.openRot, Math.PI / 2, "east-west smithing-to-combat gate should swing open off the fence line");
  assert.ok(tutorialIsland.landmarks.doors.some((door) => door.landmarkId === "tutorial_start_cabin_door" && door.tileId === "DOOR_OPEN" && door.isOpen === true), "tutorial starting cabin should use an open normal door");
  assert.ok(Array.isArray(tutorialIsland.landmarks.fences) && tutorialIsland.landmarks.fences.length >= 7, "tutorial island should author real fence landmarks");
  assert.ok(Array.isArray(tutorialIsland.landmarks.roofs) && tutorialIsland.landmarks.roofs.some((roof) => roof.landmarkId === "tutorial_start_cabin_roof" && roof.hideWhenPlayerInside === true), "tutorial cabin should author a hideable roof");
  assert.ok(
    !tutorialIsland.landmarks.staircases.some((landmark) => landmark.landmarkId === "tutorial_fences" || landmark.tiles.some((tile) => tile.tileId === "WALL" && tile.height === 0.2)),
    "tutorial island should not use WALL landmark tiles as pseudo fences"
  );
  assert.strictEqual(tutorialIsland.landmarks.altars.length, 1, "raw tutorial island should include one altar");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(rawGuide.dialogueId), "tutorial_guide", "tutorial guide dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_woodcutting_instructor"].dialogueId), "tutorial_woodcutting_instructor", "woodcutting instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_fishing_instructor"].dialogueId), "tutorial_fishing_instructor", "fishing instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_firemaking_instructor"].dialogueId), "tutorial_firemaking_instructor", "firemaking instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_mining_smithing_instructor"].dialogueId), "tutorial_mining_smithing_instructor", "mining and smithing instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_combat_instructor"].dialogueId), "tutorial_combat_instructor", "combat instructor dialogue should resolve");
  assert.strictEqual(dialogueCatalog.resolveDialogueId(servicesById["merchant:tutorial_bank_tutor"].dialogueId), "tutorial_bank_tutor", "bank tutor dialogue should resolve");
  assert.ok(
    fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8").includes("!spot.tags.includes('tutorial')"),
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

  const tutorialContent = loadWorldContent(root, "tutorial_island");
  const gameplayMap = buildWorldGameplayMap(tutorialContent.world, tutorialContent.stamps);
  assert.strictEqual(gameplayMap[0][112][124], TileId.FENCE, "tutorial fence lines should expand into FENCE tiles");
  assert.strictEqual(isWalkable(gameplayMap, 124, 112, 0), false, "FENCE tiles should block movement");
  assert.strictEqual(gameplayMap[0][122][118], TileId.DOOR_OPEN, "tutorial cabin exit should expand into an open normal door tile");
  assert.strictEqual(isWalkable(gameplayMap, 118, 122, 0), true, "open tutorial cabin doors should be walkable");
  assert.strictEqual(gameplayMap[0][118][126], TileId.WOODEN_GATE_CLOSED, "tutorial gates should expand into closed wooden gate tiles");
  assert.strictEqual(isWalkable(gameplayMap, 126, 118, 0), false, "closed wooden gates should block movement");
  gameplayMap[0][118][126] = TileId.WOODEN_GATE_OPEN;
  assert.strictEqual(isWalkable(gameplayMap, 126, 118, 0), true, "open wooden gates should be walkable");

  const fishingFireGate = tutorialIsland.landmarks.doors.find((door) => door.landmarkId === "tutorial_gate_fishing_to_firemaking");
  assert.deepStrictEqual({ x: fishingFireGate.x, y: fishingFireGate.y, z: fishingFireGate.z }, { x: 150, y: 125, z: 0 }, "fishing-to-firemaking gate should sit on the shared fence run, not the blocked corner");
  gameplayMap[0][fishingFireGate.y][fishingFireGate.x] = TileId.WOODEN_GATE_OPEN;
  assert.strictEqual(isWalkable(gameplayMap, fishingFireGate.x - 1, fishingFireGate.y, fishingFireGate.z), true, "fishing side of the firemaking gate should stay unobstructed");
  assert.strictEqual(isWalkable(gameplayMap, fishingFireGate.x + 1, fishingFireGate.y, fishingFireGate.z), true, "firemaking side of the firemaking gate should stay unobstructed");
  assert.notStrictEqual(
    findShortestPathLength(gameplayMap, { x: 141, y: 116, z: 0 }, { x: 158, y: 132, z: 0 }, { maxDistance: 48, maxVisited: 2048 }),
    null,
    "opened fishing-to-firemaking gate should allow pathing from the pond to the fire lane"
  );

  const scaledTutorialDefinition = authoring.getWorldDefinition("tutorial_island");
  const scaledTutorialMap = buildWorldGameplayMap(scaledTutorialDefinition, {
    tutorial_start_cabin: require(path.join(root, "content", "world", "stamps", "tutorial_start_cabin.json"))
  });
  for (const gate of scaledTutorialDefinition.landmarks.doors) {
    if (Number.isFinite(gate.tutorialRequiredStep) && gate.tutorialRequiredStep <= 4) {
      scaledTutorialMap[gate.z][gate.y][gate.x] = TileId.WOODEN_GATE_OPEN;
    }
  }
  assert.strictEqual(
    findShortestPathLength(scaledTutorialMap, { x: 229, y: 183, z: 0 }, { x: 231, y: 235, z: 0 }, {
      maxDistance: 180,
      maxVisited: 50000,
      allowedBounds: { xMin: 140, xMax: 255, yMin: 135, yMax: 195, z: 0 }
    }),
    null,
    "tutorial movement bounds should prevent pathing from the mining yard into open grass"
  );
  assert.ok(
    fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8").includes("if (blockX || blockY) continue;"),
    "runtime pathing should reject diagonal corner-cutting along fence and gate corners"
  );
  assert.ok(
    fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8").includes("window.isTutorialWalkTileAllowed"),
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
