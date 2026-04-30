const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeTooltip() {
  return {
    innerHTML: "",
    offsetWidth: 80,
    offsetHeight: 20,
    style: {},
    classList: {
      values: new Set(["hidden"]),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      contains(value) { return this.values.has(value); }
    }
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-hover-tooltip-runtime.js");
  const runtimeSource = fs.readFileSync(runtimePath, "utf8");
  const inputSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const manifestSource = fs.readFileSync(path.join(root, "src", "game", "platform", "legacy-script-manifest.ts"), "utf8");

  assert(runtimeSource.includes("window.InputHoverTooltipRuntime"), "hover tooltip runtime should expose a window runtime");
  assert(runtimeSource.includes("function formatHoverTooltipActionText"), "hover tooltip runtime should own action text formatting");
  assert(runtimeSource.includes("function positionHoverTooltip"), "hover tooltip runtime should own DOM positioning");
  assert(inputSource.includes("InputHoverTooltipRuntime"), "input-render.js should delegate hover tooltip display");
  assert(!inputSource.includes("tooltip.innerHTML = actionText"), "input-render.js should not own hover tooltip DOM writes");
  assert(
    manifestSource.indexOf('id: "input-hover-tooltip-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy manifest should load hover tooltip runtime before input-render.js"
  );

  const sandbox = { window: {}, document: null, Math, Number, console };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputHoverTooltipRuntime;
  assert(runtime, "hover tooltip runtime should evaluate in isolation");

  const enemyText = runtime.formatHoverTooltipActionText({
    hitData: { type: "ENEMY", name: "Rat", combatLevel: 2 },
    formatEnemyTooltipDisplayName: () => "Rat (Level 2)"
  });
  assert(enemyText.includes("Attack") && enemyText.includes("Rat (Level 2)"), "enemy tooltip should include computed combat level");

  const fireText = runtime.formatHoverTooltipActionText({
    hitData: { type: "GROUND_ITEM", name: "Ashes" },
    isAshesGroundItem: true,
    fireUnderCursor: true
  });
  assert(fireText.includes("Fire"), "ashes over active fire should resolve to fire use tooltip");

  const npcText = runtime.formatHoverTooltipActionText({
    hitData: { type: "NPC", name: "Banker", uid: { name: "Banker" } },
    getItemMenuPreferenceKey: () => "npc:banker",
    getPreferredMenuAction: () => "Bank"
  });
  assert(npcText.includes("Bank") && npcText.includes("Banker"), "NPC tooltip should respect preferred banker action");

  const tooltip = makeTooltip();
  const documentRef = { getElementById: () => tooltip };
  const displayed = runtime.updateHoverTooltipDisplay({
    documentRef,
    windowRef: { innerWidth: 160, innerHeight: 100 },
    currentMouseX: 140,
    currentMouseY: 90,
    hitData: { type: "GROUND_ITEM", name: "Coins" },
    isWithinWalkDistance: true,
    groundDisplayName: "Coins (3)"
  });
  assert(displayed.includes("Coins (3)"), "hover tooltip display should render formatted item stack name");
  assert(!tooltip.classList.contains("hidden"), "hover tooltip display should show populated tooltip");
  assert(tooltip.style.left === "46px", "hover tooltip should flip left near the viewport edge");

  runtime.updateHoverTooltipDisplay({
    documentRef,
    shouldHide: true,
    hitData: { type: "GROUND_ITEM", name: "Coins" },
    isWithinWalkDistance: true
  });
  assert(tooltip.classList.contains("hidden"), "hover tooltip should hide when shell asks it to hide");

  console.log("Input hover tooltip runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
