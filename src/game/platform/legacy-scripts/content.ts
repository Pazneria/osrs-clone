import type { LegacyScriptEntry } from "../legacy-script-entry";

import itemCatalogScript from "../../../js/content/item-catalog.js?raw";
import iconReviewCatalogScript from "../../../js/content/icon-review-catalog.js?raw";
import playerAppearanceCatalogScript from "../../../js/content/player-appearance-catalog.js?raw";
import examineCatalogScript from "../../../js/content/examine-catalog.js?raw";
import npcDialogueCatalogScript from "../../../js/content/npc-dialogue-catalog.js?raw";
import questCatalogScript from "../../../js/content/quest-catalog.js?raw";

export const contentLegacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  "item-catalog": { id: "item-catalog", filename: "src/js/content/item-catalog.js", code: itemCatalogScript },
  "icon-review-catalog": { id: "icon-review-catalog", filename: "src/js/content/icon-review-catalog.js", code: iconReviewCatalogScript },
  "player-appearance-catalog": { id: "player-appearance-catalog", filename: "src/js/content/player-appearance-catalog.js", code: playerAppearanceCatalogScript },
  "examine-catalog": { id: "examine-catalog", filename: "src/js/content/examine-catalog.js", code: examineCatalogScript },
  "npc-dialogue-catalog": { id: "npc-dialogue-catalog", filename: "src/js/content/npc-dialogue-catalog.js", code: npcDialogueCatalogScript },
  "quest-catalog": { id: "quest-catalog", filename: "src/js/content/quest-catalog.js", code: questCatalogScript }
};
