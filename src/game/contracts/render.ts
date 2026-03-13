export interface RenderSnapshotMarker {
  x: number;
  y: number;
  z: number;
  visualY: number;
}

export interface RenderSnapshotGroundItem {
  x: number;
  y: number;
  z: number;
  uid?: string | number | null;
}

export interface RenderSnapshotPlayer {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
}

export interface RenderSnapshot {
  worldId: string;
  player: RenderSnapshotPlayer;
  clickMarkers: RenderSnapshotMarker[];
  groundItems: RenderSnapshotGroundItem[];
  minimapDestination: { x: number; y: number; z: number } | null;
}

export interface WorldMapViewportSnapshot {
  x: number;
  y: number;
  size: number;
}

export interface WorldMapSourceRectSnapshot {
  sourceX: number;
  sourceY: number;
  sourceSize: number;
  centerX: number;
  centerY: number;
}

export interface MinimapDragRectSnapshot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RenderCanvasMarker {
  x: number;
  y: number;
  size: number;
}

export interface RenderCanvasLine {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  lineWidth: number;
}

export interface WorldMapSnapshot {
  viewport: WorldMapViewportSnapshot;
  sourceRect: WorldMapSourceRectSnapshot;
  clickMarkers: RenderCanvasMarker[];
  groundItems: RenderCanvasMarker[];
  playerDot: { x: number; y: number; radius: number };
  facingLine: RenderCanvasLine;
  zoomLabel: string;
}

export interface MinimapDestinationFlagSnapshot {
  x: number;
  y: number;
  poleHeight: number;
  poleBottomY: number;
  poleTopY: number;
  flagWidth: number;
  flagHeight: number;
  lineWidth: number;
}

export interface MinimapSnapshot {
  canvasCenter: number;
  pixelsPerTile: number;
  clickMarkers: RenderCanvasMarker[];
  groundItems: RenderCanvasMarker[];
  playerDot: { x: number; y: number; radius: number };
  facingLine: RenderCanvasLine;
  destinationFlag: MinimapDestinationFlagSnapshot | null;
  dragRect: MinimapDragRectSnapshot | null;
}

export interface InputControllerContext {
  isFreeCam: boolean;
  isDraggingCamera: boolean;
  poseEditorEnabled: boolean;
  poseEditorDragging: boolean;
  cameraYaw: number;
  cameraPitch: number;
  cameraDist: number;
  previousMousePosition: { x: number; y: number };
  currentMousePosition: { x: number; y: number };
  playerPlane: number;
}

export interface PointerDecision {
  preventDefault: boolean;
  closeContextMenu: boolean;
  beginPoseEditorDrag: boolean;
  beginCameraDrag: boolean;
  handleInteractionRaycast: boolean;
  endPoseEditorDrag: boolean;
  endCameraDrag: boolean;
  nextPreviousMousePosition: { x: number; y: number } | null;
}

export interface PointerMoveDecision {
  nextCurrentMousePosition: { x: number; y: number };
  nextPreviousMousePosition: { x: number; y: number } | null;
  nextCameraYaw: number | null;
  nextCameraPitch: number | null;
}

export interface MinimapWalkTarget {
  gridX: number;
  gridY: number;
}

export interface MinimapDragResolution {
  targetX: number;
  targetY: number;
  zoom: number;
  minimapLocked: boolean;
}

export interface WorldMapDragResolution {
  centerX: number;
  centerY: number;
}
