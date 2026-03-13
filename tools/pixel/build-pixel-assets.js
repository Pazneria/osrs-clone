const fs = require("fs");
const path = require("path");
const { buildRgbaBuffer } = require("./pixel-source");
const { writePng } = require("./pixel-png");
const { buildObjFromPixelSource } = require("./pixel-model");
const {
  getProjectRoot,
  ensureDir,
  getPixelOutputDir,
  getModelOutputDir,
  getPixelArtifactPaths,
  loadPixelSource,
  listPixelSourceIds
} = require("./pixel-project");

function parseArgs(argv) {
  const args = {
    all: false,
    assetIds: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--all") {
      args.all = true;
      continue;
    }
    if (token === "--asset" || token === "-AssetId") {
      const next = argv[i + 1];
      if (!next) throw new Error(`${token} requires a value`);
      args.assetIds.push(next);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function buildAsset(projectRoot, assetId) {
  const source = loadPixelSource(projectRoot, assetId);
  const rgba = buildRgbaBuffer(source);
  const model = buildObjFromPixelSource(source);
  const paths = getPixelArtifactPaths(projectRoot, assetId);

  ensureDir(getPixelOutputDir(projectRoot));
  ensureDir(getModelOutputDir(projectRoot));
  writePng(paths.icon, source.width, source.height, rgba);
  fs.writeFileSync(paths.model, model.text, "utf8");
  fs.writeFileSync(paths.groundModel, model.text, "utf8");

  return {
    assetId,
    paths,
    stats: model.stats
  };
}

function main() {
  const projectRoot = getProjectRoot();
  const args = parseArgs(process.argv.slice(2));
  let assetIds = args.assetIds.slice();
  if (args.all || assetIds.length === 0) {
    assetIds = listPixelSourceIds(projectRoot);
  }

  if (assetIds.length === 0) {
    throw new Error("No pixel source assets found to build");
  }

  const built = [];
  for (let i = 0; i < assetIds.length; i += 1) {
    built.push(buildAsset(projectRoot, assetIds[i]));
  }

  for (let i = 0; i < built.length; i += 1) {
    const item = built[i];
    console.log(
      `Built ${item.assetId}: ${path.relative(projectRoot, item.paths.icon)}, ${path.relative(projectRoot, item.paths.model)} ` +
      `(pixels=${item.stats.solidPixels}, faces=${item.stats.faces}, vertices=${item.stats.vertices})`
    );
  }
  console.log(`Built ${built.length} pixel asset(s).`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
