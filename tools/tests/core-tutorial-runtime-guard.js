const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "core-tutorial-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(runtimeSource.includes("window.CoreTutorialRuntime"), "tutorial runtime should expose a window runtime");
  assert(runtimeSource.includes("function buildNpcDialogueView"), "tutorial runtime should own dynamic tutorial dialogue");
  assert(runtimeSource.includes("function makeTutorialCheckOption"), "tutorial runtime should own tutorial completion option builders");
  assert(runtimeSource.includes("function recordTutorialBankAction"), "tutorial runtime should own tutorial bank proof mutation");
  assert(runtimeSource.includes("function isInsideActiveBounds"), "tutorial runtime should own tutorial active bounds checks");
  assert(runtimeSource.includes("function isWalkTileAllowed"), "tutorial runtime should own tutorial walk gating");
  assert(runtimeSource.includes("function getRecoverySpawnForStep"), "tutorial runtime should own tutorial recovery spawn lookup");
  assert(runtimeSource.includes("function getGuidanceMarker"), "tutorial runtime should own tutorial objective marker selection");
  assert(runtimeSource.includes("function markCurrentTutorialNpcVisit"), "tutorial runtime should remember when each step NPC has been visited");
  assert(runtimeSource.includes("targetNpcSpawnId"), "tutorial guidance markers should carry NPC target metadata");
  assert(runtimeSource.includes("label: 'Leave for Starter Town'"), "tutorial runtime should own the dynamic tutorial exit option");
  assert(runtimeSource.includes("'I am ready'") && runtimeSource.includes("setTutorialStep({ context }, step, reason)"), "tutorial runtime should own explicit arrival readiness advancement");
  assert(runtimeSource.includes("context.ensureTutorialItem('small_net', 1);"), "tutorial runtime should own fishing supply grants");
  assert(runtimeSource.includes("context.ensureTutorialItem('bronze_pickaxe', 1);"), "tutorial runtime should own mining supply grants");
  assert(runtimeSource.includes("context.ensureTutorialItem('bronze_sword', 1);"), "tutorial runtime should own combat supply grants");
  assert(runtimeSource.includes("context.ensureTutorialItem('coins', 1);"), "tutorial runtime should own banking proof supply grants");

  assert(manifestSource.indexOf('id: "core-tutorial-runtime"') !== -1, "legacy manifest should include the tutorial runtime");
  assert(
    manifestSource.indexOf('id: "core-player-entry-runtime"') < manifestSource.indexOf('id: "core-tutorial-runtime"')
      && manifestSource.indexOf('id: "core-tutorial-runtime"') < manifestSource.indexOf('id: "core"'),
    "legacy manifest should load tutorial runtime before core.js"
  );
  assert(coreSource.includes("const coreTutorialRuntime = window.CoreTutorialRuntime || null;"), "core.js should resolve the tutorial runtime");
  assert(coreSource.includes("coreTutorialRuntime.buildNpcDialogueView(buildTutorialRuntimeContext(), npc, baseView)"), "core.js should delegate tutorial dialogue");
  assert(coreSource.includes("coreTutorialRuntime.recordBankAction(buildTutorialRuntimeContext(), kind, sourceKey, itemId, amountChanged)"), "core.js should delegate tutorial bank proof");
  assert(coreSource.includes("coreTutorialRuntime.isInsideActiveBounds(buildTutorialRuntimeContext(), x, y, z)"), "core.js should delegate tutorial active bounds checks");
  assert(coreSource.includes("coreTutorialRuntime.isWalkTileAllowed(buildTutorialRuntimeContext(), x, y, z)"), "core.js should delegate tutorial walk gating");
  assert(coreSource.includes("coreTutorialRuntime.getRecoverySpawnForStep(buildTutorialRuntimeContext(), step)"), "core.js should delegate tutorial recovery spawns");
  assert(coreSource.includes("coreTutorialRuntime.getGuidanceMarker(buildTutorialRuntimeContext())"), "core.js should delegate tutorial objective marker selection");
  assert(!coreSource.includes("function makeTutorialTextOption"), "core.js should not own tutorial text option construction");
  assert(!coreSource.includes("function makeTutorialCheckOption"), "core.js should not own tutorial completion option construction");
  assert(!coreSource.includes("function buildTutorialDialogueView"), "core.js should not own dynamic tutorial dialogue");
  assert(!coreSource.includes("label: 'Leave for Starter Town'"), "core.js should not own the tutorial exit dialogue option");
  assert(!coreSource.includes("return z === TUTORIAL_ACTIVE_BOUNDS.z"), "core.js should not own tutorial active bounds logic inline");
  assert(!coreSource.includes("const safeStep = Math.max(0, Math.min(TUTORIAL_EXIT_STEP"), "core.js should not own tutorial recovery spawn step clamping inline");

  const sandbox = { window: {}, Date, Number, Math, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CoreTutorialRuntime;
  assert(runtime, "tutorial runtime should execute in isolation");

  const saves = [];
  const grants = [];
  const gateRefreshes = [];
  const inventoryCounts = { logs: 0, raw_shrimp: 0, cooked_shrimp: 0, coins: 1 };
  const skills = { attack: 0, strength: 0, defense: 0 };
  const context = {
    playerProfileState: {
      tutorialStep: 0,
      tutorialBankDepositSource: null,
      tutorialBankWithdrawSource: null,
      tutorialInstructorVisits: {}
    },
    tutorialExitStep: 7,
    tutorialActiveBounds: { xMin: 72, xMax: 340, yMin: 76, yMax: 266, z: 0 },
    tutorialRecoverySpawns: [
      { x: 157, y: 157, z: 0 },
      { x: 203, y: 152, z: 0 },
      { x: 236, y: 171, z: 0 }
    ],
    mainOverworldWorldId: "main_overworld",
    isTutorialWorldActive: () => true,
    ensureTutorialItem: (itemId, amount) => grants.push({ itemId, amount }),
    getInventoryItemCount: (itemId) => inventoryCounts[itemId] || 0,
    getSkillXp: (skillId) => skills[skillId] || 0,
    hasTutorialBankProof: () => !!(context.playerProfileState.tutorialBankDepositSource && context.playerProfileState.tutorialBankWithdrawSource),
    saveProgressToStorage: (reason) => saves.push(reason),
    refreshTutorialGateStates: () => gateRefreshes.push("refresh")
  };

  const guideView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_guide", name: "Tutorial Guide" }, null);
  const arrivalMarker = runtime.getGuidanceMarker(context);
  assert(arrivalMarker && arrivalMarker.markerId === "tutorial:step0:tutorial_guide", "step zero guidance should point at the Tutorial Guide");
  assert(arrivalMarker.x === 185 && arrivalMarker.y === 232, "step zero guidance should use the live arrival cabin Guide tile");
  assert(guideView.title === "Tutorial Guide", "tutorial guide dialogue should resolve");
  const guideGreetingText = Array.isArray(guideView.greeting) ? guideView.greeting.join(" ") : String(guideView.greeting || "");
  assert(Array.isArray(guideView.greeting) && guideView.greeting.length >= 2, "tutorial guide greeting should support multiple dialogue pages");
  assert(!guideGreetingText.includes("each fenced yard"), "tutorial guide greeting should avoid the old fenced-yard wording");
  assert(!guideGreetingText.includes("safe room"), "tutorial guide greeting should not frame the cabin as a safe room");
  assert(guideGreetingText.includes("arrival cabin"), "tutorial guide greeting should frame the cabin as the arrival cabin");
  assert(guideGreetingText.includes("Welcome, traveler!"), "tutorial guide greeting should open with a warm host line");
  assert(context.playerProfileState.tutorialStep === 0, "tutorial guide greeting should wait for explicit readiness before advancing step zero");
  assert(!grants.some((entry) => entry.itemId === "bronze_axe"), "tutorial guide greeting should not grant the starter axe before the ready choice");
  const movementOption = guideView.options.find((option) => option && option.label === "Ask about movement");
  assert(movementOption && Array.isArray(movementOption.response) && movementOption.response.length >= 2, "tutorial guide movement option should support paged guidance");
  const readyOption = guideView.options.find((option) => option && option.label === "I am ready");
  assert(readyOption && readyOption.kind === "tutorial", "tutorial guide should expose an explicit ready option");
  const readyResult = readyOption.onSelect({ refreshDialogue: () => {} });
  assert(readyResult.refresh === true, "tutorial ready option should request dialogue refresh");
  const readyBodyText = Array.isArray(readyResult.bodyText) ? readyResult.bodyText.join(" ") : String(readyResult.bodyText || "");
  assert(Array.isArray(readyResult.bodyText) && readyResult.bodyText.length >= 2, "tutorial ready option should show multiple follow-up text boxes before sending the player onward");
  assert(readyBodyText.includes("Good luck") && readyBodyText.includes("bronze axe"), "tutorial ready option should show a follow-up welcome text box before sending the player onward");
  assert(context.playerProfileState.tutorialStep === 1, "tutorial ready option should advance step zero");
  assert(grants.some((entry) => entry.itemId === "bronze_axe"), "tutorial guide should grant the starter axe");
  assert(saves.includes("tutorial_arrival_welcome"), "tutorial guide advancement should persist progress");
  assert(gateRefreshes.length === 1, "tutorial guide advancement should refresh tutorial gates");
  const firstNpcMarker = runtime.getGuidanceMarker(context);
  assert(firstNpcMarker && firstNpcMarker.markerId === "tutorial:step1:woodcutting_instructor", "step one guidance should point at the next NPC before the task object");
  assert(firstNpcMarker.targetNpcSpawnId === "npc:tutorial_woodcutting_instructor", "NPC guidance markers should carry a live NPC spawn target");
  const firstWoodcuttingView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_woodcutting_instructor", name: "Woodcutting Instructor" }, null);
  assert(context.playerProfileState.tutorialInstructorVisits["1"] === true, "speaking to the step NPC should mark that instructor visited");
  assert(saves.includes("tutorial_instructor_visit"), "speaking to a step NPC should persist guidance visit state");
  const firstTreeMarker = runtime.getGuidanceMarker(context);
  assert(firstTreeMarker && firstTreeMarker.markerId === "tutorial:step1:tutorial_tree", "step one guidance should point at a tutorial tree after the instructor has been visited");

  assert(runtime.isInsideActiveBounds(context, 72, 76, 0), "tutorial bounds should include the lower corner");
  assert(runtime.isInsideActiveBounds(context, 340, 266, 0), "tutorial bounds should include the upper corner");
  assert(!runtime.isInsideActiveBounds(context, 71, 76, 0), "tutorial bounds should reject outside x");
  assert(runtime.isWalkTileAllowed(context, 150, 150, 0), "tutorial walk gate should allow tiles inside active bounds");
  assert(!runtime.isWalkTileAllowed(context, 50, 150, 0), "tutorial walk gate should reject unfinished tutorial tiles outside active bounds");
  const recoverySpawn = runtime.getRecoverySpawnForStep(context, 2);
  assert(recoverySpawn.x === 236 && recoverySpawn.y === 171, "tutorial runtime should resolve recovery spawn by step");
  recoverySpawn.x = 999;
  assert(context.tutorialRecoverySpawns[2].x === 236, "tutorial recovery spawn lookup should clone authored spawn data");

  inventoryCounts.logs = 1;
  const woodcuttingReturnMarker = runtime.getGuidanceMarker(context);
  assert(woodcuttingReturnMarker && woodcuttingReturnMarker.markerId === "tutorial:step1:woodcutting_instructor", "step one guidance should return to the woodcutting instructor once logs exist");
  const woodcuttingView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_woodcutting_instructor", name: "Woodcutting Instructor" }, null);
  const woodcuttingGreeting = Array.isArray(woodcuttingView.greeting) ? woodcuttingView.greeting.join(" ") : String(woodcuttingView.greeting || "");
  assert(woodcuttingGreeting.includes("renewable resource"), "woodcutting instructor should frame trees as renewable resources");
  const choppingOption = woodcuttingView.options.find((option) => option && option.label === "Ask about chopping");
  const choppingText = Array.isArray(choppingOption.response) ? choppingOption.response.join(" ") : String(choppingOption && choppingOption.response || "");
  assert(choppingText.includes("stump") && choppingText.includes("inventory"), "woodcutting guidance should mention inventory logs and stumps");
  const completionOption = woodcuttingView.options.find((option) => option && option.kind === "tutorial");
  assert(completionOption, "woodcutting instructor should expose a completion option");
  const completionResult = completionOption.onSelect({ refreshDialogue: () => {} });
  assert(completionResult.refresh === true, "tutorial completion options should request dialogue refresh");
  const completionText = Array.isArray(completionResult.bodyText) ? completionResult.bodyText.join(" ") : String(completionResult.bodyText || "");
  assert(completionText.includes("pond") && completionText.includes("Survival Field"), "woodcutting completion should point naturally to the survival pond");
  assert(context.playerProfileState.tutorialStep === 2, "woodcutting completion should advance to fishing");
  const firstFishingNpcMarker = runtime.getGuidanceMarker(context);
  assert(firstFishingNpcMarker && firstFishingNpcMarker.markerId === "tutorial:step2:fishing_instructor", "step two guidance should point at the Fishing Instructor before the pond");
  runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_fishing_instructor", name: "Fishing Instructor" }, null);
  const pondMarker = runtime.getGuidanceMarker(context);
  assert(pondMarker && pondMarker.markerId === "tutorial:step2:pond", "step two guidance should point at the pond after the instructor has been visited");
  inventoryCounts.raw_shrimp = 1;
  const fishingReturnMarker = runtime.getGuidanceMarker(context);
  assert(fishingReturnMarker && fishingReturnMarker.markerId === "tutorial:step2:fishing_instructor", "step two guidance should return to the fishing instructor once raw shrimp exists");
  assert(fishingReturnMarker.x === 365 && fishingReturnMarker.y === 320, "step two return guidance should use the southern-bank Fishing Instructor tile");
  context.playerProfileState.tutorialStep = 3;
  const firstFiremakingNpcMarker = runtime.getGuidanceMarker(context);
  assert(firstFiremakingNpcMarker && firstFiremakingNpcMarker.markerId === "tutorial:step3:firemaking_instructor", "step three guidance should point at the Firemaking Instructor before the clearing");
  runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_firemaking_instructor", name: "Firemaking Instructor" }, null);
  const fireClearingMarker = runtime.getGuidanceMarker(context);
  assert(fireClearingMarker && fireClearingMarker.markerId === "tutorial:step3:fire_clearing", "step three guidance should point at the fire clearing with raw shrimp ready after the instructor visit");
  inventoryCounts.cooked_shrimp = 1;
  const firemakingReturnMarker = runtime.getGuidanceMarker(context);
  assert(firemakingReturnMarker && firemakingReturnMarker.markerId === "tutorial:step3:firemaking_instructor", "step three guidance should return to the firemaking instructor after cooked or burnt shrimp exists");

  context.playerProfileState.tutorialStep = 6;
  const bankView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_bank_tutor" }, null);
  assert(grants.some((entry) => entry.itemId === "coins"), "bank tutor should grant the tutorial coin");
  assert(bankView.options.some((option) => option && option.label === "I used both bank booths"), "bank tutor should expose proof check");
  const bankDepositMarker = runtime.getGuidanceMarker(context);
  assert(bankDepositMarker && bankDepositMarker.markerId === "tutorial:step6:bank_deposit", "step six guidance should start at the first bank booth");
  assert(runtime.recordBankAction(context, "deposit", "booth:a", "coins", 1) === true, "deposit proof should record");
  const bankWithdrawMarker = runtime.getGuidanceMarker(context);
  assert(bankWithdrawMarker && bankWithdrawMarker.markerId === "tutorial:step6:bank_withdraw", "step six guidance should move to the second bank booth after deposit");
  assert(runtime.recordBankAction(context, "withdraw", "booth:b", "coins", 1) === true, "withdraw proof should record from a different booth");
  const bankTutorMarker = runtime.getGuidanceMarker(context);
  assert(bankTutorMarker && bankTutorMarker.markerId === "tutorial:step6:bank_tutor", "step six guidance should return to the bank tutor after both booth actions");

  context.playerProfileState.tutorialStep = 7;
  const exitMarker = runtime.getGuidanceMarker(context);
  assert(exitMarker && exitMarker.markerId === "tutorial:step7:exit_guide", "exit-ready guidance should point at the exit Tutorial Guide");
  const exitView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_guide" }, null);
  const travelOption = exitView.options.find((option) => option && option.kind === "travel");
  assert(travelOption && travelOption.travelToWorldId === "main_overworld", "tutorial exit option should travel to main overworld");
  assert(runtime.isExitUnlocked(context), "tutorial runtime should report exit unlocked at the final step");

  console.log("Core tutorial runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
