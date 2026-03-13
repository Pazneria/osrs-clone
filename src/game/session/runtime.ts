import type { Point3 } from "../contracts/world";
import type {
  GameSessionRuntimeState,
  GameSessionUiState,
  PlayerEntryFlowState
} from "../contracts/session";

export function createDefaultPlayerEntryFlowState(): PlayerEntryFlowState {
  return {
    isOpen: false,
    hasLoadedSave: false,
    saveWasLegacyProfile: false,
    loadReason: "startup",
    savedAt: null,
    sessionActivated: false,
    unloadSaveHooksRegistered: false,
    uiBound: false
  };
}

export function createDefaultRuntimeState(
  currentWorldId: string,
  defaultSpawn: Point3
): GameSessionRuntimeState {
  return {
    currentWorldId,
    defaultSpawn: { x: defaultSpawn.x, y: defaultSpawn.y, z: defaultSpawn.z },
    playerEntryFlow: createDefaultPlayerEntryFlowState()
  };
}

export function createDefaultUiState(): GameSessionUiState {
  return {
    runMode: false
  };
}
