(function () {
    const DEFAULT_RESPAWN = { x: 205, y: 210, z: 0 };
    const DEFAULT_DEFEAT_MESSAGE = 'You were defeated and return to safety.';

    function clonePoint(point) {
        return {
            x: Number.isFinite(point && point.x) ? Math.floor(point.x) : 0,
            y: Number.isFinite(point && point.y) ? Math.floor(point.y) : 0,
            z: Number.isFinite(point && point.z) ? Math.floor(point.z) : 0
        };
    }

    function resolveRespawnLocation(context = {}) {
        const windowRef = context.windowRef || window;
        const worldId = typeof context.getCurrentWorldId === 'function'
            ? context.getCurrentWorldId()
            : null;
        const clone = typeof context.clonePoint === 'function' ? context.clonePoint : clonePoint;
        const adapter = windowRef && windowRef.LegacyWorldAdapterRuntime;
        if (adapter && typeof adapter.getWorldDefaultSpawn === 'function') {
            return clone(adapter.getWorldDefaultSpawn(worldId, {
                mapSize: context.mapSize,
                planes: context.planes
            }));
        }
        return clone(DEFAULT_RESPAWN);
    }

    function resolveMaxHitpoints(context = {}) {
        if (typeof context.getMaxHitpoints === 'function') {
            const maxHitpoints = context.getMaxHitpoints();
            if (Number.isFinite(maxHitpoints) && maxHitpoints > 0) return Math.floor(maxHitpoints);
        }
        const playerState = context.playerState || {};
        return Math.max(1, Math.floor(playerState.currentHitpoints || 10));
    }

    function resetPlayerState(context = {}, respawn, maxHitpoints) {
        const playerState = context.playerState || null;
        if (!playerState || !respawn) return false;
        playerState.currentHitpoints = maxHitpoints;
        playerState.remainingAttackCooldown = 0;
        playerState.lastDamagerEnemyId = null;
        playerState.eatingCooldownEndTick = 0;
        playerState.path = [];
        playerState.x = respawn.x;
        playerState.y = respawn.y;
        playerState.z = respawn.z;
        playerState.prevX = respawn.x;
        playerState.prevY = respawn.y;
        playerState.midX = null;
        playerState.midY = null;
        playerState.targetX = respawn.x;
        playerState.targetY = respawn.y;
        playerState.action = 'IDLE';
        playerState.turnLock = false;
        playerState.actionVisualReady = true;
        return true;
    }

    function returnPlayerLockedEnemies(context = {}) {
        const enemyStates = Array.isArray(context.combatEnemyStates) ? context.combatEnemyStates : [];
        const playerTargetId = context.playerTargetId || 'player';
        if (typeof context.beginEnemyReturn !== 'function') return 0;
        let returnedEnemyCount = 0;
        for (let i = 0; i < enemyStates.length; i++) {
            const enemyState = enemyStates[i];
            if (enemyState && enemyState.lockedTargetId === playerTargetId) {
                context.beginEnemyReturn(enemyState);
                returnedEnemyCount += 1;
            }
        }
        return returnedEnemyCount;
    }

    function applyPlayerDefeat(context = {}) {
        const respawn = resolveRespawnLocation(context);
        const maxHitpoints = resolveMaxHitpoints(context);
        const reset = resetPlayerState(context, respawn, maxHitpoints);
        if (!reset) return null;

        if (typeof context.clearPlayerCombatTarget === 'function') {
            context.clearPlayerCombatTarget({ force: true, reason: 'player-defeated' });
        }
        if (typeof context.clearMinimapDestination === 'function') {
            context.clearMinimapDestination();
        }
        if (typeof context.addChatMessage === 'function') {
            context.addChatMessage(context.playerDefeatMessage || DEFAULT_DEFEAT_MESSAGE, 'warn');
        }

        return {
            respawn,
            maxHitpoints,
            returnedEnemyCount: returnPlayerLockedEnemies(context)
        };
    }

    window.CombatPlayerDefeatRuntime = {
        resolveRespawnLocation,
        resolveMaxHitpoints,
        resetPlayerState,
        returnPlayerLockedEnemies,
        applyPlayerDefeat
    };
})();
