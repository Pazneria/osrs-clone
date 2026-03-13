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
  const pixelSourceDir = path.join(root, "assets", "pixel-src");
  const builtIconPath = path.join(root, "assets", "pixel", "iron_axe.png");

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const coreScript = fs.readFileSync(corePath, "utf8");
  const itemCatalogScript = fs.readFileSync(itemCatalogPath, "utf8");

  assert(!indexHtml.includes("icon-sprite-catalog.js"), "index should not load the legacy icon sprite catalog");
  assert(!coreScript.includes("window.IconSpriteCatalog"), "core should not reference IconSpriteCatalog");
  assert(!coreScript.includes("function makeIconSprite"), "core should not define makeIconSprite");
  assert(!itemCatalogScript.includes("kind: 'sprite'"), "runtime item catalog should not contain sprite icons");
  assert(!itemCatalogScript.includes("kind: 'image'"), "runtime item catalog should not contain image icons");
  assert(itemCatalogScript.includes("kind: 'pixel'"), "runtime item catalog should use pixel icons");
  assert(itemCatalogScript.includes("assetId"), "runtime item catalog should reference assetId");
  assert(fs.existsSync(pixelSourceDir), "assets/pixel-src directory missing");
  assert(fs.existsSync(builtIconPath), "expected generated icon for iron_axe");

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
