import type { GameSessionQaState } from "../contracts/session";

export function createDefaultQaState(): GameSessionQaState {
  return {
    flags: {}
  };
}

export function getQaFlag(state: GameSessionQaState, flagId: string, fallback = false): boolean {
  if (!flagId) return fallback;
  if (!state.flags || typeof state.flags !== "object") state.flags = {};
  if (state.flags[flagId] === undefined) state.flags[flagId] = !!fallback;
  return !!state.flags[flagId];
}

export function setQaFlag(state: GameSessionQaState, flagId: string, enabled: boolean): boolean {
  if (!flagId) return false;
  if (!state.flags || typeof state.flags !== "object") state.flags = {};
  state.flags[flagId] = !!enabled;
  return true;
}
