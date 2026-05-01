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

function getBlockBody(source, startToken) {
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
  const combatEnemyMovementRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "combat-enemy-movement-runtime.js"), "utf8");

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
      && combatSource.includes("markPlayerRigAnimationTrigger('attackAnimationStartedAt');")
      && combatSource.includes("markPlayerRigAnimationTrigger('hitReactionTick', currentTick);")
      && combatSource.includes("markPlayerRigAnimationTrigger('hitReactionStartedAt');"),
    "combat runtime should drive the player rig animation markers used by the new combat feedback"
  );

  console.log("Combat training dummy guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
