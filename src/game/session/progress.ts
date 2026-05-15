import type {
  ContentGrantState,
  GameSessionProgressState,
  PlayerProfileState,
  PlayerSkillMap,
  QuestProgressState,
  SaveAppearanceState
} from "../contracts/session";

const DEFAULT_EQUIPMENT_SLOTS = [
  "head",
  "cape",
  "neck",
  "weapon",
  "body",
  "shield",
  "legs",
  "hands",
  "feet",
  "ring",
  "ammo"
] as const;

function sanitizeTutorialInstructorVisits(visits: unknown): Record<string, boolean> {
  const restored: Record<string, boolean> = {};
  if (!visits || typeof visits !== "object") return restored;
  const input = visits as Record<string, unknown>;
  const keys = Object.keys(input);
  for (let i = 0; i < keys.length; i++) {
    const rawStep = Number(keys[i]);
    if (!Number.isFinite(rawStep) || input[keys[i]] !== true) continue;
    restored[String(Math.max(0, Math.floor(rawStep)))] = true;
  }
  return restored;
}

export function createDefaultPlayerProfileState(): PlayerProfileState {
  return {
    name: "",
    creationCompleted: false,
    createdAt: null,
    lastStartedAt: null,
    tutorialStep: 0,
    tutorialCompletedAt: null,
    tutorialBankDepositSource: null,
    tutorialBankWithdrawSource: null,
    tutorialInstructorVisits: {}
  };
}

export function createDefaultPlayerSkillsState(): PlayerSkillMap {
  return {
    attack: { xp: 0, level: 1 },
    hitpoints: { xp: 1154, level: 10 },
    mining: { xp: 0, level: 1 },
    strength: { xp: 0, level: 1 },
    defense: { xp: 0, level: 1 },
    ranged: { xp: 0, level: 1 },
    magic: { xp: 0, level: 1 },
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

function createDefaultEquipmentState(): Record<string, unknown> {
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
    lastStartedAt: Number.isFinite(profile.lastStartedAt) ? Number(profile.lastStartedAt) : null,
    tutorialStep: Number.isFinite(profile.tutorialStep) ? Math.max(0, Math.floor(profile.tutorialStep)) : 0,
    tutorialCompletedAt: Number.isFinite(profile.tutorialCompletedAt) ? Number(profile.tutorialCompletedAt) : null,
    tutorialBankDepositSource: typeof profile.tutorialBankDepositSource === "string" ? profile.tutorialBankDepositSource : null,
    tutorialBankWithdrawSource: typeof profile.tutorialBankWithdrawSource === "string" ? profile.tutorialBankWithdrawSource : null,
    tutorialInstructorVisits: sanitizeTutorialInstructorVisits(profile.tutorialInstructorVisits)
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

export function cloneQuestProgressState(quests: QuestProgressState): QuestProgressState {
  const cloned: QuestProgressState = {};
  const questIds = Object.keys(quests || {});
  for (let i = 0; i < questIds.length; i++) {
    const questId = questIds[i];
    const entry = quests[questId];
    if (!entry) continue;

    const objectiveStates: Record<string, { current: number; target: number; completed: boolean } | undefined> = {};
    const objectiveIds = Object.keys(entry.objectiveStates || {});
    for (let j = 0; j < objectiveIds.length; j++) {
      const objectiveId = objectiveIds[j];
      const objective = entry.objectiveStates[objectiveId];
      if (!objective) continue;
      objectiveStates[objectiveId] = {
        current: Number.isFinite(objective.current) ? Math.max(0, Math.floor(objective.current)) : 0,
        target: Number.isFinite(objective.target) ? Math.max(0, Math.floor(objective.target)) : 0,
        completed: !!objective.completed
      };
    }

    cloned[questId] = {
      status: entry.status,
      startedAt: typeof entry.startedAt === "number" && Number.isFinite(entry.startedAt) ? Math.floor(entry.startedAt) : null,
      updatedAt: typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? Math.floor(entry.updatedAt) : null,
      completedAt: typeof entry.completedAt === "number" && Number.isFinite(entry.completedAt) ? Math.floor(entry.completedAt) : null,
      activeStepId: typeof entry.activeStepId === "string" ? entry.activeStepId : null,
      objectiveStates,
      flags: { ...(entry.flags || {}) }
    };
  }
  return cloned;
}

export function cloneAppearanceState(appearance: SaveAppearanceState | null): SaveAppearanceState | null {
  if (!appearance) return null;
  const creatorSelections: Record<string, string> = {};
  const selectionSource = appearance.creatorSelections && typeof appearance.creatorSelections === "object"
    ? appearance.creatorSelections
    : {};
  for (const [slotId, optionId] of Object.entries(selectionSource)) {
    if (typeof slotId === "string" && slotId && typeof optionId === "string" && optionId) {
      creatorSelections[slotId] = optionId;
    }
  }
  return {
    gender: appearance.gender === 1 ? 1 : 0,
    colors: Array.isArray(appearance.colors) ? appearance.colors.slice(0, 5) : [0, 0, 0, 0, 0],
    creatorSelections
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
    quests: {},
    appearance: null
  };
}
