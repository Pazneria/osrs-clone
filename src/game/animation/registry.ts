import type { AnimationClip, AnimationClipDescriptor } from "../contracts/animation";
import { validateAnimationClip, cloneAnimationClip, serializeAnimationClip } from "./clip-utils";
import { getAnimationRigSchema } from "./schema";

import idleClipJson from "./clips/player/idle.json";
import walkClipJson from "./clips/player/walk.json";
import runClipJson from "./clips/player/run.json";
import combatSlashClipJson from "./clips/player/combat_slash.json";
import hitRecoilClipJson from "./clips/player/hit_recoil.json";
import mining1ClipJson from "./clips/player/mining1.json";
import fishingNet1ClipJson from "./clips/player/fishing_net1.json";
import fishingRodHold1ClipJson from "./clips/player/fishing_rod_hold1.json";
import fishingRodCast1ClipJson from "./clips/player/fishing_rod_cast1.json";
import fishingHarpoonHold1ClipJson from "./clips/player/fishing_harpoon_hold1.json";
import fishingHarpoonStrike1ClipJson from "./clips/player/fishing_harpoon_strike1.json";

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
  },
  {
    descriptor: {
      clipId: "player/mining1",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/mining1.json"
    },
    clip: mining1ClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/fishing_net1",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/fishing_net1.json"
    },
    clip: fishingNet1ClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/fishing_rod_hold1",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/fishing_rod_hold1.json"
    },
    clip: fishingRodHold1ClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/fishing_rod_cast1",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/fishing_rod_cast1.json"
    },
    clip: fishingRodCast1ClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/fishing_harpoon_hold1",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/fishing_harpoon_hold1.json"
    },
    clip: fishingHarpoonHold1ClipJson as AnimationClip
  },
  {
    descriptor: {
      clipId: "player/fishing_harpoon_strike1",
      rigId: "player_humanoid_v1",
      sourcePath: "src/game/animation/clips/player/fishing_harpoon_strike1.json"
    },
    clip: fishingHarpoonStrike1ClipJson as AnimationClip
  }
];

const clipMap = new Map<string, AnimationClipRecord>();

function validateDescriptorAndClip(descriptor: AnimationClipDescriptor, clip: AnimationClip): void {
  if (!descriptor.sourcePath || typeof descriptor.sourcePath !== "string") {
    throw new Error("Animation clip descriptor must include a sourcePath");
  }
  if (descriptor.clipId !== clip.clipId) {
    throw new Error(`Descriptor clipId ${descriptor.clipId} does not match clip ${clip.clipId}`);
  }
  if (descriptor.rigId !== clip.rigId) {
    throw new Error(`Descriptor rigId ${descriptor.rigId} does not match clip ${clip.rigId}`);
  }
  const schema = getAnimationRigSchema(descriptor.rigId);
  if (!schema) throw new Error(`Missing animation rig schema for ${descriptor.rigId}`);
  const errors = validateAnimationClip(clip, schema);
  if (errors.length > 0) {
    throw new Error(`Invalid animation clip ${descriptor.clipId}: ${errors.join("; ")}`);
  }
}

function deleteConflictingSourcePath(sourcePath: string, preservedClipId: string): void {
  clipMap.forEach((record, clipId) => {
    if (clipId !== preservedClipId && record.descriptor.sourcePath === sourcePath) {
      clipMap.delete(clipId);
    }
  });
}

function storeAnimationClipRecord(descriptor: AnimationClipDescriptor, clip: AnimationClip): AnimationClip {
  validateDescriptorAndClip(descriptor, clip);
  deleteConflictingSourcePath(descriptor.sourcePath, descriptor.clipId);
  const stored = cloneAnimationClip(clip);
  clipMap.set(descriptor.clipId, {
    descriptor: { ...descriptor },
    clip: stored
  });
  return cloneAnimationClip(stored);
}

for (let i = 0; i < clipRecords.length; i += 1) {
  const record = clipRecords[i];
  storeAnimationClipRecord(record.descriptor, record.clip);
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

export function getAnimationClipDescriptorBySourcePath(sourcePath: string): AnimationClipDescriptor | null {
  for (const record of clipMap.values()) {
    if (record.descriptor.sourcePath === sourcePath) {
      return { ...record.descriptor };
    }
  }
  return null;
}

export function registerAnimationClip(descriptor: AnimationClipDescriptor, clip: AnimationClip): AnimationClip {
  return storeAnimationClipRecord(descriptor, clip);
}

export function replaceAnimationClip(nextClip: AnimationClip): AnimationClip {
  const descriptor = getAnimationClipDescriptor(nextClip.clipId);
  if (!descriptor) throw new Error(`Unknown clip ${nextClip.clipId}`);
  return storeAnimationClipRecord(descriptor, nextClip);
}

export function exportAnimationClip(clipId: string): string | null {
  const clip = getAnimationClip(clipId);
  return clip ? serializeAnimationClip(clip) : null;
}
