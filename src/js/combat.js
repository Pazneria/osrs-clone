(function () {
    const combatRuntime = window.CombatRuntime || null;
    const combatQaDebugRuntime = window.CombatQaDebugRuntime || null;
    const combatEnemyOverlayRuntime = window.CombatEnemyOverlayRuntime || null;
    const PLAYER_TARGET_ID = 'player';
    const PLAYER_TARGET_KIND = 'enemy';
    const PLAYER_DEFEAT_MESSAGE = 'You were defeated and return to safety.';
    const PLAYER_PURSUIT_STATE_VALID = 'valid-path';
    const PLAYER_PURSUIT_STATE_TEMPORARY_BLOCK = 'temporary-occupancy-block';
    const PLAYER_PURSUIT_STATE_HARD_NO_PATH = 'hard-no-path';
    const ENEMY_IDLE_WANDER_PAUSE_MIN_TICKS = 2;
    const ENEMY_IDLE_WANDER_PAUSE_MAX_TICKS = 5;
    const ENEMY_IDLE_WANDER_PICK_ATTEMPTS = 12;
    const ENEMY_IDLE_WANDER_MIN_PATH_LENGTH = 3;
    const ENEMY_MOVE_LERP_DURATION_MS = (typeof TICK_RATE_MS === 'number' && Number.isFinite(TICK_RATE_MS) && TICK_RATE_MS > 0)
        ? Math.max(320, Math.floor(TICK_RATE_MS * 0.9))
        : 540;
    const ENEMY_MOVE_CLIP_HOLD_MS = (typeof TICK_RATE_MS === 'number' && Number.isFinite(TICK_RATE_MS) && TICK_RATE_MS > 0)
        ? Math.max(ENEMY_MOVE_LERP_DURATION_MS + 140, Math.floor(TICK_RATE_MS * 1.3))
        : Math.max(ENEMY_MOVE_LERP_DURATION_MS + 140, 780);
    const ENEMY_ANIMATION_SET_DEFS = {
        goblin_basic: {
            rigId: 'player_humanoid_v1',
            idleClipId: 'npc/goblin/idle',
            walkClipId: 'npc/goblin/walk',
            attackClipId: 'npc/goblin/attack',
            hitClipId: 'npc/goblin/hit'
        },
        guard_basic: {
            rigId: 'player_humanoid_v1',
            idleClipId: 'npc/guard/idle',
            walkClipId: 'npc/guard/walk',
            attackClipId: 'npc/guard/attack',
            hitClipId: 'npc/guard/hit'
        }
    };

    let activeCombatWorldId = null;
    let lastResolvedCombatWorldId = 'main_overworld';
    let combatEnemySpawnNodesById = Object.create(null);
    let combatEnemyStates = [];
    let combatEnemyStateById = Object.create(null);
    let combatEnemyRenderLayer = null;
    let combatEnemyRenderersById = Object.create(null);
    let combatEnemyOccupiedTiles = new Map();
    let combatEnemyOccupancyDirty = true;
    let combatAutoRetaliateAggressorOrdinal = 1;

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

        const fallbackWorldId = normalizeWorldId(activeCombatWorldId) || normalizeWorldId(lastResolvedCombatWorldId) || 'main_overworld';
        if (window.LegacyWorldAdapterRuntime && typeof window.LegacyWorldAdapterRuntime.resolveKnownWorldId === 'function') {
            const resolvedWorldId = normalizeWorldId(window.LegacyWorldAdapterRuntime.resolveKnownWorldId(rawWorldId || null, fallbackWorldId));
            if (resolvedWorldId) {
                lastResolvedCombatWorldId = resolvedWorldId;
                return resolvedWorldId;
            }
        }

        const resolvedWorldId = rawWorldId || fallbackWorldId;
        lastResolvedCombatWorldId = resolvedWorldId || 'main_overworld';
        return lastResolvedCombatWorldId;
    }

    function getEnemyDefinition(enemyId) {
        if (!combatRuntime || typeof combatRuntime.getEnemyTypeDefinition !== 'function') return null;
        return combatRuntime.getEnemyTypeDefinition(enemyId);
    }

    function getCombatSpawnNodesForWorld(worldId) {
        if (!combatRuntime) return [];
        if (typeof combatRuntime.getWorldCombatSpawnNodes === 'function') {
            const spawnNodes = combatRuntime.getWorldCombatSpawnNodes(worldId);
            return Array.isArray(spawnNodes) ? spawnNodes : [];
        }
        if (typeof combatRuntime.listEnemySpawnNodesForWorld === 'function') {
            const spawnNodes = combatRuntime.listEnemySpawnNodesForWorld(worldId);
            return Array.isArray(spawnNodes) ? spawnNodes : [];
        }
        return [];
    }

    function resolveEnemyModelPresetId(enemyType) {
        const modelPresetId = enemyType && enemyType.appearance && typeof enemyType.appearance.modelPresetId === 'string'
            ? enemyType.appearance.modelPresetId.trim().toLowerCase()
            : '';
        return modelPresetId || null;
    }

    function resolveEnemyAnimationSetId(enemyType) {
        const animationSetId = enemyType && enemyType.appearance && typeof enemyType.appearance.animationSetId === 'string'
            ? enemyType.appearance.animationSetId.trim().toLowerCase()
            : '';
        if (animationSetId) return animationSetId;
        const modelPresetId = resolveEnemyModelPresetId(enemyType);
        if (modelPresetId === 'goblin') return 'goblin_basic';
        if (modelPresetId === 'guard') return 'guard_basic';
        return null;
    }

    function resolveEnemyAnimationSetDef(enemyType) {
        const animationSetId = resolveEnemyAnimationSetId(enemyType);
        if (!animationSetId) return null;
        return ENEMY_ANIMATION_SET_DEFS[animationSetId] || null;
    }

    function isEnemyActionAnimationActive(clipId, startedAtMs, frameNowMs) {
        const bridge = window.AnimationRuntimeBridge || null;
        if (!bridge || typeof bridge.getClip !== 'function') return false;
        if (!clipId || !Number.isFinite(startedAtMs) || startedAtMs <= 0) return false;
        const clip = bridge.getClip(clipId);
        if (!clip || !Number.isFinite(clip.durationMs) || clip.durationMs <= 0) return false;
        const elapsed = Math.max(0, frameNowMs - startedAtMs);
        return elapsed <= clip.durationMs;
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

    function isTrainingDummyEnemy(enemyStateOrId) {
        const enemyId = typeof enemyStateOrId === 'string'
            ? enemyStateOrId
            : (enemyStateOrId && typeof enemyStateOrId.enemyId === 'string' ? enemyStateOrId.enemyId : '');
        return enemyId === 'enemy_training_dummy';
    }

    function markPlayerRigAnimationTrigger(triggerKey, triggerAt = Date.now()) {
        const rig = playerRig && playerRig.userData ? playerRig.userData.rig : null;
        if (!rig || typeof triggerKey !== 'string' || !triggerKey) return;
        rig[triggerKey] = Number.isFinite(triggerAt) ? triggerAt : Date.now();
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
        combatEnemyOverlayRuntime.removeEnemyHitpointsBarRenderer(renderer);
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
        combatAutoRetaliateAggressorOrdinal = 1;
        combatQaDebugRuntime.resetDebugState({ windowRef: window });
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
        return false;
    }

    function recordCombatClearEvent(event) {
        combatQaDebugRuntime.recordClearEvent({ windowRef: window }, event);
    }

    function recordPlayerPursuitDebug(enemyState, pursuitState, pursuitPath = null, occupancyIgnoredPath = null) {
        combatQaDebugRuntime.recordPlayerPursuitDebug({
            windowRef: window,
            currentTick,
            enemyState,
            pursuitState: pursuitState || PLAYER_PURSUIT_STATE_HARD_NO_PATH,
            pursuitPath,
            occupancyIgnoredPath
        });
    }

    function recordAutoRetaliateSelection(enemyState) {
        if (!enemyState) {
            combatQaDebugRuntime.recordAutoRetaliateSelection({
                windowRef: window,
                currentTick,
                selection: null
            });
            return;
        }
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        combatQaDebugRuntime.recordAutoRetaliateSelection({
            windowRef: window,
            currentTick,
            selection: {
                runtimeId: enemyState.runtimeId,
                enemyId: enemyState.enemyId,
                displayName: enemyType && enemyType.displayName ? enemyType.displayName : enemyState.enemyId,
                distance: getChebyshevDistance(playerState, enemyState),
                combatLevel: getEnemyCombatLevel(enemyType),
                aggressorOrder: Number.isFinite(enemyState.autoRetaliateAggressorOrder)
                    ? Math.floor(enemyState.autoRetaliateAggressorOrder)
                    : null
            }
        });
    }

    function clearPlayerCombatTarget(options = null) {
        const opts = options && typeof options === 'object' ? options : null;
        const forced = !!(opts && opts.force);
        const shouldResetCooldown = !!(opts && opts.resetCooldown);
        const reason = opts && typeof opts.reason === 'string' && opts.reason ? opts.reason : 'generic';
        const hasCombatSelection = hasActivePlayerCombatSelection();
        if (!hasCombatSelection && !forced) return false;
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
            combatQaDebugRuntime.recordClearResult({ windowRef: window, currentTick }, `blocked:${reason}`);
            if (combatClearEvent) combatClearEvent.blocked = true;
            recordCombatClearEvent(combatClearEvent);
            return false;
        }
        const hadEnemyTarget =
            !!playerState.lockedTargetId
            || playerState.combatTargetKind === PLAYER_TARGET_KIND
            || playerState.targetObj === 'ENEMY';
        combatQaDebugRuntime.recordClearResult({ windowRef: window, currentTick }, reason);
        recordCombatClearEvent(combatClearEvent);
        playerState.lockedTargetId = null;
        playerState.combatTargetKind = null;
        if (hadEnemyTarget) playerState.path = [];
        if (shouldResetCooldown) playerState.remainingAttackCooldown = 0;
        playerState.inCombat = false;
        if (playerState.targetObj === 'ENEMY') {
            playerState.targetObj = null;
            playerState.targetUid = null;
        }
        if (playerState.action === 'COMBAT: MELEE' || (hadEnemyTarget && playerState.action === 'WALKING')) playerState.action = 'IDLE';
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

    function clearEnemyAutoRetaliateAggressorOrder(enemyState) {
        if (!enemyState) return;
        enemyState.autoRetaliateAggressorOrder = null;
    }

    function markEnemyAutoRetaliateAggressor(enemyState) {
        if (!enemyState) return null;
        if (Number.isFinite(enemyState.autoRetaliateAggressorOrder) && enemyState.autoRetaliateAggressorOrder > 0) {
            return enemyState.autoRetaliateAggressorOrder;
        }
        enemyState.autoRetaliateAggressorOrder = combatAutoRetaliateAggressorOrdinal++;
        return enemyState.autoRetaliateAggressorOrder;
    }

    function getAutoRetaliateCandidateCombatLevel(enemyState) {
        if (!enemyState) return Number.MAX_SAFE_INTEGER;
        return getEnemyCombatLevel(getEnemyDefinition(enemyState.enemyId));
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
        clearPlayerCombatTarget({ force: true, reason: 'init-world-state', resetCooldown: true });
        playerState.lastDamagerEnemyId = null;

        if (!combatRuntime || typeof combatRuntime.listEnemySpawnNodesForWorld !== 'function' || typeof combatRuntime.createEnemyRuntimeState !== 'function') {
            return;
        }

        const spawnNodes = getCombatSpawnNodesForWorld(activeCombatWorldId);
        const seenSpawnNodeIds = new Set();
        for (let i = 0; i < spawnNodes.length; i++) {
            const spawnNode = spawnNodes[i];
            const spawnNodeId = normalizeWorldId(spawnNode && spawnNode.spawnNodeId);
            if (!spawnNode || !spawnNode.spawnEnabled || !spawnNodeId || seenSpawnNodeIds.has(spawnNodeId)) continue;
            seenSpawnNodeIds.add(spawnNodeId);
            const normalizedSpawnNode = spawnNode.spawnNodeId === spawnNodeId
                ? spawnNode
                : { ...spawnNode, spawnNodeId };
            combatEnemySpawnNodesById[spawnNodeId] = normalizedSpawnNode;
            const enemyState = combatRuntime.createEnemyRuntimeState(normalizedSpawnNode, 0);
            enemyState.prevX = enemyState.x;
            enemyState.prevY = enemyState.y;
            enemyState.moveTriggerAt = 0;
            enemyState.homeReachedAt = 0;
            enemyState.autoRetaliateAggressorOrder = null;
            clearEnemyLocomotionIntent(enemyState);
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

    function clearEnemyLocomotionIntent(enemyState) {
        if (!enemyState) return;
        enemyState.lastLocomotionIntentAt = 0;
        enemyState.locomotionIntentUntilAt = 0;
    }

    function markEnemyLocomotionIntent(enemyState, holdMs = ENEMY_MOVE_CLIP_HOLD_MS) {
        if (!enemyState) return;
        const now = Date.now();
        const safeHoldMs = Number.isFinite(holdMs) ? Math.max(0, Math.floor(holdMs)) : ENEMY_MOVE_CLIP_HOLD_MS;
        enemyState.lastLocomotionIntentAt = now;
        enemyState.locomotionIntentUntilAt = Math.max(
            Number.isFinite(enemyState.locomotionIntentUntilAt) ? enemyState.locomotionIntentUntilAt : 0,
            now + safeHoldMs
        );
    }

    function hasTrackedEnemyLocomotionIntent(enemyState, frameNow) {
        if (!enemyState) return false;
        const intentUntilAt = Number.isFinite(enemyState.locomotionIntentUntilAt) ? enemyState.locomotionIntentUntilAt : 0;
        return intentUntilAt > 0 && frameNow < intentUntilAt;
    }

    function scheduleEnemyIdleWanderPause(enemyState, minTicks = ENEMY_IDLE_WANDER_PAUSE_MIN_TICKS, maxTicks = ENEMY_IDLE_WANDER_PAUSE_MAX_TICKS) {
        if (!enemyState) return;
        enemyState.idleDestination = null;
        enemyState.idleMoveReadyAtTick = currentTick + rollInclusive(minTicks, maxTicks);
        clearEnemyLocomotionIntent(enemyState);
    }

    function resolvePathToTile(enemyState, targetTile, allowTargetOccupied = false, targetKind = null) {
        if (!enemyState || !targetTile) return null;
        if (enemyState.z !== targetTile.z) return null;
        if (enemyState.x === targetTile.x && enemyState.y === targetTile.y) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(enemyState.x, enemyState.y, targetTile.x, targetTile.y, allowTargetOccupied, targetKind);
        return path.length > 0 ? path : null;
    }

    function resolvePathToEnemy(enemyState, pathOptions = null) {
        if (!enemyState || !isEnemyAlive(enemyState)) return null;
        if (enemyState.z !== playerState.z) return null;
        if (isWithinMeleeRange(playerState, enemyState)) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(playerState.x, playerState.y, enemyState.x, enemyState.y, true, 'ENEMY', pathOptions);
        return path.length > 0 ? path : null;
    }

    function resolvePathToPlayer(enemyState, pathOptions = null) {
        if (!enemyState || !isEnemyAlive(enemyState) || !isPlayerAlive()) return null;
        if (enemyState.z !== playerState.z) return null;
        if (isWithinMeleeRange(enemyState, playerState)) return [];
        if (typeof findPath !== 'function') return null;
        const path = findPath(
            enemyState.x,
            enemyState.y,
            playerState.x,
            playerState.y,
            true,
            'ENEMY',
            Object.assign({ z: enemyState.z }, pathOptions && typeof pathOptions === 'object' ? pathOptions : null)
        );
        return path.length > 0 ? path : null;
    }

    function getPlayerCombatMovementStepCount() {
        return isRunning ? 2 : 1;
    }

    function cloneCombatPathStep(step) {
        return {
            x: Number.isFinite(step && step.x) ? Math.floor(step.x) : playerState.x,
            y: Number.isFinite(step && step.y) ? Math.floor(step.y) : playerState.y
        };
    }

    function resolvePlayerChaseAttackOpportunity(playerLockState) {
        if (!playerLockState || !playerLockState.enemyState || !Array.isArray(playerLockState.pursuitPath)) return null;
        if (playerLockState.pursuitPath.length === 0) return null;
        const stepBudget = Math.max(1, Math.floor(getPlayerCombatMovementStepCount()));
        const approachPath = playerLockState.pursuitPath
            .slice(0, stepBudget)
            .map((step) => cloneCombatPathStep(step));
        if (approachPath.length === 0) return null;
        const attackTile = approachPath[approachPath.length - 1];
        if (!isWithinMeleeRange(attackTile, playerLockState.enemyState)) return null;
        return {
            attackTile,
            approachPath
        };
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
        if (roamingRadius <= 0) {
            clearEnemyLocomotionIntent(enemyState);
            return false;
        }

        if (enemyState.idleDestination && enemyState.x === enemyState.idleDestination.x && enemyState.y === enemyState.idleDestination.y) {
            scheduleEnemyIdleWanderPause(enemyState);
            return false;
        }

        const readyAtTick = Number.isFinite(enemyState.idleMoveReadyAtTick) ? enemyState.idleMoveReadyAtTick : 0;
        if (!enemyState.idleDestination) {
            if (currentTick < readyAtTick) {
                clearEnemyLocomotionIntent(enemyState);
                return false;
            }
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

        markEnemyLocomotionIntent(enemyState);
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
        clearEnemyAutoRetaliateAggressorOrder(enemyState);
        clearEnemyIdleWanderState(enemyState);
        clearEnemyLocomotionIntent(enemyState);
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
        clearEnemyAutoRetaliateAggressorOrder(enemyState);
        enemyState.attackTriggerAt = 0;
        enemyState.hitReactionTriggerAt = 0;
        enemyState.homeReachedAt = Date.now();
        enemyState.moveTriggerAt = 0;
        clearEnemyLocomotionIntent(enemyState);
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
        enemyState.hitReactionTriggerAt = 0;
        enemyState.lastDamagerId = null;
        clearEnemyAutoRetaliateAggressorOrder(enemyState);
        enemyState.pendingDefeatAtTick = null;
        enemyState.pendingDefeatFacingYaw = null;
        clearEnemyLocomotionIntent(enemyState);
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
        clearEnemyAutoRetaliateAggressorOrder(enemyState);
        enemyState.attackTriggerAt = 0;
        enemyState.hitReactionTriggerAt = 0;
        enemyState.moveTriggerAt = 0;
        enemyState.homeReachedAt = 0;
        clearEnemyLocomotionIntent(enemyState);
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
            recordPlayerPursuitDebug(null, PLAYER_PURSUIT_STATE_HARD_NO_PATH, null, null);
            const hasCombatSelection =
                !!playerState.lockedTargetId
                || playerState.combatTargetKind === PLAYER_TARGET_KIND
                || playerState.targetObj === 'ENEMY';
            if (hasCombatSelection) clearPlayerCombatTarget({ reason: 'missing-locked-enemy' });
            return null;
        }
        if (!isEnemyAlive(lockedEnemy)) {
            recordPlayerPursuitDebug(lockedEnemy, PLAYER_PURSUIT_STATE_HARD_NO_PATH, null, null);
            clearPlayerCombatTarget({ force: true, reason: 'locked-enemy-not-alive' });
            return null;
        }
        playerState.targetX = lockedEnemy.x;
        playerState.targetY = lockedEnemy.y;
        const pursuitPath = resolvePathToEnemy(lockedEnemy);
        if (pursuitPath !== null) {
            recordPlayerPursuitDebug(lockedEnemy, PLAYER_PURSUIT_STATE_VALID, pursuitPath, pursuitPath);
            return {
                enemyState: lockedEnemy,
                pursuitPath,
                pursuitState: PLAYER_PURSUIT_STATE_VALID,
                occupancyIgnoredPursuitPath: pursuitPath
            };
        }
        const occupancyIgnoredPursuitPath = resolvePathToEnemy(lockedEnemy, {
            z: playerState.z,
            ignoreCombatEnemyOccupancy: true
        });
        if (occupancyIgnoredPursuitPath !== null) {
            recordPlayerPursuitDebug(lockedEnemy, PLAYER_PURSUIT_STATE_TEMPORARY_BLOCK, null, occupancyIgnoredPursuitPath);
            return {
                enemyState: lockedEnemy,
                pursuitPath: null,
                pursuitState: PLAYER_PURSUIT_STATE_TEMPORARY_BLOCK,
                occupancyIgnoredPursuitPath
            };
        }
        recordPlayerPursuitDebug(lockedEnemy, PLAYER_PURSUIT_STATE_HARD_NO_PATH, null, null);
        clearPlayerCombatTarget({ force: true, reason: 'locked-enemy-hard-no-path' });
        return null;
    }

    function hasValidPlayerCombatLock() {
        const lockedEnemy = getPlayerLockedEnemy();
        if (!lockedEnemy || !isEnemyAlive(lockedEnemy)) return false;
        const pursuitPath = resolvePathToEnemy(lockedEnemy);
        if (pursuitPath !== null) return true;
        const occupancyIgnoredPath = resolvePathToEnemy(lockedEnemy, {
            z: playerState.z,
            ignoreCombatEnemyOccupancy: true
        });
        return occupancyIgnoredPath !== null;
    }

    function isValidAutoRetaliateCandidate(enemyState) {
        if (!isEnemyAlive(enemyState)) return false;
        if (!isPlayerAlive()) return false;
        if (enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID) return false;
        if (enemyState.z !== playerState.z) return false;
        const playerTile = { x: playerState.x, y: playerState.y, z: playerState.z };
        const homeTile = enemyState.resolvedHomeTile || enemyState.resolvedSpawnTile;
        return !!homeTile && getSquareRange(homeTile, playerTile, enemyState.resolvedChaseRange);
    }

    function pickAutoRetaliateTarget() {
        const candidates = combatEnemyStates.filter((enemyState) => isValidAutoRetaliateCandidate(enemyState));
        if (candidates.length === 0) return null;
        candidates.sort((left, right) => {
            const leftOrder = Number.isFinite(left.autoRetaliateAggressorOrder) ? left.autoRetaliateAggressorOrder : Number.MAX_SAFE_INTEGER;
            const rightOrder = Number.isFinite(right.autoRetaliateAggressorOrder) ? right.autoRetaliateAggressorOrder : Number.MAX_SAFE_INTEGER;
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            const leftDistance = getChebyshevDistance(playerState, left);
            const rightDistance = getChebyshevDistance(playerState, right);
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;
            const leftLevel = getAutoRetaliateCandidateCombatLevel(left);
            const rightLevel = getAutoRetaliateCandidateCombatLevel(right);
            if (leftLevel !== rightLevel) return leftLevel - rightLevel;
            return String(left.runtimeId || '').localeCompare(String(right.runtimeId || ''));
        });
        return candidates[0] || null;
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
            } else {
                const chaseAttackOpportunity = resolvePlayerChaseAttackOpportunity(playerLockState);
                if (chaseAttackOpportunity) {
                    facePlayerTowards(playerLockState.enemyState);
                    attacks.push({
                        attackerKind: 'player',
                        attackerId: PLAYER_TARGET_ID,
                        targetKind: 'enemy',
                        targetId: playerLockState.enemyState.runtimeId,
                        snapshot: playerSnapshot,
                        approachPath: chaseAttackOpportunity.approachPath
                    });
                }
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
        let attackedPlayerThisTick = false;

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
                    tickCycle: attack.snapshot.attackTickCycle,
                    approachPath: Array.isArray(attack.approachPath) ? attack.approachPath.map((step) => cloneCombatPathStep(step)) : []
                });
                continue;
            }

            const enemyState = getCombatEnemyState(attack.attackerId);
            if (!isEnemyAlive(enemyState) || !isPlayerAlive()) continue;
            const playerSnapshot = getPlayerCombatSnapshot();
            if (!playerSnapshot) continue;
            const isTrainingDummyAttack = isTrainingDummyEnemy(enemyState);
            const landed = isTrainingDummyAttack
                ? true
                : combatRuntime.rollOpposedHitCheck(attack.snapshot.attackValue, playerSnapshot.defenseValue);
            const damage = isTrainingDummyAttack
                ? 0
                : (landed ? combatRuntime.rollDamage(attack.snapshot.maxHit) : 0);
            playerDamageTotal += damage;
            combatQaDebugRuntime.recordEnemyAttackResult({
                windowRef: window,
                currentTick,
                attackerId: enemyState.runtimeId,
                enemyId: enemyState.enemyId,
                landed,
                damage,
                isTrainingDummyAttack
            });
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
                markPlayerRigAnimationTrigger('attackTick', currentTick);
                markPlayerRigAnimationTrigger('attackAnimationStartedAt');
                const enemyState = getCombatEnemyState(result.targetId);
                if (!enemyState || !isEnemyAlive(enemyState)) continue;
                enemyState.lastDamagerId = PLAYER_TARGET_ID;
                if (typeof spawnHitsplat === 'function') spawnHitsplat(result.damage, enemyState.x, enemyState.y);
                if (result.damage > 0) {
                    enemyState.currentHealth = Math.max(0, enemyState.currentHealth - result.damage);
                    enemyState.hitReactionTriggerAt = Date.now();
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
                markEnemyAutoRetaliateAggressor(enemyState);
                attackedPlayerThisTick = true;
                clearEnemyIdleWanderState(enemyState);
                playerState.lastDamagerEnemyId = enemyState.runtimeId;
                playerState.inCombat = true;
                if (typeof spawnHitsplat === 'function') spawnHitsplat(result.damage, playerState.x, playerState.y);
                markPlayerRigAnimationTrigger('hitReactionTick', currentTick);
                markPlayerRigAnimationTrigger('hitReactionStartedAt');
            }
        }

        if (playerDamageTotal > 0 && typeof applyHitpointDamage === 'function') {
            applyHitpointDamage(playerDamageTotal, 0);
        }

        if (!isPlayerAlive()) {
            applyPlayerDefeat();
        } else if (attackedPlayerThisTick && playerState.autoRetaliateEnabled && !hasValidPlayerCombatLock()) {
            const autoRetaliateTarget = pickAutoRetaliateTarget();
            if (autoRetaliateTarget) {
                lockPlayerCombatTarget(autoRetaliateTarget.runtimeId);
                recordAutoRetaliateSelection(autoRetaliateTarget);
            }
        }

        return results;
    }

    function movePlayerTowardLockedTarget(playerLockState, attackedThisTick) {
        if (!playerLockState || attackedThisTick) return;
        if (playerState.action === 'SKILLING: FLETCHING') return;
        if (playerLockState.pursuitState === PLAYER_PURSUIT_STATE_TEMPORARY_BLOCK) {
            playerState.path = [];
            playerState.action = 'COMBAT: MELEE';
            return;
        }
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
        markEnemyLocomotionIntent(enemyState);
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
        const attackedEnemyIds = new Set(attacks
            .filter((entry) => entry.attackerKind === 'enemy' || entry.attackerKind === 'player')
            .map((entry) => (entry.attackerKind === 'enemy' ? entry.attackerId : entry.targetId)));
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
                markEnemyLocomotionIntent(enemyState);
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

            if (isTrainingDummyEnemy(enemyState)) {
                clearEnemyLocomotionIntent(enemyState);
                faceEnemyTowards(enemyState, playerState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            if (isWithinMeleeRange(enemyState, playerState)) {
                clearEnemyLocomotionIntent(enemyState);
                faceEnemyTowards(enemyState, playerState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            const pursuitPath = resolvePathToPlayer(enemyState);
            if (pursuitPath === null) {
                clearEnemyLocomotionIntent(enemyState);
                beginEnemyReturn(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }
            if (pursuitPath.length === 0) {
                clearEnemyLocomotionIntent(enemyState);
                reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);
                continue;
            }

            markEnemyLocomotionIntent(enemyState);
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

        playerState.remainingAttackCooldown = combatRuntime.decrementCooldown(playerState.remainingAttackCooldown || 0);

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
        const playerAttackResult = attackResults.find((entry) => entry.attackerKind === 'player') || null;
        const playerAttackedThisTick = !!playerAttackResult;

        if (playerAttackedThisTick && isPlayerAlive()) {
            playerState.action = 'COMBAT: MELEE';
            playerState.path = (playerAttackResult && Array.isArray(playerAttackResult.approachPath) && playerAttackResult.approachPath.length > 0)
                ? playerAttackResult.approachPath.map((step) => cloneCombatPathStep(step))
                : [];
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

    function updateCombatEnemyOverlays() {
        combatEnemyOverlayRuntime.updateCombatEnemyOverlays({
            camera,
            combatEnemyRenderersById,
            combatEnemyStateById,
            isEnemyAlive,
            isEnemyPendingDefeat,
            playerState,
            windowRef: window
        });
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

    function createQuadrupedLimbRig(baseX, baseY, baseZ, sideSign, front, upperMaterial, lowerMaterial, hoofMaterial, options = {}) {
        const root = new THREE.Group();
        root.rotation.order = 'YXZ';
        root.position.set(baseX, baseY, baseZ);

        const upperLength = Number.isFinite(options.upperLength) ? options.upperLength : 0.24;
        const lowerLength = Number.isFinite(options.lowerLength) ? options.lowerLength : 0.22;
        const upperRadius = Number.isFinite(options.upperRadius) ? options.upperRadius : 0.05;
        const lowerRadius = Number.isFinite(options.lowerRadius) ? options.lowerRadius : 0.04;
        const hoofWidth = Number.isFinite(options.hoofWidth) ? options.hoofWidth : 0.08;
        const hoofHeight = Number.isFinite(options.hoofHeight) ? options.hoofHeight : 0.05;
        const hoofDepth = Number.isFinite(options.hoofDepth) ? options.hoofDepth : 0.11;

        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), upperMaterial);
        shoulder.scale.set(front ? 1.0 : 0.94, 1.0, 1.0);
        shoulder.position.set(sideSign * 0.012, 0.01, 0);

        const upper = new THREE.Mesh(new THREE.CylinderGeometry(upperRadius, upperRadius * 0.94, upperLength, 5), upperMaterial);
        upper.position.y = -upperLength * 0.5;
        upper.rotation.z = sideSign * (front ? -0.08 : 0.06);

        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), lowerMaterial);
        knee.position.y = -upperLength;

        const lower = new THREE.Mesh(new THREE.CylinderGeometry(lowerRadius, lowerRadius * 0.9, lowerLength, 5), lowerMaterial);
        lower.position.y = -lowerLength * 0.5;
        lower.rotation.z = sideSign * (front ? 0.04 : -0.04);

        const hoof = new THREE.Mesh(new THREE.BoxGeometry(hoofWidth, hoofHeight, hoofDepth), hoofMaterial);
        hoof.position.y = -lowerLength + hoofHeight * 0.18;
        hoof.position.z = sideSign * 0.014;

        root.add(shoulder, upper, knee);
        knee.add(lower);
        lower.add(hoof);

        return {
            root,
            shoulder,
            upper,
            knee,
            lower,
            hoof,
            baseX,
            baseY,
            baseZ,
            sideSign,
            front,
            upperLength,
            lowerLength
        };
    }

    function poseQuadrupedLimbRig(legRig, pose = {}) {
        if (!legRig || !legRig.root) return;
        const stride = Number.isFinite(pose.stride) ? pose.stride : 0;
        const lift = Number.isFinite(pose.lift) ? pose.lift : 0;
        const sway = Number.isFinite(pose.sway) ? pose.sway : 0;
        const pitch = Number.isFinite(pose.pitch) ? pose.pitch : 0;
        const roll = Number.isFinite(pose.roll) ? pose.roll : 0;

        legRig.root.position.set(
            legRig.baseX + (stride * 0.08),
            legRig.baseY + (lift * 0.035),
            legRig.baseZ
        );
        legRig.root.rotation.set(pitch * 0.35, 0, (legRig.sideSign * 0.04) + roll);
        legRig.shoulder.rotation.set(pitch * 0.15, 0, legRig.sideSign * 0.03);
        legRig.upper.rotation.x = (stride * 0.82) + (lift * 0.18) + (legRig.front ? 0.02 : -0.02) + (sway * 0.02);
        legRig.knee.rotation.x = -lift * 0.18 + Math.abs(stride) * 0.04;
        legRig.lower.rotation.x = -(lift * 0.44) + (stride * 0.06);
        legRig.hoof.rotation.x = -lift * 0.1 + pitch * 0.05;
    }

    function createBoarRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x7b5b3c, flatShading: true });
        const limbMaterial = new THREE.MeshLambertMaterial({ color: 0x5f452f, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xa57c56, flatShading: true });
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6748, flatShading: true });
        const tuskMaterial = new THREE.MeshLambertMaterial({ color: 0xf2e6cb, flatShading: true });
        const hoofMaterial = new THREE.MeshLambertMaterial({ color: 0x37291f, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a140f, flatShading: true });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.38, 1.0), bodyMaterial);
        body.position.set(0, 0.28, 0);

        const shoulderMass = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.34), bodyMaterial);
        shoulderMass.position.set(0, 0.34, 0.28);

        const hipMass = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.3), limbMaterial);
        hipMass.position.set(0, 0.31, -0.3);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bellyMaterial);
        belly.scale.set(1.12, 0.72, 1.35);
        belly.position.set(0, 0.18, 0.08);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.38), bodyMaterial);
        head.position.set(0, 0.26, 0.57);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.28), snoutMaterial);
        snout.position.set(0, 0.2, 0.79);

        const tuskGeometry = new THREE.ConeGeometry(0.025, 0.14, 3);
        const tuskLeft = new THREE.Mesh(tuskGeometry, tuskMaterial);
        const tuskRight = tuskLeft.clone();
        tuskLeft.rotation.set(Math.PI / 2, 0, -0.32);
        tuskRight.rotation.set(Math.PI / 2, 0, 0.32);
        tuskLeft.position.set(0.07, 0.16, 0.87);
        tuskRight.position.set(-0.07, 0.16, 0.87);

        const earGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const earLeft = new THREE.Mesh(earGeometry, bodyMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.1, 0.41, 0.55);
        earRight.position.set(-0.1, 0.41, 0.55);
        earLeft.rotation.z = -0.32;
        earRight.rotation.z = 0.32;

        const tailGeometry = new THREE.CylinderGeometry(0.012, 0.008, 0.26, 5);
        tailGeometry.rotateX(Math.PI / 2);
        const tail = new THREE.Mesh(tailGeometry, hoofMaterial);
        tail.position.set(0, 0.28, -0.48);
        tail.rotation.z = -0.25;

        const frontLeftLeg = createQuadrupedLimbRig(0.24, 0.03, 0.35, 1, true, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.18,
            lowerLength: 0.22,
            upperRadius: 0.055,
            lowerRadius: 0.045,
            hoofWidth: 0.09,
            hoofHeight: 0.05,
            hoofDepth: 0.12
        });
        const frontRightLeg = createQuadrupedLimbRig(-0.24, 0.03, 0.35, -1, true, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.18,
            lowerLength: 0.22,
            upperRadius: 0.055,
            lowerRadius: 0.045,
            hoofWidth: 0.09,
            hoofHeight: 0.05,
            hoofDepth: 0.12
        });
        const backLeftLeg = createQuadrupedLimbRig(0.22, 0.03, -0.34, 1, false, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.2,
            lowerLength: 0.24,
            upperRadius: 0.05,
            lowerRadius: 0.042,
            hoofWidth: 0.085,
            hoofHeight: 0.05,
            hoofDepth: 0.11
        });
        const backRightLeg = createQuadrupedLimbRig(-0.22, 0.03, -0.34, -1, false, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.2,
            lowerLength: 0.24,
            upperRadius: 0.05,
            lowerRadius: 0.042,
            hoofWidth: 0.085,
            hoofHeight: 0.05,
            hoofDepth: 0.11
        });

        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.06, 0.28, 0.73);
        eyeRight.position.set(-0.06, 0.28, 0.73);

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.72, 1.18),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.34;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        group.add(
            body,
            shoulderMass,
            hipMass,
            belly,
            head,
            snout,
            tuskLeft,
            tuskRight,
            earLeft,
            earRight,
            tail,
            frontLeftLeg.root,
            frontRightLeg.root,
            backLeftLeg.root,
            backRightLeg.root,
            eyeLeft,
            eyeRight,
            hitbox
        );
        return {
            group,
            hitbox,
            kind: 'boar',
            body,
            shoulderMass,
            hipMass,
            belly,
            head,
            snout,
            tuskLeft,
            tuskRight,
            earLeft,
            earRight,
            tail,
            frontLeftLeg: frontLeftLeg.root,
            frontRightLeg: frontRightLeg.root,
            backLeftLeg: backLeftLeg.root,
            backRightLeg: backRightLeg.root,
            legs: {
                frontLeft: frontLeftLeg,
                frontRight: frontRightLeg,
                backLeft: backLeftLeg,
                backRight: backRightLeg
            },
            eyeLeft,
            eyeRight
        };
    }

    function createWolfRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x69605b, flatShading: true });
        const limbMaterial = new THREE.MeshLambertMaterial({ color: 0x514943, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0x8e817a, flatShading: true });
        const muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x564f4b, flatShading: true });
        const hoofMaterial = new THREE.MeshLambertMaterial({ color: 0x201b18, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xece7d5, flatShading: true });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), bodyMaterial);
        body.scale.set(1.18, 0.7, 1.58);
        body.position.set(0, 0.3, -0.02);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 10), bellyMaterial);
        belly.scale.set(1.04, 0.58, 1.18);
        belly.position.set(0, 0.18, 0.04);

        const shoulderMass = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 10), bodyMaterial);
        shoulderMass.scale.set(0.98, 0.86, 1.04);
        shoulderMass.position.set(0, 0.33, 0.24);

        const hipMass = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), limbMaterial);
        hipMass.scale.set(0.98, 0.76, 1.0);
        hipMass.position.set(0, 0.3, -0.28);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.3), bodyMaterial);
        head.position.set(0, 0.37, 0.56);

        const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), muzzleMaterial);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.34, 0.78);

        const earGeometry = new THREE.BoxGeometry(0.08, 0.14, 0.03);
        const earLeft = new THREE.Mesh(earGeometry, bodyMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.09, 0.56, 0.53);
        earRight.position.set(-0.09, 0.56, 0.53);
        earLeft.rotation.z = -0.18;
        earRight.rotation.z = 0.18;

        const tailGeometry = new THREE.CylinderGeometry(0.015, 0.008, 0.42, 5);
        tailGeometry.rotateX(Math.PI / 2);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 0.3, -0.5);
        tail.rotation.z = 0.28;

        const frontLeftLeg = createQuadrupedLimbRig(0.19, 0.04, 0.41, 1, true, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.23,
            lowerLength: 0.24,
            upperRadius: 0.045,
            lowerRadius: 0.035,
            hoofWidth: 0.07,
            hoofHeight: 0.045,
            hoofDepth: 0.1
        });
        const frontRightLeg = createQuadrupedLimbRig(-0.19, 0.04, 0.41, -1, true, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.23,
            lowerLength: 0.24,
            upperRadius: 0.045,
            lowerRadius: 0.035,
            hoofWidth: 0.07,
            hoofHeight: 0.045,
            hoofDepth: 0.1
        });
        const backLeftLeg = createQuadrupedLimbRig(0.18, 0.03, -0.35, 1, false, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.22,
            lowerLength: 0.23,
            upperRadius: 0.042,
            lowerRadius: 0.034,
            hoofWidth: 0.07,
            hoofHeight: 0.045,
            hoofDepth: 0.1
        });
        const backRightLeg = createQuadrupedLimbRig(-0.18, 0.03, -0.35, -1, false, bodyMaterial, limbMaterial, hoofMaterial, {
            upperLength: 0.22,
            lowerLength: 0.23,
            upperRadius: 0.042,
            lowerRadius: 0.034,
            hoofWidth: 0.07,
            hoofHeight: 0.045,
            hoofDepth: 0.1
        });

        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.06, 0.42, 0.72);
        eyeRight.position.set(-0.06, 0.42, 0.72);

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.7, 1.18),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.33;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        group.add(
            body,
            shoulderMass,
            hipMass,
            belly,
            head,
            muzzle,
            earLeft,
            earRight,
            tail,
            frontLeftLeg.root,
            frontRightLeg.root,
            backLeftLeg.root,
            backRightLeg.root,
            eyeLeft,
            eyeRight,
            hitbox
        );
        return {
            group,
            hitbox,
            kind: 'wolf',
            body,
            shoulderMass,
            hipMass,
            belly,
            head,
            muzzle,
            earLeft,
            earRight,
            tail,
            frontLeftLeg: frontLeftLeg.root,
            frontRightLeg: frontRightLeg.root,
            backLeftLeg: backLeftLeg.root,
            backRightLeg: backRightLeg.root,
            legs: {
                frontLeft: frontLeftLeg,
                frontRight: frontRightLeg,
                backLeft: backLeftLeg,
                backRight: backRightLeg
            },
            eyeLeft,
            eyeRight
        };
    }

    function createQuadrupedLegRig(basePosition, options) {
        const root = new THREE.Group();
        const upperPivot = new THREE.Group();
        const lowerPivot = new THREE.Group();
        const upperLength = Number.isFinite(options.upperLength) ? options.upperLength : 0.22;
        const lowerLength = Number.isFinite(options.lowerLength) ? options.lowerLength : 0.2;
        const upperGeometry = new THREE.CylinderGeometry(
            Number.isFinite(options.upperRadiusTop) ? options.upperRadiusTop : 0.04,
            Number.isFinite(options.upperRadiusBottom) ? options.upperRadiusBottom : 0.045,
            upperLength,
            6
        );
        const lowerGeometry = new THREE.CylinderGeometry(
            Number.isFinite(options.lowerRadiusTop) ? options.lowerRadiusTop : 0.034,
            Number.isFinite(options.lowerRadiusBottom) ? options.lowerRadiusBottom : 0.03,
            lowerLength,
            6
        );
        const pawSize = Array.isArray(options.pawSize) ? options.pawSize : [0.08, 0.05, 0.12];
        const pawForwardOffset = Number.isFinite(options.pawForwardOffset) ? options.pawForwardOffset : 0.02;
        const upperMaterial = options.upperMaterial;
        const lowerMaterial = options.lowerMaterial || upperMaterial;
        const pawMaterial = options.pawMaterial || lowerMaterial;
        const upper = new THREE.Mesh(upperGeometry, upperMaterial);
        const lower = new THREE.Mesh(lowerGeometry, lowerMaterial);
        const paw = new THREE.Mesh(new THREE.BoxGeometry(pawSize[0], pawSize[1], pawSize[2]), pawMaterial);

        root.position.copy(basePosition);
        upper.position.y = -upperLength * 0.5;
        lowerPivot.position.y = -upperLength + 0.01;
        lower.position.y = -lowerLength * 0.5;
        paw.position.set(0, -lowerLength - (pawSize[1] * 0.28), pawForwardOffset);

        upperPivot.add(upper);
        lowerPivot.add(lower, paw);
        upperPivot.add(lowerPivot);
        root.add(upperPivot);

        return {
            root,
            upperPivot,
            lowerPivot,
            upper,
            lower,
            paw,
            baseX: basePosition.x,
            baseY: basePosition.y,
            baseZ: basePosition.z
        };
    }

    function applyQuadrupedLegPose(leg, pose) {
        if (!leg || !pose) return;
        leg.root.position.set(
            leg.baseX + (Number.isFinite(pose.offsetX) ? pose.offsetX : 0),
            leg.baseY + (Number.isFinite(pose.lift) ? pose.lift : 0),
            leg.baseZ + (Number.isFinite(pose.offsetZ) ? pose.offsetZ : 0)
        );
        leg.root.rotation.z = Number.isFinite(pose.splay) ? pose.splay : 0;
        leg.upperPivot.rotation.x = Number.isFinite(pose.upperAngle) ? pose.upperAngle : 0;
        leg.lowerPivot.rotation.x = Number.isFinite(pose.lowerAngle) ? pose.lowerAngle : 0;
        leg.paw.rotation.x = Number.isFinite(pose.pawAngle) ? pose.pawAngle : 0;
    }

    function resolveQuadrupedLegPose(phase, options) {
        const swing = Math.sin(phase);
        const liftWave = Math.max(0, Math.cos(phase));
        return {
            offsetX: 0,
            offsetZ: swing * (Number.isFinite(options.travel) ? options.travel : 0.04),
            lift: liftWave * (Number.isFinite(options.lift) ? options.lift : 0.02),
            upperAngle: (Number.isFinite(options.upperBias) ? options.upperBias : 0)
                + (swing * (Number.isFinite(options.upperSwing) ? options.upperSwing : 0.32)),
            lowerAngle: (Number.isFinite(options.lowerBias) ? options.lowerBias : 0)
                + (Math.max(0, -swing) * (Number.isFinite(options.kneeBend) ? options.kneeBend : 0.4))
                + (liftWave * (Number.isFinite(options.kneeLift) ? options.kneeLift : 0.08)),
            pawAngle: Math.max(0, swing) * (Number.isFinite(options.pawFlex) ? options.pawFlex : 0.08),
            splay: Number.isFinite(options.splay) ? options.splay : 0
        };
    }

    function createBoarRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x7b5b3c, flatShading: true });
        const backMaterial = new THREE.MeshLambertMaterial({ color: 0x65492f, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xa57c56, flatShading: true });
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6748, flatShading: true });
        const tuskMaterial = new THREE.MeshLambertMaterial({ color: 0xf2e6cb, flatShading: true });
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4330, flatShading: true });
        const hoofMaterial = new THREE.MeshLambertMaterial({ color: 0x2f241d, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a140f, flatShading: true });

        const torsoGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.98), bodyMaterial);
        const shoulderHump = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.26, 0.34), backMaterial);
        const rump = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.32, 0.38), bodyMaterial);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bellyMaterial);
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.66), backMaterial);
        body.position.set(0, 0.36, 0.03);
        shoulderHump.position.set(0, 0.48, 0.2);
        rump.position.set(0, 0.33, -0.24);
        belly.scale.set(1.12, 0.72, 1.28);
        belly.position.set(0, 0.23, 0.05);
        spine.position.set(0, 0.57, 0.02);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.41, 0.56);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.36), bodyMaterial);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.3), snoutMaterial);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.16), backMaterial);
        head.position.set(0, 0, 0);
        snout.position.set(0, -0.03, 0.28);
        brow.position.set(0, 0.08, 0.08);
        const tuskGeometry = new THREE.ConeGeometry(0.024, 0.15, 4);
        const tuskLeft = new THREE.Mesh(tuskGeometry, tuskMaterial);
        const tuskRight = tuskLeft.clone();
        tuskLeft.rotation.set(Math.PI / 2, 0, -0.42);
        tuskRight.rotation.set(Math.PI / 2, 0, 0.42);
        tuskLeft.position.set(0.09, -0.08, 0.38);
        tuskRight.position.set(-0.09, -0.08, 0.38);
        const earGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.03);
        const earLeft = new THREE.Mesh(earGeometry, bodyMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.12, 0.11, -0.02);
        earRight.position.set(-0.12, 0.11, -0.02);
        earLeft.rotation.z = -0.35;
        earRight.rotation.z = 0.35;
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.08, 0.04, 0.15);
        eyeRight.position.set(-0.08, 0.04, 0.15);
        headGroup.add(head, snout, brow, tuskLeft, tuskRight, earLeft, earRight, eyeLeft, eyeRight);

        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.43, -0.54);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.28, 5), hoofMaterial);
        tail.rotation.x = Math.PI / 2;
        tail.position.set(0, 0, -0.06);
        tailGroup.add(tail);

        const frontLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.25, 0.31, 0.27), {
            upperLength: 0.22,
            lowerLength: 0.18,
            upperRadiusTop: 0.04,
            upperRadiusBottom: 0.048,
            lowerRadiusTop: 0.034,
            lowerRadiusBottom: 0.03,
            pawSize: [0.09, 0.05, 0.13],
            pawForwardOffset: 0.02,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const frontRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.25, 0.31, 0.27), {
            upperLength: 0.22,
            lowerLength: 0.18,
            upperRadiusTop: 0.04,
            upperRadiusBottom: 0.048,
            lowerRadiusTop: 0.034,
            lowerRadiusBottom: 0.03,
            pawSize: [0.09, 0.05, 0.13],
            pawForwardOffset: 0.02,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const backLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.24, 0.29, -0.24), {
            upperLength: 0.2,
            lowerLength: 0.18,
            upperRadiusTop: 0.045,
            upperRadiusBottom: 0.05,
            lowerRadiusTop: 0.036,
            lowerRadiusBottom: 0.032,
            pawSize: [0.1, 0.05, 0.13],
            pawForwardOffset: 0.015,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });
        const backRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.24, 0.29, -0.24), {
            upperLength: 0.2,
            lowerLength: 0.18,
            upperRadiusTop: 0.045,
            upperRadiusBottom: 0.05,
            lowerRadiusTop: 0.036,
            lowerRadiusBottom: 0.032,
            pawSize: [0.1, 0.05, 0.13],
            pawForwardOffset: 0.015,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: hoofMaterial
        });

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.06, 0.92, 1.16),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.45;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        torsoGroup.add(body, shoulderHump, rump, belly, spine, headGroup, tailGroup);
        group.add(
            torsoGroup,
            frontLeftLeg.root,
            frontRightLeg.root,
            backLeftLeg.root,
            backRightLeg.root,
            hitbox
        );
        return {
            group,
            hitbox,
            kind: 'boar',
            torsoGroup,
            body,
            shoulderHump,
            rump,
            belly,
            spine,
            headGroup,
            head,
            snout,
            brow,
            tuskLeft,
            tuskRight,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            tailGroup,
            tail,
            frontLeftLeg,
            frontRightLeg,
            backLeftLeg,
            backRightLeg
        };
    }

    function createWolfRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const furMaterial = new THREE.MeshLambertMaterial({ color: 0x6c645e, flatShading: true });
        const furDarkMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4844, flatShading: true });
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0x93867d, flatShading: true });
        const muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x5a544f, flatShading: true });
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4c4743, flatShading: true });
        const pawMaterial = new THREE.MeshLambertMaterial({ color: 0x241f1c, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xece7d5, flatShading: true });

        const torsoGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 10), furMaterial);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), bellyMaterial);
        const chest = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 10), furMaterial);
        const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), furDarkMaterial);
        const backLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.7), furDarkMaterial);
        body.scale.set(1.2, 0.72, 1.72);
        body.position.set(0, 0.42, 0.02);
        belly.scale.set(1.06, 0.58, 1.22);
        belly.position.set(0, 0.27, 0.08);
        chest.scale.set(0.94, 0.86, 1.08);
        chest.position.set(0, 0.45, 0.28);
        haunch.scale.set(0.98, 0.78, 1.04);
        haunch.position.set(0, 0.39, -0.3);
        backLine.position.set(0, 0.58, 0.02);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.53, 0.68);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.34), furMaterial);
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.24), muzzleMaterial);
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.18), furDarkMaterial);
        head.position.set(0, 0, 0);
        muzzle.position.set(0, -0.02, 0.28);
        neck.position.set(0, -0.04, -0.2);
        const earGeometry = new THREE.BoxGeometry(0.07, 0.14, 0.03);
        const earLeft = new THREE.Mesh(earGeometry, furDarkMaterial);
        const earRight = earLeft.clone();
        earLeft.position.set(0.1, 0.14, -0.01);
        earRight.position.set(-0.1, 0.14, -0.01);
        earLeft.rotation.z = -0.2;
        earRight.rotation.z = 0.2;
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.06, 0.04, 0.12);
        eyeRight.position.set(-0.06, 0.04, 0.12);
        headGroup.add(head, muzzle, neck, earLeft, earRight, eyeLeft, eyeRight);

        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.49, -0.62);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.01, 0.44, 5), furDarkMaterial);
        tail.rotation.x = Math.PI / 2;
        tail.position.set(0, 0, -0.12);
        const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.1), furMaterial);
        tailTip.position.set(0, 0, -0.34);
        tailGroup.add(tail, tailTip);

        const frontLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.18, 0.37, 0.34), {
            upperLength: 0.25,
            lowerLength: 0.22,
            upperRadiusTop: 0.025,
            upperRadiusBottom: 0.03,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.03,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });
        const frontRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.18, 0.37, 0.34), {
            upperLength: 0.25,
            lowerLength: 0.22,
            upperRadiusTop: 0.025,
            upperRadiusBottom: 0.03,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.03,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });
        const backLeftLeg = createQuadrupedLegRig(new THREE.Vector3(0.17, 0.35, -0.28), {
            upperLength: 0.24,
            lowerLength: 0.22,
            upperRadiusTop: 0.028,
            upperRadiusBottom: 0.034,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.025,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });
        const backRightLeg = createQuadrupedLegRig(new THREE.Vector3(-0.17, 0.35, -0.28), {
            upperLength: 0.24,
            lowerLength: 0.22,
            upperRadiusTop: 0.028,
            upperRadiusBottom: 0.034,
            lowerRadiusTop: 0.024,
            lowerRadiusBottom: 0.02,
            pawSize: [0.06, 0.04, 0.12],
            pawForwardOffset: 0.025,
            upperMaterial: legMaterial,
            lowerMaterial: legMaterial,
            pawMaterial: pawMaterial
        });

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.92, 1.24),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.48;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        torsoGroup.add(body, belly, chest, haunch, backLine, headGroup, tailGroup);
        group.add(
            torsoGroup,
            frontLeftLeg.root,
            frontRightLeg.root,
            backLeftLeg.root,
            backRightLeg.root,
            hitbox
        );
        return {
            group,
            hitbox,
            kind: 'wolf',
            torsoGroup,
            body,
            belly,
            chest,
            haunch,
            backLine,
            headGroup,
            head,
            muzzle,
            neck,
            earLeft,
            earRight,
            eyeLeft,
            eyeRight,
            tailGroup,
            tail,
            tailTip,
            frontLeftLeg,
            frontRightLeg,
            backLeftLeg,
            backRightLeg
        };
    }

    function createChickenRenderer(enemyState, enemyType) {
        const group = new THREE.Group();
        group.rotation.order = 'YXZ';
        const combatLevel = getEnemyCombatLevel(enemyType);

        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xf0ead8, flatShading: true });
        const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xe6dbc2, flatShading: true });
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xc5ad72, flatShading: true });
        const beakMaterial = new THREE.MeshLambertMaterial({ color: 0xe2a236, flatShading: true });
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0xcd9b34, flatShading: true });
        const combMaterial = new THREE.MeshLambertMaterial({ color: 0xb2423b, flatShading: true });
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x201712, flatShading: true });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), bodyMaterial);
        body.scale.set(1.2, 0.92, 1.48);
        body.position.set(0, 0.28, 0);

        const headGroup = new THREE.Group();
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), bodyMaterial);
        head.scale.set(0.95, 0.9, 1.0);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4), beakMaterial);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, -0.01, 0.18);
        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.07), combMaterial);
        comb.position.set(0, 0.16, 0.01);
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMaterial);
        const eyeRight = eyeLeft.clone();
        eyeLeft.position.set(0.06, 0.03, 0.08);
        eyeRight.position.set(-0.06, 0.03, 0.08);
        headGroup.add(head, beak, comb, eyeLeft, eyeRight);
        headGroup.position.set(0, 0.54, 0.34);

        const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.26), wingMaterial);
        const wingRight = wingLeft.clone();
        wingLeft.position.set(0.22, 0.28, 0.02);
        wingRight.position.set(-0.22, 0.28, 0.02);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), tailMaterial);
        tail.rotation.x = -Math.PI / 2;
        tail.rotation.z = Math.PI;
        tail.position.set(0, 0.38, -0.27);

        const legGeometry = new THREE.CylinderGeometry(0.018, 0.014, 0.28, 5);
        const legLeft = new THREE.Mesh(legGeometry, legMaterial);
        const legRight = new THREE.Mesh(legGeometry.clone(), legMaterial);
        legLeft.position.set(0.1, 0.04, -0.08);
        legRight.position.set(-0.1, 0.04, -0.08);
        legLeft.rotation.z = -0.08;
        legRight.rotation.z = 0.08;

        const hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.95, 1.0),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 0.5;
        hitbox.userData = {
            type: 'ENEMY',
            gridX: enemyState.x,
            gridY: enemyState.y,
            z: enemyState.z,
            name: enemyType.displayName,
            combatLevel,
            uid: enemyState.runtimeId
        };

        group.add(body, headGroup, wingLeft, wingRight, tail, legLeft, legRight, hitbox);
        return {
            group,
            hitbox,
            kind: 'chicken',
            body,
            headGroup,
            wingLeft,
            wingRight,
            tail,
            legLeft,
            legRight
        };
    }

    function createHumanoidEnemyRenderer(enemyState, enemyType) {
        const modelPresetId = resolveEnemyModelPresetId(enemyType);
        const animationSetDef = resolveEnemyAnimationSetDef(enemyType);
        let group = null;
        if (modelPresetId && typeof window.createNpcHumanoidRigFromPreset === 'function') {
            group = window.createNpcHumanoidRigFromPreset(modelPresetId);
        }
        if (!group) {
            group = createHumanoidModel(enemyType.appearance && Number.isFinite(enemyType.appearance.npcType) ? enemyType.appearance.npcType : 3);
        }
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
        return {
            group,
            hitbox,
            kind: 'humanoid',
            animationSetId: animationSetDef ? resolveEnemyAnimationSetId(enemyType) : null,
            animationSetDef: animationSetDef || null,
            animationRigId: animationSetDef && group.userData ? (group.userData.animationRigId || animationSetDef.rigId) : null
        };
    }

    function createEnemyRenderer(enemyState) {
        const layer = ensureCombatEnemyRenderLayer();
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!layer || !enemyType) return null;

        let renderer = null;
        if (enemyState.enemyId === 'enemy_boar') renderer = createBoarRenderer(enemyState, enemyType);
        else if (enemyState.enemyId === 'enemy_wolf') renderer = createWolfRenderer(enemyState, enemyType);
        else if (enemyType.appearance && enemyType.appearance.kind === 'rat') renderer = createRatRenderer(enemyState, enemyType);
        else if (enemyType.appearance && enemyType.appearance.kind === 'chicken') renderer = createChickenRenderer(enemyState, enemyType);
        else renderer = createHumanoidEnemyRenderer(enemyState, enemyType);

        const hitpointsBar = combatEnemyOverlayRuntime.createEnemyHitpointsBarRenderer({ documentRef: document });
        renderer.healthBarEl = hitpointsBar.el;
        renderer.healthBarFillEl = hitpointsBar.fill;
        renderer.maxHealth = Number.isFinite(enemyType.stats && enemyType.stats.hitpoints)
            ? Math.max(1, Math.floor(enemyType.stats.hitpoints))
            : 1;
        renderer.healthBarYOffset = renderer.kind === 'rat'
            ? 0.66
            : (renderer.kind === 'chicken'
                ? 0.88
                : (renderer.kind === 'boar'
                    ? 0.82
                    : (renderer.kind === 'wolf' ? 0.9 : 1.15)));
        renderer.group.position.set(enemyState.x, 0, enemyState.y);
        renderer.group.rotation.y = enemyState.facingYaw || 0;
        layer.add(renderer.group);
        renderer.group.updateMatrixWorld(true);
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

    function isEnemyVisuallyMoving(enemyState, frameNow) {
        if (!enemyState) return false;
        const prevX = Number.isFinite(enemyState.prevX) ? enemyState.prevX : enemyState.x;
        const prevY = Number.isFinite(enemyState.prevY) ? enemyState.prevY : enemyState.y;
        if (enemyState.x === prevX && enemyState.y === prevY) return false;
        return getEnemyVisualMoveProgress(enemyState, frameNow) < 1;
    }

    function shouldEnemyUseWalkBaseClip(enemyState, frameNow) {
        if (isEnemyVisuallyMoving(enemyState, frameNow)) return true;
        return hasTrackedEnemyLocomotionIntent(enemyState, frameNow);
    }

    function updateBoarRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const legs = renderer.legs || null;
        if (!legs) return;
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 160) + (currentVisualX * 0.18) + (currentVisualY * 0.14);
        const diagonalStep = Math.sin(gaitPhase * Math.PI * 2);
        const diagonalLift = Math.max(0, diagonalStep);
        const oppositeStep = Math.sin((gaitPhase * Math.PI * 2) + Math.PI);
        const oppositeLift = Math.max(0, oppositeStep);
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const bob = Math.sin(idlePhase * 1.6) * 0.014 + (walkActive ? Math.abs(diagonalStep) * 0.01 : 0);
        const bodyPitch = (walkActive ? diagonalStep * 0.02 : Math.sin(idlePhase * 1.1) * 0.01) - attackPulse * 0.04 + hitPulse * 0.03;
        const bodyRoll = walkActive ? diagonalStep * 0.02 : Math.sin(idlePhase * 1.8) * 0.008;
        const frontPairStride = walkActive ? diagonalStep * 0.12 : Math.sin(idlePhase * 2.1) * 0.03;
        const backPairStride = walkActive ? oppositeStep * 0.12 : Math.sin((idlePhase * 2.1) + Math.PI) * 0.03;
        const tailSwing = (walkActive ? Math.sin(gaitPhase * Math.PI * 3.5) * 0.1 : Math.sin(idlePhase * 1.7) * 0.08) + hitPulse * 0.04;

        renderer.group.rotation.x = bodyPitch;
        renderer.body.position.set(0, 0.28 + bob - attackPulse * 0.02 + hitPulse * 0.02, 0);
        renderer.body.scale.set(1.04 + hitPulse * 0.03, 0.98 - attackPulse * 0.02 + hitPulse * 0.01, 1.02 + attackPulse * 0.03 - hitPulse * 0.02);
        renderer.shoulderMass.position.set(0, 0.34 + bob * 0.6 - attackPulse * 0.01 + hitPulse * 0.02, 0.28);
        renderer.shoulderMass.rotation.set(bodyPitch * 0.9, 0, bodyRoll * 0.6);
        renderer.hipMass.position.set(0, 0.31 + bob * 0.45 - attackPulse * 0.01 + hitPulse * 0.01, -0.3);
        renderer.hipMass.rotation.set(-bodyPitch * 0.7, 0, -bodyRoll * 0.45);
        renderer.belly.position.set(0, 0.18 + bob * 0.4 - attackPulse * 0.01 + hitPulse * 0.01, 0.08);
        renderer.head.position.set(0, 0.26 + bob * 0.4 - attackPulse * 0.04 + hitPulse * 0.03, 0.57 + attackPulse * 0.12 - hitPulse * 0.05);
        renderer.head.rotation.set(-attackPulse * 0.12 + hitPulse * 0.08, 0, walkActive ? frontPairStride * 0.08 : 0);
        renderer.snout.position.set(0, 0.2 + bob * 0.32 - attackPulse * 0.03 + hitPulse * 0.02, 0.79 + attackPulse * 0.1 - hitPulse * 0.03);
        renderer.tuskLeft.position.set(0.07, 0.16 + bob * 0.18 - hitPulse * 0.01, 0.87);
        renderer.tuskRight.position.set(-0.07, 0.16 + bob * 0.18 - hitPulse * 0.01, 0.87);
        renderer.earLeft.rotation.z = -0.32 + (walkActive ? diagonalStep * 0.02 : 0) - attackPulse * 0.05;
        renderer.earRight.rotation.z = 0.32 - (walkActive ? diagonalStep * 0.02 : 0) + attackPulse * 0.05;
        renderer.tail.rotation.z = -0.25 + tailSwing;

        poseQuadrupedLimbRig(legs.frontLeft, {
            stride: frontPairStride,
            lift: diagonalLift,
            sway: diagonalStep,
            pitch: bodyPitch,
            roll: bodyRoll
        });
        poseQuadrupedLimbRig(legs.frontRight, {
            stride: -frontPairStride,
            lift: oppositeLift,
            sway: oppositeStep,
            pitch: bodyPitch,
            roll: -bodyRoll
        });
        poseQuadrupedLimbRig(legs.backLeft, {
            stride: -backPairStride,
            lift: oppositeLift,
            sway: oppositeStep,
            pitch: bodyPitch,
            roll: -bodyRoll
        });
        poseQuadrupedLimbRig(legs.backRight, {
            stride: backPairStride,
            lift: diagonalLift,
            sway: diagonalStep,
            pitch: bodyPitch,
            roll: bodyRoll
        });
        renderer.eyeLeft.position.set(0.06, 0.28 + bob * 0.2, 0.73);
        renderer.eyeRight.position.set(-0.06, 0.28 + bob * 0.2, 0.73);
    }

    function updateWolfRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const legs = renderer.legs || null;
        if (!legs) return;
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 110) + (currentVisualX * 0.31) + (currentVisualY * 0.25);
        const diagonalStep = Math.sin(gaitPhase * Math.PI * 2);
        const diagonalLift = Math.max(0, diagonalStep);
        const oppositeStep = Math.sin((gaitPhase * Math.PI * 2) + Math.PI);
        const oppositeLift = Math.max(0, oppositeStep);
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 380 ? Math.sin((attackAge / 380) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const bob = Math.sin(idlePhase * 1.9) * 0.016 + (walkActive ? Math.abs(diagonalStep) * 0.012 : 0);
        const bodyPitch = (walkActive ? diagonalStep * 0.024 : Math.sin(idlePhase * 1.15) * 0.012) - attackPulse * 0.03 + hitPulse * 0.02;
        const bodyRoll = walkActive ? diagonalStep * 0.022 : Math.sin(idlePhase * 1.8) * 0.01;
        const frontPairStride = walkActive ? diagonalStep * 0.14 : Math.sin(idlePhase * 2.4) * 0.035;
        const backPairStride = walkActive ? oppositeStep * 0.14 : Math.sin((idlePhase * 2.4) + Math.PI) * 0.035;
        const tailSwing = (walkActive ? Math.sin(gaitPhase * Math.PI * 4.5) * 0.18 : Math.sin(idlePhase * 2.1) * 0.12) + attackPulse * 0.12 - hitPulse * 0.08;

        renderer.group.rotation.x = bodyPitch;
        renderer.body.position.set(0, 0.3 + bob - attackPulse * 0.02 + hitPulse * 0.02, 0);
        renderer.body.scale.set(1.18 + hitPulse * 0.02, 0.7 - attackPulse * 0.03 + hitPulse * 0.02, 1.58 + attackPulse * 0.03 - hitPulse * 0.03);
        renderer.shoulderMass.position.set(0, 0.33 + bob * 0.55 - attackPulse * 0.02 + hitPulse * 0.02, 0.24);
        renderer.shoulderMass.rotation.set(bodyPitch * 0.8, 0, bodyRoll * 0.55);
        renderer.hipMass.position.set(0, 0.3 + bob * 0.42 - attackPulse * 0.01 + hitPulse * 0.01, -0.28);
        renderer.hipMass.rotation.set(-bodyPitch * 0.6, 0, -bodyRoll * 0.4);
        renderer.belly.position.set(0, 0.18 + bob * 0.5 - attackPulse * 0.02 + hitPulse * 0.02, 0.04);
        renderer.head.position.set(0, 0.37 + bob * 0.45 - attackPulse * 0.04 + hitPulse * 0.03, 0.56 + attackPulse * 0.12 - hitPulse * 0.05);
        renderer.head.rotation.set(-attackPulse * 0.1 + hitPulse * 0.05, 0, walkActive ? frontPairStride * 0.06 : 0);
        renderer.muzzle.position.set(0, 0.34 + bob * 0.32 - attackPulse * 0.03 + hitPulse * 0.02, 0.78 + attackPulse * 0.08 - hitPulse * 0.04);
        renderer.earLeft.rotation.z = -0.18 + (walkActive ? diagonalStep * 0.02 : 0) - attackPulse * 0.03;
        renderer.earRight.rotation.z = 0.18 - (walkActive ? diagonalStep * 0.02 : 0) + attackPulse * 0.03;
        renderer.tail.rotation.z = 0.28 + tailSwing;

        poseQuadrupedLimbRig(legs.frontLeft, {
            stride: frontPairStride,
            lift: diagonalLift,
            sway: diagonalStep,
            pitch: bodyPitch,
            roll: bodyRoll
        });
        poseQuadrupedLimbRig(legs.frontRight, {
            stride: -frontPairStride,
            lift: oppositeLift,
            sway: oppositeStep,
            pitch: bodyPitch,
            roll: -bodyRoll
        });
        poseQuadrupedLimbRig(legs.backLeft, {
            stride: -backPairStride,
            lift: oppositeLift,
            sway: oppositeStep,
            pitch: bodyPitch,
            roll: -bodyRoll
        });
        poseQuadrupedLimbRig(legs.backRight, {
            stride: backPairStride,
            lift: diagonalLift,
            sway: diagonalStep,
            pitch: bodyPitch,
            roll: bodyRoll
        });
        renderer.eyeLeft.position.set(0.06, 0.42 + bob * 0.16, 0.72);
        renderer.eyeRight.position.set(-0.06, 0.42 + bob * 0.16, 0.72);
    }

    function updateBoarRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 165) + (currentVisualX * 0.19) + (currentVisualY * 0.16);
        const gaitAngle = gaitPhase * Math.PI * 2;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const idleBob = Math.sin(idlePhase * 1.6) * 0.016;
        const walkBob = walkActive ? Math.abs(Math.sin(gaitAngle * 2)) * 0.026 : 0;
        const bob = idleBob + walkBob;
        const shoulderShift = walkActive ? Math.sin(gaitAngle * 2) * 0.02 : Math.sin(idlePhase * 1.3) * 0.01;
        const headSwing = walkActive ? Math.sin(gaitAngle) * 0.04 : Math.sin(idlePhase * 1.5) * 0.02;
        const tailSwing = (walkActive ? Math.sin(gaitAngle * 2) * 0.18 : Math.sin(idlePhase * 1.8) * 0.08) + hitPulse * 0.05;

        renderer.group.rotation.x = -0.02 + shoulderShift * 0.2 - attackPulse * 0.07 + hitPulse * 0.05;
        renderer.torsoGroup.position.set(0, bob - attackPulse * 0.04 + hitPulse * 0.03, 0);
        renderer.body.scale.set(1.02 + hitPulse * 0.03, 1.0 - attackPulse * 0.05 + hitPulse * 0.02, 1.0 + attackPulse * 0.05);
        renderer.shoulderHump.scale.set(1.0 + attackPulse * 0.05, 1.0 + walkBob * 1.2, 1.0);
        renderer.rump.scale.set(1.0 - attackPulse * 0.02, 1.0 + hitPulse * 0.03, 1.0);
        renderer.belly.position.set(0, 0.23 - attackPulse * 0.02 + hitPulse * 0.02, 0.05);
        renderer.headGroup.position.set(0, 0.41 + bob * 0.35 - attackPulse * 0.06 + hitPulse * 0.03, 0.56 + attackPulse * 0.14 - hitPulse * 0.05);
        renderer.headGroup.rotation.set(0.06 + headSwing - attackPulse * 0.18 + hitPulse * 0.08, 0, headSwing * 0.24);
        renderer.earLeft.rotation.z = -0.35 + headSwing * 0.5 - attackPulse * 0.04;
        renderer.earRight.rotation.z = 0.35 - headSwing * 0.5 + attackPulse * 0.04;
        renderer.tailGroup.rotation.set(-0.1 + attackPulse * 0.06, 0, -0.18 + tailSwing);

        const leadPhase = gaitAngle;
        const followPhase = gaitAngle + Math.PI;
        applyQuadrupedLegPose(renderer.frontLeftLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.065 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.52 : 0.12,
            kneeBend: 0.62,
            kneeLift: 0.1,
            pawFlex: 0.14,
            upperBias: 0.08,
            lowerBias: -0.04,
            splay: 0.03
        }));
        applyQuadrupedLegPose(renderer.frontRightLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.065 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.52 : 0.12,
            kneeBend: 0.62,
            kneeLift: 0.1,
            pawFlex: 0.14,
            upperBias: 0.08,
            lowerBias: -0.04,
            splay: -0.03
        }));
        applyQuadrupedLegPose(renderer.backLeftLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.055 : 0.01,
            lift: walkActive ? 0.024 : 0.006,
            upperSwing: walkActive ? 0.46 : 0.1,
            kneeBend: 0.54,
            kneeLift: 0.08,
            pawFlex: 0.1,
            upperBias: -0.06,
            lowerBias: 0.03,
            splay: 0.02
        }));
        applyQuadrupedLegPose(renderer.backRightLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.055 : 0.01,
            lift: walkActive ? 0.024 : 0.006,
            upperSwing: walkActive ? 0.46 : 0.1,
            kneeBend: 0.54,
            kneeLift: 0.08,
            pawFlex: 0.1,
            upperBias: -0.06,
            lowerBias: 0.03,
            splay: -0.02
        }));
    }

    function updateWolfRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 132) + (currentVisualX * 0.27) + (currentVisualY * 0.21);
        const gaitAngle = gaitPhase * Math.PI * 2;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 380 ? Math.sin((attackAge / 380) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const idleBob = Math.sin(idlePhase * 2.0) * 0.014;
        const strideBounce = walkActive ? Math.abs(Math.sin(gaitAngle * 2)) * 0.022 : 0;
        const bob = idleBob + strideBounce;
        const spineWave = walkActive ? Math.sin(gaitAngle * 2) * 0.022 : Math.sin(idlePhase * 1.5) * 0.01;
        const headSwing = walkActive ? Math.sin(gaitAngle) * 0.06 : Math.sin(idlePhase * 1.8) * 0.025;
        const tailSwing = (walkActive ? Math.sin(gaitAngle * 2 + 0.6) * 0.26 : Math.sin(idlePhase * 2.1) * 0.12) + attackPulse * 0.12 - hitPulse * 0.08;

        renderer.group.rotation.x = -0.015 + spineWave * 0.2 - attackPulse * 0.05 + hitPulse * 0.03;
        renderer.torsoGroup.position.set(0, bob - attackPulse * 0.03 + hitPulse * 0.03, 0);
        renderer.body.position.set(0, 0.42, 0.02);
        renderer.body.scale.set(1.2 + hitPulse * 0.02, 0.72 - attackPulse * 0.04 + hitPulse * 0.02, 1.72 + attackPulse * 0.04);
        renderer.chest.position.set(0, 0.45 + spineWave * 0.2 - attackPulse * 0.02, 0.28 + attackPulse * 0.04);
        renderer.haunch.position.set(0, 0.39 - spineWave * 0.2 + hitPulse * 0.02, -0.3 - attackPulse * 0.03);
        renderer.headGroup.position.set(0, 0.53 + bob * 0.32 - attackPulse * 0.04 + hitPulse * 0.03, 0.68 + attackPulse * 0.14 - hitPulse * 0.06);
        renderer.headGroup.rotation.set(0.04 + headSwing * 0.24 - attackPulse * 0.16 + hitPulse * 0.08, 0, headSwing * 0.2);
        renderer.earLeft.rotation.z = -0.2 + headSwing * 0.24 - attackPulse * 0.04;
        renderer.earRight.rotation.z = 0.2 - headSwing * 0.24 + attackPulse * 0.04;
        renderer.tailGroup.rotation.set(0.06 + attackPulse * 0.05, 0, 0.32 + tailSwing);

        const leadPhase = gaitAngle;
        const followPhase = gaitAngle + Math.PI;
        applyQuadrupedLegPose(renderer.frontLeftLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.075 : 0.014,
            lift: walkActive ? 0.036 : 0.01,
            upperSwing: walkActive ? 0.62 : 0.14,
            kneeBend: 0.7,
            kneeLift: 0.12,
            pawFlex: 0.18,
            upperBias: 0.06,
            lowerBias: -0.08,
            splay: 0.02
        }));
        applyQuadrupedLegPose(renderer.frontRightLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.075 : 0.014,
            lift: walkActive ? 0.036 : 0.01,
            upperSwing: walkActive ? 0.62 : 0.14,
            kneeBend: 0.7,
            kneeLift: 0.12,
            pawFlex: 0.18,
            upperBias: 0.06,
            lowerBias: -0.08,
            splay: -0.02
        }));
        applyQuadrupedLegPose(renderer.backLeftLeg, resolveQuadrupedLegPose(followPhase, {
            travel: walkActive ? 0.07 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.58 : 0.12,
            kneeBend: 0.66,
            kneeLift: 0.1,
            pawFlex: 0.16,
            upperBias: -0.08,
            lowerBias: 0.05,
            splay: 0.015
        }));
        applyQuadrupedLegPose(renderer.backRightLeg, resolveQuadrupedLegPose(leadPhase, {
            travel: walkActive ? 0.07 : 0.012,
            lift: walkActive ? 0.03 : 0.008,
            upperSwing: walkActive ? 0.58 : 0.12,
            kneeBend: 0.66,
            kneeLift: 0.1,
            pawFlex: 0.16,
            upperBias: -0.08,
            lowerBias: 0.05,
            splay: -0.015
        }));
    }

    function updateChickenRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY) {
        const walkActive = visuallyMoving || useWalkBaseClip;
        const gaitPhase = (frameNow / 170) + (currentVisualX * 0.27) + (currentVisualY * 0.31);
        const walkPulse = walkActive ? Math.sin(gaitPhase * Math.PI * 2) : Math.sin(idlePhase * 1.7) * 0.25;
        const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
        const attackPulse = attackAge >= 0 && attackAge < 360 ? Math.sin((attackAge / 360) * Math.PI) : 0;
        const hitAge = frameNow - (enemyState.hitReactionTriggerAt || 0);
        const hitPulse = hitAge >= 0 && hitAge < 360 ? Math.sin((hitAge / 360) * Math.PI) : 0;
        const bob = Math.sin(idlePhase * 2.1) * 0.02 + (walkActive ? Math.abs(walkPulse) * 0.018 : 0);
        const legStride = walkActive ? walkPulse * 0.35 : Math.sin(idlePhase * 2.4) * 0.06;
        const wingFlap = (walkActive ? Math.sin(gaitPhase * Math.PI * 4) * 0.18 : Math.sin(idlePhase * 2.2) * 0.1) + attackPulse * 0.26 - hitPulse * 0.14;

        renderer.group.rotation.x = -0.02 + (walkActive ? walkPulse * 0.03 : Math.sin(idlePhase * 1.4) * 0.01) - attackPulse * 0.1 + hitPulse * 0.06;

        renderer.body.position.set(0, 0.28 + bob - attackPulse * 0.03 + hitPulse * 0.03, 0);
        renderer.body.scale.set(1.18 - hitPulse * 0.04, 0.92 - attackPulse * 0.08 + hitPulse * 0.02, 1.46 + attackPulse * 0.08 - hitPulse * 0.04);

        renderer.headGroup.position.set(0, 0.54 + bob * 0.7 - attackPulse * 0.06 + hitPulse * 0.04, 0.34 + attackPulse * 0.2 - hitPulse * 0.08);
        renderer.headGroup.rotation.set(
            -attackPulse * 0.18 + hitPulse * 0.12,
            0,
            walkActive ? walkPulse * 0.03 : Math.sin(idlePhase * 1.6) * 0.015
        );

        renderer.wingLeft.position.set(0.22, 0.28 + bob * 0.3, 0.02);
        renderer.wingRight.position.set(-0.22, 0.28 + bob * 0.3, 0.02);
        renderer.wingLeft.rotation.set(0, 0, -0.14 - wingFlap);
        renderer.wingRight.rotation.set(0, 0, 0.14 + wingFlap);

        renderer.legLeft.position.set(0.1 + (walkActive ? legStride * 0.03 : 0), 0.04 + bob * 0.05, -0.08);
        renderer.legRight.position.set(-0.1 - (walkActive ? legStride * 0.03 : 0), 0.04 + bob * 0.05, -0.08);
        renderer.legLeft.rotation.z = -0.08 - legStride * 0.45 + attackPulse * 0.05;
        renderer.legRight.rotation.z = 0.08 + legStride * 0.45 - attackPulse * 0.05;

        renderer.tail.position.set(0, 0.38 + bob * 0.25 - hitPulse * 0.03, -0.27);
        renderer.tail.rotation.set(
            -Math.PI / 2 - attackPulse * 0.08 + hitPulse * 0.04,
            0,
            Math.sin(idlePhase * 2.2) * 0.16 + attackPulse * 0.08
        );
    }

    function updateEnemyRenderer(enemyState, renderer, frameNow) {
        const moveProgress = getEnemyVisualMoveProgress(enemyState, frameNow);
        const prevX = Number.isFinite(enemyState.prevX) ? enemyState.prevX : enemyState.x;
        const prevY = Number.isFinite(enemyState.prevY) ? enemyState.prevY : enemyState.y;
        const hasRecentStepDirection = enemyState.x !== prevX || enemyState.y !== prevY;
        const visuallyMoving = isEnemyVisuallyMoving(enemyState, frameNow);
        const useWalkBaseClip = shouldEnemyUseWalkBaseClip(enemyState, frameNow);
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
        if (isEnemyPendingDefeat(enemyState) && Number.isFinite(enemyState.pendingDefeatFacingYaw)) {
            targetYaw = enemyState.pendingDefeatFacingYaw;
            snapCombatFacing = true;
        } else if (useWalkBaseClip && hasRecentStepDirection) {
            targetYaw = Math.atan2(enemyState.x - prevX, enemyState.y - prevY);
            snapCombatFacing = false;
        } else if (
            enemyState.currentState === 'aggroed'
            && enemyState.lockedTargetId === PLAYER_TARGET_ID
            && isPlayerAlive()
            && enemyState.z === playerState.z
            && isPlayerCombatFacingReady()
        ) {
            targetYaw = Math.atan2(playerState.x - currentVisualX, playerState.y - currentVisualY);
            snapCombatFacing = true;
        }
        if (targetYaw !== undefined) {
            if (snapCombatFacing) {
                renderer.group.rotation.y = targetYaw;
            } else {
                let diff = targetYaw - renderer.group.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const turnLerp = useWalkBaseClip ? 0.55 : 0.25;
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
        renderer.group.updateMatrixWorld(true);

        if (renderer.kind === 'rat') {
            const attackAge = frameNow - (enemyState.attackTriggerAt || 0);
            const attackPulse = attackAge >= 0 && attackAge < 420 ? Math.sin((attackAge / 420) * Math.PI) : 0;
            renderer.body.scale.set(1.35, 0.72 + (attackPulse * 0.08), 1.75 - (attackPulse * 0.08));
            renderer.head.position.z = 0.34 + (attackPulse * 0.14);
            renderer.tail.rotation.y = Math.sin(idlePhase * 2) * 0.35;
            renderer.tail.rotation.x = Math.PI / 8;
            return;
        }

        if (renderer.kind === 'boar') {
            updateBoarRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
            return;
        }

        if (renderer.kind === 'wolf') {
            updateWolfRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
            return;
        }

        if (renderer.kind === 'chicken') {
            updateChickenRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY);
            return;
        }

        const animationBridge = window.AnimationRuntimeBridge || null;
        const animationSetDef = renderer.animationSetDef || null;
        const animationRigId = renderer.animationRigId || null;
        if (
            animationBridge
            && animationSetDef
            && animationRigId
            && typeof animationBridge.beginLegacyFrame === 'function'
            && typeof animationBridge.setLegacyBaseClip === 'function'
            && typeof animationBridge.requestLegacyActionClip === 'function'
            && typeof animationBridge.applyLegacyFrame === 'function'
        ) {
            animationBridge.beginLegacyFrame(renderer.group, animationRigId);
            animationBridge.setLegacyBaseClip(
                renderer.group,
                animationRigId,
                useWalkBaseClip ? animationSetDef.walkClipId : animationSetDef.idleClipId,
                frameNow
            );
            if (isEnemyActionAnimationActive(animationSetDef.attackClipId, enemyState.attackTriggerAt || 0, frameNow)) {
                animationBridge.requestLegacyActionClip(renderer.group, animationRigId, animationSetDef.attackClipId, {
                    startedAtMs: enemyState.attackTriggerAt || frameNow,
                    startKey: `${enemyState.runtimeId}:attack:${enemyState.attackTriggerAt || 0}`,
                    priority: 2
                });
            }
            if (isEnemyActionAnimationActive(animationSetDef.hitClipId, enemyState.hitReactionTriggerAt || 0, frameNow)) {
                animationBridge.requestLegacyActionClip(renderer.group, animationRigId, animationSetDef.hitClipId, {
                    startedAtMs: enemyState.hitReactionTriggerAt || frameNow,
                    startKey: `${enemyState.runtimeId}:hit:${enemyState.hitReactionTriggerAt || 0}`,
                    priority: 1
                });
            }
            animationBridge.applyLegacyFrame(renderer.group, animationRigId, frameNow);
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

    function getCombatEnemyAnimationDebugState(enemyId, frameNow = Date.now()) {
        const resolvedEnemyId = String(enemyId || '').trim();
        if (!resolvedEnemyId) return null;
        const enemyState = getCombatEnemyState(resolvedEnemyId);
        if (!enemyState) return null;
        const renderer = combatEnemyRenderersById[resolvedEnemyId] || null;
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        const animationSetId = resolveEnemyAnimationSetId(enemyType);
        const animationSetDef = resolveEnemyAnimationSetDef(enemyType);
        const animationBridge = window.AnimationRuntimeBridge || null;
        const animationRigId = renderer && renderer.animationRigId
            ? renderer.animationRigId
            : (animationSetDef ? animationSetDef.rigId : null);
        const controller = (animationBridge
            && renderer
            && renderer.group
            && animationRigId
            && typeof animationBridge.getLegacyControllerDebugState === 'function')
            ? animationBridge.getLegacyControllerDebugState(renderer.group, animationRigId, frameNow)
            : null;
        const moveProgress = getEnemyVisualMoveProgress(enemyState, frameNow);
        const visuallyMoving = isEnemyVisuallyMoving(enemyState, frameNow);
        const useWalkBaseClip = shouldEnemyUseWalkBaseClip(enemyState, frameNow);
        const locomotionIntentUntilAt = Number.isFinite(enemyState.locomotionIntentUntilAt)
            ? Math.floor(enemyState.locomotionIntentUntilAt)
            : 0;
        return {
            runtimeId: resolvedEnemyId,
            enemyId: enemyState.enemyId || null,
            displayName: enemyType && enemyType.displayName ? enemyType.displayName : null,
            currentState: enemyState.currentState || null,
            kind: renderer ? (renderer.kind || null) : null,
            modelPresetId: resolveEnemyModelPresetId(enemyType),
            animationSetId: animationSetId || null,
            animationRigId: animationRigId || null,
            position: {
                x: Number.isFinite(enemyState.x) ? enemyState.x : 0,
                y: Number.isFinite(enemyState.y) ? enemyState.y : 0,
                z: Number.isFinite(enemyState.z) ? enemyState.z : 0
            },
            previousPosition: {
                x: Number.isFinite(enemyState.prevX) ? enemyState.prevX : enemyState.x,
                y: Number.isFinite(enemyState.prevY) ? enemyState.prevY : enemyState.y
            },
            facingYaw: Number.isFinite(enemyState.facingYaw) ? enemyState.facingYaw : null,
            groupRotationY: renderer && renderer.group && Number.isFinite(renderer.group.rotation.y)
                ? renderer.group.rotation.y
                : null,
            moveProgress: Number.isFinite(moveProgress) ? moveProgress : null,
            visuallyMoving: !!visuallyMoving,
            useWalkBaseClip: !!useWalkBaseClip,
            locomotionIntent: {
                lastAt: Number.isFinite(enemyState.lastLocomotionIntentAt) ? Math.floor(enemyState.lastLocomotionIntentAt) : 0,
                untilAt: locomotionIntentUntilAt,
                remainingMs: locomotionIntentUntilAt > 0 ? Math.max(0, locomotionIntentUntilAt - Math.floor(frameNow)) : 0
            },
            moveTriggerAt: Number.isFinite(enemyState.moveTriggerAt) ? Math.floor(enemyState.moveTriggerAt) : 0,
            attackTriggerAt: Number.isFinite(enemyState.attackTriggerAt) ? Math.floor(enemyState.attackTriggerAt) : 0,
            hitReactionTriggerAt: Number.isFinite(enemyState.hitReactionTriggerAt) ? Math.floor(enemyState.hitReactionTriggerAt) : 0,
            controller
        };
    }

    function listQaCombatEnemyStates() {
        ensureCombatEnemyWorldReady();
        updateCombatRenderers(Date.now());
        return combatEnemyStates.map((enemyState) => {
            const enemyType = getEnemyDefinition(enemyState.enemyId);
            const renderer = combatEnemyRenderersById[enemyState.runtimeId] || null;
            return {
                runtimeId: enemyState.runtimeId || '',
                enemyId: enemyState.enemyId || '',
                displayName: enemyType && enemyType.displayName ? enemyType.displayName : enemyState.enemyId || '',
                state: enemyState.currentState || '',
                x: Number.isFinite(enemyState.x) ? enemyState.x : 0,
                y: Number.isFinite(enemyState.y) ? enemyState.y : 0,
                z: Number.isFinite(enemyState.z) ? enemyState.z : 0,
                hp: Number.isFinite(enemyState.currentHealth) ? enemyState.currentHealth : null,
                rendered: !!(renderer && renderer.hitbox)
            };
        });
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
    window.getCombatEnemyAnimationDebugState = getCombatEnemyAnimationDebugState;
    window.listQaCombatEnemyStates = listQaCombatEnemyStates;
    window.getCombatHudSnapshot = getCombatHudSnapshot;
})();
