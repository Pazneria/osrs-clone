const fs = require("fs");
const path = require("path");

const RUNTIME_ASSET_DIRS = ["assets/pixel", "assets/models"];

function copyRuntimeAssetDirs() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const distRoot = path.join(projectRoot, "dist");

  for (let i = 0; i < RUNTIME_ASSET_DIRS.length; i++) {
    const relativeDir = RUNTIME_ASSET_DIRS[i];
    const sourceDir = path.join(projectRoot, relativeDir);
    if (!fs.existsSync(sourceDir)) continue;

    fs.cpSync(sourceDir, path.join(distRoot, relativeDir), {
      recursive: true,
      force: true
    });
  }
}

try {
  copyRuntimeAssetDirs();
  console.log("Copied runtime asset directories into dist.");
} catch (error) {
  console.error("Failed to copy runtime asset directories.", error);
  process.exit(1);
}
