import type {
  AnimationActionRequest,
  AnimationControllerDebugSnapshot,
  AnimationControllerState,
  AnimationResolvedPose,
  AnimationResolvedTransform,
  AnimationRigSchema
} from "../contracts/animation";
import { buildBindFallbackPose, layerResolvedPose, sampleAnimationClip } from "./clip-utils";
import { getAnimationClip } from "./registry";
import { getAnimationRigSchema } from "./schema";
import type { Group, Object3D } from "three";

interface LegacyRigNodeMap {
  root: Group;
  head: Object3D | null;
  torso: Object3D | null;
  leftArm: Object3D | null;
  rightArm: Object3D | null;
  leftLowerArm: Object3D | null;
  rightLowerArm: Object3D | null;
  leftLeg: Object3D | null;
  rightLeg: Object3D | null;
  leftLowerLeg: Object3D | null;
  rightLowerLeg: Object3D | null;
  weapon: Object3D | null;
}

interface RootApplyOptions {
  additiveRootPosition?: boolean;
  additiveRootRotation?: boolean;
  multiplicativeRootScale?: boolean;
}

export function resolveLegacyRigNodeMap(rigRoot: Group): LegacyRigNodeMap {
  const rig = (rigRoot.userData?.rig || {}) as Record<string, Object3D | undefined>;
  return {
    root: rigRoot,
    head: rig.head || null,
    torso: rig.torso || null,
    leftArm: rig.leftArm || null,
    rightArm: rig.rightArm || null,
    leftLowerArm: rig.leftLowerArm || null,
    rightLowerArm: rig.rightLowerArm || null,
    leftLeg: rig.leftLeg || null,
    rightLeg: rig.rightLeg || null,
    leftLowerLeg: rig.leftLowerLeg || null,
    rightLowerLeg: rig.rightLowerLeg || null,
    weapon: rig.axe || null
  };
}

export function createAnimationControllerState(
  rigId: string,
  bindPose?: AnimationResolvedPose
): AnimationControllerState {
  return {
    rigId,
    bindPose: bindPose || buildBindFallbackPose(getRequiredAnimationRigSchema(rigId)),
    baseClipId: null,
    baseStartedAtMs: 0,
    actionClipId: null,
    actionStartedAtMs: 0,
    actionStartKey: null,
    pendingAction: null,
    debugRequestedActions: [],
    debugWinningRequest: null,
    debugLastCommittedAction: null
  };
}

function getRequiredAnimationRigSchema(rigId: string): AnimationRigSchema {
  const schema = getAnimationRigSchema(rigId);
  if (!schema) throw new Error(`Unknown animation rig ${rigId}`);
  return schema;
}

function resolveNode(nodeMap: LegacyRigNodeMap, nodeId: string): Object3D | null {
  return nodeMap[nodeId as keyof LegacyRigNodeMap] || null;
}

function snapshotNodeTransform(node: Object3D | null): AnimationResolvedTransform {
  if (!node) {
    return {
      position: { x: 0, y: 0, z: 0 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
  }
  return {
    position: { x: node.position.x, y: node.position.y, z: node.position.z },
    rotationDeg: {
      x: node.rotation.x * (180 / Math.PI),
      y: node.rotation.y * (180 / Math.PI),
      z: node.rotation.z * (180 / Math.PI)
    },
    scale: { x: node.scale.x, y: node.scale.y, z: node.scale.z }
  };
}

export function captureRigBindPose(rigRoot: Group, rigId: string): AnimationResolvedPose {
  const schema = getRequiredAnimationRigSchema(rigId);
  const nodeMap = resolveLegacyRigNodeMap(rigRoot);
  const bindPose = buildBindFallbackPose(schema);
  for (let i = 0; i < schema.nodeOrder.length; i += 1) {
    const nodeId = schema.nodeOrder[i];
    if (nodeId === "root") {
      bindPose[nodeId] = {
        position: { x: 0, y: 0, z: 0 },
        rotationDeg: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
      continue;
    }
    bindPose[nodeId] = snapshotNodeTransform(resolveNode(nodeMap, nodeId));
  }
  return bindPose;
}

export function ensureRigAnimationController(rigRoot: Group, rigId: string): AnimationControllerState {
  const existing = rigRoot.userData?.animationController as AnimationControllerState | undefined;
  if (existing && existing.rigId === rigId) return existing;
  const controller = createAnimationControllerState(rigId, captureRigBindPose(rigRoot, rigId));
  rigRoot.userData.animationController = controller;
  return controller;
}

export function beginAnimationFrame(controller: AnimationControllerState): void {
  controller.pendingAction = null;
  controller.debugRequestedActions = [];
  controller.debugWinningRequest = null;
}

export function setBaseAnimationClip(controller: AnimationControllerState, clipId: string, startedAtMs: number): void {
  if (controller.baseClipId === clipId) return;
  controller.baseClipId = clipId;
  controller.baseStartedAtMs = startedAtMs;
}

function pickWinningAction(previous: AnimationActionRequest | null, candidate: AnimationActionRequest): AnimationActionRequest {
  if (!previous) return candidate;
  if (candidate.priority > previous.priority) return candidate;
  if (candidate.priority === previous.priority && candidate.startedAtMs >= previous.startedAtMs) return candidate;
  return previous;
}

export function requestActionAnimationClip(
  controller: AnimationControllerState,
  clipId: string,
  startedAtMs: number,
  startKey: string,
  priority: number
): void {
  const candidate: AnimationActionRequest = {
    clipId,
    startedAtMs,
    startKey,
    priority
  };
  controller.debugRequestedActions.push(candidate);
  controller.pendingAction = pickWinningAction(controller.pendingAction, candidate);
  controller.debugWinningRequest = controller.pendingAction ? { ...controller.pendingAction } : null;
}

function commitPendingAction(controller: AnimationControllerState): void {
  const pending = controller.pendingAction;
  if (!pending) return;
  controller.pendingAction = null;
  if (controller.actionStartKey === pending.startKey && controller.actionClipId === pending.clipId) return;
  controller.actionClipId = pending.clipId;
  controller.actionStartedAtMs = pending.startedAtMs;
  controller.actionStartKey = pending.startKey;
  controller.debugLastCommittedAction = { ...pending };
}

export function sampleAnimationControllerPose(controller: AnimationControllerState, frameNowMs: number): AnimationResolvedPose {
  commitPendingAction(controller);
  const schema = getRequiredAnimationRigSchema(controller.rigId);
  const bindPose = controller.bindPose;
  const baseClip = controller.baseClipId ? getAnimationClip(controller.baseClipId) : null;
  const basePose = baseClip
    ? sampleAnimationClip(baseClip, schema, bindPose, frameNowMs - controller.baseStartedAtMs)
    : bindPose;

  if (!controller.actionClipId) return basePose;

  const actionClip = getAnimationClip(controller.actionClipId);
  if (!actionClip) {
    controller.actionClipId = null;
    controller.actionStartKey = null;
    return basePose;
  }

  const actionAge = frameNowMs - controller.actionStartedAtMs;
  if (actionAge >= actionClip.durationMs) {
    controller.actionClipId = null;
    controller.actionStartKey = null;
    return basePose;
  }

  const actionPose = sampleAnimationClip(actionClip, schema, bindPose, actionAge);
  return layerResolvedPose(basePose, actionPose, schema, actionClip.maskId);
}

export function getAnimationControllerDebugSnapshot(
  controller: AnimationControllerState,
  frameNowMs: number
): AnimationControllerDebugSnapshot {
  const actionClip = controller.actionClipId ? getAnimationClip(controller.actionClipId) : null;
  const actionAgeMs = actionClip ? Math.max(0, frameNowMs - controller.actionStartedAtMs) : null;
  return {
    rigId: controller.rigId,
    baseClipId: controller.baseClipId,
    baseStartedAtMs: controller.baseStartedAtMs,
    actionClipId: controller.actionClipId,
    actionStartedAtMs: controller.actionStartedAtMs,
    actionStartKey: controller.actionStartKey,
    actionAgeMs,
    actionDurationMs: actionClip ? actionClip.durationMs : null,
    pendingAction: controller.pendingAction ? { ...controller.pendingAction } : null,
    requestedActions: controller.debugRequestedActions.map((request) => ({ ...request })),
    winningRequest: controller.debugWinningRequest ? { ...controller.debugWinningRequest } : null,
    lastCommittedAction: controller.debugLastCommittedAction ? { ...controller.debugLastCommittedAction } : null
  };
}

function applyLocalNodeTransform(node: Object3D, transform: AnimationResolvedTransform): void {
  node.position.set(transform.position.x, transform.position.y, transform.position.z);
  node.rotation.set(
    transform.rotationDeg.x * (Math.PI / 180),
    transform.rotationDeg.y * (Math.PI / 180),
    transform.rotationDeg.z * (Math.PI / 180)
  );
  node.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
}

function applyRootTransform(node: Object3D, transform: AnimationResolvedTransform, options: RootApplyOptions): void {
  const addPosition = options.additiveRootPosition !== false;
  const addRotation = options.additiveRootRotation !== false;
  const multiplyScale = options.multiplicativeRootScale !== false;
  const currentPos = { x: node.position.x, y: node.position.y, z: node.position.z };
  const currentRot = { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z };
  const currentScale = { x: node.scale.x, y: node.scale.y, z: node.scale.z };
  node.position.set(
    addPosition ? currentPos.x + transform.position.x : transform.position.x,
    addPosition ? currentPos.y + transform.position.y : transform.position.y,
    addPosition ? currentPos.z + transform.position.z : transform.position.z
  );
  node.rotation.set(
    addRotation ? currentRot.x + (transform.rotationDeg.x * (Math.PI / 180)) : (transform.rotationDeg.x * (Math.PI / 180)),
    addRotation ? currentRot.y + (transform.rotationDeg.y * (Math.PI / 180)) : (transform.rotationDeg.y * (Math.PI / 180)),
    addRotation ? currentRot.z + (transform.rotationDeg.z * (Math.PI / 180)) : (transform.rotationDeg.z * (Math.PI / 180))
  );
  node.scale.set(
    multiplyScale ? currentScale.x * transform.scale.x : transform.scale.x,
    multiplyScale ? currentScale.y * transform.scale.y : transform.scale.y,
    multiplyScale ? currentScale.z * transform.scale.z : transform.scale.z
  );
}

export function applyResolvedPoseToRig(
  rigRoot: Group,
  rigId: string,
  pose: AnimationResolvedPose,
  options: RootApplyOptions = {}
): void {
  const schema = getRequiredAnimationRigSchema(rigId);
  const nodeMap = resolveLegacyRigNodeMap(rigRoot);
  for (let i = 0; i < schema.nodeOrder.length; i += 1) {
    const nodeId = schema.nodeOrder[i];
    const node = resolveNode(nodeMap, nodeId);
    if (!node) continue;
    const transform = pose[nodeId];
    if (!transform) continue;
    if (nodeId === "root") {
      applyRootTransform(node, transform, options);
      continue;
    }
    applyLocalNodeTransform(node, transform);
  }
}

export function applyAnimationControllerFrame(
  rigRoot: Group,
  controller: AnimationControllerState,
  frameNowMs: number,
  options: RootApplyOptions = {}
): AnimationResolvedPose {
  const pose = sampleAnimationControllerPose(controller, frameNowMs);
  applyResolvedPoseToRig(rigRoot, controller.rigId, pose, options);
  return pose;
}
