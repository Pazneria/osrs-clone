const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadNpcDialogueCatalog(projectRoot) {
  const absPath = path.join(projectRoot, "src", "js", "content", "npc-dialogue-catalog.js");
  const sandbox = { window: {}, console };
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInNewContext(source, sandbox, { filename: absPath });
  return sandbox.window && sandbox.window.NpcDialogueCatalog ? sandbox.window.NpcDialogueCatalog : null;
}

module.exports = {
  loadNpcDialogueCatalog
};
