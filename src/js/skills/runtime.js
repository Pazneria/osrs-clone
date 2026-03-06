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

    function createSkillContext(overrides = {}) {
        const targetObj = overrides.targetObj || playerState.targetObj;
        const targetX = Number.isInteger(overrides.targetX) ? overrides.targetX : playerState.targetX;
        const targetY = Number.isInteger(overrides.targetY) ? overrides.targetY : playerState.targetY;
        const targetZ = Number.isInteger(overrides.targetZ) ? overrides.targetZ : playerState.z;

        return {
            skillId: overrides.skillId || resolveSkillIdFromTarget(targetObj),
            targetObj,
            targetX,
            targetY,
            targetZ,
            hitData: overrides.hitData || null,
            random: Math.random,
            currentTick,
            playerState,
            logicalMap,
            heightMap,
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
            getInventoryCount: (itemId) => (typeof getInventoryCount === 'function' ? getInventoryCount(itemId) : 0),
            removeOneItemById: (itemId) => (typeof removeOneItemById === 'function' ? removeOneItemById(itemId) : false),
            removeItemsById: (itemId, amount) => (typeof removeItemsById === 'function' ? removeItemsById(itemId, amount) : 0),
            lightFireAtCurrentTile: () => (typeof lightFireAtCurrentTile === 'function' ? lightFireAtCurrentTile() : false),
            renderInventory: () => { if (typeof renderInventory === 'function') renderInventory(); },
            giveItemById,
            addSkillXp: (skillId, amount) => addSkillXp(skillId, amount),
            addChatMessage: (message, tone = 'info') => addChatMessage(message, tone),
            stopAction: () => { playerState.action = 'IDLE'; },
            startSkillingAction: () => startFacingAction(`SKILLING: ${targetObj}`, true),
            queueInteract: () => queueAction('INTERACT', targetX, targetY, targetObj),
            spawnClickMarker: (isRed = true) => {
                if (overrides.hitData && overrides.hitData.point) spawnClickMarker(overrides.hitData.point, isRed);
            },
            chopDownTree: (x, y, z) => { if (typeof chopDownTree === 'function') chopDownTree(x, y, z); },
            getRockNodeAt: (x, y, z) => (typeof getRockNodeAt === 'function' ? getRockNodeAt(x, y, z) : null),
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

            if (module.onUseItem(context)) return true;
        }

        return false;
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
        handleSkillTick,
        handleSkillAnimation
    };
})();
