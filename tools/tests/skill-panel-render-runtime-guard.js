const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function createFakeDocument() {
  const elementsById = new Map();

  function createElement(tagName) {
    return {
      tagName,
      type: "",
      className: "",
      innerText: "",
      innerHTML: "",
      onclick: null,
      children: [],
      appendChild(child) {
        this.children.push(child);
        return child;
      }
    };
  }

  function getText(element) {
    if (!element) return "";
    const ownText = `${element.innerText || ""}${element.innerHTML || ""}`;
    return element.children.reduce((text, child) => `${text}${getText(child)}`, ownText);
  }

  const documentRef = {
    createElement,
    getElementById(id) {
      return elementsById.get(id) || null;
    },
    mount(id) {
      const element = createElement("div");
      elementsById.set(id, element);
      return element;
    },
    getText
  };

  return documentRef;
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimeSource = read(root, "src/js/skill-panel-render-runtime.js");
  const inventorySource = read(root, "src/js/inventory.js");
  const manifestSource = read(root, "src/game/platform/legacy-script-manifest.ts");

  const skillPanelIndex = manifestSource.indexOf('id: "skill-panel-runtime"');
  const skillPanelRenderIndex = manifestSource.indexOf('id: "skill-panel-render-runtime"');
  const inventoryIndex = manifestSource.indexOf('id: "inventory"');

  assert(manifestSource.includes("skillPanelRenderRuntimeScript"), "legacy manifest should import the skill panel render runtime raw script");
  assert(skillPanelIndex !== -1, "legacy manifest should include the skill panel runtime");
  assert(skillPanelRenderIndex !== -1, "legacy manifest should include the skill panel render runtime");
  assert(inventoryIndex !== -1, "legacy manifest should include inventory.js");
  assert(skillPanelIndex < skillPanelRenderIndex && skillPanelRenderIndex < inventoryIndex, "legacy manifest should load skill panel render runtime between skill panel data runtime and inventory.js");

  assert(runtimeSource.includes("window.SkillPanelRenderRuntime"), "skill panel render runtime should expose a window runtime");
  assert(runtimeSource.includes("function renderSkillPanelSummary(options = {})"), "skill panel render runtime should own summary rendering");
  assert(runtimeSource.includes("function renderSkillPanelTimeline(options = {})"), "skill panel render runtime should own timeline rendering");
  assert(runtimeSource.includes("function buildSkillPanelUnlockDetailsElement"), "skill panel render runtime should own unlock detail DOM rendering");

  assert(inventorySource.includes("function getSkillPanelRenderRuntime()"), "inventory.js should resolve the skill panel render runtime");
  assert(inventorySource.includes("runtime.renderSkillPanelSummary"), "inventory.js should delegate summary rendering to the skill panel render runtime");
  assert(inventorySource.includes("runtime.renderSkillPanelTimeline"), "inventory.js should delegate timeline rendering to the skill panel render runtime");
  assert(!inventorySource.includes("function addSkillPanelDetailSection"), "inventory.js should not own skill-panel detail section DOM helpers");
  assert(!inventorySource.includes("function buildSkillPanelUnlockDetailsElement"), "inventory.js should not own skill-panel unlock detail DOM rendering");
  assert(!inventorySource.includes("function renderSkillPanelTimelineLegacy"), "inventory.js should not keep the legacy skill-panel timeline renderer");

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: "skill-panel-render-runtime.js" });
  const runtime = sandbox.window.SkillPanelRenderRuntime;
  assert(runtime, "skill panel render runtime should execute in isolation");

  const documentRef = createFakeDocument();
  const summaryEl = documentRef.mount("skill-panel-summary");
  const timelineEl = documentRef.mount("skill-panel-unlocks");
  const escapedValues = [];

  runtime.renderSkillPanelSummary({
    documentRef,
    escapeHtml(value) {
      escapedValues.push(String(value));
      return `escaped:${value}`;
    },
    progressViewModel: {
      icon: "COOK",
      name: "Cooking",
      level: 12,
      remainingText: "42 XP"
    },
    referenceViewModel: {
      currentBandLabel: "Lv 10-19",
      nextBandLabel: "Lv 20-29",
      nextUnlockText: "Next unlock at level 15"
    }
  });
  assert(summaryEl.innerHTML.includes("escaped:Cooking"), "summary renderer should render escaped skill names");
  assert(summaryEl.innerHTML.includes("escaped:Lv 10-19"), "summary renderer should render escaped current band labels");
  assert(escapedValues.includes("Next unlock at level 15"), "summary renderer should route user-visible summary values through escapeHtml");

  let selectedUnlockKey = null;
  const referenceViewModel = {
    tiers: [
      {
        status: "current",
        bandLabel: "Lv 10-19",
        unlockCount: 1,
        unlocks: [
          {
            key: "cooking:trout",
            label: "Cook Trout",
            requiredLevel: 15,
            unlockTypeLabel: "Recipe"
          }
        ]
      }
    ]
  };

  const activeKey = runtime.renderSkillPanelTimeline({
    documentRef,
    skillName: "cooking",
    referenceViewModel,
    activeUnlockKey: null,
    getUnlockTypeLabel: () => "Recipe",
    buildRecipeDetails: () => ({
      inputs: ["1x Raw Trout"],
      outputs: ["Success: 1x Cooked Trout"],
      meta: ["Burn chance: 10%"]
    }),
    onSelectUnlock(nextUnlockKey) {
      selectedUnlockKey = nextUnlockKey;
    }
  });
  assert(activeKey === null, "timeline renderer should return null when no unlock is selected");
  assert(timelineEl.children.length === 1, "timeline renderer should append tier groups");
  const unlockButton = timelineEl.children[0].children[1].children[0];
  assert(typeof unlockButton.onclick === "function", "timeline renderer should wire unlock selection callbacks");
  unlockButton.onclick();
  assert(selectedUnlockKey === "cooking:trout", "unlock button should publish the selected unlock key");

  const selectedKey = runtime.renderSkillPanelTimeline({
    documentRef,
    skillName: "cooking",
    referenceViewModel,
    activeUnlockKey: "cooking:trout",
    getUnlockTypeLabel: () => "Recipe",
    buildRecipeDetails: () => ({
      inputs: ["1x Raw Trout"],
      outputs: ["Success: 1x Cooked Trout"],
      meta: ["Burn chance: 10%"]
    })
  });
  assert(selectedKey === "cooking:trout", "timeline renderer should preserve valid selected unlock keys");
  const detailText = documentRef.getText(timelineEl);
  assert(detailText.includes("Ingredients") && detailText.includes("1x Raw Trout"), "timeline renderer should render selected recipe ingredients");
  assert(detailText.includes("Results") && detailText.includes("Success: 1x Cooked Trout"), "timeline renderer should render selected recipe outputs");
  assert(detailText.includes("Notes") && detailText.includes("Burn chance: 10%"), "timeline renderer should render selected recipe metadata");

  const invalidKey = runtime.renderSkillPanelTimeline({
    documentRef,
    referenceViewModel,
    activeUnlockKey: "missing"
  });
  assert(invalidKey === null, "timeline renderer should clear stale active unlock keys");

  console.log("Skill panel render runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
