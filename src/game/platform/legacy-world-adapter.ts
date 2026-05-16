import type {
  GameContext,
  LegacyNpcRenderPlacement,
  Point3,
  RouteDescriptor,
  ServiceDescriptor,
  SkillRouteWithFireTiles,
  WorldBootstrapResult,
  WorldManifestEntry
} from "../contracts/world";
import { buildWorldBootstrapResult } from "../world/bootstrap";
import {
  getWorldManifest,
  getWorldManifestEntry
} from "../world/authoring";
import { MAIN_OVERWORLD_WORLD_ID, canonicalizeWorldId } from "../world/ids";
import {
  cloneCaveOpeningLandmark,
  cloneCombatSpawnNode,
  cloneDecorPropLandmark,
  cloneDoorLandmark,
  cloneFenceLandmark,
  cloneIslandWaterPatch,
  cloneMiningNodePlacement,
  clonePoint3,
  cloneRouteDescriptor,
  cloneRoofLandmark,
  cloneRunecraftingAltarPlacement,
  cloneServiceDescriptor,
  cloneShowcaseTree,
  cloneSkillRouteWithFireTiles,
  cloneStaircaseLandmark,
  cloneStructurePlacement,
  cloneTerrainBox2D,
  cloneTerrainEllipse,
  cloneTerrainLandformPatch,
  cloneTerrainPathPatch,
  cloneTerrainPier,
  cloneTravelSpawn,
  cloneWaterBodyDefinition,
  cloneWaterRenderPayload,
  cloneWoodcuttingNodePlacement,
  cloneWorldManifestEntry
} from "../world/clone";

interface LegacyWorldBounds {
  mapSize?: number;
  planes?: number;
}

interface LegacyMerchantNpcRenderPlacement extends LegacyNpcRenderPlacement {
  travelToWorldId?: string | null;
  travelSpawn?: Point3 | null;
}

interface QaWorldSummary {
  worldId: string;
  label: string;
  defaultSpawn: Point3;
  isActive: boolean;
}

interface TravelResolutionOptions extends LegacyWorldBounds {
  spawn?: unknown;
  label?: unknown;
  fallbackWorldId?: string | null;
  activate?: boolean;
}

interface TravelResolutionResult {
  ok: boolean;
  requestedWorldId: string;
  worldId: string | null;
  spawn: Point3 | null;
  label: string | null;
}

interface LegacyWorldPayload {
  worldId: string;
  label: string;
  lakeDefs: WorldBootstrapResult["legacy"]["lakeDefs"];
  islandWater: WorldBootstrapResult["legacy"]["islandWater"];
  castleFrontPond: WorldBootstrapResult["legacy"]["castleFrontPond"];
  deepWaterCenter: WorldBootstrapResult["legacy"]["deepWaterCenter"];
  pierConfig: WorldBootstrapResult["legacy"]["pier"];
  pathPatches: WorldBootstrapResult["legacy"]["pathPatches"];
  landformPatches: WorldBootstrapResult["legacy"]["landformPatches"];
  smithingHallApproach: WorldBootstrapResult["legacy"]["smithingHallApproach"];
  waterBodies: WorldBootstrapResult["legacy"]["waterBodies"];
  stampedStructures: WorldBootstrapResult["legacy"]["stampedStructures"];
  stampMap: WorldBootstrapResult["legacy"]["stampMap"];
  smithingStations: ServiceDescriptor[];
  combatSpawnNodes: WorldBootstrapResult["legacy"]["combatSpawnNodes"];
  fishingTrainingRouteDefs: RouteDescriptor[];
  cookingRouteSpecs: SkillRouteWithFireTiles[];
  firemakingTrainingRouteDefs: RouteDescriptor[];
  miningTrainingRouteDefs: RouteDescriptor[];
  runecraftingRouteDefs: RouteDescriptor[];
  woodcuttingTrainingRouteDefs: RouteDescriptor[];
  miningNodePlacements: WorldBootstrapResult["legacy"]["miningNodePlacements"];
  authoredAltarPlacements: WorldBootstrapResult["legacy"]["altarPlacements"];
  woodcuttingNodePlacements: WorldBootstrapResult["legacy"]["woodcuttingNodePlacements"];
  staircaseLandmarks: WorldBootstrapResult["legacy"]["staircases"];
  doorLandmarks: WorldBootstrapResult["legacy"]["doors"];
  fenceLandmarks: WorldBootstrapResult["legacy"]["fences"];
  roofLandmarks: WorldBootstrapResult["legacy"]["roofs"];
  caveOpeningLandmarks: WorldBootstrapResult["legacy"]["caveOpenings"];
  decorPropLandmarks: WorldBootstrapResult["legacy"]["decorProps"];
  showcaseTreeDefs: WorldBootstrapResult["legacy"]["showcaseTrees"];
  fishingMerchantSpots: LegacyNpcRenderPlacement[];
  staticMerchantSpots: LegacyMerchantNpcRenderPlacement[];
  furnacesToRender: WorldBootstrapResult["renderPayload"]["furnacesToRender"];
  anvilsToRender: WorldBootstrapResult["renderPayload"]["anvilsToRender"];
  waterRenderPayload: WorldBootstrapResult["renderPayload"]["water"];
}

declare global {
  interface Window {
    LegacyWorldAdapterRuntime?: {
      getKnownWorldEntries: () => WorldManifestEntry[];
      getWorldManifestEntry: (worldId?: string | null) => WorldManifestEntry | null;
      isKnownWorldId: (worldId?: string | null) => boolean;
      resolveKnownWorldId: (worldId?: string | null, fallbackWorldId?: string | null) => string;
      getWorldLabel: (worldId?: string | null) => string;
      getWorldDefaultSpawn: (worldId?: string | null, bounds?: LegacyWorldBounds) => Point3;
      sanitizeWorldSpawn: (spawnLike: unknown, worldId?: string | null, bounds?: LegacyWorldBounds) => Point3;
      activateWorldContext: (worldId?: string | null, fallbackWorldId?: string | null) => string;
      resolveTravelTarget: (worldId: unknown, options?: TravelResolutionOptions) => TravelResolutionResult;
      getQaWorldSummaries: () => QaWorldSummary[];
      matchQaWorld: (query: unknown) => QaWorldSummary | null;
      getWorldPayload: (worldId?: string | null) => LegacyWorldPayload;
      getCurrentWorldPayload: () => LegacyWorldPayload;
      getWorldGameContext: () => GameContext | null;
    };
  }
}

function normalizeWorldId(worldId?: string | null): string {
  return String(worldId || "").trim();
}

function normalizeCanonicalWorldId(worldId?: string | null): string {
  return canonicalizeWorldId(normalizeWorldId(worldId));
}

function normalizeLabel(label: unknown): string {
  return typeof label === "string" ? label.trim() : "";
}

function resolveNpcAppearanceId(service: ServiceDescriptor): string | null {
  const explicitAppearanceId = typeof service.appearanceId === "string" ? service.appearanceId.trim().toLowerCase() : "";
  if (explicitAppearanceId) return explicitAppearanceId;
  const merchantId = typeof service.merchantId === "string" ? service.merchantId.trim().toLowerCase() : "";
  const name = typeof service.name === "string" ? service.name.trim().toLowerCase() : "";
  if (merchantId === "tanner_rusk" || name === "tanner rusk") return "tanner_rusk";
  return null;
}

function clampAxis(value: number, size: number | undefined): number {
  const max = Number.isFinite(size) ? Math.max(1, Math.floor(Number(size))) - 1 : null;
  const normalized = Math.floor(value);
  if (max === null) return normalized;
  return Math.max(0, Math.min(max, normalized));
}

function clampSpawn(spawn: Point3, bounds?: LegacyWorldBounds): Point3 {
  return {
    x: clampAxis(spawn.x, bounds?.mapSize),
    y: clampAxis(spawn.y, bounds?.mapSize),
    z: clampAxis(spawn.z, bounds?.planes)
  };
}

function getSafeWorldManifestEntry(worldId?: string | null): WorldManifestEntry | null {
  try {
    return cloneWorldManifestEntry(getWorldManifestEntry(normalizeCanonicalWorldId(worldId)));
  } catch (error) {
    return null;
  }
}

function getKnownWorldEntries(): WorldManifestEntry[] {
  const manifest = getWorldManifest();
  return Array.isArray(manifest.worlds) ? manifest.worlds.map(cloneWorldManifestEntry) : [];
}

function isKnownWorldId(worldId?: string | null): boolean {
  return !!getSafeWorldManifestEntry(worldId);
}

function getCurrentWorldId(): string {
  const activeSessionWorldId = normalizeWorldId(window.GameSessionRuntime?.getSession?.()?.currentWorldId);
  if (activeSessionWorldId && isKnownWorldId(activeSessionWorldId)) return activeSessionWorldId;

  const bridgeWorldId = normalizeWorldId(window.WorldBootstrapRuntime?.getCurrentWorldId?.());
  if (bridgeWorldId && isKnownWorldId(bridgeWorldId)) return bridgeWorldId;

  return "";
}

function resolveKnownWorldId(worldId?: string | null, fallbackWorldId: string | null = null): string {
  const requestedWorldId = normalizeCanonicalWorldId(worldId);
  if (requestedWorldId && isKnownWorldId(requestedWorldId)) return requestedWorldId;

  const fallbackKey = normalizeCanonicalWorldId(fallbackWorldId);
  if (fallbackKey && isKnownWorldId(fallbackKey)) return fallbackKey;

  const currentWorldId = normalizeCanonicalWorldId(getCurrentWorldId());
  if (currentWorldId && isKnownWorldId(currentWorldId)) return currentWorldId;

  const worlds = getKnownWorldEntries();
  if (worlds.length > 0 && worlds[0] && worlds[0].worldId) return worlds[0].worldId;

  return MAIN_OVERWORLD_WORLD_ID;
}

function getWorldLabel(worldId?: string | null): string {
  const entry = getSafeWorldManifestEntry(worldId);
  if (entry && entry.label) return entry.label;
  const normalizedWorldId = normalizeWorldId(worldId);
  return normalizedWorldId || "Unknown World";
}

function getWorldDefaultSpawn(worldId?: string | null, bounds?: LegacyWorldBounds): Point3 {
  const resolvedWorldId = resolveKnownWorldId(worldId);
  const entry = getSafeWorldManifestEntry(resolvedWorldId);
  const defaultSpawn = entry ? entry.defaultSpawn : { x: 205, y: 210, z: 0 };
  return clampSpawn(clonePoint3(defaultSpawn), bounds);
}

function sanitizeWorldSpawn(spawnLike: unknown, worldId?: string | null, bounds?: LegacyWorldBounds): Point3 {
  if (
    !spawnLike
    || typeof spawnLike !== "object"
    || !Number.isFinite((spawnLike as Point3).x)
    || !Number.isFinite((spawnLike as Point3).y)
    || !Number.isFinite((spawnLike as Point3).z)
  ) {
    return getWorldDefaultSpawn(worldId, bounds);
  }

  return clampSpawn({
    x: Number((spawnLike as Point3).x),
    y: Number((spawnLike as Point3).y),
    z: Number((spawnLike as Point3).z)
  }, bounds);
}

function syncActiveSessionWorldId(worldId: string): void {
  const activeSession = window.GameSessionRuntime?.getSession?.();
  if (!activeSession) return;
  activeSession.currentWorldId = worldId;
  if (activeSession.runtime && typeof activeSession.runtime === "object") {
    activeSession.runtime.currentWorldId = worldId;
  }
}

function activateWorldContext(worldId?: string | null, fallbackWorldId: string | null = null): string {
  const resolvedWorldId = resolveKnownWorldId(worldId, fallbackWorldId);
  if (window.WorldBootstrapRuntime?.activateWorld) {
    window.WorldBootstrapRuntime.activateWorld(resolvedWorldId);
  }
  syncActiveSessionWorldId(resolvedWorldId);
  return resolvedWorldId;
}

function resolveTravelTarget(worldId: unknown, options: TravelResolutionOptions = {}): TravelResolutionResult {
  const requestedWorldId = normalizeWorldId(typeof worldId === "string" ? worldId : "");
  const canonicalRequestedWorldId = normalizeCanonicalWorldId(requestedWorldId);
  if (!requestedWorldId || !isKnownWorldId(canonicalRequestedWorldId)) {
    return {
      ok: false,
      requestedWorldId,
      worldId: null,
      spawn: null,
      label: null
    };
  }

  const resolvedWorldId = options.activate === false
    ? resolveKnownWorldId(canonicalRequestedWorldId, options.fallbackWorldId || null)
    : activateWorldContext(canonicalRequestedWorldId, options.fallbackWorldId || null);

  return {
    ok: true,
    requestedWorldId,
    worldId: resolvedWorldId,
    spawn: sanitizeWorldSpawn(options.spawn, resolvedWorldId, options),
    label: normalizeLabel(options.label) || getWorldLabel(resolvedWorldId)
  };
}

function createQaWorldSummary(entry: WorldManifestEntry, activeWorldId: string): QaWorldSummary {
  return {
    worldId: entry.worldId,
    label: entry.label,
    defaultSpawn: clonePoint3(entry.defaultSpawn),
    isActive: entry.worldId === activeWorldId
  };
}

function getQaWorldSummaries(): QaWorldSummary[] {
  const activeWorldId = resolveKnownWorldId(getCurrentWorldId(), MAIN_OVERWORLD_WORLD_ID);
  return getKnownWorldEntries().map((entry) => createQaWorldSummary(entry, activeWorldId));
}

function matchQaWorld(query: unknown): QaWorldSummary | null {
  const needle = normalizeLabel(query).toLowerCase();
  if (!needle) return null;
  const canonicalNeedle = normalizeCanonicalWorldId(needle).toLowerCase();

  const summaries = getQaWorldSummaries();
  for (let i = 0; i < summaries.length; i++) {
    const entry = summaries[i];
    if (!entry) continue;
    const worldKey = String(entry.worldId || "").toLowerCase();
    const labelKey = String(entry.label || "").toLowerCase();
    if (worldKey === needle || worldKey === canonicalNeedle || labelKey === needle) return entry;
  }

  for (let i = 0; i < summaries.length; i++) {
    const entry = summaries[i];
    if (!entry) continue;
    const worldKey = String(entry.worldId || "").toLowerCase();
    const labelKey = String(entry.label || "").toLowerCase();
    if (worldKey.includes(needle) || worldKey.includes(canonicalNeedle) || labelKey.includes(needle)) return entry;
  }

  return null;
}

function getBootstrapResult(worldId?: string | null): WorldBootstrapResult {
  const resolvedWorldId = resolveKnownWorldId(worldId);
  if (window.WorldBootstrapRuntime?.getBootstrapResult) {
    return window.WorldBootstrapRuntime.getBootstrapResult(resolvedWorldId);
  }
  return buildWorldBootstrapResult(resolvedWorldId);
}

function toMerchantRenderPlacement(
  service: ServiceDescriptor,
  options: { includeTravel: boolean }
): LegacyMerchantNpcRenderPlacement | null {
  if (!service || service.type !== "MERCHANT") return null;
  return {
    spawnId: service.spawnId || null,
    type: Number.isFinite(service.npcType) ? Number(service.npcType) : 2,
    x: service.x,
    y: service.y,
    z: Number.isFinite(service.z) ? Number(service.z) : 0,
    name: service.name,
    merchantId: service.merchantId || null,
    appearanceId: resolveNpcAppearanceId(service),
    dialogueId: typeof service.dialogueId === "string" ? service.dialogueId.trim() || null : null,
    action: normalizeLabel(service.action) || "Trade",
    facingYaw: service.facingYaw,
    roamingRadiusOverride: Number.isFinite(service.roamingRadiusOverride)
      ? Math.max(0, Math.floor(Number(service.roamingRadiusOverride)))
      : null,
    tags: Array.isArray(service.tags) ? service.tags.slice() : [],
    tutorialVisibleFromStep: Number.isFinite(service.tutorialVisibleFromStep)
      ? Math.max(0, Math.floor(Number(service.tutorialVisibleFromStep)))
      : null,
    tutorialVisibleUntilStep: Number.isFinite(service.tutorialVisibleUntilStep)
      ? Math.max(0, Math.floor(Number(service.tutorialVisibleUntilStep)))
      : null,
    travelToWorldId: options.includeTravel
      ? (normalizeWorldId(service.travelToWorldId) || null)
      : undefined,
    travelSpawn: options.includeTravel
      ? (cloneTravelSpawn(service.travelSpawn) ?? null)
      : undefined
  };
}

function getWorldPayload(worldId?: string | null): LegacyWorldPayload {
  const resolvedWorldId = resolveKnownWorldId(worldId);
  const manifestEntry = getSafeWorldManifestEntry(resolvedWorldId);
  const bootstrap = getBootstrapResult(resolvedWorldId);
  const legacy = bootstrap.legacy;
  const staticMerchantServices = legacy.staticMerchants.map(cloneServiceDescriptor);

  return {
    worldId: resolvedWorldId,
    label: manifestEntry ? manifestEntry.label : resolvedWorldId,
    lakeDefs: legacy.lakeDefs.map(cloneTerrainEllipse),
    islandWater: legacy.islandWater ? cloneIslandWaterPatch(legacy.islandWater) : undefined,
    castleFrontPond: cloneTerrainEllipse(legacy.castleFrontPond),
    deepWaterCenter: cloneTerrainBox2D(legacy.deepWaterCenter),
    pierConfig: cloneTerrainPier(legacy.pier),
    pathPatches: legacy.pathPatches.map(cloneTerrainPathPatch),
    landformPatches: legacy.landformPatches.map(cloneTerrainLandformPatch),
    smithingHallApproach: { ...legacy.smithingHallApproach },
    waterBodies: legacy.waterBodies.map(cloneWaterBodyDefinition),
    stampedStructures: legacy.stampedStructures.map(cloneStructurePlacement),
    stampMap: Object.fromEntries(
      Object.entries(legacy.stampMap || {}).map(([stampId, rows]) => [stampId, Array.isArray(rows) ? rows.slice() : []])
    ),
    smithingStations: legacy.smithingStations.map(cloneServiceDescriptor),
    combatSpawnNodes: legacy.combatSpawnNodes.map(cloneCombatSpawnNode),
    fishingTrainingRouteDefs: legacy.fishingRoutes.map(cloneRouteDescriptor),
    cookingRouteSpecs: legacy.cookingRoutes.map(cloneSkillRouteWithFireTiles),
    firemakingTrainingRouteDefs: legacy.firemakingRoutes.map(cloneRouteDescriptor),
    miningTrainingRouteDefs: legacy.miningRoutes.map(cloneRouteDescriptor),
    runecraftingRouteDefs: legacy.runecraftingRoutes.map(cloneRouteDescriptor),
    woodcuttingTrainingRouteDefs: legacy.woodcuttingRoutes.map(cloneRouteDescriptor),
    miningNodePlacements: legacy.miningNodePlacements.map(cloneMiningNodePlacement),
    authoredAltarPlacements: legacy.altarPlacements.map(cloneRunecraftingAltarPlacement),
    woodcuttingNodePlacements: legacy.woodcuttingNodePlacements.map(cloneWoodcuttingNodePlacement),
    staircaseLandmarks: legacy.staircases.map(cloneStaircaseLandmark),
    doorLandmarks: legacy.doors.map(cloneDoorLandmark),
    fenceLandmarks: legacy.fences.map(cloneFenceLandmark),
    roofLandmarks: legacy.roofs.map(cloneRoofLandmark),
    caveOpeningLandmarks: legacy.caveOpenings.map(cloneCaveOpeningLandmark),
    decorPropLandmarks: legacy.decorProps.map(cloneDecorPropLandmark),
    showcaseTreeDefs: legacy.showcaseTrees.map(cloneShowcaseTree),
    fishingMerchantSpots: staticMerchantServices
      .filter((service) => Array.isArray(service.tags) && service.tags.includes("fishing") && !service.tags.includes("tutorial"))
      .map((service) => toMerchantRenderPlacement(service, { includeTravel: false }))
      .filter((entry): entry is LegacyNpcRenderPlacement => !!entry),
    staticMerchantSpots: staticMerchantServices
      .filter((service) => {
        const merchantId = normalizeWorldId(service.merchantId);
        return service.type === "MERCHANT"
          && merchantId !== "fishing_teacher"
          && merchantId !== "fishing_supplier"
          && merchantId !== "general_store";
      })
      .map((service) => toMerchantRenderPlacement(service, { includeTravel: true }))
      .filter((entry): entry is LegacyMerchantNpcRenderPlacement => !!entry),
    furnacesToRender: bootstrap.renderPayload.furnacesToRender.map((station) => ({ ...station })),
    anvilsToRender: bootstrap.renderPayload.anvilsToRender.map((station) => ({ ...station })),
    waterRenderPayload: cloneWaterRenderPayload(bootstrap.renderPayload.water)
  };
}

function getCurrentWorldPayload(): LegacyWorldPayload {
  return getWorldPayload(resolveKnownWorldId(window.WorldBootstrapRuntime?.getCurrentWorldId?.(), MAIN_OVERWORLD_WORLD_ID));
}

function getWorldGameContext(): GameContext | null {
  if (window.WorldBootstrapRuntime?.getGameContext) return window.WorldBootstrapRuntime.getGameContext();
  return window.GameContext || null;
}

export function exposeLegacyWorldAdapter(): void {
  window.LegacyWorldAdapterRuntime = {
    getKnownWorldEntries,
    getWorldManifestEntry: getSafeWorldManifestEntry,
    isKnownWorldId,
    resolveKnownWorldId,
    getWorldLabel,
    getWorldDefaultSpawn,
    sanitizeWorldSpawn,
    activateWorldContext,
    resolveTravelTarget,
    getQaWorldSummaries,
    matchQaWorld,
    getWorldPayload,
    getCurrentWorldPayload,
    getWorldGameContext
  };
}
