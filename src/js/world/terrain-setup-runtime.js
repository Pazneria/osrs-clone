(function () {
    const LEGACY_COORD_MAP_SIZE = 486;
    const MIN_ISLAND_INTERIOR_LAND_HEIGHT = -0.052;

    function getStampBounds(stampedStructures, stampMap, structureId) {
        const structures = Array.isArray(stampedStructures) ? stampedStructures : [];
        for (let i = 0; i < structures.length; i++) {
            const structure = structures[i];
            if (!structure || structure.structureId !== structureId) continue;
            const rows = stampMap && Array.isArray(stampMap[structure.stampId]) ? stampMap[structure.stampId] : [];
            const height = rows.length;
            let width = 0;
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const row = rows[rowIndex];
                if (typeof row === 'string') width = Math.max(width, row.length);
            }
            if (width <= 0 || height <= 0) continue;
            return {
                xMin: structure.x,
                xMax: structure.x + width - 1,
                yMin: structure.y,
                yMax: structure.y + height - 1
            };
        }
        return null;
    }

    function expandBounds(bounds, padX, padY, mapSize) {
        if (!bounds) return null;
        return {
            xMin: Math.max(1, bounds.xMin - padX),
            xMax: Math.min(mapSize - 2, bounds.xMax + padX),
            yMin: Math.max(1, bounds.yMin - padY),
            yMax: Math.min(mapSize - 2, bounds.yMax + padY)
        };
    }

    function createTerrainNoise() {
        return function terrainNoise(x, y) {
            const n1 = Math.sin(x * 0.045) * 0.08;
            const n2 = Math.cos(y * 0.05) * 0.07;
            const n3 = Math.sin((x + y) * 0.03) * 0.05;
            return n1 + n2 + n3;
        };
    }

    function createRiverSampler(mapSize) {
        const riverAxisScale = mapSize / LEGACY_COORD_MAP_SIZE;
        const riverFrequencyScale = LEGACY_COORD_MAP_SIZE / Math.max(1, mapSize);
        return {
            riverAxisScale,
            sampleRiverAtY(y) {
                const eastCenterBase = 298 * riverAxisScale;
                const southCurveT = Math.max(0, (y - (296 * riverAxisScale)) / Math.max(1, 98 * riverAxisScale));
                const westBend = Math.pow(Math.min(1, southCurveT), 1.35) * (86 * riverAxisScale);
                return {
                    centerX: eastCenterBase
                        + (Math.sin(y * 0.018 * riverFrequencyScale) * (8 * riverAxisScale))
                        + (Math.sin(y * 0.007 * riverFrequencyScale) * (5 * riverAxisScale))
                        - westBend,
                    halfWidth: Math.max(
                        2.4,
                        (6.2 * riverAxisScale) + (Math.sin(y * 0.045 * riverFrequencyScale) * (1.8 * riverAxisScale))
                    )
                };
            }
        };
    }

    function pointInBounds(bounds, x, y) {
        return !!bounds && x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax;
    }

    function createTownBounds(options = {}) {
        const mapSize = options.mapSize;
        const stampedStructures = options.stampedStructures;
        const stampMap = options.stampMap;
        const resolveStampBounds = (structureId) => getStampBounds(stampedStructures, stampMap, structureId);
        const castleBounds = resolveStampBounds('castle_ground') || { xMin: 190, xMax: 220, yMin: 190, yMax: 215 };
        const generalStoreBounds = resolveStampBounds('general_store') || { xMin: 177, xMax: 185, yMin: 232, yMax: 240 };
        const smithingHallBounds = resolveStampBounds('smithing_hall') || { xMin: 221, xMax: 229, yMin: 228, yMax: 240 };
        const townCoreBounds = [
            expandBounds(castleBounds, 0, 0, mapSize),
            expandBounds(generalStoreBounds, 0, 0, mapSize),
            expandBounds(smithingHallBounds, 4, 4, mapSize)
        ].filter(Boolean);
        const townSquareBounds = expandBounds(castleBounds, 10, 10, mapSize);
        const inTownCore = (x, y) => {
            for (let i = 0; i < townCoreBounds.length; i++) {
                if (pointInBounds(townCoreBounds[i], x, y)) return true;
            }
            return false;
        };
        return {
            castleBounds,
            generalStoreBounds,
            getStampBounds: resolveStampBounds,
            inTownCore,
            smithingHallBounds,
            townCoreBounds,
            townSquareBounds
        };
    }

    function applyEllipseWater(options = {}) {
        const ellipse = options.ellipse;
        const mapSize = options.mapSize;
        const carveWaterTile = options.carveWaterTile;
        if (!ellipse || typeof carveWaterTile !== 'function') return;
        const rotation = Number.isFinite(ellipse.rotationRadians) ? Number(ellipse.rotationRadians) : 0;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const halfWidth = Math.abs(rotation) <= 0.000001
            ? ellipse.rx
            : Math.sqrt((ellipse.rx * cos) ** 2 + (ellipse.ry * sin) ** 2);
        const halfHeight = Math.abs(rotation) <= 0.000001
            ? ellipse.ry
            : Math.sqrt((ellipse.rx * sin) ** 2 + (ellipse.ry * cos) ** 2);
        for (let y = Math.max(1, Math.floor(ellipse.cy - halfHeight - 1)); y <= Math.min(mapSize - 2, Math.ceil(ellipse.cy + halfHeight + 1)); y++) {
            for (let x = Math.max(1, Math.floor(ellipse.cx - halfWidth - 1)); x <= Math.min(mapSize - 2, Math.ceil(ellipse.cx + halfWidth + 1)); x++) {
                const dx = x - ellipse.cx;
                const dy = y - ellipse.cy;
                const localX = (dx * cos) + (dy * sin);
                const localY = (-dx * sin) + (dy * cos);
                const nx = localX / ellipse.rx;
                const ny = localY / ellipse.ry;
                const d = Math.sqrt(nx * nx + ny * ny);
                if (d <= 1.0) carveWaterTile(x, y, 1.0 - d);
            }
        }
    }

    function pointInPolygon(points, x, y) {
        if (!Array.isArray(points) || points.length < 3) return false;
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const a = points[i];
            const b = points[j];
            if (!a || !b) continue;
            const dy = b.y - a.y;
            if (Math.abs(dy) < 0.0001) continue;
            const intersects = ((a.y > y) !== (b.y > y))
                && (x < ((b.x - a.x) * (y - a.y)) / dy + a.x);
            if (intersects) inside = !inside;
        }
        return inside;
    }

    function pointToSegmentDistance(px, py, ax, ay, bx, by) {
        const vx = bx - ax;
        const vy = by - ay;
        const lenSq = vx * vx + vy * vy;
        if (lenSq <= 0.0001) return Math.hypot(px - ax, py - ay);
        const t = Math.max(0, Math.min(1, (((px - ax) * vx) + ((py - ay) * vy)) / lenSq));
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

    function isWaterTileId(tileIds, tile) {
        return tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP;
    }

    function isNaturalTerrainTileId(tileIds, tile) {
        return tile === tileIds.GRASS
            || tile === tileIds.DIRT
            || tile === tileIds.SAND
            || tile === tileIds.SHORE
            || tile === tileIds.STUMP;
    }

    function resolveTerrainTileId(tileIds, tileKey, fallbackTileId = null) {
        const key = typeof tileKey === 'string' ? tileKey.trim() : '';
        if (key && Number.isFinite(tileIds[key])) return tileIds[key];
        return Number.isFinite(fallbackTileId) ? fallbackTileId : null;
    }

    function resolvePathTileId(tileIds, pathPatch) {
        return resolveTerrainTileId(tileIds, pathPatch.tileId, tileIds.DIRT);
    }

    function distanceToPath(points, x, y) {
        if (!Array.isArray(points) || points.length === 0) return Infinity;
        if (points.length === 1 && points[0]) return Math.hypot(x - points[0].x, y - points[0].y);
        let best = Infinity;
        for (let i = 1; i < points.length; i++) {
            const from = points[i - 1];
            const to = points[i];
            if (!from || !to) continue;
            best = Math.min(best, pointToSegmentDistance(x, y, from.x, from.y, to.x, to.y));
        }
        return best;
    }

    function getPathBounds(points, padding, mapSize) {
        let xMin = Infinity;
        let xMax = -Infinity;
        let yMin = Infinity;
        let yMax = -Infinity;
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
            xMin = Math.min(xMin, point.x);
            xMax = Math.max(xMax, point.x);
            yMin = Math.min(yMin, point.y);
            yMax = Math.max(yMax, point.y);
        }
        if (!Number.isFinite(xMin)) return null;
        return {
            xMin: Math.max(1, Math.floor(xMin - padding)),
            xMax: Math.min(mapSize - 2, Math.ceil(xMax + padding)),
            yMin: Math.max(1, Math.floor(yMin - padding)),
            yMax: Math.min(mapSize - 2, Math.ceil(yMax + padding))
        };
    }

    function getEllipseBounds(ellipse, padding, mapSize) {
        if (!ellipse || !Number.isFinite(ellipse.cx) || !Number.isFinite(ellipse.cy) || !Number.isFinite(ellipse.rx) || !Number.isFinite(ellipse.ry)) return null;
        const rx = Math.max(0.5, Math.abs(Number(ellipse.rx)));
        const ry = Math.max(0.5, Math.abs(Number(ellipse.ry)));
        const rotation = Number.isFinite(ellipse.rotationRadians) ? Number(ellipse.rotationRadians) : 0;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const halfWidth = Math.abs(rotation) <= 0.000001
            ? rx
            : Math.sqrt((rx * cos) ** 2 + (ry * sin) ** 2);
        const halfHeight = Math.abs(rotation) <= 0.000001
            ? ry
            : Math.sqrt((rx * sin) ** 2 + (ry * cos) ** 2);
        return {
            xMin: Math.max(1, Math.floor(ellipse.cx - halfWidth - padding)),
            xMax: Math.min(mapSize - 2, Math.ceil(ellipse.cx + halfWidth + padding)),
            yMin: Math.max(1, Math.floor(ellipse.cy - halfHeight - padding)),
            yMax: Math.min(mapSize - 2, Math.ceil(ellipse.cy + halfHeight + padding))
        };
    }

    function getEllipseStrength(ellipse, x, y, edgeSoftness) {
        const rx = Math.max(0.5, Math.abs(Number(ellipse.rx)));
        const ry = Math.max(0.5, Math.abs(Number(ellipse.ry)));
        const rotation = Number.isFinite(ellipse.rotationRadians) ? Number(ellipse.rotationRadians) : 0;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const dx = x - ellipse.cx;
        const dy = y - ellipse.cy;
        const localX = (dx * cos) + (dy * sin);
        const localY = (-dx * sin) + (dy * cos);
        const nx = localX / rx;
        const ny = localY / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d <= 1) return 1;
        if (edgeSoftness <= 0) return 0;
        const edgeDistance = (d - 1) * Math.min(rx, ry);
        return Math.max(0, Math.min(1, 1 - (edgeDistance / edgeSoftness)));
    }

    function blendLandformHeight(currentHeight, targetHeight, strength, mode) {
        const blend = Math.max(0, Math.min(1, strength));
        const blended = (currentHeight * (1 - blend)) + (targetHeight * blend);
        if (mode === 'raise') return Math.max(currentHeight, blended);
        if (mode === 'lower') return Math.min(currentHeight, blended);
        return blended;
    }

    function applyLandformSample(options = {}) {
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const tileIds = options.tileIds || {};
        const x = options.x;
        const y = options.y;
        const z = options.z;
        const strength = Number.isFinite(options.strength) ? Number(options.strength) : 0;
        if (strength <= 0.04 || !logicalMap[z] || !logicalMap[z][y] || !heightMap[z] || !heightMap[z][y]) return;
        if (options.protectTownCore && typeof options.inTownCore === 'function' && options.inTownCore(x, y)) return;
        const tile = logicalMap[z][y][x];
        if (isWaterTileId(tileIds, tile) || !isNaturalTerrainTileId(tileIds, tile)) return;
        if (Number.isFinite(options.tileId) && strength >= 0.16) {
            logicalMap[z][y][x] = options.tileId;
        }
        const currentHeight = Number.isFinite(heightMap[z][y][x]) ? heightMap[z][y][x] : 0;
        heightMap[z][y][x] = blendLandformHeight(currentHeight, options.targetHeight, strength, options.mode);
    }

    function applyTerrainLandformPatches(options = {}) {
        const landformPatches = Array.isArray(options.landformPatches) ? options.landformPatches : [];
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const mapSize = options.mapSize;
        const tileIds = options.tileIds || {};
        const inTownCore = typeof options.inTownCore === 'function' ? options.inTownCore : null;
        const protectTownCore = options.protectTownCore !== false;
        if (!logicalMap || !heightMap || !Number.isFinite(mapSize)) return;

        for (let landformIndex = 0; landformIndex < landformPatches.length; landformIndex++) {
            const landformPatch = landformPatches[landformIndex];
            if (!landformPatch || !Number.isFinite(landformPatch.height)) continue;
            const z = Number.isInteger(landformPatch.z) ? landformPatch.z : 0;
            if (!logicalMap[z] || !heightMap[z]) continue;
            const targetHeight = Number(landformPatch.height);
            const mode = landformPatch.mode === 'raise' || landformPatch.mode === 'lower' ? landformPatch.mode : 'set';
            const landformTileId = resolveTerrainTileId(tileIds, landformPatch.tileId, null);
            const edgeSoftness = Number.isFinite(landformPatch.edgeSoftness)
                ? Math.max(0, Number(landformPatch.edgeSoftness))
                : 3.0;

            if (landformPatch.kind === 'ellipse') {
                const bounds = getEllipseBounds(landformPatch, edgeSoftness + 1, mapSize);
                if (!bounds) continue;
                for (let y = bounds.yMin; y <= bounds.yMax; y++) {
                    if (!logicalMap[z][y] || !heightMap[z][y]) continue;
                    for (let x = bounds.xMin; x <= bounds.xMax; x++) {
                        applyLandformSample({
                            heightMap,
                            inTownCore,
                            logicalMap,
                            mode,
                            protectTownCore,
                            strength: getEllipseStrength(landformPatch, x + 0.5, y + 0.5, edgeSoftness),
                            targetHeight,
                            tileId: landformTileId,
                            tileIds,
                            x,
                            y,
                            z
                        });
                    }
                }
                continue;
            }

            if (landformPatch.kind === 'path') {
                const points = Array.isArray(landformPatch.points) ? landformPatch.points : [];
                const pathWidth = Number.isFinite(landformPatch.pathWidth) ? Math.max(0.5, Number(landformPatch.pathWidth)) : 6.0;
                const halfWidth = pathWidth / 2;
                const pathEdgeSoftness = Number.isFinite(landformPatch.edgeSoftness)
                    ? Math.max(0, Number(landformPatch.edgeSoftness))
                    : Math.max(1.0, halfWidth * 0.65);
                const bounds = getPathBounds(points, halfWidth + pathEdgeSoftness + 1, mapSize);
                if (!bounds) continue;
                for (let y = bounds.yMin; y <= bounds.yMax; y++) {
                    if (!logicalMap[z][y] || !heightMap[z][y]) continue;
                    for (let x = bounds.xMin; x <= bounds.xMax; x++) {
                        const dist = distanceToPath(points, x + 0.5, y + 0.5);
                        if (dist > halfWidth + pathEdgeSoftness) continue;
                        const edgeT = pathEdgeSoftness <= 0 ? 1 : Math.max(0, Math.min(1, 1 - ((dist - halfWidth) / pathEdgeSoftness)));
                        applyLandformSample({
                            heightMap,
                            inTownCore,
                            logicalMap,
                            mode,
                            protectTownCore,
                            strength: dist <= halfWidth ? 1 : edgeT,
                            targetHeight,
                            tileId: landformTileId,
                            tileIds,
                            x,
                            y,
                            z
                        });
                    }
                }
            }
        }
    }

    function applyTerrainPathPatches(options = {}) {
        const pathPatches = Array.isArray(options.pathPatches) ? options.pathPatches : [];
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const mapSize = options.mapSize;
        const tileIds = options.tileIds || {};
        if (!logicalMap || !heightMap || !Number.isFinite(mapSize)) return;

        for (let pathIndex = 0; pathIndex < pathPatches.length; pathIndex++) {
            const pathPatch = pathPatches[pathIndex];
            const points = pathPatch && Array.isArray(pathPatch.points) ? pathPatch.points : [];
            const pathWidth = Number.isFinite(pathPatch && pathPatch.pathWidth) ? Math.max(0.5, Number(pathPatch.pathWidth)) : 3.0;
            const halfWidth = pathWidth / 2;
            const edgeSoftness = Number.isFinite(pathPatch && pathPatch.edgeSoftness)
                ? Math.max(0, Number(pathPatch.edgeSoftness))
                : Math.max(0.5, halfWidth * 0.45);
            const bounds = getPathBounds(points, halfWidth + edgeSoftness + 1, mapSize);
            const z = Number.isInteger(pathPatch && pathPatch.z) ? pathPatch.z : 0;
            if (!bounds || !logicalMap[z] || !heightMap[z]) continue;

            const pathTileId = resolvePathTileId(tileIds, pathPatch);
            const targetHeight = Number.isFinite(pathPatch && pathPatch.height) ? Number(pathPatch.height) : -0.075;
            for (let y = bounds.yMin; y <= bounds.yMax; y++) {
                if (!logicalMap[z][y] || !heightMap[z][y]) continue;
                for (let x = bounds.xMin; x <= bounds.xMax; x++) {
                    const tile = logicalMap[z][y][x];
                    if (isWaterTileId(tileIds, tile)) continue;
                    if (!isNaturalTerrainTileId(tileIds, tile)) continue;
                    const dist = distanceToPath(points, x + 0.5, y + 0.5);
                    if (dist > halfWidth + edgeSoftness) continue;
                    const edgeT = edgeSoftness <= 0 ? 1 : Math.max(0, Math.min(1, 1 - ((dist - halfWidth) / edgeSoftness)));
                    const strength = dist <= halfWidth ? 1 : edgeT;
                    if (strength <= 0.05) continue;
                    logicalMap[z][y][x] = pathTileId;
                    const currentHeight = Number.isFinite(heightMap[z][y][x]) ? heightMap[z][y][x] : 0;
                    const blend = Math.max(0.35, Math.min(1, strength));
                    heightMap[z][y][x] = (currentHeight * (1 - blend)) + (targetHeight * blend);
                }
            }
        }
    }

    function isPierConfigEnabled(pierConfig) {
        return !!(
            pierConfig
            && pierConfig.enabled !== false
            && Number.isFinite(pierConfig.xMin)
            && Number.isFinite(pierConfig.xMax)
            && Number.isFinite(pierConfig.yStart)
            && Number.isFinite(pierConfig.yEnd)
            && Number.isFinite(pierConfig.entryY)
        );
    }

    function applyIslandWaterPatch(options = {}) {
        const patch = options.islandWater;
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const mapSize = options.mapSize;
        const tileIds = options.tileIds || {};
        const terrainNoise = typeof options.terrainNoise === 'function' ? options.terrainNoise : () => 0;
        if (!patch || patch.enabled === false || !patch.waterBounds || !Array.isArray(patch.landPolygon) || patch.landPolygon.length < 3) return;

        const bounds = patch.waterBounds;
        const xMin = Math.max(0, Math.floor(bounds.xMin));
        const xMax = Math.min(mapSize - 1, Math.ceil(bounds.xMax));
        const yMin = Math.max(0, Math.floor(bounds.yMin));
        const yMax = Math.min(mapSize - 1, Math.ceil(bounds.yMax));
        const shoreWidth = Number.isFinite(patch.shoreWidth) ? Math.max(0, Number(patch.shoreWidth)) : 2.2;
        const shallowDistance = Number.isFinite(patch.shallowDistance) ? Math.max(0.5, Number(patch.shallowDistance)) : 4.0;

        for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
                const px = x + 0.5;
                const py = y + 0.5;
                const insideLand = pointInPolygon(patch.landPolygon, px, py);
                const edgeDistance = distanceToPolygonEdge(patch.landPolygon, px, py);
                if (insideLand) {
                    if (edgeDistance <= shoreWidth) {
                        logicalMap[0][y][x] = tileIds.SHORE;
                        heightMap[0][y][x] = -0.01;
                    } else {
                        logicalMap[0][y][x] = tileIds.GRASS;
                        heightMap[0][y][x] = Math.max(MIN_ISLAND_INTERIOR_LAND_HEIGHT, terrainNoise(x, y));
                    }
                } else {
                    const isShallow = edgeDistance <= shallowDistance;
                    logicalMap[0][y][x] = isShallow ? tileIds.WATER_SHALLOW : tileIds.WATER_DEEP;
                    heightMap[0][y][x] = isShallow ? -0.10 : -0.18;
                }
            }
        }
    }

    function liftIslandLandAboveWaterline(options = {}) {
        const patch = options.islandWater;
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const mapSize = options.mapSize;
        const tileIds = options.tileIds || {};
        if (!patch || patch.enabled === false || !patch.waterBounds || !Array.isArray(patch.landPolygon) || patch.landPolygon.length < 3) return;
        if (!logicalMap || !logicalMap[0] || !heightMap || !heightMap[0] || !Number.isFinite(mapSize)) return;

        const bounds = patch.waterBounds;
        const xMin = Math.max(0, Math.floor(bounds.xMin));
        const xMax = Math.min(mapSize - 1, Math.ceil(bounds.xMax));
        const yMin = Math.max(0, Math.floor(bounds.yMin));
        const yMax = Math.min(mapSize - 1, Math.ceil(bounds.yMax));

        for (let y = yMin; y <= yMax; y++) {
            if (!logicalMap[0][y] || !heightMap[0][y]) continue;
            for (let x = xMin; x <= xMax; x++) {
                const tile = logicalMap[0][y][x];
                if (isWaterTileId(tileIds, tile)) continue;
                if (!pointInPolygon(patch.landPolygon, x + 0.5, y + 0.5)) continue;
                const height = Number.isFinite(heightMap[0][y][x]) ? heightMap[0][y][x] : 0;
                if (height < MIN_ISLAND_INTERIOR_LAND_HEIGHT) {
                    heightMap[0][y][x] = MIN_ISLAND_INTERIOR_LAND_HEIGHT;
                }
            }
        }
    }

    function applyBaseTerrainSetup(options = {}) {
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const mapSize = options.mapSize;
        const tileIds = options.tileIds || {};
        const terrainNoise = createTerrainNoise();
        const townBounds = createTownBounds({
            mapSize,
            stampedStructures: options.stampedStructures,
            stampMap: options.stampMap
        });
        const inTownCore = townBounds.inTownCore;
        const townSquareBounds = townBounds.townSquareBounds;
        const riverSampler = createRiverSampler(mapSize);
        const sampleRiverAtY = riverSampler.sampleRiverAtY;
        const legacyRiverEnabled = options.disableLegacyRiver !== true;
        const pierConfig = isPierConfigEnabled(options.pierConfig) ? options.pierConfig : null;
        const pierDeckTopHeight = Number.isFinite(options.pierDeckTopHeight) ? options.pierDeckTopHeight : 0.28;
        const isPierSideWaterTile = typeof options.isPierSideWaterTile === 'function'
            ? options.isPierSideWaterTile
            : () => false;

        for (let y = 0; y < mapSize; y++) {
            for (let x = 0; x < mapSize; x++) {
                if (x === 0 || y === 0 || x === mapSize - 1 || y === mapSize - 1) {
                    logicalMap[0][y][x] = 2;
                    heightMap[0][y][x] = 0.08;
                }
                else if (pointInBounds(townSquareBounds, x, y)) {
                    logicalMap[0][y][x] = tileIds.GRASS;
                    heightMap[0][y][x] = 0;
                }
                else {
                    logicalMap[0][y][x] = tileIds.GRASS;
                    heightMap[0][y][x] = terrainNoise(x, y);
                }
            }
        }

        const carveWaterTile = (x, y, depthNorm) => {
            if (x <= 1 || y <= 1 || x >= mapSize - 2 || y >= mapSize - 2) return;
            if (inTownCore(x, y)) return;
            if (depthNorm >= 0.64) {
                logicalMap[0][y][x] = tileIds.WATER_DEEP;
                heightMap[0][y][x] = -0.18;
            } else {
                logicalMap[0][y][x] = tileIds.WATER_SHALLOW;
                heightMap[0][y][x] = -0.10;
            }
        };

        if (legacyRiverEnabled) {
            for (let y = 1; y < mapSize - 1; y++) {
                const riverSample = sampleRiverAtY(y);
                const riverCenter = riverSample.centerX;
                const riverHalfWidth = riverSample.halfWidth;
                const carveSpan = Math.ceil(riverHalfWidth + 4);
                for (let x = Math.max(1, Math.floor(riverCenter - carveSpan)); x <= Math.min(mapSize - 2, Math.ceil(riverCenter + carveSpan)); x++) {
                    const d = Math.abs(x - riverCenter);
                    if (d <= riverHalfWidth) {
                        carveWaterTile(x, y, Math.max(0, 1 - (d / Math.max(0.1, riverHalfWidth))));
                    }
                }
            }

            const riverBridgeRows = [
                Math.floor(mapSize * 0.24),
                Math.floor(mapSize * 0.49),
                Math.floor(mapSize * 0.73)
            ];
            for (let i = 0; i < riverBridgeRows.length; i++) {
                const bridgeY = riverBridgeRows[i];
                if (bridgeY <= 2 || bridgeY >= mapSize - 3) continue;
                const sample = sampleRiverAtY(bridgeY);
                const bridgeHalfSpan = Math.ceil(sample.halfWidth + Math.max(3, 2 * riverSampler.riverAxisScale));
                const bridgeXMin = Math.max(2, Math.floor(sample.centerX - bridgeHalfSpan));
                const bridgeXMax = Math.min(mapSize - 3, Math.ceil(sample.centerX + bridgeHalfSpan));
                for (let x = bridgeXMin; x <= bridgeXMax; x++) {
                    logicalMap[0][bridgeY][x] = tileIds.FLOOR_WOOD;
                    heightMap[0][bridgeY][x] = pierDeckTopHeight;
                }
                if (bridgeXMin - 1 > 1) {
                    logicalMap[0][bridgeY][bridgeXMin - 1] = tileIds.SHORE;
                    heightMap[0][bridgeY][bridgeXMin - 1] = -0.01;
                }
                if (bridgeXMax + 1 < mapSize - 2) {
                    logicalMap[0][bridgeY][bridgeXMax + 1] = tileIds.SHORE;
                    heightMap[0][bridgeY][bridgeXMax + 1] = -0.01;
                }
            }
        }

        applyIslandWaterPatch({
            heightMap,
            islandWater: options.islandWater,
            logicalMap,
            mapSize,
            terrainNoise,
            tileIds
        });

        const lakeDefs = Array.isArray(options.lakeDefs) ? options.lakeDefs : [];
        lakeDefs.forEach((lake) => applyEllipseWater({ ellipse: lake, mapSize, carveWaterTile }));
        applyEllipseWater({ ellipse: options.castleFrontPond, mapSize, carveWaterTile });

        const deepWaterCenter = options.deepWaterCenter || {};
        for (let y = deepWaterCenter.yMin; y <= deepWaterCenter.yMax; y++) {
            for (let x = deepWaterCenter.xMin; x <= deepWaterCenter.xMax; x++) {
                if (x <= 1 || y <= 1 || x >= mapSize - 2 || y >= mapSize - 2) continue;
                logicalMap[0][y][x] = tileIds.WATER_DEEP;
                heightMap[0][y][x] = -0.18;
            }
        }

        applyTerrainLandformPatches({
            heightMap,
            inTownCore,
            landformPatches: options.landformPatches,
            logicalMap,
            mapSize,
            tileIds
        });

        applyTerrainPathPatches({
            heightMap,
            logicalMap,
            mapSize,
            pathPatches: options.pathPatches,
            tileIds
        });

        liftIslandLandAboveWaterline({
            heightMap,
            islandWater: options.islandWater,
            logicalMap,
            mapSize,
            tileIds
        });

        if (pierConfig) {
            const pierXMin = pierConfig.xMin;
            const pierXMax = pierConfig.xMax;
            const pierYStart = pierConfig.yStart;
            const pierYEnd = pierConfig.yEnd;
            for (let y = pierYStart; y <= pierYEnd; y++) {
                for (let x = pierXMin; x <= pierXMax; x++) {
                    if (x <= 1 || y <= 1 || x >= mapSize - 2 || y >= mapSize - 2) continue;
                    logicalMap[0][y][x] = tileIds.FLOOR_WOOD;
                    heightMap[0][y][x] = pierDeckTopHeight;
                }
            }
            for (let y = pierYStart; y <= pierYEnd; y++) {
                const sideXs = [pierXMin - 1, pierXMax + 1];
                for (let i = 0; i < sideXs.length; i++) {
                    const sideX = sideXs[i];
                    if (!isPierSideWaterTile(pierConfig, sideX, y, 0)) continue;
                    if (sideX <= 1 || y <= 1 || sideX >= mapSize - 2 || y >= mapSize - 2) continue;
                    logicalMap[0][y][sideX] = tileIds.WATER_SHALLOW;
                    heightMap[0][y][sideX] = -0.10;
                }
            }

            const pierEntryShoulders = [
                { x: pierXMin - 1, y: pierYStart },
                { x: pierXMax + 1, y: pierYStart }
            ];
            for (let i = 0; i < pierEntryShoulders.length; i++) {
                const shoulder = pierEntryShoulders[i];
                if (!shoulder) continue;
                if (shoulder.x <= 1 || shoulder.y <= 1 || shoulder.x >= mapSize - 2 || shoulder.y >= mapSize - 2) continue;
                logicalMap[0][shoulder.y][shoulder.x] = tileIds.GRASS;
                heightMap[0][shoulder.y][shoulder.x] = Math.max(0.01, terrainNoise(shoulder.x, shoulder.y));
            }

            const pierEntryY = pierConfig.entryY;
            const pierLandAnchorY = pierEntryY - 1;
            for (let x = pierXMin; x <= pierXMax; x++) {
                if (x <= 1 || pierEntryY <= 1 || x >= mapSize - 2 || pierEntryY >= mapSize - 2) continue;
                logicalMap[0][pierEntryY][x] = tileIds.SHORE;
                heightMap[0][pierEntryY][x] = -0.01;
                if (pierLandAnchorY > 1) {
                    logicalMap[0][pierLandAnchorY][x] = tileIds.SHORE;
                    heightMap[0][pierLandAnchorY][x] = -0.01;
                }
            }
        }

        return Object.assign({}, townBounds, {
            terrainNoise
        });
    }

    window.WorldTerrainSetupRuntime = {
        applyBaseTerrainSetup,
        applyIslandWaterPatch,
        applyTerrainLandformPatches,
        applyTerrainPathPatches,
        liftIslandLandAboveWaterline,
        createRiverSampler,
        createTerrainNoise,
        createTownBounds,
        expandBounds,
        getStampBounds
    };
})();
