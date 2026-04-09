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

    function createHasItemObjective(objectiveId, label, itemId, amount) {
        return {
            objectiveId,
            kind: 'has_item',
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
        },
        advanced_fletcher_proof_of_the_yew: {
            questId: 'advanced_fletcher_proof_of_the_yew',
            kind: 'turn_in_items',
            title: 'Proof of the Yew',
            category: 'north_road_camp',
            questGiverName: 'Advanced Fletcher',
            startNpcDialogueId: 'advanced_fletcher',
            startMerchantId: 'advanced_fletcher',
            startInstructions: 'Talk to the Advanced Fletcher at the north-road outpost.',
            autoStartOnFirstInteraction: true,
            unlocksMerchantId: 'advanced_fletcher',
            summary: 'The Advanced Fletcher wants proof that you can finish the top-band yew work before he opens his deeper buyer ledger.',
            journal: {
                offer: 'The Advanced Fletcher wants a yew-grade proof set before he opens his deeper buyer ledger.',
                active: 'Bring the Advanced Fletcher 1 yew handle, 1 yew longbow, and 1 yew shortbow.',
                ready: 'I have the full yew proof set. I should return to the Advanced Fletcher.',
                completed: 'The Advanced Fletcher accepted my yew work and opened his full buyer ledger.'
            },
            objectives: [
                createTurnInObjective('yew_handle', 'Yew handle', 'yew_handle', 1),
                createTurnInObjective('yew_longbow', 'Yew longbow', 'yew_longbow', 1),
                createTurnInObjective('yew_shortbow', 'Yew shortbow', 'yew_shortbow', 1)
            ],
            rewards: {
                skillXp: [
                    { skillId: 'fletching', amount: 250 }
                ]
            },
            dialogue: {
                offerGreeting: 'Plenty of people can shave logs. Fewer can keep yew straight all the way through the final cut.',
                offerResponse: 'Bring me 1 yew handle, 1 yew longbow, and 1 yew shortbow. Show me clean work across the whole yew band, and I will open my full buyer ledger.',
                activeGreeting: 'Yew tells the truth about your hands. I am still waiting on that handle, longbow, and shortbow.',
                readyGreeting: 'That bundle looks close to proper work. If you brought the full yew set, I can treat you like a serious supplier.',
                completedGreeting: 'That is proper yew work. My full buyer ledger is open to you now.',
                completedResponse: 'Good grain, clean balance, and no wasted cuts. I will buy your full fletching stock from here on.'
            }
        },
        fishing_teacher_from_net_to_harpoon: {
            questId: 'fishing_teacher_from_net_to_harpoon',
            kind: 'turn_in_items',
            title: 'From Net to Harpoon',
            category: 'starter_town',
            questGiverName: 'Fishing Teacher',
            startNpcDialogueId: 'fishing_teacher',
            startMerchantId: 'fishing_teacher',
            startInstructions: 'Talk to the Fishing Teacher beside the castle pond bank in Starter Town.',
            autoStartOnFirstInteraction: true,
            primaryActionPolicy: 'dialogue_first',
            summary: 'The Fishing Teacher wants proof that you can work every fishing band before trusting you with a rune harpoon.',
            journal: {
                offer: 'The Fishing Teacher wants a clean sampler from every fishing band before handing over a rune harpoon.',
                active: 'Bring the Fishing Teacher 1 raw shrimp, 1 raw trout, 1 raw salmon, 1 raw tuna, and 1 raw swordfish.',
                ready: 'I have the full fishing sampler. I should return to the Fishing Teacher.',
                completed: 'I proved I could fish every band and earned the Fishing Teacher\'s rune harpoon.'
            },
            objectives: [
                createTurnInObjective('raw_shrimp', 'Raw shrimp', 'raw_shrimp', 1),
                createTurnInObjective('raw_trout', 'Raw trout', 'raw_trout', 1),
                createTurnInObjective('raw_salmon', 'Raw salmon', 'raw_salmon', 1),
                createTurnInObjective('raw_tuna', 'Raw tuna', 'raw_tuna', 1),
                createTurnInObjective('raw_swordfish', 'Raw swordfish', 'raw_swordfish', 1)
            ],
            rewards: {
                items: [
                    { itemId: 'rune_harpoon', amount: 1 }
                ],
                skillXp: [
                    { skillId: 'fishing', amount: 250 }
                ]
            },
            dialogue: {
                offerGreeting: 'Patience gets you started, but range is what proves you understand the water. Want to earn something better than starter gear?',
                offerResponse: 'Bring me one clean catch from every band I teach: shrimp, trout, salmon, tuna, and swordfish. Do that, and I will trust you with a rune harpoon.',
                activeGreeting: 'A good fisher learns every stretch of water, not just the easy one. I am still waiting on that full sampler.',
                readyGreeting: 'That bundle looks like real practice, not luck. If you brought every catch I named, I can finish your lesson properly.',
                completedGreeting: 'You worked every band I asked for. That is enough proof for me.',
                completedResponse: 'You earned this rune harpoon. If you ever sell it or lose it, come back when you are carrying none and I will sell you another for the normal price.'
            }
        },
        elira_gemhand_moulds_of_the_trade: {
            questId: 'elira_gemhand_moulds_of_the_trade',
            kind: 'mould_unlock',
            title: 'Moulds of the Trade',
            category: 'starter_town',
            questGiverName: 'Elira Gemhand',
            startNpcDialogueId: 'elira_gemhand',
            startMerchantId: 'elira_gemhand',
            startInstructions: 'Talk to Elira Gemhand in the town jewelry workshop.',
            autoStartOnFirstInteraction: true,
            primaryActionPolicy: 'dialogue_first',
            startRewardFailureText: 'You need 3 free inventory spaces before borrowing Elira\'s examples.',
            summary: 'Elira wants you to learn mould-making properly by borrowing three example pieces, imprinting them into soft clay, and firing the finished moulds yourself.',
            journal: {
                offer: 'Elira is willing to lend me ring, amulet, and tiara examples so I can learn how jewellery moulds are made.',
                active: 'Use clay on water for soft clay, press it onto Elira\'s borrowed examples, then fire the imprinted moulds.',
                ready: 'I have all three finished moulds. I should return to Elira in the jewelry workshop.',
                completed: 'Elira approved my mould-making work and permanently unlocked the ring, amulet, and tiara mould families for me.'
            },
            startRewards: {
                items: [
                    { itemId: 'borrowed_ring', amount: 1 },
                    { itemId: 'borrowed_amulet', amount: 1 },
                    { itemId: 'borrowed_tiara', amount: 1 }
                ]
            },
            objectives: [
                createHasItemObjective('ring_mould', 'Ring mould', 'ring_mould', 1),
                createHasItemObjective('amulet_mould', 'Amulet mould', 'amulet_mould', 1),
                createHasItemObjective('tiara_mould', 'Tiara mould', 'tiara_mould', 1)
            ],
            completionRemovals: [
                { itemId: 'borrowed_ring', amount: 1 },
                { itemId: 'borrowed_amulet', amount: 1 },
                { itemId: 'borrowed_tiara', amount: 1 }
            ],
            rewards: {
                skillXp: [
                    { skillId: 'crafting', amount: 150 }
                ],
                unlockFlags: [
                    'ringMouldUnlocked',
                    'amuletMouldUnlocked',
                    'tiaraMouldUnlocked'
                ]
            },
            dialogue: {
                offerGreeting: 'If you want proper jewellery tools, you should learn how the moulds are made instead of buying shortcuts.',
                offerResponse: 'Take these three examples. Soften clay in water, press each piece into it, then fire the imprinted moulds and bring the finished set back to me.',
                activeGreeting: 'Soft clay first, then a clean imprint from each borrowed piece, then a careful firing. Do not skip the order.',
                readyGreeting: 'That looks like a proper mould set. If you truly finished all three, I can mark the whole family as yours to use.',
                completedGreeting: 'Good. You made the moulds yourself, so you understand what they are for now.',
                completedResponse: 'Keep the moulds and use them well. You can shape rings, amulets, and tiaras properly from here on.'
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
