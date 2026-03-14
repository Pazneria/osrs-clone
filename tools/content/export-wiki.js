const path = require("path");

const { exportWikiBundle } = require("./wiki-export");

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  return process.argv[index + 1] || null;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const outDirArg = readArg("--out-dir");
  const generatedAt = readArg("--generated-at");
  const sourceCommit = readArg("--source-commit");
  const outDir = outDirArg
    ? path.resolve(process.cwd(), outDirArg)
    : path.join(root, "dist", "wiki-export");

  const bundle = exportWikiBundle(root, outDir, { generatedAt, sourceCommit });

  console.log(
    `Exported wiki bundle to ${outDir} `
    + `(${bundle.items.length} items, ${bundle.skills.length} skills, ${bundle.worlds.length} worlds).`
  );
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
