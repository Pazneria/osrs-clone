(function () {
    function normalizeDialogueKey(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function normalizeDialogueTextValue(value) {
        if (Array.isArray(value)) {
            const pages = value
                .map((entry) => typeof entry === 'string' ? entry.trim() : '')
                .filter((entry) => entry.length > 0);
            if (pages.length > 1) return pages;
            if (pages.length === 1) return pages[0];
            return '';
        }
        return typeof value === 'string' ? value.trim() : String(value || '');
    }

    function createTextOption(label, response) {
        return { kind: 'text', label, response: normalizeDialogueTextValue(response) };
    }

    function createActionOption(label, kind, extra = null) {
        return Object.assign({ kind, label }, extra || {});
    }

    function createBankActionOption(label = 'Bank') {
        return { kind: 'bank', label };
    }

    const DIALOGUE_ENTRIES = {
        shopkeeper: {
            title: 'Shopkeeper',
            greeting: 'Welcome to the general store. If it keeps your trip moving, I probably stock it.',
            options: [
                createTextOption('Ask about supplies', 'Fresh stock comes in all the time. Check back often if you need something basic.'),
                createTextOption('Ask about the road', 'Carry food, a light, and a spare plan. The road likes to punish optimism.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        road_guide: {
            title: 'Road Guide',
            greeting: 'Need directions, or are you just admiring the dust?',
            options: [
                createTextOption('Ask about the town', 'Starter Town is easier to learn if you take it one lane at a time.'),
                createTextOption('Ask about the roads', 'Stay on the marked routes and watch the outer fields if you wander.'),
                createActionOption('Travel', 'travel'),
                createActionOption('Goodbye', 'close')
            ]
        },
        outpost_guide: {
            title: 'Outpost Guide',
            greeting: 'The outpost keeps the road honest. What do you need?',
            options: [
                createTextOption('Ask about the outpost', 'We keep supplies moving and trouble just far enough away to stay busy.'),
                createTextOption('Ask about the northern road', 'The farther you go, the more careful you should be with your route.'),
                createActionOption('Travel', 'travel'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_guide: {
            title: 'Tutorial Guide',
            greeting: [
                'Welcome, traveler! You made it to Tutorial Island.',
                'This little arrival cabin is where new adventurers get their bearings before stepping out into the island.',
                'I will walk you through the basics one piece at a time.'
            ],
            options: [
                createTextOption('Ask about movement', [
                    'Left-click the ground to walk. Right-click people, doors, resources, and objects when you want the full set of actions.',
                    'If a lesson says to use one thing on another, open your inventory, choose Use on the first item, then click the target.'
                ]),
                createTextOption('Ask about the island', [
                    'Tutorial Island is a guided route for first-time adventurers. Each instructor covers one basic skill and then points you to the next stop.',
                    'You will gather wood, catch fish, cook, mine, smith, fight with melee, ranged, and magic, craft runes, shape clay, use the bank, then leave for Starter Town.'
                ]),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_woodcutting_instructor: {
            title: 'Woodcutting Instructor',
            greeting: 'Welcome to the grove. Trees are your first renewable resource: cut one, take the logs, and the stump will grow back.',
            options: [
                createTextOption('Ask about chopping', 'Keep the bronze axe in your inventory, use it on a normal tree, and bring the logs back before you move on.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_firemaking_instructor: {
            title: 'Firemaking Instructor',
            greeting: 'This clearing finishes the Survival Field: logs become fire, and fire turns raw food into something useful.',
            options: [
                createTextOption('Ask about fires', 'In your inventory, use a tinderbox with logs near the clearing, then use raw shrimp on your own fire. Burnt shrimp still proves the loop.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_fishing_instructor: {
            title: 'Fishing Instructor',
            greeting: 'The pond is part of the Survival Field: gather food here, then carry it to your own fire.',
            options: [
                createTextOption('Ask about fishing', 'Stand by the water and use a small net on the pond until raw shrimp appears in your inventory, then take it to the fire clearing.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_mining_smithing_instructor: {
            title: 'Mining and Smithing Instructor',
            greeting: 'Ore becomes bars, and bars become useful parts if you work them in order.',
            options: [
                createTextOption('Ask about metal', 'Mine enough copper and tin for three Bronze Bars, choose Bronze Sword Blade and Bronze Arrowheads at the anvil, then use the blade on a Wooden Handle w/ Strap to make a real Bronze Sword.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_combat_instructor: {
            title: 'Combat Instructor',
            greeting: 'The chicken pen is here to teach targeting, styles, and patience.',
            options: [
                createTextOption('Ask about combat', 'Equip the sword from your inventory, attack a chicken up close, and watch your combat tab. Even a little practice is enough for the first lesson.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_ranged_instructor: {
            title: 'Ranged Instructor',
            greeting: 'Distance is a tool. Bows let you start the fight before claws and teeth are in your face.',
            options: [
                createTextOption('Ask about ranged', 'Use Bow String on a Normal Shortbow (u), use the Bronze Arrowheads you forged on Wooden Headless Arrows, then equip the finished shortbow and attack from a few tiles away.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_magic_instructor: {
            title: 'Magic Instructor',
            greeting: 'Magic starts with focus, a staff, and runes that hold the shape of the spell.',
            options: [
                createTextOption('Ask about magic', 'Equip the staff, keep ember runes in your inventory, and attack from range. Each cast spends a rune.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_runecrafting_instructor: {
            title: 'Runecrafting Instructor',
            greeting: 'Rune essence is quiet until an altar gives it a purpose.',
            options: [
                createTextOption('Ask about runecrafting', 'Carry rune essence to the Ember Altar and choose Craft-rune, or use the essence on the altar. The altar turns essence into ember runes.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_crafting_instructor: {
            title: 'Crafting Instructor',
            greeting: 'Crafting turns plain materials into useful parts by choosing the right preparation step.',
            options: [
                createTextOption('Ask about crafting', 'Use clay on pond water to make soft clay. Then stand by the bench as your work area and use the soft clay on the borrowed ring in your inventory.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tutorial_bank_tutor: {
            title: 'Bank Tutor',
            greeting: 'A bank is shared storage. Two booths, one bank.',
            options: [
                createTextOption('Ask about banking', 'Open one booth and deposit a coin from your inventory. Open the other booth and withdraw that coin from the bank grid.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        fishing_teacher: {
            title: 'Fishing Teacher',
            greeting: 'A rod in hand is a lesson in patience. What do you want to learn?',
            options: [
                createTextOption('Ask about fishing', 'Keep your stance relaxed and let the water tell you when to pull.'),
                createTextOption('Ask about tools', 'Small nets and rods are the best way to start before you chase bigger catches.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        fishing_supplier: {
            title: 'Fishing Supplier',
            greeting: 'If the teacher forgets supplies, I do not. What do you need?',
            options: [
                createTextOption('Ask about bait', 'Good bait does not need to look impressive. It only needs to work.'),
                createTextOption('Ask about stock', 'I keep the essentials ready for anyone who wants to fish properly.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        forester_teacher: {
            title: 'Forester Teacher',
            greeting: 'A clean cut starts before the swing. What do you need to know?',
            options: [
                createTextOption('Ask about axes', 'A better axe saves effort, but only if your timing stays steady.'),
                createTextOption('Ask about trees', 'Start with the easy trunks, then work outward as the grain gets tougher.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        fletching_supplier: {
            title: 'Fletching Supplier',
            greeting: 'Strings, feathers, knives. If it keeps wood moving, I can probably hand it over.',
            options: [
                createTextOption('Ask about bow strings', 'A bowstring should be tight enough to trust and plain enough to replace without drama.'),
                createTextOption('Ask about feathers', 'Bad fletching wastes the shot before it leaves the string. Good feathers make the rest look easy.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        advanced_fletcher: {
            title: 'Advanced Fletcher',
            greeting: 'Straight grain, clean fletching, honest balance. The rest is just repetition.',
            options: [
                createTextOption('Ask about bows', 'A good bow should feel calm in the hand before it ever feels powerful.'),
                createTextOption('Ask about arrows', 'If the shaft wobbles or the feathers fight each other, the shot was lost before release.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        advanced_woodsman: {
            title: 'Advanced Woodsman',
            greeting: 'Good timber tells the truth. Most people are too busy hacking to hear it.',
            options: [
                createTextOption('Ask about axes', 'Once the wood turns stubborn, a better edge stops being luxury and starts being survival.'),
                createTextOption('Ask about grain', 'Willow, maple, and yew all push back in different ways. Learn that, and the rest gets simpler.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        banker: {
            title: 'Banker',
            greeting: 'Your valuables are safer in the bank than in your pockets. How can I help?',
            options: [
                createTextOption('Ask about the bank', 'We keep your items secure and ready whenever you need them.'),
                createBankActionOption('Bank'),
                createActionOption('Goodbye', 'close')
            ]
        },
        borin_ironvein: {
            title: 'Borin Ironvein',
            greeting: 'Ore, tools, and stubbornness. That is usually enough to get started.',
            options: [
                createTextOption('Ask about ore', 'Copper and tin teach the basics. Iron teaches respect.'),
                createTextOption('Ask about mining', 'Good mining is about patience, spacing, and not swinging at the wrong rock.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        thrain_deepforge: {
            title: 'Thrain Deepforge',
            greeting: 'Heat, metal, and timing. Most mistakes happen when people rush one of those.',
            options: [
                createTextOption('Ask about forging', 'Keep your bars hot, your hammer ready, and your mind on the shape you want.'),
                createTextOption('Ask about steel', 'Steel pays off when the work gets serious.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        elira_gemhand: {
            title: 'Elira Gemhand',
            greeting: 'Precious stone should look effortless when it is finished. The work is the part nobody sees.',
            options: [
                createTextOption('Ask about gems', 'A good cut brings out the color hiding inside the stone.'),
                createTextOption('Ask about polishing', 'Patience and a steady hand do most of the work.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        crafting_teacher: {
            title: 'Crafting Teacher',
            greeting: 'Crafting is where raw materials start acting civilized. What would you like to know?',
            options: [
                createTextOption('Ask about materials', 'Leather, gems, glass, and thread all have their place once you know the basics.'),
                createTextOption('Ask about practice', 'Start simple. Clean shapes beat clever mistakes every time.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        tanner_rusk: {
            title: 'Tanner Rusk',
            greeting: 'Hides in, useful leather out. That is the whole rhythm of the place.',
            options: [
                createTextOption('Ask about hides', 'Dry them first, then soften them, then cut once. Rushing ruins the lot.'),
                createTextOption('Ask about his yard', 'The yard stays open so the work can breathe and the smell can leave.'),
                createTextOption('Ask about leather', 'Good leather feels honest in the hand. It should move, not fight you.'),
                createActionOption('Trade', 'trade'),
                createActionOption('Goodbye', 'close')
            ]
        },
        rune_tutor: {
            title: 'Rune Tutor',
            greeting: 'Runes reward careful hands and careful thinking. What are you after?',
            options: [
                createTextOption('Ask about runes', 'Each rune has a shape, a purpose, and a lesson attached to it.'),
                createTextOption('Ask about essence', 'Essence is the quiet part. The craft begins when you give it form.'),
                createActionOption('Goodbye', 'close')
            ]
        },
        combination_sage: {
            title: 'Combination Sage',
            greeting: 'Balance is a skill like any other. Mix carefully and the result may surprise you.',
            options: [
                createTextOption('Ask about mixtures', 'Some combinations are subtle. Others are loud. Both have their uses.'),
                createTextOption('Ask about balance', 'Do not let one ingredient bully the others.'),
                createActionOption('Goodbye', 'close')
            ]
        }
    };

    const DIALOGUE_ALIASES = {
        shopkeeper: 'shopkeeper',
        general_store: 'shopkeeper',
        general_store_shopkeeper: 'shopkeeper',
        road_guide: 'road_guide',
        starter_caravan_guide: 'road_guide',
        outpost_guide: 'outpost_guide',
        east_outpost_caravan_guide: 'outpost_guide',
        tutorial_guide: 'tutorial_guide',
        woodcutting_instructor: 'tutorial_woodcutting_instructor',
        tutorial_woodcutting_instructor: 'tutorial_woodcutting_instructor',
        firemaking_instructor: 'tutorial_firemaking_instructor',
        tutorial_firemaking_instructor: 'tutorial_firemaking_instructor',
        fishing_instructor: 'tutorial_fishing_instructor',
        tutorial_fishing_instructor: 'tutorial_fishing_instructor',
        mining_smithing_instructor: 'tutorial_mining_smithing_instructor',
        tutorial_mining_smithing_instructor: 'tutorial_mining_smithing_instructor',
        combat_instructor: 'tutorial_combat_instructor',
        tutorial_combat_instructor: 'tutorial_combat_instructor',
        ranged_instructor: 'tutorial_ranged_instructor',
        tutorial_ranged_instructor: 'tutorial_ranged_instructor',
        magic_instructor: 'tutorial_magic_instructor',
        tutorial_magic_instructor: 'tutorial_magic_instructor',
        runecrafting_instructor: 'tutorial_runecrafting_instructor',
        tutorial_runecrafting_instructor: 'tutorial_runecrafting_instructor',
        crafting_instructor: 'tutorial_crafting_instructor',
        tutorial_crafting_instructor: 'tutorial_crafting_instructor',
        bank_tutor: 'tutorial_bank_tutor',
        tutorial_bank_tutor: 'tutorial_bank_tutor',
        fishing_teacher: 'fishing_teacher',
        fishing_supplier: 'fishing_supplier',
        forester_teacher: 'forester_teacher',
        fletching_supplier: 'fletching_supplier',
        advanced_fletcher: 'advanced_fletcher',
        advanced_woodsman: 'advanced_woodsman',
        banker: 'banker',
        borin_ironvein: 'borin_ironvein',
        thrain_deepforge: 'thrain_deepforge',
        elira_gemhand: 'elira_gemhand',
        crafting_teacher: 'crafting_teacher',
        tanner_rusk: 'tanner_rusk',
        rune_tutor: 'rune_tutor',
        combination_sage: 'combination_sage'
    };

    function resolveDialogueId(value) {
        const normalized = normalizeDialogueKey(value);
        if (!normalized) return '';
        if (DIALOGUE_ENTRIES[normalized]) return normalized;
        return DIALOGUE_ALIASES[normalized] || '';
    }

    function resolveDialogueIdFromNpc(npc) {
        if (!npc || typeof npc !== 'object') return '';
        const directDialogueId = resolveDialogueId(npc.dialogueId);
        if (directDialogueId) return directDialogueId;
        const merchantId = resolveDialogueId(npc.merchantId);
        if (merchantId) return merchantId;
        const nameId = resolveDialogueId(npc.name);
        if (nameId) return nameId;
        return '';
    }

    function getDialogueEntryByNpc(npc) {
        const dialogueId = resolveDialogueIdFromNpc(npc);
        if (!dialogueId) return null;
        return DIALOGUE_ENTRIES[dialogueId] || null;
    }

    window.NpcDialogueCatalog = {
        DIALOGUE_ENTRIES,
        DIALOGUE_ALIASES,
        normalizeDialogueKey,
        resolveDialogueId,
        resolveDialogueIdFromNpc,
        getDialogueEntryByNpc
    };
})();
