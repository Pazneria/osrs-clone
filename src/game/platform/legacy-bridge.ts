import type {
  GameContext,
  Point3,
  RouteDescriptor,
  RuntimeWorldStateInput,
  ServiceDescriptor,
  WorldManifest,
  WorldManifestEntry,
  WorldBootstrapResult,
  WorldDefinition
} from "../contracts/world";

import {
  applyRuntimeWorldState,
  buildWorldBootstrapResult,
  createGameContext
} from "../world/bootstrap";
import { cloneRouteDescriptor } from "../world/clone";
import {
  getWorldManifest,
  getDefaultSpawn,
  getWorldManifestEntry,
  listWorldIds
} from "../world/authoring";
import { MAIN_OVERWORLD_WORLD_ID, canonicalizeWorldId } from "../world/ids";

declare global {
  interface Window {
    THREE: typeof import("three");
    GameContext?: GameContext;
    WorldBootstrapRuntime?: {
      getWorldManifest: () => WorldManifest;
      listWorldIds: () => string[];
      getCurrentWorldId: () => string;
      activateWorld: (worldId: string) => GameContext;
      getWorldManifestEntry: (worldId?: string) => WorldManifestEntry;
      getDefaultSpawn: (worldId?: string) => Point3;
      getWorldDefinition: (worldId?: string) => WorldDefinition;
      getBootstrapResult: (worldId?: string) => WorldBootstrapResult;
      getGameContext: () => GameContext;
      getWorldLegacyConfig: (worldId?: string) => WorldBootstrapResult["legacy"];
      getRouteGroup: (groupId: string) => RouteDescriptor[];
      getServicesByTag: (tag: string) => ServiceDescriptor[];
      findRouteByAlias: (alias: string, groupId?: string) => RouteDescriptor | null;
      findServiceByMerchantId: (merchantId: string) => ServiceDescriptor | null;
      registerRuntimeWorldState: (state: RuntimeWorldStateInput) => GameContext;
    };
    getWorldGameContext?: () => GameContext;
    getWoodcuttingTrainingLocations?: () => RouteDescriptor[];
    getMiningTrainingLocations?: () => RouteDescriptor[];
    getFishingTrainingLocations?: () => RouteDescriptor[];
    getCookingTrainingLocations?: () => RouteDescriptor[];
    getFiremakingTrainingLocations?: () => RouteDescriptor[];
    getRunecraftingAltarLocations?: () => RouteDescriptor[];
    getRunecraftingAltarNameAt?: (x: number, y: number, z: number) => string | null;
  }
}

const worldBootstrapCache = new Map<string, WorldBootstrapResult>();

function getBaseBootstrap(worldId: string): WorldBootstrapResult {
  const normalizedWorldId = canonicalizeWorldId(worldId);
  const cached = worldBootstrapCache.get(normalizedWorldId);
  if (cached) return cached;
  const result = buildWorldBootstrapResult(normalizedWorldId);
  worldBootstrapCache.set(normalizedWorldId, result);
  return result;
}

function resolveKnownWorldId(worldId?: string | null): string {
  const normalizedWorldId = canonicalizeWorldId(worldId);
  if (!normalizedWorldId) return initialWorldId;
  try {
    return getWorldManifestEntry(normalizedWorldId).worldId;
  } catch (error) {
    return initialWorldId;
  }
}

const configuredWorldIds = listWorldIds();
const initialWorldId = configuredWorldIds[0] || MAIN_OVERWORLD_WORLD_ID;
let activeWorldId = initialWorldId;
let activeBaseBootstrap = getBaseBootstrap(activeWorldId);
let activeBootstrap = activeBaseBootstrap;
let activeContext = createGameContext(activeBootstrap);

function exposeCompatibilityHooks(): void {
  window.GameContext = activeContext;
  window.getWorldGameContext = () => activeContext;
  window.getFishingTrainingLocations = () => activeContext.queries.getRouteGroup("fishing").map(cloneRouteDescriptor);
  window.getCookingTrainingLocations = () => activeContext.queries.getRouteGroup("cooking").map(cloneRouteDescriptor);
  window.getFiremakingTrainingLocations = () => activeContext.queries.getRouteGroup("firemaking").map(cloneRouteDescriptor);
  window.getMiningTrainingLocations = () => activeContext.queries.getRouteGroup("mining").map(cloneRouteDescriptor);
  window.getWoodcuttingTrainingLocations = () => activeContext.queries.getRouteGroup("woodcutting").map(cloneRouteDescriptor);
  window.getRunecraftingAltarLocations = () => activeContext.queries.getRouteGroup("runecrafting").map(cloneRouteDescriptor);
  window.getRunecraftingAltarNameAt = (x: number, y: number, z: number) => {
    const altars = activeContext.queries.getRouteGroup("runecrafting");
    for (let i = 0; i < altars.length; i++) {
      const altar = altars[i];
      if (altar.x === x && altar.y === y && altar.z === z) return altar.label || null;
    }
    return null;
  };
}

function registerRuntimeWorldState(state: RuntimeWorldStateInput): GameContext {
  activeBootstrap = applyRuntimeWorldState(activeBaseBootstrap, state);
  activeContext = createGameContext(activeBootstrap);
  exposeCompatibilityHooks();
  return activeContext;
}

function activateWorld(worldId: string): GameContext {
  const normalizedWorldId = resolveKnownWorldId(worldId);
  activeWorldId = normalizedWorldId;
  activeBaseBootstrap = getBaseBootstrap(activeWorldId);
  activeBootstrap = activeBaseBootstrap;
  activeContext = createGameContext(activeBootstrap);
  exposeCompatibilityHooks();
  return activeContext;
}

export function exposeLegacyBridge(): void {
  exposeCompatibilityHooks();
  window.WorldBootstrapRuntime = {
    getWorldManifest: () => getWorldManifest(),
    listWorldIds: () => listWorldIds(),
    getCurrentWorldId: () => activeWorldId,
    activateWorld,
    getWorldManifestEntry: (worldId?: string) => getWorldManifestEntry(resolveKnownWorldId(worldId || activeWorldId)),
    getDefaultSpawn: (worldId?: string) => getDefaultSpawn(resolveKnownWorldId(worldId || activeWorldId)),
    getWorldDefinition: (worldId?: string) => getBaseBootstrap(resolveKnownWorldId(worldId || activeWorldId)).definition,
    getBootstrapResult: (worldId?: string) => {
      const resolvedWorldId = resolveKnownWorldId(worldId || activeWorldId);
      return resolvedWorldId === activeWorldId ? activeBootstrap : getBaseBootstrap(resolvedWorldId);
    },
    getGameContext: () => activeContext,
    getWorldLegacyConfig: (worldId?: string) => {
      const resolvedWorldId = resolveKnownWorldId(worldId || activeWorldId);
      return resolvedWorldId === activeWorldId ? activeBootstrap.legacy : getBaseBootstrap(resolvedWorldId).legacy;
    },
    getRouteGroup: (groupId: string) => activeContext.queries.getRouteGroup(groupId),
    getServicesByTag: (tag: string) => activeContext.queries.getServicesByTag(tag),
    findRouteByAlias: (alias: string, groupId?: string) => activeContext.queries.findRouteByAlias(alias, groupId),
    findServiceByMerchantId: (merchantId: string) => activeContext.queries.findServiceByMerchantId(merchantId),
    registerRuntimeWorldState
  };
}
