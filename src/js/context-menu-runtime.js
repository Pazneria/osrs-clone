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

    function getItemMenuPreferenceKey(scope, itemId) {
        return `${scope || 'inventory'}:${itemId || ''}`;
    }

    function getPreferredMenuAction(prefKey, actions, preferences = {}) {
        if (!Array.isArray(actions) || actions.length === 0) return null;
        const preferred = (prefKey && preferences && typeof preferences[prefKey] === 'string')
            ? preferences[prefKey]
            : null;
        return (preferred && actions.includes(preferred)) ? preferred : actions[0];
    }

    function setPreferredMenuAction(prefKey, actionName, preferences = {}) {
        if (!prefKey || !actionName || !preferences) return preferences;
        preferences[prefKey] = actionName;
        return preferences;
    }

    function clearSwapLeftClickControl(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return;

        const trigger = documentRef.getElementById('context-swap-left-click-trigger');
        if (trigger && trigger.parentNode && typeof trigger.parentNode.removeChild === 'function') {
            trigger.parentNode.removeChild(trigger);
        }

        const submenu = documentRef.getElementById('context-swap-left-click-submenu');
        if (submenu && submenu.parentNode && typeof submenu.parentNode.removeChild === 'function') {
            submenu.parentNode.removeChild(submenu);
        }
    }

    function appendSwapLeftClickControl(options = {}) {
        const prefKey = options.prefKey || '';
        const actions = Array.isArray(options.actions) ? options.actions : [];
        if (!prefKey || actions.length === 0) return null;

        const documentRef = getDocumentRef(options);
        const windowRef = getWindowRef(options);
        const contextMenuEl = getContextMenuEl(options);
        if (!documentRef || !contextMenuEl || typeof documentRef.createElement !== 'function') return null;

        clearSwapLeftClickControl(options);

        const cancelRow = typeof contextMenuEl.querySelector === 'function'
            ? contextMenuEl.querySelector('.context-cancel')
            : null;
        if (!cancelRow || typeof cancelRow.insertAdjacentElement !== 'function') return null;

        const trigger = documentRef.createElement('div');
        trigger.id = 'context-swap-left-click-trigger';
        trigger.className = 'context-swap-trigger';
        trigger.innerHTML = `<span>Swap left click</span><span class="context-swap-caret">&#9654;</span>`;
        cancelRow.insertAdjacentElement('afterend', trigger);

        const submenu = documentRef.createElement('div');
        submenu.id = 'context-swap-left-click-submenu';
        submenu.className = 'context-submenu hidden';

        const selectedAction = options.currentLabel
            || (typeof options.getPreferredMenuAction === 'function'
                ? options.getPreferredMenuAction(prefKey, actions)
                : getPreferredMenuAction(prefKey, actions, options.preferences || {}));

        actions.forEach((actionName) => {
            const option = documentRef.createElement('div');
            option.className = 'context-option';
            option.textContent = actionName;
            if (option.classList && actionName === selectedAction) option.classList.add('context-option-selected');
            option.onclick = (event) => {
                if (event && typeof event.preventDefault === 'function') event.preventDefault();
                if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
                if (typeof options.setPreferredMenuAction === 'function') {
                    options.setPreferredMenuAction(prefKey, actionName);
                } else {
                    setPreferredMenuAction(prefKey, actionName, options.preferences || {});
                }
                if (typeof options.onSelect === 'function') options.onSelect(actionName);
                if (typeof options.closeContextMenu === 'function') options.closeContextMenu();
                else closeContextMenu(options);
            };
            submenu.appendChild(option);
        });

        if (documentRef.body && typeof documentRef.body.appendChild === 'function') {
            documentRef.body.appendChild(submenu);
        }

        const positionSubmenu = () => {
            if (submenu.classList && typeof submenu.classList.remove === 'function') submenu.classList.remove('hidden');
            submenu.style.left = '0px';
            submenu.style.top = '0px';
            const triggerRect = typeof trigger.getBoundingClientRect === 'function'
                ? trigger.getBoundingClientRect()
                : { left: 0, right: 0, top: 0 };
            const menuW = submenu.offsetWidth || 160;
            const menuH = submenu.offsetHeight || 120;
            const pad = 8;
            const viewportWidth = Number.isFinite(windowRef.innerWidth) ? windowRef.innerWidth : 0;
            const viewportHeight = Number.isFinite(windowRef.innerHeight) ? windowRef.innerHeight : 0;
            let x = triggerRect.right;
            if (x + menuW > viewportWidth - pad) x = triggerRect.left - menuW;
            let y = triggerRect.top;
            if (y + menuH > viewportHeight - pad) y = viewportHeight - menuH - pad;
            if (y < pad) y = pad;
            submenu.style.left = `${x}px`;
            submenu.style.top = `${y}px`;
        };

        if (typeof trigger.addEventListener === 'function') {
            trigger.addEventListener('mouseenter', positionSubmenu);
            trigger.addEventListener('click', (event) => {
                if (event && typeof event.preventDefault === 'function') event.preventDefault();
                if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
                positionSubmenu();
            });
        }

        if (typeof submenu.addEventListener === 'function') {
            submenu.addEventListener('mouseleave', (event) => {
                const related = event ? event.relatedTarget : null;
                if (related && related.closest && (related.closest('#context-menu') || related.closest('.context-submenu'))) return;
                if (typeof options.closeContextMenu === 'function') options.closeContextMenu();
                else closeContextMenu(options);
            });
        }

        return { trigger, submenu };
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
        appendSwapLeftClickControl,
        bindContextMenuMouseleave,
        clearContextMenuOptions,
        clearSwapLeftClickControl,
        closeContextMenu,
        getItemMenuPreferenceKey,
        getLowestAllowedTop,
        getPreferredMenuAction,
        setPreferredMenuAction,
        showContextMenuAt
    };
})();
