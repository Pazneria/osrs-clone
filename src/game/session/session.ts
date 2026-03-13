import type { Point3 } from "../contracts/world";
import type { GameSession, PlayerUnlockFlags } from "../contracts/session";
import { createDefaultPlayerState } from "./player";
import { createDefaultProgressState } from "./progress";
import { createDefaultQaState } from "./qa";
import { createDefaultRuntimeState, createDefaultUiState } from "./runtime";

export interface CreateGameSessionOptions {
  currentWorldId: string;
  defaultSpawn: Point3;
  defaultUnlockFlags: PlayerUnlockFlags;
  inventorySize: number;
  bankSize: number;
}

export function createGameSession(options: CreateGameSessionOptions): GameSession {
  return {
    currentWorldId: options.currentWorldId,
    player: createDefaultPlayerState(options.defaultSpawn, options.defaultUnlockFlags),
    progress: createDefaultProgressState({
      inventorySize: options.inventorySize,
      bankSize: options.bankSize
    }),
    runtime: createDefaultRuntimeState(options.currentWorldId, options.defaultSpawn),
    ui: createDefaultUiState(),
    qa: createDefaultQaState()
  };
}
