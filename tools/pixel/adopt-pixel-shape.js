const fs = require("fs");
const path = require("path");
const PixelSource = require("./pixel-source");
const { getProjectRoot, loadPixelSource, writePixelSource } = require("./pixel-project");

function parseArgs(argv) {
  const args = {
    from: "",
    targets: [],
    copyModel: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--from") {
      const next = argv[i + 1];
      if (!next) throw new Error("--from requires a value");
      args.from = next;
      i += 1;
      continue;
    }
    if (token === "--to") {
      const next = argv[i + 1];
      if (!next) throw new Error("--to requires a value");
      args.targets.push(next);
      i += 1;
      continue;
    }
    if (token === "--copy-model") {
      args.copyModel = true;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  if (!args.from) throw new Error("--from is required");
  if (args.targets.length === 0) throw new Error("at least one --to target is required");
  return args;
}

function loadSourceFromRef(projectRoot, ref) {
  const asPath = path.resolve(projectRoot, ref);
  if (fs.existsSync(asPath)) {
    const raw = JSON.parse(fs.readFileSync(asPath, "utf8"));
    const validation = PixelSource.validatePixelSource(raw);
    if (validation.errors.length > 0) {
      throw new Error(`${path.relative(projectRoot, asPath)}: ${validation.errors.join("; ")}`);
    }
    return validation.normalized;
  }
  return loadPixelSource(projectRoot, ref);
}

function collectUsedSymbols(rows) {
  const used = {};
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      used[row.charAt(x)] = true;
    }
  }
  return used;
}

function buildMergedPalette(source, target, usedSymbols) {
  const palette = { ".": "transparent" };
  const symbols = Object.keys(usedSymbols)
    .filter((symbol) => symbol !== PixelSource.TRANSPARENT_SYMBOL)
    .sort();

  for (let i = 0; i < symbols.length; i += 1) {
    const symbol = symbols[i];
    const color = target.palette[symbol] || source.palette[symbol];
    if (!color) {
      throw new Error(`target '${target.id}' is missing palette symbol '${symbol}' and source did not provide one`);
    }
    palette[symbol] = color;
  }

  return palette;
}

function adoptShape(source, target, options) {
  const usedSymbols = collectUsedSymbols(source.pixels);
  return {
    id: target.id,
    width: source.width,
    height: source.height,
    palette: buildMergedPalette(source, target, usedSymbols),
    pixels: source.pixels.slice(),
    model: options.copyModel ? source.model : target.model
  };
}

function main() {
  const projectRoot = getProjectRoot();
  const args = parseArgs(process.argv.slice(2));
  const source = loadSourceFromRef(projectRoot, args.from);

  for (let i = 0; i < args.targets.length; i += 1) {
    const targetId = args.targets[i];
    const target = loadPixelSource(projectRoot, targetId);
    const adopted = adoptShape(source, target, { copyModel: args.copyModel });
    const written = writePixelSource(projectRoot, adopted);
    console.log(`Adopted shape from '${source.id}' onto '${target.id}' -> ${path.relative(projectRoot, written)}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
