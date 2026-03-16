export type AnimationAxisId = "x" | "y" | "z";
export type AnimationEaseId = "linear" | "easeIn" | "easeOut" | "easeInOut" | "hold";
export type AnimationLoopMode = "loop" | "once";
export type AnimationMaskId = "fullBody" | "upperBody";
export type AnimationChannelId = "position" | "rotationDeg" | "scale";

export interface AnimationVector3 {
  x?: number;
  y?: number;
  z?: number;
}

export interface AnimationTransform {
  position?: AnimationVector3;
  rotationDeg?: AnimationVector3;
  scale?: AnimationVector3;
}

export type AnimationPose = Record<string, AnimationTransform>;

export interface AnimationKey {
  poseId: string;
  atMs: number;
  ease: AnimationEaseId;
}

export interface AnimationMarker {
  markerId: string;
  atMs: number;
}

export interface AnimationClip {
  clipId: string;
  rigId: string;
  durationMs: number;
  loopMode: AnimationLoopMode;
  maskId: AnimationMaskId;
  poses: Record<string, AnimationPose>;
  keys: AnimationKey[];
  markers: AnimationMarker[];
}

export interface AnimationRigNodeSchema {
  id: string;
  label: string;
  mirrorId: string | null;
  channels: AnimationChannelId[];
}

export interface AnimationRigSchema {
  rigId: string;
  label: string;
  nodeOrder: string[];
  nodes: Record<string, AnimationRigNodeSchema>;
  masks: Record<AnimationMaskId, string[]>;
}

export interface AnimationResolvedVector3 {
  x: number;
  y: number;
  z: number;
}

export interface AnimationResolvedTransform {
  position: AnimationResolvedVector3;
  rotationDeg: AnimationResolvedVector3;
  scale: AnimationResolvedVector3;
}

export type AnimationResolvedPose = Record<string, AnimationResolvedTransform>;

export interface AnimationClipDescriptor {
  clipId: string;
  rigId: string;
  sourcePath: string;
}

export interface AnimationTimeSummary {
  timeMs: number;
  previousKeyIndex: number;
  nextKeyIndex: number;
  previousPoseId: string | null;
  nextPoseId: string | null;
  activeMarkerIds: string[];
}

export interface AnimationActionRequest {
  clipId: string;
  priority: number;
  startKey: string;
  startedAtMs: number;
}

export interface AnimationControllerDebugSnapshot {
  rigId: string;
  baseClipId: string | null;
  baseStartedAtMs: number;
  actionClipId: string | null;
  actionStartedAtMs: number;
  actionStartKey: string | null;
  actionAgeMs: number | null;
  actionDurationMs: number | null;
  pendingAction: AnimationActionRequest | null;
  requestedActions: AnimationActionRequest[];
  winningRequest: AnimationActionRequest | null;
  lastCommittedAction: AnimationActionRequest | null;
}

export interface AnimationControllerState {
  rigId: string;
  bindPose: AnimationResolvedPose;
  baseClipId: string | null;
  baseStartedAtMs: number;
  actionClipId: string | null;
  actionStartedAtMs: number;
  actionStartKey: string | null;
  pendingAction: AnimationActionRequest | null;
  debugRequestedActions: AnimationActionRequest[];
  debugWinningRequest: AnimationActionRequest | null;
  debugLastCommittedAction: AnimationActionRequest | null;
}
