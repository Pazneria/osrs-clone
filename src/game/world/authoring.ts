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
  "ry"
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

function scaleAxis(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * WORLD_COORD_SCALE);
}

function scaleRadius(value: number): number {
  if (!Number.isFinite(value)) return value;
  const scaled = value * WORLD_COORD_SCALE;
  return Math.max(0.05, Number(scaled.toFixed(3)));
}

function cloneAndScaleValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneAndScaleValue(entry));
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
        output[key] = scaleAxis(fieldValue);
        return;
      }
      if (RADIUS_COORD_KEYS.has(key)) {
        output[key] = scaleRadius(fieldValue);
        return;
      }
      output[key] = fieldValue;
      return;
    }
    output[key] = cloneAndScaleValue(fieldValue);
  });
  return output;
}

function cloneAndScaleSpawn(spawn: Point3): Point3 {
  return {
    x: scaleAxis(spawn.x),
    y: scaleAxis(spawn.y),
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
  margin = 0
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
    x: scaleAxis(point.x),
    y: scaleAxis(point.y),
    z: point.z
  };
}

function remapPoint2WithStructureShift(
  bounds: StructureShiftBounds[],
  point: { x: number; y: number },
  z: number,
  margin = 0
): { x: number; y: number } {
  const shift = resolveStructureShift(bounds, point.x, point.y, z, margin);
  if (shift) {
    return {
      x: point.x + shift.dx,
      y: point.y + shift.dy
    };
  }
  return {
    x: scaleAxis(point.x),
    y: scaleAxis(point.y)
  };
}

function applyStructureLocalAlignment(
  rawDefinition: WorldDefinition,
  scaledDefinition: WorldDefinition
): WorldDefinition {
  const structureShiftBounds = buildStructureShiftBounds(rawDefinition, scaledDefinition);
  if (structureShiftBounds.length === 0) return scaledDefinition;

  scaledDefinition.npcSpawns = rawDefinition.npcSpawns.map((rawNpc, index) => {
    const scaledNpc = scaledDefinition.npcSpawns[index] || rawNpc;
    const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawNpc);
    return { ...scaledNpc, x: mapped.x, y: mapped.y, z: mapped.z };
  });

  scaledDefinition.services = rawDefinition.services.map((rawService, index) => {
    const scaledService = scaledDefinition.services[index] || rawService;
    const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawService);
    const mappedTravelSpawn = rawService.travelSpawn
      ? remapPoint3WithStructureShift(structureShiftBounds, rawService.travelSpawn)
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
    const mappedSpawnTile = remapPoint3WithStructureShift(structureShiftBounds, rawSpawn.spawnTile);
    const mappedHomeTile = rawSpawn.homeTileOverride
      ? remapPoint3WithStructureShift(structureShiftBounds, rawSpawn.homeTileOverride)
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
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawNode);
      return { ...scaledNode, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    woodcutting: rawDefinition.resourceNodes.woodcutting.map((rawNode, index) => {
      const scaledNode = scaledDefinition.resourceNodes.woodcutting[index] || rawNode;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawNode);
      return { ...scaledNode, x: mapped.x, y: mapped.y, z: mapped.z };
    })
  };

  scaledDefinition.skillRoutes = {
    fishing: rawDefinition.skillRoutes.fishing.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.fishing[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    cooking: rawDefinition.skillRoutes.cooking.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.cooking[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute);
      return {
        ...scaledRoute,
        x: mapped.x,
        y: mapped.y,
        z: mapped.z,
        fireTiles: rawRoute.fireTiles.map((tile) =>
          remapPoint2WithStructureShift(structureShiftBounds, tile, rawRoute.z)
        )
      };
    }),
    firemaking: rawDefinition.skillRoutes.firemaking.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.firemaking[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    mining: rawDefinition.skillRoutes.mining.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.mining[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    runecrafting: rawDefinition.skillRoutes.runecrafting.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.runecrafting[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute);
      return { ...scaledRoute, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    woodcutting: rawDefinition.skillRoutes.woodcutting.map((rawRoute, index) => {
      const scaledRoute = scaledDefinition.skillRoutes.woodcutting[index] || rawRoute;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoute);
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
          const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawTile, 1);
          return { ...scaledTile, x: mapped.x, y: mapped.y, z: mapped.z };
        })
      };
    }),
    doors: rawDefinition.landmarks.doors.map((rawDoor, index) => {
      const scaledDoor = scaledDefinition.landmarks.doors[index] || rawDoor;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawDoor, 1);
      return { ...scaledDoor, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    fences: (rawDefinition.landmarks.fences || []).map((rawFence, index) => {
      const scaledFence = (scaledDefinition.landmarks.fences || [])[index] || rawFence;
      return {
        ...scaledFence,
        points: rawFence.points.map((rawPoint) =>
          remapPoint2WithStructureShift(structureShiftBounds, rawPoint, rawFence.z, 1)
        )
      };
    }),
    roofs: (rawDefinition.landmarks.roofs || []).map((rawRoof, index) => {
      const scaledRoof = (scaledDefinition.landmarks.roofs || [])[index] || rawRoof;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawRoof, 1);
      const mappedHideBounds = rawRoof.hideBounds
        ? {
            xMin: scaleAxis(rawRoof.hideBounds.xMin),
            xMax: scaleAxis(rawRoof.hideBounds.xMax),
            yMin: scaleAxis(rawRoof.hideBounds.yMin),
            yMax: scaleAxis(rawRoof.hideBounds.yMax),
            z: rawRoof.hideBounds.z
          }
        : scaledRoof.hideBounds;
      return { ...scaledRoof, x: mapped.x, y: mapped.y, z: mapped.z, hideBounds: mappedHideBounds };
    }),
    altars: rawDefinition.landmarks.altars.map((rawAltar, index) => {
      const scaledAltar = scaledDefinition.landmarks.altars[index] || rawAltar;
      const mapped = remapPoint3WithStructureShift(structureShiftBounds, rawAltar);
      return { ...scaledAltar, x: mapped.x, y: mapped.y, z: mapped.z };
    }),
    showcaseTrees: rawDefinition.landmarks.showcaseTrees.map((rawTree, index) => {
      const scaledTree = scaledDefinition.landmarks.showcaseTrees[index] || rawTree;
      const mapped = remapPoint2WithStructureShift(structureShiftBounds, rawTree, 0);
      return { ...scaledTree, x: mapped.x, y: mapped.y };
    })
  };

  return scaledDefinition;
}

function buildScaledWorldDefinition(rawDefinition: WorldDefinition): WorldDefinition {
  const scaledDefinition = cloneAndScaleValue(rawDefinition) as WorldDefinition;
  return applyStructureLocalAlignment(rawDefinition, scaledDefinition);
}

const worldDefinitions: Record<string, WorldDefinition> = {
  [mainOverworld.worldId]: buildScaledWorldDefinition(mainOverworld as WorldDefinition),
  [tutorialIsland.worldId]: buildScaledWorldDefinition(tutorialIsland as WorldDefinition)
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
    defaultSpawn: cloneAndScaleSpawn(cloneSpawn(entry.defaultSpawn))
  };
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
    return cloneSpawn(findManifestEntry(worldId).defaultSpawn);
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
  return cloneAndScaleSpawn(worldRegistry.getDefaultSpawn(worldId));
}
