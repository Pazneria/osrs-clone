(function () {
    function requireThree(three) {
        if (!three) throw new Error('World water runtime requires THREE.');
        return three;
    }

    function hash01(x, y, seed = 0) {
        const value = Math.sin((x * 127.1) + (y * 311.7) + (seed * 74.7)) * 43758.5453123;
        return value - Math.floor(value);
    }

    function clampValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function smoothstep(edge0, edge1, value) {
        if (edge0 === edge1) return value < edge0 ? 0 : 1;
        const t = clampValue((value - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - (2 * t));
    }

    function lerpValue(a, b, t) {
        return a + ((b - a) * t);
    }

    const WATER_EDGE_SUBDIVISIONS = 4;
    const WATER_EDGE_OVERLAP_BASE = 0.26;
    const WATER_EDGE_OVERLAP_VARIANCE = 0.12;
    const WATER_EDGE_SURFACE_LIFT_CAP = 0.07;
    const WATER_EDGE_BANK_OVERLAP = 0.006;
    const WATER_FRINGE_SEGMENTS = 4;
    const WATER_FRINGE_INSET = 0.08;
    const WATER_FRINGE_BASE_WIDTH = 1.08;
    const WATER_FRINGE_WIDTH_VARIANCE = 0.28;
    const WATER_FRINGE_SURFACE_OFFSET = 0.018;
    const WATER_SHORELINE_CONTOUR_SPACING = 1.05;
    const WATER_SHORELINE_CONTOUR_MAX_POINTS = 360;
    const WATER_SHORELINE_INNER_WIDTH = 1.05;
    const WATER_SHORELINE_OUTER_WIDTH = 1.18;
    const WATER_SHORELINE_FEATHER_WIDTH = 0.42;
    const WATER_SHORELINE_SURFACE_OFFSET = 0.026;
    const WATER_SEAM_BACKFILL_DROP = 0.045;
    const WATER_SEAM_BACKFILL_OVERLAP = 0.035;
    const WATER_SMOOTH_SURFACE_EDGE_OVERLAP = 2.35;
    const WATER_SMOOTH_SURFACE_Y_OFFSET = -0.052;
    const ISLAND_COASTLINE_SURFACE_LIFT = 0.032;
    const ISLAND_COASTLINE_SURFACE_INNER_OVERLAP = -1.25;
    const ISLAND_COASTLINE_SURFACE_OUTER_WIDTH = 10.5;
    const ISLAND_COASTLINE_TILE_VISUAL_SUPPRESSION_WIDTH = 9.0;
    const ISLAND_COASTLINE_SURFACE_OUTER_PADDING = 1.1;
    const ISLAND_COASTLINE_RIBBON_WATER_WIDTH = 1.75;
    const ISLAND_COASTLINE_RIBBON_BANK_WIDTH = 1.35;

    function pointInPolygon(points, x, y) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const a = points[i];
            const b = points[j];
            if (!a || !b) continue;
            const intersects = ((a.y > y) !== (b.y > y))
                && (x < (((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 0.00001)) + a.x);
            if (intersects) inside = !inside;
        }
        return inside;
    }

    function pointToSegmentDistance(px, py, ax, ay, bx, by) {
        const vx = bx - ax;
        const vy = by - ay;
        const lenSq = (vx * vx) + (vy * vy);
        if (lenSq <= 0.0001) return Math.hypot(px - ax, py - ay);
        const t = clampValue((((px - ax) * vx) + ((py - ay) * vy)) / lenSq, 0, 1);
        const cx = ax + (vx * t);
        const cy = ay + (vy * t);
        return Math.hypot(px - cx, py - cy);
    }

    function distanceToPolygonEdge(points, x, y) {
        if (!Array.isArray(points) || points.length < 2) return Infinity;
        let best = Infinity;
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            if (!a || !b) continue;
            best = Math.min(best, pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y));
        }
        return best;
    }

    function waterShapeContains(shape, x, y) {
        if (!shape || !shape.kind) return false;
        if (shape.kind === 'ellipse') {
            if (!Number.isFinite(shape.rx) || !Number.isFinite(shape.ry) || shape.rx <= 0 || shape.ry <= 0) return false;
            const rotation = Number.isFinite(shape.rotationRadians) ? Number(shape.rotationRadians) : 0;
            const dx = x - shape.cx;
            const dy = y - shape.cy;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const localX = (dx * cos) + (dy * sin);
            const localY = (-dx * sin) + (dy * cos);
            const nx = localX / shape.rx;
            const ny = localY / shape.ry;
            return ((nx * nx) + (ny * ny)) <= 1.0;
        }
        if (shape.kind === 'box') {
            return x >= shape.xMin && x <= shape.xMax && y >= shape.yMin && y <= shape.yMax;
        }
        if (!Array.isArray(shape.points) || shape.points.length < 3) return false;
        return pointInPolygon(shape.points, x, y);
    }

    function isFullMapOceanBody(body, MAP_SIZE) {
        if (!body || !body.shape || body.shape.kind !== 'box' || !body.bounds || !Number.isFinite(MAP_SIZE)) return false;
        const width = body.bounds.xMax - body.bounds.xMin;
        const height = body.bounds.yMax - body.bounds.yMin;
        const startsAtOrigin = body.bounds.xMin <= 1 && body.bounds.yMin <= 1;
        const spansMap = body.bounds.xMax >= MAP_SIZE - 2 && body.bounds.yMax >= MAP_SIZE - 2;
        const namedOcean = /(?:sea|ocean|surrounding)/i.test(String(body.id || ''))
            && width >= MAP_SIZE * 0.45
            && height >= MAP_SIZE * 0.45;
        return (startsAtOrigin && spansMap) || namedOcean;
    }

    function usesSmoothWaterShorelineRibbon(body, MAP_SIZE) {
        if (!body || !body.shape || !body.bounds || isFullMapOceanBody(body, MAP_SIZE)) return false;
        return body.shape.kind === 'ellipse' || body.shape.kind === 'polygon' || body.shape.kind === 'box';
    }

    function usesSmoothWaterSurfaceOverlay(body, MAP_SIZE) {
        if (!body || !body.shape || !body.bounds || isFullMapOceanBody(body, MAP_SIZE)) return false;
        return body.shape.kind === 'ellipse';
    }

    function getWaterInteractionOnlyMaterial(THREE, sharedMaterials) {
        if (!sharedMaterials.waterInteractionOnlyMaterial) {
            sharedMaterials.waterInteractionOnlyMaterial = new THREE.MeshBasicMaterial({
                visible: false,
                side: THREE.DoubleSide
            });
        }
        return sharedMaterials.waterInteractionOnlyMaterial;
    }

    function getSmoothWaterVisualSurfaceY(body, zOffset) {
        return zOffset + (Number.isFinite(body && body.surfaceY) ? body.surfaceY : -0.075) + WATER_SMOOTH_SURFACE_Y_OFFSET;
    }

    function getWaterShorelineContourCache(sharedMaterials) {
        if (!sharedMaterials) return null;
        if (!sharedMaterials.waterShorelineContourCache) {
            sharedMaterials.waterShorelineContourCache = Object.create(null);
        }
        return sharedMaterials.waterShorelineContourCache;
    }

    function getWaterShapeCacheKey(body) {
        if (!body || !body.shape || !body.bounds) return 'missing';
        const shape = body.shape;
        const boundsKey = [
            body.bounds.xMin,
            body.bounds.xMax,
            body.bounds.yMin,
            body.bounds.yMax
        ].map((value) => Number.isFinite(value) ? value.toFixed(2) : 'x').join(',');
        if (shape.kind === 'ellipse') {
            return [
                body.id,
                shape.kind,
                boundsKey,
                shape.cx,
                shape.cy,
                shape.rx,
                shape.ry,
                Number.isFinite(shape.rotationRadians) ? shape.rotationRadians : 0
            ].join(':');
        }
        if (shape.kind === 'box') {
            return [
                body.id,
                shape.kind,
                boundsKey,
                shape.xMin,
                shape.xMax,
                shape.yMin,
                shape.yMax
            ].join(':');
        }
        const points = Array.isArray(shape.points) ? shape.points : [];
        return [
            body.id,
            shape.kind,
            boundsKey,
            points.length,
            points.length > 0 ? points[0].x : 0,
            points.length > 0 ? points[0].y : 0,
            points.length > 0 ? points[points.length - 1].x : 0,
            points.length > 0 ? points[points.length - 1].y : 0
        ].join(':');
    }

    function estimateEllipsePerimeter(rx, ry) {
        const a = Math.max(Math.abs(rx), Math.abs(ry));
        const b = Math.min(Math.abs(rx), Math.abs(ry));
        if (a <= 0 || b <= 0) return 0;
        return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    }

    function resampleClosedContourPoints(rawPoints, maxStep, maxPoints) {
        const source = Array.isArray(rawPoints)
            ? rawPoints.filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
            : [];
        if (source.length < 3) return [];
        const segmentLengths = [];
        let perimeter = 0;
        for (let i = 0; i < source.length; i++) {
            const a = source[i];
            const b = source[(i + 1) % source.length];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const length = Math.sqrt((dx * dx) + (dy * dy));
            segmentLengths.push(length);
            perimeter += length;
        }
        if (perimeter <= 0) return [];
        const count = Math.max(source.length, Math.min(maxPoints, Math.ceil(perimeter / Math.max(0.25, maxStep))));
        const points = [];
        let segmentIndex = 0;
        let distanceBeforeSegment = 0;
        for (let i = 0; i < count; i++) {
            const targetDistance = (i / count) * perimeter;
            while (
                segmentIndex < segmentLengths.length - 1
                && distanceBeforeSegment + segmentLengths[segmentIndex] < targetDistance
            ) {
                distanceBeforeSegment += segmentLengths[segmentIndex];
                segmentIndex++;
            }
            const a = source[segmentIndex];
            const b = source[(segmentIndex + 1) % source.length];
            const segmentLength = segmentLengths[segmentIndex] || 1;
            const t = clampValue((targetDistance - distanceBeforeSegment) / segmentLength, 0, 1);
            points.push({
                x: lerpValue(a.x, b.x, t),
                y: lerpValue(a.y, b.y, t)
            });
        }
        return points;
    }

    function limitContourPointCount(points, maxPoints) {
        if (!Array.isArray(points) || points.length <= maxPoints) return points;
        const limited = [];
        const step = points.length / maxPoints;
        for (let i = 0; i < maxPoints; i++) {
            limited.push(points[Math.floor(i * step)]);
        }
        return limited;
    }

    function smoothClosedContourPoints(points, iterations) {
        let result = Array.isArray(points) ? points : [];
        for (let pass = 0; pass < iterations && result.length >= 3; pass++) {
            const next = [];
            for (let i = 0; i < result.length; i++) {
                const a = result[i];
                const b = result[(i + 1) % result.length];
                next.push({
                    x: lerpValue(a.x, b.x, 0.25),
                    y: lerpValue(a.y, b.y, 0.25)
                });
                next.push({
                    x: lerpValue(a.x, b.x, 0.75),
                    y: lerpValue(a.y, b.y, 0.75)
                });
            }
            result = limitContourPointCount(next, WATER_SHORELINE_CONTOUR_MAX_POINTS);
        }
        return result;
    }

    function computeContourSignedArea(points) {
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            area += (a.x * b.y) - (b.x * a.y);
        }
        return area * 0.5;
    }

    function computeContourVertexNormals(points) {
        const normals = [];
        if (!Array.isArray(points) || points.length < 3) return normals;
        const area = computeContourSignedArea(points);
        const positiveArea = area >= 0;
        for (let i = 0; i < points.length; i++) {
            const prev = points[(i - 1 + points.length) % points.length];
            const next = points[(i + 1) % points.length];
            const tx = next.x - prev.x;
            const ty = next.y - prev.y;
            const length = Math.sqrt((tx * tx) + (ty * ty)) || 1;
            normals.push(positiveArea
                ? { x: ty / length, y: -tx / length }
                : { x: -ty / length, y: tx / length });
        }
        return normals;
    }

    function buildSmoothWaterShorelineContourPoints(body) {
        const shape = body && body.shape;
        if (!shape || !shape.kind) return [];
        if (shape.kind === 'ellipse') {
            const perimeter = estimateEllipsePerimeter(shape.rx, shape.ry);
            const count = Math.max(48, Math.min(WATER_SHORELINE_CONTOUR_MAX_POINTS, Math.ceil(perimeter / WATER_SHORELINE_CONTOUR_SPACING)));
            const rotation = Number.isFinite(shape.rotationRadians) ? Number(shape.rotationRadians) : 0;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const points = [];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const localX = Math.cos(angle) * shape.rx;
                const localY = Math.sin(angle) * shape.ry;
                points.push({
                    x: shape.cx + (localX * cos) - (localY * sin),
                    y: shape.cy + (localX * sin) + (localY * cos)
                });
            }
            return points;
        }
        if (shape.kind === 'box') {
            const raw = [
                { x: shape.xMin, y: shape.yMin },
                { x: shape.xMax, y: shape.yMin },
                { x: shape.xMax, y: shape.yMax },
                { x: shape.xMin, y: shape.yMax }
            ];
            return smoothClosedContourPoints(
                resampleClosedContourPoints(raw, WATER_SHORELINE_CONTOUR_SPACING, WATER_SHORELINE_CONTOUR_MAX_POINTS),
                1
            );
        }
        const rawPoints = Array.isArray(shape.points) ? shape.points.filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y)) : [];
        if (rawPoints.length < 3) return [];
        return smoothClosedContourPoints(
            resampleClosedContourPoints(rawPoints, WATER_SHORELINE_CONTOUR_SPACING, WATER_SHORELINE_CONTOUR_MAX_POINTS),
            1
        );
    }

    function getSmoothWaterShorelineContour(context, body) {
        const cache = getWaterShorelineContourCache(context.sharedMaterials || {});
        const key = getWaterShapeCacheKey(body);
        if (cache && cache[key]) return cache[key];
        const points = buildSmoothWaterShorelineContourPoints(body);
        const contour = {
            points,
            normals: computeContourVertexNormals(points)
        };
        if (cache) cache[key] = contour;
        return contour;
    }

    function getIslandWaterLandPolygon(islandWater) {
        const points = islandWater && islandWater.enabled !== false && Array.isArray(islandWater.landPolygon)
            ? islandWater.landPolygon
            : [];
        const safePoints = points.filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
        return safePoints.length >= 3 ? safePoints : [];
    }

    function getPointBounds(points) {
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
        if (!Number.isFinite(xMin)) return null;
        return { xMin, xMax, yMin, yMax };
    }

    function usesIslandCoastlineRibbon(body, context = {}) {
        if (!isFullMapOceanBody(body, context.MAP_SIZE)) return false;
        return getIslandWaterLandPolygon(context.islandWater).length >= 3;
    }

    function findFullMapOceanWaterBody(waterBodies, MAP_SIZE) {
        const bodies = Array.isArray(waterBodies) ? waterBodies : [];
        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];
            if (isFullMapOceanBody(body, MAP_SIZE)) return body;
        }
        return null;
    }

    function createIslandCoastlineWaterBody(context, oceanBody) {
        const points = getIslandWaterLandPolygon(context.islandWater);
        const bounds = getPointBounds(points);
        if (!bounds || !oceanBody) return null;
        const islandWater = context.islandWater || {};
        const oceanShoreline = oceanBody.shoreline || {};
        const width = Number.isFinite(islandWater.shoreWidth)
            ? clampValue(Number(islandWater.shoreWidth) * 0.62, 1.2, 3.4)
            : Math.max(ISLAND_COASTLINE_RIBBON_WATER_WIDTH, Number.isFinite(oceanShoreline.width) ? oceanShoreline.width : 0);
        return {
            id: `${oceanBody.id || 'ocean'}-island-coastline`,
            shape: { kind: 'polygon', points },
            bounds,
            surfaceY: Number.isFinite(oceanBody.surfaceY) ? oceanBody.surfaceY : -0.075,
            shoreline: {
                width,
                foamWidth: Number.isFinite(oceanShoreline.foamWidth) ? oceanShoreline.foamWidth : 0.3,
                skirtDepth: Number.isFinite(oceanShoreline.skirtDepth) ? oceanShoreline.skirtDepth : 0.18
            },
            styleTokens: oceanBody.styleTokens || getDefaultWaterRenderBody().styleTokens
        };
    }

    function getIslandCoastlineWaterShoreStrength(context, worldX, worldY) {
        const points = getIslandWaterLandPolygon(context.islandWater);
        if (points.length < 3) return null;
        const distance = distanceToPolygonEdge(points, worldX, worldY);
        if (!Number.isFinite(distance)) return null;
        const width = Number.isFinite(context.islandWater && context.islandWater.shallowDistance)
            ? clampValue(Number(context.islandWater.shallowDistance) * 0.32, 1.6, 4.0)
            : 2.65;
        const insideLand = pointInPolygon(points, worldX, worldY);
        if (insideLand && distance > 0.7) return 0;
        return 1 - smoothstep(0.16, width, distance);
    }

    function getIslandCoastlineSurfaceOuterWidth(context) {
        const islandWater = context && context.islandWater ? context.islandWater : {};
        const shallowDistanceWidth = Number.isFinite(islandWater.shallowDistance)
            ? clampValue(Number(islandWater.shallowDistance) * 0.82, 7.5, 12.5)
            : 0;
        return Math.max(ISLAND_COASTLINE_SURFACE_OUTER_WIDTH, shallowDistanceWidth);
    }

    function getIslandCoastlineTileVisualSuppressionWidth(context) {
        return Math.max(
            ISLAND_COASTLINE_TILE_VISUAL_SUPPRESSION_WIDTH,
            getIslandCoastlineSurfaceOuterWidth(context) - ISLAND_COASTLINE_SURFACE_OUTER_PADDING
        );
    }

    function isIslandCoastlineWaterTile(context, x, y) {
        const points = getIslandWaterLandPolygon(context.islandWater);
        if (points.length < 3 || pointInPolygon(points, x, y)) return false;
        const width = getIslandCoastlineTileVisualSuppressionWidth(context);
        const bounds = getPointBounds(points);
        if (
            bounds
            && (
                x < bounds.xMin - width
                || x > bounds.xMax + width
                || y < bounds.yMin - width
                || y > bounds.yMax + width
            )
        ) {
            return false;
        }
        const distance = distanceToPolygonEdge(points, x, y);
        if (!Number.isFinite(distance)) return false;
        return distance <= width;
    }

    function isIslandCoastlineWaterTileCached(context, x, y) {
        if (!context) return false;
        const cache = context.islandCoastlineWaterTileCache || (context.islandCoastlineWaterTileCache = Object.create(null));
        const key = `${x},${y}`;
        if (cache[key] !== undefined) return cache[key];
        const value = isIslandCoastlineWaterTile(context, x, y);
        cache[key] = value;
        return value;
    }

    function createIslandCoastlineInteractionBody(body) {
        return Object.assign({}, body, {
            id: `${body.id || 'ocean'}-coast-interaction`
        });
    }

    function resolveWaterRenderBodyForTile(waterBodies, x, y) {
        if (!Array.isArray(waterBodies)) return null;
        for (let i = waterBodies.length - 1; i >= 0; i--) {
            const body = waterBodies[i];
            if (!body || !body.bounds) continue;
            if (x < body.bounds.xMin || x > body.bounds.xMax || y < body.bounds.yMin || y > body.bounds.yMax) continue;
            if (waterShapeContains(body.shape, x, y)) return body;
        }
        return null;
    }

    function getDefaultWaterRenderBody() {
        return {
            id: 'legacy-water-fallback',
            shoreline: { width: 0.78, foamWidth: 0.34, skirtDepth: 0.18 },
            styleTokens: {
                shallowColor: 0x78b3c4,
                deepColor: 0x3f748d,
                foamColor: 0xe5f6fc,
                shoreColor: 0xd5c393,
                rippleColor: 0xa7e0f0,
                highlightColor: 0xf9ffff,
                opacity: 0.86,
                shoreOpacity: 0.52
            },
            surfaceY: -0.075
        };
    }

    function findNearbyWaterRenderBodyForTile(options = {}) {
        const waterBodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const maxRadius = Number.isFinite(options.maxRadius) ? options.maxRadius : 3;
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let ny = Math.max(0, y - radius); ny <= Math.min(MAP_SIZE - 1, y + radius); ny++) {
                for (let nx = Math.max(0, x - radius); nx <= Math.min(MAP_SIZE - 1, x + radius); nx++) {
                    if (!isWaterTileId(logicalMap[z][ny][nx])) continue;
                    const body = resolveWaterRenderBodyForTile(waterBodies, nx, ny);
                    if (body) return body;
                }
            }
        }
        return null;
    }

    function resolveVisualWaterRenderBodyAtTile(context = {}, waterBodies = [], x, y, z) {
        const bodies = Array.isArray(waterBodies) ? waterBodies : [];
        const logicalMap = context.logicalMap || [];
        const MAP_SIZE = context.MAP_SIZE;
        const isWaterTileId = typeof context.isWaterTileId === 'function' ? context.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof context.isPierVisualCoverageTile === 'function'
            ? context.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof context.getActivePierConfig === 'function'
            ? context.getActivePierConfig
            : () => null;
        const activePierConfig = context.activePierConfig !== undefined ? context.activePierConfig : getActivePierConfig();
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
        if (!logicalMap[z] || !logicalMap[z][y]) return null;
        const tile = logicalMap[z][y][x];
        const pierCovered = isPierVisualCoverageTile(activePierConfig, x, y, z);
        if (!isWaterTileId(tile) && !pierCovered) return null;

        const directBody = resolveWaterRenderBodyForTile(bodies, x, y);
        if (directBody) return directBody;
        if (isWaterTileId(tile)) return getDefaultWaterRenderBody();
        if (pierCovered) {
            return findNearbyWaterRenderBodyForTile({
                waterBodies: bodies,
                x,
                y,
                z,
                MAP_SIZE,
                logicalMap,
                isWaterTileId
            }) || getDefaultWaterRenderBody();
        }
        return null;
    }

    function resolveVisualWaterRenderBodyForTile(options = {}) {
        const waterBodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const x = options.x;
        const y = options.y;
        const z = options.z;
        return resolveVisualWaterRenderBodyAtTile(options, waterBodies, x, y, z);
    }

    function getWaterSurfaceHeightForTile(options = {}) {
        const waterBodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const x = options.x;
        const y = options.y;
        const z = options.z;
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
        if (!isWaterTileId(logicalMap[z][y][x])) return null;
        const waterBody = resolveWaterRenderBodyForTile(waterBodies, x, y) || getDefaultWaterRenderBody();
        return Number.isFinite(waterBody.surfaceY) ? waterBody.surfaceY : -0.075;
    }

    function getWaterDepthWeightForTile(tile, TileId) {
        if (tile === TileId.WATER_DEEP) return 1.0;
        if (tile === TileId.WATER_SHALLOW) return 0.36;
        return null;
    }

    function getWaterDepthWeightAtPoint(options = {}) {
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const TileId = options.TileId || {};
        const worldX = options.worldX;
        const worldY = options.worldY;
        const z = options.z;
        const sampleOffsets = [
            { x: 0, y: 0, weight: 1.4 },
            { x: -0.42, y: 0, weight: 0.78 },
            { x: 0.42, y: 0, weight: 0.78 },
            { x: 0, y: -0.42, weight: 0.78 },
            { x: 0, y: 0.42, weight: 0.78 },
            { x: -0.42, y: -0.42, weight: 0.46 },
            { x: 0.42, y: -0.42, weight: 0.46 },
            { x: 0.42, y: 0.42, weight: 0.46 },
            { x: -0.42, y: 0.42, weight: 0.46 },
            { x: -0.78, y: 0, weight: 0.24 },
            { x: 0.78, y: 0, weight: 0.24 },
            { x: 0, y: -0.78, weight: 0.24 },
            { x: 0, y: 0.78, weight: 0.24 }
        ];
        let total = 0;
        let count = 0;
        for (let i = 0; i < sampleOffsets.length; i++) {
            const sample = sampleOffsets[i];
            const gridX = Math.floor(worldX + sample.x + 0.5);
            const gridY = Math.floor(worldY + sample.y + 0.5);
            if (gridX < 0 || gridY < 0 || gridX >= MAP_SIZE || gridY >= MAP_SIZE) continue;
            const weight = getWaterDepthWeightForTile(logicalMap[z][gridY][gridX], TileId);
            if (weight !== null) {
                total += weight * sample.weight;
                count += sample.weight;
            }
        }
        if (count > 0) return total / count;

        const centerX = Math.floor(worldX + 0.5);
        const centerY = Math.floor(worldY + 0.5);
        for (let radius = 1; radius <= 2; radius++) {
            total = 0;
            count = 0;
            for (let y = Math.max(0, centerY - radius); y <= Math.min(MAP_SIZE - 1, centerY + radius); y++) {
                for (let x = Math.max(0, centerX - radius); x <= Math.min(MAP_SIZE - 1, centerX + radius); x++) {
                    const weight = getWaterDepthWeightForTile(logicalMap[z][y][x], TileId);
                    if (weight === null) continue;
                    total += weight;
                    count++;
                }
            }
            if (count > 0) return total / count;
        }

        return 0.48;
    }

    function distanceToTileRect(worldX, worldY, tileX, tileY) {
        const dx = Math.max(Math.abs(worldX - tileX) - 0.5, 0);
        const dy = Math.max(Math.abs(worldY - tileY) - 0.5, 0);
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    function getWaterShoreStrengthAtPoint(options = {}) {
        const logicalMap = options.logicalMap || [];
        const MAP_SIZE = options.MAP_SIZE;
        const isWaterTileId = typeof options.isWaterTileId === 'function' ? options.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof options.isPierVisualCoverageTile === 'function'
            ? options.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig
            : () => null;
        const activePierConfig = options.activePierConfig !== undefined ? options.activePierConfig : getActivePierConfig();
        const worldX = options.worldX;
        const worldY = options.worldY;
        const z = options.z;
        const shorelineWidth = options.shorelineWidth;
        const resolvedShorelineWidth = Math.max(1.38, Number.isFinite(shorelineWidth) ? shorelineWidth : 0.8);
        const searchRadius = Math.max(1, Math.ceil(resolvedShorelineWidth + 1));
        const minX = Math.max(0, Math.floor(worldX - searchRadius));
        const maxX = Math.min(MAP_SIZE - 1, Math.ceil(worldX + searchRadius));
        const minY = Math.max(0, Math.floor(worldY - searchRadius));
        const maxY = Math.min(MAP_SIZE - 1, Math.ceil(worldY + searchRadius));
        let minDistance = resolvedShorelineWidth;
        for (let tileY = minY; tileY <= maxY; tileY++) {
            for (let tileX = minX; tileX <= maxX; tileX++) {
                if (isWaterTileId(logicalMap[z][tileY][tileX])) continue;
                if (isPierVisualCoverageTile(activePierConfig, tileX, tileY, z)) continue;
                minDistance = Math.min(minDistance, distanceToTileRect(worldX, worldY, tileX, tileY));
                if (minDistance <= 0.001) return 1;
            }
        }

        return 1 - Math.min(1, minDistance / resolvedShorelineWidth);
    }

    function getWaterSurfaceVertexData(builder, context, worldX, worldY) {
        const cacheKey = `${Number(worldX).toFixed(3)},${Number(worldY).toFixed(3)}`;
        if (builder.surfaceVertexDataCache && builder.surfaceVertexDataCache[cacheKey]) {
            return builder.surfaceVertexDataCache[cacheKey];
        }
        const depthContext = builder.depthSampleContext || Object.assign({}, context, { z: builder.z });
        depthContext.worldX = worldX;
        depthContext.worldY = worldY;
        builder.depthSampleContext = depthContext;
        const depth = getWaterDepthWeightAtPoint(depthContext);
        let shoreStrength = null;
        if (builder.usesIslandCoastlineRibbon) {
            shoreStrength = getIslandCoastlineWaterShoreStrength(context, worldX, worldY);
        } else {
            const shoreContext = builder.shoreSampleContext || Object.assign({}, context, {
                z: builder.z,
                shorelineWidth: builder.body.shoreline.width
            });
            shoreContext.worldX = worldX;
            shoreContext.worldY = worldY;
            builder.shoreSampleContext = shoreContext;
            shoreStrength = getWaterShoreStrengthAtPoint(shoreContext);
        }
        const data = {
            depth,
            shoreStrength
        };
        if (builder.surfaceVertexDataCache) builder.surfaceVertexDataCache[cacheKey] = data;
        return data;
    }

    function pushWaterVertex(builder, context, worldX, worldY, surfaceY) {
        const vertexData = getWaterSurfaceVertexData(builder, context, worldX, worldY);
        builder.surfacePositions.push(worldX, surfaceY, worldY);
        builder.surfaceData.push(
            vertexData.depth,
            vertexData.shoreStrength
        );
    }

    function createChunkWaterBuilder(body, z) {
        return {
            body,
            z,
            usesSmoothShorelineRibbon: false,
            usesSmoothSurfaceOverlay: false,
            usesIslandCoastlineRibbon: false,
            forceInteractionOnly: false,
            shorelineRibbonAppended: false,
            islandCoastlineAppended: false,
            smoothSurfaceAppended: false,
            surfaceVertexDataCache: Object.create(null),
            depthSampleContext: null,
            shoreSampleContext: null,
            flatSurfaceRows: Object.create(null),
            surfacePositions: [],
            surfaceData: [],
            smoothSurfacePositions: [],
            smoothSurfaceData: [],
            seamBackfillRows: Object.create(null),
            seamBackfillPositions: [],
            seamBackfillData: [],
            fringePositions: [],
            fringeData: [],
            fringeAlpha: []
        };
    }

    function isInteriorFullMapOceanTile(context, body, x, y, z, useCoastInteractionOnly) {
        if (useCoastInteractionOnly || !isFullMapOceanBody(body, context.MAP_SIZE)) return false;
        const logicalMap = context.logicalMap || [];
        const isWaterTileId = typeof context.isWaterTileId === 'function' ? context.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof context.isPierVisualCoverageTile === 'function'
            ? context.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof context.getActivePierConfig === 'function'
            ? context.getActivePierConfig
            : () => null;
        if (!logicalMap[z] || !logicalMap[z][y] || !isWaterTileId(logicalMap[z][y][x])) return false;
        const pierConfig = context.activePierConfig !== undefined ? context.activePierConfig : getActivePierConfig();
        if (isPierVisualCoverageTile(pierConfig, x, y, z)) return false;
        if (usesIslandCoastlineRibbon(body, context) && isIslandCoastlineWaterTileCached(context, x, y)) return false;
        const neighbors = [
            { x, y: y - 1 },
            { x: x + 1, y },
            { x, y: y + 1 },
            { x: x - 1, y }
        ];
        for (let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];
            if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= context.MAP_SIZE || neighbor.y >= context.MAP_SIZE) return false;
            if (!logicalMap[z][neighbor.y] || !isWaterTileId(logicalMap[z][neighbor.y][neighbor.x])) return false;
            if (isPierVisualCoverageTile(pierConfig, neighbor.x, neighbor.y, z)) return false;
        }
        return true;
    }

    function appendFlatWaterRunTile(builder, y, x, surfaceY) {
        const key = `${y}:${Number.isFinite(surfaceY) ? surfaceY.toFixed(3) : 'water'}`;
        const row = builder.flatSurfaceRows[key] || (builder.flatSurfaceRows[key] = {
            y,
            surfaceY,
            xs: []
        });
        row.xs.push(x);
    }

    function appendFlatWaterSurfaceRun(builder, context, x0, x1, y, surfaceY) {
        const left = x0 - 0.5;
        const right = x1 + 0.5;
        const north = y - 0.5;
        const south = y + 0.5;
        pushWaterVertex(builder, context, left, north, surfaceY);
        pushWaterVertex(builder, context, right, south, surfaceY);
        pushWaterVertex(builder, context, right, north, surfaceY);
        pushWaterVertex(builder, context, left, north, surfaceY);
        pushWaterVertex(builder, context, left, south, surfaceY);
        pushWaterVertex(builder, context, right, south, surfaceY);
    }

    function appendFlatWaterSurfaceRuns(builder, context) {
        const rows = builder && builder.flatSurfaceRows ? Object.keys(builder.flatSurfaceRows) : [];
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = builder.flatSurfaceRows[rows[rowIndex]];
            if (!row || !Array.isArray(row.xs) || row.xs.length <= 0) continue;
            const xs = row.xs.slice().sort((a, b) => a - b);
            let runStart = xs[0];
            let runEnd = xs[0];
            const flushRun = () => {
                appendFlatWaterSurfaceRun(builder, context, runStart, runEnd, row.y, row.surfaceY);
            };
            for (let i = 1; i < xs.length; i++) {
                const x = xs[i];
                if (x === runEnd + 1) {
                    runEnd = x;
                    continue;
                }
                flushRun();
                runStart = x;
                runEnd = x;
            }
            flushRun();
        }
    }

    function classifyWaterEdgeTypeAtTile(context = {}, waterBodies = [], x, y, dx, dy, z, waterSurfaceY) {
        const logicalMap = context.logicalMap || [];
        const heightMap = context.heightMap || [];
        const MAP_SIZE = context.MAP_SIZE;
        const isWaterTileId = typeof context.isWaterTileId === 'function' ? context.isWaterTileId : () => false;
        const isPierVisualCoverageTile = typeof context.isPierVisualCoverageTile === 'function'
            ? context.isPierVisualCoverageTile
            : () => false;
        const getActivePierConfig = typeof context.getActivePierConfig === 'function'
            ? context.getActivePierConfig
            : () => null;
        const nx = x + dx;
        const ny = y + dy;
        const planeOffset = z * 3.0;
        if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) {
            return {
                kind: 'outside',
                topY: waterSurfaceY + 0.16
            };
        }

        if (isWaterTileId(logicalMap[z][ny][nx])) return null;
        if (resolveVisualWaterRenderBodyAtTile(context, waterBodies, nx, ny, z)) return null;

        const pierConfig = context.activePierConfig !== undefined ? context.activePierConfig : getActivePierConfig();
        if (isPierVisualCoverageTile(pierConfig, nx, ny, z)) {
            return {
                kind: 'structural_cover',
                topY: heightMap[z][ny][nx] + planeOffset
            };
        }

        return {
            kind: 'natural_bank',
            topY: heightMap[z][ny][nx] + planeOffset
        };
    }

    function classifyWaterEdgeType(options = {}) {
        const sharedMaterials = options.sharedMaterials || {};
        const waterBodies = Array.isArray(sharedMaterials.activeWaterRenderBodies)
            ? sharedMaterials.activeWaterRenderBodies
            : [];
        return classifyWaterEdgeTypeAtTile(
            options,
            waterBodies,
            options.x,
            options.y,
            options.dx,
            options.dy,
            options.z,
            options.waterSurfaceY
        );
    }

    function isSoftWaterEdge(edge) {
        return edge && edge.kind !== 'structural_cover';
    }

    function getWaterEdgeOverlap(worldX, worldY, edgeSeed) {
        const broad = hash01(worldX * 2.4, worldY * 2.4, edgeSeed) - 0.5;
        const fine = hash01(worldX * 6.3, worldY * 6.3, edgeSeed + 13.7) - 0.5;
        return clampValue(
            WATER_EDGE_OVERLAP_BASE + (broad * WATER_EDGE_OVERLAP_VARIANCE) + (fine * WATER_EDGE_OVERLAP_VARIANCE * 0.42),
            0.14,
            0.44
        );
    }

    function getWaterEdgeSurfaceHeight(edge, surfaceY) {
        if (!isSoftWaterEdge(edge)) return surfaceY;
        const bankTopY = Number.isFinite(edge.topY) ? edge.topY : surfaceY;
        const bankOverlapY = bankTopY + WATER_EDGE_BANK_OVERLAP;
        return clampValue(bankOverlapY, surfaceY, surfaceY + WATER_EDGE_SURFACE_LIFT_CAP);
    }

    function getWaterEdgeVertex(x, y, localX, localY, surfaceY, edges, isPierCoveredTile) {
        let worldX = x - 0.5 + localX;
        let worldY = y - 0.5 + localY;
        let edgeSurfaceY = surfaceY;
        if (!isPierCoveredTile && localY === 0 && isSoftWaterEdge(edges.north)) {
            worldY -= getWaterEdgeOverlap(worldX, y - 0.5, 11.1);
            edgeSurfaceY = Math.max(edgeSurfaceY, getWaterEdgeSurfaceHeight(edges.north, surfaceY));
        }
        if (!isPierCoveredTile && localY === 1 && isSoftWaterEdge(edges.south)) {
            worldY += getWaterEdgeOverlap(worldX, y + 0.5, 23.2);
            edgeSurfaceY = Math.max(edgeSurfaceY, getWaterEdgeSurfaceHeight(edges.south, surfaceY));
        }
        if (!isPierCoveredTile && localX === 0 && isSoftWaterEdge(edges.west)) {
            worldX -= getWaterEdgeOverlap(x - 0.5, worldY, 37.3);
            edgeSurfaceY = Math.max(edgeSurfaceY, getWaterEdgeSurfaceHeight(edges.west, surfaceY));
        }
        if (!isPierCoveredTile && localX === 1 && isSoftWaterEdge(edges.east)) {
            worldX += getWaterEdgeOverlap(x + 0.5, worldY, 41.4);
            edgeSurfaceY = Math.max(edgeSurfaceY, getWaterEdgeSurfaceHeight(edges.east, surfaceY));
        }
        return { x: worldX, y: worldY, h: edgeSurfaceY };
    }

    function pushWaterCellVertex(builder, context, vertex) {
        pushWaterVertex(builder, context, vertex.x, vertex.y, vertex.h);
    }

    function pushWaterSeamBackfillVertex(builder, worldX, worldY, surfaceY, depthWeight, shoreStrength) {
        builder.seamBackfillPositions.push(worldX, surfaceY - WATER_SEAM_BACKFILL_DROP, worldY);
        builder.seamBackfillData.push(clampValue(depthWeight, 0, 1), clampValue(shoreStrength, 0, 1));
    }

    function appendWaterSeamBackfillQuad(builder, x, y, surfaceY) {
        if (builder.forceInteractionOnly || builder.usesSmoothSurfaceOverlay) return;
        const key = `${y}:${Number.isFinite(surfaceY) ? surfaceY.toFixed(3) : 'water'}`;
        const row = builder.seamBackfillRows[key] || (builder.seamBackfillRows[key] = {
            y,
            surfaceY,
            xs: []
        });
        row.xs.push(x);
    }

    function appendWaterSeamBackfillRuns(builder) {
        const rows = builder && builder.seamBackfillRows ? Object.keys(builder.seamBackfillRows) : [];
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = builder.seamBackfillRows[rows[rowIndex]];
            if (!row || !Array.isArray(row.xs) || row.xs.length <= 0) continue;
            const xs = row.xs.slice().sort((a, b) => a - b);
            let runStart = xs[0];
            let runEnd = xs[0];
            const flushRun = () => {
                const x0 = runStart - 0.5 - WATER_SEAM_BACKFILL_OVERLAP;
                const x1 = runEnd + 0.5 + WATER_SEAM_BACKFILL_OVERLAP;
                const y0 = row.y - 0.5 - WATER_SEAM_BACKFILL_OVERLAP;
                const y1 = row.y + 0.5 + WATER_SEAM_BACKFILL_OVERLAP;
                const depthWeight = 0.72;
                const shoreStrength = 0.18;
                pushWaterSeamBackfillVertex(builder, x0, y0, row.surfaceY, depthWeight, shoreStrength);
                pushWaterSeamBackfillVertex(builder, x1, y1, row.surfaceY, depthWeight, shoreStrength);
                pushWaterSeamBackfillVertex(builder, x1, y0, row.surfaceY, depthWeight, shoreStrength);
                pushWaterSeamBackfillVertex(builder, x0, y0, row.surfaceY, depthWeight, shoreStrength);
                pushWaterSeamBackfillVertex(builder, x0, y1, row.surfaceY, depthWeight, shoreStrength);
                pushWaterSeamBackfillVertex(builder, x1, y1, row.surfaceY, depthWeight, shoreStrength);
            };
            for (let i = 1; i < xs.length; i++) {
                const x = xs[i];
                if (x <= runEnd + 1) {
                    runEnd = x;
                    continue;
                }
                flushRun();
                runStart = x;
                runEnd = x;
            }
            flushRun();
        }
    }

    function pushWaterFringeVertex(builder, worldX, worldY, surfaceY, alpha, lane = 0.24, breakSeed = 1.0) {
        builder.fringePositions.push(worldX, surfaceY, worldY);
        builder.fringeData.push(lane, breakSeed);
        builder.fringeAlpha.push(clampValue(alpha, 0, 1));
    }

    function getFringeWidth(worldX, worldY, seed) {
        const broad = hash01(worldX * 1.7, worldY * 1.7, seed) - 0.5;
        const fine = hash01(worldX * 5.1, worldY * 5.1, seed + 17.7) - 0.5;
        return clampValue(
            WATER_FRINGE_BASE_WIDTH + (broad * WATER_FRINGE_WIDTH_VARIANCE) + (fine * WATER_FRINGE_WIDTH_VARIANCE * 0.42),
            0.54,
            1.12
        );
    }

    function getFringePointForEdge(x, y, edgeName, t, offset) {
        if (edgeName === 'north') return { x: x - 0.5 + t, y: y - 0.5 - offset };
        if (edgeName === 'south') return { x: x - 0.5 + t, y: y + 0.5 + offset };
        if (edgeName === 'west') return { x: x - 0.5 - offset, y: y - 0.5 + t };
        return { x: x + 0.5 + offset, y: y - 0.5 + t };
    }

    function appendWaterFringeForEdge(builder, x, y, surfaceY, edgeName, edge, isPierCoveredTile) {
        if (isPierCoveredTile || !isSoftWaterEdge(edge)) return;
        const bankTopY = Number.isFinite(edge.topY) ? edge.topY : surfaceY;
        const nearSurfaceY = getWaterEdgeSurfaceHeight(edge, surfaceY) + WATER_FRINGE_SURFACE_OFFSET;
        const bankSurfaceY = bankTopY + WATER_FRINGE_SURFACE_OFFSET;
        const seedBase = edgeName === 'north' ? 113.1 : edgeName === 'south' ? 229.7 : edgeName === 'west' ? 337.3 : 443.9;
        for (let i = 0; i < WATER_FRINGE_SEGMENTS; i++) {
            const t0 = i / WATER_FRINGE_SEGMENTS;
            const t1 = (i + 1) / WATER_FRINGE_SEGMENTS;
            const midT0 = (t0 + (0.5 / WATER_FRINGE_SEGMENTS));
            const midT1 = (t1 - (0.5 / WATER_FRINGE_SEGMENTS));
            const near0 = getFringePointForEdge(x, y, edgeName, t0, -WATER_FRINGE_INSET);
            const near1 = getFringePointForEdge(x, y, edgeName, t1, -WATER_FRINGE_INSET);
            const far0Width = getFringeWidth(near0.x + midT0, near0.y - midT0, seedBase);
            const far1Width = getFringeWidth(near1.x + midT1, near1.y - midT1, seedBase + 3.7);
            const far0 = getFringePointForEdge(x, y, edgeName, t0, far0Width);
            const far1 = getFringePointForEdge(x, y, edgeName, t1, far1Width);
            const nearAlpha = 0.72 + (hash01(x + t0, y + t1, seedBase + 9.1) * 0.16);
            pushWaterFringeVertex(builder, near0.x, near0.y, nearSurfaceY, nearAlpha);
            pushWaterFringeVertex(builder, far1.x, far1.y, bankSurfaceY, 0);
            pushWaterFringeVertex(builder, near1.x, near1.y, nearSurfaceY, nearAlpha * 0.94);
            pushWaterFringeVertex(builder, near0.x, near0.y, nearSurfaceY, nearAlpha);
            pushWaterFringeVertex(builder, far0.x, far0.y, bankSurfaceY, 0);
            pushWaterFringeVertex(builder, far1.x, far1.y, bankSurfaceY, 0);
        }
    }

    function sampleShorelineRibbonHeight(context, builder, worldX, worldY, surfaceY, lane) {
        const heightMap = context.heightMap || [];
        const MAP_SIZE = context.MAP_SIZE;
        const z = builder.z;
        const tileX = clampValue(Math.floor(worldX + 0.5), 0, MAP_SIZE - 1);
        const tileY = clampValue(Math.floor(worldY + 0.5), 0, MAP_SIZE - 1);
        const planeOffset = z * 3.0;
        const fallbackBankY = surfaceY + 0.08;
        const row = heightMap[z] && heightMap[z][tileY] ? heightMap[z][tileY] : null;
        const sampledBankY = row && Number.isFinite(row[tileX]) ? row[tileX] + planeOffset : fallbackBankY;
        const bankY = Math.max(sampledBankY, surfaceY + WATER_SHORELINE_SURFACE_OFFSET);
        const bankBlend = clampValue((lane - 0.52) / 0.48, 0, 1);
        return lerpValue(surfaceY + WATER_SHORELINE_SURFACE_OFFSET, bankY + WATER_SHORELINE_SURFACE_OFFSET, bankBlend);
    }

    function pushWaterShorelineRibbonVertex(builder, context, surfaceY, point, normal, laneConfig, segmentSeed) {
        const worldX = point.x + (normal.x * laneConfig.offset);
        const worldY = point.y + (normal.y * laneConfig.offset);
        const height = sampleShorelineRibbonHeight(context, builder, worldX, worldY, surfaceY, laneConfig.lane);
        pushWaterFringeVertex(builder, worldX, worldY, height, laneConfig.alpha, laneConfig.lane, segmentSeed);
    }

    function appendWaterShorelineRibbonQuad(builder, context, surfaceY, p0, p1, n0, n1, innerLane, outerLane, segmentSeed) {
        pushWaterShorelineRibbonVertex(builder, context, surfaceY, p0, n0, innerLane, segmentSeed);
        pushWaterShorelineRibbonVertex(builder, context, surfaceY, p1, n1, outerLane, segmentSeed);
        pushWaterShorelineRibbonVertex(builder, context, surfaceY, p1, n1, innerLane, segmentSeed);
        pushWaterShorelineRibbonVertex(builder, context, surfaceY, p0, n0, innerLane, segmentSeed);
        pushWaterShorelineRibbonVertex(builder, context, surfaceY, p0, n0, outerLane, segmentSeed);
        pushWaterShorelineRibbonVertex(builder, context, surfaceY, p1, n1, outerLane, segmentSeed);
    }

    function isContourSegmentOwnedByChunk(p0, p1, chunkBounds) {
        const midX = (p0.x + p1.x) * 0.5;
        const midY = (p0.y + p1.y) * 0.5;
        return midX >= chunkBounds.startX
            && midX < chunkBounds.endX
            && midY >= chunkBounds.startY
            && midY < chunkBounds.endY;
    }

    function getSmoothWaterSurfaceOwnerPoint(body) {
        if (!body || !body.shape || !body.bounds) return null;
        if (body.shape.kind === 'ellipse') {
            return { x: body.shape.cx, y: body.shape.cy };
        }
        return {
            x: (body.bounds.xMin + body.bounds.xMax) * 0.5,
            y: (body.bounds.yMin + body.bounds.yMax) * 0.5
        };
    }

    function isSmoothWaterSurfaceOwnerChunk(body, chunkBounds) {
        const center = getSmoothWaterSurfaceOwnerPoint(body);
        if (!center) return false;
        return center.x >= chunkBounds.startX
            && center.x < chunkBounds.endX
            && center.y >= chunkBounds.startY
            && center.y < chunkBounds.endY;
    }

    function pushSmoothWaterSurfaceVertex(builder, context, point, surfaceY, depthFallback, shoreStrength) {
        builder.smoothSurfacePositions.push(point.x, surfaceY, point.y);
        const sampledDepth = getWaterDepthWeightAtPoint(Object.assign({}, context, {
            worldX: point.x,
            worldY: point.y,
            z: builder.z
        }));
        builder.smoothSurfaceData.push(
            Number.isFinite(sampledDepth) ? Math.max(depthFallback, sampledDepth) : depthFallback,
            clampValue(shoreStrength, 0, 1)
        );
    }

    function appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, a, b, c, aData, bData, cData) {
        pushSmoothWaterSurfaceVertex(builder, context, a, surfaceY, aData.depth, aData.shore);
        pushSmoothWaterSurfaceVertex(builder, context, b, surfaceY, bData.depth, bData.shore);
        pushSmoothWaterSurfaceVertex(builder, context, c, surfaceY, cData.depth, cData.shore);
    }

    function appendSmoothWaterSurfaceOverlayToBuilder(builder, context, chunkBounds) {
        if (!builder || !builder.body || !usesSmoothWaterSurfaceOverlay(builder.body, context.MAP_SIZE)) return;
        if (builder.smoothSurfaceAppended || !isSmoothWaterSurfaceOwnerChunk(builder.body, chunkBounds)) return;
        const contour = getSmoothWaterShorelineContour(context, builder.body);
        const points = contour.points || [];
        const normals = contour.normals || [];
        if (points.length < 3 || normals.length !== points.length) return;
        const center = getSmoothWaterSurfaceOwnerPoint(builder.body);
        if (!center) return;
        const zOffset = Number.isFinite(chunkBounds.zOffset) ? chunkBounds.zOffset : builder.z * 3.0;
        const surfaceY = getSmoothWaterVisualSurfaceY(builder.body, zOffset);
        const centerData = { depth: 0.96, shore: 0.02 };
        const innerData = { depth: 0.72, shore: 0.22 };
        const edgeData = { depth: 0.42, shore: 0.82 };
        const overhangData = { depth: 0.34, shore: 0.98 };
        for (let i = 0; i < points.length; i++) {
            const p0 = points[i];
            const p1 = points[(i + 1) % points.length];
            const n0 = normals[i];
            const n1 = normals[(i + 1) % points.length];
            const inner0 = {
                x: lerpValue(center.x, p0.x, 0.58),
                y: lerpValue(center.y, p0.y, 0.58)
            };
            const inner1 = {
                x: lerpValue(center.x, p1.x, 0.58),
                y: lerpValue(center.y, p1.y, 0.58)
            };
            const outer0 = {
                x: p0.x + (n0.x * WATER_SMOOTH_SURFACE_EDGE_OVERLAP),
                y: p0.y + (n0.y * WATER_SMOOTH_SURFACE_EDGE_OVERLAP)
            };
            const outer1 = {
                x: p1.x + (n1.x * WATER_SMOOTH_SURFACE_EDGE_OVERLAP),
                y: p1.y + (n1.y * WATER_SMOOTH_SURFACE_EDGE_OVERLAP)
            };
            appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, center, inner1, inner0, centerData, innerData, innerData);
            appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, inner0, inner1, p1, innerData, innerData, edgeData);
            appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, inner0, p1, p0, innerData, edgeData, edgeData);
            appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, p0, p1, outer1, edgeData, edgeData, overhangData);
            appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, p0, outer1, outer0, edgeData, overhangData, overhangData);
        }
        builder.smoothSurfaceAppended = true;
    }

    function appendWaterBodyShorelineRibbonToBuilder(builder, context, chunkBounds) {
        if (!builder || !builder.body || !usesSmoothWaterShorelineRibbon(builder.body, context.MAP_SIZE)) return;
        if (builder.shorelineRibbonAppended) return;
        const contour = getSmoothWaterShorelineContour(context, builder.body);
        const points = contour.points || [];
        const normals = contour.normals || [];
        if (points.length < 3 || normals.length !== points.length) return;
        const zOffset = Number.isFinite(chunkBounds.zOffset) ? chunkBounds.zOffset : builder.z * 3.0;
        const surfaceY = builder.usesSmoothSurfaceOverlay
            ? getSmoothWaterVisualSurfaceY(builder.body, zOffset)
            : zOffset + (Number.isFinite(builder.body.surfaceY) ? builder.body.surfaceY : -0.075);
        const shoreline = builder.body.shoreline || {};
        const innerWidth = Math.max(WATER_SHORELINE_INNER_WIDTH, Number.isFinite(shoreline.width) ? shoreline.width * 1.12 : 0);
        const outerWidth = Math.max(WATER_SHORELINE_OUTER_WIDTH, Number.isFinite(shoreline.width) ? shoreline.width * 0.96 : 0);
        const featherWidth = Math.max(WATER_SHORELINE_FEATHER_WIDTH, Number.isFinite(shoreline.foamWidth) ? shoreline.foamWidth * 1.15 : 0);
        const lanes = [
            { offset: -innerWidth, lane: 0.0, alpha: 0.22 },
            { offset: -featherWidth * 0.58, lane: 0.34, alpha: 0.62 },
            { offset: featherWidth * 0.18, lane: 0.62, alpha: 0.74 },
            { offset: outerWidth, lane: 1.0, alpha: 0.0 }
        ];
        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const p0 = points[i];
            const p1 = points[nextIndex];
            if (!isContourSegmentOwnedByChunk(p0, p1, chunkBounds)) continue;
            const n0 = normals[i];
            const n1 = normals[nextIndex];
            const segmentSeed = hash01((p0.x + p1.x) * 0.37, (p0.y + p1.y) * 0.37, i * 0.19);
            appendWaterShorelineRibbonQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[0], lanes[1], segmentSeed);
            appendWaterShorelineRibbonQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[1], lanes[2], segmentSeed);
            appendWaterShorelineRibbonQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[2], lanes[3], segmentSeed);
        }
        builder.shorelineRibbonAppended = true;
    }

    function offsetContourPoint(point, normal, offset) {
        return {
            x: point.x + (normal.x * offset),
            y: point.y + (normal.y * offset)
        };
    }

    function appendIslandCoastlineSurfaceQuad(builder, context, surfaceY, p0, p1, n0, n1, innerLane, outerLane) {
        const a0 = offsetContourPoint(p0, n0, innerLane.offset);
        const a1 = offsetContourPoint(p1, n1, innerLane.offset);
        const b0 = offsetContourPoint(p0, n0, outerLane.offset);
        const b1 = offsetContourPoint(p1, n1, outerLane.offset);
        appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, a0, b1, a1, innerLane, outerLane, innerLane);
        appendSmoothWaterSurfaceTriangle(builder, context, surfaceY, a0, b0, b1, innerLane, outerLane, outerLane);
    }

    function appendIslandCoastlineWaterSurfaceToBuilder(builder, context, chunkBounds) {
        if (!builder || !builder.body || builder.islandCoastlineAppended) return;
        const contour = getSmoothWaterShorelineContour(context, builder.body);
        const points = contour.points || [];
        const normals = contour.normals || [];
        if (points.length < 3 || normals.length !== points.length) return;
        const zOffset = Number.isFinite(chunkBounds.zOffset) ? chunkBounds.zOffset : builder.z * 3.0;
        const surfaceY = zOffset + (Number.isFinite(builder.body.surfaceY) ? builder.body.surfaceY : -0.075) + ISLAND_COASTLINE_SURFACE_LIFT;
        const outerWidth = getIslandCoastlineSurfaceOuterWidth(context);
        const lanes = [
            { offset: ISLAND_COASTLINE_SURFACE_INNER_OVERLAP, depth: 0.34, shore: 0.98 },
            { offset: -0.08, depth: 0.36, shore: 0.92 },
            { offset: 0.56, depth: 0.38, shore: 0.82 },
            { offset: outerWidth * 0.56, depth: 0.52, shore: 0.42 },
            { offset: outerWidth, depth: 0.68, shore: 0.12 }
        ];
        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const p0 = points[i];
            const p1 = points[nextIndex];
            if (!isContourSegmentOwnedByChunk(p0, p1, chunkBounds)) continue;
            const n0 = normals[i];
            const n1 = normals[nextIndex];
            appendIslandCoastlineSurfaceQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[0], lanes[1]);
            appendIslandCoastlineSurfaceQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[1], lanes[2]);
            appendIslandCoastlineSurfaceQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[2], lanes[3]);
            appendIslandCoastlineSurfaceQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[3], lanes[4]);
        }
    }

    function appendIslandCoastlineRibbonToBuilder(builder, context, chunkBounds) {
        if (!builder || !builder.body || builder.islandCoastlineAppended) return;
        const contour = getSmoothWaterShorelineContour(context, builder.body);
        const points = contour.points || [];
        const normals = contour.normals || [];
        if (points.length < 3 || normals.length !== points.length) return;
        const zOffset = Number.isFinite(chunkBounds.zOffset) ? chunkBounds.zOffset : builder.z * 3.0;
        const surfaceY = zOffset + (Number.isFinite(builder.body.surfaceY) ? builder.body.surfaceY : -0.075) + ISLAND_COASTLINE_SURFACE_LIFT;
        const waterWidth = Math.max(
            ISLAND_COASTLINE_RIBBON_WATER_WIDTH,
            Number.isFinite(builder.body.shoreline && builder.body.shoreline.width) ? builder.body.shoreline.width * 0.72 : 0
        );
        const bankWidth = Math.max(ISLAND_COASTLINE_RIBBON_BANK_WIDTH, waterWidth * 0.55);
        const lanes = [
            { offset: waterWidth, lane: 0.0, alpha: 0.68 },
            { offset: 0.28, lane: 0.34, alpha: 0.95 },
            { offset: -0.18, lane: 0.62, alpha: 0.56 },
            { offset: -bankWidth, lane: 1.0, alpha: 0.0 }
        ];
        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const p0 = points[i];
            const p1 = points[nextIndex];
            if (!isContourSegmentOwnedByChunk(p0, p1, chunkBounds)) continue;
            const n0 = normals[i];
            const n1 = normals[nextIndex];
            const segmentSeed = hash01((p0.x + p1.x) * 0.21, (p0.y + p1.y) * 0.21, i * 0.31);
            appendWaterShorelineRibbonQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[0], lanes[1], segmentSeed);
            appendWaterShorelineRibbonQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[1], lanes[2], segmentSeed);
            appendWaterShorelineRibbonQuad(builder, context, surfaceY, p0, p1, n0, n1, lanes[2], lanes[3], segmentSeed);
        }
    }

    function appendIslandCoastlineVisualsForChunk(options = {}, builders = {}) {
        const z = options.z;
        if (z !== 0) return;
        const oceanBody = findFullMapOceanWaterBody(options.waterBodies, options.MAP_SIZE);
        if (!usesIslandCoastlineRibbon(oceanBody, options)) return;
        const coastlineBody = createIslandCoastlineWaterBody(options, oceanBody);
        if (!coastlineBody) return;
        const chunkBounds = {
            startX: options.startX,
            startY: options.startY,
            endX: options.endX,
            endY: options.endY,
            zOffset: Number.isFinite(options.zOffset) ? options.zOffset : 0
        };
        let builder = builders[coastlineBody.id];
        const createdForCoastlineOnly = !builder;
        if (!builder) {
            builder = createChunkWaterBuilder(coastlineBody, z);
            builders[coastlineBody.id] = builder;
        }
        builder.usesIslandCoastlineRibbon = true;
        const beforeSurfaceCount = builder.smoothSurfacePositions.length;
        const beforeFringeCount = builder.fringePositions.length;
        appendIslandCoastlineWaterSurfaceToBuilder(builder, options, chunkBounds);
        appendIslandCoastlineRibbonToBuilder(builder, options, chunkBounds);
        builder.islandCoastlineAppended = true;
        if (
            createdForCoastlineOnly
            && builder.surfacePositions.length <= 0
            && builder.smoothSurfacePositions.length === beforeSurfaceCount
            && builder.fringePositions.length === beforeFringeCount
        ) {
            delete builders[coastlineBody.id];
        }
    }

    function appendWaterTileToBuilder(builder, context, x, y, surfaceY) {
        const waterBodies = Array.isArray(context.sharedMaterials && context.sharedMaterials.activeWaterRenderBodies)
            ? context.sharedMaterials.activeWaterRenderBodies
            : [];
        const pierConfig = context.activePierConfig !== undefined ? context.activePierConfig : context.getActivePierConfig();
        const isPierCoveredTile = context.isPierVisualCoverageTile(pierConfig, x, y, builder.z);
        appendWaterSeamBackfillQuad(builder, x, y, surfaceY);
        const edges = {
            north: classifyWaterEdgeTypeAtTile(context, waterBodies, x, y, 0, -1, builder.z, surfaceY),
            east: classifyWaterEdgeTypeAtTile(context, waterBodies, x, y, 1, 0, builder.z, surfaceY),
            south: classifyWaterEdgeTypeAtTile(context, waterBodies, x, y, 0, 1, builder.z, surfaceY),
            west: classifyWaterEdgeTypeAtTile(context, waterBodies, x, y, -1, 0, builder.z, surfaceY)
        };
        const subdivisions = (edges.north || edges.east || edges.south || edges.west) ? WATER_EDGE_SUBDIVISIONS : 1;
        const cellSize = 1 / subdivisions;
        for (let row = 0; row < subdivisions; row++) {
            for (let column = 0; column < subdivisions; column++) {
                const x0 = column * cellSize;
                const y0 = row * cellSize;
                const x1 = x0 + cellSize;
                const y1 = y0 + cellSize;
                const nw = getWaterEdgeVertex(x, y, x0, y0, surfaceY, edges, isPierCoveredTile);
                const ne = getWaterEdgeVertex(x, y, x1, y0, surfaceY, edges, isPierCoveredTile);
                const se = getWaterEdgeVertex(x, y, x1, y1, surfaceY, edges, isPierCoveredTile);
                const sw = getWaterEdgeVertex(x, y, x0, y1, surfaceY, edges, isPierCoveredTile);
                pushWaterCellVertex(builder, context, nw);
                pushWaterCellVertex(builder, context, se);
                pushWaterCellVertex(builder, context, ne);
                pushWaterCellVertex(builder, context, nw);
                pushWaterCellVertex(builder, context, sw);
                pushWaterCellVertex(builder, context, se);
            }
        }
        if (builder.usesSmoothShorelineRibbon) return;
        if (builder.usesIslandCoastlineRibbon) return;
        appendWaterFringeForEdge(builder, x, y, surfaceY, 'north', edges.north, isPierCoveredTile);
        appendWaterFringeForEdge(builder, x, y, surfaceY, 'east', edges.east, isPierCoveredTile);
        appendWaterFringeForEdge(builder, x, y, surfaceY, 'south', edges.south, isPierCoveredTile);
        appendWaterFringeForEdge(builder, x, y, surfaceY, 'west', edges.west, isPierCoveredTile);
    }

    function appendChunkWaterTilesToBuilders(options = {}) {
        const builders = options.builders || {};
        const bodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const z = options.z;
        const zOffset = Number.isFinite(options.zOffset) ? options.zOffset : 0;
        if (z !== 0) return;
        const activePierConfig = typeof options.getActivePierConfig === 'function'
            ? options.getActivePierConfig()
            : null;
        const context = Object.assign({}, options, {
            activePierConfig,
            islandCoastlineWaterTileCache: Object.create(null),
            getActivePierConfig: () => activePierConfig
        });
        for (let y = context.startY; y < context.endY; y++) {
            for (let x = context.startX; x < context.endX; x++) {
                const visualBody = resolveVisualWaterRenderBodyAtTile(context, bodies, x, y, z);
                if (!visualBody) continue;
                const islandCoastlineBody = usesIslandCoastlineRibbon(visualBody, context);
                const useCoastInteractionOnly = islandCoastlineBody && isIslandCoastlineWaterTileCached(context, x, y);
                const builderBody = useCoastInteractionOnly
                    ? createIslandCoastlineInteractionBody(visualBody)
                    : visualBody;
                if (!builders[builderBody.id]) {
                    builders[builderBody.id] = createChunkWaterBuilder(builderBody, z);
                }
                builders[builderBody.id].usesSmoothShorelineRibbon = usesSmoothWaterShorelineRibbon(visualBody, context.MAP_SIZE);
                builders[builderBody.id].usesSmoothSurfaceOverlay = usesSmoothWaterSurfaceOverlay(visualBody, context.MAP_SIZE);
                builders[builderBody.id].usesIslandCoastlineRibbon = islandCoastlineBody;
                builders[builderBody.id].forceInteractionOnly = !!useCoastInteractionOnly;
                const surfaceY = zOffset + (Number.isFinite(visualBody.surfaceY) ? visualBody.surfaceY : -0.075);
                if (isInteriorFullMapOceanTile(context, visualBody, x, y, z, useCoastInteractionOnly)) {
                    appendFlatWaterRunTile(builders[builderBody.id], y, x, surfaceY);
                    continue;
                }
                appendWaterTileToBuilder(builders[builderBody.id], context, x, y, surfaceY);
            }
        }
        appendSmoothWaterShorelineRibbonsForChunk(Object.assign({}, context, { zOffset }), builders);
    }

    function appendSmoothWaterShorelineRibbonsForChunk(options = {}, builders = {}) {
        const bodies = Array.isArray(options.waterBodies) ? options.waterBodies : [];
        const z = options.z;
        if (z !== 0) return;
        const chunkBounds = {
            startX: options.startX,
            startY: options.startY,
            endX: options.endX,
            endY: options.endY,
            zOffset: Number.isFinite(options.zOffset) ? options.zOffset : 0
        };
        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];
            if (!usesSmoothWaterShorelineRibbon(body, options.MAP_SIZE)) continue;
            let builder = builders[body.id];
            const createdForRibbonOnly = !builder;
            if (!builder) {
                builder = createChunkWaterBuilder(body, z);
                builders[body.id] = builder;
            }
            builder.usesSmoothShorelineRibbon = true;
            builder.usesSmoothSurfaceOverlay = usesSmoothWaterSurfaceOverlay(body, options.MAP_SIZE);
            const beforeFringeCount = builder.fringePositions.length;
            appendSmoothWaterSurfaceOverlayToBuilder(builder, options, chunkBounds);
            appendWaterBodyShorelineRibbonToBuilder(builder, options, chunkBounds);
            if (
                createdForRibbonOnly
                && builder.surfacePositions.length <= 0
                && builder.smoothSurfacePositions.length <= 0
                && builder.fringePositions.length === beforeFringeCount
            ) {
                delete builders[body.id];
            }
        }
        appendIslandCoastlineVisualsForChunk(options, builders);
    }

    function flushChunkWaterBuilders(options = {}) {
        const THREE = requireThree(options.THREE);
        const planeGroup = options.planeGroup;
        const builders = options.builders || {};
        const environmentMeshes = Array.isArray(options.environmentMeshes) ? options.environmentMeshes : null;
        const getWaterSurfaceMaterial = typeof options.getWaterSurfaceMaterial === 'function'
            ? options.getWaterSurfaceMaterial
            : () => null;
        const getWaterFringeMaterial = typeof options.getWaterFringeMaterial === 'function'
            ? options.getWaterFringeMaterial
            : () => null;
        Object.keys(builders).forEach((bodyId) => {
            const builder = builders[bodyId];
            if (!builder) return;
            appendFlatWaterSurfaceRuns(builder, options);
            appendWaterSeamBackfillRuns(builder);

            if (builder.seamBackfillPositions.length > 0) {
                const backfillGeometry = new THREE.BufferGeometry();
                backfillGeometry.setAttribute('position', new THREE.Float32BufferAttribute(builder.seamBackfillPositions, 3));
                backfillGeometry.setAttribute('waterData', new THREE.Float32BufferAttribute(builder.seamBackfillData, 2));
                backfillGeometry.computeBoundingSphere();
                const backfillMesh = new THREE.Mesh(backfillGeometry, getWaterSurfaceMaterial(builder.body.styleTokens));
                backfillMesh.userData = { type: 'WATER_VISUAL_BACKFILL', z: builder.z, waterBodyId: builder.body.id };
                backfillMesh.receiveShadow = false;
                backfillMesh.castShadow = false;
                backfillMesh.renderOrder = 2;
                if (planeGroup) planeGroup.add(backfillMesh);
            }

            if (builder.surfacePositions.length > 0) {
                const surfaceGeometry = new THREE.BufferGeometry();
                surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(builder.surfacePositions, 3));
                surfaceGeometry.setAttribute('waterData', new THREE.Float32BufferAttribute(builder.surfaceData, 2));
                surfaceGeometry.computeBoundingSphere();
                const surfaceMaterial = builder.forceInteractionOnly || (builder.usesSmoothSurfaceOverlay && builder.smoothSurfacePositions.length > 0)
                    ? getWaterInteractionOnlyMaterial(THREE, options.sharedMaterials || {})
                    : getWaterSurfaceMaterial(builder.body.styleTokens);
                const surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
                surfaceMesh.userData = { type: 'WATER', z: builder.z, waterBodyId: builder.body.id };
                surfaceMesh.receiveShadow = false;
                surfaceMesh.castShadow = false;
                surfaceMesh.renderOrder = builder.usesSmoothSurfaceOverlay ? 2 : 3;
                if (planeGroup) planeGroup.add(surfaceMesh);
                if (environmentMeshes) environmentMeshes.push(surfaceMesh);
            }

            if (builder.smoothSurfacePositions.length > 0) {
                const smoothSurfaceGeometry = new THREE.BufferGeometry();
                smoothSurfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(builder.smoothSurfacePositions, 3));
                smoothSurfaceGeometry.setAttribute('waterData', new THREE.Float32BufferAttribute(builder.smoothSurfaceData, 2));
                smoothSurfaceGeometry.computeBoundingSphere();
                const smoothSurfaceMaterial = getWaterSurfaceMaterial(builder.body.styleTokens);
                const smoothSurfaceMesh = new THREE.Mesh(smoothSurfaceGeometry, smoothSurfaceMaterial);
                smoothSurfaceMesh.userData = { type: 'WATER_VISUAL_SURFACE', z: builder.z, waterBodyId: builder.body.id };
                smoothSurfaceMesh.receiveShadow = false;
                smoothSurfaceMesh.castShadow = false;
                smoothSurfaceMesh.renderOrder = 3;
                if (planeGroup) planeGroup.add(smoothSurfaceMesh);
            }

            if (builder.fringePositions.length > 0) {
                const fringeGeometry = new THREE.BufferGeometry();
                fringeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(builder.fringePositions, 3));
                fringeGeometry.setAttribute('waterData', new THREE.Float32BufferAttribute(builder.fringeData, 2));
                fringeGeometry.setAttribute('fringeAlpha', new THREE.Float32BufferAttribute(builder.fringeAlpha, 1));
                fringeGeometry.computeBoundingSphere();
                const fringeMesh = new THREE.Mesh(fringeGeometry, getWaterFringeMaterial(builder.body.styleTokens));
                fringeMesh.userData = { type: 'WATER_VISUAL_FRINGE', z: builder.z, waterBodyId: builder.body.id };
                fringeMesh.receiveShadow = false;
                fringeMesh.castShadow = false;
                fringeMesh.renderOrder = 4;
                if (planeGroup) planeGroup.add(fringeMesh);
            }

        });
    }

    function createWaterSurfacePatchMesh(options = {}) {
        const THREE = requireThree(options.THREE);
        const bounds = options.bounds;
        const surfaceY = options.surfaceY;
        const styleTokens = options.styleTokens;
        const depthWeight = Number.isFinite(options.depthWeight) ? options.depthWeight : 0.68;
        const shoreStrength = Number.isFinite(options.shoreStrength) ? options.shoreStrength : 0.12;
        const getWaterSurfaceMaterial = typeof options.getWaterSurfaceMaterial === 'function'
            ? options.getWaterSurfaceMaterial
            : () => null;
        if (!bounds || !styleTokens) return null;
        const xMin = Number.isFinite(bounds.xMin) ? bounds.xMin : 0;
        const xMax = Number.isFinite(bounds.xMax) ? bounds.xMax : 0;
        const yMin = Number.isFinite(bounds.yMin) ? bounds.yMin : 0;
        const yMax = Number.isFinite(bounds.yMax) ? bounds.yMax : 0;
        if ((xMax - xMin) <= 0.01 || (yMax - yMin) <= 0.01) return null;

        const positions = [];
        const waterData = [];
        const tileColumns = Math.max(1, Math.round(xMax - xMin));
        const tileRows = Math.max(1, Math.round(yMax - yMin));
        const stepX = (xMax - xMin) / tileColumns;
        const stepY = (yMax - yMin) / tileRows;

        for (let row = 0; row < tileRows; row++) {
            const cellYMin = yMin + (row * stepY);
            const cellYMax = cellYMin + stepY;
            for (let column = 0; column < tileColumns; column++) {
                const cellXMin = xMin + (column * stepX);
                const cellXMax = cellXMin + stepX;
                positions.push(
                    cellXMin, surfaceY, cellYMin,
                    cellXMax, surfaceY, cellYMax,
                    cellXMax, surfaceY, cellYMin,
                    cellXMin, surfaceY, cellYMin,
                    cellXMin, surfaceY, cellYMax,
                    cellXMax, surfaceY, cellYMax
                );
                for (let i = 0; i < 6; i++) {
                    waterData.push(depthWeight, shoreStrength);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('waterData', new THREE.Float32BufferAttribute(waterData, 2));
        geometry.computeBoundingSphere();

        const mesh = new THREE.Mesh(geometry, getWaterSurfaceMaterial(styleTokens));
        mesh.receiveShadow = false;
        mesh.castShadow = false;
        mesh.renderOrder = 3;
        return mesh;
    }

    function normalizeWaterBackdropBoundsList(bounds) {
        return Array.isArray(bounds) ? bounds : [bounds];
    }

    function createWaterBackdropMesh(options = {}) {
        const THREE = requireThree(options.THREE);
        const boundsList = normalizeWaterBackdropBoundsList(options.bounds);
        const surfaceY = options.surfaceY;
        const styleTokens = options.styleTokens;
        if (!styleTokens || boundsList.length <= 0) return null;

        const positions = [];
        for (let i = 0; i < boundsList.length; i++) {
            const bounds = boundsList[i];
            if (!bounds) continue;
            const xMin = Number.isFinite(bounds.xMin) ? bounds.xMin : 0;
            const xMax = Number.isFinite(bounds.xMax) ? bounds.xMax : 0;
            const yMin = Number.isFinite(bounds.yMin) ? bounds.yMin : 0;
            const yMax = Number.isFinite(bounds.yMax) ? bounds.yMax : 0;
            if ((xMax - xMin) <= 0.01 || (yMax - yMin) <= 0.01) continue;
            positions.push(
                xMin, surfaceY, yMin,
                xMax, surfaceY, yMax,
                xMax, surfaceY, yMin,
                xMin, surfaceY, yMin,
                xMin, surfaceY, yMax,
                xMax, surfaceY, yMax
            );
        }
        if (positions.length <= 0) return null;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: Number.isFinite(styleTokens.deepColor) ? styleTokens.deepColor : 0x3f748d,
            depthTest: true,
            depthWrite: true,
            side: THREE.DoubleSide
        }));
        mesh.receiveShadow = false;
        mesh.castShadow = false;
        mesh.frustumCulled = false;
        mesh.renderOrder = -2;
        mesh.userData = { disposeMaterialOnRemove: true };
        return mesh;
    }

    window.WorldWaterRuntime = {
        appendChunkWaterTilesToBuilders,
        appendIslandCoastlineVisualsForChunk,
        appendSmoothWaterShorelineRibbonsForChunk,
        appendSmoothWaterSurfaceOverlayToBuilder,
        appendWaterBodyShorelineRibbonToBuilder,
        buildSmoothWaterShorelineContourPoints,
        classifyWaterEdgeType,
        createWaterBackdropMesh,
        createWaterSurfacePatchMesh,
        findNearbyWaterRenderBodyForTile,
        flushChunkWaterBuilders,
        getDefaultWaterRenderBody,
        isIslandCoastlineWaterTile,
        getWaterSurfaceHeightForTile,
        resolveVisualWaterRenderBodyForTile,
        resolveWaterRenderBodyForTile,
        usesIslandCoastlineRibbon,
        usesSmoothWaterShorelineRibbon,
        usesSmoothWaterSurfaceOverlay
    };
})();
