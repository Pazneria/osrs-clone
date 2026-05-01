(function () {
    const combatRuntime = window.CombatRuntime || null;
    const combatQaDebugRuntime = window.CombatQaDebugRuntime || null;
    const combatHudRuntime = window.CombatHudRuntime || null;
    const combatEngagementRuntime = window.CombatEngagementRuntime || null;
    const combatEnemyRenderRuntime = window.CombatEnemyRenderRuntime || null;
    const combatEnemyOverlayRuntime = window.CombatEnemyOverlayRuntime || null;
    const combatEnemyMovementRuntime = window.CombatEnemyMovementRuntime || null;
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
        const result = combatEnemyRenderRuntime.unmountEnemyVisualRenderer({
            enemyId,
            renderersById: combatEnemyRenderersById,
            environmentMeshes,
            removeHitpointsBarRenderer(renderer) {
                combatEnemyOverlayRuntime.removeEnemyHitpointsBarRenderer(renderer);
            }
        });
        if (result && Array.isArray(result.environmentMeshes)) environmentMeshes = result.environmentMeshes;
    }

    function clearCombatEnemyRenderers() {
        const enemyIds = Object.keys(combatEnemyRenderersById);
        for (let i = 0; i < enemyIds.length; i++) clearEnemyRenderer(enemyIds[i]);
        combatEnemyRenderLayer = combatEnemyRenderRuntime.clearEnemyVisualRenderLayer({ layer: combatEnemyRenderLayer });
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

    function getCombatEngagementRuntime() {
        if (!combatEngagementRuntime) {
            throw new Error('CombatEngagementRuntime missing. Load src/js/combat-engagement-runtime.js before combat.js.');
        }
        return combatEngagementRuntime;
    }

    function buildCombatEngagementRuntimeContext() {
        return {
            combatEnemyStates,
            playerState,
            playerTargetId: PLAYER_TARGET_ID,
            playerTargetKind: PLAYER_TARGET_KIND,
            playerPursuitStateHardNoPath: PLAYER_PURSUIT_STATE_HARD_NO_PATH,
            playerPursuitStateTemporaryBlock: PLAYER_PURSUIT_STATE_TEMPORARY_BLOCK,
            playerPursuitStateValid: PLAYER_PURSUIT_STATE_VALID,
            beginEnemyReturn,
            clearEnemyIdleWanderState,
            clearPlayerCombatTarget,
            faceEnemyTowards,
            facePlayerTowards,
            getAutoRetaliateCandidateCombatLevel,
            getChebyshevDistance,
            getCombatEnemyState,
            getEnemyDefinition,
            getPlayerLockedEnemy,
            getSquareRange,
            isEnemyAlive,
            isPlayerAlive,
            isWithinMeleeRange,
            recordPlayerPursuitDebug,
            resolvePathToEnemy,
            resolvePathToPlayer
        };
    }

    function getCombatHudRuntime() {
        if (!combatHudRuntime) {
            throw new Error('CombatHudRuntime missing. Load src/js/combat-hud-runtime.js before combat.js.');
        }
        return combatHudRuntime;
    }

    function buildCombatHudRuntimeContext() {
        return {
            ensureCombatEnemyWorldReady,
            getCombatEnemyState,
            getEnemyDefinition,
            getPlayerLockedEnemy,
            isEnemyAlive,
            isWithinMeleeRange,
            playerState,
            playerTargetId: PLAYER_TARGET_ID
        };
    }

    function resolveCombatHudFocusEnemy() {
        return getCombatHudRuntime().resolveCombatHudFocusEnemy(buildCombatHudRuntimeContext());
    }

    function getCombatHudSnapshot() {
        return getCombatHudRuntime().buildCombatHudSnapshot(buildCombatHudRuntimeContext());
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

    function getCombatEnemyMovementRuntime() {
        if (!combatEnemyMovementRuntime) {
            throw new Error('CombatEnemyMovementRuntime missing. Load src/js/combat-enemy-movement-runtime.js before combat.js.');
        }
        return combatEnemyMovementRuntime;
    }

    function buildCombatEnemyMovementRuntimeContext() {
        return {
            combatEnemyStates,
            currentTick,
            enemyIdleWanderPauseMinTicks: ENEMY_IDLE_WANDER_PAUSE_MIN_TICKS,
            enemyIdleWanderPauseMaxTicks: ENEMY_IDLE_WANDER_PAUSE_MAX_TICKS,
            enemyIdleWanderPickAttempts: ENEMY_IDLE_WANDER_PICK_ATTEMPTS,
            enemyIdleWanderMinPathLength: ENEMY_IDLE_WANDER_MIN_PATH_LENGTH,
            enemyMoveClipHoldMs: ENEMY_MOVE_CLIP_HOLD_MS,
            findPath: typeof findPath === 'function' ? findPath : null,
            isEnemyAlive,
            isPlayerAlive,
            isRunning,
            isTrainingDummyEnemy,
            isWalkableTileId,
            isWithinMeleeRange,
            logicalMap,
            mapSize: MAP_SIZE,
            moveEnemyToStep,
            playerState,
            playerTargetId: PLAYER_TARGET_ID,
            rollInclusive,
            beginEnemyReturn,
            restoreEnemyAtHome,
            faceEnemyTowards
        };
    }

    function clearEnemyIdleWanderState(enemyState) {
        return getCombatEnemyMovementRuntime().clearEnemyIdleWanderState(buildCombatEnemyMovementRuntimeContext(), enemyState);
    }

    function clearEnemyLocomotionIntent(enemyState) {
        return getCombatEnemyMovementRuntime().clearEnemyLocomotionIntent(buildCombatEnemyMovementRuntimeContext(), enemyState);
    }

    function markEnemyLocomotionIntent(enemyState, holdMs = ENEMY_MOVE_CLIP_HOLD_MS) {
        return getCombatEnemyMovementRuntime().markEnemyLocomotionIntent(buildCombatEnemyMovementRuntimeContext(), enemyState, holdMs);
    }

    function hasTrackedEnemyLocomotionIntent(enemyState, frameNow) {
        return getCombatEnemyMovementRuntime().hasTrackedEnemyLocomotionIntent(buildCombatEnemyMovementRuntimeContext(), enemyState, frameNow);
    }

    function scheduleEnemyIdleWanderPause(enemyState, minTicks = ENEMY_IDLE_WANDER_PAUSE_MIN_TICKS, maxTicks = ENEMY_IDLE_WANDER_PAUSE_MAX_TICKS) {
        return getCombatEnemyMovementRuntime().scheduleEnemyIdleWanderPause(buildCombatEnemyMovementRuntimeContext(), enemyState, minTicks, maxTicks);
    }

    function resolvePathToEnemy(enemyState, pathOptions = null) {
        return getCombatEnemyMovementRuntime().resolvePathToEnemy(buildCombatEnemyMovementRuntimeContext(), enemyState, pathOptions);
    }

    function resolvePathToPlayer(enemyState, pathOptions = null) {
        return getCombatEnemyMovementRuntime().resolvePathToPlayer(buildCombatEnemyMovementRuntimeContext(), enemyState, pathOptions);
    }

    function cloneCombatPathStep(step) {
        return getCombatEnemyMovementRuntime().cloneCombatPathStep(buildCombatEnemyMovementRuntimeContext(), step);
    }

    function resolvePlayerChaseAttackOpportunity(playerLockState) {
        return getCombatEnemyMovementRuntime().resolvePlayerChaseAttackOpportunity(buildCombatEnemyMovementRuntimeContext(), playerLockState);
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
        return getCombatEngagementRuntime().validatePlayerTargetLock(buildCombatEngagementRuntimeContext());
    }

    function hasValidPlayerCombatLock() {
        return getCombatEngagementRuntime().hasValidPlayerCombatLock(buildCombatEngagementRuntimeContext());
    }

    function isValidAutoRetaliateCandidate(enemyState) {
        return getCombatEngagementRuntime().isValidAutoRetaliateCandidate(buildCombatEngagementRuntimeContext(), enemyState);
    }

    function pickAutoRetaliateTarget() {
        return getCombatEngagementRuntime().pickAutoRetaliateTarget(buildCombatEngagementRuntimeContext());
    }

    function validateEnemyTargetLock(enemyState) {
        return getCombatEngagementRuntime().validateEnemyTargetLock(buildCombatEngagementRuntimeContext(), enemyState);
    }

    function acquireAggressiveEnemyTargets() {
        getCombatEngagementRuntime().acquireAggressiveEnemyTargets(buildCombatEngagementRuntimeContext());
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
        getCombatEngagementRuntime().movePlayerTowardLockedTarget(buildCombatEngagementRuntimeContext(), playerLockState, attackedThisTick);
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
        getCombatEnemyMovementRuntime().updateEnemyMovement(buildCombatEnemyMovementRuntimeContext(), attacks);
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
        combatEnemyRenderLayer = combatEnemyRenderRuntime.ensureEnemyVisualRenderLayer({
            scene,
            THREE,
            layer: combatEnemyRenderLayer,
            name: 'combat-enemies'
        });
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

    function createEnemyRenderer(enemyState) {
        const layer = ensureCombatEnemyRenderLayer();
        const enemyType = getEnemyDefinition(enemyState.enemyId);
        if (!layer || !enemyType) return null;

        const renderer = combatEnemyRenderRuntime.mountEnemyVisualRenderer({
            windowRef: window,
            enemyState,
            enemyType,
            layer,
            renderersById: combatEnemyRenderersById,
            environmentMeshes,
            createHitpointsBarRenderer() {
                return combatEnemyOverlayRuntime.createEnemyHitpointsBarRenderer({ documentRef: document });
            },
            createHumanoidModel,
            getEnemyCombatLevel,
            resolveEnemyAnimationSetDef,
            resolveEnemyAnimationSetId,
            resolveEnemyModelPresetId
        });
        return renderer;
    }

    function buildCombatEnemyVisualFrameContext(enemyState, renderer, frameNow) {
        return {
            windowRef: window,
            enemyState,
            renderer,
            frameNow,
            enemyMoveLerpDurationMs: ENEMY_MOVE_LERP_DURATION_MS,
            getEnemyCombatLevel,
            getEnemyDefinition,
            getVisualHeight,
            hasTrackedEnemyLocomotionIntent,
            isEnemyActionAnimationActive,
            isEnemyPendingDefeat,
            isPlayerAlive,
            isPlayerCombatFacingReady,
            playerState,
            playerTargetId: PLAYER_TARGET_ID
        };
    }

    function getEnemyVisualMoveProgress(enemyState, frameNow) {
        return combatEnemyRenderRuntime.getEnemyVisualMoveProgress(
            buildCombatEnemyVisualFrameContext(enemyState, null, frameNow),
            enemyState,
            frameNow
        );
    }

    function isEnemyVisuallyMoving(enemyState, frameNow) {
        return combatEnemyRenderRuntime.isEnemyVisuallyMoving(
            buildCombatEnemyVisualFrameContext(enemyState, null, frameNow),
            enemyState,
            frameNow
        );
    }

    function shouldEnemyUseWalkBaseClip(enemyState, frameNow) {
        return combatEnemyRenderRuntime.shouldEnemyUseWalkBaseClip(
            buildCombatEnemyVisualFrameContext(enemyState, null, frameNow),
            enemyState,
            frameNow
        );
    }

    function updateEnemyRenderer(enemyState, renderer, frameNow) {
        combatEnemyRenderRuntime.updateEnemyVisualFrame(buildCombatEnemyVisualFrameContext(enemyState, renderer, frameNow));
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
        return combatQaDebugRuntime.buildEnemyAnimationDebugState({
            windowRef: window,
            enemyId,
            frameNow,
            combatEnemyRenderersById,
            getCombatEnemyState,
            getEnemyDefinition,
            getEnemyVisualMoveProgress,
            isEnemyVisuallyMoving,
            resolveEnemyAnimationSetDef,
            resolveEnemyAnimationSetId,
            resolveEnemyModelPresetId,
            shouldEnemyUseWalkBaseClip
        });
    }

    function listQaCombatEnemyStates() {
        ensureCombatEnemyWorldReady();
        updateCombatRenderers(Date.now());
        return combatQaDebugRuntime.listCombatEnemyStates({
            combatEnemyRenderersById,
            combatEnemyStates,
            getEnemyDefinition
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
