(function () {
    const MAX_REASONABLE_EAT_COOLDOWN_TICKS = 10;

    function getInventory(context = {}) {
        return Array.isArray(context.inventory) ? context.inventory : [];
    }

    function addChatMessage(context = {}, message, tone = 'game') {
        if (typeof context.addChatMessage === 'function') context.addChatMessage(message, tone);
    }

    function didAttackOrCastThisTick(context = {}) {
        const playerState = context.playerState || {};
        const currentTick = Number.isFinite(context.currentTick) ? Math.floor(context.currentTick) : 0;
        const lastAttackTick = Number.isFinite(playerState.lastAttackTick) ? Math.floor(playerState.lastAttackTick) : null;
        const lastCastTick = Number.isFinite(playerState.lastCastTick) ? Math.floor(playerState.lastCastTick) : null;
        const actionName = typeof playerState.action === 'string' ? playerState.action.toUpperCase() : '';
        return lastAttackTick === currentTick
            || lastCastTick === currentTick
            || actionName.startsWith('CAST:')
            || actionName.startsWith('CASTING:');
    }

    function eatItem(context = {}, invIndex) {
        const inventory = getInventory(context);
        const invSlot = inventory[invIndex];
        if (!invSlot || !invSlot.itemData) return false;

        const item = invSlot.itemData;
        const healAmount = Number.isFinite(item.healAmount) ? Math.max(0, Math.floor(item.healAmount)) : 0;
        const eatDelayTicks = Number.isFinite(item.eatDelayTicks) ? Math.max(1, Math.floor(item.eatDelayTicks)) : 0;
        if (item.type !== 'food' || healAmount <= 0 || eatDelayTicks <= 0) {
            addChatMessage(context, "You can't eat that.", 'warn');
            return false;
        }

        const playerState = context.playerState || {};
        const currentTick = Number.isFinite(context.currentTick) ? Math.floor(context.currentTick) : 0;
        let cooldownEndTick = Number.isFinite(playerState.eatingCooldownEndTick)
            ? Math.floor(playerState.eatingCooldownEndTick)
            : 0;
        if ((cooldownEndTick - currentTick) > MAX_REASONABLE_EAT_COOLDOWN_TICKS) {
            cooldownEndTick = currentTick;
            playerState.eatingCooldownEndTick = currentTick;
        }
        if (currentTick < cooldownEndTick) {
            const remainingTicks = cooldownEndTick - currentTick;
            addChatMessage(context, `You need to wait ${remainingTicks} tick${remainingTicks === 1 ? '' : 's'} before eating again.`, 'warn');
            return false;
        }

        if (didAttackOrCastThisTick(context)) {
            addChatMessage(context, 'You cannot eat on the same tick as attacking or casting.', 'warn');
            return false;
        }

        invSlot.amount -= 1;
        if (invSlot.amount <= 0) inventory[invIndex] = null;
        if (context.selectedUse && context.selectedUse.invIndex === invIndex && typeof context.clearSelectedUse === 'function') {
            context.clearSelectedUse(false);
        }

        const healed = typeof context.applyHitpointHealing === 'function'
            ? context.applyHitpointHealing(healAmount)
            : 0;
        playerState.eatingCooldownEndTick = currentTick + eatDelayTicks;

        if (healed > 0) addChatMessage(context, `You eat the ${item.name}. (+${healed} HP)`, 'game');
        else addChatMessage(context, `You eat the ${item.name}.`, 'game');
        if (typeof context.updateStats === 'function') context.updateStats();
        if (typeof context.renderInventory === 'function') context.renderInventory();
        return true;
    }

    window.FoodItemRuntime = {
        MAX_REASONABLE_EAT_COOLDOWN_TICKS,
        didAttackOrCastThisTick,
        eatItem
    };
})();
