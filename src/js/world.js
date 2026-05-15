// --- Rest of ThreeJS & Engine Init ---
        let activeRoofVisuals = [];
        let activeStampedStructures = [];
        let activeStampMap = {};
        let activeStructureVisualStyleLookup = null;
        let tutorialGuidanceMarkerGroup = null;
        let tutorialGuidanceMarkerId = '';
        let tutorialGuidanceMarkerMaterials = null;
        let tutorialGuidanceMarkerGeometries = null;
        let farChunkBackdropBuilt = false;
        const FAR_CHUNK_BACKDROP_EAGER_CHUNK_LIMIT = 96;

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
        const equipmentItemRuntime = window.EquipmentItemRuntime || null;
        const foodItemRuntime = window.FoodItemRuntime || null;
        const inventoryActionRuntime = window.InventoryActionRuntime || null;
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

        function getWaterMaterialCaches() {
            return worldRenderRuntime.getWaterMaterialCaches(sharedMaterials);
        }

        function getWaterSurfaceMaterial(tokens) {
            return worldRenderRuntime.getWaterSurfaceMaterial({ THREE, sharedMaterials, tokens });
        }

        function getWaterFringeMaterial(tokens) {
            return worldRenderRuntime.getWaterFringeMaterial({ THREE, sharedMaterials, tokens });
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

        function rememberStaticObjectBaseTile(x, y, z, tileId) {
            worldTownNpcRuntime.rememberStaticObjectBaseTile(x, y, z, tileId);
        }

        function getVisualTileId(tileId, x, y, z) {
            return worldTownNpcRuntime.getVisualTileId(TileId, tileId, x, y, z);
        }

        function isFenceConnectorTile(tileId) {
            return worldTownNpcRuntime.isFenceConnectorTile(TileId, tileId);
        }

        const FENCE_TERRAIN_BASE_CARDINAL_OFFSETS = Object.freeze([
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 }
        ]);
        const FENCE_TERRAIN_BASE_DIAGONAL_OFFSETS = Object.freeze([
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: 1, y: 1 },
            { x: -1, y: 1 }
        ]);

        function isPreferredFenceTerrainBaseTile(tileId) {
            return tileId === TileId.GRASS
                || tileId === TileId.DIRT
                || tileId === TileId.SAND
                || tileId === TileId.SHORE
                || tileId === TileId.STUMP
                || tileId === TileId.ROCK;
        }

        function isFallbackFenceTerrainBaseTile(tileId) {
            return tileId === TileId.FLOOR_WOOD
                || tileId === TileId.FLOOR_STONE
                || tileId === TileId.FLOOR_BRICK
                || tileId === TileId.STAIRS_UP
                || tileId === TileId.STAIRS_DOWN
                || tileId === TileId.STAIRS_RAMP
                || tileId === TileId.DOOR_OPEN;
        }

        function findFenceTerrainBaseTileFromOffsets(x, y, z, offsets, predicate) {
            for (let i = 0; i < offsets.length; i++) {
                const nx = x + offsets[i].x;
                const ny = y + offsets[i].y;
                if (!logicalMap[z] || !logicalMap[z][ny]) continue;
                const tile = getVisualTileId(logicalMap[z][ny][nx], nx, ny, z);
                if (isFenceConnectorTile(tile)) continue;
                if (predicate(tile)) return tile;
            }
            return null;
        }

        function resolveFenceTerrainBaseTile(x, y, z) {
            return findFenceTerrainBaseTileFromOffsets(x, y, z, FENCE_TERRAIN_BASE_CARDINAL_OFFSETS, isPreferredFenceTerrainBaseTile)
                ?? findFenceTerrainBaseTileFromOffsets(x, y, z, FENCE_TERRAIN_BASE_DIAGONAL_OFFSETS, isPreferredFenceTerrainBaseTile)
                ?? findFenceTerrainBaseTileFromOffsets(x, y, z, FENCE_TERRAIN_BASE_CARDINAL_OFFSETS, isFallbackFenceTerrainBaseTile)
                ?? findFenceTerrainBaseTileFromOffsets(x, y, z, FENCE_TERRAIN_BASE_DIAGONAL_OFFSETS, isFallbackFenceTerrainBaseTile)
                ?? TileId.GRASS;
        }

        function getTerrainVisualTileId(tileId, x, y, z) {
            const visualTile = getVisualTileId(tileId, x, y, z);
            return isFenceConnectorTile(visualTile)
                ? resolveFenceTerrainBaseTile(x, y, z)
                : visualTile;
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

        function installTutorialGateHooks() {
            worldTownNpcRuntime.publishTutorialGateHooks({
                windowRef: window,
                buildContext: buildTownNpcRuntimeContext
            });
        }

        installTutorialGateHooks();

        function updateWorldNpcRuntime(frameNowMs) {
            worldTownNpcRuntime.updateWorldNpcRuntime(buildTownNpcRuntimeContext(), frameNowMs);
        }

        function getTutorialGuidanceMarkerMaterials() {
            if (tutorialGuidanceMarkerMaterials) return tutorialGuidanceMarkerMaterials;
            tutorialGuidanceMarkerMaterials = {
                dark: new THREE.MeshLambertMaterial({ color: 0x2a1a08, flatShading: true }),
                gold: new THREE.MeshLambertMaterial({ color: 0xd6a13a, flatShading: true, emissive: 0x241400 }),
                highlight: new THREE.MeshLambertMaterial({ color: 0xffd96a, flatShading: true, emissive: 0x2c1a00 })
            };
            return tutorialGuidanceMarkerMaterials;
        }

        function getTutorialGuidanceMarkerGeometries() {
            if (tutorialGuidanceMarkerGeometries) return tutorialGuidanceMarkerGeometries;
            tutorialGuidanceMarkerGeometries = {
                outerTip: new THREE.ConeGeometry(0.34, 0.62, 4),
                innerTip: new THREE.ConeGeometry(0.27, 0.54, 4),
                outerStem: new THREE.BoxGeometry(0.24, 0.48, 0.24),
                innerStem: new THREE.BoxGeometry(0.16, 0.42, 0.16),
                cap: new THREE.BoxGeometry(0.38, 0.08, 0.38)
            };
            return tutorialGuidanceMarkerGeometries;
        }

        function createTutorialGuidanceMarkerGroup() {
            const materials = getTutorialGuidanceMarkerMaterials();
            const geometries = getTutorialGuidanceMarkerGeometries();
            const group = new THREE.Group();
            group.name = 'tutorial_guidance_marker';

            const outerTip = new THREE.Mesh(geometries.outerTip, materials.dark);
            outerTip.rotation.x = Math.PI;
            outerTip.position.y = -0.16;
            group.add(outerTip);

            const innerTip = new THREE.Mesh(geometries.innerTip, materials.gold);
            innerTip.rotation.x = Math.PI;
            innerTip.position.y = -0.17;
            group.add(innerTip);

            const outerStem = new THREE.Mesh(geometries.outerStem, materials.dark);
            outerStem.position.y = 0.36;
            group.add(outerStem);

            const innerStem = new THREE.Mesh(geometries.innerStem, materials.gold);
            innerStem.position.y = 0.36;
            group.add(innerStem);

            const cap = new THREE.Mesh(geometries.cap, materials.highlight);
            cap.position.y = 0.63;
            group.add(cap);

            group.rotation.y = Math.PI * 0.25;
            group.traverse((child) => {
                if (!child || !child.isMesh) return;
                child.castShadow = false;
                child.receiveShadow = false;
                child.renderOrder = 10;
                if (!child.userData) child.userData = {};
                child.userData.ignoreRaycast = true;
            });
            return group;
        }

        function hideTutorialGuidanceMarker() {
            if (tutorialGuidanceMarkerGroup) tutorialGuidanceMarkerGroup.visible = false;
            tutorialGuidanceMarkerId = '';
        }

        function normalizeTutorialGuidanceNpcKey(value) {
            return typeof value === 'string' ? value.trim().toLowerCase() : '';
        }

        function findTutorialGuidanceNpcTarget(marker, markerZ) {
            if (!marker || marker.targetKind !== 'npc' || !Array.isArray(npcsToRender)) return null;
            const targetSpawnId = normalizeTutorialGuidanceNpcKey(marker.targetNpcSpawnId);
            const targetDialogueId = normalizeTutorialGuidanceNpcKey(marker.targetNpcDialogueId);
            const targetName = normalizeTutorialGuidanceNpcKey(marker.targetNpcName);
            if (!targetSpawnId && !targetDialogueId && !targetName) return null;
            for (let i = 0; i < npcsToRender.length; i++) {
                const npc = npcsToRender[i];
                if (!npc) continue;
                const npcZ = Number.isFinite(npc.z) ? Math.floor(npc.z) : 0;
                if (npcZ !== markerZ) continue;
                if (targetSpawnId) {
                    const actorId = normalizeTutorialGuidanceNpcKey(npc.actorId);
                    const spawnId = normalizeTutorialGuidanceNpcKey(npc.spawnId);
                    if (actorId === targetSpawnId || spawnId === targetSpawnId) return npc;
                }
                if (targetDialogueId && normalizeTutorialGuidanceNpcKey(npc.dialogueId) === targetDialogueId) return npc;
                if (targetName && normalizeTutorialGuidanceNpcKey(npc.name) === targetName) return npc;
            }
            return null;
        }

        function resolveTutorialGuidanceMarkerPose(marker, markerZ) {
            const npc = findTutorialGuidanceNpcTarget(marker, markerZ);
            if (npc) {
                const meshPosition = npc.mesh && npc.mesh.position ? npc.mesh.position : null;
                return {
                    x: meshPosition && Number.isFinite(meshPosition.x) ? meshPosition.x : (Number.isFinite(npc.visualX) ? npc.visualX : npc.x),
                    y: meshPosition && Number.isFinite(meshPosition.z) ? meshPosition.z : (Number.isFinite(npc.visualY) ? npc.visualY : npc.y),
                    baseY: meshPosition && Number.isFinite(meshPosition.y) ? meshPosition.y : (Number.isFinite(npc.visualBaseY) ? npc.visualBaseY : null),
                    followsNpc: true,
                    targetNpcActorId: typeof npc.actorId === 'string' ? npc.actorId : ''
                };
            }
            return {
                x: Number.isFinite(marker.x) ? marker.x : 0,
                y: Number.isFinite(marker.y) ? marker.y : 0,
                baseY: null,
                followsNpc: false,
                targetNpcActorId: ''
            };
        }

        function updateTutorialGuidanceMarker(frameNowMs) {
            const tutorialRuntime = window.TutorialRuntime || null;
            const marker = tutorialRuntime && typeof tutorialRuntime.getGuidanceMarker === 'function'
                ? tutorialRuntime.getGuidanceMarker()
                : null;
            if (!marker || !scene || !THREE) {
                hideTutorialGuidanceMarker();
                return;
            }
            const markerZ = Number.isFinite(marker.z) ? Math.floor(marker.z) : 0;
            if (playerState && Number.isFinite(playerState.z) && markerZ !== Math.floor(playerState.z)) {
                hideTutorialGuidanceMarker();
                return;
            }
            const markerPose = resolveTutorialGuidanceMarkerPose(marker, markerZ);
            const markerX = markerPose.x;
            const markerY = markerPose.y;
            const heightOffset = Number.isFinite(marker.heightOffset) ? marker.heightOffset : 2.35;
            if (!tutorialGuidanceMarkerGroup || tutorialGuidanceMarkerGroup.parent !== scene) {
                if (tutorialGuidanceMarkerGroup && tutorialGuidanceMarkerGroup.parent) {
                    tutorialGuidanceMarkerGroup.parent.remove(tutorialGuidanceMarkerGroup);
                }
                tutorialGuidanceMarkerGroup = createTutorialGuidanceMarkerGroup();
                scene.add(tutorialGuidanceMarkerGroup);
            }
            tutorialGuidanceMarkerId = typeof marker.markerId === 'string' ? marker.markerId : '';
            const frameMs = Number.isFinite(frameNowMs) ? frameNowMs : performance.now();
            const bob = Math.sin(frameMs * 0.004) * 0.1;
            const scale = marker.targetKind === 'water' ? 0.92 : 1;
            const groundHeight = Number.isFinite(markerPose.baseY)
                ? markerPose.baseY
                : getTileHeightSafe(Math.round(markerX), Math.round(markerY), markerZ);
            tutorialGuidanceMarkerGroup.position.set(markerX, groundHeight + heightOffset + bob, markerY);
            tutorialGuidanceMarkerGroup.scale.set(scale, scale, scale);
            tutorialGuidanceMarkerGroup.visible = true;
            if (!tutorialGuidanceMarkerGroup.userData) tutorialGuidanceMarkerGroup.userData = {};
            tutorialGuidanceMarkerGroup.userData.markerId = tutorialGuidanceMarkerId;
            tutorialGuidanceMarkerGroup.userData.label = typeof marker.label === 'string' ? marker.label : '';
            tutorialGuidanceMarkerGroup.userData.targetKind = typeof marker.targetKind === 'string' ? marker.targetKind : '';
            tutorialGuidanceMarkerGroup.userData.followsNpc = markerPose.followsNpc;
            tutorialGuidanceMarkerGroup.userData.targetNpcActorId = markerPose.targetNpcActorId;
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
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 900);
            scene.fog = null;
            renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDER_PIXEL_RATIO_CAP));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = !!MAIN_DIRECTIONAL_SHADOW_CONFIG.enabled;
            renderer.shadowMap.type = THREE.BasicShadowMap;
            renderer.shadowMap.autoUpdate = false;
            renderer.shadowMap.needsUpdate = true;
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
            const runtime = window.TransientVisualRuntime || null;
            if (!runtime || typeof runtime.spawnHitsplat !== 'function') return null;
            return runtime.spawnHitsplat({
                THREE,
                documentRef: document,
                activeHitsplats,
                playerState,
                heightMap,
                amount,
                gridX,
                gridY
            });
        }

        function playLevelUpAnimation(type, target) {
            const runtime = window.TransientVisualRuntime || null;
            if (!runtime || typeof runtime.playLevelUpAnimation !== 'function') return null;
            return runtime.playLevelUpAnimation({
                THREE,
                scene,
                levelUpAnimations,
                type,
                target
            });
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
                inventory,
                playerState,
                uiDomainRuntime: window.UiDomainRuntime || null,
                getCurrentHitpoints,
                getMaxHitpoints
            };
        }

        function updateStats() {
            return worldStatusHudRuntime.updateStats(buildStatusHudRuntimeContext());
        }

        const MAX_SKILL_LEVEL = skillProgressRuntime.MAX_SKILL_LEVEL;
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

        function buildEquipmentItemRuntimeContext() {
            return {
                equipment,
                inventory,
                playerSkills,
                addChatMessage,
                clearSelectedUse,
                updateStats,
                renderInventory,
                renderEquipment,
                updatePlayerModel
            };
        }

        function buildFoodItemRuntimeContext() {
            return {
                inventory,
                selectedUse,
                playerState,
                currentTick,
                addChatMessage,
                applyHitpointHealing,
                clearSelectedUse,
                updateStats,
                renderInventory
            };
        }

        function buildInventoryActionRuntimeContext() {
            return {
                inventory,
                selectedUse,
                RunecraftingPouchRuntime: window.RunecraftingPouchRuntime || null,
                SkillRuntime: window.SkillRuntime || null,
                clearSelectedUse,
                createRunecraftingPouchContext,
                dropItem,
                eatItem,
                equipItem: (invIndex) => equipmentItemRuntime.equipItem(buildEquipmentItemRuntimeContext(), invIndex),
                getFiremakingLogItemIdForPair,
                getItemMenuPreferenceKey: typeof getItemMenuPreferenceKey === 'function' ? getItemMenuPreferenceKey : null,
                getSelectedUseItem,
                resolveDefaultItemAction,
                selectUseItem,
                startFiremaking
            };
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
            return inventoryActionRuntime.tryUseItemOnInventory(buildInventoryActionRuntimeContext(), sourceInvIndex, targetInvIndex);
        }

        function tryUseItemOnWorld(sourceInvIndex, hitData) {
            return inventoryActionRuntime.tryUseItemOnWorld(buildInventoryActionRuntimeContext(), sourceInvIndex, hitData);
        }

        function handleInventorySlotClick(invIndex) {
            return inventoryActionRuntime.handleInventorySlotClick(buildInventoryActionRuntimeContext(), invIndex);
        }
        function eatItem(invIndex) {
            return foodItemRuntime.eatItem(buildFoodItemRuntimeContext(), invIndex);
        }

        function handleItemAction(invIndex, actionName) {
            return inventoryActionRuntime.handleItemAction(buildInventoryActionRuntimeContext(), invIndex, actionName);
        }

        function hasWeaponClassAvailable(weaponClass) {
            return equipmentItemRuntime.hasWeaponClassAvailable(buildEquipmentItemRuntimeContext(), weaponClass);
        }

        function autoEquipWeaponClass(weaponClass) {
            return equipmentItemRuntime.autoEquipWeaponClass(buildEquipmentItemRuntimeContext(), weaponClass);
        }

        function unequipItem(slotName) {
            return equipmentItemRuntime.unequipItem(buildEquipmentItemRuntimeContext(), slotName);
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
            caveOpeningsToRender = [];
            doorsToRender = [];
            activeRoofVisuals = [];
            fishingSpotsToRender = [];
            cookingFireSpotsToRender = [];
            directionalSignsToRender = [];
            decorPropsToRender = [];
            altarCandidatesToRender = [];
            furnacesToRender = [];
            anvilsToRender = [];
            const worldSceneStateRuntime = window.WorldSceneStateRuntime || null;
            const worldPayload = (worldSceneStateRuntime && typeof worldSceneStateRuntime.getCurrentWorldScenePayload === 'function')
                ? worldSceneStateRuntime.getCurrentWorldScenePayload()
                : null;
            if (!worldPayload) throw new Error('WorldSceneStateRuntime is unavailable.');
            const lakeDefs = worldPayload.lakeDefs;
            const islandWater = worldPayload.islandWater;
            const castleFrontPond = worldPayload.castleFrontPond;
            const deepWaterCenter = worldPayload.deepWaterCenter;
            const pierConfig = worldPayload.pierConfig;
            const pathPatches = Array.isArray(worldPayload.pathPatches) ? worldPayload.pathPatches : [];
            const landformPatches = Array.isArray(worldPayload.landformPatches) ? worldPayload.landformPatches : [];
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
            const caveOpeningLandmarks = worldPayload.caveOpeningLandmarks;
            const decorPropLandmarks = worldPayload.decorPropLandmarks;
            const showcaseTreeDefs = worldPayload.showcaseTreeDefs;

            furnacesToRender = worldPayload.furnacesToRender.map((station) => Object.assign({}, station));
            anvilsToRender = worldPayload.anvilsToRender.map((station) => Object.assign({}, station));
            caveOpeningsToRender = Array.isArray(caveOpeningLandmarks)
                ? caveOpeningLandmarks.map((opening) => Object.assign({}, opening, {
                    tags: Array.isArray(opening.tags) ? opening.tags.slice() : []
                }))
                : [];
            const waterRenderBodies = Array.isArray(waterRenderPayload && waterRenderPayload.bodies)
                ? waterRenderPayload.bodies.slice()
                : [];
            sharedMaterials.activeWaterRenderBodies = waterRenderBodies;
            sharedMaterials.activeIslandWater = islandWater && islandWater.enabled !== false
                ? islandWater
                : null;
            sharedMaterials.activePierConfig = pierConfig && pierConfig.enabled !== false
                ? Object.assign({}, pierConfig)
                : null;
            refreshWorldOceanBackdrop();

            const terrainSetup = worldTerrainSetupRuntime.applyBaseTerrainSetup({
                castleFrontPond,
                deepWaterCenter,
                disableLegacyRiver: !waterRenderBodies.some((body) => body && body.id === 'legacy-east-river'),
                heightMap,
                isPierSideWaterTile,
                islandWater,
                lakeDefs,
                landformPatches,
                logicalMap,
                mapSize: MAP_SIZE,
                pathPatches,
                pierConfig,
                pierDeckTopHeight: PIER_DECK_TOP_HEIGHT,
                stampMap,
                stampedStructures,
                tileIds: TileId
            });
            const inTownCore = terrainSetup.inTownCore;
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
                    || tile === TileId.SAND
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
                decorPropLandmarks,
                decorPropsToRender,
                doorLandmarks,
                doorsToRender,
                fenceLandmarks,
                heightMap,
                logicalMap,
                mapSize: MAP_SIZE,
                npcsToRender,
                rememberStaticObjectBaseTile,
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
            decorPropsToRender = staticAuthoring.decorPropsToRender;
            doorsToRender = staticAuthoring.doorsToRender;
            npcsToRender = staticAuthoring.npcsToRender;
            worldTownNpcRuntime.refreshTutorialGateStates(buildTownNpcRuntimeContext());
            sharedMaterials.activeRoofLandmarks = staticAuthoring.activeRoofLandmarks;
            activeStampedStructures = Array.isArray(stampedStructures)
                ? stampedStructures.map((structure) => Object.assign({}, structure))
                : [];
            activeStampMap = stampMap || {};
            activeStructureVisualStyleLookup = worldStructureRenderRuntime.buildStructureVisualStyleLookup({
                stampedStructures: activeStampedStructures,
                stampMap: activeStampMap
            });
            sharedMaterials.activeStampedStructures = activeStampedStructures;
            sharedMaterials.activeStampMap = activeStampMap;

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
            const DRY_QUARRY_FLOOR_MIN_HEIGHT = -0.052;
            const DRY_QUARRY_FLOOR_MAX_HEIGHT = -0.018;
            const DRY_QUARRY_SHOULDER_MIN_HEIGHT = -0.035;
            const isQuarrySculptTile = (x, y) => {
                if (x <= 1 || y <= 1 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return false;
                if (inTownCore(x, y)) return false;
                const row = logicalMap[0] && logicalMap[0][y];
                if (!row) return false;
                const tile = row[x];
                return tile === TileId.GRASS || tile === TileId.DIRT || tile === TileId.SAND || tile === TileId.ROCK || tile === TileId.STUMP;
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
                        heightMap[0][coord.y][coord.x] = Math.min(DRY_QUARRY_FLOOR_MAX_HEIGHT, Math.max(DRY_QUARRY_FLOOR_MIN_HEIGHT, currentHeight));
                    } else {
                        heightMap[0][coord.y][coord.x] = Math.max(DRY_QUARRY_SHOULDER_MIN_HEIGHT, currentHeight);
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
                islandWater: sharedMaterials.activeIslandWater || null,
                isWaterTileId,
                isPierVisualCoverageTile,
                getActivePierConfig,
                getWaterSurfaceMaterial,
                getWaterFringeMaterial
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

        function createWaterBackdropMesh(bounds, surfaceY, styleTokens, depthWeight = 1.0, shoreStrength = 0.02) {
            return worldWaterRuntime.createWaterBackdropMesh(Object.assign(buildWorldWaterRuntimeContext(), {
                bounds,
                surfaceY,
                styleTokens,
                depthWeight,
                shoreStrength
            }));
        }

        function removeWorldOceanBackdrop() {
            const mesh = sharedMaterials.worldOceanBackdrop || null;
            if (mesh && mesh.parent) mesh.parent.remove(mesh);
            if (mesh && typeof mesh.traverse === 'function') {
                mesh.traverse((child) => {
                    if (!child) return;
                    if (child.geometry && typeof child.geometry.dispose === 'function') child.geometry.dispose();
                    if (child.userData && child.userData.disposeMaterialOnRemove && child.material && typeof child.material.dispose === 'function') {
                        child.material.dispose();
                    }
                });
            } else if (mesh) {
                if (mesh.geometry && typeof mesh.geometry.dispose === 'function') mesh.geometry.dispose();
                if (mesh.userData && mesh.userData.disposeMaterialOnRemove && mesh.material && typeof mesh.material.dispose === 'function') {
                    mesh.material.dispose();
                }
            }
            sharedMaterials.worldOceanBackdrop = null;
        }

        function findFullMapOceanBody(waterBodies) {
            const bodies = Array.isArray(waterBodies) ? waterBodies : [];
            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (!body || !body.bounds || !body.shape || body.shape.kind !== 'box') continue;
                if (body.bounds.xMin > 1 || body.bounds.yMin > 1) continue;
                if (body.bounds.xMax < MAP_SIZE - 2 || body.bounds.yMax < MAP_SIZE - 2) continue;
                return body;
            }
            return null;
        }

        function getIslandWaterLandBounds(islandWater) {
            const points = islandWater && islandWater.enabled !== false && Array.isArray(islandWater.landPolygon)
                ? islandWater.landPolygon
                : [];
            let xMin = Infinity;
            let xMax = -Infinity;
            let yMin = Infinity;
            let yMax = -Infinity;
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
                xMin = Math.min(xMin, point.x);
                xMax = Math.max(xMax, point.x);
                yMin = Math.min(yMin, point.y);
                yMax = Math.max(yMax, point.y);
            }
            if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || !Number.isFinite(yMin) || !Number.isFinite(yMax)) return null;
            return { xMin, xMax, yMin, yMax };
        }

        const ISLAND_OCEAN_BACKDROP_UNDERLAP = 9.0;
        const WORLD_OCEAN_BACKDROP_SURFACE_DROP = 0.024;

        function appendInteriorOceanBackdropBands(backdropBands, islandWater) {
            const landBounds = getIslandWaterLandBounds(islandWater);
            if (!landBounds) return;
            const underlap = ISLAND_OCEAN_BACKDROP_UNDERLAP;
            const topBandMaxY = Math.min(MAP_SIZE, Math.max(0, landBounds.yMin + underlap));
            const bottomBandMinY = Math.min(MAP_SIZE, Math.max(0, landBounds.yMax - underlap));
            const leftBandMaxX = Math.min(MAP_SIZE, Math.max(0, landBounds.xMin + underlap));
            const rightBandMinX = Math.min(MAP_SIZE, Math.max(0, landBounds.xMax - underlap));
            const sideBandMinY = topBandMaxY;
            const sideBandMaxY = bottomBandMinY;
            if (topBandMaxY > 0.01) backdropBands.push({ xMin: 0, xMax: MAP_SIZE, yMin: 0, yMax: topBandMaxY });
            if (bottomBandMinY < MAP_SIZE - 0.01) backdropBands.push({ xMin: 0, xMax: MAP_SIZE, yMin: bottomBandMinY, yMax: MAP_SIZE });
            if (sideBandMaxY <= sideBandMinY) return;
            if (leftBandMaxX > 0.01) backdropBands.push({ xMin: 0, xMax: leftBandMaxX, yMin: sideBandMinY, yMax: sideBandMaxY });
            if (rightBandMinX < MAP_SIZE - 0.01) backdropBands.push({ xMin: rightBandMinX, xMax: MAP_SIZE, yMin: sideBandMinY, yMax: sideBandMaxY });
        }

        function refreshWorldOceanBackdrop() {
            removeWorldOceanBackdrop();
            if (!scene) return null;
            const waterBodies = Array.isArray(sharedMaterials.activeWaterRenderBodies)
                ? sharedMaterials.activeWaterRenderBodies
                : [];
            const oceanBody = findFullMapOceanBody(waterBodies);
            if (!oceanBody || !oceanBody.styleTokens) return null;
            const padding = Math.max(192, Math.floor(MAP_SIZE * 0.6));
            const surfaceY = (Number.isFinite(oceanBody.surfaceY) ? oceanBody.surfaceY : -0.075) - WORLD_OCEAN_BACKDROP_SURFACE_DROP;
            const backdropBands = [
                { xMin: -padding, xMax: MAP_SIZE + padding, yMin: -padding, yMax: 0 },
                { xMin: -padding, xMax: MAP_SIZE + padding, yMin: MAP_SIZE, yMax: MAP_SIZE + padding },
                { xMin: -padding, xMax: 0, yMin: 0, yMax: MAP_SIZE },
                { xMin: MAP_SIZE, xMax: MAP_SIZE + padding, yMin: 0, yMax: MAP_SIZE }
            ];
            appendInteriorOceanBackdropBands(backdropBands, sharedMaterials.activeIslandWater || null);
            const backdrop = createWaterBackdropMesh(backdropBands, surfaceY, oceanBody.styleTokens, 1.0, 0.02);
            if (!backdrop) return null;
            backdrop.userData = Object.assign({}, backdrop.userData, { type: 'WATER_BACKDROP', waterBodyId: oceanBody.id });
            scene.add(backdrop);
            sharedMaterials.worldOceanBackdrop = backdrop;
            return backdrop;
        }

        function createTopAnchoredFloorMesh(material, x, y, zOffset, topHeight, z) {
            return worldStructureRenderRuntime.createTopAnchoredFloorMesh({ THREE, material, x, y, zOffset, topHeight, z });
        }

        function createFenceVisualGroup(x, y, z, zOffset, baseHeight) {
            return worldStructureRenderRuntime.createFenceVisualGroup({
                THREE,
                sharedMaterials,
                sharedGeometries,
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

        function getStructureMaterialProfileIdAt(x, y, z) {
            const style = worldStructureRenderRuntime.getStructureVisualStyleAt(activeStructureVisualStyleLookup, x, y, z);
            return style && style.materialProfileId ? style.materialProfileId : 'castle_granite_slate';
        }

        function appendChunkLandmarkVisuals(planeGroup, z, Z_OFFSET, startX, startY, endX, endY) {
            worldStructureRenderRuntime.appendChunkLandmarkVisuals({
                THREE,
                sharedMaterials,
                environmentMeshes,
                heightMap,
                planeGroup,
                bankBoothsToRender,
                caveOpeningsToRender,
                furnacesToRender,
                anvilsToRender,
                directionalSignsToRender,
                decorPropsToRender,
                createEquipmentVisualMeshes: typeof window.createEquipmentVisualMeshes === 'function'
                    ? window.createEquipmentVisualMeshes
                    : null,
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
                now: () => performance.now(),
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
            farChunkBackdropBuilt = false;
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
                waterRenderBodies: Array.isArray(sharedMaterials.activeWaterRenderBodies)
                    ? sharedMaterials.activeWaterRenderBodies
                    : [],
                getVisualTileId,
                getTerrainVisualTileId,
                isTreeTileId,
                isWaterTileId,
                isPierVisualCoverageTile,
                getActivePierConfig,
                getWaterSurfaceMaterial,
                resolveVisualWaterRenderBodyForTile,
                islandWater: sharedMaterials.activeIslandWater || null,
                isIslandCoastlineWaterTile: worldWaterRuntime.isIslandCoastlineWaterTile,
                stampedStructures: Array.isArray(sharedMaterials.activeStampedStructures)
                    ? sharedMaterials.activeStampedStructures
                    : [],
                stampMap: sharedMaterials.activeStampMap || {},
                roofLandmarks: Array.isArray(sharedMaterials.activeRoofLandmarks)
                    ? sharedMaterials.activeRoofLandmarks
                    : [],
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
            if (farChunkBackdropBuilt) return;
            if ((WORLD_CHUNKS_X * WORLD_CHUNKS_Y) > FAR_CHUNK_BACKDROP_EAGER_CHUNK_LIMIT) {
                farChunkBackdropBuilt = true;
                return;
            }
            for (let cy = 0; cy < WORLD_CHUNKS_Y; cy++) {
                for (let cx = 0; cx < WORLD_CHUNKS_X; cx++) {
                    ensureFarChunkGroup(cx, cy);
                }
            }
            farChunkBackdropBuilt = true;
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
                islandWater: sharedMaterials.activeIslandWater || null,
                activePierConfig,
                planeGroup,
                environmentMeshes,
                isNaturalTileId,
                isWaterTileId,
                isPierVisualCoverageTile,
                getVisualTileId,
                getTerrainVisualTileId,
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

                let wCount = 0, cCount = 0, fenceCount = 0;
                const wallCountsByStyle = {};
                const towerCountsByStyle = {};
                const floorCounts = { stone: 0, wood: 0, brick: 0 };
                const visualTileRows = [];
                const resourceCounts = worldChunkResourceRenderRuntime.createEmptyResourceVisualCounts();
                const getChunkVisualTileId = (rawTile, tileX, tileY, tileZ) => {
                    if (tileZ === z && tileX >= startX && tileX < endX && tileY >= startY && tileY < endY) {
                        const row = visualTileRows[tileY - startY];
                        if (row && row[tileX - startX] !== undefined) return row[tileX - startX];
                    }
                    return getVisualTileId(rawTile, tileX, tileY, tileZ);
                };
                const resourceCountOptions = {
                    TileId,
                    currentTick,
                    isTreeTileId,
                    getRockNodeAt,
                    getRockVisualIdForNode
                };
                for (let y = startY; y < endY; y++) {
                    const visualTileRow = [];
                    visualTileRows[y - startY] = visualTileRow;
                    for (let x = startX; x < endX; x++) {
                        const tile = getVisualTileId(logicalMap[z][y][x], x, y, z);
                        visualTileRow[x - startX] = tile;
                        worldChunkResourceRenderRuntime.countChunkResourceVisualTile(resourceCounts, resourceCountOptions, tile, x, y, z);
                        if (tile === TileId.WALL) {
                            wCount++;
                            const materialProfileId = getStructureMaterialProfileIdAt(x, y, z);
                            wallCountsByStyle[materialProfileId] = (wallCountsByStyle[materialProfileId] || 0) + 1;
                        }
                        else if (tile === TileId.TOWER) {
                            cCount++;
                            const materialProfileId = getStructureMaterialProfileIdAt(x, y, z);
                            towerCountsByStyle[materialProfileId] = (towerCountsByStyle[materialProfileId] || 0) + 1;
                        }
                        else if (tile === TileId.FENCE) fenceCount++;
                        const floorBucket = worldStructureRenderRuntime.getFloorTileRenderBucket({
                            logicalMap,
                            TileId,
                            pierConfig: activePierConfig,
                            isPierDeckTile,
                            visualTile: tile,
                            x,
                            y,
                            z
                        });
                        if (floorBucket && floorCounts[floorBucket] !== undefined) floorCounts[floorBucket]++;
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
                    towerCount: cCount,
                    wallCountsByStyle,
                    towerCountsByStyle
                });
                let fenceData = worldStructureRenderRuntime.createFenceRenderData({
                    THREE,
                    sharedGeometries,
                    sharedMaterials,
                    planeGroup,
                    environmentMeshes,
                    fenceCount
                });
                let floorData = worldStructureRenderRuntime.createFloorTileRenderData({
                    THREE,
                    sharedGeometries,
                    sharedMaterials,
                    planeGroup,
                    environmentMeshes,
                    floorCounts
                });

                const dummyTransform = new THREE.Object3D();
                let wIdx = 0, cIdx = 0;
                const chunkWaterBuilders = Object.create(null);
                appendChunkWaterTilesToBuilders(chunkWaterBuilders, waterRenderBodies, z, Z_OFFSET, startX, startY, endX, endY);

                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const tile = visualTileRows[y - startY][x - startX];

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
                            getVisualTileId: getChunkVisualTileId,
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
                            worldStructureRenderRuntime.appendFenceVisualState({
                                fenceData,
                                dummyTransform,
                                logicalMap,
                                TileId,
                                mapSize: MAP_SIZE,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET,
                                baseHeight: heightMap[z][y][x],
                                getVisualTileId: getChunkVisualTileId,
                                isFenceConnectorTile
                            });
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
                                wallIndex: wIdx,
                                materialProfileId: getStructureMaterialProfileIdAt(x, y, z)
                            });
                        } else if (tile === TileId.TOWER) {
                            cIdx = worldStructureRenderRuntime.setCastleTowerVisualState({
                                castleData,
                                dummyTransform,
                                x,
                                y,
                                z,
                                zOffset: Z_OFFSET,
                                towerIndex: cIdx,
                                materialProfileId: getStructureMaterialProfileIdAt(x, y, z)
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
                            worldStructureRenderRuntime.appendFloorTileVisualState({
                                floorData,
                                dummyTransform,
                                logicalMap,
                                heightMap,
                                TileId,
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
                worldStructureRenderRuntime.markFenceRenderDataDirty(fenceData);
                worldStructureRenderRuntime.markFloorTileRenderDataDirty(floorData);

                planeGroup.userData.trees = resourceRenderState.treeData;
                planeGroup.userData.rocks = resourceRenderState.rockData;

                appendChunkLandmarkVisuals(planeGroup, z, Z_OFFSET, startX, startY, endX, endY);

                const activeRoofs = Array.isArray(sharedMaterials.activeRoofLandmarks) ? sharedMaterials.activeRoofLandmarks : [];
                activeRoofs.forEach((roof) => {
                    if (!chunkIntersectsRoof(roof, startX, startY, endX, endY, z)) return;
                    const roofGroup = createRoofVisualGroup(roof, Z_OFFSET);
                    if (roofGroup) planeGroup.add(roofGroup);
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

        function unloadChunkGroup(key, group, metadata = {}) {
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
                const interactionMeshes = Array.isArray(metadata.interactionMeshes) ? metadata.interactionMeshes : null;
                if (interactionMeshes && interactionMeshes.length > 0) {
                    const removeSet = new Set(interactionMeshes);
                    environmentMeshes = environmentMeshes.filter((mesh) => !removeSet.has(mesh));
                } else {
                    environmentMeshes = environmentMeshes.filter(m => {
                        let parent = m;
                        while (parent) {
                            if (parent === group) return false;
                            parent = parent.parent;
                        }
                        return true;
                    });
                }
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
            refreshWorldOceanBackdrop();
            clearPendingNearChunkBuilds();
            farChunkBackdropBuilt = false;
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
                    farChunkBackdropBuilt = false;
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
                getWorldMapInitialCenter: () => resolveRenderWorldId() === 'tutorial_island'
                    ? { x: 330, y: 328 }
                    : null,
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

        function getRuntimePerformanceSnapshot() {
            const canvas = renderer && renderer.domElement ? renderer.domElement : null;
            let webglVendor = '';
            let webglRenderer = '';
            if (canvas && typeof canvas.getContext === 'function') {
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    webglVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
                    webglRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
                }
            }
            const size = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; return this; } };
            if (renderer && typeof renderer.getDrawingBufferSize === 'function') renderer.getDrawingBufferSize(size);
            const activePreset = typeof window.getActiveChunkRenderPolicyPreset === 'function'
                ? window.getActiveChunkRenderPolicyPreset()
                : null;
            const chunkPolicy = typeof window.getChunkRenderPolicy === 'function'
                ? window.getChunkRenderPolicy(activePreset || undefined)
                : null;
            const chunkStreaming = getWorldChunkSceneRuntime()
                && typeof getWorldChunkSceneRuntime().getChunkStreamingQueueStats === 'function'
                ? getWorldChunkSceneRuntime().getChunkStreamingQueueStats()
                : null;
            return {
                fps: document.getElementById('fps-value') ? document.getElementById('fps-value').innerText : '',
                renderCalls: renderer && renderer.info ? renderer.info.render.calls : null,
                triangles: renderer && renderer.info ? renderer.info.render.triangles : null,
                pixelRatio: renderer && typeof renderer.getPixelRatio === 'function' ? renderer.getPixelRatio() : null,
                drawingBuffer: [size.x, size.y],
                webglVendor,
                webglRenderer,
                softwareWebglRenderer: /swiftshader|software|llvmpipe|mesa offscreen/i.test(String(webglRenderer || '')),
                chunkPolicyPreset: activePreset,
                chunkPolicy,
                chunkStreaming
            };
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
        window.updateTutorialGuidanceMarker = updateTutorialGuidanceMarker;
        window.updateFires = updateFires;
        window.updateGroundItems = updateGroundItems;
        window.takeGroundItemByUid = takeGroundItemByUid;
        window.reportChunkPerformanceSample = reportChunkPerformanceSample;
        window.updateMiningPoseReferences = updateMiningPoseReferences;
        window.updateWorldNpcRuntime = updateWorldNpcRuntime;
        window.updateMinimap = updateMinimap;
        window.getRuntimePerformanceSnapshot = getRuntimePerformanceSnapshot;
        window.setLoadedChunkPlaneVisibility = setLoadedChunkPlaneVisibility;
        window.listQaNpcTargets = listQaNpcTargets;
        window.updateWorldMapPanel = updateWorldMapPanel;
        window.updateStats = updateStats;
        window.getXpForLevel = getXpForLevel;
        window.getLevelForXp = getLevelForXp;
        window.addSkillXp = addSkillXp;
        window.refreshSkillUi = refreshSkillUi;
