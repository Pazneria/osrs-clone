const fs = require("fs");
const path = require("path");
const { encodePng, readPngSize } = require("../pixel/pixel-png");
const { buildRgbaBuffer } = require("../pixel/pixel-source");
const { buildObjFromPixelSource } = require("../pixel/pixel-model");
const { getPixelArtifactPaths, loadPixelSource } = require("../pixel/pixel-project");
const { loadRuntimeItemCatalog } = require("../content/runtime-item-catalog");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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
  const runtimeItems = loadRuntimeItemCatalog(root).itemDefs;
  const iconStatus = JSON.parse(fs.readFileSync(path.join(root, "content", "icon-status.json"), "utf8"));

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

  ["borrowed_ring", "borrowed_amulet", "borrowed_tiara"].forEach((assetId) => {
    const borrowedSource = loadPixelSource(root, assetId);
    const baseAssetId = assetId.replace("borrowed_", "silver_");
    const baseSource = loadPixelSource(root, baseAssetId);
    const bounds = getSolidBounds(borrowedSource);
    const artifacts = getPixelArtifactPaths(root, assetId);
    const itemDef = runtimeItems[assetId];
    const statusEntry = iconStatus.items && iconStatus.items[assetId];

    assert(bounds, `${assetId} should contain visible pixels`);
    assert(
      JSON.stringify(borrowedSource.pixels) !== JSON.stringify(baseSource.pixels),
      `${assetId} should not reuse the ${baseAssetId} placeholder silhouette`
    );
    assert(fs.existsSync(artifacts.icon), `${assetId} should have a generated PNG icon`);
    assert(fs.existsSync(artifacts.model), `${assetId} should have a generated OBJ model`);
    assert(fs.existsSync(artifacts.groundModel), `${assetId} should have a generated ground OBJ model`);
    assert(itemDef && itemDef.icon && itemDef.icon.assetId === assetId, `${assetId} item should use its dedicated icon asset`);
    assert(statusEntry && statusEntry.assetId === assetId, `${assetId} icon status should track the dedicated asset`);
    assert(statusEntry.status === "done", `${assetId} icon status should be done`);
    assert(statusEntry.treatment === "bespoke", `${assetId} icon status should be bespoke`);
  });

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
