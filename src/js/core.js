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
        const TUTORIAL_WORLD_ID = 'tutorial_island';
        const MAIN_OVERWORLD_WORLD_ID = 'main_overworld';
        const TUTORIAL_EXIT_STEP = 7;
        const TUTORIAL_ACTIVE_BOUNDS = Object.freeze({
            xMin: 140,
            xMax: 255,
            yMin: 135,
            yMax: 195,
            z: 0
        });
        const TUTORIAL_RECOVERY_SPAWNS = Object.freeze([
            { x: 157, y: 157, z: 0 },
            { x: 171, y: 157, z: 0 },
            { x: 187, y: 156, z: 0 },
            { x: 205, y: 175, z: 0 },
            { x: 229, y: 183, z: 0 },
            { x: 237, y: 159, z: 0 },
            { x: 215, y: 149, z: 0 },
            { x: 200, y: 148, z: 0 }
        ]);

        // --- Game State (Logical & Terrain) ---
        let currentTick = 0;
        
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
        const coreChatRuntime = window.CoreChatRuntime || null;
        const corePlayerEntryRuntime = window.CorePlayerEntryRuntime || null;
        const coreTutorialRuntime = window.CoreTutorialRuntime || null;
        const gameSession = gameSessionRuntime && typeof gameSessionRuntime.createGameSession === 'function'
            ? gameSessionRuntime.createGameSession({
                currentWorldId: (typeof gameSessionRuntime.resolveCurrentWorldId === 'function')
                    ? gameSessionRuntime.resolveCurrentWorldId()
                    : MAIN_OVERWORLD_WORLD_ID,
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

        function buildCombatQaDebugContext() {
            return {
                windowRef: window,
                currentTick,
                playerState,
                playerRig,
                nowMs: Date.now(),
                animationBridge: window.AnimationRuntimeBridge || null,
                addChatMessage,
                getCombatHudSnapshot: () => (typeof window.getCombatHudSnapshot === 'function')
                    ? window.getCombatHudSnapshot()
                    : null,
                getCombatEnemyState: (enemyId) => (typeof window.getCombatEnemyState === 'function')
                    ? window.getCombatEnemyState(enemyId)
                    : null,
                getCombatEnemyAnimationDebugState: (enemyId, nowMs) => (typeof window.getCombatEnemyAnimationDebugState === 'function')
                    ? window.getCombatEnemyAnimationDebugState(enemyId, nowMs)
                    : null
            };
        }

        function getCombatQaDebugRuntime() {
            return window.CombatQaDebugRuntime || null;
        }

        function getQaCombatDebugSnapshot() {
            const runtime = getCombatQaDebugRuntime();
            return runtime && typeof runtime.getSnapshot === 'function'
                ? runtime.getSnapshot(buildCombatQaDebugContext())
                : { tick: Number.isFinite(currentTick) ? currentTick : 0, player: {}, animation: {}, enemy: null, pursuit: null, autoRetaliate: null, hud: null, lastEnemyAttack: null };
        }

        function getQaCombatDebugSignature(snapshot = null) {
            const runtime = getCombatQaDebugRuntime();
            return runtime && typeof runtime.getSignature === 'function'
                ? runtime.getSignature(buildCombatQaDebugContext(), snapshot)
                : '';
        }

        function emitQaCombatDebugClearHistory() {
            const runtime = getCombatQaDebugRuntime();
            if (runtime && typeof runtime.emitClearHistory === 'function') {
                runtime.emitClearHistory(buildCombatQaDebugContext());
            }
        }

        function emitQaCombatDebugSnapshot(reason = 'manual') {
            const runtime = getCombatQaDebugRuntime();
            return runtime && typeof runtime.emitSnapshot === 'function'
                ? runtime.emitSnapshot(buildCombatQaDebugContext(), reason)
                : getQaCombatDebugSnapshot();
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
            lastStartedAt: null,
            tutorialStep: 0,
            tutorialCompletedAt: null,
            tutorialBankDepositSource: null,
            tutorialBankWithdrawSource: null
        };
        let questProgressState = gameSession && gameSession.progress && gameSession.progress.quests
            ? gameSession.progress.quests
            : {};
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

        if (window.WorldMapHudRuntime && typeof window.WorldMapHudRuntime.resetMinimapState === 'function') {
            window.WorldMapHudRuntime.resetMinimapState({
                locked: true,
                targetX: DEFAULT_WORLD_SPAWN.x,
                targetY: DEFAULT_WORLD_SPAWN.y
            });
        }
        let lastVisibleChunkPlaneZ = null;
        let playerOverheadText = { text: '', expiresAt: 0 };
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

        const ASSET_VERSION_TAG = "20260317l";
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
                itemIds: itemIds.length > 0 ? itemIds : fallbackItemIds,
                replaceInventory: !!(catalog && catalog.replaceInventory)
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

        function getInventoryItemCount(itemId) {
            const safeItemId = sanitizeItemId(itemId);
            if (!safeItemId) return 0;
            return inventory.reduce((sum, slot) => {
                if (!slot || !slot.itemData || slot.itemData.id !== safeItemId) return sum;
                return sum + (Number.isFinite(slot.amount) ? Math.max(0, Math.floor(slot.amount)) : 0);
            }, 0);
        }

        function grantInventoryItem(itemId, amount = 1) {
            const safeItemId = sanitizeItemId(itemId);
            const itemData = safeItemId ? ITEM_DB[safeItemId] : null;
            if (!itemData) return 0;
            const requestedAmount = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;

            if (itemData.stackable) {
                const existingIdx = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.id === safeItemId);
                if (existingIdx !== -1) {
                    inventory[existingIdx].amount += requestedAmount;
                    syncGameSessionState();
                    if (typeof renderInventory === 'function') renderInventory();
                    return requestedAmount;
                }
                const emptyIdx = inventory.indexOf(null);
                if (emptyIdx === -1) return 0;
                inventory[emptyIdx] = { itemData, amount: requestedAmount };
                syncGameSessionState();
                if (typeof renderInventory === 'function') renderInventory();
                return requestedAmount;
            }

            let given = 0;
            for (let i = 0; i < requestedAmount; i++) {
                const emptyIdx = inventory.indexOf(null);
                if (emptyIdx === -1) break;
                inventory[emptyIdx] = { itemData, amount: 1 };
                given++;
            }
            if (given > 0) {
                syncGameSessionState();
                if (typeof renderInventory === 'function') renderInventory();
            }
            return given;
        }

        function isTutorialWorldActive() {
            const currentWorldId = (gameSessionRuntime && typeof gameSessionRuntime.resolveCurrentWorldId === 'function')
                ? gameSessionRuntime.resolveCurrentWorldId()
                : ((window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getCurrentWorldId === 'function')
                    ? window.WorldBootstrapRuntime.getCurrentWorldId()
                    : '');
            return currentWorldId === TUTORIAL_WORLD_ID;
        }

        function getTutorialStep() {
            if (coreTutorialRuntime && typeof coreTutorialRuntime.getStep === 'function') {
                return coreTutorialRuntime.getStep(buildTutorialRuntimeContext());
            }
            if (!playerProfileState || !Number.isFinite(playerProfileState.tutorialStep)) return 0;
            return Math.max(0, Math.floor(playerProfileState.tutorialStep));
        }

        function setTutorialStep(step, reason = 'tutorial_progress') {
            if (coreTutorialRuntime && typeof coreTutorialRuntime.setStep === 'function') {
                return coreTutorialRuntime.setStep(buildTutorialRuntimeContext(), step, reason);
            }
            if (!playerProfileState) return 0;
            const nextStep = Math.max(0, Math.min(TUTORIAL_EXIT_STEP, Math.floor(Number(step) || 0)));
            if (!Number.isFinite(playerProfileState.tutorialStep) || playerProfileState.tutorialStep < nextStep) {
                playerProfileState.tutorialStep = nextStep;
                saveProgressToStorage(reason);
                if (window.refreshTutorialGateStates && typeof window.refreshTutorialGateStates === 'function') {
                    window.refreshTutorialGateStates();
                }
            }
            return getTutorialStep();
        }

        function buildTutorialRuntimeContext() {
            return {
                playerProfileState,
                tutorialExitStep: TUTORIAL_EXIT_STEP,
                mainOverworldWorldId: MAIN_OVERWORLD_WORLD_ID,
                isTutorialWorldActive,
                ensureTutorialItem,
                setTutorialStep,
                getTutorialStep,
                getInventoryItemCount,
                getSkillXp,
                hasTutorialBankProof,
                saveProgressToStorage,
                refreshTutorialGateStates: () => {
                    if (window.refreshTutorialGateStates && typeof window.refreshTutorialGateStates === 'function') {
                        window.refreshTutorialGateStates();
                    }
                }
            };
        }

        function ensureTutorialItem(itemId, amount = 1) {
            if (getInventoryItemCount(itemId) >= amount) return true;
            const granted = grantInventoryItem(itemId, amount - getInventoryItemCount(itemId));
            if (granted > 0) {
                const itemName = ITEM_DB[itemId] && ITEM_DB[itemId].name ? ITEM_DB[itemId].name : itemId;
                addChatMessage(`Received ${itemName}.`, 'info');
                saveProgressToStorage('tutorial_supply_grant');
            }
            return getInventoryItemCount(itemId) >= amount;
        }

        function getSkillXp(skillId) {
            const skill = playerSkills && playerSkills[skillId] ? playerSkills[skillId] : null;
            return skill && Number.isFinite(skill.xp) ? skill.xp : 0;
        }

        function hasTutorialBankProof() {
            if (!playerProfileState) return false;
            const depositSource = typeof playerProfileState.tutorialBankDepositSource === 'string'
                ? playerProfileState.tutorialBankDepositSource
                : '';
            const withdrawSource = typeof playerProfileState.tutorialBankWithdrawSource === 'string'
                ? playerProfileState.tutorialBankWithdrawSource
                : '';
            return !!depositSource && !!withdrawSource && depositSource !== withdrawSource && getInventoryItemCount('coins') > 0;
        }

        function recordTutorialBankAction(kind, sourceKey, itemId, amountChanged) {
            if (coreTutorialRuntime && typeof coreTutorialRuntime.recordBankAction === 'function') {
                return coreTutorialRuntime.recordBankAction(buildTutorialRuntimeContext(), kind, sourceKey, itemId, amountChanged);
            }
            if (!isTutorialWorldActive() || !playerProfileState || getTutorialStep() !== 6) return false;
            if (itemId !== 'coins' || !Number.isFinite(amountChanged) || amountChanged <= 0) return false;
            const safeSourceKey = typeof sourceKey === 'string' && sourceKey ? sourceKey : 'unknown_bank';
            if (kind === 'deposit') {
                playerProfileState.tutorialBankDepositSource = safeSourceKey;
                playerProfileState.tutorialBankWithdrawSource = null;
                saveProgressToStorage('tutorial_bank_deposit');
                return true;
            }
            if (kind === 'withdraw') {
                const depositSource = typeof playerProfileState.tutorialBankDepositSource === 'string'
                    ? playerProfileState.tutorialBankDepositSource
                    : '';
                if (depositSource && depositSource !== safeSourceKey) {
                    playerProfileState.tutorialBankWithdrawSource = safeSourceKey;
                    saveProgressToStorage('tutorial_bank_withdraw');
                    return true;
                }
            }
            return false;
        }

        window.TutorialRuntime = {
            buildNpcDialogueView: (npc, baseView) => coreTutorialRuntime && typeof coreTutorialRuntime.buildNpcDialogueView === 'function'
                ? coreTutorialRuntime.buildNpcDialogueView(buildTutorialRuntimeContext(), npc, baseView)
                : (baseView || null),
            getStep: getTutorialStep,
            setStep: setTutorialStep,
            recordBankAction: recordTutorialBankAction,
            isExitUnlocked: () => coreTutorialRuntime && typeof coreTutorialRuntime.isExitUnlocked === 'function'
                ? coreTutorialRuntime.isExitUnlocked(buildTutorialRuntimeContext())
                : getTutorialStep() >= TUTORIAL_EXIT_STEP
        };

        function applyInventoryIconReviewGrant() {
            const params = new URLSearchParams(window.location.search || '');
            if (!['1', 'true', 'yes'].includes(String(params.get('iconReview') || '').trim().toLowerCase())) {
                return {
                    batchId: '',
                    batchLabel: '',
                    added: [],
                    acknowledged: [],
                    blocked: [],
                    changed: false,
                    replaced: false,
                    placed: 0
                };
            }

            const reviewBatch = getActiveIconReviewBatch();
            const added = [];
            const acknowledged = [];
            const blocked = [];
            const replaceInventory = reviewBatch.replaceInventory === true;

            if (replaceInventory) {
                const slots = [];

                for (let i = 0; i < reviewBatch.itemIds.length; i++) {
                    const itemId = reviewBatch.itemIds[i];
                    if (!ITEM_DB[itemId]) {
                        blocked.push(itemId);
                        continue;
                    }

                    slots.push({ itemId, amount: 1 });
                    if (hasContentGrantItem(reviewBatch.batchId, itemId)) {
                        acknowledged.push(itemId);
                    } else {
                        markContentGrantItem(reviewBatch.batchId, itemId);
                        added.push(itemId);
                    }
                }

                setInventorySlots(slots);
                return {
                    batchId: reviewBatch.batchId,
                    batchLabel: reviewBatch.label,
                    added,
                    acknowledged,
                    blocked,
                    changed: slots.length > 0 || blocked.length > 0,
                    replaced: true,
                    placed: slots.length
                };
            }

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
                changed: added.length > 0 || acknowledged.length > 0,
                replaced: false,
                placed: added.length + acknowledged.length
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
                slots = tools.concat([
                    { itemId: 'logs', amount: 5 },
                    { itemId: 'oak_logs', amount: 5 },
                    { itemId: 'willow_logs', amount: 5 },
                    { itemId: 'maple_logs', amount: 4 },
                    { itemId: 'yew_logs', amount: 4 }
                ]);
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
            const sourceWorldId = (gameSessionRuntime && typeof gameSessionRuntime.resolveCurrentWorldId === 'function')
                ? gameSessionRuntime.resolveCurrentWorldId()
                : ((window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getCurrentWorldId === 'function')
                    ? window.WorldBootstrapRuntime.getCurrentWorldId()
                    : MAIN_OVERWORLD_WORLD_ID);
            const travelTarget = worldAdapterRuntime.resolveTravelTarget(worldId, {
                spawn: options && options.spawn,
                label: options && options.label,
                fallbackWorldId: MAIN_OVERWORLD_WORLD_ID,
                mapSize: MAP_SIZE,
                planes: PLANES,
                activate: true
            });
            if (!travelTarget || !travelTarget.ok || !travelTarget.worldId || !travelTarget.spawn) return false;

            const resolvedWorldId = travelTarget.worldId;
            const spawn = travelTarget.spawn;
            if (
                sourceWorldId === TUTORIAL_WORLD_ID
                && resolvedWorldId === MAIN_OVERWORLD_WORLD_ID
                && (!window.TutorialRuntime || typeof window.TutorialRuntime.isExitUnlocked !== 'function' || !window.TutorialRuntime.isExitUnlocked())
            ) {
                addChatMessage('Finish the Tutorial Island instructors before leaving for Starter Town.', 'warn');
                return false;
            }
            const completedTutorial = sourceWorldId === TUTORIAL_WORLD_ID && resolvedWorldId === MAIN_OVERWORLD_WORLD_ID;
            if (completedTutorial && playerProfileState && !playerProfileState.tutorialCompletedAt) {
                playerProfileState.tutorialStep = TUTORIAL_EXIT_STEP;
                playerProfileState.tutorialCompletedAt = Date.now();
            }

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

            if (window.WorldMapHudRuntime && typeof window.WorldMapHudRuntime.resetMinimapState === 'function') {
                window.WorldMapHudRuntime.resetMinimapState({
                    locked: true,
                    targetX: spawn.x,
                    targetY: spawn.y
                });
            }

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
            if (completedTutorial) {
                addChatMessage('Tutorial complete. Your progress will resume from here next time.', 'info');
                saveProgressToStorage('tutorial_complete');
            }
            return true;
        }
        window.travelToWorld = travelToWorld;
        function buildQaToolsContext() {
            return {
                windowRef: window,
                addChatMessage,
                getWorldGameContext,
                getWorldAdapterRuntime: () => worldAdapterRuntime,
                travelToWorld,
                getRunecraftingAltarLocations: (typeof getRunecraftingAltarLocations === 'function') ? getRunecraftingAltarLocations : null,
                getFiremakingTrainingLocations: (typeof getFiremakingTrainingLocations === 'function') ? getFiremakingTrainingLocations : null,
                getPlayerState: () => playerState,
                getNpcsToRender: () => npcsToRender,
                getEquipment: () => equipment,
                getInventory: () => inventory,
                getPlayerSkills: () => playerSkills,
                getLogicalMap: () => logicalMap,
                getMapSize: () => MAP_SIZE,
                tileId: TileId
            };
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
            activeSession.progress.quests = questProgressState;
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
            if (corePlayerEntryRuntime && typeof corePlayerEntryRuntime.sanitizePlayerName === 'function') {
                return corePlayerEntryRuntime.sanitizePlayerName(value, { maxLength: PLAYER_NAME_MAX_LENGTH });
            }
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
                lastStartedAt: null,
                tutorialStep: 0,
                tutorialCompletedAt: null,
                tutorialBankDepositSource: null,
                tutorialBankWithdrawSource: null
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
            playerProfileState.tutorialStep = Number.isFinite(safeProfile.tutorialStep)
                ? Math.max(0, Math.floor(safeProfile.tutorialStep))
                : 0;
            playerProfileState.tutorialCompletedAt = Number.isFinite(safeProfile.tutorialCompletedAt)
                ? Math.max(0, Math.floor(safeProfile.tutorialCompletedAt))
                : null;
            playerProfileState.tutorialBankDepositSource = typeof safeProfile.tutorialBankDepositSource === 'string'
                ? safeProfile.tutorialBankDepositSource
                : null;
            playerProfileState.tutorialBankWithdrawSource = typeof safeProfile.tutorialBankWithdrawSource === 'string'
                ? safeProfile.tutorialBankWithdrawSource
                : null;
        }

        function sanitizePlayerProfile(savedProfile, options = {}) {
            const allowLegacyFallback = !!(options && options.allowLegacyFallback);
            const savedWorldId = typeof options.savedWorldId === 'string' ? options.savedWorldId : '';
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
                restored.tutorialStep = Number.isFinite(savedProfile.tutorialStep)
                    ? Math.max(0, Math.floor(savedProfile.tutorialStep))
                    : 0;
                restored.tutorialCompletedAt = Number.isFinite(savedProfile.tutorialCompletedAt)
                    ? Math.max(0, Math.floor(savedProfile.tutorialCompletedAt))
                    : null;
                restored.tutorialBankDepositSource = typeof savedProfile.tutorialBankDepositSource === 'string'
                    ? savedProfile.tutorialBankDepositSource
                    : null;
                restored.tutorialBankWithdrawSource = typeof savedProfile.tutorialBankWithdrawSource === 'string'
                    ? savedProfile.tutorialBankWithdrawSource
                    : null;
            }

            if (allowLegacyFallback && !restored.name) restored.name = PLAYER_PROFILE_DEFAULT_NAME;
            if (allowLegacyFallback && !restored.creationCompleted) restored.creationCompleted = true;
            if (allowLegacyFallback && !restored.createdAt) restored.createdAt = Date.now();
            if (
                allowLegacyFallback
                && restored.creationCompleted
                && savedWorldId
                && savedWorldId !== TUTORIAL_WORLD_ID
                && !restored.tutorialCompletedAt
            ) {
                restored.tutorialCompletedAt = restored.lastStartedAt || restored.createdAt || Date.now();
            }
            if (restored.tutorialCompletedAt) restored.tutorialStep = TUTORIAL_EXIT_STEP;

            return restored;
        }

        function isInsideTutorialActiveBounds(x, y, z) {
            return z === TUTORIAL_ACTIVE_BOUNDS.z
                && x >= TUTORIAL_ACTIVE_BOUNDS.xMin
                && x <= TUTORIAL_ACTIVE_BOUNDS.xMax
                && y >= TUTORIAL_ACTIVE_BOUNDS.yMin
                && y <= TUTORIAL_ACTIVE_BOUNDS.yMax;
        }

        function isTutorialWalkTileAllowed(x, y, z) {
            if (!isTutorialWorldActive() || (playerProfileState && playerProfileState.tutorialCompletedAt)) return true;
            return isInsideTutorialActiveBounds(x, y, z);
        }

        window.isTutorialWalkTileAllowed = isTutorialWalkTileAllowed;

        function getTutorialRecoverySpawnForStep(step) {
            const safeStep = Math.max(0, Math.min(TUTORIAL_EXIT_STEP, Math.floor(Number(step) || 0)));
            const spawn = TUTORIAL_RECOVERY_SPAWNS[safeStep] || TUTORIAL_RECOVERY_SPAWNS[0];
            return { x: spawn.x, y: spawn.y, z: spawn.z };
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
                    : null,
                tutorialStep: Number.isFinite(playerProfileState.tutorialStep)
                    ? Math.max(0, Math.floor(playerProfileState.tutorialStep))
                    : 0,
                tutorialCompletedAt: Number.isFinite(playerProfileState.tutorialCompletedAt)
                    ? Math.max(0, Math.floor(playerProfileState.tutorialCompletedAt))
                    : null,
                tutorialBankDepositSource: typeof playerProfileState.tutorialBankDepositSource === 'string'
                    ? playerProfileState.tutorialBankDepositSource
                    : null,
                tutorialBankWithdrawSource: typeof playerProfileState.tutorialBankWithdrawSource === 'string'
                    ? playerProfileState.tutorialBankWithdrawSource
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
                quests: questProgressState,
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
            const rawLoadedWorldId = typeof state.worldId === 'string' && state.worldId
                ? state.worldId
                : activeSession.currentWorldId;
            const loadedWorldId = worldAdapterRuntime && typeof worldAdapterRuntime.resolveKnownWorldId === 'function'
                ? worldAdapterRuntime.resolveKnownWorldId(rawLoadedWorldId, MAIN_OVERWORLD_WORLD_ID)
                : rawLoadedWorldId;

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
            questProgressState = gameSessionRuntime && typeof gameSessionRuntime.sanitizeQuestProgressState === 'function'
                ? gameSessionRuntime.sanitizeQuestProgressState(state.quests)
                : {};
            isRunning = !!state.runMode;
            const hasSavedProfile = !!(state.profile && typeof state.profile === 'object');
            playerProfileState = sanitizePlayerProfile(state.profile, { allowLegacyFallback: true, savedWorldId: loadedWorldId });
            if (
                loadedWorldId === TUTORIAL_WORLD_ID
                && !playerProfileState.tutorialCompletedAt
                && !isInsideTutorialActiveBounds(playerState.x, playerState.y, playerState.z)
            ) {
                const recoverySpawn = getTutorialRecoverySpawnForStep(playerProfileState.tutorialStep);
                playerState.x = recoverySpawn.x;
                playerState.y = recoverySpawn.y;
                playerState.z = recoverySpawn.z;
                playerState.prevX = recoverySpawn.x;
                playerState.prevY = recoverySpawn.y;
                playerState.targetX = recoverySpawn.x;
                playerState.targetY = recoverySpawn.y;
                playerState.path = [];
                addChatMessage('Recovered your tutorial position at the current lesson.', 'info');
            }
            selectedUse.invIndex = null;
            selectedUse.itemId = null;

            const appearance = sanitizeAppearanceState(state.appearance);
            if (appearance && window.playerAppearanceState) {
                window.playerAppearanceState.gender = appearance.gender;
                window.playerAppearanceState.colors = appearance.colors.slice();
            }

            syncGameSessionState();
            if (window.QuestRuntime && typeof window.QuestRuntime.refreshAllQuestStates === 'function') {
                window.QuestRuntime.refreshAllQuestStates({ silent: true, persist: false });
            }
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
            if (coreChatRuntime && typeof coreChatRuntime.addChatMessage === 'function') {
                coreChatRuntime.addChatMessage(message, type, { documentRef: document });
            }
        }

        function getChatLogCopyText() {
            if (coreChatRuntime && typeof coreChatRuntime.getChatLogCopyText === 'function') {
                return coreChatRuntime.getChatLogCopyText({ documentRef: document });
            }
            return '';
        }

        async function copyChatLogTextToClipboard() {
            if (coreChatRuntime && typeof coreChatRuntime.copyChatLogTextToClipboard === 'function') {
                return coreChatRuntime.copyChatLogTextToClipboard({
                    documentRef: document,
                    navigatorRef: navigator,
                    addChatMessage
                });
            }
            return false;
        }

        function setChatBoxExpanded(expanded) {
            if (coreChatRuntime && typeof coreChatRuntime.setChatBoxExpanded === 'function') {
                coreChatRuntime.setChatBoxExpanded(expanded, {
                    documentRef: document,
                    windowRef: window
                });
            }
        }

        function initChatControls() {
            if (coreChatRuntime && typeof coreChatRuntime.initChatControls === 'function') {
                coreChatRuntime.initChatControls({
                    documentRef: document,
                    windowRef: window,
                    addChatMessage
                });
            }
        }

        function showPlayerOverheadText(text, durationMs = 2800) {
            if (coreChatRuntime && typeof coreChatRuntime.showPlayerOverheadText === 'function') {
                coreChatRuntime.showPlayerOverheadText({
                    playerOverheadText,
                    text,
                    durationMs,
                    nowMs: Date.now()
                });
                return;
            }
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
            const didSet = corePlayerEntryRuntime && typeof corePlayerEntryRuntime.setPlayerEntryFlowOpen === 'function'
                ? corePlayerEntryRuntime.setPlayerEntryFlowOpen(Object.assign(buildPlayerEntryRuntimeOptions(), { isOpen }))
                : false;
            if (!didSet) return;

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
            if (corePlayerEntryRuntime && typeof corePlayerEntryRuntime.validatePlayerEntryName === 'function') {
                return corePlayerEntryRuntime.validatePlayerEntryName({
                    name: playerProfileState.name,
                    minLength: PLAYER_NAME_MIN_LENGTH,
                    maxLength: PLAYER_NAME_MAX_LENGTH
                });
            }
            const value = sanitizePlayerName(playerProfileState.name);
            if (!value) return { ok: false, value: '', message: `Choose a name with ${PLAYER_NAME_MIN_LENGTH}-${PLAYER_NAME_MAX_LENGTH} letters or numbers.` };
            if (value.length < PLAYER_NAME_MIN_LENGTH) return { ok: false, value, message: `Name must be at least ${PLAYER_NAME_MIN_LENGTH} characters long.` };
            return { ok: true, value, message: '' };
        }

        function formatPlayerEntryTimestamp(value) {
            if (corePlayerEntryRuntime && typeof corePlayerEntryRuntime.formatPlayerEntryTimestamp === 'function') {
                return corePlayerEntryRuntime.formatPlayerEntryTimestamp(value);
            }
            if (!Number.isFinite(value)) return 'unknown';
            try {
                return new Date(value).toLocaleString();
            } catch (error) {
                return 'unknown';
            }
        }

        function buildPlayerEntryRuntimeOptions() {
            const uiDomainRuntime = window.UiDomainRuntime || null;
            return {
                documentRef: document,
                windowRef: window,
                playerProfileState,
                playerEntryFlowState,
                playerAppearanceState: window.playerAppearanceState || null,
                playerAppearanceCatalog: window.PlayerAppearanceCatalog || {},
                defaultName: PLAYER_PROFILE_DEFAULT_NAME,
                nameMinLength: PLAYER_NAME_MIN_LENGTH,
                nameMaxLength: PLAYER_NAME_MAX_LENGTH,
                buildPlayerProfileSummaryViewModel: uiDomainRuntime && typeof uiDomainRuntime.buildPlayerProfileSummaryViewModel === 'function'
                    ? uiDomainRuntime.buildPlayerProfileSummaryViewModel
                    : null,
                formatTimestamp: formatPlayerEntryTimestamp,
                refreshPlayerAppearancePreview,
                completePlayerEntryFlow
            };
        }

        function refreshPlayerAppearancePreview() {
            if (typeof window.rebuildPlayerRigsFromAppearance === 'function') {
                window.rebuildPlayerRigsFromAppearance();
            }
        }

        function renderPlayerEntryFlow() {
            if (corePlayerEntryRuntime && typeof corePlayerEntryRuntime.renderPlayerEntryFlow === 'function') {
                corePlayerEntryRuntime.renderPlayerEntryFlow(buildPlayerEntryRuntimeOptions());
            }
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
            const isMounted = corePlayerEntryRuntime && typeof corePlayerEntryRuntime.isPlayerEntryMounted === 'function'
                ? corePlayerEntryRuntime.isPlayerEntryMounted({ documentRef: document })
                : !!document.getElementById('player-entry-overlay');
            if (!isMounted) {
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
                if (corePlayerEntryRuntime && typeof corePlayerEntryRuntime.bindPlayerEntryFlowControls === 'function') {
                    corePlayerEntryRuntime.bindPlayerEntryFlowControls(buildPlayerEntryRuntimeOptions());
                }
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

            if (corePlayerEntryRuntime && typeof corePlayerEntryRuntime.focusPlayerEntryName === 'function') {
                corePlayerEntryRuntime.focusPlayerEntryName({ documentRef: document });
            }
        }

        function buildQaCommandContext() {
            const qaToolsRuntime = window.QaToolsRuntime || null;
            const qaToolHandlers = qaToolsRuntime && typeof qaToolsRuntime.createCommandHandlers === 'function'
                ? qaToolsRuntime.createCommandHandlers(buildQaToolsContext())
                : {};
            return Object.assign({
                windowRef: window,
                addChatMessage,
                showPlayerOverheadText,
                resetQaCameraView: (typeof window.resetQaCameraView === 'function') ? window.resetQaCameraView : null,
                setQaCameraView: (typeof window.setQaCameraView === 'function') ? window.setQaCameraView : null,
                setQaSkillLevel,
                setQaUnlockFlag,
                emitQaCombatDebugSnapshot,
                emitQaCombatDebugClearHistory,
                openShopForMerchant: (typeof window.openShopForMerchant === 'function') ? window.openShopForMerchant : null,
                applyQaInventoryPreset
            }, qaToolHandlers);
        }
        function getQaCommandRuntime() {
            return window.QaCommandRuntime || null;
        }

        function sendChatMessage(rawText) {
            const runtime = getQaCommandRuntime();
            if (runtime && typeof runtime.handleChatMessage === 'function') {
                runtime.handleChatMessage(rawText, buildQaCommandContext());
                return;
            }
            const text = (rawText || '').trim();
            if (!text) return;
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
            const isFreshProfileStartup = !(loadProgressResult && loadProgressResult.loaded);
            const startupRequestedWorldId = isFreshProfileStartup
                ? TUTORIAL_WORLD_ID
                : (gameSessionRuntime && typeof gameSessionRuntime.resolveCurrentWorldId === 'function')
                ? gameSessionRuntime.resolveCurrentWorldId()
                : MAIN_OVERWORLD_WORLD_ID;
            const startupWorldId = (worldAdapterRuntime && typeof worldAdapterRuntime.activateWorldContext === 'function')
                ? worldAdapterRuntime.activateWorldContext(startupRequestedWorldId, MAIN_OVERWORLD_WORLD_ID)
                : MAIN_OVERWORLD_WORLD_ID;
            if (startupWorldId !== startupRequestedWorldId || isFreshProfileStartup) {
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
                if (window.WorldMapHudRuntime && typeof window.WorldMapHudRuntime.resetMinimapState === 'function') {
                    window.WorldMapHudRuntime.resetMinimapState({
                        locked: true,
                        targetX: fallbackSpawn.x,
                        targetY: fallbackSpawn.y
                    });
                }
            }
            if (typeof window.initLogicalMap === 'function') window.initLogicalMap();
            if (typeof window.initThreeJS === 'function') window.initThreeJS();
            if (typeof window.build3DEnvironment === 'function') window.build3DEnvironment();
            if (typeof window.initMinimap === 'function') window.initMinimap();
            if (typeof window.initUIPreview === 'function') window.initUIPreview(); 
            initInventoryUI(); 
            if (window.QuestRuntime && typeof window.QuestRuntime.refreshAllQuestStates === 'function') {
                window.QuestRuntime.refreshAllQuestStates({ silent: true, persist: false });
            }
            if (typeof renderQuestLog === 'function') renderQuestLog();
            initChatInput();
            initChatControls();
            if (window.AnimationStudioBridge && typeof window.AnimationStudioBridge.init === 'function') {
                window.AnimationStudioBridge.init();
            }
            initPlayerEntryFlow(loadProgressResult);
            const iconGrantResult = applyInventoryIconReviewGrant();
            if (iconGrantResult.changed && typeof renderInventory === 'function') {
                renderInventory();
            }
            if (iconGrantResult.changed) {
                saveProgressToStorage('inventory_icon_review_grant');
            }
            if (iconGrantResult.replaced) {
                addChatMessage(`Replaced inventory with ${iconGrantResult.placed} active icon review item(s).`, 'info');
            } else if (iconGrantResult.added.length > 0) {
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




