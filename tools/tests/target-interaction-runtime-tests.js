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

console.log("Target interaction runtime tests passed.");
