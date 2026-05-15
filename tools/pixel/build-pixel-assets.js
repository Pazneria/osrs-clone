const fs = require("fs");
const path = require("path");
const { buildRgbaBuffer } = require("./pixel-source");
const { writePng } = require("./pixel-png");
const { buildObjFromPixelSource } = require("./pixel-model");
const { parsePixelAssetArgs } = require("./pixel-cli-args");
const {
  getProjectRoot,
  ensureDir,
  getPixelOutputDir,
  getModelOutputDir,
  getPixelArtifactPaths,
  loadPixelSource,
  listPixelSourceIds
} = require("./pixel-project");

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
  const args = parsePixelAssetArgs(process.argv.slice(2), { allowAll: true });
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
