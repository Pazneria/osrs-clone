const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "mining-pose-reference-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const resourceIndex = manifestSource.indexOf('id: "world-chunk-resource-render-runtime"');
  const poseIndex = manifestSource.indexOf('id: "world-mining-pose-reference-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(resourceIndex !== -1 && poseIndex !== -1 && resourceIndex < poseIndex, "legacy manifest should load mining pose references after resource render helpers");
  assert(poseIndex !== -1 && worldIndex !== -1 && poseIndex < worldIndex, "legacy manifest should load mining pose reference runtime before world.js");
  assert(worldSource.includes("WorldMiningPoseReferenceRuntime"), "world.js should delegate mining pose references through the runtime");
  assert(runtimeSource.includes("window.WorldMiningPoseReferenceRuntime"), "mining pose reference runtime should expose a window runtime");
  assert(runtimeSource.includes("function spawnMiningPoseReferences(options = {})"), "mining pose reference runtime should own reference spawning");
  assert(runtimeSource.includes("function updateMiningPoseReferences(options = {})"), "mining pose reference runtime should own reference animation updates");
  assert(runtimeSource.includes("function applyMiningReferenceVariant(rigRoot, variantIndex, frameNowMs, options = {})"), "mining pose reference runtime should own pose variant math");
  assert(runtimeSource.includes("const MINING_REFERENCE_VARIANTS = Object.freeze(["), "mining pose reference runtime should own variant metadata");
  assert(!worldSource.includes("function applyMiningReferenceVariant"), "world.js should not own mining pose variant math");
  assert(!worldSource.includes("const MINING_REFERENCE_VARIANTS ="), "world.js should not own mining pose variant metadata");
  assert(!worldSource.includes("let miningPoseReferences = []"), "world.js should not own mining pose reference state");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "mining-pose-reference-runtime.js") });
  assert(window.WorldMiningPoseReferenceRuntime, "mining pose reference runtime should be available after evaluation");
  assert(typeof window.WorldMiningPoseReferenceRuntime.spawnMiningPoseReferences === "function", "mining pose runtime should expose spawnMiningPoseReferences");
  assert(typeof window.WorldMiningPoseReferenceRuntime.updateMiningPoseReferences === "function", "mining pose runtime should expose updateMiningPoseReferences");

  console.log("Mining pose reference runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
