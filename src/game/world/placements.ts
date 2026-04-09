import type {
  NpcDescriptor,
  NpcRegistry,
  RouteDescriptor,
  RouteRegistry,
  ServiceDescriptor,
  ServiceRegistry,
  WorldDefinition
} from "../contracts/world";
import {
  cloneNpcDescriptor,
  cloneRouteDescriptor,
  cloneServiceDescriptor,
  createMerchantNpcDescriptor
} from "./clone";

function normalizeTag(tag: string): string {
  return String(tag || "").trim().toLowerCase();
}

function normalizeAlias(alias?: string | null): string {
  return String(alias || "").trim().toLowerCase();
}

export function createStaticRouteGroups(definition: WorldDefinition): Record<string, RouteDescriptor[]> {
  return {
    fishing: definition.skillRoutes.fishing.map(cloneRouteDescriptor),
    cooking: definition.skillRoutes.cooking.map(cloneRouteDescriptor),
    firemaking: definition.skillRoutes.firemaking.map(cloneRouteDescriptor),
    mining: definition.skillRoutes.mining.map(cloneRouteDescriptor),
    runecrafting: definition.skillRoutes.runecrafting.map(cloneRouteDescriptor),
    woodcutting: definition.skillRoutes.woodcutting.map(cloneRouteDescriptor)
  };
}

export function mergeRouteGroups(
  baseGroups: Record<string, RouteDescriptor[]>,
  dynamicGroups: Record<string, RouteDescriptor[]>
): Record<string, RouteDescriptor[]> {
  const merged: Record<string, RouteDescriptor[]> = {};
  const groupIds = new Set<string>([
    ...Object.keys(baseGroups || {}),
    ...Object.keys(dynamicGroups || {})
  ]);

  groupIds.forEach((groupId) => {
    const source = dynamicGroups[groupId] || baseGroups[groupId] || [];
    merged[groupId] = source.map(cloneRouteDescriptor);
  });

  return merged;
}

export function createRouteRegistry(groups: Record<string, RouteDescriptor[]>): RouteRegistry {
  const entries: RouteDescriptor[] = [];
  const byId: Record<string, RouteDescriptor> = {};
  const byAlias: Record<string, RouteDescriptor> = {};
  const byTag: Record<string, RouteDescriptor[]> = {};
  const normalizedGroups: Record<string, RouteDescriptor[]> = {};

  Object.keys(groups).forEach((groupId) => {
    normalizedGroups[groupId] = groups[groupId].map(cloneRouteDescriptor);
    for (let i = 0; i < normalizedGroups[groupId].length; i++) {
      const route = normalizedGroups[groupId][i];
      if (!route) continue;
      entries.push(route);
      byId[route.routeId] = route;
      const aliasKey = normalizeAlias(route.alias);
      if (aliasKey) byAlias[aliasKey] = route;
      const tags = Array.isArray(route.tags) ? route.tags : [];
      for (let j = 0; j < tags.length; j++) {
        const tag = normalizeTag(tags[j] || "");
        if (!tag) continue;
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(route);
      }
    }
  });

  return {
    entries,
    groups: normalizedGroups,
    byId,
    byAlias,
    byTag
  };
}

export function createStaticServices(definition: WorldDefinition): ServiceDescriptor[] {
  return definition.services.map(cloneServiceDescriptor);
}

export function createStaticNpcDescriptors(definition: WorldDefinition): NpcDescriptor[] {
  const npcs: NpcDescriptor[] = [];

  for (let i = 0; i < definition.npcSpawns.length; i++) {
    const npc = definition.npcSpawns[i];
    if (!npc || !npc.spawnId) continue;
    npcs.push(cloneNpcDescriptor(npc));
  }

  for (let i = 0; i < definition.services.length; i++) {
    const serviceNpc = createMerchantNpcDescriptor(definition.services[i]);
    if (!serviceNpc) continue;
    npcs.push(serviceNpc);
  }

  return npcs;
}

export function createServiceRegistry(services: ServiceDescriptor[]): ServiceRegistry {
  const byId: Record<string, ServiceDescriptor> = {};
  const bySpawnId: Record<string, ServiceDescriptor> = {};
  const byMerchantId: Record<string, ServiceDescriptor[]> = {};
  const byTag: Record<string, ServiceDescriptor[]> = {};

  for (let i = 0; i < services.length; i++) {
    const service = cloneServiceDescriptor(services[i]);
    if (!service) continue;
    byId[service.serviceId] = service;
    bySpawnId[service.spawnId] = service;

    const merchantId = normalizeAlias(service.merchantId);
    if (merchantId) {
      if (!byMerchantId[merchantId]) byMerchantId[merchantId] = [];
      byMerchantId[merchantId].push(service);
    }

    const tags = Array.isArray(service.tags) ? service.tags : [];
    for (let j = 0; j < tags.length; j++) {
      const tag = normalizeTag(tags[j] || "");
      if (!tag) continue;
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(service);
    }
  }

  return {
    entries: Object.values(byId),
    byId,
    bySpawnId,
    byMerchantId,
    byTag
  };
}

export function createNpcRegistry(npcs: NpcDescriptor[]): NpcRegistry {
  const bySpawnId: Record<string, NpcDescriptor> = {};
  const byMerchantId: Record<string, NpcDescriptor[]> = {};

  for (let i = 0; i < npcs.length; i++) {
    const entry = npcs[i];
    if (!entry) continue;
    const npc = cloneNpcDescriptor(entry);
    if (!npc.spawnId) continue;
    bySpawnId[npc.spawnId] = npc;
    const merchantId = normalizeAlias(npc.merchantId);
    if (merchantId) {
      if (!byMerchantId[merchantId]) byMerchantId[merchantId] = [];
      byMerchantId[merchantId].push(npc);
    }
  }

  return {
    entries: Object.values(bySpawnId),
    bySpawnId,
    byMerchantId
  };
}
