import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

import type {
  AnimationChannelId,
  AnimationClip,
  AnimationClipDescriptor,
  AnimationResolvedPose,
  AnimationResolvedTransform,
  AnimationTransform,
  AnimationRigSchema
} from "../contracts/animation";
import {
  ANIMATION_STUDIO_CLIP_ROUTE,
  ANIMATION_STUDIO_MANIFEST_ROUTE,
  ANIMATION_STUDIO_SAVE_ROUTE
} from "./persistence";
import { applyResolvedPoseToRig, captureRigBindPose, resolveLegacyRigNodeMap } from "./controller";
import {
  cloneAnimationClip,
  renamePoseInClip,
  resetPoseNodeToBindPose,
  resolveClipTimeSummary,
  sampleAnimationClip,
  serializeAnimationClip,
  sortClipKeysAndMarkers
} from "./clip-utils";
import { applyAnimationEase } from "./easing";
import {
  exportAnimationClip,
  getAnimationClip,
  getAnimationClipDescriptor,
  getAnimationClipDescriptorBySourcePath,
  listAnimationClipDescriptors,
  registerAnimationClip,
  replaceAnimationClip
} from "./registry";
import { getAnimationRigSchema } from "./schema";

declare global {
  interface Window {
    createPlayerRigFromCurrentAppearance?: () => THREE.Group;
    setPlayerRigToolVisual?: (rigRoot: THREE.Group, itemId: string | null) => void;
    ItemCatalog?: {
      ITEM_DEFS?: Record<string, { name?: string }>;
    };
    PlayerAppearanceCatalog?: {
      itemDefs?: Record<string, { slot?: string; fragments?: unknown[] }>;
    };
  }
}

type AxisId = "x" | "y" | "z";
type CameraPresetId = "front" | "side" | "threeQuarter";
type ManipulatorModeId = "translate" | "rotate";
type SelectionAxis = { channel: AnimationChannelId; axis: AxisId; value: number };
type StudioHeldItemOption = { itemId: string; label: string };
type StudioPoseClipboard = {
  sourceClipId: string;
  sourcePoseId: string;
  pose: AnimationClip["poses"][string];
};
type StudioUndoEntry = {
  clip: AnimationClip;
  selectedPoseId: string | null;
  selectedNodeId: string | null;
  timeMs: number;
  draftDirty: boolean;
};

interface StudioState {
  initialized: boolean;
  active: boolean;
  overlay: HTMLDivElement | null;
  canvasWrap: HTMLDivElement | null;
  canvas: HTMLCanvasElement | null;
  labels: HTMLDivElement | null;
  labelsToggle: HTMLButtonElement | null;
  moveButton: HTMLButtonElement | null;
  rotateButton: HTMLButtonElement | null;
  isolateButton: HTMLButtonElement | null;
  snapButton: HTMLButtonElement | null;
  decoupleButton: HTMLButtonElement | null;
  mirrorButton: HTMLButtonElement | null;
  clipList: HTMLDivElement | null;
  poseList: HTMLDivElement | null;
  keyList: HTMLDivElement | null;
  markerLane: HTMLDivElement | null;
  keyLane: HTMLDivElement | null;
  summary: HTMLDivElement | null;
  status: HTMLDivElement | null;
  playheadSummary: HTMLDivElement | null;
  exportText: HTMLTextAreaElement | null;
  newClipName: HTMLInputElement | null;
  poseName: HTMLInputElement | null;
  renamePose: HTMLInputElement | null;
  markerName: HTMLInputElement | null;
  timelineWrap: HTMLDivElement | null;
  timeline: HTMLInputElement | null;
  durationInput: HTMLInputElement | null;
  durationHandle: HTMLDivElement | null;
  easeSelect: HTMLSelectElement | null;
  nodeSelect: HTMLSelectElement | null;
  heldItemSelect: HTMLSelectElement | null;
  playButton: HTMLButtonElement | null;
  undoButton: HTMLButtonElement | null;
  copyPoseButton: HTMLButtonElement | null;
  pastePoseButton: HTMLButtonElement | null;
  pastePoseNewButton: HTMLButtonElement | null;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  previewRig: THREE.Group | null;
  bindPose: AnimationResolvedPose | null;
  clip: AnimationClip | null;
  descriptor: AnimationClipDescriptor | null;
  schema: AnimationRigSchema | null;
  timeMs: number;
  playing: boolean;
  rafId: number;
  lastFrameMs: number;
  selectedPoseId: string | null;
  selectedNodeId: string | null;
  isolatedNodeId: string | null;
  pendingSnapSourceNodeId: string | null;
  decoupleDescendants: boolean;
  selectedAxis: SelectionAxis | null;
  activeInspectorInputKey: string | null;
  devWritable: boolean;
  draftDirty: boolean;
  showLabels: boolean;
  manipulatorMode: ManipulatorModeId;
  manipulatorDragging: boolean;
  manipulatorDidDrag: boolean;
  cameraTarget: THREE.Vector3;
  cameraOrbitRadius: number;
  cameraOrbitYaw: number;
  cameraOrbitPitch: number;
  cameraDragging: boolean;
  cameraDragDidMove: boolean;
  cameraDragLastX: number;
  cameraDragLastY: number;
  durationDragging: boolean;
  durationDragStartX: number;
  durationDragStartMs: number;
  nodeLabels: Map<string, HTMLDivElement>;
  jointMarker: THREE.Mesh | null;
  axisGizmo: THREE.Group | null;
  transformControls: TransformControls | null;
  selectedHeldItemId: string;
  poseClipboard: StudioPoseClipboard | null;
  decoupledDescendantWorldMatrices: Map<string, THREE.Matrix4> | null;
  undoHistory: StudioUndoEntry[];
  undoTransactionEntry: StudioUndoEntry | null;
}

const state: StudioState = {
  initialized: false,
  active: false,
  overlay: null,
  canvasWrap: null,
  canvas: null,
  labels: null,
  labelsToggle: null,
  moveButton: null,
  rotateButton: null,
  isolateButton: null,
  snapButton: null,
  decoupleButton: null,
  mirrorButton: null,
  clipList: null,
  poseList: null,
  keyList: null,
  markerLane: null,
  keyLane: null,
  summary: null,
  status: null,
  playheadSummary: null,
  exportText: null,
  newClipName: null,
  poseName: null,
  renamePose: null,
  markerName: null,
  timelineWrap: null,
  timeline: null,
  durationInput: null,
  durationHandle: null,
  easeSelect: null,
  nodeSelect: null,
  heldItemSelect: null,
  playButton: null,
  undoButton: null,
  copyPoseButton: null,
  pastePoseButton: null,
  pastePoseNewButton: null,
  renderer: null,
  scene: null,
  camera: null,
  previewRig: null,
  bindPose: null,
  clip: null,
  descriptor: null,
  schema: null,
  timeMs: 0,
  playing: false,
  rafId: 0,
  lastFrameMs: 0,
  selectedPoseId: null,
  selectedNodeId: null,
  isolatedNodeId: null,
  pendingSnapSourceNodeId: null,
  decoupleDescendants: false,
  selectedAxis: null,
  activeInspectorInputKey: null,
  devWritable: false,
  draftDirty: false,
  showLabels: false,
  manipulatorMode: "rotate",
  manipulatorDragging: false,
  manipulatorDidDrag: false,
  cameraTarget: new THREE.Vector3(0, 1.15, 0),
  cameraOrbitRadius: 5,
  cameraOrbitYaw: 0,
  cameraOrbitPitch: 0,
  cameraDragging: false,
  cameraDragDidMove: false,
  cameraDragLastX: 0,
  cameraDragLastY: 0,
  durationDragging: false,
  durationDragStartX: 0,
  durationDragStartMs: 0,
  nodeLabels: new Map(),
  jointMarker: null,
  axisGizmo: null,
  transformControls: null,
  selectedHeldItemId: "",
  poseClipboard: null,
  decoupledDescendantWorldMatrices: null,
  undoHistory: [],
  undoTransactionEntry: null
};

const inspectorInputs = new Map<string, HTMLInputElement>();
const previewPickRaycaster = new THREE.Raycaster();
const previewPickPointer = new THREE.Vector2();
const DEFAULT_NEW_CLIP_ID = "player/new_clip";
const DEFAULT_NEW_CLIP_DURATION_MS = 1000;
const MAX_STUDIO_UNDO_ENTRIES = 80;
const LIMB_SUBTREE_NODE_IDS: Record<string, string[]> = {
  leftArm: ["leftArm", "leftLowerArm"],
  rightArm: ["rightArm", "rightLowerArm"],
  leftLowerArm: ["leftLowerArm"],
  rightLowerArm: ["rightLowerArm"],
  leftLeg: ["leftLeg", "leftLowerLeg"],
  rightLeg: ["rightLeg", "rightLowerLeg"],
  leftLowerLeg: ["leftLowerLeg"],
  rightLowerLeg: ["rightLowerLeg"]
};

function normalizeStudioClipId(rawClipId: string): string {
  const trimmed = rawClipId.trim().toLowerCase().replace(/\\/g, "/");
  const normalized = trimmed
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9/_-]/g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "");
  if (!normalized) return DEFAULT_NEW_CLIP_ID;
  return normalized.includes("/") ? normalized : `player/${normalized}`;
}

function buildStudioSourcePath(clipId: string): string {
  return `src/game/animation/clips/${clipId}.json`;
}

function buildUniqueClipId(baseClipId: string): string {
  const normalizedBase = normalizeStudioClipId(baseClipId || DEFAULT_NEW_CLIP_ID);
  if (!getAnimationClipDescriptor(normalizedBase)) return normalizedBase;
  let suffix = 2;
  while (getAnimationClipDescriptor(`${normalizedBase}_${suffix}`)) suffix += 1;
  return `${normalizedBase}_${suffix}`;
}

function buildFreshClip(clipId: string): AnimationClip {
  return {
    clipId,
    rigId: "player_humanoid_v1",
    durationMs: DEFAULT_NEW_CLIP_DURATION_MS,
    loopMode: "loop",
    maskId: "fullBody",
    poses: {
      neutral: {}
    },
    keys: [
      {
        poseId: "neutral",
        atMs: 0,
        ease: "hold"
      }
    ],
    markers: []
  };
}

function humanizeStudioItemId(itemId: string): string {
  return itemId
    .split("_")
    .filter((part) => part)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function listStudioHeldItemOptions(): StudioHeldItemOption[] {
  const appearanceItemDefs = window.PlayerAppearanceCatalog?.itemDefs || {};
  const itemDefs = window.ItemCatalog?.ITEM_DEFS || {};
  return Object.keys(appearanceItemDefs)
    .filter((itemId) => !/_base_reference$/.test(itemId))
    .filter((itemId) => {
      const appearanceDef = appearanceItemDefs[itemId];
      return appearanceDef?.slot === "weapon"
        && Array.isArray(appearanceDef.fragments)
        && appearanceDef.fragments.length > 0;
    })
    .map((itemId) => ({
      itemId,
      label: itemDefs[itemId]?.name || humanizeStudioItemId(itemId)
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function mirrorPositionAxis(axis: AxisId, value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return axis === "x" ? -Number(value) : Number(value);
}

function mirrorRotationAxis(axis: AxisId, value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return axis === "y" || axis === "z" ? -Number(value) : Number(value);
}

function mirrorTransformVector(
  source: Record<AxisId, number | undefined> | undefined,
  resolver: (axis: AxisId, value: number | undefined) => number | undefined
): Record<AxisId, number> | undefined {
  if (!source) return undefined;
  const mirrored: Partial<Record<AxisId, number>> = {};
  (["x", "y", "z"] as AxisId[]).forEach((axis) => {
    const value = resolver(axis, source[axis]);
    if (Number.isFinite(value)) mirrored[axis] = Number(value);
  });
  return Object.keys(mirrored).length > 0 ? mirrored as Record<AxisId, number> : undefined;
}

function mirrorAnimationTransform(transform: AnimationTransform | undefined): AnimationTransform | null {
  if (!transform || typeof transform !== "object") return null;
  const mirrored: AnimationTransform = {};
  const position = mirrorTransformVector(transform.position as Record<AxisId, number | undefined> | undefined, mirrorPositionAxis);
  const rotationDeg = mirrorTransformVector(transform.rotationDeg as Record<AxisId, number | undefined> | undefined, mirrorRotationAxis);
  const scale = mirrorTransformVector(transform.scale as Record<AxisId, number | undefined> | undefined, (_axis, value) => {
    if (!Number.isFinite(value)) return undefined;
    return Number(value);
  });
  if (position) mirrored.position = position;
  if (rotationDeg) mirrored.rotationDeg = rotationDeg;
  if (scale) mirrored.scale = scale;
  return Object.keys(mirrored).length > 0 ? mirrored : null;
}

function resolveMirrorSubtreeNodeIds(nodeId: string, schema: AnimationRigSchema | null): string[] {
  if (!schema?.nodes[nodeId]?.mirrorId) return [];
  return LIMB_SUBTREE_NODE_IDS[nodeId] ? LIMB_SUBTREE_NODE_IDS[nodeId].slice() : [nodeId];
}

function getNodeDisplayLabel(nodeId: string): string {
  return state.schema?.nodes[nodeId]?.label || nodeId;
}

function setStatus(text: string): void {
  if (state.status) state.status.innerText = text;
}

function setReadyStatus(): void {
  const persistenceText = state.devWritable ? "Dev save is enabled." : "Export fallback is active.";
  const dirtyText = state.draftDirty ? " Unsaved draft changes." : "";
  setStatus(`Animation Studio ready. ${persistenceText}${dirtyText}`);
}

function cloneStudioPoseData(pose: AnimationClip["poses"][string]): AnimationClip["poses"][string] {
  return JSON.parse(JSON.stringify(pose || {}));
}

function refreshUndoButton(): void {
  if (!state.undoButton) return;
  const enabled = state.undoHistory.length > 0;
  state.undoButton.disabled = !enabled;
  state.undoButton.className = `rounded border px-2 py-1 text-[11px] font-bold ${
    enabled
      ? "border-[#4b5660] bg-[#161c22] text-gray-200 hover:bg-[#1f2830]"
      : "border-[#2e3740] bg-[#11161b] text-gray-500 cursor-not-allowed"
  }`;
}

function refreshPoseClipboardButton(button: HTMLButtonElement | null, enabled: boolean): void {
  if (!button) return;
  button.disabled = !enabled;
  button.className = `rounded border px-2 py-1 text-[11px] font-bold ${
    enabled
      ? "border-[#4b5660] bg-[#161c22] text-gray-200 hover:bg-[#1f2830]"
      : "border-[#2e3740] bg-[#11161b] text-gray-500 cursor-not-allowed"
  }`;
}

function refreshPoseClipboardButtons(): void {
  const canCopy = !!(state.clip && state.selectedPoseId && state.clip.poses[state.selectedPoseId]);
  const canPasteOver = !!(state.clip && state.selectedPoseId && state.poseClipboard);
  const canPasteNew = !!(state.clip && state.poseClipboard);
  refreshPoseClipboardButton(state.copyPoseButton, canCopy);
  refreshPoseClipboardButton(state.pastePoseButton, canPasteOver);
  refreshPoseClipboardButton(state.pastePoseNewButton, canPasteNew);
}

function createStudioUndoEntry(): StudioUndoEntry | null {
  if (!state.clip) return null;
  return {
    clip: cloneAnimationClip(state.clip),
    selectedPoseId: state.selectedPoseId,
    selectedNodeId: state.selectedNodeId,
    timeMs: state.timeMs,
    draftDirty: state.draftDirty
  };
}

function pushUndoEntry(entry: StudioUndoEntry | null): void {
  if (!entry) return;
  state.undoHistory.push(entry);
  if (state.undoHistory.length > MAX_STUDIO_UNDO_ENTRIES) state.undoHistory.shift();
  refreshUndoButton();
}

function clearUndoHistory(): void {
  state.undoHistory = [];
  state.undoTransactionEntry = null;
  refreshUndoButton();
}

function beginUndoTransaction(): void {
  if (state.undoTransactionEntry) return;
  state.undoTransactionEntry = createStudioUndoEntry();
}

function finishUndoTransaction(didChange: boolean): void {
  if (didChange) pushUndoEntry(state.undoTransactionEntry);
  state.undoTransactionEntry = null;
  refreshUndoButton();
}

function undoStudioEdit(): void {
  const entry = state.undoHistory.pop();
  refreshUndoButton();
  if (!entry) {
    setStatus("Nothing to undo.");
    return;
  }
  if (!state.clip || !state.schema) return;
  pausePlayback();
  state.clip = sortClipKeysAndMarkers(cloneAnimationClip(entry.clip));
  state.timeMs = Math.max(0, Math.min(entry.timeMs, state.clip.durationMs));
  state.draftDirty = entry.draftDirty;
  state.selectedPoseId = entry.selectedPoseId && state.clip.poses[entry.selectedPoseId]
    ? entry.selectedPoseId
    : (Object.keys(state.clip.poses)[0] || null);
  state.selectedNodeId = entry.selectedNodeId && state.schema.nodes[entry.selectedNodeId]
    ? entry.selectedNodeId
    : null;
  if (state.timeline) {
    state.timeline.max = String(state.clip.durationMs);
    state.timeline.value = String(Math.floor(state.timeMs));
  }
  if (state.durationInput) state.durationInput.value = String(Math.round(state.clip.durationMs));
  if (state.renamePose) state.renamePose.value = state.selectedPoseId || "";
  if (state.nodeSelect) {
    if (!state.selectedNodeId) state.nodeSelect.selectedIndex = 0;
    else state.nodeSelect.value = state.selectedNodeId;
  }
  const keyIndex = findKeyIndexAtPlayhead();
  if (state.easeSelect && state.clip && keyIndex >= 0) {
    state.easeSelect.value = state.clip.keys[keyIndex].ease;
  }
  refreshPoseList();
  refreshKeyList();
  refreshMarkerLane();
  refreshKeyLane();
  refreshNodeLabelStyles();
  attachManipulatorToSelectedNode();
  refreshMirrorButton();
  refreshDecoupleButton();
  refreshIsolationButton();
  refreshSnapButton();
  applyNodeIsolationToPreview();
  refreshInspector();
  setSummary();
  setReadyStatus();
  setStatus("Undid last studio edit.");
}

function setSummary(): void {
  if (!state.summary || !state.clip || !state.selectedPoseId) return;
  if (!state.selectedNodeId) {
    state.summary.innerText = `${state.clip.clipId} -> ${state.selectedPoseId} -> no node selected -> click a body part or drag background`;
    return;
  }
  const axisText = state.selectedAxis
    ? `${state.selectedAxis.channel}.${state.selectedAxis.axis} = ${Math.round(state.selectedAxis.value * 100) / 100}`
    : "axis/value pending";
  state.summary.innerText = `${state.clip.clipId} -> ${state.selectedPoseId} -> ${state.selectedNodeId} -> ${axisText}`;
}

function refreshLabelsToggleButton(): void {
  if (!state.labelsToggle) return;
  state.labelsToggle.innerText = state.showLabels ? "Labels On" : "Labels Off";
}

function refreshManipulatorButtons(): void {
  const activeClass = "border-[#c8aa6e] bg-[#26303a] text-[#f5e2b7]";
  const idleClass = "border-[#4b5660] bg-[#161c22] text-gray-200 hover:bg-[#1f2830]";
  if (state.moveButton) state.moveButton.className = `rounded border px-2 py-1 text-[11px] font-bold ${state.manipulatorMode === "translate" ? activeClass : idleClass}`;
  if (state.rotateButton) state.rotateButton.className = `rounded border px-2 py-1 text-[11px] font-bold ${state.manipulatorMode === "rotate" ? activeClass : idleClass}`;
  state.transformControls?.setMode(state.manipulatorMode);
}

function isRenderablePreviewObject(object: THREE.Object3D): boolean {
  const candidate = object as THREE.Object3D & {
    isMesh?: boolean;
    isLine?: boolean;
    isLineSegments?: boolean;
    isSprite?: boolean;
  };
  return !!(candidate.isMesh || candidate.isLine || candidate.isLineSegments || candidate.isSprite);
}

function collectOwnedRenderableObjects(node: THREE.Object3D, rigNodes: Set<THREE.Object3D>): THREE.Object3D[] {
  const owned: THREE.Object3D[] = [];
  const visit = (object: THREE.Object3D, allowRigNode: boolean): void => {
    if (!allowRigNode && rigNodes.has(object)) return;
    if (object !== node && isRenderablePreviewObject(object)) owned.push(object);
    object.children.forEach((child) => visit(child, false));
  };
  visit(node, true);
  return owned;
}

function applyNodeIsolationToPreview(): void {
  if (!state.previewRig || !state.schema) return;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const rigNodeEntries = state.schema.nodeOrder
    .map((nodeId) => [nodeId, nodeMap[nodeId as keyof typeof nodeMap] || null] as const)
    .filter((entry): entry is readonly [string, THREE.Object3D] => !!entry[1]);
  const rigNodes = new Set(rigNodeEntries.map((entry) => entry[1]));
  const isolatedNodeId = state.isolatedNodeId && state.isolatedNodeId !== "root"
    ? state.isolatedNodeId
    : null;

  rigNodeEntries.forEach(([nodeId, node]) => {
    if (nodeId === "root") return;
    const visible = !isolatedNodeId || nodeId === isolatedNodeId;
    collectOwnedRenderableObjects(node, rigNodes).forEach((object) => {
      object.visible = visible;
    });
  });
}

function refreshHeldItemSelect(): void {
  if (!state.heldItemSelect) return;
  const options = listStudioHeldItemOptions();
  state.heldItemSelect.innerHTML = "";

  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.innerText = "None";
  state.heldItemSelect.appendChild(noneOption);

  options.forEach((optionDef) => {
    const option = document.createElement("option");
    option.value = optionDef.itemId;
    option.innerText = optionDef.label;
    state.heldItemSelect?.appendChild(option);
  });

  const stillValid = state.selectedHeldItemId.length === 0
    || options.some((option) => option.itemId === state.selectedHeldItemId);
  if (!stillValid) state.selectedHeldItemId = "";
  state.heldItemSelect.value = state.selectedHeldItemId;
}

function applyHeldItemSelectionToPreview(): void {
  if (!state.previewRig) return;
  const weaponNode = resolveLegacyRigNodeMap(state.previewRig).weapon;
  if (typeof window.setPlayerRigToolVisual === "function") {
    window.setPlayerRigToolVisual(state.previewRig, state.selectedHeldItemId || null);
  }
  if (weaponNode) weaponNode.visible = !!state.selectedHeldItemId;
  applyNodeIsolationToPreview();
}

function refreshMirrorButton(): void {
  if (!state.mirrorButton) return;
  const enabled = !!state.selectedNodeId && resolveMirrorSubtreeNodeIds(state.selectedNodeId, state.schema).length > 0;
  state.mirrorButton.disabled = !enabled;
  state.mirrorButton.className = `rounded border px-2 py-1 text-[11px] font-bold ${
    enabled
      ? "border-[#4b5660] bg-[#161c22] text-gray-200 hover:bg-[#1f2830]"
      : "border-[#2e3740] bg-[#11161b] text-gray-500 cursor-not-allowed"
  }`;
}

function refreshIsolationButton(): void {
  if (!state.isolateButton) return;
  const active = !!state.isolatedNodeId && state.isolatedNodeId !== "root";
  const enabled = active || (!!state.selectedNodeId && state.selectedNodeId !== "root");
  state.isolateButton.disabled = !enabled;
  state.isolateButton.innerText = active ? "Isolation On" : "Isolate Node";
  state.isolateButton.className = `rounded border px-2 py-1 text-[11px] font-bold ${
    !enabled
      ? "border-[#2e3740] bg-[#11161b] text-gray-500 cursor-not-allowed"
      : active
        ? "border-[#c8aa6e] bg-[#26303a] text-[#f5e2b7]"
        : "border-[#4b5660] bg-[#161c22] text-gray-200 hover:bg-[#1f2830]"
  }`;
}

function refreshSnapButton(): void {
  if (!state.snapButton) return;
  const active = !!state.pendingSnapSourceNodeId;
  const enabled = active || (!!state.selectedNodeId && state.selectedNodeId !== "root");
  state.snapButton.disabled = !enabled;
  state.snapButton.innerText = active ? "Click Target..." : "Snap To";
  state.snapButton.className = `rounded border px-2 py-1 text-[11px] font-bold ${
    !enabled
      ? "border-[#2e3740] bg-[#11161b] text-gray-500 cursor-not-allowed"
      : active
        ? "border-[#c8aa6e] bg-[#26303a] text-[#f5e2b7]"
        : "border-[#4b5660] bg-[#161c22] text-gray-200 hover:bg-[#1f2830]"
  }`;
}

function listDescendantNodeIds(nodeId: string | null): string[] {
  if (!nodeId || nodeId === "root" || !state.schema) return [];
  const parentByNodeId = resolvePreviewRigParentNodeIds();
  const childrenByNodeId: Record<string, string[]> = {};
  state.schema.nodeOrder.forEach((schemaNodeId) => {
    childrenByNodeId[schemaNodeId] = [];
  });
  Object.entries(parentByNodeId).forEach(([schemaNodeId, parentNodeId]) => {
    if (!parentNodeId || !childrenByNodeId[parentNodeId]) return;
    childrenByNodeId[parentNodeId].push(schemaNodeId);
  });
  const descendants: string[] = [];
  const pending = [...(childrenByNodeId[nodeId] || [])];
  while (pending.length > 0) {
    const nextNodeId = pending.shift();
    if (!nextNodeId) continue;
    descendants.push(nextNodeId);
    pending.unshift(...(childrenByNodeId[nextNodeId] || []));
  }
  return descendants;
}

function isDecoupleDescendantsAvailable(nodeId: string | null): boolean {
  return listDescendantNodeIds(nodeId).length > 0;
}

function isDecoupleDescendantsActiveForSelectedNode(): boolean {
  return state.decoupleDescendants && isDecoupleDescendantsAvailable(state.selectedNodeId);
}

function refreshDecoupleButton(): void {
  if (!state.decoupleButton) return;
  const active = state.decoupleDescendants;
  const enabled = active || isDecoupleDescendantsAvailable(state.selectedNodeId);
  state.decoupleButton.disabled = !enabled;
  state.decoupleButton.innerText = active ? "Decouple On" : "Decouple Children";
  state.decoupleButton.className = `rounded border px-2 py-1 text-[11px] font-bold ${
    !enabled
      ? "border-[#2e3740] bg-[#11161b] text-gray-500 cursor-not-allowed"
      : active
        ? "border-[#c8aa6e] bg-[#26303a] text-[#f5e2b7]"
        : "border-[#4b5660] bg-[#161c22] text-gray-200 hover:bg-[#1f2830]"
  }`;
}

function captureDescendantWorldMatrices(nodeId: string | null): Map<string, THREE.Matrix4> | null {
  if (!state.previewRig || !nodeId) return null;
  const descendantNodeIds = listDescendantNodeIds(nodeId);
  if (descendantNodeIds.length === 0) return null;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  state.previewRig.updateMatrixWorld(true);
  const worldMatrices = new Map<string, THREE.Matrix4>();
  descendantNodeIds.forEach((descendantNodeId) => {
    const descendantNode = nodeMap[descendantNodeId as keyof typeof nodeMap];
    if (!descendantNode) return;
    worldMatrices.set(descendantNodeId, descendantNode.matrixWorld.clone());
  });
  return worldMatrices;
}

function applyDescendantWorldMatrices(
  nodeId: string | null,
  worldMatrices: Map<string, THREE.Matrix4> | null
): string[] {
  if (!state.previewRig || !nodeId || !worldMatrices || worldMatrices.size === 0) return [];
  const parentByNodeId = resolvePreviewRigParentNodeIds();
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const adjustedNodeIds: string[] = [];
  const descendantNodeIds = listDescendantNodeIds(nodeId);
  descendantNodeIds.forEach((descendantNodeId) => {
    const desiredWorldMatrix = worldMatrices.get(descendantNodeId);
    if (!desiredWorldMatrix) return;
    const descendantNode = nodeMap[descendantNodeId as keyof typeof nodeMap];
    const parentNodeId = parentByNodeId[descendantNodeId];
    const parentNode = parentNodeId === "root"
      ? state.previewRig
      : (parentNodeId ? nodeMap[parentNodeId as keyof typeof nodeMap] : null);
    if (!descendantNode || !parentNode) return;
    parentNode.updateMatrixWorld(true);
    const localMatrix = new THREE.Matrix4()
      .copy(parentNode.matrixWorld)
      .invert()
      .multiply(desiredWorldMatrix);
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    localMatrix.decompose(position, quaternion, scale);
    descendantNode.position.copy(position);
    descendantNode.quaternion.copy(quaternion);
    descendantNode.scale.copy(scale);
    descendantNode.updateMatrix();
    descendantNode.updateMatrixWorld(true);
    adjustedNodeIds.push(descendantNodeId);
  });
  return adjustedNodeIds;
}

function resolvePreviewRigParentNodeIds(): Record<string, string | null> {
  const parentByNodeId: Record<string, string | null> = { root: null };
  if (!state.previewRig || !state.schema) return parentByNodeId;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const objectToNodeId = new Map<THREE.Object3D, string>();
  state.schema.nodeOrder.forEach((nodeId) => {
    const node = nodeId === "root"
      ? state.previewRig
      : (nodeMap[nodeId as keyof typeof nodeMap] || null);
    if (node) objectToNodeId.set(node, nodeId);
  });
  state.schema.nodeOrder.forEach((nodeId) => {
    if (nodeId === "root") return;
    const node = nodeMap[nodeId as keyof typeof nodeMap] || null;
    if (!node) {
      parentByNodeId[nodeId] = "root";
      return;
    }
    let currentParent = node.parent;
    let resolvedParentId: string | null = "root";
    while (currentParent) {
      const parentNodeId = objectToNodeId.get(currentParent);
      if (parentNodeId) {
        resolvedParentId = parentNodeId;
        break;
      }
      currentParent = currentParent.parent;
    }
    parentByNodeId[nodeId] = resolvedParentId;
  });
  return parentByNodeId;
}

function buildMatrixFromResolvedTransform(transform: AnimationResolvedTransform | undefined): THREE.Matrix4 {
  const safeTransform = transform || {
    position: { x: 0, y: 0, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  };
  const position = new THREE.Vector3(
    safeTransform.position.x,
    safeTransform.position.y,
    safeTransform.position.z
  );
  const rotation = new THREE.Euler(
    safeTransform.rotationDeg.x * (Math.PI / 180),
    safeTransform.rotationDeg.y * (Math.PI / 180),
    safeTransform.rotationDeg.z * (Math.PI / 180),
    "XYZ"
  );
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  const scale = new THREE.Vector3(
    safeTransform.scale.x,
    safeTransform.scale.y,
    safeTransform.scale.z
  );
  return new THREE.Matrix4().compose(position, quaternion, scale);
}

function buildBindWorldMatrices(): Record<string, THREE.Matrix4> {
  const matrices: Record<string, THREE.Matrix4> = {};
  if (!state.schema || !state.bindPose) return matrices;
  const parentByNodeId = resolvePreviewRigParentNodeIds();
  const resolveWorldMatrix = (nodeId: string): THREE.Matrix4 => {
    if (matrices[nodeId]) return matrices[nodeId].clone();
    const localMatrix = buildMatrixFromResolvedTransform(state.bindPose?.[nodeId]);
    const parentNodeId = parentByNodeId[nodeId];
    const worldMatrix = parentNodeId
      ? resolveWorldMatrix(parentNodeId).multiply(localMatrix)
      : localMatrix;
    matrices[nodeId] = worldMatrix.clone();
    return worldMatrix;
  };
  state.schema.nodeOrder.forEach((nodeId) => {
    resolveWorldMatrix(nodeId);
  });
  return matrices;
}

function resolveBindLocalPositionVector(nodeId: string): THREE.Vector3 | null {
  const transform = state.bindPose?.[nodeId];
  if (!transform) return null;
  return new THREE.Vector3(
    transform.position.x,
    transform.position.y,
    transform.position.z
  );
}

function setPoseNodeLocalPosition(
  pose: AnimationClip["poses"][string],
  nodeId: string,
  position: THREE.Vector3
): AnimationClip["poses"][string] {
  const existingNode = pose[nodeId] || {};
  return {
    ...pose,
    [nodeId]: {
      ...existingNode,
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      }
    }
  };
}

function executeSnapToTarget(sourceNodeId: string, targetNodeId: string): boolean {
  if (!state.previewRig || !state.clip || !state.selectedPoseId || !state.schema || !state.bindPose) return false;
  if (sourceNodeId === "root" || targetNodeId === sourceNodeId) return false;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const sourceNode = nodeMap[sourceNodeId as keyof typeof nodeMap];
  const targetNode = targetNodeId === "root"
    ? state.previewRig
    : (nodeMap[targetNodeId as keyof typeof nodeMap] || null);
  if (!sourceNode || !targetNode) return false;
  const sourceParent = sourceNode.parent;
  if (!sourceParent) return false;

  const bindParentNodeIds = resolvePreviewRigParentNodeIds();
  const sourceBindParentNodeId = bindParentNodeIds[sourceNodeId] || null;
  const targetBindParentNodeId = bindParentNodeIds[targetNodeId] || null;
  const sourceBindLocalPosition = resolveBindLocalPositionVector(sourceNodeId);
  const targetBindLocalPosition = resolveBindLocalPositionVector(targetNodeId);

  if (targetBindParentNodeId === sourceNodeId && targetBindLocalPosition) {
    state.previewRig.updateMatrixWorld(true);
    const deltaLocal = targetNode.position.clone().sub(targetBindLocalPosition);
    const sourceRotScaleMatrix = sourceNode.matrix.clone();
    sourceRotScaleMatrix.setPosition(0, 0, 0);
    const sourceDeltaInParentSpace = deltaLocal.clone().applyMatrix4(sourceRotScaleMatrix);
    const nextSourcePosition = sourceNode.position.clone().add(sourceDeltaInParentSpace);

    const clip = cloneAnimationClip(state.clip);
    let pose = clip.poses[state.selectedPoseId] || {};
    pose = setPoseNodeLocalPosition(pose, sourceNodeId, nextSourcePosition);
    pose = setPoseNodeLocalPosition(pose, targetNodeId, targetBindLocalPosition);
    clip.poses = {
      ...clip.poses,
      [state.selectedPoseId]: pose
    };
    commitClip(clip, false);
    selectNode(sourceNodeId);
    setStatus(`Snapped ${getNodeDisplayLabel(sourceNodeId)} down to ${getNodeDisplayLabel(targetNodeId)}.`);
    return true;
  }

  if (sourceBindParentNodeId === targetNodeId && sourceBindLocalPosition) {
    const clip = cloneAnimationClip(state.clip);
    const pose = setPoseNodeLocalPosition(clip.poses[state.selectedPoseId] || {}, sourceNodeId, sourceBindLocalPosition);
    clip.poses = {
      ...clip.poses,
      [state.selectedPoseId]: pose
    };
    commitClip(clip, false);
    selectNode(sourceNodeId);
    setStatus(`Snapped ${getNodeDisplayLabel(sourceNodeId)} back onto ${getNodeDisplayLabel(targetNodeId)}.`);
    return true;
  }

  state.previewRig.updateMatrixWorld(true);
  const bindWorldMatrices = buildBindWorldMatrices();
  const sourceBindWorld = bindWorldMatrices[sourceNodeId];
  const targetBindWorld = bindWorldMatrices[targetNodeId];
  if (!sourceBindWorld || !targetBindWorld) return false;

  const relativeBindPosition = new THREE.Vector3()
    .setFromMatrixPosition(sourceBindWorld)
    .applyMatrix4(new THREE.Matrix4().copy(targetBindWorld).invert());
  const desiredWorldPosition = relativeBindPosition.applyMatrix4(targetNode.matrixWorld.clone());
  const desiredLocalPosition = sourceParent.worldToLocal(desiredWorldPosition.clone());

  const clip = cloneAnimationClip(state.clip);
  const pose = setPoseNodeLocalPosition(
    clip.poses[state.selectedPoseId] || {},
    sourceNodeId,
    desiredLocalPosition
  );
  clip.poses = {
    ...clip.poses,
    [state.selectedPoseId]: pose
  };
  commitClip(clip, false);
  selectNode(sourceNodeId);
  setStatus(`Snapped ${getNodeDisplayLabel(sourceNodeId)} to ${getNodeDisplayLabel(targetNodeId)}.`);
  return true;
}

function refreshNodeLabelStyles(): void {
  state.nodeLabels.forEach((label, nodeId) => {
    const isSelected = nodeId === state.selectedNodeId;
    label.className = `pointer-events-none absolute rounded border px-1 py-0.5 text-[10px] font-bold ${
      isSelected
        ? "border-[#f5e2b7] bg-[#2a2113]/90 text-[#f5e2b7]"
        : "border-transparent bg-black/75 text-gray-200"
    }`;
  });
}

function clearInspectorInputs(): void {
  inspectorInputs.forEach((input) => {
    input.value = "";
  });
}

function attachManipulatorToSelectedNode(): void {
  if (!state.transformControls) return;
  if (!state.previewRig || !state.selectedNodeId) {
    state.transformControls.detach();
    return;
  }
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const node = nodeMap[state.selectedNodeId as keyof typeof nodeMap];
  if (!node || state.selectedNodeId === "root") {
    state.transformControls.detach();
    return;
  }
  state.transformControls.attach(node);
  state.transformControls.setMode(state.manipulatorMode);
  state.transformControls.setSpace("local");
}

function selectNode(nodeId: string | null): void {
  if (nodeId && state.schema && !state.schema.nodes[nodeId]) return;
  state.selectedNodeId = nodeId;
  state.decoupledDescendantWorldMatrices = null;
  if (state.nodeSelect) {
    if (!nodeId) state.nodeSelect.selectedIndex = 0;
    else state.nodeSelect.value = nodeId;
  }
  if (!nodeId) clearInspectorInputs();
  else refreshInspector();
  refreshNodeLabelStyles();
  attachManipulatorToSelectedNode();
  refreshMirrorButton();
  refreshDecoupleButton();
  refreshIsolationButton();
  refreshSnapButton();
  applyNodeIsolationToPreview();
  setSummary();
}

function ensureClip(clipId: string): void {
  const clip = getAnimationClip(clipId);
  const descriptor = getAnimationClipDescriptor(clipId);
  if (!clip || !descriptor) return;
  clearUndoHistory();
  const schema = getAnimationRigSchema(clip.rigId);
  if (!schema) return;
  state.clip = clip;
  state.descriptor = descriptor;
  state.schema = schema;
  state.draftDirty = false;
  state.selectedPoseId = Object.keys(clip.poses)[0] || null;
  state.timeMs = Math.max(0, Math.min(state.timeMs, clip.durationMs));
  if (state.timeline) {
    state.timeline.max = String(clip.durationMs);
    state.timeline.value = String(Math.floor(state.timeMs));
  }
  if (state.durationInput) state.durationInput.value = String(Math.round(clip.durationMs));
  refreshPoseList();
  refreshKeyList();
  refreshMarkerLane();
  refreshKeyLane();
  refreshNodeSelect();
  refreshNodeLabels();
  refreshMirrorButton();
  refreshDecoupleButton();
  refreshIsolationButton();
  refreshSnapButton();
  refreshPoseClipboardButtons();
  applyNodeIsolationToPreview();
  refreshInspector();
  setSummary();
  setReadyStatus();
}

function commitClip(nextClip: AnimationClip, refreshStructure = true, recordUndo = true): void {
  if (recordUndo && !state.undoTransactionEntry) pushUndoEntry(createStudioUndoEntry());
  state.clip = sortClipKeysAndMarkers(nextClip);
  state.timeMs = Math.max(0, Math.min(state.timeMs, state.clip.durationMs));
  state.draftDirty = true;
  if (state.timeline) {
    state.timeline.max = String(state.clip.durationMs);
    state.timeline.value = String(Math.floor(state.timeMs));
  }
  if (state.durationInput) state.durationInput.value = String(Math.round(state.clip.durationMs));
  if (refreshStructure) {
    refreshPoseList();
    refreshKeyList();
    refreshMarkerLane();
    refreshKeyLane();
  }
  refreshInspector();
  refreshPoseClipboardButtons();
  setSummary();
  setReadyStatus();
  refreshUndoButton();
}

function syncPoseNodeTransformsFromPreview(nodeIds: string[]): void {
  if (!state.previewRig || !state.clip || !state.selectedPoseId) return;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const uniqueNodeIds = Array.from(new Set(nodeIds.filter((nodeId) => !!nodeId && nodeId !== "root")));
  if (uniqueNodeIds.length === 0) return;
  const clip = cloneAnimationClip(state.clip);
  const pose = clip.poses[state.selectedPoseId] || {};
  const nextPose = { ...pose };
  uniqueNodeIds.forEach((nodeId) => {
    const node = nodeMap[nodeId as keyof typeof nodeMap];
    if (!node) return;
    const existingNode = pose[nodeId] || {};
    nextPose[nodeId] = {
      ...existingNode,
      position: {
        x: node.position.x,
        y: node.position.y,
        z: node.position.z
      },
      rotationDeg: {
        x: node.rotation.x * (180 / Math.PI),
        y: node.rotation.y * (180 / Math.PI),
        z: node.rotation.z * (180 / Math.PI)
      },
      scale: {
        x: node.scale.x,
        y: node.scale.y,
        z: node.scale.z
      }
    };
  });
  clip.poses = {
    ...clip.poses,
    [state.selectedPoseId]: nextPose
  };
  commitClip(clip, false);
}

function syncSelectedNodeTransformFromPreview(): void {
  if (!state.selectedNodeId) return;
  syncPoseNodeTransformsFromPreview([state.selectedNodeId]);
}

function syncSelectedNodeTransformWithDecoupledDescendantsFromPreview(): void {
  if (!state.selectedNodeId) return;
  const preservedWorldMatrices = state.decoupledDescendantWorldMatrices
    || captureDescendantWorldMatrices(state.selectedNodeId);
  const adjustedDescendantNodeIds = applyDescendantWorldMatrices(state.selectedNodeId, preservedWorldMatrices);
  syncPoseNodeTransformsFromPreview([state.selectedNodeId, ...adjustedDescendantNodeIds]);
}

function applySelectedNodeChannelValue(channel: AnimationChannelId, axis: AxisId, value: number): boolean {
  if (!state.previewRig || !state.selectedNodeId) return false;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const node = nodeMap[state.selectedNodeId as keyof typeof nodeMap];
  if (!node) return false;
  const preservedWorldMatrices = isDecoupleDescendantsActiveForSelectedNode()
    ? captureDescendantWorldMatrices(state.selectedNodeId)
    : null;
  if (channel === "position") node.position[axis] = value;
  if (channel === "rotationDeg") node.rotation[axis] = value * (Math.PI / 180);
  if (channel === "scale") node.scale[axis] = value;
  node.updateMatrix();
  node.updateMatrixWorld(true);
  const adjustedDescendantNodeIds = applyDescendantWorldMatrices(state.selectedNodeId, preservedWorldMatrices);
  syncPoseNodeTransformsFromPreview([state.selectedNodeId, ...adjustedDescendantNodeIds]);
  return true;
}

function toggleDecoupleDescendantsMode(): void {
  if (state.decoupleDescendants) {
    state.decoupleDescendants = false;
    state.decoupledDescendantWorldMatrices = null;
    refreshDecoupleButton();
    setStatus("Decouple Children disabled. Descendants will follow parent nodes again.");
    return;
  }
  if (!isDecoupleDescendantsAvailable(state.selectedNodeId)) {
    refreshDecoupleButton();
    setStatus("Select a node with child parts first.");
    return;
  }
  state.decoupleDescendants = true;
  state.decoupledDescendantWorldMatrices = null;
  refreshDecoupleButton();
  setStatus("Decouple Children enabled. Descendants stay put until you toggle it off.");
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = "animation-studio-overlay";
  overlay.className = "hidden fixed inset-0 z-[1400] bg-[#04070b]/95 text-gray-100 pointer-events-auto";
  overlay.innerHTML = `
    <div class="absolute inset-0 flex flex-col gap-3 p-4">
      <div class="flex items-center justify-between rounded border border-[#3a444c] bg-[#0d1318] px-3 py-2">
        <div>
          <div class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c8aa6e]">Animation Studio</div>
          <div id="animation-studio-status" class="text-[11px] text-gray-300">Booting...</div>
        </div>
        <div class="flex gap-2">
          <button id="animation-studio-play" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Play</button>
          <button id="animation-studio-undo" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Undo</button>
          <button id="animation-studio-save" type="button" class="rounded border border-[#c8aa6e] bg-[#201a11] px-2 py-1 text-[11px] font-bold text-[#f5e2b7] hover:bg-[#2b2216]">Save</button>
          <button id="animation-studio-close" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Close</button>
        </div>
      </div>
      <div class="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_310px] gap-3">
        <div class="min-h-0 rounded border border-[#3a444c] bg-[#0d1318] p-3 flex flex-col gap-3">
          <div>
            <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8aa6e]">Clips</div>
            <div class="mb-2 rounded border border-[#39434c] bg-[#10161b] p-2">
              <div class="mb-1 text-[11px] font-bold text-gray-300">New Clip</div>
              <div class="flex gap-1">
                <input id="animation-studio-new-clip-name" type="text" class="flex-1 rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100" placeholder="player/mining_test">
                <button id="animation-studio-create-clip" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Create</button>
              </div>
            </div>
            <div id="animation-studio-clips" class="space-y-1 max-h-52 overflow-y-auto"></div>
          </div>
          <div class="min-h-0 flex-1">
            <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8aa6e]">Named Poses</div>
            <div id="animation-studio-poses" class="space-y-1 max-h-[240px] overflow-y-auto"></div>
          </div>
          <div class="rounded border border-[#39434c] bg-[#10161b] p-2">
            <div class="mb-1 text-[11px] font-bold text-gray-300">Pose Tools</div>
            <input id="animation-studio-pose-name" type="text" class="mb-1 w-full rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100" placeholder="new pose">
            <div class="flex gap-1">
              <button id="animation-studio-add-pose" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Add</button>
              <button id="animation-studio-duplicate-pose-btn" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Duplicate</button>
              <input id="animation-studio-rename-pose" type="text" class="flex-1 rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100" placeholder="rename">
              <button id="animation-studio-rename-pose-btn" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Rename</button>
            </div>
            <div class="mt-1 flex gap-1">
              <button id="animation-studio-copy-pose-btn" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Copy Pose</button>
              <button id="animation-studio-paste-pose-btn" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Paste Over</button>
              <button id="animation-studio-paste-pose-new-btn" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Paste New</button>
            </div>
            <div class="mt-1 flex gap-1 justify-end">
              <button id="animation-studio-move-pose-up-btn" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Up</button>
              <button id="animation-studio-move-pose-down-btn" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Down</button>
              <button id="animation-studio-delete-pose-btn" type="button" class="rounded border border-[#6a3c3c] bg-[#221313] px-2 py-1 text-[11px] font-bold text-[#f1c7c7] hover:bg-[#2d1717]">Delete Pose</button>
            </div>
          </div>
        </div>
        <div class="min-h-0 flex flex-col gap-3">
          <div class="flex items-center justify-between rounded border border-[#3a444c] bg-[#0d1318] px-3 py-2">
            <div id="animation-studio-summary" class="text-[11px] font-bold text-[#f5e2b7]">clip -> pose -> node -> axis/value</div>
            <div class="flex gap-1">
              <button id="animation-studio-move" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Move</button>
              <button id="animation-studio-rotate" type="button" class="rounded border border-[#c8aa6e] bg-[#26303a] px-2 py-1 text-[11px] font-bold text-[#f5e2b7]">Rotate</button>
              <button id="animation-studio-toggle-labels" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Labels On</button>
              <button id="animation-studio-cam-front" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Front</button>
              <button id="animation-studio-cam-side" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Side</button>
              <button id="animation-studio-cam-three-quarter" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">3/4</button>
            </div>
          </div>
          <div id="animation-studio-canvas-wrap" class="relative min-h-0 flex-1 cursor-pointer overflow-hidden rounded border border-[#3a444c] bg-[#091017]">
            <canvas id="animation-studio-canvas" class="block h-full w-full"></canvas>
            <div id="animation-studio-labels" class="pointer-events-none absolute inset-0"></div>
          </div>
          <div class="rounded border border-[#3a444c] bg-[#0d1318] p-3">
            <div class="mb-2 flex items-center gap-2">
              <div id="animation-studio-timeline-wrap" class="relative flex-1 pr-4">
                <input id="animation-studio-timeline" type="range" min="0" max="1000" value="0" class="w-full">
                <div id="animation-studio-duration-handle" class="absolute right-0 top-1/2 h-5 w-3 -translate-y-1/2 cursor-ew-resize rounded border border-[#c8aa6e] bg-[#201a11]" title="Drag to resize clip length"></div>
              </div>
              <button id="animation-studio-key" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Add/Update Key</button>
              <select id="animation-studio-ease" class="rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100">
                <option value="linear">linear</option>
                <option value="easeIn">easeIn</option>
                <option value="easeOut">easeOut</option>
                <option value="easeInOut" selected>easeInOut</option>
                <option value="hold">hold</option>
              </select>
              <label class="flex items-center gap-1 text-[11px] font-bold text-gray-300">
                Len
                <input id="animation-studio-duration" type="number" min="1" step="10" class="w-20 rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100">
              </label>
            </div>
            <div id="animation-studio-playhead-summary" class="mb-2 text-[11px] text-gray-300">playhead</div>
            <div class="relative mb-2 h-12 rounded border border-[#39434c] bg-[#10161b]">
              <div id="animation-studio-markers" class="absolute inset-0"></div>
              <div id="animation-studio-key-lane" class="absolute inset-0"></div>
            </div>
            <div class="mb-2 flex gap-2">
              <input id="animation-studio-marker-name" type="text" class="flex-1 rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100" placeholder="marker name">
              <button id="animation-studio-add-marker" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Add Marker</button>
            </div>
            <div id="animation-studio-keys" class="flex flex-wrap gap-1"></div>
          </div>
        </div>
        <div class="min-h-0 rounded border border-[#3a444c] bg-[#0d1318] p-3 flex flex-col gap-3">
          <div class="rounded border border-[#39434c] bg-[#10161b] p-2">
            <div class="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8aa6e]">Inspector</div>
            <select id="animation-studio-node-select" class="w-full rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100"></select>
          </div>
          <div class="rounded border border-[#39434c] bg-[#10161b] p-2">
            <div class="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8aa6e]">Held Item</div>
            <select id="animation-studio-held-item-select" class="w-full rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100"></select>
          </div>
          <div id="animation-studio-inspector" class="space-y-2"></div>
          <div class="flex flex-wrap gap-2">
            <button id="animation-studio-isolate-node" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Isolate Node</button>
            <button id="animation-studio-snap-node" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Snap To</button>
            <button id="animation-studio-decouple-children" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Decouple Children</button>
            <button id="animation-studio-mirror-limb" type="button" class="rounded border border-[#2e3740] bg-[#11161b] px-2 py-1 text-[11px] font-bold text-gray-500 cursor-not-allowed" disabled>Mirror Limb</button>
            <button id="animation-studio-reset-node" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Reset Node</button>
          </div>
          <div class="min-h-0 flex-1 rounded border border-[#39434c] bg-[#10161b] p-2">
            <div class="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8aa6e]">Export</div>
            <textarea id="animation-studio-export" class="h-full min-h-[180px] w-full rounded border border-[#39434c] bg-[#0a0f13] p-2 font-mono text-[10px] text-gray-200"></textarea>
          </div>
        </div>
      </div>
    </div>
  `;
  return overlay;
}

function refreshClipList(): void {
  if (!state.clipList) return;
  state.clipList.innerHTML = "";
  listAnimationClipDescriptors().forEach((descriptor) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `w-full rounded border px-2 py-1 text-left text-[11px] font-bold ${
      descriptor.clipId === state.clip?.clipId
        ? "border-[#c8aa6e] bg-[#26303a] text-[#f5e2b7]"
        : "border-[#39434c] bg-[#12181d] text-gray-200 hover:bg-[#1b232a]"
    }`;
    button.innerText = descriptor.clipId;
    button.addEventListener("click", () => {
      ensureClip(descriptor.clipId);
      refreshClipList();
    });
    state.clipList?.appendChild(button);
  });
}

function createNewClip(): void {
  const requestedName = state.newClipName?.value || "";
  const clipId = buildUniqueClipId(requestedName || DEFAULT_NEW_CLIP_ID);
  const descriptor: AnimationClipDescriptor = {
    clipId,
    rigId: "player_humanoid_v1",
    sourcePath: buildStudioSourcePath(clipId)
  };
  registerAnimationClip(descriptor, buildFreshClip(clipId));
  ensureClip(clipId);
  selectNode(null);
  refreshClipList();
  if (state.newClipName) state.newClipName.value = clipId;
  state.draftDirty = true;
  if (state.renamePose) state.renamePose.value = state.selectedPoseId || "neutral";
  setReadyStatus();
  setStatus(`Created ${clipId}. Add poses and save when ready.`);
}

function pausePlayback(): void {
  state.playing = false;
  if (state.playButton) state.playButton.innerText = "Play";
}

function setPlayheadTime(timeMs: number): void {
  state.timeMs = timeMs;
  if (state.timeline) state.timeline.value = String(Math.round(timeMs));
}

function findFirstKeyForPose(poseId: string) {
  return state.clip?.keys.find((key) => key.poseId === poseId) || null;
}

function findFirstKeyIndexForPose(poseId: string): number {
  if (!state.clip) return -1;
  return state.clip.keys.findIndex((key) => key.poseId === poseId);
}

function isKeyTimeOccupied(clip: AnimationClip, atMs: number, ignoredKeyIndex = -1): boolean {
  return clip.keys.some((key, index) => index !== ignoredKeyIndex && Math.abs(key.atMs - atMs) <= 1);
}

function findNearestAvailableKeyTime(clip: AnimationClip, preferredTimeMs: number, ignoredKeyIndex = -1): number {
  const clampedTimeMs = Math.max(0, Math.min(clip.durationMs, Math.round(preferredTimeMs)));
  if (!isKeyTimeOccupied(clip, clampedTimeMs, ignoredKeyIndex)) return clampedTimeMs;
  const maxOffset = Math.max(clampedTimeMs, clip.durationMs - clampedTimeMs);
  for (let offset = 1; offset <= maxOffset; offset += 1) {
    const earlier = clampedTimeMs - offset;
    if (earlier >= 0 && !isKeyTimeOccupied(clip, earlier, ignoredKeyIndex)) return earlier;
    const later = clampedTimeMs + offset;
    if (later <= clip.durationMs && !isKeyTimeOccupied(clip, later, ignoredKeyIndex)) return later;
  }
  return clampedTimeMs;
}

function isSelectedPoseUnkeyed(): boolean {
  return !!state.selectedPoseId && findFirstKeyIndexForPose(state.selectedPoseId) < 0;
}

function resolveStudioPreviewPose(): AnimationResolvedPose | null {
  if (!state.clip || !state.schema || !state.bindPose) return null;
  const shouldPreviewSelectedPose = !state.playing && !!state.selectedPoseId && isSelectedPoseUnkeyed();
  if (!shouldPreviewSelectedPose || !state.selectedPoseId) {
    return sampleAnimationClip(state.clip, state.schema, state.bindPose, state.timeMs);
  }
  const selectedPose = state.clip.poses[state.selectedPoseId];
  if (!selectedPose) {
    return sampleAnimationClip(state.clip, state.schema, state.bindPose, state.timeMs);
  }
  const previewClip: AnimationClip = {
    ...cloneAnimationClip(state.clip),
    poses: {
      [state.selectedPoseId]: selectedPose
    },
    keys: [
      {
        poseId: state.selectedPoseId,
        atMs: 0,
        ease: "hold"
      }
    ],
    markers: [],
    durationMs: Math.max(1, state.clip.durationMs)
  };
  return sampleAnimationClip(previewClip, state.schema, state.bindPose, 0);
}

function getOrderedPoseIds(clip: AnimationClip): string[] {
  return Object.keys(clip.poses);
}

function buildOrderedPosesMap(clip: AnimationClip, orderedPoseIds: string[]): AnimationClip["poses"] {
  return orderedPoseIds.reduce<AnimationClip["poses"]>((acc, poseId) => {
    if (clip.poses[poseId]) acc[poseId] = clip.poses[poseId];
    return acc;
  }, {});
}

function buildUniquePoseId(basePoseId: string): string {
  if (!state.clip) return `${basePoseId}_copy`;
  const trimmedBase = `${basePoseId || "pose"}_copy`;
  if (!state.clip.poses[trimmedBase]) return trimmedBase;
  let suffix = 2;
  while (state.clip.poses[`${trimmedBase}${suffix}`]) suffix += 1;
  return `${trimmedBase}${suffix}`;
}

function findKeyIndexAtPlayhead(): number {
  if (!state.clip) return -1;
  const atMs = Math.round(state.timeMs);
  return state.clip.keys.findIndex((key) => Math.abs(key.atMs - atMs) <= 1);
}

function moveSelectedPoseKeyToTime(timeMs: number): boolean {
  if (!state.clip || !state.selectedPoseId) return false;
  const clip = cloneAnimationClip(state.clip);
  const requestedTimeMs = Math.max(0, Math.min(clip.durationMs, Math.round(timeMs)));
  const keyIndex = clip.keys.findIndex((key) => key.poseId === state.selectedPoseId);
  const resolvedTimeMs = findNearestAvailableKeyTime(clip, requestedTimeMs, keyIndex);
  if (keyIndex < 0) {
    const ease = (state.easeSelect?.value || "easeInOut") as AnimationClip["keys"][number]["ease"];
    clip.keys.push({
      poseId: state.selectedPoseId,
      atMs: resolvedTimeMs,
      ease
    });
    commitClip(clip);
    setPlayheadTime(resolvedTimeMs);
    if (state.easeSelect) state.easeSelect.value = ease;
    if (resolvedTimeMs !== requestedTimeMs) {
      setStatus(`Placed pose ${state.selectedPoseId} at ${resolvedTimeMs}ms (${requestedTimeMs}ms was occupied).`);
    } else {
      setStatus(`Placed pose ${state.selectedPoseId} at ${resolvedTimeMs}ms.`);
    }
    return true;
  }
  clip.keys[keyIndex] = {
    ...clip.keys[keyIndex],
    atMs: resolvedTimeMs
  };
  commitClip(clip);
  setPlayheadTime(resolvedTimeMs);
  if (state.easeSelect) state.easeSelect.value = clip.keys[keyIndex].ease;
  if (resolvedTimeMs !== requestedTimeMs) {
    setStatus(`Moved pose ${state.selectedPoseId} to ${resolvedTimeMs}ms (${requestedTimeMs}ms was occupied).`);
  }
  return true;
}

function selectPose(poseId: string, jumpToFirstKey = true): void {
  if (!state.clip || !state.clip.poses[poseId]) return;
  state.selectedPoseId = poseId;
  if (state.renamePose) state.renamePose.value = poseId;
  if (jumpToFirstKey) {
    const key = findFirstKeyForPose(poseId);
    if (key) {
      setPlayheadTime(key.atMs);
      if (state.easeSelect) state.easeSelect.value = key.ease;
    }
  }
  pausePlayback();
  refreshPoseList();
  refreshKeyLane();
  refreshInspector();
  refreshPoseClipboardButtons();
  setSummary();
}

function focusRenamePoseInput(selectText = true): void {
  if (!state.renamePose) return;
  state.renamePose.focus();
  if (selectText) state.renamePose.select();
}

function refreshPoseList(): void {
  if (!state.poseList || !state.clip) return;
  state.poseList.innerHTML = "";
  Object.keys(state.clip.poses).forEach((poseId) => {
    const firstKey = findFirstKeyForPose(poseId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `w-full rounded border px-2 py-1 text-left text-[11px] font-bold ${
      poseId === state.selectedPoseId
        ? "border-[#c8aa6e] bg-[#26303a] text-[#f5e2b7]"
        : "border-[#39434c] bg-[#12181d] text-gray-200 hover:bg-[#1b232a]"
    }`;
    button.innerText = firstKey
      ? `${poseId} @ ${firstKey.atMs}ms`
      : `${poseId} (unkeyed)`;
    button.addEventListener("click", () => {
      selectPose(poseId, true);
    });
    button.addEventListener("dblclick", () => {
      selectPose(poseId, false);
      focusRenamePoseInput(true);
      setStatus(`Rename ${poseId} and press Enter.`);
    });
    state.poseList?.appendChild(button);
  });
  if (state.renamePose && state.selectedPoseId) state.renamePose.value = state.selectedPoseId;
}

function refreshKeyList(): void {
  if (!state.keyList || !state.clip) return;
  state.keyList.innerHTML = "";
  state.clip.keys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rounded border border-[#39434c] bg-[#12181d] px-2 py-1 text-[10px] font-bold text-gray-200 hover:bg-[#1b232a]";
    button.innerText = `${key.poseId} @ ${key.atMs}ms [${key.ease}]`;
    button.addEventListener("click", () => {
      setPlayheadTime(key.atMs);
      selectPose(key.poseId, false);
      if (state.easeSelect) state.easeSelect.value = key.ease;
      pausePlayback();
      refreshInspector();
      setSummary();
    });
    state.keyList?.appendChild(button);
  });
}

function refreshMarkerLane(): void {
  if (!state.markerLane || !state.clip) return;
  state.markerLane.innerHTML = "";
  const duration = Math.max(1, state.clip.durationMs);
  state.clip.markers.forEach((marker) => {
    const chip = document.createElement("div");
    chip.className = "absolute top-1 -translate-x-1/2 rounded border border-[#c8aa6e] bg-[#201a11] px-1 py-0.5 text-[10px] font-bold text-[#f5e2b7]";
    chip.style.left = `${(marker.atMs / duration) * 100}%`;
    chip.innerText = marker.markerId;
    state.markerLane?.appendChild(chip);
  });
}

function refreshKeyLane(): void {
  if (!state.keyLane || !state.clip) return;
  state.keyLane.innerHTML = "";
  const duration = Math.max(1, state.clip.durationMs);
  state.clip.keys.forEach((key) => {
    const chip = document.createElement("button");
    chip.type = "button";
    const isSelected = key.poseId === state.selectedPoseId;
    chip.className = `absolute top-7 -translate-x-1/2 rounded border px-1 py-0.5 text-[10px] font-bold ${
      isSelected
        ? "border-[#c8aa6e] bg-[#26303a] text-[#f5e2b7]"
        : "border-[#39434c] bg-[#12181d] text-gray-200 hover:bg-[#1b232a]"
    }`;
    chip.style.left = `${(key.atMs / duration) * 100}%`;
    chip.innerText = key.poseId;
    chip.addEventListener("click", () => {
      setPlayheadTime(key.atMs);
      selectPose(key.poseId, false);
      if (state.easeSelect) state.easeSelect.value = key.ease;
      pausePlayback();
      refreshKeyList();
    });
    state.keyLane?.appendChild(chip);
  });
}

function refreshNodeSelect(): void {
  if (!state.nodeSelect || !state.schema) return;
  state.nodeSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.innerText = "No selection";
  state.nodeSelect.appendChild(placeholder);
  state.schema.nodeOrder.forEach((nodeId) => {
    const option = document.createElement("option");
    const node = state.schema?.nodes[nodeId];
    option.value = nodeId;
    option.innerText = node?.mirrorId ? `${node.label} ↔ ${node.mirrorId}` : (node?.label || nodeId);
    state.nodeSelect?.appendChild(option);
  });
  state.nodeSelect.value = state.selectedNodeId || "";
}

function refreshNodeLabels(): void {
  if (!state.labels || !state.schema) return;
  state.labels.innerHTML = "";
  state.nodeLabels.clear();
  state.schema.nodeOrder.filter((nodeId) => nodeId !== "root").forEach((nodeId) => {
    const label = document.createElement("div");
    const node = state.schema?.nodes[nodeId];
    label.className = "pointer-events-none absolute rounded bg-black/75 px-1 py-0.5 text-[10px] font-bold text-gray-200";
    label.innerText = node?.mirrorId ? `${node.label} ↔ ${node.mirrorId}` : (node?.label || nodeId);
    state.labels?.appendChild(label);
    state.nodeLabels.set(nodeId, label);
  });
  refreshNodeLabelStyles();
}

function toggleNodeIsolation(): void {
  if (state.isolatedNodeId) {
    const clearedNodeId = state.isolatedNodeId;
    state.isolatedNodeId = null;
    refreshIsolationButton();
    applyNodeIsolationToPreview();
    updatePreviewLabels();
    setStatus(`Isolation cleared for ${getNodeDisplayLabel(clearedNodeId)}.`);
    return;
  }
  if (!state.selectedNodeId || state.selectedNodeId === "root") {
    refreshIsolationButton();
    applyNodeIsolationToPreview();
    setStatus("Select a body part node to isolate.");
    return;
  }
  state.isolatedNodeId = state.selectedNodeId;
  refreshIsolationButton();
  applyNodeIsolationToPreview();
  updatePreviewLabels();
  setStatus(
    `Isolating ${getNodeDisplayLabel(state.isolatedNodeId)} until you toggle isolation off.`
  );
}

function toggleSnapToMode(): void {
  if (state.pendingSnapSourceNodeId) {
    const cancelledSource = state.pendingSnapSourceNodeId;
    state.pendingSnapSourceNodeId = null;
    refreshSnapButton();
    setStatus(`Snap cancelled for ${getNodeDisplayLabel(cancelledSource)}.`);
    return;
  }
  if (!state.selectedNodeId || state.selectedNodeId === "root") {
    refreshSnapButton();
    setStatus("Select a body part node to snap from first.");
    return;
  }
  state.pendingSnapSourceNodeId = state.selectedNodeId;
  refreshSnapButton();
  setStatus(`Snap To armed for ${getNodeDisplayLabel(state.selectedNodeId)}. Click the target node.`);
}

function countFractionDigits(valueText: string): number {
  const decimalIndex = valueText.indexOf(".");
  return decimalIndex >= 0 ? Math.max(0, valueText.length - decimalIndex - 1) : 0;
}

function resolveCaretStepMagnitude(valueText: string, caretIndex: number | null): number | null {
  if (!Number.isInteger(caretIndex) || caretIndex === null || caretIndex <= 0) return null;
  const leftIndex = caretIndex - 1;
  const leftChar = valueText.charAt(leftIndex);
  if (!/[0-9]/.test(leftChar)) return null;
  const firstDigitIndex = valueText.search(/[0-9]/);
  if (firstDigitIndex < 0 || leftIndex < firstDigitIndex) return null;
  const decimalIndex = valueText.indexOf(".");
  const exponent = decimalIndex < 0
    ? valueText.length - leftIndex - 1
    : (leftIndex < decimalIndex ? decimalIndex - leftIndex - 1 : decimalIndex - leftIndex);
  return 10 ** exponent;
}

function formatInspectorNumericValue(value: number, fractionDigits: number): string {
  const safeDigits = Math.max(0, Math.min(4, Math.round(fractionDigits)));
  const normalized = Math.abs(value) < 10 ** (-(safeDigits + 2)) ? 0 : value;
  return normalized.toFixed(safeDigits);
}

function createInspectorSection(label: string, channel: AnimationChannelId): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "rounded border border-[#39434c] bg-[#10161b] p-2";
  const heading = document.createElement("div");
  heading.className = "mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8aa6e]";
  heading.innerText = label;
  wrap.appendChild(heading);
  const row = document.createElement("div");
  row.className = "grid grid-cols-3 gap-1";
  wrap.appendChild(row);
  (["x", "y", "z"] as AxisId[]).forEach((axis) => {
    const inputKey = `${channel}.${axis}`;
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.spellcheck = false;
    input.className = "rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100";
    input.addEventListener("focus", () => {
      state.activeInspectorInputKey = inputKey;
      const value = Number(input.value) || 0;
      state.selectedAxis = { channel, axis, value };
      setSummary();
    });
    input.addEventListener("input", () => {
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      state.selectedAxis = { channel, axis, value };
      setSummary();
    });
    input.addEventListener("change", () => {
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      updateSelectedChannel(channel, axis, value);
    });
    input.addEventListener("wheel", (event) => {
      if (document.activeElement !== input) return;
      const currentValue = Number(input.value);
      if (!Number.isFinite(currentValue)) return;
      const caretIndex = input.selectionStart;
      const stepMagnitude = resolveCaretStepMagnitude(input.value, input.selectionStart);
      if (stepMagnitude == null || !Number.isFinite(stepMagnitude)) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      const nextValue = currentValue + (stepMagnitude * direction);
      const nextText = formatInspectorNumericValue(nextValue, Math.max(countFractionDigits(input.value), countFractionDigits(String(stepMagnitude))));
      input.value = nextText;
      const clampedCaretIndex = Math.max(0, Math.min(caretIndex ?? nextText.length, nextText.length));
      input.setSelectionRange(clampedCaretIndex, clampedCaretIndex);
      state.selectedAxis = { channel, axis, value: nextValue };
      updateSelectedChannel(channel, axis, nextValue);
      setSummary();
    }, { passive: false });
    input.addEventListener("blur", () => {
      if (state.activeInspectorInputKey === inputKey) state.activeInspectorInputKey = null;
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      input.blur();
    });
    inspectorInputs.set(inputKey, input);
    row.appendChild(input);
  });
  return wrap;
}

function refreshInspector(): void {
  if (!state.clip || !state.schema || !state.bindPose || !state.selectedNodeId) {
    clearInspectorInputs();
    return;
  }
  const pose = resolveStudioPreviewPose();
  if (!pose) {
    clearInspectorInputs();
    return;
  }
  const node = pose[state.selectedNodeId];
  if (!node) return;
  setInput("position.x", node.position.x);
  setInput("position.y", node.position.y);
  setInput("position.z", node.position.z);
  setInput("rotationDeg.x", node.rotationDeg.x);
  setInput("rotationDeg.y", node.rotationDeg.y);
  setInput("rotationDeg.z", node.rotationDeg.z);
  setInput("scale.x", node.scale.x);
  setInput("scale.y", node.scale.y);
  setInput("scale.z", node.scale.z);
}

function setInput(key: string, value: number): void {
  const input = inspectorInputs.get(key);
  if (!input) return;
  if (state.activeInspectorInputKey === key || document.activeElement === input) return;
  input.value = String(Math.round(value * 100) / 100);
}

function updateSelectedChannel(channel: AnimationChannelId, axis: AxisId, value: number): void {
  if (!state.clip || !state.selectedPoseId || !state.selectedNodeId) return;
  if (applySelectedNodeChannelValue(channel, axis, value)) return;
  const clip = cloneAnimationClip(state.clip);
  const pose = clip.poses[state.selectedPoseId] || {};
  const node = pose[state.selectedNodeId] || {};
  const channelValue = { ...((node[channel] || {}) as Record<AxisId, number | undefined>) };
  channelValue[axis] = value;
  clip.poses = {
    ...clip.poses,
    [state.selectedPoseId]: {
      ...pose,
      [state.selectedNodeId]: {
        ...node,
        [channel]: channelValue
      }
    }
  };
  state.selectedAxis = { channel, axis, value };
  commitClip(clip, false);
}

function mirrorSelectedLimb(): void {
  if (!state.clip || !state.selectedPoseId || !state.selectedNodeId || !state.schema) return;
  const sourceNodeIds = resolveMirrorSubtreeNodeIds(state.selectedNodeId, state.schema);
  if (sourceNodeIds.length === 0) {
    setStatus("Select a left/right arm or leg node to mirror.");
    return;
  }
  const selectedNode = state.schema.nodes[state.selectedNodeId];
  const targetRootNodeId = selectedNode?.mirrorId || null;
  if (!targetRootNodeId) {
    setStatus("Selected node does not have a mirrored limb.");
    return;
  }

  const clip = cloneAnimationClip(state.clip);
  const sourcePose = clip.poses[state.selectedPoseId] || {};
  const nextPose = { ...sourcePose };
  let mirroredCount = 0;

  sourceNodeIds.forEach((sourceNodeId) => {
    const targetNodeId = state.schema?.nodes[sourceNodeId]?.mirrorId || null;
    if (!targetNodeId) return;
    const mirroredTransform = mirrorAnimationTransform(sourcePose[sourceNodeId]);
    if (mirroredTransform) {
      nextPose[targetNodeId] = mirroredTransform;
      mirroredCount += 1;
      return;
    }
    if (nextPose[targetNodeId]) {
      delete nextPose[targetNodeId];
      mirroredCount += 1;
    }
  });

  if (mirroredCount === 0) {
    setStatus(`Nothing to mirror from ${getNodeDisplayLabel(state.selectedNodeId)} yet.`);
    return;
  }

  clip.poses = {
    ...clip.poses,
    [state.selectedPoseId]: nextPose
  };
  commitClip(clip, false);
  setStatus(`Mirrored ${getNodeDisplayLabel(state.selectedNodeId)} to ${getNodeDisplayLabel(targetRootNodeId)}.`);
}

function addPose(): void {
  if (!state.clip || !state.poseName) return;
  const poseId = state.poseName.value.trim();
  if (!poseId || state.clip.poses[poseId]) {
    setStatus("Pose name must be unique.");
    return;
  }
  const clip = cloneAnimationClip(state.clip);
  clip.poses = { ...clip.poses, [poseId]: {} };
  state.selectedPoseId = poseId;
  commitClip(clip);
}

function renamePose(): void {
  if (!state.clip || !state.selectedPoseId || !state.renamePose) return;
  const nextPoseId = state.renamePose.value.trim();
  if (!nextPoseId) {
    state.renamePose.value = state.selectedPoseId;
    setStatus("Pose name cannot be empty.");
    return;
  }
  if (nextPoseId === state.selectedPoseId) {
    setStatus("Pose name is unchanged.");
    return;
  }
  if (state.clip.poses[nextPoseId]) {
    setStatus("Pose name must be unique.");
    return;
  }
  const previousPoseId = state.selectedPoseId;
  const clip = renamePoseInClip(state.clip, previousPoseId, nextPoseId);
  state.selectedPoseId = nextPoseId;
  commitClip(clip);
  state.renamePose.value = nextPoseId;
  setStatus(`Renamed pose ${previousPoseId} to ${nextPoseId}.`);
}

function duplicateSelectedPose(): void {
  if (!state.clip || !state.selectedPoseId) return;
  const sourcePoseId = state.selectedPoseId;
  const sourcePose = state.clip.poses[sourcePoseId];
  if (!sourcePose) return;
  const clip = cloneAnimationClip(state.clip);
  const duplicatePoseId = buildUniquePoseId(sourcePoseId);
  clip.poses[duplicatePoseId] = JSON.parse(JSON.stringify(sourcePose));
  const poseIds = getOrderedPoseIds(clip).filter((poseId) => poseId !== duplicatePoseId);
  const sourceIndex = poseIds.indexOf(sourcePoseId);
  poseIds.splice(sourceIndex + 1, 0, duplicatePoseId);
  clip.poses = buildOrderedPosesMap(clip, poseIds);
  state.selectedPoseId = duplicatePoseId;
  commitClip(clip);
  selectPose(duplicatePoseId, false);
  setStatus(`Duplicated pose ${sourcePoseId} to ${duplicatePoseId}.`);
}

function copySelectedPoseToClipboard(): void {
  if (!state.clip || !state.selectedPoseId) return;
  const sourcePose = state.clip.poses[state.selectedPoseId];
  if (!sourcePose) return;
  state.poseClipboard = {
    sourceClipId: state.clip.clipId,
    sourcePoseId: state.selectedPoseId,
    pose: cloneStudioPoseData(sourcePose)
  };
  refreshPoseClipboardButtons();
  setStatus(`Copied pose ${state.selectedPoseId} from ${state.clip.clipId}. Switch clips and paste it anywhere.`);
}

function pasteClipboardPoseOverSelectedPose(): void {
  if (!state.clip || !state.selectedPoseId || !state.poseClipboard) return;
  const targetPoseId = state.selectedPoseId;
  const clip = cloneAnimationClip(state.clip);
  clip.poses = {
    ...clip.poses,
    [targetPoseId]: cloneStudioPoseData(state.poseClipboard.pose)
  };
  commitClip(clip);
  selectPose(targetPoseId, false);
  setStatus(`Pasted ${state.poseClipboard.sourcePoseId} from ${state.poseClipboard.sourceClipId} over ${targetPoseId}.`);
}

function pasteClipboardPoseAsNew(): void {
  if (!state.clip || !state.poseClipboard) return;
  const clip = cloneAnimationClip(state.clip);
  const requestedPoseId = state.poseClipboard.sourcePoseId || "pose";
  const targetPoseId = clip.poses[requestedPoseId] ? buildUniquePoseId(requestedPoseId) : requestedPoseId;
  clip.poses[targetPoseId] = cloneStudioPoseData(state.poseClipboard.pose);
  const poseIds = getOrderedPoseIds(clip).filter((poseId) => poseId !== targetPoseId);
  const anchorPoseId = state.selectedPoseId && poseIds.includes(state.selectedPoseId)
    ? state.selectedPoseId
    : (poseIds[poseIds.length - 1] || null);
  if (anchorPoseId) {
    const anchorIndex = poseIds.indexOf(anchorPoseId);
    poseIds.splice(anchorIndex + 1, 0, targetPoseId);
  } else {
    poseIds.push(targetPoseId);
  }
  clip.poses = buildOrderedPosesMap(clip, poseIds);
  state.selectedPoseId = targetPoseId;
  commitClip(clip);
  selectPose(targetPoseId, false);
  setStatus(`Pasted ${state.poseClipboard.sourcePoseId} from ${state.poseClipboard.sourceClipId} as ${targetPoseId}.`);
}

function moveSelectedPoseRelative(offset: number): void {
  if (!state.clip || !state.selectedPoseId || !Number.isFinite(offset) || offset === 0) return;
  const clip = cloneAnimationClip(state.clip);
  const poseIds = getOrderedPoseIds(clip);
  const currentIndex = poseIds.indexOf(state.selectedPoseId);
  if (currentIndex < 0) return;
  const nextIndex = Math.max(0, Math.min(poseIds.length - 1, currentIndex + Math.sign(offset)));
  if (nextIndex === currentIndex) return;
  const [poseId] = poseIds.splice(currentIndex, 1);
  poseIds.splice(nextIndex, 0, poseId);
  clip.poses = buildOrderedPosesMap(clip, poseIds);
  commitClip(clip);
  selectPose(poseId, false);
  setStatus(`Moved pose ${poseId} ${nextIndex < currentIndex ? "up" : "down"}.`);
}

function deleteSelectedPose(): void {
  if (!state.clip || !state.selectedPoseId) return;
  const poseIds = Object.keys(state.clip.poses);
  if (poseIds.length <= 1) {
    setStatus("Cannot delete the last pose in a clip.");
    return;
  }
  const poseIdToDelete = state.selectedPoseId;
  const remainingPoseIds = poseIds.filter((poseId) => poseId !== poseIdToDelete);
  const nextSelectedPoseId = remainingPoseIds[0] || null;
  if (!nextSelectedPoseId) {
    setStatus("Cannot resolve a replacement pose after deletion.");
    return;
  }

  const clip = cloneAnimationClip(state.clip);
  delete clip.poses[poseIdToDelete];
  clip.keys = clip.keys.filter((key) => key.poseId !== poseIdToDelete);
  if (clip.keys.length === 0) {
    clip.keys.push({
      poseId: nextSelectedPoseId,
      atMs: 0,
      ease: "easeInOut"
    });
  }

  state.selectedPoseId = nextSelectedPoseId;
  commitClip(clip);
  selectPose(nextSelectedPoseId, true);
  setStatus(`Deleted pose ${poseIdToDelete}.`);
}

function addOrUpdateKey(): void {
  if (!state.clip || !state.selectedPoseId) return;
  const clip = cloneAnimationClip(state.clip);
  const atMs = Math.round(state.timeMs);
  const ease = (state.easeSelect?.value || "easeInOut") as AnimationClip["keys"][number]["ease"];
  const index = clip.keys.findIndex((key) => Math.abs(key.atMs - atMs) <= 1);
  const nextKey = { poseId: state.selectedPoseId, atMs, ease };
  if (index >= 0) clip.keys[index] = nextKey;
  else clip.keys.push(nextKey);
  commitClip(clip);
}

function updateKeyEaseAtPlayhead(): void {
  if (!state.clip || !state.easeSelect) return;
  const index = findKeyIndexAtPlayhead();
  if (index < 0) {
    setStatus("No key at this playhead. Click Add/Update Key to save the selected easing here.");
    return;
  }
  const clip = cloneAnimationClip(state.clip);
  const nextEase = state.easeSelect.value as AnimationClip["keys"][number]["ease"];
  clip.keys[index] = {
    ...clip.keys[index],
    ease: nextEase
  };
  commitClip(clip);
  setStatus(`Updated key easing to ${nextEase} at ${clip.keys[index].atMs}ms.`);
}

function applyClipDurationValue(nextDuration: number): void {
  if (!state.clip) return;
  const clip = cloneAnimationClip(state.clip);
  clip.durationMs = nextDuration;
  clip.keys = clip.keys.map((key) => ({
    ...key,
    atMs: Math.max(0, Math.min(nextDuration, Math.round(key.atMs)))
  }));
  clip.markers = clip.markers.map((marker) => ({
    ...marker,
    atMs: Math.max(0, Math.min(nextDuration, Math.round(marker.atMs)))
  }));
  commitClip(clip);
  const keyIndex = findKeyIndexAtPlayhead();
  if (state.easeSelect && state.clip && keyIndex >= 0) {
    state.easeSelect.value = state.clip.keys[keyIndex].ease;
  }
  setStatus(`Clip length set to ${nextDuration}ms.`);
}

function updateClipDuration(): void {
  if (!state.clip || !state.durationInput) return;
  const rawDuration = Number(state.durationInput.value);
  if (!Number.isFinite(rawDuration) || rawDuration <= 0) {
    state.durationInput.value = String(Math.round(state.clip.durationMs));
    setStatus("Clip length must be a positive number.");
    return;
  }
  applyClipDurationValue(Math.max(1, Math.round(rawDuration)));
}

function beginDurationDrag(event: PointerEvent): void {
  if (!state.clip || !state.durationHandle) return;
  event.preventDefault();
  pausePlayback();
  beginUndoTransaction();
  state.durationDragging = true;
  state.durationDragStartX = event.clientX;
  state.durationDragStartMs = state.clip.durationMs;
  state.durationHandle.setPointerCapture(event.pointerId);
}

function updateDurationDrag(event: PointerEvent): void {
  if (!state.durationDragging || !state.clip || !state.timelineWrap) return;
  const width = Math.max(1, state.timelineWrap.clientWidth);
  const dx = event.clientX - state.durationDragStartX;
  const deltaDuration = (dx / width) * Math.max(120, state.durationDragStartMs);
  applyClipDurationValue(Math.max(1, Math.round(state.durationDragStartMs + deltaDuration)));
}

function endDurationDrag(event?: PointerEvent): void {
  if (!state.durationDragging) return;
  state.durationDragging = false;
  if (event && state.durationHandle?.hasPointerCapture(event.pointerId)) {
    state.durationHandle.releasePointerCapture(event.pointerId);
  }
  finishUndoTransaction(!!state.clip && state.clip.durationMs !== state.durationDragStartMs);
}

function addMarker(): void {
  if (!state.clip || !state.markerName) return;
  const markerId = state.markerName.value.trim();
  if (!markerId) return;
  const clip = cloneAnimationClip(state.clip);
  clip.markers.push({ markerId, atMs: Math.round(state.timeMs) });
  commitClip(clip);
}

function resetNode(): void {
  if (!state.clip || !state.selectedPoseId || !state.selectedNodeId || !state.bindPose) return;
  const clip = resetPoseNodeToBindPose(state.clip, state.selectedPoseId, state.selectedNodeId, state.bindPose);
  commitClip(clip);
}

function resolveAncestorDistance(descendant: THREE.Object3D, ancestor: THREE.Object3D): number | null {
  let depth = 0;
  let current: THREE.Object3D | null = descendant;
  while (current) {
    if (current === ancestor) return depth;
    current = current.parent;
    depth += 1;
  }
  return null;
}

function pickNodeIdFromIntersections(intersections: THREE.Intersection<THREE.Object3D>[]): string | null {
  if (!state.previewRig || !state.schema) return null;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  let bestNodeId: string | null = null;
  let bestDepth = Number.POSITIVE_INFINITY;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let hitIndex = 0; hitIndex < intersections.length; hitIndex += 1) {
    const hit = intersections[hitIndex];
    for (let nodeIndex = 0; nodeIndex < state.schema.nodeOrder.length; nodeIndex += 1) {
      const nodeId = state.schema.nodeOrder[nodeIndex];
      if (nodeId === "root") continue;
      const candidateNode = nodeMap[nodeId as keyof typeof nodeMap];
      if (!candidateNode) continue;
      const depth = resolveAncestorDistance(hit.object, candidateNode);
      if (depth === null) continue;
      if (depth < bestDepth || (depth === bestDepth && hit.distance < bestDistance)) {
        bestNodeId = nodeId;
        bestDepth = depth;
        bestDistance = hit.distance;
      }
    }
  }
  return bestNodeId;
}

function pickBodyHitNodeIdFromViewport(clientX: number, clientY: number): string | null {
  if (!state.previewRig || !setPreviewPickRay(clientX, clientY)) return null;
  return pickNodeIdFromIntersections(previewPickRaycaster.intersectObject(state.previewRig, true));
}

function pickNearestNodeIdByScreen(clientX: number, clientY: number): string | null {
  if (!state.previewRig || !state.schema || !state.camera || !state.canvasWrap) return null;
  const rect = state.canvasWrap.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  let bestNodeId: string | null = null;
  let bestDistance = 28;
  for (let nodeIndex = 0; nodeIndex < state.schema.nodeOrder.length; nodeIndex += 1) {
    const nodeId = state.schema.nodeOrder[nodeIndex];
    if (nodeId === "root") continue;
    const node = nodeMap[nodeId as keyof typeof nodeMap];
    if (!node) continue;
    const worldPos = new THREE.Vector3();
    node.getWorldPosition(worldPos);
    worldPos.project(state.camera);
    if (worldPos.z < -1 || worldPos.z > 1) continue;
    const screenX = rect.left + ((worldPos.x * 0.5) + 0.5) * rect.width;
    const screenY = rect.top + ((worldPos.y * -0.5) + 0.5) * rect.height;
    const distance = Math.hypot(clientX - screenX, clientY - screenY);
    if (distance <= bestDistance) {
      bestNodeId = nodeId;
      bestDistance = distance;
    }
  }
  return bestNodeId;
}

function setPreviewPickRay(clientX: number, clientY: number): boolean {
  if (!state.camera || !state.canvasWrap) return false;
  const rect = state.canvasWrap.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  previewPickPointer.set(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -(((clientY - rect.top) / rect.height) * 2 - 1)
  );
  previewPickRaycaster.setFromCamera(previewPickPointer, state.camera);
  return true;
}

function isManipulatorHit(clientX: number, clientY: number): boolean {
  if (!state.transformControls) return false;
  if (!setPreviewPickRay(clientX, clientY)) return false;
  const hits = previewPickRaycaster.intersectObject(state.transformControls.getHelper(), true);
  return hits.length > 0;
}

function isManipulatorAxisHot(): boolean {
  return !!state.transformControls?.axis;
}

function pickNodeIdFromViewport(clientX: number, clientY: number): string | null {
  return pickBodyHitNodeIdFromViewport(clientX, clientY) || pickNearestNodeIdByScreen(clientX, clientY);
}

function handleViewportSelection(event: MouseEvent): void {
  if (state.manipulatorDidDrag) {
    state.manipulatorDidDrag = false;
    return;
  }
  if (state.cameraDragDidMove) {
    state.cameraDragDidMove = false;
    return;
  }
  if (state.manipulatorDragging) return;
  if (state.cameraDragging) return;
  const nodeId = pickNodeIdFromViewport(event.clientX, event.clientY);
  if (state.pendingSnapSourceNodeId) {
    if (!nodeId) {
      setStatus(`Snap To armed for ${getNodeDisplayLabel(state.pendingSnapSourceNodeId)}. Click a target node.`);
      return;
    }
    if (nodeId === state.pendingSnapSourceNodeId) {
      setStatus("Pick a different target node.");
      return;
    }
    const sourceNodeId = state.pendingSnapSourceNodeId;
    state.pendingSnapSourceNodeId = null;
    refreshSnapButton();
    if (!executeSnapToTarget(sourceNodeId, nodeId)) {
      setStatus(`Snap failed from ${getNodeDisplayLabel(sourceNodeId)} to ${getNodeDisplayLabel(nodeId)}.`);
    }
    return;
  }
  if (!nodeId) {
    selectNode(null);
    setStatus("Selection cleared.");
    return;
  }
  selectNode(nodeId);
  setStatus(`Selected ${getNodeDisplayLabel(nodeId)}.`);
}

function handleViewportPointerDown(event: PointerEvent): void {
  if (event.button !== 0 && event.button !== 2) return;
  if (state.manipulatorDragging) return;
  const isRightButton = event.button === 2;
  if (!isRightButton && isManipulatorAxisHot()) return;
  if (!isRightButton && pickBodyHitNodeIdFromViewport(event.clientX, event.clientY)) return;
  if (!isRightButton) selectNode(null);
  event.preventDefault();
  event.stopImmediatePropagation();
  beginViewportCameraDrag(event);
}

function handleViewportPointerMove(event: PointerEvent): void {
  if (state.cameraDragging) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  updateViewportCameraDrag(event);
}

function handleViewportPointerUp(event: PointerEvent): void {
  if (state.cameraDragging) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  endViewportCameraDrag(event);
}

async function loadClipFromSourcePath(sourcePath: string): Promise<void> {
  if (!sourcePath || getAnimationClipDescriptorBySourcePath(sourcePath)) return;
  const response = await fetch(`${ANIMATION_STUDIO_CLIP_ROUTE}?sourcePath=${encodeURIComponent(sourcePath)}`);
  if (!response.ok) throw new Error(`clip_${response.status}`);
  const payload = await response.json() as { ok?: boolean; clip?: AnimationClip };
  const clip = payload.clip;
  if (!payload.ok || !clip) throw new Error("clip_payload_invalid");
  registerAnimationClip({
    clipId: clip.clipId,
    rigId: clip.rigId,
    sourcePath
  }, clip);
}

async function refreshManifest(): Promise<void> {
  try {
    const response = await fetch(ANIMATION_STUDIO_MANIFEST_ROUTE);
    const payload = await response.json() as { writable?: boolean; clipSourceFiles?: string[] };
    state.devWritable = !!payload.writable;
    const sourceFiles = Array.isArray(payload.clipSourceFiles) ? payload.clipSourceFiles : [];
    for (let i = 0; i < sourceFiles.length; i += 1) {
      const sourcePath = sourceFiles[i];
      try {
        // Pull newly saved clips into the in-memory registry so reloads stay useful during dev.
        await loadClipFromSourcePath(sourcePath);
      } catch (error) {
        void error;
      }
    }
    refreshClipList();
  } catch (error) {
    state.devWritable = false;
    void error;
  }
}

async function saveClip(): Promise<void> {
  if (!state.clip || !state.descriptor) return;
  const sourceText = serializeAnimationClip(state.clip);
  if (!state.devWritable) {
    if (state.exportText) state.exportText.value = sourceText;
    setStatus("Dev save unavailable. Export text is ready.");
    return;
  }
  const response = await fetch(ANIMATION_STUDIO_SAVE_ROUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourcePath: state.descriptor.sourcePath,
      sourceText
    })
  });
  if (!response.ok) {
    if (state.exportText) state.exportText.value = exportAnimationClip(state.clip.clipId) || sourceText;
    setStatus(`Save failed (${response.status}). Export text is ready.`);
    return;
  }
  replaceAnimationClip(state.clip);
  state.draftDirty = false;
  if (state.exportText) state.exportText.value = sourceText;
  setStatus(`Saved ${state.clip.clipId}. Live animation updated.`);
}

function createAxisLine(direction: THREE.Vector3, color: number): THREE.Line {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), direction]),
    new THREE.LineBasicMaterial({ color })
  );
}

function syncOrbitStateFromCamera(): void {
  if (!state.camera) return;
  const offset = state.camera.position.clone().sub(state.cameraTarget);
  const radius = Math.max(0.001, offset.length());
  state.cameraOrbitRadius = radius;
  state.cameraOrbitYaw = Math.atan2(offset.x, offset.z);
  state.cameraOrbitPitch = Math.max(-1.25, Math.min(1.25, Math.asin(THREE.MathUtils.clamp(offset.y / radius, -1, 1))));
}

function applyOrbitCamera(): void {
  if (!state.camera) return;
  const radius = Math.max(0.001, state.cameraOrbitRadius);
  const cosPitch = Math.cos(state.cameraOrbitPitch);
  state.camera.position.set(
    state.cameraTarget.x + (Math.sin(state.cameraOrbitYaw) * cosPitch * radius),
    state.cameraTarget.y + (Math.sin(state.cameraOrbitPitch) * radius),
    state.cameraTarget.z + (Math.cos(state.cameraOrbitYaw) * cosPitch * radius)
  );
  state.camera.lookAt(state.cameraTarget);
}

function applyCameraPreset(preset: CameraPresetId): void {
  if (!state.camera) return;
  if (preset === "front") state.camera.position.set(0, 1.55, 5.1);
  if (preset === "side") state.camera.position.set(4.8, 1.45, 0.01);
  if (preset === "threeQuarter") state.camera.position.set(3.4, 1.7, 4.6);
  state.cameraTarget.set(0, 1.15, 0);
  state.camera.lookAt(state.cameraTarget);
  syncOrbitStateFromCamera();
}

function getViewportEventTarget(): HTMLElement | null {
  return state.canvas || state.canvasWrap;
}

function updateCanvasCursor(): void {
  const target = getViewportEventTarget();
  if (state.canvasWrap) state.canvasWrap.style.cursor = state.cameraDragging ? "grabbing" : "pointer";
  if (target) target.style.cursor = state.cameraDragging ? "grabbing" : "pointer";
}

function beginViewportCameraDrag(event: PointerEvent): void {
  const target = getViewportEventTarget();
  if (!target) return;
  state.cameraDragging = true;
  state.cameraDragDidMove = false;
  state.cameraDragLastX = event.clientX;
  state.cameraDragLastY = event.clientY;
  target.setPointerCapture(event.pointerId);
  updateCanvasCursor();
}

function updateViewportCameraDrag(event: PointerEvent): void {
  if (!state.cameraDragging) return;
  const dx = event.clientX - state.cameraDragLastX;
  const dy = event.clientY - state.cameraDragLastY;
  if (Math.abs(dx) > 0 || Math.abs(dy) > 0) state.cameraDragDidMove = true;
  state.cameraDragLastX = event.clientX;
  state.cameraDragLastY = event.clientY;
  state.cameraOrbitYaw -= dx * 0.01;
  state.cameraOrbitPitch = THREE.MathUtils.clamp(state.cameraOrbitPitch + (dy * 0.01), -1.25, 1.25);
  applyOrbitCamera();
}

function endViewportCameraDrag(event?: PointerEvent): void {
  const shouldClearSuppressionSoon = state.cameraDragDidMove;
  if (!state.cameraDragging) return;
  state.cameraDragging = false;
  const target = getViewportEventTarget();
  if (event && target?.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }
  updateCanvasCursor();
  if (shouldClearSuppressionSoon) {
    window.setTimeout(() => {
      state.cameraDragDidMove = false;
    }, 0);
  }
}

function resizeRenderer(): void {
  if (!state.renderer || !state.canvasWrap || !state.camera) return;
  const width = Math.max(320, state.canvasWrap.clientWidth);
  const height = Math.max(320, state.canvasWrap.clientHeight);
  state.renderer.setSize(width, height, false);
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
}

function ensureScene(): void {
  if (state.scene || !state.canvas) return;
  state.renderer = new THREE.WebGLRenderer({ canvas: state.canvas, antialias: true, alpha: true });
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x091017);
  state.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  state.scene.add(new THREE.AmbientLight(0xffffff, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(3.8, 6.2, 4.1);
  state.scene.add(sun);
  state.scene.add(new THREE.GridHelper(6, 12, 0x44515d, 0x24303a));
  state.jointMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 18, 14),
    new THREE.MeshBasicMaterial({ color: 0xffd166, depthWrite: false })
  );
  state.scene.add(state.jointMarker);
  state.axisGizmo = new THREE.Group();
  state.axisGizmo.add(createAxisLine(new THREE.Vector3(0.36, 0, 0), 0xff5757));
  state.axisGizmo.add(createAxisLine(new THREE.Vector3(0, 0.36, 0), 0x58d66d));
  state.axisGizmo.add(createAxisLine(new THREE.Vector3(0, 0, 0.36), 0x68d2ff));
  state.scene.add(state.axisGizmo);
  state.transformControls = new TransformControls(state.camera, state.renderer.domElement);
  state.transformControls.setMode(state.manipulatorMode);
  state.transformControls.setSpace("local");
  state.transformControls.setSize(0.8);
  state.transformControls.addEventListener("dragging-changed", (event) => {
    state.manipulatorDragging = !!event.value;
    if (event.value) {
      state.manipulatorDidDrag = false;
      beginUndoTransaction();
      state.decoupledDescendantWorldMatrices = isDecoupleDescendantsActiveForSelectedNode()
        ? captureDescendantWorldMatrices(state.selectedNodeId)
        : null;
      return;
    }
    state.decoupledDescendantWorldMatrices = null;
    finishUndoTransaction(state.manipulatorDidDrag);
    if (state.manipulatorDidDrag) {
      window.setTimeout(() => {
        state.manipulatorDidDrag = false;
      }, 0);
    }
  });
  state.transformControls.addEventListener("objectChange", () => {
    state.manipulatorDidDrag = true;
    if (isDecoupleDescendantsActiveForSelectedNode()) {
      syncSelectedNodeTransformWithDecoupledDescendantsFromPreview();
      return;
    }
    syncSelectedNodeTransformFromPreview();
  });
  state.scene.add(state.transformControls.getHelper());
  applyCameraPreset("threeQuarter");
  resizeRenderer();

  if (!window.createPlayerRigFromCurrentAppearance) {
    setStatus("Preview rig unavailable.");
    return;
  }
  state.previewRig = window.createPlayerRigFromCurrentAppearance();
  state.scene.add(state.previewRig);
  state.bindPose = captureRigBindPose(state.previewRig, "player_humanoid_v1");
  refreshHeldItemSelect();
  applyHeldItemSelectionToPreview();
  attachManipulatorToSelectedNode();
  refreshManipulatorButtons();
  refreshDecoupleButton();
  refreshIsolationButton();
  applyNodeIsolationToPreview();
}

function applyPreviewPose(rig: THREE.Group | null, pose: AnimationResolvedPose | null): void {
  if (!rig || !state.clip || !pose) return;
  rig.position.set(0, 0, 0);
  rig.rotation.set(0, 0, 0);
  rig.scale.set(1, 1, 1);
  applyResolvedPoseToRig(rig, state.clip.rigId, pose, {
    additiveRootPosition: false,
    additiveRootRotation: false,
    multiplicativeRootScale: false
  });
}

function updatePreviewLabels(): void {
  if (!state.labels || !state.previewRig || !state.camera || !state.canvasWrap) return;
  if (!state.showLabels) {
    state.nodeLabels.forEach((label) => {
      label.style.display = "none";
    });
    return;
  }
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const width = Math.max(1, state.canvasWrap.clientWidth);
  const height = Math.max(1, state.canvasWrap.clientHeight);
  const isolatedNodeId = state.isolatedNodeId && state.isolatedNodeId !== "root"
    ? state.isolatedNodeId
    : null;
  state.nodeLabels.forEach((label, nodeId) => {
    if (isolatedNodeId && nodeId !== isolatedNodeId) {
      label.style.display = "none";
      return;
    }
    const node = nodeMap[nodeId as keyof typeof nodeMap];
    if (!node) {
      label.style.display = "none";
      return;
    }
    const worldPos = new THREE.Vector3();
    node.getWorldPosition(worldPos);
    worldPos.project(state.camera as THREE.PerspectiveCamera);
    label.style.transform = `translate(${(worldPos.x * 0.5 + 0.5) * width}px, ${(worldPos.y * -0.5 + 0.5) * height}px) translate(-50%, -120%)`;
    label.style.display = worldPos.z < 1 ? "block" : "none";
  });
}

function updateJointMarker(): void {
  if (!state.jointMarker || !state.axisGizmo) return;
  if (!state.previewRig || !state.selectedNodeId) {
    state.jointMarker.visible = false;
    state.axisGizmo.visible = false;
    return;
  }
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const node = nodeMap[state.selectedNodeId as keyof typeof nodeMap];
  if (!node) {
    state.jointMarker.visible = false;
    state.axisGizmo.visible = false;
    return;
  }
  const worldPos = new THREE.Vector3();
  node.getWorldPosition(worldPos);
  state.jointMarker.visible = true;
  state.axisGizmo.visible = true;
  state.jointMarker.position.copy(worldPos);
  state.axisGizmo.position.copy(worldPos);
}

function buildPlayheadEasingSummary(): string {
  if (!state.clip) return "segment none";
  const summary = resolveClipTimeSummary(state.clip, state.timeMs);
  const previousKey = state.clip.keys[summary.previousKeyIndex] || null;
  const nextKey = state.clip.keys[summary.nextKeyIndex] || previousKey;
  if (!previousKey || !nextKey) return "segment none";
  const sameKey = summary.previousKeyIndex === summary.nextKeyIndex || previousKey.atMs === nextKey.atMs;
  if (sameKey) return `ease ${previousKey.ease} | held`;
  const spanMs = Math.max(1, nextKey.atMs - previousKey.atMs);
  const rawT = Math.max(0, Math.min(1, (summary.timeMs - previousKey.atMs) / spanMs));
  const easedT = applyAnimationEase(previousKey.ease, rawT);
  return `ease ${previousKey.ease} | blend ${rawT.toFixed(2)} -> ${easedT.toFixed(2)}`;
}

function tick(frameNowMs: number): void {
  if (!state.active) return;
  if (state.playing && state.clip) {
    const delta = state.lastFrameMs > 0 ? Math.min(64, frameNowMs - state.lastFrameMs) : 0;
    if (state.clip.loopMode === "loop") {
      state.timeMs = (state.timeMs + delta) % state.clip.durationMs;
    } else {
      state.timeMs = Math.min(state.clip.durationMs, state.timeMs + delta);
      if (state.timeMs >= state.clip.durationMs) pausePlayback();
    }
    if (state.timeline) state.timeline.value = String(Math.floor(state.timeMs));
  }
  state.lastFrameMs = frameNowMs;

  if (state.clip && state.schema && state.bindPose) {
    const summary = resolveClipTimeSummary(state.clip, state.timeMs);
    const livePose = resolveStudioPreviewPose();
    if (livePose) {
      applyPreviewPose(state.previewRig, livePose);
      applyNodeIsolationToPreview();
    }
    if (state.playheadSummary) {
      const markers = summary.activeMarkerIds.length > 0 ? summary.activeMarkerIds.join(", ") : "none";
      const previewMode = !state.playing && isSelectedPoseUnkeyed() && state.selectedPoseId
        ? ` | preview ${state.selectedPoseId} (unkeyed)`
        : "";
      state.playheadSummary.innerText = `playhead ${Math.round(summary.timeMs)}ms | prev ${summary.previousPoseId || "none"} | next ${summary.nextPoseId || "none"} | markers ${markers}${previewMode} | ${buildPlayheadEasingSummary()}`;
    }
  }

  refreshInspector();
  updateJointMarker();
  updatePreviewLabels();
  setSummary();
  resizeRenderer();
  if (state.renderer && state.scene && state.camera) state.renderer.render(state.scene, state.camera);
  state.rafId = window.requestAnimationFrame(tick);
}

function bindUI(): void {
  if (!state.overlay) return;
  const overlay = state.overlay;
  state.canvasWrap = overlay.querySelector<HTMLDivElement>("#animation-studio-canvas-wrap");
  state.canvas = overlay.querySelector<HTMLCanvasElement>("#animation-studio-canvas");
  state.labels = overlay.querySelector<HTMLDivElement>("#animation-studio-labels");
  state.labelsToggle = overlay.querySelector<HTMLButtonElement>("#animation-studio-toggle-labels");
  state.moveButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-move");
  state.rotateButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-rotate");
  state.isolateButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-isolate-node");
  state.snapButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-snap-node");
  state.decoupleButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-decouple-children");
  state.mirrorButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-mirror-limb");
  state.clipList = overlay.querySelector<HTMLDivElement>("#animation-studio-clips");
  state.poseList = overlay.querySelector<HTMLDivElement>("#animation-studio-poses");
  state.keyList = overlay.querySelector<HTMLDivElement>("#animation-studio-keys");
  state.markerLane = overlay.querySelector<HTMLDivElement>("#animation-studio-markers");
  state.keyLane = overlay.querySelector<HTMLDivElement>("#animation-studio-key-lane");
  state.summary = overlay.querySelector<HTMLDivElement>("#animation-studio-summary");
  state.status = overlay.querySelector<HTMLDivElement>("#animation-studio-status");
  state.playheadSummary = overlay.querySelector<HTMLDivElement>("#animation-studio-playhead-summary");
  state.exportText = overlay.querySelector<HTMLTextAreaElement>("#animation-studio-export");
  state.newClipName = overlay.querySelector<HTMLInputElement>("#animation-studio-new-clip-name");
  state.poseName = overlay.querySelector<HTMLInputElement>("#animation-studio-pose-name");
  state.renamePose = overlay.querySelector<HTMLInputElement>("#animation-studio-rename-pose");
  state.markerName = overlay.querySelector<HTMLInputElement>("#animation-studio-marker-name");
  state.timelineWrap = overlay.querySelector<HTMLDivElement>("#animation-studio-timeline-wrap");
  state.timeline = overlay.querySelector<HTMLInputElement>("#animation-studio-timeline");
  state.durationInput = overlay.querySelector<HTMLInputElement>("#animation-studio-duration");
  state.durationHandle = overlay.querySelector<HTMLDivElement>("#animation-studio-duration-handle");
  state.easeSelect = overlay.querySelector<HTMLSelectElement>("#animation-studio-ease");
  state.nodeSelect = overlay.querySelector<HTMLSelectElement>("#animation-studio-node-select");
  state.heldItemSelect = overlay.querySelector<HTMLSelectElement>("#animation-studio-held-item-select");
  state.playButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-play");
  state.undoButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-undo");
  state.copyPoseButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-copy-pose-btn");
  state.pastePoseButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-paste-pose-btn");
  state.pastePoseNewButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-paste-pose-new-btn");

  const inspector = overlay.querySelector<HTMLDivElement>("#animation-studio-inspector");
  if (inspector) {
    inspector.appendChild(createInspectorSection("Position", "position"));
    inspector.appendChild(createInspectorSection("Rotation (deg)", "rotationDeg"));
    inspector.appendChild(createInspectorSection("Scale", "scale"));
  }
  if (state.newClipName) state.newClipName.value = DEFAULT_NEW_CLIP_ID;
  refreshPoseClipboardButtons();

  overlay.querySelector<HTMLButtonElement>("#animation-studio-close")?.addEventListener("click", () => toggleAnimationStudio(false));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-save")?.addEventListener("click", () => { void saveClip(); });
  state.undoButton?.addEventListener("click", undoStudioEdit);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-create-clip")?.addEventListener("click", createNewClip);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-add-pose")?.addEventListener("click", addPose);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-duplicate-pose-btn")?.addEventListener("click", duplicateSelectedPose);
  state.copyPoseButton?.addEventListener("click", copySelectedPoseToClipboard);
  state.pastePoseButton?.addEventListener("click", pasteClipboardPoseOverSelectedPose);
  state.pastePoseNewButton?.addEventListener("click", pasteClipboardPoseAsNew);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-rename-pose-btn")?.addEventListener("click", renamePose);
  state.renamePose?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    renamePose();
  });
  overlay.querySelector<HTMLButtonElement>("#animation-studio-move-pose-up-btn")?.addEventListener("click", () => moveSelectedPoseRelative(-1));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-move-pose-down-btn")?.addEventListener("click", () => moveSelectedPoseRelative(1));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-delete-pose-btn")?.addEventListener("click", deleteSelectedPose);
  state.isolateButton?.addEventListener("click", toggleNodeIsolation);
  state.snapButton?.addEventListener("click", toggleSnapToMode);
  state.decoupleButton?.addEventListener("click", toggleDecoupleDescendantsMode);
  state.mirrorButton?.addEventListener("click", mirrorSelectedLimb);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-key")?.addEventListener("click", addOrUpdateKey);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-add-marker")?.addEventListener("click", addMarker);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-reset-node")?.addEventListener("click", resetNode);
  state.moveButton?.addEventListener("click", () => {
    state.manipulatorMode = "translate";
    refreshManipulatorButtons();
    setStatus("Move mode active. Drag the selected part in the viewport.");
  });
  state.rotateButton?.addEventListener("click", () => {
    state.manipulatorMode = "rotate";
    refreshManipulatorButtons();
    setStatus("Rotate mode active. Drag the selected part in the viewport.");
  });
  state.labelsToggle?.addEventListener("click", () => {
    state.showLabels = !state.showLabels;
    refreshLabelsToggleButton();
    updatePreviewLabels();
    setStatus(state.showLabels ? "Labels enabled." : "Labels hidden.");
  });
  overlay.querySelector<HTMLButtonElement>("#animation-studio-cam-front")?.addEventListener("click", () => applyCameraPreset("front"));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-cam-side")?.addEventListener("click", () => applyCameraPreset("side"));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-cam-three-quarter")?.addEventListener("click", () => applyCameraPreset("threeQuarter"));
  state.playButton?.addEventListener("click", () => {
    if (state.playing) {
      pausePlayback();
      return;
    }
    setPlayheadTime(0);
    state.lastFrameMs = 0;
    state.playing = true;
    if (state.playButton) state.playButton.innerText = "Pause";
  });
  state.timeline?.addEventListener("input", () => {
    const nextTimeMs = Number(state.timeline?.value || "0");
    pausePlayback();
    const movedPoseKey = moveSelectedPoseKeyToTime(nextTimeMs);
    if (!movedPoseKey) setPlayheadTime(nextTimeMs);
    const keyIndex = findKeyIndexAtPlayhead();
    if (state.easeSelect && state.clip && keyIndex >= 0) {
      state.easeSelect.value = state.clip.keys[keyIndex].ease;
    }
  });
  state.durationInput?.addEventListener("change", updateClipDuration);
  state.durationHandle?.addEventListener("pointerdown", beginDurationDrag);
  state.durationHandle?.addEventListener("pointermove", updateDurationDrag);
  state.durationHandle?.addEventListener("pointerup", endDurationDrag);
  state.durationHandle?.addEventListener("pointercancel", endDurationDrag);
  state.easeSelect?.addEventListener("change", updateKeyEaseAtPlayhead);
  state.nodeSelect?.addEventListener("change", () => {
    selectNode(state.nodeSelect?.value || null);
  });
  state.heldItemSelect?.addEventListener("change", () => {
    state.selectedHeldItemId = state.heldItemSelect?.value || "";
    applyHeldItemSelectionToPreview();
    const selectedOption = listStudioHeldItemOptions().find((option) => option.itemId === state.selectedHeldItemId) || null;
    setStatus(state.selectedHeldItemId
      ? `Preview held item: ${selectedOption?.label || humanizeStudioItemId(state.selectedHeldItemId)}.`
      : "Preview held item cleared.");
  });
  state.newClipName?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    createNewClip();
  });
  state.canvas?.addEventListener("pointerdown", handleViewportPointerDown);
  state.canvas?.addEventListener("pointermove", handleViewportPointerMove);
  state.canvas?.addEventListener("pointerup", handleViewportPointerUp);
  state.canvas?.addEventListener("pointercancel", handleViewportPointerUp);
  state.canvas?.addEventListener("click", handleViewportSelection);
  state.canvas?.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  refreshLabelsToggleButton();
  refreshManipulatorButtons();
  refreshUndoButton();
  refreshMirrorButton();
  refreshDecoupleButton();
  refreshIsolationButton();
  refreshSnapButton();
  refreshHeldItemSelect();
  updateCanvasCursor();
  window.addEventListener("resize", resizeRenderer);
}

export function initAnimationStudio(): void {
  if (state.initialized) return;
  state.initialized = true;
  state.overlay = createOverlay();
  document.body.appendChild(state.overlay);
  bindUI();
  refreshClipList();
  const first = listAnimationClipDescriptors()[0];
  if (first) ensureClip(first.clipId);
  window.addEventListener("keydown", (event) => {
    if (event.key === "F8") {
      event.preventDefault();
      toggleAnimationStudio();
      return;
    }
    if (state.active && event.key === "Escape") {
      event.preventDefault();
      toggleAnimationStudio(false);
    }
  });
}

export function toggleAnimationStudio(nextState?: boolean): void {
  if (!state.initialized) initAnimationStudio();
  state.active = typeof nextState === "boolean" ? nextState : !state.active;
  if (state.overlay) state.overlay.classList.toggle("hidden", !state.active);
  if (!state.active) {
    endViewportCameraDrag();
    if (state.rafId) window.cancelAnimationFrame(state.rafId);
    state.playing = false;
    state.isolatedNodeId = null;
    state.pendingSnapSourceNodeId = null;
    state.decoupleDescendants = false;
    state.decoupledDescendantWorldMatrices = null;
    setStatus("Animation Studio closed.");
    return;
  }
  ensureScene();
  refreshHeldItemSelect();
  applyHeldItemSelectionToPreview();
  state.showLabels = false;
  state.isolatedNodeId = null;
  state.pendingSnapSourceNodeId = null;
  state.decoupleDescendants = false;
  state.decoupledDescendantWorldMatrices = null;
  refreshLabelsToggleButton();
  refreshDecoupleButton();
  refreshIsolationButton();
  refreshSnapButton();
  selectNode(null);
  void refreshManifest().then(() => {
    setReadyStatus();
  });
  state.lastFrameMs = 0;
  if (state.rafId) window.cancelAnimationFrame(state.rafId);
  state.rafId = window.requestAnimationFrame(tick);
}

export function isAnimationStudioActive(): boolean {
  return state.active;
}

export function createAnimationStudioBridge() {
  return {
    init: initAnimationStudio,
    toggle: toggleAnimationStudio,
    isStudioActive: isAnimationStudioActive
  };
}
