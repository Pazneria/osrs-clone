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
  assert(runtimeSource.includes("function publishQaCameraHooks"), "QA camera runtime should own QA camera public hook publication");
  assert(inputSource.includes("InputQaCameraRuntime"), "input-render.js should delegate QA camera helpers");
  assert(inputSource.includes("function installQaCameraHooks()"), "input-render.js should install QA camera hooks through a narrow helper");
  assert(inputSource.includes("runtime.publishQaCameraHooks({"), "input-render.js should delegate QA camera public hook publication to the QA camera runtime");
  assert(inputSource.includes("getCameraState: () => ({ yaw: cameraYaw, pitch: cameraPitch, distance: cameraDist })"), "input-render.js should pass live camera state access to the QA camera runtime");
  assert(!inputSource.includes("window.projectWorldTileToScreen = projectWorldTileToScreen;"), "input-render.js should not directly publish projectWorldTileToScreen");
  assert(!inputSource.includes("window.syncQaRenderToPlayerState = syncQaRenderToPlayerState;"), "input-render.js should not directly publish syncQaRenderToPlayerState");
  assert(!inputSource.includes("window.setQaCameraView = function"), "input-render.js should not directly publish setQaCameraView");
  assert(!inputSource.includes("window.resetQaCameraView = resetQaCameraView;"), "input-render.js should not directly publish resetQaCameraView");
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

  {
    let cameraState = { yaw: 1, pitch: 1, distance: 10 };
    let projectCalls = 0;
    let syncCalls = 0;
    const windowRef = {};
    runtime.publishQaCameraHooks({
      windowRef,
      projectWorldTileToScreen: (x, y, z, height) => {
        projectCalls += 1;
        return { x, y, z, height };
      },
      syncQaRenderToPlayerState: () => {
        syncCalls += 1;
        return { synced: true };
      },
      getCameraState: () => cameraState,
      applyCameraState: (nextState) => {
        cameraState = { yaw: nextState.yaw, pitch: nextState.pitch, distance: nextState.distance };
        return cameraState;
      }
    });
    assert(typeof windowRef.projectWorldTileToScreen === "function", "runtime should publish projectWorldTileToScreen");
    assert(typeof windowRef.syncQaRenderToPlayerState === "function", "runtime should publish syncQaRenderToPlayerState");
    assert(typeof windowRef.setQaCameraView === "function", "runtime should publish setQaCameraView");
    assert(typeof windowRef.resetQaCameraView === "function", "runtime should publish resetQaCameraView");
    assert(windowRef.projectWorldTileToScreen(4, 5, 1, 1.5).height === 1.5 && projectCalls === 1, "published projection hook should delegate to input-render callback");
    assert(windowRef.syncQaRenderToPlayerState().synced === true && syncCalls === 1, "published sync hook should delegate to input-render callback");
    const setState = windowRef.setQaCameraView(2, -5, 99);
    assert(setState.yaw === 2 && setState.pitch === 0.1 && setState.distance === 30, "published set hook should clamp and apply camera state");
    assert(syncCalls === 2, "published set hook should sync render state after applying camera state");
    const resetState = windowRef.resetQaCameraView();
    assert(resetState.yaw === Number((Math.PI * 1.25).toFixed(4)) && resetState.distance === 16, "published reset hook should restore default QA camera state");
    assert(syncCalls === 3, "published reset hook should sync render state after applying camera state");
  }

  console.log("Input QA camera runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
