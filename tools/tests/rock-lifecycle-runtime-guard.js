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
  const runtimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "rock-lifecycle-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const rockNodeRuntimeIndex = manifestSource.indexOf('id: "world-rock-node-runtime"');
  const rockRenderRuntimeIndex = manifestSource.indexOf('id: "world-rock-render-runtime"');
  const rockLifecycleRuntimeIndex = manifestSource.indexOf('id: "world-rock-lifecycle-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(rockNodeRuntimeIndex !== -1, "legacy manifest should include the rock node runtime");
  assert(rockRenderRuntimeIndex !== -1, "legacy manifest should include the rock render runtime");
  assert(rockLifecycleRuntimeIndex !== -1, "legacy manifest should include the rock lifecycle runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(rockNodeRuntimeIndex < rockLifecycleRuntimeIndex && rockRenderRuntimeIndex < rockLifecycleRuntimeIndex && rockLifecycleRuntimeIndex < worldIndex, "legacy manifest should load rock lifecycle after rock helpers and before world.js");
  assert(runtimeSource.includes("window.WorldRockLifecycleRuntime"), "rock lifecycle runtime should expose a window runtime");
  assert(runtimeSource.includes("function rebuildRockNodes(context = {})"), "rock lifecycle runtime should own rock-node rebuilds");
  assert(runtimeSource.includes("function getRockNodeAt(context = {}, x, y, z = 0)"), "rock lifecycle runtime should own rock-node lookup");
  assert(runtimeSource.includes("function depleteRockNode(context = {}, x, y, z = 0, respawnTicks = 12)"), "rock lifecycle runtime should own depletion orchestration");
  assert(runtimeSource.includes("function tickRockNodes(context = {})"), "rock lifecycle runtime should own respawn refresh ticks");
  assert(worldSource.includes("WorldRockLifecycleRuntime"), "world.js should delegate rock lifecycle behavior");
  assert(worldSource.includes("window.tickRockNodes = tickRockNodes;"), "world.js should expose the rock lifecycle tick hook");
  assert(inputSource.includes("window.tickRockNodes()"), "input-render should delegate rock respawn ticks");
  assert(!inputSource.includes("if (typeof tickRockNodes === 'function') tickRockNodes();"), "input-render should not call the local rock tick function directly");
  assert(!worldSource.includes("node.depletedUntilTick = currentTick + Math.max(1, respawnTicks);"), "world.js should not mutate rock depletion records inline");
  assert(!worldSource.includes("const rebuilt = {};"), "world.js should not rebuild rock-node tables inline");
  assert(!worldSource.includes("rockNodes[key] = {"), "world.js should not create rock-node records inline");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "rock-lifecycle-runtime.js") });
  const runtime = window.WorldRockLifecycleRuntime;
  assert(runtime, "rock lifecycle runtime should be available after evaluation");

  const refreshEvents = [];
  const rockNodeRuntime = {
    rockNodeKey: (x, y, z = 0) => `${z}:${x},${y}`,
    oreTypeForTile: ({ x, y, z, rockOreOverrides }) => rockOreOverrides[`${z}:${x},${y}`] || "clay",
    depleteRockNodeRecord: (node, currentTick, respawnTicks) => {
      node.depletedUntilTick = currentTick + Math.max(1, respawnTicks);
      node.successfulYields = 0;
      node.lastInteractionTick = 0;
      return true;
    },
    tickRockNodeRespawns: ({ rockNodes, currentTick, chunkSize }) => {
      const chunks = new Set();
      Object.entries(rockNodes).forEach(([key, node]) => {
        if (!node.depletedUntilTick || currentTick < node.depletedUntilTick) return;
        node.depletedUntilTick = 0;
        const xy = key.split(":")[1].split(",");
        chunks.add(Math.floor(Number(xy[0]) / chunkSize) + "," + Math.floor(Number(xy[1]) / chunkSize));
      });
      return Array.from(chunks);
    }
  };
  const rockNodes = {
    "0:1,1": {
      oreType: "iron",
      depletedUntilTick: 25,
      successfulYields: 2,
      lastInteractionTick: 4,
      areaName: "Old quarry"
    }
  };
  const context = {
    chunkSize: 8,
    currentTick: 20,
    getWorldChunkSceneRuntime: () => ({
      isNearChunkLoaded: () => true,
      getChunkInteractionState: (key) => key === "0,0"
    }),
    loadChunk: (cx, cy, wasInteractive) => refreshEvents.push(`load:${cx},${cy}:${wasInteractive}`),
    logicalMap: [[
      [0, 0, 0],
      [0, 3, 3],
      [0, 0, 0]
    ]],
    mapSize: 3,
    planes: 1,
    rockAreaGateOverrides: {
      "0:2,1": {
        areaGateFlag: "mineUnlocked",
        areaName: "New mine",
        areaGateMessage: "Locked."
      }
    },
    rockNodeRuntime,
    rockNodes,
    rockOreOverrides: { "0:2,1": "coal" },
    runeEssenceRocks: [],
    tileIds: { ROCK: 3 },
    unloadChunk: (key) => refreshEvents.push(`unload:${key}`)
  };

  const rebuilt = runtime.rebuildRockNodes(context);
  assert(rebuilt["0:1,1"].oreType === "iron", "rebuild should preserve existing rock ore metadata");
  assert(rebuilt["0:1,1"].successfulYields === 2, "rebuild should preserve successful yield counts");
  assert(rebuilt["0:2,1"].oreType === "coal", "rebuild should resolve authored ore overrides");
  assert(rebuilt["0:2,1"].areaGateFlag === "mineUnlocked", "rebuild should attach area gate metadata");

  context.rockNodes = rebuilt;
  const node = runtime.getRockNodeAt(context, 2, 1, 0);
  assert(node && node.oreType === "coal", "lookup should return rebuilt rock nodes");
  assert(runtime.isRockNodeDepleted(context, 1, 1, 0), "depleted lookup should compare against current tick");
  assert(runtime.depleteRockNode(context, 2, 1, 0, 6), "deplete should mutate a valid rock node");
  assert(node.depletedUntilTick === 26, "deplete should schedule respawn through the node runtime");
  assert(refreshEvents.includes("unload:0,0") && refreshEvents.includes("load:0,0:true"), "deplete should refresh the loaded chunk");
  context.currentTick = 26;
  assert(runtime.tickRockNodes(context) === 1, "tick should refresh chunks for respawned rocks");
  assert(node.depletedUntilTick === 0, "tick should clear ready depletion state");

  console.log("Rock lifecycle runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
