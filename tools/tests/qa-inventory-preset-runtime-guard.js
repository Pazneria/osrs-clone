const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const qaToolsPath = path.join(root, "src", "js", "qa-tools-runtime.js");
  const qaToolsSource = read(root, "src/js/qa-tools-runtime.js");
  const qaCommandSource = read(root, "src/js/qa-command-runtime.js");
  const coreSource = read(root, "src/js/core.js");
  const packageSource = read(root, "package.json");

  assert(qaToolsSource.includes("function buildQaInventoryPresetSlots(context, presetName)"), "QA tools runtime should own inventory preset slot building");
  assert(qaToolsSource.includes("function applyQaInventoryPreset(context, presetName)"), "QA tools runtime should own inventory preset application");
  assert(qaToolsSource.includes("function makeFilledSlots(context, baseSlots, fillerItemId)"), "QA tools runtime should own full-inventory preset filling");
  assert(qaToolsSource.includes("getQaToolSlots"), "QA tools runtime should own shared QA tool loadout slots");
  assert(qaCommandSource.includes("callHook(context, 'applyQaInventoryPreset', trimmedArgs)"), "QA command runtime should dispatch presets through the QA callback surface");
  assert(coreSource.includes("qaToolsRuntime.applyQaInventoryPreset(buildQaToolsContext(), presetName)"), "core.js should delegate QA inventory presets through QA tools runtime");
  assert(coreSource.includes("setInventorySlots,"), "core QA context should provide inventory mutation as a narrow hook");
  assert(coreSource.includes("getActiveIconReviewBatch,"), "core QA context should provide icon review batch lookup as a narrow hook");
  assert(!coreSource.includes("function makeFilledSlots(baseSlots, fillerItemId)"), "core.js should not own QA full-inventory preset filling");
  assert(!coreSource.includes("function getQaToolSlots()"), "core.js should not own QA tool loadout slots");
  assert(!coreSource.includes("name === 'smith_smelt'"), "core.js should not own QA inventory preset tables");
  assert(packageSource.includes('"test:qa:inventory-presets"'), "package should expose a targeted QA inventory preset guard");

  const sandbox = { window: {} };
  vm.runInNewContext(qaToolsSource, sandbox, { filename: qaToolsPath });
  const runtime = sandbox.window.QaToolsRuntime;
  assert(runtime, "QA tools runtime should execute in isolation");
  assert(typeof runtime.buildQaInventoryPresetSlots === "function", "QA tools runtime should expose buildQaInventoryPresetSlots");
  assert(typeof runtime.applyQaInventoryPreset === "function", "QA tools runtime should expose applyQaInventoryPreset");

  const itemDb = {
    logs: { id: "logs" },
    raw_shrimp: { id: "raw_shrimp" },
    iron_axe: { id: "iron_axe" },
    iron_pickaxe: { id: "iron_pickaxe" },
    small_net: { id: "small_net" },
    tinderbox: { id: "tinderbox" },
    knife: { id: "knife" },
    fishing_rod: { id: "fishing_rod" },
    harpoon: { id: "harpoon" },
    rune_harpoon: { id: "rune_harpoon" },
    bait: { id: "bait" },
    coins: { id: "coins" },
    hammer: { id: "hammer" },
    bronze_bar: { id: "bronze_bar" }
  };
  const fishFull = runtime.buildQaInventoryPresetSlots({ ITEM_DB: itemDb }, "fish_full");
  assert(fishFull.length === 28, "fish_full should fill the inventory");
  assert(fishFull.some((slot) => slot.itemId === "rune_harpoon"), "fish_full should include rune harpoon");
  assert(fishFull.filter((slot) => slot.itemId === "raw_shrimp").length > 0, "fish_full should use shrimp filler");

  const smithFullInv = runtime.buildQaInventoryPresetSlots({ ITEM_DB: itemDb }, "smith_fullinv");
  assert(smithFullInv.length === 28, "smith_fullinv should fill the inventory");
  assert(smithFullInv.some((slot) => slot.itemId === "bronze_bar"), "smith_fullinv should include bronze bar");

  const iconSlots = runtime.buildQaInventoryPresetSlots({
    ITEM_DB: itemDb,
    getActiveIconReviewBatch: () => ({ itemIds: ["hammer", "coins"] })
  }, "icons");
  assert(iconSlots.map((slot) => slot.itemId).join(",") === "hammer,coins", "icons preset should read the active icon review batch");

  const appliedSlots = [];
  const messages = [];
  const applied = runtime.applyQaInventoryPreset({
    ITEM_DB: itemDb,
    setInventorySlots: (slots) => appliedSlots.push(...slots),
    addChatMessage: (message, type) => messages.push({ message, type })
  }, "fish_rod");
  assert(applied === true, "known QA inventory presets should apply");
  assert(appliedSlots.some((slot) => slot.itemId === "fishing_rod"), "applied fish_rod preset should include fishing rod");
  assert(messages.some((entry) => entry.message === "QA preset applied: fish_rod" && entry.type === "info"), "applying a preset should emit QA feedback");
  assert(runtime.applyQaInventoryPreset({ ITEM_DB: itemDb }, "unknown") === false, "unknown QA inventory presets should fail cleanly");

  const handlers = runtime.createCommandHandlers({
    ITEM_DB: itemDb,
    setInventorySlots: (slots) => appliedSlots.push(...slots),
    addChatMessage: (message, type) => messages.push({ message, type })
  });
  assert(typeof handlers.applyQaInventoryPreset === "function", "QA command handlers should include inventory preset application");
  assert(handlers.applyQaInventoryPreset("default") === true, "QA command handlers should apply inventory presets through runtime ownership");

  console.log("QA inventory preset runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
