const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const FILES_TO_SCAN = [
  "src/js/world/tile-runtime.js",
  "src/js/core.js",
  "src/js/world.js",
  "src/js/input-render.js"
];

const TILE_COMPARISON_PATTERNS = [
  /\b(?:tile|tileType|targetTileType|nt|tt|neighborTile|currentTile|nextTile|t)\s*(?:===|!==|==|!=)\s*\d+\b/,
  /\b\d+\s*(?:===|!==|==|!=)\s*(?:tile|tileType|targetTileType|nt|tt|neighborTile|currentTile|nextTile|t)\b/,
  /\blogicalMap\s*\[[^\n]+?(?:===|!==|==|!=)\s*\d+\b/,
  /\b\d+\s*(?:===|!==|==|!=)\s*logicalMap\s*\[/
];

function hasTileLiteralComparison(line) {
  const codeOnly = line.replace(/\/\/.*$/, "").trim();
  if (!codeOnly) return false;
  for (let i = 0; i < TILE_COMPARISON_PATTERNS.length; i++) {
    if (TILE_COMPARISON_PATTERNS[i].test(codeOnly)) return true;
  }
  return false;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const violations = [];
  const manifestSource = fs.readFileSync(path.join(root, "src/game/platform/legacy-script-manifest.ts"), "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src/js/core.js"), "utf8");

  assert(
    manifestSource.indexOf("world-tile-runtime") >= 0
      && manifestSource.indexOf("world-tile-runtime") < manifestSource.indexOf("{ id: \"core\""),
    "legacy script manifest should load world tile runtime before core.js"
  );
  assert(!coreSource.includes("const TileId = Object.freeze"), "core.js should not own canonical tile IDs");

  for (let i = 0; i < FILES_TO_SCAN.length; i++) {
    const relPath = FILES_TO_SCAN[i];
    const absPath = path.join(root, relPath);
    const source = fs.readFileSync(absPath, "utf8");
    const lines = source.split(/\r?\n/);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!hasTileLiteralComparison(line)) continue;
      violations.push(`${relPath}:${lineIndex + 1}: ${line.trim()}`);
    }
  }

  assert(
    violations.length === 0,
    [
      "Found direct numeric tile comparison(s). Use TileId constants and tile helper predicates instead.",
      ...violations
    ].join("\n")
  );

  console.log("Tile semantics guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
