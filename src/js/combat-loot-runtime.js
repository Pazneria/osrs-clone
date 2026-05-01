(function () {
    function rollInclusive(minimum, maximum) {
        const low = Number.isFinite(minimum) ? Math.floor(minimum) : 0;
        const high = Number.isFinite(maximum) ? Math.floor(maximum) : low;
        if (high <= low) return Math.max(0, low);
        return low + Math.floor(Math.random() * ((high - low) + 1));
    }

    function resolveLootItem(context = {}, dropEntry) {
        const itemDb = context.ITEM_DB || context.itemDb || null;
        if (!dropEntry || !itemDb) return null;
        if (dropEntry.kind === 'coins') return itemDb.coins || null;
        if (dropEntry.kind === 'item' && dropEntry.itemId) return itemDb[dropEntry.itemId] || null;
        return null;
    }

    function resolveLootAmount(context = {}, dropEntry) {
        if (!dropEntry) return 0;
        if (typeof context.rollInclusive === 'function') {
            return context.rollInclusive(dropEntry.minAmount, dropEntry.maxAmount);
        }
        return rollInclusive(dropEntry.minAmount, dropEntry.maxAmount);
    }

    function spawnEnemyDrop(context = {}, enemyState) {
        if (!enemyState) return null;
        const enemyType = typeof context.getEnemyDefinition === 'function'
            ? context.getEnemyDefinition(enemyState.enemyId)
            : null;
        const combatRuntime = context.combatRuntime || null;
        if (!enemyType || !combatRuntime || typeof combatRuntime.pickDropEntry !== 'function') return null;
        if (typeof context.spawnGroundItem !== 'function') return null;

        const dropEntry = combatRuntime.pickDropEntry(enemyType.dropTable || []);
        if (!dropEntry || dropEntry.kind === 'nothing') return null;
        const itemData = resolveLootItem(context, dropEntry);
        if (!itemData) return null;
        const amount = resolveLootAmount(context, dropEntry);
        if (!Number.isFinite(amount) || amount <= 0) return null;

        context.spawnGroundItem(itemData, enemyState.x, enemyState.y, enemyState.z, Math.floor(amount));
        return {
            dropEntry,
            itemData,
            amount: Math.floor(amount),
            x: enemyState.x,
            y: enemyState.y,
            z: enemyState.z
        };
    }

    window.CombatLootRuntime = {
        rollInclusive,
        resolveLootItem,
        resolveLootAmount,
        spawnEnemyDrop
    };
})();
