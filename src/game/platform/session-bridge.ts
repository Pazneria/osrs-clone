import type {
  GameSession,
  PlayerUnlockFlags,
  ProgressSavePayload,
  ProgressSaveReadResult,
  ProgressSaveWriteResult,
  QuestProgressState,
  SaveAppearanceState,
  SerializedItemSlot,
  StorageLike
} from "../contracts/session";
import type { Point3 } from "../contracts/world";
import { createGameSession, type CreateGameSessionOptions } from "../session/session";
import {
  buildProgressSavePayload,
  loadProgressPayloadFromStorage,
  migrateProgressSavePayload,
  saveProgressPayloadToStorage,
  sanitizeMerchantProgress,
  sanitizeQuestProgressState,
  sanitizeUnlockFlags
} from "../session/save";
import { getQaFlag, setQaFlag } from "../session/qa";

declare global {
  interface Window {
    GameSessionRuntime?: {
      createGameSession: (options: CreateGameSessionOptions) => GameSession;
      setActiveSession: (session: GameSession | null) => GameSession | null;
      getSession: () => GameSession | null;
      resolveCurrentWorldId: () => string;
      resolveDefaultSpawn: (worldId?: string) => Point3;
      buildProgressSavePayload: (options: {
        saveVersion: number;
        reason: string;
        session: GameSession;
        playerSkills: Record<string, { xp: number; level: number }>;
        inventory: Array<SerializedItemSlot | null>;
        bankItems: Array<SerializedItemSlot | null>;
        equipment: Record<string, string | null>;
        userItemPrefs: Record<string, string>;
        contentGrants: Record<string, Record<string, boolean> | undefined>;
        quests: QuestProgressState;
        profile: {
          name: string;
          creationCompleted: boolean;
          createdAt: number | null;
          lastStartedAt: number | null;
          tutorialStep: number;
          tutorialCompletedAt: number | null;
          tutorialBankDepositSource: string | null;
          tutorialBankWithdrawSource: string | null;
        };
        appearance: SaveAppearanceState | null;
      }) => ProgressSavePayload;
      migrateProgressSavePayload: (payload: unknown, currentVersion: number) => ProgressSavePayload | null;
      saveProgressPayloadToStorage: (options: {
        storage: StorageLike;
        storageKey: string;
        payload: ProgressSavePayload;
      }) => ProgressSaveWriteResult;
      loadProgressPayloadFromStorage: (options: {
        storage: StorageLike;
        storageKey: string;
        currentVersion: number;
      }) => ProgressSaveReadResult;
      sanitizeUnlockFlags: (savedFlags: unknown, defaultUnlockFlags: PlayerUnlockFlags) => PlayerUnlockFlags;
      sanitizeMerchantProgress: (savedProgress: unknown) => Record<string, unknown>;
      sanitizeQuestProgressState: (savedQuests: unknown) => QuestProgressState;
      getQaFlag: (flagId: string, fallback?: boolean) => boolean;
      setQaFlag: (flagId: string, enabled: boolean) => boolean;
      bindWindowQaBooleanFlag: (windowKey: string, flagId: string, fallback?: boolean) => void;
    };
    getGameSession?: () => GameSession | null;
  }
}

let activeSession: GameSession | null = null;

function resolveCurrentWorldId(): string {
  if (activeSession && typeof activeSession.currentWorldId === "string" && activeSession.currentWorldId) {
    return activeSession.currentWorldId;
  }
  if (window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getCurrentWorldId === "function") {
    return window.WorldBootstrapRuntime.getCurrentWorldId();
  }
  return "starter_town";
}

function resolveDefaultSpawn(worldId?: string): Point3 {
  if (window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getDefaultSpawn === "function") {
    return window.WorldBootstrapRuntime.getDefaultSpawn(worldId || resolveCurrentWorldId());
  }
  return { x: 205, y: 210, z: 0 };
}

function getActiveQaFlag(flagId: string, fallback = false): boolean {
  if (!activeSession) return fallback;
  return getQaFlag(activeSession.qa, flagId, fallback);
}

function setActiveQaFlag(flagId: string, enabled: boolean): boolean {
  if (!activeSession) return false;
  return setQaFlag(activeSession.qa, flagId, enabled);
}

function bindWindowQaBooleanFlag(windowKey: string, flagId: string, fallback = false): void {
  if (!windowKey || !flagId) return;
  Object.defineProperty(window, windowKey, {
    configurable: true,
    enumerable: true,
    get() {
      return getActiveQaFlag(flagId, fallback);
    },
    set(value: unknown) {
      setActiveQaFlag(flagId, !!value);
    }
  });
}

export function exposeSessionBridge(): void {
  window.getGameSession = () => activeSession;
  window.GameSessionRuntime = {
    createGameSession: (options: CreateGameSessionOptions) => createGameSession(options),
    setActiveSession: (session: GameSession | null) => {
      activeSession = session;
      return activeSession;
    },
    getSession: () => activeSession,
    resolveCurrentWorldId,
    resolveDefaultSpawn,
    buildProgressSavePayload,
    migrateProgressSavePayload,
    saveProgressPayloadToStorage,
    loadProgressPayloadFromStorage,
    sanitizeUnlockFlags,
    sanitizeMerchantProgress,
    sanitizeQuestProgressState,
    getQaFlag: getActiveQaFlag,
    setQaFlag: setActiveQaFlag,
    bindWindowQaBooleanFlag
  };
}
