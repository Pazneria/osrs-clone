(function () {
    const DEFAULT_COLOR_LABELS = ['Hair', 'Torso', 'Legs', 'Feet', 'Skin'];

    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getColorLabels(options = {}) {
        return Array.isArray(options.colorLabels) && options.colorLabels.length
            ? options.colorLabels
            : DEFAULT_COLOR_LABELS;
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
        return true;
    }

    function updatePlayerEntryGenderButtons(options = {}) {
        const documentRef = getDocumentRef(options);
        const appearance = options.playerAppearanceState || null;
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

    function renderPlayerEntryColorRows(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function' || typeof documentRef.createElement !== 'function') return;
        const container = documentRef.getElementById('player-entry-color-rows');
        if (!container) return;
        const labels = getColorLabels(options);
        const catalog = options.playerAppearanceCatalog || {};
        const palettes = Array.isArray(catalog.bodyColorPalettes) ? catalog.bodyColorPalettes : [];
        const appearance = options.playerAppearanceState || null;
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
        const appearance = options.playerAppearanceState || null;
        const safeName = profileSummaryViewModel
            ? profileSummaryViewModel.name
            : (sanitizePlayerName(profile.name, { maxLength: options.nameMaxLength }) || 'Unnamed Adventurer');
        const catalog = options.playerAppearanceCatalog || {};
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
        renderPlayerEntryColorRows(options);
        renderPlayerEntrySummary(options);
        return { nameValidation, isContinueFlow };
    }

    function bindPlayerEntryFlowControls(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return false;
        const profile = options.playerProfileState || null;
        const appearance = options.playerAppearanceState || null;
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
                renderPlayerEntryFlow(options);
                if (typeof options.refreshPlayerAppearancePreview === 'function') options.refreshPlayerAppearancePreview();
            });
        }

        if (femaleButton) {
            femaleButton.addEventListener('click', () => {
                if (!appearance) return;
                appearance.gender = 1;
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
        packedPlayerEntryColorToCss,
        formatPlayerEntryTimestamp,
        setPlayerEntryFlowOpen,
        renderPlayerEntryFlow,
        bindPlayerEntryFlowControls,
        focusPlayerEntryName,
        isPlayerEntryMounted
    };
})();
