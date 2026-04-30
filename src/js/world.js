// --- Rest of ThreeJS & Engine Init ---
        let activeRoofVisuals = [];

        const worldProceduralRuntime = window.WorldProceduralRuntime || null;
        const worldRenderRuntime = window.WorldRenderRuntime || null;
        const worldSharedAssetsRuntime = window.WorldSharedAssetsRuntime || null;
        const worldWaterRuntime = window.WorldWaterRuntime || null;
        const worldGroundItemRenderRuntime = window.WorldGroundItemRenderRuntime || null;
        const worldGroundItemLifecycleRuntime = window.WorldGroundItemLifecycleRuntime || null;
        const worldNpcRenderRuntime = window.WorldNpcRenderRuntime || null;
        const worldStructureRenderRuntime = window.WorldStructureRenderRuntime || null;
        const worldTreeNodeRuntime = window.WorldTreeNodeRuntime || null;
        const worldTreeRenderRuntime = window.WorldTreeRenderRuntime || null;
        const worldTreeLifecycleRuntime = window.WorldTreeLifecycleRuntime || null;
        const worldRockNodeRuntime = window.WorldRockNodeRuntime || null;
        const worldRockRenderRuntime = window.WorldRockRenderRuntime || null;
        const worldRockLifecycleRuntime = window.WorldRockLifecycleRuntime || null;
        const worldFireRenderRuntime = window.WorldFireRenderRuntime || null;
        const worldFireLifecycleRuntime = window.WorldFireLifecycleRuntime || null;
        const worldTrainingLocationRuntime = window.WorldTrainingLocationRuntime || null;
        const playerHitpointsRuntime = window.PlayerHitpointsRuntime || null;
        const worldChunkTerrainRuntime = window.WorldChunkTerrainRuntime || null;
        const worldChunkTierRenderRuntime = window.WorldChunkTierRenderRuntime || null;
        const worldChunkResourceRenderRuntime = window.WorldChunkResourceRenderRuntime || null;
        const worldMiningPoseReferenceRuntime = window.WorldMiningPoseReferenceRuntime || null;
        const worldTownNpcRuntime = window.WorldTownNpcRuntime || null;
        const applyColorTextureSettings = worldProceduralRuntime.applyColorTextureSettings;
        const clamp01 = worldProceduralRuntime.clamp01;
        const lerpNumber = worldProceduralRuntime.lerpNumber;
        const smoothstep = worldProceduralRuntime.smoothstep;
        const hash2D = worldProceduralRuntime.hash2D;
        const sampleFractalNoise2D = worldProceduralRuntime.sampleFractalNoise2D;
        const buildGrassTextureCanvas = worldProceduralRuntime.buildGrassTextureCanvas;
        const buildDirtTextureCanvas = worldProceduralRuntime.buildDirtTextureCanvas;
        const MAIN_DIRECTIONAL_SHADOW_CONFIG = worldRenderRuntime.MAIN_DIRECTIONAL_SHADOW_CONFIG;

        const PIER_DECK_TOP_HEIGHT = 0.28;
        const PIER_DECK_THICKNESS = 0.14;
        const PIER_WATER_SURFACE_HEIGHT = -0.075;

        function getWaterMaterialCaches() {
            return worldRenderRuntime.getWaterMaterialCaches(sharedMaterials);
        }

        function getWaterSurfaceMaterial(tokens) {
            return worldRenderRuntime.getWaterSurfaceMaterial({ THREE, sharedMaterials, tokens });
        }

        function getWaterShoreMaterial(tokens) {
            return worldRenderRuntime.getWaterShoreMaterial({ THREE, sharedMaterials, tokens });
        }

        function updateMainDirectionalShadowFocus(focusX, focusY, focusZ) {
            worldRenderRuntime.updateMainDirectionalShadowFocus(sharedMaterials, focusX, focusY, focusZ);
        }

        function initSkyRuntime() {
            return worldRenderRuntime.initSkyRuntime({
                THREE,
                scene,
                camera,
                sharedMaterials,
                buildSkyCloudNoiseCanvas: worldProceduralRuntime.buildSkyCloudNoiseCanvas,
                shadowConfig: MAIN_DIRECTIONAL_SHADOW_CONFIG
            });
        }

        function updateSkyRuntime(cameraPosition, frameNowMs) {
            worldRenderRuntime.updateSkyRuntime(sharedMaterials, cameraPosition, frameNowMs);
        }

        function initSharedAssets() {
            worldSharedAssetsRuntime.initSharedAssets({
                THREE,
                document,
                renderer,
                chunkSize: CHUNK_SIZE,
                sharedGeometries,
                sharedMaterials,
                applyColorTextureSettings,
                buildGrassTextureCanvas,
                buildDirtTextureCanvas,
                getWaterMaterialCaches
            });
        }

        function buildMiningPoseReferenceRuntimeContext() {
            return {
                THREE,
                document,
                scene,
                playerState,
                playerRig,
                mapSize: MAP_SIZE,
                playerShoulderPivot: PLAYER_SHOULDER_PIVOT,
                applyColorTextureSettings,
                getTileHeightSafe,
                now: () => performance.now(),
                buildAppearanceFromEquipment: typeof buildAppearanceFromEquipment === 'function' ? buildAppearanceFromEquipment : null,
                createPlayerRigFromAppearance: typeof createPlayerRigFromAppearance === 'function' ? createPlayerRigFromAppearance : null,
                createPlayerRigFromCurrentAppearance: typeof createPlayerRigFromCurrentAppearance === 'function' ? createPlayerRigFromCurrentAppearance : null
            };
        }

        function buildTownNpcRuntimeContext() {
            return {
                TileId,
                doorsToRender,
                getTileHeightSafe,
                isWalkableTileId: typeof window.isWalkableTileId === 'function' ? window.isWalkableTileId : null,
                logicalMap,
                mapSize: MAP_SIZE,
                now: () => performance.now(),
                npcsToRender,
                NpcDialogueRuntime: window.NpcDialogueRuntime || null,
                playerState,
                TutorialRuntime: window.TutorialRuntime || null,
                updateMinimapCanvas
            };
        }

        function rememberStaticNpcBaseTile(x, y, z, tileId) {
            worldTownNpcRuntime.rememberStaticNpcBaseTile(x, y, z, tileId);
        }

        function getVisualTileId(tileId, x, y, z) {
            return worldTownNpcRuntime.getVisualTileId(TileId, tileId, x, y, z);
        }

        function isFenceConnectorTile(tileId) {
            return worldTownNpcRuntime.isFenceConnectorTile(TileId, tileId);
        }

        function getDoorClosedTileId(door) {
            return worldTownNpcRuntime.getDoorClosedTileId(TileId, door);
        }

        function getDoorOpenTileId(door) {
            return worldTownNpcRuntime.getDoorOpenTileId(TileId, door);
        }

        function getTileHeightSafe(x, y, z = 0) {
            if (!heightMap || !heightMap[z] || !heightMap[z][y]) return 0;
            const h = heightMap[z][y][x];
            return Number.isFinite(h) ? h : 0;
        }

        function hashTownNpcSeed(text) {
            return worldTownNpcRuntime.hashTownNpcSeed(text);
        }

        function resolveTownNpcDefaultFacingYaw(npc) {
            return worldTownNpcRuntime.resolveTownNpcDefaultFacingYaw(npc);
        }

        function clearTownNpcRenderBindings(actor) {
            worldTownNpcRuntime.clearTownNpcRenderBindings(actor);
        }

        function isTutorialGateLocked(door) {
            return worldTownNpcRuntime.isTutorialGateLocked(buildTownNpcRuntimeContext(), door);
        }

        function refreshTutorialGateStates() {
            worldTownNpcRuntime.refreshTutorialGateStates(buildTownNpcRuntimeContext());
        }

        window.refreshTutorialGateStates = refreshTutorialGateStates;
        window.isTutorialGateLocked = isTutorialGateLocked;

        function updateWorldNpcRuntime(frameNowMs) {
            worldTownNpcRuntime.updateWorldNpcRuntime(buildTownNpcRuntimeContext(), frameNowMs);
        }

        function spawnMiningPoseReferences() {
            worldMiningPoseReferenceRuntime.spawnMiningPoseReferences(buildMiningPoseReferenceRuntimeContext());
        }

        function updateMiningPoseReferences(frameNowMs) {
            worldMiningPoseReferenceRuntime.updateMiningPoseReferences(Object.assign(
                buildMiningPoseReferenceRuntimeContext(),
                { frameNowMs }
            ));
        }

        function initThreeJS() {
            const container = document.getElementById('canvas-container');
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x5ea8f7);
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 260);
            scene.fog = null;
            renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = !!MAIN_DIRECTIONAL_SHADOW_CONFIG.enabled;
            renderer.shadowMap.type = THREE.BasicShadowMap;
            container.appendChild(renderer.domElement);
            initSkyRuntime();
            scene.add(new THREE.HemisphereLight(0xfff2d6, 0xb0c29a, 1.08));
            scene.add(new THREE.AmbientLight(0xffffff, 0.88));
            const dirLight = new THREE.DirectionalLight(0xffefc0, 1.18);
            const dirLightTarget = new THREE.Object3D();
            scene.add(dirLightTarget);
            dirLight.target = dirLightTarget;
            dirLight.castShadow = !!MAIN_DIRECTIONAL_SHADOW_CONFIG.enabled;
            dirLight.shadow.mapSize.width = MAIN_DIRECTIONAL_SHADOW_CONFIG.mapSize;
            dirLight.shadow.mapSize.height = MAIN_DIRECTIONAL_SHADOW_CONFIG.mapSize;
            dirLight.shadow.camera.left = -MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.right = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.top = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.bottom = -MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraHalfSize;
            dirLight.shadow.camera.near = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraNear;
            dirLight.shadow.camera.far = MAIN_DIRECTIONAL_SHADOW_CONFIG.cameraFar;
            dirLight.shadow.bias = MAIN_DIRECTIONAL_SHADOW_CONFIG.bias;
            dirLight.shadow.normalBias = MAIN_DIRECTIONAL_SHADOW_CONFIG.normalBias;
            dirLight.shadow.camera.updateProjectionMatrix();
            scene.add(dirLight);
            sharedMaterials.mainDirectionalShadowConfig = MAIN_DIRECTIONAL_SHADOW_CONFIG;
            sharedMaterials.mainDirectionalShadowLight = dirLight;
            sharedMaterials.mainDirectionalShadowTarget = dirLightTarget;
            sharedMaterials.shadowFocusRevision = Number.isFinite(sharedMaterials.shadowFocusRevision)
                ? sharedMaterials.shadowFocusRevision + 1
                : 1;
            const fillLight = new THREE.DirectionalLight(0xcadbe2, 0.3);
            fillLight.position.set(-20, 22, -16);
            scene.add(fillLight);
            playerRig = createPlayerRigFromCurrentAppearance();
            scene.add(playerRig);
            updateMainDirectionalShadowFocus(playerState.x, 0, playerState.y);
            updateSkyRuntime(camera.position, performance.now());
            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();
            window.addEventListener('resize', onWindowResize, false);
            renderer.domElement.addEventListener('mousedown', onPointerDown, false);
            window.addEventListener('mousemove', onPointerMove, false);
            window.addEventListener('mouseup', onPointerUp, false);
            renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
            renderer.domElement.addEventListener('contextmenu', onContextMenu, false);
        }

        function initUIPreview() {
            const container = document.getElementById('player-preview-box');
            uiScene = new THREE.Scene();
            const width = 110; const height = 150;
            uiCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
            uiCamera.position.set(0, 1.2, 4.5); 
            uiCamera.lookAt(0, 0.8, 0); 
            uiRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
            uiRenderer.setSize(width, height);
            uiRenderer.outputColorSpace = THREE.SRGBColorSpace;
            uiRenderer.domElement.style.margin = 'auto'; 
            container.appendChild(uiRenderer.domElement);
            uiScene.add(new THREE.HemisphereLight(0xfff4de, 0xb6c7a2, 0.9));
            uiScene.add(new THREE.AmbientLight(0xffffff, 1.0));
            const dirLight = new THREE.DirectionalLight(0xffefc8, 0.9);
            dirLight.position.set(2, 5, 3);
            uiScene.add(dirLight);
            uiPlayerRig = createPlayerRigFromCurrentAppearance();
            uiPlayerRig.position.set(0, -0.2, 0); 
            uiPlayerRig.rotation.y = -Math.PI / 8; 
            uiScene.add(uiPlayerRig);
            let isDraggingPreview = false; let lastPreviewMouseX = 0;
            container.addEventListener('mousedown', (e) => {
                if (e.button === 1) { e.preventDefault(); isDraggingPreview = true; lastPreviewMouseX = e.clientX; }
            });
            window.addEventListener('mousemove', (e) => {
                if (isDraggingPreview && uiPlayerRig) {
                    uiPlayerRig.rotation.y += (e.clientX - lastPreviewMouseX) * 0.02;
                    lastPreviewMouseX = e.clientX;
                }
            });
            window.addEventListener('mouseup', (e) => { if (e.button === 1) isDraggingPreview = false; });
            container.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
        }

        function showXPDrop(skill, amount) {
            const container = document.getElementById('xp-drop-container');
            const drop = document.createElement('div');
            drop.className = 'xp-drop text-[#ff9800] font-bold text-md';
            drop.innerText = `${skill} +${amount}xp`;
            container.appendChild(drop);
            setTimeout(() => drop.remove(), 2000); 
        }

        function spawnHitsplat(amount, gridX, gridY) {
            const el = document.createElement('div');
            el.className = 'hitsplat';
            
            const redSplat = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M50 0 L65 30 L100 30 L75 55 L85 100 L50 75 L15 100 L25 55 L0 30 L35 30 Z\" fill=\"%23ef4444\"/></svg>')";
            const blueShield = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M10 20 L50 0 L90 20 L90 60 L50 100 L10 60 Z\" fill=\"%233b82f6\"/></svg>')";
            
            el.style.backgroundImage = amount > 0 ? redSplat : blueShield;
            el.innerText = amount;
            document.body.appendChild(el);
            
            // Adjust hitsplat visual height for planes
            const visualZOffset = playerState.z * 3.0;
            const targetHeight = heightMap[playerState.z] && heightMap[playerState.z][gridY] && heightMap[playerState.z][gridY][gridX] ? heightMap[playerState.z][gridY][gridX] : 0;
            const worldPos = new THREE.Vector3(gridX, targetHeight + visualZOffset + 1.2, gridY);
            
            activeHitsplats.push({ el, worldPos, createdAt: Date.now() });
        }

        function playLevelUpAnimation(type, target) {
            if (type === 8) { 
                const group = new THREE.Group(); group.position.copy(target.position);
                for(let i=0; i<40; i++) {
                    const isCW = i < 20;
                    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({color: isCW ? 0x00ffff : 0xff00ff}));
                    orb.userData.angleOffset = isCW ? 0 : Math.PI; 
                    orb.userData.dir = isCW ? 1 : -1;
                    group.add(orb);
                }
                scene.add(group); levelUpAnimations.push({ mesh: group, start: Date.now(), type: 8, target: target });
            } 
        }

        function updateCombatStyleButtonState(button, active) {
            if (!button) return;
            button.classList.toggle('bg-[#5a311d]', active);
            button.classList.toggle('border-[#ffcf8b]', active);
            button.classList.toggle('text-[#ffcf8b]', active);
            button.classList.toggle('bg-[#111418]', !active);
            button.classList.toggle('border-[#3a444c]', !active);
            button.classList.toggle('text-[#c8aa6e]', !active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        }

        function updateCombatTab(combatTabViewModel) {
            const combatLevelEl = document.getElementById('combat-level-value');
            if (!combatLevelEl || !combatTabViewModel) return;

            combatLevelEl.innerText = combatTabViewModel.combatLevelText;
            document.getElementById('combat-level-formula').innerText = combatTabViewModel.combatLevelFormulaText;
            document.getElementById('combat-style-current').innerText = combatTabViewModel.selectedStyleLabel;
            document.getElementById('combat-style-effect').innerText = combatTabViewModel.selectedStyleDescription;
            document.getElementById('combat-skill-attack').innerText = combatTabViewModel.attackLevel;
            document.getElementById('combat-skill-strength').innerText = combatTabViewModel.strengthLevel;
            document.getElementById('combat-skill-defense').innerText = combatTabViewModel.defenseLevel;
            document.getElementById('combat-skill-hitpoints').innerText = combatTabViewModel.hitpointsLevel;
            document.getElementById('combat-roll-attack').innerText = combatTabViewModel.combatStats.attack;
            document.getElementById('combat-roll-defense').innerText = combatTabViewModel.combatStats.defense;
            document.getElementById('combat-max-hit').innerText = combatTabViewModel.combatStats.strength;

            const styleOptionsById = Object.fromEntries((combatTabViewModel.styleOptions || []).map((entry) => [entry.styleId, entry]));
            updateCombatStyleButtonState(document.getElementById('combat-style-attack'), !!(styleOptionsById.attack && styleOptionsById.attack.active));
            updateCombatStyleButtonState(document.getElementById('combat-style-strength'), !!(styleOptionsById.strength && styleOptionsById.strength.active));
            updateCombatStyleButtonState(document.getElementById('combat-style-defense'), !!(styleOptionsById.defense && styleOptionsById.defense.active));
        }

        function updateInventoryHitpointsHud() {
            const hitpointsTextEl = document.getElementById('inventory-hitpoints-text');
            const hitpointsBarFillEl = document.getElementById('inventory-hitpoints-bar-fill');
            if (!hitpointsTextEl || !hitpointsBarFillEl) return;

            const currentHitpoints = getCurrentHitpoints();
            const maxHitpoints = getMaxHitpoints();
            const hitpointsLevel = playerSkills && playerSkills.hitpoints && Number.isFinite(playerSkills.hitpoints.level)
                ? Math.max(1, Math.floor(playerSkills.hitpoints.level))
                : maxHitpoints;
            const fillPercent = Math.max(0, Math.min(100, (currentHitpoints / Math.max(1, maxHitpoints)) * 100));

            hitpointsTextEl.innerText = `${currentHitpoints} / ${hitpointsLevel}`;
            hitpointsBarFillEl.style.width = `${fillPercent}%`;
        }

        function updateStats() {
            const uiDomainRuntime = window.UiDomainRuntime || null;
            const combatTabViewModel = uiDomainRuntime && typeof uiDomainRuntime.buildCombatTabViewModel === 'function'
                ? uiDomainRuntime.buildCombatTabViewModel({ playerSkills, equipment, playerState })
                : null;
            const statsViewModel = combatTabViewModel && combatTabViewModel.combatStats
                ? combatTabViewModel.combatStats
                : (uiDomainRuntime && typeof uiDomainRuntime.buildCombatStatsViewModel === 'function'
                    ? uiDomainRuntime.buildCombatStatsViewModel({ playerSkills, equipment, playerState })
                    : { attack: 0, defense: 0, strength: 0 });
            document.getElementById('stat-atk').innerText = statsViewModel.attack;
            document.getElementById('stat-def').innerText = statsViewModel.defense;
            document.getElementById('stat-str').innerText = statsViewModel.strength;
            updateInventoryHitpointsHud();
            updateCombatTab(combatTabViewModel);
        }

        function buildPlayerHitpointsRuntimeContext() {
            return {
                combatRuntime: window.CombatRuntime || null,
                playerSkills,
                playerState
            };
        }

        function getMaxHitpoints() {
            return playerHitpointsRuntime.getMaxHitpoints(buildPlayerHitpointsRuntimeContext());
        }

        function getCurrentHitpoints() {
            return playerHitpointsRuntime.getCurrentHitpoints(buildPlayerHitpointsRuntimeContext());
        }

        function applyHitpointHealing(healAmount) {
            return playerHitpointsRuntime.applyHitpointHealing(buildPlayerHitpointsRuntimeContext(), healAmount);
        }

        function applyHitpointDamage(damageAmount, minHitpoints = 0) {
            return playerHitpointsRuntime.applyHitpointDamage(buildPlayerHitpointsRuntimeContext(), damageAmount, minHitpoints);
        }

        function didAttackOrCastThisTick() {
            const attackedThisTick = (
                Number.isFinite(playerState.lastAttackTick) && playerState.lastAttackTick === currentTick
            );

            const actionName = typeof playerState.action === 'string' ? playerState.action.toUpperCase() : '';
            const castedThisTick = (
                Number.isFinite(playerState.lastCastTick) && playerState.lastCastTick === currentTick
            ) || actionName.startsWith('CAST:') || actionName.startsWith('CASTING:');

            return attackedThisTick || castedThisTick;
        }

        function markPlayerCastTick(tick = currentTick) {
            const resolvedTick = Number.isFinite(tick) ? Math.floor(tick) : currentTick;
            playerState.lastCastTick = resolvedTick;
        }
        window.markPlayerCastTick = markPlayerCastTick;

        const MAX_SKILL_LEVEL = 99;
        const MAX_REASONABLE_EAT_COOLDOWN_TICKS = 10;
        const DEFAULT_FIRE_LIFETIME_TICKS = 90;
        const ASHES_DESPAWN_TICKS = 100;

        function resolveFireLifetimeTicks() {
            const firemakingRecipes = (window.SkillSpecRegistry && typeof SkillSpecRegistry.getRecipeSet === 'function')
                ? SkillSpecRegistry.getRecipeSet('firemaking')
                : null;
            const recipeFromRegistry = firemakingRecipes && firemakingRecipes.logs ? firemakingRecipes.logs : null;
            if (recipeFromRegistry && Number.isFinite(recipeFromRegistry.fireLifetimeTicks)) {
                return Math.max(1, Math.floor(recipeFromRegistry.fireLifetimeTicks));
            }

            const firemakingSpec = window.SkillSpecs && window.SkillSpecs.skills ? window.SkillSpecs.skills.firemaking : null;
            const fallbackRecipe = firemakingSpec && firemakingSpec.recipeSet ? firemakingSpec.recipeSet.logs : null;
            if (fallbackRecipe && Number.isFinite(fallbackRecipe.fireLifetimeTicks)) {
                return Math.max(1, Math.floor(fallbackRecipe.fireLifetimeTicks));
            }

            return DEFAULT_FIRE_LIFETIME_TICKS;
        }

        const FIRE_LIFETIME_TICKS = resolveFireLifetimeTicks();

        function getXpForLevel(level) {
            const clamped = Math.max(1, Math.min(MAX_SKILL_LEVEL, level));
            let points = 0;
            for (let lvl = 1; lvl < clamped; lvl++) {
                points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
            }
            return Math.floor(points / 4);
        }

        function getLevelForXp(xp) {
            let level = 1;
            for (let lvl = 2; lvl <= MAX_SKILL_LEVEL; lvl++) {
                if (xp >= getXpForLevel(lvl)) level = lvl;
                else break;
            }
            return level;
        }

        Object.keys(playerSkills).forEach((skillName) => {
            playerSkills[skillName].level = getLevelForXp(playerSkills[skillName].xp);
        });

        function getSkillUiLevelKey(skillName) {
            if (!skillName) return null;
            const manifest = window.SkillManifest;
            if (manifest && manifest.skillTileBySkillId && manifest.skillTileBySkillId[skillName]) {
                const levelKey = manifest.skillTileBySkillId[skillName].levelKey;
                if (typeof levelKey === 'string' && levelKey) return levelKey;
            }

            const keyBySkill = {
                attack: 'atk',
                hitpoints: 'hp',
                mining: 'min',
                strength: 'str',
                defense: 'def',
                woodcutting: 'wc',
                firemaking: 'fm',
                fishing: 'fish',
                cooking: 'cook',
                runecrafting: 'rc',
                smithing: 'smith',
                crafting: 'craft',
                fletching: 'fletch'
            };
            return keyBySkill[skillName] || null;
        }

        function refreshSkillUi(skillName) {
            const key = getSkillUiLevelKey(skillName);
            if (!key || !playerSkills[skillName]) return;

            const uiEl = document.getElementById(`stat-${key}-level`);
            if (uiEl) uiEl.innerText = playerSkills[skillName].level;

            if (typeof updateSkillProgressPanel === 'function') {
                updateSkillProgressPanel(skillName);
            }
        }
        function addSkillXp(skillName, amount) {
            if (playerSkills[skillName]) {
                const oldLevel = playerSkills[skillName].level;
                playerSkills[skillName].xp += amount;
                playerSkills[skillName].level = getLevelForXp(playerSkills[skillName].xp);
                showXPDrop(skillName, amount);
                if (playerSkills[skillName].level > oldLevel) {
                    playLevelUpAnimation(8, playerRig);
                    addChatMessage(`${skillName} level is now ${playerSkills[skillName].level}.`, 'info');
                }
                refreshSkillUi(skillName);
            }
        }

        function giveItem(itemData, amount = 1) {
            if (itemData.stackable) {
                const existingIdx = inventory.findIndex(s => s && s.itemData.id === itemData.id);
                if (existingIdx !== -1) {
                    inventory[existingIdx].amount += amount;
                    renderInventory(); return amount;
                }
                const emptyIdx = inventory.indexOf(null);
                if (emptyIdx !== -1) {
                    inventory[emptyIdx] = { itemData: itemData, amount: amount }; renderInventory(); return amount;
                } else return 0;
            } else {
                let itemsGiven = 0;
                for (let i = 0; i < amount; i++) {
                    const emptyIdx = inventory.indexOf(null);
                    if (emptyIdx !== -1) {
                        inventory[emptyIdx] = { itemData: itemData, amount: 1 };
                        itemsGiven++;
                    } else break;
                }
                if (itemsGiven > 0) renderInventory();
                return itemsGiven;
            }
        }
        function getInventoryCount(itemId) {
            return inventory.reduce((sum, slot) => {
                if (!slot || slot.itemData.id !== itemId) return sum;
                return sum + slot.amount;
            }, 0);
        }

        function getFirstInventorySlotByItemId(itemId) {
            if (!itemId) return -1;
            for (let i = 0; i < inventory.length; i++) {
                const slot = inventory[i];
                if (!slot || !slot.itemData) continue;
                if (slot.itemData.id === itemId && slot.amount > 0) return i;
            }
            return -1;
        }

        function removeOneItemById(itemId) {
            for (let i = 0; i < inventory.length; i++) {
                const slot = inventory[i];
                if (!slot || slot.itemData.id !== itemId) continue;

                slot.amount -= 1;
                if (slot.amount <= 0) inventory[i] = null;

                if (selectedUse.invIndex === i) {
                    clearSelectedUse(false);
                }
                return true;
            }
            return false;
        }

        function removeItemsById(itemId, amount) {
            if (!itemId || amount <= 0) return 0;
            let removed = 0;

            for (let i = 0; i < inventory.length && removed < amount; i++) {
                const slot = inventory[i];
                if (!slot || slot.itemData.id !== itemId) continue;

                const take = Math.min(slot.amount, amount - removed);
                slot.amount -= take;
                removed += take;

                if (slot.amount <= 0) inventory[i] = null;
                if (selectedUse.invIndex === i && (!inventory[i] || inventory[i].itemData.id !== selectedUse.itemId)) {
                    clearSelectedUse(false);
                }
            }

            return removed;
        }

        function buildFireLifecycleRuntimeContext() {
            return {
                THREE,
                TileId,
                ITEM_DB,
                SkillRuntime: window.SkillRuntime || null,
                SkillSpecRegistry: window.SkillSpecRegistry || null,
                activeFires,
                addChatMessage,
                ashesDespawnTicks: ASHES_DESPAWN_TICKS,
                chunkSize: CHUNK_SIZE,
                cookingFireSpotsToRender,
                currentTick,
                environmentMeshes,
                fireLifetimeTicks: FIRE_LIFETIME_TICKS,
                getWorldChunkSceneRuntime,
                heightMap,
                isWalkableTileId,
                logicalMap,
                mapSize: MAP_SIZE,
                playerState,
                scene,
                spawnGroundItem,
                worldFireRenderRuntime,
                worldGroundItemRenderRuntime
            };
        }

        function isFireOccupiedAt(x, y, z) {
            return worldFireLifecycleRuntime.isFireOccupiedAt(buildFireLifecycleRuntimeContext(), x, y, z);
        }

        function syncFiremakingLogPreview() {
            worldFireLifecycleRuntime.syncFiremakingLogPreview(buildFireLifecycleRuntimeContext());
        }

        function spawnFireAtTile(x, y, z, options = {}) {
            return worldFireLifecycleRuntime.spawnFireAtTile(buildFireLifecycleRuntimeContext(), x, y, z, options);
        }

        function seedCookingTrainingFires() {
            worldFireLifecycleRuntime.seedCookingTrainingFires(buildFireLifecycleRuntimeContext());
        }

        function lightFireAtCurrentTile(x = playerState.x, y = playerState.y, z = playerState.z) {
            return worldFireLifecycleRuntime.lightFireAtCurrentTile(buildFireLifecycleRuntimeContext(), x, y, z);
        }

        function expireFireAtIndex(index) {
            return worldFireLifecycleRuntime.expireFireAtIndex(buildFireLifecycleRuntimeContext(), index);
        }

        function tickFireLifecycle() {
            worldFireLifecycleRuntime.tickFireLifecycle(buildFireLifecycleRuntimeContext());
        }

        function updateFires(frameNow) {
            worldFireLifecycleRuntime.updateFires(buildFireLifecycleRuntimeContext(), frameNow);
        }

        function buildGroundItemLifecycleRuntimeContext() {
            return {
                THREE,
                activeFires,
                chunkSize: CHUNK_SIZE,
                clearSelectedUse,
                createEquipmentVisualMeshes: typeof window.createEquipmentVisualMeshes === 'function'
                    ? window.createEquipmentVisualMeshes
                    : null,
                createPixelSourceVisualMeshes: typeof window.createPixelSourceVisualMeshes === 'function'
                    ? window.createPixelSourceVisualMeshes
                    : null,
                currentTick,
                environmentMeshes,
                fetchImpl: typeof fetch === 'function' ? fetch.bind(window) : null,
                getWorldChunkSceneRuntime,
                giveItem,
                groundItems,
                heightMap,
                inventory,
                now: () => Date.now(),
                playerState,
                random: () => Math.random(),
                renderInventory,
                scene,
                selectedUse,
                sharedMaterials,
                worldGroundItemRenderRuntime
            };
        }

        function removeGroundItemEntryAt(index) {
            return worldGroundItemLifecycleRuntime.removeGroundItemEntryAt(buildGroundItemLifecycleRuntimeContext(), index);
        }

        function updateGroundItems() {
            worldGroundItemLifecycleRuntime.updateGroundItems(buildGroundItemLifecycleRuntimeContext());
        }

        function findFireStepDestination() {
            return worldFireLifecycleRuntime.findFireStepDestination(buildFireLifecycleRuntimeContext());
        }

        function applyFireStepDestination(stepResult) {
            return worldFireLifecycleRuntime.applyFireStepDestination(buildFireLifecycleRuntimeContext(), stepResult);
        }

        function tryStepAfterFire() {
            return worldFireLifecycleRuntime.tryStepAfterFire(buildFireLifecycleRuntimeContext());
        }

        function tryStepBeforeFiremaking() {
            return worldFireLifecycleRuntime.tryStepBeforeFiremaking(buildFireLifecycleRuntimeContext());
        }

        function startFiremaking(sourceItemId = null) {
            return worldFireLifecycleRuntime.startFiremaking(buildFireLifecycleRuntimeContext(), sourceItemId);
        }

        function getFiremakingLogItemIdForPair(itemA, itemB) {
            return worldFireLifecycleRuntime.getFiremakingLogItemIdForPair(buildFireLifecycleRuntimeContext(), itemA, itemB);
        }

        function resolveFireTargetFromHit(hitData) {
            return worldFireLifecycleRuntime.resolveFireTargetFromHit(buildFireLifecycleRuntimeContext(), hitData);
        }

        function debugCookingUse(message) {
            if (!window.DEBUG_COOKING_USE) return;
            const text = `[cook-debug] ${message}`;
            try { console.log(text); } catch (_) {}
            if (typeof addChatMessage === 'function') addChatMessage(text, 'info');
        }

                function createRunecraftingPouchContext() {
            return {
                playerState,
                getSkillLevel: (skillId) => (playerSkills && playerSkills[skillId] ? playerSkills[skillId].level : 1),
                getInventoryCount,
                removeItemsById,
                giveItemById: (itemId, amount) => {
                    if (!ITEM_DB[itemId]) return 0;
                    return giveItem(ITEM_DB[itemId], amount);
                },
                addChatMessage,
                renderInventory
            };
        }

        function tryUseItemOnInventory(sourceInvIndex, targetInvIndex) {
            const source = inventory[sourceInvIndex];
            const target = inventory[targetInvIndex];
            if (!source || !target) return false;

            const a = source.itemData.id;
            const b = target.itemData.id;

            if (window.RunecraftingPouchRuntime && typeof window.RunecraftingPouchRuntime.tryUseItemOnInventory === 'function') {
                const pouchUsed = window.RunecraftingPouchRuntime.tryUseItemOnInventory(createRunecraftingPouchContext(), a, b);
                if (pouchUsed) return true;
            }

            if (window.SkillRuntime && typeof SkillRuntime.tryUseItemOnTarget === 'function') {
                const skillUsed = SkillRuntime.tryUseItemOnTarget({
                    targetObj: 'INVENTORY',
                    targetUid: {
                        sourceInvIndex,
                        targetInvIndex,
                        sourceItemId: a,
                        targetItemId: b
                    },
                    sourceInvIndex,
                    sourceItemId: a
                });
                if (skillUsed) return true;
            }

            const firemakingSourceItemId = getFiremakingLogItemIdForPair(a, b);
            if (firemakingSourceItemId) {
                return startFiremaking(firemakingSourceItemId);
            }

            return false;
        }

        function tryUseItemOnWorld(sourceInvIndex, hitData) {
            const source = inventory[sourceInvIndex];
            if (!source || !hitData) return false;

            // Non-skill use-on-world interactions can be added here.
            // Skill item interactions are routed through SkillRuntime.tryUseItemOnTarget.
            return false;
        }

        function handleInventorySlotClick(invIndex) {
            const selected = getSelectedUseItem();

            if (selected) {
                if (selectedUse.invIndex !== invIndex && tryUseItemOnInventory(selectedUse.invIndex, invIndex)) {
                    clearSelectedUse();
                    return;
                }
                // A selected Use should always consume the next click.
                clearSelectedUse();
                return;
            }

            const slot = inventory[invIndex];
            if (!slot) return;
            const prefKey = (typeof getItemMenuPreferenceKey === 'function')
                ? getItemMenuPreferenceKey('inventory', slot.itemData.id)
                : null;
            handleItemAction(invIndex, resolveDefaultItemAction(slot.itemData, prefKey));
        }
        function eatItem(invIndex) {
            const invSlot = inventory[invIndex];
            if (!invSlot || !invSlot.itemData) return;

            const item = invSlot.itemData;
            const healAmount = Number.isFinite(item.healAmount) ? Math.max(0, Math.floor(item.healAmount)) : 0;
            const eatDelayTicks = Number.isFinite(item.eatDelayTicks) ? Math.max(1, Math.floor(item.eatDelayTicks)) : 0;
            if (item.type !== 'food' || healAmount <= 0 || eatDelayTicks <= 0) {
                addChatMessage("You can't eat that.", 'warn');
                return;
            }

            let cooldownEndTick = Number.isFinite(playerState.eatingCooldownEndTick)
                ? Math.floor(playerState.eatingCooldownEndTick)
                : 0;
            if ((cooldownEndTick - currentTick) > MAX_REASONABLE_EAT_COOLDOWN_TICKS) {
                cooldownEndTick = currentTick;
                playerState.eatingCooldownEndTick = currentTick;
            }
            if (currentTick < cooldownEndTick) {
                const remainingTicks = cooldownEndTick - currentTick;
                addChatMessage(`You need to wait ${remainingTicks} tick${remainingTicks === 1 ? '' : 's'} before eating again.`, 'warn');
                return;
            }

            if (didAttackOrCastThisTick()) {
                addChatMessage('You cannot eat on the same tick as attacking or casting.', 'warn');
                return;
            }

            invSlot.amount -= 1;
            if (invSlot.amount <= 0) inventory[invIndex] = null;
            if (selectedUse.invIndex === invIndex) clearSelectedUse(false);

            const healed = applyHitpointHealing(healAmount);
            playerState.eatingCooldownEndTick = currentTick + eatDelayTicks;

            if (healed > 0) addChatMessage(`You eat the ${item.name}. (+${healed} HP)`, 'game');
            else addChatMessage(`You eat the ${item.name}.`, 'game');
            updateStats();
            renderInventory();
        }

        function handleItemAction(invIndex, actionName) {
            const invSlot = inventory[invIndex];
            if (!invSlot) return;
            const item = invSlot.itemData;
            if (actionName === 'Use') {
                if (window.RunecraftingPouchRuntime && typeof window.RunecraftingPouchRuntime.tryUsePouch === 'function') {
                    const pouchUsed = window.RunecraftingPouchRuntime.tryUsePouch(createRunecraftingPouchContext(), item.id);
                    if (pouchUsed) return;
                }
                selectUseItem(invIndex);
                return;
            }

            if (typeof actionName === 'string' && actionName.startsWith('Empty')) {
                if (window.RunecraftingPouchRuntime && typeof window.RunecraftingPouchRuntime.tryUsePouch === 'function') {
                    const pouchUsed = window.RunecraftingPouchRuntime.tryUsePouch(createRunecraftingPouchContext(), item.id, { forceEmpty: true });
                    if (pouchUsed) return;
                }
            }

            if (actionName === 'Equip') {
                const slotName = (item && item.type && Object.prototype.hasOwnProperty.call(equipment, item.type))
                    ? item.type
                    : ((item && item.weaponClass && Object.prototype.hasOwnProperty.call(equipment, 'weapon')) ? 'weapon' : null);
                if (!slotName) return;
                const requiredAttackLevel = Number.isFinite(item.requiredAttackLevel) ? Math.max(1, Math.floor(item.requiredAttackLevel)) : 0;
                const attackLevel = playerSkills && playerSkills.attack && Number.isFinite(playerSkills.attack.level)
                    ? Math.max(1, Math.floor(playerSkills.attack.level))
                    : 1;
                if (requiredAttackLevel > 0 && attackLevel < requiredAttackLevel) {
                    addChatMessage(`You need Attack level ${requiredAttackLevel} to equip the ${item.name}.`, 'warn');
                    return;
                }
                const requiredFishingLevel = Number.isFinite(item.requiredFishingLevel) ? Math.max(1, Math.floor(item.requiredFishingLevel)) : 0;
                const fishingLevel = playerSkills && playerSkills.fishing && Number.isFinite(playerSkills.fishing.level)
                    ? Math.max(1, Math.floor(playerSkills.fishing.level))
                    : 1;
                if (requiredFishingLevel > 0 && fishingLevel < requiredFishingLevel) {
                    addChatMessage(`You need Fishing level ${requiredFishingLevel} to equip the ${item.name}.`, 'warn');
                    return;
                }
                const requiredDefenseLevel = Number.isFinite(item.requiredDefenseLevel) ? Math.max(1, Math.floor(item.requiredDefenseLevel)) : 0;
                const defenseLevel = playerSkills && playerSkills.defense && Number.isFinite(playerSkills.defense.level)
                    ? Math.max(1, Math.floor(playerSkills.defense.level))
                    : 1;
                if (requiredDefenseLevel > 0 && defenseLevel < requiredDefenseLevel) {
                    addChatMessage(`You need Defense level ${requiredDefenseLevel} to equip the ${item.name}.`, 'warn');
                    return;
                }
                const oldItem = equipment[slotName];
                equipment[slotName] = item; inventory[invIndex] = oldItem ? { itemData: oldItem, amount: 1 } : null;
                clearSelectedUse(false);
                updateStats(); renderInventory(); renderEquipment(); updatePlayerModel();
            } else if (actionName === 'Eat') {
                eatItem(invIndex);
            } else if (actionName === 'Drop') {
                dropItem(invIndex);
            }
        }

        function hasWeaponClassAvailable(weaponClass) {
            if (equipment.weapon && equipment.weapon.weaponClass === weaponClass) return true;
            return inventory.some((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
        }

        function autoEquipWeaponClass(weaponClass) {
            if (equipment.weapon && equipment.weapon.weaponClass === weaponClass) return true;
            const invIndex = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
            if (invIndex === -1) return false;
            const slot = inventory[invIndex];
            if (!slot || !slot.itemData) return false;
            const item = slot.itemData;
            const oldWeapon = equipment.weapon;
            equipment.weapon = item;
            inventory[invIndex] = oldWeapon ? { itemData: oldWeapon, amount: 1 } : null;
            clearSelectedUse(false);
            updateStats(); renderInventory(); renderEquipment(); updatePlayerModel();
            return true;
        }

        function unequipItem(slotName) {
            const item = equipment[slotName];
            if (!item) return;
            const emptyIdx = inventory.indexOf(null);
            if (emptyIdx !== -1) {
                inventory[emptyIdx] = { itemData: item, amount: 1 }; equipment[slotName] = null;
                clearSelectedUse(false);
                updateStats(); renderInventory(); renderEquipment(); updatePlayerModel();
            }
        }

        function addGroundItemVisual(group, itemData) {
            return worldGroundItemLifecycleRuntime.addGroundItemVisual(buildGroundItemLifecycleRuntimeContext(), group, itemData);
        }

        function dropItem(invIndex) {
            return worldGroundItemLifecycleRuntime.dropItem(buildGroundItemLifecycleRuntimeContext(), invIndex);
        }

        function spawnGroundItem(itemData, x, y, z, amount = 1, options = {}) {
            worldGroundItemLifecycleRuntime.spawnGroundItem(buildGroundItemLifecycleRuntimeContext(), itemData, x, y, z, amount, options);
        }

        function takeGroundItemByUid(uid) {
            return worldGroundItemLifecycleRuntime.takeGroundItemByUid(buildGroundItemLifecycleRuntimeContext(), uid);
        }

        // --- THE MULTI-PLANE ENGINE REWRITE ---

        const rockNodeKey = worldRockNodeRuntime.rockNodeKey;
        const treeNodeKey = worldTreeNodeRuntime.treeNodeKey;

        function setTreeNode(x, y, z = 0, nodeId = 'normal_tree', options = {}) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false;
            const tile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
            if (!isTreeTileId(tile)) return false;
            const key = treeNodeKey(x, y, z);
            treeNodes[key] = worldTreeNodeRuntime.createTreeNodeRecord(nodeId, options);
            return true;
        }

        function getTreeNodeAt(x, y, z = playerState.z) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return null;
            const tile = logicalMap[z] && logicalMap[z][y] ? logicalMap[z][y][x] : null;
            if (!isTreeTileId(tile)) return null;
            const key = treeNodeKey(x, y, z);
            if (!treeNodes[key]) treeNodes[key] = worldTreeNodeRuntime.createDefaultTreeNodeRecord();
            return treeNodes[key];
        }

        function rebuildTreeNodes() {
            treeNodes = worldTreeNodeRuntime.rebuildTreeNodes({
                logicalMap,
                existingTreeNodes: treeNodes,
                isTreeTileId,
                planes: PLANES,
                mapSize: MAP_SIZE
            });
        }

        function getTreeVisualProfile(nodeId) {
            return worldTreeRenderRuntime.getTreeVisualProfile(nodeId);
        }

        function createTreeRenderData(count, planeGroup) {
            return worldTreeRenderRuntime.createTreeRenderData({
                THREE,
                sharedGeometries,
                sharedMaterials,
                count,
                planeGroup,
                environmentMeshes
            });
        }

        function setTreeVisualState(tData, treeIndex, options = {}) {
            return worldTreeRenderRuntime.setTreeVisualState({ THREE, tData, treeIndex, options });
        }

        function markTreeVisualsDirty(tData) {
            return worldTreeRenderRuntime.markTreeVisualsDirty(tData);
        }

        function buildTreeLifecycleRuntimeContext() {
            return {
                THREE,
                chunkSize: CHUNK_SIZE,
                currentTick,
                getTreeNodeAt,
                getWorldChunkSceneRuntime,
                heightMap,
                logicalMap,
                markTreeVisualsDirty,
                respawningTrees,
                setTreeVisualState,
                skillSpecRegistry: window.SkillSpecRegistry || null,
                tileIds: TileId,
                worldChunkResourceRenderRuntime
            };
        }

        const getRockDisplayName = worldRockNodeRuntime.getRockDisplayName;
        const getRockColorHex = worldRockNodeRuntime.getRockColorHex;

        const ROCK_VISUAL_ORDER = worldRockRenderRuntime.ROCK_VISUAL_ORDER;

        function getRockVisualProfile(visualId) {
            return worldRockRenderRuntime.getRockVisualProfile(visualId);
        }

        function getRockVisualIdForNode(rockNode, depleted) {
            return worldRockRenderRuntime.getRockVisualIdForNode(rockNode, depleted);
        }

        function createRockRenderData(rockVisualCounts, planeGroup) {
            return worldRockRenderRuntime.createRockRenderData({
                THREE,
                sharedGeometries,
                sharedMaterials,
                rockVisualCounts,
                planeGroup,
                environmentMeshes
            });
        }

        function setRockVisualState(rData, visualId, rockIndex, options) {
            return worldRockRenderRuntime.setRockVisualState(Object.assign({ THREE, rData, visualId, rockIndex }, options));
        }

        function markRockVisualsDirty(rData) {
            return worldRockRenderRuntime.markRockVisualsDirty(rData);
        }

        function buildRockLifecycleRuntimeContext() {
            return {
                chunkSize: CHUNK_SIZE,
                currentTick,
                getWorldChunkSceneRuntime,
                loadChunk,
                logicalMap,
                mapSize: MAP_SIZE,
                planes: PLANES,
                rockAreaGateOverrides,
                rockNodeRuntime: worldRockNodeRuntime,
                rockNodes,
                rockOreOverrides,
                runeEssenceRocks: RUNE_ESSENCE_ROCKS,
                tileIds: TileId,
                unloadChunk
            };
        }

        function rebuildRockNodes() {
            rockNodes = worldRockLifecycleRuntime.rebuildRockNodes(buildRockLifecycleRuntimeContext());
        }

        function getRockNodeAt(x, y, z = playerState.z) {
            return worldRockLifecycleRuntime.getRockNodeAt(buildRockLifecycleRuntimeContext(), x, y, z);
        }

        function isRockNodeDepleted(x, y, z = playerState.z) {
            return worldRockLifecycleRuntime.isRockNodeDepleted(buildRockLifecycleRuntimeContext(), x, y, z);
        }

        function refreshChunkAtTile(x, y) {
            return worldRockLifecycleRuntime.refreshChunkAtTile(buildRockLifecycleRuntimeContext(), x, y);
        }

        function depleteRockNode(x, y, z = playerState.z, respawnTicks = 12) {
            return worldRockLifecycleRuntime.depleteRockNode(buildRockLifecycleRuntimeContext(), x, y, z, respawnTicks);
        }

        function tickRockNodes() {
            return worldRockLifecycleRuntime.tickRockNodes(buildRockLifecycleRuntimeContext());
        }
        function initLogicalMap() {
            rockNodes = {};
            rockOreOverrides = {};
            rockAreaGateOverrides = {};
            RUNE_ESSENCE_ROCKS = [];
            respawningTrees = [];
            treeNodes = {};
            // Re-initialize as 3D Arrays! [z][y][x]
            logicalMap = Array(PLANES).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
            heightMap = Array(PLANES).fill(0).map(() => Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
            
            // Only populate Ground Terrain on Z=0
            worldTownNpcRuntime.resetStaticNpcBaseTiles();
            npcsToRender = [];
            bankBoothsToRender = [];
            doorsToRender = [];
            activeRoofVisuals = [];
            fishingSpotsToRender = [];
            cookingFireSpotsToRender = [];
            directionalSignsToRender = [];
            altarCandidatesToRender = [];
            furnacesToRender = [];
            anvilsToRender = [];
            const worldSceneStateRuntime = window.WorldSceneStateRuntime || null;
            const worldPayload = (worldSceneStateRuntime && typeof worldSceneStateRuntime.getCurrentWorldScenePayload === 'function')
                ? worldSceneStateRuntime.getCurrentWorldScenePayload()
                : null;
            if (!worldPayload) throw new Error('WorldSceneStateRuntime is unavailable.');
            const lakeDefs = worldPayload.lakeDefs;
            const castleFrontPond = worldPayload.castleFrontPond;
            const deepWaterCenter = worldPayload.deepWaterCenter;
            const pierConfig = worldPayload.pierConfig;
            const smithingHallApproach = worldPayload.smithingHallApproach;
            const waterRenderPayload = worldPayload.waterRenderPayload;
            const stampedStructures = worldPayload.stampedStructures;
            const stampMap = worldPayload.stampMap;
            const smithingStations = worldPayload.smithingStations;
            const fishingTrainingRouteDefs = worldPayload.fishingTrainingRouteDefs;
            const cookingRouteSpecs = worldPayload.cookingRouteSpecs;
            const firemakingTrainingRouteDefs = worldPayload.firemakingTrainingRouteDefs;
            const miningTrainingRouteDefs = worldPayload.miningTrainingRouteDefs;
            const runecraftingRouteDefs = worldPayload.runecraftingRouteDefs;
            const woodcuttingTrainingRouteDefs = worldPayload.woodcuttingTrainingRouteDefs;
            const miningNodePlacements = worldPayload.miningNodePlacements;
            const authoredAltarPlacements = worldPayload.authoredAltarPlacements;
            const woodcuttingNodePlacements = worldPayload.woodcuttingNodePlacements;
            const staircaseLandmarks = worldPayload.staircaseLandmarks;
            const doorLandmarks = worldPayload.doorLandmarks;
            const fenceLandmarks = worldPayload.fenceLandmarks;
            const roofLandmarks = worldPayload.roofLandmarks;
            const showcaseTreeDefs = worldPayload.showcaseTreeDefs;

            function placeStaticNpcOccupancyTile(x, y, z = 0, options = {}) {
                if (!logicalMap[z] || !logicalMap[z][y]) return false;
                const baseTile = Number.isFinite(options.baseTile)
                    ? Math.floor(Number(options.baseTile))
                    : logicalMap[z][y][x];
                rememberStaticNpcBaseTile(x, y, z, baseTile);
                logicalMap[z][y][x] = TileId.SOLID_NPC;
                if (Number.isFinite(options.height)) heightMap[z][y][x] = Number(options.height);
                return true;
            }

            function getStampBounds(structureId) {
                for (let i = 0; i < stampedStructures.length; i++) {
                    const structure = stampedStructures[i];
                    if (!structure || structure.structureId !== structureId) continue;
                    const rows = stampMap && Array.isArray(stampMap[structure.stampId]) ? stampMap[structure.stampId] : [];
                    const height = rows.length;
                    let width = 0;
                    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                        const row = rows[rowIndex];
                        if (typeof row === 'string') width = Math.max(width, row.length);
                    }
                    if (width <= 0 || height <= 0) continue;
                    return {
                        xMin: structure.x,
                        xMax: structure.x + width - 1,
                        yMin: structure.y,
                        yMax: structure.y + height - 1
                    };
                }
                return null;
            }

            function expandBounds(bounds, padX, padY) {
                if (!bounds) return null;
                return {
                    xMin: Math.max(1, bounds.xMin - padX),
                    xMax: Math.min(MAP_SIZE - 2, bounds.xMax + padX),
                    yMin: Math.max(1, bounds.yMin - padY),
                    yMax: Math.min(MAP_SIZE - 2, bounds.yMax + padY)
                };
            }

            const castleBounds = getStampBounds('castle_ground') || { xMin: 190, xMax: 220, yMin: 190, yMax: 215 };
            const generalStoreBounds = getStampBounds('general_store') || { xMin: 177, xMax: 185, yMin: 232, yMax: 240 };
            const smithingHallBounds = getStampBounds('smithing_hall') || { xMin: 221, xMax: 229, yMin: 228, yMax: 240 };
            const townCoreBounds = [
                expandBounds(castleBounds, 0, 0),
                expandBounds(generalStoreBounds, 0, 0),
                // Keep a clean spawn-safe apron around the open smithing hall footprint.
                expandBounds(smithingHallBounds, 4, 4)
            ].filter(Boolean);
            const townSquareBounds = expandBounds(castleBounds, 10, 10);
            const inTownCore = (x, y) => {
                for (let i = 0; i < townCoreBounds.length; i++) {
                    const bounds = townCoreBounds[i];
                    if (!bounds) continue;
                    if (x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax) {
                        return true;
                    }
                }
                return false;
            };
            const terrainNoise = (x, y) => {
                const n1 = Math.sin(x * 0.045) * 0.08;
                const n2 = Math.cos(y * 0.05) * 0.07;
                const n3 = Math.sin((x + y) * 0.03) * 0.05;
                return n1 + n2 + n3;
            };
            const LEGACY_COORD_MAP_SIZE = 486;
            const riverAxisScale = MAP_SIZE / LEGACY_COORD_MAP_SIZE;
            const riverFrequencyScale = LEGACY_COORD_MAP_SIZE / Math.max(1, MAP_SIZE);
            const sampleRiverAtY = (y) => {
                const eastCenterBase = 298 * riverAxisScale;
                const southCurveT = Math.max(0, (y - (296 * riverAxisScale)) / Math.max(1, 98 * riverAxisScale));
                const westBend = Math.pow(Math.min(1, southCurveT), 1.35) * (86 * riverAxisScale);
                return {
                    centerX: eastCenterBase
                        + (Math.sin(y * 0.018 * riverFrequencyScale) * (8 * riverAxisScale))
                        + (Math.sin(y * 0.007 * riverFrequencyScale) * (5 * riverAxisScale))
                        - westBend,
                    halfWidth: Math.max(
                        2.4,
                        (6.2 * riverAxisScale) + (Math.sin(y * 0.045 * riverFrequencyScale) * (1.8 * riverAxisScale))
                    )
                };
            };
            furnacesToRender = worldPayload.furnacesToRender.map((station) => Object.assign({}, station));
            anvilsToRender = worldPayload.anvilsToRender.map((station) => Object.assign({}, station));
            const waterRenderBodies = Array.isArray(waterRenderPayload && waterRenderPayload.bodies)
                ? waterRenderPayload.bodies.slice()
                : [];
            sharedMaterials.activeWaterRenderBodies = waterRenderBodies;
            sharedMaterials.activePierConfig = Object.assign({}, pierConfig);

            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    if (x === 0 || y === 0 || x === MAP_SIZE - 1 || y === MAP_SIZE - 1) {
                        logicalMap[0][y][x] = 2; // Map borders
                        heightMap[0][y][x] = 0.08;
                    }
                    else if (townSquareBounds && x >= townSquareBounds.xMin && x <= townSquareBounds.xMax && y >= townSquareBounds.yMin && y <= townSquareBounds.yMax) {
                        logicalMap[0][y][x] = 0; // Empty Town Square
                        heightMap[0][y][x] = 0;
                    }
                    else {
                        logicalMap[0][y][x] = 0;
                        heightMap[0][y][x] = terrainNoise(x, y);
                    }
                }
            }
            const carveWaterTile = (x, y, depthNorm) => {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return;
                if (inTownCore(x, y)) return;

                if (depthNorm >= 0.64) {
                    logicalMap[0][y][x] = 22;
                    heightMap[0][y][x] = -0.18;
                } else {
                    logicalMap[0][y][x] = 21;
                    heightMap[0][y][x] = -0.10;
                }
            };

            for (let y = 1; y < MAP_SIZE - 1; y++) {
                const riverSample = sampleRiverAtY(y);
                const riverCenter = riverSample.centerX;
                const riverHalfWidth = riverSample.halfWidth;
                const carveSpan = Math.ceil(riverHalfWidth + 4);
                for (let x = Math.max(1, Math.floor(riverCenter - carveSpan)); x <= Math.min(MAP_SIZE - 2, Math.ceil(riverCenter + carveSpan)); x++) {
                    const d = Math.abs(x - riverCenter);
                    if (d <= riverHalfWidth) {
                        const depthNorm = Math.max(0, 1 - (d / Math.max(0.1, riverHalfWidth)));
                        carveWaterTile(x, y, depthNorm);
                    }
                }
            }

            const riverBridgeRows = [
                Math.floor(MAP_SIZE * 0.24),
                Math.floor(MAP_SIZE * 0.49),
                Math.floor(MAP_SIZE * 0.73)
            ];
            for (let i = 0; i < riverBridgeRows.length; i++) {
                const bridgeY = riverBridgeRows[i];
                if (bridgeY <= 2 || bridgeY >= MAP_SIZE - 3) continue;
                const sample = sampleRiverAtY(bridgeY);
                const bridgeHalfSpan = Math.ceil(sample.halfWidth + Math.max(3, 2 * riverAxisScale));
                const bridgeXMin = Math.max(2, Math.floor(sample.centerX - bridgeHalfSpan));
                const bridgeXMax = Math.min(MAP_SIZE - 3, Math.ceil(sample.centerX + bridgeHalfSpan));
                for (let x = bridgeXMin; x <= bridgeXMax; x++) {
                    logicalMap[0][bridgeY][x] = TileId.FLOOR_WOOD;
                    heightMap[0][bridgeY][x] = PIER_DECK_TOP_HEIGHT;
                }
                if (bridgeXMin - 1 > 1) {
                    logicalMap[0][bridgeY][bridgeXMin - 1] = TileId.SHORE;
                    heightMap[0][bridgeY][bridgeXMin - 1] = -0.01;
                }
                if (bridgeXMax + 1 < MAP_SIZE - 2) {
                    logicalMap[0][bridgeY][bridgeXMax + 1] = TileId.SHORE;
                    heightMap[0][bridgeY][bridgeXMax + 1] = -0.01;
                }
            }

            lakeDefs.forEach(lake => {
                for (let y = Math.max(1, Math.floor(lake.cy - lake.ry - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(lake.cy + lake.ry + 1)); y++) {
                    for (let x = Math.max(1, Math.floor(lake.cx - lake.rx - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(lake.cx + lake.rx + 1)); x++) {
                        const nx = (x - lake.cx) / lake.rx;
                        const ny = (y - lake.cy) / lake.ry;
                        const d = Math.sqrt(nx * nx + ny * ny);
                        if (d <= 1.0) carveWaterTile(x, y, 1.0 - d);
                    }
                }
            });
            // Add a guaranteed pond in front of the castle (clearing area).
            for (let y = Math.max(1, Math.floor(castleFrontPond.cy - castleFrontPond.ry - 1)); y <= Math.min(MAP_SIZE - 2, Math.ceil(castleFrontPond.cy + castleFrontPond.ry + 1)); y++) {
                for (let x = Math.max(1, Math.floor(castleFrontPond.cx - castleFrontPond.rx - 1)); x <= Math.min(MAP_SIZE - 2, Math.ceil(castleFrontPond.cx + castleFrontPond.rx + 1)); x++) {
                    const nx = (x - castleFrontPond.cx) / castleFrontPond.rx;
                    const ny = (y - castleFrontPond.cy) / castleFrontPond.ry;
                    const d = Math.sqrt(nx * nx + ny * ny);
                    if (d <= 1.0) carveWaterTile(x, y, 1.0 - d);
                }
            }

            // Ensure a stable deep-water center so dockside fishing can target dark water.
            for (let y = deepWaterCenter.yMin; y <= deepWaterCenter.yMax; y++) {
                for (let x = deepWaterCenter.xMin; x <= deepWaterCenter.xMax; x++) {
                    if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][x] = 22;
                    heightMap[0][y][x] = -0.18;
                }
            }

            // Add a wooden pier from the castle-facing bank toward the deep center.
            // The tip stops one tile short of water so the player stands on the pier and fishes adjacent dark water.
            const pierXMin = pierConfig.xMin;
            const pierXMax = pierConfig.xMax;
            const pierYStart = pierConfig.yStart;
            const pierYEnd = pierConfig.yEnd;
            for (let y = pierYStart; y <= pierYEnd; y++) {
                for (let x = pierXMin; x <= pierXMax; x++) {
                    if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][x] = 6;
                    heightMap[0][y][x] = PIER_DECK_TOP_HEIGHT;
                }
            }
            for (let y = pierYStart; y <= pierYEnd; y++) {
                const sideXs = [pierXMin - 1, pierXMax + 1];
                for (let i = 0; i < sideXs.length; i++) {
                    const sideX = sideXs[i];
                    if (!isPierSideWaterTile(pierConfig, sideX, y, 0)) continue;
                    if (sideX <= 1 || y <= 1 || sideX >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                    logicalMap[0][y][sideX] = TileId.WATER_SHALLOW;
                    heightMap[0][y][sideX] = -0.10;
                }
            }

            const pierEntryShoulders = [
                { x: pierXMin - 1, y: pierYStart },
                { x: pierXMax + 1, y: pierYStart }
            ];
            for (let i = 0; i < pierEntryShoulders.length; i++) {
                const shoulder = pierEntryShoulders[i];
                if (!shoulder) continue;
                if (shoulder.x <= 1 || shoulder.y <= 1 || shoulder.x >= MAP_SIZE - 2 || shoulder.y >= MAP_SIZE - 2) continue;
                logicalMap[0][shoulder.y][shoulder.x] = TileId.GRASS;
                heightMap[0][shoulder.y][shoulder.x] = Math.max(0.01, terrainNoise(shoulder.x, shoulder.y));
            }

            // Shoreline anchor tiles so the pier always has a clean walkable entry from land.
            const pierEntryY = pierConfig.entryY;
            const pierLandAnchorY = pierEntryY - 1;
            for (let x = pierXMin; x <= pierXMax; x++) {
                if (x <= 1 || pierEntryY <= 1 || x >= MAP_SIZE - 2 || pierEntryY >= MAP_SIZE - 2) continue;
                logicalMap[0][pierEntryY][x] = 20;
                heightMap[0][pierEntryY][x] = -0.01;
                if (pierLandAnchorY > 1) {
                    logicalMap[0][pierLandAnchorY][x] = TileId.SHORE;
                    heightMap[0][pierLandAnchorY][x] = -0.01;
                }
            }

            // Fishing-012 world placement: dedicated fishing merchants near the training water.
            const fishingMerchantSpots = worldPayload.fishingMerchantSpots;
            for (let i = 0; i < fishingMerchantSpots.length; i++) {
                const spot = fishingMerchantSpots[i];
                if (!spot || spot.x <= 1 || spot.y <= 1 || spot.x >= MAP_SIZE - 2 || spot.y >= MAP_SIZE - 2) continue;

                // Force a shallow shoreline anchor so these merchants are always reachable beside fishing routes.
                placeStaticNpcOccupancyTile(spot.x, spot.y, 0, { baseTile: TileId.SHORE, height: -0.01 });
                npcsToRender.push({
                    type: spot.type,
                    x: spot.x,
                    y: spot.y,
                    z: 0,
                    name: spot.name,
                    merchantId: spot.merchantId,
                    appearanceId: spot.appearanceId || null,
                    dialogueId: spot.dialogueId || null,
                    facingYaw: spot.facingYaw,
                    action: spot.action || 'Trade'
                });
            }

            cookingFireSpotsToRender = [];

            function setCookingRouteTile(x, y, z = 0) {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return false;
                const row = logicalMap[z] && logicalMap[z][y];
                if (!row) return false;
                const tile = row[x];
                const validBase = tile === TileId.GRASS
                    || tile === TileId.DIRT
                    || tile === TileId.FLOOR_WOOD
                    || tile === TileId.FLOOR_STONE
                    || tile === TileId.FLOOR_BRICK
                    || tile === TileId.STAIRS_RAMP
                    || tile === TileId.DOOR_OPEN
                    || tile === TileId.SHORE
                    || isWaterTileId(tile);
                if (!validBase) return false;

                if (isWaterTileId(tile)) {
                    logicalMap[z][y][x] = TileId.SHORE;
                    heightMap[z][y][x] = Math.max(-0.01, heightMap[z][y][x]);
                }
                return true;
            }

            for (let i = 0; i < cookingRouteSpecs.length; i++) {
                const routeSpec = cookingRouteSpecs[i];
                if (!routeSpec || !Array.isArray(routeSpec.fireTiles)) continue;
                for (let j = 0; j < routeSpec.fireTiles.length; j++) {
                    const tile = routeSpec.fireTiles[j];
                    if (!tile) continue;
                    if (!setCookingRouteTile(tile.x, tile.y, 0)) continue;

                    const fireSpot = {
                        routeId: routeSpec.routeId,
                        label: routeSpec.label,
                        x: tile.x,
                        y: tile.y,
                        z: 0
                    };
                    cookingFireSpotsToRender.push(fireSpot);
                }
            }
            const cookingTrainingLocations = worldTrainingLocationRuntime.buildCookingTrainingLocations({
                routeSpecs: cookingRouteSpecs,
                fireSpots: cookingFireSpotsToRender
            });

            rebuildRockNodes();
            rebuildTreeNodes();

            // Soften natural terrain transitions so adjacent tiles visually blend.
            for (let pass = 0; pass < 2; pass++) {
                const smoothed = heightMap[0].map(row => row.slice());
                for (let y = 1; y < MAP_SIZE - 1; y++) {
                    for (let x = 1; x < MAP_SIZE - 1; x++) {
                        const tile = logicalMap[0][y][x];
                        const isBlendableNaturalTile = isNaturalTileId(tile) && !isWaterTileId(tile) && tile !== TileId.SHORE;
                        if (!isBlendableNaturalTile) continue;
                        if (inTownCore(x, y)) continue;

                        let sum = 0;
                        let count = 0;
                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nt = logicalMap[0][y + oy][x + ox];
                                const neighborIsBlendable = isNaturalTileId(nt) && !isWaterTileId(nt) && nt !== TileId.SHORE;
                                if (neighborIsBlendable) {
                                    sum += heightMap[0][y + oy][x + ox];
                                    count++;
                                }
                            }
                        }
                        if (count > 0) {
                            const avg = sum / count;
                            smoothed[y][x] = (heightMap[0][y][x] * 0.65) + (avg * 0.35);
                        }
                    }
                }
                heightMap[0] = smoothed;
            }

            // --- THE 3D ASCII BLUEPRINT ENGINE ---
            // F = Floor, W = Wall, C = Corner Tower, B = Bank Booth, N = NPC, T = Dummy 
            // U = Climb Up, D = Climb Down, s = Seamless Walkable Stairs
            
            const castleFloor0 = stampMap && Array.isArray(stampMap.castle_floor0) ? stampMap.castle_floor0.slice() : [];
            const castleFloor1 = stampMap && Array.isArray(stampMap.castle_floor1) ? stampMap.castle_floor1.slice() : [];
            const generalStoreBlueprint = stampMap && Array.isArray(stampMap.general_store) ? stampMap.general_store.slice() : [];
            const smithingHallBlueprint = stampMap && Array.isArray(stampMap.smithing_hall) ? stampMap.smithing_hall.slice() : [];

            function stampBlueprint(startX, startY, z, blueprint) {
                for (let y = 0; y < blueprint.length; y++) {
                    const row = blueprint[y];
                    for (let x = 0; x < row.length; x++) {
                        const char = row[x];
                        if (char === ' ') continue; 
                        
                        const mapX = startX + x;
                        const mapY = startY + y;
                        
                        logicalMap[z][mapY][mapX] = 0; 
                        
                        if (char === 'W') { logicalMap[z][mapY][mapX] = 11; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'C') { logicalMap[z][mapY][mapX] = 12; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'F') { logicalMap[z][mapY][mapX] = 7; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'L' || char === 'T') { logicalMap[z][mapY][mapX] = 6; heightMap[z][mapY][mapX] = 0.5; }
                        else if (char === 'U') { logicalMap[z][mapY][mapX] = 13; heightMap[z][mapY][mapX] = 0.25; } 
                        else if (char === 'D') { logicalMap[z][mapY][mapX] = 14; heightMap[z][mapY][mapX] = 0.25; } 
                        else if (char === 's') { logicalMap[z][mapY][mapX] = 15; heightMap[z][mapY][mapX] = 0.25; } // Seamless stairs
                        else if (char === 'S') { logicalMap[z][mapY][mapX] = 15; heightMap[z][mapY][mapX] = 0.75; } // Seamless stairs T2
                        else if (char === 'P') { logicalMap[z][mapY][mapX] = 7; heightMap[z][mapY][mapX] = 1.0; } // Platform T2
                        else if (char === 'H') { logicalMap[z][mapY][mapX] = 15; heightMap[z][mapY][mapX] = 1.25; } // Seamless stairs T3
                        else if (char === 'E') { logicalMap[z][mapY][mapX] = 7; heightMap[z][mapY][mapX] = 1.5; } // Platform T3
                        else if (char === 'B') { 
                            logicalMap[z][mapY][mapX] = 9; heightMap[z][mapY][mapX] = 0.5; 
                            bankBoothsToRender.push({ x: mapX, y: mapY, z: z });
                        }
                        else if (char === 'N') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 3, x: mapX, y: mapY, z: z, name: "Banker" });
                        }
                        else if (char === 'K') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 7, x: mapX, y: mapY, z: z, name: "King Roald" });
                        }
                        else if (char === 'Q') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 8, x: mapX, y: mapY, z: z, name: "Queen Ellamaria" });
                        }
                        else if (char === 'V') { 
                            logicalMap[z][mapY][mapX] = 17; heightMap[z][mapY][mapX] = 0.5; 
                        }
                        else if (char === '$') { 
                            placeStaticNpcOccupancyTile(mapX, mapY, z, { baseTile: TileId.FLOOR_STONE, height: 0.5 });
                            npcsToRender.push({ type: 2, x: mapX, y: mapY, z: z, name: "Shopkeeper" });
                        }
                        else if (char === 'T') { 
                            logicalMap[z][mapY][mapX] = 10; heightMap[z][mapY][mapX] = 0.5; 
                        }
                    }
                }
            }

            for (let i = 0; i < stampedStructures.length; i++) {
                const structure = stampedStructures[i];
                if (!structure || !stampMap || !Array.isArray(stampMap[structure.stampId])) continue;
                stampBlueprint(structure.x, structure.y, structure.z, stampMap[structure.stampId]);
            }
            // Re-assert smithing station collision after blueprint stamping.
            for (let i = 0; i < smithingStations.length; i++) {
                const station = smithingStations[i];
                if (!station || station.x <= 1 || station.y <= 1 || station.x >= MAP_SIZE - 2 || station.y >= MAP_SIZE - 2) continue;
                if (station.type === 'FURNACE') {
                    const w = Number.isFinite(station.footprintW) ? station.footprintW : 2;
                    const d = Number.isFinite(station.footprintD) ? station.footprintD : 2;
                    for (let oy = 0; oy < d; oy++) {
                        for (let ox = 0; ox < w; ox++) {
                            const sx = station.x + ox;
                            const sy = station.y + oy;
                            if (sx <= 1 || sy <= 1 || sx >= MAP_SIZE - 2 || sy >= MAP_SIZE - 2) continue;
                            logicalMap[0][sy][sx] = 16;
                        }
                    }
                } else {
                    logicalMap[0][station.y][station.x] = 16;
                }
            }
            const staticMerchantSpots = worldPayload.staticMerchantSpots;
            for (let i = 0; i < staticMerchantSpots.length; i++) {
                const spot = staticMerchantSpots[i];
                if (!spot || spot.x <= 1 || spot.y <= 1 || spot.x >= MAP_SIZE - 2 || spot.y >= MAP_SIZE - 2) continue;
                const merchantHeight = Array.isArray(spot.tags)
                    && !spot.tags.includes('tutorial')
                    && (spot.tags.includes('smithing') || spot.tags.includes('crafting'))
                    ? 0.5
                    : null;
                placeStaticNpcOccupancyTile(spot.x, spot.y, 0, { height: merchantHeight });
                npcsToRender.push({
                    type: spot.type,
                    x: spot.x,
                    y: spot.y,
                    z: 0,
                    name: spot.name,
                    merchantId: spot.merchantId,
                    appearanceId: spot.appearanceId || null,
                    dialogueId: spot.dialogueId || null,
                    facingYaw: spot.facingYaw,
                    action: spot.action || 'Trade',
                    travelToWorldId: spot.travelToWorldId || null,
                    travelSpawn: spot.travelSpawn || null
                });
            }

            for (let i = 0; i < staircaseLandmarks.length; i++) {
                const staircase = staircaseLandmarks[i];
                if (!staircase || !Array.isArray(staircase.tiles)) continue;
                for (let j = 0; j < staircase.tiles.length; j++) {
                    const tile = staircase.tiles[j];
                    if (!tile || !Number.isInteger(tile.x) || !Number.isInteger(tile.y) || !Number.isInteger(tile.z)) continue;
                    if (!logicalMap[tile.z] || !logicalMap[tile.z][tile.y]) continue;
                    const tileId = TileId[tile.tileId];
                    if (!Number.isFinite(tileId)) continue;
                    logicalMap[tile.z][tile.y][tile.x] = tileId;
                    heightMap[tile.z][tile.y][tile.x] = Number.isFinite(tile.height) ? tile.height : heightMap[tile.z][tile.y][tile.x];
                    if (tileId === TileId.BANK_BOOTH && !bankBoothsToRender.some((booth) => booth.x === tile.x && booth.y === tile.y && booth.z === tile.z)) {
                        bankBoothsToRender.push({ x: tile.x, y: tile.y, z: tile.z });
                    }
                }
            }

            function applyFenceLandmark(fence) {
                if (!fence || !Array.isArray(fence.points) || fence.points.length < 2) return;
                const z = Number.isInteger(fence.z) ? fence.z : 0;
                for (let pointIndex = 1; pointIndex < fence.points.length; pointIndex++) {
                    const from = fence.points[pointIndex - 1];
                    const to = fence.points[pointIndex];
                    if (!from || !to) continue;
                    const dx = Math.sign(to.x - from.x);
                    const dy = Math.sign(to.y - from.y);
                    if (dx !== 0 && dy !== 0) continue;
                    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
                    let x = from.x;
                    let y = from.y;
                    for (let step = 0; step <= steps; step++) {
                        if (logicalMap[z] && logicalMap[z][y] && x > 0 && y > 0 && x < MAP_SIZE - 1 && y < MAP_SIZE - 1) {
                            logicalMap[z][y][x] = TileId.FENCE;
                            heightMap[z][y][x] = Number.isFinite(fence.height) ? fence.height : 0.05;
                        }
                        x += dx;
                        y += dy;
                    }
                }
            }

            for (let i = 0; i < fenceLandmarks.length; i++) {
                applyFenceLandmark(fenceLandmarks[i]);
            }

            function resolveNpcAppearanceId(npc) {
                if (!npc || typeof npc !== 'object') return null;
                const explicitAppearanceId = typeof npc.appearanceId === 'string' ? npc.appearanceId.trim().toLowerCase() : '';
                if (explicitAppearanceId) return explicitAppearanceId;
                const merchantId = typeof npc.merchantId === 'string' ? npc.merchantId.trim().toLowerCase() : '';
                const name = typeof npc.name === 'string' ? npc.name.trim().toLowerCase() : '';
                if (merchantId === 'tanner_rusk' || name === 'tanner rusk') return 'tanner_rusk';
                return null;
            }

            // Smithing hall approach stairs from pond side (west/open side).
            if (
                smithingHallApproach
                && Number.isInteger(smithingHallApproach.shoreX)
                && Number.isInteger(smithingHallApproach.stairX)
                && Number.isInteger(smithingHallApproach.yStart)
                && Number.isInteger(smithingHallApproach.yEnd)
            ) {
                const yStart = Math.min(smithingHallApproach.yStart, smithingHallApproach.yEnd);
                const yEnd = Math.max(smithingHallApproach.yStart, smithingHallApproach.yEnd);
                for (let sy = yStart; sy <= yEnd; sy++) {
                    if (sy <= 1 || sy >= MAP_SIZE - 2) continue;
                    if (smithingHallApproach.shoreX > 1 && smithingHallApproach.shoreX < MAP_SIZE - 2) {
                        logicalMap[0][sy][smithingHallApproach.shoreX] = 20;
                        heightMap[0][sy][smithingHallApproach.shoreX] = -0.01;
                    }
                    if (smithingHallApproach.stairX > 1 && smithingHallApproach.stairX < MAP_SIZE - 2) {
                        logicalMap[0][sy][smithingHallApproach.stairX] = 15;
                        heightMap[0][sy][smithingHallApproach.stairX] = 0.25;
                    }
                }
            }
            
            for (let i = 0; i < doorLandmarks.length; i++) {
                const door = doorLandmarks[i];
                if (!door || !Number.isInteger(door.x) || !Number.isInteger(door.y) || !Number.isInteger(door.z)) continue;
                const tileId = TileId[door.tileId];
                if (Number.isFinite(tileId)) {
                    logicalMap[door.z][door.y][door.x] = tileId;
                    heightMap[door.z][door.y][door.x] = Number.isFinite(door.height) ? door.height : heightMap[door.z][door.y][door.x];
                }
                doorsToRender.push({
                    x: door.x,
                    y: door.y,
                    z: door.z,
                    isOpen: !!door.isOpen,
                    hingeOffsetX: door.hingeOffsetX,
                    hingeOffsetY: door.hingeOffsetY,
                    thickness: door.thickness,
                    width: door.width,
                    isEW: door.isEW,
                    closedRot: door.closedRot,
                    openRot: door.openRot,
                    currentRotation: door.currentRotation,
                    targetRotation: door.targetRotation,
                    isWoodenGate: tileId === TileId.WOODEN_GATE_CLOSED || tileId === TileId.WOODEN_GATE_OPEN,
                    closedTileId: tileId === TileId.WOODEN_GATE_OPEN ? TileId.WOODEN_GATE_CLOSED : tileId,
                    tutorialRequiredStep: Number.isFinite(door.tutorialRequiredStep) ? door.tutorialRequiredStep : null,
                    tutorialGateMessage: typeof door.tutorialGateMessage === 'string' ? door.tutorialGateMessage : ''
                });
            }
            refreshTutorialGateStates();
            sharedMaterials.activeRoofLandmarks = roofLandmarks.map((roof) => Object.assign({}, roof, {
                hideBounds: roof && roof.hideBounds ? Object.assign({}, roof.hideBounds) : null
            }));

            const setMiningRockAt = (placement) => {
                if (!placement || !placement.oreType) return false;
                if (!logicalMap[placement.z] || !logicalMap[placement.z][placement.y]) return false;
                logicalMap[placement.z][placement.y][placement.x] = TileId.ROCK;
                const key = rockNodeKey(placement.x, placement.y, placement.z);
                rockOreOverrides[key] = placement.oreType;

                const hasAreaGate = placement
                    && ((typeof placement.areaGateFlag === 'string' && placement.areaGateFlag)
                        || (typeof placement.areaName === 'string' && placement.areaName)
                        || (typeof placement.areaGateMessage === 'string' && placement.areaGateMessage));
                if (hasAreaGate) {
                    rockAreaGateOverrides[key] = {
                        areaGateFlag: (typeof placement.areaGateFlag === 'string' && placement.areaGateFlag) ? placement.areaGateFlag : null,
                        areaName: (typeof placement.areaName === 'string' && placement.areaName) ? placement.areaName : null,
                        areaGateMessage: (typeof placement.areaGateMessage === 'string' && placement.areaGateMessage) ? placement.areaGateMessage : null
                    };
                } else if (rockAreaGateOverrides && rockAreaGateOverrides[key]) {
                    delete rockAreaGateOverrides[key];
                }
                return true;
            };
            const setTreePlacement = (placement) => {
                if (!placement) return false;
                if (!logicalMap[placement.z] || !logicalMap[placement.z][placement.y]) return false;
                logicalMap[placement.z][placement.y][placement.x] = TileId.TREE;
                return setTreeNode(placement.x, placement.y, placement.z, placement.nodeId, {
                    areaGateFlag: placement.areaGateFlag || null,
                    areaName: placement.areaName || null,
                    areaGateMessage: placement.areaGateMessage || null
                });
            };
            const clearNaturalArea = (centerX, centerY, radius) => {
                for (let y = centerY - radius; y <= centerY + radius; y++) {
                    for (let x = centerX - radius; x <= centerX + radius; x++) {
                        if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) continue;
                        const tile = logicalMap[0][y][x];
                        if (isNaturalTileId(tile)) {
                            logicalMap[0][y][x] = TileId.GRASS;
                            heightMap[0][y][x] = Math.max(0, heightMap[0][y][x]);
                        }
                    }
                }
            };
            const MINING_QUARRY_LAYOUT_OVERRIDES = Object.freeze({
                starter_mine: Object.freeze({
                    centerX: 114,
                    centerY: 204,
                    anchorX: 114,
                    anchorY: 204,
                    radiusScale: 0.72,
                    dirtRadiusScale: 1.08,
                    edgeDepth: -0.17,
                    centerDepth: -0.34
                }),
                iron_mine: Object.freeze({
                    centerX: 404,
                    centerY: 204,
                    anchorX: 404,
                    anchorY: 204,
                    radiusScale: 0.76,
                    dirtRadiusScale: 1.08,
                    edgeDepth: -0.18,
                    centerDepth: -0.36
                }),
                coal_mine: Object.freeze({
                    centerX: 434,
                    centerY: 350,
                    anchorX: 434,
                    anchorY: 350,
                    radiusScale: 0.8,
                    dirtRadiusScale: 1.08,
                    edgeDepth: -0.2,
                    centerDepth: -0.4
                }),
                precious_mine: Object.freeze({
                    centerX: 49,
                    centerY: 371,
                    anchorX: 49,
                    anchorY: 371,
                    radiusScale: 0.78,
                    dirtRadiusScale: 1.08,
                    edgeDepth: -0.2,
                    centerDepth: -0.41
                }),
                gem_mine: Object.freeze({
                    centerX: 262,
                    centerY: 427,
                    anchorX: 262,
                    anchorY: 427,
                    radiusScale: 0.74,
                    dirtRadiusScale: 1.08,
                    edgeDepth: -0.19,
                    centerDepth: -0.39
                }),
                rune_essence_mine: Object.freeze({
                    centerX: 408,
                    centerY: 50,
                    anchorX: 408,
                    anchorY: 50,
                    radiusScale: 0.7,
                    dirtRadiusScale: 1.06,
                    edgeDepth: -0.18,
                    centerDepth: -0.35
                })
            });
            const getMiningQuarryLayout = (routeId, clusterPoints) => {
                const points = Array.isArray(clusterPoints) ? clusterPoints : [];
                let sumX = 0;
                let sumY = 0;
                let maxDistance = 0;
                let minX = Number.POSITIVE_INFINITY;
                let maxX = Number.NEGATIVE_INFINITY;
                let minY = Number.POSITIVE_INFINITY;
                let maxY = Number.NEGATIVE_INFINITY;
                for (let i = 0; i < points.length; i++) {
                    const point = points[i];
                    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
                    sumX += point.x;
                    sumY += point.y;
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minY = Math.min(minY, point.y);
                    maxY = Math.max(maxY, point.y);
                }
                const fallbackX = Number.isFinite(minX) && Number.isFinite(maxX) ? ((minX + maxX) * 0.5) : 0;
                const fallbackY = Number.isFinite(minY) && Number.isFinite(maxY) ? ((minY + maxY) * 0.5) : 0;
                const averagedCenterX = points.length > 0 ? (sumX / points.length) : fallbackX;
                const averagedCenterY = points.length > 0 ? (sumY / points.length) : fallbackY;
                for (let i = 0; i < points.length; i++) {
                    const point = points[i];
                    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
                    maxDistance = Math.max(maxDistance, Math.hypot(point.x - averagedCenterX, point.y - averagedCenterY));
                }

                const override = routeId && MINING_QUARRY_LAYOUT_OVERRIDES[routeId]
                    ? MINING_QUARRY_LAYOUT_OVERRIDES[routeId]
                    : null;
                const centerX = override && Number.isFinite(override.centerX) ? override.centerX : averagedCenterX;
                const centerY = override && Number.isFinite(override.centerY) ? override.centerY : averagedCenterY;
                let recenteredMaxDistance = 0;
                for (let i = 0; i < points.length; i++) {
                    const point = points[i];
                    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
                    recenteredMaxDistance = Math.max(recenteredMaxDistance, Math.hypot(point.x - centerX, point.y - centerY));
                }

                const radiusBase = Math.max(5.2, recenteredMaxDistance + 2.6 + Math.min(2.8, Math.sqrt(Math.max(1, points.length)) * 0.32));
                const radius = Math.min(16.0, radiusBase * (override && Number.isFinite(override.radiusScale) ? override.radiusScale : 1));
                const dirtRadius = Math.min(17.6, radius * (override && Number.isFinite(override.dirtRadiusScale) ? override.dirtRadiusScale : 1.06));
                const edgeDepth = override && Number.isFinite(override.edgeDepth)
                    ? override.edgeDepth
                    : Math.max(-0.22, -0.15 - (Math.sqrt(Math.max(1, points.length)) * 0.009));
                const centerDepth = override && Number.isFinite(override.centerDepth)
                    ? override.centerDepth
                    : Math.max(-0.44, edgeDepth - (0.14 + (Math.sqrt(Math.max(1, points.length)) * 0.01)));
                return {
                    centerX,
                    centerY,
                    radius,
                    dirtRadius,
                    edgeDepth,
                    centerDepth,
                    anchorX: override && Number.isFinite(override.anchorX) ? override.anchorX : centerX,
                    anchorY: override && Number.isFinite(override.anchorY) ? override.anchorY : centerY,
                    minX,
                    maxX,
                    minY,
                    maxY
                };
            };
            const placementCoordKey = (placement) => {
                if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) return '';
                const z = Number.isFinite(placement.z) ? placement.z : 0;
                return z + ':' + placement.x + ',' + placement.y;
            };
            const thinMiningRockPlacements = (placements) => {
                if (!Array.isArray(placements) || placements.length === 0) {
                    return { active: [], dropped: [] };
                }

                const alwaysKeep = [];
                const byRoute = Object.create(null);
                for (let i = 0; i < placements.length; i++) {
                    const placement = placements[i];
                    if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                    if (!Number.isFinite(placement.z) || placement.z !== 0) {
                        alwaysKeep.push(placement);
                        continue;
                    }
                    const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                        ? placement.routeId
                        : 'routeless_mine';
                    if (!byRoute[routeId]) byRoute[routeId] = [];
                    byRoute[routeId].push(placement);
                }

                const active = alwaysKeep.slice();
                const dropped = [];
                const routeEntries = Object.entries(byRoute);
                for (let routeIndex = 0; routeIndex < routeEntries.length; routeIndex++) {
                    const routeEntry = routeEntries[routeIndex];
                    const routePoints = routeEntry[1];
                    if (!Array.isArray(routePoints) || routePoints.length === 0) continue;
                    if (routePoints.length <= 4) {
                        active.push(...routePoints);
                        continue;
                    }

                    let sumX = 0;
                    let sumY = 0;
                    for (let i = 0; i < routePoints.length; i++) {
                        sumX += routePoints[i].x;
                        sumY += routePoints[i].y;
                    }
                    const centerX = sumX / routePoints.length;
                    const centerY = sumY / routePoints.length;
                    let maxDist = 0;
                    let minX = Number.POSITIVE_INFINITY;
                    let maxX = Number.NEGATIVE_INFINITY;
                    let minY = Number.POSITIVE_INFINITY;
                    let maxY = Number.NEGATIVE_INFINITY;
                    for (let i = 0; i < routePoints.length; i++) {
                        const point = routePoints[i];
                        maxDist = Math.max(maxDist, Math.hypot(point.x - centerX, point.y - centerY));
                        minX = Math.min(minX, point.x);
                        maxX = Math.max(maxX, point.x);
                        minY = Math.min(minY, point.y);
                        maxY = Math.max(maxY, point.y);
                    }
                    const spanX = Math.max(1, maxX - minX);
                    const spanY = Math.max(1, maxY - minY);
                    const canvasDiag = Math.max(1.8, Math.hypot(spanX, spanY));
                    const targetKeep = Math.max(4, Math.min(routePoints.length, Math.round(routePoints.length * 0.42)));
                    const initialSpacing = Math.max(3.1, Math.min(6.8, (canvasDiag * 0.9) / Math.max(2.2, Math.sqrt(targetKeep))));
                    const classifyBin = (point) => {
                        const nx = (point.x - minX) / Math.max(1, spanX);
                        const ny = (point.y - minY) / Math.max(1, spanY);
                        const bx = Math.max(0, Math.min(2, Math.floor(nx * 3)));
                        const by = Math.max(0, Math.min(2, Math.floor(ny * 3)));
                        return bx + ',' + by;
                    };

                    const remaining = routePoints.slice();
                    remaining.sort((a, b) => {
                        const da = Math.hypot(a.x - centerX, a.y - centerY);
                        const db = Math.hypot(b.x - centerX, b.y - centerY);
                        if (da !== db) return db - da;
                        return hash2D(a.x, a.y, 51.7 + routeIndex) - hash2D(b.x, b.y, 51.7 + routeIndex);
                    });

                    const selected = [];
                    if (remaining.length > 0) {
                        selected.push(remaining.shift());
                    }
                    if (remaining.length > 0 && selected.length < targetKeep) {
                        let oppositeIdx = 0;
                        let oppositeDistance = -Infinity;
                        const seed = selected[0];
                        for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                            const candidate = remaining[candidateIndex];
                            const d = Math.hypot(candidate.x - seed.x, candidate.y - seed.y);
                            if (d > oppositeDistance) {
                                oppositeDistance = d;
                                oppositeIdx = candidateIndex;
                            }
                        }
                        selected.push(remaining.splice(oppositeIdx, 1)[0]);
                    }

                    let spacing = initialSpacing;
                    let safety = 0;
                    while (selected.length < targetKeep && remaining.length > 0 && safety < 512) {
                        safety++;
                        let bestIdx = 0;
                        let bestScore = -Infinity;
                        const selectedBins = new Set(selected.map(classifyBin));
                        for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                            const candidate = remaining[candidateIndex];
                            let minDist = Number.POSITIVE_INFINITY;
                            for (let s = 0; s < selected.length; s++) {
                                const chosen = selected[s];
                                const d = Math.hypot(candidate.x - chosen.x, candidate.y - chosen.y);
                                if (d < minDist) minDist = d;
                            }
                            if (selected.length > 0 && minDist < spacing) continue;
                            const candidateBin = classifyBin(candidate);
                            const jitter = hash2D(candidate.x, candidate.y, 86.1 + (routeIndex * 7.7) + (selected.length * 1.9));
                            const centerDist = Math.hypot(candidate.x - centerX, candidate.y - centerY);
                            const edgeBias = centerDist / Math.max(1, canvasDiag * 0.5);
                            const binBonus = selectedBins.has(candidateBin) ? 0 : 1.15;
                            const score = (minDist * 1.45) + (edgeBias * 0.85) + binBonus + (jitter * 0.22);
                            if (score > bestScore) {
                                bestScore = score;
                                bestIdx = candidateIndex;
                            }
                        }
                        if (bestScore === -Infinity) {
                            spacing = Math.max(1.9, spacing - 0.28);
                            if (spacing <= 1.92) {
                                let fallbackIdx = 0;
                                let fallbackScore = -Infinity;
                                const selectedBins = new Set(selected.map(classifyBin));
                                for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                                    const candidate = remaining[candidateIndex];
                                    let minDist = Number.POSITIVE_INFINITY;
                                    for (let s = 0; s < selected.length; s++) {
                                        const chosen = selected[s];
                                        const d = Math.hypot(candidate.x - chosen.x, candidate.y - chosen.y);
                                        if (d < minDist) minDist = d;
                                    }
                                    const candidateBin = classifyBin(candidate);
                                    const jitter = hash2D(candidate.x, candidate.y, 126.4 + (routeIndex * 9.9));
                                    const centerDist = Math.hypot(candidate.x - centerX, candidate.y - centerY);
                                    const edgeBias = centerDist / Math.max(1, canvasDiag * 0.5);
                                    const binBonus = selectedBins.has(candidateBin) ? 0 : 0.9;
                                    const score = (minDist * 1.24) + (edgeBias * 0.62) + binBonus + (jitter * 0.16);
                                    if (score > fallbackScore) {
                                        fallbackScore = score;
                                        fallbackIdx = candidateIndex;
                                    }
                                }
                                selected.push(remaining.splice(fallbackIdx, 1)[0]);
                            }
                            continue;
                        }
                        selected.push(remaining.splice(bestIdx, 1)[0]);
                    }

                    const selectedKeys = new Set(selected.map(placementCoordKey));
                    for (let i = 0; i < routePoints.length; i++) {
                        const point = routePoints[i];
                        if (selectedKeys.has(placementCoordKey(point))) active.push(point);
                        else dropped.push(point);
                    }
                }

                return { active, dropped };
            };
            const redistributeMiningRockPlacements = (placements, sourcePlacements) => {
                if (!Array.isArray(placements) || placements.length === 0) return [];

                const byRoute = Object.create(null);
                const sourceByRoute = Object.create(null);
                const preserved = [];
                for (let i = 0; i < placements.length; i++) {
                    const placement = placements[i];
                    if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                    if (!Number.isFinite(placement.z) || placement.z !== 0) {
                        preserved.push({ ...placement });
                        continue;
                    }
                    const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                        ? placement.routeId
                        : 'routeless_mine';
                    if (!byRoute[routeId]) byRoute[routeId] = [];
                    byRoute[routeId].push(placement);
                }
                if (Array.isArray(sourcePlacements)) {
                    for (let i = 0; i < sourcePlacements.length; i++) {
                        const placement = sourcePlacements[i];
                        if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                        if (!Number.isFinite(placement.z) || placement.z !== 0) continue;
                        const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                            ? placement.routeId
                            : 'routeless_mine';
                        if (!sourceByRoute[routeId]) sourceByRoute[routeId] = [];
                        sourceByRoute[routeId].push(placement);
                    }
                }

                const redistributed = preserved.slice();
                const globallyUsed = new Set();
                const routeEntries = Object.entries(byRoute);
                for (let routeIndex = 0; routeIndex < routeEntries.length; routeIndex++) {
                    const [routeId, routePlacements] = routeEntries[routeIndex];
                    if (!Array.isArray(routePlacements) || routePlacements.length === 0) continue;
                    const clusterPoints = Array.isArray(sourceByRoute[routeId]) && sourceByRoute[routeId].length > 0
                        ? sourceByRoute[routeId]
                        : routePlacements;
                    const layout = getMiningQuarryLayout(routeId, clusterPoints);
                    const centerX = layout.centerX;
                    const centerY = layout.centerY;
                    const radius = layout.radius;
                    const dirtRadius = layout.dirtRadius;
                    const edgeDepth = layout.edgeDepth;
                    const centerDepth = layout.centerDepth;
                    const scanMinX = Math.max(2, Math.floor(centerX - dirtRadius - 2));
                    const scanMaxX = Math.min(MAP_SIZE - 3, Math.ceil(centerX + dirtRadius + 2));
                    const scanMinY = Math.max(2, Math.floor(centerY - dirtRadius - 2));
                    const scanMaxY = Math.min(MAP_SIZE - 3, Math.ceil(centerY + dirtRadius + 2));
                    const dirtCandidates = [];
                    for (let y = scanMinY; y <= scanMaxY; y++) {
                        for (let x = scanMinX; x <= scanMaxX; x++) {
                            if (logicalMap[0][y][x] !== TileId.DIRT) continue;
                            if (globallyUsed.has(x + ',' + y)) continue;
                            const distance = Math.hypot(x - centerX, y - centerY);
                            if (distance > dirtRadius * 1.22) continue;
                            const fieldNoise = sampleFractalNoise2D(
                                ((x * 0.18) + (routeIndex * 3.1)),
                                ((y * 0.18) - (routeIndex * 2.7)),
                                701.2 + (routeIndex * 23.9),
                                2,
                                2.0,
                                0.5
                            );
                            const currentHeight = heightMap[0][y][x];
                            const depthSpan = Math.max(0.01, Math.abs(centerDepth - edgeDepth));
                            const depthBias = clamp01((edgeDepth - currentHeight) / depthSpan);
                            const normalizedDistance = distance / Math.max(1, dirtRadius);
                            const canvasBias = Math.max(0, 1 - Math.abs(normalizedDistance - 0.52));
                            dirtCandidates.push({ x, y, z: 0, distance, fieldNoise, depthBias, canvasBias });
                        }
                    }

                    const spanX = Math.max(1, scanMaxX - scanMinX);
                    const spanY = Math.max(1, scanMaxY - scanMinY);
                    const canvasDiag = Math.max(2, Math.hypot(spanX, spanY));
                    const classifyBin = (point) => {
                        const nx = (point.x - scanMinX) / Math.max(1, spanX);
                        const ny = (point.y - scanMinY) / Math.max(1, spanY);
                        const bx = Math.max(0, Math.min(3, Math.floor(nx * 4)));
                        const by = Math.max(0, Math.min(3, Math.floor(ny * 4)));
                        return bx + ',' + by;
                    };
                    const baseTargetCount = routePlacements.length;
                    const requestedExtraCount = 12 + Math.floor(
                        hash2D(centerX + (routeIndex * 4.1), centerY - (routeIndex * 3.7), 944.2) * 3
                    );
                    const targetCount = Math.max(
                        baseTargetCount,
                        Math.min(dirtCandidates.length, baseTargetCount + requestedExtraCount)
                    );
                    const selected = [];
                    const remaining = dirtCandidates.slice();
                    const clusterCenters = [];
                    const takenKeys = new Set();
                    const selectedBins = new Set();
                    const candidateKey = (point) => point.x + ',' + point.y;
                    const removeRemainingAt = (index) => {
                        if (index < 0 || index >= remaining.length) return null;
                        return remaining.splice(index, 1)[0];
                    };
                    const minDistanceToPoints = (point, points) => {
                        if (!Array.isArray(points) || points.length === 0) return Number.POSITIVE_INFINITY;
                        let minDist = Number.POSITIVE_INFINITY;
                        for (let p = 0; p < points.length; p++) {
                            const target = points[p];
                            if (!target) continue;
                            minDist = Math.min(minDist, Math.hypot(point.x - target.x, point.y - target.y));
                        }
                        return minDist;
                    };
                    const addSelectedCandidate = (candidate) => {
                        if (!candidate) return false;
                        const key = candidateKey(candidate);
                        if (takenKeys.has(key)) return false;
                        takenKeys.add(key);
                        selected.push(candidate);
                        selectedBins.add(classifyBin(candidate));
                        return true;
                    };

                    // Build a deterministic clump plan (pairs/triples/quads) plus a few strays.
                    // First pass uses the base count; extra rocks are filled in a second, interior-biased pass.
                    const primaryTargetCount = Math.min(targetCount, baseTargetCount);
                    const strayTarget = primaryTargetCount >= 14 ? 3 : (primaryTargetCount >= 9 ? 2 : (primaryTargetCount >= 6 ? 1 : 0));
                    let clusteredCount = Math.max(0, primaryTargetCount - strayTarget);
                    const clumpSizes = [];
                    let clumpIndex = 0;
                    while (clusteredCount > 0) {
                        const clumpRoll = hash2D(centerX + (clumpIndex * 3.7), centerY - (clumpIndex * 2.9), 615.4 + (routeIndex * 11.7));
                        let requestedSize = clumpRoll < 0.24 ? 4 : (clumpRoll < 0.68 ? 3 : 2);
                        if (clusteredCount <= 2) requestedSize = clusteredCount;
                        const clumpSize = Math.max(1, Math.min(requestedSize, clusteredCount));
                        clumpSizes.push(clumpSize);
                        clusteredCount -= clumpSize;
                        clumpIndex++;
                    }

                    const centerTargetCount = Math.max(1, clumpSizes.length);
                    let centerSpacing = Math.max(3.3, Math.min(7.1, (canvasDiag * 0.82) / Math.max(1.8, Math.sqrt(centerTargetCount))));
                    for (let c = 0; c < clumpSizes.length && remaining.length > 0 && selected.length < primaryTargetCount; c++) {
                        const clumpSize = clumpSizes[c];
                        let centerCandidateIndex = -1;
                        let centerCandidateScore = -Infinity;
                        for (let pass = 0; pass < 4 && centerCandidateIndex === -1; pass++) {
                            const spacingLimit = Math.max(2.1, centerSpacing - (pass * 0.55));
                            for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                                const candidate = remaining[candidateIndex];
                                if (!candidate) continue;
                                const minCenterDist = minDistanceToPoints(candidate, clusterCenters);
                                const resolvedCenterDist = Number.isFinite(minCenterDist) ? minCenterDist : centerSpacing;
                                if (clusterCenters.length > 0 && resolvedCenterDist < spacingLimit) continue;
                                const binBonus = selectedBins.has(classifyBin(candidate)) ? 0 : 1.15;
                                const jitter = hash2D(candidate.x, candidate.y, 641.9 + (routeIndex * 8.4) + (c * 2.2));
                                const score = (resolvedCenterDist * 0.95)
                                    + (binBonus * 0.74)
                                    + (candidate.fieldNoise * 0.78)
                                    + (candidate.canvasBias * 0.52)
                                    + (candidate.depthBias * 0.26)
                                    + (jitter * 0.24);
                                if (score > centerCandidateScore) {
                                    centerCandidateScore = score;
                                    centerCandidateIndex = candidateIndex;
                                }
                            }
                        }
                        if (centerCandidateIndex === -1) break;
                        const centerCandidate = removeRemainingAt(centerCandidateIndex);
                        if (!addSelectedCandidate(centerCandidate)) continue;
                        clusterCenters.push(centerCandidate);

                        const localIdeal = 1.18 + (hash2D(centerCandidate.x, centerCandidate.y, 704.1 + c) * 0.66);
                        const maxLocalRadius = clumpSize >= 4 ? 2.95 : (clumpSize === 3 ? 2.55 : 2.25);
                        for (let member = 1; member < clumpSize && selected.length < primaryTargetCount; member++) {
                            let neighborIndex = -1;
                            let neighborScore = -Infinity;
                            for (let pass = 0; pass < 3 && neighborIndex === -1; pass++) {
                                const maxRadius = maxLocalRadius + (pass * 0.62);
                                const minRadius = Math.max(0.65, 0.85 - (pass * 0.2));
                                for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
                                    const candidate = remaining[candidateIndex];
                                    if (!candidate) continue;
                                    const centerDist = Math.hypot(candidate.x - centerCandidate.x, candidate.y - centerCandidate.y);
                                    if (centerDist < minRadius || centerDist > maxRadius) continue;
                                    const minPlacedDist = minDistanceToPoints(candidate, selected);
                                    if (minPlacedDist < 0.78) continue;
                                    const clumpProximity = 1 - clamp01(Math.abs(centerDist - localIdeal) / Math.max(0.1, maxRadius));
                                    let nearOtherCenterDist = Number.POSITIVE_INFINITY;
                                    for (let cc = 0; cc < clusterCenters.length; cc++) {
                                        const otherCenter = clusterCenters[cc];
                                        if (!otherCenter || otherCenter === centerCandidate) continue;
                                        nearOtherCenterDist = Math.min(
                                            nearOtherCenterDist,
                                            Math.hypot(candidate.x - otherCenter.x, candidate.y - otherCenter.y)
                                        );
                                    }
                                    const centerSeparationPenalty = nearOtherCenterDist < 1.8 ? (1.8 - nearOtherCenterDist) : 0;
                                    const jitter = hash2D(candidate.x, candidate.y, 731.3 + (routeIndex * 9.6) + (member * 3.3));
                                    const score = (clumpProximity * 1.05)
                                        + (candidate.fieldNoise * 0.66)
                                        + (candidate.depthBias * 0.2)
                                        + (candidate.canvasBias * 0.24)
                                        + (jitter * 0.22)
                                        - (centerSeparationPenalty * 0.7);
                                    if (score > neighborScore) {
                                        neighborScore = score;
                                        neighborIndex = candidateIndex;
                                    }
                                }
                            }
                            if (neighborIndex === -1) break;
                            const neighbor = removeRemainingAt(neighborIndex);
                            addSelectedCandidate(neighbor);
                        }
                    }

                    // Fill remaining target slots with wider strays so the area doesn't look artificially packed.
                    const strayCandidates = remaining.sort((a, b) => {
                        const aScore = (a.fieldNoise * 0.72) + (a.canvasBias * 0.35) + (hash2D(a.x, a.y, 820.2 + routeIndex) * 0.22);
                        const bScore = (b.fieldNoise * 0.72) + (b.canvasBias * 0.35) + (hash2D(b.x, b.y, 820.2 + routeIndex) * 0.22);
                        return bScore - aScore;
                    });
                    let straySpacing = Math.max(1.95, Math.min(4.1, (canvasDiag * 0.52) / Math.max(2, Math.sqrt(Math.max(1, primaryTargetCount)))));
                    let straySafety = 0;
                    while (selected.length < primaryTargetCount && strayCandidates.length > 0 && straySafety < 1024) {
                        straySafety++;
                        let bestStrayIdx = -1;
                        let bestStrayScore = -Infinity;
                        for (let candidateIndex = 0; candidateIndex < strayCandidates.length; candidateIndex++) {
                            const candidate = strayCandidates[candidateIndex];
                            const minPlacedDist = minDistanceToPoints(candidate, selected);
                            const resolvedPlacedDist = Number.isFinite(minPlacedDist) ? minPlacedDist : (straySpacing + 0.8);
                            if (selected.length > 0 && resolvedPlacedDist < straySpacing) continue;
                            const binBonus = selectedBins.has(classifyBin(candidate)) ? 0 : 1.0;
                            const jitter = hash2D(candidate.x, candidate.y, 867.5 + (routeIndex * 8.1) + (selected.length * 1.9));
                            const score = (resolvedPlacedDist * 0.84)
                                + (binBonus * 0.68)
                                + (candidate.fieldNoise * 0.62)
                                + (candidate.canvasBias * 0.3)
                                + (candidate.depthBias * 0.14)
                                + (jitter * 0.2);
                            if (score > bestStrayScore) {
                                bestStrayScore = score;
                                bestStrayIdx = candidateIndex;
                            }
                        }
                        if (bestStrayIdx === -1) {
                            straySpacing = Math.max(1.05, straySpacing - 0.24);
                            if (straySpacing <= 1.08) {
                                const fallback = strayCandidates.shift();
                                if (fallback) addSelectedCandidate(fallback);
                            }
                            continue;
                        }
                        const stray = strayCandidates.splice(bestStrayIdx, 1)[0];
                        addSelectedCandidate(stray);
                    }

                    // Extra pass: add +12..+14 rocks using deterministic random picks.
                    if (selected.length < targetCount && strayCandidates.length > 0) {
                        const fillCandidates = strayCandidates.slice();
                        let fillSpacing = 1.16;
                        let fillSafety = 0;
                        let fillMisses = 0;
                        while (selected.length < targetCount && fillCandidates.length > 0 && fillSafety < 1024) {
                            fillSafety++;
                            const randomIndex = Math.floor(
                                hash2D(
                                    centerX + (fillSafety * 1.73) + (selected.length * 0.41),
                                    centerY - (fillSafety * 1.11) + (routeIndex * 0.37),
                                    911.4 + (routeIndex * 5.3)
                                ) * fillCandidates.length
                            );
                            const fillPick = fillCandidates.splice(randomIndex, 1)[0];
                            if (!fillPick) continue;
                            const minPlacedDist = minDistanceToPoints(fillPick, selected);
                            const resolvedPlacedDist = Number.isFinite(minPlacedDist) ? minPlacedDist : (fillSpacing + 0.9);
                            if (selected.length > 0 && resolvedPlacedDist < fillSpacing) {
                                fillCandidates.push(fillPick);
                                fillMisses++;
                                if (fillMisses >= Math.max(8, Math.floor(fillCandidates.length * 0.6))) {
                                    fillSpacing = Math.max(0.62, fillSpacing - 0.1);
                                    fillMisses = 0;
                                }
                                continue;
                            }
                            addSelectedCandidate(fillPick);
                            fillMisses = 0;
                        }
                    }

                    const orderedPlacements = routePlacements.slice().sort((a, b) => {
                        const aId = typeof a.placementId === 'string' ? a.placementId : '';
                        const bId = typeof b.placementId === 'string' ? b.placementId : '';
                        return aId.localeCompare(bId);
                    });
                    const orderedTargets = selected.slice().sort((a, b) => {
                        const aEdge = a.distance / Math.max(1, radius);
                        const bEdge = b.distance / Math.max(1, radius);
                        if (aEdge !== bEdge) return bEdge - aEdge;
                        if (a.y !== b.y) return a.y - b.y;
                        return a.x - b.x;
                    });

                    const extraPlacementCount = Math.max(0, orderedTargets.length - orderedPlacements.length);
                    for (let i = 0; i < extraPlacementCount; i++) {
                        const template = orderedPlacements.length > 0
                            ? orderedPlacements[i % orderedPlacements.length]
                            : routePlacements[Math.min(i, routePlacements.length - 1)];
                        if (!template) break;
                        const templateId = typeof template.placementId === 'string' && template.placementId
                            ? template.placementId
                            : `${routeId}:rock`;
                        orderedPlacements.push({
                            ...template,
                            placementId: `${templateId}:fill_${i + 1}`
                        });
                    }

                    for (let i = 0; i < orderedPlacements.length; i++) {
                        const placement = orderedPlacements[i];
                        const target = orderedTargets[i];
                        if (!target) {
                            redistributed.push({ ...placement });
                            continue;
                        }
                        globallyUsed.add(target.x + ',' + target.y);
                        redistributed.push({
                            ...placement,
                            x: target.x,
                            y: target.y,
                            z: 0
                        });
                    }
                }

                return redistributed;
            };
            const isQuarrySculptTile = (x, y) => {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return false;
                if (inTownCore(x, y)) return false;
                const row = logicalMap[0] && logicalMap[0][y];
                if (!row) return false;
                const tile = row[x];
                return tile === TileId.GRASS || tile === TileId.DIRT || tile === TileId.ROCK || tile === TileId.STUMP;
            };
            const applyMiningQuarryTerrain = (placements, activePlacements = placements) => {
                if (!Array.isArray(placements) || placements.length === 0) return;
                const clusters = Object.create(null);
                const activeByRoute = Object.create(null);
                for (let i = 0; i < placements.length; i++) {
                    const placement = placements[i];
                    if (!placement || placement.z !== 0) continue;
                    if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                    const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                        ? placement.routeId
                        : 'routeless_mine';
                    if (!clusters[routeId]) clusters[routeId] = [];
                    clusters[routeId].push(placement);
                }
                if (Array.isArray(activePlacements)) {
                    for (let i = 0; i < activePlacements.length; i++) {
                        const placement = activePlacements[i];
                        if (!placement || placement.z !== 0) continue;
                        if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y)) continue;
                        const routeId = (typeof placement.routeId === 'string' && placement.routeId)
                            ? placement.routeId
                            : 'routeless_mine';
                        if (!activeByRoute[routeId]) activeByRoute[routeId] = [];
                        activeByRoute[routeId].push(placement);
                    }
                }

                const touched = new Set();
                const markTouched = (x, y) => touched.add(x + ',' + y);
                const clusterEntries = Object.entries(clusters);
                for (let i = 0; i < clusterEntries.length; i++) {
                    const clusterEntry = clusterEntries[i];
                    const routeId = clusterEntry[0];
                    const clusterPoints = clusterEntry[1];
                    if (!Array.isArray(clusterPoints) || clusterPoints.length === 0) continue;
                    const clusterRocks = Array.isArray(activeByRoute[routeId]) ? activeByRoute[routeId] : [];

                    const layout = getMiningQuarryLayout(routeId, clusterPoints);
                    const centerX = layout.centerX;
                    const centerY = layout.centerY;
                    const radius = layout.radius;
                    const dirtRadius = layout.dirtRadius;
                    const edgeDepth = layout.edgeDepth;
                    const centerDepth = layout.centerDepth;
                    const clusterSeed = hash2D((centerX * 0.37) + i, (centerY * 0.41) - i, clusterPoints.length + 17.6);
                    const footprintSeed = 611.4 + (clusterSeed * 187.9) + (i * 41.7);
                    const floorSeed = footprintSeed + 97.3;
                    const shoulderSeed = footprintSeed + 223.1;
                    const minX = Math.max(2, Math.floor(centerX - dirtRadius - 4));
                    const maxX = Math.min(MAP_SIZE - 3, Math.ceil(centerX + dirtRadius + 4));
                    const minY = Math.max(2, Math.floor(centerY - dirtRadius - 4));
                    const maxY = Math.min(MAP_SIZE - 3, Math.ceil(centerY + dirtRadius + 4));
                    const resolveFootprint = (x, y) => {
                        const dx = x - centerX;
                        const dy = y - centerY;
                        const distance = Math.hypot(dx, dy);
                        const angle = Math.atan2(dy, dx);
                        const macroNoise = sampleFractalNoise2D(
                            ((x + (clusterSeed * 31.2)) * 0.12),
                            ((y - (clusterSeed * 27.8)) * 0.12),
                            footprintSeed,
                            3,
                            2.0,
                            0.55
                        );
                        const angularNoise = sampleFractalNoise2D(
                            ((((angle / Math.PI) + 1) * 0.95) + (clusterSeed * 0.8)),
                            ((distance * 0.085) + (clusterSeed * 0.65)),
                            footprintSeed + 34.8,
                            2,
                            2.0,
                            0.5
                        );
                        const lobeNoise = sampleFractalNoise2D(
                            ((dx * 0.08) + (clusterSeed * 9.1)),
                            ((dy * 0.08) - (clusterSeed * 7.3)),
                            footprintSeed + 79.6,
                            2,
                            2.0,
                            0.52
                        );
                        const dirtScale = Math.max(0.72, 0.84 + (macroNoise * 0.18) + ((angularNoise - 0.5) * 0.16) + ((lobeNoise - 0.5) * 0.12));
                        const pitScale = Math.max(0.66, 0.78 + (macroNoise * 0.12) + ((angularNoise - 0.5) * 0.08));
                        return {
                            distance,
                            macroNoise,
                            angularNoise,
                            lobeNoise,
                            effectiveDirtRadius: dirtRadius * dirtScale,
                            effectivePitRadius: radius * pitScale
                        };
                    };

                    for (let y = minY; y <= maxY; y++) {
                        for (let x = minX; x <= maxX; x++) {
                            if (!isQuarrySculptTile(x, y)) continue;
                            const footprint = resolveFootprint(x, y);
                            const distance = footprint.distance;
                            const dirtMask = 1 - smoothstep(
                                footprint.effectiveDirtRadius - 0.55,
                                footprint.effectiveDirtRadius + 0.25,
                                distance
                            );
                            const shoulderMask = 1 - smoothstep(
                                footprint.effectiveDirtRadius + 0.25,
                                footprint.effectiveDirtRadius + 1.55,
                                distance
                            );
                            if (dirtMask <= 0 && shoulderMask <= 0) continue;

                            const tile = logicalMap[0][y][x];
                            if (dirtMask > 0.12 && (tile === TileId.GRASS || tile === TileId.STUMP || tile === TileId.DIRT)) {
                                logicalMap[0][y][x] = TileId.DIRT;
                            }

                            let targetHeight = heightMap[0][y][x];
                            let blend = 0;
                            if (dirtMask > 0) {
                                const basinNoise = sampleFractalNoise2D(
                                    ((x + (clusterSeed * 13.8)) * 0.2),
                                    ((y - (clusterSeed * 18.4)) * 0.2),
                                    floorSeed,
                                    3,
                                    2.0,
                                    0.56
                                );
                                const pocketNoise = sampleFractalNoise2D(
                                    ((x - (clusterSeed * 9.4)) * 0.42),
                                    ((y + (clusterSeed * 6.7)) * 0.42),
                                    floorSeed + 53.4,
                                    2,
                                    2.0,
                                    0.5
                                );
                                const shelfNoise = sampleFractalNoise2D(
                                    ((x + (clusterSeed * 5.2)) * 0.1),
                                    ((y - (clusterSeed * 3.7)) * 0.1),
                                    shoulderSeed,
                                    2,
                                    2.0,
                                    0.54
                                );
                                const pitMask = 1 - smoothstep(0.12, 1.02, distance / Math.max(1, footprint.effectivePitRadius));
                                const depthMask = Math.pow(clamp01(pitMask), 1.18);
                                const floorVariation = ((basinNoise - 0.5) * (0.08 + (depthMask * 0.08)))
                                    + ((pocketNoise - 0.5) * (0.04 + (depthMask * 0.05)))
                                    + ((shelfNoise - 0.5) * 0.026)
                                    + ((footprint.lobeNoise - 0.5) * (0.02 + (depthMask * 0.016)));
                                targetHeight = lerpNumber(edgeDepth, centerDepth, depthMask) + floorVariation;
                                blend = 0.82 + (dirtMask * 0.12);
                            } else if (shoulderMask > 0) {
                                targetHeight = edgeDepth * (0.14 + (shoulderMask * 0.26));
                                blend = shoulderMask * 0.34;
                            }

                            if (blend > 0) {
                                const currentHeight = heightMap[0][y][x];
                                const loweredHeight = lerpNumber(currentHeight, targetHeight, blend);
                                heightMap[0][y][x] = Math.min(currentHeight, loweredHeight);
                                markTouched(x, y);
                            }
                        }
                    }

                    for (let j = 0; j < clusterRocks.length; j++) {
                        const rock = clusterRocks[j];
                        if (!isQuarrySculptTile(rock.x, rock.y)) continue;
                        let weightedSum = 0;
                        let weightedWeight = 0;
                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nx = rock.x + ox;
                                const ny = rock.y + oy;
                                if (!isQuarrySculptTile(nx, ny)) continue;
                                const weight = (ox === 0 && oy === 0) ? 0.28 : ((ox === 0 || oy === 0) ? 0.16 : 0.08);
                                weightedSum += heightMap[0][ny][nx] * weight;
                                weightedWeight += weight;
                            }
                        }
                        const rockGroundHeight = weightedWeight > 0
                            ? (weightedSum / weightedWeight)
                            : heightMap[0][rock.y][rock.x];
                        heightMap[0][rock.y][rock.x] = lerpNumber(heightMap[0][rock.y][rock.x], rockGroundHeight, 0.72);
                        markTouched(rock.x, rock.y);

                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nx = rock.x + ox;
                                const ny = rock.y + oy;
                                if (!isQuarrySculptTile(nx, ny)) continue;
                                const neighborDist = Math.hypot(ox, oy);
                                const blend = neighborDist <= 0.01 ? 1 : (neighborDist <= 1.01 ? 0.32 : 0.18);
                                heightMap[0][ny][nx] = lerpNumber(heightMap[0][ny][nx], rockGroundHeight, blend);
                                markTouched(nx, ny);
                            }
                        }
                    }
                }

                const touchedCoords = Array.from(touched).map((key) => {
                    const comma = key.indexOf(',');
                    return {
                        x: parseInt(key.slice(0, comma), 10),
                        y: parseInt(key.slice(comma + 1), 10)
                    };
                });

                for (let pass = 0; pass < 3; pass++) {
                    const snapshot = heightMap[0].map((row) => row.slice());
                    for (let i = 0; i < touchedCoords.length; i++) {
                        const coord = touchedCoords[i];
                        if (!coord || !isQuarrySculptTile(coord.x, coord.y)) continue;
                        const tile = logicalMap[0][coord.y][coord.x];

                        let sum = 0;
                        let count = 0;
                        for (let oy = -1; oy <= 1; oy++) {
                            for (let ox = -1; ox <= 1; ox++) {
                                const nx = coord.x + ox;
                                const ny = coord.y + oy;
                                if (!isQuarrySculptTile(nx, ny)) continue;
                                sum += snapshot[ny][nx];
                                count++;
                            }
                        }
                        if (count > 0) {
                            const avg = sum / count;
                            const blend = tile === TileId.ROCK ? 0.18 : (tile === TileId.DIRT ? 0.22 : 0.28);
                            heightMap[0][coord.y][coord.x] = lerpNumber(snapshot[coord.y][coord.x], avg, blend);
                        }
                    }
                }

                for (let i = 0; i < touchedCoords.length; i++) {
                    const coord = touchedCoords[i];
                    if (!coord || !isQuarrySculptTile(coord.x, coord.y)) continue;
                    const tile = logicalMap[0][coord.y][coord.x];
                    const currentHeight = heightMap[0][coord.y][coord.x];
                    if (tile === TileId.DIRT || tile === TileId.ROCK) {
                        heightMap[0][coord.y][coord.x] = Math.min(-0.11, Math.max(-0.56, currentHeight));
                    } else {
                        heightMap[0][coord.y][coord.x] = Math.max(-0.14, currentHeight);
                    }
                }
            };

            const miningPlacementPlan = thinMiningRockPlacements(miningNodePlacements);
            let activeMiningPlacements = miningPlacementPlan.active;

            // Shape the quarry floor first, then redistribute kept rocks across the dirt canvas.
            applyMiningQuarryTerrain(miningNodePlacements, []);
            activeMiningPlacements = redistributeMiningRockPlacements(activeMiningPlacements, miningNodePlacements);
            for (let i = 0; i < activeMiningPlacements.length; i++) {
                setMiningRockAt(activeMiningPlacements[i]);
            }

            const miningTrainingLocations = worldTrainingLocationRuntime.buildMiningTrainingLocations({
                routeDefs: miningTrainingRouteDefs,
                activePlacements: activeMiningPlacements,
                layoutOverrides: MINING_QUARRY_LAYOUT_OVERRIDES
            });

            RUNE_ESSENCE_ROCKS = activeMiningPlacements
                .filter((placement) => placement && placement.oreType === 'rune_essence')
                .map((placement) => ({ x: placement.x, y: placement.y, z: placement.z }));

            altarCandidatesToRender = authoredAltarPlacements.slice();
            for (let i = 0; i < authoredAltarPlacements.length; i++) {
                const altar = authoredAltarPlacements[i];
                if (!altar) continue;
                for (let by = altar.y - 1; by <= altar.y + 2; by++) {
                    if (by < 0 || by >= MAP_SIZE) continue;
                    for (let bx = altar.x - 1; bx <= altar.x + 2; bx++) {
                        if (bx < 0 || bx >= MAP_SIZE) continue;
                        if (!logicalMap[altar.z] || !logicalMap[altar.z][by]) continue;
                        logicalMap[altar.z][by][bx] = TileId.OBSTACLE;
                    }
                }
            }

            for (let i = 0; i < woodcuttingNodePlacements.length; i++) {
                setTreePlacement(woodcuttingNodePlacements[i]);
            }

            for (let i = 0; i < showcaseTreeDefs.length; i++) {
                const tree = showcaseTreeDefs[i];
                if (!tree) continue;
                clearNaturalArea(tree.x, tree.y, Number.isFinite(tree.clearRadius) ? tree.clearRadius : 5);
                setTreePlacement({
                    placementId: `showcase:${tree.nodeId}:${i + 1}`,
                    routeId: `showcase:${tree.nodeId}`,
                    x: tree.x,
                    y: tree.y,
                    z: 0,
                    nodeId: tree.nodeId,
                    areaGateFlag: null,
                    areaName: null,
                    areaGateMessage: null
                });
            }

            rebuildRockNodes();
            rebuildTreeNodes();

            worldTrainingLocationRuntime.publishTrainingLocationHooks({
                fishing: fishingTrainingRouteDefs,
                cooking: cookingTrainingLocations,
                firemaking: firemakingTrainingRouteDefs,
                mining: miningTrainingLocations,
                runecrafting: runecraftingRouteDefs,
                woodcutting: woodcuttingTrainingRouteDefs
            });

            const structureBoundsList = stampedStructures
                .map((structure) => {
                    if (!structure) return null;
                    const bounds = getStampBounds(structure.structureId);
                    if (!bounds) return null;
                    return {
                        structureId: structure.structureId,
                        z: Number.isFinite(structure.z) ? structure.z : 0,
                        xMin: bounds.xMin,
                        xMax: bounds.xMax,
                        yMin: bounds.yMin,
                        yMax: bounds.yMax
                    };
                })
                .filter(Boolean);

            const distanceToBounds = (bounds, x, y) => {
                const dx = x < bounds.xMin ? (bounds.xMin - x) : (x > bounds.xMax ? (x - bounds.xMax) : 0);
                const dy = y < bounds.yMin ? (bounds.yMin - y) : (y > bounds.yMax ? (y - bounds.yMax) : 0);
                return Math.max(dx, dy);
            };

            const expandNpcRoamBounds = (bounds, pad) => ({
                xMin: Math.max(1, bounds.xMin - pad),
                xMax: Math.min(MAP_SIZE - 2, bounds.xMax + pad),
                yMin: Math.max(1, bounds.yMin - pad),
                yMax: Math.min(MAP_SIZE - 2, bounds.yMax + pad)
            });

            const resolveTownNpcRoamBounds = (npc) => {
                if (!npc) return null;
                const actorZ = Number.isFinite(npc.z) ? npc.z : 0;
                const dialogueId = npc && typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
                const roamPad = dialogueId ? 3 : (npc && npc.action === 'Travel' ? 2 : 1);
                for (let i = 0; i < structureBoundsList.length; i++) {
                    const bounds = structureBoundsList[i];
                    if (!bounds || bounds.z !== actorZ) continue;
                    if (npc.x >= bounds.xMin && npc.x <= bounds.xMax && npc.y >= bounds.yMin && npc.y <= bounds.yMax) {
                        return expandNpcRoamBounds(bounds, roamPad);
                    }
                }
                let nearestBounds = null;
                let nearestDistance = Infinity;
                for (let i = 0; i < structureBoundsList.length; i++) {
                    const bounds = structureBoundsList[i];
                    if (!bounds || bounds.z !== actorZ) continue;
                    const distance = distanceToBounds(bounds, npc.x, npc.y);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestBounds = bounds;
                    }
                }
                if (nearestBounds && nearestDistance <= Math.max(3, roamPad + 1)) return expandNpcRoamBounds(nearestBounds, roamPad);
                const fallbackPad = dialogueId ? 4 : 2;
                return {
                    xMin: Math.max(1, npc.x - fallbackPad),
                    xMax: Math.min(MAP_SIZE - 2, npc.x + fallbackPad),
                    yMin: Math.max(1, npc.y - fallbackPad),
                    yMax: Math.min(MAP_SIZE - 2, npc.y + fallbackPad)
                };
            };

            const resolveTownNpcRoamingRadius = (npc, roamBounds) => {
                const npcName = npc && typeof npc.name === 'string' ? npc.name : '';
                const dialogueId = npc && typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
                if (npcName === 'Banker') return 0;
                if (/^King\b/i.test(npcName) || /^Queen\b/i.test(npcName)) return 1;
                if (npc && npc.action === 'Travel') return dialogueId ? 2 : 1;
                if (dialogueId) {
                    if (roamBounds) {
                        const spanX = roamBounds.xMax - roamBounds.xMin + 1;
                        const spanY = roamBounds.yMax - roamBounds.yMin + 1;
                        return Math.max(3, Math.min(4, Math.floor(Math.min(spanX, spanY) / 2)));
                    }
                    return 3;
                }
                if (roamBounds) {
                    const spanX = roamBounds.xMax - roamBounds.xMin + 1;
                    const spanY = roamBounds.yMax - roamBounds.yMin + 1;
                    return Math.max(1, Math.min(2, Math.floor(Math.min(spanX, spanY) / 2)));
                }
                return 2;
            };

            worldTownNpcRuntime.resetLoadedChunkNpcActors();
            const actorNowMs = performance.now();
            npcsToRender = npcsToRender.map((npc, index) => {
                const npcActorId = (npc && typeof npc.spawnId === 'string' && npc.spawnId)
                    || (npc && typeof npc.merchantId === 'string' && npc.merchantId ? `merchant:${npc.merchantId}` : '')
                    || `npc:${String(npc && npc.name ? npc.name : 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_')}:${Number.isFinite(npc.x) ? npc.x : index}:${Number.isFinite(npc.y) ? npc.y : 0}:${Number.isFinite(npc.z) ? npc.z : 0}`;
                const roamBounds = resolveTownNpcRoamBounds(npc);
                const facingYaw = resolveTownNpcDefaultFacingYaw(npc);
                const roamingRadius = resolveTownNpcRoamingRadius(npc, roamBounds);
                const baseHeight = getTileHeightSafe(npc.x, npc.y, Number.isFinite(npc.z) ? npc.z : 0);
                return Object.assign({}, npc, {
                    actorId: npcActorId,
                    spawnId: typeof npc.spawnId === 'string' ? npc.spawnId : null,
                    merchantId: typeof npc.merchantId === 'string' ? npc.merchantId : null,
                    appearanceId: typeof npc.appearanceId === 'string' ? npc.appearanceId : null,
                    dialogueId: typeof npc.dialogueId === 'string' ? npc.dialogueId : null,
                    homeX: npc.x,
                    homeY: npc.y,
                    homeZ: Number.isFinite(npc.z) ? npc.z : 0,
                    roamBounds,
                    roamingRadius,
                    roamEnabled: roamingRadius > 0,
                    facingYaw,
                    targetFacingYaw: facingYaw,
                    visualFacingYaw: facingYaw,
                    visualX: npc.x,
                    visualY: npc.y,
                    visualBaseY: baseHeight + ((Number.isFinite(npc.z) ? npc.z : 0) * 3.0),
                    moveFromX: npc.x,
                    moveFromY: npc.y,
                    moveFromHeight: baseHeight,
                    moveToHeight: baseHeight,
                    moveStartedAtMs: 0,
                    moveDurationMs: 0,
                    idleUntilMs: actorNowMs + 400 + (hashTownNpcSeed(npcActorId) % 900),
                    animationSeed: hashTownNpcSeed(npcActorId),
                    mesh: null,
                    hitbox: null,
                    renderChunkKey: null
                });
            });

            if (typeof window.initCombatWorldState === 'function') window.initCombatWorldState();
        }

        function listQaNpcTargets() {
            if (!Array.isArray(npcsToRender)) return [];
            return npcsToRender.map((npc) => ({
                actorId: npc && npc.actorId ? npc.actorId : '',
                spawnId: npc && npc.spawnId ? npc.spawnId : '',
                merchantId: npc && npc.merchantId ? npc.merchantId : '',
                name: npc && npc.name ? npc.name : '',
                action: npc && npc.action ? npc.action : '',
                dialogueId: npc && npc.dialogueId ? npc.dialogueId : '',
                x: Number.isFinite(npc && npc.x) ? npc.x : 0,
                y: Number.isFinite(npc && npc.y) ? npc.y : 0,
                z: Number.isFinite(npc && npc.z) ? npc.z : 0,
                visualX: Number.isFinite(npc && npc.visualX) ? npc.visualX : (Number.isFinite(npc && npc.x) ? npc.x : 0),
                visualY: Number.isFinite(npc && npc.visualY) ? npc.visualY : (Number.isFinite(npc && npc.y) ? npc.y : 0),
                rendered: !!(npc && npc.hitbox)
            }));
        }

        function buildWorldWaterRuntimeContext() {
            return {
                THREE,
                MAP_SIZE,
                TileId,
                logicalMap,
                heightMap,
                sharedMaterials,
                environmentMeshes,
                isWaterTileId,
                isPierVisualCoverageTile,
                getActivePierConfig,
                getWaterSurfaceMaterial
            };
        }

        function resolveWaterRenderBodyForTile(waterBodies, x, y) {
            return worldWaterRuntime.resolveWaterRenderBodyForTile(waterBodies, x, y);
        }

        function getDefaultWaterRenderBody() {
            return worldWaterRuntime.getDefaultWaterRenderBody();
        }

        function findNearbyWaterRenderBodyForTile(waterBodies, x, y, z, maxRadius = 3) {
            return worldWaterRuntime.findNearbyWaterRenderBodyForTile(Object.assign(buildWorldWaterRuntimeContext(), {
                waterBodies,
                x,
                y,
                z,
                maxRadius
            }));
        }

        function resolveVisualWaterRenderBodyForTile(waterBodies, x, y, z) {
            return worldWaterRuntime.resolveVisualWaterRenderBodyForTile(Object.assign(buildWorldWaterRuntimeContext(), {
                waterBodies,
                x,
                y,
                z
            }));
        }

        function getWaterSurfaceHeightForTile(waterBodies, x, y, z) {
            return worldWaterRuntime.getWaterSurfaceHeightForTile(Object.assign(buildWorldWaterRuntimeContext(), {
                waterBodies,
                x,
                y,
                z
            }));
        }

        function flushChunkWaterBuilders(planeGroup, builders) {
            worldWaterRuntime.flushChunkWaterBuilders(Object.assign(buildWorldWaterRuntimeContext(), { planeGroup, builders }));
        }

        function createWaterSurfacePatchMesh(bounds, surfaceY, styleTokens, depthWeight = 0.68, shoreStrength = 0.12) {
            return worldWaterRuntime.createWaterSurfacePatchMesh(Object.assign(buildWorldWaterRuntimeContext(), {
                bounds,
                surfaceY,
                styleTokens,
                depthWeight,
                shoreStrength
            }));
        }

        function createTopAnchoredFloorMesh(material, x, y, zOffset, topHeight, z) {
            return worldStructureRenderRuntime.createTopAnchoredFloorMesh({ THREE, material, x, y, zOffset, topHeight, z });
        }

        function createFenceVisualGroup(x, y, z, zOffset, baseHeight) {
            return worldStructureRenderRuntime.createFenceVisualGroup({
                THREE,
                sharedMaterials,
                environmentMeshes,
                logicalMap,
                mapSize: MAP_SIZE,
                getVisualTileId,
                isFenceConnectorTile,
                x,
                y,
                z,
                zOffset,
                baseHeight
            });
        }

        function chunkIntersectsRoof(roof, startX, startY, endX, endY, z) {
            return worldStructureRenderRuntime.chunkIntersectsRoof(roof, startX, startY, endX, endY, z);
        }

        function createRoofVisualGroup(roof, zOffset) {
            const group = worldStructureRenderRuntime.createRoofVisualGroup({
                THREE,
                sharedMaterials,
                roof,
                zOffset
            });
            if (group) activeRoofVisuals.push(group);
            return group;
        }

        function appendChunkLandmarkVisuals(planeGroup, z, Z_OFFSET, startX, startY, endX, endY) {
            worldStructureRenderRuntime.appendChunkLandmarkVisuals({
                THREE,
                sharedMaterials,
                environmentMeshes,
                heightMap,
                planeGroup,
                bankBoothsToRender,
                furnacesToRender,
                anvilsToRender,
                directionalSignsToRender,
                altarCandidatesToRender,
                doorsToRender,
                z,
                zOffset: Z_OFFSET,
                startX,
                startY,
                endX,
                endY
            });
        }

        function updateTutorialRoofVisibility() {
            worldStructureRenderRuntime.updateTutorialRoofVisibility({ activeRoofVisuals, playerState });
        }

        window.updateTutorialRoofVisibility = updateTutorialRoofVisibility;

        function getActivePierConfig() {
            return sharedMaterials.activePierConfig || null;
        }

        function isPierDeckTile(pierConfig, x, y, z) {
            return !!(
                pierConfig
                && z === 0
                && x >= pierConfig.xMin
                && x <= pierConfig.xMax
                && y >= pierConfig.yStart
                && y <= pierConfig.yEnd
            );
        }

        function isPierSideWaterTile(pierConfig, x, y, z) {
            return !!(
                pierConfig
                && z === 0
                && y >= (pierConfig.yStart + 1)
                && y <= pierConfig.yEnd
                && (x === (pierConfig.xMin - 1) || x === (pierConfig.xMax + 1))
            );
        }

        function isPierVisualCoverageTile(pierConfig, x, y, z) {
            return !!(
                pierConfig
                && z === 0
                && (
                    isPierDeckTile(pierConfig, x, y, z)
                    || isPierSideWaterTile(pierConfig, x, y, z)
                    || (
                        y >= (pierConfig.yEnd - 1)
                        && y <= pierConfig.yEnd
                        && x >= (pierConfig.xMin - 1)
                        && x <= (pierConfig.xMax + 1)
                    )
                )
            );
        }

        function classifyWaterEdgeType(x, y, dx, dy, z, waterSurfaceY) {
            return worldWaterRuntime.classifyWaterEdgeType(Object.assign(buildWorldWaterRuntimeContext(), {
                x,
                y,
                dx,
                dy,
                z,
                waterSurfaceY
            }));
        }

        function appendChunkWaterTilesToBuilders(builders, waterBodies, z, Z_OFFSET, startX, startY, endX, endY) {
            worldWaterRuntime.appendChunkWaterTilesToBuilders(Object.assign(buildWorldWaterRuntimeContext(), {
                builders,
                waterBodies,
                z,
                zOffset: Z_OFFSET,
                startX,
                startY,
                endX,
                endY
            }));
        }

        function addPierVisualsToChunk(planeGroup, z, Z_OFFSET, startX, startY, endX, endY) {
            worldStructureRenderRuntime.appendPierVisualsToChunk({
                THREE,
                sharedMaterials,
                environmentMeshes,
                planeGroup,
                pierConfig: getActivePierConfig(),
                createWaterSurfacePatchMesh,
                findNearbyWaterRenderBodyForTile,
                resolveWaterRenderBodyForTile,
                getDefaultWaterRenderBody,
                pierDeckTopHeight: PIER_DECK_TOP_HEIGHT,
                pierDeckThickness: PIER_DECK_THICKNESS,
                z,
                zOffset: Z_OFFSET,
                startX,
                startY,
                endX,
                endY
            });
        }

        function getWorldChunkSceneRuntime() {
            const runtime = window.WorldChunkSceneRuntime || null;
            if (!runtime) throw new Error('WorldChunkSceneRuntime is unavailable.');
            return runtime;
        }

        const CHUNK_TIER_NEAR = getWorldChunkSceneRuntime().CHUNK_TIER_NEAR;
        const CHUNK_TIER_MID = getWorldChunkSceneRuntime().CHUNK_TIER_MID;
        const CHUNK_TIER_FAR = getWorldChunkSceneRuntime().CHUNK_TIER_FAR;

        function setChunkInteractionMeshesActive(interactionMeshes, targetState) {
            const meshes = Array.isArray(interactionMeshes) ? interactionMeshes : [];
            if (targetState) {
                const existing = new Set(environmentMeshes);
                for (let i = 0; i < meshes.length; i++) {
                    const mesh = meshes[i];
                    if (!mesh || existing.has(mesh)) continue;
                    environmentMeshes.push(mesh);
                    existing.add(mesh);
                }
            } else if (meshes.length > 0) {
                const removeSet = new Set(meshes);
                environmentMeshes = environmentMeshes.filter((mesh) => !removeSet.has(mesh));
            }
        }

        function getChunkCenterPosition() {
            if (!playerRig) return null;
            const pX = isFreeCam ? freeCamTarget.x : playerRig.position.x;
            const pZ = isFreeCam ? freeCamTarget.z : playerRig.position.z;
            return { x: pX, z: pZ, visiblePlane: playerState.z };
        }

        function buildChunkSceneRuntimeContext() {
            return {
                worldChunksX: WORLD_CHUNKS_X,
                worldChunksY: WORLD_CHUNKS_Y,
                chunkSize: CHUNK_SIZE,
                getChunkCenterPosition,
                hasPlayerRig: () => !!playerRig,
                removeChunkGroupFromScene: (group) => {
                    if (scene && group) scene.remove(group);
                },
                setChunkGroupPlaneVisibility,
                ensureFarChunkBackdropBuilt,
                ensureFarChunkGroup,
                ensureMidChunkGroup,
                loadNearChunk: loadChunk,
                unloadNearChunkGroup: unloadChunkGroup,
                setChunkInteractionMeshesActive,
                bumpShadowFocusRevision: () => {
                    sharedMaterials.shadowFocusRevision = Number.isFinite(sharedMaterials.shadowFocusRevision)
                        ? sharedMaterials.shadowFocusRevision + 1
                        : 1;
                }
            };
        }

        function setChunkGroupPlaneVisibility(group, maxVisiblePlane) {
            if (!group || !Array.isArray(group.children)) return;
            const visiblePlane = Number.isFinite(maxVisiblePlane) ? Math.floor(maxVisiblePlane) : 0;
            group.children.forEach((planeGroup) => {
                if (!planeGroup || !planeGroup.userData || planeGroup.userData.z === undefined) return;
                planeGroup.visible = planeGroup.userData.z <= visiblePlane;
            });
        }

        function clearPendingNearChunkBuilds(key = null) {
            getWorldChunkSceneRuntime().clearPendingNearChunkBuilds(key);
        }

        function clearChunkTierGroups() {
            getWorldChunkSceneRuntime().clearChunkTierGroups(buildChunkSceneRuntimeContext());
        }

        function createSimplifiedChunkGroup(cx, cy, tier = CHUNK_TIER_MID) {
            return worldChunkTierRenderRuntime.createSimplifiedChunkGroup({
                THREE,
                CHUNK_SIZE,
                MAP_SIZE,
                PLANES,
                TileId,
                CHUNK_TIER_MID,
                CHUNK_TIER_FAR,
                sharedMaterials,
                sharedGeometries,
                logicalMap,
                heightMap,
                playerState,
                getVisualTileId,
                isTreeTileId,
                cx,
                cy,
                tier
            });
        }

        function ensureFarChunkGroup(cx, cy) {
            const key = `${cx},${cy}`;
            const runtime = getWorldChunkSceneRuntime();
            const existing = runtime.getFarChunkGroup(key);
            if (existing) return existing;
            const group = createSimplifiedChunkGroup(cx, cy, CHUNK_TIER_FAR);
            group.visible = false;
            scene.add(group);
            return runtime.setFarChunkGroup(key, group);
        }

        function ensureMidChunkGroup(cx, cy) {
            const key = `${cx},${cy}`;
            const runtime = getWorldChunkSceneRuntime();
            const existing = runtime.getMidChunkGroup(key);
            if (existing) return existing;
            const group = createSimplifiedChunkGroup(cx, cy, CHUNK_TIER_MID);
            group.visible = false;
            scene.add(group);
            return runtime.setMidChunkGroup(key, group);
        }

        function ensureFarChunkBackdropBuilt() {
            if (!scene) return;
            for (let cy = 0; cy < WORLD_CHUNKS_Y; cy++) {
                for (let cx = 0; cx < WORLD_CHUNKS_X; cx++) {
                    ensureFarChunkGroup(cx, cy);
                }
            }
        }

        function setChunkInteractionState(key, shouldRegisterInteraction) {
            getWorldChunkSceneRuntime().setChunkInteractionState(key, shouldRegisterInteraction, buildChunkSceneRuntimeContext());
        }

        function buildChunkGroundMeshes(planeGroup, startX, startY, activePierConfig, waterRenderBodies) {
            worldChunkTerrainRuntime.buildChunkGroundMeshes({
                THREE,
                CHUNK_SIZE,
                MAP_SIZE,
                TileId,
                startX,
                startY,
                logicalMap,
                heightMap,
                sharedMaterials,
                waterRenderBodies,
                activePierConfig,
                planeGroup,
                environmentMeshes,
                isNaturalTileId,
                isWaterTileId,
                isPierVisualCoverageTile,
                getVisualTileId,
                getWaterSurfaceHeightForTile,
                sampleFractalNoise2D
            });
        }

        function loadChunk(cx, cy, registerInteraction = true) {
            const group = new THREE.Group();
            const environmentMeshStartIndex = environmentMeshes.length;
            const renderedNpcActors = [];
            const startX = cx * CHUNK_SIZE;
            const startY = cy * CHUNK_SIZE;
            const endX = startX + CHUNK_SIZE;
            const endY = startY + CHUNK_SIZE;
            const waterRenderBodies = Array.isArray(sharedMaterials.activeWaterRenderBodies)
                ? sharedMaterials.activeWaterRenderBodies
                : [];
            const activePierConfig = getActivePierConfig();

            for (let z = 0; z < PLANES; z++) {
                const planeGroup = new THREE.Group();
                planeGroup.userData.z = z;
                planeGroup.visible = z <= playerState.z;
                const Z_OFFSET = z * 3.0;
                if (z === 0) {
                    buildChunkGroundMeshes(planeGroup, startX, startY, activePierConfig, waterRenderBodies);
                }

                let wCount = 0, cCount = 0;
                const resourceCounts = worldChunkResourceRenderRuntime.collectChunkResourceVisualCounts({
                    TileId,
                    logicalMap,
                    startX,
                    startY,
                    endX,
                    endY,
                    z,
                    currentTick,
                    getVisualTileId,
                    isTreeTileId,
                    getRockNodeAt,
                    getRockVisualIdForNode
                });
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        let tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                        if (tile === TileId.WALL) wCount++;
                        else if (tile === TileId.TOWER) cCount++;
                    }
                }

                const resourceRenderState = worldChunkResourceRenderRuntime.createChunkResourceRenderState({
                    counts: resourceCounts,
                    planeGroup,
                    createTreeRenderData,
                    createRockRenderData
                });

                let castleData = worldStructureRenderRuntime.createCastleRenderData({
                    THREE,
                    sharedGeometries,
                    sharedMaterials,
                    planeGroup,
                    environmentMeshes,
                    wallCount: wCount,
                    towerCount: cCount
                });

                const dummyTransform = new THREE.Object3D();
                let wIdx = 0, cIdx = 0;
                const chunkWaterBuilders = Object.create(null);
                appendChunkWaterTilesToBuilders(chunkWaterBuilders, waterRenderBodies, z, Z_OFFSET, startX, startY, endX, endY);

                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);

                        if (worldChunkResourceRenderRuntime.appendChunkResourceVisual({
                            THREE,
                            TileId,
                            state: resourceRenderState,
                            logicalMap,
                            heightMap,
                            mapSize: MAP_SIZE,
                            activePierConfig,
                            dummyTransform,
                            currentTick,
                            x,
                            y,
                            z,
                            zOffset: Z_OFFSET,
                            getVisualTileId,
                            isTreeTileId,
                            isWaterTileId,
                            isPierVisualCoverageTile,
                            getTreeNodeAt,
                            getRockNodeAt,
                            getRockVisualIdForNode,
                            getRockDisplayName,
                            setTreeVisualState,
                            setRockVisualState,
                            hash2D
                        })) {
                            continue;
                        } else if (tile === TileId.FENCE) {
                            const fenceGroup = createFenceVisualGroup(x, y, z, Z_OFFSET, heightMap[z][y][x]);
                            planeGroup.add(fenceGroup);
                        } else if (tile === TileId.WALL) {
                            wIdx = worldStructureRenderRuntime.setCastleWallVisualState({
                                castleData,
                                dummyTransform,
                                logicalMap,
                                TileId,
                                mapSize: MAP_SIZE,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET,
                                wallIndex: wIdx
                            });
                        } else if (tile === TileId.TOWER) {
                            cIdx = worldStructureRenderRuntime.setCastleTowerVisualState({
                                castleData,
                                dummyTransform,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET,
                                towerIndex: cIdx
                            });
                        } else if (tile === TileId.SHOP_COUNTER) {
                            worldStructureRenderRuntime.appendShopCounterVisual({
                                THREE,
                                sharedMaterials,
                                logicalMap,
                                heightMap,
                                TileId,
                                planeGroup,
                                environmentMeshes,
                                mapSize: MAP_SIZE,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET
                            });
                        } else if (tile === TileId.FLOOR_STONE || tile === TileId.FLOOR_WOOD || tile === TileId.FLOOR_BRICK || tile === TileId.BANK_BOOTH || logicalMap[z][y][x] === TileId.SOLID_NPC) {
                            worldStructureRenderRuntime.appendFloorTileVisual({
                                THREE,
                                sharedMaterials,
                                logicalMap,
                                heightMap,
                                TileId,
                                planeGroup,
                                environmentMeshes,
                                pierConfig: activePierConfig,
                                isPierDeckTile,
                                visualTile: tile,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET
                            });
                        } else if (tile === TileId.STAIRS_UP || tile === TileId.STAIRS_DOWN) {
                            worldStructureRenderRuntime.appendStairBlockVisual({
                                THREE,
                                sharedMaterials,
                                heightMap,
                                TileId,
                                planeGroup,
                                environmentMeshes,
                                visualTile: tile,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET
                            });
                        } else if (tile === TileId.STAIRS_RAMP) {
                            worldStructureRenderRuntime.appendStairRampVisual({
                                THREE,
                                sharedMaterials,
                                heightMap,
                                planeGroup,
                                environmentMeshes,
                                mapSize: MAP_SIZE,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET
                            });
                        }
                    }
                }
                addPierVisualsToChunk(planeGroup, z, Z_OFFSET, startX, startY, endX, endY);
                flushChunkWaterBuilders(planeGroup, chunkWaterBuilders);
                
                worldChunkResourceRenderRuntime.markChunkResourceVisualsDirty({
                    state: resourceRenderState,
                    markTreeVisualsDirty,
                    markRockVisualsDirty
                });
                worldStructureRenderRuntime.markCastleRenderDataDirty(castleData);

                planeGroup.userData.trees = resourceRenderState.treeData;
                planeGroup.userData.rocks = resourceRenderState.rockData;

                appendChunkLandmarkVisuals(planeGroup, z, Z_OFFSET, startX, startY, endX, endY);

                const activeRoofs = Array.isArray(sharedMaterials.activeRoofLandmarks) ? sharedMaterials.activeRoofLandmarks : [];
                activeRoofs.forEach((roof) => {
                    if (!chunkIntersectsRoof(roof, startX, startY, endX, endY, z)) return;
                    planeGroup.add(createRoofVisualGroup(roof, Z_OFFSET));
                });

                worldNpcRenderRuntime.appendChunkNpcVisuals({
                    THREE,
                    sharedMaterials,
                    heightMap,
                    npcsToRender,
                    planeGroup,
                    environmentMeshes,
                    renderedNpcActors,
                    startX,
                    startY,
                    endX,
                    endY,
                    z,
                    Z_OFFSET,
                    cx,
                    cy,
                    createHumanoidModel,
                    createNpcHumanoidRigFromPreset: window.createNpcHumanoidRigFromPreset,
                    resolveTownNpcDefaultFacingYaw
                });

                group.add(planeGroup);
            }
            
            scene.add(group);
            const key = `${cx},${cy}`;
            const interactionMeshes = environmentMeshes.slice(environmentMeshStartIndex);
            worldTownNpcRuntime.setLoadedChunkNpcActors(key, renderedNpcActors);
            if (!registerInteraction && environmentMeshes.length > environmentMeshStartIndex) {
                environmentMeshes.length = environmentMeshStartIndex;
            }
            getWorldChunkSceneRuntime().registerNearChunk(key, group, {
                interactionMeshes,
                registerInteraction
            });
        }

        function setLoadedChunkPlaneVisibility(maxVisiblePlane) {
            getWorldChunkSceneRuntime().setLoadedChunkPlaneVisibility(maxVisiblePlane, buildChunkSceneRuntimeContext());
        }

        function unloadChunkGroup(key, group) {
            if (group) {
                scene.remove(group);
                activeRoofVisuals = activeRoofVisuals.filter((roofGroup) => {
                    let parent = roofGroup;
                    while (parent) {
                        if (parent === group) return false;
                        parent = parent.parent;
                    }
                    return true;
                });
                environmentMeshes = environmentMeshes.filter(m => {
                    let parent = m;
                    while (parent) {
                        if (parent === group) return false;
                        parent = parent.parent;
                    }
                    return true;
                });
            }
            const chunkNpcActors = worldTownNpcRuntime.getLoadedChunkNpcActors(key);
            for (let i = 0; i < chunkNpcActors.length; i++) {
                clearTownNpcRenderBindings(chunkNpcActors[i]);
            }
            worldTownNpcRuntime.deleteLoadedChunkNpcActors(key);
        }

        function unloadChunk(key) {
            getWorldChunkSceneRuntime().unregisterNearChunk(key, buildChunkSceneRuntimeContext());
        }

        function processPendingNearChunkBuilds(maxBuilds = 1) {
            return getWorldChunkSceneRuntime().processPendingNearChunkBuilds({
                maxBuilds,
                context: buildChunkSceneRuntimeContext()
            });
        }

        function manageChunks(forceRefresh = false) {
            getWorldChunkSceneRuntime().manageChunks(Object.assign(
                { forceRefresh: !!forceRefresh },
                buildChunkSceneRuntimeContext()
            ));
        }

        function reportChunkPerformanceSample(fps, nowMs = performance.now()) {
            getWorldChunkSceneRuntime().reportChunkPerformanceSample(fps, nowMs, buildChunkSceneRuntimeContext());
        }

        function markChunkPolicyDirty() {
            getWorldChunkSceneRuntime().markChunkPolicyDirty();
        }

        function build3DEnvironment() {
            initSharedAssets();
            clearPendingNearChunkBuilds();
            ensureFarChunkBackdropBuilt();
            markChunkPolicyDirty();
        }

        function reloadActiveWorldScene() {
            const lifecycleRuntime = window.WorldSceneLifecycleRuntime || null;
            if (!lifecycleRuntime || typeof lifecycleRuntime.reloadActiveWorldScene !== 'function') {
                throw new Error('WorldSceneLifecycleRuntime is unavailable.');
            }
            lifecycleRuntime.reloadActiveWorldScene({
                scene,
                clickMarkers,
                activeHitsplats,
                environmentMeshes,
                hasScene: () => !!scene,
                hasPlayerRig: () => !!playerRig,
                initLogicalMap,
                resetChunkSceneState: () => {
                    getWorldChunkSceneRuntime().resetForWorldReload(buildChunkSceneRuntimeContext());
                },
                clearCombatEnemyRenderers: () => {
                    if (typeof window.clearCombatEnemyRenderers === 'function') window.clearCombatEnemyRenderers();
                },
                syncPlayerRigToState: () => {
                    if (!playerRig) return;
                    playerRig.position.set(
                        playerState.x,
                        heightMap[playerState.z][playerState.y][playerState.x] + (playerState.z * 3.0),
                        playerState.y
                    );
                    if (Number.isFinite(playerState.targetRotation)) {
                        playerRig.rotation.y = playerState.targetRotation;
                    }
                },
                syncFreeCamTargetToState: () => {
                    if (!isFreeCam) return;
                    freeCamTarget.set(
                        playerState.x,
                        heightMap[playerState.z][playerState.y][playerState.x] + (playerState.z * 3.0) + 1.0,
                        playerState.y
                    );
                },
                updateMinimapCanvas,
                manageChunks,
                updateWorldMapPanel
            });
        }

        function getWorldMapHudRuntime() {
            const runtime = window.WorldMapHudRuntime || null;
            if (!runtime) throw new Error('WorldMapHudRuntime is unavailable.');
            return runtime;
        }

        function getRenderRuntime() {
            return window.RenderRuntime || null;
        }

        function getInputControllerRuntime() {
            return window.InputControllerRuntime || null;
        }

        function resolveRenderWorldId() {
            const worldSceneStateRuntime = window.WorldSceneStateRuntime || null;
            if (worldSceneStateRuntime && typeof worldSceneStateRuntime.resolveRenderWorldId === 'function') {
                return worldSceneStateRuntime.resolveRenderWorldId();
            }
            return 'main_overworld';
        }

        function buildMapHudRuntimeContext() {
            return {
                document,
                mapSize: MAP_SIZE,
                chunkSize: CHUNK_SIZE,
                tileIds: TileId,
                getRenderRuntime,
                getInputControllerRuntime,
                resolveRenderWorldId,
                getTile: (x, y, z) => (logicalMap[z] && logicalMap[z][y]) ? logicalMap[z][y][x] : TileId.OBSTACLE,
                getVisualTileId,
                isTreeTileId,
                isDoorTileId,
                isWalkableTile: (x, y, z) => !!(logicalMap[z] && logicalMap[z][y] && isWalkableTileId(logicalMap[z][y][x])),
                queueWalk: (x, y) => queueAction('WALK', x, y, null),
                getSelectedUseItem,
                clearSelectedUse,
                getPlayerMapPosition: () => {
                    const playerX = (playerRig && playerRig.position && Number.isFinite(playerRig.position.x)) ? playerRig.position.x : playerState.x;
                    const playerY = (playerRig && playerRig.position && Number.isFinite(playerRig.position.z)) ? playerRig.position.z : playerState.y;
                    const facingYaw = (playerRig && Number.isFinite(playerRig.rotation && playerRig.rotation.y))
                        ? playerRig.rotation.y
                        : (Number.isFinite(playerState.targetRotation) ? playerState.targetRotation : 0);
                    return { x: playerX, y: playerY, z: playerState.z, facingYaw };
                },
                getClickMarkers: () => Array.isArray(clickMarkers)
                    ? clickMarkers.map((marker) => ({
                        x: marker && marker.mesh && marker.mesh.position ? marker.mesh.position.x : 0,
                        y: marker && marker.mesh && marker.mesh.position ? marker.mesh.position.z : 0,
                        z: Math.round((((marker && marker.mesh && marker.mesh.position ? marker.mesh.position.y : 0) || 0) / 3.0)),
                        visualY: marker && marker.mesh && marker.mesh.position ? marker.mesh.position.y : 0
                    }))
                    : [],
                getGroundItems: () => Array.isArray(groundItems)
                    ? groundItems.map((item) => ({
                        x: item.x,
                        y: item.y,
                        z: item.z,
                        uid: item.uid
                    }))
                    : [],
            };
        }

        function updateMinimapCanvas() {
            return getWorldMapHudRuntime().updateMinimapCanvas(buildMapHudRuntimeContext());
        }

        function buildHudRenderSnapshot() {
            return getWorldMapHudRuntime().buildHudRenderSnapshot(buildMapHudRuntimeContext());
        }

        function initWorldMapPanel() {
            getWorldMapHudRuntime().initWorldMapPanel(buildMapHudRuntimeContext());
        }

        function updateWorldMapPanel(forceCenterOnPlayer = false) {
            getWorldMapHudRuntime().updateWorldMapPanel(forceCenterOnPlayer, buildMapHudRuntimeContext());
        }

        function initMinimap() {
            getWorldMapHudRuntime().initMinimap(buildMapHudRuntimeContext());
        }

        function updateMinimap(frameNowMs = performance.now(), forceRender = false) {
            getWorldMapHudRuntime().updateMinimap(frameNowMs, forceRender, buildMapHudRuntimeContext());
        }
        function resolveTreeRespawnTicks(gridX, gridY, z) {
            return worldTreeLifecycleRuntime.resolveTreeRespawnTicks(buildTreeLifecycleRuntimeContext(), gridX, gridY, z);
        }

        function chopDownTree(gridX, gridY, z) {
            return worldTreeLifecycleRuntime.chopDownTree(buildTreeLifecycleRuntimeContext(), gridX, gridY, z);
        }

        function respawnTree(gridX, gridY, z) {
            return worldTreeLifecycleRuntime.respawnTree(buildTreeLifecycleRuntimeContext(), gridX, gridY, z);
        }

        function tickTreeLifecycle() {
            return worldTreeLifecycleRuntime.tickTreeLifecycle(buildTreeLifecycleRuntimeContext());
        }
        window.initLogicalMap = initLogicalMap;
        window.initThreeJS = initThreeJS;
        window.build3DEnvironment = build3DEnvironment;
        window.spawnMiningPoseReferences = spawnMiningPoseReferences;
        window.initMinimap = initMinimap;
        window.initUIPreview = initUIPreview;
        window.manageChunks = manageChunks;
        window.processPendingNearChunkBuilds = processPendingNearChunkBuilds;
        window.reloadActiveWorldScene = reloadActiveWorldScene;
        window.tickTreeLifecycle = tickTreeLifecycle;
        window.tickRockNodes = tickRockNodes;
        window.tickFireLifecycle = tickFireLifecycle;
        window.updateMainDirectionalShadowFocus = updateMainDirectionalShadowFocus;
        window.updateSkyRuntime = updateSkyRuntime;
        window.updateFires = updateFires;
        window.updateGroundItems = updateGroundItems;
        window.takeGroundItemByUid = takeGroundItemByUid;
        window.reportChunkPerformanceSample = reportChunkPerformanceSample;
        window.markChunkPolicyDirty = markChunkPolicyDirty;
        window.updateMiningPoseReferences = updateMiningPoseReferences;
        window.updateWorldNpcRuntime = updateWorldNpcRuntime;
        window.updateMinimap = updateMinimap;
        window.setLoadedChunkPlaneVisibility = setLoadedChunkPlaneVisibility;
        window.listQaNpcTargets = listQaNpcTargets;
        window.updateWorldMapPanel = updateWorldMapPanel;
        window.updateStats = updateStats;
        window.refreshSkillUi = refreshSkillUi;
