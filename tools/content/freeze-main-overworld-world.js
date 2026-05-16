const path = require("path");

const {
  WORLD_ID,
  buildMainOverworldSkillRuntimeDraft,
  cloneCookingRoute,
  cloneRoute
} = require("./main-overworld-skill-runtime-draft");
const { cloneJson, writeJsonFile } = require("../lib/json-file-utils");
const { loadTsModule } = require("../lib/ts-module-loader");

function buildFrozenMainOverworld(root) {
  const { materializeSkillWorldRuntime } = loadTsModule(path.join(root, "src", "game", "world", "freeze-runtime.ts"));
  const { world, freezeConfig, draft } = buildMainOverworldSkillRuntimeDraft(root);
  const skillWorldArtifacts = materializeSkillWorldRuntime(draft);
  const terrainPatches = world.terrainPatches || {};
  const landmarks = world.landmarks || {};

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
    areas: Array.isArray(world.areas) ? world.areas.map((area) => ({ ...area })) : [],
    structures: Array.isArray(world.structures) ? world.structures.map((structure) => ({ ...structure })) : [],
    terrainPatches: {
      ...(cloneJson(terrainPatches) || {}),
      lakes: Array.isArray(terrainPatches.lakes) ? terrainPatches.lakes.map((lake) => ({ ...lake })) : []
    },
    waterBodies: Array.isArray(world.waterBodies) ? world.waterBodies.map((body) => cloneJson(body)) : undefined,
    npcSpawns: Array.isArray(world.npcSpawns) ? world.npcSpawns.map((npc) => ({ ...npc, tags: Array.isArray(npc.tags) ? npc.tags.slice() : [] })) : [],
    combatSpawns: Array.isArray(world.combatSpawns) ? world.combatSpawns.map((spawn) => cloneJson(spawn)) : [],
    services: frozenServices,
    resourceNodes: {
      mining: skillWorldArtifacts.miningRockPlacements.map((placement) => ({ ...placement })),
      woodcutting: skillWorldArtifacts.woodcuttingTreePlacements.map((placement) => ({ ...placement }))
    },
    skillRoutes: {
      fishing: Array.isArray(world.skillRoutes.fishing) ? world.skillRoutes.fishing.map(cloneRoute) : [],
      cooking: Array.isArray(world.skillRoutes.cooking) ? world.skillRoutes.cooking.map(cloneCookingRoute) : [],
      firemaking: Array.isArray(world.skillRoutes.firemaking) ? world.skillRoutes.firemaking.map(cloneRoute) : [],
      mining: skillWorldArtifacts.miningRoutes.map(cloneRoute),
      runecrafting: skillWorldArtifacts.runecraftingRoutes.map(cloneRoute),
      woodcutting: skillWorldArtifacts.woodcuttingRoutes.map(cloneRoute)
    },
    landmarks: {
      ...(cloneJson(landmarks) || {}),
      staircases: Array.isArray(landmarks.staircases)
        ? landmarks.staircases.map((landmark) => ({
            landmarkId: landmark.landmarkId,
            tiles: Array.isArray(landmark.tiles) ? landmark.tiles.map((tile) => ({ ...tile })) : []
          }))
        : [],
      doors: Array.isArray(landmarks.doors) ? landmarks.doors.map((door) => ({ ...door })) : [],
      altars: skillWorldArtifacts.altarRenderPlacements.map((altar) => ({
        ...altar,
        tags: Array.isArray(altar.tags) ? altar.tags.slice() : []
      })),
      showcaseTrees: Array.isArray(landmarks.showcaseTrees) ? landmarks.showcaseTrees.map((tree) => ({ ...tree })) : []
    }
  };
}

function runCli() {
  const root = path.resolve(__dirname, "..", "..");
  const nextWorld = buildFrozenMainOverworld(root);
  if (process.argv.includes("--write")) {
    const targetPath = path.join(root, "content", "world", "regions", "main_overworld.json");
    writeJsonFile(targetPath, nextWorld);
    console.log(`Wrote frozen main-overworld world data to ${targetPath}`);
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
  buildFrozenMainOverworld
};
