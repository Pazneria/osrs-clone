(function () {
    const GENERAL_STORE_ID = 'general_store';
    const FALLBACK_SELL_RATIO = 0.4;
    const FISH_UNLOCK_DEFAULT_THRESHOLD = 50;

    function getSkillSpecs() {
        const root = window.SkillSpecs;
        return root && root.skills ? root.skills : {};
    }

    function getItemDef(itemId) {
        const defs = window.ItemCatalog && window.ItemCatalog.ITEM_DEFS;
        if (!defs || !itemId) return null;
        return defs[itemId] || null;
    }

    function getBaseItemValue(itemId) {
        const def = getItemDef(itemId);
        if (!def || !Number.isFinite(def.value)) return 0;
        return Math.max(0, Math.floor(def.value));
    }

    function getPlayerState() {
        if (typeof playerState === 'object' && playerState) return playerState;
        if (!window.__shopEconomyFallbackPlayerState) window.__shopEconomyFallbackPlayerState = {};
        return window.__shopEconomyFallbackPlayerState;
    }

    function ensureMerchantProgressRoot() {
        const state = getPlayerState();
        if (!state.merchantProgress || typeof state.merchantProgress !== 'object') {
            state.merchantProgress = {};
        }
        return state.merchantProgress;
    }

    function ensureMerchantProgress(merchantId) {
        const root = ensureMerchantProgressRoot();
        const id = merchantId || GENERAL_STORE_ID;
        if (!root[id] || typeof root[id] !== 'object') {
            root[id] = { soldCounts: {}, unlockedItems: {} };
        }
        if (!root[id].soldCounts || typeof root[id].soldCounts !== 'object') {
            root[id].soldCounts = {};
        }
        if (!root[id].unlockedItems || typeof root[id].unlockedItems !== 'object') {
            root[id].unlockedItems = {};
        }
        return root[id];
    }

    function getMerchantEconomyMeta(merchantId) {
        const id = merchantId || GENERAL_STORE_ID;
        const skills = getSkillSpecs();
        const skillIds = Object.keys(skills);
        for (let i = 0; i < skillIds.length; i++) {
            const skillId = skillIds[i];
            const spec = skills[skillId];
            const economy = spec && spec.economy;
            const merchantTable = economy && economy.merchantTable;
            if (!merchantTable || !merchantTable[id]) continue;
            return {
                skillId,
                economy,
                merchantConfig: merchantTable[id]
            };
        }
        return null;
    }

    function hasMerchantConfig(merchantId) {
        const id = merchantId || GENERAL_STORE_ID;
        if (id === GENERAL_STORE_ID) return false;
        return !!getMerchantEconomyMeta(id);
    }

    function getSkillLevel(skillId) {
        if (!skillId) return 1;
        if (typeof playerSkills === 'object' && playerSkills && playerSkills[skillId] && Number.isFinite(playerSkills[skillId].level)) {
            return Math.max(1, Math.floor(playerSkills[skillId].level));
        }
        return 1;
    }

    function getUnlockConfig(merchantConfig, itemId) {
        if (!merchantConfig || !merchantConfig.unlocks || !itemId) return null;
        const unlocks = merchantConfig.unlocks;
        const itemIds = Array.isArray(unlocks.itemIds) ? unlocks.itemIds : [];
        if (!itemIds.includes(itemId)) return null;
        return {
            threshold: Number.isFinite(unlocks.threshold) ? Math.max(1, Math.floor(unlocks.threshold)) : FISH_UNLOCK_DEFAULT_THRESHOLD,
            stockAmount: Number.isFinite(unlocks.stockAmount) ? Math.max(1, Math.floor(unlocks.stockAmount)) : 20
        };
    }

    function isItemUnlockedForMerchant(itemId, merchantId) {
        if (!itemId) return false;
        const progress = ensureMerchantProgress(merchantId);
        return !!progress.unlockedItems[itemId];
    }

    function getFishUnlockSummary(merchantId) {
        const meta = getMerchantEconomyMeta(merchantId);
        const progress = ensureMerchantProgress(merchantId);
        const merchantConfig = meta && meta.merchantConfig ? meta.merchantConfig : null;
        const unlocks = merchantConfig && merchantConfig.unlocks ? merchantConfig.unlocks : null;
        const itemIds = Array.isArray(unlocks && unlocks.itemIds) ? unlocks.itemIds.slice() : [];
        const threshold = Number.isFinite(unlocks && unlocks.threshold) ? Math.max(1, Math.floor(unlocks.threshold)) : FISH_UNLOCK_DEFAULT_THRESHOLD;
        const rows = [];
        for (let i = 0; i < itemIds.length; i++) {
            const itemId = itemIds[i];
            rows.push({
                itemId,
                sold: Number(progress.soldCounts[itemId]) || 0,
                threshold,
                unlocked: !!progress.unlockedItems[itemId]
            });
        }
        return rows;
    }

    function canMerchantBuyItem(itemId, merchantId) {
        if (!itemId) return false;
        const id = merchantId || GENERAL_STORE_ID;
        if (id === GENERAL_STORE_ID) return true;

        const meta = getMerchantEconomyMeta(id);
        if (!meta) return true;

        const merchantConfig = meta.merchantConfig || {};
        const buys = Array.isArray(merchantConfig.buys) ? merchantConfig.buys : [];
        if (!merchantConfig.strictBuys) return true;
        return buys.includes(itemId);
    }

    function canMerchantSellItem(itemId, merchantId) {
        if (!itemId) return false;
        const id = merchantId || GENERAL_STORE_ID;
        if (id === GENERAL_STORE_ID) return true;

        const meta = getMerchantEconomyMeta(id);
        if (!meta) return true;

        const merchantConfig = meta.merchantConfig || {};
        const sells = Array.isArray(merchantConfig.sells) ? merchantConfig.sells : [];
        const unlockConfig = getUnlockConfig(merchantConfig, itemId);
        const pouchUnlocks = merchantConfig.pouchUnlocks && typeof merchantConfig.pouchUnlocks === 'object'
            ? merchantConfig.pouchUnlocks
            : null;
        const pouchRequiredLevel = pouchUnlocks && Number.isFinite(pouchUnlocks[itemId])
            ? Math.max(1, Math.floor(pouchUnlocks[itemId]))
            : null;

        if (unlockConfig) return isItemUnlockedForMerchant(itemId, id);
        if (!sells.includes(itemId)) return false;
        if (pouchRequiredLevel === null) return true;
        return getSkillLevel(meta.skillId) >= pouchRequiredLevel;
    }

    function resolveBuyPrice(itemId, merchantId) {
        const meta = getMerchantEconomyMeta(merchantId);
        if (!meta || !meta.economy || !meta.economy.valueTable) {
            return getBaseItemValue(itemId);
        }

        const entry = meta.economy.valueTable[itemId];
        if (entry && Number.isFinite(entry.buy)) return Math.max(0, Math.floor(entry.buy));
        return getBaseItemValue(itemId);
    }

    function resolveSellPrice(itemId, merchantId) {
        const baseValue = getBaseItemValue(itemId);
        const id = merchantId || GENERAL_STORE_ID;
        if (id === GENERAL_STORE_ID) return Math.floor(baseValue * 0.5);

        const meta = getMerchantEconomyMeta(id);
        if (!meta || !meta.economy) return Math.floor(baseValue * FALLBACK_SELL_RATIO);
        if (!canMerchantBuyItem(itemId, id)) return 0;

        const valueTable = meta.economy.valueTable || {};
        const entry = valueTable[itemId];
        if (entry && Number.isFinite(entry.sell)) return Math.max(0, Math.floor(entry.sell));

        const fallback = meta.economy.generalStoreFallback || {};
        if (fallback.buyPolicy === 'half_price_floor') return Math.floor(baseValue * 0.5);

        return Math.floor(baseValue * FALLBACK_SELL_RATIO);
    }

    function recordMerchantPurchaseFromPlayer(itemId, merchantId, amount) {
        const qty = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
        const progress = ensureMerchantProgress(merchantId);
        const before = Number(progress.soldCounts[itemId]) || 0;
        const after = before + qty;
        progress.soldCounts[itemId] = after;

        const meta = getMerchantEconomyMeta(merchantId);
        const unlockConfig = getUnlockConfig(meta && meta.merchantConfig, itemId);
        let unlockedNow = false;
        if (unlockConfig && !progress.unlockedItems[itemId] && after >= unlockConfig.threshold) {
            progress.unlockedItems[itemId] = true;
            unlockedNow = true;
        }

        return {
            soldBefore: before,
            soldAfter: after,
            unlocked: !!progress.unlockedItems[itemId],
            unlockedNow,
            threshold: unlockConfig ? unlockConfig.threshold : null,
            stockAmount: unlockConfig ? unlockConfig.stockAmount : null
        };
    }

    function getMerchantDefaultSellItemIds(merchantId) {
        const id = merchantId || GENERAL_STORE_ID;
        if (id === GENERAL_STORE_ID) return [];

        const meta = getMerchantEconomyMeta(id);
        if (!meta || !meta.merchantConfig) return [];

        const merchantConfig = meta.merchantConfig;
        const sells = Array.isArray(merchantConfig.sells) ? merchantConfig.sells.slice() : [];
        const unlocks = merchantConfig.unlocks;
        const unlockItems = Array.isArray(unlocks && unlocks.itemIds) ? unlocks.itemIds : [];
        for (let i = 0; i < unlockItems.length; i++) {
            const itemId = unlockItems[i];
            if (isItemUnlockedForMerchant(itemId, id)) sells.push(itemId);
        }

        const unique = Array.from(new Set(sells));
        const eligible = [];
        for (let i = 0; i < unique.length; i++) {
            const itemId = unique[i];
            if (canMerchantSellItem(itemId, id)) eligible.push(itemId);
        }
        return eligible;
    }

    function getUnlockedStockAmount(itemId, merchantId) {
        const meta = getMerchantEconomyMeta(merchantId);
        const unlockConfig = getUnlockConfig(meta && meta.merchantConfig, itemId);
        if (!unlockConfig) return 0;
        return unlockConfig.stockAmount;
    }

    function getMerchantDiagnosticSummary(merchantId) {
        const id = merchantId || GENERAL_STORE_ID;
        const meta = getMerchantEconomyMeta(id);
        if (!meta) return [];

        const merchantConfig = meta.merchantConfig || {};
        const progress = ensureMerchantProgress(id);
        const buys = Array.isArray(merchantConfig.buys) ? merchantConfig.buys : [];
        const sells = Array.isArray(merchantConfig.sells) ? merchantConfig.sells : [];
        const unlocks = merchantConfig.unlocks;
        const unlockItems = Array.isArray(unlocks && unlocks.itemIds) ? unlocks.itemIds : [];
        const known = Array.from(new Set([].concat(buys, sells, unlockItems))).sort();

        const rows = [];
        for (let i = 0; i < known.length; i++) {
            const itemId = known[i];
            const unlockCfg = getUnlockConfig(merchantConfig, itemId);
            rows.push({
                itemId,
                canBuyFromPlayer: canMerchantBuyItem(itemId, id),
                canSellToPlayer: canMerchantSellItem(itemId, id),
                buyPrice: resolveBuyPrice(itemId, id),
                sellPrice: resolveSellPrice(itemId, id),
                sold: Number(progress.soldCounts[itemId]) || 0,
                threshold: unlockCfg ? unlockCfg.threshold : null,
                unlocked: unlockCfg ? !!progress.unlockedItems[itemId] : null
            });
        }

        return rows;
    }

    window.ShopEconomy = {
        resolveBuyPrice,
        resolveSellPrice,
        canMerchantBuyItem,
        canMerchantSellItem,
        hasMerchantConfig,
        recordMerchantPurchaseFromPlayer,
        getMerchantDefaultSellItemIds,
        getUnlockedStockAmount,
        getFishUnlockSummary,
        getMerchantDiagnosticSummary,
        isItemUnlockedForMerchant
    };
})();