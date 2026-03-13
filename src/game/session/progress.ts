import type {
  ContentGrantState,
  GameSessionProgressState,
  PlayerProfileState,
  PlayerSkillMap,
  SaveAppearanceState
} from "../contracts/session";

export const DEFAULT_EQUIPMENT_SLOTS = [
  "head",
  "cape",
  "neck",
  "weapon",
  "body",
  "shield",
  "legs",
  "hands",
  "feet",
  "ring"
] as const;

export function createDefaultPlayerProfileState(): PlayerProfileState {
  return {
    name: "",
    creationCompleted: false,
    createdAt: null,
    lastStartedAt: null
  };
}

export function createDefaultPlayerSkillsState(): PlayerSkillMap {
  return {
    attack: { xp: 0, level: 1 },
    hitpoints: { xp: 1154, level: 10 },
    mining: { xp: 0, level: 1 },
    strength: { xp: 0, level: 1 },
    defense: { xp: 0, level: 1 },
    woodcutting: { xp: 0, level: 1 },
    firemaking: { xp: 0, level: 1 },
    fishing: { xp: 0, level: 1 },
    cooking: { xp: 0, level: 1 },
    crafting: { xp: 0, level: 1 },
    fletching: { xp: 0, level: 1 },
    runecrafting: { xp: 0, level: 1 },
    smithing: { xp: 0, level: 1 }
  };
}

export function createDefaultEquipmentState(): Record<string, unknown> {
  const equipment: Record<string, unknown> = {};
  for (let i = 0; i < DEFAULT_EQUIPMENT_SLOTS.length; i++) {
    equipment[DEFAULT_EQUIPMENT_SLOTS[i]] = null;
  }
  return equipment;
}

export function clonePlayerProfileState(profile: PlayerProfileState): PlayerProfileState {
  return {
    name: profile.name,
    creationCompleted: !!profile.creationCompleted,
    createdAt: Number.isFinite(profile.createdAt) ? Number(profile.createdAt) : null,
    lastStartedAt: Number.isFinite(profile.lastStartedAt) ? Number(profile.lastStartedAt) : null
  };
}

export function clonePlayerSkillsState(playerSkills: PlayerSkillMap): PlayerSkillMap {
  const cloned: PlayerSkillMap = {};
  const skillIds = Object.keys(playerSkills || {});
  for (let i = 0; i < skillIds.length; i++) {
    const skillId = skillIds[i];
    const entry = playerSkills[skillId];
    if (!entry) continue;
    cloned[skillId] = {
      xp: Number.isFinite(entry.xp) ? Math.floor(entry.xp) : 0,
      level: Number.isFinite(entry.level) ? Math.floor(entry.level) : 1
    };
  }
  return cloned;
}

export function cloneContentGrantState(contentGrants: ContentGrantState): ContentGrantState {
  const cloned: ContentGrantState = {};
  const grantIds = Object.keys(contentGrants || {});
  for (let i = 0; i < grantIds.length; i++) {
    const grantId = grantIds[i];
    const row = contentGrants[grantId];
    if (!row) continue;
    cloned[grantId] = { ...row };
  }
  return cloned;
}

export function cloneAppearanceState(appearance: SaveAppearanceState | null): SaveAppearanceState | null {
  if (!appearance) return null;
  return {
    gender: appearance.gender === 1 ? 1 : 0,
    colors: Array.isArray(appearance.colors) ? appearance.colors.slice(0, 5) : [0, 0, 0, 0, 0]
  };
}

export function createDefaultProgressState(options: {
  inventorySize: number;
  bankSize: number;
}): GameSessionProgressState {
  return {
    profile: createDefaultPlayerProfileState(),
    playerSkills: createDefaultPlayerSkillsState(),
    inventory: Array(options.inventorySize).fill(null),
    bankItems: Array(options.bankSize).fill(null),
    equipment: createDefaultEquipmentState(),
    userItemPrefs: {},
    contentGrants: {},
    appearance: null
  };
}
