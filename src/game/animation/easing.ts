import type { AnimationEaseId } from "../contracts/animation";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function applyAnimationEase(ease: AnimationEaseId, value: number): number {
  const t = clamp01(value);
  if (ease === "hold") return 0;
  if (ease === "linear") return t;
  if (ease === "easeIn") return t * t;
  if (ease === "easeOut") return 1 - ((1 - t) * (1 - t));
  return t * t * (3 - (2 * t));
}

