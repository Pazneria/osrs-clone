(function() {
    function getChebyshevDistance(a, b) {
        if (!a || !b) return null;
        if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return null;
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    }

    function resolveCombatHudFocusEnemy(context = {}) {
        const playerState = context.playerState || {};
        const playerTargetId = context.playerTargetId || 'player';
        const getPlayerLockedEnemy = typeof context.getPlayerLockedEnemy === 'function'
            ? context.getPlayerLockedEnemy
            : null;
        const getCombatEnemyState = typeof context.getCombatEnemyState === 'function'
            ? context.getCombatEnemyState
            : null;
        const isEnemyAlive = typeof context.isEnemyAlive === 'function'
            ? context.isEnemyAlive
            : null;

        const lockedEnemy = getPlayerLockedEnemy ? getPlayerLockedEnemy() : null;
        if (lockedEnemy && (!isEnemyAlive || isEnemyAlive(lockedEnemy))) {
            return {
                enemyState: lockedEnemy,
                focusLabel: 'Target'
            };
        }

        const lastDamager = getCombatEnemyState ? getCombatEnemyState(playerState.lastDamagerEnemyId) : null;
        if (
            lastDamager
            && (!isEnemyAlive || isEnemyAlive(lastDamager))
            && (lastDamager.lockedTargetId === playerTargetId || lastDamager.currentState === 'aggroed')
        ) {
            return {
                enemyState: lastDamager,
                focusLabel: 'Aggressor'
            };
        }

        return {
            enemyState: null,
            focusLabel: 'Target'
        };
    }

    function buildCombatHudSnapshot(context = {}) {
        if (typeof context.ensureCombatEnemyWorldReady === 'function') {
            context.ensureCombatEnemyWorldReady();
        }

        const playerState = context.playerState || {};
        const getEnemyDefinition = typeof context.getEnemyDefinition === 'function'
            ? context.getEnemyDefinition
            : null;
        const isWithinMeleeRange = typeof context.isWithinMeleeRange === 'function'
            ? context.isWithinMeleeRange
            : null;
        const focus = resolveCombatHudFocusEnemy(context);
        const enemyState = focus.enemyState;
        const enemyType = enemyState && getEnemyDefinition ? getEnemyDefinition(enemyState.enemyId) : null;
        const enemyStats = enemyType && enemyType.stats ? enemyType.stats : {};

        return {
            inCombat: !!playerState.inCombat,
            playerRemainingAttackCooldown: Number.isFinite(playerState.remainingAttackCooldown)
                ? Math.max(0, Math.floor(playerState.remainingAttackCooldown))
                : 0,
            target: enemyState && enemyType
                ? {
                    label: enemyType.displayName || enemyState.enemyId,
                    focusLabel: focus.focusLabel,
                    currentHealth: Number.isFinite(enemyState.currentHealth) ? enemyState.currentHealth : enemyStats.hitpoints,
                    maxHealth: enemyStats.hitpoints,
                    remainingAttackCooldown: Number.isFinite(enemyState.remainingAttackCooldown)
                        ? Math.max(0, Math.floor(enemyState.remainingAttackCooldown))
                        : 0,
                    state: enemyState.currentState || '',
                    distance: getChebyshevDistance(playerState, enemyState),
                    inMeleeRange: isWithinMeleeRange ? isWithinMeleeRange(playerState, enemyState) : false
                }
                : null
        };
    }

    window.CombatHudRuntime = {
        resolveCombatHudFocusEnemy,
        buildCombatHudSnapshot,
        getChebyshevDistance
    };
})();
