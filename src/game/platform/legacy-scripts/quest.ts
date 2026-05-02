import type { LegacyScriptEntry } from "../legacy-script-entry";

import questRuntimeScript from "../../../js/quest-runtime.js?raw";
import questLogRuntimeScript from "../../../js/quest-log-runtime.js?raw";
import npcDialogueRuntimeScript from "../../../js/npc-dialogue-runtime.js?raw";

export const questLegacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  "quest-runtime": { id: "quest-runtime", filename: "src/js/quest-runtime.js", code: questRuntimeScript },
  "quest-log-runtime": { id: "quest-log-runtime", filename: "src/js/quest-log-runtime.js", code: questLogRuntimeScript },
  "npc-dialogue-runtime": { id: "npc-dialogue-runtime", filename: "src/js/npc-dialogue-runtime.js", code: npcDialogueRuntimeScript }
};
