const assert = require("assert");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const THREE = require("three");
const { readPngSize } = require("../pixel/pixel-png");

function readRepoFile(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseGlbJson(glbPath) {
  const buffer = fs.readFileSync(glbPath);
  assert(buffer.length > 20, "GLB should not be empty");
  assert(buffer.readUInt32LE(0) === 0x46546c67, "GLB magic should be glTF");
  assert(buffer.readUInt32LE(4) === 2, "GLB version should be 2");
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  assert(jsonType === 0x4e4f534a, "first GLB chunk should be JSON");
  return JSON.parse(buffer.slice(20, 20 + jsonLength).toString("utf8").trim());
}

function loadAsset3dCatalog(root) {
  const catalogScript = readRepoFile(root, "src/js/content/asset-3d-catalog.js");
  const sandbox = { window: {} };
  vm.runInNewContext(catalogScript, sandbox, {
    filename: path.join(root, "src", "js", "content", "asset-3d-catalog.js")
  });
  return sandbox.window.Asset3DCatalog;
}

function loadAsset3dRuntime(root, options = {}) {
  const catalog = loadAsset3dCatalog(root);
  const runtimeScript = readRepoFile(root, "src/js/asset-3d-runtime.js");
  const windowRef = Object.assign({ Asset3DCatalog: catalog }, options.window || {});
  const sandbox = { window: windowRef, THREE };
  vm.runInNewContext(runtimeScript, sandbox, {
    filename: path.join(root, "src", "js", "asset-3d-runtime.js")
  });
  return sandbox.window.Asset3DRuntime;
}

function assertVectorNear(actual, expected, label) {
  assert(Math.abs(actual.x - expected.x) < 1e-8, `${label} x should match`);
  assert(Math.abs(actual.y - expected.y) < 1e-8, `${label} y should match`);
  assert(Math.abs(actual.z - expected.z) < 1e-8, `${label} z should match`);
}

function runAsset3dRuntimeBehaviorGuard(root) {
  const fallbackRuntime = loadAsset3dRuntime(root);
  assert(
    fallbackRuntime.createEquipmentVisualMeshes("bronze_pickaxe", "sword", { THREERef: THREE }).length === 0,
    "asset-3d runtime should ignore equipment target mismatches"
  );

  const fallbackMeshes = fallbackRuntime.createEquipmentVisualMeshes("bronze_pickaxe", "axe", { THREERef: THREE });
  assert(fallbackMeshes.length === 1, "asset-3d runtime should create one equipped mesh group");
  const fallbackGroup = fallbackMeshes[0];
  assert(fallbackGroup.userData.asset3dSource === "fallback", "runtime should use fallback primitives when GLTFLoader is unavailable");
  assert(fallbackGroup.children.length === 1, "fallback group should wrap the generated primitive group");
  assert(fallbackGroup.children[0].children.length >= 8, "fallback primitive group should include the authored pickaxe parts");
  assert(fallbackRuntime.getLoadState("bronze_pickaxe").status === "unavailable", "runtime should expose unavailable load state without GLTFLoader");

  const pose = fallbackRuntime.getAssetDef("bronze_pickaxe").attachment;
  const expectedPosition = new THREE.Vector3(pose.position[0], pose.position[1], pose.position[2]);
  const gripOffset = new THREE.Vector3(pose.gripPoint[0], pose.gripPoint[1], pose.gripPoint[2])
    .multiplyScalar(pose.scale)
    .applyEuler(new THREE.Euler(pose.rotation[0], pose.rotation[1], pose.rotation[2]));
  expectedPosition.sub(gripOffset);
  assertVectorNear(fallbackGroup.position, expectedPosition, "equipped grip anchored position");

  let requestedPath = null;
  let pendingLoad = null;
  class FakeGLTFLoader {
    load(pathToLoad, onLoad) {
      requestedPath = pathToLoad;
      pendingLoad = onLoad;
    }
  }

  const loadingRuntime = loadAsset3dRuntime(root, { window: { GLTFLoader: FakeGLTFLoader } });
  const loadingMeshes = loadingRuntime.createGroundItemVisualMeshes("bronze_pickaxe", { THREERef: THREE });
  assert(loadingMeshes.length === 1, "asset-3d runtime should create one ground mesh group");
  const loadingGroup = loadingMeshes[0];
  assert(
    requestedPath === "./assets/3d/bronze_pickaxe.glb?v=20260624h",
    "runtime should request the versioned bronze_pickaxe GLB path"
  );
  assert(loadingRuntime.getLoadState("bronze_pickaxe").status === "loading", "runtime should expose loading state before GLB resolution");
  assert(loadingGroup.userData.asset3dSource === "fallback", "runtime should render fallback while the GLB is loading");

  const loadedScene = new THREE.Group();
  loadedScene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
  pendingLoad({ scene: loadedScene });
  assert(loadingRuntime.getLoadState("bronze_pickaxe").status === "loaded", "runtime should expose loaded state after GLB resolution");
  assert(loadingGroup.userData.asset3dSource === "glb", "runtime should replace waiting fallback groups after the GLB loads");
  assert(loadingGroup.children.length === 1 && loadingGroup.children[0].name === "asset3d-glb-bronze_pickaxe", "runtime should attach a named cloned GLB scene");
  assert(loadingGroup.children[0].children[0].castShadow === true, "runtime should mark loaded GLB meshes renderable");
}

function runAsset3dBuildCliGuard(root) {
  const result = spawnSync(
    process.execPath,
    ["tools/3d/build-assets.js", "--asset", "__missing_asset__"],
    {
      cwd: root,
      encoding: "utf8"
    }
  );
  assert(result.status !== 0, "3D asset build CLI should reject unknown requested assets");
  assert(
    result.stderr.includes("ERROR: unknown 3D asset '__missing_asset__'"),
    "3D asset build CLI should explain unknown requested assets"
  );
}

function runAsset3dBuildGuard(root) {
  const result = spawnSync(
    process.execPath,
    ["tools/3d/build-assets.js", "--asset", "bronze_pickaxe"],
    {
      cwd: root,
      encoding: "utf8"
    }
  );
  assert(result.status === 0, `3D asset build should succeed for bronze_pickaxe: ${result.stderr || result.stdout}`);
}

function main() {
  const root = path.resolve(__dirname, "..", "..");
  runAsset3dBuildGuard(root);

  const manifestPath = path.join(root, "content", "assets", "3d-assets.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const bronze = manifest.assets && manifest.assets.bronze_pickaxe;
  assert(bronze, "3D asset manifest should declare bronze_pickaxe");
  assert(bronze.runtime.path === "assets/3d/bronze_pickaxe.glb", "bronze_pickaxe runtime should be a GLB");
  assert(bronze.inventoryIcon.path === "assets/pixel/bronze_pickaxe.png", "bronze_pickaxe icon should write the current inventory-compatible path");
  assert(bronze.inventoryIcon.camera === "tool_side", "bronze_pickaxe inventory icon should render from the GLB side-view camera");
  assert(bronze.attachment.scale === 0.36, "bronze_pickaxe equipped attachment should use the approved held scale");
  assert(Array.isArray(bronze.attachment.gripPoint), "bronze_pickaxe equipped attachment should anchor to the handle-end grip point");
  assert(bronze.groundPose.scale === 0.28, "bronze_pickaxe ground pose should use the approved dropped scale");
  assert(Array.isArray(bronze.groundPose.position) && bronze.groundPose.position[1] === 0.08, "bronze_pickaxe ground pose should sit on the terrain after the dropped scale change");
  assert(bronze.source.path === "assets/3d-src/bronze_pickaxe/source.json", "bronze_pickaxe should have an authored 3D source");
  assert(bronze.source.kind === "ai_image_to_3d_glb", "bronze_pickaxe should use the promoted AI image-to-3D source lane");

  const source = JSON.parse(fs.readFileSync(path.join(root, bronze.source.path), "utf8"));
  assert(source.kind === "ai_image_to_3d_glb", "bronze_pickaxe source should record the AI GLB source kind");
  assert(source.sourceGlb === "assets/3d-src/bronze_pickaxe/bronze_pickaxe_ai_candidate.glb", "bronze_pickaxe should keep the raw AI candidate GLB as provenance");
  assert(source.runtimeGlb === "assets/3d-src/bronze_pickaxe/bronze_pickaxe_ai_colored.glb", "bronze_pickaxe should promote the colored AI GLB");
  assert(fs.existsSync(path.join(root, source.conceptImage)), "bronze_pickaxe should keep the concept image used for image-to-3D generation");
  assert(fs.existsSync(path.join(root, source.sourceGlb)), "bronze_pickaxe raw AI source GLB should exist");
  assert(fs.existsSync(path.join(root, source.runtimeGlb)), "bronze_pickaxe colored source GLB should exist");
  assert(Array.isArray(source.primitives) && source.primitives.length >= 8, "bronze_pickaxe should keep fallback primitive parts for legacy fallback rendering");
  assert(
    source.primitives.some((primitive) => primitive && primitive.shape && primitive.shape !== "box"),
    "bronze_pickaxe fallback source should include authored non-box geometry instead of a box-only placeholder"
  );

  const glbJson = parseGlbJson(path.join(root, bronze.runtime.path));
  assert(glbJson.asset && glbJson.asset.version === "2.0", "bronze_pickaxe GLB should be glTF 2.0");
  assert(Array.isArray(glbJson.materials) && glbJson.materials.length >= 4, "bronze_pickaxe GLB should preserve material separation");
  assert(Array.isArray(glbJson.meshes) && glbJson.meshes.length >= 1, "bronze_pickaxe GLB should include a runtime mesh");
  const runtimeGlbSize = fs.statSync(path.join(root, bronze.runtime.path)).size;
  assert(runtimeGlbSize > 1000000, "bronze_pickaxe runtime GLB should be the promoted AI mesh, not the old lightweight procedural placeholder");

  const iconSize = readPngSize(path.join(root, bronze.inventoryIcon.path));
  assert(iconSize.width === 32 && iconSize.height === 32, "generated bronze_pickaxe inventory icon should be 32x32");
  const reviewSize = readPngSize(path.join(root, bronze.inventoryIcon.reviewPath));
  assert(reviewSize.width === 32 && reviewSize.height === 32, "bronze_pickaxe review icon should be 32x32");

  const catalog = loadAsset3dCatalog(root);
  assert(catalog && catalog.assets && catalog.assets.bronze_pickaxe, "legacy 3D asset catalog should mirror bronze_pickaxe");
  assert(catalog.assets.bronze_pickaxe.runtime.path === "assets/3d/bronze_pickaxe.glb", "legacy 3D asset catalog should point bronze_pickaxe at the promoted runtime GLB");
  assert(catalog.assets.bronze_pickaxe.sourceKind === "ai_image_to_3d_glb", "legacy 3D asset catalog should mirror the AI source kind");
  assert(catalog.assets.bronze_pickaxe.groundPose.scale === 0.28, "legacy 3D asset catalog should mirror the approved dropped scale");
  assert(Array.isArray(catalog.assets.bronze_pickaxe.fallbackPrimitives), "legacy 3D asset catalog should include fallback primitives");

  const itemCatalogSource = readRepoFile(root, "src/js/content/item-catalog.js");
  assert(itemCatalogSource.includes("asset3d: 'bronze_pickaxe'"), "bronze_pickaxe item def should opt into asset3d");
  assert(itemCatalogSource.includes("db[id].asset3d = def.asset3d"), "ItemCatalog.buildItemDb should publish asset3d");

  const appearanceSource = readRepoFile(root, "src/js/content/player-appearance-catalog.js");
  assert(appearanceSource.includes("asset3d: 'bronze_pickaxe'"), "bronze_pickaxe appearance def should opt into asset3d");

  const playerModelSource = readRepoFile(root, "src/js/player-model.js");
  assert(playerModelSource.includes("window.Asset3DRuntime"), "player-model should prefer Asset3DRuntime for opted-in equipment");
  assert(playerModelSource.includes("asset3dRuntime.createEquipmentVisualMeshes"), "player-model should create equipped 3D asset meshes");
  assert(playerModelSource.includes("if (typeof item.asset3d === 'string' && item.asset3d) return [];"), "player-model should skip legacy fragments for asset3d-equipped items");
  assert(playerModelSource.includes("function addAsset3dEquipmentVisuals"), "player-model should attach persistent asset3d visuals to equipped rigs");
  assert(playerModelSource.includes("addAsset3dEquipmentVisuals(rigRoot, normalized);"), "player rigs should receive persistent asset3d equipment after cloning");

  const asset3dRuntimeSource = readRepoFile(root, "src/js/asset-3d-runtime.js");
  assert(asset3dRuntimeSource.includes("pose.gripPoint"), "asset-3d runtime should support local GLB grip-point anchoring");
  assert(asset3dRuntimeSource.includes("group.position.sub(gripOffset)"), "asset-3d runtime should place the grip point at the attachment position");
  runAsset3dRuntimeBehaviorGuard(root);

  const groundItemSource = readRepoFile(root, "src/js/world/ground-item-render-runtime.js");
  assert(groundItemSource.includes("asset3dRuntime.createGroundItemVisualMeshes"), "ground item renderer should use the 3D ground pose");

  const bootstrapSource = readRepoFile(root, "src/game/platform/bootstrap.ts");
  assert(bootstrapSource.includes("GLTFLoader"), "platform bootstrap should expose GLTFLoader for legacy runtime scripts");

  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");
  const catalogIndex = manifestSource.indexOf('id: "asset-3d-catalog"');
  const appearanceIndex = manifestSource.indexOf('id: "player-appearance-catalog"');
  const runtimeIndex = manifestSource.indexOf('id: "asset-3d-runtime"');
  const playerModelIndex = manifestSource.indexOf('id: "player-model"');
  assert(catalogIndex !== -1 && appearanceIndex !== -1 && catalogIndex < appearanceIndex, "asset-3d catalog should load before player appearance catalog");
  assert(runtimeIndex !== -1 && playerModelIndex !== -1 && runtimeIndex < playerModelIndex, "asset-3d runtime should load before player-model");

  const copyScript = readRepoFile(root, "tools/build/copy-runtime-assets.js");
  assert(copyScript.includes('"assets/3d"'), "build copy step should include assets/3d");
  runAsset3dBuildCliGuard(root);

  console.log("3D asset pipeline guard passed.");
}

main();
