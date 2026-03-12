const fs = require("fs");
const path = require("path");
const {
  isObject,
  sortKeysDeep,
  loadRuntimeItemCatalog,
  loadIconSpriteCatalog
} = require("./runtime-item-catalog");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function main() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const itemsDir = path.join(projectRoot, "content", "items");

  const errors = [];
  const warnings = [];
  const infos = [];
  const runtimeMirrorFilename = "runtime-item-catalog.json";

  const requiredDirs = [
    path.join(projectRoot, "assets", "input"),
    path.join(projectRoot, "assets", "pixel"),
    path.join(projectRoot, "assets", "models"),
    itemsDir
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      errors.push(`Missing required directory: ${dir}`);
    }
  }

  if (!fs.existsSync(itemsDir)) {
    for (const e of errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(itemsDir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .filter((name) => !name.startsWith("_"))
    .filter((name) => name !== runtimeMirrorFilename);

  if (files.length === 0) {
    warnings.push("No item JSON files found in content/items (excluding templates).");
  }

  const seenIds = new Map();
  let runtimeItemDefs = {};
  let spriteMarkupByKey = {};
  let fallbackSpriteKeyByKey = {};

  try {
    const runtime = loadRuntimeItemCatalog(projectRoot);
    runtimeItemDefs = isObject(runtime && runtime.itemDefs) ? runtime.itemDefs : {};
  } catch (error) {
    errors.push(`failed to load runtime item catalog: ${error.message}`);
  }

  try {
    const spriteCatalog = loadIconSpriteCatalog(projectRoot);
    spriteMarkupByKey = isObject(spriteCatalog && spriteCatalog.spriteMarkupByKey)
      ? spriteCatalog.spriteMarkupByKey
      : {};
    fallbackSpriteKeyByKey = isObject(spriteCatalog && spriteCatalog.fallbackSpriteKeyByKey)
      ? spriteCatalog.fallbackSpriteKeyByKey
      : {};
  } catch (error) {
    errors.push(`failed to load icon sprite catalog: ${error.message}`);
  }

  for (const file of files) {
    const fullPath = path.join(itemsDir, file);
    let item;

    try {
      item = readJson(fullPath);
    } catch (error) {
      errors.push(`${file}: invalid JSON (${error.message})`);
      continue;
    }

    const requiredFields = ["id", "name", "type", "stackable", "value", "actions", "assets"];
    for (const field of requiredFields) {
      if (!(field in item)) {
        errors.push(`${file}: missing required field '${field}'`);
      }
    }

    if (!isString(item.id)) {
      errors.push(`${file}: id must be a non-empty string`);
    } else if (!/^[a-z0-9_]+$/.test(item.id)) {
      errors.push(`${file}: id '${item.id}' must match /^[a-z0-9_]+$/`);
    } else {
      if (seenIds.has(item.id)) {
        errors.push(`${file}: duplicate id '${item.id}' (already in ${seenIds.get(item.id)})`);
      }
      seenIds.set(item.id, file);
      if (!runtimeItemDefs[item.id]) {
        warnings.push(`${file}: id '${item.id}' is not currently present in runtime catalog ITEM_DEFS`);
      }
    }

    if (!isString(item.name)) {
      errors.push(`${file}: name must be a non-empty string`);
    }

    if (!isString(item.type)) {
      errors.push(`${file}: type must be a non-empty string`);
    }

    if (typeof item.stackable !== "boolean") {
      errors.push(`${file}: stackable must be true or false`);
    }

    if (typeof item.value !== "number" || !Number.isFinite(item.value) || item.value < 0) {
      errors.push(`${file}: value must be a number >= 0`);
    }

    if (!Array.isArray(item.actions) || item.actions.length === 0) {
      errors.push(`${file}: actions must be a non-empty array`);
    } else {
      const normalizedActions = item.actions
        .filter((action) => isString(action))
        .map((action) => action.trim().toLowerCase());

      if (normalizedActions.length !== item.actions.length) {
        errors.push(`${file}: actions must only contain non-empty strings`);
      }

      if (!normalizedActions.includes("use")) {
        errors.push(`${file}: actions must include 'Use'`);
      }
    }

    if (!item.assets || typeof item.assets !== "object") {
      errors.push(`${file}: assets must be an object`);
      continue;
    }

    const assetFields = ["icon", "model", "groundModel"];
    for (const key of assetFields) {
      const assetPath = item.assets[key];
      if (!isString(assetPath)) {
        errors.push(`${file}: assets.${key} must be a non-empty string path`);
        continue;
      }

      const absoluteAssetPath = path.resolve(projectRoot, assetPath);
      if (!fs.existsSync(absoluteAssetPath)) {
        warnings.push(`${file}: missing asset file '${assetPath}'`);
      }
    }
  }

  const fallbackUsageByRequestedKey = {};
  const runtimeItemIds = Object.keys(runtimeItemDefs);
  for (const itemId of runtimeItemIds) {
    const itemDef = runtimeItemDefs[itemId];
    const icon = itemDef && itemDef.icon;
    if (!isObject(icon) || icon.kind !== "sprite") {
      continue;
    }

    const requestedKey = isString(icon.key) ? icon.key.trim() : "";
    if (!requestedKey) {
      errors.push(`runtime ITEM_DEFS.${itemId}: sprite icon key must be a non-empty string`);
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(spriteMarkupByKey, requestedKey)) {
      continue;
    }

    const fallbackKey = isString(fallbackSpriteKeyByKey[requestedKey])
      ? fallbackSpriteKeyByKey[requestedKey].trim()
      : "";
    if (fallbackKey && Object.prototype.hasOwnProperty.call(spriteMarkupByKey, fallbackKey)) {
      fallbackUsageByRequestedKey[requestedKey] = (fallbackUsageByRequestedKey[requestedKey] || 0) + 1;
      continue;
    }

    errors.push(
      `runtime ITEM_DEFS.${itemId}: missing sprite '${requestedKey}' in icon catalog and no valid fallback`
    );
  }

  const fallbackUsageKeys = Object.keys(fallbackUsageByRequestedKey).sort();
  if (fallbackUsageKeys.length > 0) {
    const usageSummary = fallbackUsageKeys
      .map((key) => `${key}(${fallbackUsageByRequestedKey[key]})`)
      .join(", ");
    infos.push(`Sprite fallback usage detected: ${usageSummary}`);
    infos.push(`Icon fallback usage count: ${fallbackUsageKeys.reduce((sum, key) => sum + fallbackUsageByRequestedKey[key], 0)}`);
  }

  const runtimeMirrorPath = path.join(itemsDir, runtimeMirrorFilename);
  if (!fs.existsSync(runtimeMirrorPath)) {
    errors.push(`missing runtime mirror '${runtimeMirrorFilename}' (run 'npm.cmd run tool:items:sync')`);
  } else {
    try {
      const runtimeMirror = readJson(runtimeMirrorPath);
      const mirrorDefs = runtimeMirror && runtimeMirror.itemDefs;
      if (!isObject(mirrorDefs)) {
        errors.push(`${runtimeMirrorFilename}: missing object field 'itemDefs'`);
      } else {
        const runtimeSorted = sortKeysDeep(runtimeItemDefs);
        const mirrorSorted = sortKeysDeep(mirrorDefs);
        if (JSON.stringify(runtimeSorted) !== JSON.stringify(mirrorSorted)) {
          errors.push(
            `${runtimeMirrorFilename}: runtime mirror is out of sync with src/js/content/item-catalog.js (run 'npm.cmd run tool:items:sync')`
          );
        }
      }
    } catch (error) {
      errors.push(`${runtimeMirrorFilename}: invalid JSON (${error.message})`);
    }
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR: ${e}`);
  }

  if (warnings.length > 0) {
    for (const w of warnings) console.warn(`WARN: ${w}`);
  }

  if (infos.length > 0) {
    for (const info of infos) console.log(`INFO: ${info}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  const runtimeCount = Object.keys(runtimeItemDefs).length;
  console.log(`Validated ${files.length} authored item file(s) and runtime mirror (${runtimeCount} runtime item definitions).`);
  if (warnings.length > 0) {
    console.log(`Validation passed with ${warnings.length} warning(s).`);
  } else {
    console.log("Validation passed with no warnings.");
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
