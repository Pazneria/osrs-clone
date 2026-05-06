(function () {
    function getWindowRef(context) {
        return context && context.windowRef ? context.windowRef : window;
    }

    function getTileId(context) {
        return context && context.tileId ? context.tileId : {};
    }

    function getDocumentRef(context) {
        return context && context.documentRef ? context.documentRef : (typeof document !== 'undefined' ? document : null);
    }

    function formatDecorPropLabel(targetUid) {
        if (targetUid && typeof targetUid.label === 'string' && targetUid.label.trim()) return targetUid.label.trim();
        return 'object';
    }

    function getDecorPropSearchMessage(targetUid) {
        const label = formatDecorPropLabel(targetUid);
        const kind = String(targetUid && targetUid.kind ? targetUid.kind : '').toLowerCase();
        if (kind === 'desk') return 'You search the desk. Lesson notes and a rough map of the island are laid out neatly.';
        if (kind === 'crate') return 'You search the starter supplies. The Tutorial Guide has set aside what you need first.';
        if (kind === 'tool_rack') return 'You search the tool rack. Axes and practice gear are racked with their sharp sides facing out.';
        if (kind === 'notice_board') return 'You read the notice board. Speak to the Tutorial Guide, then follow the path east to the trees.';
        if (kind === 'chopping_block') return 'You check the chopping block. Fresh axe marks show where new adventurers practice their first cuts.';
        if (kind === 'woodpile') return 'You search the stacked logs. They are split neatly, but the instructor wants you to cut your own.';
        return `You search the ${label}.`;
    }

    function showBlockingInteractionMessage(context, message) {
        const text = String(message || '').trim();
        if (!text) return;

        const documentRef = getDocumentRef(context);
        if (!documentRef || !documentRef.body || typeof documentRef.createElement !== 'function') return;
        let popup = typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById('tutorial-blocking-popup')
            : null;
        const closePopup = () => {
            if (!popup) return;
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -8px) scale(0.96)';
            popup.style.display = 'none';
            if (popup._tutorialClickAwayHandler && typeof documentRef.removeEventListener === 'function') {
                documentRef.removeEventListener('pointerdown', popup._tutorialClickAwayHandler, true);
            }
            popup._tutorialClickAwayHandler = null;
        };
        if (!popup) {
            popup = documentRef.createElement('div');
            popup.id = 'tutorial-blocking-popup';
            popup.style.position = 'fixed';
            popup.style.left = '50%';
            popup.style.top = '18%';
            popup.style.zIndex = '10000';
            popup.style.maxWidth = 'min(520px, calc(100vw - 32px))';
            popup.style.padding = '10px 16px';
            popup.style.border = '2px solid #c8aa6e';
            popup.style.borderRadius = '4px';
            popup.style.background = 'rgba(22, 18, 12, 0.95)';
            popup.style.color = '#fff2bf';
            popup.style.font = '700 15px system-ui, sans-serif';
            popup.style.textAlign = 'center';
            popup.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 242, 191, 0.18)';
            popup.style.pointerEvents = 'auto';
            popup.style.transition = 'opacity 140ms ease, transform 140ms ease';
            popup.style.alignItems = 'center';
            popup.style.justifyContent = 'center';
            popup.style.gap = '12px';
            const body = documentRef.createElement('span');
            body.className = 'tutorial-blocking-popup-text';
            body.style.display = 'block';
            body.style.flex = '1 1 auto';
            const closeButton = documentRef.createElement('button');
            closeButton.type = 'button';
            closeButton.setAttribute('aria-label', 'Close message');
            closeButton.textContent = 'x';
            closeButton.style.width = '24px';
            closeButton.style.height = '24px';
            closeButton.style.border = '1px solid #c8aa6e';
            closeButton.style.borderRadius = '3px';
            closeButton.style.background = '#2a1f12';
            closeButton.style.color = '#fff2bf';
            closeButton.style.font = '700 14px system-ui, sans-serif';
            closeButton.style.lineHeight = '20px';
            closeButton.style.cursor = 'pointer';
            if (typeof closeButton.addEventListener === 'function') {
                closeButton.addEventListener('click', (event) => {
                    if (event && typeof event.preventDefault === 'function') event.preventDefault();
                    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
                    closePopup();
                });
            }
            if (typeof popup.appendChild === 'function') {
                popup.appendChild(body);
                popup.appendChild(closeButton);
            }
            popup._tutorialBody = body;
            popup._tutorialCloseButton = closeButton;
            documentRef.body.appendChild(popup);
        }
        if (popup._tutorialBody) popup._tutorialBody.textContent = text;
        else popup.textContent = text;
        popup.style.display = 'flex';
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, 0) scale(1)';

        if (popup._tutorialClickAwayHandler && typeof documentRef.removeEventListener === 'function') {
            documentRef.removeEventListener('pointerdown', popup._tutorialClickAwayHandler, true);
        }
        popup._tutorialClickAwayHandler = (event) => {
            if (popup && typeof popup.contains === 'function' && popup.contains(event && event.target)) return;
            closePopup();
        };
        if (typeof documentRef.addEventListener === 'function') {
            documentRef.addEventListener('pointerdown', popup._tutorialClickAwayHandler, true);
        }
    }

    function isAcrossShopCounter(context, distX, distY) {
        const playerState = context.playerState;
        const tileId = getTileId(context);
        if (playerState.targetObj !== 'NPC' && playerState.targetObj !== 'SHOP_COUNTER') return false;
        if (distX === 2 && distY === 0
            && context.logicalMap[playerState.z][playerState.y][Math.min(playerState.x, playerState.targetX) + 1] === tileId.SHOP_COUNTER) {
            return true;
        }
        if (distY === 2 && distX === 0
            && context.logicalMap[playerState.z][Math.min(playerState.y, playerState.targetY) + 1][playerState.x] === tileId.SHOP_COUNTER) {
            return true;
        }
        return false;
    }

    function isTargetInInteractionReach(context, distX, distY) {
        const playerState = context.playerState;
        if (playerState.targetObj === 'ALTAR_CANDIDATE') {
            return distX <= 2 && distY <= 2 && (distX > 1 || distY > 1);
        }
        if (playerState.targetObj === 'WATER') {
            const cardinalAdjacent = (distX + distY) === 1;
            const isPierApproach = typeof context.isPierFishingApproachTile === 'function'
                && context.isPierFishingApproachTile(
                    playerState.x,
                    playerState.y,
                    playerState.targetX,
                    playerState.targetY,
                    playerState.z
                );
            const standingOnWater = typeof context.isWaterTileId === 'function'
                && context.isWaterTileId(context.logicalMap[playerState.z][playerState.y][playerState.x]);
            return cardinalAdjacent && (isPierApproach || !standingOnWater);
        }
        return distX <= 1 && distY <= 1;
    }

    function facePlayerToward(context, targetX, targetY) {
        const playerState = context.playerState;
        const faceDx = targetX - playerState.x;
        const faceDy = targetY - playerState.y;
        if (faceDx === 0 && faceDy === 0) return;
        playerState.targetRotation = Math.atan2(faceDx, faceDy);
        if (context.playerRig) context.playerRig.rotation.y = playerState.targetRotation;
    }

    function facePlayerTowardWater(context) {
        const playerState = context.playerState;
        let faceDx = playerState.targetX - playerState.x;
        let faceDy = playerState.targetY - playerState.y;
        if (Math.abs(faceDx) >= Math.abs(faceDy)) {
            faceDx = Math.sign(faceDx);
            faceDy = 0;
        } else {
            faceDy = Math.sign(faceDy);
            faceDx = 0;
        }
        if (faceDx === 0 && faceDy === 0) return;
        playerState.targetRotation = Math.atan2(faceDx, faceDy);
        if (context.playerRig) context.playerRig.rotation.y = playerState.targetRotation;
    }

    function resumeDeferredFletchingInteraction(context, movedThisTick) {
        const playerState = context.playerState;
        if (playerState.action !== 'SKILLING: FLETCHING' || !playerState.pendingInteractAfterFletchingWalk) {
            return false;
        }
        if (movedThisTick) return true;

        const deferred = playerState.pendingInteractAfterFletchingWalk;
        if (Number.isInteger(deferred.targetX)) playerState.targetX = deferred.targetX;
        if (Number.isInteger(deferred.targetY)) playerState.targetY = deferred.targetY;
        if (typeof deferred.targetObj === 'string' && deferred.targetObj) playerState.targetObj = deferred.targetObj;
        if (deferred.targetUid !== undefined) playerState.targetUid = deferred.targetUid;

        const distX = Math.abs(playerState.targetX - playerState.x);
        const distY = Math.abs(playerState.targetY - playerState.y);
        const canInteract = isTargetInInteractionReach(context, distX, distY)
            || isAcrossShopCounter(context, distX, distY);

        if (canInteract) {
            if (typeof context.stopActiveFletchingProcessingSession === 'function') {
                context.stopActiveFletchingProcessingSession();
            }
            playerState.pendingInteractAfterFletchingWalk = null;
            playerState.action = 'WALKING_TO_INTERACT';
        } else {
            playerState.pendingInteractAfterFletchingWalk = null;
        }
        return false;
    }

    function handleGroundItemArrival(context, distX, distY) {
        const playerState = context.playerState;
        if (distX === 0 && distY === 0 && typeof context.takeGroundItemByUid === 'function') {
            context.takeGroundItemByUid(playerState.targetUid);
        }
        playerState.action = 'IDLE';
    }

    function handleDoorArrival(context) {
        const windowRef = getWindowRef(context);
        const playerState = context.playerState;
        const tileId = getTileId(context);
        const door = playerState.targetUid;
        if (door) {
            if (windowRef.isTutorialGateLocked && windowRef.isTutorialGateLocked(door)) {
                const message = door.tutorialGateMessage || 'That gate is locked until you finish the current tutorial lesson.';
                if (typeof context.addChatMessage === 'function') context.addChatMessage(message, 'warn');
                showBlockingInteractionMessage(context, message);
                playerState.action = 'IDLE';
                return;
            }
            if (door.isOpen && playerState.x === door.x && playerState.y === door.y) {
                const dirs = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}];
                for (let i = 0; i < dirs.length; i++) {
                    const d = dirs[i];
                    const nx = playerState.x + d.x;
                    const ny = playerState.y + d.y;
                    const tile = context.logicalMap[playerState.z][ny][nx];
                    if (typeof context.isStandableTile === 'function'
                        && context.isStandableTile(nx, ny, playerState.z)
                        && !(typeof context.isDoorTileId === 'function' && context.isDoorTileId(tile))) {
                        playerState.x = nx;
                        playerState.y = ny;
                        playerState.prevX = nx;
                        playerState.prevY = ny;
                        break;
                    }
                }
            }

            door.isOpen = !door.isOpen;
            door.targetRotation = door.isOpen ? door.openRot : door.closedRot;
            if (door.isWoodenGate) {
                context.logicalMap[door.z][door.y][door.x] = door.isOpen ? tileId.WOODEN_GATE_OPEN : tileId.WOODEN_GATE_CLOSED;
            } else {
                context.logicalMap[door.z][door.y][door.x] = door.isOpen ? tileId.DOOR_OPEN : tileId.DOOR_CLOSED;
            }
            if (typeof context.updateMinimapCanvas === 'function') context.updateMinimapCanvas();
        }
        playerState.action = 'IDLE';
    }

    function handleNpcOrCounterArrival(context) {
        const windowRef = getWindowRef(context);
        const playerState = context.playerState;
        playerState.action = 'IDLE';
        facePlayerToward(context, playerState.targetX, playerState.targetY);

        if (playerState.targetObj === 'NPC' && playerState.targetUid && playerState.targetUid.action === 'Trade') {
            if (typeof context.openShop === 'function') context.openShop(playerState.targetUid.merchantId || 'general_store');
        } else if (playerState.targetObj === 'NPC' && playerState.targetUid && playerState.targetUid.action === 'Bank') {
            if (typeof context.openBank === 'function') context.openBank();
        } else if (playerState.targetObj === 'NPC' && playerState.targetUid && playerState.targetUid.action === 'Travel') {
            if (typeof windowRef.travelToWorld === 'function') {
                const explicitWorldId = playerState.targetUid.travelToWorldId || null;
                const sessionWorldId = (windowRef.GameSessionRuntime && typeof windowRef.GameSessionRuntime.resolveCurrentWorldId === 'function')
                    ? windowRef.GameSessionRuntime.resolveCurrentWorldId()
                    : ((windowRef.WorldBootstrapRuntime && typeof windowRef.WorldBootstrapRuntime.getCurrentWorldId === 'function')
                        ? windowRef.WorldBootstrapRuntime.getCurrentWorldId()
                        : null);
                const targetWorldId = explicitWorldId || sessionWorldId;
                if (targetWorldId) {
                    windowRef.travelToWorld(targetWorldId, {
                        spawn: playerState.targetUid.travelSpawn || null,
                        label: playerState.targetUid.worldLabel || playerState.targetUid.name || targetWorldId
                    });
                }
            }
        } else if (playerState.targetObj === 'NPC'
            && playerState.targetUid
            && (playerState.targetUid.action === 'Talk-to' || !playerState.targetUid.action)) {
            if (typeof windowRef.openNpcDialogue === 'function') {
                windowRef.openNpcDialogue(playerState.targetUid);
            }
        }
    }

    function handleDecorPropArrival(context) {
        const playerState = context.playerState;
        playerState.action = 'IDLE';
        facePlayerToward(context, playerState.targetX, playerState.targetY);
        if (typeof context.addChatMessage === 'function') {
            context.addChatMessage(getDecorPropSearchMessage(playerState.targetUid), 'game');
        }
    }

    function handleBankBoothArrival(context) {
        const playerState = context.playerState;
        playerState.action = 'IDLE';
        facePlayerToward(context, playerState.targetX, playerState.targetY);
        if (typeof context.setActiveBankSource === 'function') {
            context.setActiveBankSource(`booth:${playerState.targetX},${playerState.targetY},${playerState.z}`);
        }
        if (typeof context.openBank === 'function') context.openBank();
    }

    function handleSkillTargetArrival(context) {
        const playerState = context.playerState;
        if (playerState.targetObj === 'FURNACE' || playerState.targetObj === 'ANVIL') {
            const facingRotation = typeof context.resolveInteractionFacingRotation === 'function'
                ? context.resolveInteractionFacingRotation(
                    playerState.targetObj,
                    playerState.targetX,
                    playerState.targetY,
                    playerState.x,
                    playerState.y,
                    playerState.z
                )
                : null;
            if (Number.isFinite(facingRotation)) {
                playerState.targetRotation = facingRotation;
                if (context.playerRig) context.playerRig.rotation.y = playerState.targetRotation;
            }
        }
        if (playerState.targetObj === 'WATER') {
            facePlayerTowardWater(context);
        }

        const skillRuntime = context.skillRuntime || null;
        if (skillRuntime
            && typeof skillRuntime.canHandleTarget === 'function'
            && skillRuntime.canHandleTarget(playerState.targetObj)) {
            if (typeof skillRuntime.tryStartFromPlayerTarget !== 'function' || !skillRuntime.tryStartFromPlayerTarget()) {
                playerState.action = 'IDLE';
            }
        } else {
            playerState.action = 'IDLE';
        }
    }

    function handleWalkingToInteractArrival(context, movedThisTick) {
        const windowRef = getWindowRef(context);
        const playerState = context.playerState;
        if (playerState.action !== 'WALKING_TO_INTERACT') return false;
        if (movedThisTick) return true;

        const distX = Math.abs(playerState.targetX - playerState.x);
        const distY = Math.abs(playerState.targetY - playerState.y);
        const playerH = context.heightMap[playerState.z][playerState.y][playerState.x];
        const targetH = context.heightMap[playerState.z][playerState.targetY][playerState.targetX];

        if (playerState.targetObj === 'GROUND_ITEM') {
            handleGroundItemArrival(context, distX, distY);
        } else if (playerState.targetObj === 'DOOR') {
            handleDoorArrival(context);
        } else {
            const canInteract = isTargetInInteractionReach(context, distX, distY);
            const isAcrossCounter = isAcrossShopCounter(context, distX, distY);

            if (canInteract || isAcrossCounter) {
                const stationApproach = typeof context.validateStationApproach === 'function'
                    ? context.validateStationApproach(
                        playerState.targetObj,
                        playerState.targetX,
                        playerState.targetY,
                        playerState.x,
                        playerState.y
                    )
                    : { ok: true, message: '' };
                if (!stationApproach.ok) {
                    if (typeof context.addChatMessage === 'function' && stationApproach.message) {
                        context.addChatMessage(stationApproach.message, 'warn');
                    }
                    playerState.action = 'IDLE';
                    return false;
                }

                const pierFishingApproach = playerState.targetObj === 'WATER'
                    && typeof context.isPierFishingApproachTile === 'function'
                    && context.isPierFishingApproachTile(playerState.x, playerState.y, playerState.targetX, playerState.targetY, playerState.z);
                if (Math.abs(playerH - targetH) > 0.3 && !isAcrossCounter && !pierFishingApproach) {
                    playerState.action = 'IDLE';
                } else if (playerState.targetObj === 'NPC' || playerState.targetObj === 'SHOP_COUNTER') {
                    handleNpcOrCounterArrival(context);
                } else if (playerState.targetObj === 'DECOR_PROP') {
                    handleDecorPropArrival(context);
                } else if (playerState.targetObj === 'BANK_BOOTH') {
                    handleBankBoothArrival(context);
                } else {
                    handleSkillTargetArrival(context);
                }
            } else {
                if (playerState.targetObj === 'ALTAR_CANDIDATE' && windowRef.QA_RC_DEBUG && typeof context.addChatMessage === 'function') {
                    context.addChatMessage(`[QA rcdbg] interact blocked: dist=(${distX},${distY}) target=(${playerState.targetX},${playerState.targetY}) player=(${playerState.x},${playerState.y})`, 'info');
                }
                playerState.action = 'IDLE';
            }
        }
        return false;
    }

    function processArrivalInteractions(context, movedThisTick) {
        if (!context || !context.playerState || !Array.isArray(context.playerState.path)) {
            return { shouldReturnEarly: false };
        }
        const playerState = context.playerState;
        if (playerState.path.length !== 0) return { shouldReturnEarly: false };

        if (resumeDeferredFletchingInteraction(context, movedThisTick)) {
            return { shouldReturnEarly: true };
        }
        if (handleWalkingToInteractArrival(context, movedThisTick)) {
            return { shouldReturnEarly: true };
        }
        if (playerState.action === 'WALKING') {
            playerState.action = 'IDLE';
            if (typeof context.clearMinimapDestinationIfReached === 'function') context.clearMinimapDestinationIfReached();
        }
        return { shouldReturnEarly: false };
    }

    window.InputArrivalInteractionRuntime = {
        processArrivalInteractions,
        resumeDeferredFletchingInteraction,
        handleWalkingToInteractArrival,
        getDecorPropSearchMessage,
        showBlockingInteractionMessage
    };
})();
