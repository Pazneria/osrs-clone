const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-player-animation-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/input-player-animation-runtime.js");
  const inputSource = readRepoFile(root, "src/js/input-render.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");

  const poseRuntimeIndex = manifestSource.indexOf('id: "input-pose-editor-runtime"');
  const playerAnimationRuntimeIndex = manifestSource.indexOf('id: "input-player-animation-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-player-animation-runtime.js?raw"), "legacy manifest should import input player animation runtime");
  assert(poseRuntimeIndex !== -1 && playerAnimationRuntimeIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input runtime entries");
  assert(poseRuntimeIndex < playerAnimationRuntimeIndex && playerAnimationRuntimeIndex < inputRenderIndex, "legacy manifest should load input player animation runtime before input-render.js");

  assert(runtimeSource.includes("window.InputPlayerAnimationRuntime"), "input player animation runtime should expose a window runtime");
  assert(runtimeSource.includes("function getActiveSkillBaseClipId"), "input player animation runtime should own skill base clip policy");
  assert(runtimeSource.includes("function buildBaseClipOptions"), "input player animation runtime should own skill held-item clip options");
  assert(runtimeSource.includes("function buildFishingStartActionClipRequest"), "input player animation runtime should own fishing start-action clip policy");
  assert(runtimeSource.includes("function buildCombatAttackActionClipRequest"), "input player animation runtime should own combat action clip policy");
  assert(runtimeSource.includes("function getRangedBowShotFrame"), "input player animation runtime should expose ranged bow-shot timing");

  assert(inputSource.includes("function getInputPlayerAnimationRuntime()"), "input-render.js should resolve the input player animation runtime");
  assert(inputSource.includes("playerAnimationRuntime.buildBaseClipOptions"), "input-render.js should delegate base clip options to the player animation runtime");
  assert(inputSource.includes("playerAnimationRuntime.buildFishingStartActionClipRequest"), "input-render.js should delegate fishing action clip requests to the player animation runtime");
  assert(inputSource.includes("playerAnimationRuntime.buildCombatAttackActionClipRequest"), "input-render.js should delegate combat action clip requests to the player animation runtime");
  assert(inputSource.includes("playerAnimationRuntime.getRangedBowShotFrame"), "input-render.js should delegate bow-shot timing to the player animation runtime");
  assert(!inputSource.includes("function isMiningSkillAction("), "input-render.js should not own skill action clip predicates");
  assert(!inputSource.includes("const FISHING_START_ACTION_REQUEST_WINDOW_MS"), "input-render.js should not own fishing start action timing policy");
  assert(!inputSource.includes("function isHarpoonFishingMethodId("), "input-render.js should not own fishing method animation policy");

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputPlayerAnimationRuntime;
  assert(runtime, "input player animation runtime should execute in isolation");

  assert(runtime.getActiveSkillBaseClipId({ action: "SKILLING: ROCK" }) === "player/mining1", "runtime should map mining to the mining clip");
  assert(runtime.getActiveSkillBaseClipId({ action: "SKILLING: FURNACE" }) === "player/smithing_smelting1", "runtime should map furnace smithing to the smelting clip");
  assert(runtime.getActiveSkillBaseClipId({ action: "SKILLING: ANVIL" }) === "player/smithing_forging1", "runtime should map anvil smithing to the forging clip");
  assert(runtime.getActiveSkillBaseClipId({ action: "SKILLING: WATER", fishingActiveMethodId: "rod" }) === "player/fishing_rod_hold1", "runtime should map rod fishing to the rod hold clip");
  assert(runtime.getActiveSkillBaseClipId({ action: "SKILLING: WATER", fishingActiveMethodId: "rune_harpoon" }) === "player/fishing_harpoon_hold1", "runtime should map harpoon fishing to the harpoon hold clip");
  assert(runtime.getPlayerBaseClipId({ isMoving: true, logicalTilesMoved: 1, isRunning: false }) === "player/walk", "runtime should map normal movement to walk");
  assert(runtime.getPlayerBaseClipId({ isMoving: true, logicalTilesMoved: 1, isRunning: true }) === "player/run", "runtime should map running movement to run");
  assert(runtime.getPlayerBaseClipId({ isMoving: false, playerState: { action: "IDLE" } }) === "player/idle", "runtime should map idle state to idle");
  assert(runtime.getCombatAttackClipDef("melee").clipId === "player/combat_slash", "runtime should keep melee attacks on the slash clip");
  assert(runtime.getCombatAttackClipDef("ranged").clipId === "player/combat_bow_shot", "runtime should map ranged attacks to the bow shot clip");
  const rangedAttackRequest = runtime.buildCombatAttackActionClipRequest({
    rig: { attackStyleFamily: "ranged", attackAnimationStartedAt: 2000 },
    frameNow: 2260,
    isTimedAnimationActive: (startedAt, durationMs, frameNow) => startedAt === 2000 && durationMs === 900 && frameNow === 2260
  });
  assert(rangedAttackRequest.clipId === "player/combat_bow_shot", "runtime should request the ranged bow shot action clip");
  assert(rangedAttackRequest.actionOptions.startKey === "ranged-attack:2000", "runtime should build style-specific combat action start keys");
  const bowShotFrame = runtime.getRangedBowShotFrame({
    rig: { attackStyleFamily: "ranged", attackAnimationStartedAt: 2000 },
    frameNow: 2215
  });
  assert(bowShotFrame && bowShotFrame.drawProgress > 0 && bowShotFrame.released === false, "runtime should expose pre-release bow draw progress");
  assert(bowShotFrame.releaseMs === 560, "runtime bow-shot release timing should match the authored held-draw clip timing");
  assert(runtime.getRangedBowShotFrame({
    rig: { attackStyleFamily: "melee", attackAnimationStartedAt: 2000 },
    frameNow: 2215
  }) === null, "runtime should only expose bow-shot frames for ranged attacks");

  const heldItems = runtime.normalizeSkillAnimationHeldItems({ rightHand: "knife", leftHand: null, ignored: "x" });
  assert(heldItems.rightHand === "knife" && heldItems.leftHand === null && heldItems.ignored === undefined, "runtime should normalize skill held item payloads");
  const baseClipPolicy = runtime.buildBaseClipOptions({
    skillRuntime: {
      getSkillAnimationHeldItems: () => ({ rightHand: "knife", leftHand: "normal_logs" }),
      getSkillAnimationHeldItemSlot: () => "leftHand",
      getSkillAnimationSuppressEquipmentVisual: () => true
    }
  });
  assert(baseClipPolicy.suppressEquipmentVisual === true, "runtime should preserve suppress-equipment policy");
  assert(baseClipPolicy.baseClipOptions.heldItems.leftHand === "normal_logs", "runtime should build held-item base clip options");
  assert(baseClipPolicy.baseClipOptions.heldItemId === "knife", "runtime should derive a primary held item id from normalized held items");
  assert(baseClipPolicy.baseClipOptions.heldItemSlot === "leftHand", "runtime should preserve the explicit held item slot");

  assert(runtime.shouldShowRigToolVisual({
    playerState: { action: "SKILLING: FLETCHING" },
    skillRuntime: { getSkillAnimationHeldItems: () => ({ rightHand: "knife" }) }
  }), "runtime should show skilling visuals when active skill held items exist");
  assert(runtime.shouldShowRigToolVisual({
    playerState: { action: "IDLE" },
    equipment: { weapon: { id: "bronze_sword" } }
  }), "runtime should keep equipped weapon visuals visible outside skilling");
  assert(!runtime.shouldShowRigToolVisual({
    playerState: { action: "IDLE" },
    equipment: {}
  }), "runtime should hide tool visuals with no equipment or skill animation");

  const rodRequest = runtime.buildFishingStartActionClipRequest({
    playerState: { action: "SKILLING: WATER", fishingActiveMethodId: "rod", fishingCastStartedAt: 1000 },
    frameNow: 1120,
    heldItemId: "fishing_rod"
  });
  assert(rodRequest && rodRequest.clipId === "player/fishing_rod_cast1", "runtime should request the rod cast clip inside the fishing start window");
  assert(rodRequest.actionOptions.startKey === "player/fishing_rod_cast1:1000", "runtime should build a stable fishing action start key");
  assert(rodRequest.actionOptions.heldItemId === "fishing_rod", "runtime should carry held item data into fishing action clip options");
  assert(runtime.buildFishingStartActionClipRequest({
    playerState: { action: "SKILLING: WATER", fishingActiveMethodId: "rod", fishingCastStartedAt: 1000 },
    frameNow: 1400
  }) === null, "runtime should not request fishing start clips outside the start window");

  console.log("Input player animation runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
