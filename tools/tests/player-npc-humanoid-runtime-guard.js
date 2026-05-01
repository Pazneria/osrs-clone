const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeVec() {
  return {
    values: [],
    set(x, y, z) {
      this.values = [x, y, z];
    }
  };
}

function makeNode() {
  return {
    position: makeVec(),
    visible: true
  };
}

function makeRig() {
  const nodes = {
    torso: makeNode(),
    head: makeNode(),
    leftArm: makeNode(),
    rightArm: makeNode(),
    leftLowerArm: makeNode(),
    rightLowerArm: makeNode(),
    leftLeg: makeNode(),
    rightLeg: makeNode(),
    leftLowerLeg: makeNode(),
    rightLowerLeg: makeNode(),
    axe: makeNode(),
    leftTool: makeNode()
  };
  return {
    nodes,
    position: makeVec(),
    scale: makeVec(),
    userData: {},
    clone() {
      return makeRig();
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "player-npc-humanoid-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const playerModelSource = fs.readFileSync(path.join(root, "src", "js", "player-model.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const visualRuntimeIndex = manifestSource.indexOf('id: "player-model-visual-runtime"');
  const npcRuntimeIndex = manifestSource.indexOf('id: "player-npc-humanoid-runtime"');
  const playerModelIndex = manifestSource.indexOf('id: "player-model"');

  assert(manifestSource.includes("../../js/player-npc-humanoid-runtime.js?raw"), "legacy manifest should import the player NPC humanoid runtime raw script");
  assert(visualRuntimeIndex !== -1 && npcRuntimeIndex !== -1 && playerModelIndex !== -1, "legacy manifest should include player NPC humanoid runtime");
  assert(visualRuntimeIndex < npcRuntimeIndex && npcRuntimeIndex < playerModelIndex, "legacy manifest should load NPC humanoid runtime before player-model.js");

  assert(runtimeSource.includes("window.PlayerNpcHumanoidRuntime"), "NPC humanoid runtime should expose a window runtime");
  assert(runtimeSource.includes("function createGuardHumanoidFragments"), "NPC humanoid runtime should own guard preset fragments");
  assert(runtimeSource.includes("function createTannerHumanoidFragments"), "NPC humanoid runtime should own tanner preset fragments");
  assert(runtimeSource.includes("function applyGuardRigBasePose"), "NPC humanoid runtime should own guard base pose");
  assert(runtimeSource.includes("function createNpcHumanoidRigFromPreset"), "NPC humanoid runtime should own NPC rig creation");
  assert(runtimeSource.includes("{ actorId: 'guard', label: 'Guard' }"), "NPC humanoid runtime should own animation studio NPC preview actors");
  assert(runtimeSource.includes("normalizedPresetId === 'tanner'"), "NPC humanoid runtime should preserve the tanner alias");

  assert(playerModelSource.includes("function getPlayerNpcHumanoidRuntime()"), "player-model.js should resolve the NPC humanoid runtime");
  assert(playerModelSource.includes("PlayerNpcHumanoidRuntime missing"), "player-model.js should fail fast when NPC humanoid runtime is missing");
  assert(playerModelSource.includes("createNpcHumanoidRigFromPreset(buildPlayerNpcHumanoidRuntimeOptions()"), "player-model.js should delegate NPC rig creation");
  assert(playerModelSource.includes("createAnimationStudioPreviewRig(buildPlayerNpcHumanoidRuntimeOptions()"), "player-model.js should delegate animation studio NPC preview routing");
  assert(!playerModelSource.includes("function createGuardHumanoidFragments"), "player-model.js should not own guard preset fragments");
  assert(!playerModelSource.includes("function createTannerHumanoidFragments"), "player-model.js should not own tanner preset fragments");
  assert(!playerModelSource.includes("function applyGuardRigBasePose"), "player-model.js should not own NPC base poses");
  assert(!playerModelSource.includes("const NPC_HUMANOID_RIG_CACHE"), "player-model.js should not own NPC rig template cache");

  const sandbox = { window: {}, Map, Math, Number, Object, String, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.PlayerNpcHumanoidRuntime;
  assert(runtime, "NPC humanoid runtime should execute in isolation");
  assert(runtime.normalizeNpcHumanoidPresetId("tanner") === "tanner_rusk", "runtime should preserve tanner alias normalization");
  assert(runtime.createGuardHumanoidFragments({ packJagexHsl: () => 64 }).length > 0, "runtime should build guard fragments");
  assert(runtime.listAnimationStudioPreviewActors().some((entry) => entry.actorId === "guard"), "runtime should list guard preview actor");

  const added = [];
  const options = {
    packJagexHsl: () => 64,
    createRigBones: () => makeRig(),
    rigNodeMap: (rig) => rig.nodes,
    addFragmentsToRig: (_rig, fragments) => added.push(fragments.length),
    bindRigUserData: (rig) => {
      rig.userData.bound = true;
      return rig;
    },
    createPlayerRigForAnimationStudio: () => ({ playerPreview: true })
  };
  const template = runtime.buildNpcHumanoidRigTemplate(options, "guard");
  assert(template && template.userData.npcPresetId === "guard", "runtime should build guard NPC templates");
  assert(template.nodes.axe.visible === false && template.nodes.leftTool.visible === false, "runtime should hide base tool anchors on NPC templates");
  assert(added.length === 1 && added[0] > 0, "runtime should attach NPC fragments through the player-model callback");
  const rig = runtime.createNpcHumanoidRigFromPreset(options, "tanner");
  assert(rig && rig.userData.bound === true && rig.userData.npcPresetId === "tanner_rusk", "runtime should create bound NPC rig clones");
  const playerPreview = runtime.createAnimationStudioPreviewRig(options, "player");
  assert(playerPreview && playerPreview.playerPreview === true, "runtime should fall back to the player preview rig");

  console.log("Player NPC humanoid runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
