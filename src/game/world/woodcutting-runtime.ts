import type {
  LegacyAltarRenderPlacement,
  LegacyNpcRenderPlacement,
  LegacyWorldRuntimeDraft,
  Point3,
  RouteDescriptor,
  ShowcaseTree,
  WoodcuttingTreePlacement
} from "../contracts/world";

interface WoodcuttingRuntimeResult {
  woodcuttingRoutes: RouteDescriptor[];
  woodcuttingTreePlacements: WoodcuttingTreePlacement[];
  showcasePlacements: ShowcaseTree[];
}

const WOODCUTTING_FALLBACK_BAND_EXPANSION = 30;

function cloneRoute(route: RouteDescriptor): RouteDescriptor {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

function resolveTreeReservedArea(nodeId: string): number {
  const treeReservedAreaByNodeId: Record<string, number> = {
    normal_tree: 3,
    oak_tree: 4,
    willow_tree: 4,
    maple_tree: 5,
    yew_tree: 6
  };
  const area = treeReservedAreaByNodeId[nodeId];
  if (Number.isFinite(area)) {
    return Math.max(3, Math.floor(area));
  }
  return 3;
}

function getTreeReservedHalfExtents(nodeId: string): { minOffset: number; maxOffset: number } {
  const area = resolveTreeReservedArea(nodeId);
  const minOffset = Math.floor((area - 1) / 2);
  const maxOffset = Math.ceil((area - 1) / 2);
  return { minOffset, maxOffset };
}

function getTreeReservedBounds(
  x: number,
  y: number,
  nodeId: string
): { minX: number; maxX: number; minY: number; maxY: number } {
  const extents = getTreeReservedHalfExtents(nodeId);
  return {
    minX: x - extents.minOffset,
    maxX: x + extents.maxOffset,
    minY: y - extents.minOffset,
    maxY: y + extents.maxOffset
  };
}

function treeReservedBoundsOverlap(
  a: { minX: number; maxX: number; minY: number; maxY: number },
  b: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  if (a.maxX < b.minX || b.maxX < a.minX) return false;
  if (a.maxY < b.minY || b.maxY < a.minY) return false;
  return true;
}

function distanceFromAnchor(candidate: Point3, anchor: { x: number; y: number }): number {
  return Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y);
}

export function materializeWoodcuttingRuntime(
  draft: LegacyWorldRuntimeDraft,
  runeEssenceRocks: Point3[],
  altarRenderPlacements: LegacyAltarRenderPlacement[],
  merchantNpcPlacements: LegacyNpcRenderPlacement[]
): WoodcuttingRuntimeResult {
  const woodcuttingRoutes: RouteDescriptor[] = [];
  const woodcuttingTreePlacements: WoodcuttingTreePlacement[] = [];
  const showcasePlacements = draft.authored.showcaseTrees.map((tree) => ({ ...tree }));
  const placedWoodcuttingTrees: Array<Point3 & { nodeId: string }> = [];
  const nearestWaterDistanceCache = new Map<string, number>();
  const nearestNpcDistanceCache = new Map<string, number>();
  const woodcuttingRouteAnchor = draft.authored.woodcuttingRouteAnchor;

  for (let y = 3; y < draft.mapSize - 3; y++) {
    for (let x = 3; x < draft.mapSize - 3; x++) {
      const tile = draft.logicalMap[0]?.[y]?.[x];
      if (!draft.helpers.isTreeTileId(tile)) continue;
      draft.logicalMap[0][y][x] = draft.tileIds.GRASS;
      draft.heightMap[0][y][x] = Math.max(0, draft.heightMap[0][y][x]);
    }
  }

  const collectWaterHabitatAnchors = (): Array<{ x: number; y: number }> => {
    const anchors: Array<{ x: number; y: number }> = [];
    for (let y = 2; y < draft.mapSize - 2; y++) {
      for (let x = 2; x < draft.mapSize - 2; x++) {
        if (!draft.helpers.isWaterTileId(draft.logicalMap[0][y][x])) continue;
        const isShorelineWater =
          !draft.helpers.isWaterTileId(draft.logicalMap[0][y - 1][x]) ||
          !draft.helpers.isWaterTileId(draft.logicalMap[0][y + 1][x]) ||
          !draft.helpers.isWaterTileId(draft.logicalMap[0][y][x - 1]) ||
          !draft.helpers.isWaterTileId(draft.logicalMap[0][y][x + 1]);
        if (!isShorelineWater) continue;
        anchors.push({ x, y });
      }
    }
    return anchors;
  };

  const waterHabitatAnchors = collectWaterHabitatAnchors();
  const npcHabitatAnchors = merchantNpcPlacements
    .filter((npc) => npc.z === 0 && Number.isFinite(npc.x) && Number.isFinite(npc.y))
    .map((npc) => ({ x: npc.x, y: npc.y }));

  const candidateDistanceCacheKey = (candidate: Point3): string => `${candidate.x},${candidate.y}`;

  const computeNearestAnchorDistance = (candidate: Point3, anchors: Array<{ x: number; y: number }>): number => {
    if (anchors.length === 0) return Infinity;
    let bestDistSq = Infinity;
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const dx = anchor.x - candidate.x;
      const dy = anchor.y - candidate.y;
      const distSq = (dx * dx) + (dy * dy);
      if (distSq < bestDistSq) bestDistSq = distSq;
    }
    return Number.isFinite(bestDistSq) ? Math.sqrt(bestDistSq) : Infinity;
  };

  const getNearestWaterDistance = (candidate: Point3): number => {
    const key = candidateDistanceCacheKey(candidate);
    const existing = nearestWaterDistanceCache.get(key);
    if (existing !== undefined) return existing;
    const distance = computeNearestAnchorDistance(candidate, waterHabitatAnchors);
    nearestWaterDistanceCache.set(key, distance);
    return distance;
  };

  const getNearestNpcDistance = (candidate: Point3): number => {
    const key = candidateDistanceCacheKey(candidate);
    const existing = nearestNpcDistanceCache.get(key);
    if (existing !== undefined) return existing;
    const distance = computeNearestAnchorDistance(candidate, npcHabitatAnchors);
    nearestNpcDistanceCache.set(key, distance);
    return distance;
  };

  const satisfiesWoodcuttingHabitatRule = (
    candidate: Point3,
    zoneSpec: LegacyWorldRuntimeDraft["authored"]["woodcuttingZones"][number]
  ): boolean => {
    const habitat = zoneSpec.habitatRule;
    if (!habitat || typeof habitat.type !== "string") return true;

    if (habitat.type === "near_water") {
      if (waterHabitatAnchors.length === 0) return true;
      const maxDistanceValue = typeof habitat.maxDistance === "number" ? habitat.maxDistance : Infinity;
      const maxDistance = Number.isFinite(maxDistanceValue) ? Math.max(1, maxDistanceValue) : Infinity;
      return getNearestWaterDistance(candidate) <= maxDistance;
    }

    if (habitat.type === "away_from_water") {
      if (waterHabitatAnchors.length === 0) return true;
      const minDistanceValue = typeof habitat.minDistance === "number" ? habitat.minDistance : 0;
      const minDistance = Number.isFinite(minDistanceValue) ? Math.max(0, minDistanceValue) : 0;
      return getNearestWaterDistance(candidate) >= minDistance;
    }

    if (habitat.type === "near_npc") {
      if (npcHabitatAnchors.length === 0) return true;
      const maxDistanceValue = typeof habitat.maxDistance === "number" ? habitat.maxDistance : Infinity;
      const maxDistance = Number.isFinite(maxDistanceValue) ? Math.max(1, maxDistanceValue) : Infinity;
      return getNearestNpcDistance(candidate) <= maxDistance;
    }

    return true;
  };

  const isCandidateNearRuneEssence = (candidate: Point3): boolean =>
    runeEssenceRocks.some((rock) => Math.hypot(rock.x - candidate.x, rock.y - candidate.y) < 20);

  const isCandidateNearExistingAltars = (candidate: Point3): boolean =>
    altarRenderPlacements.some((altar) => Math.hypot(altar.x - candidate.x, altar.y - candidate.y) < 28);

  const canPlaceWoodcuttingTreeCandidate = (
    candidate: Point3,
    zoneSpec: LegacyWorldRuntimeDraft["authored"]["woodcuttingZones"][number]
  ): boolean => {
    if (candidate.x <= 2 || candidate.y <= 2 || candidate.x >= draft.mapSize - 3 || candidate.y >= draft.mapSize - 3) return false;
    if (draft.helpers.inTownCore(candidate.x, candidate.y)) return false;
    const tile = draft.logicalMap[candidate.z]?.[candidate.y]?.[candidate.x];
    if (tile !== draft.tileIds.GRASS) return false;
    if (isCandidateNearRuneEssence(candidate)) return false;
    if (isCandidateNearExistingAltars(candidate)) return false;
    if (!satisfiesWoodcuttingHabitatRule(candidate, zoneSpec)) return false;
    return true;
  };

  const sortWoodcuttingCandidates = (candidates: Point3[], targetDistance: number): Point3[] =>
    candidates.sort((a, b) => {
      const distanceDelta =
        Math.abs(distanceFromAnchor(a, woodcuttingRouteAnchor) - targetDistance) -
        Math.abs(distanceFromAnchor(b, woodcuttingRouteAnchor) - targetDistance);
      if (distanceDelta !== 0) return distanceDelta;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

  const isTreeCandidateFarEnough = (candidate: Point3, minSpacing: number): boolean => {
    for (let i = 0; i < placedWoodcuttingTrees.length; i++) {
      const placed = placedWoodcuttingTrees[i];
      if (Math.hypot(placed.x - candidate.x, placed.y - candidate.y) < minSpacing) return false;
    }
    return true;
  };

  const isTreeCandidateReservedAreaClear = (candidate: Point3, candidateNodeId: string): boolean => {
    const candidateBounds = getTreeReservedBounds(candidate.x, candidate.y, candidateNodeId);
    for (let i = 0; i < placedWoodcuttingTrees.length; i++) {
      const placed = placedWoodcuttingTrees[i];
      const placedBounds = getTreeReservedBounds(placed.x, placed.y, placed.nodeId);
      if (treeReservedBoundsOverlap(candidateBounds, placedBounds)) return false;
    }
    return true;
  };

  const assignWoodcuttingBandTrees = (
    zoneSpec: LegacyWorldRuntimeDraft["authored"]["woodcuttingZones"][number]
  ): void => {
    const targetDistance = (zoneSpec.minDistance + zoneSpec.maxDistance) * 0.5;
    let minDistance = zoneSpec.minDistance;
    let maxDistance = zoneSpec.maxDistance;
    let sortedCandidates: Point3[] = [];

    for (let attempt = 0; attempt < 4; attempt++) {
      const inBand = draft.deterministicFeatureCandidates.filter((candidate) => {
        if (!canPlaceWoodcuttingTreeCandidate(candidate, zoneSpec)) return false;
        const dist = distanceFromAnchor(candidate, woodcuttingRouteAnchor);
        return dist >= minDistance && dist <= maxDistance;
      });
      if (inBand.length > 0) {
        sortedCandidates = sortWoodcuttingCandidates(inBand, targetDistance);
        break;
      }
      minDistance = Math.max(12, minDistance - WOODCUTTING_FALLBACK_BAND_EXPANSION);
      maxDistance = maxDistance + WOODCUTTING_FALLBACK_BAND_EXPANSION;
    }

    if (sortedCandidates.length === 0) {
      const anyEligible = draft.deterministicFeatureCandidates.filter((candidate) =>
        canPlaceWoodcuttingTreeCandidate(candidate, zoneSpec)
      );
      sortedCandidates = sortWoodcuttingCandidates(anyEligible, targetDistance);
    }

    const reservedArea = resolveTreeReservedArea(zoneSpec.nodeId);
    const minSpacing = Number.isFinite(zoneSpec.minSpacing)
      ? Math.max(1.5, zoneSpec.minSpacing, reservedArea)
      : reservedArea;
    const targetCount = Number.isFinite(zoneSpec.targetCount) ? Math.max(1, Math.floor(zoneSpec.targetCount)) : 1;
    let placedCount = 0;
    const zonePlacements: Point3[] = [];

    for (let i = 0; i < sortedCandidates.length && placedCount < targetCount; i++) {
      const candidate = sortedCandidates[i];
      if (!isTreeCandidateFarEnough(candidate, minSpacing)) continue;
      if (!isTreeCandidateReservedAreaClear(candidate, zoneSpec.nodeId)) continue;

      const placement: WoodcuttingTreePlacement = {
        placementId: `woodcutting:${zoneSpec.routeId || zoneSpec.nodeId}:${placedCount + 1}`,
        routeId: zoneSpec.routeId || zoneSpec.nodeId,
        x: candidate.x,
        y: candidate.y,
        z: candidate.z,
        nodeId: zoneSpec.nodeId,
        areaGateFlag: zoneSpec.areaGateFlag || null,
        areaName: zoneSpec.areaName || null,
        areaGateMessage: zoneSpec.areaGateMessage || null
      };
      if (!draft.writers.setTree(placement)) continue;

      placedWoodcuttingTrees.push({ x: candidate.x, y: candidate.y, z: candidate.z, nodeId: zoneSpec.nodeId });
      woodcuttingTreePlacements.push(placement);
      zonePlacements.push({ x: candidate.x, y: candidate.y, z: candidate.z });
      placedCount++;
    }

    if (zonePlacements.length > 0) {
      const anchor = zonePlacements[Math.floor(zonePlacements.length / 2)];
      woodcuttingRoutes.push(cloneRoute({
        routeId: zoneSpec.routeId || zoneSpec.nodeId,
        alias: zoneSpec.alias || null,
        label: zoneSpec.label,
        x: anchor.x,
        y: anchor.y,
        z: anchor.z,
        count: zonePlacements.length,
        tags: Array.isArray(zoneSpec.tags) ? zoneSpec.tags.slice() : []
      }));
    }
  };

  const zones = draft.authored.woodcuttingZones;
  for (let i = 0; i < zones.length; i++) {
    assignWoodcuttingBandTrees(zones[i]);
  }

  for (let i = 0; i < showcasePlacements.length; i++) {
    const tree = showcasePlacements[i];
    draft.writers.clearNaturalArea(tree.x, tree.y, Number.isFinite(tree.clearRadius) ? tree.clearRadius : 5);
    if (tree.x <= 1 || tree.y <= 1 || tree.x >= draft.mapSize - 2 || tree.y >= draft.mapSize - 2) continue;
    draft.writers.setTree({
      placementId: `showcase:${tree.nodeId}:${i + 1}`,
      routeId: `showcase:${tree.nodeId}`,
      x: tree.x,
      y: tree.y,
      z: 0,
      nodeId: tree.nodeId,
      areaGateFlag: null,
      areaName: null,
      areaGateMessage: null
    });
  }

  return {
    woodcuttingRoutes,
    woodcuttingTreePlacements,
    showcasePlacements
  };
}
