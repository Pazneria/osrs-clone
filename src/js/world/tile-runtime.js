// Canonical legacy tile IDs and tile classification helpers.
const TileId = Object.freeze({
    GRASS: 0,
    TREE: 1,
    ROCK: 2,
    DIRT: 3,
    STUMP: 4,
    OBSTACLE: 5,
    FLOOR_WOOD: 6,
    FLOOR_STONE: 7,
    FLOOR_BRICK: 8,
    BANK_BOOTH: 9,
    WALL: 11,
    TOWER: 12,
    STAIRS_UP: 13,
    STAIRS_DOWN: 14,
    STAIRS_RAMP: 15,
    SOLID_NPC: 16,
    SHOP_COUNTER: 17,
    DOOR_CLOSED: 18,
    DOOR_OPEN: 19,
    SHORE: 20,
    WATER_SHALLOW: 21,
    WATER_DEEP: 22,
    FENCE: 23,
    WOODEN_GATE_CLOSED: 24,
    WOODEN_GATE_OPEN: 25,
    SAND: 26
});

const WALKABLE_TILES = [
    TileId.GRASS,
    TileId.DIRT,
    TileId.SAND,
    TileId.FLOOR_WOOD,
    TileId.FLOOR_STONE,
    TileId.FLOOR_BRICK,
    TileId.STAIRS_UP,
    TileId.STAIRS_DOWN,
    TileId.STAIRS_RAMP,
    TileId.DOOR_OPEN,
    TileId.WOODEN_GATE_OPEN,
    TileId.SHORE
];

const WATER_TILE_SET = new Set([TileId.WATER_SHALLOW, TileId.WATER_DEEP]);
const NATURAL_TILE_SET = new Set([
    TileId.GRASS,
    TileId.DIRT,
    TileId.SAND,
    TileId.TREE,
    TileId.ROCK,
    TileId.STUMP,
    TileId.SHORE,
    TileId.WATER_SHALLOW,
    TileId.WATER_DEEP
]);
const TREE_TILE_SET = new Set([TileId.TREE, TileId.STUMP]);
const WALKABLE_TILE_SET = new Set(WALKABLE_TILES);

function isWaterTileId(tileId) {
    return WATER_TILE_SET.has(tileId);
}

function isNaturalTileId(tileId) {
    return NATURAL_TILE_SET.has(tileId);
}

function isTreeTileId(tileId) {
    return TREE_TILE_SET.has(tileId);
}

function isWalkableTileId(tileId) {
    return WALKABLE_TILE_SET.has(tileId);
}

function isDoorTileId(tileId) {
    return tileId === TileId.DOOR_CLOSED
        || tileId === TileId.DOOR_OPEN
        || isWoodenGateTileId(tileId);
}

function isWoodenGateTileId(tileId) {
    return tileId === TileId.WOODEN_GATE_CLOSED || tileId === TileId.WOODEN_GATE_OPEN;
}

window.TileId = TileId;
window.isWaterTileId = isWaterTileId;
window.isNaturalTileId = isNaturalTileId;
window.isTreeTileId = isTreeTileId;
window.isWalkableTileId = isWalkableTileId;
window.isDoorTileId = isDoorTileId;
window.isWoodenGateTileId = isWoodenGateTileId;
