// Engine Constants & Chunk Architecture
        const TICK_RATE_MS = 600;
        const CHUNK_SIZE = 81;
        const WORLD_CHUNKS_X = 8;
        const WORLD_CHUNKS_Y = 8;
        const MAP_SIZE = CHUNK_SIZE * WORLD_CHUNKS_X; // 648
        
        // NEW: Max Planes (Z-Levels)
        const PLANES = 2; // Floor 0 (Ground), Floor 1 (Second Floor)
        const DEFAULT_UNLOCK_FLAGS = Object.freeze({
            runecraftingComboUnlocked: false,
            gemMineUnlocked: false,
            ringMouldUnlocked: false,
            amuletMouldUnlocked: false,
            tiaraMouldUnlocked: false
        });
        const PROGRESS_SAVE_KEY = 'osrsClone.progress.v1';
        const PROGRESS_SAVE_VERSION = 1;
        const PROGRESS_AUTOSAVE_INTERVAL_MS = 10000;
        const MAX_PERSISTED_EAT_COOLDOWN_TICKS = 10;
        const PROGRESS_MAX_SKILL_LEVEL = 99;
        const PLAYER_PROFILE_DEFAULT_NAME = 'Adventurer';
        const PLAYER_NAME_MIN_LENGTH = 2;
        const PLAYER_NAME_MAX_LENGTH = 12;
        const PLAYER_CREATION_COLOR_LABELS = ['Hair', 'Torso', 'Legs', 'Feet', 'Skin'];

        // --- Game State (Logical & Terrain) ---
        let currentTick = 0;
        
        const TileId = Object.freeze({
            GRASS: 0,
            TREE: 1,
            ROCK: 2,
            DIRT: 3,
            STUMP: 4,
            OBSTACLE: 5,
            FLOOR_WOOD: 6,
            FLOOR_STONE: 7,
            FLOOR_BRICK: 8,
            BANK_BOOTH: 9,
            WALL: 11,
            TOWER: 12,
            STAIRS_UP: 13,
            STAIRS_DOWN: 14,
            STAIRS_RAMP: 15,
            SOLID_NPC: 16,
            SHOP_COUNTER: 17,
            DOOR_CLOSED: 18,
            DOOR_OPEN: 19,
            SHORE: 20,
            WATER_SHALLOW: 21,
            WATER_DEEP: 22
        });
        const WALKABLE_TILES = [
            TileId.GRASS,
            TileId.DIRT,
            TileId.FLOOR_WOOD,
            TileId.FLOOR_STONE,
            TileId.FLOOR_BRICK,
            TileId.STAIRS_UP,
            TileId.STAIRS_DOWN,
            TileId.STAIRS_RAMP,
            TileId.DOOR_OPEN,
            TileId.SHORE
        ];
        const WATER_TILE_SET = new Set([TileId.WATER_SHALLOW, TileId.WATER_DEEP]);
        const NATURAL_TILE_SET = new Set([
            TileId.GRASS,
            TileId.DIRT,
            TileId.TREE,
            TileId.ROCK,
            TileId.STUMP,
            TileId.SHORE,
            TileId.WATER_SHALLOW,
            TileId.WATER_DEEP
        ]);
        const TREE_TILE_SET = new Set([TileId.TREE, TileId.STUMP]);
        const WALKABLE_TILE_SET = new Set(WALKABLE_TILES);

        function isWaterTileId(tileId) {
            return WATER_TILE_SET.has(tileId);
        }

        function isNaturalTileId(tileId) {
            return NATURAL_TILE_SET.has(tileId);
        }

        function isTreeTileId(tileId) {
            return TREE_TILE_SET.has(tileId);
        }

        function isWalkableTileId(tileId) {
            return WALKABLE_TILE_SET.has(tileId);
        }

        function isDoorTileId(tileId) {
            return tileId === TileId.DOOR_CLOSED || tileId === TileId.DOOR_OPEN;
        }

        const worldAdapterRuntime = window.LegacyWorldAdapterRuntime || null;
        function resolveDefaultWorldSpawn() {
            if (worldAdapterRuntime && typeof worldAdapterRuntime.getWorldDefaultSpawn === 'function') {
                return worldAdapterRuntime.getWorldDefaultSpawn(null, {
                    mapSize: MAP_SIZE,
                    planes: PLANES
                });
            }
            return { x: 205, y: 210, z: 0 };
        }

        const DEFAULT_WORLD_SPAWN = resolveDefaultWorldSpawn();
        const gameSessionRuntime = window.GameSessionRuntime || null;
        const combatRuntime = window.CombatRuntime || null;
        const gameSession = gameSessionRuntime && typeof gameSessionRuntime.createGameSession === 'function'
            ? gameSessionRuntime.createGameSession({
                currentWorldId: (typeof gameSessionRuntime.resolveCurrentWorldId === 'function')
                    ? gameSessionRuntime.resolveCurrentWorldId()
                    : 'starter_town',
                defaultSpawn: DEFAULT_WORLD_SPAWN,
                defaultUnlockFlags: DEFAULT_UNLOCK_FLAGS,
                inventorySize: 28,
                bankSize: 200
            })
            : null;
        if (gameSessionRuntime && typeof gameSessionRuntime.setActiveSession === 'function') {
            gameSessionRuntime.setActiveSession(gameSession);
        }
        if (gameSessionRuntime && typeof gameSessionRuntime.bindWindowQaBooleanFlag === 'function') {
            gameSessionRuntime.bindWindowQaBooleanFlag('QA_RC_DEBUG', 'runecraftingDebug', false);
            gameSessionRuntime.bindWindowQaBooleanFlag('DEBUG_COOKING_USE', 'cookingUseDebug', false);
            gameSessionRuntime.bindWindowQaBooleanFlag('QA_COMBAT_DEBUG', 'combatDebug', false);
            gameSessionRuntime.bindWindowQaBooleanFlag('QA_PIER_DEBUG', 'pierDebug', false);
        } else {
            if (typeof window.QA_RC_DEBUG === 'undefined') window.QA_RC_DEBUG = false;
            if (typeof window.DEBUG_COOKING_USE === 'undefined') window.DEBUG_COOKING_USE = false;
            if (typeof window.QA_COMBAT_DEBUG === 'undefined') window.QA_COMBAT_DEBUG = false;
            if (typeof window.QA_PIER_DEBUG === 'undefined') window.QA_PIER_DEBUG = false;
        }

        function createFallbackCombatPlayerState(maxHitpoints = 10) {
            if (combatRuntime && typeof combatRuntime.createDefaultPlayerCombatState === 'function') {
                return combatRuntime.createDefaultPlayerCombatState(maxHitpoints);
            }
            return {
                currentHitpoints: Math.max(1, Math.floor(maxHitpoints)),
                eatingCooldownEndTick: 0,
                lastAttackTick: -1,
                lastCastTick: -1,
                remainingAttackCooldown: 0,
                lockedTargetId: null,
                combatTargetKind: null,
                selectedMeleeStyle: 'attack',
                autoRetaliateEnabled: true,
                inCombat: false,
                lastDamagerEnemyId: null
            };
        }

        function getGameSession() {
            if (gameSessionRuntime && typeof gameSessionRuntime.getSession === 'function') {
                return gameSessionRuntime.getSession();
            }
            return gameSession;
        }

        window.getGameSession = getGameSession;
        window.getChunkRenderPolicy = getChunkRenderPolicy;
        window.getActiveChunkRenderPolicyPreset = getActiveChunkRenderPolicyPreset;
        window.applyChunkRenderPolicyPreset = applyChunkRenderPolicyPreset;
        window.getChunkRenderPolicyRevision = getChunkRenderPolicyRevision;
        window.getChunkRenderPolicyPresetOrder = function getChunkRenderPolicyPresetOrder() {
            return CHUNK_RENDER_POLICY_ORDER.slice();
        };

        window.TileId = TileId;
        window.isWaterTileId = isWaterTileId;
        window.isNaturalTileId = isNaturalTileId;
        window.isTreeTileId = isTreeTileId;
        window.isWalkableTileId = isWalkableTileId;
        window.isDoorTileId = isDoorTileId;

        function getQaCombatDebugSnapshot() {
            const hudSnapshot = (typeof window.getCombatHudSnapshot === 'function')
                ? window.getCombatHudSnapshot()
                : null;
            const animationBridge = window.AnimationRuntimeBridge || null;
            const lockedTargetId = playerState && playerState.lockedTargetId
                ? String(playerState.lockedTargetId)
                : '';
            const lockedEnemy = (lockedTargetId && typeof window.getCombatEnemyState === 'function')
                ? window.getCombatEnemyState(lockedTargetId)
                : null;
            const playerRigRuntime = playerRig && playerRig.userData ? playerRig.userData.rig : null;
            const animationRigId = (playerRig && playerRig.userData && playerRig.userData.animationRigId)
                ? playerRig.userData.animationRigId
                : 'player_humanoid_v1';
            const animationController = (animationBridge
                && playerRig
                && typeof animationBridge.getLegacyControllerDebugState === 'function')
                ? animationBridge.getLegacyControllerDebugState(playerRig, animationRigId, Date.now())
                : null;

            return {
                tick: Number.isFinite(currentTick) ? currentTick : 0,
                player: {
                    x: Number.isFinite(playerState && playerState.x) ? playerState.x : 0,
                    y: Number.isFinite(playerState && playerState.y) ? playerState.y : 0,
                    z: Number.isFinite(playerState && playerState.z) ? playerState.z : 0,
                    targetX: Number.isFinite(playerState && playerState.targetX) ? playerState.targetX : 0,
                    targetY: Number.isFinite(playerState && playerState.targetY) ? playerState.targetY : 0,
                    action: String((playerState && playerState.action) || 'IDLE'),
                    inCombat: !!(playerState && playerState.inCombat),
                    remainingAttackCooldown: Number.isFinite(playerState && playerState.remainingAttackCooldown)
                        ? Math.max(0, Math.floor(playerState.remainingAttackCooldown))
                        : 0,
                    lockedTargetId: lockedTargetId || null,
                    targetObj: (playerState && playerState.targetObj) || null,
                    pathLength: Array.isArray(playerState && playerState.path) ? playerState.path.length : 0,
                    lastAttackTick: Number.isFinite(playerState && playerState.lastAttackTick) ? playerState.lastAttackTick : null,
                    lastDamagerEnemyId: (playerState && playerState.lastDamagerEnemyId) || null,
                    lastClearReason: (typeof window.__qaCombatDebugLastClearReason === 'string' && window.__qaCombatDebugLastClearReason)
                        ? window.__qaCombatDebugLastClearReason
                        : null,
                    lastClearTick: Number.isFinite(window.__qaCombatDebugLastClearTick)
                        ? Math.floor(window.__qaCombatDebugLastClearTick)
                        : null
                },
                lastEnemyAttack: window.__qaCombatDebugLastEnemyAttackResult
                    ? {
                        tick: Number.isFinite(window.__qaCombatDebugLastEnemyAttackResult.tick)
                            ? Math.floor(window.__qaCombatDebugLastEnemyAttackResult.tick)
                            : null,
                        attackerId: window.__qaCombatDebugLastEnemyAttackResult.attackerId || null,
                        enemyId: window.__qaCombatDebugLastEnemyAttackResult.enemyId || null,
                        landed: !!window.__qaCombatDebugLastEnemyAttackResult.landed,
                        damage: Number.isFinite(window.__qaCombatDebugLastEnemyAttackResult.damage)
                            ? Math.floor(window.__qaCombatDebugLastEnemyAttackResult.damage)
                            : 0,
                        isTrainingDummyAttack: !!window.__qaCombatDebugLastEnemyAttackResult.isTrainingDummyAttack
                    }
                    : null,
                animation: {
                    attackTick: (playerRigRuntime && Number.isFinite(playerRigRuntime.attackTick))
                        ? Math.floor(playerRigRuntime.attackTick)
                        : null,
                    attackStartedAtMs: (playerRigRuntime && Number.isFinite(playerRigRuntime.attackAnimationStartedAt))
                        ? Math.floor(playerRigRuntime.attackAnimationStartedAt)
                        : null,
                    hitReactionTick: (playerRigRuntime && Number.isFinite(playerRigRuntime.hitReactionTick))
                        ? Math.floor(playerRigRuntime.hitReactionTick)
                        : null,
                    hitReactionStartedAtMs: (playerRigRuntime && Number.isFinite(playerRigRuntime.hitReactionStartedAt))
                        ? Math.floor(playerRigRuntime.hitReactionStartedAt)
                        : null,
                    controller: animationController
                },
                enemy: lockedEnemy ? {
                    runtimeId: String(lockedEnemy.runtimeId || ''),
                    enemyId: String(lockedEnemy.enemyId || ''),
                    x: Number.isFinite(lockedEnemy.x) ? lockedEnemy.x : 0,
                    y: Number.isFinite(lockedEnemy.y) ? lockedEnemy.y : 0,
                    z: Number.isFinite(lockedEnemy.z) ? lockedEnemy.z : 0,
                    state: String(lockedEnemy.currentState || ''),
                    currentHealth: Number.isFinite(lockedEnemy.currentHealth) ? lockedEnemy.currentHealth : null,
                    remainingAttackCooldown: Number.isFinite(lockedEnemy.remainingAttackCooldown)
                        ? Math.max(0, Math.floor(lockedEnemy.remainingAttackCooldown))
                        : 0
                } : null,
                hud: hudSnapshot && typeof hudSnapshot === 'object'
                    ? {
                        inCombat: !!hudSnapshot.inCombat,
                        playerRemainingAttackCooldown: Number.isFinite(hudSnapshot.playerRemainingAttackCooldown)
                            ? Math.max(0, Math.floor(hudSnapshot.playerRemainingAttackCooldown))
                            : 0,
                        target: hudSnapshot.target && typeof hudSnapshot.target === 'object'
                            ? {
                                label: String(hudSnapshot.target.label || ''),
                                state: String(hudSnapshot.target.state || ''),
                                distance: Number.isFinite(hudSnapshot.target.distance) ? hudSnapshot.target.distance : null,
                                inMeleeRange: !!hudSnapshot.target.inMeleeRange,
                                currentHealth: Number.isFinite(hudSnapshot.target.currentHealth) ? hudSnapshot.target.currentHealth : null,
                                maxHealth: Number.isFinite(hudSnapshot.target.maxHealth) ? hudSnapshot.target.maxHealth : null,
                                remainingAttackCooldown: Number.isFinite(hudSnapshot.target.remainingAttackCooldown)
                                    ? Math.max(0, Math.floor(hudSnapshot.target.remainingAttackCooldown))
                                    : 0
                            }
                            : null
                    }
                    : null
            };
        }

        function getQaCombatDebugSignature(snapshot = null) {
            const state = snapshot && typeof snapshot === 'object' ? snapshot : getQaCombatDebugSnapshot();
            const player = state.player || {};
            const lastEnemyAttack = state.lastEnemyAttack || null;
            const animation = state.animation || {};
            const controller = animation.controller || null;
            const enemy = state.enemy || null;
            const hudTarget = state.hud && state.hud.target ? state.hud.target : null;
            const hud = state.hud || null;
            return [
                player.action || 'IDLE',
                player.inCombat ? 1 : 0,
                Number.isFinite(player.remainingAttackCooldown) ? player.remainingAttackCooldown : 0,
                player.lockedTargetId || '-',
                player.targetObj || '-',
                Number.isFinite(player.lastAttackTick) ? player.lastAttackTick : -1,
                player.lastDamagerEnemyId || '-',
                player.lastClearReason || '-',
                Number.isFinite(player.lastClearTick) ? player.lastClearTick : -1,
                enemy
                    ? `${enemy.runtimeId || '-'}:${enemy.state || '-'}:${Number.isFinite(enemy.currentHealth) ? enemy.currentHealth : '-'}:${enemy.remainingAttackCooldown || 0}`
                    : 'none',
                hudTarget
                    ? `${hudTarget.state || '-'}:${Number.isFinite(hudTarget.currentHealth) ? hudTarget.currentHealth : '-'}:${Number.isFinite(hudTarget.maxHealth) ? hudTarget.maxHealth : '-'}:${hudTarget.inMeleeRange ? 1 : 0}:${hudTarget.remainingAttackCooldown || 0}`
                    : 'none',
                hud ? (hud.inCombat ? 1 : 0) : -1,
                lastEnemyAttack
                    ? `${Number.isFinite(lastEnemyAttack.tick) ? lastEnemyAttack.tick : -1}:${lastEnemyAttack.enemyId || '-'}:${lastEnemyAttack.landed ? 1 : 0}:${Number.isFinite(lastEnemyAttack.damage) ? lastEnemyAttack.damage : 0}`
                    : 'none',
                Number.isFinite(animation.attackTick) ? animation.attackTick : -1,
                Number.isFinite(animation.hitReactionTick) ? animation.hitReactionTick : -1,
                controller
                    ? `${controller.baseClipId || '-'}:${controller.actionClipId || '-'}:${controller.winningRequest ? controller.winningRequest.clipId : '-'}:${controller.requestedActions && controller.requestedActions.length ? controller.requestedActions.map((request) => request.clipId).join(',') : '-'}`
                    : 'none'
            ].join('|');
        }

        function emitQaCombatDebugClearHistory() {
            const clearEvents = Array.isArray(window.__qaCombatDebugClearEvents) ? window.__qaCombatDebugClearEvents : [];
            if (clearEvents.length === 0) {
                addChatMessage('[QA combatdbg] clear history is empty.', 'info');
                return;
            }
            addChatMessage(`[QA combatdbg] clear history count=${clearEvents.length}`, 'info');
            const startIndex = Math.max(0, clearEvents.length - 12);
            for (let i = startIndex; i < clearEvents.length; i++) {
                const event = clearEvents[i] || {};
                const tickLabel = Number.isFinite(event.tick) ? event.tick : 'none';
                const reasonLabel = event.reason || 'generic';
                const blockedLabel = event.blocked ? 'yes' : 'no';
                const forcedLabel = event.forced ? 'yes' : 'no';
                const lockLabel = event.lockBeforeClear || 'none';
                const actionLabel = event.action || 'IDLE';
                const pathLabel = Number.isFinite(event.pathLength) ? event.pathLength : 0;
                addChatMessage(
                    `[QA combatdbg] clear#${i + 1} tick=${tickLabel} reason=${reasonLabel} forced=${forcedLabel} blocked=${blockedLabel} lockBefore=${lockLabel} action=${actionLabel} path=${pathLabel}`,
                    'info'
                );
            }
        }

        function emitQaCombatDebugSnapshot(reason = 'manual') {
            const snapshot = getQaCombatDebugSnapshot();
            const player = snapshot.player || {};
            const lastEnemyAttack = snapshot.lastEnemyAttack || null;
            const animation = snapshot.animation || {};
            const controller = animation.controller || null;
            const enemy = snapshot.enemy || null;
            const hud = snapshot.hud || null;
            const hudTarget = hud && hud.target ? hud.target : null;

            addChatMessage(
                `[QA combatdbg] reason=${reason} tick=${snapshot.tick} action=${player.action || 'IDLE'} inCombat=${player.inCombat ? 'yes' : 'no'} pCD=${Number.isFinite(player.remainingAttackCooldown) ? player.remainingAttackCooldown : 0} lock=${player.lockedTargetId || 'none'} targetObj=${player.targetObj || 'none'} pos=(${player.x},${player.y},${player.z}) target=(${player.targetX},${player.targetY}) path=${Number.isFinite(player.pathLength) ? player.pathLength : 0} lastAtk=${Number.isFinite(player.lastAttackTick) ? player.lastAttackTick : 'none'} lastDamager=${player.lastDamagerEnemyId || 'none'}`,
                'info'
            );
            const includeClearReason =
                !!player.lastClearReason
                && (reason === 'manual' || (Number.isFinite(player.lastClearTick) && player.lastClearTick === snapshot.tick));
            if (includeClearReason) {
                addChatMessage(
                    `[QA combatdbg] clear reason=${player.lastClearReason} atTick=${Number.isFinite(player.lastClearTick) ? player.lastClearTick : 'none'}`,
                    'info'
                );
            }
            addChatMessage(
                `[QA combatdbg] anim atkTick=${Number.isFinite(animation.attackTick) ? animation.attackTick : 'none'} atkStart=${Number.isFinite(animation.attackStartedAtMs) ? animation.attackStartedAtMs : 'none'} hitTick=${Number.isFinite(animation.hitReactionTick) ? animation.hitReactionTick : 'none'} hitStart=${Number.isFinite(animation.hitReactionStartedAtMs) ? animation.hitReactionStartedAtMs : 'none'} base=${controller && controller.baseClipId ? controller.baseClipId : 'none'} action=${controller && controller.actionClipId ? controller.actionClipId : 'none'} winner=${controller && controller.winningRequest ? controller.winningRequest.clipId : 'none'} requests=${controller && controller.requestedActions && controller.requestedActions.length ? controller.requestedActions.map((request) => `${request.clipId}@p${request.priority}`).join(',') : 'none'}`,
                'info'
            );
            addChatMessage(
                `[QA combatdbg] lastEnemyAttack tick=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.tick) ? lastEnemyAttack.tick : 'none'} enemy=${lastEnemyAttack && lastEnemyAttack.enemyId ? lastEnemyAttack.enemyId : 'none'} landed=${lastEnemyAttack ? (lastEnemyAttack.landed ? 'yes' : 'no') : 'none'} damage=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.damage) ? lastEnemyAttack.damage : 'none'} dummy=${lastEnemyAttack ? (lastEnemyAttack.isTrainingDummyAttack ? 'yes' : 'no') : 'none'}`,
                'info'
            );
            if (enemy) {
                addChatMessage(
                    `[QA combatdbg] enemy runtime=${enemy.runtimeId || 'none'} type=${enemy.enemyId || 'none'} state=${enemy.state || 'none'} hp=${Number.isFinite(enemy.currentHealth) ? enemy.currentHealth : 'unknown'} eCD=${Number.isFinite(enemy.remainingAttackCooldown) ? enemy.remainingAttackCooldown : 0} ePos=(${enemy.x},${enemy.y},${enemy.z})`,
                    'info'
                );
            } else {
                addChatMessage('[QA combatdbg] enemy runtime=none', 'info');
            }
            if (hud) {
                addChatMessage(
                    `[QA combatdbg] hud inCombat=${hud.inCombat ? 'yes' : 'no'} pCD=${Number.isFinite(hud.playerRemainingAttackCooldown) ? hud.playerRemainingAttackCooldown : 0} hudTarget=${hudTarget ? hudTarget.label : 'none'} hudState=${hudTarget ? hudTarget.state : 'none'} hudHp=${hudTarget && Number.isFinite(hudTarget.currentHealth) ? hudTarget.currentHealth : 'none'}/${hudTarget && Number.isFinite(hudTarget.maxHealth) ? hudTarget.maxHealth : 'none'} dist=${hudTarget && Number.isFinite(hudTarget.distance) ? hudTarget.distance : 'none'} melee=${hudTarget && hudTarget.inMeleeRange ? 'yes' : 'no'} eCD=${hudTarget && Number.isFinite(hudTarget.remainingAttackCooldown) ? hudTarget.remainingAttackCooldown : 'none'}`,
                    'info'
                );
            } else {
                addChatMessage('[QA combatdbg] hud unavailable', 'warn');
            }
            return snapshot;
        }

        window.getQaCombatDebugSnapshot = getQaCombatDebugSnapshot;
        window.getQaCombatDebugSignature = getQaCombatDebugSignature;
        window.emitQaCombatDebugClearHistory = emitQaCombatDebugClearHistory;
        window.emitQaCombatDebugSnapshot = emitQaCombatDebugSnapshot;

        // 3D Array Logic: logicalMap[z][y][x]
        let logicalMap = []; 
        let heightMap = [];  
        
        let lastTickTime = 0;
        let pendingAction = null;
        let npcsToRender = []; 
        let bankBoothsToRender = []; 
        let furnacesToRender = [];
        let anvilsToRender = []; 
        let doorsToRender = []; 
        let directionalSignsToRender = []; 
        let activeHitsplats = []; 
        
        // Pathfinder Walkability Registry (Added DOOR_OPEN for open doors)

        // Player Logical State (Spawn adjusted for chunk map center)
        const defaultCombatPlayerState = createFallbackCombatPlayerState(10);
        let playerState = gameSession ? gameSession.player : {
            x: DEFAULT_WORLD_SPAWN.x, y: DEFAULT_WORLD_SPAWN.y, z: DEFAULT_WORLD_SPAWN.z, // NEW Z-Level Spawn   
            prevX: DEFAULT_WORLD_SPAWN.x, prevY: DEFAULT_WORLD_SPAWN.y, 
            midX: null, midY: null,
            targetX: DEFAULT_WORLD_SPAWN.x, targetY: DEFAULT_WORLD_SPAWN.y, 
            targetRotation: 0,  
            path: [],
            action: 'IDLE',
            targetObj: null,
            pendingActionAfterTurn: null,
            turnLock: false,
            actionVisualReady: true,
            actionUntilTick: 0,
            currentHitpoints: defaultCombatPlayerState.currentHitpoints,
            eatingCooldownEndTick: defaultCombatPlayerState.eatingCooldownEndTick,
            lastAttackTick: defaultCombatPlayerState.lastAttackTick,
            lastCastTick: defaultCombatPlayerState.lastCastTick,
            remainingAttackCooldown: defaultCombatPlayerState.remainingAttackCooldown,
            lockedTargetId: defaultCombatPlayerState.lockedTargetId,
            combatTargetKind: defaultCombatPlayerState.combatTargetKind,
            selectedMeleeStyle: defaultCombatPlayerState.selectedMeleeStyle,
            autoRetaliateEnabled: defaultCombatPlayerState.autoRetaliateEnabled,
            inCombat: defaultCombatPlayerState.inCombat,
            lastDamagerEnemyId: defaultCombatPlayerState.lastDamagerEnemyId,
            firemakingTarget: null,
            pendingSkillStart: null,
            unlockFlags: { ...DEFAULT_UNLOCK_FLAGS },
            merchantProgress: {}
        };
        let playerProfileState = gameSession ? gameSession.progress.profile : {
            name: '',
            creationCompleted: false,
            createdAt: null,
            lastStartedAt: null
        };
        window.playerProfileState = playerProfileState;
        const TEST_MINING_ROCK = { x: 205, y: 211, z: 0 };
        let RUNE_ESSENCE_ROCKS = [];

        // Shared shoulder pivot for player rig/animations.
        // X is width-aware: torso half-width (0.54/2) + upper-arm half-width (0.20/2) + small gap.
        // Z sits slightly forward on the torso so the shoulders read less flat from the side.
        const PLAYER_SHOULDER_PIVOT = {
            x: (0.54 * 0.5) + (0.20 * 0.5) + 0.01,
            y: 1.34,
            z: 0.07
        };
        // Three.js Variables
        let scene, camera, renderer, raycaster, mouse;
        let playerRig; 
        let environmentMeshes = [];
        let clickMarkers = [];
        let levelUpAnimations = []; 
        let isRunning = gameSession ? !!gameSession.ui.runMode : false; 

        // Chunk Rendering State
        const CHUNK_RENDER_POLICY_PRESETS = Object.freeze({
            high: Object.freeze({
                nearRadius: 2,
                midRadius: 4,
                interactionRadius: 1,
                farMode: 'all'
            }),
            balanced: Object.freeze({
                nearRadius: 1,
                midRadius: 3,
                interactionRadius: 1,
                farMode: 'all'
            }),
            safe: Object.freeze({
                nearRadius: 1,
                midRadius: 2,
                interactionRadius: 1,
                farMode: 'all'
            })
        });
        const CHUNK_RENDER_POLICY_ORDER = Object.freeze(['safe', 'balanced', 'high']);
        const CHUNK_RENDER_DEFAULT_PRESET = 'balanced';
        let activeChunkRenderPolicyPreset = CHUNK_RENDER_DEFAULT_PRESET;
        let chunkRenderPolicyRevision = 0;

        function resolveChunkRenderPolicyPresetName(presetName) {
            if (typeof presetName === 'string' && CHUNK_RENDER_POLICY_PRESETS[presetName]) return presetName;
            if (CHUNK_RENDER_POLICY_PRESETS[CHUNK_RENDER_DEFAULT_PRESET]) return CHUNK_RENDER_DEFAULT_PRESET;
            return 'balanced';
        }

        function getActiveChunkRenderPolicyPreset() {
            return resolveChunkRenderPolicyPresetName(activeChunkRenderPolicyPreset);
        }

        function getChunkRenderPolicy(presetName = null) {
            const resolvedName = resolveChunkRenderPolicyPresetName(presetName || activeChunkRenderPolicyPreset);
            const preset = CHUNK_RENDER_POLICY_PRESETS[resolvedName] || CHUNK_RENDER_POLICY_PRESETS.balanced;
            return {
                preset: resolvedName,
                nearRadius: Math.max(0, Math.floor(Number.isFinite(preset.nearRadius) ? preset.nearRadius : 1)),
                midRadius: Math.max(0, Math.floor(Number.isFinite(preset.midRadius) ? preset.midRadius : 3)),
                interactionRadius: Math.max(0, Math.floor(Number.isFinite(preset.interactionRadius) ? preset.interactionRadius : 1)),
                farMode: preset.farMode === 'all' ? 'all' : 'window'
            };
        }

        function applyChunkRenderPolicyPreset(nextPreset) {
            const resolvedNextPreset = resolveChunkRenderPolicyPresetName(nextPreset);
            if (resolvedNextPreset === activeChunkRenderPolicyPreset) return false;
            activeChunkRenderPolicyPreset = resolvedNextPreset;
            chunkRenderPolicyRevision += 1;
            return true;
        }

        function getChunkRenderPolicyRevision() {
            return chunkRenderPolicyRevision;
        }
        let loadedChunks = new Set();
        let loadedChunkInteractionState = new Map();
        let chunkGroups = {}; 
        let sharedGeometries = {};
        let sharedMaterials = {};

        // Free Cam State
        let isFreeCam = false;
        let freeCamTarget = new THREE.Vector3();
        let keys = { w: false, a: false, s: false, d: false, q: false, e: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };

        let respawningTrees = []; 
        let rockNodes = {};
        let rockOreOverrides = {};
        let rockAreaGateOverrides = {};
        let treeNodes = {};
        let isDraggingCamera = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        // Mouse Tracking state
        let currentMouseX = 0;
        let currentMouseY = 0;

        // Start in a conventional third-person angle: above and behind the player.
        let cameraYaw = (Math.PI * 1.5) - playerState.targetRotation;
        let cameraPitch = Math.PI / 3.1;
        let cameraDist = 16;

        // UI & Bank State
        let uiScene, uiCamera, uiRenderer, uiPlayerRig;
        let isBankOpen = false;
        let bankItems = gameSession ? gameSession.progress.bankItems : Array(200).fill(null);

        // Minimap State
        let minimapZoom = 1.0; 
        let minimapLocked = true;
        let minimapTargetX = DEFAULT_WORLD_SPAWN.x;
        let minimapTargetY = DEFAULT_WORLD_SPAWN.y;
        let offscreenMapCanvas, offscreenMapCtx;
        let isMinimapDragging = false;
        let minimapDragStart = { x: 0, y: 0 };
        let minimapDragEnd = { x: 0, y: 0 };
        let minimapDestination = null;
        let lastMinimapRenderFrameMs = 0;
        let lastVisibleChunkPlaneZ = null;
        let playerOverheadText = { text: '', expiresAt: 0 };
        const MINIMAP_RENDER_INTERVAL_MS = 75;
        const TARGET_FPS = 50;
        const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
        let frameLimiterPrev = 0;
        let fpsSampleLast = 0;
        let fpsSampleFrames = 0;
        let playerEntryFlowState = gameSession
            ? gameSession.runtime.playerEntryFlow
            : {
                isOpen: false,
                hasLoadedSave: false,
                saveWasLegacyProfile: false,
                loadReason: 'startup',
                savedAt: null,
                sessionActivated: false,
                unloadSaveHooksRegistered: false,
                uiBound: false
            };

        const MOTION_TUNING = {
            runArmSwing: 0.8,
            runLegSwing: 0.78,
            runKneeLift: 1.0,
            walkArmSwing: 0.3,
            walkLegSwing: 0.62,
            walkKneeLift: 0.85,
            runBounce: 0.12,
            walkBounce: 0.1,
            idleBounce: 0.0125,
            cameraFollowY: 0.2
        };

        let motionDebugVisible = false;

        function formatRuntimeError(errorLike) {
            if (!errorLike) return 'Unknown runtime error.';
            if (errorLike.stack) return String(errorLike.stack);
            if (errorLike.message) return String(errorLike.message);
            return String(errorLike);
        }

        function showRuntimeCrashOverlay(errorLike) {
            const overlay = document.getElementById('runtime-crash-overlay');
            const text = document.getElementById('runtime-crash-text');
            if (!overlay || !text) return;
            text.innerText = formatRuntimeError(errorLike);
            overlay.classList.remove('hidden');
        }

        window.addEventListener('error', (event) => {
            showRuntimeCrashOverlay(event.error || event.message);
        });

        window.addEventListener('unhandledrejection', (event) => {
            showRuntimeCrashOverlay(event.reason);
        });

        function makeMissingIconSprite() {
            return '<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" fill="#2f3439"/><rect x="3" y="3" width="10" height="10" fill="#4a525a"/><rect x="5" y="4" width="6" height="1" fill="#9ba7b3"/><rect x="5" y="11" width="6" height="1" fill="#9ba7b3"/><rect x="4" y="5" width="1" height="6" fill="#9ba7b3"/><rect x="11" y="5" width="1" height="6" fill="#9ba7b3"/></svg>';
        }

        function makeIconFromImage(path) {
            return `<img src="${path}" alt="" class="w-[80%] h-[80%] object-contain pointer-events-none drop-shadow-md" draggable="false" />`;
        }

        const ASSET_VERSION_TAG = "20260316i";
        const ITEM_ACTION_PRIORITY = ['equip', 'eat', 'drink', 'use', 'drop'];
        const DEFAULT_ICON_REVIEW_GRANT_ID = 'inventory_icon_review_20260313a';
        const DEFAULT_ICON_REVIEW_LABEL = 'Inventory Icons';
        const DEFAULT_ICON_REVIEW_ITEM_IDS = [
            'bronze_pickaxe',
            'iron_pickaxe',
            'steel_pickaxe',
            'mithril_pickaxe',
            'adamant_pickaxe',
            'rune_pickaxe',
            'hammer',
            'fishing_rod',
            'harpoon',
            'rune_harpoon',
            'air_staff',
            'water_staff',
            'earth_staff',
            'fire_staff'
        ];

        function sanitizeIconReviewItemIds(itemIds) {
            if (!Array.isArray(itemIds)) return [];
            const restored = [];
            const seen = new Set();
            for (let i = 0; i < itemIds.length; i++) {
                const itemId = sanitizeItemId(itemIds[i]);
                if (!itemId || seen.has(itemId)) continue;
                seen.add(itemId);
                restored.push(itemId);
            }
            return restored;
        }

        function getActiveIconReviewBatch() {
            const fallbackItemIds = sanitizeIconReviewItemIds(DEFAULT_ICON_REVIEW_ITEM_IDS);
            const catalog = window.IconReviewCatalog && typeof window.IconReviewCatalog === 'object'
                ? window.IconReviewCatalog
                : null;
            const itemIds = sanitizeIconReviewItemIds(catalog && Array.isArray(catalog.itemIds) ? catalog.itemIds : fallbackItemIds);
            const activeBatchId = (catalog && typeof catalog.activeBatchId === 'string' && catalog.activeBatchId.trim())
                ? catalog.activeBatchId.trim()
                : DEFAULT_ICON_REVIEW_GRANT_ID;
            const label = (catalog && typeof catalog.label === 'string' && catalog.label.trim())
                ? catalog.label.trim()
                : DEFAULT_ICON_REVIEW_LABEL;
            return {
                batchId: activeBatchId,
                label,
                itemIds: itemIds.length > 0 ? itemIds : fallbackItemIds
            };
        }

        function inferItemActions(item) {
            if (!item || !item.type) return [];
            const type = String(item.type).toLowerCase();
            if (type === 'weapon') return ['Equip'];
            if (type === 'food') return ['Eat'];
            return [];
        }

        function getItemActionRank(actionName) {
            const normalized = String(actionName || '').toLowerCase();
            const idx = ITEM_ACTION_PRIORITY.indexOf(normalized);
            return idx === -1 ? ITEM_ACTION_PRIORITY.length : idx;
        }

        function getOrderedItemActions(item) {
            if (!item) return ['Use'];
            const merged = [];
            const seen = new Set();
            const addAction = (actionName) => {
                if (!actionName || typeof actionName !== 'string') return;
                const normalized = actionName.trim();
                if (!normalized) return;
                const key = normalized.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                merged.push(normalized);
            };

            (Array.isArray(item.actions) ? item.actions : []).forEach(addAction);
            inferItemActions(item).forEach(addAction);
            addAction('Use');
            addAction('Drop');

            return merged.sort((a, b) => {
                const rankDiff = getItemActionRank(a) - getItemActionRank(b);
                if (rankDiff !== 0) return rankDiff;
                return a.localeCompare(b);
            });
        }

        function resolveDefaultItemAction(item, preferenceKey = null) {
            const actions = getOrderedItemActions(item);
            if (actions.length === 0) return 'Use';

            const prefKey = preferenceKey || (item && item.id ? item.id : null);
            const preferred = (prefKey && userItemPrefs && typeof userItemPrefs[prefKey] === 'string')
                ? userItemPrefs[prefKey]
                : null;
            if (preferred && actions.includes(preferred)) return preferred;
            return actions[0];
        }

        // Item & Inventory State
        const ITEM_DB = (window.ItemCatalog && typeof window.ItemCatalog.buildItemDb === 'function')
            ? window.ItemCatalog.buildItemDb(makeMissingIconSprite, makeIconFromImage, ASSET_VERSION_TAG)
            : {};
        window.ITEM_DB = ITEM_DB;

        let inventory = gameSession ? gameSession.progress.inventory : Array(28).fill(null);
        inventory[0] = { itemData: ITEM_DB['iron_axe'], amount: 1 }; 
        inventory[1] = { itemData: ITEM_DB['logs'], amount: 1 }; 
        inventory[2] = { itemData: ITEM_DB['coins'], amount: 1000 };
        inventory[3] = { itemData: ITEM_DB['small_net'], amount: 1 };
        inventory[4] = { itemData: ITEM_DB['iron_pickaxe'], amount: 1 };
        inventory[5] = { itemData: ITEM_DB['tinderbox'], amount: 1 };
        inventory[6] = { itemData: ITEM_DB['raw_shrimp'], amount: 1 };
        inventory[7] = { itemData: ITEM_DB['raw_shrimp'], amount: 1 };
        inventory[8] = { itemData: ITEM_DB['raw_shrimp'], amount: 1 };
        inventory[9] = { itemData: ITEM_DB['raw_shrimp'], amount: 1 };
        inventory[10] = { itemData: ITEM_DB['raw_shrimp'], amount: 1 };
        let progressContentGrants = gameSession ? gameSession.progress.contentGrants : {};

                        function setInventorySlots(slotDefs) {
            inventory = Array(28).fill(null);
            const defs = Array.isArray(slotDefs) ? slotDefs : [];
            let writeIndex = 0;

            for (let i = 0; i < defs.length && writeIndex < 28; i++) {
                const def = defs[i];
                if (!def || !def.itemId || !ITEM_DB[def.itemId]) continue;

                const itemData = ITEM_DB[def.itemId];
                const requestedAmount = Number.isFinite(def.amount) && def.amount > 0 ? Math.floor(def.amount) : 1;

                if (itemData.stackable) {
                    inventory[writeIndex++] = { itemData, amount: requestedAmount };
                    continue;
                }

                for (let count = 0; count < requestedAmount && writeIndex < 28; count++) {
                    inventory[writeIndex++] = { itemData, amount: 1 };
                }
            }

            syncGameSessionState();
            if (typeof clearSelectedUse === 'function') clearSelectedUse(false);
            if (typeof renderInventory === 'function') renderInventory();
        }

        function makeFilledSlots(baseSlots, fillerItemId) {
            const slots = Array.isArray(baseSlots) ? baseSlots.slice() : [];
            const fallbackItem = ITEM_DB[fillerItemId] ? fillerItemId : 'logs';
            while (slots.length < 28) {
                slots.push({ itemId: fallbackItem, amount: 1 });
            }
            return slots;
        }

        function getQaToolSlots() {
            return [
                { itemId: 'iron_axe', amount: 1 },
                { itemId: 'iron_pickaxe', amount: 1 },
                { itemId: 'small_net', amount: 1 },
                { itemId: 'tinderbox', amount: 1 },
                { itemId: 'knife', amount: 1 }
            ];
        }

        function sanitizeContentGrantState(savedGrants) {
            const restored = {};
            if (!savedGrants || typeof savedGrants !== 'object') return restored;

            const grantIds = Object.keys(savedGrants);
            for (let i = 0; i < grantIds.length; i++) {
                const grantId = String(grantIds[i] || '').trim();
                if (!grantId) continue;
                const rawGrant = savedGrants[grantId];
                if (!rawGrant || typeof rawGrant !== 'object') continue;

                const itemIds = Object.keys(rawGrant);
                const restoredGrant = {};
                for (let j = 0; j < itemIds.length; j++) {
                    const itemId = sanitizeItemId(itemIds[j]);
                    if (!itemId || !rawGrant[itemIds[j]]) continue;
                    restoredGrant[itemId] = true;
                }

                if (Object.keys(restoredGrant).length > 0) {
                    restored[grantId] = restoredGrant;
                }
            }

            return restored;
        }

        function cloneContentGrantState() {
            return sanitizeContentGrantState(progressContentGrants);
        }

        function hasContentGrantItem(grantId, itemId) {
            const safeGrantId = String(grantId || '').trim();
            const safeItemId = sanitizeItemId(itemId);
            if (!safeGrantId || !safeItemId) return false;
            return !!(progressContentGrants[safeGrantId] && progressContentGrants[safeGrantId][safeItemId]);
        }

        function markContentGrantItem(grantId, itemId) {
            const safeGrantId = String(grantId || '').trim();
            const safeItemId = sanitizeItemId(itemId);
            if (!safeGrantId || !safeItemId) return false;
            if (!progressContentGrants[safeGrantId] || typeof progressContentGrants[safeGrantId] !== 'object') {
                progressContentGrants[safeGrantId] = {};
            }
            progressContentGrants[safeGrantId][safeItemId] = true;
            return true;
        }

        function inventoryContainsItem(itemId) {
            const safeItemId = sanitizeItemId(itemId);
            if (!safeItemId) return false;
            return inventory.some((slot) => slot && slot.itemData && slot.itemData.id === safeItemId);
        }

        function applyInventoryIconReviewGrant() {
            const reviewBatch = getActiveIconReviewBatch();
            const added = [];
            const acknowledged = [];
            const blocked = [];

            for (let i = 0; i < reviewBatch.itemIds.length; i++) {
                const itemId = reviewBatch.itemIds[i];
                if (!ITEM_DB[itemId]) {
                    blocked.push(itemId);
                    continue;
                }
                if (hasContentGrantItem(reviewBatch.batchId, itemId)) continue;

                if (inventoryContainsItem(itemId)) {
                    markContentGrantItem(reviewBatch.batchId, itemId);
                    acknowledged.push(itemId);
                    continue;
                }

                const emptyIdx = inventory.indexOf(null);
                if (emptyIdx === -1) {
                    blocked.push(itemId);
                    continue;
                }

                inventory[emptyIdx] = { itemData: ITEM_DB[itemId], amount: 1 };
                markContentGrantItem(reviewBatch.batchId, itemId);
                added.push(itemId);
            }

            return {
                batchId: reviewBatch.batchId,
                batchLabel: reviewBatch.label,
                added,
                acknowledged,
                blocked,
                changed: added.length > 0 || acknowledged.length > 0
            };
        }

        function applyQaInventoryPreset(presetName) {
            const name = String(presetName || '').trim().toLowerCase();
            const tools = getQaToolSlots();
            let slots = null;

            if (name === 'fish_full') {
                slots = makeFilledSlots(tools.concat([
                    { itemId: 'fishing_rod', amount: 1 },

                    { itemId: 'harpoon', amount: 1 },
                    { itemId: 'rune_harpoon', amount: 1 },
                    { itemId: 'bait', amount: 200 }
                ]), 'raw_shrimp');
            } else if (name === 'fish_rod') {
                slots = tools.concat([
                    { itemId: 'fishing_rod', amount: 1 },

                    { itemId: 'bait', amount: 500 },
                    { itemId: 'coins', amount: 1000 }
                ]);
            } else if (name === 'fish_harpoon') {
                slots = tools.concat([
                    { itemId: 'harpoon', amount: 1 },
                    { itemId: 'coins', amount: 1000 }
                ]);
            } else if (name === 'fish_rune') {
                slots = tools.concat([
                    { itemId: 'rune_harpoon', amount: 1 },
                    { itemId: 'coins', amount: 1000 }
                ]);
            } else if (name === 'wc_full') {
                slots = makeFilledSlots(tools, 'logs');
            } else if (name === 'mining_full') {
                slots = makeFilledSlots(tools, 'copper_ore');
            } else if (name === 'rc_full') {
                slots = makeFilledSlots(tools, 'rune_essence');
            } else if (name === 'rc_combo') {
                slots = tools.concat([
                    { itemId: 'rune_essence', amount: 12 },
                    { itemId: 'air_rune', amount: 120 },
                    { itemId: 'small_pouch', amount: 1 }
                ]);
            } else if (name === 'rc_routes') {
                slots = tools.concat([
                    { itemId: 'rune_essence', amount: 12 },
                    { itemId: 'ember_rune', amount: 120 },
                    { itemId: 'water_rune', amount: 120 },
                    { itemId: 'earth_rune', amount: 120 },
                    { itemId: 'air_rune', amount: 120 },
                    { itemId: 'small_pouch', amount: 1 }
                ]);
            } else if (name === 'fm_full') {
                slots = makeFilledSlots(tools, 'logs');
            } else if (name === 'smith_smelt') {
                slots = [
                    { itemId: 'hammer', amount: 1 },
                    { itemId: 'ring_mould', amount: 1 },
                    { itemId: 'amulet_mould', amount: 1 },
                    { itemId: 'tiara_mould', amount: 1 },
                    { itemId: 'copper_ore', amount: 8 },
                    { itemId: 'tin_ore', amount: 8 },
                    { itemId: 'iron_ore', amount: 6 },
                    { itemId: 'coal', amount: 10 },
                    { itemId: 'silver_ore', amount: 4 },
                    { itemId: 'gold_ore', amount: 4 },
                    { itemId: 'mithril_ore', amount: 4 },
                    { itemId: 'adamant_ore', amount: 2 },
                    { itemId: 'rune_ore', amount: 1 }
                ];
            } else if (name === 'smith_forge') {
                slots = [
                    { itemId: 'hammer', amount: 1 },
                    { itemId: 'bronze_bar', amount: 8 },
                    { itemId: 'iron_bar', amount: 6 },
                    { itemId: 'steel_bar', amount: 5 },
                    { itemId: 'mithril_bar', amount: 4 },
                    { itemId: 'adamant_bar', amount: 3 },
                    { itemId: 'rune_bar', amount: 1 }
                ];
            } else if (name === 'smith_jewelry') {
                slots = [
                    { itemId: 'hammer', amount: 1 },
                    { itemId: 'ring_mould', amount: 1 },
                    { itemId: 'amulet_mould', amount: 1 },
                    { itemId: 'tiara_mould', amount: 1 },
                    { itemId: 'silver_bar', amount: 10 },
                    { itemId: 'gold_bar', amount: 10 }
                ];
            } else if (name === 'smith_full') {
                slots = [
                    { itemId: 'hammer', amount: 1 },
                    { itemId: 'ring_mould', amount: 1 },
                    { itemId: 'amulet_mould', amount: 1 },
                    { itemId: 'tiara_mould', amount: 1 },
                    { itemId: 'copper_ore', amount: 3 },
                    { itemId: 'tin_ore', amount: 3 },
                    { itemId: 'iron_ore', amount: 2 },
                    { itemId: 'coal', amount: 4 },
                    { itemId: 'silver_ore', amount: 2 },
                    { itemId: 'gold_ore', amount: 2 },
                    { itemId: 'mithril_ore', amount: 2 },
                    { itemId: 'adamant_ore', amount: 1 },
                    { itemId: 'rune_ore', amount: 1 },
                    { itemId: 'bronze_bar', amount: 1 },
                    { itemId: 'iron_bar', amount: 1 },
                    { itemId: 'steel_bar', amount: 1 }
                ];
            } else if (name === 'smith_fullinv') {
                slots = makeFilledSlots(tools.concat([
                    { itemId: 'hammer', amount: 1 },
                    { itemId: 'bronze_bar', amount: 1 }
                ]), 'logs');
            } else if (name === 'icons') {
                const reviewBatch = getActiveIconReviewBatch();
                slots = reviewBatch.itemIds.map((itemId) => ({ itemId, amount: 1 }));
            } else if (name === 'default') {
                slots = [
                    { itemId: 'iron_axe', amount: 1 },
                    { itemId: 'logs', amount: 1 },
                    { itemId: 'coins', amount: 1000 },
                    { itemId: 'small_net', amount: 1 },
                    { itemId: 'iron_pickaxe', amount: 1 },
                    { itemId: 'tinderbox', amount: 1 },
                    { itemId: 'knife', amount: 1 },
                    { itemId: 'raw_shrimp', amount: 1 },
                    { itemId: 'raw_shrimp', amount: 1 },
                    { itemId: 'raw_shrimp', amount: 1 },
                    { itemId: 'raw_shrimp', amount: 1 },
                    { itemId: 'raw_shrimp', amount: 1 }
                ];
            } else {
                return false;
            }

            setInventorySlots(slots);
            addChatMessage(`QA preset applied: ${name}`, 'info');
            return true;
        }

        window.applyQaInventoryPreset = applyQaInventoryPreset;

        function getQaXpForLevel(levelValue) {
            const lvl = Math.max(1, Math.min(99, Math.floor(levelValue)));
            if (typeof getXpForLevel === 'function') return getXpForLevel(lvl);

            let points = 0;
            for (let level = 1; level < lvl; level++) {
                points += Math.floor(level + 300 * Math.pow(2, level / 7));
            }
            return Math.floor(points / 4);
        }

        function setQaSkillLevel(skillId, levelValue) {
            if (!playerSkills || !playerSkills[skillId]) return false;
            const lvl = Math.max(1, Math.min(99, Math.floor(levelValue)));
            if (!Number.isFinite(lvl)) return false;

            playerSkills[skillId].xp = getQaXpForLevel(lvl);
            playerSkills[skillId].level = lvl;

            if (typeof refreshSkillUi === 'function') refreshSkillUi(skillId);
            return true;
        }
        function setQaUnlockFlag(flagId, enabled) {
            if (!flagId) return false;
            if (!playerState.unlockFlags || typeof playerState.unlockFlags !== 'object') {
                playerState.unlockFlags = {};
            }
            playerState.unlockFlags[flagId] = !!enabled;
            return true;
        }
        function getWorldGameContext() {
            if (worldAdapterRuntime && typeof worldAdapterRuntime.getWorldGameContext === 'function') {
                return worldAdapterRuntime.getWorldGameContext();
            }
            return window.GameContext || null;
        }
        function travelToWorld(worldId, options = {}) {
            if (!worldAdapterRuntime || typeof worldAdapterRuntime.resolveTravelTarget !== 'function') return false;
            const travelTarget = worldAdapterRuntime.resolveTravelTarget(worldId, {
                spawn: options && options.spawn,
                label: options && options.label,
                fallbackWorldId: 'starter_town',
                mapSize: MAP_SIZE,
                planes: PLANES,
                activate: true
            });
            if (!travelTarget || !travelTarget.ok || !travelTarget.worldId || !travelTarget.spawn) return false;

            const resolvedWorldId = travelTarget.worldId;
            const spawn = travelTarget.spawn;

            pendingAction = null;
            groundItems = [];
            activeFires = [];
            playerOverheadText = { text: '', expiresAt: 0 };
            if (typeof clearSelectedUse === 'function') clearSelectedUse(false);
            if (typeof closeBank === 'function') closeBank();
            if (typeof closeShop === 'function') closeShop();

            playerState.x = spawn.x;
            playerState.y = spawn.y;
            playerState.z = spawn.z;
            playerState.prevX = spawn.x;
            playerState.prevY = spawn.y;
            playerState.midX = null;
            playerState.midY = null;
            playerState.targetX = spawn.x;
            playerState.targetY = spawn.y;
            playerState.path = [];
            playerState.action = 'IDLE';
            playerState.targetObj = null;
            playerState.targetUid = null;
            playerState.pendingActionAfterTurn = null;
            playerState.pendingInteractAfterFletchingWalk = null;
            playerState.turnLock = false;
            playerState.actionVisualReady = true;
            playerState.firemakingTarget = null;
            playerState.firemakingSession = null;
            playerState.pendingSkillStart = null;

            minimapLocked = true;
            minimapTargetX = spawn.x;
            minimapTargetY = spawn.y;
            minimapDestination = null;

            if (typeof window.reloadActiveWorldScene === 'function') {
                window.reloadActiveWorldScene();
            } else if (typeof window.initLogicalMap === 'function') {
                window.initLogicalMap();
            }

            syncGameSessionState();
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof updateCameraNow === 'function') updateCameraNow();
            const destinationLabel = travelTarget.label || String(resolvedWorldId || 'Unknown World');
            addChatMessage(`Travelled to ${destinationLabel}.`, 'info');
            return true;
        }
        window.travelToWorld = travelToWorld;
        function getWorldRouteGroup(groupId) {
            const context = getWorldGameContext();
            if (!context || !context.queries || typeof context.queries.getRouteGroup !== 'function') return [];
            const routes = context.queries.getRouteGroup(groupId);
            return Array.isArray(routes) ? routes : [];
        }
        function getWorldMerchantServices() {
            const context = getWorldGameContext();
            if (!context || !context.queries || typeof context.queries.getMerchantServices !== 'function') return [];
            const services = context.queries.getMerchantServices();
            return Array.isArray(services) ? services : [];
        }
        function getQaAltarLocations() {
            const fromRegistry = getWorldRouteGroup('runecrafting');
            if (fromRegistry.length > 0) return fromRegistry;
            if (typeof getRunecraftingAltarLocations !== 'function') return [];
            const locations = getRunecraftingAltarLocations();
            return Array.isArray(locations) ? locations : [];
        }

        function qaListAltars() {
            const altars = getQaAltarLocations();
            if (!altars.length) {
                addChatMessage('No runecrafting altars currently placed.', 'warn');
                return;
            }
            for (let i = 0; i < altars.length; i++) {
                const altar = altars[i];
                addChatMessage(`[QA altar] ${altar.label} @ (${altar.x},${altar.y},${altar.z})`, 'info');
            }
        }
        function qaListWorlds() {
            const worldSummaries = (worldAdapterRuntime && typeof worldAdapterRuntime.getQaWorldSummaries === 'function')
                ? worldAdapterRuntime.getQaWorldSummaries()
                : [];
            if (!worldSummaries.length) {
                addChatMessage('No worlds are currently registered.', 'warn');
                return;
            }
            for (let i = 0; i < worldSummaries.length; i++) {
                const summary = worldSummaries[i];
                if (!summary) continue;
                const activeLabel = summary.isActive ? ' [active]' : '';
                addChatMessage(`[QA world] ${summary.worldId}${activeLabel} - ${summary.label} @ (${summary.defaultSpawn.x},${summary.defaultSpawn.y},${summary.defaultSpawn.z})`, 'info');
            }
        }
        function qaTravelWorld(worldIdLike) {
            const match = (worldAdapterRuntime && typeof worldAdapterRuntime.matchQaWorld === 'function')
                ? worldAdapterRuntime.matchQaWorld(worldIdLike)
                : null;
            if (!match) return false;
            return travelToWorld(match.worldId, {
                spawn: match.defaultSpawn,
                label: match.label
            });
        }

        function qaTeleportTo(x, y, z, label) {
            if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) return false;
            playerState.x = x;
            playerState.y = y;
            playerState.z = z;
            playerState.prevX = playerState.x;
            playerState.prevY = playerState.y;
            playerState.targetX = playerState.x;
            playerState.targetY = playerState.y;
            playerState.path = [];
            playerState.action = 'IDLE';
            if (typeof updateCameraNow === 'function') updateCameraNow();
            addChatMessage(`Teleported to ${label || 'target'}.`, 'info');
            return true;
        }

        function qaGotoAltar(labelLike) {
            const needle = String(labelLike || '').trim().toLowerCase();
            if (!needle) return false;
            const altars = getQaAltarLocations();
            let match = null;
            for (let i = 0; i < altars.length; i++) {
                const altar = altars[i];
                if (!altar || !altar.label) continue;
                if (altar.label.toLowerCase().includes(needle)) {
                    match = altar;
                    break;
                }
            }
            if (!match) return false;

            // Keep QA teleports outside the altar's 4x4 collision footprint.
            return qaTeleportTo(match.x, Math.max(0, match.y - 3), match.z, `near ${match.label}`);
        }

        function getQaFishingSpots() {
            const fallback = {
                pond: { x: 205, y: 223, z: 0, label: 'castle pond bank' },
                pier: { x: 205, y: 230, z: 0, label: 'castle pond pier' },
                deep: { x: 205, y: 231, z: 0, label: 'castle pond deep-water edge' }
            };
            const routes = getWorldRouteGroup('fishing');
            if (!Array.isArray(routes) || routes.length === 0) return fallback;
            const merged = Object.assign({}, fallback);
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                const explicitAlias = typeof route.alias === 'string' ? route.alias.trim().toLowerCase() : '';
                const key = explicitAlias && merged[explicitAlias] ? explicitAlias : null;
                if (!key || !merged[key]) continue;
                merged[key] = {
                    x: Number.isFinite(route.x) ? route.x : merged[key].x,
                    y: Number.isFinite(route.y) ? route.y : merged[key].y,
                    z: Number.isFinite(route.z) ? route.z : merged[key].z,
                    label: route.label || merged[key].label
                };
            }
            return merged;
        }

        function qaListFishingSpots() {
            const spots = getQaFishingSpots();
            const ids = Object.keys(spots);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const spot = spots[id];
                addChatMessage(`[QA fish] ${id} @ (${spot.x},${spot.y},${spot.z})`, 'info');
            }
        }

        function qaGotoFishingSpot(nameLike) {
            const key = String(nameLike || '').trim().toLowerCase();
            if (!key) return false;
            const spots = getQaFishingSpots();
            if (spots[key]) {
                const exact = spots[key];
                return qaTeleportTo(exact.x, exact.y, exact.z, exact.label);
            }

            const ids = Object.keys(spots);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (!id.includes(key)) continue;
                const spot = spots[id];
                return qaTeleportTo(spot.x, spot.y, spot.z, spot.label);
            }

            return false;
        }

        function getQaCookingSpots() {
            const fallback = {
                camp: { x: 199, y: 224, z: 0, label: 'starter campfire' },
                river: { x: 197, y: 227, z: 0, label: 'riverbank fire line' },
                dock: { x: 212, y: 227, z: 0, label: 'dockside fire line' },
                deep: { x: 205, y: 229, z: 0, label: 'deep-water dock fire line' }
            };
            const routes = getWorldRouteGroup('cooking');
            if (!Array.isArray(routes) || routes.length === 0) return fallback;
            const merged = Object.assign({}, fallback);
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                if (!route) continue;
                const key = typeof route.alias === 'string' ? route.alias.trim().toLowerCase() : '';
                if (!key) continue;
                merged[key] = {
                    x: Number.isFinite(route.x) ? route.x : merged[key].x,
                    y: Number.isFinite(route.y) ? route.y : merged[key].y,
                    z: Number.isFinite(route.z) ? route.z : merged[key].z,
                    label: route.label || merged[key].label
                };
            }
            return merged;
        }

        function qaListCookingSpots() {
            const spots = getQaCookingSpots();
            const ids = Object.keys(spots);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const spot = spots[id];
                addChatMessage(`[QA cook] ${id} @ (${spot.x},${spot.y},${spot.z})`, 'info');
            }
        }

        function qaGotoCookingSpot(nameLike) {
            const raw = String(nameLike || '').trim().toLowerCase();
            if (!raw) return false;
            const spots = getQaCookingSpots();
            const aliases = {
                camp: 'camp',
                campfire: 'camp',
                starter: 'camp',
                river: 'river',
                riverbank: 'river',
                dock: 'dock',
                dockside: 'dock',
                deep: 'deep',
                deepwater: 'deep',
                'deep-water': 'deep'
            };
            const key = aliases[raw] || raw;
            if (spots[key]) {
                const exact = spots[key];
                return qaTeleportTo(exact.x, exact.y, exact.z, exact.label);
            }

            const ids = Object.keys(spots);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (!id.includes(key)) continue;
                const spot = spots[id];
                return qaTeleportTo(spot.x, spot.y, spot.z, spot.label);
            }
            return false;
        }

        function getQaDiscoveredMerchants() {
            const merchantServices = getWorldMerchantServices();
            if (merchantServices.length > 0) {
                return merchantServices.map((service) => ({
                    merchantId: String(service.merchantId || '').trim().toLowerCase(),
                    name: String(service.name || service.merchantId || 'merchant'),
                    x: Number.isFinite(service.x) ? service.x : 0,
                    y: Number.isFinite(service.y) ? service.y : 0,
                    z: Number.isFinite(service.z) ? service.z : 0
                })).filter((entry) => !!entry.merchantId);
            }
            const byId = {};
            for (let i = 0; i < npcsToRender.length; i++) {
                const npc = npcsToRender[i];
                if (!npc || !npc.merchantId) continue;
                const merchantId = String(npc.merchantId || '').trim().toLowerCase();
                if (!merchantId) continue;
                if (byId[merchantId]) continue;
                byId[merchantId] = {
                    merchantId,
                    name: String(npc.name || merchantId),
                    x: Number.isFinite(npc.x) ? npc.x : 0,
                    y: Number.isFinite(npc.y) ? npc.y : 0,
                    z: Number.isFinite(npc.z) ? npc.z : 0
                };
            }
            const orderedIds = Object.keys(byId).sort();
            return orderedIds.map((merchantId) => byId[merchantId]);
        }

        function getQaFishingMerchants() {
            const fallback = {
                teacher: { x: 201, y: 223, z: 0, label: 'fishing teacher' },
                supplier: { x: 209, y: 230, z: 0, label: 'fishing supplier' }
            };

            const merged = Object.assign({}, fallback);
            const keyByMerchantId = {
                fishing_teacher: 'teacher',
                fishing_supplier: 'supplier'
            };
            const discovered = getQaDiscoveredMerchants();
            for (let i = 0; i < discovered.length; i++) {
                const merchant = discovered[i];
                const key = keyByMerchantId[merchant.merchantId];
                if (!key || !merged[key]) continue;
                merged[key] = {
                    x: merchant.x,
                    y: merchant.y,
                    z: merchant.z,
                    label: merchant.name || merged[key].label
                };
            }
            return merged;
        }

        function qaListFishingMerchants() {
            const spots = getQaFishingMerchants();
            const ids = Object.keys(spots);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const spot = spots[id];
                addChatMessage('[QA fishshop] ' + id + ' @ (' + spot.x + ',' + spot.y + ',' + spot.z + ')', 'info');
            }
        }

        function qaGotoFishingMerchant(nameLike) {
            const key = String(nameLike || '').trim().toLowerCase();
            if (!key) return false;
            const spots = getQaFishingMerchants();
            if (spots[key]) {
                const exact = spots[key];
                return qaTeleportTo(exact.x, exact.y, exact.z, exact.label);
            }

            const ids = Object.keys(spots);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (!id.includes(key)) continue;
                const spot = spots[id];
                return qaTeleportTo(spot.x, spot.y, spot.z, spot.label);
            }

            return false;
        }


        function getQaOpenableMerchantIds() {
            const ids = new Set(['general_store']);
            const economy = window.ShopEconomy;
            const hasStockPolicy = economy && typeof economy.hasStockPolicy === 'function'
                ? (merchantId) => economy.hasStockPolicy(merchantId)
                : null;
            const addCandidate = (merchantId) => {
                const id = String(merchantId || '').trim().toLowerCase();
                if (!id) return;
                if (hasStockPolicy && !hasStockPolicy(id)) return;
                ids.add(id);
            };

            if (economy && typeof economy.getConfiguredMerchantIds === 'function') {
                const configured = economy.getConfiguredMerchantIds();
                if (Array.isArray(configured)) {
                    for (let i = 0; i < configured.length; i++) {
                        addCandidate(configured[i]);
                    }
                }
            }

            const discovered = getQaDiscoveredMerchants();
            for (let i = 0; i < discovered.length; i++) {
                addCandidate(discovered[i].merchantId);
            }

            const ordered = Array.from(ids).sort();
            const generalStoreIndex = ordered.indexOf('general_store');
            if (generalStoreIndex > 0) {
                ordered.splice(generalStoreIndex, 1);
                ordered.unshift('general_store');
            }
            return ordered;
        }

        function formatQaOpenShopUsage() {
            const merchantIds = getQaOpenableMerchantIds();
            if (merchantIds.length === 0) return 'Usage: /qa openshop <merchantId>';
            return 'Usage: /qa openshop <' + merchantIds.join('|') + '>';
        }

        function getQaMerchantAliasMap() {
            const aliases = {};
            const setAlias = (alias, merchantId, overwrite = false) => {
                const aliasKey = String(alias || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
                const merchantKey = String(merchantId || '').trim().toLowerCase();
                if (!aliasKey || !merchantKey) return;
                if (!overwrite && aliases[aliasKey]) return;
                aliases[aliasKey] = merchantKey;
            };

            const aliasSeed = {
                teacher: 'fishing_teacher',
                supplier: 'fishing_supplier',
                tutor: 'rune_tutor',
                sage: 'combination_sage',
                fish_teacher: 'fishing_teacher',
                fish_supplier: 'fishing_supplier',
                rc_tutor: 'rune_tutor',
                combo_sage: 'combination_sage',
                borin: 'borin_ironvein',
                thrain: 'thrain_deepforge',
                elira: 'elira_gemhand',
                forester: 'forester_teacher',
                woodsman: 'advanced_woodsman',
                fletcher: 'fletching_supplier',
                tanner: 'tanner_rusk',
                shop: 'general_store',
                store: 'general_store',
                general: 'general_store'
            };
            const aliasKeys = Object.keys(aliasSeed);
            for (let i = 0; i < aliasKeys.length; i++) {
                const aliasKey = aliasKeys[i];
                setAlias(aliasKey, aliasSeed[aliasKey], true);
            }

            const openableMerchantIds = getQaOpenableMerchantIds();
            for (let i = 0; i < openableMerchantIds.length; i++) {
                const merchantId = openableMerchantIds[i];
                setAlias(merchantId, merchantId, true);
                setAlias(merchantId.replace(/_/g, ''), merchantId);
            }

            const discovered = getQaDiscoveredMerchants();
            for (let i = 0; i < discovered.length; i++) {
                const merchant = discovered[i];
                const merchantId = merchant.merchantId;
                if (!merchantId) continue;
                setAlias(merchantId, merchantId, true);

                const segments = merchantId.split('_').filter(Boolean);
                if (segments.length > 0) {
                    setAlias(segments[segments.length - 1], merchantId);
                }

                const nameToken = String(merchant.name || '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '');
                if (nameToken) {
                    setAlias(nameToken, merchantId);
                    setAlias(nameToken.replace(/_/g, ''), merchantId);
                }
            }

            return aliases;
        }
        function qaGotoMerchant(targetLike) {
            const raw = String(targetLike || '').trim().toLowerCase();
            if (!raw) return false;

            const aliases = getQaMerchantAliasMap();
            const merchantId = aliases[raw] || raw;

            const matches = [];
            const merchants = getQaDiscoveredMerchants();
            for (let i = 0; i < merchants.length; i++) {
                const npc = merchants[i];
                if (!npc || !npc.merchantId) continue;
                const id = String(npc.merchantId).toLowerCase();
                const name = String(npc.name || '').toLowerCase();
                if (id === merchantId || id.includes(merchantId) || name.includes(raw)) {
                    matches.push(npc);
                }
            }
            if (matches.length === 0) return false;

            let best = matches[0];
            let bestDist = Math.abs(best.x - playerState.x) + Math.abs(best.y - playerState.y) + (best.z === playerState.z ? 0 : 1000);
            for (let i = 1; i < matches.length; i++) {
                const npc = matches[i];
                const dist = Math.abs(npc.x - playerState.x) + Math.abs(npc.y - playerState.y) + (npc.z === playerState.z ? 0 : 1000);
                if (dist < bestDist) {
                    best = npc;
                    bestDist = dist;
                }
            }

            const label = (best.merchantId || best.name || 'merchant').toString();
            return qaTeleportTo(best.x, best.y, best.z, label);
        }
        function getQaBestToolByClass(toolClass) {
            const candidates = [];
            if (equipment && equipment.weapon && equipment.weapon.weaponClass === toolClass) {
                candidates.push(equipment.weapon);
            }
            for (let i = 0; i < inventory.length; i++) {
                const slot = inventory[i];
                if (!slot || !slot.itemData) continue;
                if (slot.itemData.weaponClass === toolClass) candidates.push(slot.itemData);
            }
            if (candidates.length === 0) return null;

            let best = candidates[0];
            let bestPower = Number.isFinite(best.toolTier) ? best.toolTier : 0;
            for (let i = 1; i < candidates.length; i++) {
                const item = candidates[i];
                const power = Number.isFinite(item.toolTier) ? item.toolTier : 0;
                if (power > bestPower) {
                    best = item;
                    bestPower = power;
                }
            }
            return best;
        }

        function qaDiagMining() {
            const registry = window.SkillSpecRegistry;
            const spec = registry && typeof registry.getSkillSpec === 'function' ? registry.getSkillSpec('mining') : null;
            if (!spec || !spec.nodeTable || !spec.nodeTable.copper_rock) {
                addChatMessage('QA mining diag unavailable: missing mining spec.', 'warn');
                return;
            }

            const level = playerSkills && playerSkills.mining ? playerSkills.mining.level : 1;
            const node = spec.nodeTable.copper_rock;
            const best = getQaBestToolByClass('pickaxe');
            const toolPower = best && Number.isFinite(best.toolTier) ? best.toolTier : 0;
            const speedBonus = best && Number.isFinite(best.speedBonusTicks) ? best.speedBonusTicks : 0;
            const success = registry && typeof registry.computeGatherSuccessChance === 'function'
                ? registry.computeGatherSuccessChance(level, toolPower, node.difficulty)
                : 0;
            const interval = registry && typeof registry.computeIntervalTicks === 'function'
                ? registry.computeIntervalTicks(spec.timing.baseAttemptTicks, spec.timing.minimumAttemptTicks, speedBonus)
                : 0;

            addChatMessage(`[QA mining] lvl=${level}, tool=${best ? best.id : 'none'}, power=${toolPower}, speedBonus=${speedBonus}, chance=${(success * 100).toFixed(2)}%, interval=${interval}t`, 'info');
        }

                        function qaDiagRunecrafting() {
            const registry = window.SkillSpecRegistry;
            const spec = registry && typeof registry.getSkillSpec === 'function' ? registry.getSkillSpec('runecrafting') : null;
            const recipes = spec && spec.recipeSet ? spec.recipeSet : null;
            const recipe = recipes ? recipes.ember_altar : null;
            if (!recipe) {
                addChatMessage('QA rc diag unavailable: missing runecrafting recipe.', 'warn');
                return;
            }
            const level = playerSkills && playerSkills.runecrafting ? playerSkills.runecrafting.level : 1;
            const outputPerEssence = registry && typeof registry.computeRuneOutputPerEssence === 'function'
                ? registry.computeRuneOutputPerEssence(level, recipe.scalingStartLevel)
                : 1;
            const comboOutputPerEssence = registry && typeof registry.computeRuneOutputPerEssence === 'function'
                ? registry.computeRuneOutputPerEssence(level, 40)
                : 1;
            const comboCount = recipes ? Object.keys(recipes).filter((id) => recipes[id] && recipes[id].requiresSecondaryRune).length : 0;
            const comboUnlocked = !!(playerState.unlockFlags && playerState.unlockFlags.runecraftingComboUnlocked);
            addChatMessage(`[QA rc] lvl=${level}, emberStart=${recipe.scalingStartLevel}, emberPerEss=${outputPerEssence}, comboUnlocked=${comboUnlocked}, comboRecipes=${comboCount}, comboPerEss@40=${comboOutputPerEssence}`, 'info');
        }

        function qaDiagFishing() {
            const registry = window.SkillSpecRegistry;
            const spec = registry && typeof registry.getSkillSpec === 'function' ? registry.getSkillSpec('fishing') : null;
            if (!spec || !spec.nodeTable) {
                addChatMessage('QA fishing diag unavailable: missing fishing spec.', 'warn');
                return;
            }

            const level = playerSkills && playerSkills.fishing ? playerSkills.fishing.level : 1;
            const baitCount = inventory.reduce((sum, slot) => {
                if (!slot || !slot.itemData || slot.itemData.id !== 'bait') return sum;
                return sum + slot.amount;
            }, 0);

            const nearbyTiles = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const tx = playerState.x + dx;
                    const ty = playerState.y + dy;
                    if (tx < 0 || ty < 0 || tx >= MAP_SIZE || ty >= MAP_SIZE) continue;
                    nearbyTiles.push(logicalMap[playerState.z][ty][tx]);
                }
            }
            const shallowAdj = nearbyTiles.filter((t) => t === TileId.WATER_SHALLOW).length;
            const deepAdj = nearbyTiles.filter((t) => t === TileId.WATER_DEEP).length;
            const equipped = equipment && equipment.weapon ? equipment.weapon.id : 'none';

            addChatMessage(`[QA fishing] lvl=${level}, equipped=${equipped}, bait=${baitCount}, tile=${logicalMap[playerState.z][playerState.y][playerState.x]}, adjShallow=${shallowAdj}, adjDeep=${deepAdj}, action=${playerState.action}, activeMethod=${playerState.fishingActiveMethodId || 'none'}, activeWater=${playerState.fishingActiveWaterId || 'none'}`, 'info');
        }





        function qaDiagShop(merchantIdInput) {
            const merchantId = String(merchantIdInput || (typeof window.getActiveShopMerchantId === 'function' ? window.getActiveShopMerchantId() : 'general_store')).toLowerCase();
            if (!window.ShopEconomy || typeof window.ShopEconomy.getMerchantDiagnosticSummary !== 'function') {
                addChatMessage('QA shop diag unavailable: missing shop economy module.', 'warn');
                return;
            }

            const rows = window.ShopEconomy.getMerchantDiagnosticSummary(merchantId);
            addChatMessage('[QA shop] merchant=' + merchantId, 'info');
            if (!rows || rows.length === 0) {
                addChatMessage('[QA shop] no merchant economy rules found for this merchant.', 'info');
                return;
            }

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const unlockText = Number.isFinite(row.threshold)
                    ? (' unlock=' + row.sold + '/' + row.threshold + ' (' + (row.unlocked ? 'yes' : 'no') + ')')
                    : '';
                addChatMessage('[QA shop] ' + row.itemId + ': buyFromPlayer=' + (row.canBuyFromPlayer ? 'yes' : 'no') + ' (' + row.sellPrice + '), sellToPlayer=' + (row.canSellToPlayer ? 'yes' : 'no') + ' (' + row.buyPrice + ')' + unlockText, 'info');
            }

            if (typeof window.ShopEconomy.getFishUnlockSummary === 'function') {
                const fishRows = window.ShopEconomy.getFishUnlockSummary(merchantId);
                for (let i = 0; i < fishRows.length; i++) {
                    const row = fishRows[i];
                    addChatMessage('[QA fish-unlock] ' + row.itemId + ': sold=' + row.sold + '/' + row.threshold + ', unlocked=' + (row.unlocked ? 'yes' : 'no'), 'info');
                }
            }
        }
        let equipment = gameSession ? gameSession.progress.equipment : { head: null, cape: null, neck: null, weapon: null, body: null, shield: null, legs: null, hands: null, feet: null, ring: null };
        let baseStats = { atk: 10, def: 10, str: 10 };
        let userItemPrefs = gameSession ? gameSession.progress.userItemPrefs : {};
        let playerSkills = gameSession ? gameSession.progress.playerSkills : {
            attack: { xp: 0, level: 1 },
            hitpoints: { xp: 1154, level: 10 },
            mining: { xp: 0, level: 1 },
            strength: { xp: 0, level: 1 },
            defense: { xp: 0, level: 1 },
            woodcutting: { xp: 0, level: 1 },
            firemaking: { xp: 0, level: 1 },
            fishing: { xp: 0, level: 1 },
            cooking: { xp: 0, level: 1 },
            crafting: { xp: 0, level: 1 },
            fletching: { xp: 0, level: 1 },
            runecrafting: { xp: 0, level: 1 },
            smithing: { xp: 0, level: 1 }
        };
        let groundItems = [];
        let activeFires = [];
        let fishingSpotsToRender = [];
        let cookingFireSpotsToRender = [];
        let selectedUse = { invIndex: null, itemId: null }; 
        let progressAutosaveHandle = null;

        function syncGameSessionState() {
            const activeSession = getGameSession();
            if (!activeSession) return null;

            if (gameSessionRuntime && typeof gameSessionRuntime.resolveCurrentWorldId === 'function') {
                activeSession.currentWorldId = gameSessionRuntime.resolveCurrentWorldId();
            }
            activeSession.runtime.currentWorldId = activeSession.currentWorldId;
            activeSession.player = playerState;
            activeSession.progress.profile = playerProfileState;
            activeSession.progress.playerSkills = playerSkills;
            activeSession.progress.inventory = inventory;
            activeSession.progress.bankItems = bankItems;
            activeSession.progress.equipment = equipment;
            activeSession.progress.userItemPrefs = userItemPrefs;
            activeSession.progress.contentGrants = progressContentGrants;
            activeSession.ui.runMode = !!isRunning;
            activeSession.runtime.playerEntryFlow = playerEntryFlowState;
            window.playerProfileState = playerProfileState;
            return activeSession;
        }

        syncGameSessionState();

        function canUseProgressStorage() {
            try {
                return typeof window !== 'undefined'
                    && !!window.localStorage
                    && !!gameSessionRuntime
                    && typeof gameSessionRuntime.saveProgressPayloadToStorage === 'function'
                    && typeof gameSessionRuntime.loadProgressPayloadFromStorage === 'function';
            } catch (error) {
                return false;
            }
        }

        function sanitizeItemId(value) {
            if (typeof value !== 'string') return '';
            return value.trim().toLowerCase();
        }

        function serializeInventorySlot(slot) {
            if (!slot || !slot.itemData || typeof slot.itemData.id !== 'string') return null;
            const itemId = sanitizeItemId(slot.itemData.id);
            if (!itemId || !ITEM_DB[itemId]) return null;
            const rawAmount = Number(slot.amount);
            const amount = Number.isFinite(rawAmount) ? Math.max(1, Math.floor(rawAmount)) : 1;
            return { itemId, amount };
        }

        function deserializeInventorySlot(serializedSlot) {
            if (!serializedSlot || typeof serializedSlot !== 'object') return null;
            const itemId = sanitizeItemId(serializedSlot.itemId);
            if (!itemId || !ITEM_DB[itemId]) return null;
            const itemData = ITEM_DB[itemId];
            const rawAmount = Number(serializedSlot.amount);
            const amount = itemData.stackable
                ? (Number.isFinite(rawAmount) ? Math.max(1, Math.floor(rawAmount)) : 1)
                : 1;
            return { itemData, amount };
        }

        function serializeItemArray(slots) {
            if (!Array.isArray(slots)) return [];
            return slots.map((slot) => serializeInventorySlot(slot));
        }

        function deserializeItemArray(savedSlots, size) {
            const restored = Array(size).fill(null);
            if (!Array.isArray(savedSlots)) return restored;
            const max = Math.min(size, savedSlots.length);
            for (let i = 0; i < max; i++) {
                restored[i] = deserializeInventorySlot(savedSlots[i]);
            }
            return restored;
        }

        function serializeEquipmentState() {
            const out = {};
            const slotNames = Object.keys(equipment || {});
            for (let i = 0; i < slotNames.length; i++) {
                const slotName = slotNames[i];
                const equippedItem = equipment[slotName];
                out[slotName] = equippedItem && typeof equippedItem.id === 'string'
                    ? sanitizeItemId(equippedItem.id)
                    : null;
            }
            return out;
        }

        function deserializeEquipmentState(savedEquipment) {
            const restored = {};
            const slotNames = Object.keys(equipment || {});
            for (let i = 0; i < slotNames.length; i++) {
                const slotName = slotNames[i];
                const itemId = savedEquipment && typeof savedEquipment === 'object'
                    ? sanitizeItemId(savedEquipment[slotName])
                    : '';
                restored[slotName] = itemId && ITEM_DB[itemId] ? ITEM_DB[itemId] : null;
            }
            return restored;
        }

        function sanitizeUserItemPrefs(savedPrefs) {
            const restored = {};
            if (!savedPrefs || typeof savedPrefs !== 'object') return restored;
            const keys = Object.keys(savedPrefs);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (!key || typeof savedPrefs[key] !== 'string') continue;
                restored[key] = savedPrefs[key];
            }
            return restored;
        }

        function sanitizeSkillState(savedSkills) {
            const defaults = playerSkills;
            const skillIds = Object.keys(defaults);
            const restored = {};
            for (let i = 0; i < skillIds.length; i++) {
                const skillId = skillIds[i];
                const defaultEntry = defaults[skillId] || { xp: 0, level: 1 };
                const savedEntry = savedSkills && typeof savedSkills === 'object' ? savedSkills[skillId] : null;
                const xpRaw = savedEntry && Number.isFinite(savedEntry.xp) ? savedEntry.xp : defaultEntry.xp;
                const xp = Math.max(0, Math.floor(xpRaw));

                let level = defaultEntry.level;
                if (savedEntry && Number.isFinite(savedEntry.level)) {
                    level = Math.max(1, Math.min(PROGRESS_MAX_SKILL_LEVEL, Math.floor(savedEntry.level)));
                }
                if (typeof getLevelForXp === 'function') {
                    level = Math.max(1, Math.min(PROGRESS_MAX_SKILL_LEVEL, getLevelForXp(xp)));
                }

                restored[skillId] = { xp, level };
            }
            return restored;
        }

        function sanitizePlayerName(value) {
            if (typeof value !== 'string') return '';
            const cleaned = value
                .replace(/[^A-Za-z0-9 _-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (!cleaned) return '';
            return cleaned.slice(0, PLAYER_NAME_MAX_LENGTH).trim();
        }

        function createEmptyPlayerProfile() {
            return {
                name: '',
                creationCompleted: false,
                createdAt: null,
                lastStartedAt: null
            };
        }

        function syncPlayerProfileState(nextProfile) {
            const safeProfile = nextProfile && typeof nextProfile === 'object'
                ? nextProfile
                : createEmptyPlayerProfile();
            playerProfileState.name = typeof safeProfile.name === 'string' ? safeProfile.name : '';
            playerProfileState.creationCompleted = !!safeProfile.creationCompleted;
            playerProfileState.createdAt = Number.isFinite(safeProfile.createdAt)
                ? Math.max(0, Math.floor(safeProfile.createdAt))
                : null;
            playerProfileState.lastStartedAt = Number.isFinite(safeProfile.lastStartedAt)
                ? Math.max(0, Math.floor(safeProfile.lastStartedAt))
                : null;
        }

        function sanitizePlayerProfile(savedProfile, options = {}) {
            const allowLegacyFallback = !!(options && options.allowLegacyFallback);
            const restored = createEmptyPlayerProfile();
            if (savedProfile && typeof savedProfile === 'object') {
                restored.name = sanitizePlayerName(savedProfile.name);
                restored.creationCompleted = !!savedProfile.creationCompleted;
                restored.createdAt = Number.isFinite(savedProfile.createdAt)
                    ? Math.max(0, Math.floor(savedProfile.createdAt))
                    : null;
                restored.lastStartedAt = Number.isFinite(savedProfile.lastStartedAt)
                    ? Math.max(0, Math.floor(savedProfile.lastStartedAt))
                    : null;
            }

            if (allowLegacyFallback && !restored.name) restored.name = PLAYER_PROFILE_DEFAULT_NAME;
            if (allowLegacyFallback && !restored.creationCompleted) restored.creationCompleted = true;
            if (allowLegacyFallback && !restored.createdAt) restored.createdAt = Date.now();

            return restored;
        }

        function serializePlayerProfile() {
            return {
                name: sanitizePlayerName(playerProfileState.name) || PLAYER_PROFILE_DEFAULT_NAME,
                creationCompleted: !!playerProfileState.creationCompleted,
                createdAt: Number.isFinite(playerProfileState.createdAt)
                    ? Math.max(0, Math.floor(playerProfileState.createdAt))
                    : null,
                lastStartedAt: Number.isFinite(playerProfileState.lastStartedAt)
                    ? Math.max(0, Math.floor(playerProfileState.lastStartedAt))
                    : null
            };
        }

        function sanitizeAppearanceState(savedAppearance) {
            if (!window.playerAppearanceState || typeof window.playerAppearanceState !== 'object') return null;
            if (!savedAppearance || typeof savedAppearance !== 'object') return null;

            const gender = savedAppearance.gender === 1 ? 1 : 0;
            const colorsIn = Array.isArray(savedAppearance.colors) ? savedAppearance.colors : [];
            const colors = [0, 0, 0, 0, 0];
            for (let i = 0; i < colors.length; i++) {
                const raw = Number(colorsIn[i]);
                colors[i] = Number.isFinite(raw) ? Math.floor(raw) : 0;
            }
            return { gender, colors };
        }

        function buildProgressPayload(reason = 'manual') {
            const activeSession = syncGameSessionState();
            if (!activeSession || !gameSessionRuntime || typeof gameSessionRuntime.buildProgressSavePayload !== 'function') return null;
            return gameSessionRuntime.buildProgressSavePayload({
                saveVersion: PROGRESS_SAVE_VERSION,
                reason,
                session: activeSession,
                playerSkills: sanitizeSkillState(playerSkills),
                inventory: serializeItemArray(inventory),
                bankItems: serializeItemArray(bankItems),
                equipment: serializeEquipmentState(),
                userItemPrefs: sanitizeUserItemPrefs(userItemPrefs),
                contentGrants: cloneContentGrantState(),
                profile: serializePlayerProfile(),
                appearance: window.playerAppearanceState
                    ? {
                        gender: window.playerAppearanceState.gender === 1 ? 1 : 0,
                        colors: Array.isArray(window.playerAppearanceState.colors)
                            ? window.playerAppearanceState.colors.slice(0, 5)
                            : [0, 0, 0, 0, 0]
                    }
                    : null
            });
        }

        function saveProgressToStorage(reason = 'manual') {
            if (!canUseProgressStorage()) return { ok: false, reason: 'storage_unavailable' };
            try {
                const payload = buildProgressPayload(reason);
                if (!payload) return { ok: false, reason: 'session_unavailable' };
                return gameSessionRuntime.saveProgressPayloadToStorage({
                    storage: window.localStorage,
                    storageKey: PROGRESS_SAVE_KEY,
                    payload
                });
            } catch (error) {
                console.warn('Progress save failed', error);
                return { ok: false, reason: 'save_failed', error };
            }
        }

        function loadProgressFromStorage() {
            if (!canUseProgressStorage()) return { loaded: false, reason: 'storage_unavailable' };
            const activeSession = getGameSession();
            if (!activeSession || !gameSessionRuntime || typeof gameSessionRuntime.loadProgressPayloadFromStorage !== 'function') {
                return { loaded: false, reason: 'session_unavailable' };
            }

            const loaded = gameSessionRuntime.loadProgressPayloadFromStorage({
                storage: window.localStorage,
                storageKey: PROGRESS_SAVE_KEY,
                currentVersion: PROGRESS_SAVE_VERSION
            });
            if (!loaded.loaded || !loaded.payload) return loaded;

            const state = loaded.payload.state;
            const savedPlayerState = state.playerState && typeof state.playerState === 'object' ? state.playerState : {};
            const loadedWorldId = typeof state.worldId === 'string' && state.worldId
                ? state.worldId
                : activeSession.currentWorldId;

            const safeX = Number.isFinite(savedPlayerState.x) ? Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(savedPlayerState.x))) : playerState.x;
            const safeY = Number.isFinite(savedPlayerState.y) ? Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(savedPlayerState.y))) : playerState.y;
            const safeZ = Number.isFinite(savedPlayerState.z) ? Math.max(0, Math.min(PLANES - 1, Math.floor(savedPlayerState.z))) : playerState.z;

            activeSession.currentWorldId = loadedWorldId;
            activeSession.runtime.currentWorldId = loadedWorldId;
            playerState.x = safeX;
            playerState.y = safeY;
            playerState.z = safeZ;
            playerState.prevX = safeX;
            playerState.prevY = safeY;
            playerState.targetX = safeX;
            playerState.targetY = safeY;
            playerState.path = [];
            playerState.pendingSkillStart = null;
            playerState.pendingActionAfterTurn = null;
            playerState.turnLock = false;
            playerState.actionVisualReady = true;
            playerState.action = 'IDLE';
            playerState.targetObj = null;
            playerState.targetUid = null;
            playerState.targetRotation = Number.isFinite(savedPlayerState.targetRotation)
                ? savedPlayerState.targetRotation
                : playerState.targetRotation;
            playerSkills = sanitizeSkillState(state.playerSkills);
            const loadedCombatDefaults = combatRuntime && typeof combatRuntime.buildPlayerCombatDefaults === 'function'
                ? combatRuntime.buildPlayerCombatDefaults(playerSkills)
                : createFallbackCombatPlayerState(10);
            playerState.currentHitpoints = Number.isFinite(savedPlayerState.currentHitpoints)
                ? Math.max(0, Math.min(loadedCombatDefaults.currentHitpoints, Math.floor(savedPlayerState.currentHitpoints)))
                : Math.max(0, Math.min(loadedCombatDefaults.currentHitpoints, playerState.currentHitpoints));
            const loadedEatingCooldownEndTick = Number.isFinite(savedPlayerState.eatingCooldownEndTick)
                ? Math.max(0, Math.floor(savedPlayerState.eatingCooldownEndTick))
                : loadedCombatDefaults.eatingCooldownEndTick;
            // Save payloads persisted an absolute cooldown tick while runtime ticks always restart at 0.
            // Clamp old/stale values so reloads cannot lock eating for hundreds or thousands of ticks.
            playerState.eatingCooldownEndTick = loadedEatingCooldownEndTick > (currentTick + MAX_PERSISTED_EAT_COOLDOWN_TICKS)
                ? loadedCombatDefaults.eatingCooldownEndTick
                : loadedEatingCooldownEndTick;
            playerState.lastAttackTick = Number.isFinite(savedPlayerState.lastAttackTick)
                ? Math.floor(savedPlayerState.lastAttackTick)
                : loadedCombatDefaults.lastAttackTick;
            playerState.lastCastTick = Number.isFinite(savedPlayerState.lastCastTick)
                ? Math.floor(savedPlayerState.lastCastTick)
                : loadedCombatDefaults.lastCastTick;
            playerState.remainingAttackCooldown = Number.isFinite(savedPlayerState.remainingAttackCooldown)
                ? Math.max(0, Math.floor(savedPlayerState.remainingAttackCooldown))
                : loadedCombatDefaults.remainingAttackCooldown;
            playerState.lockedTargetId = typeof savedPlayerState.lockedTargetId === 'string' ? savedPlayerState.lockedTargetId : null;
            playerState.combatTargetKind = savedPlayerState.combatTargetKind === 'enemy' ? 'enemy' : null;
            playerState.selectedMeleeStyle = savedPlayerState.selectedMeleeStyle === 'strength' || savedPlayerState.selectedMeleeStyle === 'defense'
                ? savedPlayerState.selectedMeleeStyle
                : loadedCombatDefaults.selectedMeleeStyle;
            playerState.autoRetaliateEnabled = savedPlayerState.autoRetaliateEnabled !== false;
            playerState.inCombat = !!savedPlayerState.inCombat;
            playerState.lastDamagerEnemyId = typeof savedPlayerState.lastDamagerEnemyId === 'string'
                ? savedPlayerState.lastDamagerEnemyId
                : null;
            playerState.unlockFlags = gameSessionRuntime.sanitizeUnlockFlags(savedPlayerState.unlockFlags, DEFAULT_UNLOCK_FLAGS);
            playerState.merchantProgress = gameSessionRuntime.sanitizeMerchantProgress(savedPlayerState.merchantProgress);
            inventory = deserializeItemArray(state.inventory, 28);
            bankItems = deserializeItemArray(state.bankItems, 200);
            equipment = deserializeEquipmentState(state.equipment);
            userItemPrefs = sanitizeUserItemPrefs(state.userItemPrefs);
            progressContentGrants = sanitizeContentGrantState(state.contentGrants);
            isRunning = !!state.runMode;
            const hasSavedProfile = !!(state.profile && typeof state.profile === 'object');
            playerProfileState = sanitizePlayerProfile(state.profile, { allowLegacyFallback: true });
            selectedUse.invIndex = null;
            selectedUse.itemId = null;

            const appearance = sanitizeAppearanceState(state.appearance);
            if (appearance && window.playerAppearanceState) {
                window.playerAppearanceState.gender = appearance.gender;
                window.playerAppearanceState.colors = appearance.colors.slice();
            }

            syncGameSessionState();
            return { loaded: true, savedAt: loaded.payload.savedAt, legacyProfile: !hasSavedProfile };
        }

        function clearProgressFromStorage(options = {}) {
            if (!canUseProgressStorage()) return { ok: false, reason: 'storage_unavailable' };
            const clearPoseEditor = !!options.clearPoseEditor;
            try {
                window.localStorage.removeItem(PROGRESS_SAVE_KEY);
                if (clearPoseEditor) window.localStorage.removeItem('poseEditor.v1');
                return { ok: true, clearedPoseEditor: clearPoseEditor };
            } catch (error) {
                console.warn('Progress save clear failed', error);
                return { ok: false, reason: 'clear_failed', error };
            }
        }

        function shouldConsumeFreshSessionParam(paramValue) {
            if (paramValue === null || paramValue === undefined) return false;
            if (paramValue === '') return true;
            const normalized = String(paramValue).trim().toLowerCase();
            return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y';
        }

        function consumeFreshSessionRequest() {
            if (typeof window === 'undefined' || !window.location || typeof URLSearchParams !== 'function') return false;
            const params = new URLSearchParams(window.location.search || '');
            const requested = ['fresh', 'resetProgress', 'clearSave'].some((key) => shouldConsumeFreshSessionParam(params.get(key)));
            if (!requested) return false;

            clearProgressFromStorage({ clearPoseEditor: true });

            ['fresh', 'resetProgress', 'clearSave'].forEach((key) => params.delete(key));
            if (window.history && typeof window.history.replaceState === 'function') {
                const nextQuery = params.toString();
                const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
                window.history.replaceState({}, document.title, nextUrl);
            }
            return true;
        }

        function startProgressAutosave() {
            if (progressAutosaveHandle) clearInterval(progressAutosaveHandle);
            progressAutosaveHandle = setInterval(() => {
                saveProgressToStorage('autosave');
            }, PROGRESS_AUTOSAVE_INTERVAL_MS);
        }

        function ensureProgressPersistenceLifecycle() {
            if (playerEntryFlowState.sessionActivated) return;
            playerEntryFlowState.sessionActivated = true;
            startProgressAutosave();
            if (!playerEntryFlowState.unloadSaveHooksRegistered) {
                window.addEventListener('beforeunload', () => saveProgressToStorage('beforeunload'));
                window.addEventListener('pagehide', () => saveProgressToStorage('pagehide'));
                playerEntryFlowState.unloadSaveHooksRegistered = true;
            }
        }

        window.clearProgressSave = function clearProgressSave(options = {}) {
            const result = clearProgressFromStorage(options);
            if (result && result.ok && options && options.reload && window.location) {
                window.location.reload();
            }
            return result;
        };
        window.startFreshSession = function startFreshSession() {
            const result = clearProgressFromStorage({ clearPoseEditor: true });
            if (result && result.ok && window.location) window.location.reload();
            return result;
        };

        // Temporary interaction diagnostics for QA flows.
        if (!gameSessionRuntime && typeof window.DEBUG_COOKING_USE === 'undefined') window.DEBUG_COOKING_USE = false;
        if (!gameSessionRuntime && typeof window.QA_COMBAT_DEBUG === 'undefined') window.QA_COMBAT_DEBUG = false;
        if (!gameSessionRuntime && typeof window.QA_PIER_DEBUG === 'undefined') window.QA_PIER_DEBUG = false;

        // UI Elements
        const contextMenuEl = document.getElementById('context-menu');
        const contextOptionsListEl = document.getElementById('context-options-list');

        contextMenuEl.addEventListener('mouseleave', (e) => {
            const related = e ? e.relatedTarget : null;
            if (related && related.closest && related.closest('.context-submenu')) return;
            closeContextMenu();
        });

        function showContextMenuAt(clientX, clientY) {
            contextMenuEl.classList.remove('hidden');
            contextMenuEl.style.left = '0px';
            contextMenuEl.style.top = '0px';

            const menuW = contextMenuEl.offsetWidth || 160;
            const menuH = contextMenuEl.offsetHeight || 120;
            const pad = 8;

            // Cap context-menu depth so it never drops below the midpoint of the lowest visible inventory row.
            // This keeps bottom-row inventory interactions clear for swap-left-click submenu usage.
            const getLowestAllowedTop = () => {
                const invSlots = Array.from(document.querySelectorAll('#view-inv .inventory-slot'));
                let lowestMidY = null;
                for (let i = 0; i < invSlots.length; i++) {
                    const rect = invSlots[i].getBoundingClientRect();
                    if (!rect || rect.width <= 0 || rect.height <= 0) continue;
                    const midY = rect.top + (rect.height * 0.5);
                    if (lowestMidY === null || midY > lowestMidY) lowestMidY = midY;
                }
                if (lowestMidY === null) return window.innerHeight - menuH - pad;
                return Math.max(pad, Math.floor(lowestMidY - menuH));
            };

            let x = clientX;
            let y = clientY;
            if (x + menuW > window.innerWidth - pad) x = window.innerWidth - menuW - pad;
            if (y + menuH > window.innerHeight - pad) y = window.innerHeight - menuH - pad;
            y = Math.min(y, getLowestAllowedTop());
            if (x < pad) x = pad;
            if (y < pad) y = pad;

            contextMenuEl.style.left = x + 'px';
            contextMenuEl.style.top = y + 'px';
        }

        function promptAmount(callback) {
            const modal = document.getElementById('amount-modal');
            const input = document.getElementById('amount-input');
            const btnOk = document.getElementById('amount-ok');
            const btnCancel = document.getElementById('amount-cancel');
            
            modal.classList.remove('hidden');
            input.value = '';
            input.focus();

            const cleanup = () => {
                modal.classList.add('hidden');
                btnOk.onclick = null;
                btnCancel.onclick = null;
                input.onkeydown = null;
            };

            btnOk.onclick = () => {
                const val = parseInt(input.value, 10);
                cleanup();
                if (!isNaN(val) && val > 0) callback(val);
            };
            btnCancel.onclick = cleanup;
            input.onkeydown = (e) => {
                if (e.key === 'Enter') btnOk.onclick();
                if (e.key === 'Escape') btnCancel.onclick();
            };
        }
        function addChatMessage(message, type = 'game') {
            const logEl = document.getElementById('chat-log');
            if (!logEl) return;

            const line = document.createElement('div');
            line.className = `chat-line ${type}`;

            const prefix = document.createElement('span');
            prefix.className = 'chat-prefix';
            prefix.innerText = type === 'info' ? '[Info]' : (type === 'warn' ? '[Warn]' : '[Game]');

            const body = document.createElement('span');
            body.innerText = message;

            line.appendChild(prefix);
            line.appendChild(body);
            logEl.appendChild(line);

            while (logEl.children.length > 120) {
                logEl.removeChild(logEl.firstChild);
            }

            logEl.scrollTop = logEl.scrollHeight;
        }

        function getChatLogCopyText() {
            const logEl = document.getElementById('chat-log');
            if (!logEl) return '';
            const lines = Array.from(logEl.children)
                .map((node) => (node && node.innerText ? node.innerText.trim() : ''))
                .filter(Boolean);
            return lines.join('\n');
        }

        async function copyChatLogTextToClipboard() {
            const chatText = getChatLogCopyText();
            if (!chatText) {
                addChatMessage('Chat log is empty.', 'warn');
                return false;
            }

            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                try {
                    await navigator.clipboard.writeText(chatText);
                    addChatMessage(`Copied ${chatText.split('\n').length} chat line(s).`, 'info');
                    return true;
                } catch (error) {
                    // Fall through to legacy copy path.
                }
            }

            const fallbackInput = document.createElement('textarea');
            fallbackInput.value = chatText;
            fallbackInput.setAttribute('readonly', 'readonly');
            fallbackInput.style.position = 'fixed';
            fallbackInput.style.left = '-9999px';
            fallbackInput.style.opacity = '0';
            document.body.appendChild(fallbackInput);
            fallbackInput.focus();
            fallbackInput.select();

            let copied = false;
            try {
                copied = document.execCommand('copy');
            } catch (error) {
                copied = false;
            }

            document.body.removeChild(fallbackInput);
            if (copied) {
                addChatMessage(`Copied ${chatText.split('\n').length} chat line(s).`, 'info');
                return true;
            }

            addChatMessage('Copy failed. Select chat text and press Ctrl+C.', 'warn');
            return false;
        }

        function setChatBoxExpanded(expanded) {
            const chatBox = document.getElementById('chat-box');
            const expandBtn = document.getElementById('chat-expand-toggle');
            if (!chatBox || !expandBtn) return;
            const shouldExpand = !!expanded;
            chatBox.classList.toggle('chat-expanded', shouldExpand);
            expandBtn.innerText = shouldExpand ? 'Collapse' : 'Expand';
            expandBtn.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');
            try {
                if (window.localStorage) window.localStorage.setItem('osrsClone.chatExpanded', shouldExpand ? '1' : '0');
            } catch (error) {
                // Ignore persistence failures in private mode or restricted contexts.
            }
        }

        function initChatControls() {
            const chatBox = document.getElementById('chat-box');
            if (!chatBox) return;
            const copyBtn = document.getElementById('chat-copy-btn');
            const expandBtn = document.getElementById('chat-expand-toggle');

            let savedExpanded = false;
            try {
                savedExpanded = !!(window.localStorage && window.localStorage.getItem('osrsClone.chatExpanded') === '1');
            } catch (error) {
                savedExpanded = false;
            }
            setChatBoxExpanded(savedExpanded);

            if (copyBtn) {
                copyBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    void copyChatLogTextToClipboard();
                });
            }
            if (expandBtn) {
                expandBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    setChatBoxExpanded(!chatBox.classList.contains('chat-expanded'));
                });
            }
        }

        function showPlayerOverheadText(text, durationMs = 2800) {
            playerOverheadText.text = text;
            playerOverheadText.expiresAt = Date.now() + durationMs;
        }

        function isPlayerEntryFlowOpen() {
            return !!playerEntryFlowState.isOpen;
        }

        function clearMovementKeys() {
            const keyIds = Object.keys(keys);
            for (let i = 0; i < keyIds.length; i++) keys[keyIds[i]] = false;
        }

        function setPlayerEntryFlowOpen(isOpen) {
            const overlay = document.getElementById('player-entry-overlay');
            if (!overlay) return;

            playerEntryFlowState.isOpen = !!isOpen;
            overlay.classList.toggle('hidden', !isOpen);
            document.body.classList.toggle('player-entry-open', !!isOpen);

            if (!isOpen) return;

            clearMovementKeys();
            playerState.path = [];
            playerState.targetX = playerState.x;
            playerState.targetY = playerState.y;
            playerState.pendingSkillStart = null;
            playerState.pendingActionAfterTurn = null;
            playerState.turnLock = false;
            playerState.actionVisualReady = true;
            playerState.action = 'IDLE';
            if (typeof closeContextMenu === 'function') closeContextMenu();
            if (typeof hideInventoryHoverTooltip === 'function') hideInventoryHoverTooltip();
            const chatInput = document.getElementById('chat-input');
            if (chatInput) chatInput.blur();
        }

        function validatePlayerEntryName() {
            const value = sanitizePlayerName(playerProfileState.name);
            if (!value) {
                return {
                    ok: false,
                    value: '',
                    message: `Choose a name with ${PLAYER_NAME_MIN_LENGTH}-${PLAYER_NAME_MAX_LENGTH} letters or numbers.`
                };
            }
            if (value.length < PLAYER_NAME_MIN_LENGTH) {
                return {
                    ok: false,
                    value,
                    message: `Name must be at least ${PLAYER_NAME_MIN_LENGTH} characters long.`
                };
            }
            return { ok: true, value, message: '' };
        }

        function unpackPlayerEntryHsl(packed) {
            const safePacked = Number.isFinite(packed) ? Math.floor(packed) : 0;
            return {
                h: (safePacked >> 10) & 63,
                s: (safePacked >> 7) & 7,
                l: safePacked & 127
            };
        }

        function playerEntryHueToRgb(p, q, t) {
            let wrapped = t;
            if (wrapped < 0) wrapped += 1;
            if (wrapped > 1) wrapped -= 1;
            if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
            if (wrapped < 1 / 2) return q;
            if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
            return p;
        }

        function packedPlayerEntryColorToCss(packed) {
            const hsl = unpackPlayerEntryHsl(packed);
            const h = hsl.h / 63;
            const s = hsl.s / 7;
            const l = hsl.l / 127;
            let r;
            let g;
            let b;
            if (s === 0) {
                r = l;
                g = l;
                b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - (l * s);
                const p = (2 * l) - q;
                r = playerEntryHueToRgb(p, q, h + (1 / 3));
                g = playerEntryHueToRgb(p, q, h);
                b = playerEntryHueToRgb(p, q, h - (1 / 3));
            }
            return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
        }

        function formatPlayerEntryTimestamp(value) {
            if (!Number.isFinite(value)) return 'unknown';
            try {
                return new Date(value).toLocaleString();
            } catch (error) {
                return 'unknown';
            }
        }

        function refreshPlayerAppearancePreview() {
            if (typeof window.rebuildPlayerRigsFromAppearance === 'function') {
                window.rebuildPlayerRigsFromAppearance();
            }
        }

        function updatePlayerEntryGenderButtons() {
            const currentGender = window.playerAppearanceState && window.playerAppearanceState.gender === 1 ? 1 : 0;
            [0, 1].forEach((gender) => {
                const button = document.getElementById(`player-entry-gender-${gender}`);
                if (!button) return;
                const active = currentGender === gender;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
        }

        function renderPlayerEntryColorRows() {
            const container = document.getElementById('player-entry-color-rows');
            if (!container) return;
            const catalog = window.PlayerAppearanceCatalog || {};
            const palettes = Array.isArray(catalog.bodyColorPalettes) ? catalog.bodyColorPalettes : [];
            if (!window.playerAppearanceState || !Array.isArray(window.playerAppearanceState.colors)) return;

            container.innerHTML = '';

            for (let paletteIndex = 0; paletteIndex < PLAYER_CREATION_COLOR_LABELS.length; paletteIndex++) {
                const row = document.createElement('div');
                row.className = 'player-entry-color-row';

                const label = document.createElement('div');
                label.className = 'player-entry-color-row-label';
                label.textContent = PLAYER_CREATION_COLOR_LABELS[paletteIndex];
                row.appendChild(label);

                const swatches = document.createElement('div');
                swatches.className = 'player-entry-color-row-swatches';

                const palette = Array.isArray(palettes[paletteIndex]) ? palettes[paletteIndex] : [];
                const activeIndex = Number.isFinite(window.playerAppearanceState.colors[paletteIndex])
                    ? Math.floor(window.playerAppearanceState.colors[paletteIndex])
                    : 0;

                for (let swatchIndex = 0; swatchIndex < palette.length; swatchIndex++) {
                    const swatchButton = document.createElement('button');
                    swatchButton.type = 'button';
                    swatchButton.className = 'player-entry-swatch';
                    if (swatchIndex === activeIndex) swatchButton.classList.add('active');
                    swatchButton.style.backgroundColor = packedPlayerEntryColorToCss(palette[swatchIndex]);
                    swatchButton.setAttribute('aria-label', `${PLAYER_CREATION_COLOR_LABELS[paletteIndex]} option ${swatchIndex + 1}`);
                    swatchButton.onclick = () => {
                        window.playerAppearanceState.colors[paletteIndex] = swatchIndex;
                        renderPlayerEntryColorRows();
                        renderPlayerEntrySummary();
                        refreshPlayerAppearancePreview();
                    };
                    swatches.appendChild(swatchButton);
                }

                row.appendChild(swatches);
                container.appendChild(row);
            }
        }

        function renderPlayerEntrySummary() {
            const summary = document.getElementById('player-entry-summary');
            if (!summary) return;
            const uiDomainRuntime = window.UiDomainRuntime || null;
            const profileSummaryViewModel = uiDomainRuntime && typeof uiDomainRuntime.buildPlayerProfileSummaryViewModel === 'function'
                ? uiDomainRuntime.buildPlayerProfileSummaryViewModel({
                    profile: playerProfileState,
                    playerEntryFlow: playerEntryFlowState,
                    playerAppearance: window.playerAppearanceState,
                    formatTimestamp: formatPlayerEntryTimestamp
                })
                : null;
            const safeName = profileSummaryViewModel ? profileSummaryViewModel.name : (sanitizePlayerName(playerProfileState.name) || 'Unnamed Adventurer');
            const catalog = window.PlayerAppearanceCatalog || {};
            const palettes = Array.isArray(catalog.bodyColorPalettes) ? catalog.bodyColorPalettes : [];
            const colors = window.playerAppearanceState && Array.isArray(window.playerAppearanceState.colors)
                ? window.playerAppearanceState.colors
                : [0, 0, 0, 0, 0];

            summary.innerHTML = '';

            const heading = document.createElement('div');
            heading.className = 'player-entry-summary-name';
            heading.textContent = safeName;
            summary.appendChild(heading);

            const bodyType = document.createElement('div');
            bodyType.className = 'player-entry-summary-meta';
            bodyType.textContent = `Body type: ${profileSummaryViewModel ? profileSummaryViewModel.bodyTypeLabel : (window.playerAppearanceState && window.playerAppearanceState.gender === 1 ? 'Female' : 'Male')}`;
            summary.appendChild(bodyType);

            const meta = document.createElement('div');
            meta.className = 'player-entry-summary-meta';
            meta.textContent = profileSummaryViewModel ? profileSummaryViewModel.statusText : 'Fresh character profile';
            summary.appendChild(meta);

            const swatchList = document.createElement('div');
            swatchList.className = 'player-entry-summary-swatches';
            for (let paletteIndex = 0; paletteIndex < PLAYER_CREATION_COLOR_LABELS.length; paletteIndex++) {
                const palette = Array.isArray(palettes[paletteIndex]) ? palettes[paletteIndex] : [];
                const activeIndex = Number.isFinite(colors[paletteIndex]) ? Math.floor(colors[paletteIndex]) : 0;
                const packed = palette[activeIndex] !== undefined ? palette[activeIndex] : 0;

                const chip = document.createElement('div');
                chip.className = 'player-entry-summary-chip';

                const colorDot = document.createElement('span');
                colorDot.className = 'player-entry-summary-chip-color';
                colorDot.style.backgroundColor = packedPlayerEntryColorToCss(packed);
                chip.appendChild(colorDot);

                const chipLabel = document.createElement('span');
                chipLabel.textContent = PLAYER_CREATION_COLOR_LABELS[paletteIndex];
                chip.appendChild(chipLabel);

                swatchList.appendChild(chip);
            }
            summary.appendChild(swatchList);
        }

        function renderPlayerEntryFlow() {
            const title = document.getElementById('player-entry-title');
            const subtitle = document.getElementById('player-entry-subtitle');
            const nameInput = document.getElementById('player-entry-name');
            const error = document.getElementById('player-entry-name-error');
            const note = document.getElementById('player-entry-secondary-note');
            const primary = document.getElementById('player-entry-primary');
            const nameValidation = validatePlayerEntryName();
            const uiDomainRuntime = window.UiDomainRuntime || null;
            const profileSummaryViewModel = uiDomainRuntime && typeof uiDomainRuntime.buildPlayerProfileSummaryViewModel === 'function'
                ? uiDomainRuntime.buildPlayerProfileSummaryViewModel({
                    profile: playerProfileState,
                    playerEntryFlow: playerEntryFlowState,
                    playerAppearance: window.playerAppearanceState,
                    formatTimestamp: formatPlayerEntryTimestamp
                })
                : null;
            const isContinueFlow = profileSummaryViewModel ? profileSummaryViewModel.isContinueFlow : (!!playerEntryFlowState.hasLoadedSave && !!playerProfileState.creationCompleted);

            if (title) title.textContent = profileSummaryViewModel ? profileSummaryViewModel.titleText : (isContinueFlow ? 'Continue Your Adventure' : 'Create Your Adventurer');
            if (subtitle) subtitle.textContent = profileSummaryViewModel ? profileSummaryViewModel.subtitleText : 'Choose a starter identity before the prototype lets you into the world.';

            if (nameInput) {
                if (document.activeElement !== nameInput && nameInput.value !== playerProfileState.name) {
                    nameInput.value = playerProfileState.name;
                }
                nameInput.placeholder = PLAYER_PROFILE_DEFAULT_NAME;
            }
            if (error) error.textContent = nameValidation.ok ? '' : nameValidation.message;
            if (primary) {
                primary.textContent = profileSummaryViewModel ? profileSummaryViewModel.primaryActionText : (isContinueFlow ? 'Continue Adventure' : 'Start Adventure');
                primary.disabled = !nameValidation.ok;
            }
            if (note) note.textContent = profileSummaryViewModel ? profileSummaryViewModel.noteText : 'Progress will begin autosaving locally in this browser once you enter the world.';

            updatePlayerEntryGenderButtons();
            renderPlayerEntryColorRows();
            renderPlayerEntrySummary();
        }

        function completePlayerEntryFlow() {
            const nameValidation = validatePlayerEntryName();
            if (!nameValidation.ok) {
                renderPlayerEntryFlow();
                const nameInput = document.getElementById('player-entry-name');
                if (nameInput) nameInput.focus();
                return;
            }

            playerProfileState.name = nameValidation.value;
            playerProfileState.creationCompleted = true;
            if (!playerProfileState.createdAt) playerProfileState.createdAt = Date.now();
            playerProfileState.lastStartedAt = Date.now();

            setPlayerEntryFlowOpen(false);
            ensureProgressPersistenceLifecycle();

            const isReturning = !!playerEntryFlowState.hasLoadedSave;
            addChatMessage(isReturning ? `Welcome back, ${playerProfileState.name}.` : `Welcome, ${playerProfileState.name}.`, 'game');
            addChatMessage('Tip: Left-click to move. Right-click for actions.', 'info');
            addChatMessage('QA loadouts: type /qa help in chat.', 'info');

            if (isReturning) {
                addChatMessage('Loaded saved progress from your previous session.', 'info');
                if (playerEntryFlowState.saveWasLegacyProfile) {
                    addChatMessage('Legacy save profile upgraded automatically.', 'info');
                }
            } else if (playerEntryFlowState.loadReason === 'parse_failed' || playerEntryFlowState.loadReason === 'invalid_payload') {
                addChatMessage('Save data was invalid and has been ignored; starting with defaults.', 'warn');
            }

            saveProgressToStorage(isReturning ? 'continue_session' : 'player_creation_complete');
        }

        function initPlayerEntryFlow(loadProgressResult) {
            const overlay = document.getElementById('player-entry-overlay');
            if (!overlay) {
                ensureProgressPersistenceLifecycle();
                return;
            }

            playerEntryFlowState.hasLoadedSave = !!(loadProgressResult && loadProgressResult.loaded);
            playerEntryFlowState.saveWasLegacyProfile = !!(loadProgressResult && loadProgressResult.legacyProfile);
            playerEntryFlowState.loadReason = loadProgressResult && loadProgressResult.reason
                ? loadProgressResult.reason
                : 'startup';
            playerEntryFlowState.savedAt = loadProgressResult && Number.isFinite(loadProgressResult.savedAt)
                ? loadProgressResult.savedAt
                : null;

            if (playerEntryFlowState.hasLoadedSave && !playerProfileState.name) {
                playerProfileState.name = PLAYER_PROFILE_DEFAULT_NAME;
            }

            if (!playerEntryFlowState.uiBound) {
                const nameInput = document.getElementById('player-entry-name');
                const primaryButton = document.getElementById('player-entry-primary');
                const maleButton = document.getElementById('player-entry-gender-0');
                const femaleButton = document.getElementById('player-entry-gender-1');

                if (nameInput) {
                    nameInput.addEventListener('input', () => {
                        const sanitized = sanitizePlayerName(nameInput.value);
                        if (nameInput.value !== sanitized) nameInput.value = sanitized;
                        playerProfileState.name = sanitized;
                        renderPlayerEntryFlow();
                    });
                    nameInput.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            completePlayerEntryFlow();
                        }
                    });
                }

                if (maleButton) {
                    maleButton.addEventListener('click', () => {
                        if (!window.playerAppearanceState) return;
                        window.playerAppearanceState.gender = 0;
                        renderPlayerEntryFlow();
                        refreshPlayerAppearancePreview();
                    });
                }

                if (femaleButton) {
                    femaleButton.addEventListener('click', () => {
                        if (!window.playerAppearanceState) return;
                        window.playerAppearanceState.gender = 1;
                        renderPlayerEntryFlow();
                        refreshPlayerAppearancePreview();
                    });
                }

                if (primaryButton) primaryButton.addEventListener('click', completePlayerEntryFlow);

                playerEntryFlowState.uiBound = true;
            }

            const shouldBlockBehindEntryFlow =
                !playerEntryFlowState.hasLoadedSave ||
                !playerProfileState.creationCompleted ||
                playerEntryFlowState.saveWasLegacyProfile ||
                playerEntryFlowState.loadReason === 'parse_failed' ||
                playerEntryFlowState.loadReason === 'invalid_payload';

            renderPlayerEntryFlow();
            if (!shouldBlockBehindEntryFlow) {
                setPlayerEntryFlowOpen(false);
                playerProfileState.lastStartedAt = Date.now();
                ensureProgressPersistenceLifecycle();
                addChatMessage(`Welcome back, ${playerProfileState.name}.`, 'game');
                addChatMessage('Loaded saved progress from your previous session.', 'info');
                saveProgressToStorage('auto_resume_session');
                return;
            }

            setPlayerEntryFlowOpen(true);

            const nameInput = document.getElementById('player-entry-name');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }

        function sendChatMessage(rawText) {
            const text = (rawText || '').trim();
            if (!text) return;

            if (text.toLowerCase().startsWith('/qa ')) {
                const args = text.slice(4).trim();
                const parts = args.split(/\s+/).filter(Boolean);
                const cmd = (parts[0] || '').toLowerCase();

                if (cmd === 'help' || !cmd) {
                    addChatMessage('QA presets: /qa fish_full, /qa fish_rod, /qa fish_harpoon, /qa fish_rune, /qa wc_full, /qa mining_full, /qa rc_full, /qa rc_combo, /qa rc_routes, /qa fm_full, /qa smith_smelt, /qa smith_forge, /qa smith_jewelry, /qa smith_full, /qa smith_fullinv, /qa icons, /qa default', 'info');
                    addChatMessage('QA tools: /qa worlds, /qa travel <worldId>, /qa setlevel <fishing|mining|runecrafting|smithing> <1-99>, /qa diag <fishing|mining|rc|shop>, /qa shopdiag [merchantId], /qa openshop <merchantId>, /qa fishspots, /qa fishshops, /qa cookspots, /qa gotofish <pond|pier|deep>, /qa gotocook <camp|river|dock|deep>, /qa gotofishshop <teacher|supplier>, /qa gotomerchant <merchantId|alias>, /qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>, /qa altars, /qa gotoaltar <ember|water|earth|air>, /qa rcdebug <on|off>, /qa pierdebug <on|off>, /qa combatdebug [on|off|now|clears|clearreset]', 'info');
                    addChatMessage(formatQaOpenShopUsage(), 'info');
                    return;
                }
                if (cmd === 'worlds') {
                    qaListWorlds();
                    return;
                }
                if (cmd === 'travel' && parts.length >= 2) {
                    const target = parts.slice(1).join(' ');
                    const ok = qaTravelWorld(target);
                    if (!ok) addChatMessage('Usage: /qa travel <worldId>', 'warn');
                    return;
                }

                if (cmd === 'setlevel' && parts.length >= 3) {
                    const skill = String(parts[1] || '').toLowerCase();
                    const lvl = parseInt(parts[2], 10);
                    if (!Number.isFinite(lvl)) {
                        addChatMessage('Usage: /qa setlevel <fishing|mining|runecrafting|smithing> <1-99>', 'warn');
                        return;
                    }
                    const ok = setQaSkillLevel(skill, lvl);
                    if (!ok) {
                        addChatMessage('Unknown skill for /qa setlevel. Use fishing, mining, runecrafting, or smithing.', 'warn');
                        return;
                    }
                    addChatMessage(`QA set level: ${skill}=${Math.max(1, Math.min(99, Math.floor(lvl)))}`, 'info');
                    return;
                }

                if (cmd === 'unlock' && parts.length >= 3) {
                    const subject = String(parts[1] || '').toLowerCase();
                    const value = String(parts[2] || '').toLowerCase();
                    if (subject !== 'combo' && subject !== 'gemmine' && subject !== 'gem_mine' && subject !== 'mould' && subject !== 'moulds' && subject !== 'ringmould' && subject !== 'amuletmould' && subject !== 'tiaramould') {
                        addChatMessage('Usage: /qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>', 'warn');
                        return;
                    }
                    if (value !== 'on' && value !== 'off') {
                        addChatMessage('Usage: /qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>', 'warn');
                        return;
                    }
                    if (subject === 'combo') {
                        setQaUnlockFlag('runecraftingComboUnlocked', value === 'on');
                        addChatMessage('QA combo unlock: ' + value, 'info');
                        return;
                    }
                    if (subject === 'gemmine' || subject === 'gem_mine') {
                        setQaUnlockFlag('gemMineUnlocked', value === 'on');
                        addChatMessage('QA gem mine unlock: ' + value, 'info');
                        return;
                    }
                    if (subject === 'mould' || subject === 'moulds') {
                        const enabled = value === 'on';
                        setQaUnlockFlag('ringMouldUnlocked', enabled);
                        setQaUnlockFlag('amuletMouldUnlocked', enabled);
                        setQaUnlockFlag('tiaraMouldUnlocked', enabled);
                        addChatMessage('QA mould unlocks: ' + value, 'info');
                        return;
                    }
                    if (subject === 'ringmould') {
                        setQaUnlockFlag('ringMouldUnlocked', value === 'on');
                        addChatMessage('QA ring mould unlock: ' + value, 'info');
                        return;
                    }
                    if (subject === 'amuletmould') {
                        setQaUnlockFlag('amuletMouldUnlocked', value === 'on');
                        addChatMessage('QA amulet mould unlock: ' + value, 'info');
                        return;
                    }
                    setQaUnlockFlag('tiaraMouldUnlocked', value === 'on');
                    addChatMessage('QA tiara mould unlock: ' + value, 'info');
                    return;
                }

                if (cmd === 'altars') {
                    qaListAltars();
                    return;
                }
                if (cmd === 'fishspots') {
                    qaListFishingSpots();
                    return;
                }
                if (cmd === 'fishshops') {
                    qaListFishingMerchants();
                    return;
                }
                if (cmd === 'cookspots') {
                    qaListCookingSpots();
                    return;
                }

                
                if (cmd === 'gotofish' && parts.length >= 2) {
                    const target = String(parts[1] || '').toLowerCase();
                    const ok = qaGotoFishingSpot(target);
                    if (!ok) addChatMessage('Usage: /qa gotofish <pond|pier|deep>', 'warn');
                    return;
                }
                if (cmd === 'gotocook' && parts.length >= 2) {
                    const target = String(parts[1] || '').toLowerCase();
                    const ok = qaGotoCookingSpot(target);
                    if (!ok) addChatMessage('Usage: /qa gotocook <camp|river|dock|deep>', 'warn');
                    return;
                }

                if (cmd === 'gotofishshop' && parts.length >= 2) {
                    const target = String(parts[1] || '').toLowerCase();
                    const ok = qaGotoFishingMerchant(target);
                    if (!ok) addChatMessage('Usage: /qa gotofishshop <teacher|supplier>', 'warn');
                    return;
                }
                

                if (cmd === 'gotomerchant' && parts.length >= 2) {
                    const target = String(parts[1] || '').toLowerCase();
                    const ok = qaGotoMerchant(target);
                    if (!ok) addChatMessage('Usage: /qa gotomerchant <merchantId|alias>', 'warn');
                    return;
                }


                if (cmd === 'gotoaltar' && parts.length >= 2) {
                    const target = String(parts[1] || '').toLowerCase();
                    const ok = qaGotoAltar(target);
                    if (!ok) addChatMessage('Usage: /qa gotoaltar <ember|water|earth|air>', 'warn');
                    return;
                }

                if (cmd === 'rcdebug' && parts.length >= 2) {
                    const value = String(parts[1] || '').toLowerCase();
                    if (value !== 'on' && value !== 'off') {
                        addChatMessage('Usage: /qa rcdebug <on|off>', 'warn');
                        return;
                    }
                    window.QA_RC_DEBUG = (value === 'on');
                    addChatMessage(`QA rcdebug: ${value}`, 'info');
                    return;
                }
                if (cmd === 'pierdebug' && parts.length >= 2) {
                    const value = String(parts[1] || '').toLowerCase();
                    if (value !== 'on' && value !== 'off') {
                        addChatMessage('Usage: /qa pierdebug <on|off>', 'warn');
                        return;
                    }
                    window.QA_PIER_DEBUG = (value === 'on');
                    addChatMessage(`QA pierdebug: ${value}`, 'info');
                    return;
                }
                if (cmd === 'combatdebug') {
                    const value = String(parts[1] || 'now').toLowerCase();
                    if (value === 'now') {
                        if (typeof window.emitQaCombatDebugSnapshot === 'function') {
                            window.emitQaCombatDebugSnapshot('manual');
                        } else {
                            addChatMessage('QA combatdebug unavailable: missing combat snapshot helper.', 'warn');
                        }
                        return;
                    }
                    if (value === 'clears') {
                        if (typeof window.emitQaCombatDebugClearHistory === 'function') {
                            window.emitQaCombatDebugClearHistory();
                        } else {
                            addChatMessage('QA combatdebug clear-history unavailable.', 'warn');
                        }
                        return;
                    }
                    if (value === 'clearreset') {
                        window.__qaCombatDebugClearEvents = [];
                        addChatMessage('QA combatdebug clear-history reset.', 'info');
                        return;
                    }
                    if (value !== 'on' && value !== 'off') {
                        addChatMessage('Usage: /qa combatdebug [on|off|now|clears|clearreset]', 'warn');
                        return;
                    }
                    window.QA_COMBAT_DEBUG = (value === 'on');
                    window.__qaCombatDebugLastSignature = null;
                    window.__qaCombatDebugLastEmitTick = null;
                    addChatMessage(`QA combatdebug: ${value}`, 'info');
                    if (value === 'on' && typeof window.emitQaCombatDebugSnapshot === 'function') {
                        window.emitQaCombatDebugSnapshot('watch-on');
                    }
                    return;
                }
                if (cmd === 'shopdiag') {
                    qaDiagShop(parts[1]);
                    return;
                }

                if (cmd === 'openshop') {
                    const merchantId = String(parts[1] || '').toLowerCase();
                    const qaOpenableMerchants = getQaOpenableMerchantIds();
                    if (!qaOpenableMerchants.includes(merchantId)) {
                        addChatMessage(formatQaOpenShopUsage(), 'warn');
                        return;
                    }
                    if (typeof window.openShopForMerchant !== 'function') {
                        addChatMessage('QA openshop unavailable: merchant shop handler missing.', 'warn');
                        return;
                    }
                    window.openShopForMerchant(merchantId);
                    addChatMessage('QA opened shop for merchant=' + merchantId, 'info');
                    return;
                }
                if (cmd === 'diag' && parts.length >= 2) {
                    const subject = String(parts[1] || '').toLowerCase();
                    if (subject === 'fishing' || subject === 'fish') {
                        qaDiagFishing();
                        return;
                    }
                    if (subject === 'mining') {
                        qaDiagMining();
                        return;
                    }
                    if (subject === 'rc' || subject === 'runecrafting') {
                        qaDiagRunecrafting();
                        return;
                    }
                    if (subject === 'shop') {
                        qaDiagShop(parts[2]);
                        return;
                    }
                    addChatMessage('Usage: /qa diag <fishing|mining|rc|shop>', 'warn');
                    return;
                }

                const applied = applyQaInventoryPreset(args);
                if (!applied) {
                    addChatMessage(`Unknown QA preset/command: ${args}. Use /qa help`, 'warn');
                }
                return;
            }

            addChatMessage(text, 'game');
            showPlayerOverheadText(text);
        }

        function initChatInput() {
            const input = document.getElementById('chat-input');
            if (!input) return;

            input.addEventListener('keydown', (e) => {
                if (isPlayerEntryFlowOpen()) {
                    e.preventDefault();
                    input.blur();
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendChatMessage(input.value);
                    input.value = '';
                } else if (e.key === 'Escape') {
                    input.blur();
                }
            });

            window.addEventListener('keydown', (e) => {
                if (!input) return;
                if (e.target && e.target.id === 'chat-input') return;
                if (isPlayerEntryFlowOpen()) return;
                if (e.defaultPrevented) return;
                if (e.ctrlKey || e.metaKey || e.altKey) return;

                const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                if (e.target && e.target.isContentEditable) return;

                if (typeof isFreeCam !== 'undefined' && isFreeCam) {
                    const k = String(e.key || '').toLowerCase();
                    if (k === 'w' || k === 'a' || k === 's' || k === 'd' || k === 'q' || k === 'e' || k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright') {
                        return;
                    }
                }

                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.focus();
                    return;
                }

                if (typeof e.key === 'string' && e.key.length === 1) {
                    e.preventDefault();
                    input.focus();
                    input.value += e.key;
                }
            });
        }
        function getSelectedUseItem() {
            if (selectedUse.invIndex === null) return null;
            const slot = inventory[selectedUse.invIndex];
            if (!slot || slot.itemData.id !== selectedUse.itemId) {
                selectedUse.invIndex = null;
                selectedUse.itemId = null;
                return null;
            }
            return slot;
        }

        function clearSelectedUse(shouldRender = true) {
            selectedUse.invIndex = null;
            selectedUse.itemId = null;
            if (shouldRender && typeof renderInventory === 'function') renderInventory();
        }

        function selectUseItem(invIndex) {
            const slot = inventory[invIndex];
            if (!slot) return;

            if (selectedUse.invIndex === invIndex && selectedUse.itemId === slot.itemData.id) {
                clearSelectedUse();
                return;
            }

            selectedUse.invIndex = invIndex;
            selectedUse.itemId = slot.itemData.id;
            if (typeof renderInventory === 'function') renderInventory();
        }

        function startFacingAction(nextAction, startActionNow = false) {
            const resolvedRotation = (typeof window.resolveInteractionFacingRotation === 'function')
                ? window.resolveInteractionFacingRotation(
                    playerState.targetObj,
                    playerState.targetX,
                    playerState.targetY,
                    playerState.x,
                    playerState.y,
                    playerState.z
                )
                : null;
            const faceDx = playerState.targetX - playerState.x;
            const faceDy = playerState.targetY - playerState.y;

            if (!Number.isFinite(resolvedRotation) && faceDx === 0 && faceDy === 0) {
                playerState.pendingActionAfterTurn = null;
                playerState.turnLock = false;
                playerState.actionVisualReady = true;
                playerState.action = nextAction;
                return;
            }

            playerState.targetRotation = Number.isFinite(resolvedRotation)
                ? resolvedRotation
                : Math.atan2(faceDx, faceDy);
            playerState.turnLock = true;
            playerState.actionVisualReady = false;

            if (startActionNow) {
                playerState.pendingActionAfterTurn = null;
                playerState.action = nextAction;
            } else {
                playerState.pendingActionAfterTurn = nextAction;
                playerState.action = 'TURNING_TO_INTERACT';
            }
        }

        window.onload = function() {
            const forcedFreshSession = consumeFreshSessionRequest();
            const loadProgressResult = loadProgressFromStorage();
            const startupRequestedWorldId = (gameSessionRuntime && typeof gameSessionRuntime.resolveCurrentWorldId === 'function')
                ? gameSessionRuntime.resolveCurrentWorldId()
                : 'starter_town';
            const startupWorldId = (worldAdapterRuntime && typeof worldAdapterRuntime.activateWorldContext === 'function')
                ? worldAdapterRuntime.activateWorldContext(startupRequestedWorldId, 'starter_town')
                : 'starter_town';
            if (startupWorldId !== startupRequestedWorldId) {
                const fallbackSpawn = (worldAdapterRuntime && typeof worldAdapterRuntime.getWorldDefaultSpawn === 'function')
                    ? worldAdapterRuntime.getWorldDefaultSpawn(startupWorldId, {
                        mapSize: MAP_SIZE,
                        planes: PLANES
                    })
                    : DEFAULT_WORLD_SPAWN;
                playerState.x = fallbackSpawn.x;
                playerState.y = fallbackSpawn.y;
                playerState.z = fallbackSpawn.z;
                playerState.prevX = fallbackSpawn.x;
                playerState.prevY = fallbackSpawn.y;
                playerState.midX = null;
                playerState.midY = null;
                playerState.targetX = fallbackSpawn.x;
                playerState.targetY = fallbackSpawn.y;
                playerState.path = [];
                playerState.action = 'IDLE';
                playerState.targetObj = null;
                playerState.targetUid = null;
                minimapLocked = true;
                minimapTargetX = fallbackSpawn.x;
                minimapTargetY = fallbackSpawn.y;
                minimapDestination = null;
            }
            if (typeof window.initLogicalMap === 'function') window.initLogicalMap();
            if (typeof window.initThreeJS === 'function') window.initThreeJS();
            if (typeof window.build3DEnvironment === 'function') window.build3DEnvironment();
            if (typeof window.initMinimap === 'function') window.initMinimap();
            if (typeof window.initUIPreview === 'function') window.initUIPreview(); 
            initInventoryUI(); 
            initChatInput();
            initChatControls();
            if (window.AnimationStudioBridge && typeof window.AnimationStudioBridge.init === 'function') {
                window.AnimationStudioBridge.init();
            }
            initPlayerEntryFlow(loadProgressResult);
            const iconGrantResult = applyInventoryIconReviewGrant();
            if (iconGrantResult.added.length > 0 && typeof renderInventory === 'function') {
                renderInventory();
            }
            if (iconGrantResult.changed) {
                saveProgressToStorage('inventory_icon_review_grant');
            }
            if (iconGrantResult.added.length > 0) {
                addChatMessage(`Added ${iconGrantResult.added.length} active icon review item(s) to your inventory.`, 'info');
            }
            if (forcedFreshSession) {
                addChatMessage('Started with a fresh local session. Saved progress was cleared before load.', 'info');
            }
            if (iconGrantResult.blocked.length > 0) {
                addChatMessage(`Active icon review batch "${iconGrantResult.batchLabel || 'current'}" left out ${iconGrantResult.blocked.length} item(s) because your inventory is full. Clear a few slots and reload to inspect them.`, 'warn');
            }

            const worldMapPanel = document.getElementById('world-map-panel');
            const worldMapToggleBtn = document.getElementById('mapToggleBtn');
            const worldMapCloseBtn = document.getElementById('world-map-close');
            const setWorldMapOpen = (open) => {
                if (!worldMapPanel) return;
                if (open) {
                    worldMapPanel.classList.remove('hidden');
                    if (typeof window.updateWorldMapPanel === 'function') window.updateWorldMapPanel(true);
                } else {
                    worldMapPanel.classList.add('hidden');
                }
            };
            if (worldMapToggleBtn) {
                worldMapToggleBtn.addEventListener('click', () => {
                    const shouldOpen = !worldMapPanel || worldMapPanel.classList.contains('hidden');
                    setWorldMapOpen(shouldOpen);
                });
            }
            if (worldMapCloseBtn) {
                worldMapCloseBtn.addEventListener('click', () => setWorldMapOpen(false));
            }
            if (worldMapPanel) {
                worldMapPanel.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    if (e.target === worldMapPanel) setWorldMapOpen(false);
                });
            }

            // Input Listeners
            window.addEventListener('keydown', (e) => {
                if (e.target && e.target.id === 'chat-input') return;
                if (isPlayerEntryFlowOpen()) return;
                if (window.AnimationStudioBridge && typeof window.AnimationStudioBridge.isStudioActive === 'function' && window.AnimationStudioBridge.isStudioActive()) return;
                const k = e.key.toLowerCase();
                if (keys.hasOwnProperty(k)) keys[k] = true;
                if (e.key === 'Escape' && worldMapPanel && !worldMapPanel.classList.contains('hidden')) setWorldMapOpen(false);
                if (e.key === 'Escape' && isBankOpen) closeBank();
            });
            window.addEventListener('keyup', (e) => {
                if (e.target && e.target.id === 'chat-input') return;
                if (isPlayerEntryFlowOpen()) return;
                if (window.AnimationStudioBridge && typeof window.AnimationStudioBridge.isStudioActive === 'function' && window.AnimationStudioBridge.isStudioActive()) return;
                const k = e.key.toLowerCase();
                if (keys.hasOwnProperty(k)) keys[k] = false;
            });
            
            const runBtn = document.getElementById('runToggleBtn');
            const syncRunToggleButton = () => {
                if (isRunning) {
                    runBtn.title = 'Run Mode: ON'; runBtn.classList.replace('bg-gray-700', 'bg-green-600'); runBtn.classList.replace('hover:bg-gray-600', 'hover:bg-green-500');
                } else {
                    runBtn.title = 'Run Mode: OFF'; runBtn.classList.replace('bg-green-600', 'bg-gray-700'); runBtn.classList.replace('hover:bg-green-500', 'hover:bg-gray-600');
                }
            };
            syncRunToggleButton();
            runBtn.addEventListener('click', () => {
                isRunning = !isRunning;
                syncGameSessionState();
                syncRunToggleButton();
            });

            const freeCamBtn = document.getElementById('freeCamBtn');
            const freeCamInfo = document.getElementById('freeCamInfo');
            freeCamBtn.addEventListener('click', () => {
                isFreeCam = !isFreeCam;
                if (isFreeCam) {
                    freeCamBtn.innerText = 'CAM Free Cam: ON';
                    freeCamBtn.classList.replace('bg-gray-700', 'bg-blue-600');
                    freeCamBtn.classList.replace('hover:bg-gray-600', 'hover:bg-blue-500');
                    freeCamInfo.classList.remove('hidden');
                    freeCamTarget.copy(playerRig.position);
                    freeCamTarget.y += 1.0; 
                } else {
                    freeCamBtn.innerText = 'CAM Free Cam: OFF';
                    freeCamBtn.classList.replace('bg-blue-600', 'bg-gray-700');
                    freeCamBtn.classList.replace('hover:bg-blue-500', 'hover:bg-gray-600');
                    freeCamInfo.classList.add('hidden');
                }
            });

            // Close UI Menus when clicking outside
            window.addEventListener('mousedown', (e) => {
                if (window.AnimationStudioBridge && typeof window.AnimationStudioBridge.isStudioActive === 'function' && window.AnimationStudioBridge.isStudioActive()) return;
                // Only close menus if it's a left-click (ignore middle-click/camera drag or right-click)
                if (e.button !== 0) return;

                // Let context menu and swap submenu handle their own clicks
                if (e.target.closest('#context-menu') || e.target.closest('.context-submenu') || e.target.closest('#amount-modal')) return; 
                
                // If an interface is open and we click OUTSIDE of it and OUTSIDE our inventory, close it
                if (isBankOpen && !e.target.closest('#bank-interface') && !e.target.closest('#main-ui-container')) {
                    closeBank();
                }
                if (typeof isShopOpen !== 'undefined' && isShopOpen && !e.target.closest('#shop-interface') && !e.target.closest('#main-ui-container')) {
                    closeShop();
                }
            });

            setInterval(processTick, TICK_RATE_MS);
            lastTickTime = Date.now();
            frameLimiterPrev = performance.now();
            fpsSampleLast = performance.now();
            animate();
        };




