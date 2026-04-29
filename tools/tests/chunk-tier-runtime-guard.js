const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const chunkRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-scene-runtime.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");

  assert(coreSource.includes("CHUNK_RENDER_POLICY_PRESETS"), "core.js should define chunk render policy presets");
  assert(coreSource.includes("applyChunkRenderPolicyPreset"), "core.js should expose chunk policy preset mutation");
  assert(coreSource.includes("getChunkRenderPolicyRevision"), "core.js should expose chunk policy revision tracking");

  assert(chunkRuntimeSource.includes("collectDesiredChunkTierAssignments"), "chunk scene runtime should build tier assignments for chunks");
  assert(worldSource.includes("ensureFarChunkBackdropBuilt"), "world.js should prebuild far chunk backdrops");
  assert(chunkRuntimeSource.includes("applyChunkTierForKey"), "chunk scene runtime should apply tier transitions by chunk");
  assert(chunkRuntimeSource.includes("pendingNearChunkBuilds"), "chunk scene runtime should track pending near-chunk builds");
  assert(chunkRuntimeSource.includes("enqueuePendingNearChunkBuild"), "chunk scene runtime should queue near-tier promotions instead of building them inline");
  assert(worldSource.includes("WorldChunkSceneRuntime"), "world.js should delegate chunk orchestration through the chunk scene runtime");
  assert(chunkRuntimeSource.includes("processPendingNearChunkBuilds"), "chunk scene runtime should process pending near-chunk builds over time");
  assert(chunkRuntimeSource.includes("chunkInteractionMeshes.set(key"), "chunk scene runtime should cache interaction meshes per near chunk");
  assert(
    chunkRuntimeSource.includes("targetTier === CHUNK_TIER_NEAR && policyState.desiredInteractionChunks.has(key)"),
    "chunk scene runtime should keep interaction registration constrained to near-tier chunks"
  );
  assert(chunkRuntimeSource.includes("function reportChunkPerformanceSample"), "chunk scene runtime should define auto quality sampling");
  assert(chunkRuntimeSource.includes("stepChunkRenderPolicyPreset(-1"), "chunk scene runtime should support quality downgrade");
  assert(chunkRuntimeSource.includes("stepChunkRenderPolicyPreset(1"), "chunk scene runtime should support quality upgrade");
  assert(!coreSource.includes("let loadedChunks = new Set()"), "core.js should no longer own loaded chunk state");
  assert(!worldSource.includes("const pendingNearChunkBuilds = new Map()"), "world.js should no longer own pending near-chunk state");
  assert(!worldSource.includes("let chunkAutoQualityState"), "world.js should no longer own chunk auto-quality state");

  assert(
    inputSource.includes("window.reportChunkPerformanceSample"),
    "input-render.js should report fps samples to chunk quality controller"
  );
  assert(
    inputSource.includes("window.processPendingNearChunkBuilds"),
    "input-render.js should process pending near-chunk builds from the render loop"
  );

  global.window = {};
  vm.runInThisContext(chunkRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-scene-runtime.js") });
  const runtime = window.WorldChunkSceneRuntime;
  assert(runtime, "chunk scene runtime should expose a window runtime");

  const interactionEvents = [];
  runtime.registerNearChunk("0,0", { id: "near-a" }, { interactionMeshes: ["mesh-a"], registerInteraction: true });
  assert(runtime.isNearChunkLoaded("0,0"), "chunk scene runtime should register near chunk loads");
  assert(runtime.getNearChunkGroup("0,0").id === "near-a", "chunk scene runtime should expose near chunk groups");
  runtime.setChunkInteractionState("0,0", false, {
    setChunkInteractionMeshesActive: (meshes, active) => interactionEvents.push(`${meshes.join(",")}:${active}`)
  });
  assert(interactionEvents.includes("mesh-a:false"), "chunk scene runtime should toggle cached near-chunk interaction meshes");
  const unregisterEvents = [];
  runtime.unregisterNearChunk("0,0", {
    unloadNearChunkGroup: (key, group) => unregisterEvents.push(`${key}:${group.id}`)
  });
  assert(!runtime.isNearChunkLoaded("0,0"), "chunk scene runtime should unregister near chunks");
  assert(unregisterEvents.includes("0,0:near-a"), "chunk scene runtime should delegate near chunk mesh unloading");

  runtime.registerNearChunk("0,0", { id: "near-b" }, { interactionMeshes: ["mesh-b"], registerInteraction: true });
  runtime.registerNearChunk("1,0", { id: "near-c" }, { interactionMeshes: ["mesh-c"], registerInteraction: false });
  runtime.setMidChunkGroup("2,0", { id: "mid-a" });
  runtime.setFarChunkGroup("2,1", { id: "far-a" });
  const resetEvents = [];
  runtime.resetForWorldReload({
    unloadNearChunkGroup: (key, group) => resetEvents.push(`unload:${key}:${group.id}`),
    removeChunkGroupFromScene: (group) => resetEvents.push(`remove:${group.id}`),
    bumpShadowFocusRevision: () => resetEvents.push("bump-shadow")
  });
  assert(resetEvents.includes("unload:0,0:near-b") && resetEvents.includes("unload:1,0:near-c"), "chunk scene runtime reset should unload loaded near chunks");
  assert(resetEvents.includes("remove:mid-a") && resetEvents.includes("remove:far-a"), "chunk scene runtime reset should remove mid and far groups");
  assert(resetEvents.includes("bump-shadow"), "chunk scene runtime reset should bump shadow focus revision through the host context");

  const manageEvents = [];
  const groups = {};
  const manageContext = {
    worldChunksX: 3,
    worldChunksY: 3,
    chunkSize: 10,
    hasPlayerRig: () => true,
    getChunkCenterPosition: () => ({ x: 12, z: 12, visiblePlane: 0 }),
    getChunkRenderPolicy: () => ({ preset: "balanced", nearRadius: 0, midRadius: 1, interactionRadius: 0, farMode: "all" }),
    getChunkRenderPolicyRevision: () => 1,
    ensureFarChunkBackdropBuilt: () => manageEvents.push("backdrop"),
    ensureFarChunkGroup: (cx, cy) => {
      const key = `${cx},${cy}`;
      const group = { id: `far:${key}`, visible: false };
      groups[key] = group;
      return runtime.setFarChunkGroup(key, group);
    },
    ensureMidChunkGroup: (cx, cy) => {
      const key = `${cx},${cy}`;
      const group = { id: `mid:${key}`, visible: false };
      groups[key] = group;
      return runtime.setMidChunkGroup(key, group);
    },
    setChunkGroupPlaneVisibility: (group, plane) => manageEvents.push(`plane:${group.id}:${plane}`),
    loadNearChunk: (cx, cy, registerInteraction) => {
      const key = `${cx},${cy}`;
      manageEvents.push(`load:${key}:${registerInteraction}`);
      runtime.registerNearChunk(key, { id: `near:${key}`, visible: false }, { interactionMeshes: [`mesh:${key}`], registerInteraction });
    },
    unloadNearChunkGroup: (key, group) => manageEvents.push(`unload:${key}:${group.id}`),
    setChunkInteractionMeshesActive: (meshes, active) => manageEvents.push(`interaction:${meshes.join(",")}:${active}`)
  };
  runtime.manageChunks(Object.assign({ forceRefresh: true }, manageContext));
  assert(manageEvents.includes("backdrop"), "chunk scene runtime should ask the host to ensure far chunk backdrops");
  assert(!runtime.isNearChunkLoaded("1,1"), "chunk scene runtime should queue near chunk promotions before processing them");
  runtime.processPendingNearChunkBuilds({ maxBuilds: 1, context: manageContext });
  assert(runtime.isNearChunkLoaded("1,1"), "chunk scene runtime should process the nearest pending near chunk first");
  const eventCountAfterManage = manageEvents.length;
  runtime.manageChunks(Object.assign({ forceRefresh: false }, manageContext));
  assert(manageEvents.length === eventCountAfterManage, "chunk scene runtime should skip redundant manage passes when policy state is clean");

  let activePreset = "balanced";
  const qualityEvents = [];
  const qualityContext = {
    getChunkRenderPolicy: () => ({ preset: activePreset, nearRadius: 1, midRadius: 2, interactionRadius: 1, farMode: "all" }),
    getChunkRenderPolicyPresetOrder: () => ["safe", "balanced", "high"],
    applyChunkRenderPolicyPreset: (preset) => {
      activePreset = preset;
      qualityEvents.push(preset);
      return true;
    }
  };
  runtime.reportChunkPerformanceSample(30, 20000, qualityContext);
  runtime.reportChunkPerformanceSample(30, 23001, qualityContext);
  runtime.reportChunkPerformanceSample(30, 24000, qualityContext);
  runtime.reportChunkPerformanceSample(30, 27001, qualityContext);
  assert(qualityEvents.includes("safe"), "chunk scene runtime should downgrade quality after repeated low-fps windows");
  runtime.reportChunkPerformanceSample(55, 40000, qualityContext);
  runtime.reportChunkPerformanceSample(55, 43001, qualityContext);
  runtime.reportChunkPerformanceSample(55, 44000, qualityContext);
  runtime.reportChunkPerformanceSample(55, 47001, qualityContext);
  runtime.reportChunkPerformanceSample(55, 48000, qualityContext);
  runtime.reportChunkPerformanceSample(55, 51001, qualityContext);
  assert(qualityEvents.includes("balanced"), "chunk scene runtime should upgrade quality after repeated high-fps windows");

  console.log("Chunk tier runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
