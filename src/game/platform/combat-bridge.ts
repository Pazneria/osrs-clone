import type {
  EnemyRuntimeState,
  EnemySpawnNodeDefinition,
  EnemyTypeDefinition,
  PlayerCombatStateShape
} from "../contracts/combat";
import type { PlayerSkillMap } from "../contracts/session";
import {
  buildCombatStatsViewModel,
  buildPlayerCombatDefaults,
  computeEnemyMeleeCombatSnapshot,
  computePlayerMeleeCombatSnapshot,
  decrementCooldown,
  isWithinMeleeRange,
  isWithinSquareRange,
  pickDropEntry,
  rollDamage,
  rollOpposedHitCheck
} from "../combat/formulas";
import {
  COMBAT_SPEC_VERSION,
  createDefaultPlayerCombatState,
  createEnemyRuntimeState,
  DEFAULT_MELEE_STYLE,
  getEnemyTypeDefinition,
  listEnemySpawnNodesForWorld,
  listEnemyTypes
} from "../combat/content";

declare global {
  interface Window {
    CombatRuntime?: {
      getSpecVersion: () => string;
      getDefaultMeleeStyle: () => PlayerCombatStateShape["selectedMeleeStyle"];
      createDefaultPlayerCombatState: (maxHitpoints?: number) => PlayerCombatStateShape;
      buildPlayerCombatDefaults: (playerSkills: PlayerSkillMap) => PlayerCombatStateShape;
      buildCombatStatsViewModel: typeof buildCombatStatsViewModel;
      computePlayerMeleeCombatSnapshot: typeof computePlayerMeleeCombatSnapshot;
      computeEnemyMeleeCombatSnapshot: typeof computeEnemyMeleeCombatSnapshot;
      decrementCooldown: typeof decrementCooldown;
      rollOpposedHitCheck: typeof rollOpposedHitCheck;
      rollDamage: typeof rollDamage;
      isWithinSquareRange: typeof isWithinSquareRange;
      isWithinMeleeRange: typeof isWithinMeleeRange;
      pickDropEntry: typeof pickDropEntry;
      listEnemyTypes: () => EnemyTypeDefinition[];
      getEnemyTypeDefinition: (enemyId: string) => EnemyTypeDefinition | null;
      listEnemySpawnNodesForWorld: (worldId: string) => EnemySpawnNodeDefinition[];
      createEnemyRuntimeState: (spawnNode: EnemySpawnNodeDefinition, currentTick?: number) => EnemyRuntimeState;
    };
  }
}

export function exposeCombatBridge(): void {
  window.CombatRuntime = {
    getSpecVersion: () => COMBAT_SPEC_VERSION,
    getDefaultMeleeStyle: () => DEFAULT_MELEE_STYLE,
    createDefaultPlayerCombatState,
    buildPlayerCombatDefaults,
    buildCombatStatsViewModel,
    computePlayerMeleeCombatSnapshot,
    computeEnemyMeleeCombatSnapshot,
    decrementCooldown,
    rollOpposedHitCheck,
    rollDamage,
    isWithinSquareRange,
    isWithinMeleeRange,
    pickDropEntry,
    listEnemyTypes,
    getEnemyTypeDefinition,
    listEnemySpawnNodesForWorld,
    createEnemyRuntimeState
  };
}
