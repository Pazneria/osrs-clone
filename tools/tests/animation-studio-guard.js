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
  const debugPanelSource = fs.readFileSync(path.join(root, "src", "js", "combat-animation-debug-panel-runtime.js"), "utf8");
  const playerModelSource = fs.readFileSync(path.join(root, "src", "js", "player-model.js"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "animation-bridge.ts"), "utf8");
  const studioSource = fs.readFileSync(path.join(root, "src", "game", "animation", "studio.ts"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const viteSource = fs.readFileSync(path.join(root, "vite.config.ts"), "utf8");

  assert(mainSource.includes("exposeAnimationBridge"), "main.ts should expose the animation bridge");
  assert(coreSource.includes("window.AnimationStudioBridge.init"), "core.js should initialize the animation studio");
  assert(!coreSource.includes("initPoseEditor();"), "core.js should no longer initialize the old pose editor");
  assert(
    inputSource.includes("function getAnimationRuntimeBridge()")
      && inputSource.includes("return window.AnimationRuntimeBridge || null;"),
    "input-render.js should resolve the animation runtime bridge lazily"
  );
  assert(inputSource.includes("function isAnimationStudioActive()"), "input-render.js should gate runtime input while the studio is open");
  assert(inputSource.includes("applyClipDrivenPlayerAnimation"), "input-render.js should use clip-driven player animation");
  assert(inputSource.includes("player/combat_slash"), "input-render.js should request the combat slash clip");
  assert(inputSource.includes("player/hit_recoil"), "input-render.js should request the hit recoil clip");
  assert(debugPanelSource.includes("window.CombatAnimationDebugPanelRuntime"), "combat animation debug panel runtime should expose a window runtime");
  assert(debugPanelSource.includes("combat-animation-debug-panel"), "combat animation debug panel runtime should own the panel DOM");
  assert(debugPanelSource.includes("function updateCombatAnimationDebugPanel(options = {})"), "combat animation debug panel runtime should refresh combat animation debug state");
  assert(inputSource.includes("CombatAnimationDebugPanelRuntime"), "input-render.js should delegate combat animation debug panel rendering");
  assert(!inputSource.includes("function ensureCombatAnimationDebugPanel()"), "input-render.js should not own combat animation debug panel DOM construction");
  assert(manifestSource.includes('../../js/combat-animation-debug-panel-runtime.js?raw'), "legacy manifest should load combat animation debug panel runtime");
  assert(
    manifestSource.indexOf('id: "combat-animation-debug-panel-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy manifest should load combat animation debug panel runtime before input-render.js"
  );
  assert(playerModelSource.includes("window.createPlayerRigFromCurrentAppearance = createPlayerRigFromCurrentAppearance;"), "player-model.js should expose preview rig creation");
  assert(playerModelSource.includes("window.createPlayerRigForAnimationStudio = createPlayerRigForAnimationStudio;"), "player-model.js should expose a weaponless studio preview rig");
  assert(playerModelSource.includes("torso.add(head, leftArm, rightArm);"), "player-model.js should parent the head under the torso for shared motion");
  assert(bridgeSource.includes("window.AnimationRuntimeBridge"), "animation bridge should expose AnimationRuntimeBridge");
  assert(bridgeSource.includes("window.AnimationStudioBridge"), "animation bridge should expose AnimationStudioBridge");
  assert(bridgeSource.includes("getLegacyControllerDebugState"), "animation bridge should expose controller debug snapshots");
  assert(studioSource.includes("clip -> pose -> node -> axis/value"), "studio should render the shared language summary");
  assert(studioSource.includes("createAxisLine"), "studio should render an RGB axis gizmo");
  assert(studioSource.includes("resolveClipTimeSummary"), "studio should label the playhead with pose/marker context");
  assert(studioSource.includes("animation-studio-toggle-labels"), "studio should expose a labels toggle control");
  assert(studioSource.includes("animation-studio-move"), "studio should expose a move manipulator mode");
  assert(studioSource.includes("animation-studio-rotate"), "studio should expose a rotate manipulator mode");
  assert(studioSource.includes("animation-studio-new-clip-name"), "studio should expose a new-clip name field");
  assert(studioSource.includes("animation-studio-create-clip"), "studio should expose a new-clip create button");
  assert(studioSource.includes("animation-studio-undo"), "studio should expose an undo control");
  assert(studioSource.includes("animation-studio-held-item-select"), "studio should expose a held-item dropdown");
  assert(studioSource.includes("animation-studio-held-item-left-select"), "studio should expose a left-hand held-item dropdown");
  assert(studioSource.includes("animation-studio-held-item-slot-select"), "studio should expose a held-item hand dropdown");
  assert(studioSource.includes("animation-studio-isolate-node"), "studio should expose a node isolation toggle");
  assert(studioSource.includes("animation-studio-snap-node"), "studio should expose a snap-to-node control");
  assert(studioSource.includes("animation-studio-decouple-children"), "studio should expose a descendant decoupling toggle");
  assert(studioSource.includes("animation-studio-mirror-limb"), "studio should expose a limb mirror button");
  assert(studioSource.includes("animation-studio-delete-pose-btn"), "studio should expose a pose delete control");
  assert(studioSource.includes("animation-studio-duplicate-pose-btn"), "studio should expose a pose duplicate control");
  assert(studioSource.includes("animation-studio-copy-pose-btn"), "studio should expose a pose copy control");
  assert(studioSource.includes("animation-studio-paste-pose-btn"), "studio should expose a pose paste-over control");
  assert(studioSource.includes("animation-studio-paste-pose-new-btn"), "studio should expose a pose paste-new control");
  assert(studioSource.includes("animation-studio-copy-node-btn"), "studio should expose a node copy context action");
  assert(studioSource.includes("animation-studio-paste-node-btn"), "studio should expose a node paste context action");
  assert(studioSource.includes("animation-studio-move-pose-up-btn"), "studio should expose a pose move-up control");
  assert(studioSource.includes("animation-studio-move-pose-down-btn"), "studio should expose a pose move-down control");
  assert(studioSource.includes("function createNewClip()"), "studio should support creating fresh clips from the UI");
  assert(studioSource.includes("function undoStudioEdit()"), "studio should support undoing the last studio edit");
  assert(studioSource.includes("function beginUndoTransaction()"), "studio should support coalescing editor drags into one undo step");
  assert(studioSource.includes("function finishUndoTransaction("), "studio should finish coalesced undo transactions cleanly");
  assert(studioSource.includes("function refreshHeldItemSelect()"), "studio should populate held-item options");
  assert(studioSource.includes("function refreshHeldItemSlotSelect()"), "studio should populate held-item hand options");
  assert(studioSource.includes("function applyHeldItemSelectionToPreview()"), "studio should apply held-item previews to the rig");
  assert(studioSource.includes("function refreshIsolationButton()"), "studio should refresh the node isolation toggle state");
  assert(studioSource.includes("function toggleNodeIsolation()"), "studio should support toggling node isolation");
  assert(studioSource.includes("function applyNodeIsolationToPreview()"), "studio should isolate selected-node geometry in the preview");
  assert(studioSource.includes("function refreshSnapButton()"), "studio should refresh the snap-to button state");
  assert(studioSource.includes("function toggleSnapToMode()"), "studio should support arming snap-to mode");
  assert(studioSource.includes("function listDescendantNodeIds("), "studio should resolve preview-rig descendants for child decoupling");
  assert(studioSource.includes("function toggleDecoupleDescendantsMode()"), "studio should support toggling descendant decoupling");
  assert(studioSource.includes("function applyDescendantWorldMatrices("), "studio should preserve descendant world transforms while editing parents");
  assert(studioSource.includes("function syncSelectedNodeTransformWithDecoupledDescendantsFromPreview()"), "studio should sync selected nodes while keeping descendants pinned");
  assert(studioSource.includes("function executeSnapToTarget("), "studio should support snapping one node to another using rig bind positions");
  assert(studioSource.includes("function resolveBindLocalPositionVector("), "studio should expose bind local-position helpers for studio snapping");
  assert(studioSource.includes("function setPoseNodeLocalPosition("), "studio should support pose position updates for multi-node snap adjustments");
  assert(studioSource.includes("activeInspectorInputKey"), "studio should track the active inspector input while editing");
  assert(studioSource.includes("function resolveCaretStepMagnitude("), "studio should support caret-aware wheel step sizing for inspector values");
  assert(studioSource.includes("setPlayerRigToolVisual"), "studio should drive preview held items through player-model visuals");
  assert(studioSource.includes("setPlayerRigToolVisuals"), "studio should support previewing both held hands at once");
  assert(studioSource.includes("function expandSharedPreviewNodeIds("), "studio should keep shared weapon-node aliases synchronized while editing");
  assert(studioSource.includes("createPlayerRigForAnimationStudio"), "studio should build preview rigs through the dedicated studio rig factory");
  assert(studioSource.includes("function mirrorSelectedLimb()"), "studio should support mirroring a selected limb");
  assert(studioSource.includes("LIMB_SUBTREE_NODE_IDS"), "studio should define limb subtree mappings for mirroring");
  assert(studioSource.includes("registerAnimationClip"), "studio should register newly created clips in memory");
  assert(studioSource.includes("ANIMATION_STUDIO_CLIP_ROUTE"), "studio should load dev clip files through the dev bridge");
  assert(studioSource.includes("function duplicateSelectedPose()"), "studio should support duplicating the selected pose");
  assert(studioSource.includes("function copySelectedPoseToClipboard()"), "studio should support copying a pose into a studio clipboard");
  assert(studioSource.includes("function pasteClipboardPoseOverSelectedPose()"), "studio should support pasting a copied pose over the selected pose");
  assert(studioSource.includes("function pasteClipboardPoseAsNew()"), "studio should support pasting a copied pose as a new pose");
  assert(studioSource.includes("function copySelectedNodeToClipboard()"), "studio should support copying the selected node into a node clipboard");
  assert(studioSource.includes("function pasteNodeClipboardOverSelection()"), "studio should support pasting the node clipboard over the selected node");
  assert(studioSource.includes("function showNodeContextMenu("), "studio should expose a viewport node context menu");
  assert(studioSource.includes("function moveSelectedPoseRelative(offset: number)"), "studio should support reordering poses");
  assert(studioSource.includes("function deleteSelectedPose()"), "studio should support deleting the selected pose");
  assert(studioSource.includes("handleViewportSelection"), "studio should support selecting nodes from the viewport");
  assert(studioSource.includes("handleViewportPointerDown"), "studio should support viewport pointer routing");
  assert(studioSource.includes("beginViewportCameraDrag"), "studio should allow empty-space camera dragging");
  assert(studioSource.includes("event.button !== 0 && event.button !== 2"), "studio should keep a dedicated right-drag orbit path");
  assert(studioSource.includes("stopImmediatePropagation"), "studio should keep camera orbit from leaking into gizmo input");
  assert(studioSource.includes("draftDirty"), "studio should track unsaved draft edits separately from live clips");
  assert(studioSource.includes("replaceAnimationClip(savedClip);"), "studio should only push persisted clips live on save");
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
  assert(studioSource.includes("preview ${state.selectedPoseId} (${previewReason})"), "studio should label when the viewport is previewing the selected pose directly");
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
