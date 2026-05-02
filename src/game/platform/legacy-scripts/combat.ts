import type { LegacyScriptEntry } from "../legacy-script-entry";

import combatQaDebugRuntimeScript from "../../../js/combat-qa-debug-runtime.js?raw";
import combatAnimationDebugPanelRuntimeScript from "../../../js/combat-animation-debug-panel-runtime.js?raw";
import combatHudRuntimeScript from "../../../js/combat-hud-runtime.js?raw";
import combatEngagementRuntimeScript from "../../../js/combat-engagement-runtime.js?raw";
import combatFacingRuntimeScript from "../../../js/combat-facing-runtime.js?raw";
import combatLootRuntimeScript from "../../../js/combat-loot-runtime.js?raw";
import combatPlayerDefeatRuntimeScript from "../../../js/combat-player-defeat-runtime.js?raw";
import combatEnemyMovementRuntimeScript from "../../../js/combat-enemy-movement-runtime.js?raw";
import combatEnemyOccupancyRuntimeScript from "../../../js/combat-enemy-occupancy-runtime.js?raw";
import combatEnemyRenderRuntimeScript from "../../../js/combat-enemy-render-runtime.js?raw";
import combatEnemyOverlayRuntimeScript from "../../../js/combat-enemy-overlay-runtime.js?raw";
import combatScript from "../../../js/combat.js?raw";

export const combatLegacyScriptsById: Readonly<Record<string, LegacyScriptEntry>> = {
  "combat-qa-debug-runtime": { id: "combat-qa-debug-runtime", filename: "src/js/combat-qa-debug-runtime.js", code: combatQaDebugRuntimeScript },
  "combat-animation-debug-panel-runtime": { id: "combat-animation-debug-panel-runtime", filename: "src/js/combat-animation-debug-panel-runtime.js", code: combatAnimationDebugPanelRuntimeScript },
  "combat-hud-runtime": { id: "combat-hud-runtime", filename: "src/js/combat-hud-runtime.js", code: combatHudRuntimeScript },
  "combat-engagement-runtime": { id: "combat-engagement-runtime", filename: "src/js/combat-engagement-runtime.js", code: combatEngagementRuntimeScript },
  "combat-facing-runtime": { id: "combat-facing-runtime", filename: "src/js/combat-facing-runtime.js", code: combatFacingRuntimeScript },
  "combat-loot-runtime": { id: "combat-loot-runtime", filename: "src/js/combat-loot-runtime.js", code: combatLootRuntimeScript },
  "combat-player-defeat-runtime": { id: "combat-player-defeat-runtime", filename: "src/js/combat-player-defeat-runtime.js", code: combatPlayerDefeatRuntimeScript },
  "combat-enemy-movement-runtime": { id: "combat-enemy-movement-runtime", filename: "src/js/combat-enemy-movement-runtime.js", code: combatEnemyMovementRuntimeScript },
  "combat-enemy-occupancy-runtime": { id: "combat-enemy-occupancy-runtime", filename: "src/js/combat-enemy-occupancy-runtime.js", code: combatEnemyOccupancyRuntimeScript },
  "combat-enemy-render-runtime": { id: "combat-enemy-render-runtime", filename: "src/js/combat-enemy-render-runtime.js", code: combatEnemyRenderRuntimeScript },
  "combat-enemy-overlay-runtime": { id: "combat-enemy-overlay-runtime", filename: "src/js/combat-enemy-overlay-runtime.js", code: combatEnemyOverlayRuntimeScript },
  "combat": { id: "combat", filename: "src/js/combat.js", code: combatScript }
};
