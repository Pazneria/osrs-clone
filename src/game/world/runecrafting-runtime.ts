import type {
  LegacyAltarRenderPlacement,
  LegacyNpcRenderPlacement,
  LegacyWorldRuntimeDraft,
  NpcDescriptor,
  Point3,
  RouteDescriptor,
  ServiceDescriptor
} from "../contracts/world";

export interface RunecraftingRuntimeResult {
  runecraftingRoutes: RouteDescriptor[];
  altarRenderPlacements: LegacyAltarRenderPlacement[];
  altarByRouteId: Record<string, { x: number; y: number; z: number }>;
  runtimeMerchantServices: ServiceDescriptor[];
  merchantNpcDescriptors: NpcDescriptor[];
  merchantNpcRenderPlacements: LegacyNpcRenderPlacement[];
}

const FALLBACK_BAND_EXPANSION = 28;

function cloneRoute(route: RouteDescriptor): RouteDescriptor {
  return {
    ...route,
    tags: Array.isArray(route.tags) ? route.tags.slice() : []
  };
}

function cloneMerchantNpc(entry: LegacyNpcRenderPlacement): LegacyNpcRenderPlacement {
  return {
    ...entry,
    tags: Array.isArray(entry.tags) ? entry.tags.slice() : []
  };
}

function distanceFromAnchor(candidate: Point3, anchor: { x: number; y: number }): number {
  return Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y);
}

function sortCandidatesByBandPreference(
  candidates: Point3[],
  targetDistance: number,
  anchor: { x: number; y: number }
): Point3[] {
  return candidates.sort((a, b) => {
    const distanceDelta =
      Math.abs(distanceFromAnchor(a, anchor) - targetDistance) -
      Math.abs(distanceFromAnchor(b, anchor) - targetDistance);
    if (distanceDelta !== 0) return distanceDelta;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
}

function isRunecraftingMerchantWalkable(draft: LegacyWorldRuntimeDraft, x: number, y: number, z: number): boolean {
  if (x <= 1 || y <= 1 || x >= draft.mapSize - 2 || y >= draft.mapSize - 2) return false;
  const row = draft.logicalMap[z]?.[y];
  if (!row) return false;
  const tile = row[x];
  return tile === draft.tileIds.GRASS
    || tile === draft.tileIds.SHORE
    || tile === draft.tileIds.FLOOR_WOOD
    || tile === draft.tileIds.FLOOR_STONE
    || tile === draft.tileIds.FLOOR_BRICK
    || tile === draft.tileIds.STAIRS_RAMP
    || tile === draft.tileIds.DOOR_OPEN;
}

function findMerchantSpotNearAltar(
  draft: LegacyWorldRuntimeDraft,
  anchor: Point3,
  occupiedNpcs: LegacyNpcRenderPlacement[]
): Point3 | null {
  const maxRadius = 10;
  for (let radius = 2; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const x = anchor.x + dx;
        const y = anchor.y + dy;
        if (!isRunecraftingMerchantWalkable(draft, x, y, anchor.z)) continue;
        const occupied = occupiedNpcs.some((npc) => npc.z === anchor.z && npc.x === x && npc.y === y);
        if (occupied) continue;
        return { x, y, z: anchor.z };
      }
    }
  }
  return null;
}

export function materializeRunecraftingRuntime(
  draft: LegacyWorldRuntimeDraft,
  runeEssenceRocks: Point3[]
): RunecraftingRuntimeResult {
  const altarRenderPlacements: LegacyAltarRenderPlacement[] = [];
  const altarByRouteId: Record<string, { x: number; y: number; z: number }> = {};
  const runecraftingRoutes: RouteDescriptor[] = [];
  const runtimeMerchantServices: ServiceDescriptor[] = [];
  const merchantNpcDescriptors: NpcDescriptor[] = [];
  const merchantNpcRenderPlacements: LegacyNpcRenderPlacement[] = [];
  const occupiedNpcs = draft.staticMerchantRenderPlacements.map(cloneMerchantNpc);
  const castleRouteAnchor = draft.authored.castleRouteAnchor;
  const deterministicCandidates = draft.deterministicFeatureCandidates.slice();

  const isCandidateNearRuneEssence = (candidate: Point3): boolean =>
    runeEssenceRocks.some((rock) => Math.hypot(rock.x - candidate.x, rock.y - candidate.y) < 20);

  const isCandidateNearExistingAltars = (candidate: Point3): boolean =>
    altarRenderPlacements.some((altar) => Math.hypot(altar.x - candidate.x, altar.y - candidate.y) < 28);

  const canPlaceAltarCandidate = (candidate: Point3): boolean => {
    const tile = draft.logicalMap[candidate.z]?.[candidate.y]?.[candidate.x];
    if (tile !== draft.tileIds.GRASS) return false;
    if (isCandidateNearRuneEssence(candidate)) return false;
    if (isCandidateNearExistingAltars(candidate)) return false;
    return true;
  };

  const chooseBandCandidate = (
    bandSpec: LegacyWorldRuntimeDraft["authored"]["runecraftingBands"][number]
  ): Point3 | null => {
    const targetDistance = (bandSpec.minDistance + bandSpec.maxDistance) * 0.5;
    let minDistance = bandSpec.minDistance;
    let maxDistance = bandSpec.maxDistance;

    for (let attempt = 0; attempt < 4; attempt++) {
      const inBand = deterministicCandidates.filter((candidate) => {
        if (!canPlaceAltarCandidate(candidate)) return false;
        const dist = distanceFromAnchor(candidate, castleRouteAnchor);
        return dist >= minDistance && dist <= maxDistance;
      });
      if (inBand.length > 0) {
        return sortCandidatesByBandPreference(inBand, targetDistance, castleRouteAnchor)[0] || null;
      }

      minDistance = Math.max(12, minDistance - FALLBACK_BAND_EXPANSION);
      maxDistance = maxDistance + FALLBACK_BAND_EXPANSION;
    }

    const anyEligible = deterministicCandidates.filter((candidate) => canPlaceAltarCandidate(candidate));
    if (anyEligible.length === 0) return null;
    return sortCandidatesByBandPreference(anyEligible, targetDistance, castleRouteAnchor)[0] || null;
  };

  const bands = draft.authored.runecraftingBands;
  for (let i = 0; i < bands.length; i++) {
    const bandSpec = bands[i];
    const placed = chooseBandCandidate(bandSpec);
    if (!placed) continue;

    const altar: LegacyAltarRenderPlacement = {
      x: placed.x,
      y: placed.y,
      z: placed.z,
      variant: bandSpec.variant,
      label: bandSpec.label,
      routeId: bandSpec.routeId,
      alias: bandSpec.alias || null,
      tags: Array.isArray(bandSpec.tags) ? bandSpec.tags.slice() : []
    };
    altarRenderPlacements.push(altar);
    if (altar.routeId) {
      altarByRouteId[altar.routeId] = { x: altar.x, y: altar.y, z: altar.z };
    }

    for (let by = placed.y - 1; by <= placed.y + 2; by++) {
      if (by < 0 || by >= draft.mapSize) continue;
      for (let bx = placed.x - 1; bx <= placed.x + 2; bx++) {
        if (bx < 0 || bx >= draft.mapSize) continue;
        draft.writers.setTile(bx, by, placed.z, draft.tileIds.OBSTACLE);
      }
    }
  }

  const altarOrder = draft.authored.runecraftingAltarOrder;
  for (let i = 0; i < altarOrder.length; i++) {
    const label = altarOrder[i];
    const altar = altarRenderPlacements.find((entry) => entry.label === label);
    if (!altar) continue;
    runecraftingRoutes.push(cloneRoute({
      routeId: altar.routeId || label.toLowerCase().replace(/\s+/g, "_"),
      alias: altar.alias || null,
      label: altar.label,
      x: altar.x,
      y: altar.y,
      z: altar.z,
      tags: Array.isArray(altar.tags) ? altar.tags.slice() : []
    }));
  }

  const merchantSpawns = draft.authored.runecraftingMerchants;
  for (let i = 0; i < merchantSpawns.length; i++) {
    const spawn = merchantSpawns[i];
    const anchor = altarRenderPlacements.find((altar) => altar.routeId === spawn.anchorRouteId);
    if (!anchor) continue;
    const spot = findMerchantSpotNearAltar(draft, anchor, occupiedNpcs);
    if (!spot) continue;
    const appearanceId = typeof spawn.appearanceId === "string" ? spawn.appearanceId.trim().toLowerCase() || null : null;
    const dialogueId = typeof spawn.dialogueId === "string" ? spawn.dialogueId.trim() || null : null;

    draft.writers.setTile(spot.x, spot.y, spot.z, draft.tileIds.SOLID_NPC);

    const merchantRenderPlacement: LegacyNpcRenderPlacement = {
      type: Number.isFinite(spawn.npcType) ? spawn.npcType : 3,
      x: spot.x,
      y: spot.y,
      z: spot.z,
      name: spawn.name,
      merchantId: spawn.merchantId,
      ...(appearanceId ? { appearanceId } : {}),
      ...(dialogueId ? { dialogueId } : {}),
      action: spawn.action || "Trade",
      tags: Array.isArray(spawn.tags) ? spawn.tags.slice() : []
    };
    const merchantDescriptor: NpcDescriptor = {
      spawnId: "npc:" + String(spawn.merchantId || spawn.name || i).toLowerCase(),
      name: spawn.name,
      npcType: Number.isFinite(spawn.npcType) ? spawn.npcType : 3,
      x: spot.x,
      y: spot.y,
      z: spot.z,
      merchantId: spawn.merchantId,
      ...(appearanceId ? { appearanceId } : {}),
      ...(dialogueId ? { dialogueId } : {}),
      action: spawn.action || "Trade",
      tags: Array.isArray(spawn.tags) ? spawn.tags.slice() : []
    };
    const merchantService: ServiceDescriptor = {
      serviceId: spawn.serviceId,
      spawnId: spawn.spawnId,
      type: spawn.type,
      interactionTarget: spawn.interactionTarget,
      merchantId: spawn.merchantId,
      name: spawn.name,
      npcType: Number.isFinite(spawn.npcType) ? spawn.npcType : 3,
      x: spot.x,
      y: spot.y,
      z: spot.z,
      action: spawn.action || "Trade",
      ...(appearanceId ? { appearanceId } : {}),
      ...(dialogueId ? { dialogueId } : {}),
      tags: Array.isArray(spawn.tags) ? spawn.tags.slice() : []
    };

    occupiedNpcs.push(cloneMerchantNpc(merchantRenderPlacement));
    merchantNpcRenderPlacements.push(merchantRenderPlacement);
    merchantNpcDescriptors.push(merchantDescriptor);
    runtimeMerchantServices.push(merchantService);
  }

  return {
    runecraftingRoutes,
    altarRenderPlacements,
    altarByRouteId,
    runtimeMerchantServices,
    merchantNpcDescriptors,
    merchantNpcRenderPlacements
  };
}
