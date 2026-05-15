import {
  buildCombatStatsViewModel as buildCombatStatsFromFormulas,
  getSkillLevel
} from "../combat/formulas";
import type {
  CombatStyleOptionViewModel,
  CombatStatusTargetSnapshot,
  CombatStatusViewModel,
  CombatTabViewModel,
  CombatStatsViewModel,
  EquipmentSlotViewModel,
  PlayerProfileSummaryViewModel,
  SkillReferencePanelViewModel,
  SkillReferenceTierViewModel,
  SkillReferenceUnlockViewModel,
  SkillProgressViewModel,
  SkillTileDefinition,
  SkillTileViewModel,
  UiItemData,
  UiItemSlot
} from "../contracts/ui";
import type { MeleeStyleId } from "../contracts/combat";
import type { PlayerProfileState, PlayerSkillMap } from "../contracts/session";

type UiEquipmentEntry = UiItemData | UiItemSlot | null | undefined;

export function buildCombatStatsViewModel(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, UiEquipmentEntry>;
  inventory?: Array<{ itemData?: UiItemData | null; amount?: number } | UiItemData | null | undefined> | null;
  playerState?: {
    selectedMeleeStyle?: "attack" | "strength" | "defense";
  } | null;
}): CombatStatsViewModel {
  return buildCombatStatsFromFormulas({
    playerSkills: options.playerSkills || {},
    equipment: options.equipment || {},
    inventory: options.inventory || null,
    playerState: options.playerState || null
  });
}

const COMBAT_STYLE_OPTION_DEFS: Array<{ styleId: MeleeStyleId; label: string; description: string }> = [
  { styleId: "attack", label: "Attack", description: "+10% accuracy" },
  { styleId: "strength", label: "Strength", description: "+10% max hit" },
  { styleId: "defense", label: "Defense", description: "+10% defense" }
];

function normalizeMeleeStyleId(styleId: unknown): MeleeStyleId {
  if (styleId === "strength" || styleId === "defense") return styleId;
  return "attack";
}

function computeCombatLevel(playerSkills: PlayerSkillMap): number {
  const attackLevel = getSkillLevel(playerSkills, "attack", 1);
  const strengthLevel = getSkillLevel(playerSkills, "strength", 1);
  const defenseLevel = getSkillLevel(playerSkills, "defense", 1);
  const hitpointsLevel = getSkillLevel(playerSkills, "hitpoints", 10);
  return Math.max(1, Math.floor((attackLevel + strengthLevel + defenseLevel + hitpointsLevel) / 4));
}

export function buildCombatTabViewModel(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, UiEquipmentEntry>;
  inventory?: Array<{ itemData?: UiItemData | null; amount?: number } | UiItemData | null | undefined> | null;
  playerState?: {
    selectedMeleeStyle?: MeleeStyleId;
  } | null;
}): CombatTabViewModel {
  const playerSkills = options.playerSkills || {};
  const selectedStyleId = normalizeMeleeStyleId(options.playerState && options.playerState.selectedMeleeStyle);
  const combatStats = buildCombatStatsViewModel(options);
  const styleOptions: CombatStyleOptionViewModel[] = COMBAT_STYLE_OPTION_DEFS.map((entry) => ({
    styleId: entry.styleId,
    label: entry.label,
    description: entry.description,
    active: entry.styleId === selectedStyleId
  }));
  const selectedStyle = styleOptions.find((entry) => entry.active) || styleOptions[0];
  const attackLevel = getSkillLevel(playerSkills, "attack", 1);
  const strengthLevel = getSkillLevel(playerSkills, "strength", 1);
  const defenseLevel = getSkillLevel(playerSkills, "defense", 1);
  const hitpointsLevel = getSkillLevel(playerSkills, "hitpoints", 10);
  const combatLevel = computeCombatLevel(playerSkills);

  return {
    combatLevel,
    combatLevelText: String(combatLevel),
    combatLevelFormulaText: "(Attack + Strength + Defense + Hitpoints) / 4",
    selectedStyleId,
    selectedStyleLabel: selectedStyle ? selectedStyle.label : "Attack",
    selectedStyleDescription: selectedStyle ? selectedStyle.description : "+10% accuracy",
    attackLevel,
    strengthLevel,
    defenseLevel,
    hitpointsLevel,
    combatStats,
    styleOptions
  };
}

function clampPercent(current: number, maximum: number): string {
  const safeMaximum = Math.max(1, Math.floor(maximum));
  const safeCurrent = Math.max(0, Math.min(safeMaximum, Math.floor(current)));
  return `${((safeCurrent / safeMaximum) * 100).toFixed(1)}%`;
}

function formatTickLabel(ticks: number): string {
  const safeTicks = Number.isFinite(ticks) ? Math.max(0, Math.floor(ticks)) : 0;
  if (safeTicks <= 0) return "Ready";
  return `${safeTicks} tick${safeTicks === 1 ? "" : "s"} to swing`;
}

function formatEnemyStateLabel(state: string): string {
  const normalized = String(state || "").trim().toLowerCase();
  if (normalized === "aggroed") return "Attacking";
  if (normalized === "returning") return "Resetting";
  if (normalized === "idle") return "Idle";
  if (normalized === "dead") return "Defeated";
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeTargetSnapshot(target?: CombatStatusTargetSnapshot | null): CombatStatusTargetSnapshot | null {
  if (!target || typeof target !== "object") return null;

  const label = typeof target.label === "string" && target.label.trim() ? target.label.trim() : "Unknown enemy";
  const focusLabel = typeof target.focusLabel === "string" && target.focusLabel.trim() ? target.focusLabel.trim() : "Target";
  const maxHealth = Number.isFinite(target.maxHealth) ? Math.max(1, Math.floor(target.maxHealth)) : 1;
  const currentHealth = Number.isFinite(target.currentHealth)
    ? Math.max(0, Math.min(maxHealth, Math.floor(target.currentHealth)))
    : maxHealth;

  return {
    label,
    focusLabel,
    currentHealth,
    maxHealth,
    remainingAttackCooldown: Number.isFinite(target.remainingAttackCooldown)
      ? Math.max(0, Math.floor(target.remainingAttackCooldown))
      : 0,
    state: typeof target.state === "string" ? target.state : "",
    distance: Number.isFinite(target.distance) ? Math.max(0, Math.floor(Number(target.distance))) : null,
    inMeleeRange: !!target.inMeleeRange
  };
}

export function buildCombatStatusViewModel(options: {
  playerCurrentHitpoints?: number;
  playerMaxHitpoints?: number;
  playerRemainingAttackCooldown?: number;
  inCombat?: boolean;
  target?: CombatStatusTargetSnapshot | null;
}): CombatStatusViewModel {
  const playerMaxHitpoints = Number.isFinite(options.playerMaxHitpoints)
    ? Math.max(1, Math.floor(Number(options.playerMaxHitpoints)))
    : 10;
  const playerCurrentHitpoints = Number.isFinite(options.playerCurrentHitpoints)
    ? Math.max(0, Math.min(playerMaxHitpoints, Math.floor(Number(options.playerCurrentHitpoints))))
    : playerMaxHitpoints;
  const playerRemainingAttackCooldown = Number.isFinite(options.playerRemainingAttackCooldown)
    ? Math.max(0, Math.floor(Number(options.playerRemainingAttackCooldown)))
    : 0;
  const target = normalizeTargetSnapshot(options.target);
  const inCombat = !!options.inCombat;
  const combatActive = inCombat;

  let bannerText = "Combat Status";
  if (target && combatActive) bannerText = "In Combat";
  else if (combatActive) bannerText = "Combat Recovery";

  const visibleTarget = combatActive ? target : null;
  const rangeText = !visibleTarget
    ? "No target"
    : (visibleTarget.inMeleeRange
      ? "In melee range"
      : (visibleTarget.distance === null
        ? "Range unknown"
        : `${visibleTarget.distance} tile${visibleTarget.distance === 1 ? "" : "s"} away`));

  return {
    visible: combatActive,
    bannerText,
    playerHitpointsText: `${playerCurrentHitpoints} / ${playerMaxHitpoints}`,
    playerHitpointsWidth: clampPercent(playerCurrentHitpoints, playerMaxHitpoints),
    playerCooldownText: formatTickLabel(playerRemainingAttackCooldown),
    playerCooldownReady: playerRemainingAttackCooldown === 0,
    targetVisible: !!visibleTarget,
    targetName: visibleTarget ? visibleTarget.label : "No target",
    targetFocusLabel: visibleTarget ? visibleTarget.focusLabel || "Target" : "Target",
    targetHitpointsText: visibleTarget ? `${visibleTarget.currentHealth} / ${visibleTarget.maxHealth}` : "-- / --",
    targetHitpointsWidth: visibleTarget ? clampPercent(visibleTarget.currentHealth, visibleTarget.maxHealth) : "0%",
    targetStateText: visibleTarget ? formatEnemyStateLabel(visibleTarget.state) : "No target",
    targetCooldownText: visibleTarget ? formatTickLabel(visibleTarget.remainingAttackCooldown) : "Ready",
    targetCooldownReady: !visibleTarget || visibleTarget.remainingAttackCooldown === 0,
    rangeText
  };
}

export function buildEquipmentSlotViewModels(options: {
  slots: string[];
  equipment: Record<string, UiEquipmentEntry>;
}): EquipmentSlotViewModel[] {
  const viewModels: EquipmentSlotViewModel[] = [];
  const slots = Array.isArray(options.slots) ? options.slots : [];
  const equipment = options.equipment || {};

  for (let index = 0; index < slots.length; index += 1) {
    const slotName = slots[index];
    const entry = equipment[slotName] || null;
    const item = getEquipmentEntryItem(entry);
    viewModels.push({
      slotName,
      itemId: item && typeof item.id === "string" ? item.id : null,
      itemName: item && typeof item.name === "string" ? item.name : "",
      icon: item && typeof item.icon === "string" ? item.icon : "",
      amount: getEquipmentEntryAmount(entry),
      hasItem: !!item
    });
  }

  return viewModels;
}

function getEquipmentEntryItem(entry: UiEquipmentEntry): UiItemData | null {
  if (!entry || typeof entry !== "object") return null;
  const wrapped = (entry as { itemData?: unknown }).itemData;
  if (wrapped && typeof wrapped === "object") return wrapped as UiItemData;
  return entry as UiItemData;
}

function getEquipmentEntryAmount(entry: UiEquipmentEntry): number {
  if (!entry || typeof entry !== "object") return 0;
  const amount = Number((entry as { amount?: unknown }).amount);
  return Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
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
  const remainingXp = level >= maxSkillLevel ? 0 : Math.max(0, nextLevelXp - xp);

  return {
    skillId,
    name: options.skillMeta.displayName || skillId,
    icon: options.skillMeta.icon || "?",
    level,
    xpText: xp.toLocaleString(),
    remainingText: level >= maxSkillLevel ? "Maxed" : `${remainingXp.toLocaleString()} XP remaining`,
    nextText: level >= maxSkillLevel ? "Maxed" : `${nextLevelXp.toLocaleString()} XP`,
    progressPercentText: `${percent.toFixed(1)}% to next level`,
    progressWidth: `${percent.toFixed(1)}%`
  };
}

const SKILL_REFERENCE_RECIPE_UNLOCK_TYPE = "recipe";

const FISHING_METHOD_LABELS: Record<string, string> = {
  net: "Net fishing",
  rod: "Rod fishing",
  harpoon: "Harpoon fishing",
  deep_harpoon_mixed: "Deep-water harpoon (mixed)",
  deep_rune_harpoon: "Deep-water rune harpoon"
};

const COMBAT_SKILL_REFERENCE_MILESTONES: Record<string, Array<{ level: number; label: string }>> = {
  attack: [
    { level: 1, label: "Starter melee accuracy baseline" },
    { level: 10, label: "Early melee consistency bump" },
    { level: 20, label: "Mid-band melee accuracy bump" },
    { level: 30, label: "Advanced melee accuracy bump" },
    { level: 40, label: "High-band melee accuracy bump" }
  ],
  strength: [
    { level: 1, label: "Starter max-hit baseline" },
    { level: 10, label: "Early max-hit bump" },
    { level: 20, label: "Mid-band max-hit bump" },
    { level: 30, label: "Advanced max-hit bump" },
    { level: 40, label: "High-band max-hit bump" }
  ],
  defense: [
    { level: 1, label: "Starter mitigation baseline" },
    { level: 10, label: "Early defense scaling bump" },
    { level: 20, label: "Mid-band defense scaling bump" },
    { level: 30, label: "Advanced defense scaling bump" },
    { level: 40, label: "High-band defense scaling bump" }
  ],
  ranged: [
    { level: 1, label: "Starter bow accuracy baseline" },
    { level: 5, label: "Oak bow handling" },
    { level: 20, label: "Willow bow handling" },
    { level: 30, label: "Maple bow handling" },
    { level: 40, label: "Yew bow handling" }
  ],
  hitpoints: [
    { level: 10, label: "Starter health pool baseline" },
    { level: 20, label: "Early survivability bump" },
    { level: 30, label: "Mid-band survivability bump" },
    { level: 40, label: "Advanced survivability bump" }
  ]
};

interface SkillReferenceUnlockSeed {
  key: string;
  label: string;
  unlockType: string;
  requiredLevel: number;
  recipeId: string | null;
  recipe: Record<string, unknown> | null;
}

function formatSkillReferenceText(value: string): string {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveSkillReferenceItemName(itemId: string, resolver?: ((itemId: string) => string) | null): string {
  const normalizedItemId = typeof itemId === "string" ? itemId.trim() : "";
  if (!normalizedItemId) return "";
  if (typeof resolver === "function") {
    const resolved = resolver(normalizedItemId);
    if (typeof resolved === "string" && resolved.trim()) return resolved.trim();
  }
  return formatSkillReferenceText(normalizedItemId);
}

function addSkillReferenceUnlock(
  milestonesByLevel: Record<number, Map<string, SkillReferenceUnlockSeed>>,
  level: number,
  label: string,
  options: {
    unlockType?: string;
    key?: string;
    recipeId?: string | null;
    recipe?: Record<string, unknown> | null;
  } = {}
): void {
  const requiredLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const text = typeof label === "string" ? label.trim() : "";
  if (!text) return;
  if (!milestonesByLevel[requiredLevel]) milestonesByLevel[requiredLevel] = new Map();

  const unlockType = typeof options.unlockType === "string" && options.unlockType.trim()
    ? options.unlockType.trim()
    : "unlock";
  const rawKey = typeof options.key === "string" && options.key.trim()
    ? options.key.trim()
    : `${unlockType}:${text.toLowerCase()}`;
  const key = rawKey.toLowerCase();
  if (milestonesByLevel[requiredLevel].has(key)) return;

  milestonesByLevel[requiredLevel].set(key, {
    key,
    label: text,
    unlockType,
    requiredLevel,
    recipeId: typeof options.recipeId === "string" && options.recipeId.trim() ? options.recipeId.trim() : null,
    recipe: options.recipe && typeof options.recipe === "object" ? options.recipe : null
  });
}

function getSkillReferenceVerb(skillId: string): string {
  if (skillId === "woodcutting") return "Chop";
  if (skillId === "mining") return "Mine";
  if (skillId === "fishing") return "Catch";
  if (skillId === "firemaking") return "Burn";
  if (skillId === "cooking") return "Cook";
  if (skillId === "runecrafting") return "Craft";
  if (skillId === "smithing") return "Forge";
  if (skillId === "crafting") return "Craft";
  if (skillId === "fletching") return "Fletch";
  return "Unlock";
}

function collectSkillReferenceNodeUnlocks(
  skillId: string,
  nodeTable: Record<string, any>,
  milestonesByLevel: Record<number, Map<string, SkillReferenceUnlockSeed>>,
  resolveItemName?: ((itemId: string) => string) | null
): void {
  const nodeIds = Object.keys(nodeTable || {});
  for (let index = 0; index < nodeIds.length; index += 1) {
    const nodeId = nodeIds[index];
    const node = nodeTable[nodeId];
    if (!node || typeof node !== "object") continue;

    if (skillId === "fishing" && node.methods && typeof node.methods === "object") {
      if (Number.isFinite(node.unlockLevel)) {
        addSkillReferenceUnlock(milestonesByLevel, node.unlockLevel, `Access ${formatSkillReferenceText(nodeId)}`, {
          key: `node:${nodeId}:access`
        });
      }

      const methodIds = Object.keys(node.methods);
      for (let methodIndex = 0; methodIndex < methodIds.length; methodIndex += 1) {
        const methodId = methodIds[methodIndex];
        const method = node.methods[methodId];
        if (!method || typeof method !== "object") continue;
        const methodUnlockLevel = Number.isFinite(method.unlockLevel)
          ? method.unlockLevel
          : (Number.isFinite(node.unlockLevel) ? node.unlockLevel : 1);
        const methodLabel = FISHING_METHOD_LABELS[methodId] || formatSkillReferenceText(methodId);
        addSkillReferenceUnlock(milestonesByLevel, methodUnlockLevel, `Method: ${methodLabel}`, {
          key: `method:${methodId}`
        });

        const bands = Array.isArray(method.fishByLevel) ? method.fishByLevel : [];
        for (let bandIndex = 0; bandIndex < bands.length; bandIndex += 1) {
          const band = bands[bandIndex];
          if (!band || typeof band !== "object") continue;
          const fishRows = Array.isArray(band.fish) ? band.fish : [];
          for (let fishIndex = 0; fishIndex < fishRows.length; fishIndex += 1) {
            const fish = fishRows[fishIndex];
            if (!fish || typeof fish !== "object") continue;
            const fishLevel = Number.isFinite(fish.requiredLevel)
              ? fish.requiredLevel
              : (Number.isFinite(band.minLevel) ? band.minLevel : methodUnlockLevel);
            const fishName = resolveSkillReferenceItemName(fish.itemId, resolveItemName);
            addSkillReferenceUnlock(milestonesByLevel, fishLevel, `Catch ${fishName}`, {
              key: `fish:${fish.itemId}`
            });
          }
        }
      }
      continue;
    }

    const unlockLevel = Number.isFinite(node.requiredLevel)
      ? node.requiredLevel
      : (Number.isFinite(node.unlockLevel) ? node.unlockLevel : 1);
    if (typeof node.rewardItemId === "string" && node.rewardItemId) {
      const verb = getSkillReferenceVerb(skillId);
      addSkillReferenceUnlock(
        milestonesByLevel,
        unlockLevel,
        `${verb} ${resolveSkillReferenceItemName(node.rewardItemId, resolveItemName)}`,
        { key: `node:${nodeId}:reward` }
      );
      continue;
    }

    addSkillReferenceUnlock(milestonesByLevel, unlockLevel, `Unlock ${formatSkillReferenceText(nodeId)}`, {
      key: `node:${nodeId}`
    });
  }
}

function resolveSkillReferenceRecipeLabel(
  skillId: string,
  recipeId: string,
  recipe: Record<string, any>,
  resolveItemName?: ((itemId: string) => string) | null
): string {
  const verb = getSkillReferenceVerb(skillId);
  if (recipe.output && typeof recipe.output === "object" && typeof recipe.output.itemId === "string") {
    return `${verb} ${resolveSkillReferenceItemName(recipe.output.itemId, resolveItemName)}`;
  }
  if (typeof recipe.outputItemId === "string" && recipe.outputItemId) {
    if (skillId === "runecrafting" && typeof recipe.altarName === "string" && recipe.altarName.trim()) {
      return `Craft ${resolveSkillReferenceItemName(recipe.outputItemId, resolveItemName)} (${recipe.altarName.trim()})`;
    }
    return `${verb} ${resolveSkillReferenceItemName(recipe.outputItemId, resolveItemName)}`;
  }
  if (typeof recipe.cookedItemId === "string" && recipe.cookedItemId) {
    return `Cook ${resolveSkillReferenceItemName(recipe.cookedItemId, resolveItemName)}`;
  }
  if (skillId === "firemaking" && typeof recipe.sourceItemId === "string" && recipe.sourceItemId) {
    return `Burn ${resolveSkillReferenceItemName(recipe.sourceItemId, resolveItemName)}`;
  }
  if (typeof recipe.sourceItemId === "string" && recipe.sourceItemId) {
    return `${verb} ${resolveSkillReferenceItemName(recipe.sourceItemId, resolveItemName)}`;
  }
  if (recipeId) return `Unlock ${formatSkillReferenceText(recipeId)}`;
  return "";
}

function collectSkillReferenceRecipeUnlocks(
  skillId: string,
  recipeSet: Record<string, any>,
  milestonesByLevel: Record<number, Map<string, SkillReferenceUnlockSeed>>,
  resolveItemName?: ((itemId: string) => string) | null
): void {
  const recipeIds = Object.keys(recipeSet || {});
  for (let index = 0; index < recipeIds.length; index += 1) {
    const recipeId = recipeIds[index];
    const recipe = recipeSet[recipeId];
    if (!recipe || typeof recipe !== "object") continue;
    const requiredLevel = Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1;
    const label = resolveSkillReferenceRecipeLabel(skillId, recipeId, recipe, resolveItemName);
    addSkillReferenceUnlock(milestonesByLevel, requiredLevel, label, {
      unlockType: SKILL_REFERENCE_RECIPE_UNLOCK_TYPE,
      key: `recipe:${recipeId}`,
      recipeId,
      recipe
    });
  }
}

function collectSkillReferenceUnlocks(options: {
  skillId: string;
  skillSpec?: Record<string, any> | null;
  resolveItemName?: ((itemId: string) => string) | null;
}): Record<number, Map<string, SkillReferenceUnlockSeed>> {
  const milestonesByLevel: Record<number, Map<string, SkillReferenceUnlockSeed>> = {};
  const combatMilestones = COMBAT_SKILL_REFERENCE_MILESTONES[options.skillId];
  if (Array.isArray(combatMilestones) && combatMilestones.length > 0) {
    for (let index = 0; index < combatMilestones.length; index += 1) {
      const row = combatMilestones[index];
      addSkillReferenceUnlock(milestonesByLevel, row.level, row.label, {
        key: `combat:${options.skillId}:${row.level}`
      });
    }
    return milestonesByLevel;
  }

  const skillSpec = options.skillSpec && typeof options.skillSpec === "object" ? options.skillSpec : null;
  if (!skillSpec) return milestonesByLevel;

  if (skillSpec.nodeTable && typeof skillSpec.nodeTable === "object") {
    collectSkillReferenceNodeUnlocks(options.skillId, skillSpec.nodeTable, milestonesByLevel, options.resolveItemName);
  }
  if (skillSpec.recipeSet && typeof skillSpec.recipeSet === "object") {
    collectSkillReferenceRecipeUnlocks(options.skillId, skillSpec.recipeSet, milestonesByLevel, options.resolveItemName);
  }
  if (options.skillId === "runecrafting" && skillSpec.pouchTable && typeof skillSpec.pouchTable === "object") {
    const pouchIds = Object.keys(skillSpec.pouchTable);
    for (let index = 0; index < pouchIds.length; index += 1) {
      const pouchId = pouchIds[index];
      const pouch = skillSpec.pouchTable[pouchId];
      if (!pouch || typeof pouch !== "object") continue;
      const requiredLevel = Number.isFinite(pouch.requiredLevel) ? pouch.requiredLevel : 1;
      addSkillReferenceUnlock(milestonesByLevel, requiredLevel, `Use ${resolveSkillReferenceItemName(pouchId, options.resolveItemName)}`, {
        key: `pouch:${pouchId}`
      });
    }
  }

  return milestonesByLevel;
}

function normalizeLevelBandStarts(levelBands: unknown, fallbackBandStarts: number[]): number[] {
  const source = Array.isArray(levelBands) && levelBands.length > 0 ? levelBands : fallbackBandStarts;
  const deduped = new Set<number>();
  const normalized: number[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const rawLevel = Number(source[index]);
    if (!Number.isFinite(rawLevel)) continue;
    const level = Math.max(1, Math.floor(rawLevel));
    if (deduped.has(level)) continue;
    deduped.add(level);
    normalized.push(level);
  }

  if (!normalized.length) normalized.push(1);
  normalized.sort((a, b) => a - b);
  return normalized;
}

function buildSkillReferenceBandLabel(startLevel: number, endLevel: number | null): string {
  if (endLevel === null) return `Lv ${startLevel}+`;
  if (endLevel <= startLevel) return `Lv ${startLevel}`;
  return `Lv ${startLevel}-${endLevel}`;
}

function resolveSkillReferenceUnlockTypeLabel(unlock: SkillReferenceUnlockSeed): string {
  if (unlock.unlockType === SKILL_REFERENCE_RECIPE_UNLOCK_TYPE) return "Recipe Unlock";
  if (unlock.key.startsWith("node:")) return "Node Unlock";
  if (unlock.key.startsWith("method:")) return "Method Unlock";
  if (unlock.key.startsWith("fish:")) return "Catch Unlock";
  if (unlock.key.startsWith("pouch:")) return "Pouch Unlock";
  if (unlock.key.startsWith("combat:")) return "Combat Milestone";
  return "Unlock";
}

function toSkillReferenceUnlockViewModel(unlock: SkillReferenceUnlockSeed): SkillReferenceUnlockViewModel {
  return {
    key: unlock.key,
    label: unlock.label,
    unlockType: unlock.unlockType,
    unlockTypeLabel: resolveSkillReferenceUnlockTypeLabel(unlock),
    requiredLevel: unlock.requiredLevel,
    recipeId: unlock.recipeId,
    recipe: unlock.recipe
  };
}

function buildSkillReferenceEmptyStateText(
  status: SkillReferenceTierViewModel["status"],
  bandLabel: string,
  nextBandLabel: string | null
): string {
  if (status === "current" && nextBandLabel) {
    return `No new unlocks are authored inside ${bandLabel}; keep training toward ${nextBandLabel}.`;
  }
  if (status === "next") {
    return `No unlocks are currently recorded in ${bandLabel}.`;
  }
  return `No new unlocks are tracked in ${bandLabel}.`;
}

function buildSkillReferenceTierViewModels(options: {
  bandStarts: number[];
  milestonesByLevel: Record<number, Map<string, SkillReferenceUnlockSeed>>;
  currentLevel: number;
}): SkillReferenceTierViewModel[] {
  const nextBandStart = options.bandStarts.find((bandStart) => bandStart > options.currentLevel) ?? null;
  const tiers: SkillReferenceTierViewModel[] = [];

  for (let index = 0; index < options.bandStarts.length; index += 1) {
    const startLevel = options.bandStarts[index];
    const nextStartLevel = options.bandStarts[index + 1];
    const endLevel = Number.isFinite(nextStartLevel) ? Math.max(startLevel, nextStartLevel - 1) : null;
    const bandLabel = buildSkillReferenceBandLabel(startLevel, endLevel);
    const unlocks: SkillReferenceUnlockViewModel[] = [];

    const levelKeys = Object.keys(options.milestonesByLevel);
    for (let levelIndex = 0; levelIndex < levelKeys.length; levelIndex += 1) {
      const requiredLevel = Number(levelKeys[levelIndex]);
      if (!Number.isFinite(requiredLevel)) continue;
      if (requiredLevel < startLevel) continue;
      if (endLevel !== null && requiredLevel > endLevel) continue;

      const levelUnlocks = Array.from(options.milestonesByLevel[requiredLevel].values())
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(toSkillReferenceUnlockViewModel);
      for (let unlockIndex = 0; unlockIndex < levelUnlocks.length; unlockIndex += 1) {
        unlocks.push(levelUnlocks[unlockIndex]);
      }
    }

    unlocks.sort((a, b) => {
      if (a.requiredLevel !== b.requiredLevel) return a.requiredLevel - b.requiredLevel;
      return a.label.localeCompare(b.label);
    });

    let status: SkillReferenceTierViewModel["status"] = "locked";
    if (options.currentLevel >= startLevel && (endLevel === null || options.currentLevel <= endLevel)) status = "current";
    else if (endLevel !== null && options.currentLevel > endLevel) status = "unlocked";
    else if (nextBandStart !== null && startLevel === nextBandStart) status = "next";

    tiers.push({
      tierIndex: index,
      bandLabel,
      startLevel,
      endLevel,
      status,
      unlockCount: unlocks.length,
      emptyStateText: buildSkillReferenceEmptyStateText(
        status,
        bandLabel,
        Number.isFinite(nextStartLevel) ? buildSkillReferenceBandLabel(nextStartLevel, (options.bandStarts[index + 2] || 0) > 0 ? options.bandStarts[index + 2] - 1 : null) : null
      ),
      unlocks
    });
  }

  return tiers;
}

export function buildSkillReferencePanelViewModel(options: {
  skillId: string;
  playerSkills: PlayerSkillMap;
  skillSpec?: Record<string, unknown> | null;
  resolveItemName?: (itemId: string) => string;
}): SkillReferencePanelViewModel | null {
  const skillId = typeof options.skillId === "string" ? options.skillId.trim() : "";
  if (!skillId) return null;

  const currentLevel = getSkillLevel(options.playerSkills, skillId, skillId === "hitpoints" ? 10 : 1);
  const skillSpec = options.skillSpec && typeof options.skillSpec === "object"
    ? options.skillSpec as Record<string, any>
    : null;
  const fallbackBandStarts = Array.isArray(COMBAT_SKILL_REFERENCE_MILESTONES[skillId])
    ? COMBAT_SKILL_REFERENCE_MILESTONES[skillId].map((entry) => entry.level)
    : [];
  const milestonesByLevel = collectSkillReferenceUnlocks({
    skillId,
    skillSpec,
    resolveItemName: options.resolveItemName
  });
  const milestoneLevels = Object.keys(milestonesByLevel)
    .map((levelKey) => Number(levelKey))
    .filter((level) => Number.isFinite(level))
    .sort((a, b) => a - b);
  const bandStarts = normalizeLevelBandStarts(
    skillSpec ? skillSpec.levelBands : null,
    milestoneLevels.length ? milestoneLevels : fallbackBandStarts
  );
  const tiers = buildSkillReferenceTierViewModels({
    bandStarts,
    milestonesByLevel,
    currentLevel
  });
  if (!tiers.length) return null;

  const currentTier = tiers.find((tier) => tier.status === "current") || tiers[0];
  const nextTier = tiers.find((tier) => tier.status === "next") || null;

  let nextUnlockText = "No further authored unlocks are tracked.";
  outer:
  for (let tierIndex = 0; tierIndex < tiers.length; tierIndex += 1) {
    const tier = tiers[tierIndex];
    for (let unlockIndex = 0; unlockIndex < tier.unlocks.length; unlockIndex += 1) {
      const unlock = tier.unlocks[unlockIndex];
      if (unlock.requiredLevel <= currentLevel) continue;
      nextUnlockText = `Lv ${unlock.requiredLevel}: ${unlock.label}`;
      break outer;
    }
  }

  if (nextUnlockText === "No further authored unlocks are tracked." && nextTier) {
    nextUnlockText = `Next band: ${nextTier.bandLabel}`;
  }

  return {
    skillId,
    currentLevel,
    currentBandLabel: currentTier.bandLabel,
    nextBandLabel: nextTier ? nextTier.bandLabel : null,
    nextUnlockText,
    tierCount: tiers.length,
    tiers
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
    lastStartedAt: null,
    tutorialStep: 0,
    tutorialCompletedAt: null
  };
  const playerEntryFlow = options.playerEntryFlow || {};
  const hasLoadedSave = !!playerEntryFlow.hasLoadedSave;
  const saveWasLegacyProfile = !!playerEntryFlow.saveWasLegacyProfile;
  const loadReason = typeof playerEntryFlow.loadReason === "string" ? playerEntryFlow.loadReason : "";
  const savedAt = Number.isFinite(playerEntryFlow.savedAt) ? Number(playerEntryFlow.savedAt) : null;
  const isContinueFlow = hasLoadedSave && !!profile.creationCompleted;

  let subtitleText = "Choose a starter identity before you arrive on the mainland.";
  if (loadReason === "parse_failed" || loadReason === "invalid_payload") {
    subtitleText = "Previous save data could not be read, so this run starts from fresh defaults.";
  } else if (saveWasLegacyProfile) {
    subtitleText = "A legacy save was detected. Tune the starter profile and continue without losing your progress.";
  } else if (isContinueFlow) {
    subtitleText = "Saved progress is loaded. You can tweak the profile here before stepping back into the world.";
  }

  let noteText = "Progress will begin autosaving locally in this browser once you arrive.";
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
