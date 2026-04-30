function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25)); renderer.setSize(window.innerWidth, window.innerHeight); }
        function getInputPoseEditorRuntime() {
            return window.InputPoseEditorRuntime || null;
        }
        function getInputStationInteractionRuntime() {
            return window.InputStationInteractionRuntime || null;
        }
        function getInputHoverTooltipRuntime() {
            return window.InputHoverTooltipRuntime || null;
        }
        function getInputQaCameraRuntime() {
            return window.InputQaCameraRuntime || null;
        }
        function getInputPlayerAnimationRuntime() {
            return window.InputPlayerAnimationRuntime || null;
        }
        function getInputPathfindingRuntime() {
            return window.InputPathfindingRuntime || null;
        }
        function getInputRaycastRuntime() {
            return window.InputRaycastRuntime || null;
        }
        function getInputTickMovementRuntime() {
            return window.InputTickMovementRuntime || null;
        }
        function getInputArrivalInteractionRuntime() {
            return window.InputArrivalInteractionRuntime || null;
        }
        const inputPoseEditorRuntime = getInputPoseEditorRuntime();
        const poseEditor = inputPoseEditorRuntime && typeof inputPoseEditorRuntime.createPoseEditorState === 'function'
            ? inputPoseEditorRuntime.createPoseEditorState({ THREERef: THREE })
            : { enabled: false, handleMap: {}, activeHandle: null };
        const LEGACY_PATHFIND_MAP_SIZE = 486;
        const PATHFIND_MAX_ITERATIONS = Math.max(
            25000,
            Math.floor(25000 * Math.pow((MAP_SIZE / LEGACY_PATHFIND_MAP_SIZE), 2))
        );
        // In open terrain, BFS iteration budget approximates a Chebyshev radius. Keep tooltip range slightly under that.
        const MAX_PATHFIND_OPEN_AREA_RADIUS_TILES = Math.floor((Math.sqrt(PATHFIND_MAX_ITERATIONS + 1) - 1) / 2);
        const MAX_TOOLTIP_WALK_DISTANCE_TILES = 90;
        function getInputControllerRuntime() {
            return window.InputControllerRuntime || null;
        }

        function getAnimationRuntimeBridge() {
            return window.AnimationRuntimeBridge || null;
        }

        function isAnimationStudioActive() {
            const bridge = window.AnimationStudioBridge || null;
            return !!(bridge
                && typeof bridge.isStudioActive === 'function'
                && bridge.isStudioActive());
        }

        function buildInputControllerContext() {
            const inputControllerRuntime = getInputControllerRuntime();
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
            const inputControllerRuntime = getInputControllerRuntime();
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
            const inputControllerRuntime = getInputControllerRuntime();
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
            const inputControllerRuntime = getInputControllerRuntime();
            const decision = inputControllerRuntime && typeof inputControllerRuntime.resolvePointerUp === 'function'
                ? inputControllerRuntime.resolvePointerUp(buildInputControllerContext(), {
                    button: event.button
                })
                : null;

            if ((decision && decision.endPoseEditorDrag) || (event.button === 0 && poseEditor.activeHandle)) {
                const runtime = getInputPoseEditorRuntime();
                if (runtime && typeof runtime.endPoseEditorDrag === 'function') {
                    runtime.endPoseEditorDrag(poseEditor);
                } else {
                    poseEditor.activeHandle = null;
                }
                return;
            }
            if ((decision && decision.endCameraDrag) || event.button === 1 || (isFreeCam && event.button === 0)) isDraggingCamera = false;
        }
        
        function onMouseWheel(event) { 
            if (isAnimationStudioActive()) return;
            event.preventDefault(); 
            const inputControllerRuntime = getInputControllerRuntime();
            cameraDist = inputControllerRuntime && typeof inputControllerRuntime.resolveMouseWheelCameraDistance === 'function'
                ? inputControllerRuntime.resolveMouseWheelCameraDistance(cameraDist, event.deltaY)
                : Math.max(5, Math.min(30, cameraDist + (Math.sign(event.deltaY) * 1.5))); 

        }

        function normalizeContextMenuOptions(options) {
            const inputControllerRuntime = getInputControllerRuntime();
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
                formatEnemyDisplayName: (enemyHitData = hitData) => formatEnemyDisplayName(enemyHitData),
                combatLevel: getEnemyCombatLevel(hitData),
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
            const inputControllerRuntime = getInputControllerRuntime();
            if (inputControllerRuntime && typeof inputControllerRuntime.shouldIgnoreContextMenu === 'function') {
                if (inputControllerRuntime.shouldIgnoreContextMenu(isFreeCam, event.target && event.target.id)) return;
            } else {
                if (isFreeCam) return; if (event.target.id === 'minimap' || event.target.id === 'runToggleBtn') return;
            }
            event.preventDefault(); closeContextMenu();
            const hitResults = getRaycastHits(event.clientX, event.clientY);
            if (!hitResults || hitResults.length === 0) return;
            clearContextMenuOptions();
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

            const bankerHit = hitResults.find((entry) => entry && entry.type === 'NPC' && entry.name === 'Banker');
            if (bankerHit && window.appendSwapLeftClickControl && window.getItemMenuPreferenceKey) {
                const bankerUid = bankerHit.uid && typeof bankerHit.uid === 'object' ? bankerHit.uid : null;
                const prefKey = window.getItemMenuPreferenceKey('npc', (bankerUid && (bankerUid.spawnId || bankerUid.merchantId || bankerUid.name)) || 'Banker');
                window.appendSwapLeftClickControl(prefKey, ['Talk-to', 'Bank'], () => {});
            }

            const walkHit = hitResults[hitResults.length - 1];
            addContextMenuOption('Walk here', () => { queueAction('WALK', walkHit.gridX, walkHit.gridY, null); spawnClickMarker(walkHit.point, false); });
            showContextMenuAt(event.clientX, event.clientY);
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

        function buildInputRaycastRuntimeContext() {
            return {
                windowRef: window,
                mapSize: MAP_SIZE,
                playerState,
                logicalMap,
                camera,
                mouse,
                raycaster,
                environmentMeshes,
                isWaterTileId,
                isWalkableTileId,
                isPierDeckTile,
                findNearestPierDeckBoardingTile,
                getActivePierConfig,
                isNearPierBoundsTile,
                emitPierDebug,
                isStandableTile
            };
        }

        function getRaycastHits(clientX, clientY, maxHits = 16) {
            const runtime = getInputRaycastRuntime();
            return runtime && typeof runtime.getRaycastHits === 'function'
                ? runtime.getRaycastHits(buildInputRaycastRuntimeContext(), clientX, clientY, maxHits)
                : [];
        }

        function getRaycastHit(clientX, clientY) {
            const runtime = getInputRaycastRuntime();
            return runtime && typeof runtime.getRaycastHit === 'function'
                ? runtime.getRaycastHit(buildInputRaycastRuntimeContext(), clientX, clientY)
                : null;
        }

        window.listQaRaycastHitsAt = function listQaRaycastHitsAt(clientX, clientY, maxHits = 12) {
            const runtime = getInputRaycastRuntime();
            return runtime && typeof runtime.listQaRaycastHitsAt === 'function'
                ? runtime.listQaRaycastHitsAt(buildInputRaycastRuntimeContext(), clientX, clientY, maxHits)
                : [];
        };

        window.findQaRaycastHitNear = function findQaRaycastHitNear(clientX, clientY, type, name = '', radius = 80, step = 8) {
            const runtime = getInputRaycastRuntime();
            return runtime && typeof runtime.findQaRaycastHitNear === 'function'
                ? runtime.findQaRaycastHitNear(buildInputRaycastRuntimeContext(), clientX, clientY, type, name, radius, step)
                : null;
        };

        
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
                if (candidateY === stairDeckY) continue;
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
            if (typeof window.isTutorialWalkTileAllowed === 'function' && !window.isTutorialWalkTileAllowed(x, y, z)) return false;
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
        function buildStationInteractionRuntimeOptions() {
            return {
                furnacesToRender,
                anvilsToRender
            };
        }

        function getStationInteractionFacingStep(targetObj, tx, ty, px = playerState.x, py = playerState.y, z = playerState.z) {
            const runtime = getInputStationInteractionRuntime();
            return runtime && typeof runtime.getStationInteractionFacingStep === 'function'
                ? runtime.getStationInteractionFacingStep(buildStationInteractionRuntimeOptions(), targetObj, tx, ty, px, py, z)
                : { dx: 0, dy: 0 };
        }

        function resolveInteractionFacingRotation(targetObj, tx, ty, px = playerState.x, py = playerState.y, z = playerState.z) {
            const runtime = getInputStationInteractionRuntime();
            return runtime && typeof runtime.resolveInteractionFacingRotation === 'function'
                ? runtime.resolveInteractionFacingRotation(buildStationInteractionRuntimeOptions(), targetObj, tx, ty, px, py, z)
                : null;
        }
        window.resolveInteractionFacingRotation = resolveInteractionFacingRotation;

        function getStationApproachPositions(targetObj, tx, ty, z = playerState.z) {
            const runtime = getInputStationInteractionRuntime();
            return runtime && typeof runtime.getStationApproachPositions === 'function'
                ? runtime.getStationApproachPositions(buildStationInteractionRuntimeOptions(), targetObj, tx, ty, z)
                : [];
        }

        function validateStationApproach(targetObj, tx, ty, px, py, z = playerState.z) {
            const runtime = getInputStationInteractionRuntime();
            return runtime && typeof runtime.validateStationApproach === 'function'
                ? runtime.validateStationApproach(buildStationInteractionRuntimeOptions(), targetObj, tx, ty, px, py, z)
                : { ok: true, message: '' };
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
        function clampInputRender01(v) {
            return Math.max(0, Math.min(1, v));
        }
        function getCurrentTickProgress(frameNow) {
            const tickDurationMs = (typeof TICK_RATE_MS === 'number' && Number.isFinite(TICK_RATE_MS) && TICK_RATE_MS > 0)
                ? TICK_RATE_MS
                : 600;
            return clampInputRender01((frameNow - lastTickTime) / tickDurationMs);
        }
        function isTimedAnimationActive(startedAtMs, durationMs, frameNow) {
            if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return false;
            if (!Number.isFinite(durationMs) || durationMs <= 0) return false;
            const age = frameNow - startedAtMs;
            return Number.isFinite(age) && age >= 0 && age < durationMs;
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
        function getActiveSkillBaseClipId() {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.getActiveSkillBaseClipId === 'function'
                ? runtime.getActiveSkillBaseClipId(playerState)
                : null;
        }
        function isAnySkillingAction(actionName) {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.isAnySkillingAction === 'function'
                ? runtime.isAnySkillingAction(actionName)
                : (typeof actionName === 'string' && actionName.startsWith('SKILLING:'));
        }
        function syncPlayerRigSkillingToolVisual(playerRigRef) {
            if (!playerRigRef || !playerRigRef.userData) return;
            const hadSuppressedBaseToolVisual = !!playerRigRef.userData.appliedSuppressBaseToolVisual;
            playerRigRef.userData.suppressBaseToolVisual = false;
            const clearHeldItems = () => {
                if (typeof setPlayerRigToolVisuals === 'function') {
                    setPlayerRigToolVisuals(playerRigRef, null);
                    return;
                }
                if (typeof setPlayerRigToolVisual === 'function') {
                    setPlayerRigToolVisual(playerRigRef, null);
                }
            };
            if (typeof setPlayerRigToolVisuals !== 'function' && typeof setPlayerRigToolVisual !== 'function') return;
            if (isAnySkillingAction(playerState && playerState.action)) return;
            const activeHeldItems = playerRigRef.userData.skillingToolVisuals || null;
            if ((!activeHeldItems || (!activeHeldItems.rightHand && !activeHeldItems.leftHand))
                && !playerRigRef.userData.skillingToolVisualId
                && !hadSuppressedBaseToolVisual) return;
            clearHeldItems();
        }
        function getActiveSkillAnimationHeldItems() {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.getActiveSkillAnimationHeldItems === 'function'
                ? runtime.getActiveSkillAnimationHeldItems(window.SkillRuntime || null)
                : null;
        }
        function getActiveSkillAnimationHeldItemId() {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.getActiveSkillAnimationHeldItemId === 'function'
                ? runtime.getActiveSkillAnimationHeldItemId(window.SkillRuntime || null)
                : null;
        }
        function getActiveSkillAnimationHeldItemSlot() {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.getActiveSkillAnimationHeldItemSlot === 'function'
                ? runtime.getActiveSkillAnimationHeldItemSlot(window.SkillRuntime || null)
                : null;
        }
        function getActiveSkillAnimationSuppressEquipmentVisual() {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.getActiveSkillAnimationSuppressEquipmentVisual === 'function'
                ? runtime.getActiveSkillAnimationSuppressEquipmentVisual(window.SkillRuntime || null)
                : false;
        }
        function shouldShowRigToolVisual(playerRigRef) {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.shouldShowRigToolVisual === 'function'
                ? runtime.shouldShowRigToolVisual({
                    playerRigRef,
                    playerState,
                    equipment,
                    skillRuntime: window.SkillRuntime || null
                })
                : !!(equipment && equipment.weapon);
        }
        function getPlayerBaseClipId(isMoving, logicalTilesMoved) {
            const runtime = getInputPlayerAnimationRuntime();
            return runtime && typeof runtime.getPlayerBaseClipId === 'function'
                ? runtime.getPlayerBaseClipId({
                    isMoving,
                    logicalTilesMoved,
                    isRunning,
                    playerState
                })
                : (isMoving ? 'player/walk' : 'player/idle');
        }
        function updateCombatAnimationDebugPanel(rig, playerRigRef, frameNow) {
            const runtime = window.CombatAnimationDebugPanelRuntime || null;
            if (!runtime || typeof runtime.updateCombatAnimationDebugPanel !== 'function') return;
            runtime.updateCombatAnimationDebugPanel({
                documentRef: document,
                windowRef: window,
                rig,
                playerRigRef,
                frameNow,
                currentTick,
                playerState,
                animationRuntimeBridge: getAnimationRuntimeBridge(),
                isTimedAnimationActive,
                getCombatEnemyAnimationDebugState: (enemyId, resolvedFrameNow) => (
                    typeof window.getCombatEnemyAnimationDebugState === 'function'
                        ? window.getCombatEnemyAnimationDebugState(enemyId, resolvedFrameNow)
                        : null
                )
            });
        }
        function applyClipDrivenPlayerAnimation(rig, playerRigRef, frameNow, isMoving, logicalTilesMoved) {
            const animationRuntimeBridge = getAnimationRuntimeBridge();
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
            const playerAnimationRuntime = getInputPlayerAnimationRuntime();
            const baseClipPolicy = playerAnimationRuntime && typeof playerAnimationRuntime.buildBaseClipOptions === 'function'
                ? playerAnimationRuntime.buildBaseClipOptions({ skillRuntime: window.SkillRuntime || null })
                : {
                    heldItems: getActiveSkillAnimationHeldItems(),
                    heldItemId: getActiveSkillAnimationHeldItemId(),
                    heldItemSlot: getActiveSkillAnimationHeldItemSlot(),
                    suppressEquipmentVisual: getActiveSkillAnimationSuppressEquipmentVisual(),
                    baseClipOptions: undefined
                };
            const activeSkillHeldItems = baseClipPolicy.heldItems || null;
            const activeSkillHeldItemId = baseClipPolicy.heldItemId || null;
            const activeSkillHeldItemSlot = baseClipPolicy.heldItemSlot || null;
            const suppressSkillEquipmentVisual = !!baseClipPolicy.suppressEquipmentVisual;
            if (playerRigRef && playerRigRef.userData) playerRigRef.userData.suppressBaseToolVisual = suppressSkillEquipmentVisual;

            rig.axe.visible = shouldShowRigToolVisual(playerRigRef);
            rig.axe.rotation.set(0, 0, 0);
            setPlayerRigShoulderPivot(rig);
            playerRigRef.rotation.x = 0;
            playerRigRef.rotation.z = 0;

            animationRuntimeBridge.beginLegacyFrame(playerRigRef, rigId);
            animationRuntimeBridge.setLegacyBaseClip(playerRigRef, rigId, getPlayerBaseClipId(isMoving, logicalTilesMoved), frameNow, baseClipPolicy.baseClipOptions);

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

            const fishingStartActionClipRequest = playerAnimationRuntime && typeof playerAnimationRuntime.buildFishingStartActionClipRequest === 'function'
                ? playerAnimationRuntime.buildFishingStartActionClipRequest({
                    playerState,
                    frameNow,
                    heldItems: activeSkillHeldItems,
                    heldItemId: activeSkillHeldItemId,
                    heldItemSlot: activeSkillHeldItemSlot
                })
                : null;
            if (fishingStartActionClipRequest) {
                animationRuntimeBridge.requestLegacyActionClip(
                    playerRigRef,
                    rigId,
                    fishingStartActionClipRequest.clipId,
                    fishingStartActionClipRequest.actionOptions
                );
            }

            animationRuntimeBridge.applyLegacyFrame(playerRigRef, rigId, frameNow);
            return true;
        }
        function resetPlayerRigAnimationState(rig, playerRigRef, baseVisualY, showToolVisual) {
            if (!rig || !playerRigRef) return;
            rig.axe.visible = !!showToolVisual;
            rig.axe.rotation.set(0, 0, 0);
            setPlayerRigShoulderPivot(rig);
            rig.leftArm.rotation.set(0, 0, 0);
            rig.rightArm.rotation.set(0, 0, 0);
            rig.leftLowerArm.rotation.set(0, 0, 0);
            rig.rightLowerArm.rotation.set(0, 0, 0);
            if (rig.torso) rig.torso.rotation.set(0, 0, 0);
            if (rig.head) rig.head.rotation.set(0, 0, 0);
            if (rig.leftLeg) rig.leftLeg.rotation.set(0, 0, 0);
            if (rig.rightLeg) rig.rightLeg.rotation.set(0, 0, 0);
            if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.set(0, 0, 0);
            if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.set(0, 0, 0);
            playerRigRef.rotation.x = 0;
            playerRigRef.rotation.z = 0;
            playerRigRef.position.y = baseVisualY;
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
                    if (window.QuestRuntime && typeof window.QuestRuntime.resolveNpcPrimaryAction === 'function') {
                        targetData.action = window.QuestRuntime.resolveNpcPrimaryAction(targetData);
                    }
                    if (targetData && targetData.name === 'Banker' && window.getItemMenuPreferenceKey && window.getPreferredMenuAction) {
                        const prefKey = window.getItemMenuPreferenceKey('npc', targetData.spawnId || targetData.merchantId || targetData.name);
                        targetData.action = window.getPreferredMenuAction(prefKey, ['Talk-to', 'Bank']) || targetData.action;
                    }
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
            const runtime = window.WorldMapHudRuntime || null;
            if (runtime && typeof runtime.setMinimapDestination === 'function') runtime.setMinimapDestination(gridX, gridY, z);
        }
        function clearMinimapDestination() {
            const runtime = window.WorldMapHudRuntime || null;
            if (runtime && typeof runtime.clearMinimapDestination === 'function') runtime.clearMinimapDestination();
        }
        function clearMinimapDestinationIfReached() {
            const runtime = window.WorldMapHudRuntime || null;
            if (runtime && typeof runtime.clearMinimapDestinationIfReached === 'function') {
                return runtime.clearMinimapDestinationIfReached(playerState);
            }
            return false;
        }
        function buildInputPathfindingRuntimeContext() {
            return {
                mapSize: MAP_SIZE,
                planes: PLANES,
                pathfindMaxIterations: PATHFIND_MAX_ITERATIONS,
                playerState,
                logicalMap,
                heightMap,
                tileIds: TileId,
                isTutorialWalkTileAllowed: (typeof window.isTutorialWalkTileAllowed === 'function') ? window.isTutorialWalkTileAllowed : null,
                getCombatEnemyOccupiedBaseTileId: (typeof window.getCombatEnemyOccupiedBaseTileId === 'function') ? window.getCombatEnemyOccupiedBaseTileId : null,
                isWalkableTileId,
                isWaterTileId,
                getStationApproachPositions,
                isPierProtectedWaterTile,
                isPierDeckTile,
                isPierFishingApproachTile
            };
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

        function getEnemyCombatLevel(hitData) {
            return hitData && Number.isFinite(hitData.combatLevel)
                ? Math.max(1, Math.floor(hitData.combatLevel))
                : null;
        }

        function formatEnemyDisplayName(hitData) {
            const baseName = (hitData && typeof hitData.name === 'string' && hitData.name.trim())
                ? hitData.name.trim()
                : 'Enemy';
            const combatLevel = getEnemyCombatLevel(hitData);
            if (combatLevel === null) return baseName;
            return `Lv ${combatLevel} ${baseName}`;
        }

        function formatEnemyTooltipDisplayName(hitData) {
            const baseName = (hitData && typeof hitData.name === 'string' && hitData.name.trim())
                ? hitData.name.trim()
                : 'Enemy';
            const combatLevel = getEnemyCombatLevel(hitData);
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

        function getPathTileId(x, y, z = playerState.z, pathOptions = null) {
            const runtime = getInputPathfindingRuntime();
            return runtime && typeof runtime.getPathTileId === 'function'
                ? runtime.getPathTileId(buildInputPathfindingRuntimeContext(), x, y, z, pathOptions)
                : null;
        }

        function isStandableTileForPath(x, y, z = playerState.z, pathOptions = null) {
            const runtime = getInputPathfindingRuntime();
            return !!(runtime && typeof runtime.isStandableTileForPath === 'function'
                && runtime.isStandableTileForPath(buildInputPathfindingRuntimeContext(), x, y, z, pathOptions));
        }

        function findPath(startX, startY, targetX, targetY, forceAdjacent = false, interactionObj = null, pathOptions = null) {
            const runtime = getInputPathfindingRuntime();
            return runtime && typeof runtime.findPath === 'function'
                ? runtime.findPath(buildInputPathfindingRuntimeContext(), startX, startY, targetX, targetY, forceAdjacent, interactionObj, pathOptions)
                : [];
        }
        function buildInputTickMovementRuntimeContext() {
            return {
                windowRef: window,
                playerState,
                logicalMap,
                heightMap,
                isRunning,
                isBankOpen,
                skillRuntime: window.SkillRuntime || null,
                findNearestFishableWaterEdgeTile,
                buildPierStepDescendPath,
                findPath,
                isPierDeckTile,
                isStandableTile,
                isNearPierBoundsTile,
                emitPierDebug,
                clearMinimapDestination,
                hasActiveFletchingProcessingSession,
                lockPlayerCombatTarget: (typeof window.lockPlayerCombatTarget === 'function') ? window.lockPlayerCombatTarget : null,
                closeBank
            };
        }

        function buildInputArrivalInteractionRuntimeContext() {
            return {
                windowRef: window,
                playerState,
                logicalMap,
                heightMap,
                tileId: TileId,
                playerRig,
                skillRuntime: window.SkillRuntime || null,
                addChatMessage: (typeof addChatMessage === 'function') ? addChatMessage : null,
                isWaterTileId,
                isDoorTileId,
                isPierFishingApproachTile,
                isStandableTile,
                validateStationApproach,
                resolveInteractionFacingRotation,
                stopActiveFletchingProcessingSession,
                clearMinimapDestinationIfReached,
                updateMinimapCanvas,
                takeGroundItemByUid: (typeof window.takeGroundItemByUid === 'function') ? window.takeGroundItemByUid : null,
                openShop,
                openBank,
                setActiveBankSource: (typeof window.setActiveBankSource === 'function') ? window.setActiveBankSource : null
            };
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
            if (typeof window.tickTreeLifecycle === 'function') window.tickTreeLifecycle();
            if (typeof window.tickRockNodes === 'function') window.tickRockNodes();
            if (typeof window.updateGroundItems === 'function') window.updateGroundItems();
            if (typeof window.tickFireLifecycle === 'function') window.tickFireLifecycle();

            if (pendingAction) {
                const runtime = getInputTickMovementRuntime();
                pendingAction = runtime && typeof runtime.applyPendingAction === 'function'
                    ? runtime.applyPendingAction(buildInputTickMovementRuntimeContext(), pendingAction)
                    : null;
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
                const runtime = getInputTickMovementRuntime();
                movedThisTick = !!(runtime && typeof runtime.advancePlayerMovement === 'function'
                    && runtime.advancePlayerMovement(buildInputTickMovementRuntimeContext()));
            }
            
            if (playerState.path.length === 0) {
                const runtime = getInputArrivalInteractionRuntime();
                const arrivalResult = runtime && typeof runtime.processArrivalInteractions === 'function'
                    ? runtime.processArrivalInteractions(buildInputArrivalInteractionRuntimeContext(), movedThisTick)
                    : null;
                if (arrivalResult && arrivalResult.shouldReturnEarly) return;
            }

            clearMinimapDestinationIfReached();

            if (playerState.action === 'IDLE' || playerState.action === 'WALKING' || playerState.action === 'WALKING_TO_INTERACT') {
                playerState.turnLock = false;
                playerState.actionVisualReady = true;
                playerState.pendingActionAfterTurn = null;
            }
            
            if (!(window.SkillRuntime && SkillRuntime.handleSkillTick())) {
                // Combat ticks are handled by the dedicated combat runtime.
            }
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
            const runtime = getInputHoverTooltipRuntime();
            if (!runtime || typeof runtime.updateHoverTooltipDisplay !== 'function') return;

            const hoveredElement = document.elementFromPoint(currentMouseX, currentMouseY);
            const shouldHide = isDraggingCamera
                || isFreeCam
                || isBankOpen
                || currentMouseX === 0
                || !!(hoveredElement && hoveredElement.tagName !== 'CANVAS');
            const hitData = shouldHide ? null : getRaycastHit(currentMouseX, currentMouseY);
            const selectedSlot = hitData ? getSelectedUseItem() : null;
            const selectedItem = selectedSlot && selectedSlot.itemData ? selectedSlot.itemData : null;
            const selectedCookable = !!(selectedItem && selectedItem.cookResultId && selectedItem.burnResultId);
            const fireUnderCursor = !!(hitData && Array.isArray(activeFires) && activeFires.some((f) => {
                if (!f || f.z !== playerState.z) return false;
                if (Number.isInteger(hitData.gridX) && Number.isInteger(hitData.gridY) && f.x === hitData.gridX && f.y === hitData.gridY) return true;
                if (!hitData.point) return false;
                return Math.hypot((f.x + 0.5) - hitData.point.x, (f.y + 0.5) - hitData.point.z) <= 1.9;
            }));
            const isAshesGroundItem = !!(hitData && hitData.type === 'GROUND_ITEM' && /^Ashes(?:\s|\(|$)/i.test(hitData.name || ''));
            const isTreeTile = !!(hitData
                && hitData.type === 'TREE'
                && logicalMap[playerState.z]
                && logicalMap[playerState.z][hitData.gridY]
                && logicalMap[playerState.z][hitData.gridY][hitData.gridX] === TileId.TREE);

            runtime.updateHoverTooltipDisplay({
                documentRef: document,
                windowRef: window,
                tooltipId: 'hover-tooltip',
                shouldHide,
                hitData,
                isWithinWalkDistance: hitData ? isHitWithinTooltipWalkDistance(hitData) : false,
                currentMouseX,
                currentMouseY,
                selectedItem,
                selectedCookable,
                fireUnderCursor,
                isAshesGroundItem,
                groundDisplayName: hitData && hitData.type === 'GROUND_ITEM' ? formatGroundItemDisplayName(hitData) : (hitData && hitData.name) || '',
                isTreeTile,
                getSkillTooltip: (target) => (window.SkillRuntime && typeof SkillRuntime.getSkillTooltip === 'function')
                    ? SkillRuntime.getSkillTooltip(target)
                    : '',
                formatEnemyTooltipDisplayName,
                resolveNpcPrimaryAction: (npc) => (window.QuestRuntime && typeof window.QuestRuntime.resolveNpcPrimaryAction === 'function')
                    ? window.QuestRuntime.resolveNpcPrimaryAction(npc)
                    : null,
                getItemMenuPreferenceKey: (typeof window.getItemMenuPreferenceKey === 'function') ? window.getItemMenuPreferenceKey : null,
                getPreferredMenuAction: (typeof window.getPreferredMenuAction === 'function') ? window.getPreferredMenuAction : null
            });
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

        function projectWorldTileToScreen(x, y, z = 0, heightOffset = 1.0) {
            const runtime = getInputQaCameraRuntime();
            return runtime && typeof runtime.projectWorldTileToScreen === 'function'
                ? runtime.projectWorldTileToScreen({
                    THREERef: THREE,
                    windowRef: window,
                    camera,
                    mapSize: MAP_SIZE,
                    planes: PLANES,
                    getVisualHeight
                }, x, y, z, heightOffset)
                : null;
        }

        window.projectWorldTileToScreen = projectWorldTileToScreen;

        function syncQaRenderToPlayerState() {
            const runtime = getInputQaCameraRuntime();
            const snapshot = runtime && typeof runtime.syncQaRenderToPlayerState === 'function'
                ? runtime.syncQaRenderToPlayerState({
                    THREERef: THREE,
                    camera,
                    playerRig,
                    playerState,
                    cameraYaw,
                    cameraPitch,
                    cameraDist,
                    getVisualHeight,
                    getGroundHeightAtWorldPos
                })
                : null;
            if (snapshot && Number.isFinite(snapshot.baseVisualY)) baseVisualY = snapshot.baseVisualY;
            return snapshot
                ? {
                    x: snapshot.x,
                    y: snapshot.y,
                    z: snapshot.z,
                    cameraX: snapshot.cameraX,
                    cameraY: snapshot.cameraY,
                    cameraZ: snapshot.cameraZ
                }
                : null;
        }

        window.syncQaRenderToPlayerState = syncQaRenderToPlayerState;

        window.setQaCameraView = function setQaCameraView(nextYaw, nextPitch = cameraPitch, nextDist = cameraDist) {
            const runtime = getInputQaCameraRuntime();
            const nextState = runtime && typeof runtime.resolveQaCameraViewState === 'function'
                ? runtime.resolveQaCameraViewState({ cameraYaw, cameraPitch, cameraDist, nextYaw, nextPitch, nextDist })
                : { yaw: cameraYaw, pitch: cameraPitch, distance: cameraDist };
            cameraYaw = nextState.yaw;
            cameraPitch = nextState.pitch;
            cameraDist = nextState.distance;
            syncQaRenderToPlayerState();
            return {
                yaw: Number(cameraYaw.toFixed(4)),
                pitch: Number(cameraPitch.toFixed(4)),
                distance: Number(cameraDist.toFixed(2))
            };
        };

        function resetQaCameraView() {
            const runtime = getInputQaCameraRuntime();
            const nextState = runtime && typeof runtime.getDefaultQaCameraViewState === 'function'
                ? runtime.getDefaultQaCameraViewState()
                : { yaw: Math.PI * 1.25, pitch: Math.PI / 3.1, distance: 16 };
            cameraYaw = nextState.yaw;
            cameraPitch = nextState.pitch;
            cameraDist = nextState.distance;
            syncQaRenderToPlayerState();
            return {
                yaw: Number(cameraYaw.toFixed(4)),
                pitch: Number(cameraPitch.toFixed(4)),
                distance: Number(cameraDist.toFixed(2))
            };
        }

        window.resetQaCameraView = resetQaCameraView;

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
        function buildPoseEditorRuntimeOptions(extra = {}) {
            return {
                documentRef: document,
                windowRef: window,
                localStorageRef: localStorage,
                navigatorRef: navigator,
                THREERef: THREE,
                scene,
                camera,
                playerRig,
                uiPlayerRig,
                playerShoulderPivot: PLAYER_SHOULDER_PIVOT,
                ...extra
            };
        }

        function beginPoseEditorDrag(clientX, clientY) {
            const runtime = getInputPoseEditorRuntime();
            return !!(runtime && typeof runtime.beginPoseEditorDrag === 'function'
                && runtime.beginPoseEditorDrag(poseEditor, buildPoseEditorRuntimeOptions({ clientX, clientY })));
        }

        function updatePoseEditorDrag(clientX, clientY) {
            const runtime = getInputPoseEditorRuntime();
            if (runtime && typeof runtime.updatePoseEditorDrag === 'function') {
                runtime.updatePoseEditorDrag(poseEditor, buildPoseEditorRuntimeOptions({ clientX, clientY }));
            }
        }

        function updatePoseEditorHandles() {
            const runtime = getInputPoseEditorRuntime();
            if (runtime && typeof runtime.updatePoseEditorHandles === 'function') {
                runtime.updatePoseEditorHandles(poseEditor, buildPoseEditorRuntimeOptions());
            }
        }

        function initPoseEditor() {
            const runtime = getInputPoseEditorRuntime();
            if (runtime && typeof runtime.initPoseEditor === 'function') {
                runtime.initPoseEditor(poseEditor, buildPoseEditorRuntimeOptions());
            }
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

            if (typeof window.updateTutorialRoofVisibility === 'function') window.updateTutorialRoofVisibility();

            if (typeof window.updateCombatRenderers === 'function') window.updateCombatRenderers(frameNow);

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
                if (typeof window.updateWorldNpcRuntime === 'function') window.updateWorldNpcRuntime(frameNowMs);
                renderer.render(scene, camera);
                if (typeof window.updateCombatEnemyOverlays === 'function') window.updateCombatEnemyOverlays();
                return;
            }
            playerRig.position.set(currentVisualX, baseVisualY, currentVisualY);
            
            if (window.WorldMapHudRuntime && typeof window.WorldMapHudRuntime.syncLockedMinimapTarget === 'function') {
                window.WorldMapHudRuntime.syncLockedMinimapTarget(currentVisualX, currentVisualY, isFreeCam);
            }
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
            syncPlayerRigSkillingToolVisual(playerRig);
            const skillAnimationHandled = !isMoving && window.SkillRuntime && SkillRuntime.handleSkillAnimation({
                rig,
                frameNow,
                baseVisualY,
                playerRig,
                equipment,
                setShoulderPivot: setPlayerRigShoulderPivot,
                shoulderPivot: getPlayerRigShoulderPivot(rig)
            });
            const clipAnimationHandled = !skillAnimationHandled && applyClipDrivenPlayerAnimation(rig, playerRig, frameNow, isMoving, logicalTilesMoved);
            if (!skillAnimationHandled && !clipAnimationHandled) {
                resetPlayerRigAnimationState(rig, playerRig, baseVisualY, shouldShowRigToolVisual(playerRig));
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
            if (typeof window.updateWorldNpcRuntime === 'function') window.updateWorldNpcRuntime(frameNowMs);
            renderer.render(scene, camera); updateMinimap(frameNowMs);
            if (typeof window.updateCombatEnemyOverlays === 'function') window.updateCombatEnemyOverlays();
            if (uiPlayerRig && !document.getElementById('view-equip').classList.contains('hidden')) uiRenderer.render(uiScene, uiCamera);
            
            updatePlayerOverheadText();
            updateHoverTooltip();
        }








































































        window.initPoseEditor = initPoseEditor;


















































