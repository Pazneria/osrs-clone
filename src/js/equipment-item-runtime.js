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

    function canEquipItem(context = {}, item) {
        if (!item) return false;
        const requiredAttackLevel = getRequiredLevel(item, 'requiredAttackLevel');
        if (requiredAttackLevel > 0 && getSkillLevel(context, 'attack') < requiredAttackLevel) {
            addChatMessage(context, `You need Attack level ${requiredAttackLevel} to equip the ${item.name}.`, 'warn');
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

        const oldItem = equipment[slotName];
        equipment[slotName] = item;
        inventory[invIndex] = oldItem ? { itemData: oldItem, amount: 1 } : null;
        refreshEquipmentState(context);
        return true;
    }

    function hasWeaponClassAvailable(context = {}, weaponClass) {
        const equipment = getEquipment(context);
        if (equipment.weapon && equipment.weapon.weaponClass === weaponClass) return true;
        return getInventory(context).some((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
    }

    function autoEquipWeaponClass(context = {}, weaponClass) {
        const equipment = getEquipment(context);
        if (equipment.weapon && equipment.weapon.weaponClass === weaponClass) return true;
        const inventory = getInventory(context);
        const invIndex = inventory.findIndex((slot) => slot && slot.itemData && slot.itemData.type === 'weapon' && slot.itemData.weaponClass === weaponClass);
        if (invIndex === -1) return false;

        const slot = inventory[invIndex];
        if (!slot || !slot.itemData) return false;
        const item = slot.itemData;
        const oldWeapon = equipment.weapon;
        equipment.weapon = item;
        inventory[invIndex] = oldWeapon ? { itemData: oldWeapon, amount: 1 } : null;
        refreshEquipmentState(context);
        return true;
    }

    function unequipItem(context = {}, slotName) {
        const equipment = getEquipment(context);
        const item = equipment[slotName];
        if (!item) return false;

        const inventory = getInventory(context);
        const emptyIdx = inventory.indexOf(null);
        if (emptyIdx === -1) return false;

        inventory[emptyIdx] = { itemData: item, amount: 1 };
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
