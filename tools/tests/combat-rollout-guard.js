const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function countOccurrences(source, pattern) {
  return source.split(pattern).length - 1;
}

const legacyManifest = read("src/game/platform/legacy-script-manifest.ts");
const mainSource = read("src/main.ts");
const coreSource = read("src/js/core.js");
const worldSource = read("src/js/world.js");
const inputRenderSource = read("src/js/input-render.js");
const combatSource = read("src/js/combat.js");
const combatQaDebugSource = read("src/js/combat-qa-debug-runtime.js");
const combatEnemyRenderRuntimeSource = read("src/js/combat-enemy-render-runtime.js");
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
  legacyManifest.includes('../../js/combat-enemy-render-runtime.js?raw') &&
    legacyManifest.indexOf('id: "combat-enemy-render-runtime"') < legacyManifest.indexOf('id: "combat"'),
  "legacy script manifest should load combat enemy render runtime before combat.js"
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
    combatQaDebugSource.includes("emitSnapshot") &&
    combatQaDebugSource.includes("recordPlayerPursuitDebug") &&
    combatQaDebugSource.includes("recordAutoRetaliateSelection") &&
    combatQaDebugSource.includes("recordEnemyAttackResult") &&
    combatQaDebugSource.includes("recordClearResult") &&
    combatQaDebugSource.includes("buildEnemyAnimationDebugState") &&
    combatQaDebugSource.includes("listCombatEnemyStates"),
  "combat QA debug runtime should own snapshot, chat emission, debug scratch publication, and QA enemy debug views"
);
assert.ok(
  combatSource.includes("const combatQaDebugRuntime = window.CombatQaDebugRuntime || null;") &&
    combatSource.includes("combatQaDebugRuntime.recordPlayerPursuitDebug({") &&
    combatSource.includes("combatQaDebugRuntime.recordAutoRetaliateSelection({") &&
    combatSource.includes("combatQaDebugRuntime.recordEnemyAttackResult({") &&
    combatSource.includes("combatQaDebugRuntime.recordClearResult({") &&
    !combatSource.includes("window.__qaCombatDebugLastPlayerPursuitState") &&
    !combatSource.includes("window.__qaCombatDebugLastAutoRetaliateSelection") &&
    !combatSource.includes("window.__qaCombatDebugLastEnemyAttackResult") &&
    !combatSource.includes("window.__qaCombatDebugLastClearReason") &&
    !combatSource.includes("window.__qaCombatDebugLastClearTick"),
  "combat.js should delegate QA scratch globals through the combat QA debug runtime"
);
assert.ok(
  combatSource.includes("combatQaDebugRuntime.buildEnemyAnimationDebugState({") &&
    combatSource.includes("combatQaDebugRuntime.listCombatEnemyStates({") &&
    !combatSource.includes("const locomotionIntentUntilAt = Number.isFinite(enemyState.locomotionIntentUntilAt)") &&
    !combatSource.includes("return combatEnemyStates.map((enemyState) => {"),
  "combat.js should delegate QA enemy animation and list snapshots through the combat QA debug runtime"
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
  combatEnemyRenderRuntimeSource.includes("function createEnemyVisualRenderer(options = {})") &&
    combatEnemyRenderRuntimeSource.includes("function updateEnemyVisualRenderer(options = {})") &&
    combatEnemyOverlayRuntimeSource.includes("function createEnemyHitpointsBarRenderer(options = {})") &&
    combatSource.includes("function computeCombatLevelFromStats(stats)") &&
    combatSource.includes("combatLevel = getEnemyCombatLevel(enemyType);") &&
    combatEnemyRenderRuntimeSource.includes("combatLevel,") &&
    combatEnemyOverlayRuntimeSource.includes("function updateEnemyHitpointsBar(options = {})") &&
    combatSource.includes("combatEnemyRenderRuntime.createEnemyVisualRenderer({") &&
    combatSource.includes("combatEnemyRenderRuntime.updateEnemyVisualRenderer({") &&
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
  combatEnemyRenderRuntimeSource.includes("function createChickenRenderer(enemyState, enemyType)") &&
    combatEnemyRenderRuntimeSource.includes("updateChickenRenderer(enemyState, renderer"),
  "combat enemy render runtime should provide a dedicated chicken renderer and motion path"
);
assert.ok(
  combatEnemyRenderRuntimeSource.includes("function createBoarRenderer(enemyState, enemyType)") &&
    combatEnemyRenderRuntimeSource.includes("function updateBoarRenderer(enemyState, renderer, frameNow") &&
    combatEnemyRenderRuntimeSource.includes("function createWolfRenderer(enemyState, enemyType)") &&
    combatEnemyRenderRuntimeSource.includes("function updateWolfRenderer(enemyState, renderer, frameNow") &&
    combatEnemyRenderRuntimeSource.includes("if (enemyState.enemyId === 'enemy_boar') return createBoarRenderer(enemyState, enemyType);") &&
    combatEnemyRenderRuntimeSource.includes("if (enemyState.enemyId === 'enemy_wolf') return createWolfRenderer(enemyState, enemyType);"),
  "combat enemy render runtime should give boars and wolves dedicated quadruped renderers"
);
assert.strictEqual(countOccurrences(combatSource, "function createBoarRenderer("), 0, "combat.js should delegate boar renderer declarations");
assert.strictEqual(countOccurrences(combatSource, "function createWolfRenderer("), 0, "combat.js should delegate wolf renderer declarations");
assert.strictEqual(countOccurrences(combatSource, "function updateBoarRenderer("), 0, "combat.js should delegate boar update declarations");
assert.strictEqual(countOccurrences(combatSource, "function updateWolfRenderer("), 0, "combat.js should delegate wolf update declarations");
assert.strictEqual(countOccurrences(combatEnemyRenderRuntimeSource, "function createBoarRenderer("), 1, "combat enemy render runtime should have one boar renderer declaration");
assert.strictEqual(countOccurrences(combatEnemyRenderRuntimeSource, "function createWolfRenderer("), 1, "combat enemy render runtime should have one wolf renderer declaration");
assert.strictEqual(countOccurrences(combatEnemyRenderRuntimeSource, "function updateBoarRenderer("), 1, "combat enemy render runtime should have one boar update declaration");
assert.strictEqual(countOccurrences(combatEnemyRenderRuntimeSource, "function updateWolfRenderer("), 1, "combat enemy render runtime should have one wolf update declaration");
assert.ok(!combatSource.includes("function createQuadrupedLimbRig("), "combat.js should not keep the dead quadruped limb rig helper generation");
assert.ok(!combatSource.includes("function poseQuadrupedLimbRig("), "combat.js should not keep the dead quadruped limb pose helper generation");
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
const qaWindow = { QA_COMBAT_DEBUG: true };
combatQaRuntime.recordPlayerPursuitDebug({
  windowRef: qaWindow,
  currentTick: 7,
  enemyState: { runtimeId: "enemy-a", enemyId: "enemy_rat" },
  pursuitState: "valid-path",
  pursuitPath: [{ x: 1, y: 1 }],
  occupancyIgnoredPath: [{ x: 2, y: 2 }, { x: 3, y: 3 }]
});
combatQaRuntime.recordAutoRetaliateSelection({
  windowRef: qaWindow,
  currentTick: 8,
  selection: { runtimeId: "enemy-b", enemyId: "enemy_boar", displayName: "Boar", distance: 2, combatLevel: 4, aggressorOrder: 3 }
});
combatQaRuntime.recordEnemyAttackResult({
  windowRef: qaWindow,
  currentTick: 9,
  attackerId: "enemy-b",
  enemyId: "enemy_boar",
  landed: true,
  damage: 2,
  isTrainingDummyAttack: false
});
combatQaRuntime.recordClearResult({ windowRef: qaWindow, currentTick: 10 }, "guard-clear");
combatQaRuntime.recordClearEvent({ windowRef: qaWindow }, { tick: 10, reason: "guard-clear" });
assert.strictEqual(qaWindow.__qaCombatDebugLastPlayerPursuitState.occupancyIgnoredPathLength, 2, "combat QA runtime should publish pursuit debug state");
assert.strictEqual(qaWindow.__qaCombatDebugLastAutoRetaliateSelection.aggressorOrder, 3, "combat QA runtime should publish auto-retaliate selection");
assert.strictEqual(qaWindow.__qaCombatDebugLastEnemyAttackResult.damage, 2, "combat QA runtime should publish enemy attack results");
assert.strictEqual(qaWindow.__qaCombatDebugLastClearReason, "guard-clear", "combat QA runtime should publish clear results");
assert.strictEqual(qaWindow.__qaCombatDebugClearEvents.length, 1, "combat QA runtime should retain clear history when debug is enabled");
combatQaRuntime.resetDebugState({ windowRef: qaWindow });
assert.strictEqual(qaWindow.__qaCombatDebugLastPlayerPursuitState, null, "combat QA runtime should reset pursuit debug state");
assert.strictEqual(qaWindow.__qaCombatDebugLastAutoRetaliateSelection, null, "combat QA runtime should reset auto-retaliate debug state");
const enemyAnimationDebug = combatQaRuntime.buildEnemyAnimationDebugState({
  enemyId: "enemy-a",
  frameNow: 125,
  combatEnemyRenderersById: {
    "enemy-a": {
      kind: "rat",
      animationRigId: "rat_rig",
      group: { rotation: { y: 1.25 } }
    }
  },
  getCombatEnemyState: () => ({
    runtimeId: "enemy-a",
    enemyId: "enemy_rat",
    currentState: "aggroed",
    x: 3,
    y: 4,
    z: 0,
    prevX: 2,
    prevY: 4,
    facingYaw: 1.2,
    locomotionIntentUntilAt: 200
  }),
  getEnemyDefinition: () => ({ displayName: "Rat" }),
  getEnemyVisualMoveProgress: () => 0.5,
  isEnemyVisuallyMoving: () => true,
  resolveEnemyAnimationSetDef: () => ({ rigId: "rat_rig" }),
  resolveEnemyAnimationSetId: () => "rat_basic",
  resolveEnemyModelPresetId: () => "rat",
  shouldEnemyUseWalkBaseClip: () => true
});
assert.strictEqual(enemyAnimationDebug.animationSetId, "rat_basic", "combat QA runtime should build enemy animation debug snapshots");
assert.strictEqual(enemyAnimationDebug.locomotionIntent.remainingMs, 75, "combat QA runtime should compute locomotion intent remaining time");
const enemyList = combatQaRuntime.listCombatEnemyStates({
  combatEnemyStates: [{ runtimeId: "enemy-a", enemyId: "enemy_rat", currentState: "idle", x: 1, y: 2, z: 0, currentHealth: 3 }],
  combatEnemyRenderersById: { "enemy-a": { hitbox: {} } },
  getEnemyDefinition: () => ({ displayName: "Rat" })
});
assert.strictEqual(enemyList[0].displayName, "Rat", "combat QA runtime should build enemy list snapshots");
assert.strictEqual(enemyList[0].rendered, true, "combat QA runtime should include render presence in enemy list snapshots");
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
