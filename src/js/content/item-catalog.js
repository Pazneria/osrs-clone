(function () {
    const ITEM_DEFS = {
        iron_axe: {
            name: 'Iron Axe',
            type: 'weapon',
            weaponClass: 'axe',
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
            value: 5,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'image', path: './assets/pixel/logs-pixel.png' }
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
            value: 50,
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
            value: 18,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'sprite', key: 'ember_rune' }
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
