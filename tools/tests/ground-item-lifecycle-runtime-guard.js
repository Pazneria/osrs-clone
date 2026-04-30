const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "ground-item-lifecycle-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const renderRuntimeIndex = manifestSource.indexOf('id: "world-ground-item-render-runtime"');
  const lifecycleRuntimeIndex = manifestSource.indexOf('id: "world-ground-item-lifecycle-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(renderRuntimeIndex !== -1, "legacy manifest should include the ground-item render runtime");
  assert(lifecycleRuntimeIndex !== -1, "legacy manifest should include the ground-item lifecycle runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(renderRuntimeIndex < lifecycleRuntimeIndex && lifecycleRuntimeIndex < worldIndex, "legacy manifest should load ground-item lifecycle after render and before world.js");
  assert(runtimeSource.includes("window.WorldGroundItemLifecycleRuntime"), "ground-item lifecycle runtime should expose a window runtime");
  assert(runtimeSource.includes("function spawnGroundItem(context = {}, itemData, x, y, z, amount = 1, options = {})"), "ground-item lifecycle runtime should own spawning");
  assert(runtimeSource.includes("function dropItem(context = {}, invIndex)"), "ground-item lifecycle runtime should own inventory drop flow");
  assert(runtimeSource.includes("function updateGroundItems(context = {})"), "ground-item lifecycle runtime should own despawn ticks");
  assert(runtimeSource.includes("function takeGroundItemByUid(context = {}, uid)"), "ground-item lifecycle runtime should own take-by-uid flow");
  assert(worldSource.includes("WorldGroundItemLifecycleRuntime"), "world.js should delegate ground-item lifecycle behavior");
  assert(worldSource.includes("worldGroundItemLifecycleRuntime.spawnGroundItem(buildGroundItemLifecycleRuntimeContext(), itemData, x, y, z, amount, options);"), "world.js should delegate ground-item spawning");
  assert(worldSource.includes("window.takeGroundItemByUid = takeGroundItemByUid;"), "world.js should expose take-by-uid compatibility hook");
  assert(inputSource.includes("window.takeGroundItemByUid(playerState.targetUid)"), "input-render should delegate ground-item pickup");
  assert(!worldSource.includes("const uid = Date.now() + Math.random();"), "world.js should not own ground-item uid creation");
  assert(!worldSource.includes("new THREE.BoxGeometry(0.8, 0.8, 0.8)"), "world.js should not own ground-item hitbox construction");
  assert(!inputSource.includes("groundItems = groundItems.filter(gi => gi.uid !== itemEntry.uid);"), "input-render should not mutate groundItems directly for pickup");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "ground-item-lifecycle-runtime.js") });
  const runtime = window.WorldGroundItemLifecycleRuntime;
  assert(runtime, "ground-item lifecycle runtime should be available after evaluation");

  const removedMeshes = [];
  const environmentMeshes = [{ id: "hit" }, { id: "visual" }];
  const groundItems = [{
    uid: 42,
    amount: 2,
    itemData: { id: "coins", name: "Coins", stackable: true },
    mesh: {
      parent: { remove: (mesh) => removedMeshes.push(mesh) },
      children: environmentMeshes.slice()
    }
  }];
  const context = {
    currentTick: 5,
    environmentMeshes,
    giveItem: () => 2,
    groundItems,
    renderInventory: () => {
      context.rendered = true;
    }
  };

  assert(runtime.takeGroundItemByUid(context, 42), "take-by-uid should remove a takeable ground item");
  assert(context.rendered, "take-by-uid should refresh inventory after a successful take");
  assert(groundItems.length === 0, "take-by-uid should remove the ground item entry");
  assert(environmentMeshes.length === 0, "take-by-uid should unregister ground item interaction meshes");
  assert(removedMeshes.length === 1, "take-by-uid should detach the ground item mesh from its parent");

  console.log("Ground item lifecycle runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
