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
            icon: { kind: 'pixel', assetId: 'bronze_axe' }
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
            icon: { kind: 'pixel', assetId: 'steel_axe' }
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
            icon: { kind: 'pixel', assetId: 'mithril_axe' }
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
            icon: { kind: 'pixel', assetId: 'adamant_axe' }
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
            icon: { kind: 'pixel', assetId: 'rune_axe' }
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
            icon: { kind: 'pixel', assetId: 'oak_logs' }
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
            icon: { kind: 'pixel', assetId: 'maple_logs' }
        },
        yew_logs: {
            name: 'Yew Logs',
            type: 'resource',
            value: 180,
            stackable: false,
            actions: ['Use', 'Drop'],
            defaultAction: 'Use',
            icon: { kind: 'pixel', assetId: 'yew_logs' }
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
        bronze_pickaxe: {
            name: 'Bronze Pickaxe',
            type: 'weapon',
            weaponClass: 'pickaxe',
            toolTier: 4,
            speedBonusTicks: 0,
            stats: { atk: 5, def: 0, str: 7 },
            value: 40,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'bronze_pickaxe' }
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
        steel_pickaxe: {
            name: 'Steel Pickaxe',
            type: 'weapon',
            weaponClass: 'pickaxe',
            toolTier: 10,
            speedBonusTicks: 2,
            stats: { atk: 12, def: 0, str: 15 },
            value: 350,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'steel_pickaxe' }
        },
        mithril_pickaxe: {
            name: 'Mithril Pickaxe',
            type: 'weapon',
            weaponClass: 'pickaxe',
            toolTier: 15,
            speedBonusTicks: 3,
            stats: { atk: 18, def: 0, str: 22 },
            value: 900,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'mithril_pickaxe' }
        },
        adamant_pickaxe: {
            name: 'Adamant Pickaxe',
            type: 'weapon',
            weaponClass: 'pickaxe',
            toolTier: 21,
            speedBonusTicks: 4,
            stats: { atk: 24, def: 0, str: 30 },
            value: 2200,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'adamant_pickaxe' }
        },
        rune_pickaxe: {
            name: 'Rune Pickaxe',
            type: 'weapon',
            weaponClass: 'pickaxe',
            toolTier: 28,
            speedBonusTicks: 5,
            stats: { atk: 32, def: 0, str: 40 },
            value: 2500,
            stackable: false,
            actions: ['Equip', 'Use', 'Drop'],
            defaultAction: 'Equip',
            icon: { kind: 'pixel', assetId: 'rune_pickaxe' }
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
            icon: { kind: 'pixel', assetId: 'raw_trout' }
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
            icon: { kind: 'pixel', assetId: 'raw_salmon' }
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
            icon: { kind: 'pixel', assetId: 'raw_tuna' }
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
            icon: { kind: 'pixel', assetId: 'raw_swordfish' }
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
            icon: { kind: 'pixel', assetId: 'cooked_trout' }
        },
        burnt_trout: {
            name: 'Burnt Trout',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'burnt_trout' }
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
            icon: { kind: 'pixel', assetId: 'cooked_salmon' }
        },
        burnt_salmon: {
            name: 'Burnt Salmon',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'burnt_salmon' }
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
            icon: { kind: 'pixel', assetId: 'cooked_tuna' }
        },
        burnt_tuna: {
            name: 'Burnt Tuna',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'burnt_tuna' }
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
            icon: { kind: 'pixel', assetId: 'cooked_swordfish' }
        },
        burnt_swordfish: {
            name: 'Burnt Swordfish',
            type: 'resource',
            value: 1,
            stackable: false,
            actions: ['Drop'],
            defaultAction: 'Drop',
            icon: { kind: 'pixel', assetId: 'burnt_swordfish' }
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
                icon: { kind: 'pixel', assetId: 'feathers_bundle' }
            },
            bow_string: {
                name: 'Bow String',
                type: 'resource',
                value: 12,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'bow_string' }
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
                icon: { kind: 'pixel', assetId: def.handleItemId }
            };

            defs[def.staffItemId] = {
                name: def.staffName,
                type: 'component',
                value: def.staffValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: def.staffItemId }
            };

            defs[def.shaftsItemId] = {
                name: def.shaftsName,
                type: 'component',
                value: def.shaftsValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: def.shaftsItemId }
            };

            defs[def.headlessItemId] = {
                name: def.headlessName,
                type: 'component',
                value: def.headlessValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: def.headlessItemId }
            };

            defs[def.shortbowUItemId] = {
                name: def.shortbowUName,
                type: 'component',
                value: def.shortbowUValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: def.shortbowUItemId }
            };

            defs[def.longbowUItemId] = {
                name: def.longbowUName,
                type: 'component',
                value: def.longbowUValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: def.longbowUItemId }
            };

            defs[def.shortbowItemId] = {
                name: def.shortbowName,
                type: 'component',
                value: def.shortbowValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: def.shortbowItemId }
            };

            defs[def.longbowItemId] = {
                name: def.longbowName,
                type: 'component',
                value: def.longbowValue,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: def.longbowItemId }
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
                icon: { kind: 'pixel', assetId: def.itemId }
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
                icon: { kind: 'pixel', assetId: 'silver_ring' }
            },
            silver_amulet: {
                name: 'Silver Amulet',
                type: 'component',
                value: 40,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'silver_amulet' }
            },
            silver_tiara: {
                name: 'Silver Tiara',
                type: 'component',
                value: 40,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'silver_tiara' }
            },
            gold_ring: {
                name: 'Gold Ring',
                type: 'component',
                value: 100,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'gold_ring' }
            },
            gold_amulet: {
                name: 'Gold Amulet',
                type: 'component',
                value: 100,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'gold_amulet' }
            },
            gold_tiara: {
                name: 'Gold Tiara',
                type: 'component',
                value: 100,
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: 'gold_tiara' }
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
                icon: { kind: 'pixel', assetId: `${barTier}_bar` }
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
                icon: { kind: 'pixel', assetId: `${tier.id}_sword_blade` }
            };
            defs[`${tier.id}_axe_head`] = {
                name: `${tier.name} Axe Head`,
                type: 'component',
                value: Math.max(1, Math.floor(tier.gearValue * 0.3)),
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: `${tier.id}_axe_head` }
            };
            defs[`${tier.id}_pickaxe_head`] = {
                name: `${tier.name} Pickaxe Head`,
                type: 'component',
                value: Math.max(1, Math.floor(tier.gearValue * 0.3)),
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: `${tier.id}_pickaxe_head` }
            };
            defs[`${tier.id}_arrowheads`] = {
                name: `${tier.name} Arrowheads x15`,
                type: 'component',
                value: Math.max(1, Math.floor(tier.gearValue * 0.2)),
                stackable: false,
                actions: ['Use', 'Drop'],
                defaultAction: 'Use',
                icon: { kind: 'pixel', assetId: `${tier.id}_arrowheads` }
            };

            defs[`${tier.id}_boots`] = {
                name: `${tier.name} Boots`,
                type: 'feet',
                value: Math.max(1, Math.floor(tier.gearValue * 0.4)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.boots, str: 0 },
                icon: { kind: 'pixel', assetId: `${tier.id}_boots` }
            };
            defs[`${tier.id}_helmet`] = {
                name: `${tier.name} Helmet`,
                type: 'head',
                value: Math.max(1, Math.floor(tier.gearValue * 0.5)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.helmet, str: 0 },
                icon: { kind: 'pixel', assetId: `${tier.id}_helmet` }
            };
            defs[`${tier.id}_shield`] = {
                name: `${tier.name} Shield`,
                type: 'shield',
                value: Math.max(1, Math.floor(tier.gearValue * 0.55)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.shield, str: 0 },
                icon: { kind: 'pixel', assetId: `${tier.id}_shield` }
            };
            defs[`${tier.id}_platelegs`] = {
                name: `${tier.name} Platelegs`,
                type: 'legs',
                value: Math.max(1, Math.floor(tier.gearValue * 0.65)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.platelegs, str: 0 },
                icon: { kind: 'pixel', assetId: `${tier.id}_platelegs` }
            };
            defs[`${tier.id}_platebody`] = {
                name: `${tier.name} Platebody`,
                type: 'body',
                value: Math.max(1, Math.floor(tier.gearValue * 0.8)),
                stackable: false,
                actions: ['Equip', 'Drop'],
                defaultAction: 'Equip',
                stats: { atk: 0, def: tier.defStats.platebody, str: 0 },
                icon: { kind: 'pixel', assetId: `${tier.id}_platebody` }
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
                icon: { kind: 'pixel', assetId: `${tier.id}_sword` }
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

    function createMeleeCombatProfile(options) {
        const accuracyBonus = Number.isFinite(options && options.meleeAccuracyBonus) ? Math.floor(options.meleeAccuracyBonus) : 0;
        const strengthBonus = Number.isFinite(options && options.meleeStrengthBonus) ? Math.floor(options.meleeStrengthBonus) : 0;
        const meleeDefenseBonus = Number.isFinite(options && options.meleeDefenseBonus) ? Math.floor(options.meleeDefenseBonus) : 0;
        const rangedDefenseBonus = Number.isFinite(options && options.rangedDefenseBonus) ? Math.floor(options.rangedDefenseBonus) : meleeDefenseBonus;
        const magicDefenseBonus = Number.isFinite(options && options.magicDefenseBonus) ? Math.floor(options.magicDefenseBonus) : meleeDefenseBonus;
        return {
            attackProfile: {
                styleFamily: 'melee',
                damageType: 'melee',
                range: Number.isFinite(options && options.range) ? Math.max(1, Math.floor(options.range)) : 1,
                tickCycle: Number.isFinite(options && options.tickCycle) ? Math.max(1, Math.floor(options.tickCycle)) : 5,
                projectile: false,
                ammoUse: false,
                familyTag: typeof options.familyTag === 'string' ? options.familyTag : null
            },
            bonuses: {
                meleeAccuracyBonus: accuracyBonus,
                meleeStrengthBonus: strengthBonus,
                meleeDefenseBonus: meleeDefenseBonus,
                rangedDefenseBonus: rangedDefenseBonus,
                magicDefenseBonus: magicDefenseBonus
            },
            requiredAttackLevel: Number.isFinite(options && options.requiredAttackLevel)
                ? Math.max(1, Math.floor(options.requiredAttackLevel))
                : 1,
            weaponFamily: typeof options.weaponFamily === 'string' ? options.weaponFamily : null,
            toolFamily: typeof options.toolFamily === 'string' ? options.toolFamily : null
        };
    }

    function cloneCombatProfile(profile) {
        if (!profile || typeof profile !== 'object') return null;
        return {
            attackProfile: Object.assign({}, profile.attackProfile || {}),
            bonuses: Object.assign({}, profile.bonuses || {}),
            requiredAttackLevel: Number.isFinite(profile.requiredAttackLevel) ? Math.floor(profile.requiredAttackLevel) : 1,
            weaponFamily: typeof profile.weaponFamily === 'string' ? profile.weaponFamily : null,
            toolFamily: typeof profile.toolFamily === 'string' ? profile.toolFamily : null
        };
    }

    function applyCombatProfiles(itemDefs) {
        if (!itemDefs || typeof itemDefs !== 'object') return;

        const weaponRows = {
            bronze_sword: { meleeAccuracyBonus: 4, meleeStrengthBonus: 4, tickCycle: 4, requiredAttackLevel: 1, weaponFamily: 'sword', familyTag: 'sword' },
            iron_sword: { meleeAccuracyBonus: 6, meleeStrengthBonus: 6, tickCycle: 4, requiredAttackLevel: 1, weaponFamily: 'sword', familyTag: 'sword' },
            steel_sword: { meleeAccuracyBonus: 10, meleeStrengthBonus: 10, tickCycle: 4, requiredAttackLevel: 10, weaponFamily: 'sword', familyTag: 'sword' },
            mithril_sword: { meleeAccuracyBonus: 15, meleeStrengthBonus: 15, tickCycle: 4, requiredAttackLevel: 20, weaponFamily: 'sword', familyTag: 'sword' },
            adamant_sword: { meleeAccuracyBonus: 21, meleeStrengthBonus: 21, tickCycle: 4, requiredAttackLevel: 30, weaponFamily: 'sword', familyTag: 'sword' },
            rune_sword: { meleeAccuracyBonus: 28, meleeStrengthBonus: 28, tickCycle: 4, requiredAttackLevel: 40, weaponFamily: 'sword', familyTag: 'sword' },
            bronze_axe: { meleeAccuracyBonus: 4, meleeStrengthBonus: 2, tickCycle: 5, requiredAttackLevel: 1, toolFamily: 'axe', familyTag: 'axe' },
            iron_axe: { meleeAccuracyBonus: 6, meleeStrengthBonus: 3, tickCycle: 5, requiredAttackLevel: 1, toolFamily: 'axe', familyTag: 'axe' },
            steel_axe: { meleeAccuracyBonus: 10, meleeStrengthBonus: 5, tickCycle: 5, requiredAttackLevel: 10, toolFamily: 'axe', familyTag: 'axe' },
            mithril_axe: { meleeAccuracyBonus: 15, meleeStrengthBonus: 7, tickCycle: 5, requiredAttackLevel: 20, toolFamily: 'axe', familyTag: 'axe' },
            adamant_axe: { meleeAccuracyBonus: 21, meleeStrengthBonus: 10, tickCycle: 5, requiredAttackLevel: 30, toolFamily: 'axe', familyTag: 'axe' },
            rune_axe: { meleeAccuracyBonus: 28, meleeStrengthBonus: 14, tickCycle: 5, requiredAttackLevel: 40, toolFamily: 'axe', familyTag: 'axe' },
            bronze_pickaxe: { meleeAccuracyBonus: 4, meleeStrengthBonus: 2, tickCycle: 5, requiredAttackLevel: 1, toolFamily: 'pickaxe', familyTag: 'pickaxe' },
            iron_pickaxe: { meleeAccuracyBonus: 6, meleeStrengthBonus: 3, tickCycle: 5, requiredAttackLevel: 1, toolFamily: 'pickaxe', familyTag: 'pickaxe' },
            steel_pickaxe: { meleeAccuracyBonus: 10, meleeStrengthBonus: 5, tickCycle: 5, requiredAttackLevel: 10, toolFamily: 'pickaxe', familyTag: 'pickaxe' },
            mithril_pickaxe: { meleeAccuracyBonus: 15, meleeStrengthBonus: 7, tickCycle: 5, requiredAttackLevel: 20, toolFamily: 'pickaxe', familyTag: 'pickaxe' },
            adamant_pickaxe: { meleeAccuracyBonus: 21, meleeStrengthBonus: 10, tickCycle: 5, requiredAttackLevel: 30, toolFamily: 'pickaxe', familyTag: 'pickaxe' },
            rune_pickaxe: { meleeAccuracyBonus: 28, meleeStrengthBonus: 14, tickCycle: 5, requiredAttackLevel: 40, toolFamily: 'pickaxe', familyTag: 'pickaxe' },
            fishing_rod: { meleeAccuracyBonus: 8, meleeStrengthBonus: 4, tickCycle: 5, requiredAttackLevel: 1, toolFamily: 'fishing_rod', familyTag: 'fishing_rod' },
            harpoon: { meleeAccuracyBonus: 18, meleeStrengthBonus: 9, tickCycle: 5, requiredAttackLevel: 30, toolFamily: 'harpoon', familyTag: 'harpoon' },
            rune_harpoon: { meleeAccuracyBonus: 24, meleeStrengthBonus: 12, tickCycle: 5, requiredAttackLevel: 40, toolFamily: 'harpoon', familyTag: 'harpoon' }
        };

        const armorRows = {
            bronze_boots: 1,
            bronze_helmet: 3,
            bronze_shield: 4,
            bronze_platelegs: 5,
            bronze_platebody: 7,
            iron_boots: 2,
            iron_helmet: 5,
            iron_shield: 6,
            iron_platelegs: 8,
            iron_platebody: 10,
            steel_boots: 3,
            steel_helmet: 8,
            steel_shield: 10,
            steel_platelegs: 12,
            steel_platebody: 15,
            mithril_boots: 5,
            mithril_helmet: 12,
            mithril_shield: 15,
            mithril_platelegs: 18,
            mithril_platebody: 22,
            adamant_boots: 7,
            adamant_helmet: 17,
            adamant_shield: 21,
            adamant_platelegs: 25,
            adamant_platebody: 30,
            rune_boots: 10,
            rune_helmet: 24,
            rune_shield: 28,
            rune_platelegs: 34,
            rune_platebody: 40
        };

        const armorDefenseRequirementByItemId = {
            bronze_boots: 1,
            bronze_helmet: 1,
            bronze_shield: 1,
            bronze_platelegs: 1,
            bronze_platebody: 1,
            iron_boots: 1,
            iron_helmet: 1,
            iron_shield: 1,
            iron_platelegs: 1,
            iron_platebody: 1,
            steel_boots: 10,
            steel_helmet: 10,
            steel_shield: 10,
            steel_platelegs: 10,
            steel_platebody: 10,
            mithril_boots: 20,
            mithril_helmet: 20,
            mithril_shield: 20,
            mithril_platelegs: 20,
            mithril_platebody: 20,
            adamant_boots: 30,
            adamant_helmet: 30,
            adamant_shield: 30,
            adamant_platelegs: 30,
            adamant_platebody: 30,
            rune_boots: 40,
            rune_helmet: 40,
            rune_shield: 40,
            rune_platelegs: 40,
            rune_platebody: 40
        };

        const fishingRequirementByItemId = {
            fishing_rod: 10,
            harpoon: 30,
            rune_harpoon: 40
        };

        const weaponIds = Object.keys(weaponRows);
        for (let i = 0; i < weaponIds.length; i++) {
            const itemId = weaponIds[i];
            const def = itemDefs[itemId];
            if (!def) continue;
            const row = weaponRows[itemId];
            def.combat = createMeleeCombatProfile(row);
            def.requiredAttackLevel = def.combat.requiredAttackLevel;
            def.stats = {
                atk: row.meleeAccuracyBonus,
                def: 0,
                str: row.meleeStrengthBonus
            };
            if (Object.prototype.hasOwnProperty.call(fishingRequirementByItemId, itemId)) {
                def.type = 'weapon';
                if (itemId === 'fishing_rod') def.weaponClass = 'fishing_rod';
                if (def.combat) def.combat.requiredAttackLevel = 1;
                def.requiredAttackLevel = undefined;
                def.requiredFishingLevel = fishingRequirementByItemId[itemId];
                def.actions = ['Equip', 'Use', 'Drop'];
                def.defaultAction = 'Equip';
            }
        }

        const armorIds = Object.keys(armorRows);
        for (let i = 0; i < armorIds.length; i++) {
            const itemId = armorIds[i];
            const def = itemDefs[itemId];
            if (!def) continue;
            const defenseBonus = armorRows[itemId];
            def.combat = createMeleeCombatProfile({
                meleeAccuracyBonus: 0,
                meleeStrengthBonus: 0,
                meleeDefenseBonus: defenseBonus,
                rangedDefenseBonus: defenseBonus,
                magicDefenseBonus: defenseBonus,
                tickCycle: 5,
                range: 1,
                familyTag: 'armor'
            });
            def.stats = {
                atk: 0,
                def: defenseBonus,
                str: 0
            };
            def.requiredDefenseLevel = Object.prototype.hasOwnProperty.call(armorDefenseRequirementByItemId, itemId)
                ? Math.max(1, Math.floor(armorDefenseRequirementByItemId[itemId]))
                : 1;
        }
    }

    applyCombatProfiles(ITEM_DEFS);

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
            if (def.combat) db[id].combat = cloneCombatProfile(def.combat);
            if (Number.isFinite(def.requiredAttackLevel)) db[id].requiredAttackLevel = Math.max(1, Math.floor(def.requiredAttackLevel));
            if (Number.isFinite(def.requiredFishingLevel)) db[id].requiredFishingLevel = Math.max(1, Math.floor(def.requiredFishingLevel));
            if (Number.isFinite(def.requiredDefenseLevel)) db[id].requiredDefenseLevel = Math.max(1, Math.floor(def.requiredDefenseLevel));
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
