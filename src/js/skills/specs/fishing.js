(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.fishing = {
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
        };
})();
