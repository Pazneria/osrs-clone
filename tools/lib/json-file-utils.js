const fs = require("fs");
const path = require("path");

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, value, options = {}) {
  if (options.ensureDir) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const trailingNewline = options.trailingNewline !== false;
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}${trailingNewline ? "\n" : ""}`, "utf8");
}

module.exports = {
  cloneJson,
  readJsonFile,
  writeJsonFile
};
