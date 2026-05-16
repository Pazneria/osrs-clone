import type {
  AnimationClip,
  AnimationEaseId,
  AnimationHeldItemMap,
  AnimationHeldItemSlot,
  AnimationMaskId,
  AnimationResolvedPose,
  AnimationResolvedTransform,
  AnimationRigSchema,
  AnimationTimeSummary,
  AnimationTransform,
  AnimationVector3
} from "../contracts/animation";
import { applyAnimationEase } from "./easing";

const VALID_EASES: ReadonlySet<AnimationEaseId> = new Set(["linear", "easeIn", "easeOut", "easeInOut", "hold"]);
const VALID_MASKS: ReadonlySet<AnimationMaskId> = new Set(["fullBody", "upperBody"]);
const VALID_HELD_ITEM_SLOTS: ReadonlySet<AnimationHeldItemSlot> = new Set(["rightHand", "leftHand"]);
const DEFAULT_SCALE = Object.freeze({ x: 1, y: 1, z: 1 });
const DEFAULT_ZERO = Object.freeze({ x: 0, y: 0, z: 0 });

function validateHeldItemMap(heldItems: AnimationHeldItemMap | null | undefined, errors: string[]): void {
  if (heldItems === undefined || heldItems === null) return;
  if (typeof heldItems !== "object" || Array.isArray(heldItems)) {
    errors.push("heldItems must be an object or null");
    return;
  }
  const slotIds = Object.keys(heldItems);
  for (let index = 0; index < slotIds.length; index += 1) {
    const slotId = slotIds[index];
    if (!VALID_HELD_ITEM_SLOTS.has(slotId as AnimationHeldItemSlot)) {
      errors.push(`heldItems uses unknown slot ${slotId}`);
      continue;
    }
    const heldItemId = heldItems[slotId as AnimationHeldItemSlot];
    if (heldItemId !== undefined && heldItemId !== null && typeof heldItemId !== "string") {
      errors.push(`heldItems.${slotId} must be a string or null`);
    }
  }
}

export function cloneAnimationClip<T extends AnimationClip>(clip: T): T {
  return JSON.parse(JSON.stringify(clip)) as T;
}

function resolveAxis(source: AnimationVector3 | undefined, axis: "x" | "y" | "z", fallback: number): number {
  const value = source?.[axis];
  return Number.isFinite(value) ? Number(value) : fallback;
}

function createResolvedTransform(base?: AnimationResolvedTransform, override?: AnimationTransform): AnimationResolvedTransform {
  const bind = base || {
    position: DEFAULT_ZERO,
    rotationDeg: DEFAULT_ZERO,
    scale: DEFAULT_SCALE
  };
  return {
    position: {
      x: resolveAxis(override?.position, "x", bind.position.x),
      y: resolveAxis(override?.position, "y", bind.position.y),
      z: resolveAxis(override?.position, "z", bind.position.z)
    },
    rotationDeg: {
      x: resolveAxis(override?.rotationDeg, "x", bind.rotationDeg.x),
      y: resolveAxis(override?.rotationDeg, "y", bind.rotationDeg.y),
      z: resolveAxis(override?.rotationDeg, "z", bind.rotationDeg.z)
    },
    scale: {
      x: resolveAxis(override?.scale, "x", bind.scale.x),
      y: resolveAxis(override?.scale, "y", bind.scale.y),
      z: resolveAxis(override?.scale, "z", bind.scale.z)
    }
  };
}

function lerp(from: number, to: number, t: number): number {
  return from + ((to - from) * t);
}

function lerpResolvedTransform(
  from: AnimationResolvedTransform,
  to: AnimationResolvedTransform,
  easedT: number
): AnimationResolvedTransform {
  return {
    position: {
      x: lerp(from.position.x, to.position.x, easedT),
      y: lerp(from.position.y, to.position.y, easedT),
      z: lerp(from.position.z, to.position.z, easedT)
    },
    rotationDeg: {
      x: lerp(from.rotationDeg.x, to.rotationDeg.x, easedT),
      y: lerp(from.rotationDeg.y, to.rotationDeg.y, easedT),
      z: lerp(from.rotationDeg.z, to.rotationDeg.z, easedT)
    },
    scale: {
      x: lerp(from.scale.x, to.scale.x, easedT),
      y: lerp(from.scale.y, to.scale.y, easedT),
      z: lerp(from.scale.z, to.scale.z, easedT)
    }
  };
}

function getMaskNodes(schema: AnimationRigSchema, maskId: AnimationMaskId): Set<string> {
  return new Set(schema.masks[maskId] || []);
}

function normalizeTimeMs(clip: AnimationClip, timeMs: number): number {
  if (clip.durationMs <= 0) return 0;
  if (clip.loopMode === "loop") {
    const value = timeMs % clip.durationMs;
    return value < 0 ? value + clip.durationMs : value;
  }
  return Math.max(0, Math.min(clip.durationMs, timeMs));
}

export function validateAnimationClip(clip: AnimationClip, schema: AnimationRigSchema): string[] {
  const errors: string[] = [];
  if (!clip || typeof clip !== "object") return ["clip must be an object"];
  if (!clip.clipId || typeof clip.clipId !== "string") errors.push("clipId must be a non-empty string");
  if (clip.rigId !== schema.rigId) errors.push(`rigId must equal ${schema.rigId}`);
  if (!Number.isFinite(clip.durationMs) || clip.durationMs <= 0) errors.push("durationMs must be > 0");
  if (clip.loopMode !== "loop" && clip.loopMode !== "once") errors.push("loopMode must be loop or once");
  if (!VALID_MASKS.has(clip.maskId)) errors.push("maskId must be fullBody or upperBody");
  validateHeldItemMap(clip.heldItems, errors);
  if (clip.heldItemId !== undefined && clip.heldItemId !== null && typeof clip.heldItemId !== "string") {
    errors.push("heldItemId must be a string or null");
  }
  if (
    clip.heldItemSlot !== undefined
    && clip.heldItemSlot !== null
    && !VALID_HELD_ITEM_SLOTS.has(clip.heldItemSlot)
  ) {
    errors.push("heldItemSlot must be rightHand, leftHand, or null");
  }
  if (!clip.poses || typeof clip.poses !== "object") errors.push("poses must be an object");
  if (!Array.isArray(clip.keys) || clip.keys.length === 0) errors.push("keys must be a non-empty array");
  if (!Array.isArray(clip.markers)) errors.push("markers must be an array");
  if (errors.length > 0) return errors;

  const poseIds = new Set(Object.keys(clip.poses));
  let previousKeyTime = -Infinity;
  for (let i = 0; i < clip.keys.length; i += 1) {
    const key = clip.keys[i];
    if (!key || typeof key.poseId !== "string" || !poseIds.has(key.poseId)) {
      errors.push(`key[${i}] references unknown poseId`);
    }
    if (!Number.isFinite(key.atMs)) {
      errors.push(`key[${i}] atMs must be finite`);
    } else if (key.atMs < previousKeyTime) {
      errors.push(`key[${i}] atMs must be sorted`);
    }
    if (!VALID_EASES.has(key.ease)) errors.push(`key[${i}] ease must be valid`);
    previousKeyTime = Number.isFinite(key.atMs) ? key.atMs : previousKeyTime;
  }

  for (let i = 0; i < clip.markers.length; i += 1) {
    const marker = clip.markers[i];
    if (!marker || typeof marker.markerId !== "string" || !marker.markerId.trim()) {
      errors.push(`marker[${i}] markerId must be a non-empty string`);
    }
    if (!Number.isFinite(marker.atMs) || marker.atMs < 0 || marker.atMs > clip.durationMs) {
      errors.push(`marker[${i}] atMs must fall within clip duration`);
    }
  }

  const allowedNodes = new Set(schema.nodeOrder);
  const allowedChannels = new Set(["position", "rotationDeg", "scale"]);
  const poseEntries = Object.entries(clip.poses);
  for (let i = 0; i < poseEntries.length; i += 1) {
    const [poseId, pose] = poseEntries[i];
    if (!pose || typeof pose !== "object") {
      errors.push(`pose ${poseId} must be an object`);
      continue;
    }
    const nodeEntries = Object.entries(pose);
    for (let j = 0; j < nodeEntries.length; j += 1) {
      const [nodeId, transform] = nodeEntries[j];
      if (!allowedNodes.has(nodeId)) {
        errors.push(`pose ${poseId} uses unknown node ${nodeId}`);
        continue;
      }
      if (!transform || typeof transform !== "object") {
        errors.push(`pose ${poseId}.${nodeId} must be an object`);
        continue;
      }
      const channelNames = Object.keys(transform);
      for (let k = 0; k < channelNames.length; k += 1) {
        const channel = channelNames[k];
        if (!allowedChannels.has(channel)) {
          errors.push(`pose ${poseId}.${nodeId} uses unknown channel ${channel}`);
        }
      }
    }
  }

  return errors;
}

function createEmptyResolvedPose(schema: AnimationRigSchema): AnimationResolvedPose {
  return schema.nodeOrder.reduce<AnimationResolvedPose>((acc, nodeId) => {
    acc[nodeId] = createResolvedTransform(undefined, undefined);
    return acc;
  }, {});
}

export function buildBindFallbackPose(schema: AnimationRigSchema): AnimationResolvedPose {
  return createEmptyResolvedPose(schema);
}

export function resolveClipTimeSummary(clip: AnimationClip, timeMs: number): AnimationTimeSummary {
  const normalizedTime = normalizeTimeMs(clip, timeMs);
  let previousKeyIndex = 0;
  let nextKeyIndex = Math.max(0, clip.keys.length - 1);

  for (let i = 0; i < clip.keys.length; i += 1) {
    const currentKey = clip.keys[i];
    if (normalizedTime >= currentKey.atMs) previousKeyIndex = i;
    if (normalizedTime <= currentKey.atMs) {
      nextKeyIndex = i;
      break;
    }
  }

  const activeMarkerIds = clip.markers
    .filter((marker) => marker.atMs <= normalizedTime)
    .sort((a, b) => b.atMs - a.atMs)
    .slice(0, 3)
    .map((marker) => marker.markerId);

  return {
    timeMs: normalizedTime,
    previousKeyIndex,
    nextKeyIndex,
    previousPoseId: clip.keys[previousKeyIndex]?.poseId || null,
    nextPoseId: clip.keys[nextKeyIndex]?.poseId || null,
    activeMarkerIds
  };
}

export function sampleAnimationClip(
  clip: AnimationClip,
  schema: AnimationRigSchema,
  bindPose: AnimationResolvedPose,
  timeMs: number
): AnimationResolvedPose {
  const normalizedTime = normalizeTimeMs(clip, timeMs);
  const resolved = createEmptyResolvedPose(schema);
  const maskNodes = getMaskNodes(schema, clip.maskId);
  const summary = resolveClipTimeSummary(clip, normalizedTime);
  const previousKey = clip.keys[summary.previousKeyIndex] || clip.keys[0];
  const nextKey = clip.keys[summary.nextKeyIndex] || previousKey;
  const sameKey = previousKey.atMs === nextKey.atMs || summary.previousKeyIndex === summary.nextKeyIndex;
  const duration = Math.max(1, nextKey.atMs - previousKey.atMs);
  const rawT = sameKey ? 0 : ((normalizedTime - previousKey.atMs) / duration);
  const easedT = applyAnimationEase(previousKey.ease, rawT);

  for (let i = 0; i < schema.nodeOrder.length; i += 1) {
    const nodeId = schema.nodeOrder[i];
    const bindNode = bindPose[nodeId] || createResolvedTransform(undefined, undefined);
    if (!maskNodes.has(nodeId)) {
      resolved[nodeId] = bindNode;
      continue;
    }
    const fromPose = clip.poses[previousKey.poseId]?.[nodeId];
    const toPose = clip.poses[nextKey.poseId]?.[nodeId];
    const fromResolved = createResolvedTransform(bindNode, fromPose);
    const toResolved = createResolvedTransform(bindNode, toPose);
    resolved[nodeId] = previousKey.ease === "hold" || sameKey
      ? fromResolved
      : lerpResolvedTransform(fromResolved, toResolved, easedT);
  }

  return resolved;
}

export function layerResolvedPose(
  basePose: AnimationResolvedPose,
  overlayPose: AnimationResolvedPose,
  schema: AnimationRigSchema,
  maskId: AnimationMaskId
): AnimationResolvedPose {
  const layered = createEmptyResolvedPose(schema);
  const maskNodes = getMaskNodes(schema, maskId);
  for (let i = 0; i < schema.nodeOrder.length; i += 1) {
    const nodeId = schema.nodeOrder[i];
    layered[nodeId] = maskNodes.has(nodeId) ? overlayPose[nodeId] : basePose[nodeId];
  }
  return layered;
}

export function renamePoseInClip(clip: AnimationClip, previousPoseId: string, nextPoseId: string): AnimationClip {
  const nextClip = cloneAnimationClip(clip);
  if (!nextClip.poses[previousPoseId] || !nextPoseId.trim()) return nextClip;
  const nextPoses = { ...nextClip.poses };
  nextPoses[nextPoseId] = nextPoses[previousPoseId];
  delete nextPoses[previousPoseId];
  nextClip.poses = nextPoses;
  nextClip.keys = nextClip.keys.map((key) => (key.poseId === previousPoseId ? { ...key, poseId: nextPoseId } : key));
  return nextClip;
}

export function resetPoseNodeToBindPose(
  clip: AnimationClip,
  poseId: string,
  nodeId: string,
  bindPose: AnimationResolvedPose
): AnimationClip {
  const nextClip = cloneAnimationClip(clip);
  const pose = nextClip.poses[poseId];
  if (!pose) return nextClip;
  const nextPose = { ...pose };
  delete nextPose[nodeId];
  nextClip.poses = {
    ...nextClip.poses,
    [poseId]: nextPose
  };
  void bindPose;
  return nextClip;
}

export function sortClipKeysAndMarkers(clip: AnimationClip): AnimationClip {
  const nextClip = cloneAnimationClip(clip);
  nextClip.keys.sort((a, b) => a.atMs - b.atMs);
  nextClip.markers.sort((a, b) => a.atMs - b.atMs);
  return nextClip;
}

export function serializeAnimationClip(clip: AnimationClip): string {
  return `${JSON.stringify(sortClipKeysAndMarkers(clip), null, 2)}\n`;
}
