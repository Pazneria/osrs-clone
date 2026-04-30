const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "player-hitpoints-runtime.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const formulasSource = fs.readFileSync(path.join(root, "src", "game", "combat", "formulas.ts"), "utf8");
  const bridgeSource = fs.readFileSync(path.join(root, "src", "game", "platform", "combat-bridge.ts"), "utf8");
  const hitpointsRuntimeIndex = manifestSource.indexOf('id: "player-hitpoints-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');
  const combatIndex = manifestSource.indexOf('id: "combat"');

  assert(hitpointsRuntimeIndex !== -1, "legacy manifest should include the player hitpoints runtime");
  assert(worldIndex !== -1 && combatIndex !== -1, "legacy manifest should include world and combat scripts");
  assert(hitpointsRuntimeIndex < worldIndex && hitpointsRuntimeIndex < combatIndex, "legacy manifest should load player hitpoints runtime before world/combat consumers");
  assert(runtimeSource.includes("window.PlayerHitpointsRuntime"), "player hitpoints runtime should expose a window runtime");
  assert(runtimeSource.includes("function getMaxHitpoints(context = {})"), "player hitpoints runtime should own max-hitpoints lookup");
  assert(runtimeSource.includes("function applyHitpointHealing(context = {}, healAmount)"), "player hitpoints runtime should own healing mutation");
  assert(runtimeSource.includes("function applyHitpointDamage(context = {}, damageAmount, minHitpoints = 0)"), "player hitpoints runtime should own damage mutation");
  assert(formulasSource.includes("export function clampPlayerCurrentHitpoints"), "typed combat formulas should own hitpoint clamping");
  assert(formulasSource.includes("export function applyPlayerHitpointHealing"), "typed combat formulas should own healing math");
  assert(formulasSource.includes("export function applyPlayerHitpointDamage"), "typed combat formulas should own damage math");
  assert(bridgeSource.includes("applyPlayerHitpointHealing") && bridgeSource.includes("applyPlayerHitpointDamage"), "combat bridge should expose typed hitpoint helpers");
  assert(worldSource.includes("const playerHitpointsRuntime = window.PlayerHitpointsRuntime || null;"), "world.js should resolve the player hitpoints runtime");
  assert(worldSource.includes("function buildPlayerHitpointsRuntimeContext()"), "world.js should adapt state into the hitpoints runtime");
  assert(worldSource.includes("playerHitpointsRuntime.getCurrentHitpoints(buildPlayerHitpointsRuntimeContext())"), "world.js should delegate current-hitpoints lookup");
  assert(worldSource.includes("playerHitpointsRuntime.applyHitpointDamage(buildPlayerHitpointsRuntimeContext(), damageAmount, minHitpoints)"), "world.js should delegate damage mutation");
  assert(!worldSource.includes("playerState.currentHitpoints = Math.max(0, Math.min(maxHitpoints, Math.floor(playerState.currentHitpoints)));"), "world.js should not clamp current hitpoints inline");
  assert(!worldSource.includes("const healed = Math.min(requestedHeal, Math.max(0, maxHitpoints - currentHitpoints));"), "world.js should not compute healing inline");
  assert(!worldSource.includes("const dealt = Math.min(requestedDamage, maxDamage);"), "world.js should not compute damage inline");

  global.window = {
    CombatRuntime: {
      computePlayerMaxHitpoints: () => 12,
      clampPlayerCurrentHitpoints: (current, max) => Math.max(0, Math.min(max, Number.isFinite(current) ? Math.floor(current) : max)),
      applyPlayerHitpointHealing: (current, max, amount) => {
        const base = Math.max(0, Math.min(max, Number.isFinite(current) ? Math.floor(current) : max));
        const healed = Math.min(Math.max(0, Math.floor(amount)), max - base);
        return { currentHitpoints: base + healed, healed };
      },
      applyPlayerHitpointDamage: (current, max, amount, minimum) => {
        const base = Math.max(0, Math.min(max, Number.isFinite(current) ? Math.floor(current) : max));
        const min = Math.max(0, Math.min(max, Math.floor(minimum)));
        const dealt = Math.min(Math.max(0, Math.floor(amount)), Math.max(0, base - min));
        return { currentHitpoints: base - dealt, dealt };
      }
    }
  };
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "player-hitpoints-runtime.js") });
  const runtime = window.PlayerHitpointsRuntime;
  assert(runtime, "player hitpoints runtime should be available after evaluation");

  const playerState = { currentHitpoints: 5 };
  const context = {
    playerSkills: { hitpoints: { level: 12, xp: 0 } },
    playerState
  };
  assert(runtime.getMaxHitpoints(context) === 12, "runtime should use combat max-hitpoints helper");
  assert(runtime.applyHitpointHealing(context, 20) === 7, "runtime should cap healing at max hitpoints");
  assert(playerState.currentHitpoints === 12, "runtime should write healed hitpoints back to player state");
  assert(runtime.applyHitpointDamage(context, 20, 1) === 11, "runtime should respect damage minimum hitpoints");
  assert(playerState.currentHitpoints === 1, "runtime should write damaged hitpoints back to player state");

  console.log("Player hitpoints runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
