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
  "merchant:advanced_fletcher": "advanced_fletcher",
  "merchant:advanced_woodsman": "advanced_woodsman",
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
  const inventorySource = fs.readFileSync(path.join(root, "src", "js", "inventory.js"), "utf8");
  const targetSource = fs.readFileSync(path.join(root, "src", "js", "interactions", "target-interaction-registry.js"), "utf8");
  const npcDialogueCatalogSource = fs.readFileSync(path.join(root, "src", "js", "content", "npc-dialogue-catalog.js"), "utf8");
  const npcDialogueRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "npc-dialogue-runtime.js"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "manifest.json"), "utf8"));
  const starterTown = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "regions", "starter_town.json"), "utf8"));
  const tutorialIsland = JSON.parse(fs.readFileSync(path.join(root, "content", "world", "regions", "tutorial_island.json"), "utf8"));

  assert(Array.isArray(manifest.worlds) && manifest.worlds.length === 2, "proof pass should register starter town and tutorial island");
  assert(manifest.worlds.some((entry) => entry && entry.worldId === "tutorial_island"), "proof pass should register tutorial island");
  assert(coreSource.includes("function travelToWorld(worldId, options = {})"), "core should define travelToWorld");
  assert(coreSource.includes("window.travelToWorld = travelToWorld;"), "core should expose travelToWorld on window");
  assert(coreSource.includes("worldAdapterRuntime.resolveTravelTarget"), "core world travel should delegate target resolution through the typed adapter");
  assert(coreSource.includes("function qaListWorlds()"), "core should expose QA world listing");
  assert(coreSource.includes("function qaTravelWorld(worldIdLike)"), "core should expose QA world travel");
  assert(coreSource.includes("/qa worlds, /qa travel <worldId>"), "QA help should document world travel commands");
  assert(adapterSource.includes("matchQaWorld"), "legacy world adapter should expose QA world matching");

  const loadCall = coreSource.indexOf("const loadProgressResult = loadProgressFromStorage();");
  const activateCall = coreSource.indexOf("worldAdapterRuntime.activateWorldContext(startupRequestedWorldId, STARTER_WORLD_ID)");
  const initCall = coreSource.indexOf("if (typeof window.initLogicalMap === 'function') window.initLogicalMap();");
  assert(loadCall !== -1, "core startup should still load progress");
  assert(activateCall !== -1, "core startup should activate the saved world through the typed adapter before map init");
  assert(initCall !== -1, "core startup should initialize the world map");
  assert(loadCall < activateCall && activateCall < initCall, "startup should activate the current world after loading progress and before initLogicalMap");
  assert(coreSource.includes("const TUTORIAL_WORLD_ID = 'tutorial_island';"), "core should define the tutorial island world id");
  assert(coreSource.includes("const TUTORIAL_EXIT_STEP = 7;"), "core should define the tutorial exit gate step");
  assert(coreSource.includes("const isFreshProfileStartup = !(loadProgressResult && loadProgressResult.loaded);"), "core should detect fresh profile startup");
  assert(coreSource.includes("? TUTORIAL_WORLD_ID"), "fresh profile startup should route to tutorial island");
  assert(coreSource.includes("sourceWorldId === TUTORIAL_WORLD_ID && resolvedWorldId === STARTER_WORLD_ID"), "tutorial completion should only trigger when leaving tutorial for starter town");
  assert(coreSource.includes("window.TutorialRuntime = {"), "tutorial progression should be exposed to dialogue runtime");
  assert(coreSource.includes("Finish the Tutorial Island instructors before leaving for Starter Town."), "tutorial travel should be blocked until lessons are complete");
  assert(coreSource.includes("saveProgressToStorage('tutorial_complete')"), "tutorial completion should be persisted immediately");

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
  assert(npcDialogueRuntimeSource.includes("window.TutorialRuntime.buildNpcDialogueView"), "npc dialogue runtime should allow tutorial-specific gated dialogue");
  assert(npcDialogueRuntimeSource.includes("optionWorldId || npcWorldId"), "npc dialogue runtime should allow travel options to carry explicit destinations");
  assert(dialogueCatalog && typeof dialogueCatalog.resolveDialogueId === "function", "npc dialogue catalog should expose resolveDialogueId");

  const starterTravel = (starterTown.services || []).find((service) => service && service.serviceId === "merchant:starter_caravan_guide");
  const eastOutpostTravel = (starterTown.services || []).find((service) => service && service.serviceId === "merchant:east_outpost_caravan_guide");
  assert(starterTravel && starterTravel.travelToWorldId === "starter_town", "starter town should route to the east outpost through starter_town");
  assert(starterTravel && starterTravel.travelSpawn && starterTravel.travelSpawn.x === 364 && starterTravel.travelSpawn.y === 262, "starter town should route to the east outpost spawn");
  assert(eastOutpostTravel && eastOutpostTravel.travelToWorldId === "starter_town", "east outpost should route back into starter town");
  assert(eastOutpostTravel && eastOutpostTravel.travelSpawn && eastOutpostTravel.travelSpawn.x === 205 && eastOutpostTravel.travelSpawn.y === 210, "east outpost should route back to the starter-town square");
  const tutorialGuide = (tutorialIsland.services || []).find((service) => service && service.serviceId === "merchant:tutorial_guide");
  assert(tutorialGuide && tutorialGuide.action === "Talk-to", "tutorial guide should require dialogue before travel");
  assert(tutorialGuide.travelToWorldId === "starter_town", "tutorial guide should send players to starter town");
  assert(tutorialGuide.travelSpawn && tutorialGuide.travelSpawn.x === 205 && tutorialGuide.travelSpawn.y === 210, "tutorial guide should target the starter-town square");
  assert(dialogueCatalog.resolveDialogueId(tutorialGuide.dialogueId) === "tutorial_guide", "tutorial guide dialogue id should resolve");
  ["tutorial_woodcutting_instructor", "tutorial_fishing_instructor", "tutorial_firemaking_instructor", "tutorial_mining_smithing_instructor", "tutorial_combat_instructor", "tutorial_bank_tutor"].forEach((dialogueId) => {
    assert(dialogueCatalog.resolveDialogueId(dialogueId) === dialogueId, `${dialogueId} should resolve`);
  });
  Object.entries(STARTER_TOWN_NAMED_NPC_DIALOGUES).forEach(([serviceId, expectedDialogueId]) => {
    const service = (starterTown.services || []).find((entry) => entry && entry.serviceId === serviceId);
    assert(!!service, `starter-town named NPC service missing: ${serviceId}`);
    const dialogueId = service && typeof service.dialogueId === "string" ? service.dialogueId.trim() : "";
    assert(dialogueId, `${serviceId} should define dialogueId for Talk-to`);
    assert(dialogueCatalog.resolveDialogueId(dialogueId) === expectedDialogueId, `${serviceId} dialogueId should resolve to ${expectedDialogueId}`);
  });
  assert(
    dialogueCatalog.resolveDialogueIdFromNpc({ name: "Forester Teacher" }) === "forester_teacher",
    "forester teacher should resolve through normalized NPC-name fallback"
  );
  const foresterTeacherDialogue = dialogueCatalog.getDialogueEntryByNpc({ name: "Forester Teacher" });
  assert(!!foresterTeacherDialogue, "forester teacher dialogue entry should resolve from normalized NPC-name fallback");
  assert(foresterTeacherDialogue.title === "Forester Teacher", "forester teacher dialogue title mismatch");
  assert(
    foresterTeacherDialogue.greeting === "A clean cut starts before the swing. What do you need to know?",
    "forester teacher dialogue greeting mismatch"
  );
  assert(
    foresterTeacherDialogue.options.map((option) => option && option.kind).join(",") === "text,text,trade,close",
    "forester teacher dialogue should keep the authored talk and trade option flow"
  );
  assert(
    foresterTeacherDialogue.options.some((option) => option && option.label === "Ask about trees"),
    "forester teacher dialogue should keep the tree-guidance branch"
  );
  const advancedWoodsmanDialogue = dialogueCatalog.getDialogueEntryByNpc({ merchantId: "advanced_woodsman" });
  assert(!!advancedWoodsmanDialogue, "advanced woodsman dialogue entry should resolve from merchant metadata");
  assert(advancedWoodsmanDialogue.title === "Advanced Woodsman", "advanced woodsman dialogue title mismatch");
  assert(
    advancedWoodsmanDialogue.greeting === "Good timber tells the truth. Most people are too busy hacking to hear it.",
    "advanced woodsman dialogue greeting mismatch"
  );
  assert(
    advancedWoodsmanDialogue.options.map((option) => option && option.kind).join(",") === "text,text,trade,close",
    "advanced woodsman dialogue should keep the authored talk and trade option flow"
  );
  assert(
    advancedWoodsmanDialogue.options.some((option) => option && option.label === "Ask about grain"),
    "advanced woodsman dialogue should keep the grain guidance branch"
  );
  assert((starterTown.services || []).some((entry) => entry && entry.merchantId === "tanner_rusk" && String(entry.appearanceId || "").trim().toLowerCase() === "tanner_rusk"), "starter-town Tanner should keep the exact tanner_rusk appearance id");
  const tutorialGuideDialogue = dialogueCatalog.getDialogueEntryByNpc({ name: "Tutorial Guide" });
  assert(!!tutorialGuideDialogue, "tutorial guide dialogue entry should resolve from NPC name");
  assert(tutorialGuideDialogue.options.map((option) => option && option.kind).join(",") === "text,text,close", "static tutorial guide dialogue should not expose immediate travel");
  assert(coreSource.includes("label: 'Leave for Starter Town'"), "dynamic tutorial guide dialogue should expose exit travel after completion");
  assert(coreSource.includes("travelToWorldId: STARTER_WORLD_ID"), "dynamic tutorial exit option should carry the starter-town target");
  assert(coreSource.includes("travelSpawn: { x: 205, y: 210, z: 0 }"), "dynamic tutorial exit option should carry the starter-town spawn");
  assert(!coreSource.includes("makeTutorialStepOption('Open the first gate'"), "tutorial guide should not expose a text option to open the first gate");
  assert(coreSource.includes("setTutorialStep(1, 'tutorial_arrival_welcome')"), "tutorial guide welcome should advance the arrival step naturally");
  assert(coreSource.includes("if (step === 2) ensureTutorialItem('small_net', 1);"), "fishing instructor should grant the net before the completion check");
  assert(coreSource.includes("if (step === 4) {\n                    ensureTutorialItem('bronze_pickaxe', 1);\n                    ensureTutorialItem('hammer', 1);"), "mining instructor should grant tools before the completion check");
  assert(coreSource.includes("if (step === 5) {\n                    ensureTutorialItem('bronze_sword', 1);\n                    ensureTutorialItem('cooked_shrimp', 2);"), "combat instructor should grant starter combat supplies before the completion check");
  assert(coreSource.includes("if (step === 6) ensureTutorialItem('coins', 1);"), "bank tutor should grant the tutorial token before the completion check");
  assert(worldSource.includes("function isTutorialGateLocked(door)"), "world runtime should keep tutorial gates locked until their required step");
  assert(worldSource.includes("WOODEN_GATE_CLOSED"), "world runtime should handle closed wooden tutorial gates");
  assert(worldSource.includes("WOODEN_GATE_OPEN"), "world runtime should handle open wooden tutorial gates");
  assert(worldSource.includes("function createFenceVisualGroup"), "world runtime should render real fence tiles");
  assert(worldSource.includes("function updateTutorialRoofVisibility"), "world runtime should fade tutorial cabin roofs while the player is inside");
  assert(inputSource.includes("window.isTutorialGateLocked(door)"), "input handler should block direct locked tutorial gate toggles");
  assert(inputSource.includes("TileId.WOODEN_GATE_OPEN"), "input handler should open wooden gates as wooden gate tiles");
  assert(inventorySource.includes("window.TutorialRuntime.recordBankAction"), "bank runtime should report tutorial deposit and withdraw evidence");

  console.log("World travel proof passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
