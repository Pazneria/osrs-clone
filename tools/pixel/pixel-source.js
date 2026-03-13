(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.PixelSource = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CANVAS_SIZE = 32;
  const TRANSPARENT_SYMBOL = ".";
  const DEFAULT_MODEL = Object.freeze({
    depth: 4,
    scale: 0.05,
    groundVariant: "copy"
  });
  const SYMBOL_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!$%&*+=?@#^~;:/,<>[]{}()|-_";

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function cloneDeep(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isValidAssetId(value) {
    return typeof value === "string" && /^[a-z0-9_]+$/.test(value.trim());
  }

  function createBlankRows(width, height) {
    const row = TRANSPARENT_SYMBOL.repeat(width);
    const rows = [];
    for (let i = 0; i < height; i += 1) rows.push(row);
    return rows;
  }

  function createBlankPixelSource(id) {
    return {
      id: typeof id === "string" ? id : "",
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      palette: {
        ".": "transparent",
        a: "#000000"
      },
      pixels: createBlankRows(CANVAS_SIZE, CANVAS_SIZE),
      model: cloneDeep(DEFAULT_MODEL)
    };
  }

  function isTransparentColorValue(value) {
    return value == null || value === "transparent" || value === "#00000000";
  }

  function normalizeHexColor(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
    if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) return trimmed.toLowerCase();
    return null;
  }

  function parseColorToRgba(value) {
    if (isTransparentColorValue(value)) return [0, 0, 0, 0];
    const normalized = normalizeHexColor(value);
    if (!normalized) return null;
    if (normalized.length === 7) {
      return [
        parseInt(normalized.slice(1, 3), 16),
        parseInt(normalized.slice(3, 5), 16),
        parseInt(normalized.slice(5, 7), 16),
        255
      ];
    }
    return [
      parseInt(normalized.slice(1, 3), 16),
      parseInt(normalized.slice(3, 5), 16),
      parseInt(normalized.slice(5, 7), 16),
      parseInt(normalized.slice(7, 9), 16)
    ];
  }

  function validatePixelSource(input, options) {
    const config = Object.assign({ requireId: true }, options);
    const errors = [];
    const source = isPlainObject(input) ? cloneDeep(input) : null;
    if (!source) {
      return { errors: ["pixel source must be an object"], normalized: null };
    }

    if (config.requireId && !isValidAssetId(source.id || "")) {
      errors.push("id must match /^[a-z0-9_]+$/");
    }

    if (source.width !== CANVAS_SIZE) errors.push(`width must be ${CANVAS_SIZE}`);
    if (source.height !== CANVAS_SIZE) errors.push(`height must be ${CANVAS_SIZE}`);

    if (!isPlainObject(source.palette)) {
      errors.push("palette must be an object");
    } else {
      const paletteKeys = Object.keys(source.palette);
      if (!paletteKeys.includes(TRANSPARENT_SYMBOL)) {
        errors.push("palette must include '.' mapped to transparent");
      }
      for (let i = 0; i < paletteKeys.length; i += 1) {
        const symbol = paletteKeys[i];
        if (typeof symbol !== "string" || symbol.length !== 1) {
          errors.push(`palette key '${symbol}' must be a single character`);
          continue;
        }
        const color = source.palette[symbol];
        if (symbol === TRANSPARENT_SYMBOL) {
          if (!isTransparentColorValue(color)) {
            errors.push("palette '.' must map to transparent");
          }
          continue;
        }
        if (!normalizeHexColor(color)) {
          errors.push(`palette color for '${symbol}' must be #RRGGBB or #RRGGBBAA`);
        }
      }
    }

    let normalizedRows = null;
    if (!Array.isArray(source.pixels) || source.pixels.length !== CANVAS_SIZE) {
      errors.push(`pixels must be an array of ${CANVAS_SIZE} rows`);
    } else {
      const paletteKeys = isPlainObject(source.palette) ? Object.keys(source.palette) : [];
      const fallbackKeyByLower = {};
      for (let i = 0; i < paletteKeys.length; i += 1) {
        const key = paletteKeys[i];
        const lowered = key.toLowerCase();
        if (!fallbackKeyByLower[lowered]) fallbackKeyByLower[lowered] = [];
        fallbackKeyByLower[lowered].push(key);
      }
      normalizedRows = [];
      for (let y = 0; y < source.pixels.length; y += 1) {
        const row = source.pixels[y];
        if (typeof row !== "string" || row.length !== CANVAS_SIZE) {
          errors.push(`pixels row ${y} must be a ${CANVAS_SIZE}-character string`);
          continue;
        }
        const normalizedChars = [];
        for (let x = 0; x < row.length; x += 1) {
          const symbol = row.charAt(x);
          if (paletteKeys.indexOf(symbol) !== -1) {
            normalizedChars.push(symbol);
            continue;
          }
          const matches = fallbackKeyByLower[symbol.toLowerCase()] || [];
          if (matches.length === 1) {
            normalizedChars.push(matches[0]);
            continue;
          }
          if (matches.length > 1) {
            errors.push(`pixels row ${y} col ${x} symbol '${symbol}' matches multiple palette keys by case`);
            break;
          }
          if (paletteKeys.indexOf(symbol) === -1) {
            errors.push(`pixels row ${y} col ${x} uses unknown palette symbol '${symbol}'`);
            break;
          }
        }
        if (normalizedChars.length === CANVAS_SIZE) {
          normalizedRows.push(normalizedChars.join(""));
        }
      }
    }

    const model = source.model == null ? {} : source.model;
    if (!isPlainObject(model)) {
      errors.push("model must be an object");
    } else {
      const allowedKeys = { depth: true, scale: true, groundVariant: true };
      const keys = Object.keys(model);
      for (let i = 0; i < keys.length; i += 1) {
        if (!allowedKeys[keys[i]]) errors.push(`model.${keys[i]} is not supported`);
      }
      if (model.depth != null && (!Number.isInteger(model.depth) || model.depth < 1 || model.depth > 64)) {
        errors.push("model.depth must be an integer between 1 and 64");
      }
      if (model.scale != null && (!(typeof model.scale === "number") || !isFinite(model.scale) || model.scale <= 0)) {
        errors.push("model.scale must be a positive number");
      }
      if (model.groundVariant != null && model.groundVariant !== "copy") {
        errors.push("model.groundVariant must be 'copy'");
      }
    }

    if (errors.length > 0) {
      return {
        errors,
        normalized: null
      };
    }

    const normalizedPalette = {};
    const paletteKeys = Object.keys(source.palette);
    paletteKeys.sort(function (a, b) {
      if (a === TRANSPARENT_SYMBOL) return -1;
      if (b === TRANSPARENT_SYMBOL) return 1;
      return a.localeCompare(b);
    });
    for (let i = 0; i < paletteKeys.length; i += 1) {
      const key = paletteKeys[i];
      normalizedPalette[key] = key === TRANSPARENT_SYMBOL ? "transparent" : normalizeHexColor(source.palette[key]);
    }

    return {
      errors: [],
      normalized: {
        id: (source.id || "").trim(),
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        palette: normalizedPalette,
        pixels: normalizedRows ? normalizedRows.slice() : source.pixels.slice(),
        model: {
          depth: model.depth == null ? DEFAULT_MODEL.depth : model.depth,
          scale: model.scale == null ? DEFAULT_MODEL.scale : model.scale,
          groundVariant: model.groundVariant == null ? DEFAULT_MODEL.groundVariant : model.groundVariant
        }
      }
    };
  }

  function rowsToGrid(rows) {
    const grid = [];
    for (let y = 0; y < rows.length; y += 1) {
      grid.push(rows[y].split(""));
    }
    return grid;
  }

  function gridToRows(grid) {
    const rows = [];
    for (let y = 0; y < grid.length; y += 1) {
      rows.push(grid[y].join(""));
    }
    return rows;
  }

  function buildRgbaBuffer(source) {
    const result = validatePixelSource(source);
    if (result.errors.length > 0) {
      throw new Error(result.errors.join("; "));
    }

    const normalized = result.normalized;
    const rgba = new Uint8Array(normalized.width * normalized.height * 4);
    let offset = 0;
    for (let y = 0; y < normalized.height; y += 1) {
      const row = normalized.pixels[y];
      for (let x = 0; x < normalized.width; x += 1) {
        const symbol = row.charAt(x);
        const color = parseColorToRgba(normalized.palette[symbol]);
        rgba[offset] = color[0];
        rgba[offset + 1] = color[1];
        rgba[offset + 2] = color[2];
        rgba[offset + 3] = color[3];
        offset += 4;
      }
    }
    return rgba;
  }

  function getSolidPixelCoords(source) {
    const result = validatePixelSource(source);
    if (result.errors.length > 0) {
      throw new Error(result.errors.join("; "));
    }
    const coords = [];
    const normalized = result.normalized;
    for (let y = 0; y < normalized.height; y += 1) {
      const row = normalized.pixels[y];
      for (let x = 0; x < normalized.width; x += 1) {
        if (row.charAt(x) !== TRANSPARENT_SYMBOL) {
          coords.push([x, y]);
        }
      }
    }
    return coords;
  }

  function makeSymbolAllocator(reservedKeys) {
    const used = {};
    if (Array.isArray(reservedKeys)) {
      for (let i = 0; i < reservedKeys.length; i += 1) used[reservedKeys[i]] = true;
    }

    return {
      next: function () {
        for (let i = 0; i < SYMBOL_ALPHABET.length; i += 1) {
          const symbol = SYMBOL_ALPHABET.charAt(i);
          if (!used[symbol] && symbol !== TRANSPARENT_SYMBOL) {
            used[symbol] = true;
            return symbol;
          }
        }
        throw new Error("Ran out of palette symbols");
      }
    };
  }

  return {
    CANVAS_SIZE,
    TRANSPARENT_SYMBOL,
    DEFAULT_MODEL,
    SYMBOL_ALPHABET,
    isPlainObject,
    isValidAssetId,
    createBlankRows,
    createBlankPixelSource,
    normalizeHexColor,
    parseColorToRgba,
    validatePixelSource,
    rowsToGrid,
    gridToRows,
    buildRgbaBuffer,
    getSolidPixelCoords,
    makeSymbolAllocator
  };
});
