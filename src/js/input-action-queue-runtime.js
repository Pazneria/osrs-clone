(function () {
    function cancelManualFiremakingChain(context = {}) {
        const playerState = context.playerState;
        if (!playerState || playerState.action !== 'SKILLING: FIREMAKING') return false;

        playerState.firemakingSession = null;
        playerState.pendingSkillStart = null;
        playerState.path = [];
        playerState.pendingActionAfterTurn = null;
        playerState.turnLock = false;
        playerState.actionVisualReady = true;
        playerState.action = 'IDLE';
        if (typeof context.addChatMessage === 'function') {
            context.addChatMessage('You stop lighting the logs.', 'info');
        }
        return true;
    }

    function hasCombatSelection(playerState) {
        return !!(playerState && (
            playerState.lockedTargetId
            || playerState.combatTargetKind === 'enemy'
            || playerState.targetObj === 'ENEMY'
            || playerState.inCombat
        ));
    }

    function clearCombatSelectionForQueuedAction(context = {}, type, obj) {
        const playerState = context.playerState;
        const clearPlayerCombatTarget = context.clearPlayerCombatTarget;
        if (!hasCombatSelection(playerState) || typeof clearPlayerCombatTarget !== 'function') return false;

        if (type === 'WALK') {
            clearPlayerCombatTarget({ force: true, reason: 'queue-walk' });
            return true;
        }
        if (type === 'INTERACT' && obj !== 'ENEMY') {
            clearPlayerCombatTarget({ force: true, reason: 'queue-interact-non-enemy' });
            return true;
        }
        return false;
    }

    function syncMinimapDestinationForQueuedAction(context = {}, type, gridX, gridY) {
        const playerState = context.playerState || {};
        if (type === 'WALK') {
            if (typeof context.setMinimapDestination === 'function') {
                context.setMinimapDestination(gridX, gridY, playerState.z);
            }
        } else if (typeof context.clearMinimapDestination === 'function') {
            context.clearMinimapDestination();
        }
    }

    function queueAction(context = {}, type, gridX, gridY, obj, targetUid = null) {
        if (!context.playerState) return null;

        cancelManualFiremakingChain(context);
        clearCombatSelectionForQueuedAction(context, type, obj);
        syncMinimapDestinationForQueuedAction(context, type, gridX, gridY);

        return { type, x: gridX, y: gridY, obj, targetUid };
    }

    window.InputActionQueueRuntime = {
        cancelManualFiremakingChain,
        clearCombatSelectionForQueuedAction,
        syncMinimapDestinationForQueuedAction,
        queueAction
    };
})();
