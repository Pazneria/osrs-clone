import type {
  CombatOnHitEffectProfile,
  CombatStatusEffectId,
  CombatStatusEffectState
} from "../contracts/combat";

type StatusEffectCarrier = {
  statusEffects?: Partial<Record<CombatStatusEffectId, CombatStatusEffectState>>;
  remainingAttackCooldown?: number;
};

export interface ActiveCombatStatusEffect {
  effectId: CombatStatusEffectId;
  remainingTicks: number;
  enemyAttackCooldownPenalty: number;
}

function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.floor(numeric)));
}

export function cloneCombatOnHitEffectProfile(
  effect: CombatOnHitEffectProfile | null | undefined
): CombatOnHitEffectProfile | null {
  if (!effect || effect.effectId !== "chilled") return null;
  return {
    effectId: "chilled",
    durationTicks: clampInteger(effect.durationTicks, 1, 12, 2),
    enemyAttackCooldownPenalty: clampInteger(effect.enemyAttackCooldownPenalty, 0, 4, 1)
  };
}

export function createEnemyStatusEffects(): Partial<Record<CombatStatusEffectId, CombatStatusEffectState>> {
  return {};
}

export function clearEnemyStatusEffects(enemyState: StatusEffectCarrier | null | undefined): void {
  if (!enemyState) return;
  enemyState.statusEffects = createEnemyStatusEffects();
}

export function pruneExpiredEnemyStatusEffects(
  enemyState: StatusEffectCarrier | null | undefined,
  currentTick: number
): void {
  if (!enemyState || !enemyState.statusEffects) return;
  const tick = clampInteger(currentTick, 0, Number.MAX_SAFE_INTEGER, 0);
  const effectIds = Object.keys(enemyState.statusEffects) as CombatStatusEffectId[];
  for (let index = 0; index < effectIds.length; index += 1) {
    const effectId = effectIds[index];
    const effect = enemyState.statusEffects[effectId];
    if (!effect || !Number.isFinite(effect.expiresAtTick) || effect.expiresAtTick <= tick) {
      delete enemyState.statusEffects[effectId];
    }
  }
}

export function applyEnemyStatusEffect(
  enemyState: StatusEffectCarrier | null | undefined,
  effect: CombatOnHitEffectProfile | null | undefined,
  currentTick: number
): ActiveCombatStatusEffect | null {
  if (!enemyState) return null;
  const normalizedEffect = cloneCombatOnHitEffectProfile(effect);
  if (!normalizedEffect) return null;

  const tick = clampInteger(currentTick, 0, Number.MAX_SAFE_INTEGER, 0);
  pruneExpiredEnemyStatusEffects(enemyState, tick);
  const statusEffects = enemyState.statusEffects || createEnemyStatusEffects();
  const existing = statusEffects[normalizedEffect.effectId];
  const effectState: CombatStatusEffectState = {
    effectId: normalizedEffect.effectId,
    expiresAtTick: Math.max(
      tick + normalizedEffect.durationTicks,
      existing && Number.isFinite(existing.expiresAtTick) ? Math.floor(existing.expiresAtTick) : 0
    ),
    enemyAttackCooldownPenalty: Math.max(
      normalizedEffect.enemyAttackCooldownPenalty,
      existing && Number.isFinite(existing.enemyAttackCooldownPenalty)
        ? Math.max(0, Math.floor(existing.enemyAttackCooldownPenalty))
        : 0
    )
  };
  statusEffects[effectState.effectId] = effectState;
  enemyState.statusEffects = statusEffects;

  const currentCooldown = clampInteger(enemyState.remainingAttackCooldown, 0, Number.MAX_SAFE_INTEGER, 0);
  if (currentCooldown > 0 && effectState.enemyAttackCooldownPenalty > 0) {
    enemyState.remainingAttackCooldown = currentCooldown + effectState.enemyAttackCooldownPenalty;
  }

  return {
    effectId: effectState.effectId,
    remainingTicks: Math.max(0, effectState.expiresAtTick - tick),
    enemyAttackCooldownPenalty: effectState.enemyAttackCooldownPenalty
  };
}

export function getEnemyAttackCooldownPenalty(
  enemyState: StatusEffectCarrier | null | undefined,
  currentTick: number
): number {
  if (!enemyState) return 0;
  pruneExpiredEnemyStatusEffects(enemyState, currentTick);
  const statusEffects = enemyState.statusEffects || {};
  return Object.values(statusEffects).reduce((total, effect) => (
    total + clampInteger(effect && effect.enemyAttackCooldownPenalty, 0, 4, 0)
  ), 0);
}

export function listActiveEnemyStatusEffects(
  enemyState: StatusEffectCarrier | null | undefined,
  currentTick: number
): ActiveCombatStatusEffect[] {
  if (!enemyState) return [];
  const tick = clampInteger(currentTick, 0, Number.MAX_SAFE_INTEGER, 0);
  pruneExpiredEnemyStatusEffects(enemyState, tick);
  const statusEffects = enemyState.statusEffects || {};
  return Object.values(statusEffects)
    .filter((effect): effect is CombatStatusEffectState => !!effect && effect.expiresAtTick > tick)
    .map((effect) => ({
      effectId: effect.effectId,
      remainingTicks: Math.max(0, Math.floor(effect.expiresAtTick) - tick),
      enemyAttackCooldownPenalty: clampInteger(effect.enemyAttackCooldownPenalty, 0, 4, 0)
    }))
    .sort((left, right) => left.effectId.localeCompare(right.effectId));
}
