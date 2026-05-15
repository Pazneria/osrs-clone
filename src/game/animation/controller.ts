import type {
  AnimationActionRequest,
  AnimationClip,
  AnimationControllerDebugSnapshot,
  AnimationControllerState,
  AnimationHeldItemMap,
  AnimationHeldItemSlot,
  AnimationResolvedHeldItemMap,
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
  leftWeapon: Object3D | null;
  rightWeapon: Object3D | null;
}

interface RootApplyOptions {
  additiveRootPosition?: boolean;
  additiveRootRotation?: boolean;
  multiplicativeRootScale?: boolean;
  bindPose?: AnimationResolvedPose | null;
}

interface ResolvedHeldItemSelection {
  heldItems: AnimationResolvedHeldItemMap;
  heldItemId: string | null;
  heldItemSlot: AnimationHeldItemSlot | null;
}

function normalizeHeldItemSlot(slot?: AnimationHeldItemSlot | null): AnimationHeldItemSlot {
  return slot === "leftHand" ? "leftHand" : "rightHand";
}

function createEmptyHeldItemMap(): AnimationResolvedHeldItemMap {
  return {
    rightHand: null,
    leftHand: null
  };
}

function cloneResolvedHeldItems(heldItems?: AnimationResolvedHeldItemMap | AnimationHeldItemMap | null): AnimationResolvedHeldItemMap {
  return {
    rightHand: typeof heldItems?.rightHand === "string" && heldItems.rightHand.trim()
      ? heldItems.rightHand
      : null,
    leftHand: typeof heldItems?.leftHand === "string" && heldItems.leftHand.trim()
      ? heldItems.leftHand
      : null
  };
}

function areHeldItemMapsEqual(
  left: AnimationResolvedHeldItemMap | null | undefined,
  right: AnimationResolvedHeldItemMap | null | undefined
): boolean {
  return (left?.rightHand || null) === (right?.rightHand || null)
    && (left?.leftHand || null) === (right?.leftHand || null);
}

function resolvePrimaryHeldItemSlot(
  heldItems: AnimationResolvedHeldItemMap,
  preferredSlot?: AnimationHeldItemSlot | null
): AnimationHeldItemSlot | null {
  const normalizedPreferredSlot = preferredSlot ? normalizeHeldItemSlot(preferredSlot) : null;
  if (normalizedPreferredSlot && heldItems[normalizedPreferredSlot]) return normalizedPreferredSlot;
  if (heldItems.rightHand) return "rightHand";
  if (heldItems.leftHand) return "leftHand";
  return normalizedPreferredSlot;
}

function createResolvedHeldItemSelection(
  heldItems: AnimationResolvedHeldItemMap,
  preferredSlot?: AnimationHeldItemSlot | null
): ResolvedHeldItemSelection {
  const heldItemSlot = resolvePrimaryHeldItemSlot(heldItems, preferredSlot);
  return {
    heldItems,
    heldItemId: heldItemSlot ? heldItems[heldItemSlot] || null : null,
    heldItemSlot
  };
}

function mergeHeldItemMaps(
  baseHeldItems: AnimationResolvedHeldItemMap,
  overrides?: AnimationHeldItemMap | null
): AnimationResolvedHeldItemMap {
  const nextHeldItems = cloneResolvedHeldItems(baseHeldItems);
  if (!overrides) return nextHeldItems;
  if (Object.prototype.hasOwnProperty.call(overrides, "rightHand")) {
    nextHeldItems.rightHand = typeof overrides.rightHand === "string" && overrides.rightHand.trim()
      ? overrides.rightHand
      : null;
  }
  if (Object.prototype.hasOwnProperty.call(overrides, "leftHand")) {
    nextHeldItems.leftHand = typeof overrides.leftHand === "string" && overrides.leftHand.trim()
      ? overrides.leftHand
      : null;
  }
  return nextHeldItems;
}

function resolveClipDefaultHeldItems(clip: AnimationClip | null): AnimationResolvedHeldItemMap {
  if (!clip) return createEmptyHeldItemMap();
  if (clip.heldItems && typeof clip.heldItems === "object") {
    return cloneResolvedHeldItems(clip.heldItems);
  }
  const heldItems = createEmptyHeldItemMap();
  if (typeof clip.heldItemId === "string" && clip.heldItemId.trim()) {
    heldItems[normalizeHeldItemSlot(clip.heldItemSlot || null)] = clip.heldItemId;
  }
  return heldItems;
}

function resolveClipDefaultHeldItemSlot(clip: AnimationClip | null, heldItems: AnimationResolvedHeldItemMap): AnimationHeldItemSlot | null {
  if (clip?.heldItemSlot) return normalizeHeldItemSlot(clip.heldItemSlot);
  return resolvePrimaryHeldItemSlot(heldItems, null);
}

function resolveClipHeldItemSelection(
  clipId: string,
  heldItemsOverride?: AnimationHeldItemMap | null,
  heldItemId?: string | null,
  heldItemSlot?: AnimationHeldItemSlot | null
): ResolvedHeldItemSelection {
  const clip = getAnimationClip(clipId);
  const clipHeldItems = resolveClipDefaultHeldItems(clip);
  const clipHeldItemSlot = resolveClipDefaultHeldItemSlot(clip, clipHeldItems);

  if (heldItemsOverride !== undefined) {
    const mergedHeldItems = mergeHeldItemMaps(clipHeldItems, heldItemsOverride);
    const preferredSlot = heldItemSlot !== undefined ? heldItemSlot : clipHeldItemSlot;
    return createResolvedHeldItemSelection(mergedHeldItems, preferredSlot);
  }

  if (heldItemId !== undefined || heldItemSlot !== undefined) {
    const resolvedHeldItems = createEmptyHeldItemMap();
    const resolvedHeldItemSlot = normalizeHeldItemSlot(heldItemSlot !== undefined ? heldItemSlot : clipHeldItemSlot);
    const normalizedHeldItemId = typeof heldItemId === "string" && heldItemId.trim() ? heldItemId : null;
    if (normalizedHeldItemId) resolvedHeldItems[resolvedHeldItemSlot] = normalizedHeldItemId;
    return createResolvedHeldItemSelection(resolvedHeldItems, normalizedHeldItemId ? resolvedHeldItemSlot : heldItemSlot || clipHeldItemSlot);
  }

  return createResolvedHeldItemSelection(clipHeldItems, clipHeldItemSlot);
}

function resolveLegacyWeaponNode(rigRoot: Group, rig: Record<string, Object3D | undefined>): Object3D | null {
  const activeSlot = normalizeHeldItemSlot((rigRoot.userData?.animationHeldItemSlot || null) as AnimationHeldItemSlot | null);
  if (activeSlot === "leftHand") {
    return rig.leftTool || null;
  }
  return rig.rightTool || rig.axe || null;
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
    weapon: resolveLegacyWeaponNode(rigRoot, rig),
    leftWeapon: rig.leftTool || null,
    rightWeapon: rig.rightTool || rig.axe || null
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
    baseHeldItems: createEmptyHeldItemMap(),
    baseHeldItemId: null,
    baseHeldItemSlot: null,
    actionClipId: null,
    actionStartedAtMs: 0,
    actionHeldItems: createEmptyHeldItemMap(),
    actionHeldItemId: null,
    actionHeldItemSlot: null,
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

export function setBaseAnimationClip(
  controller: AnimationControllerState,
  clipId: string,
  startedAtMs: number,
  heldItemId?: string | null,
  heldItemSlot?: AnimationHeldItemSlot | null,
  heldItems?: AnimationHeldItemMap | null
): void {
  const nextSelection = resolveClipHeldItemSelection(clipId, heldItems, heldItemId, heldItemSlot);
  const sameClip = controller.baseClipId === clipId;
  if (
    sameClip
    && areHeldItemMapsEqual(controller.baseHeldItems, nextSelection.heldItems)
    && controller.baseHeldItemId === nextSelection.heldItemId
    && controller.baseHeldItemSlot === nextSelection.heldItemSlot
  ) return;
  controller.baseClipId = clipId;
  controller.baseHeldItems = cloneResolvedHeldItems(nextSelection.heldItems);
  controller.baseHeldItemId = nextSelection.heldItemId;
  controller.baseHeldItemSlot = nextSelection.heldItemSlot;
  if (!sameClip) controller.baseStartedAtMs = startedAtMs;
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
  priority: number,
  heldItemId?: string | null,
  heldItemSlot?: AnimationHeldItemSlot | null,
  heldItems?: AnimationHeldItemMap | null
): void {
  const heldItemSelection = resolveClipHeldItemSelection(clipId, heldItems, heldItemId, heldItemSlot);
  const candidate: AnimationActionRequest = {
    clipId,
    startedAtMs,
    startKey,
    priority,
    heldItems: cloneResolvedHeldItems(heldItemSelection.heldItems),
    heldItemId: heldItemSelection.heldItemId,
    heldItemSlot: heldItemSelection.heldItemSlot
  };
  controller.debugRequestedActions.push(candidate);
  controller.pendingAction = pickWinningAction(controller.pendingAction, candidate);
  controller.debugWinningRequest = controller.pendingAction
    ? {
      ...controller.pendingAction,
      heldItems: cloneResolvedHeldItems(controller.pendingAction.heldItems)
    }
    : null;
}

function commitPendingAction(controller: AnimationControllerState): void {
  const pending = controller.pendingAction;
  if (!pending) return;
  controller.pendingAction = null;
  const sameAction = controller.actionStartKey === pending.startKey && controller.actionClipId === pending.clipId;
  if (
    sameAction
    && areHeldItemMapsEqual(controller.actionHeldItems, pending.heldItems)
    && controller.actionHeldItemId === pending.heldItemId
    && controller.actionHeldItemSlot === pending.heldItemSlot
  ) return;
  controller.actionClipId = pending.clipId;
  controller.actionStartedAtMs = pending.startedAtMs;
  controller.actionHeldItems = cloneResolvedHeldItems(pending.heldItems);
  controller.actionHeldItemId = pending.heldItemId;
  controller.actionHeldItemSlot = pending.heldItemSlot;
  controller.actionStartKey = pending.startKey;
  controller.debugLastCommittedAction = {
    ...pending,
    heldItems: cloneResolvedHeldItems(pending.heldItems)
  };
}

export function resolveAnimationControllerHeldItems(
  controller: AnimationControllerState,
  frameNowMs: number
): AnimationResolvedHeldItemMap {
  if (!controller.actionClipId) return cloneResolvedHeldItems(controller.baseHeldItems);
  const actionClip = getAnimationClip(controller.actionClipId);
  if (!actionClip) return cloneResolvedHeldItems(controller.baseHeldItems);
  const actionAge = frameNowMs - controller.actionStartedAtMs;
  if (!Number.isFinite(actionAge) || actionAge < 0 || actionAge >= actionClip.durationMs) {
    return cloneResolvedHeldItems(controller.baseHeldItems);
  }
  return cloneResolvedHeldItems(controller.actionHeldItems);
}

export function resolveAnimationControllerHeldItemId(
  controller: AnimationControllerState,
  frameNowMs: number
): string | null {
  const heldItems = resolveAnimationControllerHeldItems(controller, frameNowMs);
  const preferredSlot = resolveAnimationControllerHeldItemSlot(controller, frameNowMs);
  return preferredSlot ? heldItems[preferredSlot] || null : null;
}

export function resolveAnimationControllerHeldItemSlot(
  controller: AnimationControllerState,
  frameNowMs: number
): AnimationHeldItemSlot | null {
  if (!controller.actionClipId) return resolvePrimaryHeldItemSlot(controller.baseHeldItems, controller.baseHeldItemSlot);
  const actionClip = getAnimationClip(controller.actionClipId);
  if (!actionClip) return resolvePrimaryHeldItemSlot(controller.baseHeldItems, controller.baseHeldItemSlot);
  const actionAge = frameNowMs - controller.actionStartedAtMs;
  if (!Number.isFinite(actionAge) || actionAge < 0 || actionAge >= actionClip.durationMs) {
    return resolvePrimaryHeldItemSlot(controller.baseHeldItems, controller.baseHeldItemSlot);
  }
  return resolvePrimaryHeldItemSlot(controller.actionHeldItems, controller.actionHeldItemSlot);
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
    controller.actionHeldItems = createEmptyHeldItemMap();
    controller.actionHeldItemId = null;
    controller.actionHeldItemSlot = null;
    controller.actionStartKey = null;
    return basePose;
  }

  const actionAge = frameNowMs - controller.actionStartedAtMs;
  if (actionAge >= actionClip.durationMs) {
    controller.actionClipId = null;
    controller.actionHeldItems = createEmptyHeldItemMap();
    controller.actionHeldItemId = null;
    controller.actionHeldItemSlot = null;
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
    baseHeldItems: cloneResolvedHeldItems(controller.baseHeldItems),
    baseHeldItemId: controller.baseHeldItemId,
    baseHeldItemSlot: controller.baseHeldItemSlot,
    actionClipId: controller.actionClipId,
    actionStartedAtMs: controller.actionStartedAtMs,
    actionHeldItems: cloneResolvedHeldItems(controller.actionHeldItems),
    actionHeldItemId: controller.actionHeldItemId,
    actionHeldItemSlot: controller.actionHeldItemSlot,
    actionStartKey: controller.actionStartKey,
    actionAgeMs,
    actionDurationMs: actionClip ? actionClip.durationMs : null,
    resolvedHeldItems: resolveAnimationControllerHeldItems(controller, frameNowMs),
    resolvedHeldItemId: resolveAnimationControllerHeldItemId(controller, frameNowMs),
    resolvedHeldItemSlot: resolveAnimationControllerHeldItemSlot(controller, frameNowMs),
    pendingAction: controller.pendingAction
      ? {
        ...controller.pendingAction,
        heldItems: cloneResolvedHeldItems(controller.pendingAction.heldItems)
      }
      : null,
    requestedActions: controller.debugRequestedActions.map((request) => ({
      ...request,
      heldItems: cloneResolvedHeldItems(request.heldItems)
    })),
    winningRequest: controller.debugWinningRequest
      ? {
        ...controller.debugWinningRequest,
        heldItems: cloneResolvedHeldItems(controller.debugWinningRequest.heldItems)
      }
      : null,
    lastCommittedAction: controller.debugLastCommittedAction
      ? {
        ...controller.debugLastCommittedAction,
        heldItems: cloneResolvedHeldItems(controller.debugLastCommittedAction.heldItems)
      }
      : null
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

function areNumbersNearlyEqual(left: number, right: number, tolerance = 0.0001): boolean {
  return Math.abs(left - right) <= tolerance;
}

function areResolvedTransformsNearlyEqual(
  left: AnimationResolvedTransform | undefined,
  right: AnimationResolvedTransform | undefined
): boolean {
  if (!left || !right) return false;
  return areNumbersNearlyEqual(left.position.x, right.position.x)
    && areNumbersNearlyEqual(left.position.y, right.position.y)
    && areNumbersNearlyEqual(left.position.z, right.position.z)
    && areNumbersNearlyEqual(left.rotationDeg.x, right.rotationDeg.x)
    && areNumbersNearlyEqual(left.rotationDeg.y, right.rotationDeg.y)
    && areNumbersNearlyEqual(left.rotationDeg.z, right.rotationDeg.z)
    && areNumbersNearlyEqual(left.scale.x, right.scale.x)
    && areNumbersNearlyEqual(left.scale.y, right.scale.y)
    && areNumbersNearlyEqual(left.scale.z, right.scale.z);
}

function resolveEffectivePoseForSharedWeaponNodes(
  rigRoot: Group,
  nodeMap: LegacyRigNodeMap,
  pose: AnimationResolvedPose,
  bindPose?: AnimationResolvedPose | null
): AnimationResolvedPose {
  if (!bindPose) return pose;
  const activeSlot = normalizeHeldItemSlot((rigRoot.userData?.animationHeldItemSlot || null) as AnimationHeldItemSlot | null);
  const activeNodeId = activeSlot === "leftHand" ? "leftWeapon" : "rightWeapon";
  const activeNode = nodeMap[activeNodeId];
  if (!activeNode || nodeMap.weapon !== activeNode) return pose;
  const weaponPose = pose.weapon;
  const activePose = pose[activeNodeId];
  const weaponBindPose = bindPose.weapon;
  const activeBindPose = bindPose[activeNodeId];
  if (!weaponPose || !activePose || !weaponBindPose || !activeBindPose) return pose;
  const weaponAuthored = !areResolvedTransformsNearlyEqual(weaponPose, weaponBindPose);
  const activeAuthored = !areResolvedTransformsNearlyEqual(activePose, activeBindPose);
  if (!weaponAuthored || activeAuthored) return pose;
  return {
    ...pose,
    [activeNodeId]: weaponPose
  };
}

export function applyResolvedPoseToRig(
  rigRoot: Group,
  rigId: string,
  pose: AnimationResolvedPose,
  options: RootApplyOptions = {}
): void {
  const schema = getRequiredAnimationRigSchema(rigId);
  const nodeMap = resolveLegacyRigNodeMap(rigRoot);
  const effectivePose = resolveEffectivePoseForSharedWeaponNodes(rigRoot, nodeMap, pose, options.bindPose);
  for (let i = 0; i < schema.nodeOrder.length; i += 1) {
    const nodeId = schema.nodeOrder[i];
    const node = resolveNode(nodeMap, nodeId);
    if (!node) continue;
    const transform = effectivePose[nodeId];
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
  const resolvedHeldItems = resolveAnimationControllerHeldItems(controller, frameNowMs);
  rigRoot.userData.animationHeldItems = cloneResolvedHeldItems(resolvedHeldItems);
  rigRoot.userData.animationHeldItemSlot = resolveAnimationControllerHeldItemSlot(controller, frameNowMs) || "rightHand";
  applyResolvedPoseToRig(rigRoot, controller.rigId, pose, {
    ...options,
    bindPose: controller.bindPose
  });
  return pose;
}
