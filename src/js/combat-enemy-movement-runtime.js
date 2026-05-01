(function () {
    function getCurrentTick(context = {}) {
        return Number.isFinite(context.currentTick) ? Math.floor(context.currentTick) : 0;
    }

    function rollInclusive(context = {}, minimum, maximum) {
        if (typeof context.rollInclusive === 'function') return context.rollInclusive(minimum, maximum);
        const low = Number.isFinite(minimum) ? Math.floor(minimum) : 0;
        const high = Number.isFinite(maximum) ? Math.floor(maximum) : low;
        if (high <= low) return Math.max(0, low);
        return low + Math.floor(Math.random() * ((high - low) + 1));
    }

    function getEnemyMoveClipHoldMs(context = {}) {
        return Number.isFinite(context.enemyMoveClipHoldMs)
            ? Math.max(0, Math.floor(context.enemyMoveClipHoldMs))
            : 780;
    }

    function clearEnemyIdleWanderState(context = {}, enemyState) {
        if (!enemyState) return;
        enemyState.idleDestination = null;
        enemyState.idleMoveReadyAtTick = getCurrentTick(context);
    }

    function clearEnemyLocomotionIntent(context = {}, enemyState) {
        if (!enemyState) return;
        enemyState.lastLocomotionIntentAt = 0;
        enemyState.locomotionIntentUntilAt = 0;
    }

    function markEnemyLocomotionIntent(context = {}, enemyState, holdMs = null) {
        if (!enemyState) return;
        const now = Date.now();
        const fallbackHoldMs = getEnemyMoveClipHoldMs(context);
        const safeHoldMs = Number.isFinite(holdMs) ? Math.max(0, Math.floor(holdMs)) : fallbackHoldMs;
        enemyState.lastLocomotionIntentAt = now;
        enemyState.locomotionIntentUntilAt = Math.max(
            Number.isFinite(enemyState.locomotionIntentUntilAt) ? enemyState.locomotionIntentUntilAt : 0,
            now + safeHoldMs
        );
    }

    function hasTrackedEnemyLocomotionIntent(context = {}, enemyState, frameNow) {
        if (!enemyState) return false;
        const intentUntilAt = Number.isFinite(enemyState.locomotionIntentUntilAt) ? enemyState.locomotionIntentUntilAt : 0;
        return intentUntilAt > 0 && frameNow < intentUntilAt;
    }

    function scheduleEnemyIdleWanderPause(context = {}, enemyState, minTicks = null, maxTicks = null) {
        if (!enemyState) return;
        const minimum = Number.isFinite(minTicks)
            ? Math.floor(minTicks)
            : (Number.isFinite(context.enemyIdleWanderPauseMinTicks) ? Math.floor(context.enemyIdleWanderPauseMinTicks) : 2);
        const maximum = Number.isFinite(maxTicks)
            ? Math.floor(maxTicks)
            : (Number.isFinite(context.enemyIdleWanderPauseMaxTicks) ? Math.floor(context.enemyIdleWanderPauseMaxTicks) : 5);
        enemyState.idleDestination = null;
        enemyState.idleMoveReadyAtTick = getCurrentTick(context) + rollInclusive(context, minimum, maximum);
        clearEnemyLocomotionIntent(context, enemyState);
    }

    function resolvePathToTile(context = {}, enemyState, targetTile, allowTargetOccupied = false, targetKind = null) {
        if (!enemyState || !targetTile) return null;
        if (enemyState.z !== targetTile.z) return null;
        if (enemyState.x === targetTile.x && enemyState.y === targetTile.y) return [];
        if (typeof context.findPath !== 'function') return null;
        const path = context.findPath(enemyState.x, enemyState.y, targetTile.x, targetTile.y, allowTargetOccupied, targetKind);
        return Array.isArray(path) && path.length > 0 ? path : null;
    }

    function resolvePathToEnemy(context = {}, enemyState, pathOptions = null) {
        const playerState = context.playerState || {};
        if (!enemyState || (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(enemyState))) return null;
        if (enemyState.z !== playerState.z) return null;
        if (typeof context.isWithinMeleeRange === 'function' && context.isWithinMeleeRange(playerState, enemyState)) return [];
        if (typeof context.findPath !== 'function') return null;
        const path = context.findPath(playerState.x, playerState.y, enemyState.x, enemyState.y, true, 'ENEMY', pathOptions);
        return Array.isArray(path) && path.length > 0 ? path : null;
    }

    function resolvePathToPlayer(context = {}, enemyState, pathOptions = null) {
        const playerState = context.playerState || {};
        if (!enemyState || (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(enemyState))) return null;
        if (typeof context.isPlayerAlive === 'function' && !context.isPlayerAlive()) return null;
        if (enemyState.z !== playerState.z) return null;
        if (typeof context.isWithinMeleeRange === 'function' && context.isWithinMeleeRange(enemyState, playerState)) return [];
        if (typeof context.findPath !== 'function') return null;
        const path = context.findPath(
            enemyState.x,
            enemyState.y,
            playerState.x,
            playerState.y,
            true,
            'ENEMY',
            Object.assign({ z: enemyState.z }, pathOptions && typeof pathOptions === 'object' ? pathOptions : null)
        );
        return Array.isArray(path) && path.length > 0 ? path : null;
    }

    function getPlayerCombatMovementStepCount(context = {}) {
        return context.isRunning ? 2 : 1;
    }

    function cloneCombatPathStep(context = {}, step) {
        const playerState = context.playerState || {};
        return {
            x: Number.isFinite(step && step.x) ? Math.floor(step.x) : playerState.x,
            y: Number.isFinite(step && step.y) ? Math.floor(step.y) : playerState.y
        };
    }

    function resolvePlayerChaseAttackOpportunity(context = {}, playerLockState) {
        if (!playerLockState || !playerLockState.enemyState || !Array.isArray(playerLockState.pursuitPath)) return null;
        if (playerLockState.pursuitPath.length === 0) return null;
        const stepBudget = Math.max(1, Math.floor(getPlayerCombatMovementStepCount(context)));
        const approachPath = playerLockState.pursuitPath
            .slice(0, stepBudget)
            .map((step) => cloneCombatPathStep(context, step));
        if (approachPath.length === 0) return null;
        const attackTile = approachPath[approachPath.length - 1];
        if (typeof context.isWithinMeleeRange === 'function' && !context.isWithinMeleeRange(attackTile, playerLockState.enemyState)) return null;
        return {
            attackTile,
            approachPath
        };
    }

    function resolvePathToHome(context = {}, enemyState) {
        if (!enemyState) return null;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        return resolvePathToTile(context, enemyState, homeTile, false, null);
    }

    function pickEnemyIdleWanderTarget(context = {}, enemyState, reservedTiles) {
        if (!enemyState || !reservedTiles || typeof reservedTiles.has !== 'function') return null;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        const roamingRadius = Number.isFinite(enemyState.resolvedRoamingRadius)
            ? Math.max(0, Math.floor(enemyState.resolvedRoamingRadius))
            : 0;
        if (!homeTile || roamingRadius <= 0) return null;

        let bestPlan = null;
        const minimumPathLength = Number.isFinite(context.enemyIdleWanderMinPathLength)
            ? Math.floor(context.enemyIdleWanderMinPathLength)
            : 3;
        const preferredPathLength = Math.max(minimumPathLength, Math.floor(roamingRadius * 0.65));
        const pickAttempts = Number.isFinite(context.enemyIdleWanderPickAttempts)
            ? Math.max(1, Math.floor(context.enemyIdleWanderPickAttempts))
            : 12;
        const mapSize = Number.isFinite(context.mapSize) ? Math.floor(context.mapSize) : 0;
        const logicalMap = Array.isArray(context.logicalMap) ? context.logicalMap : [];
        const playerState = context.playerState || {};

        for (let attempt = 0; attempt < pickAttempts; attempt++) {
            const targetX = homeTile.x + rollInclusive(context, -roamingRadius, roamingRadius);
            const targetY = homeTile.y + rollInclusive(context, -roamingRadius, roamingRadius);
            if (targetX < 0 || targetY < 0 || targetX >= mapSize || targetY >= mapSize) continue;
            if (!logicalMap[homeTile.z] || !logicalMap[homeTile.z][targetY]) continue;
            if (targetX === enemyState.x && targetY === enemyState.y) continue;
            if (playerState && playerState.z === homeTile.z && targetX === playerState.x && targetY === playerState.y) continue;

            const targetKey = `${targetX},${targetY},${homeTile.z}`;
            if (reservedTiles.has(targetKey)) continue;
            const tileId = logicalMap[homeTile.z][targetY][targetX];
            if (typeof context.isWalkableTileId === 'function' && !context.isWalkableTileId(tileId)) continue;

            const destination = { x: targetX, y: targetY, z: homeTile.z };
            const path = resolvePathToTile(context, enemyState, destination, false, null);
            if (!path || path.length <= 0) continue;

            if (!bestPlan || path.length > bestPlan.path.length) {
                bestPlan = { destination, path };
                if (path.length >= preferredPathLength) break;
            }
        }

        return bestPlan;
    }

    function updateIdleEnemyMovement(context = {}, enemyState, reservedTiles) {
        if (!enemyState || enemyState.currentState !== 'idle') return false;
        const roamingRadius = Number.isFinite(enemyState.resolvedRoamingRadius)
            ? Math.max(0, Math.floor(enemyState.resolvedRoamingRadius))
            : 0;
        if (roamingRadius <= 0) {
            clearEnemyLocomotionIntent(context, enemyState);
            return false;
        }

        if (enemyState.idleDestination && enemyState.x === enemyState.idleDestination.x && enemyState.y === enemyState.idleDestination.y) {
            scheduleEnemyIdleWanderPause(context, enemyState);
            return false;
        }

        const readyAtTick = Number.isFinite(enemyState.idleMoveReadyAtTick) ? enemyState.idleMoveReadyAtTick : 0;
        if (!enemyState.idleDestination) {
            if (getCurrentTick(context) < readyAtTick) {
                clearEnemyLocomotionIntent(context, enemyState);
                return false;
            }
            const wanderPlan = pickEnemyIdleWanderTarget(context, enemyState, reservedTiles);
            if (!wanderPlan) {
                scheduleEnemyIdleWanderPause(context, enemyState, 1, 2);
                return false;
            }
            enemyState.idleDestination = wanderPlan.destination;
        }

        const idlePath = resolvePathToTile(context, enemyState, enemyState.idleDestination, false, null);
        if (idlePath === null || idlePath.length === 0) {
            scheduleEnemyIdleWanderPause(context, enemyState, 1, 2);
            return false;
        }

        markEnemyLocomotionIntent(context, enemyState);
        const nextStep = idlePath[0];
        const nextKey = `${nextStep.x},${nextStep.y},${enemyState.z}`;
        if (!reservedTiles.has(nextKey) && typeof context.moveEnemyToStep === 'function') context.moveEnemyToStep(enemyState, nextStep);

        if (enemyState.idleDestination && enemyState.x === enemyState.idleDestination.x && enemyState.y === enemyState.idleDestination.y) {
            scheduleEnemyIdleWanderPause(context, enemyState);
        }

        return true;
    }

    function updateEnemyMovement(context = {}, attacks = []) {
        const enemyStates = Array.isArray(context.combatEnemyStates) ? context.combatEnemyStates : [];
        const attackedEnemyIds = new Set((Array.isArray(attacks) ? attacks : [])
            .filter((entry) => entry && (entry.attackerKind === 'enemy' || entry.attackerKind === 'player'))
            .map((entry) => (entry.attackerKind === 'enemy' ? entry.attackerId : entry.targetId)));
        const reservedTiles = new Set();
        for (let i = 0; i < enemyStates.length; i++) {
            const enemyState = enemyStates[i];
            if (typeof context.isEnemyAlive === 'function' && context.isEnemyAlive(enemyState)) reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
        }

        const playerState = context.playerState || {};
        for (let i = 0; i < enemyStates.length; i++) {
            const enemyState = enemyStates[i];
            if (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(enemyState)) continue;
            if (attackedEnemyIds.has(enemyState.runtimeId)) continue;
            reservedTiles.delete(`${enemyState.x},${enemyState.y},${enemyState.z}`);

            if (enemyState.currentState === 'returning') {
                const returnPath = resolvePathToHome(context, enemyState);
                if (returnPath === null || returnPath.length === 0) {
                    if (typeof context.restoreEnemyAtHome === 'function') context.restoreEnemyAtHome(enemyState);
                    reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                    continue;
                }
                markEnemyLocomotionIntent(context, enemyState);
                const homeStep = returnPath[0];
                const homeKey = `${homeStep.x},${homeStep.y},${enemyState.z}`;
                if (!reservedTiles.has(homeKey) && typeof context.moveEnemyToStep === 'function') context.moveEnemyToStep(enemyState, homeStep);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (enemyState.currentState === 'idle') {
                updateIdleEnemyMovement(context, enemyState, reservedTiles);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== context.playerTargetId) {
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (typeof context.isPlayerAlive === 'function' && !context.isPlayerAlive()) {
                if (typeof context.beginEnemyReturn === 'function') context.beginEnemyReturn(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (typeof context.isTrainingDummyEnemy === 'function' && context.isTrainingDummyEnemy(enemyState)) {
                clearEnemyLocomotionIntent(context, enemyState);
                if (typeof context.faceEnemyTowards === 'function') context.faceEnemyTowards(enemyState, playerState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (typeof context.isWithinMeleeRange === 'function' && context.isWithinMeleeRange(enemyState, playerState)) {
                clearEnemyLocomotionIntent(context, enemyState);
                if (typeof context.faceEnemyTowards === 'function') context.faceEnemyTowards(enemyState, playerState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            const pursuitPath = resolvePathToPlayer(context, enemyState);
            if (pursuitPath === null) {
                clearEnemyLocomotionIntent(context, enemyState);
                if (typeof context.beginEnemyReturn === 'function') context.beginEnemyReturn(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }
            if (pursuitPath.length === 0) {
                clearEnemyLocomotionIntent(context, enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            markEnemyLocomotionIntent(context, enemyState);
            const nextStep = pursuitPath[0];
            const nextKey = `${nextStep.x},${nextStep.y},${enemyState.z}`;
            if (!reservedTiles.has(nextKey) && typeof context.moveEnemyToStep === 'function') context.moveEnemyToStep(enemyState, nextStep);
            reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
        }
    }

    window.CombatEnemyMovementRuntime = {
        clearEnemyIdleWanderState,
        clearEnemyLocomotionIntent,
        markEnemyLocomotionIntent,
        hasTrackedEnemyLocomotionIntent,
        scheduleEnemyIdleWanderPause,
        resolvePathToTile,
        resolvePathToEnemy,
        resolvePathToPlayer,
        getPlayerCombatMovementStepCount,
        cloneCombatPathStep,
        resolvePlayerChaseAttackOpportunity,
        resolvePathToHome,
        pickEnemyIdleWanderTarget,
        updateIdleEnemyMovement,
        updateEnemyMovement
    };
})();
