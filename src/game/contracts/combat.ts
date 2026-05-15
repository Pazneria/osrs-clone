import type { Point3 } from "./world";

export type CombatStyleFamily = "melee" | "ranged" | "magic";
export type CombatDamageType = "melee" | "ranged" | "magic";
export type MeleeStyleId = "attack" | "strength" | "defense";
export type PlayerCombatStyleId = MeleeStyleId | "ranged" | "magic";
export type CombatTargetKind = "enemy";
export type EnemyAggroType = "passive" | "aggressive";
export type EnemyRuntimeStateId = "idle" | "aggroed" | "returning" | "dead";
export type EnemyAppearanceKind = "rat" | "humanoid" | "chicken";
export type EnemyDropKind = "nothing" | "item" | "coins";
export type CombatProgressionBandId =
  | "starter_opt_in"
  | "starter_roadside"
  | "resource_outskirts"
  | "guarded_threshold"
  | "camp_threat"
  | "later_region";
export type CombatProgressionWorldStage = "starter" | "mid" | "later";

export interface CombatAttackProfile {
  styleFamily: CombatStyleFamily;
  damageType: CombatDamageType;
  range: number;
  tickCycle: number;
  projectile: boolean;
  ammoUse: boolean;
  familyTag?: string | null;
}

export interface CombatBonuses {
  meleeAccuracyBonus: number;
  meleeStrengthBonus: number;
  rangedAccuracyBonus: number;
  rangedStrengthBonus: number;
  magicAccuracyBonus: number;
  magicStrengthBonus: number;
  meleeDefenseBonus: number;
  rangedDefenseBonus: number;
  magicDefenseBonus: number;
}

export interface CombatItemProfile {
  attackProfile: CombatAttackProfile;
  bonuses: CombatBonuses;
  requiredAttackLevel: number;
  requiredRangedLevel?: number;
  requiredMagicLevel?: number;
  weaponFamily?: string | null;
  toolFamily?: string | null;
}

export interface CombatAmmoProfile {
  damageType: "ranged" | "magic";
  ammoTier: number;
  rangedAccuracyBonus?: number;
  rangedStrengthBonus?: number;
  magicAccuracyBonus?: number;
  magicStrengthBonus?: number;
  compatibleWeaponFamilies?: string[] | null;
}

export interface CombatEnemyAppearance {
  kind: EnemyAppearanceKind;
  npcType?: number;
  facingYaw?: number;
  modelPresetId?: string;
  animationSetId?: string;
}

export interface EnemyCombatStats {
  hitpoints: number;
  attack: number;
  strength: number;
  defense: number;
}

export interface EnemyCombatBonuses {
  meleeAccuracyBonus: number;
  meleeDefenseBonus: number;
  enemyMaxHit: number;
}

export interface EnemyBehaviorProfile {
  aggroType: EnemyAggroType;
  aggroRadius: number;
  chaseRange: number;
  roamingRadius: number;
  defaultMovementSpeed: number;
  combatMovementSpeed: number;
}

export interface EnemyDropEntry {
  kind: EnemyDropKind;
  weight: number;
  itemId?: string | null;
  minAmount?: number;
  maxAmount?: number;
}

export interface EnemyTypeDefinition {
  enemyId: string;
  displayName: string;
  combatFamily: CombatStyleFamily;
  appearance: CombatEnemyAppearance;
  stats: EnemyCombatStats;
  bonuses: EnemyCombatBonuses;
  attackProfile: CombatAttackProfile;
  behavior: EnemyBehaviorProfile;
  respawnTicks: number;
  dropTable: EnemyDropEntry[];
}

export interface CombatProgressionBandDefinition {
  bandId: CombatProgressionBandId;
  displayName: string;
  worldStage: CombatProgressionWorldStage;
  routeDepth: number;
  targetPlayerLevels: {
    min: number;
    max: number | null;
  };
  enemyIds: string[];
  spawnGroupPrefixes: string[];
  placementGuidance: string[];
  lootGuidance: string[];
  maxExpectedSellValuePerKill: number | null;
}

export interface CombatProgressionBandWorldSummary {
  bandId: CombatProgressionBandId;
  worldId: string;
  enemyIds: string[];
  spawnGroupIds: string[];
  spawnCount: number;
}

export interface EnemySpawnNodeDefinition {
  spawnNodeId: string;
  enemyId: string;
  spawnTile: Point3;
  homeTileOverride?: Point3 | null;
  roamingRadiusOverride?: number | null;
  patrolRoute?: Point3[] | null;
  assistGroupId?: string | null;
  assistRadiusOverride?: number | null;
  respawnTicks?: number | null;
  spawnEnabled: boolean;
  facingYaw?: number;
  spawnGroupId?: string | null;
}

export interface EnemyRuntimeState extends Point3 {
  runtimeId: string;
  spawnNodeId: string;
  enemyId: string;
  currentHealth: number;
  currentState: EnemyRuntimeStateId;
  lockedTargetId: string | null;
  remainingAttackCooldown: number;
  resolvedHomeTile: Point3;
  resolvedSpawnTile: Point3;
  spawnGroupId?: string | null;
  assistGroupId?: string | null;
  resolvedAssistRadius: number;
  resolvedPatrolRoute?: Point3[] | null;
  patrolRouteIndex?: number | null;
  patrolTargetIndex?: number | null;
  resolvedRoamingRadius: number;
  resolvedChaseRange: number;
  resolvedAggroRadius: number;
  defaultMovementSpeed: number;
  combatMovementSpeed: number;
  facingYaw: number;
  respawnAtTick: number | null;
  lastDamagerId: string | null;
  attackTriggerAt: number;
  hitReactionTriggerAt: number;
}

export interface PlayerCombatStateShape {
  currentHitpoints: number;
  eatingCooldownEndTick: number;
  lastAttackTick: number;
  lastCastTick: number;
  remainingAttackCooldown: number;
  lockedTargetId: string | null;
  combatTargetKind: CombatTargetKind | null;
  selectedMeleeStyle: MeleeStyleId;
  autoRetaliateEnabled: boolean;
  inCombat: boolean;
  lastDamagerEnemyId: string | null;
}

export interface CombatStatsViewModelShape {
  attack: number;
  defense: number;
  strength: number;
}
