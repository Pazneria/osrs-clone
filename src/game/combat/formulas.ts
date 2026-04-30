import type {
  CombatItemProfile,
  CombatStatsViewModelShape,
  EnemyDropEntry,
  EnemyRuntimeState,
  EnemyTypeDefinition,
  MeleeStyleId
} from "../contracts/combat";
import type { PlayerCombatStateShape } from "../contracts/combat";
import type { PlayerSkillMap } from "../contracts/session";

interface EquipmentCarrier {
  combat?: CombatItemProfile;
  [key: string]: unknown;
}

interface PlayerCombatSnapshot {
  styleId: MeleeStyleId;
  canAttack: boolean;
  attackValue: number;
  defenseValue: number;
  maxHit: number;
  attackRange: number;
  attackTickCycle: number;
  accuracyBonus: number;
  strengthBonus: number;
  defenseBonus: number;
}

interface EnemyCombatSnapshot {
  attackValue: number;
  defenseValue: number;
  maxHit: number;
  attackRange: number;
  attackTickCycle: number;
}

function clampFloor(value: unknown, minimum: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(minimum, Math.floor(numeric));
}

function sumCombatBonuses(equipment: Record<string, EquipmentCarrier | null | undefined>) {
  let meleeAccuracyBonus = 0;
  let meleeStrengthBonus = 0;
  let meleeDefenseBonus = 0;
  let rangedDefenseBonus = 0;
  let magicDefenseBonus = 0;
  let weaponCombat: CombatItemProfile | null = null;

  const slotNames = Object.keys(equipment || {});
  for (let index = 0; index < slotNames.length; index += 1) {
    const item = equipment[slotNames[index]];
    if (!item || typeof item !== "object" || !item.combat) continue;
    const combat = item.combat;
    meleeAccuracyBonus += clampFloor(combat.bonuses.meleeAccuracyBonus, 0, 0);
    meleeStrengthBonus += clampFloor(combat.bonuses.meleeStrengthBonus, 0, 0);
    meleeDefenseBonus += clampFloor(combat.bonuses.meleeDefenseBonus, 0, 0);
    rangedDefenseBonus += clampFloor(combat.bonuses.rangedDefenseBonus, 0, 0);
    magicDefenseBonus += clampFloor(combat.bonuses.magicDefenseBonus, 0, 0);
    if (slotNames[index] === "weapon") weaponCombat = combat;
  }

  return {
    meleeAccuracyBonus,
    meleeStrengthBonus,
    meleeDefenseBonus,
    rangedDefenseBonus,
    magicDefenseBonus,
    weaponCombat
  };
}

export function getSkillLevel(playerSkills: PlayerSkillMap, skillId: string, fallback = 1): number {
  const entry = playerSkills && skillId ? playerSkills[skillId] : null;
  return entry ? clampFloor(entry.level, 1, fallback) : fallback;
}

export function computePlayerMaxHitpoints(playerSkills: PlayerSkillMap): number {
  return Math.max(1, getSkillLevel(playerSkills, "hitpoints", 10));
}

export function clampPlayerCurrentHitpoints(currentHitpoints: unknown, maxHitpoints: number): number {
  const resolvedMaxHitpoints = Number.isFinite(maxHitpoints) ? Math.max(1, Math.floor(maxHitpoints)) : 10;
  const numericHitpoints = Number(currentHitpoints);
  const resolvedHitpoints = Number.isFinite(numericHitpoints) ? Math.floor(numericHitpoints) : resolvedMaxHitpoints;
  return Math.max(0, Math.min(resolvedMaxHitpoints, resolvedHitpoints));
}

export function applyPlayerHitpointHealing(
  currentHitpoints: unknown,
  maxHitpoints: number,
  healAmount: unknown
): { currentHitpoints: number; healed: number } {
  const resolvedMaxHitpoints = Number.isFinite(maxHitpoints) ? Math.max(1, Math.floor(maxHitpoints)) : 10;
  const current = clampPlayerCurrentHitpoints(currentHitpoints, resolvedMaxHitpoints);
  const requestedHeal = Number.isFinite(Number(healAmount)) ? Math.max(0, Math.floor(Number(healAmount))) : 0;
  const healed = Math.min(requestedHeal, Math.max(0, resolvedMaxHitpoints - current));
  return {
    currentHitpoints: current + healed,
    healed
  };
}

export function applyPlayerHitpointDamage(
  currentHitpoints: unknown,
  maxHitpoints: number,
  damageAmount: unknown,
  minHitpoints = 0
): { currentHitpoints: number; dealt: number } {
  const resolvedMaxHitpoints = Number.isFinite(maxHitpoints) ? Math.max(1, Math.floor(maxHitpoints)) : 10;
  const current = clampPlayerCurrentHitpoints(currentHitpoints, resolvedMaxHitpoints);
  const requestedDamage = Number.isFinite(Number(damageAmount)) ? Math.max(0, Math.floor(Number(damageAmount))) : 0;
  const minimum = Number.isFinite(Number(minHitpoints))
    ? Math.max(0, Math.min(resolvedMaxHitpoints, Math.floor(Number(minHitpoints))))
    : 0;
  const dealt = Math.min(requestedDamage, Math.max(0, current - minimum));
  return {
    currentHitpoints: current - dealt,
    dealt
  };
}

export function buildPlayerCombatDefaults(playerSkills: PlayerSkillMap): PlayerCombatStateShape {
  return {
    currentHitpoints: computePlayerMaxHitpoints(playerSkills),
    eatingCooldownEndTick: 0,
    lastAttackTick: -1,
    lastCastTick: -1,
    remainingAttackCooldown: 0,
    lockedTargetId: null,
    combatTargetKind: null,
    selectedMeleeStyle: "attack",
    autoRetaliateEnabled: true,
    inCombat: false,
    lastDamagerEnemyId: null
  };
}

export function computePlayerMeleeCombatSnapshot(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, EquipmentCarrier | null | undefined>;
  playerState?: Partial<PlayerCombatStateShape> | null;
}): PlayerCombatSnapshot {
  const styleId = (options.playerState && options.playerState.selectedMeleeStyle) || "attack";
  const attackLevel = getSkillLevel(options.playerSkills, "attack", 1);
  const strengthLevel = getSkillLevel(options.playerSkills, "strength", 1);
  const defenseLevel = getSkillLevel(options.playerSkills, "defense", 1);
  const bonuses = sumCombatBonuses(options.equipment || {});
  const weaponCombat = bonuses.weaponCombat;
  const hasMeleeWeapon = !!(
    weaponCombat &&
    weaponCombat.attackProfile &&
    weaponCombat.attackProfile.styleFamily === "melee"
  );
  const requiredAttackLevel = hasMeleeWeapon ? clampFloor(weaponCombat.requiredAttackLevel, 1, 1) : 0;

  const baseAttackValue = attackLevel + bonuses.meleeAccuracyBonus;
  const baseDefenseValue = defenseLevel + bonuses.meleeDefenseBonus;
  const baseMaxHit = Math.ceil(((strengthLevel * 1.6) + bonuses.meleeStrengthBonus) / 10);

  let attackValue = baseAttackValue;
  let defenseValue = baseDefenseValue;
  let maxHit = baseMaxHit;

  if (styleId === "attack") {
    attackValue = Math.floor(baseAttackValue * 1.1);
  } else if (styleId === "strength") {
    maxHit = Math.ceil(baseMaxHit * 1.1);
  } else if (styleId === "defense") {
    defenseValue = Math.floor(baseDefenseValue * 1.1);
  }

  return {
    styleId,
    canAttack: attackLevel >= requiredAttackLevel,
    attackValue,
    defenseValue,
    maxHit,
    // No melee weapon equipped falls back to unarmed melee defaults.
    attackRange: hasMeleeWeapon ? clampFloor(weaponCombat.attackProfile.range, 1, 1) : 1,
    attackTickCycle: hasMeleeWeapon ? clampFloor(weaponCombat.attackProfile.tickCycle, 1, 5) : 5,
    accuracyBonus: bonuses.meleeAccuracyBonus,
    strengthBonus: bonuses.meleeStrengthBonus,
    defenseBonus: bonuses.meleeDefenseBonus
  };
}

export function computeEnemyMeleeCombatSnapshot(enemyType: EnemyTypeDefinition | null): EnemyCombatSnapshot {
  if (!enemyType) {
    return {
      attackValue: 0,
      defenseValue: 0,
      maxHit: 0,
      attackRange: 1,
      attackTickCycle: 5
    };
  }

  return {
    attackValue: clampFloor(enemyType.stats.attack, 0, 0) + clampFloor(enemyType.bonuses.meleeAccuracyBonus, 0, 0),
    defenseValue: clampFloor(enemyType.stats.defense, 0, 0) + clampFloor(enemyType.bonuses.meleeDefenseBonus, 0, 0),
    maxHit: clampFloor(enemyType.bonuses.enemyMaxHit, 0, 0),
    attackRange: clampFloor(enemyType.attackProfile.range, 1, 1),
    attackTickCycle: clampFloor(enemyType.attackProfile.tickCycle, 1, 5)
  };
}

export function buildCombatStatsViewModel(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, EquipmentCarrier | null | undefined>;
  playerState?: Partial<PlayerCombatStateShape> | null;
}): CombatStatsViewModelShape {
  const snapshot = computePlayerMeleeCombatSnapshot(options);
  return {
    attack: snapshot.attackValue,
    defense: snapshot.defenseValue,
    strength: snapshot.maxHit
  };
}

export function decrementCooldown(value: number): number {
  return value > 0 ? value - 1 : 0;
}

export function isWithinSquareRange(
  attacker: { x: number; y: number },
  target: { x: number; y: number },
  range: number
): boolean {
  const dx = Math.abs(Math.floor(attacker.x) - Math.floor(target.x));
  const dy = Math.abs(Math.floor(attacker.y) - Math.floor(target.y));
  return Math.max(dx, dy) <= Math.max(0, Math.floor(range));
}

export function isWithinMeleeRange(
  attacker: { x: number; y: number },
  target: { x: number; y: number }
): boolean {
  return isWithinSquareRange(attacker, target, 1);
}

function randomIntegerInclusive(maximum: number, rng: () => number): number {
  const upperBound = Math.max(0, Math.floor(maximum));
  return Math.floor(rng() * (upperBound + 1));
}

export function rollOpposedHitCheck(
  attackValue: number,
  defenseValue: number,
  rng: () => number = Math.random
): boolean {
  const attackRoll = randomIntegerInclusive(Math.max(0, Math.floor(attackValue)), rng);
  const defenseRoll = randomIntegerInclusive(Math.max(0, Math.floor(defenseValue)), rng);
  return attackRoll >= defenseRoll;
}

export function rollDamage(maxHit: number, rng: () => number = Math.random): number {
  return randomIntegerInclusive(Math.max(0, Math.floor(maxHit)), rng);
}

export function pickDropEntry(dropTable: EnemyDropEntry[], rng: () => number = Math.random): EnemyDropEntry | null {
  if (!Array.isArray(dropTable) || dropTable.length === 0) return null;
  let totalWeight = 0;
  for (let index = 0; index < dropTable.length; index += 1) {
    totalWeight += clampFloor(dropTable[index] && dropTable[index].weight, 0, 0);
  }
  if (totalWeight <= 0) return null;

  let roll = rng() * totalWeight;
  for (let index = 0; index < dropTable.length; index += 1) {
    const entry = dropTable[index];
    const weight = clampFloor(entry && entry.weight, 0, 0);
    if (weight <= 0) continue;
    if (roll < weight) return { ...entry };
    roll -= weight;
  }

  return { ...dropTable[dropTable.length - 1] };
}

export function computeRespawnTick(currentTick: number, enemyType: EnemyTypeDefinition, enemyState?: EnemyRuntimeState | null): number {
  const runtimeOverride = enemyState && Number.isFinite(enemyState.respawnAtTick) ? Number(enemyState.respawnAtTick) : null;
  if (runtimeOverride !== null) return runtimeOverride;
  return currentTick + clampFloor(enemyType.respawnTicks, 1, 1);
}
