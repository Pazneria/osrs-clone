const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "skill-panel-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inventorySource = fs.readFileSync(path.join(root, "src", "js", "inventory.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const skillProgressIndex = manifestSource.indexOf('id: "skill-progress-runtime"');
  const skillPanelIndex = manifestSource.indexOf('id: "skill-panel-runtime"');
  const inventoryIndex = manifestSource.indexOf('id: "inventory"');

  assert(skillPanelIndex !== -1, "legacy manifest should include the skill panel runtime");
  assert(skillProgressIndex !== -1 && inventoryIndex !== -1, "legacy manifest should include skill progress and inventory scripts");
  assert(skillProgressIndex < skillPanelIndex && skillPanelIndex < inventoryIndex, "legacy manifest should load skill panel runtime before inventory.js");
  assert(runtimeSource.includes("window.SkillPanelRuntime"), "skill panel runtime should expose a window runtime");
  assert(runtimeSource.includes("function buildSkillPanelTimeline(options = {})"), "skill panel runtime should own timeline construction");
  assert(runtimeSource.includes("function buildSkillPanelRecipeDetails(options = {})"), "skill panel runtime should own recipe detail construction");
  assert(runtimeSource.includes("COMBAT_SKILL_MILESTONES"), "skill panel runtime should own combat milestone fallback data");
  assert(inventorySource.includes("getSkillPanelRuntime"), "inventory.js should resolve the skill panel runtime");
  assert(inventorySource.includes("runtime.buildSkillPanelTimeline"), "inventory.js should delegate timeline construction");
  assert(inventorySource.includes("runtime.buildSkillPanelRecipeDetails"), "inventory.js should delegate recipe detail construction");
  assert(!inventorySource.includes("const COMBAT_SKILL_MILESTONES"), "inventory.js should not own combat milestone fallback data");
  assert(!inventorySource.includes("const FISHING_METHOD_LABELS"), "inventory.js should not own fishing method label fallback data");
  assert(!inventorySource.includes("function collectSkillPanelMilestones"), "inventory.js should not own skill-panel milestone collection");

  const sandbox = { window: {}, Math, Number, Set, Map };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.SkillPanelRuntime;
  assert(runtime, "skill panel runtime should execute in isolation");

  assert(runtime.formatSkillPanelText("deep_rune-harpoon") === "Deep Rune Harpoon", "skill panel runtime should format ids as labels");
  assert(runtime.resolveSkillPanelItemName("raw_trout", { itemDb: { raw_trout: { name: "Raw Trout" } } }) === "Raw Trout", "skill panel runtime should resolve item names from ITEM_DB snapshots");

  const combatTimeline = runtime.buildSkillPanelTimeline({ skillName: "attack" });
  assert(combatTimeline.length >= 5 && combatTimeline[0].unlocks[0].key === "combat:attack:1", "skill panel runtime should build combat fallback milestones");

  const fishingTimeline = runtime.buildSkillPanelTimeline({
    skillName: "fishing",
    itemDb: { raw_trout: { name: "Raw Trout" } },
    skillSpec: {
      nodeTable: {
        river_spot: {
          unlockLevel: 5,
          methods: {
            rod: {
              unlockLevel: 10,
              fishByLevel: [
                { minLevel: 10, fish: [{ itemId: "raw_trout", requiredLevel: 20 }] }
              ]
            }
          }
        }
      }
    }
  });
  assert(
    fishingTimeline.some((entry) => entry.level === 20 && entry.unlocks.some((unlock) => unlock.label === "Catch Raw Trout")),
    "skill panel runtime should build fishing method catch milestones"
  );

  const calledWith = {};
  const cookingDetail = runtime.buildSkillPanelRecipeDetails({
    skillName: "cooking",
    playerSkills: { cooking: { level: 20 } },
    itemDb: {
      raw_trout: { name: "Raw Trout" },
      cooked_trout: { name: "Cooked Trout" },
      burnt_trout: { name: "Burnt Trout" }
    },
    skillSpecRegistry: {
      computeCookingBurnChance(level, requiredLevel) {
        calledWith.level = level;
        calledWith.requiredLevel = requiredLevel;
        return 0.1;
      }
    },
    unlockEntry: {
      unlockType: "recipe",
      recipe: {
        sourceItemId: "raw_trout",
        cookedItemId: "cooked_trout",
        burntItemId: "burnt_trout",
        requiredLevel: 10,
        xpPerSuccess: 70,
        sourceTarget: "FIRE"
      }
    }
  });
  assert(calledWith.level === 20 && calledWith.requiredLevel === 10, "cooking recipe details should use shared burn chance helper when present");
  assert(cookingDetail.inputs.includes("1x Raw Trout"), "recipe details should include named inputs");
  assert(cookingDetail.outputs.includes("Success: 1x Cooked Trout"), "recipe details should include named outputs");
  assert(cookingDetail.meta.includes("Burn chance: 10%"), "recipe details should include cooking burn chance metadata");

  const firemakingDetail = runtime.buildSkillPanelRecipeDetails({
    skillName: "firemaking",
    itemDb: { normal_logs: { name: "Logs" } },
    unlockEntry: {
      unlockType: "recipe",
      recipe: { sourceItemId: "normal_logs", requiredLevel: 1, xpPerAction: 40 }
    }
  });
  assert(firemakingDetail.outputs.includes("Creates an active fire on the target tile"), "firemaking details should keep the active-fire output note");
  assert(runtime.getSkillPanelUnlockTypeLabel({ key: "pouch:small_pouch" }) === "Pouch Unlock", "runtime should classify pouch unlock labels");

  console.log("Skill panel runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
