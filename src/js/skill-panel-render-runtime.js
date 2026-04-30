(function () {
    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function escapeHtml(value, options = {}) {
        if (typeof options.escapeHtml === 'function') return options.escapeHtml(value);
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getUnlockTypeLabel(unlockEntry, options = {}) {
        return typeof options.getUnlockTypeLabel === 'function'
            ? options.getUnlockTypeLabel(unlockEntry)
            : 'Unlock';
    }

    function buildRecipeDetails(skillName, unlockEntry, options = {}) {
        return typeof options.buildRecipeDetails === 'function'
            ? options.buildRecipeDetails(skillName, unlockEntry)
            : null;
    }

    function addSkillPanelDetailSection(container, title, rows, options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || !container || !Array.isArray(rows) || rows.length === 0) return;
        const section = documentRef.createElement('div');
        section.className = 'pt-1';

        const heading = documentRef.createElement('div');
        heading.className = 'text-[#c8aa6e] uppercase tracking-wide text-[10px] font-bold';
        heading.innerText = title;
        section.appendChild(heading);

        for (let i = 0; i < rows.length; i++) {
            const row = documentRef.createElement('div');
            row.className = 'text-gray-200';
            row.innerText = rows[i];
            section.appendChild(row);
        }

        container.appendChild(section);
    }

    function buildSkillPanelUnlockDetailsElement(skillName, unlockLevel, unlockEntry, options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || !unlockEntry) return null;
        const detailsEl = documentRef.createElement('div');
        detailsEl.className = 'ml-2 mr-1 mb-1 border border-[#6b5733] bg-[#1f1811] px-2 py-1.5 text-[10px] leading-4 text-gray-200';

        const title = documentRef.createElement('div');
        title.className = 'text-[#ffd27d] font-bold uppercase tracking-wide';
        title.innerText = unlockEntry.label;
        detailsEl.appendChild(title);

        const summaryRows = [
            `Unlock level: ${Number.isFinite(unlockLevel) ? Math.max(1, Math.floor(unlockLevel)) : 1}`,
            `Type: ${getUnlockTypeLabel(unlockEntry, options)}`
        ];
        addSkillPanelDetailSection(detailsEl, 'Summary', summaryRows, options);

        const recipeDetails = buildRecipeDetails(skillName, unlockEntry, options);
        if (recipeDetails) {
            addSkillPanelDetailSection(detailsEl, 'Ingredients', recipeDetails.inputs.length ? recipeDetails.inputs : ['None'], options);
            addSkillPanelDetailSection(detailsEl, 'Results', recipeDetails.outputs.length ? recipeDetails.outputs : ['No explicit output row'], options);
            addSkillPanelDetailSection(detailsEl, 'Notes', recipeDetails.meta.length ? recipeDetails.meta : ['No additional recipe metadata'], options);
        } else {
            addSkillPanelDetailSection(detailsEl, 'Details', ['No structured recipe data is attached to this unlock yet.'], options);
        }
        return detailsEl;
    }

    function renderSkillPanelSummary(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef) return;
        const summaryEl = documentRef.getElementById('skill-panel-summary');
        if (!summaryEl) return;

        const progressViewModel = options.progressViewModel || null;
        const referenceViewModel = options.referenceViewModel || null;
        if (!progressViewModel || !referenceViewModel) {
            summaryEl.innerHTML = '<div class="text-gray-400">Structured tier-band data is not available yet for this skill.</div>';
            return;
        }

        const nextBandText = referenceViewModel.nextBandLabel || 'Top band';
        summaryEl.innerHTML = `<div class="flex items-center justify-between gap-2">
                <div class="text-[#ffcf8b] font-bold">${escapeHtml(progressViewModel.icon, options)} ${escapeHtml(progressViewModel.name, options)}</div>
                <div class="text-[10px] uppercase tracking-[0.16em] text-[#c8aa6e]">Lv ${escapeHtml(progressViewModel.level, options)}</div>
            </div>
            <div class="mt-2 grid gap-1 text-[10px] leading-4">
                <div class="flex items-center justify-between gap-3">
                    <span class="text-gray-400">Current band</span>
                    <span class="text-white">${escapeHtml(referenceViewModel.currentBandLabel, options)}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                    <span class="text-gray-400">Next band</span>
                    <span class="text-white">${escapeHtml(nextBandText, options)}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                    <span class="text-gray-400">To next level</span>
                    <span class="text-white">${escapeHtml(progressViewModel.remainingText, options)}</span>
                </div>
                <div class="pt-1 text-gray-300">${escapeHtml(referenceViewModel.nextUnlockText, options)}</div>
            </div>`;
    }

    function hasUnlockKey(tiers, activeUnlockKey) {
        if (!activeUnlockKey) return false;
        return !!tiers.find((tier) => Array.isArray(tier.unlocks) && tier.unlocks.find((unlock) => unlock.key === activeUnlockKey));
    }

    function renderSkillPanelTimeline(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef) return null;
        const timelineEl = documentRef.getElementById('skill-panel-unlocks');
        if (!timelineEl) return options.activeUnlockKey || null;
        timelineEl.innerHTML = '';

        const referenceViewModel = options.referenceViewModel || null;
        const tiers = referenceViewModel && Array.isArray(referenceViewModel.tiers) ? referenceViewModel.tiers : [];
        if (!tiers.length) {
            const empty = documentRef.createElement('div');
            empty.className = 'text-gray-400';
            empty.innerText = 'No tracked tier data is available yet for this skill.';
            timelineEl.appendChild(empty);
            return null;
        }

        let activeUnlockKey = hasUnlockKey(tiers, options.activeUnlockKey) ? options.activeUnlockKey : null;

        for (let i = 0; i < tiers.length; i++) {
            const tier = tiers[i];
            const tierWrap = documentRef.createElement('div');
            tierWrap.className = 'border border-[#3e3529] bg-[#120e0b]';

            const tierHeader = documentRef.createElement('div');
            tierHeader.className = tier.status === 'unlocked'
                ? 'px-2 py-1.5 flex items-center justify-between gap-2 text-[#9fdc8f] text-[10px] uppercase tracking-wide font-bold border-b border-[#3e3529]'
                : (tier.status === 'current'
                    ? 'px-2 py-1.5 flex items-center justify-between gap-2 text-[#ffcf8b] text-[10px] uppercase tracking-wide font-bold border-b border-[#3e3529]'
                    : (tier.status === 'next'
                        ? 'px-2 py-1.5 flex items-center justify-between gap-2 text-[#ffd27d] text-[10px] uppercase tracking-wide font-bold border-b border-[#3e3529]'
                        : 'px-2 py-1.5 flex items-center justify-between gap-2 text-gray-400 text-[10px] uppercase tracking-wide font-bold border-b border-[#3e3529]'));

            const tierLabel = documentRef.createElement('span');
            tierLabel.innerText = tier.bandLabel;

            const tierMeta = documentRef.createElement('span');
            const statusLabel = tier.status === 'current'
                ? 'Current'
                : (tier.status === 'next'
                    ? 'Next'
                    : (tier.status === 'unlocked' ? 'Cleared' : 'Later'));
            const unlockCountText = tier.unlockCount === 0
                ? 'No unlocks'
                : `${tier.unlockCount} unlock${tier.unlockCount === 1 ? '' : 's'}`;
            tierMeta.innerText = `${statusLabel} / ${unlockCountText}`;

            tierHeader.appendChild(tierLabel);
            tierHeader.appendChild(tierMeta);
            tierWrap.appendChild(tierHeader);

            const tierBody = documentRef.createElement('div');
            tierBody.className = 'px-2 py-1 space-y-1';

            if (!tier.unlocks.length) {
                const empty = documentRef.createElement('div');
                empty.className = 'px-1.5 py-1 text-[10px] leading-4 text-gray-400';
                empty.innerText = tier.emptyStateText || 'No unlocks are tracked in this band yet.';
                tierBody.appendChild(empty);
                tierWrap.appendChild(tierBody);
                timelineEl.appendChild(tierWrap);
                continue;
            }

            for (let j = 0; j < tier.unlocks.length; j++) {
                const unlock = tier.unlocks[j];
                const isSelected = activeUnlockKey === unlock.key;

                const unlockBtn = documentRef.createElement('button');
                unlockBtn.type = 'button';
                unlockBtn.className = isSelected
                    ? 'w-full text-left px-1.5 py-1 border border-[#6b5733] bg-[#2b2115] text-[#ffd27d] hover:bg-[#352718] transition-colors'
                    : 'w-full text-left px-1.5 py-1 border border-[#3e3529] text-gray-200 hover:bg-[#241d17] transition-colors';

                const unlockRow = documentRef.createElement('div');
                unlockRow.className = 'flex items-start gap-2';

                const statusIcon = documentRef.createElement('span');
                statusIcon.className = tier.status === 'unlocked'
                    ? 'text-[#9fdc8f] text-[11px] leading-4'
                    : (tier.status === 'current'
                        ? 'text-[#ffcf8b] text-[11px] leading-4'
                        : (tier.status === 'next'
                            ? 'text-[#ffd27d] text-[11px] leading-4'
                            : 'text-gray-500 text-[11px] leading-4'));
                statusIcon.innerText = tier.status === 'unlocked'
                    ? '+'
                    : (tier.status === 'current' ? '>' : (tier.status === 'next' ? '~' : '-'));

                const unlockText = documentRef.createElement('div');
                unlockText.className = 'min-w-0 flex-1';

                const label = documentRef.createElement('div');
                label.innerText = unlock.label;

                const meta = documentRef.createElement('div');
                meta.className = 'text-[10px] uppercase tracking-wide text-[#c8aa6e]';
                meta.innerText = `Lv ${unlock.requiredLevel} / ${getUnlockTypeLabel(unlock, options)}${isSelected ? ' / Hide Details' : ''}`;

                unlockText.appendChild(label);
                unlockText.appendChild(meta);
                unlockRow.appendChild(statusIcon);
                unlockRow.appendChild(unlockText);
                unlockBtn.appendChild(unlockRow);
                unlockBtn.onclick = () => {
                    const nextKey = isSelected ? null : unlock.key;
                    if (typeof options.onSelectUnlock === 'function') options.onSelectUnlock(nextKey);
                };
                tierBody.appendChild(unlockBtn);

                if (isSelected) {
                    const detailsEl = buildSkillPanelUnlockDetailsElement(options.skillName, unlock.requiredLevel, unlock, options);
                    if (detailsEl) tierBody.appendChild(detailsEl);
                }
            }

            tierWrap.appendChild(tierBody);
            timelineEl.appendChild(tierWrap);
        }

        return activeUnlockKey;
    }

    window.SkillPanelRenderRuntime = {
        addSkillPanelDetailSection,
        buildSkillPanelUnlockDetailsElement,
        renderSkillPanelSummary,
        renderSkillPanelTimeline
    };
})();
