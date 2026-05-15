const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const worldSource = readRepoFile(root, "src/js/world.js");
  const humanoidModelRuntimeSource = readRepoFile(root, "src/js/humanoid-model-runtime.js");
  const inputSource = readRepoFile(root, "src/js/input-render.js");
  const npcRuntimeSource = readRepoFile(root, "src/js/world/npc-render-runtime.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const humanoidModelRuntimeIndex = manifestSource.indexOf('id: "humanoid-model-runtime"');
  const npcRuntimeIndex = manifestSource.indexOf('id: "world-npc-render-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');

  assert(npcRuntimeIndex !== -1 && worldIndex !== -1 && npcRuntimeIndex < worldIndex, "legacy script manifest should load NPC render runtime before world.js");
  assert(humanoidModelRuntimeIndex !== -1 && humanoidModelRuntimeIndex < worldIndex, "legacy script manifest should load humanoid model runtime before world.js");
  assert(humanoidModelRuntimeSource.includes("window.createHumanoidModel = createHumanoidModel;"), "humanoid model runtime should publish the legacy humanoid model builder");
  assert(!inputSource.includes("function createHumanoidModel("), "input-render.js should not own humanoid model construction");
  assert(worldSource.includes("WorldNpcRenderRuntime"), "world.js should delegate NPC render and hitbox construction");
  assert(npcRuntimeSource.includes("window.WorldNpcRenderRuntime"), "NPC render runtime should expose a window runtime");
  assert(npcRuntimeSource.includes("function appendChunkNpcVisuals(options = {})"), "NPC render runtime should own chunk NPC visual attachment");
  assert(npcRuntimeSource.includes("function createNpcInteractionUid(npc, appearanceId)"), "NPC render runtime should own NPC interaction UID shaping");
  assert(npcRuntimeSource.includes("function applyNpcRenderVisibility(npc, mesh, hitbox)"), "NPC render runtime should own step-gated NPC visibility shaping");
  assert(npcRuntimeSource.includes("if (npc.travelToWorldId) npcUid.travelToWorldId = npc.travelToWorldId;"), "NPC render runtime should preserve travel metadata on hitboxes");
  assert(npcRuntimeSource.includes("if (appearanceId) npcUid.appearanceId = appearanceId;"), "NPC render runtime should preserve appearance metadata on hitboxes");
  assert(npcRuntimeSource.includes("if (Number.isFinite(npc.type)) npcUid.type = npc.type;"), "NPC render runtime should preserve model type metadata on hitboxes");
  assert(npcRuntimeSource.includes("if (typeof npc.dialogueId === 'string' && npc.dialogueId.trim()) npcUid.dialogueId = npc.dialogueId.trim();"), "NPC render runtime should preserve dialogue metadata on hitboxes");
  assert(!worldSource.includes("const getNpcAppearanceId = (npc) => {"), "world.js should not own NPC appearance fallback resolution");
  assert(!worldSource.includes("const npcUid = {"), "world.js should not shape NPC hitbox UIDs inline");
  assert(!worldSource.includes("new THREE.BoxGeometry(1, 2, 1)"), "world.js should not own NPC hitbox geometry construction");

  global.window = {};
  vm.runInThisContext(npcRuntimeSource, { filename: path.join(root, "src", "js", "world", "npc-render-runtime.js") });
  const runtime = window.WorldNpcRenderRuntime;
  assert(runtime, "NPC render runtime should be available after evaluation");
  assert(typeof runtime.applyNpcRenderVisibility === "function", "NPC render runtime should expose visibility application");

  const uid = runtime.createNpcInteractionUid({
    name: "Guide",
    action: "Travel",
    type: 3,
    x: 10,
    y: 20,
    spawnId: "npc:guide",
    merchantId: "tutorial_guide",
    dialogueId: " tutorial_guide ",
    travelToWorldId: "main_overworld",
    travelSpawn: { x: 205, y: 210, z: 0 }
  }, "tanner_rusk");
  assert(uid.action === "Travel", "NPC interaction UID should preserve explicit action");
  assert(uid.type === 3, "NPC interaction UID should preserve model type");
  assert(uid.appearanceId === "tanner_rusk", "NPC interaction UID should preserve resolved appearance");
  assert(uid.dialogueId === "tutorial_guide", "NPC interaction UID should trim dialogue id");
  assert(uid.travelToWorldId === "main_overworld", "NPC interaction UID should preserve travel world id");
  assert(uid.travelSpawn && uid.travelSpawn.x === 205, "NPC interaction UID should clone travel spawn metadata");

  const fakeThree = {
    BoxGeometry: function BoxGeometry() {},
    Mesh: function Mesh() {
      this.position = { y: 0 };
      this.userData = {};
      this.visible = true;
    }
  };
  const humanoidMesh = {
    position: { set: (x, y, z) => { humanoidMesh.positionValue = { x, y, z }; } },
    rotation: { y: 0 },
    visible: true,
    add: (child) => { humanoidMesh.child = child; }
  };
  const renderData = runtime.createNpcRenderData({
    THREE: fakeThree,
    npc: {
      name: "Tutorial Guide",
      action: "Talk-to",
      type: 3,
      x: 1,
      y: 1,
      z: 0,
      tutorialVisibilityActive: false
    },
    sharedMaterials: { hiddenHitbox: {} },
    heightMap: [[[0, 0], [0, 0]]],
    createHumanoidModel: () => humanoidMesh,
    resolveTownNpcDefaultFacingYaw: () => 0,
    z: 0,
    Z_OFFSET: 0
  });
  assert(renderData.mesh.visible === false, "hidden tutorial NPCs should render with hidden meshes");
  assert(renderData.hitbox.visible === false && renderData.hitbox.userData.ignoreRaycast === true, "hidden tutorial NPCs should render with ignored hitboxes");
  assert(renderData.hitbox.userData.uid.tutorialHidden === true, "hidden tutorial NPC UIDs should mark tutorialHidden for raycast filtering");

  console.log("NPC render runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
