// --- Rest of ThreeJS & Engine Init ---
        let activeRoofVisuals = [];

        const worldProceduralRuntime = window.WorldProceduralRuntime || null;
        const worldRenderRuntime = window.WorldRenderRuntime || null;
        const worldSharedAssetsRuntime = window.WorldSharedAssetsRuntime || null;
        const worldWaterRuntime = window.WorldWaterRuntime || null;
        const worldTerrainSetupRuntime = window.WorldTerrainSetupRuntime || null;
        const worldLogicalMapAuthoringRuntime = window.WorldLogicalMapAuthoringRuntime || null;
        const worldMiningQuarryRuntime = window.WorldMiningQuarryRuntime || null;
        const worldPierRuntime = window.WorldPierRuntime || null;
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
        const worldStatusHudRuntime = window.WorldStatusHudRuntime || null;
        const skillProgressRuntime = window.SkillProgressRuntime || null;
        const inventoryItemRuntime = window.InventoryItemRuntime || null;
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
            return skillProgressRuntime.showXPDrop(skill, amount, { document, setTimeout });
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

        function buildStatusHudRuntimeContext() {
            return {
                document,
                playerSkills,
                equipment,
                playerState,
                uiDomainRuntime: window.UiDomainRuntime || null,
                getCurrentHitpoints,
                getMaxHitpoints
            };
        }

        function updateStats() {
            return worldStatusHudRuntime.updateStats(buildStatusHudRuntimeContext());
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

        const MAX_SKILL_LEVEL = skillProgressRuntime.MAX_SKILL_LEVEL;
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

        function buildSkillProgressRuntimeContext() {
            return {
                document,
                playerRig,
                playerSkills,
                skillManifest: window.SkillManifest || null,
                addChatMessage,
                playLevelUpAnimation,
                setTimeout,
                updateSkillProgressPanel: typeof updateSkillProgressPanel === 'function' ? updateSkillProgressPanel : null
            };
        }

        function getXpForLevel(level) {
            return skillProgressRuntime.getXpForLevel(level);
        }

        function getLevelForXp(xp) {
            return skillProgressRuntime.getLevelForXp(xp);
        }

        skillProgressRuntime.initializeSkillLevels(playerSkills);

        function getSkillUiLevelKey(skillName) {
            return skillProgressRuntime.getSkillUiLevelKey(skillName, window.SkillManifest || null);
        }

        function refreshSkillUi(skillName) {
            return skillProgressRuntime.refreshSkillUi(buildSkillProgressRuntimeContext(), skillName);
        }

        function addSkillXp(skillName, amount) {
            return skillProgressRuntime.addSkillXp(buildSkillProgressRuntimeContext(), skillName, amount);
        }

        function buildInventoryItemRuntimeContext() {
            return {
                inventory,
                selectedUse,
                clearSelectedUse,
                renderInventory
            };
        }

        function giveItem(itemData, amount = 1) {
            return inventoryItemRuntime.giveItem(buildInventoryItemRuntimeContext(), itemData, amount);
        }

        function getInventoryCount(itemId) {
            return inventoryItemRuntime.getInventoryCount(buildInventoryItemRuntimeContext(), itemId);
        }

        function getFirstInventorySlotByItemId(itemId) {
            return inventoryItemRuntime.getFirstInventorySlotByItemId(buildInventoryItemRuntimeContext(), itemId);
        }

        function removeOneItemById(itemId) {
            return inventoryItemRuntime.removeOneItemById(buildInventoryItemRuntimeContext(), itemId);
        }

        function removeItemsById(itemId, amount) {
            return inventoryItemRuntime.removeItemsById(buildInventoryItemRuntimeContext(), itemId, amount);
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

            furnacesToRender = worldPayload.furnacesToRender.map((station) => Object.assign({}, station));
            anvilsToRender = worldPayload.anvilsToRender.map((station) => Object.assign({}, station));
            const waterRenderBodies = Array.isArray(waterRenderPayload && waterRenderPayload.bodies)
                ? waterRenderPayload.bodies.slice()
                : [];
            sharedMaterials.activeWaterRenderBodies = waterRenderBodies;
            sharedMaterials.activePierConfig = Object.assign({}, pierConfig);

            const terrainSetup = worldTerrainSetupRuntime.applyBaseTerrainSetup({
                castleFrontPond,
                deepWaterCenter,
                heightMap,
                isPierSideWaterTile,
                lakeDefs,
                logicalMap,
                mapSize: MAP_SIZE,
                pierConfig,
                pierDeckTopHeight: PIER_DECK_TOP_HEIGHT,
                stampMap,
                stampedStructures,
                tileIds: TileId
            });
            const inTownCore = terrainSetup.inTownCore;
            const terrainNoise = terrainSetup.terrainNoise;
            const getStampBounds = terrainSetup.getStampBounds;

            const fishingMerchantAuthoring = worldLogicalMapAuthoringRuntime.applyFishingMerchantSpots({
                fishingMerchantSpots: worldPayload.fishingMerchantSpots,
                heightMap,
                logicalMap,
                mapSize: MAP_SIZE,
                npcsToRender,
                rememberStaticNpcBaseTile,
                tileIds: TileId
            });
            npcsToRender = fishingMerchantAuthoring.npcsToRender;

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

            const staticAuthoring = worldLogicalMapAuthoringRuntime.applyStaticWorldAuthoring({
                bankBoothsToRender,
                doorLandmarks,
                doorsToRender,
                fenceLandmarks,
                heightMap,
                logicalMap,
                mapSize: MAP_SIZE,
                npcsToRender,
                rememberStaticNpcBaseTile,
                roofLandmarks,
                smithingHallApproach,
                smithingStations,
                staircaseLandmarks,
                stampMap,
                stampedStructures,
                staticMerchantSpots: worldPayload.staticMerchantSpots,
                tileIds: TileId
            });
            bankBoothsToRender = staticAuthoring.bankBoothsToRender;
            doorsToRender = staticAuthoring.doorsToRender;
            npcsToRender = staticAuthoring.npcsToRender;
            refreshTutorialGateStates();
            sharedMaterials.activeRoofLandmarks = staticAuthoring.activeRoofLandmarks;

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
            const miningQuarryLayoutOverrides = worldMiningQuarryRuntime.getMiningQuarryLayoutOverrides();
            const getMiningQuarryLayout = (routeId, clusterPoints) => worldMiningQuarryRuntime.getMiningQuarryLayout(routeId, clusterPoints);
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

            const miningQuarryRuntimeOptions = {
                clamp01,
                hash2D,
                heightMap,
                logicalMap,
                mapSize: MAP_SIZE,
                miningNodePlacements,
                sampleFractalNoise2D,
                smoothstep,
                tileIds: TileId
            };
            const miningPlacementPlan = worldMiningQuarryRuntime.thinMiningRockPlacements(
                miningNodePlacements,
                miningQuarryRuntimeOptions
            );
            let activeMiningPlacements = miningPlacementPlan.active;

            // Shape the quarry floor before choosing the redistributed kept rock positions.
            applyMiningQuarryTerrain(miningNodePlacements, []);
            activeMiningPlacements = worldMiningQuarryRuntime.redistributeMiningRockPlacements(
                activeMiningPlacements,
                miningNodePlacements,
                miningQuarryRuntimeOptions
            );
            for (let i = 0; i < activeMiningPlacements.length; i++) {
                setMiningRockAt(activeMiningPlacements[i]);
            }

            const miningTrainingLocations = worldTrainingLocationRuntime.buildMiningTrainingLocations({
                routeDefs: miningTrainingRouteDefs,
                activePlacements: activeMiningPlacements,
                layoutOverrides: miningQuarryLayoutOverrides
            });

            RUNE_ESSENCE_ROCKS = activeMiningPlacements
                .filter((placement) => placement && placement.oreType === 'rune_essence')
                .map((placement) => ({ x: placement.x, y: placement.y, z: placement.z }));

            const altarAuthoring = worldLogicalMapAuthoringRuntime.applyAuthoredAltarCollision({
                authoredAltarPlacements,
                logicalMap,
                mapSize: MAP_SIZE,
                tileIds: TileId
            });
            altarCandidatesToRender = altarAuthoring.altarCandidatesToRender;

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

            const structureBoundsList = worldTownNpcRuntime.buildStructureBoundsList({
                getStampBounds,
                stampedStructures
            });

            worldTownNpcRuntime.resetLoadedChunkNpcActors();
            const actorNowMs = performance.now();
            npcsToRender = npcsToRender.map((npc, index) => worldTownNpcRuntime.createTownNpcActorRecord({
                actorNowMs,
                getTileHeightSafe,
                index,
                mapSize: MAP_SIZE,
                npc,
                structureBoundsList
            }));

            if (typeof window.initCombatWorldState === 'function') window.initCombatWorldState();
        }

        function listQaNpcTargets() {
            return worldTownNpcRuntime.listQaNpcTargets(npcsToRender);
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
            return worldPierRuntime.getActivePierConfig(sharedMaterials);
        }

        function isPierDeckTile(pierConfig, x, y, z) {
            return worldPierRuntime.isPierDeckTile(pierConfig, x, y, z);
        }

        function isPierSideWaterTile(pierConfig, x, y, z) {
            return worldPierRuntime.isPierSideWaterTile(pierConfig, x, y, z);
        }

        function isPierVisualCoverageTile(pierConfig, x, y, z) {
            return worldPierRuntime.isPierVisualCoverageTile(pierConfig, x, y, z);
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
        window.getXpForLevel = getXpForLevel;
        window.getLevelForXp = getLevelForXp;
        window.addSkillXp = addSkillXp;
        window.refreshSkillUi = refreshSkillUi;
