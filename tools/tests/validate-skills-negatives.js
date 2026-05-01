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
        row.timing.baseAttemptTicks += 99;
      }
    }
  });
  const mismatchResult = validateSkillDirectory(mismatchCaseDir, canonical.rows);
  assert(mismatchResult.errors.some((entry) => entry.includes("content mismatch for skill 'woodcutting'")), "expected woodcutting mismatch error");
  assert(mismatchResult.errors.some((entry) => entry.includes("timing.baseAttemptTicks")), "expected mismatch path for woodcutting timing.baseAttemptTicks");

  const woodcuttingDriftDir = path.join(tempRoot, "woodcutting-drift");
  writeCanonicalSkillSet(woodcuttingDriftDir, canonical.rows, {
    mutateBySkillId: {
      woodcutting: (row) => {
        row.nodeTable.normal_tree.depletionChance = 0.001;
        row.nodeTable.oak_tree.depletionChance = 0.001;
      }
    }
  });
  const woodcuttingDriftResult = validateSkillDirectory(woodcuttingDriftDir, canonical.rows);
  assert(
    woodcuttingDriftResult.errors.some((entry) => entry.includes("content mismatch for skill 'woodcutting'")),
    "expected woodcutting node drift to fail full skill validation"
  );
  assert(
    woodcuttingDriftResult.errors.some((entry) => entry.includes("nodeTable.normal_tree.depletionChance")),
    "expected woodcutting node drift path to be reported"
  );

  const runecraftingIntegrationDriftDir = path.join(tempRoot, "runecrafting-integration-drift");
  writeCanonicalSkillSet(runecraftingIntegrationDriftDir, canonical.rows, {
    mutateBySkillId: {
      runecrafting: (row) => {
        row.integration.magicRuneDemand.combinationRuneItemIds = row.integration.magicRuneDemand.combinationRuneItemIds.filter((itemId) => itemId !== "dust_rune");
      }
    }
  });
  const runecraftingIntegrationDriftResult = validateSkillDirectory(runecraftingIntegrationDriftDir, canonical.rows);
  assert(
    runecraftingIntegrationDriftResult.errors.some((entry) => entry.includes("content mismatch for skill 'runecrafting'")),
    "expected runecrafting integration drift to fail full skill validation"
  );
  assert(
    runecraftingIntegrationDriftResult.errors.some((entry) => entry.includes("integration.magicRuneDemand.combinationRuneItemIds")),
    "expected runecrafting integration drift path to be reported"
  );

  console.log("Skill validator negative tests passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
