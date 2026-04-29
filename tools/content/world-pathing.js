const { MAP_SIZE } = require("./world-constants");
const { isWalkableTileId } = require("./tile-ids");

function isWalkable(map, x, y, z) {
  if (!map[z] || !map[z][y]) return false;
  return isWalkableTileId(map[z][y][x]);
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
  const allowedBounds = options && options.allowedBounds && typeof options.allowedBounds === "object"
    ? options.allowedBounds
    : null;
  const insideAllowedBounds = (point) => {
    if (!allowedBounds) return true;
    if (Number.isFinite(allowedBounds.z) && point.z !== allowedBounds.z) return false;
    if (Number.isFinite(allowedBounds.xMin) && point.x < allowedBounds.xMin) return false;
    if (Number.isFinite(allowedBounds.xMax) && point.x > allowedBounds.xMax) return false;
    if (Number.isFinite(allowedBounds.yMin) && point.y < allowedBounds.yMin) return false;
    if (Number.isFinite(allowedBounds.yMax) && point.y > allowedBounds.yMax) return false;
    return true;
  };
  if (!insideAllowedBounds(start) || !insideAllowedBounds(goal)) return null;
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
  const canTraverseStep = (current, next) => {
    if (!insideAllowedBounds({ x: next.x, y: next.y, z: start.z })) return false;
    if (!isWalkable(map, next.x, next.y, start.z)) return false;
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    if (Math.abs(dx) !== 1 || Math.abs(dy) !== 1) return true;
    return isWalkable(map, current.x + dx, current.y, start.z)
      && isWalkable(map, current.x, current.y + dy, start.z);
  };

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
      if (!canTraverseStep(current, { x: nextX, y: nextY })) continue;
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
  collectAdjacencyViolations,
  findShortestPathLength,
  getChebyshevDistance,
  hasAdjacentWalkableTile,
  isWalkable
};
