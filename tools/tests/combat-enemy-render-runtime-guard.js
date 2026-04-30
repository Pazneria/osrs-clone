const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function countOccurrences(source, pattern) {
  return source.split(pattern).length - 1;
}

function makeRotationTarget() {
  return {
    value: null,
    set(x, y, z) {
      this.value = [x, y, z];
    },
    x: 0,
    y: 0,
    z: 0
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "combat-enemy-render-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const humanoidModelRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "humanoid-model-runtime.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const combatSource = fs.readFileSync(path.join(root, "src", "js", "combat.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const humanoidModelRuntimeIndex = manifestSource.indexOf('id: "humanoid-model-runtime"');
  const renderIndex = manifestSource.indexOf('id: "combat-enemy-render-runtime"');
  const overlayIndex = manifestSource.indexOf('id: "combat-enemy-overlay-runtime"');
  const combatIndex = manifestSource.indexOf('id: "combat"');

  assert(renderIndex !== -1, "legacy manifest should include combat enemy render runtime");
  assert(humanoidModelRuntimeIndex !== -1 && humanoidModelRuntimeIndex < combatIndex, "legacy manifest should load humanoid model runtime before combat.js");
  assert(humanoidModelRuntimeSource.includes("window.createHumanoidModel = createHumanoidModel;"), "humanoid model runtime should publish the legacy humanoid model builder");
  assert(!inputSource.includes("function createHumanoidModel("), "input-render.js should not own humanoid model construction");
  assert(combatIndex !== -1 && renderIndex < combatIndex, "legacy manifest should load combat enemy render runtime before combat.js");
  assert(overlayIndex !== -1 && renderIndex < overlayIndex, "combat enemy render runtime should load before overlay/runtime combat consumers");
  assert(runtimeSource.includes("window.CombatEnemyRenderRuntime"), "combat enemy render runtime should expose a window runtime");
  assert(runtimeSource.includes("function createEnemyVisualRenderer(options = {})"), "render runtime should own enemy visual creation");
  assert(runtimeSource.includes("function updateEnemyVisualRenderer(options = {})"), "render runtime should own enemy visual pose updates");
  assert(runtimeSource.includes("function createQuadrupedLegRig(basePosition, options)"), "render runtime should own active quadruped leg rig creation");
  assert(runtimeSource.includes("function applyQuadrupedLegPose(leg, pose)"), "render runtime should own active quadruped leg posing");
  assert(runtimeSource.includes("function createBoarRenderer(enemyState, enemyType)"), "render runtime should own boar renderer creation");
  assert(runtimeSource.includes("function updateBoarRenderer(enemyState, renderer, frameNow"), "render runtime should own boar pose updates");
  assert(runtimeSource.includes("function createWolfRenderer(enemyState, enemyType)"), "render runtime should own wolf renderer creation");
  assert(runtimeSource.includes("function updateWolfRenderer(enemyState, renderer, frameNow"), "render runtime should own wolf pose updates");
  assert(runtimeSource.includes("function createChickenRenderer(enemyState, enemyType)"), "render runtime should own chicken renderer creation");
  assert(runtimeSource.includes("function updateChickenRenderer(enemyState, renderer, frameNow"), "render runtime should own chicken pose updates");

  assert(combatSource.includes("const combatEnemyRenderRuntime = window.CombatEnemyRenderRuntime || null;"), "combat.js should resolve the enemy render runtime");
  assert(combatSource.includes("combatEnemyRenderRuntime.createEnemyVisualRenderer({"), "combat.js should delegate enemy visual creation");
  assert(combatSource.includes("combatEnemyRenderRuntime.updateEnemyVisualRenderer({"), "combat.js should delegate enemy visual pose updates");
  assert(countOccurrences(combatSource, "function createBoarRenderer(") === 0, "combat.js should not define boar renderer creation inline");
  assert(countOccurrences(combatSource, "function createWolfRenderer(") === 0, "combat.js should not define wolf renderer creation inline");
  assert(countOccurrences(combatSource, "function updateBoarRenderer(") === 0, "combat.js should not define boar pose updates inline");
  assert(countOccurrences(combatSource, "function updateWolfRenderer(") === 0, "combat.js should not define wolf pose updates inline");
  assert(countOccurrences(runtimeSource, "function createBoarRenderer(") === 1, "render runtime should have one boar renderer declaration");
  assert(countOccurrences(runtimeSource, "function createWolfRenderer(") === 1, "render runtime should have one wolf renderer declaration");
  assert(countOccurrences(runtimeSource, "function updateBoarRenderer(") === 1, "render runtime should have one boar update declaration");
  assert(countOccurrences(runtimeSource, "function updateWolfRenderer(") === 1, "render runtime should have one wolf update declaration");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CombatEnemyRenderRuntime;
  assert(runtime, "combat enemy render runtime should evaluate in isolation");
  assert(typeof runtime.createEnemyVisualRenderer === "function", "runtime should expose createEnemyVisualRenderer");
  assert(typeof runtime.updateEnemyVisualRenderer === "function", "runtime should expose updateEnemyVisualRenderer");

  const renderer = {
    kind: "rat",
    body: { scale: { set(x, y, z) { this.value = [x, y, z]; } } },
    head: { position: { z: 0 } },
    tail: { rotation: makeRotationTarget() }
  };
  runtime.updateEnemyVisualRenderer({
    enemyState: { attackTriggerAt: 100 },
    renderer,
    frameNow: 210,
    idlePhase: 0.5
  });
  assert(Array.isArray(renderer.body.scale.value), "runtime should update rat body scale during visual pose updates");
  assert(Number.isFinite(renderer.head.position.z), "runtime should update rat head position during visual pose updates");

  console.log("Combat enemy render runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
