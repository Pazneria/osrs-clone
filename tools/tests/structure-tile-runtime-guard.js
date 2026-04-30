const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const structureRuntimeSource = fs.readFileSync(path.join(root, "src", "js", "world", "structure-render-runtime.js"), "utf8");

  assert(structureRuntimeSource.includes("function createCastleRenderData(options = {})"), "structure runtime should own castle instanced render setup");
  assert(structureRuntimeSource.includes("function setCastleWallVisualState(options = {})"), "structure runtime should own castle wall instance transforms");
  assert(structureRuntimeSource.includes("function setCastleTowerVisualState(options = {})"), "structure runtime should own castle tower instance transforms");
  assert(structureRuntimeSource.includes("function appendShopCounterVisual(options = {})"), "structure runtime should own shop counter visuals");
  assert(structureRuntimeSource.includes("function appendFloorTileVisual(options = {})"), "structure runtime should own static floor tile visuals");
  assert(structureRuntimeSource.includes("function appendStairBlockVisual(options = {})"), "structure runtime should own stair block visuals");
  assert(structureRuntimeSource.includes("function appendStairRampVisual(options = {})"), "structure runtime should own ramp stair visuals");

  assert(worldSource.includes("worldStructureRenderRuntime.createCastleRenderData"), "world.js should delegate castle render setup");
  assert(worldSource.includes("worldStructureRenderRuntime.appendShopCounterVisual"), "world.js should delegate shop counter rendering");
  assert(worldSource.includes("worldStructureRenderRuntime.appendFloorTileVisual"), "world.js should delegate floor tile rendering");
  assert(worldSource.includes("worldStructureRenderRuntime.appendStairBlockVisual"), "world.js should delegate stair block rendering");
  assert(worldSource.includes("worldStructureRenderRuntime.appendStairRampVisual"), "world.js should delegate ramp stair rendering");

  assert(!worldSource.includes("new THREE.InstancedMesh(sharedGeometries.castleWall"), "world.js should not own castle wall instanced mesh setup");
  assert(!worldSource.includes("const wallThin = 0.78;"), "world.js should not own castle wall connection shaping");
  assert(!worldSource.includes("new THREE.BoxGeometry(1.0, 1.0, 0.8)"), "world.js should not own shop counter geometry");
  assert(!worldSource.includes("new THREE.BoxGeometry(1, floorHeight, 1)"), "world.js should not own stair block geometry");
  assert(!worldSource.includes("const stepDepth = 1.0 / steps;"), "world.js should not own ramp stair step geometry");

  console.log("Structure tile runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
