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

  assert(
    playerModelScript.includes("window.PlayerAppearanceCatalog"),
    "player model should load appearance data from PlayerAppearanceCatalog"
  );
  assert(
    playerModelScript.includes("SKILLING_TOOL_VISUAL_GROUP_NAME"),
    "player model should isolate temporary skilling tool meshes from base equipped visuals"
  );
  assert(
    playerModelScript.includes("setBaseToolVisualVisibility"),
    "player model should restore base equipped visuals when temporary skilling tools are cleared"
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

  console.log("Player appearance catalog guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
