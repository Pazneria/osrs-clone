function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25)); renderer.setSize(window.innerWidth, window.innerHeight); }
        const poseEditor = {
            enabled: false,
            values: null,
            handleMap: {},
            activeHandle: null,
            dragOffset: new THREE.Vector3(),
            dragPlane: new THREE.Plane(),
            dragPoint: new THREE.Vector3(),
            raycaster: new THREE.Raycaster(),
            pointer: new THREE.Vector2(),
            panel: null,
            text: null,
            mode: 'translate',
            rotationAxis: 'x',
            dragLastX: 0,
            dragLastY: 0,
            modeSelect: null,
            axisSelect: null
        };
        const LEGACY_PATHFIND_MAP_SIZE = 486;
        const PATHFIND_MAX_ITERATIONS = Math.max(
            25000,
            Math.floor(25000 * Math.pow((MAP_SIZE / LEGACY_PATHFIND_MAP_SIZE), 2))
        );
        // In open terrain, BFS iteration budget approximates a Chebyshev radius. Keep tooltip range slightly under that.
        const MAX_PATHFIND_OPEN_AREA_RADIUS_TILES = Math.floor((Math.sqrt(PATHFIND_MAX_ITERATIONS + 1) - 1) / 2);
        const MAX_TOOLTIP_WALK_DISTANCE_TILES = 90;
        const inputControllerRuntime = window.InputControllerRuntime || null;
        const animationRuntimeBridge = window.AnimationRuntimeBridge || null;
        const animationStudioBridge = window.AnimationStudioBridge || null;

        function isAnimationStudioActive() {
            return !!(animationStudioBridge
                && typeof animationStudioBridge.isStudioActive === 'function'
                && animationStudioBridge.isStudioActive());
        }

        function buildInputControllerContext() {
            if (inputControllerRuntime && typeof inputControllerRuntime.createInputControllerContext === 'function') {
                return inputControllerRuntime.createInputControllerContext({
                    isFreeCam,
                    isDraggingCamera,
                    poseEditorEnabled: !!poseEditor.enabled,
                    poseEditorDragging: !!poseEditor.activeHandle,
                    cameraYaw,
                    cameraPitch,
                    cameraDist,
                    previousMousePosition: { x: previousMousePosition.x, y: previousMousePosition.y },
                    currentMousePosition: { x: currentMouseX, y: currentMouseY },
                    playerPlane: playerState.z
                });
            }
            return {
                isFreeCam,
                isDraggingCamera,
                poseEditorEnabled: !!poseEditor.enabled,
                poseEditorDragging: !!poseEditor.activeHandle,
                cameraYaw,
                cameraPitch,
                cameraDist,
                previousMousePosition: { x: previousMousePosition.x, y: previousMousePosition.y },
                currentMousePosition: { x: currentMouseX, y: currentMouseY },
                playerPlane: playerState.z
            };
        }

        function onPointerDown(event) {
            if (isAnimationStudioActive()) return;
            const decision = inputControllerRuntime && typeof inputControllerRuntime.resolvePointerDown === 'function'
                ? inputControllerRuntime.resolvePointerDown(buildInputControllerContext(), {
                    button: event.button,
                    clientX: event.clientX,
                    clientY: event.clientY
                })
                : null;

            if (decision && decision.preventDefault) event.preventDefault();
            if (decision && decision.closeContextMenu) closeContextMenu();
            if (decision && decision.beginPoseEditorDrag) {
                if (beginPoseEditorDrag(event.clientX, event.clientY)) return;
                return;
            }
            if (decision && decision.beginCameraDrag) {
                isDraggingCamera = true;
                if (decision.nextPreviousMousePosition) {
                    previousMousePosition = decision.nextPreviousMousePosition;
                }
                return;
            }
            if (decision && decision.handleInteractionRaycast) {
                handleInteractionRaycast(event.clientX, event.clientY);
            }
        }

        function onPointerMove(event) {
            if (isAnimationStudioActive()) return;
            const decision = inputControllerRuntime && typeof inputControllerRuntime.resolvePointerMove === 'function'
                ? inputControllerRuntime.resolvePointerMove(buildInputControllerContext(), {
                    clientX: event.clientX,
                    clientY: event.clientY
                })
                : null;

            currentMouseX = decision && decision.nextCurrentMousePosition ? decision.nextCurrentMousePosition.x : event.clientX;
            currentMouseY = decision && decision.nextCurrentMousePosition ? decision.nextCurrentMousePosition.y : event.clientY;
            
            if (poseEditor.enabled && poseEditor.activeHandle) {
                updatePoseEditorDrag(event.clientX, event.clientY);
                return;
            }
            
            if (decision && decision.nextCameraYaw !== null && decision.nextCameraPitch !== null) {
                cameraYaw = decision.nextCameraYaw;
                cameraPitch = decision.nextCameraPitch;
                if (decision.nextPreviousMousePosition) {
                    previousMousePosition = decision.nextPreviousMousePosition;
                }
            } else if (isDraggingCamera) {
                cameraYaw += (event.clientX - previousMousePosition.x) * 0.01; 
                cameraPitch -= (event.clientY - previousMousePosition.y) * 0.01;
                cameraPitch = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPitch)); 
                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        }

        function onPointerUp(event) {
            if (isAnimationStudioActive()) return;
            const decision = inputControllerRuntime && typeof inputControllerRuntime.resolvePointerUp === 'function'
                ? inputControllerRuntime.resolvePointerUp(buildInputControllerContext(), {
                    button: event.button
                })
                : null;

            if ((decision && decision.endPoseEditorDrag) || (event.button === 0 && poseEditor.activeHandle)) {
                poseEditor.activeHandle = null;
                return;
            }
            if ((decision && decision.endCameraDrag) || event.button === 1 || (isFreeCam && event.button === 0)) isDraggingCamera = false;
        }
        
        function onMouseWheel(event) { 
            if (isAnimationStudioActive()) return;
            event.preventDefault(); 
            cameraDist = inputControllerRuntime && typeof inputControllerRuntime.resolveMouseWheelCameraDistance === 'function'
                ? inputControllerRuntime.resolveMouseWheelCameraDistance(cameraDist, event.deltaY)
                : Math.max(5, Math.min(30, cameraDist + (Math.sign(event.deltaY) * 1.5))); 

        }

        function normalizeContextMenuOptions(options) {
            if (inputControllerRuntime && typeof inputControllerRuntime.normalizeContextMenuOptions === 'function') {
                return inputControllerRuntime.normalizeContextMenuOptions(options);
            }
            if (!Array.isArray(options) || options.length === 0) return [];
            const normalized = [];
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                if (!option || typeof option.text !== 'string' || typeof option.onSelect !== 'function') continue;
                normalized.push(option);
            }
            return normalized;
        }

        function resolveSkillContextMenuOptions(hitData) {
            if (!window.SkillRuntime || typeof SkillRuntime.getSkillContextMenuOptions !== 'function') return [];
            return normalizeContextMenuOptions(SkillRuntime.getSkillContextMenuOptions(hitData));
        }

        function getSelectedUseInvIndex() {
            if (typeof selectedUse === 'undefined' || !selectedUse) return null;
            return Number.isInteger(selectedUse.invIndex) ? selectedUse.invIndex : null;
        }

        function tryUseSelectedInventoryItemOnTarget(hitData, selectedItem, selectedUseInvIndex) {
            if (!hitData || !selectedItem || !Number.isInteger(selectedUseInvIndex)) return false;

            let used = false;
            if (window.SkillRuntime && typeof SkillRuntime.tryUseItemOnTarget === 'function') {
                used = SkillRuntime.tryUseItemOnTarget({
                    hitData,
                    sourceInvIndex: selectedUseInvIndex,
                    sourceItemId: selectedItem.id
                });
            }
            if (!used) used = tryUseItemOnWorld(selectedUseInvIndex, hitData);
            return used;
        }

        function emitExamineFallback(text) {
            const line = String(text || 'Nothing unusual.').trim() || 'Nothing unusual.';
            if (typeof addChatMessage === 'function') {
                addChatMessage(line, 'game');
                return;
            }
            console.log(`EXAMINING: ${line}`);
        }

        function resolveTargetInteractionOptions(hitData, selectedSlot, selectedItem, selectedCookable, selectedUseInvIndex) {
            if (!window.TargetInteractionRegistry || typeof window.TargetInteractionRegistry.resolveOptions !== 'function') return [];

            const resolved = window.TargetInteractionRegistry.resolveOptions(hitData, {
                selectedSlot,
                selectedItem,
                selectedCookable,
                selectedUseInvIndex,
                clearSelectedUse,
                spawnActionMarker: () => {
                    if (hitData && hitData.point) spawnClickMarker(hitData.point, true);
                },
                tryUseSelectedItemOnHit: () => tryUseSelectedInventoryItemOnTarget(hitData, selectedItem, selectedUseInvIndex),
                queueInteract: (targetType, targetData = null) => {
                    queueAction('INTERACT', hitData.gridX, hitData.gridY, targetType, targetData);
                    if (hitData.point) spawnClickMarker(hitData.point, true);
                },
                examineTarget: (targetType, fallbackText, options = {}) => {
                    if (window.ExamineCatalog && typeof window.ExamineCatalog.examineTarget === 'function') {
                        window.ExamineCatalog.examineTarget(targetType, options);
                        return;
                    }
                    emitExamineFallback(fallbackText);
                },
                examineNpc: (npcName, fallbackText) => {
                    if (window.ExamineCatalog && typeof window.ExamineCatalog.examineNpc === 'function') {
                        window.ExamineCatalog.examineNpc(npcName);
                        return;
                    }
                    emitExamineFallback(fallbackText);
                },
                examineItem: (itemId, itemName, fallbackText) => {
                    if (window.ExamineCatalog && typeof window.ExamineCatalog.examineItem === 'function') {
                        window.ExamineCatalog.examineItem(itemId, itemName);
                        return;
                    }
                    emitExamineFallback(fallbackText);
                },
                formatGroundItemDisplayName,
                getGroundItemByUid: (uid) => {
                    if (!Array.isArray(groundItems)) return null;
                    return groundItems.find((entry) => entry && entry.uid === uid) || null;
                },
                getTileIdAtHit: () => {
                    if (!hitData || !logicalMap[playerState.z] || !logicalMap[playerState.z][hitData.gridY]) return null;
                    return logicalMap[playerState.z][hitData.gridY][hitData.gridX];
                },
                tileIds: {
                    TREE: TileId.TREE,
                    STUMP: TileId.STUMP
                }
            });

            return normalizeContextMenuOptions(resolved);
        }

        function onContextMenu(event) {
            if (isAnimationStudioActive()) return;
            if (inputControllerRuntime && typeof inputControllerRuntime.shouldIgnoreContextMenu === 'function') {
                if (inputControllerRuntime.shouldIgnoreContextMenu(isFreeCam, event.target && event.target.id)) return;
            } else {
                if (isFreeCam) return; if (event.target.id === 'minimap' || event.target.id === 'runToggleBtn') return;
            }
            event.preventDefault(); closeContextMenu();
            const hitResults = getRaycastHits(event.clientX, event.clientY);
            if (!hitResults || hitResults.length === 0) return;
            contextOptionsListEl.innerHTML = '';
            const selectedSlot = getSelectedUseItem();
            const selectedItem = selectedSlot && selectedSlot.itemData ? selectedSlot.itemData : null;
            const selectedUseInvIndex = getSelectedUseInvIndex();
            const selectedCookable = !!(selectedItem && selectedItem.cookResultId && selectedItem.burnResultId);

            for (let i = 0; i < hitResults.length; i++) {
                const hitData = hitResults[i];
                const skillOptions = resolveSkillContextMenuOptions(hitData);
                const targetOptions = skillOptions.length > 0
                    ? skillOptions
                    : resolveTargetInteractionOptions(hitData, selectedSlot, selectedItem, selectedCookable, selectedUseInvIndex);

                for (let j = 0; j < targetOptions.length; j++) {
                    const option = targetOptions[j];
                    addContextMenuOption(option.text, option.onSelect);
                }
            }

            const walkHit = hitResults[hitResults.length - 1];
            addContextMenuOption('Walk here', () => { queueAction('WALK', walkHit.gridX, walkHit.gridY, null); spawnClickMarker(walkHit.point, false); });
            showContextMenuAt(event.clientX, event.clientY);
        }

        function addContextMenuOption(text, callback) {
            const div = document.createElement('div'); div.className = 'context-option text-yellow-500';
            const splitIndex = text.indexOf(' ');
            if (splitIndex > -1 && text.indexOf('<span') === -1) {
                const action = text.substring(0, splitIndex); const target = text.substring(splitIndex); div.innerHTML = `<span class="text-white">${action}</span>${target}`;
            } else div.innerHTML = text; 
            div.onclick = (e) => { e.stopPropagation(); callback(); closeContextMenu(); };
            contextOptionsListEl.appendChild(div);
        }

        function closeContextMenu() {
            contextMenuEl.classList.add('hidden');
            if (typeof window.clearItemSwapLeftClickUI === 'function') window.clearItemSwapLeftClickUI();
            if (typeof window.hideInventoryHoverTooltip === 'function') window.hideInventoryHoverTooltip();
        }

        function emitPierDebug(message) {
            if (!window.QA_PIER_DEBUG || typeof addChatMessage !== 'function') return;
            addChatMessage(`[pier-debug] ${String(message || '').trim()}`, 'info');
        }

        function isNearPierBoundsTile(x, y, z = playerState.z, pad = 2) {
            const pierConfig = getActivePierConfig();
            if (!pierConfig || z !== 0) return false;
            return (
                x >= (pierConfig.xMin - pad)
                && x <= (pierConfig.xMax + pad)
                && y >= (pierConfig.yStart - pad)
                && y <= (pierConfig.yEnd + pad)
            );
        }

        function findNearestPierDeckBoardingTile(targetX, targetY, z = playerState.z) {
            const pierConfig = getActivePierConfig();
            if (!pierConfig || z !== 0) return null;

            let best = null;
            for (let y = pierConfig.yStart; y <= pierConfig.yEnd; y++) {
                for (let x = pierConfig.xMin; x <= pierConfig.xMax; x++) {
                    if (!isStandableTile(x, y, z)) continue;
                    const dist = Math.abs(x - targetX) + Math.abs(y - targetY);
                    if (dist > 2) continue;
                    if (!best || dist < best.dist || (dist === best.dist && y < best.y)) {
                        best = { x, y, dist };
                    }
                }
            }

            return best;
        }

        function normalizeRaycastHit(hit) {
            let data = hit.object.userData;
            if (hit.instanceId !== undefined && hit.object.userData.instanceMap) {
                data = hit.object.userData.instanceMap[hit.instanceId];
            }
            if (!data || data.z !== playerState.z) return null;

            if (data.type === 'GROUND' || data.type === 'WALL' || data.type === 'TOWER' || data.type === 'WATER') {
                let gridX = Math.floor(hit.point.x + 0.5);
                let gridY = Math.floor(hit.point.z + 0.5);
                if (gridX >= 0 && gridX < MAP_SIZE && gridY >= 0 && gridY < MAP_SIZE) {
                    let resolvedType = data.type;
                    let pierStepDescend = false;
                    const rawWaterHit = data.type === 'WATER';
                    const playerOnPierDeck = isPierDeckTile(playerState.x, playerState.y, playerState.z);
                    if (resolvedType === 'WATER') {
                        const tile = logicalMap[playerState.z][gridY][gridX];
                        let snappedBoardTile = null;

                        if (!isWaterTileId(tile) && isWalkableTileId(tile)) {
                            resolvedType = 'GROUND';
                        } else if (!playerOnPierDeck) {
                            snappedBoardTile = findNearestPierDeckBoardingTile(gridX, gridY, playerState.z);
                            if (snappedBoardTile) {
                                resolvedType = 'GROUND';
                                gridX = snappedBoardTile.x;
                                gridY = snappedBoardTile.y;
                            }
                        }

                        if (window.QA_PIER_DEBUG && isNearPierBoundsTile(gridX, gridY, playerState.z, 3)) {
                            emitPierDebug(`ray raw=WATER tile=${tile} resolved=${resolvedType} hit=(${Math.floor(hit.point.x * 100) / 100},${Math.floor(hit.point.z * 100) / 100}) grid=(${gridX},${gridY}) snap=${snappedBoardTile ? `${snappedBoardTile.x},${snappedBoardTile.y}` : 'none'}`);
                        }
                    }

                    const pierConfig = getActivePierConfig();
                    const stairBandMinY = pierConfig ? Math.min(pierConfig.entryY, pierConfig.yStart) - 1 : 0;
                    const stairBandMaxY = pierConfig ? Math.max(pierConfig.entryY, pierConfig.yStart) + 1 : 0;
                    const canDescendViaPierStep = !!(
                        pierConfig
                        && playerState.z === 0
                        && playerOnPierDeck
                        && gridX >= (pierConfig.xMin - 1)
                        && gridX <= (pierConfig.xMax + 1)
                        && gridY >= stairBandMinY
                        && gridY <= stairBandMaxY
                        && (data.isPierStep || rawWaterHit)
                        && isStandableTile(
                            Math.max(pierConfig.xMin, Math.min(pierConfig.xMax, gridX)),
                            pierConfig.entryY,
                            playerState.z
                        )
                    );
                    if (canDescendViaPierStep) {
                        const snappedX = Math.max(pierConfig.xMin, Math.min(pierConfig.xMax, gridX));
                        const fromY = gridY;
                        const fromX = gridX;
                        gridX = snappedX;
                        gridY = pierConfig.entryY;
                        resolvedType = 'GROUND';
                        pierStepDescend = true;
                        if (window.QA_PIER_DEBUG) emitPierDebug(`stair descend snap (${fromX},${fromY}) -> (${gridX},${gridY}) source=${data.isPierStep ? 'step' : 'water'}`);
                    }
                    return { type: resolvedType, gridX, gridY, point: hit.point, pierStepDescend };
                }
                return null;
            }
            if (data.type === 'DOOR') {
                return { type: data.type, gridX: data.gridX, gridY: data.gridY, point: hit.point, doorObj: data.doorObj };
            }
            return {
                type: data.type,
                gridX: data.gridX,
                gridY: data.gridY,
                point: hit.point,
                name: data.name,
                combatLevel: data.combatLevel,
                uid: data.uid
            };
        }

        function getRaycastHitKey(hitData) {
            if (!hitData) return null;
            if (hitData.uid !== undefined && hitData.uid !== null) return `${hitData.type}:uid:${hitData.uid}`;
            if (hitData.type === 'DOOR' && hitData.doorObj) return `${hitData.type}:door:${hitData.gridX},${hitData.gridY}`;
            if (Number.isInteger(hitData.gridX) && Number.isInteger(hitData.gridY)) {
                return `${hitData.type}:${hitData.gridX},${hitData.gridY}:${hitData.name || ''}`;
            }
            return `${hitData.type}:${hitData.name || ''}`;
        }

        function getRaycastHits(clientX, clientY, maxHits = 16) {
            mouse.x = (clientX / window.innerWidth) * 2 - 1; mouse.y = -(clientY / window.innerHeight) * 2 + 1; raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(environmentMeshes);
            const hits = [];
            const seen = new Set();
            for (let i = 0; i < intersects.length; i++) {
                const hitData = normalizeRaycastHit(intersects[i]);
                if (!hitData) continue;
                const key = getRaycastHitKey(hitData);
                if (key && seen.has(key)) continue;
                if (key) seen.add(key);
                hits.push(hitData);
                if (hits.length >= maxHits) break;
            }
            return hits;
        }

        function getRaycastHit(clientX, clientY) {
            const hits = getRaycastHits(clientX, clientY, 1);
            return hits.length > 0 ? hits[0] : null;
        }

        
        function forEachTileInSearchRing(targetX, targetY, radius, visit) {
            if (radius < 0 || typeof visit !== 'function') return false;
            if (radius === 0) {
                if (targetX < 0 || targetY < 0 || targetX >= MAP_SIZE || targetY >= MAP_SIZE) return false;
                return !!visit(targetX, targetY);
            }

            const minX = Math.max(0, targetX - radius);
            const maxX = Math.min(MAP_SIZE - 1, targetX + radius);
            const minY = Math.max(0, targetY - radius);
            const maxY = Math.min(MAP_SIZE - 1, targetY + radius);

            for (let x = minX; x <= maxX; x++) {
                if (visit(x, minY)) return true;
                if (maxY !== minY && visit(x, maxY)) return true;
            }
            for (let y = minY + 1; y <= maxY - 1; y++) {
                if (visit(minX, y)) return true;
                if (maxX !== minX && visit(maxX, y)) return true;
            }
            return false;
        }

        function findNearestRiverBankTile(targetX, targetY) {
            const z = playerState.z;
            let best = null;
            let bestDistSq = Infinity;

            const hasAdjacentWater = (x, y) => {
                const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
                for (let i = 0; i < dirs.length; i++) {
                    const nx = x + dirs[i].x;
                    const ny = y + dirs[i].y;
                    if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) continue;
                    const t = logicalMap[z][ny][nx];
                    if (isWaterTileId(t)) return true;
                }
                return false;
            };

            for (let r = 1; r <= 10; r++) {
                forEachTileInSearchRing(targetX, targetY, r, (x, y) => {
                    if (!isStandableTile(x, y, z)) return false;
                    if (!hasAdjacentWater(x, y)) return false;
                    const dx = x - targetX;
                    const dy = y - targetY;
                    const distSq = (dx * dx) + (dy * dy);
                    if (distSq < bestDistSq) {
                        bestDistSq = distSq;
                        best = { x, y };
                    }
                    return false;
                });
                if (best) break;
            }

            return best;
        }


        function findNearestFishableWaterEdgeTile(targetX, targetY) {
            const z = playerState.z;
            let best = null;
            let bestDistSq = Infinity;
            const playerOnPierDeck = isPierDeckTile(playerState.x, playerState.y, z);

            const hasAdjacentStandable = (x, y) => {
                if (playerOnPierDeck) return hasPierFishingApproachForWaterTile(x, y, z);
                return hasDryFishingApproachForWaterTile(x, y, z);
            };

            for (let r = 0; r <= 20; r++) {
                forEachTileInSearchRing(targetX, targetY, r, (x, y) => {
                    const tile = logicalMap[z][y][x];
                    if (!isWaterTileId(tile)) return false;
                    if (!hasAdjacentStandable(x, y)) return false;
                    const dx = x - targetX;
                    const dy = y - targetY;
                    const distSq = (dx * dx) + (dy * dy);
                    if (distSq < bestDistSq) {
                        bestDistSq = distSq;
                        best = { x, y };
                    }
                    return false;
                });
                if (best) break;
            }

            return best;
        }
        function getActivePierConfig() {
            return sharedMaterials && sharedMaterials.activePierConfig
                ? sharedMaterials.activePierConfig
                : null;
        }
        function isPierDeckTile(x, y, z = playerState.z) {
            const pierConfig = getActivePierConfig();
            return !!(
                pierConfig
                && z === 0
                && x >= pierConfig.xMin
                && x <= pierConfig.xMax
                && y >= pierConfig.yStart
                && y <= pierConfig.yEnd
            );
        }
        function isPierFishingApproachTile(standX, standY, targetX, targetY, z = playerState.z) {
            if (!isPierDeckTile(standX, standY, z)) return false;
            if (standX < 0 || standY < 0 || targetX < 0 || targetY < 0 || standX >= MAP_SIZE || standY >= MAP_SIZE || targetX >= MAP_SIZE || targetY >= MAP_SIZE) return false;
            if (!isWaterTileId(logicalMap[z][targetY][targetX])) return false;
            return (Math.abs(standX - targetX) + Math.abs(standY - targetY)) === 1;
        }
        function hasPierFishingApproachForWaterTile(targetX, targetY, z = playerState.z) {
            const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
            for (let i = 0; i < dirs.length; i++) {
                const standX = targetX + dirs[i].x;
                const standY = targetY + dirs[i].y;
                if (isPierFishingApproachTile(standX, standY, targetX, targetY, z)) return true;
            }
            return false;
        }
        function hasDryFishingApproachForWaterTile(targetX, targetY, z = playerState.z) {
            const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
            for (let i = 0; i < dirs.length; i++) {
                const standX = targetX + dirs[i].x;
                const standY = targetY + dirs[i].y;
                if (standX < 0 || standY < 0 || standX >= MAP_SIZE || standY >= MAP_SIZE) continue;
                if (!isStandableTile(standX, standY, z)) continue;
                if (isWaterTileId(logicalMap[z][standY][standX])) continue;
                return true;
            }
            return false;
        }
        function buildPierStepDescendPath(startX, startY, targetX, targetY, z = playerState.z) {
            const pierConfig = getActivePierConfig();
            if (!pierConfig || z !== 0) return null;
            if (!isPierDeckTile(startX, startY, z)) return null;

            const stairDeckY = pierConfig.yStart;
            const stairX = Math.max(pierConfig.xMin, Math.min(pierConfig.xMax, targetX));
            const shoreCandidates = [pierConfig.entryY, pierConfig.yStart - 1, pierConfig.entryY - 1];
            let shoreY = null;
            for (let i = 0; i < shoreCandidates.length; i++) {
                const candidateY = shoreCandidates[i];
                if (!Number.isInteger(candidateY) || candidateY < 0 || candidateY >= MAP_SIZE) continue;
                if (isStandableTile(stairX, candidateY, z)) {
                    shoreY = candidateY;
                    break;
                }
            }
            if (!Number.isInteger(shoreY)) return null;

            let pathToStair = findPath(startX, startY, stairX, stairDeckY, false, null);
            let stairXNow = startX;
            let stairYNow = startY;
            if (Array.isArray(pathToStair) && pathToStair.length > 0) {
                const last = pathToStair[pathToStair.length - 1];
                stairXNow = last.x;
                stairYNow = last.y;
            } else {
                pathToStair = [];
            }

            if (!(stairXNow === stairX && stairYNow === stairDeckY)) {
                if (!(startX === stairX && startY === stairDeckY)) return null;
                stairXNow = stairX;
                stairYNow = stairDeckY;
            }

            if ((Math.abs(stairXNow - stairX) + Math.abs(stairYNow - shoreY)) !== 1) return null;

            const finalPath = pathToStair.slice();
            finalPath.push({ x: stairX, y: shoreY });
            if (window.QA_PIER_DEBUG) emitPierDebug(`stair fallback step start=(${startX},${startY}) -> deck=(${stairX},${stairDeckY}) -> shore=(${stairX},${shoreY})`);
            return finalPath;
        }
        function isPierProtectedWaterTile(x, y, z = playerState.z) {
            const pierConfig = getActivePierConfig();
            return !!(
                pierConfig
                && z === 0
                && y >= (pierConfig.yStart + 1)
                && y <= pierConfig.yEnd
                && (x === (pierConfig.xMin - 1) || x === (pierConfig.xMax + 1))
            );
        }
        function isStandableTile(x, y, z = playerState.z) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false;
            const tile = logicalMap[z][y][x];
            if (isWalkableTileId(tile)) return true;

            // Edge shallow-water tiles are standable; deeper water is not.
            if (tile === TileId.WATER_SHALLOW) {
                if (isPierProtectedWaterTile(x, y, z)) return false;
                const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
                for (let i = 0; i < dirs.length; i++) {
                    const nx = x + dirs[i].x;
                    const ny = y + dirs[i].y;
                    if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) continue;
                    const nt = logicalMap[z][ny][nx];
                    if (!isWaterTileId(nt)) return true;
                }
            }
            return false;
        }
        function getStationFootprint(targetObj, tx, ty, z = playerState.z) {
            if (targetObj !== 'FURNACE') return { w: 1, d: 1 };
            if (!Array.isArray(furnacesToRender)) return { w: 1, d: 1 };

            for (let i = 0; i < furnacesToRender.length; i++) {
                const station = furnacesToRender[i];
                if (!station || station.x !== tx || station.y !== ty || station.z !== z) continue;
                const w = Number.isFinite(station.footprintW) ? Math.max(1, Math.round(station.footprintW)) : 1;
                const d = Number.isFinite(station.footprintD) ? Math.max(1, Math.round(station.footprintD)) : 1;
                return { w, d };
            }
            return { w: 1, d: 1 };
        }
        function getStationFacingYaw(targetObj, tx, ty, z = playerState.z) {
            const stations = targetObj === 'FURNACE'
                ? furnacesToRender
                : (targetObj === 'ANVIL' ? anvilsToRender : null);
            if (!Array.isArray(stations)) return 0;

            for (let i = 0; i < stations.length; i++) {
                const station = stations[i];
                if (!station || station.x !== tx || station.y !== ty || station.z !== z) continue;
                if (Number.isFinite(station.facingYaw)) return station.facingYaw;
                break;
            }
            return 0;
        }

        function resolveCardinalStepFromYaw(yaw) {
            const y = Number.isFinite(yaw) ? yaw : 0;
            const sx = Math.sin(y);
            const sy = Math.cos(y);
            let dx = Math.round(sx);
            let dy = Math.round(sy);

            // Clamp any borderline diagonal rounding back to a cardinal step.
            if (Math.abs(dx) === Math.abs(dy)) {
                if (Math.abs(sx) >= Math.abs(sy)) dy = 0;
                else dx = 0;
            }
            if (dx === 0 && dy === 0) dy = 1;

            return { dx, dy };
        }

        function getStationApproachPositions(targetObj, tx, ty, z = playerState.z) {
            if (targetObj !== 'FURNACE' && targetObj !== 'ANVIL') return [];

            const front = resolveCardinalStepFromYaw(getStationFacingYaw(targetObj, tx, ty, z));
            if (targetObj === 'FURNACE') {
                const footprint = getStationFootprint(targetObj, tx, ty, z);
                if (footprint.w === 1 && footprint.d === 1) {
                    return [{ x: tx + front.dx, y: ty + front.dy }];
                }
                if (front.dx !== 0) {
                    const fx = front.dx > 0 ? (tx + footprint.w) : (tx - 1);
                    const centerY = ty + Math.floor((footprint.d - 1) / 2);
                    return [{ x: fx, y: centerY }];
                }
                const fy = front.dy > 0 ? (ty + footprint.d) : (ty - 1);
                const centerX = tx + Math.floor((footprint.w - 1) / 2);
                return [{ x: centerX, y: fy }];
            }

            // Anvil approach uses the opposite pair of sides (other two).
            const long = { dx: front.dx, dy: front.dy };
            return [
                { x: tx + long.dx, y: ty + long.dy },
                { x: tx - long.dx, y: ty - long.dy }
            ];
        }

        function validateStationApproach(targetObj, tx, ty, px, py, z = playerState.z) {
            if (targetObj !== 'FURNACE' && targetObj !== 'ANVIL') return { ok: true, message: '' };

            const allowed = getStationApproachPositions(targetObj, tx, ty, z);
            for (let i = 0; i < allowed.length; i++) {
                const pos = allowed[i];
                if (pos.x === px && pos.y === py) return { ok: true, message: '' };
            }

            if (targetObj === 'FURNACE') {
                return { ok: false, message: 'You need to stand at the front of the furnace to use it.' };
            }
            return { ok: false, message: 'You need to stand on the long side of the anvil to use it.' };
        }
        function getPlayerRigShoulderPivot(rig) {
            const defaultTorsoY = 1.05;
            const torsoY = (rig && rig.torso && rig.torso.userData && rig.torso.userData.defaultPos && Number.isFinite(rig.torso.userData.defaultPos.y))
                ? rig.torso.userData.defaultPos.y
                : ((rig && rig.torso && Number.isFinite(rig.torso.position.y)) ? rig.torso.position.y : defaultTorsoY);
            return {
                x: PLAYER_SHOULDER_PIVOT.x,
                y: PLAYER_SHOULDER_PIVOT.y - torsoY,
                z: PLAYER_SHOULDER_PIVOT.z
            };
        }
        function setPlayerRigShoulderPivot(rig) {
            if (!rig) return;
            const shoulderPivot = getPlayerRigShoulderPivot(rig);
            rig.leftArm.position.set(shoulderPivot.x, shoulderPivot.y, shoulderPivot.z);
            rig.rightArm.position.set(-shoulderPivot.x, shoulderPivot.y, shoulderPivot.z);
        }
        function clamp01(v) {
            return Math.max(0, Math.min(1, v));
        }
        function smoothStep01(v) {
            const t = clamp01(v);
            return t * t * (3 - (2 * t));
        }
        function cycleEase(phase, start, end) {
            if (phase <= start) return 0;
            if (phase >= end) return 1;
            return smoothStep01((phase - start) / (end - start));
        }
        function lerpScalar(from, to, t) {
            return from + ((to - from) * t);
        }
        function lerpTriplet(from, to, t) {
            return [
                lerpScalar(from[0], to[0], t),
                lerpScalar(from[1], to[1], t),
                lerpScalar(from[2], to[2], t)
            ];
        }
        function blendCombatPose(fromPose, toPose, t) {
            return {
                leftArmPos: lerpTriplet(fromPose.leftArmPos, toPose.leftArmPos, t),
                rightArmPos: lerpTriplet(fromPose.rightArmPos, toPose.rightArmPos, t),
                leftArmRot: lerpTriplet(fromPose.leftArmRot, toPose.leftArmRot, t),
                rightArmRot: lerpTriplet(fromPose.rightArmRot, toPose.rightArmRot, t),
                leftLowerArmRot: lerpTriplet(fromPose.leftLowerArmRot, toPose.leftLowerArmRot, t),
                rightLowerArmRot: lerpTriplet(fromPose.rightLowerArmRot, toPose.rightLowerArmRot, t),
                torsoRot: lerpTriplet(fromPose.torsoRot, toPose.torsoRot, t),
                headRot: lerpTriplet(fromPose.headRot, toPose.headRot, t),
                axeRot: lerpTriplet(fromPose.axeRot, toPose.axeRot, t)
            };
        }
        function getPlayerCombatNeutralPose(rig) {
            const shoulderPivot = getPlayerRigShoulderPivot(rig);
            return {
                leftArmPos: [shoulderPivot.x, shoulderPivot.y, shoulderPivot.z],
                rightArmPos: [-shoulderPivot.x, shoulderPivot.y, shoulderPivot.z],
                leftArmRot: [0, 0, 0],
                rightArmRot: [0, 0, 0],
                leftLowerArmRot: [0, 0, 0],
                rightLowerArmRot: [0, 0, 0],
                torsoRot: [0, 0, 0],
                headRot: [0, 0, 0],
                axeRot: [0, 0, 0]
            };
        }
        function getPlayerCombatSlashWindupPose(rig) {
            const deg = Math.PI / 180;
            const shoulderPivot = getPlayerRigShoulderPivot(rig);
            return {
                leftArmPos: [shoulderPivot.x, shoulderPivot.y + 0.01, shoulderPivot.z],
                rightArmPos: [-shoulderPivot.x - 0.01, shoulderPivot.y + 0.07, shoulderPivot.z + 0.06],
                leftArmRot: [(-6 * deg), 0, (8 * deg)],
                rightArmRot: [(-72 * deg), (10 * deg), (-42 * deg)],
                leftLowerArmRot: [(-44 * deg), (-14 * deg), 0],
                rightLowerArmRot: [(-46 * deg), (12 * deg), 0],
                torsoRot: [(-2 * deg), (14 * deg), 0],
                headRot: [(1 * deg), (6 * deg), 0],
                axeRot: [0, 0, (-22 * deg)]
            };
        }
        function getPlayerCombatSlashStage2Pose(rig) {
            const deg = Math.PI / 180;
            const shoulderPivot = getPlayerRigShoulderPivot(rig);
            return {
                leftArmPos: [shoulderPivot.x, shoulderPivot.y + 0.01, shoulderPivot.z],
                rightArmPos: [-shoulderPivot.x + 0.06, shoulderPivot.y + 0.03, shoulderPivot.z + 0.03],
                leftArmRot: [(-6 * deg), 0, (8 * deg)],
                rightArmRot: [(-102 * deg), (-18 * deg), (10 * deg)],
                leftLowerArmRot: [(-44 * deg), (-14 * deg), 0],
                rightLowerArmRot: [(10 * deg), 0, 0],
                torsoRot: [(-3 * deg), (18 * deg), 0],
                headRot: [(1 * deg), (8 * deg), 0],
                axeRot: [0, 0, (-8 * deg)]
            };
        }
        function applyPlayerCombatPose(rig, pose) {
            if (!rig || !pose) return;
            rig.leftArm.position.set(pose.leftArmPos[0], pose.leftArmPos[1], pose.leftArmPos[2]);
            rig.rightArm.position.set(pose.rightArmPos[0], pose.rightArmPos[1], pose.rightArmPos[2]);
            rig.leftArm.rotation.set(pose.leftArmRot[0], pose.leftArmRot[1], pose.leftArmRot[2]);
            rig.rightArm.rotation.set(pose.rightArmRot[0], pose.rightArmRot[1], pose.rightArmRot[2]);
            rig.leftLowerArm.rotation.set(pose.leftLowerArmRot[0], pose.leftLowerArmRot[1], pose.leftLowerArmRot[2]);
            rig.rightLowerArm.rotation.set(pose.rightLowerArmRot[0], pose.rightLowerArmRot[1], pose.rightLowerArmRot[2]);
            if (rig.torso) rig.torso.rotation.set(pose.torsoRot[0], pose.torsoRot[1], pose.torsoRot[2]);
            if (rig.head) rig.head.rotation.set(pose.headRot[0], pose.headRot[1], pose.headRot[2]);
            if (rig.axe) rig.axe.rotation.set(pose.axeRot[0], pose.axeRot[1], pose.axeRot[2]);
        }
        function getCurrentTickProgress(frameNow) {
            const tickDurationMs = (typeof TICK_RATE_MS === 'number' && Number.isFinite(TICK_RATE_MS) && TICK_RATE_MS > 0)
                ? TICK_RATE_MS
                : 600;
            return clamp01((frameNow - lastTickTime) / tickDurationMs);
        }
        function getPlayerAttackAnimationProgress(rig, frameNow) {
            if (!rig || !Number.isFinite(rig.attackAnimationStartedAt) || rig.attackAnimationStartedAt <= 0) return null;
            const attackAge = frameNow - rig.attackAnimationStartedAt;
            if (!Number.isFinite(attackAge) || attackAge < 0) return null;
            const attackDurationMs = 1100;
            if (attackAge >= attackDurationMs) return null;
            return clamp01(attackAge / attackDurationMs);
        }
        function isTimedAnimationActive(startedAtMs, durationMs, frameNow) {
            if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return false;
            if (!Number.isFinite(durationMs) || durationMs <= 0) return false;
            const age = frameNow - startedAtMs;
            return Number.isFinite(age) && age >= 0 && age < durationMs;
        }
        function getPlayerAttackStep1Factor(attackT) {
            if (!Number.isFinite(attackT)) return 0;
            if (attackT < 0.24) return smoothStep01(attackT / 0.24);
            if (attackT < 0.88) return 1;
            return 1 - smoothStep01((attackT - 0.88) / 0.12);
        }
        function applyPlayerAttackStep1UpperArmSpin(rig, step1Factor) {
            if (!rig || !rig.rightArm || step1Factor <= 0.0001) return;
            if (!rig.rightLowerArm) return;
            const upperArmAxis = rig.rightLowerArm.position.clone();
            if (upperArmAxis.lengthSq() <= 0.000001) return;
            upperArmAxis.normalize();
            rig.rightArm.rotateOnAxis(upperArmAxis, step1Factor * ((5 * Math.PI) / 12));
        }
        function applyPlayerSlashCombatPose(rig, frameNow) {
            const attackT = getPlayerAttackAnimationProgress(rig, frameNow);
            if (attackT === null) return 0;
            const neutralPose = getPlayerCombatNeutralPose(rig);
            const windupPose = getPlayerCombatSlashWindupPose(rig);
            const stage2Pose = getPlayerCombatSlashStage2Pose(rig);
            const step1Factor = getPlayerAttackStep1Factor(attackT);

            let pose = neutralPose;
            if (attackT < 0.24) {
                pose = blendCombatPose(neutralPose, windupPose, smoothStep01(attackT / 0.24));
            } else if (attackT < 0.58) {
                pose = blendCombatPose(windupPose, stage2Pose, smoothStep01((attackT - 0.24) / 0.34));
            } else if (attackT < 0.88) {
                pose = stage2Pose;
            } else {
                pose = blendCombatPose(stage2Pose, neutralPose, smoothStep01((attackT - 0.88) / 0.12));
            }
            applyPlayerCombatPose(rig, pose);
            applyPlayerAttackStep1UpperArmSpin(rig, step1Factor);
            return Math.sin(Math.min(attackT, 0.88) / 0.88 * Math.PI) * 0.014;
        }
        function applyPlayerHitRecoilOverlay(rig, playerRigRef, frameNow) {
            if (!rig || !playerRigRef) return;
            if (Number.isFinite(rig.attackTick) && rig.attackTick === currentTick) return;
            if (!Number.isFinite(rig.hitReactionTick) || rig.hitReactionTick !== currentTick) return;
            const tickProgress = getCurrentTickProgress(frameNow);
            const recoil = Math.sin(tickProgress * Math.PI);
            if (recoil <= 0.0001) return;
            playerRigRef.rotation.x -= recoil * 0.28;
            playerRigRef.position.y += recoil * 0.04;
            rig.leftArm.position.y += recoil * 0.06;
            rig.leftArm.position.z += recoil * 0.07;
            if (rig.torso && rig.torso.userData && rig.torso.userData.defaultPos) {
                rig.torso.position.z = rig.torso.userData.defaultPos.z - (recoil * 0.05);
            }
            if (rig.head && rig.head.userData && rig.head.userData.defaultPos) {
                rig.head.position.z = rig.head.userData.defaultPos.z - (recoil * 0.03);
            }
            rig.leftArm.rotation.x -= recoil * 0.78;
            rig.leftArm.rotation.y -= recoil * 0.22;
            rig.leftArm.rotation.z += recoil * 1.05;
            rig.leftLowerArm.rotation.x -= recoil * 0.9;
            rig.leftLowerArm.rotation.z += recoil * 0.28;
            rig.rightArm.rotation.x += recoil * 0.3;
            rig.rightArm.rotation.y += recoil * 0.12;
            rig.rightArm.rotation.z += recoil * 0.16;
            rig.rightLowerArm.rotation.x -= recoil * 0.18;
            if (rig.torso) {
                rig.torso.rotation.x -= recoil * 0.16;
                rig.torso.rotation.y += recoil * 0.18;
            }
            if (rig.head) {
                rig.head.rotation.x += recoil * 0.12;
                rig.head.rotation.y -= recoil * 0.1;
            }
        }
        function getPlayerBaseClipId(isMoving, logicalTilesMoved) {
            if (isMoving) {
                if (logicalTilesMoved > 1 || (isRunning && logicalTilesMoved > 0)) return 'player/run';
                return 'player/walk';
            }
            return 'player/idle';
        }
        function ensureCombatAnimationDebugPanel() {
            let panel = document.getElementById('combat-animation-debug-panel');
            if (panel) return panel;
            panel = document.createElement('pre');
            panel.id = 'combat-animation-debug-panel';
            panel.style.position = 'fixed';
            panel.style.top = '12px';
            panel.style.right = '12px';
            panel.style.zIndex = '450';
            panel.style.minWidth = '320px';
            panel.style.maxWidth = '420px';
            panel.style.padding = '10px 12px';
            panel.style.background = 'rgba(12, 16, 24, 0.88)';
            panel.style.border = '1px solid rgba(255, 255, 255, 0.18)';
            panel.style.borderRadius = '8px';
            panel.style.color = '#d7e3ff';
            panel.style.fontFamily = 'Consolas, Menlo, monospace';
            panel.style.fontSize = '12px';
            panel.style.lineHeight = '1.35';
            panel.style.whiteSpace = 'pre-wrap';
            panel.style.pointerEvents = 'none';
            panel.style.display = 'none';
            document.body.appendChild(panel);
            return panel;
        }
        function formatCombatAnimationDebugRequest(request) {
            if (!request || typeof request !== 'object') return 'none';
            return `${request.clipId || 'unknown'}@p${Number.isFinite(request.priority) ? request.priority : '?'} start=${Number.isFinite(request.startedAtMs) ? Math.floor(request.startedAtMs) : 'none'}`;
        }
        function updateCombatAnimationDebugPanel(rig, playerRigRef, frameNow) {
            const panel = ensureCombatAnimationDebugPanel();
            if (!window.QA_COMBAT_DEBUG) {
                panel.style.display = 'none';
                return;
            }

            const rigId = (playerRigRef && playerRigRef.userData && playerRigRef.userData.animationRigId)
                ? playerRigRef.userData.animationRigId
                : 'player_humanoid_v1';
            const controllerDebug = (animationRuntimeBridge
                && typeof animationRuntimeBridge.getLegacyControllerDebugState === 'function'
                && playerRigRef)
                ? animationRuntimeBridge.getLegacyControllerDebugState(playerRigRef, rigId, frameNow)
                : null;
            const attackActive = !!(rig && isTimedAnimationActive(rig.attackAnimationStartedAt, 1100, frameNow));
            const recoilOnTick = !!(rig && Number.isFinite(rig.hitReactionTick) && rig.hitReactionTick === currentTick);
            const recoilWindowActive = !!(rig && isTimedAnimationActive(rig.hitReactionStartedAt, 260, frameNow));
            const recoilRequested = recoilOnTick && recoilWindowActive;
            const requests = controllerDebug && Array.isArray(controllerDebug.requestedActions)
                ? controllerDebug.requestedActions
                : [];
            const lastEnemyAttack = window.__qaCombatDebugLastEnemyAttackResult || null;
            const winningClipId = controllerDebug && controllerDebug.winningRequest
                ? controllerDebug.winningRequest.clipId
                : 'none';
            const blockedByPriority = attackActive && recoilRequested && winningClipId === 'player/combat_slash';
            const actionAgeMs = (controllerDebug && Number.isFinite(controllerDebug.actionAgeMs))
                ? Math.floor(controllerDebug.actionAgeMs)
                : null;
            const actionDurationMs = (controllerDebug && Number.isFinite(controllerDebug.actionDurationMs))
                ? Math.floor(controllerDebug.actionDurationMs)
                : null;
            panel.textContent = [
                'combat anim debug',
                `tick=${Number.isFinite(currentTick) ? currentTick : 'none'} action=${playerState && playerState.action ? playerState.action : 'IDLE'}`,
                `attack gate=${attackActive ? 'open' : 'closed'} attackTick=${rig && Number.isFinite(rig.attackTick) ? rig.attackTick : 'none'} attackStart=${rig && Number.isFinite(rig.attackAnimationStartedAt) ? Math.floor(rig.attackAnimationStartedAt) : 'none'}`,
                `last enemy attack tick=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.tick) ? lastEnemyAttack.tick : 'none'} enemy=${lastEnemyAttack && lastEnemyAttack.enemyId ? lastEnemyAttack.enemyId : 'none'} landed=${lastEnemyAttack ? (lastEnemyAttack.landed ? 'yes' : 'no') : 'none'} damage=${lastEnemyAttack && Number.isFinite(lastEnemyAttack.damage) ? lastEnemyAttack.damage : 'none'} dummy=${lastEnemyAttack ? (lastEnemyAttack.isTrainingDummyAttack ? 'yes' : 'no') : 'none'}`,
                `recoil gate=${recoilRequested ? 'open' : 'closed'} hitTick=${rig && Number.isFinite(rig.hitReactionTick) ? rig.hitReactionTick : 'none'} currentTickMatch=${recoilOnTick ? 'yes' : 'no'} hitStart=${rig && Number.isFinite(rig.hitReactionStartedAt) ? Math.floor(rig.hitReactionStartedAt) : 'none'} window=${recoilWindowActive ? 'live' : 'dead'}`,
                `base=${controllerDebug && controllerDebug.baseClipId ? controllerDebug.baseClipId : 'none'}`,
                `action=${controllerDebug && controllerDebug.actionClipId ? controllerDebug.actionClipId : 'none'} age=${actionAgeMs !== null ? actionAgeMs : 'none'}/${actionDurationMs !== null ? actionDurationMs : 'none'}`,
                `winner=${winningClipId}`,
                `requests=${requests.length ? requests.map(formatCombatAnimationDebugRequest).join(' | ') : 'none'}`,
                `lastCommit=${controllerDebug && controllerDebug.lastCommittedAction ? formatCombatAnimationDebugRequest(controllerDebug.lastCommittedAction) : 'none'}`,
                `priorityBlock=${blockedByPriority ? 'attack_over_recoil' : 'no'}`
            ].join('\n');
            panel.style.display = 'block';
        }
        function applyClipDrivenPlayerAnimation(rig, playerRigRef, frameNow, isMoving, logicalTilesMoved) {
            if (!animationRuntimeBridge
                || typeof animationRuntimeBridge.beginLegacyFrame !== 'function'
                || typeof animationRuntimeBridge.setLegacyBaseClip !== 'function'
                || typeof animationRuntimeBridge.requestLegacyActionClip !== 'function'
                || typeof animationRuntimeBridge.applyLegacyFrame !== 'function') {
                return false;
            }

            const rigId = (playerRigRef && playerRigRef.userData && playerRigRef.userData.animationRigId)
                ? playerRigRef.userData.animationRigId
                : 'player_humanoid_v1';

            rig.axe.visible = !!equipment.weapon;
            rig.axe.rotation.set(0, 0, 0);
            setPlayerRigShoulderPivot(rig);
            playerRigRef.rotation.x = 0;
            playerRigRef.rotation.z = 0;

            animationRuntimeBridge.beginLegacyFrame(playerRigRef, rigId);
            animationRuntimeBridge.setLegacyBaseClip(playerRigRef, rigId, getPlayerBaseClipId(isMoving, logicalTilesMoved), frameNow);

            if (isTimedAnimationActive(rig.attackAnimationStartedAt, 1100, frameNow)) {
                animationRuntimeBridge.requestLegacyActionClip(playerRigRef, rigId, 'player/combat_slash', {
                    startedAtMs: rig.attackAnimationStartedAt,
                    startKey: `attack:${rig.attackAnimationStartedAt}`,
                    priority: 2
                });
            }

            if (Number.isFinite(rig.hitReactionTick)
                && rig.hitReactionTick === currentTick
                && isTimedAnimationActive(rig.hitReactionStartedAt, 260, frameNow)) {
                animationRuntimeBridge.requestLegacyActionClip(playerRigRef, rigId, 'player/hit_recoil', {
                    startedAtMs: rig.hitReactionStartedAt,
                    startKey: `hit:${rig.hitReactionTick}`,
                    priority: 1
                });
            }

            animationRuntimeBridge.applyLegacyFrame(playerRigRef, rigId, frameNow);
            return true;
        }
        function applyRockMiningPose(rig, frameNow, baseVisualY, isPickaxeEquipped) {
            const deg = Math.PI / 180;
            const shoulderPivot = getPlayerRigShoulderPivot(rig);
            const cycle = 1050;
            const phase = (frameNow % cycle) / cycle;
            // Three-beat loop: gather -> strike -> recover.
            const strike = cycleEase(phase, 0.34, 0.62) * (1 - cycleEase(phase, 0.62, 0.78));
            const recover = cycleEase(phase, 0.78, 1.00);
            const gather = 1 - strike;
            const inhale = Math.sin(phase * Math.PI * 2);
            rig.axe.visible = isPickaxeEquipped;
            rig.axe.rotation.set(0, 0, 0);
            playerRig.rotation.x = 0;
            setPlayerRigShoulderPivot(rig);

            // Pull shoulders inward/forward so both hands converge to a single strike line.
            const torsoSafeInward = Math.max(0.0, shoulderPivot.x - 0.22);
            const shoulderInward = Math.min(0.12 + (0.05 * gather), torsoSafeInward);
            const shoulderForward = 0.1 + (0.03 * gather);
            const shoulderLift = 0.01 + (0.02 * gather);
            rig.leftArm.position.set(
                shoulderPivot.x - shoulderInward,
                shoulderPivot.y + shoulderLift,
                shoulderPivot.z + shoulderForward
            );
            rig.rightArm.position.set(
                -shoulderPivot.x + shoulderInward,
                shoulderPivot.y + shoulderLift,
                shoulderPivot.z + shoulderForward
            );

            // Stretch arms ~10% so the stacked hand grip reads cleanly.
            rig.leftArm.scale.set(1.02, 1.1, 1.02);
            rig.rightArm.scale.set(1.02, 1.1, 1.02);
            rig.leftLowerArm.scale.set(1.0, 1.1, 1.0);
            rig.rightLowerArm.scale.set(1.0, 1.1, 1.0);

            const torsoTwist = ((-4 + (10 * strike)) * deg);
            rig.torso.rotation.set((-6 + (8 * strike)) * deg, torsoTwist, 0);
            rig.head.rotation.set(0, torsoTwist * 0.45, 0);

            // Mirror arm yaw/roll to keep both hands meeting over the centerline.
            rig.leftArm.rotation.set(
                (-70 + (30 * strike) - (10 * recover)) * deg,
                (-17 + (3 * strike)) * deg,
                (15 + (6 * gather)) * deg
            );
            rig.rightArm.rotation.set(
                (-82 + (34 * strike) - (12 * recover)) * deg,
                (17 - (3 * strike)) * deg,
                (-15 - (6 * gather)) * deg
            );
            rig.leftLowerArm.rotation.set(
                (-114 + (45 * strike) + (8 * recover)) * deg,
                (-12 - (7 * gather)) * deg,
                (5 * deg)
            );
            rig.rightLowerArm.rotation.set(
                (-124 + (50 * strike) + (8 * recover)) * deg,
                (12 + (7 * gather)) * deg,
                (-5 * deg)
            );
            rig.leftLeg.rotation.x = 0;
            rig.rightLeg.rotation.x = 0;
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0;
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
            playerRig.position.y = baseVisualY + (0.01 * inhale);
        }

        function spawnClickMarker(position, isAction) {
            const color = isAction ? 0xff0000 : 0xffff00; const group = new THREE.Group();
            const mat = new THREE.MeshBasicMaterial({ color: color, depthTest: false, transparent: true }); const geo = new THREE.PlaneGeometry(0.6, 0.15);
            const mesh1 = new THREE.Mesh(geo, mat); mesh1.rotation.z = Math.PI / 4; const mesh2 = new THREE.Mesh(geo, mat); mesh2.rotation.z = -Math.PI / 4;
            group.add(mesh1, mesh2); group.position.copy(position); group.position.y += 0.05; group.renderOrder = 999; scene.add(group);
            clickMarkers.push({ mesh: group, createdAt: Date.now() });
        }

        function handleInteractionRaycast(clientX, clientY) {
            const hitData = getRaycastHit(clientX, clientY); if (!hitData) return;

            const selected = getSelectedUseItem();
            if (selected) {
                let used = false;
                const selectedSlot = inventory[selectedUse.invIndex];
                const selectedItemId = selectedSlot && selectedSlot.itemData ? selectedSlot.itemData.id : null;

                if (window.DEBUG_COOKING_USE && typeof addChatMessage === 'function') {
                    addChatMessage(`[cook-debug] use-click item=${selectedItemId || 'none'} target=${hitData.type} @ (${hitData.gridX},${hitData.gridY},${playerState.z})`, 'info');
                }

                if (window.SkillRuntime && typeof SkillRuntime.tryUseItemOnTarget === 'function') {
                    used = SkillRuntime.tryUseItemOnTarget({
                        hitData,
                        sourceInvIndex: selectedUse.invIndex,
                        sourceItemId: selectedItemId
                    });
                }

                if (!used) {
                    used = tryUseItemOnWorld(selectedUse.invIndex, hitData);
                }

                if (window.DEBUG_COOKING_USE && typeof addChatMessage === 'function') {
                    addChatMessage(`[cook-debug] use-click result handled=${used ? 'yes' : 'no'}`, 'info');
                }

                if (used && hitData.point) spawnClickMarker(hitData.point, true);
                clearSelectedUse();
                // Use-click should consume this click: either valid use, or cancel selection.
                return;
            }

                        // Treating walls and towers strictly as move obstacles, not interactables!
            if (hitData.type === 'WATER') {
                queueAction('INTERACT', hitData.gridX, hitData.gridY, 'WATER');
                spawnClickMarker(hitData.point, true);
            } else if (hitData.type === 'GROUND' || hitData.type === 'WALL' || hitData.type === 'TOWER' || hitData.type === 'FIRE') {
                const walkObj = hitData.pierStepDescend ? 'PIER_STEP_DESCEND' : null;
                queueAction('WALK', hitData.gridX, hitData.gridY, walkObj);
                spawnClickMarker(hitData.point, false);
            }
            else {
                let targetData = hitData.uid;
                if (hitData.type === 'DOOR') targetData = hitData.doorObj;
                else if (hitData.type === 'ENEMY') {
                    targetData = {
                        enemyId: String(hitData.uid || '').trim(),
                        enemyX: Number.isInteger(hitData.gridX) ? hitData.gridX : null,
                        enemyY: Number.isInteger(hitData.gridY) ? hitData.gridY : null,
                        name: hitData.name || 'Enemy'
                    };
                }

                                else if (hitData.type === 'NPC') {
                    if (hitData.uid && typeof hitData.uid === 'object') targetData = Object.assign({}, hitData.uid);
                    else if (hitData.name === 'Shopkeeper') targetData = { name: hitData.name, action: 'Trade', merchantId: 'general_store' };
                    else targetData = { name: hitData.name, action: 'Talk-to' };
                }
                queueAction('INTERACT', hitData.gridX, hitData.gridY, hitData.type, targetData); 
                spawnClickMarker(hitData.point, true); 
            }
        }

        function cancelManualFiremakingChain() {
            if (playerState.action !== 'SKILLING: FIREMAKING') return;
            playerState.firemakingSession = null;
            playerState.pendingSkillStart = null;
            playerState.path = [];
            playerState.pendingActionAfterTurn = null;
            playerState.turnLock = false;
            playerState.actionVisualReady = true;
            playerState.action = 'IDLE';
            if (typeof addChatMessage === 'function') addChatMessage('You stop lighting the logs.', 'info');
        }

        function hasActiveFletchingProcessingSession() {
            if (!(window.SkillActionResolution && typeof SkillActionResolution.getSkillSession === 'function')) return false;
            const session = SkillActionResolution.getSkillSession(playerState, 'fletching');
            return !!(session && session.kind === 'processing');
        }
        function stopActiveFletchingProcessingSession() {
            if (!(window.SkillActionResolution
                && typeof SkillActionResolution.getSkillSession === 'function'
                && typeof SkillActionResolution.clearSkillSession === 'function')) return false;
            const session = SkillActionResolution.getSkillSession(playerState, 'fletching');
            if (!(session && session.kind === 'processing')) return false;
            SkillActionResolution.clearSkillSession(playerState, 'fletching');
            if (typeof addChatMessage === 'function') addChatMessage('You stop fletching.', 'info');
            return true;
        }
        function setMinimapDestination(gridX, gridY, z = playerState.z) {
            if (!Number.isInteger(gridX) || !Number.isInteger(gridY) || !Number.isInteger(z)) {
                minimapDestination = null;
                return;
            }
            minimapDestination = { x: gridX, y: gridY, z };
        }
        function clearMinimapDestination() {
            minimapDestination = null;
        }
        function getGroundTileStackCount(gridX, gridY, z = playerState.z) {
            if (!Array.isArray(groundItems) || !Number.isInteger(gridX) || !Number.isInteger(gridY)) return 1;
            let count = 0;
            for (let i = 0; i < groundItems.length; i++) {
                const entry = groundItems[i];
                if (!entry) continue;
                if (entry.x === gridX && entry.y === gridY && entry.z === z) count++;
            }
            return Math.max(1, count);
        }
        function formatGroundItemDisplayName(hitData) {
            const baseName = (hitData && typeof hitData.name === 'string' && hitData.name.trim())
                ? hitData.name
                : 'item';
            if (!hitData || hitData.type !== 'GROUND_ITEM') return baseName;
            const tileStackCount = getGroundTileStackCount(hitData.gridX, hitData.gridY);
            return tileStackCount > 1 ? `${baseName} (${tileStackCount})` : baseName;
        }

        function formatEnemyTooltipDisplayName(hitData) {
            const baseName = (hitData && typeof hitData.name === 'string' && hitData.name.trim())
                ? hitData.name
                : 'Enemy';
            const combatLevel = hitData && Number.isFinite(hitData.combatLevel)
                ? Math.max(1, Math.floor(hitData.combatLevel))
                : null;
            if (combatLevel === null) return baseName;
            return `${baseName} (Level ${combatLevel})`;
        }
        function queueAction(type, gridX, gridY, obj, targetUid = null) {
            cancelManualFiremakingChain();
            const hasCombatSelection = !!(
                playerState.lockedTargetId
                || playerState.combatTargetKind === 'enemy'
                || playerState.targetObj === 'ENEMY'
                || playerState.inCombat
            );
            if (type === 'WALK' && hasCombatSelection && typeof window.clearPlayerCombatTarget === 'function') {
                window.clearPlayerCombatTarget({ force: true, reason: 'queue-walk' });
            } else if (type === 'INTERACT' && obj !== 'ENEMY' && hasCombatSelection && typeof window.clearPlayerCombatTarget === 'function') {
                window.clearPlayerCombatTarget({ force: true, reason: 'queue-interact-non-enemy' });
            }
            if (type === 'WALK') setMinimapDestination(gridX, gridY, playerState.z);
            else clearMinimapDestination();
            pendingAction = { type, x: gridX, y: gridY, obj, targetUid };
        }

        function findPath(startX, startY, targetX, targetY, forceAdjacent = false, interactionObj = null) {
            const encodeTileKey = (x, y) => (y * MAP_SIZE) + x;
            const decodeTileX = (key) => key % MAP_SIZE;
            const decodeTileY = (key) => Math.floor(key / MAP_SIZE);
            let validTargets = new Set();
            let targetTileType = logicalMap[playerState.z][targetY][targetX];
            const stationApproachKeys = new Set(
                getStationApproachPositions(interactionObj, targetX, targetY, playerState.z)
                    .map((p) => encodeTileKey(p.x, p.y))
            );
            let isInteract = forceAdjacent || !isStandableTile(targetX, targetY, playerState.z);

            if (isInteract) {
                let targetH = heightMap[playerState.z][targetY][targetX];
                if (targetTileType === TileId.BANK_BOOTH) { // BANK BOOTH
                    let nx = targetX, ny = targetY + 1;
                    if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) {
                        if (Math.abs(heightMap[playerState.z][ny][nx] - targetH) < 0.1) validTargets.add(encodeTileKey(nx, ny));
                    }
                } else {
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            let nx = targetX + dx, ny = targetY + dy;

                            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                                // Normal adjacent interaction check
                                if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) {
                                    const pierFishingApproach = interactionObj === 'WATER'
                                        && isPierFishingApproachTile(nx, ny, targetX, targetY, playerState.z);
                                    if (interactionObj === 'WATER' && !pierFishingApproach) {
                                        const isCardinalAdjacent = (Math.abs(dx) + Math.abs(dy)) === 1;
                                        if (!isCardinalAdjacent) continue;
                                        if (isWaterTileId(logicalMap[playerState.z][ny][nx])) continue;
                                    }
                                    if (pierFishingApproach || Math.abs(heightMap[playerState.z][ny][nx] - targetH) <= 0.3) {
                                        const neighborKey = encodeTileKey(nx, ny);
                                        if (stationApproachKeys.size === 0 || stationApproachKeys.has(neighborKey)) validTargets.add(neighborKey);
                                    }
                                }
                                continue;
                            }

                            const maxAxis = Math.max(Math.abs(dx), Math.abs(dy));
                            const isAltarRingTile = interactionObj === 'ALTAR_CANDIDATE' && maxAxis === 2;
                            if (isAltarRingTile) {
                                if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) {
                                    if (Math.abs(heightMap[playerState.z][ny][nx] - targetH) <= 0.3) validTargets.add(encodeTileKey(nx, ny));
                                }
                                continue;
                            }

                            if (targetTileType === TileId.SOLID_NPC) { // Allow reaching NPCs over counters
                                if (Math.abs(dx) === 2 && dy === 0) {
                                    let midX = targetX + dx / 2;
                                    if (logicalMap[playerState.z][targetY][midX] === TileId.SHOP_COUNTER) {
                                        if (nx >= 0 && nx < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) validTargets.add(encodeTileKey(nx, ny));
                                    }
                                } else if (Math.abs(dy) === 2 && dx === 0) {
                                    let midY = targetY + dy / 2;
                                    if (logicalMap[playerState.z][midY][targetX] === TileId.SHOP_COUNTER) {
                                        if (ny >= 0 && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) validTargets.add(encodeTileKey(nx, ny));
                                    }
                                }
                            }
                        }
                    }
                }
                if (validTargets.size === 0) return [];
            } else validTargets.add(encodeTileKey(targetX, targetY));
            
            const startKey = encodeTileKey(startX, startY);
            if (validTargets.has(startKey)) return [];
            
            let queue = [startKey];
            let queueIndex = 0;
            let visitedParents = new Map();
            visitedParents.set(startKey, -1);
            
            let dirs8 = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}];
            const restrictPierFishingToDeck = interactionObj === 'WATER' && isPierDeckTile(startX, startY, playerState.z);
            
            let iterations = 0; 
            let foundTargetKey = -1;

            while (queueIndex < queue.length) {
                if (iterations++ > PATHFIND_MAX_ITERATIONS) break; 
                
                let currentKey = queue[queueIndex++];
                let currentX = decodeTileX(currentKey);
                let currentY = decodeTileY(currentKey);
                let currentHeight = heightMap[playerState.z][currentY][currentX];
                
                for (let dir of dirs8) {
                    let nx = currentX + dir.x; let ny = currentY + dir.y;
                    let nextKey = encodeTileKey(nx, ny);
                    if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && !visitedParents.has(nextKey) && isStandableTile(nx, ny, playerState.z)) {
                        if (interactionObj === 'WATER' && isWaterTileId(logicalMap[playerState.z][ny][nx])) continue;
                        if (restrictPierFishingToDeck && isWaterTileId(logicalMap[playerState.z][ny][nx])) continue;
                        let nextHeight = heightMap[playerState.z][ny][nx]; 
                        let isStairTransition = (logicalMap[playerState.z][ny][nx] === TileId.STAIRS_RAMP || logicalMap[playerState.z][currentY][currentX] === TileId.STAIRS_RAMP) && Math.abs(currentHeight - nextHeight) <= 0.6;
                        if (Math.abs(currentHeight - nextHeight) > 0.3 && !isStairTransition) continue;
                        
                        if (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1) {
                            let hX = heightMap[playerState.z][currentY][currentX + dir.x]; let hY = heightMap[playerState.z][currentY + dir.y][currentX];
                            let blockX = !isStandableTile(currentX + dir.x, currentY, playerState.z) || Math.abs(hX - currentHeight) > 0.3;
                            let blockY = !isStandableTile(currentX, currentY + dir.y, playerState.z) || Math.abs(hY - currentHeight) > 0.3;
                            if (blockX && blockY) continue; 
                        }
                        
                        visitedParents.set(nextKey, currentKey);
                        
                        if (validTargets.has(nextKey)) {
                            foundTargetKey = nextKey;
                            queueIndex = queue.length;
                            break;
                        }
                        queue.push(nextKey);
                    }
                }
            }
            
            if (foundTargetKey === -1) return [];

            let path = [];
            let currentPathKey = foundTargetKey;
            
            while (currentPathKey !== -1 && currentPathKey !== startKey) {
                let cx = decodeTileX(currentPathKey);
                let cy = decodeTileY(currentPathKey);
                path.unshift({x: cx, y: cy});
                const parentKey = visitedParents.get(currentPathKey);
                if (parentKey === undefined) break;
                currentPathKey = parentKey;
            }
            
            return path;
        }

        function processTick() {
            if (isAnimationStudioActive()) {
                lastTickTime = Date.now();
                return;
            }
            currentTick++; lastTickTime = Date.now();
            
            const posXEl = document.getElementById('pos-x');
            if (posXEl) {
                posXEl.innerText = playerState.x;
                document.getElementById('pos-y').innerText = playerState.y;
                document.getElementById('pos-z').innerText = playerState.z;
            }

            let movedThisTick = false;
            playerState.prevX = playerState.x; playerState.prevY = playerState.y; playerState.midX = null; playerState.midY = null;
            for (let i = respawningTrees.length - 1; i >= 0; i--) { if (currentTick >= respawningTrees[i].respawnTick) { respawnTree(respawningTrees[i].x, respawningTrees[i].y, respawningTrees[i].z); respawningTrees.splice(i, 1); } }
            if (typeof tickRockNodes === 'function') tickRockNodes();
            if (typeof window.updateGroundItems === 'function') window.updateGroundItems();
            if (typeof window.tickFireLifecycle === 'function') window.tickFireLifecycle();

            if (pendingAction) {
                let actionX = pendingAction.x;
                let actionY = pendingAction.y;

                if (pendingAction.type === 'INTERACT' && pendingAction.obj === 'WATER') {
                    const edgeWater = findNearestFishableWaterEdgeTile(pendingAction.x, pendingAction.y);
                    if (edgeWater) {
                        actionX = edgeWater.x;
                        actionY = edgeWater.y;
                    }
                }

                playerState.targetX = actionX; playerState.targetY = actionY;
                if (pendingAction.type === 'WALK') {
                    playerState.pendingSkillStart = null;
                    playerState.pendingInteractAfterFletchingWalk = null;
                    const stairDescendPath = pendingAction.obj === 'PIER_STEP_DESCEND'
                        ? buildPierStepDescendPath(playerState.x, playerState.y, actionX, actionY, playerState.z)
                        : null;
                    playerState.path = stairDescendPath || findPath(playerState.x, playerState.y, actionX, actionY, false);

                    if (playerState.path.length === 0 && pendingAction.obj === 'PIER_STEP_DESCEND') {
                        const z = playerState.z;
                        const onPierDeck = isPierDeckTile(playerState.x, playerState.y, z);
                        const targetStandable = isStandableTile(actionX, actionY, z);
                        if (window.QA_PIER_DEBUG) emitPierDebug(`stair fallback blocked onDeck=${onPierDeck} standable=${targetStandable}`);
                    }

                    if (window.QA_PIER_DEBUG && playerState.path.length === 0) {
                        const nearPier = isNearPierBoundsTile(playerState.x, playerState.y, playerState.z, 3)
                            || isNearPierBoundsTile(actionX, actionY, playerState.z, 3);
                        if (nearPier) {
                            const z = playerState.z;
                            const startTile = logicalMap[z][playerState.y][playerState.x];
                            const targetTile = logicalMap[z][actionY][actionX];
                            const startH = heightMap[z][playerState.y][playerState.x];
                            const targetH = heightMap[z][actionY][actionX];
                            emitPierDebug(`walk path empty start=(${playerState.x},${playerState.y}) t=${startTile} h=${startH.toFixed(2)} target=(${actionX},${actionY}) t=${targetTile} h=${targetH.toFixed(2)} standable=${isStandableTile(actionX, actionY, z)}`);
                        }
                    }
                    if (playerState.path.length === 0) clearMinimapDestination();
                    playerState.pendingActionAfterTurn = null;
                    playerState.turnLock = false;
                    playerState.actionVisualReady = true;
                    const keepFletchingAction = playerState.action === 'SKILLING: FLETCHING' && hasActiveFletchingProcessingSession();
                    if (keepFletchingAction) {
                        playerState.action = 'SKILLING: FLETCHING';
                    } else {
                        playerState.action = playerState.path.length > 0 ? 'WALKING' : 'IDLE';
                    }
                } else if (pendingAction.type === 'INTERACT') {
                    if (pendingAction.obj === 'ENEMY') {
                        playerState.pendingSkillStart = null;
                        playerState.pendingInteractAfterFletchingWalk = null;
                        playerState.path = [];
                        playerState.pendingActionAfterTurn = null;
                        playerState.turnLock = false;
                        playerState.actionVisualReady = true;
                        playerState.targetObj = 'ENEMY';
                        playerState.targetUid = pendingAction.targetUid;
                        let enemyRuntimeId = null;
                        if (pendingAction.targetUid && typeof pendingAction.targetUid === 'object') {
                            if (Number.isInteger(pendingAction.targetUid.enemyX)) playerState.targetX = pendingAction.targetUid.enemyX;
                            if (Number.isInteger(pendingAction.targetUid.enemyY)) playerState.targetY = pendingAction.targetUid.enemyY;
                            enemyRuntimeId = String(pendingAction.targetUid.enemyId || '').trim();
                        } else if (typeof pendingAction.targetUid === 'string') {
                            enemyRuntimeId = pendingAction.targetUid.trim();
                        }
                        if (enemyRuntimeId && typeof window.lockPlayerCombatTarget === 'function') {
                            window.lockPlayerCombatTarget(enemyRuntimeId);
                        }
                        playerState.action = 'IDLE';
                    } else {
                        // Force standing adjacent to interactables (unless picking up a ground item)
                        const forceAdjacent = pendingAction.obj !== 'GROUND_ITEM';
                        playerState.path = findPath(playerState.x, playerState.y, actionX, actionY, forceAdjacent, pendingAction.obj);
                        playerState.pendingActionAfterTurn = null;
                        playerState.turnLock = false;
                        playerState.actionVisualReady = true;
                        const keepFletchingAction = playerState.action === 'SKILLING: FLETCHING' && hasActiveFletchingProcessingSession();

                        let pendingSkillStart = playerState.pendingSkillStart || null;
                        if (window.SkillRuntime
                            && typeof SkillRuntime.canHandleTarget === 'function'
                            && SkillRuntime.canHandleTarget(pendingAction.obj)
                            && pendingAction.targetUid
                            && typeof pendingAction.targetUid === 'object'
                            && typeof pendingAction.targetUid.skillId === 'string') {
                            pendingSkillStart = Object.assign({}, pendingAction.targetUid, {
                                targetObj: pendingAction.obj,
                                targetX: actionX,
                                targetY: actionY,
                                targetZ: playerState.z
                            });
                        } else if (pendingSkillStart && pendingSkillStart.targetObj === pendingAction.obj) {
                            pendingSkillStart = Object.assign({}, pendingSkillStart, {
                                targetX: actionX,
                                targetY: actionY,
                                targetZ: playerState.z
                            });
                        }
                        if (keepFletchingAction) {
                            playerState.pendingInteractAfterFletchingWalk = {
                                targetObj: pendingAction.obj,
                                targetUid: pendingAction.targetUid,
                                targetX: actionX,
                                targetY: actionY,
                                targetZ: playerState.z
                            };
                            playerState.pendingSkillStart = pendingSkillStart;
                            playerState.action = 'SKILLING: FLETCHING';
                            playerState.targetObj = pendingAction.obj;
                            playerState.targetUid = pendingAction.targetUid;
                        } else {
                            playerState.pendingInteractAfterFletchingWalk = null;
                            playerState.pendingSkillStart = pendingSkillStart;
                            playerState.action = 'WALKING_TO_INTERACT'; playerState.targetObj = pendingAction.obj; playerState.targetUid = pendingAction.targetUid;
                        }
                    }
                }
                pendingAction = null;

            }

            if (typeof window.processCombatTick === 'function') window.processCombatTick();
            if (window.QA_COMBAT_DEBUG
                && typeof window.getQaCombatDebugSignature === 'function'
                && typeof window.emitQaCombatDebugSnapshot === 'function') {
                const combatDebugSignature = window.getQaCombatDebugSignature();
                if (window.__qaCombatDebugLastSignature !== combatDebugSignature) {
                    window.__qaCombatDebugLastSignature = combatDebugSignature;
                    const tickNow = Number.isFinite(currentTick) ? currentTick : null;
                    const lastEmitTick = Number.isFinite(window.__qaCombatDebugLastEmitTick)
                        ? window.__qaCombatDebugLastEmitTick
                        : null;
                    const canEmit = tickNow === null || lastEmitTick === null || (tickNow - lastEmitTick) >= 6;
                    if (canEmit) {
                        window.__qaCombatDebugLastEmitTick = tickNow;
                        window.emitQaCombatDebugSnapshot('tick');
                    }
                }
            }
            if (typeof window.updateStats === 'function') window.updateStats();
            
            if (playerState.path.length > 0) {
                let stepsToTake = isRunning ? 2 : 1; let nextStep = playerState.path.shift();
                if (stepsToTake === 2 && playerState.path.length > 0) {
                    playerState.midX = nextStep.x; playerState.midY = nextStep.y;
                    let finalStep = playerState.path.shift(); playerState.x = finalStep.x; playerState.y = finalStep.y;
                } else { playerState.x = nextStep.x; playerState.y = nextStep.y; }
                movedThisTick = true;
                
                if (isBankOpen) closeBank();
            }
            
            if (playerState.path.length === 0) {
                if (playerState.action === 'SKILLING: FLETCHING' && playerState.pendingInteractAfterFletchingWalk) {
                    if (movedThisTick) return;
                    const deferred = playerState.pendingInteractAfterFletchingWalk;
                    if (Number.isInteger(deferred.targetX)) playerState.targetX = deferred.targetX;
                    if (Number.isInteger(deferred.targetY)) playerState.targetY = deferred.targetY;
                    if (typeof deferred.targetObj === 'string' && deferred.targetObj) playerState.targetObj = deferred.targetObj;
                    if (deferred.targetUid !== undefined) playerState.targetUid = deferred.targetUid;

                    const distX = Math.abs(playerState.targetX - playerState.x);
                    const distY = Math.abs(playerState.targetY - playerState.y);
                    let isAdjacent = (distX <= 1 && distY <= 1);
                    if (playerState.targetObj === 'ALTAR_CANDIDATE') {
                        isAdjacent = (distX <= 2 && distY <= 2 && (distX > 1 || distY > 1));
                    }
                    let isAcrossCounter = false;
                    if (playerState.targetObj === 'NPC' || playerState.targetObj === 'SHOP_COUNTER') {
                        if (distX === 2 && distY === 0 && logicalMap[playerState.z][playerState.y][Math.min(playerState.x, playerState.targetX) + 1] === TileId.SHOP_COUNTER) isAcrossCounter = true;
                        if (distY === 2 && distX === 0 && logicalMap[playerState.z][Math.min(playerState.y, playerState.targetY) + 1][playerState.x] === TileId.SHOP_COUNTER) isAcrossCounter = true;
                    }

                    if (isAdjacent || isAcrossCounter) {
                        stopActiveFletchingProcessingSession();
                        playerState.pendingInteractAfterFletchingWalk = null;
                        playerState.action = 'WALKING_TO_INTERACT';
                    } else {
                        playerState.pendingInteractAfterFletchingWalk = null;
                    }
                }
                if (playerState.action === 'WALKING_TO_INTERACT') {
                    if (movedThisTick) return;
                    const distX = Math.abs(playerState.targetX - playerState.x); 
                    const distY = Math.abs(playerState.targetY - playerState.y);
                    const playerH = heightMap[playerState.z][playerState.y][playerState.x];
                    const targetH = heightMap[playerState.z][playerState.targetY][playerState.targetX];

                    if (playerState.targetObj === 'GROUND_ITEM') {
                        if (distX === 0 && distY === 0) { 
                            const itemEntry = groundItems.find(gi => gi.uid === playerState.targetUid);
                            if (itemEntry && giveItem(itemEntry.itemData, itemEntry.amount) > 0) {
                                // FIX: Remove from parent chunk instead of global scene
                                if (itemEntry.mesh.parent) itemEntry.mesh.parent.remove(itemEntry.mesh);
                                else scene.remove(itemEntry.mesh);
                                
                                environmentMeshes = environmentMeshes.filter(m => !itemEntry.mesh.children.includes(m)); 
                                groundItems = groundItems.filter(gi => gi.uid !== itemEntry.uid);
                                renderInventory();
                            }
                            playerState.action = 'IDLE';
                        } else playerState.action = 'IDLE';
                    } else if (playerState.targetObj === 'DOOR') {
                        const door = playerState.targetUid;
                        if (door) {
                            // EMERGENCY ANTI-CLIP: Push player off the door tile if they are standing on it
                            if (door.isOpen && playerState.x === door.x && playerState.y === door.y) {
                                const dirs = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}];
                                for (let d of dirs) {
                                    let nx = playerState.x + d.x, ny = playerState.y + d.y;
                                    if (isStandableTile(nx, ny, playerState.z) && logicalMap[playerState.z][ny][nx] !== TileId.DOOR_OPEN) {
                                        playerState.x = nx; playerState.y = ny;
                                        playerState.prevX = nx; playerState.prevY = ny;
                                        break;
                                    }
                                }
                            }
                            
                            door.isOpen = !door.isOpen;
                            door.targetRotation = door.isOpen ? door.openRot : door.closedRot;
                            logicalMap[door.z][door.y][door.x] = door.isOpen ? TileId.DOOR_OPEN : TileId.DOOR_CLOSED;
                            updateMinimapCanvas(); // Redraw map to show Walkable state change
                        }
                        playerState.action = 'IDLE';
                    } else {
                        let isAdjacent = (distX <= 1 && distY <= 1);
                        if (playerState.targetObj === 'ALTAR_CANDIDATE') {
                            // Altars are interacted from one tile farther than default.
                            isAdjacent = (distX <= 2 && distY <= 2 && (distX > 1 || distY > 1));
                        } else if (playerState.targetObj === 'WATER') {
                            const cardinalAdjacent = (distX + distY) === 1;
                            const isPierApproach = isPierFishingApproachTile(
                                playerState.x,
                                playerState.y,
                                playerState.targetX,
                                playerState.targetY,
                                playerState.z
                            );
                            const standingOnWater = isWaterTileId(logicalMap[playerState.z][playerState.y][playerState.x]);
                            isAdjacent = cardinalAdjacent && (isPierApproach || !standingOnWater);
                        }
                        let isAcrossCounter = false;
                        if (playerState.targetObj === 'NPC' || playerState.targetObj === 'SHOP_COUNTER') {
                            if (distX === 2 && distY === 0 && logicalMap[playerState.z][playerState.y][Math.min(playerState.x, playerState.targetX) + 1] === TileId.SHOP_COUNTER) isAcrossCounter = true;
                            if (distY === 2 && distX === 0 && logicalMap[playerState.z][Math.min(playerState.y, playerState.targetY) + 1][playerState.x] === TileId.SHOP_COUNTER) isAcrossCounter = true;
                        }

                        if (isAdjacent || isAcrossCounter) {
                            const stationApproach = validateStationApproach(
                                playerState.targetObj,
                                playerState.targetX,
                                playerState.targetY,
                                playerState.x,
                                playerState.y
                            );
                            if (!stationApproach.ok) {
                                if (typeof addChatMessage === 'function' && stationApproach.message) addChatMessage(stationApproach.message, 'warn');
                                playerState.action = 'IDLE';
                                return;
                            }

                            const pierFishingApproach = playerState.targetObj === 'WATER'
                                && isPierFishingApproachTile(playerState.x, playerState.y, playerState.targetX, playerState.targetY, playerState.z);
                            if (Math.abs(playerH - targetH) > 0.3 && !isAcrossCounter && !pierFishingApproach) {
                                playerState.action = 'IDLE';
                            } else if (playerState.targetObj === 'NPC' || playerState.targetObj === 'SHOP_COUNTER') {
                                playerState.action = 'IDLE';
                                const faceDx = playerState.targetX - playerState.x; const faceDy = playerState.targetY - playerState.y; 
                                if (faceDx !== 0 || faceDy !== 0) { playerState.targetRotation = Math.atan2(faceDx, faceDy); if (playerRig) playerRig.rotation.y = playerState.targetRotation; }
                                
                                if (playerState.targetObj === 'NPC' && playerState.targetUid && playerState.targetUid.action === 'Trade') {
                                    openShop(playerState.targetUid.merchantId || 'general_store');
                                } else if (playerState.targetObj === 'NPC' && playerState.targetUid && playerState.targetUid.action === 'Travel') {
                                    if (typeof window.travelToWorld === 'function') {
                                        const explicitWorldId = playerState.targetUid.travelToWorldId || null;
                                        const sessionWorldId = (window.GameSessionRuntime && typeof window.GameSessionRuntime.resolveCurrentWorldId === 'function')
                                            ? window.GameSessionRuntime.resolveCurrentWorldId()
                                            : ((window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getCurrentWorldId === 'function')
                                                ? window.WorldBootstrapRuntime.getCurrentWorldId()
                                                : null);
                                        const targetWorldId = explicitWorldId || sessionWorldId;
                                        if (targetWorldId) {
                                            window.travelToWorld(targetWorldId, {
                                                spawn: playerState.targetUid.travelSpawn || null,
                                                label: playerState.targetUid.worldLabel || playerState.targetUid.name || targetWorldId
                                            });
                                        }
                                    }
                                }
                            } else if (playerState.targetObj === 'BANK_BOOTH') {
                                playerState.action = 'IDLE';
                                const faceDx = playerState.targetX - playerState.x; const faceDy = playerState.targetY - playerState.y; 
                                if (faceDx !== 0 || faceDy !== 0) { playerState.targetRotation = Math.atan2(faceDx, faceDy); if (playerRig) playerRig.rotation.y = playerState.targetRotation; }
                                openBank();
                            } else {
                                if (playerState.targetObj === 'FURNACE' || playerState.targetObj === 'ANVIL') {
                                    // Force straight cardinal facing toward station.
                                    let faceDx = playerState.targetX - playerState.x;
                                    let faceDy = playerState.targetY - playerState.y;
                                    if (Math.abs(faceDx) >= Math.abs(faceDy)) {
                                        faceDx = Math.sign(faceDx);
                                        faceDy = 0;
                                    } else {
                                        faceDy = Math.sign(faceDy);
                                        faceDx = 0;
                                    }
                                    if (faceDx !== 0 || faceDy !== 0) {
                                        playerState.targetRotation = Math.atan2(faceDx, faceDy);
                                        if (playerRig) playerRig.rotation.y = playerState.targetRotation;
                                    }
                                }
                                if (playerState.targetObj === 'WATER') {
                                    // Keep fishing stance head-on toward the selected water tile.
                                    let faceDx = playerState.targetX - playerState.x;
                                    let faceDy = playerState.targetY - playerState.y;
                                    if (Math.abs(faceDx) >= Math.abs(faceDy)) {
                                        faceDx = Math.sign(faceDx);
                                        faceDy = 0;
                                    } else {
                                        faceDy = Math.sign(faceDy);
                                        faceDx = 0;
                                    }
                                    if (faceDx !== 0 || faceDy !== 0) {
                                        playerState.targetRotation = Math.atan2(faceDx, faceDy);
                                        if (playerRig) playerRig.rotation.y = playerState.targetRotation;
                                    }
                                }
                                if (window.SkillRuntime && SkillRuntime.canHandleTarget(playerState.targetObj)) {
                                    if (!SkillRuntime.tryStartFromPlayerTarget()) playerState.action = 'IDLE';
                                } else playerState.action = 'IDLE';
                            }
                        } else {
                            if (playerState.targetObj === 'ALTAR_CANDIDATE' && window.QA_RC_DEBUG && typeof addChatMessage === 'function') {
                                addChatMessage(`[QA rcdbg] interact blocked: dist=(${distX},${distY}) target=(${playerState.targetX},${playerState.targetY}) player=(${playerState.x},${playerState.y})`, 'info');
                            }
                            playerState.action = 'IDLE';
                        }
                    }
                } else if (playerState.action === 'WALKING') {
                    playerState.action = 'IDLE';
                    if (minimapDestination
                        && minimapDestination.z === playerState.z
                        && minimapDestination.x === playerState.x
                        && minimapDestination.y === playerState.y) {
                        clearMinimapDestination();
                    }
                }
            }

            if (minimapDestination
                && minimapDestination.z === playerState.z
                && minimapDestination.x === playerState.x
                && minimapDestination.y === playerState.y) {
                clearMinimapDestination();
            }

            if (playerState.action === 'IDLE' || playerState.action === 'WALKING' || playerState.action === 'WALKING_TO_INTERACT') {
                playerState.turnLock = false;
                playerState.actionVisualReady = true;
                playerState.pendingActionAfterTurn = null;
            }
            
            if (!(window.SkillRuntime && SkillRuntime.handleSkillTick())) {
                // Combat ticks are handled by the dedicated combat runtime.
            }
        }

        function createHumanoidModel(type) {
            const group = new THREE.Group(); group.rotation.order = 'YXZ'; group.userData.animType = type;
            const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35); const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.3);
            function createTaperedBoxGeo(wTop, wBottom, h) { let geo = new THREE.CylinderGeometry(wTop / Math.SQRT2, wBottom / Math.SQRT2, h, 4); geo.rotateY(Math.PI / 4); geo = geo.toNonIndexed(); geo.computeVertexNormals(); return geo; }
            const elbowWidth = 0.2 / Math.SQRT2; const wristWidth = elbowWidth / Math.SQRT2;
            const upperArmGeo = createTaperedBoxGeo(0.2, elbowWidth, 0.35); upperArmGeo.translate(0, -0.175, -0.1); 
            const lowerArmGeo = createTaperedBoxGeo(elbowWidth, wristWidth, 0.35); lowerArmGeo.translate(0, -0.175, 0);
            const legGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25); legGeo.translate(0, -0.35, 0); 
            
            let skinHex = 0xffcc99; let torsoHex = 0x8b4513; let legHex = 0x2e8b57; let hairHex = 0x4a3018; let capeHex = 0x880000;
            if (type === 2) { torsoHex = 0x555555; legHex = 0x222222; } 
            else if (type === 3) { torsoHex = 0x111111; legHex = 0x111111; } 
            else if (type === 4) { torsoHex = 0xaa0000; legHex = 0x222222; hairHex = 0xdddddd; capeHex = 0x111111; } // Red King (Grey beard, dark cape)
            else if (type === 5) { torsoHex = 0x0000aa; legHex = 0xaaaaaa; hairHex = 0x333333; capeHex = 0xeeeeee; } // Blue King (Dark beard, white cape)
            else if (type === 6) { torsoHex = 0x660066; legHex = 0x111111; hairHex = 0xcccccc; capeHex = 0x222222; } // Purple King
            else if (type === 7) { torsoHex = 0x006600; legHex = 0x333333; hairHex = 0xaa5500; capeHex = 0x880000; } // Green King
            else if (type === 8) { torsoHex = 0xff66b2; legHex = 0xff66b2; hairHex = 0xffffff; } // Pink Queen
            else if (type === 9) { torsoHex = 0x222222; legHex = 0x222222; hairHex = 0x111111; } // Dark Queen
            else if (type === 10) { torsoHex = 0xcc0000; legHex = 0xcc0000; hairHex = 0x111111;} // Crimson Queen
            else if (type === 11) { torsoHex = 0xffffff; legHex = 0xffffff; hairHex = 0xddaa00;} // White Queen

            const isKing = type >= 4 && type <= 7;
            const isQueen = type >= 8 && type <= 11;

            const skinMat = new THREE.MeshLambertMaterial({color: skinHex}); const torsoMat = new THREE.MeshLambertMaterial({color: torsoHex}); const legMat = new THREE.MeshLambertMaterial({color: legHex}); const armMat = (type >= 2) ? torsoMat : skinMat; const hairMat = new THREE.MeshLambertMaterial({color: hairHex});
            const eyeMat = new THREE.MeshBasicMaterial({color: 0x111111}); const mouthMat = new THREE.MeshBasicMaterial({color: 0x331111});
            const head = new THREE.Mesh(headGeo, skinMat); head.position.y = 1.55;
            const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 16), eyeMat); leftEye.position.set(-0.08, 0.05, 0.18); leftEye.scale.set(1, 1.5, 0.5);
            const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 16), eyeMat); rightEye.position.set(0.08, 0.05, 0.18); rightEye.scale.set(1, 1.5, 0.5);
            const lBrow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.04), hairMat); lBrow.position.set(-0.08, 0.1, 0.18);
            const rBrow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.04), hairMat); rBrow.position.set(0.08, 0.1, 0.18);
            let mouth;
            if (type === 3) {
                mouth = new THREE.Group();
                const mBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.04), new THREE.MeshBasicMaterial({color: 0x000000}));
                const mL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.04), new THREE.MeshBasicMaterial({color: 0x000000})); mL.position.set(-0.11, 0.02, 0);
                const mR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.04), new THREE.MeshBasicMaterial({color: 0x000000})); mR.position.set(0.11, 0.02, 0);
                const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.02, 0.041), new THREE.MeshBasicMaterial({color: 0xffffff})); teeth.position.set(0, 0.01, 0);
                mouth.add(mBase, mL, mR, teeth); mouth.position.set(0, -0.05, 0.18);
                leftEye.scale.set(1.5, 1.5, 0.5); rightEye.scale.set(1.5, 1.5, 0.5); lBrow.visible = false; rBrow.visible = false;
            } else { mouth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.04), mouthMat); mouth.position.set(0, -0.04, 0.18); }
            head.add(leftEye, rightEye, lBrow, rBrow, mouth);
            if (type === 1) {
                const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.36), hairMat); hairBase.position.set(0, 0.18, 0);
                const spike1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), hairMat); spike1.position.set(0, 0.25, 0);
                const spike2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), hairMat); spike2.position.set(0.1, 0.22, 0.1);
                const spike3 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), hairMat); spike3.position.set(-0.1, 0.22, -0.1);
                const beard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.15, 0.2), hairMat); beard.position.set(0, -0.1, 0.1);
                head.add(hairBase, spike1, spike2, spike3, beard);
            } else if (type === 3) {
                const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16), new THREE.MeshLambertMaterial({color: 0x111111})); brim.position.set(0, 0.2, 0);
                const top = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16), new THREE.MeshLambertMaterial({color: 0x111111})); top.position.set(0, 0.35, 0);
                head.add(brim, top);
            }
            
            if (isKing) {
                // Majestic Beard
                const beard = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.25), hairMat);
                beard.position.set(0, -0.15, 0.12);
                head.add(beard);
                
                // Royal Crown with velvet top
                const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.15, 8, 1, true), new THREE.MeshLambertMaterial({color: 0xffdd00, side: THREE.DoubleSide}));
                const crownVelvet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshLambertMaterial({color: capeHex})); 
                crownVelvet.position.y = 0.05; crownBase.add(crownVelvet);
                crownBase.position.set(0, 0.25, 0); head.add(crownBase);
            } else if (isQueen) {
                // Long elegant hair
                const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.15), hairMat); backHair.position.set(0, -0.1, -0.15);
                const sideHairL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.15), hairMat); sideHairL.position.set(-0.18, -0.1, 0);
                const sideHairR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.15), hairMat); sideHairR.position.set(0.18, -0.1, 0);
                head.add(backHair, sideHairL, sideHairR);

                // Diamond Tiara
                const tiara = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8, 1, true), new THREE.MeshLambertMaterial({color: type === 11 ? 0xffffff : 0xffdd00, side: THREE.DoubleSide}));
                const gem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), new THREE.MeshLambertMaterial({color: 0x00ffff}));
                gem.position.set(0, 0.04, 0.17); tiara.add(gem);
                tiara.position.set(0, 0.22, 0); tiara.rotation.x = -0.1; head.add(tiara);
            }

            const torso = new THREE.Mesh(torsoGeo, torsoMat); torso.position.y = 1.05;
            
            if (isKing) {
                // Royal Cape
                const cape = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.05), new THREE.MeshLambertMaterial({color: capeHex}));
                cape.position.set(0, -0.05, -0.18); cape.rotation.x = 0.15; // Flare out
                torso.add(cape);
            }

            const leftArm = new THREE.Mesh(upperArmGeo, armMat); leftArm.position.set(0.38, 1.4, 0.1);
            const leftLowerArm = new THREE.Mesh(lowerArmGeo, skinMat); leftLowerArm.position.set(0, -0.35, -0.1); leftArm.add(leftLowerArm);
            const rightArm = new THREE.Mesh(upperArmGeo, armMat); rightArm.position.set(-0.38, 1.4, 0.1); 
            const rightLowerArm = new THREE.Mesh(lowerArmGeo, skinMat); rightLowerArm.position.set(0, -0.35, -0.1); rightArm.add(rightLowerArm);
            
            const axeGroup = new THREE.Group();
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6).rotateX(Math.PI/2), new THREE.MeshLambertMaterial({color: 0x5c4033})); handle.position.set(0, 0, 0.15); 
            const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.15), new THREE.MeshLambertMaterial({color: 0x999999})); axeHead.position.set(0, -0.125, 0.35); 
            axeGroup.add(handle, axeHead); axeGroup.position.set(0, -0.35, 0); axeGroup.visible = false; rightLowerArm.add(axeGroup);
            
            let leftLeg, rightLeg;
            if (isQueen) {
                // Elegant Gown instead of legs
                const gownGeo = new THREE.CylinderGeometry(0.25, 0.45, 0.7, 8).translate(0, -0.35, 0);
                const gown = new THREE.Mesh(gownGeo, torsoMat); // Gowns typically match the dress torso
                gown.position.set(0, 0.7, 0);
                group.add(gown);
                
                // Dummy leg groups so the walk animation doesn't crash trying to animate them
                leftLeg = new THREE.Group(); rightLeg = new THREE.Group();
            } else {
                leftLeg = new THREE.Mesh(legGeo, legMat); leftLeg.position.set(0.14, 0.7, 0); 
                rightLeg = new THREE.Mesh(legGeo, legMat); rightLeg.position.set(-0.14, 0.7, 0); 
                group.add(leftLeg, rightLeg);
            }

            group.add(head, torso, leftArm, rightArm); group.traverse(child => { if(child.isMesh) child.castShadow = true; });
            group.userData.rig = { head, torso, leftArm, rightArm, leftLowerArm, rightLowerArm, leftLeg, rightLeg, axe: axeGroup, attackTick: -1, attackAnimationStartedAt: -1, hitReactionTick: -1 }; group.userData.baseY = 0;
            return group;
        }

        function resolveTooltipTargetTile(hitData) {
            if (!hitData || !Number.isInteger(hitData.gridX) || !Number.isInteger(hitData.gridY)) return null;
            if (hitData.type === 'WATER') {
                const edge = findNearestFishableWaterEdgeTile(hitData.gridX, hitData.gridY);
                return edge || { x: hitData.gridX, y: hitData.gridY };
            }
            return { x: hitData.gridX, y: hitData.gridY };
        }

        function isHitWithinTooltipWalkDistance(hitData) {
            const target = resolveTooltipTargetTile(hitData);
            if (!target) return true;
            const dx = Math.abs(target.x - playerState.x);
            const dy = Math.abs(target.y - playerState.y);
            return Math.max(dx, dy) <= MAX_TOOLTIP_WALK_DISTANCE_TILES;
        }

        function updateHoverTooltip() {
            const tooltip = document.getElementById('hover-tooltip');
            if (isDraggingCamera || isFreeCam || isBankOpen || currentMouseX === 0) { tooltip.classList.add('hidden'); return; }
            const hoveredElement = document.elementFromPoint(currentMouseX, currentMouseY);
            if (hoveredElement && hoveredElement.tagName !== 'CANVAS') { tooltip.classList.add('hidden'); return; }

            const hitData = getRaycastHit(currentMouseX, currentMouseY);
            if (hitData) {
                if (!isHitWithinTooltipWalkDistance(hitData)) {
                    tooltip.classList.add('hidden');
                    return;
                }
                                const selectedSlot = getSelectedUseItem();
                const selectedItem = selectedSlot && selectedSlot.itemData ? selectedSlot.itemData : null;
                const selectedCookable = !!(selectedItem && selectedItem.cookResultId && selectedItem.burnResultId);
                const fireUnderCursor = Array.isArray(activeFires) && activeFires.some((f) => {
                    if (!f || f.z !== playerState.z) return false;
                    if (Number.isInteger(hitData.gridX) && Number.isInteger(hitData.gridY) && f.x === hitData.gridX && f.y === hitData.gridY) return true;
                    if (!hitData.point) return false;
                    return Math.hypot((f.x + 0.5) - hitData.point.x, (f.y + 0.5) - hitData.point.z) <= 1.9;
                });

                const isAshesGroundItem = hitData.type === 'GROUND_ITEM' && /^Ashes(?:\s|\(|$)/i.test(hitData.name || '');
                const groundDisplayName = hitData.type === 'GROUND_ITEM'
                    ? formatGroundItemDisplayName(hitData)
                    : (hitData.name || '');

                let actionText = '';
                if (selectedCookable && (hitData.type === 'GROUND' || hitData.type === 'FIRE' || isAshesGroundItem) && fireUnderCursor) {
                    actionText = `<span class="text-gray-300">Use</span> <span class="text-[#ff981f]">${selectedItem.name}</span> <span class="text-gray-300">-></span> <span class="text-orange-300">Fire</span>`;
                } else if (isAshesGroundItem && fireUnderCursor) {
                    actionText = '<span class="text-gray-300">Use</span> <span class="text-orange-300">Fire</span>';
                }

                if (!actionText) {
                    actionText = (window.SkillRuntime && typeof SkillRuntime.getSkillTooltip === 'function')
                        ? SkillRuntime.getSkillTooltip(hitData)
                        : '';
                }

                if (!actionText) {
                    if (hitData.type === 'TREE') {
                        if (logicalMap[playerState.z][hitData.gridY][hitData.gridX] === TileId.TREE) actionText = '<span class="text-gray-300">Chop down</span> <span class="text-cyan-400">Tree</span>';
                    } else if (hitData.type === 'ROCK') actionText = '<span class="text-gray-300">Mine</span> <span class="text-cyan-400">Rock</span>';
                    else if (hitData.type === 'FIRE') actionText = '<span class="text-gray-300">Use</span> <span class="text-orange-300">Fire</span>';
                    else if (hitData.type === 'GROUND_ITEM') actionText = `<span class="text-gray-300">Take</span> <span class="text-[#ff981f]">${groundDisplayName}</span>`;
                    else if (hitData.type === 'BANK_BOOTH') actionText = '<span class="text-gray-300">Bank</span> <span class="text-cyan-400">Bank Booth</span>';
                    else if (hitData.type === 'SHOP_COUNTER') actionText = '<span class="text-gray-300">Examine</span> <span class="text-cyan-400">Shop Counter</span>';
                    else if (hitData.type === 'WATER') actionText = '<span class="text-gray-300">Fish</span> <span class="text-cyan-400">Water</span>';
                    else if (hitData.type === 'DOOR') actionText = `<span class="text-gray-300">${hitData.doorObj.isOpen ? 'Close' : 'Open'}</span> <span class="text-cyan-400">Door</span>`;
                    else if (hitData.type === 'ENEMY') actionText = `<span class="text-gray-300">Attack</span> <span class="text-[#ffff00]">${formatEnemyTooltipDisplayName(hitData)}</span>`;
                    else if (hitData.type === 'STAIRS_UP') actionText = '<span class="text-gray-300">Climb-up</span> <span class="text-cyan-400">Stairs</span>';
                    else if (hitData.type === 'STAIRS_DOWN') actionText = '<span class="text-gray-300">Climb-down</span> <span class="text-cyan-400">Stairs</span>';
                    else if (hitData.type === 'NPC') {
                        const npcAction = (hitData.uid && hitData.uid.action) ? hitData.uid.action : (hitData.name === 'Shopkeeper' ? 'Trade' : 'Talk-to');
                        if (npcAction === 'Trade') actionText = `<span class="text-gray-300">Trade</span> <span class="text-yellow-400">${hitData.name}</span>`;
                        else if (npcAction === 'Travel') actionText = `<span class="text-gray-300">Travel</span> <span class="text-yellow-400">${hitData.name}</span>`;
                        else actionText = `<span class="text-gray-300">Talk-to</span> <span class="text-yellow-400">${hitData.name}</span>`;
                }
                }

                if (actionText) {
                    tooltip.innerHTML = actionText;
                    tooltip.classList.remove('hidden');

                    let x = currentMouseX + 14;
                    let y = currentMouseY + 14;
                    const w = tooltip.offsetWidth;
                    const h = tooltip.offsetHeight;

                    if (x + w > window.innerWidth - 8) x = currentMouseX - w - 14;
                    if (y + h > window.innerHeight - 8) y = currentMouseY - h - 14;
                    if (x < 8) x = 8;
                    if (y < 8) y = 8;

                    tooltip.style.left = x + 'px';
                    tooltip.style.top = y + 'px';
                    tooltip.style.transform = 'none';
                } else tooltip.classList.add('hidden');
            } else tooltip.classList.add('hidden');
        }

        // Helper to grab the visual height extruded for planes
        function getVisualHeight(x, y, z) {
            if (heightMap[z] && heightMap[z][y] && heightMap[z][y][x] !== undefined) {
                return heightMap[z][y][x] + (z * 3.0);
            }
            return z * 3.0;
        }

        function getGroundHeightAtWorldPos(worldX, worldZ, z = playerState.z) {
            const gx = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(worldX + 0.5)));
            const gy = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(worldZ + 0.5)));
            return getVisualHeight(gx, gy, z);
        }
        function updatePlayerOverheadText() {
            const bubble = document.getElementById('player-overhead-text');
            if (!bubble || !playerRig) return;

            if (!playerOverheadText.text || Date.now() > playerOverheadText.expiresAt) {
                bubble.classList.add('hidden');
                return;
            }

            bubble.innerText = playerOverheadText.text;

            const pos = playerRig.position.clone();
            pos.y += 2.3;
            pos.project(camera);

            if (pos.z >= 1) {
                bubble.classList.add('hidden');
                return;
            }

            const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (pos.y * -0.5 + 0.5) * window.innerHeight;
            bubble.style.left = `${x}px`;
            bubble.style.top = `${y}px`;
            bubble.style.transform = 'translate(-50%, -120%)';
            bubble.classList.remove('hidden');
        }

        function initMotionDebugPanel() {
            const panel = document.getElementById('motion-debug-panel');
            if (!panel) return;

            const bindRange = (id, key) => {
                const el = document.getElementById(id);
                if (!el || MOTION_TUNING[key] === undefined) return;
                el.value = String(MOTION_TUNING[key]);
                el.addEventListener('input', () => {
                    const v = Number(el.value);
                    if (Number.isFinite(v)) MOTION_TUNING[key] = v;
                });
            };

            bindRange('motion-step-swing', 'walkLegSwing');
            bindRange('motion-knee-lift', 'walkKneeLift');
            bindRange('motion-bounce', 'walkBounce');
            bindRange('motion-cam-follow', 'cameraFollowY');

            window.addEventListener('keydown', (e) => {
                if (e.key === 'F7') {
                    e.preventDefault();
                    motionDebugVisible = !motionDebugVisible;
                    panel.classList.toggle('hidden', !motionDebugVisible);
                }
            });
        }
                function getPoseEditorDefaultValues() {
            const elbow = (playerRig && playerRig.userData && playerRig.userData.rig && playerRig.userData.rig.elbowPivot)
                ? playerRig.userData.rig.elbowPivot
                : { x: 0, y: -0.35, z: -0.1 };
            return {
                shoulder: { x: PLAYER_SHOULDER_PIVOT.x, y: PLAYER_SHOULDER_PIVOT.y, z: PLAYER_SHOULDER_PIVOT.z },
                elbow: {
                    x: Math.abs(Number.isFinite(elbow.x) ? elbow.x : 0),
                    y: Number.isFinite(elbow.y) ? elbow.y : -0.35,
                    z: Number.isFinite(elbow.z) ? elbow.z : -0.1
                },
                rotations: {
                    leftShoulder: { x: 0, y: 0, z: 0 },
                    rightShoulder: { x: 0, y: 0, z: 0 },
                    leftElbow: { x: 0, y: 0, z: 0 },
                    rightElbow: { x: 0, y: 0, z: 0 }
                }
            };
        }

        function ensurePoseEditorRotationShape(values) {
            if (!values.rotations || typeof values.rotations !== 'object') values.rotations = {};
            ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow'].forEach((key) => {
                const src = values.rotations[key] || { x: 0, y: 0, z: 0 };
                values.rotations[key] = {
                    x: Number.isFinite(src.x) ? src.x : 0,
                    y: Number.isFinite(src.y) ? src.y : 0,
                    z: Number.isFinite(src.z) ? src.z : 0
                };
            });
        }

        function poseEditorNodeForRig(rig, handleId) {
            if (!rig) return null;
            if (handleId === 'leftShoulder') return rig.leftArm;
            if (handleId === 'rightShoulder') return rig.rightArm;
            if (handleId === 'leftElbow') return rig.leftLowerArm;
            if (handleId === 'rightElbow') return rig.rightLowerArm;
            return null;
        }
        function applyPoseEditorValuesToRigRoot(rigRoot, values) {
            if (!rigRoot || !rigRoot.userData || !rigRoot.userData.rig || !values) return;
            const rig = rigRoot.userData.rig;
            if (values.shoulder) {
                const defaultTorsoY = (rig.torso && rig.torso.userData && rig.torso.userData.defaultPos && Number.isFinite(rig.torso.userData.defaultPos.y))
                    ? rig.torso.userData.defaultPos.y
                    : ((rig.torso && Number.isFinite(rig.torso.position.y)) ? rig.torso.position.y : 1.05);
                const shoulderLocalY = values.shoulder.y - defaultTorsoY;
                rig.leftArm.position.set(values.shoulder.x, shoulderLocalY, values.shoulder.z);
                rig.rightArm.position.set(-values.shoulder.x, shoulderLocalY, values.shoulder.z);
            }
            if (values.elbow) {
                rig.elbowPivot = { x: values.elbow.x, y: values.elbow.y, z: values.elbow.z };
                rig.leftLowerArm.position.set(values.elbow.x, values.elbow.y, values.elbow.z);
                rig.rightLowerArm.position.set(-values.elbow.x, values.elbow.y, values.elbow.z);
            }
            ensurePoseEditorRotationShape(values);
            ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow'].forEach((key) => {
                const node = poseEditorNodeForRig(rig, key);
                const rot = values.rotations[key];
                if (!node || !rot) return;
                node.rotation.set(rot.x, rot.y, rot.z);
            });
        }

        function applyPoseEditorValues(values) {
            if (!values) return;
            ensurePoseEditorRotationShape(values);
            poseEditor.values = {
                shoulder: { x: Math.abs(values.shoulder.x), y: values.shoulder.y, z: values.shoulder.z },
                elbow: { x: Math.abs(values.elbow.x), y: values.elbow.y, z: values.elbow.z },
                rotations: {
                    leftShoulder: { ...values.rotations.leftShoulder },
                    rightShoulder: { ...values.rotations.rightShoulder },
                    leftElbow: { ...values.rotations.leftElbow },
                    rightElbow: { ...values.rotations.rightElbow }
                }
            };
            PLAYER_SHOULDER_PIVOT.x = poseEditor.values.shoulder.x;
            PLAYER_SHOULDER_PIVOT.y = poseEditor.values.shoulder.y;
            PLAYER_SHOULDER_PIVOT.z = poseEditor.values.shoulder.z;
            applyPoseEditorValuesToRigRoot(playerRig, poseEditor.values);
            applyPoseEditorValuesToRigRoot(uiPlayerRig, poseEditor.values);
            updatePoseEditorText();
        }

        function updatePoseEditorText() {
            if (!poseEditor.text || !poseEditor.values) return;
            poseEditor.text.value = JSON.stringify(poseEditor.values, null, 2);
        }

        function togglePoseEditor(nextState) {
            poseEditor.enabled = !!nextState;
            if (poseEditor.panel) poseEditor.panel.classList.toggle('hidden', !poseEditor.enabled);
            Object.values(poseEditor.handleMap).forEach((h) => {
                if (h && h.mesh) h.mesh.visible = poseEditor.enabled;
            });
            if (!poseEditor.enabled) poseEditor.activeHandle = null;
        }

        function getPoseEditorNode(handleId) {
            const rig = playerRig && playerRig.userData ? playerRig.userData.rig : null;
            return poseEditorNodeForRig(rig, handleId);
        }

        function makePoseEditorHandle(id, color) {
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.085, 12, 10),
                new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true, opacity: 0.92 })
            );
            mesh.renderOrder = 9999;
            mesh.visible = false;
            mesh.userData.poseHandleId = id;
            scene.add(mesh);
            poseEditor.handleMap[id] = { mesh, id };
        }

        function ensurePoseEditorHandles() {
            if (!scene || poseEditor.handleMap.leftShoulder) return;
            makePoseEditorHandle('leftShoulder', 0x68d2ff);
            makePoseEditorHandle('rightShoulder', 0x68d2ff);
            makePoseEditorHandle('leftElbow', 0xffd166);
            makePoseEditorHandle('rightElbow', 0xffd166);
        }

        function updatePoseEditorHandles() {
            if (!poseEditor.enabled) return;
            ensurePoseEditorHandles();
            ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow'].forEach((id) => {
                const handle = poseEditor.handleMap[id];
                const node = getPoseEditorNode(id);
                if (!handle || !handle.mesh) return;
                if (!node) {
                    handle.mesh.visible = false;
                    return;
                }
                node.getWorldPosition(handle.mesh.position);
                handle.mesh.visible = true;
            });
        }

        function beginPoseEditorDrag(clientX, clientY) {
            if (!poseEditor.enabled || !camera) return false;
            const handles = Object.values(poseEditor.handleMap).map((h) => h.mesh).filter(Boolean).filter((m) => m.visible);
            if (handles.length === 0) return false;
            poseEditor.pointer.x = (clientX / window.innerWidth) * 2 - 1;
            poseEditor.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
            poseEditor.raycaster.setFromCamera(poseEditor.pointer, camera);
            const hits = poseEditor.raycaster.intersectObjects(handles, false);
            if (!hits.length) return false;
            const hit = hits[0];
            const handleId = hit.object.userData.poseHandleId;
            if (!handleId) return false;
            poseEditor.activeHandle = handleId;
            poseEditor.dragLastX = clientX;
            poseEditor.dragLastY = clientY;
            const worldPos = hit.object.getWorldPosition(new THREE.Vector3());
            const normal = camera.getWorldDirection(new THREE.Vector3()).normalize();
            poseEditor.dragPlane.setFromNormalAndCoplanarPoint(normal, worldPos);
            const rayPoint = poseEditor.raycaster.ray.intersectPlane(poseEditor.dragPlane, new THREE.Vector3()) || worldPos;
            poseEditor.dragOffset.copy(worldPos).sub(rayPoint);
            return true;
        }

        function updatePoseEditorDrag(clientX, clientY) {
            if (!poseEditor.activeHandle || !camera) return;
            const node = getPoseEditorNode(poseEditor.activeHandle);
            if (!node || !node.parent) return;
            const values = poseEditor.values || getPoseEditorDefaultValues();

            if (poseEditor.mode === 'rotate') {
                ensurePoseEditorRotationShape(values);
                const dx = clientX - poseEditor.dragLastX;
                const dy = clientY - poseEditor.dragLastY;
                const delta = (dx - dy) * 0.01;
                const rot = values.rotations[poseEditor.activeHandle];
                if (rot && (poseEditor.rotationAxis === 'x' || poseEditor.rotationAxis === 'y' || poseEditor.rotationAxis === 'z')) {
                    rot[poseEditor.rotationAxis] += delta;
                }
            } else {
                poseEditor.pointer.x = (clientX / window.innerWidth) * 2 - 1;
                poseEditor.pointer.y = -(clientY / window.innerHeight) * 2 + 1;
                poseEditor.raycaster.setFromCamera(poseEditor.pointer, camera);
                if (!poseEditor.raycaster.ray.intersectPlane(poseEditor.dragPlane, poseEditor.dragPoint)) return;
                const worldTarget = poseEditor.dragPoint.clone().add(poseEditor.dragOffset);
                const local = node.parent.worldToLocal(worldTarget.clone());
                if (poseEditor.activeHandle === 'leftShoulder' || poseEditor.activeHandle === 'rightShoulder') {
                    values.shoulder.x = Math.abs(local.x);
                    values.shoulder.y = local.y;
                    values.shoulder.z = local.z;
                } else {
                    values.elbow.x = Math.abs(local.x);
                    values.elbow.y = local.y;
                    values.elbow.z = local.z;
                }
            }
            poseEditor.dragLastX = clientX;
            poseEditor.dragLastY = clientY;
            applyPoseEditorValues(values);
        }

        function initPoseEditor() {
            ensurePoseEditorHandles();
            const uiLayer = document.getElementById('ui-layer');
            if (!uiLayer) return;
            const panel = document.createElement('div');
            panel.id = 'pose-editor-panel';
            panel.className = 'hidden absolute top-24 right-4 z-[240] pointer-events-auto bg-[#111418]/95 border border-[#3a444c] rounded p-2 w-64 text-[10px] text-gray-100';
            panel.innerHTML = '<div class="font-bold text-[#c8aa6e] mb-1">Pose Editor (F8)</div>' +
                '<div class="text-gray-400 mb-1">Translate or rotate pivots.</div>' +
                '<div class="flex gap-1 mb-1">' +
                    '<select id="pose-editor-mode" class="flex-1 bg-black/60 border border-[#3a444c] text-gray-100 p-1">' +
                        '<option value="translate">Translate</option>' +
                        '<option value="rotate">Rotate (Locked Pivot)</option>' +
                    '</select>' +
                    '<select id="pose-editor-axis" class="w-16 bg-black/60 border border-[#3a444c] text-gray-100 p-1">' +
                        '<option value="x">X</option>' +
                        '<option value="y">Y</option>' +
                        '<option value="z">Z</option>' +
                    '</select>' +
                '</div>' +
                '<textarea id="pose-editor-json" class="w-full h-28 bg-black/60 border border-[#3a444c] text-[10px] text-gray-100 p-1 font-mono" readonly></textarea>' +
                '<div class="mt-2 flex gap-1">' +
                    '<button id="pose-editor-copy" class="flex-1 bg-[#2a3138] hover:bg-[#3a444c] border border-[#c8aa6e] text-[#c8aa6e] px-2 py-1 rounded">Copy</button>' +
                    '<button id="pose-editor-save" class="flex-1 bg-[#2a3138] hover:bg-[#3a444c] border border-[#c8aa6e] text-[#c8aa6e] px-2 py-1 rounded">Save</button>' +
                    '<button id="pose-editor-reset" class="flex-1 bg-[#2a3138] hover:bg-[#3a444c] border border-[#c8aa6e] text-[#c8aa6e] px-2 py-1 rounded">Reset</button>' +
                '</div>';
            uiLayer.appendChild(panel);
            poseEditor.panel = panel;
            poseEditor.text = panel.querySelector('#pose-editor-json');
            poseEditor.modeSelect = panel.querySelector('#pose-editor-mode');
            poseEditor.axisSelect = panel.querySelector('#pose-editor-axis');
            if (poseEditor.modeSelect) poseEditor.modeSelect.value = poseEditor.mode;
            if (poseEditor.axisSelect) poseEditor.axisSelect.value = poseEditor.rotationAxis;
            if (poseEditor.modeSelect) poseEditor.modeSelect.addEventListener('change', () => { poseEditor.mode = poseEditor.modeSelect.value === 'rotate' ? 'rotate' : 'translate'; });
            if (poseEditor.axisSelect) poseEditor.axisSelect.addEventListener('change', () => { poseEditor.rotationAxis = poseEditor.axisSelect.value === 'y' || poseEditor.axisSelect.value === 'z' ? poseEditor.axisSelect.value : 'x'; });

            const savedRaw = localStorage.getItem('poseEditor.v1');
            let startValues = getPoseEditorDefaultValues();
            if (savedRaw) {
                try {
                    const parsed = JSON.parse(savedRaw);
                    if (parsed && parsed.shoulder && parsed.elbow) startValues = parsed;
                } catch (err) {
                    console.warn('Invalid poseEditor.v1 payload', err);
                }
            }
            applyPoseEditorValues(startValues);

            panel.querySelector('#pose-editor-copy').addEventListener('click', async () => {
                if (!poseEditor.values) return;
                const text = JSON.stringify(poseEditor.values, null, 2);
                try { await navigator.clipboard.writeText(text); } catch (err) { console.warn('Clipboard copy failed', err); }
            });
            panel.querySelector('#pose-editor-save').addEventListener('click', () => {
                if (!poseEditor.values) return;
                localStorage.setItem('poseEditor.v1', JSON.stringify(poseEditor.values));
            });
            panel.querySelector('#pose-editor-reset').addEventListener('click', () => {
                localStorage.removeItem('poseEditor.v1');
                applyPoseEditorValues(getPoseEditorDefaultValues());
            });

            window.addEventListener('keydown', (e) => {
                if (e.key === 'F8') {
                    e.preventDefault();
                    togglePoseEditor(!poseEditor.enabled);
                    return;
                }
                if (!poseEditor.enabled) return;
                if (e.key === 'r' || e.key === 'R') {
                    e.preventDefault();
                    poseEditor.mode = poseEditor.mode === 'rotate' ? 'translate' : 'rotate';
                    if (poseEditor.modeSelect) poseEditor.modeSelect.value = poseEditor.mode;
                }
            });
        }
        const SHADOW_FOCUS_TILE_EPSILON = 0.25;
        const SHADOW_FOCUS_HEIGHT_EPSILON = 0.15;
        const SHADOW_FOCUS_UPDATE_INTERVAL_MS = 120;
        let lastShadowFocusUpdateMs = 0;
        let lastShadowFocusX = null;
        let lastShadowFocusY = null;
        let lastShadowFocusZ = null;
        let lastShadowFocusFreeCam = null;
        let lastShadowFocusPlane = null;
        let lastShadowFocusRevision = -1;

        function maybeUpdateMainDirectionalShadowFocus(focusX, focusY, focusZ, frameNowMs) {
            if (typeof window.updateMainDirectionalShadowFocus !== 'function') return;
            const shadowFocusRevision = (sharedMaterials && Number.isFinite(sharedMaterials.shadowFocusRevision))
                ? Math.floor(sharedMaterials.shadowFocusRevision)
                : 0;
            const forceUpdate = lastShadowFocusRevision !== shadowFocusRevision
                || lastShadowFocusFreeCam !== !!isFreeCam
                || lastShadowFocusPlane !== playerState.z;
            const deltaX = Number.isFinite(lastShadowFocusX) ? Math.abs(focusX - lastShadowFocusX) : Infinity;
            const deltaY = Number.isFinite(lastShadowFocusY) ? Math.abs(focusY - lastShadowFocusY) : Infinity;
            const deltaZ = Number.isFinite(lastShadowFocusZ) ? Math.abs(focusZ - lastShadowFocusZ) : Infinity;
            const intervalElapsed = !Number.isFinite(lastShadowFocusUpdateMs)
                || (frameNowMs - lastShadowFocusUpdateMs) >= SHADOW_FOCUS_UPDATE_INTERVAL_MS;
            if (
                !forceUpdate
                && deltaX < SHADOW_FOCUS_TILE_EPSILON
                && deltaZ < SHADOW_FOCUS_TILE_EPSILON
                && deltaY < SHADOW_FOCUS_HEIGHT_EPSILON
                && !intervalElapsed
            ) {
                return;
            }

            window.updateMainDirectionalShadowFocus(focusX, focusY, focusZ);
            lastShadowFocusUpdateMs = frameNowMs;
            lastShadowFocusX = focusX;
            lastShadowFocusY = focusY;
            lastShadowFocusZ = focusZ;
            lastShadowFocusFreeCam = !!isFreeCam;
            lastShadowFocusPlane = playerState.z;
            lastShadowFocusRevision = shadowFocusRevision;
        }

        function animate(nowMs) {
            requestAnimationFrame(animate);
            const frameNowMs = nowMs || performance.now();
            if (frameNowMs - frameLimiterPrev < FRAME_INTERVAL_MS) return;
            frameLimiterPrev = frameNowMs - ((frameNowMs - frameLimiterPrev) % FRAME_INTERVAL_MS);

            fpsSampleFrames += 1;
            if (frameNowMs - fpsSampleLast >= 1000) {
                const fps = Math.round((fpsSampleFrames * 1000) / (frameNowMs - fpsSampleLast));
                const fpsEl = document.getElementById('fps-value');
                if (fpsEl) fpsEl.innerText = fps;
                if (typeof window.reportChunkPerformanceSample === 'function') {
                    window.reportChunkPerformanceSample(fps, frameNowMs);
                }
                fpsSampleFrames = 0;
                fpsSampleLast = frameNowMs;
            }

            const frameNow = Date.now();
            
            const hasPlayerRig = !!(typeof playerRig !== 'undefined' && playerRig && playerRig.position);
            if (hasPlayerRig && typeof window.manageChunks === 'function') window.manageChunks();
            if (lastVisibleChunkPlaneZ !== playerState.z && typeof window.setLoadedChunkPlaneVisibility === 'function') {
                window.setLoadedChunkPlaneVisibility(playerState.z);
                lastVisibleChunkPlaneZ = playerState.z;
            }
            if (hasPlayerRig && typeof window.processPendingNearChunkBuilds === 'function') window.processPendingNearChunkBuilds(1);
            if (hasPlayerRig) updatePoseEditorHandles();
            if (typeof window.updateFires === 'function') window.updateFires(frameNow);
            if (typeof updateMiningPoseReferences === 'function') updateMiningPoseReferences(frameNowMs);

            if (Array.isArray(sharedMaterials.waterAnimatedMaterials)) {
                sharedMaterials.waterAnimatedMaterials.forEach((material) => {
                    if (!material || !material.uniforms || !material.uniforms.uTime) return;
                    material.uniforms.uTime.value = frameNowMs * 0.001;
                });
            }

            // Handle Door Animations
            doorsToRender.forEach(d => {
                if (d.meshGroup) {
                    const diff = d.targetRotation - d.currentRotation;
                    if (Math.abs(diff) > 0.01) {
                        d.currentRotation += diff * 0.15; // Smooth interpolation
                        d.meshGroup.rotation.y = d.currentRotation;
                    } else if (diff !== 0) {
                        d.currentRotation = d.targetRotation;
                        d.meshGroup.rotation.y = d.currentRotation;
                    }
                }
            });

            if (typeof window.updateCombatRenderers === 'function') window.updateCombatRenderers(frameNow);

            const runPhase = (frameNow % 600) / 600 * Math.PI * 2; const absSinRun = Math.abs(Math.sin(runPhase));
            const walkPhase = (frameNow % TICK_RATE_MS) / TICK_RATE_MS * Math.PI * 2;
            const sinWalkRaw = Math.sin(walkPhase);
            const sinWalk = Math.sign(sinWalkRaw) * Math.pow(Math.abs(sinWalkRaw), 0.65);
            const absSinWalk = Math.abs(sinWalkRaw);
            const idlePhase = (frameNow % (TICK_RATE_MS * 3)) / (TICK_RATE_MS * 3) * Math.PI * 2;
            const idlePulse = Math.sin(idlePhase);
            let progress = Math.min((frameNow - lastTickTime) / TICK_RATE_MS, 1.0);
            
            let currentVisualX = playerState.x; let currentVisualY = playerState.y;
            let isMoving = playerState.x !== playerState.prevX || playerState.y !== playerState.prevY;
            
            const prevH = getVisualHeight(playerState.prevX, playerState.prevY, playerState.z);
            const currentH = getVisualHeight(playerState.x, playerState.y, playerState.z); 
            const midH = playerState.midX !== null ? getVisualHeight(playerState.midX, playerState.midY, playerState.z) : prevH;
            
            let baseVisualY = prevH;

            if (isMoving) {
                if (playerState.midX !== null && playerState.midY !== null) {
                    if (progress < 0.5) {
                        let p2 = progress * 2.0; 
                        currentVisualX = playerState.prevX + (playerState.midX - playerState.prevX) * p2; 
                        currentVisualY = playerState.prevY + (playerState.midY - playerState.prevY) * p2;
                        baseVisualY = prevH + (midH - prevH) * p2; 
                        const dx = playerState.midX - playerState.prevX; const dy = playerState.midY - playerState.prevY; 
                        if ((dx !== 0 || dy !== 0) && !playerState.turnLock) playerState.targetRotation = Math.atan2(dx, dy);
                    } else {
                        let p2 = (progress - 0.5) * 2.0; 
                        currentVisualX = playerState.midX + (playerState.x - playerState.midX) * p2; 
                        currentVisualY = playerState.midY + (playerState.y - playerState.midY) * p2;
                        baseVisualY = midH + (currentH - midH) * p2; 
                        const dx = playerState.x - playerState.midX; const dy = playerState.y - playerState.midY; 
                        if ((dx !== 0 || dy !== 0) && !playerState.turnLock) playerState.targetRotation = Math.atan2(dx, dy);
                    }
                } else {
                    currentVisualX = playerState.prevX + (playerState.x - playerState.prevX) * progress; 
                    currentVisualY = playerState.prevY + (playerState.y - playerState.prevY) * progress;
                    baseVisualY = prevH + (currentH - prevH) * progress; 
                    const dx = playerState.x - playerState.prevX; const dy = playerState.y - playerState.prevY; 
                    if ((dx !== 0 || dy !== 0) && !playerState.turnLock) playerState.targetRotation = Math.atan2(dx, dy);
                }
            } else baseVisualY = getVisualHeight(playerState.x, playerState.y, playerState.z);
            
            if (!hasPlayerRig) {
                updateCombatAnimationDebugPanel(null, null, frameNow);
                if (typeof window.updateSkyRuntime === 'function') window.updateSkyRuntime(camera.position, frameNowMs);
                renderer.render(scene, camera);
                if (typeof window.updateCombatEnemyOverlays === 'function') window.updateCombatEnemyOverlays();
                return;
            }
            playerRig.position.set(currentVisualX, baseVisualY, currentVisualY);
            
            if (minimapLocked && !isFreeCam) { minimapTargetX = currentVisualX; minimapTargetY = currentVisualY; }
            const rig = playerRig && playerRig.userData ? playerRig.userData.rig : null;
            if (!rig) {
                updateCombatAnimationDebugPanel(null, playerRig, frameNow);
                const shadowFocus = isFreeCam ? freeCamTarget : playerRig.position;
                maybeUpdateMainDirectionalShadowFocus(shadowFocus.x, baseVisualY, shadowFocus.z, frameNowMs);
                if (typeof window.updateSkyRuntime === 'function') window.updateSkyRuntime(camera.position, frameNowMs);
                renderer.render(scene, camera);
                if (typeof window.updateCombatEnemyOverlays === 'function') window.updateCombatEnemyOverlays();
                return;
            }
            let rotationDiff = 0;
            if (playerState.targetRotation !== undefined) {
                let diff = playerState.targetRotation - playerRig.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                rotationDiff = diff;
                const turnLerp = playerState.turnLock ? 0.75 : 0.3;
                playerRig.rotation.y += diff * turnLerp;
            }

            if (playerState.turnLock && Math.abs(rotationDiff) < 0.03) {
                playerRig.rotation.y = playerState.targetRotation;
                playerState.turnLock = false;
                playerState.actionVisualReady = true;

                if (playerState.pendingActionAfterTurn) {
                    playerState.action = playerState.pendingActionAfterTurn;
                    playerState.pendingActionAfterTurn = null;
                }
            }
            
            rig.leftArm.scale.set(1, 1, 1);
            rig.rightArm.scale.set(1, 1, 1);
            rig.leftLowerArm.scale.set(1, 1, 1);
            rig.rightLowerArm.scale.set(1, 1, 1);
            if (rig.torso) rig.torso.scale.set(1, 1, 1);
            if (rig.head) rig.head.scale.set(1, 1, 1);
            if (rig.leftLeg) rig.leftLeg.scale.set(1, 1, 1);
            if (rig.rightLeg) rig.rightLeg.scale.set(1, 1, 1);
            if (rig.leftLowerLeg) rig.leftLowerLeg.scale.set(1, 1, 1);
            if (rig.rightLowerLeg) rig.rightLowerLeg.scale.set(1, 1, 1);
            rig.leftLeg.position.set(0.14, 0.7, 0); rig.rightLeg.position.set(-0.14, 0.7, 0);
            if (rig.torso) {
                if (!rig.torso.userData) rig.torso.userData = {};
                if (!rig.torso.userData.defaultPos) rig.torso.userData.defaultPos = rig.torso.position.clone();
                rig.torso.position.copy(rig.torso.userData.defaultPos);
            }
            if (rig.head) {
                if (!rig.head.userData) rig.head.userData = {};
                if (!rig.head.userData.defaultPos) rig.head.userData.defaultPos = rig.head.position.clone();
                rig.head.position.copy(rig.head.userData.defaultPos);
            }
            if (rig.leftLowerLeg) rig.leftLowerLeg.position.set(0, -0.35, 0);
            if (rig.rightLowerLeg) rig.rightLowerLeg.position.set(0, -0.35, 0);
            const logicalTilesMoved = Math.max(Math.abs(playerState.x - playerState.prevX), Math.abs(playerState.y - playerState.prevY));
            const skillAnimationHandled = !isMoving && window.SkillRuntime && SkillRuntime.handleSkillAnimation({
                rig,
                frameNow,
                baseVisualY,
                playerRig,
                equipment,
                setShoulderPivot: setPlayerRigShoulderPivot,
                shoulderPivot: getPlayerRigShoulderPivot(rig),
                applyRockMiningPose
            });
            const clipAnimationHandled = !skillAnimationHandled && applyClipDrivenPlayerAnimation(rig, playerRig, frameNow, isMoving, logicalTilesMoved);
            if (!skillAnimationHandled && !clipAnimationHandled) {
                if (isMoving) {
                    rig.axe.visible = !!equipment.weapon; rig.axe.rotation.set(0, 0, 0); 
                    setPlayerRigShoulderPivot(rig);
                    rig.leftArm.rotation.set(0,0,0); rig.rightArm.rotation.set(0,0,0); rig.leftLowerArm.rotation.set(0,0,0); rig.rightLowerArm.rotation.set(0,0,0); rig.torso.rotation.set(0,0,0); rig.head.rotation.set(0,0,0); if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
                    if (logicalTilesMoved > 1 || (isRunning && logicalTilesMoved > 0)) {
                        const lean = 0.15; const bounce = absSinRun * MOTION_TUNING.runBounce;
                        rig.leftArm.rotation.x = Math.sin(runPhase) * MOTION_TUNING.runArmSwing; rig.rightArm.rotation.x = -Math.sin(runPhase) * MOTION_TUNING.runArmSwing;
                        rig.leftLowerArm.rotation.x = -1.3; rig.rightLowerArm.rotation.x = -1.3;
                        const runStep = Math.sin(runPhase); rig.leftLeg.rotation.x = -runStep * MOTION_TUNING.runLegSwing; rig.rightLeg.rotation.x = runStep * MOTION_TUNING.runLegSwing; if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = Math.max(0, runStep) * MOTION_TUNING.runKneeLift; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = Math.max(0, -runStep) * MOTION_TUNING.runKneeLift;
                        playerRig.position.y = baseVisualY + bounce; playerRig.rotation.x = lean; rig.head.rotation.x = -lean;
                    } else {
                        rig.leftArm.rotation.x = sinWalk * MOTION_TUNING.walkArmSwing; rig.rightArm.rotation.x = -sinWalk * MOTION_TUNING.walkArmSwing;
                        rig.leftLowerArm.rotation.x = -0.1; rig.rightLowerArm.rotation.x = -0.1;
                        const walkStep = sinWalk; rig.leftLeg.rotation.x = -walkStep * MOTION_TUNING.walkLegSwing; rig.rightLeg.rotation.x = walkStep * MOTION_TUNING.walkLegSwing; if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = Math.max(0, walkStep) * MOTION_TUNING.walkKneeLift; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = Math.max(0, -walkStep) * MOTION_TUNING.walkKneeLift;
                        playerRig.position.y = baseVisualY + (absSinWalk * MOTION_TUNING.walkBounce); rig.torso.rotation.x = -0.1; rig.head.rotation.x = -0.1; playerRig.rotation.x = 0;
                    }
                } else if (playerState.action === 'COMBAT: MELEE') {
                    if (!playerState.actionVisualReady) {
                        rig.axe.visible = !!equipment.weapon;
                        setPlayerRigShoulderPivot(rig);
                        rig.leftArm.rotation.set(0, 0, 0); rig.rightArm.rotation.set(0, 0, 0);
                        rig.leftLowerArm.rotation.set(0, 0, 0); rig.rightLowerArm.rotation.set(0, 0, 0);
                        rig.torso.rotation.set(0, 0, 0); rig.head.rotation.set(0, 0, 0);
                        rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0; if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0; playerRig.position.y = baseVisualY;
                    } else {
                    rig.axe.visible = !!equipment.weapon; playerRig.rotation.x = 0;
                    rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0; if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0; playerRig.position.y = baseVisualY;
                    applyPlayerCombatPose(rig, getPlayerCombatNeutralPose(rig));
                    playerRig.position.y = baseVisualY + applyPlayerSlashCombatPose(rig, frameNow);
                    }
                } else {
                    rig.axe.visible = !!equipment.weapon; rig.axe.rotation.set(0, 0, 0);
                    setPlayerRigShoulderPivot(rig);
                    rig.leftArm.rotation.set(idlePulse * 0.05, 0, 0); rig.leftLowerArm.rotation.set(-0.03, 0, 0);
                    rig.rightArm.rotation.set(-idlePulse * 0.05, 0, 0); rig.rightLowerArm.rotation.set(-0.03, 0, 0);
                    rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0; if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
                    playerRig.position.y = baseVisualY + (Math.abs(idlePulse) * MOTION_TUNING.idleBounce);
                    rig.torso.rotation.set(-0.03, 0, 0); rig.head.rotation.set(-0.02 + (idlePulse * 0.02), 0, 0); playerRig.rotation.x = 0;
                }
            }
            if (skillAnimationHandled || !clipAnimationHandled) {
                applyPlayerHitRecoilOverlay(rig, playerRig, frameNow);
            }
            updateCombatAnimationDebugPanel(rig, playerRig, frameNow);
            
            for (let i = clickMarkers.length - 1; i >= 0; i--) {
                const marker = clickMarkers[i]; const age = frameNow - marker.createdAt;
                if (age > 400) { scene.remove(marker.mesh); clickMarkers.splice(i, 1); }
                else { const scale = 1 - (age / 400); marker.mesh.scale.set(scale, scale, scale); marker.mesh.quaternion.copy(camera.quaternion); }
            }
            
            for (let i = activeHitsplats.length - 1; i >= 0; i--) {
                const hs = activeHitsplats[i];
                const age = frameNow - hs.createdAt;
                if (age > 1200) {
                    hs.el.remove();
                    activeHitsplats.splice(i, 1);
                } else {
                    const pos = hs.worldPos.clone();
                    pos.y += (age / 1200) * 0.8; 
                    pos.project(camera);
                    
                    if (pos.z < 1) { 
                        const x = (pos.x * .5 + .5) * window.innerWidth;
                        const y = (pos.y * -.5 + .5) * window.innerHeight;
                        hs.el.style.left = (x - 14) + 'px';
                        hs.el.style.top = (y - 14) + 'px';
                        hs.el.style.opacity = Math.max(0, 1 - (age / 1200));
                        hs.el.style.display = 'block';
                    } else {
                        hs.el.style.display = 'none';
                    }
                }
            }

            for (let i = levelUpAnimations.length - 1; i >= 0; i--) {
                const anim = levelUpAnimations[i]; const age = frameNow - anim.start; const lifeTime = 1500; 
                if (age > lifeTime) { scene.remove(anim.mesh); levelUpAnimations.splice(i, 1); continue; } 
                if (anim.target) anim.mesh.position.copy(anim.target.position);
                const t = age / lifeTime; 
                if (anim.type === 8) { 
                    anim.mesh.children.forEach((orb, index) => {
                        const strandIdx = index % 20; const t2 = Math.max(0, t - strandIdx * 0.04); const angle = orb.userData.angleOffset + orb.userData.dir * t2 * Math.PI * 5; 
                        orb.position.set(Math.cos(angle) * 1.2, t2 * 4, Math.sin(angle) * 1.2);
                        orb.material.opacity = t2 > 0 ? (1 - t) * (1 - strandIdx/20) : 0; orb.material.transparent = true;
                        if(t2 === 0) orb.scale.set(0,0,0); else orb.scale.set(1,1,1);
                    });
                } 
            }

            if (keys.arrowleft) cameraYaw += 0.03;
            if (keys.arrowright) cameraYaw -= 0.03;
            if (keys.arrowup) cameraPitch = Math.max(0.1, cameraPitch - 0.03);
            if (keys.arrowdown) cameraPitch = Math.min(Math.PI - 0.1, cameraPitch + 0.03);

            if (isFreeCam) {
                const speed = isRunning ? 0.3 : 0.1;
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
                forward.y = 0; forward.normalize(); right.y = 0; right.normalize();
                if (keys.w) freeCamTarget.addScaledVector(forward, speed); if (keys.s) freeCamTarget.addScaledVector(forward, -speed);
                if (keys.a) freeCamTarget.addScaledVector(right, -speed); if (keys.d) freeCamTarget.addScaledVector(right, speed);
                if (keys.e) freeCamTarget.y += speed; if (keys.q) freeCamTarget.y -= speed;

                const targetGround = getGroundHeightAtWorldPos(freeCamTarget.x, freeCamTarget.z);
                freeCamTarget.y = Math.max(freeCamTarget.y, targetGround + 0.7);

                const nextCamX = freeCamTarget.x + cameraDist * Math.cos(cameraYaw) * Math.sin(cameraPitch);
                const nextCamZ = freeCamTarget.z + cameraDist * Math.sin(cameraYaw) * Math.sin(cameraPitch);
                const nextCamGround = getGroundHeightAtWorldPos(nextCamX, nextCamZ);
                const nextCamY = Math.max(
                    freeCamTarget.y + cameraDist * Math.cos(cameraPitch),
                    nextCamGround + 0.3
                );

                camera.position.x = nextCamX;
                camera.position.y = nextCamY;
                camera.position.z = nextCamZ;
                camera.lookAt(freeCamTarget);
            } else {
                const camBobOffset = playerRig.position.y - baseVisualY;
                const cameraFollowY = baseVisualY + (camBobOffset * MOTION_TUNING.cameraFollowY);
                camera.position.x = playerRig.position.x + cameraDist * Math.cos(cameraYaw) * Math.sin(cameraPitch);
                camera.position.y = cameraFollowY + 1.0 + cameraDist * Math.cos(cameraPitch);
                camera.position.z = playerRig.position.z + cameraDist * Math.sin(cameraYaw) * Math.sin(cameraPitch);
                const followCamGround = getGroundHeightAtWorldPos(camera.position.x, camera.position.z, playerState.z);
                camera.position.y = Math.max(camera.position.y, followCamGround + 0.3);
                const lookTarget = new THREE.Vector3(playerRig.position.x, cameraFollowY + 1.0, playerRig.position.z);
                camera.lookAt(lookTarget);
            }
            const shadowFocus = isFreeCam ? freeCamTarget : playerRig.position;
            const shadowFocusY = isFreeCam ? freeCamTarget.y : baseVisualY;
            maybeUpdateMainDirectionalShadowFocus(shadowFocus.x, shadowFocusY, shadowFocus.z, frameNowMs);
            if (typeof window.updateSkyRuntime === 'function') window.updateSkyRuntime(camera.position, frameNowMs);
            renderer.render(scene, camera); updateMinimap(frameNowMs);
            if (typeof window.updateCombatEnemyOverlays === 'function') window.updateCombatEnemyOverlays();
            if (uiPlayerRig && !document.getElementById('view-equip').classList.contains('hidden')) uiRenderer.render(uiScene, uiCamera);
            
            updatePlayerOverheadText();
            updateHoverTooltip();
        }








































































        window.initPoseEditor = initPoseEditor;


















































