import type { Point3 } from "./world";

export interface PlayerUnlockFlags {
  [flagId: string]: boolean | undefined;
}

export interface MerchantProgressEntry {
  soldCounts: Record<string, number>;
  unlockedItems: Record<string, boolean>;
}

export interface MerchantProgressState {
  [merchantId: string]: MerchantProgressEntry | undefined;
}

export interface PlayerSkillState {
  xp: number;
  level: number;
}

export interface PlayerSkillMap {
  [skillId: string]: PlayerSkillState | undefined;
}

export interface ContentGrantState {
  [grantId: string]: Record<string, boolean> | undefined;
}

export interface GameSessionPlayerState extends Point3 {
  prevX: number;
  prevY: number;
  midX: number | null;
  midY: number | null;
  targetX: number;
  targetY: number;
  targetRotation: number;
  path: unknown[];
  action: string;
  targetObj: string | null;
  pendingActionAfterTurn: string | null;
  turnLock: boolean;
  actionVisualReady: boolean;
  actionUntilTick: number;
  currentHitpoints: number;
  eatingCooldownEndTick: number;
  lastAttackTick: number;
  lastCastTick: number;
  firemakingTarget: unknown;
  pendingSkillStart: Record<string, unknown> | null;
  unlockFlags: PlayerUnlockFlags;
  merchantProgress: MerchantProgressState;
  [key: string]: unknown;
}

export interface PlayerProfileState {
  name: string;
  creationCompleted: boolean;
  createdAt: number | null;
  lastStartedAt: number | null;
}

export interface SaveAppearanceState {
  gender: number;
  colors: number[];
}

export interface PlayerEntryFlowState {
  isOpen: boolean;
  hasLoadedSave: boolean;
  saveWasLegacyProfile: boolean;
  loadReason: string;
  savedAt: number | null;
  sessionActivated: boolean;
  unloadSaveHooksRegistered: boolean;
  uiBound: boolean;
}

export interface GameSessionRuntimeState {
  currentWorldId: string;
  defaultSpawn: Point3;
  playerEntryFlow: PlayerEntryFlowState;
}

export interface GameSessionUiState {
  runMode: boolean;
}

export interface GameSessionQaState {
  flags: Record<string, boolean>;
}

export interface GameSessionProgressState {
  profile: PlayerProfileState;
  playerSkills: PlayerSkillMap;
  inventory: unknown[];
  bankItems: unknown[];
  equipment: Record<string, unknown>;
  userItemPrefs: Record<string, string>;
  contentGrants: ContentGrantState;
  appearance: SaveAppearanceState | null;
}

export interface GameSession {
  currentWorldId: string;
  player: GameSessionPlayerState;
  progress: GameSessionProgressState;
  runtime: GameSessionRuntimeState;
  ui: GameSessionUiState;
  qa: GameSessionQaState;
}

export interface SerializedItemSlot {
  itemId: string;
  amount: number;
}

export interface ProgressSavePlayerState extends Point3 {
  targetRotation: number;
  currentHitpoints: number;
  eatingCooldownEndTick: number;
  unlockFlags: PlayerUnlockFlags;
  merchantProgress: MerchantProgressState;
}

export interface ProgressSaveState {
  worldId: string;
  playerState: ProgressSavePlayerState;
  playerSkills: PlayerSkillMap;
  inventory: Array<SerializedItemSlot | null>;
  bankItems: Array<SerializedItemSlot | null>;
  equipment: Record<string, string | null>;
  userItemPrefs: Record<string, string>;
  contentGrants: ContentGrantState;
  runMode: boolean;
  profile: PlayerProfileState;
  appearance: SaveAppearanceState | null;
}

export interface ProgressSavePayload {
  version: number;
  savedAt: number;
  reason: string;
  state: ProgressSaveState;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface ProgressSaveReadResult {
  loaded: boolean;
  reason: string;
  payload?: ProgressSavePayload;
  error?: unknown;
}

export interface ProgressSaveWriteResult {
  ok: boolean;
  reason?: string;
  error?: unknown;
}
