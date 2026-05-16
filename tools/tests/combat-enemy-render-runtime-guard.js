const assert = require("assert");
const path = require("path");
const vm = require("vm");
const THREE = require("three");
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
  assert(runtimeSource.includes("function createQuadrupedPawMesh(pawSize, pawMaterial, options = {})"), "render runtime should centralize quadruped paw mesh creation");
  assert(runtimeSource.includes("function createQuadrupedLegRig(basePosition, options)"), "render runtime should own active quadruped leg rig creation");
  assert(runtimeSource.includes("function applyQuadrupedLegPose(leg, pose)"), "render runtime should own active quadruped leg posing");
  assert(runtimeSource.includes("function createBoarRenderer(enemyState, enemyType)"), "render runtime should own boar renderer creation");
  assert(runtimeSource.includes("function updateBoarRenderer(enemyState, renderer, frameNow"), "render runtime should own boar pose updates");
  assert(runtimeSource.includes("function createWolfRenderer(enemyState, enemyType)"), "render runtime should own wolf renderer creation");
  assert(runtimeSource.includes("function updateWolfRenderer(enemyState, renderer, frameNow"), "render runtime should own wolf pose updates");
  assert(runtimeSource.includes("function createBearRenderer(enemyState, enemyType)"), "render runtime should own bear renderer creation");
  assert(runtimeSource.includes("function updateBearRenderer(enemyState, renderer, frameNow"), "render runtime should own bear pose updates");
  assert(runtimeSource.includes("const appearanceKind = enemyType.appearance && enemyType.appearance.kind;"), "render runtime should route creature renderers through appearance kind");
  assert(runtimeSource.includes("if (appearanceKind === 'boar') return createBoarRenderer(enemyState, enemyType);"), "boar renderer should be selected by appearance kind");
  assert(runtimeSource.includes("if (appearanceKind === 'wolf') return createWolfRenderer(enemyState, enemyType);"), "wolf renderer should be selected by appearance kind");
  assert(runtimeSource.includes("if (appearanceKind === 'bear') return createBearRenderer(enemyState, enemyType);"), "bear renderer should be selected by appearance kind");
  assert(runtimeSource.includes("torsoGroup.name = 'bear-torso'"), "bear renderer should build a named torso group");
  assert(runtimeSource.includes("headGroup.name = 'bear-head'"), "bear renderer should build a distinct head group");
  assert(runtimeSource.includes("tailGroup.name = 'bear-tail'"), "bear renderer should build a visible tail group");
  assert(runtimeSource.includes("const frontLeftClaws = addPawClaws"), "bear renderer should include visible paw claws");
  assert(runtimeSource.includes("torsoGroup.name = 'rat-torso'"), "rat renderer should build a named torso group instead of a loose sphere stack");
  assert(runtimeSource.includes("headGroup.name = 'rat-head'"), "rat renderer should build a distinct animated head group");
  assert(runtimeSource.includes("tailGroup.name = 'rat-tail'"), "rat renderer should build a segmented tail group");
  assert(runtimeSource.includes("const whiskerLeftUpper = new THREE.Mesh"), "rat renderer should include visible whisker geometry");
  assert(runtimeSource.includes("const tailMiddle = new THREE.Mesh"), "rat renderer should include more than one tail segment");
  assert(runtimeSource.includes("const toothLeft = new THREE.Mesh"), "rat renderer should include tiny front teeth for close-read identity");
  assert(runtimeSource.includes("createQuadrupedLegRig(new THREE.Vector3(0.15"), "rat renderer should use the shared quadruped leg rig for front paws");
  assert(runtimeSource.includes("new THREE.BoxGeometry(0.86, 0.58, 1.08)"), "rat interaction hitbox should continue to cover the rebuilt low rat model");
  assert(runtimeSource.includes("function updateRatRenderer(enemyState, renderer, frameNow, idlePhase, visuallyMoving, useWalkBaseClip, currentVisualX, currentVisualY)"), "rat pose updates should receive the same locomotion context as larger quadrupeds");
  assert(runtimeSource.includes("const gaitPhase = (frameNow / 280)"), "rat gait should stay slower than the first-pass frantic paw cycle");
  assert(runtimeSource.includes("const leadPhase = walkActive ? gaitAngle : idlePhase * 0.35;"), "rat idle leg phase should be slow and decoupled from walk gait");
  assert(runtimeSource.includes("travel: walkActive ? 0.036 : 0.001"), "rat front paws should use restrained travel, especially while idle");
  assert(runtimeSource.includes("upperSwing: walkActive ? 0.3 : 0.018"), "rat rear paws should keep a small idle swing instead of sprinting in place");
  assert(runtimeSource.includes("function createChickenRenderer(enemyState, enemyType)"), "render runtime should own chicken renderer creation");
  assert(runtimeSource.includes("function updateChickenRenderer(enemyState, renderer, frameNow"), "render runtime should own chicken pose updates");
  assert(runtimeSource.includes("function createChickenLegRig(basePosition, side, materials)"), "chicken renderer should use a grouped leg rig for feet and claws");
  assert(runtimeSource.includes("function applyChickenLegPose(leg, phase, options = {})"), "chicken renderer should animate legs through a narrow helper");
  assert(runtimeSource.includes("torsoGroup.name = 'chicken-torso'"), "chicken renderer should build a grouped chunky torso");
  assert(runtimeSource.includes("headGroup.name = 'chicken-head'"), "chicken renderer should build a distinct head group");
  assert(runtimeSource.includes("const beakTip = new THREE.Mesh"), "chicken renderer should include a projected beak tip for thumbnail readability");
  assert(runtimeSource.includes("bodyTopPlane"), "chicken renderer should include a simple top plane to keep the pale body faceted");
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
  assert(countOccurrences(combatSource, "function createBearRenderer(") === 0, "combat.js should not define bear renderer creation inline");
  assert(countOccurrences(combatSource, "function updateBoarRenderer(") === 0, "combat.js should not define boar pose updates inline");
  assert(countOccurrences(combatSource, "function updateWolfRenderer(") === 0, "combat.js should not define wolf pose updates inline");
  assert(countOccurrences(combatSource, "function updateBearRenderer(") === 0, "combat.js should not define bear pose updates inline");
  assert(countOccurrences(runtimeSource, "function createBoarRenderer(") === 1, "render runtime should have one boar renderer declaration");
  assert(countOccurrences(runtimeSource, "function createWolfRenderer(") === 1, "render runtime should have one wolf renderer declaration");
  assert(countOccurrences(runtimeSource, "function createBearRenderer(") === 1, "render runtime should have one bear renderer declaration");
  assert(countOccurrences(runtimeSource, "function updateBoarRenderer(") === 1, "render runtime should have one boar update declaration");
  assert(countOccurrences(runtimeSource, "function updateWolfRenderer(") === 1, "render runtime should have one wolf update declaration");
  assert(countOccurrences(runtimeSource, "function updateBearRenderer(") === 1, "render runtime should have one bear update declaration");

  const sandbox = { window: {}, THREE };
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

  const ratVisual = runtime.createEnemyVisualRenderer({
    enemyState: { runtimeId: "rat-visual", enemyId: "enemy_rat", x: 7, y: 8, z: 0, facingYaw: 0 },
    enemyType: { displayName: "Rat", appearance: { kind: "rat" }, stats: { hitpoints: 3 } },
    getEnemyCombatLevel: () => 2
  });
  assert(ratVisual && ratVisual.kind === "rat", "runtime should create the dedicated rat renderer");
  assert(ratVisual.torsoGroup && ratVisual.torsoGroup.name === "rat-torso", "rat renderer should expose its torso group");
  assert(ratVisual.headGroup && ratVisual.headGroup.name === "rat-head", "rat renderer should expose its head group");
  assert(ratVisual.tailGroup && ratVisual.tailGroup.name === "rat-tail", "rat renderer should expose its tail group");
  assert(ratVisual.frontLeftLeg && ratVisual.frontRightLeg && ratVisual.backLeftLeg && ratVisual.backRightLeg, "rat renderer should expose four small leg rigs");
  assert(ratVisual.whiskerLeftUpper && ratVisual.whiskerRightLower, "rat renderer should expose whisker meshes");
  assert(ratVisual.tail && ratVisual.tailMiddle && ratVisual.tailTip, "rat renderer should expose a segmented tail");
  assert(ratVisual.hitbox.geometry.parameters.width === 0.86, "rebuilt rat should keep a stable interaction hitbox width");
  runtime.updateEnemyVisualRenderer({
    enemyState: { runtimeId: "rat-visual", enemyId: "enemy_rat", attackTriggerAt: 100, hitReactionTriggerAt: 0 },
    renderer: ratVisual,
    frameNow: 235,
    idlePhase: 0.6,
    visuallyMoving: true,
    currentVisualX: 7.25,
    currentVisualY: 8.5
  });
  assert(Number.isFinite(ratVisual.torsoGroup.position.y), "rat pose update should move the torso group");
  assert(Number.isFinite(ratVisual.headGroup.position.z), "rat pose update should move the head group");
  assert(Number.isFinite(ratVisual.tailGroup.rotation.z), "rat pose update should animate the tail group");
  assert(Number.isFinite(ratVisual.frontLeftLeg.root.position.y), "rat pose update should animate leg rig roots");
  runtime.updateEnemyVisualRenderer({
    enemyState: { runtimeId: "rat-visual", enemyId: "enemy_rat", attackTriggerAt: 0, hitReactionTriggerAt: 0 },
    renderer: ratVisual,
    frameNow: 1000,
    idlePhase: 0,
    visuallyMoving: false,
    useWalkBaseClip: false,
    currentVisualX: 7,
    currentVisualY: 8
  });
  const idlePawY = ratVisual.frontLeftLeg.root.position.y;
  const idlePawZ = ratVisual.frontLeftLeg.root.position.z;
  runtime.updateEnemyVisualRenderer({
    enemyState: { runtimeId: "rat-visual", enemyId: "enemy_rat", attackTriggerAt: 0, hitReactionTriggerAt: 0 },
    renderer: ratVisual,
    frameNow: 1300,
    idlePhase: 1,
    visuallyMoving: false,
    useWalkBaseClip: false,
    currentVisualX: 7,
    currentVisualY: 8
  });
  assert(Math.abs(ratVisual.frontLeftLeg.root.position.y - idlePawY) < 0.004, "idle rat paws should stay nearly planted vertically");
  assert(Math.abs(ratVisual.frontLeftLeg.root.position.z - idlePawZ) < 0.004, "idle rat paws should stay nearly planted front-to-back");

  const boarVisual = runtime.createEnemyVisualRenderer({
    enemyState: { runtimeId: "boar-visual", enemyId: "enemy_boar", x: 1, y: 2, z: 0, facingYaw: 0 },
    enemyType: { displayName: "Boar", appearance: { kind: "boar" }, stats: { hitpoints: 7 } },
    getEnemyCombatLevel: () => 6
  });
  assert(boarVisual && boarVisual.kind === "boar", "runtime should create the dedicated boar renderer from appearance kind");
  assert(Array.isArray(boarVisual.bristles) && boarVisual.bristles.length >= 7, "boar renderer should expose a chunky dorsal bristle ridge");
  assert(boarVisual.noseCap, "boar renderer should expose a dark nose cap on the snout");
  assert(boarVisual.body.geometry.type === "DodecahedronGeometry", "boar body should use a faceted organic mesh instead of a cube");
  assert(boarVisual.shoulderHump.geometry.type === "DodecahedronGeometry", "boar shoulder hump should use a faceted organic mesh instead of a cube");
  assert(boarVisual.rump.geometry.type === "DodecahedronGeometry", "boar rump should use a faceted organic mesh instead of a cube");
  assert(boarVisual.body.userData.boarShape === "faceted-ellipsoid", "boar body should stay rounded and faceted");
  assert(boarVisual.body.userData.boarSize.width >= 0.85 && boarVisual.body.userData.boarSize.height >= 0.49, "boar body should stay compact and heavy");
  assert(boarVisual.shoulderHump.userData.boarSize.height >= 0.37, "boar shoulder hump should keep a heavy front silhouette");
  assert(boarVisual.head.geometry.type === "DodecahedronGeometry", "boar head should use a faceted organic mesh instead of a cube");
  assert(boarVisual.snout.geometry.type === "DodecahedronGeometry", "boar snout should use a faceted organic mesh instead of a cube");
  assert(boarVisual.noseCap.geometry.type === "DodecahedronGeometry", "boar nose cap should use a faceted organic mesh instead of a cube");
  assert(boarVisual.head.userData.boarSize.width >= 0.39 && boarVisual.snout.userData.boarSize.width >= 0.33, "boar head and snout should stay broad and blunt");
  assert(boarVisual.cheekLeft && boarVisual.cheekRight, "boar renderer should expose rounded cheek/jowl masses");
  assert(boarVisual.cheekLeft.geometry.type === "DodecahedronGeometry", "boar cheek/jowl masses should be rounded low-poly meshes");
  assert(boarVisual.nostrilLeft && boarVisual.nostrilRight, "boar renderer should expose nostril dots on the snout");
  assert(boarVisual.nostrilLeft.position.z > boarVisual.noseCap.position.z, "boar nostrils should sit on the front of the nose cap");
  assert(boarVisual.frontLeftLeg.upper.geometry.parameters.radiusTop >= 0.065, "boar front upper legs should stay thick");
  assert(boarVisual.frontLeftLeg.lower.geometry.parameters.radiusBottom >= 0.05, "boar front lower legs should stay stout");
  assert(boarVisual.backLeftLeg.upper.geometry.parameters.radiusBottom >= 0.08, "boar rear upper legs should stay thick");
  assert(boarVisual.frontLeftLeg.paw.userData.pawSize.width >= 0.15 && boarVisual.frontLeftLeg.paw.userData.pawSize.depth >= 0.17, "boar front hooves should stay broad");
  assert(boarVisual.backLeftLeg.paw.userData.pawSize.width >= 0.16 && boarVisual.backLeftLeg.paw.userData.pawSize.depth >= 0.18, "boar rear hooves should stay broad");
  assert(Array.isArray(boarVisual.hoofToePairs) && boarVisual.hoofToePairs.length === 4, "boar renderer should expose cloven toe blocks for each hoof");
  assert(boarVisual.hoofToePairs[0].length === 3 && boarVisual.hoofToePairs[0][0].position.z >= 0.08, "boar hoof toe blocks should sit at the front of the hoof");

  const wolfVisual = runtime.createEnemyVisualRenderer({
    enemyState: { runtimeId: "wolf-visual", enemyId: "enemy_wolf", x: 1, y: 2, z: 0, facingYaw: 0 },
    enemyType: { displayName: "Wolf", appearance: { kind: "wolf" }, stats: { hitpoints: 10 } },
    getEnemyCombatLevel: () => 9
  });
  assert(wolfVisual && wolfVisual.kind === "wolf", "runtime should create the dedicated wolf renderer from appearance kind");
  assert(wolfVisual.neckRuff, "wolf renderer should expose a dark neck ruff to separate it from boar/bear silhouettes");
  assert(wolfVisual.fangLeft && wolfVisual.fangRight, "wolf renderer should expose small fang markers");

  const bearVisual = runtime.createEnemyVisualRenderer({
    enemyState: { runtimeId: "bear-visual", enemyId: "enemy_bear", x: 1, y: 2, z: 0, facingYaw: 0 },
    enemyType: { displayName: "Bear", appearance: { kind: "bear" }, stats: { hitpoints: 20 } },
    getEnemyCombatLevel: () => 14
  });
  assert(bearVisual && bearVisual.kind === "bear", "runtime should create the dedicated bear renderer");
  assert(bearVisual.torsoGroup && bearVisual.torsoGroup.name === "bear-torso", "bear renderer should expose its torso group");
  assert(bearVisual.headGroup && bearVisual.headGroup.name === "bear-head", "bear renderer should expose its head group");
  assert(bearVisual.cheekLeft && bearVisual.cheekRight, "bear renderer should expose broader muzzle cheek blocks");
  assert(bearVisual.headGroup.position.z <= 0.66, "bear head should sit close to the shoulders instead of stretching the snout silhouette");
  assert(bearVisual.muzzle.geometry.parameters.depth <= 0.23, "bear muzzle should stay compact and blunt");
  assert(bearVisual.nose.position.z <= 0.37, "bear nose should stay pulled back after shortening the snout");
  assert(bearVisual.shoulderHump.scale.y >= 0.9 && bearVisual.shoulderHump.scale.x >= 1.55, "bear should keep a heavy shoulder/forequarter silhouette");
  assert(bearVisual.frontLeftLeg.upper.geometry.parameters.radiusTop >= 0.08, "bear front upper legs should stay thick");
  assert(bearVisual.frontLeftLeg.lower.geometry.parameters.radiusBottom >= 0.06, "bear front lower legs should stay planted and sturdy");
  assert(bearVisual.frontLeftLeg.paw.userData.pawShape === "rounded", "bear front paws should use rounded paw meshes");
  assert(bearVisual.backLeftLeg.paw.userData.pawShape === "rounded", "bear rear paws should use rounded paw meshes");
  assert(bearVisual.frontLeftLeg.paw.geometry.type === "SphereGeometry", "bear rounded paws should be ellipsoid meshes instead of box blocks");
  assert(bearVisual.frontLeftLeg.paw.userData.pawSize.width >= 0.23 && bearVisual.frontLeftLeg.paw.userData.pawSize.depth >= 0.26, "bear front paws should stay broad");
  assert(bearVisual.backLeftLeg.paw.userData.pawSize.width >= 0.21 && bearVisual.backLeftLeg.paw.userData.pawSize.depth >= 0.24, "bear rear paws should stay broad");
  assert(bearVisual.frontLeftClaws.length === 3 && bearVisual.backRightClaws.length === 3, "bear renderer should expose claw groups");
  assert(bearVisual.frontLeftClaws[1].position.z >= 0.1, "bear front claws should sit near the front of the rounded paw");
  runtime.updateEnemyVisualRenderer({
    enemyState: { runtimeId: "bear-visual", enemyId: "enemy_bear", attackTriggerAt: 100, hitReactionTriggerAt: 0 },
    renderer: bearVisual,
    frameNow: 260,
    idlePhase: 0.7,
    visuallyMoving: true,
    currentVisualX: 1.5,
    currentVisualY: 2.5
  });
  assert(Number.isFinite(bearVisual.headGroup.position.z), "bear pose update should move the head group");
  assert(Number.isFinite(bearVisual.frontLeftLeg.root.position.y), "bear pose update should animate leg rig roots");

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
