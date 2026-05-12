(function () {
    function getInventory(context = {}) {
        return Array.isArray(context.inventory) ? context.inventory : [];
    }

    function getEquipment(context = {}) {
        return context.equipment && typeof context.equipment === 'object' ? context.equipment : {};
    }

    function getSkillLevel(context = {}, skillName) {
        const skills = context.playerSkills || {};
        const skill = skills[skillName] || {};
        return Number.isFinite(skill.level) ? Math.max(1, Math.floor(skill.level)) : 1;
    }

    function getRequiredLevel(item, propertyName) {
        return Number.isFinite(item && item[propertyName])
            ? Math.max(1, Math.floor(item[propertyName]))
            : 0;
    }

    function addChatMessage(context = {}, message, tone = 'game') {
        if (typeof context.addChatMessage === 'function') context.addChatMessage(message, tone);
    }

    function refreshEquipmentState(context = {}) {
        if (typeof context.clearSelectedUse === 'function') context.clearSelectedUse(false);
        if (typeof context.updateStats === 'function') context.updateStats();
        if (typeof context.renderInventory === 'function') context.renderInventory();
        if (typeof context.renderEquipment === 'function') context.renderEquipment();
        if (typeof context.updatePlayerModel === 'function') context.updatePlayerModel();
    }

    function resolveEquipmentSlot(equipment, item) {
        if (!item) return null;
        if (item.type && Object.prototype.hasOwnProperty.call(equipment, item.type)) return item.type;
        if (item.weaponClass && Object.prototype.hasOwnProperty.call(equipment, 'weapon')) return 'weapon';
        return null;
    }

    function getEquipmentEntryItem(entry) {
        if (!entry || typeof entry !== 'object') return null;
        if (entry.itemData && typeof entry.itemData === 'object') return entry.itemData;
        return entry;
    }

    function getEquipmentEntryAmount(entry) {
        if (!entry || typeof entry !== 'object') return 0;
        const amount = Number(entry.amount);
        return Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
    }

    function getInventorySlotAmount(slot) {
        if (!slot || typeof slot !== 'object') return 0;
        const amount = Number(slot.amount);
        return Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
    }

    function createEquipmentEntry(item, amount) {
        if (!item) return null;
        if (item.stackable) return { itemData: item, amount: Math.max(1, Math.floor(Number(amount) || 1)) };
        return item;
    }

    function createInventorySlot(item, amount) {
        if (!item) return null;
        return {
            itemData: item,
            amount: item.stackable ? Math.max(1, Math.floor(Number(amount) || 1)) : 1
        };
    }

    function findStackableInventorySlot(inventory, item) {
        if (!item || !item.stackable || !item.id) return -1;
        return inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.id === item.id);
    }

    function placeInventoryItem(inventory, item, amount, preferredIndex = null) {
        if (!item) return false;
        const safeAmount = item.stackable ? Math.max(1, Math.floor(Number(amount) || 1)) : 1;
        const stackIndex = findStackableInventorySlot(inventory, item);
        if (stackIndex !== -1) {
            const slot = inventory[stackIndex];
            slot.amount = getInventorySlotAmount(slot) + safeAmount;
            return true;
        }
        if (
            Number.isInteger(preferredIndex)
            && preferredIndex >= 0
            && preferredIndex < inventory.length
            && !inventory[preferredIndex]
        ) {
            inventory[preferredIndex] = createInventorySlot(item, safeAmount);
            return true;
        }
        const emptyIdx = inventory.indexOf(null);
        if (emptyIdx === -1) return false;
        inventory[emptyIdx] = createInventorySlot(item, safeAmount);
        return true;
    }

    function canEquipItem(context = {}, item) {
        if (!item) return false;
        const requiredAttackLevel = getRequiredLevel(item, 'requiredAttackLevel');
        if (requiredAttackLevel > 0 && getSkillLevel(context, 'attack') < requiredAttackLevel) {
            addChatMessage(context, `You need Attack level ${requiredAttackLevel} to equip the ${item.name}.`, 'warn');
            return false;
        }

        const requiredRangedLevel = getRequiredLevel(item, 'requiredRangedLevel');
        if (requiredRangedLevel > 0 && getSkillLevel(context, 'ranged') < requiredRangedLevel) {
            addChatMessage(context, `You need Ranged level ${requiredRangedLevel} to equip the ${item.name}.`, 'warn');
            return false;
        }

        const requiredMagicLevel = getRequiredLevel(item, 'requiredMagicLevel');
        if (requiredMagicLevel > 0 && getSkillLevel(context, 'magic') < requiredMagicLevel) {
            addChatMessage(context, `You need Magic level ${requiredMagicLevel} to equip the ${item.name}.`, 'warn');
            return false;
        }

        const requiredFishingLevel = getRequiredLevel(item, 'requiredFishingLevel');
        if (requiredFishingLevel > 0 && getSkillLevel(context, 'fishing') < requiredFishingLevel) {
            addChatMessage(context, `You need Fishing level ${requiredFishingLevel} to equip the ${item.name}.`, 'warn');
            return false;
        }

        const requiredDefenseLevel = getRequiredLevel(item, 'requiredDefenseLevel');
        if (requiredDefenseLevel > 0 && getSkillLevel(context, 'defense') < requiredDefenseLevel) {
            addChatMessage(context, `You need Defense level ${requiredDefenseLevel} to equip the ${item.name}.`, 'warn');
            return false;
        }

        return true;
    }

    function equipItem(context = {}, invIndex) {
        const inventory = getInventory(context);
        const equipment = getEquipment(context);
        const invSlot = inventory[invIndex];
        const item = invSlot && invSlot.itemData ? invSlot.itemData : null;
        const slotName = resolveEquipmentSlot(equipment, item);
        if (!slotName || !canEquipItem(context, item)) return false;

        const amount = getInventorySlotAmount(invSlot);
        const oldEntry = equipment[slotName];
        const oldItem = getEquipmentEntryItem(oldEntry);
        const oldAmount = getEquipmentEntryAmount(oldEntry);
        inventory[invIndex] = null;
        if (slotName === 'ammo' && oldItem && oldItem.id === item.id) {
            equipment[slotName] = createEquipmentEntry(item, oldAmount + amount);
        } else {
            equipment[slotName] = createEquipmentEntry(item, amount);
            if (oldItem && !placeInventoryItem(inventory, oldItem, oldAmount, invIndex)) {
                equipment[slotName] = oldEntry;
                inventory[invIndex] = createInventorySlot(item, amount);
                return false;
            }
        }
        refreshEquipmentState(context);
        return true;
    }

    function hasWeaponClassAvailable(context = {}, weaponClass) {
        const equipment = getEquipment(context);
        const equippedWeapon = getEquipmentEntryItem(equipment.weapon);
        if (equippedWeapon && equippedWeapon.weaponClass === weaponClass) return true;
        return getInventory(context).some((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
    }

    function autoEquipWeaponClass(context = {}, weaponClass) {
        const equipment = getEquipment(context);
        const equippedWeapon = getEquipmentEntryItem(equipment.weapon);
        if (equippedWeapon && equippedWeapon.weaponClass === weaponClass) return true;
        const inventory = getInventory(context);
        const invIndex = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
        if (invIndex === -1) return false;

        return equipItem(context, invIndex);
    }

    function unequipItem(context = {}, slotName) {
        const equipment = getEquipment(context);
        const entry = equipment[slotName];
        const item = getEquipmentEntryItem(entry);
        if (!item) return false;

        const inventory = getInventory(context);
        if (!placeInventoryItem(inventory, item, getEquipmentEntryAmount(entry))) return false;
        equipment[slotName] = null;
        refreshEquipmentState(context);
        return true;
    }

    window.EquipmentItemRuntime = {
        autoEquipWeaponClass,
        canEquipItem,
        equipItem,
        hasWeaponClassAvailable,
        resolveEquipmentSlot,
        unequipItem
    };
})();
