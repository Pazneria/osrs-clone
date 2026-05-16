const assert = require("assert");
const path = require("path");
const { loadTsModule } = require("../lib/ts-module-loader");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const sessionBridgeSource = readRepoFile(root, "src/game/platform/session-bridge.ts");
  const sessionContractSource = readRepoFile(root, "src/game/contracts/session.ts");
  const coreSource = readRepoFile(root, "src/js/core.js");
  const skillRuntimeSource = readRepoFile(root, "src/js/skills/runtime.js");
  const shopEconomySource = readRepoFile(root, "src/js/shop-economy.js");
  const legacyManifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const questCatalogSource = readRepoFile(root, "src/js/content/quest-catalog.js");
  const questRuntimeSource = readRepoFile(root, "src/js/quest-runtime.js");
  const progressRuntime = loadTsModule(path.join(root, "src", "game", "session", "progress.ts"));
  const saveRuntime = loadTsModule(path.join(root, "src", "game", "session", "save.ts"));

  assert(sessionContractSource.includes("export interface GameSession"), "session contracts should define GameSession");
  assert(sessionContractSource.includes("export interface ProgressSavePayload"), "session contracts should define a versioned save payload");
  assert(sessionContractSource.includes("export interface QuestProgressState"), "session contracts should define quest progress state");
  assert(sessionContractSource.includes("tutorialStep: number;"), "session profile should persist tutorial step");
  assert(sessionContractSource.includes("tutorialCompletedAt: number | null;"), "session profile should persist tutorial completion");
  assert(sessionBridgeSource.includes("createGameSession"), "session bridge should expose session creation");
  assert(sessionBridgeSource.includes("setActiveSession"), "session bridge should expose active-session ownership");
  assert(sessionBridgeSource.includes("buildProgressSavePayload"), "session bridge should expose save payload building");
  assert(sessionBridgeSource.includes("sanitizeQuestProgressState"), "session bridge should expose quest progress sanitization");
  assert(sessionBridgeSource.includes("bindWindowQaBooleanFlag"), "session bridge should own QA/debug flag binding");
  assert(coreSource.includes("const gameSessionRuntime = window.GameSessionRuntime || null;"), "core should adopt the session runtime bridge");
  assert(coreSource.includes("function getGameSession()"), "core should expose a game-session helper");
  assert(coreSource.includes("function syncGameSessionState()"), "core should synchronize legacy refs back into the session");
  assert(coreSource.includes("activeSession.progress.quests = questProgressState;"), "core should synchronize quests back into the session");
  assert(coreSource.includes("const TUTORIAL_EXIT_STEP = 11;"), "core should define the tutorial exit gate step");
  assert(sessionContractSource.includes("tutorialBankDepositSource: string | null;"), "session profile should persist tutorial bank deposit evidence");
  assert(sessionContractSource.includes("tutorialBankWithdrawSource: string | null;"), "session profile should persist tutorial bank withdraw evidence");
  assert(sessionContractSource.includes("tutorialInstructorVisits: Record<string, boolean>;"), "session profile should persist tutorial instructor visit evidence");
  assert(coreSource.includes("window.TutorialRuntime = {"), "core should expose tutorial progression for dialogue gating");
  assert(coreSource.includes("sourceWorldId === TUTORIAL_WORLD_ID && resolvedWorldId === MAIN_OVERWORLD_WORLD_ID"), "core should mark tutorial completion only when leaving tutorial for the main overworld");
  assert(coreSource.includes("Finish the Tutorial Island instructors before leaving for Starter Town."), "core should block early tutorial departure");
  assert(skillRuntimeSource.includes("window.GameSessionRuntime"), "skill runtime should read through the session bridge");
  assert(shopEconomySource.includes("window.GameSessionRuntime"), "shop economy should read through the session bridge");
  assert(legacyManifestSource.includes("quest-catalog"), "legacy manifest should load the quest catalog");
  assert(legacyManifestSource.includes("quest-runtime"), "legacy manifest should load the quest runtime");

  new Function(questCatalogSource);
  new Function(questRuntimeSource);

  const recoveryTableMatch = coreSource.match(/const TUTORIAL_RECOVERY_SPAWNS = Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert(!!recoveryTableMatch, "core should define the tutorial recovery spawn table");
  const recoverySpawns = Array.from(recoveryTableMatch[1].matchAll(/\{\s*x:\s*(\d+),\s*y:\s*(\d+),\s*z:\s*(\d+)\s*\}/g))
    .map((match) => ({ x: Number(match[1]), y: Number(match[2]), z: Number(match[3]) }));
  assert(recoverySpawns.length === 12, "tutorial recovery spawn table should map exactly to tutorial steps 0-11");
  assert(recoverySpawns[6].x === 427 && recoverySpawns[6].y === 406, "step 6 recovery should land by the Ranged Instructor");
  assert(recoverySpawns[7].x === 376 && recoverySpawns[7].y === 423, "step 7 recovery should land by the Magic Instructor");
  assert(recoverySpawns[8].x === 327 && recoverySpawns[8].y === 427, "step 8 recovery should land by the Runecrafting Instructor");
  assert(recoverySpawns[9].x === 297 && recoverySpawns[9].y === 423, "step 9 recovery should land by the Crafting Instructor");
  assert(recoverySpawns[10].x === 280 && recoverySpawns[10].y === 417, "step 10 recovery should land by the Bank Tutor");
  assert(recoverySpawns[11].x === 331 && recoverySpawns[11].y === 421, "step 11 recovery should land by the exit Tutorial Guide");

  const defaultProfile = progressRuntime.createDefaultPlayerProfileState();
  const defaultSkills = progressRuntime.createDefaultPlayerSkillsState();
  assert(defaultProfile.tutorialStep === 0, "default profile should start at tutorial step 0");
  assert(defaultProfile.tutorialCompletedAt === null, "default profile should not mark tutorial complete");
  assert(defaultProfile.tutorialBankDepositSource === null, "default profile should not carry tutorial bank deposit evidence");
  assert(defaultProfile.tutorialBankWithdrawSource === null, "default profile should not carry tutorial bank withdraw evidence");
  assert(Object.keys(defaultProfile.tutorialInstructorVisits).length === 0, "default profile should not carry tutorial instructor visits");
  assert(defaultSkills.magic.level === 1 && defaultSkills.magic.xp === 0, "default skills should include Magic for tutorial spell practice");

  const clonedProfile = progressRuntime.clonePlayerProfileState({
    name: "Tester",
    creationCompleted: true,
    createdAt: 10.4,
    lastStartedAt: 20.9,
    tutorialStep: 6.8,
    tutorialCompletedAt: 30.2,
    tutorialBankDepositSource: "tutorial_bank_west",
    tutorialBankWithdrawSource: "tutorial_bank_east",
    tutorialInstructorVisits: { "1": true, "2": false, "3.9": true }
  });
  assert(clonedProfile.tutorialStep === 6, "profile clone should floor persisted tutorial step");
  assert(clonedProfile.tutorialCompletedAt === 30.2, "profile clone should preserve tutorial completion timestamp");
  assert(clonedProfile.tutorialBankDepositSource === "tutorial_bank_west", "profile clone should preserve tutorial bank deposit evidence");
  assert(clonedProfile.tutorialBankWithdrawSource === "tutorial_bank_east", "profile clone should preserve tutorial bank withdraw evidence");
  assert(clonedProfile.tutorialInstructorVisits["1"] === true && clonedProfile.tutorialInstructorVisits["3"] === true && !clonedProfile.tutorialInstructorVisits["2"], "profile clone should sanitize tutorial instructor visits");

  const sanitizedProfile = progressRuntime.clonePlayerProfileState({
    name: "Tester",
    creationCompleted: false,
    createdAt: null,
    lastStartedAt: null,
    tutorialStep: -2,
    tutorialCompletedAt: NaN,
    tutorialBankDepositSource: 12,
    tutorialBankWithdrawSource: {},
    tutorialInstructorVisits: "bad"
  });
  assert(sanitizedProfile.tutorialStep === 0, "profile clone should clamp negative tutorial steps");
  assert(sanitizedProfile.tutorialCompletedAt === null, "profile clone should drop invalid tutorial completion timestamps");
  assert(sanitizedProfile.tutorialBankDepositSource === null, "profile clone should drop invalid tutorial bank deposit evidence");
  assert(sanitizedProfile.tutorialBankWithdrawSource === null, "profile clone should drop invalid tutorial bank withdraw evidence");
  assert(Object.keys(sanitizedProfile.tutorialInstructorVisits).length === 0, "profile clone should drop invalid tutorial instructor visits");

  const equippedAmmo = { itemId: "bronze_arrows", amount: 12 };
  const savePayload = saveRuntime.buildProgressSavePayload({
    saveVersion: 3,
    reason: "guard",
    session: {
      currentWorldId: "tutorial_island",
      player: {
        x: 1,
        y: 2,
        z: 0,
        targetRotation: 0,
        currentHitpoints: 10,
        eatingCooldownEndTick: 0,
        remainingAttackCooldown: 0,
        lockedTargetId: null,
        combatTargetKind: null,
        selectedMeleeStyle: "attack",
        autoRetaliateEnabled: true,
        inCombat: false,
        lastDamagerEnemyId: null,
        unlockFlags: {},
        merchantProgress: {}
      },
      ui: { runMode: false }
    },
    playerSkills: defaultSkills,
    inventory: [],
    bankItems: [],
    equipment: { weapon: "training_bow", ammo: equippedAmmo },
    userItemPrefs: {},
    contentGrants: {},
    quests: {},
    profile: defaultProfile,
    appearance: null
  });
  equippedAmmo.amount = 1;
  assert(savePayload.state.equipment.weapon === "training_bow", "save payload should keep legacy string equipment slots");
  assert(savePayload.state.equipment.ammo.amount === 12, "save payload should clone stacked equipment slots");
  assert(savePayload.state.equipment.ammo !== equippedAmmo, "save payload should not alias stacked equipment slot objects");

  console.log("Game session guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
