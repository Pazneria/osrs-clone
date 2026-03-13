const { encodePng } = require("./pixel-png");
const PixelSource = require("./pixel-source");
const { getProjectRoot, loadPixelSource } = require("./pixel-project");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createBlankGrid() {
  return PixelSource.rowsToGrid(PixelSource.createBlankRows(PixelSource.CANVAS_SIZE, PixelSource.CANVAS_SIZE));
}

function parseNumericPoint(point, label) {
  assert(Array.isArray(point) && point.length === 2, `${label} must be a [x, y] pair`);
  const x = Number(point[0]);
  const y = Number(point[1]);
  assert(Number.isFinite(x) && Number.isFinite(y), `${label} coordinates must be finite numbers`);
  return [x, y];
}

function normalizeInteger(value, fallback, label) {
  if (value == null) return fallback;
  const parsed = Number(value);
  assert(Number.isInteger(parsed), `${label} must be an integer`);
  return parsed;
}

function normalizePoint(point, label, context, stack) {
  if (!context) return parseNumericPoint(point, label);

  if (typeof point === "string") {
    return resolveAnchor(point, context, stack, label);
  }

  if (Array.isArray(point)) {
    return parseNumericPoint(point, label);
  }

  assert(PixelSource.isPlainObject(point), `${label} must be a [x, y] pair, anchor reference, or point descriptor`);

  if (typeof point.anchor === "string") {
    return resolveAnchor(point.anchor, context, stack, `${label}.anchor`);
  }

  if (typeof point.ref === "string") {
    return resolveAnchor(point.ref, context, stack, `${label}.ref`);
  }

  if (point.point != null) {
    return normalizePoint(point.point, `${label}.point`, context, stack);
  }

  if (Array.isArray(point.midpoint) && point.midpoint.length === 2) {
    const a = normalizePoint(point.midpoint[0], `${label}.midpoint[0]`, context, stack);
    const b = normalizePoint(point.midpoint[1], `${label}.midpoint[1]`, context, stack);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }

  if (Array.isArray(point.lerp) && point.lerp.length === 3) {
    const a = normalizePoint(point.lerp[0], `${label}.lerp[0]`, context, stack);
    const b = normalizePoint(point.lerp[1], `${label}.lerp[1]`, context, stack);
    const t = Number(point.lerp[2]);
    assert(Number.isFinite(t), `${label}.lerp[2] must be a finite number`);
    return [a[0] + ((b[0] - a[0]) * t), a[1] + ((b[1] - a[1]) * t)];
  }

  const baseRef = point.from != null ? point.from : (point.origin != null ? point.origin : null);
  if (baseRef != null) {
    let result = normalizePoint(baseRef, `${label}.from`, context, stack);

    if (point.offset != null) {
      const offset = parseNumericPoint(point.offset, `${label}.offset`);
      result = [result[0] + offset[0], result[1] + offset[1]];
    }

    const directionRef = point.towards != null ? point.towards : (point.direction != null ? point.direction : null);
    if (directionRef != null) {
      const target = normalizePoint(directionRef, `${label}.towards`, context, stack);
      const dx = target[0] - result[0];
      const dy = target[1] - result[1];
      const length = Math.hypot(dx, dy);
      assert(length > 0, `${label}.towards must not resolve to the same point as ${label}.from`);
      let dirX = dx / length;
      let dirY = dy / length;
      if (point.rotateDeg != null) {
        const radians = Number(point.rotateDeg) * Math.PI / 180;
        assert(Number.isFinite(radians), `${label}.rotateDeg must be a finite number`);
        const rotatedX = (dirX * Math.cos(radians)) - (dirY * Math.sin(radians));
        const rotatedY = (dirX * Math.sin(radians)) + (dirY * Math.cos(radians));
        dirX = rotatedX;
        dirY = rotatedY;
      }

      const distance = Number(point.distance != null ? point.distance : length);
      assert(Number.isFinite(distance), `${label}.distance must be a finite number`);
      result = [result[0] + (dirX * distance), result[1] + (dirY * distance)];
    } else if (point.angleDeg != null) {
      const angle = Number(point.angleDeg) * Math.PI / 180;
      const distance = Number(point.distance != null ? point.distance : point.radius);
      assert(Number.isFinite(angle), `${label}.angleDeg must be a finite number`);
      assert(Number.isFinite(distance), `${label}.distance or ${label}.radius must be a finite number`);
      result = [result[0] + (Math.cos(angle) * distance), result[1] + (Math.sin(angle) * distance)];
    }

    return result;
  }

  if (point.angleDeg != null) {
    const angle = Number(point.angleDeg) * Math.PI / 180;
    const distance = Number(point.distance != null ? point.distance : point.radius);
    assert(Number.isFinite(angle), `${label}.angleDeg must be a finite number`);
    assert(Number.isFinite(distance), `${label}.distance or ${label}.radius must be a finite number`);
    return [Math.cos(angle) * distance, Math.sin(angle) * distance];
  }

  throw new Error(`${label} is not a supported point descriptor`);
}

function normalizePoints(points, label, context, stack) {
  assert(Array.isArray(points) && points.length > 0, `${label} must be a non-empty array`);
  return points.map((point, index) => normalizePoint(point, `${label}[${index}]`, context, stack));
}

function resolveAnchor(name, context, stack, label) {
  assert(typeof name === "string" && name.trim(), `${label} must reference a non-empty anchor name`);
  const anchorName = name.trim();
  if (context.anchors[anchorName]) return context.anchors[anchorName];
  assert(context.anchorSpecs[anchorName] != null, `${label} references unknown anchor '${anchorName}'`);
  const nextStack = Array.isArray(stack) ? stack.slice() : [];
  assert(nextStack.indexOf(anchorName) === -1, `anchor cycle detected: ${nextStack.concat([anchorName]).join(" -> ")}`);
  nextStack.push(anchorName);
  const resolved = normalizePoint(context.anchorSpecs[anchorName], `anchors.${anchorName}`, context, nextStack);
  context.anchors[anchorName] = resolved;
  return resolved;
}

function resolveBrushReach(thickness) {
  return ((Math.max(1, thickness) - 1) / 2) + 0.35;
}

function paintPixel(grid, x, y, symbol) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || px >= PixelSource.CANVAS_SIZE || py < 0 || py >= PixelSource.CANVAS_SIZE) return;
  grid[py][px] = symbol;
}

function paintBrush(grid, x, y, symbol, thickness, brush) {
  const safeThickness = Math.max(1, Number(thickness) || 1);
  const reach = resolveBrushReach(safeThickness);
  if (safeThickness <= 1) {
    paintPixel(grid, x, y, symbol);
    return;
  }

  const minX = Math.floor(x - reach);
  const maxX = Math.ceil(x + reach);
  const minY = Math.floor(y - reach);
  const maxY = Math.ceil(y + reach);

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const dx = px - x;
      const dy = py - y;
      let include = false;
      if (brush === "square") {
        include = Math.max(Math.abs(dx), Math.abs(dy)) <= reach;
      } else if (brush === "diamond") {
        include = (Math.abs(dx) + Math.abs(dy)) <= (reach + 0.35);
      } else {
        include = ((dx * dx) + (dy * dy)) <= ((reach + 0.1) * (reach + 0.1));
      }
      if (!include) continue;
      if (px < 0 || px >= PixelSource.CANVAS_SIZE || py < 0 || py >= PixelSource.CANVAS_SIZE) continue;
      grid[py][px] = symbol;
    }
  }
}

function drawLine(grid, from, to, symbol, thickness, brush) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 4));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    paintBrush(grid, from[0] + (dx * t), from[1] + (dy * t), symbol, thickness, brush);
  }
}

function drawPolyline(grid, points, symbol, thickness, brush, closed) {
  for (let i = 0; i < points.length - 1; i += 1) {
    drawLine(grid, points[i], points[i + 1], symbol, thickness, brush);
  }
  if (closed && points.length > 2) {
    drawLine(grid, points[points.length - 1], points[0], symbol, thickness, brush);
  }
}

function drawArc(grid, layer, context) {
  const center = normalizePoint(layer.center, "arc.center", context);
  const radiusX = Number(layer.radiusX != null ? layer.radiusX : layer.radius);
  const radiusY = Number(layer.radiusY != null ? layer.radiusY : layer.radius);
  assert(Number.isFinite(radiusX) && radiusX > 0, "arc.radius or arc.radiusX must be a positive number");
  assert(Number.isFinite(radiusY) && radiusY > 0, "arc.radius or arc.radiusY must be a positive number");
  const startDeg = Number(layer.startDeg);
  const endDeg = Number(layer.endDeg);
  assert(Number.isFinite(startDeg), "arc.startDeg must be a number");
  assert(Number.isFinite(endDeg), "arc.endDeg must be a number");
  const thickness = Math.max(1, Number(layer.thickness) || 1);
  const brush = typeof layer.brush === "string" ? layer.brush : "circle";
  const deltaDeg = endDeg - startDeg;
  const maxRadius = Math.max(radiusX, radiusY);
  const deltaRad = Math.abs(deltaDeg) * Math.PI / 180;
  const steps = Math.max(16, Math.ceil(deltaRad * maxRadius * 6));

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = (startDeg + (deltaDeg * t)) * Math.PI / 180;
    const x = center[0] + (Math.cos(angle) * radiusX);
    const y = center[1] + (Math.sin(angle) * radiusY);
    paintBrush(grid, x, y, layer.symbol, thickness, brush);
  }
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersects = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < ((xj - xi) * (point[1] - yi) / ((yj - yi) || 1e-9)) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function drawPolygon(grid, layer, context) {
  const points = normalizePoints(layer.points, "polygon.points", context);
  const fillSymbol = typeof layer.fillSymbol === "string"
    ? layer.fillSymbol
    : (typeof layer.symbol === "string" ? layer.symbol : null);
  if (fillSymbol) {
    for (let y = 0; y < PixelSource.CANVAS_SIZE; y += 1) {
      for (let x = 0; x < PixelSource.CANVAS_SIZE; x += 1) {
        if (pointInPolygon([x + 0.5, y + 0.5], points)) {
          grid[y][x] = fillSymbol;
        }
      }
    }
  }

  const strokeSymbol = typeof layer.strokeSymbol === "string" ? layer.strokeSymbol : null;
  if (strokeSymbol) {
    drawPolyline(
      grid,
      points,
      strokeSymbol,
      Math.max(1, Number(layer.strokeWidth) || 1),
      typeof layer.brush === "string" ? layer.brush : "circle",
      true
    );
  }
}

function drawBand(grid, layer, context) {
  const upperPoints = normalizePoints(layer.upperPoints, "band.upperPoints", context);
  const lowerPoints = normalizePoints(layer.lowerPoints, "band.lowerPoints", context);
  const polygonPoints = upperPoints.concat(lowerPoints.slice().reverse());
  drawPolygon(grid, {
    points: polygonPoints,
    fillSymbol: layer.fillSymbol,
    strokeSymbol: layer.strokeSymbol,
    strokeWidth: layer.strokeWidth,
    brush: layer.brush
  }, context);
}

function floodFill(grid, at, symbol, context) {
  const start = normalizePoint(at, "fill.at", context);
  const x = Math.round(start[0]);
  const y = Math.round(start[1]);
  assert(x >= 0 && x < PixelSource.CANVAS_SIZE && y >= 0 && y < PixelSource.CANVAS_SIZE, "fill.at must be on the canvas");
  const target = grid[y][x];
  if (target === symbol) return;

  const queue = [[x, y]];
  const visited = {};
  while (queue.length > 0) {
    const point = queue.shift();
    const key = `${point[0]}:${point[1]}`;
    if (visited[key]) continue;
    visited[key] = true;
    if (grid[point[1]][point[0]] !== target) continue;
    grid[point[1]][point[0]] = symbol;
    if (point[0] > 0) queue.push([point[0] - 1, point[1]]);
    if (point[0] < PixelSource.CANVAS_SIZE - 1) queue.push([point[0] + 1, point[1]]);
    if (point[1] > 0) queue.push([point[0], point[1] - 1]);
    if (point[1] < PixelSource.CANVAS_SIZE - 1) queue.push([point[0], point[1] + 1]);
  }
}

function fillRect(grid, layer, context) {
  const origin = layer.at != null ? normalizePoint(layer.at, "rect.at", context) : null;
  const x = origin ? Math.round(origin[0]) : normalizeInteger(layer.x, null, "rect.x");
  const y = origin ? Math.round(origin[1]) : normalizeInteger(layer.y, null, "rect.y");
  const width = normalizeInteger(layer.width, null, "rect.width");
  const height = normalizeInteger(layer.height, null, "rect.height");
  assert(width > 0 && height > 0, "rect.width and rect.height must be positive integers");
  for (let py = y; py < y + height; py += 1) {
    if (py < 0 || py >= PixelSource.CANVAS_SIZE) continue;
    for (let px = x; px < x + width; px += 1) {
      if (px < 0 || px >= PixelSource.CANVAS_SIZE) continue;
      grid[py][px] = layer.symbol;
    }
  }
}

function copyFromAsset(context, layer) {
  assert(typeof layer.assetId === "string" && layer.assetId.trim(), "copy.assetId must be a non-empty string");
  const assetId = layer.assetId.trim();
  if (!context.assetCache[assetId]) {
    context.assetCache[assetId] = loadPixelSource(context.projectRoot, assetId);
  }
  const source = context.assetCache[assetId];
  const sourceGrid = PixelSource.rowsToGrid(source.pixels);
  const rect = Array.isArray(layer.sourceRect) ? layer.sourceRect.slice() : [0, 0, source.width, source.height];
  assert(rect.length === 4, "copy.sourceRect must be [x, y, width, height]");
  const srcX = normalizeInteger(rect[0], null, "copy.sourceRect[0]");
  const srcY = normalizeInteger(rect[1], null, "copy.sourceRect[1]");
  const srcWidth = normalizeInteger(rect[2], null, "copy.sourceRect[2]");
  const srcHeight = normalizeInteger(rect[3], null, "copy.sourceRect[3]");
  const offset = layer.offset != null ? normalizePoint(layer.offset, "copy.offset", context) : [0, 0];
  const destX = Math.round(offset[0]);
  const destY = Math.round(offset[1]);
  const symbolMap = PixelSource.isPlainObject(layer.symbolMap) ? layer.symbolMap : {};
  const includeSymbols = Array.isArray(layer.includeSymbols) ? layer.includeSymbols.slice() : null;
  const excludeSymbols = Array.isArray(layer.excludeSymbols) ? layer.excludeSymbols.slice() : [];

  for (let y = 0; y < srcHeight; y += 1) {
    for (let x = 0; x < srcWidth; x += 1) {
      const readX = srcX + x;
      const readY = srcY + y;
      if (readX < 0 || readX >= source.width || readY < 0 || readY >= source.height) continue;
      const symbol = sourceGrid[readY][readX];
      if (symbol === PixelSource.TRANSPARENT_SYMBOL && layer.skipTransparent !== false) continue;
      if (includeSymbols && includeSymbols.indexOf(symbol) === -1) continue;
      if (excludeSymbols.indexOf(symbol) !== -1) continue;
      const mappedSymbol = typeof symbolMap[symbol] === "string" ? symbolMap[symbol] : symbol;
      const writeX = destX + x;
      const writeY = destY + y;
      if (writeX < 0 || writeX >= PixelSource.CANVAS_SIZE || writeY < 0 || writeY >= PixelSource.CANVAS_SIZE) continue;
      context.grid[writeY][writeX] = mappedSymbol;
      if (mappedSymbol !== PixelSource.TRANSPARENT_SYMBOL && !context.palette[mappedSymbol]) {
        context.palette[mappedSymbol] = source.palette[symbol];
      }
    }
  }
}

function replaceSymbol(grid, fromSymbol, toSymbol) {
  for (let y = 0; y < PixelSource.CANVAS_SIZE; y += 1) {
    for (let x = 0; x < PixelSource.CANVAS_SIZE; x += 1) {
      if (grid[y][x] === fromSymbol) grid[y][x] = toSymbol;
    }
  }
}

function runLayer(context, layer) {
  assert(PixelSource.isPlainObject(layer), "every layer must be an object");
  assert(typeof layer.op === "string" && layer.op.trim(), "layer.op must be a non-empty string");
  const op = layer.op.trim();

  if (op === "plot") {
    const points = normalizePoints(layer.points, "plot.points", context);
    for (let i = 0; i < points.length; i += 1) {
      paintBrush(
        context.grid,
        points[i][0],
        points[i][1],
        layer.symbol,
        Math.max(1, Number(layer.thickness) || 1),
        typeof layer.brush === "string" ? layer.brush : "circle"
      );
    }
    return;
  }

  if (op === "line") {
    drawLine(
      context.grid,
      normalizePoint(layer.from, "line.from", context),
      normalizePoint(layer.to, "line.to", context),
      layer.symbol,
      Math.max(1, Number(layer.thickness) || 1),
      typeof layer.brush === "string" ? layer.brush : "circle"
    );
    return;
  }

  if (op === "polyline") {
    drawPolyline(
      context.grid,
      normalizePoints(layer.points, "polyline.points", context),
      layer.symbol,
      Math.max(1, Number(layer.thickness) || 1),
      typeof layer.brush === "string" ? layer.brush : "circle",
      layer.closed === true
    );
    return;
  }

  if (op === "arc") {
    drawArc(context.grid, layer, context);
    return;
  }

  if (op === "polygon") {
    drawPolygon(context.grid, layer, context);
    return;
  }

  if (op === "band") {
    drawBand(context.grid, layer, context);
    return;
  }

  if (op === "fill") {
    floodFill(context.grid, layer.at, layer.symbol, context);
    return;
  }

  if (op === "rect") {
    fillRect(context.grid, layer, context);
    return;
  }

  if (op === "copy") {
    copyFromAsset(context, layer);
    return;
  }

  if (op === "replace") {
    assert(typeof layer.from === "string" && layer.from.length === 1, "replace.from must be a single symbol");
    assert(typeof layer.to === "string" && layer.to.length === 1, "replace.to must be a single symbol");
    replaceSymbol(context.grid, layer.from, layer.to);
    return;
  }

  throw new Error(`unsupported layer op '${op}'`);
}

function createContext(spec, options) {
  const safeSpec = PixelSource.isPlainObject(spec) ? clone(spec) : {};
  const palette = Object.assign({ ".": "transparent" }, safeSpec.palette || {});
  const model = Object.assign({}, PixelSource.DEFAULT_MODEL, safeSpec.model || {});
  return {
    id: typeof safeSpec.id === "string" ? safeSpec.id.trim() : "",
    palette,
    model,
    grid: createBlankGrid(),
    projectRoot: (options && options.projectRoot) || getProjectRoot(),
    assetCache: {},
    anchorSpecs: PixelSource.isPlainObject(safeSpec.anchors) ? safeSpec.anchors : {},
    anchors: {}
  };
}

function compilePixelSpec(spec, options) {
  const safeSpec = PixelSource.isPlainObject(spec) ? clone(spec) : null;
  assert(safeSpec, "pixel spec must be an object");
  const layers = Array.isArray(safeSpec.layers) ? safeSpec.layers : (Array.isArray(safeSpec.ops) ? safeSpec.ops : []);
  const context = createContext(safeSpec, options);

  for (let i = 0; i < layers.length; i += 1) {
    try {
      runLayer(context, layers[i]);
    } catch (error) {
      throw new Error(`layer ${i} (${layers[i] && layers[i].op ? layers[i].op : "unknown"}): ${error.message}`);
    }
  }

  const source = {
    id: context.id,
    width: PixelSource.CANVAS_SIZE,
    height: PixelSource.CANVAS_SIZE,
    palette: context.palette,
    pixels: PixelSource.gridToRows(context.grid),
    model: context.model
  };

  const validation = PixelSource.validatePixelSource(source, { requireId: false });
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("; "));
  }

  const anchorNames = Object.keys(context.anchorSpecs);
  for (let i = 0; i < anchorNames.length; i += 1) {
    resolveAnchor(anchorNames[i], context, [], `anchors.${anchorNames[i]}`);
  }

  return {
    source: validation.normalized,
    anchors: Object.assign({}, context.anchors)
  };
}

function renderPixelSpec(spec, options) {
  return compilePixelSpec(spec, options).source;
}

function analyzePixelSource(source) {
  const coords = PixelSource.getSolidPixelCoords(source);
  if (coords.length === 0) {
    return {
      solidPixels: 0,
      bbox: null,
      centroid: null
    };
  }

  let minX = coords[0][0];
  let maxX = coords[0][0];
  let minY = coords[0][1];
  let maxY = coords[0][1];
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < coords.length; i += 1) {
    const point = coords[i];
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
    sumX += point[0];
    sumY += point[1];
  }

  return {
    solidPixels: coords.length,
    bbox: {
      minX,
      minY,
      maxX,
      maxY,
      width: (maxX - minX) + 1,
      height: (maxY - minY) + 1
    },
    centroid: {
      x: Number((sumX / coords.length).toFixed(2)),
      y: Number((sumY / coords.length).toFixed(2))
    }
  };
}

function createAsciiPreview(source, options) {
  const safeOptions = options || {};
  const header = `   ${Array.from({ length: PixelSource.CANVAS_SIZE }, function (_, index) { return String(index % 10); }).join("")}`;
  const lines = [header];
  const symbolMode = safeOptions.symbolMode !== false;
  const rows = source.pixels;
  for (let y = 0; y < rows.length; y += 1) {
    const label = String(y).padStart(2, "0");
    if (symbolMode) {
      lines.push(`${label} ${rows[y]}`);
      continue;
    }
    const mapped = rows[y].replace(/[^.]/g, "#");
    lines.push(`${label} ${mapped}`);
  }
  return lines.join("\n");
}

function createLegend(source) {
  const keys = Object.keys(source.palette).sort(function (a, b) {
    if (a === PixelSource.TRANSPARENT_SYMBOL) return -1;
    if (b === PixelSource.TRANSPARENT_SYMBOL) return 1;
    return a.localeCompare(b);
  });
  return keys.map(function (key) {
    return `${key}=${source.palette[key]}`;
  }).join(" ");
}

function fillRectRgba(buffer, width, height, x, y, rectWidth, rectHeight, rgba) {
  const startX = clamp(x, 0, width);
  const startY = clamp(y, 0, height);
  const endX = clamp(x + rectWidth, 0, width);
  const endY = clamp(y + rectHeight, 0, height);

  for (let py = startY; py < endY; py += 1) {
    for (let px = startX; px < endX; px += 1) {
      const offset = ((py * width) + px) * 4;
      buffer[offset] = rgba[0];
      buffer[offset + 1] = rgba[1];
      buffer[offset + 2] = rgba[2];
      buffer[offset + 3] = rgba[3];
    }
  }
}

function drawScaledSource(buffer, sheetWidth, source, options) {
  const scale = options.scale;
  const originX = options.originX;
  const originY = options.originY;
  const mode = options.mode || "color";

  for (let y = 0; y < source.height; y += 1) {
    const row = source.pixels[y];
    for (let x = 0; x < source.width; x += 1) {
      const symbol = row.charAt(x);
      if (symbol === PixelSource.TRANSPARENT_SYMBOL) continue;
      let rgba;
      if (mode === "silhouette") {
        rgba = [32, 24, 18, 255];
      } else {
        rgba = PixelSource.parseColorToRgba(source.palette[symbol]);
      }
      fillRectRgba(buffer, sheetWidth, options.sheetHeight, originX + (x * scale), originY + (y * scale), scale, scale, rgba);
    }
  }
}

function createReviewPngBuffer(source, options) {
  const safeOptions = options || {};
  const scale = Math.max(4, normalizeInteger(safeOptions.scale, 8, "review.scale"));
  const padding = 8;
  const gap = 8;
  const panelSize = source.width * scale;
  const width = (padding * 2) + panelSize + gap + panelSize;
  const height = (padding * 2) + panelSize;
  const buffer = new Uint8Array(width * height * 4);
  const paper = [236, 231, 221, 255];
  const panelA = [28, 31, 38, 255];
  const panelB = [248, 243, 232, 255];
  const border = [118, 102, 84, 255];

  fillRectRgba(buffer, width, height, 0, 0, width, height, paper);
  fillRectRgba(buffer, width, height, padding - 1, padding - 1, panelSize + 2, panelSize + 2, border);
  fillRectRgba(buffer, width, height, padding + panelSize + gap - 1, padding - 1, panelSize + 2, panelSize + 2, border);
  fillRectRgba(buffer, width, height, padding, padding, panelSize, panelSize, panelA);
  fillRectRgba(buffer, width, height, padding + panelSize + gap, padding, panelSize, panelSize, panelB);

  drawScaledSource(buffer, width, source, {
    originX: padding,
    originY: padding,
    scale,
    sheetHeight: height,
    mode: "color"
  });
  drawScaledSource(buffer, width, source, {
    originX: padding + panelSize + gap,
    originY: padding,
    scale,
    sheetHeight: height,
    mode: "silhouette"
  });

  return encodePng(width, height, buffer);
}

module.exports = {
  compilePixelSpec,
  renderPixelSpec,
  analyzePixelSource,
  createAsciiPreview,
  createLegend,
  createReviewPngBuffer
};
