import type {
  Point2,
  TerrainBox2D,
  TerrainEllipse,
  WaterBodyDefinition,
  WaterBodyShape,
  WaterDepthProfile,
  WaterDepthZone,
  WaterRenderBody,
  WaterRenderPayload,
  WaterShoreline,
  WaterStyleId,
  WaterStyleTokens,
  WorldDefinition
} from "../contracts/world";

const LEGACY_MAP_SIZE = 486;
const LEGACY_RIVER_ID = "legacy-east-river";
const DEFAULT_SURFACE_Y = -0.075;
const DEFAULT_WATER_STYLE: WaterStyleId = "calm_lake";
const DEFAULT_WATER_SHORELINE: Required<WaterShoreline> = {
  width: 0.78,
  foamWidth: 0.34,
  skirtDepth: 0.18
};
const DEFAULT_WATER_DEPTH_PROFILE: WaterDepthProfile = {
  mode: "tile_truth",
  deepZones: []
};
const CALM_LAKE_STYLE_TOKENS: WaterStyleTokens = {
  shallowColor: 0x78b3c4,
  deepColor: 0x3f748d,
  foamColor: 0xe5f6fc,
  shoreColor: 0xd5c393,
  rippleColor: 0xa7e0f0,
  highlightColor: 0xf9ffff,
  opacity: 0.86,
  shoreOpacity: 0.52
};

function clonePoint2(point: Point2): Point2 {
  return { x: Number(point.x), y: Number(point.y) };
}

function cloneShape(shape: WaterBodyShape): WaterBodyShape {
  if (shape.kind === "polygon") {
    return {
      kind: "polygon",
      points: Array.isArray(shape.points) ? shape.points.map(clonePoint2) : []
    };
  }
  return { ...shape };
}

function cloneDepthZone(zone: WaterDepthZone): WaterDepthZone {
  return {
    shape: cloneShape(zone.shape),
    weight: Number.isFinite(zone.weight) ? Number(zone.weight) : undefined
  };
}

function normalizeDepthProfile(profile?: WaterDepthProfile | null): WaterDepthProfile {
  const deepZones = profile && Array.isArray(profile.deepZones)
    ? profile.deepZones.map(cloneDepthZone)
    : [];
  if (!profile || profile.mode !== "uniform") {
    return {
      mode: "tile_truth",
      deepZones
    };
  }

  return {
    mode: "uniform",
    deepZones
  };
}

function normalizeShoreline(shoreline?: WaterShoreline | null): Required<WaterShoreline> {
  const width = Number.isFinite(shoreline && shoreline.width)
    ? Math.max(0.2, Number(shoreline && shoreline.width))
    : DEFAULT_WATER_SHORELINE.width;
  const foamWidth = Number.isFinite(shoreline && shoreline.foamWidth)
    ? Math.max(0.08, Number(shoreline && shoreline.foamWidth))
    : DEFAULT_WATER_SHORELINE.foamWidth;
  const skirtDepth = Number.isFinite(shoreline && shoreline.skirtDepth)
    ? Math.max(0.04, Number(shoreline && shoreline.skirtDepth))
    : DEFAULT_WATER_SHORELINE.skirtDepth;

  return { width, foamWidth, skirtDepth };
}

function normalizeStyle(style?: WaterStyleId | null): WaterStyleId {
  return style === "calm_lake" ? style : DEFAULT_WATER_STYLE;
}

function cloneTerrainEllipseAsShape(ellipse: TerrainEllipse): WaterBodyShape {
  return {
    kind: "ellipse",
    cx: ellipse.cx,
    cy: ellipse.cy,
    rx: ellipse.rx,
    ry: ellipse.ry
  };
}

function cloneTerrainBoxAsShape(box: TerrainBox2D): WaterBodyShape {
  return {
    kind: "box",
    xMin: box.xMin,
    xMax: box.xMax,
    yMin: box.yMin,
    yMax: box.yMax
  };
}

function sampleLegacyRiverAtY(y: number): { centerX: number; halfWidth: number } {
  const eastCenterBase = 298;
  const southCurveT = Math.max(0, (y - 296) / 98);
  const westBend = Math.pow(Math.min(1, southCurveT), 1.35) * 86;
  return {
    centerX: eastCenterBase + Math.sin(y * 0.018) * 8 + Math.sin(y * 0.007) * 5 - westBend,
    halfWidth: 6.2 + Math.sin(y * 0.045) * 1.8
  };
}

function buildLegacyRiverPolygonPoints(): Point2[] {
  const leftBank: Point2[] = [];
  const rightBank: Point2[] = [];

  for (let y = 4; y <= LEGACY_MAP_SIZE - 4; y += 8) {
    const sample = sampleLegacyRiverAtY(y);
    leftBank.push({ x: sample.centerX - sample.halfWidth - 1.4, y });
    rightBank.push({ x: sample.centerX + sample.halfWidth + 1.4, y });
  }

  const points = leftBank.concat(rightBank.reverse());
  if (points.length === 0) {
    return [
      { x: 288, y: 1 },
      { x: 308, y: 1 },
      { x: 254, y: LEGACY_MAP_SIZE - 2 },
      { x: 278, y: LEGACY_MAP_SIZE - 2 }
    ];
  }
  return points;
}

function createLegacyRiverWaterBody(): WaterBodyDefinition {
  return {
    id: LEGACY_RIVER_ID,
    shape: {
      kind: "polygon",
      points: buildLegacyRiverPolygonPoints()
    },
    surfaceY: DEFAULT_SURFACE_Y,
    depthProfile: {
      mode: "tile_truth",
      deepZones: []
    },
    shoreline: { ...DEFAULT_WATER_SHORELINE },
    style: DEFAULT_WATER_STYLE
  };
}

function createLegacyTerrainWaterBodies(definition: WorldDefinition): WaterBodyDefinition[] {
  const terrain = definition.terrainPatches;
  const lakes = Array.isArray(terrain && terrain.lakes) ? terrain.lakes : [];
  const bodies: WaterBodyDefinition[] = lakes.map((lake, index): WaterBodyDefinition => ({
    id: `legacy-lake-${index + 1}`,
    shape: cloneTerrainEllipseAsShape(lake),
    surfaceY: DEFAULT_SURFACE_Y,
    depthProfile: {
      mode: "tile_truth",
      deepZones: [] as WaterDepthZone[]
    },
    shoreline: { ...DEFAULT_WATER_SHORELINE },
    style: DEFAULT_WATER_STYLE
  }));

  if (terrain && terrain.castleFrontPond) {
    const deepZones: WaterDepthZone[] = terrain.deepWaterCenter
      ? [{ shape: cloneTerrainBoxAsShape(terrain.deepWaterCenter), weight: 1 }]
      : [];
    bodies.push({
      id: "legacy-castle-front-pond",
      shape: cloneTerrainEllipseAsShape(terrain.castleFrontPond),
      surfaceY: DEFAULT_SURFACE_Y,
      depthProfile: {
        mode: "tile_truth",
        deepZones
      },
      shoreline: { ...DEFAULT_WATER_SHORELINE },
      style: DEFAULT_WATER_STYLE
    });
  }

  bodies.push(createLegacyRiverWaterBody());
  return bodies;
}

export function normalizeWaterBodyDefinition(
  body: WaterBodyDefinition,
  fallbackId: string
): WaterBodyDefinition {
  return {
    id: String(body && body.id ? body.id : fallbackId).trim() || fallbackId,
    shape: cloneShape(body.shape),
    surfaceY: Number.isFinite(body.surfaceY) ? Number(body.surfaceY) : DEFAULT_SURFACE_Y,
    depthProfile: normalizeDepthProfile(body.depthProfile),
    shoreline: normalizeShoreline(body.shoreline),
    style: normalizeStyle(body.style)
  };
}

function getStyleTokens(style: WaterStyleId): WaterStyleTokens {
  if (style === "calm_lake") return { ...CALM_LAKE_STYLE_TOKENS };
  return { ...CALM_LAKE_STYLE_TOKENS };
}

function computePolygonBounds(points: Point2[]): TerrainBox2D {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!point) continue;
    xMin = Math.min(xMin, point.x);
    xMax = Math.max(xMax, point.x);
    yMin = Math.min(yMin, point.y);
    yMax = Math.max(yMax, point.y);
  }

  if (!Number.isFinite(xMin)) {
    return { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  }

  return { xMin, xMax, yMin, yMax };
}

function computeShapeBounds(shape: WaterBodyShape): TerrainBox2D {
  if (shape.kind === "ellipse") {
    return {
      xMin: shape.cx - shape.rx,
      xMax: shape.cx + shape.rx,
      yMin: shape.cy - shape.ry,
      yMax: shape.cy + shape.ry
    };
  }
  if (shape.kind === "box") {
    return {
      xMin: shape.xMin,
      xMax: shape.xMax,
      yMin: shape.yMin,
      yMax: shape.yMax
    };
  }
  return computePolygonBounds(shape.points);
}

export function getWorldWaterBodies(definition: WorldDefinition): WaterBodyDefinition[] {
  const authoredBodies = Array.isArray(definition.waterBodies)
    ? definition.waterBodies.map((body, index) => normalizeWaterBodyDefinition(body, `authored-water-${index + 1}`))
    : [];

  if (authoredBodies.length === 0) {
    return createLegacyTerrainWaterBodies(definition)
      .map((body, index) => normalizeWaterBodyDefinition(body, `legacy-water-${index + 1}`));
  }

  const hasRiverBody = authoredBodies.some((body) => body.id === LEGACY_RIVER_ID);
  if (hasRiverBody) return authoredBodies;

  return authoredBodies.concat(
    normalizeWaterBodyDefinition(createLegacyRiverWaterBody(), LEGACY_RIVER_ID)
  );
}

export function buildWaterRenderPayload(definition: WorldDefinition): WaterRenderPayload {
  return {
    bodies: getWorldWaterBodies(definition).map((body): WaterRenderBody => {
      const shoreline = normalizeShoreline(body.shoreline);
      const style = normalizeStyle(body.style);
      return {
        id: body.id,
        shape: cloneShape(body.shape),
        surfaceY: body.surfaceY,
        depthProfile: normalizeDepthProfile(body.depthProfile || DEFAULT_WATER_DEPTH_PROFILE),
        shoreline,
        style,
        bounds: computeShapeBounds(body.shape),
        styleTokens: getStyleTokens(style)
      };
    })
  };
}
