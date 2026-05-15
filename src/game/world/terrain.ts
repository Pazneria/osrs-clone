import type { WorldDefinition, WorldLegacyView } from "../contracts/world";

export function createLegacyTerrainView(
  definition: WorldDefinition,
  stampMap: Record<string, string[]>
): Pick<
  WorldLegacyView,
  | "lakeDefs"
  | "islandWater"
  | "castleFrontPond"
  | "deepWaterCenter"
  | "pier"
  | "pathPatches"
  | "landformPatches"
  | "smithingHallApproach"
  | "castleRouteAnchor"
  | "woodcuttingRouteAnchor"
  | "stampedStructures"
  | "stampMap"
  | "staircases"
  | "doors"
  | "fences"
  | "roofs"
  | "caveOpenings"
  | "decorProps"
  | "showcaseTrees"
> {
  return {
    lakeDefs: definition.terrainPatches.lakes.slice(),
    islandWater: definition.terrainPatches.islandWater
      ? {
          ...definition.terrainPatches.islandWater,
          waterBounds: { ...definition.terrainPatches.islandWater.waterBounds },
          landPolygon: Array.isArray(definition.terrainPatches.islandWater.landPolygon)
            ? definition.terrainPatches.islandWater.landPolygon.map((point) => ({ ...point }))
            : []
        }
      : undefined,
    castleFrontPond: { ...definition.terrainPatches.castleFrontPond },
    deepWaterCenter: { ...definition.terrainPatches.deepWaterCenter },
    pier: { ...definition.terrainPatches.pier },
    pathPatches: Array.isArray(definition.terrainPatches.paths)
      ? definition.terrainPatches.paths.map((pathPatch) => ({
          ...pathPatch,
          points: Array.isArray(pathPatch.points) ? pathPatch.points.map((point) => ({ ...point })) : [],
          tags: Array.isArray(pathPatch.tags) ? pathPatch.tags.slice() : []
        }))
      : [],
    landformPatches: Array.isArray(definition.terrainPatches.landforms)
      ? definition.terrainPatches.landforms.map((landformPatch) => ({
          ...landformPatch,
          points: Array.isArray(landformPatch.points) ? landformPatch.points.map((point) => ({ ...point })) : undefined,
          tags: Array.isArray(landformPatch.tags) ? landformPatch.tags.slice() : []
        }))
      : [],
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
    caveOpenings: (definition.landmarks.caveOpenings || []).map((opening) => ({
      ...opening,
      tags: Array.isArray(opening.tags) ? opening.tags.slice() : []
    })),
    decorProps: (definition.landmarks.decorProps || []).map((prop) => ({
      ...prop,
      tags: Array.isArray(prop.tags) ? prop.tags.slice() : []
    })),
    showcaseTrees: definition.landmarks.showcaseTrees.map((tree) => ({ ...tree }))
  };
}
