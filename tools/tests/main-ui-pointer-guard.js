const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const cssSource = fs.readFileSync(path.join(root, "src", "styles", "main.css"), "utf8").replace(/\r\n/g, "\n");
  const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const inventorySource = fs.readFileSync(path.join(root, "src", "js", "inventory.js"), "utf8");
  const inputRenderSource = fs.readFileSync(path.join(root, "src", "js", "input-render.js"), "utf8");
  const worldSource = fs.readFileSync(path.join(root, "src", "js", "world.js"), "utf8");

  assert(
    cssSource.includes("#main-ui-container {\n            pointer-events: auto;"),
    "main UI shell should own the visible inventory panel so world hover targets do not leak through gaps"
  );
  assert(
    !cssSource.includes("body * { cursor: default !important; }"),
    "main UI cursor fixes should stay scoped instead of forcing every document descendant"
  );
  assert(
    cssSource.includes("#canvas-container { width: 100%; height: 100%; display: block; cursor: default !important; }") &&
      cssSource.includes("#canvas-container canvas { cursor: default !important; }"),
    "game canvas should explicitly use the normal cursor"
  );
  assert(
    !cssSource.includes("#game-cursor-hit-layer") &&
      !htmlSource.includes("game-cursor-hit-layer") &&
      !worldSource.includes("game-cursor-hit-layer"),
    "main UI pointer fixes should not add a synthetic full-screen cursor hit layer"
  );
  assert(
    htmlSource.includes('id="main-ui-container"') && htmlSource.includes("pointer-events-auto w-64"),
    "main UI markup should keep the visible panel pointer-opaque"
  );
  assert(
    htmlSource.includes('class="pointer-events-none absolute top-4 right-4 z-50 flex flex-col items-end gap-2"') &&
      htmlSource.includes('class="relative z-50 pointer-events-auto"') &&
      htmlSource.includes('class="pointer-events-auto flex items-center gap-2"'),
    "top-right minimap HUD wrapper should not create a rectangular invisible hitbox around visible controls"
  );
  assert(
    htmlSource.indexOf('id="runToggleBtn"') !== -1 &&
      htmlSource.indexOf('id="runToggleBtn"') < htmlSource.indexOf('id="mapToggleBtn"') &&
      htmlSource.indexOf('id="runToggleBtn"') < htmlSource.indexOf('id="main-ui-container"'),
    "run toggle should live in the top-right HUD controls next to the world map button instead of on the inventory panel"
  );
  assert(
    (htmlSource.match(/id="runToggleBtn"/g) || []).length === 1,
    "run toggle should have a single DOM owner"
  );
  assert(
    !htmlSource.includes('id="main-ui-container" data-active-tab="inv" class="absolute bottom-4 right-4 flex flex-col pointer-events-none'),
    "main UI shell should not pass empty inventory-panel gaps through to the game canvas"
  );
  assert(
    cssSource.includes("#main-ui-container * {\n            cursor: default !important;"),
    "main UI descendants should force the normal cursor over inventory and equipment surfaces"
  );
  assert(
    cssSource.includes("#ui-layer button:not(.npc-dialogue-close),") &&
      cssSource.includes("#ui-layer .cursor-pointer,") &&
      cssSource.includes("#ui-layer .cursor-ew-resize {\n            cursor: default !important;"),
    "persistent HUD buttons and utility cursor classes should not show a browser hand cursor"
  );
  assert(
    cssSource.includes("#ui-layer button {\n            pointer-events: auto;"),
    "visible HUD buttons should stay clickable when their layout wrappers pass pointer events through"
  );
  assert(
    cssSource.includes("#main-ui-container button,") &&
      cssSource.includes("#main-ui-container .inventory-slot,") &&
      cssSource.includes("#main-ui-container .equip-slot,") &&
      cssSource.includes("#main-ui-container .skill-tile,"),
    "main UI visible controls should opt back into pointer events after the shell is disabled"
  );
  assert(
    cssSource.includes("cursor: default !important;\n            user-select: none;"),
    "inventory slots should keep the normal cursor even when item interactions are available"
  );
  assert(
    !inventorySource.includes("el.style.cursor = 'pointer';"),
    "equipment slots should not reintroduce a hand cursor with inline styles"
  );
  assert(
    !inventorySource.includes("cursor-pointer"),
    "inventory-owned dynamic panels should use the normal cursor even for clickable slot and skill tiles"
  );
  assert(
    !htmlSource.includes("cursor-ew-resize"),
    "equipment preview should not show a resize cursor in the inventory-side panel"
  );
  assert(
    !inputRenderSource.includes("__cursor-debug-readout") &&
      !inputRenderSource.includes("__cursorDebugLast") &&
      !inputRenderSource.includes("installCursorDebugCaptureListener"),
    "temporary cursor debug readout should not ship in the input runtime"
  );
  assert(
    inventorySource.includes("function setMainUiExpanded(mainContainer, expandButton, expanded)") &&
      inventorySource.includes("mainContainer.style.removeProperty('transform');") &&
      !inventorySource.includes("scale(1)'"),
    "collapsed main UI should remove transform instead of leaving a stale scale(1) hit-test layer"
  );

  console.log("Main UI pointer guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
