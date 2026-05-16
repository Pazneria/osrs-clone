const assert = require("assert");
const path = require("path");

const {
  WORLD_ID,
  buildMainOverworldSkillRuntimeDraft
} = require("../content/main-overworld-skill-runtime-draft");
const { loadTsModule } = require("../lib/ts-module-loader");

function sortedMerchantIds(entries) {
  return entries
    .map((entry) => String(entry.merchantId || "").trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const { materializeSkillWorldRuntime } = loadTsModule(path.join(root, "src", "game", "world", "freeze-runtime.ts"));
  const { logicalMap, draft } = buildMainOverworldSkillRuntimeDraft(root);
  const skillWorldArtifacts = materializeSkillWorldRuntime(draft);

  const miningIds = skillWorldArtifacts.miningRoutes.map((route) => route.routeId).join(",");
  const miningCounts = skillWorldArtifacts.miningRoutes.map((route) => route.count).join(",");
  assert(
    miningIds === "starter_mine,iron_mine,coal_mine,precious_mine,gem_mine,rune_essence_mine",
    "mining route IDs mismatch"
  );
  assert(miningCounts === "30,24,20,16,14,10", "mining route counts mismatch");

  const altarIds = skillWorldArtifacts.runecraftingRoutes.map((route) => route.routeId).join(",");
  const altarLabels = skillWorldArtifacts.runecraftingRoutes.map((route) => route.label).join(",");
  assert(altarIds === "ember_altar,water_altar,earth_altar,air_altar", "runecrafting route IDs mismatch");
  assert(altarLabels === "Ember Altar,Water Altar,Earth Altar,Air Altar", "runecrafting labels mismatch");
  assert(skillWorldArtifacts.runtimeMerchantServices.length === 2, "expected 2 dynamic runecrafting services");
  assert(
    skillWorldArtifacts.runtimeMerchantServices.map((service) => service.serviceId).join(",") === "merchant:rune_tutor,merchant:combination_sage",
    "runecrafting service IDs mismatch"
  );
  assert(
    skillWorldArtifacts.runtimeMerchantServices.map((service) => service.merchantId).join(",") === "rune_tutor,combination_sage",
    "runecrafting merchant IDs mismatch"
  );

  const woodcuttingIds = skillWorldArtifacts.woodcuttingRoutes.map((route) => route.routeId).join(",");
  const woodcuttingCounts = skillWorldArtifacts.woodcuttingRoutes.map((route) => route.count).join(",");
  assert(
    woodcuttingIds === "starter_grove,oak_path,willow_bend,maple_ridge,yew_frontier",
    "woodcutting route IDs mismatch"
  );
  assert(woodcuttingCounts === "26,20,16,12,8", "woodcutting route counts mismatch");

  const showcase = skillWorldArtifacts.showcasePlacements.map((tree) => `${tree.nodeId}@${tree.x},${tree.y}`).join("|");
  assert(
    showcase === "normal_tree@179,219|oak_tree@192,219|willow_tree@205,219|maple_tree@218,219|yew_tree@231,219",
    "showcase placements mismatch"
  );
  for (let i = 0; i < skillWorldArtifacts.showcasePlacements.length; i++) {
    const tree = skillWorldArtifacts.showcasePlacements[i];
    assert(logicalMap[0][tree.y][tree.x] === draft.tileIds.TREE, `showcase tree ${tree.nodeId} missing from logical map`);
  }

  const routeGroups = skillWorldArtifacts.publishedWorldState.routeGroups || {};
  assert((routeGroups.fishing || []).length === 3, "published fishing routes mismatch");
  assert((routeGroups.cooking || []).length === 4, "published cooking routes mismatch");
  assert((routeGroups.mining || []).length === 6, "published mining routes mismatch");
  assert((routeGroups.runecrafting || []).length === 4, "published runecrafting routes mismatch");
  assert((routeGroups.woodcutting || []).length === 5, "published woodcutting routes mismatch");
  assert((skillWorldArtifacts.publishedWorldState.runtimeServices || []).length === 2, "published runtime services mismatch");

  const expectedPublishedMerchantIds = [
    "advanced_fletcher",
    "advanced_woodsman",
    "borin_ironvein",
    "combination_sage",
    "crafting_teacher",
    "elira_gemhand",
    "fishing_supplier",
    "fishing_teacher",
    "fletching_supplier",
    "forester_teacher",
    "general_store",
    "tanner_rusk",
    "rune_tutor",
    "thrain_deepforge"
  ].sort().join(",");
  assert(
    sortedMerchantIds(skillWorldArtifacts.merchantNpcDescriptors) === expectedPublishedMerchantIds,
    "published merchant NPC IDs mismatch"
  );

  console.log(`Skill runtime parity checks passed for ${WORLD_ID}.`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
