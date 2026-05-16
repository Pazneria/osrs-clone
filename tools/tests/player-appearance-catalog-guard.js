const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const catalogPath = path.join(root, "src/js/content/player-appearance-catalog.js");

  assert(fs.existsSync(catalogPath), "player appearance catalog file missing");

  const indexHtml = readRepoFile(root, "index.html");
  const playerModelScript = readRepoFile(root, "src/js/player-model.js");
  const playerModelVisualRuntimeScript = readRepoFile(root, "src/js/player-model-visual-runtime.js");
  const playerHeldItemRuntimeScript = readRepoFile(root, "src/js/player-held-item-runtime.js");
  const catalogScript = readRepoFile(root, "src/js/content/player-appearance-catalog.js");
  const legacyManifest = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const catalogSandbox = { window: {}, Math, Number, Object, String, Array, parseInt };
  vm.runInNewContext(catalogScript, catalogSandbox, { filename: catalogPath });
  const catalog = catalogSandbox.window.PlayerAppearanceCatalog;

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
  assert(catalogScript.includes("creatorSlotOrder"), "player appearance catalog should define creator slot order");
  assert(catalogScript.includes("creatorSlots"), "player appearance catalog should define creator slot metadata");
  assert(catalogScript.includes("creatorDefaults"), "player appearance catalog should define shared creator defaults");
  assert(catalogScript.includes("creatorKitDefs"), "player appearance catalog should define creator kit fragments");
  assert(catalogScript.includes("bodyColorLabels"), "player appearance catalog should define creator color labels");
  assert(catalogScript.includes("kit_head_male"), "player appearance catalog should define base kits");
  assert(catalogScript.includes("iron_pickaxe"), "player appearance catalog should define item fragments");
  assert(catalogScript.includes("small_net"), "player appearance catalog should define fishing-net held fragments");
  assert(catalogScript.includes("harpoon"), "player appearance catalog should define harpoon held fragments");
  assert(catalogScript.includes("rune_harpoon"), "player appearance catalog should define rune-harpoon held fragments");
  assert(catalogScript.includes("knife"), "player appearance catalog should define knife held fragments");
  assert(catalogScript.includes("oak_logs"), "player appearance catalog should define log-bundle held fragments");
  assert(catalogScript.includes("yew_logs"), "player appearance catalog should define high-tier log-bundle held fragments");
  assert(catalogScript.includes("normal_shortbow"), "player appearance catalog should define starter bow held fragments");
  assert(catalogScript.includes("yew_longbow"), "player appearance catalog should define high-tier bow held fragments");
  assert(catalogScript.includes("bronze_arrows"), "player appearance catalog should define starter arrow quiver fragments");
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
  assert(catalogScript.includes("ARMOR_TIER_STYLE_PROFILES"), "player appearance catalog should define tier style profiles for metal armor");
  assert(catalog, "player appearance catalog should execute in isolation");
  assert(catalog.bodyColorLabels.join(",") === "Hair,Top,Bottom,Footwear,Skin", "creator color labels should match the entry UI contract");
  assert(catalog.bodyColorPalettes.length === 5, "creator color palettes should cover every body color row");
  assert(catalog.bodyColorPalettes.every((palette) => Array.isArray(palette) && palette.length === 8), "each creator color row should expose eight colors");
  assert(
    catalog.bodyColorPalettes.every((palette) => palette.join(",") === catalog.bodyColorPalettes[0].join(",")),
    "creator color rows should share the same colors in the same order"
  );
  assert(catalog.slotOrder[catalog.slotOrder.length - 1] === "ammo", "ammo should be appended to the appearance slot order");
  [
    "normal_shortbow",
    "normal_longbow",
    "oak_shortbow",
    "oak_longbow",
    "willow_shortbow",
    "willow_longbow",
    "maple_shortbow",
    "maple_longbow",
    "yew_shortbow",
    "yew_longbow"
  ].forEach((itemId) => {
    const itemDef = catalog.itemDefs[itemId];
    assert(itemDef && itemDef.slot === "weapon", `${itemId} should be available as a weapon appearance item`);
    assert(
      Array.isArray(itemDef.fragments) && itemDef.fragments.some((fragment) => fragment.target === "axe" && fragment.shape === "pixelExtrude"),
      `${itemId} should render a right-hand pixel-extruded bow`
    );
  });
  [
    "bronze_arrows",
    "iron_arrows",
    "steel_arrows",
    "mithril_arrows",
    "adamant_arrows",
    "rune_arrows"
  ].forEach((itemId) => {
    const itemDef = catalog.itemDefs[itemId];
    assert(itemDef && itemDef.slot === "ammo", `${itemId} should be available as an ammo appearance item`);
    assert(
      Array.isArray(itemDef.fragments) && itemDef.fragments.some((fragment) => fragment.target === "torso" && fragment.shape === "cylinder"),
      `${itemId} should render a torso-mounted quiver`
    );
    assert(
      itemDef.fragments.some((fragment) => fragment.target === "torso" && Array.isArray(fragment.offset) && fragment.offset[2] <= -0.2),
      `${itemId} quiver should sit behind the torso far enough to avoid back clipping`
    );
    assert(
      itemDef.fragments.some((fragment) => fragment.target === "torso" && fragment.shape === "cone"),
      `${itemId} should render visible arrow tips`
    );
  });
  const armorTiers = ["bronze", "iron", "steel", "mithril", "adamant", "rune"];
  const armorSlots = {
    boots: { slot: "feet", targets: ["leftLowerLeg", "rightLowerLeg"] },
    helmet: { slot: "head", targets: ["head"] },
    shield: { slot: "shield", targets: ["leftTool"] },
    platelegs: { slot: "legs", targets: ["leftLeg", "rightLeg", "leftLowerLeg", "rightLowerLeg", "torso"] },
    platebody: { slot: "body", targets: ["torso", "leftArm", "rightArm", "leftLowerArm", "rightLowerArm"] }
  };
  const geometrySignatureBySlot = {};
  function numericTriplet(values) {
    return Array.isArray(values)
      ? values.slice(0, 3).map((value) => Number(value || 0).toFixed(3)).join(",")
      : "0.000,0.000,0.000";
  }
  function fragmentGeometrySignature(fragments) {
    return fragments.map((fragment) => [
      fragment.target,
      fragment.shape,
      numericTriplet(fragment.size),
      numericTriplet(fragment.offset),
      numericTriplet(fragment.rotation)
    ].join("/")).join("|");
  }
  Object.keys(armorSlots).forEach((suffix) => {
    geometrySignatureBySlot[suffix] = new Set();
    armorTiers.forEach((tier) => {
      const itemId = `${tier}_${suffix}`;
      const itemDef = catalog.itemDefs[itemId];
      assert(itemDef && itemDef.slot === armorSlots[suffix].slot, `${itemId} should expose the correct equipment slot`);
      assert(Array.isArray(itemDef.maleFragments) && itemDef.maleFragments.length > 0, `${itemId} should expose male armor fragments`);
      assert(Array.isArray(itemDef.femaleFragments) && itemDef.femaleFragments.length > 0, `${itemId} should expose female armor fragments`);
      armorSlots[suffix].targets.forEach((target) => {
        assert(itemDef.maleFragments.some((fragment) => fragment.target === target), `${itemId} should render ${target} armor fragments`);
      });
      geometrySignatureBySlot[suffix].add(fragmentGeometrySignature(itemDef.maleFragments));
    });
    assert(geometrySignatureBySlot[suffix].size >= 3, `${suffix} armor should have tier-shaped geometry, not only recolors`);
  });
  assert(catalog.creatorSlotOrder.join(",") === "hairStyle,faceStyle,facialHair,bodyStyle,legStyle,feetStyle", "creator slots should stay in OSRS selector order");
  assert(catalog.creatorDefaults.hairStyle === "short" && catalog.creatorDefaults.bodyStyle === "plain_tunic", "creator defaults should be shared starter selections");
  assert(catalog.creatorSlots.hairStyle.options.map((option) => option.id).join(",") === "bald,short,swept,long", "creator hair options should match the starter catalog");
  assert(catalog.creatorSlots.faceStyle.options.map((option) => option.id).join(",") === "plain,soft,angular,strong-brow", "creator face options should match the starter catalog");
  assert(catalog.creatorSlots.facialHair.options.map((option) => option.id).join(",") === "clean,stubble,moustache,short_beard", "creator facial hair options should match the starter catalog");
  assert(catalog.creatorSlots.bodyStyle.options.map((option) => option.id).join(",") === "plain_tunic,shirt_vest,striped_shirt,work_apron", "creator top options should match the starter catalog");
  assert(catalog.creatorSlots.legStyle.options.map((option) => option.id).join(",") === "trousers,rolled_trousers,skirt,wrapped_legs", "creator bottom options should match the starter catalog");
  assert(catalog.creatorSlots.feetStyle.options.map((option) => option.id).join(",") === "shoes,work_boots,sandals", "creator footwear options should match the starter catalog");
  catalog.creatorSlotOrder.forEach((slotName) => {
    const slot = catalog.creatorSlots[slotName];
    assert(slot && Array.isArray(slot.options) && slot.options.length > 0, `creator slot ${slotName} should expose selectable options`);
    slot.options.forEach((option) => {
      assert(option.kitId && catalog.creatorKitDefs[option.kitId], `creator option ${option.id} should point at a kit def`);
      assert(Array.isArray(catalog.creatorKitDefs[option.kitId].maleFragments), `creator kit ${option.kitId} should support male fragments`);
      assert(Array.isArray(catalog.creatorKitDefs[option.kitId].femaleFragments), `creator kit ${option.kitId} should support female fragments`);
    });
  });
  assert(catalog.creatorKitDefs.creator_body_plain_tunic.maleFragments.length > 0, "creator top kits should contain male starter fragments");
  assert(catalog.creatorKitDefs.creator_body_plain_tunic.femaleFragments.length > 0, "creator top kits should contain female starter fragments");
  assert(
    catalog.creatorKitDefs.creator_hair_long.maleFragments.some((fragment) => fragment.size && fragment.size[0] > 0.3 && fragment.size[1] > 0.3),
    "creator long hair should include a continuous back panel instead of only disconnected strips"
  );
  assert(
    catalog.creatorKitDefs.creator_feet_work_boots.maleFragments.some((fragment) => fragment.shape === "cylinder"),
    "creator work boots should include a rounded toe cap fragment"
  );

  assert(
    playerModelScript.includes("window.PlayerAppearanceCatalog"),
    "player model should load appearance data from PlayerAppearanceCatalog"
  );
  assert(
    playerModelVisualRuntimeScript.includes("window.PlayerModelVisualRuntime"),
    "player model visual runtime should expose shared visual mesh helpers"
  );
  assert(
    playerModelScript.includes("PlayerModelVisualRuntime"),
    "player model should delegate visual mesh construction through the visual runtime"
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
    playerModelScript.includes("function hasBaseToolVisual"),
    "player model should keep a template-time base tool visibility helper"
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
    playerModelScript.includes("creatorSelections") &&
      playerModelScript.includes("function collectCreatorFragmentGroups") &&
      playerModelScript.includes("function isCreatorSlotSuppressedByEquipment"),
    "player model should compose creator selections and suppress them when gear overrides the same visual slots"
  );
  assert(
    playerModelScript.includes("window.createPlayerRigFromAppearance = createPlayerRigFromAppearance"),
    "player model should expose a creator preview rig builder"
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
