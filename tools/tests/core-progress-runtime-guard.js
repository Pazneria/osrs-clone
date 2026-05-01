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
  const runtimePath = path.join(root, "src", "js", "core-progress-runtime.js");
  const runtimeSource = read(root, "src/js/core-progress-runtime.js");
  const coreSource = read(root, "src/js/core.js");
  const manifestSource = read(root, "src/game/platform/legacy-script-manifest.ts");
  const runtimeIndex = manifestSource.indexOf('id: "core-progress-runtime"');
  const coreIndex = manifestSource.indexOf('id: "core"');

  assert(runtimeIndex !== -1, "legacy manifest should include core progress runtime");
  assert(coreIndex !== -1 && runtimeIndex < coreIndex, "legacy manifest should load core progress runtime before core.js");
  assert(runtimeSource.includes("window.CoreProgressRuntime"), "core progress runtime should expose a window runtime");
  assert(runtimeSource.includes("function serializeInventorySlot(context = {}, slot)"), "runtime should own inventory slot serialization");
  assert(runtimeSource.includes("function deserializeItemArray(context = {}, savedSlots, size)"), "runtime should own item array deserialization");
  assert(runtimeSource.includes("function serializeEquipmentState(context = {})"), "runtime should own equipment serialization");
  assert(runtimeSource.includes("function sanitizeSkillState(context = {}, savedSkills)"), "runtime should own skill save sanitization");
  assert(runtimeSource.includes("function serializeAppearanceState(context = {})"), "runtime should own appearance serialization");

  assert(coreSource.includes("const coreProgressRuntime = window.CoreProgressRuntime || null;"), "core.js should resolve core progress runtime");
  assert(coreSource.includes("function buildCoreProgressRuntimeContext()"), "core.js should adapt progress codec context narrowly");
  assert(coreSource.includes("getCoreProgressRuntime().serializeItemArray(buildCoreProgressRuntimeContext(), slots)"), "core.js should delegate item array serialization");
  assert(coreSource.includes("getCoreProgressRuntime().deserializeItemArray(buildCoreProgressRuntimeContext(), savedSlots, size)"), "core.js should delegate item array deserialization");
  assert(coreSource.includes("getCoreProgressRuntime().serializeEquipmentState(buildCoreProgressRuntimeContext())"), "core.js should delegate equipment serialization");
  assert(coreSource.includes("getCoreProgressRuntime().sanitizeSkillState(buildCoreProgressRuntimeContext(), savedSkills)"), "core.js should delegate skill save sanitization");
  assert(coreSource.includes("getCoreProgressRuntime().serializeAppearanceState(buildCoreProgressRuntimeContext())"), "core.js should delegate appearance save serialization");
  assert(!coreSource.includes("return value.trim().toLowerCase();"), "core.js should not own item id normalization inline");
  assert(!coreSource.includes("const restored = Array(size).fill(null);"), "core.js should not own item array deserialization inline");
  assert(!coreSource.includes("const colorsIn = Array.isArray(savedAppearance.colors) ? savedAppearance.colors : [];"), "core.js should not own appearance sanitization inline");

  const sandbox = { window: {} };
  vm.runInNewContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CoreProgressRuntime;
  assert(runtime, "core progress runtime should execute in isolation");
  assert(typeof runtime.serializeItemArray === "function", "runtime should expose serializeItemArray");
  assert(typeof runtime.deserializeEquipmentState === "function", "runtime should expose deserializeEquipmentState");
  assert(typeof runtime.sanitizeSkillState === "function", "runtime should expose sanitizeSkillState");

  const itemDb = {
    coins: { id: "coins", stackable: true },
    bronze_sword: { id: "bronze_sword", stackable: false }
  };
  const context = {
    ITEM_DB: itemDb,
    equipment: { weapon: itemDb.bronze_sword, shield: null },
    playerSkills: {
      attack: { xp: 0, level: 1 },
      hitpoints: { xp: 1154, level: 10 }
    },
    maxSkillLevel: 99,
    getLevelForXp: (xp) => (xp >= 200 ? 3 : 1),
    windowRef: {
      playerAppearanceState: { gender: 1, colors: [1, 2, 3, 4, 5, 6] }
    }
  };

  const serializedItems = runtime.serializeItemArray(context, [
    { itemData: itemDb.coins, amount: 42.9 },
    { itemData: { id: "missing" }, amount: 1 },
    null
  ]);
  assert(serializedItems[0].itemId === "coins" && serializedItems[0].amount === 42, "runtime should serialize valid stack amounts");
  assert(serializedItems[1] === null && serializedItems[2] === null, "runtime should null invalid item slots");

  const restoredItems = runtime.deserializeItemArray(context, [
    { itemId: "coins", amount: 8 },
    { itemId: "bronze_sword", amount: 99 },
    { itemId: "missing", amount: 1 }
  ], 4);
  assert(restoredItems.length === 4, "runtime should restore fixed-size item arrays");
  assert(restoredItems[0].amount === 8, "runtime should restore stackable amounts");
  assert(restoredItems[1].amount === 1, "runtime should clamp non-stackable amounts to one");
  assert(restoredItems[2] === null && restoredItems[3] === null, "runtime should null missing and padded slots");

  const serializedEquipment = runtime.serializeEquipmentState(context);
  assert(serializedEquipment.weapon === "bronze_sword" && serializedEquipment.shield === null, "runtime should serialize equipment by slot");
  const restoredEquipment = runtime.deserializeEquipmentState(context, { weapon: "coins", shield: "missing" });
  assert(restoredEquipment.weapon === itemDb.coins && restoredEquipment.shield === null, "runtime should restore equipment from item db");

  const prefs = runtime.sanitizeUserItemPrefs({ coins: "Use", bad: 7, "": "Drop" });
  assert(prefs.coins === "Use" && !("bad" in prefs) && !("" in prefs), "runtime should sanitize user item preferences");

  const skills = runtime.sanitizeSkillState(context, {
    attack: { xp: 250, level: 99 },
    hitpoints: { xp: -10, level: 0 }
  });
  assert(skills.attack.xp === 250 && skills.attack.level === 3, "runtime should derive levels from xp when a resolver is provided");
  assert(skills.hitpoints.xp === 0 && skills.hitpoints.level === 1, "runtime should clamp invalid saved skill values");

  const appearance = runtime.sanitizeAppearanceState(context, { gender: 1, colors: [4.8, "bad", 2] });
  assert(appearance.gender === 1, "runtime should restore appearance gender");
  assert(appearance.colors.join(",") === "4,0,2,0,0", "runtime should sanitize appearance colors");
  const serializedAppearance = runtime.serializeAppearanceState(context);
  assert(serializedAppearance.gender === 1 && serializedAppearance.colors.length === 5, "runtime should serialize current appearance state");

  console.log("Core progress runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
