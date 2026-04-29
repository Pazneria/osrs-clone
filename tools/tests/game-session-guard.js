const fs = require("fs");
const path = require("path");
const { loadTsModule } = require("../lib/ts-module-loader");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const sessionBridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "session-bridge.ts"), "utf8");
  const sessionContractSource = fs.readFileSync(path.join(root, "src", "game", "contracts", "session.ts"), "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const skillRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "skills", "runtime.js"), "utf8");
  const shopEconomySource = fs.readFileSync(path.join(root, "src", "js", "shop-economy.js"), "utf8");
  const legacyManifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const questCatalogSource = fs.readFileSync(path.join(root, "src", "js", "content", "quest-catalog.js"), "utf8");
  const questRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "quest-runtime.js"), "utf8");
  const progressRuntime = loadTsModule(path.join(root, "src", "game", "session", "progress.ts"));

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
  assert(coreSource.includes("const TUTORIAL_EXIT_STEP = 7;"), "core should define the tutorial exit gate step");
  assert(sessionContractSource.includes("tutorialBankDepositSource: string | null;"), "session profile should persist tutorial bank deposit evidence");
  assert(sessionContractSource.includes("tutorialBankWithdrawSource: string | null;"), "session profile should persist tutorial bank withdraw evidence");
  assert(coreSource.includes("window.TutorialRuntime = {"), "core should expose tutorial progression for dialogue gating");
  assert(coreSource.includes("sourceWorldId === TUTORIAL_WORLD_ID && resolvedWorldId === STARTER_WORLD_ID"), "core should mark tutorial completion only when leaving tutorial for starter town");
  assert(coreSource.includes("Finish the Tutorial Island instructors before leaving for Starter Town."), "core should block early tutorial departure");
  assert(skillRuntimeSource.includes("window.GameSessionRuntime"), "skill runtime should read through the session bridge");
  assert(shopEconomySource.includes("window.GameSessionRuntime"), "shop economy should read through the session bridge");
  assert(legacyManifestSource.includes("quest-catalog"), "legacy manifest should load the quest catalog");
  assert(legacyManifestSource.includes("quest-runtime"), "legacy manifest should load the quest runtime");

  new Function(questCatalogSource);
  new Function(questRuntimeSource);

  const defaultProfile = progressRuntime.createDefaultPlayerProfileState();
  assert(defaultProfile.tutorialStep === 0, "default profile should start at tutorial step 0");
  assert(defaultProfile.tutorialCompletedAt === null, "default profile should not mark tutorial complete");
  assert(defaultProfile.tutorialBankDepositSource === null, "default profile should not carry tutorial bank deposit evidence");
  assert(defaultProfile.tutorialBankWithdrawSource === null, "default profile should not carry tutorial bank withdraw evidence");

  const clonedProfile = progressRuntime.clonePlayerProfileState({
    name: "Tester",
    creationCompleted: true,
    createdAt: 10.4,
    lastStartedAt: 20.9,
    tutorialStep: 6.8,
    tutorialCompletedAt: 30.2,
    tutorialBankDepositSource: "tutorial_bank_west",
    tutorialBankWithdrawSource: "tutorial_bank_east"
  });
  assert(clonedProfile.tutorialStep === 6, "profile clone should floor persisted tutorial step");
  assert(clonedProfile.tutorialCompletedAt === 30.2, "profile clone should preserve tutorial completion timestamp");
  assert(clonedProfile.tutorialBankDepositSource === "tutorial_bank_west", "profile clone should preserve tutorial bank deposit evidence");
  assert(clonedProfile.tutorialBankWithdrawSource === "tutorial_bank_east", "profile clone should preserve tutorial bank withdraw evidence");

  const sanitizedProfile = progressRuntime.clonePlayerProfileState({
    name: "Tester",
    creationCompleted: false,
    createdAt: null,
    lastStartedAt: null,
    tutorialStep: -2,
    tutorialCompletedAt: NaN,
    tutorialBankDepositSource: 12,
    tutorialBankWithdrawSource: {}
  });
  assert(sanitizedProfile.tutorialStep === 0, "profile clone should clamp negative tutorial steps");
  assert(sanitizedProfile.tutorialCompletedAt === null, "profile clone should drop invalid tutorial completion timestamps");
  assert(sanitizedProfile.tutorialBankDepositSource === null, "profile clone should drop invalid tutorial bank deposit evidence");
  assert(sanitizedProfile.tutorialBankWithdrawSource === null, "profile clone should drop invalid tutorial bank withdraw evidence");

  console.log("Game session guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
