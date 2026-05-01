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

    function getProgressStorage(context = {}) {
        if (context.storage) return context.storage;
        const windowRef = context.windowRef || (typeof window !== 'undefined' ? window : null);
        return windowRef ? windowRef.localStorage : null;
    }

    function canUseProgressStorage(context = {}) {
        try {
            const gameSessionRuntime = context.gameSessionRuntime || null;
            return !!getProgressStorage(context)
                && !!gameSessionRuntime
                && typeof gameSessionRuntime.saveProgressPayloadToStorage === 'function'
                && typeof gameSessionRuntime.loadProgressPayloadFromStorage === 'function';
        } catch (error) {
            return false;
        }
    }

    function saveProgressToStorage(context = {}, reason = 'manual') {
        if (!canUseProgressStorage(context)) return { ok: false, reason: 'storage_unavailable' };
        const gameSessionRuntime = context.gameSessionRuntime;
        const consoleRef = context.consoleRef || console;
        try {
            const payload = typeof context.buildProgressPayload === 'function'
                ? context.buildProgressPayload(reason)
                : null;
            if (!payload) return { ok: false, reason: 'session_unavailable' };
            return gameSessionRuntime.saveProgressPayloadToStorage({
                storage: getProgressStorage(context),
                storageKey: context.storageKey,
                payload
            });
        } catch (error) {
            consoleRef.warn('Progress save failed', error);
            return { ok: false, reason: 'save_failed', error };
        }
    }

    function clearProgressFromStorage(context = {}, options = {}) {
        if (!canUseProgressStorage(context)) return { ok: false, reason: 'storage_unavailable' };
        const clearPoseEditor = !!options.clearPoseEditor;
        const consoleRef = context.consoleRef || console;
        const storage = getProgressStorage(context);
        try {
            storage.removeItem(context.storageKey);
            if (clearPoseEditor) storage.removeItem(context.poseEditorStorageKey || 'poseEditor.v1');
            return { ok: true, clearedPoseEditor: clearPoseEditor };
        } catch (error) {
            consoleRef.warn('Progress save clear failed', error);
            return { ok: false, reason: 'clear_failed', error };
        }
    }

    function shouldConsumeFreshSessionParam(paramValue) {
        if (paramValue === null || paramValue === undefined) return false;
        if (paramValue === '') return true;
        const normalized = String(paramValue).trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y';
    }

    function consumeFreshSessionRequest(context = {}) {
        const windowRef = context.windowRef || (typeof window !== 'undefined' ? window : null);
        const documentRef = context.documentRef || (typeof document !== 'undefined' ? document : { title: '' });
        const URLSearchParamsRef = context.URLSearchParamsRef || (typeof URLSearchParams !== 'undefined' ? URLSearchParams : null);
        if (!windowRef || !windowRef.location || typeof URLSearchParamsRef !== 'function') return false;
        const params = new URLSearchParamsRef(windowRef.location.search || '');
        const freshSessionParamKeys = context.freshSessionParamKeys || ['fresh', 'resetProgress', 'clearSave'];
        const requested = freshSessionParamKeys.some((key) => shouldConsumeFreshSessionParam(params.get(key)));
        if (!requested) return false;

        if (typeof context.clearProgressFromStorage === 'function') {
            context.clearProgressFromStorage({ clearPoseEditor: true });
        } else {
            clearProgressFromStorage(context, { clearPoseEditor: true });
        }

        freshSessionParamKeys.forEach((key) => params.delete(key));
        if (windowRef.history && typeof windowRef.history.replaceState === 'function') {
            const nextQuery = params.toString();
            const nextUrl = `${windowRef.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${windowRef.location.hash || ''}`;
            windowRef.history.replaceState({}, documentRef.title, nextUrl);
        }
        return true;
    }

    function startProgressAutosave(context = {}) {
        const clearIntervalRef = context.clearIntervalRef || (typeof clearInterval !== 'undefined' ? clearInterval : null);
        const setIntervalRef = context.setIntervalRef || (typeof setInterval !== 'undefined' ? setInterval : null);
        if (typeof setIntervalRef !== 'function') return null;
        const existingHandle = context.progressAutosaveHandle;
        if (existingHandle && typeof clearIntervalRef === 'function') clearIntervalRef(existingHandle);
        const handle = setIntervalRef(() => {
            if (typeof context.saveProgressToStorage === 'function') {
                context.saveProgressToStorage('autosave');
            } else {
                saveProgressToStorage(context, 'autosave');
            }
        }, context.progressAutosaveIntervalMs);
        if (typeof context.setProgressAutosaveHandle === 'function') {
            context.setProgressAutosaveHandle(handle);
        }
        return handle;
    }

    function ensureProgressPersistenceLifecycle(context = {}) {
        const playerEntryFlowState = context.playerEntryFlowState || null;
        const windowRef = context.windowRef || (typeof window !== 'undefined' ? window : null);
        if (!playerEntryFlowState) return false;
        if (playerEntryFlowState.sessionActivated) return false;
        playerEntryFlowState.sessionActivated = true;
        if (typeof context.startProgressAutosave === 'function') {
            context.startProgressAutosave();
        } else {
            startProgressAutosave(context);
        }
        if (!playerEntryFlowState.unloadSaveHooksRegistered && windowRef && typeof windowRef.addEventListener === 'function') {
            const save = typeof context.saveProgressToStorage === 'function'
                ? context.saveProgressToStorage
                : (reason) => saveProgressToStorage(context, reason);
            windowRef.addEventListener('beforeunload', () => save('beforeunload'));
            windowRef.addEventListener('pagehide', () => save('pagehide'));
            playerEntryFlowState.unloadSaveHooksRegistered = true;
        }
        return true;
    }

    function clearProgressSave(context = {}, options = {}) {
        const windowRef = context.windowRef || (typeof window !== 'undefined' ? window : null);
        const result = typeof context.clearProgressFromStorage === 'function'
            ? context.clearProgressFromStorage(options)
            : clearProgressFromStorage(context, options);
        if (result && result.ok && options && options.reload && windowRef && windowRef.location) {
            windowRef.location.reload();
        }
        return result;
    }

    function startFreshSession(context = {}) {
        const windowRef = context.windowRef || (typeof window !== 'undefined' ? window : null);
        const result = typeof context.clearProgressFromStorage === 'function'
            ? context.clearProgressFromStorage({ clearPoseEditor: true })
            : clearProgressFromStorage(context, { clearPoseEditor: true });
        if (result && result.ok && windowRef && windowRef.location) windowRef.location.reload();
        return result;
    }

    function resolvePublishedProgressContext(options) {
        if (!options) return {};
        if (typeof options.buildContext === 'function') {
            const context = options.buildContext();
            return context && typeof context === 'object' ? context : {};
        }
        return options.context && typeof options.context === 'object' ? options.context : {};
    }

    function publishProgressHooks(options = {}) {
        const windowRef = options.windowRef || (typeof window !== 'undefined' ? window : {});
        const clearSave = clearProgressSave;
        const startFresh = startFreshSession;
        windowRef.clearProgressSave = function clearProgressSave(optionsArg = {}) {
            return clearSave(resolvePublishedProgressContext(options), optionsArg);
        };
        windowRef.startFreshSession = function startFreshSession() {
            return startFresh(resolvePublishedProgressContext(options));
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
        serializeAppearanceState,
        canUseProgressStorage,
        saveProgressToStorage,
        clearProgressFromStorage,
        shouldConsumeFreshSessionParam,
        consumeFreshSessionRequest,
        startProgressAutosave,
        ensureProgressPersistenceLifecycle,
        clearProgressSave,
        startFreshSession,
        publishProgressHooks
    };
})();
