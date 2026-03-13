const fs = require("fs");
const path = require("path");
const { validatePixelSource } = require("./pixel-source");
const {
  getProjectRoot,
  getPixelSourceDir
} = require("./pixel-project");

function main() {
  const projectRoot = getProjectRoot();
  const sourceDir = getPixelSourceDir(projectRoot);
  const files = fs.existsSync(sourceDir)
    ? fs.readdirSync(sourceDir).filter((name) => name.toLowerCase().endsWith(".json")).sort()
    : [];

  if (files.length === 0) {
    throw new Error("No pixel source files found to normalize");
  }

  for (let i = 0; i < files.length; i += 1) {
    const filePath = path.join(sourceDir, files[i]);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const validation = validatePixelSource(raw);
    if (validation.errors.length > 0) {
      throw new Error(`${files[i]}: ${validation.errors.join("; ")}`);
    }
    fs.writeFileSync(filePath, JSON.stringify(validation.normalized, null, 2) + "\n", "utf8");
  }

  console.log(`Normalized ${files.length} pixel source file(s).`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
