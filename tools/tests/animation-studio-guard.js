const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const mainSource = fs.readFileSync(path.join(root, "src", "main.ts"), "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const playerModelSource = fs.readFileSync(path.join(root, "src", "js", "player-model.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "animation-bridge.ts"), "utf8");
  const studioSource = fs.readFileSync(path.join(root, "src", "game", "animation", "studio.ts"), "utf8");
  const viteSource = fs.readFileSync(path.join(root, "vite.config.ts"), "utf8");

  assert(mainSource.includes("exposeAnimationBridge"), "main.ts should expose the animation bridge");
  assert(coreSource.includes("window.AnimationStudioBridge.init"), "core.js should initialize the animation studio");
  assert(!coreSource.includes("initPoseEditor();"), "core.js should no longer initialize the old pose editor");
  assert(inputSource.includes("const animationRuntimeBridge = window.AnimationRuntimeBridge || null;"), "input-render.js should bind the animation runtime bridge");
  assert(inputSource.includes("function isAnimationStudioActive()"), "input-render.js should gate runtime input while the studio is open");
  assert(inputSource.includes("applyClipDrivenPlayerAnimation"), "input-render.js should use clip-driven player animation");
  assert(inputSource.includes("player/combat_slash"), "input-render.js should request the combat slash clip");
  assert(inputSource.includes("player/hit_recoil"), "input-render.js should request the hit recoil clip");
  assert(inputSource.includes("combat-animation-debug-panel"), "input-render.js should expose a combat animation debug panel");
  assert(inputSource.includes("updateCombatAnimationDebugPanel"), "input-render.js should refresh combat animation debug state");
  assert(playerModelSource.includes("window.createPlayerRigFromCurrentAppearance = createPlayerRigFromCurrentAppearance;"), "player-model.js should expose preview rig creation");
  assert(bridgeSource.includes("window.AnimationRuntimeBridge"), "animation bridge should expose AnimationRuntimeBridge");
  assert(bridgeSource.includes("window.AnimationStudioBridge"), "animation bridge should expose AnimationStudioBridge");
  assert(bridgeSource.includes("getLegacyControllerDebugState"), "animation bridge should expose controller debug snapshots");
  assert(studioSource.includes("clip -> pose -> node -> axis/value"), "studio should render the shared language summary");
  assert(studioSource.includes("createAxisLine"), "studio should render an RGB axis gizmo");
  assert(studioSource.includes("resolveClipTimeSummary"), "studio should label the playhead with pose/marker context");
  assert(studioSource.includes("animation-studio-toggle-labels"), "studio should expose a labels toggle control");
  assert(studioSource.includes("animation-studio-move"), "studio should expose a move manipulator mode");
  assert(studioSource.includes("animation-studio-rotate"), "studio should expose a rotate manipulator mode");
  assert(studioSource.includes("animation-studio-delete-pose-btn"), "studio should expose a pose delete control");
  assert(studioSource.includes("animation-studio-duplicate-pose-btn"), "studio should expose a pose duplicate control");
  assert(studioSource.includes("animation-studio-move-pose-up-btn"), "studio should expose a pose move-up control");
  assert(studioSource.includes("animation-studio-move-pose-down-btn"), "studio should expose a pose move-down control");
  assert(studioSource.includes("function duplicateSelectedPose()"), "studio should support duplicating the selected pose");
  assert(studioSource.includes("function moveSelectedPoseRelative(offset: number)"), "studio should support reordering poses");
  assert(studioSource.includes("function deleteSelectedPose()"), "studio should support deleting the selected pose");
  assert(studioSource.includes("handleViewportSelection"), "studio should support selecting nodes from the viewport");
  assert(studioSource.includes("handleViewportPointerDown"), "studio should support viewport pointer routing");
  assert(studioSource.includes("beginViewportCameraDrag"), "studio should allow empty-space camera dragging");
  assert(studioSource.includes("event.button !== 0 && event.button !== 2"), "studio should keep a dedicated right-drag orbit path");
  assert(studioSource.includes("stopImmediatePropagation"), "studio should keep camera orbit from leaking into gizmo input");
  assert(studioSource.includes("draftDirty"), "studio should track unsaved draft edits separately from live clips");
  assert(studioSource.includes("replaceAnimationClip(state.clip);"), "studio should only push draft clips live on save");
  assert(studioSource.includes("Selection cleared."), "studio should allow background clicks to clear selection");
  assert(studioSource.includes("No selection"), "studio should expose a no-selection inspector state");
  assert(studioSource.includes("selectedNodeId: null"), "studio should default to no selected node");
  assert(studioSource.includes("showLabels: false"), "studio should default to labels hidden");
  assert(studioSource.includes("setPlayheadTime(0);"), "studio play should rewind from frame 0 before playback");
  assert(!studioSource.includes("ghostPrev") && !studioSource.includes("ghostNext"), "studio should no longer render ghost pose previews");
  assert(studioSource.includes("updateKeyEaseAtPlayhead"), "studio should support updating key easing directly from the dropdown");
  assert(studioSource.includes("[${key.ease}]"), "studio key chips should display their easing mode");
  assert(studioSource.includes("animation-studio-duration"), "studio should expose a clip duration control");
  assert(studioSource.includes("function updateClipDuration()"), "studio should support editing clip duration in the UI");
  assert(studioSource.includes("function moveSelectedPoseKeyToTime(timeMs: number)"), "studio should support moving the selected pose key from the timeline");
  assert(studioSource.includes("function findNearestAvailableKeyTime("), "studio should snap moved or placed pose keys away from occupied times");
  assert(studioSource.includes("function resolveStudioPreviewPose()"), "studio should resolve a visible preview pose even for unkeyed pose drafts");
  assert(studioSource.includes("preview ${state.selectedPoseId} (unkeyed)"), "studio should label when the viewport is previewing an unkeyed pose draft");
  assert(studioSource.includes("animation-studio-duration-handle"), "studio should expose a draggable duration handle on the timeline");
  assert(studioSource.includes("beginDurationDrag"), "studio should support dragging the duration handle");
  assert(studioSource.includes("animation-studio-key-lane"), "studio should render keyed poses directly on the timeline");
  assert(studioSource.includes("buildPlayheadEasingSummary"), "studio should show easing diagnostics in the playhead summary");
  assert(studioSource.includes("previewPickRaycaster"), "studio should raycast body parts for selection");
  assert(studioSource.includes("TransformControls"), "studio should wire a direct manipulation gizmo");
  assert(viteSource.includes("createAnimationStudioDevMiddleware"), "vite config should wire the animation studio dev middleware");

  console.log("Animation studio guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
