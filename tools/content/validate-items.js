const fs = require("fs");
const path = require("path");

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
    .filter((name) => !name.startsWith("_"));

  if (files.length === 0) {
    warnings.push("No item JSON files found in content/items (excluding templates).");
  }

  const seenIds = new Map();

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

  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR: ${e}`);
  }

  if (warnings.length > 0) {
    for (const w of warnings) console.warn(`WARN: ${w}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  console.log(`Validated ${files.length} item file(s).`);
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
