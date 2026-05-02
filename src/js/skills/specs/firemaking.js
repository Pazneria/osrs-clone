(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.firemaking = {
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
        };
})();
