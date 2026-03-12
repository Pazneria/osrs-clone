const fs = require("fs");
const path = require("path");
const {
  isObject,
  sortKeysDeep,
  loadRuntimeSkillSpecs
} = require("./runtime-skill-specs");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function formatPath(basePath, segment) {
  if (!basePath) return segment;
  if (/^\[\d+\]$/.test(segment)) return `${basePath}${segment}`;
  return `${basePath}.${segment}`;
}

function deepDiff(expected, actual, basePath = "", diffs = []) {
  if (diffs.length >= 20) return diffs;

  const expectedIsArray = Array.isArray(expected);
  const actualIsArray = Array.isArray(actual);

  if (expectedIsArray || actualIsArray) {
    if (!expectedIsArray || !actualIsArray) {
      diffs.push(`${basePath || "(root)"}: type mismatch (expected ${expectedIsArray ? "array" : typeof expected}, got ${actualIsArray ? "array" : typeof actual})`);
      return diffs;
    }

    if (expected.length !== actual.length) {
      diffs.push(`${basePath || "(root)"}: array length mismatch (expected ${expected.length}, got ${actual.length})`);
    }

    const minLen = Math.min(expected.length, actual.length);
    for (let i = 0; i < minLen; i++) {
      deepDiff(expected[i], actual[i], `${basePath || ""}[${i}]`, diffs);
      if (diffs.length >= 20) break;
    }

    return diffs;
  }

  const expectedIsObject = isObject(expected);
  const actualIsObject = isObject(actual);

  if (expectedIsObject || actualIsObject) {
    if (!expectedIsObject || !actualIsObject) {
      diffs.push(`${basePath || "(root)"}: type mismatch (expected ${expectedIsObject ? "object" : typeof expected}, got ${actualIsObject ? "object" : typeof actual})`);
      return diffs;
    }

    const expectedKeys = Object.keys(expected).sort();
    const actualKeys = Object.keys(actual).sort();

    for (const key of expectedKeys) {
      if (!Object.prototype.hasOwnProperty.call(actual, key)) {
        diffs.push(`${formatPath(basePath, key)}: missing key`);
        if (diffs.length >= 20) return diffs;
      }
    }

    for (const key of actualKeys) {
      if (!Object.prototype.hasOwnProperty.call(expected, key)) {
        diffs.push(`${formatPath(basePath, key)}: unexpected key`);
        if (diffs.length >= 20) return diffs;
      }
    }

    for (const key of expectedKeys) {
      if (!Object.prototype.hasOwnProperty.call(actual, key)) continue;
      deepDiff(expected[key], actual[key], formatPath(basePath, key), diffs);
      if (diffs.length >= 20) return diffs;
    }

    return diffs;
  }

  if (!Object.is(expected, actual)) {
    diffs.push(`${basePath || "(root)"}: value mismatch (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }

  return diffs;
}

function getCanonicalSkillRows(projectRoot) {
  const runtime = loadRuntimeSkillSpecs(projectRoot);
  const skills = runtime.skills;
  const rows = new Map();

  for (const skillId of Object.keys(skills).sort()) {
    const spec = skills[skillId];
    rows.set(skillId, sortKeysDeep({ skillId, ...spec }));
  }

  return {
    version: runtime.version,
    rows
  };
}

function validateSkillDirectory(skillsDir, canonicalRows) {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(skillsDir)) {
    errors.push(`missing skills directory ${skillsDir}`);
    return { errors, warnings, fileCount: 0 };
  }

  const files = fs.readdirSync(skillsDir).filter((name) => name.endsWith(".json")).sort();
  const seen = new Map();
  const actualRows = new Map();

  for (const file of files) {
    const filePath = path.join(skillsDir, file);
    let data;

    try {
      data = readJson(filePath);
    } catch (error) {
      errors.push(`${file}: invalid JSON (${error.message})`);
      continue;
    }

    if (!isObject(data)) {
      errors.push(`${file}: expected top-level JSON object`);
      continue;
    }

    const skillId = data.skillId;
    if (typeof skillId !== "string" || skillId.trim() === "") {
      errors.push(`${file}: skillId must be a non-empty string`);
      continue;
    }

    if (seen.has(skillId)) {
      errors.push(`${file}: duplicate skillId '${skillId}' (already in ${seen.get(skillId)})`);
      continue;
    }

    seen.set(skillId, file);

    const expectedFile = `${skillId}.json`;
    if (file !== expectedFile) {
      warnings.push(`${file}: expected filename '${expectedFile}' for skillId '${skillId}'`);
    }

    actualRows.set(skillId, sortKeysDeep(data));
  }

  const expectedSkillIds = Array.from(canonicalRows.keys()).sort();
  const actualSkillIds = Array.from(actualRows.keys()).sort();

  const missingSkills = expectedSkillIds.filter((skillId) => !actualRows.has(skillId));
  if (missingSkills.length > 0) {
    errors.push(`missing skill file(s): ${missingSkills.join(", ")}`);
  }

  const extraSkills = actualSkillIds.filter((skillId) => !canonicalRows.has(skillId));
  if (extraSkills.length > 0) {
    errors.push(`unexpected skill file(s): ${extraSkills.join(", ")}`);
  }

  for (const skillId of expectedSkillIds) {
    if (!actualRows.has(skillId)) continue;
    const expected = canonicalRows.get(skillId);
    const actual = actualRows.get(skillId);
    const diffs = deepDiff(expected, actual);
    if (diffs.length > 0) {
      errors.push(`content mismatch for skill '${skillId}':\n  - ${diffs.join("\n  - ")}`);
    }
  }

  return {
    errors,
    warnings,
    fileCount: files.length
  };
}

function main() {
  const root = path.resolve(__dirname, "..", "..");
  const skillsDir = path.join(root, "content", "skills");
  const canonical = getCanonicalSkillRows(root);
  const result = validateSkillDirectory(skillsDir, canonical.rows);

  if (result.errors.length > 0) {
    for (const err of result.errors) console.error(`ERROR: ${err}`);
  }

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
  }

  if (result.errors.length > 0) {
    process.exit(1);
  }

  console.log(`Validated ${result.fileCount} skill spec file(s) against runtime spec version ${canonical.version}.`);
  if (result.warnings.length > 0) {
    console.log(`Validation passed with ${result.warnings.length} warning(s).`);
  } else {
    console.log("Validation passed with no warnings.");
  }
}

module.exports = {
  readJson,
  deepDiff,
  getCanonicalSkillRows,
  validateSkillDirectory
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}