const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const targetSource = fs.readFileSync(path.join(root, "src", "js", "interactions", "target-interaction-registry.js"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "manifest.json"), "utf8"));
  const starterTown = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "regions", "starter_town.json"), "utf8"));
  const northRoadCamp = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "regions", "north_road_camp.json"), "utf8"));

  assert(Array.isArray(manifest.worlds) && manifest.worlds.length >= 2, "proof pass should register at least two worlds");
  assert(coreSource.includes("function travelToWorld(worldId, options = {})"), "core should define travelToWorld");
  assert(coreSource.includes("window.travelToWorld = travelToWorld;"), "core should expose travelToWorld on window");
  assert(coreSource.includes("function qaListWorlds()"), "core should expose QA world listing");
  assert(coreSource.includes("function qaTravelWorld(worldIdLike)"), "core should expose QA world travel");
  assert(coreSource.includes("/qa worlds, /qa travel <worldId>"), "QA help should document world travel commands");

  const loadCall = coreSource.indexOf("const loadProgressResult = loadProgressFromStorage();");
  const activateCall = coreSource.indexOf("const startupWorldId = activateWorldContext(startupRequestedWorldId, 'starter_town');");
  const initCall = coreSource.indexOf("if (typeof window.initLogicalMap === 'function') window.initLogicalMap();");
  assert(loadCall !== -1, "core startup should still load progress");
  assert(activateCall !== -1, "core startup should activate the saved world before map init");
  assert(initCall !== -1, "core startup should initialize the world map");
  assert(loadCall < activateCall && activateCall < initCall, "startup should activate the current world after loading progress and before initLogicalMap");

  assert(worldSource.includes("function reloadActiveWorldScene()"), "world.js should define an active-world scene reload hook");
  assert(worldSource.includes("window.reloadActiveWorldScene = reloadActiveWorldScene;"), "world.js should expose the scene reload hook");
  assert(worldSource.includes("if (npc.travelToWorldId) npcUid.travelToWorldId = npc.travelToWorldId;"), "world.js should attach travel world metadata to NPC hitboxes");

  assert(inputSource.includes("playerState.targetUid.action === 'Travel'"), "input handler should resolve travel NPC actions");
  assert(inputSource.includes("window.travelToWorld(playerState.targetUid.travelToWorldId"), "input handler should delegate travel through the core world-travel helper");
  assert(targetSource.includes("`Travel <span class=\"text-yellow-400\">${npcName}</span>`"), "target interaction registry should surface Travel for NPCs");

  const starterTravel = (starterTown.services || []).find((service) => service && service.serviceId === "merchant:starter_caravan_guide");
  const northTravel = (northRoadCamp.services || []).find((service) => service && service.serviceId === "merchant:north_road_caravan_guide");
  assert(starterTravel && starterTravel.travelToWorldId === "north_road_camp", "starter town should include travel to north_road_camp");
  assert(northTravel && northTravel.travelToWorldId === "starter_town", "north_road_camp should include travel back to starter_town");

  console.log("World travel proof passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
