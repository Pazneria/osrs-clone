import type { LegacyScriptEntry } from "../legacy-script-entry";

import skillProgressRuntimeScript from "../../../js/skill-progress-runtime.js?raw";
import skillPanelRuntimeScript from "../../../js/skill-panel-runtime.js?raw";
import skillPanelRenderRuntimeScript from "../../../js/skill-panel-render-runtime.js?raw";
import inventoryItemRuntimeScript from "../../../js/inventory-item-runtime.js?raw";
import equipmentItemRuntimeScript from "../../../js/equipment-item-runtime.js?raw";
import foodItemRuntimeScript from "../../../js/food-item-runtime.js?raw";
import inventoryActionRuntimeScript from "../../../js/inventory-action-runtime.js?raw";
import inventoryTooltipRuntimeScript from "../../../js/inventory-tooltip-runtime.js?raw";
import inventoryBankSessionRuntimeScript from "../../../js/inventory-bank-session-runtime.js?raw";
import inventoryShopSessionRuntimeScript from "../../../js/inventory-shop-session-runtime.js?raw";
import contextMenuRuntimeScript from "../../../js/context-menu-runtime.js?raw";
import coreChatRuntimeScript from "../../../js/core-chat-runtime.js?raw";
import corePlayerEntryRuntimeScript from "../../../js/core-player-entry-runtime.js?raw";
import coreTutorialRuntimeScript from "../../../js/core-tutorial-runtime.js?raw";
import coreProgressRuntimeScript from "../../../js/core-progress-runtime.js?raw";
import coreIconReviewRuntimeScript from "../../../js/core-icon-review-runtime.js?raw";
import coreScript from "../../../js/core.js?raw";
import skillSpecsSharedScript from "../../../js/skills/specs/shared.js?raw";
import skillSpecsWoodcuttingScript from "../../../js/skills/specs/woodcutting.js?raw";
import skillSpecsFishingScript from "../../../js/skills/specs/fishing.js?raw";
import skillSpecsFiremakingScript from "../../../js/skills/specs/firemaking.js?raw";
import skillSpecsCookingScript from "../../../js/skills/specs/cooking.js?raw";
import skillSpecsMiningScript from "../../../js/skills/specs/mining.js?raw";
import skillSpecsRunecraftingScript from "../../../js/skills/specs/runecrafting.js?raw";
import skillSpecsCraftingScript from "../../../js/skills/specs/crafting.js?raw";
import skillSpecsFletchingScript from "../../../js/skills/specs/fletching.js?raw";
import skillSpecsSmithingScript from "../../../js/skills/specs/smithing.js?raw";
import skillSpecsFinalizeScript from "../../../js/skills/specs/finalize.js?raw";
import skillSpecRegistryScript from "../../../js/skills/spec-registry.js?raw";
import shopEconomyScript from "../../../js/shop-economy.js?raw";
import skillManifestScript from "../../../js/skills/manifest.js?raw";
import skillRuntimeScript from "../../../js/skills/runtime.js?raw";
import targetInteractionRegistryScript from "../../../js/interactions/target-interaction-registry.js?raw";
import skillSharedUtilsScript from "../../../js/skills/shared/utils.js?raw";
import skillActionResolutionScript from "../../../js/skills/shared/action-resolution.js?raw";
import runecraftingConstantsScript from "../../../js/skills/runecrafting/constants.js?raw";
import miningSkillScript from "../../../js/skills/mining/index.js?raw";
import woodcuttingSkillScript from "../../../js/skills/woodcutting/index.js?raw";
import fishingSkillScript from "../../../js/skills/fishing/index.js?raw";
import firemakingSkillScript from "../../../js/skills/firemaking/index.js?raw";
import cookingSkillScript from "../../../js/skills/cooking/index.js?raw";
import craftingSkillScript from "../../../js/skills/crafting/index.js?raw";
import fletchingSkillScript from "../../../js/skills/fletching/index.js?raw";
import runecraftingSkillScript from "../../../js/skills/runecrafting/index.js?raw";
import smithingSkillScript from "../../../js/skills/smithing/index.js?raw";
import skillsRegisterScript from "../../../js/skills/register.js?raw";

export const skillsLegacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  "skill-progress-runtime": { id: "skill-progress-runtime", filename: "src/js/skill-progress-runtime.js", code: skillProgressRuntimeScript },
  "skill-panel-runtime": { id: "skill-panel-runtime", filename: "src/js/skill-panel-runtime.js", code: skillPanelRuntimeScript },
  "skill-panel-render-runtime": { id: "skill-panel-render-runtime", filename: "src/js/skill-panel-render-runtime.js", code: skillPanelRenderRuntimeScript },
  "inventory-item-runtime": { id: "inventory-item-runtime", filename: "src/js/inventory-item-runtime.js", code: inventoryItemRuntimeScript },
  "equipment-item-runtime": { id: "equipment-item-runtime", filename: "src/js/equipment-item-runtime.js", code: equipmentItemRuntimeScript },
  "food-item-runtime": { id: "food-item-runtime", filename: "src/js/food-item-runtime.js", code: foodItemRuntimeScript },
  "inventory-action-runtime": { id: "inventory-action-runtime", filename: "src/js/inventory-action-runtime.js", code: inventoryActionRuntimeScript },
  "inventory-tooltip-runtime": { id: "inventory-tooltip-runtime", filename: "src/js/inventory-tooltip-runtime.js", code: inventoryTooltipRuntimeScript },
  "inventory-bank-session-runtime": { id: "inventory-bank-session-runtime", filename: "src/js/inventory-bank-session-runtime.js", code: inventoryBankSessionRuntimeScript },
  "inventory-shop-session-runtime": { id: "inventory-shop-session-runtime", filename: "src/js/inventory-shop-session-runtime.js", code: inventoryShopSessionRuntimeScript },
  "context-menu-runtime": { id: "context-menu-runtime", filename: "src/js/context-menu-runtime.js", code: contextMenuRuntimeScript },
  "core-chat-runtime": { id: "core-chat-runtime", filename: "src/js/core-chat-runtime.js", code: coreChatRuntimeScript },
  "core-player-entry-runtime": { id: "core-player-entry-runtime", filename: "src/js/core-player-entry-runtime.js", code: corePlayerEntryRuntimeScript },
  "core-tutorial-runtime": { id: "core-tutorial-runtime", filename: "src/js/core-tutorial-runtime.js", code: coreTutorialRuntimeScript },
  "core-progress-runtime": { id: "core-progress-runtime", filename: "src/js/core-progress-runtime.js", code: coreProgressRuntimeScript },
  "core-icon-review-runtime": { id: "core-icon-review-runtime", filename: "src/js/core-icon-review-runtime.js", code: coreIconReviewRuntimeScript },
  "core": { id: "core", filename: "src/js/core.js", code: coreScript },
  "skills-specs-shared": { id: "skills-specs-shared", filename: "src/js/skills/specs/shared.js", code: skillSpecsSharedScript },
  "skills-specs-woodcutting": { id: "skills-specs-woodcutting", filename: "src/js/skills/specs/woodcutting.js", code: skillSpecsWoodcuttingScript },
  "skills-specs-fishing": { id: "skills-specs-fishing", filename: "src/js/skills/specs/fishing.js", code: skillSpecsFishingScript },
  "skills-specs-firemaking": { id: "skills-specs-firemaking", filename: "src/js/skills/specs/firemaking.js", code: skillSpecsFiremakingScript },
  "skills-specs-cooking": { id: "skills-specs-cooking", filename: "src/js/skills/specs/cooking.js", code: skillSpecsCookingScript },
  "skills-specs-mining": { id: "skills-specs-mining", filename: "src/js/skills/specs/mining.js", code: skillSpecsMiningScript },
  "skills-specs-runecrafting": { id: "skills-specs-runecrafting", filename: "src/js/skills/specs/runecrafting.js", code: skillSpecsRunecraftingScript },
  "skills-specs-crafting": { id: "skills-specs-crafting", filename: "src/js/skills/specs/crafting.js", code: skillSpecsCraftingScript },
  "skills-specs-fletching": { id: "skills-specs-fletching", filename: "src/js/skills/specs/fletching.js", code: skillSpecsFletchingScript },
  "skills-specs-smithing": { id: "skills-specs-smithing", filename: "src/js/skills/specs/smithing.js", code: skillSpecsSmithingScript },
  "skills-specs": { id: "skills-specs", filename: "src/js/skills/specs/finalize.js", code: skillSpecsFinalizeScript },
  "skills-spec-registry": { id: "skills-spec-registry", filename: "src/js/skills/spec-registry.js", code: skillSpecRegistryScript },
  "shop-economy": { id: "shop-economy", filename: "src/js/shop-economy.js", code: shopEconomyScript },
  "skills-manifest": { id: "skills-manifest", filename: "src/js/skills/manifest.js", code: skillManifestScript },
  "skills-runtime": { id: "skills-runtime", filename: "src/js/skills/runtime.js", code: skillRuntimeScript },
  "target-interaction-registry": { id: "target-interaction-registry", filename: "src/js/interactions/target-interaction-registry.js", code: targetInteractionRegistryScript },
  "skills-shared-utils": { id: "skills-shared-utils", filename: "src/js/skills/shared/utils.js", code: skillSharedUtilsScript },
  "skills-shared-action-resolution": { id: "skills-shared-action-resolution", filename: "src/js/skills/shared/action-resolution.js", code: skillActionResolutionScript },
  "runecrafting-constants": { id: "runecrafting-constants", filename: "src/js/skills/runecrafting/constants.js", code: runecraftingConstantsScript },
  "skills-mining": { id: "skills-mining", filename: "src/js/skills/mining/index.js", code: miningSkillScript },
  "skills-woodcutting": { id: "skills-woodcutting", filename: "src/js/skills/woodcutting/index.js", code: woodcuttingSkillScript },
  "skills-fishing": { id: "skills-fishing", filename: "src/js/skills/fishing/index.js", code: fishingSkillScript },
  "skills-firemaking": { id: "skills-firemaking", filename: "src/js/skills/firemaking/index.js", code: firemakingSkillScript },
  "skills-cooking": { id: "skills-cooking", filename: "src/js/skills/cooking/index.js", code: cookingSkillScript },
  "skills-crafting": { id: "skills-crafting", filename: "src/js/skills/crafting/index.js", code: craftingSkillScript },
  "skills-fletching": { id: "skills-fletching", filename: "src/js/skills/fletching/index.js", code: fletchingSkillScript },
  "skills-runecrafting": { id: "skills-runecrafting", filename: "src/js/skills/runecrafting/index.js", code: runecraftingSkillScript },
  "skills-smithing": { id: "skills-smithing", filename: "src/js/skills/smithing/index.js", code: smithingSkillScript },
  "skills-register": { id: "skills-register", filename: "src/js/skills/register.js", code: skillsRegisterScript }
};
