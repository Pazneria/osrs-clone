const assert = require("assert");
const vm = require("vm");
const { createRepoFileReader } = require("./repo-file-test-utils");

const read = createRepoFileReader(__dirname);

const runtimeSource = read("src/js/combat-hud-runtime.js");
const combatSource = read("src/js/combat.js");
const manifestSource = read("src/game/platform/legacy-script-manifest.ts");

assert.ok(runtimeSource.includes("window.CombatHudRuntime"), "combat HUD runtime should expose a window runtime");
assert.ok(runtimeSource.includes("function resolveCombatHudFocusEnemy(context = {})"), "combat HUD runtime should own HUD focus selection");
assert.ok(runtimeSource.includes("function buildCombatHudSnapshot(context = {})"), "combat HUD runtime should own HUD snapshot shaping");
assert.ok(manifestSource.includes("../../js/combat-hud-runtime.js?raw"), "legacy manifest should import combat HUD runtime");
assert.ok(
  manifestSource.indexOf('id: "combat-hud-runtime"') !== -1
    && manifestSource.indexOf('id: "combat-hud-runtime"') < manifestSource.indexOf('id: "combat"'),
  "legacy manifest should load combat HUD runtime before combat.js"
);
assert.ok(combatSource.includes("const combatHudRuntime = window.CombatHudRuntime || null;"), "combat.js should resolve the combat HUD runtime");
assert.ok(combatSource.includes("function buildCombatHudRuntimeContext()"), "combat.js should adapt state into a HUD runtime context");
assert.ok(combatSource.includes("return getCombatHudRuntime().resolveCombatHudFocusEnemy(buildCombatHudRuntimeContext());"), "combat.js should delegate HUD focus selection");
assert.ok(combatSource.includes("return getCombatHudRuntime().buildCombatHudSnapshot(buildCombatHudRuntimeContext());"), "combat.js should delegate HUD snapshot shaping");
assert.ok(!combatSource.includes("const lockedEnemy = getPlayerLockedEnemy();\r\n        if (lockedEnemy && isEnemyAlive(lockedEnemy))"), "combat.js should not own HUD focus branching inline");
assert.ok(!combatSource.includes("playerRemainingAttackCooldown: Number.isFinite(playerState.remainingAttackCooldown)"), "combat.js should not own HUD snapshot shaping inline");

const sandbox = { window: {} };
vm.runInNewContext(runtimeSource, sandbox, { filename: "src/js/combat-hud-runtime.js" });
const runtime = sandbox.window.CombatHudRuntime;
assert.ok(runtime, "combat HUD runtime should execute in isolation");

let ensureCalled = false;
const lockedEnemy = {
  runtimeId: "enemy-a",
  enemyId: "enemy_rat",
  currentHealth: 2,
  remainingAttackCooldown: 3,
  currentState: "aggroed",
  x: 8,
  y: 7,
  z: 0
};
const lockedSnapshot = runtime.buildCombatHudSnapshot({
  ensureCombatEnemyWorldReady: () => { ensureCalled = true; },
  getPlayerLockedEnemy: () => lockedEnemy,
  getCombatEnemyState: () => null,
  getEnemyDefinition: () => ({ displayName: "Rat", stats: { hitpoints: 3 } }),
  isEnemyAlive: () => true,
  isWithinMeleeRange: () => true,
  playerState: {
    x: 7,
    y: 7,
    z: 0,
    inCombat: true,
    remainingAttackCooldown: 2,
    lastDamagerEnemyId: null
  },
  playerTargetId: "player"
});
assert.strictEqual(ensureCalled, true, "combat HUD snapshot should ensure combat world readiness");
assert.strictEqual(lockedSnapshot.inCombat, true, "combat HUD snapshot should include player combat state");
assert.strictEqual(lockedSnapshot.playerRemainingAttackCooldown, 2, "combat HUD snapshot should normalize player cooldown");
assert.strictEqual(lockedSnapshot.target.label, "Rat", "combat HUD snapshot should include enemy display name");
assert.strictEqual(lockedSnapshot.target.focusLabel, "Target", "locked enemy should be the HUD target focus");
assert.strictEqual(lockedSnapshot.target.currentHealth, 2, "combat HUD snapshot should include enemy current health");
assert.strictEqual(lockedSnapshot.target.maxHealth, 3, "combat HUD snapshot should include enemy max health");
assert.strictEqual(lockedSnapshot.target.distance, 1, "combat HUD snapshot should compute Chebyshev distance");
assert.strictEqual(lockedSnapshot.target.inMeleeRange, true, "combat HUD snapshot should include melee range");

const aggressor = {
  runtimeId: "enemy-b",
  enemyId: "enemy_boar",
  currentState: "aggroed",
  lockedTargetId: "player",
  currentHealth: 4,
  remainingAttackCooldown: 1,
  x: 3,
  y: 4,
  z: 0
};
const aggressorFocus = runtime.resolveCombatHudFocusEnemy({
  getPlayerLockedEnemy: () => null,
  getCombatEnemyState: () => aggressor,
  isEnemyAlive: () => true,
  playerState: { lastDamagerEnemyId: "enemy-b" },
  playerTargetId: "player"
});
assert.strictEqual(aggressorFocus.enemyState.runtimeId, "enemy-b", "combat HUD runtime should fall back to the last aggressor");
assert.strictEqual(aggressorFocus.focusLabel, "Aggressor", "last damager focus should be labeled as aggressor");

const emptySnapshot = runtime.buildCombatHudSnapshot({
  getPlayerLockedEnemy: () => null,
  getCombatEnemyState: () => null,
  getEnemyDefinition: () => null,
  playerState: { remainingAttackCooldown: Number.NaN, inCombat: false }
});
assert.deepStrictEqual(
  { inCombat: emptySnapshot.inCombat, cooldown: emptySnapshot.playerRemainingAttackCooldown, target: emptySnapshot.target },
  { inCombat: false, cooldown: 0, target: null },
  "combat HUD runtime should handle empty focus state"
);

console.log("Combat HUD runtime guard passed.");
