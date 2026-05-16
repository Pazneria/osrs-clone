const assert = require("assert");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const {
  createStampDraft,
  loadWorkbench,
  validateWorkbench,
  writePreview,
  writePromotionDryRun
} = require("../content/building-workbench");
const { readJsonFile } = require("../lib/json-file-utils");
const { readRepoFile } = require("./repo-file-test-utils");

const root = path.resolve(__dirname, "..", "..");

function listCanonicalStampFiles() {
  return fs.readdirSync(path.join(root, "content", "world", "stamps"))
    .filter((name) => name.endsWith(".json"))
    .sort();
}

function run() {
  const beforeStampFiles = listCanonicalStampFiles();
  const beforeManifest = readRepoFile(root, "content/world/manifest.json");
  const beforeMainOverworldRegion = readRepoFile(root, "content/world/regions/main_overworld.json");
  const workbench = loadWorkbench(root);
  const validation = validateWorkbench(workbench);
  assert(validation.archetypeCount >= 5, "workbench should seed building archetypes");
  assert(validation.materialCount >= 5, "workbench should seed material profiles");
  assert(validation.conditionCount >= 5, "workbench should seed condition states");
  assert(validation.roadProfileCount >= 2, "workbench should seed road profiles");
  assert(validation.themeCount >= 3, "workbench should seed multiple visual themes");
  assert(validation.buildingCount >= 8, "workbench should seed multiple reusable buildings");
  assert(validation.settlementCount >= 3, "workbench should include multiple settlement drafts");

  const themeIds = new Set(workbench.themes.map((entry) => entry.spec.themeId));
  assert(themeIds.has("frontier_timber"), "frontier timber theme missing");
  assert(themeIds.has("quarry_iron"), "quarry iron theme missing");
  assert(themeIds.has("stone_market"), "stone market theme missing");
  const themeById = new Map(workbench.themes.map((entry) => [entry.spec.themeId, entry.spec]));
  assert(themeById.get("frontier_timber").decorKinds.includes("thatch_bundle"), "frontier timber theme should include thatch bundle decor");
  assert(themeById.get("quarry_iron").decorKinds.includes("quarry_cart"), "quarry iron theme should include quarry cart decor");
  assert(themeById.get("stone_market").decorKinds.includes("wall_painting"), "stone market theme should include wall painting decor");
  const archetypeIds = new Set(workbench.archetypes.map((entry) => entry.spec.archetypeId));
  assert(archetypeIds.has("bank"), "bank archetype missing");
  assert(archetypeIds.has("mansion"), "mansion archetype missing");
  assert(archetypeIds.has("castle_gatehouse"), "castle gatehouse archetype missing");
  const conditionIds = new Set(workbench.conditions.map((entry) => entry.spec.conditionId));
  assert(conditionIds.has("burnt"), "burnt condition missing");
  assert(conditionIds.has("broken"), "broken condition missing");
  const materialIds = new Set(workbench.materials.map((entry) => entry.spec.materialProfileId));
  assert(materialIds.has("timber_thatch"), "timber/thatch material missing");
  assert(materialIds.has("castle_granite_slate"), "castle material missing");
  assert(materialIds.has("burnt_timber_ash"), "burnt timber material missing");

  workbench.buildings.forEach((entry) => {
    const stamp = createStampDraft(entry.spec);
    assert(entry.spec.archetypeId, `${entry.spec.buildingId} should declare an archetype`);
    assert(entry.spec.materialProfileId, `${entry.spec.buildingId} should declare a material profile`);
    assert(entry.spec.conditionId, `${entry.spec.buildingId} should declare a condition`);
    assert(stamp.stampId.startsWith("bw_"), `${entry.spec.buildingId} draft stamp should use bw_ prefix`);
    assert(Array.isArray(stamp.rows) && stamp.rows.length > 0, `${entry.spec.buildingId} should compile to stamp rows`);
    assert(entry.spec.wallArt && entry.spec.wallArt.length > 0, `${entry.spec.buildingId} should carry wall-art intent for future decor promotion`);
  });
  const buildingById = new Map(workbench.buildings.map((entry) => [entry.spec.buildingId, entry.spec]));
  assert(
    buildingById.get("frontier_bank").decor.some((entry) => entry.kind === "bank_sign"),
    "frontier bank should preview bank-specific signage decor"
  );
  assert(
    buildingById.get("painted_gallery").decor.some((entry) => entry.kind === "shop_sign")
      && buildingById.get("painted_gallery").decor.some((entry) => entry.kind === "market_awning")
      && buildingById.get("painted_gallery").decor.some((entry) => entry.kind === "wall_painting"),
    "painted gallery should preview shopfront, awning, and painting decor"
  );
  assert(
    buildingById.get("castle_gatehouse").decor.some((entry) => entry.kind === "castle_banner"),
    "castle gatehouse should preview castle banner decor"
  );
  assert(
    buildingById.get("burnt_cottage").decor.some((entry) => entry.kind === "rubble_pile"),
    "burnt cottage should preview burnt rubble decor"
  );
  assert(
    buildingById.get("quarry_storehouse").decor.some((entry) => entry.kind === "quarry_cart"),
    "quarry storehouse should preview quarry cart decor"
  );

  const settlement = workbench.settlements.find((entry) => entry.spec.settlementId === "south_quarry_hamlet");
  assert(settlement, "south_quarry_hamlet draft missing");
  assert(settlement.spec.placementMode === "preview_only", "settlement drafts should stay preview-only");
  assert(settlement.spec.themeMix.length >= 2, "hamlet should mix visual themes");
  assert(
    settlement.spec.promotionChecklist.some((item) => item.includes("shared stamps")),
    "settlement checklist should push shared stamps over one-off clutter"
  );
  const oldRoadhold = workbench.settlements.find((entry) => entry.spec.settlementId === "old_roadhold");
  assert(oldRoadhold, "old_roadhold draft missing");
  assert(
    oldRoadhold.spec.placements.some((placement) => placement.buildingId === "burnt_cottage"),
    "old_roadhold should preview burnt building conditions"
  );
  assert(
    oldRoadhold.spec.placements.some((placement) => placement.buildingId === "castle_gatehouse"),
    "old_roadhold should preview castle gatehouse archetype"
  );
  workbench.settlements.forEach((entry) => {
    (entry.spec.roads || []).forEach((road) => {
      assert(road.roadProfileId, `${entry.spec.settlementId} road ${road.pathId} should declare a road profile`);
    });
  });

  const outDir = path.join(root, "tmp", "building-workbench-guard");
  const result = writePreview(workbench, outDir);
  assert(result.validation.buildingCount === validation.buildingCount, "preview should validate the same building count");
  assert(fs.existsSync(path.join(outDir, "README.md")), "preview README missing");
  const promotionPlanPath = path.join(outDir, "PROMOTION_PLAN.md");
  assert(fs.existsSync(promotionPlanPath), "promotion plan missing");
  const promotionPlan = fs.readFileSync(promotionPlanPath, "utf8");
  assert(promotionPlan.includes("content/world/stamps"), "promotion plan should call out stamp promotion");
  assert(promotionPlan.includes("tool:world:validate"), "promotion plan should require canonical world validation");
  const htmlPreviewPath = path.join(outDir, "index.html");
  assert(fs.existsSync(htmlPreviewPath), "HTML preview missing");
  const htmlPreview = fs.readFileSync(htmlPreviewPath, "utf8");
  assert(htmlPreview.includes("Building Workbench"), "HTML preview should identify the workbench");
  assert(htmlPreview.includes("workbench-three-canvas"), "HTML preview should include the Three.js canvas");
  assert(htmlPreview.includes("workbench-preview.mjs"), "HTML preview should load the generated Three.js module");
  assert(htmlPreview.includes("three-render-status"), "HTML preview should expose Three.js render status");
  assert(htmlPreview.includes("toggle-roofs"), "HTML preview should expose roof visibility controls");
  assert(htmlPreview.includes("grammarGrid"), "HTML preview should expose workbench grammar");
  assert(htmlPreview.includes("Burnt Cottage"), "HTML preview should include burnt building variants");
  assert(htmlPreview.includes("Castle Gatehouse"), "HTML preview should include castle building variants");
  assert(htmlPreview.includes("isoBuilding"), "HTML preview should include isometric building model surfaces");
  assert(htmlPreview.includes("roofFace"), "HTML preview should include roof massing");
  assert(htmlPreview.includes("glyphDetails"), "HTML preview should keep raw stamp glyphs available as secondary evidence");
  assert(htmlPreview.includes("settlementMap"), "HTML preview should include a settlement map surface");
  assert(htmlPreview.includes("placementModel"), "HTML preview should render settlement buildings as model placements");
  assert(htmlPreview.includes("bw_quarry_storehouse"), "HTML preview should include compiled stamp ids");
  const dataPath = path.join(outDir, "workbench-data.json");
  const modulePath = path.join(outDir, "workbench-preview.mjs");
  const vendorPath = path.join(outDir, "vendor", "three.module.js");
  const vendorCorePath = path.join(outDir, "vendor", "three.core.js");
  assert(fs.existsSync(dataPath), "Three.js preview data missing");
  assert(fs.existsSync(modulePath), "Three.js preview module missing");
  assert(fs.existsSync(vendorPath), "vendored Three.js module missing");
  assert(fs.existsSync(vendorCorePath), "vendored Three.js core module missing");
  const vendoredModule = fs.readFileSync(vendorPath, "utf8");
  const relativeImports = Array.from(vendoredModule.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g))
    .map((match) => match[1]);
  relativeImports.forEach((fileName) => {
    assert(
      fs.existsSync(path.join(outDir, "vendor", fileName)),
      `vendored Three.js dependency ${fileName} missing`
    );
  });
  const previewData = readJsonFile(dataPath);
  assert(previewData.archetypes.length === validation.archetypeCount, "Three.js preview data should carry archetypes");
  assert(previewData.materialProfiles.length === validation.materialCount, "Three.js preview data should carry material profiles");
  assert(previewData.conditions.length === validation.conditionCount, "Three.js preview data should carry condition states");
  assert(previewData.roadProfiles.length === validation.roadProfileCount, "Three.js preview data should carry road profiles");
  assert(previewData.buildings.length === validation.buildingCount, "Three.js preview data should carry building specs");
  assert(previewData.settlements.length === validation.settlementCount, "Three.js preview data should carry settlement specs");
  const moduleCheck = spawnSync(process.execPath, ["--check", modulePath], { cwd: root, encoding: "utf8" });
  assert.strictEqual(moduleCheck.status, 0, moduleCheck.stderr || moduleCheck.stdout || "Three.js preview module syntax check failed");
  assert(fs.existsSync(path.join(outDir, "compiled-stamps", "bw_quarry_storehouse.json")), "compiled quarry storehouse preview missing");
  assert(fs.existsSync(path.join(outDir, "settlements", "south_quarry_hamlet.md")), "settlement preview missing");

  const promotionOutDir = path.join(outDir, "promotion-dry-run");
  const promotionResult = writePromotionDryRun(workbench, "market_crossing", promotionOutDir);
  const promotionPath = path.join(promotionOutDir, "promotion-dry-run.json");
  const promotionMarkdownPath = path.join(promotionOutDir, "PROMOTION_DRY_RUN.md");
  assert(fs.existsSync(promotionPath), "promotion dry-run JSON missing");
  assert(fs.existsSync(promotionMarkdownPath), "promotion dry-run markdown missing");
  const promotion = readJsonFile(promotionPath);
  assert.strictEqual(promotionResult.draft.mode, "dry_run", "promotion helper should stay dry-run");
  assert.strictEqual(promotion.mode, "dry_run", "promotion artifact should stay dry-run");
  assert.strictEqual(promotion.canonicalFilesModified, false, "promotion dry-run should declare no canonical mutation");
  assert.strictEqual(promotion.targetFiles.manifest, "content/world/manifest.json", "promotion should target canonical manifest");
  assert.strictEqual(promotion.targetFiles.region, "content/world/regions/main_overworld.json", "promotion should target main_overworld region");
  const marketCrossing = workbench.settlements.find((entry) => entry.spec.settlementId === "market_crossing").spec;
  const uniqueMarketBuildings = new Set(marketCrossing.placements.map((placement) => placement.buildingId));
  assert.strictEqual(promotion.stampAdds.length, uniqueMarketBuildings.size, "promotion should add one stamp per unique placed building");
  assert(promotion.stampAdds.some((entry) => entry.stampId === "bw_frontier_bank"), "promotion should include frontier bank stamp");
  assert(
    promotion.manifestStampIdsToAdd.includes("bw_frontier_bank")
      || promotion.stampAdds.some((entry) => entry.stampId === "bw_frontier_bank" && entry.matchesCanonical === true),
    "promotion should register or recognize the promoted frontier bank stamp"
  );
  assert(
    promotion.regionStructuresToAdd.some((entry) => entry.structureId === "market_crossing_bank" && entry.canonicalStructure.stampId === "bw_frontier_bank"),
    "promotion should map bank placement to canonical structure"
  );
  assert(
    promotion.regionStructuresToAdd.some((entry) => (
      entry.structureId === "market_crossing_bank"
      && entry.canonicalStructure.materialProfileId === "timber_thatch"
      && entry.canonicalStructure.themeId === "frontier_timber"
      && entry.canonicalStructure.conditionId === "intact"
    )),
    "promotion should preserve building material/theme/condition metadata on canonical structures"
  );
  assert(
    promotion.terrainPathsToAdd.some((entry) => entry.pathId === "market_crossing_main_road" && entry.source.roadProfileId === "cart_road"),
    "promotion should carry road profile metadata"
  );
  promotion.terrainPathsToAdd.forEach((entry) => {
    assert.strictEqual(entry.canonicalPath.tileId, "DIRT", `${entry.pathId} should promote to DIRT road metadata`);
    assert(entry.canonicalPath.tags.includes("spawn-protected"), `${entry.pathId} should stay spawn protected`);
    assert(!entry.canonicalPath.tags.includes("settlement-draft"), `${entry.pathId} should not keep preview-only settlement-draft tag`);
  });
  assert(
    promotion.npcServiceHomeTags.some((entry) => (
      entry.serviceId === "bank:market_crossing"
      && entry.homeTag === "home:market_crossing_bank"
      && (entry.homeTargetStatus === "available_after_structure_add" || entry.homeTargetStatus === "existing")
    )),
    "promotion should translate NPC plan into valid home tags"
  );
  assert(promotion.decorPropsToAdd.length > 0, "promotion should include decor prop candidates");
  assert(promotion.staircaseLandmarksToAdd.length > 0, "promotion should include staircase landmark candidates");
  assert(promotion.roofLandmarksToAdd.length > 0, "promotion should include roof landmark candidates");
  assert(
    promotion.roofLandmarksToAdd.some((entry) => (
      entry.landmarkId === "market_crossing_bank_roof"
      && entry.canonicalRoof.materialProfileId === "timber_thatch"
      && entry.canonicalRoof.roofIntegrity === 1
    )),
    "promotion should preserve roof material and integrity metadata"
  );
  assert(promotion.wallArtIntents.length > 0, "promotion should preserve wall art intent");
  assert(promotion.warnings.some((entry) => entry.includes("Dry run only")), "promotion should warn that canonical files were not written");
  const promotionMarkdown = fs.readFileSync(promotionMarkdownPath, "utf8");
  assert(promotionMarkdown.includes("Road Paths"), "promotion markdown should summarize roads");
  assert(promotionMarkdown.includes("market_crossing_main_road"), "promotion markdown should mention market crossing road");
  assert(promotionMarkdown.includes("did not write canonical world files"), "promotion markdown should be clear about non-mutation");
  assert(fs.existsSync(path.join(promotionOutDir, "stamps", "bw_frontier_bank.json")), "promotion should emit copy-ready stamp candidate");

  const cliPromotionOutDir = path.join(outDir, "promotion-cli");
  const promoteCli = spawnSync(process.execPath, [
    "tools/content/building-workbench.js",
    "promote",
    "--settlement",
    "market_crossing",
    "--out",
    cliPromotionOutDir
  ], { cwd: root, encoding: "utf8" });
  assert.strictEqual(promoteCli.status, 0, promoteCli.stderr || promoteCli.stdout || "promotion CLI failed");
  assert(fs.existsSync(path.join(cliPromotionOutDir, "promotion-dry-run.json")), "promotion CLI should write dry-run JSON");

  const afterStampFiles = listCanonicalStampFiles();
  assert.deepStrictEqual(afterStampFiles, beforeStampFiles, "preview generation must not write canonical stamp files");
  assert.strictEqual(readRepoFile(root, "content/world/manifest.json"), beforeManifest, "workbench tools must not write canonical manifest");
  assert.strictEqual(readRepoFile(root, "content/world/regions/main_overworld.json"), beforeMainOverworldRegion, "workbench tools must not write canonical region");

  console.log("Building workbench guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
