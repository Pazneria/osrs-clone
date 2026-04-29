const fs = require("fs");
const path = require("path");

const {
  WORLD_ID,
  buildStarterTownSkillRuntimeDraft,
  cloneCookingRoute,
  cloneRoute
} = require("./starter-town-skill-runtime-draft");
const { loadTsModule } = require("../lib/ts-module-loader");

function buildFrozenStarterTownWorld(root) {
  const { materializeSkillWorldRuntime } = loadTsModule(path.join(root, "src", "game", "world", "freeze-runtime.ts"));
  const { world, freezeConfig, draft } = buildStarterTownSkillRuntimeDraft(root);
  const skillWorldArtifacts = materializeSkillWorldRuntime(draft);

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
