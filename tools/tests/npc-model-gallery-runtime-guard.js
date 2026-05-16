const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const runtimeSource = read("src/js/npc-model-gallery-runtime.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");
const playerManifestSource = read("src/game/platform/legacy-scripts/player.ts");
const qaCommandSource = read("src/js/qa-command-runtime.js");
const coreSource = read("src/js/core.js");
const packageSuiteManifestSource = read("tools/tests/package-suite-manifest.js");
const npcCatalogSource = read("src/js/content/npc-appearance-catalog.js");
const combatContentSource = read("src/game/combat/content.ts");
const mainOverworld = JSON.parse(read("content/world/regions/main_overworld.json"));

assert(runtimeSource.includes("function collectNpcModelGalleryEntries"), "NPC gallery runtime should expose entry collection");
assert(runtimeSource.includes("function renderEntryThumbnails"), "NPC gallery runtime should render model thumbnails");
assert(runtimeSource.includes("WorldBootstrapRuntime"), "NPC gallery runtime should read authored world NPCs from the world runtime");
assert(runtimeSource.includes("CombatRuntime"), "NPC gallery runtime should read combat enemy definitions from the combat runtime");
assert(runtimeSource.includes("function getWorldNpcModelKey(entry)"), "NPC gallery should dedupe repeated world NPC model appearances");
assert(runtimeSource.includes("resolveEnemyModelPresetId: (type)"), "NPC gallery should pass enemy humanoid preset ids into thumbnail rendering");
assert(runtimeSource.includes("createHumanoidModel: typeof windowRef.createHumanoidModel === 'function'"), "NPC gallery should pass the humanoid fallback builder into enemy thumbnails");
assert(runtimeSource.includes("old_generic") && runtimeSource.includes("old_preset") && runtimeSource.includes("placeholder"), "NPC gallery should label old and placeholder model statuses");
assert(runtimeSource.includes("data-gallery-filter"), "NPC gallery should expose at-a-glance status/source filtering");
assert(runtimeSource.includes("openNpcModelGallery"), "NPC gallery runtime should publish a window opener");

assert(playerManifestSource.includes("npcModelGalleryRuntimeScript"), "player legacy scripts should import the NPC gallery runtime");
assert(playerManifestSource.includes('"npc-model-gallery-runtime"'), "player legacy scripts should register the NPC gallery runtime");
assert(manifestSource.includes('../../js/npc-model-gallery-runtime.js?raw'), "legacy script manifest should load the NPC gallery runtime");
assert(
  manifestSource.indexOf('id: "player-model"') < manifestSource.indexOf('id: "npc-model-gallery-runtime"')
    && manifestSource.indexOf('id: "npc-model-gallery-runtime"') < manifestSource.indexOf('id: "world"'),
  "NPC gallery runtime should load after player model hooks and before world startup consumers"
);
assert(qaCommandSource.includes("/qa npcgallery"), "QA help should include the NPC gallery command");
assert(qaCommandSource.includes("cmd === 'npcgallery'"), "QA commands should open the NPC gallery");
assert(coreSource.includes("function qaOpenNpcModelGallery()"), "core should own the QA gallery open hook");
assert(packageSuiteManifestSource.includes("src/js/npc-model-gallery-runtime.js"), "package suite should syntax-check the NPC gallery runtime");
assert(packageSuiteManifestSource.includes("tools/tests/npc-model-gallery-runtime-guard.js"), "package suite should run the NPC gallery guard");
["enemy_training_dummy", "enemy_goblin_grunt", "enemy_guard", "enemy_heavy_brute", "enemy_fast_striker"].forEach((presetId) => {
  assert(npcCatalogSource.includes(`${presetId}:`), `${presetId} should have a catalog model preset`);
  assert(combatContentSource.includes(`modelPresetId: "${presetId}"`), `${presetId} should be wired as a combat modelPresetId`);
});

const mainOverworldMerchants = (mainOverworld.services || []).filter((service) => service && service.type === "MERCHANT");
assert(mainOverworldMerchants.length > 0, "main overworld should expose merchant NPCs for gallery review");
mainOverworldMerchants.forEach((service) => {
  const appearanceId = typeof service.appearanceId === "string" ? service.appearanceId.trim() : "";
  assert(appearanceId, `${service.serviceId} should declare a catalog appearanceId for the NPC gallery`);
  assert(
    appearanceId === "tanner_rusk" || npcCatalogSource.includes(`${appearanceId}:`),
    `${service.serviceId} appearanceId ${appearanceId} should resolve to a catalog preset or known runtime preset`
  );
});

const fakeWindow = {
  addEventListener() {},
  WorldBootstrapRuntime: {
    listWorldIds: () => ["main_overworld", "tutorial_island"],
    getWorldManifestEntry: (worldId) => ({ worldId, label: worldId === "tutorial_island" ? "Tutorial Island" : "Main Overworld" }),
    getWorldDefinition: (worldId) => ({
      worldId,
      services: worldId === "tutorial_island"
        ? [
            {
              serviceId: "merchant:tutorial_guide",
              spawnId: "npc:tutorial_guide",
              type: "MERCHANT",
              name: "Tutorial Guide",
              npcType: 3,
              appearanceId: "tutorial_guide"
            }
          ]
        : [
            {
              serviceId: "merchant:generic_shop",
              spawnId: "npc:generic_shop",
              type: "MERCHANT",
              name: "Generic Shopkeeper",
              npcType: 2
            },
            {
              serviceId: "bank:east_outpost",
              spawnId: "npc:banker_east_outpost",
              type: "MERCHANT",
              name: "Banker",
              npcType: 2,
              appearanceId: "mainland_banker"
            },
            {
              serviceId: "bank:market_crossing",
              spawnId: "npc:banker_market_crossing",
              type: "MERCHANT",
              name: "Banker",
              npcType: 2,
              appearanceId: "mainland_banker"
            }
          ]
    })
  },
  CombatRuntime: {
    listEnemyTypes: () => [
      { enemyId: "enemy_rat", displayName: "Rat", appearance: { kind: "rat" } },
      { enemyId: "enemy_chicken", displayName: "Chicken", appearance: { kind: "chicken" } },
      { enemyId: "enemy_boar", displayName: "Boar", appearance: { kind: "boar" } },
      { enemyId: "enemy_wolf", displayName: "Wolf", appearance: { kind: "wolf" } },
      { enemyId: "enemy_bear", displayName: "Bear", appearance: { kind: "bear" } },
      { enemyId: "enemy_goblin_grunt", displayName: "Goblin Grunt", appearance: { kind: "humanoid", npcType: 3, modelPresetId: "enemy_goblin_grunt" } },
      { enemyId: "enemy_heavy_brute", displayName: "Heavy Brute", appearance: { kind: "humanoid", npcType: 1, modelPresetId: "enemy_heavy_brute" } },
      { enemyId: "enemy_legacy_preset", displayName: "Legacy Preset", appearance: { kind: "humanoid", npcType: 2, modelPresetId: "guard" } },
      { enemyId: "enemy_legacy_generic", displayName: "Legacy Generic", appearance: { kind: "humanoid", npcType: 1 } }
    ],
    getWorldCombatSpawnNodes: () => []
  }
};

const sandbox = {
  window: fakeWindow,
  console
};
vm.runInNewContext(runtimeSource, sandbox, { filename: "npc-model-gallery-runtime.js" });

const runtime = sandbox.window.NpcModelGalleryRuntime;
assert(runtime, "NPC gallery runtime should publish a window API");
const entries = runtime.collectNpcModelGalleryEntries({ windowRef: fakeWindow });
const bySubtitle = new Map(entries.map((entry) => [entry.subtitle, entry]));
const byEnemy = new Map(entries.filter((entry) => entry.enemyId).map((entry) => [entry.enemyId, entry]));
const bankers = entries.filter((entry) => entry.displayName === "Banker");

assert(bySubtitle.get("merchant:generic_shop").statusId === "old_generic", "generic mainland service NPCs should be labeled old generic");
assert(bankers.length === 1, "repeated banker services should collapse into one model-gallery card");
assert(bankers[0].placementCount === 2, "deduped banker card should retain placement count");
assert(bySubtitle.get("merchant:tutorial_guide").statusId === "catalog", "appearanceId NPCs should be labeled catalog");
assert(byEnemy.get("enemy_rat").statusId === "bespoke", "rebuilt rats should be labeled bespoke");
assert(byEnemy.get("enemy_chicken").statusId === "bespoke", "rebuilt chickens should be labeled bespoke");
assert(byEnemy.get("enemy_boar").statusId === "bespoke", "rebuilt boars should be labeled bespoke");
assert(byEnemy.get("enemy_wolf").statusId === "bespoke", "rebuilt wolves should be labeled bespoke");
assert(byEnemy.get("enemy_bear").statusId === "bespoke", "rebuilt bears should be labeled bespoke");
assert(byEnemy.get("enemy_goblin_grunt").statusId === "catalog", "catalog-backed goblins should be labeled catalog");
assert(byEnemy.get("enemy_heavy_brute").statusId === "catalog", "catalog-backed brutes should be labeled catalog");
assert(byEnemy.get("enemy_legacy_preset").statusId === "old_preset", "unknown humanoid presets should still be labeled old preset");
assert(byEnemy.get("enemy_legacy_generic").statusId === "old_generic", "generic humanoid enemies should be labeled old generic");

const summary = runtime.summarizeEntries(entries);
assert(summary.total === entries.length, "gallery summary should count every entry");
assert(summary.old >= 3, "gallery summary should count old generic and legacy entries");

console.log("NPC model gallery runtime guard passed.");
