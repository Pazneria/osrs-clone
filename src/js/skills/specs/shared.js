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

    window.__SkillSpecAuthoring = {
        version: SPEC_VERSION,
        skills: {},
        tables: {
            CANONICAL_FISH_FOOD_VALUE_TABLE,
            CANONICAL_COOKING_VALUE_TABLE
        }
    };
})();
