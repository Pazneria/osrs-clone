(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.mining = {
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
        };
})();
