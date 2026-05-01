(function () {
    function getWindowRef(context) {
        return context && context.windowRef ? context.windowRef : window;
    }

    function getMapSize(context) {
        return Number.isInteger(context && context.mapSize) ? context.mapSize : 0;
    }

    function getPlayerPlane(context) {
        const playerState = context && context.playerState;
        return playerState && Number.isInteger(playerState.z) ? playerState.z : 0;
    }

    function getWorldPierRuntime(context = {}) {
        return context.worldPierRuntime || getWindowRef(context).WorldPierRuntime || null;
    }

    function getActivePierConfig(context = {}) {
        const runtime = getWorldPierRuntime(context);
        if (runtime && typeof runtime.getActivePierConfig === 'function') {
            return runtime.getActivePierConfig(context.sharedMaterials);
        }
        return context.sharedMaterials && context.sharedMaterials.activePierConfig
            ? context.sharedMaterials.activePierConfig
            : null;
    }

    function emitPierDebug(context = {}, message) {
        const windowRef = getWindowRef(context);
        if (!windowRef.QA_PIER_DEBUG || typeof context.addChatMessage !== 'function') return;
        context.addChatMessage(`[pier-debug] ${String(message || '').trim()}`, 'info');
    }

    function isPierDeckTile(context = {}, x, y, z = getPlayerPlane(context)) {
        const runtime = getWorldPierRuntime(context);
        const pierConfig = getActivePierConfig(context);
        if (runtime && typeof runtime.isPierDeckTile === 'function') {
            return runtime.isPierDeckTile(pierConfig, x, y, z);
        }
        return !!(
            pierConfig
            && z === 0
            && x >= pierConfig.xMin
            && x <= pierConfig.xMax
            && y >= pierConfig.yStart
            && y <= pierConfig.yEnd
        );
    }

    function isNearPierBoundsTile(context = {}, x, y, z = getPlayerPlane(context), pad = 2) {
        const pierConfig = getActivePierConfig(context);
        if (!pierConfig || z !== 0) return false;
        return (
            x >= (pierConfig.xMin - pad)
            && x <= (pierConfig.xMax + pad)
            && y >= (pierConfig.yStart - pad)
            && y <= (pierConfig.yEnd + pad)
        );
    }

    function findNearestPierDeckBoardingTile(context = {}, targetX, targetY, z = getPlayerPlane(context)) {
        const pierConfig = getActivePierConfig(context);
        if (!pierConfig || z !== 0) return null;

        let best = null;
        for (let y = pierConfig.yStart; y <= pierConfig.yEnd; y++) {
            for (let x = pierConfig.xMin; x <= pierConfig.xMax; x++) {
                if (typeof context.isStandableTile === 'function' && !context.isStandableTile(x, y, z)) continue;
                const dist = Math.abs(x - targetX) + Math.abs(y - targetY);
                if (dist > 2) continue;
                if (!best || dist < best.dist || (dist === best.dist && y < best.y)) {
                    best = { x, y, dist };
                }
            }
        }

        return best;
    }

    function forEachTileInSearchRing(context = {}, targetX, targetY, radius, visit) {
        const mapSize = getMapSize(context);
        if (radius < 0 || typeof visit !== 'function') return false;
        if (radius === 0) {
            if (targetX < 0 || targetY < 0 || targetX >= mapSize || targetY >= mapSize) return false;
            return !!visit(targetX, targetY);
        }

        const minX = Math.max(0, targetX - radius);
        const maxX = Math.min(mapSize - 1, targetX + radius);
        const minY = Math.max(0, targetY - radius);
        const maxY = Math.min(mapSize - 1, targetY + radius);

        for (let x = minX; x <= maxX; x++) {
            if (visit(x, minY)) return true;
            if (maxY !== minY && visit(x, maxY)) return true;
        }
        for (let y = minY + 1; y <= maxY - 1; y++) {
            if (visit(minX, y)) return true;
            if (maxX !== minX && visit(maxX, y)) return true;
        }
        return false;
    }

    function hasPierFishingApproachForWaterTile(context = {}, targetX, targetY, z = getPlayerPlane(context)) {
        const dirs = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
        for (let i = 0; i < dirs.length; i++) {
            const standX = targetX + dirs[i].x;
            const standY = targetY + dirs[i].y;
            if (isPierFishingApproachTile(context, standX, standY, targetX, targetY, z)) return true;
        }
        return false;
    }

    function hasDryFishingApproachForWaterTile(context = {}, targetX, targetY, z = getPlayerPlane(context)) {
        const mapSize = getMapSize(context);
        const dirs = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
        for (let i = 0; i < dirs.length; i++) {
            const standX = targetX + dirs[i].x;
            const standY = targetY + dirs[i].y;
            if (standX < 0 || standY < 0 || standX >= mapSize || standY >= mapSize) continue;
            if (typeof context.isStandableTile === 'function' && !context.isStandableTile(standX, standY, z)) continue;
            const tile = context.logicalMap && context.logicalMap[z] && context.logicalMap[z][standY]
                ? context.logicalMap[z][standY][standX]
                : null;
            if (typeof context.isWaterTileId === 'function' && context.isWaterTileId(tile)) continue;
            return true;
        }
        return false;
    }

    function findNearestFishableWaterEdgeTile(context = {}, targetX, targetY) {
        const playerState = context.playerState || {};
        const z = getPlayerPlane(context);
        let best = null;
        let bestDistSq = Infinity;
        const playerOnPierDeck = isPierDeckTile(context, playerState.x, playerState.y, z);

        const hasAdjacentStandable = (x, y) => (
            playerOnPierDeck
                ? hasPierFishingApproachForWaterTile(context, x, y, z)
                : hasDryFishingApproachForWaterTile(context, x, y, z)
        );

        for (let r = 0; r <= 20; r++) {
            forEachTileInSearchRing(context, targetX, targetY, r, (x, y) => {
                const tile = context.logicalMap[z][y][x];
                if (typeof context.isWaterTileId !== 'function' || !context.isWaterTileId(tile)) return false;
                if (!hasAdjacentStandable(x, y)) return false;
                const dx = x - targetX;
                const dy = y - targetY;
                const distSq = (dx * dx) + (dy * dy);
                if (distSq < bestDistSq) {
                    bestDistSq = distSq;
                    best = { x, y };
                }
                return false;
            });
            if (best) break;
        }

        return best;
    }

    function isPierFishingApproachTile(context = {}, standX, standY, targetX, targetY, z = getPlayerPlane(context)) {
        const mapSize = getMapSize(context);
        if (!isPierDeckTile(context, standX, standY, z)) return false;
        if (standX < 0 || standY < 0 || targetX < 0 || targetY < 0 || standX >= mapSize || standY >= mapSize || targetX >= mapSize || targetY >= mapSize) return false;
        if (typeof context.isWaterTileId !== 'function' || !context.isWaterTileId(context.logicalMap[z][targetY][targetX])) return false;
        return (Math.abs(standX - targetX) + Math.abs(standY - targetY)) === 1;
    }

    function buildPierStepDescendPath(context = {}, startX, startY, targetX, targetY, z = getPlayerPlane(context)) {
        const windowRef = getWindowRef(context);
        const mapSize = getMapSize(context);
        const pierConfig = getActivePierConfig(context);
        if (!pierConfig || z !== 0) return null;
        if (!isPierDeckTile(context, startX, startY, z)) return null;

        const stairDeckY = pierConfig.yStart;
        const stairX = Math.max(pierConfig.xMin, Math.min(pierConfig.xMax, targetX));
        const shoreCandidates = [pierConfig.entryY, pierConfig.yStart - 1, pierConfig.entryY - 1];
        let shoreY = null;
        for (let i = 0; i < shoreCandidates.length; i++) {
            const candidateY = shoreCandidates[i];
            if (!Number.isInteger(candidateY) || candidateY < 0 || candidateY >= mapSize) continue;
            if (candidateY === stairDeckY) continue;
            if (typeof context.isStandableTile === 'function' && context.isStandableTile(stairX, candidateY, z)) {
                shoreY = candidateY;
                break;
            }
        }
        if (!Number.isInteger(shoreY)) return null;

        let pathToStair = typeof context.findPath === 'function'
            ? context.findPath(startX, startY, stairX, stairDeckY, false, null)
            : [];
        let stairXNow = startX;
        let stairYNow = startY;
        if (Array.isArray(pathToStair) && pathToStair.length > 0) {
            const last = pathToStair[pathToStair.length - 1];
            stairXNow = last.x;
            stairYNow = last.y;
        } else {
            pathToStair = [];
        }

        if (!(stairXNow === stairX && stairYNow === stairDeckY)) {
            if (!(startX === stairX && startY === stairDeckY)) return null;
            stairXNow = stairX;
            stairYNow = stairDeckY;
        }

        if ((Math.abs(stairXNow - stairX) + Math.abs(stairYNow - shoreY)) !== 1) return null;

        const finalPath = pathToStair.slice();
        finalPath.push({ x: stairX, y: shoreY });
        if (windowRef.QA_PIER_DEBUG) emitPierDebug(context, `stair fallback step start=(${startX},${startY}) -> deck=(${stairX},${stairDeckY}) -> shore=(${stairX},${shoreY})`);
        return finalPath;
    }

    function isPierProtectedWaterTile(context = {}, x, y, z = getPlayerPlane(context)) {
        const runtime = getWorldPierRuntime(context);
        const pierConfig = getActivePierConfig(context);
        if (runtime && typeof runtime.isPierSideWaterTile === 'function') {
            return runtime.isPierSideWaterTile(pierConfig, x, y, z);
        }
        return !!(
            pierConfig
            && z === 0
            && y >= (pierConfig.yStart + 1)
            && y <= pierConfig.yEnd
            && (x === (pierConfig.xMin - 1) || x === (pierConfig.xMax + 1))
        );
    }

    window.InputPierInteractionRuntime = {
        getActivePierConfig,
        emitPierDebug,
        isPierDeckTile,
        isNearPierBoundsTile,
        findNearestPierDeckBoardingTile,
        forEachTileInSearchRing,
        hasPierFishingApproachForWaterTile,
        hasDryFishingApproachForWaterTile,
        findNearestFishableWaterEdgeTile,
        isPierFishingApproachTile,
        buildPierStepDescendPath,
        isPierProtectedWaterTile
    };
})();
