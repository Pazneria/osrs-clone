const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-bridge.ts"), "utf8");
  const adapterSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-world-adapter.ts"), "utf8");
  const bootstrapSource = fs.readFileSync(path.join(root, "src", "game", "world", "bootstrap.ts"), "utf8");
  const placementsSource = fs.readFileSync(path.join(root, "src", "game", "world", "placements.ts"), "utf8");
  const cloneSource = fs.readFileSync(path.join(root, "src", "game", "world", "clone.ts"), "utf8");

  assert(adapterSource.includes("window.LegacyWorldAdapterRuntime"), "legacy world adapter should expose a window runtime");
  assert(adapterSource.includes("resolveTravelTarget"), "legacy world adapter should own travel resolution");
  assert(adapterSource.includes("activateWorldContext"), "legacy world adapter should own active-world activation");
  assert(adapterSource.includes("getQaWorldSummaries"), "legacy world adapter should own QA world summaries");
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

  assert(worldSource.includes("const worldAdapterRuntime = window.LegacyWorldAdapterRuntime || null;"), "world.js should resolve the typed legacy world adapter runtime");
  assert(worldSource.includes("getCurrentWorldPayload"), "world.js should fetch a legacy-ready world payload");
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

  console.log("Legacy world adapter guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
