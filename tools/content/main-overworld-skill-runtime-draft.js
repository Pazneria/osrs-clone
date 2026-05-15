const freezeSource = require("./main-overworld-freeze-source.json");
const { MAP_SIZE } = require("./world-constants");
const {
  loadWorldContent
} = require("./world-content");
const {
  TileId,
  isNaturalTileId,
  isTreeTileId,
  isWalkableTileId,
  isWaterTileId
} = require("./tile-ids");
const {
  inTownCore,
  buildWorldLogicalMap
} = require("./world-map-builder");

const WORLD_ID = "main_overworld";

function createHeightMap(planes) {
  return Array(planes).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
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

function buildStaticMerchantRenderPlacements(world, source = freezeSource) {
  const dynamicMerchantIds = new Set(
    (source.runecraftingMerchants || [])
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

function cloneFreezeSource(source = freezeSource) {
  return {
    runecraftingAltarOrder: Array.isArray(source.runecraftingAltarOrder) ? source.runecraftingAltarOrder.slice() : [],
    miningZones: Array.isArray(source.miningZones)
      ? source.miningZones.map((zone) => ({
          ...zone,
          oreWeights: Array.isArray(zone.oreWeights) ? zone.oreWeights.map((entry) => ({ ...entry })) : [],
          tags: Array.isArray(zone.tags) ? zone.tags.slice() : []
        }))
      : [],
    runecraftingBands: Array.isArray(source.runecraftingBands)
      ? source.runecraftingBands.map((band) => ({
          ...band,
          tags: Array.isArray(band.tags) ? band.tags.slice() : []
        }))
      : [],
    runecraftingMerchants: Array.isArray(source.runecraftingMerchants)
      ? source.runecraftingMerchants.map((merchant) => ({
          ...merchant,
          tags: Array.isArray(merchant.tags) ? merchant.tags.slice() : []
        }))
      : [],
    woodcuttingZones: Array.isArray(source.woodcuttingZones)
      ? source.woodcuttingZones.map((zone) => ({
          ...zone,
          habitatRule: zone.habitatRule ? { ...zone.habitatRule } : null,
          tags: Array.isArray(zone.tags) ? zone.tags.slice() : []
        }))
      : []
  };
}

function buildMainOverworldSkillRuntimeDraft(root) {
  const { world, stamps } = loadWorldContent(root, WORLD_ID);
  const logicalMap = buildWorldLogicalMap(world, stamps);
  const heightMap = createHeightMap(logicalMap.length);
  const freezeConfig = cloneFreezeSource(freezeSource);
  const staticMerchantRenderPlacements = buildStaticMerchantRenderPlacements(world, freezeConfig);

  for (let i = 0; i < staticMerchantRenderPlacements.length; i++) {
    const merchant = staticMerchantRenderPlacements[i];
    logicalMap[merchant.z][merchant.y][merchant.x] = TileId.SOLID_NPC;
  }

  const draft = {
    mapSize: MAP_SIZE,
    logicalMap,
    heightMap,
    tileIds: {
      GRASS: TileId.GRASS,
      TREE: TileId.TREE,
      ROCK: TileId.ROCK,
      SAND: TileId.SAND,
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
      fishing: Array.isArray(world.skillRoutes.fishing) ? world.skillRoutes.fishing.map(cloneRoute) : [],
      cooking: Array.isArray(world.skillRoutes.cooking) ? world.skillRoutes.cooking.map(cloneCookingRoute) : []
    },
    generalStoreService: Array.isArray(world.services)
      ? world.services.find((service) => service.merchantId === "general_store") || null
      : null,
    staticMerchantRenderPlacements,
    authored: {
      castleRouteAnchor: { ...world.terrainPatches.castleRouteAnchor },
      woodcuttingRouteAnchor: { ...world.terrainPatches.woodcuttingRouteAnchor },
      runecraftingAltarOrder: freezeConfig.runecraftingAltarOrder,
      miningZones: freezeConfig.miningZones,
      runecraftingBands: freezeConfig.runecraftingBands,
      runecraftingMerchants: freezeConfig.runecraftingMerchants,
      woodcuttingZones: freezeConfig.woodcuttingZones,
      showcaseTrees: Array.isArray(world.landmarks.showcaseTrees) ? world.landmarks.showcaseTrees.map((tree) => ({ ...tree })) : []
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
  };

  return {
    world,
    stamps,
    logicalMap,
    heightMap,
    freezeConfig,
    staticMerchantRenderPlacements,
    draft
  };
}

module.exports = {
  WORLD_ID,
  buildMainOverworldSkillRuntimeDraft,
  cloneCookingRoute,
  cloneRoute
};
