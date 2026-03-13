const fs = require("fs");
const path = require("path");
const {
  getProjectRoot,
  ensureDir,
  writePixelSource
} = require("./pixel-project");
const {
  compilePixelSpec,
  analyzePixelSource,
  createAsciiPreview,
  createLegend,
  createReviewPngBuffer
} = require("./pixel-spec");

function parseArgs(argv) {
  const args = {
    specPath: "",
    writeSource: false,
    writeReview: false,
    reviewPath: "",
    ascii: false,
    silhouetteAscii: false,
    anchors: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--spec") {
      const next = argv[i + 1];
      if (!next) throw new Error("--spec requires a value");
      args.specPath = next;
      i += 1;
      continue;
    }
    if (token === "--write-source") {
      args.writeSource = true;
      continue;
    }
    if (token === "--write-review") {
      args.writeReview = true;
      continue;
    }
    if (token === "--review-path") {
      const next = argv[i + 1];
      if (!next) throw new Error("--review-path requires a value");
      args.reviewPath = next;
      i += 1;
      continue;
    }
    if (token === "--ascii") {
      args.ascii = true;
      continue;
    }
    if (token === "--ascii-silhouette") {
      args.silhouetteAscii = true;
      continue;
    }
    if (token === "--anchors") {
      args.anchors = true;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  if (!args.specPath) throw new Error("--spec is required");
  return args;
}

function formatAnalysis(analysis) {
  if (!analysis.bbox) return "solidPixels=0 bbox=empty centroid=n/a";
  return [
    `solidPixels=${analysis.solidPixels}`,
    `bbox=${analysis.bbox.minX},${analysis.bbox.minY}..${analysis.bbox.maxX},${analysis.bbox.maxY}`,
    `size=${analysis.bbox.width}x${analysis.bbox.height}`,
    `centroid=${analysis.centroid.x},${analysis.centroid.y}`
  ].join(" ");
}

function main() {
  const projectRoot = getProjectRoot();
  const args = parseArgs(process.argv.slice(2));
  const specPath = path.resolve(projectRoot, args.specPath);
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const compiled = compilePixelSpec(spec, { projectRoot });
  const source = compiled.source;
  const analysis = analyzePixelSource(source);

  console.log(`Rendered ${path.relative(projectRoot, specPath)} -> assetId=${source.id || "(none)"}`);
  console.log(formatAnalysis(analysis));
  console.log(`palette: ${createLegend(source)}`);

  if (args.anchors) {
    const anchorNames = Object.keys(compiled.anchors).sort();
    console.log(`anchors: ${anchorNames.length === 0 ? "(none)" : ""}`);
    for (let i = 0; i < anchorNames.length; i += 1) {
      const point = compiled.anchors[anchorNames[i]];
      console.log(`  ${anchorNames[i]} = [${Number(point[0].toFixed(2))}, ${Number(point[1].toFixed(2))}]`);
    }
  }

  if (args.ascii) {
    console.log("");
    console.log(createAsciiPreview(source, { symbolMode: true }));
  }

  if (args.silhouetteAscii) {
    console.log("");
    console.log(createAsciiPreview(source, { symbolMode: false }));
  }

  if (args.writeSource) {
    if (!source.id) throw new Error("spec must define id before --write-source can be used");
    const written = writePixelSource(projectRoot, source);
    console.log(`Wrote ${path.relative(projectRoot, written)}`);
  }

  if (args.writeReview) {
    const reviewPath = args.reviewPath
      ? path.resolve(projectRoot, args.reviewPath)
      : path.join(projectRoot, "tmp", "pixel-review", `${source.id || path.basename(specPath, path.extname(specPath))}.png`);
    ensureDir(path.dirname(reviewPath));
    fs.writeFileSync(reviewPath, createReviewPngBuffer(source));
    console.log(`Wrote ${path.relative(projectRoot, reviewPath)}`);
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
