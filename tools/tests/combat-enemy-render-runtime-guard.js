const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");
const { countOccurrences } = require("./source-block-utils");

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
  const runtimeSource = readRepoFile(root, "src/js/combat-enemy-render-runtime.js");
  const humanoidModelRuntimeSource = readRepoFile(root, "src/js/humanoid-model-runtime.js");
  const inputSource = readRepoFile(root, "src/js/input-render.js");
  const combatSource = readRepoFile(root, "src/js/combat.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
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
  assert(runtimeSource.includes("const COMBAT_ENEMY_VISUAL_CULL_DISTANCE = 120;"), "render runtime should cap far enemy visual rendering distance");
  assert(runtimeSource.includes("function shouldRenderEnemyVisualFrame(options = {}, enemyState, currentVisualX, currentVisualY)"), "render runtime should centralize enemy visual culling");
  assert(runtimeSource.includes("renderer.group.visible = shouldRenderVisual;"), "render runtime should hide far enemy visual groups without unmounting hitboxes");
  assert(runtimeSource.includes("if (!shouldRenderVisual) return;"), "render runtime should skip far enemy pose work after syncing hitbox state");
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
  assert(runtimeSource.includes("function createChickenLegRig(basePosition, side, materials)"), "chicken renderer should use a grouped leg rig for feet and claws");
  assert(runtimeSource.includes("function applyChickenLegPose(leg, phase, options = {})"), "chicken renderer should animate legs through a narrow helper");
  assert(runtimeSource.includes("torsoGroup.name = 'chicken-torso'"), "chicken renderer should build a grouped chunky torso");
  assert(runtimeSource.includes("headGroup.name = 'chicken-head'"), "chicken renderer should build a distinct head group");
  assert(runtimeSource.includes("const wattleLeft = new THREE.Mesh"), "chicken renderer should include red wattles");
  assert(runtimeSource.includes("const tailLeft = tailCenter.clone()"), "chicken renderer should include a three-feather tail fan");
  assert(runtimeSource.includes("const toeCenter = new THREE.Mesh"), "chicken renderer should include visible toe/claw meshes");
  assert(runtimeSource.includes("wingLeftGroup.name = 'chicken-wing-left'"), "chicken renderer should animate grouped wings");
  assert(runtimeSource.includes("const peckPulse = idlePeck * idlePeck * idlePeck"), "chicken update should include idle peck motion");
  assert(runtimeSource.includes("applyChickenLegPose(renderer.legLeft"), "chicken update should pose the grouped left leg");
  assert(runtimeSource.includes("renderer.tailGroup.rotation.set"), "chicken update should animate the tail fan group");
  assert(runtimeSource.includes("new THREE.BoxGeometry(1.35, 1.25, 1.35)"), "chicken interaction hitbox should be generous enough to click the visible model");
  assert(runtimeSource.includes("function createEnemyHitboxMaterial()"), "render runtime should centralize enemy hitbox material creation");
  assert(countOccurrences(runtimeSource, "new THREE.MeshBasicMaterial({") === 1, "enemy hitboxes should share one interaction-only material");
  assert(runtimeSource.includes("visible: false") && runtimeSource.includes("side: THREE.DoubleSide"), "enemy hitbox material should stay raycastable while skipping renderer draw calls");
  assert(!runtimeSource.includes("transparent: true") && !runtimeSource.includes("opacity: 0"), "enemy hitboxes should not render as transparent draw calls");

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
    playerState: { x: 1, y: 1, z: 0 },
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
  assert(frameRenderer.group.visible === true, "runtime should keep nearby enemy visuals visible");

  const farRenderer = {
    kind: "rat",
    group: {
      visible: true,
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
    enemyState: { runtimeId: "enemy-far", enemyId: "enemy_rat", x: 300, y: 300, z: 0, prevX: 300, prevY: 300, facingYaw: 0 },
    renderer: farRenderer,
    frameNow: 500,
    playerState: { x: 1, y: 1, z: 0 },
    getVisualHeight: () => 0,
    getEnemyDefinition: () => ({ stats: { hitpoints: 3 } }),
    getEnemyCombatLevel: () => 2,
    hasTrackedEnemyLocomotionIntent: () => false,
    isEnemyActionAnimationActive: () => false
  });
  assert(farRenderer.group.visible === false, "runtime should hide enemy visuals beyond the culling distance");
  assert(farRenderer.hitbox.userData.gridX === 300, "runtime should keep far enemy hitboxes in sync while visuals are culled");
  assert(farRenderer.group.updateMatrixWorldCalled === true, "runtime should keep far enemy matrices current for hitbox raycasts");

  console.log("Combat enemy render runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
