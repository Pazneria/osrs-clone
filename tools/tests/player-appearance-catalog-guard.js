const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const indexPath = path.join(root, "index.html");
  const playerModelPath = path.join(root, "src/js/player-model.js");
  const catalogPath = path.join(root, "src/js/content/player-appearance-catalog.js");
  const legacyManifestPath = path.join(root, "src/game/platform/legacy-script-manifest.ts");

  assert(fs.existsSync(catalogPath), "player appearance catalog file missing");

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const playerModelScript = fs.readFileSync(playerModelPath, "utf8");
  const playerHeldItemRuntimeScript = fs.readFileSync(path.join(root, "src/js/player-held-item-runtime.js"), "utf8");
  const catalogScript = fs.readFileSync(catalogPath, "utf8");
  const legacyManifest = fs.readFileSync(legacyManifestPath, "utf8");

  assert(
    indexHtml.includes('/src/main.ts') && legacyManifest.includes("../../js/content/player-appearance-catalog.js?raw"),
    "platform shell should load the player appearance catalog through the legacy manifest"
  );

  assert(
    catalogScript.includes("window.PlayerAppearanceCatalog"),
    "player appearance catalog should expose window.PlayerAppearanceCatalog"
  );
  assert(catalogScript.includes("slotOrder"), "player appearance catalog should define slotOrder");
  assert(catalogScript.includes("bodyColorPalettes"), "player appearance catalog should define bodyColorPalettes");
  assert(catalogScript.includes("kit_head_male"), "player appearance catalog should define base kits");
  assert(catalogScript.includes("iron_pickaxe"), "player appearance catalog should define item fragments");
  assert(catalogScript.includes("small_net"), "player appearance catalog should define fishing-net held fragments");
  assert(catalogScript.includes("harpoon"), "player appearance catalog should define harpoon held fragments");
  assert(catalogScript.includes("rune_harpoon"), "player appearance catalog should define rune-harpoon held fragments");
  assert(catalogScript.includes("knife"), "player appearance catalog should define knife held fragments");
  assert(catalogScript.includes("oak_logs"), "player appearance catalog should define log-bundle held fragments");
  assert(catalogScript.includes("yew_logs"), "player appearance catalog should define high-tier log-bundle held fragments");
  assert(catalogScript.includes("bronze_helmet"), "player appearance catalog should define bronze helmet head fragments");
  assert(catalogScript.includes("rune_helmet"), "player appearance catalog should define rune helmet head fragments");
  assert(catalogScript.includes("bronze_shield"), "player appearance catalog should define bronze shield left-hand fragments");
  assert(catalogScript.includes("rune_shield"), "player appearance catalog should define rune shield left-hand fragments");
  assert(catalogScript.includes("bronze_platebody"), "player appearance catalog should define bronze platebody body fragments");
  assert(catalogScript.includes("rune_platebody"), "player appearance catalog should define rune platebody body fragments");
  assert(catalogScript.includes("bronze_platelegs"), "player appearance catalog should define bronze platelegs leg fragments");
  assert(catalogScript.includes("rune_platelegs"), "player appearance catalog should define rune platelegs leg fragments");
  assert(catalogScript.includes("bronze_boots"), "player appearance catalog should define bronze boots feet fragments");
  assert(catalogScript.includes("rune_boots"), "player appearance catalog should define rune boots feet fragments");

  assert(
    playerModelScript.includes("window.PlayerAppearanceCatalog"),
    "player model should load appearance data from PlayerAppearanceCatalog"
  );
  assert(
    playerHeldItemRuntimeScript.includes("SKILLING_TOOL_VISUAL_GROUP_NAME"),
    "player held-item runtime should isolate temporary skilling tool meshes from base equipped visuals"
  );
  assert(
    playerHeldItemRuntimeScript.includes("setBaseToolVisualVisibility"),
    "player held-item runtime should restore base equipped visuals when temporary skilling tools are cleared"
  );
  assert(
    playerModelScript.includes("PlayerHeldItemRuntime"),
    "player model should delegate temporary skilling tool visuals through the held-item runtime"
  );
  assert(
    !playerModelScript.includes("kit_head_male: { slot: 'head'"),
    "player model should not inline kit fragment tables"
  );
  assert(
    !playerModelScript.includes("const PICKAXE_BASE_FRAGMENTS = ["),
    "player model should not inline equipment fragment tables"
  );
  assert(
    playerModelScript.includes("PlayerAppearanceCatalog missing"),
    "player model should fail fast when catalog script is not loaded"
  );
  assert(
    playerModelScript.includes("femaleFragments") && playerModelScript.includes("maleFragments"),
    "player model should support gender-specific appearance fragments"
  );
  assert(
    !playerModelScript.includes("modelIds.every((id) => id === -1)"),
    "player model should not gate fragment-backed items on legacy model ids"
  );
  assert(
    playerModelScript.includes("nodes.leftTool.visible = hasBaseToolVisual(nodes.leftTool)"),
    "player model should restore left-hand base visuals for fragment-backed shields"
  );

  console.log("Player appearance catalog guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
