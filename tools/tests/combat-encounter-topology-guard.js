const path = require("path");

const { loadTsModule } = require("./ts-module-loader");
const { buildWorldGameplayMap, WALKABLE } = require("../content/world-utils");

const WORLD_RULES = {
  starter_town: {
    groupRules: {
      starter_field: {
        expectedCount: 2,
        minSafeRouteClearance: 6,
        maxLocalCount: 2,
        maxLocalBudget: 24,
        requiresRootedHome: false,
        maxSameGroupDistance: 12
      },
      starter_road: {
        expectedCount: 1,
        minSafeRouteClearance: 30,
        maxLocalCount: 1,
        maxLocalBudget: 22,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_east_field_north: {
        expectedCount: 1,
        minSafeRouteClearance: 18,
        maxLocalCount: 1,
        maxLocalBudget: 20,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_east_field_center: {
        expectedCount: 1,
        minSafeRouteClearance: 18,
        maxLocalCount: 1,
        maxLocalBudget: 20,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_east_field_south: {
        expectedCount: 1,
        minSafeRouteClearance: 18,
        maxLocalCount: 1,
        maxLocalBudget: 20,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_east_far_boar_west: {
        expectedCount: 1,
        minSafeRouteClearance: 10,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_east_far_boar_center: {
        expectedCount: 1,
        minSafeRouteClearance: 10,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_east_far_boar_east: {
        expectedCount: 1,
        minSafeRouteClearance: 10,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_boars_west_north: {
        expectedCount: 1,
        minSafeRouteClearance: 100,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_boars_west_south: {
        expectedCount: 1,
        minSafeRouteClearance: 120,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_boars_east_north: {
        expectedCount: 1,
        minSafeRouteClearance: 90,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_boars_west_edge_north: {
        expectedCount: 1,
        minSafeRouteClearance: 80,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_boars_west_center: {
        expectedCount: 1,
        minSafeRouteClearance: 100,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_boars_southeast: {
        expectedCount: 1,
        minSafeRouteClearance: 90,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_wolf_northwest: {
        expectedCount: 1,
        minSafeRouteClearance: 12,
        maxLocalCount: 1,
        maxLocalBudget: 14,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_wolf_north: {
        expectedCount: 1,
        minSafeRouteClearance: 12,
        maxLocalCount: 1,
        maxLocalBudget: 14,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_wolf_northeast: {
        expectedCount: 1,
        minSafeRouteClearance: 12,
        maxLocalCount: 1,
        maxLocalBudget: 14,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      starter_outer_wolf_southwest: {
        expectedCount: 3,
        minSafeRouteClearance: 20,
        maxLocalCount: 3,
        maxLocalBudget: 42,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      starter_outer_wolf_south: {
        expectedCount: 3,
        minSafeRouteClearance: 20,
        maxLocalCount: 3,
        maxLocalBudget: 42,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      starter_outer_wolf_southeast: {
        expectedCount: 3,
        minSafeRouteClearance: 20,
        maxLocalCount: 3,
        maxLocalBudget: 42,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      starter_far_southern_goblins: {
        expectedCount: 4,
        minSafeRouteClearance: 20,
        maxLocalCount: 4,
        maxLocalBudget: 40,
        requiresRootedHome: false,
        maxSameGroupDistance: 12
      },
      starter_far_eastern_goblins: {
        expectedCount: 4,
        minSafeRouteClearance: 20,
        maxLocalCount: 4,
        maxLocalBudget: 40,
        requiresRootedHome: false,
        maxSameGroupDistance: 12
      },
      starter_outer_rats_southwest: {
        expectedCount: 4,
        minSafeRouteClearance: 20,
        maxLocalCount: 4,
        maxLocalBudget: 28,
        requiresRootedHome: false,
        maxSameGroupDistance: 12
      },
      starter_outer_chickens_southwest: {
        expectedCount: 5,
        minSafeRouteClearance: 20,
        maxLocalCount: 5,
        maxLocalBudget: 30,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      starter_outer_chickens_southeast: {
        expectedCount: 5,
        minSafeRouteClearance: 20,
        maxLocalCount: 5,
        maxLocalBudget: 30,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      starter_training: {
        expectedCount: 1,
        minSafeRouteClearance: 20,
        maxLocalCount: 1,
        maxLocalBudget: 4,
        requiresRootedHome: true,
        maxSameGroupDistance: 0
      },
      starter_east_outpost_guard_post: {
        expectedCount: 3,
        minSafeRouteClearance: 50,
        maxLocalCount: 3,
        maxLocalBudget: 33,
        requiresRootedHome: false,
        maxSameGroupDistance: 8
      }
    }
  },
  north_road_camp: {
    groupRules: {
      north_road_outer_lane_passive: {
        expectedCount: 2,
        minSafeRouteClearance: 4,
        maxLocalCount: 2,
        maxLocalBudget: 18,
        requiresRootedHome: false,
        maxSameGroupDistance: 8
      },
      north_road_outer_lane_aggressive: {
        expectedCount: 2,
        minSafeRouteClearance: 6,
        maxLocalCount: 2,
        maxLocalBudget: 16,
        requiresRootedHome: false,
        maxSameGroupDistance: 8
      },
      north_road_far_roaming_goblins_west: {
        expectedCount: 1,
        minSafeRouteClearance: 8,
        maxLocalCount: 1,
        maxLocalBudget: 10,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_roaming_goblins_mid: {
        expectedCount: 1,
        minSafeRouteClearance: 8,
        maxLocalCount: 1,
        maxLocalBudget: 10,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_roaming_goblins_east: {
        expectedCount: 1,
        minSafeRouteClearance: 8,
        maxLocalCount: 1,
        maxLocalBudget: 9,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_outer_band_boars: {
        expectedCount: 2,
        minSafeRouteClearance: 10,
        maxLocalCount: 2,
        maxLocalBudget: 18,
        requiresRootedHome: false,
        maxSameGroupDistance: 16
      },
      north_road_outer_band_wolves: {
        expectedCount: 2,
        minSafeRouteClearance: 12,
        maxLocalCount: 2,
        maxLocalBudget: 24,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      north_road_far_boars_northwest: {
        expectedCount: 1,
        minSafeRouteClearance: 150,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_boars_southwest: {
        expectedCount: 1,
        minSafeRouteClearance: 130,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_boars_east: {
        expectedCount: 1,
        minSafeRouteClearance: 200,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_boars_southwest_edge: {
        expectedCount: 1,
        minSafeRouteClearance: 300,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_boars_northeast: {
        expectedCount: 1,
        minSafeRouteClearance: 300,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_boars_southeast: {
        expectedCount: 1,
        minSafeRouteClearance: 330,
        maxLocalCount: 1,
        maxLocalBudget: 12,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      },
      north_road_far_east_wolves_north: {
        expectedCount: 3,
        minSafeRouteClearance: 20,
        maxLocalCount: 3,
        maxLocalBudget: 42,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      north_road_far_east_wolves_south: {
        expectedCount: 3,
        minSafeRouteClearance: 20,
        maxLocalCount: 3,
        maxLocalBudget: 42,
        requiresRootedHome: false,
        maxSameGroupDistance: 24
      },
      north_road_far_eastern_goblins: {
        expectedCount: 4,
        minSafeRouteClearance: 20,
        maxLocalCount: 4,
        maxLocalBudget: 40,
        requiresRootedHome: false,
        maxSameGroupDistance: 12
      },
      north_road_threshold_guard: {
        expectedCount: 1,
        minSafeRouteClearance: 4,
        maxLocalCount: 1,
        maxLocalBudget: 9,
        requiresRootedHome: false,
        maxSameGroupDistance: 0
      }
    }
  }
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function chebyshevDistance(a, b) {
  return Math.max(Math.abs(Math.floor(a.x) - Math.floor(b.x)), Math.abs(Math.floor(a.y) - Math.floor(b.y)));
}

function buildRouteAnchors(world) {
  const routeGroups = ["fishing", "cooking", "mining", "runecrafting", "woodcutting"];
  const anchors = [];
  for (let i = 0; i < routeGroups.length; i += 1) {
    const groupName = routeGroups[i];
    const routes = Array.isArray(world.skillRoutes && world.skillRoutes[groupName]) ? world.skillRoutes[groupName] : [];
    for (let j = 0; j < routes.length; j += 1) {
      const route = routes[j];
      if (!route || !route.routeId) continue;
      anchors.push({
        routeId: route.routeId,
        label: route.label || route.routeId,
        x: route.x,
        y: route.y,
        z: route.z
      });
    }
  }
  return anchors;
}

function isWalkableTile(map, point) {
  return !!(map[point.z] && map[point.z][point.y] && WALKABLE.has(map[point.z][point.y][point.x]));
}

function hasAdjacentWalkableTile(map, point) {
  const neighbors = [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
    { x: point.x + 1, y: point.y + 1 },
    { x: point.x + 1, y: point.y - 1 },
    { x: point.x - 1, y: point.y + 1 },
    { x: point.x - 1, y: point.y - 1 }
  ];

  for (let i = 0; i < neighbors.length; i += 1) {
    const neighbor = neighbors[i];
    if (neighbor.x < 0 || neighbor.y < 0) continue;
    if (isWalkableTile(map, { x: neighbor.x, y: neighbor.y, z: point.z })) return true;
  }

  return false;
}

function countSpawnsWithinRadius(spawns, point, radius) {
  let count = 0;
  for (let i = 0; i < spawns.length; i += 1) {
    if (chebyshevDistance(spawns[i].spawnTile, point) <= radius) count += 1;
  }
  return count;
}

function estimatePathBudget(runtimeState) {
  return 1 + runtimeState.resolvedRoamingRadius + runtimeState.resolvedAggroRadius;
}

function runWorld(root, worldId, worldRules) {
  const combatContent = loadTsModule(path.join(root, "src", "game", "combat", "content.ts"));
  const worldAuthoring = loadTsModule(path.join(root, "src", "game", "world", "authoring.ts"));
  const world = worldAuthoring.getWorldDefinition(worldId);
  const stamps = worldAuthoring.getWorldStamps(worldId);
  const map = buildWorldGameplayMap(world, stamps);
  const routeAnchors = buildRouteAnchors(world);
  const spawnNodes = combatContent.listEnemySpawnNodesForWorld(worldId);
  const enemyTypes = new Map(combatContent.listEnemyTypes().map((enemy) => [enemy.enemyId, enemy]));
  const groupRules = worldRules && worldRules.groupRules ? worldRules.groupRules : {};

  assert(spawnNodes.length > 0, `${worldId} should expose authored combat spawns`);

  const groupedSpawns = new Map();
  const runtimeBySpawnId = new Map();

  for (let i = 0; i < spawnNodes.length; i += 1) {
    const spawn = spawnNodes[i];
    const groupId = String(spawn.spawnGroupId || "").trim();
    const rules = groupRules[groupId];
    const enemyType = enemyTypes.get(spawn.enemyId);

    assert(groupId, `${spawn.spawnNodeId} should have a spawnGroupId`);
    assert(rules, `${spawn.spawnNodeId} uses unexpected spawn group '${groupId}'`);
    assert(enemyType, `${spawn.spawnNodeId} should resolve the enemy type '${spawn.enemyId}'`);
    assert(spawn.spawnEnabled === true, `${spawn.spawnNodeId} should be enabled`);
    assert(isWalkableTile(map, spawn.spawnTile), `${spawn.spawnNodeId} spawn tile should be walkable in the authored world`);
    assert(
      hasAdjacentWalkableTile(map, spawn.spawnTile),
      `${spawn.spawnNodeId} should leave at least one adjacent walkable tile for melee resolution`
    );
    assert(
      !spawn.homeTileOverride || chebyshevDistance(spawn.homeTileOverride, spawn.spawnTile) === 0,
      `${spawn.spawnNodeId} should keep Home Tile anchored on the spawn tile`
    );

    const runtimeState = combatContent.createEnemyRuntimeState(spawn);
    runtimeBySpawnId.set(spawn.spawnNodeId, runtimeState);
    assert(
      runtimeState.resolvedHomeTile.x === spawn.spawnTile.x &&
        runtimeState.resolvedHomeTile.y === spawn.spawnTile.y &&
        runtimeState.resolvedHomeTile.z === spawn.spawnTile.z,
      `${spawn.spawnNodeId} should resolve its home tile from the authored spawn tile`
    );
    assert(
      runtimeState.resolvedChaseRange >= enemyType.behavior.chaseRange,
      `${spawn.spawnNodeId} should not shorten the authored leash range`
    );
    assert(
      runtimeState.resolvedChaseRange >= runtimeState.resolvedRoamingRadius + 2,
      `${spawn.spawnNodeId} should keep chase range anchored to home plus roaming radius`
    );

    if (rules.requiresRootedHome) {
      assert(
        runtimeState.resolvedRoamingRadius === 0,
        `${spawn.spawnNodeId} should stay rooted in its encounter pocket`
      );
    } else {
      assert(
        runtimeState.resolvedRoamingRadius > 0,
        `${spawn.spawnNodeId} should retain an authored roaming radius`
      );
    }

    if (!groupedSpawns.has(groupId)) groupedSpawns.set(groupId, []);
    groupedSpawns.get(groupId).push(spawn);
  }

  for (const [groupId, spawns] of groupedSpawns.entries()) {
    const rules = groupRules[groupId];
    assert(spawns.length === rules.expectedCount, `${groupId} should contain exactly ${rules.expectedCount} spawn nodes`);

    let localBudget = 0;
    for (let i = 0; i < spawns.length; i += 1) {
      const spawn = spawns[i];
      const runtimeState = runtimeBySpawnId.get(spawn.spawnNodeId);

      const routeClearance = routeAnchors.reduce((minimum, anchor) => {
        if (anchor.z !== spawn.spawnTile.z) return minimum;
        return Math.min(minimum, chebyshevDistance(spawn.spawnTile, anchor));
      }, Number.POSITIVE_INFINITY);
      assert(
        routeClearance >= rules.minSafeRouteClearance,
        `${spawn.spawnNodeId} should stay at least ${rules.minSafeRouteClearance} tiles from protected route anchors`
      );

      const localCount = countSpawnsWithinRadius(spawns, spawn.spawnTile, 15);
      assert(
        localCount <= rules.maxLocalCount,
        `${groupId} should not stack more than ${rules.maxLocalCount} spawns inside a local pocket`
      );

      localBudget += estimatePathBudget(runtimeState);
    }

    assert(
      localBudget <= rules.maxLocalBudget,
      `${groupId} should stay under the local pathfinding/tick budget`
    );

    if (spawns.length > 1) {
      for (let i = 0; i < spawns.length; i += 1) {
        for (let j = i + 1; j < spawns.length; j += 1) {
          const distance = chebyshevDistance(spawns[i].spawnTile, spawns[j].spawnTile);
          assert(
            distance <= rules.maxSameGroupDistance,
            `${groupId} members should stay within their authored guard-post spacing`
          );
        }
      }
    }
  }

  const allSpawns = spawnNodes.slice();
  for (let i = 0; i < allSpawns.length; i += 1) {
    const left = allSpawns[i];
    const leftRuntime = runtimeBySpawnId.get(left.spawnNodeId);
    const leftHalo = Math.max(1, leftRuntime.resolvedAggroRadius);

    for (let j = i + 1; j < allSpawns.length; j += 1) {
      const right = allSpawns[j];
      if (left.spawnGroupId === right.spawnGroupId) continue;

      const rightRuntime = runtimeBySpawnId.get(right.spawnNodeId);
      const rightHalo = Math.max(1, rightRuntime.resolvedAggroRadius);
      const distance = chebyshevDistance(left.spawnTile, right.spawnTile);
      assert(
        distance > leftHalo + rightHalo,
        `${left.spawnNodeId} should not overlap the aggro bubble of ${right.spawnNodeId}`
      );
    }
  }
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  for (const [worldId, worldRules] of Object.entries(WORLD_RULES)) {
    runWorld(root, worldId, worldRules);
  }
  console.log("Combat encounter topology/perf guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
