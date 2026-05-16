const fs = require("fs");
const path = require("path");
const { isObject, sortKeysDeep } = require("./object-utils");
const { readJsonFile } = require("../lib/json-file-utils");

const ICON_STATUS_FILENAME = "icon-status.json";
const ICON_STATUS_GENERATED_FROM = "src/js/content/item-catalog.js";
const ICON_STATUS_VALUES = ["done", "todo"];
const ICON_TREATMENT_VALUES = ["bespoke", "shared"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getIconStatusPath(projectRoot) {
  return path.join(projectRoot, "content", ICON_STATUS_FILENAME);
}

function getRuntimeIconAssetId(itemDef) {
  const icon = itemDef && itemDef.icon;
  if (!isObject(icon) || icon.kind !== "pixel" || !isNonEmptyString(icon.assetId)) {
    return "";
  }
  return icon.assetId.trim();
}

function getAssetUsageById(itemDefs) {
  const usageById = {};
  for (const itemDef of Object.values(itemDefs || {})) {
    const assetId = getRuntimeIconAssetId(itemDef);
    if (!assetId) continue;
    usageById[assetId] = (usageById[assetId] || 0) + 1;
  }
  return usageById;
}

function inferIconTreatment(assetUsageById, assetId) {
  return (assetUsageById[assetId] || 0) > 1 ? "shared" : "bespoke";
}

function readIconStatusManifest(projectRoot) {
  const iconStatusPath = getIconStatusPath(projectRoot);
  if (!fs.existsSync(iconStatusPath)) return null;
  return readJsonFile(iconStatusPath);
}

function buildIconStatusManifest(runtimeItemDefs, existingManifest = null) {
  const existingItems = isObject(existingManifest && existingManifest.items) ? existingManifest.items : {};
  const assetUsageById = getAssetUsageById(runtimeItemDefs);
  const items = {};

  for (const itemId of Object.keys(runtimeItemDefs).sort()) {
    const assetId = getRuntimeIconAssetId(runtimeItemDefs[itemId]);
    const existingEntry = isObject(existingItems[itemId]) ? existingItems[itemId] : {};

    const entry = {
      status: ICON_STATUS_VALUES.includes(existingEntry.status) ? existingEntry.status : "todo",
      assetId,
      treatment: inferIconTreatment(assetUsageById, assetId)
    };

    if (isNonEmptyString(existingEntry.notes)) {
      entry.notes = existingEntry.notes.trim();
    }

    items[itemId] = entry;
  }

  return {
    generatedFrom: ICON_STATUS_GENERATED_FROM,
    generatedAt: new Date().toISOString(),
    items: sortKeysDeep(items)
  };
}

module.exports = {
  ICON_STATUS_FILENAME,
  ICON_STATUS_GENERATED_FROM,
  ICON_STATUS_VALUES,
  ICON_TREATMENT_VALUES,
  buildIconStatusManifest,
  getAssetUsageById,
  getIconStatusPath,
  getRuntimeIconAssetId,
  inferIconTreatment,
  readIconStatusManifest
};
