(function () {
    function getInventory(context = {}) {
        return Array.isArray(context.inventory) ? context.inventory : [];
    }

    function clearSelectedUseForSlot(context = {}, index, options = {}) {
        const selectedUse = context.selectedUse || {};
        if (selectedUse.invIndex !== index) return;
        const inventory = getInventory(context);
        const slot = inventory[index];
        if (options.preserveMatchingSelection && slot && slot.itemData && slot.itemData.id === selectedUse.itemId) return;
        if (typeof context.clearSelectedUse === 'function') context.clearSelectedUse(false);
    }

    function renderInventory(context = {}) {
        if (typeof context.renderInventory === 'function') context.renderInventory();
    }

    function giveItem(context = {}, itemData, amount = 1) {
        const inventory = getInventory(context);
        if (!itemData || !itemData.id) return 0;
        const requestedAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
        if (requestedAmount <= 0) return 0;

        if (itemData.stackable) {
            const existingIdx = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.id === itemData.id);
            if (existingIdx !== -1) {
                inventory[existingIdx].amount += requestedAmount;
                renderInventory(context);
                return requestedAmount;
            }

            const emptyIdx = inventory.indexOf(null);
            if (emptyIdx !== -1) {
                inventory[emptyIdx] = { itemData, amount: requestedAmount };
                renderInventory(context);
                return requestedAmount;
            }
            return 0;
        }

        let itemsGiven = 0;
        for (let i = 0; i < requestedAmount; i++) {
            const emptyIdx = inventory.indexOf(null);
            if (emptyIdx === -1) break;
            inventory[emptyIdx] = { itemData, amount: 1 };
            itemsGiven++;
        }
        if (itemsGiven > 0) renderInventory(context);
        return itemsGiven;
    }

    function getInventoryCount(context = {}, itemId) {
        return getInventory(context).reduce((sum, slot) => {
            if (!slot || !slot.itemData || slot.itemData.id !== itemId) return sum;
            return sum + slot.amount;
        }, 0);
    }

    function getFirstInventorySlotByItemId(context = {}, itemId) {
        if (!itemId) return -1;
        const inventory = getInventory(context);
        for (let i = 0; i < inventory.length; i++) {
            const slot = inventory[i];
            if (!slot || !slot.itemData) continue;
            if (slot.itemData.id === itemId && slot.amount > 0) return i;
        }
        return -1;
    }

    function removeOneItemById(context = {}, itemId) {
        const inventory = getInventory(context);
        for (let i = 0; i < inventory.length; i++) {
            const slot = inventory[i];
            if (!slot || !slot.itemData || slot.itemData.id !== itemId) continue;

            slot.amount -= 1;
            if (slot.amount <= 0) inventory[i] = null;
            clearSelectedUseForSlot(context, i);
            return true;
        }
        return false;
    }

    function removeItemsById(context = {}, itemId, amount) {
        const inventory = getInventory(context);
        if (!itemId || amount <= 0) return 0;
        let removed = 0;

        for (let i = 0; i < inventory.length && removed < amount; i++) {
            const slot = inventory[i];
            if (!slot || !slot.itemData || slot.itemData.id !== itemId) continue;

            const take = Math.min(slot.amount, amount - removed);
            slot.amount -= take;
            removed += take;

            if (slot.amount <= 0) inventory[i] = null;
            clearSelectedUseForSlot(context, i, { preserveMatchingSelection: true });
        }

        return removed;
    }

    window.InventoryItemRuntime = {
        getFirstInventorySlotByItemId,
        getInventoryCount,
        giveItem,
        removeItemsById,
        removeOneItemById
    };
})();
