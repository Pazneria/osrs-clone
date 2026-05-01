const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function xpForLevelFallback(levelValue) {
  const lvl = Math.max(1, Math.min(99, Math.floor(levelValue)));
  let points = 0;
  for (let level = 1; level < lvl; level++) {
    points += Math.floor(level + 300 * Math.pow(2, level / 7));
  }
  return Math.floor(points / 4);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const qaToolsPath = path.join(root, "src", "js", "qa-tools-runtime.js");
  const qaToolsSource = read(root, "src/js/qa-tools-runtime.js");
  const qaCommandSource = read(root, "src/js/qa-command-runtime.js");
  const coreSource = read(root, "src/js/core.js");
  const packageSource = read(root, "package.json");

  assert(qaToolsSource.includes("function getQaXpForLevel(context, levelValue)"), "QA tools runtime should own QA XP calculation");
  assert(qaToolsSource.includes("function setQaSkillLevel(context, skillId, levelValue)"), "QA tools runtime should own skill level mutation");
  assert(qaToolsSource.includes("function setQaUnlockFlag(context, flagId, enabled)"), "QA tools runtime should own unlock flag mutation");
  assert(qaToolsSource.includes("setQaSkillLevel: (skillId, levelValue) => setQaSkillLevel(context, skillId, levelValue)"), "QA command handlers should expose skill level mutation");
  assert(qaToolsSource.includes("setQaUnlockFlag: (flagId, enabled) => setQaUnlockFlag(context, flagId, enabled)"), "QA command handlers should expose unlock flag mutation");
  assert(coreSource.includes("qaToolsRuntime.getQaXpForLevel(buildQaToolsContext(), levelValue)"), "core.js should delegate QA XP calculation through QA tools runtime");
  assert(coreSource.includes("qaToolsRuntime.setQaSkillLevel(buildQaToolsContext(), skillId, levelValue)"), "core.js should delegate skill level mutation through QA tools runtime");
  assert(coreSource.includes("qaToolsRuntime.setQaUnlockFlag(buildQaToolsContext(), flagId, enabled)"), "core.js should delegate unlock flag mutation through QA tools runtime");
  assert(coreSource.includes("getXpForLevel: (typeof getXpForLevel === 'function') ? getXpForLevel : null"), "core QA context should provide XP lookup as a narrow hook");
  assert(coreSource.includes("refreshSkillUi: (typeof refreshSkillUi === 'function') ? refreshSkillUi : null"), "core QA context should provide skill UI refresh as a narrow hook");
  assert(!coreSource.includes("points += Math.floor(level + 300 * Math.pow(2, level / 7));"), "core.js should not own QA XP formula fallback");
  assert(!coreSource.includes("playerSkills[skillId].xp = getQaXpForLevel(lvl);"), "core.js should not mutate QA skill XP directly");
  assert(!coreSource.includes("playerState.unlockFlags[flagId] = !!enabled;"), "core.js should not mutate QA unlock flags directly");
  assert(qaCommandSource.includes("callHook(context, 'setQaSkillLevel', skill, lvl)"), "QA command runtime should use the skill level callback surface");
  assert(qaCommandSource.includes("callHook(context, 'setQaUnlockFlag'"), "QA command runtime should use the unlock flag callback surface");
  assert(packageSource.includes('"test:qa:skill-control"'), "package should expose a targeted QA skill control guard");

  const sandbox = { window: {} };
  vm.runInNewContext(qaToolsSource, sandbox, { filename: qaToolsPath });
  const runtime = sandbox.window.QaToolsRuntime;
  assert(runtime, "QA tools runtime should execute in isolation");
  assert(typeof runtime.getQaXpForLevel === "function", "QA tools runtime should expose getQaXpForLevel");
  assert(typeof runtime.setQaSkillLevel === "function", "QA tools runtime should expose setQaSkillLevel");
  assert(typeof runtime.setQaUnlockFlag === "function", "QA tools runtime should expose setQaUnlockFlag");

  assert(runtime.getQaXpForLevel({}, 10) === xpForLevelFallback(10), "QA XP fallback should match the legacy level curve");
  assert(runtime.getQaXpForLevel({ getXpForLevel: (level) => level * 123 }, 7) === 861, "QA XP lookup should prefer the provided game hook");

  const playerSkills = { mining: { xp: 0, level: 1 } };
  const refreshed = [];
  const levelApplied = runtime.setQaSkillLevel({
    getPlayerSkills: () => playerSkills,
    getXpForLevel: (level) => level * 100,
    refreshSkillUi: (skillId) => refreshed.push(skillId)
  }, "mining", 12);
  assert(levelApplied === true, "known QA skill should update");
  assert(playerSkills.mining.level === 12, "QA skill update should set the clamped level");
  assert(playerSkills.mining.xp === 1200, "QA skill update should set matching XP");
  assert(refreshed.join(",") === "mining", "QA skill update should refresh the touched skill UI");
  assert(runtime.setQaSkillLevel({ getPlayerSkills: () => playerSkills }, "unknown", 12) === false, "unknown QA skill should fail cleanly");

  const playerState = {};
  assert(runtime.setQaUnlockFlag({ getPlayerState: () => playerState }, "gemMineUnlocked", true) === true, "known QA unlock flag should update");
  assert(playerState.unlockFlags.gemMineUnlocked === true, "QA unlock flag update should initialize and write flags");
  assert(runtime.setQaUnlockFlag({ getPlayerState: () => playerState }, "gemMineUnlocked", false) === true, "known QA unlock flag should clear");
  assert(playerState.unlockFlags.gemMineUnlocked === false, "QA unlock flag update should coerce to boolean");
  assert(runtime.setQaUnlockFlag({ getPlayerState: () => playerState }, "", true) === false, "empty QA unlock flag should fail cleanly");

  const handlers = runtime.createCommandHandlers({
    getPlayerSkills: () => playerSkills,
    getPlayerState: () => playerState,
    getXpForLevel: (level) => level * 10
  });
  assert(typeof handlers.setQaSkillLevel === "function", "QA command handlers should include skill controls");
  assert(typeof handlers.setQaUnlockFlag === "function", "QA command handlers should include unlock controls");
  assert(handlers.setQaSkillLevel("mining", 5) === true, "QA command handler should update skill levels through runtime ownership");
  assert(playerSkills.mining.xp === 50, "QA command handler should use the runtime context XP hook");
  assert(handlers.setQaUnlockFlag("runecraftingComboUnlocked", true) === true, "QA command handler should update unlock flags through runtime ownership");
  assert(playerState.unlockFlags.runecraftingComboUnlocked === true, "QA command handler should mutate the provided player state");

  console.log("QA skill control runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
