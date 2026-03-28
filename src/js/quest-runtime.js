(function () {
    const STATUS_PRIORITY = {
        ready_to_complete: 0,
        active: 1,
        not_started: 2,
        completed: 3
    };

    function getQuestCatalog() {
        return window.QuestCatalog || null;
    }

    function normalizeQuestId(value) {
        const catalog = getQuestCatalog();
        if (catalog && typeof catalog.resolveQuestId === 'function') {
            return catalog.resolveQuestId(value);
        }
        return String(value || '').trim().toLowerCase();
    }

    function getQuestDefinition(questId) {
        const catalog = getQuestCatalog();
        if (!catalog || typeof catalog.getQuestById !== 'function') return null;
        return catalog.getQuestById(questId);
    }

    function findQuestByMerchantId(merchantId) {
        const normalizedMerchantId = String(merchantId || '').trim().toLowerCase();
        if (!normalizedMerchantId) return null;
        const questDefs = listQuestDefinitions();
        for (let i = 0; i < questDefs.length; i++) {
            const questDef = questDefs[i];
            if (!questDef) continue;
            const unlockedMerchantId = String(questDef.unlocksMerchantId || '').trim().toLowerCase();
            if (unlockedMerchantId && unlockedMerchantId === normalizedMerchantId) return questDef;
        }
        return null;
    }

    function findQuestDefinitionsByNpc(npc) {
        const catalog = getQuestCatalog();
        if (!catalog || typeof catalog.findQuestsByNpc !== 'function') return [];
        const questDefs = catalog.findQuestsByNpc(npc);
        return Array.isArray(questDefs) ? questDefs : [];
    }

    function listQuestDefinitions() {
        const catalog = getQuestCatalog();
        if (!catalog || typeof catalog.listQuestDefinitions !== 'function') return [];
        return catalog.listQuestDefinitions();
    }

    function getGameSession() {
        if (window.GameSessionRuntime && typeof window.GameSessionRuntime.getSession === 'function') {
            return window.GameSessionRuntime.getSession();
        }
        if (typeof window.getGameSession === 'function') {
            return window.getGameSession();
        }
        return null;
    }

    function ensureQuestStore() {
        const session = getGameSession();
        if (!session || !session.progress) return null;
        if (!session.progress.quests || typeof session.progress.quests !== 'object') {
            session.progress.quests = {};
        }
        return session.progress.quests;
    }

    function createDefaultQuestEntry() {
        return {
            status: 'not_started',
            startedAt: null,
            updatedAt: null,
            completedAt: null,
            activeStepId: null,
            objectiveStates: {},
            flags: {}
        };
    }

    function getStoredQuestEntry(questId) {
        const store = ensureQuestStore();
        if (!store) return null;
        return store[questId] || null;
    }

    function isQuestCompleted(questId) {
        const resolvedState = resolveQuestState(questId, { persist: false, touch: false });
        return !!(resolvedState && resolvedState.status === 'completed');
    }

    function ensureStoredQuestEntry(questId) {
        const store = ensureQuestStore();
        if (!store) return null;
        if (!store[questId]) store[questId] = createDefaultQuestEntry();
        return store[questId];
    }

    function getInventoryCountByItemId(itemId) {
        if (!itemId) return 0;
        if (typeof getInventoryCount === 'function') {
            const count = Number(getInventoryCount(itemId));
            return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
        }

        const session = getGameSession();
        const slots = session && session.progress && Array.isArray(session.progress.inventory)
            ? session.progress.inventory
            : [];
        let total = 0;
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            if (!slot || !slot.itemData || slot.itemData.id !== itemId) continue;
            const amount = Number(slot.amount);
            total += Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
        }
        return total;
    }

    function ensurePlayerUnlockFlags() {
        const session = getGameSession();
        if (!session || !session.player || typeof session.player !== 'object') return null;
        if (!session.player.unlockFlags || typeof session.player.unlockFlags !== 'object') {
            session.player.unlockFlags = {};
        }
        return session.player.unlockFlags;
    }

    function getObjectiveRequiredAmount(objectiveDef) {
        return Number.isFinite(objectiveDef && objectiveDef.amount)
            ? Math.max(1, Math.floor(objectiveDef.amount))
            : 1;
    }

    function getObjectiveKind(objectiveDef) {
        const kind = String(objectiveDef && objectiveDef.kind || '').trim().toLowerCase();
        return kind === 'has_item' ? 'has_item' : 'turn_in_item';
    }

    function objectiveConsumesItems(objectiveDef) {
        return getObjectiveKind(objectiveDef) !== 'has_item';
    }

    function buildObjectiveState(objectiveDef, forceComplete) {
        const target = getObjectiveRequiredAmount(objectiveDef);
        const current = forceComplete
            ? target
            : Math.min(target, getInventoryCountByItemId(objectiveDef && objectiveDef.itemId));
        return {
            current,
            target,
            completed: current >= target
        };
    }

    function evaluateQuestState(questDef, entry) {
        const storedEntry = entry || createDefaultQuestEntry();
        const questStatus = storedEntry.status || 'not_started';

        if (questStatus === 'completed') {
            const completedObjectiveStates = {};
            const objectiveDefs = Array.isArray(questDef && questDef.objectives) ? questDef.objectives : [];
            for (let i = 0; i < objectiveDefs.length; i++) {
                const objectiveDef = objectiveDefs[i];
                if (!objectiveDef || !objectiveDef.objectiveId) continue;
                completedObjectiveStates[objectiveDef.objectiveId] = buildObjectiveState(objectiveDef, true);
            }
            return {
                status: 'completed',
                activeStepId: 'completed',
                objectiveStates: completedObjectiveStates
            };
        }

        if (questStatus === 'not_started') {
            return {
                status: 'not_started',
                activeStepId: null,
                objectiveStates: storedEntry.objectiveStates || {}
            };
        }

        const objectiveDefs = Array.isArray(questDef && questDef.objectives) ? questDef.objectives : [];
        const objectiveStates = {};
        let allComplete = objectiveDefs.length > 0;
        for (let i = 0; i < objectiveDefs.length; i++) {
            const objectiveDef = objectiveDefs[i];
            if (!objectiveDef || !objectiveDef.objectiveId) continue;
            const objectiveState = buildObjectiveState(objectiveDef, false);
            objectiveStates[objectiveDef.objectiveId] = objectiveState;
            if (!objectiveState.completed) allComplete = false;
        }

        return {
            status: allComplete ? 'ready_to_complete' : 'active',
            activeStepId: allComplete ? 'return_to_giver' : 'collect_items',
            objectiveStates
        };
    }

    function resolveQuestState(questId, options) {
        const resolvedQuestId = normalizeQuestId(questId);
        const questDef = getQuestDefinition(resolvedQuestId);
        if (!questDef) return null;

        const storedEntry = getStoredQuestEntry(resolvedQuestId);
        const sourceEntry = storedEntry || createDefaultQuestEntry();
        const evaluation = evaluateQuestState(questDef, sourceEntry);

        if (storedEntry && options && options.persist) {
            storedEntry.status = evaluation.status;
            storedEntry.activeStepId = evaluation.activeStepId;
            storedEntry.objectiveStates = evaluation.objectiveStates;
            if (options.touch) storedEntry.updatedAt = Date.now();
        }

        return Object.assign({}, sourceEntry, {
            questId: resolvedQuestId,
            title: questDef.title,
            status: evaluation.status,
            activeStepId: evaluation.activeStepId,
            objectiveStates: evaluation.objectiveStates
        });
    }

    function emitQuestUiRefresh() {
        if (typeof renderQuestLog === 'function') renderQuestLog();
        if (window.NpcDialogueRuntime && typeof window.NpcDialogueRuntime.refreshActiveDialogue === 'function') {
            window.NpcDialogueRuntime.refreshActiveDialogue();
        }
    }

    function saveQuestProgress(reason) {
        if (typeof saveProgressToStorage === 'function') {
            saveProgressToStorage(reason || 'quest_update');
        }
    }

    function addQuestChat(message, tone) {
        if (!message || typeof addChatMessage !== 'function') return;
        addChatMessage(message, tone || 'info');
    }

    function formatObjectiveProgressLine(objectiveDef, objectiveState) {
        const label = objectiveDef && objectiveDef.label ? objectiveDef.label : 'Objective';
        const current = objectiveState && Number.isFinite(objectiveState.current) ? objectiveState.current : 0;
        const target = objectiveState && Number.isFinite(objectiveState.target) ? objectiveState.target : 0;
        return label + ': ' + current + '/' + target;
    }

    function formatObjectiveProgressSummary(questDef, resolvedState) {
        const objectiveDefs = Array.isArray(questDef && questDef.objectives) ? questDef.objectives : [];
        const parts = [];
        for (let i = 0; i < objectiveDefs.length; i++) {
            const objectiveDef = objectiveDefs[i];
            if (!objectiveDef || !objectiveDef.objectiveId) continue;
            const objectiveState = resolvedState && resolvedState.objectiveStates
                ? resolvedState.objectiveStates[objectiveDef.objectiveId]
                : null;
            parts.push(formatObjectiveProgressLine(objectiveDef, objectiveState));
        }
        return parts.join('  ');
    }

    function buildQuestProgressResponse(questDef, resolvedState) {
        if (!questDef || !resolvedState) return 'There is no quest progress to report right now.';
        if (resolvedState.status === 'not_started') {
            return questDef.journal.offer || questDef.summary || 'This quest is available when you are ready.';
        }
        if (resolvedState.status === 'ready_to_complete') {
            return (questDef.journal.ready + ' ' + formatObjectiveProgressSummary(questDef, resolvedState)).trim();
        }
        if (resolvedState.status === 'completed') {
            return questDef.journal.completed || questDef.summary || 'That work is already finished.';
        }
        return (questDef.journal.active + ' ' + formatObjectiveProgressSummary(questDef, resolvedState)).trim();
    }

    function buildQuestStartText(questDef) {
        if (!questDef) return 'Talk to the quest giver to begin.';
        if (typeof questDef.startInstructions === 'string' && questDef.startInstructions.trim()) {
            return questDef.startInstructions.trim();
        }
        const questGiverName = typeof questDef.questGiverName === 'string' && questDef.questGiverName.trim()
            ? questDef.questGiverName.trim()
            : 'the quest giver';
        return 'Talk to ' + questGiverName + ' to begin.';
    }

    function isMerchantShopUnlocked(merchantId) {
        const questDef = findQuestByMerchantId(merchantId);
        if (!questDef) return true;
        const resolvedState = resolveQuestState(questDef.questId, { persist: false, touch: false });
        return !!(resolvedState && resolvedState.status === 'completed');
    }

    function buildMerchantLockedMessage(merchantId) {
        const questDef = findQuestByMerchantId(merchantId);
        if (!questDef) return 'That shop is not available right now.';
        const resolvedState = resolveQuestState(questDef.questId, { persist: false, touch: false });
        if (!resolvedState || resolvedState.status === 'not_started') {
            return buildQuestStartText(questDef);
        }
        if (resolvedState.status === 'ready_to_complete') {
            return questDef.journal.ready || 'Finish the quest to unlock this shop.';
        }
        return questDef.journal.active || 'Finish the quest to unlock this shop.';
    }

    function hasDialogueFirstPrimaryAction(npc) {
        const questDefs = findQuestDefinitionsByNpc(npc);
        for (let i = 0; i < questDefs.length; i++) {
            const questDef = questDefs[i];
            if (!questDef || questDef.primaryActionPolicy !== 'dialogue_first') continue;
            return true;
        }
        return false;
    }

    function resolveNpcPrimaryAction(npc) {
        const safeNpc = npc && typeof npc === 'object' ? npc : {};
        const merchantId = typeof safeNpc.merchantId === 'string' ? safeNpc.merchantId.trim() : '';
        const baseAction = typeof safeNpc.action === 'string' && safeNpc.action.trim()
            ? safeNpc.action.trim()
            : ((safeNpc.name === 'Shopkeeper' || merchantId) ? 'Trade' : 'Talk-to');

        if (baseAction === 'Travel') return 'Travel';
        if (merchantId) {
            if (hasDialogueFirstPrimaryAction(safeNpc)) return 'Talk-to';
            return isMerchantShopUnlocked(merchantId) ? 'Trade' : 'Talk-to';
        }
        return baseAction;
    }

    function buildQuestNextStepText(questDef, resolvedState) {
        if (!questDef || !resolvedState) return 'No next step is available right now.';
        if (resolvedState.status === 'not_started') return buildQuestStartText(questDef);
        if (resolvedState.status === 'ready_to_complete') return questDef.journal.ready || 'Return to the quest giver to finish this quest.';
        if (resolvedState.status === 'completed') return questDef.journal.completed || 'This quest is complete.';
        return questDef.journal.active || questDef.summary || 'Keep working on the current objective.';
    }

    function buildQuestObjectives(questDef, resolvedState) {
        const objectiveDefs = Array.isArray(questDef && questDef.objectives) ? questDef.objectives : [];
        const objectives = [];
        for (let j = 0; j < objectiveDefs.length; j++) {
            const objectiveDef = objectiveDefs[j];
            if (!objectiveDef || !objectiveDef.objectiveId) continue;
            const objectiveState = resolvedState && resolvedState.objectiveStates
                ? resolvedState.objectiveStates[objectiveDef.objectiveId]
                : null;
            const fallbackState = buildObjectiveState(objectiveDef, resolvedState && resolvedState.status === 'completed');
            const finalState = objectiveState || fallbackState;
            objectives.push({
                label: objectiveDef.label || 'Objective',
                progressText: formatObjectiveProgressLine(objectiveDef, finalState),
                completed: !!finalState.completed
            });
        }
        return objectives;
    }

    function startQuest(questId) {
        const resolvedQuestId = normalizeQuestId(questId);
        const questDef = getQuestDefinition(resolvedQuestId);
        if (!questDef) {
            return { ok: false, messageText: 'That quest is not available right now.' };
        }

        const entry = ensureStoredQuestEntry(resolvedQuestId);
        if (!entry) {
            return { ok: false, messageText: 'Quest progress could not be initialized.' };
        }

        if (entry.status === 'completed') {
            const completedState = resolveQuestState(resolvedQuestId, { persist: false });
            return {
                ok: true,
                state: completedState,
                messageText: questDef.dialogue && questDef.dialogue.completedResponse
                    ? questDef.dialogue.completedResponse
                    : buildQuestProgressResponse(questDef, completedState)
            };
        }

        if (entry.status !== 'active' && entry.status !== 'ready_to_complete') {
            const startGrant = grantRewardBundle(questDef.startRewards, {
                requireAllItems: true,
                failureMessage: questDef.startRewardFailureText
            });
            if (!startGrant.ok) {
                return {
                    ok: false,
                    messageText: startGrant.messageText
                };
            }

            const startedAt = Date.now();
            entry.status = 'active';
            entry.startedAt = entry.startedAt || startedAt;
            entry.updatedAt = startedAt;
            entry.completedAt = null;
            entry.activeStepId = 'collect_items';
            entry.objectiveStates = {};
            if (startGrant.inventoryChanged && typeof renderInventory === 'function') renderInventory();
            addQuestChat('Quest started: ' + questDef.title + '.', 'info');
            saveQuestProgress('quest_started');
        }

        const resolvedState = resolveQuestState(resolvedQuestId, { persist: true, touch: true });
        emitQuestUiRefresh();
        return {
            ok: true,
            state: resolvedState,
            messageText: questDef.dialogue && questDef.dialogue.offerResponse
                ? questDef.dialogue.offerResponse
                : buildQuestProgressResponse(questDef, resolvedState)
        };
    }

    function rollbackGrantedItems(grantedItems) {
        if (!Array.isArray(grantedItems) || typeof removeItemsById !== 'function') return;
        for (let i = 0; i < grantedItems.length; i++) {
            const granted = grantedItems[i];
            if (!granted || !granted.itemId) continue;
            const amount = Number.isFinite(granted.amount) ? Math.max(1, Math.floor(granted.amount)) : 1;
            removeItemsById(granted.itemId, amount);
        }
    }

    function grantRewardBundle(bundle, options) {
        const rewardData = bundle && typeof bundle === 'object' ? bundle : {};
        const opts = options && typeof options === 'object' ? options : {};
        const grantedItems = [];
        const grantedSkillXp = [];
        const grantedUnlockFlags = [];

        if (Array.isArray(rewardData.items)) {
            for (let i = 0; i < rewardData.items.length; i++) {
                const reward = rewardData.items[i];
                const itemId = reward && reward.itemId ? reward.itemId : '';
                if (!itemId) continue;

                const amount = Number.isFinite(reward.amount) ? Math.max(1, Math.floor(reward.amount)) : 1;
                const itemData = window.ITEM_DB && window.ITEM_DB[itemId] ? window.ITEM_DB[itemId] : null;
                const granted = itemData && typeof giveItem === 'function'
                    ? Number(giveItem(itemData, amount))
                    : 0;

                if (Number.isFinite(granted) && granted > 0) {
                    grantedItems.push({ itemId, amount: granted });
                }

                if (opts.requireAllItems && granted < amount) {
                    rollbackGrantedItems(grantedItems);
                    return {
                        ok: false,
                        messageText: opts.failureMessage || 'You need more free inventory space first.',
                        itemsGranted: [],
                        skillXpGranted: [],
                        unlockFlagsGranted: [],
                        inventoryChanged: false
                    };
                }
            }
        }

        if (Array.isArray(rewardData.skillXp) && typeof addSkillXp === 'function') {
            for (let i = 0; i < rewardData.skillXp.length; i++) {
                const reward = rewardData.skillXp[i];
                if (!reward || !reward.skillId) continue;
                const amount = Number.isFinite(reward.amount) ? Math.max(0, Math.floor(reward.amount)) : 0;
                if (amount <= 0) continue;
                addSkillXp(reward.skillId, amount);
                grantedSkillXp.push({ skillId: reward.skillId, amount });
            }
        }

        if (Array.isArray(rewardData.unlockFlags)) {
            const flags = ensurePlayerUnlockFlags();
            if (flags) {
                for (let i = 0; i < rewardData.unlockFlags.length; i++) {
                    const reward = rewardData.unlockFlags[i];
                    const flagId = typeof reward === 'string'
                        ? reward
                        : (reward && typeof reward.flagId === 'string' ? reward.flagId : '');
                    if (!flagId) continue;
                    flags[flagId] = true;
                    grantedUnlockFlags.push(flagId);
                }
            }
        }

        return {
            ok: true,
            messageText: '',
            itemsGranted: grantedItems,
            skillXpGranted: grantedSkillXp,
            unlockFlagsGranted: grantedUnlockFlags,
            inventoryChanged: grantedItems.length > 0
        };
    }

    function applyCompletionRemovals(removals) {
        if (!Array.isArray(removals) || typeof removeItemsById !== 'function') return;
        for (let i = 0; i < removals.length; i++) {
            const removal = removals[i];
            if (!removal || !removal.itemId) continue;
            const amount = Number.isFinite(removal.amount) ? Math.max(1, Math.floor(removal.amount)) : 1;
            removeItemsById(removal.itemId, amount);
        }
    }

    function completeQuest(questId) {
        const resolvedQuestId = normalizeQuestId(questId);
        const questDef = getQuestDefinition(resolvedQuestId);
        if (!questDef) {
            return { ok: false, messageText: 'That quest is not available right now.' };
        }

        const entry = ensureStoredQuestEntry(resolvedQuestId);
        if (!entry) {
            return { ok: false, messageText: 'Quest progress could not be initialized.' };
        }

        const resolvedState = resolveQuestState(resolvedQuestId, { persist: true, touch: false });
        if (!resolvedState || resolvedState.status !== 'ready_to_complete') {
            return {
                ok: false,
                state: resolvedState,
                messageText: buildQuestProgressResponse(questDef, resolvedState || createDefaultQuestEntry())
            };
        }

        const objectiveDefs = Array.isArray(questDef.objectives) ? questDef.objectives : [];
        for (let i = 0; i < objectiveDefs.length; i++) {
            const objectiveDef = objectiveDefs[i];
            if (!objectiveDef || !objectiveDef.itemId) continue;
            const requiredAmount = getObjectiveRequiredAmount(objectiveDef);
            if (getInventoryCountByItemId(objectiveDef.itemId) < requiredAmount) {
                return {
                    ok: false,
                    state: resolveQuestState(resolvedQuestId, { persist: true, touch: false }),
                    messageText: buildQuestProgressResponse(questDef, resolveQuestState(resolvedQuestId, { persist: false }) || createDefaultQuestEntry())
                };
            }
        }

        for (let i = 0; i < objectiveDefs.length; i++) {
            const objectiveDef = objectiveDefs[i];
            if (!objectiveDef || !objectiveDef.itemId || typeof removeItemsById !== 'function' || !objectiveConsumesItems(objectiveDef)) continue;
            const requiredAmount = getObjectiveRequiredAmount(objectiveDef);
            removeItemsById(objectiveDef.itemId, requiredAmount);
        }
        applyCompletionRemovals(questDef.completionRemovals);

        entry.status = 'completed';
        entry.completedAt = Date.now();
        entry.updatedAt = entry.completedAt;
        entry.activeStepId = 'completed';
        entry.objectiveStates = {};
        for (let i = 0; i < objectiveDefs.length; i++) {
            const objectiveDef = objectiveDefs[i];
            if (!objectiveDef || !objectiveDef.objectiveId) continue;
            entry.objectiveStates[objectiveDef.objectiveId] = buildObjectiveState(objectiveDef, true);
        }

        grantRewardBundle(questDef.rewards);
        if (typeof renderInventory === 'function') renderInventory();

        addQuestChat('Quest complete: ' + questDef.title + '.', 'info');
        saveQuestProgress('quest_completed');
        emitQuestUiRefresh();

        return {
            ok: true,
            state: resolveQuestState(resolvedQuestId, { persist: true, touch: false }),
            messageText: questDef.dialogue && questDef.dialogue.completedResponse
                ? questDef.dialogue.completedResponse
                : (questDef.journal && questDef.journal.completed ? questDef.journal.completed : 'Quest complete.')
        };
    }

    function buildQuestDialogueOptions(questDef, resolvedState) {
        const options = [];
        const questId = questDef.questId;

        if (resolvedState.status === 'not_started') {
            options.push({
                kind: 'custom',
                label: 'Ask about work',
                onSelect: function () {
                    const result = startQuest(questId);
                    return {
                        refresh: true,
                        bodyText: result.messageText
                    };
                }
            });
            return options;
        }

        options.push({
            kind: 'custom',
            label: 'Ask about the order',
            onSelect: function () {
                const latestState = resolveQuestState(questId, { persist: true, touch: false });
                return {
                    refresh: true,
                    bodyText: buildQuestProgressResponse(questDef, latestState || resolvedState)
                };
            }
        });

        if (resolvedState.status === 'ready_to_complete') {
            options.push({
                kind: 'custom',
                label: 'Hand over materials',
                onSelect: function () {
                    const result = completeQuest(questId);
                    return {
                        refresh: true,
                        bodyText: result.messageText
                    };
                }
            });
        }

        if (resolvedState.status === 'completed') {
            options[0].label = 'Ask about the delivery';
        }

        return options;
    }

    function ensureDialogueHasCloseOption(options) {
        const rows = Array.isArray(options) ? options.slice() : [];
        const hasClose = rows.some(function (option) {
            return option && option.kind === 'close';
        });
        if (!hasClose) rows.push({ kind: 'close', label: 'Goodbye' });
        return rows;
    }

    function buildNpcDialogueView(npc, baseView) {
        const questDefs = findQuestDefinitionsByNpc(npc);
        if (!Array.isArray(questDefs) || questDefs.length === 0) return baseView;

        let nextView = {
            title: baseView && baseView.title ? baseView.title : (npc && npc.name ? npc.name : 'Conversation'),
            greeting: baseView && baseView.greeting ? baseView.greeting : '',
            options: baseView && Array.isArray(baseView.options) ? baseView.options.slice() : []
        };

        for (let i = 0; i < questDefs.length; i++) {
            const questDef = questDefs[i];
            if (!questDef || !questDef.questId) continue;
            const resolvedState = resolveQuestState(questDef.questId, { persist: false, touch: false });
            if (!resolvedState) continue;

            if (resolvedState.status === 'not_started' && questDef.dialogue && questDef.dialogue.offerGreeting) {
                nextView.greeting = questDef.dialogue.offerGreeting;
            } else if (resolvedState.status === 'ready_to_complete' && questDef.dialogue && questDef.dialogue.readyGreeting) {
                nextView.greeting = questDef.dialogue.readyGreeting;
            } else if (resolvedState.status === 'completed' && questDef.dialogue && questDef.dialogue.completedGreeting) {
                nextView.greeting = questDef.dialogue.completedGreeting;
            } else if (questDef.dialogue && questDef.dialogue.activeGreeting) {
                nextView.greeting = questDef.dialogue.activeGreeting;
            }

            nextView.options = buildQuestDialogueOptions(questDef, resolvedState).concat(nextView.options || []);
        }

        nextView.options = ensureDialogueHasCloseOption(nextView.options);
        return nextView;
    }

    function formatUnlockFlagLabel(flagId) {
        const labels = {
            ringMouldUnlocked: 'Unlock Ring mould use',
            amuletMouldUnlocked: 'Unlock Amulet mould use',
            tiaraMouldUnlocked: 'Unlock Tiara mould use'
        };
        if (labels[flagId]) return labels[flagId];
        return String(flagId || '')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (match) => match.toUpperCase())
            .trim();
    }

    function buildRewardText(questDef) {
        const rewards = [];
        const rewardData = questDef && questDef.rewards ? questDef.rewards : {};

        if (Array.isArray(rewardData.items)) {
            for (let i = 0; i < rewardData.items.length; i++) {
                const reward = rewardData.items[i];
                if (!reward || !reward.itemId) continue;
                const amount = Number.isFinite(reward.amount) ? Math.max(1, Math.floor(reward.amount)) : 1;
                const itemName = window.ITEM_DB && window.ITEM_DB[reward.itemId] && window.ITEM_DB[reward.itemId].name
                    ? window.ITEM_DB[reward.itemId].name
                    : reward.itemId;
                rewards.push(amount + ' ' + itemName);
            }
        }

        if (Array.isArray(rewardData.skillXp)) {
            for (let i = 0; i < rewardData.skillXp.length; i++) {
                const reward = rewardData.skillXp[i];
                if (!reward || !reward.skillId) continue;
                const amount = Number.isFinite(reward.amount) ? Math.max(0, Math.floor(reward.amount)) : 0;
                const skillName = String(reward.skillId).charAt(0).toUpperCase() + String(reward.skillId).slice(1);
                rewards.push(amount + ' ' + skillName + ' XP');
            }
        }

        if (Array.isArray(rewardData.unlockFlags)) {
            for (let i = 0; i < rewardData.unlockFlags.length; i++) {
                const reward = rewardData.unlockFlags[i];
                const flagId = typeof reward === 'string'
                    ? reward
                    : (reward && typeof reward.flagId === 'string' ? reward.flagId : '');
                if (!flagId) continue;
                rewards.push(formatUnlockFlagLabel(flagId));
            }
        }

        if (questDef && questDef.unlocksMerchantId) {
            const merchantLabel = questDef.questGiverName
                ? ('Unlock ' + questDef.questGiverName + '\'s shop')
                : 'Unlock merchant access';
            rewards.push(merchantLabel);
        }

        return rewards.join(' | ');
    }

    function getQuestLogEntries() {
        const entries = [];
        const questDefs = listQuestDefinitions();
        for (let i = 0; i < questDefs.length; i++) {
            const questDef = questDefs[i];
            if (!questDef || !questDef.questId) continue;

            const resolvedState = resolveQuestState(questDef.questId, { persist: false, touch: false });
            if (!resolvedState) continue;

            entries.push({
                questId: questDef.questId,
                title: questDef.title,
                questGiverName: questDef.questGiverName || 'Unknown',
                status: resolvedState.status,
                summary: questDef.summary || questDef.journal.offer || 'No quest summary is available yet.',
                startText: buildQuestStartText(questDef),
                progressText: buildQuestProgressResponse(questDef, resolvedState),
                nextStepText: buildQuestNextStepText(questDef, resolvedState),
                objectives: buildQuestObjectives(questDef, resolvedState),
                rewardsText: buildRewardText(questDef),
                sortKey: STATUS_PRIORITY[resolvedState.status] || STATUS_PRIORITY.not_started,
                completedAt: resolvedState.completedAt || 0,
                startedAt: resolvedState.startedAt || 0
            });
        }

        entries.sort(function (a, b) {
            if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
            if (a.status === 'completed' && b.status === 'completed') return b.completedAt - a.completedAt;
            return a.startedAt - b.startedAt;
        });

        return entries;
    }

    function refreshAllQuestStates(options) {
        const opts = options || {};
        const store = ensureQuestStore();
        const questIds = store ? Object.keys(store) : [];
        const refreshed = [];
        for (let i = 0; i < questIds.length; i++) {
            const questId = normalizeQuestId(questIds[i]);
            if (!questId) continue;
            const storedEntry = store[questIds[i]];
            if (!storedEntry || storedEntry.status === 'not_started' || storedEntry.status === 'completed') continue;
            const nextState = resolveQuestState(questId, { persist: true, touch: !!opts.touch });
            if (nextState) refreshed.push(nextState);
        }
        if (opts.render !== false) emitQuestUiRefresh();
        if (opts.persist) saveQuestProgress('quest_refresh');
        return refreshed;
    }

    function handleNpcDialogueOpened(npc) {
        const questDefs = findQuestDefinitionsByNpc(npc);
        if (!Array.isArray(questDefs) || questDefs.length === 0) return null;

        for (let i = 0; i < questDefs.length; i++) {
            const questDef = questDefs[i];
            if (!questDef || !questDef.questId || !questDef.autoStartOnFirstInteraction) continue;
            const resolvedState = resolveQuestState(questDef.questId, { persist: false, touch: false });
            if (!resolvedState || resolvedState.status !== 'not_started') continue;
            return startQuest(questDef.questId);
        }
        return null;
    }

    function canOpenMerchantShop(merchantId) {
        if (isMerchantShopUnlocked(merchantId)) return { ok: true };
        return {
            ok: false,
            messageText: buildMerchantLockedMessage(merchantId)
        };
    }

    window.QuestRuntime = {
        createDefaultQuestEntry: createDefaultQuestEntry,
        getQuestDefinition: getQuestDefinition,
        getStoredQuestEntry: getStoredQuestEntry,
        isQuestCompleted: isQuestCompleted,
        resolveNpcPrimaryAction: resolveNpcPrimaryAction,
        resolveQuestState: resolveQuestState,
        refreshAllQuestStates: refreshAllQuestStates,
        buildNpcDialogueView: buildNpcDialogueView,
        handleNpcDialogueOpened: handleNpcDialogueOpened,
        canOpenMerchantShop: canOpenMerchantShop,
        startQuest: startQuest,
        completeQuest: completeQuest,
        getQuestLogEntries: getQuestLogEntries,
        isMerchantShopUnlocked: isMerchantShopUnlocked
    };
})();
