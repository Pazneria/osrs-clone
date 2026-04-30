import itemCatalogScript from "../../js/content/item-catalog.js?raw";
import iconReviewCatalogScript from "../../js/content/icon-review-catalog.js?raw";
import playerAppearanceCatalogScript from "../../js/content/player-appearance-catalog.js?raw";
import examineCatalogScript from "../../js/content/examine-catalog.js?raw";
import npcDialogueCatalogScript from "../../js/content/npc-dialogue-catalog.js?raw";
import questCatalogScript from "../../js/content/quest-catalog.js?raw";
import questRuntimeScript from "../../js/quest-runtime.js?raw";
import npcDialogueRuntimeScript from "../../js/npc-dialogue-runtime.js?raw";
import combatQaDebugRuntimeScript from "../../js/combat-qa-debug-runtime.js?raw";
import qaCommandRuntimeScript from "../../js/qa-command-runtime.js?raw";
import qaToolsRuntimeScript from "../../js/qa-tools-runtime.js?raw";
import tileRuntimeScript from "../../js/world/tile-runtime.js?raw";
import worldProceduralRuntimeScript from "../../js/world/procedural-runtime.js?raw";
import worldRenderRuntimeScript from "../../js/world/render-runtime.js?raw";
import worldWaterRuntimeScript from "../../js/world/water-runtime.js?raw";
import worldChunkTerrainRuntimeScript from "../../js/world/chunk-terrain-runtime.js?raw";
import worldChunkTierRenderRuntimeScript from "../../js/world/chunk-tier-render-runtime.js?raw";
import worldGroundItemRenderRuntimeScript from "../../js/world/ground-item-render-runtime.js?raw";
import worldStructureRenderRuntimeScript from "../../js/world/structure-render-runtime.js?raw";
import worldTreeNodeRuntimeScript from "../../js/world/tree-node-runtime.js?raw";
import worldTreeRenderRuntimeScript from "../../js/world/tree-render-runtime.js?raw";
import worldRockNodeRuntimeScript from "../../js/world/rock-node-runtime.js?raw";
import worldRockRenderRuntimeScript from "../../js/world/rock-render-runtime.js?raw";
import worldFireRenderRuntimeScript from "../../js/world/fire-render-runtime.js?raw";
import worldSceneStateScript from "../../js/world/scene-state.js?raw";
import worldSceneLifecycleScript from "../../js/world/scene-lifecycle.js?raw";
import worldChunkSceneRuntimeScript from "../../js/world/chunk-scene-runtime.js?raw";
import worldMapHudRuntimeScript from "../../js/world/map-hud-runtime.js?raw";
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
import playerModelScript from "../../js/player-model.js?raw";
import inventoryScript from "../../js/inventory.js?raw";
import worldScript from "../../js/world.js?raw";
import combatScript from "../../js/combat.js?raw";
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
  { id: "npc-dialogue-runtime", filename: "src/js/npc-dialogue-runtime.js", code: npcDialogueRuntimeScript },
  { id: "combat-qa-debug-runtime", filename: "src/js/combat-qa-debug-runtime.js", code: combatQaDebugRuntimeScript },
  { id: "qa-command-runtime", filename: "src/js/qa-command-runtime.js", code: qaCommandRuntimeScript },
  { id: "qa-tools-runtime", filename: "src/js/qa-tools-runtime.js", code: qaToolsRuntimeScript },
  { id: "world-tile-runtime", filename: "src/js/world/tile-runtime.js", code: tileRuntimeScript },
  { id: "world-procedural-runtime", filename: "src/js/world/procedural-runtime.js", code: worldProceduralRuntimeScript },
  { id: "world-render-runtime", filename: "src/js/world/render-runtime.js", code: worldRenderRuntimeScript },
  { id: "world-water-runtime", filename: "src/js/world/water-runtime.js", code: worldWaterRuntimeScript },
  { id: "world-chunk-terrain-runtime", filename: "src/js/world/chunk-terrain-runtime.js", code: worldChunkTerrainRuntimeScript },
  { id: "world-chunk-tier-render-runtime", filename: "src/js/world/chunk-tier-render-runtime.js", code: worldChunkTierRenderRuntimeScript },
  { id: "world-ground-item-render-runtime", filename: "src/js/world/ground-item-render-runtime.js", code: worldGroundItemRenderRuntimeScript },
  { id: "world-structure-render-runtime", filename: "src/js/world/structure-render-runtime.js", code: worldStructureRenderRuntimeScript },
  { id: "world-tree-node-runtime", filename: "src/js/world/tree-node-runtime.js", code: worldTreeNodeRuntimeScript },
  { id: "world-tree-render-runtime", filename: "src/js/world/tree-render-runtime.js", code: worldTreeRenderRuntimeScript },
  { id: "world-rock-node-runtime", filename: "src/js/world/rock-node-runtime.js", code: worldRockNodeRuntimeScript },
  { id: "world-rock-render-runtime", filename: "src/js/world/rock-render-runtime.js", code: worldRockRenderRuntimeScript },
  { id: "world-fire-render-runtime", filename: "src/js/world/fire-render-runtime.js", code: worldFireRenderRuntimeScript },
  { id: "world-scene-state", filename: "src/js/world/scene-state.js", code: worldSceneStateScript },
  { id: "world-scene-lifecycle", filename: "src/js/world/scene-lifecycle.js", code: worldSceneLifecycleScript },
  { id: "world-chunk-scene-runtime", filename: "src/js/world/chunk-scene-runtime.js", code: worldChunkSceneRuntimeScript },
  { id: "world-map-hud-runtime", filename: "src/js/world/map-hud-runtime.js", code: worldMapHudRuntimeScript },
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
  { id: "player-model", filename: "src/js/player-model.js", code: playerModelScript },
  { id: "inventory", filename: "src/js/inventory.js", code: inventoryScript },
  { id: "world", filename: "src/js/world.js", code: worldScript },
  { id: "combat", filename: "src/js/combat.js", code: combatScript },
  { id: "input-render", filename: "src/js/input-render.js", code: inputRenderScript }
];
