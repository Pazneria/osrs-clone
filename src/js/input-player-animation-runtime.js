(function () {
    const FISHING_START_ACTION_STARTED_AT_STATE_KEY = 'fishingCastStartedAt';
    const FISHING_START_ACTION_REQUEST_WINDOW_MS = 250;

    function getActionName(playerState) {
        return playerState && typeof playerState.action === 'string' ? playerState.action : '';
    }

    function isMiningSkillAction(actionName) {
        return actionName === 'SKILLING: ROCK';
    }

    function isWoodcuttingSkillAction(actionName) {
        return actionName === 'SKILLING: TREE';
    }

    function isCookingSkillAction(actionName) {
        return actionName === 'SKILLING: FIRE';
    }

    function isCraftingSkillAction(actionName) {
        return actionName === 'SKILLING: CRAFTING';
    }

    function isRunecraftingSkillAction(actionName) {
        return actionName === 'SKILLING: ALTAR_CANDIDATE';
    }

    function isSmithingSmeltingSkillAction(actionName) {
        return actionName === 'SKILLING: FURNACE';
    }

    function isSmithingForgingSkillAction(actionName) {
        return actionName === 'SKILLING: ANVIL';
    }

    function isFiremakingSkillAction(actionName) {
        return actionName === 'SKILLING: FIREMAKING';
    }

    function isFletchingSkillAction(actionName) {
        return actionName === 'SKILLING: FLETCHING';
    }

    function isFishingSkillAction(actionName) {
        return actionName === 'SKILLING: WATER';
    }

    function isAnySkillingAction(actionName) {
        return typeof actionName === 'string' && actionName.startsWith('SKILLING:');
    }

    function getFishingSkillMethodId(playerState) {
        return playerState && typeof playerState.fishingActiveMethodId === 'string'
            ? playerState.fishingActiveMethodId
            : null;
    }

    function isHarpoonFishingMethodId(methodId) {
        return typeof methodId === 'string' && methodId.includes('harpoon');
    }

    function getFishingStartActionStartedAt(playerState) {
        if (!isFishingSkillAction(getActionName(playerState))) return null;
        const startedAt = playerState ? playerState[FISHING_START_ACTION_STARTED_AT_STATE_KEY] : null;
        return Number.isFinite(startedAt) ? startedAt : null;
    }

    function getFishingStartActionClipId(playerState) {
        if (!isFishingSkillAction(getActionName(playerState))) return null;
        const methodId = getFishingSkillMethodId(playerState);
        if (methodId === 'rod') return 'player/fishing_rod_cast1';
        if (isHarpoonFishingMethodId(methodId)) return 'player/fishing_harpoon_strike1';
        return null;
    }

    function getFishingSkillBaseClipId(playerState) {
        if (!isFishingSkillAction(getActionName(playerState))) return null;
        const methodId = getFishingSkillMethodId(playerState);
        if (isHarpoonFishingMethodId(methodId)) return 'player/fishing_harpoon_hold1';
        if (!methodId) return null;
        if (methodId === 'rod') return 'player/fishing_rod_hold1';
        return 'player/fishing_net1';
    }

    function getActiveSkillBaseClipId(playerState) {
        const actionName = getActionName(playerState);
        if (isMiningSkillAction(actionName)) return 'player/mining1';
        if (isWoodcuttingSkillAction(actionName)) return 'player/woodcutting1';
        if (isCookingSkillAction(actionName)) return 'player/cooking1';
        if (isCraftingSkillAction(actionName)) return 'player/crafting1';
        if (isRunecraftingSkillAction(actionName)) return 'player/runecrafting1';
        if (isSmithingSmeltingSkillAction(actionName)) return 'player/smithing_smelting1';
        if (isSmithingForgingSkillAction(actionName)) return 'player/smithing_forging1';
        if (isFiremakingSkillAction(actionName)) return 'player/firemaking1';
        if (isFletchingSkillAction(actionName)) return 'player/fletching1';
        return getFishingSkillBaseClipId(playerState);
    }

    function normalizeSkillAnimationHeldItems(heldItems) {
        if (!heldItems || typeof heldItems !== 'object') return null;
        const normalized = {};
        if (typeof heldItems.rightHand === 'string' && heldItems.rightHand) normalized.rightHand = heldItems.rightHand;
        else if (heldItems.rightHand === null) normalized.rightHand = null;
        if (typeof heldItems.leftHand === 'string' && heldItems.leftHand) normalized.leftHand = heldItems.leftHand;
        else if (heldItems.leftHand === null) normalized.leftHand = null;
        return Object.keys(normalized).length > 0 ? normalized : null;
    }

    function getActiveSkillAnimationHeldItems(skillRuntime) {
        if (!skillRuntime || typeof skillRuntime.getSkillAnimationHeldItems !== 'function') return null;
        return normalizeSkillAnimationHeldItems(skillRuntime.getSkillAnimationHeldItems());
    }

    function getActiveSkillAnimationHeldItemId(skillRuntime) {
        const heldItems = getActiveSkillAnimationHeldItems(skillRuntime);
        if (heldItems) {
            if (typeof heldItems.rightHand === 'string' && heldItems.rightHand) return heldItems.rightHand;
            if (typeof heldItems.leftHand === 'string' && heldItems.leftHand) return heldItems.leftHand;
        }
        if (!skillRuntime || typeof skillRuntime.getSkillAnimationHeldItemId !== 'function') return null;
        const heldItemId = skillRuntime.getSkillAnimationHeldItemId();
        return (typeof heldItemId === 'string' && heldItemId) ? heldItemId : null;
    }

    function getActiveSkillAnimationHeldItemSlot(skillRuntime) {
        if (!skillRuntime || typeof skillRuntime.getSkillAnimationHeldItemSlot !== 'function') {
            const heldItems = getActiveSkillAnimationHeldItems(skillRuntime);
            if (!heldItems) return null;
            if (typeof heldItems.rightHand === 'string' && heldItems.rightHand) return 'rightHand';
            if (typeof heldItems.leftHand === 'string' && heldItems.leftHand) return 'leftHand';
            return null;
        }
        const heldItemSlot = skillRuntime.getSkillAnimationHeldItemSlot();
        return heldItemSlot === 'leftHand'
            ? 'leftHand'
            : (heldItemSlot === 'rightHand' ? 'rightHand' : null);
    }

    function getActiveSkillAnimationSuppressEquipmentVisual(skillRuntime) {
        if (!skillRuntime || typeof skillRuntime.getSkillAnimationSuppressEquipmentVisual !== 'function') return false;
        return !!skillRuntime.getSkillAnimationSuppressEquipmentVisual();
    }

    function hasSkillingToolVisual(playerRigRef) {
        return !!(playerRigRef && playerRigRef.userData && (
            playerRigRef.userData.skillingToolVisualId
            || (playerRigRef.userData.skillingToolVisuals
                && (playerRigRef.userData.skillingToolVisuals.rightHand || playerRigRef.userData.skillingToolVisuals.leftHand))
        ));
    }

    function shouldShowRigToolVisual(options = {}) {
        const playerRigRef = options.playerRigRef || null;
        const activeSkillHeldItems = getActiveSkillAnimationHeldItems(options.skillRuntime || null);
        const hasActiveSkillHeldItems = !!(activeSkillHeldItems && (activeSkillHeldItems.rightHand || activeSkillHeldItems.leftHand));
        if (getActiveSkillAnimationSuppressEquipmentVisual(options.skillRuntime || null)) {
            return hasActiveSkillHeldItems || hasSkillingToolVisual(playerRigRef);
        }
        if (options.equipment && options.equipment.weapon) return true;
        if (!getActiveSkillBaseClipId(options.playerState || null)) return false;
        if (hasActiveSkillHeldItems) return true;
        return hasSkillingToolVisual(playerRigRef);
    }

    function getPlayerBaseClipId(options = {}) {
        if (options.isMoving) {
            if (options.logicalTilesMoved > 1 || (options.isRunning && options.logicalTilesMoved > 0)) return 'player/run';
            return 'player/walk';
        }
        return getActiveSkillBaseClipId(options.playerState || null) || 'player/idle';
    }

    function buildBaseClipOptions(options = {}) {
        const skillRuntime = options.skillRuntime || null;
        const heldItems = getActiveSkillAnimationHeldItems(skillRuntime);
        const heldItemId = getActiveSkillAnimationHeldItemId(skillRuntime);
        const heldItemSlot = getActiveSkillAnimationHeldItemSlot(skillRuntime);
        const hasHeldItems = !!(heldItems && (heldItems.rightHand || heldItems.leftHand));
        const baseClipOptions = (hasHeldItems || heldItemId || heldItemSlot) ? {} : undefined;
        if (baseClipOptions && heldItems) baseClipOptions.heldItems = heldItems;
        if (baseClipOptions && heldItemId) baseClipOptions.heldItemId = heldItemId;
        if (baseClipOptions && heldItemSlot) baseClipOptions.heldItemSlot = heldItemSlot;
        return {
            heldItems,
            heldItemId,
            heldItemSlot,
            suppressEquipmentVisual: getActiveSkillAnimationSuppressEquipmentVisual(skillRuntime),
            baseClipOptions
        };
    }

    function buildFishingStartActionClipRequest(options = {}) {
        const playerState = options.playerState || null;
        const frameNow = Number(options.frameNow);
        const startedAt = getFishingStartActionStartedAt(playerState);
        const clipId = getFishingStartActionClipId(playerState);
        if (!clipId || !Number.isFinite(startedAt) || !Number.isFinite(frameNow)) return null;
        if ((frameNow - startedAt) < 0 || (frameNow - startedAt) > FISHING_START_ACTION_REQUEST_WINDOW_MS) return null;
        const actionOptions = {
            startedAtMs: startedAt,
            startKey: `${clipId}:${startedAt}`,
            priority: 0
        };
        if (options.heldItems) actionOptions.heldItems = options.heldItems;
        if (options.heldItemId) actionOptions.heldItemId = options.heldItemId;
        if (options.heldItemSlot) actionOptions.heldItemSlot = options.heldItemSlot;
        return { clipId, actionOptions };
    }

    window.InputPlayerAnimationRuntime = {
        FISHING_START_ACTION_STARTED_AT_STATE_KEY,
        FISHING_START_ACTION_REQUEST_WINDOW_MS,
        isMiningSkillAction,
        isWoodcuttingSkillAction,
        isCookingSkillAction,
        isCraftingSkillAction,
        isRunecraftingSkillAction,
        isSmithingSmeltingSkillAction,
        isSmithingForgingSkillAction,
        isFiremakingSkillAction,
        isFletchingSkillAction,
        isFishingSkillAction,
        isAnySkillingAction,
        getFishingSkillMethodId,
        isHarpoonFishingMethodId,
        getFishingStartActionStartedAt,
        getFishingStartActionClipId,
        getFishingSkillBaseClipId,
        getActiveSkillBaseClipId,
        normalizeSkillAnimationHeldItems,
        getActiveSkillAnimationHeldItems,
        getActiveSkillAnimationHeldItemId,
        getActiveSkillAnimationHeldItemSlot,
        getActiveSkillAnimationSuppressEquipmentVisual,
        shouldShowRigToolVisual,
        getPlayerBaseClipId,
        buildBaseClipOptions,
        buildFishingStartActionClipRequest
    };
})();
