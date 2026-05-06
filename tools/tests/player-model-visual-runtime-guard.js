const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function countOccurrences(source, needle) {
  return source.split(needle).length - 1;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "player-model-visual-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const playerModelSource = fs.readFileSync(path.join(root, "src", "js", "player-model.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const visualRuntimeIndex = manifestSource.indexOf('id: "player-model-visual-runtime"');
  const heldItemRuntimeIndex = manifestSource.indexOf('id: "player-held-item-runtime"');
  const playerModelIndex = manifestSource.indexOf('id: "player-model"');

  assert(manifestSource.includes("../../js/player-model-visual-runtime.js?raw"), "legacy manifest should import the player model visual runtime raw script");
  assert(visualRuntimeIndex !== -1, "legacy manifest should include player model visual runtime");
  assert(playerModelIndex !== -1 && visualRuntimeIndex < playerModelIndex, "legacy manifest should load player model visual runtime before player-model.js");
  assert(heldItemRuntimeIndex !== -1 && visualRuntimeIndex < heldItemRuntimeIndex, "legacy manifest should load visual helpers before held-item/player-model consumers");

  assert(runtimeSource.includes("window.PlayerModelVisualRuntime"), "player model visual runtime should expose a window runtime");
  assert(runtimeSource.includes("function createPixelSourceVisualMeshes"), "visual runtime should own pixel-source mesh construction");
  assert(runtimeSource.includes("function publishPixelSourceVisualHooks(options = {})"), "visual runtime should own pixel-source hook publication");
  assert(runtimeSource.includes("function createPixelExtrudeGeometry"), "visual runtime should own pixel extrusion geometry");
  assert(runtimeSource.includes("function createColorizedMesh"), "visual runtime should own colorized mesh creation");
  assert(runtimeSource.includes("function packJagexHsl"), "visual runtime should own packed color helpers");
  assert(runtimeSource.includes("function createGeometry"), "visual runtime should own primitive geometry selection");

  assert(playerModelSource.includes("function getPlayerModelVisualRuntime()"), "player-model.js should resolve the visual runtime");
  assert(playerModelSource.includes("PlayerModelVisualRuntime missing"), "player-model.js should fail fast when the visual runtime is missing");
  assert(playerModelSource.includes("createColorizedMesh(buildPlayerModelVisualRuntimeOptions()"), "player-model.js should delegate colorized mesh construction");
  assert(playerModelSource.includes("createPixelSourceVisualMeshes(buildPlayerModelVisualRuntimeOptions()"), "player-model.js should delegate pixel-source mesh construction");
  assert(playerModelSource.includes("function getCreatorKitAppearanceFragments"), "player-model.js should resolve creator kit fragments");
  assert(playerModelSource.includes("function collectCreatorFragmentGroups"), "player-model.js should compose creator fragment groups");
  assert(playerModelSource.includes("function isCreatorSlotSuppressedByEquipment"), "player-model.js should suppress creator visuals behind equipment");
  assert(playerModelSource.includes("creatorSlot === 'hairStyle' || creatorSlot === 'faceStyle' || creatorSlot === 'facialHair'"), "head equipment should hide creator hair and face fragments");
  assert(playerModelSource.includes("creatorSlot === 'bodyStyle'") && playerModelSource.includes("creatorSlot === 'legStyle'") && playerModelSource.includes("creatorSlot === 'feetStyle'"), "body, leg, and feet equipment should hide matching starter creator fragments");
  assert(playerModelSource.includes("creatorSelections: sanitizeCreatorSelections"), "player-model.js should normalize creator selections for cached rig builds");
  assert(countOccurrences(playerModelSource, "function createPixelSourceVisualMeshes(") === 1, "player-model.js should keep only the compatibility pixel-source wrapper");
  assert(playerModelSource.includes("playerModelVisualRuntimeForPublication.publishPixelSourceVisualHooks({"), "player-model.js should publish pixel-source hooks through the visual runtime");
  assert(!playerModelSource.includes("window.createPixelSourceVisualMeshes = createPixelSourceVisualMeshes"), "player-model.js should not directly publish pixel-source mesh creation");
  assert(!playerModelSource.includes("function createPixelExtrudeGeometry"), "player-model.js should not own pixel extrusion geometry");
  assert(!playerModelSource.includes("new THREE.TorusGeometry"), "player-model.js should not own primitive geometry construction");
  assert(!playerModelSource.includes("function hslToRgb"), "player-model.js should not own color conversion helpers");

  const sandbox = { window: {}, Math, Number, Object, String, Array, Float32Array, parseInt };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.PlayerModelVisualRuntime;
  assert(runtime, "player model visual runtime should execute in isolation");
  assert(runtime.packJagexHsl(1, 2, 3) === 1283, "runtime should pack Jagex HSL values");
  assert(runtime.unpackJagexHsl(1283).h === 1, "runtime should unpack Jagex HSL hue");
  const rgb = runtime.hexColorToRgb("#336699");
  assert(rgb && Math.abs(rgb.r - 0.2) < 0.001 && Math.abs(rgb.g - 0.4) < 0.001 && Math.abs(rgb.b - 0.6) < 0.001, "runtime should parse hex RGB fragments");
  const publishedWindow = {};
  const createPixelSourceVisualMeshes = () => [];
  runtime.publishPixelSourceVisualHooks({ windowRef: publishedWindow, createPixelSourceVisualMeshes });
  assert(publishedWindow.createPixelSourceVisualMeshes === createPixelSourceVisualMeshes, "pixel-source hook publication should expose mesh creation");

  console.log("Player model visual runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
