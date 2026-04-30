(function () {
    function getDocumentRef(options = {}) {
        return options.documentRef || (typeof document !== 'undefined' ? document : null);
    }

    function getWindowRef(options = {}) {
        return options.windowRef || (typeof window !== 'undefined' ? window : {});
    }

    function hideTooltip(tooltip) {
        if (tooltip && tooltip.classList && typeof tooltip.classList.add === 'function') {
            tooltip.classList.add('hidden');
        }
    }

    function resolveNpcTooltipAction(hitData, options = {}) {
        const baseNpcAction = (hitData.uid && hitData.uid.action)
            ? hitData.uid.action
            : (hitData.name === 'Shopkeeper' ? 'Trade' : 'Talk-to');
        let npcAction = typeof options.resolveNpcPrimaryAction === 'function'
            ? options.resolveNpcPrimaryAction((hitData.uid && typeof hitData.uid === 'object')
                ? hitData.uid
                : { name: hitData.name, action: baseNpcAction })
            : baseNpcAction;
        if (hitData.name === 'Banker' && typeof options.getPreferredMenuAction === 'function') {
            const prefKey = typeof options.getItemMenuPreferenceKey === 'function'
                ? options.getItemMenuPreferenceKey('npc', (hitData.uid && (hitData.uid.spawnId || hitData.uid.merchantId || hitData.uid.name)) || hitData.name)
                : null;
            if (prefKey) npcAction = options.getPreferredMenuAction(prefKey, ['Talk-to', 'Bank']) || npcAction;
        }
        return npcAction;
    }

    function formatHoverTooltipActionText(options = {}) {
        const hitData = options.hitData || null;
        if (!hitData || !hitData.type) return '';

        if (options.selectedCookable && (hitData.type === 'GROUND' || hitData.type === 'FIRE' || options.isAshesGroundItem) && options.fireUnderCursor) {
            const itemName = options.selectedItem && options.selectedItem.name ? options.selectedItem.name : 'item';
            return `<span class="text-gray-300">Use</span> <span class="text-[#ff981f]">${itemName}</span> <span class="text-gray-300">-></span> <span class="text-orange-300">Fire</span>`;
        }
        if (options.isAshesGroundItem && options.fireUnderCursor) {
            return '<span class="text-gray-300">Use</span> <span class="text-orange-300">Fire</span>';
        }

        const skillTooltip = typeof options.getSkillTooltip === 'function'
            ? options.getSkillTooltip(hitData)
            : '';
        if (skillTooltip) return skillTooltip;

        if (hitData.type === 'TREE') {
            if (options.isTreeTile) return '<span class="text-gray-300">Chop down</span> <span class="text-cyan-400">Tree</span>';
            return '';
        }
        if (hitData.type === 'ROCK') return '<span class="text-gray-300">Mine</span> <span class="text-cyan-400">Rock</span>';
        if (hitData.type === 'FIRE') return '<span class="text-gray-300">Use</span> <span class="text-orange-300">Fire</span>';
        if (hitData.type === 'GROUND_ITEM') {
            const displayName = options.groundDisplayName || hitData.name || 'item';
            return `<span class="text-gray-300">Take</span> <span class="text-[#ff981f]">${displayName}</span>`;
        }
        if (hitData.type === 'BANK_BOOTH') return '<span class="text-gray-300">Bank</span> <span class="text-cyan-400">Bank Booth</span>';
        if (hitData.type === 'SHOP_COUNTER') return '<span class="text-gray-300">Examine</span> <span class="text-cyan-400">Shop Counter</span>';
        if (hitData.type === 'WATER') return '<span class="text-gray-300">Fish</span> <span class="text-cyan-400">Water</span>';
        if (hitData.type === 'DOOR') {
            const action = hitData.doorObj && hitData.doorObj.isOpen ? 'Close' : 'Open';
            return `<span class="text-gray-300">${action}</span> <span class="text-cyan-400">Door</span>`;
        }
        if (hitData.type === 'ENEMY') {
            const enemyName = typeof options.formatEnemyTooltipDisplayName === 'function'
                ? options.formatEnemyTooltipDisplayName(hitData)
                : (hitData.name || 'Enemy');
            return `<span class="text-gray-300">Attack</span> <span class="text-[#ffff00]">${enemyName}</span>`;
        }
        if (hitData.type === 'STAIRS_UP') return '<span class="text-gray-300">Climb-up</span> <span class="text-cyan-400">Stairs</span>';
        if (hitData.type === 'STAIRS_DOWN') return '<span class="text-gray-300">Climb-down</span> <span class="text-cyan-400">Stairs</span>';
        if (hitData.type === 'NPC') {
            const npcAction = resolveNpcTooltipAction(hitData, options);
            const npcName = hitData.name || 'NPC';
            if (npcAction === 'Trade') return `<span class="text-gray-300">Trade</span> <span class="text-yellow-400">${npcName}</span>`;
            if (npcAction === 'Bank') return `<span class="text-gray-300">Bank</span> <span class="text-yellow-400">${npcName}</span>`;
            if (npcAction === 'Travel') return `<span class="text-gray-300">Travel</span> <span class="text-yellow-400">${npcName}</span>`;
            return `<span class="text-gray-300">Talk-to</span> <span class="text-yellow-400">${npcName}</span>`;
        }
        return '';
    }

    function positionHoverTooltip(tooltip, options = {}) {
        const windowRef = getWindowRef(options);
        const currentMouseX = Number.isFinite(options.currentMouseX) ? options.currentMouseX : 0;
        const currentMouseY = Number.isFinite(options.currentMouseY) ? options.currentMouseY : 0;
        let x = currentMouseX + 14;
        let y = currentMouseY + 14;
        const w = tooltip.offsetWidth || 0;
        const h = tooltip.offsetHeight || 0;
        const width = Number.isFinite(windowRef.innerWidth) ? windowRef.innerWidth : 0;
        const height = Number.isFinite(windowRef.innerHeight) ? windowRef.innerHeight : 0;

        if (x + w > width - 8) x = currentMouseX - w - 14;
        if (y + h > height - 8) y = currentMouseY - h - 14;
        if (x < 8) x = 8;
        if (y < 8) y = 8;

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.transform = 'none';
    }

    function updateHoverTooltipDisplay(options = {}) {
        const documentRef = getDocumentRef(options);
        if (!documentRef || typeof documentRef.getElementById !== 'function') return '';
        const tooltip = documentRef.getElementById(options.tooltipId || 'hover-tooltip');
        if (!tooltip) return '';

        if (options.shouldHide || !options.hitData || !options.isWithinWalkDistance) {
            hideTooltip(tooltip);
            return '';
        }

        const actionText = formatHoverTooltipActionText(options);
        if (!actionText) {
            hideTooltip(tooltip);
            return '';
        }

        tooltip.innerHTML = actionText;
        if (tooltip.classList && typeof tooltip.classList.remove === 'function') tooltip.classList.remove('hidden');
        positionHoverTooltip(tooltip, options);
        return actionText;
    }

    window.InputHoverTooltipRuntime = {
        formatHoverTooltipActionText,
        positionHoverTooltip,
        updateHoverTooltipDisplay
    };
})();
