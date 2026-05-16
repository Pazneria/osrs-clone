const assert = require("assert");
const path = require("path");
const vm = require("vm");
const { readRepoFile } = require("./repo-file-test-utils");

function makeContext(overrides = {}) {
  const logs = overrides.logs || { queued: [], markers: [], chats: [] };
  const windowRef = Object.assign({
    SkillRuntime: null,
    TargetInteractionRegistry: null,
    QuestRuntime: null
  }, overrides.windowRef || {});
  const contextOverrides = Object.assign({}, overrides);
  delete contextOverrides.logs;
  delete contextOverrides.windowRef;
  return Object.assign({
    windowRef,
    playerState: { z: 0 },
    logicalMap: [[[1, 2], [3, 4]]],
    groundItems: [],
    tileIds: { TREE: 10, STUMP: 11 },
    inputControllerRuntime: null,
    skillRuntime: windowRef.SkillRuntime,
    targetInteractionRegistry: windowRef.TargetInteractionRegistry,
    addChatMessage: (text, tone) => logs.chats.push({ text, tone }),
    clearSelectedUse: () => { logs.cleared = true; },
    queueAction: (type, x, y, obj, targetUid = null) => logs.queued.push({ type, x, y, obj, targetUid }),
    spawnClickMarker: (point, isAction) => logs.markers.push({ point, isAction }),
    tryUseItemOnWorld: () => false
  }, contextOverrides);
}

function run() {
  const root = path.resolve(__dirname, "..", "..");
  const runtimePath = path.join(root, "src", "js", "input-target-interaction-runtime.js");
  const runtimeSource = readRepoFile(root, "src/js/input-target-interaction-runtime.js");
  const inputSource = readRepoFile(root, "src/js/input-render.js");
  const manifestSource = readRepoFile(root, "src/game/platform/legacy-script-manifest.ts");

  const actionQueueIndex = manifestSource.indexOf('id: "input-action-queue-runtime"');
  const targetInteractionIndex = manifestSource.indexOf('id: "input-target-interaction-runtime"');
  const inputRenderIndex = manifestSource.indexOf('id: "input-render"');

  assert(manifestSource.includes("../../js/input-target-interaction-runtime.js?raw"), "legacy manifest should import the input target interaction runtime raw script");
  assert(actionQueueIndex !== -1 && targetInteractionIndex !== -1 && inputRenderIndex !== -1, "legacy manifest should include input target interaction runtime");
  assert(actionQueueIndex < targetInteractionIndex && targetInteractionIndex < inputRenderIndex, "legacy manifest should load target interaction after action queue and before input-render.js");

  assert(runtimeSource.includes("window.InputTargetInteractionRuntime"), "input target interaction runtime should expose a window runtime");
  assert(runtimeSource.includes("function resolveTargetInteractionOptions"), "input target interaction runtime should own context-menu target option resolution");
  assert(runtimeSource.includes("function isDirectSelectedItemUseTarget"), "input target interaction runtime should own direct selected-item target policy");
  assert(runtimeSource.includes("function formatGroundItemDisplayName"), "input target interaction runtime should own target menu ground item display names");
  assert(runtimeSource.includes("function formatEnemyDisplayName"), "input target interaction runtime should own target menu enemy display names");
  assert(runtimeSource.includes("function buildInteractionTargetData"), "input target interaction runtime should own primary target data shaping");
  assert(runtimeSource.includes("function handlePrimaryInteractionHit"), "input target interaction runtime should own primary click target policy");

  assert(inputSource.includes("function getInputTargetInteractionRuntime()"), "input-render.js should resolve the input target interaction runtime");
  assert(inputSource.includes("buildInputTargetInteractionRuntimeContext"), "input-render.js should provide a narrow target interaction context");
  assert(inputSource.includes("runtime.handlePrimaryInteractionHit(buildInputTargetInteractionRuntimeContext(), hitData"), "input-render.js should delegate primary hit interaction policy");
  assert(!inputSource.includes("SkillRuntime.tryUseItemOnTarget({"), "input-render.js should not directly invoke skill item-use policy");
  assert(!inputSource.includes("window.TargetInteractionRegistry.resolveOptions(hitData"), "input-render.js should not directly call the target interaction registry");
  assert(!inputSource.includes("enemyId: String(hitData.uid || '').trim()"), "input-render.js should not shape enemy target data inline");
  assert(!inputSource.includes("function formatGroundItemDisplayName"), "input-render.js should not own target display-name helpers");
  assert(!inputSource.includes("targetData.action = window.getPreferredMenuAction"), "input-render.js should not own banker primary action preference shaping");

  const sandbox = { window: {}, console, Number, Object, String, Math, Array };
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource, sandbox, { filename: runtimePath });
  const runtime = sandbox.window.InputTargetInteractionRuntime;
  assert(runtime, "input target interaction runtime should execute in isolation");

  {
    const normalized = runtime.normalizeContextMenuOptions({}, [
      { text: "Use", onSelect: () => {} },
      { text: "Broken" },
      null
    ]);
    assert(normalized.length === 1 && normalized[0].text === "Use", "runtime should normalize context menu options");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    const context = makeContext({
      logs,
      groundItems: [
        { uid: "coins-1", x: 4, y: 5, z: 0 },
        { uid: "coins-2", x: 4, y: 5, z: 0 }
      ],
      windowRef: {
        TargetInteractionRegistry: {
          resolveOptions: (hitData, registryContext) => [
            { text: registryContext.formatGroundItemDisplayName(hitData), onSelect: () => registryContext.queueInteract("GROUND_ITEM", hitData.uid) }
          ]
        }
      }
    });
    const options = runtime.resolveTargetInteractionOptions(context, { type: "GROUND_ITEM", uid: "coins-1", name: "Coins", gridX: 4, gridY: 5, point: { x: 4, y: 0, z: 5 } }, null, null, false, null);
    assert(options.length === 1 && options[0].text === "Coins (2)", "runtime should resolve target registry options with owned display names");
    options[0].onSelect();
    assert(logs.queued.length === 1 && logs.queued[0].obj === "GROUND_ITEM", "target registry queue callbacks should route through the runtime context");
    assert(logs.markers.length === 1 && logs.markers[0].isAction, "target registry actions should spawn action markers");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    const context = makeContext({
      logs,
      windowRef: {
        QuestRuntime: { resolveNpcPrimaryAction: () => "Talk-to" },
        getItemMenuPreferenceKey: () => "npc:banker",
        getPreferredMenuAction: () => "Bank"
      }
    });
    runtime.handlePrimaryInteractionHit(context, { type: "NPC", name: "Banker", gridX: 2, gridY: 3, point: { x: 2, y: 0, z: 3 } });
    assert(logs.queued.length === 1 && logs.queued[0].obj === "NPC", "NPC primary clicks should queue an interaction");
    assert(logs.queued[0].targetUid.action === "Bank", "banker primary action preference should be applied by the runtime");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    const context = makeContext({ logs });
    runtime.handlePrimaryInteractionHit(context, { type: "ENEMY", uid: "wolf-1", name: "Wolf", gridX: 7, gridY: 8, point: { x: 7, y: 0, z: 8 } });
    assert(logs.queued[0].targetUid.enemyId === "wolf-1", "enemy primary clicks should shape enemy target metadata");
    assert(logs.queued[0].targetUid.name === "Wolf", "enemy primary target metadata should preserve the display name");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    const context = makeContext({ logs });
    runtime.handlePrimaryInteractionHit(context, { type: "GATE", doorObj: { isWoodenGate: true }, gridX: 5, gridY: 6, point: { x: 5, y: 0, z: 6 } });
    assert(logs.queued[0].obj === "DOOR", "gate primary clicks should route through door interaction handling");
    assert(logs.queued[0].targetUid.isWoodenGate === true, "gate primary clicks should preserve gate door metadata");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    const context = makeContext({ logs });
    runtime.handlePrimaryInteractionHit(context, {
      type: "DECOR_PROP",
      uid: { propId: "tutorial_cabin_tool_rack", kind: "tool_rack", label: "Tool Rack" },
      name: "Tool Rack",
      gridX: 8,
      gridY: 9,
      point: { x: 8, y: 0, z: 9 }
    });
    assert(logs.queued[0].obj === "DECOR_PROP", "decor prop primary clicks should queue a decor interaction");
    assert(logs.queued[0].targetUid.kind === "tool_rack", "decor prop primary target metadata should preserve prop kind");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    const context = makeContext({
      logs,
      skillRuntime: {
        tryUseItemOnTarget: ({ sourceInvIndex, sourceItemId }) => sourceInvIndex === 3 && sourceItemId === "raw_shrimp"
      }
    });
    const result = runtime.handlePrimaryInteractionHit(
      context,
      { type: "FIRE", gridX: 1, gridY: 1, point: { x: 1, y: 0, z: 1 } },
      { selectedItem: { id: "raw_shrimp" }, selectedUseInvIndex: 3 }
    );
    assert(result.used, "selected item primary clicks should try skill target use");
    assert(logs.cleared, "selected item primary clicks should clear the selected use state");
    assert(logs.markers.length === 1 && logs.markers[0].isAction, "successful selected item use should spawn an action marker");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    let skillUseAttempts = 0;
    let worldUseAttempts = 0;
    const context = makeContext({
      logs,
      skillRuntime: {
        tryUseItemOnTarget: () => {
          skillUseAttempts += 1;
          return true;
        }
      },
      tryUseItemOnWorld: () => {
        worldUseAttempts += 1;
        return true;
      }
    });
    const result = runtime.handlePrimaryInteractionHit(
      context,
      { type: "GROUND", gridX: 2, gridY: 2, point: { x: 2, y: 0, z: 2 } },
      { selectedItem: { id: "tinderbox" }, selectedUseInvIndex: 5 }
    );
    assert(result.handled && !result.used, "selected item clicks on plain ground should be handled but not used");
    assert(skillUseAttempts === 0, "plain ground should not be forwarded to skill item-use handlers");
    assert(worldUseAttempts === 0, "plain ground should not be forwarded to world item-use handlers");
    assert(logs.cleared, "plain ground selected-item clicks should clear the selected use state");
    assert(logs.markers.length === 0, "failed selected item use on plain ground should not spawn an action marker");
    assert(logs.queued.length === 0, "failed selected item use on plain ground should not queue a walk or interaction");
  }

  {
    const logs = { queued: [], markers: [], chats: [] };
    const context = makeContext({ logs });
    runtime.handlePrimaryInteractionHit(context, { type: "GROUND", gridX: 9, gridY: 10, point: { x: 9, y: 0, z: 10 }, pierStepDescend: true });
    assert(logs.queued[0].type === "WALK" && logs.queued[0].obj === "PIER_STEP_DESCEND", "ground primary clicks should queue walk actions with pier descent metadata");
    assert(logs.markers[0].isAction === false, "walk clicks should spawn walk markers");
  }

  console.log("Input target interaction runtime guard passed.");
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
