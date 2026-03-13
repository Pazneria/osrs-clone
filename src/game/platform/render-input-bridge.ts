import type {
  InputControllerContext,
  MinimapDragResolution,
  MinimapSnapshot,
  MinimapWalkTarget,
  PointerDecision,
  PointerMoveDecision,
  RenderSnapshot,
  WorldMapDragResolution,
  WorldMapSnapshot
} from "../contracts/render";
import {
  createInputControllerContext,
  normalizeContextMenuOptions,
  resolveMinimapDragResolution,
  resolveMinimapWalkTarget,
  resolveMouseWheelCameraDistance,
  resolvePointerDown,
  resolvePointerMove,
  resolvePointerUp,
  resolveWorldMapDragCenter,
  resolveZoomFactor,
  resolveZoomStep,
  shouldIgnoreContextMenu
} from "../input/controller";
import { buildMinimapSnapshot, buildRenderSnapshot, buildWorldMapSnapshot } from "../render/snapshot";

declare global {
  interface Window {
    RenderRuntime?: {
      buildRenderSnapshot: (options: {
        worldId: string;
        player: RenderSnapshot["player"];
        clickMarkers: RenderSnapshot["clickMarkers"];
        groundItems: RenderSnapshot["groundItems"];
        minimapDestination: RenderSnapshot["minimapDestination"];
      }) => RenderSnapshot;
      buildWorldMapSnapshot: (options: {
        snapshot: RenderSnapshot;
        viewport: { x: number; y: number; size: number };
        sourceRect: { sourceX: number; sourceY: number; sourceSize: number; centerX: number; centerY: number };
        zoom: number;
      }) => WorldMapSnapshot;
      buildMinimapSnapshot: (options: {
        snapshot: RenderSnapshot;
        canvasSize: number;
        zoom: number;
        targetX: number;
        targetY: number;
        isDragging: boolean;
        dragStart: { x: number; y: number };
        dragEnd: { x: number; y: number };
      }) => MinimapSnapshot;
    };
    InputControllerRuntime?: {
      createInputControllerContext: (options: InputControllerContext) => InputControllerContext;
      resolvePointerDown: (context: InputControllerContext, event: { button: number; clientX: number; clientY: number }) => PointerDecision;
      resolvePointerMove: (context: InputControllerContext, event: { clientX: number; clientY: number }) => PointerMoveDecision;
      resolvePointerUp: (context: InputControllerContext, event: { button: number }) => PointerDecision;
      resolveMouseWheelCameraDistance: (currentDistance: number, deltaY: number) => number;
      normalizeContextMenuOptions: (options: unknown) => Array<{ text: string; onSelect: () => void }>;
      shouldIgnoreContextMenu: (isFreeCam: boolean, targetId?: string | null) => boolean;
      resolveZoomStep: (currentZoom: number, deltaY: number, options: { step: number; min: number; max: number }) => number;
      resolveZoomFactor: (currentZoom: number, deltaY: number, options: { factor: number; min: number; max: number }) => number;
      resolveMinimapWalkTarget: (options: {
        mouseX: number;
        mouseY: number;
        canvasSize: number;
        targetX: number;
        targetY: number;
        zoom: number;
      }) => MinimapWalkTarget;
      resolveMinimapDragResolution: (options: {
        canvasSize: number;
        zoom: number;
        targetX: number;
        targetY: number;
        dragStart: { x: number; y: number };
        dragEnd: { x: number; y: number };
      }) => MinimapDragResolution;
      resolveWorldMapDragCenter: (options: {
        dragStartCenterX: number;
        dragStartCenterY: number;
        dragStartMouseX: number;
        dragStartMouseY: number;
        dragStartSourceSize: number;
        viewportSize: number;
        mouseX: number;
        mouseY: number;
      }) => WorldMapDragResolution;
    };
  }
}

export function exposeRenderInputBridge(): void {
  window.RenderRuntime = {
    buildRenderSnapshot,
    buildWorldMapSnapshot,
    buildMinimapSnapshot
  };
  window.InputControllerRuntime = {
    createInputControllerContext,
    resolvePointerDown,
    resolvePointerMove,
    resolvePointerUp,
    resolveMouseWheelCameraDistance,
    normalizeContextMenuOptions,
    shouldIgnoreContextMenu,
    resolveZoomStep,
    resolveZoomFactor,
    resolveMinimapWalkTarget,
    resolveMinimapDragResolution,
    resolveWorldMapDragCenter
  };
}
