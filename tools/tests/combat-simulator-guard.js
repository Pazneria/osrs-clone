const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const simulatorPath = path.join(root, "tools", "sim", "melee-sim.js");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const simulatorSource = fs.readFileSync(simulatorPath, "utf8");
const combatRoadmapSource = fs.readFileSync(path.join(root, "src", "js", "skills", "combat", "ROADMAP.md"), "utf8");
const combatStatusSource = fs.readFileSync(path.join(root, "src", "js", "skills", "combat", "STATUS.md"), "utf8");
const skillsIndexSource = fs.readFileSync(path.join(root, "src", "js", "skills", "_index.md"), "utf8");
const { runSimulation } = require("../sim/melee-sim");

assert(
  simulatorSource.includes("loadTsModule") &&
    simulatorSource.includes("src\", \"game\", \"combat\", \"content.ts") &&
    simulatorSource.includes("src\", \"game\", \"combat\", \"formulas.ts"),
  "melee simulator should load the typed combat content and formulas"
);
assert(
  simulatorSource.includes("computePlayerCombatSnapshot") &&
    simulatorSource.includes("buildCombatLoadout") &&
    simulatorSource.includes("computeEnemyMeleeCombatSnapshot") &&
    simulatorSource.includes("rollOpposedHitCheck") &&
    simulatorSource.includes("rollDamage"),
  "combat simulator should use canonical combat formula helpers and runtime-style loadouts"
);
assert(
  packageJson.scripts && packageJson.scripts["tool:sim:melee"],
  "package.json should expose the canonical melee simulator script"
);
assert(
  !(packageJson.scripts && packageJson.scripts["tool:sim:combat"]),
  "old combat simulator script should stay removed"
);
assert(
  combatRoadmapSource.includes("tools/sim/melee-sim.js") &&
    combatRoadmapSource.includes("npm.cmd run tool:sim:melee"),
  "combat roadmap should document the canonical melee simulator"
);
assert(
  /- \[x\] COMBAT-013: Rebuilt the combat simulator/.test(combatStatusSource) &&
    /- \[x\] COMBAT-017: Ranged player combat/.test(combatStatusSource) &&
    /- \[x\] COMBAT-018: Magic player combat/.test(combatStatusSource) &&
    /- \[x\] COMBAT-019A: Broader combat balance tooling/.test(combatStatusSource) &&
    /- \[x\] COMBAT-019B1: Water-family rune hits/.test(combatStatusSource) &&
    /## Now\s*- \[ \] COMBAT-019B2:/.test(combatStatusSource),
  "combat status should keep the simulator and first status-effect slices complete before advancing COMBAT-019"
);
assert(
  skillsIndexSource.includes("| Combat | In Progress | Water-family runes now apply a guarded Chilled effect that delays enemy swings, giving the magic lane a first tactical identity | Intentional special attacks, broader elemental effects, and player-facing combat feedback | None |"),
  "skills index should reflect the completed water-rune status-effect slice"
);

const summary = runSimulation({
  enemy: "enemy_goblin_grunt",
  weapon: "bronze_sword",
  style: "attack",
  attack: 10,
  strength: 10,
  defense: 10,
  hitpoints: 10,
  runs: 200,
  seed: "combat-sim-guard",
  maxTicks: 600
});

assert.strictEqual(summary.simulator, "canonical_combat_build_v1", "simulator ID mismatch");
assert(/^2026\.03\.c/.test(summary.combatSpecVersion), "combat spec version mismatch");
assert.strictEqual(summary.runs, 200, "simulator run count mismatch");
assert.strictEqual(summary.player.weaponId, "bronze_sword", "simulator weapon mismatch");
assert.strictEqual(summary.player.styleId, "attack", "simulator style mismatch");
assert.strictEqual(summary.player.styleFamily, "melee", "simulator style family mismatch");
assert.strictEqual(summary.enemy.enemyId, "enemy_goblin_grunt", "simulator enemy mismatch");
assert.strictEqual(summary.player.snapshot.attackValue, 15, "player attack snapshot should derive from canonical formula and bronze sword data");
assert.strictEqual(summary.player.snapshot.maxHit, 2, "player max-hit snapshot should derive from canonical formula and bronze sword data");
assert.strictEqual(summary.enemy.snapshot.defenseValue, 4, "enemy defense snapshot should derive from typed enemy content");
assert(summary.results.playerWins + summary.results.enemyWins + summary.results.draws === 200, "simulator outcome count mismatch");
assert(summary.results.playerWinRate > summary.results.enemyWinRate, "simulator should favor the stronger guarded player matchup");
assert(summary.results.averageTicks > 0, "simulator average tick count should be positive");
assert(summary.results.averageEnemyDamage > 0, "simulator should preserve enemy hit resolution");
assert(summary.results.averagePlayerSwings > 0, "simulator should count player swings");
assert(summary.results.averageEnemySwings > 0, "simulator should count enemy swings");

const rangedSummary = runSimulation({
  enemy: "enemy_goblin_grunt",
  weapon: "normal_shortbow",
  ammo: "bronze_arrows",
  style: "attack",
  attack: 10,
  strength: 10,
  defense: 10,
  ranged: 10,
  magic: 10,
  hitpoints: 10,
  runs: 200,
  seed: "combat-sim-ranged-guard",
  maxTicks: 600
});

assert.strictEqual(rangedSummary.simulator, "canonical_combat_build_v1", "ranged simulator ID mismatch");
assert.strictEqual(rangedSummary.player.weaponId, "normal_shortbow", "ranged simulator weapon mismatch");
assert.strictEqual(rangedSummary.player.ammoId, "bronze_arrows", "ranged simulator ammo mismatch");
assert.strictEqual(rangedSummary.player.styleId, "ranged", "ranged simulator style mismatch");
assert.strictEqual(rangedSummary.player.styleFamily, "ranged", "ranged simulator family mismatch");
assert.strictEqual(rangedSummary.player.snapshot.attackRange, 7, "ranged simulator should honor bow range");
assert.strictEqual(rangedSummary.player.snapshot.attackTickCycle, 4, "ranged simulator should honor bow cadence");
assert.strictEqual(rangedSummary.player.snapshot.attackValue, 15, "ranged simulator should include bow and arrow accuracy");
assert.strictEqual(rangedSummary.player.snapshot.maxHit, 2, "ranged simulator should include arrow strength");
assert.strictEqual(rangedSummary.player.snapshot.ammoEquipmentSlot, "ammo", "ranged simulator should model equipped ammo");
assert.strictEqual(rangedSummary.results.playerWins + rangedSummary.results.enemyWins + rangedSummary.results.draws, 200, "ranged simulator outcome count mismatch");
assert(rangedSummary.results.averagePlayerSwings > 0, "ranged simulator should count player swings");

assert.throws(
  () => runSimulation({
    enemy: "enemy_goblin_grunt",
    weapon: "normal_shortbow",
    style: "attack",
    attack: 10,
    strength: 10,
    defense: 10,
    ranged: 10,
    magic: 10,
    hitpoints: 10,
    runs: 1,
    seed: "combat-sim-ranged-missing-ammo-guard",
    maxTicks: 20
  }),
  /normal_shortbow requires --ammo for ranged simulation/,
  "ranged simulator should reject bow builds without arrows"
);

const magicSummary = runSimulation({
  enemy: "enemy_goblin_grunt",
  weapon: "plain_staff_wood",
  ammo: "ember_rune",
  style: "attack",
  attack: 10,
  strength: 10,
  defense: 10,
  ranged: 10,
  magic: 10,
  hitpoints: 10,
  runs: 200,
  seed: "combat-sim-magic-guard",
  maxTicks: 600
});

assert.strictEqual(magicSummary.simulator, "canonical_combat_build_v1", "magic simulator ID mismatch");
assert.strictEqual(magicSummary.player.weaponId, "plain_staff_wood", "magic simulator weapon mismatch");
assert.strictEqual(magicSummary.player.ammoId, "ember_rune", "magic simulator rune mismatch");
assert.strictEqual(magicSummary.player.styleId, "magic", "magic simulator style mismatch");
assert.strictEqual(magicSummary.player.styleFamily, "magic", "magic simulator family mismatch");
assert.strictEqual(magicSummary.player.snapshot.attackRange, 6, "magic simulator should honor staff range");
assert.strictEqual(magicSummary.player.snapshot.attackTickCycle, 4, "magic simulator should honor staff cadence");
assert.strictEqual(magicSummary.player.snapshot.attackValue, 13, "magic simulator should include staff and rune accuracy");
assert.strictEqual(magicSummary.player.snapshot.maxHit, 2, "magic simulator should include staff and rune strength");
assert.strictEqual(magicSummary.player.snapshot.ammoInventoryIndex, 0, "magic simulator should model rune inventory selection");
assert.strictEqual(magicSummary.results.playerWins + magicSummary.results.enemyWins + magicSummary.results.draws, 200, "magic simulator outcome count mismatch");
assert(magicSummary.results.averagePlayerSwings > 0, "magic simulator should count player swings");

assert.throws(
  () => runSimulation({
    enemy: "enemy_goblin_grunt",
    weapon: "plain_staff_wood",
    style: "attack",
    attack: 10,
    strength: 10,
    defense: 10,
    ranged: 10,
    magic: 10,
    hitpoints: 10,
    runs: 1,
    seed: "combat-sim-magic-missing-rune-guard",
    maxTicks: 20
  }),
  /plain_staff_wood requires --ammo for magic simulation/,
  "magic simulator should reject staff builds without runes"
);

console.log("Combat simulator guard passed.");
