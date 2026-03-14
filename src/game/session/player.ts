import type { Point3 } from "../contracts/world";
import type {
  GameSessionPlayerState,
  MerchantProgressEntry,
  MerchantProgressState,
  PlayerUnlockFlags
} from "../contracts/session";
import { createDefaultPlayerCombatState } from "../combat/content";

function cloneUnlockFlags(defaultUnlockFlags: PlayerUnlockFlags): PlayerUnlockFlags {
  return { ...defaultUnlockFlags };
}

export function cloneMerchantProgressEntry(entry: MerchantProgressEntry): MerchantProgressEntry {
  return {
    soldCounts: { ...entry.soldCounts },
    unlockedItems: { ...entry.unlockedItems }
  };
}

export function cloneMerchantProgress(progress: MerchantProgressState): MerchantProgressState {
  const cloned: MerchantProgressState = {};
  const merchantIds = Object.keys(progress || {});
  for (let i = 0; i < merchantIds.length; i++) {
    const merchantId = merchantIds[i];
    const entry = progress[merchantId];
    if (!entry) continue;
    cloned[merchantId] = cloneMerchantProgressEntry(entry);
  }
  return cloned;
}

export function createDefaultPlayerState(
  defaultSpawn: Point3,
  defaultUnlockFlags: PlayerUnlockFlags
): GameSessionPlayerState {
  const combatDefaults = createDefaultPlayerCombatState(10);
  return {
    x: defaultSpawn.x,
    y: defaultSpawn.y,
    z: defaultSpawn.z,
    prevX: defaultSpawn.x,
    prevY: defaultSpawn.y,
    midX: null,
    midY: null,
    targetX: defaultSpawn.x,
    targetY: defaultSpawn.y,
    targetRotation: 0,
    path: [],
    action: "IDLE",
    targetObj: null,
    pendingActionAfterTurn: null,
    turnLock: false,
    actionVisualReady: true,
    actionUntilTick: 0,
    currentHitpoints: combatDefaults.currentHitpoints,
    eatingCooldownEndTick: combatDefaults.eatingCooldownEndTick,
    lastAttackTick: combatDefaults.lastAttackTick,
    lastCastTick: combatDefaults.lastCastTick,
    remainingAttackCooldown: combatDefaults.remainingAttackCooldown,
    lockedTargetId: combatDefaults.lockedTargetId,
    combatTargetKind: combatDefaults.combatTargetKind,
    selectedMeleeStyle: combatDefaults.selectedMeleeStyle,
    autoRetaliateEnabled: combatDefaults.autoRetaliateEnabled,
    inCombat: combatDefaults.inCombat,
    lastDamagerEnemyId: combatDefaults.lastDamagerEnemyId,
    firemakingTarget: null,
    pendingSkillStart: null,
    unlockFlags: cloneUnlockFlags(defaultUnlockFlags),
    merchantProgress: {}
  };
}
