import type { LegacyScriptEntry } from "../legacy-script-entry";

import inputQaCameraRuntimeScript from "../../../js/input-qa-camera-runtime.js?raw";
import inputHoverTooltipRuntimeScript from "../../../js/input-hover-tooltip-runtime.js?raw";
import inputStationInteractionRuntimeScript from "../../../js/input-station-interaction-runtime.js?raw";
import inputPoseEditorRuntimeScript from "../../../js/input-pose-editor-runtime.js?raw";
import inputPlayerAnimationRuntimeScript from "../../../js/input-player-animation-runtime.js?raw";
import inputPathfindingRuntimeScript from "../../../js/input-pathfinding-runtime.js?raw";
import inputPierInteractionRuntimeScript from "../../../js/input-pier-interaction-runtime.js?raw";
import inputRaycastRuntimeScript from "../../../js/input-raycast-runtime.js?raw";
import inputTickMovementRuntimeScript from "../../../js/input-tick-movement-runtime.js?raw";
import inputArrivalInteractionRuntimeScript from "../../../js/input-arrival-interaction-runtime.js?raw";
import inputActionQueueRuntimeScript from "../../../js/input-action-queue-runtime.js?raw";
import inputTargetInteractionRuntimeScript from "../../../js/input-target-interaction-runtime.js?raw";
import inputRenderScript from "../../../js/input-render.js?raw";

export const inputLegacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  "input-qa-camera-runtime": { id: "input-qa-camera-runtime", filename: "src/js/input-qa-camera-runtime.js", code: inputQaCameraRuntimeScript },
  "input-hover-tooltip-runtime": { id: "input-hover-tooltip-runtime", filename: "src/js/input-hover-tooltip-runtime.js", code: inputHoverTooltipRuntimeScript },
  "input-station-interaction-runtime": { id: "input-station-interaction-runtime", filename: "src/js/input-station-interaction-runtime.js", code: inputStationInteractionRuntimeScript },
  "input-pose-editor-runtime": { id: "input-pose-editor-runtime", filename: "src/js/input-pose-editor-runtime.js", code: inputPoseEditorRuntimeScript },
  "input-player-animation-runtime": { id: "input-player-animation-runtime", filename: "src/js/input-player-animation-runtime.js", code: inputPlayerAnimationRuntimeScript },
  "input-pathfinding-runtime": { id: "input-pathfinding-runtime", filename: "src/js/input-pathfinding-runtime.js", code: inputPathfindingRuntimeScript },
  "input-pier-interaction-runtime": { id: "input-pier-interaction-runtime", filename: "src/js/input-pier-interaction-runtime.js", code: inputPierInteractionRuntimeScript },
  "input-raycast-runtime": { id: "input-raycast-runtime", filename: "src/js/input-raycast-runtime.js", code: inputRaycastRuntimeScript },
  "input-tick-movement-runtime": { id: "input-tick-movement-runtime", filename: "src/js/input-tick-movement-runtime.js", code: inputTickMovementRuntimeScript },
  "input-arrival-interaction-runtime": { id: "input-arrival-interaction-runtime", filename: "src/js/input-arrival-interaction-runtime.js", code: inputArrivalInteractionRuntimeScript },
  "input-action-queue-runtime": { id: "input-action-queue-runtime", filename: "src/js/input-action-queue-runtime.js", code: inputActionQueueRuntimeScript },
  "input-target-interaction-runtime": { id: "input-target-interaction-runtime", filename: "src/js/input-target-interaction-runtime.js", code: inputTargetInteractionRuntimeScript },
  "input-render": { id: "input-render", filename: "src/js/input-render.js", code: inputRenderScript }
};
