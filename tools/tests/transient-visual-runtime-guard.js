const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createFakeThree() {
  class FakeVector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    copy(other) {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      return this;
    }
    clone() {
      return new FakeVector3(this.x, this.y, this.z);
    }
    project() {
      this.z = 0;
      return this;
    }
    set(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  }

  class FakeGroup {
    constructor() {
      this.children = [];
      this.position = new FakeVector3();
      this.scale = { set: (x, y, z) => { this.scaleValue = { x, y, z }; } };
      this.quaternion = { copy: (q) => { this.copiedQuaternion = q; } };
      this.userData = {};
      this.renderOrder = 0;
    }
    add(...children) {
      this.children.push(...children);
    }
  }

  class FakeMesh extends FakeGroup {
    constructor(geometry, material) {
      super();
      this.geometry = geometry;
      this.material = material;
      this.rotation = { z: 0 };
    }
  }

  return {
    Group: FakeGroup,
    Mesh: FakeMesh,
    MeshBasicMaterial: class FakeMeshBasicMaterial {
      constructor(options = {}) {
        Object.assign(this, options);
      }
    },
    PlaneGeometry: class FakePlaneGeometry {
      constructor(width, height) {
        this.width = width;
        this.height = height;
      }
    },
    SphereGeometry: class FakeSphereGeometry {
      constructor(radius, widthSegments, heightSegments) {
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
      }
    },
    Vector3: FakeVector3
  };
}

function createScene() {
  return {
    added: [],
    removed: [],
    add(mesh) {
      this.added.push(mesh);
    },
    remove(mesh) {
      this.removed.push(mesh);
    }
  };
}

function createDocument() {
  const body = {
    children: [],
    appendChild(el) {
      body.children.push(el);
    }
  };
  return {
    body,
    created: [],
    overhead: null,
    createElement(tagName) {
      const el = {
        tagName,
        className: "",
        innerText: "",
        style: {},
        removed: false,
        remove() {
          el.removed = true;
        },
        classList: {
          classes: new Set(),
          add(value) { this.classes.add(value); },
          remove(value) { this.classes.delete(value); }
        }
      };
      this.created.push(el);
      return el;
    },
    getElementById(id) {
      return id === "player-overhead-text" ? this.overhead : null;
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "transient-visual-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  const transientIndex = manifestSource.indexOf('id: "transient-visual-runtime"');
  const worldIndex = manifestSource.indexOf('id: "world"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/transient-visual-runtime.js?raw"), "legacy manifest should import the transient visual runtime raw script");
  assert(transientIndex !== -1 && worldIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include the transient visual runtime");
  assert(transientIndex < worldIndex && transientIndex < inputRenderIndex, "legacy manifest should load transient visual runtime before world/input consumers");

  assert(runtimeSource.includes("window.TransientVisualRuntime"), "transient visual runtime should expose a window runtime");
  assert(runtimeSource.includes("function spawnClickMarker"), "transient visual runtime should own click marker creation");
  assert(runtimeSource.includes("function spawnHitsplat"), "transient visual runtime should own hitsplat creation");
  assert(runtimeSource.includes("function playLevelUpAnimation"), "transient visual runtime should own level-up burst creation");
  assert(runtimeSource.includes("function updateTransientVisuals"), "transient visual runtime should own transient frame updates");
  assert(runtimeSource.includes("function updatePlayerOverheadText"), "transient visual runtime should own player overhead text projection");

  assert(worldSource.includes("window.TransientVisualRuntime"), "world.js should delegate transient visual creation through the runtime");
  assert(inputSource.includes("function getTransientVisualRuntime()"), "input-render.js should resolve the transient visual runtime");
  assert(inputSource.includes("runtime.spawnClickMarker({ THREE, scene, clickMarkers, position, isAction })"), "input-render.js should delegate click marker creation");
  assert(inputSource.includes("transientVisualRuntime.updateTransientVisuals({"), "input-render.js should delegate transient visual frame updates");
  assert(inputSource.includes("runtime.updatePlayerOverheadText({"), "input-render.js should delegate overhead text updates");
  assert(!inputSource.includes("const color = isAction ? 0xff0000 : 0xffff00"), "input-render.js should not own click marker material policy");
  assert(!inputSource.includes("for (let i = activeHitsplats.length - 1; i >= 0; i--)"), "input-render.js should not own hitsplat frame updates");
  assert(!worldSource.includes("const redSplat ="), "world.js should not own hitsplat DOM art");
  assert(!worldSource.includes("new THREE.SphereGeometry(0.06, 8, 8)"), "world.js should not own level-up orb construction");

  const sandbox = { window: {}, Date, Number, Object, String, Math, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.TransientVisualRuntime;
  assert(runtime, "transient visual runtime should execute in isolation");

  const THREE = createFakeThree();

  {
    const scene = createScene();
    const clickMarkers = [];
    const marker = runtime.spawnClickMarker({
      THREE,
      scene,
      clickMarkers,
      position: new THREE.Vector3(5, 1, 6),
      isAction: true,
      nowMs: 100
    });
    assert(marker && clickMarkers.length === 1, "spawnClickMarker should append a marker record");
    assert(scene.added.length === 1, "spawnClickMarker should add a mesh group to the scene");
    runtime.updateClickMarkers({
      scene,
      camera: { quaternion: { marker: true } },
      clickMarkers,
      nowMs: 250
    });
    assert(clickMarkers[0].mesh.scaleValue && clickMarkers[0].mesh.scaleValue.x < 1, "updateClickMarkers should shrink live markers");
    runtime.updateClickMarkers({
      scene,
      camera: { quaternion: { marker: true } },
      clickMarkers,
      nowMs: 600
    });
    assert(clickMarkers.length === 0 && scene.removed.length === 1, "expired click markers should be removed from scene and state");
  }

  {
    const documentRef = createDocument();
    const activeHitsplats = [];
    const hitsplat = runtime.spawnHitsplat({
      THREE,
      documentRef,
      activeHitsplats,
      playerState: { z: 0 },
      heightMap: [[[0, 0, 0], [0, 2, 0], [0, 0, 0]]],
      amount: 4,
      gridX: 1,
      gridY: 1,
      nowMs: 100
    });
    assert(hitsplat && activeHitsplats.length === 1, "spawnHitsplat should append a hitsplat record");
    assert(documentRef.body.children.length === 1 && documentRef.body.children[0].innerText === 4, "spawnHitsplat should create a DOM hitsplat");
    runtime.updateHitsplats({
      windowRef: { innerWidth: 800, innerHeight: 600 },
      camera: {},
      activeHitsplats,
      nowMs: 400
    });
    assert(activeHitsplats[0].el.style.display === "block", "updateHitsplats should project visible hitsplats");
    runtime.updateHitsplats({
      windowRef: { innerWidth: 800, innerHeight: 600 },
      camera: {},
      activeHitsplats,
      nowMs: 1400
    });
    assert(activeHitsplats.length === 0 && documentRef.body.children[0].removed, "expired hitsplats should be removed from DOM and state");
  }

  {
    const scene = createScene();
    const levelUpAnimations = [];
    const target = { position: new THREE.Vector3(2, 3, 4) };
    const animation = runtime.playLevelUpAnimation({
      THREE,
      scene,
      levelUpAnimations,
      type: 8,
      target,
      nowMs: 100
    });
    assert(animation && animation.mesh.children.length === 40, "level-up animation should create the legacy 40-orb burst");
    runtime.updateLevelUpAnimations({ scene, levelUpAnimations, nowMs: 400 });
    assert(levelUpAnimations[0].mesh.children[0].material.transparent === true, "level-up update should animate orb materials");
    runtime.updateLevelUpAnimations({ scene, levelUpAnimations, nowMs: 1700 });
    assert(levelUpAnimations.length === 0 && scene.removed.length === 1, "expired level-up animations should be removed");
  }

  {
    const documentRef = createDocument();
    documentRef.overhead = documentRef.createElement("div");
    runtime.updatePlayerOverheadText({
      windowRef: { innerWidth: 1000, innerHeight: 800 },
      documentRef,
      camera: {},
      playerRig: { position: new THREE.Vector3(0, 0, 0) },
      playerOverheadText: { text: "Hello", expiresAt: 500 },
      nowMs: 100
    });
    assert(documentRef.overhead.innerText === "Hello", "overhead text should be rendered while active");
    assert(!documentRef.overhead.classList.classes.has("hidden"), "active overhead text should be visible");
    runtime.updatePlayerOverheadText({
      windowRef: { innerWidth: 1000, innerHeight: 800 },
      documentRef,
      camera: {},
      playerRig: { position: new THREE.Vector3(0, 0, 0) },
      playerOverheadText: { text: "Hello", expiresAt: 50 },
      nowMs: 100
    });
    assert(documentRef.overhead.classList.classes.has("hidden"), "expired overhead text should be hidden");
  }

  console.log("Transient visual runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
