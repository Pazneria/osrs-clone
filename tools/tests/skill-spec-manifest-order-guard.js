const fs = require("fs");
const path = require("path");
const { SKILL_SPEC_SCRIPT_PATHS } = require("../content/runtime-skill-specs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseLegacySkillSpecFilenames(source) {
  const filenames = [];
  const entryRegex = /\{\s*id:\s*"skills-specs(?:-[^"]+)?",\s*filename:\s*"([^"]+)"/g;
  let match = entryRegex.exec(source);
  while (match) {
    filenames.push(match[1]);
    match = entryRegex.exec(source);
  }
  return filenames;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const legacySkillSpecPaths = parseLegacySkillSpecFilenames(manifestSource);

  assert(legacySkillSpecPaths.length > 0, "legacy manifest should include skill spec shard entries");
  assert(
    legacySkillSpecPaths.join("\n") === SKILL_SPEC_SCRIPT_PATHS.join("\n"),
    "legacy manifest skill spec shard order should match runtime skill spec loader order"
  );
  assert(
    !manifestSource.includes('filename: "src/js/skills/specs.js"'),
    "legacy manifest should not load the compatibility skill specs marker as runtime data"
  );
  assert(
    legacySkillSpecPaths[0] === "src/js/skills/specs/shared.js"
      && legacySkillSpecPaths[legacySkillSpecPaths.length - 1] === "src/js/skills/specs/finalize.js",
    "skill spec shards should load shared data first and finalizer last"
  );

  console.log("Skill spec manifest order guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
