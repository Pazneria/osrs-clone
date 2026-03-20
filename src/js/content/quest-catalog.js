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
        },
        thrain_deepforge_proof_of_the_deepforge: {
            questId: 'thrain_deepforge_proof_of_the_deepforge',
            kind: 'turn_in_items',
            title: 'Proof of the Deepforge',
            category: 'starter_town',
            questGiverName: 'Thrain Deepforge',
            startNpcDialogueId: 'thrain_deepforge',
            startMerchantId: 'thrain_deepforge',
            startInstructions: 'Talk to Thrain Deepforge at Deepforge House on the western smithing lane in Starter Town.',
            autoStartOnFirstInteraction: true,
            unlocksMerchantId: 'thrain_deepforge',
            summary: 'Thrain Deepforge wants proof that you can handle late-band mining work before he opens his advanced ore stock.',
            journal: {
                offer: 'Thrain wants proof-grade ore before he opens his late-metal stock to you.',
                active: 'Bring Thrain 6 coal, 2 gold ore, and 1 uncut emerald.',
                ready: 'I have the materials Thrain asked for. I should return to Deepforge House.',
                completed: 'Thrain accepted my shipment and opened his advanced ore stock.'
            },
            objectives: [
                createTurnInObjective('coal', 'Coal', 'coal', 6),
                createTurnInObjective('gold_ore', 'Gold ore', 'gold_ore', 2),
                createTurnInObjective('uncut_emerald', 'Uncut emerald', 'uncut_emerald', 1)
            ],
            rewards: {
                skillXp: [
                    { skillId: 'smithing', amount: 200 }
                ]
            },
            dialogue: {
                offerGreeting: 'I do not open the deepforge stock for tourists. Bring me proof that you can work a serious vein and we can speak like professionals.',
                offerResponse: 'Bring me 6 coal, 2 gold ore, and 1 uncut emerald. If you can put that on my bench, I will open the advanced stock.',
                activeGreeting: 'You want late metal, earn it. I am still waiting on that coal, gold ore, and emerald.',
                readyGreeting: 'That looks closer to real work. If you brought the full order, I will treat you like a proper customer.',
                completedGreeting: 'You brought me something worth looking at. The deepforge stock is open to you now.',
                completedResponse: 'Good. You know the difference between shiny rock and useful metal. My advanced ore stock is yours to trade with now.'
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
