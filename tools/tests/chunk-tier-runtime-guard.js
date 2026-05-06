const fs = require("fs");
const path = require("path");
const vm = require("vm");
const THREE = require("three");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const chunkRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-scene-runtime.js"), "utf8");
  const chunkTierRenderRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "chunk-tier-render-runtime.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const legacyManifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(chunkRuntimeSource.includes("CHUNK_RENDER_POLICY_PRESETS"), "chunk scene runtime should define chunk render policy presets");
  assert(chunkRuntimeSource.includes("applyChunkRenderPolicyPreset"), "chunk scene runtime should expose chunk policy preset mutation");
  assert(chunkRuntimeSource.includes("getChunkRenderPolicyRevision"), "chunk scene runtime should expose chunk policy revision tracking");
  assert(!coreSource.includes("CHUNK_RENDER_POLICY_PRESETS"), "core.js should not own chunk render policy presets");
  assert(!worldSource.includes("getChunkRenderPolicy: () =>"), "world.js should not broker chunk render policy through context callbacks");

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
  assert(legacyManifestSource.includes('id: "world-chunk-tier-render-runtime"'), "legacy script manifest should include the chunk tier render runtime");
  assert(worldSource.includes("WorldChunkTierRenderRuntime"), "world.js should delegate simplified tier chunk rendering");
  assert(chunkTierRenderRuntimeSource.includes("window.WorldChunkTierRenderRuntime"), "chunk tier render runtime should expose a window runtime");
  assert(chunkTierRenderRuntimeSource.includes("function createSimplifiedChunkGroup(options = {})"), "chunk tier render runtime should own simplified chunk group construction");
  assert(chunkTierRenderRuntimeSource.includes("function createSimplifiedTerrainMesh(options = {})"), "chunk tier render runtime should own simplified tier terrain construction");
  assert(chunkTierRenderRuntimeSource.includes("function createSimplifiedWaterMeshes(options = {})"), "chunk tier render runtime should own simplified tier water construction");
  assert(chunkTierRenderRuntimeSource.includes("terrainGeo.setIndex(filteredTerrainIndices);"), "simplified tier terrain should filter water-covered cells out of the grass mesh");
  assert(chunkTierRenderRuntimeSource.includes("? CHUNK_SIZE"), "mixed land/water simplified terrain should switch to tile-accurate segmentation");
  assert(chunkTierRenderRuntimeSource.includes("function ensureSimplifiedTerrainMaterialSet"), "simplified tier terrain should own a low-detail tile material set");
  assert(chunkTierRenderRuntimeSource.includes("function getSimplifiedTerrainMaterialIndex(tile, TileId)"), "simplified tier terrain should classify authored tile ids before near chunks load");
  assert(chunkTierRenderRuntimeSource.includes("const hasTerrainMaterialVariation = terrainMaterialCoverage.size > 1"), "simplified tier terrain should detect non-grass tile coverage");
  assert(chunkTierRenderRuntimeSource.includes("const terrainIndicesByMaterial = terrainMaterials.map(() => []);"), "simplified tier terrain should bucket geometry by tile material");
  assert(chunkTierRenderRuntimeSource.includes("terrainGeo.addGroup(groupStart, indices.length, materialIndex);"), "simplified tier terrain should render grouped low-detail tile materials");
  assert(chunkTierRenderRuntimeSource.includes("const isMixedChunk = hasLandCoverage && hasWaterCoverage;"), "simplified tier water should distinguish mixed shore chunks from open ocean chunks");
  assert(chunkTierRenderRuntimeSource.includes("function ensureSimplifiedStructureProxyAssets"), "simplified tier chunks should own low-detail structure proxy assets");
  assert(chunkTierRenderRuntimeSource.includes("function getStructureStampBounds"), "simplified tier chunks should derive building proxy bounds from authored stamps");
  assert(chunkTierRenderRuntimeSource.includes("function chunkOwnsStructureProxy"), "simplified tier chunks should assign each building proxy to a single owning chunk");
  assert(chunkTierRenderRuntimeSource.includes("function collectStructureProxyBounds"), "simplified tier chunks should know which authored building areas are covered by proxies");
  assert(chunkTierRenderRuntimeSource.includes("function isStructureProxyCoveredTile"), "simplified tier chunks should suppress duplicate wall details inside proxy footprints");
  assert(chunkTierRenderRuntimeSource.includes("function appendSimplifiedStructureProxies(options = {})"), "simplified tier chunks should render low-detail structure proxies before near chunks load");
  assert(chunkTierRenderRuntimeSource.includes("type: 'STRUCTURE_PROXY'"), "simplified building proxies should be tagged as visual structure proxies");
  assert(chunkTierRenderRuntimeSource.includes("function addSimplifiedChunkFeatures(options = {})"), "chunk tier render runtime should own simplified tier feature rendering");
  assert(worldSource.includes("sharedMaterials.activeStampedStructures"), "world.js should retain stamped structure metadata for simplified chunk proxies");
  assert(
    worldSource.includes("stampedStructures: Array.isArray(sharedMaterials.activeStampedStructures)"),
    "world.js should pass stamped structures into simplified chunk rendering"
  );
  assert(
    worldSource.includes("roofLandmarks: Array.isArray(sharedMaterials.activeRoofLandmarks)"),
    "world.js should pass roof landmarks into simplified chunk rendering"
  );
  assert(!worldSource.includes("function ensureChunkTierRenderAssets"), "world.js should not own chunk tier render asset setup");
  assert(!worldSource.includes("function createSimplifiedTerrainMesh"), "world.js should not own simplified tier terrain construction");
  assert(!worldSource.includes("function addSimplifiedChunkFeatures"), "world.js should not own simplified tier feature rendering");

  assert(
    inputSource.includes("window.reportChunkPerformanceSample"),
    "input-render.js should report fps samples to chunk quality controller"
  );
  assert(
    inputSource.includes("window.processPendingNearChunkBuilds"),
    "input-render.js should process pending near-chunk builds from the render loop"
  );

  global.window = {};
  vm.runInThisContext(chunkTierRenderRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-tier-render-runtime.js") });
  const tierRuntime = window.WorldChunkTierRenderRuntime;
  assert(tierRuntime, "chunk tier render runtime should expose a window runtime");
  {
    const tileIds = { GRASS: 0, WATER_SHALLOW: 21, WATER_DEEP: 22 };
    const allWaterMap = [[
      [tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP],
      [tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP],
      [tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP],
      [tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP, tileIds.WATER_DEEP]
    ]];
    const heightMap = [[
      [-0.18, -0.18, -0.18, -0.18],
      [-0.18, -0.18, -0.18, -0.18],
      [-0.18, -0.18, -0.18, -0.18],
      [-0.18, -0.18, -0.18, -0.18]
    ]];
    const waterBody = {
      id: "test-sea",
      surfaceY: -0.075,
      styleTokens: {
        shallowColor: 0x78b3c4,
        deepColor: 0x3f748d,
        foamColor: 0xe5f6fc,
        shoreColor: 0xd5c393,
        rippleColor: 0xa7e0f0,
        highlightColor: 0xf9ffff,
        opacity: 0.86,
        shoreOpacity: 0.52
      }
    };
    const sharedMaterials = {
      grassTile: new THREE.MeshBasicMaterial(),
      chunkFarTerrain: new THREE.MeshBasicMaterial(),
      chunkMidTerrain: new THREE.MeshBasicMaterial()
    };
    const sharedGeometries = {};
    const group = tierRuntime.createSimplifiedChunkGroup({
      THREE,
      CHUNK_SIZE: 4,
      MAP_SIZE: 4,
      PLANES: 1,
      CHUNK_TIER_FAR: "far",
      CHUNK_TIER_MID: "mid",
      TileId: tileIds,
      sharedMaterials,
      sharedGeometries,
      logicalMap: allWaterMap,
      heightMap,
      playerState: { z: 0 },
      waterRenderBodies: [waterBody],
      getVisualTileId: (tile) => tile,
      isTreeTileId: () => false,
      isWaterTileId: (tile) => tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP,
      isPierVisualCoverageTile: () => false,
      getActivePierConfig: () => null,
      getWaterSurfaceMaterial: () => new THREE.MeshBasicMaterial(),
      resolveVisualWaterRenderBodyForTile: (waterBodies, x, y) => {
        const tile = allWaterMap[0][y][x];
        return tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP ? waterBodies[0] : null;
      },
      cx: 0,
      cy: 0,
      tier: "far"
    });
    const planeGroup = group.children[0];
    assert(!planeGroup.children.some((child) => child.userData && child.userData.type === "GROUND"), "all-water far chunks should not render a grass terrain plane");
    const waterMesh = planeGroup.children.find((child) => child.userData && child.userData.type === "WATER");
    assert(waterMesh, "all-water far chunks should render simplified water");
    assert(waterMesh.geometry.attributes.position.count === 6, "all-water far chunks should use one cheap water quad");
  }
  {
    const tileIds = { GRASS: 0, WATER_SHALLOW: 21, WATER_DEEP: 22 };
    const mixedMap = [[
      [tileIds.GRASS, tileIds.GRASS, tileIds.WATER_DEEP, tileIds.WATER_DEEP],
      [tileIds.GRASS, tileIds.GRASS, tileIds.WATER_DEEP, tileIds.WATER_DEEP],
      [tileIds.GRASS, tileIds.GRASS, tileIds.WATER_DEEP, tileIds.WATER_DEEP],
      [tileIds.GRASS, tileIds.GRASS, tileIds.WATER_DEEP, tileIds.WATER_DEEP]
    ]];
    const heightMap = [[
      [0, 0, -0.18, -0.18],
      [0, 0, -0.18, -0.18],
      [0, 0, -0.18, -0.18],
      [0, 0, -0.18, -0.18]
    ]];
    const waterBody = {
      id: "test-sea",
      surfaceY: -0.075,
      styleTokens: {
        shallowColor: 0x78b3c4,
        deepColor: 0x3f748d,
        foamColor: 0xe5f6fc,
        shoreColor: 0xd5c393,
        rippleColor: 0xa7e0f0,
        highlightColor: 0xf9ffff,
        opacity: 0.86,
        shoreOpacity: 0.52
      }
    };
    const group = tierRuntime.createSimplifiedChunkGroup({
      THREE,
      CHUNK_SIZE: 4,
      MAP_SIZE: 4,
      PLANES: 1,
      CHUNK_TIER_FAR: "far",
      CHUNK_TIER_MID: "mid",
      TileId: tileIds,
      sharedMaterials: {
        grassTile: new THREE.MeshBasicMaterial(),
        chunkFarTerrain: new THREE.MeshBasicMaterial(),
        chunkMidTerrain: new THREE.MeshBasicMaterial()
      },
      sharedGeometries: {},
      logicalMap: mixedMap,
      heightMap,
      playerState: { z: 0 },
      waterRenderBodies: [waterBody],
      getVisualTileId: (tile) => tile,
      isTreeTileId: () => false,
      isWaterTileId: (tile) => tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP,
      isPierVisualCoverageTile: () => false,
      getActivePierConfig: () => null,
      getWaterSurfaceMaterial: () => new THREE.MeshBasicMaterial(),
      resolveVisualWaterRenderBodyForTile: (waterBodies, x, y) => {
        const tile = mixedMap[0][y][x];
        return tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP ? waterBodies[0] : null;
      },
      cx: 0,
      cy: 0,
      tier: "far"
    });
    const planeGroup = group.children[0];
    const waterMesh = planeGroup.children.find((child) => child.userData && child.userData.type === "WATER");
    const waterPositions = Array.from(waterMesh.geometry.attributes.position.array);
    const waterXs = [];
    for (let i = 0; i < waterPositions.length; i += 3) waterXs.push(waterPositions[i]);
    assert(Math.min(...waterXs) >= 0, "mixed shoreline simplified water should not spill into land columns");
  }
  {
    const tileIds = {
      GRASS: 0,
      DIRT: 3,
      FLOOR_WOOD: 6,
      FLOOR_STONE: 7,
      FLOOR_BRICK: 8,
      SHORE: 20,
      WATER_SHALLOW: 21,
      WATER_DEEP: 22
    };
    const mixedTerrainMap = [[
      [tileIds.GRASS, tileIds.DIRT, tileIds.DIRT, tileIds.FLOOR_WOOD],
      [tileIds.SHORE, tileIds.DIRT, tileIds.FLOOR_STONE, tileIds.FLOOR_WOOD],
      [tileIds.GRASS, tileIds.GRASS, tileIds.FLOOR_BRICK, tileIds.FLOOR_STONE],
      [tileIds.GRASS, tileIds.DIRT, tileIds.GRASS, tileIds.GRASS]
    ]];
    const heightMap = [[
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]];
    const group = tierRuntime.createSimplifiedChunkGroup({
      THREE,
      CHUNK_SIZE: 4,
      MAP_SIZE: 4,
      PLANES: 1,
      CHUNK_TIER_FAR: "far",
      CHUNK_TIER_MID: "mid",
      TileId: tileIds,
      sharedMaterials: {
        grassTile: new THREE.MeshBasicMaterial(),
        dirtTile: new THREE.MeshBasicMaterial(),
        floor6: new THREE.MeshBasicMaterial(),
        floor7: new THREE.MeshBasicMaterial(),
        floor8: new THREE.MeshBasicMaterial()
      },
      sharedGeometries: {},
      logicalMap: mixedTerrainMap,
      heightMap,
      playerState: { z: 0 },
      waterRenderBodies: [],
      getVisualTileId: (tile) => tile,
      isTreeTileId: () => false,
      isWaterTileId: (tile) => tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP,
      isPierVisualCoverageTile: () => false,
      getActivePierConfig: () => null,
      getWaterSurfaceMaterial: () => new THREE.MeshBasicMaterial(),
      resolveVisualWaterRenderBodyForTile: () => null,
      cx: 0,
      cy: 0,
      tier: "far"
    });
    const planeGroup = group.children[0];
    const terrainMesh = planeGroup.children.find((child) => child.userData && child.userData.type === "GROUND");
    assert(terrainMesh, "mixed non-water far chunks should render simplified terrain");
    assert(Array.isArray(terrainMesh.material) && terrainMesh.material.length >= 7, "simplified terrain should use a tile-aware material array");
    assert(terrainMesh.geometry.parameters.widthSegments === 4, "non-grass far chunks should raise simplified terrain resolution enough to show paths");
    const groupMaterialIndices = new Set(terrainMesh.geometry.groups.map((group) => group.materialIndex));
    assert(groupMaterialIndices.has(1), "far terrain should keep dirt paths visible before near chunks load");
    assert(groupMaterialIndices.has(2), "far terrain should keep shore tiles visible before near chunks load");
    assert(groupMaterialIndices.has(4), "far terrain should keep wood floor tiles visible before near chunks load");
    assert(groupMaterialIndices.has(5), "far terrain should keep stone floor tiles visible before near chunks load");
    assert(groupMaterialIndices.has(6), "far terrain should keep brick floor tiles visible before near chunks load");
  }
  {
    const tileIds = {
      GRASS: 0,
      WALL: 11,
      TOWER: 12,
      WATER_SHALLOW: 21,
      WATER_DEEP: 22
    };
    const mapRows = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => tileIds.GRASS));
    mapRows[1][1] = tileIds.TOWER;
    mapRows[1][2] = tileIds.WALL;
    mapRows[1][3] = tileIds.WALL;
    mapRows[1][4] = tileIds.TOWER;
    mapRows[2][1] = tileIds.WALL;
    mapRows[2][4] = tileIds.WALL;
    mapRows[3][1] = tileIds.TOWER;
    mapRows[3][2] = tileIds.WALL;
    mapRows[3][3] = tileIds.WALL;
    mapRows[3][4] = tileIds.TOWER;
    const heightRows = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0));
    const group = tierRuntime.createSimplifiedChunkGroup({
      THREE,
      CHUNK_SIZE: 8,
      MAP_SIZE: 8,
      PLANES: 1,
      CHUNK_TIER_FAR: "far",
      CHUNK_TIER_MID: "mid",
      TileId: tileIds,
      sharedMaterials: {
        grassTile: new THREE.MeshBasicMaterial(),
        dirtTile: new THREE.MeshBasicMaterial()
      },
      sharedGeometries: {},
      logicalMap: [mapRows],
      heightMap: [heightRows],
      playerState: { z: 0 },
      waterRenderBodies: [],
      stampedStructures: [{ structureId: "hut-a", stampId: "hut", label: "Timber Hut", x: 1, y: 1, z: 0 }],
      stampMap: { hut: ["CWWC", "WTTW", "CWWC"] },
      roofLandmarks: [{ landmarkId: "hut-roof", x: 1, y: 1, z: 0, width: 4, depth: 3, height: 2.6 }],
      getVisualTileId: (tile) => tile,
      isTreeTileId: () => false,
      isWaterTileId: (tile) => tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP,
      isPierVisualCoverageTile: () => false,
      getActivePierConfig: () => null,
      getWaterSurfaceMaterial: () => new THREE.MeshBasicMaterial(),
      resolveVisualWaterRenderBodyForTile: () => null,
      cx: 0,
      cy: 0,
      tier: "far"
    });
    const planeGroup = group.children[0];
    const proxies = planeGroup.children.filter((child) => child.userData && child.userData.type === "STRUCTURE_PROXY");
    assert(proxies.length === 2, "far chunks should include low-detail body and roof building proxies");
    assert(proxies.some((proxy) => proxy.userData.proxyRole === "body"), "building proxies should include a body silhouette");
    assert(proxies.some((proxy) => proxy.userData.proxyRole === "roof"), "building proxies should include a roof silhouette when an authored roof matches");
    assert(
      !planeGroup.children.some((child) => child.isInstancedMesh),
      "building proxy footprints should suppress duplicate low-detail wall and tower instances"
    );
  }

  global.window = {};
  vm.runInThisContext(chunkRuntimeSource, { filename: path.join(root, "src", "js", "world", "chunk-scene-runtime.js") });
  const runtime = window.WorldChunkSceneRuntime;
  assert(runtime, "chunk scene runtime should expose a window runtime");
  assert(window.getChunkRenderPolicy().preset === "balanced", "chunk scene runtime should expose balanced default policy through legacy window API");
  assert(window.applyChunkRenderPolicyPreset("high") === true, "chunk scene runtime should mutate policy through legacy window API");
  assert(window.getChunkRenderPolicy().preset === "high", "chunk scene runtime should report updated active policy");
  assert(window.getChunkRenderPolicyRevision() === 1, "chunk scene runtime should track policy revisions");
  assert(window.applyChunkRenderPolicyPreset("balanced") === true, "chunk scene runtime should support resetting policy for guard scenarios");

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
