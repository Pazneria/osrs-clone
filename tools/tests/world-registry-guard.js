const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "manifest.json"), "utf8"));
  const authoringSource = fs.readFileSync(path.join(root, "src", "game", "world", "authoring.ts"), "utf8");
  const bootstrapSource = fs.readFileSync(path.join(root, "src", "game", "world", "bootstrap.ts"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-bridge.ts"), "utf8");
  const adapterSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-world-adapter.ts"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const deletedRegionPath = path.join(root, "content", "world", "regions", "north_road_camp.json");

  assert(manifest && Array.isArray(manifest.worlds), "world manifest should define a worlds array");
  assert(manifest.worlds.length === 2, "world manifest should publish main overworld and tutorial island");
  assert(manifest.worlds[0] && manifest.worlds[0].worldId === "main_overworld", "main_overworld should remain the canonical authored world");
  assert(manifest.worlds.some((entry) => entry && entry.worldId === "tutorial_island"), "tutorial_island should be registered for fresh-start routing");
  assert(!fs.existsSync(deletedRegionPath), "north_road_camp region file should be deleted");
  assert(authoringSource.includes("worldManifestJson"), "authoring registry should load the manifest");
  assert(authoringSource.includes("getWorldManifestEntry(worldId: string)"), "authoring registry should expose manifest entry lookup by world id");
  assert(authoringSource.includes("listWorldIds(): string[]"), "authoring registry should expose world-id enumeration");
  assert(authoringSource.includes("getDefaultSpawn(worldId: string): Point3"), "authoring registry should expose default spawn lookup");
  assert(!authoringSource.includes("north_road_camp"), "authoring registry should not import the deleted north-road world");
  assert(authoringSource.includes("tutorial_island.json"), "authoring registry should import the tutorial-island world");
  assert(bootstrapSource.includes("buildWorldBootstrapResult(worldId: string)"), "bootstrap should build world results by world id");
  assert(bridgeSource.includes("getWorldManifest"), "legacy bridge should expose world manifest access");
  assert(bridgeSource.includes("listWorldIds"), "legacy bridge should expose world-id enumeration");
  assert(bridgeSource.includes("getCurrentWorldId"), "legacy bridge should expose the active world id");
  assert(bridgeSource.includes("activateWorld"), "legacy bridge should expose active-world switching");
  assert(bridgeSource.includes("getBootstrapResult"), "legacy bridge should expose bootstrap lookup by world id");
  assert(!bridgeSource.includes("getRuntimeWorldManifest"), "legacy bridge should not depend on a runtime-only world manifest alias layer");
  assert(!bridgeSource.includes("getStarterTownLegacyConfig"), "legacy bridge should not expose starter-town-only authored config");
  assert(adapterSource.includes("resolveKnownWorldId"), "legacy world adapter should canonicalize world ids");
  assert(!adapterSource.includes("resolveRuntimeWorldId"), "legacy world adapter should not carry deleted runtime world alias logic");
  assert(adapterSource.includes("getCurrentWorldPayload"), "legacy world adapter should expose current-world payload lookup");
  assert(worldSource.includes("getCurrentWorldPayload"), "world.js should resolve world config through the typed legacy world adapter");
  assert(!worldSource.includes("getStarterTownLegacyConfig"), "world.js should not call starter-town-only config helpers");

  console.log("World registry guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
