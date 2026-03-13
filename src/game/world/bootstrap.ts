import type {
  GameContext,
  RuntimeWorldStateInput,
  WorldBootstrapResult,
  WorldDefinition
} from "../contracts/world";

import { getWorldDefinition, getWorldStamps } from "./authoring";
import {
  cloneMiningNodePlacement,
  cloneNpcDescriptor,
  cloneRouteDescriptor,
  cloneRunecraftingAltarPlacement,
  cloneServiceDescriptor,
  cloneSkillRouteWithFireTiles,
  cloneWaterBodyDefinition,
  cloneWoodcuttingNodePlacement
} from "./clone";
import {
  createNpcRegistry,
  createRouteRegistry,
  createServiceRegistry,
  createStaticNpcDescriptors,
  createStaticRouteGroups,
  createStaticServices,
  mergeRouteGroups
} from "./placements";
import {
  findRouteByAlias,
  findServiceByMerchantId,
  getMerchantServices,
  getRouteGroup,
  getServicesByTag
} from "./queries";
import { createStaticRenderPayload } from "./render";
import { createLegacyTerrainView } from "./terrain";
import { buildWaterRenderPayload, getWorldWaterBodies } from "./water";

function buildStaticBootstrap(worldId: string, definition: WorldDefinition): WorldBootstrapResult {
  const stamps = getWorldStamps(worldId);
  const stampMap: Record<string, string[]> = {};
  Object.keys(stamps).forEach((stampId) => {
    stampMap[stampId] = stamps[stampId].rows.slice();
  });

  const staticRouteGroups = createStaticRouteGroups(definition);
  const staticServices = createStaticServices(definition);
  const staticNpcs = createStaticNpcDescriptors(definition);
  const staticRenderPayload = createStaticRenderPayload(staticServices);
  const waterBodies = getWorldWaterBodies(definition);
  const waterRenderPayload = buildWaterRenderPayload(definition);

  return {
    definition,
    stamps,
    routeRegistry: createRouteRegistry(staticRouteGroups),
    serviceRegistry: createServiceRegistry(staticServices),
    npcRegistry: createNpcRegistry(staticNpcs),
    legacy: {
      ...createLegacyTerrainView(definition, stampMap),
      waterBodies: waterBodies.map(cloneWaterBodyDefinition),
      generalStoreService: staticServices.find((service) => service.merchantId === "general_store") || null,
      staticMerchants: staticServices.filter((service) => service.type === "MERCHANT"),
      smithingStations: staticServices.filter((service) => service.type === "FURNACE" || service.type === "ANVIL"),
      fishingRoutes: definition.skillRoutes.fishing.map(cloneRouteDescriptor),
      cookingRoutes: definition.skillRoutes.cooking.map(cloneSkillRouteWithFireTiles),
      miningRoutes: definition.skillRoutes.mining.map(cloneRouteDescriptor),
      runecraftingRoutes: definition.skillRoutes.runecrafting.map(cloneRouteDescriptor),
      woodcuttingRoutes: definition.skillRoutes.woodcutting.map(cloneRouteDescriptor),
      miningNodePlacements: definition.resourceNodes.mining.map(cloneMiningNodePlacement),
      altarPlacements: definition.landmarks.altars.map(cloneRunecraftingAltarPlacement),
      woodcuttingNodePlacements: definition.resourceNodes.woodcutting.map(cloneWoodcuttingNodePlacement)
    },
    renderPayload: {
      ...staticRenderPayload,
      water: waterRenderPayload
    }
  };
}

export function createGameContext(result: WorldBootstrapResult): GameContext {
  return {
    worldId: result.definition.worldId,
    version: result.definition.version,
    definition: result.definition,
    routeRegistry: result.routeRegistry,
    serviceRegistry: result.serviceRegistry,
    npcRegistry: result.npcRegistry,
    queries: {
      getRouteGroup: (groupId: string) => getRouteGroup(result.routeRegistry, groupId),
      findRouteByAlias: (alias: string, groupId?: string) => findRouteByAlias(result.routeRegistry, alias, groupId),
      getServicesByTag: (tag: string) => getServicesByTag(result.serviceRegistry, tag),
      findServiceByMerchantId: (merchantId: string) => findServiceByMerchantId(result.serviceRegistry, merchantId),
      getMerchantServices: () => getMerchantServices(result.serviceRegistry)
    }
  };
}

export function buildWorldBootstrapResult(worldId: string): WorldBootstrapResult {
  return buildStaticBootstrap(worldId, getWorldDefinition(worldId));
}

export function applyRuntimeWorldState(
  baseResult: WorldBootstrapResult,
  runtimeState: RuntimeWorldStateInput
): WorldBootstrapResult {
  const mergedRouteGroups = mergeRouteGroups(
    baseResult.routeRegistry.groups,
    runtimeState.routeGroups || {}
  );
  const staticServices = createStaticServices(baseResult.definition);
  const runtimeServices = Array.isArray(runtimeState.runtimeServices)
    ? runtimeState.runtimeServices.map(cloneServiceDescriptor)
    : [];
  const staticNpcs = createStaticNpcDescriptors(baseResult.definition);
  const runtimeNpcs = Array.isArray(runtimeState.runtimeNpcs)
    ? runtimeState.runtimeNpcs.map(cloneNpcDescriptor)
    : [];

  return {
    ...baseResult,
    routeRegistry: createRouteRegistry(mergedRouteGroups),
    serviceRegistry: createServiceRegistry([...staticServices, ...runtimeServices]),
    npcRegistry: createNpcRegistry([...staticNpcs, ...runtimeNpcs])
  };
}
