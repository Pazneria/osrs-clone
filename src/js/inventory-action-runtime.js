(function () {
    function getInventory(context = {}) {
        return Array.isArray(context.inventory) ? context.inventory : [];
    }

    function getSlotItemId(slot) {
        return slot && slot.itemData && typeof slot.itemData.id === 'string'
            ? slot.itemData.id
            : null;
    }

    function getRunecraftingPouchRuntime(context = {}) {
        return context.RunecraftingPouchRuntime
            || (typeof window !== 'undefined' ? window.RunecraftingPouchRuntime : null)
            || null;
    }

    function getSkillRuntime(context = {}) {
        return context.SkillRuntime
            || (typeof window !== 'undefined' ? window.SkillRuntime : null)
            || null;
    }

    function getRunecraftingPouchContext(context = {}) {
        return typeof context.createRunecraftingPouchContext === 'function'
            ? context.createRunecraftingPouchContext()
            : {};
    }

    function tryUseItemOnInventory(context = {}, sourceInvIndex, targetInvIndex) {
        const inventory = getInventory(context);
        const source = inventory[sourceInvIndex];
        const target = inventory[targetInvIndex];
        const sourceItemId = getSlotItemId(source);
        const targetItemId = getSlotItemId(target);
        if (!sourceItemId || !targetItemId) return false;

        const pouchRuntime = getRunecraftingPouchRuntime(context);
        if (pouchRuntime && typeof pouchRuntime.tryUseItemOnInventory === 'function') {
            const pouchUsed = pouchRuntime.tryUseItemOnInventory(getRunecraftingPouchContext(context), sourceItemId, targetItemId);
            if (pouchUsed) return true;
        }

        const skillRuntime = getSkillRuntime(context);
        if (skillRuntime && typeof skillRuntime.tryUseItemOnTarget === 'function') {
            const skillUsed = skillRuntime.tryUseItemOnTarget({
                targetObj: 'INVENTORY',
                targetUid: {
                    sourceInvIndex,
                    targetInvIndex,
                    sourceItemId,
                    targetItemId
                },
                sourceInvIndex,
                sourceItemId
            });
            if (skillUsed) return true;
        }

        const firemakingSourceItemId = typeof context.getFiremakingLogItemIdForPair === 'function'
            ? context.getFiremakingLogItemIdForPair(sourceItemId, targetItemId)
            : null;
        if (firemakingSourceItemId && typeof context.startFiremaking === 'function') {
            return context.startFiremaking(firemakingSourceItemId);
        }

        return false;
    }

    function tryUseItemOnWorld(context = {}, sourceInvIndex, hitData) {
        const source = getInventory(context)[sourceInvIndex];
        if (!source || !hitData) return false;
        return false;
    }

    function handleInventorySlotClick(context = {}, invIndex) {
        const selected = typeof context.getSelectedUseItem === 'function'
            ? context.getSelectedUseItem()
            : null;

        if (selected) {
            const selectedUse = context.selectedUse || {};
            if (selectedUse.invIndex !== invIndex && tryUseItemOnInventory(context, selectedUse.invIndex, invIndex)) {
                if (typeof context.clearSelectedUse === 'function') context.clearSelectedUse();
                return true;
            }
            if (typeof context.clearSelectedUse === 'function') context.clearSelectedUse();
            return true;
        }

        const slot = getInventory(context)[invIndex];
        if (!slot || !slot.itemData) return false;
        const prefKey = typeof context.getItemMenuPreferenceKey === 'function'
            ? context.getItemMenuPreferenceKey('inventory', slot.itemData.id)
            : null;
        const actionName = typeof context.resolveDefaultItemAction === 'function'
            ? context.resolveDefaultItemAction(slot.itemData, prefKey)
            : null;
        return handleItemAction(context, invIndex, actionName);
    }

    function handleItemAction(context = {}, invIndex, actionName) {
        const invSlot = getInventory(context)[invIndex];
        if (!invSlot || !invSlot.itemData) return false;
        const item = invSlot.itemData;
        const pouchRuntime = getRunecraftingPouchRuntime(context);

        if (actionName === 'Use') {
            if (pouchRuntime && typeof pouchRuntime.tryUsePouch === 'function') {
                const pouchUsed = pouchRuntime.tryUsePouch(getRunecraftingPouchContext(context), item.id);
                if (pouchUsed) return true;
            }
            if (typeof context.selectUseItem === 'function') context.selectUseItem(invIndex);
            return true;
        }

        if (typeof actionName === 'string' && actionName.startsWith('Empty')) {
            if (pouchRuntime && typeof pouchRuntime.tryUsePouch === 'function') {
                const pouchUsed = pouchRuntime.tryUsePouch(getRunecraftingPouchContext(context), item.id, { forceEmpty: true });
                if (pouchUsed) return true;
            }
        }

        if (actionName === 'Equip' && typeof context.equipItem === 'function') {
            context.equipItem(invIndex);
            return true;
        }
        if (actionName === 'Eat' && typeof context.eatItem === 'function') {
            context.eatItem(invIndex);
            return true;
        }
        if (actionName === 'Drop' && typeof context.dropItem === 'function') {
            context.dropItem(invIndex);
            return true;
        }
        return false;
    }

    window.InventoryActionRuntime = {
        handleInventorySlotClick,
        handleItemAction,
        tryUseItemOnInventory,
        tryUseItemOnWorld
    };
})();
