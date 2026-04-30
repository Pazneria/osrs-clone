const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "food-item-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const runtimeIndex = manifestSource.indexOf('id: "food-item-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(runtimeIndex !== -1, "legacy manifest should include food item runtime");
  assert(worldIndex !== -1 && runtimeIndex < worldIndex, "legacy manifest should load food item runtime before world.js");
  assert(runtimeSource.includes("window.FoodItemRuntime"), "food item runtime should expose a window runtime");
  assert(runtimeSource.includes("function eatItem(context = {}, invIndex)"), "food item runtime should own eating");
  assert(runtimeSource.includes("MAX_REASONABLE_EAT_COOLDOWN_TICKS"), "food item runtime should own impossible cooldown clamping");
  assert(runtimeSource.includes("You cannot eat on the same tick as attacking or casting."), "food item runtime should own same-tick combat restriction messaging");
  assert(worldSource.includes("const foodItemRuntime = window.FoodItemRuntime || null;"), "world.js should resolve food item runtime");
  assert(worldSource.includes("foodItemRuntime.eatItem(buildFoodItemRuntimeContext(), invIndex)"), "world.js should delegate eating");
  assert(!worldSource.includes("const MAX_REASONABLE_EAT_COOLDOWN_TICKS = 10;"), "world.js should not own eating cooldown policy");
  assert(!worldSource.includes("invSlot.amount -= 1;"), "world.js should not consume food inline");
  assert(!worldSource.includes("if (didAttackOrCastThisTick()) {"), "world.js should not own same-tick eating checks");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.FoodItemRuntime;
  assert(runtime, "food item runtime should be available after evaluation");

  function makeContext(overrides = {}) {
    const messages = [];
    const calls = [];
    const context = {
      currentTick: overrides.currentTick == null ? 100 : overrides.currentTick,
      playerState: Object.assign({
        currentHitpoints: 5,
        eatingCooldownEndTick: 0,
        lastAttackTick: null,
        lastCastTick: null,
        action: "IDLE"
      }, overrides.playerState || {}),
      inventory: overrides.inventory || [{
        amount: 1,
        itemData: {
          id: "shrimp",
          name: "Shrimp",
          type: "food",
          healAmount: 3,
          eatDelayTicks: 2
        }
      }],
      selectedUse: overrides.selectedUse || { invIndex: -1 },
      addChatMessage: (message, tone) => messages.push({ message, tone }),
      clearSelectedUse: (shouldRender) => calls.push(["clearSelectedUse", shouldRender]),
      applyHitpointHealing: (amount) => {
        calls.push(["applyHitpointHealing", amount]);
        return overrides.healed == null ? amount : overrides.healed;
      },
      updateStats: () => calls.push(["updateStats"]),
      renderInventory: () => calls.push(["renderInventory"])
    };
    return { context, messages, calls };
  }

  {
    const { context, messages, calls } = makeContext({
      playerState: { eatingCooldownEndTick: 999 }
    });
    assert(runtime.eatItem(context, 0) === true, "impossible cooldowns should be clamped and allow eating");
    assert(context.playerState.eatingCooldownEndTick === 102, "successful eating should set a fresh cooldown");
    assert(messages.some((entry) => entry.message === "You eat the Shrimp. (+3 HP)"), "successful eating should report healing");
    assert(calls.map((call) => call[0]).includes("renderInventory"), "successful eating should refresh inventory");
  }

  {
    const { context, messages } = makeContext({
      playerState: { lastAttackTick: 100 }
    });
    assert(runtime.eatItem(context, 0) === false, "same-tick attacks should block eating");
    assert(context.inventory[0].amount === 1, "blocked eating should leave the food in inventory");
    assert(context.playerState.eatingCooldownEndTick === 0, "blocked eating should not set a cooldown");
    assert(messages.some((entry) => entry.message === "You cannot eat on the same tick as attacking or casting."), "same-tick attacks should warn");
  }

  {
    const { context, messages } = makeContext({
      playerState: { action: "CAST:wind_strike" }
    });
    assert(runtime.eatItem(context, 0) === false, "active casting actions should block eating");
    assert(messages.some((entry) => entry.message === "You cannot eat on the same tick as attacking or casting."), "active casting should warn");
  }

  {
    const { context, calls } = makeContext({
      selectedUse: { invIndex: 0, itemId: "shrimp" }
    });
    assert(runtime.eatItem(context, 0) === true, "successful eating should consume selected food");
    assert(context.inventory[0] === null, "successful eating should clear depleted food slots");
    assert(calls.some((call) => call[0] === "clearSelectedUse" && call[1] === false), "successful eating should clear selected use for the consumed slot");
  }

  console.log("Food item runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
