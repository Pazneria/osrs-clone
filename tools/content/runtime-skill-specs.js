const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { isObject } = require("./object-utils");

const SKILL_SPEC_SCRIPT_PATHS = Object.freeze([
  "src/js/skills/specs/shared.js",
  "src/js/skills/specs/woodcutting.js",
  "src/js/skills/specs/fishing.js",
  "src/js/skills/specs/firemaking.js",
  "src/js/skills/specs/cooking.js",
  "src/js/skills/specs/mining.js",
  "src/js/skills/specs/runecrafting.js",
  "src/js/skills/specs/crafting.js",
  "src/js/skills/specs/fletching.js",
  "src/js/skills/specs/smithing.js",
  "src/js/skills/specs/finalize.js"
]);

function loadSkillSpecScripts(projectRoot, sandbox) {
  if (!sandbox || !isObject(sandbox)) {
    throw new Error("Skill spec shard loader requires a sandbox object");
  }
  if (!sandbox.window || !isObject(sandbox.window)) sandbox.window = {};

  for (const relPath of SKILL_SPEC_SCRIPT_PATHS) {
    const abs = path.join(projectRoot, relPath);
    const code = fs.readFileSync(abs, "utf8");
    vm.runInNewContext(code, sandbox, { filename: abs });
  }

  return sandbox;
}

function loadRuntimeSkillSpecs(projectRoot) {
  const sandbox = { window: {} };

  loadSkillSpecScripts(projectRoot, sandbox);

  const root = sandbox.window && sandbox.window.SkillSpecs;
  if (!isObject(root) || !isObject(root.skills)) {
    throw new Error("Failed to load window.SkillSpecs from skill spec shards");
  }
  if (Object.prototype.hasOwnProperty.call(sandbox.window, "__SkillSpecAuthoring")) {
    throw new Error("Skill spec authoring runtime leaked after finalization");
  }

  return root;
}

module.exports = {
  SKILL_SPEC_SCRIPT_PATHS,
  loadSkillSpecScripts,
  loadRuntimeSkillSpecs
};
