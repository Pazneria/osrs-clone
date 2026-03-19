(function () {
    function normalizeQuestKey(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function createTurnInObjective(objectiveId, label, itemId, amount) {
        return {
            objectiveId,
            kind: 'turn_in_item',
            label,
            itemId,
            amount: Math.max(1, Math.floor(amount || 1))
        };
    }

    const QUESTS = {
        tanner_rusk_hides_of_the_frontier: {
            questId: 'tanner_rusk_hides_of_the_frontier',
            kind: 'turn_in_items',
            title: 'Hides of the Frontier',
            category: 'starter_town',
            questGiverName: 'Tanner Rusk',
            startNpcDialogueId: 'tanner_rusk',
            startMerchantId: 'tanner_rusk',
            startInstructions: 'Talk to Tanner Rusk at the tannery on the eastern craft lane in Starter Town.',
            autoStartOnFirstInteraction: true,
            unlocksMerchantId: 'tanner_rusk',
            summary: 'Tanner Rusk needs fresh frontier materials before his new tannery can fully settle into rhythm.',
            journal: {
                offer: 'Tanner needs a fresh bundle of frontier materials to get the tannery moving properly.',
                active: 'Bring Tanner 4 boar tusks and 2 wolf fangs from the far outskirts.',
                ready: 'I have everything Tanner asked for. I should return to the tannery.',
                completed: 'I delivered Tanner\'s frontier materials and he paid me for the trouble.'
            },
            objectives: [
                createTurnInObjective('boar_tusks', 'Boar tusks', 'boar_tusk', 4),
                createTurnInObjective('wolf_fangs', 'Wolf fangs', 'wolf_fang', 2)
            ],
            rewards: {
                items: [
                    { itemId: 'coins', amount: 200 }
                ],
                skillXp: [
                    { skillId: 'crafting', amount: 125 }
                ]
            },
            dialogue: {
                offerGreeting: 'You look like you can handle the rough edge of town. I need fresh frontier materials before this tannery really starts breathing.',
                offerResponse: 'Bring me 4 boar tusks and 2 wolf fangs. Clean pulls, not chewed scraps. The far outskirts should have plenty.',
                activeGreeting: 'I\'m still waiting on those frontier materials. The tannery is built, but stock is what makes it useful.',
                readyGreeting: 'That bundle looks right. If you brought everything, I can finally get this place into a proper rhythm.',
                completedGreeting: 'You did right by me. The tannery finally feels alive again.',
                completedResponse: 'You brought me exactly what I needed. Come back any time you want leatherwork or a bit of practical advice.'
            }
        }
    };

    function resolveQuestId(value) {
        const normalized = normalizeQuestKey(value);
        if (!normalized) return '';
        if (QUESTS[normalized]) return normalized;
        return '';
    }

    function getQuestById(value) {
        const questId = resolveQuestId(value);
        if (!questId) return null;
        return QUESTS[questId] || null;
    }

    function listQuestDefinitions() {
        return Object.keys(QUESTS).map((questId) => QUESTS[questId]).filter(Boolean);
    }

    function findQuestsByNpc(npc) {
        if (!npc || typeof npc !== 'object') return [];
        const dialogueId = normalizeQuestKey(npc.dialogueId);
        const merchantId = normalizeQuestKey(npc.merchantId);
        const matches = [];
        const questDefs = listQuestDefinitions();
        for (let i = 0; i < questDefs.length; i++) {
            const questDef = questDefs[i];
            if (!questDef) continue;
            const startDialogueId = normalizeQuestKey(questDef.startNpcDialogueId);
            const startMerchantId = normalizeQuestKey(questDef.startMerchantId);
            if ((startDialogueId && startDialogueId === dialogueId) || (startMerchantId && startMerchantId === merchantId)) {
                matches.push(questDef);
            }
        }
        return matches;
    }

    window.QuestCatalog = {
        QUESTS,
        normalizeQuestKey,
        resolveQuestId,
        getQuestById,
        listQuestDefinitions,
        findQuestsByNpc
    };
})();
