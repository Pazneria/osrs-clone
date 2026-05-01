(function () {
    const DEFAULT_ICON_REVIEW_GRANT_ID = 'inventory_icon_review_20260313a';
    const DEFAULT_ICON_REVIEW_LABEL = 'Inventory Icons';
    const DEFAULT_ICON_REVIEW_ITEM_IDS = [
        'bronze_pickaxe',
        'iron_pickaxe',
        'steel_pickaxe',
        'mithril_pickaxe',
        'adamant_pickaxe',
        'rune_pickaxe',
        'hammer',
        'fishing_rod',
        'harpoon',
        'rune_harpoon',
        'air_staff',
        'water_staff',
        'earth_staff',
        'fire_staff'
    ];

    function sanitizeItemId(context = {}, value) {
        if (typeof context.sanitizeItemId === 'function') return context.sanitizeItemId(value);
        if (typeof value !== 'string') return '';
        return value.trim().toLowerCase();
    }

    function sanitizeIconReviewItemIds(context = {}, itemIds) {
        if (!Array.isArray(itemIds)) return [];
        const restored = [];
        const seen = new Set();
        for (let i = 0; i < itemIds.length; i++) {
            const itemId = sanitizeItemId(context, itemIds[i]);
            if (!itemId || seen.has(itemId)) continue;
            seen.add(itemId);
            restored.push(itemId);
        }
        return restored;
    }

    function getIconReviewCatalog(context = {}) {
        const windowRef = context.windowRef || (typeof window !== 'undefined' ? window : null);
        return windowRef && windowRef.IconReviewCatalog && typeof windowRef.IconReviewCatalog === 'object'
            ? windowRef.IconReviewCatalog
            : null;
    }

    function getActiveIconReviewBatch(context = {}) {
        const fallbackItemIds = sanitizeIconReviewItemIds(context, context.defaultItemIds || DEFAULT_ICON_REVIEW_ITEM_IDS);
        const catalog = getIconReviewCatalog(context);
        const itemIds = sanitizeIconReviewItemIds(context, catalog && Array.isArray(catalog.itemIds) ? catalog.itemIds : fallbackItemIds);
        const activeBatchId = (catalog && typeof catalog.activeBatchId === 'string' && catalog.activeBatchId.trim())
            ? catalog.activeBatchId.trim()
            : (context.defaultGrantId || DEFAULT_ICON_REVIEW_GRANT_ID);
        const label = (catalog && typeof catalog.label === 'string' && catalog.label.trim())
            ? catalog.label.trim()
            : (context.defaultLabel || DEFAULT_ICON_REVIEW_LABEL);
        return {
            batchId: activeBatchId,
            label,
            itemIds: itemIds.length > 0 ? itemIds : fallbackItemIds,
            replaceInventory: !!(catalog && catalog.replaceInventory)
        };
    }

    function isIconReviewRequested(context = {}) {
        const windowRef = context.windowRef || (typeof window !== 'undefined' ? window : null);
        const URLSearchParamsRef = context.URLSearchParamsRef || (typeof URLSearchParams !== 'undefined' ? URLSearchParams : null);
        if (!windowRef || !windowRef.location || typeof URLSearchParamsRef !== 'function') return false;
        const params = new URLSearchParamsRef(windowRef.location.search || '');
        const normalized = String(params.get('iconReview') || '').trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }

    function createEmptyGrantResult() {
        return {
            batchId: '',
            batchLabel: '',
            added: [],
            acknowledged: [],
            blocked: [],
            changed: false,
            replaced: false,
            placed: 0
        };
    }

    function applyInventoryIconReviewGrant(context = {}) {
        if (!isIconReviewRequested(context)) return createEmptyGrantResult();

        const itemDb = context.ITEM_DB || context.itemDb || {};
        const inventory = Array.isArray(context.inventory) ? context.inventory : [];
        const reviewBatch = getActiveIconReviewBatch(context);
        const added = [];
        const acknowledged = [];
        const blocked = [];
        const replaceInventory = reviewBatch.replaceInventory === true;

        if (replaceInventory) {
            const slots = [];

            for (let i = 0; i < reviewBatch.itemIds.length; i++) {
                const itemId = reviewBatch.itemIds[i];
                if (!itemDb[itemId]) {
                    blocked.push(itemId);
                    continue;
                }

                slots.push({ itemId, amount: 1 });
                if (typeof context.hasContentGrantItem === 'function' && context.hasContentGrantItem(reviewBatch.batchId, itemId)) {
                    acknowledged.push(itemId);
                } else {
                    if (typeof context.markContentGrantItem === 'function') context.markContentGrantItem(reviewBatch.batchId, itemId);
                    added.push(itemId);
                }
            }

            if (typeof context.setInventorySlots === 'function') context.setInventorySlots(slots);
            return {
                batchId: reviewBatch.batchId,
                batchLabel: reviewBatch.label,
                added,
                acknowledged,
                blocked,
                changed: slots.length > 0 || blocked.length > 0,
                replaced: true,
                placed: slots.length
            };
        }

        for (let i = 0; i < reviewBatch.itemIds.length; i++) {
            const itemId = reviewBatch.itemIds[i];
            if (!itemDb[itemId]) {
                blocked.push(itemId);
                continue;
            }
            if (typeof context.hasContentGrantItem === 'function' && context.hasContentGrantItem(reviewBatch.batchId, itemId)) continue;

            if (typeof context.inventoryContainsItem === 'function' && context.inventoryContainsItem(itemId)) {
                if (typeof context.markContentGrantItem === 'function') context.markContentGrantItem(reviewBatch.batchId, itemId);
                acknowledged.push(itemId);
                continue;
            }

            const emptyIdx = inventory.indexOf(null);
            if (emptyIdx === -1) {
                blocked.push(itemId);
                continue;
            }

            inventory[emptyIdx] = { itemData: itemDb[itemId], amount: 1 };
            if (typeof context.markContentGrantItem === 'function') context.markContentGrantItem(reviewBatch.batchId, itemId);
            added.push(itemId);
        }

        return {
            batchId: reviewBatch.batchId,
            batchLabel: reviewBatch.label,
            added,
            acknowledged,
            blocked,
            changed: added.length > 0 || acknowledged.length > 0,
            replaced: false,
            placed: added.length + acknowledged.length
        };
    }

    window.CoreIconReviewRuntime = {
        sanitizeIconReviewItemIds,
        getActiveIconReviewBatch,
        isIconReviewRequested,
        createEmptyGrantResult,
        applyInventoryIconReviewGrant
    };
})();
