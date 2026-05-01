const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const corePath = path.join(root, "src/js/core.js");
  const coreScript = fs.readFileSync(corePath, "utf8");
  const coreProgressRuntimeScript = fs.readFileSync(path.join(root, "src", "js", "core-progress-runtime.js"), "utf8");
  const manifestScript = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const sessionBridgeScript = fs.readFileSync(path.join(root, "src", "game", "platform", "session-bridge.ts"), "utf8");

  assert(
    coreScript.includes("const PROGRESS_SAVE_KEY = 'osrsClone.progress.v1';"),
    "core should define a stable progress save key"
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
      coreProgressRuntimeScript.includes("function sanitizePlayerProfile(context = {}, savedProfile, options = {})") &&
      coreProgressRuntimeScript.includes("function serializePlayerProfile(context = {})") &&
      coreProgressRuntimeScript.includes("function serializeAppearanceState(context = {})"),
    "core progress runtime should own progress save encoding and decoding helpers"
  );
  assert(
    coreScript.includes("const coreProgressRuntime = window.CoreProgressRuntime || null;") &&
      coreScript.includes("function buildCoreProgressRuntimeContext()") &&
      coreScript.includes("getCoreProgressRuntime().serializeItemArray(buildCoreProgressRuntimeContext(), slots)") &&
      coreScript.includes("getCoreProgressRuntime().deserializeItemArray(buildCoreProgressRuntimeContext(), savedSlots, size)") &&
      coreScript.includes("getCoreProgressRuntime().sanitizeSkillState(buildCoreProgressRuntimeContext(), savedSkills)") &&
      coreScript.includes("getCoreProgressRuntime().sanitizePlayerProfile(buildCoreProgressRuntimeContext(), savedProfile, options)") &&
      coreScript.includes("getCoreProgressRuntime().serializePlayerProfile(buildCoreProgressRuntimeContext())") &&
      coreScript.includes("getCoreProgressRuntime().serializeAppearanceState(buildCoreProgressRuntimeContext())"),
    "core should delegate progress save codec helpers through the core progress runtime"
  );
  assert(
    !coreScript.includes("return value.trim().toLowerCase();") &&
      !coreScript.includes("const restored = Array(size).fill(null);") &&
      !coreScript.includes("if (allowLegacyFallback && !restored.name)") &&
      !coreScript.includes("const colorsIn = Array.isArray(savedAppearance.colors) ? savedAppearance.colors : [];"),
    "core should not keep progress codec helper bodies inline"
  );
  assert(
    coreScript.includes("function loadProgressFromStorage()"),
    "core should define loadProgressFromStorage"
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
    coreScript.includes("gameSessionRuntime.saveProgressPayloadToStorage"),
    "core should write progress through the session runtime"
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
    coreScript.includes("startProgressAutosave();"),
    "core should start autosave during startup"
  );
  assert(
    coreScript.includes("window.addEventListener('beforeunload'"),
    "core should flush progress on beforeunload"
  );
  assert(
    coreScript.includes("window.addEventListener('pagehide'"),
    "core should flush progress on pagehide"
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
