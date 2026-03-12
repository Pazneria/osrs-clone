const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const indexPath = path.join(root, "index.html");
  const corePath = path.join(root, "src/js/core.js");
  const iconCatalogPath = path.join(root, "src/js/content/icon-sprite-catalog.js");
  const itemCatalogPath = path.join(root, "src/js/content/item-catalog.js");

  assert(fs.existsSync(iconCatalogPath), "icon sprite catalog file missing");

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const coreScript = fs.readFileSync(corePath, "utf8");
  const iconCatalogScript = fs.readFileSync(iconCatalogPath, "utf8");
  const itemCatalogScript = fs.readFileSync(itemCatalogPath, "utf8");

  assert(
    indexHtml.includes("./src/js/content/icon-sprite-catalog.js"),
    "index should include icon sprite catalog script"
  );

  assert(
    iconCatalogScript.includes("window.IconSpriteCatalog"),
    "icon sprite catalog should expose window.IconSpriteCatalog"
  );
  assert(
    iconCatalogScript.includes("spriteMarkupByKey"),
    "icon sprite catalog should define spriteMarkupByKey"
  );
  assert(
    iconCatalogScript.includes("fallbackSpriteKeyByKey"),
    "icon sprite catalog should define fallbackSpriteKeyByKey"
  );
  assert(
    iconCatalogScript.includes("collectSpriteReferenceSummary"),
    "icon sprite catalog should expose sprite reference summary helper"
  );

  assert(
    coreScript.includes("window.IconSpriteCatalog"),
    "core should resolve item sprites via IconSpriteCatalog"
  );
  assert(
    coreScript.includes("makeMissingIconSprite"),
    "core should include generic missing-icon fallback"
  );
  assert(
    !coreScript.includes("const sprites = {"),
    "core should not inline the icon sprite registry"
  );
  assert(
    !coreScript.includes("fallbackSpriteId = {"),
    "core should not inline icon fallback sprite mapping"
  );

  const sandbox = { window: {} };
  vm.runInNewContext(iconCatalogScript, sandbox, { filename: iconCatalogPath });
  vm.runInNewContext(itemCatalogScript, sandbox, { filename: itemCatalogPath });

  const iconCatalog = sandbox.window && sandbox.window.IconSpriteCatalog;
  const itemCatalog = sandbox.window && sandbox.window.ItemCatalog;
  assert(!!iconCatalog, "failed to load IconSpriteCatalog");
  assert(!!itemCatalog && !!itemCatalog.ITEM_DEFS, "failed to load ItemCatalog ITEM_DEFS");
  assert(
    typeof iconCatalog.resolveSpriteMarkup === "function",
    "IconSpriteCatalog should expose resolveSpriteMarkup"
  );

  const itemDefs = itemCatalog.ITEM_DEFS;
  const ids = Object.keys(itemDefs);
  const missingSpriteRefs = [];
  const fallbackUsageByKey = {};

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const itemDef = itemDefs[id];
    const icon = itemDef && itemDef.icon;
    if (!icon || icon.kind !== "sprite") continue;
    const resolved = iconCatalog.resolveSpriteMarkup(icon.key);
    if (!resolved || !resolved.markup) {
      missingSpriteRefs.push(`${id}:${icon.key}`);
      continue;
    }
    if (resolved.usedFallback) {
      fallbackUsageByKey[resolved.requestedKey] = (fallbackUsageByKey[resolved.requestedKey] || 0) + 1;
    }
  }

  assert(
    missingSpriteRefs.length === 0,
    `sprite catalog missing icon mappings for: ${missingSpriteRefs.join(", ")}`
  );

  const fallbackKeys = Object.keys(fallbackUsageByKey).sort();
  if (fallbackKeys.length > 0) {
    const usage = fallbackKeys.map((key) => `${key}(${fallbackUsageByKey[key]})`).join(", ");
    console.log(`Icon sprite fallback usage: ${usage}`);
  }

  console.log("Icon sprite catalog guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
