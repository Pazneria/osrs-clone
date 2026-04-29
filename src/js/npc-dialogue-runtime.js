(function () {
    const FALLBACK_TITLE = 'Conversation';
    const FALLBACK_GREETING = 'They do not have much to say right now.';

    let activeNpc = null;
    let activeDialogueId = '';
    let activeMessage = '';

    function getOverlayEl() {
        return document.getElementById('npc-dialogue-overlay');
    }

    function getTitleEl() {
        return document.getElementById('npc-dialogue-title');
    }

    function getBodyEl() {
        return document.getElementById('npc-dialogue-body');
    }

    function getOptionsEl() {
        return document.getElementById('npc-dialogue-options');
    }

    function getCloseButtonEl() {
        return document.getElementById('npc-dialogue-close');
    }

    function normalizeNpcData(npc) {
        if (!npc || typeof npc !== 'object') return {};
        return Object.assign({}, npc);
    }

    function resolveDialogueEntry(npc) {
        if (!npc || typeof npc !== 'object') return null;
        if (!window.NpcDialogueCatalog) return null;
        if (typeof window.NpcDialogueCatalog.getDialogueEntryByNpc === 'function') {
            return window.NpcDialogueCatalog.getDialogueEntryByNpc(npc);
        }
        const dialogueId = typeof npc.dialogueId === 'string' ? npc.dialogueId.trim() : '';
        if (!dialogueId || typeof window.NpcDialogueCatalog.resolveDialogueId !== 'function') return null;
        const resolvedDialogueId = window.NpcDialogueCatalog.resolveDialogueId(dialogueId);
        if (!resolvedDialogueId || !window.NpcDialogueCatalog.DIALOGUE_ENTRIES) return null;
        return window.NpcDialogueCatalog.DIALOGUE_ENTRIES[resolvedDialogueId] || null;
    }

    function buildDialogueView(npc) {
        const entry = resolveDialogueEntry(npc);
        const baseView = {
            title: entry && entry.title ? entry.title : (npc && npc.name ? npc.name : FALLBACK_TITLE),
            greeting: entry && typeof entry.greeting === 'string' && entry.greeting.trim()
                ? entry.greeting.trim()
                : FALLBACK_GREETING,
            options: Array.isArray(entry && entry.options) ? entry.options.slice() : []
        };

        if (window.QuestRuntime && typeof window.QuestRuntime.buildNpcDialogueView === 'function') {
            const questView = window.QuestRuntime.buildNpcDialogueView(npc, baseView);
            if (questView && typeof questView === 'object') {
                const resolvedQuestView = {
                    title: questView.title || baseView.title,
                    greeting: (typeof questView.greeting === 'string' && questView.greeting.trim())
                        ? questView.greeting.trim()
                        : baseView.greeting,
                    options: Array.isArray(questView.options) ? questView.options.slice() : baseView.options
                };
                if (window.TutorialRuntime && typeof window.TutorialRuntime.buildNpcDialogueView === 'function') {
                    const tutorialView = window.TutorialRuntime.buildNpcDialogueView(npc, resolvedQuestView);
                    if (tutorialView && typeof tutorialView === 'object') return tutorialView;
                }
                return resolvedQuestView;
            }
        }

        if (window.TutorialRuntime && typeof window.TutorialRuntime.buildNpcDialogueView === 'function') {
            const tutorialView = window.TutorialRuntime.buildNpcDialogueView(npc, baseView);
            if (tutorialView && typeof tutorialView === 'object') return tutorialView;
        }

        return baseView;
    }

    function shouldShowActionOption(option, npc) {
        if (!option || typeof option !== 'object') return false;
        if (option.kind === 'bank') {
            return !!(npc && (npc.action === 'Bank' || npc.name === 'Banker'));
        }
        if (option.kind === 'trade') {
            if (!(npc && (npc.merchantId || npc.action === 'Trade'))) return false;
            if (window.QuestRuntime && typeof window.QuestRuntime.canOpenMerchantShop === 'function') {
                const access = window.QuestRuntime.canOpenMerchantShop(npc.merchantId || '');
                return !!(access && access.ok);
            }
            return true;
        }
        if (option.kind === 'travel') {
            return !!(
                (option && (option.travelToWorldId || option.travelSpawn))
                || (npc && (npc.travelToWorldId || npc.travelSpawn || npc.action === 'Travel'))
            );
        }
        return true;
    }

    function closeNpcDialogue() {
        activeNpc = null;
        activeDialogueId = '';
        activeMessage = '';
        const overlay = getOverlayEl();
        if (overlay) overlay.classList.add('hidden');
    }

    function performTrade(npc) {
        const merchantId = (npc && typeof npc.merchantId === 'string' && npc.merchantId.trim()) ? npc.merchantId.trim() : 'general_store';
        if (typeof window.openShopForMerchant === 'function') {
            window.openShopForMerchant(merchantId);
        }
    }

    function performBank() {
        if (typeof window.openBank === 'function') window.openBank();
    }

    function performTravel(npc, option = null) {
        if (typeof window.travelToWorld !== 'function') return;
        const optionWorldId = option && typeof option.travelToWorldId === 'string' ? option.travelToWorldId.trim() : '';
        const npcWorldId = npc && typeof npc.travelToWorldId === 'string' ? npc.travelToWorldId.trim() : '';
        const explicitWorldId = optionWorldId || npcWorldId;
        const sessionWorldId = (window.GameSessionRuntime && typeof window.GameSessionRuntime.resolveCurrentWorldId === 'function')
            ? window.GameSessionRuntime.resolveCurrentWorldId()
            : ((window.WorldBootstrapRuntime && typeof window.WorldBootstrapRuntime.getCurrentWorldId === 'function')
                ? window.WorldBootstrapRuntime.getCurrentWorldId()
                : '');
        const targetWorldId = explicitWorldId || sessionWorldId;
        if (!targetWorldId) return;
        const optionSpawn = option && option.travelSpawn ? Object.assign({}, option.travelSpawn) : null;
        window.travelToWorld(targetWorldId, {
            spawn: optionSpawn || (npc && npc.travelSpawn ? Object.assign({}, npc.travelSpawn) : null),
            label: (npc && (npc.worldLabel || npc.name)) ? (npc.worldLabel || npc.name) : targetWorldId
        });
    }

    function updateBodyText(text) {
        const bodyEl = getBodyEl();
        if (!bodyEl) return;
        bodyEl.textContent = text || FALLBACK_GREETING;
        activeMessage = text || FALLBACK_GREETING;
    }

    function refreshActiveDialogue(bodyTextOverride) {
        if (!activeNpc) return;
        const normalizedNpc = normalizeNpcData(activeNpc);
        const dialogueView = buildDialogueView(normalizedNpc);

        const titleEl = getTitleEl();
        if (titleEl) titleEl.textContent = dialogueView.title || FALLBACK_TITLE;

        const nextBodyText = (typeof bodyTextOverride === 'string' && bodyTextOverride.trim())
            ? bodyTextOverride.trim()
            : dialogueView.greeting;
        updateBodyText(nextBodyText);
        renderDialogueOptions(normalizedNpc, dialogueView);
    }

    function renderDialogueOptions(npc, dialogueView) {
        const optionsEl = getOptionsEl();
        if (!optionsEl) return;
        optionsEl.innerHTML = '';

        const optionList = Array.isArray(dialogueView && dialogueView.options) ? dialogueView.options : [];
        const visibleOptions = [];
        for (let i = 0; i < optionList.length; i++) {
            const option = optionList[i];
            if (!shouldShowActionOption(option, npc)) continue;
            visibleOptions.push(option);
        }

        if (visibleOptions.length === 0) {
            visibleOptions.push({ kind: 'close', label: 'Goodbye' });
        }

        visibleOptions.forEach((option) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'w-full rounded border border-[#4a4136] bg-[#241d16] px-3 py-2 text-left text-sm text-[#f1e2bf] transition-colors hover:bg-[#2f261d] hover:border-[#c8aa6e]';
            button.textContent = option.label || 'Option';
            button.addEventListener('click', () => {
                if (!activeNpc) return;
                if (option.kind === 'trade') {
                    closeNpcDialogue();
                    performTrade(activeNpc);
                    return;
                }
                if (option.kind === 'bank') {
                    closeNpcDialogue();
                    performBank();
                    return;
                }
                if (option.kind === 'travel') {
                    closeNpcDialogue();
                    performTravel(activeNpc, option);
                    return;
                }
                if (option.kind === 'close') {
                    closeNpcDialogue();
                    return;
                }
                if (typeof option.onSelect === 'function') {
                    const result = option.onSelect({
                        npc: activeNpc,
                        closeDialogue: closeNpcDialogue,
                        refreshDialogue: refreshActiveDialogue,
                        updateBodyText: updateBodyText,
                        performBank: performBank,
                        performTrade: () => performTrade(activeNpc),
                        performTravel: () => performTravel(activeNpc, option)
                    }) || null;
                    if (result && result.close) {
                        closeNpcDialogue();
                        return;
                    }
                    if (result && result.refresh) {
                        refreshActiveDialogue(result.bodyText);
                        return;
                    }
                    if (result && typeof result.bodyText === 'string' && result.bodyText.trim()) {
                        updateBodyText(result.bodyText.trim());
                        return;
                    }
                }
                if (typeof option.response === 'string' && option.response.trim()) {
                    updateBodyText(option.response.trim());
                }
            });
            optionsEl.appendChild(button);
        });
    }

    function openNpcDialogue(npc) {
        const normalizedNpc = normalizeNpcData(npc);
        activeNpc = normalizedNpc;

        if (typeof window.closeContextMenu === 'function') {
            window.closeContextMenu();
        }

        const overlay = getOverlayEl();
        if (overlay) overlay.classList.remove('hidden');

        if (window.NpcDialogueCatalog && typeof window.NpcDialogueCatalog.resolveDialogueIdFromNpc === 'function') {
            activeDialogueId = window.NpcDialogueCatalog.resolveDialogueIdFromNpc(normalizedNpc);
        } else {
            activeDialogueId = String(normalizedNpc.dialogueId || '');
        }

        let openingBodyText = '';
        if (window.QuestRuntime && typeof window.QuestRuntime.handleNpcDialogueOpened === 'function') {
            const questOpenResult = window.QuestRuntime.handleNpcDialogueOpened(normalizedNpc);
            if (questOpenResult && typeof questOpenResult.messageText === 'string') {
                openingBodyText = questOpenResult.messageText;
            }
        }
        refreshActiveDialogue(openingBodyText);

        const closeButtonEl = getCloseButtonEl();
        if (closeButtonEl) closeButtonEl.focus({ preventScroll: true });
    }

    function isOpen() {
        const overlay = getOverlayEl();
        return !!(overlay && !overlay.classList.contains('hidden'));
    }

    function handleOverlayClick(event) {
        if (event && event.target && event.currentTarget === event.target) {
            closeNpcDialogue();
        }
    }

    function handleKeydown(event) {
        if (!isOpen()) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
        if (event.key === 'Escape') {
            closeNpcDialogue();
        }
    }

    function bindRuntime() {
        const overlay = getOverlayEl();
        if (overlay) overlay.addEventListener('click', handleOverlayClick);

        const closeButtonEl = getCloseButtonEl();
        if (closeButtonEl) closeButtonEl.addEventListener('click', closeNpcDialogue);

        window.addEventListener('keydown', handleKeydown, true);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', bindRuntime, { once: true });
    } else {
        bindRuntime();
    }

    window.NpcDialogueRuntime = {
        isOpen: isOpen,
        openNpcDialogue: openNpcDialogue,
        closeNpcDialogue: closeNpcDialogue,
        refreshActiveDialogue: refreshActiveDialogue,
        getActiveNpc: function () { return activeNpc ? Object.assign({}, activeNpc) : null; },
        getActiveDialogueId: function () { return activeDialogueId; },
        getActiveMessage: function () { return activeMessage; }
    };
    window.openNpcDialogue = openNpcDialogue;
    window.closeNpcDialogue = closeNpcDialogue;
})();
