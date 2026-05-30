const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { makeClassList } = require("./dom-test-utils");
const { readRepoFile } = require("./repo-file-test-utils");

function makeTooltip() {
  return {
    innerHTML: "",
    offsetWidth: 80,
    offsetHeight: 20,
    style: {},
    classList: makeClassList(["hidden"])
  };
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-hover-tooltip-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/input-hover-tooltip-runtime.js");
  const inputSource = readRepoFile(root, "src/js/input-render.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");

  assert(runtimeSource.includes("window.InputHoverTooltipRuntime"), "hover tooltip runtime should expose a window runtime");
  assert(runtimeSource.includes("function formatHoverTooltipActionText"), "hover tooltip runtime should own action text formatting");
  assert(runtimeSource.includes("function buildHoverTooltipDisplayOptions"), "hover tooltip runtime should own hover display option shaping");
  assert(runtimeSource.includes("function isFireUnderCursor"), "hover tooltip runtime should own active-fire hover detection");
  assert(runtimeSource.includes("function formatGroundItemDisplayName"), "hover tooltip runtime should own ground item hover display names");
  assert(runtimeSource.includes("function formatEnemyTooltipDisplayName"), "hover tooltip runtime should own enemy hover display names");
  assert(runtimeSource.includes("function positionHoverTooltip"), "hover tooltip runtime should own DOM positioning");
  assert(inputSource.includes("InputHoverTooltipRuntime"), "input-render.js should delegate hover tooltip display");
  assert(inputSource.includes("buildInputHoverTooltipRuntimeContext"), "input-render.js should provide a narrow hover tooltip runtime context");
  assert(inputSource.includes("const MAX_TOOLTIP_WALK_DISTANCE_TILES = 16;"), "input-render.js should use the documented 16-tile hover tooltip walking gate");
  assert(!inputSource.includes("tooltip.innerHTML = actionText"), "input-render.js should not own hover tooltip DOM writes");
  assert(!inputSource.includes("function resolveTooltipTargetTile"), "input-render.js should not own hover target tile resolution");
  assert(!inputSource.includes("function formatEnemyTooltipDisplayName"), "input-render.js should not own enemy hover display names");
  assert(!inputSource.includes("const fireUnderCursor ="), "input-render.js should not own active-fire hover detection");
  assert(
    manifestSource.indexOf('id: "input-hover-tooltip-runtime"') < manifestSource.indexOf('id: "input-render"'),
    "legacy manifest should load hover tooltip runtime before input-render.js"
  );

  const sandbox = { window: {}, document: null, Math, Number, console };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputHoverTooltipRuntime;
  assert(runtime, "hover tooltip runtime should evaluate in isolation");

  const builtOptions = runtime.buildHoverTooltipDisplayOptions({
    playerState: { x: 5, y: 5, z: 0 },
    logicalMap: [[[10]]],
    tileIds: { TREE: 10 },
    activeFires: [{ x: 8, y: 8, z: 0 }],
    groundItems: [
      { x: 8, y: 8, z: 0 },
      { x: 8, y: 8, z: 0 }
    ],
    maxTooltipWalkDistanceTiles: 10,
    getSelectedUseItem: () => ({ itemData: { id: "raw_shrimp", name: "Raw shrimp", cookResultId: "shrimp", burnResultId: "burnt_shrimp" } }),
    getSkillTooltip: () => "",
    findNearestFishableWaterEdgeTile: () => ({ x: 6, y: 5 })
  }, {
    hitData: { type: "GROUND_ITEM", name: "Ashes", gridX: 8, gridY: 8, point: { x: 8.2, z: 8.2 } },
    currentMouseX: 40,
    currentMouseY: 50
  });
  assert(builtOptions.selectedCookable, "hover option shaping should detect selected cookable items");
  assert(builtOptions.fireUnderCursor, "hover option shaping should detect active fires under the cursor");
  assert(builtOptions.isAshesGroundItem, "hover option shaping should identify ashes ground items");
  assert(builtOptions.groundDisplayName === "Ashes (2)", "hover option shaping should count ground item stacks");
  assert(
    runtime.isHitWithinTooltipWalkDistance(
      { playerState: { x: 5, y: 5 }, maxTooltipWalkDistanceTiles: 16 },
      { type: "ROCK", gridX: 21, gridY: 5 }
    ),
    "hover tooltip walk gate should include targets exactly 16 tiles away"
  );
  assert(
    !runtime.isHitWithinTooltipWalkDistance(
      { playerState: { x: 5, y: 5 }, maxTooltipWalkDistanceTiles: 16 },
      { type: "ROCK", gridX: 22, gridY: 5 }
    ),
    "hover tooltip walk gate should suppress targets beyond 16 tiles"
  );
  assert(
    !runtime.isHitWithinTooltipWalkDistance(
      { playerState: { x: 5, y: 5 } },
      { type: "ROCK", gridX: 22, gridY: 5 }
    ),
    "hover tooltip runtime fallback should also use the 16-tile gate"
  );
  const farBuiltOptions = runtime.buildHoverTooltipDisplayOptions({
    playerState: { x: 5, y: 5 },
    getSkillTooltip: () => ""
  }, {
    hitData: { type: "ROCK", gridX: 22, gridY: 5 }
  });
  assert(
    farBuiltOptions.isWithinWalkDistance === false,
    "hover tooltip display option shaping should apply the 16-tile fallback gate"
  );
  assert(
    runtime.isHitWithinTooltipWalkDistance(
      {
        playerState: { x: 5, y: 5 },
        maxTooltipWalkDistanceTiles: 16,
        findNearestFishableWaterEdgeTile: () => ({ x: 21, y: 5 })
      },
      { type: "WATER", gridX: 90, gridY: 90 }
    ),
    "water hover distance should measure against the nearest fishable edge tile"
  );

  const enemyText = runtime.formatHoverTooltipActionText({
    hitData: { type: "ENEMY", name: "Rat", combatLevel: 2 },
    formatEnemyTooltipDisplayName: runtime.formatEnemyTooltipDisplayName
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

  const gateText = runtime.formatHoverTooltipActionText({
    hitData: { type: "GATE", doorObj: { isOpen: false, isWoodenGate: true } }
  });
  assert(gateText.includes("Open") && gateText.includes("Gate"), "wooden gate tooltip should name a gate instead of a generic door");

  const propText = runtime.formatHoverTooltipActionText({
    hitData: { type: "DECOR_PROP", name: "Tool Rack" }
  });
  assert(propText.includes("Search") && propText.includes("Tool Rack"), "decor prop tooltip should expose searchable station props");

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
    hitData: { type: "GROUND_ITEM", name: "Coins" },
    isWithinWalkDistance: false
  });
  assert(tooltip.classList.contains("hidden"), "hover tooltip should hide populated tooltips when the target is beyond walking distance");

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
