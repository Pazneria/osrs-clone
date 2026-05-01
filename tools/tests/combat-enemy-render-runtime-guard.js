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
  assert(runtimeSource.includes("function ensureEnemyVisualRenderLayer(options = {})"), "render runtime should own enemy visual layer creation");
  assert(runtimeSource.includes("function mountEnemyVisualRenderer(options = {})"), "render runtime should own enemy visual mounting");
  assert(runtimeSource.includes("function unmountEnemyVisualRenderer(options = {})"), "render runtime should own enemy visual unmounting");
  assert(runtimeSource.includes("function updateEnemyVisualRenderer(options = {})"), "render runtime should own enemy visual pose updates");
  assert(runtimeSource.includes("function updateEnemyVisualFrame(options = {})"), "render runtime should own enemy visual frame placement");
  assert(runtimeSource.includes("function getEnemyVisualMoveProgress(context = {}, enemyState, frameNow)"), "render runtime should own enemy visual move progress");
  assert(runtimeSource.includes("function shouldEnemyUseWalkBaseClip(context = {}, enemyState, frameNow)"), "render runtime should own enemy walk-base policy");
  assert(runtimeSource.includes("function createQuadrupedLegRig(basePosition, options)"), "render runtime should own active quadruped leg rig creation");
  assert(runtimeSource.includes("function applyQuadrupedLegPose(leg, pose)"), "render runtime should own active quadruped leg posing");
  assert(runtimeSource.includes("function createBoarRenderer(enemyState, enemyType)"), "render runtime should own boar renderer creation");
  assert(runtimeSource.includes("function updateBoarRenderer(enemyState, renderer, frameNow"), "render runtime should own boar pose updates");
  assert(runtimeSource.includes("function createWolfRenderer(enemyState, enemyType)"), "render runtime should own wolf renderer creation");
  assert(runtimeSource.includes("function updateWolfRenderer(enemyState, renderer, frameNow"), "render runtime should own wolf pose updates");
  assert(runtimeSource.includes("function createChickenRenderer(enemyState, enemyType)"), "render runtime should own chicken renderer creation");
  assert(runtimeSource.includes("function updateChickenRenderer(enemyState, renderer, frameNow"), "render runtime should own chicken pose updates");

  assert(combatSource.includes("const combatEnemyRenderRuntime = window.CombatEnemyRenderRuntime || null;"), "combat.js should resolve the enemy render runtime");
  assert(combatSource.includes("combatEnemyRenderRuntime.mountEnemyVisualRenderer({"), "combat.js should delegate enemy visual mounting");
  assert(combatSource.includes("combatEnemyRenderRuntime.unmountEnemyVisualRenderer({"), "combat.js should delegate enemy visual unmounting");
  assert(combatSource.includes("combatEnemyRenderRuntime.ensureEnemyVisualRenderLayer({"), "combat.js should delegate enemy visual layer creation");
  assert(combatSource.includes("combatEnemyRenderRuntime.updateEnemyVisualFrame(buildCombatEnemyVisualFrameContext(enemyState, renderer, frameNow));"), "combat.js should delegate enemy visual frame updates");
  assert(!combatSource.includes("combatEnemyRenderLayer = new THREE.Group();"), "combat.js should not create the enemy render layer inline");
  assert(!combatSource.includes("environmentMeshes.push(renderer.hitbox);"), "combat.js should not register enemy visual hitboxes inline");
  assert(!combatSource.includes("renderer.group.position.set(enemyState.x, 0, enemyState.y);"), "combat.js should not initialize enemy visual positions inline");
  assert(!combatSource.includes("const currentVisualX = prevX + ((enemyState.x - prevX) * moveProgress);"), "combat.js should not own enemy visual interpolation inline");
  assert(!combatSource.includes("snapCombatFacing = true;"), "combat.js should not own enemy render-facing snap policy inline");
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
  assert(typeof runtime.ensureEnemyVisualRenderLayer === "function", "runtime should expose ensureEnemyVisualRenderLayer");
  assert(typeof runtime.mountEnemyVisualRenderer === "function", "runtime should expose mountEnemyVisualRenderer");
  assert(typeof runtime.unmountEnemyVisualRenderer === "function", "runtime should expose unmountEnemyVisualRenderer");
  assert(typeof runtime.clearEnemyVisualRenderLayer === "function", "runtime should expose clearEnemyVisualRenderLayer");
  assert(typeof runtime.updateEnemyVisualRenderer === "function", "runtime should expose updateEnemyVisualRenderer");
  assert(typeof runtime.updateEnemyVisualFrame === "function", "runtime should expose updateEnemyVisualFrame");
  assert(typeof runtime.getEnemyVisualMoveProgress === "function", "runtime should expose getEnemyVisualMoveProgress");
  assert(typeof runtime.isEnemyVisuallyMoving === "function", "runtime should expose isEnemyVisuallyMoving");
  assert(typeof runtime.shouldEnemyUseWalkBaseClip === "function", "runtime should expose shouldEnemyUseWalkBaseClip");

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

  const layer = {
    added: [],
    add(group) {
      group.parent = this;
      this.added.push(group);
    }
  };
  const mountedGroup = {
    position: { value: null, set(x, y, z) { this.value = [x, y, z]; } },
    rotation: { y: 0 },
    updateMatrixWorldCalled: false,
    updateMatrixWorld() { this.updateMatrixWorldCalled = true; }
  };
  const mountedHitbox = { userData: {} };
  const mountedRenderer = runtime.mountEnemyVisualRenderer({
    enemyState: { runtimeId: "enemy-mounted", x: 4, y: 5, facingYaw: 0.75 },
    enemyType: { stats: { hitpoints: 9 } },
    layer,
    renderer: { kind: "boar", group: mountedGroup, hitbox: mountedHitbox },
    renderersById: {},
    environmentMeshes: [],
    createHitpointsBarRenderer: () => ({ el: { id: "bar" }, fill: { id: "fill" } })
  });
  assert(mountedRenderer.group.position.value[0] === 4 && mountedRenderer.group.position.value[2] === 5, "runtime should initialize mounted visual position");
  assert(mountedRenderer.group.rotation.y === 0.75, "runtime should initialize mounted visual facing");
  assert(mountedRenderer.maxHealth === 9, "runtime should initialize mounted visual health metadata");
  assert(mountedRenderer.healthBarYOffset === 0.82, "runtime should initialize mounted visual health bar offset");
  assert(mountedGroup.updateMatrixWorldCalled === true, "runtime should update mounted visual matrices");

  const environmentMeshes = [mountedHitbox, { id: "other" }];
  const renderersById = { "enemy-mounted": mountedRenderer };
  const removed = [];
  const unmountResult = runtime.unmountEnemyVisualRenderer({
    enemyId: "enemy-mounted",
    renderersById,
    environmentMeshes,
    removeHitpointsBarRenderer: (removedRenderer) => removed.push(removedRenderer)
  });
  assert(renderersById["enemy-mounted"] === undefined, "runtime should unregister unmounted renderers");
  assert(unmountResult.environmentMeshes.length === 1 && unmountResult.environmentMeshes[0].id === "other", "runtime should unregister unmounted hitboxes");
  assert(removed[0] === mountedRenderer, "runtime should delegate overlay removal during unmount");

  const frameRenderer = {
    kind: "rat",
    group: {
      position: { value: null, set(x, y, z) { this.value = [x, y, z]; } },
      rotation: { y: 0 },
      updateMatrixWorldCalled: false,
      updateMatrixWorld() { this.updateMatrixWorldCalled = true; }
    },
    hitbox: { userData: {} },
    body: { scale: { set(x, y, z) { this.value = [x, y, z]; } } },
    head: { position: { z: 0 } },
    tail: { rotation: makeRotationTarget() }
  };
  runtime.updateEnemyVisualFrame({
    enemyState: { runtimeId: "enemy-a", enemyId: "enemy_rat", x: 2, y: 1, z: 0, prevX: 1, prevY: 1, moveTriggerAt: 100, facingYaw: 0 },
    renderer: frameRenderer,
    frameNow: 350,
    enemyMoveLerpDurationMs: 500,
    getVisualHeight: () => 0,
    getEnemyDefinition: () => ({ stats: { hitpoints: 3 } }),
    getEnemyCombatLevel: () => 2,
    hasTrackedEnemyLocomotionIntent: () => false,
    isEnemyActionAnimationActive: () => false
  });
  assert(frameRenderer.group.position.value[0] > 1 && frameRenderer.group.position.value[0] < 2, "runtime should interpolate enemy visual X inside the frame update");
  assert(frameRenderer.hitbox.userData.gridX === 2, "runtime should sync hitbox grid X during frame update");
  assert(frameRenderer.hitbox.userData.combatLevel === 2, "runtime should populate hitbox combat level during frame update");
  assert(frameRenderer.group.updateMatrixWorldCalled === true, "runtime should update renderer matrices during frame update");

  console.log("Combat enemy render runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
