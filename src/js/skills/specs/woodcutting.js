(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.woodcutting = {
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
        };
})();
