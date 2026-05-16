const fs = require("fs");
const path = require("path");
const { readJsonFile, writeJsonFile } = require("../lib/json-file-utils");
const { validatePixelSource } = require("./pixel-source");

function getProjectRoot() {
  return path.resolve(__dirname, "..", "..");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getPixelSourceDir(projectRoot) {
  return path.join(projectRoot, "assets", "pixel-src");
}

function getPixelOutputDir(projectRoot) {
  return path.join(projectRoot, "assets", "pixel");
}

function getModelOutputDir(projectRoot) {
  return path.join(projectRoot, "assets", "models");
}

function getPixelSourcePath(projectRoot, assetId) {
  return path.join(getPixelSourceDir(projectRoot), `${assetId}.json`);
}

function getPixelArtifactPaths(projectRoot, assetId) {
  return {
    source: getPixelSourcePath(projectRoot, assetId),
    icon: path.join(getPixelOutputDir(projectRoot), `${assetId}.png`),
    model: path.join(getModelOutputDir(projectRoot), `${assetId}.obj`),
    groundModel: path.join(getModelOutputDir(projectRoot), `${assetId}-ground.obj`)
  };
}

function loadPixelSource(projectRoot, assetId) {
  const filePath = getPixelSourcePath(projectRoot, assetId);
  const raw = readJsonFile(filePath);
  const validation = validatePixelSource(raw);
  if (validation.errors.length > 0) {
    throw new Error(`${path.basename(filePath)}: ${validation.errors.join("; ")}`);
  }
  return validation.normalized;
}

function listPixelSourceIds(projectRoot) {
  const dir = getPixelSourceDir(projectRoot);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => path.basename(name, ".json"))
    .sort();
}

function writePixelSource(projectRoot, source) {
  const validation = validatePixelSource(source);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("; "));
  }
  const normalized = validation.normalized;
  ensureDir(getPixelSourceDir(projectRoot));
  const targetPath = getPixelSourcePath(projectRoot, normalized.id);
  writeJsonFile(targetPath, normalized);
  return targetPath;
}

module.exports = {
  getProjectRoot,
  ensureDir,
  getPixelSourceDir,
  getPixelOutputDir,
  getModelOutputDir,
  getPixelSourcePath,
  getPixelArtifactPaths,
  loadPixelSource,
  listPixelSourceIds,
  writePixelSource
};
