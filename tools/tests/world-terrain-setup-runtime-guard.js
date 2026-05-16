const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { TileId } = require("../content/tile-ids");
const { loadTsModule } = require("../lib/ts-module-loader");
const { makeSquareGrid: makePlane } = require("./collection-test-utils");
const { readRepoFile } = require("./repo-file-test-utils");

function countLegacyRiverTiles(runtime, logicalMap, mapSize, tileIds) {
  const sampler = runtime.createRiverSampler(mapSize);
  let bridgeTiles = 0;
  let waterRows = 0;
  let maxWaterTilesInRow = 0;
  for (let y = 1; y < mapSize - 1; y++) {
    const sample = sampler.sampleRiverAtY(y);
    let waterTilesInRow = 0;
    for (let x = Math.floor(sample.centerX - sample.halfWidth); x <= Math.ceil(sample.centerX + sample.halfWidth); x++) {
      if (x <= 1 || x >= mapSize - 2) continue;
      const tile = logicalMap[0][y][x];
      if (tile === tileIds.FLOOR_WOOD) bridgeTiles += 1;
      if (tile === tileIds.WATER_SHALLOW || tile === tileIds.WATER_DEEP) waterTilesInRow += 1;
    }
    if (waterTilesInRow > 0) {
      waterRows += 1;
      maxWaterTilesInRow = Math.max(maxWaterTilesInRow, waterTilesInRow);
    }
  }
  return { bridgeTiles, waterRows, maxWaterTilesInRow };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const runtimeSource = readRepoFile(root, "src/js/world/terrain-setup-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const terrainRuntimeIndex = manifestSource.indexOf('id: "world-terrain-setup-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(terrainRuntimeIndex !== -1, "legacy manifest should include the terrain setup runtime");
  assert(worldIndex !== -1, "legacy manifest should include world.js");
  assert(terrainRuntimeIndex < worldIndex, "legacy manifest should load terrain setup before world.js");
  assert(runtimeSource.includes("window.WorldTerrainSetupRuntime"), "terrain setup runtime should expose a window runtime");
  assert(runtimeSource.includes("function applyBaseTerrainSetup(options = {})"), "terrain setup runtime should own base terrain setup");
  assert(runtimeSource.includes("function createTownBounds(options = {})"), "terrain setup runtime should own town bounds setup");
  assert(runtimeSource.includes("function createRiverSampler(mapSize)"), "terrain setup runtime should own legacy river sampling");
  assert(runtimeSource.includes("const legacyRiverEnabled = options.disableLegacyRiver !== true;"), "terrain setup runtime should let authored worlds disable the legacy river carve");
  assert(worldSource.includes("disableLegacyRiver: !waterRenderBodies.some((body) => body && body.id === 'legacy-east-river')"), "world.js should disable legacy terrain rivers when authored water bodies replace the fallback");
  assert(runtimeSource.includes("function applyEllipseWater(options = {})"), "terrain setup runtime should own lake/pond carving");
  assert(runtimeSource.includes("function applyTerrainLandformPatches(options = {})"), "terrain setup runtime should own authored landform elevation patches");
  assert(runtimeSource.includes("applyTerrainLandformPatches({"), "base terrain setup should apply authored landforms before path overlays");
  assert(runtimeSource.includes("function liftIslandLandAboveWaterline(options = {})"), "terrain setup runtime should keep island land/path tiles above the waterline");
  assert(worldSource.includes("WorldTerrainSetupRuntime"), "world.js should delegate terrain setup");
  assert(worldSource.includes("worldTerrainSetupRuntime.applyBaseTerrainSetup"), "world.js should call the terrain setup runtime");
  assert(worldSource.includes("landformPatches"), "world.js should pass authored landform patches into terrain setup");
  assert(!worldSource.includes("const LEGACY_COORD_MAP_SIZE = 486;"), "world.js should not own legacy river coordinate scaling");
  assert(!worldSource.includes("const sampleRiverAtY = (y) => {"), "world.js should not own river sampling");
  assert(!worldSource.includes("const carveWaterTile = (x, y, depthNorm) => {"), "world.js should not own base water carving");
  assert(!worldSource.includes("const riverBridgeRows = ["), "world.js should not own river bridge row setup");

  global.window = {};
  vm.runInThisContext(runtimeSource, { filename: path.join(root, "src", "js", "world", "terrain-setup-runtime.js") });
  const runtime = window.WorldTerrainSetupRuntime;
  assert(runtime, "terrain setup runtime should be available after evaluation");

  const stampMap = {
    castle_floor: ["WWW", "W W"],
    store: ["SS"]
  };
  const stampedStructures = [
    { structureId: "castle_ground", stampId: "castle_floor", x: 12, y: 14 },
    { structureId: "general_store", stampId: "store", x: 4, y: 5 }
  ];
  const castleBounds = runtime.getStampBounds(stampedStructures, stampMap, "castle_ground");
  assert(castleBounds.xMin === 12 && castleBounds.xMax === 14, "stamp bounds should use blueprint width");
  assert(castleBounds.yMin === 14 && castleBounds.yMax === 15, "stamp bounds should use blueprint height");
  const expanded = runtime.expandBounds(castleBounds, 2, 3, 32);
  assert(expanded.xMin === 10 && expanded.yMin === 11, "expanded bounds should apply padding");

  const mapSize = 32;
  const logicalMap = [makePlane(mapSize, -1)];
  const heightMap = [makePlane(mapSize, -1)];
  const tileIds = {
    GRASS: 0,
    DIRT: 1,
    FLOOR_WOOD: 6,
    SHORE: 20,
    WATER_SHALLOW: 21,
    WATER_DEEP: 22,
    SAND: 26
  };
  const setup = runtime.applyBaseTerrainSetup({
    castleFrontPond: { cx: 12, cy: 21, rx: 2, ry: 2 },
    deepWaterCenter: { xMin: 23, xMax: 24, yMin: 23, yMax: 24 },
    heightMap,
    isPierSideWaterTile: (pierConfig, x, y) => x === pierConfig.xMin - 1 && y >= pierConfig.yStart && y <= pierConfig.yEnd,
    lakeDefs: [{ cx: 22, cy: 8, rx: 2, ry: 2 }],
    logicalMap,
    mapSize,
    pierConfig: { xMin: 15, xMax: 17, yStart: 23, yEnd: 25, entryY: 22 },
    pierDeckTopHeight: 0.28,
    stampMap,
    stampedStructures,
    tileIds
  });

  assert(typeof setup.inTownCore === "function", "terrain setup should return town-core lookup");
  assert(typeof setup.terrainNoise === "function", "terrain setup should return terrain noise helper");
  assert(typeof setup.getStampBounds === "function", "terrain setup should return stamp bounds helper");
  assert(logicalMap[0][0][0] === 2, "terrain setup should keep solid map borders");
  assert(logicalMap[0][8][22] === tileIds.WATER_DEEP || logicalMap[0][8][22] === tileIds.WATER_SHALLOW, "terrain setup should carve authored lake water");
  assert(logicalMap[0][23][23] === tileIds.WATER_DEEP, "terrain setup should stamp deep-water center");
  assert(logicalMap[0][23][16] === tileIds.FLOOR_WOOD, "terrain setup should stamp pier deck tiles");
  assert(logicalMap[0][24][14] === tileIds.WATER_SHALLOW, "terrain setup should preserve pier side water");
  assert(logicalMap[0][22][16] === tileIds.SHORE, "terrain setup should stamp pier shoreline entry");

  {
    const landformMapSize = 24;
    const landformLogicalMap = [makePlane(landformMapSize, tileIds.GRASS)];
    const landformHeightMap = [makePlane(landformMapSize, 0.02)];
    landformLogicalMap[0][8][8] = tileIds.WATER_SHALLOW;
    runtime.applyTerrainLandformPatches({
      heightMap: landformHeightMap,
      landformPatches: [
        {
          landformId: "guard_lower_bank",
          kind: "ellipse",
          cx: 8,
          cy: 8,
          rx: 5,
          ry: 3,
          height: -0.14,
          mode: "lower",
          tileId: "SHORE",
          edgeSoftness: 2
        },
        {
          landformId: "guard_foothill",
          kind: "path",
          points: [
            { x: 12, y: 10 },
            { x: 18, y: 14 }
          ],
          pathWidth: 4,
          height: 0.18,
          mode: "raise",
          tileId: "SAND",
          edgeSoftness: 2
        }
      ],
      logicalMap: landformLogicalMap,
      mapSize: landformMapSize,
      tileIds
    });
    assert(landformLogicalMap[0][8][8] === tileIds.WATER_SHALLOW, "landforms should not overwrite water tiles");
    assert(landformLogicalMap[0][8][4] === tileIds.SHORE, "lower bank landforms should stamp shoreline terrain");
    assert(landformHeightMap[0][8][4] < -0.1, "lower bank landforms should lower nearby terrain");
    assert(landformLogicalMap[0][12][15] === tileIds.SAND, "foothill landforms should stamp dry climb terrain");
    assert(landformHeightMap[0][12][15] > 0.12, "foothill landforms should raise navigable terrain");
  }

  {
    const riverMapSize = 96;
    const enabledLogicalMap = [makePlane(riverMapSize, -1)];
    const enabledHeightMap = [makePlane(riverMapSize, -1)];
    const disabledLogicalMap = [makePlane(riverMapSize, -1)];
    const disabledHeightMap = [makePlane(riverMapSize, -1)];
    const sampler = runtime.createRiverSampler(riverMapSize);
    const riverSample = sampler.sampleRiverAtY(41);
    const riverX = Math.round(riverSample.centerX);
    const bridgeY = Math.floor(riverMapSize * 0.49);
    const bridgeSample = sampler.sampleRiverAtY(bridgeY);
    const bridgeX = Math.round(bridgeSample.centerX);

    runtime.applyBaseTerrainSetup({
      castleFrontPond: { cx: -10, cy: -10, rx: 1, ry: 1 },
      deepWaterCenter: { xMin: -10, xMax: -10, yMin: -10, yMax: -10 },
      heightMap: enabledHeightMap,
      lakeDefs: [],
      logicalMap: enabledLogicalMap,
      mapSize: riverMapSize,
      pierConfig: { enabled: false },
      stampMap: {},
      stampedStructures: [],
      tileIds
    });
    runtime.applyBaseTerrainSetup({
      castleFrontPond: { cx: -10, cy: -10, rx: 1, ry: 1 },
      deepWaterCenter: { xMin: -10, xMax: -10, yMin: -10, yMax: -10 },
      disableLegacyRiver: true,
      heightMap: disabledHeightMap,
      lakeDefs: [],
      logicalMap: disabledLogicalMap,
      mapSize: riverMapSize,
      pierConfig: { enabled: false },
      stampMap: {},
      stampedStructures: [],
      tileIds
    });

    assert(
      enabledLogicalMap[0][41][riverX] === tileIds.WATER_DEEP || enabledLogicalMap[0][41][riverX] === tileIds.WATER_SHALLOW,
      "legacy terrain setup should still carve the compatibility river when enabled"
    );
    assert(enabledLogicalMap[0][bridgeY][bridgeX] === tileIds.FLOOR_WOOD, "legacy terrain setup should still stamp compatibility river bridges when enabled");
    assert(disabledLogicalMap[0][41][riverX] === tileIds.GRASS, "authored mainland terrain should be able to disable the compatibility river carve");
    assert(disabledLogicalMap[0][bridgeY][bridgeX] !== tileIds.FLOOR_WOOD, "authored mainland terrain should disable compatibility river bridges with the river carve");
  }

  {
    const bootstrap = loadTsModule(path.join(root, "src", "game", "world", "bootstrap.ts"));
    const mainOverworld = bootstrap.buildWorldBootstrapResult("main_overworld");
    const payload = mainOverworld.legacy;
    const waterBodies = mainOverworld.renderPayload.water.bodies || [];
    const mainlandMapSize = 1296;
    const mainlandLogicalMap = [makePlane(mainlandMapSize, -1)];
    const mainlandHeightMap = [makePlane(mainlandMapSize, -1)];
    runtime.applyBaseTerrainSetup({
      castleFrontPond: payload.castleFrontPond,
      deepWaterCenter: payload.deepWaterCenter,
      disableLegacyRiver: !waterBodies.some((body) => body && body.id === "legacy-east-river"),
      heightMap: mainlandHeightMap,
      islandWater: payload.islandWater,
      lakeDefs: payload.lakeDefs,
      landformPatches: payload.landformPatches,
      logicalMap: mainlandLogicalMap,
      mapSize: mainlandMapSize,
      pathPatches: payload.pathPatches,
      pierConfig: payload.pier,
      pierDeckTopHeight: 0.28,
      stampMap: payload.stampMap,
      stampedStructures: payload.stampedStructures,
      tileIds: TileId
    });
    const legacyCounts = countLegacyRiverTiles(runtime, mainlandLogicalMap, mainlandMapSize, TileId);
    assert(!waterBodies.some((body) => body.id === "legacy-east-river"), "main_overworld should use authored water bodies instead of the legacy river payload");
    assert(payload.landformPatches.some((landform) => landform.landformId === "east_marsh_lower_bank"), "main_overworld should publish the lowered riverbank landform");
    assert(payload.landformPatches.some((landform) => landform.landformId === "sunspur_foothill_rise"), "main_overworld should publish the foothill rise landform");
    assert(legacyCounts.bridgeTiles === 0, "main_overworld should not stamp compatibility river bridges after the river is removed");
    assert(legacyCounts.waterRows < Math.floor(mainlandMapSize * 0.22), "main_overworld should not retain a continuous north-south compatibility river in terrain");
  }

  {
    const islandMapSize = 16;
    const islandLogicalMap = [makePlane(islandMapSize, -1)];
    const islandHeightMap = [makePlane(islandMapSize, -1)];
    runtime.applyBaseTerrainSetup({
      castleFrontPond: { cx: -10, cy: -10, rx: 1, ry: 1 },
      deepWaterCenter: { xMin: -10, xMax: -10, yMin: -10, yMax: -10 },
      heightMap: islandHeightMap,
      islandWater: {
        waterBounds: { xMin: 0, xMax: 15, yMin: 0, yMax: 15 },
        landPolygon: [
          { x: 4, y: 4 },
          { x: 12, y: 4 },
          { x: 12, y: 12 },
          { x: 4, y: 12 }
        ],
        shoreWidth: 1.0,
        shallowDistance: 2.0
      },
      lakeDefs: [],
      logicalMap: islandLogicalMap,
      mapSize: islandMapSize,
      pathPatches: [{
        pathId: "runtime_guard_path",
        points: [
          { x: 6, y: 8 },
          { x: 10, y: 8 }
        ],
        pathWidth: 2,
        tileId: "DIRT",
        height: -0.05,
        edgeSoftness: 0
      }],
      pierConfig: { enabled: false, xMin: 7, xMax: 9, yStart: 12, yEnd: 13, entryY: 11 },
      stampMap: {},
      stampedStructures: [],
      tileIds
    });

    assert(islandLogicalMap[0][0][0] === tileIds.WATER_DEEP, "island water patch should replace the old solid map edge with ocean");
    assert(islandLogicalMap[0][2][2] === tileIds.WATER_DEEP, "island water patch should carve distant off-island tiles into deep water");
    assert(islandLogicalMap[0][4][6] === tileIds.SHORE, "island water patch should mark land-edge tiles as shore");
    assert(islandLogicalMap[0][8][8] === tileIds.DIRT, "terrain path patches should stamp dirt trail tiles through land");
    assert(islandHeightMap[0][8][8] === -0.05, "terrain path patches should lower path tile heights");
    assert(islandLogicalMap[0][12][8] !== tileIds.FLOOR_WOOD, "disabled pier configs should not stamp pier deck tiles");
  }

  {
    const islandMapSize = 16;
    const islandLogicalMap = [makePlane(islandMapSize, -1)];
    const islandHeightMap = [makePlane(islandMapSize, -1)];
    runtime.applyBaseTerrainSetup({
      castleFrontPond: { cx: -10, cy: -10, rx: 1, ry: 1 },
      deepWaterCenter: { xMin: -10, xMax: -10, yMin: -10, yMax: -10 },
      heightMap: islandHeightMap,
      islandWater: {
        waterBounds: { xMin: 0, xMax: 15, yMin: 0, yMax: 15 },
        landPolygon: [
          { x: 4, y: 4 },
          { x: 12, y: 4 },
          { x: 12, y: 12 },
          { x: 4, y: 12 }
        ],
        shoreWidth: 1.0,
        shallowDistance: 2.0
      },
      lakeDefs: [],
      logicalMap: islandLogicalMap,
      mapSize: islandMapSize,
      pathPatches: [{
        pathId: "runtime_guard_low_path",
        points: [
          { x: 6, y: 8 },
          { x: 10, y: 8 }
        ],
        pathWidth: 2,
        tileId: "DIRT",
        height: -0.12,
        edgeSoftness: 0
      }],
      pierConfig: { enabled: false },
      stampMap: {},
      stampedStructures: [],
      tileIds
    });

    assert(islandLogicalMap[0][8][8] === tileIds.DIRT, "low island path guard should still stamp dirt");
    assert(islandHeightMap[0][8][8] >= -0.052, "island path tiles should not sink below the surrounding water surface");
  }

  {
    const islandMapSize = 648;
    const islandLogicalMap = [makePlane(islandMapSize, -1)];
    const islandHeightMap = [makePlane(islandMapSize, -1)];
    const lowPointNoise = setup.terrainNoise(247, 317);
    assert(lowPointNoise < -0.18, "guard point should exercise the low terrain noise that used to reveal the ocean underlay");
    runtime.applyIslandWaterPatch({
      heightMap: islandHeightMap,
      islandWater: {
        waterBounds: { xMin: 240, xMax: 255, yMin: 310, yMax: 325 },
        landPolygon: [
          { x: 240, y: 310 },
          { x: 255, y: 310 },
          { x: 255, y: 325 },
          { x: 240, y: 325 }
        ],
        shoreWidth: 1.0,
        shallowDistance: 2.0
      },
      logicalMap: islandLogicalMap,
      mapSize: islandMapSize,
      terrainNoise: setup.terrainNoise,
      tileIds
    });
    assert(islandLogicalMap[0][317][247] === tileIds.GRASS, "low interior island point should remain grass");
    assert(islandHeightMap[0][317][247] >= -0.052, "interior island grass should stay above the ocean backdrop to avoid fake pond glints");
  }

  console.log("World terrain setup runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
