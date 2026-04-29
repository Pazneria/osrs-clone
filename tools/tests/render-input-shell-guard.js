const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const renderContracts = fs.readFileSync(path.join(root, "src", "game", "contracts", "render.ts"), "utf8");
  const renderInputBridge = fs.readFileSync(path.join(root, "src", "game", "platform", "render-input-bridge.ts"), "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const mapHudSource = fs.readFileSync(path.join(root, "src", "js", "world", "map-hud-runtime.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

  assert(renderContracts.includes("export interface RenderSnapshot"), "render contracts should define RenderSnapshot");
  assert(renderContracts.includes("export interface InputControllerContext"), "render contracts should define InputControllerContext");
  assert(renderInputBridge.includes("window.RenderRuntime"), "render/input bridge should expose RenderRuntime");
  assert(renderInputBridge.includes("window.InputControllerRuntime"), "render/input bridge should expose InputControllerRuntime");
  assert(mapHudSource.includes("window.WorldMapHudRuntime"), "world map HUD runtime should expose a runtime");
  assert(mapHudSource.includes("buildHudRenderSnapshot"), "world map HUD runtime should build render snapshots");
  assert(mapHudSource.includes("buildWorldMapSnapshot"), "world map HUD runtime should consume the world-map render snapshot bridge");
  assert(mapHudSource.includes("buildMinimapSnapshot"), "world map HUD runtime should consume the minimap render snapshot bridge");
  assert(mapHudSource.includes("worldMapState"), "world map HUD runtime should own world-map pan and zoom state");
  assert(mapHudSource.includes("const minimapState"), "world map HUD runtime should own minimap zoom, lock, target, and destination state");
  assert(mapHudSource.includes("syncLockedMinimapTarget"), "world map HUD runtime should own locked-target following");
  assert(mapHudSource.includes("clearMinimapDestinationIfReached"), "world map HUD runtime should own destination cleanup");
  assert(worldSource.includes("WorldMapHudRuntime"), "world.js should delegate map HUD orchestration through the map HUD runtime");
  assert(worldSource.includes("buildMapHudRuntimeContext"), "world.js should provide map HUD runtime context callbacks");
  assert(!worldSource.includes("const worldMapState ="), "world.js should no longer own world-map pan and zoom state");
  assert(!worldSource.includes("minimapZoom"), "world.js should not read minimap zoom state directly");
  assert(!worldSource.includes("minimapDestination"), "world.js should not read minimap destination state directly");
  assert(!worldSource.includes("minimapLocked"), "world.js should not read minimap lock state directly");
  assert(!coreSource.includes("let minimapZoom"), "core.js should not own minimap zoom state");
  assert(!coreSource.includes("let minimapDestination"), "core.js should not own minimap destination state");
  assert(!inputSource.includes("minimapLocked &&"), "input-render.js should not read minimap lock state directly");
  assert(worldSource.includes("shadowFocusRevision"), "world.js should track shadow focus revision changes across scene reloads");
  assert(worldSource.includes("function initSkyRuntime"), "world.js should initialize a static sky runtime");
  assert(worldSource.includes("function updateSkyRuntime"), "world.js should expose a sky update helper");
  assert(worldSource.includes("window.updateSkyRuntime = updateSkyRuntime;"), "world.js should keep sky updates wired through the world shell");
  assert(inputSource.includes("const inputControllerRuntime = window.InputControllerRuntime || null;"), "input-render.js should adopt the input controller bridge");
  assert(inputSource.includes("resolvePointerDown"), "input-render.js should delegate pointer decisions to the input controller bridge");
  assert(inputSource.includes("resolveMouseWheelCameraDistance"), "input-render.js should delegate zoom decisions to the input controller bridge");
  assert(!inputSource.includes("const animationStudioBridge ="), "input-render.js should not cache AnimationStudioBridge before runtime initialization settles");
  assert(inputSource.includes("const bridge = window.AnimationStudioBridge || null;"), "input-render.js should resolve AnimationStudioBridge lazily when checking studio activity");
  assert(inputSource.includes("function maybeUpdateMainDirectionalShadowFocus"), "input-render.js should throttle directional shadow focus updates through a helper");
  assert(inputSource.includes("window.updateMainDirectionalShadowFocus"), "input-render.js should keep directional shadow focus wired through the world shell");
  assert(inputSource.includes("window.updateSkyRuntime(camera.position, frameNowMs);"), "input-render.js should refresh the sky runtime from animate()");
  assert(inputSource.includes("function syncPlayerRigSkillingToolVisual("), "input-render.js should reconcile temporary skilling tool visuals with live actions");
  assert(inputSource.includes("setPlayerRigToolVisual(playerRigRef, null);"), "input-render.js should clear temporary skilling tool visuals after skilling ends");

  const canvasOps = [];
  const fakeContext = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textBaseline: "",
    imageSmoothingEnabled: true,
    fillRect: (...args) => canvasOps.push(["fillRect", ...args]),
    strokeRect: (...args) => canvasOps.push(["strokeRect", ...args]),
    drawImage: (...args) => canvasOps.push(["drawImage", args.length]),
    beginPath: () => canvasOps.push(["beginPath"]),
    arc: (...args) => canvasOps.push(["arc", ...args]),
    fill: () => canvasOps.push(["fill"]),
    moveTo: (...args) => canvasOps.push(["moveTo", ...args]),
    lineTo: (...args) => canvasOps.push(["lineTo", ...args]),
    stroke: () => canvasOps.push(["stroke"]),
    save: () => canvasOps.push(["save"]),
    restore: () => canvasOps.push(["restore"]),
    translate: (...args) => canvasOps.push(["translate", ...args]),
    scale: (...args) => canvasOps.push(["scale", ...args]),
    fillText: (...args) => canvasOps.push(["fillText", ...args])
  };
  const makeCanvas = () => ({
    width: 2,
    height: 2,
    dataset: {},
    style: {},
    classList: { contains: () => false },
    getContext: () => fakeContext,
    getBoundingClientRect: () => ({ width: 2, height: 2, left: 0, top: 0 }),
    addEventListener: () => {}
  });
  const fakeDocument = {
    createElement: () => makeCanvas(),
    getElementById: (id) => (id === "minimap" || id === "world-map-canvas" || id === "world-map-panel") ? makeCanvas() : null
  };
  global.window = {
    document: fakeDocument,
    devicePixelRatio: 1,
    RenderRuntime: {
      buildRenderSnapshot: (options) => Object.assign({ bridged: true }, options)
    }
  };
  vm.runInThisContext(mapHudSource, { filename: path.join(root, "src", "js", "world", "map-hud-runtime.js") });
  const runtime = window.WorldMapHudRuntime;
  assert(runtime, "world map HUD runtime should execute in isolation");
  const tileIds = {
    OBSTACLE: 0,
    GRASS: 1,
    DIRT: 2,
    ROCK: 3,
    FLOOR_WOOD: 4,
    SHOP_COUNTER: 5,
    FLOOR_STONE: 6,
    STAIRS_RAMP: 7,
    SOLID_NPC: 8,
    FLOOR_BRICK: 9,
    BANK_BOOTH: 10,
    WALL: 11,
    TOWER: 12,
    STAIRS_UP: 13,
    STAIRS_DOWN: 14,
    SHORE: 15,
    WATER_SHALLOW: 16,
    WATER_DEEP: 17,
    FENCE: 18
  };
  const runtimeContext = {
    document: fakeDocument,
    mapSize: 2,
    chunkSize: 1,
    tileIds,
    getTile: () => tileIds.GRASS,
    getVisualTileId: (tile) => tile,
    getPlayerMapPosition: () => ({ x: 1, y: 1, z: 0, facingYaw: 0 }),
    resolveRenderWorldId: () => "main_overworld",
    getClickMarkers: () => [],
    getGroundItems: () => [],
    getMinimapDestination: () => null
  };
  assert(runtime.updateMinimapCanvas(runtimeContext).width === 2, "world map HUD runtime should redraw the offscreen map canvas");
  assert(runtime.buildHudRenderSnapshot(runtimeContext).worldId === "main_overworld", "world map HUD runtime should build a render snapshot through the bridge");

  console.log("Render/input shell guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
