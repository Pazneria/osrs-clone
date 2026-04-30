const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

const legacyManifest = read("src/game/platform/legacy-script-manifest.ts");
const mainSource = read("src/main.ts");
const coreSource = read("src/js/core.js");
const worldSource = read("src/js/world.js");
const inputRenderSource = read("src/js/input-render.js");
const combatSource = read("src/js/combat.js");
const combatQaDebugSource = read("src/js/combat-qa-debug-runtime.js");
const combatEnemyOverlayRuntimeSource = read("src/js/combat-enemy-overlay-runtime.js");
const playerHitpointsRuntimeSource = read("src/js/player-hitpoints-runtime.js");
const combatContentSource = read("src/game/combat/content.ts");
const combatContractSource = read("src/game/contracts/combat.ts");
const combatFormulasSource = read("src/game/combat/formulas.ts");
const combatBridgeSource = read("src/game/platform/combat-bridge.ts");
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
  legacyManifest.includes('../../js/combat-qa-debug-runtime.js?raw') &&
    legacyManifest.indexOf('id: "combat-qa-debug-runtime"') < legacyManifest.indexOf('id: "core"'),
  "legacy script manifest should load combat QA debug runtime before core.js"
);
assert.ok(
  legacyManifest.includes('../../js/player-hitpoints-runtime.js?raw') &&
    legacyManifest.indexOf('id: "player-hitpoints-runtime"') < legacyManifest.indexOf('id: "world"') &&
    legacyManifest.indexOf('id: "player-hitpoints-runtime"') < legacyManifest.indexOf('id: "combat"'),
  "legacy script manifest should load player hitpoints runtime before world/combat consumers"
);
assert.ok(
  combatFormulasSource.includes("export function applyPlayerHitpointDamage") &&
    combatFormulasSource.includes("export function applyPlayerHitpointHealing") &&
    combatBridgeSource.includes("applyPlayerHitpointDamage") &&
    combatBridgeSource.includes("applyPlayerHitpointHealing"),
  "typed combat formulas and bridge should own player hitpoint math"
);
assert.ok(
  playerHitpointsRuntimeSource.includes("window.PlayerHitpointsRuntime") &&
    playerHitpointsRuntimeSource.includes("applyHitpointDamage") &&
    playerHitpointsRuntimeSource.includes("applyHitpointHealing") &&
    worldSource.includes("PlayerHitpointsRuntime") &&
    !worldSource.includes("const dealt = Math.min(requestedDamage, maxDamage);"),
  "world.js should delegate player hitpoint mutation through the player hitpoints runtime"
);
assert.ok(
  combatQaDebugSource.includes("window.CombatQaDebugRuntime") &&
    combatQaDebugSource.includes("getSnapshot") &&
    combatQaDebugSource.includes("emitSnapshot"),
  "combat QA debug runtime should own snapshot and chat emission formatting"
);
assert.ok(
  coreSource.includes("buildCombatQaDebugContext") &&
    coreSource.includes("window.CombatQaDebugRuntime || null") &&
    !coreSource.includes("const pursuitDebugState = window.__qaCombatDebugLastPlayerPursuitState"),
  "core.js should adapt state into the combat QA debug runtime instead of owning debug snapshot formatting"
);
assert.ok(
  combatSource.includes("window.processCombatTick = processCombatTick;") &&
    combatSource.includes("window.updateCombatRenderers = updateCombatRenderers;"),
  "combat runtime should expose tick and render hooks"
);
  assert.ok(
  combatEnemyOverlayRuntimeSource.includes("function createEnemyHitpointsBarRenderer(options = {})") &&
    combatSource.includes("function computeCombatLevelFromStats(stats)") &&
    combatSource.includes("combatLevel = getEnemyCombatLevel(enemyType);") &&
    combatSource.includes("combatLevel,") &&
    combatEnemyOverlayRuntimeSource.includes("function updateEnemyHitpointsBar(options = {})") &&
    combatSource.includes("combatEnemyOverlayRuntime.updateCombatEnemyOverlays({") &&
    combatSource.includes("function updateIdleEnemyMovement(enemyState, reservedTiles)") &&
    combatSource.includes("function getEnemyVisualMoveProgress(enemyState, frameNow)") &&
    combatSource.includes("function syncMeleeCombatFacing()") &&
    combatSource.includes("function isPlayerCombatFacingReady()") &&
    combatSource.includes("function captureEnemyPendingDefeatFacing(enemyState)") &&
    combatSource.includes("enemyState.pendingDefeatFacingYaw = captureEnemyPendingDefeatFacing(enemyState);") &&
    combatSource.includes("snapCombatFacing = true;") &&
    combatSource.includes("renderer.group.rotation.y = targetYaw;"),
  "combat runtime should delegate overhead enemy hitpoint bars, support idle enemy roaming, smooth enemy movement, and keep melee combatants facing each other"
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

const combatQaSandbox = { window: {} };
vm.runInNewContext(combatQaDebugSource, combatQaSandbox, { filename: "src/js/combat-qa-debug-runtime.js" });
const combatQaRuntime = combatQaSandbox.window.CombatQaDebugRuntime;
assert.ok(combatQaRuntime, "combat QA debug runtime should execute in isolation");
const qaMessages = [];
const qaSnapshot = combatQaRuntime.getSnapshot({
  windowRef: {
    __qaCombatDebugLastPlayerPursuitState: { tick: 12, runtimeId: "enemy-a", enemyId: "enemy_rat", state: "valid-path", pathLength: 3, occupancyIgnoredPathLength: 4 },
    __qaCombatDebugLastAutoRetaliateSelection: { tick: 12, runtimeId: "enemy-a", enemyId: "enemy_rat", displayName: "Rat", distance: 1, combatLevel: 2, aggressorOrder: 1 },
    __qaCombatDebugLastEnemyAttackResult: { tick: 11, attackerId: "enemy-a", enemyId: "enemy_rat", landed: true, damage: 1, isTrainingDummyAttack: false },
    __qaCombatDebugLastClearReason: "test-clear",
    __qaCombatDebugLastClearTick: 12
  },
  currentTick: 12,
  playerState: {
    x: 1,
    y: 2,
    z: 0,
    targetX: 3,
    targetY: 4,
    action: "FIGHTING",
    inCombat: true,
    remainingAttackCooldown: 2,
    lockedTargetId: "enemy-a",
    path: [{ x: 1, y: 2 }],
    lastAttackTick: 10,
    lastDamagerEnemyId: "enemy-a"
  },
  playerRig: { userData: { animationRigId: "player_humanoid_v1", rig: { attackTick: 10 } } },
  getCombatHudSnapshot: () => ({ inCombat: true, playerRemainingAttackCooldown: 2, target: { label: "Rat", state: "alive", distance: 1, inMeleeRange: true, currentHealth: 2, maxHealth: 3, remainingAttackCooldown: 1 } }),
  getCombatEnemyState: () => ({ runtimeId: "enemy-a", enemyId: "enemy_rat", x: 3, y: 4, z: 0, currentState: "alive", currentHealth: 2, remainingAttackCooldown: 1 }),
  getCombatEnemyAnimationDebugState: () => ({ animationSetId: "rat_basic", useWalkBaseClip: false }),
  addChatMessage: (message, type) => qaMessages.push({ message, type })
});
assert.strictEqual(qaSnapshot.player.lockedTargetId, "enemy-a", "combat QA runtime should normalize player lock state");
assert.strictEqual(qaSnapshot.pursuit.state, "valid-path", "combat QA runtime should include pursuit debug state");
assert.ok(combatQaRuntime.getSignature({}, qaSnapshot).includes("enemy-a"), "combat QA runtime signatures should include lock identity");
combatQaRuntime.emitSnapshot({
  windowRef: {},
  currentTick: 1,
  playerState: { action: "IDLE" },
  addChatMessage: (message, type) => qaMessages.push({ message, type })
}, "guard");
assert.ok(qaMessages.some((entry) => entry.message.includes("[QA combatdbg] reason=guard")), "combat QA runtime should emit chat debug summaries");

console.log("Combat rollout guard passed.");
