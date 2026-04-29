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
  simulatorSource.includes("computePlayerMeleeCombatSnapshot") &&
    simulatorSource.includes("computeEnemyMeleeCombatSnapshot") &&
    simulatorSource.includes("rollOpposedHitCheck") &&
    simulatorSource.includes("rollDamage"),
  "melee simulator should use canonical combat formula helpers"
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
    /- \[x\] COMBAT-014: Combat progression bands/.test(combatStatusSource) &&
    /- \[x\] COMBAT-015:/.test(combatStatusSource) &&
    /## Now\s*- \[ \] COMBAT-016:/.test(combatStatusSource),
  "combat status should keep COMBAT-013 complete and advance beyond COMBAT-015"
);
assert(
  skillsIndexSource.includes("| Combat | In Progress | First-pass encounter coverage now includes a guarded outpost and optional southeast camp-threat pocket with bear/brute/striker spawns | Advanced roaming, patrols, ally-assist/group-aggro behavior, and richer encounter-state logic | None |"),
  "skills index should reflect the completed first-pass encounter coverage"
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

assert.strictEqual(summary.simulator, "canonical_melee_v1", "simulator ID mismatch");
assert(/^2026\.03\.c/.test(summary.combatSpecVersion), "combat spec version mismatch");
assert.strictEqual(summary.runs, 200, "simulator run count mismatch");
assert.strictEqual(summary.player.weaponId, "bronze_sword", "simulator weapon mismatch");
assert.strictEqual(summary.player.styleId, "attack", "simulator style mismatch");
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

console.log("Combat simulator guard passed.");
