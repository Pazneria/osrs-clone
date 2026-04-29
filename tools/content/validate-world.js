const fs = require("fs");
const vm = require("vm");
const { TileId } = require("./tile-ids");
const { buildWorldGameplayMap } = require("./world-map-builder");
const {
  collectAdjacencyViolations,
  findShortestPathLength,
  getChebyshevDistance,
  isWalkable
} = require("./world-pathing");
const { loadShopEconomy } = require("./shop-economy-loader");
const {
  loadWorldContent,
  loadWorldManifest
} = require("./world-content");
const path = require("path");
const { loadTsModule } = require("../lib/ts-module-loader");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasManifestWorld(manifest, worldId) {
  const worlds = manifest && Array.isArray(manifest.worlds) ? manifest.worlds : [];
  for (let i = 0; i < worlds.length; i++) {
    const entry = worlds[i];
    if (entry && entry.worldId === worldId) return true;
  }
  return false;
}

function collectRouteIds(world) {
  const ids = [];
  const groups = world.skillRoutes || {};
  ["fishing", "cooking", "firemaking", "mining", "runecrafting", "woodcutting"].forEach((key) => {
    const rows = Array.isArray(groups[key]) ? groups[key] : [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].routeId) ids.push(rows[i].routeId);
    }
  });
  return ids;
}

function assertFinitePoint2(point, message) {
  assert(point && Number.isFinite(point.x) && Number.isFinite(point.y), message);
}

function assertFinitePoint3(point, message) {
  assert(point && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z), message);
}

function loadCombatCatalog(root) {
  const combatContent = loadTsModule(path.join(root, "src", "game", "combat", "content.ts"));
  const enemyIds = new Set();
  const enemyById = new Map();
  const enemies = combatContent && typeof combatContent.listEnemyTypes === "function"
    ? combatContent.listEnemyTypes()
    : [];
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy || !enemy.enemyId) continue;
    enemyIds.add(enemy.enemyId);
    enemyById.set(enemy.enemyId, enemy);
  }
  return { enemyIds, enemyById };
}

function loadNpcDialogueCatalog(root) {
  const absPath = path.join(root, "src", "js", "content", "npc-dialogue-catalog.js");
  const sandbox = { window: {}, console };
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInNewContext(source, sandbox, { filename: absPath });
  return sandbox.window && sandbox.window.NpcDialogueCatalog ? sandbox.window.NpcDialogueCatalog : null;
}

function loadNpcAppearancePresetIds(root) {
  const absPath = path.join(root, "src", "js", "player-model.js");
  const source = fs.readFileSync(absPath, "utf8");
  const presetIds = new Set();
  const templateStart = source.indexOf("function buildNpcHumanoidRigTemplate");
  const templateEnd = templateStart >= 0
    ? source.indexOf("function createNpcHumanoidRigFromPreset", templateStart)
    : -1;
  const templateSection = templateStart >= 0
    ? source.slice(templateStart, templateEnd >= 0 ? templateEnd : undefined)
    : source;
  const presetMatcher = /normalizedPresetId !== '([^']+)'/g;
  let match = presetMatcher.exec(templateSection);
  while (match) {
    const presetId = String(match[1] || "").trim().toLowerCase();
    if (presetId) presetIds.add(presetId);
    match = presetMatcher.exec(templateSection);
  }

  if (presetIds.size === 0) {
    const actorMatcher = /actorId:\s*'([^']+)'/g;
    match = actorMatcher.exec(source);
    while (match) {
      const presetId = String(match[1] || "").trim().toLowerCase();
      if (presetId && presetId !== "player") presetIds.add(presetId);
      match = actorMatcher.exec(source);
    }
  }

  return presetIds;
}

function loadNpcMetadataCatalogs(root) {
  return {
    dialogueCatalog: loadNpcDialogueCatalog(root),
    appearancePresetIds: loadNpcAppearancePresetIds(root)
  };
}

function collectServiceOccupancy(services) {
  const occupied = new Set();
  const rows = Array.isArray(services) ? services : [];
  for (let i = 0; i < rows.length; i++) {
    const service = rows[i];
    if (!service) continue;
    const z = Number.isFinite(service.z) ? service.z : 0;
    const width = Number.isFinite(service.footprintW) ? Math.max(1, Math.floor(service.footprintW)) : 1;
    const depth = Number.isFinite(service.footprintD) ? Math.max(1, Math.floor(service.footprintD)) : 1;
    for (let dy = 0; dy < depth; dy++) {
      for (let dx = 0; dx < width; dx++) {
        occupied.add(`${service.x + dx}:${service.y + dy}:${z}`);
      }
    }
  }
  return occupied;
}

function collectMiningOccupancy(world) {
  const occupied = new Set();
  const miningNodes = world && world.resourceNodes && Array.isArray(world.resourceNodes.mining)
    ? world.resourceNodes.mining
    : [];
  for (let i = 0; i < miningNodes.length; i++) {
    const node = miningNodes[i];
    if (!node || !Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
    const z = Number.isFinite(node.z) ? node.z : 0;
    occupied.add(`${node.x}:${node.y}:${z}`);
  }
  return occupied;
}

function collectSafeRouteAnchors(manifestEntry, world) {
  const anchors = [];
  if (manifestEntry && manifestEntry.defaultSpawn) {
    anchors.push({
      kind: "default_spawn",
      id: `${world.worldId}:default_spawn`,
      x: manifestEntry.defaultSpawn.x,
      y: manifestEntry.defaultSpawn.y,
      z: manifestEntry.defaultSpawn.z
    });
  }
  const services = Array.isArray(world.services) ? world.services : [];
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    if (!service || !service.serviceId) continue;
    anchors.push({
      kind: "service",
      id: service.serviceId,
      x: service.x,
      y: service.y,
      z: Number.isFinite(service.z) ? service.z : 0
    });
  }
  return anchors;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

const CARDINAL_DIRECTIONS = Object.freeze([
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 }
]);

const ELEVATED_STAMP_FLOOR_TILES = new Set(["F", "L", "T", "P", "E"]);
const BUILTIN_STAIR_STAMP_TILES = new Set(["s", "S", "H", "U", "D"]);

function pointKey(x, y, z) {
  return `${x}:${y}:${z}`;
}

function collectElevatedStructureAccessData(structure, stamp) {
  const rows = stamp && Array.isArray(stamp.rows) ? stamp.rows : [];
  const elevatedFloorTiles = [];
  const builtinStairTiles = [];
  const footprint = new Set();

  for (let y = 0; y < rows.length; y++) {
    const row = typeof rows[y] === "string" ? rows[y] : "";
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === " ") continue;
      const worldX = structure.x + x;
      const worldY = structure.y + y;
      footprint.add(pointKey(worldX, worldY, structure.z));
      if (ELEVATED_STAMP_FLOOR_TILES.has(ch)) elevatedFloorTiles.push({ x: worldX, y: worldY, z: structure.z });
      if (BUILTIN_STAIR_STAMP_TILES.has(ch)) builtinStairTiles.push({ x: worldX, y: worldY, z: structure.z });
    }
  }

  return { elevatedFloorTiles, builtinStairTiles, footprint };
}

function collectAuthoredStairTiles(world) {
  const stairTiles = [];
  const staircases = world && world.landmarks && Array.isArray(world.landmarks.staircases)
    ? world.landmarks.staircases
    : [];
  for (let i = 0; i < staircases.length; i++) {
    const staircase = staircases[i];
    const tiles = staircase && Array.isArray(staircase.tiles) ? staircase.tiles : [];
    for (let j = 0; j < tiles.length; j++) {
      const tile = tiles[j];
      if (!tile || !Number.isFinite(tile.x) || !Number.isFinite(tile.y) || !Number.isFinite(tile.z)) continue;
      stairTiles.push({ x: tile.x, y: tile.y, z: tile.z });
    }
  }

  const approach = world && world.terrainPatches ? world.terrainPatches.smithingHallApproach : null;
  if (
    approach
    && Number.isFinite(approach.stairX)
    && Number.isFinite(approach.yStart)
    && Number.isFinite(approach.yEnd)
  ) {
    const yStart = Math.min(approach.yStart, approach.yEnd);
    const yEnd = Math.max(approach.yStart, approach.yEnd);
    for (let y = yStart; y <= yEnd; y++) {
      stairTiles.push({ x: approach.stairX, y, z: 0 });
    }
  }

  return stairTiles;
}

function isStructureInteriorAccessTile(logicalMap, x, y, z) {
  const tileId = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
  return tileId === TileId.DOOR_CLOSED
    || tileId === TileId.FENCE
    || tileId === TileId.WOODEN_GATE_CLOSED
    || tileId === TileId.SOLID_NPC
    || tileId === TileId.BANK_BOOTH
    || tileId === TileId.SHOP_COUNTER
    || isWalkable(logicalMap, x, y, z);
}

function hasInteriorAccessNeighbor(stairTile, footprint, logicalMap) {
  if (!stairTile) return false;
  for (let i = 0; i < CARDINAL_DIRECTIONS.length; i++) {
    const dir = CARDINAL_DIRECTIONS[i];
    const nextX = stairTile.x + dir.x;
    const nextY = stairTile.y + dir.y;
    if (!footprint.has(pointKey(nextX, nextY, stairTile.z))) continue;
    if (isStructureInteriorAccessTile(logicalMap, nextX, nextY, stairTile.z)) return true;
  }
  return false;
}

function hasExteriorWalkableNeighbor(stairTile, footprint, logicalMap) {
  if (!stairTile) return false;
  for (let i = 0; i < CARDINAL_DIRECTIONS.length; i++) {
    const dir = CARDINAL_DIRECTIONS[i];
    const nextX = stairTile.x + dir.x;
    const nextY = stairTile.y + dir.y;
    if (footprint.has(pointKey(nextX, nextY, stairTile.z))) continue;
    if (isWalkable(logicalMap, nextX, nextY, stairTile.z)) return true;
  }
  return false;
}

function validateElevatedStructureAccess(worldId, world, stamps, logicalMap) {
  const structures = Array.isArray(world && world.structures) ? world.structures : [];
  const authoredStairTiles = collectAuthoredStairTiles(world);

  for (let i = 0; i < structures.length; i++) {
    const structure = structures[i];
    if (!structure || !Number.isFinite(structure.x) || !Number.isFinite(structure.y) || !Number.isFinite(structure.z)) continue;
    if (structure.z !== 0) continue;

    const stamp = stamps ? stamps[structure.stampId] : null;
    const accessData = collectElevatedStructureAccessData(structure, stamp);
    if (!accessData.elevatedFloorTiles.length) continue;

    const stairCandidates = authoredStairTiles
      .filter((tile) => tile && tile.z === structure.z)
      .concat(accessData.builtinStairTiles);

    const hasReachableStaircase = stairCandidates.some((stairTile) => (
      hasInteriorAccessNeighbor(stairTile, accessData.footprint, logicalMap)
      && hasExteriorWalkableNeighbor(stairTile, accessData.footprint, logicalMap)
    ));

    assert(
      hasReachableStaircase,
      `${worldId}: elevated structure ${structure.structureId} is missing reachable staircase access`
    );
  }
}

function isNamedMainOverworldNpcService(worldId, service) {
  if (worldId !== "main_overworld") return false;
  if (!service || service.type !== "MERCHANT" || service.interactionTarget !== "NPC") return false;
  const name = normalizeLower(service.name);
  if (!name || name === "shopkeeper") return false;
  return true;
}

function validateMainOverworldNamedNpcServices(worldId, manifestEntry, world, logicalMap, npcMetadataCatalogs) {
  if (worldId !== "main_overworld") return;
  const dialogueCatalog = npcMetadataCatalogs && npcMetadataCatalogs.dialogueCatalog
    ? npcMetadataCatalogs.dialogueCatalog
    : null;
  const appearancePresetIds = npcMetadataCatalogs && npcMetadataCatalogs.appearancePresetIds
    ? npcMetadataCatalogs.appearancePresetIds
    : new Set();
  const miningOccupancy = collectMiningOccupancy(world);
  const namedServices = (Array.isArray(world.services) ? world.services : []).filter((service) => isNamedMainOverworldNpcService(worldId, service));

  assert(namedServices.length > 0, `${worldId}: missing named NPC services for dialogue validation`);

  for (let i = 0; i < namedServices.length; i++) {
    const service = namedServices[i];
    const servicePoint = {
      x: service.x,
      y: service.y,
      z: Number.isFinite(service.z) ? Number(service.z) : 0
    };
    const dialogueId = normalizeString(service.dialogueId);
    const appearanceId = normalizeLower(service.appearanceId);

    assert(dialogueId, `${worldId}: named NPC service ${service.serviceId} missing dialogueId`);
    assert(
      dialogueCatalog && typeof dialogueCatalog.resolveDialogueId === "function",
      `${worldId}: NPC dialogue catalog missing dialogue resolver`
    );
    assert(
      dialogueCatalog.resolveDialogueId(dialogueId),
      `${worldId}: named NPC service ${service.serviceId} references unknown dialogueId ${dialogueId}`
    );

    if ("appearanceId" in service) {
      assert(appearanceId, `${worldId}: named NPC service ${service.serviceId} has an empty appearanceId`);
    }
    if (appearanceId) {
      assert(
        appearancePresetIds.has(appearanceId),
        `${worldId}: named NPC service ${service.serviceId} references unknown appearanceId ${appearanceId}`
      );
    }

    assertFinitePoint3(servicePoint, `${worldId}: named NPC service ${service.serviceId} has invalid coordinates`);
    assert(
      servicePoint.x >= 0 && servicePoint.y >= 0 && servicePoint.x < 648 && servicePoint.y < 648,
      `${worldId}: named NPC service ${service.serviceId} is out of bounds`
    );

    const tileKey = `${servicePoint.x}:${servicePoint.y}:${servicePoint.z}`;
    assert(!miningOccupancy.has(tileKey), `${worldId}: named NPC service ${service.serviceId} overlaps mining occupancy`);
    const tileId = logicalMap[servicePoint.z] && logicalMap[servicePoint.z][servicePoint.y]
      ? logicalMap[servicePoint.z][servicePoint.y][servicePoint.x]
      : null;
    assert(
      tileId !== TileId.WATER_SHALLOW && tileId !== TileId.WATER_DEEP,
      `${worldId}: named NPC service ${service.serviceId} overlaps water`
    );
    assert(
      isWalkable(logicalMap, servicePoint.x, servicePoint.y, servicePoint.z),
      `${worldId}: named NPC service ${service.serviceId} is not on a walkable tile`
    );

  }
}

function validateCombatSpawns(worldId, manifestEntry, world, logicalMap, combatCatalog) {
  const combatSpawns = Array.isArray(world.combatSpawns) ? world.combatSpawns : [];
  assert(combatSpawns.length > 0, `${worldId}: missing authored combat spawns`);

  const enemyIds = combatCatalog && combatCatalog.enemyIds ? combatCatalog.enemyIds : new Set();
  const enemyById = combatCatalog && combatCatalog.enemyById ? combatCatalog.enemyById : new Map();
  const serviceOccupancy = collectServiceOccupancy(world.services);
  const miningOccupancy = collectMiningOccupancy(world);
  const safeRouteAnchors = collectSafeRouteAnchors(manifestEntry, world);
  const spawnIds = new Set();
  const occupiedSpawnTiles = new Set();
  const groupMembers = new Map();

  for (let i = 0; i < combatSpawns.length; i++) {
    const spawn = combatSpawns[i];
    assert(spawn && spawn.spawnNodeId, `${worldId}: combat spawn missing spawnNodeId`);
    assert(!spawnIds.has(spawn.spawnNodeId), `${worldId}: duplicate combat spawnNodeId ${spawn.spawnNodeId}`);
    spawnIds.add(spawn.spawnNodeId);
    assert(typeof spawn.spawnEnabled === "boolean", `${worldId}: combat spawn ${spawn.spawnNodeId} missing spawnEnabled`);
    assert(typeof spawn.enemyId === "string" && spawn.enemyId.trim(), `${worldId}: combat spawn ${spawn.spawnNodeId} missing enemyId`);
    assert(enemyIds.has(spawn.enemyId), `${worldId}: combat spawn ${spawn.spawnNodeId} references unknown enemyId ${spawn.enemyId}`);
    assertFinitePoint3(spawn.spawnTile, `${worldId}: combat spawn ${spawn.spawnNodeId} missing valid spawnTile`);
    assert(spawn.spawnTile.x >= 0 && spawn.spawnTile.y >= 0 && spawn.spawnTile.x < 648 && spawn.spawnTile.y < 648, `${worldId}: combat spawn ${spawn.spawnNodeId} is out of bounds`);
    assert(isWalkable(logicalMap, spawn.spawnTile.x, spawn.spawnTile.y, spawn.spawnTile.z), `${worldId}: combat spawn ${spawn.spawnNodeId} is not on a walkable tile`);

    const spawnTileKey = `${spawn.spawnTile.x}:${spawn.spawnTile.y}:${spawn.spawnTile.z}`;
    assert(!occupiedSpawnTiles.has(spawnTileKey), `${worldId}: combat spawn ${spawn.spawnNodeId} overlaps another combat spawn tile`);
    occupiedSpawnTiles.add(spawnTileKey);
    assert(!serviceOccupancy.has(spawnTileKey), `${worldId}: combat spawn ${spawn.spawnNodeId} overlaps service occupancy`);
    assert(!miningOccupancy.has(spawnTileKey), `${worldId}: combat spawn ${spawn.spawnNodeId} overlaps mining occupancy`);

    const homeTile = spawn.homeTileOverride || spawn.spawnTile;
    assertFinitePoint3(homeTile, `${worldId}: combat spawn ${spawn.spawnNodeId} has invalid homeTileOverride`);
    assert(homeTile.z === spawn.spawnTile.z, `${worldId}: combat spawn ${spawn.spawnNodeId} home tile must stay on the same plane`);
    assert(isWalkable(logicalMap, homeTile.x, homeTile.y, homeTile.z), `${worldId}: combat spawn ${spawn.spawnNodeId} home tile is not walkable`);
    assert(!serviceOccupancy.has(`${homeTile.x}:${homeTile.y}:${homeTile.z}`), `${worldId}: combat spawn ${spawn.spawnNodeId} home tile overlaps service occupancy`);
    assert(!miningOccupancy.has(`${homeTile.x}:${homeTile.y}:${homeTile.z}`), `${worldId}: combat spawn ${spawn.spawnNodeId} home tile overlaps mining occupancy`);

    const leashDistance = getChebyshevDistance(spawn.spawnTile, homeTile);
    assert(leashDistance !== null && leashDistance <= 12, `${worldId}: combat spawn ${spawn.spawnNodeId} home tile is too far from spawn`);
    const leashPath = findShortestPathLength(logicalMap, spawn.spawnTile, homeTile, { maxDistance: 24, maxVisited: 2048 });
    assert(leashPath !== null, `${worldId}: combat spawn ${spawn.spawnNodeId} home tile is unreachable from spawn`);

    if (spawn.spawnGroupId !== undefined && spawn.spawnGroupId !== null) {
      const groupId = String(spawn.spawnGroupId).trim();
      assert(groupId, `${worldId}: combat spawn ${spawn.spawnNodeId} has an empty spawnGroupId`);
      if (!groupMembers.has(groupId)) groupMembers.set(groupId, []);
      groupMembers.get(groupId).push(spawn);
    }

    const enemy = enemyById.get(spawn.enemyId);
    const isAggressive = !!(enemy && enemy.behavior && enemy.behavior.aggroType === "aggressive");
    if (isAggressive) {
      for (let j = 0; j < safeRouteAnchors.length; j++) {
        const anchor = safeRouteAnchors[j];
        if (!anchor || anchor.z !== spawn.spawnTile.z) continue;
        const pathDistance = findShortestPathLength(logicalMap, anchor, spawn.spawnTile, { maxDistance: 6, maxVisited: 1024 });
        assert(pathDistance === null || pathDistance > 5, `${worldId}: aggressive combat spawn ${spawn.spawnNodeId} is too close to safe-route anchor ${anchor.id}`);
      }
    }
  }

  groupMembers.forEach((members, groupId) => {
    if (!Array.isArray(members) || members.length <= 1) return;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const distance = getChebyshevDistance(members[i].spawnTile, members[j].spawnTile);
        assert(distance !== null && distance <= 16, `${worldId}: combat spawn group ${groupId} is too spread out`);
      }
    }
  });
}

function validateWaterShape(worldId, bodyId, shape) {
  assert(shape && typeof shape === "object", `${worldId}: water body ${bodyId} missing shape`);
  assert(shape.kind === "ellipse" || shape.kind === "box" || shape.kind === "polygon", `${worldId}: water body ${bodyId} has unsupported shape kind`);
  if (shape.kind === "ellipse") {
    assert(Number.isFinite(shape.cx) && Number.isFinite(shape.cy), `${worldId}: water body ${bodyId} ellipse missing center`);
    assert(Number.isFinite(shape.rx) && shape.rx > 0 && Number.isFinite(shape.ry) && shape.ry > 0, `${worldId}: water body ${bodyId} ellipse missing radii`);
    return;
  }
  if (shape.kind === "box") {
    assert(Number.isFinite(shape.xMin) && Number.isFinite(shape.xMax), `${worldId}: water body ${bodyId} box missing x bounds`);
    assert(Number.isFinite(shape.yMin) && Number.isFinite(shape.yMax), `${worldId}: water body ${bodyId} box missing y bounds`);
    assert(shape.xMin <= shape.xMax && shape.yMin <= shape.yMax, `${worldId}: water body ${bodyId} box bounds are inverted`);
    return;
  }
  const points = Array.isArray(shape.points) ? shape.points : [];
  assert(points.length >= 3, `${worldId}: water body ${bodyId} polygon needs at least 3 points`);
  for (let i = 0; i < points.length; i++) {
    assertFinitePoint2(points[i], `${worldId}: water body ${bodyId} polygon point ${i} is invalid`);
  }
}

function validateWorld(root, worldId, shopEconomy, combatCatalog, npcMetadataCatalogs) {
  const { manifestEntry, world, stamps } = loadWorldContent(root, worldId);
  const manifest = loadWorldManifest(root);
  const resolvedCombatCatalog = combatCatalog || loadCombatCatalog(root);
  const resolvedNpcMetadataCatalogs = npcMetadataCatalogs || loadNpcMetadataCatalogs(root);
  const knownMerchantIds = new Set(["general_store"]);
  if (shopEconomy && typeof shopEconomy.getConfiguredMerchantIds === "function") {
    const merchantIds = shopEconomy.getConfiguredMerchantIds();
    if (Array.isArray(merchantIds)) {
      for (let i = 0; i < merchantIds.length; i++) {
        knownMerchantIds.add(String(merchantIds[i] || "").trim().toLowerCase());
      }
    }
  }

  assert(world.worldId === manifestEntry.worldId, `world definition id mismatch for ${worldId}`);
  assert(!world.dynamicServices, `${worldId} should not define dynamicServices`);
  assert(!world.skillRoutes.miningZones, `${worldId} should not define legacy miningZones`);
  assert(!world.skillRoutes.runecraftingBands, `${worldId} should not define legacy runecraftingBands`);
  assert(!world.skillRoutes.woodcuttingZones, `${worldId} should not define legacy woodcuttingZones`);

  const waterBodyIds = new Set();
  const waterBodies = Array.isArray(world.waterBodies) ? world.waterBodies : [];
  for (let i = 0; i < waterBodies.length; i++) {
    const body = waterBodies[i];
    assert(body && body.id, `${worldId}: water body missing id`);
    assert(!waterBodyIds.has(body.id), `${worldId}: duplicate water body id ${body.id}`);
    waterBodyIds.add(body.id);
    validateWaterShape(worldId, body.id, body.shape);
    assert(Number.isFinite(body.surfaceY), `${worldId}: water body ${body.id} missing surfaceY`);
    if (body.style !== undefined) {
      assert(body.style === "calm_lake", `${worldId}: water body ${body.id} has unsupported style ${body.style}`);
    }
    if (body.shoreline) {
      assert(Number.isFinite(body.shoreline.width) && body.shoreline.width > 0, `${worldId}: water body ${body.id} missing shoreline width`);
      if (body.shoreline.foamWidth !== undefined) {
        assert(Number.isFinite(body.shoreline.foamWidth) && body.shoreline.foamWidth >= 0, `${worldId}: water body ${body.id} has invalid foamWidth`);
      }
      if (body.shoreline.skirtDepth !== undefined) {
        assert(Number.isFinite(body.shoreline.skirtDepth) && body.shoreline.skirtDepth >= 0, `${worldId}: water body ${body.id} has invalid skirtDepth`);
      }
    }
    if (body.depthProfile) {
      assert(body.depthProfile.mode === "tile_truth" || body.depthProfile.mode === "uniform", `${worldId}: water body ${body.id} has unsupported depthProfile mode`);
      const deepZones = Array.isArray(body.depthProfile.deepZones) ? body.depthProfile.deepZones : [];
      for (let j = 0; j < deepZones.length; j++) {
        validateWaterShape(worldId, `${body.id}.deepZone.${j}`, deepZones[j].shape);
      }
    }
  }

  const structureIds = new Set();
  const spawnIds = new Set();
  const serviceIds = new Set();
  const routeIds = new Set();
  const routeAliases = new Set();
  const placementIds = new Set();

  const structures = Array.isArray(world.structures) ? world.structures : [];
  for (let i = 0; i < structures.length; i++) {
    const structure = structures[i];
    assert(structure && structure.structureId, `${worldId}: world structure missing structureId`);
    assert(!structureIds.has(structure.structureId), `${worldId}: duplicate structureId ${structure.structureId}`);
    structureIds.add(structure.structureId);
    assert(!!stamps[structure.stampId], `${worldId}: missing stamp reference ${structure.stampId}`);
  }

  const services = Array.isArray(world.services) ? world.services : [];
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    assert(service && service.serviceId, `${worldId}: world service missing serviceId`);
    assert(!serviceIds.has(service.serviceId), `${worldId}: duplicate serviceId ${service.serviceId}`);
    serviceIds.add(service.serviceId);
    assert(service.spawnId, `${worldId}: service ${service.serviceId} missing spawnId`);
    assert(!spawnIds.has(service.spawnId), `${worldId}: duplicate spawnId ${service.spawnId}`);
    spawnIds.add(service.spawnId);
    if (service.merchantId) {
      const merchantId = String(service.merchantId).trim().toLowerCase();
      assert(knownMerchantIds.has(merchantId), `${worldId}: unknown merchantId ${merchantId}`);
    }
    if (service.travelToWorldId) {
      const travelWorldId = String(service.travelToWorldId).trim();
      assert(travelWorldId, `${worldId}: service ${service.serviceId} has an empty travelToWorldId`);
      assert(hasManifestWorld(manifest, travelWorldId), `${worldId}: service ${service.serviceId} references unknown travel world ${travelWorldId}`);
      assert(
        service.travelSpawn
          && Number.isFinite(service.travelSpawn.x)
          && Number.isFinite(service.travelSpawn.y)
          && Number.isFinite(service.travelSpawn.z),
        `${worldId}: service ${service.serviceId} missing valid travelSpawn`
      );
    }
  }

  const groups = world.skillRoutes || {};
  ["fishing", "cooking", "firemaking", "mining", "runecrafting", "woodcutting"].forEach((groupKey) => {
    const rows = Array.isArray(groups[groupKey]) ? groups[groupKey] : [];
    assert(rows.length > 0, `${worldId}: missing routes for ${groupKey}`);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      assert(row && row.routeId, `${worldId}: route in ${groupKey} missing routeId`);
      assert(!routeIds.has(row.routeId), `${worldId}: duplicate routeId ${row.routeId}`);
      routeIds.add(row.routeId);
      const alias = String(row.alias || "").trim().toLowerCase();
      if (alias) {
        const scopedAlias = `${groupKey}:${alias}`;
        assert(!routeAliases.has(scopedAlias), `${worldId}: duplicate alias ${alias} in ${groupKey}`);
        routeAliases.add(scopedAlias);
      }
    }
  });

  const miningRouteIds = new Set((world.skillRoutes.mining || []).map((entry) => entry.routeId));
  const miningNodes = world.resourceNodes && Array.isArray(world.resourceNodes.mining) ? world.resourceNodes.mining : [];
  assert(miningNodes.length > 0, `${worldId}: missing authored mining resource nodes`);
  for (let i = 0; i < miningNodes.length; i++) {
    const node = miningNodes[i];
    assert(node && node.placementId, `${worldId}: mining node missing placementId`);
    assert(!placementIds.has(node.placementId), `${worldId}: duplicate placementId ${node.placementId}`);
    placementIds.add(node.placementId);
    assert(node.routeId && miningRouteIds.has(node.routeId), `${worldId}: mining node ${node.placementId} references unknown routeId ${node.routeId}`);
    assert(node.oreType, `${worldId}: mining node ${node.placementId} missing oreType`);
  }

  const woodcuttingRouteIds = new Set((world.skillRoutes.woodcutting || []).map((entry) => entry.routeId));
  const woodcuttingNodes = world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) ? world.resourceNodes.woodcutting : [];
  assert(woodcuttingNodes.length > 0, `${worldId}: missing authored woodcutting resource nodes`);
  for (let i = 0; i < woodcuttingNodes.length; i++) {
    const node = woodcuttingNodes[i];
    assert(node && node.placementId, `${worldId}: woodcutting node missing placementId`);
    assert(!placementIds.has(node.placementId), `${worldId}: duplicate placementId ${node.placementId}`);
    placementIds.add(node.placementId);
    assert(node.routeId && woodcuttingRouteIds.has(node.routeId), `${worldId}: woodcutting node ${node.placementId} references unknown routeId ${node.routeId}`);
    assert(node.nodeId, `${worldId}: woodcutting node ${node.placementId} missing nodeId`);
  }

  const runecraftingRouteIds = new Set((world.skillRoutes.runecrafting || []).map((entry) => entry.routeId));
  const altars = world.landmarks && Array.isArray(world.landmarks.altars) ? world.landmarks.altars : [];
  assert(altars.length > 0, `${worldId}: missing authored runecrafting altars`);
  for (let i = 0; i < altars.length; i++) {
    const altar = altars[i];
    assert(altar && altar.routeId, `${worldId}: altar placement missing routeId`);
    assert(runecraftingRouteIds.has(altar.routeId), `${worldId}: altar routeId ${altar.routeId} missing from runecrafting routes`);
    assert(Number.isFinite(altar.variant), `${worldId}: altar ${altar.routeId} missing variant`);
  }

  const logicalMap = buildWorldGameplayMap(world, stamps);
  validateElevatedStructureAccess(worldId, world, stamps, logicalMap);
  validateCombatSpawns(worldId, manifestEntry, world, logicalMap, resolvedCombatCatalog);
  validateMainOverworldNamedNpcServices(worldId, manifestEntry, world, logicalMap, resolvedNpcMetadataCatalogs);
  const adjacencyViolations = collectAdjacencyViolations(world, logicalMap);
  assert(adjacencyViolations.length === 0, adjacencyViolations.join("\n"));

  return {
    worldId,
    structures: structures.length,
    services: services.length,
    routes: collectRouteIds(world).length
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const manifest = loadWorldManifest(root);
  const shopEconomy = loadShopEconomy(root);
  const combatCatalog = loadCombatCatalog(root);
  const npcMetadataCatalogs = loadNpcMetadataCatalogs(root);
  const cliWorldIdIndex = process.argv.indexOf("--world");
  const requestedWorldIds = cliWorldIdIndex >= 0 && process.argv[cliWorldIdIndex + 1]
    ? [String(process.argv[cliWorldIdIndex + 1]).trim()]
    : manifest.worlds.map((entry) => entry.worldId);

  const summaries = [];
  for (let i = 0; i < requestedWorldIds.length; i++) {
    summaries.push(validateWorld(root, requestedWorldIds[i], shopEconomy, combatCatalog, npcMetadataCatalogs));
  }

  const summaryText = summaries
    .map((entry) => `${entry.worldId} (${entry.structures} structures, ${entry.services} services, ${entry.routes} routes)`)
    .join(", ");
  console.log(`Validated world content: ${summaryText}.`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  validateWorld,
  run
};
