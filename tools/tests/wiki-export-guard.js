const fs = require("fs");
const path = require("path");

const {
  WIKI_EXPORT_SCHEMA_VERSION,
  exportWikiBundle,
  validateWikiExportBundle
} = require("../content/wiki-export");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectFailure(fn, expectedMessageRegex, label) {
  let failed = null;
  try {
    fn();
  } catch (error) {
    failed = error;
  }

  assert(!!failed, `${label}: expected failure`);
  if (expectedMessageRegex) {
    assert(expectedMessageRegex.test(String(failed.message || failed)), `${label}: unexpected error "${failed.message || failed}"`);
  }
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const outDir = path.join(root, "tmp", "wiki-export-guard");
  fs.mkdirSync(outDir, { recursive: true });

  const bundle = exportWikiBundle(root, outDir, {
    generatedAt: "2026-03-13T00:00:00.000Z",
    sourceCommit: "test-commit"
  });

  ["manifest.json", "items.json", "skills.json", "worlds.json"].forEach((filename) => {
    assert(fs.existsSync(path.join(outDir, filename)), `${filename} was not written`);
  });

  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
  const items = JSON.parse(fs.readFileSync(path.join(outDir, "items.json"), "utf8"));
  const skills = JSON.parse(fs.readFileSync(path.join(outDir, "skills.json"), "utf8"));
  const worlds = JSON.parse(fs.readFileSync(path.join(outDir, "worlds.json"), "utf8"));

  assert(manifest.schemaVersion === WIKI_EXPORT_SCHEMA_VERSION, "wiki export schema version mismatch");
  assert(manifest.generatedAt === "2026-03-13T00:00:00.000Z", "wiki export generatedAt mismatch");
  assert(manifest.sourceCommit === "test-commit", "wiki export sourceCommit mismatch");
  assert(manifest.counts.items === items.length, "wiki export items count mismatch");
  assert(manifest.counts.skills === skills.length, "wiki export skills count mismatch");
  assert(manifest.counts.worlds === worlds.length, "wiki export worlds count mismatch");

  const duplicateIdBundle = cloneJson(bundle);
  duplicateIdBundle.items[1].itemId = duplicateIdBundle.items[0].itemId;
  expectFailure(() => validateWikiExportBundle(duplicateIdBundle), /duplicate item id/i, "duplicate item id guard");

  const duplicateSlugBundle = cloneJson(bundle);
  duplicateSlugBundle.skills[1].slug = duplicateSlugBundle.skills[0].slug;
  expectFailure(() => validateWikiExportBundle(duplicateSlugBundle), /duplicate skill slug/i, "duplicate skill slug guard");

  const missingLinkBundle = cloneJson(bundle);
  missingLinkBundle.skills[0].relatedItemIds = missingLinkBundle.skills[0].relatedItemIds.concat(["missing_item"]);
  expectFailure(() => validateWikiExportBundle(missingLinkBundle), /unknown item/i, "missing linked entity guard");

  const invalidWorldRefBundle = cloneJson(bundle);
  const travelService = invalidWorldRefBundle.worlds[0].data.services.find((service) => service && service.travelToWorldId);
  assert(!!travelService, "expected a travel service for invalid world reference guard");
  travelService.travelToWorldId = "missing_world";
  expectFailure(() => validateWikiExportBundle(invalidWorldRefBundle), /references unknown world/i, "invalid world reference guard");

  console.log(`Wiki export guard passed (${bundle.items.length} items, ${bundle.skills.length} skills, ${bundle.worlds.length} worlds).`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
