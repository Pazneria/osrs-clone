(function () {
    const SPEC_VERSION = '2026.03.m5';

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
                },
                oak_tree: {
                    tileId: 1,
                    requiredLevel: 10,
                    difficulty: 28,
                    xpPerSuccess: 38,
                    rewardItemId: 'oak_logs',
                    depletionChance: 0.22,
                    respawnTicks: 24
                },
                willow_tree: {
                    tileId: 1,
                    requiredLevel: 20,
                    difficulty: 38,
                    xpPerSuccess: 68,
                    rewardItemId: 'willow_logs',
                    depletionChance: 0.24,
                    respawnTicks: 32
                },
                maple_tree: {
                    tileId: 1,
                    requiredLevel: 30,
                    difficulty: 50,
                    xpPerSuccess: 100,
                    rewardItemId: 'maple_logs',
                    depletionChance: 0.27,
                    respawnTicks: 44
                },
                yew_tree: {
                    tileId: 1,
                    requiredLevel: 40,
                    difficulty: 64,
                    xpPerSuccess: 150,
                    rewardItemId: 'yew_logs',
                    depletionChance: 0.3,
                    respawnTicks: 60
                }
            },
            economy: {
                primaryResource: 'logs',
                valueTable: {
                    logs: { buy: 6, sell: 2 },
                    oak_logs: { buy: 16, sell: 6 },
                    willow_logs: { buy: 36, sell: 14 },
                    maple_logs: { buy: 80, sell: 32 },
                    yew_logs: { buy: 180, sell: 72 },
                    bronze_axe: { buy: 40, sell: 10 },
                    iron_axe: { buy: 120, sell: 35 },
                    steel_axe: { buy: 350, sell: 110 },
                    mithril_axe: { buy: 900, sell: 300 },
                    adamant_axe: { buy: 2200, sell: 750 },
                    rune_axe: { buy: null, sell: 2500 }
                },
                merchantTable: {
                    forester_teacher: {
                        strictBuys: true,
                        buys: ['bronze_axe', 'iron_axe', 'steel_axe', 'logs', 'oak_logs'],
                        sells: ['bronze_axe', 'iron_axe', 'steel_axe', 'logs', 'oak_logs']
                    },
                    advanced_woodsman: {
                        strictBuys: true,
                        buys: ['mithril_axe', 'adamant_axe', 'rune_axe', 'willow_logs', 'maple_logs', 'yew_logs'],
                        sells: ['mithril_axe', 'adamant_axe', 'willow_logs', 'maple_logs', 'yew_logs']
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor'
                }
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
            }
        },
        crafting: {
            skillId: 'crafting',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                output: 'fixed_per_action',
                interval: 'immediate_item_on_item'
            },
            timing: {
                actionTicks: 1
            },
            recipeSet: (function () {
                const recipes = {};
                const tierDefs = [
                    { tierId: 'bronze', requiredLevel: 1, handleItemId: 'wooden_handle', xp: 4 },
                    { tierId: 'iron', requiredLevel: 1, handleItemId: 'wooden_handle', xp: 5 },
                    { tierId: 'steel', requiredLevel: 10, handleItemId: 'oak_handle', xp: 8 },
                    { tierId: 'mithril', requiredLevel: 20, handleItemId: 'willow_handle', xp: 14 },
                    { tierId: 'adamant', requiredLevel: 30, handleItemId: 'maple_handle', xp: 22 },
                    { tierId: 'rune', requiredLevel: 40, handleItemId: 'yew_handle', xp: 32 }
                ];
                const assemblyDefs = [
                    { outputSuffix: 'sword', componentSuffix: 'sword_blade' },
                    { outputSuffix: 'axe', componentSuffix: 'axe_head' },
                    { outputSuffix: 'pickaxe', componentSuffix: 'pickaxe_head' }
                ];

                for (let i = 0; i < tierDefs.length; i++) {
                    const tier = tierDefs[i];
                    for (let j = 0; j < assemblyDefs.length; j++) {
                        const assembly = assemblyDefs[j];
                        recipes[`assemble_${tier.tierId}_${assembly.outputSuffix}`] = {
                            recipeFamily: 'tool_weapon_assembly',
                            requiredLevel: tier.requiredLevel,
                            inputs: [
                                { itemId: `${tier.tierId}_${assembly.componentSuffix}`, amount: 1 },
                                { itemId: tier.handleItemId, amount: 1 }
                            ],
                            output: { itemId: `${tier.tierId}_${assembly.outputSuffix}`, amount: 1 },
                            xpPerAction: tier.xp,
                            actionTicks: 1
                        };
                    }
                }

                return recipes;
            })()
        },
        fletching: {
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

                const logTierDefs = [
                    {
                        tierId: 'wooden',
                        logItemId: 'logs',
                        handleItemId: 'wooden_handle',
                        handleLevel: 1,
                        handleXp: 6,
                        staffItemId: 'plain_staff_wood',
                        staffLevel: 1,
                        staffXp: 6,
                        shaftsItemId: 'wooden_shafts',
                        shaftsLevel: 1,
                        shaftsXp: 4,
                        shortbowUnstrungItemId: 'normal_shortbow_u',
                        shortbowUnstrungLevel: 5,
                        shortbowUnstrungXp: 5,
                        longbowUnstrungItemId: 'normal_longbow_u',
                        longbowUnstrungLevel: 1,
                        longbowUnstrungXp: 5,
                        shortbowItemId: 'normal_shortbow',
                        shortbowLevel: 5,
                        shortbowXp: 3,
                        longbowItemId: 'normal_longbow',
                        longbowLevel: 1,
                        longbowXp: 3
                    },
                    {
                        tierId: 'oak',
                        logItemId: 'oak_logs',
                        handleItemId: 'oak_handle',
                        handleLevel: 10,
                        handleXp: 10,
                        staffItemId: 'plain_staff_oak',
                        staffLevel: 10,
                        staffXp: 12,
                        shaftsItemId: 'oak_shafts',
                        shaftsLevel: 10,
                        shaftsXp: 6,
                        shortbowUnstrungItemId: 'oak_shortbow_u',
                        shortbowUnstrungLevel: 15,
                        shortbowUnstrungXp: 9,
                        longbowUnstrungItemId: 'oak_longbow_u',
                        longbowUnstrungLevel: 10,
                        longbowUnstrungXp: 9,
                        shortbowItemId: 'oak_shortbow',
                        shortbowLevel: 15,
                        shortbowXp: 5,
                        longbowItemId: 'oak_longbow',
                        longbowLevel: 10,
                        longbowXp: 5
                    },
                    {
                        tierId: 'willow',
                        logItemId: 'willow_logs',
                        handleItemId: 'willow_handle',
                        handleLevel: 20,
                        handleXp: 14,
                        staffItemId: 'plain_staff_willow',
                        staffLevel: 20,
                        staffXp: 18,
                        shaftsItemId: 'willow_shafts',
                        shaftsLevel: 20,
                        shaftsXp: 9,
                        shortbowUnstrungItemId: 'willow_shortbow_u',
                        shortbowUnstrungLevel: 25,
                        shortbowUnstrungXp: 14,
                        longbowUnstrungItemId: 'willow_longbow_u',
                        longbowUnstrungLevel: 20,
                        longbowUnstrungXp: 14,
                        shortbowItemId: 'willow_shortbow',
                        shortbowLevel: 25,
                        shortbowXp: 8,
                        longbowItemId: 'willow_longbow',
                        longbowLevel: 20,
                        longbowXp: 8
                    },
                    {
                        tierId: 'maple',
                        logItemId: 'maple_logs',
                        handleItemId: 'maple_handle',
                        handleLevel: 30,
                        handleXp: 20,
                        staffItemId: 'plain_staff_maple',
                        staffLevel: 30,
                        staffXp: 26,
                        shaftsItemId: 'maple_shafts',
                        shaftsLevel: 30,
                        shaftsXp: 13,
                        shortbowUnstrungItemId: 'maple_shortbow_u',
                        shortbowUnstrungLevel: 35,
                        shortbowUnstrungXp: 20,
                        longbowUnstrungItemId: 'maple_longbow_u',
                        longbowUnstrungLevel: 30,
                        longbowUnstrungXp: 20,
                        shortbowItemId: 'maple_shortbow',
                        shortbowLevel: 35,
                        shortbowXp: 12,
                        longbowItemId: 'maple_longbow',
                        longbowLevel: 30,
                        longbowXp: 12
                    },
                    {
                        tierId: 'yew',
                        logItemId: 'yew_logs',
                        handleItemId: 'yew_handle',
                        handleLevel: 40,
                        handleXp: 28,
                        staffItemId: 'plain_staff_yew',
                        staffLevel: 40,
                        staffXp: 36,
                        shaftsItemId: 'yew_shafts',
                        shaftsLevel: 40,
                        shaftsXp: 18,
                        shortbowUnstrungItemId: 'yew_shortbow_u',
                        shortbowUnstrungLevel: 45,
                        shortbowUnstrungXp: 28,
                        longbowUnstrungItemId: 'yew_longbow_u',
                        longbowUnstrungLevel: 40,
                        longbowUnstrungXp: 28,
                        shortbowItemId: 'yew_shortbow',
                        shortbowLevel: 45,
                        shortbowXp: 18,
                        longbowItemId: 'yew_longbow',
                        longbowLevel: 40,
                        longbowXp: 18
                    }
                ];

                for (let i = 0; i < logTierDefs.length; i++) {
                    const def = logTierDefs[i];

                    recipes[`fletch_${def.handleItemId}`] = {
                        recipeFamily: 'handle',
                        requiredLevel: def.handleLevel,
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.handleItemId, amount: 1 },
                        xpPerAction: def.handleXp,
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.staffItemId}`] = {
                        recipeFamily: 'staff',
                        requiredLevel: def.staffLevel,
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.staffItemId, amount: 1 },
                        xpPerAction: def.staffXp,
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.shaftsItemId}`] = {
                        recipeFamily: 'shafts',
                        requiredLevel: def.shaftsLevel,
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.shaftsItemId, amount: 1 },
                        xpPerAction: def.shaftsXp,
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.shortbowUnstrungItemId}`] = {
                        recipeFamily: 'bow_unstrung',
                        requiredLevel: def.shortbowUnstrungLevel,
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.shortbowUnstrungItemId, amount: 1 },
                        xpPerAction: def.shortbowUnstrungXp,
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.longbowUnstrungItemId}`] = {
                        recipeFamily: 'bow_unstrung',
                        requiredLevel: def.longbowUnstrungLevel,
                        requiredToolIds: ['knife'],
                        sourceLogItemId: def.logItemId,
                        inputs: [{ itemId: def.logItemId, amount: 1 }],
                        output: { itemId: def.longbowUnstrungItemId, amount: 1 },
                        xpPerAction: def.longbowUnstrungXp,
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.shortbowItemId}`] = {
                        recipeFamily: 'bow_strung',
                        requiredLevel: def.shortbowLevel,
                        inputs: [
                            { itemId: def.shortbowUnstrungItemId, amount: 1 },
                            { itemId: 'bow_string', amount: 1 }
                        ],
                        output: { itemId: def.shortbowItemId, amount: 1 },
                        xpPerAction: def.shortbowXp,
                        actionTicks: 3
                    };

                    recipes[`fletch_${def.longbowItemId}`] = {
                        recipeFamily: 'bow_strung',
                        requiredLevel: def.longbowLevel,
                        inputs: [
                            { itemId: def.longbowUnstrungItemId, amount: 1 },
                            { itemId: 'bow_string', amount: 1 }
                        ],
                        output: { itemId: def.longbowItemId, amount: 1 },
                        xpPerAction: def.longbowXp,
                        actionTicks: 3
                    };
                }

                const arrowTierDefs = [
                    { tierId: 'wooden', shaftsItemId: 'wooden_shafts', headlessItemId: 'wooden_headless_arrows', requiredLevel: 1, headlessXp: 4 },
                    { tierId: 'oak', shaftsItemId: 'oak_shafts', headlessItemId: 'oak_headless_arrows', requiredLevel: 10, headlessXp: 6 },
                    { tierId: 'willow', shaftsItemId: 'willow_shafts', headlessItemId: 'willow_headless_arrows', requiredLevel: 20, headlessXp: 9 },
                    { tierId: 'maple', shaftsItemId: 'maple_shafts', headlessItemId: 'maple_headless_arrows', requiredLevel: 30, headlessXp: 13 },
                    { tierId: 'yew', shaftsItemId: 'yew_shafts', headlessItemId: 'yew_headless_arrows', requiredLevel: 40, headlessXp: 18 }
                ];

                for (let i = 0; i < arrowTierDefs.length; i++) {
                    const def = arrowTierDefs[i];
                    recipes[`fletch_${def.headlessItemId}`] = {
                        recipeFamily: 'headless_arrows',
                        requiredLevel: def.requiredLevel,
                        inputs: [
                            { itemId: def.shaftsItemId, amount: 1 },
                            { itemId: 'feathers_bundle', amount: 1 }
                        ],
                        output: { itemId: def.headlessItemId, amount: 1 },
                        xpPerAction: def.headlessXp,
                        actionTicks: 3
                    };
                }

                const finishedArrowDefs = [
                    { arrowItemId: 'bronze_arrows', headlessItemId: 'wooden_headless_arrows', arrowheadsItemId: 'bronze_arrowheads', requiredLevel: 1, xp: 2 },
                    { arrowItemId: 'iron_arrows', headlessItemId: 'wooden_headless_arrows', arrowheadsItemId: 'iron_arrowheads', requiredLevel: 1, xp: 3 },
                    { arrowItemId: 'steel_arrows', headlessItemId: 'oak_headless_arrows', arrowheadsItemId: 'steel_arrowheads', requiredLevel: 10, xp: 5 },
                    { arrowItemId: 'mithril_arrows', headlessItemId: 'willow_headless_arrows', arrowheadsItemId: 'mithril_arrowheads', requiredLevel: 20, xp: 7 },
                    { arrowItemId: 'adamant_arrows', headlessItemId: 'maple_headless_arrows', arrowheadsItemId: 'adamant_arrowheads', requiredLevel: 30, xp: 10 },
                    { arrowItemId: 'rune_arrows', headlessItemId: 'yew_headless_arrows', arrowheadsItemId: 'rune_arrowheads', requiredLevel: 40, xp: 14 }
                ];

                for (let i = 0; i < finishedArrowDefs.length; i++) {
                    const def = finishedArrowDefs[i];
                    recipes[`fletch_${def.arrowItemId}`] = {
                        recipeFamily: 'finished_arrows',
                        requiredLevel: def.requiredLevel,
                        inputs: [
                            { itemId: def.arrowheadsItemId, amount: 1 },
                            { itemId: def.headlessItemId, amount: 1 }
                        ],
                        output: { itemId: def.arrowItemId, amount: 1 },
                        xpPerAction: def.xp,
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
                    buyPolicy: 'half_price_floor'
                }
            }
        },
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
    function gatherRecipeRows(recipeSet) {
        if (!recipeSet || typeof recipeSet !== 'object') return [];
        const recipeIds = Object.keys(recipeSet);
        const rows = [];
        for (let i = 0; i < recipeIds.length; i++) {
            const recipeId = recipeIds[i];
            const recipe = recipeSet[recipeId];
            if (!recipe || typeof recipe !== 'object') continue;
            rows.push({ recipeId, recipe });
        }
        return rows;
    }

    function validateCrossSkillIntegration(skillSpecs) {
        const errors = [];
        const fletchingRecipes = skillSpecs && skillSpecs.fletching ? skillSpecs.fletching.recipeSet : null;
        const smithingRecipes = skillSpecs && skillSpecs.smithing ? skillSpecs.smithing.recipeSet : null;
        const craftingRecipes = skillSpecs && skillSpecs.crafting ? skillSpecs.crafting.recipeSet : null;

        const fletchedHandleIds = new Set();
        const fletchingRows = gatherRecipeRows(fletchingRecipes);
        for (let i = 0; i < fletchingRows.length; i++) {
            const row = fletchingRows[i];
            if (row.recipe.recipeFamily !== 'handle') continue;
            const outputId = row.recipe.output && row.recipe.output.itemId;
            if (typeof outputId === 'string' && outputId) fletchedHandleIds.add(outputId);
        }

        const craftingRows = gatherRecipeRows(craftingRecipes);
        let craftingAssemblyCount = 0;
        for (let i = 0; i < craftingRows.length; i++) {
            const row = craftingRows[i];
            if (row.recipe.recipeFamily !== 'tool_weapon_assembly') continue;
            craftingAssemblyCount++;

            const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
            const handleInputs = inputs.filter((input) => /_handle$/.test(String(input && input.itemId || '')));
            if (handleInputs.length !== 1) {
                errors.push(`crafting:${row.recipeId} must include exactly one fletched handle input`);
                continue;
            }

            const handleId = String(handleInputs[0].itemId || '');
            if (!fletchedHandleIds.has(handleId)) {
                errors.push(`crafting:${row.recipeId} references non-fletching handle ${handleId}`);
            }

            for (let j = 0; j < inputs.length; j++) {
                const inputId = String(inputs[j] && inputs[j].itemId || '');
                if (inputId === 'logs' || /_logs$/.test(inputId)) {
                    errors.push(`crafting:${row.recipeId} should not consume logs directly`);
                }
            }
        }
        if (craftingAssemblyCount === 0) {
            errors.push('crafting: missing tool/weapon assembly recipes');
        }

        const smithingArrowheadOutputs = new Set();
        const smithingRows = gatherRecipeRows(smithingRecipes);
        for (let i = 0; i < smithingRows.length; i++) {
            const outputId = smithingRows[i].recipe.output && smithingRows[i].recipe.output.itemId;
            if (/_arrowheads$/.test(String(outputId || ''))) {
                smithingArrowheadOutputs.add(String(outputId));
            }
        }

        const finishedArrowRows = fletchingRows.filter((row) => row.recipe.recipeFamily === 'finished_arrows');
        for (let i = 0; i < finishedArrowRows.length; i++) {
            const row = finishedArrowRows[i];
            const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
            const arrowheadInput = inputs.find((input) => /_arrowheads$/.test(String(input && input.itemId || '')));
            const arrowheadId = arrowheadInput ? String(arrowheadInput.itemId || '') : '';
            if (!arrowheadId) {
                errors.push(`fletching:${row.recipeId} missing arrowhead input`);
                continue;
            }
            if (!smithingArrowheadOutputs.has(arrowheadId)) {
                errors.push(`fletching:${row.recipeId} references smithing-missing arrowheads ${arrowheadId}`);
            }
        }

        if (errors.length > 0) {
            throw new Error(`Cross-skill integration mismatch:\n- ${errors.join('\n- ')}`);
        }
    }

    validateCrossSkillIntegration(SKILL_SPECS);

    window.SkillSpecs = {
        version: SPEC_VERSION,
        skills: SKILL_SPECS
    };
})();


