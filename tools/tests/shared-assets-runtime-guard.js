const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const sharedAssetsSource = fs.readFileSync(path.join(root, "src", "js", "world", "shared-assets-runtime.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");
  const renderIndex = manifestSource.indexOf('id: "world-render-runtime"');
  const sharedAssetsIndex = manifestSource.indexOf('id: "world-shared-assets-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(renderIndex !== -1 && sharedAssetsIndex !== -1 && renderIndex < sharedAssetsIndex, "legacy manifest should load shared asset runtime after render helpers");
  assert(sharedAssetsIndex !== -1 && worldIndex !== -1 && sharedAssetsIndex < worldIndex, "legacy manifest should load shared asset runtime before world.js");
  assert(worldSource.includes("WorldSharedAssetsRuntime"), "world.js should delegate shared asset setup");
  assert(sharedAssetsSource.includes("window.WorldSharedAssetsRuntime"), "shared asset runtime should expose a window runtime");
  assert(sharedAssetsSource.includes("function initSharedAssets(options = {})"), "shared asset runtime should own shared asset setup");
  assert(sharedAssetsSource.includes("sharedGeometries.ground = new THREE.PlaneGeometry(chunkSize, chunkSize);"), "shared asset runtime should own base ground geometry setup");
  assert(sharedAssetsSource.includes("sharedMaterials.terrainUnderlay = new THREE.MeshLambertMaterial({ color: 0xb7c7aa, side: THREE.DoubleSide });"), "shared asset runtime should own terrain underlay material setup");
  assert(sharedAssetsSource.includes("const makeNoiseTexture = (baseHex, vMin, vMax, speckleCount, patchCount = 42, patchSize = 5) => {"), "shared asset runtime should own procedural material texture helpers");
  assert(sharedAssetsSource.includes("sharedMaterials.directionSignMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own sign texture material setup");
  assert(sharedAssetsSource.includes("sharedMaterials.bankTexPlaneMat = new THREE.MeshBasicMaterial({"), "shared asset runtime should own bank sign material setup");
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
