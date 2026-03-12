// Engine Constants & Chunk Architecture
        const TICK_RATE_MS = 600;
        const CHUNK_SIZE = 81;
        const WORLD_CHUNKS_X = 6;
        const WORLD_CHUNKS_Y = 6;
        const MAP_SIZE = CHUNK_SIZE * WORLD_CHUNKS_X; // 486
        
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
        const PROGRESS_MAX_SKILL_LEVEL = 99;

        // --- Game State (Logical & Terrain) ---
        let currentTick = 0;
        
        const TileId = Object.freeze({
            GRASS: 0,
            TREE: 1,
            ROCK: 2,
            STUMP: 4,
            OBSTACLE: 5,
            FLOOR_WOOD: 6,
            FLOOR_STONE: 7,
            FLOOR_BRICK: 8,
            BANK_BOOTH: 9,
            DUMMY: 10,
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

        window.TileId = TileId;
        window.isWaterTileId = isWaterTileId;
        window.isNaturalTileId = isNaturalTileId;
        window.isTreeTileId = isTreeTileId;
        window.isWalkableTileId = isWalkableTileId;
        window.isDoorTileId = isDoorTileId;

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
        let playerState = {
            x: 205, y: 210, z: 0, // NEW Z-Level Spawn   
            prevX: 205, prevY: 210, 
            midX: null, midY: null,
            targetX: 205, targetY: 210, 
            targetRotation: 0,  
            path: [],
            action: 'IDLE',
            targetObj: null,
            pendingActionAfterTurn: null,
            turnLock: false,
            actionVisualReady: true,
            actionUntilTick: 0,
            currentHitpoints: 10,
            eatingCooldownEndTick: 0,
            lastAttackTick: -1,
            lastCastTick: -1,
            firemakingTarget: null,
            pendingSkillStart: null,
            unlockFlags: { ...DEFAULT_UNLOCK_FLAGS },
            merchantProgress: {}
        };
        const TEST_MINING_ROCK = { x: 205, y: 211, z: 0 };
        let RUNE_ESSENCE_ROCKS = [];

        // Shared shoulder pivot for player rig/animations.
        // X is width-aware: torso half-width (0.54/2) + upper-arm half-width (0.20/2) + small gap.
        const PLAYER_SHOULDER_PIVOT = {
            x: (0.54 * 0.5) + (0.20 * 0.5) + 0.01,
            y: 1.34,
            z: 0.03
        };
        // Three.js Variables
        let scene, camera, renderer, raycaster, mouse;
        let playerRig; 
        let environmentMeshes = [];
        let clickMarkers = [];
        let levelUpAnimations = []; 
        let isRunning = false; 

        // Chunk Rendering State
        let loadedChunks = new Set();
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
        let bankItems = Array(200).fill(null);

        // Minimap State
        let minimapZoom = 1.0; 
        let minimapLocked = true;
        let minimapTargetX = 205;
        let minimapTargetY = 210;
        let offscreenMapCanvas, offscreenMapCtx;
        let isMinimapDragging = false;
        let minimapDragStart = { x: 0, y: 0 };
        let minimapDragEnd = { x: 0, y: 0 };
        let minimapDestination = null;
        let playerOverheadText = { text: '', expiresAt: 0 };
        const TARGET_FPS = 50;
        const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
        let frameLimiterPrev = 0;
        let fpsSampleLast = 0;
        let fpsSampleFrames = 0;

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

        function makeIconSprite(id) {
            const iconCatalog = window.IconSpriteCatalog;
            const resolved = (iconCatalog && typeof iconCatalog.resolveSpriteMarkup === 'function')
                ? iconCatalog.resolveSpriteMarkup(id)
                : null;
            const spriteMarkup = resolved && typeof resolved.markup === 'string' ? resolved.markup : '';
            return `<span class="pointer-events-none drop-shadow-md">${spriteMarkup || makeMissingIconSprite()}</span>`;
        }

        function makeIconFromImage(path) {
            return `<img src="${path}" alt="" class="w-[80%] h-[80%] object-contain pointer-events-none drop-shadow-md" draggable="false" />`;
        }

        const ASSET_VERSION_TAG = "20260305a";
        const ITEM_ACTION_PRIORITY = ['equip', 'eat', 'drink', 'use', 'drop'];

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
            ? window.ItemCatalog.buildItemDb(makeIconSprite, makeIconFromImage, ASSET_VERSION_TAG)
            : {};
        window.ITEM_DB = ITEM_DB;

        let inventory = Array(28).fill(null);
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
        inventory[11] = { itemData: ITEM_DB['owie'], amount: 1 };

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
        function getQaAltarLocations() {
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

            if (typeof window.getFishingTrainingLocations !== 'function') return fallback;
            const routes = window.getFishingTrainingLocations();
            if (!Array.isArray(routes) || routes.length === 0) return fallback;

            const routeToKey = {
                castle_pond_bank: 'pond',
                castle_pond_pier: 'pier',
                castle_pond_deep_edge: 'deep'
            };
            const merged = Object.assign({}, fallback);
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                if (!route || typeof route.routeId !== 'string') continue;
                const routeId = route.routeId.toLowerCase();
                const explicitAlias = typeof route.alias === 'string' ? route.alias.trim().toLowerCase() : '';
                const key = routeToKey[routeId] || (explicitAlias && merged[explicitAlias] ? explicitAlias : null);
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

            if (typeof window.getCookingTrainingLocations !== 'function') return fallback;
            const routes = window.getCookingTrainingLocations();
            if (!Array.isArray(routes) || routes.length === 0) return fallback;

            const routeToKey = {
                starter_campfire: 'camp',
                riverbank_fire_line: 'river',
                dockside_fire_line: 'dock',
                deep_water_dock_fire_line: 'deep'
            };
            const merged = Object.assign({}, fallback);
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                if (!route || typeof route.routeId !== 'string') continue;
                const key = routeToKey[route.routeId];
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
            for (let i = 0; i < npcsToRender.length; i++) {
                const npc = npcsToRender[i];
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
        let equipment = { head: null, cape: null, neck: null, weapon: null, body: null, shield: null, legs: null, hands: null, feet: null, ring: null };
        let baseStats = { atk: 10, def: 10, str: 10 };
        let userItemPrefs = {};
        let playerSkills = {
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

        function canUseProgressStorage() {
            try {
                return typeof window !== 'undefined' && !!window.localStorage;
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

        function sanitizeUnlockFlags(savedFlags) {
            const restored = { ...DEFAULT_UNLOCK_FLAGS };
            if (!savedFlags || typeof savedFlags !== 'object') return restored;
            const keys = Object.keys(DEFAULT_UNLOCK_FLAGS);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (savedFlags[key] === undefined) continue;
                restored[key] = !!savedFlags[key];
            }
            return restored;
        }

        function sanitizeMerchantProgress(savedProgress) {
            const restored = {};
            if (!savedProgress || typeof savedProgress !== 'object') return restored;

            const merchantIds = Object.keys(savedProgress);
            for (let i = 0; i < merchantIds.length; i++) {
                const merchantId = merchantIds[i];
                const row = savedProgress[merchantId];
                if (!row || typeof row !== 'object') continue;

                const soldCounts = {};
                const unlockedItems = {};

                const sold = row.soldCounts;
                if (sold && typeof sold === 'object') {
                    const soldKeys = Object.keys(sold);
                    for (let j = 0; j < soldKeys.length; j++) {
                        const itemId = sanitizeItemId(soldKeys[j]);
                        if (!itemId) continue;
                        const value = Number(sold[soldKeys[j]]);
                        if (!Number.isFinite(value) || value <= 0) continue;
                        soldCounts[itemId] = Math.floor(value);
                    }
                }

                const unlocked = row.unlockedItems;
                if (unlocked && typeof unlocked === 'object') {
                    const unlockedKeys = Object.keys(unlocked);
                    for (let j = 0; j < unlockedKeys.length; j++) {
                        const itemId = sanitizeItemId(unlockedKeys[j]);
                        if (!itemId) continue;
                        if (unlocked[unlockedKeys[j]]) unlockedItems[itemId] = true;
                    }
                }

                restored[merchantId] = { soldCounts, unlockedItems };
            }

            return restored;
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
            return {
                version: PROGRESS_SAVE_VERSION,
                savedAt: Date.now(),
                reason,
                state: {
                    playerState: {
                        x: playerState.x,
                        y: playerState.y,
                        z: playerState.z,
                        targetRotation: Number.isFinite(playerState.targetRotation) ? playerState.targetRotation : 0,
                        currentHitpoints: Number.isFinite(playerState.currentHitpoints) ? Math.floor(playerState.currentHitpoints) : 10,
                        eatingCooldownEndTick: Number.isFinite(playerState.eatingCooldownEndTick) ? Math.floor(playerState.eatingCooldownEndTick) : 0,
                        unlockFlags: sanitizeUnlockFlags(playerState.unlockFlags),
                        merchantProgress: sanitizeMerchantProgress(playerState.merchantProgress)
                    },
                    playerSkills: sanitizeSkillState(playerSkills),
                    inventory: serializeItemArray(inventory),
                    bankItems: serializeItemArray(bankItems),
                    equipment: serializeEquipmentState(),
                    userItemPrefs: sanitizeUserItemPrefs(userItemPrefs),
                    runMode: !!isRunning,
                    appearance: window.playerAppearanceState
                        ? {
                            gender: window.playerAppearanceState.gender === 1 ? 1 : 0,
                            colors: Array.isArray(window.playerAppearanceState.colors)
                                ? window.playerAppearanceState.colors.slice(0, 5)
                                : [0, 0, 0, 0, 0]
                        }
                        : null
                }
            };
        }

        function migrateProgressPayload(payload) {
            if (!payload || typeof payload !== 'object') return null;
            if (payload.version === PROGRESS_SAVE_VERSION) return payload;
            const legacyState = payload.state || payload;
            if (legacyState && typeof legacyState === 'object') {
                return {
                    version: PROGRESS_SAVE_VERSION,
                    savedAt: Number.isFinite(payload.savedAt) ? payload.savedAt : Date.now(),
                    reason: payload.reason || 'migrated',
                    state: legacyState
                };
            }
            return null;
        }

        function saveProgressToStorage(reason = 'manual') {
            if (!canUseProgressStorage()) return { ok: false, reason: 'storage_unavailable' };
            try {
                const payload = buildProgressPayload(reason);
                localStorage.setItem(PROGRESS_SAVE_KEY, JSON.stringify(payload));
                return { ok: true };
            } catch (error) {
                console.warn('Progress save failed', error);
                return { ok: false, reason: 'save_failed', error };
            }
        }

        function loadProgressFromStorage() {
            if (!canUseProgressStorage()) return { loaded: false, reason: 'storage_unavailable' };
            let raw = null;
            try {
                raw = localStorage.getItem(PROGRESS_SAVE_KEY);
            } catch (error) {
                console.warn('Progress load failed', error);
                return { loaded: false, reason: 'load_failed', error };
            }
            if (!raw) return { loaded: false, reason: 'no_save' };

            let parsed = null;
            try {
                parsed = JSON.parse(raw);
            } catch (error) {
                console.warn('Progress load parse failed', error);
                return { loaded: false, reason: 'parse_failed', error };
            }

            const migrated = migrateProgressPayload(parsed);
            if (!migrated || !migrated.state || typeof migrated.state !== 'object') {
                return { loaded: false, reason: 'invalid_payload' };
            }

            const state = migrated.state;
            const savedPlayerState = state.playerState && typeof state.playerState === 'object' ? state.playerState : {};

            const safeX = Number.isFinite(savedPlayerState.x) ? Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(savedPlayerState.x))) : playerState.x;
            const safeY = Number.isFinite(savedPlayerState.y) ? Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(savedPlayerState.y))) : playerState.y;
            const safeZ = Number.isFinite(savedPlayerState.z) ? Math.max(0, Math.min(PLANES - 1, Math.floor(savedPlayerState.z))) : playerState.z;

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
            playerState.targetRotation = Number.isFinite(savedPlayerState.targetRotation)
                ? savedPlayerState.targetRotation
                : playerState.targetRotation;
            playerState.currentHitpoints = Number.isFinite(savedPlayerState.currentHitpoints)
                ? Math.max(1, Math.floor(savedPlayerState.currentHitpoints))
                : playerState.currentHitpoints;
            playerState.eatingCooldownEndTick = Number.isFinite(savedPlayerState.eatingCooldownEndTick)
                ? Math.max(0, Math.floor(savedPlayerState.eatingCooldownEndTick))
                : 0;
            playerState.unlockFlags = sanitizeUnlockFlags(savedPlayerState.unlockFlags);
            playerState.merchantProgress = sanitizeMerchantProgress(savedPlayerState.merchantProgress);

            playerSkills = sanitizeSkillState(state.playerSkills);
            inventory = deserializeItemArray(state.inventory, 28);
            bankItems = deserializeItemArray(state.bankItems, 200);
            equipment = deserializeEquipmentState(state.equipment);
            userItemPrefs = sanitizeUserItemPrefs(state.userItemPrefs);
            isRunning = !!state.runMode;
            selectedUse.invIndex = null;
            selectedUse.itemId = null;

            const appearance = sanitizeAppearanceState(state.appearance);
            if (appearance && window.playerAppearanceState) {
                window.playerAppearanceState.gender = appearance.gender;
                window.playerAppearanceState.colors = appearance.colors.slice();
            }

            return { loaded: true, savedAt: migrated.savedAt };
        }

        function startProgressAutosave() {
            if (progressAutosaveHandle) clearInterval(progressAutosaveHandle);
            progressAutosaveHandle = setInterval(() => {
                saveProgressToStorage('autosave');
            }, PROGRESS_AUTOSAVE_INTERVAL_MS);
        }

        // Temporary interaction diagnostics for cooking-use flow.
        if (typeof window.DEBUG_COOKING_USE === 'undefined') window.DEBUG_COOKING_USE = false; 

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

        function showPlayerOverheadText(text, durationMs = 2800) {
            playerOverheadText.text = text;
            playerOverheadText.expiresAt = Date.now() + durationMs;
        }

        function sendChatMessage(rawText) {
            const text = (rawText || '').trim();
            if (!text) return;

            if (text.toLowerCase().startsWith('/qa ')) {
                const args = text.slice(4).trim();
                const parts = args.split(/\s+/).filter(Boolean);
                const cmd = (parts[0] || '').toLowerCase();

                if (cmd === 'help' || !cmd) {
                    addChatMessage('QA presets: /qa fish_full, /qa fish_rod, /qa fish_harpoon, /qa fish_rune, /qa wc_full, /qa mining_full, /qa rc_full, /qa rc_combo, /qa rc_routes, /qa fm_full, /qa smith_smelt, /qa smith_forge, /qa smith_jewelry, /qa smith_full, /qa smith_fullinv, /qa default', 'info');
                    addChatMessage('QA tools: /qa setlevel <fishing|mining|runecrafting|smithing> <1-99>, /qa diag <fishing|mining|rc|shop>, /qa shopdiag [merchantId], /qa openshop <merchantId>, /qa fishspots, /qa fishshops, /qa cookspots, /qa gotofish <pond|pier|deep>, /qa gotocook <camp|river|dock|deep>, /qa gotofishshop <teacher|supplier>, /qa gotomerchant <merchantId|alias>, /qa unlock <combo|gemmine|mould|moulds|ringmould|amuletmould|tiaramould> <on|off>, /qa altars, /qa gotoaltar <ember|water|earth|air>, /qa rcdebug <on|off>', 'info');
                    addChatMessage(formatQaOpenShopUsage(), 'info');
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
            const faceDx = playerState.targetX - playerState.x;
            const faceDy = playerState.targetY - playerState.y;

            if (faceDx === 0 && faceDy === 0) {
                playerState.pendingActionAfterTurn = null;
                playerState.turnLock = false;
                playerState.actionVisualReady = true;
                playerState.action = nextAction;
                return;
            }

            playerState.targetRotation = Math.atan2(faceDx, faceDy);
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
            const loadProgressResult = loadProgressFromStorage();
            if (typeof window.initLogicalMap === 'function') window.initLogicalMap();
            if (typeof window.initThreeJS === 'function') window.initThreeJS();
            if (typeof window.build3DEnvironment === 'function') window.build3DEnvironment();
            if (typeof window.initMinimap === 'function') window.initMinimap();
            if (typeof window.initUIPreview === 'function') window.initUIPreview(); 
            initInventoryUI(); 
            addChatMessage('Welcome to the prototype.', 'game');
            addChatMessage('Tip: Left-click to move. Right-click for actions.', 'info');
            addChatMessage('QA loadouts: type /qa help in chat.', 'info');
            if (loadProgressResult && loadProgressResult.loaded) {
                addChatMessage('Loaded saved progress from your previous session.', 'info');
            } else if (loadProgressResult && (loadProgressResult.reason === 'parse_failed' || loadProgressResult.reason === 'invalid_payload')) {
                addChatMessage('Save data was invalid and has been ignored; starting with defaults.', 'warn');
            }
            initChatInput();
            if (typeof initMotionDebugPanel === 'function') initMotionDebugPanel();
            if (typeof initPoseEditor === 'function') initPoseEditor();
            startProgressAutosave();
            window.addEventListener('beforeunload', () => saveProgressToStorage('beforeunload'));
            window.addEventListener('pagehide', () => saveProgressToStorage('pagehide'));

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
                const k = e.key.toLowerCase();
                if (keys.hasOwnProperty(k)) keys[k] = true;
                if (e.key === 'Escape' && worldMapPanel && !worldMapPanel.classList.contains('hidden')) setWorldMapOpen(false);
                if (e.key === 'Escape' && isBankOpen) closeBank();
            });
            window.addEventListener('keyup', (e) => {
                if (e.target && e.target.id === 'chat-input') return;
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




