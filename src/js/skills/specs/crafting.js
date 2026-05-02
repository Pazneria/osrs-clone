(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.crafting = {
            skillId: 'crafting',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                output: 'fixed_per_action',
                interval: 'recipe_action_ticks'
            },
            timing: {
                actionTicks: 3
            },
            recipeSet: (function () {
                const recipes = {};
                const tierDefs = [
                    { tierId: 'bronze', requiredLevel: 1, strappedHandleItemId: 'wooden_handle_strapped', assemblyXp: 4 },
                    { tierId: 'iron', requiredLevel: 1, strappedHandleItemId: 'wooden_handle_strapped', assemblyXp: 5 },
                    { tierId: 'steel', requiredLevel: 10, strappedHandleItemId: 'oak_handle_strapped', assemblyXp: 8 },
                    { tierId: 'mithril', requiredLevel: 20, strappedHandleItemId: 'willow_handle_strapped', assemblyXp: 14 },
                    { tierId: 'adamant', requiredLevel: 30, strappedHandleItemId: 'maple_handle_strapped', assemblyXp: 22 },
                    { tierId: 'rune', requiredLevel: 40, strappedHandleItemId: 'yew_handle_strapped', assemblyXp: 32 }
                ];
                const assemblyDefs = [
                    { outputSuffix: 'sword', componentSuffix: 'sword_blade' },
                    { outputSuffix: 'axe', componentSuffix: 'axe_head' },
                    { outputSuffix: 'pickaxe', componentSuffix: 'pickaxe_head' }
                ];

                const strappedHandleDefs = [
                    { recipeId: 'craft_wooden_handle_strapped', outputItemId: 'wooden_handle_strapped', requiredLevel: 1, handleItemId: 'wooden_handle', leatherItemId: 'normal_leather', xp: 2 },
                    { recipeId: 'craft_oak_handle_strapped', outputItemId: 'oak_handle_strapped', requiredLevel: 10, handleItemId: 'oak_handle', leatherItemId: 'normal_leather', xp: 4 },
                    { recipeId: 'craft_willow_handle_strapped', outputItemId: 'willow_handle_strapped', requiredLevel: 20, handleItemId: 'willow_handle', leatherItemId: 'wolf_leather', xp: 8 },
                    { recipeId: 'craft_maple_handle_strapped', outputItemId: 'maple_handle_strapped', requiredLevel: 30, handleItemId: 'maple_handle', leatherItemId: 'wolf_leather', xp: 12 },
                    { recipeId: 'craft_yew_handle_strapped', outputItemId: 'yew_handle_strapped', requiredLevel: 40, handleItemId: 'yew_handle', leatherItemId: 'bear_leather', xp: 18 }
                ];
                const gemCutDefs = [
                    { recipeId: 'cut_ruby', requiredLevel: 10, inputItemId: 'uncut_ruby', outputItemId: 'cut_ruby', xp: 4 },
                    { recipeId: 'cut_sapphire', requiredLevel: 20, inputItemId: 'uncut_sapphire', outputItemId: 'cut_sapphire', xp: 8 },
                    { recipeId: 'cut_emerald', requiredLevel: 30, inputItemId: 'uncut_emerald', outputItemId: 'cut_emerald', xp: 14 },
                    { recipeId: 'cut_diamond', requiredLevel: 40, inputItemId: 'uncut_diamond', outputItemId: 'cut_diamond', xp: 22 }
                ];
                const staffAttachDefs = [
                    { recipeId: 'craft_fire_staff', requiredLevel: 10, staffItemId: 'plain_staff_oak', gemItemId: 'cut_ruby', outputItemId: 'fire_staff', xp: 4 },
                    { recipeId: 'craft_water_staff', requiredLevel: 20, staffItemId: 'plain_staff_willow', gemItemId: 'cut_sapphire', outputItemId: 'water_staff', xp: 8 },
                    { recipeId: 'craft_earth_staff', requiredLevel: 30, staffItemId: 'plain_staff_maple', gemItemId: 'cut_emerald', outputItemId: 'earth_staff', xp: 14 },
                    { recipeId: 'craft_air_staff', requiredLevel: 40, staffItemId: 'plain_staff_yew', gemItemId: 'cut_diamond', outputItemId: 'air_staff', xp: 22 }
                ];
                const jewelryAttachDefs = [
                    { recipeId: 'craft_ruby_silver_ring', requiredLevel: 10, baseItemId: 'silver_ring', gemItemId: 'cut_ruby', outputItemId: 'ruby_silver_ring', xp: 4, mouldUnlockFlag: 'ringMouldUnlocked' },
                    { recipeId: 'craft_ruby_silver_amulet', requiredLevel: 10, baseItemId: 'silver_amulet', gemItemId: 'cut_ruby', outputItemId: 'ruby_silver_amulet', xp: 4, mouldUnlockFlag: 'amuletMouldUnlocked' },
                    { recipeId: 'craft_ruby_silver_tiara', requiredLevel: 10, baseItemId: 'silver_tiara', gemItemId: 'cut_ruby', outputItemId: 'ruby_silver_tiara', xp: 4, mouldUnlockFlag: 'tiaraMouldUnlocked' },
                    { recipeId: 'craft_sapphire_silver_ring', requiredLevel: 20, baseItemId: 'silver_ring', gemItemId: 'cut_sapphire', outputItemId: 'sapphire_silver_ring', xp: 8, mouldUnlockFlag: 'ringMouldUnlocked' },
                    { recipeId: 'craft_sapphire_silver_amulet', requiredLevel: 20, baseItemId: 'silver_amulet', gemItemId: 'cut_sapphire', outputItemId: 'sapphire_silver_amulet', xp: 8, mouldUnlockFlag: 'amuletMouldUnlocked' },
                    { recipeId: 'craft_sapphire_silver_tiara', requiredLevel: 20, baseItemId: 'silver_tiara', gemItemId: 'cut_sapphire', outputItemId: 'sapphire_silver_tiara', xp: 8, mouldUnlockFlag: 'tiaraMouldUnlocked' },
                    { recipeId: 'craft_ruby_gold_ring', requiredLevel: 40, baseItemId: 'gold_ring', gemItemId: 'cut_ruby', outputItemId: 'ruby_gold_ring', xp: 4, mouldUnlockFlag: 'ringMouldUnlocked' },
                    { recipeId: 'craft_ruby_gold_amulet', requiredLevel: 40, baseItemId: 'gold_amulet', gemItemId: 'cut_ruby', outputItemId: 'ruby_gold_amulet', xp: 4, mouldUnlockFlag: 'amuletMouldUnlocked' },
                    { recipeId: 'craft_ruby_gold_tiara', requiredLevel: 40, baseItemId: 'gold_tiara', gemItemId: 'cut_ruby', outputItemId: 'ruby_gold_tiara', xp: 4, mouldUnlockFlag: 'tiaraMouldUnlocked' },
                    { recipeId: 'craft_sapphire_gold_ring', requiredLevel: 40, baseItemId: 'gold_ring', gemItemId: 'cut_sapphire', outputItemId: 'sapphire_gold_ring', xp: 8, mouldUnlockFlag: 'ringMouldUnlocked' },
                    { recipeId: 'craft_sapphire_gold_amulet', requiredLevel: 40, baseItemId: 'gold_amulet', gemItemId: 'cut_sapphire', outputItemId: 'sapphire_gold_amulet', xp: 8, mouldUnlockFlag: 'amuletMouldUnlocked' },
                    { recipeId: 'craft_sapphire_gold_tiara', requiredLevel: 40, baseItemId: 'gold_tiara', gemItemId: 'cut_sapphire', outputItemId: 'sapphire_gold_tiara', xp: 8, mouldUnlockFlag: 'tiaraMouldUnlocked' },
                    { recipeId: 'craft_emerald_gold_ring', requiredLevel: 40, baseItemId: 'gold_ring', gemItemId: 'cut_emerald', outputItemId: 'emerald_gold_ring', xp: 14, mouldUnlockFlag: 'ringMouldUnlocked' },
                    { recipeId: 'craft_emerald_gold_amulet', requiredLevel: 40, baseItemId: 'gold_amulet', gemItemId: 'cut_emerald', outputItemId: 'emerald_gold_amulet', xp: 14, mouldUnlockFlag: 'amuletMouldUnlocked' },
                    { recipeId: 'craft_emerald_gold_tiara', requiredLevel: 40, baseItemId: 'gold_tiara', gemItemId: 'cut_emerald', outputItemId: 'emerald_gold_tiara', xp: 14, mouldUnlockFlag: 'tiaraMouldUnlocked' },
                    { recipeId: 'craft_diamond_gold_ring', requiredLevel: 40, baseItemId: 'gold_ring', gemItemId: 'cut_diamond', outputItemId: 'diamond_gold_ring', xp: 22, mouldUnlockFlag: 'ringMouldUnlocked' },
                    { recipeId: 'craft_diamond_gold_amulet', requiredLevel: 40, baseItemId: 'gold_amulet', gemItemId: 'cut_diamond', outputItemId: 'diamond_gold_amulet', xp: 22, mouldUnlockFlag: 'amuletMouldUnlocked' },
                    { recipeId: 'craft_diamond_gold_tiara', requiredLevel: 40, baseItemId: 'gold_tiara', gemItemId: 'cut_diamond', outputItemId: 'diamond_gold_tiara', xp: 22, mouldUnlockFlag: 'tiaraMouldUnlocked' }
                ];
                const mouldImprintDefs = [
                    { recipeId: 'imprint_ring_mould', borrowedItemId: 'borrowed_ring', outputItemId: 'imprinted_ring_mould', finalItemId: 'ring_mould' },
                    { recipeId: 'imprint_amulet_mould', borrowedItemId: 'borrowed_amulet', outputItemId: 'imprinted_amulet_mould', finalItemId: 'amulet_mould' },
                    { recipeId: 'imprint_tiara_mould', borrowedItemId: 'borrowed_tiara', outputItemId: 'imprinted_tiara_mould', finalItemId: 'tiara_mould' }
                ];

                for (let i = 0; i < strappedHandleDefs.length; i++) {
                    const def = strappedHandleDefs[i];
                    recipes[def.recipeId] = {
                        recipeFamily: 'strapped_handle',
                        requiredLevel: def.requiredLevel,
                        inputs: [
                            { itemId: def.handleItemId, amount: 1 },
                            { itemId: def.leatherItemId, amount: 1 }
                        ],
                        output: { itemId: def.outputItemId, amount: 1 },
                        xpPerAction: def.xp,
                        actionTicks: 1,
                        stationType: 'INVENTORY'
                    };
                }

                for (let i = 0; i < tierDefs.length; i++) {
                    const tier = tierDefs[i];
                    for (let j = 0; j < assemblyDefs.length; j++) {
                        const assembly = assemblyDefs[j];
                        recipes[`assemble_${tier.tierId}_${assembly.outputSuffix}`] = {
                            recipeFamily: 'tool_weapon_assembly',
                            requiredLevel: tier.requiredLevel,
                            inputs: [
                                { itemId: `${tier.tierId}_${assembly.componentSuffix}`, amount: 1 },
                                { itemId: tier.strappedHandleItemId, amount: 1 }
                            ],
                            output: { itemId: `${tier.tierId}_${assembly.outputSuffix}`, amount: 1 },
                            xpPerAction: tier.assemblyXp,
                            actionTicks: 1,
                            stationType: 'INVENTORY'
                        };
                    }
                }

                for (let i = 0; i < gemCutDefs.length; i++) {
                    const def = gemCutDefs[i];
                    recipes[def.recipeId] = {
                        recipeFamily: 'gem_cutting',
                        requiredLevel: def.requiredLevel,
                        inputs: [{ itemId: def.inputItemId, amount: 1 }],
                        output: { itemId: def.outputItemId, amount: 1 },
                        xpPerAction: def.xp,
                        actionTicks: 3,
                        requiredToolIds: ['chisel'],
                        stationType: 'INVENTORY'
                    };
                }

                recipes.craft_soft_clay = {
                    recipeFamily: 'soft_clay',
                    requiredLevel: 1,
                    inputs: [{ itemId: 'clay', amount: 1 }],
                    output: { itemId: 'soft_clay', amount: 1 },
                    xpPerAction: 1,
                    actionTicks: 1,
                    stationType: 'WATER'
                };

                for (let i = 0; i < mouldImprintDefs.length; i++) {
                    const def = mouldImprintDefs[i];
                    recipes[def.recipeId] = {
                        recipeFamily: 'mould_imprint',
                        requiredLevel: 1,
                        inputs: [
                            { itemId: 'soft_clay', amount: 1 },
                            { itemId: def.borrowedItemId, amount: 1, consume: false }
                        ],
                        output: { itemId: def.outputItemId, amount: 1 },
                        xpPerAction: 1,
                        actionTicks: 1,
                        stationType: 'INVENTORY'
                    };
                    recipes['fire_' + def.outputItemId] = {
                        recipeFamily: 'mould_firing',
                        requiredLevel: 1,
                        inputs: [{ itemId: def.outputItemId, amount: 1 }],
                        output: { itemId: def.finalItemId, amount: 1 },
                        xpPerAction: 3,
                        actionTicks: 3,
                        stationType: 'FIRE'
                    };
                }

                for (let i = 0; i < staffAttachDefs.length; i++) {
                    const def = staffAttachDefs[i];
                    recipes[def.recipeId] = {
                        recipeFamily: 'staff_attachment',
                        requiredLevel: def.requiredLevel,
                        inputs: [
                            { itemId: def.staffItemId, amount: 1 },
                            { itemId: def.gemItemId, amount: 1 }
                        ],
                        output: { itemId: def.outputItemId, amount: 1 },
                        xpPerAction: def.xp,
                        actionTicks: 3,
                        stationType: 'INVENTORY'
                    };
                }

                for (let i = 0; i < jewelryAttachDefs.length; i++) {
                    const def = jewelryAttachDefs[i];
                    recipes[def.recipeId] = {
                        recipeFamily: 'jewelry_gem_attachment',
                        requiredLevel: def.requiredLevel,
                        inputs: [
                            { itemId: def.baseItemId, amount: 1 },
                            { itemId: def.gemItemId, amount: 1 }
                        ],
                        output: { itemId: def.outputItemId, amount: 1 },
                        xpPerAction: def.xp,
                        actionTicks: 3,
                        requiredUnlockFlag: def.mouldUnlockFlag,
                        stationType: 'INVENTORY'
                    };
                }

                return recipes;
            })(),
            economy: {
                primaryResource: 'normal_leather',
                valueTable: {
                    chisel: { buy: 4, sell: 1 },
                    needle: { buy: 4, sell: 1 },
                    thread: { buy: 2, sell: 1 },
                    soft_clay: { buy: null, sell: 1 },
                    ring_mould: { buy: null, sell: null },
                    amulet_mould: { buy: null, sell: null },
                    tiara_mould: { buy: null, sell: null },
                    silver_ore: { buy: 45, sell: 18 },
                    gold_ore: { buy: 70, sell: 28 },
                    uncut_ruby: { buy: 20, sell: 6 },
                    cut_ruby: { buy: 40, sell: 12 },
                    uncut_sapphire: { buy: 50, sell: 16 },
                    cut_sapphire: { buy: 100, sell: 32 },
                    uncut_emerald: { buy: 90, sell: 30 },
                    cut_emerald: { buy: 180, sell: 60 },
                    uncut_diamond: { buy: 150, sell: 50 },
                    cut_diamond: { buy: 300, sell: 100 },
                    plain_staff_wood: { buy: null, sell: 6 },
                    plain_staff_oak: { buy: null, sell: 12 },
                    plain_staff_willow: { buy: null, sell: 20 },
                    plain_staff_maple: { buy: null, sell: 32 },
                    plain_staff_yew: { buy: null, sell: 50 },
                    fire_staff: { buy: null, sell: 24 },
                    water_staff: { buy: null, sell: 52 },
                    earth_staff: { buy: null, sell: 92 },
                    air_staff: { buy: null, sell: 150 },
                    silver_ring: { buy: null, sell: 20 },
                    silver_amulet: { buy: null, sell: 20 },
                    silver_tiara: { buy: null, sell: 20 },
                    gold_ring: { buy: null, sell: 32 },
                    gold_amulet: { buy: null, sell: 32 },
                    gold_tiara: { buy: null, sell: 32 },
                    ruby_silver_ring: { buy: null, sell: 32 },
                    ruby_silver_amulet: { buy: null, sell: 32 },
                    ruby_silver_tiara: { buy: null, sell: 32 },
                    sapphire_silver_ring: { buy: null, sell: 52 },
                    sapphire_silver_amulet: { buy: null, sell: 52 },
                    sapphire_silver_tiara: { buy: null, sell: 52 },
                    ruby_gold_ring: { buy: null, sell: 44 },
                    ruby_gold_amulet: { buy: null, sell: 44 },
                    ruby_gold_tiara: { buy: null, sell: 44 },
                    sapphire_gold_ring: { buy: null, sell: 64 },
                    sapphire_gold_amulet: { buy: null, sell: 64 },
                    sapphire_gold_tiara: { buy: null, sell: 64 },
                    emerald_gold_ring: { buy: null, sell: 92 },
                    emerald_gold_amulet: { buy: null, sell: 92 },
                    emerald_gold_tiara: { buy: null, sell: 92 },
                    diamond_gold_ring: { buy: null, sell: 132 },
                    diamond_gold_amulet: { buy: null, sell: 132 },
                    diamond_gold_tiara: { buy: null, sell: 132 },
                    normal_leather: { buy: 8, sell: 2 },
                    wolf_leather: { buy: 24, sell: 8 },
                    bear_leather: { buy: 60, sell: 20 },
                    wooden_handle: { buy: null, sell: 6 },
                    oak_handle: { buy: null, sell: 12 },
                    willow_handle: { buy: null, sell: 20 },
                    maple_handle: { buy: null, sell: 32 },
                    yew_handle: { buy: null, sell: 50 },
                    wooden_handle_strapped: { buy: 30, sell: 10 },
                    oak_handle_strapped: { buy: 50, sell: 16 },
                    willow_handle_strapped: { buy: 100, sell: 32 },
                    maple_handle_strapped: { buy: 150, sell: 44 },
                    yew_handle_strapped: { buy: 280, sell: 76 },
                    bronze_sword: { buy: 40, sell: 10 },
                    iron_sword: { buy: 120, sell: 35 },
                    steel_sword: { buy: 350, sell: 110 },
                    mithril_sword: { buy: 900, sell: 300 },
                    adamant_sword: { buy: 2200, sell: 750 },
                    rune_sword: { buy: null, sell: 2500 },
                    bronze_axe: { buy: 40, sell: 10 },
                    iron_axe: { buy: 120, sell: 35 },
                    steel_axe: { buy: 350, sell: 110 },
                    mithril_axe: { buy: 900, sell: 300 },
                    adamant_axe: { buy: 2200, sell: 750 },
                    rune_axe: { buy: null, sell: 2500 },
                    bronze_pickaxe: { buy: 40, sell: 10 },
                    iron_pickaxe: { buy: 120, sell: 35 },
                    steel_pickaxe: { buy: 350, sell: 110 },
                    mithril_pickaxe: { buy: 900, sell: 300 },
                    adamant_pickaxe: { buy: 2200, sell: 750 },
                    rune_pickaxe: { buy: null, sell: 2500 }
                },
                merchantTable: {
                    crafting_teacher: {
                        strictBuys: true,
                        buys: ['chisel', 'needle', 'thread'],
                        sells: ['chisel', 'needle', 'thread']
                    },
                    tanner_rusk: {
                        strictBuys: true,
                        buys: [
                            'normal_leather', 'wolf_leather', 'bear_leather',
                            'wooden_handle_strapped', 'oak_handle_strapped', 'willow_handle_strapped', 'maple_handle_strapped', 'yew_handle_strapped',
                            'wooden_handle', 'oak_handle', 'willow_handle', 'maple_handle', 'yew_handle',
                            'bronze_sword', 'iron_sword', 'steel_sword', 'mithril_sword', 'adamant_sword', 'rune_sword',
                            'bronze_axe', 'iron_axe', 'steel_axe', 'mithril_axe', 'adamant_axe', 'rune_axe',
                            'bronze_pickaxe', 'iron_pickaxe', 'steel_pickaxe', 'mithril_pickaxe', 'adamant_pickaxe', 'rune_pickaxe'
                        ],
                        sells: ['normal_leather', 'wolf_leather', 'bear_leather']
                    },
                    elira_gemhand: {
                        strictBuys: true,
                        buys: [
                            'silver_ore', 'gold_ore',
                            'uncut_ruby', 'cut_ruby',
                            'uncut_sapphire', 'cut_sapphire',
                            'uncut_emerald', 'cut_emerald',
                            'uncut_diamond', 'cut_diamond',
                            'silver_ring', 'silver_amulet', 'silver_tiara',
                            'gold_ring', 'gold_amulet', 'gold_tiara',
                            'ruby_silver_ring', 'ruby_silver_amulet', 'ruby_silver_tiara',
                            'sapphire_silver_ring', 'sapphire_silver_amulet', 'sapphire_silver_tiara',
                            'ruby_gold_ring', 'ruby_gold_amulet', 'ruby_gold_tiara',
                            'sapphire_gold_ring', 'sapphire_gold_amulet', 'sapphire_gold_tiara',
                            'emerald_gold_ring', 'emerald_gold_amulet', 'emerald_gold_tiara',
                            'diamond_gold_ring', 'diamond_gold_amulet', 'diamond_gold_tiara'
                        ],
                        sells: ['silver_ore', 'gold_ore', 'uncut_ruby', 'uncut_sapphire', 'uncut_emerald', 'uncut_diamond']
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor',
                    defaultStock: [
                        { itemId: 'knife', stockAmount: 10 }
                    ]
                }
            }
        };
})();
