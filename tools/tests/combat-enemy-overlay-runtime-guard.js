const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeElement(tagName) {
  return {
    tagName,
    children: [],
    parentNode: null,
    style: {},
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
    },
    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      child.parentNode = null;
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "combat-enemy-overlay-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const combatSource = fs.readFileSync(path.join(root, "src", "js", "combat.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const runtimeIndex = manifestSource.indexOf('id: "combat-enemy-overlay-runtime"');
  const combatIndex = manifestSource.indexOf('id: "combat"');

  assert(runtimeIndex !== -1, "legacy manifest should include combat enemy overlay runtime");
  assert(combatIndex !== -1 && runtimeIndex < combatIndex, "legacy manifest should load combat enemy overlay runtime before combat.js");
  assert(runtimeSource.includes("window.CombatEnemyOverlayRuntime"), "combat enemy overlay runtime should expose a window runtime");
  assert(runtimeSource.includes("function createEnemyHitpointsBarRenderer(options = {})"), "overlay runtime should own hitpoint bar creation");
  assert(runtimeSource.includes("function updateEnemyHitpointsBar(options = {})"), "overlay runtime should own hitpoint bar projection");
  assert(runtimeSource.includes("function updateCombatEnemyOverlays(options = {})"), "overlay runtime should own overlay update loops");
  assert(combatSource.includes("const combatEnemyOverlayRuntime = window.CombatEnemyOverlayRuntime || null;"), "combat.js should resolve the overlay runtime");
  assert(combatSource.includes("combatEnemyOverlayRuntime.createEnemyHitpointsBarRenderer({ documentRef: document })"), "combat.js should delegate hitpoint bar creation");
  assert(combatSource.includes("combatEnemyOverlayRuntime.updateCombatEnemyOverlays({"), "combat.js should delegate overlay updates");
  assert(!combatSource.includes("function createEnemyHitpointsBarRenderer()"), "combat.js should not create hitpoint bars inline");
  assert(!combatSource.includes("function updateEnemyHitpointsBar(enemyState, renderer)"), "combat.js should not project hitpoint bars inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CombatEnemyOverlayRuntime;
  assert(runtime, "combat enemy overlay runtime should be available after evaluation");

  const body = makeElement("body");
  const documentRef = {
    body,
    createElement: makeElement
  };
  const bar = runtime.createEnemyHitpointsBarRenderer({ documentRef });
  assert(bar.el && bar.fill, "hitpoint bar renderer should return element and fill handles");
  assert(body.children.length === 1, "hitpoint bar should be appended to the document body");
  assert(bar.el.style.position === "absolute", "hitpoint bar should be absolutely positioned");
  runtime.removeEnemyHitpointsBarRenderer({ healthBarEl: bar.el });
  assert(body.children.length === 0 && !bar.el.parentNode, "hitpoint bar removal should detach the element");

  const enemyState = {
    runtimeId: "enemy-1",
    currentHealth: 4,
    z: 0,
    lockedTargetId: "player"
  };
  const playerState = {
    inCombat: true,
    z: 0,
    lockedTargetId: "enemy-1",
    lastDamagerEnemyId: null
  };
  assert(runtime.shouldShowEnemyHitpointsBar({
    enemyState,
    playerState,
    isEnemyAlive: () => true,
    isEnemyPendingDefeat: () => false
  }) === true, "overlay runtime should show bars for visible combat enemies");

  const projected = {
    x: 0,
    y: 0,
    z: 0,
    project() {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
  };
  const renderer = {
    maxHealth: 10,
    healthBarEl: makeElement("div"),
    healthBarFillEl: makeElement("div"),
    group: {
      position: {
        clone: () => Object.assign({}, projected)
      }
    },
    healthBarYOffset: 1
  };
  runtime.updateEnemyHitpointsBar({
    camera: {},
    enemyState,
    isEnemyAlive: () => true,
    isEnemyPendingDefeat: () => false,
    playerState,
    renderer,
    windowRef: { innerWidth: 800, innerHeight: 600 }
  });
  assert(renderer.healthBarFillEl.style.width === "40%", "hitpoint bar fill should reflect current health ratio");
  assert(renderer.healthBarFillEl.style.background === "#f1c453", "mid-health hitpoint bar should use warning color");
  assert(renderer.healthBarEl.style.left === "400px" && renderer.healthBarEl.style.top === "300px", "hitpoint bar should be projected to screen center");
  assert(renderer.healthBarEl.style.display === "block", "visible hitpoint bar should be shown");

  let matrixUpdated = false;
  let updateCount = 0;
  runtime.updateCombatEnemyOverlays({
    camera: { updateMatrixWorld: () => { matrixUpdated = true; } },
    combatEnemyRenderersById: { "enemy-1": renderer },
    combatEnemyStateById: { "enemy-1": enemyState },
    isEnemyAlive: () => {
      updateCount += 1;
      return true;
    },
    isEnemyPendingDefeat: () => false,
    playerState,
    windowRef: { innerWidth: 800, innerHeight: 600 }
  });
  assert(matrixUpdated, "overlay update should refresh camera matrices when available");
  assert(updateCount === 1, "overlay update should visit renderer-backed enemies");

  console.log("Combat enemy overlay runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
