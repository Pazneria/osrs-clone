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
  const transientVisualSource = fs.readFileSync(path.join(root, "src", "js", "transient-visual-runtime.js"), "utf8");
  const inputQaCameraSource = fs.readFileSync(path.join(root, "src", "js", "input-qa-camera-runtime.js"), "utf8");
  const inputHoverTooltipSource = fs.readFileSync(path.join(root, "src", "js", "input-hover-tooltip-runtime.js"), "utf8");
  const inputStationInteractionSource = fs.readFileSync(path.join(root, "src", "js", "input-station-interaction-runtime.js"), "utf8");
  const inputPoseEditorSource = fs.readFileSync(path.join(root, "src", "js", "input-pose-editor-runtime.js"), "utf8");
  const inputPlayerAnimationSource = fs.readFileSync(path.join(root, "src", "js", "input-player-animation-runtime.js"), "utf8");
  const inputPathfindingSource = fs.readFileSync(path.join(root, "src", "js", "input-pathfinding-runtime.js"), "utf8");
  const inputPierInteractionSource = fs.readFileSync(path.join(root, "src", "js", "input-pier-interaction-runtime.js"), "utf8");
  const inputRaycastSource = fs.readFileSync(path.join(root, "src", "js", "input-raycast-runtime.js"), "utf8");
  const inputTickMovementSource = fs.readFileSync(path.join(root, "src", "js", "input-tick-movement-runtime.js"), "utf8");
  const inputArrivalInteractionSource = fs.readFileSync(path.join(root, "src", "js", "input-arrival-interaction-runtime.js"), "utf8");
  const inputActionQueueSource = fs.readFileSync(path.join(root, "src", "js", "input-action-queue-runtime.js"), "utf8");
  const inputTargetInteractionSource = fs.readFileSync(path.join(root, "src", "js", "input-target-interaction-runtime.js"), "utf8");
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
  assert(mapHudSource.includes("getWorldMapInitialCenter"), "world map HUD runtime should accept an authored initial center for large isolated maps");
  assert(mapHudSource.includes("clearMinimapDestinationIfReached"), "world map HUD runtime should own destination cleanup");
  assert(worldSource.includes("WorldMapHudRuntime"), "world.js should delegate map HUD orchestration through the map HUD runtime");
  assert(worldSource.includes("buildMapHudRuntimeContext"), "world.js should provide map HUD runtime context callbacks");
  assert(worldSource.includes("resolveRenderWorldId() === 'tutorial_island'"), "world.js should center the tutorial world map on the enlarged island");
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
  assert(worldRenderSource.includes("mapSize: 512"), "world render runtime should keep the main shadow map on a cheaper 512px budget");
  assert(worldSource.includes("renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));"), "world renderer should cap main canvas pixel ratio for performance");
  assert(inputSource.includes("renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));"), "input resize should preserve the main canvas pixel-ratio cap");
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
  assert(worldSource.includes("function updateTutorialGuidanceMarker"), "world.js should own the tutorial guidance marker renderer");
  assert(worldSource.includes("window.updateTutorialGuidanceMarker = updateTutorialGuidanceMarker;"), "world.js should expose tutorial guidance marker updates through the world shell");
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
  assert(inputQaCameraSource.includes("function publishQaCameraHooks"), "input QA camera runtime should own QA camera public hook publication");
  assert(inputSource.includes("InputQaCameraRuntime"), "input-render.js should delegate QA camera helpers through the QA camera runtime");
  assert(inputSource.includes("runtime.publishQaCameraHooks({"), "input-render.js should publish QA camera hooks through the QA camera runtime");
  assert(!inputSource.includes("window.setQaCameraView = function"), "input-render.js should not directly publish setQaCameraView");
  assert(!inputSource.includes("const gx = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(Number(x) || 0)));"), "input-render.js should not own QA projection coordinate clamping");
  assert(manifestSource.includes('../../js/input-qa-camera-runtime.js?raw'), "legacy manifest should load input QA camera runtime");
  assert(
    manifestSource.indexOf('id: "input-qa-camera-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input QA camera runtime before input-render.js"
  );
  assert(inputHoverTooltipSource.includes("window.InputHoverTooltipRuntime"), "input hover tooltip runtime should expose a window runtime");
  assert(inputHoverTooltipSource.includes("function formatHoverTooltipActionText"), "input hover tooltip runtime should own hover action text policy");
  assert(inputHoverTooltipSource.includes("function buildHoverTooltipDisplayOptions"), "input hover tooltip runtime should own hover display option shaping");
  assert(inputHoverTooltipSource.includes("function isFireUnderCursor"), "input hover tooltip runtime should own active-fire hover detection");
  assert(inputHoverTooltipSource.includes("function positionHoverTooltip"), "input hover tooltip runtime should own hover tooltip positioning");
  assert(inputSource.includes("InputHoverTooltipRuntime"), "input-render.js should delegate hover tooltip display through the hover tooltip runtime");
  assert(inputSource.includes("buildInputHoverTooltipRuntimeContext"), "input-render.js should provide a narrow hover tooltip runtime context");
  assert(!inputSource.includes("tooltip.innerHTML = actionText"), "input-render.js should not own hover tooltip DOM updates");
  assert(!inputSource.includes("function resolveTooltipTargetTile"), "input-render.js should not own hover target tile resolution");
  assert(!inputSource.includes("const fireUnderCursor ="), "input-render.js should not own active-fire hover detection");
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
  assert(transientVisualSource.includes("window.TransientVisualRuntime"), "transient visual runtime should expose a window runtime");
  assert(transientVisualSource.includes("function spawnClickMarker"), "transient visual runtime should own click marker creation");
  assert(transientVisualSource.includes("function updateTransientVisuals"), "transient visual runtime should own per-frame transient visual updates");
  assert(inputSource.includes("TransientVisualRuntime"), "input-render.js should delegate transient visual ownership through the transient visual runtime");
  assert(inputSource.includes("transientVisualRuntime.updateTransientVisuals({"), "input-render.js should delegate transient visual frame updates");
  assert(!inputSource.includes("const color = isAction ? 0xff0000 : 0xffff00"), "input-render.js should not own click marker material policy");
  assert(!inputSource.includes("for (let i = activeHitsplats.length - 1; i >= 0; i--)"), "input-render.js should not own hitsplat frame updates");
  assert(manifestSource.includes('../../js/transient-visual-runtime.js?raw'), "legacy manifest should load transient visual runtime");
  assert(
    manifestSource.indexOf('id: "transient-visual-runtime"') < manifestSource.indexOf('id: "world"')
      && manifestSource.indexOf('id: "transient-visual-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load transient visual runtime before world/input consumers"
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
  assert(inputPathfindingSource.includes("window.InputPathfindingRuntime"), "input pathfinding runtime should expose a window runtime");
  assert(inputPathfindingSource.includes("function findPath"), "input pathfinding runtime should own pathfinding");
  assert(inputPathfindingSource.includes("function estimatePathDistanceToAnyTarget"), "input pathfinding runtime should score routes toward the nearest valid target");
  assert(inputPathfindingSource.includes("function estimatePathLineDeviationToAnyTarget"), "input pathfinding runtime should prefer equal-cost routes that stay close to the click line");
  assert(inputPathfindingSource.includes("Math.SQRT2"), "input pathfinding runtime should price diagonal movement separately from cardinal movement");
  assert(inputPathfindingSource.includes("if (blockX || blockY) continue;"), "input pathfinding runtime should reject diagonal corner cutting");
  assert(inputSource.includes("InputPathfindingRuntime"), "input-render.js should delegate pathfinding through the pathfinding runtime");
  assert(inputSource.includes("buildInputPathfindingRuntimeContext"), "input-render.js should provide a narrow pathfinding runtime context");
  assert(!inputSource.includes("let visitedParents = new Map()"), "input-render.js should not own BFS parent tracking");
  assert(manifestSource.includes('../../js/input-pathfinding-runtime.js?raw'), "legacy manifest should load input pathfinding runtime");
  assert(
    manifestSource.indexOf('id: "input-player-animation-runtime"') < manifestSource.indexOf('id: "input-pathfinding-runtime"')
      && manifestSource.indexOf('id: "input-pathfinding-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input pathfinding runtime before input-render.js"
  );
  assert(inputPierInteractionSource.includes("window.InputPierInteractionRuntime"), "input pier interaction runtime should expose a window runtime");
  assert(inputPierInteractionSource.includes("function findNearestFishableWaterEdgeTile"), "input pier interaction runtime should own fishable water edge resolution");
  assert(inputPierInteractionSource.includes("function buildPierStepDescendPath"), "input pier interaction runtime should own pier step descent fallback pathing");
  assert(inputSource.includes("InputPierInteractionRuntime"), "input-render.js should delegate pier interaction helpers through the pier runtime");
  assert(inputSource.includes("buildInputPierInteractionRuntimeContext"), "input-render.js should provide a narrow pier interaction runtime context");
  assert(!inputSource.includes("function forEachTileInSearchRing"), "input-render.js should not own pier search-ring traversal");
  assert(!inputSource.includes("const shoreCandidates = [pierConfig.entryY"), "input-render.js should not own pier step descent internals");
  assert(manifestSource.includes('../../js/input-pier-interaction-runtime.js?raw'), "legacy manifest should load input pier interaction runtime");
  assert(
    manifestSource.indexOf('id: "input-pathfinding-runtime"') < manifestSource.indexOf('id: "input-pier-interaction-runtime"')
      && manifestSource.indexOf('id: "input-pier-interaction-runtime"') < manifestSource.indexOf('id: "input-raycast-runtime"')
      && manifestSource.indexOf('id: "input-pier-interaction-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input pier interaction runtime before raycast/input consumers"
  );
  assert(inputRaycastSource.includes("window.InputRaycastRuntime"), "input raycast runtime should expose a window runtime");
  assert(inputRaycastSource.includes("function normalizeRaycastHit"), "input raycast runtime should own raycast hit normalization");
  assert(inputRaycastSource.includes("function getRaycastHitPriority"), "input raycast runtime should own raycast hit priority");
  assert(inputSource.includes("InputRaycastRuntime"), "input-render.js should delegate raycast resolution through the raycast runtime");
  assert(inputSource.includes("buildInputRaycastRuntimeContext"), "input-render.js should provide a narrow raycast runtime context");
  assert(!inputSource.includes("function getRaycastHitPriority("), "input-render.js should not own raycast hit priority");
  assert(manifestSource.includes('../../js/input-raycast-runtime.js?raw'), "legacy manifest should load input raycast runtime");
  assert(
    manifestSource.indexOf('id: "input-pathfinding-runtime"') < manifestSource.indexOf('id: "input-raycast-runtime"')
      && manifestSource.indexOf('id: "input-raycast-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input raycast runtime before input-render.js"
  );
  assert(inputTickMovementSource.includes("window.InputTickMovementRuntime"), "input tick movement runtime should expose a window runtime");
  assert(inputTickMovementSource.includes("function applyPendingAction"), "input tick movement runtime should own pending action setup");
  assert(inputTickMovementSource.includes("function advancePlayerMovement"), "input tick movement runtime should own player path stepping");
  assert(inputSource.includes("InputTickMovementRuntime"), "input-render.js should delegate tick movement through the tick movement runtime");
  assert(inputSource.includes("buildInputTickMovementRuntimeContext"), "input-render.js should provide a narrow tick movement runtime context");
  assert(!inputSource.includes("let stepsToTake = isRunning ? 2 : 1;"), "input-render.js should not own run-step path movement");
  assert(manifestSource.includes('../../js/input-tick-movement-runtime.js?raw'), "legacy manifest should load input tick movement runtime");
  assert(
    manifestSource.indexOf('id: "input-raycast-runtime"') < manifestSource.indexOf('id: "input-tick-movement-runtime"')
      && manifestSource.indexOf('id: "input-tick-movement-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input tick movement runtime before input-render.js"
  );
  assert(inputArrivalInteractionSource.includes("window.InputArrivalInteractionRuntime"), "input arrival interaction runtime should expose a window runtime");
  assert(inputArrivalInteractionSource.includes("function processArrivalInteractions"), "input arrival interaction runtime should own arrival interaction completion");
  assert(inputArrivalInteractionSource.includes("function handleWalkingToInteractArrival"), "input arrival interaction runtime should own WALKING_TO_INTERACT completion");
  assert(inputSource.includes("InputArrivalInteractionRuntime"), "input-render.js should delegate arrival interaction policy through the arrival runtime");
  assert(inputSource.includes("buildInputArrivalInteractionRuntimeContext"), "input-render.js should provide a narrow arrival interaction runtime context");
  assert(!inputSource.includes("door.isOpen = !door.isOpen;"), "input-render.js should not own door arrival mutation");
  assert(!inputSource.includes("playerState.targetUid.action === 'Talk-to'"), "input-render.js should not own NPC Talk-to arrival routing");
  assert(manifestSource.includes('../../js/input-arrival-interaction-runtime.js?raw'), "legacy manifest should load input arrival interaction runtime");
  assert(
    manifestSource.indexOf('id: "input-tick-movement-runtime"') < manifestSource.indexOf('id: "input-arrival-interaction-runtime"')
      && manifestSource.indexOf('id: "input-arrival-interaction-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input arrival interaction runtime before input-render.js"
  );
  assert(inputActionQueueSource.includes("window.InputActionQueueRuntime"), "input action queue runtime should expose a window runtime");
  assert(inputActionQueueSource.includes("function queueAction"), "input action queue runtime should own action queueing");
  assert(inputActionQueueSource.includes("function cancelManualFiremakingChain"), "input action queue runtime should own manual firemaking cancellation");
  assert(inputSource.includes("InputActionQueueRuntime"), "input-render.js should delegate action queueing through the action queue runtime");
  assert(inputSource.includes("buildInputActionQueueRuntimeContext"), "input-render.js should provide a narrow action queue runtime context");
  assert(!inputSource.includes("playerState.firemakingSession = null;"), "input-render.js should not own firemaking cancellation details");
  assert(!inputSource.includes("reason: 'queue-walk'"), "input-render.js should not own queued-action combat clear reasons");
  assert(manifestSource.includes('../../js/input-action-queue-runtime.js?raw'), "legacy manifest should load input action queue runtime");
  assert(
    manifestSource.indexOf('id: "input-arrival-interaction-runtime"') < manifestSource.indexOf('id: "input-action-queue-runtime"')
      && manifestSource.indexOf('id: "input-action-queue-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input action queue runtime before input-render.js"
  );
  assert(inputTargetInteractionSource.includes("window.InputTargetInteractionRuntime"), "input target interaction runtime should expose a window runtime");
  assert(inputTargetInteractionSource.includes("function resolveTargetInteractionOptions"), "input target interaction runtime should own target context-menu option resolution");
  assert(inputTargetInteractionSource.includes("function handlePrimaryInteractionHit"), "input target interaction runtime should own primary click target policy");
  assert(inputSource.includes("InputTargetInteractionRuntime"), "input-render.js should delegate target interaction policy through the target interaction runtime");
  assert(inputSource.includes("buildInputTargetInteractionRuntimeContext"), "input-render.js should provide a narrow target interaction runtime context");
  assert(!inputSource.includes("SkillRuntime.tryUseItemOnTarget({"), "input-render.js should not own selected item target-use policy");
  assert(!inputSource.includes("enemyId: String(hitData.uid || '').trim()"), "input-render.js should not own enemy target metadata shaping");
  assert(manifestSource.includes('../../js/input-target-interaction-runtime.js?raw'), "legacy manifest should load input target interaction runtime");
  assert(
    manifestSource.indexOf('id: "input-action-queue-runtime"') < manifestSource.indexOf('id: "input-target-interaction-runtime"')
      && manifestSource.indexOf('id: "input-target-interaction-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy script manifest should load input target interaction runtime before input-render.js"
  );
  assert(!inputSource.includes("const animationStudioBridge ="), "input-render.js should not cache AnimationStudioBridge before runtime initialization settles");
  assert(inputSource.includes("const bridge = window.AnimationStudioBridge || null;"), "input-render.js should resolve AnimationStudioBridge lazily when checking studio activity");
  assert(inputSource.includes("function maybeUpdateMainDirectionalShadowFocus"), "input-render.js should throttle directional shadow focus updates through a helper");
  assert(inputSource.includes("window.updateMainDirectionalShadowFocus"), "input-render.js should keep directional shadow focus wired through the world shell");
  assert(inputSource.includes("window.updateSkyRuntime(camera.position, frameNowMs);"), "input-render.js should refresh the sky runtime from animate()");
  assert(inputSource.includes("window.updateTutorialGuidanceMarker(frameNowMs);"), "input-render.js should refresh tutorial guidance markers from animate()");
  assert(inputSource.includes("const cameraFollowY = baseVisualY;"), "input-render.js should keep follow-camera height anchored to the unbobbed player base height");
  assert(!inputSource.includes("camBobOffset"), "input-render.js should not feed local idle bob into camera follow height");
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
