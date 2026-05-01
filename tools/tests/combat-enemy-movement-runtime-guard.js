const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function makeEnemy(overrides = {}) {
  return Object.assign({
    runtimeId: "enemy-a",
    x: 4,
    y: 4,
    z: 0,
    prevX: 4,
    prevY: 4,
    currentState: "idle",
    lockedTargetId: null,
    resolvedHomeTile: { x: 4, y: 4, z: 0 },
    resolvedSpawnTile: { x: 4, y: 4, z: 0 },
    resolvedRoamingRadius: 4
  }, overrides);
}

const runtimeSource = read("src/js/combat-enemy-movement-runtime.js");
const combatSource = read("src/js/combat.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");
const packageJson = read("package.json");

assert.ok(runtimeSource.includes("window.CombatEnemyMovementRuntime"), "movement runtime should expose a window runtime");
assert.ok(runtimeSource.includes("function updateEnemyMovement(context = {}, attacks = [])"), "movement runtime should own enemy movement orchestration");
assert.ok(runtimeSource.includes("function updateIdleEnemyMovement(context = {}, enemyState, reservedTiles)"), "movement runtime should own idle enemy movement");
assert.ok(runtimeSource.includes("function resolvePlayerChaseAttackOpportunity(context = {}, playerLockState)"), "movement runtime should own player chase attack approach policy");
assert.ok(runtimeSource.includes("const homeStep = returnPath[0];"), "movement runtime should keep enemy return movement one tile per tick");
assert.ok(runtimeSource.includes("const nextStep = pursuitPath[0];"), "movement runtime should keep enemy pursuit movement one tile per tick");
assert.ok(runtimeSource.includes("context.isTrainingDummyEnemy(enemyState)"), "movement runtime should keep training dummy movement suppression");
assert.ok(combatSource.includes("const combatEnemyMovementRuntime = window.CombatEnemyMovementRuntime || null;"), "combat.js should resolve the movement runtime");
assert.ok(combatSource.includes("function buildCombatEnemyMovementRuntimeContext()"), "combat.js should provide a narrow movement runtime context");
assert.ok(combatSource.includes("getCombatEnemyMovementRuntime().updateEnemyMovement(buildCombatEnemyMovementRuntimeContext(), attacks);"), "combat.js should delegate enemy movement orchestration");
assert.ok(!combatSource.includes("function pickEnemyIdleWanderTarget(enemyState, reservedTiles)"), "combat.js should not own idle wander target picking");
assert.ok(!combatSource.includes("const homeStep = returnPath[0];"), "combat.js should not own return step selection");
assert.ok(!combatSource.includes("const nextStep = pursuitPath[0];"), "combat.js should not own pursuit step selection");
assert.ok(manifestSource.includes("../../js/combat-enemy-movement-runtime.js?raw"), "legacy manifest should import combat enemy movement runtime");
assert.ok(
  manifestSource.indexOf('id: "combat-enemy-movement-runtime"') !== -1
    && manifestSource.indexOf('id: "combat"') !== -1
    && manifestSource.indexOf('id: "combat-enemy-movement-runtime"') < manifestSource.indexOf('id: "combat"'),
  "legacy manifest should load combat enemy movement runtime before combat.js"
);
assert.ok(packageJson.includes("test:combat:movement"), "package scripts should expose the movement runtime guard");

const sandbox = { window: {}, Math, Number, Date, Set, Object, console };
vm.runInNewContext(runtimeSource, sandbox, { filename: "src/js/combat-enemy-movement-runtime.js" });
const runtime = sandbox.window.CombatEnemyMovementRuntime;
assert.ok(runtime, "movement runtime should evaluate in isolation");

let movedStep = null;
const logicalMap = [Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => 1))];
const baseContext = {
  combatEnemyStates: [],
  currentTick: 10,
  enemyIdleWanderPauseMinTicks: 2,
  enemyIdleWanderPauseMaxTicks: 2,
  enemyIdleWanderPickAttempts: 1,
  enemyIdleWanderMinPathLength: 3,
  enemyMoveClipHoldMs: 100,
  findPath: (sx, sy, tx, ty) => {
    if (sx === tx && sy === ty) return [];
    return [{ x: sx + Math.sign(tx - sx), y: sy + Math.sign(ty - sy) }];
  },
  isEnemyAlive: (enemy) => !!enemy && enemy.currentState !== "dead",
  isPlayerAlive: () => true,
  isRunning: true,
  isTrainingDummyEnemy: (enemy) => enemy && enemy.enemyId === "enemy_training_dummy",
  isWalkableTileId: () => true,
  isWithinMeleeRange: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1,
  logicalMap,
  mapSize: 12,
  moveEnemyToStep: (enemy, step) => {
    movedStep = step;
    enemy.prevX = enemy.x;
    enemy.prevY = enemy.y;
    enemy.x = step.x;
    enemy.y = step.y;
  },
  playerState: { x: 8, y: 4, z: 0 },
  playerTargetId: "player",
  rollInclusive: () => 1,
  beginEnemyReturn: (enemy) => { enemy.currentState = "returning"; },
  restoreEnemyAtHome: (enemy) => {
    enemy.x = enemy.resolvedHomeTile.x;
    enemy.y = enemy.resolvedHomeTile.y;
    enemy.z = enemy.resolvedHomeTile.z;
    enemy.currentState = "idle";
  },
  faceEnemyTowards: (enemy, target) => {
    enemy.facingYaw = Math.atan2(target.x - enemy.x, target.y - enemy.y);
  }
};

const chaseOpportunity = runtime.resolvePlayerChaseAttackOpportunity(baseContext, {
  enemyState: { x: 6, y: 4, z: 0 },
  pursuitPath: [{ x: 5, y: 4 }, { x: 6, y: 4 }]
});
assert.strictEqual(chaseOpportunity.attackTile.x, 6, "running player chase should be able to attack from the second approach tile x");
assert.strictEqual(chaseOpportunity.attackTile.y, 4, "running player chase should be able to attack from the second approach tile y");
assert.strictEqual(chaseOpportunity.approachPath.length, 2, "running player chase should preserve the two-step approach path");

const pursuingEnemy = makeEnemy({
  runtimeId: "enemy-pursuer",
  enemyId: "enemy_rat",
  currentState: "aggroed",
  lockedTargetId: "player",
  x: 4,
  y: 4
});
runtime.updateEnemyMovement(Object.assign({}, baseContext, {
  combatEnemyStates: [pursuingEnemy]
}), []);
assert.strictEqual(movedStep.x, 5, "aggroed enemy movement should advance one step toward the player x");
assert.strictEqual(movedStep.y, 4, "aggroed enemy movement should advance one step toward the player y");
assert.strictEqual(pursuingEnemy.x, 5, "aggroed enemy should move to the chosen step");

movedStep = null;
const dummyEnemy = makeEnemy({
  runtimeId: "enemy-dummy",
  enemyId: "enemy_training_dummy",
  currentState: "aggroed",
  lockedTargetId: "player"
});
runtime.updateEnemyMovement(Object.assign({}, baseContext, {
  combatEnemyStates: [dummyEnemy]
}), []);
assert.strictEqual(movedStep, null, "training dummy enemies should not move while aggroed");
assert.ok(Number.isFinite(dummyEnemy.facingYaw), "training dummy enemies should still face the player");

const returningEnemy = makeEnemy({
  runtimeId: "enemy-returning",
  currentState: "returning",
  x: 7,
  y: 4,
  resolvedHomeTile: { x: 4, y: 4, z: 0 }
});
movedStep = null;
runtime.updateEnemyMovement(Object.assign({}, baseContext, {
  combatEnemyStates: [returningEnemy]
}), []);
assert.strictEqual(movedStep.x, 6, "returning enemy movement should advance one step toward home x");
assert.strictEqual(movedStep.y, 4, "returning enemy movement should advance one step toward home y");

const idleEnemy = makeEnemy({ idleMoveReadyAtTick: 0 });
movedStep = null;
runtime.updateIdleEnemyMovement(baseContext, idleEnemy, new Set([`${idleEnemy.x},${idleEnemy.y},${idleEnemy.z}`]));
assert.ok(movedStep, "idle movement should advance toward its wander destination");

console.log("Combat enemy movement runtime guard passed.");
