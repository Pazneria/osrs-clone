const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const renderContracts = fs.readFileSync(path.join(root, "src", "game", "contracts", "render.ts"), "utf8");
  const renderInputBridge = fs.readFileSync(path.join(root, "src", "game", "platform", "render-input-bridge.ts"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

  assert(renderContracts.includes("export interface RenderSnapshot"), "render contracts should define RenderSnapshot");
  assert(renderContracts.includes("export interface InputControllerContext"), "render contracts should define InputControllerContext");
  assert(renderInputBridge.includes("window.RenderRuntime"), "render/input bridge should expose RenderRuntime");
  assert(renderInputBridge.includes("window.InputControllerRuntime"), "render/input bridge should expose InputControllerRuntime");
  assert(worldSource.includes("buildHudRenderSnapshot"), "world.js should build a render snapshot helper");
  assert(worldSource.includes("buildWorldMapSnapshot"), "world.js should consume the world-map render snapshot bridge");
  assert(worldSource.includes("buildMinimapSnapshot"), "world.js should consume the minimap render snapshot bridge");
  assert(worldSource.includes("shadowFocusRevision"), "world.js should track shadow focus revision changes across scene reloads");
  assert(worldSource.includes("function initSkyRuntime"), "world.js should initialize a static sky runtime");
  assert(worldSource.includes("function updateSkyRuntime"), "world.js should expose a sky update helper");
  assert(worldSource.includes("window.updateSkyRuntime = updateSkyRuntime;"), "world.js should keep sky updates wired through the world shell");
  assert(inputSource.includes("const inputControllerRuntime = window.InputControllerRuntime || null;"), "input-render.js should adopt the input controller bridge");
  assert(inputSource.includes("resolvePointerDown"), "input-render.js should delegate pointer decisions to the input controller bridge");
  assert(inputSource.includes("resolveMouseWheelCameraDistance"), "input-render.js should delegate zoom decisions to the input controller bridge");
  assert(inputSource.includes("function maybeUpdateMainDirectionalShadowFocus"), "input-render.js should throttle directional shadow focus updates through a helper");
  assert(inputSource.includes("window.updateMainDirectionalShadowFocus"), "input-render.js should keep directional shadow focus wired through the world shell");
  assert(inputSource.includes("window.updateSkyRuntime(camera.position, frameNowMs);"), "input-render.js should refresh the sky runtime from animate()");

  console.log("Render/input shell guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
