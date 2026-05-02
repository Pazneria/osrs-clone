import type { LegacyScriptEntry } from "../legacy-script-entry";

import playerModelVisualRuntimeScript from "../../../js/player-model-visual-runtime.js?raw";
import playerNpcHumanoidRuntimeScript from "../../../js/player-npc-humanoid-runtime.js?raw";
import playerHeldItemRuntimeScript from "../../../js/player-held-item-runtime.js?raw";
import playerModelScript from "../../../js/player-model.js?raw";
import inventoryScript from "../../../js/inventory.js?raw";
import playerHitpointsRuntimeScript from "../../../js/player-hitpoints-runtime.js?raw";
import humanoidModelRuntimeScript from "../../../js/humanoid-model-runtime.js?raw";
import transientVisualRuntimeScript from "../../../js/transient-visual-runtime.js?raw";

export const playerLegacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  "player-model-visual-runtime": { id: "player-model-visual-runtime", filename: "src/js/player-model-visual-runtime.js", code: playerModelVisualRuntimeScript },
  "player-npc-humanoid-runtime": { id: "player-npc-humanoid-runtime", filename: "src/js/player-npc-humanoid-runtime.js", code: playerNpcHumanoidRuntimeScript },
  "player-held-item-runtime": { id: "player-held-item-runtime", filename: "src/js/player-held-item-runtime.js", code: playerHeldItemRuntimeScript },
  "player-model": { id: "player-model", filename: "src/js/player-model.js", code: playerModelScript },
  "inventory": { id: "inventory", filename: "src/js/inventory.js", code: inventoryScript },
  "player-hitpoints-runtime": { id: "player-hitpoints-runtime", filename: "src/js/player-hitpoints-runtime.js", code: playerHitpointsRuntimeScript },
  "humanoid-model-runtime": { id: "humanoid-model-runtime", filename: "src/js/humanoid-model-runtime.js", code: humanoidModelRuntimeScript },
  "transient-visual-runtime": { id: "transient-visual-runtime", filename: "src/js/transient-visual-runtime.js", code: transientVisualRuntimeScript }
};
