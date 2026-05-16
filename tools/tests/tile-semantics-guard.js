const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { loadTsModule } = require("../lib/ts-module-loader");
const { readRepoFile } = require("./repo-file-test-utils");

const FILES_TO_SCAN = [
  "src/js/world/tile-runtime.js",
  "src/js/core.js",
  "src/js/world.js",
  "src/js/input-render.js"
];

const DUPLICATE_SCAN_FILES = [
  "src/js/core.js",
  "src/js/world.js",
  "src/js/input-render.js",
  "tools/content/freeze-main-overworld-world.js",
  "tools/tests/skill-runtime-parity.js"
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
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const coreSource = readRepoFile(root, "src/js/core.js");
  const canonical = loadTsModule(path.join(root, "src/game/world/tile-ids.ts"));
  const toolTileRuntime = require("../content/tile-ids");
  const legacySandbox = { window: {} };
  const legacySource = readRepoFile(root, "src/js/world/tile-runtime.js");
  vm.runInNewContext(legacySource, legacySandbox, { filename: "src/js/world/tile-runtime.js" });

  assert(
    manifestSource.indexOf("world-tile-runtime") >= 0
      && manifestSource.indexOf("world-tile-runtime") < manifestSource.indexOf("{ id: \"core\""),
    "legacy script manifest should load world tile runtime before core.js"
  );
  assert(!coreSource.includes("const TileId = Object.freeze"), "core.js should not own canonical tile IDs");
  assert(JSON.stringify(legacySandbox.window.TileId) === JSON.stringify(canonical.TileId), "legacy tile runtime TileId should match canonical typed TileId");
  assert(JSON.stringify(toolTileRuntime.TileId) === JSON.stringify(canonical.TileId), "tool tile adapter TileId should match canonical typed TileId");

  const tileValues = Object.values(canonical.TileId).filter((value) => Number.isFinite(value));
  const helperNames = [
    "isWaterTileId",
    "isNaturalTileId",
    "isTreeTileId",
    "isWalkableTileId",
    "isDoorTileId",
    "isWoodenGateTileId"
  ];
  for (let i = 0; i < helperNames.length; i++) {
    const helperName = helperNames[i];
    for (let j = 0; j < tileValues.length; j++) {
      const value = tileValues[j];
      assert(
        legacySandbox.window[helperName](value) === canonical[helperName](value),
        `legacy ${helperName}(${value}) should match canonical helper`
      );
      assert(
        toolTileRuntime[helperName](value) === canonical[helperName](value),
        `tool ${helperName}(${value}) should match canonical helper`
      );
    }
  }

  const duplicatePatterns = [
    "const TileId = Object.freeze",
    "function isWaterTileId(",
    "function isNaturalTileId(",
    "function isTreeTileId(",
    "function isWalkableTileId(",
    "function isDoorTileId(",
    "function isWoodenGateTileId("
  ];
  for (let i = 0; i < DUPLICATE_SCAN_FILES.length; i++) {
    const relPath = DUPLICATE_SCAN_FILES[i];
    const source = readRepoFile(root, relPath);
    for (let j = 0; j < duplicatePatterns.length; j++) {
      assert(!source.includes(duplicatePatterns[j]), `${relPath} should import/delegate canonical tile semantics instead of redefining ${duplicatePatterns[j]}`);
    }
  }

  for (let i = 0; i < FILES_TO_SCAN.length; i++) {
    const relPath = FILES_TO_SCAN[i];
    const source = readRepoFile(root, relPath);
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
