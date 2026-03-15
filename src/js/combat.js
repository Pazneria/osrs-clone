(function () {
    const combatRuntime = window.CombatRuntime || null;
    const PLAYER_TARGET_ID = 'player';
    const PLAYER_TARGET_KIND = 'enemy';
    const PLAYER_DEFEAT_MESSAGE = 'You were defeated and return to safety.';
    const ENEMY_IDLE_WANDER_PAUSE_MIN_TICKS = 2;
    const ENEMY_IDLE_WANDER_PAUSE_MAX_TICKS = 5;
    const ENEMY_IDLE_WANDER_PICK_ATTEMPTS = 12;
    const ENEMY_IDLE_WANDER_MIN_PATH_LENGTH = 3;
    const ENEMY_MOVE_LERP_DURATION_MS = (typeof TICK_RATE_MS === 'number' && Number.isFinite(TICK_RATE_MS) && TICK_RATE_MS > 0)
        ? Math.max(320, Math.floor(TICK_RATE_MS * 0.9))
        : 540;

    let activeCombatWorldId = null;
    let lastResolvedCombatWorldId = 'starter_town';
    let combatEnemySpawnNodesById = Object.create(null);
    let combatEnemyStates = [];
    let combatEnemyStateById = Object.create(null);
    let combatEnemyRenderLayer = null;
    let combatEnemyRenderersById = Object.create(null);
    let combatEnemyOccupiedTiles = new Map();
    let combatEnemyOccupancyDirty = true;

    function clonePoint(point) {
        return {
            x: Number.isFinite(point && point.x) ? Math.floor(point.x) : 0,
            y: Number.isFinite(point && point.y) ? Math.floor(point.y) : 0,
            z: Number.isFinite(point && point.z) ? Math.floor(point.z) : 0
        };
    }

    function normalizeWorldId(worldId) {
        return String(worldId || '').trim();
    }

    function getCurrentWorldId(worldIdOverride = null) {
        let rawWorldId = normalizeWorldId(worldIdOverride);
        if (window.GameSessionRuntime && typeof window.GameSessionRuntime.resolveCurrentWorldId === 'function') {
            if (!rawWorldId) rawWorldId = normalizeWorldId(window.GameSessionRuntime.resolveCurrentWorldId());
        }
        if (!rawWorldId && window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getCurrentWorldId === 'function') {
            rawWorldId = normalizeWorldId(window.WorldBootstrapRuntime.getCurrentWorldId());
        }

        const fallbackWorldId = normalizeWorldId(activeCombatWorldId) || normalizeWorldId(lastResolvedCombatWorldId) || 'starter_town';
        if (window.LegacyWorldAdapterRuntime && typeof window.LegacyWorldAdapterRuntime.resolveKnownWorldId === 'function') {
            const resolvedWorldId = normalizeWorldId(window.LegacyWorldAdapterRuntime.resolveKnownWorldId(rawWorldId || null, fallbackWorldId));
            if (resolvedWorldId) {
                lastResolvedCombatWorldId = resolvedWorldId;
                return resolvedWorldId;
            }
        }

        const resolvedWorldId = rawWorldId || fallbackWorldId;
        lastResolvedCombatWorldId = resolvedWorldId || 'starter_town';
        return lastResolvedCombatWorldId;
    }

    function getEnemyDefinition(enemyId) {
        if (!combatRuntime || typeof combatRuntime.getEnemyTypeDefinition !== 'function') return null;
        return combatRuntime.getEnemyTypeDefinition(enemyId);
    }

    function getPlayerCombatSnapshot() {
        if (!combatRuntime || typeof combatRuntime.computePlayerMeleeCombatSnapshot !== 'function') return null;
        return combatRuntime.computePlayerMeleeCombatSnapshot({
            playerSkills: playerSkills || {},
            equipment: equipment || {},
            playerState
        });
    }

    function getEnemyCombatSnapshot(enemyState) {
        if (!combatRuntime || typeof combatRuntime.computeEnemyMeleeCombatSnapshot !== 'function') return null;
        return combatRuntime.computeEnemyMeleeCombatSnapshot(getEnemyDefinition(enemyState.enemyId));
    }

    function isEnemyAlive(enemyState) {
        return !!(enemyState && enemyState.currentState !== 'dead' && enemyState.currentHealth > 0);
    }

    function isEnemyPendingDefeat(enemyState) {
        return !!(enemyState && enemyState.currentState !== 'dead' && Number.isFinite(enemyState.pendingDefeatAtTick));
    }

    function shouldEnemyOccupyTile(enemyState) {
        return isEnemyAlive(enemyState) || isEnemyPendingDefeat(enemyState);
    }

    function captureEnemyPendingDefeatFacing(enemyState) {
        if (!enemyState) return 0;
        const renderer = combatEnemyRenderersById[enemyState.runtimeId];
        if (renderer && renderer.group && Number.isFinite(renderer.group.rotation.y)) {
            return renderer.group.rotation.y;
        }
        if (Number.isFinite(enemyState.facingYaw)) return enemyState.facingYaw;
        return 0;
    }

    function computeCombatLevelFromStats(stats) {
        if (!stats || typeof stats !== 'object') return 1;
        const attack = Number.isFinite(stats.attack) ? Math.floor(stats.attack) : 1;
        const strength = Number.isFinite(stats.strength) ? Math.floor(stats.strength) : 1;
        const defense = Number.isFinite(stats.defense) ? Math.floor(stats.defense) : 1;
        const hitpoints = Number.isFinite(stats.hitpoints) ? Math.floor(stats.hitpoints) : 10;
        return Math.max(1, Math.floor((attack + strength + defense + hitpoints) / 4));
    }

    function getEnemyCombatLevel(enemyType) {
        return computeCombatLevelFromStats(enemyType && enemyType.stats ? enemyType.stats : null);
    }

    function getCombatEnemyState(enemyId) {
        return combatEnemyStateById[String(enemyId || '').trim()] || null;
    }

    function clearEnemyRenderer(enemyId) {
        const renderer = combatEnemyRenderersById[enemyId];
        if (!renderer) return;
        if (renderer.group && renderer.group.parent) renderer.group.parent.remove(renderer.group);
        if (renderer.healthBarEl && renderer.healthBarEl.parentNode) renderer.healthBarEl.parentNode.removeChild(renderer.healthBarEl);
        environmentMeshes = environmentMeshes.filter((mesh) => mesh !== renderer.hitbox);
        delete combatEnemyRenderersById[enemyId];
    }

    function clearCombatEnemyRenderers() {
        const enemyIds = Object.keys(combatEnemyRenderersById);
        for (let i = 0; i < enemyIds.length; i++) clearEnemyRenderer(enemyIds[i]);
        if (combatEnemyRenderLayer && combatEnemyRenderLayer.parent) combatEnemyRenderLayer.parent.remove(combatEnemyRenderLayer);
        combatEnemyRenderLayer = null;
    }

    function clearCombatEnemyOccupancy() {
        combatEnemyOccupiedTiles.forEach((baseTile, key) => {
            const parts = key.split(':');
            if (parts.length !== 3) return;
            const z = parseInt(parts[0], 10);
            const x = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (!logicalMap[z] || !logicalMap[z][y]) return;
            if (logicalMap[z][y][x] === TileId.SOLID_NPC) logicalMap[z][y][x] = baseTile;
        });
        combatEnemyOccupiedTiles.clear();
    }

    function markCombatEnemyOccupancyDirty() {
        combatEnemyOccupancyDirty = true;
    }

    function refreshCombatEnemyOccupancy() {
        if (!combatEnemyOccupancyDirty) return;
        clearCombatEnemyOccupancy();
        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!shouldEnemyOccupyTile(enemyState)) continue;
            const z = enemyState.z;
            const x = enemyState.x;
            const y = enemyState.y;
            if (!logicalMap[z] || !logicalMap[z][y]) continue;
            const key = `${z}:${x}:${y}`;
            if (!combatEnemyOccupiedTiles.has(key)) combatEnemyOccupiedTiles.set(key, logicalMap[z][y][x]);
            logicalMap[z][y][x] = TileId.SOLID_NPC;
        }
        combatEnemyOccupancyDirty = false;
    }

    function getCombatEnemyOccupiedBaseTileId(x, y, z = 0) {
        const key = `${z}:${x}:${y}`;
        return combatEnemyOccupiedTiles.has(key) ? combatEnemyOccupiedTiles.get(key) : null;
    }

    function resetCombatStateCollections() {
        combatEnemySpawnNodesById = Object.create(null);
        combatEnemyStateById = Object.create(null);
        combatEnemyStates = [];
    }

    function shouldPreservePreEngagementTargetLock() {
        if (playerState.inCombat) return false;
        if (playerState.action !== 'WALKING') return false;
        if (playerState.targetObj !== 'ENEMY') return false;
        if (!Array.isArray(playerState.path) || playerState.path.length <= 0) return false;
        if (!playerState.lockedTargetId) return false;
        return true;
    }

    function hasActivePlayerCombatSelection() {
        if (playerState.lockedTargetId) return true;
        if (playerState.combatTargetKind === PLAYER_TARGET_KIND) return true;
        if (playerState.targetObj === 'ENEMY') return true;
        if (playerState.inCombat) return true;
        if (Number.isFinite(playerState.remainingAttackCooldown) && playerState.remainingAttackCooldown > 0) return true;
        return false;
    }

    function recordCombatClearEvent(event) {
        if (!window.QA_COMBAT_DEBUG) return;
        if (!event || typeof event !== 'object') return;
        const clearEvents = Array.isArray(window.__qaCombatDebugClearEvents) ? window.__qaCombatDebugClearEvents : [];
        if (!Array.isArray(window.__qaCombatDebugClearEvents)) window.__qaCombatDebugClearEvents = clearEvents;
        clearEvents.push(event);
        if (clearEvents.length > 40) clearEvents.splice(0, clearEvents.length - 40);
    }

    function clearPlayerCombatTarget(options = null) {
        if (!hasActivePlayerCombatSelection()) return false;
        const opts = options && typeof options === 'object' ? options : null;
        const forced = !!(opts && opts.force);
        const reason = opts && typeof opts.reason === 'string' && opts.reason ? opts.reason : 'generic';
        const shouldRecordClearDebug = !!window.QA_COMBAT_DEBUG;
        const combatClearEvent = shouldRecordClearDebug
            ? {
                tick: Number.isFinite(currentTick) ? currentTick : null,
                reason,
                forced: !!forced,
                blocked: false,
                lockBeforeClear: playerState.lockedTargetId ? String(playerState.lockedTargetId) : null,
                action: playerState.action || 'IDLE',
                pathLength: Array.isArray(playerState.path) ? playerState.path.length : 0
            }
            : null;
        if (!forced && shouldPreservePreEngagementTargetLock()) {
            window.__qaCombatDebugLastClearReason = `blocked:${reason}`;
            window.__qaCombatDebugLastClearTick = Number.isFinite(currentTick) ? currentTick : null;
            if (combatClearEvent) combatClearEvent.blocked = true;
            recordCombatClearEvent(combatClearEvent);
            return false;
        }
        window.__qaCombatDebugLastClearReason = reason;
        window.__qaCombatDebugLastClearTick = Number.isFinite(currentTick) ? currentTick : null;
        recordCombatClearEvent(combatClearEvent);
        playerState.lockedTargetId = null;
        playerState.combatTargetKind = null;
        playerState.remainingAttackCooldown = 0;
        playerState.inCombat = false;
        if (playerState.targetObj === 'ENEMY') {
            playerState.targetObj = null;
            playerState.targetUid = null;
        }
        if (playerState.action === 'COMBAT: MELEE') playerState.action = 'IDLE';
        return true;
    }

    function lockPlayerCombatTarget(enemyId) {
        const resolvedEnemyId = String(enemyId || '').trim();
        if (!resolvedEnemyId) return false;
        const enemyState = getCombatEnemyState(resolvedEnemyId);
        if (!isEnemyAlive(enemyState)) return false;
        if (playerState.lockedTargetId === resolvedEnemyId && playerState.combatTargetKind === PLAYER_TARGET_KIND) return true;
        playerState.lockedTargetId = resolvedEnemyId;
        playerState.combatTargetKind = PLAYER_TARGET_KIND;
        playerState.targetObj = 'ENEMY';
        playerState.targetUid = {
            enemyId: resolvedEnemyId,
            name: getEnemyDefinition(enemyState.enemyId)?.displayName || enemyState.enemyId
        };
        playerState.targetX = enemyState.x;
        playerState.targetY = enemyState.y;
        return true;
    }

    function getPlayerLockedEnemy() {
        if (!playerState.lockedTargetId) return null;
        return getCombatEnemyState(playerState.lockedTargetId);
    }

    function getChebyshevDistance(a, b) {
        if (!a || !b) return null;
        if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return null;
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    }

    function resolveCombatHudFocusEnemy() {
        const lockedEnemy = getPlayerLockedEnemy();
        if (lockedEnemy && isEnemyAlive(lockedEnemy)) {
            return {
                enemyState: lockedEnemy,
                focusLabel: 'Target'
            };
        }

        const lastDamager = getCombatEnemyState(playerState.lastDamagerEnemyId);
        if (lastDamager && isEnemyAlive(lastDamager) && (lastDamager.lockedTargetId === PLAYER_TARGET_ID || lastDamager.currentState === 'aggroed')) {
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

    function getCombatHudSnapshot() {
        ensureCombatEnemyWorldReady();
        const focus = resolveCombatHudFocusEnemy();
        const enemyState = focus.enemyState;
        const enemyType = enemyState ? getEnemyDefinition(enemyState.enemyId) : null;

        return {
            inCombat: !!playerState.inCombat,
            playerRemainingAttackCooldown: Number.isFinite(playerState.remainingAttackCooldown)
                ? Math.max(0, Math.floor(playerState.remainingAttackCooldown))
                : 0,
            target: enemyState && enemyType
                ? {
                    label: enemyType.displayName || enemyState.enemyId,
                    focusLabel: focus.focusLabel,
                    currentHealth: Number.isFinite(enemyState.currentHealth) ? enemyState.currentHealth : enemyType.stats.hitpoints,
                    maxHealth: enemyType.stats.hitpoints,
                    remainingAttackCooldown: Number.isFinite(enemyState.remainingAttackCooldown)
                        ? Math.max(0, Math.floor(enemyState.remainingAttackCooldown))
                        : 0,
                    state: enemyState.currentState || '',
                    distance: getChebyshevDistance(playerState, enemyState),
                    inMeleeRange: isWithinMeleeRange(playerState, enemyState)
                }
                : null
        };
    }

    function resolveRespawnLocation() {
        const worldId = getCurrentWorldId();
        if (window.LegacyWorldAdapterRuntime && typeof window.LegacyWorldAdapterRuntime.getWorldDefaultSpawn === 'function') {
            return clonePoint(window.LegacyWorldAdapterRuntime.getWorldDefaultSpawn(worldId, {
                mapSize: MAP_SIZE,
                planes: PLANES
            }));
        }
        return { x: 205, y: 210, z: 0 };
    }

    function initCombatWorldState(worldIdOverride = null) {
        activeCombatWorldId = getCurrentWorldId(worldIdOverride);
        clearCombatEnemyRenderers();
        clearCombatEnemyOccupancy();
        resetCombatStateCollections();
        combatEnemyOccupancyDirty = true;
        clearPlayerCombatTarget({ force: true, reason: 'init-world-state' });
        playerState.lastDamagerEnemyId = null;

        if (!combatRuntime || typeof combatRuntime.listEnemySpawnNodesForWorld !== 'function' || typeof combatRuntime.createEnemyRuntimeState !== 'function') {
            return;
        }

        const spawnNodes = combatRuntime.listEnemySpawnNodesForWorld(activeCombatWorldId);
        for (let i = 0; i < spawnNodes.length; i++) {
            const spawnNode = spawnNodes[i];
            if (!spawnNode || !spawnNode.spawnEnabled) continue;
            combatEnemySpawnNodesById[spawnNode.spawnNodeId] = spawnNode;
            const enemyState = combatRuntime.createEnemyRuntimeState(spawnNode, 0);
            enemyState.prevX = enemyState.x;
            enemyState.prevY = enemyState.y;
            enemyState.moveTriggerAt = 0;
            enemyState.homeReachedAt = 0;
            scheduleEnemyIdleWanderPause(enemyState, 1, 3);
            combatEnemyStates.push(enemyState);
            combatEnemyStateById[enemyState.runtimeId] = enemyState;
        }

        refreshCombatEnemyOccupancy();
    }

    function ensureCombatEnemyWorldReady() {
        const currentWorldId = getCurrentWorldId();
        if (!activeCombatWorldId) {
            initCombatWorldState(currentWorldId);
            return;
        }
        // World transitions should explicitly reinitialize combat via initLogicalMap/reloadActiveWorldScene.
        // Ignoring transient world-id drift here prevents mid-pursuit combat state resets.
        lastResolvedCombatWorldId = currentWorldId;
    }

    function getSquareRange(attacker, target, range) {
        if (combatRuntime && typeof combatRuntime.isWithinSquareRange === 'function') {
            return combatRuntime.isWithinSquareRange(attacker, target, range);
        }
        const dx = Math.abs(attacker.x - target.x);
        const dy = Math.abs(attacker.y - target.y);
        return Math.max(dx, dy) <= range;
    }

    function isWithinMeleeRange(attacker, target) {
        if (combatRuntime && typeof combatRuntime.isWithinMeleeRange === 'function') {
            return combatRuntime.isWithinMeleeRange(attacker, target);
        }
        return getSquareRange(attacker, target, 1);
    }

    function isPlayerAlive() {
        return typeof getCurrentHitpoints === 'function' ? getCurrentHitpoints() > 0 : playerState.currentHitpoints > 0;
    }

    function isPlayerCombatFacingReady() {
        if (!playerState) return false;
        if (playerState.midX !== null || playerState.midY !== null) return false;
        if (playerState.x !== playerState.prevX || playerState.y !== playerState.prevY) return false;
        if (Array.isArray(playerState.path) && playerState.path.length > 0) return false;
        return true;
    }

    function clearEnemyIdleWanderState(enemyState) {
        if (!enemyState) return;
        enemyState.idleDestination = null;
        enemyState.idleMoveReadyAtTick = currentTick;
    }

    function scheduleEnemyIdleWanderPause(enemyState, minTicks = ENEMY_IDLE_WANDER_PAUSE_MIN_TICKS, maxTicks = ENEMY_IDLE_WANDER_PAUSE_MAX_TICKS) {
        if (!enemyState) return;
        enemyState.idleDestination = null;
        enemyState.idleMoveReadyAtTick = currentTick + rollInclusive(minTicks, maxTicks);
    }

    function resolvePathToTile(enemyState, targetTile, allowTargetOccupied = false, targetKind = null) {
        if (!enemyState || !targetTile) return null;
        if (enemyState.z !== targetTile.z) return null;
        if (enemyState.x === targetTile.x && enemyState.y === targetTile.y) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(enemyState.x, enemyState.y, targetTile.x, targetTile.y, allowTargetOccupied, targetKind);
        return path.length > 0 ? path : null;
    }

    function resolvePathToEnemy(enemyState) {
        if (!enemyState || !isEnemyAlive(enemyState)) return null;
        if (enemyState.z !== playerState.z) return null;
        if (isWithinMeleeRange(playerState, enemyState)) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(playerState.x, playerState.y, enemyState.x, enemyState.y, true, 'ENEMY');
        return path.length > 0 ? path : null;
    }

    function resolvePathToPlayer(enemyState) {
        if (!enemyState || !isEnemyAlive(enemyState) || !isPlayerAlive()) return null;
        if (enemyState.z !== playerState.z) return null;
        if (isWithinMeleeRange(enemyState, playerState)) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(enemyState.x, enemyState.y, playerState.x, playerState.y, true, 'ENEMY');
        return path.length > 0 ? path : null;
    }

    function resolvePathToHome(enemyState) {
        if (!enemyState) return null;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        return resolvePathToTile(enemyState, homeTile, false, null);
    }

    function pickEnemyIdleWanderTarget(enemyState, reservedTiles) {
        if (!enemyState) return null;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        const roamingRadius = Number.isFinite(enemyState.resolvedRoamingRadius)
            ? Math.max(0, Math.floor(enemyState.resolvedRoamingRadius))
            : 0;
        if (!homeTile || roamingRadius <= 0) return null;

        let bestPlan = null;
        const preferredPathLength = Math.max(ENEMY_IDLE_WANDER_MIN_PATH_LENGTH, Math.floor(roamingRadius * 0.65));
        for (let attempt = 0; attempt < ENEMY_IDLE_WANDER_PICK_ATTEMPTS; attempt++) {
            const targetX = homeTile.x + rollInclusive(-roamingRadius, roamingRadius);
            const targetY = homeTile.y + rollInclusive(-roamingRadius, roamingRadius);
            if (targetX < 0 || targetY < 0 || targetX >= MAP_SIZE || targetY >= MAP_SIZE) continue;
            if (!logicalMap[homeTile.z] || !logicalMap[homeTile.z][targetY]) continue;
            if (targetX === enemyState.x && targetY === enemyState.y) continue;
            if (playerState && playerState.z === homeTile.z && targetX === playerState.x && targetY === playerState.y) continue;

            const targetKey = `${targetX},${targetY},${homeTile.z}`;
            if (reservedTiles.has(targetKey)) continue;
            if (!isWalkableTileId(logicalMap[homeTile.z][targetY][targetX])) continue;

            const destination = { x: targetX, y: targetY, z: homeTile.z };
            const path = resolvePathToTile(enemyState, destination, false, null);
            if (!path || path.length <= 0) continue;

            if (!bestPlan || path.length > bestPlan.path.length) {
                bestPlan = { destination, path };
                if (path.length >= preferredPathLength) break;
            }
        }

        return bestPlan;
    }

    function updateIdleEnemyMovement(enemyState, reservedTiles) {
        if (!enemyState || enemyState.currentState !== 'idle') return false;
        const roamingRadius = Number.isFinite(enemyState.resolvedRoamingRadius)
            ? Math.max(0, Math.floor(enemyState.resolvedRoamingRadius))
            : 0;
        if (roamingRadius <= 0) return false;

        if (enemyState.idleDestination && enemyState.x === enemyState.idleDestination.x && enemyState.y === enemyState.idleDestination.y) {
            scheduleEnemyIdleWanderPause(enemyState);
            return false;
        }

        const readyAtTick = Number.isFinite(enemyState.idleMoveReadyAtTick) ? enemyState.idleMoveReadyAtTick : 0;
        if (!enemyState.idleDestination) {
            if (currentTick < readyAtTick) return false;
            const wanderPlan = pickEnemyIdleWanderTarget(enemyState, reservedTiles);
            if (!wanderPlan) {
                scheduleEnemyIdleWanderPause(enemyState, 1, 2);
                return false;
            }
            enemyState.idleDestination = wanderPlan.destination;
        }

        const idlePath = resolvePathToTile(enemyState, enemyState.idleDestination, false, null);
        if (idlePath === null || idlePath.length === 0) {
            scheduleEnemyIdleWanderPause(enemyState, 1, 2);
            return false;
        }

        const nextStep = idlePath[0];
        const nextKey = `${nextStep.x},${nextStep.y},${enemyState.z}`;
        if (!reservedTiles.has(nextKey)) moveEnemyToStep(enemyState, nextStep);

        if (enemyState.idleDestination && enemyState.x === enemyState.idleDestination.x && enemyState.y === enemyState.idleDestination.y) {
            scheduleEnemyIdleWanderPause(enemyState);
        }

        return true;
    }

    function facePlayerTowards(tile) {
        if (!tile) return;
        const dx = tile.x - playerState.x;
        const dy = tile.y - playerState.y;
        if (dx === 0 && dy === 0) return;
        playerState.targetRotation = Math.atan2(dx, dy);
    }

    function faceEnemyTowards(enemyState, tile) {
        if (!enemyState || !tile) return;
        const dx = tile.x - enemyState.x;
        const dy = tile.y - enemyState.y;
        if (dx === 0 && dy === 0) return;
        enemyState.facingYaw = Math.atan2(dx, dy);
    }

    function beginEnemyReturn(enemyState) {
        if (!enemyState || enemyState.currentState === 'dead') return;
        enemyState.currentState = 'returning';
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.lastDamagerId = null;
        clearEnemyIdleWanderState(enemyState);
    }

    function restoreEnemyAtHome(enemyState) {
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!enemyType) return;
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        enemyState.prevX = enemyState.x;
        enemyState.prevY = enemyState.y;
        enemyState.x = homeTile.x;
        enemyState.y = homeTile.y;
        enemyState.z = homeTile.z;
        enemyState.currentHealth = enemyType.stats.hitpoints;
        enemyState.currentState = 'idle';
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.lastDamagerId = null;
        enemyState.attackTriggerAt = 0;
        enemyState.homeReachedAt = Date.now();
        enemyState.moveTriggerAt = 0;
        faceEnemyTowards(enemyState, homeTile);
        scheduleEnemyIdleWanderPause(enemyState, 2, 4);
        markCombatEnemyOccupancyDirty();
    }

    function rollInclusive(minimum, maximum) {
        const low = Number.isFinite(minimum) ? Math.floor(minimum) : 0;
        const high = Number.isFinite(maximum) ? Math.floor(maximum) : low;
        if (high <= low) return Math.max(0, low);
        return low + Math.floor(Math.random() * ((high - low) + 1));
    }

    function spawnEnemyDrop(enemyState) {
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!enemyType || typeof spawnGroundItem !== 'function') return;
        if (!combatRuntime || typeof combatRuntime.pickDropEntry !== 'function') return;
        const dropEntry = combatRuntime.pickDropEntry(enemyType.dropTable || []);
        if (!dropEntry || dropEntry.kind === 'nothing') return;

        if (dropEntry.kind === 'coins' && ITEM_DB && ITEM_DB.coins) {
            const amount = rollInclusive(dropEntry.minAmount, dropEntry.maxAmount);
            if (amount > 0) spawnGroundItem(ITEM_DB.coins, enemyState.x, enemyState.y, enemyState.z, amount);
            return;
        }

        if (dropEntry.kind === 'item' && dropEntry.itemId && ITEM_DB && ITEM_DB[dropEntry.itemId]) {
            const amount = rollInclusive(dropEntry.minAmount, dropEntry.maxAmount);
            if (amount > 0) spawnGroundItem(ITEM_DB[dropEntry.itemId], enemyState.x, enemyState.y, enemyState.z, amount);
        }
    }

    function defeatEnemy(enemyState) {
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        const defeatTick = Number.isFinite(enemyState && enemyState.pendingDefeatAtTick)
            ? Math.floor(enemyState.pendingDefeatAtTick)
            : currentTick;
        enemyState.currentState = 'dead';
        enemyState.currentHealth = 0;
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.attackTriggerAt = 0;
        enemyState.lastDamagerId = null;
        enemyState.pendingDefeatAtTick = null;
        enemyState.pendingDefeatFacingYaw = null;
        enemyState.respawnAtTick = defeatTick + Math.max(1, Math.floor(
            (combatEnemySpawnNodesById[enemyState.spawnNodeId] && combatEnemySpawnNodesById[enemyState.spawnNodeId].respawnTicks)
            || (enemyType && enemyType.respawnTicks)
            || 1
        ));
        if (playerState.lockedTargetId === enemyState.runtimeId) clearPlayerCombatTarget({ force: true, reason: 'target-defeated' });
        spawnEnemyDrop(enemyState);
        clearEnemyRenderer(enemyState.runtimeId);
        markCombatEnemyOccupancyDirty();
    }

    function respawnEnemy(enemyState) {
        const spawnNode = combatEnemySpawnNodesById[enemyState.spawnNodeId];
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!spawnNode || !enemyType) return;
        const spawnTile = clonePoint(spawnNode.spawnTile);
        const homeTile = spawnNode.homeTileOverride ? clonePoint(spawnNode.homeTileOverride) : clonePoint(spawnTile);
        const resolvedRoamingRadius = Number.isFinite(spawnNode.roamingRadiusOverride)
            ? Math.max(0, Math.floor(Number(spawnNode.roamingRadiusOverride)))
            : enemyType.behavior.roamingRadius;
        enemyState.prevX = spawnTile.x;
        enemyState.prevY = spawnTile.y;
        enemyState.x = spawnTile.x;
        enemyState.y = spawnTile.y;
        enemyState.z = spawnTile.z;
        enemyState.currentHealth = enemyType.stats.hitpoints;
        enemyState.currentState = 'idle';
        enemyState.lockedTargetId = null;
        enemyState.remainingAttackCooldown = 0;
        enemyState.resolvedHomeTile = homeTile;
        enemyState.resolvedSpawnTile = clonePoint(spawnTile);
        enemyState.resolvedRoamingRadius = resolvedRoamingRadius;
        enemyState.resolvedChaseRange = Math.max(enemyType.behavior.chaseRange, resolvedRoamingRadius + 2);
        enemyState.resolvedAggroRadius = enemyType.behavior.aggroRadius;
        enemyState.defaultMovementSpeed = enemyType.behavior.defaultMovementSpeed;
        enemyState.combatMovementSpeed = enemyType.behavior.combatMovementSpeed;
        enemyState.facingYaw = Number.isFinite(spawnNode.facingYaw)
            ? Number(spawnNode.facingYaw)
            : (Number.isFinite(enemyType.appearance.facingYaw) ? Number(enemyType.appearance.facingYaw) : Math.PI);
        enemyState.respawnAtTick = null;
        enemyState.pendingDefeatAtTick = null;
        enemyState.pendingDefeatFacingYaw = null;
        enemyState.lastDamagerId = null;
        enemyState.attackTriggerAt = 0;
        enemyState.moveTriggerAt = 0;
        enemyState.homeReachedAt = 0;
        scheduleEnemyIdleWanderPause(enemyState, 2, 4);
        markCombatEnemyOccupancyDirty();
    }

    function resolvePlayerAttackSkill() {
        if (playerState.selectedMeleeStyle === 'strength') return 'strength';
        if (playerState.selectedMeleeStyle === 'defense') return 'defense';
        return 'attack';
    }

    function applyPlayerDefeat() {
        const respawn = resolveRespawnLocation();
        const maxHitpoints = typeof getMaxHitpoints === 'function' ? getMaxHitpoints() : Math.max(1, playerState.currentHitpoints || 10);
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
        clearPlayerCombatTarget({ force: true, reason: 'player-defeated' });
        if (typeof clearMinimapDestination === 'function') clearMinimapDestination();
        if (typeof addChatMessage === 'function') addChatMessage(PLAYER_DEFEAT_MESSAGE, 'warn');

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (enemyState.lockedTargetId === PLAYER_TARGET_ID) beginEnemyReturn(enemyState);
        }
    }

    function validatePlayerTargetLock() {
        const lockedEnemy = getPlayerLockedEnemy();
        if (!lockedEnemy) {
            const hasCombatSelection =
                !!playerState.lockedTargetId
                || playerState.combatTargetKind === PLAYER_TARGET_KIND
                || playerState.targetObj === 'ENEMY';
            if (hasCombatSelection) clearPlayerCombatTarget({ reason: 'missing-locked-enemy' });
            return null;
        }
        if (!isEnemyAlive(lockedEnemy)) {
            clearPlayerCombatTarget({ force: true, reason: 'locked-enemy-not-alive' });
            return null;
        }
        playerState.targetX = lockedEnemy.x;
        playerState.targetY = lockedEnemy.y;
        const pursuitPath = resolvePathToEnemy(lockedEnemy);
        if (pursuitPath === null) {
            return {
                enemyState: lockedEnemy,
                pursuitPath: null
            };
        }
        return {
            enemyState: lockedEnemy,
            pursuitPath
        };
    }

    function validateEnemyTargetLock(enemyState) {
        if (!isEnemyAlive(enemyState)) return null;
        if (!isPlayerAlive()) {
            beginEnemyReturn(enemyState);
            return null;
        }
        const playerTile = { x: playerState.x, y: playerState.y, z: playerState.z };
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        if (!getSquareRange(homeTile, playerTile, enemyState.resolvedChaseRange)) {
            beginEnemyReturn(enemyState);
            return null;
        }
        return enemyState;
    }

    function acquireAggressiveEnemyTargets() {
        if (!isPlayerAlive()) return;
        const playerTile = { x: playerState.x, y: playerState.y, z: playerState.z };
        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) continue;
            if (enemyState.currentState !== 'idle') continue;
            const enemyType = getEnemyDefinition(enemyState.enemyId);
            if (!enemyType || enemyType.behavior.aggroType !== 'aggressive') continue;
            if (!getSquareRange(enemyState, playerTile, enemyState.resolvedAggroRadius)) continue;
            const pursuitPath = resolvePathToPlayer(enemyState);
            if (pursuitPath === null) continue;
            enemyState.currentState = 'aggroed';
            enemyState.lockedTargetId = PLAYER_TARGET_ID;
            enemyState.lastDamagerId = PLAYER_TARGET_ID;
            faceEnemyTowards(enemyState, playerState);
            clearEnemyIdleWanderState(enemyState);
        }
    }

    function collectReadyAttacks(playerLockState) {
        const attacks = [];
        const playerSnapshot = getPlayerCombatSnapshot();
        if (playerLockState && playerSnapshot && playerSnapshot.canAttack && playerState.remainingAttackCooldown === 0) {
            if (isWithinMeleeRange(playerState, playerLockState.enemyState)) {
                facePlayerTowards(playerLockState.enemyState);
                attacks.push({
                    attackerKind: 'player',
                    attackerId: PLAYER_TARGET_ID,
                    targetKind: 'enemy',
                    targetId: playerLockState.enemyState.runtimeId,
                    snapshot: playerSnapshot
                });
            }
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) continue;
            if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID) continue;
            if (enemyState.remainingAttackCooldown > 0 || !isPlayerAlive()) continue;
            const enemySnapshot = getEnemyCombatSnapshot(enemyState);
            if (!enemySnapshot) continue;
            if (!isWithinMeleeRange(enemyState, playerState)) continue;
            faceEnemyTowards(enemyState, playerState);
            attacks.push({
                attackerKind: 'enemy',
                attackerId: enemyState.runtimeId,
                targetKind: 'player',
                targetId: PLAYER_TARGET_ID,
                snapshot: enemySnapshot
            });
        }

        return attacks;
    }

    function resolveAttackBatch(attacks) {
        const results = [];
        let playerDamageTotal = 0;
        const playerAttackers = [];

        for (let i = 0; i < attacks.length; i++) {
            const attack = attacks[i];
            if (attack.attackerKind === 'player') {
                const enemyState = getCombatEnemyState(attack.targetId);
                if (!isEnemyAlive(enemyState)) continue;
                const enemySnapshot = getEnemyCombatSnapshot(enemyState);
                if (!enemySnapshot) continue;
                const landed = combatRuntime.rollOpposedHitCheck(attack.snapshot.attackValue, enemySnapshot.defenseValue);
                const damage = landed ? combatRuntime.rollDamage(attack.snapshot.maxHit) : 0;
                results.push({
                    attackerKind: 'player',
                    attackerId: PLAYER_TARGET_ID,
                    targetKind: 'enemy',
                    targetId: enemyState.runtimeId,
                    landed,
                    damage,
                    tickCycle: attack.snapshot.attackTickCycle
                });
                continue;
            }

            const enemyState = getCombatEnemyState(attack.attackerId);
            if (!isEnemyAlive(enemyState) || !isPlayerAlive()) continue;
            const playerSnapshot = getPlayerCombatSnapshot();
            if (!playerSnapshot) continue;
            const landed = combatRuntime.rollOpposedHitCheck(attack.snapshot.attackValue, playerSnapshot.defenseValue);
            const damage = landed ? combatRuntime.rollDamage(attack.snapshot.maxHit) : 0;
            playerDamageTotal += damage;
            playerAttackers.push(enemyState.runtimeId);
            results.push({
                attackerKind: 'enemy',
                attackerId: enemyState.runtimeId,
                targetKind: 'player',
                targetId: PLAYER_TARGET_ID,
                landed,
                damage,
                tickCycle: attack.snapshot.attackTickCycle
            });
        }

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.attackerKind === 'player') {
                playerState.lastAttackTick = currentTick;
                playerState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));
                playerState.inCombat = true;
                if (playerRig && playerRig.userData && playerRig.userData.rig) {
                    playerRig.userData.rig.attackTrigger = Date.now();
                }
                const enemyState = getCombatEnemyState(result.targetId);
                if (!enemyState || !isEnemyAlive(enemyState)) continue;
                enemyState.lastDamagerId = PLAYER_TARGET_ID;
                if (typeof spawnHitsplat === 'function') spawnHitsplat(result.damage, enemyState.x, enemyState.y);
                if (result.damage > 0) {
                    enemyState.currentHealth = Math.max(0, enemyState.currentHealth - result.damage);
                    if (typeof addSkillXp === 'function') {
                        addSkillXp(resolvePlayerAttackSkill(), result.damage * 4);
                        addSkillXp('hitpoints', result.damage);
                    }
                }
                if (enemyState.currentHealth > 0) {
                    const shouldSetOpeningCooldown = enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID;
                    enemyState.currentState = 'aggroed';
                    enemyState.lockedTargetId = PLAYER_TARGET_ID;
                    enemyState.lastDamagerId = PLAYER_TARGET_ID;
                    faceEnemyTowards(enemyState, playerState);
                    clearEnemyIdleWanderState(enemyState);
                    if (shouldSetOpeningCooldown) enemyState.remainingAttackCooldown = 1;
                } else if (!Number.isFinite(enemyState.pendingDefeatAtTick)) {
                    enemyState.pendingDefeatAtTick = currentTick;
                    enemyState.pendingDefeatFacingYaw = captureEnemyPendingDefeatFacing(enemyState);
                    enemyState.facingYaw = enemyState.pendingDefeatFacingYaw;
                    enemyState.lockedTargetId = null;
                    enemyState.remainingAttackCooldown = 0;
                    enemyState.lastDamagerId = PLAYER_TARGET_ID;
                }
            } else {
                const enemyState = getCombatEnemyState(result.attackerId);
                if (!enemyState || !isEnemyAlive(enemyState)) continue;
                enemyState.attackTriggerAt = Date.now();
                enemyState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));
                enemyState.currentState = 'aggroed';
                enemyState.lockedTargetId = PLAYER_TARGET_ID;
                enemyState.lastDamagerId = PLAYER_TARGET_ID;
                clearEnemyIdleWanderState(enemyState);
                playerState.lastDamagerEnemyId = enemyState.runtimeId;
                playerState.inCombat = true;
                if (typeof spawnHitsplat === 'function') spawnHitsplat(result.damage, playerState.x, playerState.y);
            }
        }

        if (playerDamageTotal > 0 && typeof applyHitpointDamage === 'function') {
            applyHitpointDamage(playerDamageTotal, 0);
        }

        if (!isPlayerAlive()) {
            applyPlayerDefeat();
        } else if (!getPlayerLockedEnemy() && playerState.autoRetaliateEnabled && playerAttackers.length > 0) {
            lockPlayerCombatTarget(playerAttackers[0]);
        }

        return results;
    }

    function movePlayerTowardLockedTarget(playerLockState, attackedThisTick) {
        if (!playerLockState || attackedThisTick) return;
        if (playerState.action === 'SKILLING: FLETCHING') return;
        if (playerLockState.pursuitPath && playerLockState.pursuitPath.length > 0) {
            playerState.path = playerLockState.pursuitPath;
            playerState.action = 'WALKING';
        } else if (isWithinMeleeRange(playerState, playerLockState.enemyState)) {
            facePlayerTowards(playerLockState.enemyState);
            playerState.action = 'COMBAT: MELEE';
        }
    }

    function moveEnemyToStep(enemyState, nextStep) {
        if (!enemyState || !nextStep) return false;
        const nextX = Number.isFinite(nextStep.x) ? Math.floor(nextStep.x) : enemyState.x;
        const nextY = Number.isFinite(nextStep.y) ? Math.floor(nextStep.y) : enemyState.y;
        if (nextX === enemyState.x && nextY === enemyState.y) return false;
        enemyState.prevX = enemyState.x;
        enemyState.prevY = enemyState.y;
        enemyState.x = nextX;
        enemyState.y = nextY;
        enemyState.moveTriggerAt = Date.now();
        faceEnemyTowards(enemyState, nextStep);
        markCombatEnemyOccupancyDirty();
        return true;
    }

    function syncMeleeCombatFacing() {
        if (!isPlayerAlive()) return;
        if (!isPlayerCombatFacingReady()) return;

        const focus = resolveCombatHudFocusEnemy();
        const focusEnemy = focus && focus.enemyState ? focus.enemyState : null;
        if (playerState.inCombat && focusEnemy && focusEnemy.z === playerState.z) {
            facePlayerTowards(focusEnemy);
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState)) continue;
            if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID) continue;
            if (enemyState.z !== playerState.z) continue;
            faceEnemyTowards(enemyState, playerState);
        }
    }

    function updateEnemyMovement(attacks) {
        const attackedEnemyIds = new Set(attacks.filter((entry) => entry.attackerKind === 'enemy').map((entry) => entry.attackerId));
        const reservedTiles = new Set();
        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (isEnemyAlive(enemyState)) reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!isEnemyAlive(enemyState) || attackedEnemyIds.has(enemyState.runtimeId)) continue;
            reservedTiles.delete(`${enemyState.x},${enemyState.y},${enemyState.z}`);

            if (enemyState.currentState === 'returning') {
                const returnPath = resolvePathToHome(enemyState);
                if (returnPath === null || returnPath.length === 0) {
                    restoreEnemyAtHome(enemyState);
                    reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                    continue;
                }
                const homeStep = returnPath[0];
                const homeKey = `${homeStep.x},${homeStep.y},${enemyState.z}`;
                if (!reservedTiles.has(homeKey)) moveEnemyToStep(enemyState, homeStep);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (enemyState.currentState === 'idle') {
                updateIdleEnemyMovement(enemyState, reservedTiles);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID) {
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (!isPlayerAlive()) {
                beginEnemyReturn(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (isWithinMeleeRange(enemyState, playerState)) {
                faceEnemyTowards(enemyState, playerState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            const pursuitPath = resolvePathToPlayer(enemyState);
            if (pursuitPath === null) {
                beginEnemyReturn(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }
            if (pursuitPath.length === 0) {
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            const nextStep = pursuitPath[0];
            const nextKey = `${nextStep.x},${nextStep.y},${enemyState.z}`;
            if (!reservedTiles.has(nextKey)) moveEnemyToStep(enemyState, nextStep);
            reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
        }
    }

    function processCombatTick() {
        ensureCombatEnemyWorldReady();
        if (!combatRuntime || !Array.isArray(combatEnemyStates)) return;
        if (!isPlayerAlive()) {
            applyPlayerDefeat();
            refreshCombatEnemyOccupancy();
            return;
        }

        if (!playerState.inCombat) {
            playerState.remainingAttackCooldown = 0;
        } else {
            playerState.remainingAttackCooldown = combatRuntime.decrementCooldown(playerState.remainingAttackCooldown || 0);
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (isEnemyPendingDefeat(enemyState) && currentTick > enemyState.pendingDefeatAtTick) {
                defeatEnemy(enemyState);
                continue;
            }
            if (enemyState.currentState === 'dead' && Number.isFinite(enemyState.respawnAtTick) && currentTick >= enemyState.respawnAtTick) {
                respawnEnemy(enemyState);
                continue;
            }
            if (isEnemyAlive(enemyState)) {
                enemyState.remainingAttackCooldown = combatRuntime.decrementCooldown(enemyState.remainingAttackCooldown || 0);
            }
        }

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (enemyState.currentState === 'aggroed') validateEnemyTargetLock(enemyState);
        }

        acquireAggressiveEnemyTargets();

        const playerLockState = validatePlayerTargetLock();
        const attacks = collectReadyAttacks(playerLockState);
        const attackResults = resolveAttackBatch(attacks);
        const playerAttackedThisTick = attackResults.some((entry) => entry.attackerKind === 'player');

        if (playerAttackedThisTick && isPlayerAlive()) {
            playerState.action = 'COMBAT: MELEE';
            playerState.path = [];
        }

        if (isPlayerAlive()) {
            movePlayerTowardLockedTarget(playerLockState, playerAttackedThisTick);
        }

        updateEnemyMovement(attackResults);
        syncMeleeCombatFacing();
        refreshCombatEnemyOccupancy();

        if (!playerState.lockedTargetId && playerState.action === 'COMBAT: MELEE') playerState.action = 'IDLE';
    }

    function ensureCombatEnemyRenderLayer() {
        if (!scene || typeof THREE === 'undefined') return null;
        if (!combatEnemyRenderLayer) {
            combatEnemyRenderLayer = new THREE.Group();
            combatEnemyRenderLayer.name = 'combat-enemies';
            scene.add(combatEnemyRenderLayer);
        }
        return combatEnemyRenderLayer;
    }

    function createEnemyHitpointsBarRenderer() {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.transform = 'translate(-50%, -135%)';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '1002';
        el.style.display = 'none';
        el.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))';

        const frame = document.createElement('div');
        frame.style.width = '38px';
        frame.style.height = '7px';
        frame.style.padding = '1px';
        frame.style.border = '1px solid rgba(8, 10, 12, 0.95)';
        frame.style.background = 'rgba(34, 14, 14, 0.95)';
        frame.style.borderRadius = '999px';
        frame.style.boxSizing = 'border-box';
        frame.style.overflow = 'hidden';

        const fill = document.createElement('div');
        fill.style.width = '100%';
        fill.style.height = '100%';
        fill.style.borderRadius = '999px';
        fill.style.background = '#52d273';
        fill.style.transition = 'width 80ms linear, background-color 80ms linear';

        frame.appendChild(fill);
        el.appendChild(frame);
        document.body.appendChild(el);
        return { el, fill };
    }

    function shouldShowEnemyHitpointsBar(enemyState) {
        const isVisibleEnemy = isEnemyAlive(enemyState) || isEnemyPendingDefeat(enemyState);
        if (!isVisibleEnemy) return false;
        if (!playerState || !playerState.inCombat) return false;
        if (enemyState.lockedTargetId === PLAYER_TARGET_ID) return true;
        if (enemyState.lastDamagerId === PLAYER_TARGET_ID) return true;
        if (enemyState.runtimeId === playerState.lockedTargetId) return true;
        if (enemyState.runtimeId === playerState.lastDamagerEnemyId) return true;
        return false;
    }

    function updateEnemyHitpointsBar(enemyState, renderer) {
        if (!renderer || !renderer.healthBarEl || !renderer.healthBarFillEl || !renderer.group || !camera) return;
        if (!shouldShowEnemyHitpointsBar(enemyState) || enemyState.z !== playerState.z) {
            renderer.healthBarEl.style.display = 'none';
            return;
        }

        const maxHealth = Math.max(1, Number.isFinite(renderer.maxHealth) ? Math.floor(renderer.maxHealth) : 1);
        const currentHealth = Math.max(0, Math.min(maxHealth, Number.isFinite(enemyState.currentHealth) ? Math.floor(enemyState.currentHealth) : maxHealth));
        const ratio = Math.max(0, Math.min(1, currentHealth / maxHealth));

        renderer.healthBarFillEl.style.width = `${ratio * 100}%`;
        if (ratio > 0.6) renderer.healthBarFillEl.style.background = '#52d273';
        else if (ratio > 0.3) renderer.healthBarFillEl.style.background = '#f1c453';
        else renderer.healthBarFillEl.style.background = '#ef5555';

        const overheadPos = renderer.group.position.clone();
        overheadPos.y += Number.isFinite(renderer.healthBarYOffset) ? renderer.healthBarYOffset : 1.0;
        overheadPos.project(camera);

        if (overheadPos.z >= 1 || overheadPos.z <= -1) {
            renderer.healthBarEl.style.display = 'none';
            return;
        }

        const screenX = (overheadPos.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (overheadPos.y * -0.5 + 0.5) * window.innerHeight;
        if (screenX < -64 || screenX > window.innerWidth + 64 || screenY < -32 || screenY > window.innerHeight + 32) {
            renderer.healthBarEl.style.display = 'none';
            return;
        }

        renderer.healthBarEl.style.left = `${screenX}px`;
        renderer.healthBarEl.style.top = `${screenY}px`;
        renderer.healthBarEl.style.display = 'block';
    }

    function updateCombatEnemyOverlays() {
        if (camera && typeof camera.updateMatrixWorld === 'function') camera.updateMatrixWorld();
        const enemyIds = Object.keys(combatEnemyRenderersById);
        for (let i = 0; i < enemyIds.length; i++) {
            const enemyId = enemyIds[i];
            const renderer = combatEnemyRenderersById[enemyId];
            const enemyState = combatEnemyStateById[enemyId];
            if (!renderer || !enemyState) continue;
            updateEnemyHitpointsBar(enemyState, renderer);
        }
    }

    function createRatRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const furMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6258, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xcbb7a2, flatShading: true });
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xa7847a, flatShading: true });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), furMaterial);
        body.scale.set(1.35, 0.72, 1.75);
        body.position.set(0, 0.2, 0);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), bellyMaterial);
        belly.scale.set(1.0, 0.55, 1.1);
        belly.position.set(0, 0.12, 0.1);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), furMaterial);
        head.scale.set(1.0, 0.92, 1.15);
        head.position.set(0, 0.24, 0.34);

        const earLeft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), furMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.09, 0.35, 0.35);
        earRight.position.set(-0.09, 0.35, 0.35);

        const tailGeometry = new THREE.CylinderGeometry(0.022, 0.012, 0.48, 5);
        tailGeometry.rotateX(Math.PI / 2);
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0.14, -0.42);
        tail.rotation.x = Math.PI / 8;

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.5, 0.9),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.24;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        group.add(body, belly, head, earLeft, earRight, tail, hitbox);
        return { group, hitbox, kind: 'rat', body, head, tail };
    }

    function createHumanoidEnemyRenderer(enemyState, enemyType) {
        const group = createHumanoidModel(enemyType.appearance && Number.isFinite(enemyType.appearance.npcType) ? enemyType.appearance.npcType : 3);
        const combatLevel = getEnemyCombatLevel(enemyType);
        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 2.0, 1.0),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 1.0;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };
        group.add(hitbox);
        return { group, hitbox, kind: 'humanoid' };
    }

    function createEnemyRenderer(enemyState) {
        const layer = ensureCombatEnemyRenderLayer();
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!layer || !enemyType) return null;

        let renderer = null;
        if (enemyType.appearance && enemyType.appearance.kind === 'rat') renderer = createRatRenderer(enemyState, enemyType);
        else renderer = createHumanoidEnemyRenderer(enemyState, enemyType);

        const hitpointsBar = createEnemyHitpointsBarRenderer();
        renderer.healthBarEl = hitpointsBar.el;
        renderer.healthBarFillEl = hitpointsBar.fill;
        renderer.maxHealth = Number.isFinite(enemyType.stats && enemyType.stats.hitpoints)
            ? Math.max(1, Math.floor(enemyType.stats.hitpoints))
            : 1;
        renderer.healthBarYOffset = renderer.kind === 'rat' ? 0.66 : 1.15;
        renderer.group.position.set(enemyState.x, 0, enemyState.y);
        renderer.group.rotation.y = enemyState.facingYaw || 0;
        layer.add(renderer.group);
        environmentMeshes.push(renderer.hitbox);
        combatEnemyRenderersById[enemyState.runtimeId] = renderer;
        return renderer;
    }

    function getEnemyVisualMoveProgress(enemyState, frameNow) {
        if (!enemyState) return 1;
        const moved = enemyState.x !== enemyState.prevX || enemyState.y !== enemyState.prevY;
        if (!moved) return 1;
        const moveStartedAt = Number.isFinite(enemyState.moveTriggerAt) ? enemyState.moveTriggerAt : 0;
        if (moveStartedAt <= 0) return 1;
        const elapsed = Math.max(0, frameNow - moveStartedAt);
        return Math.max(0, Math.min(1, elapsed / ENEMY_MOVE_LERP_DURATION_MS));
    }

    function updateEnemyRenderer(enemyState, renderer, frameNow) {
        const moveProgress = getEnemyVisualMoveProgress(enemyState, frameNow);
        const prevX = Number.isFinite(enemyState.prevX) ? enemyState.prevX : enemyState.x;
        const prevY = Number.isFinite(enemyState.prevY) ? enemyState.prevY : enemyState.y;
        const currentVisualX = prevX + ((enemyState.x - prevX) * moveProgress);
        const currentVisualY = prevY + ((enemyState.y - prevY) * moveProgress);
        const prevTerrainHeight = getVisualHeight(prevX, prevY, enemyState.z);
        const terrainHeight = getVisualHeight(enemyState.x, enemyState.y, enemyState.z);
        const currentVisualHeight = prevTerrainHeight + ((terrainHeight - prevTerrainHeight) * moveProgress);
        const idlePhase = ((frameNow + (currentVisualX * 37) + (currentVisualY * 19)) % 1200) / 1200 * Math.PI * 2;
        const idleBob = Math.sin(idlePhase) * 0.04;
        renderer.group.position.set(currentVisualX, currentVisualHeight + idleBob, currentVisualY);

        let targetYaw = enemyState.facingYaw;
        let snapCombatFacing = false;
        const moved = enemyState.x !== prevX || enemyState.y !== prevY;
        if (isEnemyPendingDefeat(enemyState) && Number.isFinite(enemyState.pendingDefeatFacingYaw)) {
            targetYaw = enemyState.pendingDefeatFacingYaw;
            snapCombatFacing = true;
        } else if (
            enemyState.currentState === 'aggroed'
            && enemyState.lockedTargetId === PLAYER_TARGET_ID
            && isPlayerAlive()
            && enemyState.z === playerState.z
            && isPlayerCombatFacingReady()
        ) {
            targetYaw = Math.atan2(playerState.x - currentVisualX, playerState.y - currentVisualY);
            snapCombatFacing = true;
        } else if (moved) {
            targetYaw = Math.atan2(enemyState.x - prevX, enemyState.y - prevY);
        }
        if (targetYaw !== undefined) {
            if (snapCombatFacing) {
                renderer.group.rotation.y = targetYaw;
            } else {
                let diff = targetYaw - renderer.group.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const turnLerp = moved ? 0.55 : 0.25;
                renderer.group.rotation.y += diff * turnLerp;
            }
        }

        renderer.hitbox.userData.gridX = enemyState.x;
        renderer.hitbox.userData.gridY = enemyState.y;
        renderer.hitbox.userData.z = enemyState.z;
        if (!Number.isFinite(renderer.hitbox.userData.combatLevel)) {
            const enemyType = getEnemyDefinition(enemyState.enemyId);
            renderer.hitbox.userData.combatLevel = getEnemyCombatLevel(enemyType);
        }

        if (renderer.kind === 'rat') {
            const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
            const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
            renderer.body.scale.set(1.35, 0.72 + (attackPulse * 0.08), 1.75 - (attackPulse * 0.08));
            renderer.head.position.z = 0.34 + (attackPulse * 0.14);
            renderer.tail.rotation.y = Math.sin(idlePhase * 2) * 0.35;
            renderer.tail.rotation.x = Math.PI / 8;
            return;
        }

        const rig = renderer.group.userData && renderer.group.userData.rig ? renderer.group.userData.rig : null;
        if (!rig) return;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;

        rig.leftArm.rotation.set(Math.sin(idlePhase) * 0.06, 0, 0);
        rig.rightArm.rotation.set(-Math.sin(idlePhase) * 0.06, 0, 0);
        rig.leftLowerArm.rotation.set(-0.04, 0, 0);
        rig.rightLowerArm.rotation.set(-0.04, 0, 0);
        rig.leftLeg.rotation.x = 0;
        rig.rightLeg.rotation.x = 0;
        if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
        if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
        if (rig.torso) rig.torso.rotation.set(-0.02, attackPulse * 0.24, 0);
        if (rig.head) rig.head.rotation.set(-0.02, -attackPulse * 0.12, 0);
        if (attackPulse > 0) {
            rig.rightArm.rotation.x = -attackPulse * 1.45;
            rig.rightArm.rotation.z = -attackPulse * 0.18;
            rig.leftArm.rotation.x = attackPulse * 0.2;
        }
    }

    function updateCombatRenderers(frameNow) {
        ensureCombatEnemyWorldReady();
        if (!scene || typeof THREE === 'undefined') return;

        for (let i = 0; i < combatEnemyStates.length; i++) {
            const enemyState = combatEnemyStates[i];
            if (!enemyState) continue;
            if (enemyState.currentState === 'dead') {
                clearEnemyRenderer(enemyState.runtimeId);
                continue;
            }
            let renderer = combatEnemyRenderersById[enemyState.runtimeId];
            if (!renderer) renderer = createEnemyRenderer(enemyState);
            if (!renderer) continue;
            updateEnemyRenderer(enemyState, renderer, frameNow);
        }
    }

    window.initCombatWorldState = initCombatWorldState;
    window.processCombatTick = processCombatTick;
    window.updateCombatRenderers = updateCombatRenderers;
    window.updateCombatEnemyOverlays = updateCombatEnemyOverlays;
    window.getCombatEnemyOccupiedBaseTileId = getCombatEnemyOccupiedBaseTileId;
    window.clearCombatEnemyRenderers = clearCombatEnemyRenderers;
    window.clearPlayerCombatTarget = clearPlayerCombatTarget;
    window.lockPlayerCombatTarget = lockPlayerCombatTarget;
    window.getCombatEnemyState = getCombatEnemyState;
    window.getCombatHudSnapshot = getCombatHudSnapshot;
})();
