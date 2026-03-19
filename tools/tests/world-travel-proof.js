const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const STARTER_TOWN_NAMED_NPC_DIALOGUES = Object.freeze({
  "merchant:general_store": "shopkeeper",
  "merchant:starter_caravan_guide": "road_guide",
  "merchant:east_outpost_caravan_guide": "outpost_guide",
  "merchant:fishing_teacher": "fishing_teacher",
  "merchant:fishing_supplier": "fishing_supplier",
  "merchant:borin_ironvein": "borin_ironvein",
  "merchant:thrain_deepforge": "thrain_deepforge",
  "merchant:elira_gemhand": "elira_gemhand",
  "merchant:crafting_teacher": "crafting_teacher",
  "merchant:tanner_rusk": "tanner_rusk",
  "merchant:rune_tutor": "rune_tutor",
  "merchant:combination_sage": "combination_sage"
});

function loadNpcDialogueCatalog(root) {
  const absPath = path.join(root, "src", "js", "content", "npc-dialogue-catalog.js");
  const sandbox = { window: {}, console };
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInNewContext(source, sandbox, { filename: absPath });
  return sandbox.window && sandbox.window.NpcDialogueCatalog ? sandbox.window.NpcDialogueCatalog : null;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const dialogueCatalog = loadNpcDialogueCatalog(root);
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const adapterSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-world-adapter.ts"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const targetSource = fs.readFileSync(path.join(root, "src", "js", "interactions", "target-interaction-registry.js"), "utf8");
  const npcDialogueCatalogSource = fs.readFileSync(path.join(root, "src", "js", "content", "npc-dialogue-catalog.js"), "utf8");
  const npcDialogueRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "npc-dialogue-runtime.js"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "manifest.json"), "utf8"));
  const starterTown = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "regions", "starter_town.json"), "utf8"));
  const northRoadCamp = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "regions", "north_road_camp.json"), "utf8"));

  assert(Array.isArray(manifest.worlds) && manifest.worlds.length >= 2, "proof pass should register at least two worlds");
  assert(coreSource.includes("function travelToWorld(worldId, options = {})"), "core should define travelToWorld");
  assert(coreSource.includes("window.travelToWorld = travelToWorld;"), "core should expose travelToWorld on window");
  assert(coreSource.includes("worldAdapterRuntime.resolveTravelTarget"), "core world travel should delegate target resolution through the typed adapter");
  assert(coreSource.includes("function qaListWorlds()"), "core should expose QA world listing");
  assert(coreSource.includes("function qaTravelWorld(worldIdLike)"), "core should expose QA world travel");
  assert(coreSource.includes("/qa worlds, /qa travel <worldId>"), "QA help should document world travel commands");
  assert(adapterSource.includes("matchQaWorld"), "legacy world adapter should expose QA world matching");

  const loadCall = coreSource.indexOf("const loadProgressResult = loadProgressFromStorage();");
  const activateCall = coreSource.indexOf("worldAdapterRuntime.activateWorldContext(startupRequestedWorldId, 'starter_town')");
  const initCall = coreSource.indexOf("if (typeof window.initLogicalMap === 'function') window.initLogicalMap();");
  assert(loadCall !== -1, "core startup should still load progress");
  assert(activateCall !== -1, "core startup should activate the saved world through the typed adapter before map init");
  assert(initCall !== -1, "core startup should initialize the world map");
  assert(loadCall < activateCall && activateCall < initCall, "startup should activate the current world after loading progress and before initLogicalMap");

  assert(worldSource.includes("function reloadActiveWorldScene()"), "world.js should define an active-world scene reload hook");
  assert(worldSource.includes("window.reloadActiveWorldScene = reloadActiveWorldScene;"), "world.js should expose the scene reload hook");
  assert(worldSource.includes("getCurrentWorldPayload"), "world.js should fetch the active world payload through the typed adapter");
  assert(worldSource.includes("if (npc.travelToWorldId) npcUid.travelToWorldId = npc.travelToWorldId;"), "world.js should attach travel world metadata to NPC hitboxes");
  assert(worldSource.includes("if (appearanceId) npcUid.appearanceId = appearanceId;"), "world.js should attach appearance metadata to NPC hitboxes");
  assert(worldSource.includes("if (typeof npc.dialogueId === 'string' && npc.dialogueId.trim()) npcUid.dialogueId = npc.dialogueId.trim();"), "world.js should attach dialogue metadata to NPC hitboxes");

  assert(inputSource.includes("playerState.targetUid.action === 'Travel'"), "input handler should resolve travel NPC actions");
  assert(inputSource.includes("playerState.targetUid.action === 'Talk-to'"), "input handler should resolve Talk-to NPC actions");
  assert(inputSource.includes("window.openNpcDialogue(playerState.targetUid);"), "input handler should delegate Talk-to through the NPC dialogue runtime");
  assert(inputSource.includes("const targetWorldId = explicitWorldId || sessionWorldId;"), "input handler should resolve the target world before dispatch");
  assert(inputSource.includes("window.travelToWorld(targetWorldId, {"), "input handler should delegate travel through the core world-travel helper");
  assert(targetSource.includes("`Travel <span class=\"text-yellow-400\">${npcName}</span>`"), "target interaction registry should surface Travel for NPCs");
  assert(targetSource.includes("`Talk-to <span class=\"text-yellow-400\">${npcName}</span>`"), "target interaction registry should surface Talk-to for NPCs");
  assert(targetSource.includes("const talkTarget = npcUid") && targetSource.includes("Object.assign({}, npcUid, { action: 'Talk-to' })"), "target interaction registry should preserve NPC metadata for Talk-to");
  assert(npcDialogueCatalogSource.includes("const DIALOGUE_ENTRIES = {"), "npc dialogue catalog should define dialogue entries");
  assert(npcDialogueRuntimeSource.includes("window.NpcDialogueCatalog.getDialogueEntryByNpc(npc)"), "npc dialogue runtime should resolve dialogue entries through the catalog helper");
  assert(npcDialogueRuntimeSource.includes("window.NpcDialogueCatalog.resolveDialogueIdFromNpc(normalizedNpc)"), "npc dialogue runtime should preserve the resolved dialogue id from full NPC metadata");
  assert(npcDialogueRuntimeSource.includes("window.openNpcDialogue = openNpcDialogue;"), "npc dialogue runtime should expose openNpcDialogue");
  assert(dialogueCatalog && typeof dialogueCatalog.resolveDialogueId === "function", "npc dialogue catalog should expose resolveDialogueId");

  const starterTravel = (starterTown.services || []).find((service) => service && service.serviceId === "merchant:starter_caravan_guide");
  const eastOutpostTravel = (starterTown.services || []).find((service) => service && service.serviceId === "merchant:east_outpost_caravan_guide");
  const northTravel = (northRoadCamp.services || []).find((service) => service && service.serviceId === "merchant:north_road_caravan_guide");
  assert(starterTravel && starterTravel.travelToWorldId === "starter_town", "starter town should route to the east outpost through starter_town");
  assert(starterTravel && starterTravel.travelSpawn && starterTravel.travelSpawn.x === 364 && starterTravel.travelSpawn.y === 262, "starter town should route to the east outpost spawn");
  assert(eastOutpostTravel && eastOutpostTravel.travelToWorldId === "starter_town", "east outpost should route back into starter town");
  assert(eastOutpostTravel && eastOutpostTravel.travelSpawn && eastOutpostTravel.travelSpawn.x === 205 && eastOutpostTravel.travelSpawn.y === 210, "east outpost should route back to the starter-town square");
  assert(northTravel && northTravel.travelToWorldId === "starter_town", "north_road_camp should include travel back to starter_town");
  Object.entries(STARTER_TOWN_NAMED_NPC_DIALOGUES).forEach(([serviceId, expectedDialogueId]) => {
    const service = (starterTown.services || []).find((entry) => entry && entry.serviceId === serviceId);
    assert(!!service, `starter-town named NPC service missing: ${serviceId}`);
    const dialogueId = service && typeof service.dialogueId === "string" ? service.dialogueId.trim() : "";
    assert(dialogueId, `${serviceId} should define dialogueId for Talk-to`);
    assert(dialogueCatalog.resolveDialogueId(dialogueId) === expectedDialogueId, `${serviceId} dialogueId should resolve to ${expectedDialogueId}`);
  });
  assert((starterTown.services || []).some((entry) => entry && entry.merchantId === "tanner_rusk" && String(entry.appearanceId || "").trim().toLowerCase() === "tanner_rusk"), "starter-town Tanner should keep the exact tanner_rusk appearance id");

  console.log("World travel proof passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
