const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function loadRegistry(questRuntime) {
  const sandbox = {
    console,
    window: {
      QuestRuntime: questRuntime || null
    }
  };

  vm.runInNewContext(read("src/js/interactions/target-interaction-registry.js"), sandbox, {
    filename: "target-interaction-registry.js"
  });

  return sandbox.window.TargetInteractionRegistry;
}

function createNpcContext(queueLog) {
  return {
    queueInteract: (type, target) => {
      queueLog.push({ type, target });
    },
    examineNpc: () => {}
  };
}

{
  const registry = loadRegistry({
    resolveNpcPrimaryAction: () => "Talk-to",
    canOpenMerchantShop: () => ({ ok: true })
  });
  const queueLog = [];
  const npcUid = {
    name: "Fishing Teacher",
    merchantId: "fishing_teacher",
    action: "Trade"
  };

  const options = registry.resolveOptions(
    {
      type: "NPC",
      name: "Fishing Teacher",
      uid: npcUid,
      gridX: 12,
      gridY: 8
    },
    createNpcContext(queueLog)
  );

  assert.strictEqual(options.length, 3, "dialogue-first merchants with shop access should expose talk, trade, and examine");
  assert.strictEqual(options[0].text, 'Talk-to <span class="text-yellow-400">Fishing Teacher</span>');
  assert.ok(
    options.some((option) => option.text === 'Trade <span class="text-yellow-400">Fishing Teacher</span>'),
    "dialogue-first merchants with shop access should still expose trade"
  );
  options[0].onSelect();
  const tradeOption = options.find((option) => option.text === 'Trade <span class="text-yellow-400">Fishing Teacher</span>');
  assert.ok(tradeOption, "trade option should be present for an unlocked dialogue-first merchant");
  tradeOption.onSelect();
  assert.strictEqual(queueLog.length, 2, "talk and trade should each enqueue an interaction");
  assert.strictEqual(queueLog[0].type, "NPC");
  assert.strictEqual(queueLog[0].target.name, "Fishing Teacher");
  assert.strictEqual(queueLog[0].target.merchantId, "fishing_teacher");
  assert.strictEqual(queueLog[0].target.action, "Talk-to");
  assert.strictEqual(queueLog[1].type, "NPC");
  assert.strictEqual(queueLog[1].target.name, "Fishing Teacher");
  assert.strictEqual(queueLog[1].target.merchantId, "fishing_teacher");
  assert.strictEqual(queueLog[1].target.action, "Trade");
}

{
  const registry = loadRegistry({
    resolveNpcPrimaryAction: () => "Talk-to",
    canOpenMerchantShop: () => ({ ok: false })
  });

  const options = registry.resolveOptions(
    {
      type: "NPC",
      name: "Fishing Teacher",
      uid: {
        name: "Fishing Teacher",
        merchantId: "fishing_teacher",
        action: "Trade"
      },
      gridX: 12,
      gridY: 8
    },
    createNpcContext([])
  );

  assert.strictEqual(options.length, 2, "locked dialogue-first merchants should not expose trade");
  assert.strictEqual(options[0].text, 'Talk-to <span class="text-yellow-400">Fishing Teacher</span>');
}

{
  const registry = loadRegistry();
  const queueLog = [];
  const examineLog = [];
  const options = registry.resolveOptions(
    {
      type: "GATE",
      gridX: 3,
      gridY: 4,
      doorObj: { isOpen: false, isWoodenGate: true }
    },
    {
      queueInteract: (type, target) => queueLog.push({ type, target }),
      examineTarget: (type, fallback) => examineLog.push({ type, fallback })
    }
  );
  assert.ok(options.some((option) => option.text === 'Open <span class="text-white">Gate</span>'), "wooden gates should expose a gate action label");
  const openOption = options.find((option) => option.text === 'Open <span class="text-white">Gate</span>');
  openOption.onSelect();
  assert.strictEqual(queueLog[0].type, "DOOR", "wooden gate actions should still route through door interaction handling");
  const examineOption = options.find((option) => option.text === 'Examine <span class="text-white">Gate</span>');
  assert.ok(examineOption, "wooden gates should expose a gate examine label");
  examineOption.onSelect();
  assert.strictEqual(examineLog[0].type, "GATE", "wooden gate examine should use the gate target text");
}

{
  const registry = loadRegistry();
  const queueLog = [];
  const examineLog = [];
  const options = registry.resolveOptions(
    {
      type: "DECOR_PROP",
      gridX: 8,
      gridY: 9,
      name: "Tool Rack",
      uid: { propId: "tutorial_cabin_tool_rack", kind: "tool_rack", label: "Tool Rack" }
    },
    {
      queueInteract: (type, target) => queueLog.push({ type, target }),
      examineTarget: (type, fallback, options) => examineLog.push({ type, fallback, options })
    }
  );
  assert.ok(options.some((option) => option.text === 'Search <span class="text-white">Tool Rack</span>'), "decor props should expose a search action");
  const searchOption = options.find((option) => option.text === 'Search <span class="text-white">Tool Rack</span>');
  searchOption.onSelect();
  assert.strictEqual(queueLog[0].type, "DECOR_PROP", "decor prop search should enqueue a decor interaction");
  assert.strictEqual(queueLog[0].target.kind, "tool_rack", "decor prop search should preserve prop kind");
  const examineOption = options.find((option) => option.text === 'Examine <span class="text-white">Tool Rack</span>');
  assert.ok(examineOption, "decor props should expose examine");
  examineOption.onSelect();
  assert.strictEqual(examineLog[0].type, "DECOR_PROP", "decor prop examine should use decor prop target text");
  assert.strictEqual(examineLog[0].options.label, "Tool Rack", "decor prop examine should preserve prop label");
}

console.log("Target interaction runtime tests passed.");
