(function () {
    const ITEM_DEFS = {
        bronze_axe: {
            name: 'Bronze Axe',
            type: 'weapon',
            weaponClass: 'axe',
            toolTier: 4,
            speedBonusTicks: 0,
            stats: { atk: 10, def: 0, str: 8 },
            value: 40,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'iron_axe_item' }
        },
        iron_axe: {
            name: 'Iron Axe',
            type: 'weapon',
            weaponClass: 'axe',
            toolTier: 6,
            speedBonusTicks: 1,
            stats: { atk: 15, def: 0, str: 12 },
            value: 120,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'iron_axe' }
        },
        steel_axe: {
            name: 'Steel Axe',
            type: 'weapon',
            weaponClass: 'axe',
            toolTier: 10,
            speedBonusTicks: 2,
            stats: { atk: 22, def: 0, str: 18 },
            value: 350,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'iron_axe' }
        },
        mithril_axe: {
            name: 'Mithril Axe',
            type: 'weapon',
            weaponClass: 'axe',
            toolTier: 15,
            speedBonusTicks: 3,
            stats: { atk: 30, def: 0, str: 24 },
            value: 900,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'iron_axe' }
        },
        adamant_axe: {
            name: 'Adamant Axe',
            type: 'weapon',
            weaponClass: 'axe',
            toolTier: 21,
            speedBonusTicks: 4,
            stats: { atk: 40, def: 0, str: 32 },
            value: 2200,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'iron_axe' }
        },
        rune_axe: {
            name: 'Rune Axe',
            type: 'weapon',
            weaponClass: 'axe',
            toolTier: 28,
            speedBonusTicks: 5,
            stats: { atk: 54, def: 0, str: 44 },
            value: 2500,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'iron_axe' }
        },
        logs: {
            name: 'Logs',
            type: 'resource',
            value: 6,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'regular_logs' }
        },
        oak_logs: {
            name: 'Oak Logs',
            type: 'resource',
            value: 16,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'logs' }
        },
        willow_logs: {
            name: 'Willow Logs',
            type: 'resource',
            value: 36,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'willow_logs' }
        },
        maple_logs: {
            name: 'Maple Logs',
            type: 'resource',
            value: 80,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'logs' }
        },
        yew_logs: {
            name: 'Yew Logs',
            type: 'resource',
            value: 180,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'logs' }
        },
        ashes: {
            name: 'Ashes',
            type: 'resource',
            value: 4,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'ashes' }
        },
        coins: {
            name: 'Coins',
            type: 'currency',
            value: 1,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'coins' }
        },
        owie: {
            name: 'Owie',
            type: 'tool',
            value: 1,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'ashes' }
        },
        tinderbox: {
            name: 'Tinderbox',
            type: 'tool',
            value: 8,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'tinderbox' }
        },
        knife: {
            name: 'Knife',
            type: 'tool',
            value: 8,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'knife' }
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
            icon: { kind: 'pixel', assetId: 'iron_pickaxe' }
        },
        small_net: {
            name: 'Small Net',
            type: 'tool',
            value: 25,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'small_net' }
        },
        fishing_rod: {
            name: 'Fishing Rod',
            type: 'tool',
            value: 45,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'fishing_rod' }
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
            icon: { kind: 'pixel', assetId: 'harpoon' }
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
            icon: { kind: 'pixel', assetId: 'rune_harpoon' }
        },
        bait: {
            name: 'Bait',
            type: 'resource',
            value: 2,
            stackable: true,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
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
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
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
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
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
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
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
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
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
            icon: { kind: 'pixel', assetId: 'shrimp' }
        },
        cooked_shrimp: {
            name: 'Cooked Shrimp',
            type: 'food',
            value: 8,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            healAmount: 3,
            eatDelayTicks: 4,
            icon: { kind: 'pixel', assetId: 'cooked_shrimp' }
        },
        burnt_shrimp: {
            name: 'Burnt Shrimp',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'burnt_shrimp' }
        },
        cooked_trout: {
            name: 'Cooked Trout',
            type: 'food',
            value: 24,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            healAmount: 5,
            eatDelayTicks: 4,
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        burnt_trout: {
            name: 'Burnt Trout',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        cooked_salmon: {
            name: 'Cooked Salmon',
            type: 'food',
            value: 32,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            healAmount: 7,
            eatDelayTicks: 4,
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        burnt_salmon: {
            name: 'Burnt Salmon',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        cooked_tuna: {
            name: 'Cooked Tuna',
            type: 'food',
            value: 40,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            healAmount: 9,
            eatDelayTicks: 4,
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        burnt_tuna: {
            name: 'Burnt Tuna',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        cooked_swordfish: {
            name: 'Cooked Swordfish',
            type: 'food',
            value: 56,
            stackable: false,
            actions: ['Eat', 'Drop'],
            defaultAction: 'Eat',
            healAmount: 12,
            eatDelayTicks: 4,
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        burnt_swordfish: {
            name: 'Burnt Swordfish',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'raw_shrimp' }
        },
        copper_ore: {
            name: 'Copper ore',
            type: 'resource',
            value: 8,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'copper_ore' }
        },
        tin_ore: {
            name: 'Tin ore',
            type: 'resource',
            value: 8,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'tin_ore' }
        },
        clay: {
            name: 'Clay',
            type: 'resource',
            value: 4,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'tin_ore' }
        },
        uncut_sapphire: {
            name: 'Uncut sapphire',
            type: 'resource',
            value: 50,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'rune_essence' }
        },
        uncut_emerald: {
            name: 'Uncut emerald',
            type: 'resource',
            value: 90,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'rune_essence' }
        },
        rune_essence: {
            name: 'Rune essence',
            type: 'resource',
            value: 12,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'rune_essence' }
        },
        ember_rune: {
            name: 'Ember rune',
            type: 'resource',
            value: 10,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'ember_rune' }
        },
        water_rune: {
            name: 'Water rune',
            type: 'resource',
            value: 20,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'water_rune' }
        },
        earth_rune: {
            name: 'Earth rune',
            type: 'resource',
            value: 40,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'earth_rune' }
        },
        air_rune: {
            name: 'Air rune',
            type: 'resource',
            value: 80,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'air_rune' }
        },
        steam_rune: {
            name: 'Steam rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'steam_rune' }
        },
        smoke_rune: {
            name: 'Smoke rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'smoke_rune' }
        },
        lava_rune: {
            name: 'Lava rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'lava_rune' }
        },
        mud_rune: {
            name: 'Mud rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'mud_rune' }
        },
        mist_rune: {
            name: 'Mist rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'mist_rune' }
        },
        dust_rune: {
            name: 'Dust rune',
            type: 'resource',
            value: 160,
            stackable: true,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'dust_rune' }
        },
        small_pouch: {
            name: 'Small pouch',
            type: 'tool',
            value: 500,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'small_pouch' }
        },
        medium_pouch: {
            name: 'Medium pouch',
            type: 'tool',
            value: 2000,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'medium_pouch' }
        },
        large_pouch: {
            name: 'Large pouch',
            type: 'tool',
            value: 8000,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'large_pouch' }
        }
    };
    function createFletchingItemDefs() {
        const defs = {
            feathers_bundle: {
                name: 'Feathers x15',
                type: 'resource',
                value: 8,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            bow_string: {
                name: 'Bow String',
                type: 'resource',
                value: 12,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            }
        };

        const tierDefs = [
            {
                key: 'wooden',
                logName: 'Normal',
                handleName: 'Wooden Handle',
                handleValue: 6,
                handleItemId: 'wooden_handle',
                staffName: 'Plain Staff (Wood)',
                staffValue: 6,
                staffItemId: 'plain_staff_wood',
                shaftsName: 'Wooden Shafts x15',
                shaftsValue: 4,
                shaftsItemId: 'wooden_shafts',
                headlessName: 'Wooden Headless Arrows x15',
                headlessValue: 6,
                headlessItemId: 'wooden_headless_arrows',
                shortbowUName: 'Normal Shortbow (u)',
                shortbowUValue: 7,
                shortbowUItemId: 'normal_shortbow_u',
                longbowUName: 'Normal Longbow (u)',
                longbowUValue: 6,
                longbowUItemId: 'normal_longbow_u',
                shortbowName: 'Normal Shortbow',
                shortbowValue: 12,
                shortbowItemId: 'normal_shortbow',
                longbowName: 'Normal Longbow',
                longbowValue: 10,
                longbowItemId: 'normal_longbow'
            },
            {
                key: 'oak',
                logName: 'Oak',
                handleName: 'Oak Handle',
                handleValue: 12,
                handleItemId: 'oak_handle',
                staffName: 'Plain Staff (Oak)',
                staffValue: 12,
                staffItemId: 'plain_staff_oak',
                shaftsName: 'Oak Shafts x15',
                shaftsValue: 6,
                shaftsItemId: 'oak_shafts',
                headlessName: 'Oak Headless Arrows x15',
                headlessValue: 10,
                headlessItemId: 'oak_headless_arrows',
                shortbowUName: 'Oak Shortbow (u)',
                shortbowUValue: 15,
                shortbowUItemId: 'oak_shortbow_u',
                longbowUName: 'Oak Longbow (u)',
                longbowUValue: 14,
                longbowUItemId: 'oak_longbow_u',
                shortbowName: 'Oak Shortbow',
                shortbowValue: 22,
                shortbowItemId: 'oak_shortbow',
                longbowName: 'Oak Longbow',
                longbowValue: 20,
                longbowItemId: 'oak_longbow'
            },
            {
                key: 'willow',
                logName: 'Willow',
                handleName: 'Willow Handle',
                handleValue: 20,
                handleItemId: 'willow_handle',
                staffName: 'Plain Staff (Willow)',
                staffValue: 20,
                staffItemId: 'plain_staff_willow',
                shaftsName: 'Willow Shafts x15',
                shaftsValue: 10,
                shaftsItemId: 'willow_shafts',
                headlessName: 'Willow Headless Arrows x15',
                headlessValue: 16,
                headlessItemId: 'willow_headless_arrows',
                shortbowUName: 'Willow Shortbow (u)',
                shortbowUValue: 28,
                shortbowUItemId: 'willow_shortbow_u',
                longbowUName: 'Willow Longbow (u)',
                longbowUValue: 26,
                longbowUItemId: 'willow_longbow_u',
                shortbowName: 'Willow Shortbow',
                shortbowValue: 40,
                shortbowItemId: 'willow_shortbow',
                longbowName: 'Willow Longbow',
                longbowValue: 36,
                longbowItemId: 'willow_longbow'
            },
            {
                key: 'maple',
                logName: 'Maple',
                handleName: 'Maple Handle',
                handleValue: 32,
                handleItemId: 'maple_handle',
                staffName: 'Plain Staff (Maple)',
                staffValue: 32,
                staffItemId: 'plain_staff_maple',
                shaftsName: 'Maple Shafts x15',
                shaftsValue: 16,
                shaftsItemId: 'maple_shafts',
                headlessName: 'Maple Headless Arrows x15',
                headlessValue: 24,
                headlessItemId: 'maple_headless_arrows',
                shortbowUName: 'Maple Shortbow (u)',
                shortbowUValue: 46,
                shortbowUItemId: 'maple_shortbow_u',
                longbowUName: 'Maple Longbow (u)',
                longbowUValue: 44,
                longbowUItemId: 'maple_longbow_u',
                shortbowName: 'Maple Shortbow',
                shortbowValue: 68,
                shortbowItemId: 'maple_shortbow',
                longbowName: 'Maple Longbow',
                longbowValue: 62,
                longbowItemId: 'maple_longbow'
            },
            {
                key: 'yew',
                logName: 'Yew',
                handleName: 'Yew Handle',
                handleValue: 50,
                handleItemId: 'yew_handle',
                staffName: 'Plain Staff (Yew)',
                staffValue: 50,
                staffItemId: 'plain_staff_yew',
                shaftsName: 'Yew Shafts x15',
                shaftsValue: 24,
                shaftsItemId: 'yew_shafts',
                headlessName: 'Yew Headless Arrows x15',
                headlessValue: 36,
                headlessItemId: 'yew_headless_arrows',
                shortbowUName: 'Yew Shortbow (u)',
                shortbowUValue: 72,
                shortbowUItemId: 'yew_shortbow_u',
                longbowUName: 'Yew Longbow (u)',
                longbowUValue: 70,
                longbowUItemId: 'yew_longbow_u',
                shortbowName: 'Yew Shortbow',
                shortbowValue: 110,
                shortbowItemId: 'yew_shortbow',
                longbowName: 'Yew Longbow',
                longbowValue: 100,
                longbowItemId: 'yew_longbow'
            }
        ];

        for (let i = 0; i < tierDefs.length; i++) {
            const def = tierDefs[i];

            defs[def.handleItemId] = {
                name: def.handleName,
                type: 'component',
                value: def.handleValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'knife' }
            };

            defs[def.staffItemId] = {
                name: def.staffName,
                type: 'component',
                value: def.staffValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'pickaxe' }
            };

            defs[def.shaftsItemId] = {
                name: def.shaftsName,
                type: 'component',
                value: def.shaftsValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'knife' }
            };

            defs[def.headlessItemId] = {
                name: def.headlessName,
                type: 'component',
                value: def.headlessValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            };

            defs[def.shortbowUItemId] = {
                name: def.shortbowUName,
                type: 'component',
                value: def.shortbowUValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'knife' }
            };

            defs[def.longbowUItemId] = {
                name: def.longbowUName,
                type: 'component',
                value: def.longbowUValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'knife' }
            };

            defs[def.shortbowItemId] = {
                name: def.shortbowName,
                type: 'component',
                value: def.shortbowValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'pickaxe' }
            };

            defs[def.longbowItemId] = {
                name: def.longbowName,
                type: 'component',
                value: def.longbowValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'pickaxe' }
            };
        }

        const finishedArrowDefs = [
            { itemId: 'bronze_arrows', name: 'Bronze Arrows x15', value: 8 },
            { itemId: 'iron_arrows', name: 'Iron Arrows x15', value: 12 },
            { itemId: 'steel_arrows', name: 'Steel Arrows x15', value: 20 },
            { itemId: 'mithril_arrows', name: 'Mithril Arrows x15', value: 32 },
            { itemId: 'adamant_arrows', name: 'Adamant Arrows x15', value: 50 },
            { itemId: 'rune_arrows', name: 'Rune Arrows x15', value: 80 }
        ];

        for (let i = 0; i < finishedArrowDefs.length; i++) {
            const def = finishedArrowDefs[i];
            defs[def.itemId] = {
                name: def.name,
                type: 'component',
                value: def.value,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            };
        }

        return defs;
    }
    function createSmithingItemDefs() {
        const defs = {
            hammer: {
                name: 'Hammer',
                type: 'tool',
                value: 8,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'hammer' }
            },
            ring_mould: {
                name: 'Ring mould',
                type: 'tool',
                value: 0,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'small_pouch' }
            },
            amulet_mould: {
                name: 'Amulet mould',
                type: 'tool',
                value: 0,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'small_pouch' }
            },
            tiara_mould: {
                name: 'Tiara mould',
                type: 'tool',
                value: 0,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'small_pouch' }
            },
            iron_ore: {
                name: 'Iron ore',
                type: 'resource',
                value: 18,
                stackable: false,
                actions: ['Drop'],
                defaultAction: 'Drop',
                icon: { kind: 'pixel', assetId: 'copper_ore' }
            },
            coal: {
                name: 'Coal',
                type: 'resource',
                value: 30,
                stackable: false,
                actions: ['Drop'],
                defaultAction: 'Drop',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            mithril_ore: {
                name: 'Mithril ore',
                type: 'resource',
                value: 120,
                stackable: false,
                actions: ['Drop'],
                defaultAction: 'Drop',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            silver_ore: {
                name: 'Silver ore',
                type: 'resource',
                value: 45,
                stackable: false,
                actions: ['Drop'],
                defaultAction: 'Drop',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            adamant_ore: {
                name: 'Adamant ore',
                type: 'resource',
                value: 300,
                stackable: false,
                actions: ['Drop'],
                defaultAction: 'Drop',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            gold_ore: {
                name: 'Gold ore',
                type: 'resource',
                value: 70,
                stackable: false,
                actions: ['Drop'],
                defaultAction: 'Drop',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            rune_ore: {
                name: 'Rune ore',
                type: 'resource',
                value: 1200,
                stackable: false,
                actions: ['Drop'],
                defaultAction: 'Drop',
                icon: { kind: 'pixel', assetId: 'rune_essence' }
            },
            silver_ring: {
                name: 'Silver Ring',
                type: 'component',
                value: 40,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'coins' }
            },
            silver_amulet: {
                name: 'Silver Amulet',
                type: 'component',
                value: 40,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'coins' }
            },
            silver_tiara: {
                name: 'Silver Tiara',
                type: 'component',
                value: 40,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'coins' }
            },
            gold_ring: {
                name: 'Gold Ring',
                type: 'component',
                value: 100,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'coins' }
            },
            gold_amulet: {
                name: 'Gold Amulet',
                type: 'component',
                value: 100,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'coins' }
            },
            gold_tiara: {
                name: 'Gold Tiara',
                type: 'component',
                value: 100,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'coins' }
            }
        };

        const tiers = [
            {
                id: 'bronze',
                name: 'Bronze',
                barValue: 8,
                gearValue: 40,
                defStats: { boots: 1, helmet: 3, shield: 4, platelegs: 5, platebody: 7 }
            },
            {
                id: 'iron',
                name: 'Iron',
                barValue: 16,
                gearValue: 120,
                defStats: { boots: 2, helmet: 5, shield: 6, platelegs: 8, platebody: 10 }
            },
            {
                id: 'steel',
                name: 'Steel',
                barValue: 32,
                gearValue: 350,
                defStats: { boots: 3, helmet: 8, shield: 10, platelegs: 12, platebody: 15 }
            },
            {
                id: 'mithril',
                name: 'Mithril',
                barValue: 64,
                gearValue: 900,
                defStats: { boots: 5, helmet: 12, shield: 15, platelegs: 18, platebody: 22 }
            },
            {
                id: 'adamant',
                name: 'Adamant',
                barValue: 128,
                gearValue: 2200,
                defStats: { boots: 7, helmet: 17, shield: 21, platelegs: 25, platebody: 30 }
            },
            {
                id: 'rune',
                name: 'Rune',
                barValue: 256,
                gearValue: 0,
                defStats: { boots: 10, helmet: 24, shield: 28, platelegs: 34, platebody: 40 }
            }
        ];

        const barNames = {
            bronze: 'Bronze Bar',
            iron: 'Iron Bar',
            steel: 'Steel Bar',
            mithril: 'Mithril Bar',
            silver: 'Silver Bar',
            adamant: 'Adamant Bar',
            gold: 'Gold Bar',
            rune: 'Rune Bar'
        };
        const barValues = { bronze: 8, iron: 16, steel: 32, mithril: 64, silver: 45, adamant: 128, gold: 70, rune: 256 };

        Object.keys(barNames).forEach((barTier) => {
            defs[`${barTier}_bar`] = {
                name: barNames[barTier],
                type: 'resource',
                value: barValues[barTier],
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            };
        });

        for (let i = 0; i < tiers.length; i++) {
            const tier = tiers[i];
            defs[`${tier.id}_sword_blade`] = {
                name: `${tier.name} Sword Blade`,
                type: 'component',
                value: Math.max(1, Math.floor(tier.gearValue * 0.3)),
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'pickaxe' }
            };
            defs[`${tier.id}_axe_head`] = {
                name: `${tier.name} Axe Head`,
                type: 'component',
                value: Math.max(1, Math.floor(tier.gearValue * 0.3)),
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'pickaxe' }
            };
            defs[`${tier.id}_pickaxe_head`] = {
                name: `${tier.name} Pickaxe Head`,
                type: 'component',
                value: Math.max(1, Math.floor(tier.gearValue * 0.3)),
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'pickaxe' }
            };
            defs[`${tier.id}_arrowheads`] = {
                name: `${tier.name} Arrowheads`,
                type: 'component',
                value: Math.max(1, Math.floor(tier.gearValue * 0.2)),
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            };

            defs[`${tier.id}_boots`] = {
                name: `${tier.name} Boots`,
                type: 'feet',
                value: Math.max(1, Math.floor(tier.gearValue * 0.4)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.boots, str: 0 },
                icon: { kind: 'pixel', assetId: 'iron_axe' }
            };
            defs[`${tier.id}_helmet`] = {
                name: `${tier.name} Helmet`,
                type: 'head',
                value: Math.max(1, Math.floor(tier.gearValue * 0.5)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.helmet, str: 0 },
                icon: { kind: 'pixel', assetId: 'iron_axe' }
            };
            defs[`${tier.id}_shield`] = {
                name: `${tier.name} Shield`,
                type: 'shield',
                value: Math.max(1, Math.floor(tier.gearValue * 0.55)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.shield, str: 0 },
                icon: { kind: 'pixel', assetId: 'iron_axe' }
            };
            defs[`${tier.id}_platelegs`] = {
                name: `${tier.name} Platelegs`,
                type: 'legs',
                value: Math.max(1, Math.floor(tier.gearValue * 0.65)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.platelegs, str: 0 },
                icon: { kind: 'pixel', assetId: 'iron_axe' }
            };
            defs[`${tier.id}_platebody`] = {
                name: `${tier.name} Platebody`,
                type: 'body',
                value: Math.max(1, Math.floor(tier.gearValue * 0.8)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.platebody, str: 0 },
                icon: { kind: 'pixel', assetId: 'iron_axe' }
            };
        }

        return defs;
    }
    function createCraftingAssemblyItemDefs() {
        const defs = {
            normal_leather: {
                name: 'Normal Leather',
                type: 'resource',
                value: 8,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            wolf_leather: {
                name: 'Wolf Leather',
                type: 'resource',
                value: 24,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            bear_leather: {
                name: 'Bear Leather',
                type: 'resource',
                value: 60,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            chisel: {
                name: 'Chisel',
                type: 'tool',
                value: 4,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'knife' }
            },
            needle: {
                name: 'Needle',
                type: 'tool',
                value: 4,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'knife' }
            },
            thread: {
                name: 'Thread',
                type: 'resource',
                value: 2,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            soft_clay: {
                name: 'Soft Clay',
                type: 'resource',
                value: 1,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'tin_ore' }
            },
            uncut_ruby: {
                name: 'Uncut ruby',
                type: 'resource',
                value: 20,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'rune_essence' }
            },
            cut_ruby: {
                name: 'Cut ruby',
                type: 'resource',
                value: 40,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'rune_essence' }
            },
            cut_sapphire: {
                name: 'Cut sapphire',
                type: 'resource',
                value: 100,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'rune_essence' }
            },
            cut_emerald: {
                name: 'Cut emerald',
                type: 'resource',
                value: 180,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'rune_essence' }
            },
            uncut_diamond: {
                name: 'Uncut diamond',
                type: 'resource',
                value: 150,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'rune_essence' }
            },
            cut_diamond: {
                name: 'Cut diamond',
                type: 'resource',
                value: 300,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'rune_essence' }
            },
            fire_staff: {
                name: 'Fire Staff',
                type: 'component',
                value: 80,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'fire_staff' }
            },
            water_staff: {
                name: 'Water Staff',
                type: 'component',
                value: 180,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'water_staff' }
            },
            earth_staff: {
                name: 'Earth Staff',
                type: 'component',
                value: 320,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'earth_staff' }
            },
            air_staff: {
                name: 'Air Staff',
                type: 'component',
                value: 550,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'air_staff' }
            }
        };
        const tierDefs = [
            { id: 'bronze', name: 'Bronze', value: 40, swordStats: { atk: 10, def: 0, str: 8 }, pickaxeStats: { atk: 5, def: 0, str: 7 }, toolTier: 4, speedBonusTicks: 0 },
            { id: 'iron', name: 'Iron', value: 120, swordStats: { atk: 15, def: 0, str: 12 }, pickaxeStats: { atk: 8, def: 0, str: 10 }, toolTier: 6, speedBonusTicks: 1 },
            { id: 'steel', name: 'Steel', value: 350, swordStats: { atk: 22, def: 0, str: 18 }, pickaxeStats: { atk: 12, def: 0, str: 15 }, toolTier: 10, speedBonusTicks: 2 },
            { id: 'mithril', name: 'Mithril', value: 900, swordStats: { atk: 30, def: 0, str: 24 }, pickaxeStats: { atk: 18, def: 0, str: 22 }, toolTier: 15, speedBonusTicks: 3 },
            { id: 'adamant', name: 'Adamant', value: 2200, swordStats: { atk: 40, def: 0, str: 32 }, pickaxeStats: { atk: 24, def: 0, str: 30 }, toolTier: 21, speedBonusTicks: 4 },
            { id: 'rune', name: 'Rune', value: 2500, swordStats: { atk: 54, def: 0, str: 44 }, pickaxeStats: { atk: 32, def: 0, str: 40 }, toolTier: 28, speedBonusTicks: 5 }
        ];

        const strappedHandleDefs = [
            { itemId: 'wooden_handle_strapped', name: 'Wooden Handle w/ Strap', value: 30 },
            { itemId: 'oak_handle_strapped', name: 'Oak Handle w/ Strap', value: 50 },
            { itemId: 'willow_handle_strapped', name: 'Willow Handle w/ Strap', value: 100 },
            { itemId: 'maple_handle_strapped', name: 'Maple Handle w/ Strap', value: 150 },
            { itemId: 'yew_handle_strapped', name: 'Yew Handle w/ Strap', value: 280 }
        ];
        const gemmedJewelryDefs = [
            { itemId: 'ruby_silver_ring', name: 'Ruby Silver Ring', value: 80 },
            { itemId: 'ruby_silver_amulet', name: 'Ruby Silver Amulet', value: 80 },
            { itemId: 'ruby_silver_tiara', name: 'Ruby Silver Tiara', value: 80 },
            { itemId: 'sapphire_silver_ring', name: 'Sapphire Silver Ring', value: 140 },
            { itemId: 'sapphire_silver_amulet', name: 'Sapphire Silver Amulet', value: 140 },
            { itemId: 'sapphire_silver_tiara', name: 'Sapphire Silver Tiara', value: 140 },
            { itemId: 'ruby_gold_ring', name: 'Ruby Gold Ring', value: 140 },
            { itemId: 'ruby_gold_amulet', name: 'Ruby Gold Amulet', value: 140 },
            { itemId: 'ruby_gold_tiara', name: 'Ruby Gold Tiara', value: 140 },
            { itemId: 'sapphire_gold_ring', name: 'Sapphire Gold Ring', value: 200 },
            { itemId: 'sapphire_gold_amulet', name: 'Sapphire Gold Amulet', value: 200 },
            { itemId: 'sapphire_gold_tiara', name: 'Sapphire Gold Tiara', value: 200 },
            { itemId: 'emerald_gold_ring', name: 'Emerald Gold Ring', value: 280 },
            { itemId: 'emerald_gold_amulet', name: 'Emerald Gold Amulet', value: 280 },
            { itemId: 'emerald_gold_tiara', name: 'Emerald Gold Tiara', value: 280 },
            { itemId: 'diamond_gold_ring', name: 'Diamond Gold Ring', value: 400 },
            { itemId: 'diamond_gold_amulet', name: 'Diamond Gold Amulet', value: 400 },
            { itemId: 'diamond_gold_tiara', name: 'Diamond Gold Tiara', value: 400 }
        ];

        for (let i = 0; i < strappedHandleDefs.length; i++) {
            const def = strappedHandleDefs[i];
            defs[def.itemId] = {
                name: def.name,
                type: 'component',
                value: def.value,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'knife' }
            };
        }

        for (let i = 0; i < tierDefs.length; i++) {
            const tier = tierDefs[i];

            defs[`${tier.id}_sword`] = {
                name: `${tier.name} Sword`,
                type: 'weapon',
                weaponClass: 'sword',
                value: tier.value,
                stackable: false,
                actions: ['Equip', 'Use', 'Drop'],
                defaultAction: 'Equip',
                stats: Object.assign({}, tier.swordStats),
                icon: { kind: 'pixel', assetId: 'iron_axe' }
            };

            const pickaxeId = `${tier.id}_pickaxe`;
            if (!ITEM_DEFS[pickaxeId]) {
                defs[pickaxeId] = {
                    name: `${tier.name} Pickaxe`,
                    type: 'weapon',
                    weaponClass: 'pickaxe',
                    toolTier: tier.toolTier,
                    speedBonusTicks: tier.speedBonusTicks,
                    value: tier.value,
                    stackable: false,
                    actions: ['Equip', 'Use', 'Drop'],
                    defaultAction: 'Equip',
                    stats: Object.assign({}, tier.pickaxeStats),
                    icon: { kind: 'pixel', assetId: pickaxeId }
                };
            }
        }

        for (let i = 0; i < gemmedJewelryDefs.length; i++) {
            const def = gemmedJewelryDefs[i];
            defs[def.itemId] = {
                name: def.name,
                type: 'component',
                value: def.value,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'coins' }
            };
        }

        return defs;
    }
    Object.assign(ITEM_DEFS, createFletchingItemDefs());
    Object.assign(ITEM_DEFS, createSmithingItemDefs());
    Object.assign(ITEM_DEFS, createCraftingAssemblyItemDefs());

    function resolveIcon(def, makeMissingIconSprite, makeIconFromImage, assetVersionTag) {
        if (!def || !def.icon) return '';
        if (def.icon.kind === 'pixel') {
            const assetId = typeof def.icon.assetId === 'string' ? def.icon.assetId.trim() : '';
            if (!assetId) return makeMissingIconSprite();
            const taggedPath = `./assets/pixel/${assetId}.png?v=${assetVersionTag}`;
            return makeIconFromImage(taggedPath);
        }
        return makeMissingIconSprite();
    }

    function buildItemDb(makeMissingIconSprite, makeIconFromImage, assetVersionTag) {
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
                icon: resolveIcon(def, makeMissingIconSprite, makeIconFromImage, assetVersionTag)
            };

            if (def.weaponClass) db[id].weaponClass = def.weaponClass;
            if (Number.isFinite(def.toolTier)) db[id].toolTier = def.toolTier;
            if (Number.isFinite(def.speedBonusTicks)) db[id].speedBonusTicks = def.speedBonusTicks;
            if (def.stats) db[id].stats = Object.assign({}, def.stats);
            if (def.cookResultId) db[id].cookResultId = def.cookResultId;
            if (def.burnResultId) db[id].burnResultId = def.burnResultId;
            if (Number.isFinite(def.burnChance)) db[id].burnChance = def.burnChance;
            if (Number.isFinite(def.healAmount)) db[id].healAmount = def.healAmount;
            if (Number.isFinite(def.eatDelayTicks)) db[id].eatDelayTicks = def.eatDelayTicks;
        }

        return db;
    }

    window.ItemCatalog = {
        ITEM_DEFS,
        buildItemDb
    };
})();
