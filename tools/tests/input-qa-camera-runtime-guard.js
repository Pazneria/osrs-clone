const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class FakeVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  project() {
    this.x = this.x / 30;
    this.y = this.y / 30;
    this.z = 0.5;
    return this;
  }
}

function makeCamera() {
  return {
    position: { x: 0, y: 0, z: 0 },
    updateMatrixWorldCalled: false,
    lookAtTarget: null,
    updateMatrixWorld() {
      this.updateMatrixWorldCalled = true;
    },
    lookAt(target) {
      this.lookAtTarget = target;
    }
  };
}

function makeRig() {
  return {
    position: {
      x: 0,
      y: 0,
      z: 0,
      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-qa-camera-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(runtimeSource.includes("window.InputQaCameraRuntime"), "QA camera runtime should expose a window runtime");
  assert(runtimeSource.includes("function projectWorldTileToScreen"), "QA camera runtime should own projection helper");
  assert(runtimeSource.includes("function syncQaRenderToPlayerState"), "QA camera runtime should own render sync helper");
  assert(inputSource.includes("InputQaCameraRuntime"), "input-render.js should delegate QA camera helpers");
  assert(!inputSource.includes("const gx = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(Number(x) || 0)));"), "input-render.js should not own QA projection coordinate clamping");
  assert(
    manifestSource.indexOf('id: "input-qa-camera-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy manifest should load QA camera runtime before input-render.js"
  );

  const sandbox = { window: {}, Math, Number, Error, THREE: { Vector3: FakeVector3 } };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputQaCameraRuntime;
  assert(runtime, "QA camera runtime should execute in isolation");

  const clamped = runtime.resolveQaCameraViewState({
    cameraYaw: 1,
    cameraPitch: 1,
    cameraDist: 10,
    nextYaw: 2,
    nextPitch: -5,
    nextDist: 99
  });
  assert(clamped.yaw === 2, "QA camera state should accept finite yaw");
  assert(clamped.pitch === 0.1, "QA camera state should clamp pitch");
  assert(clamped.distance === 30, "QA camera state should clamp distance");

  const projected = runtime.projectWorldTileToScreen({
    THREERef: { Vector3: FakeVector3 },
    windowRef: { innerWidth: 200, innerHeight: 100 },
    camera: makeCamera(),
    mapSize: 20,
    planes: 2,
    getVisualHeight: (x, y, z) => x + y + z
  }, 25, -1, 4, 1);
  assert(projected.x === 163 && projected.y === 15, "QA projection should clamp world tile and project to screen coordinates");
  assert(projected.visible === true, "QA projection should report visible projected coordinates");

  const camera = makeCamera();
  const rig = makeRig();
  const sync = runtime.syncQaRenderToPlayerState({
    THREERef: { Vector3: FakeVector3 },
    camera,
    playerRig: rig,
    playerState: { x: 5, y: 6, z: 0 },
    cameraYaw: 0,
    cameraPitch: Math.PI / 2,
    cameraDist: 10,
    getVisualHeight: () => 3,
    getGroundHeightAtWorldPos: () => 2
  });
  assert(sync && sync.baseVisualY === 3, "QA render sync should return base visual height");
  assert(rig.position.x === 5 && rig.position.y === 3 && rig.position.z === 6, "QA render sync should move player rig to logical tile");
  assert(camera.updateMatrixWorldCalled, "QA render sync should update camera matrix");

  console.log("Input QA camera runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
