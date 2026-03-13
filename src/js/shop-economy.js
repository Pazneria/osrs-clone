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

    function getGameSession() {
        if (window.GameSessionRuntime && typeof window.GameSessionRuntime.getSession === 'function') {
            return window.GameSessionRuntime.getSession();
        }
        if (typeof window.getGameSession === 'function') {
            return window.getGameSession();
        }
        return null;
    }

    function getPlayerState() {
        const session = getGameSession();
        if (session && session.player) return session.player;
        if (typeof playerState === 'object' && playerState) return playerState;
        if (!window.__shopEconomyFallbackPlayerState) window.__shopEconomyFallbackPlayerState = {};
        return window.__shopEconomyFallbackPlayerState;
    }

    function getProgressState() {
        const session = getGameSession();
        if (session && session.progress) return session.progress;
        return null;
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

    function normalizeStockAmount(value, fallback = 20) {
        if (!Number.isFinite(value)) return Math.max(1, Math.floor(fallback));
        return Math.max(1, Math.floor(value));
    }

    function getGeneralStoreFallbackStockRows() {
        const skills = getSkillSpecs();
        const byItemId = {};
        const skillIds = Object.keys(skills);
        for (let i = 0; i < skillIds.length; i++) {
            const spec = skills[skillIds[i]];
            const economy = spec && spec.economy;
            const fallback = economy && economy.generalStoreFallback;
            const rows = Array.isArray(fallback && fallback.defaultStock) ? fallback.defaultStock : [];
            for (let j = 0; j < rows.length; j++) {
                const row = rows[j] || {};
                const itemId = typeof row.itemId === 'string' ? row.itemId : '';
                if (!itemId) continue;
                const stockAmount = normalizeStockAmount(row.stockAmount, 20);
                if (!Number.isFinite(byItemId[itemId]) || stockAmount > byItemId[itemId]) {
                    byItemId[itemId] = stockAmount;
                }
            }
        }
        const itemIds = Object.keys(byItemId).sort();
        return itemIds.map((itemId) => ({ itemId, stockAmount: byItemId[itemId] }));
    }

    function getMerchantFallbackStockRows(merchantId) {
        const id = merchantId || GENERAL_STORE_ID;
        if (id !== GENERAL_STORE_ID) return [];
        return getGeneralStoreFallbackStockRows();
    }

    function hasFallbackStockPolicy(merchantId) {
        return getMerchantFallbackStockRows(merchantId).length > 0;
    }

    function hasStockPolicy(merchantId) {
        const id = merchantId || GENERAL_STORE_ID;
        return hasMerchantConfig(id) || hasFallbackStockPolicy(id);
    }

    function getConfiguredMerchantIds() {
        const ids = new Set([GENERAL_STORE_ID]);
        const skills = getSkillSpecs();
        const skillIds = Object.keys(skills);
        for (let i = 0; i < skillIds.length; i++) {
            const spec = skills[skillIds[i]];
            const merchantTable = spec && spec.economy && spec.economy.merchantTable;
            if (!merchantTable || typeof merchantTable !== 'object') continue;
            const merchantIds = Object.keys(merchantTable);
            for (let j = 0; j < merchantIds.length; j++) {
                const id = String(merchantIds[j] || '').trim().toLowerCase();
                if (!id) continue;
                ids.add(id);
            }
        }
        const ordered = Array.from(ids).sort();
        const generalStoreIndex = ordered.indexOf(GENERAL_STORE_ID);
        if (generalStoreIndex > 0) {
            ordered.splice(generalStoreIndex, 1);
            ordered.unshift(GENERAL_STORE_ID);
        }
        return ordered;
    }

    function isKnownMerchantId(merchantId) {
        const id = String(merchantId || '').trim().toLowerCase();
        if (!id) return false;
        return getConfiguredMerchantIds().includes(id);
    }

    function getSkillLevel(skillId) {
        if (!skillId) return 1;
        const progress = getProgressState();
        const sessionSkills = progress && progress.playerSkills ? progress.playerSkills : null;
        if (sessionSkills && sessionSkills[skillId] && Number.isFinite(sessionSkills[skillId].level)) {
            return Math.max(1, Math.floor(sessionSkills[skillId].level));
        }
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
            stockAmount: normalizeStockAmount(unlocks.stockAmount, 20)
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

    function getMerchantSeedStockRows(merchantId) {
        const id = merchantId || GENERAL_STORE_ID;
        const sells = getMerchantDefaultSellItemIds(id);
        if (sells.length > 0) {
            return sells.map((itemId) => {
                const unlockedStock = getUnlockedStockAmount(itemId, id);
                return {
                    itemId,
                    stockAmount: normalizeStockAmount(unlockedStock > 0 ? unlockedStock : 20, 20)
                };
            });
        }
        if (hasMerchantConfig(id)) return [];
        return getMerchantFallbackStockRows(id);
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
        hasFallbackStockPolicy,
        hasStockPolicy,
        getConfiguredMerchantIds,
        isKnownMerchantId,
        recordMerchantPurchaseFromPlayer,
        getMerchantDefaultSellItemIds,
        getMerchantSeedStockRows,
        getUnlockedStockAmount,
        getFishUnlockSummary,
        getMerchantDiagnosticSummary,
        isItemUnlockedForMerchant
    };
})();
