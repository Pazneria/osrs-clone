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

        function onPointerDown(event) {
            if (event.button === 0 && poseEditor.enabled) {
                event.preventDefault();
                closeContextMenu();
                if (beginPoseEditorDrag(event.clientX, event.clientY)) return;
                return;
            }
            if (event.button === 1 || (isFreeCam && event.button === 0)) { 
                event.preventDefault(); isDraggingCamera = true; previousMousePosition = { x: event.clientX, y: event.clientY }; 
            } else if (event.button === 0 && !isFreeCam) { 
                closeContextMenu(); handleInteractionRaycast(event.clientX, event.clientY); 
            }
        }

        function onPointerMove(event) {
            currentMouseX = event.clientX;
            currentMouseY = event.clientY;
            
            if (poseEditor.enabled && poseEditor.activeHandle) {
                updatePoseEditorDrag(event.clientX, event.clientY);
                return;
            }
            
            if (isDraggingCamera) {
                cameraYaw += (event.clientX - previousMousePosition.x) * 0.01; 
                cameraPitch -= (event.clientY - previousMousePosition.y) * 0.01;
                cameraPitch = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPitch)); 
                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        }

        function onPointerUp(event) {
            if (event.button === 0 && poseEditor.activeHandle) {
                poseEditor.activeHandle = null;
                return;
            }
            if (event.button === 1 || (isFreeCam && event.button === 0)) isDraggingCamera = false;
        }
        
        function onMouseWheel(event) { 
            event.preventDefault(); 
            cameraDist += Math.sign(event.deltaY) * 1.5; 
            cameraDist = Math.max(5, Math.min(30, cameraDist)); 

        }

        function onContextMenu(event) {
            if (isFreeCam) return; if (event.target.id === 'minimap' || event.target.id === 'runToggleBtn') return;
            event.preventDefault(); closeContextMenu();
            const hitResults = getRaycastHits(event.clientX, event.clientY);
            if (!hitResults || hitResults.length === 0) return;
            contextOptionsListEl.innerHTML = '';
            for (let i = 0; i < hitResults.length; i++) {
                const hitData = hitResults[i];
                const selectedSlot = getSelectedUseItem();
                const selectedItem = selectedSlot && selectedSlot.itemData ? selectedSlot.itemData : null;
                const selectedCookable = !!(selectedItem && selectedItem.cookResultId && selectedItem.burnResultId);
                let usedSkillOptions = false;
                const skillOptions = (window.SkillRuntime && typeof SkillRuntime.getSkillContextMenuOptions === 'function')
                    ? SkillRuntime.getSkillContextMenuOptions(hitData)
                    : null;
                if (Array.isArray(skillOptions) && skillOptions.length > 0) {
                    usedSkillOptions = true;
                    for (let j = 0; j < skillOptions.length; j++) {
                        const option = skillOptions[j];
                        if (!option || typeof option.text !== 'string' || typeof option.onSelect !== 'function') continue;
                        addContextMenuOption(option.text, option.onSelect);
                    }
                }
                
                if (!usedSkillOptions && hitData.type === 'TREE') {
                    if (logicalMap[playerState.z][hitData.gridY][hitData.gridX] === 1) {
                        addContextMenuOption('Chop down Tree', () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'TREE'); spawnClickMarker(hitData.point, true); });
                        addContextMenuOption('Examine Tree', () => console.log('EXAMINING: A fully grown tree.'));
                    } else if (logicalMap[playerState.z][hitData.gridY][hitData.gridX] === 4) addContextMenuOption('Examine Stump', () => console.log('EXAMINING: A sad looking stump.'));
                } else if (!usedSkillOptions && hitData.type === 'ROCK') {
                    addContextMenuOption('Mine Rock', () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'ROCK'); spawnClickMarker(hitData.point, true); });
                    addContextMenuOption('Examine Rock', () => console.log('EXAMINING: A solid chunk of rock.'));
                } else if (!usedSkillOptions && hitData.type === 'FIRE') {
                    if (selectedCookable) {
                        addContextMenuOption(`Use <span class="text-[#ff981f]">${selectedItem.name}</span> -> <span class="text-orange-300">Fire</span>`, () => {
                            let used = false;
                            if (window.SkillRuntime && typeof SkillRuntime.tryUseItemOnTarget === 'function') {
                                used = SkillRuntime.tryUseItemOnTarget({
                                    hitData,
                                    sourceInvIndex: selectedUse.invIndex,
                                    sourceItemId: selectedItem.id
                                });
                            }
                            if (!used) used = tryUseItemOnWorld(selectedUse.invIndex, hitData);
                            if (used && hitData.point) spawnClickMarker(hitData.point, true);
                            clearSelectedUse();
                        });
                    }
                    addContextMenuOption('Examine <span class="text-orange-300">Fire</span>', () => console.log('EXAMINING: A hot campfire.'));
                } else if (hitData.type === 'BANK_BOOTH') {
                    addContextMenuOption('Bank <span class="text-cyan-400">Bank Booth</span>', () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'BANK_BOOTH'); spawnClickMarker(hitData.point, true); });
                    addContextMenuOption('Examine <span class="text-cyan-400">Bank Booth</span>', () => console.log('EXAMINING: A sturdy wooden booth for storing your items.'));
                } else if (hitData.type === 'DUMMY') {
                    addContextMenuOption('Attack <span class="text-white">Training Dummy</span>', () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'DUMMY'); spawnClickMarker(hitData.point, true); });
                    addContextMenuOption('Examine <span class="text-white">Training Dummy</span>', () => console.log('EXAMINING: A dummy to practice your swings on.'));
                } else if (hitData.type === 'SHOP_COUNTER') {
                    addContextMenuOption('Examine Shop Counter', () => console.log('EXAMINING: A wooden counter with a glass display.'));
                } else if (hitData.type === 'DOOR') {
                    const action = hitData.doorObj.isOpen ? 'Close' : 'Open';
                    addContextMenuOption(`${action} <span class="text-white">Door</span>`, () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'DOOR', hitData.doorObj); spawnClickMarker(hitData.point, true); });
                    addContextMenuOption('Examine <span class="text-white">Door</span>', () => console.log('EXAMINING: A sturdy wooden door.'));
                } else if (hitData.type === 'STAIRS_UP') {
                    addContextMenuOption('Climb-up <span class="text-cyan-400">Stairs</span>', () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'STAIRS_UP'); spawnClickMarker(hitData.point, true); });
                } else if (hitData.type === 'STAIRS_DOWN') {
                    addContextMenuOption('Climb-down <span class="text-cyan-400">Stairs</span>', () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'STAIRS_DOWN'); spawnClickMarker(hitData.point, true); });
                } else if (hitData.type === 'NPC') {
                    const npcUid = (hitData.uid && typeof hitData.uid === 'object') ? hitData.uid : null;
                    const npcAction = (npcUid && typeof npcUid.action === 'string') ? npcUid.action : (hitData.name === 'Shopkeeper' ? 'Trade' : 'Talk-to');
                    if (npcAction === 'Trade') {
                        if (hitData.name === 'Shopkeeper' && !(npcUid && npcUid.merchantId)) {
                            addContextMenuOption(`Trade <span class="text-yellow-400">${hitData.name}</span> (Fishing Supplier)`, () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'NPC', { name: hitData.name, action: 'Trade', merchantId: 'fishing_supplier' }); spawnClickMarker(hitData.point, true); });
                            addContextMenuOption(`Trade <span class="text-yellow-400">${hitData.name}</span> (Fishing Teacher)`, () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'NPC', { name: hitData.name, action: 'Trade', merchantId: 'fishing_teacher' }); spawnClickMarker(hitData.point, true); });
                        } else {
                            const tradeTarget = npcUid ? Object.assign({}, npcUid) : { name: hitData.name, action: 'Trade' };
                            addContextMenuOption(`Trade <span class="text-yellow-400">${hitData.name}</span>`, () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'NPC', tradeTarget); spawnClickMarker(hitData.point, true); });
                        }
                    } else {
                        const talkTarget = npcUid ? Object.assign({}, npcUid) : { name: hitData.name, action: 'Talk-to' };
                        addContextMenuOption(`Talk-to <span class="text-yellow-400">${hitData.name}</span>`, () => { queueAction('INTERACT', hitData.gridX, hitData.gridY, 'NPC', talkTarget); spawnClickMarker(hitData.point, true); });
                    }
                    addContextMenuOption(`Examine <span class="text-yellow-400">${hitData.name}</span>`, () => console.log(`EXAMINING: ${hitData.name}.`));
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
        }

        function normalizeRaycastHit(hit) {
            let data = hit.object.userData;
            if (hit.instanceId !== undefined && hit.object.userData.instanceMap) {
                data = hit.object.userData.instanceMap[hit.instanceId];
            }
            if (!data || data.z !== playerState.z) return null;

            if (data.type === 'GROUND' || data.type === 'WALL' || data.type === 'TOWER') {
                let gridX = Math.floor(hit.point.x + 0.5);
                let gridY = Math.floor(hit.point.z + 0.5);
                if (gridX >= 0 && gridX < MAP_SIZE && gridY >= 0 && gridY < MAP_SIZE) {
                    return { type: data.type, gridX, gridY, point: hit.point };
                }
                return null;
            }
            if (data.type === 'DOOR') {
                return { type: data.type, gridX: data.gridX, gridY: data.gridY, point: hit.point, doorObj: data.doorObj };
            }
            return { type: data.type, gridX: data.gridX, gridY: data.gridY, point: hit.point, name: data.name, uid: data.uid };
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

        
        function findNearestRiverBankTile(targetX, targetY) {
            const z = playerState.z;
            let best = null;
            let bestDist = Infinity;

            const hasAdjacentWater = (x, y) => {
                const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
                for (let i = 0; i < dirs.length; i++) {
                    const nx = x + dirs[i].x;
                    const ny = y + dirs[i].y;
                    if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) continue;
                    const t = logicalMap[z][ny][nx];
                    if (t === 21 || t === 22) return true;
                }
                return false;
            };

            for (let r = 1; r <= 10; r++) {
                const minX = Math.max(0, targetX - r);
                const maxX = Math.min(MAP_SIZE - 1, targetX + r);
                const minY = Math.max(0, targetY - r);
                const maxY = Math.min(MAP_SIZE - 1, targetY + r);

                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        if (!isStandableTile(x, y, z)) continue;
                        if (!hasAdjacentWater(x, y)) continue;

                        const d = Math.hypot(x - targetX, y - targetY);
                        if (d < bestDist) {
                            bestDist = d;
                            best = { x, y };
                        }
                    }
                }
                if (best) break;
            }

            return best;
        }


        function findNearestFishableWaterEdgeTile(targetX, targetY) {
            const z = playerState.z;
            let best = null;
            let bestDist = Infinity;

            const hasAdjacentStandable = (x, y) => {
                const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
                for (let i = 0; i < dirs.length; i++) {
                    const nx = x + dirs[i].x;
                    const ny = y + dirs[i].y;
                    if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) continue;
                    if (isStandableTile(nx, ny, z)) return true;
                }
                return false;
            };

            for (let r = 0; r <= 20; r++) {
                const minX = Math.max(0, targetX - r);
                const maxX = Math.min(MAP_SIZE - 1, targetX + r);
                const minY = Math.max(0, targetY - r);
                const maxY = Math.min(MAP_SIZE - 1, targetY + r);

                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        const tile = logicalMap[z][y][x];
                        if (tile !== 21 && tile !== 22) continue;
                        if (!hasAdjacentStandable(x, y)) continue;

                        const d = Math.hypot(x - targetX, y - targetY);
                        if (d < bestDist) {
                            bestDist = d;
                            best = { x, y };
                        }
                    }
                }
                if (best) break;
            }

            return best;
        }
        function isStandableTile(x, y, z = playerState.z) {
            if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false;
            const tile = logicalMap[z][y][x];
            if (WALKABLE_TILES.includes(tile)) return true;

            // Edge shallow-water tiles are standable; deeper water is not.
            if (tile === 21) {
                const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
                for (let i = 0; i < dirs.length; i++) {
                    const nx = x + dirs[i].x;
                    const ny = y + dirs[i].y;
                    if (nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) continue;
                    const nt = logicalMap[z][ny][nx];
                    if (nt !== 21 && nt !== 22) return true;
                }
            }
            return false;
        }

        function setPlayerRigShoulderPivot(rig) {
            if (!rig) return;
            rig.leftArm.position.set(PLAYER_SHOULDER_PIVOT.x, PLAYER_SHOULDER_PIVOT.y, PLAYER_SHOULDER_PIVOT.z);
            rig.rightArm.position.set(-PLAYER_SHOULDER_PIVOT.x, PLAYER_SHOULDER_PIVOT.y, PLAYER_SHOULDER_PIVOT.z);
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
        function applyRockMiningPose(rig, frameNow, baseVisualY, isPickaxeEquipped) {
            const deg = Math.PI / 180;
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
            const torsoSafeInward = Math.max(0.0, PLAYER_SHOULDER_PIVOT.x - 0.22);
            const shoulderInward = Math.min(0.12 + (0.05 * gather), torsoSafeInward);
            const shoulderForward = 0.1 + (0.03 * gather);
            const shoulderLift = 0.01 + (0.02 * gather);
            rig.leftArm.position.set(
                PLAYER_SHOULDER_PIVOT.x - shoulderInward,
                PLAYER_SHOULDER_PIVOT.y + shoulderLift,
                PLAYER_SHOULDER_PIVOT.z + shoulderForward
            );
            rig.rightArm.position.set(
                -PLAYER_SHOULDER_PIVOT.x + shoulderInward,
                PLAYER_SHOULDER_PIVOT.y + shoulderLift,
                PLAYER_SHOULDER_PIVOT.z + shoulderForward
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
                queueAction('WALK', hitData.gridX, hitData.gridY, null);
                spawnClickMarker(hitData.point, false);
            }
            else {
                let targetData = hitData.uid;
                if (hitData.type === 'DOOR') targetData = hitData.doorObj;

                                else if (hitData.type === 'NPC') {
                    if (hitData.uid && typeof hitData.uid === 'object') targetData = Object.assign({}, hitData.uid);
                    else if (hitData.name === 'Shopkeeper') targetData = { name: hitData.name, action: 'Trade', merchantId: 'fishing_supplier' };
                    else targetData = { name: hitData.name, action: 'Talk-to' };
                }
                queueAction('INTERACT', hitData.gridX, hitData.gridY, hitData.type, targetData); 
                spawnClickMarker(hitData.point, true); 
            }
        }

        function queueAction(type, gridX, gridY, obj, targetUid = null) { pendingAction = { type, x: gridX, y: gridY, obj, targetUid }; }

        function findPath(startX, startY, targetX, targetY, forceAdjacent = false, interactionObj = null) {
            let validTargets = new Set(); 
            let targetTileType = logicalMap[playerState.z][targetY][targetX];
            let isInteract = forceAdjacent || !isStandableTile(targetX, targetY, playerState.z);

            if (isInteract) {
                let targetH = heightMap[playerState.z][targetY][targetX];
                if (targetTileType === 9) { // BANK BOOTH
                    let nx = targetX, ny = targetY + 1;
                    if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) {
                        if (Math.abs(heightMap[playerState.z][ny][nx] - targetH) < 0.1) validTargets.add(`${nx},${ny}`);
                    }
                } else {
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            let nx = targetX + dx, ny = targetY + dy;

                            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                                // Normal adjacent interaction check
                                if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) {
                                    if (Math.abs(heightMap[playerState.z][ny][nx] - targetH) <= 0.3) validTargets.add(`${nx},${ny}`);
                                }
                                continue;
                            }

                            const maxAxis = Math.max(Math.abs(dx), Math.abs(dy));
                            const isAltarRingTile = interactionObj === 'ALTAR_CANDIDATE' && maxAxis === 2;
                            if (isAltarRingTile) {
                                if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) {
                                    if (Math.abs(heightMap[playerState.z][ny][nx] - targetH) <= 0.3) validTargets.add(`${nx},${ny}`);
                                }
                                continue;
                            }

                            if (targetTileType === 16) { // Allow reaching NPCs over counters
                                if (Math.abs(dx) === 2 && dy === 0) {
                                    let midX = targetX + dx / 2;
                                    if (logicalMap[playerState.z][targetY][midX] === 17) {
                                        if (nx >= 0 && nx < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) validTargets.add(`${nx},${ny}`);
                                    }
                                } else if (Math.abs(dy) === 2 && dx === 0) {
                                    let midY = targetY + dy / 2;
                                    if (logicalMap[playerState.z][midY][targetX] === 17) {
                                        if (ny >= 0 && ny < MAP_SIZE && isStandableTile(nx, ny, playerState.z)) validTargets.add(`${nx},${ny}`);
                                    }
                                }
                            }
                        }
                    }
                }
                if (validTargets.size === 0) return [];
            } else validTargets.add(`${targetX},${targetY}`);
            
            if (validTargets.has(`${startX},${startY}`)) return [];
            
            let queue = [{x: startX, y: startY}]; 
            let visited = new Map();
            visited.set(`${startX},${startY}`, null);
            
            let dirs8 = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}];
            
            let iterations = 0; 
            let foundTargetKey = null;

            while (queue.length > 0) {
                if (iterations++ > 25000) break; 
                
                let current = queue.shift(); let currentHeight = heightMap[playerState.z][current.y][current.x];
                
                for (let dir of dirs8) {
                    let nx = current.x + dir.x; let ny = current.y + dir.y; let key = `${nx},${ny}`;
                    if (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE && !visited.has(key) && isStandableTile(nx, ny, playerState.z)) {
                        let nextHeight = heightMap[playerState.z][ny][nx]; 
                        let isStairTransition = (logicalMap[playerState.z][ny][nx] === 15 || logicalMap[playerState.z][current.y][current.x] === 15) && Math.abs(currentHeight - nextHeight) <= 0.6;
                        if (Math.abs(currentHeight - nextHeight) > 0.3 && !isStairTransition) continue;
                        
                        if (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1) {
                            let hX = heightMap[playerState.z][current.y][current.x + dir.x]; let hY = heightMap[playerState.z][current.y + dir.y][current.x];
                            let blockX = !isStandableTile(current.x + dir.x, current.y, playerState.z) || Math.abs(hX - currentHeight) > 0.3;
                            let blockY = !isStandableTile(current.x, current.y + dir.y, playerState.z) || Math.abs(hY - currentHeight) > 0.3;
                            if (blockX && blockY) continue; 
                        }
                        
                        visited.set(key, current);
                        
                        if (validTargets.has(key)) {
                            foundTargetKey = key;
                            queue = []; 
                            break;
                        }
                        queue.push({x: nx, y: ny});
                    }
                }
            }
            
            if (!foundTargetKey) return [];

            let path = [];
            let currStr = foundTargetKey;
            
            while (currStr) {
                let parts = currStr.split(',');
                let cx = parseInt(parts[0], 10);
                let cy = parseInt(parts[1], 10);
                if (cx === startX && cy === startY) break; 
                path.unshift({x: cx, y: cy});
                let parent = visited.get(currStr);
                currStr = parent ? `${parent.x},${parent.y}` : null;
            }
            
            return path;
        }

        function processTick() {
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
                    playerState.path = findPath(playerState.x, playerState.y, actionX, actionY, false);
                    playerState.pendingActionAfterTurn = null;
                    playerState.turnLock = false;
                    playerState.actionVisualReady = true;
                    playerState.action = playerState.path.length > 0 ? 'WALKING' : 'IDLE';
                } else if (pendingAction.type === 'INTERACT') {
                    // Force standing adjacent to interactables (unless picking up a ground item)
                    const forceAdjacent = pendingAction.obj !== 'GROUND_ITEM';
                    playerState.path = findPath(playerState.x, playerState.y, actionX, actionY, forceAdjacent, pendingAction.obj);
                    playerState.pendingActionAfterTurn = null;
                    playerState.turnLock = false;
                    playerState.actionVisualReady = true;

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
                    playerState.pendingSkillStart = pendingSkillStart;

                    playerState.action = 'WALKING_TO_INTERACT'; playerState.targetObj = pendingAction.obj; playerState.targetUid = pendingAction.targetUid;
                }
                pendingAction = null;
            }
            
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
                                    if (isStandableTile(nx, ny, playerState.z) && logicalMap[playerState.z][ny][nx] !== 19) {
                                        playerState.x = nx; playerState.y = ny;
                                        playerState.prevX = nx; playerState.prevY = ny;
                                        break;
                                    }
                                }
                            }
                            
                            door.isOpen = !door.isOpen;
                            door.targetRotation = door.isOpen ? door.openRot : door.closedRot;
                            logicalMap[door.z][door.y][door.x] = door.isOpen ? 19 : 18;
                            updateMinimapCanvas(); // Redraw map to show Walkable state change
                        }
                        playerState.action = 'IDLE';
                    } else {
                        let isAdjacent = (distX <= 1 && distY <= 1);
                        if (playerState.targetObj === 'ALTAR_CANDIDATE') {
                            // Altars are interacted from one tile farther than default.
                            isAdjacent = (distX <= 2 && distY <= 2 && (distX > 1 || distY > 1));
                        }
                        let isAcrossCounter = false;
                        if (playerState.targetObj === 'NPC' || playerState.targetObj === 'SHOP_COUNTER') {
                            if (distX === 2 && distY === 0 && logicalMap[playerState.z][playerState.y][Math.min(playerState.x, playerState.targetX) + 1] === 17) isAcrossCounter = true;
                            if (distY === 2 && distX === 0 && logicalMap[playerState.z][Math.min(playerState.y, playerState.targetY) + 1][playerState.x] === 17) isAcrossCounter = true;
                        }

                        if (isAdjacent || isAcrossCounter) {
                            if (Math.abs(playerH - targetH) > 0.3 && !isAcrossCounter) {
                                playerState.action = 'IDLE';
                            } else if (playerState.targetObj === 'DUMMY') {
                                startFacingAction('COMBAT: DUMMY', true);
                            } else if (playerState.targetObj === 'NPC' || playerState.targetObj === 'SHOP_COUNTER') {
                                playerState.action = 'IDLE';
                                const faceDx = playerState.targetX - playerState.x; const faceDy = playerState.targetY - playerState.y; 
                                if (faceDx !== 0 || faceDy !== 0) { playerState.targetRotation = Math.atan2(faceDx, faceDy); if (playerRig) playerRig.rotation.y = playerState.targetRotation; }
                                
                                if (playerState.targetObj === 'NPC' && playerState.targetUid && playerState.targetUid.action === 'Trade') {
                                    openShop(playerState.targetUid.merchantId || 'fishing_supplier');
                                }
                            } else if (playerState.targetObj === 'BANK_BOOTH') {
                                playerState.action = 'IDLE';
                                const faceDx = playerState.targetX - playerState.x; const faceDy = playerState.targetY - playerState.y; 
                                if (faceDx !== 0 || faceDy !== 0) { playerState.targetRotation = Math.atan2(faceDx, faceDy); if (playerRig) playerRig.rotation.y = playerState.targetRotation; }
                                openBank();
                            } else {
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
                } else if (playerState.action === 'WALKING') playerState.action = 'IDLE';
            }

            if (playerState.action === 'IDLE' || playerState.action === 'WALKING' || playerState.action === 'WALKING_TO_INTERACT') {
                playerState.turnLock = false;
                playerState.actionVisualReady = true;
                playerState.pendingActionAfterTurn = null;
            }
            
            if (!(window.SkillRuntime && SkillRuntime.handleSkillTick())) {
                if (playerState.action === 'COMBAT: DUMMY') {
                    if (currentTick % 4 === 0) {
                        playerRig.userData.rig.attackTrigger = Date.now();
                        const damage = Math.floor(Math.random() * 3); 
                        spawnHitsplat(damage, playerState.targetX, playerState.targetY);
                        if (damage > 0) addSkillXp('strength', damage * 4);
                    }
                }
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
            group.userData.rig = { head, torso, leftArm, rightArm, leftLowerArm, rightLowerArm, leftLeg, rightLeg, axe: axeGroup, attackTrigger: 0 }; group.userData.baseY = 0;
            return group;
        }

                function updateHoverTooltip() {
            const tooltip = document.getElementById('hover-tooltip');
            if (isDraggingCamera || isFreeCam || isBankOpen || currentMouseX === 0) { tooltip.classList.add('hidden'); return; }
            const hoveredElement = document.elementFromPoint(currentMouseX, currentMouseY);
            if (hoveredElement && hoveredElement.tagName !== 'CANVAS') { tooltip.classList.add('hidden'); return; }

            const hitData = getRaycastHit(currentMouseX, currentMouseY);
            if (hitData) {
                                const selectedSlot = getSelectedUseItem();
                const selectedItem = selectedSlot && selectedSlot.itemData ? selectedSlot.itemData : null;
                const selectedCookable = !!(selectedItem && selectedItem.cookResultId && selectedItem.burnResultId);
                const fireUnderCursor = selectedCookable && Array.isArray(activeFires) && activeFires.some((f) => {
                    if (!f || f.z !== playerState.z) return false;
                    if (Number.isInteger(hitData.gridX) && Number.isInteger(hitData.gridY) && f.x === hitData.gridX && f.y === hitData.gridY) return true;
                    if (!hitData.point) return false;
                    return Math.hypot((f.x + 0.5) - hitData.point.x, (f.y + 0.5) - hitData.point.z) <= 1.35;
                });

                let actionText = '';
                if (selectedCookable && (hitData.type === 'GROUND' || hitData.type === 'FIRE') && fireUnderCursor) {
                    actionText = `<span class="text-gray-300">Use</span> <span class="text-[#ff981f]">${selectedItem.name}</span> <span class="text-gray-300">-></span> <span class="text-orange-300">Fire</span>`;
                }

                if (!actionText) {
                    actionText = (window.SkillRuntime && typeof SkillRuntime.getSkillTooltip === 'function')
                        ? SkillRuntime.getSkillTooltip(hitData)
                        : '';
                }

                if (!actionText) {
                    if (hitData.type === 'TREE') {
                        if (logicalMap[playerState.z][hitData.gridY][hitData.gridX] === 1) actionText = '<span class="text-gray-300">Chop down</span> <span class="text-cyan-400">Tree</span>';
                    } else if (hitData.type === 'ROCK') actionText = '<span class="text-gray-300">Mine</span> <span class="text-cyan-400">Rock</span>';
                    else if (hitData.type === 'GROUND_ITEM') actionText = `<span class="text-gray-300">Take</span> <span class="text-[#ff981f]">${hitData.name}</span>`;
                    else if (hitData.type === 'BANK_BOOTH') actionText = '<span class="text-gray-300">Bank</span> <span class="text-cyan-400">Bank Booth</span>';
                    else if (hitData.type === 'SHOP_COUNTER') actionText = '<span class="text-gray-300">Examine</span> <span class="text-cyan-400">Shop Counter</span>';
                    else if (hitData.type === 'WATER') actionText = '<span class="text-gray-300">Fish</span> <span class="text-cyan-400">Water</span>';
                    else if (hitData.type === 'DOOR') actionText = `<span class="text-gray-300">${hitData.doorObj.isOpen ? 'Close' : 'Open'}</span> <span class="text-cyan-400">Door</span>`;
                    else if (hitData.type === 'DUMMY') actionText = '<span class="text-gray-300">Attack</span> <span class="text-[#ffff00]">Training Dummy</span>';
                    else if (hitData.type === 'STAIRS_UP') actionText = '<span class="text-gray-300">Climb-up</span> <span class="text-cyan-400">Stairs</span>';
                    else if (hitData.type === 'STAIRS_DOWN') actionText = '<span class="text-gray-300">Climb-down</span> <span class="text-cyan-400">Stairs</span>';
                    else if (hitData.type === 'NPC') {
                        const npcAction = (hitData.uid && hitData.uid.action) ? hitData.uid.action : (hitData.name === 'Shopkeeper' ? 'Trade' : 'Talk-to');
                        if (npcAction === 'Trade') actionText = `<span class="text-gray-300">Trade</span> <span class="text-yellow-400">${hitData.name}</span>`;
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
                rig.leftArm.position.set(values.shoulder.x, values.shoulder.y, values.shoulder.z);
                rig.rightArm.position.set(-values.shoulder.x, values.shoulder.y, values.shoulder.z);
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
                fpsSampleFrames = 0;
                fpsSampleLast = frameNowMs;
            }

            const frameNow = Date.now();
            
            const hasPlayerRig = !!(typeof playerRig !== 'undefined' && playerRig && playerRig.position);
            if (hasPlayerRig && typeof window.manageChunks === 'function') window.manageChunks();
            if (hasPlayerRig) updatePoseEditorHandles();
            if (typeof window.updateFires === 'function') window.updateFires(frameNow);
            if (typeof updateMiningPoseReferences === 'function') updateMiningPoseReferences(frameNowMs);

            if (sharedMaterials.waterShallow && sharedMaterials.waterShallow.map) {
                const m = sharedMaterials.waterShallow.map;
                m.offset.x = (frameNowMs * 0.000025) % 1;
                m.offset.y = (frameNowMs * 0.00001) % 1;
            }
            if (sharedMaterials.waterDeep && sharedMaterials.waterDeep.map) {
                const m = sharedMaterials.waterDeep.map;
                m.offset.x = (frameNowMs * -0.000018) % 1;
                m.offset.y = (frameNowMs * 0.000015) % 1;
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

            // Z-Plane Visibility Culling!
            Object.values(chunkGroups).forEach(group => {
                group.children.forEach(planeGroup => {
                    if (planeGroup.userData.z !== undefined) {
                        planeGroup.visible = (planeGroup.userData.z <= playerState.z);
                    }
                });
            });

            const runPhase = (frameNow % 600) / 600 * Math.PI * 2; const absSinRun = Math.abs(Math.sin(runPhase));
            const walkPhase = (frameNow % TICK_RATE_MS) / TICK_RATE_MS * Math.PI * 2;
            const sinWalkRaw = Math.sin(walkPhase);
            const sinWalk = Math.sign(sinWalkRaw) * Math.pow(Math.abs(sinWalkRaw), 0.65);
            const absSinWalk = Math.abs(sinWalkRaw);
            const idlePhase = (frameNow % (TICK_RATE_MS * 2)) / (TICK_RATE_MS * 2) * Math.PI * 2;
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
                renderer.render(scene, camera);
                return;
            }
            playerRig.position.set(currentVisualX, baseVisualY, currentVisualY);
            
            if (minimapLocked && !isFreeCam) { minimapTargetX = currentVisualX; minimapTargetY = currentVisualY; }
            const rig = playerRig && playerRig.userData ? playerRig.userData.rig : null;
            if (!rig) {
                renderer.render(scene, camera);
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
            if (isMoving) {
                rig.axe.visible = !!equipment.weapon; rig.axe.rotation.set(0, 0, 0); 
                setPlayerRigShoulderPivot(rig);
                rig.leftArm.rotation.set(0,0,0); rig.rightArm.rotation.set(0,0,0); rig.leftLowerArm.rotation.set(0,0,0); rig.rightLowerArm.rotation.set(0,0,0); rig.torso.rotation.set(0,0,0); rig.head.rotation.set(0,0,0); if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0;
                const logicalTilesMoved = Math.max(Math.abs(playerState.x - playerState.prevX), Math.abs(playerState.y - playerState.prevY));
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
                                    } else if (window.SkillRuntime && SkillRuntime.handleSkillAnimation({
                rig,
                frameNow,
                baseVisualY,
                playerRig,
                equipment,
                setShoulderPivot: setPlayerRigShoulderPivot,
                shoulderPivot: PLAYER_SHOULDER_PIVOT,
                applyRockMiningPose
            })) {
                // Skill module handled pose.
            } else if (playerState.action === 'COMBAT: DUMMY') {
                if (!playerState.actionVisualReady) {
                    rig.axe.visible = true;
                    setPlayerRigShoulderPivot(rig);
                    rig.leftArm.rotation.set(0, 0, 0); rig.rightArm.rotation.set(0, 0, 0);
                    rig.leftLowerArm.rotation.set(0, 0, 0); rig.rightLowerArm.rotation.set(0, 0, 0);
                    rig.torso.rotation.set(0, 0, 0); rig.head.rotation.set(0, 0, 0);
                    rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0; if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0; playerRig.position.y = baseVisualY;
                } else {
                rig.axe.visible = !!equipment.weapon; playerRig.rotation.x = 0; rig.torso.rotation.x = 0; rig.head.rotation.x = 0;
                rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0; if (rig.leftLowerLeg) rig.leftLowerLeg.rotation.x = 0; if (rig.rightLowerLeg) rig.rightLowerLeg.rotation.x = 0; playerRig.position.y = baseVisualY;
                
                const attackAge = frameNow - rig.attackTrigger;
                if (attackAge < 500) {
                    const punchT = attackAge / 500;
                    const punchOut = Math.sin(punchT * Math.PI);
                    
                    rig.rightArm.rotation.x = -punchOut * 1.5;
                    rig.rightArm.rotation.z = -punchOut * 0.2;
                    rig.rightArm.position.z = PLAYER_SHOULDER_PIVOT.z + (punchOut * 0.3);
                    
                    rig.torso.rotation.y = punchOut * 0.3;
                    rig.leftArm.position.z = PLAYER_SHOULDER_PIVOT.z - (punchOut * 0.2);
                } else {
                    setPlayerRigShoulderPivot(rig);
                    rig.leftArm.rotation.set(0,0,0); rig.leftLowerArm.rotation.set(0,0,0); rig.rightArm.rotation.set(0,0,0); rig.rightLowerArm.rotation.set(0,0,0);
                    rig.torso.rotation.set(0,0,0);
                }
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
            renderer.render(scene, camera); updateMinimap();
            if (uiPlayerRig && !document.getElementById('view-equip').classList.contains('hidden')) uiRenderer.render(uiScene, uiCamera);
            
            updatePlayerOverheadText();
            updateHoverTooltip();
        }








































































        window.initPoseEditor = initPoseEditor;














































