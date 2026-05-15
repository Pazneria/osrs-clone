const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");


function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "combat-qa-debug-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/combat-qa-debug-runtime.js");
  const coreSource = readRepoFile(root, "src/js/core.js");
  const packageSource = readRepoFile(root, "package.json");

  assert(runtimeSource.includes("function publishWindowHooks(options = {})"), "combat QA debug runtime should own public hook publication");
  assert(runtimeSource.includes("windowRef.getQaCombatDebugSnapshot = function getQaCombatDebugSnapshot()"), "runtime should publish the snapshot hook");
  assert(runtimeSource.includes("windowRef.getQaCombatDebugSignature = function getQaCombatDebugSignature(snapshot = null)"), "runtime should publish the signature hook");
  assert(runtimeSource.includes("windowRef.emitQaCombatDebugClearHistory = function emitQaCombatDebugClearHistory()"), "runtime should publish the clear-history hook");
  assert(runtimeSource.includes("windowRef.emitQaCombatDebugSnapshot = function emitQaCombatDebugSnapshot(reason = 'manual')"), "runtime should publish the snapshot emitter hook");
  assert(coreSource.includes("function installCombatQaDebugHooks()"), "core.js should install combat QA debug hooks through a narrow adapter");
  assert(coreSource.includes("runtime.publishWindowHooks({"), "core.js should delegate public combat QA debug hooks to the runtime");
  assert(coreSource.includes("buildContext: buildCombatQaDebugContext"), "core.js should pass live state through the combat QA context builder");
  assert(!coreSource.includes("function getQaCombatDebugSnapshot()"), "core.js should not own the public combat QA snapshot hook");
  assert(!coreSource.includes("function getQaCombatDebugSignature(snapshot = null)"), "core.js should not own the public combat QA signature hook");
  assert(!coreSource.includes("function emitQaCombatDebugClearHistory()"), "core.js should not own the public combat QA clear-history hook");
  assert(!coreSource.includes("function emitQaCombatDebugSnapshot(reason = 'manual')"), "core.js should not own the public combat QA snapshot emitter hook");
  assert(coreSource.includes("emitQaCombatDebugSnapshot: (typeof window.emitQaCombatDebugSnapshot === 'function') ? window.emitQaCombatDebugSnapshot : null"), "QA command context should read the published snapshot emitter");
  assert(coreSource.includes("emitQaCombatDebugClearHistory: (typeof window.emitQaCombatDebugClearHistory === 'function') ? window.emitQaCombatDebugClearHistory : null"), "QA command context should read the published clear-history emitter");
  assert(packageSource.includes('"test:combat:qa-debug-hooks"'), "package should expose a targeted combat QA debug public hook guard");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CombatQaDebugRuntime;
  assert(runtime, "combat QA debug runtime should execute in isolation");
  assert(typeof runtime.publishWindowHooks === "function", "runtime should expose publishWindowHooks");

  const messages = [];
  let tick = 41;
  runtime.publishWindowHooks({
    windowRef: sandbox.window,
    buildContext: () => ({
      windowRef: sandbox.window,
      currentTick: ++tick,
      nowMs: 1000,
      playerState: {
        x: 10,
        y: 20,
        z: 0,
        targetX: 11,
        targetY: 21,
        action: "IDLE",
        remainingAttackCooldown: 0,
        path: []
      },
      addChatMessage: (message, type) => messages.push({ message, type })
    })
  });

  assert(typeof sandbox.window.getQaCombatDebugSnapshot === "function", "snapshot hook should be published on window");
  assert(typeof sandbox.window.getQaCombatDebugSignature === "function", "signature hook should be published on window");
  assert(typeof sandbox.window.emitQaCombatDebugClearHistory === "function", "clear-history hook should be published on window");
  assert(typeof sandbox.window.emitQaCombatDebugSnapshot === "function", "snapshot emitter hook should be published on window");

  const snapshot = sandbox.window.getQaCombatDebugSnapshot();
  assert(snapshot.tick === 42, "published snapshot hook should use a fresh built context");
  assert(snapshot.player.x === 10 && snapshot.player.y === 20, "published snapshot hook should read player state from the context");

  const signature = sandbox.window.getQaCombatDebugSignature(snapshot);
  assert(typeof signature === "string" && signature.includes("IDLE"), "published signature hook should delegate to runtime signature shaping");

  const emitted = sandbox.window.emitQaCombatDebugSnapshot("manual");
  assert(emitted.tick === 44, "published snapshot emitter should use a fresh built context");
  assert(messages.some((entry) => entry.message.includes("[QA combatdbg] reason=manual") && entry.type === "info"), "published snapshot emitter should write debug chat through the built context");

  sandbox.window.emitQaCombatDebugClearHistory();
  assert(messages.some((entry) => entry.message === "[QA combatdbg] clear history is empty."), "published clear-history hook should delegate chat output through the built context");

  console.log("Combat QA debug public hooks guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
