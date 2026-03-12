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

function loadRuntimeSkillSpecs(projectRoot) {
  const specsPath = path.join(projectRoot, "src", "js", "skills", "specs.js");
  const code = fs.readFileSync(specsPath, "utf8");
  const sandbox = { window: {} };

  vm.runInNewContext(code, sandbox, { filename: specsPath });

  const root = sandbox.window && sandbox.window.SkillSpecs;
  if (!isObject(root) || !isObject(root.skills)) {
    throw new Error("Failed to load window.SkillSpecs from src/js/skills/specs.js");
  }

  return root;
}

module.exports = {
  isObject,
  sortKeysDeep,
  loadRuntimeSkillSpecs
};