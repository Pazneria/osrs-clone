const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeNode() {
  return {
    isMesh: false,
    userData: {},
    position: { set(x, y, z) { this.x = x; this.y = y; this.z = z; }, x: 0, y: 0, z: 0 },
    rotation: { order: "", x: 0, y: 0, z: 0 },
    scale: { set(x, y, z) { this.x = x; this.y = y; this.z = z; }, x: 1, y: 1, z: 1 },
    children: [],
    add(...nodes) { this.children.push(...nodes); },
    traverse(visitor) {
      visitor(this);
      this.children.forEach((child) => {
        if (child && typeof child.traverse === "function") child.traverse(visitor);
        else if (child) visitor(child);
      });
    }
  };
}

function makeGeometry() {
  return {
    rotateY() { return this; },
    rotateX() { return this; },
    translate() { return this; },
    toNonIndexed() { return this; },
    computeVertexNormals() { return this; }
  };
}

function makeFakeThree() {
  class Group {
    constructor() {
      Object.assign(this, makeNode());
    }
  }
  class Mesh {
    constructor(geometry, material) {
      Object.assign(this, makeNode());
      this.isMesh = true;
      this.geometry = geometry;
      this.material = material;
    }
  }
  class Material {
    constructor(options = {}) {
      this.options = options;
    }
  }
  return {
    Group,
    Mesh,
    BoxGeometry: class { constructor() { return makeGeometry(); } },
    CylinderGeometry: class { constructor() { return makeGeometry(); } },
    SphereGeometry: class { constructor() { return makeGeometry(); } },
    ConeGeometry: class { constructor() { return makeGeometry(); } },
    MeshLambertMaterial: Material,
    MeshBasicMaterial: Material,
    DoubleSide: "DoubleSide"
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "humanoid-model-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(runtimeSource.includes("window.HumanoidModelRuntime"), "humanoid model runtime should expose a window runtime");
  assert(runtimeSource.includes("window.createHumanoidModel = createHumanoidModel;"), "humanoid model runtime should publish legacy createHumanoidModel");
  assert(!inputSource.includes("function createHumanoidModel("), "input-render.js should not own humanoid model construction");
  assert(
    manifestSource.indexOf('id: "humanoid-model-runtime"') < manifestSource.indexOf('id: "world"')
      && manifestSource.indexOf('id: "humanoid-model-runtime"') < manifestSource.indexOf('id: "combat"'),
    "legacy manifest should load humanoid model runtime before world/combat consumers"
  );

  const sandbox = { window: {}, THREE: makeFakeThree(), Math, Error };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.HumanoidModelRuntime;
  assert(runtime && typeof runtime.createHumanoidModel === "function", "runtime should expose createHumanoidModel");
  assert(sandbox.window.createHumanoidModel === runtime.createHumanoidModel, "runtime should preserve legacy global builder");

  const model = runtime.createHumanoidModel(8);
  assert(model.userData.animType === 8, "model should preserve anim type");
  assert(model.userData.rig && model.userData.rig.leftArm && model.userData.rig.rightArm, "model should expose humanoid rig nodes");
  assert(model.userData.rig.leftLeg && model.userData.rig.rightLeg, "queen models should expose dummy leg groups for animation compatibility");

  console.log("Humanoid model runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
