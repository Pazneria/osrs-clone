import type { WorldDefinition, WorldLegacyView } from "../contracts/world";

export function createLegacyTerrainView(
  definition: WorldDefinition,
  stampMap: Record<string, string[]>
): Pick<
  WorldLegacyView,
  | "lakeDefs"
  | "castleFrontPond"
  | "deepWaterCenter"
  | "pier"
  | "smithingHallApproach"
  | "castleRouteAnchor"
  | "woodcuttingRouteAnchor"
  | "stampedStructures"
  | "stampMap"
  | "staircases"
  | "doors"
  | "fences"
  | "roofs"
  | "showcaseTrees"
> {
  return {
    lakeDefs: definition.terrainPatches.lakes.slice(),
    castleFrontPond: { ...definition.terrainPatches.castleFrontPond },
    deepWaterCenter: { ...definition.terrainPatches.deepWaterCenter },
    pier: { ...definition.terrainPatches.pier },
    smithingHallApproach: { ...definition.terrainPatches.smithingHallApproach },
    castleRouteAnchor: { ...definition.terrainPatches.castleRouteAnchor },
    woodcuttingRouteAnchor: { ...definition.terrainPatches.woodcuttingRouteAnchor },
    stampedStructures: definition.structures.map((structure) => ({ ...structure })),
    stampMap,
    staircases: definition.landmarks.staircases.map((landmark) => ({
      landmarkId: landmark.landmarkId,
      tiles: landmark.tiles.map((tile) => ({ ...tile }))
    })),
    doors: definition.landmarks.doors.map((door) => ({ ...door })),
    fences: (definition.landmarks.fences || []).map((fence) => ({
      ...fence,
      points: Array.isArray(fence.points) ? fence.points.map((point) => ({ ...point })) : []
    })),
    roofs: (definition.landmarks.roofs || []).map((roof) => ({
      ...roof,
      hideBounds: roof.hideBounds ? { ...roof.hideBounds } : undefined
    })),
    showcaseTrees: definition.landmarks.showcaseTrees.map((tree) => ({ ...tree }))
  };
}
