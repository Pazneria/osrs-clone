const fs = require("fs");
const path = require("path");
const {
  sortKeysDeep,
  loadRuntimeSkillSpecs
} = require("./runtime-skill-specs");

function writeJson(filePath, value) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, json, "utf8");
}

function main() {
  const root = path.resolve(__dirname, "..", "..");
  const outDir = path.join(root, "content", "skills");

  fs.mkdirSync(outDir, { recursive: true });

  const runtime = loadRuntimeSkillSpecs(root);
  const skillIds = Object.keys(runtime.skills).sort();

  const existingFiles = fs.readdirSync(outDir).filter((name) => name.endsWith(".json"));
  for (const file of existingFiles) {
    fs.unlinkSync(path.join(outDir, file));
  }

  for (const skillId of skillIds) {
    const payload = sortKeysDeep({ skillId, ...runtime.skills[skillId] });
    const outPath = path.join(outDir, `${skillId}.json`);
    writeJson(outPath, payload);
  }

  console.log(`Synced ${skillIds.length} skill spec mirror file(s) from runtime version ${runtime.version}.`);
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}