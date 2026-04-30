(function () {
    const LEGACY_COORD_MAP_SIZE = 486;

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
        for (let y = Math.max(1, Math.floor(ellipse.cy - ellipse.ry - 1)); y <= Math.min(mapSize - 2, Math.ceil(ellipse.cy + ellipse.ry + 1)); y++) {
            for (let x = Math.max(1, Math.floor(ellipse.cx - ellipse.rx - 1)); x <= Math.min(mapSize - 2, Math.ceil(ellipse.cx + ellipse.rx + 1)); x++) {
                const nx = (x - ellipse.cx) / ellipse.rx;
                const ny = (y - ellipse.cy) / ellipse.ry;
                const d = Math.sqrt(nx * nx + ny * ny);
                if (d <= 1.0) carveWaterTile(x, y, 1.0 - d);
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
        const pierConfig = options.pierConfig || {};
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

        return Object.assign({}, townBounds, {
            terrainNoise
        });
    }

    window.WorldTerrainSetupRuntime = {
        applyBaseTerrainSetup,
        createRiverSampler,
        createTerrainNoise,
        createTownBounds,
        expandBounds,
        getStampBounds
    };
})();
