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
  const qaToolsSource = fs.readFileSync(path.join(root, "src", "js", "qa-tools-runtime.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const proceduralRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "procedural-runtime.js"), "utf8");
  const sceneStateSource = fs.readFileSync(path.join(root, "src", "js", "world", "scene-state.js"), "utf8");
  const sceneLifecycleSource = fs.readFileSync(path.join(root, "src", "js", "world", "scene-lifecycle.js"), "utf8");
  const chunkRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-scene-runtime.js"), "utf8");
  const mapHudRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "map-hud-runtime.js"), "utf8");
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
  assert(qaToolsSource.includes("worldAdapterRuntime.matchQaWorld"), "QA tools runtime should delegate QA world matching");
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
  const qaToolsIndex = legacyManifestSource.indexOf('id: "qa-tools-runtime"');
  const proceduralRuntimeIndex = legacyManifestSource.indexOf('id: "world-procedural-runtime"');
  const structureRuntimeIndex = legacyManifestSource.indexOf('id: "world-structure-render-runtime"');
  const treeRuntimeIndex = legacyManifestSource.indexOf('id: "world-tree-render-runtime"');
  const rockRuntimeIndex = legacyManifestSource.indexOf('id: "world-rock-render-runtime"');
  const sceneLifecycleIndex = legacyManifestSource.indexOf('id: "world-scene-lifecycle"');
  const chunkRuntimeIndex = legacyManifestSource.indexOf('id: "world-chunk-scene-runtime"');
  const mapHudRuntimeIndex = legacyManifestSource.indexOf('id: "world-map-hud-runtime"');
  const worldIndex = legacyManifestSource.indexOf('id: "world"');
  assert(sceneStateIndex !== -1 && worldIndex !== -1 && sceneStateIndex < worldIndex, "legacy script manifest should load world scene state before world.js");
  assert(qaToolsIndex !== -1 && worldIndex !== -1 && qaToolsIndex < worldIndex, "legacy script manifest should load QA tools before core/world runtime consumers");
  assert(proceduralRuntimeIndex !== -1 && worldIndex !== -1 && proceduralRuntimeIndex < worldIndex, "legacy script manifest should load world procedural runtime before world.js");
  assert(structureRuntimeIndex !== -1 && worldIndex !== -1 && structureRuntimeIndex < worldIndex, "legacy script manifest should load world structure render runtime before world.js");
  assert(treeRuntimeIndex !== -1 && worldIndex !== -1 && treeRuntimeIndex < worldIndex, "legacy script manifest should load world tree render runtime before world.js");
  assert(rockRuntimeIndex !== -1 && worldIndex !== -1 && rockRuntimeIndex < worldIndex, "legacy script manifest should load world rock render runtime before world.js");
  assert(sceneLifecycleIndex !== -1 && worldIndex !== -1 && sceneLifecycleIndex < worldIndex, "legacy script manifest should load world scene lifecycle before world.js");
  assert(chunkRuntimeIndex !== -1 && worldIndex !== -1 && chunkRuntimeIndex < worldIndex, "legacy script manifest should load world chunk scene runtime before world.js");
  assert(mapHudRuntimeIndex !== -1 && worldIndex !== -1 && mapHudRuntimeIndex < worldIndex, "legacy script manifest should load world map HUD runtime before world.js");
  assert(sceneStateSource.includes("window.LegacyWorldAdapterRuntime"), "world scene state should resolve the typed legacy world adapter runtime");
  assert(sceneStateSource.includes("getCurrentWorldScenePayload"), "world scene state should expose current scene payload lookup");
  assert(sceneStateSource.includes("resolveRenderWorldId"), "world scene state should own render-world-id fallback resolution");
  assert(sceneLifecycleSource.includes("window.WorldSceneLifecycleRuntime"), "world scene lifecycle should expose a runtime");
  assert(sceneLifecycleSource.includes("reloadActiveWorldScene"), "world scene lifecycle should own active-scene reload orchestration");
  assert(chunkRuntimeSource.includes("window.WorldChunkSceneRuntime"), "world chunk scene runtime should expose a runtime");
  assert(chunkRuntimeSource.includes("manageChunks"), "world chunk scene runtime should own chunk manage orchestration");
  assert(mapHudRuntimeSource.includes("window.WorldMapHudRuntime"), "world map HUD runtime should expose a runtime");
  assert(mapHudRuntimeSource.includes("updateWorldMapPanel"), "world map HUD runtime should own world-map panel rendering");
  assert(proceduralRuntimeSource.includes("window.WorldProceduralRuntime"), "world procedural runtime should expose a runtime");
  assert(proceduralRuntimeSource.includes("buildGrassTextureCanvas"), "world procedural runtime should own generated grass texture canvases");
  assert(proceduralRuntimeSource.includes("sampleFractalNoise2D"), "world procedural runtime should own deterministic terrain noise helpers");
  assert(worldSource.includes("WorldProceduralRuntime"), "world.js should resolve procedural helpers through the procedural runtime");
  assert(!worldSource.includes("function buildGrassTextureCanvas"), "world.js should not own generated texture canvas builders");
  assert(!worldSource.includes("function sampleFractalNoise2D"), "world.js should not own deterministic noise helpers");
  assert(worldSource.includes("WorldSceneStateRuntime"), "world.js should resolve authored scene state through the scene-state runtime");
  assert(worldSource.includes("getCurrentWorldScenePayload"), "world.js should fetch the current scene payload through the scene-state runtime");
  assert(worldSource.includes("WorldSceneLifecycleRuntime"), "world.js should delegate active-scene reload lifecycle");
  assert(worldSource.includes("WorldChunkSceneRuntime"), "world.js should delegate chunk scene state");
  assert(worldSource.includes("WorldMapHudRuntime"), "world.js should delegate map HUD state");
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
  vm.runInThisContext(sceneLifecycleSource, { filename: path.join(root, "src", "js", "world", "scene-lifecycle.js") });
  vm.runInThisContext(chunkRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-scene-runtime.js") });
  vm.runInThisContext(mapHudRuntimeSource, { filename: path.join(root, "src", "js", "world", "map-hud-runtime.js") });
  const runtime = window.WorldBootstrapRuntime;
  const adapterRuntime = window.LegacyWorldAdapterRuntime;
  const sceneStateRuntime = window.WorldSceneStateRuntime;
  const sceneLifecycleRuntime = window.WorldSceneLifecycleRuntime;
  const chunkSceneRuntime = window.WorldChunkSceneRuntime;
  const mapHudRuntime = window.WorldMapHudRuntime;
  assert(runtime, "legacy bridge should expose the world bootstrap runtime");
  assert(adapterRuntime, "legacy world adapter should expose its runtime");
  assert(sceneStateRuntime, "world scene state should expose its runtime");
  assert(sceneLifecycleRuntime, "world scene lifecycle should expose its runtime");
  assert(chunkSceneRuntime, "world chunk scene runtime should expose its runtime");
  assert(mapHudRuntime, "world map HUD runtime should expose its runtime");
  assert(runtime.getCurrentWorldId() === "main_overworld", "legacy bridge should start on the canonical authored world");
  assert(sceneStateRuntime.getCurrentWorldScenePayload().worldId === "main_overworld", "world scene state should resolve the current canonical world payload");
  assert(sceneStateRuntime.getWorldScenePayload("starter_town").worldId === "main_overworld", "world scene state should canonicalize legacy world payload lookup");
  assert(sceneStateRuntime.resolveRenderWorldId() === "main_overworld", "world scene state should resolve the render world id through the active bootstrap runtime");
  const lifecycleEvents = [];
  const fakeScene = { remove: (mesh) => lifecycleEvents.push(`remove:${mesh}`) };
  sceneLifecycleRuntime.reloadActiveWorldScene({
    scene: fakeScene,
    clickMarkers: [{ mesh: "marker" }],
    activeHitsplats: [{ el: { remove: () => lifecycleEvents.push("hitsplat") } }],
    environmentMeshes: ["mesh"],
    hasScene: () => true,
    hasPlayerRig: () => true,
    initLogicalMap: () => lifecycleEvents.push("init"),
    resetChunkSceneState: () => lifecycleEvents.push("reset-chunks"),
    clearCombatEnemyRenderers: () => lifecycleEvents.push("clear-combat"),
    syncPlayerRigToState: () => lifecycleEvents.push("sync-player"),
    syncFreeCamTargetToState: () => lifecycleEvents.push("sync-freecam"),
    updateMinimapCanvas: () => lifecycleEvents.push("minimap"),
    manageChunks: (force) => lifecycleEvents.push(`chunks:${force}`),
    updateWorldMapPanel: (force) => lifecycleEvents.push(`world-map:${force}`)
  });
  assert(lifecycleEvents[0] === "clear-combat", "world scene lifecycle should clear combat renderers before scene reload work");
  assert(lifecycleEvents.includes("reset-chunks"), "world scene lifecycle should delegate chunk resets through the chunk scene runtime hook");
  assert(lifecycleEvents.indexOf("init") > lifecycleEvents.indexOf("reset-chunks"), "world scene lifecycle should rebuild the logical map after clearing old scene state");
  assert(lifecycleEvents.includes("chunks:true") && lifecycleEvents.includes("world-map:true"), "world scene lifecycle should refresh chunk and world-map presentation after reload");
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
