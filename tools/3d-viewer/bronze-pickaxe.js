import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("scene");
const status = document.getElementById("status");
const assetPath = document.getElementById("asset-path");
const params = new URLSearchParams(window.location.search);
const requestedAsset = params.get("asset") || "bronze_pickaxe.glb";
const selectedAsset = /^[a-z0-9_-]+\.glb$/i.test(requestedAsset) ? requestedAsset : "bronze_pickaxe.glb";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setClearColor(0x111612, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111612);
scene.fog = new THREE.Fog(0x111612, 7.5, 13);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(3.2, 2.4, 4.6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.58;
controls.target.set(0, 0.78, 0);
controls.minDistance = 2.2;
controls.maxDistance = 7;

const pivot = new THREE.Group();
pivot.rotation.set(0.12, 0, -0.24);
scene.add(pivot);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 96),
  new THREE.MeshStandardMaterial({
    color: 0x1a211b,
    roughness: 0.86,
    metalness: 0.02
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(6.4, 24, 0xb08a49, 0x2c392f);
grid.material.transparent = true;
grid.material.opacity = 0.22;
grid.position.y = 0.003;
scene.add(grid);

scene.add(new THREE.HemisphereLight(0xd6f0ff, 0x352617, 1.55));

const keyLight = new THREE.DirectionalLight(0xffe2a5, 4.2);
keyLight.position.set(3.4, 5.4, 3.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -4;
keyLight.shadow.camera.right = 4;
keyLight.shadow.camera.top = 4;
keyLight.shadow.camera.bottom = -4;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9ad9ff, 1.8);
rimLight.position.set(-4, 2.5, -3);
scene.add(rimLight);

if (assetPath) assetPath.textContent = `assets/3d/${selectedAsset}`;
const assetUrl = new URL(`../../assets/3d/${selectedAsset}?v=20260624d`, import.meta.url);
window.__bronzePickaxeViewerStatus = "loading";

new GLTFLoader().load(
  assetUrl.href,
  (gltf) => {
    const model = gltf.scene;
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        node.material.roughness = Math.min(node.material.roughness ?? 0.8, 0.92);
        node.material.needsUpdate = true;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(2.65 / maxDimension);

    const framedBox = new THREE.Box3().setFromObject(model);
    model.position.y += 0.04 - framedBox.min.y;
    pivot.add(model);

    status.textContent = "Loaded";
    window.__bronzePickaxeViewerStatus = "loaded";
  },
  undefined,
  (error) => {
    status.textContent = "Load failed";
    window.__bronzePickaxeViewerStatus = "failed";
    console.error("Failed to load bronze pickaxe GLB", error);
  }
);

function resize() {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

function animate() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
