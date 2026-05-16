(function () {
    let occupiedTiles = new Map();
    let occupancyDirty = true;

    function getTileKey(x, y, z = 0) {
        const resolvedZ = Number.isFinite(z) ? Math.floor(z) : 0;
        const resolvedX = Number.isFinite(x) ? Math.floor(x) : 0;
        const resolvedY = Number.isFinite(y) ? Math.floor(y) : 0;
        return `${resolvedZ}:${resolvedX}:${resolvedY}`;
    }

    function resolveSolidNpcTileId(context = {}) {
        if (Number.isFinite(context.solidNpcTileId)) return context.solidNpcTileId;
        const tileId = context.TileId || null;
        return tileId && Number.isFinite(tileId.SOLID_NPC) ? tileId.SOLID_NPC : null;
    }

    function clearEnemyOccupancy(context = {}) {
        const logicalMap = context.logicalMap || null;
        const solidNpcTileId = resolveSolidNpcTileId(context);
        occupiedTiles.forEach((baseTile, key) => {
            const parts = String(key).split(':');
            if (parts.length !== 3) return;
            const z = parseInt(parts[0], 10);
            const x = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (!logicalMap || !logicalMap[z] || !logicalMap[z][y]) return;
            if (logicalMap[z][y][x] === solidNpcTileId) logicalMap[z][y][x] = baseTile;
        });
        occupiedTiles.clear();
    }

    function markEnemyOccupancyDirty() {
        occupancyDirty = true;
    }

    function shouldOccupyEnemyTile(context = {}, enemyState) {
        if (typeof context.shouldEnemyOccupyTile === 'function') {
            return context.shouldEnemyOccupyTile(enemyState);
        }
        return !!enemyState;
    }

    function refreshEnemyOccupancy(context = {}) {
        if (!occupancyDirty) return false;
        const logicalMap = context.logicalMap || null;
        const combatEnemyStates = Array.isArray(context.combatEnemyStates) ? context.combatEnemyStates : [];
        const solidNpcTileId = resolveSolidNpcTileId(context);
        clearEnemyOccupancy(context);
        if (!logicalMap || !Number.isFinite(solidNpcTileId)) {
            occupancyDirty = false;
            return true;
        }
        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!shouldOccupyEnemyTile(context, enemyState)) continue;
            const z = enemyState.z;
            const x = enemyState.x;
            const y = enemyState.y;
            if (!logicalMap[z] || !logicalMap[z][y]) continue;
            const key = getTileKey(x, y, z);
            if (!occupiedTiles.has(key)) occupiedTiles.set(key, logicalMap[z][y][x]);
            logicalMap[z][y][x] = solidNpcTileId;
        }
        occupancyDirty = false;
        return true;
    }

    function getEnemyOccupiedBaseTileId(x, y, z = 0) {
        const key = getTileKey(x, y, z);
        return occupiedTiles.has(key) ? occupiedTiles.get(key) : null;
    }

    window.CombatEnemyOccupancyRuntime = {
        clearEnemyOccupancy,
        markEnemyOccupancyDirty,
        refreshEnemyOccupancy,
        getEnemyOccupiedBaseTileId
    };
})();
