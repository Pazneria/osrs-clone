const fs = require("fs");
const path = require("path");
const { isObject, sortKeysDeep } = require("./object-utils");
const { loadRuntimeItemCatalog } = require("./runtime-item-catalog");
const {
  ICON_STATUS_FILENAME,
  ICON_STATUS_GENERATED_FROM,
  ICON_STATUS_VALUES,
  ICON_TREATMENT_VALUES,
  buildIconStatusManifest,
  getAssetUsageById,
  getIconStatusPath,
  getRuntimeIconAssetId,
  inferIconTreatment
} = require("./icon-status-manifest");
const {
  validatePixelSource,
  getSolidPixelCoords
} = require("../pixel/pixel-source");
const {
  getPixelSourceDir,
  getPixelSourcePath,
  getPixelArtifactPaths
} = require("../pixel/pixel-project");
const { readPngSize } = require("../pixel/pixel-png");
const { readJsonFile: readJson } = require("../lib/json-file-utils");

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function main() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const itemsDir = path.join(projectRoot, "content", "items");
  const pixelSourceDir = getPixelSourceDir(projectRoot);
  const runtimeMirrorFilename = "runtime-item-catalog.json";
  const iconStatusPath = getIconStatusPath(projectRoot);

  const errors = [];
  const warnings = [];
  const infos = [];

  const requiredDirs = [
    pixelSourceDir,
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

  const authoredItemFiles = fs
    .readdirSync(itemsDir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .filter((name) => !name.startsWith("_"))
    .filter((name) => name !== runtimeMirrorFilename);

  if (authoredItemFiles.length === 0) {
    warnings.push("No item JSON files found in content/items (excluding templates).");
  }

  let runtimeItemDefs = {};
  try {
    const runtime = loadRuntimeItemCatalog(projectRoot);
    runtimeItemDefs = isObject(runtime && runtime.itemDefs) ? runtime.itemDefs : {};
  } catch (error) {
    errors.push(`failed to load runtime item catalog: ${error.message}`);
  }

  const pixelSourceFiles = fs.existsSync(pixelSourceDir)
    ? fs.readdirSync(pixelSourceDir).filter((name) => name.toLowerCase().endsWith(".json")).sort()
    : [];
  if (pixelSourceFiles.length === 0) {
    warnings.push("No pixel source files found in assets/pixel-src.");
  }

  const pixelSourceById = {};
  for (const filename of pixelSourceFiles) {
    const filePath = path.join(pixelSourceDir, filename);
    let raw;
    try {
      raw = readJson(filePath);
    } catch (error) {
      errors.push(`${filename}: invalid JSON (${error.message})`);
      continue;
    }

    const validation = validatePixelSource(raw);
    if (validation.errors.length > 0) {
      errors.push(`${filename}: ${validation.errors.join("; ")}`);
      continue;
    }

    const source = validation.normalized;
    const expectedFilename = `${source.id}.json`;
    if (filename !== expectedFilename) {
      errors.push(`${filename}: id '${source.id}' must match filename '${expectedFilename}'`);
      continue;
    }
    if (pixelSourceById[source.id]) {
      errors.push(`${filename}: duplicate pixel source id '${source.id}'`);
      continue;
    }

    try {
      const solidPixels = getSolidPixelCoords(source);
      if (solidPixels.length === 0) {
        errors.push(`${filename}: pixel source must contain at least one non-transparent pixel`);
      }
    } catch (error) {
      errors.push(`${filename}: ${error.message}`);
      continue;
    }

    pixelSourceById[source.id] = source;

    const artifacts = getPixelArtifactPaths(projectRoot, source.id);
    if (!fs.existsSync(artifacts.icon)) {
      errors.push(`${filename}: missing generated icon '${path.relative(projectRoot, artifacts.icon)}'`);
    } else {
      try {
        const size = readPngSize(artifacts.icon);
        if (size.width !== 32 || size.height !== 32) {
          errors.push(`${filename}: generated icon must be 32x32 (found ${size.width}x${size.height})`);
        }
      } catch (error) {
        errors.push(`${filename}: ${error.message}`);
      }
    }

    for (const modelKey of ["model", "groundModel"]) {
      if (!fs.existsSync(artifacts[modelKey])) {
        errors.push(`${filename}: missing generated ${modelKey} '${path.relative(projectRoot, artifacts[modelKey])}'`);
        continue;
      }
      const stats = fs.statSync(artifacts[modelKey]);
      if (stats.size <= 0) {
        errors.push(`${filename}: generated ${modelKey} '${path.relative(projectRoot, artifacts[modelKey])}' is empty`);
      }
    }
  }

  const seenIds = new Map();
  for (const file of authoredItemFiles) {
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

    if (!isString(item.name)) errors.push(`${file}: name must be a non-empty string`);
    if (!isString(item.type)) errors.push(`${file}: type must be a non-empty string`);
    if (typeof item.stackable !== "boolean") errors.push(`${file}: stackable must be true or false`);
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

    for (const key of ["icon", "model", "groundModel"]) {
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

  const runtimeItemIds = Object.keys(runtimeItemDefs);
  const assetUsageById = getAssetUsageById(runtimeItemDefs);
  for (const itemId of runtimeItemIds) {
    const itemDef = runtimeItemDefs[itemId];
    const icon = itemDef && itemDef.icon;
    if (!isObject(icon)) {
      errors.push(`runtime ITEM_DEFS.${itemId}: icon must be an object`);
      continue;
    }
    if (icon.kind !== "pixel") {
      errors.push(`runtime ITEM_DEFS.${itemId}: icon.kind must be 'pixel'`);
      continue;
    }

    const assetId = getRuntimeIconAssetId(itemDef);
    if (!assetId) {
      errors.push(`runtime ITEM_DEFS.${itemId}: icon.assetId must be a non-empty string`);
      continue;
    }

    if (!pixelSourceById[assetId]) {
      errors.push(`runtime ITEM_DEFS.${itemId}: missing pixel source '${assetId}'`);
      continue;
    }

    const artifacts = getPixelArtifactPaths(projectRoot, assetId);
    if (!fs.existsSync(artifacts.icon)) {
      errors.push(`runtime ITEM_DEFS.${itemId}: missing generated icon '${path.relative(projectRoot, artifacts.icon)}'`);
    }
    if (!fs.existsSync(artifacts.model)) {
      errors.push(`runtime ITEM_DEFS.${itemId}: missing generated model '${path.relative(projectRoot, artifacts.model)}'`);
    }
    if (!fs.existsSync(artifacts.groundModel)) {
      errors.push(`runtime ITEM_DEFS.${itemId}: missing generated ground model '${path.relative(projectRoot, artifacts.groundModel)}'`);
    }
  }

  const unreferencedSources = Object.keys(pixelSourceById)
    .filter((assetId) => !assetUsageById[assetId])
    .sort();
  if (unreferencedSources.length > 0) {
    infos.push(`Unreferenced pixel source assets: ${unreferencedSources.join(", ")}`);
  }

  const sharedAssets = Object.keys(assetUsageById)
    .filter((assetId) => assetUsageById[assetId] > 1)
    .sort();
  if (sharedAssets.length > 0) {
    const summary = sharedAssets.map((assetId) => `${assetId}(${assetUsageById[assetId]})`).join(", ");
    infos.push(`Shared pixel asset usage: ${summary}`);
  }

  if (!fs.existsSync(iconStatusPath)) {
    errors.push(`missing icon status manifest '${ICON_STATUS_FILENAME}' (run 'npm.cmd run tool:items:sync')`);
  } else {
    try {
      const iconStatusManifest = readJson(iconStatusPath);
      if (!isObject(iconStatusManifest)) {
        errors.push(`${ICON_STATUS_FILENAME}: manifest root must be an object`);
      } else {
        if (iconStatusManifest.generatedFrom !== ICON_STATUS_GENERATED_FROM) {
          errors.push(
            `${ICON_STATUS_FILENAME}: generatedFrom must be '${ICON_STATUS_GENERATED_FROM}'`
          );
        }

        const iconStatusItems = iconStatusManifest.items;
        if (!isObject(iconStatusItems)) {
          errors.push(`${ICON_STATUS_FILENAME}: missing object field 'items'`);
        } else {
          const iconStatusErrorCount = errors.length;
          const iconStatusInfo = { done: 0, todo: 0 };

          for (const [itemId, entry] of Object.entries(iconStatusItems)) {
            if (!runtimeItemDefs[itemId]) {
              errors.push(`${ICON_STATUS_FILENAME}: unknown item id '${itemId}'`);
              continue;
            }
            if (!isObject(entry)) {
              errors.push(`${ICON_STATUS_FILENAME}: item '${itemId}' entry must be an object`);
              continue;
            }

            if (!ICON_STATUS_VALUES.includes(entry.status)) {
              errors.push(
                `${ICON_STATUS_FILENAME}: item '${itemId}' has invalid status '${entry.status}'`
              );
            } else {
              iconStatusInfo[entry.status] += 1;
            }

            const expectedAssetId = getRuntimeIconAssetId(runtimeItemDefs[itemId]);
            if (!isString(entry.assetId)) {
              errors.push(`${ICON_STATUS_FILENAME}: item '${itemId}' assetId must be a non-empty string`);
            } else if (entry.assetId.trim() !== expectedAssetId) {
              errors.push(
                `${ICON_STATUS_FILENAME}: item '${itemId}' assetId '${entry.assetId}' does not match runtime asset '${expectedAssetId}'`
              );
            }

            const expectedTreatment = inferIconTreatment(assetUsageById, expectedAssetId);
            if (!ICON_TREATMENT_VALUES.includes(entry.treatment)) {
              errors.push(
                `${ICON_STATUS_FILENAME}: item '${itemId}' has invalid treatment '${entry.treatment}'`
              );
            } else if (entry.treatment !== expectedTreatment) {
              errors.push(
                `${ICON_STATUS_FILENAME}: item '${itemId}' treatment '${entry.treatment}' does not match inferred treatment '${expectedTreatment}'`
              );
            }

            if ("notes" in entry && entry.notes !== undefined && !isString(entry.notes)) {
              errors.push(`${ICON_STATUS_FILENAME}: item '${itemId}' notes must be a non-empty string when present`);
            }
          }

          for (const itemId of runtimeItemIds) {
            if (!iconStatusItems[itemId]) {
              errors.push(`${ICON_STATUS_FILENAME}: missing item '${itemId}'`);
            }
          }

          if (errors.length === iconStatusErrorCount) {
            const expectedManifest = buildIconStatusManifest(runtimeItemDefs, iconStatusManifest);
            const actualItems = sortKeysDeep(iconStatusItems);
            const expectedItems = sortKeysDeep(expectedManifest.items);
            if (JSON.stringify(actualItems) !== JSON.stringify(expectedItems)) {
              errors.push(
                `${ICON_STATUS_FILENAME}: icon status manifest is out of sync with src/js/content/item-catalog.js (run 'npm.cmd run tool:items:sync')`
              );
            } else {
              infos.push(`Icon status summary: ${iconStatusInfo.done} done, ${iconStatusInfo.todo} todo`);
            }
          }
        }
      }
    } catch (error) {
      errors.push(`${ICON_STATUS_FILENAME}: invalid JSON (${error.message})`);
    }
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

  console.log(
    `Validated ${authoredItemFiles.length} authored item file(s), ${Object.keys(pixelSourceById).length} pixel source asset(s), and runtime mirror (${runtimeItemIds.length} runtime item definitions).`
  );
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
