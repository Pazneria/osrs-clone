const path = require("path");

const { loadWorldContent } = require("../content/world-utils");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function countStraightTriples(nodes) {
  const nodeKeys = new Set(nodes.map((node) => `${node.x},${node.y}`));
  const seenTriples = new Set();
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
    [2, 0],
    [0, 2],
    [2, 2],
    [2, -2],
    [3, 0],
    [0, 3]
  ];

  let tripleCount = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    for (let d = 0; d < directions.length; d++) {
      const [dx, dy] = directions[d];
      const secondKey = `${node.x + dx},${node.y + dy}`;
      const thirdKey = `${node.x + (dx * 2)},${node.y + (dy * 2)}`;
      if (!nodeKeys.has(secondKey) || !nodeKeys.has(thirdKey)) continue;

      const tripleKey = [
        `${node.x},${node.y}`,
        secondKey,
        thirdKey
      ].sort().join("|");
      if (seenTriples.has(tripleKey)) continue;
      seenTriples.add(tripleKey);
      tripleCount++;
    }
  }

  return tripleCount;
}

function summarizeRoute(nodes) {
  const byX = new Map();
  const byY = new Map();
  const byDiagAscending = new Map();
  const byDiagDescending = new Map();

  let nearestDistanceSum = 0;
  let nearestDistanceMin = Number.POSITIVE_INFINITY;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    byX.set(node.x, (byX.get(node.x) || 0) + 1);
    byY.set(node.y, (byY.get(node.y) || 0) + 1);
    byDiagAscending.set(node.x - node.y, (byDiagAscending.get(node.x - node.y) || 0) + 1);
    byDiagDescending.set(node.x + node.y, (byDiagDescending.get(node.x + node.y) || 0) + 1);

    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      nearestDistance = Math.min(
        nearestDistance,
        Math.hypot(node.x - nodes[j].x, node.y - nodes[j].y)
      );
    }
    nearestDistanceSum += nearestDistance;
    nearestDistanceMin = Math.min(nearestDistanceMin, nearestDistance);
  }

  let maxSameX = 0;
  let maxSameY = 0;
  let maxSameDiagAscending = 0;
  let maxSameDiagDescending = 0;
  for (const value of byX.values()) maxSameX = Math.max(maxSameX, value);
  for (const value of byY.values()) maxSameY = Math.max(maxSameY, value);
  for (const value of byDiagAscending.values()) maxSameDiagAscending = Math.max(maxSameDiagAscending, value);
  for (const value of byDiagDescending.values()) maxSameDiagDescending = Math.max(maxSameDiagDescending, value);

  return {
    count: nodes.length,
    nearestDistanceAverage: nearestDistanceSum / Math.max(1, nodes.length),
    nearestDistanceMin,
    maxSameX,
    maxSameY,
    maxSameDiagAscending,
    maxSameDiagDescending,
    straightTriples: countStraightTriples(nodes)
  };
}

function assertMiningRouteLayout(worldId, route, nodes) {
  const summary = summarizeRoute(nodes);
  assert(summary.count === route.count, `${worldId}:${route.routeId} count mismatch between route and mining nodes`);
  assert(summary.straightTriples === 0, `${worldId}:${route.routeId} should not contain straight mining triples`);

  const maxLineOccupancy = summary.count >= 20 ? 3 : 2;
  assert(summary.maxSameX <= maxLineOccupancy, `${worldId}:${route.routeId} has too many rocks on one vertical line`);
  assert(summary.maxSameY <= maxLineOccupancy, `${worldId}:${route.routeId} has too many rocks on one horizontal line`);
  assert(summary.maxSameDiagAscending <= maxLineOccupancy, `${worldId}:${route.routeId} has too many rocks on one rising diagonal`);
  assert(summary.maxSameDiagDescending <= maxLineOccupancy, `${worldId}:${route.routeId} has too many rocks on one falling diagonal`);

  if (summary.count >= 8) {
    assert(summary.nearestDistanceAverage >= 2.5, `${worldId}:${route.routeId} nearest-distance average is too dense`);
  }
  assert(summary.nearestDistanceMin >= 2, `${worldId}:${route.routeId} contains overlapping or touching mining rocks`);
}

function assertWorld(worldId) {
  const root = path.resolve(__dirname, "..", "..");
  const { world } = loadWorldContent(root, worldId);
  const routes = Array.isArray(world.skillRoutes?.mining) ? world.skillRoutes.mining : [];
  const nodes = Array.isArray(world.resourceNodes?.mining) ? world.resourceNodes.mining : [];

  assert(routes.length > 0, `${worldId} is missing mining routes`);
  assert(nodes.length > 0, `${worldId} is missing mining nodes`);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const routeNodes = nodes.filter((entry) => entry.routeId === route.routeId);
    assert(routeNodes.length > 0, `${worldId}:${route.routeId} is missing mining nodes`);
    assertMiningRouteLayout(worldId, route, routeNodes);
  }
}

function run() {
  assertWorld("starter_town");
  console.log("Mining layout guard passed for starter_town.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
