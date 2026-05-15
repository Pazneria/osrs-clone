const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const runtimeSource = readRepoFile(root, "src/js/world/fire-lifecycle-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const renderRuntimeIndex = manifestSource.indexOf('id: "world-fire-render-runtime"');
  const lifecycleRuntimeIndex = manifestSource.indexOf('id: "world-fire-lifecycle-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(renderRuntimeIndex !== -1, "legacy manifest should include the fire render runtime");
  assert(lifecycleRuntimeIndex !== -1, "legacy manifest should include the fire lifecycle runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(renderRuntimeIndex < lifecycleRuntimeIndex && lifecycleRuntimeIndex < worldIndex, "legacy manifest should load fire lifecycle after fire render and before world.js");
  assert(runtimeSource.includes("window.WorldFireLifecycleRuntime"), "fire lifecycle runtime should expose a window runtime");
  assert(runtimeSource.includes("function spawnFireAtTile(context = {}, x, y, z, options = {})"), "fire lifecycle runtime should own fire spawning");
  assert(runtimeSource.includes("function tickFireLifecycle(context = {})"), "fire lifecycle runtime should own fire expiry ticks");
  assert(runtimeSource.includes("function syncFiremakingLogPreview(context = {})"), "fire lifecycle runtime should own firemaking log preview sync");
  assert(runtimeSource.includes("function findFireStepDestination(context = {})"), "fire lifecycle runtime should own fire step destination logic");
  assert(runtimeSource.includes("function resolveFireTargetFromHit(context = {}, hitData)"), "fire lifecycle runtime should own fire target hit resolution");
  assert(worldSource.includes("WorldFireLifecycleRuntime"), "world.js should delegate fire lifecycle behavior");
  assert(worldSource.includes("worldFireLifecycleRuntime.updateFires(buildFireLifecycleRuntimeContext(), frameNow);"), "world.js should delegate fire frame updates");
  assert(worldSource.includes("worldFireLifecycleRuntime.tryStepBeforeFiremaking(buildFireLifecycleRuntimeContext());"), "world.js should delegate pre-firemaking stepping");
  assert(!worldSource.includes("let activeFiremakingLogPreview = null;"), "world.js should not own firemaking log preview state");
  assert(!worldSource.includes("const FIRE_STEP_DIR = { x: 0, y: 1 };"), "world.js should not own fire step direction policy");
  assert(!worldSource.includes("function createFireVisualAt("), "world.js should not own fire visual creation");
  assert(!worldSource.includes("function attachFireVisualGroup("), "world.js should not own fire visual attachment");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "fire-lifecycle-runtime.js") });
  const runtime = window.WorldFireLifecycleRuntime;
  assert(runtime, "fire lifecycle runtime should be available after evaluation");
  assert(typeof runtime.isFireOccupiedAt === "function", "fire lifecycle runtime should expose fire occupancy checks");
  assert(typeof runtime.getFiremakingLogItemIdForPair === "function", "fire lifecycle runtime should expose firemaking pair resolution");

  const context = {
    activeFires: [{ x: 4, y: 5, z: 0 }],
    playerState: { x: 10, y: 10, z: 0 },
    SkillSpecRegistry: {
      getRecipeSet(skillId) {
        assert(skillId === "firemaking", "firemaking pair resolution should ask for the firemaking recipe set");
        return {
          logs: { sourceItemId: "logs" },
          oak_logs: { sourceItemId: "oak_logs" }
        };
      }
    }
  };

  assert(runtime.isFireOccupiedAt(context, 4, 5, 0), "fire occupancy should find matching active fires");
  assert(!runtime.isFireOccupiedAt(context, 5, 5, 0), "fire occupancy should reject non-matching tiles");
  assert(runtime.getFiremakingLogItemIdForPair(context, "tinderbox", "oak_logs") === "oak_logs", "tinderbox/log pairing should resolve the log item id");
  assert(runtime.resolveFireTargetFromHit(context, { gridX: 4, gridY: 5 })?.x === 4, "direct fire hit resolution should return active fire coordinates");

  console.log("Fire lifecycle runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
