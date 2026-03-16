import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

import type {
  AnimationChannelId,
  AnimationClip,
  AnimationClipDescriptor,
  AnimationResolvedPose,
  AnimationRigSchema
} from "../contracts/animation";
import { ANIMATION_STUDIO_MANIFEST_ROUTE, ANIMATION_STUDIO_SAVE_ROUTE } from "./persistence";
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
  listAnimationClipDescriptors,
  replaceAnimationClip
} from "./registry";
import { getAnimationRigSchema } from "./schema";

declare global {
  interface Window {
    createPlayerRigFromCurrentAppearance?: () => THREE.Group;
  }
}

type AxisId = "x" | "y" | "z";
type CameraPresetId = "front" | "side" | "threeQuarter";
type ManipulatorModeId = "translate" | "rotate";
type SelectionAxis = { channel: AnimationChannelId; axis: AxisId; value: number };

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
  clipList: HTMLDivElement | null;
  poseList: HTMLDivElement | null;
  keyList: HTMLDivElement | null;
  markerLane: HTMLDivElement | null;
  keyLane: HTMLDivElement | null;
  summary: HTMLDivElement | null;
  status: HTMLDivElement | null;
  playheadSummary: HTMLDivElement | null;
  exportText: HTMLTextAreaElement | null;
  poseName: HTMLInputElement | null;
  renamePose: HTMLInputElement | null;
  markerName: HTMLInputElement | null;
  timelineWrap: HTMLDivElement | null;
  timeline: HTMLInputElement | null;
  durationInput: HTMLInputElement | null;
  durationHandle: HTMLDivElement | null;
  easeSelect: HTMLSelectElement | null;
  nodeSelect: HTMLSelectElement | null;
  playButton: HTMLButtonElement | null;
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
  selectedAxis: SelectionAxis | null;
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
  clipList: null,
  poseList: null,
  keyList: null,
  markerLane: null,
  keyLane: null,
  summary: null,
  status: null,
  playheadSummary: null,
  exportText: null,
  poseName: null,
  renamePose: null,
  markerName: null,
  timelineWrap: null,
  timeline: null,
  durationInput: null,
  durationHandle: null,
  easeSelect: null,
  nodeSelect: null,
  playButton: null,
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
  selectedAxis: null,
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
  transformControls: null
};

const inspectorInputs = new Map<string, HTMLInputElement>();
const previewPickRaycaster = new THREE.Raycaster();
const previewPickPointer = new THREE.Vector2();

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
  if (state.nodeSelect) {
    if (!nodeId) state.nodeSelect.selectedIndex = 0;
    else state.nodeSelect.value = nodeId;
  }
  if (!nodeId) clearInspectorInputs();
  else refreshInspector();
  refreshNodeLabelStyles();
  attachManipulatorToSelectedNode();
  setSummary();
}

function ensureClip(clipId: string): void {
  const clip = getAnimationClip(clipId);
  const descriptor = getAnimationClipDescriptor(clipId);
  if (!clip || !descriptor) return;
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
  refreshInspector();
  setSummary();
  setReadyStatus();
}

function commitClip(nextClip: AnimationClip, refreshStructure = true): void {
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
  setSummary();
  setReadyStatus();
}

function syncSelectedNodeTransformFromPreview(): void {
  if (!state.previewRig || !state.clip || !state.selectedPoseId || !state.selectedNodeId) return;
  const nodeMap = resolveLegacyRigNodeMap(state.previewRig);
  const node = nodeMap[state.selectedNodeId as keyof typeof nodeMap];
  if (!node) return;
  const clip = cloneAnimationClip(state.clip);
  const pose = clip.poses[state.selectedPoseId] || {};
  const existingNode = pose[state.selectedNodeId] || {};
  clip.poses = {
    ...clip.poses,
    [state.selectedPoseId]: {
      ...pose,
      [state.selectedNodeId]: {
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
      }
    }
  };
  commitClip(clip, false);
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
          <button id="animation-studio-save" type="button" class="rounded border border-[#c8aa6e] bg-[#201a11] px-2 py-1 text-[11px] font-bold text-[#f5e2b7] hover:bg-[#2b2216]">Save</button>
          <button id="animation-studio-close" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Close</button>
        </div>
      </div>
      <div class="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_310px] gap-3">
        <div class="min-h-0 rounded border border-[#3a444c] bg-[#0d1318] p-3 flex flex-col gap-3">
          <div>
            <div class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8aa6e]">Clips</div>
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
          <div id="animation-studio-inspector" class="space-y-2"></div>
          <button id="animation-studio-reset-node" type="button" class="rounded border border-[#4b5660] bg-[#161c22] px-2 py-1 text-[11px] font-bold text-gray-200 hover:bg-[#1f2830]">Reset Node</button>
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
  setSummary();
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
    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.1";
    input.className = "rounded border border-[#39434c] bg-[#0a0f13] px-2 py-1 text-[11px] text-gray-100";
    input.addEventListener("focus", () => {
      const value = Number(input.value) || 0;
      state.selectedAxis = { channel, axis, value };
      setSummary();
    });
    input.addEventListener("change", () => {
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      updateSelectedChannel(channel, axis, value);
    });
    inspectorInputs.set(`${channel}.${axis}`, input);
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
  if (input) input.value = String(Math.round(value * 100) / 100);
}

function updateSelectedChannel(channel: AnimationChannelId, axis: AxisId, value: number): void {
  if (!state.clip || !state.selectedPoseId || !state.selectedNodeId) return;
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
  if (!nextPoseId || nextPoseId === state.selectedPoseId || state.clip.poses[nextPoseId]) return;
  const clip = renamePoseInClip(state.clip, state.selectedPoseId, nextPoseId);
  state.selectedPoseId = nextPoseId;
  commitClip(clip);
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

async function refreshManifest(): Promise<void> {
  try {
    const response = await fetch(ANIMATION_STUDIO_MANIFEST_ROUTE);
    const payload = await response.json() as { writable?: boolean };
    state.devWritable = !!payload.writable;
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
      return;
    }
    if (state.manipulatorDidDrag) {
      window.setTimeout(() => {
        state.manipulatorDidDrag = false;
      }, 0);
    }
  });
  state.transformControls.addEventListener("objectChange", () => {
    state.manipulatorDidDrag = true;
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
  attachManipulatorToSelectedNode();
  refreshManipulatorButtons();
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
  state.nodeLabels.forEach((label, nodeId) => {
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
    if (livePose) applyPreviewPose(state.previewRig, livePose);
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
  state.clipList = overlay.querySelector<HTMLDivElement>("#animation-studio-clips");
  state.poseList = overlay.querySelector<HTMLDivElement>("#animation-studio-poses");
  state.keyList = overlay.querySelector<HTMLDivElement>("#animation-studio-keys");
  state.markerLane = overlay.querySelector<HTMLDivElement>("#animation-studio-markers");
  state.keyLane = overlay.querySelector<HTMLDivElement>("#animation-studio-key-lane");
  state.summary = overlay.querySelector<HTMLDivElement>("#animation-studio-summary");
  state.status = overlay.querySelector<HTMLDivElement>("#animation-studio-status");
  state.playheadSummary = overlay.querySelector<HTMLDivElement>("#animation-studio-playhead-summary");
  state.exportText = overlay.querySelector<HTMLTextAreaElement>("#animation-studio-export");
  state.poseName = overlay.querySelector<HTMLInputElement>("#animation-studio-pose-name");
  state.renamePose = overlay.querySelector<HTMLInputElement>("#animation-studio-rename-pose");
  state.markerName = overlay.querySelector<HTMLInputElement>("#animation-studio-marker-name");
  state.timelineWrap = overlay.querySelector<HTMLDivElement>("#animation-studio-timeline-wrap");
  state.timeline = overlay.querySelector<HTMLInputElement>("#animation-studio-timeline");
  state.durationInput = overlay.querySelector<HTMLInputElement>("#animation-studio-duration");
  state.durationHandle = overlay.querySelector<HTMLDivElement>("#animation-studio-duration-handle");
  state.easeSelect = overlay.querySelector<HTMLSelectElement>("#animation-studio-ease");
  state.nodeSelect = overlay.querySelector<HTMLSelectElement>("#animation-studio-node-select");
  state.playButton = overlay.querySelector<HTMLButtonElement>("#animation-studio-play");

  const inspector = overlay.querySelector<HTMLDivElement>("#animation-studio-inspector");
  if (inspector) {
    inspector.appendChild(createInspectorSection("Position", "position"));
    inspector.appendChild(createInspectorSection("Rotation (deg)", "rotationDeg"));
    inspector.appendChild(createInspectorSection("Scale", "scale"));
  }

  overlay.querySelector<HTMLButtonElement>("#animation-studio-close")?.addEventListener("click", () => toggleAnimationStudio(false));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-save")?.addEventListener("click", () => { void saveClip(); });
  overlay.querySelector<HTMLButtonElement>("#animation-studio-add-pose")?.addEventListener("click", addPose);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-duplicate-pose-btn")?.addEventListener("click", duplicateSelectedPose);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-rename-pose-btn")?.addEventListener("click", renamePose);
  overlay.querySelector<HTMLButtonElement>("#animation-studio-move-pose-up-btn")?.addEventListener("click", () => moveSelectedPoseRelative(-1));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-move-pose-down-btn")?.addEventListener("click", () => moveSelectedPoseRelative(1));
  overlay.querySelector<HTMLButtonElement>("#animation-studio-delete-pose-btn")?.addEventListener("click", deleteSelectedPose);
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
    setStatus("Animation Studio closed.");
    return;
  }
  ensureScene();
  state.showLabels = false;
  refreshLabelsToggleButton();
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
