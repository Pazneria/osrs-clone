(function () {
    const GEM_HOTSPOT = { x: 200, y: 370, radius: 20 };

    const ROCK_DISPLAY_NAMES = {
        clay: 'Clay rock',
        copper: 'Copper rock',
        tin: 'Tin rock',
        iron: 'Iron rock',
        coal: 'Coal rock',
        silver: 'Silver rock',
        sapphire: 'Sapphire rock',
        gold: 'Gold rock',
        emerald: 'Emerald rock',
        rune_essence: 'Rune essence'
    };

    const ROCK_COLOR_HEX = {
        clay: 0xa78668,
        copper: 0xb06a4c,
        tin: 0x9aa5ae,
        iron: 0x6f7985,
        coal: 0x3f444c,
        silver: 0xc8ced6,
        sapphire: 0x3d6ed8,
        gold: 0xd4a829,
        emerald: 0x2aa66f,
        rune_essence: 0x7e848c
    };

    function rockNodeKey(x, y, z = 0) {
        return z + ':' + x + ',' + y;
    }

    function isRuneEssenceRockCoordinate(x, y, z = 0, runeEssenceRocks = []) {
        if (!Array.isArray(runeEssenceRocks)) return false;
        return runeEssenceRocks.some((rock) => rock && rock.x === x && rock.y === y && rock.z === z);
    }

    function isGemHotspotCoordinate(x, y, z = 0) {
        if (z !== 0) return false;
        return Math.hypot(x - GEM_HOTSPOT.x, y - GEM_HOTSPOT.y) <= GEM_HOTSPOT.radius;
    }

    function oreTypeForTile(input = {}) {
        const x = input.x;
        const y = input.y;
        const z = Number.isFinite(input.z) ? input.z : 0;
        const rockOreOverrides = input.rockOreOverrides || null;
        const overrideKey = rockNodeKey(x, y, z);
        const overrideOreType = rockOreOverrides && rockOreOverrides[overrideKey];
        if (overrideOreType) return overrideOreType;
        if (isRuneEssenceRockCoordinate(x, y, z, input.runeEssenceRocks)) return 'rune_essence';
        const hash = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
        if (isGemHotspotCoordinate(x, y, z)) {
            const gemTypes = ['sapphire', 'emerald'];
            return gemTypes[hash % gemTypes.length];
        }
        const weightedTypes = ['clay', 'copper', 'tin', 'iron', 'coal', 'silver', 'gold'];
        return weightedTypes[hash % weightedTypes.length];
    }

    function getRockDisplayName(oreType) {
        return ROCK_DISPLAY_NAMES[oreType] || 'Rock';
    }

    function getRockColorHex(oreType) {
        return ROCK_COLOR_HEX[oreType] || 0x8f6b58;
    }

    window.WorldRockNodeRuntime = {
        GEM_HOTSPOT,
        ROCK_COLOR_HEX,
        ROCK_DISPLAY_NAMES,
        getRockColorHex,
        getRockDisplayName,
        isGemHotspotCoordinate,
        isRuneEssenceRockCoordinate,
        oreTypeForTile,
        rockNodeKey
    };
})();
