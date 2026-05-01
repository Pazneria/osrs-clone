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
  assert(runtimeSource.includes("label: 'Leave for Starter Town'"), "tutorial runtime should own the dynamic tutorial exit option");
  assert(runtimeSource.includes("setTutorialStep({ context }, 1, 'tutorial_arrival_welcome')"), "tutorial runtime should own arrival-step advancement");
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
      tutorialBankWithdrawSource: null
    },
    tutorialExitStep: 7,
    tutorialActiveBounds: { xMin: 140, xMax: 255, yMin: 135, yMax: 195, z: 0 },
    tutorialRecoverySpawns: [
      { x: 157, y: 157, z: 0 },
      { x: 171, y: 157, z: 0 },
      { x: 187, y: 156, z: 0 }
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
  assert(guideView.title === "Tutorial Guide", "tutorial guide dialogue should resolve");
  assert(context.playerProfileState.tutorialStep === 1, "tutorial guide welcome should advance step zero");
  assert(grants.some((entry) => entry.itemId === "bronze_axe"), "tutorial guide should grant the starter axe");
  assert(saves.includes("tutorial_arrival_welcome"), "tutorial guide advancement should persist progress");
  assert(gateRefreshes.length === 1, "tutorial guide advancement should refresh tutorial gates");

  assert(runtime.isInsideActiveBounds(context, 140, 135, 0), "tutorial bounds should include the lower corner");
  assert(runtime.isInsideActiveBounds(context, 255, 195, 0), "tutorial bounds should include the upper corner");
  assert(!runtime.isInsideActiveBounds(context, 139, 135, 0), "tutorial bounds should reject outside x");
  assert(runtime.isWalkTileAllowed(context, 150, 150, 0), "tutorial walk gate should allow tiles inside active bounds");
  assert(!runtime.isWalkTileAllowed(context, 100, 150, 0), "tutorial walk gate should reject unfinished tutorial tiles outside active bounds");
  const recoverySpawn = runtime.getRecoverySpawnForStep(context, 2);
  assert(recoverySpawn.x === 187 && recoverySpawn.y === 156, "tutorial runtime should resolve recovery spawn by step");
  recoverySpawn.x = 999;
  assert(context.tutorialRecoverySpawns[2].x === 187, "tutorial recovery spawn lookup should clone authored spawn data");

  inventoryCounts.logs = 1;
  const woodcuttingView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_woodcutting_instructor" }, null);
  const completionOption = woodcuttingView.options.find((option) => option && option.kind === "tutorial");
  assert(completionOption, "woodcutting instructor should expose a completion option");
  const completionResult = completionOption.onSelect({ refreshDialogue: () => {} });
  assert(completionResult.refresh === true, "tutorial completion options should request dialogue refresh");
  assert(context.playerProfileState.tutorialStep === 2, "woodcutting completion should advance to fishing");

  context.playerProfileState.tutorialStep = 6;
  const bankView = runtime.buildNpcDialogueView(context, { dialogueId: "tutorial_bank_tutor" }, null);
  assert(grants.some((entry) => entry.itemId === "coins"), "bank tutor should grant the tutorial coin");
  assert(bankView.options.some((option) => option && option.label === "I used both bank booths"), "bank tutor should expose proof check");
  assert(runtime.recordBankAction(context, "deposit", "booth:a", "coins", 1) === true, "deposit proof should record");
  assert(runtime.recordBankAction(context, "withdraw", "booth:b", "coins", 1) === true, "withdraw proof should record from a different booth");

  context.playerProfileState.tutorialStep = 7;
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
