const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "combat-enemy-occupancy-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/combat-enemy-occupancy-runtime.js");
  const combatSource = readRepoFile(root, "src/js/combat.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const occupancyIndex = manifestSource.indexOf('id: "combat-enemy-occupancy-runtime"');
  const combatIndex = manifestSource.indexOf('id: "combat"');

  assert(occupancyIndex !== -1, "legacy manifest should include combat enemy occupancy runtime");
  assert(combatIndex !== -1 && occupancyIndex < combatIndex, "legacy manifest should load occupancy runtime before combat.js");
  assert(runtimeSource.includes("window.CombatEnemyOccupancyRuntime"), "occupancy runtime should expose a window runtime");
  assert(runtimeSource.includes("function clearEnemyOccupancy(context = {})"), "occupancy runtime should own occupancy clearing");
  assert(runtimeSource.includes("function refreshEnemyOccupancy(context = {})"), "occupancy runtime should own occupancy refresh");
  assert(runtimeSource.includes("function getEnemyOccupiedBaseTileId(x, y, z = 0)"), "occupancy runtime should own base-tile lookups");

  assert(combatSource.includes("const combatEnemyOccupancyRuntime = window.CombatEnemyOccupancyRuntime || null;"), "combat.js should resolve the occupancy runtime");
  assert(combatSource.includes("function buildCombatEnemyOccupancyRuntimeContext()"), "combat.js should adapt occupancy context narrowly");
  assert(combatSource.includes("getCombatEnemyOccupancyRuntime().refreshEnemyOccupancy(buildCombatEnemyOccupancyRuntimeContext())"), "combat.js should delegate occupancy refresh");
  assert(combatSource.includes("getCombatEnemyOccupancyRuntime().clearEnemyOccupancy(buildCombatEnemyOccupancyRuntimeContext())"), "combat.js should delegate occupancy clearing");
  assert(combatSource.includes("getCombatEnemyOccupancyRuntime().getEnemyOccupiedBaseTileId(x, y, z)"), "combat.js should delegate occupied base-tile lookup");
  assert(!combatSource.includes("let combatEnemyOccupiedTiles = new Map();"), "combat.js should not own the occupied tile map");
  assert(!combatSource.includes("combatEnemyOccupiedTiles.forEach"), "combat.js should not restore occupied tiles inline");
  assert(!combatSource.includes("logicalMap[z][y][x] = TileId.SOLID_NPC;"), "combat.js should not stamp SOLID_NPC occupancy inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CombatEnemyOccupancyRuntime;
  assert(runtime, "occupancy runtime should evaluate in isolation");
  assert(typeof runtime.refreshEnemyOccupancy === "function", "runtime should expose refreshEnemyOccupancy");
  assert(typeof runtime.clearEnemyOccupancy === "function", "runtime should expose clearEnemyOccupancy");
  assert(typeof runtime.markEnemyOccupancyDirty === "function", "runtime should expose markEnemyOccupancyDirty");
  assert(typeof runtime.getEnemyOccupiedBaseTileId === "function", "runtime should expose getEnemyOccupiedBaseTileId");

  const TileId = { FLOOR: 1, WATER: 2, SOLID_NPC: 99 };
  const logicalMap = [[[TileId.FLOOR, TileId.WATER]]];
  runtime.refreshEnemyOccupancy({
    logicalMap,
    TileId,
    combatEnemyStates: [
      { x: 0, y: 0, z: 0, currentState: "idle" },
      { x: 1, y: 0, z: 0, currentState: "dead" }
    ],
    shouldEnemyOccupyTile: (enemyState) => enemyState.currentState !== "dead"
  });
  assert(logicalMap[0][0][0] === TileId.SOLID_NPC, "runtime should stamp occupied enemy tiles");
  assert(logicalMap[0][0][1] === TileId.WATER, "runtime should skip non-occupying enemies");
  assert(runtime.getEnemyOccupiedBaseTileId(0, 0, 0) === TileId.FLOOR, "runtime should remember the occupied base tile");

  runtime.markEnemyOccupancyDirty();
  runtime.refreshEnemyOccupancy({
    logicalMap,
    TileId,
    combatEnemyStates: [{ x: 1, y: 0, z: 0, currentState: "idle" }],
    shouldEnemyOccupyTile: () => true
  });
  assert(logicalMap[0][0][0] === TileId.FLOOR, "runtime should restore tiles before refreshing occupancy");
  assert(logicalMap[0][0][1] === TileId.SOLID_NPC, "runtime should restamp the latest enemy occupancy");
  assert(runtime.getEnemyOccupiedBaseTileId(1, 0, 0) === TileId.WATER, "runtime should remember the new base tile");

  runtime.clearEnemyOccupancy({ logicalMap, TileId });
  assert(logicalMap[0][0][1] === TileId.WATER, "runtime should restore occupied tiles on clear");
  assert(runtime.getEnemyOccupiedBaseTileId(1, 0, 0) === null, "runtime should clear occupied base-tile lookups");

  console.log("Combat enemy occupancy runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
