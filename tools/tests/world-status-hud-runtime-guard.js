const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createClassList() {
  const classes = new Set();
  return {
    classes,
    toggle(name, enabled) {
      if (enabled) classes.add(name);
      else classes.delete(name);
    }
  };
}

function createFakeDocument() {
  const ids = [
    "combat-level-value",
    "combat-level-formula",
    "combat-style-current",
    "combat-style-effect",
    "combat-skill-attack",
    "combat-skill-strength",
    "combat-skill-defense",
    "combat-skill-hitpoints",
    "combat-roll-attack",
    "combat-roll-defense",
    "combat-max-hit",
    "combat-style-attack",
    "combat-style-strength",
    "combat-style-defense",
    "inventory-hitpoints-text",
    "inventory-hitpoints-bar-fill",
    "stat-atk",
    "stat-def",
    "stat-str"
  ];
  const nodes = {};
  ids.forEach((id) => {
    nodes[id] = {
      id,
      innerText: "",
      style: {},
      classList: createClassList(),
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
      }
    };
  });
  return {
    nodes,
    getElementById(id) {
      return nodes[id] || null;
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "world", "status-hud-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const statusHudIndex = manifestSource.indexOf('id: "world-status-hud-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(statusHudIndex !== -1 && worldIndex !== -1 && statusHudIndex < worldIndex, "legacy manifest should load world status HUD runtime before world.js");
  assert(runtimeSource.includes("window.WorldStatusHudRuntime"), "status HUD runtime should expose a window runtime");
  assert(runtimeSource.includes("function updateCombatTab(context = {}, combatTabViewModel)"), "status HUD runtime should own combat tab painting");
  assert(runtimeSource.includes("function updateInventoryHitpointsHud(context = {})"), "status HUD runtime should own inventory hitpoints painting");
  assert(runtimeSource.includes("function updateStats(context = {})"), "status HUD runtime should own stat HUD painting");
  assert(worldSource.includes("const worldStatusHudRuntime = window.WorldStatusHudRuntime || null;"), "world.js should resolve the status HUD runtime");
  assert(worldSource.includes("worldStatusHudRuntime.updateStats(buildStatusHudRuntimeContext())"), "world.js should delegate stat HUD painting");
  assert(!worldSource.includes("function updateCombatTab(combatTabViewModel)"), "world.js should not own combat tab painting");
  assert(!worldSource.includes("function updateInventoryHitpointsHud()"), "world.js should not own inventory hitpoints painting");
  assert(!worldSource.includes("document.getElementById('stat-atk').innerText"), "world.js should not paint stat HUD values inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: runtimePath });
  const runtime = window.WorldStatusHudRuntime;
  assert(runtime, "status HUD runtime should be available after evaluation");
  assert(typeof runtime.updateStats === "function", "status HUD runtime should expose updateStats");

  const fakeDocument = createFakeDocument();
  const combatTabViewModel = {
    combatLevelText: "12",
    combatLevelFormulaText: "base 12",
    selectedStyleLabel: "Accurate",
    selectedStyleDescription: "+3 Attack",
    attackLevel: 7,
    strengthLevel: 8,
    defenseLevel: 9,
    hitpointsLevel: 10,
    combatStats: { attack: 11, defense: 12, strength: 13 },
    styleOptions: [
      { styleId: "attack", active: true },
      { styleId: "strength", active: false },
      { styleId: "defense", active: false }
    ]
  };
  const uiDomainRuntime = {
    buildCombatTabViewModel: () => combatTabViewModel,
    buildCombatStatsViewModel: () => ({ attack: 1, defense: 2, strength: 3 })
  };
  runtime.updateStats({
    document: fakeDocument,
    uiDomainRuntime,
    playerSkills: { hitpoints: { level: 10 } },
    equipment: {},
    playerState: {},
    getCurrentHitpoints: () => 6,
    getMaxHitpoints: () => 10
  });

  assert(fakeDocument.nodes["stat-atk"].innerText === 11, "status HUD should paint attack stat from combat tab view model");
  assert(fakeDocument.nodes["stat-def"].innerText === 12, "status HUD should paint defense stat from combat tab view model");
  assert(fakeDocument.nodes["stat-str"].innerText === 13, "status HUD should paint strength stat from combat tab view model");
  assert(fakeDocument.nodes["inventory-hitpoints-text"].innerText === "6 / 10", "status HUD should paint inventory hitpoints text");
  assert(fakeDocument.nodes["inventory-hitpoints-bar-fill"].style.width === "60%", "status HUD should paint inventory hitpoints fill");
  assert(fakeDocument.nodes["combat-level-value"].innerText === "12", "status HUD should paint combat level text");
  assert(fakeDocument.nodes["combat-style-current"].innerText === "Accurate", "status HUD should paint selected combat style");
  assert(fakeDocument.nodes["combat-style-attack"].attributes["aria-pressed"] === "true", "status HUD should mark active combat style");
  assert(fakeDocument.nodes["combat-style-strength"].attributes["aria-pressed"] === "false", "status HUD should mark inactive combat style");

  console.log("World status HUD runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
