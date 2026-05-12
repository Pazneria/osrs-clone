import type {
  CombatAmmoProfile,
  CombatItemProfile,
  CombatStyleFamily,
  CombatStatsViewModelShape,
  CombatDamageType,
  EnemyDropEntry,
  EnemyRuntimeState,
  EnemyTypeDefinition,
  PlayerCombatStyleId
} from "../contracts/combat";
import type { PlayerCombatStateShape } from "../contracts/combat";
import type { PlayerSkillMap } from "../contracts/session";

interface EquipmentCarrier {
  combat?: CombatItemProfile;
  ammo?: CombatAmmoProfile;
  id?: string;
  [key: string]: unknown;
}

interface InventorySlotCarrier {
  itemData?: EquipmentCarrier | null;
  amount?: number;
}

interface PlayerCombatSnapshot {
  styleId: PlayerCombatStyleId;
  styleFamily: CombatStyleFamily;
  damageType: CombatDamageType;
  canAttack: boolean;
  attackValue: number;
  defenseValue: number;
  maxHit: number;
  attackRange: number;
  attackTickCycle: number;
  accuracyBonus: number;
  strengthBonus: number;
  defenseBonus: number;
  consumesAmmo: boolean;
  ammoInventoryIndex: number | null;
  ammoEquipmentSlot: string | null;
  ammoItemId: string | null;
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

function sumCombatBonuses(equipment: Record<string, EquipmentCarrier | InventorySlotCarrier | null | undefined>) {
  let meleeAccuracyBonus = 0;
  let meleeStrengthBonus = 0;
  let rangedAccuracyBonus = 0;
  let rangedStrengthBonus = 0;
  let magicAccuracyBonus = 0;
  let magicStrengthBonus = 0;
  let meleeDefenseBonus = 0;
  let rangedDefenseBonus = 0;
  let magicDefenseBonus = 0;
  let weaponCombat: CombatItemProfile | null = null;

  const slotNames = Object.keys(equipment || {});
  for (let index = 0; index < slotNames.length; index += 1) {
    const item = getSlotItem(equipment[slotNames[index]]);
    if (!item || typeof item !== "object" || !item.combat) continue;
    const combat = item.combat;
    meleeAccuracyBonus += clampFloor(combat.bonuses.meleeAccuracyBonus, 0, 0);
    meleeStrengthBonus += clampFloor(combat.bonuses.meleeStrengthBonus, 0, 0);
    rangedAccuracyBonus += clampFloor(combat.bonuses.rangedAccuracyBonus, 0, 0);
    rangedStrengthBonus += clampFloor(combat.bonuses.rangedStrengthBonus, 0, 0);
    magicAccuracyBonus += clampFloor(combat.bonuses.magicAccuracyBonus, 0, 0);
    magicStrengthBonus += clampFloor(combat.bonuses.magicStrengthBonus, 0, 0);
    meleeDefenseBonus += clampFloor(combat.bonuses.meleeDefenseBonus, 0, 0);
    rangedDefenseBonus += clampFloor(combat.bonuses.rangedDefenseBonus, 0, 0);
    magicDefenseBonus += clampFloor(combat.bonuses.magicDefenseBonus, 0, 0);
    if (slotNames[index] === "weapon") weaponCombat = combat;
  }

  return {
    meleeAccuracyBonus,
    meleeStrengthBonus,
    rangedAccuracyBonus,
    rangedStrengthBonus,
    magicAccuracyBonus,
    magicStrengthBonus,
    meleeDefenseBonus,
    rangedDefenseBonus,
    magicDefenseBonus,
    weaponCombat
  };
}

function getSlotItem(slot: InventorySlotCarrier | EquipmentCarrier | null | undefined): EquipmentCarrier | null {
  if (!slot || typeof slot !== "object") return null;
  if ("itemData" in slot) {
    const itemData = (slot as InventorySlotCarrier).itemData;
    return itemData && typeof itemData === "object" ? itemData : null;
  }
  return slot as EquipmentCarrier;
}

function getSlotAmount(slot: InventorySlotCarrier | EquipmentCarrier | null | undefined): number {
  if (!slot || typeof slot !== "object") return 0;
  const amount = (slot as InventorySlotCarrier).amount;
  return Number.isFinite(amount) ? Math.max(0, Math.floor(Number(amount))) : 1;
}

function isAmmoCompatibleWithWeapon(ammo: CombatAmmoProfile, weaponCombat: CombatItemProfile): boolean {
  const compatibleFamilies = Array.isArray(ammo.compatibleWeaponFamilies) ? ammo.compatibleWeaponFamilies : [];
  if (compatibleFamilies.length === 0) return true;
  const weaponFamily = typeof weaponCombat.weaponFamily === "string" ? weaponCombat.weaponFamily : "";
  return !!weaponFamily && compatibleFamilies.includes(weaponFamily);
}

function selectBestRangedAmmo(
  inventory: Array<InventorySlotCarrier | EquipmentCarrier | null | undefined> | null | undefined,
  weaponCombat: CombatItemProfile
): { profile: CombatAmmoProfile; itemId: string | null; inventoryIndex: number } | null {
  if (!Array.isArray(inventory)) return null;
  let best: { profile: CombatAmmoProfile; itemId: string | null; inventoryIndex: number; score: number } | null = null;
  for (let index = 0; index < inventory.length; index += 1) {
    const slot = inventory[index];
    if (getSlotAmount(slot) <= 0) continue;
    const item = getSlotItem(slot);
    if (!item || !item.ammo || item.ammo.damageType !== "ranged") continue;
    if (!isAmmoCompatibleWithWeapon(item.ammo, weaponCombat)) continue;
    const ammoAccuracy = clampFloor(item.ammo.rangedAccuracyBonus, 0, 0);
    const ammoStrength = clampFloor(item.ammo.rangedStrengthBonus, 0, 0);
    const ammoTier = clampFloor(item.ammo.ammoTier, 0, 0);
    const score = ammoTier * 10000 + ammoStrength * 100 + ammoAccuracy;
    if (!best || score > best.score) {
      best = {
        profile: item.ammo,
        itemId: typeof item.id === "string" ? item.id : null,
        inventoryIndex: index,
        score
      };
    }
  }
  return best ? { profile: best.profile, itemId: best.itemId, inventoryIndex: best.inventoryIndex } : null;
}

function selectEquippedRangedAmmo(
  equipment: Record<string, EquipmentCarrier | InventorySlotCarrier | null | undefined>,
  weaponCombat: CombatItemProfile
): { profile: CombatAmmoProfile; itemId: string | null; equipmentSlot: string } | null {
  const ammoSlotName = "ammo";
  const slot = equipment ? equipment[ammoSlotName] : null;
  if (getSlotAmount(slot) <= 0) return null;
  const item = getSlotItem(slot);
  if (!item || !item.ammo || item.ammo.damageType !== "ranged") return null;
  if (!isAmmoCompatibleWithWeapon(item.ammo, weaponCombat)) return null;
  return {
    profile: item.ammo,
    itemId: typeof item.id === "string" ? item.id : null,
    equipmentSlot: ammoSlotName
  };
}

function selectBestMagicRune(
  inventory: Array<InventorySlotCarrier | EquipmentCarrier | null | undefined> | null | undefined,
  weaponCombat: CombatItemProfile
): { profile: CombatAmmoProfile; itemId: string | null; inventoryIndex: number } | null {
  if (!Array.isArray(inventory)) return null;
  let best: { profile: CombatAmmoProfile; itemId: string | null; inventoryIndex: number; score: number } | null = null;
  for (let index = 0; index < inventory.length; index += 1) {
    const slot = inventory[index];
    if (getSlotAmount(slot) <= 0) continue;
    const item = getSlotItem(slot);
    if (!item || !item.ammo || item.ammo.damageType !== "magic") continue;
    if (!isAmmoCompatibleWithWeapon(item.ammo, weaponCombat)) continue;
    const runeAccuracy = clampFloor(item.ammo.magicAccuracyBonus, 0, 0);
    const runeStrength = clampFloor(item.ammo.magicStrengthBonus, 0, 0);
    const runeTier = clampFloor(item.ammo.ammoTier, 0, 0);
    const score = runeTier * 10000 + runeStrength * 100 + runeAccuracy;
    if (!best || score > best.score) {
      best = {
        profile: item.ammo,
        itemId: typeof item.id === "string" ? item.id : null,
        inventoryIndex: index,
        score
      };
    }
  }
  return best ? { profile: best.profile, itemId: best.itemId, inventoryIndex: best.inventoryIndex } : null;
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
  equipment: Record<string, EquipmentCarrier | InventorySlotCarrier | null | undefined>;
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
    styleFamily: "melee",
    damageType: "melee",
    canAttack: attackLevel >= requiredAttackLevel,
    attackValue,
    defenseValue,
    maxHit,
    // No melee weapon equipped falls back to unarmed melee defaults.
    attackRange: hasMeleeWeapon ? clampFloor(weaponCombat.attackProfile.range, 1, 1) : 1,
    attackTickCycle: hasMeleeWeapon ? clampFloor(weaponCombat.attackProfile.tickCycle, 1, 5) : 5,
    accuracyBonus: bonuses.meleeAccuracyBonus,
    strengthBonus: bonuses.meleeStrengthBonus,
    defenseBonus: bonuses.meleeDefenseBonus,
    consumesAmmo: false,
    ammoInventoryIndex: null,
    ammoEquipmentSlot: null,
    ammoItemId: null
  };
}

export function computePlayerRangedCombatSnapshot(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, EquipmentCarrier | InventorySlotCarrier | null | undefined>;
  inventory?: Array<InventorySlotCarrier | EquipmentCarrier | null | undefined> | null;
  playerState?: Partial<PlayerCombatStateShape> | null;
}): PlayerCombatSnapshot {
  const rangedLevel = getSkillLevel(options.playerSkills, "ranged", 1);
  const defenseLevel = getSkillLevel(options.playerSkills, "defense", 1);
  const bonuses = sumCombatBonuses(options.equipment || {});
  const weaponCombat = bonuses.weaponCombat;
  const hasRangedWeapon = !!(
    weaponCombat &&
    weaponCombat.attackProfile &&
    weaponCombat.attackProfile.styleFamily === "ranged"
  );
  const requiredRangedLevel = hasRangedWeapon ? clampFloor(weaponCombat.requiredRangedLevel, 1, 1) : 0;
  const consumesAmmo = !!(hasRangedWeapon && weaponCombat.attackProfile.ammoUse);
  const equippedAmmoSelection = consumesAmmo ? selectEquippedRangedAmmo(options.equipment || {}, weaponCombat) : null;
  const inventoryAmmoSelection = consumesAmmo && !equippedAmmoSelection
    ? selectBestRangedAmmo(options.inventory || [], weaponCombat)
    : null;
  const ammoSelection = equippedAmmoSelection || inventoryAmmoSelection;
  const ammoAccuracyBonus = ammoSelection ? clampFloor(ammoSelection.profile.rangedAccuracyBonus, 0, 0) : 0;
  const ammoStrengthBonus = ammoSelection ? clampFloor(ammoSelection.profile.rangedStrengthBonus, 0, 0) : 0;

  const accuracyBonus = bonuses.rangedAccuracyBonus + ammoAccuracyBonus;
  const strengthBonus = bonuses.rangedStrengthBonus + ammoStrengthBonus;
  const attackValue = rangedLevel + accuracyBonus;
  const defenseValue = defenseLevel + bonuses.rangedDefenseBonus;
  const maxHit = Math.ceil((rangedLevel + strengthBonus) / 10);

  return {
    styleId: "ranged",
    styleFamily: "ranged",
    damageType: "ranged",
    canAttack: hasRangedWeapon && rangedLevel >= requiredRangedLevel && (!consumesAmmo || !!ammoSelection),
    attackValue,
    defenseValue,
    maxHit,
    attackRange: hasRangedWeapon ? clampFloor(weaponCombat.attackProfile.range, 1, 7) : 1,
    attackTickCycle: hasRangedWeapon ? clampFloor(weaponCombat.attackProfile.tickCycle, 1, 4) : 4,
    accuracyBonus,
    strengthBonus,
    defenseBonus: bonuses.rangedDefenseBonus,
    consumesAmmo,
    ammoInventoryIndex: inventoryAmmoSelection ? inventoryAmmoSelection.inventoryIndex : null,
    ammoEquipmentSlot: equippedAmmoSelection ? equippedAmmoSelection.equipmentSlot : null,
    ammoItemId: ammoSelection ? ammoSelection.itemId : null
  };
}

export function computePlayerMagicCombatSnapshot(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, EquipmentCarrier | InventorySlotCarrier | null | undefined>;
  inventory?: Array<InventorySlotCarrier | EquipmentCarrier | null | undefined> | null;
  playerState?: Partial<PlayerCombatStateShape> | null;
}): PlayerCombatSnapshot {
  const magicLevel = getSkillLevel(options.playerSkills, "magic", 1);
  const defenseLevel = getSkillLevel(options.playerSkills, "defense", 1);
  const bonuses = sumCombatBonuses(options.equipment || {});
  const weaponCombat = bonuses.weaponCombat;
  const hasMagicWeapon = !!(
    weaponCombat &&
    weaponCombat.attackProfile &&
    weaponCombat.attackProfile.styleFamily === "magic"
  );
  const requiredMagicLevel = hasMagicWeapon ? clampFloor(weaponCombat.requiredMagicLevel, 1, 1) : 0;
  const consumesAmmo = !!(hasMagicWeapon && weaponCombat.attackProfile.ammoUse);
  const runeSelection = consumesAmmo ? selectBestMagicRune(options.inventory || [], weaponCombat) : null;
  const runeAccuracyBonus = runeSelection ? clampFloor(runeSelection.profile.magicAccuracyBonus, 0, 0) : 0;
  const runeStrengthBonus = runeSelection ? clampFloor(runeSelection.profile.magicStrengthBonus, 0, 0) : 0;

  const accuracyBonus = bonuses.magicAccuracyBonus + runeAccuracyBonus;
  const strengthBonus = bonuses.magicStrengthBonus + runeStrengthBonus;
  const attackValue = magicLevel + accuracyBonus;
  const defenseValue = defenseLevel + bonuses.magicDefenseBonus;
  const maxHit = Math.ceil((magicLevel + strengthBonus) / 10);

  return {
    styleId: "magic",
    styleFamily: "magic",
    damageType: "magic",
    canAttack: hasMagicWeapon && magicLevel >= requiredMagicLevel && (!consumesAmmo || !!runeSelection),
    attackValue,
    defenseValue,
    maxHit,
    attackRange: hasMagicWeapon ? clampFloor(weaponCombat.attackProfile.range, 1, 8) : 1,
    attackTickCycle: hasMagicWeapon ? clampFloor(weaponCombat.attackProfile.tickCycle, 1, 4) : 4,
    accuracyBonus,
    strengthBonus,
    defenseBonus: bonuses.magicDefenseBonus,
    consumesAmmo,
    ammoInventoryIndex: runeSelection ? runeSelection.inventoryIndex : null,
    ammoEquipmentSlot: null,
    ammoItemId: runeSelection ? runeSelection.itemId : null
  };
}

export function computePlayerCombatSnapshot(options: {
  playerSkills: PlayerSkillMap;
  equipment: Record<string, EquipmentCarrier | InventorySlotCarrier | null | undefined>;
  inventory?: Array<InventorySlotCarrier | EquipmentCarrier | null | undefined> | null;
  playerState?: Partial<PlayerCombatStateShape> | null;
}): PlayerCombatSnapshot {
  const equipment = options.equipment || {};
  const weapon = getSlotItem(equipment.weapon);
  const weaponCombat = weapon && typeof weapon === "object" ? weapon.combat : null;
  if (weaponCombat && weaponCombat.attackProfile && weaponCombat.attackProfile.styleFamily === "ranged") {
    return computePlayerRangedCombatSnapshot(options);
  }
  if (weaponCombat && weaponCombat.attackProfile && weaponCombat.attackProfile.styleFamily === "magic") {
    return computePlayerMagicCombatSnapshot(options);
  }
  return computePlayerMeleeCombatSnapshot(options);
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
  equipment: Record<string, EquipmentCarrier | InventorySlotCarrier | null | undefined>;
  inventory?: Array<InventorySlotCarrier | EquipmentCarrier | null | undefined> | null;
  playerState?: Partial<PlayerCombatStateShape> | null;
}): CombatStatsViewModelShape {
  const snapshot = computePlayerCombatSnapshot(options);
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
