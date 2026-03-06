(function () {
    const manifest = window.SkillManifest || {};
    const targetToSkillId = manifest.targetToSkillId || {
        TREE: 'woodcutting',
        ROCK: 'mining',
        FISHING_SPOT: 'fishing'
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

    function hasToolClass(toolClass) {
        if (typeof hasWeaponClassAvailable === 'function') return hasWeaponClassAvailable(toolClass);

        if (toolClass === 'axe') {
            return !!((equipment.weapon && equipment.weapon.id === 'iron_axe') || inventory.some(i => i && i.itemData.id === 'iron_axe'));
        }

        if (toolClass === 'pickaxe') {
            return !!((equipment.weapon && equipment.weapon.weaponClass === 'pickaxe') || inventory.some(i => i && i.itemData && i.itemData.weaponClass === 'pickaxe'));
        }

        return false;
    }

    function autoEquipToolClass(toolClass) {
        if (typeof autoEquipWeaponClass === 'function') autoEquipWeaponClass(toolClass);
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
            isTargetTile: (tileId) => {
                return logicalMap[targetZ] && logicalMap[targetZ][targetY] && logicalMap[targetZ][targetY][targetX] === tileId;
            },
            hasToolClass,
            autoEquipToolClass,
            hasItem,
            getInventoryCount: (itemId) => (typeof getInventoryCount === 'function' ? getInventoryCount(itemId) : 0),
            removeOneItemById: (itemId) => (typeof removeOneItemById === 'function' ? removeOneItemById(itemId) : false),
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
            depleteRockNode: (x, y, z, respawnTicks) => {
                if (typeof depleteRockNode === 'function') depleteRockNode(x, y, z, respawnTicks);
            },
            tryStepAfterFire: () => (typeof tryStepAfterFire === 'function' ? tryStepAfterFire() : false)
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
        handleSkillTick,
        handleSkillAnimation
    };
})();
