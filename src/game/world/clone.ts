import type { EnemySpawnNodeDefinition } from "../contracts/combat";
import type {
  CaveOpeningLandmark,
  DecorPropLandmark,
  DoorLandmark,
  FenceLandmark,
  IslandWaterPatch,
  MiningNodePlacement,
  NpcDescriptor,
  Point2,
  Point3,
  RouteDescriptor,
  RoofLandmark,
  RunecraftingAltarPlacement,
  ServiceDescriptor,
  ShowcaseTree,
  SkillRouteWithFireTiles,
  StaircaseLandmark,
  StructurePlacement,
  TerrainBox2D,
  TerrainEllipse,
  TerrainPathPatch,
  TerrainPier,
  WaterBodyDefinition,
  WaterBodyShape,
  WaterDepthProfile,
  WaterDepthZone,
  WaterRenderBody,
  WaterRenderPayload,
  WaterShoreline,
  WaterStyleTokens,
  WorldManifestEntry,
  WoodcuttingNodePlacement
} from "../contracts/world";

export function clonePoint2(point: Point2): Point2 {
  return { x: point.x, y: point.y };
}

export function clonePoint3(point: Point3): Point3 {
  return { x: point.x, y: point.y, z: point.z };
}

export function cloneWorldManifestEntry(entry: WorldManifestEntry): WorldManifestEntry {
  return {
    worldId: entry.worldId,
    label: entry.label,
    regionFile: entry.regionFile,
    stampIds: Array.isArray(entry.stampIds) ? entry.stampIds.slice() : [],
    defaultSpawn: clonePoint3(entry.defaultSpawn)
  };
}

export function cloneRouteDescriptor(route: RouteDescriptor): RouteDescriptor {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

export function cloneSkillRouteWithFireTiles(route: SkillRouteWithFireTiles): SkillRouteWithFireTiles {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : [],
    fireTiles: Array.isArray(route.fireTiles) ? route.fireTiles.map(clonePoint2) : []
  };
}

export function cloneTravelSpawn(spawn?: Point3 | null): Point3 | null | undefined {
  if (spawn === null) return null;
  if (!spawn) return undefined;
  return clonePoint3(spawn);
}

export function cloneServiceDescriptor(service: ServiceDescriptor): ServiceDescriptor {
  return {
    ...service,
    tags: Array.isArray(service.tags) ? service.tags.slice() : [],
    questHookIds: Array.isArray(service.questHookIds) ? service.questHookIds.slice() : undefined,
    travelSpawn: cloneTravelSpawn(service.travelSpawn)
  };
}

export function cloneNpcDescriptor(npc: NpcDescriptor): NpcDescriptor {
  return {
    ...npc,
    tags: Array.isArray(npc.tags) ? npc.tags.slice() : [],
    travelSpawn: cloneTravelSpawn(npc.travelSpawn)
  };
}

function resolveServiceAppearanceId(service: ServiceDescriptor): string | null {
  const explicitAppearanceId = typeof service.appearanceId === "string" ? service.appearanceId.trim().toLowerCase() : "";
  if (explicitAppearanceId) return explicitAppearanceId;
  const merchantId = typeof service.merchantId === "string" ? service.merchantId.trim().toLowerCase() : "";
  const name = typeof service.name === "string" ? service.name.trim().toLowerCase() : "";
  if (merchantId === "tanner_rusk" || name === "tanner rusk") return "tanner_rusk";
  return null;
}

export function createMerchantNpcDescriptor(service: ServiceDescriptor): NpcDescriptor | null {
  if (!service || service.type !== "MERCHANT" || !service.spawnId) return null;
  return {
    spawnId: service.spawnId,
    name: service.name || String(service.merchantId || service.serviceId || "merchant"),
    npcType: Number.isFinite(service.npcType) ? Number(service.npcType) : 2,
    x: service.x,
    y: service.y,
    z: service.z,
    merchantId: service.merchantId || null,
    appearanceId: resolveServiceAppearanceId(service),
    dialogueId: typeof service.dialogueId === "string" ? service.dialogueId.trim() || null : null,
    action: service.action,
    travelToWorldId: service.travelToWorldId || null,
    travelSpawn: cloneTravelSpawn(service.travelSpawn),
    facingYaw: service.facingYaw,
    roamingRadiusOverride: Number.isFinite(service.roamingRadiusOverride)
      ? Math.max(0, Math.floor(Number(service.roamingRadiusOverride)))
      : null,
    tags: Array.isArray(service.tags) ? service.tags.slice() : []
  };
}

export function cloneCombatSpawnNode(spawnNode: EnemySpawnNodeDefinition): EnemySpawnNodeDefinition {
  return {
    ...spawnNode,
    spawnTile: clonePoint3(spawnNode.spawnTile),
    homeTileOverride: spawnNode.homeTileOverride ? clonePoint3(spawnNode.homeTileOverride) : null
  };
}

export function cloneMiningNodePlacement(placement: MiningNodePlacement): MiningNodePlacement {
  return { ...placement };
}

export function cloneRunecraftingAltarPlacement(placement: RunecraftingAltarPlacement): RunecraftingAltarPlacement {
  return {
    ...placement,
    tags: Array.isArray(placement.tags) ? placement.tags.slice() : []
  };
}

export function cloneWoodcuttingNodePlacement(placement: WoodcuttingNodePlacement): WoodcuttingNodePlacement {
  return { ...placement };
}

export function cloneTerrainEllipse(ellipse: TerrainEllipse): TerrainEllipse {
  return { ...ellipse };
}

export function cloneTerrainBox2D(box: TerrainBox2D): TerrainBox2D {
  return { ...box };
}

export function cloneTerrainPier(pier: TerrainPier): TerrainPier {
  return { ...pier };
}

export function cloneTerrainPathPatch(pathPatch: TerrainPathPatch): TerrainPathPatch {
  return {
    ...pathPatch,
    points: Array.isArray(pathPatch.points) ? pathPatch.points.map(clonePoint2) : [],
    tags: Array.isArray(pathPatch.tags) ? pathPatch.tags.slice() : []
  };
}

export function cloneIslandWaterPatch(patch: IslandWaterPatch): IslandWaterPatch {
  return {
    ...patch,
    waterBounds: { ...patch.waterBounds },
    landPolygon: Array.isArray(patch.landPolygon) ? patch.landPolygon.map(clonePoint2) : []
  };
}

export function cloneWaterBodyShape(shape: WaterBodyShape): WaterBodyShape {
  if (shape.kind === "polygon") {
    return {
      kind: "polygon",
      points: Array.isArray(shape.points) ? shape.points.map(clonePoint2) : []
    };
  }
  return { ...shape };
}

export function cloneWaterDepthZone(zone: WaterDepthZone): WaterDepthZone {
  return {
    shape: cloneWaterBodyShape(zone.shape),
    weight: Number.isFinite(zone.weight) ? Number(zone.weight) : undefined
  };
}

export function cloneWaterDepthProfile(profile: WaterDepthProfile): WaterDepthProfile {
  return {
    mode: profile.mode,
    deepZones: Array.isArray(profile.deepZones) ? profile.deepZones.map(cloneWaterDepthZone) : []
  };
}

export function cloneWaterShoreline(shoreline: WaterShoreline): WaterShoreline {
  return { ...shoreline };
}

export function cloneWaterStyleTokens(tokens: WaterStyleTokens): WaterStyleTokens {
  return { ...tokens };
}

export function cloneWaterBodyDefinition(body: WaterBodyDefinition): WaterBodyDefinition {
  return {
    id: body.id,
    shape: cloneWaterBodyShape(body.shape),
    surfaceY: body.surfaceY,
    depthProfile: body.depthProfile ? cloneWaterDepthProfile(body.depthProfile) : undefined,
    shoreline: body.shoreline ? cloneWaterShoreline(body.shoreline) : undefined,
    style: body.style
  };
}

export function cloneWaterRenderBody(body: WaterRenderBody): WaterRenderBody {
  return {
    id: body.id,
    shape: cloneWaterBodyShape(body.shape),
    surfaceY: body.surfaceY,
    depthProfile: cloneWaterDepthProfile(body.depthProfile),
    shoreline: cloneWaterShoreline(body.shoreline) as Required<WaterShoreline>,
    style: body.style,
    bounds: cloneTerrainBox2D(body.bounds),
    styleTokens: cloneWaterStyleTokens(body.styleTokens)
  };
}

export function cloneWaterRenderPayload(payload: WaterRenderPayload): WaterRenderPayload {
  return {
    bodies: Array.isArray(payload.bodies) ? payload.bodies.map(cloneWaterRenderBody) : []
  };
}

export function cloneStructurePlacement(structure: StructurePlacement): StructurePlacement {
  return { ...structure };
}

export function cloneStaircaseLandmark(landmark: StaircaseLandmark): StaircaseLandmark {
  return {
    landmarkId: landmark.landmarkId,
    tiles: Array.isArray(landmark.tiles) ? landmark.tiles.map(cloneLandmarkTile) : []
  };
}

function cloneLandmarkTile(tile: StaircaseLandmark["tiles"][number]): StaircaseLandmark["tiles"][number] {
  return { ...tile };
}

export function cloneDoorLandmark(door: DoorLandmark): DoorLandmark {
  return { ...door };
}

export function cloneFenceLandmark(fence: FenceLandmark): FenceLandmark {
  return {
    ...fence,
    points: Array.isArray(fence.points) ? fence.points.map(clonePoint2) : []
  };
}

export function cloneRoofLandmark(roof: RoofLandmark): RoofLandmark {
  return {
    ...roof,
    hideBounds: roof.hideBounds ? { ...roof.hideBounds } : undefined
  };
}

export function cloneCaveOpeningLandmark(opening: CaveOpeningLandmark): CaveOpeningLandmark {
  return {
    ...opening,
    tags: Array.isArray(opening.tags) ? opening.tags.slice() : []
  };
}

export function cloneDecorPropLandmark(prop: DecorPropLandmark): DecorPropLandmark {
  return {
    ...prop,
    tags: Array.isArray(prop.tags) ? prop.tags.slice() : []
  };
}

export function cloneShowcaseTree(tree: ShowcaseTree): ShowcaseTree {
  return { ...tree };
}
