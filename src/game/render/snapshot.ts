import type {
  MinimapSnapshot,
  RenderSnapshot,
  RenderSnapshotGroundItem,
  RenderSnapshotMarker,
  WorldMapSnapshot
} from "../contracts/render";

function cloneMarker(marker: RenderSnapshotMarker): RenderSnapshotMarker {
  return {
    x: marker.x,
    y: marker.y,
    z: marker.z,
    visualY: marker.visualY
  };
}

function cloneGroundItem(item: RenderSnapshotGroundItem): RenderSnapshotGroundItem {
  return {
    x: item.x,
    y: item.y,
    z: item.z,
    uid: item.uid ?? null
  };
}

export function buildRenderSnapshot(options: {
  worldId: string;
  player: RenderSnapshot["player"];
  clickMarkers: RenderSnapshotMarker[];
  groundItems: RenderSnapshotGroundItem[];
  minimapDestination: RenderSnapshot["minimapDestination"];
}): RenderSnapshot {
  return {
    worldId: options.worldId,
    player: {
      x: options.player.x,
      y: options.player.y,
      z: options.player.z,
      facingYaw: options.player.facingYaw
    },
    clickMarkers: Array.isArray(options.clickMarkers) ? options.clickMarkers.map(cloneMarker) : [],
    groundItems: Array.isArray(options.groundItems) ? options.groundItems.map(cloneGroundItem) : [],
    minimapDestination: options.minimapDestination
      ? {
          x: options.minimapDestination.x,
          y: options.minimapDestination.y,
          z: options.minimapDestination.z
        }
      : null
  };
}

export function buildWorldMapSnapshot(options: {
  snapshot: RenderSnapshot;
  viewport: { x: number; y: number; size: number };
  sourceRect: { sourceX: number; sourceY: number; sourceSize: number; centerX: number; centerY: number };
  zoom: number;
}): WorldMapSnapshot {
  const pxPerTile = options.viewport.size / options.sourceRect.sourceSize;
  const worldToCanvas = (wx: number, wy: number) => ({
    x: options.viewport.x + (((wx - options.sourceRect.sourceX) / options.sourceRect.sourceSize) * options.viewport.size),
    y: options.viewport.y + (((wy - options.sourceRect.sourceY) / options.sourceRect.sourceSize) * options.viewport.size)
  });

  const clickMarkers = options.snapshot.clickMarkers
    .filter((marker) => {
      if (Math.abs(marker.visualY - (options.snapshot.player.z * 3.0)) >= 2.0) return false;
      return marker.x >= options.sourceRect.sourceX
        && marker.x <= (options.sourceRect.sourceX + options.sourceRect.sourceSize)
        && marker.y >= options.sourceRect.sourceY
        && marker.y <= (options.sourceRect.sourceY + options.sourceRect.sourceSize);
    })
    .map((marker) => {
      const mapped = worldToCanvas(marker.x, marker.y);
      return {
        x: mapped.x,
        y: mapped.y,
        size: Math.max(2, pxPerTile * 0.9)
      };
    });

  const groundItems = options.snapshot.groundItems
    .filter((item) => {
      if (item.z !== options.snapshot.player.z) return false;
      const wx = item.x + 0.5;
      const wy = item.y + 0.5;
      return wx >= options.sourceRect.sourceX
        && wx <= (options.sourceRect.sourceX + options.sourceRect.sourceSize)
        && wy >= options.sourceRect.sourceY
        && wy <= (options.sourceRect.sourceY + options.sourceRect.sourceSize);
    })
    .map((item) => {
      const mapped = worldToCanvas(item.x + 0.5, item.y + 0.5);
      return {
        x: mapped.x,
        y: mapped.y,
        size: Math.max(2, pxPerTile)
      };
    });

  const playerMapped = worldToCanvas(options.snapshot.player.x + 0.5, options.snapshot.player.y + 0.5);
  const playerRadius = Math.max(2.5, pxPerTile * 1.8);
  const facingLen = Math.max(7, pxPerTile * 8);

  return {
    viewport: { ...options.viewport },
    sourceRect: { ...options.sourceRect },
    clickMarkers,
    groundItems,
    playerDot: {
      x: playerMapped.x,
      y: playerMapped.y,
      radius: playerRadius
    },
    facingLine: {
      fromX: playerMapped.x,
      fromY: playerMapped.y,
      toX: playerMapped.x + (Math.sin(options.snapshot.player.facingYaw) * facingLen),
      toY: playerMapped.y + (Math.cos(options.snapshot.player.facingYaw) * facingLen),
      lineWidth: Math.max(1.5, pxPerTile * 0.8)
    },
    zoomLabel: `Zoom x${options.zoom.toFixed(2)}`
  };
}

export function buildMinimapSnapshot(options: {
  snapshot: RenderSnapshot;
  canvasSize: number;
  zoom: number;
  targetX: number;
  targetY: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  dragEnd: { x: number; y: number };
}): MinimapSnapshot {
  const canvasCenter = options.canvasSize / 2;
  const pixelsPerTile = (options.canvasSize / 100) * options.zoom;
  const clickMarkers = options.snapshot.clickMarkers
    .filter((marker) => Math.abs(marker.visualY - (options.snapshot.player.z * 3.0)) < 2.0)
    .map((marker) => ({
      x: marker.x,
      y: marker.y,
      size: 1
    }));

  const groundItems = options.snapshot.groundItems
    .filter((item) => item.z === options.snapshot.player.z)
    .map((item) => ({
      x: item.x,
      y: item.y,
      size: 1
    }));

  const destinationFlag = options.snapshot.minimapDestination
    && options.snapshot.minimapDestination.z === options.snapshot.player.z
    && Number.isFinite(options.snapshot.minimapDestination.x)
    && Number.isFinite(options.snapshot.minimapDestination.y)
      ? {
          x: options.snapshot.minimapDestination.x + 0.5,
          y: options.snapshot.minimapDestination.y + 0.5,
          poleHeight: 10 / pixelsPerTile,
          poleBottomY: (options.snapshot.minimapDestination.y + 0.5) + (2 / pixelsPerTile),
          poleTopY: ((options.snapshot.minimapDestination.y + 0.5) + (2 / pixelsPerTile)) - (10 / pixelsPerTile),
          flagWidth: 7 / pixelsPerTile,
          flagHeight: 4.5 / pixelsPerTile,
          lineWidth: Math.max(2 / pixelsPerTile, 0.28)
        }
      : null;

  return {
    canvasCenter,
    pixelsPerTile,
    clickMarkers,
    groundItems,
    playerDot: {
      x: options.snapshot.player.x + 0.5,
      y: options.snapshot.player.y + 0.5,
      radius: 3 / pixelsPerTile
    },
    facingLine: {
      fromX: options.snapshot.player.x + 0.5,
      fromY: options.snapshot.player.y + 0.5,
      toX: options.snapshot.player.x + 0.5 + Math.sin(options.snapshot.player.facingYaw) * (8 / pixelsPerTile),
      toY: options.snapshot.player.y + 0.5 + Math.cos(options.snapshot.player.facingYaw) * (8 / pixelsPerTile),
      lineWidth: 2 / pixelsPerTile
    },
    destinationFlag,
    dragRect: options.isDragging
      ? {
          x: Math.min(options.dragStart.x, options.dragEnd.x),
          y: Math.min(options.dragStart.y, options.dragEnd.y),
          w: Math.abs(options.dragEnd.x - options.dragStart.x),
          h: Math.abs(options.dragEnd.y - options.dragStart.y)
        }
      : null
  };
}
