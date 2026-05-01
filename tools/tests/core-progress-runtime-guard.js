const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "core-progress-runtime.js");
  const runtimeSource = read(root, "src/js/core-progress-runtime.js");
  const coreSource = read(root, "src/js/core.js");
  const manifestSource = read(root, "src/game/platform/legacy-script-manifest.ts");
  const runtimeIndex = manifestSource.indexOf('id: "core-progress-runtime"');
  const coreIndex = manifestSource.indexOf('id: "core"');

  assert(runtimeIndex !== -1, "legacy manifest should include core progress runtime");
  assert(coreIndex !== -1 && runtimeIndex < coreIndex, "legacy manifest should load core progress runtime before core.js");
  assert(runtimeSource.includes("window.CoreProgressRuntime"), "core progress runtime should expose a window runtime");
  assert(runtimeSource.includes("function serializeInventorySlot(context = {}, slot)"), "runtime should own inventory slot serialization");
  assert(runtimeSource.includes("function deserializeItemArray(context = {}, savedSlots, size)"), "runtime should own item array deserialization");
  assert(runtimeSource.includes("function serializeEquipmentState(context = {})"), "runtime should own equipment serialization");
  assert(runtimeSource.includes("function sanitizeSkillState(context = {}, savedSkills)"), "runtime should own skill save sanitization");
  assert(runtimeSource.includes("function sanitizePlayerProfile(context = {}, savedProfile, options = {})"), "runtime should own player profile sanitization");
  assert(runtimeSource.includes("function serializePlayerProfile(context = {})"), "runtime should own player profile serialization");
  assert(runtimeSource.includes("function serializeAppearanceState(context = {})"), "runtime should own appearance serialization");
  assert(runtimeSource.includes("function saveProgressToStorage(context = {}, reason = 'manual')"), "runtime should own progress save storage wrapper");
  assert(runtimeSource.includes("function clearProgressFromStorage(context = {}, options = {})"), "runtime should own progress clear storage wrapper");
  assert(runtimeSource.includes("function consumeFreshSessionRequest(context = {})"), "runtime should own fresh-session URL handling");
  assert(runtimeSource.includes("function startProgressAutosave(context = {})"), "runtime should own progress autosave scheduling");
  assert(runtimeSource.includes("function ensureProgressPersistenceLifecycle(context = {})"), "runtime should own progress persistence lifecycle hooks");

  assert(coreSource.includes("const coreProgressRuntime = window.CoreProgressRuntime || null;"), "core.js should resolve core progress runtime");
  assert(coreSource.includes("function buildCoreProgressRuntimeContext()"), "core.js should adapt progress codec context narrowly");
  assert(coreSource.includes("getCoreProgressRuntime().serializeItemArray(buildCoreProgressRuntimeContext(), slots)"), "core.js should delegate item array serialization");
  assert(coreSource.includes("getCoreProgressRuntime().deserializeItemArray(buildCoreProgressRuntimeContext(), savedSlots, size)"), "core.js should delegate item array deserialization");
  assert(coreSource.includes("getCoreProgressRuntime().serializeEquipmentState(buildCoreProgressRuntimeContext())"), "core.js should delegate equipment serialization");
  assert(coreSource.includes("getCoreProgressRuntime().sanitizeSkillState(buildCoreProgressRuntimeContext(), savedSkills)"), "core.js should delegate skill save sanitization");
  assert(coreSource.includes("getCoreProgressRuntime().sanitizePlayerProfile(buildCoreProgressRuntimeContext(), savedProfile, options)"), "core.js should delegate player profile sanitization");
  assert(coreSource.includes("getCoreProgressRuntime().serializePlayerProfile(buildCoreProgressRuntimeContext())"), "core.js should delegate player profile serialization");
  assert(coreSource.includes("getCoreProgressRuntime().serializeAppearanceState(buildCoreProgressRuntimeContext())"), "core.js should delegate appearance save serialization");
  assert(coreSource.includes("getCoreProgressRuntime().saveProgressToStorage(buildCoreProgressRuntimeContext(), reason)"), "core.js should delegate progress saves");
  assert(coreSource.includes("getCoreProgressRuntime().clearProgressFromStorage(buildCoreProgressRuntimeContext(), options)"), "core.js should delegate progress clearing");
  assert(coreSource.includes("getCoreProgressRuntime().consumeFreshSessionRequest(buildCoreProgressRuntimeContext())"), "core.js should delegate fresh-session URL handling");
  assert(coreSource.includes("getCoreProgressRuntime().startProgressAutosave(buildCoreProgressRuntimeContext())"), "core.js should delegate progress autosave scheduling");
  assert(coreSource.includes("getCoreProgressRuntime().ensureProgressPersistenceLifecycle(buildCoreProgressRuntimeContext())"), "core.js should delegate progress lifecycle hooks");
  assert(coreSource.includes("getCoreProgressRuntime().clearProgressSave(buildCoreProgressRuntimeContext(), options)"), "core.js should delegate public progress clear helper");
  assert(coreSource.includes("getCoreProgressRuntime().startFreshSession(buildCoreProgressRuntimeContext())"), "core.js should delegate public fresh session helper");
  assert(!coreSource.includes("return value.trim().toLowerCase();"), "core.js should not own item id normalization inline");
  assert(!coreSource.includes("const restored = Array(size).fill(null);"), "core.js should not own item array deserialization inline");
  assert(!coreSource.includes("if (allowLegacyFallback && !restored.name)"), "core.js should not own legacy profile fallback rules inline");
  assert(!coreSource.includes("const colorsIn = Array.isArray(savedAppearance.colors) ? savedAppearance.colors : [];"), "core.js should not own appearance sanitization inline");
  assert(!coreSource.includes("window.localStorage.removeItem(PROGRESS_SAVE_KEY);"), "core.js should not own progress storage clearing inline");
  assert(!coreSource.includes("const requested = ['fresh', 'resetProgress', 'clearSave'].some((key) => shouldConsumeFreshSessionParam(params.get(key)))"), "core.js should not own fresh-session query parsing inline");
  assert(!coreSource.includes("setInterval(() => {\n                saveProgressToStorage('autosave');"), "core.js should not own autosave interval body inline");
  assert(!coreSource.includes("window.addEventListener('beforeunload', () => saveProgressToStorage('beforeunload'))"), "core.js should not own progress unload hook wiring inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CoreProgressRuntime;
  assert(runtime, "core progress runtime should execute in isolation");
  assert(typeof runtime.serializeItemArray === "function", "runtime should expose serializeItemArray");
  assert(typeof runtime.deserializeEquipmentState === "function", "runtime should expose deserializeEquipmentState");
  assert(typeof runtime.sanitizeSkillState === "function", "runtime should expose sanitizeSkillState");
  assert(typeof runtime.sanitizePlayerProfile === "function", "runtime should expose sanitizePlayerProfile");
  assert(typeof runtime.saveProgressToStorage === "function", "runtime should expose saveProgressToStorage");
  assert(typeof runtime.clearProgressFromStorage === "function", "runtime should expose clearProgressFromStorage");
  assert(typeof runtime.consumeFreshSessionRequest === "function", "runtime should expose consumeFreshSessionRequest");
  assert(typeof runtime.startProgressAutosave === "function", "runtime should expose startProgressAutosave");
  assert(typeof runtime.ensureProgressPersistenceLifecycle === "function", "runtime should expose ensureProgressPersistenceLifecycle");

  const itemDb = {
    coins: { id: "coins", stackable: true },
    bronze_sword: { id: "bronze_sword", stackable: false }
  };
  const context = {
    ITEM_DB: itemDb,
    equipment: { weapon: itemDb.bronze_sword, shield: null },
    playerSkills: {
      attack: { xp: 0, level: 1 },
      hitpoints: { xp: 1154, level: 10 }
    },
    maxSkillLevel: 99,
    getLevelForXp: (xp) => (xp >= 200 ? 3 : 1),
    playerProfileDefaultName: "Adventurer",
    playerProfileState: {
      name: "Raw",
      creationCompleted: false,
      createdAt: null,
      lastStartedAt: null,
      tutorialStep: 0,
      tutorialCompletedAt: null,
      tutorialBankDepositSource: null,
      tutorialBankWithdrawSource: null
    },
    sanitizePlayerName: (value) => String(value || "").replace(/[^A-Za-z0-9 _-]/g, "").trim().slice(0, 12),
    tutorialExitStep: 7,
    tutorialWorldId: "tutorial_island",
    now: () => 12345,
    windowRef: {
      playerAppearanceState: { gender: 1, colors: [1, 2, 3, 4, 5, 6] }
    }
  };

  const serializedItems = runtime.serializeItemArray(context, [
    { itemData: itemDb.coins, amount: 42.9 },
    { itemData: { id: "missing" }, amount: 1 },
    null
  ]);
  assert(serializedItems[0].itemId === "coins" && serializedItems[0].amount === 42, "runtime should serialize valid stack amounts");
  assert(serializedItems[1] === null && serializedItems[2] === null, "runtime should null invalid item slots");

  const restoredItems = runtime.deserializeItemArray(context, [
    { itemId: "coins", amount: 8 },
    { itemId: "bronze_sword", amount: 99 },
    { itemId: "missing", amount: 1 }
  ], 4);
  assert(restoredItems.length === 4, "runtime should restore fixed-size item arrays");
  assert(restoredItems[0].amount === 8, "runtime should restore stackable amounts");
  assert(restoredItems[1].amount === 1, "runtime should clamp non-stackable amounts to one");
  assert(restoredItems[2] === null && restoredItems[3] === null, "runtime should null missing and padded slots");

  const serializedEquipment = runtime.serializeEquipmentState(context);
  assert(serializedEquipment.weapon === "bronze_sword" && serializedEquipment.shield === null, "runtime should serialize equipment by slot");
  const restoredEquipment = runtime.deserializeEquipmentState(context, { weapon: "coins", shield: "missing" });
  assert(restoredEquipment.weapon === itemDb.coins && restoredEquipment.shield === null, "runtime should restore equipment from item db");

  const prefs = runtime.sanitizeUserItemPrefs({ coins: "Use", bad: 7, "": "Drop" });
  assert(prefs.coins === "Use" && !("bad" in prefs) && !("" in prefs), "runtime should sanitize user item preferences");

  const skills = runtime.sanitizeSkillState(context, {
    attack: { xp: 250, level: 99 },
    hitpoints: { xp: -10, level: 0 }
  });
  assert(skills.attack.xp === 250 && skills.attack.level === 3, "runtime should derive levels from xp when a resolver is provided");
  assert(skills.hitpoints.xp === 0 && skills.hitpoints.level === 1, "runtime should clamp invalid saved skill values");

  const emptyProfile = runtime.createEmptyPlayerProfile();
  assert(emptyProfile.name === "" && emptyProfile.creationCompleted === false, "runtime should create empty player profiles");
  const legacyProfile = runtime.sanitizePlayerProfile(context, null, { allowLegacyFallback: true, savedWorldId: "main_overworld" });
  assert(legacyProfile.name === "Adventurer", "runtime should apply legacy profile default names");
  assert(legacyProfile.creationCompleted === true, "runtime should mark legacy profiles as created");
  assert(legacyProfile.createdAt === 12345, "runtime should stamp legacy createdAt");
  assert(legacyProfile.tutorialCompletedAt === 12345 && legacyProfile.tutorialStep === 7, "runtime should infer tutorial completion for legacy overworld saves");
  const syncedProfile = runtime.syncPlayerProfileState(context, {
    name: "Alice",
    creationCompleted: true,
    createdAt: 12.9,
    tutorialStep: 3.8,
    tutorialBankDepositSource: "banker"
  });
  assert(syncedProfile === context.playerProfileState, "runtime should mutate the provided profile object");
  assert(context.playerProfileState.name === "Alice" && context.playerProfileState.createdAt === 12, "runtime should sync profile scalar fields");
  const serializedProfile = runtime.serializePlayerProfile(context);
  assert(serializedProfile.name === "Alice" && serializedProfile.tutorialStep === 3, "runtime should serialize profile state");

  const appearance = runtime.sanitizeAppearanceState(context, { gender: 1, colors: [4.8, "bad", 2] });
  assert(appearance.gender === 1, "runtime should restore appearance gender");
  assert(appearance.colors.join(",") === "4,0,2,0,0", "runtime should sanitize appearance colors");
  const serializedAppearance = runtime.serializeAppearanceState(context);
  assert(serializedAppearance.gender === 1 && serializedAppearance.colors.length === 5, "runtime should serialize current appearance state");

  const removedKeys = [];
  const storage = { removeItem: (key) => removedKeys.push(key) };
  const savedPayloads = [];
  const lifecycleContext = {
    storage,
    storageKey: "progress.v1",
    poseEditorStorageKey: "poseEditor.v1",
    gameSessionRuntime: {
      saveProgressPayloadToStorage: (options) => {
        savedPayloads.push(options);
        return { ok: true };
      },
      loadProgressPayloadFromStorage: () => ({ loaded: false })
    },
    buildProgressPayload: (reason) => ({ reason }),
    consoleRef: { warn: () => {} }
  };
  assert(runtime.canUseProgressStorage({}) === false, "runtime should reject missing progress storage context");
  assert(runtime.canUseProgressStorage(lifecycleContext) === true, "runtime should accept complete progress storage context");
  const saveResult = runtime.saveProgressToStorage(lifecycleContext, "manual_check");
  assert(saveResult.ok === true, "runtime should save progress through the session runtime");
  assert(savedPayloads[0].storage === storage && savedPayloads[0].storageKey === "progress.v1", "runtime should pass storage details to session save");
  assert(savedPayloads[0].payload.reason === "manual_check", "runtime should build save payloads with the requested reason");
  const clearResult = runtime.clearProgressFromStorage(lifecycleContext, { clearPoseEditor: true });
  assert(clearResult.ok === true && clearResult.clearedPoseEditor === true, "runtime should clear progress storage");
  assert(removedKeys.join(",") === "progress.v1,poseEditor.v1", "runtime should clear progress and optional pose editor storage keys");

  assert(runtime.shouldConsumeFreshSessionParam("") === true, "runtime should accept empty fresh-session params");
  assert(runtime.shouldConsumeFreshSessionParam("YES") === true, "runtime should accept yes-like fresh-session params");
  assert(runtime.shouldConsumeFreshSessionParam("0") === false, "runtime should reject falsey fresh-session params");
  let clearedFreshSession = false;
  let replacedUrl = "";
  const freshConsumed = runtime.consumeFreshSessionRequest({
    windowRef: {
      location: { search: "?fresh=1&foo=bar&clearSave=0", pathname: "/game", hash: "#spawn" },
      history: { replaceState: (state, title, url) => { replacedUrl = url; } }
    },
    documentRef: { title: "Game" },
    URLSearchParamsRef: URLSearchParams,
    clearProgressFromStorage: (options) => {
      clearedFreshSession = !!options.clearPoseEditor;
      return { ok: true };
    }
  });
  assert(freshConsumed === true && clearedFreshSession, "runtime should consume fresh-session requests and clear progress");
  assert(replacedUrl === "/game?foo=bar#spawn", "runtime should remove fresh-session params from the URL");

  const clearedIntervals = [];
  const autosaveReasons = [];
  const autosaveHandle = runtime.startProgressAutosave({
    progressAutosaveHandle: 7,
    progressAutosaveIntervalMs: 1234,
    clearIntervalRef: (handle) => clearedIntervals.push(handle),
    setIntervalRef: (callback, delay) => {
      assert(delay === 1234, "runtime should schedule autosave with configured interval");
      callback();
      return 9;
    },
    setProgressAutosaveHandle: (handle) => autosaveReasons.push(`handle:${handle}`),
    saveProgressToStorage: (reason) => autosaveReasons.push(reason)
  });
  assert(autosaveHandle === 9, "runtime should return the autosave interval handle");
  assert(clearedIntervals[0] === 7, "runtime should clear existing autosave intervals");
  assert(autosaveReasons.join(",") === "autosave,handle:9", "runtime should save autosave reason and publish the new handle");

  const lifecycleState = { sessionActivated: false, unloadSaveHooksRegistered: false };
  const registeredHooks = [];
  const lifecycleSaves = [];
  const lifecycleStarted = runtime.ensureProgressPersistenceLifecycle({
    playerEntryFlowState: lifecycleState,
    windowRef: { addEventListener: (eventName, callback) => registeredHooks.push({ eventName, callback }) },
    startProgressAutosave: () => lifecycleSaves.push("start"),
    saveProgressToStorage: (reason) => lifecycleSaves.push(reason)
  });
  assert(lifecycleStarted === true, "runtime should start progress lifecycle once");
  assert(lifecycleState.sessionActivated === true && lifecycleState.unloadSaveHooksRegistered === true, "runtime should mark progress lifecycle state");
  assert(registeredHooks.map((hook) => hook.eventName).join(",") === "beforeunload,pagehide", "runtime should register unload save hooks");
  registeredHooks[0].callback();
  registeredHooks[1].callback();
  assert(lifecycleSaves.join(",") === "start,beforeunload,pagehide", "runtime should flush saves from lifecycle hooks");

  let reloadCount = 0;
  const publicClear = runtime.clearProgressSave({
    windowRef: { location: { reload: () => { reloadCount += 1; } } },
    clearProgressFromStorage: () => ({ ok: true })
  }, { reload: true });
  assert(publicClear.ok === true && reloadCount === 1, "runtime should reload after successful public clear requests");
  const publicFresh = runtime.startFreshSession({
    windowRef: { location: { reload: () => { reloadCount += 1; } } },
    clearProgressFromStorage: (options) => ({ ok: !!options.clearPoseEditor })
  });
  assert(publicFresh.ok === true && reloadCount === 2, "runtime should clear pose editor state and reload for fresh sessions");

  console.log("Core progress runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
