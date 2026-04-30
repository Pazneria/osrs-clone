(function () {
    function getCombatRuntime(context = {}) {
        return context.combatRuntime || window.CombatRuntime || null;
    }

    function getPlayerState(context = {}) {
        return context.playerState || {};
    }

    function getMaxHitpoints(context = {}) {
        const combatRuntime = getCombatRuntime(context);
        if (combatRuntime && typeof combatRuntime.computePlayerMaxHitpoints === 'function') {
            return combatRuntime.computePlayerMaxHitpoints(context.playerSkills || {});
        }
        const hitpoints = context.playerSkills && context.playerSkills.hitpoints;
        return hitpoints && Number.isFinite(hitpoints.level)
            ? Math.max(1, Math.floor(hitpoints.level))
            : 10;
    }

    function clampCurrentHitpoints(context = {}, currentHitpoints, maxHitpoints) {
        const combatRuntime = getCombatRuntime(context);
        if (combatRuntime && typeof combatRuntime.clampPlayerCurrentHitpoints === 'function') {
            return combatRuntime.clampPlayerCurrentHitpoints(currentHitpoints, maxHitpoints);
        }
        const resolvedMaxHitpoints = Number.isFinite(maxHitpoints) ? Math.max(1, Math.floor(maxHitpoints)) : 10;
        const resolvedHitpoints = Number.isFinite(currentHitpoints) ? Math.floor(currentHitpoints) : resolvedMaxHitpoints;
        return Math.max(0, Math.min(resolvedMaxHitpoints, resolvedHitpoints));
    }

    function getCurrentHitpoints(context = {}) {
        const playerState = getPlayerState(context);
        const maxHitpoints = getMaxHitpoints(context);
        playerState.currentHitpoints = clampCurrentHitpoints(context, playerState.currentHitpoints, maxHitpoints);
        return playerState.currentHitpoints;
    }

    function applyHitpointHealing(context = {}, healAmount) {
        const combatRuntime = getCombatRuntime(context);
        const playerState = getPlayerState(context);
        const maxHitpoints = getMaxHitpoints(context);
        if (combatRuntime && typeof combatRuntime.applyPlayerHitpointHealing === 'function') {
            const result = combatRuntime.applyPlayerHitpointHealing(playerState.currentHitpoints, maxHitpoints, healAmount);
            playerState.currentHitpoints = result.currentHitpoints;
            return result.healed;
        }
        const currentHitpoints = getCurrentHitpoints(context);
        const requestedHeal = Number.isFinite(healAmount) ? Math.max(0, Math.floor(healAmount)) : 0;
        const healed = Math.min(requestedHeal, Math.max(0, maxHitpoints - currentHitpoints));
        playerState.currentHitpoints = currentHitpoints + healed;
        return healed;
    }

    function applyHitpointDamage(context = {}, damageAmount, minHitpoints = 0) {
        const combatRuntime = getCombatRuntime(context);
        const playerState = getPlayerState(context);
        const maxHitpoints = getMaxHitpoints(context);
        if (combatRuntime && typeof combatRuntime.applyPlayerHitpointDamage === 'function') {
            const result = combatRuntime.applyPlayerHitpointDamage(playerState.currentHitpoints, maxHitpoints, damageAmount, minHitpoints);
            playerState.currentHitpoints = result.currentHitpoints;
            return result.dealt;
        }
        const currentHitpoints = getCurrentHitpoints(context);
        const requestedDamage = Number.isFinite(damageAmount) ? Math.max(0, Math.floor(damageAmount)) : 0;
        const minimum = Number.isFinite(minHitpoints)
            ? Math.max(0, Math.min(maxHitpoints, Math.floor(minHitpoints)))
            : 0;
        const dealt = Math.min(requestedDamage, Math.max(0, currentHitpoints - minimum));
        playerState.currentHitpoints = currentHitpoints - dealt;
        return dealt;
    }

    window.PlayerHitpointsRuntime = {
        applyHitpointDamage,
        applyHitpointHealing,
        getCurrentHitpoints,
        getMaxHitpoints
    };
})();
