const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getFunctionBody(source, functionName) {
  const startToken = `function ${functionName}(`;
  const startIndex = source.indexOf(startToken);
  if (startIndex === -1) return "";
  const paramsEnd = source.indexOf(")", startIndex);
  const bodyStart = paramsEnd === -1 ? -1 : source.indexOf("{", paramsEnd);
  if (bodyStart === -1) return "";
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    const char = source[i];
    if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(bodyStart + 1, i);
  }
  return "";
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const combatSource = fs.readFileSync(path.join(root, "src", "js", "combat.js"), "utf8");
  const combatEngagementRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "combat-engagement-runtime.js"), "utf8");
  const combatEnemyMovementRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "combat-enemy-movement-runtime.js"), "utf8");
  const combatEnemyOverlayRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "combat-enemy-overlay-runtime.js"), "utf8");
  const combatQaDebugSource = fs.readFileSync(path.join(root, "src", "js", "combat-qa-debug-runtime.js"), "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const inputRenderSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const inputPathfindingRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-pathfinding-runtime.js"), "utf8");
  const inputTickMovementRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-tick-movement-runtime.js"), "utf8");
  const inputActionQueueRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "input-action-queue-runtime.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const foodItemRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "food-item-runtime.js"), "utf8");

  const lockTargetBody = getFunctionBody(combatSource, "lockPlayerCombatTarget");
  assert(lockTargetBody, "combat.js should define lockPlayerCombatTarget");
  assert(
    !lockTargetBody.includes("playerState.inCombat = true;"),
    "locking a target should not mark the player in-combat before any attack resolves"
  );

  const moveTowardTargetBody = getFunctionBody(combatEngagementRuntimeSource, "movePlayerTowardLockedTarget");
  assert(moveTowardTargetBody, "combat engagement runtime should define movePlayerTowardLockedTarget");
  assert(
    !moveTowardTargetBody.includes("playerState.inCombat = true;"),
    "pursuing or facing a locked target should not mark the player in-combat before an attack"
  );
  assert(
    moveTowardTargetBody.includes("const temporaryBlockState = context.playerPursuitStateTemporaryBlock || 'temporary-block';")
      && moveTowardTargetBody.includes("if (playerLockState.pursuitState === temporaryBlockState) {")
      && moveTowardTargetBody.includes("playerState.path = [];")
      && moveTowardTargetBody.includes("playerState.action = 'COMBAT: MELEE';"),
    "temporary occupancy blocks should keep the lock while stopping stale pursuit movement"
  );
  assert(
    combatSource.includes("getCombatEngagementRuntime().movePlayerTowardLockedTarget(buildCombatEngagementRuntimeContext(), playerLockState, attackedThisTick);"),
    "combat.js should delegate player pursuit action shaping to the engagement runtime"
  );

  const chaseAttackOpportunityBody = getFunctionBody(combatEnemyMovementRuntimeSource, "resolvePlayerChaseAttackOpportunity");
  assert(chaseAttackOpportunityBody, "combat enemy movement runtime should define resolvePlayerChaseAttackOpportunity");
  assert(
    chaseAttackOpportunityBody.includes("const stepBudget = Math.max(1, Math.floor(getPlayerCombatMovementStepCount(context)));")
      && chaseAttackOpportunityBody.includes("!context.isWithinMeleeRange(attackTile, playerLockState.enemyState)"),
    "combat chase attacks should check whether the player's within-tick movement reaches melee range"
  );

  const idleEnemyMovementBody = getFunctionBody(combatEnemyMovementRuntimeSource, "updateIdleEnemyMovement");
  assert(idleEnemyMovementBody, "combat enemy movement runtime should define updateIdleEnemyMovement");
  assert(
    idleEnemyMovementBody.includes("const nextStep = idlePath[0];"),
    "idle enemy roaming should continue to advance at one tile per tick"
  );

  const updateEnemyMovementBody = getFunctionBody(combatEnemyMovementRuntimeSource, "updateEnemyMovement");
  assert(updateEnemyMovementBody, "combat enemy movement runtime should define updateEnemyMovement");
  assert(
    updateEnemyMovementBody.includes("const homeStep = returnPath[0];")
      && updateEnemyMovementBody.includes("const nextStep = pursuitPath[0];"),
    "enemy return and pursuit movement should continue to advance one tile per tick"
  );
  assert(
    combatSource.includes("getCombatEnemyMovementRuntime().updateEnemyMovement(buildCombatEnemyMovementRuntimeContext(), attacks);"),
    "combat.js should delegate enemy movement orchestration to the movement runtime"
  );

  assert(
    combatSource.includes("if (result.attackerKind === 'player') {")
      && combatSource.includes("playerState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));")
      && combatSource.includes("playerState.inCombat = true;"),
    "player combat state should flip in-combat when an actual player attack resolves"
  );
  assert(
    combatSource.includes("const chaseAttackOpportunity = resolvePlayerChaseAttackOpportunity(playerLockState);")
      && combatSource.includes("approachPath: chaseAttackOpportunity.approachPath")
      && combatSource.includes("playerState.path = (playerAttackResult && Array.isArray(playerAttackResult.approachPath) && playerAttackResult.approachPath.length > 0)"),
    "player melee attacks should be able to resolve off the same-tick chase approach and keep the approach movement so running can catch moving enemies"
  );
  assert(
    combatSource.includes("enemyState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));")
      && combatSource.includes("playerState.lastDamagerEnemyId = enemyState.runtimeId;")
      && combatSource.includes("playerState.inCombat = true;"),
    "player combat state should flip in-combat when an enemy attack resolves"
  );

  assert(
    inputRenderSource.includes("lockPlayerCombatTarget: (typeof window.lockPlayerCombatTarget === 'function') ? window.lockPlayerCombatTarget : null")
      && inputTickMovementRuntimeSource.includes("context.lockPlayerCombatTarget(enemyRuntimeId);"),
    "enemy interactions should still lock the selected target for pursuit"
  );
  assert(
    inputTickMovementRuntimeSource.includes("const stepsToTake = context.isRunning ? 2 : 1;"),
    "running should continue to move the player two tiles per tick so roaming enemies remain catchable"
  );

  const clearTargetBody = getFunctionBody(combatSource, "clearPlayerCombatTarget");
  assert(clearTargetBody, "combat.js should define clearPlayerCombatTarget");
  assert(
    clearTargetBody.includes("const shouldResetCooldown = !!(opts && opts.resetCooldown);")
      && clearTargetBody.includes("if (shouldResetCooldown) playerState.remainingAttackCooldown = 0;"),
    "clearing combat targets should preserve active cooldowns unless an explicit hard reset asks to zero them"
  );
  assert(
    clearTargetBody.includes("if (hadEnemyTarget) playerState.path = [];"),
    "clearing an enemy target should stop stale pursuit paths immediately"
  );
  assert(
    combatSource.includes("function shouldPreservePreEngagementTargetLock() {")
      && combatSource.includes("if (!forced && shouldPreservePreEngagementTargetLock()) {")
      && combatSource.includes("return false;"),
    "clearing combat target should preserve active pre-engagement enemy pursuit unless explicitly forced"
  );
  assert(
    inputRenderSource.includes("InputActionQueueRuntime")
      && inputActionQueueRuntimeSource.includes("clearPlayerCombatTarget({ force: true, reason: 'queue-walk' });")
      && inputActionQueueRuntimeSource.includes("clearPlayerCombatTarget({ force: true, reason: 'queue-interact-non-enemy' });"),
    "explicit non-combat actions should force-clear the enemy lock"
  );

  assert(
    combatSource.includes("playerState.remainingAttackCooldown = combatRuntime.decrementCooldown(playerState.remainingAttackCooldown || 0);")
      && !combatSource.includes("if (!playerState.inCombat) {\n            playerState.remainingAttackCooldown = 0;\n        } else {"),
    "player cooldown should keep ticking after lock clears instead of being gated only by playerState.inCombat"
  );

  const validateLockBody = getFunctionBody(combatEngagementRuntimeSource, "validatePlayerTargetLock");
  assert(validateLockBody, "combat engagement runtime should define validatePlayerTargetLock");
  assert(
    validateLockBody.includes("const occupancyIgnoredPursuitPath = typeof context.resolvePathToEnemy === 'function'")
      && validateLockBody.includes("ignoreCombatEnemyOccupancy: true")
      && validateLockBody.includes("temporaryBlockState")
      && validateLockBody.includes("context.clearPlayerCombatTarget({ force: true, reason: 'locked-enemy-hard-no-path' });"),
    "player target validation should distinguish temporary occupancy blockage from true hard no-path failures"
  );
  assert(
    inputRenderSource.includes("InputPathfindingRuntime")
      && inputPathfindingRuntimeSource.includes("function getPathTileId(")
      && inputPathfindingRuntimeSource.includes("opts && opts.ignoreCombatEnemyOccupancy")
      && inputPathfindingRuntimeSource.includes("function isStandableTileForPath("),
    "pathfinding should support occupancy-ignored path sampling without changing normal walkability rules"
  );

  assert(
    combatEngagementRuntimeSource.includes("function pickAutoRetaliateTarget(context = {})")
      && combatSource.includes("markEnemyAutoRetaliateAggressor(enemyState);")
      && combatEngagementRuntimeSource.includes("const leftOrder = Number.isFinite(left.autoRetaliateAggressorOrder)")
      && combatEngagementRuntimeSource.includes("const leftDistance = typeof context.getChebyshevDistance === 'function'")
      && combatEngagementRuntimeSource.includes("context.getAutoRetaliateCandidateCombatLevel(left)")
      && combatEngagementRuntimeSource.includes("localeCompare")
      && !combatSource.includes("lockPlayerCombatTarget(playerAttackers[0]);"),
    "auto-retaliate should be explicit and deterministic instead of choosing the first attacker array entry"
  );

  assert(
    combatQaDebugSource.includes("pursuit: pursuitDebugState")
      && combatQaDebugSource.includes("autoRetaliate: autoRetaliateDebugState")
      && combatQaDebugSource.includes("[QA combatdbg] pursuit state=")
      && combatQaDebugSource.includes("[QA combatdbg] autoRetaliate target=")
      && coreSource.includes("buildCombatQaDebugContext"),
    "QA combat debug output should surface pursuit-state and auto-retaliate selection details"
  );

  assert(
    combatSource.includes("const shouldSetOpeningCooldown = enemyState.currentState !== 'aggroed' || enemyState.lockedTargetId !== PLAYER_TARGET_ID;")
      && combatSource.includes("if (shouldSetOpeningCooldown) enemyState.remainingAttackCooldown = 1;"),
    "hit-aggro should keep setting an enemy's opening cooldown to one tick"
  );

  assert(
    combatSource.includes("function isPlayerCombatFacingReady() {")
      && combatSource.includes("if (playerState.midX !== null || playerState.midY !== null) return false;")
      && combatSource.includes("if (playerState.x !== playerState.prevX || playerState.y !== playerState.prevY) return false;")
      && combatSource.includes("if (Array.isArray(playerState.path) && playerState.path.length > 0) return false;")
      && combatSource.includes("if (!isPlayerCombatFacingReady()) return;"),
    "combat-facing should wait until the player is visually settled on the destination tile before snapping"
  );
  assert(
    combatSource.includes("enemyState.pendingDefeatAtTick = currentTick;")
      && combatSource.includes("if (isEnemyPendingDefeat(enemyState) && currentTick > enemyState.pendingDefeatAtTick) {")
      && combatSource.includes("const defeatTick = Number.isFinite(enemyState && enemyState.pendingDefeatAtTick)")
      && combatSource.includes("enemyState.respawnAtTick = defeatTick + Math.max(1, Math.floor("),
    "enemy defeats should linger through the attack tick, then resolve on the following tick without stretching respawn timing"
  );
  assert(
    combatEnemyOverlayRuntimeSource.includes("const isVisibleEnemy = isEnemyAlive(enemyState) || isEnemyPendingDefeat(enemyState);")
      && combatEnemyOverlayRuntimeSource.includes("if (!isVisibleEnemy) return false;"),
    "enemy hitpoint bars should remain visible through the pending-defeat tick so the bar can drain to empty before despawn"
  );

  assert(
    foodItemRuntimeSource.includes("const MAX_REASONABLE_EAT_COOLDOWN_TICKS = 10;")
      && foodItemRuntimeSource.includes("if ((cooldownEndTick - currentTick) > MAX_REASONABLE_EAT_COOLDOWN_TICKS) {")
      && foodItemRuntimeSource.includes("playerState.eatingCooldownEndTick = currentTick;"),
    "eat handling should self-heal impossible cooldown values so stale state cannot lock food usage for long durations"
  );
  assert(
    foodItemRuntimeSource.includes("if (didAttackOrCastThisTick(context)) {")
      && foodItemRuntimeSource.includes("You cannot eat on the same tick as attacking or casting."),
    "eat handling should keep same-tick attack/cast restrictions"
  );
  assert(
    worldSource.includes("foodItemRuntime.eatItem(buildFoodItemRuntimeContext(), invIndex)")
      && !worldSource.includes("invSlot.amount -= 1;"),
    "world.js should delegate food consumption through the food item runtime"
  );

  console.log("Combat engagement guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
