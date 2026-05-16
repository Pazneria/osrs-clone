export const TileId = Object.freeze({
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

type TileIdName = keyof typeof TileId;
type TileIdValue = (typeof TileId)[TileIdName];

const WALKABLE_TILES: ReadonlyArray<TileIdValue> = Object.freeze([
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
]);

const WATER_TILES: ReadonlyArray<TileIdValue> = Object.freeze([
  TileId.WATER_SHALLOW,
  TileId.WATER_DEEP
]);

const NATURAL_TILES: ReadonlyArray<TileIdValue> = Object.freeze([
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

const TREE_TILES: ReadonlyArray<TileIdValue> = Object.freeze([
  TileId.TREE,
  TileId.STUMP
]);

const WALKABLE_TILE_SET = new Set<TileIdValue>(WALKABLE_TILES);
const WATER_TILE_SET = new Set<TileIdValue>(WATER_TILES);
const NATURAL_TILE_SET = new Set<TileIdValue>(NATURAL_TILES);
const TREE_TILE_SET = new Set<TileIdValue>(TREE_TILES);

export function isWaterTileId(tileId: number): boolean {
  return WATER_TILE_SET.has(tileId as TileIdValue);
}

export function isNaturalTileId(tileId: number): boolean {
  return NATURAL_TILE_SET.has(tileId as TileIdValue);
}

export function isTreeTileId(tileId: number): boolean {
  return TREE_TILE_SET.has(tileId as TileIdValue);
}

export function isWalkableTileId(tileId: number): boolean {
  return WALKABLE_TILE_SET.has(tileId as TileIdValue);
}

export function isWoodenGateTileId(tileId: number): boolean {
  return tileId === TileId.WOODEN_GATE_CLOSED || tileId === TileId.WOODEN_GATE_OPEN;
}

export function isDoorTileId(tileId: number): boolean {
  return tileId === TileId.DOOR_CLOSED
    || tileId === TileId.DOOR_OPEN
    || isWoodenGateTileId(tileId);
}
