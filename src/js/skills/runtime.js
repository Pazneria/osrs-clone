(function () {
    const manifest = window.SkillManifest || {};
    const targetToSkillId = manifest.targetToSkillId || {
        TREE: 'woodcutting',
        ROCK: 'mining',
        WATER: 'fishing'
    };

    const actionToSkillId = manifest.actionToSkillId || {
        FIREMAKING: 'firemaking'
    };

    const skillRegistry = {};

    function debugCookingUse(message) {
        if (!window.DEBUG_COOKING_USE) return;
        const text = `[cook-debug] ${message}`;
        try { console.log(text); } catch (_) {}
        if (typeof addChatMessage === 'function') addChatMessage(text, 'info');
    }

    function getGameSession() {
        if (window.GameSessionRuntime && typeof window.GameSessionRuntime.getSession === 'function') {
            return window.GameSessionRuntime.getSession();
        }
        if (typeof window.getGameSession === 'function') {
            return window.getGameSession();
        }
        return null;
    }

    function getActivePlayerState() {
        const session = getGameSession();
        if (session && session.player) return session.player;
        if (typeof playerState === 'object' && playerState) return playerState;
        if (!window.__skillRuntimeFallbackPlayerState) window.__skillRuntimeFallbackPlayerState = {};
        return window.__skillRuntimeFallbackPlayerState;
    }

    function getActiveProgressState() {
        const session = getGameSession();
        if (session && session.progress) return session.progress;
        return null;
    }

    function getActiveInventory() {
        const progress = getActiveProgressState();
        if (progress && Array.isArray(progress.inventory)) return progress.inventory;
        return Array.isArray(inventory) ? inventory : [];
    }

    function getActiveEquipment() {
        const progress = getActiveProgressState();
        if (progress && progress.equipment && typeof progress.equipment === 'object') return progress.equipment;
        return (typeof equipment === 'object' && equipment) ? equipment : {};
    }

    function getActivePlayerSkills() {
        const progress = getActiveProgressState();
        if (progress && progress.playerSkills && typeof progress.playerSkills === 'object') return progress.playerSkills;
        return (typeof playerSkills === 'object' && playerSkills) ? playerSkills : {};
    }

    function resolveSkillIdFromTarget(targetObj) {
        if (!targetObj) return null;
        return targetToSkillId[targetObj] || null;
    }

    function resolveSkillIdFromAction(actionName) {
        if (typeof actionName !== 'string') return null;
        if (!actionName.startsWith('SKILLING:')) return null;
        const actionKey = actionName.slice('SKILLING:'.length).trim();
        return actionToSkillId[actionKey] || resolveSkillIdFromTarget(actionKey);
    }

    function getToolPower(itemData) {
        if (!itemData) return -Infinity;
        if (Number.isFinite(itemData.toolTier)) return itemData.toolTier;
        if (itemData.stats && Number.isFinite(itemData.stats.atk)) return itemData.stats.atk;
        return 0;
    }

    function getBestToolByClass(toolClass) {
        if (!toolClass) return null;
        const candidates = [];
        const activeEquipment = getActiveEquipment();
        const activeInventory = getActiveInventory();

        const equipped = activeEquipment && activeEquipment.weapon;
        if (equipped && equipped.weaponClass === toolClass) candidates.push(equipped);

        for (let i = 0; i < activeInventory.length; i++) {
            const slot = activeInventory[i];
            if (!slot || !slot.itemData) continue;
            const item = slot.itemData;
            if (item.weaponClass === toolClass) candidates.push(item);
        }

        if (candidates.length === 0) return null;

        let best = candidates[0];
        let bestPower = getToolPower(best);
        for (let i = 1; i < candidates.length; i++) {
            const candidate = candidates[i];
            const power = getToolPower(candidate);
            if (power > bestPower) {
                best = candidate;
                bestPower = power;
            }
        }

        return best;
    }

    function hasToolClass(toolClass) {
        return !!getBestToolByClass(toolClass);
    }

    function autoEquipToolClass(toolClass) {
        // Kept for backward compatibility with older modules, now intentionally no-op.
        return hasToolClass(toolClass);
    }

    function giveItemById(itemId, amount = 1) {
        if (!ITEM_DB || !ITEM_DB[itemId]) return 0;
        return giveItem(ITEM_DB[itemId], amount);
    }

    function hasItem(itemId) {
        return getActiveInventory().some(i => i && i.itemData && i.itemData.id === itemId);
    }
    function canAcceptItemById(itemId, amount = 1) {
        if (!itemId || !ITEM_DB || !ITEM_DB[itemId]) return false;
        const item = ITEM_DB[itemId];
        const activeInventory = getActiveInventory();
        if (item.stackable) {
            if (activeInventory.some((slot) => slot && slot.itemData && slot.itemData.id === itemId)) return true;
            return activeInventory.indexOf(null) !== -1;
        }

        let emptySlots = 0;
        for (let i = 0; i < activeInventory.length; i++) {
            if (!activeInventory[i]) emptySlots++;
        }
        return emptySlots >= Math.max(1, amount);
    }

    function getItemDataById(itemId) {
        if (!itemId || !ITEM_DB) return null;
        return ITEM_DB[itemId] || null;
    }

    function getInventorySlotsSnapshot() {
        const activeInventory = getActiveInventory();
        const slots = [];
        for (let i = 0; i < activeInventory.length; i++) {
            const slot = activeInventory[i];
            if (!slot || !slot.itemData) {
                slots.push(null);
                continue;
            }
            slots.push({
                itemId: slot.itemData.id,
                amount: Number.isFinite(slot.amount) ? Math.max(0, Math.floor(slot.amount)) : 0,
                stackable: !!slot.itemData.stackable
            });
        }
        return slots;
    }

    function getSkillLevel(skillId) {
        const activeSkills = getActivePlayerSkills();
        if (!skillId || !activeSkills || !activeSkills[skillId]) return 1;
        const level = activeSkills[skillId].level;
        return Number.isFinite(level) ? level : 1;
    }

    function normalizeRequiredLevel(requiredLevel) {
        return Number.isFinite(requiredLevel) ? Math.max(1, Math.floor(requiredLevel)) : 1;
    }

    function formatSkillName(skillId) {
        if (!skillId || typeof skillId !== 'string') return 'that skill';
        return skillId.charAt(0).toUpperCase() + skillId.slice(1);
    }

    function ensureUnlockFlags() {
        const currentPlayerState = getActivePlayerState();
        if (!currentPlayerState.unlockFlags || typeof currentPlayerState.unlockFlags !== 'object') {
            currentPlayerState.unlockFlags = {};
        }
        return currentPlayerState.unlockFlags;
    }

    function hasUnlockFlag(flagId) {
        if (!flagId) return false;
        const flags = ensureUnlockFlags();
        return !!flags[flagId];
    }

    function setUnlockFlag(flagId, enabled) {
        if (!flagId) return false;
        const flags = ensureUnlockFlags();
        flags[flagId] = !!enabled;
        return true;
    }

    function createSkillContext(overrides = {}) {
        const currentPlayerState = getActivePlayerState();
        const currentEquipment = getActiveEquipment();
        const targetObj = overrides.targetObj || currentPlayerState.targetObj;
        const targetX = Number.isInteger(overrides.targetX) ? overrides.targetX : currentPlayerState.targetX;
        const targetY = Number.isInteger(overrides.targetY) ? overrides.targetY : currentPlayerState.targetY;
        const targetZ = Number.isInteger(overrides.targetZ) ? overrides.targetZ : currentPlayerState.z;
        const targetUid = (overrides.targetUid !== undefined ? overrides.targetUid : currentPlayerState.targetUid);

        return {
            skillId: overrides.skillId || resolveSkillIdFromTarget(targetObj),
            targetObj,
            targetX,
            targetY,
            targetZ,
            targetUid,
            hitData: overrides.hitData || null,
            random: Math.random,
            currentTick,
            playerState: currentPlayerState,
            logicalMap,
            heightMap,
            getSkillSpec: (id) => (window.SkillSpecRegistry && typeof SkillSpecRegistry.getSkillSpec === 'function' ? SkillSpecRegistry.getSkillSpec(id) : null),
            getRecipeSet: (id) => (window.SkillSpecRegistry && typeof SkillSpecRegistry.getRecipeSet === 'function' ? SkillSpecRegistry.getRecipeSet(id) : null),
            getNodeTable: (id) => (window.SkillSpecRegistry && typeof SkillSpecRegistry.getNodeTable === 'function' ? SkillSpecRegistry.getNodeTable(id) : null),
            getEconomyTable: (id) => (window.SkillSpecRegistry && typeof SkillSpecRegistry.getEconomyTable === 'function' ? SkillSpecRegistry.getEconomyTable(id) : null),
            getSkillLevel,
            requireSkillLevel: (requiredLevel, options = {}) => {
                const resolvedSkillId = (typeof options.skillId === 'string' && options.skillId)
                    ? options.skillId
                    : ((typeof overrides.skillId === 'string' && overrides.skillId)
                        ? overrides.skillId
                        : resolveSkillIdFromTarget(targetObj));
                const needed = normalizeRequiredLevel(requiredLevel);
                const currentLevel = getSkillLevel(resolvedSkillId);
                if (currentLevel >= needed) return true;
                if (options && options.silent) return false;

                const action = (typeof options.action === 'string' && options.action.trim())
                    ? options.action.trim()
                    : 'do that';
                const message = (typeof options.message === 'string' && options.message.trim())
                    ? options.message.trim()
                    : `You need ${formatSkillName(resolvedSkillId)} level ${needed} to ${action}.`;
                addChatMessage(message, options && options.tone ? options.tone : 'warn');
                return false;
            },
            requireAreaAccess: (options = {}) => {
                const flagId = (typeof options.flagId === 'string' ? options.flagId.trim() : '');
                if (!flagId) return true;
                if (hasUnlockFlag(flagId)) return true;
                if (options && options.silent) return false;
                const areaName = (typeof options.areaName === 'string' && options.areaName.trim())
                    ? options.areaName.trim()
                    : 'that area';
                const message = (typeof options.message === 'string' && options.message.trim())
                    ? options.message.trim()
                    : `You need access to ${areaName} first.`;
                addChatMessage(message, options && options.tone ? options.tone : 'warn');
                return false;
            },
            hasUnlockFlag,
            setUnlockFlag,
            frameNow: overrides.frameNow,
            baseVisualY: overrides.baseVisualY,
            rig: overrides.rig || null,
            playerRig: overrides.playerRig || null,
            equipment: overrides.equipment || currentEquipment,
            setShoulderPivot: overrides.setShoulderPivot || null,
            shoulderPivot: overrides.shoulderPivot || null,
            sourceInvIndex: Number.isInteger(overrides.sourceInvIndex) ? overrides.sourceInvIndex : null,
            sourceItemId: (typeof overrides.sourceItemId === 'string' ? overrides.sourceItemId : null),
            recipeId: (typeof overrides.recipeId === 'string' ? overrides.recipeId : (targetUid && typeof targetUid.recipeId === 'string' ? targetUid.recipeId : null)),
            quantityMode: (typeof overrides.quantityMode === 'string' ? overrides.quantityMode : (targetUid && typeof targetUid.quantityMode === 'string' ? targetUid.quantityMode : null)),
            quantityCount: (Number.isFinite(overrides.quantityCount) ? Math.max(1, Math.floor(overrides.quantityCount)) : (targetUid && Number.isFinite(targetUid.quantityCount) ? Math.max(1, Math.floor(targetUid.quantityCount)) : null)),
            isTargetTile: (tileId) => {
                return logicalMap[targetZ] && logicalMap[targetZ][targetY] && logicalMap[targetZ][targetY][targetX] === tileId;
            },
            hasToolClass,
            getBestToolByClass,
            autoEquipToolClass,
            setToolVisualById: (itemId, heldItemSlot = null) => {
                if (typeof setPlayerRigToolVisual === 'function' && overrides.playerRig) {
                    setPlayerRigToolVisual(overrides.playerRig, itemId, heldItemSlot);
                }
            },
            setToolVisuals: (heldItems, primaryHeldItemSlot = null) => {
                if (typeof setPlayerRigToolVisuals === 'function' && overrides.playerRig) {
                    setPlayerRigToolVisuals(overrides.playerRig, heldItems, primaryHeldItemSlot);
                    return;
                }
                if (typeof setPlayerRigToolVisual === 'function' && overrides.playerRig) {
                    const desiredSlot = primaryHeldItemSlot === 'leftHand' ? 'leftHand' : 'rightHand';
                    const desiredId = heldItems && typeof heldItems === 'object' ? heldItems[desiredSlot] : null;
                    setPlayerRigToolVisual(overrides.playerRig, desiredId || null, desiredSlot);
                }
            },
            hasItem,
            canAcceptItemById,
            getItemDataById,
            getInventorySlotsSnapshot,
            getInventoryCount: (itemId) => (typeof getInventoryCount === 'function' ? getInventoryCount(itemId) : 0),
            getFirstInventorySlotByItemId: (itemId) => (typeof getFirstInventorySlotByItemId === 'function' ? getFirstInventorySlotByItemId(itemId) : -1),
            removeOneItemById: (itemId) => (typeof removeOneItemById === 'function' ? removeOneItemById(itemId) : false),
            removeItemsById: (itemId, amount) => (typeof removeItemsById === 'function' ? removeItemsById(itemId, amount) : 0),
            lightFireAtCurrentTile: (x, y, z) => (typeof lightFireAtCurrentTile === 'function' ? lightFireAtCurrentTile(x, y, z) : false),
            hasActiveFireAt: (x, y, z) => (Array.isArray(activeFires) ? activeFires.some((f) => f.x === x && f.y === y && f.z === z) : false),
            renderInventory: () => { if (typeof renderInventory === 'function') renderInventory(); },
            giveItemById,
            addSkillXp: (skillId, amount) => addSkillXp(skillId, amount),
            addChatMessage: (message, tone = 'info') => addChatMessage(message, tone),
            stopAction: () => { currentPlayerState.action = 'IDLE'; },
            startSkillingAction: () => startFacingAction(`SKILLING: ${targetObj}`, true),
            queueInteract: () => queueAction('INTERACT', targetX, targetY, targetObj),
            queueInteractAt: (obj, x, y, targetUid = null) => queueAction('INTERACT', x, y, obj, targetUid),
            promptAmount: (callback) => {
                if (typeof promptAmount === 'function') {
                    promptAmount(callback);
                    return true;
                }
                return false;
            },
            confirmAction: (message) => {
                if (typeof overrides.confirmAction === 'function') {
                    return !!overrides.confirmAction(message);
                }
                if (typeof window.confirm === 'function') {
                    return !!window.confirm(message);
                }
                return false;
            },
            haltMovement: () => {
                currentPlayerState.path = [];
                currentPlayerState.midX = null;
                currentPlayerState.midY = null;
                currentPlayerState.pendingActionAfterTurn = null;
                currentPlayerState.turnLock = false;
                currentPlayerState.actionVisualReady = true;
                currentPlayerState.action = 'IDLE';
                currentPlayerState.targetX = currentPlayerState.x;
                currentPlayerState.targetY = currentPlayerState.y;
                currentPlayerState.prevX = currentPlayerState.x;
                currentPlayerState.prevY = currentPlayerState.y;
                if (typeof pendingAction !== 'undefined') pendingAction = null;
            },
            spawnClickMarker: (isRed = true) => {
                if (overrides.hitData && overrides.hitData.point) spawnClickMarker(overrides.hitData.point, isRed);
            },
            chopDownTree: (x, y, z) => { if (typeof chopDownTree === 'function') chopDownTree(x, y, z); },
            getRockNodeAt: (x, y, z) => (typeof getRockNodeAt === 'function' ? getRockNodeAt(x, y, z) : null),
            getTreeNodeAt: (x, y, z) => (typeof getTreeNodeAt === 'function' ? getTreeNodeAt(x, y, z) : null),
            getAltarNameAt: (x, y, z) => (typeof window.getRunecraftingAltarNameAt === 'function' ? window.getRunecraftingAltarNameAt(x, y, z) : null),
            depleteRockNode: (x, y, z, respawnTicks) => {
                if (typeof depleteRockNode === 'function') depleteRockNode(x, y, z, respawnTicks);
            },
            tryStepAfterFire: () => (typeof tryStepAfterFire === 'function' ? tryStepAfterFire() : false),
            tryStepBeforeFiremaking: () => (typeof tryStepBeforeFiremaking === 'function' ? tryStepBeforeFiremaking() : false),
            resolveFireTargetFromHit: (hit) => (typeof resolveFireTargetFromHit === 'function' ? resolveFireTargetFromHit(hit) : null),
            startSkillById: (nextSkillId, nextOverrides = {}) => {
                return tryStartSkillById(nextSkillId, Object.assign({}, nextOverrides, { skillId: nextSkillId }));
            }
        };
    }

    function registerSkillModule(skillId, module) {
        if (!skillId || typeof module !== 'object' || !module) return;
        skillRegistry[skillId] = module;
    }

    function getSkillContextMenuOptions(hitData) {
        const skillId = resolveSkillIdFromTarget(hitData && hitData.type);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module || typeof module.getContextMenu !== 'function') return null;

        const context = createSkillContext({
            targetObj: hitData.type,
            targetX: hitData.gridX,
            targetY: hitData.gridY,
            targetZ: getActivePlayerState().z,
            hitData
        });

        const options = module.getContextMenu(context);
        return Array.isArray(options) ? options : null;
    }

    function getSkillTooltip(hitData) {
        const skillId = resolveSkillIdFromTarget(hitData && hitData.type);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module || typeof module.getTooltip !== 'function') return '';

        const context = createSkillContext({
            targetObj: hitData.type,
            targetX: hitData.gridX,
            targetY: hitData.gridY,
            targetZ: getActivePlayerState().z,
            hitData
        });

        const text = module.getTooltip(context);
        return typeof text === 'string' ? text : '';
    }

    function canHandleTarget(targetObj) {
        return !!resolveSkillIdFromTarget(targetObj);
    }

    function tryStartSkillById(skillId, overrides = {}) {
        const module = skillRegistry[skillId];
        if (!module) return false;

        const context = createSkillContext(Object.assign({}, overrides, { skillId }));
        if (typeof module.canStart === 'function' && !module.canStart(context)) return false;

        if (typeof module.onStart === 'function') return !!module.onStart(context);

        if (context.targetObj) {
            context.startSkillingAction();
            return true;
        }

        return false;
    }

    function tryStartFromPlayerTarget() {
        const currentPlayerState = getActivePlayerState();
        const pending = currentPlayerState.pendingSkillStart;
        if (pending) {
            const pendingTargetObj = pending.targetObj || currentPlayerState.targetObj;
            const pendingTargetX = Number.isInteger(pending.targetX) ? pending.targetX : currentPlayerState.targetX;
            const pendingTargetY = Number.isInteger(pending.targetY) ? pending.targetY : currentPlayerState.targetY;
            const pendingZ = Number.isInteger(pending.targetZ) ? pending.targetZ : currentPlayerState.z;
            const pendingSkillId = (typeof pending.skillId === 'string' && pending.skillId)
                ? pending.skillId
                : resolveSkillIdFromTarget(pendingTargetObj);

            const matchesTarget = pendingTargetObj === currentPlayerState.targetObj
                && pendingTargetX === currentPlayerState.targetX
                && pendingTargetY === currentPlayerState.targetY
                && pendingZ === currentPlayerState.z;

            currentPlayerState.pendingSkillStart = null;
            if (matchesTarget && pendingSkillId) {
                return tryStartSkillById(pendingSkillId, Object.assign({}, pending, { skillId: pendingSkillId }));
            }
        }

        const skillId = resolveSkillIdFromTarget(currentPlayerState.targetObj);
        if (!skillId) return false;
        return tryStartSkillById(skillId);
    }

    function tryUseItemOnTarget(overrides = {}) {
        const hitData = overrides.hitData || null;
        const targetObj = overrides.targetObj || (hitData ? hitData.type : null);
        const targetX = Number.isInteger(overrides.targetX) ? overrides.targetX : (hitData ? hitData.gridX : null);
        const targetY = Number.isInteger(overrides.targetY) ? overrides.targetY : (hitData ? hitData.gridY : null);
        const targetZ = Number.isInteger(overrides.targetZ) ? overrides.targetZ : getActivePlayerState().z;

        if (window.DEBUG_COOKING_USE) {
            debugCookingUse(`runtime.tryUseItemOnTarget item=${overrides.sourceItemId || 'none'} target=${targetObj || 'none'} @ (${targetX},${targetY},${targetZ})`);
        }

        const orderedSkillIds = [];
        const preferredSkillId = resolveSkillIdFromTarget(targetObj);
        if (preferredSkillId) orderedSkillIds.push(preferredSkillId);

        const manifestOrdered = Array.isArray(manifest.orderedSkillIds) ? manifest.orderedSkillIds : Object.keys(skillRegistry);
        for (let i = 0; i < manifestOrdered.length; i++) {
            const skillId = manifestOrdered[i];
            if (!skillId || orderedSkillIds.includes(skillId)) continue;
            orderedSkillIds.push(skillId);
        }

        for (let i = 0; i < orderedSkillIds.length; i++) {
            const skillId = orderedSkillIds[i];
            const module = skillRegistry[skillId];
            if (!module || typeof module.onUseItem !== 'function') continue;

            const context = createSkillContext(Object.assign({}, overrides, {
                skillId,
                targetObj,
                targetX,
                targetY,
                targetZ,
                hitData
            }));

            const handled = !!module.onUseItem(context);
            if (window.DEBUG_COOKING_USE) {
                debugCookingUse(`runtime.tryUseItemOnTarget module=${skillId} handled=${handled ? 'yes' : 'no'}`);
            }
            if (handled) return true;
        }

        return false;
    }

    function queuePendingSkillStart(pending) {
        if (!pending || typeof pending !== 'object') return false;
        getActivePlayerState().pendingSkillStart = Object.assign({}, pending);
        return true;
    }

    function handleSkillTick() {
        const skillId = resolveSkillIdFromAction(getActivePlayerState().action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module || typeof module.onTick !== 'function') return false;

        const context = createSkillContext({ skillId });
        module.onTick(context);
        return true;
    }

    function handleSkillAnimation(overrides = {}) {
        const skillId = resolveSkillIdFromAction(getActivePlayerState().action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module || typeof module.onAnimate !== 'function') return false;

        const context = createSkillContext(Object.assign({}, overrides, { skillId }));
        const handled = module.onAnimate(context);
        return handled !== false;
    }

    function getSkillAnimationHeldItemId(overrides = {}) {
        const skillId = resolveSkillIdFromAction(getActivePlayerState().action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module) return null;

        const context = createSkillContext(Object.assign({}, overrides, { skillId }));
        if (typeof module.getAnimationHeldItemId === 'function') {
            const heldItemId = module.getAnimationHeldItemId(context);
            return (typeof heldItemId === 'string' && heldItemId) ? heldItemId : null;
        }
        if (typeof module.getAnimationHeldItems === 'function') {
            const heldItems = module.getAnimationHeldItems(context);
            if (!heldItems || typeof heldItems !== 'object') return null;
            if (typeof heldItems.rightHand === 'string' && heldItems.rightHand) return heldItems.rightHand;
            if (typeof heldItems.leftHand === 'string' && heldItems.leftHand) return heldItems.leftHand;
        }
        return null;
    }

    function getSkillAnimationHeldItemSlot(overrides = {}) {
        const skillId = resolveSkillIdFromAction(getActivePlayerState().action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module) return null;

        const context = createSkillContext(Object.assign({}, overrides, { skillId }));
        if (typeof module.getAnimationHeldItemSlot === 'function') {
            const heldItemSlot = module.getAnimationHeldItemSlot(context);
            return heldItemSlot === 'leftHand' ? 'leftHand' : (heldItemSlot === 'rightHand' ? 'rightHand' : null);
        }
        if (typeof module.getAnimationHeldItems === 'function') {
            const heldItems = module.getAnimationHeldItems(context);
            if (!heldItems || typeof heldItems !== 'object') return null;
            if (typeof heldItems.rightHand === 'string' && heldItems.rightHand) return 'rightHand';
            if (typeof heldItems.leftHand === 'string' && heldItems.leftHand) return 'leftHand';
        }
        return null;
    }

    function getSkillAnimationHeldItems(overrides = {}) {
        const skillId = resolveSkillIdFromAction(getActivePlayerState().action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module) return null;

        const context = createSkillContext(Object.assign({}, overrides, { skillId }));
        if (typeof module.getAnimationHeldItems === 'function') {
            const heldItems = module.getAnimationHeldItems(context);
            if (!heldItems || typeof heldItems !== 'object') return null;
            const normalized = {};
            if (typeof heldItems.rightHand === 'string' && heldItems.rightHand) normalized.rightHand = heldItems.rightHand;
            else if (heldItems.rightHand === null) normalized.rightHand = null;
            if (typeof heldItems.leftHand === 'string' && heldItems.leftHand) normalized.leftHand = heldItems.leftHand;
            else if (heldItems.leftHand === null) normalized.leftHand = null;
            return Object.keys(normalized).length > 0 ? normalized : null;
        }

        if (typeof module.getAnimationHeldItemId !== 'function') return null;
        const heldItemId = module.getAnimationHeldItemId(context);
        if (!(typeof heldItemId === 'string' && heldItemId)) return null;
        const heldItemSlot = typeof module.getAnimationHeldItemSlot === 'function'
            ? module.getAnimationHeldItemSlot(context)
            : null;
        if (heldItemSlot === 'leftHand') return { leftHand: heldItemId };
        return { rightHand: heldItemId };
    }

    function getSkillAnimationSuppressEquipmentVisual(overrides = {}) {
        const skillId = resolveSkillIdFromAction(getActivePlayerState().action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module || typeof module.getAnimationSuppressEquipmentVisual !== 'function') return false;

        const context = createSkillContext(Object.assign({}, overrides, { skillId }));
        return !!module.getAnimationSuppressEquipmentVisual(context);
    }

    window.SkillRuntime = {
        registerSkillModule,
        canHandleTarget,
        getSkillContextMenuOptions,
        getSkillTooltip,
        tryStartSkillById,
        tryStartFromPlayerTarget,
        tryUseItemOnTarget,
        queuePendingSkillStart,
        handleSkillTick,
        handleSkillAnimation,
        getSkillAnimationHeldItems,
        getSkillAnimationHeldItemId,
        getSkillAnimationHeldItemSlot,
        getSkillAnimationSuppressEquipmentVisual
    };
})();













