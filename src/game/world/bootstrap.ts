import type {
  GameContext,
  MiningNodePlacement,
  NpcDescriptor,
  RouteDescriptor,
  RunecraftingAltarPlacement,
  RuntimeWorldStateInput,
  ServiceDescriptor,
  SkillRouteWithFireTiles,
  WoodcuttingNodePlacement,
  WorldBootstrapResult,
  WorldDefinition
} from "../contracts/world";

import { getWorldDefinition, getWorldStamps } from "./authoring";
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

function cloneRoute(route: RouteDescriptor): RouteDescriptor {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

function cloneCookingRoute(route: SkillRouteWithFireTiles): SkillRouteWithFireTiles {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : [],
    fireTiles: Array.isArray(route.fireTiles) ? route.fireTiles.map((tile) => ({ ...tile })) : []
  };
}

function cloneService(service: ServiceDescriptor): ServiceDescriptor {
  return {
    ...service,
    tags: Array.isArray(service.tags) ? service.tags.slice() : [],
    questHookIds: Array.isArray(service.questHookIds) ? service.questHookIds.slice() : undefined,
    travelSpawn: service.travelSpawn
      ? { x: service.travelSpawn.x, y: service.travelSpawn.y, z: service.travelSpawn.z }
      : service.travelSpawn === null
        ? null
        : undefined
  };
}

function cloneNpc(npc: NpcDescriptor): NpcDescriptor {
  return {
    ...npc,
    tags: Array.isArray(npc.tags) ? npc.tags.slice() : [],
    travelSpawn: npc.travelSpawn
      ? { x: npc.travelSpawn.x, y: npc.travelSpawn.y, z: npc.travelSpawn.z }
      : npc.travelSpawn === null
        ? null
        : undefined
  };
}

function cloneMiningNodePlacement(placement: MiningNodePlacement): MiningNodePlacement {
  return { ...placement };
}

function cloneAltarPlacement(placement: RunecraftingAltarPlacement): RunecraftingAltarPlacement {
  return {
    ...placement,
    tags: Array.isArray(placement.tags) ? placement.tags.slice() : []
  };
}

function cloneWoodcuttingNodePlacement(placement: WoodcuttingNodePlacement): WoodcuttingNodePlacement {
  return { ...placement };
}

function buildStaticBootstrap(worldId: string, definition: WorldDefinition): WorldBootstrapResult {
  const stamps = getWorldStamps(worldId);
  const stampMap: Record<string, string[]> = {};
  Object.keys(stamps).forEach((stampId) => {
    stampMap[stampId] = stamps[stampId].rows.slice();
  });

  const staticRouteGroups = createStaticRouteGroups(definition);
  const staticServices = createStaticServices(definition);
  const staticNpcs = createStaticNpcDescriptors(definition);
  const renderPayload = createStaticRenderPayload(staticServices);

  return {
    definition,
    stamps,
    routeRegistry: createRouteRegistry(staticRouteGroups),
    serviceRegistry: createServiceRegistry(staticServices),
    npcRegistry: createNpcRegistry(staticNpcs),
    legacy: {
      ...createLegacyTerrainView(definition, stampMap),
      generalStoreService: staticServices.find((service) => service.merchantId === "general_store") || null,
      staticMerchants: staticServices.filter((service) => service.type === "MERCHANT"),
      smithingStations: staticServices.filter((service) => service.type === "FURNACE" || service.type === "ANVIL"),
      fishingRoutes: definition.skillRoutes.fishing.map(cloneRoute),
      cookingRoutes: definition.skillRoutes.cooking.map(cloneCookingRoute),
      miningRoutes: definition.skillRoutes.mining.map(cloneRoute),
      runecraftingRoutes: definition.skillRoutes.runecrafting.map(cloneRoute),
      woodcuttingRoutes: definition.skillRoutes.woodcutting.map(cloneRoute),
      miningNodePlacements: definition.resourceNodes.mining.map(cloneMiningNodePlacement),
      altarPlacements: definition.landmarks.altars.map(cloneAltarPlacement),
      woodcuttingNodePlacements: definition.resourceNodes.woodcutting.map(cloneWoodcuttingNodePlacement)
    },
    renderPayload
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
    ? runtimeState.runtimeServices.map(cloneService)
    : [];
  const staticNpcs = createStaticNpcDescriptors(baseResult.definition);
  const runtimeNpcs = Array.isArray(runtimeState.runtimeNpcs)
    ? runtimeState.runtimeNpcs.map(cloneNpc)
    : [];

  return {
    ...baseResult,
    routeRegistry: createRouteRegistry(mergedRouteGroups),
    serviceRegistry: createServiceRegistry([...staticServices, ...runtimeServices]),
    npcRegistry: createNpcRegistry([...staticNpcs, ...runtimeNpcs])
  };
}
