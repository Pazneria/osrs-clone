(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.smithing = {
            skillId: 'smithing',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                output: 'fixed_per_action',
                interval: 'fixed_action_ticks'
            },
            timing: {
                actionTicks: 3
            },
            recipeSet: (function () {
                const recipes = {};
                const smeltDefs = [
                    { tier: 'bronze', level: 1, xp: 6, inputs: [{ itemId: 'copper_ore', amount: 1 }, { itemId: 'tin_ore', amount: 1 }] },
                    { tier: 'iron', level: 1, xp: 8, inputs: [{ itemId: 'iron_ore', amount: 1 }] },
                    { tier: 'steel', level: 10, xp: 12, inputs: [{ itemId: 'iron_ore', amount: 1 }, { itemId: 'coal', amount: 2 }] },
                    { tier: 'mithril', level: 20, xp: 18, inputs: [{ itemId: 'mithril_ore', amount: 1 }, { itemId: 'coal', amount: 4 }] },
                    { tier: 'silver', level: 30, xp: 14, inputs: [{ itemId: 'silver_ore', amount: 1 }] },
                    { tier: 'adamant', level: 30, xp: 24, inputs: [{ itemId: 'adamant_ore', amount: 1 }, { itemId: 'coal', amount: 6 }] },
                    { tier: 'gold', level: 40, xp: 22, inputs: [{ itemId: 'gold_ore', amount: 1 }] },
                    { tier: 'rune', level: 40, xp: 32, inputs: [{ itemId: 'rune_ore', amount: 1 }, { itemId: 'coal', amount: 8 }] }
                ];

                for (let i = 0; i < smeltDefs.length; i++) {
                    const def = smeltDefs[i];
                    recipes[`smelt_${def.tier}_bar`] = {
                        stationType: 'FURNACE',
                        requiredLevel: def.level,
                        inputs: def.inputs,
                        output: { itemId: `${def.tier}_bar`, amount: 1 },
                        xpPerAction: def.xp,
                        actionTicks: 3
                    };
                }

                const forgeTiers = [
                    { tier: 'bronze', level: 1 },
                    { tier: 'iron', level: 1 },
                    { tier: 'steel', level: 10 },
                    { tier: 'mithril', level: 20 },
                    { tier: 'adamant', level: 30 },
                    { tier: 'rune', level: 40 }
                ];

                const forgeDefs = [
                    { outputSuffix: 'sword_blade', bars: 2, levelOffset: 1, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'axe_head', bars: 2, levelOffset: 1, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'pickaxe_head', bars: 2, levelOffset: 1, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'boots', bars: 2, levelOffset: 1, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'helmet', bars: 5, levelOffset: 3, xpByTier: [20, 25, 35, 50, 70, 100] },
                    { outputSuffix: 'shield', bars: 6, levelOffset: 4, xpByTier: [24, 30, 42, 60, 84, 120] },
                    { outputSuffix: 'platelegs', bars: 7, levelOffset: 5, xpByTier: [28, 35, 49, 70, 98, 140] },
                    { outputSuffix: 'platebody', bars: 9, levelOffset: 7, xpByTier: [36, 45, 63, 90, 126, 180] },
                    { outputSuffix: 'arrowheads', bars: 1, levelOffset: 0, xpByTier: [4, 5, 7, 10, 14, 20] }
                ];

                for (let t = 0; t < forgeTiers.length; t++) {
                    const tier = forgeTiers[t];
                    const nextTierUnlock = t + 1 < forgeTiers.length ? forgeTiers[t + 1].level : 50;
                    const levelCap = Math.max(tier.level, nextTierUnlock - 2);
                    for (let f = 0; f < forgeDefs.length; f++) {
                        const def = forgeDefs[f];
                        recipes[`forge_${tier.tier}_${def.outputSuffix}`] = {
                            stationType: 'ANVIL',
                            requiredLevel: Math.min(levelCap, tier.level + (Number.isFinite(def.levelOffset) ? def.levelOffset : 0)),
                            requiredToolIds: ['hammer'],
                            inputs: [{ itemId: `${tier.tier}_bar`, amount: def.bars }],
                            output: { itemId: `${tier.tier}_${def.outputSuffix}`, amount: 1 },
                            xpPerAction: def.xpByTier[t],
                            actionTicks: 3
                        };
                    }
                }

                const jewelryDefs = [
                    { id: 'silver_ring', level: 30, inputBar: 'silver_bar', mould: 'ring_mould', unlockFlag: 'ringMouldUnlocked', xp: 14 },
                    { id: 'silver_tiara', level: 32, inputBar: 'silver_bar', mould: 'tiara_mould', unlockFlag: 'tiaraMouldUnlocked', xp: 14 },
                    { id: 'silver_amulet', level: 34, inputBar: 'silver_bar', mould: 'amulet_mould', unlockFlag: 'amuletMouldUnlocked', xp: 14 },
                    { id: 'gold_ring', level: 40, inputBar: 'gold_bar', mould: 'ring_mould', unlockFlag: 'ringMouldUnlocked', xp: 22 },
                    { id: 'gold_tiara', level: 42, inputBar: 'gold_bar', mould: 'tiara_mould', unlockFlag: 'tiaraMouldUnlocked', xp: 22 },
                    { id: 'gold_amulet', level: 44, inputBar: 'gold_bar', mould: 'amulet_mould', unlockFlag: 'amuletMouldUnlocked', xp: 22 }
                ];

                for (let i = 0; i < jewelryDefs.length; i++) {
                    const def = jewelryDefs[i];
                    recipes[`forge_${def.id}`] = {
                        stationType: 'FURNACE',
                        requiredLevel: def.level,
                        requiredMouldIds: [def.mould],
                        requiredUnlockFlag: def.unlockFlag,
                        inputs: [{ itemId: def.inputBar, amount: 1 }],
                        output: { itemId: def.id, amount: 1 },
                        xpPerAction: def.xp,
                        actionTicks: 3
                    };
                }

                return recipes;
            })(),
            economy: {
                primaryResource: 'bronze_bar',
                valueTable: {
                    hammer: { buy: 8, sell: 2 },
                    bronze_pickaxe: { buy: 40, sell: 10 },
                    iron_pickaxe: { buy: 120, sell: 35 },
                    steel_pickaxe: { buy: 350, sell: 110 },
                    mithril_pickaxe: { buy: 900, sell: 300 },
                    adamant_pickaxe: { buy: 2200, sell: 750 },
                    rune_pickaxe: { buy: null, sell: 2500 },
                    copper_ore: { buy: 8, sell: 3 },
                    tin_ore: { buy: 8, sell: 3 },
                    iron_ore: { buy: 18, sell: 7 },
                    coal: { buy: 30, sell: 12 },
                    mithril_ore: { buy: 120, sell: 60 },
                    silver_ore: { buy: 45, sell: 18 },
                    uncut_sapphire: { buy: 50, sell: 16 },
                    gold_ore: { buy: 70, sell: 28 },
                    uncut_emerald: { buy: 90, sell: 30 },
                    adamant_ore: { buy: 300, sell: 150 },
                    uncut_ruby: { buy: 20, sell: 6 },
                    rune_ore: { buy: 1200, sell: 600 },
                    uncut_diamond: { buy: 150, sell: 50 },
                    bronze_bar: { buy: null, sell: 8 },
                    iron_bar: { buy: null, sell: 16 },
                    steel_bar: { buy: null, sell: 32 },
                    mithril_bar: { buy: null, sell: 64 },
                    silver_bar: { buy: null, sell: 45 },
                    adamant_bar: { buy: null, sell: 128 },
                    gold_bar: { buy: null, sell: 70 },
                    rune_bar: { buy: null, sell: 256 },
                    ring_mould: { buy: null, sell: null },
                    amulet_mould: { buy: null, sell: null },
                    tiara_mould: { buy: null, sell: null }
                },
                merchantTable: {
                    borin_ironvein: {
                        strictBuys: true,
                        buys: ['hammer', 'copper_ore', 'tin_ore', 'iron_ore', 'coal', 'mithril_ore'],
                        sells: ['hammer', 'copper_ore', 'tin_ore', 'iron_ore', 'coal', 'mithril_ore']
                    },
                    thrain_deepforge: {
                        strictBuys: true,
                        buys: ['adamant_ore', 'rune_ore'],
                        sells: ['adamant_ore', 'rune_ore']
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor',
                    defaultStock: [
                        { itemId: 'iron_pickaxe', stockAmount: 5 }
                    ]
                }
            }
        };
})();
