(function () {
    function getRockNodes(context = {}) {
        return context.rockNodes || {};
    }

    function getRockNodeRuntime(context = {}) {
        return context.rockNodeRuntime || window.WorldRockNodeRuntime || null;
    }

    function getRockNodeKey(context = {}, x, y, z) {
        const runtime = getRockNodeRuntime(context);
        return runtime && typeof runtime.rockNodeKey === 'function'
            ? runtime.rockNodeKey(x, y, z)
            : z + ':' + x + ',' + y;
    }

    function resolveGateOverride(context = {}, x, y, z) {
        const overrides = context.rockAreaGateOverrides || null;
        if (!overrides) return null;
        const key = getRockNodeKey(context, x, y, z);
        return overrides[key] || null;
    }

    function resolveOreType(context = {}, x, y, z) {
        const runtime = getRockNodeRuntime(context);
        if (!runtime || typeof runtime.oreTypeForTile !== 'function') return 'clay';
        return runtime.oreTypeForTile({
            x,
            y,
            z,
            rockOreOverrides: context.rockOreOverrides,
            runeEssenceRocks: context.runeEssenceRocks
        });
    }

    function createRockNodeRecord(context = {}, x, y, z, previous = null) {
        const gateOverride = resolveGateOverride(context, x, y, z);
        return {
            oreType: previous && previous.oreType ? previous.oreType : resolveOreType(context, x, y, z),
            depletedUntilTick: previous && previous.depletedUntilTick ? previous.depletedUntilTick : 0,
            successfulYields: previous && Number.isFinite(previous.successfulYields) ? Math.max(0, Math.floor(previous.successfulYields)) : 0,
            lastInteractionTick: previous && Number.isFinite(previous.lastInteractionTick) ? Math.max(0, Math.floor(previous.lastInteractionTick)) : 0,
            areaGateFlag: previous && previous.areaGateFlag ? previous.areaGateFlag : (gateOverride && gateOverride.areaGateFlag ? gateOverride.areaGateFlag : null),
            areaName: previous && previous.areaName ? previous.areaName : (gateOverride && gateOverride.areaName ? gateOverride.areaName : null),
            areaGateMessage: previous && previous.areaGateMessage ? previous.areaGateMessage : (gateOverride && gateOverride.areaGateMessage ? gateOverride.areaGateMessage : null)
        };
    }

    function rebuildRockNodes(context = {}) {
        const rebuilt = {};
        const logicalMap = context.logicalMap || [];
        const existingRockNodes = getRockNodes(context);
        const planes = Number.isFinite(context.planes) ? context.planes : 0;
        const mapSize = Number.isFinite(context.mapSize) ? context.mapSize : 0;
        const rockTileId = context.tileIds && Number.isFinite(context.tileIds.ROCK) ? context.tileIds.ROCK : null;
        for (let z = 0; z < planes; z++) {
            for (let y = 0; y < mapSize; y++) {
                for (let x = 0; x < mapSize; x++) {
                    const tile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
                    if (tile !== rockTileId) continue;
                    const key = getRockNodeKey(context, x, y, z);
                    rebuilt[key] = createRockNodeRecord(context, x, y, z, existingRockNodes[key]);
                }
            }
        }
        return rebuilt;
    }

    function getRockNodeAt(context = {}, x, y, z = 0) {
        const mapSize = Number.isFinite(context.mapSize) ? context.mapSize : 0;
        if (x < 0 || y < 0 || x >= mapSize || y >= mapSize) return null;
        const logicalMap = context.logicalMap || [];
        const rockTileId = context.tileIds && Number.isFinite(context.tileIds.ROCK) ? context.tileIds.ROCK : null;
        if (!logicalMap[z] || !logicalMap[z][y] || logicalMap[z][y][x] !== rockTileId) return null;
        const rockNodes = getRockNodes(context);
        const key = getRockNodeKey(context, x, y, z);
        if (!rockNodes[key]) rockNodes[key] = createRockNodeRecord(context, x, y, z);
        return rockNodes[key];
    }

    function isRockNodeDepleted(context = {}, x, y, z = 0) {
        const node = getRockNodeAt(context, x, y, z);
        return !!(node && node.depletedUntilTick > context.currentTick);
    }

    function refreshChunkByKey(context = {}, chunkKey) {
        if (typeof chunkKey !== 'string') return false;
        const runtime = typeof context.getWorldChunkSceneRuntime === 'function'
            ? context.getWorldChunkSceneRuntime()
            : null;
        if (!runtime || typeof runtime.isNearChunkLoaded !== 'function' || !runtime.isNearChunkLoaded(chunkKey)) return false;
        const parts = chunkKey.split(',');
        const cx = parseInt(parts[0], 10);
        const cy = parseInt(parts[1], 10);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) return false;
        const wasInteractive = typeof runtime.getChunkInteractionState === 'function'
            ? runtime.getChunkInteractionState(chunkKey)
            : true;
        if (typeof context.unloadChunk === 'function') context.unloadChunk(chunkKey);
        if (typeof context.loadChunk === 'function') context.loadChunk(cx, cy, wasInteractive);
        return true;
    }

    function refreshChunkAtTile(context = {}, x, y) {
        const chunkSize = Number.isFinite(context.chunkSize) ? context.chunkSize : 1;
        const chunkKey = Math.floor(x / chunkSize) + ',' + Math.floor(y / chunkSize);
        return refreshChunkByKey(context, chunkKey);
    }

    function depleteRockNode(context = {}, x, y, z = 0, respawnTicks = 12) {
        const runtime = getRockNodeRuntime(context);
        const node = getRockNodeAt(context, x, y, z);
        if (!node || !runtime || typeof runtime.depleteRockNodeRecord !== 'function') return false;
        runtime.depleteRockNodeRecord(node, context.currentTick, respawnTicks);
        refreshChunkAtTile(context, x, y);
        return true;
    }

    function tickRockNodes(context = {}) {
        const runtime = getRockNodeRuntime(context);
        if (!runtime || typeof runtime.tickRockNodeRespawns !== 'function') return 0;
        const chunksToRefresh = runtime.tickRockNodeRespawns({
            rockNodes: getRockNodes(context),
            currentTick: context.currentTick,
            chunkSize: context.chunkSize
        });
        let refreshed = 0;
        chunksToRefresh.forEach((chunkKey) => {
            if (refreshChunkByKey(context, chunkKey)) refreshed++;
        });
        return refreshed;
    }

    window.WorldRockLifecycleRuntime = {
        createRockNodeRecord,
        depleteRockNode,
        getRockNodeAt,
        isRockNodeDepleted,
        rebuildRockNodes,
        refreshChunkAtTile,
        tickRockNodes
    };
})();
