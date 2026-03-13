const { spriteMarkupByKey, fallbackSpriteKeyByKey } = require("./legacy-icon-sprite-catalog");
const { CANVAS_SIZE, TRANSPARENT_SYMBOL, makeSymbolAllocator } = require("./pixel-source");
const { getProjectRoot, writePixelSource } = require("./pixel-project");

const SCALE = 2;

function parseRectAttributes(attrText) {
  const attributes = {};
  attrText.replace(/([a-zA-Z_:]+)="([^"]*)"/g, function (_, key, value) {
    attributes[key] = value;
    return "";
  });
  return attributes;
}

function parseSvgRects(markup) {
  const rects = [];
  markup.replace(/<rect\s+([^>]*?)\/?>/g, function (_, attrText) {
    const attrs = parseRectAttributes(attrText);
    rects.push({
      x: Number(attrs.x || 0),
      y: Number(attrs.y || 0),
      width: Number(attrs.width || 0),
      height: Number(attrs.height || 0),
      fill: attrs.fill || ""
    });
    return "";
  });
  return rects;
}

function makeBlankGrid() {
  const row = [];
  for (let i = 0; i < CANVAS_SIZE; i += 1) row.push(TRANSPARENT_SYMBOL);
  const grid = [];
  for (let y = 0; y < CANVAS_SIZE; y += 1) grid.push(row.slice());
  return grid;
}

function buildSpriteSource(assetId, markup) {
  const rects = parseSvgRects(markup);
  const grid = makeBlankGrid();
  const palette = { ".": "transparent" };
  const symbolAllocator = makeSymbolAllocator(["."]);
  const symbolByColor = {};

  for (let i = 0; i < rects.length; i += 1) {
    const rect = rects[i];
    if (!rect.fill) continue;
    if (!symbolByColor[rect.fill]) {
      const nextSymbol = symbolAllocator.next();
      symbolByColor[rect.fill] = nextSymbol;
      palette[nextSymbol] = rect.fill.toLowerCase();
    }
    const symbol = symbolByColor[rect.fill];
    for (let y = rect.y * SCALE; y < (rect.y + rect.height) * SCALE; y += 1) {
      for (let x = rect.x * SCALE; x < (rect.x + rect.width) * SCALE; x += 1) {
        if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
          grid[y][x] = symbol;
        }
      }
    }
  }

  return {
    id: assetId,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    palette,
    pixels: grid.map((row) => row.join("")),
    model: {
      depth: 4,
      scale: 0.05,
      groundVariant: "copy"
    }
  };
}

function buildFallbackSpriteSource(assetId, fallbackAssetId) {
  return buildSpriteSource(assetId, spriteMarkupByKey[fallbackAssetId]);
}

function main() {
  const projectRoot = getProjectRoot();
  const availableKeys = Object.keys(spriteMarkupByKey).sort();

  for (let i = 0; i < availableKeys.length; i += 1) {
    const assetId = availableKeys[i];
    writePixelSource(projectRoot, buildSpriteSource(assetId, spriteMarkupByKey[assetId]));
  }

  const fallbackKeys = Object.keys(fallbackSpriteKeyByKey).sort();
  for (let i = 0; i < fallbackKeys.length; i += 1) {
    const assetId = fallbackKeys[i];
    const fallbackAssetId = fallbackSpriteKeyByKey[assetId];
    writePixelSource(projectRoot, buildFallbackSpriteSource(assetId, fallbackAssetId));
  }

  console.log(`Migrated ${availableKeys.length + fallbackKeys.length} legacy sprite assets into assets/pixel-src.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
