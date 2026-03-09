(function () {
    const SPEC_VERSION = '2026.03.m1';

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
                    tileIds: [21, 22],
                    unlockLevel: 1,
                    maxCatchChance: 0.62,
                    baseCatchChance: 0.28,
                    levelScaling: 0.008,
                    fish: [
                        { itemId: 'raw_shrimp', requiredLevel: 1, weight: 100, xp: 20 }
                    ]
                }
            },
            economy: {
                primaryResource: 'raw_shrimp',
                defaultSellValue: 3
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
                supportResource: 'tinderbox'
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
                    burnDifficulty: 4,
                    xpPerSuccess: 30,
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
                baseAttemptTicks: 4,
                minimumAttemptTicks: 1
            },
            nodeTable: {
                copper_rock: { tileId: 2, requiredLevel: 1, difficulty: 18, xpPerSuccess: 25, rewardItemId: 'copper_ore', depletionChance: 0.2, respawnTicks: 12 },
                tin_rock: { tileId: 2, requiredLevel: 1, difficulty: 18, xpPerSuccess: 25, rewardItemId: 'tin_ore', depletionChance: 0.2, respawnTicks: 12 },
                rune_essence: { tileId: 2, requiredLevel: 1, difficulty: 1, xpPerSuccess: 8, rewardItemId: 'rune_essence', persistent: true }
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
                ember_altar: {
                    targetObj: 'ALTAR_CANDIDATE',
                    essenceItemId: 'rune_essence',
                    outputItemId: 'ember_rune',
                    xpPerEssence: 8,
                    scalingStartLevel: 1,
                    requiresSecondaryRune: false
                }
            },
            economy: { primaryResource: 'ember_rune' }
        }
    };

    window.SkillSpecs = {
        version: SPEC_VERSION,
        skills: SKILL_SPECS
    };
})();
