const assert = require("assert");
const path = require("path");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreScript = readRepoFile(root, "src/js/core.js");
  const coreProgressRuntimeScript = readRepoFile(root, "src/js/core-progress-runtime.js");
  const manifestScript = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const sessionBridgeScript = readRepoFile(root, "src/game/platform/session-bridge.ts");

  assert(
    coreScript.includes("const PROGRESS_SAVE_KEY = 'osrsClone.progress.v2';") &&
      coreScript.includes("const OBSOLETE_PROGRESS_SAVE_KEYS = Object.freeze(['osrsClone.progress.v1']);"),
    "core should define the current progress save key and obsolete player-save keys"
  );
  assert(
    coreScript.includes("const PROGRESS_SAVE_VERSION = 1;"),
    "core should define a progress save schema version"
  );
  assert(
    sessionBridgeScript.includes("migrateProgressSavePayload"),
    "session bridge should include progress-payload migration handling"
  );
  assert(
    readRepoFile(root, "src/game/session/progress.ts").includes("creatorSelections"),
    "typed progress cloning should preserve saved creator selections"
  );
  assert(
    coreScript.includes("function saveProgressToStorage(reason = 'manual')"),
    "core should define saveProgressToStorage"
  );
  assert(
    manifestScript.includes('../../js/core-progress-runtime.js?raw') &&
      manifestScript.indexOf('id: "core-progress-runtime"') < manifestScript.indexOf('id: "core"'),
    "legacy manifest should load core progress runtime before core.js"
  );
  assert(
    coreProgressRuntimeScript.includes("window.CoreProgressRuntime") &&
      coreProgressRuntimeScript.includes("function serializeItemArray(context = {}, slots)") &&
      coreProgressRuntimeScript.includes("function deserializeItemArray(context = {}, savedSlots, size)") &&
      coreProgressRuntimeScript.includes("function sanitizeSkillState(context = {}, savedSkills)") &&
      coreProgressRuntimeScript.includes("function sanitizeCreatorSelections(context = {}, savedSelections)") &&
      coreProgressRuntimeScript.includes("function sanitizePlayerProfile(context = {}, savedProfile, options = {})") &&
      coreProgressRuntimeScript.includes("function serializePlayerProfile(context = {})") &&
      coreProgressRuntimeScript.includes("function serializeAppearanceState(context = {})") &&
      coreProgressRuntimeScript.includes("creatorSelections: sanitizeCreatorSelections(context, appearanceState.creatorSelections)") &&
      coreProgressRuntimeScript.includes("function saveProgressToStorage(context = {}, reason = 'manual')") &&
      coreProgressRuntimeScript.includes("function clearProgressFromStorage(context = {}, options = {})") &&
      coreProgressRuntimeScript.includes("function clearObsoleteProgressFromStorage(context = {})") &&
      coreProgressRuntimeScript.includes("function consumeFreshSessionRequest(context = {})") &&
      coreProgressRuntimeScript.includes("function startProgressAutosave(context = {})") &&
      coreProgressRuntimeScript.includes("function ensureProgressPersistenceLifecycle(context = {})") &&
      coreProgressRuntimeScript.includes("function publishProgressHooks"),
    "core progress runtime should own progress save encoding, decoding, and lifecycle helpers"
  );
  assert(
      coreScript.includes("const coreProgressRuntime = window.CoreProgressRuntime || null;") &&
      coreScript.includes("function buildCoreProgressRuntimeContext()") &&
      coreScript.includes("buildProgressPayload,") &&
      coreScript.includes("getCoreProgressRuntime().serializeItemArray(buildCoreProgressRuntimeContext(), slots)") &&
      coreScript.includes("getCoreProgressRuntime().deserializeItemArray(buildCoreProgressRuntimeContext(), savedSlots, size)") &&
      coreScript.includes("getCoreProgressRuntime().sanitizeSkillState(buildCoreProgressRuntimeContext(), savedSkills)") &&
      coreScript.includes("getCoreProgressRuntime().sanitizePlayerProfile(buildCoreProgressRuntimeContext(), savedProfile, options)") &&
      coreScript.includes("getCoreProgressRuntime().serializePlayerProfile(buildCoreProgressRuntimeContext())") &&
      coreScript.includes("getCoreProgressRuntime().serializeAppearanceState(buildCoreProgressRuntimeContext())") &&
      coreScript.includes("window.playerAppearanceState.creatorSelections = Object.assign({}, appearance.creatorSelections || {});") &&
      coreScript.includes("getCoreProgressRuntime().saveProgressToStorage(buildCoreProgressRuntimeContext(), reason)") &&
      coreScript.includes("getCoreProgressRuntime().clearProgressFromStorage(buildCoreProgressRuntimeContext(), options)") &&
      coreScript.includes("getCoreProgressRuntime().clearObsoleteProgressFromStorage(buildCoreProgressRuntimeContext())") &&
      coreScript.includes("obsoleteProgressStorageKeys: OBSOLETE_PROGRESS_SAVE_KEYS") &&
      coreScript.includes("getCoreProgressRuntime().consumeFreshSessionRequest(buildCoreProgressRuntimeContext())") &&
      coreScript.includes("getCoreProgressRuntime().startProgressAutosave(buildCoreProgressRuntimeContext())") &&
      coreScript.includes("getCoreProgressRuntime().ensureProgressPersistenceLifecycle(buildCoreProgressRuntimeContext())") &&
      coreScript.includes("getCoreProgressRuntime().publishProgressHooks({"),
    "core should delegate progress save codec and lifecycle helpers through the core progress runtime"
  );
  assert(
    !coreScript.includes("return value.trim().toLowerCase();") &&
      !coreScript.includes("const restored = Array(size).fill(null);") &&
      !coreScript.includes("if (allowLegacyFallback && !restored.name)") &&
      !coreScript.includes("const colorsIn = Array.isArray(savedAppearance.colors) ? savedAppearance.colors : [];") &&
      !coreScript.includes("window.localStorage.removeItem(PROGRESS_SAVE_KEY);") &&
      !coreScript.includes("window.clearProgressSave = function") &&
      !coreScript.includes("window.startFreshSession = function") &&
      !coreScript.includes("const requested = ['fresh', 'resetProgress', 'clearSave'].some((key) => shouldConsumeFreshSessionParam(params.get(key)))") &&
      !coreScript.includes("window.addEventListener('beforeunload', () => saveProgressToStorage('beforeunload'))"),
    "core should not keep progress codec or lifecycle helper bodies inline"
  );
  assert(
    coreScript.includes("function loadProgressFromStorage()"),
    "core should define loadProgressFromStorage"
  );
  assert(
    !coreScript.includes("playerEntryFlowState.saveWasLegacyProfile ||"),
    "core should not reopen the player creator solely for upgraded legacy saves"
  );
  assert(
    coreScript.includes("const MAX_PERSISTED_EAT_COOLDOWN_TICKS = 10;"),
    "core should define a bounded persisted eat-cooldown window"
  );
  assert(
    coreScript.includes("loadedEatingCooldownEndTick > (currentTick + MAX_PERSISTED_EAT_COOLDOWN_TICKS)")
      && coreScript.includes("playerState.eatingCooldownEndTick = loadedEatingCooldownEndTick > (currentTick + MAX_PERSISTED_EAT_COOLDOWN_TICKS)")
      && coreScript.includes("? loadedCombatDefaults.eatingCooldownEndTick")
      && coreScript.includes(": loadedEatingCooldownEndTick;"),
    "core should clamp stale persisted eat cooldowns on load so absolute save ticks cannot lock eating after restart"
  );
  assert(
    coreScript.includes("gameSessionRuntime.buildProgressSavePayload"),
    "core should build progress payloads through the session runtime"
  );
  assert(
    coreScript.includes("quests: questProgressState"),
    "core should include quest progress in the save payload"
  );
  assert(
    coreProgressRuntimeScript.includes("gameSessionRuntime.saveProgressPayloadToStorage"),
    "progress runtime should write progress through the session runtime"
  );
  assert(
    coreScript.includes("gameSessionRuntime.loadProgressPayloadFromStorage"),
    "core should read progress through the session runtime"
  );
  assert(
    coreScript.includes("worldAdapterRuntime.resolveKnownWorldId(rawLoadedWorldId, MAIN_OVERWORLD_WORLD_ID)"),
    "core should canonicalize legacy saved world ids through the typed world adapter on load"
  );
  assert(
    coreScript.includes("gameSessionRuntime.sanitizeQuestProgressState(state.quests)"),
    "core should restore saved quest progress through the session runtime"
  );
  assert(
    !coreScript.includes("function migrateProgressPayload(payload)"),
    "core should not own the progress-payload migration contract directly"
  );
  assert(
    coreScript.includes("function startProgressAutosave()"),
    "core should define autosave scheduler"
  );
  assert(
    coreScript.includes("getCoreProgressRuntime().startProgressAutosave(buildCoreProgressRuntimeContext())"),
    "core should delegate autosave scheduling through the progress runtime"
  );
  assert(
    coreProgressRuntimeScript.includes("windowRef.addEventListener('beforeunload'"),
    "progress runtime should flush progress on beforeunload"
  );
  assert(
    coreProgressRuntimeScript.includes("windowRef.addEventListener('pagehide'"),
    "progress runtime should flush progress on pagehide"
  );

  const loadCall = coreScript.indexOf("const loadProgressResult = loadProgressFromStorage();");
  const initCall = coreScript.indexOf("if (typeof window.initLogicalMap === 'function') window.initLogicalMap();");
  assert(loadCall !== -1, "core startup should load progress");
  assert(initCall !== -1, "core startup should initialize map");
  assert(loadCall < initCall, "core should load progress before world initialization");

  console.log("Progress persistence guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
