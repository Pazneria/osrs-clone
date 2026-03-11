(function () {
    const SPEC_VERSION = '2026.03.m3';

    const SKILL_SPECS = {
        woodcutting: {
            skillId: 'woodcutting',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                success: 'level_plus_tool_over_plus_difficulty',
                interval: 'max(min_ticks, base_ticks - speed_bonus)'
            },
            timing: {
                baseAttemptTicks: 4,
                minimumAttemptTicks: 1
            },
            nodeTable: {
                normal_tree: {
                    tileId: 1,
                    requiredLevel: 1,
                    difficulty: 18,
                    xpPerSuccess: 25,
                    rewardItemId: 'logs',
                    depletionChance: 0.2,
                    respawnTicks: 18
                }
            },
            economy: {
                primaryResource: 'logs',
                defaultSellValue: 5
            }
        },
        fishing: {
            skillId: 'fishing',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                success: 'water_base_plus_scaling_clamped',
                selection: 'weighted_fish_table'
            },
            timing: {
                baseAttemptTicks: 3,
                minimumAttemptTicks: 1
            },
            nodeTable: {
                shallow_water: {
                    tileIds: [21],
                    unlockLevel: 1,
                    maxCatchChance: 0.62,
                    baseCatchChance: 0.28,
                    levelScaling: 0.008,
                    methods: {
                        net: {
                            methodId: 'net',
                            toolIds: ['small_net'],
                            priority: 10,
                            unlockLevel: 1,
                            fishByLevel: [
                                {
                                    minLevel: 1,
                                    fish: [
                                        { itemId: 'raw_shrimp', requiredLevel: 1, weight: 100, xp: 20 }
                                    ]
                                }
                            ]
                        },
                        rod: {
                            methodId: 'rod',
                            toolIds: ['fishing_rod'],
                            priority: 20,
                            unlockLevel: 10,
                            extraRequirement: {
                                itemId: 'bait',
                                consumeOn: 'success',
                                amount: 1
                            },
                            fishByLevel: [
                                {
                                    minLevel: 10,
                                    maxLevel: 19,
                                    fish: [
                                        { itemId: 'raw_trout', requiredLevel: 10, weight: 100, xp: 50 }
                                    ]
                                },
                                {
                                    minLevel: 20,
                                    maxLevel: 29,
                                    fish: [
                                        { itemId: 'raw_trout', requiredLevel: 10, weight: 75, xp: 50 },
                                        { itemId: 'raw_salmon', requiredLevel: 20, weight: 25, xp: 70 }
                                    ]
                                },
                                {
                                    minLevel: 30,
                                    fish: [
                                        { itemId: 'raw_trout', requiredLevel: 10, weight: 60, xp: 50 },
                                        { itemId: 'raw_salmon', requiredLevel: 20, weight: 40, xp: 70 }
                                    ]
                                }
                            ]
                        },
                        harpoon: {
                            methodId: 'harpoon',
                            toolIds: ['harpoon', 'rune_harpoon'],
                            priority: 30,
                            unlockLevel: 30,
                            fishByLevel: [
                                {
                                    minLevel: 30,
                                    fish: [
                                        { itemId: 'raw_tuna', requiredLevel: 30, weight: 100, xp: 80 }
                                    ]
                                }
                            ]
                        }
                    }
                },
                deep_water: {
                    tileIds: [22],
                    unlockLevel: 40,
                    maxCatchChance: 0.62,
                    baseCatchChance: 0.28,
                    levelScaling: 0.008,
                    methods: {
                        deep_harpoon_mixed: {
                            methodId: 'deep_harpoon_mixed',
                            toolIds: ['harpoon'],
                            priority: 40,
                            unlockLevel: 40,
                            fishByLevel: [
                                {
                                    minLevel: 40,
                                    fish: [
                                        { itemId: 'raw_tuna', requiredLevel: 30, weight: 70, xp: 80 },
                                        { itemId: 'raw_swordfish', requiredLevel: 40, weight: 30, xp: 100 }
                                    ]
                                }
                            ]
                        },
                        deep_rune_harpoon: {
                            methodId: 'deep_rune_harpoon',
                            toolIds: ['rune_harpoon'],
                            priority: 50,
                            unlockLevel: 40,
                            fishByLevel: [
                                {
                                    minLevel: 40,
                                    fish: [
                                        { itemId: 'raw_swordfish', requiredLevel: 40, weight: 100, xp: 100 }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            economy: {
                primaryResource: 'raw_shrimp',
                valueTable: {
                    small_net: { buy: 25, sell: 10 },
                    fishing_rod: { buy: 45, sell: 18 },
                    harpoon: { buy: 110, sell: 44 },
                    rune_harpoon: { buy: 2500, sell: 1000 },
                    bait: { buy: 2, sell: 1 },
                    raw_shrimp: { buy: 3, sell: 1 },
                    raw_trout: { buy: 18, sell: 7 },
                    raw_salmon: { buy: 24, sell: 9 },
                    raw_tuna: { buy: 28, sell: 11 },
                    raw_swordfish: { buy: 40, sell: 16 }
                },
                merchantTable: {
                    fishing_supplier: {
                        buys: ['small_net', 'fishing_rod', 'harpoon', 'bait', 'raw_shrimp', 'raw_trout', 'raw_salmon', 'raw_tuna', 'raw_swordfish'],
                        sells: ['small_net', 'fishing_rod', 'harpoon', 'bait'],
                        unlocks: {
                            itemIds: ['raw_shrimp', 'raw_trout', 'raw_salmon', 'raw_tuna', 'raw_swordfish'],
                            threshold: 50,
                            stockAmount: 20
                        }
                    },
                    fishing_teacher: {
                        buys: ['small_net', 'fishing_rod', 'harpoon', 'rune_harpoon'],
                        sells: []
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor'
                }
            }
        },
        firemaking: {
            skillId: 'firemaking',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                success: 'level_over_level_plus_ignition_difficulty'
            },
            timing: {
                ignitionAttemptTicks: 1,
                postSuccessLockTicks: 3
            },
            recipeSet: {
                logs: {
                    sourceItemId: 'logs',
                    requiredLevel: 1,
                    ignitionDifficulty: 15,
                    xpPerSuccess: 40,
                    fireLifetimeTicks: 90
                }
            },
            economy: {
                primaryResource: 'logs',
                supportResource: 'tinderbox',
                valueTable: {
                    logs: { buy: 6, sell: 2 },
                    tinderbox: { buy: 8, sell: 2 },
                    ashes: { buy: 4, sell: 1 }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor'
                }
            }
        },
        cooking: {
            skillId: 'cooking',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                success: 'level_over_level_plus_burn_difficulty',
                burn: 'one_minus_success'
            },
            timing: {
                actionTicks: 1
            },
            recipeSet: {
                raw_shrimp: {
                    sourceItemId: 'raw_shrimp',
                    cookedItemId: 'cooked_shrimp',
                    burntItemId: 'burnt_shrimp',
                    requiredLevel: 1,
                    burnDifficulty: 9,
                    xpPerSuccess: 30,
                    sourceTarget: 'FIRE'
                },
                raw_trout: {
                    sourceItemId: 'raw_trout',
                    cookedItemId: 'cooked_trout',
                    burntItemId: 'burnt_trout',
                    requiredLevel: 10,
                    burnDifficulty: 24,
                    xpPerSuccess: 70,
                    sourceTarget: 'FIRE'
                },
                raw_salmon: {
                    sourceItemId: 'raw_salmon',
                    cookedItemId: 'cooked_salmon',
                    burntItemId: 'burnt_salmon',
                    requiredLevel: 20,
                    burnDifficulty: 48,
                    xpPerSuccess: 90,
                    sourceTarget: 'FIRE'
                },
                raw_tuna: {
                    sourceItemId: 'raw_tuna',
                    cookedItemId: 'cooked_tuna',
                    burntItemId: 'burnt_tuna',
                    requiredLevel: 30,
                    burnDifficulty: 84,
                    xpPerSuccess: 120,
                    sourceTarget: 'FIRE'
                },
                raw_swordfish: {
                    sourceItemId: 'raw_swordfish',
                    cookedItemId: 'cooked_swordfish',
                    burntItemId: 'burnt_swordfish',
                    requiredLevel: 40,
                    burnDifficulty: 144,
                    xpPerSuccess: 140,
                    sourceTarget: 'FIRE'
                }
            },
            economy: {
                primaryResource: 'raw_shrimp',
                cookedResource: 'cooked_shrimp',
                burntResource: 'burnt_shrimp'
            }
        },
        mining: {
            skillId: 'mining',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                success: 'level_plus_tool_over_plus_difficulty',
                interval: 'max(min_ticks, base_ticks - speed_bonus)'
            },
            timing: {
                baseAttemptTicks: 6,
                minimumAttemptTicks: 1
            },
            nodeTable: {
                clay_rock: { tileId: 2, oreType: 'clay', requiredLevel: 1, difficulty: 6, xpPerSuccess: 8, rewardItemId: 'clay', depletionChance: 1.0, respawnTicks: 5 },
                copper_rock: { tileId: 2, oreType: 'copper', requiredLevel: 1, difficulty: 8, xpPerSuccess: 10, rewardItemId: 'copper_ore', depletionChance: 1.0, respawnTicks: 6 },
                tin_rock: { tileId: 2, oreType: 'tin', requiredLevel: 1, difficulty: 8, xpPerSuccess: 10, rewardItemId: 'tin_ore', depletionChance: 1.0, respawnTicks: 6 },
                rune_essence: { tileId: 2, oreType: 'rune_essence', requiredLevel: 1, difficulty: 6, xpPerSuccess: 2, rewardItemId: 'rune_essence', persistent: true },
                iron_rock: { tileId: 2, oreType: 'iron', requiredLevel: 10, difficulty: 16, xpPerSuccess: 18, rewardItemId: 'iron_ore', depletionChance: 0.5, respawnTicks: 9 },
                coal_rock: { tileId: 2, oreType: 'coal', requiredLevel: 20, difficulty: 26, xpPerSuccess: 28, rewardItemId: 'coal', depletionChance: 0.35, respawnTicks: 12 },
                silver_rock: { tileId: 2, oreType: 'silver', requiredLevel: 30, difficulty: 36, xpPerSuccess: 40, rewardItemId: 'silver_ore', depletionChance: 0.3, respawnTicks: 15 },
                sapphire_rock: { tileId: 2, oreType: 'sapphire', requiredLevel: 30, difficulty: 42, xpPerSuccess: 52, rewardItemId: 'uncut_sapphire', depletionChance: 0.35, respawnTicks: 36 },
                gold_rock: { tileId: 2, oreType: 'gold', requiredLevel: 40, difficulty: 50, xpPerSuccess: 60, rewardItemId: 'gold_ore', depletionChance: 0.25, respawnTicks: 21 },
                emerald_rock: { tileId: 2, oreType: 'emerald', requiredLevel: 40, difficulty: 56, xpPerSuccess: 72, rewardItemId: 'uncut_emerald', depletionChance: 0.3, respawnTicks: 48 }
            },
            economy: { primaryResource: 'copper_ore' }
        },
        runecrafting: {
            skillId: 'runecrafting',
            formulas: {
                outputPerEssence: '1 + floor((level - scalingStartLevel) / 10), minimum 1'
            },
            timing: {
                actionTicks: 1
            },
            recipeSet: {
                ember_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 1, essenceItemId: 'rune_essence', outputItemId: 'ember_rune', xpPerEssence: 8, scalingStartLevel: 0, requiresSecondaryRune: false },
                water_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 10, essenceItemId: 'rune_essence', outputItemId: 'water_rune', xpPerEssence: 7, scalingStartLevel: 10, requiresSecondaryRune: false },
                earth_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 20, essenceItemId: 'rune_essence', outputItemId: 'earth_rune', xpPerEssence: 9, scalingStartLevel: 20, requiresSecondaryRune: false },
                air_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 30, essenceItemId: 'rune_essence', outputItemId: 'air_rune', xpPerEssence: 12, scalingStartLevel: 30, requiresSecondaryRune: false },
                steam_combo_from_ember: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'steam_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'water_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                steam_combo_from_water: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'steam_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'ember_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                smoke_combo_from_ember: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'smoke_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'air_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                smoke_combo_from_air: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'smoke_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'ember_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                lava_combo_from_ember: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'lava_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'earth_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                lava_combo_from_earth: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'lava_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'ember_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mud_combo_from_water: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mud_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'earth_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mud_combo_from_earth: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mud_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'water_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mist_combo_from_water: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mist_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'air_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mist_combo_from_air: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mist_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'water_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                dust_combo_from_earth: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'dust_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'air_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                dust_combo_from_air: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'dust_rune', xpPerEssence: 16, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'earth_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' }
            },
            pouchTable: { small_pouch: { requiredLevel: 10, capacity: 6 }, medium_pouch: { requiredLevel: 20, capacity: 13 }, large_pouch: { requiredLevel: 30, capacity: 26 } },
            economy: {
                primaryResource: 'ember_rune',
                valueTable: {
                    rune_essence: { buy: 12, sell: 4 },
                    ember_rune: { buy: 10, sell: 4 },
                    water_rune: { buy: 20, sell: 8 },
                    earth_rune: { buy: 40, sell: 16 },
                    air_rune: { buy: 80, sell: 32 },
                    steam_rune: { buy: 160, sell: 64 },
                    smoke_rune: { buy: 160, sell: 64 },
                    lava_rune: { buy: 160, sell: 64 },
                    mud_rune: { buy: 160, sell: 64 },
                    mist_rune: { buy: 160, sell: 64 },
                    dust_rune: { buy: 160, sell: 64 },
                    small_pouch: { buy: 500, sell: 200 },
                    medium_pouch: { buy: 2000, sell: 800 },
                    large_pouch: { buy: 8000, sell: 3200 }
                },
                merchantTable: {
                    rune_tutor: {
                        buys: ['rune_essence', 'ember_rune', 'water_rune', 'earth_rune', 'air_rune'],
                        sells: ['rune_essence', 'ember_rune', 'water_rune', 'earth_rune', 'air_rune']
                    },
                    combination_sage: {
                        buys: ['rune_essence', 'steam_rune', 'smoke_rune', 'lava_rune', 'mud_rune', 'mist_rune', 'dust_rune', 'small_pouch', 'medium_pouch', 'large_pouch'],
                        sells: ['rune_essence', 'steam_rune', 'smoke_rune', 'lava_rune', 'mud_rune', 'mist_rune', 'dust_rune', 'small_pouch', 'medium_pouch', 'large_pouch'],
                        pouchUnlocks: { small_pouch: 10, medium_pouch: 20, large_pouch: 30 }
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor'
                }
            }        },
        smithing: {
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
                    { outputSuffix: 'sword_blade', bars: 2, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'axe_head', bars: 2, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'pickaxe_head', bars: 2, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'boots', bars: 2, xpByTier: [8, 10, 14, 20, 28, 40] },
                    { outputSuffix: 'helmet', bars: 5, xpByTier: [20, 25, 35, 50, 70, 100] },
                    { outputSuffix: 'shield', bars: 6, xpByTier: [24, 30, 42, 60, 84, 120] },
                    { outputSuffix: 'platelegs', bars: 7, xpByTier: [28, 35, 49, 70, 98, 140] },
                    { outputSuffix: 'platebody', bars: 9, xpByTier: [36, 45, 63, 90, 126, 180] },
                    { outputSuffix: 'arrowheads', bars: 1, xpByTier: [4, 5, 7, 10, 14, 20] }
                ];

                for (let t = 0; t < forgeTiers.length; t++) {
                    const tier = forgeTiers[t];
                    for (let f = 0; f < forgeDefs.length; f++) {
                        const def = forgeDefs[f];
                        recipes[`forge_${tier.tier}_${def.outputSuffix}`] = {
                            stationType: 'ANVIL',
                            requiredLevel: tier.level,
                            requiredToolIds: ['hammer'],
                            inputs: [{ itemId: `${tier.tier}_bar`, amount: def.bars }],
                            output: { itemId: `${tier.tier}_${def.outputSuffix}`, amount: 1 },
                            xpPerAction: def.xpByTier[t],
                            actionTicks: 3
                        };
                    }
                }

                const jewelryDefs = [
                    { id: 'silver_ring', level: 10, inputBar: 'silver_bar', mould: 'ring_mould', xp: 14 },
                    { id: 'silver_tiara', level: 10, inputBar: 'silver_bar', mould: 'tiara_mould', xp: 14 },
                    { id: 'silver_amulet', level: 10, inputBar: 'silver_bar', mould: 'amulet_mould', xp: 14 },
                    { id: 'gold_ring', level: 40, inputBar: 'gold_bar', mould: 'ring_mould', xp: 22 },
                    { id: 'gold_tiara', level: 40, inputBar: 'gold_bar', mould: 'tiara_mould', xp: 22 },
                    { id: 'gold_amulet', level: 40, inputBar: 'gold_bar', mould: 'amulet_mould', xp: 22 }
                ];

                for (let i = 0; i < jewelryDefs.length; i++) {
                    const def = jewelryDefs[i];
                    recipes[`forge_${def.id}`] = {
                        stationType: 'FURNACE',
                        requiredLevel: def.level,
                        requiredMouldIds: [def.mould],
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
                    copper_ore: { buy: 8, sell: 3 },
                    tin_ore: { buy: 8, sell: 3 },
                    iron_ore: { buy: 18, sell: 7 },
                    coal: { buy: 30, sell: 12 },
                    mithril_ore: { buy: 120, sell: 48 },
                    silver_ore: { buy: 45, sell: 18 },
                    adamant_ore: { buy: 300, sell: 120 },
                    gold_ore: { buy: 70, sell: 28 },
                    rune_ore: { buy: 1200, sell: 480 },
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
                        buys: ['hammer', 'copper_ore', 'tin_ore', 'iron_ore', 'coal', 'mithril_ore', 'bronze_bar', 'iron_bar', 'steel_bar', 'mithril_bar'],
                        sells: ['hammer', 'copper_ore', 'tin_ore', 'iron_ore', 'coal', 'mithril_ore']
                    },
                    thrain_deepforge: {
                        strictBuys: true,
                        buys: ['adamant_ore', 'rune_ore', 'adamant_bar', 'rune_bar'],
                        sells: ['adamant_ore', 'rune_ore']
                    },
                    elira_gemhand: {
                        strictBuys: true,
                        buys: ['silver_ore', 'gold_ore', 'silver_bar', 'gold_bar', 'silver_ring', 'silver_amulet', 'silver_tiara', 'gold_ring', 'gold_amulet', 'gold_tiara'],
                        sells: ['silver_ore', 'gold_ore']
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor'
                }
            }
        }
    };

    window.SkillSpecs = {
        version: SPEC_VERSION,
        skills: SKILL_SPECS
    };
})();


