const fs = require("fs");
const path = require("path");

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function validateNodeTable(skillId, nodeTable, errors) {
  if (!isObject(nodeTable)) {
    errors.push(`${skillId}: nodeTable must be an object`);
    return;
  }

  const keys = Object.keys(nodeTable);
  if (keys.length === 0) {
    errors.push(`${skillId}: nodeTable must not be empty`);
    return;
  }

  for (const key of keys) {
    const node = nodeTable[key];
    if (!isObject(node)) {
      errors.push(`${skillId}.${key}: node must be an object`);
      continue;
    }
    const hasTile = Number.isFinite(node.tileId) || (Array.isArray(node.tileIds) && node.tileIds.every(Number.isFinite));
    if (!hasTile) errors.push(`${skillId}.${key}: tileId or tileIds[] is required`);
  }
}

function validateRecipeSet(skillId, recipeSet, errors) {
  if (!isObject(recipeSet)) {
    errors.push(`${skillId}: recipeSet must be an object`);
    return;
  }
  if (Object.keys(recipeSet).length === 0) {
    errors.push(`${skillId}: recipeSet must not be empty`);
  }
}

function validateSkillFile(filePath, errors) {
  const data = readJson(filePath);
  const skillId = data.skillId;

  if (typeof skillId !== "string" || skillId.trim() === "") {
    errors.push(`${path.basename(filePath)}: skillId must be a non-empty string`);
    return;
  }

  if (!isObject(data.timing)) {
    errors.push(`${skillId}: timing is required`);
  }

  if (!isObject(data.economy)) {
    errors.push(`${skillId}: economy is required`);
  }

  if (isObject(data.nodeTable)) {
    validateNodeTable(skillId, data.nodeTable, errors);
  }

  if (isObject(data.recipeSet)) {
    validateRecipeSet(skillId, data.recipeSet, errors);
  }

  if (!isObject(data.nodeTable) && !isObject(data.recipeSet)) {
    errors.push(`${skillId}: one of nodeTable or recipeSet is required`);
  }
}

function main() {
  const root = path.resolve(__dirname, "..", "..");
  const skillsDir = path.join(root, "content", "skills");

  if (!fs.existsSync(skillsDir)) {
    console.error(`ERROR: missing skills directory ${skillsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(skillsDir).filter((name) => name.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error("ERROR: no skill JSON files found");
    process.exit(1);
  }

  const errors = [];

  for (const file of files) {
    const filePath = path.join(skillsDir, file);
    try {
      validateSkillFile(filePath, errors);
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    for (const err of errors) console.error(`ERROR: ${err}`);
    process.exit(1);
  }

  console.log(`Validated ${files.length} skill spec file(s).`);
}

main();
