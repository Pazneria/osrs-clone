import type {
  Point3,
  WorldDefinition,
  WorldManifest,
  WorldManifestEntry,
  WorldRegistry,
  WorldStamp
} from "../contracts/world";
import { canonicalizeWorldId } from "./ids";

import worldManifestJson from "../../../content/world/manifest.json";
import castleFloor0 from "../../../content/world/stamps/castle_floor0.json";
import castleFloor1 from "../../../content/world/stamps/castle_floor1.json";
import generalStore from "../../../content/world/stamps/general_store.json";
import roadOutpost from "../../../content/world/stamps/road_outpost.json";
import smithingHall from "../../../content/world/stamps/smithing_hall.json";
import timberCottage from "../../../content/world/stamps/timber_cottage.json";
import timberHut from "../../../content/world/stamps/timber_hut.json";
import timberLonghouse from "../../../content/world/stamps/timber_longhouse.json";
import timberShack from "../../../content/world/stamps/timber_shack.json";
import timberWorkshop from "../../../content/world/stamps/timber_workshop.json";
import tutorialStartCabin from "../../../content/world/stamps/tutorial_start_cabin.json";
import mainOverworld from "../../../content/world/regions/main_overworld.json";
import tutorialIsland from "../../../content/world/regions/tutorial_island.json";

const allStamps: Record<string, WorldStamp> = {
  [castleFloor0.stampId]: castleFloor0,
  [castleFloor1.stampId]: castleFloor1,
  [generalStore.stampId]: generalStore,
  [roadOutpost.stampId]: roadOutpost,
  [smithingHall.stampId]: smithingHall,
  [timberCottage.stampId]: timberCottage,
  [timberHut.stampId]: timberHut,
  [timberLonghouse.stampId]: timberLonghouse,
  [timberShack.stampId]: timberShack,
  [timberWorkshop.stampId]: timberWorkshop,
  [tutorialStartCabin.stampId]: tutorialStartCabin
};

const manifest = worldManifestJson as WorldManifest;
const LEGACY_WORLD_MAP_SIZE = 486;
const EXPANDED_WORLD_MAP_SIZE = 648;
const WORLD_COORD_SCALE = EXPANDED_WORLD_MAP_SIZE / LEGACY_WORLD_MAP_SIZE;
const TUTORIAL_ISLAND_WORLD_SCALE = 0.8;
const LEGACY_WORLD_CENTER = LEGACY_WORLD_MAP_SIZE / 2;
const EXPANDED_WORLD_CENTER = EXPANDED_WORLD_MAP_SIZE / 2;

const AXIS_COORD_KEYS = new Set([
  "x",
  "y",
  "cx",
  "cy",
  "xMin",
  "xMax",
  "yMin",
  "yMax",
  "centerX",
  "centerY",
  "shoreX",
  "stairX",
  "yStart",
  "yEnd",
  "entryY"
]);

const RADIUS_COORD_KEYS = new Set([
  "rx",
  "ry",
  "shoreWidth",
  "shallowDistance",
  "pathWidth",
  "edgeSoftness"
]);

interface StructureShiftBounds {
  z: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  dx: number;
  dy: number;
}

interface WorldScaleTransform {
  axisScale: number;
  centered: boolean;
}

const DEFAULT_WORLD_SCALE_TRANSFORM: WorldScaleTransform = Object.freeze({
  axisScale: WORLD_COORD_SCALE,
  centered: false
});

function createWorldScaleTransform(worldId: string): WorldScaleTransform {
  if (worldId === tutorialIsland.worldId) {
    return {
      axisScale: WORLD_COORD_SCALE * TUTORIAL_ISLAND_WORLD_SCALE,
      centered: true
    };
  }
  return DEFAULT_WORLD_SCALE_TRANSFORM;
}

function scaleAxis(value: number, transform: WorldScaleTransform = DEFAULT_WORLD_SCALE_TRANSFORM): number {
  if (!Number.isFinite(value)) return value;
  if (transform.centered) {
    return Math.round(EXPANDED_WORLD_CENTER + ((value - LEGACY_WORLD_CENTER) * transform.axisScale));
  }
  return Math.round(value * transform.axisScale);
}

function scaleRadius(value: number, transform: WorldScaleTransform = DEFAULT_WORLD_SCALE_TRANSFORM): number {
  if (!Number.isFinite(value)) return value;
  const scaled = value * transform.axisScale;
  return Math.max(0.05, Number(scaled.toFixed(3)));
}

function cloneAndScaleValue(value: unknown, transform: WorldScaleTransform = DEFAULT_WORLD_SCALE_TRANSFORM): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneAndScaleValue(entry, transform));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  Object.keys(input).forEach((key) => {
    const fieldValue = input[key];
    if (typeof fieldValue === "number") {
      if (AXIS_COORD_KEYS.has(key)) {
        output[key] = scaleAxis(fieldValue, transform);
        return;
      }
      if (RADIUS_COORD_KEYS.has(key)) {
        output[key] = scaleRadius(fieldValue, transform);
        return;
      }
      output[key] = fieldValue;
      return;
    }
    output[key] = cloneAndScaleValue(fieldValue, transform);
  });
  return output;
}

function cloneAndScaleSpawn(spawn: Point3, transform: WorldScaleTransform = DEFAULT_WORLD_SCALE_TRANSFORM): Point3 {
  return {
    x: scaleAxis(spawn.x, transform),
    y: scaleAxis(spawn.y, transform),
    z: spawn.z
  };
}

function getStampDimensions(stampId: string): { width: number; height: number } {
  const rows = Array.isArray(allStamps[stampId]?.rows) ? allStamps[stampId].rows : [];
  const height = rows.length;
  let width = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (typeof row !== "string") continue;
    width = Math.max(width, row.length);
  }
  return { width, height };
}

function buildStructureShiftBounds(rawDefinition: WorldDefinition, scaledDefinition: WorldDefinition): StructureShiftBounds[] {
  const scaledById = new Map<string, WorldDefinition["structures"][number]>();
  for (let i = 0; i < scaledDefinition.structures.length; i++) {
    const structure = scaledDefinition.structures[i];
    if (!structure) continue;
    scaledById.set(`${structure.structureId}:${structure.z}`, structure);
  }

  const bounds: StructureShiftBounds[] = [];
  for (let i = 0; i < rawDefinition.structures.length; i++) {
    const rawStructure = rawDefinition.structures[i];
    if (!rawStructure) continue;
    const scaledStructure = scaledById.get(`${rawStructure.structureId}:${rawStructure.z}`);
    if (!scaledStructure) continue;
    const { width, height } = getStampDimensions(rawStructure.stampId);
    if (width <= 0 || height <= 0) continue;
    bounds.push({
      z: rawStructure.z,
      xMin: rawStructure.x,
      xMax: rawStructure.x + width - 1,
      yMin: rawStructure.y,
      yMax: rawStructure.y + height - 1,
      dx: scaledStructure.x - rawStructure.x,
      dy: scaledStructure.y - rawStructure.y
    });
  }

  return bounds;
}

function resolveStructureShift(
  bounds: StructureShiftBounds[],
  x: number,
  y: number,
  z: number,
  margin = 0
): StructureShiftBounds | null {
  for (let i = 0; i < bounds.length; i++) {
    const row = bounds[i];
    if (!row || row.z !== z) continue;
    if (x < (row.xMin - margin) || x > (row.xMax + margin) || y < (row.yMin - margin) || y > (row.yMax + margin)) continue;
    return row;
  }
  return null;
}

function remapPoint3WithStructureShift(
  bounds: StructureShiftBounds[],
  point: { x: number; y: number; z: number },
  margin = 0,
  transform: WorldScaleTransform = DEFAULT_WORLD_SCALE_TRANSFORM
): { x: number; y: number; z: number } {
  const shift = resolveStructureShift(bounds, point.x, point.y, point.z, margin);
  if (shift) {
    return {
      x: point.x + shift.dx,
      y: point.y + shift.dy,
      z: point.z
    };
  }
  return {
    x: scaleAxis(point.x, transform),
    y: scaleAxis(point.y, transform),
    z: point.z
  };
}

function remapPoint2WithStructureShift(
  bounds: StructureShiftBounds[],
  point: { x: number; y: number },
  z: number,
  margin = 0,
  transform: WorldScaleTransform = DEFAULT_WORLD_SCALE_TRANSFORM
): { x: number; y: number } {
  const shift = resolveStructureShift(bounds, point.x, point.y, z, margin);
  if (shift) {
    return {
      x: point.x + shift.dx,
      y: point.y + shift.dy
    };
  }
  return {
    x: scaleAxis(point.x, transform),
    y: scaleAxis(point.y, transform)
  };
}

function applyStructureLocalAlignment(
  rawDefinition: WorldDefinition,
  scaledDefinition: WorldDefinition,
  transform: WorldScaleTransform = DEFAULT_WORLD_SCALE_TRANSFORM
): WorldDefinition {
  const structureShiftBounds = buildStructureShiftBounds(rawDefinition, scaledDefinition);
  if (structureShiftBounds.length === 0) return scaledDefinition;

  scaledDefinition.npcSpawns = rawDefinition.npcSpawns.map((rawNpc, index) => {
    const scaledNpc = scaledDefinition.npcSpawns[index] || rawNpc;
    const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawNpc, 0, transform);
    return { ...scaledNpc, x: mapped.x, y: mapped.y, z: mapped.z };
  });

  scaledDefinition.services = rawDefinition.services.map((rawService, index) => {
    const scaledService = scaledDefinition.services[index] || rawService;
    const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawService, 0, transform);
    const mappedTravelSpawn = rawService.travelSpawn
      ? remapPoint3WithStructureShift(structureShiftBounds, rawService.travelSpawn, 0, transform)
      : scaledService.travelSpawn;
    return {
      ...scaledService,
      x: mapped.x,
      y: mapped.y,
      z: mapped.z,
      travelSpawn: mappedTravelSpawn || null
    };
  });

  const rawCombatSpawns = Array.isArray(rawDefinition.combatSpawns) ? rawDefinition.combatSpawns : [];
  const scaledCombatSpawns = Array.isArray(scaledDefinition.combatSpawns) ? scaledDefinition.combatSpawns : [];
  scaledDefinition.combatSpawns = rawCombatSpawns.map((rawSpawn, index) => {
    const scaledSpawn = scaledCombatSpawns[index] || rawSpawn;
    const mappedSpawnTile = remapPoint3WithStructureShift(structureShiftBounds, rawSpawn.spawnTile, 0, transform);
    const mappedHomeTile = rawSpawn.homeTileOverride
      ? remapPoint3WithStructureShift(structureShiftBounds, rawSpawn.homeTileOverride, 0, transform)
      : scaledSpawn.homeTileOverride;
    return {
      ...scaledSpawn,
      spawnTile: mappedSpawnTile,
      homeTileOverride: mappedHomeTile || null
    };
  });

  scaledDefinition.resourceNodes = {
    mining: rawDefinition.resourceNodes.mining.map((rawNode, index) => {
      const scaledNode = scaledDefinition.resourceNodes.mining[index] || rawNode;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawNode, 0, transform);
      return { ...scaledNode, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    woodcutting: rawDefinition.resourceNodes.woodcutting.map((rawNode, index) => {
      const scaledNode = scaledDefinition.resourceNodes.woodcutting[index] || rawNode;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawNode, 0, transform);
      return { ...scaledNode, x: mapped.x, y: mapped.y, z: mapped.z };
    })
  };

  scaledDefinition.skillRoutes = {
    fishing: rawDefinition.skillRoutes.fishing.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.fishing[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute, 0, transform);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    cooking: rawDefinition.skillRoutes.cooking.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.cooking[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute, 0, transform);
      return {
        ...scaledRoute,
        x: mapped.x,
        y: mapped.y,
        z: mapped.z,
        fireTiles: rawRoute.fireTiles.map((tile) =>
          remapPoint2WithStructureShift(structureShiftBounds, tile, rawRoute.z, 0, transform)
        )
      };
    }),
    firemaking: rawDefinition.skillRoutes.firemaking.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.firemaking[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute, 0, transform);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    mining: rawDefinition.skillRoutes.mining.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.mining[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute, 0, transform);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    runecrafting: rawDefinition.skillRoutes.runecrafting.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.runecrafting[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute, 0, transform);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    woodcutting: rawDefinition.skillRoutes.woodcutting.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.woodcutting[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute, 0, transform);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    })
  };

  scaledDefinition.landmarks = {
    staircases: rawDefinition.landmarks.staircases.map((rawStaircase, staircaseIndex) => {
      const scaledStaircase = scaledDefinition.landmarks.staircases[staircaseIndex] || rawStaircase;
      return {
        ...scaledStaircase,
        tiles: rawStaircase.tiles.map((rawTile, tileIndex) => {
          const scaledTile = scaledStaircase.tiles[tileIndex] || rawTile;
          const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawTile, 1, transform);
          return { ...scaledTile, x: mapped.x, y: mapped.y, z: mapped.z };
        })
      };
    }),
    doors: rawDefinition.landmarks.doors.map((rawDoor, index) => {
      const scaledDoor = scaledDefinition.landmarks.doors[index] || rawDoor;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawDoor, 1, transform);
      return { ...scaledDoor, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    fences: (rawDefinition.landmarks.fences || []).map((rawFence, index) => {
      const scaledFence = (scaledDefinition.landmarks.fences || [])[index] || rawFence;
      return {
        ...scaledFence,
        points: rawFence.points.map((rawPoint) =>
          remapPoint2WithStructureShift(structureShiftBounds, rawPoint, rawFence.z, 1, transform)
        )
      };
    }),
    roofs: (rawDefinition.landmarks.roofs || []).map((rawRoof, index) => {
      const scaledRoof = (scaledDefinition.landmarks.roofs || [])[index] || rawRoof;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoof, 1, transform);
      const mappedHideBounds = rawRoof.hideBounds
        ? {
            xMin: scaleAxis(rawRoof.hideBounds.xMin, transform),
            xMax: scaleAxis(rawRoof.hideBounds.xMax, transform),
            yMin: scaleAxis(rawRoof.hideBounds.yMin, transform),
            yMax: scaleAxis(rawRoof.hideBounds.yMax, transform),
            z: rawRoof.hideBounds.z
          }
        : scaledRoof.hideBounds;
      return { ...scaledRoof, x: mapped.x, y: mapped.y, z: mapped.z, hideBounds: mappedHideBounds };
    }),
    caveOpenings: (rawDefinition.landmarks.caveOpenings || []).map((rawOpening, index) => {
      const scaledOpening = (scaledDefinition.landmarks.caveOpenings || [])[index] || rawOpening;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawOpening, 1, transform);
      return {
        ...scaledOpening,
        x: mapped.x,
        y: mapped.y,
        z: mapped.z,
        tags: Array.isArray(rawOpening.tags) ? rawOpening.tags.slice() : []
      };
    }),
    decorProps: (rawDefinition.landmarks.decorProps || []).map((rawProp, index) => {
      const scaledProp = (scaledDefinition.landmarks.decorProps || [])[index] || rawProp;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawProp, 1, transform);
      return {
        ...scaledProp,
        x: mapped.x,
        y: mapped.y,
        z: mapped.z,
        tags: Array.isArray(rawProp.tags) ? rawProp.tags.slice() : []
      };
    }),
    altars: rawDefinition.landmarks.altars.map((rawAltar, index) => {
      const scaledAltar = scaledDefinition.landmarks.altars[index] || rawAltar;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawAltar, 0, transform);
      return { ...scaledAltar, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    showcaseTrees: rawDefinition.landmarks.showcaseTrees.map((rawTree, index) => {
      const scaledTree = scaledDefinition.landmarks.showcaseTrees[index] || rawTree;
      const mapped = remapPoint2WithStructureShift(structureShiftBounds, rawTree, 0, 0, transform);
      return { ...scaledTree, x: mapped.x, y: mapped.y };
    })
  };

  return scaledDefinition;
}

function applyTutorialFullSeaCoverage(scaledDefinition: WorldDefinition): WorldDefinition {
  if (scaledDefinition.worldId !== tutorialIsland.worldId) return scaledDefinition;

  const fullMapBounds = {
    xMin: 0,
    xMax: EXPANDED_WORLD_MAP_SIZE,
    yMin: 0,
    yMax: EXPANDED_WORLD_MAP_SIZE
  };
  if (scaledDefinition.terrainPatches && scaledDefinition.terrainPatches.islandWater) {
    scaledDefinition.terrainPatches.islandWater = {
      ...scaledDefinition.terrainPatches.islandWater,
      waterBounds: { ...fullMapBounds }
    };
  }
  scaledDefinition.waterBodies = (scaledDefinition.waterBodies || []).map((body) => {
    if (!body || body.id !== "tutorial_surrounding_sea" || !body.shape || body.shape.kind !== "box") return body;
    return {
      ...body,
      shape: {
        ...body.shape,
        ...fullMapBounds
      }
    };
  });

  return scaledDefinition;
}

function buildScaledWorldDefinition(rawDefinition: WorldDefinition): WorldDefinition {
  const transform = createWorldScaleTransform(rawDefinition.worldId);
  const scaledDefinition = cloneAndScaleValue(rawDefinition, transform) as WorldDefinition;
  return applyTutorialFullSeaCoverage(applyStructureLocalAlignment(rawDefinition, scaledDefinition, transform));
}

const rawWorldDefinitions: Record<string, WorldDefinition> = {
  [mainOverworld.worldId]: mainOverworld as WorldDefinition,
  [tutorialIsland.worldId]: tutorialIsland as WorldDefinition
};

const worldDefinitions: Record<string, WorldDefinition> = {
  [mainOverworld.worldId]: buildScaledWorldDefinition(rawWorldDefinitions[mainOverworld.worldId]),
  [tutorialIsland.worldId]: buildScaledWorldDefinition(rawWorldDefinitions[tutorialIsland.worldId])
};

function cloneSpawn(spawn: Point3): Point3 {
  return { x: spawn.x, y: spawn.y, z: spawn.z };
}

function cloneManifestEntry(entry: WorldManifestEntry): WorldManifestEntry {
  return {
    worldId: entry.worldId,
    label: entry.label,
    regionFile: entry.regionFile,
    stampIds: Array.isArray(entry.stampIds) ? entry.stampIds.slice() : [],
    defaultSpawn: resolveScaledDefaultSpawn(entry)
  };
}

function resolveScaledDefaultSpawn(entry: WorldManifestEntry): Point3 {
  const rawDefinition = rawWorldDefinitions[entry.worldId];
  const scaledDefinition = worldDefinitions[entry.worldId];
  if (entry.worldId === "tutorial_island" && rawDefinition && scaledDefinition) {
    const structureShiftBounds = buildStructureShiftBounds(rawDefinition, scaledDefinition);
    return remapPoint3WithStructureShift(
      structureShiftBounds,
      entry.defaultSpawn,
      0,
      createWorldScaleTransform(entry.worldId)
    );
  }
  return cloneAndScaleSpawn(cloneSpawn(entry.defaultSpawn), createWorldScaleTransform(entry.worldId));
}

function findManifestEntry(worldId: string): WorldManifestEntry {
  const normalizedWorldId = canonicalizeWorldId(worldId);
  const entry = manifest.worlds.find((row) => row.worldId === normalizedWorldId);
  if (!entry) throw new Error(`Unknown worldId: ${normalizedWorldId}`);
  return entry;
}

function cloneManifest(): WorldManifest {
  return {
    version: manifest.version,
    worlds: manifest.worlds.map(cloneManifestEntry)
  };
}

function getStampedSubset(entry: WorldManifestEntry): Record<string, WorldStamp> {
  const stamps: Record<string, WorldStamp> = {};
  const stampIds = Array.isArray(entry.stampIds) ? entry.stampIds : [];
  for (let i = 0; i < stampIds.length; i++) {
    const stampId = stampIds[i];
    if (!allStamps[stampId]) throw new Error(`Unknown stampId ${stampId} for world ${entry.worldId}`);
    stamps[stampId] = allStamps[stampId];
  }
  return stamps;
}

export const worldRegistry: WorldRegistry = {
  get manifest(): WorldManifest {
    return cloneManifest();
  },
  listWorldIds(): string[] {
    return manifest.worlds.map((entry) => entry.worldId);
  },
  getManifestEntry(worldId: string): WorldManifestEntry {
    return cloneManifestEntry(findManifestEntry(worldId));
  },
  getWorldDefinition(worldId: string): WorldDefinition {
    const entry = findManifestEntry(worldId);
    const definition = worldDefinitions[entry.worldId];
    if (!definition) throw new Error(`Missing world definition for ${entry.worldId}`);
    return definition;
  },
  getWorldStamps(worldId: string): Record<string, WorldStamp> {
    return getStampedSubset(findManifestEntry(worldId));
  },
  getDefaultSpawn(worldId: string): Point3 {
    return resolveScaledDefaultSpawn(findManifestEntry(worldId));
  }
};

export function getWorldManifest(): WorldManifest {
  return worldRegistry.manifest;
}

export function listWorldIds(): string[] {
  return worldRegistry.listWorldIds();
}

export function getWorldManifestEntry(worldId: string): WorldManifestEntry {
  return worldRegistry.getManifestEntry(worldId);
}

export function getWorldDefinition(worldId: string): WorldDefinition {
  return worldRegistry.getWorldDefinition(worldId);
}

export function getWorldStamps(worldId: string): Record<string, WorldStamp> {
  return worldRegistry.getWorldStamps(worldId);
}

export function getDefaultSpawn(worldId: string): Point3 {
  return worldRegistry.getDefaultSpawn(worldId);
}
