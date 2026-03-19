const fs = require("fs");
const path = require("path");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

const legacyManifest = read("src/game/platform/legacy-script-manifest.ts");
const mainSource = read("src/main.ts");
const coreSource = read("src/js/core.js");
const worldSource = read("src/js/world.js");
const inputRenderSource = read("src/js/input-render.js");
const combatSource = read("src/js/combat.js");
const combatContentSource = read("src/game/combat/content.ts");
const combatContractSource = read("src/game/contracts/combat.ts");
const playerModelSource = read("src/js/player-model.js");
const targetRegistrySource = read("src/js/interactions/target-interaction-registry.js");
const examineCatalogSource = read("src/js/content/examine-catalog.js");
const packageJson = read("package.json");

assert.ok(
  mainSource.includes('exposeCombatBridge'),
  "main.ts should expose the combat bridge before loading legacy runtime"
);
assert.ok(
  legacyManifest.includes('../../js/combat.js?raw'),
  "legacy script manifest should load src/js/combat.js"
);
assert.ok(
  combatSource.includes("window.processCombatTick = processCombatTick;") &&
    combatSource.includes("window.updateCombatRenderers = updateCombatRenderers;"),
  "combat runtime should expose tick and render hooks"
);
  assert.ok(
  combatSource.includes("function createEnemyHitpointsBarRenderer()") &&
    combatSource.includes("function computeCombatLevelFromStats(stats)") &&
    combatSource.includes("combatLevel = getEnemyCombatLevel(enemyType);") &&
    combatSource.includes("combatLevel,") &&
    combatSource.includes("function updateEnemyHitpointsBar(enemyState, renderer)") &&
    combatSource.includes("function updateCombatEnemyOverlays()") &&
    combatSource.includes("function updateIdleEnemyMovement(enemyState, reservedTiles)") &&
    combatSource.includes("function getEnemyVisualMoveProgress(enemyState, frameNow)") &&
    combatSource.includes("function syncMeleeCombatFacing()") &&
    combatSource.includes("function isPlayerCombatFacingReady()") &&
    combatSource.includes("function captureEnemyPendingDefeatFacing(enemyState)") &&
    combatSource.includes("enemyState.pendingDefeatFacingYaw = captureEnemyPendingDefeatFacing(enemyState);") &&
    combatSource.includes("snapCombatFacing = true;") &&
    combatSource.includes("renderer.group.rotation.y = targetYaw;"),
  "combat runtime should render overhead enemy hitpoint bars, support idle enemy roaming, smooth enemy movement, and keep melee combatants facing each other"
);
assert.ok(
  combatSource.includes("window.updateCombatEnemyOverlays = updateCombatEnemyOverlays;") &&
    combatSource.includes("window.getCombatEnemyOccupiedBaseTileId = getCombatEnemyOccupiedBaseTileId;"),
  "combat runtime should expose the enemy overlay refresh hook and occupied-base-tile helper"
);
assert.ok(
  combatSource.includes("guard_basic: {") &&
    combatSource.includes("npc/guard/idle") &&
    combatSource.includes("npc/guard/walk") &&
    combatSource.includes("npc/guard/attack") &&
    combatSource.includes("npc/guard/hit"),
  "combat runtime should wire a dedicated guard animation set"
);
assert.ok(
  combatSource.includes("function createChickenRenderer(enemyState, enemyType)") &&
    combatSource.includes("renderer.kind === 'chicken'") &&
    combatSource.includes("updateChickenRenderer(enemyState, renderer"),
  "combat runtime should provide a dedicated chicken renderer and motion path"
);
assert.ok(
  combatSource.includes("function createBoarRenderer(enemyState, enemyType)") &&
    combatSource.includes("function updateBoarRenderer(enemyState, renderer, frameNow") &&
    combatSource.includes("function createWolfRenderer(enemyState, enemyType)") &&
    combatSource.includes("function updateWolfRenderer(enemyState, renderer, frameNow") &&
    combatSource.includes("if (enemyState.enemyId === 'enemy_boar') renderer = createBoarRenderer(enemyState, enemyType);") &&
    combatSource.includes("else if (enemyState.enemyId === 'enemy_wolf') renderer = createWolfRenderer(enemyState, enemyType);"),
  "combat runtime should give boars and wolves dedicated quadruped renderers"
);
assert.ok(
  combatContentSource.includes('modelPresetId: "guard"') &&
    combatContentSource.includes('animationSetId: "guard_basic"') &&
    combatContentSource.includes('kind: "chicken"') &&
    combatContractSource.includes('EnemyAppearanceKind = "rat" | "humanoid" | "chicken"'),
  "combat content/contracts should expose the guard presentation wiring and chicken appearance kind"
);
assert.ok(
  playerModelSource.includes("function createGuardHumanoidFragments()") &&
    playerModelSource.includes("normalizedPresetId !== 'goblin' && normalizedPresetId !== 'guard'") &&
    playerModelSource.includes("{ actorId: 'guard', label: 'Guard' }"),
  "player-model should expose a dedicated guard humanoid preset and preview actor"
);
assert.ok(
  inputRenderSource.includes("else if (hitData.type === 'ENEMY') {") &&
    inputRenderSource.includes("enemyId: String(hitData.uid || '').trim()") &&
    inputRenderSource.includes("combatLevel: data.combatLevel,"),
  "left-click enemy interaction should queue a normalized enemy target payload"
);
assert.ok(
  inputRenderSource.includes("window.updateCombatEnemyOverlays()"),
  "render loop should refresh enemy overlays after camera updates"
);
assert.ok(
  inputRenderSource.includes("function formatEnemyTooltipDisplayName(hitData)") &&
    inputRenderSource.includes("${baseName} (Level ${combatLevel})") &&
    inputRenderSource.includes("formatEnemyTooltipDisplayName(hitData)"),
  "enemy hover tooltips should append computed combat level next to the enemy name"
);
assert.ok(
  inputRenderSource.includes("else if (typeof pendingAction.targetUid === 'string')") &&
    inputRenderSource.includes("window.lockPlayerCombatTarget(enemyRuntimeId);"),
  "enemy interaction resolution should support both object and string target IDs when locking combat targets"
);
assert.ok(
  targetRegistrySource.includes("ENEMY:"),
  "target interaction registry should provide ENEMY interactions"
);
assert.ok(
  examineCatalogSource.includes("EXAMINE_TEXT_BY_ENEMY_NAME"),
  "examine catalog should include enemy examine copy"
);
assert.ok(
  !worldSource.includes("COMBAT: DUMMY") &&
    !inputRenderSource.includes("COMBAT: DUMMY") &&
    !targetRegistrySource.includes("DUMMY:") &&
    !coreSource.includes("DUMMY: 10"),
  "placeholder dummy combat should be removed from active runtime files"
);
assert.ok(
  !packageJson.includes("tool:sim:combat"),
  "old combat simulator script should be removed from package.json"
);

console.log("Combat rollout guard passed.");
