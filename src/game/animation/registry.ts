import type { AnimationClip, AnimationClipDescriptor } from "../contracts/animation";
import { validateAnimationClip, cloneAnimationClip, serializeAnimationClip } from "./clip-utils";
import { getAnimationRigSchema } from "./schema";

import idleClipJson from "./clips/player/idle.json";
import walkClipJson from "./clips/player/walk.json";
import runClipJson from "./clips/player/run.json";
import combatSlashClipJson from "./clips/player/combat_slash.json";
import hitRecoilClipJson from "./clips/player/hit_recoil.json";

interface AnimationClipRecord {
  descriptor: AnimationClipDescriptor;
  clip: AnimationClip;
}

const clipRecords: AnimationClipRecord[] = [
  {
    descriptor: {
      clipId: "player/idle",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/idle.json"
    },
    clip: idleClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/walk",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/walk.json"
    },
    clip: walkClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/run",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/run.json"
    },
    clip: runClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/combat_slash",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/combat_slash.json"
    },
    clip: combatSlashClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/hit_recoil",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/hit_recoil.json"
    },
    clip: hitRecoilClipJson as AnimationClip
  }
];

const clipMap = new Map<string, AnimationClipRecord>();

for (let i = 0; i < clipRecords.length; i += 1) {
  const record = clipRecords[i];
  const schema = getAnimationRigSchema(record.descriptor.rigId);
  if (!schema) throw new Error(`Missing animation rig schema for ${record.descriptor.rigId}`);
  const errors = validateAnimationClip(record.clip, schema);
  if (errors.length > 0) {
    throw new Error(`Invalid animation clip ${record.descriptor.clipId}: ${errors.join("; ")}`);
  }
  clipMap.set(record.descriptor.clipId, {
    descriptor: { ...record.descriptor },
    clip: cloneAnimationClip(record.clip)
  });
}

export function listAnimationClipDescriptors(): AnimationClipDescriptor[] {
  return Array.from(clipMap.values()).map((record) => ({ ...record.descriptor }));
}

export function getAnimationClip(clipId: string): AnimationClip | null {
  const record = clipMap.get(clipId);
  return record ? cloneAnimationClip(record.clip) : null;
}

export function getAnimationClipDescriptor(clipId: string): AnimationClipDescriptor | null {
  const record = clipMap.get(clipId);
  return record ? { ...record.descriptor } : null;
}

export function replaceAnimationClip(nextClip: AnimationClip): AnimationClip {
  const descriptor = getAnimationClipDescriptor(nextClip.clipId);
  if (!descriptor) throw new Error(`Unknown clip ${nextClip.clipId}`);
  const schema = getAnimationRigSchema(nextClip.rigId);
  if (!schema) throw new Error(`Unknown rig ${nextClip.rigId}`);
  const errors = validateAnimationClip(nextClip, schema);
  if (errors.length > 0) throw new Error(`Invalid animation clip ${nextClip.clipId}: ${errors.join("; ")}`);
  const stored = cloneAnimationClip(nextClip);
  clipMap.set(nextClip.clipId, {
    descriptor,
    clip: stored
  });
  return cloneAnimationClip(stored);
}

export function exportAnimationClip(clipId: string): string | null {
  const clip = getAnimationClip(clipId);
  return clip ? serializeAnimationClip(clip) : null;
}

