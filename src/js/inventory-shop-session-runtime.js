(function () {
    function normalizeMerchantId(merchantId, fallback = 'general_store') {
        return typeof merchantId === 'string' && merchantId ? merchantId : fallback;
    }

    function createShopSession(options = {}) {
        const inventorySize = Number.isFinite(options.inventorySize)
            ? Math.max(0, Math.floor(options.inventorySize))
            : 100;
        const defaultMerchantId = normalizeMerchantId(options.defaultMerchantId);
        return {
            isOpen: false,
            activeMerchantId: defaultMerchantId,
            inventorySize,
            inventoriesByMerchant: {},
            activeInventory: Array(inventorySize).fill(null)
        };
    }

    function getActiveMerchantId(session) {
        return session && typeof session.activeMerchantId === 'string' && session.activeMerchantId
            ? session.activeMerchantId
            : 'general_store';
    }

    function getActiveInventory(session) {
        return session && Array.isArray(session.activeInventory) ? session.activeInventory : [];
    }

    function isOpen(session) {
        return !!(session && session.isOpen);
    }

    function setOpen(session, nextOpen) {
        if (!session) return false;
        session.isOpen = !!nextOpen;
        return session.isOpen;
    }

    function ensureMerchantInventory(session, merchantId, options = {}) {
        if (!session) return [];
        const id = normalizeMerchantId(merchantId, getActiveMerchantId(session));
        if (!session.inventoriesByMerchant || typeof session.inventoriesByMerchant !== 'object') {
            session.inventoriesByMerchant = {};
        }
        if (!Array.isArray(session.inventoriesByMerchant[id])) {
            session.inventoriesByMerchant[id] = typeof options.createInventory === 'function'
                ? options.createInventory(id)
                : Array(Number.isFinite(session.inventorySize) ? session.inventorySize : 100).fill(null);
        }
        session.activeMerchantId = id;
        session.activeInventory = session.inventoriesByMerchant[id];
        if (typeof options.ensureUnlockedStock === 'function') {
            const updatedInventory = options.ensureUnlockedStock(id, session.activeInventory);
            if (Array.isArray(updatedInventory)) {
                session.activeInventory = updatedInventory;
                session.inventoriesByMerchant[id] = updatedInventory;
            }
        }
        return session.activeInventory;
    }

    function updateActiveInventory(session, inventory) {
        if (!session || !Array.isArray(inventory)) return [];
        const merchantId = getActiveMerchantId(session);
        if (!session.inventoriesByMerchant || typeof session.inventoriesByMerchant !== 'object') {
            session.inventoriesByMerchant = {};
        }
        session.activeInventory = inventory;
        session.inventoriesByMerchant[merchantId] = inventory;
        return session.activeInventory;
    }

    function publishShopSessionHooks(options = {}) {
        const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : null);
        if (!windowRef) return;
        if (typeof options.openShopForMerchant === 'function') {
            windowRef.openShopForMerchant = options.openShopForMerchant;
        }
        if (typeof options.getActiveShopMerchantId === 'function') {
            windowRef.getActiveShopMerchantId = options.getActiveShopMerchantId;
        }
    }

    window.InventoryShopSessionRuntime = {
        createShopSession,
        ensureMerchantInventory,
        getActiveInventory,
        getActiveMerchantId,
        isOpen,
        normalizeMerchantId,
        publishShopSessionHooks,
        setOpen,
        updateActiveInventory
    };
})();
