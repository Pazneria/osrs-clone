const fs = require("fs");
const path = require("path");

function readRepoFile(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function createRepoFileReader(testDirname) {
  const root = path.resolve(testDirname, "..", "..");
  return (relPath) => readRepoFile(root, relPath);
}

module.exports = {
  createRepoFileReader,
  readRepoFile
};
