import itemCatalogScript from "../../js/content/item-catalog.js?raw";
import iconReviewCatalogScript from "../../js/content/icon-review-catalog.js?raw";
import playerAppearanceCatalogScript from "../../js/content/player-appearance-catalog.js?raw";
import examineCatalogScript from "../../js/content/examine-catalog.js?raw";
import npcDialogueCatalogScript from "../../js/content/npc-dialogue-catalog.js?raw";
import questCatalogScript from "../../js/content/quest-catalog.js?raw";
import questRuntimeScript from "../../js/quest-runtime.js?raw";
import questLogRuntimeScript from "../../js/quest-log-runtime.js?raw";
import npcDialogueRuntimeScript from "../../js/npc-dialogue-runtime.js?raw";
import combatQaDebugRuntimeScript from "../../js/combat-qa-debug-runtime.js?raw";
import combatAnimationDebugPanelRuntimeScript from "../../js/combat-animation-debug-panel-runtime.js?raw";
import combatEnemyMovementRuntimeScript from "../../js/combat-enemy-movement-runtime.js?raw";
import combatEnemyRenderRuntimeScript from "../../js/combat-enemy-render-runtime.js?raw";
import combatEnemyOverlayRuntimeScript from "../../js/combat-enemy-overlay-runtime.js?raw";
import qaCommandRuntimeScript from "../../js/qa-command-runtime.js?raw";
import qaToolsRuntimeScript from "../../js/qa-tools-runtime.js?raw";
import tileRuntimeScript from "../../js/world/tile-runtime.js?raw";
import worldProceduralRuntimeScript from "../../js/world/procedural-runtime.js?raw";
import worldRenderRuntimeScript from "../../js/world/render-runtime.js?raw";
import worldSharedAssetsRuntimeScript from "../../js/world/shared-assets-runtime.js?raw";
import worldWaterRuntimeScript from "../../js/world/water-runtime.js?raw";
import worldTerrainSetupRuntimeScript from "../../js/world/terrain-setup-runtime.js?raw";
import worldLogicalMapAuthoringRuntimeScript from "../../js/world/logical-map-authoring-runtime.js?raw";
import worldMiningQuarryRuntimeScript from "../../js/world/mining-quarry-runtime.js?raw";
import worldPierRuntimeScript from "../../js/world/pier-runtime.js?raw";
import worldChunkTerrainRuntimeScript from "../../js/world/chunk-terrain-runtime.js?raw";
import worldChunkTierRenderRuntimeScript from "../../js/world/chunk-tier-render-runtime.js?raw";
import worldGroundItemRenderRuntimeScript from "../../js/world/ground-item-render-runtime.js?raw";
import worldGroundItemLifecycleRuntimeScript from "../../js/world/ground-item-lifecycle-runtime.js?raw";
import worldNpcRenderRuntimeScript from "../../js/world/npc-render-runtime.js?raw";
import worldStructureRenderRuntimeScript from "../../js/world/structure-render-runtime.js?raw";
import worldTreeNodeRuntimeScript from "../../js/world/tree-node-runtime.js?raw";
import worldTreeRenderRuntimeScript from "../../js/world/tree-render-runtime.js?raw";
import worldTreeLifecycleRuntimeScript from "../../js/world/tree-lifecycle-runtime.js?raw";
import worldRockNodeRuntimeScript from "../../js/world/rock-node-runtime.js?raw";
import worldRockRenderRuntimeScript from "../../js/world/rock-render-runtime.js?raw";
import worldRockLifecycleRuntimeScript from "../../js/world/rock-lifecycle-runtime.js?raw";
import worldChunkResourceRenderRuntimeScript from "../../js/world/chunk-resource-render-runtime.js?raw";
import worldMiningPoseReferenceRuntimeScript from "../../js/world/mining-pose-reference-runtime.js?raw";
import worldTownNpcRuntimeScript from "../../js/world/town-npc-runtime.js?raw";
import worldFireRenderRuntimeScript from "../../js/world/fire-render-runtime.js?raw";
import worldFireLifecycleRuntimeScript from "../../js/world/fire-lifecycle-runtime.js?raw";
import worldSceneStateScript from "../../js/world/scene-state.js?raw";
import worldSceneLifecycleScript from "../../js/world/scene-lifecycle.js?raw";
import worldChunkSceneRuntimeScript from "../../js/world/chunk-scene-runtime.js?raw";
import worldMapHudRuntimeScript from "../../js/world/map-hud-runtime.js?raw";
import worldTrainingLocationRuntimeScript from "../../js/world/training-location-runtime.js?raw";
import worldStatusHudRuntimeScript from "../../js/world/status-hud-runtime.js?raw";
import skillProgressRuntimeScript from "../../js/skill-progress-runtime.js?raw";
import skillPanelRuntimeScript from "../../js/skill-panel-runtime.js?raw";
import skillPanelRenderRuntimeScript from "../../js/skill-panel-render-runtime.js?raw";
import inventoryItemRuntimeScript from "../../js/inventory-item-runtime.js?raw";
import equipmentItemRuntimeScript from "../../js/equipment-item-runtime.js?raw";
import foodItemRuntimeScript from "../../js/food-item-runtime.js?raw";
import inventoryActionRuntimeScript from "../../js/inventory-action-runtime.js?raw";
import inventoryTooltipRuntimeScript from "../../js/inventory-tooltip-runtime.js?raw";
import contextMenuRuntimeScript from "../../js/context-menu-runtime.js?raw";
import coreChatRuntimeScript from "../../js/core-chat-runtime.js?raw";
import corePlayerEntryRuntimeScript from "../../js/core-player-entry-runtime.js?raw";
import coreTutorialRuntimeScript from "../../js/core-tutorial-runtime.js?raw";
import coreScript from "../../js/core.js?raw";
import skillSpecsScript from "../../js/skills/specs.js?raw";
import skillSpecRegistryScript from "../../js/skills/spec-registry.js?raw";
import shopEconomyScript from "../../js/shop-economy.js?raw";
import skillManifestScript from "../../js/skills/manifest.js?raw";
import skillRuntimeScript from "../../js/skills/runtime.js?raw";
import targetInteractionRegistryScript from "../../js/interactions/target-interaction-registry.js?raw";
import skillSharedUtilsScript from "../../js/skills/shared/utils.js?raw";
import skillActionResolutionScript from "../../js/skills/shared/action-resolution.js?raw";
import runecraftingConstantsScript from "../../js/skills/runecrafting/constants.js?raw";
import miningSkillScript from "../../js/skills/mining/index.js?raw";
import woodcuttingSkillScript from "../../js/skills/woodcutting/index.js?raw";
import fishingSkillScript from "../../js/skills/fishing/index.js?raw";
import firemakingSkillScript from "../../js/skills/firemaking/index.js?raw";
import cookingSkillScript from "../../js/skills/cooking/index.js?raw";
import craftingSkillScript from "../../js/skills/crafting/index.js?raw";
import fletchingSkillScript from "../../js/skills/fletching/index.js?raw";
import runecraftingSkillScript from "../../js/skills/runecrafting/index.js?raw";
import smithingSkillScript from "../../js/skills/smithing/index.js?raw";
import skillsRegisterScript from "../../js/skills/register.js?raw";
import playerModelVisualRuntimeScript from "../../js/player-model-visual-runtime.js?raw";
import playerNpcHumanoidRuntimeScript from "../../js/player-npc-humanoid-runtime.js?raw";
import playerHeldItemRuntimeScript from "../../js/player-held-item-runtime.js?raw";
import playerModelScript from "../../js/player-model.js?raw";
import inventoryScript from "../../js/inventory.js?raw";
import playerHitpointsRuntimeScript from "../../js/player-hitpoints-runtime.js?raw";
import humanoidModelRuntimeScript from "../../js/humanoid-model-runtime.js?raw";
import transientVisualRuntimeScript from "../../js/transient-visual-runtime.js?raw";
import worldScript from "../../js/world.js?raw";
import combatScript from "../../js/combat.js?raw";
import inputQaCameraRuntimeScript from "../../js/input-qa-camera-runtime.js?raw";
import inputHoverTooltipRuntimeScript from "../../js/input-hover-tooltip-runtime.js?raw";
import inputStationInteractionRuntimeScript from "../../js/input-station-interaction-runtime.js?raw";
import inputPoseEditorRuntimeScript from "../../js/input-pose-editor-runtime.js?raw";
import inputPlayerAnimationRuntimeScript from "../../js/input-player-animation-runtime.js?raw";
import inputPathfindingRuntimeScript from "../../js/input-pathfinding-runtime.js?raw";
import inputPierInteractionRuntimeScript from "../../js/input-pier-interaction-runtime.js?raw";
import inputRaycastRuntimeScript from "../../js/input-raycast-runtime.js?raw";
import inputTickMovementRuntimeScript from "../../js/input-tick-movement-runtime.js?raw";
import inputArrivalInteractionRuntimeScript from "../../js/input-arrival-interaction-runtime.js?raw";
import inputActionQueueRuntimeScript from "../../js/input-action-queue-runtime.js?raw";
import inputTargetInteractionRuntimeScript from "../../js/input-target-interaction-runtime.js?raw";
import inputRenderScript from "../../js/input-render.js?raw";

export interface LegacyScriptEntry {
  id: string;
  filename: string;
  code: string;
}

export const legacyScriptManifest: ReadonlyArray<LegacyScriptEntry> = [
  { id: "item-catalog", filename: "src/js/content/item-catalog.js", code: itemCatalogScript },
  { id: "icon-review-catalog", filename: "src/js/content/icon-review-catalog.js", code: iconReviewCatalogScript },
  { id: "player-appearance-catalog", filename: "src/js/content/player-appearance-catalog.js", code: playerAppearanceCatalogScript },
  { id: "examine-catalog", filename: "src/js/content/examine-catalog.js", code: examineCatalogScript },
  { id: "npc-dialogue-catalog", filename: "src/js/content/npc-dialogue-catalog.js", code: npcDialogueCatalogScript },
  { id: "quest-catalog", filename: "src/js/content/quest-catalog.js", code: questCatalogScript },
  { id: "quest-runtime", filename: "src/js/quest-runtime.js", code: questRuntimeScript },
  { id: "quest-log-runtime", filename: "src/js/quest-log-runtime.js", code: questLogRuntimeScript },
  { id: "npc-dialogue-runtime", filename: "src/js/npc-dialogue-runtime.js", code: npcDialogueRuntimeScript },
  { id: "combat-qa-debug-runtime", filename: "src/js/combat-qa-debug-runtime.js", code: combatQaDebugRuntimeScript },
  { id: "combat-animation-debug-panel-runtime", filename: "src/js/combat-animation-debug-panel-runtime.js", code: combatAnimationDebugPanelRuntimeScript },
  { id: "combat-enemy-movement-runtime", filename: "src/js/combat-enemy-movement-runtime.js", code: combatEnemyMovementRuntimeScript },
  { id: "combat-enemy-render-runtime", filename: "src/js/combat-enemy-render-runtime.js", code: combatEnemyRenderRuntimeScript },
  { id: "combat-enemy-overlay-runtime", filename: "src/js/combat-enemy-overlay-runtime.js", code: combatEnemyOverlayRuntimeScript },
  { id: "qa-command-runtime", filename: "src/js/qa-command-runtime.js", code: qaCommandRuntimeScript },
  { id: "qa-tools-runtime", filename: "src/js/qa-tools-runtime.js", code: qaToolsRuntimeScript },
  { id: "world-tile-runtime", filename: "src/js/world/tile-runtime.js", code: tileRuntimeScript },
  { id: "world-procedural-runtime", filename: "src/js/world/procedural-runtime.js", code: worldProceduralRuntimeScript },
  { id: "world-render-runtime", filename: "src/js/world/render-runtime.js", code: worldRenderRuntimeScript },
  { id: "world-shared-assets-runtime", filename: "src/js/world/shared-assets-runtime.js", code: worldSharedAssetsRuntimeScript },
  { id: "world-water-runtime", filename: "src/js/world/water-runtime.js", code: worldWaterRuntimeScript },
  { id: "world-terrain-setup-runtime", filename: "src/js/world/terrain-setup-runtime.js", code: worldTerrainSetupRuntimeScript },
  { id: "world-logical-map-authoring-runtime", filename: "src/js/world/logical-map-authoring-runtime.js", code: worldLogicalMapAuthoringRuntimeScript },
  { id: "world-mining-quarry-runtime", filename: "src/js/world/mining-quarry-runtime.js", code: worldMiningQuarryRuntimeScript },
  { id: "world-pier-runtime", filename: "src/js/world/pier-runtime.js", code: worldPierRuntimeScript },
  { id: "world-chunk-terrain-runtime", filename: "src/js/world/chunk-terrain-runtime.js", code: worldChunkTerrainRuntimeScript },
  { id: "world-chunk-tier-render-runtime", filename: "src/js/world/chunk-tier-render-runtime.js", code: worldChunkTierRenderRuntimeScript },
  { id: "world-ground-item-render-runtime", filename: "src/js/world/ground-item-render-runtime.js", code: worldGroundItemRenderRuntimeScript },
  { id: "world-ground-item-lifecycle-runtime", filename: "src/js/world/ground-item-lifecycle-runtime.js", code: worldGroundItemLifecycleRuntimeScript },
  { id: "world-npc-render-runtime", filename: "src/js/world/npc-render-runtime.js", code: worldNpcRenderRuntimeScript },
  { id: "world-structure-render-runtime", filename: "src/js/world/structure-render-runtime.js", code: worldStructureRenderRuntimeScript },
  { id: "world-tree-node-runtime", filename: "src/js/world/tree-node-runtime.js", code: worldTreeNodeRuntimeScript },
  { id: "world-tree-render-runtime", filename: "src/js/world/tree-render-runtime.js", code: worldTreeRenderRuntimeScript },
  { id: "world-tree-lifecycle-runtime", filename: "src/js/world/tree-lifecycle-runtime.js", code: worldTreeLifecycleRuntimeScript },
  { id: "world-rock-node-runtime", filename: "src/js/world/rock-node-runtime.js", code: worldRockNodeRuntimeScript },
  { id: "world-rock-render-runtime", filename: "src/js/world/rock-render-runtime.js", code: worldRockRenderRuntimeScript },
  { id: "world-rock-lifecycle-runtime", filename: "src/js/world/rock-lifecycle-runtime.js", code: worldRockLifecycleRuntimeScript },
  { id: "world-chunk-resource-render-runtime", filename: "src/js/world/chunk-resource-render-runtime.js", code: worldChunkResourceRenderRuntimeScript },
  { id: "world-mining-pose-reference-runtime", filename: "src/js/world/mining-pose-reference-runtime.js", code: worldMiningPoseReferenceRuntimeScript },
  { id: "world-town-npc-runtime", filename: "src/js/world/town-npc-runtime.js", code: worldTownNpcRuntimeScript },
  { id: "world-fire-render-runtime", filename: "src/js/world/fire-render-runtime.js", code: worldFireRenderRuntimeScript },
  { id: "world-fire-lifecycle-runtime", filename: "src/js/world/fire-lifecycle-runtime.js", code: worldFireLifecycleRuntimeScript },
  { id: "world-scene-state", filename: "src/js/world/scene-state.js", code: worldSceneStateScript },
  { id: "world-scene-lifecycle", filename: "src/js/world/scene-lifecycle.js", code: worldSceneLifecycleScript },
  { id: "world-chunk-scene-runtime", filename: "src/js/world/chunk-scene-runtime.js", code: worldChunkSceneRuntimeScript },
  { id: "world-map-hud-runtime", filename: "src/js/world/map-hud-runtime.js", code: worldMapHudRuntimeScript },
  { id: "world-training-location-runtime", filename: "src/js/world/training-location-runtime.js", code: worldTrainingLocationRuntimeScript },
  { id: "world-status-hud-runtime", filename: "src/js/world/status-hud-runtime.js", code: worldStatusHudRuntimeScript },
  { id: "skill-progress-runtime", filename: "src/js/skill-progress-runtime.js", code: skillProgressRuntimeScript },
  { id: "skill-panel-runtime", filename: "src/js/skill-panel-runtime.js", code: skillPanelRuntimeScript },
  { id: "skill-panel-render-runtime", filename: "src/js/skill-panel-render-runtime.js", code: skillPanelRenderRuntimeScript },
  { id: "inventory-item-runtime", filename: "src/js/inventory-item-runtime.js", code: inventoryItemRuntimeScript },
  { id: "equipment-item-runtime", filename: "src/js/equipment-item-runtime.js", code: equipmentItemRuntimeScript },
  { id: "food-item-runtime", filename: "src/js/food-item-runtime.js", code: foodItemRuntimeScript },
  { id: "inventory-action-runtime", filename: "src/js/inventory-action-runtime.js", code: inventoryActionRuntimeScript },
  { id: "inventory-tooltip-runtime", filename: "src/js/inventory-tooltip-runtime.js", code: inventoryTooltipRuntimeScript },
  { id: "context-menu-runtime", filename: "src/js/context-menu-runtime.js", code: contextMenuRuntimeScript },
  { id: "core-chat-runtime", filename: "src/js/core-chat-runtime.js", code: coreChatRuntimeScript },
  { id: "core-player-entry-runtime", filename: "src/js/core-player-entry-runtime.js", code: corePlayerEntryRuntimeScript },
  { id: "core-tutorial-runtime", filename: "src/js/core-tutorial-runtime.js", code: coreTutorialRuntimeScript },
  { id: "core", filename: "src/js/core.js", code: coreScript },
  { id: "skills-specs", filename: "src/js/skills/specs.js", code: skillSpecsScript },
  { id: "skills-spec-registry", filename: "src/js/skills/spec-registry.js", code: skillSpecRegistryScript },
  { id: "shop-economy", filename: "src/js/shop-economy.js", code: shopEconomyScript },
  { id: "skills-manifest", filename: "src/js/skills/manifest.js", code: skillManifestScript },
  { id: "skills-runtime", filename: "src/js/skills/runtime.js", code: skillRuntimeScript },
  { id: "target-interaction-registry", filename: "src/js/interactions/target-interaction-registry.js", code: targetInteractionRegistryScript },
  { id: "skills-shared-utils", filename: "src/js/skills/shared/utils.js", code: skillSharedUtilsScript },
  { id: "skills-shared-action-resolution", filename: "src/js/skills/shared/action-resolution.js", code: skillActionResolutionScript },
  { id: "runecrafting-constants", filename: "src/js/skills/runecrafting/constants.js", code: runecraftingConstantsScript },
  { id: "skills-mining", filename: "src/js/skills/mining/index.js", code: miningSkillScript },
  { id: "skills-woodcutting", filename: "src/js/skills/woodcutting/index.js", code: woodcuttingSkillScript },
  { id: "skills-fishing", filename: "src/js/skills/fishing/index.js", code: fishingSkillScript },
  { id: "skills-firemaking", filename: "src/js/skills/firemaking/index.js", code: firemakingSkillScript },
  { id: "skills-cooking", filename: "src/js/skills/cooking/index.js", code: cookingSkillScript },
  { id: "skills-crafting", filename: "src/js/skills/crafting/index.js", code: craftingSkillScript },
  { id: "skills-fletching", filename: "src/js/skills/fletching/index.js", code: fletchingSkillScript },
  { id: "skills-runecrafting", filename: "src/js/skills/runecrafting/index.js", code: runecraftingSkillScript },
  { id: "skills-smithing", filename: "src/js/skills/smithing/index.js", code: smithingSkillScript },
  { id: "skills-register", filename: "src/js/skills/register.js", code: skillsRegisterScript },
  { id: "player-model-visual-runtime", filename: "src/js/player-model-visual-runtime.js", code: playerModelVisualRuntimeScript },
  { id: "player-npc-humanoid-runtime", filename: "src/js/player-npc-humanoid-runtime.js", code: playerNpcHumanoidRuntimeScript },
  { id: "player-held-item-runtime", filename: "src/js/player-held-item-runtime.js", code: playerHeldItemRuntimeScript },
  { id: "player-model", filename: "src/js/player-model.js", code: playerModelScript },
  { id: "inventory", filename: "src/js/inventory.js", code: inventoryScript },
  { id: "player-hitpoints-runtime", filename: "src/js/player-hitpoints-runtime.js", code: playerHitpointsRuntimeScript },
  { id: "humanoid-model-runtime", filename: "src/js/humanoid-model-runtime.js", code: humanoidModelRuntimeScript },
  { id: "transient-visual-runtime", filename: "src/js/transient-visual-runtime.js", code: transientVisualRuntimeScript },
  { id: "world", filename: "src/js/world.js", code: worldScript },
  { id: "combat", filename: "src/js/combat.js", code: combatScript },
  { id: "input-qa-camera-runtime", filename: "src/js/input-qa-camera-runtime.js", code: inputQaCameraRuntimeScript },
  { id: "input-hover-tooltip-runtime", filename: "src/js/input-hover-tooltip-runtime.js", code: inputHoverTooltipRuntimeScript },
  { id: "input-station-interaction-runtime", filename: "src/js/input-station-interaction-runtime.js", code: inputStationInteractionRuntimeScript },
  { id: "input-pose-editor-runtime", filename: "src/js/input-pose-editor-runtime.js", code: inputPoseEditorRuntimeScript },
  { id: "input-player-animation-runtime", filename: "src/js/input-player-animation-runtime.js", code: inputPlayerAnimationRuntimeScript },
  { id: "input-pathfinding-runtime", filename: "src/js/input-pathfinding-runtime.js", code: inputPathfindingRuntimeScript },
  { id: "input-pier-interaction-runtime", filename: "src/js/input-pier-interaction-runtime.js", code: inputPierInteractionRuntimeScript },
  { id: "input-raycast-runtime", filename: "src/js/input-raycast-runtime.js", code: inputRaycastRuntimeScript },
  { id: "input-tick-movement-runtime", filename: "src/js/input-tick-movement-runtime.js", code: inputTickMovementRuntimeScript },
  { id: "input-arrival-interaction-runtime", filename: "src/js/input-arrival-interaction-runtime.js", code: inputArrivalInteractionRuntimeScript },
  { id: "input-action-queue-runtime", filename: "src/js/input-action-queue-runtime.js", code: inputActionQueueRuntimeScript },
  { id: "input-target-interaction-runtime", filename: "src/js/input-target-interaction-runtime.js", code: inputTargetInteractionRuntimeScript },
  { id: "input-render", filename: "src/js/input-render.js", code: inputRenderScript }
];
