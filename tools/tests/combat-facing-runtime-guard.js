const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { approximatelyEqual } = require("./collection-test-utils");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "combat-facing-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/combat-facing-runtime.js");
  const combatSource = readRepoFile(root, "src/js/combat.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const facingIndex = manifestSource.indexOf('id: "combat-facing-runtime"');
  const combatIndex = manifestSource.indexOf('id: "combat"');

  assert(facingIndex !== -1, "legacy manifest should include combat facing runtime");
  assert(combatIndex !== -1 && facingIndex < combatIndex, "legacy manifest should load facing runtime before combat.js");
  assert(runtimeSource.includes("window.CombatFacingRuntime"), "facing runtime should expose a window runtime");
  assert(runtimeSource.includes("function resolveFacingYaw(fromTile, toTile)"), "facing runtime should own facing yaw math");
  assert(runtimeSource.includes("function facePlayerTowards(context = {}, tile)"), "facing runtime should own player facing updates");
  assert(runtimeSource.includes("function faceEnemyTowards(enemyState, tile)"), "facing runtime should own enemy facing updates");
  assert(runtimeSource.includes("function syncMeleeCombatFacing(context = {})"), "facing runtime should own melee facing sync");

  assert(combatSource.includes("const combatFacingRuntime = window.CombatFacingRuntime || null;"), "combat.js should resolve the facing runtime");
  assert(combatSource.includes("function buildCombatFacingRuntimeContext()"), "combat.js should adapt facing context narrowly");
  assert(combatSource.includes("getCombatFacingRuntime().facePlayerTowards(buildCombatFacingRuntimeContext(), tile);"), "combat.js should delegate player facing");
  assert(combatSource.includes("getCombatFacingRuntime().faceEnemyTowards(enemyState, tile);"), "combat.js should delegate enemy facing");
  assert(combatSource.includes("getCombatFacingRuntime().syncMeleeCombatFacing(buildCombatFacingRuntimeContext());"), "combat.js should delegate melee facing sync");
  assert(!combatSource.includes("playerState.targetRotation = Math.atan2(dx, dy);"), "combat.js should not compute player facing inline");
  assert(!combatSource.includes("enemyState.facingYaw = Math.atan2(dx, dy);"), "combat.js should not compute enemy facing inline");
  assert(!combatSource.includes("const focus = resolveCombatHudFocusEnemy();"), "combat.js should not own melee facing sync branching inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CombatFacingRuntime;
  assert(runtime, "combat facing runtime should evaluate in isolation");
  assert(typeof runtime.resolveFacingYaw === "function", "runtime should expose resolveFacingYaw");
  assert(typeof runtime.facePlayerTowards === "function", "runtime should expose facePlayerTowards");
  assert(typeof runtime.faceEnemyTowards === "function", "runtime should expose faceEnemyTowards");
  assert(typeof runtime.isPlayerCombatFacingReady === "function", "runtime should expose isPlayerCombatFacingReady");
  assert(typeof runtime.syncMeleeCombatFacing === "function", "runtime should expose syncMeleeCombatFacing");

  assert(approximatelyEqual(runtime.resolveFacingYaw({ x: 1, y: 1 }, { x: 2, y: 1 }), Math.PI / 2, 0.000001), "runtime should compute east-facing yaw");
  assert(runtime.resolveFacingYaw({ x: 1, y: 1 }, { x: 1, y: 1 }) === null, "runtime should ignore zero-distance facing");

  const playerState = { x: 1, y: 1, z: 0, prevX: 1, prevY: 1, midX: null, midY: null, path: [], inCombat: true };
  const enemyState = { x: 3, y: 1, z: 0, currentState: "aggroed", lockedTargetId: "player" };
  assert(runtime.isPlayerCombatFacingReady({ playerState }) === true, "runtime should allow stationary player facing");
  runtime.facePlayerTowards({ playerState }, enemyState);
  assert(approximatelyEqual(playerState.targetRotation, Math.PI / 2, 0.000001), "runtime should rotate player toward enemy");
  runtime.faceEnemyTowards(enemyState, playerState);
  assert(approximatelyEqual(enemyState.facingYaw, -Math.PI / 2, 0.000001), "runtime should rotate enemy toward player");

  enemyState.facingYaw = 0;
  playerState.targetRotation = 0;
  runtime.syncMeleeCombatFacing({
    combatEnemyStates: [enemyState],
    isEnemyAlive: () => true,
    isPlayerAlive: () => true,
    playerState,
    playerTargetId: "player",
    resolveCombatHudFocusEnemy: () => ({ enemyState })
  });
  assert(approximatelyEqual(playerState.targetRotation, Math.PI / 2, 0.000001), "runtime should sync player facing toward HUD focus enemy");
  assert(approximatelyEqual(enemyState.facingYaw, -Math.PI / 2, 0.000001), "runtime should sync aggroed enemy facing toward player");

  playerState.path = [{ x: 2, y: 1 }];
  assert(runtime.isPlayerCombatFacingReady({ playerState }) === false, "runtime should block combat facing while pathing");

  console.log("Combat facing runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
