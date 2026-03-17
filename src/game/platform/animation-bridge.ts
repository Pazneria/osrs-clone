import type { Group } from "three";

import type {
  AnimationClip,
  AnimationControllerDebugSnapshot,
  AnimationHeldItemMap,
  AnimationHeldItemSlot,
  AnimationResolvedPose,
  AnimationRigSchema
} from "../contracts/animation";
import {
  applyAnimationControllerFrame,
  applyResolvedPoseToRig,
  beginAnimationFrame,
  captureRigBindPose,
  ensureRigAnimationController,
  getAnimationControllerDebugSnapshot,
  requestActionAnimationClip,
  resolveAnimationControllerHeldItems,
  resolveAnimationControllerHeldItemId,
  resolveAnimationControllerHeldItemSlot,
  resolveLegacyRigNodeMap,
  sampleAnimationControllerPose,
  setBaseAnimationClip
} from "../animation/controller";
import { cloneAnimationClip, resolveClipTimeSummary, sampleAnimationClip } from "../animation/clip-utils";
import {
  exportAnimationClip,
  getAnimationClip,
  getAnimationClipDescriptor,
  listAnimationClipDescriptors,
  registerAnimationClip,
  replaceAnimationClip
} from "../animation/registry";
import { getAnimationRigSchema, listAnimationRigSchemas } from "../animation/schema";
import { ANIMATION_STUDIO_CLIP_ROUTE, ANIMATION_STUDIO_MANIFEST_ROUTE, ANIMATION_STUDIO_SAVE_ROUTE } from "../animation/persistence";
import { createAnimationStudioBridge } from "../animation/studio";

declare global {
  interface Window {
    setPlayerRigToolVisuals?: (
      rigRoot: Group,
      heldItems: AnimationHeldItemMap | null,
      primaryHeldItemSlot?: AnimationHeldItemSlot | null
    ) => void;
    setPlayerRigToolVisual?: (
      rigRoot: Group,
      itemId: string | null,
      heldItemSlot?: AnimationHeldItemSlot | null
    ) => void;
    AnimationRuntimeBridge?: {
      listClipDescriptors: typeof listAnimationClipDescriptors;
      listRigSchemas: typeof listAnimationRigSchemas;
      getRigSchema: (rigId: string) => AnimationRigSchema | null;
      getClip: (clipId: string) => AnimationClip | null;
      replaceClipInMemory: (clip: AnimationClip) => AnimationClip;
      exportClip: (clipId: string) => string | null;
      captureBindPose: (rigRoot: Group, rigId: string) => AnimationResolvedPose;
      sampleClipPose: (clipId: string, bindPose: AnimationResolvedPose, timeMs: number) => AnimationResolvedPose | null;
      describeClipAtTime: (clipId: string, timeMs: number) => ReturnType<typeof resolveClipTimeSummary> | null;
      applyClipPoseToRig: (rigRoot: Group, rigId: string, pose: AnimationResolvedPose, additiveRoot?: boolean) => void;
      beginLegacyFrame: (rigRoot: Group, rigId: string) => void;
      setLegacyBaseClip: (
        rigRoot: Group,
        rigId: string,
        clipId: string,
        frameNowMs: number,
        options?: { heldItems?: AnimationHeldItemMap | null; heldItemId?: string | null; heldItemSlot?: AnimationHeldItemSlot | null }
      ) => void;
      requestLegacyActionClip: (
        rigRoot: Group,
        rigId: string,
        clipId: string,
        options: {
          startedAtMs: number;
          startKey: string;
          priority: number;
          heldItems?: AnimationHeldItemMap | null;
          heldItemId?: string | null;
          heldItemSlot?: AnimationHeldItemSlot | null;
        }
      ) => void;
      applyLegacyFrame: (rigRoot: Group, rigId: string, frameNowMs: number) => AnimationResolvedPose;
      sampleLegacyFrame: (rigRoot: Group, rigId: string, frameNowMs: number) => AnimationResolvedPose;
      getLegacyControllerDebugState: (rigRoot: Group, rigId: string, frameNowMs: number) => AnimationControllerDebugSnapshot;
      getPersistenceManifest: () => Promise<{ writable: boolean; clipSourceFiles: string[] }>;
      persistClip: (clipId: string) => Promise<{ ok: boolean; writable: boolean; error?: string }>;
    };
    AnimationStudioBridge?: ReturnType<typeof createAnimationStudioBridge>;
  }
}

async function getPersistenceManifest(): Promise<{ writable: boolean; clipSourceFiles: string[] }> {
  try {
    const response = await fetch(ANIMATION_STUDIO_MANIFEST_ROUTE, { method: "GET" });
    if (!response.ok) throw new Error(`manifest_${response.status}`);
    const payload = await response.json() as { writable?: boolean; clipSourceFiles?: string[] };
    return {
      writable: !!payload.writable,
      clipSourceFiles: Array.isArray(payload.clipSourceFiles) ? payload.clipSourceFiles.slice() : []
    };
  } catch (error) {
    void error;
    return {
      writable: false,
      clipSourceFiles: []
    };
  }
}

async function persistClip(clipId: string): Promise<{ ok: boolean; writable: boolean; error?: string }> {
  const descriptor = getAnimationClipDescriptor(clipId);
  const sourceText = exportAnimationClip(clipId);
  if (!descriptor || !sourceText) return { ok: false, writable: false, error: "missing_clip" };
  const manifest = await getPersistenceManifest();
  if (!manifest.writable) return { ok: false, writable: false, error: "read_only" };
  const response = await fetch(ANIMATION_STUDIO_SAVE_ROUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourcePath: descriptor.sourcePath,
      sourceText
    })
  });
  if (!response.ok) return { ok: false, writable: true, error: `http_${response.status}` };
  return { ok: true, writable: true };
}

async function syncRuntimeClipsFromPersistenceManifest(): Promise<void> {
  try {
    const manifest = await getPersistenceManifest();
    const sourceFiles = Array.isArray(manifest.clipSourceFiles) ? manifest.clipSourceFiles : [];
    for (let index = 0; index < sourceFiles.length; index += 1) {
      const sourcePath = sourceFiles[index];
      const response = await fetch(`${ANIMATION_STUDIO_CLIP_ROUTE}?sourcePath=${encodeURIComponent(sourcePath)}`, {
        method: "GET"
      });
      if (!response.ok) continue;
      const payload = await response.json() as { ok?: boolean; clip?: AnimationClip };
      if (!payload.ok || !payload.clip) continue;
      registerAnimationClip({
        clipId: payload.clip.clipId,
        rigId: payload.clip.rigId,
        sourcePath
      }, payload.clip);
    }
  } catch (error) {
    void error;
  }
}

function applyLegacyHeldItemVisual(rigRoot: Group, rigId: string, frameNowMs: number): void {
  const controller = ensureRigAnimationController(rigRoot, rigId);
  const heldItems = resolveAnimationControllerHeldItems(controller, frameNowMs);
  const heldItemId = resolveAnimationControllerHeldItemId(controller, frameNowMs);
  const heldItemSlot = resolveAnimationControllerHeldItemSlot(controller, frameNowMs);
  if (typeof window.setPlayerRigToolVisuals === "function") {
    window.setPlayerRigToolVisuals(rigRoot, heldItems, heldItemSlot);
  } else if (typeof window.setPlayerRigToolVisual === "function") {
    window.setPlayerRigToolVisual(rigRoot, heldItemId, heldItemSlot);
  }
  if (!heldItems.rightHand && !heldItems.leftHand) return;
  const weaponNode = resolveLegacyRigNodeMap(rigRoot).weapon;
  if (weaponNode) weaponNode.visible = true;
}

export function exposeAnimationBridge(): void {
  window.AnimationRuntimeBridge = {
    listClipDescriptors: listAnimationClipDescriptors,
    listRigSchemas: listAnimationRigSchemas,
    getRigSchema: getAnimationRigSchema,
    getClip: getAnimationClip,
    replaceClipInMemory: (clip) => replaceAnimationClip(cloneAnimationClip(clip)),
    exportClip: exportAnimationClip,
    captureBindPose: captureRigBindPose,
    sampleClipPose: (clipId, bindPose, timeMs) => {
      const clip = getAnimationClip(clipId);
      if (!clip) return null;
      const schema = getAnimationRigSchema(clip.rigId);
      if (!schema) return null;
      return sampleAnimationClip(clip, schema, bindPose, timeMs);
    },
    describeClipAtTime: (clipId, timeMs) => {
      const clip = getAnimationClip(clipId);
      return clip ? resolveClipTimeSummary(clip, timeMs) : null;
    },
    applyClipPoseToRig: (rigRoot, rigId, pose, additiveRoot = false) => {
      applyResolvedPoseToRig(rigRoot, rigId, pose, {
        additiveRootPosition: additiveRoot,
        additiveRootRotation: additiveRoot,
        multiplicativeRootScale: !additiveRoot
      });
    },
    beginLegacyFrame: (rigRoot, rigId) => {
      const controller = ensureRigAnimationController(rigRoot, rigId);
      beginAnimationFrame(controller);
    },
    setLegacyBaseClip: (rigRoot, rigId, clipId, frameNowMs, options) => {
      const controller = ensureRigAnimationController(rigRoot, rigId);
      setBaseAnimationClip(controller, clipId, frameNowMs, options?.heldItemId, options?.heldItemSlot, options?.heldItems);
    },
    requestLegacyActionClip: (rigRoot, rigId, clipId, options) => {
      const controller = ensureRigAnimationController(rigRoot, rigId);
      requestActionAnimationClip(
        controller,
        clipId,
        options.startedAtMs,
        options.startKey,
        options.priority,
        options.heldItemId,
        options.heldItemSlot,
        options.heldItems
      );
    },
    applyLegacyFrame: (rigRoot, rigId, frameNowMs) => {
      const controller = ensureRigAnimationController(rigRoot, rigId);
      const pose = applyAnimationControllerFrame(rigRoot, controller, frameNowMs, {
        additiveRootPosition: true,
        additiveRootRotation: true,
        multiplicativeRootScale: true
      });
      applyLegacyHeldItemVisual(rigRoot, rigId, frameNowMs);
      return pose;
    },
    sampleLegacyFrame: (rigRoot, rigId, frameNowMs) => {
      const controller = ensureRigAnimationController(rigRoot, rigId);
      return sampleAnimationControllerPose(controller, frameNowMs);
    },
    getLegacyControllerDebugState: (rigRoot, rigId, frameNowMs) => {
      const controller = ensureRigAnimationController(rigRoot, rigId);
      return getAnimationControllerDebugSnapshot(controller, frameNowMs);
    },
    getPersistenceManifest,
    persistClip
  };
  window.AnimationStudioBridge = createAnimationStudioBridge();
  void syncRuntimeClipsFromPersistenceManifest();
}
