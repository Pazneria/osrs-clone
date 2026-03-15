import type {
  LegacyWorldRuntimeDraft,
  MiningRockPlacement,
  MiningZoneSpec,
  Point3,
  RouteDescriptor,
  WeightedOreType
} from "../contracts/world";

export interface MiningRuntimeResult {
  miningRoutes: RouteDescriptor[];
  miningRockPlacements: MiningRockPlacement[];
  runeEssenceRocks: Point3[];
}

interface MiningCandidate extends Point3 {
  dist: number;
  angle: number;
  ringBias: number;
  fieldNoise: number;
}

function cloneRoute(route: RouteDescriptor): RouteDescriptor {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hash2D(x: number, y: number, seed = 0): number {
  const sample = Math.sin((x * 127.1) + (y * 311.7) + (seed * 74.7)) * 43758.5453123;
  return sample - Math.floor(sample);
}

function pointKey(point: Point3): string {
  return `${point.z}:${point.x},${point.y}`;
}

function minDistanceToPoints(candidate: Point3, points: Point3[]): number {
  if (!Array.isArray(points) || points.length === 0) return Number.POSITIVE_INFINITY;
  let minDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    const target = points[i];
    minDistance = Math.min(minDistance, Math.hypot(target.x - candidate.x, target.y - candidate.y));
  }
  return minDistance;
}

function countLineConflicts(candidate: Point3, points: Point3[], axisRange: number): number {
  let conflicts = 0;
  for (let i = 0; i < points.length; i++) {
    const target = points[i];
    const dx = Math.abs(target.x - candidate.x);
    const dy = Math.abs(target.y - candidate.y);
    if (dx === 0 && dy <= axisRange) conflicts += 2;
    else if (dy === 0 && dx <= axisRange) conflicts += 2;
    else if (dx === dy && dx <= axisRange) conflicts += 1;
  }
  return conflicts;
}

function collectZoneCandidates(
  draft: LegacyWorldRuntimeDraft,
  zoneSpec: MiningZoneSpec,
  zoneIndex: number,
  radius: number
): MiningCandidate[] {
  const candidates: MiningCandidate[] = [];
  const minX = Math.max(3, Math.floor(zoneSpec.centerX - radius));
  const maxX = Math.min(draft.mapSize - 4, Math.ceil(zoneSpec.centerX + radius));
  const minY = Math.max(3, Math.floor(zoneSpec.centerY - radius));
  const maxY = Math.min(draft.mapSize - 4, Math.ceil(zoneSpec.centerY + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x - zoneSpec.centerX, y - zoneSpec.centerY);
      if (dist > radius) continue;
      if (!isValidMiningCandidate(draft, x, y, 0)) continue;

      const normalizedDistance = dist / Math.max(1, radius);
      candidates.push({
        x,
        y,
        z: 0,
        dist,
        angle: Math.atan2(y - zoneSpec.centerY, x - zoneSpec.centerX),
        ringBias: 1 - Math.abs(normalizedDistance - 0.56),
        fieldNoise: hash2D(x + (zoneIndex * 13.7), y - (zoneIndex * 9.1), 91.4 + (zoneIndex * 4.6))
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  return candidates;
}

function computeTargetRadius(zoneSpec: MiningZoneSpec): number {
  const targetCount = Number.isFinite(zoneSpec.targetCount) ? Math.max(1, zoneSpec.targetCount) : 1;
  const minSpacing = Number.isFinite(zoneSpec.minSpacing) ? Math.max(1.6, zoneSpec.minSpacing) : 2;
  const desiredRadius = Math.sqrt(targetCount * minSpacing) + (minSpacing * 2.1);
  return Math.max(zoneSpec.minRadius, Math.min(zoneSpec.maxRadius, desiredRadius));
}

function chooseZonePlacements(
  zoneSpec: MiningZoneSpec,
  zoneIndex: number,
  candidates: MiningCandidate[],
  placedMiningRocks: Point3[]
): MiningCandidate[] {
  const targetCount = Number.isFinite(zoneSpec.targetCount) ? Math.max(1, Math.floor(zoneSpec.targetCount)) : 1;
  const minSpacing = Number.isFinite(zoneSpec.minSpacing) ? Math.max(1.6, zoneSpec.minSpacing) : 2;
  const selected: MiningCandidate[] = [];
  const selectedKeys = new Set<string>();
  const remaining = candidates.slice();
  const clusterCenters: MiningCandidate[] = [];
  const usedAngleSectors = new Set<number>();
  const angleSectorCount = 8;

  const addSelected = (candidate: MiningCandidate | null, spacing = minSpacing): boolean => {
    if (!candidate) return false;
    const key = pointKey(candidate);
    if (selectedKeys.has(key)) return false;
    if (!isFarEnoughFromPlacedMiningRocks(candidate, placedMiningRocks, spacing)) return false;
    if (!isFarEnoughFromPlacedMiningRocks(candidate, selected, spacing)) return false;
    selected.push(candidate);
    selectedKeys.add(key);
    const sector = Math.floor((((candidate.angle + Math.PI) / (Math.PI * 2)) * angleSectorCount)) % angleSectorCount;
    usedAngleSectors.add(sector);
    return true;
  };

  const removeRemainingAt = (index: number): MiningCandidate | null => {
    if (index < 0 || index >= remaining.length) return null;
    return remaining.splice(index, 1)[0] || null;
  };

  const strayTarget = targetCount >= 24 ? 4 : (targetCount >= 16 ? 3 : (targetCount >= 10 ? 2 : 1));
  let clusteredCount = Math.max(0, targetCount - strayTarget);
  const clumpSizes: number[] = [];
  let clumpIndex = 0;
  while (clusteredCount > 0) {
    const clumpRoll = hash2D(
      zoneSpec.centerX + (clumpIndex * 3.7),
      zoneSpec.centerY - (clumpIndex * 2.9),
      611.4 + (zoneIndex * 7.1)
    );
    let requestedSize = clumpRoll < 0.22 ? 4 : (clumpRoll < 0.68 ? 3 : 2);
    if (clusteredCount <= 2) requestedSize = clusteredCount;
    const clumpSize = Math.max(1, Math.min(requestedSize, clusteredCount));
    clumpSizes.push(clumpSize);
    clusteredCount -= clumpSize;
    clumpIndex++;
  }

  const targetRadius = computeTargetRadius(zoneSpec);
  let centerSpacing = Math.max(
    minSpacing * 1.9,
    Math.min(targetRadius * 0.94, (targetRadius * 1.55) / Math.max(1.9, Math.sqrt(Math.max(1, clumpSizes.length))))
  );

  for (let c = 0; c < clumpSizes.length && remaining.length > 0 && selected.length < targetCount; c++) {
    const clumpSize = clumpSizes[c];
    let centerCandidateIndex = -1;
    let centerCandidateScore = -Infinity;

    for (let pass = 0; pass < 4 && centerCandidateIndex === -1; pass++) {
      const spacingLimit = Math.max(minSpacing * 1.18, centerSpacing - (pass * 0.45));
      for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
        const candidate = remaining[candidateIndex];
        if (!isFarEnoughFromPlacedMiningRocks(candidate, placedMiningRocks, minSpacing)) continue;
        if (!isFarEnoughFromPlacedMiningRocks(candidate, selected, minSpacing)) continue;

        const minCenterDistance = minDistanceToPoints(candidate, clusterCenters);
        if (clusterCenters.length > 0 && minCenterDistance < spacingLimit) continue;

        const sector = Math.floor((((candidate.angle + Math.PI) / (Math.PI * 2)) * angleSectorCount)) % angleSectorCount;
        const sectorBonus = usedAngleSectors.has(sector) ? 0 : 0.82;
        const linePenalty = countLineConflicts(candidate, selected, minSpacing * 3.2);
        const centerDistanceScore = Number.isFinite(minCenterDistance) ? minCenterDistance : centerSpacing;
        const jitter = hash2D(candidate.x, candidate.y, 641.2 + (zoneIndex * 3.9) + (c * 1.7));
        const score = (Math.min(centerDistanceScore, centerSpacing * 1.35) * 0.72)
          + (candidate.ringBias * 1.18)
          + (candidate.fieldNoise * 0.44)
          + sectorBonus
          + (jitter * 0.18)
          - (linePenalty * 0.98);

        if (score > centerCandidateScore) {
          centerCandidateScore = score;
          centerCandidateIndex = candidateIndex;
        }
      }
    }

    const centerCandidate = removeRemainingAt(centerCandidateIndex);
    if (!centerCandidate || !addSelected(centerCandidate)) continue;
    clusterCenters.push(centerCandidate);

    const localIdeal = minSpacing * (1.16 + (hash2D(centerCandidate.x, centerCandidate.y, 703.8 + c) * 0.4));
    const maxLocalRadius = Math.max(minSpacing * 1.8, localIdeal + (clumpSize >= 4 ? 1.15 : 0.7));
    const usedLocalAngles = new Set<number>();

    for (let member = 1; member < clumpSize && selected.length < targetCount; member++) {
      let neighborIndex = -1;
      let neighborScore = -Infinity;
      for (let pass = 0; pass < 4 && neighborIndex === -1; pass++) {
        const minRadius = Math.max(minSpacing * 0.78, localIdeal - (pass * 0.45));
        const maxRadius = maxLocalRadius + (pass * 0.58);
        for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
          const candidate = remaining[candidateIndex];
          const centerDist = Math.hypot(candidate.x - centerCandidate.x, candidate.y - centerCandidate.y);
          if (centerDist < minRadius || centerDist > maxRadius) continue;
          if (!isFarEnoughFromPlacedMiningRocks(candidate, placedMiningRocks, minSpacing)) continue;
          if (!isFarEnoughFromPlacedMiningRocks(candidate, selected, minSpacing)) continue;

          const localAngle = Math.floor((((Math.atan2(candidate.y - centerCandidate.y, candidate.x - centerCandidate.x) + Math.PI) / (Math.PI * 2)) * 6)) % 6;
          const localAngleBonus = usedLocalAngles.has(localAngle) ? 0 : 0.4;
          const clumpProximity = 1 - clamp01(Math.abs(centerDist - localIdeal) / Math.max(0.1, maxRadius));
          const linePenalty = countLineConflicts(candidate, selected, minSpacing * 2.9);
          const otherCenterPenalty = clusterCenters.length > 1
            ? Math.max(0, (minSpacing * 1.65) - minDistanceToPoints(candidate, clusterCenters.filter((entry) => entry !== centerCandidate)))
            : 0;
          const jitter = hash2D(candidate.x, candidate.y, 728.6 + (zoneIndex * 4.7) + (member * 3.1));
          const score = (clumpProximity * 1.08)
            + (candidate.ringBias * 0.34)
            + (candidate.fieldNoise * 0.32)
            + localAngleBonus
            + (jitter * 0.16)
            - (linePenalty * 1.12)
            - (otherCenterPenalty * 0.64);

          if (score > neighborScore) {
            neighborScore = score;
            neighborIndex = candidateIndex;
          }
        }
      }

      const neighbor = removeRemainingAt(neighborIndex);
      if (neighbor && addSelected(neighbor)) {
        const localAngle = Math.floor((((Math.atan2(neighbor.y - centerCandidate.y, neighbor.x - centerCandidate.x) + Math.PI) / (Math.PI * 2)) * 6)) % 6;
        usedLocalAngles.add(localAngle);
      }
    }
  }

  let straySpacing = Math.max(minSpacing * 1.2, Math.min(targetRadius * 0.58, minSpacing * 2.15));
  let straySafety = 0;
  while (selected.length < targetCount && remaining.length > 0 && straySafety < 1024) {
    straySafety++;
    let bestStrayIndex = -1;
    let bestStrayScore = -Infinity;

    for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
      const candidate = remaining[candidateIndex];
      if (!isFarEnoughFromPlacedMiningRocks(candidate, placedMiningRocks, minSpacing)) continue;
      const minPlacedDistance = minDistanceToPoints(candidate, selected);
      if (selected.length > 0 && minPlacedDistance < straySpacing) continue;

      const sector = Math.floor((((candidate.angle + Math.PI) / (Math.PI * 2)) * angleSectorCount)) % angleSectorCount;
      const sectorBonus = usedAngleSectors.has(sector) ? 0 : 0.74;
      const linePenalty = countLineConflicts(candidate, selected, minSpacing * 3.4);
      const jitter = hash2D(candidate.x, candidate.y, 866.4 + (zoneIndex * 5.2) + (selected.length * 1.7));
      const score = (Math.min(minPlacedDistance, targetRadius) * 0.6)
        + (candidate.ringBias * 0.9)
        + (candidate.fieldNoise * 0.3)
        + sectorBonus
        + (jitter * 0.16)
        - (linePenalty * 1.06);

      if (score > bestStrayScore) {
        bestStrayScore = score;
        bestStrayIndex = candidateIndex;
      }
    }

    if (bestStrayIndex === -1) {
      straySpacing = Math.max(minSpacing * 0.9, straySpacing - 0.18);
      if (straySpacing <= minSpacing * 0.92) break;
      continue;
    }

    addSelected(removeRemainingAt(bestStrayIndex), Math.max(minSpacing * 0.96, 1.8));
  }

  if (selected.length < targetCount) {
    remaining.sort((a, b) => {
      const aLinePenalty = countLineConflicts(a, selected, minSpacing * 3.4);
      const bLinePenalty = countLineConflicts(b, selected, minSpacing * 3.4);
      if (aLinePenalty !== bLinePenalty) return aLinePenalty - bLinePenalty;
      if (a.ringBias !== b.ringBias) return b.ringBias - a.ringBias;
      if (a.fieldNoise !== b.fieldNoise) return b.fieldNoise - a.fieldNoise;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    const relaxedSpacing = Math.max(minSpacing * 0.9, 1.75);
    for (let i = 0; i < remaining.length && selected.length < targetCount; i++) {
      addSelected(remaining[i], relaxedSpacing);
    }
  }

  selected.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return selected.slice(0, targetCount);
}

function findRouteAnchor(zonePlacements: Point3[], centerX: number, centerY: number): Point3 {
  if (!Array.isArray(zonePlacements) || zonePlacements.length === 0) {
    return { x: centerX, y: centerY, z: 0 };
  }

  let avgX = 0;
  let avgY = 0;
  for (let i = 0; i < zonePlacements.length; i++) {
    avgX += zonePlacements[i].x;
    avgY += zonePlacements[i].y;
  }
  avgX /= zonePlacements.length;
  avgY /= zonePlacements.length;

  let bestPlacement = zonePlacements[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < zonePlacements.length; i++) {
    const placement = zonePlacements[i];
    const score = Math.hypot(placement.x - avgX, placement.y - avgY)
      + (Math.hypot(placement.x - centerX, placement.y - centerY) * 0.15);
    if (score < bestScore) {
      bestScore = score;
      bestPlacement = placement;
    }
  }
  return { x: bestPlacement.x, y: bestPlacement.y, z: bestPlacement.z };
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

  const miningZones = draft.authored.miningZones;
  for (let zoneIndex = 0; zoneIndex < miningZones.length; zoneIndex++) {
    const zoneSpec = miningZones[zoneIndex];
    const targetCount = Number.isFinite(zoneSpec.targetCount) ? Math.max(1, Math.floor(zoneSpec.targetCount)) : 1;
    const radiusStep = Number.isFinite(zoneSpec.radiusStep) ? Math.max(2, Math.floor(zoneSpec.radiusStep)) : 6;
    const zonePlacements: Point3[] = [];

    let selectedCandidates: MiningCandidate[] = [];
    const targetRadius = computeTargetRadius(zoneSpec);
    for (
      let radius = targetRadius;
      radius <= zoneSpec.maxRadius && selectedCandidates.length < targetCount;
      radius += radiusStep
    ) {
      const candidates = collectZoneCandidates(draft, zoneSpec, zoneIndex, radius);
      selectedCandidates = chooseZonePlacements(zoneSpec, zoneIndex, candidates, placedMiningRocks);
    }
    if (selectedCandidates.length < targetCount) {
      const candidates = collectZoneCandidates(draft, zoneSpec, zoneIndex, zoneSpec.maxRadius);
      selectedCandidates = chooseZonePlacements(zoneSpec, zoneIndex, candidates, placedMiningRocks);
    }

    for (let i = 0; i < selectedCandidates.length && zonePlacements.length < targetCount; i++) {
      const candidate = selectedCandidates[i];
      const key = pointKey(candidate);
      if (placedKeys.has(key)) continue;

      const oreType = getWeightedOreType(zoneSpec.oreWeights, candidate.x, candidate.y);
      if (!oreType) continue;

      const placement: MiningRockPlacement = {
        placementId: `mining:${zoneSpec.routeId || zoneSpec.zoneId}:${zonePlacements.length + 1}`,
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
    }

    if (zonePlacements.length > 0) {
      const anchor = findRouteAnchor(zonePlacements, zoneSpec.centerX, zoneSpec.centerY);
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
