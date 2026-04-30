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
  const sharedAssetsRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "shared-assets-runtime.js"), "utf8");
  const waterRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "water-runtime.js"), "utf8");
  const terrainSetupRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "terrain-setup-runtime.js"), "utf8");
  const logicalMapAuthoringRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "logical-map-authoring-runtime.js"), "utf8");
  const miningQuarryRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "mining-quarry-runtime.js"), "utf8");
  const pierRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "pier-runtime.js"), "utf8");
  const chunkTierRenderRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-tier-render-runtime.js"), "utf8");
  const npcRenderRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "npc-render-runtime.js"), "utf8");
  const chunkResourceRenderRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-resource-render-runtime.js"), "utf8");
  const miningPoseReferenceRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "mining-pose-reference-runtime.js"), "utf8");
  const townNpcRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "town-npc-runtime.js"), "utf8");
  const fireLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "fire-lifecycle-runtime.js"), "utf8");
  const groundItemLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "ground-item-lifecycle-runtime.js"), "utf8");
  const treeLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "tree-lifecycle-runtime.js"), "utf8");
  const rockLifecycleRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "rock-lifecycle-runtime.js"), "utf8");
  const sceneStateSource = fs.readFileSync(path.join(root, "src", "js", "world", "scene-state.js"), "utf8");
  const sceneLifecycleSource = fs.readFileSync(path.join(root, "src", "js", "world", "scene-lifecycle.js"), "utf8");
  const chunkRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-scene-runtime.js"), "utf8");
  const mapHudRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "map-hud-runtime.js"), "utf8");
  const trainingLocationRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "training-location-runtime.js"), "utf8");
  const statusHudRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "status-hud-runtime.js"), "utf8");
  const skillProgressRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "skill-progress-runtime.js"), "utf8");
  const inventoryItemRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "inventory-item-runtime.js"), "utf8");
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
  const sharedAssetsRuntimeIndex = legacyManifestSource.indexOf('id: "world-shared-assets-runtime"');
  const waterRuntimeIndex = legacyManifestSource.indexOf('id: "world-water-runtime"');
  const terrainSetupRuntimeIndex = legacyManifestSource.indexOf('id: "world-terrain-setup-runtime"');
  const logicalMapAuthoringRuntimeIndex = legacyManifestSource.indexOf('id: "world-logical-map-authoring-runtime"');
  const miningQuarryRuntimeIndex = legacyManifestSource.indexOf('id: "world-mining-quarry-runtime"');
  const pierRuntimeIndex = legacyManifestSource.indexOf('id: "world-pier-runtime"');
  const chunkTerrainRuntimeIndex = legacyManifestSource.indexOf('id: "world-chunk-terrain-runtime"');
  const chunkTierRenderRuntimeIndex = legacyManifestSource.indexOf('id: "world-chunk-tier-render-runtime"');
  const groundItemRenderRuntimeIndex = legacyManifestSource.indexOf('id: "world-ground-item-render-runtime"');
  const groundItemLifecycleRuntimeIndex = legacyManifestSource.indexOf('id: "world-ground-item-lifecycle-runtime"');
  const npcRenderRuntimeIndex = legacyManifestSource.indexOf('id: "world-npc-render-runtime"');
  const structureRuntimeIndex = legacyManifestSource.indexOf('id: "world-structure-render-runtime"');
  const treeNodeRuntimeIndex = legacyManifestSource.indexOf('id: "world-tree-node-runtime"');
  const treeRuntimeIndex = legacyManifestSource.indexOf('id: "world-tree-render-runtime"');
  const treeLifecycleRuntimeIndex = legacyManifestSource.indexOf('id: "world-tree-lifecycle-runtime"');
  const rockNodeRuntimeIndex = legacyManifestSource.indexOf('id: "world-rock-node-runtime"');
  const rockRuntimeIndex = legacyManifestSource.indexOf('id: "world-rock-render-runtime"');
  const rockLifecycleRuntimeIndex = legacyManifestSource.indexOf('id: "world-rock-lifecycle-runtime"');
  const chunkResourceRuntimeIndex = legacyManifestSource.indexOf('id: "world-chunk-resource-render-runtime"');
  const miningPoseReferenceRuntimeIndex = legacyManifestSource.indexOf('id: "world-mining-pose-reference-runtime"');
  const townNpcRuntimeIndex = legacyManifestSource.indexOf('id: "world-town-npc-runtime"');
  const fireRuntimeIndex = legacyManifestSource.indexOf('id: "world-fire-render-runtime"');
  const fireLifecycleRuntimeIndex = legacyManifestSource.indexOf('id: "world-fire-lifecycle-runtime"');
  const sceneLifecycleIndex = legacyManifestSource.indexOf('id: "world-scene-lifecycle"');
  const chunkRuntimeIndex = legacyManifestSource.indexOf('id: "world-chunk-scene-runtime"');
  const mapHudRuntimeIndex = legacyManifestSource.indexOf('id: "world-map-hud-runtime"');
  const trainingLocationRuntimeIndex = legacyManifestSource.indexOf('id: "world-training-location-runtime"');
  const statusHudRuntimeIndex = legacyManifestSource.indexOf('id: "world-status-hud-runtime"');
  const skillProgressRuntimeIndex = legacyManifestSource.indexOf('id: "skill-progress-runtime"');
  const inventoryItemRuntimeIndex = legacyManifestSource.indexOf('id: "inventory-item-runtime"');
  const worldIndex = legacyManifestSource.indexOf('id: "world"');
  assert(sceneStateIndex !== -1 && worldIndex !== -1 && sceneStateIndex < worldIndex, "legacy script manifest should load world scene state before world.js");
  assert(qaToolsIndex !== -1 && worldIndex !== -1 && qaToolsIndex < worldIndex, "legacy script manifest should load QA tools before core/world runtime consumers");
  assert(proceduralRuntimeIndex !== -1 && worldIndex !== -1 && proceduralRuntimeIndex < worldIndex, "legacy script manifest should load world procedural runtime before world.js");
  assert(sharedAssetsRuntimeIndex !== -1 && worldIndex !== -1 && sharedAssetsRuntimeIndex < worldIndex, "legacy script manifest should load world shared asset runtime before world.js");
  assert(waterRuntimeIndex !== -1 && worldIndex !== -1 && waterRuntimeIndex < worldIndex, "legacy script manifest should load world water runtime before world.js");
  assert(terrainSetupRuntimeIndex !== -1 && worldIndex !== -1 && terrainSetupRuntimeIndex < worldIndex, "legacy script manifest should load world terrain setup runtime before world.js");
  assert(logicalMapAuthoringRuntimeIndex !== -1 && worldIndex !== -1 && logicalMapAuthoringRuntimeIndex < worldIndex, "legacy script manifest should load world logical-map authoring runtime before world.js");
  assert(miningQuarryRuntimeIndex !== -1 && worldIndex !== -1 && miningQuarryRuntimeIndex < worldIndex, "legacy script manifest should load world mining quarry runtime before world.js");
  assert(pierRuntimeIndex !== -1 && worldIndex !== -1 && pierRuntimeIndex < worldIndex, "legacy script manifest should load world pier runtime before world.js");
  assert(chunkTerrainRuntimeIndex !== -1 && worldIndex !== -1 && chunkTerrainRuntimeIndex < worldIndex, "legacy script manifest should load world chunk terrain runtime before world.js");
  assert(chunkTierRenderRuntimeIndex !== -1 && worldIndex !== -1 && chunkTierRenderRuntimeIndex < worldIndex, "legacy script manifest should load world chunk tier render runtime before world.js");
  assert(groundItemRenderRuntimeIndex !== -1 && worldIndex !== -1 && groundItemRenderRuntimeIndex < worldIndex, "legacy script manifest should load world ground-item render runtime before world.js");
  assert(groundItemLifecycleRuntimeIndex !== -1 && groundItemRenderRuntimeIndex !== -1 && worldIndex !== -1 && groundItemRenderRuntimeIndex < groundItemLifecycleRuntimeIndex && groundItemLifecycleRuntimeIndex < worldIndex, "legacy script manifest should load world ground-item lifecycle runtime after ground-item render and before world.js");
  assert(npcRenderRuntimeIndex !== -1 && worldIndex !== -1 && npcRenderRuntimeIndex < worldIndex, "legacy script manifest should load world NPC render runtime before world.js");
  assert(structureRuntimeIndex !== -1 && worldIndex !== -1 && structureRuntimeIndex < worldIndex, "legacy script manifest should load world structure render runtime before world.js");
  assert(treeNodeRuntimeIndex !== -1 && worldIndex !== -1 && treeNodeRuntimeIndex < worldIndex, "legacy script manifest should load world tree node runtime before world.js");
  assert(treeRuntimeIndex !== -1 && worldIndex !== -1 && treeRuntimeIndex < worldIndex, "legacy script manifest should load world tree render runtime before world.js");
  assert(treeLifecycleRuntimeIndex !== -1 && treeNodeRuntimeIndex !== -1 && treeRuntimeIndex !== -1 && worldIndex !== -1 && treeNodeRuntimeIndex < treeLifecycleRuntimeIndex && treeRuntimeIndex < treeLifecycleRuntimeIndex && treeLifecycleRuntimeIndex < worldIndex, "legacy script manifest should load world tree lifecycle runtime after tree helpers and before world.js");
  assert(rockNodeRuntimeIndex !== -1 && worldIndex !== -1 && rockNodeRuntimeIndex < worldIndex, "legacy script manifest should load world rock node runtime before world.js");
  assert(rockRuntimeIndex !== -1 && worldIndex !== -1 && rockRuntimeIndex < worldIndex, "legacy script manifest should load world rock render runtime before world.js");
  assert(rockLifecycleRuntimeIndex !== -1 && rockNodeRuntimeIndex !== -1 && rockRuntimeIndex !== -1 && worldIndex !== -1 && rockNodeRuntimeIndex < rockLifecycleRuntimeIndex && rockRuntimeIndex < rockLifecycleRuntimeIndex && rockLifecycleRuntimeIndex < worldIndex, "legacy script manifest should load world rock lifecycle runtime after rock helpers and before world.js");
  assert(chunkResourceRuntimeIndex !== -1 && worldIndex !== -1 && chunkResourceRuntimeIndex < worldIndex, "legacy script manifest should load world chunk resource render runtime before world.js");
  assert(miningPoseReferenceRuntimeIndex !== -1 && worldIndex !== -1 && miningPoseReferenceRuntimeIndex < worldIndex, "legacy script manifest should load world mining pose reference runtime before world.js");
  assert(townNpcRuntimeIndex !== -1 && worldIndex !== -1 && townNpcRuntimeIndex < worldIndex, "legacy script manifest should load world town NPC runtime before world.js");
  assert(fireRuntimeIndex !== -1 && worldIndex !== -1 && fireRuntimeIndex < worldIndex, "legacy script manifest should load world fire render runtime before world.js");
  assert(fireLifecycleRuntimeIndex !== -1 && fireRuntimeIndex !== -1 && worldIndex !== -1 && fireRuntimeIndex < fireLifecycleRuntimeIndex && fireLifecycleRuntimeIndex < worldIndex, "legacy script manifest should load world fire lifecycle runtime after fire render and before world.js");
  assert(sceneLifecycleIndex !== -1 && worldIndex !== -1 && sceneLifecycleIndex < worldIndex, "legacy script manifest should load world scene lifecycle before world.js");
  assert(chunkRuntimeIndex !== -1 && worldIndex !== -1 && chunkRuntimeIndex < worldIndex, "legacy script manifest should load world chunk scene runtime before world.js");
  assert(mapHudRuntimeIndex !== -1 && worldIndex !== -1 && mapHudRuntimeIndex < worldIndex, "legacy script manifest should load world map HUD runtime before world.js");
  assert(trainingLocationRuntimeIndex !== -1 && worldIndex !== -1 && trainingLocationRuntimeIndex < worldIndex, "legacy script manifest should load world training location runtime before world.js");
  assert(statusHudRuntimeIndex !== -1 && worldIndex !== -1 && statusHudRuntimeIndex < worldIndex, "legacy script manifest should load world status HUD runtime before world.js");
  assert(skillProgressRuntimeIndex !== -1 && worldIndex !== -1 && skillProgressRuntimeIndex < worldIndex, "legacy script manifest should load skill progress runtime before world.js");
  assert(inventoryItemRuntimeIndex !== -1 && worldIndex !== -1 && inventoryItemRuntimeIndex < worldIndex, "legacy script manifest should load inventory item runtime before world.js");
  assert(sceneStateSource.includes("window.LegacyWorldAdapterRuntime"), "world scene state should resolve the typed legacy world adapter runtime");
  assert(sceneStateSource.includes("getCurrentWorldScenePayload"), "world scene state should expose current scene payload lookup");
  assert(sceneStateSource.includes("resolveRenderWorldId"), "world scene state should own render-world-id fallback resolution");
  assert(sceneLifecycleSource.includes("window.WorldSceneLifecycleRuntime"), "world scene lifecycle should expose a runtime");
  assert(sceneLifecycleSource.includes("reloadActiveWorldScene"), "world scene lifecycle should own active-scene reload orchestration");
  assert(chunkRuntimeSource.includes("window.WorldChunkSceneRuntime"), "world chunk scene runtime should expose a runtime");
  assert(chunkRuntimeSource.includes("manageChunks"), "world chunk scene runtime should own chunk manage orchestration");
  assert(mapHudRuntimeSource.includes("window.WorldMapHudRuntime"), "world map HUD runtime should expose a runtime");
  assert(mapHudRuntimeSource.includes("updateWorldMapPanel"), "world map HUD runtime should own world-map panel rendering");
  assert(trainingLocationRuntimeSource.includes("window.WorldTrainingLocationRuntime"), "world training location runtime should expose a runtime");
  assert(trainingLocationRuntimeSource.includes("publishTrainingLocationHooks"), "world training location runtime should own training hook publication");
  assert(statusHudRuntimeSource.includes("window.WorldStatusHudRuntime"), "world status HUD runtime should expose a runtime");
  assert(statusHudRuntimeSource.includes("updateStats"), "world status HUD runtime should own stat HUD painting");
  assert(skillProgressRuntimeSource.includes("window.SkillProgressRuntime"), "skill progress runtime should expose a runtime");
  assert(skillProgressRuntimeSource.includes("addSkillXp"), "skill progress runtime should own XP awards");
  assert(inventoryItemRuntimeSource.includes("window.InventoryItemRuntime"), "inventory item runtime should expose a runtime");
  assert(inventoryItemRuntimeSource.includes("giveItem"), "inventory item runtime should own item grants");
  assert(proceduralRuntimeSource.includes("window.WorldProceduralRuntime"), "world procedural runtime should expose a runtime");
  assert(proceduralRuntimeSource.includes("buildGrassTextureCanvas"), "world procedural runtime should own generated grass texture canvases");
  assert(proceduralRuntimeSource.includes("sampleFractalNoise2D"), "world procedural runtime should own deterministic terrain noise helpers");
  assert(sharedAssetsRuntimeSource.includes("window.WorldSharedAssetsRuntime"), "world shared asset runtime should expose a runtime");
  assert(sharedAssetsRuntimeSource.includes("function initSharedAssets(options = {})"), "world shared asset runtime should own shared asset setup");
  assert(waterRuntimeSource.includes("window.WorldWaterRuntime"), "world water runtime should expose a runtime");
  assert(waterRuntimeSource.includes("appendChunkWaterTilesToBuilders"), "world water runtime should own chunk water batching");
  assert(terrainSetupRuntimeSource.includes("window.WorldTerrainSetupRuntime"), "world terrain setup runtime should expose a runtime");
  assert(terrainSetupRuntimeSource.includes("applyBaseTerrainSetup"), "world terrain setup runtime should own base terrain setup");
  assert(logicalMapAuthoringRuntimeSource.includes("window.WorldLogicalMapAuthoringRuntime"), "world logical-map authoring runtime should expose a runtime");
  assert(logicalMapAuthoringRuntimeSource.includes("applyStaticWorldAuthoring"), "world logical-map authoring runtime should own static map authoring");
  assert(miningQuarryRuntimeSource.includes("window.WorldMiningQuarryRuntime"), "world mining quarry runtime should expose a runtime");
  assert(miningQuarryRuntimeSource.includes("redistributeMiningRockPlacements"), "world mining quarry runtime should own quarry rock redistribution");
  assert(pierRuntimeSource.includes("window.WorldPierRuntime"), "world pier runtime should expose a runtime");
  assert(pierRuntimeSource.includes("isPierVisualCoverageTile"), "world pier runtime should own pier coverage classification");
  assert(chunkTierRenderRuntimeSource.includes("window.WorldChunkTierRenderRuntime"), "world chunk tier render runtime should expose a runtime");
  assert(chunkTierRenderRuntimeSource.includes("createSimplifiedChunkGroup"), "world chunk tier render runtime should own simplified tier chunk construction");
  assert(npcRenderRuntimeSource.includes("window.WorldNpcRenderRuntime"), "world NPC render runtime should expose a runtime");
  assert(npcRenderRuntimeSource.includes("appendChunkNpcVisuals"), "world NPC render runtime should own NPC chunk rendering");
  assert(chunkResourceRenderRuntimeSource.includes("window.WorldChunkResourceRenderRuntime"), "world chunk resource render runtime should expose a runtime");
  assert(chunkResourceRenderRuntimeSource.includes("appendChunkResourceVisual"), "world chunk resource render runtime should own resource chunk rendering");
  assert(worldSource.includes("WorldChunkResourceRenderRuntime"), "world.js should delegate chunk resource rendering");
  assert(miningPoseReferenceRuntimeSource.includes("window.WorldMiningPoseReferenceRuntime"), "world mining pose reference runtime should expose a runtime");
  assert(miningPoseReferenceRuntimeSource.includes("applyMiningReferenceVariant"), "world mining pose reference runtime should own pose variant math");
  assert(worldSource.includes("WorldMiningPoseReferenceRuntime"), "world.js should delegate mining pose references");
  assert(townNpcRuntimeSource.includes("window.WorldTownNpcRuntime"), "world town NPC runtime should expose a runtime");
  assert(townNpcRuntimeSource.includes("updateWorldNpcRuntime"), "world town NPC runtime should own NPC update ticks");
  assert(townNpcRuntimeSource.includes("createTownNpcActorRecord"), "world town NPC runtime should own NPC actor record shaping");
  assert(townNpcRuntimeSource.includes("listQaNpcTargets"), "world town NPC runtime should own QA target snapshots");
  assert(townNpcRuntimeSource.includes("resolveTownNpcRoamBounds"), "world town NPC runtime should own NPC roam bounds resolution");
  assert(worldSource.includes("WorldTownNpcRuntime"), "world.js should delegate town NPC behavior");
  assert(fireLifecycleRuntimeSource.includes("window.WorldFireLifecycleRuntime"), "world fire lifecycle runtime should expose a runtime");
  assert(fireLifecycleRuntimeSource.includes("spawnFireAtTile"), "world fire lifecycle runtime should own fire spawning");
  assert(worldSource.includes("WorldFireLifecycleRuntime"), "world.js should delegate fire lifecycle behavior");
  assert(groundItemLifecycleRuntimeSource.includes("window.WorldGroundItemLifecycleRuntime"), "world ground-item lifecycle runtime should expose a runtime");
  assert(groundItemLifecycleRuntimeSource.includes("spawnGroundItem"), "world ground-item lifecycle runtime should own ground-item spawning");
  assert(groundItemLifecycleRuntimeSource.includes("takeGroundItemByUid"), "world ground-item lifecycle runtime should own ground-item pickup");
  assert(worldSource.includes("WorldGroundItemLifecycleRuntime"), "world.js should delegate ground-item lifecycle behavior");
  assert(treeLifecycleRuntimeSource.includes("window.WorldTreeLifecycleRuntime"), "world tree lifecycle runtime should expose a runtime");
  assert(treeLifecycleRuntimeSource.includes("tickTreeLifecycle"), "world tree lifecycle runtime should own tree respawn ticks");
  assert(worldSource.includes("WorldTreeLifecycleRuntime"), "world.js should delegate tree lifecycle behavior");
  assert(rockLifecycleRuntimeSource.includes("window.WorldRockLifecycleRuntime"), "world rock lifecycle runtime should expose a runtime");
  assert(rockLifecycleRuntimeSource.includes("tickRockNodes"), "world rock lifecycle runtime should own rock respawn ticks");
  assert(worldSource.includes("WorldRockLifecycleRuntime"), "world.js should delegate rock lifecycle behavior");
  assert(worldSource.includes("WorldProceduralRuntime"), "world.js should resolve procedural helpers through the procedural runtime");
  assert(worldSource.includes("WorldSharedAssetsRuntime"), "world.js should delegate shared asset setup");
  assert(!worldSource.includes("function buildGrassTextureCanvas"), "world.js should not own generated texture canvas builders");
  assert(!worldSource.includes("function sampleFractalNoise2D"), "world.js should not own deterministic noise helpers");
  assert(!worldSource.includes("sharedGeometries.ground = new THREE.PlaneGeometry"), "world.js should not own shared geometry construction");
  assert(worldSource.includes("WorldSceneStateRuntime"), "world.js should resolve authored scene state through the scene-state runtime");
  assert(worldSource.includes("getCurrentWorldScenePayload"), "world.js should fetch the current scene payload through the scene-state runtime");
  assert(worldSource.includes("WorldSceneLifecycleRuntime"), "world.js should delegate active-scene reload lifecycle");
  assert(worldSource.includes("WorldChunkTerrainRuntime"), "world.js should delegate chunk ground mesh construction");
  assert(worldSource.includes("WorldChunkTierRenderRuntime"), "world.js should delegate simplified tier chunk rendering");
  assert(worldSource.includes("WorldNpcRenderRuntime"), "world.js should delegate NPC chunk rendering");
  assert(worldSource.includes("WorldWaterRuntime"), "world.js should delegate water rendering helpers");
  assert(worldSource.includes("WorldTerrainSetupRuntime"), "world.js should delegate base terrain setup");
  assert(worldSource.includes("WorldLogicalMapAuthoringRuntime"), "world.js should delegate logical-map authoring setup");
  assert(worldSource.includes("WorldMiningQuarryRuntime"), "world.js should delegate mining quarry planning");
  assert(worldSource.includes("WorldPierRuntime"), "world.js should delegate pier classification");
  assert(worldSource.includes("WorldChunkSceneRuntime"), "world.js should delegate chunk scene state");
  assert(worldSource.includes("WorldMapHudRuntime"), "world.js should delegate map HUD state");
  assert(worldSource.includes("WorldTreeNodeRuntime"), "world.js should delegate tree metadata helpers through the tree node runtime");
  assert(worldSource.includes("WorldRockNodeRuntime"), "world.js should delegate rock metadata helpers through the rock node runtime");
  assert(worldSource.includes("WorldFireRenderRuntime"), "world.js should delegate fire visuals through the fire render runtime");
  assert(worldSource.includes("waterRenderPayload"), "world.js should consume the typed water render payload");
  assert(worldSource.includes("firemakingTrainingRouteDefs"), "world.js should read firemaking training routes from the legacy-ready world payload");
  assert(!worldSource.includes("getWorldLegacyConfig"), "world.js should not shape bootstrap payloads inline");
  assert(!worldSource.includes("staticMerchantServices.filter((service) => {"), "world.js should not translate static services into NPC render spots inline");
  assert(!worldSource.includes("travelToWorldId: typeof service.travelToWorldId === 'string'"), "world.js should not normalize travel metadata inline");
  assert(!worldSource.includes("const readWorldRouteGroup = (groupId, fallbackRoutes) => {"), "world.js should not own route-group fallback bridging");
  assert(!worldSource.includes("const cloneRouteDescriptor = (route) => ({"), "world.js should not carry route clone helpers");
  assert(!worldSource.includes("const cloneAltarRenderPlacement = (altar) => ({"), "world.js should not carry altar clone helpers");
  assert(worldSource.includes("WorldTrainingLocationRuntime"), "world.js should delegate training location compatibility hooks");
  assert(!worldSource.includes("window.getFiremakingTrainingLocations = function getFiremakingTrainingLocations()"), "world.js should not publish firemaking compatibility getters inline");

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
  vm.runInThisContext(sharedAssetsRuntimeSource, { filename: path.join(root, "src", "js", "world", "shared-assets-runtime.js") });
  vm.runInThisContext(sceneLifecycleSource, { filename: path.join(root, "src", "js", "world", "scene-lifecycle.js") });
  vm.runInThisContext(chunkRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-scene-runtime.js") });
  vm.runInThisContext(mapHudRuntimeSource, { filename: path.join(root, "src", "js", "world", "map-hud-runtime.js") });
  vm.runInThisContext(terrainSetupRuntimeSource, { filename: path.join(root, "src", "js", "world", "terrain-setup-runtime.js") });
  vm.runInThisContext(logicalMapAuthoringRuntimeSource, { filename: path.join(root, "src", "js", "world", "logical-map-authoring-runtime.js") });
  vm.runInThisContext(miningQuarryRuntimeSource, { filename: path.join(root, "src", "js", "world", "mining-quarry-runtime.js") });
  vm.runInThisContext(pierRuntimeSource, { filename: path.join(root, "src", "js", "world", "pier-runtime.js") });
  vm.runInThisContext(trainingLocationRuntimeSource, { filename: path.join(root, "src", "js", "world", "training-location-runtime.js") });
  vm.runInThisContext(chunkResourceRenderRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-resource-render-runtime.js") });
  vm.runInThisContext(miningPoseReferenceRuntimeSource, { filename: path.join(root, "src", "js", "world", "mining-pose-reference-runtime.js") });
  vm.runInThisContext(townNpcRuntimeSource, { filename: path.join(root, "src", "js", "world", "town-npc-runtime.js") });
  vm.runInThisContext(fireLifecycleRuntimeSource, { filename: path.join(root, "src", "js", "world", "fire-lifecycle-runtime.js") });
  vm.runInThisContext(groundItemLifecycleRuntimeSource, { filename: path.join(root, "src", "js", "world", "ground-item-lifecycle-runtime.js") });
  vm.runInThisContext(treeLifecycleRuntimeSource, { filename: path.join(root, "src", "js", "world", "tree-lifecycle-runtime.js") });
  vm.runInThisContext(rockLifecycleRuntimeSource, { filename: path.join(root, "src", "js", "world", "rock-lifecycle-runtime.js") });
  const runtime = window.WorldBootstrapRuntime;
  const adapterRuntime = window.LegacyWorldAdapterRuntime;
  const sharedAssetsRuntime = window.WorldSharedAssetsRuntime;
  const sceneStateRuntime = window.WorldSceneStateRuntime;
  const sceneLifecycleRuntime = window.WorldSceneLifecycleRuntime;
  const chunkSceneRuntime = window.WorldChunkSceneRuntime;
  const mapHudRuntime = window.WorldMapHudRuntime;
  const terrainSetupRuntime = window.WorldTerrainSetupRuntime;
  const logicalMapAuthoringRuntime = window.WorldLogicalMapAuthoringRuntime;
  const miningQuarryRuntime = window.WorldMiningQuarryRuntime;
  const pierRuntime = window.WorldPierRuntime;
  const trainingLocationRuntime = window.WorldTrainingLocationRuntime;
  const chunkResourceRuntime = window.WorldChunkResourceRenderRuntime;
  const miningPoseReferenceRuntime = window.WorldMiningPoseReferenceRuntime;
  const groundItemLifecycleRuntime = window.WorldGroundItemLifecycleRuntime;
  const treeLifecycleRuntime = window.WorldTreeLifecycleRuntime;
  const rockLifecycleRuntime = window.WorldRockLifecycleRuntime;
  assert(runtime, "legacy bridge should expose the world bootstrap runtime");
  assert(adapterRuntime, "legacy world adapter should expose its runtime");
  assert(sharedAssetsRuntime, "world shared asset runtime should expose its runtime");
  assert(sceneStateRuntime, "world scene state should expose its runtime");
  assert(sceneLifecycleRuntime, "world scene lifecycle should expose its runtime");
  assert(chunkSceneRuntime, "world chunk scene runtime should expose its runtime");
  assert(mapHudRuntime, "world map HUD runtime should expose its runtime");
  assert(terrainSetupRuntime, "world terrain setup runtime should expose its runtime");
  assert(logicalMapAuthoringRuntime, "world logical-map authoring runtime should expose its runtime");
  assert(miningQuarryRuntime, "world mining quarry runtime should expose its runtime");
  assert(pierRuntime, "world pier runtime should expose its runtime");
  assert(trainingLocationRuntime, "world training location runtime should expose its runtime");
  assert(chunkResourceRuntime, "world chunk resource render runtime should expose its runtime");
  assert(miningPoseReferenceRuntime, "world mining pose reference runtime should expose its runtime");
  assert(groundItemLifecycleRuntime, "world ground-item lifecycle runtime should expose its runtime");
  assert(treeLifecycleRuntime, "world tree lifecycle runtime should expose its runtime");
  assert(rockLifecycleRuntime, "world rock lifecycle runtime should expose its runtime");
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
