const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const renderContracts = fs.readFileSync(path.join(root, "src", "game", "contracts", "render.ts"), "utf8");
  const renderInputBridge = fs.readFileSync(path.join(root, "src", "game", "platform", "render-input-bridge.ts"), "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const mapHudSource = fs.readFileSync(path.join(root, "src", "js", "world", "map-hud-runtime.js"), "utf8");
  const worldRenderSource = fs.readFileSync(path.join(root, "src", "js", "world", "render-runtime.js"), "utf8");
  const sharedAssetsSource = fs.readFileSync(path.join(root, "src", "js", "world", "shared-assets-runtime.js"), "utf8");
  const humanoidModelSource = fs.readFileSync(path.join(root, "src", "js", "humanoid-model-runtime.js"), "utf8");
  const inputQaCameraSource = fs.readFileSync(path.join(root, "src", "js", "input-qa-camera-runtime.js"), "utf8");
  const inputHoverTooltipSource = fs.readFileSync(path.join(root, "src", "js", "input-hover-tooltip-runtime.js"), "utf8");
  const inputStationInteractionSource = fs.readFileSync(path.join(root, "src", "js", "input-station-interaction-runtime.js"), "utf8");
  const inputPoseEditorSource = fs.readFileSync(path.join(root, "src", "js", "input-pose-editor-runtime.js"), "utf8");
  const inputPlayerAnimationSource = fs.readFileSync(path.join(root, "src", "js", "input-player-animation-runtime.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

  assert(renderContracts.includes("export interface RenderSnapshot"), "render contracts should define RenderSnapshot");
  assert(renderContracts.includes("export interface InputControllerContext"), "render contracts should define InputControllerContext");
  assert(renderInputBridge.includes("window.RenderRuntime"), "render/input bridge should expose RenderRuntime");
  assert(renderInputBridge.includes("window.InputControllerRuntime"), "render/input bridge should expose InputControllerRuntime");
  assert(mapHudSource.includes("window.WorldMapHudRuntime"), "world map HUD runtime should expose a runtime");
  assert(mapHudSource.includes("buildHudRenderSnapshot"), "world map HUD runtime should build render snapshots");
  assert(mapHudSource.includes("buildWorldMapSnapshot"), "world map HUD runtime should consume the world-map render snapshot bridge");
  assert(mapHudSource.includes("buildMinimapSnapshot"), "world map HUD runtime should consume the minimap render snapshot bridge");
  assert(mapHudSource.includes("worldMapState"), "world map HUD runtime should own world-map pan and zoom state");
  assert(mapHudSource.includes("const minimapState"), "world map HUD runtime should own minimap zoom, lock, target, and destination state");
  assert(mapHudSource.includes("syncLockedMinimapTarget"), "world map HUD runtime should own locked-target following");
  assert(mapHudSource.includes("clearMinimapDestinationIfReached"), "world map HUD runtime should own destination cleanup");
  assert(worldSource.includes("WorldMapHudRuntime"), "world.js should delegate map HUD orchestration through the map HUD runtime");
  assert(worldSource.includes("buildMapHudRuntimeContext"), "world.js should provide map HUD runtime context callbacks");
  assert(!worldSource.includes("const worldMapState ="), "world.js should no longer own world-map pan and zoom state");
  assert(!worldSource.includes("minimapZoom"), "world.js should not read minimap zoom state directly");
  assert(!worldSource.includes("minimapDestination"), "world.js should not read minimap destination state directly");
  assert(!worldSource.includes("minimapLocked"), "world.js should not read minimap lock state directly");
  assert(!coreSource.includes("let minimapZoom"), "core.js should not own minimap zoom state");
  assert(!coreSource.includes("let minimapDestination"), "core.js should not own minimap destination state");
  assert(!inputSource.includes("minimapLocked &&"), "input-render.js should not read minimap lock state directly");
  assert(worldSource.includes("shadowFocusRevision"), "world.js should track shadow focus revision changes across scene reloads");
  assert(worldRenderSource.includes("window.WorldRenderRuntime"), "world render runtime should expose a runtime");
  assert(worldRenderSource.includes("function createWaterSurfaceMaterial"), "world render runtime should own water material construction");
  assert(worldRenderSource.includes("function createSkyDomeMaterial"), "world render runtime should own sky material construction");
  assert(worldRenderSource.includes("function initSkyRuntime"), "world render runtime should initialize the static sky runtime");
  assert(sharedAssetsSource.includes("window.WorldSharedAssetsRuntime"), "world shared asset runtime should expose a runtime");
  assert(sharedAssetsSource.includes("function initSharedAssets(options = {})"), "world shared asset runtime should own shared asset initialization");
  assert(worldSource.includes("WorldRenderRuntime"), "world.js should delegate render infrastructure through the world render runtime");
  assert(worldSource.includes("WorldSharedAssetsRuntime"), "world.js should delegate shared asset setup through the shared asset runtime");
  assert(!worldSource.includes("function createWaterSurfaceMaterial"), "world.js should not own water shader construction");
  assert(!worldSource.includes("function createSkyDomeMaterial"), "world.js should not own sky shader construction");
  assert(
    manifestSource.indexOf('id: "world-render-runtime"') > manifestSource.indexOf('id: "world-procedural-runtime"')
      && manifestSource.indexOf('id: "world-shared-assets-runtime"') > manifestSource.indexOf('id: "world-render-runtime"')
      && manifestSource.indexOf('id: "world-shared-assets-runtime"') < manifestSource.indexOf('id: "world-scene-state"'),
    "legacy script manifest should load world shared asset runtime after render helpers and before world.js"
  );
  assert(worldSource.includes("function initSkyRuntime"), "world.js should keep a small sky runtime orchestration wrapper");
  assert(worldSource.includes("function updateSkyRuntime"), "world.js should expose a sky update helper");
  assert(worldSource.includes("window.updateSkyRuntime = updateSkyRuntime;"), "world.js should keep sky updates wired through the world shell");
  assert(
    inputSource.includes("function getInputControllerRuntime()")
      && inputSource.includes("return window.InputControllerRuntime || null;"),
    "input-render.js should adopt the input controller bridge lazily"
  );
  assert(inputSource.includes("resolvePointerDown"), "input-render.js should delegate pointer decisions to the input controller bridge");
  assert(inputSource.includes("resolveMouseWheelCameraDistance"), "input-render.js should delegate zoom decisions to the input controller bridge");
  assert(inputQaCameraSource.includes("window.InputQaCameraRuntime"), "input QA camera runtime should expose a window runtime");
  assert(inputQaCameraSource.includes("function projectWorldTileToScreen"), "input QA camera runtime should own world-tile projection");
  assert(inputQaCameraSource.includes("function syncQaRenderToPlayerState"), "input QA camera runtime should own QA render sync behavior");
  assert(inputSource.includes("InputQaCameraRuntime"), "input-render.js should delegate QA camera helpers through the QA camera runtime");
  assert(!inputSource.includes("const gx = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(Number(x) || 0)));"), "input-render.js should not own QA projection coordinate clamping");
  assert(manifestSource.includes('../../js/input-qa-camera-runtime.js?raw'), "legacy manifest should load input QA camera runtime");
  assert(
    manifestSource.indexOf('id: "input-qa-camera-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input QA camera runtime before input-render.js"
  );
  assert(inputHoverTooltipSource.includes("window.InputHoverTooltipRuntime"), "input hover tooltip runtime should expose a window runtime");
  assert(inputHoverTooltipSource.includes("function formatHoverTooltipActionText"), "input hover tooltip runtime should own hover action text policy");
  assert(inputHoverTooltipSource.includes("function positionHoverTooltip"), "input hover tooltip runtime should own hover tooltip positioning");
  assert(inputSource.includes("InputHoverTooltipRuntime"), "input-render.js should delegate hover tooltip display through the hover tooltip runtime");
  assert(!inputSource.includes("tooltip.innerHTML = actionText"), "input-render.js should not own hover tooltip DOM updates");
  assert(manifestSource.includes('../../js/input-hover-tooltip-runtime.js?raw'), "legacy manifest should load input hover tooltip runtime");
  assert(
    manifestSource.indexOf('id: "input-hover-tooltip-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input hover tooltip runtime before input-render.js"
  );
  assert(humanoidModelSource.includes("window.HumanoidModelRuntime"), "humanoid model runtime should expose a window runtime");
  assert(humanoidModelSource.includes("window.createHumanoidModel = createHumanoidModel;"), "humanoid model runtime should publish the legacy model builder");
  assert(!inputSource.includes("function createHumanoidModel("), "input-render.js should not own humanoid model construction");
  assert(manifestSource.includes('../../js/humanoid-model-runtime.js?raw'), "legacy manifest should load humanoid model runtime");
  assert(
    manifestSource.indexOf('id: "humanoid-model-runtime"') < manifestSource.indexOf('id: "world"')
      && manifestSource.indexOf('id: "humanoid-model-runtime"') < manifestSource.indexOf('id: "combat"'),
    "legacy script manifest should load humanoid model runtime before world/combat consumers"
  );
  assert(inputStationInteractionSource.includes("window.InputStationInteractionRuntime"), "input station interaction runtime should expose a window runtime");
  assert(inputStationInteractionSource.includes("function getStationApproachPositions"), "input station interaction runtime should own station approach positions");
  assert(inputStationInteractionSource.includes("function validateStationApproach"), "input station interaction runtime should own station approach validation");
  assert(inputSource.includes("InputStationInteractionRuntime"), "input-render.js should delegate station interaction policy through the station runtime");
  assert(!inputSource.includes("function getStationFootprint"), "input-render.js should not own station footprint lookup");
  assert(!inputSource.includes("function resolveCardinalStepFromYaw"), "input-render.js should not own station cardinal facing math");
  assert(manifestSource.includes('../../js/input-station-interaction-runtime.js?raw'), "legacy manifest should load input station interaction runtime");
  assert(
    manifestSource.indexOf('id: "input-station-interaction-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input station interaction runtime before input-render.js"
  );
  assert(inputPoseEditorSource.includes("window.InputPoseEditorRuntime"), "input pose editor runtime should expose a window runtime");
  assert(inputPoseEditorSource.includes("function createPoseEditorState"), "input pose editor runtime should own pose editor state construction");
  assert(inputPoseEditorSource.includes("function beginPoseEditorDrag"), "input pose editor runtime should own pose editor drag startup");
  assert(inputPoseEditorSource.includes("function initPoseEditor"), "input pose editor runtime should own pose editor panel setup");
  assert(inputSource.includes("InputPoseEditorRuntime"), "input-render.js should delegate pose editor ownership through the pose editor runtime");
  assert(!inputSource.includes("function ensurePoseEditorRotationShape"), "input-render.js should not own pose editor rotation normalization");
  assert(!inputSource.includes("function makePoseEditorHandle"), "input-render.js should not own pose editor handle mesh creation");
  assert(manifestSource.includes('../../js/input-pose-editor-runtime.js?raw'), "legacy manifest should load input pose editor runtime");
  assert(
    manifestSource.indexOf('id: "input-pose-editor-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input pose editor runtime before input-render.js"
  );
  assert(inputPlayerAnimationSource.includes("window.InputPlayerAnimationRuntime"), "input player animation runtime should expose a window runtime");
  assert(inputPlayerAnimationSource.includes("function getActiveSkillBaseClipId"), "input player animation runtime should own skilling base clip policy");
  assert(inputPlayerAnimationSource.includes("function buildFishingStartActionClipRequest"), "input player animation runtime should own fishing start action clip policy");
  assert(inputSource.includes("InputPlayerAnimationRuntime"), "input-render.js should delegate player animation policy through the player animation runtime");
  assert(!inputSource.includes("function isMiningSkillAction("), "input-render.js should not own skilling action animation predicates");
  assert(!inputSource.includes("const FISHING_START_ACTION_REQUEST_WINDOW_MS"), "input-render.js should not own fishing start clip timing policy");
  assert(manifestSource.includes('../../js/input-player-animation-runtime.js?raw'), "legacy manifest should load input player animation runtime");
  assert(
    manifestSource.indexOf('id: "input-player-animation-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input player animation runtime before input-render.js"
  );
  assert(!inputSource.includes("const animationStudioBridge ="), "input-render.js should not cache AnimationStudioBridge before runtime initialization settles");
  assert(inputSource.includes("const bridge = window.AnimationStudioBridge || null;"), "input-render.js should resolve AnimationStudioBridge lazily when checking studio activity");
  assert(inputSource.includes("function maybeUpdateMainDirectionalShadowFocus"), "input-render.js should throttle directional shadow focus updates through a helper");
  assert(inputSource.includes("window.updateMainDirectionalShadowFocus"), "input-render.js should keep directional shadow focus wired through the world shell");
  assert(inputSource.includes("window.updateSkyRuntime(camera.position, frameNowMs);"), "input-render.js should refresh the sky runtime from animate()");
  assert(inputSource.includes("function syncPlayerRigSkillingToolVisual("), "input-render.js should reconcile temporary skilling tool visuals with live actions");
  assert(inputSource.includes("setPlayerRigToolVisual(playerRigRef, null);"), "input-render.js should clear temporary skilling tool visuals after skilling ends");

  const canvasOps = [];
  const fakeContext = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textBaseline: "",
    imageSmoothingEnabled: true,
    fillRect: (...args) => canvasOps.push(["fillRect", ...args]),
    strokeRect: (...args) => canvasOps.push(["strokeRect", ...args]),
    drawImage: (...args) => canvasOps.push(["drawImage", args.length]),
    beginPath: () => canvasOps.push(["beginPath"]),
    arc: (...args) => canvasOps.push(["arc", ...args]),
    fill: () => canvasOps.push(["fill"]),
    moveTo: (...args) => canvasOps.push(["moveTo", ...args]),
    lineTo: (...args) => canvasOps.push(["lineTo", ...args]),
    stroke: () => canvasOps.push(["stroke"]),
    save: () => canvasOps.push(["save"]),
    restore: () => canvasOps.push(["restore"]),
    translate: (...args) => canvasOps.push(["translate", ...args]),
    scale: (...args) => canvasOps.push(["scale", ...args]),
    fillText: (...args) => canvasOps.push(["fillText", ...args])
  };
  const makeCanvas = () => ({
    width: 2,
    height: 2,
    dataset: {},
    style: {},
    classList: { contains: () => false },
    getContext: () => fakeContext,
    getBoundingClientRect: () => ({ width: 2, height: 2, left: 0, top: 0 }),
    addEventListener: () => {}
  });
  const fakeDocument = {
    createElement: () => makeCanvas(),
    getElementById: (id) => (id === "minimap" || id === "world-map-canvas" || id === "world-map-panel") ? makeCanvas() : null
  };
  global.window = {
    document: fakeDocument,
    devicePixelRatio: 1,
    RenderRuntime: {
      buildRenderSnapshot: (options) => Object.assign({ bridged: true }, options)
    }
  };
  vm.runInThisContext(mapHudSource, { filename: path.join(root, "src", "js", "world", "map-hud-runtime.js") });
  const runtime = window.WorldMapHudRuntime;
  assert(runtime, "world map HUD runtime should execute in isolation");
  const tileIds = {
    OBSTACLE: 0,
    GRASS: 1,
    DIRT: 2,
    ROCK: 3,
    FLOOR_WOOD: 4,
    SHOP_COUNTER: 5,
    FLOOR_STONE: 6,
    STAIRS_RAMP: 7,
    SOLID_NPC: 8,
    FLOOR_BRICK: 9,
    BANK_BOOTH: 10,
    WALL: 11,
    TOWER: 12,
    STAIRS_UP: 13,
    STAIRS_DOWN: 14,
    SHORE: 15,
    WATER_SHALLOW: 16,
    WATER_DEEP: 17,
    FENCE: 18
  };
  const runtimeContext = {
    document: fakeDocument,
    mapSize: 2,
    chunkSize: 1,
    tileIds,
    getTile: () => tileIds.GRASS,
    getVisualTileId: (tile) => tile,
    getPlayerMapPosition: () => ({ x: 1, y: 1, z: 0, facingYaw: 0 }),
    resolveRenderWorldId: () => "main_overworld",
    getClickMarkers: () => [],
    getGroundItems: () => [],
    getMinimapDestination: () => null
  };
  assert(runtime.updateMinimapCanvas(runtimeContext).width === 2, "world map HUD runtime should redraw the offscreen map canvas");
  assert(runtime.buildHudRenderSnapshot(runtimeContext).worldId === "main_overworld", "world map HUD runtime should build a render snapshot through the bridge");

  console.log("Render/input shell guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
