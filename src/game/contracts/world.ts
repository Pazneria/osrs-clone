export interface Point2 {
  x: number;
  y: number;
}

export interface Point3 extends Point2 {
  z: number;
}

export interface RouteDescriptor extends Point3 {
  routeId: string;
  alias?: string | null;
  label: string;
  tags?: string[];
  count?: number;
}

export interface ServiceDescriptor extends Point3 {
  serviceId: string;
  spawnId: string;
  type: string;
  interactionTarget: string;
  merchantId?: string | null;
  name?: string;
  npcType?: number;
  action?: string;
  travelToWorldId?: string | null;
  travelSpawn?: Point3 | null;
  facingYaw?: number;
  footprintW?: number;
  footprintD?: number;
  tags?: string[];
  dialogueId?: string | null;
  questHookIds?: string[];
}

export interface NpcDescriptor extends Point3 {
  spawnId: string;
  name: string;
  npcType: number;
  merchantId?: string | null;
  action?: string;
  travelToWorldId?: string | null;
  travelSpawn?: Point3 | null;
  facingYaw?: number;
  tags?: string[];
}

export interface WorldStamp {
  stampId: string;
  label?: string;
  rows: string[];
}

export interface WorldManifestEntry {
  worldId: string;
  label: string;
  regionFile: string;
  stampIds: string[];
  defaultSpawn: Point3;
}

export interface WorldManifest {
  version: string;
  worlds: WorldManifestEntry[];
}

export interface StructurePlacement extends Point3 {
  structureId: string;
  stampId: string;
  label: string;
}

export interface TerrainEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface TerrainBox2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface TerrainPier {
  xMin: number;
  xMax: number;
  yStart: number;
  yEnd: number;
  entryY: number;
}

export interface SkillRouteWithFireTiles extends RouteDescriptor {
  fireTiles: Point2[];
}

export interface WeightedOreType {
  oreType: string;
  weight: number;
}

export interface MiningZoneSpec {
  routeId: string;
  alias?: string | null;
  zoneId: string;
  label: string;
  centerX: number;
  centerY: number;
  minRadius: number;
  maxRadius: number;
  radiusStep: number;
  targetCount: number;
  minSpacing: number;
  oreWeights: WeightedOreType[];
  areaGateFlag?: string | null;
  areaName?: string | null;
  areaGateMessage?: string | null;
  tags?: string[];
}

export interface RunecraftingBandSpec {
  routeId: string;
  alias?: string | null;
  label: string;
  variant: number;
  minDistance: number;
  maxDistance: number;
  tags?: string[];
}

export interface HabitatRule {
  type: string;
  minDistance?: number;
  maxDistance?: number;
}

export interface WoodcuttingZoneSpec {
  routeId: string;
  alias?: string | null;
  nodeId: string;
  label: string;
  minDistance: number;
  maxDistance: number;
  targetCount: number;
  minSpacing: number;
  areaGateFlag?: string | null;
  areaName?: string | null;
  areaGateMessage?: string | null;
  habitatRule?: HabitatRule | null;
  tags?: string[];
}

export interface DynamicMerchantSpawn {
  serviceId: string;
  spawnId: string;
  type: string;
  interactionTarget: string;
  merchantId: string;
  name: string;
  npcType: number;
  action?: string;
  anchorRouteId: string;
  tags?: string[];
}

export interface LandmarkTile extends Point3 {
  tileId: string;
  height: number;
}

export interface StaircaseLandmark {
  landmarkId: string;
  tiles: LandmarkTile[];
}

export interface DoorLandmark extends Point3 {
  landmarkId: string;
  tileId: string;
  height: number;
  isOpen: boolean;
  hingeOffsetX: number;
  hingeOffsetY: number;
  thickness: number;
  width: number;
  isEW: boolean;
  closedRot: number;
  openRot: number;
  currentRotation: number;
  targetRotation: number;
}

export interface ShowcaseTree {
  nodeId: string;
  x: number;
  y: number;
  clearRadius: number;
}

export interface WorldDefinition {
  worldId: string;
  version: string;
  structures: StructurePlacement[];
  terrainPatches: {
    lakes: TerrainEllipse[];
    castleFrontPond: TerrainEllipse;
    deepWaterCenter: TerrainBox2D;
    pier: TerrainPier;
    smithingHallApproach: {
      shoreX: number;
      stairX: number;
      yStart: number;
      yEnd: number;
    };
    castleRouteAnchor: Point2;
    woodcuttingRouteAnchor: Point2;
  };
  npcSpawns: NpcDescriptor[];
  services: ServiceDescriptor[];
  resourceNodes: {
    mining: MiningNodePlacement[];
    woodcutting: WoodcuttingNodePlacement[];
  };
  skillRoutes: {
    fishing: RouteDescriptor[];
    cooking: SkillRouteWithFireTiles[];
    mining: RouteDescriptor[];
    runecrafting: RouteDescriptor[];
    woodcutting: RouteDescriptor[];
  };
  landmarks: {
    staircases: StaircaseLandmark[];
    doors: DoorLandmark[];
    altars: RunecraftingAltarPlacement[];
    showcaseTrees: ShowcaseTree[];
  };
}

export interface RouteRegistry {
  entries: RouteDescriptor[];
  groups: Record<string, RouteDescriptor[]>;
  byId: Record<string, RouteDescriptor>;
  byAlias: Record<string, RouteDescriptor>;
  byTag: Record<string, RouteDescriptor[]>;
}

export interface ServiceRegistry {
  entries: ServiceDescriptor[];
  byId: Record<string, ServiceDescriptor>;
  bySpawnId: Record<string, ServiceDescriptor>;
  byMerchantId: Record<string, ServiceDescriptor[]>;
  byTag: Record<string, ServiceDescriptor[]>;
}

export interface NpcRegistry {
  entries: NpcDescriptor[];
  bySpawnId: Record<string, NpcDescriptor>;
  byMerchantId: Record<string, NpcDescriptor[]>;
}

export interface WorldLegacyView {
  lakeDefs: TerrainEllipse[];
  castleFrontPond: TerrainEllipse;
  deepWaterCenter: TerrainBox2D;
  pier: TerrainPier;
  smithingHallApproach: {
    shoreX: number;
    stairX: number;
    yStart: number;
    yEnd: number;
  };
  castleRouteAnchor: Point2;
  woodcuttingRouteAnchor: Point2;
  stampMap: Record<string, string[]>;
  stampedStructures: StructurePlacement[];
  generalStoreService: ServiceDescriptor | null;
  staticMerchants: ServiceDescriptor[];
  smithingStations: ServiceDescriptor[];
  fishingRoutes: RouteDescriptor[];
  cookingRoutes: SkillRouteWithFireTiles[];
  miningRoutes: RouteDescriptor[];
  runecraftingRoutes: RouteDescriptor[];
  woodcuttingRoutes: RouteDescriptor[];
  miningNodePlacements: MiningNodePlacement[];
  altarPlacements: RunecraftingAltarPlacement[];
  woodcuttingNodePlacements: WoodcuttingNodePlacement[];
  staircases: StaircaseLandmark[];
  doors: DoorLandmark[];
  showcaseTrees: ShowcaseTree[];
}

export interface WorldBootstrapResult {
  definition: WorldDefinition;
  stamps: Record<string, WorldStamp>;
  routeRegistry: RouteRegistry;
  serviceRegistry: ServiceRegistry;
  npcRegistry: NpcRegistry;
  legacy: WorldLegacyView;
  renderPayload: {
    furnacesToRender: Array<Pick<ServiceDescriptor, "x" | "y" | "z" | "facingYaw" | "footprintW" | "footprintD">>;
    anvilsToRender: Array<Pick<ServiceDescriptor, "x" | "y" | "z" | "facingYaw">>;
  };
}

export interface WorldRegistry {
  manifest: WorldManifest;
  listWorldIds: () => string[];
  getManifestEntry: (worldId: string) => WorldManifestEntry;
  getWorldDefinition: (worldId: string) => WorldDefinition;
  getWorldStamps: (worldId: string) => Record<string, WorldStamp>;
  getDefaultSpawn: (worldId: string) => Point3;
}

export interface RuntimeWorldStateInput {
  routeGroups?: Record<string, RouteDescriptor[]>;
  runtimeServices?: ServiceDescriptor[];
  runtimeNpcs?: NpcDescriptor[];
  altarByRouteId?: Record<string, { x: number; y: number; z: number }>;
}

export interface GameContext {
  worldId: string;
  version: string;
  definition: WorldDefinition;
  routeRegistry: RouteRegistry;
  serviceRegistry: ServiceRegistry;
  npcRegistry: NpcRegistry;
  queries: {
    getRouteGroup: (groupId: string) => RouteDescriptor[];
    findRouteByAlias: (alias: string, groupId?: string) => RouteDescriptor | null;
    getServicesByTag: (tag: string) => ServiceDescriptor[];
    findServiceByMerchantId: (merchantId: string) => ServiceDescriptor | null;
    getMerchantServices: () => ServiceDescriptor[];
  };
}

export interface LegacyAreaGateDescriptor {
  areaGateFlag?: string | null;
  areaName?: string | null;
  areaGateMessage?: string | null;
}

export interface MiningNodePlacement extends Point3, LegacyAreaGateDescriptor {
  placementId: string;
  routeId: string;
  oreType: string;
}

export interface RunecraftingAltarPlacement extends RouteDescriptor {
  variant: number;
}

export interface WoodcuttingNodePlacement extends Point3, LegacyAreaGateDescriptor {
  placementId: string;
  routeId: string;
  nodeId: string;
}

export interface LegacyNpcRenderPlacement extends Point3 {
  type: number;
  name?: string;
  merchantId?: string | null;
  action?: string;
  facingYaw?: number;
  tags?: string[];
}

export interface LegacyAltarRenderPlacement extends RunecraftingAltarPlacement {}

export interface MiningRockPlacement extends MiningNodePlacement {}

export interface WoodcuttingTreePlacement extends WoodcuttingNodePlacement {}

export interface LegacyWorldTileIds {
  GRASS: number;
  TREE: number;
  ROCK: number;
  OBSTACLE: number;
  FLOOR_WOOD: number;
  FLOOR_STONE: number;
  FLOOR_BRICK: number;
  STAIRS_RAMP: number;
  DOOR_OPEN: number;
  SHORE: number;
  SOLID_NPC: number;
}

export interface LegacyWorldRuntimeDraft {
  mapSize: number;
  logicalMap: number[][][];
  heightMap: number[][][];
  tileIds: LegacyWorldTileIds;
  deterministicFeatureCandidates: Point3[];
  staticRouteGroups: {
    fishing: RouteDescriptor[];
    cooking: SkillRouteWithFireTiles[];
  };
  generalStoreService: ServiceDescriptor | null;
  staticMerchantRenderPlacements: LegacyNpcRenderPlacement[];
  authored: {
    castleRouteAnchor: Point2;
    woodcuttingRouteAnchor: Point2;
    runecraftingAltarOrder: string[];
    miningZones: MiningZoneSpec[];
    runecraftingBands: RunecraftingBandSpec[];
    runecraftingMerchants: DynamicMerchantSpawn[];
    woodcuttingZones: WoodcuttingZoneSpec[];
    showcaseTrees: ShowcaseTree[];
  };
  helpers: {
    inTownCore: (x: number, y: number) => boolean;
    isTreeTileId: (tileId: number) => boolean;
    isWaterTileId: (tileId: number) => boolean;
    isNaturalTileId: (tileId: number) => boolean;
  };
  writers: {
    setMiningRock: (placement: MiningRockPlacement) => boolean;
    setTile: (x: number, y: number, z: number, tileId: number) => void;
    setTree: (placement: WoodcuttingTreePlacement) => boolean;
    clearNaturalArea: (centerX: number, centerY: number, radius: number) => void;
  };
}

export interface SkillWorldRuntimeArtifacts {
  miningRoutes: RouteDescriptor[];
  miningRockPlacements: MiningRockPlacement[];
  runecraftingRoutes: RouteDescriptor[];
  altarRenderPlacements: LegacyAltarRenderPlacement[];
  altarByRouteId: Record<string, { x: number; y: number; z: number }>;
  runtimeMerchantServices: ServiceDescriptor[];
  merchantNpcDescriptors: NpcDescriptor[];
  merchantNpcRenderPlacements: LegacyNpcRenderPlacement[];
  woodcuttingRoutes: RouteDescriptor[];
  woodcuttingTreePlacements: WoodcuttingTreePlacement[];
  showcasePlacements: ShowcaseTree[];
  runeEssenceRocks: Point3[];
  publishedWorldState: RuntimeWorldStateInput;
}
