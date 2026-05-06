(function () {
    function getWindowRef(context) {
        return context && context.windowRef ? context.windowRef : window;
    }

    function normalizeContextMenuOptions(context = {}, options) {
        const inputControllerRuntime = context.inputControllerRuntime || getWindowRef(context).InputControllerRuntime || null;
        if (inputControllerRuntime && typeof inputControllerRuntime.normalizeContextMenuOptions === 'function') {
            return inputControllerRuntime.normalizeContextMenuOptions(options);
        }
        if (!Array.isArray(options) || options.length === 0) return [];
        const normalized = [];
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (!option || typeof option.text !== 'string' || typeof option.onSelect !== 'function') continue;
            normalized.push(option);
        }
        return normalized;
    }

    function resolveSkillContextMenuOptions(context = {}, hitData) {
        const skillRuntime = context.skillRuntime || getWindowRef(context).SkillRuntime || null;
        if (!skillRuntime || typeof skillRuntime.getSkillContextMenuOptions !== 'function') return [];
        return normalizeContextMenuOptions(context, skillRuntime.getSkillContextMenuOptions(hitData));
    }

    function tryUseSelectedInventoryItemOnTarget(context = {}, hitData, selectedItem, selectedUseInvIndex) {
        if (!hitData || !selectedItem || !Number.isInteger(selectedUseInvIndex)) return false;

        const skillRuntime = context.skillRuntime || getWindowRef(context).SkillRuntime || null;
        let used = false;
        if (skillRuntime && typeof skillRuntime.tryUseItemOnTarget === 'function') {
            used = skillRuntime.tryUseItemOnTarget({
                hitData,
                sourceInvIndex: selectedUseInvIndex,
                sourceItemId: selectedItem.id
            });
        }
        if (!used && typeof context.tryUseItemOnWorld === 'function') {
            used = context.tryUseItemOnWorld(selectedUseInvIndex, hitData);
        }
        return !!used;
    }

    function emitExamineFallback(context = {}, text) {
        const line = String(text || 'Nothing unusual.').trim() || 'Nothing unusual.';
        if (typeof context.addChatMessage === 'function') {
            context.addChatMessage(line, 'game');
            return;
        }
        console.log(`EXAMINING: ${line}`);
    }

    function getGroundItemByUid(context = {}, uid) {
        const groundItems = context.groundItems;
        if (!Array.isArray(groundItems)) return null;
        return groundItems.find((entry) => entry && entry.uid === uid) || null;
    }

    function getGroundTileStackCount(context = {}, gridX, gridY, z = null) {
        const groundItems = context.groundItems;
        const playerState = context.playerState || {};
        const resolvedZ = Number.isInteger(z) ? z : playerState.z;
        if (!Array.isArray(groundItems) || !Number.isInteger(gridX) || !Number.isInteger(gridY)) return 1;
        let count = 0;
        for (let i = 0; i < groundItems.length; i++) {
            const entry = groundItems[i];
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

    function formatEnemyDisplayName(hitData) {
        const baseName = (hitData && typeof hitData.name === 'string' && hitData.name.trim())
            ? hitData.name.trim()
            : 'Enemy';
        const combatLevel = getEnemyCombatLevel(hitData);
        if (combatLevel === null) return baseName;
        return `Lv ${combatLevel} ${baseName}`;
    }

    function getTileIdAtHit(context = {}, hitData) {
        const playerState = context.playerState || {};
        const logicalMap = context.logicalMap || [];
        if (!hitData || !logicalMap[playerState.z] || !logicalMap[playerState.z][hitData.gridY]) return null;
        return logicalMap[playerState.z][hitData.gridY][hitData.gridX];
    }

    function resolveTargetInteractionOptions(context = {}, hitData, selectedSlot, selectedItem, selectedCookable, selectedUseInvIndex) {
        const windowRef = getWindowRef(context);
        const registry = context.targetInteractionRegistry || windowRef.TargetInteractionRegistry || null;
        if (!registry || typeof registry.resolveOptions !== 'function') return [];

        const resolved = registry.resolveOptions(hitData, {
            selectedSlot,
            selectedItem,
            selectedCookable,
            selectedUseInvIndex,
            clearSelectedUse: context.clearSelectedUse,
            spawnActionMarker: () => {
                if (hitData && hitData.point && typeof context.spawnClickMarker === 'function') {
                    context.spawnClickMarker(hitData.point, true);
                }
            },
            tryUseSelectedItemOnHit: () => tryUseSelectedInventoryItemOnTarget(context, hitData, selectedItem, selectedUseInvIndex),
            queueInteract: (targetType, targetData = null) => {
                if (typeof context.queueAction === 'function') {
                    context.queueAction('INTERACT', hitData.gridX, hitData.gridY, targetType, targetData);
                }
                if (hitData.point && typeof context.spawnClickMarker === 'function') {
                    context.spawnClickMarker(hitData.point, true);
                }
            },
            examineTarget: (targetType, fallbackText, options = {}) => {
                if (windowRef.ExamineCatalog && typeof windowRef.ExamineCatalog.examineTarget === 'function') {
                    windowRef.ExamineCatalog.examineTarget(targetType, options, context.addChatMessage);
                    return;
                }
                emitExamineFallback(context, fallbackText);
            },
            examineNpc: (npcName, fallbackText) => {
                if (windowRef.ExamineCatalog && typeof windowRef.ExamineCatalog.examineNpc === 'function') {
                    windowRef.ExamineCatalog.examineNpc(npcName, context.addChatMessage);
                    return;
                }
                emitExamineFallback(context, fallbackText);
            },
            examineItem: (itemId, itemName, fallbackText) => {
                if (windowRef.ExamineCatalog && typeof windowRef.ExamineCatalog.examineItem === 'function') {
                    windowRef.ExamineCatalog.examineItem(itemId, itemName, context.addChatMessage);
                    return;
                }
                emitExamineFallback(context, fallbackText);
            },
            formatGroundItemDisplayName: (hit) => formatGroundItemDisplayName(context, hit),
            formatEnemyDisplayName: (enemyHitData = hitData) => (
                typeof context.formatEnemyDisplayName === 'function'
                    ? context.formatEnemyDisplayName(enemyHitData)
                    : formatEnemyDisplayName(enemyHitData)
            ),
            combatLevel: getEnemyCombatLevel(hitData),
            getGroundItemByUid: (uid) => getGroundItemByUid(context, uid),
            getTileIdAtHit: () => getTileIdAtHit(context, hitData),
            tileIds: context.tileIds || {}
        });

        return normalizeContextMenuOptions(context, resolved);
    }

    function resolveNpcPrimaryAction(context = {}, targetData) {
        const questRuntime = getWindowRef(context).QuestRuntime || null;
        if (questRuntime && typeof questRuntime.resolveNpcPrimaryAction === 'function') {
            return questRuntime.resolveNpcPrimaryAction(targetData);
        }
        return targetData ? targetData.action : null;
    }

    function applyPreferredBankerAction(context = {}, targetData) {
        const windowRef = getWindowRef(context);
        if (!targetData || targetData.name !== 'Banker' || !windowRef.getItemMenuPreferenceKey || !windowRef.getPreferredMenuAction) {
            return targetData;
        }
        const prefKey = windowRef.getItemMenuPreferenceKey('npc', targetData.spawnId || targetData.merchantId || targetData.name);
        targetData.action = windowRef.getPreferredMenuAction(prefKey, ['Talk-to', 'Bank']) || targetData.action;
        return targetData;
    }

    function buildInteractionTargetData(context = {}, hitData) {
        if (!hitData) return null;
        let targetData = hitData.uid;
        if (hitData.type === 'DOOR' || hitData.type === 'GATE') {
            targetData = hitData.doorObj;
        } else if (hitData.type === 'DECOR_PROP') {
            const uid = hitData.uid && typeof hitData.uid === 'object' ? hitData.uid : {};
            targetData = {
                propId: uid.propId || '',
                kind: uid.kind || 'decor',
                label: uid.label || hitData.name || 'Object'
            };
        } else if (hitData.type === 'ENEMY') {
            targetData = {
                enemyId: String(hitData.uid || '').trim(),
                enemyX: Number.isInteger(hitData.gridX) ? hitData.gridX : null,
                enemyY: Number.isInteger(hitData.gridY) ? hitData.gridY : null,
                name: hitData.name || 'Enemy'
            };
        } else if (hitData.type === 'NPC') {
            if (hitData.uid && typeof hitData.uid === 'object') targetData = Object.assign({}, hitData.uid);
            else if (hitData.name === 'Shopkeeper') targetData = { name: hitData.name, action: 'Trade', merchantId: 'general_store' };
            else targetData = { name: hitData.name, action: 'Talk-to' };
            targetData.action = resolveNpcPrimaryAction(context, targetData) || targetData.action;
            applyPreferredBankerAction(context, targetData);
        }
        return targetData;
    }

    function debugSelectedUseClick(context = {}, hitData, selectedItemId, phase, used = false) {
        const windowRef = getWindowRef(context);
        if (!windowRef.DEBUG_COOKING_USE || typeof context.addChatMessage !== 'function') return;
        if (phase === 'start') {
            const playerState = context.playerState || {};
            context.addChatMessage(
                `[cook-debug] use-click item=${selectedItemId || 'none'} target=${hitData.type} @ (${hitData.gridX},${hitData.gridY},${playerState.z})`,
                'info'
            );
            return;
        }
        context.addChatMessage(`[cook-debug] use-click result handled=${used ? 'yes' : 'no'}`, 'info');
    }

    function handleSelectedUseInteraction(context = {}, hitData, selectedItem, selectedUseInvIndex) {
        const selectedItemId = selectedItem && selectedItem.id ? selectedItem.id : null;
        debugSelectedUseClick(context, hitData, selectedItemId, 'start');
        const used = tryUseSelectedInventoryItemOnTarget(
            context,
            hitData,
            selectedItem || (selectedItemId ? { id: selectedItemId } : null),
            selectedUseInvIndex
        );
        debugSelectedUseClick(context, hitData, selectedItemId, 'result', used);
        if (used && hitData.point && typeof context.spawnClickMarker === 'function') {
            context.spawnClickMarker(hitData.point, true);
        }
        if (typeof context.clearSelectedUse === 'function') context.clearSelectedUse();
        return { handled: true, used };
    }

    function handlePrimaryInteractionHit(context = {}, hitData, options = {}) {
        if (!hitData) return { handled: false };

        if (options.selectedItem || Number.isInteger(options.selectedUseInvIndex)) {
            return handleSelectedUseInteraction(context, hitData, options.selectedItem, options.selectedUseInvIndex);
        }

        if (hitData.type === 'WATER') {
            if (typeof context.queueAction === 'function') {
                context.queueAction('INTERACT', hitData.gridX, hitData.gridY, 'WATER');
            }
            if (typeof context.spawnClickMarker === 'function') context.spawnClickMarker(hitData.point, true);
            return { handled: true, action: 'INTERACT', targetType: 'WATER' };
        }
        if (hitData.type === 'GROUND' || hitData.type === 'WALL' || hitData.type === 'TOWER' || hitData.type === 'FIRE') {
            const walkObj = hitData.pierStepDescend ? 'PIER_STEP_DESCEND' : null;
            if (typeof context.queueAction === 'function') {
                context.queueAction('WALK', hitData.gridX, hitData.gridY, walkObj);
            }
            if (typeof context.spawnClickMarker === 'function') context.spawnClickMarker(hitData.point, false);
            return { handled: true, action: 'WALK', targetType: walkObj };
        }

        const targetData = buildInteractionTargetData(context, hitData);
        const interactionType = hitData.type === 'GATE' ? 'DOOR' : hitData.type;
        if (typeof context.queueAction === 'function') {
            context.queueAction('INTERACT', hitData.gridX, hitData.gridY, interactionType, targetData);
        }
        if (typeof context.spawnClickMarker === 'function') context.spawnClickMarker(hitData.point, true);
        return { handled: true, action: 'INTERACT', targetType: interactionType, targetData };
    }

    window.InputTargetInteractionRuntime = {
        normalizeContextMenuOptions,
        resolveSkillContextMenuOptions,
        tryUseSelectedInventoryItemOnTarget,
        emitExamineFallback,
        getGroundItemByUid,
        getGroundTileStackCount,
        formatGroundItemDisplayName,
        getEnemyCombatLevel,
        formatEnemyDisplayName,
        getTileIdAtHit,
        resolveTargetInteractionOptions,
        buildInteractionTargetData,
        handlePrimaryInteractionHit
    };
})();
