const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getFunctionBody(source, functionName) {
  const startToken = `function ${functionName}(`;
  const startIndex = source.indexOf(startToken);
  if (startIndex === -1) return "";
  const bodyStart = source.indexOf("{", startIndex);
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
  const inputRenderSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");

  const lockTargetBody = getFunctionBody(combatSource, "lockPlayerCombatTarget");
  assert(lockTargetBody, "combat.js should define lockPlayerCombatTarget");
  assert(
    !lockTargetBody.includes("playerState.inCombat = true;"),
    "locking a target should not mark the player in-combat before any attack resolves"
  );

  const moveTowardTargetBody = getFunctionBody(combatSource, "movePlayerTowardLockedTarget");
  assert(moveTowardTargetBody, "combat.js should define movePlayerTowardLockedTarget");
  assert(
    !moveTowardTargetBody.includes("playerState.inCombat = true;"),
    "pursuing or facing a locked target should not mark the player in-combat before an attack"
  );

  assert(
    combatSource.includes("if (result.attackerKind === 'player') {")
      && combatSource.includes("playerState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));")
      && combatSource.includes("playerState.inCombat = true;"),
    "player combat state should flip in-combat when an actual player attack resolves"
  );
  assert(
    combatSource.includes("enemyState.remainingAttackCooldown = Math.max(1, Math.floor(result.tickCycle));")
      && combatSource.includes("playerState.lastDamagerEnemyId = enemyState.runtimeId;")
      && combatSource.includes("playerState.inCombat = true;"),
    "player combat state should flip in-combat when an enemy attack resolves"
  );

  assert(
    inputRenderSource.includes("window.lockPlayerCombatTarget(enemyRuntimeId);"),
    "enemy interactions should still lock the selected target for pursuit"
  );
  const lockedEnemyBody = getFunctionBody(combatSource, "getPlayerLockedEnemy");
  assert(lockedEnemyBody, "combat.js should define getPlayerLockedEnemy");
  assert(
    lockedEnemyBody.includes("if (!playerState.lockedTargetId) return null;")
      && !lockedEnemyBody.includes("playerState.combatTargetKind !== PLAYER_TARGET_KIND"),
    "locked enemy resolution should rely on lockedTargetId directly instead of extra combat-target-kind gating"
  );
  const currentWorldIdBody = getFunctionBody(combatSource, "getCurrentWorldId");
  assert(currentWorldIdBody, "combat.js should define getCurrentWorldId");
  assert(
    currentWorldIdBody.includes("window.LegacyWorldAdapterRuntime")
      && currentWorldIdBody.includes("resolveKnownWorldId")
      && currentWorldIdBody.includes("fallbackWorldId"),
    "combat world-id lookup should resolve through known-world normalization with fallback to prevent transient world-id flicker resets"
  );
  const ensureWorldBody = getFunctionBody(combatSource, "ensureCombatEnemyWorldReady");
  assert(ensureWorldBody, "combat.js should define ensureCombatEnemyWorldReady");
  assert(
    combatSource.includes("function initCombatWorldState(worldIdOverride = null)")
      && ensureWorldBody.includes("if (!activeCombatWorldId)")
      && ensureWorldBody.includes("initCombatWorldState(currentWorldId);"),
    "combat world initialization should occur once when uninitialized and avoid per-tick world-id reset churn"
  );
  const initLogicalMapBody = getFunctionBody(worldSource, "initLogicalMap");
  const appendChunkWaterBody = getFunctionBody(worldSource, "appendChunkWaterTilesToBuilders");
  assert(
    initLogicalMapBody.includes("if (typeof window.initCombatWorldState === 'function') window.initCombatWorldState();")
      && !appendChunkWaterBody.includes("initCombatWorldState"),
    "world chunk water builder should not trigger combat-world reinitialization; combat init should happen at logical-map initialization"
  );
  assert(
    combatSource.includes("function clearPlayerCombatTarget(")
      && combatSource.includes("playerState.remainingAttackCooldown = 0;"),
    "clearing combat targets should reset player attack cooldown so pre-engagement tracking stays timer-free"
  );
  assert(
    combatSource.includes("function shouldPreservePreEngagementTargetLock() {")
      && combatSource.includes("if (!forced && shouldPreservePreEngagementTargetLock()) {")
      && combatSource.includes("return false;"),
    "clearing combat target should preserve active pre-engagement enemy pursuit unless explicitly forced"
  );
  assert(
    inputRenderSource.includes("window.clearPlayerCombatTarget({ force: true, reason: 'queue-walk' });")
      && inputRenderSource.includes("window.clearPlayerCombatTarget({ force: true, reason: 'queue-interact-non-enemy' });"),
    "explicit non-combat actions should force-clear the enemy lock"
  );
  assert(
    combatSource.includes("if (!playerState.inCombat) {")
      && combatSource.includes("playerState.remainingAttackCooldown = 0;")
      && combatSource.includes("} else {")
      && combatSource.includes("combatRuntime.decrementCooldown(playerState.remainingAttackCooldown || 0);"),
    "player cooldown should only tick while combat is active and stay zero outside combat"
  );
  assert(
    worldSource.includes("const MAX_REASONABLE_EAT_COOLDOWN_TICKS = 10;")
      && worldSource.includes("if ((cooldownEndTick - currentTick) > MAX_REASONABLE_EAT_COOLDOWN_TICKS) {")
      && worldSource.includes("playerState.eatingCooldownEndTick = currentTick;"),
    "eat handling should self-heal impossible cooldown values so stale state cannot lock food usage for long durations"
  );
  assert(
    worldSource.includes("if (didAttackOrCastThisTick()) {")
      && worldSource.includes("You cannot eat on the same tick as attacking or casting."),
    "eat handling should keep same-tick attack/cast restrictions"
  );
  const validateLockBody = getFunctionBody(combatSource, "validatePlayerTargetLock");
  assert(validateLockBody, "combat.js should define validatePlayerTargetLock");
  assert(
    validateLockBody.includes("clearPlayerCombatTarget({ reason: 'missing-locked-enemy' });")
      && validateLockBody.includes("clearPlayerCombatTarget({ force: true, reason: 'locked-enemy-not-alive' });")
      && validateLockBody.includes("pursuitPath: null"),
    "player target lock should only clear when target is truly missing/dead and should preserve pursuit when path sampling fails"
  );

  console.log("Combat engagement guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
