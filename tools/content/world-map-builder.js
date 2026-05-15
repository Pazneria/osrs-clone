const { MAP_SIZE, PLANES } = require("./world-constants");
const { TileId } = require("./tile-ids");

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

function pointInPolygon(points, x, y) {
  if (!Array.isArray(points) || points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (!a || !b) continue;
    const dy = b.y - a.y;
    if (Math.abs(dy) < 0.0001) continue;
    const intersects = ((a.y > y) !== (b.y > y))
      && (x < ((b.x - a.x) * (y - a.y)) / dy + a.x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 0.0001) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, (((px - ax) * vx) + ((py - ay) * vy)) / lenSq));
  const cx = ax + (vx * t);
  const cy = ay + (vy * t);
  return Math.hypot(px - cx, py - cy);
}

function distanceToPolygonEdge(points, x, y) {
  if (!Array.isArray(points) || points.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (!a || !b) continue;
    best = Math.min(best, pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y));
  }
  return best;
}

function isWaterTileId(tileId) {
  return tileId === TileId.WATER_SHALLOW || tileId === TileId.WATER_DEEP;
}

function isNaturalTerrainTileId(tileId) {
  return tileId === TileId.GRASS
    || tileId === TileId.DIRT
    || tileId === TileId.SAND
    || tileId === TileId.SHORE
    || tileId === TileId.STUMP;
}

function resolveTerrainTileId(tileKey) {
  const key = typeof tileKey === "string" ? tileKey.trim() : "";
  return key && Number.isFinite(TileId[key]) ? TileId[key] : null;
}

function getEllipseRotation(ellipse) {
  return Number.isFinite(ellipse && ellipse.rotationRadians) ? Number(ellipse.rotationRadians) : 0;
}

function getEllipseBounds(ellipse) {
  const rotation = getEllipseRotation(ellipse);
  if (Math.abs(rotation) <= 0.000001) {
    return {
      xMin: ellipse.cx - ellipse.rx,
      xMax: ellipse.cx + ellipse.rx,
      yMin: ellipse.cy - ellipse.ry,
      yMax: ellipse.cy + ellipse.ry
    };
  }
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const halfWidth = Math.sqrt((ellipse.rx * cos) ** 2 + (ellipse.ry * sin) ** 2);
  const halfHeight = Math.sqrt((ellipse.rx * sin) ** 2 + (ellipse.ry * cos) ** 2);
  return {
    xMin: ellipse.cx - halfWidth,
    xMax: ellipse.cx + halfWidth,
    yMin: ellipse.cy - halfHeight,
    yMax: ellipse.cy + halfHeight
  };
}

function getRotatedEllipseDepthNorm(ellipse, x, y) {
  if (!ellipse || !Number.isFinite(ellipse.rx) || !Number.isFinite(ellipse.ry) || ellipse.rx <= 0 || ellipse.ry <= 0) return null;
  const rotation = getEllipseRotation(ellipse);
  const dx = x - ellipse.cx;
  const dy = y - ellipse.cy;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const localX = (dx * cos) + (dy * sin);
  const localY = (-dx * sin) + (dy * cos);
  const nx = localX / ellipse.rx;
  const ny = localY / ellipse.ry;
  const d = Math.sqrt((nx * nx) + (ny * ny));
  return d <= 1.0 ? 1.0 - d : null;
}

function applyEllipseWater(map, ellipse) {
  const bounds = getEllipseBounds(ellipse);
  for (let y = Math.max(1, Math.floor(bounds.yMin - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(bounds.yMax + 1)); y++) {
    for (let x = Math.max(1, Math.floor(bounds.xMin - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(bounds.xMax + 1)); x++) {
      const depthNorm = getRotatedEllipseDepthNorm(ellipse, x, y);
      if (depthNorm !== null) carveWaterTile(map, x, y, depthNorm);
    }
  }
}

function distanceToPath(points, x, y) {
  if (!Array.isArray(points) || points.length === 0) return Infinity;
  if (points.length === 1 && points[0]) return Math.hypot(x - points[0].x, y - points[0].y);
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (!from || !to) continue;
    best = Math.min(best, pointToSegmentDistance(x, y, from.x, from.y, to.x, to.y));
  }
  return best;
}

function getPathBounds(points, padding) {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    xMin = Math.min(xMin, point.x);
    xMax = Math.max(xMax, point.x);
    yMin = Math.min(yMin, point.y);
    yMax = Math.max(yMax, point.y);
  }
  if (!Number.isFinite(xMin)) return null;
  return {
    xMin: Math.max(1, Math.floor(xMin - padding)),
    xMax: Math.min(MAP_SIZE - 2, Math.ceil(xMax + padding)),
    yMin: Math.max(1, Math.floor(yMin - padding)),
    yMax: Math.min(MAP_SIZE - 2, Math.ceil(yMax + padding))
  };
}

function getPaddedEllipseBounds(ellipse, padding) {
  const bounds = getEllipseBounds(ellipse);
  return {
    xMin: Math.max(1, Math.floor(bounds.xMin - padding)),
    xMax: Math.min(MAP_SIZE - 2, Math.ceil(bounds.xMax + padding)),
    yMin: Math.max(1, Math.floor(bounds.yMin - padding)),
    yMax: Math.min(MAP_SIZE - 2, Math.ceil(bounds.yMax + padding))
  };
}

function getLandformEllipseStrength(ellipse, x, y, edgeSoftness) {
  if (!ellipse || !Number.isFinite(ellipse.rx) || !Number.isFinite(ellipse.ry) || ellipse.rx <= 0 || ellipse.ry <= 0) return 0;
  const rotation = getEllipseRotation(ellipse);
  const dx = x - ellipse.cx;
  const dy = y - ellipse.cy;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const localX = (dx * cos) + (dy * sin);
  const localY = (-dx * sin) + (dy * cos);
  const nx = localX / ellipse.rx;
  const ny = localY / ellipse.ry;
  const d = Math.sqrt((nx * nx) + (ny * ny));
  if (d <= 1) return 1;
  if (edgeSoftness <= 0) return 0;
  const edgeDistance = (d - 1) * Math.min(ellipse.rx, ellipse.ry);
  return Math.max(0, Math.min(1, 1 - (edgeDistance / edgeSoftness)));
}

function stampLandformTile(map, landformPatch, x, y, z, strength) {
  if (strength <= 0.16 || inTownCore(x, y) || !map[z] || !map[z][y]) return;
  const tile = map[z][y][x];
  if (isWaterTileId(tile) || !isNaturalTerrainTileId(tile)) return;
  const landformTileId = resolveTerrainTileId(landformPatch.tileId);
  if (Number.isFinite(landformTileId)) map[z][y][x] = landformTileId;
}

function applyTerrainLandformPatches(map, world) {
  const landforms = world.terrainPatches && Array.isArray(world.terrainPatches.landforms)
    ? world.terrainPatches.landforms
    : [];
  for (let landformIndex = 0; landformIndex < landforms.length; landformIndex++) {
    const landformPatch = landforms[landformIndex];
    if (!landformPatch || !landformPatch.tileId) continue;
    const z = Number.isInteger(landformPatch.z) ? landformPatch.z : 0;
    if (!map[z]) continue;
    const edgeSoftness = Number.isFinite(landformPatch.edgeSoftness)
      ? Math.max(0, Number(landformPatch.edgeSoftness))
      : 3.0;

    if (landformPatch.kind === "ellipse") {
      const bounds = getPaddedEllipseBounds(landformPatch, edgeSoftness + 1);
      for (let y = bounds.yMin; y <= bounds.yMax; y++) {
        if (!map[z][y]) continue;
        for (let x = bounds.xMin; x <= bounds.xMax; x++) {
          const strength = getLandformEllipseStrength(landformPatch, x + 0.5, y + 0.5, edgeSoftness);
          stampLandformTile(map, landformPatch, x, y, z, strength);
        }
      }
      continue;
    }

    if (landformPatch.kind === "path") {
      const points = Array.isArray(landformPatch.points) ? landformPatch.points : [];
      const pathWidth = Number.isFinite(landformPatch.pathWidth) ? Math.max(0.5, Number(landformPatch.pathWidth)) : 6.0;
      const halfWidth = pathWidth / 2;
      const pathEdgeSoftness = Number.isFinite(landformPatch.edgeSoftness)
        ? Math.max(0, Number(landformPatch.edgeSoftness))
        : Math.max(1.0, halfWidth * 0.65);
      const bounds = getPathBounds(points, halfWidth + pathEdgeSoftness + 1);
      if (!bounds) continue;
      for (let y = bounds.yMin; y <= bounds.yMax; y++) {
        if (!map[z][y]) continue;
        for (let x = bounds.xMin; x <= bounds.xMax; x++) {
          const dist = distanceToPath(points, x + 0.5, y + 0.5);
          if (dist > halfWidth + pathEdgeSoftness) continue;
          const edgeT = pathEdgeSoftness <= 0 ? 1 : Math.max(0, Math.min(1, 1 - ((dist - halfWidth) / pathEdgeSoftness)));
          stampLandformTile(map, landformPatch, x, y, z, dist <= halfWidth ? 1 : edgeT);
        }
      }
    }
  }
}

function applyIslandWaterPatch(map, world) {
  const patch = world.terrainPatches && world.terrainPatches.islandWater;
  if (!patch || patch.enabled === false || !patch.waterBounds || !Array.isArray(patch.landPolygon) || patch.landPolygon.length < 3) return;
  const bounds = patch.waterBounds;
  const xMin = Math.max(0, Math.floor(bounds.xMin));
  const xMax = Math.min(MAP_SIZE - 1, Math.ceil(bounds.xMax));
  const yMin = Math.max(0, Math.floor(bounds.yMin));
  const yMax = Math.min(MAP_SIZE - 1, Math.ceil(bounds.yMax));
  const shoreWidth = Number.isFinite(patch.shoreWidth) ? Math.max(0, Number(patch.shoreWidth)) : 2.2;
  const shallowDistance = Number.isFinite(patch.shallowDistance) ? Math.max(0.5, Number(patch.shallowDistance)) : 4.0;

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const insideLand = pointInPolygon(patch.landPolygon, px, py);
      const edgeDistance = distanceToPolygonEdge(patch.landPolygon, px, py);
      if (insideLand) {
        map[0][y][x] = edgeDistance <= shoreWidth ? TileId.SHORE : TileId.GRASS;
      } else {
        map[0][y][x] = edgeDistance <= shallowDistance ? TileId.WATER_SHALLOW : TileId.WATER_DEEP;
      }
    }
  }
}

function applyWaterFeatures(map, world) {
  applyIslandWaterPatch(map, world);

  const lakes = world.terrainPatches.lakes || [];
  for (let i = 0; i < lakes.length; i++) {
    applyEllipseWater(map, lakes[i]);
  }

  applyEllipseWater(map, world.terrainPatches.castleFrontPond);

  const deep = world.terrainPatches.deepWaterCenter;
  for (let y = deep.yMin; y <= deep.yMax; y++) {
    for (let x = deep.xMin; x <= deep.xMax; x++) {
      map[0][y][x] = TileId.WATER_DEEP;
    }
  }

  const pier = world.terrainPatches.pier;
  if (pier && pier.enabled !== false) {
    for (let y = pier.yStart; y <= pier.yEnd; y++) {
      for (let x = pier.xMin; x <= pier.xMax; x++) {
        map[0][y][x] = TileId.FLOOR_WOOD;
      }
    }
    for (let x = pier.xMin; x <= pier.xMax; x++) {
      map[0][pier.entryY][x] = TileId.SHORE;
    }
  }
}

function applyTerrainPathPatches(map, world) {
  const paths = world.terrainPatches && Array.isArray(world.terrainPatches.paths)
    ? world.terrainPatches.paths
    : [];
  for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
    const pathPatch = paths[pathIndex];
    const points = pathPatch && Array.isArray(pathPatch.points) ? pathPatch.points : [];
    const pathWidth = Number.isFinite(pathPatch && pathPatch.pathWidth) ? Math.max(0.5, Number(pathPatch.pathWidth)) : 3.0;
    const halfWidth = pathWidth / 2;
    const edgeSoftness = Number.isFinite(pathPatch && pathPatch.edgeSoftness)
      ? Math.max(0, Number(pathPatch.edgeSoftness))
      : Math.max(0.5, halfWidth * 0.45);
    const bounds = getPathBounds(points, halfWidth + edgeSoftness + 1);
    const z = Number.isInteger(pathPatch && pathPatch.z) ? pathPatch.z : 0;
    const tileKey = typeof pathPatch.tileId === "string" ? pathPatch.tileId.trim() : "";
    const pathTileId = tileKey && Number.isFinite(TileId[tileKey]) ? TileId[tileKey] : TileId.DIRT;
    if (!bounds || !map[z]) continue;
    for (let y = bounds.yMin; y <= bounds.yMax; y++) {
      if (!map[z][y]) continue;
      for (let x = bounds.xMin; x <= bounds.xMax; x++) {
        const tile = map[z][y][x];
        if (isWaterTileId(tile)) continue;
        if (!(tile === TileId.GRASS || tile === TileId.DIRT || tile === TileId.SAND || tile === TileId.SHORE || tile === TileId.STUMP)) continue;
        const dist = distanceToPath(points, x + 0.5, y + 0.5);
        if (dist <= halfWidth + edgeSoftness) map[z][y][x] = pathTileId;
      }
    }
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

function normalizeFencePoint(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return { x: Math.round(point.x), y: Math.round(point.y) };
}

function forEachFenceLineTile(from, to, visit) {
  const start = normalizeFencePoint(from);
  const end = normalizeFencePoint(to);
  if (!start || !end || typeof visit !== "function") return;
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    visit(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = err * 2;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
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
    forEachFenceLineTile(from, to, (x, y) => {
      if (map[z] && map[z][y] && x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE) {
        map[z][y][x] = TileId.FENCE;
      }
    });
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
  const decorProps = world.landmarks && Array.isArray(world.landmarks.decorProps) ? world.landmarks.decorProps : [];
  for (let i = 0; i < decorProps.length; i++) {
    const prop = decorProps[i];
    if (!prop || prop.blocksMovement !== true) continue;
    if (!map[prop.z] || !map[prop.z][prop.y]) continue;
    map[prop.z][prop.y][prop.x] = TileId.OBSTACLE;
  }
  const approach = world.terrainPatches.smithingHallApproach;
  if (approach && approach.enabled === false) return;
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
  applyTerrainLandformPatches(map, world);
  applyTerrainPathPatches(map, world);
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

module.exports = {
  buildWorldGameplayMap,
  buildWorldLogicalMap,
  inTownCore
};
