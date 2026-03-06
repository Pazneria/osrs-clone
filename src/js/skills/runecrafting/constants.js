(function () {
    const ITEM_IDS = {
        RUNE_ESSENCE: 'rune_essence',
        EMBER_RUNE: 'ember_rune'
    };

    const TARGETS = {
        ALTAR_CANDIDATE: 'ALTAR_CANDIDATE'
    };

    const ORE_TYPES = {
        RUNE_ESSENCE: 'rune_essence'
    };

    function isEmberAltar(hitData) {
        if (!hitData) return true;
        return hitData.name === 'Ember Altar';
    }

    window.RunecraftingDomain = {
        ITEM_IDS,
        TARGETS,
        ORE_TYPES,
        isEmberAltar
    };
})();
