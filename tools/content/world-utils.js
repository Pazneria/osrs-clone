const { MAP_SIZE } = require("./world-constants");
const {
  getWorldManifestEntry,
  loadStarterTownWorld,
  loadWorldContent,
  loadWorldManifest
} = require("./world-content");
const { loadShopEconomy } = require("./shop-economy-loader");
const {
  TileId,
  WALKABLE_TILE_SET,
  isDoorTileId,
  isNaturalTileId,
  isTreeTileId,
  isWalkableTileId,
  isWaterTileId,
  isWoodenGateTileId
} = require("./tile-ids");
const {
  collectAdjacencyViolations,
  findShortestPathLength,
  getChebyshevDistance,
  isWalkable
} = require("./world-pathing");
const {
  buildStarterTownGameplayMap,
  buildStarterTownLogicalMap,
  buildWorldGameplayMap,
  buildWorldLogicalMap,
  inTownCore
} = require("./world-map-builder");

const WALKABLE = WALKABLE_TILE_SET;

module.exports = {
  MAP_SIZE,
  TileId,
  WALKABLE,
  isDoorTileId,
  isNaturalTileId,
  isTreeTileId,
  isWalkableTileId,
  isWaterTileId,
  isWoodenGateTileId,
  inTownCore,
  loadWorldManifest,
  getWorldManifestEntry,
  loadWorldContent,
  loadStarterTownWorld,
  loadShopEconomy,
  buildWorldLogicalMap,
  buildWorldGameplayMap,
  buildStarterTownLogicalMap,
  buildStarterTownGameplayMap,
  findShortestPathLength,
  collectAdjacencyViolations,
  getChebyshevDistance,
  isWalkable
};
