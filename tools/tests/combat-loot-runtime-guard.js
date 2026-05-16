const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "combat-loot-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/combat-loot-runtime.js");
  const combatSource = readRepoFile(root, "src/js/combat.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const lootIndex = manifestSource.indexOf('id: "combat-loot-runtime"');
  const combatIndex = manifestSource.indexOf('id: "combat"');

  assert(lootIndex !== -1, "legacy manifest should include combat loot runtime");
  assert(combatIndex !== -1 && lootIndex < combatIndex, "legacy manifest should load loot runtime before combat.js");
  assert(runtimeSource.includes("window.CombatLootRuntime"), "loot runtime should expose a window runtime");
  assert(runtimeSource.includes("function spawnEnemyDrop(context = {}, enemyState)"), "loot runtime should own enemy drop spawning");
  assert(runtimeSource.includes("function resolveLootItem(context = {}, dropEntry)"), "loot runtime should own loot item lookup");
  assert(runtimeSource.includes("function resolveLootAmount(context = {}, dropEntry)"), "loot runtime should own loot amount resolution");

  assert(combatSource.includes("const combatLootRuntime = window.CombatLootRuntime || null;"), "combat.js should resolve the loot runtime");
  assert(combatSource.includes("function buildCombatLootRuntimeContext()"), "combat.js should adapt loot context narrowly");
  assert(combatSource.includes("getCombatLootRuntime().spawnEnemyDrop(buildCombatLootRuntimeContext(), enemyState);"), "combat.js should delegate enemy drop spawning");
  assert(!combatSource.includes("const dropEntry = combatRuntime.pickDropEntry(enemyType.dropTable || []);"), "combat.js should not pick drop entries inline");
  assert(!combatSource.includes("spawnGroundItem(ITEM_DB.coins"), "combat.js should not spawn coin drops inline");
  assert(!combatSource.includes("spawnGroundItem(ITEM_DB[dropEntry.itemId]"), "combat.js should not spawn item drops inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CombatLootRuntime;
  assert(runtime, "combat loot runtime should evaluate in isolation");
  assert(typeof runtime.spawnEnemyDrop === "function", "runtime should expose spawnEnemyDrop");
  assert(typeof runtime.resolveLootItem === "function", "runtime should expose resolveLootItem");
  assert(typeof runtime.resolveLootAmount === "function", "runtime should expose resolveLootAmount");

  const spawned = [];
  const enemyState = { enemyId: "enemy_rat", x: 2, y: 3, z: 0 };
  const result = runtime.spawnEnemyDrop({
    combatRuntime: {
      pickDropEntry: () => ({ kind: "coins", minAmount: 3, maxAmount: 3 })
    },
    getEnemyDefinition: () => ({ dropTable: [{ kind: "coins" }] }),
    ITEM_DB: { coins: { itemId: "coins", name: "Coins" } },
    rollInclusive: () => 3,
    spawnGroundItem: (...args) => spawned.push(args)
  }, enemyState);
  assert(result && result.amount === 3, "runtime should return spawned loot metadata");
  assert(spawned.length === 1, "runtime should spawn a resolved coin drop");
  assert(spawned[0][0].itemId === "coins", "runtime should resolve coin item data from ITEM_DB");
  assert(spawned[0][1] === 2 && spawned[0][2] === 3 && spawned[0][3] === 0 && spawned[0][4] === 3, "runtime should spawn loot at enemy tile");

  spawned.length = 0;
  const itemResult = runtime.spawnEnemyDrop({
    combatRuntime: {
      pickDropEntry: () => ({ kind: "item", itemId: "bones", minAmount: 1, maxAmount: 2 })
    },
    getEnemyDefinition: () => ({ dropTable: [{ kind: "item", itemId: "bones" }] }),
    ITEM_DB: { bones: { itemId: "bones", name: "Bones" } },
    rollInclusive: () => 2,
    spawnGroundItem: (...args) => spawned.push(args)
  }, enemyState);
  assert(itemResult && itemResult.amount === 2, "runtime should resolve rolled item stack amounts");
  assert(spawned[0][0].itemId === "bones", "runtime should resolve item drops from ITEM_DB");

  spawned.length = 0;
  const missingResult = runtime.spawnEnemyDrop({
    combatRuntime: {
      pickDropEntry: () => ({ kind: "item", itemId: "missing", minAmount: 1, maxAmount: 1 })
    },
    getEnemyDefinition: () => ({ dropTable: [{ kind: "item", itemId: "missing" }] }),
    ITEM_DB: {},
    spawnGroundItem: (...args) => spawned.push(args)
  }, enemyState);
  assert(missingResult === null, "runtime should skip missing item definitions");
  assert(spawned.length === 0, "runtime should not spawn unresolved loot");

  console.log("Combat loot runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
