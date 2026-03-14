import type {
  ContentGrantState,
  GameSession,
  MerchantProgressEntry,
  MerchantProgressState,
  PlayerProfileState,
  PlayerSkillMap,
  PlayerUnlockFlags,
  ProgressSavePayload,
  ProgressSaveReadResult,
  ProgressSaveWriteResult,
  SaveAppearanceState,
  SerializedItemSlot,
  StorageLike
} from "../contracts/session";
import { cloneMerchantProgress } from "./player";
import {
  cloneAppearanceState,
  cloneContentGrantState,
  clonePlayerProfileState,
  clonePlayerSkillsState
} from "./progress";

function cloneUnlockFlags(unlockFlags: PlayerUnlockFlags): PlayerUnlockFlags {
  return { ...unlockFlags };
}

function cloneSerializedItemSlots(slots: Array<SerializedItemSlot | null>): Array<SerializedItemSlot | null> {
  return Array.isArray(slots)
    ? slots.map((slot) => (slot ? { itemId: slot.itemId, amount: slot.amount } : null))
    : [];
}

function cloneEquipmentState(equipment: Record<string, string | null>): Record<string, string | null> {
  return { ...equipment };
}

export function buildProgressSavePayload(options: {
  saveVersion: number;
  reason: string;
  session: GameSession;
  playerSkills: PlayerSkillMap;
  inventory: Array<SerializedItemSlot | null>;
  bankItems: Array<SerializedItemSlot | null>;
  equipment: Record<string, string | null>;
  userItemPrefs: Record<string, string>;
  contentGrants: ContentGrantState;
  profile: PlayerProfileState;
  appearance: SaveAppearanceState | null;
}): ProgressSavePayload {
  const { session } = options;
  return {
    version: options.saveVersion,
    savedAt: Date.now(),
    reason: options.reason,
    state: {
      worldId: session.currentWorldId,
      playerState: {
        x: session.player.x,
        y: session.player.y,
        z: session.player.z,
        targetRotation: Number.isFinite(session.player.targetRotation) ? session.player.targetRotation : 0,
        currentHitpoints: Number.isFinite(session.player.currentHitpoints) ? Math.floor(session.player.currentHitpoints) : 10,
        eatingCooldownEndTick: Number.isFinite(session.player.eatingCooldownEndTick) ? Math.floor(session.player.eatingCooldownEndTick) : 0,
        remainingAttackCooldown: Number.isFinite(session.player.remainingAttackCooldown) ? Math.floor(session.player.remainingAttackCooldown) : 0,
        lockedTargetId: typeof session.player.lockedTargetId === "string" ? session.player.lockedTargetId : null,
        combatTargetKind: session.player.combatTargetKind === "enemy" ? "enemy" : null,
        selectedMeleeStyle: session.player.selectedMeleeStyle === "strength" || session.player.selectedMeleeStyle === "defense"
          ? session.player.selectedMeleeStyle
          : "attack",
        autoRetaliateEnabled: session.player.autoRetaliateEnabled !== false,
        inCombat: !!session.player.inCombat,
        lastDamagerEnemyId: typeof session.player.lastDamagerEnemyId === "string" ? session.player.lastDamagerEnemyId : null,
        unlockFlags: cloneUnlockFlags(session.player.unlockFlags),
        merchantProgress: cloneMerchantProgress(session.player.merchantProgress)
      },
      playerSkills: clonePlayerSkillsState(options.playerSkills),
      inventory: cloneSerializedItemSlots(options.inventory),
      bankItems: cloneSerializedItemSlots(options.bankItems),
      equipment: cloneEquipmentState(options.equipment),
      userItemPrefs: { ...options.userItemPrefs },
      contentGrants: cloneContentGrantState(options.contentGrants),
      runMode: !!session.ui.runMode,
      profile: clonePlayerProfileState(options.profile),
      appearance: cloneAppearanceState(options.appearance)
    }
  };
}

export function migrateProgressSavePayload(
  payload: unknown,
  currentVersion: number
): ProgressSavePayload | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Partial<ProgressSavePayload> & { state?: unknown };
  if (candidate.version === currentVersion && candidate.state && typeof candidate.state === "object") {
    return candidate as ProgressSavePayload;
  }
  const legacyState = candidate.state || candidate;
  if (legacyState && typeof legacyState === "object") {
    return {
      version: currentVersion,
      savedAt: Number.isFinite(candidate.savedAt) ? Number(candidate.savedAt) : Date.now(),
      reason: typeof candidate.reason === "string" ? candidate.reason : "migrated",
      state: legacyState as ProgressSavePayload["state"]
    };
  }
  return null;
}

export function saveProgressPayloadToStorage(options: {
  storage: StorageLike;
  storageKey: string;
  payload: ProgressSavePayload;
}): ProgressSaveWriteResult {
  try {
    options.storage.setItem(options.storageKey, JSON.stringify(options.payload));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "save_failed", error };
  }
}

export function loadProgressPayloadFromStorage(options: {
  storage: StorageLike;
  storageKey: string;
  currentVersion: number;
}): ProgressSaveReadResult {
  let raw: string | null = null;
  try {
    raw = options.storage.getItem(options.storageKey);
  } catch (error) {
    return { loaded: false, reason: "load_failed", error };
  }

  if (!raw) return { loaded: false, reason: "no_save" };

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { loaded: false, reason: "parse_failed", error };
  }

  const payload = migrateProgressSavePayload(parsed, options.currentVersion);
  if (!payload || !payload.state || typeof payload.state !== "object") {
    return { loaded: false, reason: "invalid_payload" };
  }

  return { loaded: true, reason: "ok", payload };
}

export function sanitizeMerchantProgress(savedProgress: unknown): MerchantProgressState {
  const restored: MerchantProgressState = {};
  if (!savedProgress || typeof savedProgress !== "object") return restored;

  const merchantIds = Object.keys(savedProgress as Record<string, unknown>);
  for (let i = 0; i < merchantIds.length; i++) {
    const merchantId = merchantIds[i];
    const row = (savedProgress as Record<string, unknown>)[merchantId];
    if (!row || typeof row !== "object") continue;

    const soldCounts: Record<string, number> = {};
    const unlockedItems: Record<string, boolean> = {};
    const sold = (row as MerchantProgressEntry).soldCounts;
    if (sold && typeof sold === "object") {
      const soldKeys = Object.keys(sold);
      for (let j = 0; j < soldKeys.length; j++) {
        const itemId = String(soldKeys[j] || "").trim().toLowerCase();
        if (!itemId) continue;
        const value = Number((sold as Record<string, unknown>)[soldKeys[j]]);
        if (!Number.isFinite(value) || value <= 0) continue;
        soldCounts[itemId] = Math.floor(value);
      }
    }

    const unlocked = (row as MerchantProgressEntry).unlockedItems;
    if (unlocked && typeof unlocked === "object") {
      const unlockedKeys = Object.keys(unlocked);
      for (let j = 0; j < unlockedKeys.length; j++) {
        const itemId = String(unlockedKeys[j] || "").trim().toLowerCase();
        if (!itemId) continue;
        if ((unlocked as Record<string, unknown>)[unlockedKeys[j]]) unlockedItems[itemId] = true;
      }
    }

    restored[merchantId] = { soldCounts, unlockedItems };
  }

  return restored;
}

export function sanitizeUnlockFlags(
  savedFlags: unknown,
  defaultUnlockFlags: PlayerUnlockFlags
): PlayerUnlockFlags {
  const restored = { ...defaultUnlockFlags };
  if (!savedFlags || typeof savedFlags !== "object") return restored;
  const keys = Object.keys(defaultUnlockFlags);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if ((savedFlags as Record<string, unknown>)[key] === undefined) continue;
    restored[key] = !!(savedFlags as Record<string, unknown>)[key];
  }
  return restored;
}
