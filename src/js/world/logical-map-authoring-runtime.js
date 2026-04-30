(function () {
    function inInteriorBounds(x, y, mapSize) {
        return x > 1 && y > 1 && x < mapSize - 2 && y < mapSize - 2;
    }

    function getPlaneRow(logicalMap, z, y) {
        return logicalMap && logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y] : null;
    }

    function placeStaticNpcOccupancyTile(context = {}, x, y, z = 0, options = {}) {
        const logicalMap = context.logicalMap;
        const heightMap = context.heightMap;
        const tileIds = context.tileIds || {};
        const row = getPlaneRow(logicalMap, z, y);
        if (!row) return false;
        const baseTile = Number.isFinite(options.baseTile)
            ? Math.floor(Number(options.baseTile))
            : row[x];
        if (typeof context.rememberStaticNpcBaseTile === 'function') {
            context.rememberStaticNpcBaseTile(x, y, z, baseTile);
        }
        row[x] = tileIds.SOLID_NPC;
        if (Number.isFinite(options.height) && heightMap && heightMap[z] && heightMap[z][y]) {
            heightMap[z][y][x] = Number(options.height);
        }
        return true;
    }

    function applyFishingMerchantSpots(options = {}) {
        const mapSize = options.mapSize;
        const tileIds = options.tileIds || {};
        const npcsToRender = Array.isArray(options.npcsToRender) ? options.npcsToRender : [];
        const spots = Array.isArray(options.fishingMerchantSpots) ? options.fishingMerchantSpots : [];
        const context = {
            heightMap: options.heightMap,
            logicalMap: options.logicalMap,
            rememberStaticNpcBaseTile: options.rememberStaticNpcBaseTile,
            tileIds
        };

        for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];
            if (!spot || !inInteriorBounds(spot.x, spot.y, mapSize)) continue;
            placeStaticNpcOccupancyTile(context, spot.x, spot.y, 0, { baseTile: tileIds.SHORE, height: -0.01 });
            npcsToRender.push({
                type: spot.type,
                x: spot.x,
                y: spot.y,
                z: 0,
                name: spot.name,
                merchantId: spot.merchantId,
                appearanceId: spot.appearanceId || null,
                dialogueId: spot.dialogueId || null,
                facingYaw: spot.facingYaw,
                action: spot.action || 'Trade'
            });
        }
        return { npcsToRender };
    }

    function stampBlueprint(options = {}) {
        const startX = options.startX;
        const startY = options.startY;
        const z = Number.isFinite(options.z) ? options.z : 0;
        const blueprint = Array.isArray(options.blueprint) ? options.blueprint : [];
        const tileIds = options.tileIds || {};
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const bankBoothsToRender = Array.isArray(options.bankBoothsToRender) ? options.bankBoothsToRender : [];
        const npcsToRender = Array.isArray(options.npcsToRender) ? options.npcsToRender : [];
        const context = {
            heightMap,
            logicalMap,
            rememberStaticNpcBaseTile: options.rememberStaticNpcBaseTile,
            tileIds
        };

        for (let y = 0; y < blueprint.length; y++) {
            const row = blueprint[y];
            if (typeof row !== 'string') continue;
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === ' ') continue;

                const mapX = startX + x;
                const mapY = startY + y;
                const targetRow = getPlaneRow(logicalMap, z, mapY);
                if (!targetRow || !heightMap || !heightMap[z] || !heightMap[z][mapY]) continue;

                targetRow[mapX] = 0;

                if (char === 'W') { targetRow[mapX] = tileIds.WALL; heightMap[z][mapY][mapX] = 0.5; }
                else if (char === 'C') { targetRow[mapX] = tileIds.TOWER; heightMap[z][mapY][mapX] = 0.5; }
                else if (char === 'F') { targetRow[mapX] = tileIds.FLOOR_STONE; heightMap[z][mapY][mapX] = 0.5; }
                else if (char === 'L' || char === 'T') { targetRow[mapX] = tileIds.FLOOR_WOOD; heightMap[z][mapY][mapX] = 0.5; }
                else if (char === 'U') { targetRow[mapX] = tileIds.STAIRS_UP; heightMap[z][mapY][mapX] = 0.25; }
                else if (char === 'D') { targetRow[mapX] = tileIds.STAIRS_DOWN; heightMap[z][mapY][mapX] = 0.25; }
                else if (char === 's') { targetRow[mapX] = tileIds.STAIRS_RAMP; heightMap[z][mapY][mapX] = 0.25; }
                else if (char === 'S') { targetRow[mapX] = tileIds.STAIRS_RAMP; heightMap[z][mapY][mapX] = 0.75; }
                else if (char === 'P') { targetRow[mapX] = tileIds.FLOOR_STONE; heightMap[z][mapY][mapX] = 1.0; }
                else if (char === 'H') { targetRow[mapX] = tileIds.STAIRS_RAMP; heightMap[z][mapY][mapX] = 1.25; }
                else if (char === 'E') { targetRow[mapX] = tileIds.FLOOR_STONE; heightMap[z][mapY][mapX] = 1.5; }
                else if (char === 'B') {
                    targetRow[mapX] = tileIds.BANK_BOOTH;
                    heightMap[z][mapY][mapX] = 0.5;
                    bankBoothsToRender.push({ x: mapX, y: mapY, z });
                }
                else if (char === 'N') {
                    placeStaticNpcOccupancyTile(context, mapX, mapY, z, { baseTile: tileIds.FLOOR_STONE, height: 0.5 });
                    npcsToRender.push({ type: 3, x: mapX, y: mapY, z, name: 'Banker' });
                }
                else if (char === 'K') {
                    placeStaticNpcOccupancyTile(context, mapX, mapY, z, { baseTile: tileIds.FLOOR_STONE, height: 0.5 });
                    npcsToRender.push({ type: 7, x: mapX, y: mapY, z, name: 'King Roald' });
                }
                else if (char === 'Q') {
                    placeStaticNpcOccupancyTile(context, mapX, mapY, z, { baseTile: tileIds.FLOOR_STONE, height: 0.5 });
                    npcsToRender.push({ type: 8, x: mapX, y: mapY, z, name: 'Queen Ellamaria' });
                }
                else if (char === 'V') {
                    targetRow[mapX] = tileIds.SHOP_COUNTER;
                    heightMap[z][mapY][mapX] = 0.5;
                }
                else if (char === '$') {
                    placeStaticNpcOccupancyTile(context, mapX, mapY, z, { baseTile: tileIds.FLOOR_STONE, height: 0.5 });
                    npcsToRender.push({ type: 2, x: mapX, y: mapY, z, name: 'Shopkeeper' });
                }
            }
        }

        return { bankBoothsToRender, npcsToRender };
    }

    function applyStampedStructureBlueprints(options = {}) {
        const stampedStructures = Array.isArray(options.stampedStructures) ? options.stampedStructures : [];
        const stampMap = options.stampMap || {};
        for (let i = 0; i < stampedStructures.length; i++) {
            const structure = stampedStructures[i];
            if (!structure || !Array.isArray(stampMap[structure.stampId])) continue;
            stampBlueprint(Object.assign({}, options, {
                startX: structure.x,
                startY: structure.y,
                z: structure.z,
                blueprint: stampMap[structure.stampId]
            }));
        }
    }

    function applySmithingStationCollision(options = {}) {
        const logicalMap = options.logicalMap;
        const tileIds = options.tileIds || {};
        const mapSize = options.mapSize;
        const stations = Array.isArray(options.smithingStations) ? options.smithingStations : [];
        for (let i = 0; i < stations.length; i++) {
            const station = stations[i];
            if (!station || !inInteriorBounds(station.x, station.y, mapSize)) continue;
            if (station.type === 'FURNACE') {
                const w = Number.isFinite(station.footprintW) ? station.footprintW : 2;
                const d = Number.isFinite(station.footprintD) ? station.footprintD : 2;
                for (let oy = 0; oy < d; oy++) {
                    for (let ox = 0; ox < w; ox++) {
                        const sx = station.x + ox;
                        const sy = station.y + oy;
                        if (!inInteriorBounds(sx, sy, mapSize)) continue;
                        logicalMap[0][sy][sx] = tileIds.SOLID_NPC;
                    }
                }
            } else {
                logicalMap[0][station.y][station.x] = tileIds.SOLID_NPC;
            }
        }
    }

    function applyStaticMerchantSpots(options = {}) {
        const mapSize = options.mapSize;
        const npcsToRender = Array.isArray(options.npcsToRender) ? options.npcsToRender : [];
        const spots = Array.isArray(options.staticMerchantSpots) ? options.staticMerchantSpots : [];
        const context = {
            heightMap: options.heightMap,
            logicalMap: options.logicalMap,
            rememberStaticNpcBaseTile: options.rememberStaticNpcBaseTile,
            tileIds: options.tileIds || {}
        };

        for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];
            if (!spot || !inInteriorBounds(spot.x, spot.y, mapSize)) continue;
            const merchantHeight = Array.isArray(spot.tags)
                && !spot.tags.includes('tutorial')
                && (spot.tags.includes('smithing') || spot.tags.includes('crafting'))
                ? 0.5
                : null;
            placeStaticNpcOccupancyTile(context, spot.x, spot.y, 0, { height: merchantHeight });
            npcsToRender.push({
                type: spot.type,
                x: spot.x,
                y: spot.y,
                z: 0,
                name: spot.name,
                merchantId: spot.merchantId,
                appearanceId: spot.appearanceId || null,
                dialogueId: spot.dialogueId || null,
                facingYaw: spot.facingYaw,
                action: spot.action || 'Trade',
                travelToWorldId: spot.travelToWorldId || null,
                travelSpawn: spot.travelSpawn || null
            });
        }
        return { npcsToRender };
    }

    function applyStaircaseLandmarks(options = {}) {
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const tileIds = options.tileIds || {};
        const bankBoothsToRender = Array.isArray(options.bankBoothsToRender) ? options.bankBoothsToRender : [];
        const landmarks = Array.isArray(options.staircaseLandmarks) ? options.staircaseLandmarks : [];
        for (let i = 0; i < landmarks.length; i++) {
            const staircase = landmarks[i];
            if (!staircase || !Array.isArray(staircase.tiles)) continue;
            for (let j = 0; j < staircase.tiles.length; j++) {
                const tile = staircase.tiles[j];
                if (!tile || !Number.isInteger(tile.x) || !Number.isInteger(tile.y) || !Number.isInteger(tile.z)) continue;
                const row = getPlaneRow(logicalMap, tile.z, tile.y);
                if (!row || !heightMap[tile.z] || !heightMap[tile.z][tile.y]) continue;
                const tileId = tileIds[tile.tileId];
                if (!Number.isFinite(tileId)) continue;
                row[tile.x] = tileId;
                heightMap[tile.z][tile.y][tile.x] = Number.isFinite(tile.height) ? tile.height : heightMap[tile.z][tile.y][tile.x];
                if (tileId === tileIds.BANK_BOOTH && !bankBoothsToRender.some((booth) => booth.x === tile.x && booth.y === tile.y && booth.z === tile.z)) {
                    bankBoothsToRender.push({ x: tile.x, y: tile.y, z: tile.z });
                }
            }
        }
        return { bankBoothsToRender };
    }

    function applyFenceLandmark(options = {}, fence) {
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const tileIds = options.tileIds || {};
        const mapSize = options.mapSize;
        if (!fence || !Array.isArray(fence.points) || fence.points.length < 2) return;
        const z = Number.isInteger(fence.z) ? fence.z : 0;
        for (let pointIndex = 1; pointIndex < fence.points.length; pointIndex++) {
            const from = fence.points[pointIndex - 1];
            const to = fence.points[pointIndex];
            if (!from || !to) continue;
            const dx = Math.sign(to.x - from.x);
            const dy = Math.sign(to.y - from.y);
            if (dx !== 0 && dy !== 0) continue;
            const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
            let x = from.x;
            let y = from.y;
            for (let step = 0; step <= steps; step++) {
                if (logicalMap[z] && logicalMap[z][y] && x > 0 && y > 0 && x < mapSize - 1 && y < mapSize - 1) {
                    logicalMap[z][y][x] = tileIds.FENCE;
                    heightMap[z][y][x] = Number.isFinite(fence.height) ? fence.height : 0.05;
                }
                x += dx;
                y += dy;
            }
        }
    }

    function applyFenceLandmarks(options = {}) {
        const landmarks = Array.isArray(options.fenceLandmarks) ? options.fenceLandmarks : [];
        for (let i = 0; i < landmarks.length; i++) {
            applyFenceLandmark(options, landmarks[i]);
        }
    }

    function applySmithingHallApproach(options = {}) {
        const approach = options.smithingHallApproach;
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const tileIds = options.tileIds || {};
        const mapSize = options.mapSize;
        if (
            !approach
            || !Number.isInteger(approach.shoreX)
            || !Number.isInteger(approach.stairX)
            || !Number.isInteger(approach.yStart)
            || !Number.isInteger(approach.yEnd)
        ) {
            return;
        }
        const yStart = Math.min(approach.yStart, approach.yEnd);
        const yEnd = Math.max(approach.yStart, approach.yEnd);
        for (let sy = yStart; sy <= yEnd; sy++) {
            if (sy <= 1 || sy >= mapSize - 2) continue;
            if (approach.shoreX > 1 && approach.shoreX < mapSize - 2) {
                logicalMap[0][sy][approach.shoreX] = tileIds.SHORE;
                heightMap[0][sy][approach.shoreX] = -0.01;
            }
            if (approach.stairX > 1 && approach.stairX < mapSize - 2) {
                logicalMap[0][sy][approach.stairX] = tileIds.STAIRS_RAMP;
                heightMap[0][sy][approach.stairX] = 0.25;
            }
        }
    }

    function applyDoorLandmarks(options = {}) {
        const logicalMap = options.logicalMap;
        const heightMap = options.heightMap;
        const tileIds = options.tileIds || {};
        const doorsToRender = Array.isArray(options.doorsToRender) ? options.doorsToRender : [];
        const landmarks = Array.isArray(options.doorLandmarks) ? options.doorLandmarks : [];
        for (let i = 0; i < landmarks.length; i++) {
            const door = landmarks[i];
            if (!door || !Number.isInteger(door.x) || !Number.isInteger(door.y) || !Number.isInteger(door.z)) continue;
            const tileId = tileIds[door.tileId];
            if (Number.isFinite(tileId) && logicalMap[door.z] && logicalMap[door.z][door.y]) {
                logicalMap[door.z][door.y][door.x] = tileId;
                heightMap[door.z][door.y][door.x] = Number.isFinite(door.height) ? door.height : heightMap[door.z][door.y][door.x];
            }
            doorsToRender.push({
                x: door.x,
                y: door.y,
                z: door.z,
                isOpen: !!door.isOpen,
                hingeOffsetX: door.hingeOffsetX,
                hingeOffsetY: door.hingeOffsetY,
                thickness: door.thickness,
                width: door.width,
                isEW: door.isEW,
                closedRot: door.closedRot,
                openRot: door.openRot,
                currentRotation: door.currentRotation,
                targetRotation: door.targetRotation,
                isWoodenGate: tileId === tileIds.WOODEN_GATE_CLOSED || tileId === tileIds.WOODEN_GATE_OPEN,
                closedTileId: tileId === tileIds.WOODEN_GATE_OPEN ? tileIds.WOODEN_GATE_CLOSED : tileId,
                tutorialRequiredStep: Number.isFinite(door.tutorialRequiredStep) ? door.tutorialRequiredStep : null,
                tutorialGateMessage: typeof door.tutorialGateMessage === 'string' ? door.tutorialGateMessage : ''
            });
        }
        return { doorsToRender };
    }

    function cloneRoofLandmarks(roofLandmarks) {
        const landmarks = Array.isArray(roofLandmarks) ? roofLandmarks : [];
        return landmarks.map((roof) => Object.assign({}, roof, {
            hideBounds: roof && roof.hideBounds ? Object.assign({}, roof.hideBounds) : null
        }));
    }

    function applyStaticWorldAuthoring(options = {}) {
        const bankBoothsToRender = Array.isArray(options.bankBoothsToRender) ? options.bankBoothsToRender : [];
        const doorsToRender = Array.isArray(options.doorsToRender) ? options.doorsToRender : [];
        const npcsToRender = Array.isArray(options.npcsToRender) ? options.npcsToRender : [];
        const baseOptions = Object.assign({}, options, {
            bankBoothsToRender,
            doorsToRender,
            npcsToRender
        });

        applyStampedStructureBlueprints(baseOptions);
        applySmithingStationCollision(baseOptions);
        applyStaticMerchantSpots(baseOptions);
        applyStaircaseLandmarks(baseOptions);
        applyFenceLandmarks(baseOptions);
        applySmithingHallApproach(baseOptions);
        applyDoorLandmarks(baseOptions);

        return {
            activeRoofLandmarks: cloneRoofLandmarks(options.roofLandmarks),
            bankBoothsToRender,
            doorsToRender,
            npcsToRender
        };
    }

    function applyAuthoredAltarCollision(options = {}) {
        const logicalMap = options.logicalMap;
        const tileIds = options.tileIds || {};
        const mapSize = options.mapSize;
        const placements = Array.isArray(options.authoredAltarPlacements) ? options.authoredAltarPlacements : [];
        const altarCandidatesToRender = placements.slice();
        for (let i = 0; i < placements.length; i++) {
            const altar = placements[i];
            if (!altar) continue;
            for (let by = altar.y - 1; by <= altar.y + 2; by++) {
                if (by < 0 || by >= mapSize) continue;
                for (let bx = altar.x - 1; bx <= altar.x + 2; bx++) {
                    if (bx < 0 || bx >= mapSize) continue;
                    if (!logicalMap[altar.z] || !logicalMap[altar.z][by]) continue;
                    logicalMap[altar.z][by][bx] = tileIds.OBSTACLE;
                }
            }
        }
        return { altarCandidatesToRender };
    }

    window.WorldLogicalMapAuthoringRuntime = {
        applyAuthoredAltarCollision,
        applyFishingMerchantSpots,
        applyStaticWorldAuthoring,
        cloneRoofLandmarks,
        placeStaticNpcOccupancyTile,
        stampBlueprint
    };
})();
