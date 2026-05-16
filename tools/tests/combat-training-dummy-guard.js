const assert = require("assert");
const path = require("path");
const { readRepoFile } = require("./repo-file-test-utils");
const { getBlockBody, getFunctionBody } = require("./source-block-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const combatSource = readRepoFile(root, "src/js/combat.js");
  const combatEnemyMovementRuntimeSource = readRepoFile(root, "src/js/combat-enemy-movement-runtime.js");

  assert(
    combatSource.includes("function isTrainingDummyEnemy(enemyStateOrId) {"),
    "combat.js should expose a training dummy helper"
  );

  const resolveAttackBatchBody = getFunctionBody(combatSource, "resolveAttackBatch");
  assert(resolveAttackBatchBody, "combat.js should define resolveAttackBatch");
  assert(
    resolveAttackBatchBody.includes("const isTrainingDummyAttack = isTrainingDummyEnemy(enemyState);")
      && resolveAttackBatchBody.includes("? true")
      && resolveAttackBatchBody.includes("? 0")
      && resolveAttackBatchBody.includes("markPlayerRigAnimationTrigger('hitReactionTick', currentTick);"),
    "training dummy enemy attacks should always land for feedback, deal zero damage, and enemy attack results should trigger hit reaction feedback"
  );

  const updateEnemyMovementBody = getFunctionBody(combatEnemyMovementRuntimeSource, "updateEnemyMovement");
  assert(updateEnemyMovementBody, "combat enemy movement runtime should define updateEnemyMovement");
  const trainingDummyMovementBody = getBlockBody(updateEnemyMovementBody, "if (typeof context.isTrainingDummyEnemy === 'function' && context.isTrainingDummyEnemy(enemyState))");
  assert(
    trainingDummyMovementBody
      && trainingDummyMovementBody.includes("context.faceEnemyTowards(enemyState, playerState)")
      && trainingDummyMovementBody.includes("reservedTiles.add(`${enemyState.x},${enemyState.y},${enemyState.z}`);")
      && !trainingDummyMovementBody.includes("context.moveEnemyToStep(enemyState, nextStep);"),
    "training dummy enemies should stay rooted while still facing the player"
  );

  assert(
    combatSource.includes("markPlayerRigAnimationTrigger('attackTick', currentTick);")
      && combatSource.includes("markPlayerRigAttackStyle(result.styleFamily);")
      && combatSource.includes("markPlayerRigAnimationTrigger('attackAnimationStartedAt');")
      && combatSource.includes("markPlayerRigAnimationTrigger('hitReactionTick', currentTick);")
      && combatSource.includes("markPlayerRigAnimationTrigger('hitReactionStartedAt');"),
    "combat runtime should drive the player rig animation markers and attack style used by combat feedback"
  );
  assert(
    combatSource.indexOf("consumePlayerCombatAmmo(result);") < combatSource.indexOf("markPlayerRigAnimationTrigger('attackAnimationStartedAt');"),
    "equipped-ammo model refresh should happen before attack animation markers are written to the live rig"
  );
  assert(
    combatSource.includes("function spawnPlayerRangedProjectile")
      && combatSource.includes("runtime.spawnRangedProjectile({"),
    "combat runtime should hand ranged projectile visuals to the transient visual runtime"
  );

  console.log("Combat training dummy guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
