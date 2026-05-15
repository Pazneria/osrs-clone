const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { isObject } = require("./object-utils");

function loadRuntimeItemCatalog(projectRoot) {
  const catalogPath = path.join(projectRoot, "src", "js", "content", "item-catalog.js");
  const code = fs.readFileSync(catalogPath, "utf8");
  const sandbox = { window: {} };

  vm.runInNewContext(code, sandbox, { filename: catalogPath });

  const root = sandbox.window && sandbox.window.ItemCatalog;
  if (!isObject(root) || !isObject(root.ITEM_DEFS)) {
    throw new Error("Failed to load window.ItemCatalog.ITEM_DEFS from src/js/content/item-catalog.js");
  }

  return {
    itemDefs: root.ITEM_DEFS
  };
}

module.exports = {
  loadRuntimeItemCatalog
};
