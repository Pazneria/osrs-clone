const fs = require("fs");
const path = require("path");

const {
  CODEX_EXPORT_SCHEMA_VERSION,
  exportCodexBundle,
  validateCodexExportBundle
} = require("../content/codex-export");

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
  const outDir = path.join(root, "tmp", "codex-export-guard");
  fs.mkdirSync(outDir, { recursive: true });

  const bundle = exportCodexBundle(root, outDir, {
    generatedAt: "2026-03-13T00:00:00.000Z",
    sourceCommit: "test-commit"
  });

  ["manifest.json", "items.json", "skills.json", "worlds.json", "enemies.json"].forEach((filename) => {
    assert(fs.existsSync(path.join(outDir, filename)), `${filename} was not written`);
  });

  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
  const items = JSON.parse(fs.readFileSync(path.join(outDir, "items.json"), "utf8"));
  const skills = JSON.parse(fs.readFileSync(path.join(outDir, "skills.json"), "utf8"));
  const worlds = JSON.parse(fs.readFileSync(path.join(outDir, "worlds.json"), "utf8"));
  const enemies = JSON.parse(fs.readFileSync(path.join(outDir, "enemies.json"), "utf8"));

  assert(manifest.schemaVersion === CODEX_EXPORT_SCHEMA_VERSION, "codex export schema version mismatch");
  assert(manifest.generatedAt === "2026-03-13T00:00:00.000Z", "codex export generatedAt mismatch");
  assert(manifest.sourceCommit === "test-commit", "codex export sourceCommit mismatch");
  assert(manifest.counts.items === items.length, "codex export items count mismatch");
  assert(manifest.counts.skills === skills.length, "codex export skills count mismatch");
  assert(manifest.counts.worlds === worlds.length, "codex export worlds count mismatch");
  assert(manifest.counts.enemies === enemies.length, "codex export enemies count mismatch");
  assert(manifest.routes.enemy === "/osrs-clone-codex/enemies/:enemyId", "codex export enemy route mismatch");
  assert(manifest.files.enemies === "enemies.json", "codex export enemy file mismatch");

  const itemById = new Map(items.map((entry) => [entry.itemId, entry]));
  const worldById = new Map(worlds.map((entry) => [entry.worldId, entry]));
  const enemyById = new Map(enemies.map((entry) => [entry.enemyId, entry]));

  const wolf = enemyById.get("enemy_wolf");
  assert(wolf, "wolf enemy should be exported");
  assert(Array.isArray(wolf.relatedItemIds) && wolf.relatedItemIds.includes("raw_wolf_meat") && wolf.relatedItemIds.includes("wolf_fang"), "wolf enemy should link to its drop items");
  assert(Array.isArray(wolf.relatedWorldIds) && wolf.relatedWorldIds.length === 1 && wolf.relatedWorldIds[0] === "main_overworld", "wolf enemy should link only to main_overworld");

  const wolfFang = itemById.get("wolf_fang");
  assert(wolfFang && Array.isArray(wolfFang.relatedEnemyIds) && wolfFang.relatedEnemyIds.includes("enemy_wolf"), "wolf fang should link back to wolves");
  assert(Array.isArray(wolfFang.relatedWorldIds) && wolfFang.relatedWorldIds.length === 1 && wolfFang.relatedWorldIds[0] === "main_overworld", "wolf fang should surface only main-overworld authored presence");

  const mainOverworld = worldById.get("main_overworld");
  assert(mainOverworld && Array.isArray(mainOverworld.relatedEnemyIds) && mainOverworld.relatedEnemyIds.includes("enemy_wolf"), "main_overworld should expose authored enemy presence");

  const duplicateIdBundle = cloneJson(bundle);
  duplicateIdBundle.items[1].itemId = duplicateIdBundle.items[0].itemId;
  expectFailure(() => validateCodexExportBundle(duplicateIdBundle), /duplicate item id/i, "duplicate item id guard");

  const duplicateSlugBundle = cloneJson(bundle);
  duplicateSlugBundle.skills[1].slug = duplicateSlugBundle.skills[0].slug;
  expectFailure(() => validateCodexExportBundle(duplicateSlugBundle), /duplicate skill slug/i, "duplicate skill slug guard");

  const missingLinkBundle = cloneJson(bundle);
  missingLinkBundle.skills[0].relatedItemIds = missingLinkBundle.skills[0].relatedItemIds.concat(["missing_item"]);
  expectFailure(() => validateCodexExportBundle(missingLinkBundle), /unknown item/i, "missing linked entity guard");

  const missingEnemyItemLinkBundle = cloneJson(bundle);
  missingEnemyItemLinkBundle.enemies[0].relatedItemIds = missingEnemyItemLinkBundle.enemies[0].relatedItemIds.concat(["missing_item"]);
  expectFailure(() => validateCodexExportBundle(missingEnemyItemLinkBundle), /unknown item/i, "missing enemy item link guard");

  const missingEnemyWorldLinkBundle = cloneJson(bundle);
  missingEnemyWorldLinkBundle.enemies[0].relatedWorldIds = missingEnemyWorldLinkBundle.enemies[0].relatedWorldIds.concat(["missing_world"]);
  expectFailure(() => validateCodexExportBundle(missingEnemyWorldLinkBundle), /unknown world/i, "missing enemy world link guard");

  const missingItemEnemyLinkBundle = cloneJson(bundle);
  missingItemEnemyLinkBundle.items[0].relatedEnemyIds = missingItemEnemyLinkBundle.items[0].relatedEnemyIds.concat(["missing_enemy"]);
  expectFailure(() => validateCodexExportBundle(missingItemEnemyLinkBundle), /unknown enemy/i, "missing item enemy link guard");

  const missingWorldEnemyLinkBundle = cloneJson(bundle);
  missingWorldEnemyLinkBundle.worlds[0].relatedEnemyIds = missingWorldEnemyLinkBundle.worlds[0].relatedEnemyIds.concat(["missing_enemy"]);
  expectFailure(() => validateCodexExportBundle(missingWorldEnemyLinkBundle), /unknown enemy/i, "missing world enemy link guard");

  const invalidWorldRefBundle = cloneJson(bundle);
  const travelService = invalidWorldRefBundle.worlds[0].data.services.find((service) => service && service.travelToWorldId);
  assert(!!travelService, "expected a travel service for invalid world reference guard");
  travelService.travelToWorldId = "missing_world";
  expectFailure(() => validateCodexExportBundle(invalidWorldRefBundle), /references unknown world/i, "invalid world reference guard");

  console.log(`Codex export guard passed (${bundle.items.length} items, ${bundle.skills.length} skills, ${bundle.worlds.length} worlds, ${bundle.enemies.length} enemies).`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
