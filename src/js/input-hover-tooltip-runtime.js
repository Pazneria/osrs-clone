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

    function resolveTooltipTargetTile(context = {}, hitData) {
        if (!hitData || !Number.isInteger(hitData.gridX) || !Number.isInteger(hitData.gridY)) return null;
        if (hitData.type === 'WATER' && typeof context.findNearestFishableWaterEdgeTile === 'function') {
            const edge = context.findNearestFishableWaterEdgeTile(hitData.gridX, hitData.gridY);
            return edge || { x: hitData.gridX, y: hitData.gridY };
        }
        return { x: hitData.gridX, y: hitData.gridY };
    }

    function isHitWithinTooltipWalkDistance(context = {}, hitData) {
        const target = resolveTooltipTargetTile(context, hitData);
        if (!target) return true;
        const playerState = context.playerState || {};
        const maxDistance = Number.isFinite(context.maxTooltipWalkDistanceTiles)
            ? context.maxTooltipWalkDistanceTiles
            : 90;
        const dx = Math.abs(target.x - playerState.x);
        const dy = Math.abs(target.y - playerState.y);
        return Math.max(dx, dy) <= maxDistance;
    }

    function isFireUnderCursor(context = {}, hitData) {
        const playerState = context.playerState || {};
        if (!hitData || !Array.isArray(context.activeFires)) return false;
        return context.activeFires.some((fire) => {
            if (!fire || fire.z !== playerState.z) return false;
            if (Number.isInteger(hitData.gridX) && Number.isInteger(hitData.gridY) && fire.x === hitData.gridX && fire.y === hitData.gridY) return true;
            if (!hitData.point) return false;
            return Math.hypot((fire.x + 0.5) - hitData.point.x, (fire.y + 0.5) - hitData.point.z) <= 1.9;
        });
    }

    function isAshesGroundItem(hitData) {
        return !!(hitData && hitData.type === 'GROUND_ITEM' && /^Ashes(?:\s|\(|$)/i.test(hitData.name || ''));
    }

    function isTreeTile(context = {}, hitData) {
        const playerState = context.playerState || {};
        const logicalMap = context.logicalMap || [];
        const tileIds = context.tileIds || {};
        return !!(hitData
            && hitData.type === 'TREE'
            && logicalMap[playerState.z]
            && logicalMap[playerState.z][hitData.gridY]
            && logicalMap[playerState.z][hitData.gridY][hitData.gridX] === tileIds.TREE);
    }

    function getGroundTileStackCount(context = {}, gridX, gridY, z = null) {
        const playerState = context.playerState || {};
        const resolvedZ = Number.isInteger(z) ? z : playerState.z;
        if (!Array.isArray(context.groundItems) || !Number.isInteger(gridX) || !Number.isInteger(gridY)) return 1;
        let count = 0;
        for (let i = 0; i < context.groundItems.length; i++) {
            const entry = context.groundItems[i];
            if (!entry) continue;
            if (entry.x === gridX && entry.y === gridY && entry.z === resolvedZ) count++;
        }
        return Math.max(1, count);
    }

    function formatGroundItemDisplayName(context = {}, hitData) {
        const baseName = (hitData && typeof hitData.name === 'string' && hitData.name.trim())
            ? hitData.name
            : 'item';
        if (!hitData || hitData.type !== 'GROUND_ITEM') return baseName;
        const tileStackCount = getGroundTileStackCount(context, hitData.gridX, hitData.gridY);
        return tileStackCount > 1 ? `${baseName} (${tileStackCount})` : baseName;
    }

    function getEnemyCombatLevel(hitData) {
        return hitData && Number.isFinite(hitData.combatLevel)
            ? Math.max(1, Math.floor(hitData.combatLevel))
            : null;
    }

    function formatEnemyTooltipDisplayName(hitData) {
        const baseName = (hitData && typeof hitData.name === 'string' && hitData.name.trim())
            ? hitData.name.trim()
            : 'Enemy';
        const combatLevel = getEnemyCombatLevel(hitData);
        if (combatLevel === null) return baseName;
        return `${baseName} (Level ${combatLevel})`;
    }

    function buildHoverTooltipDisplayOptions(context = {}, options = {}) {
        const hitData = options.hitData || null;
        const selectedSlot = hitData && typeof context.getSelectedUseItem === 'function'
            ? context.getSelectedUseItem()
            : null;
        const selectedItem = selectedSlot && selectedSlot.itemData ? selectedSlot.itemData : null;
        const selectedCookable = !!(selectedItem && selectedItem.cookResultId && selectedItem.burnResultId);
        return {
            documentRef: context.documentRef,
            windowRef: context.windowRef,
            tooltipId: options.tooltipId || 'hover-tooltip',
            shouldHide: !!options.shouldHide,
            hitData,
            isWithinWalkDistance: hitData ? isHitWithinTooltipWalkDistance(context, hitData) : false,
            currentMouseX: options.currentMouseX,
            currentMouseY: options.currentMouseY,
            selectedItem,
            selectedCookable,
            fireUnderCursor: isFireUnderCursor(context, hitData),
            isAshesGroundItem: isAshesGroundItem(hitData),
            groundDisplayName: hitData && hitData.type === 'GROUND_ITEM'
                ? formatGroundItemDisplayName(context, hitData)
                : (hitData && hitData.name) || '',
            isTreeTile: isTreeTile(context, hitData),
            getSkillTooltip: context.getSkillTooltip,
            formatEnemyTooltipDisplayName,
            resolveNpcPrimaryAction: context.resolveNpcPrimaryAction,
            getItemMenuPreferenceKey: context.getItemMenuPreferenceKey,
            getPreferredMenuAction: context.getPreferredMenuAction
        };
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
        if (hitData.type === 'DECOR_PROP') {
            const propName = hitData.name || (hitData.uid && hitData.uid.label) || 'Object';
            return `<span class="text-gray-300">Search</span> <span class="text-cyan-400">${propName}</span>`;
        }
        if (hitData.type === 'WATER') return '<span class="text-gray-300">Fish</span> <span class="text-cyan-400">Water</span>';
        if (hitData.type === 'DOOR') {
            const action = hitData.doorObj && hitData.doorObj.isOpen ? 'Close' : 'Open';
            const label = hitData.doorObj && hitData.doorObj.isWoodenGate ? 'Gate' : 'Door';
            return `<span class="text-gray-300">${action}</span> <span class="text-cyan-400">${label}</span>`;
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
        resolveTooltipTargetTile,
        isHitWithinTooltipWalkDistance,
        isFireUnderCursor,
        isAshesGroundItem,
        isTreeTile,
        getGroundTileStackCount,
        formatGroundItemDisplayName,
        getEnemyCombatLevel,
        formatEnemyTooltipDisplayName,
        buildHoverTooltipDisplayOptions,
        formatHoverTooltipActionText,
        positionHoverTooltip,
        updateHoverTooltipDisplay
    };
})();
