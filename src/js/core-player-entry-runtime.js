(function () {
    const DEFAULT_COLOR_LABELS = ['Hair', 'Top', 'Bottom', 'Footwear', 'Skin'];
    const previewState = {
        container: null,
        scene: null,
        camera: null,
        renderer: null,
        rig: null,
        yaw: -Math.PI / 8,
        dragging: false,
        lastX: 0,
        frameHandle: null,
        resizeBound: false
    };

    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getAppearanceCatalog(options = {}) {
        return options.playerAppearanceCatalog || getWindowRef(options).PlayerAppearanceCatalog || {};
    }

    function getColorLabels(options = {}) {
        if (Array.isArray(options.colorLabels) && options.colorLabels.length) return options.colorLabels;
        const catalog = getAppearanceCatalog(options);
        return Array.isArray(catalog.bodyColorLabels) && catalog.bodyColorLabels.length
            ? catalog.bodyColorLabels
            : DEFAULT_COLOR_LABELS;
    }

    function getCreatorSlotOrder(options = {}) {
        const catalog = getAppearanceCatalog(options);
        return Array.isArray(catalog.creatorSlotOrder) ? catalog.creatorSlotOrder : [];
    }

    function resolveCreatorSlotOption(options = {}, creatorSlot, optionId) {
        const catalog = getAppearanceCatalog(options);
        const creatorSlots = catalog.creatorSlots || {};
        const creatorDefaults = catalog.creatorDefaults || {};
        const slotDef = creatorSlots[creatorSlot] || {};
        const slotOptions = Array.isArray(slotDef.options) ? slotDef.options : [];
        const requestedId = typeof optionId === 'string' ? optionId : '';
        const defaultId = typeof creatorDefaults[creatorSlot] === 'string' ? creatorDefaults[creatorSlot] : '';
        return slotOptions.find((option) => option && option.id === requestedId)
            || slotOptions.find((option) => option && option.id === defaultId)
            || slotOptions[0]
            || null;
    }

    function sanitizeCreatorSelections(options = {}, selections) {
        const input = selections && typeof selections === 'object' ? selections : {};
        const restored = {};
        getCreatorSlotOrder(options).forEach((creatorSlot) => {
            const option = resolveCreatorSlotOption(options, creatorSlot, input[creatorSlot]);
            if (option && typeof option.id === 'string') restored[creatorSlot] = option.id;
        });
        return restored;
    }

    function ensurePlayerEntryAppearance(options = {}) {
        const appearance = options.playerAppearanceState || null;
        if (!appearance) return null;
        appearance.gender = appearance.gender === 1 ? 1 : 0;
        const palettes = Array.isArray(getAppearanceCatalog(options).bodyColorPalettes)
            ? getAppearanceCatalog(options).bodyColorPalettes
            : [];
        const colorsIn = Array.isArray(appearance.colors) ? appearance.colors : [];
        const colors = [0, 0, 0, 0, 0];
        for (let i = 0; i < colors.length; i++) {
            const palette = Array.isArray(palettes[i]) ? palettes[i] : [];
            const raw = Number(colorsIn[i]);
            const safe = Number.isFinite(raw) ? Math.floor(raw) : 0;
            colors[i] = palette.length ? (((safe % palette.length) + palette.length) % palette.length) : safe;
        }
        appearance.colors = colors;
        appearance.creatorSelections = sanitizeCreatorSelections(options, appearance.creatorSelections);
        return appearance;
    }

    function sanitizePlayerName(value, options = {}) {
        if (typeof value !== 'string') return '';
        const maxLength = Number.isFinite(options.maxLength) ? Math.max(1, Math.floor(options.maxLength)) : 12;
        const cleaned = value
            .replace(/[^A-Za-z0-9 _-]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (!cleaned) return '';
        return cleaned.slice(0, maxLength).trim();
    }

    function validatePlayerEntryName(options = {}) {
        const minLength = Number.isFinite(options.minLength) ? Math.max(1, Math.floor(options.minLength)) : 2;
        const maxLength = Number.isFinite(options.maxLength) ? Math.max(minLength, Math.floor(options.maxLength)) : 12;
        const value = sanitizePlayerName(options.name, { maxLength });
        if (!value) {
            return {
                ok: false,
                value: '',
                message: `Choose a name with ${minLength}-${maxLength} letters or numbers.`
            };
        }
        if (value.length < minLength) {
            return {
                ok: false,
                value,
                message: `Name must be at least ${minLength} characters long.`
            };
        }
        return { ok: true, value, message: '' };
    }

    function unpackPlayerEntryHsl(packed) {
        const safePacked = Number.isFinite(packed) ? Math.floor(packed) : 0;
        return {
            h: (safePacked >> 10) & 63,
            s: (safePacked >> 7) & 7,
            l: safePacked & 127
        };
    }

    function playerEntryHueToRgb(p, q, t) {
        let wrapped = t;
        if (wrapped < 0) wrapped += 1;
        if (wrapped > 1) wrapped -= 1;
        if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
        if (wrapped < 1 / 2) return q;
        if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
        return p;
    }

    function packedPlayerEntryColorToCss(packed) {
        const hsl = unpackPlayerEntryHsl(packed);
        const h = hsl.h / 63;
        const s = hsl.s / 7;
        const l = hsl.l / 127;
        let r;
        let g;
        let b;
        if (s === 0) {
            r = l;
            g = l;
            b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - (l * s);
            const p = (2 * l) - q;
            r = playerEntryHueToRgb(p, q, h + (1 / 3));
            g = playerEntryHueToRgb(p, q, h);
            b = playerEntryHueToRgb(p, q, h - (1 / 3));
        }
        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }

    function formatPlayerEntryTimestamp(value) {
        if (!Number.isFinite(value)) return 'unknown';
        try {
            return new Date(value).toLocaleString();
        } catch (error) {
            return 'unknown';
        }
    }

    function buildProfileSummaryViewModel(options = {}) {
        const builder = options.buildPlayerProfileSummaryViewModel;
        if (typeof builder !== 'function') return null;
        return builder({
            profile: options.playerProfileState,
            playerEntryFlow: options.playerEntryFlowState,
            playerAppearance: options.playerAppearanceState,
            formatTimestamp: options.formatTimestamp || formatPlayerEntryTimestamp
        });
    }

    function resizePlayerEntryPreview(options = {}) {
        const windowRef = getWindowRef(options);
        if (!previewState.container || !previewState.renderer || !previewState.camera) return false;
        const width = Math.max(240, previewState.container.clientWidth || 420);
        const height = Math.max(260, previewState.container.clientHeight || 520);
        previewState.renderer.setSize(width, height, false);
        previewState.camera.aspect = width / height;
        previewState.camera.updateProjectionMatrix();
        if (windowRef.requestAnimationFrame) windowRef.requestAnimationFrame(() => renderPlayerEntryPreview());
        else renderPlayerEntryPreview();
        return true;
    }

    function renderPlayerEntryPreview() {
        if (!previewState.renderer || !previewState.scene || !previewState.camera) return false;
        if (previewState.rig) previewState.rig.rotation.y = previewState.yaw;
        previewState.renderer.render(previewState.scene, previewState.camera);
        return true;
    }

    function buildPreviewAppearance(options = {}) {
        const appearance = ensurePlayerEntryAppearance(options);
        if (!appearance) return null;
        return {
            gender: appearance.gender === 1 ? 1 : 0,
            colors: Array.isArray(appearance.colors) ? appearance.colors.slice(0, 5) : [0, 0, 0, 0, 0],
            creatorSelections: sanitizeCreatorSelections(options, appearance.creatorSelections),
            slots: []
        };
    }

    function replacePreviewRig(options = {}) {
        const windowRef = getWindowRef(options);
        if (!previewState.scene || typeof windowRef.createPlayerRigFromAppearance !== 'function') return false;
        const nextAppearance = buildPreviewAppearance(options);
        if (!nextAppearance) return false;
        const nextRig = windowRef.createPlayerRigFromAppearance(nextAppearance);
        if (!nextRig) return false;
        nextRig.position.set(0, -0.18, -0.16);
        nextRig.rotation.y = previewState.yaw;
        nextRig.scale.set(1.18, 1.18, 1.18);
        if (previewState.rig && previewState.rig.parent) previewState.rig.parent.remove(previewState.rig);
        previewState.rig = nextRig;
        previewState.scene.add(nextRig);
        renderPlayerEntryPreview();
        return true;
    }

    function startPreviewLoop(options = {}) {
        renderPlayerEntryPreview();
    }

    function bindPreviewDrag(options = {}) {
        const documentRef = getDocumentRef(options);
        const windowRef = getWindowRef(options);
        if (!previewState.container || previewState.container.dataset.playerEntryPreviewBound === 'true') return;
        previewState.container.dataset.playerEntryPreviewBound = 'true';
        previewState.container.addEventListener('mousedown', (event) => {
            previewState.dragging = true;
            previewState.lastX = event.clientX;
            event.preventDefault();
        });
        const moveTarget = windowRef && typeof windowRef.addEventListener === 'function' ? windowRef : documentRef;
        if (moveTarget && typeof moveTarget.addEventListener === 'function') {
            moveTarget.addEventListener('mousemove', (event) => {
                if (!previewState.dragging) return;
                previewState.yaw += (event.clientX - previewState.lastX) * 0.012;
                previewState.lastX = event.clientX;
                renderPlayerEntryPreview();
            });
            moveTarget.addEventListener('mouseup', () => {
                previewState.dragging = false;
            });
        }
    }

    function initPlayerEntryPreview(options = {}) {
        const documentRef = getDocumentRef(options);
        const windowRef = getWindowRef(options);
        const THREERef = windowRef.THREE || (typeof THREE !== 'undefined' ? THREE : null);
        if (!documentRef || !THREERef || typeof windowRef.createPlayerRigFromAppearance !== 'function') return false;
        const container = documentRef.getElementById('player-entry-preview-stage');
        if (!container) return false;

        if (previewState.container !== container || !previewState.renderer) {
            if (previewState.renderer && previewState.renderer.domElement && previewState.renderer.domElement.parentNode) {
                previewState.renderer.domElement.parentNode.removeChild(previewState.renderer.domElement);
            }
            previewState.container = container;
            previewState.scene = new THREERef.Scene();
            previewState.camera = new THREERef.PerspectiveCamera(36, 1, 0.1, 100);
            previewState.camera.position.set(0, 1.15, 4.3);
            previewState.camera.lookAt(0, 0.82, 0);
            previewState.renderer = new THREERef.WebGLRenderer({ antialias: false, alpha: true });
            previewState.renderer.outputColorSpace = THREERef.SRGBColorSpace;
            previewState.renderer.domElement.className = 'player-entry-preview-canvas';
            container.innerHTML = '';
            container.appendChild(previewState.renderer.domElement);
            previewState.scene.add(new THREERef.HemisphereLight(0xfff0d0, 0x6f7f64, 1.05));
            previewState.scene.add(new THREERef.AmbientLight(0xffffff, 0.75));
            const keyLight = new THREERef.DirectionalLight(0xffdfaa, 1.35);
            keyLight.position.set(2.8, 4.2, 3.6);
            previewState.scene.add(keyLight);
            const rimLight = new THREERef.DirectionalLight(0x9bc6ff, 0.55);
            rimLight.position.set(-3, 2.5, -2);
            previewState.scene.add(rimLight);
            const floor = new THREERef.Mesh(
                new THREERef.CylinderGeometry(0.72, 0.88, 0.045, 24),
                new THREERef.MeshLambertMaterial({ color: 0x4b3320 })
            );
            floor.position.set(0, -0.245, -0.16);
            previewState.scene.add(floor);
            bindPreviewDrag(options);
            resizePlayerEntryPreview(options);
            if (!previewState.resizeBound && windowRef && typeof windowRef.addEventListener === 'function') {
                windowRef.addEventListener('resize', () => resizePlayerEntryPreview(options));
                previewState.resizeBound = true;
            }
        }

        replacePreviewRig(options);
        resizePlayerEntryPreview(options);
        startPreviewLoop(options);
        return true;
    }

    function refreshPlayerEntryPreview(options = {}) {
        if (!previewState.renderer) return initPlayerEntryPreview(options);
        replacePreviewRig(options);
        resizePlayerEntryPreview(options);
        return true;
    }

    function setPlayerEntryFlowOpen(options = {}) {
        const documentRef = getDocumentRef(options);
        const playerEntryFlowState = options.playerEntryFlowState || null;
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const overlay = documentRef.getElementById('player-entry-overlay');
        if (!overlay) return false;

        const isOpen = !!options.isOpen;
        if (playerEntryFlowState) playerEntryFlowState.isOpen = isOpen;
        overlay.classList.toggle('hidden', !isOpen);
        if (documentRef.body && documentRef.body.classList) {
            documentRef.body.classList.toggle('player-entry-open', isOpen);
        }
        if (isOpen) initPlayerEntryPreview(options);
        return true;
    }

    function updatePlayerEntryGenderButtons(options = {}) {
        const documentRef = getDocumentRef(options);
        const appearance = ensurePlayerEntryAppearance(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return;
        const currentGender = appearance && appearance.gender === 1 ? 1 : 0;
        [0, 1].forEach((gender) => {
            const button = documentRef.getElementById(`player-entry-gender-${gender}`);
            if (!button) return;
            const active = currentGender === gender;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function renderPlayerEntryCreatorRows(options = {}) {
        const documentRef = getDocumentRef(options);
        const appearance = ensurePlayerEntryAppearance(options);
        if (!documentRef || !appearance || typeof documentRef.getElementById !== 'function' || typeof documentRef.createElement !== 'function') return;
        const container = documentRef.getElementById('player-entry-creator-rows');
        if (!container) return;
        const catalog = getAppearanceCatalog(options);
        const creatorSlots = catalog.creatorSlots || {};
        container.innerHTML = '';

        getCreatorSlotOrder(options).forEach((creatorSlot) => {
            const slotDef = creatorSlots[creatorSlot] || {};
            const option = resolveCreatorSlotOption(options, creatorSlot, appearance.creatorSelections[creatorSlot]);
            const row = documentRef.createElement('div');
            row.className = 'player-entry-creator-row';

            const label = documentRef.createElement('div');
            label.className = 'player-entry-creator-label';
            label.textContent = slotDef.label || creatorSlot;
            row.appendChild(label);

            const control = documentRef.createElement('div');
            control.className = 'player-entry-creator-control';

            const createStepButton = (step) => {
                const button = documentRef.createElement('button');
                button.type = 'button';
                button.className = 'player-entry-arrow';
                button.textContent = step < 0 ? '<' : '>';
                button.setAttribute('aria-label', `${step < 0 ? 'Previous' : 'Next'} ${slotDef.label || creatorSlot}`);
                button.onclick = () => {
                    const slotOptions = Array.isArray(slotDef.options) ? slotDef.options : [];
                    if (!slotOptions.length) return;
                    const currentIndex = Math.max(0, slotOptions.findIndex((entry) => entry && entry.id === appearance.creatorSelections[creatorSlot]));
                    const nextIndex = (currentIndex + step + slotOptions.length) % slotOptions.length;
                    appearance.creatorSelections[creatorSlot] = slotOptions[nextIndex].id;
                    renderPlayerEntryFlow(options);
                    if (typeof options.refreshPlayerAppearancePreview === 'function') options.refreshPlayerAppearancePreview();
                };
                return button;
            };

            control.appendChild(createStepButton(-1));
            const value = documentRef.createElement('div');
            value.className = 'player-entry-creator-value';
            value.textContent = option && option.label ? option.label : 'Default';
            control.appendChild(value);
            control.appendChild(createStepButton(1));

            row.appendChild(control);
            container.appendChild(row);
        });
    }

    function renderPlayerEntryColorRows(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function' || typeof documentRef.createElement !== 'function') return;
        const container = documentRef.getElementById('player-entry-color-rows');
        if (!container) return;
        const labels = getColorLabels(options);
        const catalog = getAppearanceCatalog(options);
        const palettes = Array.isArray(catalog.bodyColorPalettes) ? catalog.bodyColorPalettes : [];
        const appearance = ensurePlayerEntryAppearance(options);
        if (!appearance || !Array.isArray(appearance.colors)) return;

        container.innerHTML = '';

        for (let paletteIndex = 0; paletteIndex < labels.length; paletteIndex++) {
            const row = documentRef.createElement('div');
            row.className = 'player-entry-color-row';

            const label = documentRef.createElement('div');
            label.className = 'player-entry-color-row-label';
            label.textContent = labels[paletteIndex];
            row.appendChild(label);

            const swatches = documentRef.createElement('div');
            swatches.className = 'player-entry-color-row-swatches';

            const palette = Array.isArray(palettes[paletteIndex]) ? palettes[paletteIndex] : [];
            const activeIndex = Number.isFinite(appearance.colors[paletteIndex])
                ? Math.floor(appearance.colors[paletteIndex])
                : 0;

            for (let swatchIndex = 0; swatchIndex < palette.length; swatchIndex++) {
                const swatchButton = documentRef.createElement('button');
                swatchButton.type = 'button';
                swatchButton.className = 'player-entry-swatch';
                if (swatchIndex === activeIndex) swatchButton.classList.add('active');
                swatchButton.style.backgroundColor = packedPlayerEntryColorToCss(palette[swatchIndex]);
                swatchButton.setAttribute('aria-label', `${labels[paletteIndex]} option ${swatchIndex + 1}`);
                swatchButton.onclick = () => {
                    appearance.colors[paletteIndex] = swatchIndex;
                    renderPlayerEntryFlow(options);
                    if (typeof options.refreshPlayerAppearancePreview === 'function') options.refreshPlayerAppearancePreview();
                };
                swatches.appendChild(swatchButton);
            }

            row.appendChild(swatches);
            container.appendChild(row);
        }
    }

    function renderPlayerEntrySummary(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function' || typeof documentRef.createElement !== 'function') return;
        const summary = documentRef.getElementById('player-entry-summary');
        if (!summary) return;
        const labels = getColorLabels(options);
        const profileSummaryViewModel = buildProfileSummaryViewModel(options);
        const profile = options.playerProfileState || {};
        const appearance = ensurePlayerEntryAppearance(options);
        const safeName = profileSummaryViewModel
            ? profileSummaryViewModel.name
            : (sanitizePlayerName(profile.name, { maxLength: options.nameMaxLength }) || 'Unnamed Adventurer');
        const catalog = getAppearanceCatalog(options);
        const palettes = Array.isArray(catalog.bodyColorPalettes) ? catalog.bodyColorPalettes : [];
        const colors = appearance && Array.isArray(appearance.colors)
            ? appearance.colors
            : [0, 0, 0, 0, 0];

        summary.innerHTML = '';

        const heading = documentRef.createElement('div');
        heading.className = 'player-entry-summary-name';
        heading.textContent = safeName;
        summary.appendChild(heading);

        const bodyType = documentRef.createElement('div');
        bodyType.className = 'player-entry-summary-meta';
        bodyType.textContent = `Body type: ${profileSummaryViewModel ? profileSummaryViewModel.bodyTypeLabel : (appearance && appearance.gender === 1 ? 'Female' : 'Male')}`;
        summary.appendChild(bodyType);

        const meta = documentRef.createElement('div');
        meta.className = 'player-entry-summary-meta';
        meta.textContent = profileSummaryViewModel ? profileSummaryViewModel.statusText : 'Fresh character profile';
        summary.appendChild(meta);

        const swatchList = documentRef.createElement('div');
        swatchList.className = 'player-entry-summary-swatches';
        for (let paletteIndex = 0; paletteIndex < labels.length; paletteIndex++) {
            const palette = Array.isArray(palettes[paletteIndex]) ? palettes[paletteIndex] : [];
            const activeIndex = Number.isFinite(colors[paletteIndex]) ? Math.floor(colors[paletteIndex]) : 0;
            const packed = palette[activeIndex] !== undefined ? palette[activeIndex] : 0;

            const chip = documentRef.createElement('div');
            chip.className = 'player-entry-summary-chip';

            const colorDot = documentRef.createElement('span');
            colorDot.className = 'player-entry-summary-chip-color';
            colorDot.style.backgroundColor = packedPlayerEntryColorToCss(packed);
            chip.appendChild(colorDot);

            const chipLabel = documentRef.createElement('span');
            chipLabel.textContent = labels[paletteIndex];
            chip.appendChild(chipLabel);

            swatchList.appendChild(chip);
        }
        summary.appendChild(swatchList);
    }

    function renderPlayerEntryFlow(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return null;
        const profile = options.playerProfileState || {};
        const playerEntryFlowState = options.playerEntryFlowState || {};
        ensurePlayerEntryAppearance(options);
        const title = documentRef.getElementById('player-entry-title');
        const subtitle = documentRef.getElementById('player-entry-subtitle');
        const nameInput = documentRef.getElementById('player-entry-name');
        const error = documentRef.getElementById('player-entry-name-error');
        const note = documentRef.getElementById('player-entry-secondary-note');
        const primary = documentRef.getElementById('player-entry-primary');
        const nameValidation = validatePlayerEntryName({
            name: profile.name,
            minLength: options.nameMinLength,
            maxLength: options.nameMaxLength
        });
        const profileSummaryViewModel = buildProfileSummaryViewModel(options);
        const isContinueFlow = profileSummaryViewModel
            ? profileSummaryViewModel.isContinueFlow
            : (!!playerEntryFlowState.hasLoadedSave && !!profile.creationCompleted);

        if (title) title.textContent = profileSummaryViewModel ? profileSummaryViewModel.titleText : (isContinueFlow ? 'Continue Your Adventure' : 'Create Your Adventurer');
        if (subtitle) subtitle.textContent = profileSummaryViewModel ? profileSummaryViewModel.subtitleText : 'Choose a starter identity before you arrive on Tutorial Island.';

        if (nameInput) {
            if (documentRef.activeElement !== nameInput && nameInput.value !== profile.name) {
                nameInput.value = profile.name;
            }
            nameInput.placeholder = options.defaultName || 'Adventurer';
        }
        if (error) error.textContent = nameValidation.ok ? '' : nameValidation.message;
        if (primary) {
            primary.textContent = profileSummaryViewModel ? profileSummaryViewModel.primaryActionText : (isContinueFlow ? 'Continue Adventure' : 'Start Adventure');
            primary.disabled = !nameValidation.ok;
        }
        if (note) note.textContent = profileSummaryViewModel ? profileSummaryViewModel.noteText : 'Progress will begin autosaving locally in this browser once you arrive.';

        updatePlayerEntryGenderButtons(options);
        renderPlayerEntryCreatorRows(options);
        renderPlayerEntryColorRows(options);
        renderPlayerEntrySummary(options);
        refreshPlayerEntryPreview(options);
        return { nameValidation, isContinueFlow };
    }

    function bindPlayerEntryFlowControls(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const profile = options.playerProfileState || null;
        const appearance = ensurePlayerEntryAppearance(options);
        const nameInput = documentRef.getElementById('player-entry-name');
        const primaryButton = documentRef.getElementById('player-entry-primary');
        const maleButton = documentRef.getElementById('player-entry-gender-0');
        const femaleButton = documentRef.getElementById('player-entry-gender-1');

        if (nameInput) {
            nameInput.addEventListener('input', () => {
                const sanitized = sanitizePlayerName(nameInput.value, { maxLength: options.nameMaxLength });
                if (nameInput.value !== sanitized) nameInput.value = sanitized;
                if (profile) profile.name = sanitized;
                renderPlayerEntryFlow(options);
            });
            nameInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    if (typeof options.completePlayerEntryFlow === 'function') options.completePlayerEntryFlow();
                }
            });
        }

        if (maleButton) {
            maleButton.addEventListener('click', () => {
                if (!appearance) return;
                appearance.gender = 0;
                appearance.creatorSelections = sanitizeCreatorSelections(options, appearance.creatorSelections);
                renderPlayerEntryFlow(options);
                if (typeof options.refreshPlayerAppearancePreview === 'function') options.refreshPlayerAppearancePreview();
            });
        }

        if (femaleButton) {
            femaleButton.addEventListener('click', () => {
                if (!appearance) return;
                appearance.gender = 1;
                appearance.creatorSelections = sanitizeCreatorSelections(options, appearance.creatorSelections);
                renderPlayerEntryFlow(options);
                if (typeof options.refreshPlayerAppearancePreview === 'function') options.refreshPlayerAppearancePreview();
            });
        }

        if (primaryButton) primaryButton.addEventListener('click', options.completePlayerEntryFlow);
        return true;
    }

    function focusPlayerEntryName(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const nameInput = documentRef.getElementById('player-entry-name');
        if (!nameInput) return false;
        if (typeof nameInput.focus === 'function') nameInput.focus();
        if (typeof nameInput.select === 'function') nameInput.select();
        return true;
    }

    function isPlayerEntryMounted(options = {}) {
        const documentRef = getDocumentRef(options);
        return !!(documentRef && typeof documentRef.getElementById === 'function' && documentRef.getElementById('player-entry-overlay'));
    }

    window.CorePlayerEntryRuntime = {
        sanitizePlayerName,
        validatePlayerEntryName,
        sanitizeCreatorSelections,
        packedPlayerEntryColorToCss,
        formatPlayerEntryTimestamp,
        setPlayerEntryFlowOpen,
        initPlayerEntryPreview,
        refreshPlayerEntryPreview,
        renderPlayerEntryFlow,
        bindPlayerEntryFlowControls,
        focusPlayerEntryName,
        isPlayerEntryMounted
    };
})();
