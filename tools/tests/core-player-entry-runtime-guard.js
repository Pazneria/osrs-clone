const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeClassList() {
  const values = new Set();
  return {
    values,
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); },
    toggle(value, force) {
      const shouldAdd = typeof force === "boolean" ? force : !values.has(value);
      if (shouldAdd) values.add(value);
      else values.delete(value);
      return shouldAdd;
    }
  };
}

function makeElement(tagName) {
  const element = {
    tagName,
    className: "",
    textContent: "",
    value: "",
    disabled: false,
    type: "",
    placeholder: "",
    onclick: null,
    children: [],
    style: {},
    dataset: {},
    classList: makeClassList(),
    attributes: {},
    listeners: {},
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    focus() {
      this.focused = true;
    },
    select() {
      this.selected = true;
    }
  };
  Object.defineProperty(element, "innerHTML", {
    get() {
      return "";
    },
    set() {
      element.children = [];
    }
  });
  return element;
}

function makeDocument() {
  const elements = {
    "player-entry-overlay": makeElement("div"),
    "player-entry-title": makeElement("h1"),
    "player-entry-subtitle": makeElement("p"),
    "player-entry-summary": makeElement("div"),
    "player-entry-name": makeElement("input"),
    "player-entry-name-error": makeElement("div"),
    "player-entry-secondary-note": makeElement("div"),
    "player-entry-primary": makeElement("button"),
    "player-entry-gender-0": makeElement("button"),
    "player-entry-gender-1": makeElement("button"),
    "player-entry-preview-stage": makeElement("div"),
    "player-entry-creator-rows": makeElement("div")
  };
  elements["player-entry-color-rows"] = makeElement("div");
  const body = makeElement("body");
  return {
    body,
    activeElement: null,
    elements,
    getElementById(id) {
      return elements[id] || null;
    },
    createElement(tagName) {
      return makeElement(tagName);
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "core-player-entry-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const coreSource = fs.readFileSync(path.join(root, "src", "js", "core.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(runtimeSource.includes("window.CorePlayerEntryRuntime"), "player-entry runtime should expose a window runtime");
  assert(runtimeSource.includes("function sanitizePlayerName"), "player-entry runtime should own name sanitation");
  assert(runtimeSource.includes("function validatePlayerEntryName"), "player-entry runtime should own name validation");
  assert(runtimeSource.includes("function packedPlayerEntryColorToCss"), "player-entry runtime should own packed color conversion");
  assert(runtimeSource.includes("function renderPlayerEntryFlow"), "player-entry runtime should own player-entry DOM rendering");
  assert(runtimeSource.includes("function bindPlayerEntryFlowControls"), "player-entry runtime should own player-entry DOM event binding");
  assert(!runtimeSource.includes("previewState.yaw += 0.0025"), "player-entry preview should not auto-rotate");
  assert(runtimeSource.includes("nextRig.position.set(0, -0.18, -0.16)"), "player-entry preview rig should sit high enough inside the stage frame");
  assert(runtimeSource.includes("floor.position.set(0, -0.245, -0.16)"), "player-entry platform should stay inside the preview stage frame");
  assert(manifestSource.indexOf('id: "core-player-entry-runtime"') !== -1, "legacy manifest should include the player-entry runtime");
  assert(
    manifestSource.indexOf('id: "core-chat-runtime"') < manifestSource.indexOf('id: "core-player-entry-runtime"')
      && manifestSource.indexOf('id: "core-player-entry-runtime"') < manifestSource.indexOf('id: "core"'),
    "legacy manifest should load player-entry runtime after core chat and before core.js"
  );
  assert(coreSource.includes("const corePlayerEntryRuntime = window.CorePlayerEntryRuntime || null;"), "core.js should resolve the player-entry runtime");
  assert(coreSource.includes("corePlayerEntryRuntime.renderPlayerEntryFlow"), "core.js should delegate player-entry rendering");
  assert(coreSource.includes("corePlayerEntryRuntime.bindPlayerEntryFlowControls"), "core.js should delegate player-entry event binding");
  assert(coreSource.includes("corePlayerEntryRuntime.setPlayerEntryFlowOpen"), "core.js should delegate player-entry overlay DOM gating");
  assert(!coreSource.includes("const PLAYER_CREATION_COLOR_LABELS"), "core.js should not own player-entry color labels");
  assert(!coreSource.includes("function packedPlayerEntryColorToCss"), "core.js should not own player-entry color conversion");
  assert(!coreSource.includes("function renderPlayerEntryColorRows"), "core.js should not own color-row rendering");
  assert(!coreSource.includes("function renderPlayerEntrySummary"), "core.js should not own player-entry summary rendering");
  assert(!coreSource.includes("const maleButton = document.getElementById('player-entry-gender-0');"), "core.js should not bind player-entry gender controls directly");

  const sandbox = { window: {}, document: null, Date, Number, Math, Array, Set };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.CorePlayerEntryRuntime;
  assert(runtime, "player-entry runtime should execute in isolation");

  assert(runtime.sanitizePlayerName(" Sir!!  Test__Name  ", { maxLength: 8 }) === "Sir Test", "runtime should sanitize and trim player names");
  assert(!runtime.validatePlayerEntryName({ name: "A", minLength: 2, maxLength: 12 }).ok, "runtime should reject short names");
  assert(runtime.validatePlayerEntryName({ name: "Adventurer", minLength: 2, maxLength: 12 }).ok, "runtime should accept valid names");
  assert(runtime.packedPlayerEntryColorToCss(0).startsWith("rgb("), "runtime should convert packed palette colors to css");

  const documentRef = makeDocument();
  const profile = { name: "Ari", creationCompleted: false };
  const flow = { isOpen: false, hasLoadedSave: false };
  const appearance = {
    gender: 1,
    colors: [0, 1, 0, 0, 0],
    creatorSelections: {
      hairStyle: "missing",
      faceStyle: "angular",
      facialHair: "clean",
      bodyStyle: "shirt_vest",
      legStyle: "trousers",
      feetStyle: "shoes"
    }
  };
  const catalog = {
    bodyColorLabels: ["Hair", "Top", "Bottom", "Footwear", "Skin"],
    bodyColorPalettes: [
      [0, 1024, 2048, 4096, 8192, 16384, 32768, 65535],
      [0, 1024, 2048, 4096, 8192, 16384, 32768, 65535],
      [0, 1024, 2048, 4096, 8192, 16384, 32768, 65535],
      [0, 1024, 2048, 4096, 8192, 16384, 32768, 65535],
      [0, 1024, 2048, 4096, 8192, 16384, 32768, 65535]
    ],
    creatorSlotOrder: ["hairStyle", "faceStyle", "facialHair", "bodyStyle", "legStyle", "feetStyle"],
    creatorDefaults: {
      hairStyle: "short",
      faceStyle: "plain",
      facialHair: "clean",
      bodyStyle: "plain_tunic",
      legStyle: "trousers",
      feetStyle: "shoes"
    },
    creatorSlots: {
      hairStyle: {
        label: "Hair",
        options: [
          { id: "bald", label: "Bald", kitId: "creator_hair_bald" },
          { id: "short", label: "Short", kitId: "creator_hair_short" },
          { id: "swept", label: "Swept", kitId: "creator_hair_swept" },
          { id: "long", label: "Long", kitId: "creator_hair_long" }
        ]
      },
      faceStyle: {
        label: "Face",
        options: [
          { id: "plain", label: "Plain", kitId: "creator_face_plain" },
          { id: "soft", label: "Soft", kitId: "creator_face_soft" },
          { id: "angular", label: "Angular", kitId: "creator_face_angular" },
          { id: "strong-brow", label: "Strong Brow", kitId: "creator_face_strong_brow" }
        ]
      },
      facialHair: {
        label: "Facial Hair",
        options: [
          { id: "clean", label: "Clean", kitId: "creator_facial_hair_clean" },
          { id: "stubble", label: "Stubble", kitId: "creator_facial_hair_stubble" },
          { id: "moustache", label: "Moustache", kitId: "creator_facial_hair_moustache" },
          { id: "short_beard", label: "Short Beard", kitId: "creator_facial_hair_short_beard" }
        ]
      },
      bodyStyle: {
        label: "Top",
        options: [
          { id: "plain_tunic", label: "Plain Tunic", kitId: "creator_body_plain_tunic" },
          { id: "shirt_vest", label: "Shirt & Vest", kitId: "creator_body_shirt_vest" },
          { id: "striped_shirt", label: "Striped Shirt", kitId: "creator_body_striped_shirt" },
          { id: "work_apron", label: "Work Apron", kitId: "creator_body_work_apron" }
        ]
      },
      legStyle: {
        label: "Bottom",
        options: [
          { id: "trousers", label: "Trousers", kitId: "creator_leg_trousers" },
          { id: "rolled_trousers", label: "Rolled Trousers", kitId: "creator_leg_rolled_trousers" },
          { id: "skirt", label: "Skirt", kitId: "creator_leg_skirt" },
          { id: "wrapped_legs", label: "Wrapped Legs", kitId: "creator_leg_wrapped_legs" }
        ]
      },
      feetStyle: {
        label: "Footwear",
        options: [
          { id: "shoes", label: "Shoes", kitId: "creator_feet_shoes" },
          { id: "work_boots", label: "Work Boots", kitId: "creator_feet_work_boots" },
          { id: "sandals", label: "Sandals", kitId: "creator_feet_sandals" }
        ]
      }
    }
  };
  let previewRefreshes = 0;
  runtime.renderPlayerEntryFlow({
    documentRef,
    playerProfileState: profile,
    playerEntryFlowState: flow,
    playerAppearanceState: appearance,
    playerAppearanceCatalog: catalog,
    defaultName: "Adventurer",
    nameMinLength: 2,
    nameMaxLength: 12,
    refreshPlayerAppearancePreview: () => { previewRefreshes += 1; },
    buildPlayerProfileSummaryViewModel: () => ({
      name: "Ari",
      bodyTypeLabel: "Female",
      statusText: "Fresh character profile",
      isContinueFlow: false,
      titleText: "Create Your Adventurer",
      subtitleText: "Choose a starter identity before you arrive on Tutorial Island.",
      primaryActionText: "Start Adventure",
      noteText: "Progress will begin autosaving locally in this browser once you arrive."
    })
  });
  assert(documentRef.getElementById("player-entry-title").textContent === "Create Your Adventurer", "runtime should render player-entry title");
  assert(documentRef.getElementById("player-entry-primary").disabled === false, "runtime should enable primary action for valid names");
  assert(documentRef.getElementById("player-entry-gender-1").classList.contains("active"), "runtime should render active gender button");
  assert(appearance.creatorSelections.hairStyle === "short", "runtime should sanitize missing creator selections to defaults");
  assert(appearance.creatorSelections.bodyStyle === "shirt_vest", "runtime should preserve valid shared creator selections");
  const creatorRows = documentRef.getElementById("player-entry-creator-rows");
  assert(creatorRows.children.length === 6, "runtime should render the creator category rows");
  assert(creatorRows.children[0].children[0].textContent === "Hair", "runtime should render creator row labels");
  assert(creatorRows.children[0].children[1].children[1].textContent === "Short", "runtime should render the active creator option label");
  creatorRows.children[0].children[1].children[2].onclick();
  assert(appearance.creatorSelections.hairStyle === "swept" && previewRefreshes === 1, "runtime creator arrows should update selections and refresh preview");
  const colorRows = documentRef.getElementById("player-entry-color-rows");
  assert(colorRows.children.length === 5, "runtime should render the player-entry color rows");
  assert(colorRows.children[0].children[1].children.length === 8, "runtime should render the expanded shared creator palette");
  const firstSwatch = colorRows.children[0].children[1].children[1];
  firstSwatch.onclick();
  assert(appearance.colors[0] === 1 && previewRefreshes === 2, "runtime swatch clicks should update appearance and refresh preview");

  let completed = false;
  runtime.bindPlayerEntryFlowControls({
    documentRef,
    playerProfileState: profile,
    playerEntryFlowState: flow,
    playerAppearanceState: appearance,
    playerAppearanceCatalog: catalog,
    nameMaxLength: 12,
    refreshPlayerAppearancePreview: () => { previewRefreshes += 1; },
    completePlayerEntryFlow: () => { completed = true; }
  });
  const nameInput = documentRef.getElementById("player-entry-name");
  nameInput.value = "No!! Name";
  nameInput.listeners.input();
  assert(profile.name === "No Name" && nameInput.value === "No Name", "runtime name input binding should sanitize profile names");
  const refreshesBeforeGender = previewRefreshes;
  documentRef.getElementById("player-entry-gender-0").listeners.click();
  assert(appearance.gender === 0, "runtime should switch body type from the gender controls");
  assert(appearance.creatorSelections.hairStyle === "swept" && appearance.creatorSelections.bodyStyle === "shirt_vest", "runtime should preserve creator selections across body type switches");
  assert(previewRefreshes > refreshesBeforeGender, "runtime body type switches should refresh preview");
  nameInput.listeners.keydown({ key: "Enter", preventDefault() {} });
  assert(completed, "runtime key binding should delegate completion");

  runtime.setPlayerEntryFlowOpen({ documentRef, playerEntryFlowState: flow, isOpen: true });
  assert(flow.isOpen === true, "runtime should update player-entry open state");
  assert(!documentRef.getElementById("player-entry-overlay").classList.contains("hidden"), "runtime should show the overlay");
  assert(documentRef.body.classList.contains("player-entry-open"), "runtime should toggle the body entry class");

  console.log("Core player-entry runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
