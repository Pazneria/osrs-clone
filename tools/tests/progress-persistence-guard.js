const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const corePath = path.join(root, "src/js/core.js");
  const coreScript = fs.readFileSync(corePath, "utf8");
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
