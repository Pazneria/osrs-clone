const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createFakeDocument() {
  const nodes = {};
  const xpDrops = [];
  nodes["xp-drop-container"] = {
    children: xpDrops,
    appendChild(child) {
      xpDrops.push(child);
    }
  };
  nodes["stat-atk-level"] = { innerText: "" };

  return {
    nodes,
    xpDrops,
    createElement(tagName) {
      return {
        tagName,
        className: "",
        innerText: "",
        removed: false,
        remove() {
          this.removed = true;
        }
      };
    },
    getElementById(id) {
      return nodes[id] || null;
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "skill-progress-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const skillProgressIndex = manifestSource.indexOf('id: "skill-progress-runtime"');
  const coreIndex = manifestSource.indexOf('id: "core"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(skillProgressIndex !== -1, "legacy manifest should include the skill progress runtime");
  assert(coreIndex !== -1 && worldIndex !== -1, "legacy manifest should include core and world scripts");
  assert(skillProgressIndex < coreIndex && skillProgressIndex < worldIndex, "legacy manifest should load skill progress runtime before legacy consumers");
  assert(runtimeSource.includes("window.SkillProgressRuntime"), "skill progress runtime should expose a window runtime");
  assert(runtimeSource.includes("function getXpForLevel(level)"), "skill progress runtime should own XP table math");
  assert(runtimeSource.includes("function getLevelForXp(xp)"), "skill progress runtime should own level lookup");
  assert(runtimeSource.includes("function initializeSkillLevels(playerSkills)"), "skill progress runtime should own skill level initialization");
  assert(runtimeSource.includes("function addSkillXp(context = {}, skillName, amount)"), "skill progress runtime should own XP award bookkeeping");
  assert(worldSource.includes("const skillProgressRuntime = window.SkillProgressRuntime || null;"), "world.js should resolve the skill progress runtime");
  assert(worldSource.includes("skillProgressRuntime.initializeSkillLevels(playerSkills);"), "world.js should delegate skill level initialization");
  assert(worldSource.includes("skillProgressRuntime.addSkillXp(buildSkillProgressRuntimeContext(), skillName, amount)"), "world.js should delegate XP awards");
  assert(!worldSource.includes("points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));"), "world.js should not own XP table math");
  assert(!worldSource.includes("const keyBySkill = {"), "world.js should not own skill tile key fallbacks");
  assert(!worldSource.includes("playerSkills[skillName].xp += amount;"), "world.js should not mutate skill XP inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: runtimePath });
  const runtime = window.SkillProgressRuntime;
  assert(runtime, "skill progress runtime should be available after evaluation");
  assert(runtime.MAX_SKILL_LEVEL === 99, "skill progress runtime should expose max skill level");
  assert(runtime.getXpForLevel(2) === 83, "XP table should match OSRS level 2 threshold");
  assert(runtime.getXpForLevel(99) === 13034431, "XP table should match OSRS level 99 threshold");
  assert(runtime.getLevelForXp(82) === 1 && runtime.getLevelForXp(83) === 2, "level lookup should resolve XP thresholds");

  const skills = {
    attack: { xp: 83, level: 1 },
    mining: { xp: runtime.getXpForLevel(15), level: 1 }
  };
  runtime.initializeSkillLevels(skills);
  assert(skills.attack.level === 2 && skills.mining.level === 15, "skill initialization should derive levels from XP");
  assert(runtime.getSkillUiLevelKey("attack", null) === "atk", "skill tile key lookup should keep fallback mappings");
  assert(runtime.getSkillUiLevelKey("custom", { skillTileBySkillId: { custom: { levelKey: "cus" } } }) === "cus", "skill tile key lookup should prefer manifest metadata");

  const fakeDocument = createFakeDocument();
  const updates = [];
  const animations = [];
  const chats = [];
  const timeouts = [];
  const addResult = runtime.addSkillXp({
    document: fakeDocument,
    playerRig: { name: "player" },
    playerSkills: { attack: { xp: 0, level: 1 } },
    addChatMessage: (message, tone) => chats.push({ message, tone }),
    playLevelUpAnimation: (type, target) => animations.push({ type, target }),
    setTimeout: (callback, ms) => {
      timeouts.push({ callback, ms });
      return 1;
    },
    updateSkillProgressPanel: (skillName) => updates.push(skillName)
  }, "attack", 83);
  assert(addResult, "XP award should return true for known skills");
  assert(fakeDocument.nodes["stat-atk-level"].innerText === 2, "XP award should refresh the skill stat tile");
  assert(fakeDocument.xpDrops.length === 1 && fakeDocument.xpDrops[0].innerText === "attack +83xp", "XP award should show an XP drop");
  assert(animations.length === 1 && animations[0].type === 8, "level-up XP award should play the level-up animation");
  assert(chats.length === 1 && chats[0].message === "attack level is now 2.", "level-up XP award should emit chat feedback");
  assert(updates.length === 1 && updates[0] === "attack", "XP award should refresh the progress panel");
  assert(timeouts.length === 1 && timeouts[0].ms === 2000, "XP drop should keep the legacy removal timeout");

  console.log("Skill progress runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
