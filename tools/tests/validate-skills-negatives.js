const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  getCanonicalSkillRows,
  validateSkillDirectory
} = require("../content/validate-skills.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeCanonicalSkillSet(targetDir, canonicalRows, options = {}) {
  fs.mkdirSync(targetDir, { recursive: true });
  const skip = new Set(options.skipSkillIds || []);
  const mutateBySkillId = options.mutateBySkillId || {};

  for (const [skillId, payload] of canonicalRows.entries()) {
    if (skip.has(skillId)) continue;
    const row = clone(payload);
    if (typeof mutateBySkillId[skillId] === "function") {
      mutateBySkillId[skillId](row);
    }
    writeJson(path.join(targetDir, `${skillId}.json`), row);
  }
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const canonical = getCanonicalSkillRows(root);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "osrs-skill-validate-"));

  const missingCaseDir = path.join(tempRoot, "missing");
  writeCanonicalSkillSet(missingCaseDir, canonical.rows, { skipSkillIds: ["smithing"] });
  const missingResult = validateSkillDirectory(missingCaseDir, canonical.rows);
  assert(missingResult.errors.some((entry) => entry.includes("missing skill file(s)") && entry.includes("smithing")), "expected missing skillId error for smithing");

  const mismatchCaseDir = path.join(tempRoot, "mismatch");
  writeCanonicalSkillSet(mismatchCaseDir, canonical.rows, {
    mutateBySkillId: {
      woodcutting: (row) => {
        row.timing.baseAttemptTicks = row.timing.baseAttemptTicks + 99;
      }
    }
  });
  const mismatchResult = validateSkillDirectory(mismatchCaseDir, canonical.rows);
  assert(mismatchResult.errors.some((entry) => entry.includes("content mismatch for skill 'woodcutting'")), "expected woodcutting mismatch error");
  assert(mismatchResult.errors.some((entry) => entry.includes("timing.baseAttemptTicks")), "expected mismatch path for woodcutting timing.baseAttemptTicks");

  console.log("Skill validator negative tests passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}