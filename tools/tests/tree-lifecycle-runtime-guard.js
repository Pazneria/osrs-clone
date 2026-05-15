const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const inputSource = readRepoFile(root, "src/js/input-render.js");
  const runtimeSource = readRepoFile(root, "src/js/world/tree-lifecycle-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const treeNodeRuntimeIndex = manifestSource.indexOf('id: "world-tree-node-runtime"');
  const treeRenderRuntimeIndex = manifestSource.indexOf('id: "world-tree-render-runtime"');
  const treeLifecycleRuntimeIndex = manifestSource.indexOf('id: "world-tree-lifecycle-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(treeNodeRuntimeIndex !== -1, "legacy manifest should include the tree node runtime");
  assert(treeRenderRuntimeIndex !== -1, "legacy manifest should include the tree render runtime");
  assert(treeLifecycleRuntimeIndex !== -1, "legacy manifest should include the tree lifecycle runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(treeNodeRuntimeIndex < treeLifecycleRuntimeIndex && treeRenderRuntimeIndex < treeLifecycleRuntimeIndex && treeLifecycleRuntimeIndex < worldIndex, "legacy manifest should load tree lifecycle after tree helpers and before world.js");
  assert(runtimeSource.includes("window.WorldTreeLifecycleRuntime"), "tree lifecycle runtime should expose a window runtime");
  assert(runtimeSource.includes("function resolveTreeRespawnTicks(context = {}, gridX, gridY, z)"), "tree lifecycle runtime should own respawn tick resolution");
  assert(runtimeSource.includes("function chopDownTree(context = {}, gridX, gridY, z)"), "tree lifecycle runtime should own chop-down mutation");
  assert(runtimeSource.includes("function respawnTree(context = {}, gridX, gridY, z)"), "tree lifecycle runtime should own respawn mutation");
  assert(runtimeSource.includes("function tickTreeLifecycle(context = {})"), "tree lifecycle runtime should own respawn queue ticks");
  assert(worldSource.includes("WorldTreeLifecycleRuntime"), "world.js should delegate tree lifecycle behavior");
  assert(worldSource.includes("window.tickTreeLifecycle = tickTreeLifecycle;"), "world.js should expose the tree lifecycle tick hook");
  assert(inputSource.includes("window.tickTreeLifecycle()"), "input-render should delegate tree respawn ticks");
  assert(!inputSource.includes("for (let i = respawningTrees.length - 1;"), "input-render should not tick respawning trees inline");
  assert(!worldSource.includes("respawningTrees.push({ x: gridX, y: gridY, z: z, respawnTick: currentTick + respawnTicks });"), "world.js should not enqueue tree respawns inline");
  assert(!worldSource.includes("logicalMap[z][gridY][gridX] = 4;"), "world.js should not mutate tree stump tiles inline");
  assert(!worldSource.includes("logicalMap[z][gridY][gridX] = 1;"), "world.js should not mutate tree respawn tiles inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "tree-lifecycle-runtime.js") });
  const runtime = window.WorldTreeLifecycleRuntime;
  assert(runtime, "tree lifecycle runtime should be available after evaluation");

  const visualUpdates = [];
  const planeGroup = { userData: { z: 0 } };
  const logicalMap = [[
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ]];
  const context = {
    THREE: {},
    chunkSize: 8,
    currentTick: 10,
    getTreeNodeAt: () => ({ nodeId: "oak_tree" }),
    getWorldChunkSceneRuntime: () => ({
      getNearChunkGroup: () => ({ children: [planeGroup] })
    }),
    heightMap: [[
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]],
    logicalMap,
    markTreeVisualsDirty: () => {},
    respawningTrees: [],
    setTreeVisualState: () => {},
    skillSpecRegistry: {
      getNodeTable: () => ({
        oak_tree: { respawnTicks: 7 },
        normal_tree: { respawnTicks: 18 }
      })
    },
    tileIds: { DIRT: 4, GRASS: 1 },
    worldChunkResourceRenderRuntime: {
      setChunkTreeStumpVisual: (options) => visualUpdates.push(options.isStump)
    }
  };

  assert(runtime.resolveTreeRespawnTicks(context, 1, 1, 0) === 7, "tree lifecycle should resolve node-specific respawn ticks");
  runtime.chopDownTree(context, 1, 1, 0);
  assert(logicalMap[0][1][1] === 4, "chop-down should change the logical tile to stump terrain");
  assert(context.respawningTrees.length === 1, "chop-down should queue one respawning tree");
  assert(context.respawningTrees[0].respawnTick === 17, "chop-down should schedule respawn from the current tick");
  assert(visualUpdates[0] === true, "chop-down should request stump visuals");
  context.currentTick = 16;
  assert(runtime.tickTreeLifecycle(context) === 0, "tree lifecycle should not respawn early");
  context.currentTick = 17;
  assert(runtime.tickTreeLifecycle(context) === 1, "tree lifecycle should respawn ready entries");
  assert(logicalMap[0][1][1] === 1, "respawn should restore the logical tree tile");
  assert(context.respawningTrees.length === 0, "tree lifecycle should remove respawned entries");
  assert(visualUpdates[1] === false, "respawn should request restored tree visuals");

  console.log("Tree lifecycle runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
