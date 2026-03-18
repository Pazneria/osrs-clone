const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", relPath), "utf8");
}

function extractBlock(source, startToken) {
  const start = source.indexOf(startToken);
  if (start === -1) {
    throw new Error(`Failed to find block start: ${startToken}`);
  }

  const openBrace = source.indexOf("{", start);
  if (openBrace === -1) {
    throw new Error(`Failed to find opening brace for: ${startToken}`);
  }

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = openBrace; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    const prev = source[i - 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (inSingle) {
      if (ch === "'" && prev !== "\\") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === "\"" && prev !== "\\") inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (ch === "`" && prev !== "\\") {
        inTemplate = false;
        continue;
      }
      if (ch !== "$" || next !== "{") continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === "\"") {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inTemplate = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  throw new Error(`Failed to close block for: ${startToken}`);
}

function extractFunction(source, name) {
  return extractBlock(source, `function ${name}(`);
}

function extractEquipBranchBody(source) {
  const branch = extractBlock(source, "if (actionName === 'Equip') {");
  const firstBrace = branch.indexOf("{");
  const lastBrace = branch.lastIndexOf("}");
  return branch.slice(firstBrace + 1, lastBrace);
}

const inventorySource = read("src/js/inventory.js");
assert.ok(
  inventorySource.includes("const requiredDefenseLevel = Number.isFinite(item.requiredDefenseLevel)"),
  "inventory tooltip builder should read requiredDefenseLevel"
);
assert.ok(
  inventorySource.includes("requirementLines.push({ label: 'Defense req.', value: String(requiredDefenseLevel) });"),
  "inventory tooltip builder should surface a Defense req. row"
);

const worldSource = read("src/js/world.js");
const equipBranchBody = extractEquipBranchBody(worldSource);
const equipSandbox = {};
vm.runInNewContext(
  `
  function runEquipAction(ctx) {
    const {
      item,
      equipment,
      inventory,
      invIndex,
      playerSkills,
      addChatMessage,
      clearSelectedUse,
      updateStats,
      renderInventory,
      renderEquipment,
      updatePlayerModel
    } = ctx;
    const actionName = 'Equip';
    ${equipBranchBody}
    return { equipment, inventory };
  }
  globalThis.runEquipAction = runEquipAction;
  `,
  equipSandbox,
  { filename: "world-equip-extract.js" }
);
const runEquipAction = equipSandbox.runEquipAction;

function makeEquipContext(overrides = {}) {
  const chat = [];
  const hooks = {
    clearSelectedUse: 0,
    updateStats: 0,
    renderInventory: 0,
    renderEquipment: 0,
    updatePlayerModel: 0
  };

  const ctx = {
    item: {
      id: "rune_shield",
      name: "Rune Shield",
      type: "shield",
      requiredDefenseLevel: 40
    },
    equipment: { shield: overrides.oldShield || null, weapon: null },
    inventory: [{ itemData: { id: "rune_shield" }, amount: 1 }],
    invIndex: 0,
    playerSkills: {
      attack: { level: 99 },
      fishing: { level: 99 },
      defense: { level: overrides.defenseLevel == null ? 1 : overrides.defenseLevel }
    },
    addChatMessage: (message, tone) => chat.push({ message, tone }),
    clearSelectedUse: () => {
      hooks.clearSelectedUse += 1;
    },
    updateStats: () => {
      hooks.updateStats += 1;
    },
    renderInventory: () => {
      hooks.renderInventory += 1;
    },
    renderEquipment: () => {
      hooks.renderEquipment += 1;
    },
    updatePlayerModel: () => {
      hooks.updatePlayerModel += 1;
    }
  };

  return { ctx, chat, hooks };
}

{
  const { ctx, chat, hooks } = makeEquipContext({ defenseLevel: 30 });
  runEquipAction(ctx);

  assert.deepStrictEqual(
    chat,
    [{ message: "You need Defense level 40 to equip the Rune Shield.", tone: "warn" }],
    "equip should block and warn when defense level is too low"
  );
  assert.strictEqual(ctx.equipment.shield, null, "failed equip should not modify equipment");
  assert.ok(ctx.inventory[0] && ctx.inventory[0].itemData.id === "rune_shield", "failed equip should leave the inventory item in place");
  assert.deepStrictEqual(
    hooks,
    {
      clearSelectedUse: 0,
      updateStats: 0,
      renderInventory: 0,
      renderEquipment: 0,
      updatePlayerModel: 0
    },
    "failed equip should not trigger follow-up UI updates"
  );
}

{
  const oldShield = { id: "bronze_shield", name: "Bronze Shield", type: "shield" };
  const { ctx, chat, hooks } = makeEquipContext({ defenseLevel: 40, oldShield });
  runEquipAction(ctx);

  assert.deepStrictEqual(chat, [], "successful equip should not emit a warning");
  assert.strictEqual(ctx.equipment.shield.id, "rune_shield", "successful equip should place the new shield in the equipment slot");
  assert.strictEqual(ctx.inventory[0].itemData.id, "bronze_shield", "successful equip should swap the old shield into inventory");
  assert.deepStrictEqual(
    hooks,
    {
      clearSelectedUse: 1,
      updateStats: 1,
      renderInventory: 1,
      renderEquipment: 1,
      updatePlayerModel: 1
    },
    "successful equip should trigger the standard UI refresh path"
  );
}

console.log("Combat defense equip guard passed.");
