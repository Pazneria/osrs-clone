const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "core-tutorial-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/core-tutorial-runtime.js");
  const coreSource = readRepoFile(root, "src/js/core.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");

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
  assert(runtimeSource.includes("context.ensureTutorialItem('wooden_handle_strapped', 1);"), "tutorial runtime should own real sword-handle component grants");
  assert(!runtimeSource.includes("context.ensureTutorialItem('bronze_sword', 1);"), "combat instructor should not hand out a finished bronze sword");
  assert(runtimeSource.includes("context.ensureTutorialItem('normal_shortbow_u', 1);"), "tutorial runtime should own ranged unstrung bow component grants");
  assert(runtimeSource.includes("context.ensureTutorialItem('bow_string', 1);"), "tutorial runtime should own ranged bow string grants");
  assert(runtimeSource.includes("context.ensureTutorialItem('wooden_headless_arrows', 1);"), "tutorial runtime should own ranged headless-arrow component grants");
  assert(!runtimeSource.includes("context.ensureTutorialItem('bronze_arrowheads', 1);"), "ranged instructor should not hand out arrowheads that belong to the smithing lesson");
  assert(!runtimeSource.includes("context.ensureTutorialItem('normal_shortbow', 1);"), "ranged instructor should not hand out a finished shortbow");
  assert(!runtimeSource.includes("context.ensureTutorialItem('bronze_arrows', 150);"), "ranged instructor should not hand out finished bronze arrows");
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
  const inventoryCounts = { logs: 0, raw_shrimp: 0, cooked_shrimp: 0, coins: 1, ember_rune: 0, soft_clay: 0, imprinted_ring_mould: 0 };
  const equipmentCounts = {};
  const skills = { attack: 0, strength: 0, defense: 0, ranged: 0, magic: 0, runecrafting: 0, crafting: 0 };
  const context = {
    playerProfileState: {
      tutorialStep: 0,
      tutorialBankDepositSource: null,
      tutorialBankWithdrawSource: null,
      tutorialInstructorVisits: {}
    },
    tutorialExitStep: 11,
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
    getEquipmentItemCount: (itemId) => equipmentCounts[itemId] || 0,
    getSkillXp: (skillId) => skills[skillId] || 0,
    hasTutorialBankProof: () => !!(context.playerProfileState.tutorialBankDepositSource && context.playerProfileState.tutorialBankWithdrawSource),
    saveProgressToStorage: (reason) => saves.push(reason),
    refreshTutorialGateStates: () => gateRefreshes.push("refresh")
  };

  const guideView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_guide", name: "Tutorial Guide" }, null);
  const arrivalMarker = runtime.getGuidanceMarker(context);
  assert(arrivalMarker && arrivalMarker.markerId === "tutorial:step0:tutorial_guide", "step zero guidance should point at the Tutorial Guide");
  assert(arrivalMarker.x === 215 && arrivalMarker.y === 253, "step zero guidance should use the live arrival cabin Guide tile");
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
  const movementText = movementOption.response.join(" ");
  assert(movementText.includes("Use") && movementText.includes("inventory"), "movement guidance should explain item-on-item and item-on-world use");
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
  runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_woodcutting_instructor", name: "Woodcutting Instructor" }, null);
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
  assert(fishingReturnMarker.x === 357 && fishingReturnMarker.y === 321, "step two return guidance should use the southern-bank Fishing Instructor tile");
  context.playerProfileState.tutorialStep = 3;
  const firstFiremakingNpcMarker = runtime.getGuidanceMarker(context);
  assert(firstFiremakingNpcMarker && firstFiremakingNpcMarker.markerId === "tutorial:step3:firemaking_instructor", "step three guidance should point at the Firemaking Instructor before the clearing");
  runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_firemaking_instructor", name: "Firemaking Instructor" }, null);
  const fireClearingMarker = runtime.getGuidanceMarker(context);
  assert(fireClearingMarker && fireClearingMarker.markerId === "tutorial:step3:fire_clearing", "step three guidance should point at the fire clearing with raw shrimp ready after the instructor visit");
  inventoryCounts.cooked_shrimp = 1;
  const firemakingReturnMarker = runtime.getGuidanceMarker(context);
  assert(firemakingReturnMarker && firemakingReturnMarker.markerId === "tutorial:step3:firemaking_instructor", "step three guidance should return to the firemaking instructor after cooked or burnt shrimp exists");

  context.playerProfileState.tutorialStep = 4;
  const miningView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_mining_smithing_instructor" }, null);
  const metalOption = miningView.options.find((option) => option && option.label === "Ask about mining and smithing");
  const metalText = Array.isArray(metalOption.response) ? metalOption.response.join(" ") : String(metalOption && metalOption.response || "");
  assert(metalText.includes("three bronze bars") && metalText.includes("Bronze Sword Blade") && metalText.includes("Bronze Arrowheads") && metalText.includes("Wooden Handle w/ Strap"), "mining and smithing guidance should name the real sword and arrowhead production choices");
  const metalCompletion = miningView.options.find((option) => option && option.label === "I made a sword and arrowheads");
  assert(metalCompletion, "mining and smithing instructor should require both sword and arrowhead proof");
  inventoryCounts.bronze_sword = 1;
  let metalResult = metalCompletion.onSelect({ refreshDialogue: () => {} });
  assert(metalResult.refresh === true && context.playerProfileState.tutorialStep === 4, "mining completion should not accept only a finished sword");
  const arrowheadMarker = runtime.getGuidanceMarker(context);
  assert(arrowheadMarker && arrowheadMarker.markerId === "tutorial:step4:quarry_arrowheads", "step four guidance should keep the player in smithing until arrowheads are forged");
  inventoryCounts.bronze_bar = 1;
  const arrowheadAnvilMarker = runtime.getGuidanceMarker(context);
  assert(arrowheadAnvilMarker && arrowheadAnvilMarker.markerId === "tutorial:step4:anvil_arrowheads", "step four guidance should point a spare bronze bar to the arrowhead anvil recipe");
  inventoryCounts.bronze_arrowheads = 1;
  metalResult = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_mining_smithing_instructor" }, null).options
    .find((option) => option && option.label === "I made a sword and arrowheads")
    .onSelect({ refreshDialogue: () => {} });
  assert(metalResult.refresh === true && context.playerProfileState.tutorialStep === 5, "mining completion should advance only after sword and arrowheads exist");

  context.playerProfileState.tutorialStep = 6;
  const rangedGrantStart = grants.length;
  const rangedView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_ranged_instructor" }, null);
  const rangedGrants = grants.slice(rangedGrantStart);
  assert(rangedGrants.some((entry) => entry.itemId === "normal_shortbow_u"), "ranged instructor should grant a real unstrung shortbow component");
  assert(rangedGrants.some((entry) => entry.itemId === "bow_string"), "ranged instructor should grant a real bow string component");
  assert(rangedGrants.some((entry) => entry.itemId === "wooden_headless_arrows"), "ranged instructor should grant real headless arrows");
  assert(!rangedGrants.some((entry) => entry.itemId === "bronze_arrowheads"), "ranged instructor should rely on the arrowheads forged during smithing");
  const rangedHelpOption = rangedView.options.find((option) => option && option.label === "Ask about ranged combat");
  const rangedHelpText = Array.isArray(rangedHelpOption.response) ? rangedHelpOption.response.join(" ") : String(rangedHelpOption && rangedHelpOption.response || "");
  assert(rangedHelpText.includes("Normal Shortbow (u)") && rangedHelpText.includes("bronze arrows can stay in your pack"), "ranged guidance should explain finishing real gear and inventory ammo use");
  inventoryCounts.normal_shortbow_u = 1;
  inventoryCounts.bow_string = 1;
  inventoryCounts.wooden_headless_arrows = 1;
  inventoryCounts.bronze_arrowheads = 1;
  const stringBowMarker = runtime.getGuidanceMarker(context);
  assert(stringBowMarker && stringBowMarker.markerId === "tutorial:step6:string_shortbow", "step six guidance should point at bow stringing before ranged practice");
  equipmentCounts.normal_shortbow = 1;
  inventoryCounts.bronze_arrows = 1;
  const rangedMarker = runtime.getGuidanceMarker(context);
  assert(rangedMarker && rangedMarker.markerId === "tutorial:step6:ranged_chicken", "step six guidance should point at ranged chicken practice after the real gear is finished, even when the bow is equipped");
  const rangedCompletion = rangedView.options.find((option) => option && option.label === "I landed a ranged hit");
  assert(rangedCompletion, "ranged instructor should expose a ranged completion check");
  let rangedResult = rangedCompletion.onSelect({ refreshDialogue: () => {} });
  assert(rangedResult.refresh === true && context.playerProfileState.tutorialStep === 6, "ranged completion should wait for ranged XP");
  skills.ranged = 1;
  const rangedReturnView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_ranged_instructor" }, null);
  rangedResult = rangedReturnView.options.find((option) => option && option.label === "I landed a ranged hit").onSelect({ refreshDialogue: () => {} });
  assert(rangedResult.refresh === true && context.playerProfileState.tutorialStep === 7, "ranged completion should advance to magic orientation");

  const magicView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_magic_instructor" }, null);
  assert(grants.some((entry) => entry.itemId === "plain_staff_wood"), "magic instructor should grant a plain staff");
  assert(grants.some((entry) => entry.itemId === "ember_rune"), "magic instructor should grant starter ember runes");
  const magicHelpOption = magicView.options.find((option) => option && option.label === "Ask about magic");
  const magicHelpText = Array.isArray(magicHelpOption.response) ? magicHelpOption.response.join(" ") : String(magicHelpOption && magicHelpOption.response || "");
  assert(magicHelpText.includes("uses an ember rune automatically"), "magic guidance should explain staff-driven rune consumption");
  const magicMarker = runtime.getGuidanceMarker(context);
  assert(magicMarker && magicMarker.markerId === "tutorial:step7:magic_chicken", "step seven guidance should point at magic chicken practice after the instructor visit");
  const magicOption = magicView.options.find((option) => option && option.label === "I cast a spell");
  assert(magicOption && magicOption.kind === "tutorial", "magic instructor should expose a spellcast completion check");
  let magicResult = magicOption.onSelect({ refreshDialogue: () => {} });
  assert(magicResult.refresh === true && context.playerProfileState.tutorialStep === 7, "magic completion should wait for Magic XP");
  skills.magic = 1;
  const magicReturnView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_magic_instructor" }, null);
  magicResult = magicReturnView.options.find((option) => option && option.label === "I cast a spell").onSelect({ refreshDialogue: () => {} });
  assert(magicResult.refresh === true && context.playerProfileState.tutorialStep === 8, "magic completion should advance to runecrafting");

  const runecraftingView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_runecrafting_instructor" }, null);
  assert(grants.some((entry) => entry.itemId === "rune_essence"), "runecrafting instructor should grant rune essence");
  const runecraftingHelpOption = runecraftingView.options.find((option) => option && option.label === "Ask about runecrafting");
  const runecraftingHelpText = Array.isArray(runecraftingHelpOption.response) ? runecraftingHelpOption.response.join(" ") : String(runecraftingHelpOption && runecraftingHelpOption.response || "");
  assert(runecraftingHelpText.includes("Craft-rune") && runecraftingHelpText.includes("essence on the altar"), "runecrafting guidance should name both altar interaction paths");
  const runecraftingMarker = runtime.getGuidanceMarker(context);
  assert(runecraftingMarker && runecraftingMarker.markerId === "tutorial:step8:ember_altar", "step eight guidance should point at the tutorial Ember Altar after the instructor visit");
  const runecraftingCompletion = runecraftingView.options.find((option) => option && option.label === "I crafted ember runes");
  assert(runecraftingCompletion, "runecrafting instructor should expose an ember-rune completion check");
  let runecraftingResult = runecraftingCompletion.onSelect({ refreshDialogue: () => {} });
  assert(runecraftingResult.refresh === true && context.playerProfileState.tutorialStep === 8, "runecrafting completion should wait for crafted runes");
  skills.runecrafting = 1;
  const runecraftingReturnView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_runecrafting_instructor" }, null);
  runecraftingResult = runecraftingReturnView.options.find((option) => option && option.label === "I crafted ember runes").onSelect({ refreshDialogue: () => {} });
  assert(runecraftingResult.refresh === true && context.playerProfileState.tutorialStep === 9, "runecrafting completion should advance to crafting");

  const craftingView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_crafting_instructor" }, null);
  assert(grants.some((entry) => entry.itemId === "clay"), "crafting instructor should grant clay");
  assert(grants.some((entry) => entry.itemId === "borrowed_ring"), "crafting instructor should grant a borrowed ring");
  const craftingHelpOption = craftingView.options.find((option) => option && option.label === "Ask about crafting");
  const craftingHelpText = Array.isArray(craftingHelpOption.response) ? craftingHelpOption.response.join(" ") : String(craftingHelpOption && craftingHelpOption.response || "");
  assert(craftingHelpText.includes("borrowed ring in your inventory"), "crafting guidance should clarify the bench is a place, not the clicked target");
  assert(craftingHelpText.includes("bench as your work area"), "crafting guidance should explain the bench is a work-area cue");
  const craftingMarker = runtime.getGuidanceMarker(context);
  assert(craftingMarker && craftingMarker.markerId === "tutorial:step9:pond_soft_clay", "step nine guidance should point at the pond for soft clay");
  const craftingCompletion = craftingView.options.find((option) => option && option.label === "I shaped a mould");
  assert(craftingCompletion, "crafting instructor should expose a mould-shaping completion check");
  let craftingResult = craftingCompletion.onSelect({ refreshDialogue: () => {} });
  assert(craftingResult.refresh === true && context.playerProfileState.tutorialStep === 9, "crafting completion should wait for a shaped mould");
  inventoryCounts.soft_clay = 1;
  const craftingBenchMarker = runtime.getGuidanceMarker(context);
  assert(craftingBenchMarker && craftingBenchMarker.markerId === "tutorial:step9:crafting_bench", "step nine guidance should return to the crafting bench once soft clay exists");
  assert(craftingBenchMarker.label.includes("borrowed ring"), "step nine bench marker should name the inventory target");
  const softClayOnlyView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_crafting_instructor" }, null);
  craftingResult = softClayOnlyView.options.find((option) => option && option.label === "I shaped a mould").onSelect({ refreshDialogue: () => {} });
  assert(craftingResult.refresh === true && context.playerProfileState.tutorialStep === 9, "crafting completion should not accept only soft clay");
  inventoryCounts.imprinted_ring_mould = 1;
  const craftingReturnView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_crafting_instructor" }, null);
  craftingResult = craftingReturnView.options.find((option) => option && option.label === "I shaped a mould").onSelect({ refreshDialogue: () => {} });
  assert(craftingResult.refresh === true && context.playerProfileState.tutorialStep === 10, "crafting completion should advance to banking");

  context.playerProfileState.tutorialStep = 10;
  const bankView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_bank_tutor" }, null);
  assert(grants.some((entry) => entry.itemId === "coins"), "bank tutor should grant the tutorial coin");
  assert(bankView.options.some((option) => option && option.label === "I used both bank booths"), "bank tutor should expose proof check");
  const bankHelpOption = bankView.options.find((option) => option && option.label === "Ask about the bank");
  const bankHelpText = Array.isArray(bankHelpOption.response) ? bankHelpOption.response.join(" ") : String(bankHelpOption && bankHelpOption.response || "");
  assert(bankHelpText.includes("bank grid"), "bank guidance should explain where the withdrawal comes from");
  const bankDepositMarker = runtime.getGuidanceMarker(context);
  assert(bankDepositMarker && bankDepositMarker.markerId === "tutorial:step10:bank_deposit", "step ten guidance should start at the first bank booth");
  assert(runtime.recordBankAction(context, "deposit", "booth:a", "coins", 1) === true, "deposit proof should record");
  const bankWithdrawMarker = runtime.getGuidanceMarker(context);
  assert(bankWithdrawMarker && bankWithdrawMarker.markerId === "tutorial:step10:bank_withdraw", "step ten guidance should move to the second bank booth after deposit");
  assert(runtime.recordBankAction(context, "withdraw", "booth:b", "coins", 1) === true, "withdraw proof should record from a different booth");
  const bankTutorMarker = runtime.getGuidanceMarker(context);
  assert(bankTutorMarker && bankTutorMarker.markerId === "tutorial:step10:bank_tutor", "step ten guidance should return to the bank tutor after both booth actions");

  context.playerProfileState.tutorialStep = 11;
  const exitMarker = runtime.getGuidanceMarker(context);
  assert(exitMarker && exitMarker.markerId === "tutorial:step11:exit_guide", "exit-ready guidance should point at the exit Tutorial Guide");
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
