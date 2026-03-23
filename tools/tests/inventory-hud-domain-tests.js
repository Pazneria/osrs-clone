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
    stats: overrides.stats || { atk: 0, def: 0, str: 0 },
    combat: overrides.combat || null,
    requiredAttackLevel: overrides.requiredAttackLevel || 0
  };
}

function makeMeleeCombatProfile(overrides = {}) {
  return {
    attackProfile: {
      styleFamily: "melee",
      damageType: "melee",
      range: overrides.range || 1,
      tickCycle: overrides.tickCycle || 5,
      projectile: false,
      ammoUse: false,
      familyTag: overrides.familyTag || "test"
    },
    bonuses: {
      meleeAccuracyBonus: overrides.meleeAccuracyBonus || 0,
      meleeStrengthBonus: overrides.meleeStrengthBonus || 0,
      meleeDefenseBonus: overrides.meleeDefenseBonus || 0,
      rangedDefenseBonus: overrides.rangedDefenseBonus || 0,
      magicDefenseBonus: overrides.magicDefenseBonus || 0
    },
    requiredAttackLevel: overrides.requiredAttackLevel || 1
  };
}

const ITEM_DB = {
  coins: makeItem("coins", { stackable: true, value: 1 }),
  logs: makeItem("logs", { stackable: false, value: 5 }),
  shrimp: makeItem("shrimp", { stackable: false, value: 10 }),
  rune: makeItem("rune", { stackable: true, value: 50 }),
  sword: makeItem("sword", {
    stackable: false,
    value: 100,
    stats: { atk: 4, def: 0, str: 2 },
    combat: makeMeleeCombatProfile({ meleeAccuracyBonus: 4, meleeStrengthBonus: 2, tickCycle: 4, familyTag: "sword" }),
    requiredAttackLevel: 1
  }),
  shield: makeItem("shield", {
    stackable: false,
    value: 90,
    stats: { atk: 0, def: 3, str: 0 },
    combat: makeMeleeCombatProfile({ meleeDefenseBonus: 3, rangedDefenseBonus: 3, magicDefenseBonus: 3, familyTag: "shield" })
  })
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
  const result = inventoryDomain.ensureUnlockedMerchantStock({
    shopInventory: [
      { itemData: ITEM_DB.shrimp, amount: 1, normalStock: true },
      { itemData: ITEM_DB.sword, amount: 2, normalStock: false },
      null
    ],
    merchantId: "conditional_teacher",
    itemDb: ITEM_DB,
    economy: {
      getMerchantDefaultSellItemIds: () => ["sword"],
      getUnlockedStockAmount: () => 1
    }
  });
  assert.strictEqual(result[0], null, "stale normal stock should be removed when the default list changes");
  assert.strictEqual(result[1].itemData.id, "sword", "existing conditional stock should stay in place");
  assert.strictEqual(result[1].normalStock, true, "eligible sold-back stock should be promoted to normal stock");
  assert.strictEqual(result[1].amount, 2, "eligible stock should preserve larger sold-back quantities");
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
    playerSkills: {
      attack: { xp: 0, level: 1 },
      strength: { xp: 0, level: 1 },
      defense: { xp: 0, level: 1 },
      hitpoints: { xp: 0, level: 10 }
    },
    equipment: {
      weapon: ITEM_DB.sword,
      shield: ITEM_DB.shield
    },
    playerState: {
      selectedMeleeStyle: "attack"
    }
  });
  assert.deepStrictEqual(stats, { attack: 5, defense: 4, strength: 1 }, "combat stats should derive from combat bonuses and melee formulas");
}

{
  const combatTab = hudViewModels.buildCombatTabViewModel({
    playerSkills: {
      attack: { xp: 0, level: 20 },
      strength: { xp: 0, level: 16 },
      defense: { xp: 0, level: 12 },
      hitpoints: { xp: 0, level: 18 }
    },
    equipment: {
      weapon: ITEM_DB.sword,
      shield: ITEM_DB.shield
    },
    playerState: {
      selectedMeleeStyle: "strength"
    }
  });

  assert.strictEqual(combatTab.combatLevel, 16, "combat level should average attack, strength, defense, and hitpoints");
  assert.strictEqual(combatTab.combatLevelText, "16", "combat level text should be display-ready");
  assert.strictEqual(combatTab.selectedStyleId, "strength", "combat tab should preserve the active melee style");
  assert.strictEqual(combatTab.selectedStyleDescription, "+10% max hit", "combat tab should surface the active style effect");
  assert.strictEqual(combatTab.styleOptions.find((entry) => entry.styleId === "strength").active, true, "selected style option should be marked active");
  assert.strictEqual(combatTab.attackLevel, 20, "combat tab should expose attack level");
  assert.strictEqual(combatTab.hitpointsLevel, 18, "combat tab should expose hitpoints level");
}

{
  const combatStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 7,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 2,
    inCombat: true,
    target: {
      label: "Goblin",
      focusLabel: "Target",
      currentHealth: 3,
      maxHealth: 7,
      remainingAttackCooldown: 1,
      state: "aggroed",
      distance: 2,
      inMeleeRange: false
    }
  });

  assert.strictEqual(combatStatus.visible, true, "combat status should stay visible while in combat");
  assert.strictEqual(combatStatus.bannerText, "In Combat", "combat banner should reflect active combat");
  assert.strictEqual(combatStatus.playerHitpointsText, "7 / 10", "player hp text should be formatted");
  assert.strictEqual(combatStatus.playerCooldownText, "2 ticks to swing", "player cooldown should use tick text");
  assert.strictEqual(combatStatus.targetName, "Goblin", "target name should surface the focused enemy");
  assert.strictEqual(combatStatus.targetStateText, "Attacking", "enemy state should map into readable HUD text");
  assert.strictEqual(combatStatus.rangeText, "2 tiles away", "range copy should reflect target distance");
}

{
  const readyCombatStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 10,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 0,
    inCombat: true,
    target: {
      label: "Rat",
      focusLabel: "Aggressor",
      currentHealth: 1,
      maxHealth: 4,
      remainingAttackCooldown: 0,
      state: "idle",
      distance: 1,
      inMeleeRange: true
    }
  });

  assert.strictEqual(readyCombatStatus.playerCooldownReady, true, "player cooldown should be marked ready at zero");
  assert.strictEqual(readyCombatStatus.playerCooldownText, "Ready", "ready cooldown text should be compact");
  assert.strictEqual(readyCombatStatus.targetCooldownText, "Ready", "target cooldown text should be compact");
  assert.strictEqual(readyCombatStatus.targetFocusLabel, "Aggressor", "focus label should preserve aggressor fallback");
  assert.strictEqual(readyCombatStatus.rangeText, "In melee range", "melee range text should be explicit");
}

{
  const preEngagementStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 10,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 0,
    inCombat: false,
    target: {
      label: "Goblin",
      focusLabel: "Target",
      currentHealth: 7,
      maxHealth: 7,
      remainingAttackCooldown: 0,
      state: "idle",
      distance: 4,
      inMeleeRange: false
    }
  });

  assert.strictEqual(preEngagementStatus.visible, false, "combat HUD should stay hidden while only tracking a distant target");
  assert.strictEqual(preEngagementStatus.targetVisible, false, "target details should stay hidden before engagement starts");
}

{
  const staleCooldownStatus = hudViewModels.buildCombatStatusViewModel({
    playerCurrentHitpoints: 10,
    playerMaxHitpoints: 10,
    playerRemainingAttackCooldown: 3,
    inCombat: false,
    target: null
  });

  assert.strictEqual(staleCooldownStatus.visible, false, "combat HUD should stay hidden when not in combat even if a cooldown value exists");
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
    playerSkills: { mining: { xp: 550, level: 5 } },
    skillMeta: { displayName: "Mining", icon: "MIN" },
    getXpForLevel: (level) => level * 100,
    maxSkillLevel: 99
  });
  assert.strictEqual(progress.name, "Mining");
  assert.strictEqual(progress.level, 5);
  assert.strictEqual(progress.remainingText, "50 XP remaining");
  assert.strictEqual(progress.nextText, "600 XP");
  assert.strictEqual(progress.progressPercentText, "50.0% to next level");
}

{
  const maxed = hudViewModels.buildSkillProgressViewModel({
    skillId: "mining",
    playerSkills: { mining: { xp: 13_034_431, level: 99 } },
    skillMeta: { displayName: "Mining", icon: "MIN" },
    getXpForLevel: (level) => level * 100,
    maxSkillLevel: 99
  });
  assert.strictEqual(maxed.name, "Mining");
  assert.strictEqual(maxed.level, 99);
  assert.strictEqual(maxed.remainingText, "Maxed");
  assert.strictEqual(maxed.nextText, "Maxed");
  assert.strictEqual(maxed.progressPercentText, "100.0% to next level");
  assert.strictEqual(maxed.progressWidth, "100.0%");
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
