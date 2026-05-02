(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.cooking = {
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
        };
})();
