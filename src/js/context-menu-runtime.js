(function () {
    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function getContextMenuEl(options = {}) {
        if (options.contextMenuEl) return options.contextMenuEl;
        const documentRef = getDocumentRef(options);
        return documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById(options.contextMenuId || 'context-menu')
            : null;
    }

    function getOptionsListEl(options = {}) {
        if (options.optionsListEl) return options.optionsListEl;
        const documentRef = getDocumentRef(options);
        return documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById(options.optionsListId || 'context-options-list')
            : null;
    }

    function clearContextMenuOptions(options = {}) {
        const optionsListEl = getOptionsListEl(options);
        if (optionsListEl) optionsListEl.innerHTML = '';
    }

    function getLowestAllowedTop(menuHeight, pad, options = {}) {
        const documentRef = getDocumentRef(options);
        const windowRef = getWindowRef(options);
        const fallbackHeight = Number.isFinite(windowRef.innerHeight) ? windowRef.innerHeight : 0;
        if (!documentRef || typeof documentRef.querySelectorAll !== 'function') {
            return fallbackHeight - menuHeight - pad;
        }

        const invSlots = Array.from(documentRef.querySelectorAll('#view-inv .inventory-slot'));
        let lowestMidY = null;
        for (let i = 0; i < invSlots.length; i++) {
            const slot = invSlots[i];
            const rect = slot && typeof slot.getBoundingClientRect === 'function'
                ? slot.getBoundingClientRect()
                : null;
            if (!rect || rect.width <= 0 || rect.height <= 0) continue;
            const midY = rect.top + (rect.height * 0.5);
            if (lowestMidY === null || midY > lowestMidY) lowestMidY = midY;
        }
        if (lowestMidY === null) return fallbackHeight - menuHeight - pad;
        return Math.max(pad, Math.floor(lowestMidY - menuHeight));
    }

    function showContextMenuAt(clientX, clientY, options = {}) {
        const contextMenuEl = getContextMenuEl(options);
        if (!contextMenuEl) return;
        const windowRef = getWindowRef(options);

        contextMenuEl.classList.remove('hidden');
        contextMenuEl.style.left = '0px';
        contextMenuEl.style.top = '0px';

        const menuW = contextMenuEl.offsetWidth || 160;
        const menuH = contextMenuEl.offsetHeight || 120;
        const pad = 8;
        const viewportWidth = Number.isFinite(windowRef.innerWidth) ? windowRef.innerWidth : 0;
        const viewportHeight = Number.isFinite(windowRef.innerHeight) ? windowRef.innerHeight : 0;

        let x = clientX;
        let y = clientY;
        if (x + menuW > viewportWidth - pad) x = viewportWidth - menuW - pad;
        if (y + menuH > viewportHeight - pad) y = viewportHeight - menuH - pad;
        y = Math.min(y, getLowestAllowedTop(menuH, pad, options));
        if (x < pad) x = pad;
        if (y < pad) y = pad;

        contextMenuEl.style.left = x + 'px';
        contextMenuEl.style.top = y + 'px';
    }

    function addContextMenuOption(text, callback, options = {}) {
        const documentRef = getDocumentRef(options);
        const optionsListEl = getOptionsListEl(options);
        if (!documentRef || !optionsListEl || typeof documentRef.createElement !== 'function') return null;

        const div = documentRef.createElement('div');
        div.className = 'context-option text-yellow-500';
        const safeText = typeof text === 'string' ? text : '';
        const splitIndex = safeText.indexOf(' ');
        if (splitIndex > -1 && safeText.indexOf('<span') === -1) {
            const action = safeText.substring(0, splitIndex);
            const target = safeText.substring(splitIndex);
            div.innerHTML = `<span class="text-white">${action}</span>${target}`;
        } else {
            div.innerHTML = safeText;
        }
        div.onclick = (event) => {
            if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
            if (typeof callback === 'function') callback();
            closeContextMenu(options);
        };
        optionsListEl.appendChild(div);
        return div;
    }

    function closeContextMenu(options = {}) {
        const contextMenuEl = getContextMenuEl(options);
        if (contextMenuEl && contextMenuEl.classList && typeof contextMenuEl.classList.add === 'function') {
            contextMenuEl.classList.add('hidden');
        }
        if (typeof options.clearItemSwapLeftClickUI === 'function') options.clearItemSwapLeftClickUI();
        if (typeof options.hideInventoryHoverTooltip === 'function') options.hideInventoryHoverTooltip();
    }

    function bindContextMenuMouseleave(options = {}) {
        const contextMenuEl = getContextMenuEl(options);
        if (!contextMenuEl || typeof contextMenuEl.addEventListener !== 'function') return;
        contextMenuEl.addEventListener('mouseleave', (event) => {
            const related = event ? event.relatedTarget : null;
            if (related && related.closest && related.closest('.context-submenu')) return;
            closeContextMenu(options);
        });
    }

    window.ContextMenuRuntime = {
        addContextMenuOption,
        bindContextMenuMouseleave,
        clearContextMenuOptions,
        closeContextMenu,
        getLowestAllowedTop,
        showContextMenuAt
    };
})();
