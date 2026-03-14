import type {
  Point3,
  WorldDefinition,
  WorldManifest,
  WorldManifestEntry,
  WorldRegistry,
  WorldStamp
} from "../contracts/world";

import worldManifestJson from "../../../content/world/manifest.json";
import castleFloor0 from "../../../content/world/stamps/castle_floor0.json";
import castleFloor1 from "../../../content/world/stamps/castle_floor1.json";
import generalStore from "../../../content/world/stamps/general_store.json";
import roadOutpost from "../../../content/world/stamps/road_outpost.json";
import smithingHall from "../../../content/world/stamps/smithing_hall.json";
import northRoadCamp from "../../../content/world/regions/north_road_camp.json";
import starterTown from "../../../content/world/regions/starter_town.json";

const allStamps: Record<string, WorldStamp> = {
  [castleFloor0.stampId]: castleFloor0,
  [castleFloor1.stampId]: castleFloor1,
  [generalStore.stampId]: generalStore,
  [roadOutpost.stampId]: roadOutpost,
  [smithingHall.stampId]: smithingHall
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

const worldDefinitions: Record<string, WorldDefinition> = {
  [northRoadCamp.worldId]: cloneAndScaleValue(northRoadCamp as WorldDefinition) as WorldDefinition,
  [starterTown.worldId]: cloneAndScaleValue(starterTown as WorldDefinition) as WorldDefinition
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
  const normalizedWorldId = String(worldId || "").trim();
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
