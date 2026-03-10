(function () {
    const ITEM_DEFS = {
        iron_axe: {
            name: 'Iron Axe',
            type: 'weapon',
            weaponClass: 'axe',
            toolTier: 6,
            speedBonusTicks: 1,
            stats: { atk: 15, def: 0, str: 12 },
            value: 20,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'sprite', key: 'iron_axe' }
        },
        logs: {
            name: 'Logs',
            type: 'resource',
            value: 6,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'image', path: './assets/pixel/logs-pixel.png' }
        },
        ashes: {
            name: 'Ashes',
            type: 'resource',
            value: 4,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'ashes' }
        },
        coins: {
            name: 'Coins',
            type: 'currency',
            value: 1,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'coins' }
        },
        tinderbox: {
            name: 'Tinderbox',
            type: 'tool',
            value: 8,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'tinderbox' }
        },
        knife: {
            name: 'Knife',
            type: 'tool',
            value: 10,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'knife' }
        },
        iron_pickaxe: {
            name: 'Iron Pickaxe',
            type: 'weapon',
            weaponClass: 'pickaxe',
            toolTier: 6,
            speedBonusTicks: 1,
            stats: { atk: 8, def: 0, str: 10 },
            value: 150,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'sprite', key: 'pickaxe' }
        },
        small_net: {
            name: 'Small Net',
            type: 'tool',
            value: 25,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'small_net' }
        },
        fishing_rod: {
            name: 'Fishing Rod',
            type: 'tool',
            value: 45,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'small_net' }
        },
        harpoon: {
            name: 'Harpoon',
            type: 'weapon',
            weaponClass: 'harpoon',
            stats: { atk: 18, def: 0, str: 10 },
            value: 110,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'sprite', key: 'pickaxe' }
        },
        rune_harpoon: {
            name: 'Rune Harpoon',
            type: 'weapon',
            weaponClass: 'harpoon',
            stats: { atk: 32, def: 0, str: 20 },
            value: 2500,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'sprite', key: 'pickaxe' }
        },
        bait: {
            name: 'Bait',
            type: 'resource',
            value: 2,
            stackable: true,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        raw_trout: {
            name: 'Raw Trout',
            type: 'resource',
            value: 18,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            cookResultId: 'cooked_trout',
            burnResultId: 'burnt_trout',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        raw_salmon: {
            name: 'Raw Salmon',
            type: 'resource',
            value: 24,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            cookResultId: 'cooked_salmon',
            burnResultId: 'burnt_salmon',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        raw_tuna: {
            name: 'Raw Tuna',
            type: 'resource',
            value: 28,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            cookResultId: 'cooked_tuna',
            burnResultId: 'burnt_tuna',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        raw_swordfish: {
            name: 'Raw Swordfish',
            type: 'resource',
            value: 40,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            cookResultId: 'cooked_swordfish',
            burnResultId: 'burnt_swordfish',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        raw_shrimp: {
            name: 'Raw Shrimp',
            type: 'resource',
            value: 3,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            cookResultId: 'cooked_shrimp',
            burnResultId: 'burnt_shrimp',
            burnChance: 0.28,
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        cooked_shrimp: {
            name: 'Cooked Shrimp',
            type: 'food',
            value: 8,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        burnt_shrimp: {
            name: 'Burnt Shrimp',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        cooked_trout: {
            name: 'Cooked Trout',
            type: 'food',
            value: 24,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        burnt_trout: {
            name: 'Burnt Trout',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        cooked_salmon: {
            name: 'Cooked Salmon',
            type: 'food',
            value: 32,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        burnt_salmon: {
            name: 'Burnt Salmon',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        cooked_tuna: {
            name: 'Cooked Tuna',
            type: 'food',
            value: 40,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        burnt_tuna: {
            name: 'Burnt Tuna',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        cooked_swordfish: {
            name: 'Cooked Swordfish',
            type: 'food',
            value: 56,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        burnt_swordfish: {
            name: 'Burnt Swordfish',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'raw_shrimp' }
        },
        copper_ore: {
            name: 'Copper ore',
            type: 'resource',
            value: 8,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'copper_ore' }
        },
        tin_ore: {
            name: 'Tin ore',
            type: 'resource',
            value: 8,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'tin_ore' }
        },
        rune_essence: {
            name: 'Rune essence',
            type: 'resource',
            value: 12,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'rune_essence' }
        },
        ember_rune: {
            name: 'Ember rune',
            type: 'resource',
            value: 10,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'ember_rune' }
        },
        water_rune: {
            name: 'Water rune',
            type: 'resource',
            value: 20,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'water_rune' }
        },
        earth_rune: {
            name: 'Earth rune',
            type: 'resource',
            value: 40,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'earth_rune' }
        },
        air_rune: {
            name: 'Air rune',
            type: 'resource',
            value: 80,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'air_rune' }
        },
        steam_rune: {
            name: 'Steam rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'steam_rune' }
        },
        smoke_rune: {
            name: 'Smoke rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'smoke_rune' }
        },
        lava_rune: {
            name: 'Lava rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'lava_rune' }
        },
        mud_rune: {
            name: 'Mud rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'mud_rune' }
        },
        mist_rune: {
            name: 'Mist rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'mist_rune' }
        },
        dust_rune: {
            name: 'Dust rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'dust_rune' }
        },
        small_pouch: {
            name: 'Small pouch',
            type: 'tool',
            value: 500,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'small_pouch' }
        },
        medium_pouch: {
            name: 'Medium pouch',
            type: 'tool',
            value: 2000,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'medium_pouch' }
        },
        large_pouch: {
            name: 'Large pouch',
            type: 'tool',
            value: 8000,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'sprite', key: 'large_pouch' }
        }
    };

    function resolveIcon(def, makeIconSprite, makeIconFromImage, assetVersionTag) {
        if (!def || !def.icon) return '';
        if (def.icon.kind === 'sprite') return makeIconSprite(def.icon.key);
        if (def.icon.kind === 'image') {
            const taggedPath = `${def.icon.path}?v=${assetVersionTag}`;
            return makeIconFromImage(taggedPath);
        }
        return '';
    }

    function buildItemDb(makeIconSprite, makeIconFromImage, assetVersionTag) {
        const db = {};
        const ids = Object.keys(ITEM_DEFS);
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const def = ITEM_DEFS[id];
            db[id] = {
                id,
                name: def.name,
                type: def.type,
                actions: Array.isArray(def.actions) ? def.actions.slice() : ['Use', 'Drop'],
                defaultAction: def.defaultAction || 'Use',
                value: Number.isFinite(def.value) ? def.value : 0,
                stackable: !!def.stackable,
                icon: resolveIcon(def, makeIconSprite, makeIconFromImage, assetVersionTag)
            };

            if (def.weaponClass) db[id].weaponClass = def.weaponClass;
            if (Number.isFinite(def.toolTier)) db[id].toolTier = def.toolTier;
            if (Number.isFinite(def.speedBonusTicks)) db[id].speedBonusTicks = def.speedBonusTicks;
            if (def.stats) db[id].stats = Object.assign({}, def.stats);
            if (def.cookResultId) db[id].cookResultId = def.cookResultId;
            if (def.burnResultId) db[id].burnResultId = def.burnResultId;
            if (Number.isFinite(def.burnChance)) db[id].burnChance = def.burnChance;
        }

        return db;
    }

    window.ItemCatalog = {
        ITEM_DEFS,
        buildItemDb
    };
})();

