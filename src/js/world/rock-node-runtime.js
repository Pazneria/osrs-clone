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

    function depleteRockNodeRecord(node, currentTick, respawnTicks = 12) {
        if (!node) return false;
        node.depletedUntilTick = currentTick + Math.max(1, respawnTicks);
        node.successfulYields = 0;
        node.lastInteractionTick = 0;
        return true;
    }

    function resolveChunkKeyForRockNodeKey(key, chunkSize) {
        if (typeof key !== 'string' || !Number.isFinite(chunkSize) || chunkSize <= 0) return null;
        const parts = key.split(':');
        if (parts.length < 2) return null;
        const xy = parts[1].split(',');
        const x = parseInt(xy[0], 10);
        const y = parseInt(xy[1], 10);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return Math.floor(x / chunkSize) + ',' + Math.floor(y / chunkSize);
    }

    function tickRockNodeRespawns(input = {}) {
        const rockNodes = input.rockNodes || {};
        const currentTick = input.currentTick;
        const chunkSize = input.chunkSize;
        const chunksToRefresh = new Set();
        for (const [key, node] of Object.entries(rockNodes)) {
            if (!node || !node.depletedUntilTick) continue;
            if (currentTick < node.depletedUntilTick) continue;
            node.depletedUntilTick = 0;
            node.successfulYields = 0;
            node.lastInteractionTick = 0;
            const chunkKey = resolveChunkKeyForRockNodeKey(key, chunkSize);
            if (chunkKey) chunksToRefresh.add(chunkKey);
        }
        return Array.from(chunksToRefresh);
    }

    window.WorldRockNodeRuntime = {
        GEM_HOTSPOT,
        ROCK_DISPLAY_NAMES,
        depleteRockNodeRecord,
        getRockDisplayName,
        isGemHotspotCoordinate,
        isRuneEssenceRockCoordinate,
        oreTypeForTile,
        resolveChunkKeyForRockNodeKey,
        rockNodeKey,
        tickRockNodeRespawns
    };
})();
