import type {
  NpcDescriptor,
  NpcRegistry,
  RouteDescriptor,
  RouteRegistry,
  ServiceDescriptor,
  ServiceRegistry,
  WorldDefinition
} from "../contracts/world";

function normalizeTag(tag: string): string {
  return String(tag || "").trim().toLowerCase();
}

function normalizeAlias(alias?: string | null): string {
  return String(alias || "").trim().toLowerCase();
}

function cloneRoute(route: RouteDescriptor): RouteDescriptor {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

function cloneService(service: ServiceDescriptor): ServiceDescriptor {
  return {
    ...service,
    tags: Array.isArray(service.tags) ? service.tags.slice() : [],
    travelSpawn: service.travelSpawn
      ? { x: service.travelSpawn.x, y: service.travelSpawn.y, z: service.travelSpawn.z }
      : service.travelSpawn === null
        ? null
        : undefined
  };
}

export function createStaticRouteGroups(definition: WorldDefinition): Record<string, RouteDescriptor[]> {
  return {
    fishing: definition.skillRoutes.fishing.map(cloneRoute),
    cooking: definition.skillRoutes.cooking.map(cloneRoute),
    mining: definition.skillRoutes.mining.map(cloneRoute),
    runecrafting: definition.skillRoutes.runecrafting.map(cloneRoute),
    woodcutting: definition.skillRoutes.woodcutting.map(cloneRoute)
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
    merged[groupId] = source.map(cloneRoute);
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
    normalizedGroups[groupId] = groups[groupId].map(cloneRoute);
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
  return definition.services.map(cloneService);
}

export function createStaticNpcDescriptors(definition: WorldDefinition): NpcDescriptor[] {
  const npcs: NpcDescriptor[] = [];

  for (let i = 0; i < definition.npcSpawns.length; i++) {
    const npc = definition.npcSpawns[i];
    if (!npc || !npc.spawnId) continue;
    npcs.push({
      ...npc,
      tags: Array.isArray(npc.tags) ? npc.tags.slice() : []
    });
  }

  for (let i = 0; i < definition.services.length; i++) {
    const service = definition.services[i];
    if (!service || service.type !== "MERCHANT" || !service.spawnId) continue;
    const npcType = Number.isFinite(service.npcType) ? Number(service.npcType) : 2;
    npcs.push({
      spawnId: service.spawnId,
      name: service.name || String(service.merchantId || service.serviceId || "merchant"),
      npcType,
      x: service.x,
      y: service.y,
      z: service.z,
      merchantId: service.merchantId || null,
      action: service.action,
      travelToWorldId: service.travelToWorldId || null,
      travelSpawn: service.travelSpawn
        ? { x: service.travelSpawn.x, y: service.travelSpawn.y, z: service.travelSpawn.z }
        : service.travelSpawn === null
          ? null
          : undefined,
      facingYaw: service.facingYaw,
      tags: Array.isArray(service.tags) ? service.tags.slice() : []
    });
  }

  return npcs;
}

export function createServiceRegistry(services: ServiceDescriptor[]): ServiceRegistry {
  const byId: Record<string, ServiceDescriptor> = {};
  const bySpawnId: Record<string, ServiceDescriptor> = {};
  const byMerchantId: Record<string, ServiceDescriptor[]> = {};
  const byTag: Record<string, ServiceDescriptor[]> = {};

  for (let i = 0; i < services.length; i++) {
    const service = cloneService(services[i]);
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
    const npc = { ...entry, tags: Array.isArray(entry.tags) ? entry.tags.slice() : [] };
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
