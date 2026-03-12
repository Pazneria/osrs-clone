(function () {
    const skillTiles = [
        { skillId: 'attack', displayName: 'Attack', icon: 'ATK', levelKey: 'atk' },
        { skillId: 'hitpoints', displayName: 'Hitpoints', icon: 'HP', levelKey: 'hp' },
        { skillId: 'mining', displayName: 'Mining', icon: 'MIN', levelKey: 'min' },
        { skillId: 'strength', displayName: 'Strength', icon: 'STR', levelKey: 'str' },
        { skillId: 'defense', displayName: 'Defense', icon: 'DEF', levelKey: 'def' },
        { skillId: 'woodcutting', displayName: 'Woodcutting', icon: 'WC', levelKey: 'wc' },
        { skillId: 'firemaking', displayName: 'Firemaking', icon: 'FM', levelKey: 'fm' },
        { skillId: 'fishing', displayName: 'Fishing', icon: 'FIS', levelKey: 'fish' },
        { skillId: 'runecrafting', displayName: 'Runecrafting', icon: 'RC', levelKey: 'rc' },
        { skillId: 'cooking', displayName: 'Cooking', icon: 'COOK', levelKey: 'cook' },
        { skillId: 'smithing', displayName: 'Smithing', icon: 'SMI', levelKey: 'smith' },
        { skillId: 'crafting', displayName: 'Crafting', icon: 'CRFT', levelKey: 'craft' },
        { skillId: 'fletching', displayName: 'Fletching', icon: 'FLT', levelKey: 'fletch' }
    ];
    const skillTileBySkillId = {};
    for (let i = 0; i < skillTiles.length; i++) {
        const tile = skillTiles[i];
        skillTileBySkillId[tile.skillId] = tile;
    }

    window.SkillManifest = {
        targetToSkillId: {
            TREE: 'woodcutting',
            ROCK: 'mining',
            WATER: 'fishing',
            FIRE: 'cooking',
            ALTAR_CANDIDATE: 'runecrafting',
            FURNACE: 'smithing',
            ANVIL: 'smithing'
        },
        actionToSkillId: {
            FIREMAKING: 'firemaking',
            COOKING: 'cooking',
            FLETCHING: 'fletching',
            CRAFTING: 'crafting'
        },
        orderedSkillIds: ['mining', 'woodcutting', 'fishing', 'firemaking', 'cooking', 'crafting', 'fletching', 'runecrafting', 'smithing'],
        skillTiles,
        skillTileBySkillId
    };
})();

