const path = require("path");
const { loadTsModule } = require("../lib/ts-module-loader");

const root = path.resolve(__dirname, "..", "..");

module.exports = loadTsModule(path.join(root, "src", "game", "world", "tile-ids.ts"));
