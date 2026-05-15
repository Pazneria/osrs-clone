import type { EnemySpawnNodeDefinition } from "./combat";

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
  appearanceId?: string | null;
  action?: string;
  travelToWorldId?: string | null;
  travelSpawn?: Point3 | null;
  facingYaw?: number;
  roamingRadiusOverride?: number | null;
  footprintW?: number;
  footprintD?: number;
  tags?: string[];
  dialogueId?: string | null;
  questHookIds?: string[];
  tutorialVisibleFromStep?: number | null;
  tutorialVisibleUntilStep?: number | null;
}

export interface NpcDescriptor extends Point3 {
  spawnId: string;
  name: string;
  npcType: number;
  merchantId?: string | null;
  appearanceId?: string | null;
  dialogueId?: string | null;
  action?: string;
  travelToWorldId?: string | null;
  travelSpawn?: Point3 | null;
  facingYaw?: number;
  roamingRadiusOverride?: number | null;
  tags?: string[];
  tutorialVisibleFromStep?: number | null;
  tutorialVisibleUntilStep?: number | null;
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

export interface WorldAreaDefinition {
  areaId: string;
  label: string;
}

export interface StructurePlacement extends Point3 {
  structureId: string;
  stampId: string;
  label: string;
  themeId?: string;
  materialProfileId?: string;
  conditionId?: string;
}

export interface TerrainEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotationRadians?: number;
}

export interface TerrainBox2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface TerrainPier {
  enabled?: boolean;
  xMin: number;
  xMax: number;
  yStart: number;
  yEnd: number;
  entryY: number;
}

export interface TerrainPathPatch {
  pathId: string;
  points: Point2[];
  pathWidth: number;
  z?: number;
  tileId?: string;
  height?: number;
  edgeSoftness?: number;
  tags?: string[];
}

export type TerrainLandformKind = "ellipse" | "path";
export type TerrainLandformMode = "set" | "raise" | "lower";

export interface TerrainLandformPatch {
  landformId: string;
  kind: TerrainLandformKind;
  height: number;
  mode?: TerrainLandformMode;
  z?: number;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  rotationRadians?: number;
  points?: Point2[];
  pathWidth?: number;
  edgeSoftness?: number;
  tileId?: string;
  tags?: string[];
}

export interface IslandWaterPatch {
  enabled?: boolean;
  waterBounds: TerrainBox2D;
  landPolygon: Point2[];
  shoreWidth?: number;
  shallowDistance?: number;
}

export interface WaterBodyEllipseShape extends TerrainEllipse {
  kind: "ellipse";
}

export interface WaterBodyBoxShape extends TerrainBox2D {
  kind: "box";
}

export interface WaterBodyPolygonShape {
  kind: "polygon";
  points: Point2[];
}

export type WaterBodyShape =
  | WaterBodyEllipseShape
  | WaterBodyBoxShape
  | WaterBodyPolygonShape;

export interface WaterDepthZone {
  shape: WaterBodyShape;
  weight?: number;
}

export interface WaterDepthProfile {
  mode: "tile_truth" | "uniform";
  deepZones?: WaterDepthZone[];
}

export interface WaterShoreline {
  width: number;
  foamWidth?: number;
  skirtDepth?: number;
}

export type WaterStyleId = "calm_lake";

export interface WaterBodyDefinition {
  id: string;
  shape: WaterBodyShape;
  surfaceY: number;
  depthProfile?: WaterDepthProfile;
  shoreline?: WaterShoreline;
  style?: WaterStyleId;
}

export interface WaterStyleTokens {
  shallowColor: number;
  deepColor: number;
  foamColor: number;
  shoreColor: number;
  rippleColor: number;
  highlightColor: number;
  opacity: number;
  shoreOpacity: number;
}

export interface WaterRenderBody {
  id: string;
  shape: WaterBodyShape;
  surfaceY: number;
  depthProfile: WaterDepthProfile;
  shoreline: Required<WaterShoreline>;
  style: WaterStyleId;
  bounds: TerrainBox2D;
  styleTokens: WaterStyleTokens;
}

export interface WaterRenderPayload {
  bodies: WaterRenderBody[];
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
  appearanceId?: string | null;
  dialogueId?: string | null;
  action?: string;
  roamingRadiusOverride?: number | null;
  anchorRouteId: string;
  tags?: string[];
  tutorialVisibleFromStep?: number | null;
  tutorialVisibleUntilStep?: number | null;
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
  tutorialRequiredStep?: number | null;
  tutorialGateMessage?: string | null;
  tutorialAutoOpenOnUnlock?: boolean | null;
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

export interface FenceLandmark {
  landmarkId: string;
  z: number;
  points: Point2[];
  height?: number;
}

export interface RoofLandmark extends Point3 {
  landmarkId: string;
  width: number;
  depth: number;
  height: number;
  ridgeAxis: "x" | "y";
  themeId?: string;
  materialProfileId?: string;
  conditionId?: string;
  roofIntegrity?: number;
  hideWhenPlayerInside?: boolean;
  hideBounds?: TerrainBox2D & { z: number };
}

export type CaveOpeningFacing = "north" | "south" | "east" | "west";

export interface CaveOpeningLandmark extends Point3 {
  landmarkId: string;
  label: string;
  facing: CaveOpeningFacing;
  width: number;
  depth: number;
  visualOnly: boolean;
  occluded?: boolean;
  tags?: string[];
}

export type DecorPropKind =
  | "desk"
  | "crate"
  | "tool_rack"
  | "notice_board"
  | "chopping_block"
  | "woodpile"
  | "ore_pile"
  | "coal_bin"
  | "barrel"
  | "weapon_rack"
  | "training_dummy"
  | "archery_target"
  | "bank_sign"
  | "shop_sign"
  | "market_awning"
  | "wall_painting"
  | "castle_banner"
  | "rubble_pile"
  | "quarry_cart"
  | "thatch_bundle";

export interface DecorPropLandmark extends Point3 {
  propId: string;
  kind: DecorPropKind;
  label?: string;
  facingYaw?: number;
  blocksMovement?: boolean;
  tags?: string[];
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
  areas?: WorldAreaDefinition[];
  structures: StructurePlacement[];
  waterBodies?: WaterBodyDefinition[];
  terrainPatches: {
    islandWater?: IslandWaterPatch;
    lakes: TerrainEllipse[];
    castleFrontPond: TerrainEllipse;
    deepWaterCenter: TerrainBox2D;
    pier: TerrainPier;
    paths?: TerrainPathPatch[];
    landforms?: TerrainLandformPatch[];
    smithingHallApproach: {
      enabled?: boolean;
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
  combatSpawns: EnemySpawnNodeDefinition[];
  resourceNodes: {
    mining: MiningNodePlacement[];
    woodcutting: WoodcuttingNodePlacement[];
  };
  skillRoutes: {
    fishing: RouteDescriptor[];
    cooking: SkillRouteWithFireTiles[];
    firemaking: RouteDescriptor[];
    mining: RouteDescriptor[];
    runecrafting: RouteDescriptor[];
    woodcutting: RouteDescriptor[];
  };
  landmarks: {
    staircases: StaircaseLandmark[];
    doors: DoorLandmark[];
    fences?: FenceLandmark[];
    roofs?: RoofLandmark[];
    caveOpenings?: CaveOpeningLandmark[];
    decorProps?: DecorPropLandmark[];
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
  islandWater?: IslandWaterPatch;
  castleFrontPond: TerrainEllipse;
  deepWaterCenter: TerrainBox2D;
  pier: TerrainPier;
  pathPatches: TerrainPathPatch[];
  landformPatches: TerrainLandformPatch[];
  waterBodies: WaterBodyDefinition[];
  smithingHallApproach: {
    enabled?: boolean;
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
  combatSpawnNodes: EnemySpawnNodeDefinition[];
  smithingStations: ServiceDescriptor[];
  fishingRoutes: RouteDescriptor[];
  cookingRoutes: SkillRouteWithFireTiles[];
  firemakingRoutes: RouteDescriptor[];
  miningRoutes: RouteDescriptor[];
  runecraftingRoutes: RouteDescriptor[];
  woodcuttingRoutes: RouteDescriptor[];
  miningNodePlacements: MiningNodePlacement[];
  altarPlacements: RunecraftingAltarPlacement[];
  woodcuttingNodePlacements: WoodcuttingNodePlacement[];
  staircases: StaircaseLandmark[];
  doors: DoorLandmark[];
  fences: FenceLandmark[];
  roofs: RoofLandmark[];
  caveOpenings: CaveOpeningLandmark[];
  decorProps: DecorPropLandmark[];
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
    water: WaterRenderPayload;
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
  spawnId?: string | null;
  type: number;
  name?: string;
  merchantId?: string | null;
  appearanceId?: string | null;
  dialogueId?: string | null;
  action?: string;
  facingYaw?: number;
  roamingRadiusOverride?: number | null;
  tags?: string[];
  tutorialVisibleFromStep?: number | null;
  tutorialVisibleUntilStep?: number | null;
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
  FENCE: number;
  WOODEN_GATE_CLOSED: number;
  WOODEN_GATE_OPEN: number;
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
    firemaking: RouteDescriptor[];
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
    isWalkableTileId: (tileId: number) => boolean;
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
