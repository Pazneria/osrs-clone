const assert = require("assert");
const path = require("path");

const { loadTsModule } = require("./ts-module-loader");

const inventoryDomain = loadTsModule(path.resolve(__dirname, "../../src/game/ui/inventory-domain.ts"));
const hudViewModels = loadTsModule(path.resolve(__dirname, "../../src/game/ui/hud-view-models.ts"));

function makeItem(id, overrides = {}) {
  return {
    id,
    name: overrides.name || id,
    icon: overrides.icon || id.toUpperCase(),
    stackable: !!overrides.stackable,
    value: overrides.value || 0,
    stats: overrides.stats || { atk: 0, def: 0, str: 0 }
  };
}

const ITEM_DB = {
  coins: makeItem("coins", { stackable: true, value: 1 }),
  logs: makeItem("logs", { stackable: false, value: 5 }),
  shrimp: makeItem("shrimp", { stackable: false, value: 10 }),
  rune: makeItem("rune", { stackable: true, value: 50 }),
  sword: makeItem("sword", { stackable: false, value: 100, stats: { atk: 4, def: 0, str: 2 } }),
  shield: makeItem("shield", { stackable: false, value: 90, stats: { atk: 0, def: 3, str: 0 } })
};

{
  const result = inventoryDomain.depositInventoryItem({
    inventory: [{ itemData: ITEM_DB.coins, amount: 75 }, null],
    bankItems: [null, null],
    invIndex: 0,
    amount: -1,
    targetBankIndex: -1
  });
  assert.strictEqual(result.amountChanged, 75, "deposit should move the full stack");
  assert.strictEqual(result.inventory[0], null, "deposit should clear the inventory slot");
  assert.strictEqual(result.bankItems[0].amount, 75, "deposit should seed the bank slot");
}

{
  const result = inventoryDomain.withdrawBankItem({
    inventory: [null, null],
    bankItems: [{ itemData: ITEM_DB.logs, amount: 2 }, null],
    bankIndex: 0,
    amount: 2,
    targetInvIndex: -1
  });
  assert.strictEqual(result.amountChanged, 2, "withdraw should move both non-stackable items");
  assert.strictEqual(result.inventory[0].itemData.id, "logs");
  assert.strictEqual(result.inventory[1].itemData.id, "logs");
  assert.strictEqual(result.bankItems[0], null, "withdraw should empty the bank slot");
}

{
  const result = inventoryDomain.createShopInventoryForMerchant({
    merchantId: "general_store",
    inventorySize: 5,
    itemDb: ITEM_DB,
    economy: {
      getMerchantSeedStockRows: () => [{ itemId: "shrimp", stockAmount: 20 }]
    }
  });
  assert.strictEqual(result.inventory[0].itemData.id, "shrimp", "shop seed stock should populate inventory");
  assert.strictEqual(result.inventory[0].amount, 20, "shop seed stock should preserve amount");
}

{
  const result = inventoryDomain.buyShopItem({
    inventory: [{ itemData: ITEM_DB.coins, amount: 100 }, null, null, null],
    shopInventory: [{ itemData: ITEM_DB.shrimp, amount: 5, normalStock: true }, null],
    shopIndex: 0,
    amount: 3,
    merchantId: "fish_shop",
    itemDb: ITEM_DB,
    economy: {
      resolveBuyPrice: () => 10
    }
  });
  assert.strictEqual(result.amountChanged, 3, "buy should grant the requested amount when affordable");
  assert.strictEqual(result.coinAmountChanged, 30, "buy should charge exact total cost");
  assert.strictEqual(result.inventory[0].amount, 70, "buy should reduce player coins");
  assert.strictEqual(result.shopInventory[0].amount, 2, "buy should reduce shop stock");
}

{
  const unlockedPurchases = [];
  const result = inventoryDomain.sellInventoryItem({
    inventory: [{ itemData: ITEM_DB.sword, amount: 1 }, null, null],
    shopInventory: [null, null, null],
    inventoryIndex: 0,
    amount: 1,
    merchantId: "weapon_shop",
    itemDb: ITEM_DB,
    economy: {
      resolveSellPrice: () => 40,
      canMerchantBuyItem: () => true,
      canMerchantSellItem: () => true,
      recordMerchantPurchaseFromPlayer: (itemId, merchantId, amount) => {
        unlockedPurchases.push({ itemId, merchantId, amount });
        return { unlockedNow: true };
      },
      getMerchantDefaultSellItemIds: () => ["sword"],
      getUnlockedStockAmount: () => 3
    }
  });
  assert.strictEqual(result.amountChanged, 1, "sell should remove one item");
  assert.strictEqual(result.inventory[0].itemData.id, "coins", "sell should add coins back to inventory");
  assert.strictEqual(result.inventory[0].amount, 40, "sell should grant correct coin amount");
  assert.ok(result.shopInventory.some((slot) => slot && slot.itemData.id === "sword"), "sell should seed merchant stock");
  assert.strictEqual(result.unlockedNow, true, "sell should surface unlock state");
  assert.deepStrictEqual(unlockedPurchases[0], { itemId: "sword", merchantId: "weapon_shop", amount: 1 });
}

{
  const stats = hudViewModels.buildCombatStatsViewModel({
    baseStats: { atk: 1, def: 1, str: 1 },
    equipment: {
      weapon: ITEM_DB.sword,
      shield: ITEM_DB.shield
    }
  });
  assert.deepStrictEqual(stats, { attack: 5, defense: 4, strength: 3 }, "combat stats should include equipment bonuses");
}

{
  const tiles = hudViewModels.buildSkillTileViewModels({
    definitions: [
      { skillId: "mining", displayName: "Mining", icon: "MIN", levelKey: "min" },
      { skillId: "fishing", displayName: "Fishing", icon: "FIS", levelKey: "fish" }
    ],
    playerSkills: {
      mining: { xp: 200, level: 5 },
      fishing: { xp: 0, level: 1 }
    }
  });
  assert.strictEqual(tiles[0].level, 5, "skill tile view models should expose level");
  assert.strictEqual(tiles[1].displayName, "Fishing", "skill tile view models should keep labels");
}

{
  const progress = hudViewModels.buildSkillProgressViewModel({
    skillId: "mining",
    playerSkills: { mining: { xp: 150, level: 5 } },
    skillMeta: { displayName: "Mining", icon: "MIN" },
    getXpForLevel: (level) => level * 100,
    maxSkillLevel: 99
  });
  assert.strictEqual(progress.name, "Mining");
  assert.strictEqual(progress.level, 5);
  assert.strictEqual(progress.nextText, "600 XP");
}

{
  const profile = hudViewModels.buildPlayerProfileSummaryViewModel({
    profile: {
      name: "Ava",
      creationCompleted: true,
      createdAt: 1000,
      lastStartedAt: 2000
    },
    playerEntryFlow: {
      hasLoadedSave: true,
      saveWasLegacyProfile: false,
      loadReason: "",
      savedAt: 3000
    },
    playerAppearance: { gender: 1 },
    formatTimestamp: (timestamp) => `T${timestamp}`
  });
  assert.strictEqual(profile.titleText, "Continue Your Adventure");
  assert.strictEqual(profile.bodyTypeLabel, "Female");
  assert.strictEqual(profile.statusText, "Last save: T3000");
}

console.log("Inventory/HUD domain tests passed.");
