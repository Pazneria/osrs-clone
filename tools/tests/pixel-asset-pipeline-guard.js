const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { encodePng, readPngSize } = require("../pixel/pixel-png");
const { buildRgbaBuffer } = require("../pixel/pixel-source");
const { buildObjFromPixelSource } = require("../pixel/pixel-model");
const { loadPixelSource } = require("../pixel/pixel-project");
const { readRepoFile } = require("./repo-file-test-utils");

function getSolidBounds(source) {
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  for (let y = 0; y < source.pixels.length; y += 1) {
    const row = source.pixels[y];
    for (let x = 0; x < row.length; x += 1) {
      const symbol = row[x];
      if (!symbol || symbol === "." || source.palette[symbol] === "transparent") continue;
      xMin = Math.min(xMin, x);
      yMin = Math.min(yMin, y);
      xMax = Math.max(xMax, x);
      yMax = Math.max(yMax, y);
    }
  }
  if (!Number.isFinite(xMin)) return null;
  return {
    xMin,
    yMin,
    xMax,
    yMax,
    width: xMax - xMin + 1,
    height: yMax - yMin + 1
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const pixelSourceDir = path.join(root, "assets", "pixel-src");
  const builtIconPath = path.join(root, "assets", "pixel", "iron_axe.png");
  const removedLegacyPaths = [
    path.join(root, "tools", "pixel", "pixelize.ps1"),
    path.join(root, "tools", "pixel", "batch-pixelize.ps1"),
    path.join(root, "tools", "pixel", "import-png-to-pixelsource.ps1"),
    path.join(root, "tools", "pixel", "migrate-runtime-icons.js"),
    path.join(root, "tools", "pixel", "migrate-svg-sprites-to-source.js"),
    path.join(root, "tools", "pixel", "legacy-icon-sprite-catalog.js"),
    path.join(root, "tools", "model", "image-to-obj.ps1"),
    path.join(root, "tools", "content", "create-item-from-image.ps1")
  ];

  const indexHtml = readRepoFile(root, "index.html");
  const coreScript = readRepoFile(root, "src/js/core.js");
  const itemCatalogScript = readRepoFile(root, "src/js/content/item-catalog.js");
  const packageJson = readRepoFile(root, "package.json");

  assert(!indexHtml.includes("icon-sprite-catalog.js"), "index should not load the legacy icon sprite catalog");
  assert(!coreScript.includes("window.IconSpriteCatalog"), "core should not reference IconSpriteCatalog");
  assert(!coreScript.includes("function makeIconSprite"), "core should not define makeIconSprite");
  assert(!itemCatalogScript.includes("kind: 'sprite'"), "runtime item catalog should not contain sprite icons");
  assert(!itemCatalogScript.includes("kind: 'image'"), "runtime item catalog should not contain image icons");
  assert(itemCatalogScript.includes("kind: 'pixel'"), "runtime item catalog should use pixel icons");
  assert(itemCatalogScript.includes("assetId"), "runtime item catalog should reference assetId");
  assert(fs.existsSync(pixelSourceDir), "assets/pixel-src directory missing");
  assert(fs.existsSync(builtIconPath), "expected generated icon for iron_axe");
  assert(!packageJson.includes("\"tool:pixelize\""), "package.json should not expose the removed tool:pixelize script");
  assert(!packageJson.includes("\"tool:pixelize:batch\""), "package.json should not expose the removed tool:pixelize:batch script");
  assert(!packageJson.includes("\"tool:pixel:migrate\""), "package.json should not expose the removed tool:pixel:migrate script");
  assert(!packageJson.includes("\"tool:pixel:migrate:sprites\""), "package.json should not expose the removed tool:pixel:migrate:sprites script");
  assert(!packageJson.includes("\"tool:pixel:import-png\""), "package.json should not expose the removed tool:pixel:import-png script");
  assert(!packageJson.includes("\"tool:model:from-image\""), "package.json should not expose the removed tool:model:from-image script");
  assert(!packageJson.includes("\"tool:item:create\""), "package.json should not expose the removed tool:item:create script");
  removedLegacyPaths.forEach((legacyPath) => {
    assert(!fs.existsSync(legacyPath), `removed legacy asset tool should stay deleted: ${path.relative(root, legacyPath)}`);
  });

  const source = loadPixelSource(root, "iron_axe");
  const rgba = buildRgbaBuffer(source);
  const pngA = encodePng(source.width, source.height, rgba);
  const pngB = encodePng(source.width, source.height, rgba);
  assert(pngA.equals(pngB), "PNG export must be deterministic");

  const objA = buildObjFromPixelSource(source).text;
  const objB = buildObjFromPixelSource(source).text;
  assert(objA === objB, "OBJ export must be deterministic");

  const size = readPngSize(builtIconPath);
  assert(size.width === 32 && size.height === 32, "generated runtime icon must be 32x32");

  [
    "normal_shortbow",
    "normal_longbow",
    "oak_shortbow",
    "oak_longbow",
    "willow_shortbow",
    "willow_longbow",
    "maple_shortbow",
    "maple_longbow",
    "yew_shortbow",
    "yew_longbow"
  ].forEach((assetId) => {
    const bowSource = loadPixelSource(root, assetId);
    const bounds = getSolidBounds(bowSource);
    assert(bounds, `${assetId} should contain visible pixels`);
    assert(bounds.width >= 10, `${assetId} should be wide enough to read in the inventory`);
    assert(bounds.height >= 24, `${assetId} should fill enough vertical space to read in the inventory`);
    assert(bounds.yMin <= 4, `${assetId} should not be tucked into the lower part of the icon canvas`);
  });

  console.log("Pixel asset pipeline guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
