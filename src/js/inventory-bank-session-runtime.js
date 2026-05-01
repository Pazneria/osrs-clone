(function () {
    const DEFAULT_BANK_SOURCE = 'unknown_bank';

    function normalizeBankSource(sourceKey) {
        return typeof sourceKey === 'string' && sourceKey ? sourceKey : DEFAULT_BANK_SOURCE;
    }

    function createBankSession(options = {}) {
        return {
            isOpen: false,
            activeSource: normalizeBankSource(options.defaultSource)
        };
    }

    function getActiveBankSource(session) {
        return session && typeof session.activeSource === 'string' && session.activeSource
            ? session.activeSource
            : DEFAULT_BANK_SOURCE;
    }

    function setActiveBankSource(session, sourceKey) {
        if (!session) return DEFAULT_BANK_SOURCE;
        session.activeSource = normalizeBankSource(sourceKey);
        return session.activeSource;
    }

    function isOpen(session) {
        return !!(session && session.isOpen);
    }

    function setOpen(session, nextOpen) {
        if (!session) return false;
        session.isOpen = !!nextOpen;
        return session.isOpen;
    }

    function publishBankSessionHooks(options = {}) {
        const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : null);
        if (!windowRef) return;
        if (typeof options.setActiveBankSource === 'function') {
            windowRef.setActiveBankSource = options.setActiveBankSource;
        }
        if (typeof options.openBank === 'function') {
            windowRef.openBank = options.openBank;
        }
        if (typeof options.closeBank === 'function') {
            windowRef.closeBank = options.closeBank;
        }
    }

    window.InventoryBankSessionRuntime = {
        createBankSession,
        getActiveBankSource,
        isOpen,
        normalizeBankSource,
        publishBankSessionHooks,
        setActiveBankSource,
        setOpen
    };
})();
