const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-station-interaction-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(runtimeSource.includes("window.InputStationInteractionRuntime"), "station runtime should expose a window runtime");
  assert(runtimeSource.includes("function getStationFootprint"), "station runtime should own station footprint lookup");
  assert(runtimeSource.includes("function validateStationApproach"), "station runtime should own approach validation");
  assert(inputSource.includes("InputStationInteractionRuntime"), "input-render.js should delegate station interaction logic");
  assert(!inputSource.includes("function getStationFootprint"), "input-render.js should not own station footprint lookup");
  assert(!inputSource.includes("function resolveCardinalStepFromYaw"), "input-render.js should not own station cardinal facing math");
  assert(
    manifestSource.indexOf('id: "input-station-interaction-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy manifest should load station runtime before input-render.js"
  );

  const sandbox = { window: {}, Math, Number, console };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputStationInteractionRuntime;
  assert(runtime, "station runtime should execute in isolation");

  const context = {
    furnacesToRender: [{ x: 10, y: 20, z: 0, footprintW: 2, footprintD: 3, facingYaw: -Math.PI / 2 }],
    anvilsToRender: [{ x: 30, y: 40, z: 0, facingYaw: 0 }]
  };

  const furnaceApproach = runtime.getStationApproachPositions(context, "FURNACE", 10, 20, 0);
  assert(furnaceApproach.length === 1, "large furnace should expose one centered front approach tile");
  assert(furnaceApproach[0].x === 9 && furnaceApproach[0].y === 21, "west-facing three-wide furnace approach should align to the center of the entrance side");
  const centeredFurnaceApproach = runtime.getStationApproachPositions(context, "FURNACE", 10, 21, 0);
  assert(centeredFurnaceApproach.length === 1 && centeredFurnaceApproach[0].x === 9 && centeredFurnaceApproach[0].y === 21, "large furnace should accept its center entrance tile as the interaction target");
  const blockedFurnace = runtime.validateStationApproach(context, "FURNACE", 10, 20, 10, 19, 0);
  assert(blockedFurnace.ok === false && blockedFurnace.message.includes("front of the furnace"), "furnace validation should explain blocked side");
  const allowedFurnace = runtime.validateStationApproach(context, "FURNACE", 10, 21, 9, 21, 0);
  assert(allowedFurnace.ok === true, "furnace validation should accept the front approach tile");

  const anvilApproach = runtime.getStationApproachPositions(context, "ANVIL", 30, 40, 0);
  assert(anvilApproach.length === 2, "anvil should expose both long-side approach tiles");
  assert(anvilApproach.some((pos) => pos.x === 30 && pos.y === 41), "anvil should expose front long-side approach tile");
  assert(anvilApproach.some((pos) => pos.x === 30 && pos.y === 39), "anvil should expose rear long-side approach tile");
  const anvilRotation = runtime.resolveInteractionFacingRotation(context, "ANVIL", 30, 40, 29, 40, 0);
  assert(Number.isFinite(anvilRotation), "anvil facing rotation should resolve from player and target tiles");

  console.log("Input station interaction runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
