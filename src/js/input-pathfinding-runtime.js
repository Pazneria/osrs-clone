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

    function estimatePathDistanceToTarget(x, y, target) {
        const dx = Math.abs(target.x - x);
        const dy = Math.abs(target.y - y);
        const diagonal = Math.min(dx, dy);
        const straight = Math.max(dx, dy) - diagonal;
        return (diagonal * Math.SQRT2) + straight;
    }

    function estimatePathDistanceToAnyTarget(x, y, targets) {
        let best = Infinity;
        for (let i = 0; i < targets.length; i++) {
            best = Math.min(best, estimatePathDistanceToTarget(x, y, targets[i]));
        }
        return best;
    }

    function estimatePathLineDeviationToTarget(startX, startY, x, y, target) {
        const targetDx = target.x - startX;
        const targetDy = target.y - startY;
        const stepDx = x - startX;
        const stepDy = y - startY;
        const targetSpan = Math.max(Math.abs(targetDx), Math.abs(targetDy));
        if (targetSpan <= 0) return 0;
        return Math.abs((targetDx * stepDy) - (targetDy * stepDx)) / targetSpan;
    }

    function estimatePathLineDeviationToAnyTarget(startX, startY, x, y, targets) {
        let best = Infinity;
        for (let i = 0; i < targets.length; i++) {
            best = Math.min(best, estimatePathLineDeviationToTarget(startX, startY, x, y, targets[i]));
        }
        return best;
    }

    function compareOpenEntries(a, b) {
        const fDelta = a.f - b.f;
        if (Math.abs(fDelta) > 0.000001) return fDelta;
        const lineDelta = a.line - b.line;
        if (Math.abs(lineDelta) > 0.000001) return lineDelta;
        const hDelta = a.h - b.h;
        if (Math.abs(hDelta) > 0.000001) return hDelta;
        return a.order - b.order;
    }

    function pushOpenEntry(heap, entry) {
        heap.push(entry);
        let index = heap.length - 1;
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (compareOpenEntries(heap[parentIndex], entry) <= 0) break;
            heap[index] = heap[parentIndex];
            index = parentIndex;
        }
        heap[index] = entry;
    }

    function popOpenEntry(heap) {
        if (heap.length === 0) return null;
        const first = heap[0];
        const last = heap.pop();
        if (heap.length > 0 && last) {
            let index = 0;
            while (true) {
                const leftIndex = (index * 2) + 1;
                const rightIndex = leftIndex + 1;
                if (leftIndex >= heap.length) break;
                let childIndex = leftIndex;
                if (rightIndex < heap.length && compareOpenEntries(heap[rightIndex], heap[leftIndex]) < 0) {
                    childIndex = rightIndex;
                }
                if (compareOpenEntries(heap[childIndex], last) >= 0) break;
                heap[index] = heap[childIndex];
                index = childIndex;
            }
            heap[index] = last;
        }
        return first;
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

        const validTargetCoords = Array.from(validTargets).map((key) => ({
            key,
            x: decodeTileX(context, key),
            y: decodeTileY(context, key)
        }));
        const openHeap = [];
        const visitedParents = new Map();
        const pathCosts = new Map();
        const closedKeys = new Set();
        let openOrder = 0;
        visitedParents.set(startKey, -1);
        pathCosts.set(startKey, 0);
        const startH = estimatePathDistanceToAnyTarget(startX, startY, validTargetCoords);
        pushOpenEntry(openHeap, {
            key: startKey,
            x: startX,
            y: startY,
            g: 0,
            h: startH,
            f: startH,
            line: 0,
            order: openOrder++
        });

        const dirs8 = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}];
        const restrictPierFishingToDeck = interactionObj === 'WATER'
            && typeof context.isPierDeckTile === 'function'
            && context.isPierDeckTile(startX, startY, resolvedZ);

        let iterations = 0;
        let foundTargetKey = -1;
        const maxIterations = Number.isFinite(context.pathfindMaxIterations) ? context.pathfindMaxIterations : 25000;

        while (openHeap.length > 0) {
            if (iterations++ > maxIterations) break;

            const currentEntry = popOpenEntry(openHeap);
            if (!currentEntry || closedKeys.has(currentEntry.key)) continue;
            const currentKey = currentEntry.key;
            const currentX = currentEntry.x;
            const currentY = currentEntry.y;
            if (validTargets.has(currentKey)) {
                foundTargetKey = currentKey;
                break;
            }
            closedKeys.add(currentKey);
            const currentHeight = heightMap[resolvedZ][currentY][currentX];

            for (const dir of dirs8) {
                const nx = currentX + dir.x;
                const ny = currentY + dir.y;
                const nextKey = encodeTileKey(context, nx, ny);
                if (!isInBounds(context, nx, ny) || closedKeys.has(nextKey) || !isStandableTileForPath(context, nx, ny, resolvedZ, pathOptions)) continue;

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

                const stepCost = cardinalStep ? 1 : Math.SQRT2;
                const tentativeCost = currentEntry.g + stepCost;
                const knownCost = pathCosts.has(nextKey) ? pathCosts.get(nextKey) : Infinity;
                if (tentativeCost >= knownCost - 0.000001) continue;

                visitedParents.set(nextKey, currentKey);
                pathCosts.set(nextKey, tentativeCost);
                const nextH = estimatePathDistanceToAnyTarget(nx, ny, validTargetCoords);
                const nextLine = estimatePathLineDeviationToAnyTarget(startX, startY, nx, ny, validTargetCoords);
                pushOpenEntry(openHeap, {
                    key: nextKey,
                    x: nx,
                    y: ny,
                    g: tentativeCost,
                    h: nextH,
                    f: tentativeCost + nextH,
                    line: nextLine,
                    order: openOrder++
                });
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
