const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

const root = path.resolve(__dirname, "..", "..");

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

const runtimeSource = read("src/js/combat-engagement-runtime.js");
const combatSource = read("src/js/combat.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");

assert.ok(runtimeSource.includes("window.CombatEngagementRuntime"), "combat engagement runtime should expose a window runtime");
assert.ok(runtimeSource.includes("function validatePlayerTargetLock(context = {})"), "engagement runtime should own player lock validation");
assert.ok(runtimeSource.includes("function pickAutoRetaliateTarget(context = {})"), "engagement runtime should own auto-retaliate selection");
assert.ok(runtimeSource.includes("function acquireAggressiveEnemyTargets(context = {})"), "engagement runtime should own aggressive acquisition");
assert.ok(runtimeSource.includes("function movePlayerTowardLockedTarget(context = {}, playerLockState, attackedThisTick)"), "engagement runtime should own player pursuit action shaping");
assert.ok(manifestSource.includes("../../js/combat-engagement-runtime.js?raw"), "legacy manifest should import combat engagement runtime");
assert.ok(
  manifestSource.indexOf('id: "combat-engagement-runtime"') !== -1
    && manifestSource.indexOf('id: "combat-engagement-runtime"') < manifestSource.indexOf('id: "combat"'),
  "legacy manifest should load combat engagement runtime before combat.js"
);
assert.ok(combatSource.includes("const combatEngagementRuntime = window.CombatEngagementRuntime || null;"), "combat.js should resolve the combat engagement runtime");
assert.ok(combatSource.includes("function buildCombatEngagementRuntimeContext()"), "combat.js should adapt state into an engagement runtime context");
assert.ok(combatSource.includes("return getCombatEngagementRuntime().validatePlayerTargetLock(buildCombatEngagementRuntimeContext());"), "combat.js should delegate player lock validation");
assert.ok(combatSource.includes("return getCombatEngagementRuntime().pickAutoRetaliateTarget(buildCombatEngagementRuntimeContext());"), "combat.js should delegate auto-retaliate target picking");
assert.ok(combatSource.includes("getCombatEngagementRuntime().acquireAggressiveEnemyTargets(buildCombatEngagementRuntimeContext());"), "combat.js should delegate aggressive enemy acquisition");
assert.ok(combatSource.includes("getCombatEngagementRuntime().movePlayerTowardLockedTarget(buildCombatEngagementRuntimeContext(), playerLockState, attackedThisTick);"), "combat.js should delegate player pursuit movement shaping");
assert.ok(!combatSource.includes("const occupancyIgnoredPursuitPath = resolvePathToEnemy(lockedEnemy, {"), "combat.js should not own occupancy-ignored lock validation inline");
assert.ok(!combatSource.includes("const candidates = combatEnemyStates.filter((enemyState) => isValidAutoRetaliateCandidate(enemyState));"), "combat.js should not own auto-retaliate candidate sorting inline");
assert.ok(!combatSource.includes("const playerTile = { x: playerState.x, y: playerState.y, z: playerState.z };"), "combat.js should not keep engagement player-tile policy inline");

const sandbox = { window: {} };
vm.runInNewContext(runtimeSource, sandbox, { filename: "src/js/combat-engagement-runtime.js" });
const runtime = sandbox.window.CombatEngagementRuntime;
assert.ok(runtime, "combat engagement runtime should execute in isolation");

const debugEvents = [];
const clearEvents = [];
const playerState = {
  x: 1,
  y: 1,
  z: 0,
  lockedTargetId: "enemy-a",
  combatTargetKind: "enemy",
  targetObj: "ENEMY",
  path: []
};
const enemyA = {
  runtimeId: "enemy-a",
  enemyId: "enemy_rat",
  currentState: "idle",
  x: 3,
  y: 1,
  z: 0,
  resolvedHomeTile: { x: 3, y: 1, z: 0 },
  resolvedSpawnTile: { x: 3, y: 1, z: 0 },
  resolvedChaseRange: 8
};
const validLock = runtime.validatePlayerTargetLock({
  playerState,
  playerTargetKind: "enemy",
  playerPursuitStateHardNoPath: "hard",
  playerPursuitStateTemporaryBlock: "blocked",
  playerPursuitStateValid: "valid",
  getPlayerLockedEnemy: () => enemyA,
  isEnemyAlive: () => true,
  resolvePathToEnemy: () => [{ x: 2, y: 1 }],
  recordPlayerPursuitDebug: (...args) => debugEvents.push(args),
  clearPlayerCombatTarget: (event) => clearEvents.push(event)
});
assert.strictEqual(validLock.enemyState.runtimeId, "enemy-a", "engagement runtime should return the locked enemy");
assert.strictEqual(validLock.pursuitState, "valid", "engagement runtime should label valid pursuit paths");
assert.strictEqual(playerState.targetX, 3, "engagement runtime should keep player target X synced");
assert.strictEqual(playerState.targetY, 1, "engagement runtime should keep player target Y synced");
assert.strictEqual(debugEvents[0][1], "valid", "engagement runtime should publish pursuit debug state");
assert.strictEqual(clearEvents.length, 0, "valid lock should not clear player target");

let pathProbeCount = 0;
const blockedLock = runtime.validatePlayerTargetLock({
  playerState,
  playerTargetKind: "enemy",
  playerPursuitStateHardNoPath: "hard",
  playerPursuitStateTemporaryBlock: "blocked",
  playerPursuitStateValid: "valid",
  getPlayerLockedEnemy: () => enemyA,
  isEnemyAlive: () => true,
  resolvePathToEnemy: (_enemy, opts) => {
    pathProbeCount += 1;
    return opts && opts.ignoreCombatEnemyOccupancy ? [{ x: 2, y: 1 }] : null;
  },
  recordPlayerPursuitDebug: (...args) => debugEvents.push(args),
  clearPlayerCombatTarget: (event) => clearEvents.push(event)
});
assert.strictEqual(pathProbeCount, 2, "engagement runtime should retry target lock validation while ignoring combat occupancy");
assert.strictEqual(blockedLock.pursuitState, "blocked", "temporary occupancy blockage should keep the lock");

const missingLock = runtime.validatePlayerTargetLock({
  playerState,
  playerTargetKind: "enemy",
  playerPursuitStateHardNoPath: "hard",
  getPlayerLockedEnemy: () => null,
  recordPlayerPursuitDebug: (...args) => debugEvents.push(args),
  clearPlayerCombatTarget: (event) => clearEvents.push(event)
});
assert.strictEqual(missingLock, null, "missing lock should return no pursuit state");
assert.strictEqual(clearEvents.pop().reason, "missing-locked-enemy", "missing lock should clear stale combat selection");

const enemyStates = [
  { runtimeId: "z-last", enemyId: "enemy_wolf", currentState: "aggroed", lockedTargetId: "player", z: 0, x: 6, y: 1, resolvedHomeTile: { x: 6, y: 1, z: 0 }, resolvedChaseRange: 8, autoRetaliateAggressorOrder: 1 },
  { runtimeId: "a-first", enemyId: "enemy_rat", currentState: "aggroed", lockedTargetId: "player", z: 0, x: 2, y: 1, resolvedHomeTile: { x: 2, y: 1, z: 0 }, resolvedChaseRange: 8, autoRetaliateAggressorOrder: 1 }
];
const retaliateTarget = runtime.pickAutoRetaliateTarget({
  combatEnemyStates: enemyStates,
  playerState: { x: 1, y: 1, z: 0 },
  playerTargetId: "player",
  isEnemyAlive: () => true,
  isPlayerAlive: () => true,
  getSquareRange: () => true,
  getChebyshevDistance: (left, right) => Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y)),
  getAutoRetaliateCandidateCombatLevel: (enemy) => enemy.enemyId === "enemy_rat" ? 2 : 5
});
assert.strictEqual(retaliateTarget.runtimeId, "a-first", "auto-retaliate should choose the nearest attacker before level/name tiebreaks");

const aggroEnemy = {
  runtimeId: "enemy-aggro",
  enemyId: "enemy_boar",
  currentState: "idle",
  x: 4,
  y: 1,
  z: 0,
  resolvedAggroRadius: 6
};
let facedEnemy = null;
let clearedIdle = false;
runtime.acquireAggressiveEnemyTargets({
  combatEnemyStates: [aggroEnemy],
  playerState: { x: 1, y: 1, z: 0 },
  playerTargetId: "player",
  isPlayerAlive: () => true,
  isEnemyAlive: () => true,
  getEnemyDefinition: () => ({ behavior: { aggroType: "aggressive" } }),
  getSquareRange: () => true,
  resolvePathToPlayer: () => [{ x: 3, y: 1 }],
  faceEnemyTowards: (enemy) => { facedEnemy = enemy.runtimeId; },
  clearEnemyIdleWanderState: () => { clearedIdle = true; }
});
assert.strictEqual(aggroEnemy.currentState, "aggroed", "aggressive enemies should acquire the player when in aggro range");
assert.strictEqual(aggroEnemy.lockedTargetId, "player", "aggressive enemies should lock the player target");
assert.strictEqual(facedEnemy, "enemy-aggro", "aggressive acquisition should face the player");
assert.strictEqual(clearedIdle, true, "aggressive acquisition should clear idle wander state");

const pursuitPlayerState = { action: "IDLE", path: [] };
runtime.movePlayerTowardLockedTarget({
  playerState: pursuitPlayerState,
  playerPursuitStateTemporaryBlock: "blocked",
  isWithinMeleeRange: () => false
}, { pursuitState: "blocked", enemyState: enemyA, pursuitPath: null }, false);
assert.strictEqual(pursuitPlayerState.path.length, 0, "temporary blockage should stop stale pursuit paths");
assert.strictEqual(pursuitPlayerState.action, "COMBAT: MELEE", "temporary blockage should keep melee intent");
runtime.movePlayerTowardLockedTarget({
  playerState: pursuitPlayerState,
  playerPursuitStateTemporaryBlock: "blocked",
  isWithinMeleeRange: () => false
}, { pursuitState: "valid", enemyState: enemyA, pursuitPath: [{ x: 2, y: 1 }] }, false);
assert.strictEqual(pursuitPlayerState.path.length, 1, "valid pursuit should set the player path");
assert.strictEqual(pursuitPlayerState.path[0].x, 2, "valid pursuit should set the player path X");
assert.strictEqual(pursuitPlayerState.path[0].y, 1, "valid pursuit should set the player path Y");
assert.strictEqual(pursuitPlayerState.action, "WALKING", "valid pursuit should put the player into walking action");

console.log("Combat engagement runtime guard passed.");
