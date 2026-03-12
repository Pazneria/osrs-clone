const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const corePath = path.join(root, "src/js/core.js");
  const coreScript = fs.readFileSync(corePath, "utf8");

  assert(
    coreScript.includes("const PROGRESS_SAVE_KEY = 'osrsClone.progress.v1';"),
    "core should define a stable progress save key"
  );
  assert(
    coreScript.includes("const PROGRESS_SAVE_VERSION = 1;"),
    "core should define a progress save schema version"
  );
  assert(
    coreScript.includes("function migrateProgressPayload(payload)"),
    "core should include progress-payload migration handling"
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
    coreScript.includes("localStorage.setItem(PROGRESS_SAVE_KEY"),
    "core should write progress to localStorage"
  );
  assert(
    coreScript.includes("localStorage.getItem(PROGRESS_SAVE_KEY)"),
    "core should read progress from localStorage"
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
