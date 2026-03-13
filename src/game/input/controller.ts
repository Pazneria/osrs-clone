import type {
  InputControllerContext,
  MinimapDragResolution,
  MinimapWalkTarget,
  PointerDecision,
  PointerMoveDecision,
  WorldMapDragResolution
} from "../contracts/render";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createInputControllerContext(options: InputControllerContext): InputControllerContext {
  return {
    isFreeCam: !!options.isFreeCam,
    isDraggingCamera: !!options.isDraggingCamera,
    poseEditorEnabled: !!options.poseEditorEnabled,
    poseEditorDragging: !!options.poseEditorDragging,
    cameraYaw: options.cameraYaw,
    cameraPitch: options.cameraPitch,
    cameraDist: options.cameraDist,
    previousMousePosition: { x: options.previousMousePosition.x, y: options.previousMousePosition.y },
    currentMousePosition: { x: options.currentMousePosition.x, y: options.currentMousePosition.y },
    playerPlane: options.playerPlane
  };
}

export function resolvePointerDown(
  context: InputControllerContext,
  event: { button: number; clientX: number; clientY: number }
): PointerDecision {
  if (event.button === 0 && context.poseEditorEnabled) {
    return {
      preventDefault: true,
      closeContextMenu: true,
      beginPoseEditorDrag: true,
      beginCameraDrag: false,
      handleInteractionRaycast: false,
      endPoseEditorDrag: false,
      endCameraDrag: false,
      nextPreviousMousePosition: null
    };
  }

  if (event.button === 1 || (context.isFreeCam && event.button === 0)) {
    return {
      preventDefault: true,
      closeContextMenu: false,
      beginPoseEditorDrag: false,
      beginCameraDrag: true,
      handleInteractionRaycast: false,
      endPoseEditorDrag: false,
      endCameraDrag: false,
      nextPreviousMousePosition: { x: event.clientX, y: event.clientY }
    };
  }

  if (event.button === 0 && !context.isFreeCam) {
    return {
      preventDefault: false,
      closeContextMenu: true,
      beginPoseEditorDrag: false,
      beginCameraDrag: false,
      handleInteractionRaycast: true,
      endPoseEditorDrag: false,
      endCameraDrag: false,
      nextPreviousMousePosition: null
    };
  }

  return {
    preventDefault: false,
    closeContextMenu: false,
    beginPoseEditorDrag: false,
    beginCameraDrag: false,
    handleInteractionRaycast: false,
    endPoseEditorDrag: false,
    endCameraDrag: false,
    nextPreviousMousePosition: null
  };
}

export function resolvePointerMove(
  context: InputControllerContext,
  event: { clientX: number; clientY: number }
): PointerMoveDecision {
  const nextCurrentMousePosition = { x: event.clientX, y: event.clientY };
  if (!context.isDraggingCamera) {
    return {
      nextCurrentMousePosition,
      nextPreviousMousePosition: null,
      nextCameraYaw: null,
      nextCameraPitch: null
    };
  }

  const nextCameraYaw = context.cameraYaw + ((event.clientX - context.previousMousePosition.x) * 0.01);
  const nextCameraPitch = clamp(
    context.cameraPitch - ((event.clientY - context.previousMousePosition.y) * 0.01),
    0.1,
    Math.PI - 0.1
  );

  return {
    nextCurrentMousePosition,
    nextPreviousMousePosition: { x: event.clientX, y: event.clientY },
    nextCameraYaw,
    nextCameraPitch
  };
}

export function resolvePointerUp(
  context: InputControllerContext,
  event: { button: number }
): PointerDecision {
  return {
    preventDefault: false,
    closeContextMenu: false,
    beginPoseEditorDrag: false,
    beginCameraDrag: false,
    handleInteractionRaycast: false,
    endPoseEditorDrag: event.button === 0 && context.poseEditorDragging,
    endCameraDrag: event.button === 1 || (context.isFreeCam && event.button === 0),
    nextPreviousMousePosition: null
  };
}

export function resolveMouseWheelCameraDistance(currentDistance: number, deltaY: number): number {
  return clamp(currentDistance + (Math.sign(deltaY) * 1.5), 5, 30);
}

export function normalizeContextMenuOptions(options: unknown): Array<{ text: string; onSelect: () => void }> {
  if (!Array.isArray(options) || options.length === 0) return [];
  const normalized: Array<{ text: string; onSelect: () => void }> = [];
    for (let i = 0; i < options.length; i++) {
        const option = options[i] as { text?: unknown; onSelect?: unknown };
        if (!option || typeof option.text !== "string" || typeof option.onSelect !== "function") continue;
        normalized.push({ text: option.text, onSelect: option.onSelect as () => void });
    }
    return normalized;
}

export function shouldIgnoreContextMenu(isFreeCam: boolean, targetId: string | null | undefined): boolean {
  if (isFreeCam) return true;
  return targetId === "minimap" || targetId === "runToggleBtn";
}

export function resolveZoomStep(currentZoom: number, deltaY: number, options: { step: number; min: number; max: number }): number {
  return clamp(currentZoom + (Math.sign(deltaY) * options.step), options.min, options.max);
}

export function resolveZoomFactor(currentZoom: number, deltaY: number, options: { factor: number; min: number; max: number }): number {
  const nextZoom = deltaY < 0 ? (currentZoom * options.factor) : (currentZoom / options.factor);
  return clamp(nextZoom, options.min, options.max);
}

export function resolveMinimapWalkTarget(options: {
  mouseX: number;
  mouseY: number;
  canvasSize: number;
  targetX: number;
  targetY: number;
  zoom: number;
}): MinimapWalkTarget {
  const canvasCenter = options.canvasSize / 2;
  const pixelsPerTile = (options.canvasSize / 100) * options.zoom;
  return {
    gridX: Math.floor(options.targetX + 0.5 + ((options.mouseX - canvasCenter) / pixelsPerTile)),
    gridY: Math.floor(options.targetY + 0.5 + ((options.mouseY - canvasCenter) / pixelsPerTile))
  };
}

export function resolveMinimapDragResolution(options: {
  canvasSize: number;
  zoom: number;
  targetX: number;
  targetY: number;
  dragStart: { x: number; y: number };
  dragEnd: { x: number; y: number };
}): MinimapDragResolution {
  const dx = options.dragEnd.x - options.dragStart.x;
  const dy = options.dragEnd.y - options.dragStart.y;
  if (Math.sqrt((dx * dx) + (dy * dy)) < 5) {
    return {
      targetX: options.targetX,
      targetY: options.targetY,
      zoom: 1.0,
      minimapLocked: true
    };
  }

  const canvasCenter = options.canvasSize / 2;
  const pixelsPerTile = (options.canvasSize / 100) * options.zoom;
  return {
    targetX: options.targetX + ((((options.dragStart.x + options.dragEnd.x) / 2) - canvasCenter) / pixelsPerTile),
    targetY: options.targetY + ((((options.dragStart.y + options.dragEnd.y) / 2) - canvasCenter) / pixelsPerTile),
    zoom: clamp(options.zoom * (options.canvasSize / Math.max(Math.abs(dx), Math.abs(dy))), 1.0, 20.0),
    minimapLocked: false
  };
}

export function resolveWorldMapDragCenter(options: {
  dragStartCenterX: number;
  dragStartCenterY: number;
  dragStartMouseX: number;
  dragStartMouseY: number;
  dragStartSourceSize: number;
  viewportSize: number;
  mouseX: number;
  mouseY: number;
}): WorldMapDragResolution {
  const tilesPerPixel = options.dragStartSourceSize / Math.max(1, options.viewportSize);
  return {
    centerX: options.dragStartCenterX - ((options.mouseX - options.dragStartMouseX) * tilesPerPixel),
    centerY: options.dragStartCenterY - ((options.mouseY - options.dragStartMouseY) * tilesPerPixel)
  };
}
