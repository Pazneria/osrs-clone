const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");


function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "combat-player-defeat-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/combat-player-defeat-runtime.js");
  const combatSource = readRepoFile(root, "src/js/combat.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const runtimeIndex = manifestSource.indexOf('id: "combat-player-defeat-runtime"');
  const combatIndex = manifestSource.indexOf('id: "combat"');

  assert(runtimeIndex !== -1, "legacy manifest should include combat player defeat runtime");
  assert(combatIndex !== -1 && runtimeIndex < combatIndex, "legacy manifest should load player defeat runtime before combat.js");
  assert(runtimeSource.includes("window.CombatPlayerDefeatRuntime"), "player defeat runtime should expose a window runtime");
  assert(runtimeSource.includes("function resolveRespawnLocation(context = {})"), "runtime should own respawn location resolution");
  assert(runtimeSource.includes("function applyPlayerDefeat(context = {})"), "runtime should own player defeat application");
  assert(runtimeSource.includes("function returnPlayerLockedEnemies(context = {})"), "runtime should own player-locked enemy returns");

  assert(combatSource.includes("const combatPlayerDefeatRuntime = window.CombatPlayerDefeatRuntime || null;"), "combat.js should resolve the player defeat runtime");
  assert(combatSource.includes("function buildCombatPlayerDefeatRuntimeContext()"), "combat.js should adapt player defeat context narrowly");
  assert(combatSource.includes("getCombatPlayerDefeatRuntime().resolveRespawnLocation(buildCombatPlayerDefeatRuntimeContext())"), "combat.js should delegate respawn resolution");
  assert(combatSource.includes("getCombatPlayerDefeatRuntime().applyPlayerDefeat(buildCombatPlayerDefeatRuntimeContext());"), "combat.js should delegate player defeat mutation");
  assert(!combatSource.includes("playerState.currentHitpoints = maxHitpoints;"), "combat.js should not reset player hitpoints inline");
  assert(!combatSource.includes("playerState.eatingCooldownEndTick = 0;"), "combat.js should not reset defeat cooldowns inline");
  assert(!combatSource.includes("addChatMessage(PLAYER_DEFEAT_MESSAGE, 'warn')"), "combat.js should not publish player defeat chat inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CombatPlayerDefeatRuntime;
  assert(runtime, "combat player defeat runtime should evaluate in isolation");
  assert(typeof runtime.resolveRespawnLocation === "function", "runtime should expose resolveRespawnLocation");
  assert(typeof runtime.applyPlayerDefeat === "function", "runtime should expose applyPlayerDefeat");

  const spawn = { x: 11, y: 12, z: 1 };
  const windowRef = {
    LegacyWorldAdapterRuntime: {
      getWorldDefaultSpawn(worldId, options) {
        assert(worldId === "main_overworld", "runtime should request the current world spawn");
        assert(options.mapSize === 256 && options.planes === 2, "runtime should pass map bounds into the adapter");
        return spawn;
      }
    }
  };
  const resolved = runtime.resolveRespawnLocation({
    getCurrentWorldId: () => "main_overworld",
    mapSize: 256,
    planes: 2,
    windowRef
  });
  assert(resolved.x === 11 && resolved.y === 12 && resolved.z === 1, "runtime should resolve adapter spawn coordinates");
  assert(resolved !== spawn, "runtime should clone adapter spawn coordinates");
  resolved.x = 99;
  assert(spawn.x === 11, "mutating resolved spawn should not mutate adapter data");

  const fallback = runtime.resolveRespawnLocation({ windowRef: {} });
  assert(fallback.x === 205 && fallback.y === 210 && fallback.z === 0, "runtime should provide the legacy fallback spawn");

  const playerState = {
    currentHitpoints: 1,
    remainingAttackCooldown: 3,
    lastDamagerEnemyId: "enemy-rat",
    eatingCooldownEndTick: 7,
    path: [{ x: 1, y: 1 }],
    x: 1,
    y: 2,
    z: 0,
    prevX: 0,
    prevY: 1,
    midX: 1.5,
    midY: 2.5,
    targetX: 3,
    targetY: 4,
    action: "FIGHTING",
    turnLock: true,
    actionVisualReady: false
  };
  const enemyA = { runtimeId: "enemy-a", lockedTargetId: "player" };
  const enemyB = { runtimeId: "enemy-b", lockedTargetId: "other" };
  const events = [];
  const result = runtime.applyPlayerDefeat({
    windowRef,
    getCurrentWorldId: () => "main_overworld",
    mapSize: 256,
    planes: 2,
    playerState,
    getMaxHitpoints: () => 14,
    clearPlayerCombatTarget: (options) => events.push(["clear-target", options.reason, options.force]),
    clearMinimapDestination: () => events.push(["clear-minimap"]),
    addChatMessage: (message, type) => events.push(["chat", message, type]),
    playerDefeatMessage: "Back to safety.",
    playerTargetId: "player",
    combatEnemyStates: [enemyA, enemyB],
    beginEnemyReturn: (enemyState) => {
      events.push(["return-enemy", enemyState.runtimeId]);
      enemyState.returned = true;
    }
  });

  assert(result && result.maxHitpoints === 14, "runtime should report applied max hitpoints");
  assert(result.returnedEnemyCount === 1, "runtime should report returned player-locked enemies");
  assert(playerState.currentHitpoints === 14, "runtime should reset player hitpoints");
  assert(playerState.x === 11 && playerState.y === 12 && playerState.z === 1, "runtime should move player to respawn");
  assert(playerState.prevX === 11 && playerState.prevY === 12, "runtime should reset previous position");
  assert(playerState.targetX === 11 && playerState.targetY === 12, "runtime should reset target position");
  assert(playerState.path.length === 0, "runtime should clear player path");
  assert(playerState.action === "IDLE" && playerState.turnLock === false && playerState.actionVisualReady === true, "runtime should restore idle visual state");
  assert(enemyA.returned === true && !enemyB.returned, "runtime should only return enemies locked to the player");
  assert(events.some((entry) => entry[0] === "clear-target" && entry[1] === "player-defeated" && entry[2] === true), "runtime should clear player combat target");
  assert(events.some((entry) => entry[0] === "clear-minimap"), "runtime should clear minimap destination");
  assert(events.some((entry) => entry[0] === "chat" && entry[1] === "Back to safety." && entry[2] === "warn"), "runtime should publish defeat chat");

  console.log("Combat player defeat runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
