const fs = require("fs");
const path = require("path");
const vm = require("vm");

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!isObject(value)) return value;

  const out = {};
  const keys = Object.keys(value).sort();
  for (const key of keys) out[key] = sortKeysDeep(value[key]);
  return out;
}

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

function loadIconSpriteCatalog(projectRoot) {
  const catalogPath = path.join(projectRoot, "src", "js", "content", "icon-sprite-catalog.js");
  const code = fs.readFileSync(catalogPath, "utf8");
  const sandbox = { window: {} };

  vm.runInNewContext(code, sandbox, { filename: catalogPath });

  const root = sandbox.window && sandbox.window.IconSpriteCatalog;
  if (!isObject(root)) {
    throw new Error("Failed to load window.IconSpriteCatalog from src/js/content/icon-sprite-catalog.js");
  }

  const spriteMarkupByKey = root.spriteMarkupByKey;
  const fallbackSpriteKeyByKey = root.fallbackSpriteKeyByKey;
  if (!isObject(spriteMarkupByKey)) {
    throw new Error("Icon sprite catalog missing spriteMarkupByKey object");
  }
  if (fallbackSpriteKeyByKey != null && !isObject(fallbackSpriteKeyByKey)) {
    throw new Error("Icon sprite catalog fallbackSpriteKeyByKey should be an object");
  }

  return {
    spriteMarkupByKey,
    fallbackSpriteKeyByKey: isObject(fallbackSpriteKeyByKey) ? fallbackSpriteKeyByKey : {}
  };
}

module.exports = {
  isObject,
  sortKeysDeep,
  loadRuntimeItemCatalog,
  loadIconSpriteCatalog
};
