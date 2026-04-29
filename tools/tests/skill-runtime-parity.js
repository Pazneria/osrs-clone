const path = require("path");
const freezeSource = require("../content/starter-town-freeze-source.json");

const {
  MAP_SIZE,
  TileId,
  isNaturalTileId,
  isTreeTileId,
  isWalkableTileId,
  isWaterTileId,
  buildWorldLogicalMap,
  loadWorldContent
} = require("../content/world-utils");
const { loadTsModule } = require("./ts-module-loader");

const WORLD_ID = "starter_town";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createHeightMap(planes) {
  return Array(planes).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
}

function inTownCore(x, y) {
  const inCastle = x >= 190 && x <= 220 && y >= 190 && y <= 215;
  const inStore = x >= 177 && x <= 185 && y >= 232 && y <= 240;
  const inSmithyApron = x >= 217 && x <= 233 && y >= 224 && y <= 244;
  return inCastle || inStore || inSmithyApron;
}

function cloneRoute(route) {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

function cloneCookingRoute(route) {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : [],
    fireTiles: Array.isArray(route.fireTiles) ? route.fireTiles.map((tile) => ({ ...tile })) : []
  };
}

function buildStaticMerchantRenderPlacements(world) {
  const dynamicMerchantIds = new Set(
    (freezeSource.runecraftingMerchants || [])
      .map((entry) => String(entry.merchantId || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const services = Array.isArray(world.services) ? world.services : [];
  return services
    .filter((service) => {
      if (!(service && service.type === "MERCHANT" && service.merchantId && service.merchantId !== "general_store")) return false;
      const merchantId = String(service.merchantId || "").trim().toLowerCase();
      return !dynamicMerchantIds.has(merchantId);
    })
    .map((service) => ({
      type: Number.isFinite(service.npcType) ? service.npcType : 2,
      x: service.x,
      y: service.y,
      z: Number.isFinite(service.z) ? service.z : 0,
      name: service.name,
      merchantId: service.merchantId,
      action: service.action || "Trade",
      facingYaw: service.facingYaw,
      tags: Array.isArray(service.tags) ? service.tags.slice() : []
    }));
}

function buildDeterministicFeatureCandidates(logicalMap) {
  const candidates = [];
  for (let y = 3; y < MAP_SIZE - 3; y++) {
    for (let x = 3; x < MAP_SIZE - 3; x++) {
      if (inTownCore(x, y)) continue;
      if (logicalMap[0][y][x] !== TileId.GRASS) continue;
      candidates.push({ x, y, z: 0 });
    }
  }
  return candidates;
}

function sortedMerchantIds(entries) {
  return entries
    .map((entry) => String(entry.merchantId || "").trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const { materializeSkillWorldRuntime } = loadTsModule(path.join(root, "src", "game", "world", "freeze-runtime.ts"));
  const { world, stamps } = loadWorldContent(root, WORLD_ID);
  const logicalMap = buildWorldLogicalMap(world, stamps);
  const heightMap = createHeightMap(logicalMap.length);
  const staticMerchantRenderPlacements = buildStaticMerchantRenderPlacements(world);

  for (let i = 0; i < staticMerchantRenderPlacements.length; i++) {
    const merchant = staticMerchantRenderPlacements[i];
    logicalMap[merchant.z][merchant.y][merchant.x] = TileId.SOLID_NPC;
  }

  const skillWorldArtifacts = materializeSkillWorldRuntime({
    mapSize: MAP_SIZE,
    logicalMap,
    heightMap,
    tileIds: {
      GRASS: TileId.GRASS,
      TREE: TileId.TREE,
      ROCK: TileId.ROCK,
      OBSTACLE: TileId.OBSTACLE,
      FLOOR_WOOD: TileId.FLOOR_WOOD,
      FLOOR_STONE: TileId.FLOOR_STONE,
      FLOOR_BRICK: TileId.FLOOR_BRICK,
      STAIRS_RAMP: TileId.STAIRS_RAMP,
      DOOR_OPEN: TileId.DOOR_OPEN,
      SHORE: TileId.SHORE,
      SOLID_NPC: TileId.SOLID_NPC
    },
    deterministicFeatureCandidates: buildDeterministicFeatureCandidates(logicalMap),
    staticRouteGroups: {
      fishing: world.skillRoutes.fishing.map(cloneRoute),
      cooking: world.skillRoutes.cooking.map(cloneCookingRoute)
    },
    generalStoreService: world.services.find((service) => service.merchantId === "general_store") || null,
    staticMerchantRenderPlacements,
    authored: {
      castleRouteAnchor: { ...world.terrainPatches.castleRouteAnchor },
      woodcuttingRouteAnchor: { ...world.terrainPatches.woodcuttingRouteAnchor },
      runecraftingAltarOrder: freezeSource.runecraftingAltarOrder.slice(),
      miningZones: freezeSource.miningZones.map((zone) => ({
        ...zone,
        oreWeights: zone.oreWeights.map((row) => ({ ...row })),
        tags: Array.isArray(zone.tags) ? zone.tags.slice() : []
      })),
      runecraftingBands: freezeSource.runecraftingBands.map((band) => ({
        ...band,
        tags: Array.isArray(band.tags) ? band.tags.slice() : []
      })),
      runecraftingMerchants: freezeSource.runecraftingMerchants.map((spawn) => ({
        ...spawn,
        tags: Array.isArray(spawn.tags) ? spawn.tags.slice() : []
      })),
      woodcuttingZones: freezeSource.woodcuttingZones.map((zone) => ({
        ...zone,
        habitatRule: zone.habitatRule ? { ...zone.habitatRule } : null,
        tags: Array.isArray(zone.tags) ? zone.tags.slice() : []
      })),
      showcaseTrees: world.landmarks.showcaseTrees.map((tree) => ({ ...tree }))
    },
    helpers: {
      inTownCore,
      isTreeTileId,
      isWaterTileId,
      isNaturalTileId,
      isWalkableTileId
    },
    writers: {
      setMiningRock: (placement) => {
        logicalMap[placement.z][placement.y][placement.x] = TileId.ROCK;
        return true;
      },
      setTile: (x, y, z, tileId) => {
        logicalMap[z][y][x] = tileId;
      },
      setTree: (placement) => {
        logicalMap[placement.z][placement.y][placement.x] = TileId.TREE;
        return true;
      },
      clearNaturalArea: (centerX, centerY, radius) => {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
          for (let x = centerX - radius; x <= centerX + radius; x++) {
            if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
            const tile = logicalMap[0][y][x];
            if (!isNaturalTileId(tile)) continue;
            logicalMap[0][y][x] = TileId.GRASS;
            heightMap[0][y][x] = Math.max(0, heightMap[0][y][x]);
          }
        }
      }
    }
  });

  const miningIds = skillWorldArtifacts.miningRoutes.map((route) => route.routeId).join(",");
  const miningCounts = skillWorldArtifacts.miningRoutes.map((route) => route.count).join(",");
  assert(
    miningIds === "starter_mine,iron_mine,coal_mine,precious_mine,gem_mine,rune_essence_mine",
    "mining route IDs mismatch"
  );
  assert(miningCounts === "30,24,20,16,14,10", "mining route counts mismatch");

  const altarIds = skillWorldArtifacts.runecraftingRoutes.map((route) => route.routeId).join(",");
  const altarLabels = skillWorldArtifacts.runecraftingRoutes.map((route) => route.label).join(",");
  assert(altarIds === "ember_altar,water_altar,earth_altar,air_altar", "runecrafting route IDs mismatch");
  assert(altarLabels === "Ember Altar,Water Altar,Earth Altar,Air Altar", "runecrafting labels mismatch");
  assert(skillWorldArtifacts.runtimeMerchantServices.length === 2, "expected 2 dynamic runecrafting services");
  assert(
    skillWorldArtifacts.runtimeMerchantServices.map((service) => service.serviceId).join(",") === "merchant:rune_tutor,merchant:combination_sage",
    "runecrafting service IDs mismatch"
  );
  assert(
    skillWorldArtifacts.runtimeMerchantServices.map((service) => service.merchantId).join(",") === "rune_tutor,combination_sage",
    "runecrafting merchant IDs mismatch"
  );

  const woodcuttingIds = skillWorldArtifacts.woodcuttingRoutes.map((route) => route.routeId).join(",");
  const woodcuttingCounts = skillWorldArtifacts.woodcuttingRoutes.map((route) => route.count).join(",");
  assert(
    woodcuttingIds === "starter_grove,oak_path,willow_bend,maple_ridge,yew_frontier",
    "woodcutting route IDs mismatch"
  );
  assert(woodcuttingCounts === "26,20,16,12,8", "woodcutting route counts mismatch");

  const showcase = skillWorldArtifacts.showcasePlacements.map((tree) => `${tree.nodeId}@${tree.x},${tree.y}`).join("|");
  assert(
    showcase === "normal_tree@179,219|oak_tree@192,219|willow_tree@205,219|maple_tree@218,219|yew_tree@231,219",
    "showcase placements mismatch"
  );
  for (let i = 0; i < skillWorldArtifacts.showcasePlacements.length; i++) {
    const tree = skillWorldArtifacts.showcasePlacements[i];
    assert(logicalMap[0][tree.y][tree.x] === TileId.TREE, `showcase tree ${tree.nodeId} missing from logical map`);
  }

  const routeGroups = skillWorldArtifacts.publishedWorldState.routeGroups || {};
  assert((routeGroups.fishing || []).length === 3, "published fishing routes mismatch");
  assert((routeGroups.cooking || []).length === 4, "published cooking routes mismatch");
  assert((routeGroups.mining || []).length === 6, "published mining routes mismatch");
  assert((routeGroups.runecrafting || []).length === 4, "published runecrafting routes mismatch");
  assert((routeGroups.woodcutting || []).length === 5, "published woodcutting routes mismatch");
  assert((skillWorldArtifacts.publishedWorldState.runtimeServices || []).length === 2, "published runtime services mismatch");

  const expectedPublishedMerchantIds = [
    "advanced_fletcher",
    "advanced_woodsman",
    "borin_ironvein",
    "combination_sage",
    "crafting_teacher",
    "elira_gemhand",
    "fishing_supplier",
    "fishing_teacher",
    "fletching_supplier",
    "forester_teacher",
    "general_store",
    "tanner_rusk",
    "rune_tutor",
    "thrain_deepforge"
  ].sort().join(",");
  assert(
    sortedMerchantIds(skillWorldArtifacts.merchantNpcDescriptors) === expectedPublishedMerchantIds,
    "published merchant NPC IDs mismatch"
  );

  console.log(`Skill runtime parity checks passed for ${WORLD_ID}.`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
