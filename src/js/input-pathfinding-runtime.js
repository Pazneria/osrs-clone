(function () {
    function getPlayerPlane(context) {
        const playerState = context && context.playerState;
        return playerState && Number.isInteger(playerState.z) ? playerState.z : 0;
    }

    function getMapSize(context) {
        return Number.isInteger(context && context.mapSize) ? context.mapSize : 0;
    }

    function getPlanes(context) {
        return Number.isInteger(context && context.planes) ? context.planes : 1;
    }

    function encodeTileKey(context, x, y) {
        return (y * getMapSize(context)) + x;
    }

    function decodeTileX(context, key) {
        const mapSize = getMapSize(context);
        return mapSize > 0 ? key % mapSize : 0;
    }

    function decodeTileY(context, key) {
        const mapSize = getMapSize(context);
        return mapSize > 0 ? Math.floor(key / mapSize) : 0;
    }

    function isInBounds(context, x, y) {
        const mapSize = getMapSize(context);
        return x >= 0 && y >= 0 && x < mapSize && y < mapSize;
    }

    function getPathTileId(context, x, y, z = getPlayerPlane(context), pathOptions = null) {
        if (!context || !isInBounds(context, x, y)) return null;
        const opts = pathOptions && typeof pathOptions === 'object' ? pathOptions : null;
        if (opts && opts.ignoreCombatEnemyOccupancy && typeof context.getCombatEnemyOccupiedBaseTileId === 'function') {
            const occupiedBaseTileId = context.getCombatEnemyOccupiedBaseTileId(x, y, z);
            if (occupiedBaseTileId !== null && occupiedBaseTileId !== undefined) return occupiedBaseTileId;
        }
        return context.logicalMap && context.logicalMap[z] && context.logicalMap[z][y]
            ? context.logicalMap[z][y][x]
            : null;
    }

    function isStandableTileForPath(context, x, y, z = getPlayerPlane(context), pathOptions = null) {
        if (!context || !isInBounds(context, x, y)) return false;
        if (typeof context.isTutorialWalkTileAllowed === 'function' && !context.isTutorialWalkTileAllowed(x, y, z)) return false;
        const tile = getPathTileId(context, x, y, z, pathOptions);
        if (typeof context.isWalkableTileId === 'function' && context.isWalkableTileId(tile)) return true;

        if (tile === context.tileIds.WATER_SHALLOW) {
            if (typeof context.isPierProtectedWaterTile === 'function' && context.isPierProtectedWaterTile(x, y, z)) return false;
            const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
            for (let i = 0; i < dirs.length; i++) {
                const nx = x + dirs[i].x;
                const ny = y + dirs[i].y;
                if (!isInBounds(context, nx, ny)) continue;
                const neighborTile = getPathTileId(context, nx, ny, z, pathOptions);
                if (typeof context.isWaterTileId !== 'function' || !context.isWaterTileId(neighborTile)) return true;
            }
        }
        return false;
    }

    function resolvePathPlane(context, pathOptions) {
        const requestedZ = pathOptions && Number.isFinite(pathOptions.z) ? pathOptions.z : getPlayerPlane(context);
        return Math.max(0, Math.min(getPlanes(context) - 1, Math.floor(requestedZ)));
    }

    function getStationApproachKeys(context, interactionObj, targetX, targetY, z) {
        const positions = typeof context.getStationApproachPositions === 'function'
            ? context.getStationApproachPositions(interactionObj, targetX, targetY, z)
            : [];
        return new Set(positions.map((p) => encodeTileKey(context, p.x, p.y)));
    }

    function findPath(context, startX, startY, targetX, targetY, forceAdjacent = false, interactionObj = null, pathOptions = null) {
        if (!context || !isInBounds(context, startX, startY) || !isInBounds(context, targetX, targetY)) return [];
        const resolvedZ = resolvePathPlane(context, pathOptions);
        const validTargets = new Set();
        const targetTileType = getPathTileId(context, targetX, targetY, resolvedZ, pathOptions);
        const stationApproachKeys = getStationApproachKeys(context, interactionObj, targetX, targetY, resolvedZ);
        const isInteract = forceAdjacent || !isStandableTileForPath(context, targetX, targetY, resolvedZ, pathOptions);
        const tileIds = context.tileIds || {};
        const heightMap = context.heightMap || [];

        if (isInteract) {
            const targetH = heightMap[resolvedZ][targetY][targetX];
            if (targetTileType === tileIds.BANK_BOOTH) {
                const nx = targetX;
                const ny = targetY + 1;
                if (isInBounds(context, nx, ny) && isStandableTileForPath(context, nx, ny, resolvedZ, pathOptions)) {
                    if (Math.abs(heightMap[resolvedZ][ny][nx] - targetH) < 0.1) validTargets.add(encodeTileKey(context, nx, ny));
                }
            } else {
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = targetX + dx;
                        const ny = targetY + dy;

                        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                            if (isInBounds(context, nx, ny) && isStandableTileForPath(context, nx, ny, resolvedZ, pathOptions)) {
                                const pierFishingApproach = interactionObj === 'WATER'
                                    && typeof context.isPierFishingApproachTile === 'function'
                                    && context.isPierFishingApproachTile(nx, ny, targetX, targetY, resolvedZ);
                                if (interactionObj === 'WATER' && !pierFishingApproach) {
                                    const isCardinalAdjacent = (Math.abs(dx) + Math.abs(dy)) === 1;
                                    if (!isCardinalAdjacent) continue;
                                    if (typeof context.isWaterTileId === 'function' && context.isWaterTileId(getPathTileId(context, nx, ny, resolvedZ, pathOptions))) continue;
                                }
                                if (pierFishingApproach || Math.abs(heightMap[resolvedZ][ny][nx] - targetH) <= 0.3) {
                                    const neighborKey = encodeTileKey(context, nx, ny);
                                    if (stationApproachKeys.size === 0 || stationApproachKeys.has(neighborKey)) validTargets.add(neighborKey);
                                }
                            }
                            continue;
                        }

                        const maxAxis = Math.max(Math.abs(dx), Math.abs(dy));
                        const isAltarRingTile = interactionObj === 'ALTAR_CANDIDATE' && maxAxis === 2;
                        if (isAltarRingTile) {
                            if (isInBounds(context, nx, ny) && isStandableTileForPath(context, nx, ny, resolvedZ, pathOptions)) {
                                if (Math.abs(heightMap[resolvedZ][ny][nx] - targetH) <= 0.3) validTargets.add(encodeTileKey(context, nx, ny));
                            }
                            continue;
                        }

                        if (targetTileType === tileIds.SOLID_NPC) {
                            if (Math.abs(dx) === 2 && dy === 0) {
                                const midX = targetX + dx / 2;
                                if (getPathTileId(context, midX, targetY, resolvedZ, pathOptions) === tileIds.SHOP_COUNTER) {
                                    if (isInBounds(context, nx, ny) && isStandableTileForPath(context, nx, ny, resolvedZ, pathOptions)) validTargets.add(encodeTileKey(context, nx, ny));
                                }
                            } else if (Math.abs(dy) === 2 && dx === 0) {
                                const midY = targetY + dy / 2;
                                if (getPathTileId(context, targetX, midY, resolvedZ, pathOptions) === tileIds.SHOP_COUNTER) {
                                    if (isInBounds(context, nx, ny) && isStandableTileForPath(context, nx, ny, resolvedZ, pathOptions)) validTargets.add(encodeTileKey(context, nx, ny));
                                }
                            }
                        }
                    }
                }
            }
            if (validTargets.size === 0) return [];
        } else {
            validTargets.add(encodeTileKey(context, targetX, targetY));
        }

        const startKey = encodeTileKey(context, startX, startY);
        if (validTargets.has(startKey)) return [];

        const queue = [startKey];
        let queueIndex = 0;
        const visitedParents = new Map();
        visitedParents.set(startKey, -1);

        const dirs8 = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}];
        const restrictPierFishingToDeck = interactionObj === 'WATER'
            && typeof context.isPierDeckTile === 'function'
            && context.isPierDeckTile(startX, startY, resolvedZ);

        let iterations = 0;
        let foundTargetKey = -1;
        const maxIterations = Number.isFinite(context.pathfindMaxIterations) ? context.pathfindMaxIterations : 25000;

        while (queueIndex < queue.length) {
            if (iterations++ > maxIterations) break;

            const currentKey = queue[queueIndex++];
            const currentX = decodeTileX(context, currentKey);
            const currentY = decodeTileY(context, currentKey);
            const currentHeight = heightMap[resolvedZ][currentY][currentX];

            for (const dir of dirs8) {
                const nx = currentX + dir.x;
                const ny = currentY + dir.y;
                const nextKey = encodeTileKey(context, nx, ny);
                if (!isInBounds(context, nx, ny) || visitedParents.has(nextKey) || !isStandableTileForPath(context, nx, ny, resolvedZ, pathOptions)) continue;

                const nextTileId = getPathTileId(context, nx, ny, resolvedZ, pathOptions);
                const currentTileId = getPathTileId(context, currentX, currentY, resolvedZ, pathOptions);
                if (interactionObj === 'WATER' && typeof context.isWaterTileId === 'function' && context.isWaterTileId(nextTileId)) continue;
                if (restrictPierFishingToDeck && typeof context.isWaterTileId === 'function' && context.isWaterTileId(nextTileId)) continue;
                const nextHeight = heightMap[resolvedZ][ny][nx];
                const isStairTransition = (nextTileId === tileIds.STAIRS_RAMP || currentTileId === tileIds.STAIRS_RAMP) && Math.abs(currentHeight - nextHeight) <= 0.6;
                const cardinalStep = Math.abs(dir.x) + Math.abs(dir.y) === 1;
                const isPierDeckHeightTransition = cardinalStep
                    && Math.abs(currentHeight - nextHeight) <= 0.6
                    && typeof context.isPierDeckTile === 'function'
                    && typeof context.isWaterTileId === 'function'
                    && (
                        (context.isPierDeckTile(currentX, currentY, resolvedZ) && !context.isWaterTileId(nextTileId))
                        || (context.isPierDeckTile(nx, ny, resolvedZ) && !context.isWaterTileId(currentTileId))
                    );
                if (Math.abs(currentHeight - nextHeight) > 0.3 && !isStairTransition && !isPierDeckHeightTransition) continue;

                if (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1) {
                    const hX = heightMap[resolvedZ][currentY][currentX + dir.x];
                    const hY = heightMap[resolvedZ][currentY + dir.y][currentX];
                    const blockX = !isStandableTileForPath(context, currentX + dir.x, currentY, resolvedZ, pathOptions) || Math.abs(hX - currentHeight) > 0.3;
                    const blockY = !isStandableTileForPath(context, currentX, currentY + dir.y, resolvedZ, pathOptions) || Math.abs(hY - currentHeight) > 0.3;
                    if (blockX || blockY) continue;
                }

                visitedParents.set(nextKey, currentKey);

                if (validTargets.has(nextKey)) {
                    foundTargetKey = nextKey;
                    queueIndex = queue.length;
                    break;
                }
                queue.push(nextKey);
            }
        }

        if (foundTargetKey === -1) return [];

        const path = [];
        let currentPathKey = foundTargetKey;

        while (currentPathKey !== -1 && currentPathKey !== startKey) {
            const cx = decodeTileX(context, currentPathKey);
            const cy = decodeTileY(context, currentPathKey);
            path.unshift({x: cx, y: cy});
            const parentKey = visitedParents.get(currentPathKey);
            if (parentKey === undefined) break;
            currentPathKey = parentKey;
        }

        return path;
    }

    window.InputPathfindingRuntime = {
        getPathTileId,
        isStandableTileForPath,
        findPath
    };
})();
