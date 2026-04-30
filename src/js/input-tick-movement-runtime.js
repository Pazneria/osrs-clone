(function () {
    function getWindowRef(context) {
        return context && context.windowRef ? context.windowRef : window;
    }

    function resetTransientActionState(playerState) {
        playerState.pendingActionAfterTurn = null;
        playerState.turnLock = false;
        playerState.actionVisualReady = true;
    }

    function applyPendingAction(context, pendingAction) {
        if (!context || !context.playerState || !pendingAction) return null;
        const windowRef = getWindowRef(context);
        const playerState = context.playerState;
        let actionX = pendingAction.x;
        let actionY = pendingAction.y;

        if (pendingAction.type === 'INTERACT'
            && pendingAction.obj === 'WATER'
            && typeof context.findNearestFishableWaterEdgeTile === 'function') {
            const edgeWater = context.findNearestFishableWaterEdgeTile(pendingAction.x, pendingAction.y);
            if (edgeWater) {
                actionX = edgeWater.x;
                actionY = edgeWater.y;
            }
        }

        playerState.targetX = actionX;
        playerState.targetY = actionY;
        if (pendingAction.type === 'WALK') {
            playerState.pendingSkillStart = null;
            playerState.pendingInteractAfterFletchingWalk = null;
            const stairDescendPath = pendingAction.obj === 'PIER_STEP_DESCEND'
                && typeof context.buildPierStepDescendPath === 'function'
                ? context.buildPierStepDescendPath(playerState.x, playerState.y, actionX, actionY, playerState.z)
                : null;
            playerState.path = stairDescendPath || context.findPath(playerState.x, playerState.y, actionX, actionY, false);

            if (playerState.path.length === 0 && pendingAction.obj === 'PIER_STEP_DESCEND') {
                const z = playerState.z;
                const onPierDeck = typeof context.isPierDeckTile === 'function' && context.isPierDeckTile(playerState.x, playerState.y, z);
                const targetStandable = typeof context.isStandableTile === 'function' && context.isStandableTile(actionX, actionY, z);
                if (windowRef.QA_PIER_DEBUG && typeof context.emitPierDebug === 'function') {
                    context.emitPierDebug(`stair fallback blocked onDeck=${onPierDeck} standable=${targetStandable}`);
                }
            }

            if (windowRef.QA_PIER_DEBUG
                && playerState.path.length === 0
                && typeof context.isNearPierBoundsTile === 'function'
                && typeof context.emitPierDebug === 'function') {
                const nearPier = context.isNearPierBoundsTile(playerState.x, playerState.y, playerState.z, 3)
                    || context.isNearPierBoundsTile(actionX, actionY, playerState.z, 3);
                if (nearPier) {
                    const z = playerState.z;
                    const startTile = context.logicalMap[z][playerState.y][playerState.x];
                    const targetTile = context.logicalMap[z][actionY][actionX];
                    const startH = context.heightMap[z][playerState.y][playerState.x];
                    const targetH = context.heightMap[z][actionY][actionX];
                    context.emitPierDebug(`walk path empty start=(${playerState.x},${playerState.y}) t=${startTile} h=${startH.toFixed(2)} target=(${actionX},${actionY}) t=${targetTile} h=${targetH.toFixed(2)} standable=${context.isStandableTile(actionX, actionY, z)}`);
                }
            }
            if (playerState.path.length === 0 && typeof context.clearMinimapDestination === 'function') context.clearMinimapDestination();
            resetTransientActionState(playerState);
            const keepFletchingAction = playerState.action === 'SKILLING: FLETCHING'
                && typeof context.hasActiveFletchingProcessingSession === 'function'
                && context.hasActiveFletchingProcessingSession();
            playerState.action = keepFletchingAction
                ? 'SKILLING: FLETCHING'
                : (playerState.path.length > 0 ? 'WALKING' : 'IDLE');
        } else if (pendingAction.type === 'INTERACT') {
            if (pendingAction.obj === 'ENEMY') {
                playerState.pendingSkillStart = null;
                playerState.pendingInteractAfterFletchingWalk = null;
                playerState.path = [];
                resetTransientActionState(playerState);
                playerState.targetObj = 'ENEMY';
                playerState.targetUid = pendingAction.targetUid;
                let enemyRuntimeId = null;
                if (pendingAction.targetUid && typeof pendingAction.targetUid === 'object') {
                    if (Number.isInteger(pendingAction.targetUid.enemyX)) playerState.targetX = pendingAction.targetUid.enemyX;
                    if (Number.isInteger(pendingAction.targetUid.enemyY)) playerState.targetY = pendingAction.targetUid.enemyY;
                    enemyRuntimeId = String(pendingAction.targetUid.enemyId || '').trim();
                } else if (typeof pendingAction.targetUid === 'string') {
                    enemyRuntimeId = pendingAction.targetUid.trim();
                }
                if (enemyRuntimeId && typeof context.lockPlayerCombatTarget === 'function') {
                    context.lockPlayerCombatTarget(enemyRuntimeId);
                }
                playerState.action = 'IDLE';
            } else {
                const forceAdjacent = pendingAction.obj !== 'GROUND_ITEM';
                playerState.path = context.findPath(playerState.x, playerState.y, actionX, actionY, forceAdjacent, pendingAction.obj);
                resetTransientActionState(playerState);
                const keepFletchingAction = playerState.action === 'SKILLING: FLETCHING'
                    && typeof context.hasActiveFletchingProcessingSession === 'function'
                    && context.hasActiveFletchingProcessingSession();

                let pendingSkillStart = playerState.pendingSkillStart || null;
                const skillRuntime = context.skillRuntime || null;
                if (skillRuntime
                    && typeof skillRuntime.canHandleTarget === 'function'
                    && skillRuntime.canHandleTarget(pendingAction.obj)
                    && pendingAction.targetUid
                    && typeof pendingAction.targetUid === 'object'
                    && typeof pendingAction.targetUid.skillId === 'string') {
                    pendingSkillStart = Object.assign({}, pendingAction.targetUid, {
                        targetObj: pendingAction.obj,
                        targetX: actionX,
                        targetY: actionY,
                        targetZ: playerState.z
                    });
                } else if (pendingSkillStart && pendingSkillStart.targetObj === pendingAction.obj) {
                    pendingSkillStart = Object.assign({}, pendingSkillStart, {
                        targetX: actionX,
                        targetY: actionY,
                        targetZ: playerState.z
                    });
                }
                if (keepFletchingAction) {
                    playerState.pendingInteractAfterFletchingWalk = {
                        targetObj: pendingAction.obj,
                        targetUid: pendingAction.targetUid,
                        targetX: actionX,
                        targetY: actionY,
                        targetZ: playerState.z
                    };
                    playerState.pendingSkillStart = pendingSkillStart;
                    playerState.action = 'SKILLING: FLETCHING';
                    playerState.targetObj = pendingAction.obj;
                    playerState.targetUid = pendingAction.targetUid;
                } else {
                    playerState.pendingInteractAfterFletchingWalk = null;
                    playerState.pendingSkillStart = pendingSkillStart;
                    playerState.action = 'WALKING_TO_INTERACT';
                    playerState.targetObj = pendingAction.obj;
                    playerState.targetUid = pendingAction.targetUid;
                }
            }
        }

        return null;
    }

    function advancePlayerMovement(context) {
        if (!context || !context.playerState || !Array.isArray(context.playerState.path)) return false;
        const playerState = context.playerState;
        if (playerState.path.length <= 0) return false;
        const stepsToTake = context.isRunning ? 2 : 1;
        const nextStep = playerState.path.shift();
        if (stepsToTake === 2 && playerState.path.length > 0) {
            playerState.midX = nextStep.x;
            playerState.midY = nextStep.y;
            const finalStep = playerState.path.shift();
            playerState.x = finalStep.x;
            playerState.y = finalStep.y;
        } else {
            playerState.x = nextStep.x;
            playerState.y = nextStep.y;
        }
        if (context.isBankOpen && typeof context.closeBank === 'function') context.closeBank();
        return true;
    }

    window.InputTickMovementRuntime = {
        applyPendingAction,
        advancePlayerMovement,
        resetTransientActionState
    };
})();
