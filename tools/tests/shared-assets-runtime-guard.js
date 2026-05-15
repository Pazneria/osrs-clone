const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const sharedAssetsSource = readRepoFile(root, "src/js/world/shared-assets-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const renderIndex = manifestSource.indexOf('id: "world-render-runtime"');
  const sharedAssetsIndex = manifestSource.indexOf('id: "world-shared-assets-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(renderIndex !== -1 && sharedAssetsIndex !== -1 && renderIndex < sharedAssetsIndex, "legacy manifest should load shared asset runtime after render helpers");
  assert(sharedAssetsIndex !== -1 && worldIndex !== -1 && sharedAssetsIndex < worldIndex, "legacy manifest should load shared asset runtime before world.js");
  assert(worldSource.includes("WorldSharedAssetsRuntime"), "world.js should delegate shared asset setup");
  assert(sharedAssetsSource.includes("window.WorldSharedAssetsRuntime"), "shared asset runtime should expose a window runtime");
  assert(sharedAssetsSource.includes("function initSharedAssets(options = {})"), "shared asset runtime should own shared asset setup");
  assert(sharedAssetsSource.includes("sharedGeometries.ground = new THREE.PlaneGeometry(chunkSize, chunkSize);"), "shared asset runtime should own base ground geometry setup");
  assert(sharedAssetsSource.includes("grassTex.repeat.set(1.85, 1.85);"), "shared asset runtime should keep the grass texture repeat broad enough for painted ground");
  assert(sharedAssetsSource.includes("sharedGeometries.treeRootFlare = new THREE.CylinderGeometry"), "shared asset runtime should own tree root-flare geometry setup");
  assert(sharedAssetsSource.includes("sharedGeometries.treeStumpCap = new THREE.CylinderGeometry"), "shared asset runtime should own tree stump cap geometry setup");
  assert(!sharedAssetsSource.includes("sharedGeometries.leafShadow"), "shared asset runtime should not add a second darker normal-tree leaf layer");
  assert(sharedAssetsSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial({ color: 0xb7c7aa, side: THREE.DoubleSide });"), "shared asset runtime should own terrain underlay material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.trunkCut = new THREE.MeshLambertMaterial"), "shared asset runtime should own cut-wood material setup");
  assert(!sharedAssetsSource.includes("sharedMaterials.leavesShadow"), "shared asset runtime should keep tree leaves on one cohesive material");
  assert(sharedAssetsSource.includes("const makeNoiseTexture = (baseHex, vMin, vMax, speckleCount, patchCount = 42, patchSize = 5) => {"), "shared asset runtime should own procedural material texture helpers");
  assert(sharedAssetsSource.includes("function createChippedRockGeometry(THREE, rings, options = {})"), "shared asset runtime should own chipped irregular rock mesh construction");
  assert(sharedAssetsSource.includes("sharedGeometries.rockCopper = createChippedRockGeometry"), "shared asset runtime should own the chipped copper rock silhouette");
  assert(sharedAssetsSource.includes("sharedGeometries.rockTin = createChippedRockGeometry"), "shared asset runtime should own the broken tin rock silhouette");
  assert(sharedAssetsSource.includes("sharedGeometries.rockDepleted = createChippedRockGeometry"), "shared asset runtime should own the flat chipped depleted rock silhouette");
  assert(sharedAssetsSource.includes("pushTriangle(topCenter, top[(i + 1) % top.length], top[i]);"), "chipped rock meshes should wind top caps upward so rocks render as solid objects");
  assert(!sharedAssetsSource.includes("sharedGeometries.rockCopper = new THREE.TetrahedronGeometry"), "copper rock should not use a perfect tetrahedron silhouette");
  assert(!sharedAssetsSource.includes("sharedGeometries.rockTin = new THREE.OctahedronGeometry"), "tin rock should not use a perfect octahedron silhouette");
  assert(sharedAssetsSource.includes("applyRockOreTexture(sharedMaterials.rockCopper"), "shared asset runtime should add procedural ore texture detail to copper rocks");
  assert(sharedAssetsSource.includes("applyRockOreTexture(sharedMaterials.rockTin"), "shared asset runtime should add procedural ore texture detail to tin rocks");
  assert(sharedAssetsSource.includes("sharedMaterials.directionSignMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own sign texture material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.tutorialNoticeMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own tutorial notice board material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.bankTexPlaneMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own bank sign material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.shopSignMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own reusable shop sign material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.galleryPaintingMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own reusable painting material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.castleBannerMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own reusable castle banner material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.awningClothMat = new THREE.MeshLambertMaterial"), "shared asset runtime should own reusable awning cloth material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.structureWallMaterials = {"), "shared asset runtime should expose material-profile wall materials");
  assert(sharedAssetsSource.includes("sharedMaterials.structureCornerMaterials = {"), "shared asset runtime should expose material-profile corner materials");
  assert(sharedAssetsSource.includes("sharedMaterials.structureRoofMaterials = {"), "shared asset runtime should expose material-profile roof materials");
  assert(sharedAssetsSource.includes("painted_plaster_tile: makeProfileMaterial(tileRoofTex)"), "painted plaster buildings should get their own tile roof material");
  assert(sharedAssetsSource.includes("burnt_timber_ash: makeProfileMaterial(burntWallTex)"), "burnt buildings should get their own charred wall material");
  assert(!worldSource.includes("sharedGeometries.ground = new THREE.PlaneGeometry"), "world.js should not own shared geometry construction");
  assert(!worldSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial"), "world.js should not own terrain underlay material construction");
  assert(!worldSource.includes("const makeNoiseTexture = (baseHex"), "world.js should not own shared procedural material texture helpers");
  assert(!worldSource.includes("sharedMaterials.directionSignMat = new THREE.MeshBasicMaterial"), "world.js should not own sign texture material setup");

  global.window = {};
  vm.runInThisContext(sharedAssetsSource, { filename: path.join(root, "src", "js", "world", "shared-assets-runtime.js") });
  assert(window.WorldSharedAssetsRuntime, "shared asset runtime should be available after evaluation");
  assert(typeof window.WorldSharedAssetsRuntime.initSharedAssets === "function", "shared asset runtime should expose initSharedAssets");

  console.log("Shared assets runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
