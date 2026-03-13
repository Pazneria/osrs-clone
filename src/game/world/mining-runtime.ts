import type {
  LegacyWorldRuntimeDraft,
  MiningRockPlacement,
  Point3,
  RouteDescriptor,
  WeightedOreType
} from "../contracts/world";

export interface MiningRuntimeResult {
  miningRoutes: RouteDescriptor[];
  miningRockPlacements: MiningRockPlacement[];
  runeEssenceRocks: Point3[];
}

function cloneRoute(route: RouteDescriptor): RouteDescriptor {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

function getWeightedOreType(weights: WeightedOreType[], x: number, y: number): string | null {
  if (!Array.isArray(weights) || weights.length === 0) return null;
  let totalWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    const row = weights[i];
    if (!row || !row.oreType || !Number.isFinite(row.weight) || row.weight <= 0) continue;
    totalWeight += Math.floor(row.weight);
  }
  if (totalWeight <= 0) return null;

  const hash = ((x * 73856093) ^ (y * 19349663) ^ (totalWeight * 83492791)) >>> 0;
  let roll = hash % totalWeight;
  for (let i = 0; i < weights.length; i++) {
    const row = weights[i];
    if (!row || !row.oreType || !Number.isFinite(row.weight) || row.weight <= 0) continue;
    roll -= Math.floor(row.weight);
    if (roll < 0) return row.oreType;
  }
  return weights[weights.length - 1]?.oreType || null;
}

function isValidMiningCandidate(draft: LegacyWorldRuntimeDraft, x: number, y: number, z = 0): boolean {
  if (x <= 2 || y <= 2 || x >= draft.mapSize - 3 || y >= draft.mapSize - 3) return false;
  if (draft.helpers.inTownCore(x, y)) return false;
  const row = draft.logicalMap[z]?.[y];
  if (!row) return false;
  const tile = row[x];
  return tile === draft.tileIds.GRASS || tile === draft.tileIds.ROCK || draft.helpers.isTreeTileId(tile);
}

function isFarEnoughFromPlacedMiningRocks(
  candidate: Point3,
  placedMiningRocks: Point3[],
  minSpacing: number
): boolean {
  for (let i = 0; i < placedMiningRocks.length; i++) {
    const placed = placedMiningRocks[i];
    if (Math.hypot(placed.x - candidate.x, placed.y - candidate.y) < minSpacing) return false;
  }
  return true;
}

export function materializeMiningRuntime(draft: LegacyWorldRuntimeDraft): MiningRuntimeResult {
  const miningRoutes: RouteDescriptor[] = [];
  const miningRockPlacements: MiningRockPlacement[] = [];
  const runeEssenceRocks: Point3[] = [];
  const placedMiningRocks: Point3[] = [];
  const placedKeys = new Set<string>();

  const collectZoneCandidates = (
    zoneSpec: LegacyWorldRuntimeDraft["authored"]["miningZones"][number],
    radius: number
  ): Array<Point3 & { dist: number }> => {
    const candidates: Array<Point3 & { dist: number }> = [];
    const minX = Math.max(3, Math.floor(zoneSpec.centerX - radius));
    const maxX = Math.min(draft.mapSize - 4, Math.ceil(zoneSpec.centerX + radius));
    const minY = Math.max(3, Math.floor(zoneSpec.centerY - radius));
    const maxY = Math.min(draft.mapSize - 4, Math.ceil(zoneSpec.centerY + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.hypot(x - zoneSpec.centerX, y - zoneSpec.centerY);
        if (dist > radius) continue;
        if (!isValidMiningCandidate(draft, x, y, 0)) continue;
        candidates.push({ x, y, z: 0, dist });
      }
    }

    candidates.sort((a, b) => {
      if (a.dist !== b.dist) return a.dist - b.dist;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    return candidates;
  };

  const miningZones = draft.authored.miningZones;
  for (let zoneIndex = 0; zoneIndex < miningZones.length; zoneIndex++) {
    const zoneSpec = miningZones[zoneIndex];
    const targetCount = Number.isFinite(zoneSpec.targetCount) ? Math.max(1, Math.floor(zoneSpec.targetCount)) : 1;
    const minSpacing = Number.isFinite(zoneSpec.minSpacing) ? Math.max(1.6, zoneSpec.minSpacing) : 2;
    const radiusStep = Number.isFinite(zoneSpec.radiusStep) ? Math.max(2, Math.floor(zoneSpec.radiusStep)) : 6;
    let placedCount = 0;
    const zonePlacements: Point3[] = [];

    for (let radius = zoneSpec.minRadius; radius <= zoneSpec.maxRadius && placedCount < targetCount; radius += radiusStep) {
      const candidates = collectZoneCandidates(zoneSpec, radius);
      for (let i = 0; i < candidates.length && placedCount < targetCount; i++) {
        const candidate = candidates[i];
        const key = `${candidate.z}:${candidate.x},${candidate.y}`;
        if (placedKeys.has(key)) continue;
        if (!isFarEnoughFromPlacedMiningRocks(candidate, placedMiningRocks, minSpacing)) continue;

        const oreType = getWeightedOreType(zoneSpec.oreWeights, candidate.x, candidate.y);
        if (!oreType) continue;

        const placement: MiningRockPlacement = {
          placementId: `mining:${zoneSpec.routeId || zoneSpec.zoneId}:${placedCount + 1}`,
          routeId: zoneSpec.routeId || zoneSpec.zoneId,
          x: candidate.x,
          y: candidate.y,
          z: candidate.z,
          oreType,
          areaGateFlag: zoneSpec.areaGateFlag || null,
          areaName: zoneSpec.areaName || null,
          areaGateMessage: zoneSpec.areaGateMessage || null
        };

        if (!draft.writers.setMiningRock(placement)) continue;

        placedKeys.add(key);
        placedMiningRocks.push({ x: candidate.x, y: candidate.y, z: candidate.z });
        zonePlacements.push({ x: candidate.x, y: candidate.y, z: candidate.z });
        miningRockPlacements.push(placement);
        if (oreType === "rune_essence") {
          runeEssenceRocks.push({ x: candidate.x, y: candidate.y, z: candidate.z });
        }
        placedCount++;
      }
    }

    if (zonePlacements.length > 0) {
      const anchor = zonePlacements[Math.floor(zonePlacements.length / 2)];
      miningRoutes.push(cloneRoute({
        routeId: zoneSpec.routeId || zoneSpec.zoneId,
        alias: zoneSpec.alias || null,
        label: zoneSpec.label,
        x: anchor.x,
        y: anchor.y,
        z: anchor.z,
        count: zonePlacements.length,
        tags: Array.isArray(zoneSpec.tags) ? zoneSpec.tags.slice() : []
      }));
    }
  }

  return {
    miningRoutes,
    miningRockPlacements,
    runeEssenceRocks
  };
}
