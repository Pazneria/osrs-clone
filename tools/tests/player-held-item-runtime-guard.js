const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class FakeGroup {
  constructor() {
    this.children = [];
    this.name = "";
    this.parent = null;
    this.visible = true;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
  }

  remove(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parent = null;
  }

  getObjectByName(name) {
    return this.children.find((child) => child && child.name === name) || null;
  }
}

function makeAnchor(baseName) {
  const anchor = new FakeGroup();
  const base = new FakeGroup();
  base.name = baseName;
  anchor.add(base);
  return anchor;
}

function makeRig() {
  const rightTool = makeAnchor("base-right-tool");
  const leftTool = makeAnchor("base-left-tool");
  return {
    userData: {
      rig: {
        rightTool,
        leftTool
      }
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "player-held-item-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const playerModelSource = fs.readFileSync(path.join(root, "src", "js", "player-model.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const heldItemIndex = manifestSource.indexOf('id: "player-held-item-runtime"');
  const playerModelIndex = manifestSource.indexOf('id: "player-model"');

  assert(heldItemIndex !== -1, "legacy manifest should include player held-item runtime");
  assert(playerModelIndex !== -1 && heldItemIndex < playerModelIndex, "legacy manifest should load player held-item runtime before player-model.js");
  assert(runtimeSource.includes("window.PlayerHeldItemRuntime"), "held-item runtime should expose a window runtime");
  assert(runtimeSource.includes("function setPlayerRigToolVisuals(options = {}, rigRoot, heldItems, primaryHeldItemSlot = null)"), "held-item runtime should own held-item visual attachment");
  assert(runtimeSource.includes("function setBaseToolVisualVisibility"), "held-item runtime should own base tool visibility restoration");
  assert(runtimeSource.includes("pm-skillingToolVisual"), "held-item runtime should isolate temporary skilling tool meshes");
  assert(playerModelSource.includes("PlayerHeldItemRuntime"), "player-model.js should delegate temporary held-item visuals");
  assert(playerModelSource.includes("runtime.setPlayerRigToolVisuals"), "player-model.js should call the held-item runtime for multi-hand visuals");
  assert(!playerModelSource.includes("function setBaseToolVisualVisibility"), "player-model.js should not own base tool visibility restoration");
  assert(!playerModelSource.includes("function normalizeHeldItemVisualMap"), "player-model.js should not own held-item map normalization");

  const sandbox = { window: {}, THREE: { Group: FakeGroup } };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.PlayerHeldItemRuntime;
  assert(runtime, "held-item runtime should execute in isolation");
  assert(runtime.normalizeHeldItemSlot("leftHand") === "leftHand", "runtime should preserve left-hand slots");
  assert(runtime.normalizeHeldItemSlot("other") === "rightHand", "runtime should default unknown slots to right hand");

  const rig = makeRig();
  const createdMeshes = [];
  runtime.setPlayerRigToolVisuals({
    THREERef: { Group: FakeGroup },
    createEquipmentVisualMeshes(itemId) {
      if (itemId === "missing_pickaxe") return [];
      const mesh = new FakeGroup();
      mesh.name = `mesh:${itemId}`;
      createdMeshes.push(mesh.name);
      return [mesh];
    }
  }, rig, { rightHand: "bronze_axe", leftHand: "missing_pickaxe" }, "leftHand");

  const rightGroup = rig.userData.rig.rightTool.getObjectByName("pm-skillingToolVisual");
  const leftGroup = rig.userData.rig.leftTool.getObjectByName("pm-skillingToolVisual");
  assert(rightGroup && leftGroup, "runtime should create temporary held-item groups on both anchors");
  assert(rightGroup.children.length === 1 && rightGroup.children[0].name === "mesh:bronze_axe", "runtime should populate the right-hand held item");
  assert(leftGroup.children.length === 1 && leftGroup.children[0].name === "mesh:pickaxe_base_reference", "runtime should fallback missing pickaxe meshes to the base reference");
  assert(rig.userData.skillingToolVisualId === "missing_pickaxe", "runtime should track the primary requested held item id");
  assert(rig.userData.rig.rightTool.children[0].visible === false, "runtime should hide base right-hand visuals when temporary visuals are active");
  assert(rig.userData.rig.leftTool.children[0].visible === false, "runtime should hide base left-hand visuals when temporary visuals are active");

  runtime.setPlayerRigToolVisual({
    THREERef: { Group: FakeGroup },
    createEquipmentVisualMeshes() {
      return [];
    }
  }, rig, null, "rightHand");
  assert(rig.userData.skillingToolVisualId === null, "runtime should clear tracked held item id when visuals are cleared");
  assert(rightGroup.children.length === 0 && leftGroup.children.length === 0, "runtime should clear temporary visual groups");
  assert(rig.userData.rig.rightTool.children[0].visible === true, "runtime should restore right-hand base visuals after clearing");
  assert(rig.userData.rig.leftTool.children[0].visible === true, "runtime should restore left-hand base visuals after clearing");

  console.log("Player held-item runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
