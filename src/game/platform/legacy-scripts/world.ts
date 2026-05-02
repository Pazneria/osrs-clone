import type { LegacyScriptEntry } from "../legacy-script-entry";

import qaCommandRuntimeScript from "../../../js/qa-command-runtime.js?raw";
import qaToolsRuntimeScript from "../../../js/qa-tools-runtime.js?raw";
import tileRuntimeScript from "../../../js/world/tile-runtime.js?raw";
import worldProceduralRuntimeScript from "../../../js/world/procedural-runtime.js?raw";
import worldRenderRuntimeScript from "../../../js/world/render-runtime.js?raw";
import worldSharedAssetsRuntimeScript from "../../../js/world/shared-assets-runtime.js?raw";
import worldWaterRuntimeScript from "../../../js/world/water-runtime.js?raw";
import worldTerrainSetupRuntimeScript from "../../../js/world/terrain-setup-runtime.js?raw";
import worldLogicalMapAuthoringRuntimeScript from "../../../js/world/logical-map-authoring-runtime.js?raw";
import worldMiningQuarryRuntimeScript from "../../../js/world/mining-quarry-runtime.js?raw";
import worldPierRuntimeScript from "../../../js/world/pier-runtime.js?raw";
import worldChunkTerrainRuntimeScript from "../../../js/world/chunk-terrain-runtime.js?raw";
import worldChunkTierRenderRuntimeScript from "../../../js/world/chunk-tier-render-runtime.js?raw";
import worldGroundItemRenderRuntimeScript from "../../../js/world/ground-item-render-runtime.js?raw";
import worldGroundItemLifecycleRuntimeScript from "../../../js/world/ground-item-lifecycle-runtime.js?raw";
import worldNpcRenderRuntimeScript from "../../../js/world/npc-render-runtime.js?raw";
import worldStructureRenderRuntimeScript from "../../../js/world/structure-render-runtime.js?raw";
import worldTreeNodeRuntimeScript from "../../../js/world/tree-node-runtime.js?raw";
import worldTreeRenderRuntimeScript from "../../../js/world/tree-render-runtime.js?raw";
import worldTreeLifecycleRuntimeScript from "../../../js/world/tree-lifecycle-runtime.js?raw";
import worldRockNodeRuntimeScript from "../../../js/world/rock-node-runtime.js?raw";
import worldRockRenderRuntimeScript from "../../../js/world/rock-render-runtime.js?raw";
import worldRockLifecycleRuntimeScript from "../../../js/world/rock-lifecycle-runtime.js?raw";
import worldChunkResourceRenderRuntimeScript from "../../../js/world/chunk-resource-render-runtime.js?raw";
import worldMiningPoseReferenceRuntimeScript from "../../../js/world/mining-pose-reference-runtime.js?raw";
import worldTownNpcRuntimeScript from "../../../js/world/town-npc-runtime.js?raw";
import worldFireRenderRuntimeScript from "../../../js/world/fire-render-runtime.js?raw";
import worldFireLifecycleRuntimeScript from "../../../js/world/fire-lifecycle-runtime.js?raw";
import worldSceneStateScript from "../../../js/world/scene-state.js?raw";
import worldSceneLifecycleScript from "../../../js/world/scene-lifecycle.js?raw";
import worldChunkSceneRuntimeScript from "../../../js/world/chunk-scene-runtime.js?raw";
import worldMapHudRuntimeScript from "../../../js/world/map-hud-runtime.js?raw";
import worldTrainingLocationRuntimeScript from "../../../js/world/training-location-runtime.js?raw";
import worldStatusHudRuntimeScript from "../../../js/world/status-hud-runtime.js?raw";
import worldScript from "../../../js/world.js?raw";

export const worldLegacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  "qa-command-runtime": { id: "qa-command-runtime", filename: "src/js/qa-command-runtime.js", code: qaCommandRuntimeScript },
  "qa-tools-runtime": { id: "qa-tools-runtime", filename: "src/js/qa-tools-runtime.js", code: qaToolsRuntimeScript },
  "world-tile-runtime": { id: "world-tile-runtime", filename: "src/js/world/tile-runtime.js", code: tileRuntimeScript },
  "world-procedural-runtime": { id: "world-procedural-runtime", filename: "src/js/world/procedural-runtime.js", code: worldProceduralRuntimeScript },
  "world-render-runtime": { id: "world-render-runtime", filename: "src/js/world/render-runtime.js", code: worldRenderRuntimeScript },
  "world-shared-assets-runtime": { id: "world-shared-assets-runtime", filename: "src/js/world/shared-assets-runtime.js", code: worldSharedAssetsRuntimeScript },
  "world-water-runtime": { id: "world-water-runtime", filename: "src/js/world/water-runtime.js", code: worldWaterRuntimeScript },
  "world-terrain-setup-runtime": { id: "world-terrain-setup-runtime", filename: "src/js/world/terrain-setup-runtime.js", code: worldTerrainSetupRuntimeScript },
  "world-logical-map-authoring-runtime": { id: "world-logical-map-authoring-runtime", filename: "src/js/world/logical-map-authoring-runtime.js", code: worldLogicalMapAuthoringRuntimeScript },
  "world-mining-quarry-runtime": { id: "world-mining-quarry-runtime", filename: "src/js/world/mining-quarry-runtime.js", code: worldMiningQuarryRuntimeScript },
  "world-pier-runtime": { id: "world-pier-runtime", filename: "src/js/world/pier-runtime.js", code: worldPierRuntimeScript },
  "world-chunk-terrain-runtime": { id: "world-chunk-terrain-runtime", filename: "src/js/world/chunk-terrain-runtime.js", code: worldChunkTerrainRuntimeScript },
  "world-chunk-tier-render-runtime": { id: "world-chunk-tier-render-runtime", filename: "src/js/world/chunk-tier-render-runtime.js", code: worldChunkTierRenderRuntimeScript },
  "world-ground-item-render-runtime": { id: "world-ground-item-render-runtime", filename: "src/js/world/ground-item-render-runtime.js", code: worldGroundItemRenderRuntimeScript },
  "world-ground-item-lifecycle-runtime": { id: "world-ground-item-lifecycle-runtime", filename: "src/js/world/ground-item-lifecycle-runtime.js", code: worldGroundItemLifecycleRuntimeScript },
  "world-npc-render-runtime": { id: "world-npc-render-runtime", filename: "src/js/world/npc-render-runtime.js", code: worldNpcRenderRuntimeScript },
  "world-structure-render-runtime": { id: "world-structure-render-runtime", filename: "src/js/world/structure-render-runtime.js", code: worldStructureRenderRuntimeScript },
  "world-tree-node-runtime": { id: "world-tree-node-runtime", filename: "src/js/world/tree-node-runtime.js", code: worldTreeNodeRuntimeScript },
  "world-tree-render-runtime": { id: "world-tree-render-runtime", filename: "src/js/world/tree-render-runtime.js", code: worldTreeRenderRuntimeScript },
  "world-tree-lifecycle-runtime": { id: "world-tree-lifecycle-runtime", filename: "src/js/world/tree-lifecycle-runtime.js", code: worldTreeLifecycleRuntimeScript },
  "world-rock-node-runtime": { id: "world-rock-node-runtime", filename: "src/js/world/rock-node-runtime.js", code: worldRockNodeRuntimeScript },
  "world-rock-render-runtime": { id: "world-rock-render-runtime", filename: "src/js/world/rock-render-runtime.js", code: worldRockRenderRuntimeScript },
  "world-rock-lifecycle-runtime": { id: "world-rock-lifecycle-runtime", filename: "src/js/world/rock-lifecycle-runtime.js", code: worldRockLifecycleRuntimeScript },
  "world-chunk-resource-render-runtime": { id: "world-chunk-resource-render-runtime", filename: "src/js/world/chunk-resource-render-runtime.js", code: worldChunkResourceRenderRuntimeScript },
  "world-mining-pose-reference-runtime": { id: "world-mining-pose-reference-runtime", filename: "src/js/world/mining-pose-reference-runtime.js", code: worldMiningPoseReferenceRuntimeScript },
  "world-town-npc-runtime": { id: "world-town-npc-runtime", filename: "src/js/world/town-npc-runtime.js", code: worldTownNpcRuntimeScript },
  "world-fire-render-runtime": { id: "world-fire-render-runtime", filename: "src/js/world/fire-render-runtime.js", code: worldFireRenderRuntimeScript },
  "world-fire-lifecycle-runtime": { id: "world-fire-lifecycle-runtime", filename: "src/js/world/fire-lifecycle-runtime.js", code: worldFireLifecycleRuntimeScript },
  "world-scene-state": { id: "world-scene-state", filename: "src/js/world/scene-state.js", code: worldSceneStateScript },
  "world-scene-lifecycle": { id: "world-scene-lifecycle", filename: "src/js/world/scene-lifecycle.js", code: worldSceneLifecycleScript },
  "world-chunk-scene-runtime": { id: "world-chunk-scene-runtime", filename: "src/js/world/chunk-scene-runtime.js", code: worldChunkSceneRuntimeScript },
  "world-map-hud-runtime": { id: "world-map-hud-runtime", filename: "src/js/world/map-hud-runtime.js", code: worldMapHudRuntimeScript },
  "world-training-location-runtime": { id: "world-training-location-runtime", filename: "src/js/world/training-location-runtime.js", code: worldTrainingLocationRuntimeScript },
  "world-status-hud-runtime": { id: "world-status-hud-runtime", filename: "src/js/world/status-hud-runtime.js", code: worldStatusHudRuntimeScript },
  "world": { id: "world", filename: "src/js/world.js", code: worldScript }
};
