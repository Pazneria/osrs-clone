(function () {
    const DEFAULT_PLAYER_TARGET_ID = 'player';

    function resolveFacingYaw(fromTile, toTile) {
        if (!fromTile || !toTile) return null;
        const dx = toTile.x - fromTile.x;
        const dy = toTile.y - fromTile.y;
        if (dx === 0 && dy === 0) return null;
        return Math.atan2(dx, dy);
    }

    function facePlayerTowards(context = {}, tile) {
        const playerState = context.playerState || null;
        if (!playerState || !tile) return false;
        const targetRotation = resolveFacingYaw(playerState, tile);
        if (!Number.isFinite(targetRotation)) return false;
        playerState.targetRotation = targetRotation;
        return true;
    }

    function faceEnemyTowards(enemyState, tile) {
        if (!enemyState || !tile) return false;
        const facingYaw = resolveFacingYaw(enemyState, tile);
        if (!Number.isFinite(facingYaw)) return false;
        enemyState.facingYaw = facingYaw;
        return true;
    }

    function isPlayerCombatFacingReady(context = {}) {
        const playerState = context.playerState || null;
        if (!playerState) return false;
        if (playerState.midX !== null || playerState.midY !== null) return false;
        if (playerState.x !== playerState.prevX || playerState.y !== playerState.prevY) return false;
        if (Array.isArray(playerState.path) && playerState.path.length > 0) return false;
        return true;
    }

    function syncMeleeCombatFacing(context = {}) {
        const isPlayerAlive = typeof context.isPlayerAlive === 'function'
            ? context.isPlayerAlive
            : () => true;
        if (!isPlayerAlive()) return false;
        if (!isPlayerCombatFacingReady(context)) return false;

        const playerState = context.playerState || null;
        const playerTargetId = context.playerTargetId || DEFAULT_PLAYER_TARGET_ID;
        const resolveCombatHudFocusEnemy = typeof context.resolveCombatHudFocusEnemy === 'function'
            ? context.resolveCombatHudFocusEnemy
            : () => null;
        const isEnemyAlive = typeof context.isEnemyAlive === 'function'
            ? context.isEnemyAlive
            : (enemyState) => !!enemyState;
        const combatEnemyStates = Array.isArray(context.combatEnemyStates) ? context.combatEnemyStates : [];

        if (!playerState) return false;
        const focus = resolveCombatHudFocusEnemy();
        const focusEnemy = focus && focus.enemyState ? focus.enemyState : null;
        if (playerState.inCombat && focusEnemy && focusEnemy.z === playerState.z) {
            facePlayerTowards(context, focusEnemy);
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) continue;
            if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== playerTargetId) continue;
            if (enemyState.z !== playerState.z) continue;
            faceEnemyTowards(enemyState, playerState);
        }
        return true;
    }

    window.CombatFacingRuntime = {
        resolveFacingYaw,
        facePlayerTowards,
        faceEnemyTowards,
        isPlayerCombatFacingReady,
        syncMeleeCombatFacing
    };
})();
