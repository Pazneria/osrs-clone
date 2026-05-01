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

    function normalizeRaycastHit(context, hit) {
        if (!context || !hit || !hit.object || !hit.object.userData) return null;
        const windowRef = getWindowRef(context);
        const playerState = context.playerState || {};
        let data = hit.object.userData;
        if (hit.instanceId !== undefined && hit.object.userData.instanceMap) {
            data = hit.object.userData.instanceMap[hit.instanceId];
        }
        if (!data || data.z !== getPlayerPlane(context)) return null;

        if (data.type === 'GROUND' || data.type === 'WALL' || data.type === 'TOWER' || data.type === 'WATER') {
            let gridX = Math.floor(hit.point.x + 0.5);
            let gridY = Math.floor(hit.point.z + 0.5);
            const mapSize = getMapSize(context);
            if (gridX >= 0 && gridX < mapSize && gridY >= 0 && gridY < mapSize) {
                let resolvedType = data.type;
                let pierStepDescend = false;
                const rawWaterHit = data.type === 'WATER';
                const playerOnPierDeck = typeof context.isPierDeckTile === 'function'
                    && context.isPierDeckTile(playerState.x, playerState.y, playerState.z);
                if (resolvedType === 'WATER') {
                    const tile = context.logicalMap[playerState.z][gridY][gridX];
                    let snappedBoardTile = null;

                    if (typeof context.isWaterTileId === 'function'
                        && typeof context.isWalkableTileId === 'function'
                        && !context.isWaterTileId(tile)
                        && context.isWalkableTileId(tile)) {
                        resolvedType = 'GROUND';
                    } else if (!playerOnPierDeck && typeof context.findNearestPierDeckBoardingTile === 'function') {
                        snappedBoardTile = context.findNearestPierDeckBoardingTile(gridX, gridY, playerState.z);
                        if (snappedBoardTile) {
                            resolvedType = 'GROUND';
                            gridX = snappedBoardTile.x;
                            gridY = snappedBoardTile.y;
                        }
                    }

                    if (windowRef.QA_PIER_DEBUG
                        && typeof context.isNearPierBoundsTile === 'function'
                        && typeof context.emitPierDebug === 'function'
                        && context.isNearPierBoundsTile(gridX, gridY, playerState.z, 3)) {
                        context.emitPierDebug(`ray raw=WATER tile=${tile} resolved=${resolvedType} hit=(${Math.floor(hit.point.x * 100) / 100},${Math.floor(hit.point.z * 100) / 100}) grid=(${gridX},${gridY}) snap=${snappedBoardTile ? `${snappedBoardTile.x},${snappedBoardTile.y}` : 'none'}`);
                    }
                }

                const pierConfig = typeof context.getActivePierConfig === 'function'
                    ? context.getActivePierConfig()
                    : null;
                const stairBandMinY = pierConfig ? Math.min(pierConfig.entryY, pierConfig.yStart) - 1 : 0;
                const stairBandMaxY = pierConfig ? Math.max(pierConfig.entryY, pierConfig.yStart) + 1 : 0;
                const canDescendViaPierStep = !!(
                    pierConfig
                    && playerState.z === 0
                    && playerOnPierDeck
                    && gridX >= (pierConfig.xMin - 1)
                    && gridX <= (pierConfig.xMax + 1)
                    && gridY >= stairBandMinY
                    && gridY <= stairBandMaxY
                    && (data.isPierStep || rawWaterHit)
                    && typeof context.isStandableTile === 'function'
                    && context.isStandableTile(
                        Math.max(pierConfig.xMin, Math.min(pierConfig.xMax, gridX)),
                        pierConfig.entryY,
                        playerState.z
                    )
                );
                if (canDescendViaPierStep) {
                    const snappedX = Math.max(pierConfig.xMin, Math.min(pierConfig.xMax, gridX));
                    const fromY = gridY;
                    const fromX = gridX;
                    gridX = snappedX;
                    gridY = pierConfig.entryY;
                    resolvedType = 'GROUND';
                    pierStepDescend = true;
                    if (windowRef.QA_PIER_DEBUG && typeof context.emitPierDebug === 'function') {
                        context.emitPierDebug(`stair descend snap (${fromX},${fromY}) -> (${gridX},${gridY}) source=${data.isPierStep ? 'step' : 'water'}`);
                    }
                }
                return { type: resolvedType, gridX, gridY, point: hit.point, pierStepDescend };
            }
            return null;
        }
        if (data.type === 'DOOR') {
            return { type: data.type, gridX: data.gridX, gridY: data.gridY, point: hit.point, doorObj: data.doorObj };
        }
        return {
            type: data.type,
            gridX: data.gridX,
            gridY: data.gridY,
            point: hit.point,
            name: data.name,
            combatLevel: data.combatLevel,
            uid: data.uid
        };
    }

    function getRaycastHitKey(hitData) {
        if (!hitData) return null;
        if (hitData.uid !== undefined && hitData.uid !== null) return `${hitData.type}:uid:${hitData.uid}`;
        if (hitData.type === 'DOOR' && hitData.doorObj) return `${hitData.type}:door:${hitData.gridX},${hitData.gridY}`;
        if (Number.isInteger(hitData.gridX) && Number.isInteger(hitData.gridY)) {
            return `${hitData.type}:${hitData.gridX},${hitData.gridY}:${hitData.name || ''}`;
        }
        return `${hitData.type}:${hitData.name || ''}`;
    }

    function getRaycastHits(context, clientX, clientY, maxHits = 16) {
        if (!context || !context.camera || !context.mouse || !context.raycaster) return [];
        const windowRef = getWindowRef(context);
        if (context.camera && typeof context.camera.updateMatrixWorld === 'function') context.camera.updateMatrixWorld(true);
        context.mouse.x = (clientX / windowRef.innerWidth) * 2 - 1;
        context.mouse.y = -(clientY / windowRef.innerHeight) * 2 + 1;
        context.raycaster.setFromCamera(context.mouse, context.camera);
        const intersects = context.raycaster.intersectObjects(context.environmentMeshes || []);
        const hits = [];
        const seen = new Set();
        for (let i = 0; i < intersects.length; i++) {
            const hitData = normalizeRaycastHit(context, intersects[i]);
            if (!hitData) continue;
            const key = getRaycastHitKey(hitData);
            if (key && seen.has(key)) continue;
            if (key) seen.add(key);
            hits.push(hitData);
            if (hits.length >= maxHits) break;
        }
        return hits;
    }

    function getRaycastHitPriority(hitData) {
        if (!hitData || !hitData.type) return 100;
        if (hitData.type === 'ENEMY') return 0;
        if (hitData.type === 'NPC') return 1;
        if (hitData.type === 'GROUND_ITEM') return 2;
        if (hitData.type === 'DOOR') return 3;
        if (hitData.type === 'BANK_BOOTH' || hitData.type === 'SHOP_COUNTER') return 4;
        if (hitData.type === 'TREE' || hitData.type === 'ROCK' || hitData.type === 'FISHING_SPOT' || hitData.type === 'WATER' || hitData.type === 'FIRE') return 5;
        return 20;
    }

    function getRaycastHit(context, clientX, clientY) {
        const hits = getRaycastHits(context, clientX, clientY, 12);
        if (hits.length <= 1) return hits.length > 0 ? hits[0] : null;
        let best = hits[0];
        let bestPriority = getRaycastHitPriority(best);
        for (let i = 1; i < hits.length; i++) {
            const priority = getRaycastHitPriority(hits[i]);
            if (priority < bestPriority) {
                best = hits[i];
                bestPriority = priority;
            }
        }
        return best;
    }

    function listQaRaycastHitsAt(context, clientX, clientY, maxHits = 12) {
        const x = Number(clientX);
        const y = Number(clientY);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
        const limit = Number.isFinite(maxHits) ? Math.max(1, Math.min(24, Math.floor(maxHits))) : 12;
        return getRaycastHits(context, x, y, limit).map((hitData, index) => ({
            index,
            type: hitData && hitData.type ? hitData.type : 'UNKNOWN',
            name: hitData && hitData.name ? hitData.name : '',
            uid: hitData && hitData.uid !== undefined && hitData.uid !== null ? String(hitData.uid) : '',
            gridX: hitData && Number.isInteger(hitData.gridX) ? hitData.gridX : null,
            gridY: hitData && Number.isInteger(hitData.gridY) ? hitData.gridY : null,
            priority: getRaycastHitPriority(hitData)
        }));
    }

    function findQaRaycastHitNear(context, clientX, clientY, type, name = '', radius = 80, step = 8) {
        const windowRef = getWindowRef(context);
        const centerX = Number(clientX);
        const centerY = Number(clientY);
        if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) return null;
        const wantedType = String(type || '').trim().toUpperCase();
        const wantedName = String(name || '').trim().toLowerCase();
        const searchRadius = Math.max(0, Math.min(180, Math.floor(Number.isFinite(radius) ? radius : 80)));
        const searchStep = Math.max(2, Math.min(24, Math.floor(Number.isFinite(step) ? step : 8)));
        let best = null;
        for (let dy = -searchRadius; dy <= searchRadius; dy += searchStep) {
            for (let dx = -searchRadius; dx <= searchRadius; dx += searchStep) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x < 0 || y < 0 || x > windowRef.innerWidth || y > windowRef.innerHeight) continue;
                const hits = getRaycastHits(context, x, y, 8);
                for (let i = 0; i < hits.length; i++) {
                    const hit = hits[i];
                    if (!hit) continue;
                    if (wantedType && String(hit.type || '').toUpperCase() !== wantedType) continue;
                    if (wantedName && !String(hit.name || '').toLowerCase().includes(wantedName)) continue;
                    const dist = Math.sqrt((dx * dx) + (dy * dy));
                    if (!best || dist < best.distance) {
                        best = {
                            x: Math.round(x),
                            y: Math.round(y),
                            distance: Number(dist.toFixed(2)),
                            type: hit.type || 'UNKNOWN',
                            name: hit.name || '',
                            uid: hit.uid !== undefined && hit.uid !== null ? String(hit.uid) : '',
                            gridX: Number.isInteger(hit.gridX) ? hit.gridX : null,
                            gridY: Number.isInteger(hit.gridY) ? hit.gridY : null
                        };
                    }
                }
            }
        }
        return best;
    }

    function resolvePublishedRaycastContext(options) {
        if (!options) return {};
        if (typeof options.buildContext === 'function') {
            const context = options.buildContext();
            return context && typeof context === 'object' ? context : {};
        }
        return options.context && typeof options.context === 'object' ? options.context : {};
    }

    function publishQaRaycastHooks(options = {}) {
        const windowRef = options.windowRef || window;
        const listHitsAt = listQaRaycastHitsAt;
        const findHitNear = findQaRaycastHitNear;
        windowRef.listQaRaycastHitsAt = function listQaRaycastHitsAt(clientX, clientY, maxHits = 12) {
            return listHitsAt(resolvePublishedRaycastContext(options), clientX, clientY, maxHits);
        };
        windowRef.findQaRaycastHitNear = function findQaRaycastHitNear(clientX, clientY, type, name = '', radius = 80, step = 8) {
            return findHitNear(resolvePublishedRaycastContext(options), clientX, clientY, type, name, radius, step);
        };
    }

    window.InputRaycastRuntime = {
        normalizeRaycastHit,
        getRaycastHitKey,
        getRaycastHits,
        getRaycastHitPriority,
        getRaycastHit,
        listQaRaycastHitsAt,
        findQaRaycastHitNear,
        publishQaRaycastHooks
    };
})();
