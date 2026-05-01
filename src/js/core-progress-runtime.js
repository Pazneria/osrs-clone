(function () {
    function sanitizeItemId(value) {
        if (typeof value !== 'string') return '';
        return value.trim().toLowerCase();
    }

    function getItemDb(context = {}) {
        return context.ITEM_DB || context.itemDb || {};
    }

    function serializeInventorySlot(context = {}, slot) {
        const itemDb = getItemDb(context);
        if (!slot || !slot.itemData || typeof slot.itemData.id !== 'string') return null;
        const itemId = sanitizeItemId(slot.itemData.id);
        if (!itemId || !itemDb[itemId]) return null;
        const rawAmount = Number(slot.amount);
        const amount = Number.isFinite(rawAmount) ? Math.max(1, Math.floor(rawAmount)) : 1;
        return { itemId, amount };
    }

    function deserializeInventorySlot(context = {}, serializedSlot) {
        const itemDb = getItemDb(context);
        if (!serializedSlot || typeof serializedSlot !== 'object') return null;
        const itemId = sanitizeItemId(serializedSlot.itemId);
        if (!itemId || !itemDb[itemId]) return null;
        const itemData = itemDb[itemId];
        const rawAmount = Number(serializedSlot.amount);
        const amount = itemData.stackable
            ? (Number.isFinite(rawAmount) ? Math.max(1, Math.floor(rawAmount)) : 1)
            : 1;
        return { itemData, amount };
    }

    function serializeItemArray(context = {}, slots) {
        if (!Array.isArray(slots)) return [];
        return slots.map((slot) => serializeInventorySlot(context, slot));
    }

    function deserializeItemArray(context = {}, savedSlots, size) {
        const safeSize = Number.isFinite(size) ? Math.max(0, Math.floor(size)) : 0;
        const restored = Array(safeSize).fill(null);
        if (!Array.isArray(savedSlots)) return restored;
        const max = Math.min(safeSize, savedSlots.length);
        for (let i = 0; i < max; i++) {
            restored[i] = deserializeInventorySlot(context, savedSlots[i]);
        }
        return restored;
    }

    function serializeEquipmentState(context = {}) {
        const equipment = context.equipment || {};
        const out = {};
        const slotNames = Object.keys(equipment);
        for (let i = 0; i < slotNames.length; i++) {
            const slotName = slotNames[i];
            const equippedItem = equipment[slotName];
            out[slotName] = equippedItem && typeof equippedItem.id === 'string'
                ? sanitizeItemId(equippedItem.id)
                : null;
        }
        return out;
    }

    function deserializeEquipmentState(context = {}, savedEquipment) {
        const itemDb = getItemDb(context);
        const equipment = context.equipment || {};
        const restored = {};
        const slotNames = Object.keys(equipment);
        for (let i = 0; i < slotNames.length; i++) {
            const slotName = slotNames[i];
            const itemId = savedEquipment && typeof savedEquipment === 'object'
                ? sanitizeItemId(savedEquipment[slotName])
                : '';
            restored[slotName] = itemId && itemDb[itemId] ? itemDb[itemId] : null;
        }
        return restored;
    }

    function sanitizeUserItemPrefs(savedPrefs) {
        const restored = {};
        if (!savedPrefs || typeof savedPrefs !== 'object') return restored;
        const keys = Object.keys(savedPrefs);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!key || typeof savedPrefs[key] !== 'string') continue;
            restored[key] = savedPrefs[key];
        }
        return restored;
    }

    function sanitizeSkillState(context = {}, savedSkills) {
        const defaults = context.playerSkills || {};
        const maxSkillLevel = Number.isFinite(context.maxSkillLevel)
            ? Math.max(1, Math.floor(context.maxSkillLevel))
            : 99;
        const skillIds = Object.keys(defaults);
        const restored = {};
        for (let i = 0; i < skillIds.length; i++) {
            const skillId = skillIds[i];
            const defaultEntry = defaults[skillId] || { xp: 0, level: 1 };
            const savedEntry = savedSkills && typeof savedSkills === 'object' ? savedSkills[skillId] : null;
            const xpRaw = savedEntry && Number.isFinite(savedEntry.xp) ? savedEntry.xp : defaultEntry.xp;
            const xp = Math.max(0, Math.floor(xpRaw));

            let level = defaultEntry.level;
            if (savedEntry && Number.isFinite(savedEntry.level)) {
                level = Math.max(1, Math.min(maxSkillLevel, Math.floor(savedEntry.level)));
            }
            if (typeof context.getLevelForXp === 'function') {
                level = Math.max(1, Math.min(maxSkillLevel, context.getLevelForXp(xp)));
            }

            restored[skillId] = { xp, level };
        }
        return restored;
    }

    function createEmptyPlayerProfile() {
        return {
            name: '',
            creationCompleted: false,
            createdAt: null,
            lastStartedAt: null,
            tutorialStep: 0,
            tutorialCompletedAt: null,
            tutorialBankDepositSource: null,
            tutorialBankWithdrawSource: null
        };
    }

    function sanitizePlayerName(context = {}, value) {
        if (typeof context.sanitizePlayerName === 'function') {
            return context.sanitizePlayerName(value);
        }
        if (typeof value !== 'string') return '';
        return value.trim();
    }

    function syncPlayerProfileState(context = {}, nextProfile) {
        const playerProfileState = context.playerProfileState || null;
        if (!playerProfileState) return null;
        const safeProfile = nextProfile && typeof nextProfile === 'object'
            ? nextProfile
            : createEmptyPlayerProfile();
        playerProfileState.name = typeof safeProfile.name === 'string' ? safeProfile.name : '';
        playerProfileState.creationCompleted = !!safeProfile.creationCompleted;
        playerProfileState.createdAt = Number.isFinite(safeProfile.createdAt)
            ? Math.max(0, Math.floor(safeProfile.createdAt))
            : null;
        playerProfileState.lastStartedAt = Number.isFinite(safeProfile.lastStartedAt)
            ? Math.max(0, Math.floor(safeProfile.lastStartedAt))
            : null;
        playerProfileState.tutorialStep = Number.isFinite(safeProfile.tutorialStep)
            ? Math.max(0, Math.floor(safeProfile.tutorialStep))
            : 0;
        playerProfileState.tutorialCompletedAt = Number.isFinite(safeProfile.tutorialCompletedAt)
            ? Math.max(0, Math.floor(safeProfile.tutorialCompletedAt))
            : null;
        playerProfileState.tutorialBankDepositSource = typeof safeProfile.tutorialBankDepositSource === 'string'
            ? safeProfile.tutorialBankDepositSource
            : null;
        playerProfileState.tutorialBankWithdrawSource = typeof safeProfile.tutorialBankWithdrawSource === 'string'
            ? safeProfile.tutorialBankWithdrawSource
            : null;
        return playerProfileState;
    }

    function sanitizePlayerProfile(context = {}, savedProfile, options = {}) {
        const allowLegacyFallback = !!(options && options.allowLegacyFallback);
        const savedWorldId = typeof options.savedWorldId === 'string' ? options.savedWorldId : '';
        const tutorialWorldId = context.tutorialWorldId || 'tutorial_island';
        const tutorialExitStep = Number.isFinite(context.tutorialExitStep) ? Math.floor(context.tutorialExitStep) : 7;
        const defaultName = context.playerProfileDefaultName || 'Adventurer';
        const now = typeof context.now === 'function' ? context.now : Date.now;
        const restored = createEmptyPlayerProfile();
        if (savedProfile && typeof savedProfile === 'object') {
            restored.name = sanitizePlayerName(context, savedProfile.name);
            restored.creationCompleted = !!savedProfile.creationCompleted;
            restored.createdAt = Number.isFinite(savedProfile.createdAt)
                ? Math.max(0, Math.floor(savedProfile.createdAt))
                : null;
            restored.lastStartedAt = Number.isFinite(savedProfile.lastStartedAt)
                ? Math.max(0, Math.floor(savedProfile.lastStartedAt))
                : null;
            restored.tutorialStep = Number.isFinite(savedProfile.tutorialStep)
                ? Math.max(0, Math.floor(savedProfile.tutorialStep))
                : 0;
            restored.tutorialCompletedAt = Number.isFinite(savedProfile.tutorialCompletedAt)
                ? Math.max(0, Math.floor(savedProfile.tutorialCompletedAt))
                : null;
            restored.tutorialBankDepositSource = typeof savedProfile.tutorialBankDepositSource === 'string'
                ? savedProfile.tutorialBankDepositSource
                : null;
            restored.tutorialBankWithdrawSource = typeof savedProfile.tutorialBankWithdrawSource === 'string'
                ? savedProfile.tutorialBankWithdrawSource
                : null;
        }

        if (allowLegacyFallback && !restored.name) restored.name = defaultName;
        if (allowLegacyFallback && !restored.creationCompleted) restored.creationCompleted = true;
        if (allowLegacyFallback && !restored.createdAt) restored.createdAt = now();
        if (
            allowLegacyFallback
            && restored.creationCompleted
            && savedWorldId
            && savedWorldId !== tutorialWorldId
            && !restored.tutorialCompletedAt
        ) {
            restored.tutorialCompletedAt = restored.lastStartedAt || restored.createdAt || now();
        }
        if (restored.tutorialCompletedAt) restored.tutorialStep = tutorialExitStep;

        return restored;
    }

    function serializePlayerProfile(context = {}) {
        const playerProfileState = context.playerProfileState || createEmptyPlayerProfile();
        const defaultName = context.playerProfileDefaultName || 'Adventurer';
        return {
            name: sanitizePlayerName(context, playerProfileState.name) || defaultName,
            creationCompleted: !!playerProfileState.creationCompleted,
            createdAt: Number.isFinite(playerProfileState.createdAt)
                ? Math.max(0, Math.floor(playerProfileState.createdAt))
                : null,
            lastStartedAt: Number.isFinite(playerProfileState.lastStartedAt)
                ? Math.max(0, Math.floor(playerProfileState.lastStartedAt))
                : null,
            tutorialStep: Number.isFinite(playerProfileState.tutorialStep)
                ? Math.max(0, Math.floor(playerProfileState.tutorialStep))
                : 0,
            tutorialCompletedAt: Number.isFinite(playerProfileState.tutorialCompletedAt)
                ? Math.max(0, Math.floor(playerProfileState.tutorialCompletedAt))
                : null,
            tutorialBankDepositSource: typeof playerProfileState.tutorialBankDepositSource === 'string'
                ? playerProfileState.tutorialBankDepositSource
                : null,
            tutorialBankWithdrawSource: typeof playerProfileState.tutorialBankWithdrawSource === 'string'
                ? playerProfileState.tutorialBankWithdrawSource
                : null
        };
    }

    function sanitizeAppearanceState(context = {}, savedAppearance) {
        const windowRef = context.windowRef || window;
        if (!windowRef.playerAppearanceState || typeof windowRef.playerAppearanceState !== 'object') return null;
        if (!savedAppearance || typeof savedAppearance !== 'object') return null;

        const gender = savedAppearance.gender === 1 ? 1 : 0;
        const colorsIn = Array.isArray(savedAppearance.colors) ? savedAppearance.colors : [];
        const colors = [0, 0, 0, 0, 0];
        for (let i = 0; i < colors.length; i++) {
            const raw = Number(colorsIn[i]);
            colors[i] = Number.isFinite(raw) ? Math.floor(raw) : 0;
        }
        return { gender, colors };
    }

    function serializeAppearanceState(context = {}) {
        const windowRef = context.windowRef || window;
        const appearanceState = windowRef.playerAppearanceState || null;
        if (!appearanceState) return null;
        return {
            gender: appearanceState.gender === 1 ? 1 : 0,
            colors: Array.isArray(appearanceState.colors)
                ? appearanceState.colors.slice(0, 5)
                : [0, 0, 0, 0, 0]
        };
    }

    window.CoreProgressRuntime = {
        sanitizeItemId,
        serializeInventorySlot,
        deserializeInventorySlot,
        serializeItemArray,
        deserializeItemArray,
        serializeEquipmentState,
        deserializeEquipmentState,
        sanitizeUserItemPrefs,
        sanitizeSkillState,
        createEmptyPlayerProfile,
        syncPlayerProfileState,
        sanitizePlayerProfile,
        serializePlayerProfile,
        sanitizeAppearanceState,
        serializeAppearanceState
    };
})();
