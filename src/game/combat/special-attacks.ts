import type { PlayerCombatStateShape } from "../contracts/combat";
import type { PlayerCombatSnapshot } from "./formulas";

export const PLAYER_SPECIAL_ATTACK_ID = "power_strike";
export const PLAYER_SPECIAL_ATTACK_LABEL = "Power Strike";
export const PLAYER_SPECIAL_ATTACK_COOLDOWN_TICKS = 8;
export const PLAYER_SPECIAL_ATTACK_ACCURACY_MULTIPLIER = 1.25;
export const PLAYER_SPECIAL_ATTACK_MAX_HIT_MULTIPLIER = 1.25;

export type PlayerSpecialAttackRequestReason = "queued" | "already_queued" | "cooldown" | "no_target" | "cannot_attack";

export interface PlayerSpecialAttackRequestResult {
  accepted: boolean;
  reason: PlayerSpecialAttackRequestReason;
  cooldownTicks: number;
}

export interface PlayerSpecialAttackViewModel {
  label: string;
  description: string;
  cooldownTicks: number;
  queued: boolean;
  ready: boolean;
  statusText: string;
}

type PlayerSpecialAttackState = Pick<PlayerCombatStateShape, "specialAttackCooldown" | "specialAttackQueued">;

function clampTicks(value: unknown): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : 0;
}

export function normalizePlayerSpecialAttackState(state: Partial<PlayerSpecialAttackState> | null | undefined): PlayerSpecialAttackState {
  return {
    specialAttackCooldown: clampTicks(state && state.specialAttackCooldown),
    specialAttackQueued: !!(state && state.specialAttackQueued)
  };
}

export function queuePlayerSpecialAttack(
  state: PlayerSpecialAttackState,
  options: { hasTarget?: boolean; canAttack?: boolean } = {}
): PlayerSpecialAttackRequestResult {
  const normalized = normalizePlayerSpecialAttackState(state);
  state.specialAttackCooldown = normalized.specialAttackCooldown;
  state.specialAttackQueued = normalized.specialAttackQueued;

  if (!options.hasTarget) {
    return { accepted: false, reason: "no_target", cooldownTicks: state.specialAttackCooldown };
  }
  if (!options.canAttack) {
    return { accepted: false, reason: "cannot_attack", cooldownTicks: state.specialAttackCooldown };
  }
  if (state.specialAttackQueued) {
    return { accepted: false, reason: "already_queued", cooldownTicks: state.specialAttackCooldown };
  }
  if (state.specialAttackCooldown > 0) {
    return { accepted: false, reason: "cooldown", cooldownTicks: state.specialAttackCooldown };
  }

  state.specialAttackQueued = true;
  state.specialAttackCooldown = PLAYER_SPECIAL_ATTACK_COOLDOWN_TICKS;
  return { accepted: true, reason: "queued", cooldownTicks: state.specialAttackCooldown };
}

export function consumeQueuedPlayerSpecialAttack(state: PlayerSpecialAttackState): boolean {
  const normalized = normalizePlayerSpecialAttackState(state);
  state.specialAttackCooldown = normalized.specialAttackCooldown;
  state.specialAttackQueued = false;
  return normalized.specialAttackQueued;
}

export function clearQueuedPlayerSpecialAttack(state: PlayerSpecialAttackState): boolean {
  return consumeQueuedPlayerSpecialAttack(state);
}

export function hasQueuedPlayerSpecialAttack(state: Partial<PlayerSpecialAttackState> | null | undefined): boolean {
  return normalizePlayerSpecialAttackState(state).specialAttackQueued;
}

export function applyPlayerSpecialAttack(snapshot: PlayerCombatSnapshot): PlayerCombatSnapshot {
  return {
    ...snapshot,
    attackValue: Math.max(1, Math.ceil(snapshot.attackValue * PLAYER_SPECIAL_ATTACK_ACCURACY_MULTIPLIER)),
    maxHit: Math.max(1, Math.ceil(snapshot.maxHit * PLAYER_SPECIAL_ATTACK_MAX_HIT_MULTIPLIER))
  };
}

export function buildPlayerSpecialAttackViewModel(
  state: Partial<PlayerSpecialAttackState> | null | undefined
): PlayerSpecialAttackViewModel {
  const normalized = normalizePlayerSpecialAttackState(state);
  const ready = !normalized.specialAttackQueued && normalized.specialAttackCooldown === 0;
  const statusText = normalized.specialAttackQueued
    ? "Armed for next hit"
    : (ready
      ? "Ready"
      : `${normalized.specialAttackCooldown} tick${normalized.specialAttackCooldown === 1 ? "" : "s"} to recharge`);

  return {
    label: PLAYER_SPECIAL_ATTACK_LABEL,
    description: "Next hit gains +25% accuracy and max hit. Recharges in 8 ticks.",
    cooldownTicks: normalized.specialAttackCooldown,
    queued: normalized.specialAttackQueued,
    ready,
    statusText
  };
}
