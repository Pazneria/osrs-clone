const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const structureRuntimeSource = readRepoFile(root, "src/js/world/structure-render-runtime.js");

  assert(structureRuntimeSource.includes("function createCastleRenderData(options = {})"), "structure runtime should own castle instanced render setup");
  assert(structureRuntimeSource.includes("function buildStructureVisualStyleLookup(options = {})"), "structure runtime should map stamped structures to live material styles");
  assert(structureRuntimeSource.includes("const STRUCTURE_VISUAL_PROFILES = Object.freeze"), "structure runtime should define material-specific building silhouettes");
  assert(structureRuntimeSource.includes("timber_thatch: Object.freeze({ wallHeightScale: 0.78"), "timber/thatch buildings should render with a shorter frontier silhouette");
  assert(structureRuntimeSource.includes("castle_granite_slate: Object.freeze({ wallHeightScale: 1.06"), "castle/granite buildings should render taller than frontier houses");
  assert(structureRuntimeSource.includes("wallCountsByStyle"), "structure runtime should bucket wall instances by material profile");
  assert(structureRuntimeSource.includes("getStructureRoofMaterial(sharedMaterials, roof.materialProfileId)"), "structure runtime should render roofs with material-profile-specific materials");
  assert(structureRuntimeSource.includes("if (roofIntegrity <= 0.2) return null;"), "destroyed roofs should not render as full intact roof shells");
  assert(structureRuntimeSource.includes("const wallTopHeight = Number.isFinite(roof.eaveHeight)"), "roof eaves should sit on top of walls instead of cutting through them");
  assert(structureRuntimeSource.includes("profile.wallHeightScale"), "wall transforms should apply material-specific wall height scales");
  assert(structureRuntimeSource.includes("profile.roofOverhang"), "roof transforms should apply material-specific overhang scales");
  assert(structureRuntimeSource.includes("const makeRoofDetailMaterial ="), "roof rendering should create material-specific detail materials");
  assert(structureRuntimeSource.includes("profileId === 'timber_thatch'"), "thatch roofs should get timber-specific roof detail");
  assert(structureRuntimeSource.includes("profileId === 'painted_plaster_tile'"), "painted plaster roofs should get tile trim detail");
  assert(structureRuntimeSource.includes("profileId === 'castle_granite_slate'"), "castle roofs should get stone cap detail");
  assert(structureRuntimeSource.includes("group.userData.roofMaterials"), "roof visibility should fade all material-specific roof details together");
  assert(structureRuntimeSource.includes("function setCastleWallVisualState(options = {})"), "structure runtime should own castle wall instance transforms");
  assert(structureRuntimeSource.includes("function setCastleTowerVisualState(options = {})"), "structure runtime should own castle tower instance transforms");
  assert(structureRuntimeSource.includes("function appendShopCounterVisual(options = {})"), "structure runtime should own shop counter visuals");
  assert(structureRuntimeSource.includes("function appendFloorTileVisual(options = {})"), "structure runtime should own static floor tile visuals");
  assert(structureRuntimeSource.includes("function createFloorTileRenderData(options = {})"), "structure runtime should own instanced floor tile render setup");
  assert(structureRuntimeSource.includes("function appendFloorTileVisualState(options = {})"), "structure runtime should own instanced floor tile transforms");
  assert(structureRuntimeSource.includes("function markFloorTileRenderDataDirty(floorData)"), "structure runtime should finalize instanced floor tile counts");
  assert(structureRuntimeSource.includes("function appendStairBlockVisual(options = {})"), "structure runtime should own stair block visuals");
  assert(structureRuntimeSource.includes("function appendStairRampVisual(options = {})"), "structure runtime should own ramp stair visuals");
  assert(structureRuntimeSource.includes("createEquipmentVisualMeshes(itemId, 'axe'"), "structure runtime should reuse held-item assets for decorative tool racks");
  assert(structureRuntimeSource.includes("createToolRackHeldToVerticalQuaternion"), "tutorial tool rack should normalize held-tool meshes into a vertical wall-display pose");
  assert(structureRuntimeSource.includes("poseGroup.quaternion.copy(createToolRackHeldToVerticalQuaternion())"), "tutorial tool rack should apply the same upright attachment transform to all real tools");
  assert(structureRuntimeSource.includes("addToolRackAsset('bronze_axe'"), "structure runtime should mount a real axe visual on the tutorial tool rack");
  assert(structureRuntimeSource.includes("addToolRackAsset('bronze_pickaxe'"), "structure runtime should mount a real pickaxe visual on the tutorial tool rack");
  assert(structureRuntimeSource.includes("addToolRackAsset('hammer'"), "structure runtime should mount a real hammer visual on the tutorial tool rack");
  assert(structureRuntimeSource.includes("prop.kind === 'weapon_rack'"), "structure runtime should render combat-yard weapon racks");
  assert(structureRuntimeSource.includes("addToolRackAsset('bronze_sword'"), "combat weapon racks should reuse the real bronze sword visual");
  assert(structureRuntimeSource.includes("addToolRackAsset('normal_shortbow'"), "combat weapon racks should reuse the real starter bow visual");
  assert(structureRuntimeSource.includes("prop.kind === 'training_dummy'"), "structure runtime should render decorative combat training dummies");
  assert(structureRuntimeSource.includes("prop.kind === 'archery_target'"), "structure runtime should render decorative archery targets");
  assert(structureRuntimeSource.includes("prop.kind === 'bank_sign'"), "structure runtime should render bank identity signs");
  assert(structureRuntimeSource.includes("prop.kind === 'shop_sign'"), "structure runtime should render shop identity signs");
  assert(structureRuntimeSource.includes("prop.kind === 'market_awning'"), "structure runtime should render market awnings");
  assert(structureRuntimeSource.includes("prop.kind === 'wall_painting'"), "structure runtime should render gallery and mansion wall paintings");
  assert(structureRuntimeSource.includes("prop.kind === 'castle_banner'"), "structure runtime should render castle banners");
  assert(structureRuntimeSource.includes("prop.kind === 'rubble_pile'"), "structure runtime should render burnt ruin rubble piles");
  assert(structureRuntimeSource.includes("prop.kind === 'quarry_cart'"), "structure runtime should render quarry carts");
  assert(structureRuntimeSource.includes("prop.kind === 'thatch_bundle'"), "structure runtime should render thatch material bundles");
  assert(structureRuntimeSource.includes("function mergeStaticVisualDescendantsByMaterial(THREE, group, options = {})"), "structure runtime should batch nested static decor meshes");
  assert(structureRuntimeSource.includes("mergeStaticVisualDescendantsByMaterial(THREE, group, { excludedMaterial: sharedMaterials.hiddenHitbox });"), "decor props should flatten nested static visuals while preserving hidden hitboxes");
  assert(structureRuntimeSource.includes("weapon_rack: { w: 1.62, h: 1.62, d: 0.85 }"), "combat weapon racks should expose a stable generous hitbox");
  assert(structureRuntimeSource.includes("training_dummy: { w: 1.16, h: 1.55, d: 0.95 }"), "decorative training dummies should expose a stable hitbox");
  assert(structureRuntimeSource.includes("archery_target: { w: 1.28, h: 1.68, d: 0.92 }"), "archery targets should expose a stable hitbox");
  assert(structureRuntimeSource.includes("bank_sign: { w: 1.62, h: 1.75, d: 0.42 }"), "bank signs should expose a stable hitbox");
  assert(structureRuntimeSource.includes("market_awning: { w: 2.1, h: 1.36, d: 1.28 }"), "market awnings should expose a stable hitbox");
  assert(structureRuntimeSource.includes("quarry_cart: { w: 1.62, h: 1.02, d: 1.08 }"), "quarry carts should expose a stable hitbox");
  assert(structureRuntimeSource.includes("prop.kind === 'ore_pile'"), "structure runtime should render tutorial quarry ore piles");
  assert(structureRuntimeSource.includes("prop.kind === 'coal_bin'"), "structure runtime should render tutorial quarry coal bins");
  assert(structureRuntimeSource.includes("prop.kind === 'barrel'"), "structure runtime should render tutorial quarry barrels");
  assert(structureRuntimeSource.includes("function updateFurnaceVisualEffects(options)"), "structure runtime should own furnace glow/flicker updates");
  assert(structureRuntimeSource.includes("furnaceEffectMaterials"), "structure runtime should register subtle furnace effect materials");
  assert(structureRuntimeSource.includes("function getFurnaceInteractionTile(furnace)"), "structure runtime should expose center-tile furnace interaction metadata");
  assert(structureRuntimeSource.includes("function resolveFurnaceFrontStep(furnace)"), "structure runtime should resolve furnace facing before deriving visual dimensions");
  assert(structureRuntimeSource.includes("const bodyLocalW = frontIsX ? fd : fw;\n        const bodyLocalD = frontIsX ? fw : fd;"), "rotated furnaces should derive the long entrance side from the axis-aligned footprint");
  assert(!structureRuntimeSource.includes("quarterTurn ? fd : fw"), "furnace rotation should rotate the finished long-side body, not rebuild it with swapped dimensions");
  assert(structureRuntimeSource.includes("const hardy = new THREE.Mesh"), "structure runtime should give anvils a readable top detail");
  assert(structureRuntimeSource.includes("rawTile === TileId.SOLID_NPC || rawTile === TileId.OBSTACLE ? visualTile : rawTile"), "occupied object tiles should render using their remembered visual base tile");
  assert(structureRuntimeSource.includes("if (floorTile === TileId.OBSTACLE) return true;"), "unbased occupied object tiles should not synthesize generic stone floor slabs");
  assert(structureRuntimeSource.includes("hasSouthEast: isFenceNeighbor(options, 1, 1)"), "fence rendering should resolve diagonal neighbors");
  assert(structureRuntimeSource.includes("if (connections.hasSouthEast) addFenceSegment(1, 1);"), "fence rendering should draw southeast diagonal rails");
  assert(structureRuntimeSource.includes("if (connections.hasSouthWest) addFenceSegment(-1, 1);"), "fence rendering should draw southwest diagonal rails");
  assert(structureRuntimeSource.includes("const braceLength ="), "wooden gates should render with redesigned bracing");
  assert(structureRuntimeSource.includes("type: door.isWoodenGate ? 'GATE' : 'DOOR'"), "wooden gate meshes should advertise gate hit targets");
  assert(structureRuntimeSource.includes("if (floorHeight > 0.12)"), "low-height tutorial gates should not synthesize a stone floor tile under the door");
  assert(!structureRuntimeSource.includes("material: sharedMaterials.floor6 || sharedMaterials.floor7,\n                        x: prop.x"), "decor props should not synthesize a wood/stone floor patch under themselves");

  assert(worldSource.includes("worldStructureRenderRuntime.createCastleRenderData"), "world.js should delegate castle render setup");
  assert(worldSource.includes("activeStructureVisualStyleLookup = worldStructureRenderRuntime.buildStructureVisualStyleLookup"), "world.js should build live structure material lookup from authored structures");
  assert(worldSource.includes("wallCountsByStyle[materialProfileId]"), "world.js should count wall material buckets before instancing");
  assert(worldSource.includes("materialProfileId: getStructureMaterialProfileIdAt(x, y, z)"), "world.js should pass material profile into wall and tower transforms");
  assert(worldSource.includes("worldStructureRenderRuntime.appendShopCounterVisual"), "world.js should delegate shop counter rendering");
  assert(worldSource.includes("worldStructureRenderRuntime.appendFloorTileVisual"), "world.js should delegate floor tile rendering");
  assert(worldSource.includes("worldStructureRenderRuntime.createFloorTileRenderData"), "world.js should delegate floor tile instanced render setup");
  assert(worldSource.includes("worldStructureRenderRuntime.getFloorTileRenderBucket"), "world.js should count floor tile material buckets through structure rendering");
  assert(worldSource.includes("worldStructureRenderRuntime.markFloorTileRenderDataDirty"), "world.js should finalize instanced floor tile state");
  assert(worldSource.includes("worldStructureRenderRuntime.appendStairBlockVisual"), "world.js should delegate stair block rendering");
  assert(worldSource.includes("worldStructureRenderRuntime.appendStairRampVisual"), "world.js should delegate ramp stair rendering");
  assert(worldSource.includes("createEquipmentVisualMeshes: typeof window.createEquipmentVisualMeshes === 'function'"), "world.js should pass held-item visual creation into structure rendering");
  assert(worldSource.includes("sharedGeometries,"), "world.js should pass shared geometries into structure rendering for quarry decor ore chunks");

  assert(!worldSource.includes("new THREE.InstancedMesh(sharedGeometries.castleWall"), "world.js should not own castle wall instanced mesh setup");
  assert(!worldSource.includes("const wallThin = 0.78;"), "world.js should not own castle wall connection shaping");
  assert(!worldSource.includes("new THREE.BoxGeometry(1.0, 1.0, 0.8)"), "world.js should not own shop counter geometry");
  assert(!worldSource.includes("new THREE.BoxGeometry(1, floorHeight, 1)"), "world.js should not own stair block geometry");
  assert(!worldSource.includes("const stepDepth = 1.0 / steps;"), "world.js should not own ramp stair step geometry");

  const sandbox = { window: {} };
  vm.runInNewContext(structureRuntimeSource, sandbox, { filename: "structure-render-runtime.js" });
  const runtime = sandbox.window.WorldStructureRenderRuntime;
  assert(runtime, "structure runtime should register itself when evaluated");
  const styleLookup = runtime.buildStructureVisualStyleLookup({
    stampedStructures: [
      {
        structureId: "frontier_bank",
        stampId: "bank_stamp",
        x: 10,
        y: 20,
        z: 0,
        themeId: "frontier_timber",
        materialProfileId: " TIMBER_THATCH "
      },
      {
        structureId: "burnt_cottage",
        stampId: "burnt_stamp",
        x: 30,
        y: 40,
        z: 0,
        themeId: "old_road",
        materialProfileId: "timber_thatch",
        conditionId: "burnt"
      }
    ],
    stampMap: {
      bank_stamp: ["W ", " T"],
      burnt_stamp: ["WW"]
    }
  });
  const bankWall = runtime.getStructureVisualStyleAt(styleLookup, 10, 20, 0);
  assert(bankWall && bankWall.materialProfileId === "timber_thatch", "style lookup should normalize authored material profile ids");
  assert(bankWall.themeId === "frontier_timber", "style lookup should preserve structure theme metadata");
  assert(!runtime.getStructureVisualStyleAt(styleLookup, 11, 20, 0), "style lookup should ignore blank stamp tiles");
  const bankTower = runtime.getStructureVisualStyleAt(styleLookup, 11, 21, 0);
  assert(bankTower && bankTower.char === "T", "style lookup should map nonblank stamp offsets");
  const burntWall = runtime.getStructureVisualStyleAt(styleLookup, 30, 40, 0);
  assert(burntWall && burntWall.materialProfileId === "burnt_timber_ash", "burnt structures should force the burnt material profile");

  const roofMaterial = { opacity: 1, visible: true };
  const roofDetailMaterial = { opacity: 1, visible: true };
  runtime.updateTutorialRoofVisibility({
    activeRoofVisuals: [{
      userData: {
        roofLandmark: {
          hideWhenPlayerInside: true,
          hideBounds: { xMin: 1, xMax: 3, yMin: 1, yMax: 3, z: 0 }
        },
        roofMaterial,
        roofMaterials: [roofMaterial, roofDetailMaterial]
      }
    }],
    playerState: { x: 2, y: 2, z: 0 }
  });
  assert(roofMaterial.opacity < 1 && roofDetailMaterial.opacity < 1, "roof fade should update base and detail materials together");

  console.log("Structure tile runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
