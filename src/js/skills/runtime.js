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

        const equipped = equipment && equipment.weapon;
        if (equipped && equipped.weaponClass === toolClass) candidates.push(equipped);

        for (let i = 0; i < inventory.length; i++) {
            const slot = inventory[i];
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
        return inventory.some(i => i && i.itemData && i.itemData.id === itemId);
    }
    function canAcceptItemById(itemId, amount = 1) {
        if (!itemId || !ITEM_DB || !ITEM_DB[itemId]) return false;
        const item = ITEM_DB[itemId];
        if (item.stackable) {
            if (inventory.some((slot) => slot && slot.itemData && slot.itemData.id === itemId)) return true;
            return inventory.indexOf(null) !== -1;
        }

        let emptySlots = 0;
        for (let i = 0; i < inventory.length; i++) {
            if (!inventory[i]) emptySlots++;
        }
        return emptySlots >= Math.max(1, amount);
    }

    function getItemDataById(itemId) {
        if (!itemId || !ITEM_DB) return null;
        return ITEM_DB[itemId] || null;
    }

    function getInventorySlotsSnapshot() {
        const slots = [];
        for (let i = 0; i < inventory.length; i++) {
            const slot = inventory[i];
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
        if (!skillId || !playerSkills || !playerSkills[skillId]) return 1;
        const level = playerSkills[skillId].level;
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
        if (!playerState.unlockFlags || typeof playerState.unlockFlags !== 'object') {
            playerState.unlockFlags = {};
        }
        return playerState.unlockFlags;
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
        const targetObj = overrides.targetObj || playerState.targetObj;
        const targetX = Number.isInteger(overrides.targetX) ? overrides.targetX : playerState.targetX;
        const targetY = Number.isInteger(overrides.targetY) ? overrides.targetY : playerState.targetY;
        const targetZ = Number.isInteger(overrides.targetZ) ? overrides.targetZ : playerState.z;
        const targetUid = (overrides.targetUid !== undefined ? overrides.targetUid : playerState.targetUid);

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
            playerState,
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
            hasUnlockFlag,
            setUnlockFlag,
            frameNow: overrides.frameNow,
            baseVisualY: overrides.baseVisualY,
            rig: overrides.rig || null,
            playerRig: overrides.playerRig || null,
            equipment: overrides.equipment || equipment,
            setShoulderPivot: overrides.setShoulderPivot || null,
            shoulderPivot: overrides.shoulderPivot || null,
            applyRockMiningPose: overrides.applyRockMiningPose || null,
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
            setToolVisualById: (itemId) => {
                if (typeof setPlayerRigToolVisual === 'function' && overrides.playerRig) setPlayerRigToolVisual(overrides.playerRig, itemId);
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
            stopAction: () => { playerState.action = 'IDLE'; },
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
            haltMovement: () => {
                playerState.path = [];
                playerState.midX = null;
                playerState.midY = null;
                playerState.pendingActionAfterTurn = null;
                playerState.turnLock = false;
                playerState.actionVisualReady = true;
                playerState.action = 'IDLE';
                playerState.targetX = playerState.x;
                playerState.targetY = playerState.y;
                playerState.prevX = playerState.x;
                playerState.prevY = playerState.y;
                if (typeof pendingAction !== 'undefined') pendingAction = null;
            },
            spawnClickMarker: (isRed = true) => {
                if (overrides.hitData && overrides.hitData.point) spawnClickMarker(overrides.hitData.point, isRed);
            },
            chopDownTree: (x, y, z) => { if (typeof chopDownTree === 'function') chopDownTree(x, y, z); },
            getRockNodeAt: (x, y, z) => (typeof getRockNodeAt === 'function' ? getRockNodeAt(x, y, z) : null),
            getAltarNameAt: (x, y, z) => (typeof window.getRunecraftingAltarNameAt === 'function' ? window.getRunecraftingAltarNameAt(x, y, z) : null),
            depleteRockNode: (x, y, z, respawnTicks) => {
                if (typeof depleteRockNode === 'function') depleteRockNode(x, y, z, respawnTicks);
            },
            tryStepAfterFire: () => (typeof tryStepAfterFire === 'function' ? tryStepAfterFire() : false),
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
            targetZ: playerState.z,
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
            targetZ: playerState.z,
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
        const pending = playerState.pendingSkillStart;
        if (pending) {
            const pendingTargetObj = pending.targetObj || playerState.targetObj;
            const pendingTargetX = Number.isInteger(pending.targetX) ? pending.targetX : playerState.targetX;
            const pendingTargetY = Number.isInteger(pending.targetY) ? pending.targetY : playerState.targetY;
            const pendingZ = Number.isInteger(pending.targetZ) ? pending.targetZ : playerState.z;
            const pendingSkillId = (typeof pending.skillId === 'string' && pending.skillId)
                ? pending.skillId
                : resolveSkillIdFromTarget(pendingTargetObj);

            const matchesTarget = pendingTargetObj === playerState.targetObj
                && pendingTargetX === playerState.targetX
                && pendingTargetY === playerState.targetY
                && pendingZ === playerState.z;

            playerState.pendingSkillStart = null;
            if (matchesTarget && pendingSkillId) {
                return tryStartSkillById(pendingSkillId, Object.assign({}, pending, { skillId: pendingSkillId }));
            }
        }

        const skillId = resolveSkillIdFromTarget(playerState.targetObj);
        if (!skillId) return false;
        return tryStartSkillById(skillId);
    }

    function tryUseItemOnTarget(overrides = {}) {
        const hitData = overrides.hitData || null;
        const targetObj = overrides.targetObj || (hitData ? hitData.type : null);
        const targetX = Number.isInteger(overrides.targetX) ? overrides.targetX : (hitData ? hitData.gridX : null);
        const targetY = Number.isInteger(overrides.targetY) ? overrides.targetY : (hitData ? hitData.gridY : null);
        const targetZ = Number.isInteger(overrides.targetZ) ? overrides.targetZ : playerState.z;

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
        playerState.pendingSkillStart = Object.assign({}, pending);
        return true;
    }

    function handleSkillTick() {
        const skillId = resolveSkillIdFromAction(playerState.action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module || typeof module.onTick !== 'function') return false;

        const context = createSkillContext({ skillId });
        module.onTick(context);
        return true;
    }

    function handleSkillAnimation(overrides = {}) {
        const skillId = resolveSkillIdFromAction(playerState.action);
        const module = skillId ? skillRegistry[skillId] : null;
        if (!module || typeof module.onAnimate !== 'function') return false;

        const context = createSkillContext(Object.assign({}, overrides, { skillId }));
        module.onAnimate(context);
        return true;
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
        handleSkillAnimation
    };
})();








