(function () {
    const EXAMINE_TEXT_BY_ITEM_ID = {
        iron_axe: 'Reliable and slightly blunt.',
        logs: 'Good for a fire, not for sitting.',
        willow_logs: 'Light wood that burns quickly.',
        ashes: 'All that\'s left of a warm idea.',
        coins: 'Money talks. Usually about prices.',
        tinderbox: 'Small box, big fire ambitions.',
        knife: 'Sharp enough for basic work.',
        iron_pickaxe: 'Solid mining gear for rough rock.',

        small_net: 'Tiny mesh, tiny fish.',
        fishing_rod: 'For fish that bite back less.',
        harpoon: 'Pointy persuasion for bigger catches.',
        rune_harpoon: 'Cuts through water like a rumour.',
        bait: 'Smells like success to a fish.',

        raw_shrimp: 'Fresh from the water.',
        cooked_shrimp: 'Simple, warm, and edible.',
        burnt_shrimp: 'Crispy in all the wrong ways.',
        raw_trout: 'A slippery river classic.',
        cooked_trout: 'Nicely browned and ready.',
        burnt_trout: 'Overdone beyond saving.',
        raw_salmon: 'A decent catch with a decent fight.',
        cooked_salmon: 'A filling riverside meal.',
        burnt_salmon: 'Charcoal pretending to be dinner.',
        raw_tuna: 'Heavier than it looks.',
        cooked_tuna: 'Dense, hot, and hearty.',
        burnt_tuna: 'A cautionary tale in black.',
        raw_swordfish: 'Still looks dangerous.',
        cooked_swordfish: 'A proper meal for adventurers.',
        burnt_swordfish: 'Even the gulls might refuse it.',

        copper_ore: 'A common ore with humble potential.',
        tin_ore: 'Soft metal ore for early alloys.',
        iron_ore: 'Sturdy ore for sturdier gear.',
        coal: 'The black fuel of industry.',
        mithril_ore: 'A bright ore with serious value.',
        silver_ore: 'Precious and slightly dull-looking.',
        gold_ore: 'Soft, shiny, and expensive.',
        adamant_ore: 'Tough ore with a greenish gleam.',
        rune_ore: 'Rare ore of legendary equipment.',
        rune_essence: 'Pure magical material.',
        ember_rune: 'A rune warm to the touch.',
        water_rune: 'A rune with a calm pulse.',
        earth_rune: 'A rune heavy with stability.',
        air_rune: 'A rune that feels weightless.',
        steam_rune: 'Hot mist bound in stone.',
        smoke_rune: 'A rune that smells faintly burnt.',
        lava_rune: 'Molten power in a hard shell.',
        mud_rune: 'Dirt and water, magically arranged.',
        mist_rune: 'A cool haze trapped in rune form.',
        dust_rune: 'A dry rune that sheds fine grit.',

        small_pouch: 'A tiny pouch for extra essence.',
        medium_pouch: 'Carries more essence than it looks.',
        large_pouch: 'Bulky, but worth the space.',
        hammer: 'Essential for making metal behave.',
        ring_mould: 'Shapes bars into something wearable.',
        amulet_mould: 'For necklaces with ambition.',
        tiara_mould: 'Turns bars into headwear.',

        bronze_bar: 'The first step to forged gear.',
        iron_bar: 'A bar with practical purpose.',
        steel_bar: 'A stronger bar for better kit.',
        mithril_bar: 'Refined metal with real quality.',
        silver_bar: 'A precious bar for finer work.',
        gold_bar: 'Valuable metal in tidy form.',
        adamant_bar: 'Heavy bar for high-end smithing.',
        rune_bar: 'Elite metal for elite equipment.',

        silver_ring: 'Simple silver circle.',
        silver_amulet: 'A plain amulet with potential.',
        silver_tiara: 'A modest silver crown.',
        gold_ring: 'A bright ring with status.',
        gold_amulet: 'Heavy gold around the neck.',
        gold_tiara: 'Shiny enough to attract attention.'
    };

    const EXAMINE_TEXT_BY_TARGET = {
        TREE: 'A fully grown tree.',
        STUMP: 'A sad reminder of a tree.',
        ROCK: 'A solid chunk of rock.',
        ROCK_RUNE_ESSENCE: 'Pure essence sleeps inside this rock.',
        FIRE: 'A hot campfire.',
        FURNACE: 'A roaring smithing furnace.',
        ANVIL: 'A solid anvil for forging metal.',
        BANK_BOOTH: 'A safe place for your valuables.',
        ENEMY: 'It looks ready for a fight.',
        SHOP_COUNTER: 'A counter built for haggling.',
        DOOR: 'A sturdy wooden door.',
        GATE: 'A simple wooden gate.',
        DECOR_PROP: 'A useful-looking fixture.',
        WATER: 'The water looks fishable.'
    };

    const EXAMINE_TEXT_BY_ENEMY_NAME = {
        rat: 'A scrappy little pest.',
        'goblin grunt': 'A mean little bruiser looking for trouble.',
        'training dummy': 'Built to take hits and give none worth fearing.'
    };

    const EXAMINE_TEXT_BY_ROCK_ORE_TYPE = {
        clay: 'A soft clay-bearing rock.',
        copper: 'A copper-veined rock.',
        tin: 'A tin-bearing rock.',
        iron: 'A dense iron-bearing rock.',
        coal: 'A coal seam runs through it.',
        silver: 'A silver-bearing rock with a pale sheen.',
        sapphire: 'Sapphire glints in the stone.',
        gold: 'A gold-bearing rock with bright flecks.',
        emerald: 'Emerald traces shimmer in the rock.',
        depleted: 'This rock has been mined out for now.',
        rune_essence: 'Pure essence sleeps inside this rock.'
    };

    const EXAMINE_TEXT_BY_ALTAR_NAME = {
        'ember altar': 'An altar humming with heat.',
        'water altar': 'An altar flowing with power.',
        'earth altar': 'An altar grounded in old magic.',
        'air altar': 'An altar buzzing with light energy.'
    };

    const EXAMINE_TEXT_BY_NPC_NAME = {
        shopkeeper: 'Always ready to make a margin.',
        banker: 'Trusted with everyone\'s junk.',
        'fishing teacher': 'Knows where the fish are hiding.',
        'fishing supplier': 'Stocks gear for patient anglers.',
        'borin ironvein': 'Smells like ore and hard work.',
        'thrain deepforge': 'A smith with very few soft opinions.',
        'elira gemhand': 'Fine metals, finer prices.',
        'rune tutor': 'Patient, precise, and very magical.',
        'combination sage': 'Speaks fluent rune theory.',
        'king roald': 'Looks every bit the ruler.',
        'queen ellamaria': 'Regal, composed, and observant.'
    };

    const SMITHING_TEMPLATE_BY_SUFFIX = {
        sword_blade: 'Half a weapon, full of potential.',
        axe_head: 'Needs a handle and a target.',
        pickaxe_head: 'Almost ready to crack stone.',
        arrowheads: 'Small points, big consequences.',
        boots: 'Metal footwear for heavy steps.',
        helmet: 'Protects the head, not pride.',
        shield: 'Built to stop bad ideas.',
        platelegs: 'Leg armor with serious weight.',
        platebody: 'Chest armor for front-line mistakes.'
    };

    const DEFAULT_ITEM_EXAMINE = 'Looks useful.';
    const DEFAULT_TARGET_EXAMINE = 'Nothing unusual.';
    const SMITHING_TIER_RE = /^(bronze|iron|steel|mithril|adamant|rune)_(sword_blade|axe_head|pickaxe_head|arrowheads|boots|helmet|shield|platelegs|platebody)$/;

    function oneLine(text, fallback) {
        const out = String(text || '').replace(/\s+/g, ' ').trim();
        return out || fallback;
    }

    function cleanName(name) {
        return String(name || '').replace(/\s+\(\d+\)\s*$/, '').trim();
    }

    function formatEnemyLabel(name, combatLevel) {
        const enemyName = cleanName(name) || 'Enemy';
        const level = Number.isFinite(combatLevel) ? Math.max(1, Math.floor(combatLevel)) : null;
        if (level === null) return enemyName;
        return `Lv ${level} ${enemyName}`;
    }

    function findItemIdByName(name) {
        const targetName = cleanName(name).toLowerCase();
        if (!targetName || !window.ItemCatalog || !window.ItemCatalog.ITEM_DEFS) return null;
        const defs = window.ItemCatalog.ITEM_DEFS;
        const ids = Object.keys(defs);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const def = defs[id];
            if (!def || !def.name) continue;
            if (String(def.name).toLowerCase() === targetName) return id;
        }
        return null;
    }

    function getSmithingTemplate(itemId) {
        const match = String(itemId || '').match(SMITHING_TIER_RE);
        if (!match) return null;
        return SMITHING_TEMPLATE_BY_SUFFIX[match[2]] || null;
    }

    function getItemExamine(itemId, itemName) {
        const id = String(itemId || '').trim();
        if (id && EXAMINE_TEXT_BY_ITEM_ID[id]) return EXAMINE_TEXT_BY_ITEM_ID[id];
        if (id) {
            const generated = getSmithingTemplate(id);
            if (generated) return generated;
        }
        const resolvedId = findItemIdByName(itemName);
        if (resolvedId && EXAMINE_TEXT_BY_ITEM_ID[resolvedId]) return EXAMINE_TEXT_BY_ITEM_ID[resolvedId];
        if (resolvedId) {
            const generatedByName = getSmithingTemplate(resolvedId);
            if (generatedByName) return generatedByName;
        }
        return DEFAULT_ITEM_EXAMINE;
    }

    function getNpcExamine(npcName) {
        const key = cleanName(npcName).toLowerCase();
        if (key && EXAMINE_TEXT_BY_NPC_NAME[key]) return EXAMINE_TEXT_BY_NPC_NAME[key];
        return DEFAULT_TARGET_EXAMINE;
    }

    function getEnemyExamine(options = {}) {
        const enemyName = cleanName(options.name) || 'Enemy';
        const enemyKey = enemyName.toLowerCase();
        const enemyLevel = Number.isFinite(options.combatLevel) ? Math.max(1, Math.floor(options.combatLevel)) : null;
        const enemyLabel = formatEnemyLabel(enemyName, enemyLevel);
        const enemyFlavor = enemyKey && EXAMINE_TEXT_BY_ENEMY_NAME[enemyKey]
            ? EXAMINE_TEXT_BY_ENEMY_NAME[enemyKey]
            : null;

        if (enemyFlavor) return `${enemyLabel}. ${enemyFlavor}`;
        return `${enemyLabel} looks ready for a fight.`;
    }

    function getDecorPropExamine(options = {}) {
        const kind = String(options.kind || '').toLowerCase();
        const label = cleanName(options.label || options.name) || 'fixture';
        if (kind === 'desk') return 'A tutor desk covered with lesson notes.';
        if (kind === 'crate') return 'A crate of starter supplies for new arrivals.';
        if (kind === 'tool_rack') return 'A wall rack holding simple tools and practice gear.';
        if (kind === 'notice_board') return 'A board showing the first steps through Tutorial Island.';
        if (kind === 'chopping_block') return 'A chopping block scarred by practice swings.';
        if (kind === 'woodpile') return 'A neat pile of logs ready for the next lesson.';
        return `A ${label}.`;
    }

    function getTargetExamine(targetType, options = {}) {
        const type = String(targetType || '').toUpperCase();
        if (type === 'NPC') return getNpcExamine(options.name);
        if (type === 'ALTAR_CANDIDATE') {
            const altarKey = cleanName(options.name).toLowerCase();
            if (altarKey && EXAMINE_TEXT_BY_ALTAR_NAME[altarKey]) return EXAMINE_TEXT_BY_ALTAR_NAME[altarKey];
            return 'An elemental altar humming with energy.';
        }
        if (type === 'ENEMY') {
            return getEnemyExamine(options);
        }
        if (type === 'DECOR_PROP') {
            return getDecorPropExamine(options);
        }
        if (type === 'ROCK') {
            const oreKey = String(options.oreType || '').toLowerCase();
            if (oreKey && EXAMINE_TEXT_BY_ROCK_ORE_TYPE[oreKey]) return EXAMINE_TEXT_BY_ROCK_ORE_TYPE[oreKey];
            if (options.oreType === 'rune_essence') return EXAMINE_TEXT_BY_TARGET.ROCK_RUNE_ESSENCE;
        }
        if (type && EXAMINE_TEXT_BY_TARGET[type]) return EXAMINE_TEXT_BY_TARGET[type];
        return DEFAULT_TARGET_EXAMINE;
    }

    function dispatchExamineText(text, addChatMessageFn) {
        const line = oneLine(text, DEFAULT_TARGET_EXAMINE);
        if (typeof addChatMessageFn === 'function') {
            addChatMessageFn(line, 'game');
            return line;
        }
        if (typeof addChatMessage === 'function') {
            addChatMessage(line, 'game');
            return line;
        }
        console.log('EXAMINING: ' + line);
        return line;
    }

    function examineItem(itemId, itemName, addChatMessageFn) {
        return dispatchExamineText(getItemExamine(itemId, itemName), addChatMessageFn);
    }

    function examineTarget(targetType, options = {}, addChatMessageFn) {
        return dispatchExamineText(getTargetExamine(targetType, options), addChatMessageFn);
    }

    function examineNpc(npcName, addChatMessageFn) {
        return dispatchExamineText(getNpcExamine(npcName), addChatMessageFn);
    }

    window.ExamineCatalog = {
        EXAMINE_TEXT_BY_ITEM_ID,
        EXAMINE_TEXT_BY_TARGET,
        EXAMINE_TEXT_BY_NPC_NAME,
        DEFAULT_ITEM_EXAMINE,
        DEFAULT_TARGET_EXAMINE,
        getItemExamine,
        getTargetExamine,
        getDecorPropExamine,
        getNpcExamine,
        dispatchExamineText,
        examineItem,
        examineTarget,
        examineNpc
    };
})();

