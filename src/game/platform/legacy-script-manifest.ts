import itemCatalogScript from "../../js/content/item-catalog.js?raw";
import playerAppearanceCatalogScript from "../../js/content/player-appearance-catalog.js?raw";
import examineCatalogScript from "../../js/content/examine-catalog.js?raw";
import coreScript from "../../js/core.js?raw";
import skillSpecsScript from "../../js/skills/specs.js?raw";
import skillSpecRegistryScript from "../../js/skills/spec-registry.js?raw";
import shopEconomyScript from "../../js/shop-economy.js?raw";
import skillManifestScript from "../../js/skills/manifest.js?raw";
import skillRuntimeScript from "../../js/skills/runtime.js?raw";
import targetInteractionRegistryScript from "../../js/interactions/target-interaction-registry.js?raw";
import skillSharedUtilsScript from "../../js/skills/shared/utils.js?raw";
import skillActionResolutionScript from "../../js/skills/shared/action-resolution.js?raw";
import skillAnimationsScript from "../../js/skills/shared/animations.js?raw";
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
import inputRenderScript from "../../js/input-render.js?raw";

export interface LegacyScriptEntry {
  id: string;
  filename: string;
  code: string;
}

export const legacyScriptManifest: ReadonlyArray<LegacyScriptEntry> = [
  { id: "item-catalog", filename: "src/js/content/item-catalog.js", code: itemCatalogScript },
  { id: "player-appearance-catalog", filename: "src/js/content/player-appearance-catalog.js", code: playerAppearanceCatalogScript },
  { id: "examine-catalog", filename: "src/js/content/examine-catalog.js", code: examineCatalogScript },
  { id: "core", filename: "src/js/core.js", code: coreScript },
  { id: "skills-specs", filename: "src/js/skills/specs.js", code: skillSpecsScript },
  { id: "skills-spec-registry", filename: "src/js/skills/spec-registry.js", code: skillSpecRegistryScript },
  { id: "shop-economy", filename: "src/js/shop-economy.js", code: shopEconomyScript },
  { id: "skills-manifest", filename: "src/js/skills/manifest.js", code: skillManifestScript },
  { id: "skills-runtime", filename: "src/js/skills/runtime.js", code: skillRuntimeScript },
  { id: "target-interaction-registry", filename: "src/js/interactions/target-interaction-registry.js", code: targetInteractionRegistryScript },
  { id: "skills-shared-utils", filename: "src/js/skills/shared/utils.js", code: skillSharedUtilsScript },
  { id: "skills-shared-action-resolution", filename: "src/js/skills/shared/action-resolution.js", code: skillActionResolutionScript },
  { id: "skills-shared-animations", filename: "src/js/skills/shared/animations.js", code: skillAnimationsScript },
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
  { id: "input-render", filename: "src/js/input-render.js", code: inputRenderScript }
];
