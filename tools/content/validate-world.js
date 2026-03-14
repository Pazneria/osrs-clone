const {
  buildWorldGameplayMap,
  collectAdjacencyViolations,
  loadShopEconomy,
  loadWorldContent,
  loadWorldManifest
} = require("./world-utils");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasManifestWorld(manifest, worldId) {
  const worlds = manifest && Array.isArray(manifest.worlds) ? manifest.worlds : [];
  for (let i = 0; i < worlds.length; i++) {
    const entry = worlds[i];
    if (entry && entry.worldId === worldId) return true;
  }
  return false;
}

function collectRouteIds(world) {
  const ids = [];
  const groups = world.skillRoutes || {};
  ["fishing", "cooking", "mining", "runecrafting", "woodcutting"].forEach((key) => {
    const rows = Array.isArray(groups[key]) ? groups[key] : [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].routeId) ids.push(rows[i].routeId);
    }
  });
  return ids;
}

function assertFinitePoint2(point, message) {
  assert(point && Number.isFinite(point.x) && Number.isFinite(point.y), message);
}

function validateWaterShape(worldId, bodyId, shape) {
  assert(shape && typeof shape === "object", `${worldId}: water body ${bodyId} missing shape`);
  assert(shape.kind === "ellipse" || shape.kind === "box" || shape.kind === "polygon", `${worldId}: water body ${bodyId} has unsupported shape kind`);
  if (shape.kind === "ellipse") {
    assert(Number.isFinite(shape.cx) && Number.isFinite(shape.cy), `${worldId}: water body ${bodyId} ellipse missing center`);
    assert(Number.isFinite(shape.rx) && shape.rx > 0 && Number.isFinite(shape.ry) && shape.ry > 0, `${worldId}: water body ${bodyId} ellipse missing radii`);
    return;
  }
  if (shape.kind === "box") {
    assert(Number.isFinite(shape.xMin) && Number.isFinite(shape.xMax), `${worldId}: water body ${bodyId} box missing x bounds`);
    assert(Number.isFinite(shape.yMin) && Number.isFinite(shape.yMax), `${worldId}: water body ${bodyId} box missing y bounds`);
    assert(shape.xMin <= shape.xMax && shape.yMin <= shape.yMax, `${worldId}: water body ${bodyId} box bounds are inverted`);
    return;
  }
  const points = Array.isArray(shape.points) ? shape.points : [];
  assert(points.length >= 3, `${worldId}: water body ${bodyId} polygon needs at least 3 points`);
  for (let i = 0; i < points.length; i++) {
    assertFinitePoint2(points[i], `${worldId}: water body ${bodyId} polygon point ${i} is invalid`);
  }
}

function validateWorld(root, worldId, shopEconomy) {
  const { manifestEntry, world, stamps } = loadWorldContent(root, worldId);
  const manifest = loadWorldManifest(root);
  const knownMerchantIds = new Set(["general_store"]);
  if (shopEconomy && typeof shopEconomy.getConfiguredMerchantIds === "function") {
    const merchantIds = shopEconomy.getConfiguredMerchantIds();
    if (Array.isArray(merchantIds)) {
      for (let i = 0; i < merchantIds.length; i++) {
        knownMerchantIds.add(String(merchantIds[i] || "").trim().toLowerCase());
      }
    }
  }

  assert(world.worldId === manifestEntry.worldId, `world definition id mismatch for ${worldId}`);
  assert(!world.dynamicServices, `${worldId} should not define dynamicServices`);
  assert(!world.skillRoutes.miningZones, `${worldId} should not define legacy miningZones`);
  assert(!world.skillRoutes.runecraftingBands, `${worldId} should not define legacy runecraftingBands`);
  assert(!world.skillRoutes.woodcuttingZones, `${worldId} should not define legacy woodcuttingZones`);

  const waterBodyIds = new Set();
  const waterBodies = Array.isArray(world.waterBodies) ? world.waterBodies : [];
  for (let i = 0; i < waterBodies.length; i++) {
    const body = waterBodies[i];
    assert(body && body.id, `${worldId}: water body missing id`);
    assert(!waterBodyIds.has(body.id), `${worldId}: duplicate water body id ${body.id}`);
    waterBodyIds.add(body.id);
    validateWaterShape(worldId, body.id, body.shape);
    assert(Number.isFinite(body.surfaceY), `${worldId}: water body ${body.id} missing surfaceY`);
    if (body.style !== undefined) {
      assert(body.style === "calm_lake", `${worldId}: water body ${body.id} has unsupported style ${body.style}`);
    }
    if (body.shoreline) {
      assert(Number.isFinite(body.shoreline.width) && body.shoreline.width > 0, `${worldId}: water body ${body.id} missing shoreline width`);
      if (body.shoreline.foamWidth !== undefined) {
        assert(Number.isFinite(body.shoreline.foamWidth) && body.shoreline.foamWidth >= 0, `${worldId}: water body ${body.id} has invalid foamWidth`);
      }
      if (body.shoreline.skirtDepth !== undefined) {
        assert(Number.isFinite(body.shoreline.skirtDepth) && body.shoreline.skirtDepth >= 0, `${worldId}: water body ${body.id} has invalid skirtDepth`);
      }
    }
    if (body.depthProfile) {
      assert(body.depthProfile.mode === "tile_truth" || body.depthProfile.mode === "uniform", `${worldId}: water body ${body.id} has unsupported depthProfile mode`);
      const deepZones = Array.isArray(body.depthProfile.deepZones) ? body.depthProfile.deepZones : [];
      for (let j = 0; j < deepZones.length; j++) {
        validateWaterShape(worldId, `${body.id}.deepZone.${j}`, deepZones[j].shape);
      }
    }
  }

  const structureIds = new Set();
  const spawnIds = new Set();
  const serviceIds = new Set();
  const routeIds = new Set();
  const routeAliases = new Set();
  const placementIds = new Set();

  const structures = Array.isArray(world.structures) ? world.structures : [];
  for (let i = 0; i < structures.length; i++) {
    const structure = structures[i];
    assert(structure && structure.structureId, `${worldId}: world structure missing structureId`);
    assert(!structureIds.has(structure.structureId), `${worldId}: duplicate structureId ${structure.structureId}`);
    structureIds.add(structure.structureId);
    assert(!!stamps[structure.stampId], `${worldId}: missing stamp reference ${structure.stampId}`);
  }

  const services = Array.isArray(world.services) ? world.services : [];
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    assert(service && service.serviceId, `${worldId}: world service missing serviceId`);
    assert(!serviceIds.has(service.serviceId), `${worldId}: duplicate serviceId ${service.serviceId}`);
    serviceIds.add(service.serviceId);
    assert(service.spawnId, `${worldId}: service ${service.serviceId} missing spawnId`);
    assert(!spawnIds.has(service.spawnId), `${worldId}: duplicate spawnId ${service.spawnId}`);
    spawnIds.add(service.spawnId);
    if (service.merchantId) {
      const merchantId = String(service.merchantId).trim().toLowerCase();
      assert(knownMerchantIds.has(merchantId), `${worldId}: unknown merchantId ${merchantId}`);
    }
    if (service.travelToWorldId) {
      const travelWorldId = String(service.travelToWorldId).trim();
      assert(travelWorldId, `${worldId}: service ${service.serviceId} has an empty travelToWorldId`);
      assert(hasManifestWorld(manifest, travelWorldId), `${worldId}: service ${service.serviceId} references unknown travel world ${travelWorldId}`);
      assert(
        service.travelSpawn
          && Number.isFinite(service.travelSpawn.x)
          && Number.isFinite(service.travelSpawn.y)
          && Number.isFinite(service.travelSpawn.z),
        `${worldId}: service ${service.serviceId} missing valid travelSpawn`
      );
    }
  }

  const groups = world.skillRoutes || {};
  ["fishing", "cooking", "mining", "runecrafting", "woodcutting"].forEach((groupKey) => {
    const rows = Array.isArray(groups[groupKey]) ? groups[groupKey] : [];
    assert(rows.length > 0, `${worldId}: missing routes for ${groupKey}`);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      assert(row && row.routeId, `${worldId}: route in ${groupKey} missing routeId`);
      assert(!routeIds.has(row.routeId), `${worldId}: duplicate routeId ${row.routeId}`);
      routeIds.add(row.routeId);
      const alias = String(row.alias || "").trim().toLowerCase();
      if (alias) {
        const scopedAlias = `${groupKey}:${alias}`;
        assert(!routeAliases.has(scopedAlias), `${worldId}: duplicate alias ${alias} in ${groupKey}`);
        routeAliases.add(scopedAlias);
      }
    }
  });

  const miningRouteIds = new Set((world.skillRoutes.mining || []).map((entry) => entry.routeId));
  const miningNodes = world.resourceNodes && Array.isArray(world.resourceNodes.mining) ? world.resourceNodes.mining : [];
  assert(miningNodes.length > 0, `${worldId}: missing authored mining resource nodes`);
  for (let i = 0; i < miningNodes.length; i++) {
    const node = miningNodes[i];
    assert(node && node.placementId, `${worldId}: mining node missing placementId`);
    assert(!placementIds.has(node.placementId), `${worldId}: duplicate placementId ${node.placementId}`);
    placementIds.add(node.placementId);
    assert(node.routeId && miningRouteIds.has(node.routeId), `${worldId}: mining node ${node.placementId} references unknown routeId ${node.routeId}`);
    assert(node.oreType, `${worldId}: mining node ${node.placementId} missing oreType`);
  }

  const woodcuttingRouteIds = new Set((world.skillRoutes.woodcutting || []).map((entry) => entry.routeId));
  const woodcuttingNodes = world.resourceNodes && Array.isArray(world.resourceNodes.woodcutting) ? world.resourceNodes.woodcutting : [];
  assert(woodcuttingNodes.length > 0, `${worldId}: missing authored woodcutting resource nodes`);
  for (let i = 0; i < woodcuttingNodes.length; i++) {
    const node = woodcuttingNodes[i];
    assert(node && node.placementId, `${worldId}: woodcutting node missing placementId`);
    assert(!placementIds.has(node.placementId), `${worldId}: duplicate placementId ${node.placementId}`);
    placementIds.add(node.placementId);
    assert(node.routeId && woodcuttingRouteIds.has(node.routeId), `${worldId}: woodcutting node ${node.placementId} references unknown routeId ${node.routeId}`);
    assert(node.nodeId, `${worldId}: woodcutting node ${node.placementId} missing nodeId`);
  }

  const runecraftingRouteIds = new Set((world.skillRoutes.runecrafting || []).map((entry) => entry.routeId));
  const altars = world.landmarks && Array.isArray(world.landmarks.altars) ? world.landmarks.altars : [];
  assert(altars.length > 0, `${worldId}: missing authored runecrafting altars`);
  for (let i = 0; i < altars.length; i++) {
    const altar = altars[i];
    assert(altar && altar.routeId, `${worldId}: altar placement missing routeId`);
    assert(runecraftingRouteIds.has(altar.routeId), `${worldId}: altar routeId ${altar.routeId} missing from runecrafting routes`);
    assert(Number.isFinite(altar.variant), `${worldId}: altar ${altar.routeId} missing variant`);
  }

  const logicalMap = buildWorldGameplayMap(world, stamps);
  const adjacencyViolations = collectAdjacencyViolations(world, logicalMap);
  assert(adjacencyViolations.length === 0, adjacencyViolations.join("\n"));

  return {
    worldId,
    structures: structures.length,
    services: services.length,
    routes: collectRouteIds(world).length
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const manifest = loadWorldManifest(root);
  const shopEconomy = loadShopEconomy(root);
  const cliWorldIdIndex = process.argv.indexOf("--world");
  const requestedWorldIds = cliWorldIdIndex >= 0 && process.argv[cliWorldIdIndex + 1]
    ? [String(process.argv[cliWorldIdIndex + 1]).trim()]
    : manifest.worlds.map((entry) => entry.worldId);

  const summaries = [];
  for (let i = 0; i < requestedWorldIds.length; i++) {
    summaries.push(validateWorld(root, requestedWorldIds[i], shopEconomy));
  }

  const summaryText = summaries
    .map((entry) => `${entry.worldId} (${entry.structures} structures, ${entry.services} services, ${entry.routes} routes)`)
    .join(", ");
  console.log(`Validated world content: ${summaryText}.`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  validateWorld,
  run
};
