import { buildCombatStatsViewModel as buildCombatStatsFromFormulas } from "../combat/formulas";
import type {
  CombatStatsViewModel,
  EquipmentSlotViewModel,
  PlayerProfileSummaryViewModel,
  SkillProgressViewModel,
  SkillTileDefinition,
  SkillTileViewModel,
  UiItemData
} from "../contracts/ui";
import type { PlayerProfileState, PlayerSkillMap } from "../contracts/session";

export function buildCombatStatsViewModel(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, UiItemData | null | undefined>;
  playerState?: {
    selectedMeleeStyle?: "attack" | "strength" | "defense";
  } | null;
}): CombatStatsViewModel {
  return buildCombatStatsFromFormulas({
    playerSkills: options.playerSkills || {},
    equipment: options.equipment || {},
    playerState: options.playerState || null
  });
}

export function buildEquipmentSlotViewModels(options: {
  slots: string[];
  equipment: Record<string, UiItemData | null | undefined>;
}): EquipmentSlotViewModel[] {
  const viewModels: EquipmentSlotViewModel[] = [];
  const slots = Array.isArray(options.slots) ? options.slots : [];
  const equipment = options.equipment || {};

  for (let index = 0; index < slots.length; index += 1) {
    const slotName = slots[index];
    const item = equipment[slotName] || null;
    viewModels.push({
      slotName,
      itemId: item && typeof item.id === "string" ? item.id : null,
      itemName: item && typeof item.name === "string" ? item.name : "",
      icon: item && typeof item.icon === "string" ? item.icon : "",
      hasItem: !!item
    });
  }

  return viewModels;
}

export function buildSkillTileViewModels(options: {
  definitions: SkillTileDefinition[];
  playerSkills: PlayerSkillMap;
}): SkillTileViewModel[] {
  const definitions = Array.isArray(options.definitions) ? options.definitions : [];
  const playerSkills = options.playerSkills || {};
  const viewModels: SkillTileViewModel[] = [];

  for (let index = 0; index < definitions.length; index += 1) {
    const definition = definitions[index];
    if (!definition || !definition.skillId || !definition.levelKey) continue;
    const skillEntry = playerSkills[definition.skillId];
    const level = skillEntry && Number.isFinite(skillEntry.level)
      ? Math.max(1, Math.floor(skillEntry.level))
      : 1;
    viewModels.push({
      skillId: definition.skillId,
      displayName: definition.displayName || definition.skillId,
      icon: definition.icon || definition.skillId.slice(0, 3).toUpperCase(),
      levelKey: definition.levelKey,
      level
    });
  }

  return viewModels;
}

export function buildSkillProgressViewModel(options: {
  skillId: string;
  playerSkills: PlayerSkillMap;
  skillMeta: { displayName?: string; icon?: string };
  getXpForLevel: (level: number) => number;
  maxSkillLevel: number;
}): SkillProgressViewModel | null {
  const skillId = options.skillId;
  const skill = skillId ? options.playerSkills[skillId] : null;
  if (!skill) return null;

  const level = Number.isFinite(skill.level) ? Math.max(1, Math.floor(skill.level)) : 1;
  const xp = Number.isFinite(skill.xp) ? Math.max(0, Math.floor(skill.xp)) : 0;
  const maxSkillLevel = Number.isFinite(options.maxSkillLevel) ? Math.max(1, Math.floor(options.maxSkillLevel)) : 99;
  const levelXp = options.getXpForLevel(level);
  const nextLevel = Math.min(maxSkillLevel, level + 1);
  const nextLevelXp = level >= maxSkillLevel ? levelXp : options.getXpForLevel(nextLevel);
  const span = Math.max(1, nextLevelXp - levelXp);
  const gained = Math.max(0, xp - levelXp);
  const percent = level >= maxSkillLevel ? 100 : Math.max(0, Math.min(100, (gained / span) * 100));

  return {
    skillId,
    name: options.skillMeta.displayName || skillId,
    icon: options.skillMeta.icon || "?",
    level,
    xpText: xp.toLocaleString(),
    nextText: level >= maxSkillLevel ? "Maxed" : `${nextLevelXp.toLocaleString()} XP`,
    progressPercentText: `${percent.toFixed(1)}% to next level`,
    progressWidth: `${percent.toFixed(1)}%`
  };
}

export function buildPlayerProfileSummaryViewModel(options: {
  profile: PlayerProfileState;
  playerEntryFlow: {
    hasLoadedSave?: boolean;
    saveWasLegacyProfile?: boolean;
    loadReason?: string;
    savedAt?: number | null;
  };
  playerAppearance: { gender?: number } | null;
  formatTimestamp: (timestamp: number) => string;
}): PlayerProfileSummaryViewModel {
  const profile = options.profile || {
    name: "",
    creationCompleted: false,
    createdAt: null,
    lastStartedAt: null
  };
  const playerEntryFlow = options.playerEntryFlow || {};
  const hasLoadedSave = !!playerEntryFlow.hasLoadedSave;
  const saveWasLegacyProfile = !!playerEntryFlow.saveWasLegacyProfile;
  const loadReason = typeof playerEntryFlow.loadReason === "string" ? playerEntryFlow.loadReason : "";
  const savedAt = Number.isFinite(playerEntryFlow.savedAt) ? Number(playerEntryFlow.savedAt) : null;
  const isContinueFlow = hasLoadedSave && !!profile.creationCompleted;

  let subtitleText = "Choose a starter identity before the prototype lets you into the world.";
  if (loadReason === "parse_failed" || loadReason === "invalid_payload") {
    subtitleText = "Previous save data could not be read, so this run starts from fresh defaults.";
  } else if (saveWasLegacyProfile) {
    subtitleText = "A legacy save was detected. Tune the starter profile and continue without losing your progress.";
  } else if (isContinueFlow) {
    subtitleText = "Saved progress is loaded. You can tweak the profile here before stepping back into the world.";
  }

  let noteText = "Progress will begin autosaving locally in this browser once you enter the world.";
  if (saveWasLegacyProfile) {
    noteText = "Legacy save note: the old save had no character profile, so a starter profile was generated from your existing progress.";
  } else if (hasLoadedSave && savedAt !== null) {
    noteText = `Progress loaded from ${options.formatTimestamp(savedAt)}.`;
  }

  let statusText = "Fresh character profile";
  if (hasLoadedSave && savedAt !== null) {
    statusText = `Last save: ${options.formatTimestamp(savedAt)}`;
  } else if (Number.isFinite(profile.createdAt)) {
    statusText = `Created: ${options.formatTimestamp(Number(profile.createdAt))}`;
  }

  return {
    name: typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : "Unnamed Adventurer",
    bodyTypeLabel: options.playerAppearance && options.playerAppearance.gender === 1 ? "Female" : "Male",
    statusText,
    isContinueFlow,
    titleText: isContinueFlow ? "Continue Your Adventure" : "Create Your Adventurer",
    subtitleText,
    primaryActionText: isContinueFlow ? "Continue Adventure" : "Start Adventure",
    noteText
  };
}
