import type {
  LegacyNpcRenderPlacement,
  LegacyWorldRuntimeDraft,
  NpcDescriptor,
  RouteDescriptor,
  RuntimeWorldStateInput,
  ServiceDescriptor
} from "../contracts/world";

interface RuntimePublishResult {
  merchantNpcDescriptors: NpcDescriptor[];
  publishedWorldState: RuntimeWorldStateInput;
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
    questHookIds: Array.isArray(service.questHookIds) ? service.questHookIds.slice() : undefined
  };
}

function cloneNpc(npc: NpcDescriptor): NpcDescriptor {
  return {
    ...npc,
    tags: Array.isArray(npc.tags) ? npc.tags.slice() : []
  };
}

function renderPlacementToNpcDescriptor(entry: LegacyNpcRenderPlacement, index: number): NpcDescriptor | null {
  if (!entry || !entry.merchantId) return null;
  return {
    spawnId: "npc:" + String(entry.merchantId || entry.name || index).toLowerCase(),
    name: entry.name || String(entry.merchantId || "merchant"),
    npcType: Number.isFinite(entry.type) ? entry.type : 2,
    x: entry.x,
    y: entry.y,
    z: entry.z,
    merchantId: entry.merchantId,
    appearanceId: typeof entry.appearanceId === "string" ? entry.appearanceId.trim().toLowerCase() || null : null,
    dialogueId: typeof entry.dialogueId === "string" ? entry.dialogueId.trim() || null : null,
    action: entry.action || "Trade",
    facingYaw: entry.facingYaw,
    tags: Array.isArray(entry.tags) ? entry.tags.slice() : [],
    tutorialVisibleFromStep: Number.isFinite(entry.tutorialVisibleFromStep)
      ? Math.max(0, Math.floor(Number(entry.tutorialVisibleFromStep)))
      : null,
    tutorialVisibleUntilStep: Number.isFinite(entry.tutorialVisibleUntilStep)
      ? Math.max(0, Math.floor(Number(entry.tutorialVisibleUntilStep)))
      : null
  };
}

export function createRuntimePublishResult(
  draft: LegacyWorldRuntimeDraft,
  miningRoutes: RouteDescriptor[],
  runecraftingRoutes: RouteDescriptor[],
  woodcuttingRoutes: RouteDescriptor[],
  runtimeMerchantServices: ServiceDescriptor[],
  runtimeMerchantNpcs: NpcDescriptor[]
): RuntimePublishResult {
  const merchantNpcDescriptors: NpcDescriptor[] = [];
  const generalStoreService = draft.generalStoreService;
  if (generalStoreService && generalStoreService.merchantId) {
    const generalStoreZ = typeof generalStoreService.z === "number" ? generalStoreService.z : 0;
    const generalStoreNpcType = typeof generalStoreService.npcType === "number" ? generalStoreService.npcType : 2;
    merchantNpcDescriptors.push({
      spawnId: generalStoreService.spawnId || ("npc:" + generalStoreService.merchantId),
      name: generalStoreService.name || "Shopkeeper",
      npcType: generalStoreNpcType,
      x: generalStoreService.x,
      y: generalStoreService.y,
      z: generalStoreZ,
      merchantId: generalStoreService.merchantId,
      appearanceId: typeof generalStoreService.appearanceId === "string" ? generalStoreService.appearanceId.trim().toLowerCase() || null : null,
      dialogueId: typeof generalStoreService.dialogueId === "string" ? generalStoreService.dialogueId.trim() || null : null,
      action: generalStoreService.action || "Trade",
      tags: Array.isArray(generalStoreService.tags) ? generalStoreService.tags.slice() : []
    });
  }

  for (let i = 0; i < draft.staticMerchantRenderPlacements.length; i++) {
    const descriptor = renderPlacementToNpcDescriptor(draft.staticMerchantRenderPlacements[i], i);
    if (!descriptor) continue;
    merchantNpcDescriptors.push(descriptor);
  }

  for (let i = 0; i < runtimeMerchantNpcs.length; i++) {
    merchantNpcDescriptors.push(cloneNpc(runtimeMerchantNpcs[i]));
  }

  const altarByRouteId: Record<string, { x: number; y: number; z: number }> = {};
  for (let i = 0; i < runecraftingRoutes.length; i++) {
    const route = runecraftingRoutes[i];
    if (!route.routeId) continue;
    altarByRouteId[route.routeId] = { x: route.x, y: route.y, z: route.z };
  }

  return {
    merchantNpcDescriptors,
    publishedWorldState: {
      routeGroups: {
        fishing: draft.staticRouteGroups.fishing.map(cloneRoute),
        cooking: draft.staticRouteGroups.cooking.map(cloneRoute),
        mining: miningRoutes.map(cloneRoute),
        runecrafting: runecraftingRoutes.map(cloneRoute),
        woodcutting: woodcuttingRoutes.map(cloneRoute)
      },
      runtimeServices: runtimeMerchantServices.map(cloneService),
      runtimeNpcs: merchantNpcDescriptors.map(cloneNpc),
      altarByRouteId
    }
  };
}
