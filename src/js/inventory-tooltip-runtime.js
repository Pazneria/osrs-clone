(function () {
    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getInventoryHoverTooltipEl(options = {}) {
        const documentRef = getDocumentRef(options);
        return documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById(options.tooltipId || 'inventory-hover-tooltip')
            : null;
    }

    function hideInventoryHoverTooltip(options = {}) {
        const tooltip = getInventoryHoverTooltipEl(options);
        if (!tooltip || !tooltip.classList || typeof tooltip.classList.add !== 'function') return;
        tooltip.classList.add('hidden');
    }

    function publishInventoryTooltipHooks(options = {}) {
        const windowRef = getWindowRef(options);
        if (!windowRef) return;
        if (typeof options.hideInventoryHoverTooltip === 'function') {
            windowRef.hideInventoryHoverTooltip = options.hideInventoryHoverTooltip;
        }
    }

    function rectanglesOverlap(x, y, width, height, rect) {
        if (!rect) return false;
        return !(x + width <= rect.left || x >= rect.right || y + height <= rect.top || y >= rect.bottom);
    }

    function positionInventoryHoverTooltip(tooltip, clientX, clientY, options = {}) {
        const windowRef = getWindowRef(options);
        const pad = 8;
        const xOffset = 14;
        const yOffset = 14;
        const w = tooltip.offsetWidth || 140;
        const h = tooltip.offsetHeight || 24;
        const viewportWidth = Number.isFinite(windowRef.innerWidth) ? windowRef.innerWidth : 0;
        const viewportHeight = Number.isFinite(windowRef.innerHeight) ? windowRef.innerHeight : 0;

        let x = clientX + xOffset;
        let y = clientY + yOffset;

        if (x + w > viewportWidth - pad) x = clientX - w - xOffset;
        if (y + h > viewportHeight - pad) y = clientY - h - (yOffset + 2);
        if (x < pad) x = pad;
        if (y < pad) y = pad;

        const avoidRects = typeof options.getAvoidRects === 'function'
            ? options.getAvoidRects()
            : (Array.isArray(options.avoidRects) ? options.avoidRects : []);

        for (let i = 0; i < avoidRects.length; i++) {
            const rect = avoidRects[i];
            if (!rectanglesOverlap(x, y, w, h, rect)) continue;

            const aboveY = rect.top - h - 10;
            if (aboveY >= pad) {
                y = aboveY;
            } else {
                const leftX = rect.left - w - 10;
                const rightX = rect.right + 10;
                if (leftX >= pad) x = leftX;
                else if (rightX + w <= viewportWidth - pad) x = rightX;
                else y = Math.max(pad, rect.bottom + 10);
            }
        }

        if (x + w > viewportWidth - pad) x = viewportWidth - w - pad;
        if (y + h > viewportHeight - pad) y = viewportHeight - h - pad;
        if (x < pad) x = pad;
        if (y < pad) y = pad;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    function showInventoryHoverTooltip(text, clientX, clientY, html = '', options = {}) {
        const tooltip = getInventoryHoverTooltipEl(options);
        const tooltipText = (typeof text === 'string') ? text.trim() : '';
        const tooltipHtml = (typeof html === 'string') ? html.trim() : '';
        if (!tooltip || (!tooltipText && !tooltipHtml)) {
            hideInventoryHoverTooltip(options);
            return;
        }

        if (tooltipHtml) tooltip.innerHTML = tooltipHtml;
        else tooltip.textContent = tooltipText;
        if (tooltip.classList && typeof tooltip.classList.remove === 'function') tooltip.classList.remove('hidden');
        positionInventoryHoverTooltip(tooltip, clientX, clientY, options);
    }

    function escapeTooltipHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatSignedTooltipStat(value) {
        const numericValue = Number.isFinite(value) ? Math.floor(value) : 0;
        return `${numericValue >= 0 ? '+' : ''}${numericValue}`;
    }

    function buildItemTooltipSections(item, options = {}) {
        if (!item || typeof item !== 'object') return null;

        const detailLines = [];
        const bonusLines = [];
        const requirementLines = [];

        const actionText = typeof options.actionText === 'string' ? options.actionText.trim() : '';
        if (actionText) detailLines.push(actionText);

        const amount = Number.isFinite(options.amount) ? Math.max(0, Math.floor(options.amount)) : 0;
        if (amount > 1) detailLines.push(`Amount: ${amount.toLocaleString()}`);

        const priceText = typeof options.priceText === 'string' ? options.priceText.trim() : '';
        if (priceText) detailLines.push(priceText);
        else if (Number.isFinite(item.value) && item.value > 0) detailLines.push(`Value: ${Math.floor(item.value).toLocaleString()} coins`);

        if (Number.isFinite(item.healAmount) && item.healAmount > 0) {
            detailLines.push(`Heals: +${Math.floor(item.healAmount)} HP`);
        }

        const attackProfile = item.combat && item.combat.attackProfile ? item.combat.attackProfile : null;
        if (attackProfile && Number.isFinite(attackProfile.tickCycle)) {
            const tickCycle = Math.max(1, Math.floor(attackProfile.tickCycle));
            detailLines.push(`Speed: ${tickCycle} tick${tickCycle === 1 ? '' : 's'}`);
        }

        const stats = item.stats && typeof item.stats === 'object' ? item.stats : null;
        if (stats) {
            if (Number.isFinite(stats.atk) && Math.floor(stats.atk) !== 0) {
                bonusLines.push({ label: 'Attack bonus', value: formatSignedTooltipStat(stats.atk) });
            }
            if (Number.isFinite(stats.def) && Math.floor(stats.def) !== 0) {
                bonusLines.push({ label: 'Defense bonus', value: formatSignedTooltipStat(stats.def) });
            }
            if (Number.isFinite(stats.str) && Math.floor(stats.str) !== 0) {
                bonusLines.push({ label: 'Strength bonus', value: formatSignedTooltipStat(stats.str) });
            }
        }

        const requiredAttackLevel = Number.isFinite(item.requiredAttackLevel)
            ? Math.max(1, Math.floor(item.requiredAttackLevel))
            : 0;
        if (requiredAttackLevel > 1) {
            requirementLines.push({ label: 'Attack req.', value: String(requiredAttackLevel) });
        }
        const requiredFishingLevel = Number.isFinite(item.requiredFishingLevel)
            ? Math.max(1, Math.floor(item.requiredFishingLevel))
            : 0;
        if (requiredFishingLevel > 0) {
            requirementLines.push({ label: 'Fishing req.', value: String(requiredFishingLevel) });
        }
        const requiredDefenseLevel = Number.isFinite(item.requiredDefenseLevel)
            ? Math.max(1, Math.floor(item.requiredDefenseLevel))
            : 0;
        if (requiredDefenseLevel > 0) {
            requirementLines.push({ label: 'Defense req.', value: String(requiredDefenseLevel) });
        }

        return {
            name: typeof item.name === 'string' ? item.name : 'Item',
            detailLines,
            bonusLines,
            requirementLines
        };
    }

    function buildItemTooltipText(item, options = {}) {
        const sections = buildItemTooltipSections(item, options);
        if (!sections) return '';

        const lines = [sections.name];
        sections.detailLines.forEach((line) => lines.push(line));
        sections.bonusLines.forEach((line) => lines.push(`${line.label}: ${line.value}`));
        sections.requirementLines.forEach((line) => lines.push(`${line.label}: ${line.value}`));
        return lines.join('\n');
    }

    function buildItemTooltipHtml(item, options = {}) {
        const sections = buildItemTooltipSections(item, options);
        if (!sections) return '';

        const detailHtml = sections.detailLines
            .map((line) => `<div class="text-gray-300">${escapeTooltipHtml(line)}</div>`)
            .join('');
        const bonusHtml = sections.bonusLines.length > 0
            ? `<div class="mt-2 border-t border-[#3a444c] pt-1.5">
                    <div class="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#c8aa6e]">Bonuses</div>
                    ${sections.bonusLines.map((line) => `<div class="flex items-center justify-between gap-3"><span class="text-gray-300">${escapeTooltipHtml(line.label)}</span><span class="text-white">${escapeTooltipHtml(line.value)}</span></div>`).join('')}
               </div>`
            : '';
        const requirementHtml = sections.requirementLines.length > 0
            ? `<div class="mt-2 border-t border-[#3a444c] pt-1.5">
                    <div class="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#c8aa6e]">Requirements</div>
                    ${sections.requirementLines.map((line) => `<div class="flex items-center justify-between gap-3"><span class="text-gray-300">${escapeTooltipHtml(line.label)}</span><span class="text-white">${escapeTooltipHtml(line.value)}</span></div>`).join('')}
               </div>`
            : '';

        return `<div class="min-w-[180px]">
            <div class="text-[#ffcf8b] text-[11px] font-bold leading-4">${escapeTooltipHtml(sections.name)}</div>
            <div class="mt-1 text-[10px] leading-4 font-normal tracking-normal space-y-0.5">
                ${detailHtml}
            </div>
            ${bonusHtml}
            ${requirementHtml}
        </div>`;
    }

    function bindInventorySlotTooltip(options = {}) {
        const slot = options.slot || null;
        if (!slot) return;
        const tooltipText = (typeof options.text === 'string') ? options.text.trim() : '';
        const tooltipHtml = (typeof options.html === 'string') ? options.html.trim() : '';
        slot.title = '';
        slot.onmouseenter = null;
        slot.onmousemove = null;
        slot.onmouseleave = null;
        if (!tooltipText && !tooltipHtml) {
            if (typeof slot.removeAttribute === 'function') slot.removeAttribute('aria-label');
            return;
        }
        if (typeof slot.setAttribute === 'function') slot.setAttribute('aria-label', tooltipText);
        slot.onmouseenter = (event) => showInventoryHoverTooltip(tooltipText, event.clientX, event.clientY, tooltipHtml, options);
        slot.onmousemove = (event) => showInventoryHoverTooltip(tooltipText, event.clientX, event.clientY, tooltipHtml, options);
        slot.onmouseleave = () => hideInventoryHoverTooltip(options);
    }

    window.InventoryTooltipRuntime = {
        bindInventorySlotTooltip,
        buildItemTooltipHtml,
        buildItemTooltipSections,
        buildItemTooltipText,
        escapeTooltipHtml,
        formatSignedTooltipStat,
        hideInventoryHoverTooltip,
        positionInventoryHoverTooltip,
        publishInventoryTooltipHooks,
        rectanglesOverlap,
        showInventoryHoverTooltip
    };
})();
