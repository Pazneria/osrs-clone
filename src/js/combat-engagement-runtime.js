(function() {
    function getPlayerTile(context = {}) {
        const playerState = context.playerState || {};
        return { x: playerState.x, y: playerState.y, z: playerState.z };
    }

    function hasActiveCombatSelection(playerState = {}, playerTargetKind = 'enemy') {
        return !!playerState.lockedTargetId
            || playerState.combatTargetKind === playerTargetKind
            || playerState.targetObj === 'ENEMY';
    }

    function validatePlayerTargetLock(context = {}) {
        const lockedEnemy = typeof context.getPlayerLockedEnemy === 'function'
            ? context.getPlayerLockedEnemy()
            : null;
        const playerState = context.playerState || {};
        const playerTargetKind = context.playerTargetKind || 'enemy';
        const hardNoPathState = context.playerPursuitStateHardNoPath || 'hard-no-path';
        const validState = context.playerPursuitStateValid || 'valid';
        const temporaryBlockState = context.playerPursuitStateTemporaryBlock || 'temporary-block';

        if (!lockedEnemy) {
            if (typeof context.recordPlayerPursuitDebug === 'function') context.recordPlayerPursuitDebug(null, hardNoPathState, null, null);
            if (hasActiveCombatSelection(playerState, playerTargetKind) && typeof context.clearPlayerCombatTarget === 'function') {
                context.clearPlayerCombatTarget({ reason: 'missing-locked-enemy' });
            }
            return null;
        }
        if (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(lockedEnemy)) {
            if (typeof context.recordPlayerPursuitDebug === 'function') context.recordPlayerPursuitDebug(lockedEnemy, hardNoPathState, null, null);
            if (typeof context.clearPlayerCombatTarget === 'function') {
                context.clearPlayerCombatTarget({ force: true, reason: 'locked-enemy-not-alive' });
            }
            return null;
        }

        playerState.targetX = lockedEnemy.x;
        playerState.targetY = lockedEnemy.y;
        const pursuitPath = typeof context.resolvePathToEnemy === 'function'
            ? context.resolvePathToEnemy(lockedEnemy)
            : null;
        if (pursuitPath !== null) {
            if (typeof context.recordPlayerPursuitDebug === 'function') context.recordPlayerPursuitDebug(lockedEnemy, validState, pursuitPath, pursuitPath);
            return {
                enemyState: lockedEnemy,
                pursuitPath,
                pursuitState: validState,
                occupancyIgnoredPursuitPath: pursuitPath
            };
        }

        const occupancyIgnoredPursuitPath = typeof context.resolvePathToEnemy === 'function'
            ? context.resolvePathToEnemy(lockedEnemy, {
                z: playerState.z,
                ignoreCombatEnemyOccupancy: true
            })
            : null;
        if (occupancyIgnoredPursuitPath !== null) {
            if (typeof context.recordPlayerPursuitDebug === 'function') context.recordPlayerPursuitDebug(lockedEnemy, temporaryBlockState, null, occupancyIgnoredPursuitPath);
            return {
                enemyState: lockedEnemy,
                pursuitPath: null,
                pursuitState: temporaryBlockState,
                occupancyIgnoredPursuitPath
            };
        }

        if (typeof context.recordPlayerPursuitDebug === 'function') context.recordPlayerPursuitDebug(lockedEnemy, hardNoPathState, null, null);
        if (typeof context.clearPlayerCombatTarget === 'function') {
            context.clearPlayerCombatTarget({ force: true, reason: 'locked-enemy-hard-no-path' });
        }
        return null;
    }

    function hasValidPlayerCombatLock(context = {}) {
        const lockedEnemy = typeof context.getPlayerLockedEnemy === 'function'
            ? context.getPlayerLockedEnemy()
            : null;
        const playerState = context.playerState || {};
        if (!lockedEnemy || (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(lockedEnemy))) return false;
        const pursuitPath = typeof context.resolvePathToEnemy === 'function'
            ? context.resolvePathToEnemy(lockedEnemy)
            : null;
        if (pursuitPath !== null) return true;
        const occupancyIgnoredPath = typeof context.resolvePathToEnemy === 'function'
            ? context.resolvePathToEnemy(lockedEnemy, {
                z: playerState.z,
                ignoreCombatEnemyOccupancy: true
            })
            : null;
        return occupancyIgnoredPath !== null;
    }

    function isValidAutoRetaliateCandidate(context = {}, enemyState) {
        if (!enemyState) return false;
        const playerState = context.playerState || {};
        const playerTargetId = context.playerTargetId || 'player';
        if (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(enemyState)) return false;
        if (typeof context.isPlayerAlive === 'function' && !context.isPlayerAlive()) return false;
        if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== playerTargetId) return false;
        if (enemyState.z !== playerState.z) return false;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        return !!homeTile
            && typeof context.getSquareRange === 'function'
            && context.getSquareRange(homeTile, getPlayerTile(context), enemyState.resolvedChaseRange);
    }

    function pickAutoRetaliateTarget(context = {}) {
        const enemyStates = Array.isArray(context.combatEnemyStates) ? context.combatEnemyStates : [];
        const candidates = enemyStates.filter((enemyState) => isValidAutoRetaliateCandidate(context, enemyState));
        if (candidates.length === 0) return null;
        candidates.sort((left, right) => {
            const leftOrder = Number.isFinite(left.autoRetaliateAggressorOrder) ? left.autoRetaliateAggressorOrder : Number.MAX_SAFE_INTEGER;
            const rightOrder = Number.isFinite(right.autoRetaliateAggressorOrder) ? right.autoRetaliateAggressorOrder : Number.MAX_SAFE_INTEGER;
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            const leftDistance = typeof context.getChebyshevDistance === 'function' ? context.getChebyshevDistance(context.playerState, left) : 0;
            const rightDistance = typeof context.getChebyshevDistance === 'function' ? context.getChebyshevDistance(context.playerState, right) : 0;
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;
            const leftLevel = typeof context.getAutoRetaliateCandidateCombatLevel === 'function'
                ? context.getAutoRetaliateCandidateCombatLevel(left)
                : Number.MAX_SAFE_INTEGER;
            const rightLevel = typeof context.getAutoRetaliateCandidateCombatLevel === 'function'
                ? context.getAutoRetaliateCandidateCombatLevel(right)
                : Number.MAX_SAFE_INTEGER;
            if (leftLevel !== rightLevel) return leftLevel - rightLevel;
            return String(left.runtimeId || '').localeCompare(String(right.runtimeId || ''));
        });
        return candidates[0] || null;
    }

    function validateEnemyTargetLock(context = {}, enemyState) {
        if (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(enemyState)) return null;
        if (typeof context.isPlayerAlive === 'function' && !context.isPlayerAlive()) {
            if (typeof context.beginEnemyReturn === 'function') context.beginEnemyReturn(enemyState);
            return null;
        }
        const homeTile = enemyState && (enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile);
        if (
            !homeTile
            || typeof context.getSquareRange !== 'function'
            || !context.getSquareRange(homeTile, getPlayerTile(context), enemyState.resolvedChaseRange)
        ) {
            if (typeof context.beginEnemyReturn === 'function') context.beginEnemyReturn(enemyState);
            return null;
        }
        return enemyState;
    }

    function acquireAggressiveEnemyTargets(context = {}) {
        if (typeof context.isPlayerAlive === 'function' && !context.isPlayerAlive()) return;
        const enemyStates = Array.isArray(context.combatEnemyStates) ? context.combatEnemyStates : [];
        const playerState = context.playerState || {};
        const playerTargetId = context.playerTargetId || 'player';
        const playerTile = getPlayerTile(context);
        for (let i = 0; i < enemyStates.length; i++) {
            const enemyState = enemyStates[i];
            if (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(enemyState)) continue;
            if (enemyState.currentState !== 'idle') continue;
            const enemyType = typeof context.getEnemyDefinition === 'function'
                ? context.getEnemyDefinition(enemyState.enemyId)
                : null;
            if (!enemyType || !enemyType.behavior || enemyType.behavior.aggroType !== 'aggressive') continue;
            if (typeof context.getSquareRange !== 'function' || !context.getSquareRange(enemyState, playerTile, enemyState.resolvedAggroRadius)) continue;
            const pursuitPath = typeof context.resolvePathToPlayer === 'function' ? context.resolvePathToPlayer(enemyState) : null;
            if (pursuitPath === null) continue;
            enemyState.currentState = 'aggroed';
            enemyState.lockedTargetId = playerTargetId;
            enemyState.lastDamagerId = playerTargetId;
            if (typeof context.faceEnemyTowards === 'function') context.faceEnemyTowards(enemyState, playerState);
            if (typeof context.clearEnemyIdleWanderState === 'function') context.clearEnemyIdleWanderState(enemyState);
        }
    }

    function getEnemyAssistGroupId(enemyState) {
        const assistGroupId = enemyState && typeof enemyState.assistGroupId === 'string'
            ? enemyState.assistGroupId.trim()
            : '';
        return assistGroupId || null;
    }

    function canEnemyCallForAssist(enemyState, playerTargetId) {
        return !!enemyState
            && enemyState.currentState === 'aggroed'
            && enemyState.lockedTargetId === playerTargetId
            && !!getEnemyAssistGroupId(enemyState);
    }

    function canEnemyAssist(context = {}, candidate, anchor, playerTile) {
        if (!candidate || !anchor || candidate === anchor) return false;
        if (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(candidate)) return false;
        if (candidate.currentState !== 'idle') return false;
        if (candidate.z !== anchor.z || candidate.z !== playerTile.z) return false;
        if (getEnemyAssistGroupId(candidate) !== getEnemyAssistGroupId(anchor)) return false;
        const assistRadius = Number.isFinite(candidate.resolvedAssistRadius)
            ? Math.max(0, Math.floor(candidate.resolvedAssistRadius))
            : 0;
        if (assistRadius <= 0) return false;
        if (typeof context.getSquareRange !== 'function' || !context.getSquareRange(candidate, anchor, assistRadius)) return false;

        const homeTile = candidate.resolvedHomeTile || candidate.resolvedSpawnTile;
        if (!homeTile || !context.getSquareRange(homeTile, playerTile, candidate.resolvedChaseRange)) return false;
        const pursuitPath = typeof context.resolvePathToPlayer === 'function' ? context.resolvePathToPlayer(candidate) : null;
        return pursuitPath !== null;
    }

    function acquireAssistingEnemyTargets(context = {}) {
        if (typeof context.isPlayerAlive === 'function' && !context.isPlayerAlive()) return;
        const enemyStates = Array.isArray(context.combatEnemyStates) ? context.combatEnemyStates : [];
        const playerState = context.playerState || {};
        const playerTargetId = context.playerTargetId || 'player';
        const playerTile = getPlayerTile(context);
        const assistAnchors = enemyStates.filter((enemyState) => {
            if (typeof context.isEnemyAlive === 'function' && !context.isEnemyAlive(enemyState)) return false;
            return canEnemyCallForAssist(enemyState, playerTargetId);
        });
        for (let i = 0; i < assistAnchors.length; i++) {
            const anchor = assistAnchors[i];
            for (let j = 0; j < enemyStates.length; j++) {
                const candidate = enemyStates[j];
                if (!canEnemyAssist(context, candidate, anchor, playerTile)) continue;
                candidate.currentState = 'aggroed';
                candidate.lockedTargetId = playerTargetId;
                candidate.lastDamagerId = playerTargetId;
                candidate.remainingAttackCooldown = Math.max(
                    1,
                    Number.isFinite(candidate.remainingAttackCooldown) ? Math.floor(candidate.remainingAttackCooldown) : 0
                );
                candidate.assistTargetRuntimeId = anchor.runtimeId || null;
                if (typeof context.faceEnemyTowards === 'function') context.faceEnemyTowards(candidate, playerState);
                if (typeof context.clearEnemyIdleWanderState === 'function') context.clearEnemyIdleWanderState(candidate);
            }
        }
    }

    function movePlayerTowardLockedTarget(context = {}, playerLockState, attackedThisTick) {
        if (!playerLockState || attackedThisTick) return;
        const playerState = context.playerState || {};
        const temporaryBlockState = context.playerPursuitStateTemporaryBlock || 'temporary-block';
        const combatActionName = typeof context.getPlayerCombatActionName === 'function'
            ? context.getPlayerCombatActionName()
            : 'COMBAT: MELEE';
        if (playerState.action === 'SKILLING: FLETCHING') return;
        if (playerLockState.pursuitState === temporaryBlockState) {
            playerState.path = [];
            playerState.action = combatActionName;
            return;
        }
        if (playerLockState.pursuitPath && playerLockState.pursuitPath.length > 0) {
            playerState.path = playerLockState.pursuitPath;
            playerState.action = 'WALKING';
        } else if (
            typeof context.isWithinPlayerAttackRange === 'function'
            && context.isWithinPlayerAttackRange(playerState, playerLockState.enemyState)
        ) {
            if (typeof context.facePlayerTowards === 'function') context.facePlayerTowards(playerLockState.enemyState);
            playerState.action = combatActionName;
        }
    }

    window.CombatEngagementRuntime = {
        validatePlayerTargetLock,
        hasValidPlayerCombatLock,
        isValidAutoRetaliateCandidate,
        pickAutoRetaliateTarget,
        validateEnemyTargetLock,
        acquireAggressiveEnemyTargets,
        acquireAssistingEnemyTargets,
        movePlayerTowardLockedTarget
    };
})();
