const path = require("path");
const vm = require("vm");
const { SKILL_SPEC_SCRIPT_PATHS } = require("../content/runtime-skill-specs");
const { readRepoFile } = require("./repo-file-test-utils");

function loadBrowserScript(root, relPath) {
  const abs = path.join(root, relPath);
  const code = readRepoFile(root, relPath);
  vm.runInThisContext(code, { filename: abs });
}

function loadSkillSpecScripts(root) {
  for (const relPath of SKILL_SPEC_SCRIPT_PATHS) loadBrowserScript(root, relPath);
}

module.exports = {
  loadBrowserScript,
  loadSkillSpecScripts
};
