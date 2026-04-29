const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { loadTsModule } = require("../lib/ts-module-loader");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const sceneStateSource = fs.readFileSync(path.join(root, "src", "js", "world", "scene-state.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-bridge.ts"), "utf8");
  const legacyManifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const adapterSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-world-adapter.ts"), "utf8");
  const bootstrapSource = fs.readFileSync(path.join(root, "src", "game", "world", "bootstrap.ts"), "utf8");
  const placementsSource = fs.readFileSync(path.join(root, "src", "game", "world", "placements.ts"), "utf8");
  const cloneSource = fs.readFileSync(path.join(root, "src", "game", "world", "clone.ts"), "utf8");
  global.window = {};
  const { exposeLegacyBridge } = loadTsModule(path.join(root, "src", "game", "platform", "legacy-bridge.ts"));
  const { exposeLegacyWorldAdapter } = loadTsModule(path.join(root, "src", "game", "platform", "legacy-world-adapter.ts"));

  assert(adapterSource.includes("window.LegacyWorldAdapterRuntime"), "legacy world adapter should expose a window runtime");
  assert(adapterSource.includes("resolveTravelTarget"), "legacy world adapter should own travel resolution");
  assert(adapterSource.includes("activateWorldContext"), "legacy world adapter should own active-world activation");
  assert(adapterSource.includes("getQaWorldSummaries"), "legacy world adapter should own QA world summaries");
  assert(adapterSource.includes("resolveKnownWorldId(getCurrentWorldId(), MAIN_OVERWORLD_WORLD_ID)"), "QA world summaries should mark the real active world through the canonical main-overworld constant");
  assert(adapterSource.includes("getCurrentWorldPayload"), "legacy world adapter should expose the legacy-ready world payload");
  assert(adapterSource.includes("waterRenderPayload"), "legacy world adapter should expose typed water render payloads");
  assert(adapterSource.includes("firemakingTrainingRouteDefs"), "legacy world adapter should expose firemaking training routes in the legacy-ready payload");

  assert(coreSource.includes("const worldAdapterRuntime = window.LegacyWorldAdapterRuntime || null;"), "core should resolve the typed legacy world adapter runtime");
  assert(coreSource.includes("worldAdapterRuntime.resolveTravelTarget"), "core should delegate travel target resolution");
  assert(coreSource.includes("worldAdapterRuntime.matchQaWorld"), "core should delegate QA world matching");
  assert(!coreSource.includes("function getWorldManifest()"), "core should not own world-manifest helpers");
  assert(!coreSource.includes("function getKnownWorldEntries()"), "core should not own world-entry enumeration");
  assert(!coreSource.includes("function getWorldManifestEntry(worldId)"), "core should not own manifest entry lookup");
  assert(!coreSource.includes("function isKnownWorldId(worldId)"), "core should not own world-id validation");
  assert(!coreSource.includes("function resolveKnownWorldId(worldId, fallbackWorldId = null)"), "core should not own world-id fallback resolution");
  assert(!coreSource.includes("function getWorldLabel(worldId)"), "core should not own world labels");
  assert(!coreSource.includes("function getWorldDefaultSpawn(worldId)"), "core should not own world spawn fallback logic");
  assert(!coreSource.includes("function sanitizeWorldSpawn(spawnLike, worldId)"), "core should not own world spawn sanitization");
  assert(!coreSource.includes("function activateWorldContext(worldId, fallbackWorldId = null)"), "core should not own active-world activation");

  const sceneStateIndex = legacyManifestSource.indexOf('id: "world-scene-state"');
  const worldIndex = legacyManifestSource.indexOf('id: "world"');
  assert(sceneStateIndex !== -1 && worldIndex !== -1 && sceneStateIndex < worldIndex, "legacy script manifest should load world scene state before world.js");
  assert(sceneStateSource.includes("window.LegacyWorldAdapterRuntime"), "world scene state should resolve the typed legacy world adapter runtime");
  assert(sceneStateSource.includes("getCurrentWorldScenePayload"), "world scene state should expose current scene payload lookup");
  assert(sceneStateSource.includes("resolveRenderWorldId"), "world scene state should own render-world-id fallback resolution");
  assert(worldSource.includes("WorldSceneStateRuntime"), "world.js should resolve authored scene state through the scene-state runtime");
  assert(worldSource.includes("getCurrentWorldScenePayload"), "world.js should fetch the current scene payload through the scene-state runtime");
  assert(worldSource.includes("waterRenderPayload"), "world.js should consume the typed water render payload");
  assert(worldSource.includes("firemakingTrainingRouteDefs"), "world.js should read firemaking training routes from the legacy-ready world payload");
  assert(!worldSource.includes("getWorldLegacyConfig"), "world.js should not shape bootstrap payloads inline");
  assert(!worldSource.includes("staticMerchantServices.filter((service) => {"), "world.js should not translate static services into NPC render spots inline");
  assert(!worldSource.includes("travelToWorldId: typeof service.travelToWorldId === 'string'"), "world.js should not normalize travel metadata inline");
  assert(!worldSource.includes("const readWorldRouteGroup = (groupId, fallbackRoutes) => {"), "world.js should not own route-group fallback bridging");
  assert(!worldSource.includes("const cloneRouteDescriptor = (route) => ({"), "world.js should not carry route clone helpers");
  assert(!worldSource.includes("const cloneAltarRenderPlacement = (altar) => ({"), "world.js should not carry altar clone helpers");
  assert(worldSource.includes("window.getFiremakingTrainingLocations = function getFiremakingTrainingLocations()"), "world.js should expose the firemaking compatibility getter");

  assert(!bridgeSource.includes("function cloneRoute(route: RouteDescriptor)"), "legacy bridge should reuse shared route cloning");
  assert(bridgeSource.includes("getFiremakingTrainingLocations"), "legacy bridge should expose the firemaking compatibility hook");
  assert(!bootstrapSource.includes("function cloneService(service: ServiceDescriptor)"), "bootstrap should reuse shared service cloning");
  assert(!bootstrapSource.includes("function cloneNpc(npc: NpcDescriptor)"), "bootstrap should reuse shared NPC cloning");
  assert(!placementsSource.includes("function cloneService(service: ServiceDescriptor)"), "placements should reuse shared service cloning");
  assert(!placementsSource.includes("function cloneRoute(route: RouteDescriptor)"), "placements should reuse shared route cloning");
  assert(cloneSource.includes("cloneServiceDescriptor"), "shared world clone helpers should centralize service cloning");
  assert(cloneSource.includes("cloneNpcDescriptor"), "shared world clone helpers should centralize NPC cloning");
  assert(cloneSource.includes("createMerchantNpcDescriptor"), "shared world clone helpers should centralize merchant NPC descriptors");

  exposeLegacyBridge();
  exposeLegacyWorldAdapter();
  vm.runInThisContext(sceneStateSource, { filename: path.join(root, "src", "js", "world", "scene-state.js") });
  const runtime = window.WorldBootstrapRuntime;
  const adapterRuntime = window.LegacyWorldAdapterRuntime;
  const sceneStateRuntime = window.WorldSceneStateRuntime;
  assert(runtime, "legacy bridge should expose the world bootstrap runtime");
  assert(adapterRuntime, "legacy world adapter should expose its runtime");
  assert(sceneStateRuntime, "world scene state should expose its runtime");
  assert(runtime.getCurrentWorldId() === "main_overworld", "legacy bridge should start on the canonical authored world");
  assert(sceneStateRuntime.getCurrentWorldScenePayload().worldId === "main_overworld", "world scene state should resolve the current canonical world payload");
  assert(sceneStateRuntime.getWorldScenePayload("starter_town").worldId === "main_overworld", "world scene state should canonicalize legacy world payload lookup");
  assert(sceneStateRuntime.resolveRenderWorldId() === "main_overworld", "world scene state should resolve the render world id through the active bootstrap runtime");
  assert(adapterRuntime.resolveKnownWorldId("starter_town") === "main_overworld", "legacy adapter should canonicalize starter_town");
  assert(adapterRuntime.matchQaWorld("starter_town").worldId === "main_overworld", "QA world matching should accept legacy starter_town input");
  assert(adapterRuntime.resolveTravelTarget("starter_town", { activate: false }).worldId === "main_overworld", "legacy travel resolution should accept starter_town input");
  assert(runtime.getWorldManifestEntry("starter_town").worldId === "main_overworld", "legacy starter_town manifest lookup should resolve to main_overworld");
  assert(runtime.getWorldDefinition("starter_town").worldId === "main_overworld", "legacy starter_town definition lookup should resolve to main_overworld");
  const starterTownSpawn = runtime.getDefaultSpawn("main_overworld");
  const starterTownBootstrap = runtime.getBootstrapResult("main_overworld");
  const starterTownLegacy = runtime.getWorldLegacyConfig("main_overworld");
  runtime.activateWorld("north_road_camp");
  const deletedWorldSpawn = runtime.getDefaultSpawn("north_road_camp");
  assert(runtime.getCurrentWorldId() === "main_overworld", "legacy bridge should fall back when activating a deleted world id");
  assert(runtime.getWorldManifestEntry("north_road_camp").worldId === "main_overworld", "legacy bridge manifest lookup should fall back for deleted world ids");
  assert(deletedWorldSpawn.x === starterTownSpawn.x, "deleted world fallback spawn should use starter-town x");
  assert(deletedWorldSpawn.y === starterTownSpawn.y, "deleted world fallback spawn should use starter-town y");
  assert(deletedWorldSpawn.z === starterTownSpawn.z, "deleted world fallback spawn should use starter-town z");
  assert(runtime.getWorldDefinition("north_road_camp").worldId === "main_overworld", "legacy bridge world definition lookup should fall back for deleted world ids");
  assert(
    runtime.getBootstrapResult("north_road_camp").definition.worldId === starterTownBootstrap.definition.worldId,
    "legacy bridge bootstrap lookup should fall back for deleted world ids"
  );
  assert(
    runtime.getBootstrapResult("").definition.worldId === starterTownBootstrap.definition.worldId,
    "legacy bridge bootstrap lookup should fall back for empty world ids"
  );
  assert(
    runtime.getWorldLegacyConfig("north_road_camp").worldId === starterTownLegacy.worldId,
    "legacy bridge legacy-config lookup should fall back for deleted world ids"
  );
  assert(
    runtime.getWorldLegacyConfig("").worldId === starterTownLegacy.worldId,
    "legacy bridge legacy-config lookup should fall back for empty world ids"
  );

  console.log("Legacy world adapter guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
