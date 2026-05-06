import type { LegacyScriptEntry } from "./legacy-script-entry";
import { combatLegacyScriptsById } from "./legacy-scripts/combat";
import { contentLegacyScriptsById } from "./legacy-scripts/content";
import { inputLegacyScriptsById } from "./legacy-scripts/input";
import { playerLegacyScriptsById } from "./legacy-scripts/player";
import { questLegacyScriptsById } from "./legacy-scripts/quest";
import { skillsLegacyScriptsById } from "./legacy-scripts/skills";
import { worldLegacyScriptsById } from "./legacy-scripts/world";

interface LegacyScriptLoadOrderEntry {
  id: string;
  filename: string;
  rawPath: string;
  codeVariable: string;
}

export const legacyScriptLoadOrder: ReadonlyArray<LegacyScriptLoadOrderEntry> = [
  { id: "item-catalog", filename: "src/js/content/item-catalog.js", rawPath: "../../js/content/item-catalog.js?raw", codeVariable: "itemCatalogScript" },
  { id: "icon-review-catalog", filename: "src/js/content/icon-review-catalog.js", rawPath: "../../js/content/icon-review-catalog.js?raw", codeVariable: "iconReviewCatalogScript" },
  { id: "player-appearance-catalog", filename: "src/js/content/player-appearance-catalog.js", rawPath: "../../js/content/player-appearance-catalog.js?raw", codeVariable: "playerAppearanceCatalogScript" },
  { id: "npc-appearance-catalog", filename: "src/js/content/npc-appearance-catalog.js", rawPath: "../../js/content/npc-appearance-catalog.js?raw", codeVariable: "npcAppearanceCatalogScript" },
  { id: "examine-catalog", filename: "src/js/content/examine-catalog.js", rawPath: "../../js/content/examine-catalog.js?raw", codeVariable: "examineCatalogScript" },
  { id: "npc-dialogue-catalog", filename: "src/js/content/npc-dialogue-catalog.js", rawPath: "../../js/content/npc-dialogue-catalog.js?raw", codeVariable: "npcDialogueCatalogScript" },
  { id: "quest-catalog", filename: "src/js/content/quest-catalog.js", rawPath: "../../js/content/quest-catalog.js?raw", codeVariable: "questCatalogScript" },
  { id: "quest-runtime", filename: "src/js/quest-runtime.js", rawPath: "../../js/quest-runtime.js?raw", codeVariable: "questRuntimeScript" },
  { id: "quest-log-runtime", filename: "src/js/quest-log-runtime.js", rawPath: "../../js/quest-log-runtime.js?raw", codeVariable: "questLogRuntimeScript" },
  { id: "npc-dialogue-runtime", filename: "src/js/npc-dialogue-runtime.js", rawPath: "../../js/npc-dialogue-runtime.js?raw", codeVariable: "npcDialogueRuntimeScript" },
  { id: "combat-qa-debug-runtime", filename: "src/js/combat-qa-debug-runtime.js", rawPath: "../../js/combat-qa-debug-runtime.js?raw", codeVariable: "combatQaDebugRuntimeScript" },
  { id: "combat-animation-debug-panel-runtime", filename: "src/js/combat-animation-debug-panel-runtime.js", rawPath: "../../js/combat-animation-debug-panel-runtime.js?raw", codeVariable: "combatAnimationDebugPanelRuntimeScript" },
  { id: "combat-hud-runtime", filename: "src/js/combat-hud-runtime.js", rawPath: "../../js/combat-hud-runtime.js?raw", codeVariable: "combatHudRuntimeScript" },
  { id: "combat-engagement-runtime", filename: "src/js/combat-engagement-runtime.js", rawPath: "../../js/combat-engagement-runtime.js?raw", codeVariable: "combatEngagementRuntimeScript" },
  { id: "combat-facing-runtime", filename: "src/js/combat-facing-runtime.js", rawPath: "../../js/combat-facing-runtime.js?raw", codeVariable: "combatFacingRuntimeScript" },
  { id: "combat-loot-runtime", filename: "src/js/combat-loot-runtime.js", rawPath: "../../js/combat-loot-runtime.js?raw", codeVariable: "combatLootRuntimeScript" },
  { id: "combat-player-defeat-runtime", filename: "src/js/combat-player-defeat-runtime.js", rawPath: "../../js/combat-player-defeat-runtime.js?raw", codeVariable: "combatPlayerDefeatRuntimeScript" },
  { id: "combat-enemy-movement-runtime", filename: "src/js/combat-enemy-movement-runtime.js", rawPath: "../../js/combat-enemy-movement-runtime.js?raw", codeVariable: "combatEnemyMovementRuntimeScript" },
  { id: "combat-enemy-occupancy-runtime", filename: "src/js/combat-enemy-occupancy-runtime.js", rawPath: "../../js/combat-enemy-occupancy-runtime.js?raw", codeVariable: "combatEnemyOccupancyRuntimeScript" },
  { id: "combat-enemy-render-runtime", filename: "src/js/combat-enemy-render-runtime.js", rawPath: "../../js/combat-enemy-render-runtime.js?raw", codeVariable: "combatEnemyRenderRuntimeScript" },
  { id: "combat-enemy-overlay-runtime", filename: "src/js/combat-enemy-overlay-runtime.js", rawPath: "../../js/combat-enemy-overlay-runtime.js?raw", codeVariable: "combatEnemyOverlayRuntimeScript" },
  { id: "qa-command-runtime", filename: "src/js/qa-command-runtime.js", rawPath: "../../js/qa-command-runtime.js?raw", codeVariable: "qaCommandRuntimeScript" },
  { id: "qa-tools-runtime", filename: "src/js/qa-tools-runtime.js", rawPath: "../../js/qa-tools-runtime.js?raw", codeVariable: "qaToolsRuntimeScript" },
  { id: "world-tile-runtime", filename: "src/js/world/tile-runtime.js", rawPath: "../../js/world/tile-runtime.js?raw", codeVariable: "tileRuntimeScript" },
  { id: "world-procedural-runtime", filename: "src/js/world/procedural-runtime.js", rawPath: "../../js/world/procedural-runtime.js?raw", codeVariable: "worldProceduralRuntimeScript" },
  { id: "world-render-runtime", filename: "src/js/world/render-runtime.js", rawPath: "../../js/world/render-runtime.js?raw", codeVariable: "worldRenderRuntimeScript" },
  { id: "world-shared-assets-runtime", filename: "src/js/world/shared-assets-runtime.js", rawPath: "../../js/world/shared-assets-runtime.js?raw", codeVariable: "worldSharedAssetsRuntimeScript" },
  { id: "world-water-runtime", filename: "src/js/world/water-runtime.js", rawPath: "../../js/world/water-runtime.js?raw", codeVariable: "worldWaterRuntimeScript" },
  { id: "world-terrain-setup-runtime", filename: "src/js/world/terrain-setup-runtime.js", rawPath: "../../js/world/terrain-setup-runtime.js?raw", codeVariable: "worldTerrainSetupRuntimeScript" },
  { id: "world-logical-map-authoring-runtime", filename: "src/js/world/logical-map-authoring-runtime.js", rawPath: "../../js/world/logical-map-authoring-runtime.js?raw", codeVariable: "worldLogicalMapAuthoringRuntimeScript" },
  { id: "world-mining-quarry-runtime", filename: "src/js/world/mining-quarry-runtime.js", rawPath: "../../js/world/mining-quarry-runtime.js?raw", codeVariable: "worldMiningQuarryRuntimeScript" },
  { id: "world-pier-runtime", filename: "src/js/world/pier-runtime.js", rawPath: "../../js/world/pier-runtime.js?raw", codeVariable: "worldPierRuntimeScript" },
  { id: "world-chunk-terrain-runtime", filename: "src/js/world/chunk-terrain-runtime.js", rawPath: "../../js/world/chunk-terrain-runtime.js?raw", codeVariable: "worldChunkTerrainRuntimeScript" },
  { id: "world-chunk-tier-render-runtime", filename: "src/js/world/chunk-tier-render-runtime.js", rawPath: "../../js/world/chunk-tier-render-runtime.js?raw", codeVariable: "worldChunkTierRenderRuntimeScript" },
  { id: "world-ground-item-render-runtime", filename: "src/js/world/ground-item-render-runtime.js", rawPath: "../../js/world/ground-item-render-runtime.js?raw", codeVariable: "worldGroundItemRenderRuntimeScript" },
  { id: "world-ground-item-lifecycle-runtime", filename: "src/js/world/ground-item-lifecycle-runtime.js", rawPath: "../../js/world/ground-item-lifecycle-runtime.js?raw", codeVariable: "worldGroundItemLifecycleRuntimeScript" },
  { id: "world-npc-render-runtime", filename: "src/js/world/npc-render-runtime.js", rawPath: "../../js/world/npc-render-runtime.js?raw", codeVariable: "worldNpcRenderRuntimeScript" },
  { id: "world-structure-render-runtime", filename: "src/js/world/structure-render-runtime.js", rawPath: "../../js/world/structure-render-runtime.js?raw", codeVariable: "worldStructureRenderRuntimeScript" },
  { id: "world-tree-node-runtime", filename: "src/js/world/tree-node-runtime.js", rawPath: "../../js/world/tree-node-runtime.js?raw", codeVariable: "worldTreeNodeRuntimeScript" },
  { id: "world-tree-render-runtime", filename: "src/js/world/tree-render-runtime.js", rawPath: "../../js/world/tree-render-runtime.js?raw", codeVariable: "worldTreeRenderRuntimeScript" },
  { id: "world-tree-lifecycle-runtime", filename: "src/js/world/tree-lifecycle-runtime.js", rawPath: "../../js/world/tree-lifecycle-runtime.js?raw", codeVariable: "worldTreeLifecycleRuntimeScript" },
  { id: "world-rock-node-runtime", filename: "src/js/world/rock-node-runtime.js", rawPath: "../../js/world/rock-node-runtime.js?raw", codeVariable: "worldRockNodeRuntimeScript" },
  { id: "world-rock-render-runtime", filename: "src/js/world/rock-render-runtime.js", rawPath: "../../js/world/rock-render-runtime.js?raw", codeVariable: "worldRockRenderRuntimeScript" },
  { id: "world-rock-lifecycle-runtime", filename: "src/js/world/rock-lifecycle-runtime.js", rawPath: "../../js/world/rock-lifecycle-runtime.js?raw", codeVariable: "worldRockLifecycleRuntimeScript" },
  { id: "world-chunk-resource-render-runtime", filename: "src/js/world/chunk-resource-render-runtime.js", rawPath: "../../js/world/chunk-resource-render-runtime.js?raw", codeVariable: "worldChunkResourceRenderRuntimeScript" },
  { id: "world-mining-pose-reference-runtime", filename: "src/js/world/mining-pose-reference-runtime.js", rawPath: "../../js/world/mining-pose-reference-runtime.js?raw", codeVariable: "worldMiningPoseReferenceRuntimeScript" },
  { id: "world-town-npc-runtime", filename: "src/js/world/town-npc-runtime.js", rawPath: "../../js/world/town-npc-runtime.js?raw", codeVariable: "worldTownNpcRuntimeScript" },
  { id: "world-fire-render-runtime", filename: "src/js/world/fire-render-runtime.js", rawPath: "../../js/world/fire-render-runtime.js?raw", codeVariable: "worldFireRenderRuntimeScript" },
  { id: "world-fire-lifecycle-runtime", filename: "src/js/world/fire-lifecycle-runtime.js", rawPath: "../../js/world/fire-lifecycle-runtime.js?raw", codeVariable: "worldFireLifecycleRuntimeScript" },
  { id: "world-scene-state", filename: "src/js/world/scene-state.js", rawPath: "../../js/world/scene-state.js?raw", codeVariable: "worldSceneStateScript" },
  { id: "world-scene-lifecycle", filename: "src/js/world/scene-lifecycle.js", rawPath: "../../js/world/scene-lifecycle.js?raw", codeVariable: "worldSceneLifecycleScript" },
  { id: "world-chunk-scene-runtime", filename: "src/js/world/chunk-scene-runtime.js", rawPath: "../../js/world/chunk-scene-runtime.js?raw", codeVariable: "worldChunkSceneRuntimeScript" },
  { id: "world-map-hud-runtime", filename: "src/js/world/map-hud-runtime.js", rawPath: "../../js/world/map-hud-runtime.js?raw", codeVariable: "worldMapHudRuntimeScript" },
  { id: "world-training-location-runtime", filename: "src/js/world/training-location-runtime.js", rawPath: "../../js/world/training-location-runtime.js?raw", codeVariable: "worldTrainingLocationRuntimeScript" },
  { id: "world-status-hud-runtime", filename: "src/js/world/status-hud-runtime.js", rawPath: "../../js/world/status-hud-runtime.js?raw", codeVariable: "worldStatusHudRuntimeScript" },
  { id: "skill-progress-runtime", filename: "src/js/skill-progress-runtime.js", rawPath: "../../js/skill-progress-runtime.js?raw", codeVariable: "skillProgressRuntimeScript" },
  { id: "skill-panel-runtime", filename: "src/js/skill-panel-runtime.js", rawPath: "../../js/skill-panel-runtime.js?raw", codeVariable: "skillPanelRuntimeScript" },
  { id: "skill-panel-render-runtime", filename: "src/js/skill-panel-render-runtime.js", rawPath: "../../js/skill-panel-render-runtime.js?raw", codeVariable: "skillPanelRenderRuntimeScript" },
  { id: "inventory-item-runtime", filename: "src/js/inventory-item-runtime.js", rawPath: "../../js/inventory-item-runtime.js?raw", codeVariable: "inventoryItemRuntimeScript" },
  { id: "equipment-item-runtime", filename: "src/js/equipment-item-runtime.js", rawPath: "../../js/equipment-item-runtime.js?raw", codeVariable: "equipmentItemRuntimeScript" },
  { id: "food-item-runtime", filename: "src/js/food-item-runtime.js", rawPath: "../../js/food-item-runtime.js?raw", codeVariable: "foodItemRuntimeScript" },
  { id: "inventory-action-runtime", filename: "src/js/inventory-action-runtime.js", rawPath: "../../js/inventory-action-runtime.js?raw", codeVariable: "inventoryActionRuntimeScript" },
  { id: "inventory-tooltip-runtime", filename: "src/js/inventory-tooltip-runtime.js", rawPath: "../../js/inventory-tooltip-runtime.js?raw", codeVariable: "inventoryTooltipRuntimeScript" },
  { id: "inventory-bank-session-runtime", filename: "src/js/inventory-bank-session-runtime.js", rawPath: "../../js/inventory-bank-session-runtime.js?raw", codeVariable: "inventoryBankSessionRuntimeScript" },
  { id: "inventory-shop-session-runtime", filename: "src/js/inventory-shop-session-runtime.js", rawPath: "../../js/inventory-shop-session-runtime.js?raw", codeVariable: "inventoryShopSessionRuntimeScript" },
  { id: "context-menu-runtime", filename: "src/js/context-menu-runtime.js", rawPath: "../../js/context-menu-runtime.js?raw", codeVariable: "contextMenuRuntimeScript" },
  { id: "core-chat-runtime", filename: "src/js/core-chat-runtime.js", rawPath: "../../js/core-chat-runtime.js?raw", codeVariable: "coreChatRuntimeScript" },
  { id: "core-player-entry-runtime", filename: "src/js/core-player-entry-runtime.js", rawPath: "../../js/core-player-entry-runtime.js?raw", codeVariable: "corePlayerEntryRuntimeScript" },
  { id: "core-tutorial-runtime", filename: "src/js/core-tutorial-runtime.js", rawPath: "../../js/core-tutorial-runtime.js?raw", codeVariable: "coreTutorialRuntimeScript" },
  { id: "core-progress-runtime", filename: "src/js/core-progress-runtime.js", rawPath: "../../js/core-progress-runtime.js?raw", codeVariable: "coreProgressRuntimeScript" },
  { id: "core-icon-review-runtime", filename: "src/js/core-icon-review-runtime.js", rawPath: "../../js/core-icon-review-runtime.js?raw", codeVariable: "coreIconReviewRuntimeScript" },
  { id: "core", filename: "src/js/core.js", rawPath: "../../js/core.js?raw", codeVariable: "coreScript" },
  { id: "skills-specs-shared", filename: "src/js/skills/specs/shared.js", rawPath: "../../js/skills/specs/shared.js?raw", codeVariable: "skillSpecsSharedScript" },
  { id: "skills-specs-woodcutting", filename: "src/js/skills/specs/woodcutting.js", rawPath: "../../js/skills/specs/woodcutting.js?raw", codeVariable: "skillSpecsWoodcuttingScript" },
  { id: "skills-specs-fishing", filename: "src/js/skills/specs/fishing.js", rawPath: "../../js/skills/specs/fishing.js?raw", codeVariable: "skillSpecsFishingScript" },
  { id: "skills-specs-firemaking", filename: "src/js/skills/specs/firemaking.js", rawPath: "../../js/skills/specs/firemaking.js?raw", codeVariable: "skillSpecsFiremakingScript" },
  { id: "skills-specs-cooking", filename: "src/js/skills/specs/cooking.js", rawPath: "../../js/skills/specs/cooking.js?raw", codeVariable: "skillSpecsCookingScript" },
  { id: "skills-specs-mining", filename: "src/js/skills/specs/mining.js", rawPath: "../../js/skills/specs/mining.js?raw", codeVariable: "skillSpecsMiningScript" },
  { id: "skills-specs-runecrafting", filename: "src/js/skills/specs/runecrafting.js", rawPath: "../../js/skills/specs/runecrafting.js?raw", codeVariable: "skillSpecsRunecraftingScript" },
  { id: "skills-specs-crafting", filename: "src/js/skills/specs/crafting.js", rawPath: "../../js/skills/specs/crafting.js?raw", codeVariable: "skillSpecsCraftingScript" },
  { id: "skills-specs-fletching", filename: "src/js/skills/specs/fletching.js", rawPath: "../../js/skills/specs/fletching.js?raw", codeVariable: "skillSpecsFletchingScript" },
  { id: "skills-specs-smithing", filename: "src/js/skills/specs/smithing.js", rawPath: "../../js/skills/specs/smithing.js?raw", codeVariable: "skillSpecsSmithingScript" },
  { id: "skills-specs", filename: "src/js/skills/specs/finalize.js", rawPath: "../../js/skills/specs/finalize.js?raw", codeVariable: "skillSpecsFinalizeScript" },
  { id: "skills-spec-registry", filename: "src/js/skills/spec-registry.js", rawPath: "../../js/skills/spec-registry.js?raw", codeVariable: "skillSpecRegistryScript" },
  { id: "shop-economy", filename: "src/js/shop-economy.js", rawPath: "../../js/shop-economy.js?raw", codeVariable: "shopEconomyScript" },
  { id: "skills-manifest", filename: "src/js/skills/manifest.js", rawPath: "../../js/skills/manifest.js?raw", codeVariable: "skillManifestScript" },
  { id: "skills-runtime", filename: "src/js/skills/runtime.js", rawPath: "../../js/skills/runtime.js?raw", codeVariable: "skillRuntimeScript" },
  { id: "target-interaction-registry", filename: "src/js/interactions/target-interaction-registry.js", rawPath: "../../js/interactions/target-interaction-registry.js?raw", codeVariable: "targetInteractionRegistryScript" },
  { id: "skills-shared-utils", filename: "src/js/skills/shared/utils.js", rawPath: "../../js/skills/shared/utils.js?raw", codeVariable: "skillSharedUtilsScript" },
  { id: "skills-shared-action-resolution", filename: "src/js/skills/shared/action-resolution.js", rawPath: "../../js/skills/shared/action-resolution.js?raw", codeVariable: "skillActionResolutionScript" },
  { id: "runecrafting-constants", filename: "src/js/skills/runecrafting/constants.js", rawPath: "../../js/skills/runecrafting/constants.js?raw", codeVariable: "runecraftingConstantsScript" },
  { id: "skills-mining", filename: "src/js/skills/mining/index.js", rawPath: "../../js/skills/mining/index.js?raw", codeVariable: "miningSkillScript" },
  { id: "skills-woodcutting", filename: "src/js/skills/woodcutting/index.js", rawPath: "../../js/skills/woodcutting/index.js?raw", codeVariable: "woodcuttingSkillScript" },
  { id: "skills-fishing", filename: "src/js/skills/fishing/index.js", rawPath: "../../js/skills/fishing/index.js?raw", codeVariable: "fishingSkillScript" },
  { id: "skills-firemaking", filename: "src/js/skills/firemaking/index.js", rawPath: "../../js/skills/firemaking/index.js?raw", codeVariable: "firemakingSkillScript" },
  { id: "skills-cooking", filename: "src/js/skills/cooking/index.js", rawPath: "../../js/skills/cooking/index.js?raw", codeVariable: "cookingSkillScript" },
  { id: "skills-crafting", filename: "src/js/skills/crafting/index.js", rawPath: "../../js/skills/crafting/index.js?raw", codeVariable: "craftingSkillScript" },
  { id: "skills-fletching", filename: "src/js/skills/fletching/index.js", rawPath: "../../js/skills/fletching/index.js?raw", codeVariable: "fletchingSkillScript" },
  { id: "skills-runecrafting", filename: "src/js/skills/runecrafting/index.js", rawPath: "../../js/skills/runecrafting/index.js?raw", codeVariable: "runecraftingSkillScript" },
  { id: "skills-smithing", filename: "src/js/skills/smithing/index.js", rawPath: "../../js/skills/smithing/index.js?raw", codeVariable: "smithingSkillScript" },
  { id: "skills-register", filename: "src/js/skills/register.js", rawPath: "../../js/skills/register.js?raw", codeVariable: "skillsRegisterScript" },
  { id: "player-model-visual-runtime", filename: "src/js/player-model-visual-runtime.js", rawPath: "../../js/player-model-visual-runtime.js?raw", codeVariable: "playerModelVisualRuntimeScript" },
  { id: "player-npc-humanoid-runtime", filename: "src/js/player-npc-humanoid-runtime.js", rawPath: "../../js/player-npc-humanoid-runtime.js?raw", codeVariable: "playerNpcHumanoidRuntimeScript" },
  { id: "player-held-item-runtime", filename: "src/js/player-held-item-runtime.js", rawPath: "../../js/player-held-item-runtime.js?raw", codeVariable: "playerHeldItemRuntimeScript" },
  { id: "player-model", filename: "src/js/player-model.js", rawPath: "../../js/player-model.js?raw", codeVariable: "playerModelScript" },
  { id: "inventory", filename: "src/js/inventory.js", rawPath: "../../js/inventory.js?raw", codeVariable: "inventoryScript" },
  { id: "player-hitpoints-runtime", filename: "src/js/player-hitpoints-runtime.js", rawPath: "../../js/player-hitpoints-runtime.js?raw", codeVariable: "playerHitpointsRuntimeScript" },
  { id: "humanoid-model-runtime", filename: "src/js/humanoid-model-runtime.js", rawPath: "../../js/humanoid-model-runtime.js?raw", codeVariable: "humanoidModelRuntimeScript" },
  { id: "transient-visual-runtime", filename: "src/js/transient-visual-runtime.js", rawPath: "../../js/transient-visual-runtime.js?raw", codeVariable: "transientVisualRuntimeScript" },
  { id: "world", filename: "src/js/world.js", rawPath: "../../js/world.js?raw", codeVariable: "worldScript" },
  { id: "combat", filename: "src/js/combat.js", rawPath: "../../js/combat.js?raw", codeVariable: "combatScript" },
  { id: "input-qa-camera-runtime", filename: "src/js/input-qa-camera-runtime.js", rawPath: "../../js/input-qa-camera-runtime.js?raw", codeVariable: "inputQaCameraRuntimeScript" },
  { id: "input-hover-tooltip-runtime", filename: "src/js/input-hover-tooltip-runtime.js", rawPath: "../../js/input-hover-tooltip-runtime.js?raw", codeVariable: "inputHoverTooltipRuntimeScript" },
  { id: "input-station-interaction-runtime", filename: "src/js/input-station-interaction-runtime.js", rawPath: "../../js/input-station-interaction-runtime.js?raw", codeVariable: "inputStationInteractionRuntimeScript" },
  { id: "input-pose-editor-runtime", filename: "src/js/input-pose-editor-runtime.js", rawPath: "../../js/input-pose-editor-runtime.js?raw", codeVariable: "inputPoseEditorRuntimeScript" },
  { id: "input-player-animation-runtime", filename: "src/js/input-player-animation-runtime.js", rawPath: "../../js/input-player-animation-runtime.js?raw", codeVariable: "inputPlayerAnimationRuntimeScript" },
  { id: "input-pathfinding-runtime", filename: "src/js/input-pathfinding-runtime.js", rawPath: "../../js/input-pathfinding-runtime.js?raw", codeVariable: "inputPathfindingRuntimeScript" },
  { id: "input-pier-interaction-runtime", filename: "src/js/input-pier-interaction-runtime.js", rawPath: "../../js/input-pier-interaction-runtime.js?raw", codeVariable: "inputPierInteractionRuntimeScript" },
  { id: "input-raycast-runtime", filename: "src/js/input-raycast-runtime.js", rawPath: "../../js/input-raycast-runtime.js?raw", codeVariable: "inputRaycastRuntimeScript" },
  { id: "input-tick-movement-runtime", filename: "src/js/input-tick-movement-runtime.js", rawPath: "../../js/input-tick-movement-runtime.js?raw", codeVariable: "inputTickMovementRuntimeScript" },
  { id: "input-arrival-interaction-runtime", filename: "src/js/input-arrival-interaction-runtime.js", rawPath: "../../js/input-arrival-interaction-runtime.js?raw", codeVariable: "inputArrivalInteractionRuntimeScript" },
  { id: "input-action-queue-runtime", filename: "src/js/input-action-queue-runtime.js", rawPath: "../../js/input-action-queue-runtime.js?raw", codeVariable: "inputActionQueueRuntimeScript" },
  { id: "input-target-interaction-runtime", filename: "src/js/input-target-interaction-runtime.js", rawPath: "../../js/input-target-interaction-runtime.js?raw", codeVariable: "inputTargetInteractionRuntimeScript" },
  { id: "input-render", filename: "src/js/input-render.js", rawPath: "../../js/input-render.js?raw", codeVariable: "inputRenderScript" }
];

const legacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  ...contentLegacyScriptsById,
  ...questLegacyScriptsById,
  ...combatLegacyScriptsById,
  ...worldLegacyScriptsById,
  ...skillsLegacyScriptsById,
  ...playerLegacyScriptsById,
  ...inputLegacyScriptsById
};

function resolveLegacyScript(entry: LegacyScriptLoadOrderEntry): LegacyScriptEntry {
  const script = legacyScriptsById[entry.id];
  if (!script) {
    throw new Error("Missing legacy script manifest entry: " + entry.id);
  }
  if (script.filename !== entry.filename) {
    throw new Error("Legacy script filename mismatch for " + entry.id);
  }
  return script;
}

export const legacyScriptManifest: ReadonlyArray<LegacyScriptEntry> = legacyScriptLoadOrder.map(resolveLegacyScript);
