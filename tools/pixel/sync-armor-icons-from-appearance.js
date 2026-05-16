const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  createBlankPixelSource,
  gridToRows,
  makeSymbolAllocator
} = require("./pixel-source");
const { clamp } = require("./pixel-math");
const {
  getProjectRoot,
  loadPixelSource,
  writePixelSource
} = require("./pixel-project");
const { parsePixelAssetArgs } = require("./pixel-cli-args");

const ARMOR_ICON_ITEM_PATTERN = /^(bronze|iron|steel|mithril|adamant|rune)_(boots|helmet|shield|platelegs|platebody)$/;
const ICON_CANVAS_SIZE = 32;
const CUTOUT_COLOR = "#1a1412";
const SHIELD_TARGET_OFFSETS = Object.freeze({
  leftTool: Object.freeze([0, 0, 0])
});
const DEFAULT_TARGET_OFFSETS = Object.freeze({
  torso: Object.freeze([0, 1.05, 0]),
  head: Object.freeze([0, 1.55, 0]),
  leftArm: Object.freeze([0.38, 1.34, 0.07]),
  rightArm: Object.freeze([-0.38, 1.34, 0.07]),
  leftLowerArm: Object.freeze([0.38, 0.99, -0.03]),
  rightLowerArm: Object.freeze([-0.38, 0.99, -0.03]),
  leftLeg: Object.freeze([0.14, 0.7, 0]),
  rightLeg: Object.freeze([-0.14, 0.7, 0]),
  leftLowerLeg: Object.freeze([0.14, 0.35, 0]),
  rightLowerLeg: Object.freeze([-0.14, 0.35, 0])
});
const FAMILY_LAYOUTS = Object.freeze({
  helmet: Object.freeze({ paddingLeft: 8, paddingRight: 8, paddingTop: 5, paddingBottom: 6 }),
  platebody: Object.freeze({ paddingLeft: 4, paddingRight: 4, paddingTop: 4, paddingBottom: 4 }),
  platelegs: Object.freeze({ paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }),
  boots: Object.freeze({ paddingLeft: 7, paddingRight: 7, paddingTop: 7, paddingBottom: 5 }),
  shield: Object.freeze({ paddingLeft: 6, paddingRight: 6, paddingTop: 5, paddingBottom: 5 })
});
const ITEM_ICON_TARGET_OFFSET_OVERRIDES = Object.freeze({
  shield: Object.freeze({
    leftTool: Object.freeze([0, 0, 0])
  }),
  boots: Object.freeze({
    leftLowerLeg: Object.freeze([0.26, 0.35, 0.03]),
    rightLowerLeg: Object.freeze([-0.26, 0.35, 0.03])
  })
});
const ITEM_ICON_ROTATION_OVERRIDES = Object.freeze({
  shield: Object.freeze({
    leftTool: Object.freeze([-Math.PI / 2, -Math.PI / 2, 0])
  }),
  boots: Object.freeze({
    leftLowerLeg: Object.freeze([Math.PI / 5, -Math.PI / 9, 0]),
    rightLowerLeg: Object.freeze([Math.PI / 5, Math.PI / 9, 0])
  })
});
const ARMOR_ICON_TIER_STYLES = Object.freeze({
  bronze: Object.freeze({ detailLevel: 0 }),
  iron: Object.freeze({ detailLevel: 1 }),
  steel: Object.freeze({ detailLevel: 1 }),
  mithril: Object.freeze({ detailLevel: 1 }),
  adamant: Object.freeze({ detailLevel: 2 }),
  rune: Object.freeze({ detailLevel: 2 })
});

function loadAppearanceCatalog(projectRoot) {
  const catalogPath = path.join(projectRoot, "src", "js", "content", "player-appearance-catalog.js");
  const source = fs.readFileSync(catalogPath, "utf8");
  const sandbox = {
    window: {},
    console,
    Math
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: catalogPath });
  const catalog = sandbox.window.PlayerAppearanceCatalog;
  if (!catalog || typeof catalog !== "object") {
    throw new Error("Failed to load PlayerAppearanceCatalog");
  }
  return catalog;
}

function unpackJagexHsl(packed) {
  return {
    h: (packed >> 10) & 63,
    s: (packed >> 7) & 7,
    l: packed & 127
  };
}

function hueToRgb(p, q, t) {
  let wrapped = t;
  if (wrapped < 0) wrapped += 1;
  if (wrapped > 1) wrapped -= 1;
  if (wrapped < 1 / 6) return p + ((q - p) * 6 * wrapped);
  if (wrapped < 1 / 2) return q;
  if (wrapped < 2 / 3) return p + ((q - p) * (2 / 3 - wrapped) * 6);
  return p;
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const value = Math.round(l * 255);
    return [value, value, value];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - (l * s);
  const p = (2 * l) - q;
  return [
    Math.round(hueToRgb(p, q, h + (1 / 3)) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - (1 / 3)) * 255)
  ];
}

function packedColorToHex(packed) {
  if (!Number.isFinite(packed)) return "#808080";
  const hsl = unpackJagexHsl(Math.max(0, packed | 0));
  const rgb = hslToRgb(hsl.h / 63, hsl.s / 7, hsl.l / 127);
  return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function resolveFragmentHex(fragment) {
  if (fragment && typeof fragment.rgbColor === "string" && /^#[0-9a-f]{6}$/i.test(fragment.rgbColor)) {
    return fragment.rgbColor.toLowerCase();
  }
  if (Number.isInteger(fragment && fragment.bodyColorIndex)) {
    return CUTOUT_COLOR;
  }
  return packedColorToHex(fragment && fragment.color);
}

function applyEulerRotation(point, rotation) {
  if (!Array.isArray(rotation) || rotation.length < 3) return point.slice();
  let x = Number(point[0]) || 0;
  let y = Number(point[1]) || 0;
  let z = Number(point[2]) || 0;
  const rx = Number(rotation[0]) || 0;
  const ry = Number(rotation[1]) || 0;
  const rz = Number(rotation[2]) || 0;

  if (Math.abs(rx) > 1e-6) {
    const cos = Math.cos(rx);
    const sin = Math.sin(rx);
    const nextY = (y * cos) - (z * sin);
    const nextZ = (y * sin) + (z * cos);
    y = nextY;
    z = nextZ;
  }
  if (Math.abs(ry) > 1e-6) {
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    const nextX = (x * cos) + (z * sin);
    const nextZ = (-x * sin) + (z * cos);
    x = nextX;
    z = nextZ;
  }
  if (Math.abs(rz) > 1e-6) {
    const cos = Math.cos(rz);
    const sin = Math.sin(rz);
    const nextX = (x * cos) - (y * sin);
    const nextY = (x * sin) + (y * cos);
    x = nextX;
    y = nextY;
  }

  return [x, y, z];
}

function addTriplets(base, delta) {
  const safeBase = Array.isArray(base) ? base : [0, 0, 0];
  const safeDelta = Array.isArray(delta) ? delta : [0, 0, 0];
  return [
    (Number(safeBase[0]) || 0) + (Number(safeDelta[0]) || 0),
    (Number(safeBase[1]) || 0) + (Number(safeDelta[1]) || 0),
    (Number(safeBase[2]) || 0) + (Number(safeDelta[2]) || 0)
  ];
}

function getFragmentProjectedBounds(fragment, targetOffsets, rotationOverridesByTarget) {
  if (!fragment || fragment.shape !== "box" || !Array.isArray(fragment.size) || !Array.isArray(fragment.offset)) {
    return null;
  }
  const size = fragment.size;
  const offset = fragment.offset;
  const targetOffset = targetOffsets[fragment.target] || [0, 0, 0];
  const halfX = (Number(size[0]) || 0) * 0.5;
  const halfY = (Number(size[1]) || 0) * 0.5;
  const halfZ = (Number(size[2]) || 0) * 0.5;
  const baseX = (Number(targetOffset[0]) || 0) + (Number(offset[0]) || 0);
  const baseY = (Number(targetOffset[1]) || 0) + (Number(offset[1]) || 0);
  const baseZ = (Number(targetOffset[2]) || 0) + (Number(offset[2]) || 0);
  const iconRotation = addTriplets(fragment.rotation, rotationOverridesByTarget[fragment.target]);
  const signs = [-1, 1];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let sxIndex = 0; sxIndex < signs.length; sxIndex += 1) {
    const sx = signs[sxIndex];
    for (let syIndex = 0; syIndex < signs.length; syIndex += 1) {
      const sy = signs[syIndex];
      for (let szIndex = 0; szIndex < signs.length; szIndex += 1) {
        const sz = signs[szIndex];
        const corner = applyEulerRotation([
          sx * halfX,
          sy * halfY,
          sz * halfZ
        ], iconRotation);
        const worldX = baseX + corner[0];
        const worldY = baseY + corner[1];
        const worldZ = baseZ + corner[2];
        if (worldX < minX) minX = worldX;
        if (worldX > maxX) maxX = worldX;
        if (worldY < minY) minY = worldY;
        if (worldY > maxY) maxY = worldY;
        if (worldZ > maxZ) maxZ = worldZ;
      }
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    maxZ,
    color: resolveFragmentHex(fragment)
  };
}

function suffixFromItemId(itemId) {
  const match = ARMOR_ICON_ITEM_PATTERN.exec(itemId);
  return match ? match[2] : null;
}

function tierFromItemId(itemId) {
  const match = ARMOR_ICON_ITEM_PATTERN.exec(itemId);
  return match ? match[1] : "iron";
}

function getArmorIconTierStyle(itemId) {
  return ARMOR_ICON_TIER_STYLES[tierFromItemId(itemId)] || ARMOR_ICON_TIER_STYLES.iron;
}

function getFamilyLayout(itemId) {
  const suffix = suffixFromItemId(itemId);
  return FAMILY_LAYOUTS[suffix] || FAMILY_LAYOUTS.platebody;
}

function getTargetOffsetsForItem(itemId) {
  const suffix = suffixFromItemId(itemId);
  const overrides = ITEM_ICON_TARGET_OFFSET_OVERRIDES[suffix];
  if (!overrides) return suffix === "shield" ? SHIELD_TARGET_OFFSETS : DEFAULT_TARGET_OFFSETS;
  return Object.assign({}, DEFAULT_TARGET_OFFSETS, suffix === "shield" ? SHIELD_TARGET_OFFSETS : null, overrides);
}

function getRotationOverridesForItem(itemId) {
  const suffix = suffixFromItemId(itemId);
  return ITEM_ICON_ROTATION_OVERRIDES[suffix] || {};
}

function buildProjectedLayers(itemId, fragments) {
  const targetOffsets = getTargetOffsetsForItem(itemId);
  const rotationOverrides = getRotationOverridesForItem(itemId);
  const projected = [];
  for (let i = 0; i < fragments.length; i += 1) {
    const bounds = getFragmentProjectedBounds(fragments[i], targetOffsets, rotationOverrides);
    if (bounds) projected.push(bounds);
  }
  if (!projected.length) {
    throw new Error(`${itemId}: no box fragments available to project`);
  }
  projected.sort((a, b) => a.maxZ - b.maxZ);
  return projected;
}

function computeAggregateBounds(layers) {
  const bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  };
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];
    if (layer.minX < bounds.minX) bounds.minX = layer.minX;
    if (layer.maxX > bounds.maxX) bounds.maxX = layer.maxX;
    if (layer.minY < bounds.minY) bounds.minY = layer.minY;
    if (layer.maxY > bounds.maxY) bounds.maxY = layer.maxY;
  }
  return bounds;
}

function createPaletteSymbolMap(layers) {
  const allocator = makeSymbolAllocator(["."]);
  const colorToSymbol = new Map();
  const palette = { ".": "transparent" };
  for (let i = 0; i < layers.length; i += 1) {
    const color = layers[i].color;
    if (colorToSymbol.has(color)) continue;
    const symbol = allocator.next();
    colorToSymbol.set(color, symbol);
    palette[symbol] = color;
  }
  return { colorToSymbol, palette };
}

function hexToRgb(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function colorLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (rgb.r * 0.2126) + (rgb.g * 0.7152) + (rgb.b * 0.0722);
}

function setRect(grid, left, top, right, bottom, symbol) {
  for (let y = clamp(top, 0, ICON_CANVAS_SIZE - 1); y <= clamp(bottom, 0, ICON_CANVAS_SIZE - 1); y += 1) {
    for (let x = clamp(left, 0, ICON_CANVAS_SIZE - 1); x <= clamp(right, 0, ICON_CANVAS_SIZE - 1); x += 1) {
      grid[y][x] = symbol;
    }
  }
}

function buildTonePaletteFromFragments(fragments, includeCutout = false) {
  const colors = Array.from(new Set(
    fragments
      .map((fragment) => resolveFragmentHex(fragment))
      .filter((color) => typeof color === "string" && color !== CUTOUT_COLOR)
  )).sort((a, b) => colorLuminance(a) - colorLuminance(b));
  const dark = colors[0] || "#444444";
  const mid = colors[Math.min(1, colors.length - 1)] || dark;
  const accent = colors[Math.min(2, colors.length - 1)] || mid;
  const light = colors[colors.length - 1] || accent;
  const palette = {
    ".": "transparent",
    "0": dark,
    "1": mid,
    "2": accent,
    "3": light
  };
  if (includeCutout) palette.x = CUTOUT_COLOR;
  return { dark, mid, accent, light, palette };
}

function buildBootIconFromFragments(itemId, fragments, currentSource) {
  const { dark, mid, light } = buildTonePaletteFromFragments(fragments);
  const style = getArmorIconTierStyle(itemId);
  const palette = {
    ".": "transparent",
    "0": dark,
    "1": mid,
    "2": light
  };
  const grid = [];
  for (let y = 0; y < ICON_CANVAS_SIZE; y += 1) {
    const row = [];
    for (let x = 0; x < ICON_CANVAS_SIZE; x += 1) row.push(".");
    grid.push(row);
  }

  // Left boot
  setRect(grid, 9, 10, 11, 11, "0");
  setRect(grid, 8, 12, 12, 17, "1");
  setRect(grid, 7, 18, 12, 19, "1");
  setRect(grid, 5, 20, 12, 21, "2");
  setRect(grid, 5, 22, 13, 23, "0");

  // Right boot
  setRect(grid, 20, 10, 22, 11, "0");
  setRect(grid, 19, 12, 23, 17, "1");
  setRect(grid, 19, 18, 24, 19, "1");
  setRect(grid, 19, 20, 26, 21, "2");
  setRect(grid, 18, 22, 26, 23, "0");

  if (style.detailLevel >= 1) {
    setRect(grid, 8, 13, 11, 14, "2");
    setRect(grid, 20, 13, 23, 14, "2");
  }
  if (style.detailLevel >= 2) {
    setRect(grid, 6, 18, 12, 19, "0");
    setRect(grid, 19, 18, 25, 19, "0");
    setRect(grid, 7, 16, 11, 16, "2");
    setRect(grid, 20, 16, 24, 16, "2");
  }

  return {
    id: itemId,
    width: ICON_CANVAS_SIZE,
    height: ICON_CANVAS_SIZE,
    palette,
    pixels: gridToRows(grid),
    model: currentSource && currentSource.model ? currentSource.model : createBlankPixelSource(itemId).model
  };
}

function buildPlatelegsIconFromFragments(itemId, fragments, currentSource) {
  const { dark, mid, light } = buildTonePaletteFromFragments(fragments);
  const style = getArmorIconTierStyle(itemId);
  const palette = {
    ".": "transparent",
    "0": dark,
    "1": mid,
    "2": light
  };
  const grid = [];
  for (let y = 0; y < ICON_CANVAS_SIZE; y += 1) {
    const row = [];
    for (let x = 0; x < ICON_CANVAS_SIZE; x += 1) row.push(".");
    grid.push(row);
  }

  // Left leg
  setRect(grid, 7, 7, 12, 10, "0");
  setRect(grid, 6, 10, 13, 20, "1");
  setRect(grid, 6, 14, 13, 16, "2");
  setRect(grid, 7, 21, 13, 24, "0");

  // Right leg
  setRect(grid, 19, 7, 24, 10, "0");
  setRect(grid, 18, 10, 25, 20, "1");
  setRect(grid, 18, 14, 25, 16, "2");
  setRect(grid, 18, 21, 24, 24, "0");

  // Inner thigh and crotch shaping without a belt strip.
  setRect(grid, 13, 10, 14, 13, "1");
  setRect(grid, 17, 10, 18, 13, "1");
  setRect(grid, 14, 14, 14, 17, "0");
  setRect(grid, 17, 14, 17, 17, "0");

  if (style.detailLevel >= 1) {
    setRect(grid, 8, 13, 12, 15, "2");
    setRect(grid, 19, 13, 23, 15, "2");
  }
  if (style.detailLevel >= 2) {
    setRect(grid, 6, 10, 7, 18, "0");
    setRect(grid, 24, 10, 25, 18, "0");
    setRect(grid, 8, 18, 12, 19, "2");
    setRect(grid, 19, 18, 23, 19, "2");
  }

  return {
    id: itemId,
    width: ICON_CANVAS_SIZE,
    height: ICON_CANVAS_SIZE,
    palette,
    pixels: gridToRows(grid),
    model: currentSource && currentSource.model ? currentSource.model : createBlankPixelSource(itemId).model
  };
}

function rasterizeLayers(itemId, layers) {
  const layout = getFamilyLayout(itemId);
  const bounds = computeAggregateBounds(layers);
  const width = Math.max(0.001, bounds.maxX - bounds.minX);
  const height = Math.max(0.001, bounds.maxY - bounds.minY);
  const usableWidth = ICON_CANVAS_SIZE - layout.paddingLeft - layout.paddingRight;
  const usableHeight = ICON_CANVAS_SIZE - layout.paddingTop - layout.paddingBottom;
  const scale = Math.min(usableWidth / width, usableHeight / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const originX = layout.paddingLeft + ((usableWidth - drawWidth) * 0.5) - (bounds.minX * scale);
  const originY = layout.paddingTop + ((usableHeight - drawHeight) * 0.5) + (bounds.maxY * scale);
  const grid = [];
  for (let y = 0; y < ICON_CANVAS_SIZE; y += 1) {
    const row = [];
    for (let x = 0; x < ICON_CANVAS_SIZE; x += 1) row.push(".");
    grid.push(row);
  }
  const { colorToSymbol, palette } = createPaletteSymbolMap(layers);

  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    const layer = layers[layerIndex];
    const left = (layer.minX * scale) + originX;
    const right = (layer.maxX * scale) + originX;
    const top = originY - (layer.maxY * scale);
    const bottom = originY - (layer.minY * scale);
    const startX = clamp(Math.floor(left), 0, ICON_CANVAS_SIZE - 1);
    const endX = clamp(Math.ceil(right) - 1, 0, ICON_CANVAS_SIZE - 1);
    const startY = clamp(Math.floor(top), 0, ICON_CANVAS_SIZE - 1);
    const endY = clamp(Math.ceil(bottom) - 1, 0, ICON_CANVAS_SIZE - 1);
    const symbol = colorToSymbol.get(layer.color);
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        grid[y][x] = symbol;
      }
    }
  }

  return {
    palette,
    pixels: gridToRows(grid)
  };
}

function buildArmorPixelSource(itemId, itemDef, currentSource) {
  const baseSource = currentSource || createBlankPixelSource(itemId);
  const suffix = suffixFromItemId(itemId);
  const fragments = Array.isArray(itemDef.maleFragments) && itemDef.maleFragments.length
    ? itemDef.maleFragments
    : (Array.isArray(itemDef.fragments) ? itemDef.fragments : []);
  if (!fragments.length) {
    throw new Error(`${itemId}: no appearance fragments available`);
  }
  if (suffix === "boots") {
    return buildBootIconFromFragments(itemId, fragments, currentSource || baseSource);
  }
  if (suffix === "platelegs") {
    return buildPlatelegsIconFromFragments(itemId, fragments, currentSource || baseSource);
  }
  const layers = buildProjectedLayers(itemId, fragments);
  const rendered = rasterizeLayers(itemId, layers);
  return {
    id: itemId,
    width: ICON_CANVAS_SIZE,
    height: ICON_CANVAS_SIZE,
    palette: rendered.palette,
    pixels: rendered.pixels,
    model: currentSource && currentSource.model ? currentSource.model : baseSource.model
  };
}

function getArmorItemIds(args, catalog) {
  const ids = Object.keys(catalog.itemDefs || {}).filter((itemId) => ARMOR_ICON_ITEM_PATTERN.test(itemId)).sort();
  if (!args.assetIds.length) return ids;
  const requested = Array.from(new Set(args.assetIds));
  for (let i = 0; i < requested.length; i += 1) {
    if (!ARMOR_ICON_ITEM_PATTERN.test(requested[i])) {
      throw new Error(`Unsupported armor asset id: ${requested[i]}`);
    }
    if (!catalog.itemDefs[requested[i]]) {
      throw new Error(`Missing appearance item definition: ${requested[i]}`);
    }
  }
  return requested;
}

function main() {
  const projectRoot = getProjectRoot();
  const args = parsePixelAssetArgs(process.argv.slice(2));
  const catalog = loadAppearanceCatalog(projectRoot);
  const itemIds = getArmorItemIds(args, catalog);
  const written = [];

  for (let i = 0; i < itemIds.length; i += 1) {
    const itemId = itemIds[i];
    const itemDef = catalog.itemDefs[itemId];
    const currentSource = loadPixelSource(projectRoot, itemId);
    const nextSource = buildArmorPixelSource(itemId, itemDef, currentSource);
    const targetPath = writePixelSource(projectRoot, nextSource);
    written.push(path.relative(projectRoot, targetPath));
  }

  for (let i = 0; i < written.length; i += 1) {
    console.log(`Synced ${written[i]}`);
  }
  console.log(`Synced ${written.length} armor icon source(s) from appearance fragments.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
