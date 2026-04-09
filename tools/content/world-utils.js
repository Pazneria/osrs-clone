const fs = require("fs");
const path = require("path");
const vm = require("vm");

const MAP_SIZE = 648;
const PLANES = 2;

const TileId = Object.freeze({
  GRASS: 0,
  TREE: 1,
  ROCK: 2,
  DIRT: 3,
  STUMP: 4,
  OBSTACLE: 5,
  FLOOR_WOOD: 6,
  FLOOR_STONE: 7,
  FLOOR_BRICK: 8,
  BANK_BOOTH: 9,
  WALL: 11,
  TOWER: 12,
  STAIRS_UP: 13,
  STAIRS_DOWN: 14,
  STAIRS_RAMP: 15,
  SOLID_NPC: 16,
  SHOP_COUNTER: 17,
  DOOR_CLOSED: 18,
  DOOR_OPEN: 19,
  SHORE: 20,
  WATER_SHALLOW: 21,
  WATER_DEEP: 22
});

const WALKABLE = new Set([
  TileId.GRASS,
  TileId.DIRT,
  TileId.FLOOR_WOOD,
  TileId.FLOOR_STONE,
  TileId.FLOOR_BRICK,
  TileId.STAIRS_UP,
  TileId.STAIRS_DOWN,
  TileId.STAIRS_RAMP,
  TileId.DOOR_OPEN,
  TileId.SHORE
]);

function loadJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function loadWorldManifest(root) {
  return loadJson(path.join(root, "content", "world", "manifest.json"));
}

function getWorldManifestEntry(manifest, worldId) {
  const targetWorldId = String(worldId || "").trim();
  const worlds = manifest && Array.isArray(manifest.worlds) ? manifest.worlds : [];
  const entry = worlds.find((row) => row && row.worldId === targetWorldId);
  if (!entry) {
    throw new Error(`Unknown worldId ${targetWorldId}`);
  }
  return entry;
}

function loadWorldContent(root, worldId) {
  const manifest = loadWorldManifest(root);
  const manifestEntry = getWorldManifestEntry(manifest, worldId);
  const regionPath = path.join(root, "content", "world", "regions", manifestEntry.regionFile);
  const stampsDir = path.join(root, "content", "world", "stamps");
  const world = loadJson(regionPath);
  const stamps = {};
  const stampIds = Array.isArray(manifestEntry.stampIds) ? manifestEntry.stampIds : [];
  for (let i = 0; i < stampIds.length; i++) {
    const stampId = stampIds[i];
    const stampPath = path.join(stampsDir, `${stampId}.json`);
    stamps[stampId] = loadJson(stampPath);
  }
  return { manifest, manifestEntry, world, stamps };
}

function loadStarterTownWorld(root) {
  return loadWorldContent(root, "starter_town");
}

function loadShopEconomy(root) {
  const sandbox = {
    window: {},
    playerState: { merchantProgress: {} },
    console
  };
  const loadBrowserScript = (relPath) => {
    const abs = path.join(root, relPath);
    const code = fs.readFileSync(abs, "utf8");
    vm.runInNewContext(code, sandbox, { filename: abs });
  };

  loadBrowserScript(path.join("src", "js", "skills", "specs.js"));
  sandbox.SkillSpecs = sandbox.window.SkillSpecs;
  loadBrowserScript(path.join("src", "js", "skills", "spec-registry.js"));
  sandbox.SkillSpecRegistry = sandbox.window.SkillSpecRegistry;
  loadBrowserScript(path.join("src", "js", "content", "item-catalog.js"));
  loadBrowserScript(path.join("src", "js", "shop-economy.js"));
  return sandbox.window.ShopEconomy || null;
}

function createEmptyMap() {
  return Array(PLANES).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(TileId.GRASS)));
}

function inTownCore(x, y) {
  const inCastle = x >= 190 && x <= 220 && y >= 190 && y <= 215;
  const inStore = x >= 177 && x <= 185 && y >= 232 && y <= 240;
  const inSmithyApron = x >= 217 && x <= 233 && y >= 224 && y <= 244;
  return inCastle || inStore || inSmithyApron;
}

function carveWaterTile(map, x, y, depthNorm) {
  if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return;
  if (inTownCore(x, y)) return;
  map[0][y][x] = depthNorm >= 0.64 ? TileId.WATER_DEEP : TileId.WATER_SHALLOW;
}

function applyWaterFeatures(map, world) {
  const lakes = world.terrainPatches.lakes || [];
  for (let i = 0; i < lakes.length; i++) {
    const lake = lakes[i];
    for (let y = Math.max(1, Math.floor(lake.cy - lake.ry - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(lake.cy + lake.ry + 1)); y++) {
      for (let x = Math.max(1, Math.floor(lake.cx - lake.rx - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(lake.cx + lake.rx + 1)); x++) {
        const nx = (x - lake.cx) / lake.rx;
        const ny = (y - lake.cy) / lake.ry;
        const d = Math.sqrt((nx * nx) + (ny * ny));
        if (d <= 1.0) carveWaterTile(map, x, y, 1.0 - d);
      }
    }
  }

  const pond = world.terrainPatches.castleFrontPond;
  for (let y = Math.max(1, Math.floor(pond.cy - pond.ry - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(pond.cy + pond.ry + 1)); y++) {
    for (let x = Math.max(1, Math.floor(pond.cx - pond.rx - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(pond.cx + pond.rx + 1)); x++) {
      const nx = (x - pond.cx) / pond.rx;
      const ny = (y - pond.cy) / pond.ry;
      const d = Math.sqrt((nx * nx) + (ny * ny));
      if (d <= 1.0) carveWaterTile(map, x, y, 1.0 - d);
    }
  }

  const deep = world.terrainPatches.deepWaterCenter;
  for (let y = deep.yMin; y <= deep.yMax; y++) {
    for (let x = deep.xMin; x <= deep.xMax; x++) {
      map[0][y][x] = TileId.WATER_DEEP;
    }
  }

  const pier = world.terrainPatches.pier;
  for (let y = pier.yStart; y <= pier.yEnd; y++) {
    for (let x = pier.xMin; x <= pier.xMax; x++) {
      map[0][y][x] = TileId.FLOOR_WOOD;
    }
  }
  for (let x = pier.xMin; x <= pier.xMax; x++) {
    map[0][pier.entryY][x] = TileId.SHORE;
  }
}

function applyStamp(map, stamp, startX, startY, z) {
  const rows = stamp.rows || [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const mapX = startX + x;
      const mapY = startY + y;
      if (ch === " ") continue;
      if (ch === "W") map[z][mapY][mapX] = TileId.WALL;
      else if (ch === "C") map[z][mapY][mapX] = TileId.TOWER;
      else if (ch === "F") map[z][mapY][mapX] = TileId.FLOOR_STONE;
      else if (ch === "L") map[z][mapY][mapX] = TileId.FLOOR_WOOD;
      else if (ch === "T") map[z][mapY][mapX] = TileId.FLOOR_WOOD;
      else if (ch === "U") map[z][mapY][mapX] = TileId.STAIRS_UP;
      else if (ch === "D") map[z][mapY][mapX] = TileId.STAIRS_DOWN;
      else if (ch === "s" || ch === "S") map[z][mapY][mapX] = TileId.STAIRS_RAMP;
      else if (ch === "P" || ch === "E") map[z][mapY][mapX] = TileId.FLOOR_STONE;
      else if (ch === "B") map[z][mapY][mapX] = TileId.BANK_BOOTH;
      else if (ch === "N" || ch === "K" || ch === "Q" || ch === "$") map[z][mapY][mapX] = TileId.SOLID_NPC;
      else if (ch === "V") map[z][mapY][mapX] = TileId.SHOP_COUNTER;
    }
  }
}

function applyStructures(map, world, stamps) {
  const structures = world.structures || [];
  for (let i = 0; i < structures.length; i++) {
    const structure = structures[i];
    const stamp = stamps[structure.stampId];
    if (!stamp) continue;
    applyStamp(map, stamp, structure.x, structure.y, structure.z);
  }
}

function applyLandmarks(map, world) {
  const staircases = world.landmarks && Array.isArray(world.landmarks.staircases) ? world.landmarks.staircases : [];
  for (let i = 0; i < staircases.length; i++) {
    const tiles = staircases[i].tiles || [];
    for (let j = 0; j < tiles.length; j++) {
      const tile = tiles[j];
      if (!tile || !tile.tileId || TileId[tile.tileId] === undefined) continue;
      map[tile.z][tile.y][tile.x] = TileId[tile.tileId];
    }
  }
  const doors = world.landmarks && Array.isArray(world.landmarks.doors) ? world.landmarks.doors : [];
  for (let i = 0; i < doors.length; i++) {
    const door = doors[i];
    if (!door || !door.tileId || TileId[door.tileId] === undefined) continue;
    map[door.z][door.y][door.x] = TileId[door.tileId];
  }
  const approach = world.terrainPatches.smithingHallApproach;
  for (let y = approach.yStart; y <= approach.yEnd; y++) {
    map[0][y][approach.shoreX] = TileId.SHORE;
    map[0][y][approach.stairX] = TileId.STAIRS_RAMP;
  }
}

function setCookingRouteTiles(map, world) {
  const routes = world.skillRoutes && Array.isArray(world.skillRoutes.cooking) ? world.skillRoutes.cooking : [];
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const tiles = route.fireTiles || [];
    for (let j = 0; j < tiles.length; j++) {
      const tile = tiles[j];
      const current = map[0][tile.y][tile.x];
      if (current === TileId.WATER_SHALLOW || current === TileId.WATER_DEEP) {
        map[0][tile.y][tile.x] = TileId.SHORE;
      }
    }
  }
}

function buildWorldLogicalMap(world, stamps) {
  const map = createEmptyMap();
  applyWaterFeatures(map, world);
  applyStructures(map, world, stamps);
  applyLandmarks(map, world);
  setCookingRouteTiles(map, world);
  return map;
}

function applyAuthoredTopology(map, world) {
  const miningNodes = world.resourceNodes && Array.isArray(world.resourceNodes.mining)
    ? world.resourceNodes.mining
    : [];
  for (let i = 0; i < miningNodes.length; i++) {
    const placement = miningNodes[i];
    if (!placement || !map[placement.z] || !map[placement.z][placement.y]) continue;
    map[placement.z][placement.y][placement.x] = TileId.ROCK;
  }

  const woodcuttingNodes = world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting)
    ? world.resourceNodes.woodcutting
    : [];
  for (let i = 0; i < woodcuttingNodes.length; i++) {
    const placement = woodcuttingNodes[i];
    if (!placement || !map[placement.z] || !map[placement.z][placement.y]) continue;
    map[placement.z][placement.y][placement.x] = TileId.TREE;
  }

  const altars = world.landmarks && Array.isArray(world.landmarks.altars) ? world.landmarks.altars : [];
  for (let i = 0; i < altars.length; i++) {
    const altar = altars[i];
    if (!altar) continue;
    for (let y = altar.y - 1; y <= altar.y + 2; y++) {
      for (let x = altar.x - 1; x <= altar.x + 2; x++) {
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) continue;
        map[altar.z][y][x] = TileId.OBSTACLE;
      }
    }
  }

  const showcaseTrees = world.landmarks && Array.isArray(world.landmarks.showcaseTrees) ? world.landmarks.showcaseTrees : [];
  for (let i = 0; i < showcaseTrees.length; i++) {
    const tree = showcaseTrees[i];
    if (!tree || !map[0] || !map[0][tree.y]) continue;
    map[0][tree.y][tree.x] = TileId.TREE;
  }
}

function buildWorldGameplayMap(world, stamps) {
  const map = buildWorldLogicalMap(world, stamps);
  applyAuthoredTopology(map, world);
  return map;
}

function buildStarterTownLogicalMap(world, stamps) {
  return buildWorldLogicalMap(world, stamps);
}

function buildStarterTownGameplayMap(world, stamps) {
  return buildWorldGameplayMap(world, stamps);
}

function isWalkable(map, x, y, z) {
  if (!map[z] || !map[z][y]) return false;
  return WALKABLE.has(map[z][y][x]);
}

function hasAdjacentWalkableTile(map, x, y, z) {
  const neighbors = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
    { x: x + 1, y: y + 1 },
    { x: x + 1, y: y - 1 },
    { x: x - 1, y: y + 1 },
    { x: x - 1, y: y - 1 }
  ];
  for (let i = 0; i < neighbors.length; i++) {
    const n = neighbors[i];
    if (n.x < 0 || n.y < 0 || n.x >= MAP_SIZE || n.y >= MAP_SIZE) continue;
    if (isWalkable(map, n.x, n.y, z)) return true;
  }
  return false;
}

function getChebyshevDistance(a, b) {
  if (!a || !b) return null;
  if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return null;
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function findShortestPathLength(map, start, goal, options = {}) {
  if (!start || !goal) return null;
  if (!Number.isFinite(start.x) || !Number.isFinite(start.y) || !Number.isFinite(start.z)) return null;
  if (!Number.isFinite(goal.x) || !Number.isFinite(goal.y) || !Number.isFinite(goal.z)) return null;
  if (start.z !== goal.z) return null;
  if (!isWalkable(map, start.x, start.y, start.z) || !isWalkable(map, goal.x, goal.y, goal.z)) return null;

  const maxDistance = Number.isFinite(options.maxDistance) ? Math.max(0, Math.floor(options.maxDistance)) : 64;
  const maxVisited = Number.isFinite(options.maxVisited) ? Math.max(1, Math.floor(options.maxVisited)) : 4096;
  const queue = [{ x: start.x, y: start.y, distance: 0 }];
  const visited = new Set([`${start.x}:${start.y}:${start.z}`]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 }
  ];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current.x === goal.x && current.y === goal.y) return current.distance;
    if (current.distance >= maxDistance) continue;

    for (let j = 0; j < directions.length; j++) {
      const nextX = current.x + directions[j].x;
      const nextY = current.y + directions[j].y;
      if (nextX < 0 || nextY < 0 || nextX >= MAP_SIZE || nextY >= MAP_SIZE) continue;
      const key = `${nextX}:${nextY}:${start.z}`;
      if (visited.has(key)) continue;
      if (!isWalkable(map, nextX, nextY, start.z)) continue;
      visited.add(key);
      queue.push({ x: nextX, y: nextY, distance: current.distance + 1 });
      if (visited.size >= maxVisited) return null;
    }
  }

  return null;
}

function collectAdjacencyViolations(world, map) {
  const violations = [];
  const services = world.services || [];
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    if (service.type === "FURNACE") {
      const width = Number.isFinite(service.footprintW) ? service.footprintW : 1;
      const depth = Number.isFinite(service.footprintD) ? service.footprintD : 1;
      let ok = false;
      for (let y = service.y - 1; y <= service.y + depth; y++) {
        for (let x = service.x - 1; x <= service.x + width; x++) {
          const inside = x >= service.x && x < service.x + width && y >= service.y && y < service.y + depth;
          if (inside) continue;
          if (isWalkable(map, x, y, service.z)) ok = true;
        }
      }
      if (!ok) violations.push(`Service ${service.serviceId} has no adjacent walkable tile`);
      continue;
    }
    if (!hasAdjacentWalkableTile(map, service.x, service.y, service.z)) {
      violations.push(`Service ${service.serviceId} has no adjacent walkable tile`);
    }
  }

  const fishingRoutes = world.skillRoutes && Array.isArray(world.skillRoutes.fishing) ? world.skillRoutes.fishing : [];
  for (let i = 0; i < fishingRoutes.length; i++) {
    const route = fishingRoutes[i];
    if (!isWalkable(map, route.x, route.y, route.z)) {
      violations.push(`Fishing route ${route.routeId} anchor is not walkable`);
    }
  }

  const cookingRoutes = world.skillRoutes && Array.isArray(world.skillRoutes.cooking) ? world.skillRoutes.cooking : [];
  for (let i = 0; i < cookingRoutes.length; i++) {
    const route = cookingRoutes[i];
    if (!isWalkable(map, route.x, route.y, route.z)) {
      violations.push(`Cooking route ${route.routeId} anchor is not walkable`);
    }
    const fireTiles = route.fireTiles || [];
    for (let j = 0; j < fireTiles.length; j++) {
      const tile = fireTiles[j];
      if (!isWalkable(map, tile.x, tile.y, route.z)) {
        violations.push(`Cooking route ${route.routeId} fire tile (${tile.x},${tile.y}) is not walkable`);
      }
    }
  }

  const firemakingRoutes = world.skillRoutes && Array.isArray(world.skillRoutes.firemaking) ? world.skillRoutes.firemaking : [];
  for (let i = 0; i < firemakingRoutes.length; i++) {
    const route = firemakingRoutes[i];
    if (!isWalkable(map, route.x, route.y, route.z)) {
      violations.push(`Firemaking route ${route.routeId} anchor is not walkable`);
    }
  }

  return violations;
}

module.exports = {
  MAP_SIZE,
  TileId,
  WALKABLE,
  loadWorldManifest,
  getWorldManifestEntry,
  loadWorldContent,
  loadStarterTownWorld,
  loadShopEconomy,
  buildWorldLogicalMap,
  buildWorldGameplayMap,
  buildStarterTownLogicalMap,
  buildStarterTownGameplayMap,
  findShortestPathLength,
  collectAdjacencyViolations,
  getChebyshevDistance,
  isWalkable
};
