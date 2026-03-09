// Engine Constants & Chunk Architecture
        const TICK_RATE_MS = 600;
        const CHUNK_SIZE = 81;
        const WORLD_CHUNKS_X = 5;
        const WORLD_CHUNKS_Y = 5;
        const MAP_SIZE = CHUNK_SIZE * WORLD_CHUNKS_X; // 405
        
        // NEW: Max Planes (Z-Levels)
        const PLANES = 2; // Floor 0 (Ground), Floor 1 (Second Floor)

        // --- Game State (Logical & Terrain) ---
        let currentTick = 0;
        
        // 3D Array Logic: logicalMap[z][y][x]
        // 0=grass, 1=tree, 2=rock, 4=stump, 5=obstacle, 6=woodFloor, 7=stoneFloor, 8=brickFloor, 9=bankBooth, 10=Dummy
        // 11=Wall, 12=Tower, 13=Stairs Up, 14=Stairs Down, 15=Seamless Walkable Stairs, 16=Solid NPC, 17=Shop Counter
        // 18=Closed Door, 19=Open Door, 20=Shoreline, 21=Shallow Water, 22=Deep Water
        let logicalMap = []; 
        let heightMap = [];  
        
        let lastTickTime = 0;
        let pendingAction = null;
        let npcsToRender = []; 
        let bankBoothsToRender = []; 
        let doorsToRender = []; 
        let directionalSignsToRender = []; 
        let activeHitsplats = []; 
        
        // Pathfinder Walkability Registry (Added 19 for Open Doors)
        const WALKABLE_TILES = [0, 6, 7, 8, 13, 14, 15, 19, 20]; 

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
            firemakingTarget: null,
            pendingSkillStart: null
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
        let isDraggingCamera = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        // Mouse Tracking state
        let currentMouseX = 0;
        let currentMouseY = 0;

        let cameraYaw = Math.PI / 4;
        let cameraPitch = Math.PI / 4;
        let cameraDist = 15;

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
            idleBounce: 0.025,
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

        // --- Pixel Art Generator ---
        const logPalette = {
            'O': '#21160d', '1': '#3b2513', '2': '#54361e', '3': '#6e492b', 
            '4': '#b59265', '5': '#8f6c44', 'M': '#3d4c28', '.': 'transparent'
        };

        function generatePixelArt(asciiGrid, palette) {
            const rows = asciiGrid.trim().split('\n');
            const h = rows.length;
            const w = Math.max(...rows.map(r => r.trim().length));
            let svg = `<svg viewBox="0 0 ${w} ${h}" class="w-[80%] h-[80%] drop-shadow-md pointer-events-none" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">`;
            rows.forEach((row, y) => {
                for(let x=0; x<row.trim().length; x++) {
                    const char = row[x];
                    if(palette[char] && char !== '.') {
                        svg += `<rect x="${x}" y="${y}" width="1.1" height="1.1" fill="${palette[char]}"/>`;
                    }
                }
            });
            svg += `</svg>`;
            return svg;
        }

        const spriteLogs = `
......OOOOOOO...
....OO1122231O..
...O4451122211O.
..O45554122211OO
..O45554112211OO
..O445411111OOO.
...O4111OOOO231O
.OO12231OO22211O
O445112221O42211O
O455541222O41211O
O455541122O4111O
O445411111OOOOO.
.O4111OOOO......
.OOOOO..........`.trim();

        function makeIconSprite(id) {
            const sprites = {
                iron_axe: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="2" width="2" height="12" fill="#6b4a2a"/><rect x="5" y="2" width="6" height="4" fill="#b7bcc5"/><rect x="6" y="3" width="1" height="2" fill="#8e949d"/></svg>`,
                coins: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="9" width="8" height="3" fill="#d7a520"/><rect x="3" y="7" width="8" height="3" fill="#f1c94a"/><rect x="5" y="5" width="8" height="3" fill="#ffd95e"/></svg>`,
                tinderbox: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="10" height="7" fill="#8a5a32"/><rect x="4" y="6" width="8" height="5" fill="#b87a45"/><rect x="6" y="3" width="4" height="2" fill="#5d5d5d"/></svg>`,
                knife: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="10" width="5" height="2" fill="#6b4a2a"/><rect x="8" y="8" width="5" height="2" fill="#bfc4cc"/><rect x="11" y="6" width="2" height="2" fill="#d5dae2"/></svg>`,
                pickaxe: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="3" width="2" height="10" fill="#6b4a2a"/><rect x="4" y="3" width="8" height="2" fill="#9ca2ab"/><rect x="3" y="4" width="2" height="1" fill="#9ca2ab"/><rect x="11" y="4" width="2" height="1" fill="#9ca2ab"/></svg>`,
                small_net: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="3" width="2" height="10" fill="#6b4a2a"/><rect x="4" y="2" width="5" height="1" fill="#9ca2ab"/><rect x="3" y="3" width="1" height="4" fill="#9ca2ab"/><rect x="4" y="7" width="5" height="1" fill="#9ca2ab"/><rect x="8" y="3" width="1" height="4" fill="#9ca2ab"/></svg>`,
                raw_shrimp: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="7" height="4" fill="#e09ca0"/><rect x="10" y="7" width="2" height="2" fill="#cf7c83"/><rect x="3" y="7" width="1" height="2" fill="#cf7c83"/><rect x="6" y="5" width="3" height="1" fill="#f3bbc0"/></svg>`,
                copper_ore: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="8" height="8" fill="#7b848d"/><rect x="5" y="5" width="2" height="2" fill="#c47b43"/><rect x="8" y="6" width="2" height="2" fill="#b56b3a"/><rect x="6" y="9" width="2" height="2" fill="#cf8a54"/></svg>`,
                tin_ore: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="8" height="8" fill="#6f7883"/><rect x="5" y="5" width="2" height="2" fill="#e4eaef"/><rect x="8" y="6" width="2" height="2" fill="#cfd6dd"/><rect x="6" y="9" width="2" height="2" fill="#f0f4f8"/></svg>`,
                rune_essence: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="8" height="8" fill="#7b8088"/><rect x="5" y="5" width="2" height="2" fill="#9aa0aa"/><rect x="8" y="6" width="2" height="2" fill="#b5bbc6"/><rect x="6" y="9" width="3" height="2" fill="#8e94a0"/></svg>`,
                ember_rune: `<svg viewBox="0 0 16 16" class="w-[80%] h-[80%]" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="2" width="4" height="1" fill="#ffd38a"/><rect x="5" y="3" width="6" height="2" fill="#ff9a3c"/><rect x="4" y="5" width="8" height="3" fill="#ff6a2a"/><rect x="5" y="8" width="6" height="3" fill="#c73a1c"/><rect x="6" y="11" width="4" height="2" fill="#7a1e17"/></svg>`
            };
            return `<span class="pointer-events-none drop-shadow-md">${sprites[id] || ""}</span>`;
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

        function setInventorySlots(slotDefs) {
            inventory = Array(28).fill(null);
            const defs = Array.isArray(slotDefs) ? slotDefs : [];
            for (let i = 0; i < defs.length && i < 28; i++) {
                const def = defs[i];
                if (!def || !def.itemId || !ITEM_DB[def.itemId]) continue;
                const amount = Number.isFinite(def.amount) && def.amount > 0 ? Math.floor(def.amount) : 1;
                inventory[i] = { itemData: ITEM_DB[def.itemId], amount };
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
                slots = makeFilledSlots(tools, 'raw_shrimp');
            } else if (name === 'wc_full') {
                slots = makeFilledSlots(tools, 'logs');
            } else if (name === 'fm_full') {
                slots = makeFilledSlots(tools, 'logs');
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
            runecrafting: { xp: 0, level: 1 }
        };
        let groundItems = [];
        let activeFires = [];
        let fishingSpotsToRender = [];
        let selectedUse = { invIndex: null, itemId: null }; 

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

            let x = clientX;
            let y = clientY;
            if (x + menuW > window.innerWidth - pad) x = window.innerWidth - menuW - pad;
            if (y + menuH > window.innerHeight - pad) y = window.innerHeight - menuH - pad;
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
                if (args.toLowerCase() === 'help') {
                    addChatMessage('QA presets: /qa fish_full, /qa wc_full, /qa fm_full, /qa default', 'info');
                    return;
                }
                const applied = applyQaInventoryPreset(args);
                if (!applied) {
                    addChatMessage(`Unknown QA preset: ${args}. Use /qa help`, 'warn');
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
            if (typeof window.initLogicalMap === 'function') window.initLogicalMap();
            if (typeof window.initThreeJS === 'function') window.initThreeJS();
            if (typeof window.build3DEnvironment === 'function') window.build3DEnvironment();
            if (typeof window.initMinimap === 'function') window.initMinimap();
            if (typeof window.initUIPreview === 'function') window.initUIPreview(); 
            initInventoryUI(); 
            addChatMessage('Welcome to the prototype.', 'game');
            addChatMessage('Tip: Left-click to move. Right-click for actions.', 'info');
            addChatMessage('QA loadouts: type /qa help in chat.', 'info');
            initChatInput();
            if (typeof initMotionDebugPanel === 'function') initMotionDebugPanel();
            if (typeof initPoseEditor === 'function') initPoseEditor();
            // Input Listeners
            window.addEventListener('keydown', (e) => {
                if (e.target && e.target.id === 'chat-input') return;
                const k = e.key.toLowerCase();
                if (keys.hasOwnProperty(k)) keys[k] = true;
                if (e.key === 'Escape' && isBankOpen) closeBank();
            });
            window.addEventListener('keyup', (e) => {
                if (e.target && e.target.id === 'chat-input') return;
                const k = e.key.toLowerCase();
                if (keys.hasOwnProperty(k)) keys[k] = false;
            });
            
            const runBtn = document.getElementById('runToggleBtn');
            runBtn.addEventListener('click', () => {
                isRunning = !isRunning;
                if (isRunning) {
                    runBtn.title = 'Run Mode: ON'; runBtn.classList.replace('bg-gray-700', 'bg-green-600'); runBtn.classList.replace('hover:bg-gray-600', 'hover:bg-green-500');
                } else {
                    runBtn.title = 'Run Mode: OFF'; runBtn.classList.replace('bg-green-600', 'bg-gray-700'); runBtn.classList.replace('hover:bg-green-500', 'hover:bg-gray-600');
                }
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
















































