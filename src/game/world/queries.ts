import type { RouteDescriptor, RouteRegistry, ServiceDescriptor, ServiceRegistry } from "../contracts/world";

function normalize(value: string): string {
  return String(value || "").trim().toLowerCase();
}

export function getRouteGroup(registry: RouteRegistry, groupId: string): RouteDescriptor[] {
  const group = registry.groups[groupId];
  return Array.isArray(group) ? group.map((route) => ({ ...route, tags: Array.isArray(route.tags) ? route.tags.slice() : [] })) : [];
}

export function findRouteByAlias(registry: RouteRegistry, alias: string, groupId?: string): RouteDescriptor | null {
  const aliasKey = normalize(alias);
  if (!aliasKey) return null;
  if (groupId) {
    const group = registry.groups[groupId] || [];
    for (let i = 0; i < group.length; i++) {
      const route = group[i];
      if (normalize(route.alias || "") === aliasKey) return { ...route, tags: Array.isArray(route.tags) ? route.tags.slice() : [] };
    }
    return null;
  }
  const match = registry.byAlias[aliasKey];
  return match ? { ...match, tags: Array.isArray(match.tags) ? match.tags.slice() : [] } : null;
}

export function getServicesByTag(registry: ServiceRegistry, tag: string): ServiceDescriptor[] {
  const tagKey = normalize(tag);
  const entries = registry.byTag[tagKey] || [];
  return entries.map((service) => ({ ...service, tags: Array.isArray(service.tags) ? service.tags.slice() : [] }));
}

export function findServiceByMerchantId(registry: ServiceRegistry, merchantId: string): ServiceDescriptor | null {
  const key = normalize(merchantId);
  const matches = registry.byMerchantId[key];
  if (!Array.isArray(matches) || matches.length === 0) return null;
  const match = matches[0];
  return { ...match, tags: Array.isArray(match.tags) ? match.tags.slice() : [] };
}

export function getMerchantServices(registry: ServiceRegistry): ServiceDescriptor[] {
  return getServicesByTag(registry, "merchant");
}
