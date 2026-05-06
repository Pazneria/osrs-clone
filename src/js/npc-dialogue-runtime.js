(function () {
    const FALLBACK_TITLE = 'Conversation';
    const FALLBACK_GREETING = 'They do not have much to say right now.';

    let activeNpc = null;
    let activeDialogueId = '';
    let activeDialogueView = null;
    let activeMessage = '';
    let activePageFlow = null;
    const portraitState = {
        scene: null,
        camera: null,
        renderer: null,
        rig: null,
        container: null,
        mounted: false,
        key: ''
    };

    function getOverlayEl() {
        return document.getElementById('npc-dialogue-overlay');
    }

    function getPanelEl() {
        return document.getElementById('npc-dialogue-panel');
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

    function getPortraitEl() {
        return document.querySelector('.npc-dialogue-portrait');
    }

    function getPortraitModelEl() {
        return document.getElementById('npc-dialogue-portrait-model');
    }

    function normalizeNpcData(npc) {
        if (!npc || typeof npc !== 'object') return {};
        return Object.assign({}, npc);
    }

    function normalizeDialoguePages(value) {
        if (Array.isArray(value)) {
            return value
                .map((entry) => typeof entry === 'string' ? entry.trim() : '')
                .filter((entry) => entry.length > 0);
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed ? [trimmed] : [];
        }
        return [];
    }

    function hasDialogueText(value) {
        return normalizeDialoguePages(value).length > 0;
    }

    function normalizeDialogueValue(value, fallback) {
        const pages = normalizeDialoguePages(value);
        if (pages.length > 1) return pages;
        if (pages.length === 1) return pages[0];
        return fallback;
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
            greeting: normalizeDialogueValue(entry && entry.greeting, FALLBACK_GREETING),
            options: Array.isArray(entry && entry.options) ? entry.options.slice() : []
        };

        if (window.QuestRuntime && typeof window.QuestRuntime.buildNpcDialogueView === 'function') {
            const questView = window.QuestRuntime.buildNpcDialogueView(npc, baseView);
            if (questView && typeof questView === 'object') {
                const resolvedQuestView = {
                    title: questView.title || baseView.title,
                    greeting: normalizeDialogueValue(questView.greeting, baseView.greeting),
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

    function resolveOptionIconClass(option) {
        const kind = option && typeof option.kind === 'string' ? option.kind.trim().toLowerCase() : '';
        const label = option && typeof option.label === 'string' ? option.label.trim().toLowerCase() : '';
        if (kind === 'trade' || label.includes('trade') || label.includes('shop')) return 'npc-dialogue-option-icon-coin';
        if (kind === 'bank' || label.includes('bank')) return 'npc-dialogue-option-icon-bank';
        if (kind === 'travel' || label.includes('leave') || label.includes('exit')) return 'npc-dialogue-option-icon-arrow';
        if (kind === 'close' || label.includes('goodbye') || label.includes('close')) return 'npc-dialogue-option-icon-close';
        if (label.includes('ready')) return 'npc-dialogue-option-icon-sword';
        if (label.includes('move') || label.includes('walk')) return 'npc-dialogue-option-icon-walk';
        if (label.includes('?') || label.includes('what') || label.includes('how') || label.includes('why')) return 'npc-dialogue-option-icon-help';
        return 'npc-dialogue-option-icon-dot';
    }

    function resolveNpcAppearanceId(npc) {
        const worldNpcRuntime = window.WorldNpcRenderRuntime || null;
        if (worldNpcRuntime && typeof worldNpcRuntime.resolveNpcAppearanceId === 'function') {
            const resolved = worldNpcRuntime.resolveNpcAppearanceId(npc);
            if (resolved) return resolved;
        }
        const explicitAppearanceId = typeof npc.appearanceId === 'string' ? npc.appearanceId.trim().toLowerCase() : '';
        if (explicitAppearanceId) return explicitAppearanceId;
        const merchantId = typeof npc.merchantId === 'string' ? npc.merchantId.trim().toLowerCase() : '';
        const name = typeof npc.name === 'string' ? npc.name.trim().toLowerCase() : '';
        if (merchantId === 'tanner_rusk' || name === 'tanner rusk') return 'tanner_rusk';
        return '';
    }

    function resolveNpcModelType(npc) {
        if (Number.isFinite(npc && npc.type)) return Number(npc.type);
        if (Number.isFinite(npc && npc.npcType)) return Number(npc.npcType);
        const name = npc && typeof npc.name === 'string' ? npc.name.trim() : '';
        if (name === 'Shopkeeper') return 2;
        if (name === 'Banker') return 3;
        return 3;
    }

    function buildPortraitKey(npc) {
        if (!npc) return '';
        return [
            npc.spawnId || '',
            npc.merchantId || '',
            npc.name || '',
            npc.appearanceId || '',
            Number.isFinite(npc.type) ? npc.type : '',
            Number.isFinite(npc.npcType) ? npc.npcType : ''
        ].join('|');
    }

    function ensurePortraitRuntime() {
        const container = getPortraitModelEl();
        if (!container || typeof THREE === 'undefined') return false;
        if (portraitState.mounted && portraitState.container === container) return true;

        portraitState.container = container;
        portraitState.scene = new THREE.Scene();
        portraitState.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        portraitState.camera.position.set(0, 1.05, 3.15);
        portraitState.camera.lookAt(0, 0.92, 0);
        portraitState.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        portraitState.renderer.outputColorSpace = THREE.SRGBColorSpace;
        portraitState.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        portraitState.renderer.domElement.className = 'npc-dialogue-portrait-canvas';
        container.innerHTML = '';
        container.appendChild(portraitState.renderer.domElement);

        portraitState.scene.add(new THREE.HemisphereLight(0xfff4de, 0x6d5435, 1.1));
        portraitState.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const keyLight = new THREE.DirectionalLight(0xffe1a5, 1.15);
        keyLight.position.set(2.2, 4, 3);
        portraitState.scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0x9fb6ff, 0.38);
        rimLight.position.set(-2.5, 2.3, -1.5);
        portraitState.scene.add(rimLight);

        portraitState.mounted = true;
        return true;
    }

    function resizePortraitRuntime() {
        if (!portraitState.renderer || !portraitState.camera || !portraitState.container) return false;
        const rect = portraitState.container.getBoundingClientRect();
        const width = Math.max(72, Math.floor(rect.width || 0));
        const height = Math.max(88, Math.floor(rect.height || 0));
        portraitState.renderer.setSize(width, height, false);
        portraitState.camera.aspect = width / height;
        portraitState.camera.updateProjectionMatrix();
        return true;
    }

    function isVisibleElement(element) {
        if (!element || typeof window.getComputedStyle !== 'function') return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
    }

    function rectsOverlap(a, b) {
        return !!(
            a && b
            && a.left < b.right
            && a.right > b.left
            && a.top < b.bottom
            && a.bottom > b.top
        );
    }

    function offsetRect(rect, dx, dy) {
        return {
            left: rect.left + dx,
            right: rect.right + dx,
            top: rect.top + dy,
            bottom: rect.bottom + dy,
            width: rect.width,
            height: rect.height
        };
    }

    function inflateRect(rect, amount) {
        return {
            left: rect.left - amount,
            right: rect.right + amount,
            top: rect.top - amount,
            bottom: rect.bottom + amount,
            width: rect.width + (amount * 2),
            height: rect.height + (amount * 2)
        };
    }

    function getHudBlockers() {
        return [
            { id: 'chat-box', axis: 'y' },
            { id: 'main-ui-container', axis: 'x' },
            { id: 'runToggleBtn', axis: 'x' }
        ]
            .map((entry) => {
                const element = document.getElementById(entry.id);
                if (!isVisibleElement(element)) return null;
                const rect = element.getBoundingClientRect();
                if (!rect || rect.width <= 0 || rect.height <= 0) return null;
                return { rect, axis: entry.axis };
            })
            .filter(Boolean);
    }

    function positionNpcDialoguePanel() {
        const panel = getPanelEl();
        if (!panel || typeof window.requestAnimationFrame !== 'function') return;
        panel.style.setProperty('--npc-dialogue-offset-x', '0px');
        panel.style.setProperty('--npc-dialogue-offset-y', '0px');
        window.requestAnimationFrame(() => {
            if (!isOpen()) return;
            const nextPanel = getPanelEl();
            if (!nextPanel) return;
            const panelRect = nextPanel.getBoundingClientRect();
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
            const gap = 14;
            let dx = 0;
            let dy = 0;
            getHudBlockers().forEach((blocker) => {
                const blockerRect = inflateRect(blocker.rect, gap);
                const currentRect = offsetRect(panelRect, dx, dy);
                if (!rectsOverlap(currentRect, blockerRect)) return;
                if (blocker.axis === 'x') {
                    dx += blockerRect.left - currentRect.right;
                } else {
                    dy += blockerRect.top - currentRect.bottom;
                }
            });

            const movedRect = offsetRect(panelRect, dx, dy);
            if (movedRect.left < gap) dx += gap - movedRect.left;
            if (movedRect.right > viewportWidth - gap) dx -= movedRect.right - (viewportWidth - gap);
            if (movedRect.top < gap) dy += gap - movedRect.top;
            if (movedRect.bottom > viewportHeight - gap) dy -= movedRect.bottom - (viewportHeight - gap);

            nextPanel.style.setProperty('--npc-dialogue-offset-x', `${Math.round(dx)}px`);
            nextPanel.style.setProperty('--npc-dialogue-offset-y', `${Math.round(dy)}px`);
        });
    }

    function clearPortraitRig() {
        if (portraitState.rig && portraitState.scene) {
            portraitState.scene.remove(portraitState.rig);
        }
        portraitState.rig = null;
        portraitState.key = '';
        const portrait = getPortraitEl();
        if (portrait) portrait.classList.remove('has-live-model');
    }

    function createNpcPortraitRig(npc) {
        const appearanceId = resolveNpcAppearanceId(npc);
        let rig = null;
        if (appearanceId && typeof window.createNpcHumanoidRigFromPreset === 'function') {
            rig = window.createNpcHumanoidRigFromPreset(appearanceId);
        }
        if (!rig && typeof window.createHumanoidModel === 'function') {
            rig = window.createHumanoidModel(resolveNpcModelType(npc));
        }
        return rig;
    }

    function createNpcPortraitRoot(modelRig) {
        if (!modelRig || typeof THREE === 'undefined') return modelRig;
        const portraitRoot = new THREE.Group();
        portraitRoot.userData.modelRig = modelRig;
        if (modelRig.rotation && typeof modelRig.rotation.set === 'function') {
            modelRig.rotation.set(0, 0, 0);
        } else if (modelRig.rotation) {
            modelRig.rotation.y = 0;
        }
        portraitRoot.add(modelRig);
        portraitRoot.position.set(0, -0.64, 0);
        portraitRoot.rotation.y = 0;
        portraitRoot.scale.setScalar(1.02);
        return portraitRoot;
    }

    function renderNpcDialoguePortrait(npc) {
        if (!ensurePortraitRuntime()) return false;
        const nextKey = buildPortraitKey(npc);
        if (!portraitState.rig || portraitState.key !== nextKey) {
            clearPortraitRig();
            const modelRig = createNpcPortraitRig(npc || {});
            if (!modelRig || !portraitState.scene) return false;
            const portraitRoot = createNpcPortraitRoot(modelRig);
            portraitState.scene.add(portraitRoot);
            portraitState.rig = portraitRoot;
            portraitState.key = nextKey;
        }
        const portrait = getPortraitEl();
        if (portrait) portrait.classList.add('has-live-model');
        window.requestAnimationFrame(() => {
            if (!isOpen() || !portraitState.renderer || !portraitState.scene || !portraitState.camera) return;
            resizePortraitRuntime();
            portraitState.renderer.render(portraitState.scene, portraitState.camera);
        });
        return true;
    }

    function closeNpcDialogue() {
        activeNpc = null;
        activeDialogueId = '';
        activeDialogueView = null;
        activeMessage = '';
        activePageFlow = null;
        const panel = getPanelEl();
        if (panel) {
            panel.style.setProperty('--npc-dialogue-offset-x', '0px');
            panel.style.setProperty('--npc-dialogue-offset-y', '0px');
        }
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

    function showDialogueMessage(value) {
        const pages = normalizeDialoguePages(value);
        activePageFlow = pages.length > 1
            ? { pages, pageIndex: 0 }
            : null;
        updateBodyText(pages[0] || FALLBACK_GREETING);
    }

    function advanceDialoguePage() {
        if (!activePageFlow || !Array.isArray(activePageFlow.pages)) return false;
        if (activePageFlow.pageIndex < activePageFlow.pages.length - 1) {
            activePageFlow.pageIndex += 1;
            updateBodyText(activePageFlow.pages[activePageFlow.pageIndex] || FALLBACK_GREETING);
            renderDialogueOptions(activeNpc, activeDialogueView);
            return true;
        }
        activePageFlow = null;
        renderDialogueOptions(activeNpc, activeDialogueView);
        return true;
    }

    function renderContinueOption(optionsEl) {
        if (!optionsEl || !activePageFlow || !Array.isArray(activePageFlow.pages)) return false;
        const currentPage = activePageFlow.pageIndex + 1;
        const totalPages = activePageFlow.pages.length;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'npc-dialogue-option npc-dialogue-option-continue';
        const icon = document.createElement('span');
        icon.className = 'npc-dialogue-option-icon npc-dialogue-option-icon-arrow';
        icon.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.className = 'npc-dialogue-option-label';
        label.textContent = `Continue (${currentPage}/${totalPages})`;
        button.appendChild(icon);
        button.appendChild(label);
        button.addEventListener('click', advanceDialoguePage);
        optionsEl.appendChild(button);
        return true;
    }

    function refreshActiveDialogue(bodyTextOverride) {
        if (!activeNpc) return;
        const normalizedNpc = normalizeNpcData(activeNpc);
        const dialogueView = buildDialogueView(normalizedNpc);
        activeDialogueView = dialogueView;
        const overlay = getOverlayEl();
        if (overlay) {
            overlay.dataset.dialogueId = activeDialogueId || '';
            overlay.dataset.npcName = normalizedNpc.name || '';
        }
        renderNpcDialoguePortrait(normalizedNpc);

        const titleEl = getTitleEl();
        if (titleEl) titleEl.textContent = dialogueView.title || FALLBACK_TITLE;

        const nextBodyText = hasDialogueText(bodyTextOverride)
            ? bodyTextOverride
            : dialogueView.greeting;
        showDialogueMessage(nextBodyText);
        renderDialogueOptions(normalizedNpc, dialogueView);
    }

    function renderDialogueOptions(npc, dialogueView) {
        const optionsEl = getOptionsEl();
        if (!optionsEl) return;
        optionsEl.innerHTML = '';

        if (activePageFlow && renderContinueOption(optionsEl)) {
            positionNpcDialoguePanel();
            return;
        }

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
            button.className = 'npc-dialogue-option';
            const icon = document.createElement('span');
            icon.className = `npc-dialogue-option-icon ${resolveOptionIconClass(option)}`;
            icon.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.className = 'npc-dialogue-option-label';
            label.textContent = option.label || 'Option';
            button.appendChild(icon);
            button.appendChild(label);
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
                        updateBodyText: showDialogueMessage,
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
                    if (result && hasDialogueText(result.bodyText)) {
                        showDialogueMessage(result.bodyText);
                        renderDialogueOptions(activeNpc, activeDialogueView);
                        return;
                    }
                }
                if (hasDialogueText(option.response)) {
                    showDialogueMessage(option.response);
                    renderDialogueOptions(activeNpc, activeDialogueView);
                }
            });
            optionsEl.appendChild(button);
        });
        positionNpcDialoguePanel();
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

    function getActivePageProgress() {
        if (!activePageFlow || !Array.isArray(activePageFlow.pages)) {
            return { page: 1, total: 1 };
        }
        return {
            page: activePageFlow.pageIndex + 1,
            total: activePageFlow.pages.length
        };
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
        window.addEventListener('resize', () => {
            if (isOpen() && activeNpc) renderNpcDialoguePortrait(activeNpc);
            if (isOpen()) positionNpcDialoguePanel();
        });
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
        getActiveMessage: function () { return activeMessage; },
        getActivePageProgress: getActivePageProgress
    };
    window.openNpcDialogue = openNpcDialogue;
    window.closeNpcDialogue = closeNpcDialogue;
})();
