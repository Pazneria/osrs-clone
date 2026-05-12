(function () {
    const authoring = window.__SkillSpecAuthoring;
    if (!authoring || !authoring.skills || !authoring.tables) {
        throw new Error('Skill spec authoring runtime is not initialized.');
    }
    const CANONICAL_FISH_FOOD_VALUE_TABLE = authoring.tables.CANONICAL_FISH_FOOD_VALUE_TABLE;
    const CANONICAL_COOKING_VALUE_TABLE = authoring.tables.CANONICAL_COOKING_VALUE_TABLE;

    authoring.skills.runecrafting = {
            skillId: 'runecrafting',
            levelBands: [1, 10, 20, 30, 40],
            formulas: {
                outputPerEssence: '1 + floor((level - scalingStartLevel) / 10), minimum 1',
                travelAdjusted: 'per-action totals / (action ticks + route travel ticks)'
            },
            timing: {
                actionTicks: 1
            },
            balance: {
                maxInventoryEssence: 28,
                routeTravelTicks: {
                    ember_altar: 24,
                    water_altar: 30,
                    earth_altar: 36,
                    air_altar: 42
                }
            },
            recipeSet: {
                ember_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 1, essenceItemId: 'rune_essence', outputItemId: 'ember_rune', xpPerEssence: 8, scalingStartLevel: 0, requiresSecondaryRune: false },
                water_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 10, essenceItemId: 'rune_essence', outputItemId: 'water_rune', xpPerEssence: 10, scalingStartLevel: 10, requiresSecondaryRune: false },
                earth_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 20, essenceItemId: 'rune_essence', outputItemId: 'earth_rune', xpPerEssence: 14, scalingStartLevel: 20, requiresSecondaryRune: false },
                air_altar: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 30, essenceItemId: 'rune_essence', outputItemId: 'air_rune', xpPerEssence: 20, scalingStartLevel: 30, requiresSecondaryRune: false },
                steam_combo_from_ember: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'steam_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'water_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                steam_combo_from_water: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'steam_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'ember_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                smoke_combo_from_ember: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'smoke_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'air_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                smoke_combo_from_air: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'smoke_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'ember_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                lava_combo_from_ember: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Ember Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'lava_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'earth_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                lava_combo_from_earth: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'lava_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'ember_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mud_combo_from_water: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mud_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'earth_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mud_combo_from_earth: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mud_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'water_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mist_combo_from_water: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Water Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mist_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'air_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                mist_combo_from_air: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'mist_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'water_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                dust_combo_from_earth: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Earth Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'dust_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'air_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' },
                dust_combo_from_air: { targetObj: 'ALTAR_CANDIDATE', altarName: 'Air Altar', requiredLevel: 40, essenceItemId: 'rune_essence', outputItemId: 'dust_rune', xpPerEssence: 24, scalingStartLevel: 40, requiresSecondaryRune: true, secondaryRuneItemId: 'earth_rune', requiresUnlockFlag: 'runecraftingComboUnlocked' }
            },
            pouchTable: { small_pouch: { requiredLevel: 10, capacity: 6 }, medium_pouch: { requiredLevel: 20, capacity: 13 }, large_pouch: { requiredLevel: 30, capacity: 26 } },
            integration: {
                miningEssenceSource: {
                    skillId: 'mining',
                    nodeId: 'rune_essence',
                    itemId: 'rune_essence',
                    requiredLevel: 1,
                    persistent: true
                },
                magicRuneDemand: {
                    skillId: 'magic',
                    status: 'live_runtime_sink',
                    purpose: 'spell_resource',
                    elementalRuneItemIds: ['ember_rune', 'water_rune', 'earth_rune', 'air_rune'],
                    combinationRuneItemIds: ['steam_rune', 'smoke_rune', 'lava_rune', 'mud_rune', 'mist_rune', 'dust_rune'],
                    allRunesAreStackable: true
                }
            },
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
                        strictBuys: true,
                        buys: ['rune_essence', 'ember_rune', 'water_rune', 'earth_rune', 'air_rune'],
                        sells: ['rune_essence', 'ember_rune', 'water_rune', 'earth_rune', 'air_rune']
                    },
                    combination_sage: {
                        strictBuys: true,
                        buys: ['rune_essence', 'steam_rune', 'smoke_rune', 'lava_rune', 'mud_rune', 'mist_rune', 'dust_rune', 'small_pouch', 'medium_pouch', 'large_pouch'],
                        sells: ['rune_essence', 'steam_rune', 'smoke_rune', 'lava_rune', 'mud_rune', 'mist_rune', 'dust_rune', 'small_pouch', 'medium_pouch', 'large_pouch'],
                        pouchUnlocks: { small_pouch: 10, medium_pouch: 20, large_pouch: 30 }
                    }
                },
                generalStoreFallback: {
                    buyPolicy: 'half_price_floor'
                }
            }
        };
})();
