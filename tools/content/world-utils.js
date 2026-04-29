const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { MAP_SIZE, PLANES } = require("./world-constants");
const {
  TileId,
  WALKABLE_TILE_SET,
  isDoorTileId,
  isNaturalTileId,
  isTreeTileId,
  isWalkableTileId,
  isWaterTileId,
  isWoodenGateTileId
} = require("./tile-ids");
const {
  collectAdjacencyViolations,
  findShortestPathLength,
  getChebyshevDistance,
  isWalkable
} = require("./world-pathing");

const WALKABLE = WALKABLE_TILE_SET;

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
      else if (ch === "f") map[z][mapY][mapX] = TileId.FENCE;
      else if (ch === "g") map[z][mapY][mapX] = TileId.WOODEN_GATE_CLOSED;
      else if (ch === "G") map[z][mapY][mapX] = TileId.WOODEN_GATE_OPEN;
    }
  }
}

function applyFenceSegment(map, fence) {
  if (!fence || !Array.isArray(fence.points) || fence.points.length < 2) return;
  const z = Number.isInteger(fence.z) ? fence.z : 0;
  for (let i = 1; i < fence.points.length; i++) {
    const from = fence.points[i - 1];
    const to = fence.points[i];
    if (!from || !to) continue;
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    if (dx !== 0 && dy !== 0) continue;
    let x = from.x;
    let y = from.y;
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
    for (let step = 0; step <= steps; step++) {
      if (map[z] && map[z][y] && x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE) {
        map[z][y][x] = TileId.FENCE;
      }
      x += dx;
      y += dy;
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
  const fences = world.landmarks && Array.isArray(world.landmarks.fences) ? world.landmarks.fences : [];
  for (let i = 0; i < fences.length; i++) {
    applyFenceSegment(map, fences[i]);
  }
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

module.exports = {
  MAP_SIZE,
  TileId,
  WALKABLE,
  isDoorTileId,
  isNaturalTileId,
  isTreeTileId,
  isWalkableTileId,
  isWaterTileId,
  isWoodenGateTileId,
  inTownCore,
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
