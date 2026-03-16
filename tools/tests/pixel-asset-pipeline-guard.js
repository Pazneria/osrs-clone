const fs = require("fs");
const path = require("path");
const { encodePng, readPngSize } = require("../pixel/pixel-png");
const { buildRgbaBuffer } = require("../pixel/pixel-source");
const { buildObjFromPixelSource } = require("../pixel/pixel-model");
const { loadPixelSource } = require("../pixel/pixel-project");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const indexPath = path.join(root, "index.html");
  const corePath = path.join(root, "src/js/core.js");
  const itemCatalogPath = path.join(root, "src/js/content/item-catalog.js");
  const packageJsonPath = path.join(root, "package.json");
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

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const coreScript = fs.readFileSync(corePath, "utf8");
  const itemCatalogScript = fs.readFileSync(itemCatalogPath, "utf8");
  const packageJson = fs.readFileSync(packageJsonPath, "utf8");

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

  console.log("Pixel asset pipeline guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
