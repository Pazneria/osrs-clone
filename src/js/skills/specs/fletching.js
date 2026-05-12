(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.fletching = {
            skillId: 'fletching',
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
                const woodcuttingXpByLog = {
                    logs: 25,
                    oak_logs: 38,
                    willow_logs: 68,
                    maple_logs: 100,
                    yew_logs: 150
                };
                const xpMultipliers = {
                    handle: 0.24,
                    staff: 0.24,
                    shafts: 0.16,
                    headless: 0.16,
                    longbowUnstrung: 0.2,
                    shortbowUnstrung: 0.26,
                    longbow: 0.12,
                    shortbow: 0.16,
                    finishedBronze: 0.08,
                    finishedIron: 0.12,
                    finishedSteel: 0.14,
                    finishedMithril: 0.14,
                    finishedAdamant: 0.15,
                    finishedRune: 0.15
                };
                function scaledXp(logItemId, multiplier) {
                    const base = Number.isFinite(woodcuttingXpByLog[logItemId]) ? woodcuttingXpByLog[logItemId] : 25;
                    const mult = Number.isFinite(multiplier) ? multiplier : 0.1;
                    return Math.max(1, Math.round(base * mult));
                }
                function levelCapForBand(baseLevel) {
                    if (baseLevel < 10) return 8;
                    if (baseLevel < 20) return 18;
                    if (baseLevel < 30) return 28;
                    if (baseLevel < 40) return 38;
                    return 48;
                }
                function leveled(baseLevel, offset) {
                    const base = Number.isFinite(baseLevel) ? Math.max(1, Math.floor(baseLevel)) : 1;
                    const adj = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
                    return Math.min(levelCapForBand(base), base + adj);
                }

                const logTierDefs = [
                    {
                        tierId: 'wooden',
                        logItemId: 'logs',
                        handleItemId: 'wooden_handle',
                        staffItemId: 'plain_staff_wood',
                        shaftsItemId: 'wooden_shafts',
                        shortbowUnstrungItemId: 'normal_shortbow_u',
                        longbowUnstrungItemId: 'normal_longbow_u',
                        shortbowItemId: 'normal_shortbow',
                        longbowItemId: 'normal_longbow',
                        baseLevel: 1
                    },
                    {
                        tierId: 'oak',
                        logItemId: 'oak_logs',
                        handleItemId: 'oak_handle',
                        staffItemId: 'plain_staff_oak',
                        shaftsItemId: 'oak_shafts',
                        shortbowUnstrungItemId: 'oak_shortbow_u',
                        longbowUnstrungItemId: 'oak_longbow_u',
                        shortbowItemId: 'oak_shortbow',
                        longbowItemId: 'oak_longbow',
                        baseLevel: 10
                    },
                    {
                        tierId: 'willow',
                        logItemId: 'willow_logs',
                        handleItemId: 'willow_handle',
                        staffItemId: 'plain_staff_willow',
                        shaftsItemId: 'willow_shafts',
                        shortbowUnstrungItemId: 'willow_shortbow_u',
                        longbowUnstrungItemId: 'willow_longbow_u',
                        shortbowItemId: 'willow_shortbow',
                        longbowItemId: 'willow_longbow',
                        baseLevel: 20
                    },
                    {
                        tierId: 'maple',
                        logItemId: 'maple_logs',
                        handleItemId: 'maple_handle',
                        staffItemId: 'plain_staff_maple',
                        shaftsItemId: 'maple_shafts',
                        shortbowUnstrungItemId: 'maple_shortbow_u',
                        longbowUnstrungItemId: 'maple_longbow_u',
                        shortbowItemId: 'maple_shortbow',
                        longbowItemId: 'maple_longbow',
                        baseLevel: 30
                    },
                    {
                        tierId: 'yew',
                        logItemId: 'yew_logs',
                        handleItemId: 'yew_handle',
                        staffItemId: 'plain_staff_yew',
                        shaftsItemId: 'yew_shafts',
                        shortbowUnstrungItemId: 'yew_shortbow_u',
                        longbowUnstrungItemId: 'yew_longbow_u',
                        shortbowItemId: 'yew_shortbow',
                        longbowItemId: 'yew_longbow',
                        baseLevel: 40
                    }
                ];

                for (let i = 0; i < logTierDefs.length; i++) {
                    const def = logTierDefs[i];

                    recipes[`fletch_${def.handleItemId}`] = {
                        recipeFamily: 'handle',
                        requiredLevel: leveled(def.baseLevel, 0),
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.handleItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.handle),
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.staffItemId}`] = {
                        recipeFamily: 'staff',
                        requiredLevel: leveled(def.baseLevel, 1),
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.staffItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.staff),
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.shaftsItemId}`] = {
                        recipeFamily: 'shafts',
                        requiredLevel: leveled(def.baseLevel, 1),
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.shaftsItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.shafts),
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.shortbowUnstrungItemId}`] = {
                        recipeFamily: 'bow_unstrung',
                        requiredLevel: leveled(def.baseLevel, 4),
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.shortbowUnstrungItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.shortbowUnstrung),
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.longbowUnstrungItemId}`] = {
                        recipeFamily: 'bow_unstrung',
                        requiredLevel: leveled(def.baseLevel, 2),
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.longbowUnstrungItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.longbowUnstrung),
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.shortbowItemId}`] = {
                        recipeFamily: 'bow_strung',
                        requiredLevel: def.tierId === 'wooden' ? def.baseLevel : leveled(def.baseLevel, 4),
                        inputs: [
                            { itemId: def.shortbowUnstrungItemId, amount: 1 },
                            { itemId: 'bow_string', amount: 1 }
                        ],
                        output: { itemId: def.shortbowItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.shortbow),
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.longbowItemId}`] = {
                        recipeFamily: 'bow_strung',
                        requiredLevel: leveled(def.baseLevel, 2),
                        inputs: [
                            { itemId: def.longbowUnstrungItemId, amount: 1 },
                            { itemId: 'bow_string', amount: 1 }
                        ],
                        output: { itemId: def.longbowItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.longbow),
                        actionTicks: 3
                    };
                }

                const arrowTierDefs = [
                    { tierId: 'wooden', logItemId: 'logs', shaftsItemId: 'wooden_shafts', headlessItemId: 'wooden_headless_arrows', baseLevel: 1 },
                    { tierId: 'oak', logItemId: 'oak_logs', shaftsItemId: 'oak_shafts', headlessItemId: 'oak_headless_arrows', baseLevel: 10 },
                    { tierId: 'willow', logItemId: 'willow_logs', shaftsItemId: 'willow_shafts', headlessItemId: 'willow_headless_arrows', baseLevel: 20 },
                    { tierId: 'maple', logItemId: 'maple_logs', shaftsItemId: 'maple_shafts', headlessItemId: 'maple_headless_arrows', baseLevel: 30 },
                    { tierId: 'yew', logItemId: 'yew_logs', shaftsItemId: 'yew_shafts', headlessItemId: 'yew_headless_arrows', baseLevel: 40 }
                ];

                for (let i = 0; i < arrowTierDefs.length; i++) {
                    const def = arrowTierDefs[i];
                    recipes[`fletch_${def.headlessItemId}`] = {
                        recipeFamily: 'headless_arrows',
                        requiredLevel: leveled(def.baseLevel, 2),
                        inputs: [
                            { itemId: def.shaftsItemId, amount: 1 },
                            { itemId: 'feathers_bundle', amount: 1 }
                        ],
                        output: { itemId: def.headlessItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, xpMultipliers.headless),
                        actionTicks: 3
                    };
                }

                const finishedArrowDefs = [
                    { arrowItemId: 'bronze_arrows', logItemId: 'logs', headlessItemId: 'wooden_headless_arrows', arrowheadsItemId: 'bronze_arrowheads', baseLevel: 1, levelOffset: 0, xpMultiplier: xpMultipliers.finishedBronze },
                    { arrowItemId: 'iron_arrows', logItemId: 'logs', headlessItemId: 'wooden_headless_arrows', arrowheadsItemId: 'iron_arrowheads', baseLevel: 1, levelOffset: 4, xpMultiplier: xpMultipliers.finishedIron },
                    { arrowItemId: 'steel_arrows', logItemId: 'oak_logs', headlessItemId: 'oak_headless_arrows', arrowheadsItemId: 'steel_arrowheads', baseLevel: 10, levelOffset: 2, xpMultiplier: xpMultipliers.finishedSteel },
                    { arrowItemId: 'mithril_arrows', logItemId: 'willow_logs', headlessItemId: 'willow_headless_arrows', arrowheadsItemId: 'mithril_arrowheads', baseLevel: 20, levelOffset: 3, xpMultiplier: xpMultipliers.finishedMithril },
                    { arrowItemId: 'adamant_arrows', logItemId: 'maple_logs', headlessItemId: 'maple_headless_arrows', arrowheadsItemId: 'adamant_arrowheads', baseLevel: 30, levelOffset: 4, xpMultiplier: xpMultipliers.finishedAdamant },
                    { arrowItemId: 'rune_arrows', logItemId: 'yew_logs', headlessItemId: 'yew_headless_arrows', arrowheadsItemId: 'rune_arrowheads', baseLevel: 40, levelOffset: 5, xpMultiplier: xpMultipliers.finishedRune }
                ];

                for (let i = 0; i < finishedArrowDefs.length; i++) {
                    const def = finishedArrowDefs[i];
                    recipes[`fletch_${def.arrowItemId}`] = {
                        recipeFamily: 'finished_arrows',
                        requiredLevel: leveled(def.baseLevel, def.levelOffset),
                        inputs: [
                            { itemId: def.arrowheadsItemId, amount: 1 },
                            { itemId: def.headlessItemId, amount: 1 }
                        ],
                        output: { itemId: def.arrowItemId, amount: 1 },
                        xpPerAction: scaledXp(def.logItemId, def.xpMultiplier),
                        actionTicks: 3
                    };
                }

                return recipes;
            })(),
            economy: {
                primaryResource: 'wooden_handle',
                valueTable: {
                    knife: { buy: 8, sell: 2 },
                    feathers_bundle: { buy: 8, sell: 2 },
                    bow_string: { buy: 12, sell: 3 },
                    wooden_handle: { buy: null, sell: 6 },
                    oak_handle: { buy: null, sell: 12 },
                    willow_handle: { buy: null, sell: 20 },
                    maple_handle: { buy: null, sell: 32 },
                    yew_handle: { buy: null, sell: 50 },
                    plain_staff_wood: { buy: null, sell: 6 },
                    plain_staff_oak: { buy: null, sell: 12 },
                    plain_staff_willow: { buy: null, sell: 20 },
                    plain_staff_maple: { buy: null, sell: 32 },
                    plain_staff_yew: { buy: null, sell: 50 },
                    wooden_shafts: { buy: null, sell: 4 },
                    oak_shafts: { buy: null, sell: 6 },
                    willow_shafts: { buy: null, sell: 10 },
                    maple_shafts: { buy: null, sell: 16 },
                    yew_shafts: { buy: null, sell: 24 },
                    wooden_headless_arrows: { buy: null, sell: 6 },
                    oak_headless_arrows: { buy: null, sell: 10 },
                    willow_headless_arrows: { buy: null, sell: 16 },
                    maple_headless_arrows: { buy: null, sell: 24 },
                    yew_headless_arrows: { buy: null, sell: 36 },
                    bronze_arrows: { buy: null, sell: 8 },
                    iron_arrows: { buy: null, sell: 12 },
                    steel_arrows: { buy: null, sell: 20 },
                    mithril_arrows: { buy: null, sell: 32 },
                    adamant_arrows: { buy: null, sell: 50 },
                    rune_arrows: { buy: null, sell: 80 },
                    normal_shortbow_u: { buy: null, sell: 7 },
                    normal_longbow_u: { buy: null, sell: 6 },
                    oak_shortbow_u: { buy: null, sell: 15 },
                    oak_longbow_u: { buy: null, sell: 14 },
                    willow_shortbow_u: { buy: null, sell: 28 },
                    willow_longbow_u: { buy: null, sell: 26 },
                    maple_shortbow_u: { buy: null, sell: 46 },
                    maple_longbow_u: { buy: null, sell: 44 },
                    yew_shortbow_u: { buy: null, sell: 72 },
                    yew_longbow_u: { buy: null, sell: 70 },
                    normal_shortbow: { buy: null, sell: 12 },
                    normal_longbow: { buy: null, sell: 10 },
                    oak_shortbow: { buy: null, sell: 22 },
                    oak_longbow: { buy: null, sell: 20 },
                    willow_shortbow: { buy: null, sell: 40 },
                    willow_longbow: { buy: null, sell: 36 },
                    maple_shortbow: { buy: null, sell: 68 },
                    maple_longbow: { buy: null, sell: 62 },
                    yew_shortbow: { buy: null, sell: 110 },
                    yew_longbow: { buy: null, sell: 100 }
                },
                merchantTable: {
                    fletching_supplier: {
                        strictBuys: true,
                        buys: ['knife', 'feathers_bundle', 'bow_string'],
                        sells: ['knife', 'feathers_bundle', 'bow_string']
                    },
                    advanced_fletcher: {
                        strictBuys: true,
                        buys: [
                            'wooden_handle', 'oak_handle', 'willow_handle', 'maple_handle', 'yew_handle',
                            'plain_staff_wood', 'plain_staff_oak', 'plain_staff_willow', 'plain_staff_maple', 'plain_staff_yew',
                            'wooden_shafts', 'oak_shafts', 'willow_shafts', 'maple_shafts', 'yew_shafts',
                            'wooden_headless_arrows', 'oak_headless_arrows', 'willow_headless_arrows', 'maple_headless_arrows', 'yew_headless_arrows',
                            'bronze_arrows', 'iron_arrows', 'steel_arrows', 'mithril_arrows', 'adamant_arrows', 'rune_arrows',
                            'normal_shortbow_u', 'normal_longbow_u',
                            'oak_shortbow_u', 'oak_longbow_u',
                            'willow_shortbow_u', 'willow_longbow_u',
                            'maple_shortbow_u', 'maple_longbow_u',
                            'yew_shortbow_u', 'yew_longbow_u',
                            'normal_shortbow', 'normal_longbow',
                            'oak_shortbow', 'oak_longbow',
                            'willow_shortbow', 'willow_longbow',
                            'maple_shortbow', 'maple_longbow',
                            'yew_shortbow', 'yew_longbow'
                        ],
                        sells: []
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor',
                    defaultStock: [
                        { itemId: 'normal_shortbow', stockAmount: 5 },
                        { itemId: 'bronze_arrows', stockAmount: 150 }
                    ]
                }
            }
        };
})();
