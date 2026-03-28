(function () {
    const SPEC_VERSION = '2026.03.m6';
    const CANONICAL_FISH_FOOD_VALUE_TABLE = Object.freeze({
        raw_shrimp: { buy: 3, sell: 1 },
        raw_trout: { buy: 18, sell: 7 },
        raw_salmon: { buy: 24, sell: 9 },
        raw_tuna: { buy: 28, sell: 11 },
        raw_swordfish: { buy: 40, sell: 16 },
        cooked_shrimp: { buy: 8, sell: 3 },
        burnt_shrimp: { buy: 1, sell: 1 },
        cooked_trout: { buy: 24, sell: 9 },
        burnt_trout: { buy: 1, sell: 1 },
        cooked_salmon: { buy: 32, sell: 12 },
        burnt_salmon: { buy: 1, sell: 1 },
        cooked_tuna: { buy: 40, sell: 16 },
        burnt_tuna: { buy: 1, sell: 1 },
        cooked_swordfish: { buy: 56, sell: 22 },
        burnt_swordfish: { buy: 1, sell: 1 }
    });
    const CANONICAL_COOKING_VALUE_TABLE = Object.freeze({
        ...CANONICAL_FISH_FOOD_VALUE_TABLE,
        raw_chicken: { buy: 4, sell: 1 },
        cooked_chicken: { buy: 10, sell: 4 },
        burnt_chicken: { buy: 1, sell: 1 },
        raw_boar_meat: { buy: 6, sell: 2 },
        cooked_boar_meat: { buy: 20, sell: 8 },
        burnt_boar_meat: { buy: 1, sell: 1 },
        raw_wolf_meat: { buy: 8, sell: 3 },
        cooked_wolf_meat: { buy: 30, sell: 12 },
        burnt_wolf_meat: { buy: 1, sell: 1 }
    });

    const SKILL_SPECS = {
        woodcutting: {
            skillId: 'woodcutting',
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
                normal_tree: {
                    tileId: 1,
                    requiredLevel: 1,
                    difficulty: 18,
                    xpPerSuccess: 25,
                    rewardItemId: 'logs',
                    depletionChance: 0.75,
                    respawnTicks: 18
                },
                oak_tree: {
                    tileId: 1,
                    requiredLevel: 10,
                    difficulty: 28,
                    xpPerSuccess: 38,
                    rewardItemId: 'oak_logs',
                    depletionChance: 0.6,
                    respawnTicks: 24
                },
                willow_tree: {
                    tileId: 1,
                    requiredLevel: 20,
                    difficulty: 38,
                    xpPerSuccess: 68,
                    rewardItemId: 'willow_logs',
                    depletionChance: 0.45,
                    respawnTicks: 32
                },
                maple_tree: {
                    tileId: 1,
                    requiredLevel: 30,
                    difficulty: 50,
                    xpPerSuccess: 100,
                    rewardItemId: 'maple_logs',
                    depletionChance: 0.3,
                    respawnTicks: 44
                },
                yew_tree: {
                    tileId: 1,
                    requiredLevel: 40,
                    difficulty: 64,
                    xpPerSuccess: 150,
                    rewardItemId: 'yew_logs',
                    depletionChance: 0.1,
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
                    buyPolicy: 'half_price_floor',
                    defaultStock: [
                        { itemId: 'iron_axe', stockAmount: 5 }
                    ]
                }
            }
        },
        fishing: {
            skillId: 'fishing',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                success: 'method_base_plus_scaling_clamped',
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
                            baseCatchChance: 0.32,
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
                            baseCatchChance: 0.36,
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
                            baseCatchChance: 0.36,
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
                    ...CANONICAL_FISH_FOOD_VALUE_TABLE
                },
                merchantTable: {
                    fishing_supplier: {
                        strictBuys: true,
                        buys: ['small_net', 'fishing_rod', 'harpoon', 'bait', 'raw_shrimp', 'raw_trout', 'raw_salmon', 'raw_tuna', 'raw_swordfish', 'cooked_shrimp', 'burnt_shrimp', 'cooked_trout', 'burnt_trout', 'cooked_salmon', 'burnt_salmon', 'cooked_tuna', 'burnt_tuna', 'cooked_swordfish', 'burnt_swordfish'],
                        sells: ['small_net', 'fishing_rod', 'harpoon', 'bait'],
                        unlocks: {
                            itemIds: ['raw_shrimp', 'raw_trout', 'raw_salmon', 'raw_tuna', 'raw_swordfish'],
                            threshold: 50,
                            stockAmount: 20
                        }
                    },
                    fishing_teacher: {
                        strictBuys: true,
                        buys: ['small_net', 'fishing_rod', 'bait', 'rune_harpoon'],
                        sells: ['small_net', 'fishing_rod', 'bait'],
                        conditionalSells: {
                            rune_harpoon: {
                                requiresQuestCompleted: 'fishing_teacher_from_net_to_harpoon',
                                requiresMissingItem: 'rune_harpoon',
                                stockAmount: 1
                            }
                        }
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
                },
                oak_logs: {
                    sourceItemId: 'oak_logs',
                    requiredLevel: 10,
                    ignitionDifficulty: 25,
                    xpPerSuccess: 60,
                    fireLifetimeTicks: 90
                },
                willow_logs: {
                    sourceItemId: 'willow_logs',
                    requiredLevel: 20,
                    ignitionDifficulty: 35,
                    xpPerSuccess: 90,
                    fireLifetimeTicks: 90
                },
                maple_logs: {
                    sourceItemId: 'maple_logs',
                    requiredLevel: 30,
                    ignitionDifficulty: 50,
                    xpPerSuccess: 135,
                    fireLifetimeTicks: 90
                },
                yew_logs: {
                    sourceItemId: 'yew_logs',
                    requiredLevel: 40,
                    ignitionDifficulty: 65,
                    xpPerSuccess: 200,
                    fireLifetimeTicks: 90
                }
            },
            economy: {
                primaryResource: 'logs',
                supportResource: 'tinderbox',
                valueTable: {
                    logs: { buy: 6, sell: 2 },
                    oak_logs: { buy: 16, sell: 6 },
                    willow_logs: { buy: 36, sell: 14 },
                    maple_logs: { buy: 80, sell: 32 },
                    yew_logs: { buy: 180, sell: 72 },
                    tinderbox: { buy: 8, sell: 2 },
                    ashes: { buy: 4, sell: 1 }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor',
                    defaultStock: [
                        { itemId: 'tinderbox', stockAmount: 10 }
                    ]
                }
            }
        },
        cooking: {
            skillId: 'cooking',
            levelBands: [1, 5, 10, 15, 20, 25, 30, 40],
            formulas: {
                success: 'one_minus_unlock_relative_cubic_burn_curve',
                burn: 'unlock_relative_cubic_burn_curve'
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
                    xpPerSuccess: 30,
                    sourceTarget: 'FIRE'
                },
                raw_chicken: {
                    sourceItemId: 'raw_chicken',
                    cookedItemId: 'cooked_chicken',
                    burntItemId: 'burnt_chicken',
                    requiredLevel: 5,
                    xpPerSuccess: 45,
                    sourceTarget: 'FIRE'
                },
                raw_trout: {
                    sourceItemId: 'raw_trout',
                    cookedItemId: 'cooked_trout',
                    burntItemId: 'burnt_trout',
                    requiredLevel: 10,
                    xpPerSuccess: 70,
                    sourceTarget: 'FIRE'
                },
                raw_boar_meat: {
                    sourceItemId: 'raw_boar_meat',
                    cookedItemId: 'cooked_boar_meat',
                    burntItemId: 'burnt_boar_meat',
                    requiredLevel: 15,
                    xpPerSuccess: 80,
                    sourceTarget: 'FIRE'
                },
                raw_salmon: {
                    sourceItemId: 'raw_salmon',
                    cookedItemId: 'cooked_salmon',
                    burntItemId: 'burnt_salmon',
                    requiredLevel: 20,
                    xpPerSuccess: 90,
                    sourceTarget: 'FIRE'
                },
                raw_wolf_meat: {
                    sourceItemId: 'raw_wolf_meat',
                    cookedItemId: 'cooked_wolf_meat',
                    burntItemId: 'burnt_wolf_meat',
                    requiredLevel: 25,
                    xpPerSuccess: 105,
                    sourceTarget: 'FIRE'
                },
                raw_tuna: {
                    sourceItemId: 'raw_tuna',
                    cookedItemId: 'cooked_tuna',
                    burntItemId: 'burnt_tuna',
                    requiredLevel: 30,
                    xpPerSuccess: 120,
                    sourceTarget: 'FIRE'
                },
                raw_swordfish: {
                    sourceItemId: 'raw_swordfish',
                    cookedItemId: 'cooked_swordfish',
                    burntItemId: 'burnt_swordfish',
                    requiredLevel: 40,
                    xpPerSuccess: 140,
                    sourceTarget: 'FIRE'
                }
            },
            economy: {
                primaryResource: 'raw_shrimp',
                cookedResource: 'cooked_shrimp',
                burntResource: 'burnt_shrimp',
                valueTable: CANONICAL_COOKING_VALUE_TABLE
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
                clay_rock: { tileId: 2, oreType: 'clay', requiredLevel: 1, difficulty: 6, xpPerSuccess: 8, rewardItemId: 'clay', minimumYields: 1, maximumYields: 1, depletionChance: 1.0, respawnTicks: 5 },
                copper_rock: { tileId: 2, oreType: 'copper', requiredLevel: 1, difficulty: 8, xpPerSuccess: 10, rewardItemId: 'copper_ore', minimumYields: 1, maximumYields: 1, depletionChance: 1.0, respawnTicks: 6 },
                tin_rock: { tileId: 2, oreType: 'tin', requiredLevel: 1, difficulty: 8, xpPerSuccess: 10, rewardItemId: 'tin_ore', minimumYields: 1, maximumYields: 1, depletionChance: 1.0, respawnTicks: 6 },
                rune_essence: { tileId: 2, oreType: 'rune_essence', requiredLevel: 1, difficulty: 6, xpPerSuccess: 2, rewardItemId: 'rune_essence', persistent: true },
                iron_rock: { tileId: 2, oreType: 'iron', requiredLevel: 10, difficulty: 16, xpPerSuccess: 18, rewardItemId: 'iron_ore', minimumYields: 1, maximumYields: 3, depletionChance: 0.5, respawnTicks: 9 },
                coal_rock: { tileId: 2, oreType: 'coal', requiredLevel: 20, difficulty: 26, xpPerSuccess: 28, rewardItemId: 'coal', minimumYields: 2, maximumYields: 5, depletionChance: 0.35, respawnTicks: 12 },
                silver_rock: { tileId: 2, oreType: 'silver', requiredLevel: 30, difficulty: 36, xpPerSuccess: 40, rewardItemId: 'silver_ore', minimumYields: 2, maximumYields: 5, depletionChance: 0.3, respawnTicks: 15 },
                sapphire_rock: { tileId: 2, oreType: 'sapphire', requiredLevel: 30, difficulty: 42, xpPerSuccess: 52, rewardItemId: 'uncut_sapphire', minimumYields: 2, maximumYields: 4, depletionChance: 0.3, respawnTicks: 18 },
                gold_rock: { tileId: 2, oreType: 'gold', requiredLevel: 40, difficulty: 50, xpPerSuccess: 60, rewardItemId: 'gold_ore', minimumYields: 2, maximumYields: 5, depletionChance: 0.25, respawnTicks: 21 },
                emerald_rock: { tileId: 2, oreType: 'emerald', requiredLevel: 40, difficulty: 56, xpPerSuccess: 72, rewardItemId: 'uncut_emerald', minimumYields: 2, maximumYields: 4, depletionChance: 0.3, respawnTicks: 18 }
            },
            economy: {
                primaryResource: 'copper_ore',
                valueTable: {
                    bronze_pickaxe: { buy: 40, sell: 10 },
                    iron_pickaxe: { buy: 120, sell: 35 },
                    steel_pickaxe: { buy: 350, sell: 110 },
                    mithril_pickaxe: { buy: 900, sell: 300 },
                    adamant_pickaxe: { buy: 2200, sell: 750 },
                    rune_pickaxe: { buy: null, sell: 2500 },
                    clay: { buy: 4, sell: 1 },
                    copper_ore: { buy: 8, sell: 3 },
                    tin_ore: { buy: 8, sell: 3 },
                    iron_ore: { buy: 18, sell: 7 },
                    coal: { buy: 30, sell: 12 },
                    silver_ore: { buy: 45, sell: 18 },
                    uncut_sapphire: { buy: 50, sell: 16 },
                    gold_ore: { buy: 70, sell: 28 },
                    uncut_emerald: { buy: 90, sell: 30 },
                    rune_essence: { buy: 12, sell: 4 },
                    uncut_ruby: { buy: 20, sell: 6 },
                    uncut_diamond: { buy: 150, sell: 50 },
                    mithril_ore: { buy: 120, sell: 60 },
                    adamant_ore: { buy: 300, sell: 150 },
                    rune_ore: { buy: 1200, sell: 600 }
                }
            }
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
                        requiredLevel: leveled(def.baseLevel, 4),
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
        const standardCraftingFamilies = new Set(['gem_cutting', 'staff_attachment', 'jewelry_gem_attachment', 'mould_firing']);
        const immediateCraftingFamilies = new Set(['strapped_handle', 'tool_weapon_assembly', 'soft_clay', 'mould_imprint']);
        for (let i = 0; i < craftingRows.length; i++) {
            const row = craftingRows[i];
            const recipe = row && row.recipe;
            const recipeId = row && row.recipeId ? row.recipeId : '(unknown)';

            const recipeFamily = recipe && typeof recipe.recipeFamily === 'string' ? recipe.recipeFamily : '';
            if (!recipeFamily) errors.push('crafting:' + recipeId + ' is missing recipeFamily');

            const requiredLevel = recipe && recipe.requiredLevel;
            if (!Number.isFinite(requiredLevel) || requiredLevel < 1) {
                errors.push('crafting:' + recipeId + ' must define a valid requiredLevel >= 1');
            }

            const inputs = Array.isArray(recipe && recipe.inputs) ? recipe.inputs : null;
            if (!inputs || inputs.length === 0) {
                errors.push('crafting:' + recipeId + ' must define one or more inputs');
            } else {
                for (let j = 0; j < inputs.length; j++) {
                    const input = inputs[j];
                    const itemId = input && typeof input.itemId === 'string' ? input.itemId : '';
                    const amount = input && input.amount;
                    if (!itemId) errors.push('crafting:' + recipeId + ' input[' + j + '] is missing itemId');
                    if (!Number.isFinite(amount) || amount < 1) {
                        errors.push('crafting:' + recipeId + ' input[' + j + '] must define amount >= 1');
                    }
                }
            }

            const outputItemId = recipe && recipe.output && typeof recipe.output.itemId === 'string' ? recipe.output.itemId : '';
            const outputAmount = recipe && recipe.output ? recipe.output.amount : null;
            if (!outputItemId) errors.push('crafting:' + recipeId + ' is missing output.itemId');
            if (!Number.isFinite(outputAmount) || outputAmount < 1) {
                errors.push('crafting:' + recipeId + ' must define output.amount >= 1');
            }

            const xpPerAction = recipe && recipe.xpPerAction;
            if (!Number.isFinite(xpPerAction) || xpPerAction < 0) {
                errors.push('crafting:' + recipeId + ' must define xpPerAction >= 0');
            }

            const actionTicks = recipe && recipe.actionTicks;
            if (!Number.isFinite(actionTicks) || actionTicks < 1) {
                errors.push('crafting:' + recipeId + ' must define actionTicks >= 1');
            }

            if (immediateCraftingFamilies.has(recipeFamily) && actionTicks !== 1) {
                errors.push('crafting:' + recipeId + ' immediate recipe family must use actionTicks=1');
            }
            if (standardCraftingFamilies.has(recipeFamily) && actionTicks !== 3) {
                errors.push('crafting:' + recipeId + ' standard recipe family must use actionTicks=3');
            }

            if (Array.isArray(recipe && recipe.requiredToolIds)) {
                const toolIds = recipe.requiredToolIds;
                for (let j = 0; j < toolIds.length; j++) {
                    if (typeof toolIds[j] !== 'string' || !toolIds[j]) {
                        errors.push('crafting:' + recipeId + ' requiredToolIds must contain non-empty string ids');
                        break;
                    }
                }
            }

            if (recipe && Object.prototype.hasOwnProperty.call(recipe, 'stationType')) {
                const stationType = recipe.stationType;
                if (typeof stationType !== 'string' || !stationType) {
                    errors.push('crafting:' + recipeId + ' stationType must be a non-empty string when provided');
                }
            }
        }
        const smithingRows = gatherRecipeRows(smithingRecipes);
        const smithingAssemblyPartOutputs = new Set();
        const smithingJewelryBaseOutputs = new Set();
        const mouldUnlockBySuffix = {
            ring: 'ringMouldUnlocked',
            amulet: 'amuletMouldUnlocked',
            tiara: 'tiaraMouldUnlocked'
        };

        for (let i = 0; i < smithingRows.length; i++) {
            const row = smithingRows[i];
            const recipe = row && row.recipe;
            const recipeId = row && row.recipeId ? row.recipeId : '(unknown)';
            const outputId = String(recipe && recipe.output && recipe.output.itemId || '');
            if (!outputId) continue;

            if (/_(sword_blade|axe_head|pickaxe_head)$/.test(outputId)) {
                smithingAssemblyPartOutputs.add(outputId);
            }

            if (/^(silver|gold)_(ring|amulet|tiara)$/.test(outputId)) {
                smithingJewelryBaseOutputs.add(outputId);
                const requiredMouldIds = Array.isArray(recipe && recipe.requiredMouldIds) ? recipe.requiredMouldIds : [];
                if (requiredMouldIds.length !== 1) {
                    errors.push('smithing:' + recipeId + ' jewelry base recipe must define exactly one required mould');
                }

                const match = outputId.match(/_(ring|amulet|tiara)$/);
                const suffix = match ? match[1] : '';
                const expectedMould = suffix ? suffix + '_mould' : '';
                const expectedUnlock = suffix ? mouldUnlockBySuffix[suffix] : '';
                if (expectedMould && !requiredMouldIds.includes(expectedMould)) {
                    errors.push('smithing:' + recipeId + ' jewelry base recipe must require ' + expectedMould);
                }
                const requiredUnlockFlag = typeof (recipe && recipe.requiredUnlockFlag) === 'string' ? recipe.requiredUnlockFlag : '';
                if (!requiredUnlockFlag) {
                    errors.push('smithing:' + recipeId + ' jewelry base recipe is missing requiredUnlockFlag');
                } else if (expectedUnlock && requiredUnlockFlag !== expectedUnlock) {
                    errors.push('smithing:' + recipeId + ' jewelry base recipe should use unlock flag ' + expectedUnlock);
                }
            }
        }

        for (let i = 0; i < craftingRows.length; i++) {
            const row = craftingRows[i];
            if (row.recipe.recipeFamily !== 'jewelry_gem_attachment') continue;

            const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
            const baseInput = inputs.find((input) => /^(silver|gold)_(ring|amulet|tiara)$/.test(String(input && input.itemId || '')));
            const gemInput = inputs.find((input) => /^cut_(ruby|sapphire|emerald|diamond)$/.test(String(input && input.itemId || '')));
            const baseId = String(baseInput && baseInput.itemId || '');
            const gemId = String(gemInput && gemInput.itemId || '');

            if (!baseId || !gemId) {
                errors.push('crafting:' + row.recipeId + ' jewelry attachment must use one jewelry base and one cut gem input');
                continue;
            }

            if (!smithingJewelryBaseOutputs.has(baseId)) {
                errors.push('crafting:' + row.recipeId + ' references non-smithing jewelry base ' + baseId);
            }

            if (/^silver_/.test(baseId) && !['cut_ruby', 'cut_sapphire'].includes(gemId)) {
                errors.push('crafting:' + row.recipeId + ' silver jewelry may only attach ruby/sapphire gems');
            }
            if (/^gold_/.test(baseId) && !['cut_ruby', 'cut_sapphire', 'cut_emerald', 'cut_diamond'].includes(gemId)) {
                errors.push('crafting:' + row.recipeId + ' gold jewelry may only attach ruby/sapphire/emerald/diamond gems');
            }

            const suffixMatch = baseId.match(/_(ring|amulet|tiara)$/);
            const suffix = suffixMatch ? suffixMatch[1] : '';
            const expectedUnlock = suffix ? mouldUnlockBySuffix[suffix] : '';
            const requiredUnlockFlag = typeof row.recipe.requiredUnlockFlag === 'string' ? row.recipe.requiredUnlockFlag : '';
            if (!requiredUnlockFlag) {
                errors.push('crafting:' + row.recipeId + ' jewelry attachment is missing requiredUnlockFlag');
            } else if (expectedUnlock && requiredUnlockFlag !== expectedUnlock) {
                errors.push('crafting:' + row.recipeId + ' jewelry attachment should use unlock flag ' + expectedUnlock);
            }
        }
        const strappedHandleOutputIds = new Set();
        for (let i = 0; i < craftingRows.length; i++) {
            const row = craftingRows[i];
            if (row.recipe.recipeFamily !== 'strapped_handle') continue;

            const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
            const baseHandleInputs = inputs.filter((input) => /_handle$/.test(String(input && input.itemId || '')) && !/_handle_strapped$/.test(String(input && input.itemId || '')));
            if (baseHandleInputs.length !== 1) {
                errors.push('crafting:' + row.recipeId + ' must include exactly one base fletched handle input');
                continue;
            }

            const baseHandleId = String(baseHandleInputs[0].itemId || '');
            if (!fletchedHandleIds.has(baseHandleId)) {
                errors.push('crafting:' + row.recipeId + ' references non-fletching handle ' + baseHandleId);
            }

            const leatherInputs = inputs.filter((input) => /_leather$/.test(String(input && input.itemId || '')));
            if (leatherInputs.length !== 1) {
                errors.push('crafting:' + row.recipeId + ' must include exactly one leather input');
            }

            const outputId = String(row.recipe.output && row.recipe.output.itemId || '');
            if (!/_handle_strapped$/.test(outputId)) {
                errors.push('crafting:' + row.recipeId + ' must output a strapped handle');
                continue;
            }
            strappedHandleOutputIds.add(outputId);
        }

        let craftingAssemblyCount = 0;
        const assembledSmithingPartInputs = new Set();
        for (let i = 0; i < craftingRows.length; i++) {
            const row = craftingRows[i];
            if (row.recipe.recipeFamily !== 'tool_weapon_assembly') continue;
            craftingAssemblyCount++;

            const inputs = Array.isArray(row.recipe.inputs) ? row.recipe.inputs : [];
            const handleInputs = inputs.filter((input) => /_handle_strapped$/.test(String(input && input.itemId || '')));
            if (handleInputs.length !== 1) {
                errors.push('crafting:' + row.recipeId + ' must include exactly one strapped handle input');
                continue;
            }

            const handleId = String(handleInputs[0].itemId || '');
            if (!strappedHandleOutputIds.has(handleId)) {
                errors.push('crafting:' + row.recipeId + ' references non-crafting strapped handle ' + handleId);
            }

            const partInput = inputs.find((input) => /_(sword_blade|axe_head|pickaxe_head)$/.test(String(input && input.itemId || '')));
            const partItemId = String(partInput && partInput.itemId || '');
            if (!partItemId) {
                errors.push('crafting:' + row.recipeId + ' must include one smithing metal-part input');
            } else {
                assembledSmithingPartInputs.add(partItemId);
                if (!smithingAssemblyPartOutputs.has(partItemId)) {
                    errors.push('crafting:' + row.recipeId + ' references non-smithing assembly part ' + partItemId);
                }
            }

            for (let j = 0; j < inputs.length; j++) {
                const inputId = String(inputs[j] && inputs[j].itemId || '');
                if (inputId === 'logs' || /_logs$/.test(inputId)) {
                    errors.push('crafting:' + row.recipeId + ' should not consume logs directly');
                }
            }
        }
        if (craftingAssemblyCount === 0) {
            errors.push('crafting: missing tool/weapon assembly recipes');
        }
        for (const smithPartId of smithingAssemblyPartOutputs) {
            if (!assembledSmithingPartInputs.has(smithPartId)) {
                errors.push('crafting: missing assembly path for smithing part ' + smithPartId);
            }
        }

        const smithingArrowheadOutputs = new Set();
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
                errors.push('fletching:' + row.recipeId + ' missing arrowhead input');
                continue;
            }
            if (!smithingArrowheadOutputs.has(arrowheadId)) {
                errors.push('fletching:' + row.recipeId + ' references smithing-missing arrowheads ' + arrowheadId);
            }
        }

        if (errors.length > 0) {
            throw new Error('Cross-skill integration mismatch\n- ' + errors.join('\n- '));
        }
    }

    function validateWoodcuttingLogDemandIntegration(skillSpecs) {
        const errors = [];
        const woodcuttingSpec = skillSpecs && skillSpecs.woodcutting ? skillSpecs.woodcutting : null;
        const firemakingSpec = skillSpecs && skillSpecs.firemaking ? skillSpecs.firemaking : null;
        const fletchingSpec = skillSpecs && skillSpecs.fletching ? skillSpecs.fletching : null;
        const cookingSpec = skillSpecs && skillSpecs.cooking ? skillSpecs.cooking : null;

        if (!woodcuttingSpec || !woodcuttingSpec.nodeTable) {
            throw new Error('Woodcutting log-demand integration mismatch\n- missing woodcutting node table');
        }

        const expectedCanonicalLogs = ['logs', 'oak_logs', 'willow_logs', 'maple_logs', 'yew_logs'];
        const woodcutNodeRows = Object.entries(woodcuttingSpec.nodeTable || {});
        const canonicalSet = new Set();
        for (let i = 0; i < woodcutNodeRows.length; i++) {
            const nodeId = woodcutNodeRows[i][0];
            const node = woodcutNodeRows[i][1];
            const rewardItemId = String(node && node.rewardItemId || '');
            if (!rewardItemId) {
                errors.push('woodcutting:' + nodeId + ' is missing rewardItemId');
                continue;
            }
            canonicalSet.add(rewardItemId);
        }

        for (let i = 0; i < expectedCanonicalLogs.length; i++) {
            const logItemId = expectedCanonicalLogs[i];
            if (!canonicalSet.has(logItemId)) {
                errors.push('woodcutting node rewards are missing canonical log tier ' + logItemId);
            }
        }

        for (const foundLogId of canonicalSet) {
            if (!expectedCanonicalLogs.includes(foundLogId)) {
                errors.push('woodcutting node rewards include unexpected log tier ' + foundLogId);
            }
        }

        const canonicalLogs = expectedCanonicalLogs.filter((logId) => canonicalSet.has(logId));
        const fletchingRecipes = fletchingSpec && fletchingSpec.recipeSet && typeof fletchingSpec.recipeSet === 'object'
            ? fletchingSpec.recipeSet
            : null;
        if (!fletchingRecipes) {
            errors.push('fletching recipe set is missing for woodcutting demand integration');
        }

        const fletchingConsumersByLog = {};
        for (let i = 0; i < canonicalLogs.length; i++) {
            fletchingConsumersByLog[canonicalLogs[i]] = [];
        }

        if (fletchingRecipes) {
            const fletchingRows = Object.entries(fletchingRecipes);
            for (let i = 0; i < fletchingRows.length; i++) {
                const recipeId = fletchingRows[i][0];
                const recipe = fletchingRows[i][1] || {};
                const sourceLogItemId = typeof recipe.sourceLogItemId === 'string' ? recipe.sourceLogItemId : '';
                if (!sourceLogItemId) continue;

                if (!canonicalSet.has(sourceLogItemId)) {
                    errors.push('fletching:' + recipeId + ' uses non-canonical sourceLogItemId ' + sourceLogItemId);
                    continue;
                }

                const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
                const matchingLogInputs = inputs.filter((input) => input && input.itemId === sourceLogItemId && Number.isFinite(input.amount) && input.amount >= 1);
                if (matchingLogInputs.length !== 1) {
                    errors.push('fletching:' + recipeId + ' must include exactly one matching log input for sourceLogItemId ' + sourceLogItemId);
                    continue;
                }

                if (fletchingConsumersByLog[sourceLogItemId]) {
                    fletchingConsumersByLog[sourceLogItemId].push(recipeId);
                }
            }
        }

        for (let i = 0; i < canonicalLogs.length; i++) {
            const logItemId = canonicalLogs[i];
            const consumers = fletchingConsumersByLog[logItemId] || [];
            if (consumers.length === 0) {
                errors.push('woodcutting canonical log ' + logItemId + ' has no fletching consumer recipes');
            }
        }

        const firemakingRecipes = firemakingSpec && firemakingSpec.recipeSet && typeof firemakingSpec.recipeSet === 'object'
            ? firemakingSpec.recipeSet
            : null;
        if (!firemakingRecipes || Object.keys(firemakingRecipes).length === 0) {
            errors.push('firemaking recipe set is missing for woodcutting demand integration');
        } else {
            const fireRows = Object.entries(firemakingRecipes);
            const firemakingConsumersByLog = {};
            for (let i = 0; i < canonicalLogs.length; i++) {
                firemakingConsumersByLog[canonicalLogs[i]] = [];
            }

            for (let i = 0; i < fireRows.length; i++) {
                const recipeId = fireRows[i][0];
                const recipe = fireRows[i][1] || {};
                const sourceItemId = typeof recipe.sourceItemId === 'string' ? recipe.sourceItemId : '';
                if (!canonicalSet.has(sourceItemId)) {
                    errors.push('firemaking:' + recipeId + ' uses non-canonical sourceItemId ' + (sourceItemId || 'missing'));
                    continue;
                }

                firemakingConsumersByLog[sourceItemId].push(recipeId);
            }

            for (let i = 0; i < canonicalLogs.length; i++) {
                const logItemId = canonicalLogs[i];
                const consumers = firemakingConsumersByLog[logItemId] || [];
                if (consumers.length === 0) {
                    errors.push('woodcutting canonical log ' + logItemId + ' has no firemaking consumer recipes');
                }
            }
        }

        const cookingRecipes = cookingSpec && cookingSpec.recipeSet && typeof cookingSpec.recipeSet === 'object'
            ? cookingSpec.recipeSet
            : null;
        if (!cookingRecipes || Object.keys(cookingRecipes).length === 0) {
            errors.push('cooking recipe set is missing for woodcutting demand integration');
        } else {
            const cookingRows = Object.entries(cookingRecipes);
            for (let i = 0; i < cookingRows.length; i++) {
                const recipeId = cookingRows[i][0];
                const recipe = cookingRows[i][1] || {};
                const sourceItemId = typeof recipe.sourceItemId === 'string' ? recipe.sourceItemId : '';
                if (sourceItemId && (sourceItemId === 'logs' || /_logs$/.test(sourceItemId))) {
                    errors.push('cooking:' + recipeId + ' should not consume logs directly');
                }
                if (recipe.sourceTarget !== 'FIRE') {
                    errors.push('cooking:' + recipeId + ' should remain fire-source based (sourceTarget=FIRE)');
                }
            }
        }

        const woodcuttingMerchants = woodcuttingSpec && woodcuttingSpec.economy && woodcuttingSpec.economy.merchantTable && typeof woodcuttingSpec.economy.merchantTable === 'object'
            ? woodcuttingSpec.economy.merchantTable
            : null;
        if (!woodcuttingMerchants) {
            errors.push('woodcutting merchant table missing for log-demand integration');
        } else {
            const coverage = {};
            for (let i = 0; i < canonicalLogs.length; i++) coverage[canonicalLogs[i]] = false;

            const merchantRows = Object.entries(woodcuttingMerchants);
            for (let i = 0; i < merchantRows.length; i++) {
                const merchantConfig = merchantRows[i][1] || {};
                const buys = Array.isArray(merchantConfig.buys) ? merchantConfig.buys : [];
                const sells = Array.isArray(merchantConfig.sells) ? merchantConfig.sells : [];
                const listed = new Set([].concat(buys, sells));
                for (let j = 0; j < canonicalLogs.length; j++) {
                    const logItemId = canonicalLogs[j];
                    if (listed.has(logItemId)) coverage[logItemId] = true;
                }
            }

            for (let i = 0; i < canonicalLogs.length; i++) {
                const logItemId = canonicalLogs[i];
                if (!coverage[logItemId]) {
                    errors.push('woodcutting merchant coverage missing for canonical log ' + logItemId);
                }
            }
        }

        const fletchingMerchants = fletchingSpec && fletchingSpec.economy && fletchingSpec.economy.merchantTable && typeof fletchingSpec.economy.merchantTable === 'object'
            ? fletchingSpec.economy.merchantTable
            : null;
        if (!fletchingMerchants) {
            errors.push('fletching merchant table missing for log-demand integration');
        } else {
            const merchantIds = ['fletching_supplier', 'advanced_fletcher'];
            for (let i = 0; i < merchantIds.length; i++) {
                const merchantId = merchantIds[i];
                const merchantConfig = fletchingMerchants[merchantId];
                if (!merchantConfig || typeof merchantConfig !== 'object') {
                    errors.push('fletching merchant config missing for ' + merchantId);
                    continue;
                }
                const buys = Array.isArray(merchantConfig.buys) ? merchantConfig.buys : [];
                const sells = Array.isArray(merchantConfig.sells) ? merchantConfig.sells : [];
                const badBuy = buys.find((itemId) => itemId === 'logs' || /_logs$/.test(itemId));
                const badSell = sells.find((itemId) => itemId === 'logs' || /_logs$/.test(itemId));
                if (badBuy) errors.push('fletching merchant ' + merchantId + ' should not buy raw logs (' + badBuy + ')');
                if (badSell) errors.push('fletching merchant ' + merchantId + ' should not sell raw logs (' + badSell + ')');
            }
        }

        if (errors.length > 0) {
            throw new Error('Woodcutting log-demand integration mismatch\n- ' + errors.join('\n- '));
        }
    }

    function roundBalanceMetric(value) {
        if (!Number.isFinite(value)) return null;
        return Math.round(value * 10000) / 10000;
    }

    function clampBalanceValue(value, minValue, maxValue) {
        const next = Number.isFinite(value) ? value : minValue;
        return Math.max(minValue, Math.min(maxValue, next));
    }

    function computeCookingBurnChance(level, requiredLevel) {
        const lvl = Number.isFinite(level) ? level : 1;
        const unlock = Number.isFinite(requiredLevel) ? requiredLevel : 1;
        const delta = clampBalanceValue(lvl - unlock, 0, 30);
        if (delta <= 0) return 0.33;
        if (delta >= 30) return 0;
        const raw = 0.33 - (0.038 * delta) + (0.0018 * delta * delta) - (0.00003 * delta * delta * delta);
        return clampBalanceValue(raw, 0, 0.33);
    }

    function computeCookingBalanceMetrics(cookingSpec, recipeId, benchmark) {
        const recipeSet = cookingSpec && cookingSpec.recipeSet && typeof cookingSpec.recipeSet === 'object'
            ? cookingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const valueTable = cookingSpec && cookingSpec.economy && cookingSpec.economy.valueTable && typeof cookingSpec.economy.valueTable === 'object'
            ? cookingSpec.economy.valueTable
            : {};
        const levelBands = Array.isArray(cookingSpec.levelBands) ? cookingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(benchmark && benchmark.level) ? benchmark.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const burnChance = computeCookingBurnChance(level, recipe.requiredLevel);
        const successChance = 1 - burnChance;
        const rawValueRow = valueTable[recipe.sourceItemId] && typeof valueTable[recipe.sourceItemId] === 'object'
            ? valueTable[recipe.sourceItemId]
            : {};
        const cookedValueRow = valueTable[recipe.cookedItemId] && typeof valueTable[recipe.cookedItemId] === 'object'
            ? valueTable[recipe.cookedItemId]
            : {};
        const burntValueRow = valueTable[recipe.burntItemId] && typeof valueTable[recipe.burntItemId] === 'object'
            ? valueTable[recipe.burntItemId]
            : {};
        const rawSellValue = Number.isFinite(rawValueRow.sell) ? rawValueRow.sell : 0;
        const cookedSellValue = Number.isFinite(cookedValueRow.sell) ? cookedValueRow.sell : 0;
        const burntSellValue = Number.isFinite(burntValueRow.sell) ? burntValueRow.sell : 0;
        const expectedGoldDeltaPerAction = (successChance * cookedSellValue) + (burnChance * burntSellValue) - rawSellValue;

        return {
            recipeId,
            level,
            successChance,
            burnChance,
            expectedCookedPerAction: successChance,
            expectedXpPerAction: successChance * (Number.isFinite(recipe.xpPerSuccess) ? recipe.xpPerSuccess : 0),
            expectedGoldDeltaPerAction,
            rawSellValue,
            cookedSellValue,
            burntSellValue
        };
    }

    function computeFishingCatchChance(level, unlockLevel, baseCatchChance, levelScaling, maxCatchChance) {
        const lvl = Number.isFinite(level) ? level : 1;
        const unlock = Number.isFinite(unlockLevel) ? unlockLevel : 1;
        const raw = (Number.isFinite(baseCatchChance) ? baseCatchChance : 0) + ((lvl - unlock) * (Number.isFinite(levelScaling) ? levelScaling : 0));
        const cap = Number.isFinite(maxCatchChance) ? maxCatchChance : 1;
        return Math.max(0, Math.min(cap, raw));
    }

    function getFishingMethodFishTable(methodSpec, level) {
        if (!methodSpec || !Array.isArray(methodSpec.fishByLevel)) return [];
        for (let i = 0; i < methodSpec.fishByLevel.length; i++) {
            const band = methodSpec.fishByLevel[i] || {};
            const minLevel = Number.isFinite(band.minLevel) ? band.minLevel : 1;
            const maxLevel = Number.isFinite(band.maxLevel) ? band.maxLevel : Infinity;
            if (level < minLevel || level > maxLevel) continue;
            const fish = Array.isArray(band.fish) ? band.fish : [];
            return fish.filter((row) => row && level >= (Number.isFinite(row.requiredLevel) ? row.requiredLevel : 1));
        }
        return [];
    }

    function resolveFishingMethodCurve(waterSpec, methodSpec) {
        return {
            unlockLevel: Number.isFinite(methodSpec && methodSpec.unlockLevel)
                ? methodSpec.unlockLevel
                : (Number.isFinite(waterSpec && waterSpec.unlockLevel) ? waterSpec.unlockLevel : 1),
            baseCatchChance: Number.isFinite(methodSpec && methodSpec.baseCatchChance)
                ? methodSpec.baseCatchChance
                : (Number.isFinite(waterSpec && waterSpec.baseCatchChance) ? waterSpec.baseCatchChance : 0),
            levelScaling: Number.isFinite(methodSpec && methodSpec.levelScaling)
                ? methodSpec.levelScaling
                : (Number.isFinite(waterSpec && waterSpec.levelScaling) ? waterSpec.levelScaling : 0),
            maxCatchChance: Number.isFinite(methodSpec && methodSpec.maxCatchChance)
                ? methodSpec.maxCatchChance
                : (Number.isFinite(waterSpec && waterSpec.maxCatchChance) ? waterSpec.maxCatchChance : 1)
        };
    }

    function computeFishingBalanceMetrics(fishingSpec, waterId, methodId, benchmark) {
        const nodeTable = fishingSpec && fishingSpec.nodeTable && typeof fishingSpec.nodeTable === 'object'
            ? fishingSpec.nodeTable
            : {};
        const waterSpec = nodeTable[waterId];
        const methodSpec = waterSpec && waterSpec.methods && typeof waterSpec.methods === 'object'
            ? waterSpec.methods[methodId]
            : null;
        if (!waterSpec || !methodSpec) return null;

        const valueTable = fishingSpec && fishingSpec.economy && fishingSpec.economy.valueTable && typeof fishingSpec.economy.valueTable === 'object'
            ? fishingSpec.economy.valueTable
            : {};
        const levelBands = Array.isArray(fishingSpec.levelBands) ? fishingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const level = Number.isFinite(benchmark && benchmark.level) ? benchmark.level : (levelBands.length > 0 ? Math.max(...levelBands) : 1);
        const curve = resolveFishingMethodCurve(waterSpec, methodSpec);
        const fishTable = getFishingMethodFishTable(methodSpec, level);
        const catchChance = computeFishingCatchChance(level, curve.unlockLevel, curve.baseCatchChance, curve.levelScaling, curve.maxCatchChance);

        let totalWeight = 0;
        for (let i = 0; i < fishTable.length; i++) {
            const fish = fishTable[i];
            const weight = Number(fish && fish.weight);
            if (Number.isFinite(weight) && weight > 0) totalWeight += weight;
        }

        let activeXpPerTick = 0;
        let activeGoldPerTick = 0;
        for (let i = 0; i < fishTable.length; i++) {
            const fish = fishTable[i] || {};
            const weight = Number(fish.weight);
            if (!Number.isFinite(weight) || weight <= 0 || totalWeight <= 0) continue;
            const share = weight / totalWeight;
            const fishChance = catchChance * share;
            const valueRow = valueTable[fish.itemId] && typeof valueTable[fish.itemId] === 'object'
                ? valueTable[fish.itemId]
                : {};
            const sellValue = Number.isFinite(valueRow.sell) ? valueRow.sell : 0;
            activeXpPerTick += fishChance * (Number.isFinite(fish.xp) ? fish.xp : 0);
            activeGoldPerTick += fishChance * sellValue;
        }

        return {
            waterId,
            methodId,
            level,
            catchChance,
            activeFishPerTick: catchChance,
            activeXpPerTick,
            activeGoldPerTick
        };
    }

    function validateFishingBalanceCurve(skillSpecs) {
        const fishingSpec = skillSpecs && skillSpecs.fishing ? skillSpecs.fishing : null;
        if (!fishingSpec || !fishingSpec.nodeTable) {
            throw new Error('Fishing balance curve mismatch\n- missing fishing node table');
        }

        const nodeTable = fishingSpec.nodeTable || {};
        const shallowWater = nodeTable.shallow_water || null;
        const deepWater = nodeTable.deep_water || null;
        const valueTable = fishingSpec.economy && fishingSpec.economy.valueTable && typeof fishingSpec.economy.valueTable === 'object'
            ? fishingSpec.economy.valueTable
            : null;
        if (!valueTable) {
            throw new Error('Fishing balance curve mismatch\n- missing fishing value table');
        }

        const errors = [];
        if (!shallowWater || !shallowWater.methods) errors.push('missing shallow_water fishing methods');
        if (!deepWater || !deepWater.methods) errors.push('missing deep_water fishing methods');

        const requiredMethods = [
            ['shallow_water', 'net'],
            ['shallow_water', 'rod'],
            ['shallow_water', 'harpoon'],
            ['deep_water', 'deep_harpoon_mixed'],
            ['deep_water', 'deep_rune_harpoon']
        ];
        for (let i = 0; i < requiredMethods.length; i++) {
            const row = requiredMethods[i];
            const waterSpec = nodeTable[row[0]] || {};
            const methods = waterSpec.methods && typeof waterSpec.methods === 'object' ? waterSpec.methods : {};
            if (!methods[row[1]]) errors.push('missing fishing method ' + row[0] + '.' + row[1]);
        }

        const rod = shallowWater && shallowWater.methods ? shallowWater.methods.rod || {} : {};
        const harpoon = shallowWater && shallowWater.methods ? shallowWater.methods.harpoon || {} : {};
        const deepMixed = deepWater && deepWater.methods ? deepWater.methods.deep_harpoon_mixed || {} : {};
        const deepRune = deepWater && deepWater.methods ? deepWater.methods.deep_rune_harpoon || {} : {};

        const rodBands = Array.isArray(rod.fishByLevel) ? rod.fishByLevel : [];
        if (rodBands.length < 3) {
            errors.push('rod method must define three level bands');
        } else {
            const rod20Fish = Array.isArray(rodBands[1].fish) ? rodBands[1].fish : [];
            const rod30Fish = Array.isArray(rodBands[2].fish) ? rodBands[2].fish : [];
            if (!(rod20Fish.length === 2 && rod20Fish[0].itemId === 'raw_trout' && rod20Fish[0].weight === 75 && rod20Fish[1].itemId === 'raw_salmon' && rod20Fish[1].weight === 25)) {
                errors.push('rod level-20 band must remain trout/salmon at 75/25');
            }
            if (!(rod30Fish.length === 2 && rod30Fish[0].itemId === 'raw_trout' && rod30Fish[0].weight === 60 && rod30Fish[1].itemId === 'raw_salmon' && rod30Fish[1].weight === 40)) {
                errors.push('rod level-30 band must remain trout/salmon at 60/40');
            }
        }

        const deepMixedFish = Array.isArray(deepMixed.fishByLevel) && deepMixed.fishByLevel[0] && Array.isArray(deepMixed.fishByLevel[0].fish)
            ? deepMixed.fishByLevel[0].fish
            : [];
        if (!(deepMixedFish.length === 2 && deepMixedFish[0].itemId === 'raw_tuna' && deepMixedFish[0].weight === 70 && deepMixedFish[1].itemId === 'raw_swordfish' && deepMixedFish[1].weight === 30)) {
            errors.push('deep_harpoon_mixed must remain tuna/swordfish at 70/30');
        }

        if (Number.isFinite(harpoon.baseCatchChance) && harpoon.baseCatchChance !== 0.32) {
            errors.push('harpoon baseCatchChance must remain 0.32');
        }
        if (Number.isFinite(deepMixed.baseCatchChance) && deepMixed.baseCatchChance !== 0.36) {
            errors.push('deep_harpoon_mixed baseCatchChance must remain 0.36');
        }
        if (Number.isFinite(deepRune.baseCatchChance) && deepRune.baseCatchChance !== 0.36) {
            errors.push('deep_rune_harpoon baseCatchChance must remain 0.36');
        }

        const benchmarkRows = [
            { waterId: 'shallow_water', methodId: 'net', level: 1, fish: 0.28, xp: 5.6, gold: 0.28 },
            { waterId: 'shallow_water', methodId: 'rod', level: 10, fish: 0.28, xp: 14.0, gold: 1.96 },
            { waterId: 'shallow_water', methodId: 'rod', level: 20, fish: 0.36, xp: 19.8, gold: 2.7 },
            { waterId: 'shallow_water', methodId: 'rod', level: 30, fish: 0.44, xp: 25.52, gold: 3.432 },
            { waterId: 'shallow_water', methodId: 'harpoon', level: 30, fish: 0.32, xp: 25.6, gold: 3.52 },
            { waterId: 'deep_water', methodId: 'deep_harpoon_mixed', level: 40, fish: 0.36, xp: 30.96, gold: 4.5 },
            { waterId: 'deep_water', methodId: 'deep_rune_harpoon', level: 40, fish: 0.36, xp: 36.0, gold: 5.76 },
            { waterId: 'shallow_water', methodId: 'net', level: 40, fish: 0.592, xp: 11.84, gold: 0.592 },
            { waterId: 'shallow_water', methodId: 'rod', level: 40, fish: 0.52, xp: 30.16, gold: 4.056 },
            { waterId: 'shallow_water', methodId: 'harpoon', level: 40, fish: 0.4, xp: 32.0, gold: 4.4 }
        ];

        const metricsByKey = {};
        for (let i = 0; i < benchmarkRows.length; i++) {
            const benchmark = benchmarkRows[i];
            const metrics = computeFishingBalanceMetrics(fishingSpec, benchmark.waterId, benchmark.methodId, benchmark);
            const key = benchmark.methodId + '@' + benchmark.level;
            metricsByKey[key] = metrics;
            if (!metrics) {
                errors.push('missing fishing balance metrics for ' + benchmark.waterId + '.' + benchmark.methodId + '@' + benchmark.level);
                continue;
            }
            if (roundBalanceMetric(metrics.activeFishPerTick) !== benchmark.fish) {
                errors.push(benchmark.methodId + '@' + benchmark.level + ' expected fish/tick mismatch');
            }
            if (roundBalanceMetric(metrics.activeXpPerTick) !== benchmark.xp) {
                errors.push(benchmark.methodId + '@' + benchmark.level + ' expected xp/tick mismatch');
            }
            if (roundBalanceMetric(metrics.activeGoldPerTick) !== benchmark.gold) {
                errors.push(benchmark.methodId + '@' + benchmark.level + ' expected gold/tick mismatch');
            }
        }

        const rod10 = metricsByKey['rod@10'];
        const rod20 = metricsByKey['rod@20'];
        const rod30 = metricsByKey['rod@30'];
        const harpoon30 = metricsByKey['harpoon@30'];
        const harpoon40 = metricsByKey['harpoon@40'];
        const deepMixed40 = metricsByKey['deep_harpoon_mixed@40'];
        const deepRune40 = metricsByKey['deep_rune_harpoon@40'];

        if (rod10 && rod20) {
            if (!(rod20.activeXpPerTick > rod10.activeXpPerTick)) errors.push('rod@20 must beat rod@10 on gross xp/tick');
            if (!(rod20.activeGoldPerTick > rod10.activeGoldPerTick)) errors.push('rod@20 must beat rod@10 on gross gold/tick');
        }
        if (rod20 && rod30) {
            if (!(rod30.activeXpPerTick > rod20.activeXpPerTick)) errors.push('rod@30 must beat rod@20 on gross xp/tick');
            if (!(rod30.activeGoldPerTick > rod20.activeGoldPerTick)) errors.push('rod@30 must beat rod@20 on gross gold/tick');
        }
        if (rod30 && harpoon30) {
            if (!(harpoon30.activeXpPerTick > rod30.activeXpPerTick)) errors.push('harpoon@30 must beat rod@30 on gross xp/tick');
            if (!(harpoon30.activeGoldPerTick > rod30.activeGoldPerTick)) errors.push('harpoon@30 must beat rod@30 on gross gold/tick');
        }
        if (harpoon40 && deepMixed40) {
            const losesXp = deepMixed40.activeXpPerTick <= harpoon40.activeXpPerTick;
            const losesGold = deepMixed40.activeGoldPerTick <= harpoon40.activeGoldPerTick;
            if (losesXp && losesGold) {
                errors.push('deep_harpoon_mixed@40 must not lose to harpoon@40 on both gross xp/tick and gross gold/tick');
            }
        }
        if (deepMixed40 && deepRune40) {
            if (!(deepRune40.activeXpPerTick > deepMixed40.activeXpPerTick)) errors.push('deep_rune_harpoon@40 must beat deep_harpoon_mixed@40 on gross xp/tick');
            if (!(deepRune40.activeGoldPerTick > deepMixed40.activeGoldPerTick)) errors.push('deep_rune_harpoon@40 must beat deep_harpoon_mixed@40 on gross gold/tick');
        }

        if (errors.length > 0) {
            throw new Error('Fishing balance curve mismatch\n- ' + errors.join('\n- '));
        }
    }

    function validateCookingBalanceCurve(skillSpecs) {
        const cookingSpec = skillSpecs && skillSpecs.cooking ? skillSpecs.cooking : null;
        if (!cookingSpec || !cookingSpec.recipeSet) {
            throw new Error('Cooking balance curve mismatch\n- missing cooking recipe set');
        }

        const fishingSpec = skillSpecs && skillSpecs.fishing ? skillSpecs.fishing : null;
        const fishingValueTable = fishingSpec && fishingSpec.economy && fishingSpec.economy.valueTable && typeof fishingSpec.economy.valueTable === 'object'
            ? fishingSpec.economy.valueTable
            : null;
        const cookingValueTable = cookingSpec && cookingSpec.economy && cookingSpec.economy.valueTable && typeof cookingSpec.economy.valueTable === 'object'
            ? cookingSpec.economy.valueTable
            : null;
        if (!cookingValueTable) {
            throw new Error('Cooking balance curve mismatch\n- missing cooking value table');
        }

        const rows = Object.entries(cookingSpec.recipeSet || {})
            .map(([recipeId, recipe]) => ({ recipeId, recipe }))
            .sort((a, b) => {
                const aLevel = Number.isFinite(a.recipe && a.recipe.requiredLevel) ? a.recipe.requiredLevel : Number.MAX_SAFE_INTEGER;
                const bLevel = Number.isFinite(b.recipe && b.recipe.requiredLevel) ? b.recipe.requiredLevel : Number.MAX_SAFE_INTEGER;
                if (aLevel !== bLevel) return aLevel - bLevel;
                return a.recipeId.localeCompare(b.recipeId);
            });
        const levelBands = Array.isArray(cookingSpec.levelBands) ? cookingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const benchmarkLevel = levelBands.length > 0 ? Math.max(...levelBands) : 1;
        const errors = [];
        let prev = null;

        const benchmarkRows = [
            { recipeId: 'raw_shrimp', level: 1, cooked: 0.67, xp: 20.1, gold: 1.34 },
            { recipeId: 'raw_trout', level: 10, cooked: 0.67, xp: 46.9, gold: -0.64 },
            { recipeId: 'raw_salmon', level: 20, cooked: 0.67, xp: 60.3, gold: -0.63 },
            { recipeId: 'raw_tuna', level: 30, cooked: 0.67, xp: 80.4, gold: 0.05 },
            { recipeId: 'raw_swordfish', level: 40, cooked: 0.67, xp: 93.8, gold: -0.93 },
            { recipeId: 'raw_shrimp', level: 40, cooked: 1.0, xp: 30.0, gold: 2.0 },
            { recipeId: 'raw_trout', level: 40, cooked: 1.0, xp: 70.0, gold: 2.0 },
            { recipeId: 'raw_salmon', level: 40, cooked: 0.95, xp: 85.5, gold: 2.45 },
            { recipeId: 'raw_tuna', level: 40, cooked: 0.9, xp: 108.0, gold: 3.5 },
            { recipeId: 'raw_swordfish', level: 40, cooked: 0.67, xp: 93.8, gold: -0.93 }
        ];

        const metricsByKey = {};
        for (let i = 0; i < benchmarkRows.length; i++) {
            const benchmark = benchmarkRows[i];
            const metrics = computeCookingBalanceMetrics(cookingSpec, benchmark.recipeId, benchmark);
            const key = benchmark.recipeId + '@' + benchmark.level;
            metricsByKey[key] = metrics;
            if (!metrics) {
                errors.push('missing cooking balance metrics for ' + key);
                continue;
            }
            if (roundBalanceMetric(metrics.expectedCookedPerAction) !== benchmark.cooked) {
                errors.push(key + ' expected cooked/action mismatch');
            }
            if (roundBalanceMetric(metrics.expectedXpPerAction) !== benchmark.xp) {
                errors.push(key + ' expected xp/action mismatch');
            }
            if (roundBalanceMetric(metrics.expectedGoldDeltaPerAction) !== benchmark.gold) {
                errors.push(key + ' expected gold delta/action mismatch');
            }
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const recipe = row.recipe || {};
            if (recipe.sourceItemId === 'logs' || /_logs$/.test(String(recipe.sourceItemId || ''))) {
                errors.push(row.recipeId + ' should not consume logs directly');
            }
            const valueIds = [recipe.sourceItemId, recipe.cookedItemId, recipe.burntItemId];
            if (!Number.isFinite(recipe.requiredLevel)) errors.push(row.recipeId + ' missing requiredLevel');
            if (!Number.isFinite(recipe.xpPerSuccess)) errors.push(row.recipeId + ' missing xpPerSuccess');
            if (recipe.sourceTarget !== 'FIRE') errors.push(row.recipeId + ' should remain fire-source based');
            for (let j = 0; j < valueIds.length; j++) {
                const itemId = typeof valueIds[j] === 'string' ? valueIds[j] : '';
                const valueRow = itemId && cookingValueTable[itemId] && typeof cookingValueTable[itemId] === 'object'
                    ? cookingValueTable[itemId]
                    : null;
                if (!valueRow) {
                    errors.push(row.recipeId + ' missing cooking value row for ' + (itemId || 'unknown item'));
                    continue;
                }
                if (!Number.isFinite(valueRow.sell) || valueRow.sell < 0) {
                    errors.push(row.recipeId + ' missing valid sell value for ' + itemId);
                }
                if (fishingValueTable && fishingValueTable[itemId]) {
                    const fishingRow = fishingValueTable[itemId];
                    if (valueRow.buy !== fishingRow.buy || valueRow.sell !== fishingRow.sell) {
                        errors.push(row.recipeId + ' value row for ' + itemId + ' must stay aligned with fishing');
                    }
                }
            }

            const unlockMetrics = computeCookingBalanceMetrics(cookingSpec, row.recipeId, { level: recipe.requiredLevel });
            const benchmarkMetrics = computeCookingBalanceMetrics(cookingSpec, row.recipeId, { level: benchmarkLevel });
            if (!unlockMetrics || !benchmarkMetrics) {
                errors.push('missing cooking metrics for ' + row.recipeId);
                continue;
            }

            if (prev) {
                if (!(recipe.requiredLevel > prev.recipe.requiredLevel)) {
                    errors.push(row.recipeId + ' requiredLevel must increase by tier');
                }
                if (!(recipe.xpPerSuccess > prev.recipe.xpPerSuccess)) {
                    errors.push(row.recipeId + ' xpPerSuccess must increase by tier');
                }
                if (!(unlockMetrics.expectedXpPerAction > prev.unlockMetrics.expectedXpPerAction)) {
                    errors.push(row.recipeId + ' unlock expected xp/action must increase by tier');
                }
            }

            prev = {
                recipe,
                unlockMetrics,
                benchmarkMetrics
            };
        }

        const shrimp40 = metricsByKey['raw_shrimp@40'];
        const trout40 = metricsByKey['raw_trout@40'];
        const salmon40 = metricsByKey['raw_salmon@40'];
        const tuna40 = metricsByKey['raw_tuna@40'];
        const swordfish40 = metricsByKey['raw_swordfish@40'];

        if (shrimp40 && !(shrimp40.expectedGoldDeltaPerAction > 0)) {
            errors.push('raw_shrimp@40 should remain positive gold delta');
        }
        if (trout40 && !(trout40.expectedGoldDeltaPerAction > 0)) {
            errors.push('raw_trout@40 should remain positive gold delta');
        }
        if (salmon40 && trout40 && !(salmon40.expectedGoldDeltaPerAction > trout40.expectedGoldDeltaPerAction)) {
            errors.push('raw_salmon@40 should beat raw_trout@40 on gold delta');
        }
        if (tuna40 && salmon40 && !(tuna40.expectedXpPerAction > salmon40.expectedXpPerAction)) {
            errors.push('raw_tuna@40 should beat raw_salmon@40 on xp/action');
        }
        if (tuna40 && salmon40 && !(tuna40.expectedGoldDeltaPerAction > salmon40.expectedGoldDeltaPerAction)) {
            errors.push('raw_tuna@40 should beat raw_salmon@40 on gold delta');
        }
        if (swordfish40 && !(swordfish40.expectedGoldDeltaPerAction < 0)) {
            errors.push('raw_swordfish@40 should remain a negative-gold unlock inside the 1-40 cap');
        }

        if (errors.length > 0) {
            throw new Error('Cooking balance curve mismatch\n- ' + errors.join('\n- '));
        }
    }

    function computeFletchingBalanceMetrics(fletchingSpec, recipeId) {
        const recipeSet = fletchingSpec && fletchingSpec.recipeSet && typeof fletchingSpec.recipeSet === 'object'
            ? fletchingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const timing = fletchingSpec && fletchingSpec.timing && typeof fletchingSpec.timing === 'object'
            ? fletchingSpec.timing
            : {};
        const valueTable = fletchingSpec && fletchingSpec.economy && fletchingSpec.economy.valueTable && typeof fletchingSpec.economy.valueTable === 'object'
            ? fletchingSpec.economy.valueTable
            : {};
        const outputItemId = recipe.output && typeof recipe.output.itemId === 'string'
            ? recipe.output.itemId
            : '';
        const outputAmount = Number.isFinite(recipe.output && recipe.output.amount)
            ? recipe.output.amount
            : 1;
        const valueRow = outputItemId && valueTable[outputItemId] && typeof valueTable[outputItemId] === 'object'
            ? valueTable[outputItemId]
            : {};
        const sellValuePerUnit = Number.isFinite(valueRow.sell) ? valueRow.sell : null;
        const sellValuePerAction = sellValuePerUnit === null ? null : sellValuePerUnit * outputAmount;
        const actionTicks = Number.isFinite(recipe.actionTicks)
            ? recipe.actionTicks
            : (Number.isFinite(timing.actionTicks) ? timing.actionTicks : 1);
        const xpPerAction = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;

        return {
            recipeId,
            recipeFamily: typeof recipe.recipeFamily === 'string' ? recipe.recipeFamily : '',
            requiredLevel: Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1,
            actionTicks,
            outputItemId,
            outputAmount,
            xpPerAction,
            sellValuePerAction,
            xpPerTick: actionTicks > 0 ? xpPerAction / actionTicks : 0,
            sellValuePerTick: sellValuePerAction === null || actionTicks <= 0 ? null : sellValuePerAction / actionTicks
        };
    }

    function validateFletchingBalanceCurve(skillSpecs) {
        const fletchingSpec = skillSpecs && skillSpecs.fletching ? skillSpecs.fletching : null;
        if (!fletchingSpec || !fletchingSpec.recipeSet) {
            throw new Error('Fletching balance curve mismatch\n- missing fletching recipe set');
        }

        const valueTable = fletchingSpec.economy && fletchingSpec.economy.valueTable && typeof fletchingSpec.economy.valueTable === 'object'
            ? fletchingSpec.economy.valueTable
            : null;
        if (!valueTable) {
            throw new Error('Fletching balance curve mismatch\n- missing fletching value table');
        }

        const errors = [];
        const requiredRecipes = [
            'fletch_wooden_handle',
            'fletch_oak_handle',
            'fletch_willow_handle',
            'fletch_maple_handle',
            'fletch_yew_handle',
            'fletch_plain_staff_wood',
            'fletch_plain_staff_oak',
            'fletch_plain_staff_willow',
            'fletch_plain_staff_maple',
            'fletch_plain_staff_yew',
            'fletch_wooden_shafts',
            'fletch_oak_shafts',
            'fletch_willow_shafts',
            'fletch_maple_shafts',
            'fletch_yew_shafts',
            'fletch_wooden_headless_arrows',
            'fletch_oak_headless_arrows',
            'fletch_willow_headless_arrows',
            'fletch_maple_headless_arrows',
            'fletch_yew_headless_arrows',
            'fletch_normal_longbow_u',
            'fletch_oak_longbow_u',
            'fletch_willow_longbow_u',
            'fletch_maple_longbow_u',
            'fletch_yew_longbow_u',
            'fletch_normal_shortbow_u',
            'fletch_oak_shortbow_u',
            'fletch_willow_shortbow_u',
            'fletch_maple_shortbow_u',
            'fletch_yew_shortbow_u',
            'fletch_normal_longbow',
            'fletch_oak_longbow',
            'fletch_willow_longbow',
            'fletch_maple_longbow',
            'fletch_yew_longbow',
            'fletch_normal_shortbow',
            'fletch_oak_shortbow',
            'fletch_willow_shortbow',
            'fletch_maple_shortbow',
            'fletch_yew_shortbow',
            'fletch_bronze_arrows',
            'fletch_iron_arrows',
            'fletch_steel_arrows',
            'fletch_mithril_arrows',
            'fletch_adamant_arrows',
            'fletch_rune_arrows'
        ];
        for (let i = 0; i < requiredRecipes.length; i++) {
            if (!fletchingSpec.recipeSet[requiredRecipes[i]]) {
                errors.push('missing fletching recipe ' + requiredRecipes[i]);
            }
        }

        const metricsById = {};
        function getMetrics(recipeId) {
            if (!metricsById[recipeId]) {
                metricsById[recipeId] = computeFletchingBalanceMetrics(fletchingSpec, recipeId);
            }
            return metricsById[recipeId];
        }

        const benchmarkRows = [
            { recipeId: 'fletch_wooden_handle', requiredLevel: 1, xp: 6, sell: 6, xpPerTick: 2, sellPerTick: 2 },
            { recipeId: 'fletch_oak_handle', requiredLevel: 10, xp: 9, sell: 12, xpPerTick: 3, sellPerTick: 4 },
            { recipeId: 'fletch_willow_handle', requiredLevel: 20, xp: 16, sell: 20, xpPerTick: 5.3333, sellPerTick: 6.6667 },
            { recipeId: 'fletch_maple_handle', requiredLevel: 30, xp: 24, sell: 32, xpPerTick: 8, sellPerTick: 10.6667 },
            { recipeId: 'fletch_yew_handle', requiredLevel: 40, xp: 36, sell: 50, xpPerTick: 12, sellPerTick: 16.6667 },
            { recipeId: 'fletch_bronze_arrows', requiredLevel: 1, xp: 2, sell: 8, xpPerTick: 0.6667, sellPerTick: 2.6667 },
            { recipeId: 'fletch_iron_arrows', requiredLevel: 5, xp: 3, sell: 12, xpPerTick: 1, sellPerTick: 4 },
            { recipeId: 'fletch_steel_arrows', requiredLevel: 12, xp: 5, sell: 20, xpPerTick: 1.6667, sellPerTick: 6.6667 },
            { recipeId: 'fletch_mithril_arrows', requiredLevel: 23, xp: 10, sell: 32, xpPerTick: 3.3333, sellPerTick: 10.6667 },
            { recipeId: 'fletch_adamant_arrows', requiredLevel: 34, xp: 15, sell: 50, xpPerTick: 5, sellPerTick: 16.6667 },
            { recipeId: 'fletch_rune_arrows', requiredLevel: 45, xp: 23, sell: 80, xpPerTick: 7.6667, sellPerTick: 26.6667 },
            { recipeId: 'fletch_normal_longbow', requiredLevel: 3, xp: 3, sell: 10, xpPerTick: 1, sellPerTick: 3.3333 },
            { recipeId: 'fletch_oak_longbow', requiredLevel: 12, xp: 5, sell: 20, xpPerTick: 1.6667, sellPerTick: 6.6667 },
            { recipeId: 'fletch_willow_longbow', requiredLevel: 22, xp: 8, sell: 36, xpPerTick: 2.6667, sellPerTick: 12 },
            { recipeId: 'fletch_maple_longbow', requiredLevel: 32, xp: 12, sell: 62, xpPerTick: 4, sellPerTick: 20.6667 },
            { recipeId: 'fletch_yew_longbow', requiredLevel: 42, xp: 18, sell: 100, xpPerTick: 6, sellPerTick: 33.3333 },
            { recipeId: 'fletch_normal_shortbow', requiredLevel: 5, xp: 4, sell: 12, xpPerTick: 1.3333, sellPerTick: 4 },
            { recipeId: 'fletch_oak_shortbow', requiredLevel: 14, xp: 6, sell: 22, xpPerTick: 2, sellPerTick: 7.3333 },
            { recipeId: 'fletch_willow_shortbow', requiredLevel: 24, xp: 11, sell: 40, xpPerTick: 3.6667, sellPerTick: 13.3333 },
            { recipeId: 'fletch_maple_shortbow', requiredLevel: 34, xp: 16, sell: 68, xpPerTick: 5.3333, sellPerTick: 22.6667 },
            { recipeId: 'fletch_yew_shortbow', requiredLevel: 44, xp: 24, sell: 110, xpPerTick: 8, sellPerTick: 36.6667 }
        ];

        for (let i = 0; i < benchmarkRows.length; i++) {
            const benchmark = benchmarkRows[i];
            const metrics = getMetrics(benchmark.recipeId);
            if (!metrics) {
                errors.push('missing fletching balance metrics for ' + benchmark.recipeId);
                continue;
            }
            if (metrics.requiredLevel !== benchmark.requiredLevel) {
                errors.push(benchmark.recipeId + ' requiredLevel mismatch');
            }
            if (metrics.xpPerAction !== benchmark.xp) {
                errors.push(benchmark.recipeId + ' xp/action mismatch');
            }
            if (metrics.sellValuePerAction !== benchmark.sell) {
                errors.push(benchmark.recipeId + ' sell value/action mismatch');
            }
            if (roundBalanceMetric(metrics.xpPerTick) !== benchmark.xpPerTick) {
                errors.push(benchmark.recipeId + ' xp/tick mismatch');
            }
            if (roundBalanceMetric(metrics.sellValuePerTick) !== benchmark.sellPerTick) {
                errors.push(benchmark.recipeId + ' sell value/tick mismatch');
            }
        }

        function validateIncreasingLane(recipeIds, label) {
            let prev = null;
            for (let i = 0; i < recipeIds.length; i++) {
                const metrics = getMetrics(recipeIds[i]);
                if (!metrics) {
                    errors.push('missing ' + label + ' metrics for ' + recipeIds[i]);
                    continue;
                }
                if (prev) {
                    if (!(metrics.requiredLevel > prev.requiredLevel)) {
                        errors.push(label + ' requiredLevel must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.xpPerAction > prev.xpPerAction)) {
                        errors.push(label + ' xp/action must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.sellValuePerAction > prev.sellValuePerAction)) {
                        errors.push(label + ' sell value/action must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.xpPerTick > prev.xpPerTick)) {
                        errors.push(label + ' xp/tick must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.sellValuePerTick > prev.sellValuePerTick)) {
                        errors.push(label + ' sell value/tick must increase at ' + recipeIds[i]);
                    }
                }
                prev = metrics;
            }
        }

        const tierPairs = [
            {
                label: 'wooden',
                handle: 'fletch_wooden_handle',
                staff: 'fletch_plain_staff_wood',
                shafts: 'fletch_wooden_shafts',
                headless: 'fletch_wooden_headless_arrows',
                longbowU: 'fletch_normal_longbow_u',
                shortbowU: 'fletch_normal_shortbow_u',
                longbow: 'fletch_normal_longbow',
                shortbow: 'fletch_normal_shortbow'
            },
            {
                label: 'oak',
                handle: 'fletch_oak_handle',
                staff: 'fletch_plain_staff_oak',
                shafts: 'fletch_oak_shafts',
                headless: 'fletch_oak_headless_arrows',
                longbowU: 'fletch_oak_longbow_u',
                shortbowU: 'fletch_oak_shortbow_u',
                longbow: 'fletch_oak_longbow',
                shortbow: 'fletch_oak_shortbow'
            },
            {
                label: 'willow',
                handle: 'fletch_willow_handle',
                staff: 'fletch_plain_staff_willow',
                shafts: 'fletch_willow_shafts',
                headless: 'fletch_willow_headless_arrows',
                longbowU: 'fletch_willow_longbow_u',
                shortbowU: 'fletch_willow_shortbow_u',
                longbow: 'fletch_willow_longbow',
                shortbow: 'fletch_willow_shortbow'
            },
            {
                label: 'maple',
                handle: 'fletch_maple_handle',
                staff: 'fletch_plain_staff_maple',
                shafts: 'fletch_maple_shafts',
                headless: 'fletch_maple_headless_arrows',
                longbowU: 'fletch_maple_longbow_u',
                shortbowU: 'fletch_maple_shortbow_u',
                longbow: 'fletch_maple_longbow',
                shortbow: 'fletch_maple_shortbow'
            },
            {
                label: 'yew',
                handle: 'fletch_yew_handle',
                staff: 'fletch_plain_staff_yew',
                shafts: 'fletch_yew_shafts',
                headless: 'fletch_yew_headless_arrows',
                longbowU: 'fletch_yew_longbow_u',
                shortbowU: 'fletch_yew_shortbow_u',
                longbow: 'fletch_yew_longbow',
                shortbow: 'fletch_yew_shortbow'
            }
        ];

        for (let i = 0; i < tierPairs.length; i++) {
            const pair = tierPairs[i];
            const handle = getMetrics(pair.handle);
            const staff = getMetrics(pair.staff);
            const shafts = getMetrics(pair.shafts);
            const headless = getMetrics(pair.headless);
            const longbowU = getMetrics(pair.longbowU);
            const shortbowU = getMetrics(pair.shortbowU);
            const longbow = getMetrics(pair.longbow);
            const shortbow = getMetrics(pair.shortbow);
            if (!handle || !staff || !shafts || !headless || !longbowU || !shortbowU || !longbow || !shortbow) {
                errors.push(pair.label + ' tier metrics incomplete');
                continue;
            }

            if (!(staff.xpPerAction === handle.xpPerAction)) {
                errors.push(pair.label + ' staff XP must match handle XP');
            }
            if (!(staff.sellValuePerAction === handle.sellValuePerAction)) {
                errors.push(pair.label + ' staff sell value must match handle sell value');
            }
            if (!(headless.xpPerAction === shafts.xpPerAction)) {
                errors.push(pair.label + ' headless arrows XP must match shafts XP');
            }
            if (!(headless.sellValuePerAction > shafts.sellValuePerAction)) {
                errors.push(pair.label + ' headless arrows must beat shafts on sell value');
            }
            if (!(shortbowU.xpPerAction > longbowU.xpPerAction)) {
                errors.push(pair.label + ' shortbow (u) must beat longbow (u) on XP');
            }
            if (!(shortbowU.sellValuePerAction > longbowU.sellValuePerAction)) {
                errors.push(pair.label + ' shortbow (u) must beat longbow (u) on sell value');
            }
            if (!(shortbow.xpPerAction > longbow.xpPerAction)) {
                errors.push(pair.label + ' shortbow must beat longbow on XP');
            }
            if (!(shortbow.sellValuePerAction > longbow.sellValuePerAction)) {
                errors.push(pair.label + ' shortbow must beat longbow on sell value');
            }
            if (!(shortbowU.xpPerAction > shortbow.xpPerAction)) {
                errors.push(pair.label + ' shortbow (u) must stay the higher-XP bow-cut step');
            }
            if (!(longbowU.xpPerAction > longbow.xpPerAction)) {
                errors.push(pair.label + ' longbow (u) must stay the higher-XP bow-cut step');
            }
            if (!(shortbow.sellValuePerAction > shortbowU.sellValuePerAction)) {
                errors.push(pair.label + ' shortbow must add sell value over shortbow (u)');
            }
            if (!(longbow.sellValuePerAction > longbowU.sellValuePerAction)) {
                errors.push(pair.label + ' longbow must add sell value over longbow (u)');
            }
        }

        validateIncreasingLane(['fletch_wooden_handle', 'fletch_oak_handle', 'fletch_willow_handle', 'fletch_maple_handle', 'fletch_yew_handle'], 'handle lane');
        validateIncreasingLane(['fletch_plain_staff_wood', 'fletch_plain_staff_oak', 'fletch_plain_staff_willow', 'fletch_plain_staff_maple', 'fletch_plain_staff_yew'], 'staff lane');
        validateIncreasingLane(['fletch_wooden_shafts', 'fletch_oak_shafts', 'fletch_willow_shafts', 'fletch_maple_shafts', 'fletch_yew_shafts'], 'shafts lane');
        validateIncreasingLane(['fletch_wooden_headless_arrows', 'fletch_oak_headless_arrows', 'fletch_willow_headless_arrows', 'fletch_maple_headless_arrows', 'fletch_yew_headless_arrows'], 'headless lane');
        validateIncreasingLane(['fletch_normal_longbow_u', 'fletch_oak_longbow_u', 'fletch_willow_longbow_u', 'fletch_maple_longbow_u', 'fletch_yew_longbow_u'], 'longbow (u) lane');
        validateIncreasingLane(['fletch_normal_shortbow_u', 'fletch_oak_shortbow_u', 'fletch_willow_shortbow_u', 'fletch_maple_shortbow_u', 'fletch_yew_shortbow_u'], 'shortbow (u) lane');
        validateIncreasingLane(['fletch_normal_longbow', 'fletch_oak_longbow', 'fletch_willow_longbow', 'fletch_maple_longbow', 'fletch_yew_longbow'], 'longbow lane');
        validateIncreasingLane(['fletch_normal_shortbow', 'fletch_oak_shortbow', 'fletch_willow_shortbow', 'fletch_maple_shortbow', 'fletch_yew_shortbow'], 'shortbow lane');
        validateIncreasingLane(['fletch_bronze_arrows', 'fletch_iron_arrows', 'fletch_steel_arrows', 'fletch_mithril_arrows', 'fletch_adamant_arrows', 'fletch_rune_arrows'], 'finished arrow lane');

        if (errors.length > 0) {
            throw new Error('Fletching balance curve mismatch\n- ' + errors.join('\n- '));
        }
    }

    function computeCraftingBalanceMetrics(craftingSpec, recipeId) {
        const recipeSet = craftingSpec && craftingSpec.recipeSet && typeof craftingSpec.recipeSet === 'object'
            ? craftingSpec.recipeSet
            : {};
        const recipe = recipeSet[recipeId];
        if (!recipe || typeof recipe !== 'object') return null;

        const timing = craftingSpec && craftingSpec.timing && typeof craftingSpec.timing === 'object'
            ? craftingSpec.timing
            : {};
        const valueTable = craftingSpec && craftingSpec.economy && craftingSpec.economy.valueTable && typeof craftingSpec.economy.valueTable === 'object'
            ? craftingSpec.economy.valueTable
            : {};
        const outputItemId = recipe.output && typeof recipe.output.itemId === 'string'
            ? recipe.output.itemId
            : '';
        const outputAmount = Number.isFinite(recipe.output && recipe.output.amount)
            ? recipe.output.amount
            : 1;
        const valueRow = outputItemId && valueTable[outputItemId] && typeof valueTable[outputItemId] === 'object'
            ? valueTable[outputItemId]
            : {};
        const sellValuePerUnit = Number.isFinite(valueRow.sell) ? valueRow.sell : null;
        const sellValuePerAction = sellValuePerUnit === null ? null : sellValuePerUnit * outputAmount;
        const actionTicks = Number.isFinite(recipe.actionTicks)
            ? recipe.actionTicks
            : (Number.isFinite(timing.actionTicks) ? timing.actionTicks : 1);
        const xpPerAction = Number.isFinite(recipe.xpPerAction) ? recipe.xpPerAction : 0;

        return {
            recipeId,
            recipeFamily: typeof recipe.recipeFamily === 'string' ? recipe.recipeFamily : '',
            requiredLevel: Number.isFinite(recipe.requiredLevel) ? recipe.requiredLevel : 1,
            actionTicks,
            outputItemId,
            outputAmount,
            xpPerAction,
            sellValuePerAction,
            xpPerTick: actionTicks > 0 ? xpPerAction / actionTicks : 0,
            sellValuePerTick: sellValuePerAction === null || actionTicks <= 0 ? null : sellValuePerAction / actionTicks
        };
    }

    function validateCraftingBalanceCurve(skillSpecs) {
        const craftingSpec = skillSpecs && skillSpecs.crafting ? skillSpecs.crafting : null;
        if (!craftingSpec || !craftingSpec.recipeSet) {
            throw new Error('Crafting balance curve mismatch\n- missing crafting recipe set');
        }

        const valueTable = craftingSpec.economy && craftingSpec.economy.valueTable && typeof craftingSpec.economy.valueTable === 'object'
            ? craftingSpec.economy.valueTable
            : null;
        if (!valueTable) {
            throw new Error('Crafting balance curve mismatch\n- missing crafting value table');
        }

        const errors = [];
        const requiredRecipes = [
            'craft_soft_clay',
            'craft_wooden_handle_strapped',
            'craft_oak_handle_strapped',
            'craft_willow_handle_strapped',
            'craft_maple_handle_strapped',
            'craft_yew_handle_strapped',
            'cut_ruby',
            'cut_sapphire',
            'cut_emerald',
            'cut_diamond',
            'craft_fire_staff',
            'craft_water_staff',
            'craft_earth_staff',
            'craft_air_staff',
            'craft_ruby_silver_ring',
            'craft_sapphire_silver_ring',
            'craft_ruby_gold_ring',
            'craft_sapphire_gold_ring',
            'craft_emerald_gold_ring',
            'craft_diamond_gold_ring'
        ];
        for (let i = 0; i < requiredRecipes.length; i++) {
            if (!craftingSpec.recipeSet[requiredRecipes[i]]) {
                errors.push('missing crafting recipe ' + requiredRecipes[i]);
            }
        }

        const metricsById = {};
        function getMetrics(recipeId) {
            if (!metricsById[recipeId]) {
                metricsById[recipeId] = computeCraftingBalanceMetrics(craftingSpec, recipeId);
            }
            return metricsById[recipeId];
        }

        const benchmarkRows = [
            { recipeId: 'craft_wooden_handle_strapped', requiredLevel: 1, xp: 2, sell: 10, xpPerTick: 2, sellPerTick: 10 },
            { recipeId: 'craft_oak_handle_strapped', requiredLevel: 10, xp: 4, sell: 16, xpPerTick: 4, sellPerTick: 16 },
            { recipeId: 'craft_willow_handle_strapped', requiredLevel: 20, xp: 8, sell: 32, xpPerTick: 8, sellPerTick: 32 },
            { recipeId: 'craft_maple_handle_strapped', requiredLevel: 30, xp: 12, sell: 44, xpPerTick: 12, sellPerTick: 44 },
            { recipeId: 'craft_yew_handle_strapped', requiredLevel: 40, xp: 18, sell: 76, xpPerTick: 18, sellPerTick: 76 },
            { recipeId: 'cut_ruby', requiredLevel: 10, xp: 4, sell: 12, xpPerTick: 1.3333, sellPerTick: 4 },
            { recipeId: 'cut_sapphire', requiredLevel: 20, xp: 8, sell: 32, xpPerTick: 2.6667, sellPerTick: 10.6667 },
            { recipeId: 'cut_emerald', requiredLevel: 30, xp: 14, sell: 60, xpPerTick: 4.6667, sellPerTick: 20 },
            { recipeId: 'cut_diamond', requiredLevel: 40, xp: 22, sell: 100, xpPerTick: 7.3333, sellPerTick: 33.3333 },
            { recipeId: 'craft_fire_staff', requiredLevel: 10, xp: 4, sell: 24, xpPerTick: 1.3333, sellPerTick: 8 },
            { recipeId: 'craft_water_staff', requiredLevel: 20, xp: 8, sell: 52, xpPerTick: 2.6667, sellPerTick: 17.3333 },
            { recipeId: 'craft_earth_staff', requiredLevel: 30, xp: 14, sell: 92, xpPerTick: 4.6667, sellPerTick: 30.6667 },
            { recipeId: 'craft_air_staff', requiredLevel: 40, xp: 22, sell: 150, xpPerTick: 7.3333, sellPerTick: 50 },
            { recipeId: 'craft_ruby_silver_ring', requiredLevel: 10, xp: 4, sell: 32, xpPerTick: 1.3333, sellPerTick: 10.6667 },
            { recipeId: 'craft_sapphire_silver_ring', requiredLevel: 20, xp: 8, sell: 52, xpPerTick: 2.6667, sellPerTick: 17.3333 },
            { recipeId: 'craft_ruby_gold_ring', requiredLevel: 40, xp: 4, sell: 44, xpPerTick: 1.3333, sellPerTick: 14.6667 },
            { recipeId: 'craft_sapphire_gold_ring', requiredLevel: 40, xp: 8, sell: 64, xpPerTick: 2.6667, sellPerTick: 21.3333 },
            { recipeId: 'craft_emerald_gold_ring', requiredLevel: 40, xp: 14, sell: 92, xpPerTick: 4.6667, sellPerTick: 30.6667 },
            { recipeId: 'craft_diamond_gold_ring', requiredLevel: 40, xp: 22, sell: 132, xpPerTick: 7.3333, sellPerTick: 44 }
        ];

        for (let i = 0; i < benchmarkRows.length; i++) {
            const benchmark = benchmarkRows[i];
            const metrics = getMetrics(benchmark.recipeId);
            if (!metrics) {
                errors.push('missing crafting balance metrics for ' + benchmark.recipeId);
                continue;
            }
            if (metrics.requiredLevel !== benchmark.requiredLevel) {
                errors.push(benchmark.recipeId + ' requiredLevel mismatch');
            }
            if (metrics.xpPerAction !== benchmark.xp) {
                errors.push(benchmark.recipeId + ' xp/action mismatch');
            }
            if (metrics.sellValuePerAction !== benchmark.sell) {
                errors.push(benchmark.recipeId + ' sell value/action mismatch');
            }
            if (roundBalanceMetric(metrics.xpPerTick) !== benchmark.xpPerTick) {
                errors.push(benchmark.recipeId + ' xp/tick mismatch');
            }
            if (roundBalanceMetric(metrics.sellValuePerTick) !== benchmark.sellPerTick) {
                errors.push(benchmark.recipeId + ' sell value/tick mismatch');
            }
        }

        function validateIncreasingLane(recipeIds, label, options = {}) {
            let prev = null;
            const requireLevelIncrease = options.requireLevelIncrease !== false;
            for (let i = 0; i < recipeIds.length; i++) {
                const metrics = getMetrics(recipeIds[i]);
                if (!metrics) {
                    errors.push('missing ' + label + ' metrics for ' + recipeIds[i]);
                    continue;
                }
                if (prev) {
                    if (requireLevelIncrease && !(metrics.requiredLevel > prev.requiredLevel)) {
                        errors.push(label + ' requiredLevel must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.xpPerAction > prev.xpPerAction)) {
                        errors.push(label + ' xp/action must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.sellValuePerAction > prev.sellValuePerAction)) {
                        errors.push(label + ' sell value/action must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.xpPerTick > prev.xpPerTick)) {
                        errors.push(label + ' xp/tick must increase at ' + recipeIds[i]);
                    }
                    if (!(metrics.sellValuePerTick > prev.sellValuePerTick)) {
                        errors.push(label + ' sell value/tick must increase at ' + recipeIds[i]);
                    }
                }
                prev = metrics;
            }
        }

        validateIncreasingLane([
            'craft_wooden_handle_strapped',
            'craft_oak_handle_strapped',
            'craft_willow_handle_strapped',
            'craft_maple_handle_strapped',
            'craft_yew_handle_strapped'
        ], 'strapped handle lane');

        validateIncreasingLane([
            'cut_ruby',
            'cut_sapphire',
            'cut_emerald',
            'cut_diamond'
        ], 'gem cutting lane');

        validateIncreasingLane([
            'craft_fire_staff',
            'craft_water_staff',
            'craft_earth_staff',
            'craft_air_staff'
        ], 'elemental staff lane');

        validateIncreasingLane([
            'craft_ruby_silver_ring',
            'craft_sapphire_silver_ring'
        ], 'silver jewelry lane');

        validateIncreasingLane([
            'craft_ruby_gold_ring',
            'craft_sapphire_gold_ring',
            'craft_emerald_gold_ring',
            'craft_diamond_gold_ring'
        ], 'gold jewelry lane', { requireLevelIncrease: false });

        const compositionFamilies = new Set(['staff_attachment', 'jewelry_gem_attachment']);
        const craftingRecipeIds = Object.keys(craftingSpec.recipeSet);
        for (let i = 0; i < craftingRecipeIds.length; i++) {
            const recipeId = craftingRecipeIds[i];
            const recipe = craftingSpec.recipeSet[recipeId];
            if (!recipe || !compositionFamilies.has(recipe.recipeFamily)) continue;
            const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
            if (inputs.length !== 2) {
                errors.push(recipeId + ' must keep exactly two inputs for value composition');
                continue;
            }
            const firstValue = valueTable[inputs[0].itemId];
            const secondValue = valueTable[inputs[1].itemId];
            const outputValue = recipe.output && valueTable[recipe.output.itemId];
            if (!firstValue || !secondValue || !outputValue) {
                errors.push(recipeId + ' is missing value-table coverage for composition checks');
                continue;
            }
            const expectedSell = firstValue.sell + secondValue.sell;
            if (outputValue.sell !== expectedSell) {
                errors.push(recipe.output.itemId + ' sell value should equal ' + inputs[0].itemId + ' + ' + inputs[1].itemId);
            }
        }

        if (errors.length > 0) {
            throw new Error('Crafting balance curve mismatch\n- ' + errors.join('\n- '));
        }
    }

    function computeWoodcuttingBalanceMetrics(woodcuttingSpec, nodeId, benchmark) {
        const nodeTable = woodcuttingSpec && woodcuttingSpec.nodeTable && typeof woodcuttingSpec.nodeTable === 'object'
            ? woodcuttingSpec.nodeTable
            : {};
        const node = nodeTable[nodeId];
        if (!node || typeof node !== 'object') return null;

        const timing = woodcuttingSpec && woodcuttingSpec.timing && typeof woodcuttingSpec.timing === 'object'
            ? woodcuttingSpec.timing
            : {};
        const valueTable = woodcuttingSpec && woodcuttingSpec.economy && woodcuttingSpec.economy.valueTable && typeof woodcuttingSpec.economy.valueTable === 'object'
            ? woodcuttingSpec.economy.valueTable
            : {};
        const logValueRow = valueTable[node.rewardItemId] && typeof valueTable[node.rewardItemId] === 'object'
            ? valueTable[node.rewardItemId]
            : {};
        const level = Number.isFinite(benchmark && benchmark.level) ? benchmark.level : 1;
        const toolPower = Number.isFinite(benchmark && benchmark.toolPower) ? benchmark.toolPower : 0;
        const speedBonusTicks = Number.isFinite(benchmark && benchmark.speedBonusTicks) ? benchmark.speedBonusTicks : 0;
        const difficulty = Math.max(1, Number.isFinite(node.difficulty) ? node.difficulty : 1);
        const successScore = Math.max(1, level + toolPower);
        const successChance = successScore / (successScore + difficulty);
        const intervalTicks = Math.max(
            Number.isFinite(timing.minimumAttemptTicks) ? timing.minimumAttemptTicks : 1,
            (Number.isFinite(timing.baseAttemptTicks) ? timing.baseAttemptTicks : 1) - speedBonusTicks
        );
        const activeLogsPerTick = successChance / intervalTicks;
        const sellValue = Number.isFinite(logValueRow.sell) ? logValueRow.sell : 0;
        const activeXpPerTick = activeLogsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const activeGoldPerTick = activeLogsPerTick * sellValue;
        const expectedLogsPerNode = Number.isFinite(node.depletionChance) && node.depletionChance > 0
            ? 1 / node.depletionChance
            : null;
        const activeTicksPerNode = expectedLogsPerNode && activeLogsPerTick > 0
            ? expectedLogsPerNode / activeLogsPerTick
            : null;
        const respawnTicks = Number.isFinite(node.respawnTicks) ? node.respawnTicks : 0;
        const sustainedLogsPerTick = expectedLogsPerNode && activeTicksPerNode !== null
            ? expectedLogsPerNode / (activeTicksPerNode + Math.max(0, respawnTicks))
            : activeLogsPerTick;
        const sustainedXpPerTick = sustainedLogsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const sustainedGoldPerTick = sustainedLogsPerTick * sellValue;

        return {
            nodeId,
            activeXpPerTick,
            activeGoldPerTick,
            sustainedXpPerTick,
            sustainedGoldPerTick,
            sellValue
        };
    }

    function validateWoodcuttingBalanceCurve(skillSpecs) {
        const woodcuttingSpec = skillSpecs && skillSpecs.woodcutting ? skillSpecs.woodcutting : null;
        if (!woodcuttingSpec || !woodcuttingSpec.nodeTable) {
            throw new Error('Woodcutting balance curve mismatch\n- missing woodcutting node table');
        }

        const rows = Object.entries(woodcuttingSpec.nodeTable || {})
            .map(([nodeId, node]) => ({ nodeId, node }))
            .sort((a, b) => {
                const aLevel = Number.isFinite(a.node && a.node.requiredLevel) ? a.node.requiredLevel : Number.MAX_SAFE_INTEGER;
                const bLevel = Number.isFinite(b.node && b.node.requiredLevel) ? b.node.requiredLevel : Number.MAX_SAFE_INTEGER;
                if (aLevel !== bLevel) return aLevel - bLevel;
                return a.nodeId.localeCompare(b.nodeId);
            });
        const levelBands = Array.isArray(woodcuttingSpec.levelBands) ? woodcuttingSpec.levelBands.filter((value) => Number.isFinite(value)) : [];
        const benchmark = {
            level: levelBands.length > 0 ? Math.max(...levelBands) : 1,
            toolPower: 28,
            speedBonusTicks: 5
        };
        const errors = [];
        let prev = null;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const node = row.node || {};
            const metrics = computeWoodcuttingBalanceMetrics(woodcuttingSpec, row.nodeId, benchmark);
            if (!metrics) {
                errors.push('missing balance metrics for ' + row.nodeId);
                continue;
            }

            if (!Number.isFinite(node.requiredLevel)) errors.push(row.nodeId + ' missing requiredLevel');
            if (!Number.isFinite(node.difficulty)) errors.push(row.nodeId + ' missing difficulty');
            if (!Number.isFinite(node.xpPerSuccess)) errors.push(row.nodeId + ' missing xpPerSuccess');
            if (!Number.isFinite(node.depletionChance)) errors.push(row.nodeId + ' missing depletionChance');
            if (!Number.isFinite(node.respawnTicks)) errors.push(row.nodeId + ' missing respawnTicks');
            if (!Number.isFinite(metrics.sellValue) || metrics.sellValue <= 0) errors.push(row.nodeId + ' missing positive sell value');

            if (prev) {
                if (!(node.requiredLevel > prev.node.requiredLevel)) {
                    errors.push(row.nodeId + ' requiredLevel must increase by tier');
                }
                if (!(node.difficulty > prev.node.difficulty)) {
                    errors.push(row.nodeId + ' difficulty must increase by tier');
                }
                if (!(node.xpPerSuccess > prev.node.xpPerSuccess)) {
                    errors.push(row.nodeId + ' xpPerSuccess must increase by tier');
                }
                if (!(node.respawnTicks > prev.node.respawnTicks)) {
                    errors.push(row.nodeId + ' respawnTicks must increase by tier');
                }
                if (!(node.depletionChance < prev.node.depletionChance)) {
                    errors.push(row.nodeId + ' depletionChance must decrease by tier so higher trees last longer');
                }
                if (!(metrics.sellValue > prev.metrics.sellValue)) {
                    errors.push(row.nodeId + ' sell value must increase by tier');
                }
                if (!(metrics.activeXpPerTick > prev.metrics.activeXpPerTick)) {
                    errors.push(row.nodeId + ' active xp/tick must increase under the standardized benchmark');
                }
                if (!(metrics.activeGoldPerTick > prev.metrics.activeGoldPerTick)) {
                    errors.push(row.nodeId + ' active gold/tick must increase under the standardized benchmark');
                }
                if (!(metrics.sustainedXpPerTick > prev.metrics.sustainedXpPerTick)) {
                    errors.push(row.nodeId + ' sustained xp/tick must increase under the standardized benchmark');
                }
                if (!(metrics.sustainedGoldPerTick > prev.metrics.sustainedGoldPerTick)) {
                    errors.push(row.nodeId + ' sustained gold/tick must increase under the standardized benchmark');
                }
            }

            prev = { node, metrics };
        }

        if (errors.length > 0) {
            throw new Error('Woodcutting balance curve mismatch\n- ' + errors.join('\n- '));
        }
    }

    function computeExpectedDepletingYieldCount(node) {
        const minimumYields = Number.isFinite(node && node.minimumYields) ? Math.max(1, Math.floor(node.minimumYields)) : null;
        const maximumYields = Number.isFinite(node && node.maximumYields) ? Math.max(minimumYields || 1, Math.floor(node.maximumYields)) : null;
        const depletionChance = Number.isFinite(node && node.depletionChance)
            ? Math.max(0, Math.min(1, node.depletionChance))
            : null;
        if (!Number.isFinite(minimumYields) || !Number.isFinite(maximumYields) || depletionChance === null) return null;

        let expectedYields = minimumYields;
        for (let yieldCount = minimumYields + 1; yieldCount <= maximumYields; yieldCount++) {
            expectedYields += Math.pow(1 - depletionChance, yieldCount - minimumYields);
        }
        return expectedYields;
    }

    function computeMiningBalanceMetrics(miningSpec, nodeId, benchmark) {
        const nodeTable = miningSpec && miningSpec.nodeTable && typeof miningSpec.nodeTable === 'object'
            ? miningSpec.nodeTable
            : {};
        const node = nodeTable[nodeId];
        if (!node || typeof node !== 'object') return null;

        const timing = miningSpec && miningSpec.timing && typeof miningSpec.timing === 'object'
            ? miningSpec.timing
            : {};
        const valueTable = miningSpec && miningSpec.economy && miningSpec.economy.valueTable && typeof miningSpec.economy.valueTable === 'object'
            ? miningSpec.economy.valueTable
            : {};
        const rewardValueRow = valueTable[node.rewardItemId] && typeof valueTable[node.rewardItemId] === 'object'
            ? valueTable[node.rewardItemId]
            : {};
        const level = Number.isFinite(benchmark && benchmark.level) ? benchmark.level : 1;
        const toolPower = Number.isFinite(benchmark && benchmark.toolPower) ? benchmark.toolPower : 0;
        const speedBonusTicks = Number.isFinite(benchmark && benchmark.speedBonusTicks) ? benchmark.speedBonusTicks : 0;
        const difficulty = Math.max(1, Number.isFinite(node.difficulty) ? node.difficulty : 1);
        const successScore = Math.max(1, level + toolPower);
        const successChance = successScore / (successScore + difficulty);
        const intervalTicks = Math.max(
            Number.isFinite(timing.minimumAttemptTicks) ? timing.minimumAttemptTicks : 1,
            (Number.isFinite(timing.baseAttemptTicks) ? timing.baseAttemptTicks : 1) - speedBonusTicks
        );
        const activeYieldsPerTick = successChance / intervalTicks;
        const sellValue = Number.isFinite(rewardValueRow.sell) ? rewardValueRow.sell : 0;
        const activeXpPerTick = activeYieldsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const activeGoldPerTick = activeYieldsPerTick * sellValue;
        const expectedYieldsPerNode = node.persistent ? null : computeExpectedDepletingYieldCount(node);
        const activeTicksPerNode = expectedYieldsPerNode && activeYieldsPerTick > 0
            ? expectedYieldsPerNode / activeYieldsPerTick
            : null;
        const respawnTicks = Number.isFinite(node.respawnTicks) ? node.respawnTicks : 0;
        const sustainedYieldsPerTick = expectedYieldsPerNode && activeTicksPerNode !== null
            ? expectedYieldsPerNode / (activeTicksPerNode + Math.max(0, respawnTicks))
            : activeYieldsPerTick;
        const sustainedXpPerTick = sustainedYieldsPerTick * (Number.isFinite(node.xpPerSuccess) ? node.xpPerSuccess : 0);
        const sustainedGoldPerTick = sustainedYieldsPerTick * sellValue;

        return {
            nodeId,
            activeXpPerTick,
            activeGoldPerTick,
            sustainedXpPerTick,
            sustainedGoldPerTick,
            sellValue,
            expectedYieldsPerNode
        };
    }

    function validateMiningBalanceCurve(skillSpecs) {
        const miningSpec = skillSpecs && skillSpecs.mining ? skillSpecs.mining : null;
        if (!miningSpec || !miningSpec.nodeTable) {
            throw new Error('Mining balance curve mismatch\n- missing mining node table');
        }

        const nodeTable = miningSpec.nodeTable || {};
        const valueTable = miningSpec.economy && miningSpec.economy.valueTable && typeof miningSpec.economy.valueTable === 'object'
            ? miningSpec.economy.valueTable
            : null;
        if (!valueTable) {
            throw new Error('Mining balance curve mismatch\n- missing mining value table');
        }

        const errors = [];
        const requiredNodes = ['clay_rock', 'copper_rock', 'tin_rock', 'rune_essence', 'iron_rock', 'coal_rock', 'silver_rock', 'sapphire_rock', 'gold_rock', 'emerald_rock'];
        for (let i = 0; i < requiredNodes.length; i++) {
            if (!nodeTable[requiredNodes[i]]) errors.push('missing mining node ' + requiredNodes[i]);
        }

        const fixedNodeIds = ['clay_rock', 'copper_rock', 'tin_rock'];
        for (let i = 0; i < fixedNodeIds.length; i++) {
            const nodeId = fixedNodeIds[i];
            const node = nodeTable[nodeId] || {};
            if (!(node.minimumYields === 1 && node.maximumYields === 1)) {
                errors.push(nodeId + ' should remain a one-yield fixed rock');
            }
            if (node.depletionChance !== 1) {
                errors.push(nodeId + ' should always deplete after one yield');
            }
        }

        const variableNodeIds = ['iron_rock', 'coal_rock', 'silver_rock', 'sapphire_rock', 'gold_rock', 'emerald_rock'];
        for (let i = 0; i < variableNodeIds.length; i++) {
            const nodeId = variableNodeIds[i];
            const node = nodeTable[nodeId] || {};
            if (!Number.isFinite(node.minimumYields)) errors.push(nodeId + ' missing minimumYields');
            if (!Number.isFinite(node.maximumYields)) errors.push(nodeId + ' missing maximumYields');
            if (Number.isFinite(node.minimumYields) && Number.isFinite(node.maximumYields) && node.maximumYields < node.minimumYields) {
                errors.push(nodeId + ' maximumYields must be >= minimumYields');
            }
            if (!Number.isFinite(node.depletionChance)) errors.push(nodeId + ' missing depletionChance');
            if (!Number.isFinite(node.respawnTicks)) errors.push(nodeId + ' missing respawnTicks');
        }

        const runeEssence = nodeTable.rune_essence || {};
        if (!runeEssence.persistent) {
            errors.push('rune_essence should remain persistent');
        }

        const oreBenchmarks = [
            { nodeId: 'clay_rock', level: 1, toolPower: 6, speedBonusTicks: 1 },
            { nodeId: 'copper_rock', level: 1, toolPower: 6, speedBonusTicks: 1 },
            { nodeId: 'iron_rock', level: 10, toolPower: 10, speedBonusTicks: 2 },
            { nodeId: 'coal_rock', level: 20, toolPower: 15, speedBonusTicks: 3 },
            { nodeId: 'silver_rock', level: 30, toolPower: 21, speedBonusTicks: 4 },
            { nodeId: 'gold_rock', level: 40, toolPower: 28, speedBonusTicks: 5 }
        ];
        let prevOre = null;
        for (let i = 0; i < oreBenchmarks.length; i++) {
            const benchmark = oreBenchmarks[i];
            const node = nodeTable[benchmark.nodeId] || {};
            const metrics = computeMiningBalanceMetrics(miningSpec, benchmark.nodeId, benchmark);
            if (!metrics) {
                errors.push('missing mining balance metrics for ' + benchmark.nodeId);
                continue;
            }
            if (!Number.isFinite(metrics.sellValue) || metrics.sellValue <= 0) {
                errors.push(benchmark.nodeId + ' missing positive sell value');
            }
            if (prevOre) {
                if (!(node.requiredLevel >= prevOre.node.requiredLevel)) {
                    errors.push(benchmark.nodeId + ' requiredLevel must not fall across the ore lane');
                }
                if (!(node.difficulty > prevOre.node.difficulty)) {
                    errors.push(benchmark.nodeId + ' difficulty must increase across the ore lane');
                }
                if (!(node.xpPerSuccess > prevOre.node.xpPerSuccess)) {
                    errors.push(benchmark.nodeId + ' xpPerSuccess must increase across the ore lane');
                }
                if (!(metrics.sellValue > prevOre.metrics.sellValue)) {
                    errors.push(benchmark.nodeId + ' sell value must increase across the ore lane');
                }
                if (!(metrics.activeXpPerTick > prevOre.metrics.activeXpPerTick)) {
                    errors.push(benchmark.nodeId + ' active xp/tick must increase across the ore lane');
                }
                if (!(metrics.activeGoldPerTick > prevOre.metrics.activeGoldPerTick)) {
                    errors.push(benchmark.nodeId + ' active gold/tick must increase across the ore lane');
                }
                if (!(metrics.sustainedXpPerTick > prevOre.metrics.sustainedXpPerTick)) {
                    errors.push(benchmark.nodeId + ' sustained xp/tick must increase across the ore lane');
                }
                if (!(metrics.sustainedGoldPerTick > prevOre.metrics.sustainedGoldPerTick)) {
                    errors.push(benchmark.nodeId + ' sustained gold/tick must increase across the ore lane');
                }
            }
            prevOre = { node, metrics };
        }

        const copperMetrics = computeMiningBalanceMetrics(miningSpec, 'copper_rock', { level: 1, toolPower: 6, speedBonusTicks: 1 });
        const tinMetrics = computeMiningBalanceMetrics(miningSpec, 'tin_rock', { level: 1, toolPower: 6, speedBonusTicks: 1 });
        if (!copperMetrics || !tinMetrics) {
            errors.push('copper/tin metrics missing');
        } else {
            if (!(copperMetrics.activeXpPerTick === tinMetrics.activeXpPerTick && copperMetrics.activeGoldPerTick === tinMetrics.activeGoldPerTick)) {
                errors.push('copper_rock and tin_rock should remain identical starter-band peers');
            }
        }

        const silverMetrics = computeMiningBalanceMetrics(miningSpec, 'silver_rock', { level: 30, toolPower: 21, speedBonusTicks: 4 });
        const sapphireMetrics = computeMiningBalanceMetrics(miningSpec, 'sapphire_rock', { level: 30, toolPower: 21, speedBonusTicks: 4 });
        const coalMetrics = computeMiningBalanceMetrics(miningSpec, 'coal_rock', { level: 20, toolPower: 15, speedBonusTicks: 3 });
        if (!silverMetrics || !sapphireMetrics || !coalMetrics) {
            errors.push('mid-band gem balance metrics missing');
        } else {
            if (!(sapphireMetrics.activeXpPerTick > silverMetrics.activeXpPerTick)) {
                errors.push('sapphire_rock should beat silver_rock on active xp/tick at the level-30 benchmark');
            }
            if (!(sapphireMetrics.sustainedXpPerTick > silverMetrics.sustainedXpPerTick)) {
                errors.push('sapphire_rock should beat silver_rock on sustained xp/tick at the level-30 benchmark');
            }
            if (!(sapphireMetrics.sustainedGoldPerTick > coalMetrics.sustainedGoldPerTick)) {
                errors.push('sapphire_rock should beat coal_rock on sustained gold/tick at the level-30 benchmark');
            }
        }

        const goldMetrics = computeMiningBalanceMetrics(miningSpec, 'gold_rock', { level: 40, toolPower: 28, speedBonusTicks: 5 });
        const emeraldMetrics = computeMiningBalanceMetrics(miningSpec, 'emerald_rock', { level: 40, toolPower: 28, speedBonusTicks: 5 });
        if (!goldMetrics || !emeraldMetrics) {
            errors.push('late-band gem balance metrics missing');
        } else {
            if (!(emeraldMetrics.activeXpPerTick > goldMetrics.activeXpPerTick)) {
                errors.push('emerald_rock should beat gold_rock on active xp/tick at the level-40 benchmark');
            }
            if (!(emeraldMetrics.activeGoldPerTick > goldMetrics.activeGoldPerTick)) {
                errors.push('emerald_rock should beat gold_rock on active gold/tick at the level-40 benchmark');
            }
            if (!(emeraldMetrics.sustainedXpPerTick > goldMetrics.sustainedXpPerTick)) {
                errors.push('emerald_rock should beat gold_rock on sustained xp/tick at the level-40 benchmark');
            }
            if (!(emeraldMetrics.sustainedGoldPerTick > goldMetrics.sustainedGoldPerTick)) {
                errors.push('emerald_rock should beat gold_rock on sustained gold/tick at the level-40 benchmark');
            }
        }

        if (errors.length > 0) {
            throw new Error('Mining balance curve mismatch\n- ' + errors.join('\n- '));
        }
    }

    validateFishingBalanceCurve(SKILL_SPECS);
    validateCookingBalanceCurve(SKILL_SPECS);
    validateWoodcuttingBalanceCurve(SKILL_SPECS);
    validateMiningBalanceCurve(SKILL_SPECS);
    validateCrossSkillIntegration(SKILL_SPECS);
    validateWoodcuttingLogDemandIntegration(SKILL_SPECS);
    validateFletchingBalanceCurve(SKILL_SPECS);
    validateCraftingBalanceCurve(SKILL_SPECS);

    window.SkillSpecs = {
        version: SPEC_VERSION,
        skills: SKILL_SPECS
    };
})();






