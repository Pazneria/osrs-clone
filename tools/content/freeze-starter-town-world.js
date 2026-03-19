const fs = require("fs");
const path = require("path");

const freezeSource = require("./starter-town-freeze-source.json");
const {
  MAP_SIZE,
  TileId,
  buildWorldLogicalMap,
  loadWorldContent
} = require("./world-utils");
const { loadTsModule } = require("../tests/ts-module-loader");

const WORLD_ID = "starter_town";

function createHeightMap(planes) {
  return Array(planes).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
}

function inTownCore(x, y) {
  const inCastle = x >= 190 && x <= 220 && y >= 190 && y <= 215;
  const inStore = x >= 177 && x <= 185 && y >= 232 && y <= 240;
  const inSmithyApron = x >= 217 && x <= 233 && y >= 224 && y <= 244;
  return inCastle || inStore || inSmithyApron;
}

function isTreeTileId(tileId) {
  return tileId === TileId.TREE || tileId === TileId.STUMP;
}

function isWaterTileId(tileId) {
  return tileId === TileId.WATER_SHALLOW || tileId === TileId.WATER_DEEP;
}

function isNaturalTileId(tileId) {
  return tileId === TileId.GRASS
    || tileId === TileId.TREE
    || tileId === TileId.ROCK
    || tileId === TileId.STUMP
    || tileId === TileId.SHORE
    || tileId === TileId.WATER_SHALLOW
    || tileId === TileId.WATER_DEEP;
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

function cloneFreezeSource(source) {
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

function buildFrozenStarterTownWorld(root) {
  const { materializeSkillWorldRuntime } = loadTsModule(path.join(root, "src", "game", "world", "freeze-runtime.ts"));
  const { world, stamps } = loadWorldContent(root, WORLD_ID);
  const logicalMap = buildWorldLogicalMap(world, stamps);
  const heightMap = createHeightMap(logicalMap.length);
  const staticMerchantRenderPlacements = buildStaticMerchantRenderPlacements(world);
  const freezeConfig = cloneFreezeSource(freezeSource);

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
      isNaturalTileId
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

  const frozenServices = [];
  const dynamicMerchantIds = new Set(freezeConfig.runecraftingMerchants.map((entry) => String(entry.merchantId || "").trim().toLowerCase()).filter(Boolean));
  const sourceServices = Array.isArray(world.services) ? world.services : [];
  const authoredServicesById = new Map();
  const authoredServicesByMerchantId = new Map();
  for (let i = 0; i < sourceServices.length; i++) {
    const service = sourceServices[i];
    if (!service || !service.serviceId) continue;
    authoredServicesById.set(String(service.serviceId).trim().toLowerCase(), service);
    const merchantId = String(service.merchantId || "").trim().toLowerCase();
    if (merchantId) authoredServicesByMerchantId.set(merchantId, service);
  }
  for (let i = 0; i < sourceServices.length; i++) {
    const service = sourceServices[i];
    const merchantId = String(service && service.merchantId || "").trim().toLowerCase();
    if (merchantId && dynamicMerchantIds.has(merchantId)) continue;
    frozenServices.push({
      ...service,
      tags: Array.isArray(service.tags) ? service.tags.slice() : []
    });
  }
  for (let i = 0; i < skillWorldArtifacts.runtimeMerchantServices.length; i++) {
    const service = skillWorldArtifacts.runtimeMerchantServices[i];
    const authoredService = authoredServicesById.get(String(service && service.serviceId || "").trim().toLowerCase())
      || authoredServicesByMerchantId.get(String(service && service.merchantId || "").trim().toLowerCase())
      || null;
    frozenServices.push({
      ...service,
      ...(authoredService ? authoredService : null),
      tags: Array.isArray(authoredService && authoredService.tags)
        ? authoredService.tags.slice()
        : (Array.isArray(service.tags) ? service.tags.slice() : [])
    });
  }

  return {
    worldId: world.worldId,
    version: world.version,
    structures: Array.isArray(world.structures) ? world.structures.map((structure) => ({ ...structure })) : [],
    terrainPatches: {
      ...world.terrainPatches,
      lakes: Array.isArray(world.terrainPatches.lakes) ? world.terrainPatches.lakes.map((lake) => ({ ...lake })) : []
    },
    npcSpawns: Array.isArray(world.npcSpawns) ? world.npcSpawns.map((npc) => ({ ...npc, tags: Array.isArray(npc.tags) ? npc.tags.slice() : [] })) : [],
    services: frozenServices,
    resourceNodes: {
      mining: skillWorldArtifacts.miningRockPlacements.map((placement) => ({ ...placement })),
      woodcutting: skillWorldArtifacts.woodcuttingTreePlacements.map((placement) => ({ ...placement }))
    },
    skillRoutes: {
      fishing: Array.isArray(world.skillRoutes.fishing) ? world.skillRoutes.fishing.map(cloneRoute) : [],
      cooking: Array.isArray(world.skillRoutes.cooking) ? world.skillRoutes.cooking.map(cloneCookingRoute) : [],
      mining: skillWorldArtifacts.miningRoutes.map(cloneRoute),
      runecrafting: skillWorldArtifacts.runecraftingRoutes.map(cloneRoute),
      woodcutting: skillWorldArtifacts.woodcuttingRoutes.map(cloneRoute)
    },
    landmarks: {
      staircases: Array.isArray(world.landmarks.staircases)
        ? world.landmarks.staircases.map((landmark) => ({
            landmarkId: landmark.landmarkId,
            tiles: Array.isArray(landmark.tiles) ? landmark.tiles.map((tile) => ({ ...tile })) : []
          }))
        : [],
      doors: Array.isArray(world.landmarks.doors) ? world.landmarks.doors.map((door) => ({ ...door })) : [],
      altars: skillWorldArtifacts.altarRenderPlacements.map((altar) => ({
        ...altar,
        tags: Array.isArray(altar.tags) ? altar.tags.slice() : []
      })),
      showcaseTrees: Array.isArray(world.landmarks.showcaseTrees) ? world.landmarks.showcaseTrees.map((tree) => ({ ...tree })) : []
    }
  };
}

function runCli() {
  const root = path.resolve(__dirname, "..", "..");
  const nextWorld = buildFrozenStarterTownWorld(root);
  if (process.argv.includes("--write")) {
    const targetPath = path.join(root, "content", "world", "regions", "starter_town.json");
    fs.writeFileSync(targetPath, `${JSON.stringify(nextWorld, null, 2)}\n`, "utf8");
    console.log(`Wrote frozen starter-town world data to ${targetPath}`);
    return;
  }

  console.log(JSON.stringify(nextWorld, null, 2));
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  buildFrozenStarterTownWorld
};
